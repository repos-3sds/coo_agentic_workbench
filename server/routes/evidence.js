const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/evidence
// Reads from evidence_library. Optional query: ?type=PRECEDENTS|AUDITS|EXCEPTIONS|ALL
router.get('/', async (req, res) => {
    try {
        const type = String(req.query.type || 'ALL').toUpperCase();

        const params = [];
        let sql = `
            SELECT
                record_id,
                title,
                description,
                event_date,
                display_date,
                evidence_type,
                relevance_score,
                status,
                icon_name
            FROM evidence_library
            WHERE 1=1
        `;

        if (type && type !== 'ALL') {
            sql += ' AND evidence_type = ?';
            params.push(type);
        }

        sql += ' ORDER BY COALESCE(event_date, created_at) DESC, record_id';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('[EVIDENCE] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch evidence library.' });
    }
});

module.exports = router;

