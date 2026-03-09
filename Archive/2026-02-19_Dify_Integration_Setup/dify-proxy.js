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
const { DIFY_BASE_URL, getAgent, getAllAgents } = require('../config/dify-agents');

const router = express.Router();

// ─── Valid AgentAction values (source: agent-interfaces.ts + Freeze doc §6) ───

const VALID_AGENT_ACTIONS = new Set([
    'ROUTE_DOMAIN', 'DELEGATE_AGENT', 'ASK_CLARIFICATION', 'SHOW_CLASSIFICATION',
    'SHOW_RISK', 'SHOW_PREDICTION', 'SHOW_AUTOFILL', 'SHOW_GOVERNANCE',
    'SHOW_DOC_STATUS', 'SHOW_MONITORING', 'SHOW_KB_RESULTS', 'HARD_STOP',
    'STOP_PROCESS', 'FINALIZE_DRAFT', 'ROUTE_WORK_ITEM', 'SHOW_RAW_RESPONSE',
    'SHOW_ERROR'
]);

// ─── @@NPA_META@@ Envelope Parsing ───────────────────────────────────────────

const META_REGEX = /@@NPA_META@@(\{[\s\S]*\})$/;

/**
 * Parse [NPA_ACTION]...[NPA_SESSION] markers from Agent app response.
 * Returns { markers, markerStartIndex } or null if no markers found.
 */
function parseMarkers(rawAnswer) {
    const lines = rawAnswer.split('\n');
    const markers = {};
    let markerStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const stripped = lines[i].trim();
        if (stripped.startsWith('[NPA_')) {
            if (markerStartIndex === -1) markerStartIndex = i;
            const bracketEnd = stripped.indexOf(']');
            if (bracketEnd > 0) {
                const key = stripped.substring(1, bracketEnd);
                const value = stripped.substring(bracketEnd + 1).trim();
                markers[key] = value;
            }
        }
    }

    if (markerStartIndex === -1 || !markers.NPA_ACTION) return null;

    const cleanAnswer = lines.slice(0, markerStartIndex).join('\n').trimEnd();

    // Parse [NPA_DATA] JSON
    let dataObj = {};
    if (markers.NPA_DATA) {
        try {
            dataObj = JSON.parse(markers.NPA_DATA);
        } catch {
            dataObj = { raw_answer: markers.NPA_DATA };
        }
    }

    return {
        answer: cleanAnswer,
        metadata: {
            agent_action: markers.NPA_ACTION || 'SHOW_RAW_RESPONSE',
            agent_id: markers.NPA_AGENT || 'UNKNOWN',
            payload: {
                projectId: markers.NPA_PROJECT || '',
                intent: markers.NPA_INTENT || '',
                target_agent: markers.NPA_TARGET || '',
                uiRoute: '/agents/npa',
                data: dataObj
            },
            trace: {
                session_id: markers.NPA_SESSION || ''
            }
        }
    };
}

/**
 * Parse envelope from a Dify agent/chatflow answer string.
 * Supports TWO formats:
 *   1. [NPA_ACTION]...[NPA_SESSION] markers (Agent app)
 *   2. @@NPA_META@@{json} (Chatflow / future apps)
 * Returns { answer, metadata } where answer has markers/meta stripped.
 */
function parseEnvelope(rawAnswer) {
    if (!rawAnswer || typeof rawAnswer !== 'string') {
        return {
            answer: rawAnswer || '',
            metadata: makeFallback(rawAnswer)
        };
    }

    // Try marker format first (Agent app)
    const markerResult = parseMarkers(rawAnswer);
    if (markerResult) {
        if (markerResult.metadata.agent_action && !VALID_AGENT_ACTIONS.has(markerResult.metadata.agent_action)) {
            console.warn(`Unknown agent_action: ${markerResult.metadata.agent_action}`);
        }
        return markerResult;
    }

    // Try @@NPA_META@@ format (Chatflow)
    const match = rawAnswer.match(META_REGEX);
    if (!match) {
        return {
            answer: rawAnswer,
            metadata: makeFallback(rawAnswer)
        };
    }

    try {
        const meta = JSON.parse(match[1]);

        if (meta.agent_action && !VALID_AGENT_ACTIONS.has(meta.agent_action)) {
            console.warn(`Unknown agent_action: ${meta.agent_action}`);
        }

        const cleanAnswer = rawAnswer.slice(0, match.index).trimEnd();

        return {
            answer: cleanAnswer,
            metadata: {
                agent_action: meta.agent_action || 'SHOW_RAW_RESPONSE',
                agent_id: meta.agent_id || 'UNKNOWN',
                payload: meta.payload || {},
                trace: meta.trace || {}
            }
        };
    } catch (parseErr) {
        console.warn('@@NPA_META@@ JSON parse failed:', parseErr.message);
        return {
            answer: rawAnswer,
            metadata: {
                ...makeFallback(rawAnswer),
                trace: { error: 'META_PARSE_FAILED', detail: parseErr.message }
            }
        };
    }
}

