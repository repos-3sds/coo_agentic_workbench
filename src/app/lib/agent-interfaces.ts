/**
 * Agent Interfaces — 13 Agents across 4 Tiers
 * Matches AGENT_ARCHITECTURE.md exactly
 */

// ─── Agent Registry ──────────────────────────────────────────────

export interface AgentDefinition {
    id: string;
    name: string;
    tier: 1 | 2 | 3 | 4;
    icon: string;
    color: string;
    difyType: 'chat' | 'workflow';
    description: string;
}

export const AGENT_REGISTRY: AgentDefinition[] = [
    // Tier 1 — Strategic Command
    { id: 'MASTER_COO', name: 'Master COO Orchestrator', tier: 1, icon: 'brain-circuit', color: 'bg-violet-50 text-violet-600', difyType: 'chat', description: 'Routes all user requests to appropriate domain orchestrators' },

    // Tier 2 — Domain Orchestration
    { id: 'NPA_ORCHESTRATOR', name: 'NPA Domain Orchestrator', tier: 2, icon: 'target', color: 'bg-orange-50 text-orange-600', difyType: 'chat', description: 'Decomposes NPA tasks into ordered sub-agent calls' },

    // Tier 3 — Specialist Workers
    { id: 'IDEATION', name: 'Ideation Agent', tier: 3, icon: 'lightbulb', color: 'bg-indigo-50 text-indigo-600', difyType: 'chat', description: 'Product concept development and NPA creation' },
    { id: 'CLASSIFIER', name: 'Classification Agent', tier: 3, icon: 'git-branch', color: 'bg-purple-50 text-purple-600', difyType: 'workflow', description: 'NTG/Variation/Existing classification and approval track assignment' },
    { id: 'AUTOFILL', name: 'Template AutoFill Agent', tier: 3, icon: 'file-edit', color: 'bg-blue-50 text-blue-600', difyType: 'workflow', description: '47-field NPA template auto-fill with RAG' },
    { id: 'ML_PREDICT', name: 'ML Prediction Agent', tier: 3, icon: 'trending-up', color: 'bg-amber-50 text-amber-600', difyType: 'workflow', description: 'Approval likelihood, timeline, and bottleneck prediction' },
    { id: 'RISK', name: 'Risk Agent', tier: 3, icon: 'shield-alert', color: 'bg-red-50 text-red-600', difyType: 'workflow', description: '4-layer risk cascade: Internal → Regulatory → Sanctions → Dynamic' },
    { id: 'GOVERNANCE', name: 'Governance Agent', tier: 3, icon: 'workflow', color: 'bg-slate-50 text-slate-600', difyType: 'workflow', description: 'Sign-off routing, SLA monitoring, loop-back, circuit breaker' },
    { id: 'DILIGENCE', name: 'Conversational Diligence', tier: 3, icon: 'message-square', color: 'bg-cyan-50 text-cyan-600', difyType: 'workflow', description: 'Q&A with KB citations and regulatory context' },
    { id: 'DOC_LIFECYCLE', name: 'Document Lifecycle', tier: 3, icon: 'scan-search', color: 'bg-teal-50 text-teal-600', difyType: 'workflow', description: 'Document validation, completeness, expiry tracking' },
    { id: 'MONITORING', name: 'Post-Launch Monitoring', tier: 3, icon: 'activity', color: 'bg-emerald-50 text-emerald-600', difyType: 'workflow', description: 'Performance metrics, breach detection, PIR scheduling' },

    // Tier 4 — Shared Utilities
    { id: 'KB_SEARCH', name: 'KB Search Agent', tier: 4, icon: 'search', color: 'bg-fuchsia-50 text-fuchsia-600', difyType: 'workflow', description: 'Semantic/hybrid search over knowledge base' },
    { id: 'NOTIFICATION', name: 'Notification Agent', tier: 4, icon: 'bell', color: 'bg-pink-50 text-pink-600', difyType: 'workflow', description: 'Alert aggregation, deduplication, and multi-channel delivery' },
];

// ─── Agent Activity ──────────────────────────────────────────────

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentActivityUpdate {
    agentId: string;
    status: AgentStatus;
    message?: string;
    timestamp?: Date;
}

// ─── Agent Actions (from Dify metadata) ──────────────────────────

export type AgentAction =
    | 'SHOW_CLASSIFICATION'
    | 'SHOW_RISK'
    | 'SHOW_PREDICTION'
    | 'HARD_STOP'
    | 'SHOW_AUTOFILL'
    | 'SHOW_GOVERNANCE'
    | 'SHOW_MONITORING'
    | 'SHOW_KB_RESULTS'
    | 'SHOW_DOC_STATUS'
    | 'ASK_CLARIFICATION'
    | 'ROUTE_WORK_ITEM'
    | 'ROUTE_DOMAIN'
    | 'STOP_PROCESS'
    | 'FINALIZE_DRAFT'
    | 'SHOW_RAW_RESPONSE'
    | 'SHOW_ERROR';

// ─── Classification Agent (#4) ──────────────────────────────────

export interface ClassificationScore {
    criterion: string;
    score: number;
    maxScore: number;
    reasoning: string;
}

