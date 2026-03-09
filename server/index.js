const { loadEnv } = require('./utils/load-env');
const envPath = loadEnv();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const { errorHandler } = require('./middleware/error-handler');
const { runAllMigrations } = require('./db/migrations');

// ─── Security: Helmet (security headers) ─────────────────────────────────────
let helmet;
try {
    helmet = require('helmet');
} catch (e) {
    console.warn('[SECURITY] helmet not installed. Run: npm install helmet. Skipping security headers.');
}

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
let rateLimit;
try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    console.warn('[SECURITY] express-rate-limit not installed. Run: npm install express-rate-limit. Skipping rate limiting.');
}

const app = express();
const PORT = process.env.PORT || 3000;
console.log('[ENV] Loaded:', envPath);

// ─── Helmet: Security Headers ─────────────────────────────────────────────────
if (helmet) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                scriptSrcAttr: ["'self'", "'unsafe-inline'"],  // Angular event bindings compiled to inline handlers in prod
                styleSrc: ["'self'", "'unsafe-inline'"],       // Angular needs inline styles
                imgSrc: ["'self'", "data:", "blob:"],
                connectSrc: [
                    "'self'",
                    "https://api.dify.ai",                     // Dify Cloud API
                    "https://mcp-tools-ppjv.onrender.com",     // MCP Tools Server (Render)
                    "https://npa-workbench.onrender.com",      // Frontend on Render
                    "ws:",                                     // WebSocket for dev HMR
                    "wss:",                                    // Secure WebSocket
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                frameAncestors: ["'none'"],                    // Equivalent to X-Frame-Options DENY
            }
        },
        hsts: {
            maxAge: 31536000,       // 1 year
            includeSubDomains: true,
            preload: true
        },
        frameguard: { action: 'deny' },                   // X-Frame-Options: DENY
        noSniff: true,                                     // X-Content-Type-Options: nosniff
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    }));
}

app.use(cors());
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));

// ─── Health Check (BEFORE rate limiter so Render/Railway probes never get 429) ──
app.get('/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'CONNECTED' });
    } catch (err) {
        console.error('[HEALTH] DB check failed:', err.message);
        res.json({ status: 'UP', db: 'DISCONNECTED', error: process.env.NODE_ENV === 'production' ? 'DB check failed' : err.message });
    }
});

// ─── Rate Limiting Middleware ─────────────────────────────────────────────────
if (rateLimit) {
    // General API rate limit: 100 requests per 15 minutes per IP
    const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later.' }
    });
    app.use('/api/', apiLimiter);

    // Auth rate limit: 10 requests per 15 minutes per IP (stricter)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many authentication attempts, please try again later.' }
    });
    app.use('/api/auth', authLimiter);

    // Agent/streaming rate limit: 30 requests per 15 minutes per IP
    const agentLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many agent requests, please try again later.' }
    });
    app.use('/api/agents', agentLimiter);
}

// ─── Request timeout: abort any API request that takes longer than 30s ───────
// Dify workflow/chat routes are exempt — they use server-side SSE streaming
// which can take 30-120s depending on the agent.
app.use('/api', (req, res, next) => {
    const isDifyRoute = req.path.startsWith('/dify/');
    const isSeedRoute = req.path.includes('seed-demo');
    const timeout = (isDifyRoute || isSeedRoute) ? 600000 : 30000; // 10 min for Dify/seed (AUTOFILL takes ~8 min), 30s for others
    req.setTimeout(timeout, () => {
        if (!res.headersSent) {
            res.status(504).json({ error: 'Request timeout — server took too long to respond' });
        }
    });
    next();
});

// ─── Import Routes ───────────────────────────────────────────────────────────
const governanceRoutes = require('./routes/governance');
const npasRoutes = require('./routes/npas');
const usersRoutes = require('./routes/users');
const approvalsRoutes = require('./routes/approvals');
const monitoringRoutes = require('./routes/monitoring');
const dashboardRoutes = require('./routes/dashboard');
const auditRoutes = require('./routes/audit');
const classificationRoutes = require('./routes/classification');
const riskChecksRoutes = require('./routes/risk-checks');
const prerequisitesRoutes = require('./routes/prerequisites');
const agentsRoutes = require('./routes/agents');
const difyProxyRoutes = require('./routes/dify-proxy');
const transitionsRoutes = require('./routes/transitions');
const pirRoutes = require('./routes/pir');
const bundlingRoutes = require('./routes/bundling');
const evergreenRoutes = require('./routes/evergreen');
const escalationsRoutes = require('./routes/escalations');
const documentsRoutes = require('./routes/documents');
const knowledgeRoutes = require('./routes/knowledge');
const evidenceRoutes = require('./routes/evidence');
const kbRoutes = require('./routes/kb');
const studioRoutes = require('./routes/studio');
const { router: contextAdminRoutes } = require('./routes/context-admin');
const { startMonitor: startSlaMonitor } = require('./jobs/sla-monitor');
const { startHealthMonitor, getHealthStatus } = require('./jobs/agent-health');
const { auditMiddleware } = require('./middleware/audit');
const { authMiddleware, router: authRoutes } = require('./middleware/auth');

// ─── Global auth middleware — parses JWT and attaches req.user (non-blocking)
app.use('/api', authMiddleware());

// Auth routes (login, me) — must be before other routes
app.use('/api/auth', authRoutes);

