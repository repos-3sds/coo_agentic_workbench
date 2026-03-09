import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface NpaListItem {
    id: string;
    display_id: string | null;
    title: string;
    description: string;
    npa_type: string;
    product_category: string;
    approval_track: string;
    current_stage: string;
    status: string;
    risk_level: string;
    notional_amount: number;
    currency: string;
    is_cross_border: boolean;
    submitted_by: string;
    product_manager: string;
    pm_team: string;
    created_at: string;
    updated_at: string;
    jurisdictions: string[];
    signoff_summary: { party: string; department: string; status: string; approver_name: string }[];
    active_breaches: number;
}

export interface NpaDetail extends NpaListItem {
    product_category: string;
    template_name: string;
    approval_track: string;
    predicted_approval_likelihood: number;
    predicted_timeline_days: number;
    predicted_bottleneck: string;
    classification_confidence: number;
    classification_method: string;
    kickoff_date: string;
    launched_at: string;
    pir_status: string;
    pir_due_date: string;
    form_sections: NpaFormSection[];
}

export interface NpaFormSection {
    section_id: string;
    title: string;
    description: string;
    order_index: number;
    fields: NpaFormField[];
}

export interface NpaFormField {
    field_id: string;
    field_key: string;
    label: string;
    field_type: string;
    is_required: boolean;
    tooltip: string;
    value: string | null;
    lineage: 'AUTO' | 'ADAPTED' | 'MANUAL' | null;
    confidence_score: number | null;
    options: { value: string; label: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class NpaService {
    private http = inject(HttpClient);
    private apiUrl = '/api/npas';

    /**
     * GET all NPAs with optional filters
     */
    getAll(filters?: { stage?: string; status?: string; type?: string }): Observable<NpaListItem[]> {
        const params: any = {};
        if (filters?.stage) params.stage = filters.stage;
        if (filters?.status) params.status = filters.status;
        if (filters?.type) params.type = filters.type;
        return this.http.get<NpaListItem[]>(this.apiUrl, { params });
    }

    /**
     * GET single NPA with full details
     */
    getById(id: string): Observable<NpaDetail> {
        return this.http.get<NpaDetail>(`${this.apiUrl}/${id}`);
    }

    /**
     * GET NPA form data organized by sections (for template editor)
     */
    getFormSections(id: string): Observable<NpaFormSection[]> {
        return this.http.get<any>(`${this.apiUrl}/${id}/form-sections`).pipe(
            map(res => Array.isArray(res) ? res : (res.sections || []))
        );
    }

    /**
     * CREATE new NPA
     */
    create(data: { title: string; description: string; npa_type?: string }): Observable<{ id: string; display_id?: string }> {
        return this.http.post<{ id: string; display_id?: string }>(this.apiUrl, data);
    }

    /**
     * UPDATE existing NPA (metadata + form data)
     */
    update(id: string, data: { title?: string; description?: string; npa_type?: string; stage?: string; status?: string; formData?: any[] }): Observable<{ id: string; status: string }> {
        return this.http.put<{ id: string; status: string }>(`${this.apiUrl}/${id}`, data);
    }
}
