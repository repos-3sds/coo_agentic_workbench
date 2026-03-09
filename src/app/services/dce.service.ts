import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';

// ─── TypeScript Interfaces (mirror MCP tool responses) ──────────────────────

export interface DceCaseState {
    case_id: string;
    status: 'ACTIVE' | 'HITL_PENDING' | 'ESCALATED' | 'DONE' | 'DEAD';
    current_node: string;
    completed_nodes: string[];
    failed_nodes: any[];
    retry_counts: Record<string, number>;
    case_type: string;
    priority: 'URGENT' | 'STANDARD' | 'DEFERRED';
    rm_id: string;
    client_name: string;
    jurisdiction: 'SGP' | 'HKG' | 'CHN' | 'OTHER';
    sla_deadline: string;
    created_at: string;
    updated_at: string;
    hitl_queue: any;
    event_count: number;
}

export interface DceClassification {
    classification_id: number;
    case_id: string;
    submission_id: number;
    account_type: string;
    account_type_confidence: number;
    account_type_reasoning: string;
    client_name: string;
    client_entity_type: string;
    jurisdiction: string;
    products_requested: string[];
    priority: string;
    priority_reason: string;
    sla_deadline: string;
    classifier_model: string;
    classified_at: string;
    flagged_for_review: boolean;
}

export interface DceCheckpoint {
    checkpoint_id: number;
    case_id: string;
    node_id: string;
    attempt_number: number;
    status: string;
    input_snapshot: any;
    output_json: any;
    started_at: string;
    completed_at: string;
    duration_seconds: number;
    next_node: string;
    failure_reason: string;
    agent_model: string;
    token_usage: any;
}

export interface DceRmHierarchy {
    assignment_id: number;
    case_id: string;
    rm_id: string;
    rm_name: string;
    rm_email: string;
    rm_branch: string;
    rm_desk: string;
    rm_manager_id: string;
    rm_manager_name: string;
    rm_manager_email: string;
}

export interface DceStagedDocument {
    doc_id: string;
    case_id: string;
    submission_id: number;
    filename: string;
    mime_type: string;
    file_size_bytes: number;
    storage_url: string;
    source: string;
    upload_status: string;
    created_at: string;
}

export interface DceChecklistItem {
    item_id: number;
    checklist_id: number;
    case_id: string;
    doc_type_code: string;
    doc_type_name: string;
    requirement: 'MANDATORY' | 'OPTIONAL';
    regulatory_ref: string;
    matched_doc_id: string | null;
    match_status: 'UNMATCHED' | 'MATCHED' | 'REJECTED' | 'RESUBMISSION_REQUIRED';
    match_confidence: number | null;
    notes: string;
}

export interface DceCompletenessAssessment {
    assessment_id: number;
    case_id: string;
    attempt_number: number;
    completeness_flag: boolean;
    total_mandatory: number;
    matched_mandatory: number;
    total_optional: number;
    matched_optional: number;
    coverage_pct: number;
    missing_mandatory: string[];
    next_node: string;
    decision_reasoning: string;
    sla_pct_consumed: number;
    rm_chase_message: string;
}

export interface DceEvent {
    event_id: number;
    case_id: string;
    event_type: string;
    from_state: string;
    to_state: string;
    event_payload: any;
    triggered_by: string;
    triggered_at: string;
}

export interface DceNotification {
    notification_id: number;
    case_id: string;
    node_id: string;
    notification_type: string;
    channel: string;
    recipient_id: string;
    recipient_email: string;
    subject: string;
    delivery_status: string;
    created_at: string;
}

export interface DceDashboardKpis {
    total_cases: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_jurisdiction: Record<string, number>;
    by_node: Record<string, number>;
    sla_breaches: number;
    avg_duration_seconds: number;
}

export interface DceCaseListResponse {
    cases: DceCaseState[];
    total: number;
    limit: number;
    offset: number;
}

export interface DceCaseDetailResponse {
    status: string;
    case_state: DceCaseState;
    classification: DceClassification | null;
    checkpoints: DceCheckpoint[];
    rm_hierarchy: DceRmHierarchy | null;
    completeness_assessment: DceCompletenessAssessment | null;
}