/**
 * Build SHOW_RAW_RESPONSE fallback envelope.
 */
function makeFallback(rawAnswer) {
    return {
        agent_action: 'SHOW_RAW_RESPONSE',
        agent_id: 'UNKNOWN',
        payload: { raw_answer: rawAnswer || '' },
        trace: { error: 'META_PARSE_FAILED' }
    };
}

/**
 * Build SHOW_ERROR envelope.
 */
function makeError(agentId, errorType, message, detail) {
    return {
        agent_action: 'SHOW_ERROR',
        agent_id: agentId || 'UNKNOWN',
        payload: {
            error_type: errorType,
            message: message,
            retry_allowed: true
        },
        trace: { error_detail: detail || '' }
    };
}

/**
 * Extract structured metadata from workflow outputs.
 * Workflows return agent_action, agent_id, payload, trace as output variables.
 */
function extractWorkflowMeta(outputs, agentId) {
    if (!outputs) {
        return makeError(agentId, 'WORKFLOW_FAILURE', 'Workflow returned no outputs');
    }

    // Workflows should set these output variables directly
    if (outputs.agent_action) {
        return {
            agent_action: outputs.agent_action,
            agent_id: outputs.agent_id || agentId,
            payload: outputs.payload || outputs,
            trace: outputs.trace || {}
        };
    }

    // Fallback: wrap entire output as payload (for workflows that return raw data)
    return {
        agent_action: 'SHOW_RAW_RESPONSE',
        agent_id: agentId,
        payload: outputs,
        trace: {}
    };
}

// ─── SSE Stream Collector ─────────────────────────────────────────────────────

/**
 * Collect SSE stream from Dify into a complete response.
 * Dify Agent apps only support streaming — this collects all chunks,
 * reassembles the answer, and returns structured data.
 *
 * SSE event types from Dify Agent app:
 *   - agent_message: text chunks from the LLM (incremental answer)
 *   - agent_thought: reasoning steps, tool calls
 *   - message_end: final event with conversation_id, message_id
 *   - message_file: file attachments
 *   - error: error events
 */
function collectSSEStream(stream) {
    return new Promise((resolve, reject) => {
        let fullAnswer = '';
        let conversationId = null;
        let messageId = null;
        let buffer = '';
        let streamError = null; // Capture Dify-level errors but don't abort immediately

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            // Keep the last partial line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const jsonStr = line.slice(5).trim();
                if (!jsonStr) continue;

                try {
                    const evt = JSON.parse(jsonStr);

                    if (evt.event === 'agent_message' || evt.event === 'message') {
                        // Incremental answer text
                        fullAnswer += (evt.answer || '');
                    } else if (evt.event === 'message_end') {
                        conversationId = evt.conversation_id || conversationId;
                        messageId = evt.message_id || messageId;
                    } else if (evt.event === 'error') {
                        // Dify-level error (e.g. tool failure mid-stream).
                        // Capture it but DON'T reject — wait for stream end.
                        // If we already have a partial answer we can still return it.
                        streamError = {
                            code: evt.code || 'DIFY_STREAM_ERROR',
                            message: evt.message || 'Dify stream error',
                            status: evt.status || 500
                        };
                        console.warn(`[SSE] Dify error event: ${evt.code} — ${evt.message}`);
                    }

                    // Capture IDs from any event that has them
                    if (evt.conversation_id) conversationId = evt.conversation_id;
                    if (evt.message_id) messageId = evt.message_id;
                } catch { /* skip malformed SSE lines */ }
            }
        });

        stream.on('end', () => {
            // Process any remaining buffer
            if (buffer.startsWith('data:')) {
                const jsonStr = buffer.slice(5).trim();
                try {
                    const evt = JSON.parse(jsonStr);
                    if (evt.event === 'agent_message' || evt.event === 'message') {
                        fullAnswer += (evt.answer || '');
                    }
                    if (evt.conversation_id) conversationId = evt.conversation_id;
                    if (evt.message_id) messageId = evt.message_id;
                } catch { /* ignore */ }
            }

            // If we got a Dify error but also have a partial answer, return both.
            // If we got an error with NO answer, still resolve (let caller handle empty answer).
            resolve({ fullAnswer, conversationId, messageId, streamError });
        });

        stream.on('error', (err) => {
            // Network-level error (TCP disconnect, etc.) — truly fatal
            reject(err);
        });
    });
}

