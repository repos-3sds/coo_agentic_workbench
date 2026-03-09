/**
 * Evergreen Product Management (GAP-009)
 *
 * Evergreen products are pre-approved product types that can be
 * traded same-day under approved limits. They have:
 *   - Pre-approved notional limits per product type
 *   - Annual review requirements
 *   - Usage tracking against approved limits
 *   - Auto-escalation when limits are breached
 *
 * This module provides endpoints for:
 *   - Registering a product as Evergreen
 *   - Tracking daily usage against limits
 *   - Annual review scheduling + completion
 *   - Limit utilization queries
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/evergreen — List all Evergreen products with utilization
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title, p.product_category, p.notional_amount as approved_limit,
                   p.currency, p.current_stage, p.status, p.launched_at,
                   (SELECT COALESCE(SUM(pm.total_volume), 0) FROM npa_performance_metrics pm
                    WHERE pm.project_id = p.id AND pm.snapshot_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                   ) as volume_30d,
                   (SELECT COALESCE(MAX(pm.snapshot_date), p.launched_at) FROM npa_performance_metrics pm
                    WHERE pm.project_id = p.id
                   ) as last_metric_date
            FROM npa_projects p
            WHERE p.approval_track = 'EVERGREEN'
              AND p.current_stage IN ('LAUNCHED', 'APPROVED')
            ORDER BY p.launched_at DESC
        `);

        // Calculate utilization percentage
        const products = rows.map(r => ({
            ...r,
            utilization_pct: r.approved_limit > 0
                ? Math.round((r.volume_30d / r.approved_limit) * 100)
                : 0
        }));

        res.json(products);
    } catch (err) {
        console.error('[EVERGREEN ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/evergreen/:id/record-usage — Record daily usage for an Evergreen product
router.post('/:id/record-usage', async (req, res) => {
    const { volume, pnl, counterparty_exposure, var_utilization } = req.body;
    try {
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [req.params.id]);
        if (project.length === 0) return res.status(404).json({ error: 'Project not found' });
        const npa = project[0];

        if (npa.approval_track !== 'EVERGREEN') {
            return res.status(400).json({ error: 'Product is not on EVERGREEN track' });
        }

        const daysSinceLaunch = npa.launched_at
            ? Math.floor((Date.now() - new Date(npa.launched_at).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

        await db.query(
            `INSERT INTO npa_performance_metrics
             (project_id, days_since_launch, total_volume, realized_pnl, counterparty_exposure, var_utilization, health_status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.params.id,
                daysSinceLaunch,
                volume || 0,
                pnl || 0,
                counterparty_exposure || 0,
                var_utilization || 0,
                (var_utilization || 0) > 80 ? 'critical' : (var_utilization || 0) > 60 ? 'warning' : 'healthy'
            ]
        );

        // Check limit breach
        const approvedLimit = parseFloat(npa.notional_amount) || 0;
        const tradeVolume = parseFloat(volume) || 0;
        let limitBreached = false;

        if (approvedLimit > 0 && tradeVolume > approvedLimit) {
            limitBreached = true;
            // Create breach alert
            const [maxId] = await db.query(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 0) AS max_num FROM npa_breach_alerts"
            );
            const breachId = `BR-${String(maxId[0].max_num + 1).padStart(3, '0')}`;

            await db.query(
                `INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, status)
                 VALUES (?, ?, ?, 'CRITICAL', ?, ?, ?, 'Head of Trading', 'OPEN')`,
                [
                    breachId,
                    req.params.id,
                    `Evergreen Limit Breach: ${npa.title}`,
                    `Daily trading volume ${tradeVolume} exceeds approved limit of ${approvedLimit}`,
                    String(approvedLimit),
                    String(tradeVolume)
                ]
            );

            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'EVERGREEN_LIMIT_BREACH', ?, 0)`,
                [req.params.id, JSON.stringify({ volume: tradeVolume, limit: approvedLimit })]
            );
        }

        res.json({ status: 'RECORDED', limit_breached: limitBreached });
    } catch (err) {
        console.error('[EVERGREEN ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/evergreen/:id/utilization — Get utilization history for an Evergreen product
router.get('/:id/utilization', async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    try {
        const [metrics] = await db.query(`
            SELECT total_volume, realized_pnl, var_utilization, health_status, snapshot_date
            FROM npa_performance_metrics
            WHERE project_id = ? AND snapshot_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY snapshot_date DESC
        `, [req.params.id, days]);

        const [project] = await db.query(
            'SELECT notional_amount, currency FROM npa_projects WHERE id = ?',
            [req.params.id]
        );

        res.json({
            approved_limit: project[0]?.notional_amount || 0,
            currency: project[0]?.currency || 'USD',
            period_days: days,
            metrics
        });
    } catch (err) {
        console.error('[EVERGREEN ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// POST /api/evergreen/:id/annual-review — Record annual review completion
router.post('/:id/annual-review', async (req, res) => {
    const { actor_name, findings, approved, next_review_date } = req.body;
    try {
        await db.query(
            `UPDATE npa_performance_metrics SET next_review_date = ?
             WHERE project_id = ? AND id = (SELECT MAX(id) FROM (SELECT id FROM npa_performance_metrics WHERE project_id = ?) t)`,
            [next_review_date || null, req.params.id, req.params.id]
        );

        await db.query(
            `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
             VALUES (?, ?, 'EVERGREEN_ANNUAL_REVIEW', ?, 0)`,
            [req.params.id, actor_name || 'SYSTEM', JSON.stringify({ findings, approved, next_review_date })]
        );

        res.json({ status: approved ? 'REVIEW_APPROVED' : 'REVIEW_FLAGGED' });
    } catch (err) {
        console.error('[EVERGREEN ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
