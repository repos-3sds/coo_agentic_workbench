/**
 * DCE Account Opening Routes
 * Proxies to Railway MCP server for all DCE data access.
 *
 * Endpoints:
 *   GET  /api/dce/cases                    → List cases (filters: status, priority, jurisdiction, current_node)
 *   POST /api/dce/cases                    → Create new case (SA-1 Intake)
 *   GET  /api/dce/cases/:caseId            → Case detail (state, classification, checkpoints, RM)
 *   GET  /api/dce/cases/:caseId/documents  → Documents (staged, OCR, reviews, checklist)
 *   GET  /api/dce/cases/:caseId/events     → Event log + notifications
 *   GET  /api/dce/cases/:caseId/signatures → Signature verification (SA-3)
 *   GET  /api/dce/cases/:caseId/kyc        → KYC/CDD brief (SA-4)
 *   GET  /api/dce/cases/:caseId/credit     → Credit brief + financial extracts (SA-5)
 *   GET  /api/dce/cases/:caseId/config     → Static configuration spec (SA-6)
 *   GET  /api/dce/cases/:caseId/welcome-kit → Welcome kit (SA-7)
 *   GET  /api/dce/dashboard/kpis           → Aggregate KPIs
 *   POST /api/dce/workflow/:agentId        → Invoke DCE Dify workflow
 */

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getAgent } = require('../config/dify-agents');
const { collectWorkflowSSEStream } = require('../services/sse-collector');
const { extractWorkflowMeta, makeError } = require('../services/envelope-parser');
const axios = require('axios');

const router = express.Router();

const DCE_MCP_URL = process.env.DCE_MCP_URL || 'https://dcemcptools-production.up.railway.app';
const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';

// ─── MCP helper: JSON-RPC 2.0 over Streamable HTTP ─────────────────────────

let mcpSessionId = null;

/**
 * Call an MCP tool on the Railway server via Streamable HTTP transport.
 * Handles: initialize handshake → tools/call → parse SSE response.
 */
async function mcpCall(toolName, args = {}) {
    const mcpEndpoint = `${DCE_MCP_URL}/mcp`;
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
    };

    // Initialize session if needed
    if (!mcpSessionId) {
        const initPayload = {
            jsonrpc: '2.0',
            id: 0,
            method: 'initialize',
            params: {
                protocolVersion: '2025-03-26',
                capabilities: {},
                clientInfo: { name: 'coo-workbench', version: '1.0.0' },
            },
        };

        const initRes = await fetch(mcpEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(initPayload),
        });

        // Grab session ID from header
        const sid = initRes.headers.get('mcp-session-id');
        if (sid) mcpSessionId = sid;

        // Read init response (may be SSE or JSON)
        await initRes.text();
    }

    // Call the tool
    const callPayload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: toolName, arguments: args },
    };

    const callHeaders = { ...headers };
    if (mcpSessionId) callHeaders['mcp-session-id'] = mcpSessionId;

    const callRes = await fetch(mcpEndpoint, {
        method: 'POST',
        headers: callHeaders,
        body: JSON.stringify(callPayload),
    });

    const raw = await callRes.text();

    // Parse SSE response: look for "data:" lines with JSON-RPC result
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            try {
                const rpc = JSON.parse(dataStr);
                const content = rpc?.result?.content;
                if (content && content[0]?.text) {
                    return JSON.parse(content[0].text);
                }
            } catch {
                // Try direct JSON parse of full response
            }
        }
    }

    // Fallback: try parsing raw as direct JSON
    try {
        const direct = JSON.parse(raw);
        if (direct?.result?.content?.[0]?.text) {
            return JSON.parse(direct.result.content[0].text);
        }
        return direct;
    } catch {
        return { status: 'error', error: 'Failed to parse MCP response', raw: raw.slice(0, 500) };
    }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/dce/cases
 * List DCE cases with optional filters.
 */
