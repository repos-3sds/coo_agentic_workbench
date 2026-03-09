const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');

function _isPlaceholderIdentity(val) {
    if (!val) return true;
    const s = String(val).trim().toLowerCase();
    if (!s) return true;
    return s === 'current_user' || s === 'user-123' || s === 'default-user' || s === 'anonymous';
}

function getApproverIdentity(req, body, fallbackParty) {
    if (req.user?.userId) {
        return {
            approverUserId: String(req.user.userId),
            approverName: String(req.user.name || req.user.email || fallbackParty || 'Unknown'),
        };
    }

    const bodyUserId = body?.approver_user_id;
    const bodyName = body?.approver_name || body?.actor_name;

    return {
        approverUserId: _isPlaceholderIdentity(bodyUserId) ? null : String(bodyUserId),
        approverName: _isPlaceholderIdentity(bodyName) ? String(fallbackParty || 'Unknown') : String(bodyName),
    };
}

// ============================================================
// SPRINT 0: COMPLIANCE GUARDS (GAP-001, GAP-002)
// These guards prevent prohibited products from advancing
// and enforce PAC approval for New-to-Group products.
// ============================================================

/**
 * GAP-001: Prohibited Hard Stop Guard
 * Checks npa_risk_checks for any FAIL result before allowing stage transitions.
 * If a prohibited check failed, the NPA cannot advance past INITIATION.
 */
async function checkProhibitedGate(projectId) {
    const [failedChecks] = await db.query(
        `SELECT check_layer, result, matched_items
         FROM npa_risk_checks
         WHERE project_id = ? AND result = 'FAIL'`,
        [projectId]
    );
    if (failedChecks.length > 0) {
        return {
            blocked: true,
            reason: 'Prohibited product cannot proceed. Risk check FAIL detected.',
            failedLayers: failedChecks.map(c => c.check_layer),
            matchedItems: failedChecks.map(c => c.matched_items)
        };
    }
    return { blocked: false };
}

/**
 * GAP-002: PAC Gate for New-to-Group
 * NTG products require pac_approval_status = 'Approved' before advancing from DRAFT.
 */
async function checkPacGate(projectId) {
    const [rows] = await db.query(
        `SELECT npa_type, pac_approval_status
         FROM npa_projects
         WHERE id = ?`,
        [projectId]
    );
    if (rows.length === 0) {
        return { blocked: true, reason: 'Project not found' };
    }
    const project = rows[0];
    if (project.npa_type === 'New-to-Group' && project.pac_approval_status !== 'Approved') {
        return {
            blocked: true,
            reason: 'PAC approval required before NPA can proceed for New-to-Group products. Current PAC status: ' + (project.pac_approval_status || 'N/A')
        };
    }
    return { blocked: false };
}

/**
 * Middleware: Apply compliance gates before any stage transition.
 * Used by sign-off decision endpoint and will be used by future transition endpoints (Sprint 1).
 */
async function enforceComplianceGates(projectId) {
    // Gate 1: Prohibited check
    const prohibitedResult = await checkProhibitedGate(projectId);
    if (prohibitedResult.blocked) return prohibitedResult;

    // Gate 2: PAC gate for NTG
    const pacResult = await checkPacGate(projectId);
    if (pacResult.blocked) return pacResult;

    return { blocked: false };
}

// RBAC baseline: approvals endpoints are authenticated.
router.use(requireAuth());

// GET /api/approvals — All pending approval items (for approval dashboard)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title, p.description, p.submitted_by, p.risk_level,
                   p.npa_type, p.current_stage, p.status, p.created_at,
                   p.notional_amount, p.currency, p.approval_track,
                   COALESCE(so.pending_signoffs, 0) as pending_signoffs,
                   COALESCE(so.completed_signoffs, 0) as completed_signoffs,
                   COALESCE(so.total_signoffs, 0) as total_signoffs
            FROM npa_projects p
            LEFT JOIN (
                SELECT project_id,
                       SUM(status IN ('PENDING','UNDER_REVIEW','CLARIFICATION_NEEDED')) as pending_signoffs,
                       SUM(status = 'APPROVED') as completed_signoffs,
                       COUNT(*) as total_signoffs
                FROM npa_signoffs
                GROUP BY project_id
            ) so ON so.project_id = p.id
            WHERE p.current_stage IN ('PENDING_CHECKER', 'PENDING_SIGN_OFFS', 'PENDING_FINAL_APPROVAL', 'DCE_REVIEW', 'RISK_ASSESSMENT', 'RETURNED_TO_MAKER', 'ESCALATED')
              AND p.status != 'Stopped'
            ORDER BY p.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/approvals/npas/:id/signoffs — Sign-offs for specific NPA
