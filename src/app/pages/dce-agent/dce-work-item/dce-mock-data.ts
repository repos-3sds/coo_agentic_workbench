/**
 * DCE Mock Data — mirrors exact MCP tool response shapes.
 * Swapping mock→live requires zero UI changes.
 *
 * Scenario: Case AO-2026-000101 (ABC Trading Pte Ltd)
 *   - N-0 (Intake): COMPLETED
 *   - N-1 (Documents): COMPLETED
 *   - N-2 (Signatures): COMPLETED (HITL decided)
 *   - N-3 (KYC/CDD): HITL_PENDING (awaiting RM review)
 *   - N-4 (Credit): PENDING
 *   - N-5 (Config): PENDING
 *   - N-6 (Notification): PENDING
 */

import {
    DceCaseState, DceClassification, DceCheckpoint, DceRmHierarchy,
    DceCompletenessAssessment, DceStagedDocument, DceChecklistItem,
    DceEvent, DceNotification, DceCaseDetailResponse, DceCaseDocumentsResponse,
    DceCaseEventsResponse, DceSignatureVerification, DceKycBrief,
    DceCreditResponse, DceConfigResponse, DceHitlReviewTask,
} from '../../../services/dce.service';

// ─── SA-1/Orchestrator: Case Detail ─────────────────────────────────────────

export function getMockCaseDetail(): DceCaseDetailResponse {
    return {
        status: 'ok',
        case_state: {
            case_id: 'AO-2026-000101',
            status: 'HITL_PENDING',
            current_node: 'N-3',
            completed_nodes: ['N-0', 'N-1', 'N-2'],
            failed_nodes: [],
            retry_counts: { 'N-0': 1, 'N-1': 1, 'N-2': 1 },
            case_type: 'INSTITUTIONAL_FUTURES',
            priority: 'URGENT',
            rm_id: 'RM-0042',
            client_name: 'ABC Trading Pte Ltd',
            jurisdiction: 'SGP',
            sla_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: '2026-03-02T09:30:00+08:00',
            updated_at: new Date().toISOString(),
            hitl_queue: 'HITL_RM',
            event_count: 12,
        },
        classification: {
            classification_id: 1,
            case_id: 'AO-2026-000101',
            submission_id: 1,
            account_type: 'INSTITUTIONAL_FUTURES',
            account_type_confidence: 0.94,
            account_type_reasoning: 'Corporate entity requesting futures + options products. Matches INSTITUTIONAL_FUTURES pattern.',
            client_name: 'ABC Trading Pte Ltd',
            client_entity_type: 'CORP',
            jurisdiction: 'SGP',
            products_requested: ['FUTURES', 'OPTIONS'],
            priority: 'URGENT',
            priority_reason: 'Platinum client; RM urgency flag; regulatory deadline',
            sla_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            classifier_model: 'claude-sonnet-4-6',
            classified_at: '2026-03-02T09:31:15+08:00',
            flagged_for_review: false,
        },
        checkpoints: [
            {
                checkpoint_id: 1, case_id: 'AO-2026-000101', node_id: 'N-0',
                attempt_number: 1, status: 'COMPLETED',
                input_snapshot: { submission_source: 'EMAIL' },
                output_json: { case_id: 'AO-2026-000101', account_type: 'INSTITUTIONAL_FUTURES', next_node: 'N-1' },
                started_at: '2026-03-02T09:30:00+08:00', completed_at: '2026-03-02T09:31:15+08:00',
                duration_seconds: 75, next_node: 'N-1', failure_reason: '',
                agent_model: 'claude-sonnet-4-6', token_usage: { input: 2340, output: 890 },
            },
            {
                checkpoint_id: 2, case_id: 'AO-2026-000101', node_id: 'N-1',
                attempt_number: 1, status: 'COMPLETED',
                input_snapshot: { case_id: 'AO-2026-000101', submitted_documents: 6 },
                output_json: { completeness_flag: true, coverage_pct: 100, next_node: 'N-2' },
                started_at: '2026-03-02T09:35:00+08:00', completed_at: '2026-03-02T09:38:22+08:00',
                duration_seconds: 202, next_node: 'N-2', failure_reason: '',
                agent_model: 'claude-sonnet-4-6', token_usage: { input: 15400, output: 3200 },
            },
            {
                checkpoint_id: 3, case_id: 'AO-2026-000101', node_id: 'N-2',
                attempt_number: 1, status: 'COMPLETED',
                input_snapshot: { case_id: 'AO-2026-000101', document_ids: ['DOC-001', 'DOC-002', 'DOC-003'] },
                output_json: { verification_status: 'ALL_APPROVED', next_node: 'N-3' },
                started_at: '2026-03-02T10:00:00+08:00', completed_at: '2026-03-02T11:22:00+08:00',
                duration_seconds: 4920, next_node: 'N-3', failure_reason: '',
                agent_model: 'claude-sonnet-4-6', token_usage: { input: 8900, output: 1800 },
            },
        ],
        rm_hierarchy: {
            assignment_id: 1,
            case_id: 'AO-2026-000101',
            rm_id: 'RM-0042',
            rm_name: 'John Tan Wei Ming',
            rm_email: 'john.tan@abs.com',
            rm_branch: 'Singapore HQ',
            rm_desk: 'Institutional Derivatives',
            rm_manager_id: 'MGR-0012',
            rm_manager_name: 'Sarah Lim',
            rm_manager_email: 'sarah.lim@abs.com',
        },
        completeness_assessment: {
            assessment_id: 1,
            case_id: 'AO-2026-000101',
            attempt_number: 1,
            completeness_flag: true,
            total_mandatory: 5,
            matched_mandatory: 5,
            total_optional: 3,
            matched_optional: 1,
            coverage_pct: 100,
            missing_mandatory: [],
            next_node: 'N-2',
            decision_reasoning: 'All 5 mandatory documents matched with HIGH confidence. 1 optional document (financial projections) provided.',
            sla_pct_consumed: 12,
            rm_chase_message: '',
        },
    };
}

