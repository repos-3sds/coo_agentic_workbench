/**
 * Context Admin API Routes (Sprint 5 — S5-001)
 *
 * Express routes exposing context engine health, traces, configs,
 * and quality metrics for the admin dashboard.
 *
 * All routes require ADMIN role (RBAC check).
 *
 * Mount: /api/context
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../middleware/async-handler');
const { requireAuth } = require('../middleware/auth');
const { getContextEngineHealth, ENABLED } = require('../services/context-bridge');

const router = express.Router();

// ── RBAC: Admin-only middleware ──────────────────────────────────────────────

const ADMIN_ROLES = new Set(['ADMIN', 'COO']);

function requireAdmin() {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role || !ADMIN_ROLES.has(role.toUpperCase())) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    };
}

// Apply auth + admin check to all routes in this router
router.use(requireAuth(), requireAdmin());

// ── Config Loader Helpers ───────────────────────────────────────────────────

const ENGINE_ROOT = path.resolve(__dirname, '..', '..', 'packages', 'context-engine');
const CONFIG_DIR = path.join(ENGINE_ROOT, 'config');
const CONTRACTS_DIR = path.join(ENGINE_ROOT, 'contracts');
const DOMAINS_DIR = path.join(ENGINE_ROOT, 'domains');

function loadJsonFile(filePath) {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function loadAllJsonInDir(dirPath) {
    try {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
        return files.reduce((acc, f) => {
            acc[f.replace('.json', '')] = loadJsonFile(path.join(dirPath, f));
            return acc;
        }, {});
    } catch {
        return {};
    }
}

// ── In-memory trace store (production: replace with DB/Redis) ───────────────

const _traceStore = [];
const MAX_TRACES = 500;

/**
 * Record a trace from a context assembly call.
 * Called by dify-proxy after context assembly completes.
 */
function recordTrace(trace) {
    if (!trace) return;
    _traceStore.unshift({
        ...trace,
        recorded_at: new Date().toISOString(),
    });
    if (_traceStore.length > MAX_TRACES) {
        _traceStore.length = MAX_TRACES;
    }
}

// ── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/context/health
 * Returns context engine pipeline health stats.
 */
router.get('/health', asyncHandler(async (_req, res) => {
    const health = await getContextEngineHealth();
    const configs = loadAllJsonInDir(CONFIG_DIR);
    const domains = loadAllJsonInDir(DOMAINS_DIR);

    res.json({
        ...health,
        config_count: Object.keys(configs).length,
        domain_count: Object.keys(domains).length,
        trace_store_size: _traceStore.length,
        available_configs: Object.keys(configs),
        available_domains: Object.keys(domains),
    });
}));

/**
 * GET /api/context/traces
 * Returns recent context assembly traces.
 * Query params: ?limit=50&offset=0&agent_id=AG_NPA_BIZ
 */
router.get('/traces', asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 50, MAX_TRACES);
    const offset = parseInt(req.query.offset) || 0;
    const agentFilter = req.query.agent_id || null;

    let traces = _traceStore;
    if (agentFilter) {
        traces = traces.filter(t =>
            t.agent_id === agentFilter ||
            t._metadata?.agent_id === agentFilter
        );
    }

    const page = traces.slice(offset, offset + limit);

    res.json({
        total: traces.length,
        limit,
        offset,
        traces: page.map(t => ({
            trace_id: t._metadata?.trace_id || t.trace_id || 'unknown',
            agent_id: t.agent_id || t._metadata?.agent_id || 'unknown',
            archetype: t._metadata?.archetype || 'unknown',
            domain: t._metadata?.domain || 'unknown',
            stage_count: t._metadata?.stages?.length || 0,
            total_tokens: t._metadata?.budget_report?.total_tokens || 0,
            recorded_at: t.recorded_at,
        })),
    });
}));

/**
 * GET /api/context/traces/:traceId
 * Returns a single trace with full detail.
 */
router.get('/traces/:traceId', asyncHandler(async (req, res) => {
    const { traceId } = req.params;
    const trace = _traceStore.find(t =>
        (t._metadata?.trace_id || t.trace_id) === traceId
    );

    if (!trace) {
        return res.status(404).json({ error: `Trace ${traceId} not found` });
    }

    res.json({ trace });
}));

/**
 * GET /api/context/sources
 * Returns the registered source priority hierarchy.
 */
