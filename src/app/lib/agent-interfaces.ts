/**
 * Agent Interfaces — 18 Agents across 4 Tiers
 * Source of truth: ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md
 * + 5 Draft Builder Sign-Off Chat Agents (BIZ, TECH_OPS, FINANCE, RMG, LCS)
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

import AGENT_REGISTRY_JSON from '../../../shared/agent-registry.json';

export const AGENT_REGISTRY: AgentDefinition[] = (AGENT_REGISTRY_JSON as any[]).map((a) => ({
    id: String(a.id),
    name: String(a.name),
    tier: a.tier as 1 | 2 | 3 | 4,
    icon: String(a.icon),
    color: String(a.color),
    difyType: a.difyType as 'chat' | 'workflow',
    description: String(a.description || ''),
}));

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
    | 'ROUTE_DOMAIN'
    | 'DELEGATE_AGENT'
    | 'ASK_CLARIFICATION'
    | 'SHOW_CLASSIFICATION'
    | 'SHOW_RISK'
    | 'SHOW_PREDICTION'
    | 'SHOW_GOVERNANCE'
    | 'SHOW_DOC_STATUS'
    | 'SHOW_MONITORING'
    | 'SHOW_KB_RESULTS'
    | 'HARD_STOP'
    | 'STOP_PROCESS'
    | 'FINALIZE_DRAFT'
    | 'ROUTE_WORK_ITEM'
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
    /** Optional: human-readable summary bullets (grounded in the scorecard/prohibited screen). */
    analysisSummary?: string[];
    /** Optional: NTG trigger evaluation (for explainability). */
    ntgTriggers?: { id: string; name: string; fired: boolean; reason?: string }[];
    /** Optional: workflow execution identifiers (useful for debugging/audit). */
    workflowRunId?: string;
    taskId?: string;
    /** Optional: raw classifier output (useful when the workflow returned narrative text or for audit/debug). */
    rawOutput?: string;
    /** Optional: detailed step-by-step trace of the agent's execution. */
    traceSteps?: any[];
    /** Optional: raw parsed JSON object (for future detailed rendering). */
    rawJson?: any;
    prohibitedMatch?: {
        matched: boolean;
        item?: string;
        layer?: 'INTERNAL_POLICY' | 'REGULATORY' | 'SANCTIONS' | 'DYNAMIC';
    };
    mandatorySignOffs: string[];
}

// ─── Risk Agent (#7) — 5-Layer Cascade + 7-Domain Assessment ────

export interface RiskLayer {
    name: 'Internal Policy' | 'Regulatory' | 'Sanctions' | 'Dynamic' | 'Finance & Tax' | string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    details: string;
    checks: { name: string; status: 'PASS' | 'FAIL' | 'WARNING'; detail: string }[];
}

export interface RiskDomainAssessment {
    domain: 'CREDIT' | 'MARKET' | 'OPERATIONAL' | 'LIQUIDITY' | 'LEGAL' | 'REPUTATIONAL' | 'CYBER' | string;
    score: number;          // 0-100
    rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    keyFindings: string[];
    mitigants: string[];
}

export interface RiskAssessment {
    layers: RiskLayer[];
    domainAssessments: RiskDomainAssessment[];
    overallScore: number;
    overallRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
    hardStop: boolean;
    hardStopReason?: string;
    prerequisites: { name: string; status: 'PASS' | 'FAIL'; category: string }[];
    pirRequirements?: { required: boolean; type?: string; deadline_months?: number; conditions?: string[] };
    validityRisk?: { valid: boolean; expiry_date?: string; extension_eligible?: boolean; notes?: string };
    circuitBreaker?: { triggered: boolean; loop_back_count?: number; threshold?: number; escalation_target?: string };
    evergreenLimits?: { eligible: boolean; notional_remaining?: number; deal_count_remaining?: number; flags?: string[] };
    npaLiteRiskProfile?: { subtype?: string; eligible: boolean; conditions_met?: string[]; conditions_failed?: string[] };
    sopBottleneckRisk?: { bottleneck_parties?: string[]; estimated_days?: number; critical_path?: string };
    notionalFlags?: { finance_vp_required?: boolean; cfo_required?: boolean; roae_required?: boolean; threshold_breached?: string };
    mandatorySignoffs?: string[];
    recommendations?: string[];
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

export interface AgentMetadata {
    agent_action: AgentAction;
    agent_id: string;
    payload: any;
    trace: Record<string, any>;
}

export interface DifyChatResponse {
    answer: string;
    conversation_id: string;
    message_id: string;
    metadata: AgentMetadata;
}

export interface DifyWorkflowResponse {
    workflow_run_id: string;
    task_id: string;
    data: {
        outputs: Record<string, any>;
        status: 'succeeded' | 'failed' | 'running';
        error?: string;
    };
    metadata: AgentMetadata;
}

export interface DifyStreamChunk {
    event: 'message' | 'agent_message' | 'agent_thought' | 'message_end' | 'error';
    answer?: string;
    conversation_id?: string;
    message_id?: string;
    metadata?: Record<string, any>;
}

// ─── Workflow SSE Stream Events (for Live view) ─────────────────
export type WorkflowStreamEvent =
    | { type: 'workflow_started'; workflowRunId: string; taskId: string }
    | { type: 'node_started'; nodeId: string; nodeType: string; title: string }
    | { type: 'node_finished'; nodeId: string; nodeType: string; title: string; status: string; elapsedMs: number }
    | { type: 'text_chunk'; text: string }
    | { type: 'workflow_finished'; outputs: Record<string, any>; status: string }
    | { type: 'error'; code: string; message: string };
