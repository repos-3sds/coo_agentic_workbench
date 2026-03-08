/**
 * NPA Detail V2 — Mock Data
 * ─────────────────────────
 * All mock / demo data for the NPA detail page.
 * Replace individual constants with real API responses when backend is ready.
 *
 * Data mirrors the official NPA Template (Part C I–VII + Appendices 1–6)
 * as defined in src/app/lib/npa-template-definition.ts.
 *
 * Field registry coverage: 200+ fields across 13 sections.
 * Fill strategies: RULE (63), COPY (60), LLM (149), MANUAL (67).
 */

import {
  TabDef,
  WorkflowStage,
  ChatMessage,
  DocumentItem,
  MissingDocItem,
  ProjectData,
} from './npa-detail.models';

import {
  ClassificationResult,
  RiskAssessment,
  MLPrediction,
  GovernanceState,
  DocCompletenessResult,
  MonitoringResult,
} from '../../../lib/agent-interfaces';

import {
  DraftSection,
  DraftComment,
  DraftAgentMessage,
  ReferenceNPA,
} from '../../../components/draft-builder/models/draft.models';

// ═══════════════════════════════════════════════════════════════
// Tab Bar Configuration
// ═══════════════════════════════════════════════════════════════

export const MOCK_TABS: TabDef[] = [
  { id: 'PROPOSAL',  label: 'Proposal',  icon: 'briefcase' },
  { id: 'DOCUMENTS', label: 'Documents', icon: 'file-text',       badge: 3,     badgeColor: 'amber' },
  { id: 'ANALYSIS',  label: 'Analysis',  icon: 'bar-chart-3' },
  { id: 'SIGNOFF',   label: 'Sign-Off',  icon: 'clipboard-check', badge: '2/5' },
  { id: 'WORKFLOW',  label: 'Workflow',   icon: 'git-branch' },
  { id: 'MONITOR',   label: 'Monitor',   icon: 'activity',        badge: 1,     badgeColor: 'red' },
  { id: 'CHAT',      label: 'Chat',      icon: 'message-square' },
];

// ═══════════════════════════════════════════════════════════════
// Project / Proposal
// ═══════════════════════════════════════════════════════════════

export const MOCK_PROJECT: ProjectData = {
  id: 'NPA-2026-00142',
  title: 'Structured Commodity Trade Finance Facility - PT Borneo Agri',
  productType: 'Trade Finance',
  approvalTrack: 'Full NPA',
  submittedBy: 'Sarah Chen',
  submittedDate: '2026-02-18',
  currentStage: 'Risk Assessment',
  department: 'Institutional Banking',
  businessUnit: 'Trade & Working Capital',
  region: 'Southeast Asia',
  currency: 'USD',
  notionalAmount: 125_000_000,
  tenor: '3 years',
  crossBorder: true,
  ntg: true,
  pacStatus: 'Pending',
  proposalSummary:
    'Structured commodity trade finance facility for PT Borneo Agri to support palm oil and rubber export operations across Indonesia, Malaysia and Singapore. The facility includes a revolving credit component, pre-export financing, and receivables discounting.',
  keyTerms: [
    { label: 'Facility Type', value: 'Revolving + Term' },
    { label: 'Notional',      value: 'USD 125,000,000' },
    { label: 'Tenor',         value: '3 Years' },
    { label: 'Pricing',       value: 'SOFR + 185bps' },
    { label: 'Security',      value: 'Commodity Pledge + Corporate Guarantee' },
    { label: 'Governing Law', value: 'English Law' },
  ],
  intakeChecklist: [
    { item: 'KYC/CDD Complete',             done: true },
    { item: 'Credit Rating Obtained',       done: true },
    { item: 'Sanctions Screening Clear',    done: true },
    { item: 'Product Suitability Confirmed', done: false },
    { item: 'Cross-Border Tax Analysis',    done: false },
  ],
};

// ═══════════════════════════════════════════════════════════════
// Classification
// ═══════════════════════════════════════════════════════════════

export const MOCK_CLASSIFICATION: ClassificationResult = {
  type: 'NTG',
  track: 'Full NPA',
  overallConfidence: 0.92,
  scores: [
    { criterion: 'Product Novelty',       score: 9, maxScore: 10, reasoning: 'New structured commodity facility not in existing product taxonomy.' },
    { criterion: 'Regulatory Complexity', score: 8, maxScore: 10, reasoning: 'Cross-border elements require multi-jurisdictional review.' },
    { criterion: 'Risk Materiality',      score: 7, maxScore: 10, reasoning: 'USD 125M notional exceeds threshold for enhanced review.' },
    { criterion: 'Operational Readiness', score: 6, maxScore: 10, reasoning: 'Systems partially configured; manual workarounds needed for commodity pledge.' },
  ],
  prohibitedMatch: { matched: false },
  mandatorySignOffs: ['Credit Risk', 'Legal & Compliance', 'Finance VP', 'Business Head'],
  analysisSummary: [
    'Product classified as NTG due to novel commodity pledge structure.',
    'Full NPA track triggered by notional > USD 50M and cross-border scope.',
    'No prohibited product matches found.',
  ],
};

// ═══════════════════════════════════════════════════════════════
// Risk Assessment
// ═══════════════════════════════════════════════════════════════

export const MOCK_RISK: RiskAssessment = {
  overallScore: 62,
  overallRating: 'MEDIUM',
  hardStop: false,
  layers: [
    {
      name: 'Internal Policy', status: 'PASS',
      details: 'Complies with MBS commodity finance policy 2025.',
      checks: [
        { name: 'Approved counterparty list', status: 'PASS',    detail: 'PT Borneo Agri is on the approved list.' },
        { name: 'Notional limit check',       status: 'WARNING', detail: 'Within limit but uses 78% of available capacity.' },
      ],
    },
    {
      name: 'Regulatory', status: 'PASS',
      details: 'MAS and OJK requirements satisfied.',
      checks: [
        { name: 'MAS Notice 757',         status: 'PASS', detail: 'Capital adequacy maintained.' },
        { name: 'Cross-border reporting',  status: 'PASS', detail: 'FATCA/CRS obligations met.' },
      ],
    },
    {
      name: 'Sanctions', status: 'PASS',
      details: 'No sanctions hits across all screening databases.',
      checks: [
        { name: 'OFAC SDN',            status: 'PASS', detail: 'No match.' },
        { name: 'EU Consolidated List', status: 'PASS', detail: 'No match.' },
        { name: 'MAS Sanctions',        status: 'PASS', detail: 'No match.' },
      ],
    },
    {
      name: 'Dynamic', status: 'WARNING',
      details: 'Commodity price volatility detected in palm oil futures.',
      checks: [
        { name: 'Market volatility index', status: 'WARNING', detail: 'Palm oil futures 30-day vol at 28% (threshold: 25%).' },
        { name: 'Country risk update',     status: 'PASS',    detail: 'Indonesia sovereign rating stable at BBB.' },
      ],
    },
    {
      name: 'Finance & Tax', status: 'PASS',
      details: 'Transfer pricing and withholding tax structures confirmed.',
      checks: [
        { name: 'WHT optimization',  status: 'PASS', detail: 'Singapore-Indonesia DTA applicable.' },
        { name: 'ROAE projection',   status: 'PASS', detail: 'Projected ROAE 14.2% exceeds hurdle rate.' },
      ],
    },
  ],
  domainAssessments: [
    { domain: 'CREDIT',       score: 55, rating: 'MEDIUM', keyFindings: ['Strong operating cash flow', 'Leverage ratio within tolerance'],                  mitigants: ['Corporate guarantee from parent'] },
    { domain: 'MARKET',       score: 72, rating: 'HIGH',   keyFindings: ['Commodity price exposure', 'FX volatility (IDR/USD)'],                             mitigants: ['Natural hedge via export receivables', 'Monthly margin calls'] },
    { domain: 'OPERATIONAL',  score: 45, rating: 'MEDIUM', keyFindings: ['Manual commodity pledge process'],                                                  mitigants: ['Warehouse monitoring by SGS'] },
    { domain: 'LEGAL',        score: 38, rating: 'LOW',    keyFindings: ['Standard documentation framework'],                                                mitigants: ['English law governing agreement'] },
    { domain: 'REPUTATIONAL', score: 50, rating: 'MEDIUM', keyFindings: ['ESG concerns in palm oil sector'],                                                 mitigants: ['RSPO certification confirmed'] },
    { domain: 'LIQUIDITY',    score: 30, rating: 'LOW',    keyFindings: ['Matched funding available'],                                                       mitigants: ['FTP rate locked'] },
    { domain: 'CYBER',        score: 25, rating: 'LOW',    keyFindings: ['Standard connectivity'],                                                           mitigants: ['SWIFT messaging only'] },
  ],
  prerequisites: [
    { name: 'KYC/CDD Complete',          status: 'PASS', category: 'Compliance' },
    { name: 'Credit Rating (Internal)',  status: 'PASS', category: 'Credit' },
    { name: 'Product Suitability',       status: 'FAIL', category: 'Business' },
    { name: 'Tax Structuring Sign-Off',  status: 'PASS', category: 'Finance' },
  ],
  pirRequirements: { required: true, type: 'Standard', deadline_months: 12, conditions: ['Annual review of commodity exposure', 'Quarterly margin monitoring'] },
  circuitBreaker: { triggered: false, loop_back_count: 1, threshold: 3, escalation_target: 'Group Risk Officer' },
  evergreenLimits: { eligible: false, notional_remaining: 0, deal_count_remaining: 0, flags: ['NTG products not eligible for evergreen'] },
  notionalFlags: { finance_vp_required: true, cfo_required: false, roae_required: true, threshold_breached: 'None' },
  recommendations: [
    'Complete product suitability assessment before proceeding to sign-off.',
    'Implement automated commodity price alert system for ongoing monitoring.',
    'Consider reducing notional to USD 100M to ease capacity constraints.',
    'Engage external legal counsel for Indonesian pledge perfection.',
  ],
  mandatorySignoffs: ['Credit Risk', 'Legal & Compliance', 'Finance VP', 'Business Head', 'Operations'],
};

// ═══════════════════════════════════════════════════════════════
// ML Prediction
// ═══════════════════════════════════════════════════════════════

