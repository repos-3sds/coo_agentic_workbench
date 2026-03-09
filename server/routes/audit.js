const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/audit — All audit log entries (with optional filters)
router.get('/', async (req, res) => {
    try {
        const { project_id, action_type, limit: rowLimit } = req.query;
        let sql = 'SELECT * FROM npa_audit_log';
        const conditions = [];
        const params = [];

        if (project_id) { conditions.push('project_id = ?'); params.push(project_id); }
        if (action_type) { conditions.push('action_type = ?'); params.push(action_type); }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY timestamp DESC';
        sql += ` LIMIT ${parseInt(rowLimit) || 50}`;

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('[AUDIT ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

// GET /api/audit/npas/:id — Audit log for specific NPA
router.get('/npas/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM npa_audit_log WHERE project_id = ? ORDER BY timestamp DESC',
            [req.params.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('[AUDIT ERROR]', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
        res.status(500).json({ error: errorMsg });
    }
});

module.exports = router;
