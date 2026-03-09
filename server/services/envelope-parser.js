/**
 * Canonical Envelope Parser — SINGLE SOURCE OF TRUTH
 *
 * Parses agent response envelopes from Dify chatflow/workflow responses.
 * This is the canonical implementation used by BOTH the server (dify-proxy.js)
 * and referenced by the client (dify.service.ts).
 *
 * Supports TWO envelope formats:
 *   1. [NPA_ACTION]...[NPA_SESSION] markers (Agent app format)
 *   2. @@NPA_META@@{json} / @@COO_META@@{json} (Chatflow format — future-proof)
 *
 * Architecture: This module eliminates the DRY violation where envelope
 * parsing was duplicated between client (dify.service.ts ~95 lines) and
 * server (dify-proxy.js ~56 lines). Format changes now only need to
 * happen in ONE place.
 *
 * @module services/envelope-parser
 */

// ─── Valid AgentAction values (source: agent-interfaces.ts + Freeze doc §6) ───

const VALID_AGENT_ACTIONS = new Set([
    'ROUTE_DOMAIN', 'DELEGATE_AGENT', 'ASK_CLARIFICATION', 'SHOW_CLASSIFICATION',
    'SHOW_RISK', 'SHOW_PREDICTION', 'SHOW_AUTOFILL', 'SHOW_GOVERNANCE',
    'SHOW_DOC_STATUS', 'SHOW_MONITORING', 'SHOW_KB_RESULTS', 'HARD_STOP',
    'STOP_PROCESS', 'FINALIZE_DRAFT', 'ROUTE_WORK_ITEM', 'SHOW_RAW_RESPONSE',
    'SHOW_ERROR'
]);

// Backward-compatible regex: accepts both @@NPA_META@@ and @@COO_META@@
const META_REGEX = /@@(?:NPA|COO)_META@@(\{[\s\S]*\})$/;

/**
 * Parse [NPA_ACTION]...[NPA_SESSION] markers from Agent app response.
 * Returns { answer, metadata } or null if no markers found.
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
 *   2. @@NPA_META@@{json} or @@COO_META@@{json} (Chatflow / future apps)
 *
 * @param {string} rawAnswer - Raw answer text from Dify
 * @returns {{ answer: string, metadata: object }} Parsed result
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
            console.warn(`[ENVELOPE] Unknown agent_action: ${markerResult.metadata.agent_action}`);
        }
        return markerResult;
    }

    // Try @@NPA_META@@ or @@COO_META@@ format (Chatflow)
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
            console.warn(`[ENVELOPE] Unknown agent_action: ${meta.agent_action}`);
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
        console.warn('[ENVELOPE] META JSON parse failed:', parseErr.message);
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
 * @param {string} agentId
 * @param {string} errorType
 * @param {string} message
 * @param {string} [detail]
 * @returns {object} Error metadata envelope
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

/**
 * Check if an agent_action is valid.
 * @param {string} action
 * @returns {boolean}
 */
function isValidAction(action) {
    return VALID_AGENT_ACTIONS.has(action);
}

module.exports = {
    parseEnvelope,
    parseMarkers,
    makeFallback,
    makeError,
    extractWorkflowMeta,
    isValidAction,
    VALID_AGENT_ACTIONS,
    META_REGEX
};
