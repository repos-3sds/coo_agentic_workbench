
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get All Projects (Dashboard View)
router.get('/projects', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, 
                   GROUP_CONCAT(j.jurisdiction_code) as jurisdictions
            FROM npa_projects p
            LEFT JOIN npa_jurisdictions j ON p.id = j.project_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `);

        // Transform for frontend
        const projects = rows.map(row => ({
            ...row,
            jurisdictions: row.jurisdictions ? row.jurisdictions.split(',') : []
        }));

        res.json(projects);
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Get Readiness Assessment for a Project
router.get('/readiness/:projectId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_intake_assessments WHERE project_id = ?',
            [req.params.projectId]
        );
        res.json(rows);
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Save Readiness Assessment (Simulated Agent Output)
router.post('/readiness', async (req, res) => {
    const { projectId, domain, status, score, findings } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES (?, ?, ?, ?, ?)',
            [projectId, domain, status, score, JSON.stringify(findings)]
        );
        res.json({ id: result.insertId, status: 'SAVED' });
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Get Project Details (Full View)
router.get('/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // Parallel queries for performance
        const [project] = await db.query('SELECT * FROM npa_projects WHERE id = ?', [projectId]);

        if (project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const [jurisdictions] = await db.query('SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = ?', [projectId]);
        const [assessments] = await db.query('SELECT * FROM npa_intake_assessments WHERE project_id = ?', [projectId]);
        const [signoffs] = await db.query('SELECT * FROM npa_signoffs WHERE project_id = ?', [projectId]);
        const [formData] = await db.query('SELECT * FROM npa_form_data WHERE project_id = ?', [projectId]);
        const [conditions] = await db.query('SELECT * FROM npa_post_launch_conditions WHERE project_id = ?', [projectId]);
        const [scorecard] = await db.query('SELECT * FROM npa_classification_scorecards WHERE project_id = ? ORDER BY created_at DESC LIMIT 1', [projectId]);
        const [documents] = await db.query('SELECT * FROM npa_documents WHERE project_id = ?', [projectId]);
        const [breaches] = await db.query('SELECT * FROM npa_breach_alerts WHERE project_id = ?', [projectId]);
        const [metricsRows] = await db.query('SELECT * FROM npa_performance_metrics WHERE project_id = ? ORDER BY snapshot_date DESC LIMIT 1', [projectId]);
        const [loopbacks] = await db.query('SELECT * FROM npa_loop_backs WHERE project_id = ?', [projectId]);
        const [workflowStates] = await db.query('SELECT * FROM npa_workflow_states WHERE project_id = ? ORDER BY started_at', [projectId]);
        const [agentResults] = await db.query('SELECT project_id, agent_type, workflow_run_id, created_at FROM npa_agent_results WHERE project_id = ? ORDER BY created_at', [projectId]);

        // Construct response object matches frontend expectation
        const result = {
            ...project[0],
            jurisdictions: jurisdictions.map(j => j.jurisdiction_code),
            assessments,
            signoffs,
            formData, // Contains product attributes
            postLaunchConditions: conditions,
            scorecard: scorecard[0] || null,
            documents,
            breaches,
            metrics: metricsRows[0] || null,
            loopbacks,
            workflowStates,
            agentResults
        };

        res.json(result);
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Get Classification Scorecard
router.get('/classification/:projectId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_classification_scorecards WHERE project_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.params.projectId]
        );
        res.json(rows[0] || null);
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Get Document Rules (Dynamic Matrix)
router.get('/doc-rules', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ref_document_rules');
        res.json(rows);
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Create New Project (Initiation)
router.post('/projects', async (req, res) => {
    const { title, description, user_id } = req.body;
    const project_id = 'PROJ-' + Date.now(); // Simple ID generation

    try {
        await db.query(
            `INSERT INTO npa_projects (id, title, description, submitted_by, current_stage, npa_type)
             VALUES (?, ?, ?, ?, 'INITIATION', 'PENDING')`,
            [project_id, title, description, user_id || 'system']
        );
        res.json({ id: project_id, status: 'CREATED' });
    } catch (err) {
        console.error(err);
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// Save Classification Result
// SPRINT 0 (GAP-003): NTG products are ALWAYS forced to FULL_NPA track regardless of classifier output
router.post('/classification', async (req, res) => {
    const { projectId, totalScore, calculatedTier, breakdown, overrideReason, approvalTrack } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO npa_classification_scorecards
            (project_id, total_score, calculated_tier, breakdown, override_reason)
            VALUES (?, ?, ?, ?, ?)`,
            [projectId, totalScore, calculatedTier, JSON.stringify(breakdown), overrideReason]
        );

        // Sprint 0 (GAP-003): Determine approval track with NTG→FULL_NPA enforcement
        let finalApprovalTrack = approvalTrack || null;
        let trackOverrideReason = null;

        if (calculatedTier === 'New-to-Group') {
            // NTG MUST use Full NPA — no exceptions per Standard §2.1.1
            if (finalApprovalTrack && finalApprovalTrack !== 'FULL_NPA') {
                trackOverrideReason = `NTG auto-override: classifier suggested ${finalApprovalTrack}, forced to FULL_NPA per Standard §2.1.1`;
                console.warn(`[GAP-003] NTG override for project ${projectId}: ${finalApprovalTrack} → FULL_NPA`);
            }
            finalApprovalTrack = 'FULL_NPA';
        }

        // Also update the main project npa_type and approval_track
        await db.query(
            `UPDATE npa_projects
             SET npa_type = ?, is_cross_border = ?, risk_level = ?, approval_track = ?
             WHERE id = ?`,
            [
                calculatedTier,
                JSON.stringify(breakdown).includes('cross-border') || JSON.stringify(breakdown).includes('international'),
                calculatedTier === 'New-to-Group' ? 'HIGH' : calculatedTier === 'Variation' ? 'MEDIUM' : 'LOW',
                finalApprovalTrack,
                projectId
            ]
        );

        // Log the override to audit trail if it happened
        if (trackOverrideReason) {
            await db.query(
                `INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
                 VALUES (?, 'SYSTEM', 'NTG_TRACK_OVERRIDE', ?, 0)`,
                [projectId, trackOverrideReason]
            );
        }

        res.json({
            id: result.insertId,
            status: 'SAVED',
            approval_track: finalApprovalTrack,
            track_overridden: !!trackOverrideReason,
            override_reason: trackOverrideReason
        });
    } catch (err) {
        console.error('[GOVERNANCE ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
