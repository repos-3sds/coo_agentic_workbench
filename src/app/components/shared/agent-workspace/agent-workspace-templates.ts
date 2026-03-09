/**
 * Unified Template Registry
 *
 * Single source of truth for all workspace templates across Command Center,
 * NPA Agent, and DCE Agent contexts. Templates are filtered by WorkspaceConfig.templateFilter.
 */

import { DomainAgent, TemplateCategory, WorkspaceTemplate } from './agent-workspace.interfaces';

// ── Domain Agents — top-level grouping for template categories ──────────
export const DOMAIN_AGENTS: DomainAgent[] = [
    {
        id: 'NPA',
        name: 'NPA Agent',
        icon: 'briefcase',
        iconBg: 'bg-blue-100 text-blue-600',
        description: 'New Product Approval',
        categoryIds: ['STRATEGY', 'RISK', 'LEGAL', 'OPS', 'MARKETING', 'KB', 'DESK']
    },
    {
        id: 'DCE',
        name: 'DCE Agent',
        icon: 'landmark',
        iconBg: 'bg-emerald-100 text-emerald-600',
        description: 'Account Opening',
        categoryIds: ['DCE_PIPELINE', 'DCE_INTAKE', 'DCE_DOCS', 'DCE_SIGNATURE', 'DCE_KYC', 'DCE_CREDIT', 'DCE_CONFIG', 'DCE_NOTIFY']
    }
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    // ── NPA Categories ───────────────────────────────────────────────────
    { id: 'STRATEGY', name: 'Product Strategy', domain: 'NPA' },
    { id: 'RISK', name: 'Risk & Compliance', domain: 'NPA' },
    { id: 'LEGAL', name: 'Legal & Regulatory', domain: 'NPA' },
    { id: 'OPS', name: 'Operations', domain: 'NPA' },
    { id: 'MARKETING', name: 'Marketing & Sales', domain: 'NPA' },
    { id: 'KB', name: 'Knowledge & Policy', domain: 'NPA' },
    { id: 'DESK', name: 'Desk Support', domain: 'NPA' },
    // ── DCE Categories (SA-1 through SA-7 + Orchestrator) ────────────────
    { id: 'DCE_PIPELINE', name: 'Pipeline & Orchestration', domain: 'DCE' },
    { id: 'DCE_INTAKE', name: 'Intake & Triage (SA-1)', domain: 'DCE' },
    { id: 'DCE_DOCS', name: 'Document Collection (SA-2)', domain: 'DCE' },
    { id: 'DCE_SIGNATURE', name: 'Signature Verification (SA-3)', domain: 'DCE' },
    { id: 'DCE_KYC', name: 'KYC / CDD (SA-4)', domain: 'DCE' },
    { id: 'DCE_CREDIT', name: 'Credit Risk (SA-5)', domain: 'DCE' },
    { id: 'DCE_CONFIG', name: 'Account Config (SA-6)', domain: 'DCE' },
    { id: 'DCE_NOTIFY', name: 'Notifications (SA-7)', domain: 'DCE' },
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
    },

    // ═══════════════════════════════════════════════════════════════════════
    // DCE TEMPLATES — Derivatives Clearing & Execution Account Opening
    // 8 categories × 2-3 templates = 21 templates
    // ═══════════════════════════════════════════════════════════════════════

    // ── DCE_PIPELINE — Orchestrator (3 templates) ────────────────────────
    {
        id: 'DCE_P1',
        title: 'Pipeline Status Summary',
        description: 'Get the current pipeline status for a DCE case — completed nodes, current gate, SLA progress, and HITL queue.',
        category: 'DCE_PIPELINE',
        icon: 'git-branch',
        iconBg: 'bg-indigo-100 text-indigo-600',
        prompt: 'Show me the full pipeline status for this DCE case. Include which nodes have completed, which node we are currently at, any HITL gates pending, and SLA progress.',
        successRate: 96,
        avgTime: '5s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_P2',
        title: 'Advance Pipeline',
        description: 'Trigger the orchestrator to advance the pipeline to the next eligible node after a HITL decision.',
        category: 'DCE_PIPELINE',
        icon: 'play',
        iconBg: 'bg-emerald-100 text-emerald-600',
        prompt: 'Advance the pipeline for this case to the next node. The current HITL gate has been cleared — please trigger the orchestrator to resume processing.',
        successRate: 92,
        avgTime: '15s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Current Node', placeholder: 'e.g. N-3 (KYC/CDD)', key: 'current_node' }
        ]
    },
    {
        id: 'DCE_P3',
        title: 'Case Summary Report',
        description: 'Generate a comprehensive summary of the case including classification, documents, KYC, credit, and config status.',
        category: 'DCE_PIPELINE',
        icon: 'file-text',
        iconBg: 'bg-slate-100 text-slate-600',
        prompt: 'Generate a comprehensive case summary report. Include client classification, document completeness, KYC status, credit assessment, system configuration, and any outstanding actions.',
        successRate: 94,
        avgTime: '10s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },

    // ── DCE_INTAKE — SA-1 Intake & Triage (3 templates) ─────────────────
    {
        id: 'DCE_I1',
        title: 'Classify New Submission',
        description: 'Run SA-1 intake classification on a new account opening submission — determines entity type, jurisdiction, products, and priority.',
        category: 'DCE_INTAKE',
        icon: 'scan-search',
        iconBg: 'bg-blue-100 text-blue-600',
        prompt: 'Classify this new account opening submission. Determine the entity type, jurisdiction, products requested, priority level, and SLA deadline. Flag if manual review is needed.',
        successRate: 94,
        avgTime: '20s',
        inputs: [
            { label: 'Client Name', placeholder: 'e.g. ABC Trading Pte Ltd', key: 'client_name', required: true },
            { label: 'Entity Type', placeholder: 'e.g. CORP, FUND, FI, SPV', key: 'entity_type' },
            { label: 'Jurisdiction', placeholder: 'e.g. SGP, HKG, CHN', key: 'jurisdiction' }
        ]
    },
    {
        id: 'DCE_I2',
        title: 'View Classification Results',
        description: 'Retrieve the SA-1 classification output for a case — account type, confidence score, products, and priority reasoning.',
        category: 'DCE_INTAKE',
        icon: 'clipboard-check',
        iconBg: 'bg-blue-100 text-blue-700',
        prompt: 'Show me the classification results for this case. Include the account type, confidence score, products requested, priority level, and the reasoning behind the classification.',
        successRate: 98,
        avgTime: '3s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_I3',
        title: 'Update Client Information',
        description: 'Update core client details (contact person, email, phone, address) on an existing case after intake corrections.',
        category: 'DCE_INTAKE',
        icon: 'pencil',
        iconBg: 'bg-sky-100 text-sky-600',
        prompt: 'Update the client information for this case with the corrected details below. Recalculate any impacted classification fields if necessary.',
        successRate: 90,
        avgTime: '8s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Field to Update', placeholder: 'e.g. contact_email, jurisdiction', key: 'field', required: true },
            { label: 'New Value', placeholder: 'Enter updated value...', key: 'value', required: true }
        ]
    },

    // ── DCE_DOCS — SA-2 Document Collection (3 templates) ────────────────
    {
        id: 'DCE_D1',
        title: 'Check Document Completeness',
        description: 'Run SA-2 completeness assessment — match staged documents against the regulatory checklist, identify gaps.',
        category: 'DCE_DOCS',
        icon: 'file-check',
        iconBg: 'bg-purple-100 text-purple-600',
        prompt: 'Run a document completeness check for this case. Match all staged documents against the required regulatory checklist. Show matched, unmatched, and missing mandatory items with coverage percentage.',
        successRate: 96,
        avgTime: '12s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_D2',
        title: 'List Missing Documents',
        description: 'Retrieve the list of mandatory documents still missing and generate an RM chase message.',
        category: 'DCE_DOCS',
        icon: 'file-x',
        iconBg: 'bg-rose-100 text-rose-600',
        prompt: 'List all missing mandatory documents for this case. For each missing item, show the document type code, regulatory reference, and requirement level. Generate a professional RM chase message requesting the outstanding documents.',
        successRate: 95,
        avgTime: '8s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_D3',
        title: 'Document OCR & Extraction',
        description: 'Trigger OCR and data extraction on staged documents to auto-populate AO form fields.',
        category: 'DCE_DOCS',
        icon: 'file-search',
        iconBg: 'bg-violet-100 text-violet-600',
        prompt: 'Run OCR and data extraction on the staged documents for this case. Extract key fields like entity name, registration number, directors, and beneficial owners from the uploaded corporate documents. Map extracted data to AO form fields.',
        successRate: 88,
        avgTime: '30s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Document Type', placeholder: 'e.g. ACRA BizProfile, Board Resolution', key: 'doc_type' }
        ]
    },

    // ── DCE_SIGNATURE — SA-3 Signature Verification (2 templates) ────────
    {
        id: 'DCE_SIG1',
        title: 'Verify Signatures & Mandates',
        description: 'Run SA-3 signature verification — compare submitted signatures against specimen cards, check mandate authority.',
        category: 'DCE_SIGNATURE',
        icon: 'pen-tool',
        iconBg: 'bg-emerald-100 text-emerald-600',
        prompt: 'Run signature verification for this case. Compare each signatory against the board mandate and specimen signature cards. Report authority status, confidence scores, and flag any signatories that need clarification.',
        successRate: 93,
        avgTime: '25s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_SIG2',
        title: 'Review Signatory Decisions',
        description: 'Show the current HITL signatory decisions — approved, rejected, or pending clarification per signatory.',
        category: 'DCE_SIGNATURE',
        icon: 'user-cog',
        iconBg: 'bg-teal-100 text-teal-600',
        prompt: 'Show the signatory verification status for this case. List each signatory with their name, role in mandate, authority status, confidence score, and decision outcome. Highlight any rejected or clarification-required entries.',
        successRate: 97,
        avgTime: '5s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },

    // ── DCE_KYC — SA-4 KYC/CDD (3 templates) ────────────────────────────
    {
        id: 'DCE_KYC1',
        title: 'Get KYC Brief',
        description: 'Retrieve the SA-4 KYC/CDD brief — entity summary, ownership chain, UBOs, directors, screening results, and risk factors.',
        category: 'DCE_KYC',
        icon: 'shield',
        iconBg: 'bg-amber-100 text-amber-600',
        prompt: 'Retrieve the full KYC/CDD brief for this case. Show the entity summary, ownership chain, beneficial owners, directors, sanctions screening results, PEP flags, adverse media findings, source of wealth, and suggested risk range.',
        successRate: 95,
        avgTime: '10s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_KYC2',
        title: 'Run Name Screening',
        description: 'Screen entities and individuals against sanctions lists, PEP databases, and adverse media sources.',
        category: 'DCE_KYC',
        icon: 'search',
        iconBg: 'bg-orange-100 text-orange-600',
        prompt: 'Run name screening for the following entities and individuals associated with this case. Check against global sanctions lists, PEP databases, and adverse media sources. Report screening status for each name.',
        successRate: 97,
        avgTime: '15s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Names to Screen', placeholder: 'e.g. John Tan, ABC Trading Pte Ltd', key: 'names', type: 'textarea' }
        ]
    },
    {
        id: 'DCE_KYC3',
        title: 'Submit RM KYC Decision',
        description: 'Submit the RM decision for the KYC/CDD gate — risk rating, CDD clearance, BCAP, CAA approach, and credit limit recommendations.',
        category: 'DCE_KYC',
        icon: 'check-square',
        iconBg: 'bg-green-100 text-green-600',
        prompt: 'I want to submit my RM decision for the KYC/CDD review. Help me fill in the risk rating, CDD clearance level, BCAP clearance, CAA approach, recommended DCE limit, and any additional conditions.',
        successRate: 90,
        avgTime: '30s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Risk Rating', placeholder: 'LOW / MEDIUM / HIGH', key: 'risk_rating', required: true },
            { label: 'Recommended DCE Limit (SGD)', placeholder: 'e.g. 5000000', key: 'dce_limit' }
        ]
    },

    // ── DCE_CREDIT — SA-5 Credit Risk (2 templates) ──────────────────────
    {
        id: 'DCE_CR1',
        title: 'Get Credit Assessment',
        description: 'Retrieve the SA-5 credit brief — financial analysis, leverage ratio, liquidity, revenue trend, and estimated initial limit.',
        category: 'DCE_CREDIT',
        icon: 'trending-up',
        iconBg: 'bg-rose-100 text-rose-600',
        prompt: 'Retrieve the credit risk assessment for this case. Show the financial analysis summary, key metrics (leverage ratio, liquidity ratio, revenue trend), product risk profile, comparable benchmarks, estimated initial limit, and any open questions for the credit team.',
        successRate: 94,
        avgTime: '10s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_CR2',
        title: 'Submit Credit Decision',
        description: 'Submit the Credit Team decision — approved/declined, approved DCE and PCE limits, CAA approach, and conditions.',
        category: 'DCE_CREDIT',
        icon: 'check-circle',
        iconBg: 'bg-red-100 text-red-600',
        prompt: 'I want to submit the credit team decision for this case. Help me record the credit outcome, approved DCE limit, approved PCE limit, confirmed CAA approach, and any conditions attached to the approval.',
        successRate: 91,
        avgTime: '20s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true },
            { label: 'Credit Outcome', placeholder: 'APPROVED / APPROVED_WITH_CONDITIONS / DECLINED', key: 'outcome', required: true },
            { label: 'Approved DCE Limit (SGD)', placeholder: 'e.g. 5000000', key: 'dce_limit' }
        ]
    },

    // ── DCE_CONFIG — SA-6 Account Configuration (3 templates) ────────────
    {
        id: 'DCE_CF1',
        title: 'View Config Specification',
        description: 'Retrieve the SA-6 account configuration — UBIX, SIC, CreditView settings, authorized traders, and TMO instructions.',
        category: 'DCE_CONFIG',
        icon: 'settings',
        iconBg: 'bg-cyan-100 text-cyan-600',
        prompt: 'Show the full account configuration specification for this case. Include UBIX config (entity, jurisdiction, LEI, product permissions), SIC config (account mapping, commission rates, credit limits), CreditView config (contract mapping, margin rates), and authorized traders with their CQG access and trading permissions.',
        successRate: 95,
        avgTime: '8s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_CF2',
        title: 'Generate TMO Instructions',
        description: 'Generate the step-by-step TMO static data setup instructions for UBIX, SIC, and CreditView systems.',
        category: 'DCE_CONFIG',
        icon: 'list-checks',
        iconBg: 'bg-sky-100 text-sky-600',
        prompt: 'Generate the TMO (Trade Management Office) setup instructions for this case. Produce step-by-step instructions for UBIX account creation, SIC account mapping, CreditView configuration, and trader setup. Include the validation checklist with expected values for each system.',
        successRate: 92,
        avgTime: '20s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_CF3',
        title: 'Validate System Setup',
        description: 'Run TMO system validation against UBIX, SIC, and CreditView to verify all fields match the spec.',
        category: 'DCE_CONFIG',
        icon: 'check-circle',
        iconBg: 'bg-emerald-100 text-emerald-700',
        prompt: 'Run system validation for this case. Check UBIX, SIC, and CreditView configurations against the approved specification. Report pass/fail for each system, fields checked vs fields passed, and list any discrepancies with expected vs actual values.',
        successRate: 93,
        avgTime: '15s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },

    // ── DCE_NOTIFY — SA-7 Notifications & Welcome Kit (2 templates) ──────
    {
        id: 'DCE_N1',
        title: 'Generate Welcome Kit',
        description: 'Trigger SA-7 to generate the welcome kit — CQG credentials, IDB portal access, enabled products, and notification dispatch.',
        category: 'DCE_NOTIFY',
        icon: 'package',
        iconBg: 'bg-violet-100 text-violet-600',
        prompt: 'Generate and send the welcome kit for this case. Create CQG login credentials, configure IDB portal access, list all enabled products and approved DCE limits. Dispatch welcome notifications to the client and RM via email and portal.',
        successRate: 95,
        avgTime: '30s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
    {
        id: 'DCE_N2',
        title: 'Check Notification Status',
        description: 'View all notifications sent for a case — delivery status, channels, recipients, and timestamps.',
        category: 'DCE_NOTIFY',
        icon: 'bell',
        iconBg: 'bg-pink-100 text-pink-600',
        prompt: 'Show all notifications sent for this case. List each notification with its type, channel (email/portal/SMS), recipient, subject, delivery status, and timestamp. Flag any failed deliveries.',
        successRate: 98,
        avgTime: '5s',
        inputs: [
            { label: 'Case ID', placeholder: 'e.g. DCE-2026-0042-SGP-001', key: 'case_id', required: true }
        ]
    },
];
