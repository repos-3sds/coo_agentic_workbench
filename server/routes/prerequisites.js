const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/prerequisites/categories — Get all prerequisite categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ref_prerequisite_categories ORDER BY order_index');
        res.json(rows);
    } catch (err) {
        console.error('[PREREQUISITES ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/prerequisites/checks — Get all prerequisite checks (with category name)
router.get('/checks', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, cat.category_name
            FROM ref_prerequisite_checks c
            JOIN ref_prerequisite_categories cat ON c.category_id = cat.id
            ORDER BY cat.order_index, c.order_index
        `);
        res.json(rows);
    } catch (err) {
        console.error('[PREREQUISITES ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/prerequisites/npas/:id — Get prerequisite results for an NPA with check details
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, c.check_name, c.description as check_description, c.mandatory_for, c.is_critical,
                   cat.category_name
            FROM npa_prerequisite_results r
            JOIN ref_prerequisite_checks c ON r.check_id = c.id
            JOIN ref_prerequisite_categories cat ON c.category_id = cat.id
            WHERE r.project_id = ?
            ORDER BY cat.order_index, c.order_index
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('[PREREQUISITES ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/prerequisites/npas/:id/summary — Get prerequisite summary (pass/fail/pending counts)
router.get('/npas/:id/summary', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN r.status = 'PASS' THEN 1 ELSE 0 END) as passed,
                SUM(CASE WHEN r.status = 'FAIL' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN r.status = 'WAIVED' THEN 1 ELSE 0 END) as waived,
                SUM(CASE WHEN r.status = 'N/A' THEN 1 ELSE 0 END) as not_applicable
            FROM npa_prerequisite_results r
            WHERE r.project_id = ?
        `, [req.params.id]);
        res.json(rows[0]);
    } catch (err) {
        console.error('[PREREQUISITES ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