export interface DceCaseDocumentsResponse {
    status: string;
    staged_documents: DceStagedDocument[];
    ocr_results: any[];
    reviews: any[];
    checklist_items: DceChecklistItem[];
}

export interface DceCaseEventsResponse {
    status: string;
    events: DceEvent[];
    notifications: DceNotification[];
}

// ─── SA-3 Signature Verification (sa3_get_verification_status) ──────────────

export interface DceSignatory {
    signatory_id: string;
    signatory_name: string;
    role_in_mandate: string;
    authority_status: 'AUTHORISED' | 'UNAUTHORISED' | 'NOT_IN_MANDATE';
    confidence_score: number;        // 0-100
    confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
    outcome: 'APPROVED' | 'REJECTED' | 'CLARIFY' | null;
    specimen_id: string | null;
    flag_reason: string | null;
    reviewer: string | null;
    decided_at: string | null;
    notes: string | null;
}

export interface DceSignatureVerification {
    case_id: string;
    verification_status: 'ALL_APPROVED' | 'PARTIAL_APPROVED' | 'HAS_REJECTIONS' | 'CLARIFICATION_REQUIRED';
    total_signatories: number;
    approved_count: number;
    rejected_count: number;
    clarify_count: number;
    signatories: DceSignatory[];
    specimens_stored: string[];
    reviewed_by_officer_id: string | null;
    reviewed_at: string | null;
    next_node: string | null;
    verification_notes: string | null;
    task_id: string | null;             // FK: dce_ao_hitl_review_task.task_id
    deadline: string | null;             // FK: dce_ao_hitl_review_task.deadline
}

// ─── SA-4 KYC/CDD (sa4_get_kyc_brief) ──────────────────────────────────────

export interface DceKycScreeningResult {
    name_screened: string;
    role: string;
    sanctions_status: 'CLEAR' | 'HIT' | 'POTENTIAL_MATCH';
    pep_flags_count: number;
    adverse_media_count: number;
    detail: string | null;
}

export interface DceRmKycDecision {
    kyc_risk_rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNACCEPTABLE';
    cdd_clearance: 'CLEARED' | 'ENHANCED_DUE_DILIGENCE' | 'DECLINED';
    bcap_clearance: boolean;
    caa_approach: 'IRB' | 'SA';
    recommended_dce_limit_sgd: number;
    recommended_dce_pce_limit_sgd: number;
    osca_case_number: string;
    limit_exposure_indication: string;
    additional_conditions: string[] | null;
    rm_id: string;
    decided_at: string;
}

export interface DceKycBrief {
    case_id: string;
    brief_id: string;                   // DB: dce_ao_kyc_brief.brief_id (BRIEF-XXXXXX)
    entity_summary: string;
    ownership_chain: string;            // DB: dce_ao_kyc_brief.ownership_chain (JSON)
    acra_coi: string;
    directors: string;                  // DB: dce_ao_kyc_brief.directors (JSON)
    beneficial_owners: string;          // DB: dce_ao_kyc_brief.beneficial_owners (JSON)
    screening_summary: string;
    screening_results: DceKycScreeningResult[];
    source_of_wealth: string;
    risk_factors: string;
    is_retail_investor: string;         // DB: dce_ao_kyc_brief.is_retail_investor
    open_questions: string;
    suggested_risk_range: string;       // DB: dce_ao_kyc_brief.suggested_risk_range
    names_screened: number;             // DB: dce_ao_kyc_brief.names_screened_count
    sanctions_status: 'CLEAR' | 'POTENTIAL_MATCH' | 'HIT_CONFIRMED';
    pep_flags_count: number;            // DB: dce_ao_kyc_brief.pep_flag_count
    adverse_media_found: boolean;
    rm_decisions: DceRmKycDecision | null;
    next_node: string | null;
    brief_url: string | null;
    notes: string | null;
}

// ─── SA-5 Credit (sa5_get_credit_brief) ─────────────────────────────────────

export interface DceFinancialExtract {
    metric_name: string;
    value: string;
    period: string;
    source_doc: string;
    yoy_change_pct: number | null;
}

