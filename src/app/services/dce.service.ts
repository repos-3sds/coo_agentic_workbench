import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

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
        return this.http.get<DceCaseDetailResponse>(`${this.baseUrl}/cases/${caseId}`);
    }

    getCaseDocuments(caseId: string): Observable<DceCaseDocumentsResponse> {
        return this.http.get<DceCaseDocumentsResponse>(`${this.baseUrl}/cases/${caseId}/documents`);
    }

    getCaseEvents(caseId: string): Observable<DceCaseEventsResponse> {
        return this.http.get<DceCaseEventsResponse>(`${this.baseUrl}/cases/${caseId}/events`);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    getDashboardKpis(): Observable<DceDashboardKpis> {
        return this.http.get<DceDashboardKpis>(`${this.baseUrl}/dashboard/kpis`);
    }

    // ── Workflow triggers ─────────────────────────────────────────────────

    runWorkflow(agentId: string, inputs: Record<string, any>): Observable<any> {
        return this.http.post(`${this.baseUrl}/workflow/${agentId}`, { inputs });
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
            'N-2': 'KYC/CDD Assessment',
            'N-3': 'Credit Risk',
            'N-4': 'Compliance Review',
            'N-5': 'Final Approval',
            'HITL_RM': 'Pending RM Action',
            'DONE': 'Completed',
        };
        return labels[nodeId] || nodeId;
    }
}
