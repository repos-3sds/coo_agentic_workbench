const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/classification — Get all classification criteria
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ref_classification_criteria ORDER BY weight DESC');
        res.json(rows);
    } catch (err) {
        console.error('[CLASSIFICATION ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/classification/npas/:id — Get classification assessments for an NPA
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, c.criterion_name, c.category, c.weight
            FROM npa_classification_assessments a
            JOIN ref_classification_criteria c ON a.criteria_id = c.id
            WHERE a.project_id = ?
            ORDER BY c.weight DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('[CLASSIFICATION ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/classification/npas/:id/summary — Get classification summary
router.get('/npas/:id/summary', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                p.id, p.npa_type, p.classification_confidence, p.classification_method,
                s.total_score as scorecard_score, s.calculated_tier as recommended_track, s.override_reason,
                COUNT(a.id) as criteria_evaluated,
                AVG(a.score) as avg_score
            FROM npa_projects p
            LEFT JOIN npa_classification_scorecards s ON p.id = s.project_id
            LEFT JOIN npa_classification_assessments a ON p.id = a.project_id
            WHERE p.id = ?
            GROUP BY p.id
        `, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'NPA not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[CLASSIFICATION ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
