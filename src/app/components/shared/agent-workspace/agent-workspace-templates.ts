/**
 * Unified Template Registry
 *
 * Single source of truth for all workspace templates across Command Center
 * and NPA Agent contexts. Templates are filtered by WorkspaceConfig.templateFilter.
 */

import { TemplateCategory, WorkspaceTemplate } from './agent-workspace.interfaces';

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    { id: 'STRATEGY', name: 'Product Strategy' },
    { id: 'RISK', name: 'Risk & Compliance' },
    { id: 'LEGAL', name: 'Legal & Regulatory' },
    { id: 'OPS', name: 'Operations' },
    { id: 'MARKETING', name: 'Marketing & Sales' },
    { id: 'KB', name: 'Knowledge & Policy' },
    { id: 'DESK', name: 'Desk Support' },
];

export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
    // ── STRATEGY (3 templates) ──────────────────────────────────────────
    {
        id: 'S1',
        title: 'Draft New Product Concept',
        description: 'Generate a structured concept paper for a new financial product, including target market and revenue model.',
        category: 'STRATEGY',
        icon: 'lightbulb',
        iconBg: 'bg-amber-100 text-amber-600',
        prompt: 'I want to create a new NPA. Help me draft a product concept paper.',
        successRate: 88,
        avgTime: '2m 15s',
        inputs: [
            { label: 'Product Name', placeholder: 'e.g. Green Bond ETF', key: 'name', required: true },
            { label: 'Target Segment', placeholder: 'e.g. Institutional Investors', key: 'segment' },
            { label: 'Key Features', placeholder: 'Describe main features...', key: 'features', type: 'textarea' }
        ]
    },
    {
        id: 'S2',
        title: 'Competitor Analysis',
        description: 'Analyze key competitors for a proposed product and identify differentiators.',
        category: 'STRATEGY',
        icon: 'users',
        iconBg: 'bg-blue-100 text-blue-600',
        prompt: 'Analyze key competitors for my proposed product and identify differentiators.',
        successRate: 92,
        avgTime: '45s',
        inputs: [
            { label: 'Product Type', placeholder: 'e.g. Robo-advisory', key: 'type', required: true },
            { label: 'Main Competitor', placeholder: 'e.g. StashAway', key: 'competitor' }
        ]
    },
    {
        id: 'S3',
        title: 'Product Feasibility Assessment',
        description: 'Evaluate market demand, regulatory landscape, and resource requirements for a product idea.',
        category: 'STRATEGY',
        icon: 'bar-chart-3',
        iconBg: 'bg-emerald-100 text-emerald-600',
        prompt: 'Run a feasibility assessment for a new product idea. Evaluate market demand, regulatory landscape, and resource requirements.',
        successRate: 85,
        avgTime: '1m 30s',
        inputs: [
            { label: 'Product Idea', placeholder: 'Brief description of the product...', key: 'idea', type: 'textarea', required: true },
            { label: 'Target Market', placeholder: 'e.g. Singapore retail investors', key: 'market' }
        ]
    },

    // ── RISK (3 templates) ──────────────────────────────────────────────
    {
        id: 'R1',
        title: 'Initial Risk Assessment',
        description: 'Evaluate potential operational, credit, and market risks for a new initiative.',
        category: 'RISK',
        icon: 'shield-alert',
        iconBg: 'bg-red-100 text-red-600',
        prompt: 'Run an initial risk assessment for my product covering operational, credit, and market risks.',
        successRate: 95,
        avgTime: '1m 30s',
        inputs: [
            { label: 'Product/Process', placeholder: 'e.g. Crypto Custody', key: 'product', required: true },
            { label: 'Jurisdiction', placeholder: 'e.g. Singapore, HK', key: 'jurisdiction' }
        ]
    },
    {
        id: 'R2',
        title: 'Check Prohibited Lists',
        description: 'Scan entities or product types against internal prohibited/restricted lists.',
        category: 'RISK',
        icon: 'search',
        iconBg: 'bg-orange-100 text-orange-600',
        prompt: 'Check prohibited and restricted lists for the following entities/product types.',
        successRate: 99,
        avgTime: '10s',
        inputs: [
            { label: 'Keywords', placeholder: 'Enter names or sectors...', key: 'keywords', required: true }
        ]
    },
    {
        id: 'R3',
        title: 'Sanctions & AML Screening',
        description: 'Screen counterparties and jurisdictions against sanctions lists and AML databases.',
        category: 'RISK',
        icon: 'shield-check',
        iconBg: 'bg-rose-100 text-rose-600',
        prompt: 'Screen the following entities and jurisdictions against sanctions lists and AML databases.',
        successRate: 97,
        avgTime: '15s',
        inputs: [
            { label: 'Entity Name', placeholder: 'e.g. Acme Corp Ltd', key: 'entity', required: true },
            { label: 'Country', placeholder: 'e.g. Myanmar', key: 'country' }
        ]
    },

    // ── LEGAL (2 templates) ─────────────────────────────────────────────
    {
        id: 'L1',
        title: 'MAS Regulatory Review',
        description: 'Verify if a product structure adheres to MAS Guidelines (e.g. SFA, FAA).',
        category: 'LEGAL',
        icon: 'scale',
        iconBg: 'bg-slate-100 text-slate-700',
        prompt: 'Review MAS regulatory compliance for a product structure. Check adherence to SFA, FAA, and relevant MAS notices.',
        successRate: 91,
        avgTime: '3m',
        inputs: [
            { label: 'Product Structure', placeholder: 'Describe structure...', key: 'structure', type: 'textarea' },
            { label: 'Relevant Regulation', placeholder: 'e.g. MAS 656', key: 'reg' }
        ]
    },
    {
        id: 'L2',
        title: 'Legal Opinion Request',
        description: 'Draft a legal opinion request for internal or external counsel review.',
        category: 'LEGAL',
        icon: 'file-pen',
        iconBg: 'bg-violet-100 text-violet-600',
        prompt: 'Help me draft a legal opinion request for counsel review regarding a new product.',
        successRate: 87,
        avgTime: '2m',
        inputs: [
            { label: 'Subject Matter', placeholder: 'e.g. Cross-border derivative structuring', key: 'subject', required: true },
            { label: 'Key Legal Question', placeholder: 'What specific legal issue needs opinion?', key: 'question', type: 'textarea' }
        ]
    },

    // ── OPS (2 templates) ───────────────────────────────────────────────
    {
        id: 'O1',
        title: 'Draft Process Flow',
        description: 'Outline the end-to-end operational workflow for booking and settlement.',
        category: 'OPS',
        icon: 'workflow',
        iconBg: 'bg-indigo-100 text-indigo-600',
        prompt: 'Draft an end-to-end operational process flow for booking and settlement.',
        successRate: 85,
        avgTime: '2m',
        inputs: [
            { label: 'Asset Class', placeholder: 'e.g. Equities', key: 'asset' },
            { label: 'Booking System', placeholder: 'e.g. Murex', key: 'system' }
        ]
    },
    {
        id: 'O2',
        title: 'Settlement Workflow Setup',
        description: 'Configure settlement parameters and cutoff times for a new product launch.',
        category: 'OPS',
        icon: 'clock',
        iconBg: 'bg-cyan-100 text-cyan-600',
        prompt: 'Help me set up settlement workflow parameters and cutoff times for a new product.',
        successRate: 90,
        avgTime: '1m 15s',
        inputs: [
            { label: 'Product Type', placeholder: 'e.g. Fixed Income ETF', key: 'product', required: true },
            { label: 'Settlement Cycle', placeholder: 'e.g. T+2', key: 'cycle' }
        ]
    },

    // ── MARKETING (2 templates) ─────────────────────────────────────────
    {
        id: 'M1',
        title: 'Go-to-Market Strategy',
        description: 'Create a go-to-market plan for a new financial product including channels, messaging, and timeline.',
        category: 'MARKETING',
        icon: 'megaphone',
        iconBg: 'bg-pink-100 text-pink-600',
        prompt: 'Create a go-to-market strategy for a new financial product covering channels, messaging, and launch timeline.',
        successRate: 82,
        avgTime: '2m 30s',
        inputs: [
            { label: 'Product Name', placeholder: 'e.g. ESG Wealth Portfolio', key: 'product', required: true },
            { label: 'Target Audience', placeholder: 'e.g. HNW retail clients', key: 'audience' },
            { label: 'Key Value Proposition', placeholder: 'What makes it compelling?', key: 'value', type: 'textarea' }
        ]
    },
    {
        id: 'M2',
        title: 'Client Communication Draft',
        description: 'Draft client-facing communications such as product fact sheets, FAQs, or launch announcements.',
        category: 'MARKETING',
        icon: 'mail',
        iconBg: 'bg-fuchsia-100 text-fuchsia-600',
        prompt: 'Draft a client-facing communication for a product launch — include a product fact sheet and FAQ.',
        successRate: 89,
        avgTime: '1m 45s',
        inputs: [
            { label: 'Communication Type', placeholder: 'e.g. Product Fact Sheet, FAQ, Launch Email', key: 'type', required: true },
            { label: 'Product Summary', placeholder: 'Brief product overview...', key: 'summary', type: 'textarea' }
        ]
    },

    // ── KB (2 templates) ────────────────────────────────────────────────
    {
        id: 'K1',
        title: 'Search SOPs & Policies',
        description: 'Search internal SOPs, policies, and procedure manuals for specific topics or requirements.',
        category: 'KB',
        icon: 'book-open',
        iconBg: 'bg-purple-100 text-purple-600',
        prompt: 'Search our internal SOPs and policy documents for relevant procedures and requirements.',
        successRate: 94,
        avgTime: '20s',
        inputs: [
            { label: 'Search Topic', placeholder: 'e.g. Client onboarding procedures', key: 'topic', required: true }
        ]
    },
    {
        id: 'K2',
        title: 'Regulatory Guidelines Lookup',
        description: 'Look up specific MAS guidelines, circulars, or regulatory notices by topic or reference number.',
        category: 'KB',
        icon: 'file-search',
        iconBg: 'bg-teal-100 text-teal-600',
        prompt: 'Look up MAS regulatory guidelines and circulars related to the specified topic.',
        successRate: 93,
        avgTime: '15s',
        inputs: [
            { label: 'Topic or Reference', placeholder: 'e.g. MAS 656, Technology Risk Management', key: 'reference', required: true }
        ]
    },

    // ── DESK (2 templates) ──────────────────────────────────────────────
    {
        id: 'D1',
        title: 'Query Help & Troubleshooting',
        description: 'Get help with system issues, process questions, or troubleshoot common problems.',
        category: 'DESK',
        icon: 'help-circle',
        iconBg: 'bg-sky-100 text-sky-600',
        prompt: 'I need help troubleshooting an issue. Please assist with the following problem.',
        successRate: 88,
        avgTime: '30s',
        inputs: [
            { label: 'Issue Description', placeholder: 'Describe the problem...', key: 'issue', type: 'textarea', required: true }
        ]
    },
    {
        id: 'D2',
        title: 'System Access Request',
        description: 'Generate a system access request form for new tools, environments, or elevated permissions.',
        category: 'DESK',
        icon: 'key',
        iconBg: 'bg-amber-100 text-amber-700',
        prompt: 'Help me create a system access request for the following tools and permissions.',
        successRate: 95,
        avgTime: '45s',
        inputs: [
            { label: 'System/Tool', placeholder: 'e.g. Bloomberg Terminal, Murex', key: 'system', required: true },
            { label: 'Access Level', placeholder: 'e.g. Read-only, Full Access', key: 'level' }
        ]
    }
];