// ─── Workflow SSE Stream Collector ────────────────────────────────────────────

/**
 * Collect SSE stream from Dify Workflow run into a complete response.
 * Workflow SSE event types differ from Chat:
 *   - workflow_started: initial event with task_id, workflow_run_id
 *   - node_started / node_finished: per-node progress (optional)
 *   - text_chunk: incremental text from LLM nodes
 *   - workflow_finished: final event with data.outputs, data.status
 *   - error: error events
 */
function collectWorkflowSSEStream(stream) {
    return new Promise((resolve, reject) => {
        let outputs = {};
        let workflowRunId = null;
        let taskId = null;
        let status = 'unknown';
        let buffer = '';
        let streamError = null;
        let textChunks = ''; // Collect text_chunk events for LLM output

        stream.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const jsonStr = line.slice(5).trim();
                if (!jsonStr) continue;

                try {
                    const evt = JSON.parse(jsonStr);

                    if (evt.event === 'workflow_started') {
                        workflowRunId = evt.workflow_run_id || workflowRunId;
                        taskId = evt.task_id || taskId;
                    } else if (evt.event === 'workflow_finished') {
                        workflowRunId = evt.workflow_run_id || workflowRunId;
                        taskId = evt.task_id || taskId;
                        outputs = evt.data?.outputs || {};
                        status = evt.data?.status || 'succeeded';
                        // Capture workflow-level error (e.g., MCP PluginInvokeError)
                        if (evt.data?.error) {
                            streamError = {
                                code: 'WORKFLOW_EXECUTION_ERROR',
                                message: evt.data.error,
                                status: 500
                            };
                            console.warn(`[WF SSE] Workflow error: ${evt.data.error.substring(0, 200)}`);
                        }
                    } else if (evt.event === 'text_chunk') {
                        textChunks += (evt.data?.text || '');
                    } else if (evt.event === 'node_finished') {
                        // Capture outputs from individual nodes as fallback
                        if (evt.data?.outputs && !Object.keys(outputs).length) {
                            // Only use node outputs if we haven't gotten workflow_finished yet
                        }
                    } else if (evt.event === 'error') {
                        streamError = {
                            code: evt.code || 'DIFY_WORKFLOW_STREAM_ERROR',
                            message: evt.message || 'Dify workflow stream error',
                            status: evt.status || 500
                        };
                        status = 'failed';
                        console.warn(`[WF SSE] Dify error event: ${evt.code} — ${evt.message}`);
                    }

                    // Capture IDs from any event
                    if (evt.workflow_run_id) workflowRunId = evt.workflow_run_id;
                    if (evt.task_id) taskId = evt.task_id;
                } catch { /* skip malformed SSE lines */ }
            }
        });

        stream.on('end', () => {
            // Process remaining buffer
            if (buffer.startsWith('data:')) {
                const jsonStr = buffer.slice(5).trim();
                try {
                    const evt = JSON.parse(jsonStr);
                    if (evt.event === 'workflow_finished') {
                        outputs = evt.data?.outputs || outputs;
                        status = evt.data?.status || status;
                    }
                    if (evt.workflow_run_id) workflowRunId = evt.workflow_run_id;
                    if (evt.task_id) taskId = evt.task_id;
                } catch { /* ignore */ }
            }

            // If we collected text chunks but outputs.result is missing, use text chunks
            if (textChunks && !outputs.result) {
                outputs.result = textChunks;
            }

            resolve({ outputs, workflowRunId, taskId, status, streamError });
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

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
 * Execute a blocking chat request: call Dify streaming, collect SSE, return result.
 * Returns { fullAnswer, convId, msgId, streamError }.
 */
async function collectBlockingChat(agent, difyPayload, agentId) {
    const response = await axios.post(
        `${DIFY_BASE_URL}/chat-messages`,
        difyPayload,
        {
            headers: {
                'Authorization': `Bearer ${agent.key}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream',
            timeout: 120000 // 2 minutes — prevent indefinite hangs on Dify calls
        }
    );

    const { fullAnswer, conversationId: convId, messageId: msgId, streamError } = await collectSSEStream(response.data);

    console.log(`[${agentId}] Collected answer (${fullAnswer.length} chars), conv=${convId}${streamError ? `, streamError: ${streamError.message}` : ''}`);

    return { fullAnswer, convId, msgId, streamError };
}

/**
 * Parse envelope from collected stream and send JSON response.
 */
function respondWithCollected(res, collected, agentId) {
    const { fullAnswer, convId, msgId, streamError } = collected;

    const { answer, metadata } = parseEnvelope(fullAnswer);

    // If there was a stream error but we got a partial answer, append a warning
    if (streamError) {
        console.warn(`[${agentId}] Returning partial answer despite stream error: ${streamError.message}`);
        if (!metadata.trace) metadata.trace = {};
        metadata.trace.stream_warning = streamError.message;
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
    const { agent_id, query, inputs = {}, conversation_id, user = 'default-user', response_mode = 'blocking' } = req.body;

    console.log(`[CHAT] Incoming: agent=${agent_id}, query="${(query || '').slice(0, 50)}", conv=${conversation_id || 'NEW'}, mode=${response_mode}`);

    if (!agent_id) {
        return res.status(400).json({ error: 'agent_id is required' });
    }

    // Default empty query to greeting — Dify Agent apps need non-empty query
    const safeQuery = query && query.trim() ? query : 'Hello';

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

    // Always use streaming for Dify Agent apps (they don't support blocking)
    const difyPayload = {
        query: safeQuery,
        inputs,
        user,
        response_mode: 'streaming',
        ...(conversation_id && { conversation_id })
    };

    try {
        if (response_mode === 'streaming') {
            // Client wants SSE — pipe stream through to Angular
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const response = await axios.post(
                `${DIFY_BASE_URL}/chat-messages`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream',
                    timeout: 120000 // 2 minutes
                }
            );

            response.data.pipe(res);
            response.data.on('end', () => res.end());
            response.data.on('error', (err) => {
                console.error(`Dify stream error for ${agent_id}:`, err.message);
                res.end();
            });
        } else {
            // Client wants blocking JSON — collect stream server-side, parse, return JSON
            //
            // Retry strategy for the session_create MCP tool bug:
            // Dify's MCP+REST dual-mount can produce "Extra data" JSON parse errors
            // when the LLM calls session_create. Since whether Dify calls the tool is
            // non-deterministic, retrying often succeeds. We retry up to MAX_RETRIES
            // times, alternating between fresh conversation and original conversation_id.
            const MAX_RETRIES = 1;
            let lastCollected = null;

            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                const isRetry = attempt > 0;
                let payload = difyPayload;

                if (isRetry) {
                    // Alternate: odd retries drop conversation_id, even retries keep it
                    payload = { ...difyPayload };
                    if (attempt % 2 === 1) {
                        delete payload.conversation_id;
                    }
                    console.warn(`[${agent_id}] Retry ${attempt}/${MAX_RETRIES} (conv=${payload.conversation_id || 'FRESH'})`);
                }

                try {
                    lastCollected = await collectBlockingChat(agent, payload, agent_id);
                } catch (retryErr) {
                    // Network error during retry — continue to next attempt
                    console.error(`[${agent_id}] Attempt ${attempt} network error: ${retryErr.message}`);
                    continue;
                }

                // Success: got an answer (even partial)
                if (lastCollected.fullAnswer.trim()) {
                    return respondWithCollected(res, lastCollected, agent_id);
                }

                // No answer but also no error — unusual, but still return it
                if (!lastCollected.streamError) {
                    return respondWithCollected(res, lastCollected, agent_id);
                }

                // Error with no answer — retry if we have attempts left
                if (attempt < MAX_RETRIES) {
                    console.warn(`[${agent_id}] Attempt ${attempt} failed (${lastCollected.streamError.message}), will retry...`);
                }
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
                        detail: lastCollected?.streamError?.message || 'All retry attempts failed',
                        retries: MAX_RETRIES
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
    const { agent_id, inputs = {}, user = 'default-user', response_mode = 'blocking' } = req.body;

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
        if (safeInputs[k] !== null && safeInputs[k] !== undefined && typeof safeInputs[k] !== 'string') {
            safeInputs[k] = String(safeInputs[k]);
        }
    });

    const difyPayload = {
        inputs: safeInputs,
        user,
        response_mode
    };

    try {
        if (response_mode === 'streaming') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const response = await axios.post(
                `${DIFY_BASE_URL}/workflows/run`,
                difyPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${agent.key}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream'
                }
            );

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
                            timeout: 180000 // 3 minutes for network-level timeout
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
                    user: req.query.user || 'default-user',
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
            status: a.configured ? 'ready' : 'unconfigured'
        }))
    };
    res.json(summary);
});

module.exports = router;
