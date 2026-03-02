/**
 * Dify Proxy Routes
 * Proxies Angular requests → Dify APIs, keeping API keys server-side
 *
 * Contract enforcement (ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md §6 & §10):
 *   - Chatflow responses: parse @@NPA_META@@{json} from answer text
 *   - Workflow responses: extract outputs.agent_action, outputs.payload, outputs.trace
 *   - Fallback: SHOW_RAW_RESPONSE when envelope missing
 *   - Errors: SHOW_ERROR envelope on Dify API failures
 *
 * Endpoints:
 *   POST /api/dify/chat           → Dify Chat API (Chatflow agents)
 *   POST /api/dify/workflow        → Dify Workflow Run API (Workflow agents)
 *   GET  /api/dify/conversations/:id → Dify conversation history
 *   GET  /api/dify/agents/status   → Aggregate agent health
 */

const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { DIFY_BASE_URL, getAgent, getAllAgents } = require('../config/dify-agents');
const path = require('path');
const AGENT_REGISTRY = require(path.resolve(__dirname, '..', '..', 'shared', 'agent-registry.json'));

// ─── Canonical Services (extracted from this file — SINGLE SOURCE OF TRUTH) ──
const { parseEnvelope, makeError, extractWorkflowMeta } = require('../services/envelope-parser');
const { collectChatSSEStream, collectWorkflowSSEStream } = require('../services/sse-collector');
const CHATFLOW_DEFAULT_INPUTS = require('../config/chatflow-defaults.json');

// ─── Context Engine Bridge (Sprint 4) ────────────────────────────────────────
const { assembleContextForAgent, ENABLED: CONTEXT_ENGINE_ENABLED } = require('../services/context-bridge');
const { recordTrace } = require('./context-admin');

const router = express.Router();

function getDifyUser(req, bodyUser) {
    // Prefer authenticated user for isolation/auditability.
    if (req.user?.userId) return String(req.user.userId);
    // Back-compat for non-auth demo flows.
    if (bodyUser && String(bodyUser).trim()) return String(bodyUser).trim();
    // Last resort: keep per-client isolation without collapsing everyone into one "default-user".
    return `anon:${req.ip || 'unknown'}`;
}

// ─── Dify App Alias Resolution ───────────────────────────────────────────────

function buildDifyAppAliases() {
    const aliases = {};
    const priority = {};

    // Multiple internal agent IDs can point to the same Dify app (e.g. DILIGENCE + KB_SEARCH).
    // Prefer the higher-priority agent (lower tier number). If tied, keep the first seen.
    const setAlias = (key, id, tier) => {
        if (!key) return;
        const existingTier = priority[key];
        if (existingTier === undefined || tier < existingTier) {
            aliases[key] = id;
            priority[key] = tier;
        }
    };

    for (const agent of AGENT_REGISTRY) {
        if (!agent?.id) continue;
        const id = String(agent.id);
        const tier = typeof agent.tier === 'number' ? agent.tier : 99;
        const difyApp = agent.difyApp ? String(agent.difyApp) : null;
        if (difyApp) setAlias(difyApp, id, tier);
        if (Array.isArray(agent.aliases)) {
            for (const a of agent.aliases) {
                if (a) setAlias(String(a), id, tier);
            }
        }
    }
    return aliases;
}

const DIFY_APP_ALIASES = buildDifyAppAliases();

// ─── SSE Stream Collector (imported from services/sse-collector.js) ──────────
// NOTE: parseEnvelope, makeError, extractWorkflowMeta imported from services/envelope-parser.js
// NOTE: collectChatSSEStream, collectWorkflowSSEStream imported from services/sse-collector.js
// NOTE: CHATFLOW_DEFAULT_INPUTS imported from config/chatflow-defaults.json

// ─── Helper: Read stream error body ──────────────────────────────────────────

/**
 * When axios uses responseType:'stream' and Dify returns an HTTP error,
 * err.response.data is a readable stream, not parsed JSON.
 * This helper reads it into a string/object for proper error logging.
 */