export const MOCK_ML_PREDICTION: MLPrediction = {
  approvalLikelihood: 78,
  timelineDays: 42,
  bottleneckDept: 'Legal & Compliance',
  riskScore: 35,
  features: [
    { name: 'Notional Amount',                      importance: 0.28, value: 'USD 125M' },
    { name: 'Cross-Border Flag',                    importance: 0.22, value: 'Yes' },
    { name: 'Product Novelty (NTG)',                importance: 0.19, value: 'Yes' },
    { name: 'Counterparty Rating',                  importance: 0.15, value: 'BBB+' },
    { name: 'Historical Approval Rate (Sector)',    importance: 0.10, value: '72%' },
    { name: 'Document Completeness',                importance: 0.06, value: '68%' },
  ],
  comparisonInsights: [
    'Similar commodity trade finance deals approved in 38 days on average.',
    'Cross-border NTG products have 15% longer approval timelines.',
    'Legal & Compliance review is the #1 bottleneck for this product category.',
    'Approval likelihood improves by 12% once all documents are submitted.',
  ],
};

// ═══════════════════════════════════════════════════════════════
// Governance / Sign-Off
// ═══════════════════════════════════════════════════════════════

export const MOCK_GOVERNANCE: GovernanceState = {
  signoffs: [
    { department: 'Business Head',      status: 'APPROVED', assignee: 'James Wong',   decidedAt: '2026-02-20T10:30:00Z', slaDeadline: '2026-02-22', slaBreached: false },
    { department: 'Credit Risk',        status: 'APPROVED', assignee: 'Priya Sharma', decidedAt: '2026-02-22T14:15:00Z', slaDeadline: '2026-02-25', slaBreached: false },
    { department: 'Legal & Compliance', status: 'PENDING',  assignee: 'David Lim',    slaDeadline: '2026-02-28', slaBreached: false },
    { department: 'Finance VP',         status: 'PENDING',  assignee: 'Michelle Tan', slaDeadline: '2026-03-03', slaBreached: false },
    { department: 'Operations',         status: 'PENDING',  assignee: 'Raj Patel',    slaDeadline: '2026-03-05', slaBreached: false },
  ],
  slaStatus: 'on_track',
  loopBackCount: 1,
  circuitBreaker: false,
  circuitBreakerThreshold: 3,
  escalation: undefined,
};

// ═══════════════════════════════════════════════════════════════
// Document Completeness
// ═══════════════════════════════════════════════════════════════

