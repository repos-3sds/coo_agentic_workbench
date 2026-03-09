import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Escalation {
    id: number;
    project_id: string;
    npa_title: string;
    npa_type: string;
    current_stage: string;
    npa_status: string;
    escalation_level: number;
    trigger_type: string;
    trigger_detail: string;
    escalated_to: string;
    escalated_by: string;
    status: 'ACTIVE' | 'UNDER_REVIEW' | 'RESOLVED';
    escalated_at: string;
    resolved_at: string | null;
    resolution_notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class EscalationService {
    private http = inject(HttpClient);
    private apiUrl = '/api/escalations';

    getActive(): Observable<Escalation[]> {
        return this.http.get<Escalation[]>(this.apiUrl);
    }

    getByNpa(npaId: string): Observable<Escalation[]> {
        return this.http.get<Escalation[]>(`${this.apiUrl}/npas/${npaId}`);
    }

    escalate(npaId: string, payload: { actor_name: string; reason: string; escalation_level?: number; escalate_to?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/npas/${npaId}/escalate`, payload);
    }

    resolve(escalationId: number, payload: { actor_name: string; resolution: string; decision?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/${escalationId}/resolve`, payload);
    }

    markUnderReview(escalationId: number, actorName: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${escalationId}/review`, { actor_name: actorName });
    }
}
