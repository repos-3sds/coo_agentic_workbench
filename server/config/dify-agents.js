/**
 * Dify Agent Registry
 * Maps agent identities → Dify API keys + endpoint types
 *
 * 13 agents across 4 tiers (from AGENT_ARCHITECTURE.md):
 * - Tier 1: Master COO Orchestrator (Chatflow)
 * - Tier 2: NPA Domain Orchestrator (Chatflow)
 * - Tier 3: 9 Specialist Workers (Workflow as Tool)
 * - Tier 4: 2 Shared Utilities (Workflow as Tool)
 */

require('dotenv').config();

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost/v1';

const DIFY_AGENTS = {
    // Tier 1 — Strategic Command
    MASTER_COO: {
        key: process.env.DIFY_KEY_MASTER_COO || '',
        type: 'chat',
        name: 'Master COO Orchestrator',
        tier: 1,
        icon: 'brain-circuit',
        color: 'bg-violet-50 text-violet-600'
    },

    // Tier 2 — Domain Orchestration
    NPA_ORCHESTRATOR: {
        key: process.env.DIFY_KEY_NPA_ORCH || '',
        type: 'chat',
        name: 'NPA Domain Orchestrator',
        tier: 2,
        icon: 'target',
        color: 'bg-orange-50 text-orange-600'
    },

    // Tier 3 — Specialist Workers
    IDEATION: {
        key: process.env.DIFY_KEY_IDEATION || '',
        type: 'chat',
        name: 'Ideation Agent',
        tier: 3,
        icon: 'lightbulb',
        color: 'bg-indigo-50 text-indigo-600'
    },
    CLASSIFIER: {
        key: process.env.DIFY_KEY_CLASSIFIER || '',
        type: 'workflow',
        name: 'Classification Agent',
        tier: 3,
        icon: 'git-branch',
        color: 'bg-purple-50 text-purple-600'
    },
    AUTOFILL: {
        key: process.env.DIFY_KEY_AUTOFILL || '',
        type: 'workflow',
        name: 'Template AutoFill Agent',
        tier: 3,
        icon: 'file-edit',
        color: 'bg-blue-50 text-blue-600'
    },
    ML_PREDICT: {
        key: process.env.DIFY_KEY_ML_PREDICT || '',
        type: 'workflow',
        name: 'ML Prediction Agent',
        tier: 3,
        icon: 'trending-up',
        color: 'bg-amber-50 text-amber-600'
    },
    RISK: {
        key: process.env.DIFY_KEY_RISK || '',
        type: 'workflow',
        name: 'Risk Agent',
        tier: 3,
        icon: 'shield-alert',
        color: 'bg-red-50 text-red-600'
    },
    GOVERNANCE: {
        key: process.env.DIFY_KEY_GOVERNANCE || '',
        type: 'workflow',
        name: 'Governance Agent',
        tier: 3,
        icon: 'workflow',
        color: 'bg-slate-50 text-slate-600'
    },
    DILIGENCE: {
        key: process.env.DIFY_KEY_DILIGENCE || '',
        type: 'workflow',
        name: 'Conversational Diligence Agent',
        tier: 3,
        icon: 'message-square',
        color: 'bg-cyan-50 text-cyan-600'
    },
    DOC_LIFECYCLE: {
        key: process.env.DIFY_KEY_DOC_LIFECYCLE || '',
        type: 'workflow',
        name: 'Document Lifecycle Agent',
        tier: 3,
        icon: 'scan-search',
        color: 'bg-teal-50 text-teal-600'
    },
    MONITORING: {
        key: process.env.DIFY_KEY_MONITORING || '',
        type: 'workflow',
        name: 'Post-Launch Monitoring Agent',
        tier: 3,
        icon: 'activity',
        color: 'bg-emerald-50 text-emerald-600'
    },

    // Tier 4 — Shared Utilities
    KB_SEARCH: {
        key: process.env.DIFY_KEY_KB_SEARCH || '',
        type: 'workflow',
        name: 'KB Search Agent',
        tier: 4,
        icon: 'search',
        color: 'bg-fuchsia-50 text-fuchsia-600'
    },
    NOTIFICATION: {
        key: process.env.DIFY_KEY_NOTIFICATION || '',
        type: 'workflow',
        name: 'Notification Agent',
        tier: 4,
        icon: 'bell',
        color: 'bg-pink-50 text-pink-600'
    }
};

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
