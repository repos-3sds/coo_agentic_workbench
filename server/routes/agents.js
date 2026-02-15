const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/agents/sessions — Get recent agent sessions (optionally filtered by project)
router.get('/sessions', async (req, res) => {
    try {
        const { project_id } = req.query;
        let sql = 'SELECT * FROM agent_sessions';
        const params = [];

        if (project_id) {
            sql += ' WHERE project_id = ?';
            params.push(project_id);
        }

        sql += ' ORDER BY started_at DESC LIMIT 50';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/sessions/:id/messages — Get messages for a specific agent session
router.get('/sessions/:id/messages', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY timestamp',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/routing — Get agent routing decisions for an NPA
router.get('/npas/:id/routing', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_agent_routing_decisions WHERE project_id = ? ORDER BY decided_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/escalations — Get escalations for an NPA
router.get('/npas/:id/escalations', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_escalations WHERE project_id = ? ORDER BY escalated_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/external-parties — Get external parties for an NPA
router.get('/npas/:id/external-parties', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_external_parties WHERE project_id = ? ORDER BY party_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/market-risk-factors — Get market risk factors for an NPA
router.get('/npas/:id/market-risk-factors', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_market_risk_factors WHERE project_id = ? ORDER BY risk_factor',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/monitoring-thresholds — Get monitoring thresholds
router.get('/npas/:id/monitoring-thresholds', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_monitoring_thresholds WHERE project_id = ? ORDER BY metric_name',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/post-launch-conditions — Get post-launch conditions
router.get('/npas/:id/post-launch-conditions', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_post_launch_conditions WHERE project_id = ? ORDER BY due_date',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/npas/:id/documents/requirements — Get document requirements and uploaded documents
router.get('/npas/:id/documents/requirements', async (req, res) => {
    try {
        const [requirements] = await db.query(`
            SELECT * FROM ref_document_requirements
            ORDER BY required_by_stage, order_index
        `);
        const [documents] = await db.query(`
            SELECT * FROM npa_documents
            WHERE project_id = ?
            ORDER BY uploaded_at DESC
        `, [req.params.id]);
        res.json({ requirements, documents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/agents/notifications — Get aggregated notifications (breaches + SLA warnings + escalations)
router.get('/notifications', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 'BREACH' as type, id, project_id, title, severity, triggered_at as created_at, status
            FROM npa_breach_alerts WHERE status != 'RESOLVED'
            UNION ALL
            SELECT 'SLA_WARNING' as type, id, project_id, CONCAT(party, ' SLA Breach') as title, 'WARNING' as severity, created_at, 'OPEN' as status
            FROM npa_signoffs WHERE sla_breached = TRUE AND status NOT IN ('APPROVED','REJECTED')
            UNION ALL
            SELECT 'ESCALATION' as type, id, project_id, trigger_detail as title, escalation_level as severity, escalated_at as created_at, status
            FROM npa_escalations WHERE status != 'RESOLVED'
            ORDER BY created_at DESC
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
