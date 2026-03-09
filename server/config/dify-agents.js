/**
 * Dify Agent Registry
 * Maps logical agent identities → Dify API keys + endpoint types
 *
 * Source of truth: ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md §3 & §11
 *
 * 18 logical agents across 5 tiers, deployed as 16 Dify apps:
 *   - CF_COO_Orchestrator     (Chatflow)  → MASTER_COO
 *   - CF_NPA_Orchestrator     (Chatflow)  → NPA_ORCHESTRATOR
 *   - CF_NPA_Ideation         (Chatflow)  → IDEATION
 *   - CF_NPA_Query_Assistant  (Chatflow)  → DILIGENCE, KB_SEARCH
 *   - WF_NPA_Classify_Predict (Workflow)  → CLASSIFIER, ML_PREDICT
 *   - WF_NPA_Risk             (Workflow)  → RISK
 *   - WF_NPA_Autofill         (Workflow)  → AUTOFILL
 *   - WF_NPA_Governance       (Workflow)  → GOVERNANCE
 *   - WF_NPA_Doc_Lifecycle    (Workflow)  → DOC_LIFECYCLE
 *   - WF_NPA_Monitoring       (Workflow)  → MONITORING
 *   - WF_NPA_Notification     (Workflow)  → NOTIFICATION
 *
 * Draft Builder Chat Agents (5 Chatflow apps for NPA section sign-off):
 *   - CF_NPA_BIZ              (Chatflow)  → AG_NPA_BIZ
 *   - CF_NPA_TECH_OPS         (Chatflow)  → AG_NPA_TECH_OPS
 *   - CF_NPA_FINANCE          (Chatflow)  → AG_NPA_FINANCE
 *   - CF_NPA_RMG              (Chatflow)  → AG_NPA_RMG
 *   - CF_NPA_LCS              (Chatflow)  → AG_NPA_LCS
 */

const path = require('path');
const { loadEnv } = require('../utils/load-env');
loadEnv();
const AGENT_REGISTRY = require(path.resolve(__dirname, '..', '..', 'shared', 'agent-registry.json'));

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';

const DIFY_AGENTS = {};
for (const agent of AGENT_REGISTRY) {
    if (!agent?.id) continue;
    const id = String(agent.id);
    const envKey = String(agent.envKey || '');
    DIFY_AGENTS[id] = {
        key: envKey ? (process.env[envKey] || '') : '',
        type: agent.difyType,
        difyApp: agent.difyApp,
        name: agent.name,
        tier: agent.tier,
        icon: agent.icon,
        color: agent.color
    };
}

function getAgent(agentId) {
    const agent = DIFY_AGENTS[agentId];
    if (!agent) {
        throw new Error(`Unknown agent: ${agentId}. Valid agents: ${Object.keys(DIFY_AGENTS).join(', ')}`);
    }
    return agent;
}

function getAllAgents() {
    return Object.entries(DIFY_AGENTS).map(([id, config]) => ({
        id,
        ...config,
        configured: !!config.key
    }));
}

module.exports = { DIFY_AGENTS, DIFY_BASE_URL, getAgent, getAllAgents };
