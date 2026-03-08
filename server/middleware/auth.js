/**
 * Authentication Middleware (Cross-Cutting)
 *
 * Simple JWT-based auth for the COO Agentic Workbench.
 * - POST /api/auth/login  — accepts { email, password } or { user_id }, returns JWT
 * - GET  /api/auth/me     — returns current user from JWT
 * - POST /api/auth/logout — stateless logout acknowledgement
 *
 * Demo password: MBS@2026  (or leave blank — any password accepted in demo mode)
 * In production this would integrate with MBS SSO / LDAP.
 */

const jwt = require('jsonwebtoken');
const express = require('express');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'coo-workbench-dev-secret-2026';
const JWT_EXPIRY = '7d';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'MBS@2026';

// ─── Fallback demo users (returned when Railway DB is unavailable) ────────────
const FALLBACK_USERS = [
    {
        id: 'usr-001', email: 'sarah.chen@mbs.com', employee_id: 'E10001',
        full_name: 'Sarah Chen', display_name: 'Sarah',
        role: 'MAKER', department: 'Treasury & Markets',
        job_title: 'Vice President, Product Management', location: 'Singapore', is_active: 1
    },
    {
        id: 'usr-002', email: 'james.wilson@mbs.com', employee_id: 'E10002',
        full_name: 'James Wilson', display_name: 'James',
        role: 'CHECKER', department: 'Risk Management Group',
        job_title: 'Director, Risk Analytics', location: 'Singapore', is_active: 1
    },
    {
        id: 'usr-003', email: 'maria.rodriguez@mbs.com', employee_id: 'E10003',
        full_name: 'Maria Rodriguez', display_name: 'Maria',
        role: 'APPROVER', department: 'Legal, Compliance & Secretariat',
        job_title: 'Managing Director, Compliance', location: 'Hong Kong', is_active: 1
    },
    {
        id: 'usr-004', email: 'david.kim@mbs.com', employee_id: 'E10004',
        full_name: 'David Kim', display_name: 'David',
        role: 'COO', department: 'COO Office',
        job_title: 'Chief Operating Officer, GFM', location: 'Singapore', is_active: 1
    },
    {
        id: 'usr-005', email: 'emily.thompson@mbs.com', employee_id: 'E10005',
        full_name: 'Emily Thompson', display_name: 'Emily',
        role: 'ADMIN', department: 'Technology & Operations',
        job_title: 'Platform Administrator', location: 'Singapore', is_active: 1
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email, role: user.role, name: user.full_name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
}

function formatUser(user) {
    return {
        id: user.id,
        email: user.email,
        employee_id: user.employee_id || null,
        full_name: user.full_name,
        display_name: user.display_name || user.full_name.split(' ')[0],
        role: user.role,
        department: user.department,
        job_title: user.job_title,
        location: user.location || null,
    };
}

// ─── authMiddleware ───────────────────────────────────────────────────────────
/**
 * Validates Bearer token, attaches req.user. Non-blocking — if no/invalid
 * token, continues with req.user = null. Use requireAuth() for protected routes.
 */
function authMiddleware() {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }
        try {
            req.user = jwt.verify(authHeader.slice(7), JWT_SECRET);
        } catch {
            req.user = null;
        }
        next();
    };
}

// ─── requireAuth ──────────────────────────────────────────────────────────────
function requireAuth() {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Authentication required' });
        next();
    };
}

// ─── Auth Router ──────────────────────────────────────────────────────────────
const router = express.Router();

// POST /api/auth/login
// Body: { email: string, password?: string } | { user_id: string }
router.post('/login', async (req, res) => {
    const { user_id, email, password } = req.body;

    if (!user_id && !email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // Demo mode: any blank/missing password or DEMO_PASSWORD passes
    const passwordOk = !password || password.trim() === '' || password === DEMO_PASSWORD || password === 'demo';
    if (!passwordOk) {
        return res.status(401).json({ error: `Incorrect password. (Demo: ${DEMO_PASSWORD})` });
    }

    try {
        let user = null;
        if (user_id) {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [user_id]);
            user = rows[0] || null;
        } else {
            const normalized = email.toLowerCase().trim();
            const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [normalized]);
            user = rows[0] || null;
            // Try fallback if not in DB
            if (!user) user = FALLBACK_USERS.find(u => u.email === normalized) || null;
        }

        if (!user) return res.status(401).json({ error: 'User not found or account is inactive.' });

        return res.json({ token: signToken(user), user: formatUser(user) });

    } catch (dbErr) {
        console.warn('[AUTH] DB unavailable, using fallback:', dbErr.message);
        const normalized = (email || '').toLowerCase().trim();
        const user = FALLBACK_USERS.find(u =>
            (user_id && u.id === user_id) || (email && u.email === normalized)
        );
        if (!user) return res.status(401).json({ error: 'User not found.' });
        return res.json({ token: signToken(user), user: formatUser(user) });
    }
});

// GET /api/auth/me — return current user payload from JWT
router.get('/me', authMiddleware(), requireAuth(), async (req, res) => {
    const userId = req.user?.userId;
    const email = req.user?.email;

    try {
        if (userId) {
            const [rows] = await db.query('SELECT * FROM users WHERE id = ? AND is_active = TRUE', [userId]);
            if (rows[0]) return res.json({ user: formatUser(rows[0]) });
        }

        if (email) {
            const normalized = String(email).toLowerCase().trim();
            const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [normalized]);
            if (rows[0]) return res.json({ user: formatUser(rows[0]) });
        }
    } catch (dbErr) {
        console.warn('[AUTH] /me DB unavailable, using fallback:', dbErr.message);
    }

    // Fallback (DB unavailable or user not found): map from known demo users or JWT payload
    const fallback =
        (userId && FALLBACK_USERS.find(u => u.id === userId)) ||
        (email && FALLBACK_USERS.find(u => u.email === String(email).toLowerCase().trim())) ||
        null;

    if (fallback) return res.json({ user: formatUser(fallback) });

    // Last resort: return minimal user derived from token (keeps clients from crashing)
    return res.json({
        user: {
            id: userId || 'unknown',
            email: email || null,
            employee_id: null,
            full_name: req.user?.name || email || 'Unknown',
            display_name: req.user?.name || null,
            role: req.user?.role || 'UNKNOWN',
            department: 'Unknown',
            job_title: 'Unknown',
            location: null,
        },
    });
});

// POST /api/auth/logout — stateless, client discards token
router.post('/logout', (_req, res) => {
    res.json({ message: 'Logged out' });
});

module.exports = { authMiddleware, requireAuth, signToken, router };
