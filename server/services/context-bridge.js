/**
 * Context Bridge — Server Adapter (Sprint 4 — S4-001)
 *
 * Thin bridge that adapts the Python context engine for the Express server.
 * Implements the adapter interface using actual DB queries and Dify KB search.
 *
 * Architecture:
 *   Express route → context-bridge → Python context_engine (subprocess)
 *
 * The bridge shells out to a small Python runner script that imports
 * context_engine and returns JSON. This keeps the Node server as the
 * single process while leveraging the standalone Python package.
 *
 * Feature flag: CONTEXT_ENGINE_ENABLED=true (default: false)
 *
 * Blueprint Section 12 — Integration Bridge.
 */

const { execFile } = require('child_process');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────────

const ENABLED = process.env.CONTEXT_ENGINE_ENABLED === 'true';
const PYTHON_BIN = process.env.CONTEXT_ENGINE_PYTHON || 'python3';
const ENGINE_ROOT = path.resolve(__dirname, '..', '..', 'packages', 'context-engine');
const RUNNER_SCRIPT = path.resolve(ENGINE_ROOT, 'runner.py');
const TIMEOUT_MS = Number(process.env.CONTEXT_ENGINE_TIMEOUT_MS) || 10000;

let _healthy = null; // null = untested, true/false after first check

// ── Python Runner ────────────────────────────────────────────────────────────

/**
 * Execute a context engine command via the Python runner subprocess.
 *
 * @param {string} command - The command name (e.g. "assemble", "health")
 * @param {object} payload - JSON-serializable payload for the command
 * @returns {Promise<object>} Parsed JSON response from the engine
 */
function runEngine(command, payload) {
    return new Promise((resolve, reject) => {
        const input = JSON.stringify({ command, ...payload });

        const proc = execFile(
            PYTHON_BIN,
            [RUNNER_SCRIPT],
            {
                cwd: ENGINE_ROOT,
                timeout: TIMEOUT_MS,
                env: { ...process.env, PYTHONPATH: ENGINE_ROOT },
                maxBuffer: 1024 * 1024, // 1MB
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(`[CONTEXT-BRIDGE] Engine error: ${error.message}`);
                    if (stderr) console.error(`[CONTEXT-BRIDGE] stderr: ${stderr}`);
                    _healthy = false;
                    return reject(error);
                }

                try {
                    const result = JSON.parse(stdout);
                    _healthy = true;
                    resolve(result);
                } catch (parseErr) {
                    console.error(`[CONTEXT-BRIDGE] JSON parse failed: ${stdout.slice(0, 500)}`);
                    _healthy = false;
                    reject(new Error(`Context engine returned invalid JSON: ${parseErr.message}`));
                }
            }
        );

        // Send payload via stdin
        proc.stdin.write(input);
        proc.stdin.end();
    });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create server-side adapters that the context engine uses to fetch data.
 * In production these would call real DB/MCP/Dify APIs.
 * For now, returns adapter config that the Python runner uses internally.
 *
 * @param {object} db - Database connection pool
 * @param {object} [mcpTools] - MCP tool runner (optional)
 * @returns {object} Adapter configuration
 */
function createServerAdapters(db, mcpTools) {
    return {
        db_available: !!db,
        mcp_available: !!mcpTools,
        // The Python runner handles actual data fetching via its own adapters.
        // This config tells it what's available on the server side.
    };
}

/**
 * Assemble context for an agent before forwarding to Dify.
 *
 * @param {string} agentId - Agent identifier (e.g. "AG_NPA_BIZ")
 * @param {object} request - The incoming request with query, entity_ids, etc.
 * @param {object} [userContext] - User context (role, jurisdiction, etc.)
 * @returns {Promise<object|null>} Context package or null if disabled/failed
 */
async function assembleContextForAgent(agentId, request, userContext) {
    if (!ENABLED) return null;

    try {
        const result = await runEngine('assemble', {
            agent_id: agentId,
            request: {
                agent_id: agentId,
                entity_ids: request.entity_ids || [],
                entity_type: request.entity_type || 'project',
                query: request.query || '',
                system_prompt: request.system_prompt || '',
                conversation_history: request.conversation_history || [],
                few_shot_examples: [],
                tool_schemas: [],
                sources: request.sources || [],
            },
            archetype: mapAgentToArchetype(agentId),
            domain: mapAgentToDomain(agentId),
            user_context: userContext || {},
        });

        return result;
    } catch (err) {
        console.warn(`[CONTEXT-BRIDGE] assembleContextForAgent failed for ${agentId}: ${err.message}`);
        // Graceful degradation — return null so the proxy continues without context
        return null;
    }
}

/**
 * Get context engine health status.
 *
 * @returns {Promise<object>} Health status object
 */
async function getContextEngineHealth() {
    if (!ENABLED) {
        return { enabled: false, status: 'disabled', healthy: null };
    }

    try {
        const result = await runEngine('health', {});
        _healthy = true;
        return {
            enabled: true,
            status: 'healthy',
            healthy: true,
            version: result.version || 'unknown',
            modules: result.modules || [],
        };
    } catch (err) {
        _healthy = false;
        return {
            enabled: true,
            status: 'unhealthy',
            healthy: false,
            error: err.message,
        };
    }
}

// ── Agent Mapping Helpers ────────────────────────────────────────────────────

const ORCHESTRATOR_AGENTS = new Set([
    'AG_NPA_ORCHESTRATOR', 'MASTER_COO', 'AG_NPA_QUERY',
]);

const REVIEWER_AGENTS = new Set([
    'AG_NPA_GOVERNANCE', 'AG_NPA_RISK',
]);

/**
 * Map an agent ID to its archetype for contract loading.
 * @param {string} agentId
 * @returns {string} "orchestrator" | "worker" | "reviewer"
 */
function mapAgentToArchetype(agentId) {
    if (ORCHESTRATOR_AGENTS.has(agentId)) return 'orchestrator';
    if (REVIEWER_AGENTS.has(agentId)) return 'reviewer';
    return 'worker';
}

/**
 * Map an agent ID to its domain.
 * @param {string} agentId
 * @returns {string} "NPA" | "ORM" | "DCE" | "DESK"
 */
function mapAgentToDomain(agentId) {
    if (!agentId) return 'NPA';
    const id = String(agentId).toUpperCase();
    if (id.includes('ORM')) return 'ORM';
    if (id.includes('DCE')) return 'DCE';
    if (id.includes('DESK')) return 'DESK';
    if (!id.includes('NPA')) {
        console.warn(`[context-bridge] Unknown agent ID "${agentId}" — falling back to NPA domain`);
    }
    return 'NPA';
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    createServerAdapters,
    assembleContextForAgent,
    getContextEngineHealth,
    mapAgentToArchetype,
    mapAgentToDomain,
    ENABLED,
};