export interface DceCreditBrief {
    case_id: string;
    credit_brief_id: string;
    entity_summary: string;
    financial_analysis: string;
    product_risk_profile: string;
    rm_recommendations: string;
    comparable_benchmarks: string;
    open_questions: string;
    leverage_ratio: number;
    liquidity_ratio: number;
    revenue_trend_pct: number;
    financial_years_analysed: number;
    estimated_initial_limit_sgd: number;
}

export interface DceCreditDecision {
    credit_outcome: 'APPROVED' | 'APPROVED_WITH_CONDITIONS' | 'DECLINED';
    approved_dce_limit_sgd: number;
    approved_dce_pce_limit_sgd: number;
    confirmed_caa_approach: 'IRB' | 'SA';
    conditions: string[];
    credit_team_id: string;
    credit_team_name: string;
    decided_at: string;
}

export interface DceCreditResponse {
    case_id: string;
    credit_brief: DceCreditBrief | null;
    financial_extracts: DceFinancialExtract[];
    credit_decision: DceCreditDecision | null;
    next_node: string | null;
    notes: string | null;
}

// ─── SA-6 Config (sa6_get_config_spec) ──────────────────────────────────────

export interface DceConfigSpec {
    spec_id: string;
    case_id: string;
    status: 'DRAFT' | 'INSTRUCTION_GENERATED' | 'SENT_TO_TMO' | 'TMO_VALIDATED' | 'TMO_DISCREPANCY_FOUND';
    ubix_config: {
        entity_name: string;
        jurisdiction: string;
        lei: string | null;
        product_permissions: string[];
    };
    sic_config: {
        account_mapping: string;
        commission_rates: Record<string, number>;
        credit_limits: Record<string, number>;
    };
    cv_config: {
        contract_mapping: string;
        margin_rates: Record<string, number>;
        settlement_types: string[];
    };
    authorised_traders: {
        name: string;
        cqg_access: boolean;
        trading_permissions: string[];
    }[];
}

export interface DceTmoInstruction {
    instruction_id: string;
    status: 'GENERATED' | 'SENT_TO_TMO' | 'TMO_COMPLETED';
    ubix_steps: string[];
    sic_steps: string[];
    cv_steps: string[];
    trader_setup_steps: string[];
    validation_checklist: {
        system: string;
        field: string;
        expected_value: string;
    }[];
}

export interface DceSystemValidation {
    system: 'UBIX' | 'SIC' | 'CreditView';
    result: 'PASS' | 'FAIL';
    fields_checked: number;
    fields_passed: number;
    fields_failed: number;
    discrepancies: {
        field: string;
        expected: string;
        actual: string;
    }[];
}

export interface DceConfigResponse {
    case_id: string;
    config_spec: DceConfigSpec | null;
    tmo_instructions: DceTmoInstruction | null;
    system_validations: DceSystemValidation[];
    next_node: string | null;
    notes: string | null;
}

// ─── SA-7 Welcome Kit (sa7_get_welcome_kit) ─────────────────────────────────

export interface DceWelcomeKit {
    case_id: string;
    case_status: 'DONE';
    kit_id: string;
    entity_name: string;
    products_enabled: string[];
    approved_dce_limit_sgd: number;
    cqg_login: {
        username: string;
        login_url: string;
        temp_password: string;
        password_change_required: boolean;
    };
    idb_access: {
        portal_url: string;
        access_level: string;
        modules_enabled: string[];
    };
    notifications_sent: number;
    notification_channels: string[];
    completed_nodes: string[];
    next_node: null;
    notes: string | null;
}

// ─── HITL Review Task (dce_ao_hitl_review_task) ─────────────────────────────

export interface DceHitlReviewTask {
    task_id: string;                    // DB: dce_ao_hitl_review_task.task_id (HITL-XXXXXX)
    case_id: string;
    node_id: string;
    task_type: 'SIGNATURE_REVIEW' | 'KYC_CDD_REVIEW' | 'CREDIT_REVIEW' | 'TMO_STATIC_REVIEW'; // DB: task_type
    assigned_persona: 'DESK_SUPPORT' | 'RM' | 'CREDIT_TEAM' | 'TMO_STATIC';                   // DB: assigned_persona
    status: 'PENDING' | 'IN_REVIEW' | 'DECIDED' | 'EXPIRED';                                   // DB: status ENUMs
    assigned_to_id: string | null;      // DB: assigned_to_id
    assigned_name: string | null;       // Assembled field (from user lookup)
    assigned_at: string | null;
    deadline: string;                   // DB: dce_ao_hitl_review_task.deadline
    sla_breached: boolean;              // Computed field
    created_at: string;
    decided_at: string | null;
}

