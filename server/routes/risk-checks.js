const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/risk-checks/npas/:id — Get all risk checks for an NPA
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM npa_risk_checks
            WHERE project_id = ?
            ORDER BY FIELD(check_layer, 'INTERNAL_POLICY', 'REGULATORY', 'SANCTIONS', 'DYNAMIC'), checked_at
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('[RISK-CHECKS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/risk-checks/npas/:id/hard-stops — Get only FAIL results (hard stops)
router.get('/npas/:id/hard-stops', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM npa_risk_checks
            WHERE project_id = ? AND result = 'FAIL'
            ORDER BY checked_at DESC
        `, [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error('[RISK-CHECKS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/risk-checks/prohibited-items — Get all prohibited items reference
router.get('/prohibited-items', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM ref_prohibited_items
            WHERE effective_to IS NULL OR effective_to >= NOW()
            ORDER BY layer, item_name
        `);
        res.json(rows);
    } catch (err) {
        console.error('[RISK-CHECKS ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