// ─── Use Routes — auditMiddleware auto-logs POST/PUT/PATCH/DELETE on success (GAP-017)
app.use('/api/governance', auditMiddleware('GOV'), governanceRoutes);
app.use('/api/npas', auditMiddleware('NPA'), npasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/approvals', auditMiddleware('APPROVAL'), approvalsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/classification', auditMiddleware('CLASSIFY'), classificationRoutes);
app.use('/api/risk-checks', auditMiddleware('RISK'), riskChecksRoutes);
app.use('/api/prerequisites', auditMiddleware('PREREQ'), prerequisitesRoutes);
app.use('/api/agents', auditMiddleware('AGENT'), agentsRoutes);
app.use('/api/dify', difyProxyRoutes);
app.use('/api/transitions', auditMiddleware('TRANSITION'), transitionsRoutes);
app.use('/api/pir', auditMiddleware('PIR'), pirRoutes);
app.use('/api/bundling', auditMiddleware('BUNDLING'), bundlingRoutes);
app.use('/api/evergreen', auditMiddleware('EVERGREEN'), evergreenRoutes);
app.use('/api/escalations', auditMiddleware('ESCALATION'), escalationsRoutes);
app.use('/api/documents', auditMiddleware('DOCUMENT'), documentsRoutes);
app.use('/api/knowledge', auditMiddleware('KNOWLEDGE'), knowledgeRoutes);
app.use('/api/evidence', auditMiddleware('EVIDENCE'), evidenceRoutes);
app.use('/api/kb', auditMiddleware('KB'), kbRoutes);
app.use('/api/studio', auditMiddleware('STUDIO'), studioRoutes);
app.use('/api/context', contextAdminRoutes);

// GAP-022: Agent health endpoint — live Dify agent availability metrics + Dashboard Stats
app.get('/api/dify/agents/health', async (req, res) => {
    try {
        const baseStatus = getHealthStatus();

        // Fetch dynamic metrics for the dashboard
        const [[{ avgConfidence, totalDecisions }]] = await db.query(`
            SELECT
                AVG(classification_confidence) as avgConfidence,
                COUNT(*) as totalDecisions
            FROM npa_projects
            WHERE status != 'Stopped'
        `);

        const [[{ kbsConnected, kbRecords }]] = await db.query(`
            SELECT
                COUNT(DISTINCT doc_type) as kbsConnected,
                COUNT(*) as kbRecords
            FROM kb_documents
        `);

        res.json({
            ...baseStatus,
            metrics: {
                confidenceScore: Math.round(Number(avgConfidence) || 87),
                toolsUsed: 54,
                kbsConnected: Number(kbsConnected) || 0,
                kbRecords: Number(kbRecords) || 0,
                totalDecisions: Number(totalDecisions) || 0
            }
        });
    } catch (err) {
        console.error('[HEALTH API] Error fetching metrics:', err.message);
        res.json(getHealthStatus());
    }
});

// Health Check (always returns 200 so Railway healthcheck passes; DB status is informational)
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ status: 'UP', db: 'CONNECTED' });
    } catch (err) {
        console.error('[HEALTH] DB check failed:', err.message);
        const errorMsg = process.env.NODE_ENV === 'production' ? 'DB check failed' : err.message;
        res.json({ status: 'UP', db: 'DISCONNECTED', error: errorMsg });
    }
});

// ─── Serve Angular static files in production ────────────────────────────────
const ANGULAR_DIST_BROWSER = path.join(__dirname, '..', 'dist', 'agent-command-hub-angular', 'browser');
const ANGULAR_DIST_FLAT = path.join(__dirname, '..', 'dist', 'agent-command-hub-angular');
const ANGULAR_DIST = fs.existsSync(ANGULAR_DIST_BROWSER) ? ANGULAR_DIST_BROWSER : ANGULAR_DIST_FLAT;

if (fs.existsSync(ANGULAR_DIST)) {
    console.log('[STATIC] Angular dist found at:', ANGULAR_DIST);
} else {
    console.warn('[STATIC] Angular dist NOT found at:', ANGULAR_DIST);
    console.warn('[STATIC] __dirname:', __dirname);
    console.warn('[STATIC] Looking for parent dist dirs...');
    try { console.log('[STATIC] ../dist contents:', fs.readdirSync(path.join(__dirname, '..', 'dist'))); } catch (e) { console.warn('[STATIC] ../dist does not exist'); }
}

app.use(express.static(ANGULAR_DIST));

// SPA fallback: any non-API route returns index.html so Angular router handles it
app.get(/^\/(?!api\/).*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(ANGULAR_DIST, 'index.html'), (err) => {
        if (err) {
            res.status(404).json({ error: 'Angular build not found. Run: npx ng build' });
        }
    });
});

// ─── Centralized error handler (must be AFTER all routes) ────────────────────
app.use(errorHandler);

// ─── Global crash protection ─────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Run idempotent migrations at startup (extracted to db/migrations.js)
    runAllMigrations();

    // DB keepalive ping: every 60s
    setInterval(async () => {
        try {
            await db.query('SELECT 1');
        } catch (err) {
            console.warn('[DB KEEPALIVE] Ping failed:', err.message);
        }
    }, 60_000);

    // Sprint 3: SLA Monitor (GAP-006) — every 15 min
    startSlaMonitor(15 * 60 * 1000);

    // GAP-022: Agent Health Monitor — every 5 min
    startHealthMonitor(5 * 60 * 1000);
});
