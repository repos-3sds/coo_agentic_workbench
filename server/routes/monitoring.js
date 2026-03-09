const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/monitoring/breaches — All active breach alerts
router.get('/breaches', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT b.*, p.title as project_title, p.product_category
            FROM npa_breach_alerts b
            JOIN npa_projects p ON b.project_id = p.id
            ORDER BY FIELD(b.severity, 'CRITICAL', 'WARNING', 'INFO'), b.triggered_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[MONITORING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/monitoring/products — All launched products with metrics
router.get('/products', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title, p.product_category, p.launched_at, p.pir_status, p.pir_due_date,
                   p.notional_amount, p.currency, p.status,
                   m.days_since_launch, m.total_volume, m.realized_pnl, m.active_breaches,
                   m.counterparty_exposure, m.var_utilization, m.collateral_posted,
                   m.next_review_date, m.health_status
            FROM npa_projects p
            LEFT JOIN npa_performance_metrics m ON p.id = m.project_id
            WHERE p.current_stage = 'LAUNCHED' OR m.id IS NOT NULL
            ORDER BY m.health_status DESC, p.launched_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('[MONITORING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/monitoring/npas/:id/breaches — Breaches for specific NPA
router.get('/npas/:id/breaches', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_breach_alerts WHERE project_id = ? ORDER BY triggered_at DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[MONITORING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/monitoring/npas/:id/metrics — Performance metrics for specific NPA
router.get('/npas/:id/metrics', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_performance_metrics WHERE project_id = ? ORDER BY snapshot_date DESC LIMIT 1',
            [req.params.id]
        );
        res.json(rows[0] || null);
    } catch (err) {
        console.error('[MONITORING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/monitoring/summary — Aggregate monitoring KPIs
router.get('/summary', async (req, res) => {
    try {
        const [[breachStats]] = await db.query(`
            SELECT COUNT(*) as total_breaches,
                   SUM(CASE WHEN status != 'RESOLVED' THEN 1 ELSE 0 END) as active_breaches,
                   AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, triggered_at, resolved_at) END) as avg_resolution_hours
            FROM npa_breach_alerts
        `);
        const [[escalationStats]] = await db.query(`
            SELECT COUNT(*) as total_escalations,
                   SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as open_escalations
            FROM npa_escalations
        `);
        const [[launchedStats]] = await db.query(`
            SELECT COUNT(*) as launched_count FROM npa_projects WHERE current_stage = 'LAUNCHED'
        `);
        const [[allLaunchedStats]] = await db.query(`
            SELECT COUNT(*) as total_launched FROM npa_performance_metrics
        `);
        res.json({
            activeBreaches: parseInt(breachStats.active_breaches) || 0,
            totalBreaches: parseInt(breachStats.total_breaches) || 0,
            avgResolutionHours: parseFloat(breachStats.avg_resolution_hours) || 0,
            openEscalations: parseInt(escalationStats.open_escalations) || 0,
            totalEscalations: parseInt(escalationStats.total_escalations) || 0,
            launchedProducts: parseInt(allLaunchedStats.total_launched) || parseInt(launchedStats.launched_count) || 0
        });
    } catch (err) {
        console.error('[MONITORING ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