// ─── HITL Decision Field (for dynamic form rendering) ───────────────────────

export interface DceDecisionField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
    options?: { label: string; value: string }[];
    required: boolean;
    value?: any;
}

// ─── Filter interface ───────────────────────────────────────────────────────

export interface DceCaseFilters {
    status?: string;
    priority?: string;
    jurisdiction?: string;
    current_node?: string;
    limit?: number;
    offset?: number;
}

// ─── DCE Service ────────────────────────────────────────────────────────────

@Injectable({
    providedIn: 'root'
})
export class DceService {
    private http = inject(HttpClient);
    private baseUrl = '/api/dce';

    // ── Cases ─────────────────────────────────────────────────────────────

    listCases(filters: DceCaseFilters = {}): Observable<DceCaseListResponse> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.priority) params = params.set('priority', filters.priority);
        if (filters.jurisdiction) params = params.set('jurisdiction', filters.jurisdiction);
        if (filters.current_node) params = params.set('current_node', filters.current_node);
        if (filters.limit) params = params.set('limit', String(filters.limit));
        if (filters.offset) params = params.set('offset', String(filters.offset));

        return this.http.get<DceCaseListResponse>(`${this.baseUrl}/cases`, { params });
    }

    getCaseDetail(caseId: string): Observable<DceCaseDetailResponse> {
        return this.http.get<DceCaseDetailResponse>(`${this.baseUrl}/cases/${caseId}`).pipe(
            catchError(() => of(this._mockCaseDetail(caseId)))
        );
    }

    getCaseDocuments(caseId: string): Observable<DceCaseDocumentsResponse> {
        return this.http.get<DceCaseDocumentsResponse>(`${this.baseUrl}/cases/${caseId}/documents`).pipe(
            catchError(() => of(this._mockCaseDocuments(caseId)))
        );
    }

    getCaseEvents(caseId: string): Observable<DceCaseEventsResponse> {
        return this.http.get<DceCaseEventsResponse>(`${this.baseUrl}/cases/${caseId}/events`).pipe(
            catchError(() => of(this._mockCaseEvents(caseId)))
        );
    }

    // ── Demo Fallback Data ──────────────────────────────────────────────────

    private _mockCaseDetail(caseId: string): DceCaseDetailResponse {
        const now = new Date();
        const sla = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
        return {
            status: 'ok',
            case_state: {
                case_id: caseId,
                status: 'HITL_PENDING',
                current_node: 'N-2',
                completed_nodes: ['N-0', 'N-1'],
                failed_nodes: [],
                retry_counts: {},
                case_type: 'Corporate',
                priority: 'URGENT',
                rm_id: 'RM-0042',
                client_name: 'Temasek Holdings Pte Ltd',
                jurisdiction: 'SGP',
                sla_deadline: sla,
                created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: now.toISOString(),
                hitl_queue: { gate: 'HITL_RM', node: 'N-2', reason: 'KYC/CDD review requires RM decision' },
                event_count: 14,
            },
            classification: {
                classification_id: 1,
                case_id: caseId,
                submission_id: 1,
                account_type: 'Corporate – Multi-Currency',
                account_type_confidence: 94.2,
                account_type_reasoning: 'Entity type is Corporate (Pte Ltd), products requested include FX Forwards and Multi-Currency Cash Management. Mapped to Corporate Multi-Currency account template.',
                client_name: 'Temasek Holdings Pte Ltd',
                client_entity_type: 'Corporate',
                jurisdiction: 'SGP',
                products_requested: ['FX Forwards', 'Multi-Currency Cash Mgmt', 'Trade Finance LC'],
                priority: 'URGENT',
                priority_reason: 'Strategic client with existing Prime Brokerage relationship. SLA escalated per RM-0042 request.',
                sla_deadline: sla,
                classifier_model: 'dce-classifier-v2.1',
                classified_at: new Date(now.getTime() - 2.8 * 24 * 60 * 60 * 1000).toISOString(),
                flagged_for_review: false,
            },
            checkpoints: [
                { checkpoint_id: 1, case_id: caseId, node_id: 'N-0', attempt_number: 1, status: 'COMPLETED', input_snapshot: null, output_json: { result: 'classified' }, started_at: new Date(now.getTime() - 2.9 * 24 * 60 * 60 * 1000).toISOString(), completed_at: new Date(now.getTime() - 2.8 * 24 * 60 * 60 * 1000).toISOString(), duration_seconds: 8, next_node: 'N-1', failure_reason: '', agent_model: 'dce-intake-v1', token_usage: { input: 1200, output: 450 } },
                { checkpoint_id: 2, case_id: caseId, node_id: 'N-1', attempt_number: 1, status: 'COMPLETED', input_snapshot: null, output_json: { coverage: 85, missing: ['Board Resolution'] }, started_at: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(), completed_at: new Date(now.getTime() - 2.2 * 24 * 60 * 60 * 1000).toISOString(), duration_seconds: 45, next_node: 'N-2', failure_reason: '', agent_model: 'dce-docs-v1', token_usage: { input: 3400, output: 890 } },
                { checkpoint_id: 3, case_id: caseId, node_id: 'N-2', attempt_number: 1, status: 'IN_PROGRESS', input_snapshot: null, output_json: null, started_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed_at: '', duration_seconds: 0, next_node: '', failure_reason: '', agent_model: 'dce-kyc-v1', token_usage: null },
            ],
            rm_hierarchy: {
                assignment_id: 1,
                case_id: caseId,
                rm_id: 'RM-0042',
                rm_name: 'Sarah Chen',
                rm_email: 'sarah.chen@dbs.com',
                rm_branch: 'MBS Tower 3',
                rm_desk: 'Corporate Banking – Strategic Clients',
                rm_manager_id: 'MGR-0011',
                rm_manager_name: 'David Lim',
                rm_manager_email: 'david.lim@dbs.com',
            },
            completeness_assessment: {
                assessment_id: 1,
                case_id: caseId,
                attempt_number: 1,
                completeness_flag: false,
                total_mandatory: 8,
                matched_mandatory: 7,
                total_optional: 3,
                matched_optional: 2,
                coverage_pct: 87.5,
                missing_mandatory: ['Board Resolution (certified copy)'],
                next_node: 'HITL_RM',
                decision_reasoning: '7/8 mandatory documents matched. Board Resolution still outstanding — RM chase initiated.',
                sla_pct_consumed: 42,
                rm_chase_message: 'Hi Sarah, document collection for Temasek Holdings is at 87.5%. Board Resolution (certified) is still outstanding. SLA is 42% consumed — please follow up with the client.',
            },
        };
    }

    private _mockCaseDocuments(caseId: string): DceCaseDocumentsResponse {
        const now = new Date();
        return {
            status: 'ok',
            staged_documents: [
                { doc_id: 'DOC-001', case_id: caseId, submission_id: 1, filename: 'Certificate_of_Incorporation.pdf', mime_type: 'application/pdf', file_size_bytes: 245000, storage_url: '/docs/coi.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-002', case_id: caseId, submission_id: 1, filename: 'Memorandum_Articles.pdf', mime_type: 'application/pdf', file_size_bytes: 890000, storage_url: '/docs/mna.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-003', case_id: caseId, submission_id: 1, filename: 'ACRA_BizFile_Extract.pdf', mime_type: 'application/pdf', file_size_bytes: 125000, storage_url: '/docs/acra.pdf', source: 'REGISTRY_PULL', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 2.4 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-004', case_id: caseId, submission_id: 1, filename: 'Passport_Director_TanKL.pdf', mime_type: 'application/pdf', file_size_bytes: 560000, storage_url: '/docs/passport.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 2.3 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-005', case_id: caseId, submission_id: 1, filename: 'Proof_of_Address_Utility.pdf', mime_type: 'application/pdf', file_size_bytes: 98000, storage_url: '/docs/poa.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 2.1 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-006', case_id: caseId, submission_id: 1, filename: 'Bank_Reference_Letter.pdf', mime_type: 'application/pdf', file_size_bytes: 67000, storage_url: '/docs/bankref.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 1.8 * 24 * 60 * 60 * 1000).toISOString() },
                { doc_id: 'DOC-007', case_id: caseId, submission_id: 1, filename: 'Account_Opening_Form_Signed.pdf', mime_type: 'application/pdf', file_size_bytes: 340000, storage_url: '/docs/aof.pdf', source: 'CLIENT_UPLOAD', upload_status: 'VERIFIED', created_at: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString() },
            ],
            ocr_results: [],
            reviews: [],
            checklist_items: [
                { item_id: 1, checklist_id: 1, case_id: caseId, doc_type_code: 'COI', doc_type_name: 'Certificate of Incorporation', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §4.2', matched_doc_id: 'DOC-001', match_status: 'MATCHED', match_confidence: 98, notes: '' },
                { item_id: 2, checklist_id: 1, case_id: caseId, doc_type_code: 'MNA', doc_type_name: 'Memorandum & Articles of Association', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §4.3', matched_doc_id: 'DOC-002', match_status: 'MATCHED', match_confidence: 96, notes: '' },
                { item_id: 3, checklist_id: 1, case_id: caseId, doc_type_code: 'ACRA', doc_type_name: 'ACRA BizFile Extract (< 3 months)', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §4.4', matched_doc_id: 'DOC-003', match_status: 'MATCHED', match_confidence: 99, notes: 'Auto-pulled from ACRA registry' },
                { item_id: 4, checklist_id: 1, case_id: caseId, doc_type_code: 'ID_DIR', doc_type_name: 'Director ID (Passport / NRIC)', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §5.1', matched_doc_id: 'DOC-004', match_status: 'MATCHED', match_confidence: 95, notes: '' },
                { item_id: 5, checklist_id: 1, case_id: caseId, doc_type_code: 'POA', doc_type_name: 'Proof of Address (< 3 months)', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §5.2', matched_doc_id: 'DOC-005', match_status: 'MATCHED', match_confidence: 91, notes: '' },
                { item_id: 6, checklist_id: 1, case_id: caseId, doc_type_code: 'BANK_REF', doc_type_name: 'Bank Reference Letter', requirement: 'MANDATORY', regulatory_ref: 'Internal Policy §3.1', matched_doc_id: 'DOC-006', match_status: 'MATCHED', match_confidence: 88, notes: '' },
                { item_id: 7, checklist_id: 1, case_id: caseId, doc_type_code: 'AOF', doc_type_name: 'Account Opening Form (signed)', requirement: 'MANDATORY', regulatory_ref: 'Internal Policy §2.1', matched_doc_id: 'DOC-007', match_status: 'MATCHED', match_confidence: 97, notes: '' },
                { item_id: 8, checklist_id: 1, case_id: caseId, doc_type_code: 'BOARD_RES', doc_type_name: 'Board Resolution (certified copy)', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice 626, §4.5', matched_doc_id: null, match_status: 'UNMATCHED', match_confidence: null, notes: 'Outstanding — RM chase sent' },
                { item_id: 9, checklist_id: 1, case_id: caseId, doc_type_code: 'FIN_STMT', doc_type_name: 'Latest Audited Financial Statements', requirement: 'OPTIONAL', regulatory_ref: 'Internal Policy §6.1', matched_doc_id: null, match_status: 'UNMATCHED', match_confidence: null, notes: '' },
                { item_id: 10, checklist_id: 1, case_id: caseId, doc_type_code: 'SOW', doc_type_name: 'Source of Wealth Declaration', requirement: 'OPTIONAL', regulatory_ref: 'MAS Notice 626, §7.3', matched_doc_id: null, match_status: 'UNMATCHED', match_confidence: null, notes: '' },
            ],
        };
    }

    private _mockCaseEvents(caseId: string): DceCaseEventsResponse {
        const now = new Date();
        const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        return {
            status: 'ok',
            events: [
                { event_id: 1, case_id: caseId, event_type: 'CASE_CREATED', from_state: '', to_state: 'ACTIVE', event_payload: {}, triggered_by: 'SYSTEM', triggered_at: d(3) },
                { event_id: 2, case_id: caseId, event_type: 'NODE_STARTED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-0' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(2.9) },
                { event_id: 3, case_id: caseId, event_type: 'CLASSIFICATION_COMPLETE', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { account_type: 'Corporate – Multi-Currency', confidence: 94.2 }, triggered_by: 'SA-1', triggered_at: d(2.8) },
                { event_id: 4, case_id: caseId, event_type: 'NODE_COMPLETED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-0', next: 'N-1' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(2.8) },
                { event_id: 5, case_id: caseId, event_type: 'NODE_STARTED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-1' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(2.5) },
                { event_id: 6, case_id: caseId, event_type: 'DOCUMENT_UPLOADED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { doc: 'Certificate_of_Incorporation.pdf' }, triggered_by: 'CLIENT', triggered_at: d(2.5) },
                { event_id: 7, case_id: caseId, event_type: 'DOCUMENT_UPLOADED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { doc: 'ACRA_BizFile_Extract.pdf' }, triggered_by: 'REGISTRY_PULL', triggered_at: d(2.4) },
                { event_id: 8, case_id: caseId, event_type: 'COMPLETENESS_ASSESSED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { coverage: 87.5, missing: ['Board Resolution'] }, triggered_by: 'SA-2', triggered_at: d(2.2) },
                { event_id: 9, case_id: caseId, event_type: 'NODE_COMPLETED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-1', next: 'N-2' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(2.2) },
                { event_id: 10, case_id: caseId, event_type: 'NODE_STARTED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-2' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(1) },
                { event_id: 11, case_id: caseId, event_type: 'KYC_SCREENING_STARTED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { entities: 3 }, triggered_by: 'SA-4', triggered_at: d(0.9) },
                { event_id: 12, case_id: caseId, event_type: 'SANCTIONS_CLEAR', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { result: 'No matches' }, triggered_by: 'SA-4', triggered_at: d(0.8) },
                { event_id: 13, case_id: caseId, event_type: 'HITL_GATE_REACHED', from_state: 'ACTIVE', to_state: 'HITL_PENDING', event_payload: { gate: 'HITL_RM', reason: 'KYC/CDD review requires RM decision' }, triggered_by: 'ORCHESTRATOR', triggered_at: d(0.5) },
                { event_id: 14, case_id: caseId, event_type: 'RM_NOTIFICATION_SENT', from_state: 'HITL_PENDING', to_state: 'HITL_PENDING', event_payload: { channel: 'EMAIL', recipient: 'sarah.chen@dbs.com' }, triggered_by: 'SA-7', triggered_at: d(0.5) },
            ],
            notifications: [
                { notification_id: 1, case_id: caseId, node_id: 'N-1', notification_type: 'RM_CHASE', channel: 'EMAIL', recipient_id: 'RM-0042', recipient_email: 'sarah.chen@dbs.com', subject: 'Action Required: Missing Board Resolution for Temasek Holdings', delivery_status: 'DELIVERED', created_at: d(2.2) },
                { notification_id: 2, case_id: caseId, node_id: 'N-2', notification_type: 'HITL_GATE', channel: 'EMAIL', recipient_id: 'RM-0042', recipient_email: 'sarah.chen@dbs.com', subject: 'HITL Decision Required: KYC/CDD Review — Temasek Holdings', delivery_status: 'DELIVERED', created_at: d(0.5) },
                { notification_id: 3, case_id: caseId, node_id: 'N-2', notification_type: 'HITL_GATE', channel: 'IN_APP', recipient_id: 'RM-0042', recipient_email: 'sarah.chen@dbs.com', subject: 'KYC Decision Pending — Temasek Holdings (DCE Case)', delivery_status: 'DELIVERED', created_at: d(0.5) },
            ],
        };
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    getDashboardKpis(): Observable<DceDashboardKpis> {
        return this.http.get<DceDashboardKpis>(`${this.baseUrl}/dashboard/kpis`);
    }

    // ── Create ──────────────────────────────────────────────────────────

    createCase(data: {
        client_name: string;
        account_type: string;
        priority?: string;
        jurisdiction?: string;
        products_requested?: string[];
        rm_id?: string;
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/cases`, data);
    }

    // ── SA-3 Signatures (sa3_get_verification_status) ──────────────────

    getCaseSignatures(caseId: string): Observable<DceSignatureVerification> {
        return this.http.get<DceSignatureVerification>(`${this.baseUrl}/cases/${caseId}/signatures`);
    }

    // ── SA-4 KYC/CDD (sa4_get_kyc_brief) ────────────────────────────────

    getCaseKyc(caseId: string): Observable<DceKycBrief> {
        return this.http.get<DceKycBrief>(`${this.baseUrl}/cases/${caseId}/kyc`);
    }

    // ── SA-5 Credit (sa5_get_credit_brief) ──────────────────────────────

    getCaseCredit(caseId: string): Observable<DceCreditResponse> {
        return this.http.get<DceCreditResponse>(`${this.baseUrl}/cases/${caseId}/credit`);
    }

    // ── SA-6 Config (sa6_get_config_spec) ────────────────────────────────

    getCaseConfig(caseId: string): Observable<DceConfigResponse> {
        return this.http.get<DceConfigResponse>(`${this.baseUrl}/cases/${caseId}/config`);
    }

    // ── SA-7 Welcome Kit (sa7_get_welcome_kit) ──────────────────────────

    getCaseWelcomeKit(caseId: string): Observable<DceWelcomeKit> {
        return this.http.get<DceWelcomeKit>(`${this.baseUrl}/cases/${caseId}/welcome-kit`);
    }

    // ── Workflow triggers ─────────────────────────────────────────────────

    runWorkflow(agentId: string, inputs: Record<string, any>): Observable<any> {
        return this.http.post(`${this.baseUrl}/workflow/${agentId}`, { inputs });
    }

    // ── HITL Decision Submissions ─────────────────────────────────────────

    submitSignatureDecision(caseId: string, payload: {
        mode: 'RESUME';
        task_id: string;
        decisions: { signatory_id: string; outcome: string; notes?: string; approving_officer_id?: string }[];
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/cases/${caseId}/hitl/N-2/decide`, payload);
    }

    submitKycDecision(caseId: string, payload: {
        mode: 'RESUME';
        task_id: string;
        rm_decisions: DceRmKycDecision;
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/cases/${caseId}/hitl/N-3/decide`, payload);
    }

    submitCreditDecision(caseId: string, payload: {
        mode: 'RESUME';
        task_id: string;
        credit_decisions: Partial<DceCreditDecision>;
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/cases/${caseId}/hitl/N-4/decide`, payload);
    }

    submitConfigValidation(caseId: string, payload: {
        mode: 'RESUME';
        task_id: string;
    }): Observable<any> {
        return this.http.post(`${this.baseUrl}/cases/${caseId}/hitl/N-5/decide`, payload);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': 'bg-green-100 text-green-800',
            'HITL_PENDING': 'bg-yellow-100 text-yellow-800',
            'ESCALATED': 'bg-red-100 text-red-800',
            'DONE': 'bg-gray-100 text-gray-600',
            'DEAD': 'bg-gray-200 text-gray-500',
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    }

    getPriorityColor(priority: string): string {
        const colors: Record<string, string> = {
            'URGENT': 'bg-red-100 text-red-700',
            'STANDARD': 'bg-blue-100 text-blue-700',
            'DEFERRED': 'bg-gray-100 text-gray-600',
        };
        return colors[priority] || 'bg-gray-100 text-gray-600';
    }

    getNodeLabel(nodeId: string): string {
        const labels: Record<string, string> = {
            'N-0': 'Intake & Triage',
            'N-1': 'Document Collection',
            'N-2': 'Signature Verification',
            'N-3': 'KYC/CDD',
            'N-4': 'Credit Risk',
            'N-5': 'Account Config',
            'N-6': 'Notification',
            'HITL_RM': 'Pending RM Action',
            'HITL_DESK': 'Pending Desk Support',
            'HITL_CREDIT': 'Pending Credit Team',
            'HITL_TMO': 'Pending TMO Static',
            'DONE': 'Completed',
        };
        return labels[nodeId] || nodeId;
    }
}
