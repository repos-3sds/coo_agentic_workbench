/**
 * Agent Health Monitor (GAP-022)
 *
 * Periodically pings all configured Dify agents to check availability.
 * Stores health metrics: latency, last success, failure count.
 * Exposes results via getHealthStatus() for the /api/dify/agents/health endpoint.
 */

const { DIFY_AGENTS, DIFY_BASE_URL } = require('../config/dify-agents');

// In-memory health state per agent
const healthState = {};

// Initialize health state for all agents
for (const [id, agent] of Object.entries(DIFY_AGENTS)) {
    healthState[id] = {
        agent_id: id,
        name: agent.name,
        type: agent.type,
        tier: agent.tier,
        configured: !!agent.key,
        status: agent.key ? 'UNKNOWN' : 'UNCONFIGURED',
        last_check: null,
        last_success: null,
        last_failure: null,
        latency_ms: null,
        failure_count: 0,
        consecutive_failures: 0,
        uptime_pct: 100,
        check_count: 0,
        success_count: 0
    };
}

/**
 * Ping a single Dify agent to check health.
 * Uses a minimal request that should return quickly.
 */
async function pingAgent(agentId) {
    const agent = DIFY_AGENTS[agentId];
    if (!agent || !agent.key) {
        healthState[agentId].status = 'UNCONFIGURED';
        return;
    }

    const state = healthState[agentId];
    state.check_count++;
    state.last_check = new Date().toISOString();

    const startTime = Date.now();

    try {
        // Use Dify's parameter endpoint for chat agents or a minimal workflow call
        const url = agent.type === 'chat'
            ? `${DIFY_BASE_URL}/parameters`
            : `${DIFY_BASE_URL}/parameters`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${agent.key}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeout);

        const latency = Date.now() - startTime;
        state.latency_ms = latency;

        if (res.ok) {
            state.status = latency > 5000 ? 'DEGRADED' : 'HEALTHY';
            state.last_success = state.last_check;
            state.consecutive_failures = 0;
            state.success_count++;
        } else if (res.status === 404) {
            // Wrong base URL/path: should not be treated as healthy.
            state.status = 'NOT_FOUND';
            state.last_failure = state.last_check;
            state.failure_count++;
            state.consecutive_failures++;
        } else if (res.status === 401) {
            // Auth failure — agent key is invalid
            state.status = 'AUTH_FAILED';
            state.failure_count++;
            state.consecutive_failures++;
        } else if (res.status === 429) {
            state.status = 'RATE_LIMITED';
            state.last_failure = state.last_check;
            state.failure_count++;
            state.consecutive_failures++;
        } else {
            state.status = 'ERROR';
            state.last_failure = state.last_check;
            state.failure_count++;
            state.consecutive_failures++;
        }
    } catch (err) {
        const latency = Date.now() - startTime;
        state.latency_ms = latency;
        state.status = err.name === 'AbortError' ? 'TIMEOUT' : 'UNREACHABLE';
        state.last_failure = state.last_check;
        state.failure_count++;
        state.consecutive_failures++;
    }

    // Calculate uptime percentage
    if (state.check_count > 0) {
        state.uptime_pct = Math.round((state.success_count / state.check_count) * 100);
    }
}

/**
 * Run health check on all configured agents.
 */
async function runHealthCheck() {
    const agents = Object.keys(DIFY_AGENTS);
    const configuredAgents = agents.filter(id => DIFY_AGENTS[id].key);

    // Ping all configured agents in parallel
    await Promise.allSettled(configuredAgents.map(id => pingAgent(id)));

    const healthy = Object.values(healthState).filter(s => s.status === 'HEALTHY').length;
    const degraded = Object.values(healthState).filter(s => s.status === 'DEGRADED').length;
    const unhealthy = Object.values(healthState).filter(s => ['ERROR', 'TIMEOUT', 'UNREACHABLE', 'AUTH_FAILED'].includes(s.status)).length;

    console.log(`[AGENT-HEALTH] Check complete: ${healthy} healthy, ${degraded} degraded, ${unhealthy} unhealthy, ${agents.length - configuredAgents.length} unconfigured`);

    return {
        healthy,
        degraded,
        unhealthy,
        unconfigured: agents.length - configuredAgents.length,
        total: agents.length,
        checked_at: new Date().toISOString()
    };
}

/**
 * Get current health status for all agents.
 */
function getHealthStatus() {
    const agents = Object.values(healthState);
    const summary = {
        total: agents.length,
        healthy: agents.filter(a => a.status === 'HEALTHY').length,
        degraded: agents.filter(a => a.status === 'DEGRADED').length,
        unhealthy: agents.filter(a => ['ERROR', 'TIMEOUT', 'UNREACHABLE', 'AUTH_FAILED'].includes(a.status)).length,
        unconfigured: agents.filter(a => a.status === 'UNCONFIGURED').length,
        unknown: agents.filter(a => a.status === 'UNKNOWN').length,
        last_check: agents.reduce((latest, a) => {
            if (!a.last_check) return latest;
            return !latest || a.last_check > latest ? a.last_check : latest;
        }, null)
    };
    return { summary, agents };
}

// Interval handle
let intervalHandle = null;

function startHealthMonitor(intervalMs = 5 * 60 * 1000) { // Default: every 5 min
    if (intervalHandle) {
        console.warn('[AGENT-HEALTH] Already running');
        return;
    }
    console.log(`[AGENT-HEALTH] Starting (interval: ${intervalMs / 1000}s)`);
    // Run once on startup after a short delay (let server finish booting)
    setTimeout(() => {
        runHealthCheck().catch(err => console.error('[AGENT-HEALTH] Startup run failed:', err.message));
    }, 5000);
    intervalHandle = setInterval(() => {
        runHealthCheck().catch(err => console.error('[AGENT-HEALTH] Interval run failed:', err.message));
    }, intervalMs);
}

function stopHealthMonitor() {
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = null;
        console.log('[AGENT-HEALTH] Stopped');
    }
}

module.exports = { runHealthCheck, getHealthStatus, startHealthMonitor, stopHealthMonitor };
