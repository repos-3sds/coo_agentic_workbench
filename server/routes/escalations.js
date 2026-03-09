/**
 * Dispute Resolution / Escalation Queue (GAP-016)
 *
 * Provides endpoints for:
 *   - Escalating issues (SOP party disputes, process blockers)
 *   - Viewing the escalation queue for COO/GPH
 *   - Resolving escalations with decisions
 *   - Getting escalation history for an NPA
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/escalations — All active escalations (COO queue)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, p.title as npa_title, p.npa_type, p.current_stage, p.status as npa_status
            FROM npa_escalations e
            JOIN npa_projects p ON p.id = e.project_id
            WHERE e.status IN ('ACTIVE', 'UNDER_REVIEW')
            ORDER BY e.escalation_level DESC, e.escalated_at ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[ESCALATIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/escalations/npas/:id — Escalations for specific NPA
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_escalations WHERE project_id = ? ORDER BY escalated_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[ESCALATIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/escalations/npas/:id/escalate — Create a new escalation
router.post('/npas/:id/escalate', async (req, res) => {
    const { actor_name, reason, escalation_level, escalate_to } = req.body;
    try {
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required for escalation.' });
        }

        const level = escalation_level || 2;

        // Determine authority based on level
        const [rules] = await db.query(
            `SELECT authority_name FROM ref_escalation_rules WHERE escalation_level = ? LIMIT 1`,
            [level]
        );
        const authority = escalate_to || (rules.length > 0 ? rules[0].authority_name : 'COO');

        await db.query(
            `INSERT INTO npa_escalations (project_id, escalation_level, trigger_type, trigger_detail, escalated_to, escalated_by, status, escalated_at)
             VALUES (?, ?, 'MANUAL_ESCALATION', ?, ?, ?, 'ACTIVE', NOW())`,
            [req.params.id, level, JSON.stringify({ reason }), authority, actor_name || 'SYSTEM']
        );

        // Update project status if high-level escalation
        if (level >= 3) {
            await db.query(
                `UPDATE npa_projects SET status = 'Blocked', updated_at = NOW() WHERE id = ?`,
                [req.params.id]
            );
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'MANUAL_ESCALATION', ?, 0)`,
            [req.params.id, actor_name || 'SYSTEM', JSON.stringify({ reason, level, authority })]
        );

        res.json({ status: 'ESCALATED', level, authority });
    } catch (err) {
        console.error('[ESCALATIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// PUT /api/escalations/:id/resolve — Resolve an escalation
router.put('/:id/resolve', async (req, res) => {
    const { actor_name, resolution, decision } = req.body;
    try {
        if (!resolution) {
            return res.status(400).json({ error: 'Resolution details are required.' });
        }

        const [esc] = await db.query('SELECT * FROM npa_escalations WHERE id = ?', [req.params.id]);
        if (esc.length === 0) return res.status(404).json({ error: 'Escalation not found' });

        await db.query(
            `UPDATE npa_escalations SET status = 'RESOLVED', resolved_at = NOW(), resolution_notes = ?
             WHERE id = ?`,
            [resolution, req.params.id]
        );

        // If the NPA was blocked by this escalation, unblock it
        const projectId = esc[0].project_id;
        const [otherActive] = await db.query(
            `SELECT COUNT(*) as cnt FROM npa_escalations WHERE project_id = ? AND status = 'ACTIVE' AND id != ?`,
            [projectId, req.params.id]
        );

        if (otherActive[0].cnt === 0) {
            // No more active escalations — determine next stage based on decision
            const nextStage = decision === 'PROCEED' ? 'PENDING_SIGN_OFFS' : decision === 'REJECT' ? 'REJECTED' : null;
            if (nextStage) {
                await db.query(
                    `UPDATE npa_projects SET current_stage = ?, status = ?, updated_at = NOW() WHERE id = ? AND current_stage = 'ESCALATED'`,
                    [nextStage, nextStage === 'REJECTED' ? 'Completed' : 'On Track', projectId]
                );
            }
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'ESCALATION_RESOLVED', ?, 0)`,
            [projectId, actor_name || 'COO', JSON.stringify({ escalation_id: req.params.id, resolution, decision })]
        );

        res.json({ status: 'RESOLVED', decision });
    } catch (err) {
        console.error('[ESCALATIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// PUT /api/escalations/:id/review — Mark escalation as under review
router.put('/:id/review', async (req, res) => {
    const { actor_name } = req.body;
    try {
        await db.query(
            `UPDATE npa_escalations SET status = 'UNDER_REVIEW' WHERE id = ? AND status = 'ACTIVE'`,
            [req.params.id]
        );
        res.json({ status: 'UNDER_REVIEW' });
    } catch (err) {
        console.error('[ESCALATIONS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
