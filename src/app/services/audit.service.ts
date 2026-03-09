import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditEntry {
    id: number;
    project_id: string;
    actor_name: string;
    actor_role: string;
    action_type: string;
    action_details: string;
    is_agent_action: boolean;
    agent_name: string | null;
    timestamp: string;
    confidence_score: number | null;
    reasoning: string | null;
    model_version: string | null;
    source_citations: any | null;
}

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private http = inject(HttpClient);
    private apiUrl = '/api/audit';

    /**
     * GET all audit log entries
     */
    getAll(): Observable<AuditEntry[]> {
        return this.http.get<AuditEntry[]>(this.apiUrl);
    }

    /**
     * GET audit log for a specific NPA
     */
    getByNpa(npaId: string): Observable<AuditEntry[]> {
        return this.http.get<AuditEntry[]>(`${this.apiUrl}/npas/${npaId}`);
    }
}
