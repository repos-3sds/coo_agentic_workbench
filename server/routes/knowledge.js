const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/knowledge
// Reads from kb_documents (UI metadata columns). Optional query: ?category=UNIVERSAL|AGENT|WORKFLOW|ALL
router.get('/', async (req, res) => {
    try {
        const category = String(req.query.category || 'ALL').toUpperCase();

        const params = [];
        let sql = `
            SELECT
                doc_id AS id,
                ui_category AS category,
                title,
                description,
                doc_type,
                display_date,
                agent_target,
                icon_name,
                last_synced,
                source_url,
                file_path
            FROM kb_documents
            WHERE ui_category IS NOT NULL
        `;

        if (category && category !== 'ALL') {
            sql += ' AND ui_category = ?';
            params.push(category);
        }

        sql += ' ORDER BY ui_category, COALESCE(updated_at, last_synced) DESC, title';

        try {
            const [rows] = await db.query(sql, params);
            return res.json(rows);
        } catch (qErr) {
            const msg = String(qErr?.message || '');
            // Back-compat: if migration 011 not yet applied, omit file/link columns
            if (msg.includes('Unknown column') || msg.includes('ER_BAD_FIELD_ERROR')) {
                const legacySql = sql
                    .replace(',\n                source_url,\n                file_path', '')
                    .replace(',\n                source_url,\n                file_path', '');
                const [rows] = await db.query(legacySql, params);
                return res.json(rows);
            }
            throw qErr;
        }
    } catch (err) {
        console.error('[KNOWLEDGE] Fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch knowledge documents.' });
    }
});

module.exports = router;