export interface ClassificationResult {
    type: 'NTG' | 'Variation' | 'Existing';
    track: 'Full NPA' | 'NPA Lite' | 'Bundling' | 'Evergreen' | 'Prohibited';
    scores: ClassificationScore[];
    overallConfidence: number;
    prohibitedMatch?: {
        matched: boolean;
        item?: string;
        layer?: 'INTERNAL_POLICY' | 'REGULATORY' | 'SANCTIONS' | 'DYNAMIC';
    };
    mandatorySignOffs: string[];
}

// ─── Risk Agent (#7) ────────────────────────────────────────────

export interface RiskLayer {
    name: 'Internal Policy' | 'Regulatory' | 'Sanctions' | 'Dynamic';
    status: 'PASS' | 'FAIL' | 'WARNING';
    details: string;
    checks: { name: string; status: 'PASS' | 'FAIL' | 'WARNING'; detail: string }[];
}

export interface RiskAssessment {
    layers: RiskLayer[];
    overallScore: number;
    hardStop: boolean;
    hardStopReason?: string;
    prerequisites: { name: string; status: 'PASS' | 'FAIL'; category: string }[];
}

// ─── ML Prediction Agent (#6) ───────────────────────────────────

export interface PredictionFeature {
    name: string;
    importance: number;
    value: string;
}

export interface MLPrediction {
    approvalLikelihood: number;
    timelineDays: number;
    bottleneckDept: string;
    riskScore: number;
    features: PredictionFeature[];
    comparisonInsights: string[];
}

// ─── Governance Agent (#8) ──────────────────────────────────────

export interface SignoffItem {
    department: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REWORK';
    assignee?: string;
    slaDeadline?: string;
    slaBreached?: boolean;
    decidedAt?: string;
}

export interface GovernanceState {
    signoffs: SignoffItem[];
    slaStatus: 'on_track' | 'at_risk' | 'breached';
    loopBackCount: number;
    circuitBreaker: boolean;
    circuitBreakerThreshold: number;
    escalation?: { level: number; escalatedTo: string; reason: string };
}

// ─── AutoFill Agent (#5) ────────────────────────────────────────

export interface AutoFillField {
    fieldName: string;
    value: string;
    lineage: 'AUTO' | 'ADAPTED' | 'MANUAL';
    source?: string;
    confidence?: number;
}

export interface AutoFillSummary {
    fieldsFilled: number;
    fieldsAdapted: number;
    fieldsManual: number;
    totalFields: number;
    coveragePct: number;
    timeSavedMinutes: number;
    fields: AutoFillField[];
}

// ─── Monitoring Agent (#11) ─────────────────────────────────────

export interface MonitoringMetric {
    name: string;
    value: number;
    unit: string;
    threshold?: number;
    trend: 'up' | 'down' | 'stable';
}

export interface MonitoringBreach {
    metric: string;
    threshold: number;
    actual: number;
    severity: 'CRITICAL' | 'WARNING';
    message: string;
    firstDetected: string;
    trend: 'worsening' | 'stable' | 'improving';
}

export interface MonitoringResult {
    productHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    metrics: MonitoringMetric[];
    breaches: MonitoringBreach[];
    conditions: { type: string; description: string; deadline: string; status: string; daysRemaining: number }[];
    pirStatus: string;
    pirDueDate?: string;
}

// ─── KB Search Agent (#12) ──────────────────────────────────────

export interface KBSearchResult {
    docId: string;
    title: string;
    snippet: string;
    similarity: number;
    source: string;
    docType?: string;
}

// ─── Document Lifecycle Agent (#10) ─────────────────────────────

export interface DocCompletenessResult {
    completenessPercent: number;
    totalRequired: number;
    totalPresent: number;
    totalValid: number;
    missingDocs: { docType: string; reason: string; priority: 'BLOCKING' | 'WARNING' }[];
    invalidDocs: { docType: string; reason: string; action: string }[];
    conditionalRules: { condition: string; requiredDoc: string; status: string }[];
    expiringDocs: { docType: string; expiryDate: string; daysRemaining: number; alertLevel: string }[];
    stageGateStatus: 'CLEAR' | 'WARNING' | 'BLOCKED';
}

// ─── Diligence Agent (#9) ───────────────────────────────────────

export interface DiligenceResponse {
    answer: string;
    citations: { source: string; snippet: string; relevance: number }[];
    relatedQuestions: string[];
    reasoningChain?: string;
}

// ─── Notification Agent (#13) ───────────────────────────────────

export interface NotificationResult {
    sentCount: number;
    channels: string[];
    deduplicated: number;
    notifications: { id: string; type: string; severity: string; message: string; recipients: string[] }[];
}

// ─── Dify Response Types ─────────────────────────────────────────

export interface DifyChatResponse {
    answer: string;
    conversation_id: string;
    message_id: string;
    metadata?: {
        agent_action?: AgentAction;
        payload?: any;
        agent_id?: string;
    };
}

export interface DifyWorkflowResponse {
    workflow_run_id: string;
    task_id: string;
    data: {
        outputs: Record<string, any>;
        status: 'succeeded' | 'failed' | 'running';
        error?: string;
    };
}

export interface DifyStreamChunk {
    event: 'message' | 'agent_message' | 'agent_thought' | 'message_end' | 'error';
    answer?: string;
    conversation_id?: string;
    message_id?: string;
    metadata?: Record<string, any>;
}