router.get('/cases', async (req, res) => {
    try {
        const { status, priority, jurisdiction, current_node, limit = 50, offset = 0 } = req.query;
        const result = await mcpCall('dce_list_cases', {
            status: status || '',
            priority: priority || '',
            jurisdiction: jurisdiction || '',
            current_node: current_node || '',
            limit: Number(limit),
            offset: Number(offset),
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] List cases error:', err.message);
        res.status(500).json({ error: 'Failed to fetch DCE cases', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId
 * Get full case detail.
 */
router.get('/cases/:caseId', async (req, res) => {
    try {
        const result = await mcpCall('dce_get_case_detail', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Case detail error:', err.message);
        res.status(500).json({ error: 'Failed to fetch case detail', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/documents
 * Get all documents for a case.
 */
router.get('/cases/:caseId/documents', async (req, res) => {
    try {
        const result = await mcpCall('dce_get_case_documents', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Case documents error:', err.message);
        res.status(500).json({ error: 'Failed to fetch case documents', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/events
 * Get event log and notifications for a case.
 */
router.get('/cases/:caseId/events', async (req, res) => {
    try {
        const result = await mcpCall('dce_get_case_events', {
            case_id: req.params.caseId,
            limit: Number(req.query.limit || 100),
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Case events error:', err.message);
        res.status(500).json({ error: 'Failed to fetch case events', detail: err.message });
    }
});

/**
 * GET /api/dce/dashboard/kpis
 * Aggregate KPIs for DCE dashboard.
 */
router.get('/dashboard/kpis', async (req, res) => {
    try {
        const result = await mcpCall('dce_get_dashboard_kpis', {});
        res.json(result);
    } catch (err) {
        console.error('[DCE] Dashboard KPIs error:', err.message);
        res.status(500).json({ error: 'Failed to fetch dashboard KPIs', detail: err.message });
    }
});

/**
 * POST /api/dce/cases
 * Create a new DCE case via SA-1 Intake & Triage.
 */
router.post('/cases', async (req, res) => {
    try {
        const { client_name, account_type, priority, jurisdiction, products_requested, rm_id } = req.body;
        const result = await mcpCall('sa1_create_case_full', {
            client_name: client_name || 'Unknown Client',
            account_type: account_type || 'Standard',
            priority: priority || 'STANDARD',
            jurisdiction: jurisdiction || 'SGP',
            products_requested: products_requested || [],
            rm_id: rm_id || null,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Create case error:', err.message);
        res.status(500).json({ error: 'Failed to create DCE case', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/signatures
 * Get signature verification data (SA-3).
 */
router.get('/cases/:caseId/signatures', async (req, res) => {
    try {
        const result = await mcpCall('sa3_get_verification_status', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Signatures error:', err.message);
        res.status(500).json({ error: 'Failed to fetch signatures', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/kyc
 * Get KYC/CDD brief data (SA-4).
 */
router.get('/cases/:caseId/kyc', async (req, res) => {
    try {
        const result = await mcpCall('sa4_get_kyc_brief', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] KYC error:', err.message);
        res.status(500).json({ error: 'Failed to fetch KYC data', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/credit
 * Get credit brief and financial extracts (SA-5).
 */
router.get('/cases/:caseId/credit', async (req, res) => {
    try {
        const result = await mcpCall('sa5_get_credit_brief', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Credit error:', err.message);
        res.status(500).json({ error: 'Failed to fetch credit data', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/config
 * Get static configuration spec (SA-6 — UBIX/SIC/CreditView).
 */
router.get('/cases/:caseId/config', async (req, res) => {
    try {
        const result = await mcpCall('sa6_get_config_spec', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Config error:', err.message);
        res.status(500).json({ error: 'Failed to fetch config data', detail: err.message });
    }
});

/**
 * GET /api/dce/cases/:caseId/welcome-kit
 * Get welcome kit and CQG/IDB credentials (SA-7).
 */
router.get('/cases/:caseId/welcome-kit', async (req, res) => {
    try {
        const result = await mcpCall('sa7_get_welcome_kit', {
            case_id: req.params.caseId,
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] Welcome kit error:', err.message);
        res.status(500).json({ error: 'Failed to fetch welcome kit', detail: err.message });
    }
});

// ─── HITL Decision Routes ────────────────────────────────────────────────────

/**
 * POST /api/dce/cases/:caseId/hitl/N-2/decide
 * Submit signature verification HITL decision (SA-3 resume).
 */
router.post('/cases/:caseId/hitl/N-2/decide', async (req, res) => {
    try {
        const { task_id, decisions } = req.body;
        const result = await mcpCall('sa3_resume_with_decision', {
            case_id: req.params.caseId,
            mode: 'RESUME',
            task_id: task_id || '',
            decisions: decisions || [],
            reviewed_by_id: req.user?.userId || 'DS-0001',
            reviewed_at: new Date().toISOString(),
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] HITL N-2 decide error:', err.message);
        res.status(500).json({ error: 'Failed to submit signature decision', detail: err.message });
    }
});

/**
 * POST /api/dce/cases/:caseId/hitl/N-3/decide
 * Submit KYC/CDD RM decision (SA-4 resume).
 */
router.post('/cases/:caseId/hitl/N-3/decide', async (req, res) => {
    try {
        const { task_id, rm_decisions } = req.body;
        const result = await mcpCall('sa4_resume_with_decision', {
            case_id: req.params.caseId,
            mode: 'RESUME',
            task_id: task_id || '',
            rm_decisions: rm_decisions || {},
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] HITL N-3 decide error:', err.message);
        res.status(500).json({ error: 'Failed to submit KYC decision', detail: err.message });
    }
});

/**
 * POST /api/dce/cases/:caseId/hitl/N-4/decide
 * Submit credit team decision (SA-5 resume).
 */
router.post('/cases/:caseId/hitl/N-4/decide', async (req, res) => {
    try {
        const { task_id, credit_decisions } = req.body;
        const result = await mcpCall('sa5_resume_with_decision', {
            case_id: req.params.caseId,
            mode: 'RESUME',
            task_id: task_id || '',
            credit_decisions: credit_decisions || {},
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] HITL N-4 decide error:', err.message);
        res.status(500).json({ error: 'Failed to submit credit decision', detail: err.message });
    }
});

/**
 * POST /api/dce/cases/:caseId/hitl/N-5/decide
 * Submit TMO static validation (SA-6 resume).
 */
router.post('/cases/:caseId/hitl/N-5/decide', async (req, res) => {
    try {
        const { task_id } = req.body;
        const result = await mcpCall('sa6_resume_with_validation', {
            case_id: req.params.caseId,
            mode: 'RESUME',
            task_id: task_id || '',
        });
        res.json(result);
    } catch (err) {
        console.error('[DCE] HITL N-5 decide error:', err.message);
        res.status(500).json({ error: 'Failed to submit config validation', detail: err.message });
    }
});

// ─── Workflow Invocation ────────────────────────────────────────────────────

/**
 * POST /api/dce/workflow/:agentId
 * Invoke a DCE Dify workflow (DCE_SA1 or DCE_SA2).
 * Uses streaming + server-side collection (same pattern as dify-proxy).
 */
router.post('/workflow/:agentId', async (req, res) => {
    const agentId = req.params.agentId;
    const { inputs = {}, user } = req.body;

    let agent;
    try {
        agent = getAgent(agentId);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }

    if (!agent.key) {
        return res.status(503).json({
            error: `Agent ${agentId} is not configured (missing API key)`,
        });
    }

    const difyUser = user || (req.user?.userId ? String(req.user.userId) : 'dce-workbench');

    const safeInputs = { ...inputs };
    Object.keys(safeInputs).forEach(k => {
        const v = safeInputs[k];
        if (v === null || v === undefined || typeof v === 'string') return;
        safeInputs[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    });

    try {
        console.log(`[DCE] Workflow ${agentId} — streaming+collection`);

        const response = await axios.post(
            `${DIFY_BASE_URL}/workflows/run`,
            { inputs: safeInputs, user: difyUser, response_mode: 'streaming' },
            {
                headers: {
                    'Authorization': `Bearer ${agent.key}`,
                    'Content-Type': 'application/json',
                },
                responseType: 'stream',
                timeout: 600000,
            }
        );

        const result = await collectWorkflowSSEStream(response.data);
        const { outputs, workflowRunId, taskId, status: wfStatus, streamError } = result;

        const metadata = extractWorkflowMeta(outputs, agentId);
        if (streamError) {
            if (!metadata.trace) metadata.trace = {};
            metadata.trace.stream_warning = streamError.message;
        }

        res.json({
            workflow_run_id: workflowRunId,
            task_id: taskId,
            data: { outputs, status: wfStatus },
            metadata,
        });
    } catch (err) {
        console.error(`[DCE] Workflow ${agentId} error:`, err.message);
        res.status(500).json({
            workflow_run_id: null,
            task_id: null,
            data: { outputs: {}, status: 'failed' },
            metadata: makeError(agentId, 'DIFY_API_ERROR', 'DCE workflow request failed', err.message),
        });
    }
});

module.exports = router;
