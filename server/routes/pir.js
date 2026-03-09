/**
 * PIR (Post-Implementation Review) Workflow (GAP-011)
 *
 * Manages the PIR lifecycle for launched NPA products:
 *   - Auto-scheduled on launch (6 months for NTG, 12 months for others)
 *   - PIR submission with review findings
 *   - PIR approval by COO/designated authority
 *   - Extension requests for deferred reviews
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/pir/pending — All NPAs with pending PIR
router.get('/pending', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title, p.npa_type, p.pir_status, p.pir_due_date,
                   p.launched_at, p.submitted_by, p.product_manager,
                   DATEDIFF(p.pir_due_date, NOW()) as days_remaining
            FROM npa_projects p
            WHERE p.pir_status IN ('PENDING', 'SUBMITTED', 'OVERDUE')
              AND p.current_stage = 'LAUNCHED'
            ORDER BY p.pir_due_date ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[PIR ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/pir/:id — PIR details for a specific NPA
router.get('/:id', async (req, res) => {
    try {
        const [project] = await db.query(
            'SELECT id, title, npa_type, pir_status, pir_due_date, launched_at, product_manager FROM npa_projects WHERE id = ?',
            [req.params.id]
        );
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });

        const [conditions] = await db.query(
            'SELECT * FROM npa_post_launch_conditions WHERE project_id = ? ORDER BY due_date',
            [req.params.id]
        );
        const [metrics] = await db.query(
            'SELECT * FROM npa_performance_metrics WHERE project_id = ? ORDER BY period_start DESC LIMIT 20',
            [req.params.id]
        );

        res.json({ project: project[0], conditions, metrics });
    } catch (err) {
        console.error('[PIR ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/pir/:id/submit — Submit PIR review
router.post('/:id/submit', async (req, res) => {
    const { actor_name, findings, recommendation, conditions_met } = req.body;
    try {
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [req.params.id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });

        if (project[0].pir_status !== 'PENDING' && project[0].pir_status !== 'OVERDUE') {
            return res.status(400).json({ error: `Cannot submit PIR from status '${project[0].pir_status}'` });
        }

        await db.query(
            `UPDATE npa_projects SET pir_status = 'SUBMITTED', updated_at = NOW() WHERE id = ?`,
            [req.params.id]
        );

        // Update post-launch condition statuses
        if (Array.isArray(conditions_met)) {
            for (const condId of conditions_met) {
                await db.query(
                    `UPDATE npa_post_launch_conditions SET status = 'MET' WHERE id = ? AND project_id = ?`,
                    [condId, req.params.id]
                );
            }
        }

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'PIR_SUBMITTED', ?, 0)`,
            [req.params.id, actor_name || 'SYSTEM', JSON.stringify({ findings, recommendation })]
        );

        res.json({ status: 'PIR_SUBMITTED' });
    } catch (err) {
        console.error('[PIR ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/pir/:id/approve — Approve PIR (completes the PIR cycle)
router.post('/:id/approve', async (req, res) => {
    const { actor_name, comments } = req.body;
    try {
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [req.params.id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });

        if (project[0].pir_status !== 'SUBMITTED') {
            return res.status(400).json({ error: `Cannot approve PIR from status '${project[0].pir_status}'` });
        }

        await db.query(
            `UPDATE npa_projects SET pir_status = 'COMPLETED', updated_at = NOW() WHERE id = ?`,
            [req.params.id]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'PIR_APPROVED', ?, 0)`,
            [req.params.id, actor_name || 'COO', JSON.stringify({ comments })]
        );

        res.json({ status: 'PIR_COMPLETED' });
    } catch (err) {
        console.error('[PIR ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/pir/:id/extend — Request PIR extension
router.post('/:id/extend', async (req, res) => {
    const { actor_name, reason, extension_months } = req.body;
    try {
        const months = extension_months || 3;
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [req.params.id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });

        await db.query(
            `UPDATE npa_projects SET pir_due_date = DATE_ADD(pir_due_date, INTERVAL ? MONTH), updated_at = NOW() WHERE id = ?`,
            [months, req.params.id]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'PIR_EXTENDED', ?, 0)`,
            [req.params.id, actor_name || 'SYSTEM', JSON.stringify({ reason, extension_months: months })]
        );

        res.json({ status: 'PIR_EXTENDED', new_extension_months: months });
    } catch (err) {
        console.error('[PIR ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