// ─── SA-2: Documents ────────────────────────────────────────────────────────

export function getMockDocuments(): DceCaseDocumentsResponse {
    return {
        status: 'ok',
        staged_documents: [
            { doc_id: 'DOC-001', case_id: 'AO-2026-000101', submission_id: 1, filename: 'AO_Form_Signed.pdf', mime_type: 'application/pdf', file_size_bytes: 245760, storage_url: 'mongodb://docstore/dce/DOC-001', source: 'EMAIL_ATTACHMENT', upload_status: 'COMPLETED', created_at: '2026-03-02T09:30:00+08:00' },
            { doc_id: 'DOC-002', case_id: 'AO-2026-000101', submission_id: 1, filename: 'Board_Resolution.pdf', mime_type: 'application/pdf', file_size_bytes: 189440, storage_url: 'mongodb://docstore/dce/DOC-002', source: 'EMAIL_ATTACHMENT', upload_status: 'COMPLETED', created_at: '2026-03-02T09:30:00+08:00' },
            { doc_id: 'DOC-003', case_id: 'AO-2026-000101', submission_id: 1, filename: 'Certificate_of_Incumbency.pdf', mime_type: 'application/pdf', file_size_bytes: 156000, storage_url: 'mongodb://docstore/dce/DOC-003', source: 'PORTAL_UPLOAD', upload_status: 'COMPLETED', created_at: '2026-03-02T09:32:00+08:00' },
            { doc_id: 'DOC-004', case_id: 'AO-2026-000101', submission_id: 1, filename: 'ACRA_BizProfile.pdf', mime_type: 'application/pdf', file_size_bytes: 98304, storage_url: 'mongodb://docstore/dce/DOC-004', source: 'PORTAL_UPLOAD', upload_status: 'COMPLETED', created_at: '2026-03-02T09:32:00+08:00' },
            { doc_id: 'DOC-005', case_id: 'AO-2026-000101', submission_id: 1, filename: 'Director_Passport_JohnTan.pdf', mime_type: 'application/pdf', file_size_bytes: 512000, storage_url: 'mongodb://docstore/dce/DOC-005', source: 'PORTAL_UPLOAD', upload_status: 'COMPLETED', created_at: '2026-03-02T09:33:00+08:00' },
            { doc_id: 'DOC-006', case_id: 'AO-2026-000101', submission_id: 1, filename: 'Financial_Statements_FY2025.pdf', mime_type: 'application/pdf', file_size_bytes: 1048576, storage_url: 'mongodb://docstore/dce/DOC-006', source: 'PORTAL_UPLOAD', upload_status: 'COMPLETED', created_at: '2026-03-02T09:34:00+08:00' },
        ],
        ocr_results: [],
        reviews: [],
        checklist_items: [
            { item_id: 1, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'AO_FORM', doc_type_name: 'Account Opening Form', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice SFA 04-N02', matched_doc_id: 'DOC-001', match_status: 'MATCHED', match_confidence: 0.98, notes: '' },
            { item_id: 2, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'BOARD_RES', doc_type_name: 'Board Resolution / Authorised Signatory List', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice SFA 04-N02 S4.2', matched_doc_id: 'DOC-002', match_status: 'MATCHED', match_confidence: 0.95, notes: '' },
            { item_id: 3, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'COI', doc_type_name: 'Certificate of Incumbency', requirement: 'MANDATORY', regulatory_ref: 'MAS Notice SFA 04-N02 S4.3', matched_doc_id: 'DOC-003', match_status: 'MATCHED', match_confidence: 0.92, notes: '' },
            { item_id: 4, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'BIZ_PROFILE', doc_type_name: 'ACRA Business Profile', requirement: 'MANDATORY', regulatory_ref: 'ACRA Act S12', matched_doc_id: 'DOC-004', match_status: 'MATCHED', match_confidence: 0.97, notes: '' },
            { item_id: 5, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'DIRECTOR_ID', doc_type_name: 'Director Passport / NRIC', requirement: 'MANDATORY', regulatory_ref: 'MAS AML/CFT Notice 626', matched_doc_id: 'DOC-005', match_status: 'MATCHED', match_confidence: 0.99, notes: '' },
            { item_id: 6, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'FIN_STMT', doc_type_name: 'Audited Financial Statements (Latest 3 FY)', requirement: 'OPTIONAL', regulatory_ref: 'Internal Credit Policy S2.1', matched_doc_id: 'DOC-006', match_status: 'MATCHED', match_confidence: 0.91, notes: 'Only FY2025 provided. FY2024 and FY2023 pending.' },
            { item_id: 7, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'TAX_CERT', doc_type_name: 'Tax Residency Certificate', requirement: 'OPTIONAL', regulatory_ref: 'CRS/FATCA', matched_doc_id: null, match_status: 'UNMATCHED', match_confidence: null, notes: 'Optional — will request during onboarding.' },
            { item_id: 8, checklist_id: 1, case_id: 'AO-2026-000101', doc_type_code: 'FINANCIAL_PROJ', doc_type_name: 'Financial Projections / Business Plan', requirement: 'OPTIONAL', regulatory_ref: '', matched_doc_id: null, match_status: 'UNMATCHED', match_confidence: null, notes: '' },
        ],
    };
}

// ─── SA-3: Signature Verification ───────────────────────────────────────────

export function getMockSignatures(): DceSignatureVerification {
    return {
        case_id: 'AO-2026-000101',
        verification_status: 'ALL_APPROVED',
        total_signatories: 2,
        approved_count: 2,
        rejected_count: 0,
        clarify_count: 0,
        signatories: [
            {
                signatory_id: 'SIG-001',
                signatory_name: 'John Tan Wei Ming',
                role_in_mandate: 'Director & CEO',
                authority_status: 'AUTHORISED',
                confidence_score: 91.5,
                confidence_tier: 'HIGH',
                outcome: 'APPROVED',
                specimen_id: 'SPEC-000031',
                flag_reason: null,
                reviewer: 'David Chen (DS-0015)',
                decided_at: '2026-03-02T11:20:00+08:00',
                notes: 'Signature matches passport specimen — high confidence',
            },
            {
                signatory_id: 'SIG-002',
                signatory_name: 'Mei Ling Wong',
                role_in_mandate: 'CFO & Authorised Signatory',
                authority_status: 'AUTHORISED',
                confidence_score: 78.3,
                confidence_tier: 'MEDIUM',
                outcome: 'APPROVED',
                specimen_id: 'SPEC-000032',
                flag_reason: 'Medium confidence — slight stylistic variation from mandate specimen',
                reviewer: 'David Chen (DS-0015)',
                decided_at: '2026-03-02T11:22:00+08:00',
                notes: 'Minor variation in stroke — verified against 2 historical specimens. Approved.',
            },
        ],
        specimens_stored: ['SPEC-000031', 'SPEC-000032'],
        reviewed_by_officer_id: 'DS-0015',
        reviewed_at: '2026-03-02T11:22:00+08:00',
        next_node: 'N-3',
        verification_notes: '2 signatories verified. Both authorised per mandate. All specimens stored.',
        task_id: 'HITL-000042',
        deadline: '2026-03-03T09:30:00+08:00',
    };
}

// ─── SA-4: KYC/CDD Brief ───────────────────────────────────────────────────

export function getMockKyc(): DceKycBrief {
    return {
        case_id: 'AO-2026-000101',
        brief_id: 'BRIEF-000101',
        entity_summary: 'ABC Trading Pte Ltd is a Singapore-incorporated private limited company (UEN: 201812345A) established in 2018. Principal activity: proprietary trading in commodity futures and options. Registered address: 80 Robinson Road, #10-01, Singapore 068898.',
        ownership_chain: 'ABC Holdings Pte Ltd (75%) → John Tan Wei Ming (60% of ABC Holdings) + Mei Ling Wong (40% of ABC Holdings). Remaining 25% held by Golden Dragon Capital (BVI) Ltd — UBO traced to Chen Wei (HKG national, 100%).',
        acra_coi: 'ACRA BizProfile verified: Active status, incorporated 15-Jun-2018, paid-up capital SGD 2,000,000. No adverse ACRA filings. Certificate of Incumbency (Jersey) confirms current directors and secretary.',
        directors: '1. John Tan Wei Ming — Singapore Citizen (NRIC: S7812345A), appointed 15-Jun-2018, CEO & Director. 2. Mei Ling Wong — Singapore PR (FIN: G2345678A), appointed 01-Jan-2020, CFO & Director.',
        beneficial_owners: 'UBO-1: John Tan Wei Ming — 45% effective ownership (60% × 75% = 45%). UBO-2: Mei Ling Wong — 30% effective ownership (40% × 75% = 30%). UBO-3: Chen Wei — 25% via Golden Dragon Capital (BVI) Ltd.',
        screening_summary: '4 names screened against Refinitiv World-Check, Dow Jones Risk & Compliance, OFAC SDN, UN Consolidated List. No confirmed hits. 0 PEP flags. 0 adverse media items.',
        screening_results: [
            { name_screened: 'ABC Trading Pte Ltd', role: 'Entity', sanctions_status: 'CLEAR', pep_flags_count: 0, adverse_media_count: 0, detail: null },
            { name_screened: 'John Tan Wei Ming', role: 'Director & UBO (45%)', sanctions_status: 'CLEAR', pep_flags_count: 0, adverse_media_count: 0, detail: null },
            { name_screened: 'Mei Ling Wong', role: 'Director & UBO (30%)', sanctions_status: 'CLEAR', pep_flags_count: 0, adverse_media_count: 0, detail: null },
            { name_screened: 'Chen Wei', role: 'UBO (25%) via Golden Dragon Capital', sanctions_status: 'CLEAR', pep_flags_count: 0, adverse_media_count: 0, detail: 'No adverse findings. BVI entity verified via CoI.' },
        ],
        source_of_wealth: 'Primary SoW: Accumulated profits from proprietary commodity futures trading (since 2018). Secondary SoW: Initial capital injection from ABC Holdings (paid-up SGD 2M). Supporting docs: Audited financial statements FY2025 showing retained earnings SGD 4.2M.',
        risk_factors: 'RF-1: BVI entity in ownership chain (Golden Dragon Capital) — mitigated by CoI and UBO identification. RF-2: Commodity derivatives trading — inherently higher risk product class. RF-3: Cross-border UBO (HKG national via BVI) — acceptable with EDD.',
        is_retail_investor: 'NOT RETAIL — Entity is a corporate client. Accredited Investor status to be confirmed during credit assessment.',
        open_questions: 'OQ-1: Confirm Accredited Investor status (AI declaration form pending). OQ-2: Source of funds for initial margin — expected from operating cash flow or credit facility?',
        suggested_risk_range: 'MEDIUM — Standard CDD sufficient. BVI chain adequately mitigated. No screening hits.',
        names_screened: 4,
        sanctions_status: 'CLEAR',
        pep_flags_count: 0,
        adverse_media_found: false,
        rm_decisions: null,
        next_node: null,
        brief_url: null,
        notes: '4 names screened. All clear. Medium risk suggested. Awaiting RM review.',
    };
}

// ─── SA-5: Credit ───────────────────────────────────────────────────────────

export function getMockCredit(): DceCreditResponse {
    return {
        case_id: 'AO-2026-000101',
        credit_brief: null,
        financial_extracts: [],
        credit_decision: null,
        next_node: null,
        notes: 'Credit assessment not yet started — case is at N-3 (KYC/CDD).',
    };
}

// ─── SA-6: Config ───────────────────────────────────────────────────────────

export function getMockConfig(): DceConfigResponse {
    return {
        case_id: 'AO-2026-000101',
        config_spec: null,
        tmo_instructions: null,
        system_validations: [],
        next_node: null,
        notes: 'Static configuration not yet started — case is at N-3 (KYC/CDD).',
    };
}

// ─── Events & Notifications ─────────────────────────────────────────────────

export function getMockEvents(): DceCaseEventsResponse {
    return {
        status: 'ok',
        events: [
            { event_id: 1, case_id: 'AO-2026-000101', event_type: 'CASE_CREATED', from_state: '', to_state: 'ACTIVE', event_payload: { submission_source: 'EMAIL' }, triggered_by: 'SA-1', triggered_at: '2026-03-02T09:30:00+08:00' },
            { event_id: 2, case_id: 'AO-2026-000101', event_type: 'CLASSIFICATION_COMPLETE', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { account_type: 'INSTITUTIONAL_FUTURES', confidence: 0.94 }, triggered_by: 'SA-1', triggered_at: '2026-03-02T09:31:15+08:00' },
            { event_id: 3, case_id: 'AO-2026-000101', event_type: 'NODE_COMPLETED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-0', duration_seconds: 75 }, triggered_by: 'ORCHESTRATOR', triggered_at: '2026-03-02T09:31:15+08:00' },
            { event_id: 4, case_id: 'AO-2026-000101', event_type: 'DOCUMENTS_STAGED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { doc_count: 6 }, triggered_by: 'SA-2', triggered_at: '2026-03-02T09:35:00+08:00' },
            { event_id: 5, case_id: 'AO-2026-000101', event_type: 'CHECKLIST_COMPLETE', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { coverage_pct: 100, mandatory_complete: true }, triggered_by: 'SA-2', triggered_at: '2026-03-02T09:38:22+08:00' },
            { event_id: 6, case_id: 'AO-2026-000101', event_type: 'NODE_COMPLETED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-1', duration_seconds: 202 }, triggered_by: 'ORCHESTRATOR', triggered_at: '2026-03-02T09:38:22+08:00' },
            { event_id: 7, case_id: 'AO-2026-000101', event_type: 'SIGNATURE_ANALYSED', from_state: 'ACTIVE', to_state: 'HITL_PENDING', event_payload: { signatories: 2, flags: 1 }, triggered_by: 'SA-3', triggered_at: '2026-03-02T10:00:00+08:00' },
            { event_id: 8, case_id: 'AO-2026-000101', event_type: 'HITL_TASK_CREATED', from_state: 'HITL_PENDING', to_state: 'HITL_PENDING', event_payload: { task_id: 'HITL-000042', assigned_persona: 'DESK_SUPPORT', node: 'N-2' }, triggered_by: 'ORCHESTRATOR', triggered_at: '2026-03-02T10:00:30+08:00' },
            { event_id: 9, case_id: 'AO-2026-000101', event_type: 'HITL_DECISION_SUBMITTED', from_state: 'HITL_PENDING', to_state: 'ACTIVE', event_payload: { task_id: 'HITL-000042', all_approved: true }, triggered_by: 'DS-0015', triggered_at: '2026-03-02T11:22:00+08:00' },
            { event_id: 10, case_id: 'AO-2026-000101', event_type: 'NODE_COMPLETED', from_state: 'ACTIVE', to_state: 'ACTIVE', event_payload: { node: 'N-2', duration_seconds: 4920 }, triggered_by: 'ORCHESTRATOR', triggered_at: '2026-03-02T11:22:00+08:00' },
            { event_id: 11, case_id: 'AO-2026-000101', event_type: 'KYC_BRIEF_GENERATED', from_state: 'ACTIVE', to_state: 'HITL_PENDING', event_payload: { brief_id: 'BRIEF-000101', names_screened: 4, sanctions_status: 'CLEAR' }, triggered_by: 'SA-4', triggered_at: '2026-03-02T11:45:00+08:00' },
            { event_id: 12, case_id: 'AO-2026-000101', event_type: 'HITL_TASK_CREATED', from_state: 'HITL_PENDING', to_state: 'HITL_PENDING', event_payload: { task_id: 'HITL-000043', assigned_persona: 'RM', node: 'N-3' }, triggered_by: 'ORCHESTRATOR', triggered_at: '2026-03-02T11:45:30+08:00' },
        ],
        notifications: [
            { notification_id: 1, case_id: 'AO-2026-000101', node_id: 'N-0', notification_type: 'INTAKE_ACKNOWLEDGEMENT', channel: 'EMAIL', recipient_id: 'RM-0042', recipient_email: 'john.tan@abs.com', subject: 'Case AO-2026-000101 created — ABC Trading Pte Ltd', delivery_status: 'DELIVERED', created_at: '2026-03-02T09:31:30+08:00' },
            { notification_id: 2, case_id: 'AO-2026-000101', node_id: 'N-2', notification_type: 'HITL_REVIEW_REQUEST', channel: 'EMAIL', recipient_id: 'DS-0015', recipient_email: 'david.chen@abs.com', subject: 'Signature review required — AO-2026-000101', delivery_status: 'DELIVERED', created_at: '2026-03-02T10:00:30+08:00' },
            { notification_id: 3, case_id: 'AO-2026-000101', node_id: 'N-3', notification_type: 'HITL_REVIEW_REQUEST', channel: 'EMAIL', recipient_id: 'RM-0042', recipient_email: 'john.tan@abs.com', subject: 'KYC review required — AO-2026-000101 (ABC Trading)', delivery_status: 'DELIVERED', created_at: '2026-03-02T11:45:30+08:00' },
        ],
    };
}

// ─── HITL Review Tasks ──────────────────────────────────────────────────────

export function getMockHitlTasks(): DceHitlReviewTask[] {
    return [
        {
            task_id: 'HITL-000042',
            case_id: 'AO-2026-000101',
            node_id: 'N-2',
            task_type: 'SIGNATURE_REVIEW',
            assigned_persona: 'DESK_SUPPORT',
            status: 'DECIDED',
            assigned_to_id: 'DS-0015',
            assigned_name: 'David Chen',
            assigned_at: '2026-03-02T10:00:30+08:00',
            deadline: '2026-03-03T09:30:00+08:00',
            sla_breached: false,
            created_at: '2026-03-02T10:00:30+08:00',
            decided_at: '2026-03-02T11:22:00+08:00',
        },
        {
            task_id: 'HITL-000043',
            case_id: 'AO-2026-000101',
            node_id: 'N-3',
            task_type: 'KYC_CDD_REVIEW',
            assigned_persona: 'RM',
            status: 'PENDING',
            assigned_to_id: 'RM-0042',
            assigned_name: 'John Tan Wei Ming',
            assigned_at: '2026-03-02T11:45:30+08:00',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            sla_breached: false,
            created_at: '2026-03-02T11:45:30+08:00',
            decided_at: null,
        },
    ];
}