export const MOCK_DOC_COMPLETENESS: DocCompletenessResult = {
  completenessPercent: 68,
  totalRequired: 12,
  totalPresent: 9,
  totalValid: 8,
  stageGateStatus: 'WARNING',
  missingDocs: [
    { docType: 'Product Suitability Assessment', reason: 'Required for NTG products',       priority: 'BLOCKING' },
    { docType: 'External Legal Opinion',         reason: 'Required for cross-border pledge', priority: 'BLOCKING' },
    { docType: 'ESG Due Diligence Report',       reason: 'Required for palm oil sector',     priority: 'WARNING' },
  ],
  invalidDocs: [
    { docType: 'Board Resolution', reason: 'Expired (dated 2024)', action: 'Request updated resolution from counterparty' },
  ],
  conditionalRules: [
    { condition: 'Cross-border flag = true', requiredDoc: 'Tax Structuring Memo',          status: 'PRESENT' },
    { condition: 'Notional > USD 50M',       requiredDoc: 'Finance VP Sign-Off',           status: 'PENDING' },
    { condition: 'NTG = true',               requiredDoc: 'Product Suitability Assessment', status: 'MISSING' },
  ],
  expiringDocs: [
    { docType: 'KYC Package',           expiryDate: '2026-06-15', daysRemaining: 109, alertLevel: 'INFO' },
    { docType: 'Insurance Certificate', expiryDate: '2026-04-01', daysRemaining: 34,  alertLevel: 'WARNING' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// Monitoring
// ═══════════════════════════════════════════════════════════════

export const MOCK_MONITORING: MonitoringResult = {
  productHealth: 'WARNING',
  metrics: [
    { name: 'Utilization Rate',       value: 78,    unit: '%',     threshold: 85,    trend: 'up' },
    { name: 'Days Past Due',          value: 0,     unit: 'days',  threshold: 30,    trend: 'stable' },
    { name: 'Commodity Price Index',  value: 92,    unit: 'index', threshold: 80,    trend: 'down' },
    { name: 'FX Exposure (IDR/USD)',  value: 15800, unit: 'IDR',   threshold: 16000, trend: 'up' },
    { name: 'Collateral Coverage',    value: 1.35,  unit: 'x',     threshold: 1.2,   trend: 'stable' },
  ],
  breaches: [
    {
      metric: 'Palm Oil 30-Day Volatility',
      threshold: 25, actual: 28.4, severity: 'WARNING',
      message: 'Commodity price volatility exceeds monitoring threshold.',
      firstDetected: '2026-02-20', trend: 'worsening',
    },
  ],
  conditions: [
    { type: 'Financial Covenant', description: 'Debt-to-equity ratio < 2.5x',    deadline: '2026-06-30', status: 'Compliant', daysRemaining: 124 },
    { type: 'Reporting',          description: 'Quarterly financial statements',  deadline: '2026-03-31', status: 'Pending',   daysRemaining: 33 },
    { type: 'Insurance',          description: 'Cargo insurance renewal',         deadline: '2026-04-01', status: 'Due Soon',  daysRemaining: 34 },
  ],
  pirStatus: 'Scheduled',
  pirDueDate: '2027-02-18',
};

// ═══════════════════════════════════════════════════════════════
// Workflow Stages
// ═══════════════════════════════════════════════════════════════

export const MOCK_WORKFLOW_STAGES: WorkflowStage[] = [
  { id: 'intake',         label: 'Intake & Screening',    status: 'completed', date: '2026-02-15', assignee: 'Sarah Chen' },
  { id: 'classification', label: 'Classification',        status: 'completed', date: '2026-02-17', assignee: 'AI Agent' },
  { id: 'risk',           label: 'Risk Assessment',       status: 'active',    date: '2026-02-19', assignee: 'AI Agent + Priya Sharma' },
  { id: 'signoff',        label: 'Sign-Off Collection',   status: 'pending',                       assignee: 'Multiple' },
  { id: 'legal-review',   label: 'Legal Review',          status: 'pending',                       assignee: 'David Lim' },
  { id: 'doc-checklist',  label: 'Document Checklist',    status: 'blocked',                       assignee: 'Operations' },
  { id: 'final-approval', label: 'Final Approval',        status: 'pending',                       assignee: 'EXCO' },
  { id: 'booking',        label: 'Booking & Settlement',  status: 'pending',                       assignee: 'Operations' },
];

// ═══════════════════════════════════════════════════════════════
// Documents List
// ═══════════════════════════════════════════════════════════════

export const MOCK_DOCUMENTS: DocumentItem[] = [
  { name: 'Term Sheet v3.2',                    type: 'Term Sheet',     category: 'Legal',      status: 'Valid',    uploadedBy: 'Sarah Chen',       date: '2026-02-16', size: '245 KB',  pages: 12 },
  { name: 'Board Resolution - Borrowing Auth',  type: 'Board Resolution', category: 'Legal',    status: 'Expired',  uploadedBy: 'Client',           date: '2024-06-15', size: '180 KB',  pages: 3 },
  { name: 'Credit Memo - PT Borneo Agri',       type: 'Credit Memo',    category: 'Credit',     status: 'Valid',    uploadedBy: 'Priya Sharma',     date: '2026-02-18', size: '1.2 MB',  pages: 28 },
  { name: 'Internal Credit Rating Model Output', type: 'Credit Rating',  category: 'Credit',    status: 'Valid',    uploadedBy: 'System',           date: '2026-02-17', size: '95 KB',   pages: 5 },
  { name: 'KYC Package (Consolidated)',          type: 'KYC/CDD',       category: 'Compliance', status: 'Valid',    uploadedBy: 'Compliance Team',  date: '2025-12-10', size: '3.4 MB',  pages: 45 },
  { name: 'Sanctions Screening Report',          type: 'Sanctions',      category: 'Compliance', status: 'Valid',    uploadedBy: 'System',           date: '2026-02-15', size: '120 KB',  pages: 8 },
  { name: 'Tax Structuring Memo',                type: 'Tax Memo',       category: 'Financial',  status: 'Valid',    uploadedBy: 'Tax Advisory',     date: '2026-02-14', size: '890 KB',  pages: 16 },
  { name: 'Insurance Certificate - Cargo',       type: 'Insurance',      category: 'Financial',  status: 'Expiring', uploadedBy: 'Client',          date: '2025-04-01', size: '340 KB',  pages: 4 },
  { name: 'Valuation Report - Commodity Stocks', type: 'Valuation',      category: 'Financial',  status: 'Valid',    uploadedBy: 'SGS',              date: '2026-02-12', size: '2.1 MB',  pages: 22 },
];

export const MOCK_DOC_CATEGORIES = ['Legal', 'Credit', 'Compliance', 'Financial'];

export const MOCK_MISSING_DOC_ITEMS: MissingDocItem[] = [
  { name: 'Product Suitability Assessment', category: 'Credit',     reason: 'Required for NTG products',       priority: 'BLOCKING' },
  { name: 'External Legal Opinion',         category: 'Legal',      reason: 'Required for cross-border pledge', priority: 'BLOCKING' },
  { name: 'ESG Due Diligence Report',       category: 'Compliance', reason: 'Required for palm oil sector',     priority: 'WARNING' },
];

// ═══════════════════════════════════════════════════════════════
// Chat Messages (main page Chat tab)
// ═══════════════════════════════════════════════════════════════

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: '1', role: 'agent', agentName: 'Orchestrator', text: 'NPA analysis initiated for PT Borneo Agri facility. Running classification, risk assessment, and document checks.', timestamp: '10:30 AM' },
  { id: '2', role: 'agent', agentName: 'Classifier',   text: 'Product classified as NTG (New-To-Group). Full NPA approval track selected. Confidence: 92%.', timestamp: '10:31 AM' },
  { id: '3', role: 'user',                              text: 'Why was this flagged as NTG? We have similar commodity trade facilities.', timestamp: '10:32 AM' },
  { id: '4', role: 'agent', agentName: 'Classifier',   text: 'The structured commodity pledge component with cross-border Indonesian collateral is not present in any existing product. The revolving + term hybrid structure also differs from standard trade finance templates.', timestamp: '10:32 AM' },
  { id: '5', role: 'agent', agentName: 'Risk Agent',   text: 'Risk assessment complete. Overall: MEDIUM (62/100). Key concern: commodity price volatility in palm oil sector. No hard stops detected.', timestamp: '10:35 AM' },
  { id: '6', role: 'agent', agentName: 'Doc Lifecycle', text: 'Warning: 3 documents missing. Product Suitability Assessment and External Legal Opinion are blocking. Stage gate status: WARNING.', timestamp: '10:36 AM' },
];

// ═══════════════════════════════════════════════════════════════
// Reference NPAs
// ═══════════════════════════════════════════════════════════════

export const MOCK_REFERENCE_NPAS: ReferenceNPA[] = [
  { id: 'NPA-2025-00089', title: 'Palm Oil Trade Finance (Indonesia)',        approvedDate: '2025-06-12', fieldsCopied: 12, similarity: 87 },
  { id: 'NPA-2025-00034', title: 'Rubber Commodity Revolving Facility',       approvedDate: '2025-03-22', fieldsCopied: 0,  similarity: 74 },
  { id: 'NPA-2024-00201', title: 'Structured Agri Export Finance (MY)',       approvedDate: '2024-11-05', fieldsCopied: 0,  similarity: 68 },
  { id: 'NPA-2024-00156', title: 'Cross-Border Commodity Pledge (SG-ID)',     approvedDate: '2024-08-18', fieldsCopied: 0,  similarity: 61 },
];

// ═══════════════════════════════════════════════════════════════
// Draft Builder — Comments
// ═══════════════════════════════════════════════════════════════

export const MOCK_DRAFT_COMMENTS: DraftComment[] = [
  { id: 'c1', fieldKey: 'product_description', author: 'Priya Sharma', text: 'Please elaborate on the revolving credit component — is there a clean-down requirement?', timestamp: '2026-02-20 11:30', resolved: false },
  { id: 'c2', fieldKey: 'risk_appetite',       author: 'David Lim',    text: 'Need to cross-reference with Group Risk Appetite Statement 2026 Q1 update.',             timestamp: '2026-02-21 09:15', resolved: false },
  { id: 'c3', fieldKey: 'manual_workarounds',  author: 'Raj Patel',    text: 'Ops team confirmed Q3 2026 system enhancement is on track. Manual process SOP is ready.',  timestamp: '2026-02-22 14:45', resolved: true },
];

// ═══════════════════════════════════════════════════════════════
// Draft Builder — Agent Chat Messages
// ═══════════════════════════════════════════════════════════════

export const MOCK_DRAFT_AGENT_MESSAGES: DraftAgentMessage[] = [
  { id: 'da1', role: 'agent', agentTeam: 'Orchestrator',   text: 'Draft builder initialized. I\'ve pre-filled 142 of 203 fields using a combination of RULE lookups (63), COPY from reference NPA-2025-00089 (38), and LLM analysis (41). 61 fields require manual input.',       timestamp: '10:15 AM', citations: ['NPA-2025-00089 (Palm Oil Trade Finance)'] },
  { id: 'da2', role: 'agent', agentTeam: 'Business',       text: 'Section I (Product Specifications) is 85% complete. Key gaps: PAC conditions (waiting for PAC meeting outcome) and marketing plan. Revenue projections are AI-generated with 72-75% confidence — please verify with Finance.', timestamp: '10:16 AM', citations: ['Classification Agent Output', 'FY2026 Revenue Model v2'] },
  { id: 'da3', role: 'user',                                text: 'Can you help fill in the NTG justification field?',                                                                                                                                                              timestamp: '10:18 AM' },
  { id: 'da4', role: 'agent', agentTeam: 'Business',       text: 'Done. I\'ve drafted the NTG justification based on the classification agent output. The key differentiators are: (1) structured commodity pledge with cross-border Indonesian collateral — not present in existing product taxonomy, (2) revolving + term hybrid structure differs from standard TF templates. Confidence: 91%.', timestamp: '10:18 AM', citations: ['NPA Policy Manual v4.2, Section 2.3', 'Product Taxonomy 2026'] },
  { id: 'da5', role: 'agent', agentTeam: 'Risk Mgmt',     text: 'Section IV (Risk Analysis) partially pre-filled from risk assessment agent. Credit risk, market risk, and reputational risk sections are complete. Still missing: "Regulatory Capital Requirements" (PC.IV.B.3) and "Large Exposure Rules" (PC.IV.C.6) — these require Finance VP input.',                                 timestamp: '10:22 AM', citations: ['Risk Assessment Output (Score: 62/100)', 'MBS Risk Appetite Statement Q1 2026'] },
  { id: 'da6', role: 'agent', agentTeam: 'Legal & Compl.', text: 'Appendix 3 (Financial Crime) pre-filled. AML assessment and sanctions screening are auto-populated from compliance systems. FC risk rating set to Medium based on commodity sector + cross-border factors. Please review fraud risk section.',                                                                              timestamp: '10:25 AM', citations: ['Sanctions Screening Report (Feb 2026)', 'AML Policy Framework v5.1'] },
  { id: 'da7', role: 'user',                                text: 'What about the operational adequacy section? Ops team flagged some concerns.',                                                                                                                                    timestamp: '10:28 AM' },
  { id: 'da8', role: 'agent', agentTeam: 'Tech & Ops',     text: 'I\'ve flagged 3 manual workarounds in Section II.1.f. The ops adequacy checklist (II.1.c) shows: staffing needs 2 additional ops staff for Q2, process docs are 80% complete, and system readiness is partial (Q3 enhancement pending). Raj Patel from Ops has left a comment confirming the Q3 timeline is on track.',    timestamp: '10:29 AM', citations: ['Ops Readiness Assessment (Feb 2026)', 'TFP Enhancement Roadmap Q2-Q3'] },
];


// ═══════════════════════════════════════════════════════════════
// Draft Builder — Sections & Fields
// Part C (I–VII) + Appendices (1–6)  •  13 sections  •  200+ fields
// ═══════════════════════════════════════════════════════════════

export const MOCK_DRAFT_SECTIONS: DraftSection[] = [

  // ═══════════════════════════════════════════════════════════
  // PART C — Section I: Product Specifications
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.I', label: 'Product Specifications', numbering: 'I', owner: 'BIZ', icon: 'briefcase',
    fields: [],
    subSections: [
      {
        id: 'PC.I.1', numbering: '1', label: 'Description',
        guidance: 'Product description, rationale, scope, revenue, business model, and SPV involvement.',
        fields: [
          { key: 'business_rationale', label: 'Purpose / Rationale for Proposal', type: 'textarea', value: 'A structured commodity trade finance facility designed to support palm oil and rubber export operations across Indonesia, Malaysia, and Singapore.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.88, guidance: 'Describe the purpose or rationale — what are the benefits to customers or BU/SU? Address the problem statement and value proposition.', nodeId: 'PC.I.1.a', maxLength: 2000 },
          { key: 'problem_statement', label: 'Problem Statement', type: 'textarea', value: 'Current commodity trade finance products do not support cross-border collateral structures with Indonesian pledge mechanisms.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.I.1.a' },
          { key: 'value_proposition', label: 'Value Proposition', type: 'textarea', value: 'Enables MBS to capture commodity trade flows across ASEAN with a single integrated facility.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.83, nodeId: 'PC.I.1.a' },
          { key: 'customer_benefit', label: 'Benefits to Customers', type: 'textarea', value: 'Single-facility access to revolving credit, pre-export financing, and receivables discounting across 3 jurisdictions.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.86, nodeId: 'PC.I.1.a' },
          { key: 'bu_benefit', label: 'Benefits to Business Unit', type: 'textarea', value: 'Expands IBG commodity trade finance franchise across ASEAN. Estimated incremental revenue of USD 4.5M in Year 1.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.I.1.a' },
          { key: 'competitive_landscape', label: 'Competitive Landscape', type: 'textarea', value: 'Limited competition in cross-border commodity pledge space. OCBC and UOB offer simpler bilateral facilities without cross-border collateral.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.77, nodeId: 'PC.I.1.a' },
          { key: 'market_opportunity', label: 'Market Opportunity', type: 'textarea', value: 'ASEAN palm oil trade valued at USD 28B annually. MBS market share currently 4.2%, target 6% within 3 years.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.74, nodeId: 'PC.I.1.a' },
          { key: 'product_name', label: 'Product / Service Name', type: 'text', value: 'Structured Commodity Trade Finance Facility', required: true, strategy: 'RULE', lineage: 'AUTO', confidence: 0.95, nodeId: 'PC.I.1.b' },
          { key: 'product_type', label: 'Product Type', type: 'dropdown', value: 'Trade Finance', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['Derivative', 'Structured Product', 'Loan', 'Bond', 'Fund', 'Insurance', 'Digital Asset', 'Trade Finance', 'Other'], nodeId: 'PC.I.1.b' },
          { key: 'underlying_asset', label: 'Underlying Asset', type: 'text', value: 'Palm Oil (CPO) & Rubber', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.92, nodeId: 'PC.I.1.b' },
          { key: 'currency_denomination', label: 'Currency Denomination', type: 'dropdown', value: 'USD', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'AUD', 'INR', 'IDR', 'Multi-currency'], nodeId: 'PC.I.1.b' },
          { key: 'tenor', label: 'Tenor', type: 'text', value: '3 Years', required: true, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.1.b' },
          { key: 'funding_type', label: 'Funded vs Unfunded', type: 'dropdown', value: 'Funded', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['Funded', 'Unfunded', 'Partially Funded'], nodeId: 'PC.I.1.b' },
          { key: 'repricing_info', label: 'Repricing Information', type: 'text', value: 'Quarterly SOFR reset', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.1.b' },
          { key: 'product_role', label: 'Role of Proposing Unit', type: 'dropdown', value: 'Principal', required: false, strategy: 'COPY', lineage: 'AUTO', options: ['Manufacturer', 'Distributor', 'Principal', 'Agent', 'Arranger'], nodeId: 'PC.I.1.b' },
          { key: 'product_maturity', label: 'Product Maturity', type: 'dropdown', value: 'New', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['New', 'Established', 'Mature', 'Sunset'], nodeId: 'PC.I.1.b' },
          { key: 'product_lifecycle', label: 'Product Lifecycle Stage', type: 'text', value: 'Launch — first deal expected Q2 2026', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.I.1.b' },
          { key: 'product_features', label: 'Key Product Features', type: 'bullet_list', value: '', required: true, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['Revolving credit component (USD 75M)', 'Pre-export financing (USD 30M)', 'Receivables discounting (USD 20M)', 'Commodity pledge with SGS monitoring', 'Cross-border collateral structure'], nodeId: 'PC.I.1.b' },
          { key: 'product_benchmark', label: 'Benchmark / Reference Rate', type: 'text', value: 'SOFR (Secured Overnight Financing Rate)', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.1.b' },
          { key: 'notional_amount', label: 'Transaction Volume (Notional)', type: 'currency', value: '125000000', required: true, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.1.c' },
          { key: 'expected_volume', label: 'Expected Annual Volume', type: 'text', value: '40-60 trade transactions per year', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.72, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year1', label: 'Revenue Year 1 (Gross)', type: 'currency', value: '4500000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.75, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year1_net', label: 'Revenue Year 1 (Net)', type: 'currency', value: '3200000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.73, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year2', label: 'Revenue Year 2 (Gross)', type: 'currency', value: '5200000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.72, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year2_net', label: 'Revenue Year 2 (Net)', type: 'currency', value: '3900000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.70, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year3', label: 'Revenue Year 3 (Gross)', type: 'currency', value: '5800000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.70, nodeId: 'PC.I.1.c' },
          { key: 'revenue_year3_net', label: 'Revenue Year 3 (Net)', type: 'currency', value: '4400000', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.68, nodeId: 'PC.I.1.c' },
          { key: 'product_notional_ccy', label: 'Notional Currency', type: 'text', value: 'USD', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.1.c' },
          { key: 'transfer_pricing', label: 'Transfer Pricing Arrangement', type: 'textarea', value: 'FTP charged at 4.20% for 3-year tenor. Net spread to business: 65bps.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.76, nodeId: 'PC.I.1.c' },
          { key: 'target_roi', label: 'Target ROI', type: 'text', value: '14.2%', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.I.1.d' },
          { key: 'revenue_streams', label: 'Revenue Streams', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['Interest income (SOFR + 185bps)', 'Commitment fee (0.50% p.a.)', 'Arrangement fee (0.75% flat)', 'LC issuance fee (0.25% per txn)'], nodeId: 'PC.I.1.d' },
          { key: 'gross_margin_split', label: 'Gross Margin Split', type: 'text', value: 'IBG: 70%, Treasury: 20%, Ops: 10%', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.74, nodeId: 'PC.I.1.d' },
          { key: 'cost_allocation', label: 'Cost Allocation', type: 'textarea', value: 'Direct costs: ops staff (USD 200K), system config (USD 150K), legal fees (USD 120K). Allocated overhead: USD 80K.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.70, nodeId: 'PC.I.1.d' },
          { key: 'break_even_timeline', label: 'Break-Even Timeline', type: 'text', value: 'Month 8 at 75% utilization', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.72, nodeId: 'PC.I.1.d' },
          { key: 'spv_involved', label: 'Is SPV/SPE Involved?', type: 'yesno', value: 'No', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: false, nodeId: 'PC.I.1.e' },
        ]
      },
      {
        id: 'PC.I.2', numbering: '2', label: 'Target Customer',
        guidance: 'Customer segments, regulatory restrictions, suitability, geographic scope, and key risks.',
        fields: [
          { key: 'customer_segments', label: 'Target Customer Segments', type: 'multiselect', value: 'Corporate,Financial Institutions', required: true, strategy: 'MANUAL', lineage: 'MANUAL', options: ['Institutional', 'Corporate', 'SME', 'Retail - Mass', 'Retail - Affluent', 'Retail - Private Banking', 'Government', 'Financial Institutions'], nodeId: 'PC.I.2.a' },
          { key: 'customer_restrictions', label: 'Regulatory Restrictions on Customers', type: 'textarea', value: 'Must be licensed commodity exporters in Indonesia, Malaysia, or Singapore. Minimum annual turnover of USD 50M.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.I.2.b' },
          { key: 'customer_suitability', label: 'Customer Suitability Criteria', type: 'textarea', value: 'Accredited institutional investors or qualifying corporates with active commodity export operations.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.I.2.c' },
          { key: 'customer_accreditation', label: 'Accreditation Requirements', type: 'textarea', value: 'Accredited Investor status under SFA Section 4A or equivalent in respective jurisdictions.', required: false, strategy: 'COPY', lineage: 'ADAPTED', confidence: 0.84, nodeId: 'PC.I.2.c' },
          { key: 'customer_min_turnover', label: 'Minimum Annual Turnover', type: 'currency', value: '50000000', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'PC.I.2.d' },
          { key: 'customer_objectives', label: 'Customer Objectives & Risk Profile', type: 'textarea', value: '', required: false, strategy: 'LLM', lineage: 'MANUAL', placeholder: 'Describe target customers\' investment objectives and risk appetite...', nodeId: 'PC.I.2.e' },
          { key: 'customer_geographic', label: 'Target Markets / Locations', type: 'multiselect', value: 'Singapore,Indonesia', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['Singapore', 'Hong Kong', 'China', 'India', 'Indonesia', 'Taiwan', 'Rest of APAC', 'Global'], nodeId: 'PC.I.2.f' },
          { key: 'customer_key_risks', label: 'Key Risks Faced by Customers', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['Commodity price volatility', 'FX exposure (IDR/USD)', 'Counterparty credit risk'], nodeId: 'PC.I.2.g' },
        ]
      },
      {
        id: 'PC.I.3', numbering: '3', label: 'Commercialization Approach',
        guidance: 'Distribution channels, sales suitability, marketing, sales surveillance, and staff training.',
        fields: [
          { key: 'distribution_channels', label: 'Channel Availability', type: 'multiselect', value: 'MBS Bank,Direct Sales', required: true, strategy: 'COPY', lineage: 'AUTO', options: ['MBS Bank', 'MBSV', 'MBS Treasures', 'MBS Private Bank', 'digibank', 'Third Party Distributors', 'Direct Sales'], nodeId: 'PC.I.3.a' },
          { key: 'channel_rationale', label: 'Multi-Channel Rationale', type: 'textarea', value: 'IBG direct origination for corporate clients. Financial institution clients via FICC desk.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.I.3.a' },
          { key: 'sales_suitability', label: 'Sales Suitability & Onboarding', type: 'textarea', value: 'Standard IBG onboarding process with enhanced CDD for commodity clients. KYC review at origination and annual refresh.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.I.3.b' },
          { key: 'onboarding_process', label: 'Customer Onboarding Process', type: 'textarea', value: 'CDD/KYC → Credit Assessment → Facility Documentation → System Setup → Drawdown Activation', required: false, strategy: 'COPY', lineage: 'ADAPTED', confidence: 0.82, nodeId: 'PC.I.3.b' },
          { key: 'complaints_handling', label: 'Complaints Handling Process', type: 'textarea', value: 'Standard IBG complaints framework. Escalation to Head of Trade Finance for commodity-specific disputes.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.I.3.b' },
          { key: 'marketing_plan', label: 'Marketing & Communication Plan', type: 'textarea', value: '', required: false, strategy: 'LLM', lineage: 'MANUAL', placeholder: 'Describe the marketing plan...', nodeId: 'PC.I.3.c' },
          { key: 'sales_surveillance', label: 'Sales Surveillance', type: 'textarea', value: 'Monthly sales MI reporting. Quarterly review by IBG Head with compliance oversight.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.I.3.d' },
          { key: 'staff_training', label: 'Staff Training Requirements', type: 'textarea', value: 'Commodity trade finance product training for RMs (2-day course). System training for Ops team.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.I.3.e' },
        ]
      },
      {
        id: 'PC.I.4', numbering: '4', label: 'PAC Conditions',
        guidance: 'For NTG products, list conditions imposed by the Product Approval Committee.',
        fields: [
          { key: 'pac_reference', label: 'PAC Reference Number', type: 'text', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', placeholder: 'e.g., PAC-2026-Q1-042', nodeId: 'PC.I.4' },
          { key: 'pac_conditions', label: 'PAC Conditions List', type: 'bullet_list', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', bulletItems: [], nodeId: 'PC.I.4' },
          { key: 'pac_date', label: 'PAC Approval Date', type: 'date', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'PC.I.4' },
        ]
      },
      {
        id: 'PC.I.5', numbering: '5', label: 'External Parties',
        guidance: 'Details of all external parties involved including RASP reference and ESG data usage.',
        fields: [
          { key: 'external_parties_involved', label: 'External Parties Involved?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.I.5' },
          { key: 'ip_considerations', label: 'IP Considerations', type: 'textarea', value: 'No proprietary IP involved. Standard ISDA/LMA documentation framework.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.I.5' },
          { key: 'external_party_names', label: 'External Party Names', type: 'bullet_list', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', bulletItems: ['SGS (Commodity Surveyor)', 'Allen & Overy (Legal Counsel)'], nodeId: 'PC.I.5' },
          { key: 'rasp_reference', label: 'RASP Reference', type: 'text', value: 'RASP-2026-TF-018', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.I.5' },
          { key: 'esg_data_used', label: 'ESG/Sustainable Data Used?', type: 'yesno', value: 'Yes', required: false, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.I.5' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section II: Operational & Technology
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.II', label: 'Operational & Technology', numbering: 'II', owner: 'TECH_OPS', icon: 'cpu',
    fields: [],
    subSections: [
      {
        id: 'PC.II.1', numbering: '1', label: 'Operational Information',
        guidance: 'Operating model, booking process, adequacy, controls, limits, manual fallback, collateral, custody.',
        fields: [
          { key: 'front_office_model', label: 'Front Office Operating Model', type: 'textarea', value: 'IBG Trade Finance desk originates and manages the facility. RMs handle client relationships.', required: true, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.II.1.a' },
          { key: 'middle_office_model', label: 'Middle Office Operating Model', type: 'textarea', value: 'Trade Finance Middle Office performs daily limit monitoring, collateral valuation oversight, and regulatory reporting coordination.', required: false, strategy: 'COPY', lineage: 'ADAPTED', confidence: 0.78, nodeId: 'PC.II.1.a' },
          { key: 'back_office_model', label: 'Back Office Operating Model', type: 'textarea', value: 'Trade Finance Operations processes settlements, margin calls, and collateral monitoring via TFP system.', required: true, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.II.1.a' },
          { key: 'third_party_ops', label: 'Third-Party Operations', type: 'textarea', value: 'SGS provides independent commodity surveying and warehouse monitoring. API integration for real-time stock data.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.II.1.a' },
          { key: 'collateral_mgmt_ops', label: 'Collateral Management Operations', type: 'textarea', value: 'Dedicated collateral management team monitors warehouse receipts. Monthly physical inspections by SGS. Daily mark-to-market via Bloomberg commodity feeds.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.II.1.a' },
          { key: 'booking_legal_form', label: 'Booking Legal Form', type: 'text', value: 'Bilateral Credit Agreement', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.1.b' },
          { key: 'booking_family', label: 'Booking Family', type: 'text', value: 'Trade Finance — Structured', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.1.b' },
          { key: 'confirmation_process', label: 'Confirmation Process', type: 'textarea', value: 'SWIFT MT700 for LC issuance. MT799 for amendments. Automated confirmation via TFP.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.II.1.b' },
          { key: 'settlement_flow', label: 'Settlement Flow', type: 'textarea', value: 'SWIFT MT700/MT199 for LC issuance. FX settlement via CLS for eligible currencies.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.II.1.b' },
          { key: 'reconciliation', label: 'Reconciliation Process', type: 'textarea', value: 'T+1 automated reconciliation between TFP and core banking. Exception-based escalation to ops team.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.II.1.b' },
          { key: 'stp_rate', label: 'Expected STP Rate', type: 'text', value: '65%', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.70, nodeId: 'PC.II.1.b' },
          { key: 'ops_adequacy_checklist', label: 'Operational Adequacy Checklist', type: 'textarea', value: 'Staffing: 2 additional ops staff needed for Q2. Process docs: 80% complete. System readiness: Partial (Q3 enhancement pending).', required: true, strategy: 'LLM', lineage: 'ADAPTED', confidence: 0.75, nodeId: 'PC.II.1.c', commentCount: 1 },
          { key: 'operating_account_controls', label: 'Operating Account Controls', type: 'textarea', value: 'GL alignment completed. Deposit accounts mapped to trade finance cost centers. Daily reconciliation controls in place.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.II.1.d' },
          { key: 'limit_structure', label: 'Limit Structure & Monitoring', type: 'textarea', value: 'Single counterparty limit USD 125M. Sector limit for commodity finance: 78% utilized.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.II.1.e' },
          { key: 'limit_monitoring', label: 'Limit Monitoring Process', type: 'textarea', value: 'Real-time limit monitoring via credit risk system. Breach alerts to RM and Credit Risk within 30 minutes.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.84, nodeId: 'PC.II.1.e' },
          { key: 'manual_fallback', label: 'Manual Process Fallback?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.II.1.f' },
          { key: 'manual_fallback_details', label: 'Manual Fallback Details', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['Indonesian collateral registration (manual until Q3 2026)', 'Commodity valuation mark-to-market (daily manual upload)', 'Cross-border settlement reconciliation'], nodeId: 'PC.II.1.f', commentCount: 1 },
          { key: 'collateral_eligibility', label: 'Eligible Collateral', type: 'textarea', value: 'Warehouse receipts for palm oil (CPO) and rubber stocks. Must be insured and independently valued.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.84, nodeId: 'PC.II.1.g' },
          { key: 'collateral_haircuts', label: 'Collateral Haircuts', type: 'text', value: 'CPO: 15%, Rubber: 20%', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.1.g' },
          { key: 'margin_frequency', label: 'Margining Frequency', type: 'dropdown', value: 'Monthly', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly'], nodeId: 'PC.II.1.g' },
          { key: 'collateral_disputes', label: 'Collateral Dispute Resolution', type: 'textarea', value: 'Independent valuation by SGS as final arbiter. Escalation to Head of Collateral Management for disputes > USD 1M.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.76, nodeId: 'PC.II.1.g' },
          { key: 'custody_required', label: 'Custody Account Required?', type: 'yesno', value: 'No', required: false, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: false, nodeId: 'PC.II.1.h' },
          { key: 'trade_repository_reporting', label: 'Trade Repository Reporting', type: 'textarea', value: 'Not applicable for bilateral credit facility. OJK foreign lending report filed monthly.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.II.1.i' },
          { key: 'sfemc_references', label: 'SFEMC / Code of Conduct', type: 'textarea', value: 'Compliant with SFEMC Guidelines on FX Conduct. Global FX Code adherence confirmed.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.II.1.j' },
        ]
      },
      {
        id: 'PC.II.2', numbering: '2', label: 'Technical Platform',
        guidance: 'System requirements, front office systems, back end systems, and manual workarounds.',
        fields: [
          { key: 'new_system_changes', label: 'New System Changes Required?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.II.2.a' },
          { key: 'booking_system', label: 'Booking System', type: 'dropdown', value: 'Murex', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['Murex', 'Calypso', 'Summit', 'Opics', 'Kondor+', 'SAP', 'Other'], nodeId: 'PC.II.2.a' },
          { key: 'tech_requirements', label: 'Technology Requirements', type: 'textarea', value: 'Configuration of commodity pledge module in Trade Finance Platform. Integration with SGS API for real-time collateral valuation.', required: false, strategy: 'LLM', lineage: 'ADAPTED', confidence: 0.78, nodeId: 'PC.II.2.a' },
          { key: 'trade_capture_system', label: 'Trade Capture System', type: 'text', value: 'TFP (Trade Finance Platform) v4.2', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.2.a' },
          { key: 'risk_system', label: 'Risk Management System', type: 'text', value: 'Murex MX.3 (Market Risk) + Moody\'s Analytics (Credit Risk)', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.2.a' },
          { key: 'reporting_system', label: 'Reporting System', type: 'text', value: 'Enterprise Data Warehouse + Tableau dashboards', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.2.a' },
          { key: 'valuation_model', label: 'Valuation Model', type: 'textarea', value: 'Bloomberg commodity pricing feeds for CPO and rubber. Mark-to-market daily with T+1 reporting.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.II.2.b' },
          { key: 'fo_system_changes', label: 'Front Office System Changes', type: 'textarea', value: 'New commodity pledge screen in TFP. Collateral input workflow enhancement.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.75, nodeId: 'PC.II.2.b' },
          { key: 'settlement_method', label: 'Settlement Method', type: 'dropdown', value: 'SWIFT', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['SWIFT', 'MEPS+', 'CLS', 'DvP', 'FoP', 'Manual'], nodeId: 'PC.II.2.c' },
          { key: 'be_system_changes', label: 'Back-End System Changes', type: 'textarea', value: 'Collateral module enhancement in Ops system. Automated margin call generation.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.74, nodeId: 'PC.II.2.c' },
          { key: 'manual_workarounds', label: 'Manual Workarounds', type: 'textarea', value: 'Indonesian collateral registration requires manual data entry until system enhancement in Q3 2026.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.72, nodeId: 'PC.II.2.c' },
        ]
      },
      {
        id: 'PC.II.3', numbering: '3', label: 'Information Security',
        guidance: 'System enhancements, ISS policy deviations, penetration testing, and security assessment.',
        fields: [
          { key: 'system_enhancements', label: 'System Enhancements Involved?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.II.3' },
          { key: 'iss_deviations', label: 'ISS Policy Deviations', type: 'textarea', value: 'None. All system changes comply with ISS v3.1 security policies.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.II.3' },
          { key: 'pentest_status', label: 'Penetration Test Status', type: 'dropdown', value: 'Planned', required: false, strategy: 'MANUAL', lineage: 'MANUAL', options: ['Not Required', 'Planned', 'In Progress', 'Completed - Pass', 'Completed - Remediation Required'], nodeId: 'PC.II.3' },
          { key: 'security_assessment', label: 'Security Assessment', type: 'textarea', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', placeholder: 'Describe security assessment findings...', nodeId: 'PC.II.3' },
        ]
      },
      {
        id: 'PC.II.4', numbering: '4', label: 'Technology Resiliency',
        guidance: 'External party risk management, RTO/RPO targets, and DR testing plan.',
        fields: [
          { key: 'grc_id', label: 'GRC Reference ID', type: 'text', value: 'GRC-2026-TF-042', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.4' },
          { key: 'hsm_required', label: 'HSM Required?', type: 'yesno', value: 'No', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: false, nodeId: 'PC.II.4' },
          { key: 'rto_target', label: 'Recovery Time Objective (RTO)', type: 'text', value: '4 hours', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.4' },
          { key: 'rpo_target', label: 'Recovery Point Objective (RPO)', type: 'text', value: '1 hour', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.II.4' },
          { key: 'dr_testing_plan', label: 'DR Testing Plan', type: 'textarea', value: 'Semi-annual DR tests with full failover simulation. Last test: Q4 2025 — Pass.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.II.4' },
        ]
      },
      {
        id: 'PC.II.5', numbering: '5', label: 'Business Continuity Management',
        guidance: 'BIA considerations, BCP requirements, and continuity measures.',
        fields: [
          { key: 'bia_considerations', label: 'BIA Considerations', type: 'textarea', value: 'Critical process: collateral monitoring and margin calls. RPO: 1 hour for trade capture.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.II.5' },
          { key: 'bcp_requirements', label: 'BCP Requirements', type: 'textarea', value: 'Alternate site capability at Changi Business Park. Remote access for key personnel.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.II.5' },
          { key: 'bcm_critical_processes', label: 'Critical Business Processes', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['Collateral monitoring', 'Margin call processing', 'Trade settlement', 'Regulatory reporting'], nodeId: 'PC.II.5' },
          { key: 'bcm_recovery_strategy', label: 'Recovery Strategy', type: 'textarea', value: 'Hot standby for trade capture. Warm standby for reporting. Cold standby for non-critical batch processes.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.II.5' },
          { key: 'bcm_testing_frequency', label: 'BCM Testing Frequency', type: 'dropdown', value: 'Semi-Annual', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'], nodeId: 'PC.II.5' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section III: Pricing Model Details
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.III', label: 'Pricing Model Details', numbering: 'III', owner: 'FINANCE', icon: 'bar-chart-3',
    fields: [],
    subSections: [
      {
        id: 'PC.III.1', numbering: '1', label: 'Pricing Model Validation / Assurance',
        guidance: 'Pricing model validation requirement, methodology, ROAE analysis, and adjustments.',
        fields: [
          { key: 'pricing_model_required', label: 'Pricing Model Validation Required?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, nodeId: 'PC.III.1' },
          { key: 'pricing_methodology', label: 'Pricing Methodology', type: 'textarea', value: 'Cost-plus pricing with SOFR base rate + spread of 185bps. Risk-adjusted for commodity price volatility premium.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.III.1' },
          { key: 'roae_analysis', label: 'ROAE Analysis', type: 'textarea', value: 'Projected ROAE of 14.2% exceeds hurdle rate of 12%. Sensitivity: -1.5% per 50bps spread compression.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.83, nodeId: 'PC.III.1' },
          { key: 'pricing_assumptions', label: 'Pricing Assumptions', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['SOFR at 4.85% (forward curve as of Feb 2026)', 'Expected utilization rate: 75%', 'Expected loss rate: 0.15%', 'FTP rate: 4.20%'], nodeId: 'PC.III.1' },
          { key: 'bespoke_adjustments', label: 'Bespoke Pricing Adjustments', type: 'textarea', value: 'Commodity volatility premium of 15bps added to standard TF pricing. Cross-border premium of 10bps for Indonesian collateral.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.III.1' },
          { key: 'fva_adjustment', label: 'FVA Adjustment', type: 'text', value: 'N/A — Banking book', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.1' },
          { key: 'xva_treatment', label: 'XVA Treatment', type: 'text', value: 'CVA/DVA not applicable for bilateral credit facility', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.1' },
          { key: 'day_count_convention', label: 'Day Count Convention', type: 'text', value: 'ACT/360', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.1' },
        ]
      },
      {
        id: 'PC.III.2', numbering: '2', label: 'Model Name and Validation',
        guidance: 'Model name, validation date, restrictions, and risk data assessment reference.',
        fields: [
          { key: 'pricing_model_name', label: 'Pricing Model Name', type: 'text', value: 'TF-COMMOD-STR-v2.3', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.2' },
          { key: 'model_validation_date', label: 'Model Validation Date', type: 'date', value: '2025-11-15', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.2' },
          { key: 'model_restrictions', label: 'Model Restrictions', type: 'textarea', value: 'Not validated for tenors > 5 years. Commodity types limited to agricultural products.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.III.2' },
          { key: 'risk_data_assessment_ref', label: 'Risk Data Assessment Reference', type: 'text', value: 'RDA-2025-TF-089', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.2' },
        ]
      },
      {
        id: 'PC.III.3', numbering: '3', label: 'SIMM Treatment',
        guidance: 'SIMM sensitivities, margin treatment, and backtesting.',
        fields: [
          { key: 'simm_treatment', label: 'SIMM Treatment', type: 'textarea', value: 'Not applicable — bilateral credit facility, not centrally cleared derivative.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.92, nodeId: 'PC.III.3' },
          { key: 'simm_sensitivities', label: 'SIMM Sensitivities', type: 'text', value: 'N/A', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.3' },
          { key: 'simm_backtesting', label: 'SIMM Backtesting', type: 'text', value: 'N/A', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.III.3' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section IV: Risk Analysis
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.IV', label: 'Risk Analysis', numbering: 'IV', owner: 'RMG', icon: 'shield-alert',
    fields: [],
    subSections: [
      {
        id: 'PC.IV.A', numbering: 'A', label: 'Operational Risk',
        guidance: 'Legal & compliance, finance & tax, financial crimes, and funding liquidity risk.',
        fields: [
          { key: 'legal_opinion', label: 'Legal Opinion', type: 'textarea', value: 'English law governing agreement with Indonesian pledge perfection under local law. Separate opinion required for OJK regulatory matters.', required: true, strategy: 'COPY', lineage: 'AUTO', confidence: 0.84, nodeId: 'PC.IV.A.1' },
          { key: 'licensing_requirements', label: 'Licensing Requirements', type: 'textarea', value: 'MBS holds all required MAS licenses. OJK foreign lending license obtained for Indonesia operations.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.87, nodeId: 'PC.IV.A.1' },
          { key: 'primary_regulation', label: 'Primary Regulation', type: 'text', value: 'MAS Notice 757 (Capital Adequacy)', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.IV.A.1' },
          { key: 'secondary_regulations', label: 'Secondary Regulations', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['OJK Regulation on Foreign Lending', 'FATCA/CRS Reporting', 'MAS AML/CFT Notice 626'], nodeId: 'PC.IV.A.1' },
          { key: 'regulatory_reporting', label: 'Regulatory Reporting Obligations', type: 'textarea', value: 'MAS 610 quarterly, FATCA/CRS annual, OJK monthly foreign lending report, Bank Indonesia capital flows report.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.84, nodeId: 'PC.IV.A.1' },
          { key: 'cross_border_regulations', label: 'Cross-Border Regulations', type: 'textarea', value: 'Singapore-Indonesia bilateral framework applies. Capital controls in Indonesia require central bank approval for foreign currency lending > USD 50M.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.IV.A.1' },
          { key: 'legal_docs_required', label: 'Legal Documentation Required', type: 'bullet_list', value: '', required: false, strategy: 'COPY', lineage: 'AUTO', bulletItems: ['Credit Agreement (English law)', 'Indonesian Pledge Agreement (local law)', 'Corporate Guarantee', 'Collateral Trust Deed', 'SGS Monitoring Agreement'], nodeId: 'PC.IV.A.1' },
          { key: 'sanctions_check', label: 'Sanctions Check Clear?', type: 'yesno', value: 'Yes', required: true, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.A.1' },
          { key: 'aml_considerations', label: 'AML Considerations', type: 'textarea', value: 'Standard CDD applied. Enhanced due diligence triggered by commodity sector and cross-border elements.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.86, nodeId: 'PC.IV.A.1' },
          { key: 'tax_impact', label: 'Tax Impact', type: 'textarea', value: 'Singapore-Indonesia DTA applicable. WHT of 10% on interest payments (reduced from 20% under DTA).', required: true, strategy: 'COPY', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.IV.A.2' },
          { key: 'accounting_book', label: 'Trading Book vs Banking Book', type: 'dropdown', value: 'Banking Book', required: true, strategy: 'RULE', lineage: 'AUTO', options: ['Trading Book', 'Banking Book'], nodeId: 'PC.IV.A.2' },
          { key: 'fair_value_treatment', label: 'Fair Value Treatment', type: 'text', value: 'Amortized cost (IFRS 9 — hold to collect)', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.86, nodeId: 'PC.IV.A.2' },
          { key: 'on_off_balance', label: 'On/Off Balance Sheet', type: 'dropdown', value: 'On Balance Sheet', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['On Balance Sheet', 'Off Balance Sheet', 'Both'], nodeId: 'PC.IV.A.2' },
          { key: 'tax_jurisdictions', label: 'Tax Jurisdictions', type: 'multiselect', value: 'Singapore,Indonesia', required: false, strategy: 'RULE', lineage: 'AUTO', options: ['Singapore', 'Indonesia', 'Malaysia', 'Hong Kong', 'UK', 'US'], nodeId: 'PC.IV.A.2' },
          { key: 'fc_conduct_considerations', label: 'Financial Crimes Conduct Considerations', type: 'textarea', value: 'No MAR concerns — facility is bilateral and non-tradeable. Standard sanctions screening applied.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.90, nodeId: 'PC.IV.A.3' },
          { key: 'fc_mar_assessment', label: 'MAR Assessment', type: 'text', value: 'Not applicable — bilateral credit facility', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.IV.A.3' },
          { key: 'flr_lcr_nsfr_metrics', label: 'LCR/NSFR Metrics', type: 'textarea', value: 'LCR impact: minimal (< 0.5%). NSFR: 3-year tenor matched funding available from Treasury.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.IV.A.D' },
          { key: 'flr_hqla_qualification', label: 'HQLA Qualification', type: 'text', value: 'N/A — bilateral credit facility not HQLA eligible', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.IV.A.D' },
        ]
      },
      {
        id: 'PC.IV.B', numbering: 'B', label: 'Market & Liquidity',
        guidance: 'Market risk factors, risk factor matrix, funding/liquidity risk, and regulatory capital.',
        fields: [
          { key: 'market_risk', label: 'Market Risk Assessment', type: 'textarea', value: 'Primary exposures: commodity price risk (palm oil, rubber), FX risk (IDR/USD), and interest rate risk (SOFR). Natural hedge through export receivables partially offsets FX exposure.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.87, nodeId: 'PC.IV.B.1', commentCount: 1 },
          { key: 'risk_classification', label: 'Risk Classification', type: 'dropdown', value: 'Medium', required: false, strategy: 'LLM', lineage: 'AUTO', options: ['Low', 'Medium', 'High', 'Very High'], nodeId: 'PC.IV.B.1' },
          { key: 'mrf_commodity', label: 'Market Risk Factor: Commodity', type: 'yesno', value: 'Yes', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.B.1' },
          { key: 'mrf_fx_delta', label: 'Market Risk Factor: FX Delta', type: 'yesno', value: 'Yes', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.B.1' },
          { key: 'mrf_ir_delta', label: 'Market Risk Factor: IR Delta', type: 'yesno', value: 'Yes', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.B.1' },
          { key: 'mrf_ir_vega', label: 'Market Risk Factor: IR Vega', type: 'yesno', value: 'No', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: false, nodeId: 'PC.IV.B.1' },
          { key: 'mrf_eq_delta', label: 'Market Risk Factor: Equity Delta', type: 'yesno', value: 'No', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: false, nodeId: 'PC.IV.B.1' },
          { key: 'mrf_credit', label: 'Market Risk Factor: Credit', type: 'yesno', value: 'Yes', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.B.1' },
          { key: 'liquidity_risk', label: 'Funding/Liquidity Risk', type: 'textarea', value: 'Matched funding available from Treasury. FTP rate locked at 4.20% for 3-year tenor.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.84, nodeId: 'PC.IV.B.2' },
          { key: 'liquidity_cost', label: 'Corporate Risk Liquidity Cost', type: 'text', value: '4.20% (3Y FTP)', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.IV.B.2' },
          { key: 'contingent_cashflow', label: 'Contingent Cash Flow?', type: 'yesno', value: 'Yes', required: false, strategy: 'LLM', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.B.2' },
          { key: 'contingent_cashflow_desc', label: 'Contingent Cash Flow Description', type: 'textarea', value: 'Margin calls triggered by commodity price decline > 10%. Estimated contingent cash outflow: USD 12.5M (10% of notional).', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.IV.B.2' },
          { key: 'regulatory_capital', label: 'Regulatory Capital Requirements', type: 'textarea', value: '', required: false, strategy: 'LLM', lineage: 'MANUAL', placeholder: 'Describe capital requirements and model validation...', nodeId: 'PC.IV.B.3' },
          { key: 'trading_book_assignment', label: 'Trading Book Assignment', type: 'text', value: 'Banking Book — not applicable', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.IV.B.3' },
        ]
      },
      {
        id: 'PC.IV.C', numbering: 'C', label: 'Credit Risk',
        guidance: 'Potential risks, mitigation, exposure limits, collateral, capital calculation, and regulatory considerations.',
        fields: [
          { key: 'credit_risk', label: 'Credit Risk Assessment', type: 'textarea', value: 'Counterparty rated BBB+ internally. Strong operating cash flow with leverage ratio within tolerance. Corporate guarantee from parent entity provides additional credit support.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.87, nodeId: 'PC.IV.C.1' },
          { key: 'new_limit_types', label: 'New Credit Limit Types Required?', type: 'yesno', value: 'No', required: false, strategy: 'LLM', lineage: 'AUTO', yesNoValue: false, nodeId: 'PC.IV.C.1' },
          { key: 'credit_support_required', label: 'Credit Support Required?', type: 'yesno', value: 'Yes', required: false, strategy: 'LLM', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.IV.C.1' },
          { key: 'collateral_framework', label: 'Collateral Framework', type: 'textarea', value: 'Commodity pledge over warehouse stocks (CPO and rubber). Minimum collateral coverage ratio: 1.2x. Monthly valuation by SGS.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.IV.C.2' },
          { key: 'stress_test_results', label: 'Stress Test Results', type: 'textarea', value: 'Under severe stress scenario (30% commodity price decline + IDR depreciation), facility remains within risk appetite with coverage ratio at 1.05x.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.IV.C.2' },
          { key: 'wrong_way_risk', label: 'Wrong-Way Risk', type: 'textarea', value: 'Limited wrong-way risk. Collateral (commodity stocks) value moves inversely to commodity price, providing natural offset.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.76, nodeId: 'PC.IV.C.2' },
          { key: 'netting_agreements', label: 'Netting Agreements', type: 'text', value: 'Bilateral netting under credit agreement', required: false, strategy: 'COPY', lineage: 'AUTO', nodeId: 'PC.IV.C.2' },
          { key: 'exposure_limits', label: 'Limits to Cover Exposure', type: 'textarea', value: 'Single counterparty limit: USD 125M. Sector limit utilization: 78%. Available capacity: USD 35M.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.83, nodeId: 'PC.IV.C.3' },
          { key: 'counterparty_rating', label: 'Counterparty Rating', type: 'text', value: 'BBB+ (Internal)', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.95, nodeId: 'PC.IV.C.5' },
          { key: 'large_exposure_rules', label: 'Large Exposure Rules', type: 'textarea', value: '', required: false, strategy: 'LLM', lineage: 'MANUAL', placeholder: 'Describe large exposure rules and concentration limits...', nodeId: 'PC.IV.C.6' },
        ]
      },
      {
        id: 'PC.IV.D', numbering: 'D', label: 'Reputational Risk',
        guidance: 'Reputational risk exposure, negative impact assessment, and ESG classification.',
        fields: [
          { key: 'reputational_risk', label: 'Reputational Risk Assessment', type: 'textarea', value: 'Palm oil sector carries ESG concerns. Mitigated by counterparty\'s RSPO certification and MBS sustainability framework compliance.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.83, nodeId: 'PC.IV.D' },
          { key: 'esg_assessment', label: 'ESG Assessment', type: 'textarea', value: 'RSPO-certified supply chain. No deforestation pledge. Carbon footprint monitoring in place.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.81, nodeId: 'PC.IV.D' },
          { key: 'esg_classification', label: 'ESG Classification', type: 'dropdown', value: 'Transition', required: false, strategy: 'LLM', lineage: 'AUTO', options: ['Green', 'Social', 'Sustainable', 'Transition', 'Not Applicable'], nodeId: 'PC.IV.D' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section V: Data Management
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.V', label: 'Data Management', numbering: 'V', owner: 'TECH_OPS', icon: 'database',
    fields: [],
    subSections: [
      {
        id: 'PC.V.1', numbering: '1', label: 'Design for Data (D4D)',
        guidance: 'Data governance, ownership, stewardship, quality monitoring, and GDPR compliance.',
        fields: [
          { key: 'data_governance', label: 'Data Governance Framework', type: 'textarea', value: 'Standard MBS data governance framework applies. Data steward: Head of Trade Finance Operations.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.V.1' },
          { key: 'data_ownership', label: 'Data Ownership', type: 'text', value: 'IBG Trade Finance', required: false, strategy: 'COPY', lineage: 'AUTO', nodeId: 'PC.V.1' },
          { key: 'data_quality', label: 'Data Quality Monitoring', type: 'textarea', value: 'Automated data quality checks at T+0. Exception reporting for data anomalies. Monthly data quality MI dashboard.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.V.1' },
          { key: 'data_privacy', label: 'Data Privacy Assessment', type: 'textarea', value: 'PDPA compliant. Cross-border data transfer under SCC framework for Indonesia/Singapore.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.V.1' },
          { key: 'gdpr_compliance', label: 'GDPR/Privacy Compliant?', type: 'yesno', value: 'Yes', required: false, strategy: 'COPY', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.V.1' },
        ]
      },
      {
        id: 'PC.V.2', numbering: '2', label: 'PURE Principles',
        guidance: 'PURE assessment: Purposeful, Unsurprising, Respectful, Explainable.',
        fields: [
          { key: 'pure_assessment_id', label: 'PURE Assessment ID', type: 'text', value: '', required: false, strategy: 'MANUAL', lineage: 'MANUAL', placeholder: 'e.g., PURE-2026-TF-042', nodeId: 'PC.V.2' },
          { key: 'pure_purposeful', label: 'Purposeful', type: 'textarea', value: 'Data collected solely for trade finance operations, collateral monitoring, and regulatory reporting.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.85, nodeId: 'PC.V.2' },
          { key: 'pure_unsurprising', label: 'Unsurprising', type: 'textarea', value: 'Data usage aligns with stated purposes in client documentation. No secondary use of transaction data.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.V.2' },
          { key: 'pure_respectful', label: 'Respectful', type: 'textarea', value: 'Minimal personal data. Counterparty corporate data only. No individual customer PII processed.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.88, nodeId: 'PC.V.2' },
          { key: 'pure_explainable', label: 'Explainable', type: 'textarea', value: 'All data processing steps documented in DPO register. Client-facing privacy notice updated to include commodity trade finance data processing.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.V.2' },
        ]
      },
      {
        id: 'PC.V.3', numbering: '3', label: 'Risk Data Aggregation & Reporting',
        fields: [
          { key: 'reporting_requirements', label: 'Regulatory Reporting Requirements', type: 'textarea', value: 'MAS 610 (quarterly), FATCA/CRS (annual), OJK foreign lending report (monthly).', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'PC.V.3' },
          { key: 'automated_reporting', label: 'Automated Reporting Available?', type: 'yesno', value: 'Yes', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: true, nodeId: 'PC.V.3' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section VI: Other Risk Identification
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.VI', label: 'Other Risk Identification', numbering: 'VI', owner: 'RMG', icon: 'alert-triangle',
    fields: [
      { key: 'other_risks_exist', label: 'Other Risks Identified?', type: 'yesno', value: 'Yes', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: true, guidance: 'Are there other risk identifications and mitigations not described in sections I-V?', nodeId: 'PC.VI' },
      { key: 'additional_risk_mitigants', label: 'Additional Risk Mitigants', type: 'textarea', value: 'Concentration risk in palm oil sector partially mitigated by diversification into rubber. Political risk insurance considered but deemed unnecessary given stable BBB sovereign rating.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'PC.VI' },
      { key: 'concentration_risk', label: 'Concentration Risk Assessment', type: 'textarea', value: 'Sector concentration: commodity trade finance represents 12% of IBG portfolio. Geographic concentration: Indonesia exposure at 8% of total trade finance book.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.78, nodeId: 'PC.VI' },
      { key: 'political_risk', label: 'Political/Country Risk', type: 'textarea', value: 'Indonesia sovereign rating stable at BBB (Fitch). No adverse political developments affecting commodity sector.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'PC.VI' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // PART C — Section VII: Additional Info for Trading Products
  // ═══════════════════════════════════════════════════════════
  {
    id: 'PC.VII', label: 'Additional Info — Trading Products', numbering: 'VII', owner: 'FINANCE', icon: 'trending-up',
    fields: [
      { key: 'trading_product', label: 'Is This a Trading Product?', type: 'yesno', value: 'No', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: false, guidance: 'If yes, complete Appendix 5 for additional risk assessment.', nodeId: 'PC.VII' },
      { key: 'appendix5_required', label: 'Appendix 5 Required?', type: 'yesno', value: 'No', required: false, strategy: 'RULE', lineage: 'AUTO', yesNoValue: false, nodeId: 'PC.VII' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 1: Entity/Location Information
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.1', label: 'Entity / Location', numbering: 'Appendix 1', owner: 'LCS', icon: 'building',
    fields: [
      { key: 'sales_entity', label: 'Sales / Origination Entity', type: 'text', value: 'MBS Bank Ltd, Singapore', required: true, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.1' },
      { key: 'booking_entity', label: 'Booking Entity', type: 'text', value: 'MBS Bank Ltd, Singapore (Head Office)', required: true, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.1' },
      { key: 'risk_taking_entity', label: 'Risk Taking Entity', type: 'text', value: 'MBS Bank Ltd, Singapore', required: true, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.1' },
      { key: 'processing_entity', label: 'Processing Entity', type: 'text', value: 'MBS Bank Ltd, Singapore — Trade Finance Operations', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.1' },
      { key: 'hedge_entity', label: 'Hedging Entity', type: 'text', value: 'MBS Bank Ltd, Singapore — Treasury', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.1' },
      { key: 'governing_law', label: 'Governing Law', type: 'dropdown', value: 'English Law', required: true, strategy: 'COPY', lineage: 'AUTO', options: ['English Law', 'Singapore Law', 'New York Law', 'Hong Kong Law', 'Local Law'], nodeId: 'APP.1' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 2: Intellectual Property
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.2', label: 'Intellectual Property', numbering: 'Appendix 2', owner: 'LCS', icon: 'key',
    fields: [
      { key: 'mbs_ip_exists', label: 'MBS-Owned IP Created?', type: 'yesno', value: 'No', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: false, guidance: 'Does this product create or use IP owned by MBS?', nodeId: 'APP.2' },
      { key: 'third_party_ip_exists', label: 'Third-Party IP Used?', type: 'yesno', value: 'No', required: true, strategy: 'MANUAL', lineage: 'MANUAL', yesNoValue: false, guidance: 'Does this product use any third-party intellectual property?', nodeId: 'APP.2' },
      { key: 'ip_licensing', label: 'IP Licensing Arrangements', type: 'textarea', value: 'N/A — no proprietary IP involved.', required: false, strategy: 'RULE', lineage: 'AUTO', nodeId: 'APP.2' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 3: Financial Crime Risk Areas
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.3', label: 'Financial Crime Risk', numbering: 'Appendix 3', owner: 'LCS', icon: 'shield',
    fields: [],
    subSections: [
      {
        id: 'APP.3.1', numbering: '1', label: 'Risk Assessment',
        guidance: 'Assess each financial crime risk area: AML, terrorism financing, sanctions, fraud, bribery.',
        fields: [
          { key: 'aml_assessment', label: 'AML Assessment', type: 'textarea', value: 'Standard AML procedures apply. Enhanced CDD for commodity trade flows. Transaction monitoring via automated system.', required: true, strategy: 'LLM', lineage: 'AUTO', confidence: 0.86, nodeId: 'APP.3.1' },
          { key: 'terrorism_financing', label: 'Terrorism Financing Assessment', type: 'textarea', value: 'Low risk. No nexus to terrorism financing based on counterparty profile, geographic scope, and product type.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.90, nodeId: 'APP.3.1' },
          { key: 'sanctions_assessment', label: 'Sanctions Assessment', type: 'textarea', value: 'No sanctions concerns. All parties screened against OFAC, EU, UN, and MAS lists. No PEP involvement.', required: true, strategy: 'RULE', lineage: 'AUTO', confidence: 1.0, nodeId: 'APP.3.1' },
          { key: 'fraud_risk', label: 'Fraud Risk', type: 'textarea', value: 'Warehouse receipt fraud risk mitigated by independent verification (SGS). Trade-based money laundering controls in place.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.82, nodeId: 'APP.3.1' },
          { key: 'bribery_corruption', label: 'Bribery & Corruption Risk', type: 'textarea', value: 'Standard anti-bribery controls. Indonesian operations subject to enhanced monitoring per corruption perception index.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'APP.3.1' },
          { key: 'fc_risk_rating', label: 'Financial Crime Risk Rating', type: 'dropdown', value: 'Medium', required: true, strategy: 'LLM', lineage: 'AUTO', options: ['Low', 'Medium', 'High', 'Very High'], nodeId: 'APP.3.1' },
        ]
      },
      {
        id: 'APP.3.2', numbering: '2', label: 'Policies & Controls',
        fields: [
          { key: 'fc_screening_controls', label: 'Screening Controls', type: 'textarea', value: 'Real-time sanctions screening on all transactions. Name screening against watchlists at onboarding and quarterly refresh.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.85, nodeId: 'APP.3.2' },
          { key: 'fc_transaction_monitoring', label: 'Transaction Monitoring', type: 'textarea', value: 'Automated transaction monitoring with commodity-specific scenarios. Manual review trigger at USD 500K per transaction.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.83, nodeId: 'APP.3.2' },
          { key: 'fc_suspicious_reporting', label: 'Suspicious Transaction Reporting', type: 'textarea', value: 'STR filed with STRO within 15 business days of suspicion. Dedicated compliance officer for commodity trade finance.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.86, nodeId: 'APP.3.2' },
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 4: Risk Data Aggregation & Reporting
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.4', label: 'Risk Data Aggregation', numbering: 'Appendix 4', owner: 'RMG', icon: 'layers',
    fields: [
      { key: 'rda_compliance', label: 'RDA Compliance', type: 'textarea', value: 'Compliant with BCBS 239. Risk data sourced from Murex booking system. Automated aggregation via enterprise data warehouse.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, guidance: 'Describe compliance with regulatory requirements for Risk Data Aggregation and Reporting.', nodeId: 'APP.4' },
      { key: 'rda_data_quality', label: 'Data Quality Assurance', type: 'textarea', value: 'Data reconciliation between source systems and risk reports. Exception-based monitoring with T+1 resolution SLA.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.80, nodeId: 'APP.4' },
      { key: 'rda_timeliness', label: 'Reporting Timeliness', type: 'textarea', value: 'Risk data available T+1 for daily risk reports. Regulatory submissions within prescribed deadlines.', required: false, strategy: 'COPY', lineage: 'AUTO', confidence: 0.82, nodeId: 'APP.4' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 5: Additional Info for Trading Products
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.5', label: 'Trading Products Info', numbering: 'Appendix 5', owner: 'FINANCE', icon: 'candlestick-chart',
    fields: [
      { key: 'app5_note', label: 'Applicability Note', type: 'text', value: 'Not applicable — this is a bilateral credit facility, not a trading product.', required: false, strategy: 'RULE', lineage: 'AUTO', guidance: 'Complete only if Section VII indicates this is a trading product.', nodeId: 'APP.5' },
    ],
    subSections: []
  },

  // ═══════════════════════════════════════════════════════════
  // APPENDIX 6: Third-Party Platform Risk Assessment
  // ═══════════════════════════════════════════════════════════
  {
    id: 'APP.6', label: 'Third-Party Platform Risk', numbering: 'Appendix 6', owner: 'TECH_OPS', icon: 'cloud',
    fields: [],
    subSections: [
      {
        id: 'APP.6.A', numbering: 'Part A', label: 'Use Case Description',
        guidance: 'Describe the third-party platform use case and business justification.',
        fields: [
          { key: 'tp_use_case_description', label: 'Use Case Description', type: 'textarea', value: 'SGS commodity surveying platform for real-time warehouse stock monitoring and automated valuation feeds.', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.A' },
          { key: 'tp_business_justification', label: 'Business Justification', type: 'textarea', value: 'Required for independent commodity collateral monitoring per MBS collateral policy.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.80, nodeId: 'APP.6.A' },
          { key: 'tp_vendor_name', label: 'Vendor Name', type: 'text', value: 'SGS SA', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.A' },
          { key: 'tp_contract_duration', label: 'Contract Duration', type: 'text', value: '3 years (aligned with facility tenor)', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.A' },
        ]
      },
      {
        id: 'APP.6.B', numbering: 'Part B', label: 'Preliminary Risk Assessment',
        guidance: 'Assess operational, regulatory, and reputational risks of the third-party platform.',
        fields: [
          { key: 'tp_risk_rating', label: 'Third-Party Risk Rating', type: 'dropdown', value: 'Low', required: false, strategy: 'LLM', lineage: 'AUTO', options: ['Low', 'Medium', 'High', 'Critical'], nodeId: 'APP.6.B' },
          { key: 'tp_risk_mitigants', label: 'Risk Mitigants', type: 'bullet_list', value: '', required: false, strategy: 'LLM', lineage: 'AUTO', bulletItems: ['SOC 2 Type II certification', 'Encrypted API integration', 'Contractual SLAs with penalty clauses'], nodeId: 'APP.6.B' },
          { key: 'tp_concentration_risk', label: 'Third-Party Concentration Risk', type: 'textarea', value: 'SGS is the sole commodity surveyor. Backup arrangement with Bureau Veritas identified for contingency.', required: false, strategy: 'LLM', lineage: 'AUTO', confidence: 0.76, nodeId: 'APP.6.B' },
          { key: 'tp_exit_strategy', label: 'Exit Strategy', type: 'textarea', value: '90-day notice period. Transition plan to alternative surveyor (Bureau Veritas) documented.', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.B' },
        ]
      },
      {
        id: 'APP.6.C', numbering: 'Part C', label: 'Security & Privacy',
        guidance: 'Information security assessment, cybersecurity, and data privacy.',
        fields: [
          { key: 'tp_encryption_standards', label: 'Encryption Standards', type: 'text', value: 'TLS 1.3, AES-256 at rest', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.C' },
          { key: 'tp_data_classification', label: 'Data Classification', type: 'dropdown', value: 'Confidential', required: false, strategy: 'MANUAL', lineage: 'MANUAL', options: ['Public', 'Internal', 'Confidential', 'Restricted'], nodeId: 'APP.6.C' },
          { key: 'tp_certifications', label: 'Security Certifications', type: 'text', value: 'SOC 2 Type II, ISO 27001', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.C' },
          { key: 'tp_data_residency', label: 'Data Residency', type: 'text', value: 'Singapore (AWS ap-southeast-1)', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.C' },
          { key: 'tp_penetration_testing', label: 'Penetration Testing', type: 'text', value: 'Annual — last completed Dec 2025, no critical findings', required: false, strategy: 'MANUAL', lineage: 'MANUAL', nodeId: 'APP.6.C' },
        ]
      }
    ]
  },
];