async function readStreamError(err) {
    if (!err.response?.data) return err.message;
    // If it's already a string or object, return directly
    if (typeof err.response.data === 'string') return err.response.data;
    if (typeof err.response.data === 'object' && !err.response.data.on) return err.response.data;

    // It's a stream — read it
    return new Promise((resolve) => {
        let body = '';
        err.response.data.on('data', (chunk) => { body += chunk.toString(); });
        err.response.data.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { resolve(body); }
        });
        err.response.data.on('error', () => resolve(err.message));
        // Timeout after 3s to avoid hanging
        setTimeout(() => resolve(body || err.message), 3000);
    });
}

// ─── Blocking Chat Helpers ───────────────────────────────────────────────────

/**
 * Execute a blocking chat request by using Dify's native JSON "blocking" mode.
 * This avoids brittle end-to-end SSE piping/collection issues in some environments.
 *
 * Returns { fullAnswer, convId, msgId }.
 */
async function collectBlockingChat(agent, difyPayload, agentId, signal) {
    const shouldFallbackToStreamingCollect = (status, bodyText) => {
        if (Number(status) !== 400) return false;
        const body = String(bodyText || '');
        if (body.includes('Agent Chat App does not support blocking mode')) return true;
        if (body.includes('"code":"invalid_param"') && body.toLowerCase().includes('blocking')) return true;
        return false;
    };

    // Prefer native JSON blocking mode when supported (newer Dify versions).
    // Some Dify deployments (notably older/self-hosted builds) reject blocking
    // for Agent/Chat apps and require streaming-only. In that case we fall back
    // to server-side SSE collection and return a JSON response to the client.
    try {
        const payload = { ...difyPayload, response_mode: 'blocking' };
        const res = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${agent.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal
        });

        const contentType = res.headers.get('content-type') || '';
        const bodyText = await res.text();

        if (!res.ok) {
            if (shouldFallbackToStreamingCollect(res.status, bodyText)) {
                throw Object.assign(new Error('Dify blocking not supported'), { status: res.status, body: bodyText, contentType });
            }
            const err = new Error(`Dify HTTP ${res.status}`);
            err.status = res.status;
            err.body = bodyText;
            err.contentType = contentType;
            throw err;
        }

        let data;
        try {
            data = bodyText ? JSON.parse(bodyText) : {};
        } catch (e) {
            const err = new Error(`Dify JSON parse error: ${e.message}`);
            err.status = 502;
            err.body = bodyText;
            err.contentType = contentType;
            throw err;
        }

        const fullAnswer = String(data?.answer || '');
        const convId = data?.conversation_id || data?.conversationId || null;
        const msgId = data?.message_id || data?.messageId || null;

        if (process.env.DIFY_DEBUG === '1') {
            console.log(`[${agentId}] Blocking JSON answer (${fullAnswer.length} chars), conv=${convId || 'null'}`);
        }

        return { fullAnswer, convId, msgId };
    } catch (err) {
        const status = err?.status || err?.response?.status || null;
        const bodyText = err?.body || err?.response?.data || '';
        if (!shouldFallbackToStreamingCollect(status, bodyText)) throw err;

        console.warn(`[${agentId}] Dify blocking mode not supported — falling back to SSE collection`);

        const payload = { ...difyPayload, response_mode: 'streaming' };
        const response = await axios.post(
            `${DIFY_BASE_URL}/chat-messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${agent.key}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream',
                timeout: 120000,
                signal
            }
        );

        const collected = await collectChatSSEStream(response.data);
        return {
            fullAnswer: collected.fullAnswer || '',
            convId: collected.conversationId || null,
            msgId: collected.messageId || null,
            streamError: collected.streamError || null
        };
    }
}

/**
 * Parse envelope from collected stream and send JSON response.
 * Optionally attaches context engine trace metadata.
 */
function respondWithCollected(res, collected, agentId, contextPackage) {
    const { fullAnswer, convId, msgId, streamError } = collected;

    const { answer, metadata } = parseEnvelope(fullAnswer);

    // If there was a stream error but we got a partial answer, append a warning
    if (streamError) {
        console.warn(`[${agentId}] Returning partial answer despite stream error: ${streamError.message}`);
        if (!metadata.trace) metadata.trace = {};
        metadata.trace.stream_warning = streamError.message;
    }

    // Attach context engine trace if available
    if (contextPackage?._metadata) {
        if (!metadata.trace) metadata.trace = {};
        metadata.trace.context_trace_id = contextPackage._metadata.trace_id;
        metadata.trace.context_stages = contextPackage._metadata.stages?.length || 0;
        metadata.trace.context_budget = contextPackage._metadata.budget_report?.profile || null;
    }

    res.json({
        answer,
        conversation_id: convId,
        message_id: msgId,
        metadata
    });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/dify/chat
 * Forward chat messages to Dify Agent/Chatflow apps.
 *
 * Dify Agent apps ONLY support streaming mode. When Angular sends
 * response_mode='blocking', Express collects the SSE stream server-side,
 * parses [NPA_ACTION] markers from the assembled answer, and returns
 * a clean JSON response. This keeps Angular simple (just HTTP POST/JSON).
 */
router.post('/chat', async (req, res) => {
    const { agent_id: rawAgentId, query, inputs = {}, conversation_id, user: bodyUser, response_mode = 'blocking' } = req.body;

    const agent_id = DIFY_APP_ALIASES[rawAgentId] || rawAgentId;

    console.log(`[CHAT] Incoming: agent=${agent_id}${rawAgentId !== agent_id ? ` (alias: ${rawAgentId})` : ''}, query="${(query || '').slice(0, 50)}", conv=${conversation_id || 'NEW'}, mode=${response_mode}`);

    if (!agent_id) {
        return res.status(400).json({ error: 'agent_id is required' });
    }

    // Default empty query to greeting — Dify Agent apps need non-empty query
    const safeQuery = query && query.trim() ? query : 'Hello';
    const difyUser = getDifyUser(req, bodyUser);

    let agent;
    try {
        agent = getAgent(agent_id);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!agent.key) {
        return res.status(503).json({
            error: `Agent ${agent_id} is not configured (missing API key)`,
            metadata: makeError(agent_id, 'DIFY_API_ERROR', `Agent ${agent_id} not configured`)
        });
    }

    // Merge default inputs for this agent to prevent "variable is required" 400 errors.
    // Client-provided values override defaults (spread order: defaults first, then client inputs).
    const universalDefaults = {
        variable: '', session_id: '', current_project_id: '',
        current_stage: 'draft_builder', user_role: 'analyst', last_action: '',
        ideation_conversation_id: '', user_id: difyUser, user_message: '',
        orchestrator_message: '', npa_data: ''
    };

    // Only inject universal defaults into the specific Chatflow apps that require them.
    // Agent apps (like MASTER_COO) will throw a 400 error if we send undeclared variables.
    const needsUniversalDefaults = ['AG_NPA_BIZ', 'AG_NPA_TECH_OPS', 'AG_NPA_FINANCE', 'AG_NPA_RMG', 'AG_NPA_LCS'];
    let defaults = CHATFLOW_DEFAULT_INPUTS[agent_id] || {};
    if (needsUniversalDefaults.includes(agent_id)) {
        defaults = { ...universalDefaults, ...defaults };
    }

    const safeInputs = { ...defaults, ...inputs };
    // If the downstream app declares user_id, enforce per-user identity.
    if (Object.prototype.hasOwnProperty.call(safeInputs, 'user_id')) {
        safeInputs.user_id = difyUser;
    }

    // Always use streaming for Dify Agent apps (they don't support blocking)
    const difyPayload = {
        query: safeQuery,
        inputs: safeInputs,
        user: difyUser,
        response_mode: 'streaming',
        ...(conversation_id && { conversation_id })
    };

    if (Object.keys(defaults).length > 0) {
        console.log(`[CHAT] Merged ${Object.keys(defaults).length} default inputs for ${agent_id}`);
    }

    // ── Context Engine: assemble context before forwarding to Dify ──────────
    let contextPackage = null;
    if (CONTEXT_ENGINE_ENABLED) {
        try {
            const userCtx = {
                user_id: difyUser,
                role: req.user?.role || 'analyst',
                department: req.user?.department || '',
                jurisdiction: req.user?.jurisdiction || 'SG',
                session_id: conversation_id || '',
            };
            contextPackage = await assembleContextForAgent(agent_id, {
                query: safeQuery,
                entity_ids: safeInputs.current_project_id ? [safeInputs.current_project_id] : [],
                conversation_history: [],
                sources: [],
            }, userCtx);

            if (contextPackage?._metadata?.trace_id) {
                res.setHeader('X-Context-Trace-Id', contextPackage._metadata.trace_id);
                recordTrace({ agent_id, ...contextPackage });
            }
        } catch (ctxErr) {
            console.warn(`[CONTEXT-BRIDGE] Failed for ${agent_id}, continuing without context: ${ctxErr.message}`);
        }
    }

    try {
        if (response_mode === 'streaming') {
            // Client wants SSE — pipe stream through to Angular
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const controller = new AbortController();

            const response = await axios.post(
                `${DIFY_BASE_URL}/chat-messages`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream',
                    signal: controller.signal,
                    timeout: 120000 // 2 minutes
                }
            );

            // Only bind abort AFTER the upstream connection is established.
            // This prevents Angular component re-renders / tab switches from
            // aborting the upstream request before data starts flowing.
            const abortUpstream = () => {
                if (!controller.signal.aborted) controller.abort();
            };
            req.on('close', abortUpstream);

            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                console.error(`Dify stream error for ${agent_id}:`, err.message);
                res.end();
            });
        } else {
            // Client wants blocking JSON — use Dify's native blocking mode and parse envelope.
            const MAX_RETRIES = Number(process.env.DIFY_CHAT_MAX_RETRIES || 0);
            let lastCollected = null;
            let lastError = null;

            const timeoutMs = Number(process.env.DIFY_CHAT_TIMEOUT_MS || 120000);
            // NOTE: Do not bind AbortController to req/res 'close' for blocking mode.
            // Some clients/proxies close the request socket early, which would abort
            // the upstream Dify call even though the request is still valid.
            const signal = typeof AbortSignal?.timeout === 'function'
                ? AbortSignal.timeout(timeoutMs)
                : undefined;

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    // Alternate: odd retries drop conversation_id, even retries keep it.
                    // This helps when a conversation gets into a “bad state”.
                    let payload = difyPayload;
                    if (attempt > 0) {
                        payload = { ...difyPayload };
                        if (attempt % 2 === 1) delete payload.conversation_id;
                        console.warn(`[${agent_id}] Retry ${attempt}/${MAX_RETRIES} (conv=${payload.conversation_id || 'FRESH'})`);
                    }
                    lastCollected = await collectBlockingChat(agent, payload, agent_id, signal);
                    lastError = null;
                } catch (retryErr) {
                    lastError = {
                        message: retryErr?.message || 'Unknown error',
                        status: retryErr?.status || null,
                        body: retryErr?.body || null
                    };
                    console.error(`[${agent_id}] Attempt ${attempt} failed: ${lastError.message}`);
                    continue;
                }

                return respondWithCollected(res, lastCollected, agent_id, contextPackage);
            }

            // All retries exhausted — return a user-friendly 200 with fallback message
            // instead of a 400/500 which would show "error occurred" in the UI
            console.error(`[${agent_id}] All ${MAX_RETRIES + 1} attempts failed. Returning fallback.`);
            const fallbackAnswer = "I'm having a temporary issue processing your request. This is caused by an intermittent tool error on the AI backend. Please try again — it usually works on the next attempt.";
            res.json({
                answer: fallbackAnswer,
                conversation_id: lastCollected?.convId || conversation_id || null,
                message_id: lastCollected?.msgId || null,
                metadata: {
                    agent_action: 'SHOW_RAW_RESPONSE',
                    agent_id: agent_id,
                    payload: { raw_answer: fallbackAnswer },
                    trace: {
                        error: 'TOOL_ERROR_EXHAUSTED',
                        detail: lastError?.message || 'All retry attempts failed',
                        dify_code: null,
                        dify_status: lastError?.status || null,
                        upstream_body: lastError?.body ? String(lastError.body).slice(0, 600) : null,
                        retries: MAX_RETRIES,
                        hint: 'Set DIFY_DEBUG=1 to log SSE error events and collection details'
                    }
                }
            });
        }
    } catch (err) {
        const errorBody = await readStreamError(err);
        const errorMsg = typeof errorBody === 'object' ? (errorBody.message || JSON.stringify(errorBody)) : errorBody;
        console.error(`[CHAT ERROR] agent=${agent_id}, status=${err.response?.status || 'N/A'}, error:`, errorMsg);

        const status = err.response?.status || 500;
        res.status(status).json({
            answer: '',
            conversation_id: conversation_id || null,
            message_id: null,
            metadata: makeError(
                agent_id,
                'DIFY_API_ERROR',
                'Dify chat request failed',
                errorMsg
            )
        });
    }
});

/**
 * POST /api/dify/workflow
 * Forward workflow execution to Dify Workflow agents.
 * Extracts structured outputs and wraps in metadata envelope.
 */
router.post('/workflow', async (req, res) => {
    const { agent_id, inputs = {}, user: bodyUser, response_mode = 'blocking' } = req.body;

    if (!agent_id) {
        return res.status(400).json({ error: 'agent_id is required' });
    }

    let agent;
    try {
        agent = getAgent(agent_id);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!agent.key) {
        return res.status(503).json({
            error: `Agent ${agent_id} is not configured (missing API key)`,
            metadata: makeError(agent_id, 'DIFY_API_ERROR', `Agent ${agent_id} not configured`)
        });
    }

    // Some Dify workflow apps define 'query' and 'agent_id' as input variables in their start node.
    // Ensure they're always present in inputs to avoid "X is required in input form" errors.
    const safeInputs = {
        ...inputs,
        query: inputs.query || inputs.product_description || inputs.project_id || `Run ${agent_id} workflow`,
        agent_id: inputs.agent_id || agent_id
    };

    // Dify text-input fields require string values. Convert all input values to strings
    // to prevent "must be a string" errors for booleans, numbers, etc.
    Object.keys(safeInputs).forEach(k => {
        const v = safeInputs[k];
        if (v === null || v === undefined || typeof v === 'string') return;
        if (typeof v === 'object') {
            safeInputs[k] = JSON.stringify(v);
        } else {
            safeInputs[k] = String(v);
        }
    });

    const difyUser = getDifyUser(req, bodyUser);
    const difyPayload = {
        inputs: safeInputs,
        user: difyUser,
        response_mode
    };

    try {
        if (response_mode === 'streaming') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const controller = new AbortController();

            const response = await axios.post(
                `${DIFY_BASE_URL}/workflows/run`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream',
                    signal: controller.signal
                }
            );

            // Only bind abort AFTER the upstream connection is established.
            const abortUpstream = () => {
                if (!controller.signal.aborted) controller.abort();
            };
            req.on('close', abortUpstream);

            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                console.error(`Dify workflow stream error for ${agent_id}:`, err.message);
                res.end();
            });
        } else {
            // Use streaming + server-side collection to avoid Dify Cloud 504 gateway timeout.
            // Same pattern as chat: call Dify with response_mode='streaming', collect SSE,
            // then return assembled JSON to Angular.
            //
            // Retry strategy for MCP "Extra data" JSON parse bug:
            // Dify's MCP+REST dual-mount plugin can produce PluginInvokeError with
            // "Extra data: line 1 column 31 (char 30)". This is non-deterministic —
            // retrying the same request often succeeds. We retry up to WF_MAX_RETRIES times.
            const WF_MAX_RETRIES = 2;
            let lastResult = null;

            // NOTE: Do not bind AbortController to req/res 'close' for blocking mode.
            // Some clients/proxies close the request socket early, which would abort
            // the upstream Dify call even though the request is still valid.
            const timeoutMs = 600000; // 10 minutes for network-level timeout (AUTOFILL takes ~8 min)

            for (let attempt = 0; attempt <= WF_MAX_RETRIES; attempt++) {
                if (attempt > 0) {
                    console.warn(`[${agent_id}] Workflow retry ${attempt}/${WF_MAX_RETRIES}`);
                } else {
                    console.log(`[${agent_id}] Workflow blocking call via streaming+collection`);
                }

                const streamPayload = { ...difyPayload, response_mode: 'streaming' };

                try {
                    const response = await axios.post(
                        `${DIFY_BASE_URL}/workflows/run`,
                        streamPayload,
                        {
                            headers: {
                                'Authorization': `Bearer ${agent.key}`,
                                'Content-Type': 'application/json'
                            },
                            responseType: 'stream',
                            timeout: timeoutMs
                        }
                    );

                    lastResult = await collectWorkflowSSEStream(response.data);
                } catch (retryErr) {
                    console.error(`[${agent_id}] Attempt ${attempt} network error: ${retryErr.message}`);
                    continue;
                }

                const { outputs, workflowRunId, taskId, status: workflowStatus, streamError } = lastResult;

                console.log(`[${agent_id}] Workflow collected: status=${workflowStatus}, outputs=${Object.keys(outputs).length} keys${streamError ? `, error: ${streamError.message}` : ''}`);

                // Success — return immediately
                if (workflowStatus === 'succeeded') {
                    const metadata = extractWorkflowMeta(outputs, agent_id);

                    if (streamError) {
                        if (!metadata.trace) metadata.trace = {};
                        metadata.trace.stream_warning = streamError.message;
                    }

                    return res.json({
                        workflow_run_id: workflowRunId,
                        task_id: taskId,
                        data: { outputs, status: workflowStatus },
                        metadata
                    });
                }

                // Check if the error is the retryable MCP "Extra data" bug
                const errorStr = (streamError?.message || '') + (typeof outputs === 'object' ? JSON.stringify(outputs) : '');
                const isRetryable = errorStr.includes('Extra data') || errorStr.includes('PluginInvokeError') || errorStr.includes('JSONDecodeError');

                if (!isRetryable || attempt >= WF_MAX_RETRIES) {
                    // Non-retryable error OR all retries exhausted — return failure
                    return res.json({
                        workflow_run_id: workflowRunId,
                        task_id: taskId,
                        data: { outputs, status: 'failed' },
                        metadata: makeError(
                            agent_id,
                            'WORKFLOW_FAILURE',
                            streamError?.message || 'Workflow execution failed',
                            streamError?.message
                        )
                    });
                }

                // Retryable error — wait briefly and retry
                console.warn(`[${agent_id}] Retryable MCP error detected, will retry in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Fallback if loop exits without returning (shouldn't happen)
            return res.json({
                workflow_run_id: lastResult?.workflowRunId || null,
                task_id: lastResult?.taskId || null,
                data: { outputs: lastResult?.outputs || {}, status: 'failed' },
                metadata: makeError(agent_id, 'WORKFLOW_FAILURE', 'All workflow retry attempts exhausted')
            });
        }
    } catch (err) {
        const errorBody = await readStreamError(err);
        const errorMsg = typeof errorBody === 'object' ? (errorBody.message || JSON.stringify(errorBody)) : errorBody;
        console.error(`[WORKFLOW ERROR] agent=${agent_id}, status=${err.response?.status || 'N/A'}, error:`, errorMsg);

        const status = err.response?.status || 500;
        res.status(status).json({
            workflow_run_id: null,
            task_id: null,
            data: { outputs: {}, status: 'failed' },
            metadata: makeError(
                agent_id,
                'DIFY_API_ERROR',
                'Dify workflow request failed',
                errorMsg
            )
        });
    }
});