router.get('/sources', asyncHandler(async (_req, res) => {
    const sourcePriority = loadJsonFile(path.join(CONFIG_DIR, 'source-priority.json'));
    const trustClassification = loadJsonFile(path.join(CONFIG_DIR, 'trust-classification.json'));
    const domains = loadAllJsonInDir(DOMAINS_DIR);

    // Collect all context_sources across domains
    const domainSources = {};
    for (const [domainId, config] of Object.entries(domains)) {
        if (config?.context_sources) {
            domainSources[domainId] = config.context_sources;
        }
    }

    res.json({
        source_priority: sourcePriority,
        trust_classification: trustClassification,
        domain_sources: domainSources,
    });
}));

/**
 * GET /api/context/quality
 * Returns grounding quality scores (aggregated from recent traces).
 */
router.get('/quality', asyncHandler(async (_req, res) => {
    const groundingConfig = loadJsonFile(path.join(CONFIG_DIR, 'grounding-requirements.json'));

    // Aggregate grounding stats from recent traces
    const recentTraces = _traceStore.slice(0, 100);
    const qualityStats = {
        traces_analyzed: recentTraces.length,
        avg_grounding_score: 0,
        claims_checked: 0,
        claims_grounded: 0,
        by_agent: {},
    };

    for (const trace of recentTraces) {
        const quality = trace._metadata?.grounding_quality || trace.grounding_quality;
        if (!quality) continue;

        qualityStats.claims_checked += quality.claims_checked || 0;
        qualityStats.claims_grounded += quality.claims_grounded || 0;

        const agentId = trace.agent_id || trace._metadata?.agent_id || 'unknown';
        if (!qualityStats.by_agent[agentId]) {
            qualityStats.by_agent[agentId] = { traces: 0, total_score: 0 };
        }
        qualityStats.by_agent[agentId].traces += 1;
        qualityStats.by_agent[agentId].total_score += quality.score || 0;
    }

    if (qualityStats.claims_checked > 0) {
        qualityStats.avg_grounding_score =
            qualityStats.claims_grounded / qualityStats.claims_checked;
    }

    // Compute per-agent averages
    for (const agentStats of Object.values(qualityStats.by_agent)) {
        agentStats.avg_score = agentStats.traces > 0
            ? agentStats.total_score / agentStats.traces
            : 0;
    }

    res.json({
        grounding_config: groundingConfig,
        quality_stats: qualityStats,
    });
}));

/**
 * GET /api/context/contracts
 * Returns loaded contract configs for all archetypes.
 */
router.get('/contracts', asyncHandler(async (_req, res) => {
    const contracts = loadAllJsonInDir(CONTRACTS_DIR);

    res.json({
        contract_count: Object.keys(contracts).length,
        contracts,
    });
}));

/**
 * GET /api/context/budget
 * Returns budget allocation configuration and stats.
 */
router.get('/budget', asyncHandler(async (_req, res) => {
    const budgetDefaults = loadJsonFile(path.join(CONFIG_DIR, 'budget-defaults.json'));

    // Aggregate budget usage from recent traces
    const recentTraces = _traceStore.slice(0, 100);
    const budgetStats = {
        traces_analyzed: recentTraces.length,
        avg_tokens_used: 0,
        overflow_count: 0,
        by_profile: {},
    };

    let totalTokens = 0;
    for (const trace of recentTraces) {
        const report = trace._metadata?.budget_report;
        if (!report) continue;

        totalTokens += report.total_tokens || 0;
        if (report.overflow) budgetStats.overflow_count += 1;

        const profile = report.profile || 'unknown';
        if (!budgetStats.by_profile[profile]) {
            budgetStats.by_profile[profile] = { traces: 0, total_tokens: 0 };
        }
        budgetStats.by_profile[profile].traces += 1;
        budgetStats.by_profile[profile].total_tokens += report.total_tokens || 0;
    }

    if (recentTraces.length > 0) {
        budgetStats.avg_tokens_used = totalTokens / recentTraces.length;
    }

    // Compute per-profile averages
    for (const profileStats of Object.values(budgetStats.by_profile)) {
        profileStats.avg_tokens = profileStats.traces > 0
            ? profileStats.total_tokens / profileStats.traces
            : 0;
    }

    res.json({
        enabled: ENABLED,
        budget_config: budgetDefaults,
        budget_stats: budgetStats,
    });
}));

module.exports = { router, recordTrace };
