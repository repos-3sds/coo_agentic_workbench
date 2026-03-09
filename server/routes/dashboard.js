const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/dashboard/kpis — Dashboard KPI metrics
router.get('/kpis', async (req, res) => {
    try {
        // Query live npa_projects table instead of npa_kpi_snapshots
        const [rows] = await db.query(`
            SELECT 
                SUM(estimated_revenue) as pipeline_value,
                COUNT(CASE WHEN status != 'Stopped' AND current_stage NOT IN ('LAUNCHED', 'APPROVED', 'PROHIBITED') THEN 1 END) as active_npas,
                AVG(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED') THEN DATEDIFF(updated_at, created_at) END) as avg_cycle_days,
                COUNT(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED') THEN 1 END) as approvals_completed,
                COUNT(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED', 'PROHIBITED') THEN 1 END) as approvals_total,
                SUM(CASE WHEN predicted_timeline_days > 60 OR status = 'At Risk' THEN 1 ELSE 0 END) as critical_risks
            FROM npa_projects
        `);

        // For the trend, since we don't have historical snapshots anymore, we'll set trend to N/A or derive from a 30-day window.
        // For simplicity, we'll compare against a 30-day trailing window.
        const [historicalRows] = await db.query(`
            SELECT 
                SUM(estimated_revenue) as pipeline_value,
                AVG(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED') THEN DATEDIFF(updated_at, created_at) END) as avg_cycle_days,
                COUNT(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED') THEN 1 END) / NULLIF(COUNT(CASE WHEN current_stage IN ('LAUNCHED', 'APPROVED', 'PROHIBITED') THEN 1 END), 0) * 100 as approval_rate,
                SUM(CASE WHEN predicted_timeline_days > 60 OR status = 'At Risk' THEN 1 ELSE 0 END) as critical_risks
            FROM npa_projects
            WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);

        const current = rows[0] || {};
        const prev = historicalRows[0] || {};

        // Calculate Approval Rate
        const currentApprovalRate = current.approvals_total > 0
            ? (current.approvals_completed / current.approvals_total) * 100
            : 0;

        const prevApprovalRate = prev.approval_rate || 0;

        const kpis = [
            {
                label: 'Pipeline Value',
                value: `$${((current.pipeline_value || 0) / 1000000).toFixed(1)}M`,
                subValue: `${current.active_npas || 0} Active NPAs`,
                trend: prev.pipeline_value ? `${(((current.pipeline_value - prev.pipeline_value) / prev.pipeline_value) * 100).toFixed(0)}% YoY` : 'N/A',
                trendUp: (current.pipeline_value || 0) > (prev.pipeline_value || 0),
                icon: 'DollarSign'
            },
            {
                label: 'Avg Cycle Time',
                value: `${Math.round(current.avg_cycle_days || 0)} Days`,
                subValue: 'From Initiation to Launch',
                trend: prev.avg_cycle_days ? `${(((prev.avg_cycle_days - current.avg_cycle_days) / prev.avg_cycle_days) * 100).toFixed(0)}% improved` : 'N/A',
                trendUp: (current.avg_cycle_days || 0) < (prev.avg_cycle_days || 0),
                icon: 'Clock'
            },
            {
                label: 'Approval Rate',
                value: `${Math.round(currentApprovalRate)}%`,
                subValue: `${current.approvals_completed || 0}/${current.approvals_total || 0} completed`,
                trend: prevApprovalRate ? `${(currentApprovalRate - prevApprovalRate).toFixed(0)}pp vs prev` : 'N/A',
                trendUp: currentApprovalRate > prevApprovalRate,
                icon: 'CheckCircle'
            },
            {
                label: 'Critical Risks',
                value: `${current.critical_risks || 0}`,
                subValue: 'Requiring immediate attention',
                trend: prev.critical_risks ? `${prev.critical_risks - current.critical_risks > 0 ? '-' : '+'}${Math.abs(current.critical_risks - prev.critical_risks)} vs prev` : 'N/A',
                trendUp: (current.critical_risks || 0) < (prev.critical_risks || 0),
                icon: 'AlertTriangle'
            }
        ];
        res.json(kpis);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/pipeline — Pipeline stages distribution
router.get('/pipeline', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT current_stage as stage,
                   COUNT(*) as count,
                   SUM(CASE WHEN status IN ('At Risk', 'Blocked') THEN 1 ELSE 0 END) as risk_count
            FROM npa_projects
            WHERE status != 'Stopped'
            GROUP BY current_stage
            ORDER BY FIELD(current_stage,
              'INITIATION',
              'DISCOVERY',
              'DCE_REVIEW',
              'REVIEW',
              'RISK_ASSESSMENT',
              'PENDING_SIGN_OFFS',
              'SIGN_OFF',
              'PENDING_FINAL_APPROVAL',
              'LAUNCH_PREP',
              'UAT',
              'APPROVED',
              'LAUNCH',
              'LAUNCHED',
              'PIR',
              'MONITORING',
              'PROHIBITED'
            )
        `);
        res.json(rows);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/classification-mix — Classification donut chart data
router.get('/classification-mix', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT npa_type as label, COUNT(*) as count
            FROM npa_projects
            WHERE status != 'Stopped'
            GROUP BY npa_type
        `);
        const colors = { 'New-to-Group': '#6366f1', 'Variation': '#f59e0b', 'Existing': '#10b981', 'NPA Lite': '#3b82f6', 'PROHIBITED': '#ef4444' };
        res.json(rows.map(r => ({ ...r, color: colors[r.label] || '#94a3b8' })));
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/ageing — Ageing analysis buckets
router.get('/ageing', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) <= 7 THEN 1 ELSE 0 END) as '0-7 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) BETWEEN 8 AND 30 THEN 1 ELSE 0 END) as '8-30 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) BETWEEN 31 AND 90 THEN 1 ELSE 0 END) as '31-90 days',
                SUM(CASE WHEN DATEDIFF(NOW(), created_at) > 90 THEN 1 ELSE 0 END) as '90+ days'
            FROM npa_projects
            WHERE current_stage NOT IN ('LAUNCHED', 'APPROVED', 'PROHIBITED')
        `);
        const row = rows[0];
        res.json([
            { label: '0-7 days', count: row['0-7 days'] || 0 },
            { label: '8-30 days', count: row['8-30 days'] || 0 },
            { label: '31-90 days', count: row['31-90 days'] || 0 },
            { label: '90+ days', count: row['90+ days'] || 0 }
        ]);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/clusters — Market cluster data
router.get('/clusters', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                COALESCE(product_category, 'General') as cluster_name,
                COUNT(*) as npa_count,
                -- Mocking growth and intensity based on count for visual effect,
                -- ideally this would be derived from historical comparisons.
                (COUNT(*) * 5) as growth_percent,
                (COUNT(*) * 15) as intensity_percent
            FROM npa_projects
            WHERE product_category IS NOT NULL AND product_category != ''
            GROUP BY product_category
            ORDER BY npa_count DESC
            LIMIT 6
        `);
        // Map to match expected ID field interface
        res.json(rows.map((r, index) => ({ id: index + 1, ...r })));
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/prospects — Product opportunities
router.get('/prospects', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id, 
                title as name, 
                npa_type as theme,
                predicted_approval_likelihood as probability,
                estimated_revenue as estimated_value,
                currency as value_currency,
                current_stage as status
            FROM npa_projects
            WHERE current_stage IN ('INITIATION', 'DISCOVERY', 'IDEATION')
            ORDER BY estimated_revenue DESC
            LIMIT 5
        `);
        res.json(rows);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/revenue — Top revenue NPAs
router.get('/revenue', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, title, estimated_revenue, product_manager, current_stage, status,
                   predicted_approval_likelihood
            FROM npa_projects
            WHERE estimated_revenue > 0
            ORDER BY estimated_revenue DESC
            LIMIT 5
        `);
        res.json(rows);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/dashboard/npa-pool — Full NPA pool for COO dashboard table
router.get('/npa-pool', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.title as productName, p.product_category,
                   GROUP_CONCAT(DISTINCT j.jurisdiction_code) as location,
                   p.pm_team as businessUnit, p.kickoff_date as kickoffDate,
                   p.product_manager as productManager, p.pm_team as pmTeam,
                   p.pac_approval_status as pacApproval,
                   p.proposal_preparer as proposalPreparer,
                   p.template_name as template,
                   p.npa_type as classification,
                   p.current_stage as stage,
                   p.status,
                   DATEDIFF(NOW(), p.created_at) as ageDays,
                   p.notional_amount, p.currency, p.estimated_revenue,
                   p.predicted_approval_likelihood, p.predicted_timeline_days,
                   p.approval_track
            FROM npa_projects p
            LEFT JOIN npa_jurisdictions j ON p.id = j.project_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);
        const pool = rows.map(r => ({
            ...r,
            location: r.location || ''
        }));
        res.json(pool);
    } catch (err) {
        console.error('[DASHBOARD ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