/**
 * GET /api/dify/conversations/:conversationId
 * Retrieve conversation history from Dify
 */
router.get('/conversations/:conversationId', async (req, res) => {
    try {
        const { agent_id } = req.query;
        if (!agent_id) {
            return res.status(400).json({ error: 'agent_id query parameter is required' });
        }

        const agent = getAgent(agent_id);
        if (!agent.key) {
            return res.status(503).json({ error: `Agent ${agent_id} is not configured` });
        }

        const response = await axios.get(
            `${DIFY_BASE_URL}/messages`,
            {
                params: {
                    conversation_id: req.params.conversationId,
                    user: getDifyUser(req, req.query.user),
                    limit: req.query.limit || 20
                },
                headers: {
                    'Authorization': `Bearer ${agent.key}`
                }
            }
        );

        res.json(response.data);
    } catch (err) {
        console.error('Dify conversation fetch error:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to fetch conversation',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * GET /api/dify/agents/status
 * Return status of all 13 agents with configuration state
 */
router.get('/agents/status', (req, res) => {
    const agents = getAllAgents();
    const summary = {
        total: agents.length,
        configured: agents.filter(a => a.configured).length,
        unconfigured: agents.filter(a => !a.configured).length,
        agents: agents.map(a => ({
            id: a.id,
            name: a.name,
            tier: a.tier,
            type: a.type,
            icon: a.icon,
            color: a.color,
            configured: a.configured,
            status: a.configured ? 'ready' : 'unconfigured'
        }))
    };
    res.json(summary);
});

/**
 * GET /api/dify/datasets
 * Fetch list of connected Knowledge Bases from Dify directly.
 */
router.get('/datasets', async (req, res) => {
    try {
        const apiKey = process.env.DIFY_DATASET_API_KEY;
        if (!apiKey) {
            console.warn('[DIFY PROXY] DIFY_DATASET_API_KEY is not configured');
            return res.json({ data: [] });
        }

        const response = await axios.get(`${DIFY_BASE_URL}/datasets`, {
            params: { page: 1, limit: 100 },
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 30000
        });

        res.json(response.data);
    } catch (err) {
        console.error('[DIFY PROXY] Failed to list datasets:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to fetch datasets',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * GET /api/dify/datasets/:datasetId/documents
 * List documents inside a Dify Knowledge Base.
 */
router.get('/datasets/:datasetId/documents', requireAuth(), async (req, res) => {
    try {
        const apiKey = process.env.DIFY_DATASET_API_KEY;
        if (!apiKey) return res.status(400).json({ error: 'Missing server env: DIFY_DATASET_API_KEY' });

        const datasetId = String(req.params.datasetId || '').trim();
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 20);

        const response = await axios.get(`${DIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/documents`, {
            params: { page, limit },
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000
        });

        res.json(response.data);
    } catch (err) {
        console.error('[DIFY PROXY] Failed to list dataset documents:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to fetch dataset documents',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * GET /api/dify/datasets/:datasetId/documents/:documentId
 * Fetch Dify Knowledge Base document details (includes KPIs like tokens/words/indexing status).
 */
router.get('/datasets/:datasetId/documents/:documentId', requireAuth(), async (req, res) => {
    try {
        const apiKey = process.env.DIFY_DATASET_API_KEY;
        if (!apiKey) return res.status(400).json({ error: 'Missing server env: DIFY_DATASET_API_KEY' });

        const datasetId = String(req.params.datasetId || '').trim();
        const documentId = String(req.params.documentId || '').trim();

        const response = await axios.get(
            `${DIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(documentId)}`,
            { headers: { 'Authorization': `Bearer ${apiKey}` }, timeout: 30000 }
        );

        res.json(response.data);
    } catch (err) {
        console.error('[DIFY PROXY] Failed to get document detail:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to fetch document detail',
            detail: err.response?.data?.message || err.message
        });
    }
});

/**
 * PATCH /api/dify/datasets/:datasetId
 * Update Dify Knowledge Base (dataset) name/description.
 */
router.patch('/datasets/:datasetId', requireAuth(), rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    try {
        const apiKey = process.env.DIFY_DATASET_API_KEY;
        if (!apiKey) return res.status(400).json({ error: 'Missing server env: DIFY_DATASET_API_KEY' });

        const datasetId = String(req.params.datasetId || '').trim();
        const name = req.body?.name !== undefined ? String(req.body.name || '').trim() : undefined;
        const description = req.body?.description !== undefined ? String(req.body.description || '').trim() : undefined;

        const payload = {};
        if (name !== undefined) payload.name = name;
        if (description !== undefined) payload.description = description;

        if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'Nothing to update' });

        const response = await axios.patch(`${DIFY_BASE_URL}/datasets/${encodeURIComponent(datasetId)}`, payload, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            timeout: 30000
        });

        res.json(response.data);
    } catch (err) {
        console.error('[DIFY PROXY] Failed to update dataset:', err.response?.data || err.message);
        const status = err.response?.status || 500;
        res.status(status).json({
            error: 'Failed to update dataset',
            detail: err.response?.data?.message || err.message
        });
    }
});

module.exports = router;
