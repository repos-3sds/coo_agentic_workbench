const express = require('express');
const router = express.Router();
const db = require('../db');

// ─── Fallback users when DB is unavailable ───────────────────────────────────
const FALLBACK_USERS = [
    { id: 1, full_name: 'Sarah Chen', email: 'sarah.chen@bank.com', role: 'Product Manager', department: 'Wealth Management', is_active: true },
    { id: 2, full_name: 'James Wilson', email: 'james.wilson@bank.com', role: 'Risk Analyst', department: 'Risk Management', is_active: true },
    { id: 3, full_name: 'Maria Rodriguez', email: 'maria.rodriguez@bank.com', role: 'Compliance Officer', department: 'Compliance', is_active: true },
    { id: 4, full_name: 'David Kim', email: 'david.kim@bank.com', role: 'Portfolio Manager', department: 'Asset Management', is_active: true },
    { id: 5, full_name: 'Emily Thompson', email: 'emily.thompson@bank.com', role: 'Operations Lead', department: 'Operations', is_active: true }
];

// GET /api/users — List all users (falls back to mock data if DB unavailable)
router.get('/', async (req, res) => {
    try {
        const { role, department } = req.query;
        let sql = 'SELECT * FROM users WHERE is_active = TRUE';
        const params = [];

        if (role) { sql += ' AND role = ?'; params.push(role); }
        if (department) { sql += ' AND department = ?'; params.push(department); }

        sql += ' ORDER BY full_name';
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        // DB unavailable — return fallback users so the UI still works
        console.warn('[USERS] DB unavailable, returning fallback users:', err.message);
        let filtered = FALLBACK_USERS;
        if (req.query.role) filtered = filtered.filter(u => u.role === req.query.role);
        if (req.query.department) filtered = filtered.filter(u => u.department === req.query.department);
        res.json(filtered);
    }
});

// GET /api/users/:id — Single user
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        const fallback = FALLBACK_USERS.find(u => u.id === parseInt(req.params.id));
        if (fallback) return res.json(fallback);
        res.status(404).json({ error: 'User not found' });
    }
});

module.exports = router;
