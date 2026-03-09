/**
 * Reusable Audit Logging Middleware (GAP-017)
 *
 * Provides two utilities:
 *   1. auditLog() — standalone function for inserting audit entries
 *      (accepts either a connection or uses the pool)
 *   2. auditMiddleware() — Express middleware that auto-logs
 *      POST/PUT/PATCH/DELETE requests with project_id in params
 *
 * Schema reference (npa_audit_log):
 *   id, project_id, actor_name, actor_role, action_type,
 *   action_details (JSON), is_agent_action, agent_name,
 *   timestamp (auto), confidence_score, reasoning,
 *   model_version, source_citations (JSON)
 */

const db = require('../db');

/**
 * Insert an audit log entry.
 *
 * @param {object} opts
 * @param {object}  [opts.conn]           - DB connection (uses pool if omitted)
 * @param {string}   opts.projectId       - NPA project ID
 * @param {string}   opts.actorName       - Who performed the action
 * @param {string}  [opts.actorRole]      - Role (e.g., 'CHECKER', 'MAKER')
 * @param {string}   opts.actionType      - Action type constant
 * @param {object}  [opts.details]        - JSON-serializable details
 * @param {boolean} [opts.isAgent=false]  - Whether action was by an AI agent
 * @param {string}  [opts.agentName]      - Name of the agent (if isAgent)
 * @param {number}  [opts.confidence]     - Agent confidence score
 * @param {string}  [opts.reasoning]      - Agent reasoning text
 * @param {string}  [opts.modelVersion]   - AI model version
 */
async function auditLog(opts) {
    const {
        conn,
        projectId,
        actorName,
        actorRole = null,
        actionType,
        details = null,
        isAgent = false,
        agentName = null,
        confidence = null,
        reasoning = null,
        modelVersion = null
    } = opts;

    const query = `
        INSERT INTO npa_audit_log
            (project_id, actor_name, actor_role, action_type, action_details,
             is_agent_action, agent_name, confidence_score, reasoning, model_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
        projectId,
        actorName,
        actorRole,
        actionType,
        details ? JSON.stringify(details) : null,
        isAgent ? 1 : 0,
        agentName,
        confidence,
        reasoning,
        modelVersion
    ];

    if (conn) {
        await conn.query(query, params);
    } else {
        await db.query(query, params);
    }
}

/**
 * Express middleware factory for auto-auditing mutation requests.
 *
 * Usage:
 *   app.use('/api/approvals', auditMiddleware('APPROVAL'), approvalsRouter);
 *
 * Logs POST/PUT/PATCH/DELETE requests that include :id in params.
 * Captures req.body for action_details.
 * Runs AFTER the response is sent (non-blocking).
 *
 * @param {string} modulePrefix - Prefix for action_type (e.g., 'APPROVAL' → 'APPROVAL_POST')
 */
function auditMiddleware(modulePrefix) {
    return (req, res, next) => {
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return next();
        }

        // Hook into response finish event to log after response is sent
        res.on('finish', () => {
            // Only audit successful mutations (2xx status)
            if (res.statusCode < 200 || res.statusCode >= 300) return;

            const projectId = req.params.id || req.body?.project_id || null;
            if (!projectId) return;

            const actorName = req.body?.actor_name || req.body?.approver_name || 'UNKNOWN';
            const actionType = `${modulePrefix}_${req.method}`;

            // Fire-and-forget audit log (don't block response)
            auditLog({
                projectId,
                actorName,
                actionType,
                details: {
                    path: req.originalUrl,
                    method: req.method,
                    body_keys: Object.keys(req.body || {}),
                    status_code: res.statusCode
                }
            }).catch(err => {
                console.error('[AUDIT-MIDDLEWARE] Failed to log:', err.message);
            });
        });

        next();
    };
}

module.exports = { auditLog, auditMiddleware };