router.get('/npas/:id/signoffs', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_signoffs WHERE project_id = ? ORDER BY created_at',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/approvals/npas/:id/loopbacks — Loop-backs for specific NPA
router.get('/npas/:id/loopbacks', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_loop_backs WHERE project_id = ? ORDER BY loop_back_number',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/approvals/npas/:id/comments — Comments for specific NPA
router.get('/npas/:id/comments', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_comments WHERE project_id = ? ORDER BY created_at',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/approvals/npas/:id/comments — Add comment
router.post('/npas/:id/comments', async (req, res) => {
    const { comment_type, comment_text, author_name, author_role } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, comment_type, comment_text, author_name, author_role]
        );
        res.json({ id: result.insertId, status: 'CREATED' });
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/approvals/npas/:id/signoffs/:party/decide — Make sign-off decision
// SPRINT 0: Now enforces compliance gates before allowing any sign-off decision
router.post('/npas/:id/signoffs/:party/decide', rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    const { decision, comments } = req.body;
    try {
        // Sprint 0: Enforce compliance gates before any approval action
        const gateResult = await enforceComplianceGates(req.params.id);
        if (gateResult.blocked) {
            return res.status(403).json({
                error: gateResult.reason,
                gate: 'COMPLIANCE_BLOCK',
                details: gateResult
            });
        }

        const { approverUserId, approverName } = getApproverIdentity(req, req.body, req.params.party);

        await db.query(
            `UPDATE npa_signoffs
             SET status = ?, decision_date = NOW(), comments = ?, approver_user_id = ?, approver_name = ?
             WHERE project_id = ? AND party = ?`,
            [decision, comments, approverUserId, approverName, req.params.id, req.params.party]
        );

        // Sprint 1: Auto-advance to PENDING_FINAL_APPROVAL when all parties approved
        let allComplete = false;
        if (decision === 'APPROVED' || decision === 'APPROVED_CONDITIONAL') {
            // Lazy require to avoid circular dependency (transitions.js imports from this file)
            const { checkAllSignoffsComplete } = require('./transitions');
            allComplete = await checkAllSignoffsComplete(req.params.id);
        }

        res.json({ status: 'UPDATED', all_signoffs_complete: allComplete });
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// ============================================================
// SPRINT 4: Conditional Approval Support (GAP-015)
// Allows "Approve with Conditions" — saves conditions to
// npa_post_launch_conditions and marks signoff as APPROVED_CONDITIONAL
// ============================================================

// POST /api/approvals/npas/:id/signoffs/:party/approve-conditional
router.post('/npas/:id/signoffs/:party/approve-conditional', rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    const { comments, conditions } = req.body;
    try {
        if (!Array.isArray(conditions) || conditions.length === 0) {
            return res.status(400).json({ error: 'At least one condition is required for conditional approval.' });
        }

        // Enforce compliance gates
        const gateResult = await enforceComplianceGates(req.params.id);
        if (gateResult.blocked) {
            return res.status(403).json({ error: gateResult.reason, gate: 'COMPLIANCE_BLOCK', details: gateResult });
        }

        const { approverUserId, approverName } = getApproverIdentity(req, req.body, req.params.party);

        // Update signoff to APPROVED_CONDITIONAL
        await db.query(
            `UPDATE npa_signoffs
             SET status = 'APPROVED_CONDITIONAL', decision_date = NOW(), comments = ?,
                 approver_user_id = ?, approver_name = ?
             WHERE project_id = ? AND party = ?`,
            [comments || 'Approved with conditions', approverUserId, approverName, req.params.id, req.params.party]
        );

        // Save conditions to npa_post_launch_conditions
        for (const cond of conditions) {
            await db.query(
                `INSERT INTO npa_post_launch_conditions (project_id, condition_text, owner_party, due_date, status)
                 VALUES (?, ?, ?, ?, 'PENDING')`,
                [req.params.id, cond.text || cond.condition_text, cond.owner || req.params.party, cond.due_date || null]
            );
        }

        // Check if all signoffs now complete
        const { checkAllSignoffsComplete } = require('./transitions');
        const allComplete = await checkAllSignoffsComplete(req.params.id);

        // Audit log
        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'CONDITIONAL_APPROVAL', ?, 0)`,
            [req.params.id, approverName || req.params.party, JSON.stringify({
                party: req.params.party, condition_count: conditions.length, comments
            })]
        );

        res.json({
            status: 'APPROVED_CONDITIONAL',
            conditions_saved: conditions.length,
            all_signoffs_complete: allComplete
        });
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/approvals/npas/:id/conditions — Get post-launch conditions for an NPA
router.get('/npas/:id/conditions', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_post_launch_conditions WHERE project_id = ? ORDER BY due_date',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// PUT /api/approvals/npas/:id/conditions/:condId — Update condition status
router.put('/npas/:id/conditions/:condId', rbac('APPROVER', 'COO', 'ADMIN'), async (req, res) => {
    const { status } = req.body;
    try {
        const validStatuses = ['PENDING', 'MET', 'WAIVED', 'OVERDUE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }
        await db.query(
            'UPDATE npa_post_launch_conditions SET status = ? WHERE id = ? AND project_id = ?',
            [status, req.params.condId, req.params.id]
        );
        res.json({ status: 'UPDATED' });
    } catch (err) {
        console.error('[APPROVALS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Export router + compliance gate functions for reuse in transitions.js (Sprint 1)
module.exports = router;
module.exports.checkProhibitedGate = checkProhibitedGate;
module.exports.checkPacGate = checkPacGate;
module.exports.enforceComplianceGates = enforceComplianceGates;
