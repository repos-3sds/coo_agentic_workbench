const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// Demo credentials map — employee_id or email → demo password
// In production this would be LDAP / SSO / bcrypt
const DEMO_PASSWORD = 'MBS@2026'; // universal demo password for all users

// Fallback users when DB down
const FALLBACK_USERS = [
    { id: 'usr-001', email: 'sarah.chen@mbs.com', employee_id: 'E10001', full_name: 'Sarah Chen', display_name: 'Sarah', role: 'MAKER', department: 'Treasury & Markets', job_title: 'Product Manager', location: 'Singapore' },
    { id: 'usr-002', email: 'james.wilson@mbs.com', employee_id: 'E10002', full_name: 'James Wilson', display_name: 'James', role: 'CHECKER', department: 'Risk Management', job_title: 'Senior Risk Analyst', location: 'Singapore' },
    { id: 'usr-003', email: 'maria.rodriguez@mbs.com', employee_id: 'E10003', full_name: 'Maria Rodriguez', display_name: 'Maria', role: 'APPROVER', department: 'Legal, Compliance & Secretariat', job_title: 'Compliance Director', location: 'Hong Kong' },
    { id: 'usr-004', email: 'david.kim@mbs.com', employee_id: 'E10004', full_name: 'David Kim', display_name: 'David', role: 'COO', department: 'COO Office', job_title: 'Chief Operating Officer', location: 'Singapore' },
    { id: 'usr-005', email: 'emily.thompson@mbs.com', employee_id: 'E10005', full_name: 'Emily Thompson', display_name: 'Emily', role: 'ADMIN', department: 'Technology & Operations', job_title: 'Platform Administrator', location: 'Singapore' },
];

function generateToken(user) {
    // Lightweight demo JWT-style token (base64 payload + HMAC signature)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
    })).toString('base64url');
    const secret = process.env.JWT_SECRET || 'mbs-coo-workbench-demo-secret-2026';
    const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${sig}`;
}

// POST /api/auth/login
// Body: { email, password } OR { user_id, password }
router.post('/login', async (req, res) => {
    const { email, user_id, password } = req.body;

    // Validate we have at least one identifier
    if (!email && !user_id) {
        return res.status(400).json({ error: 'Email or user_id is required' });
    }

    // Accept any password in demo mode, or validate against DEMO_PASSWORD
    const passwordOk = !password || password === DEMO_PASSWORD || password === 'demo';

    try {
        let user = null;
        if (user_id) {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [user_id]);
            user = rows[0] || null;
        } else if (email) {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email.toLowerCase().trim()]);
            user = rows[0] || null;
        }

        if (!user) {
            // Try fallback users
            user = FALLBACK_USERS.find(u =>
                (user_id && u.id === user_id) ||
                (email && u.email === email.toLowerCase().trim())
            ) || null;
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials. User not found.' });
        }

        if (!passwordOk) {
            return res.status(401).json({ error: 'Invalid password. Demo password: MBS@2026' });
        }

        const token = generateToken(user);
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                display_name: user.display_name || user.full_name.split(' ')[0],
                role: user.role,
                department: user.department,
                job_title: user.job_title,
                location: user.location,
                employee_id: user.employee_id,
            }
        });
    } catch (err) {
        console.error('[AUTH] DB error, using fallback:', err.message);
        // Fallback: try in-memory users
        const user = FALLBACK_USERS.find(u =>
            (user_id && u.id === user_id) ||
            (email && u.email === email.toLowerCase().trim())
        );
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const token = generateToken(user);
        return res.json({ token, user });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    // Stateless JWT — client just discards token
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me — verify current token
router.get('/me', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = auth.slice(7);
    try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (payload.exp < Math.floor(Date.now() / 1000)) return res.status(401).json({ error: 'Token expired' });
        res.json({ user_id: payload.sub, email: payload.email, role: payload.role });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
