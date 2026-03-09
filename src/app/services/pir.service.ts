import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PirItem {
    id: string;
    title: string;
    npa_type: string;
    current_stage: string;
    status: string;
    pir_status: string;
    pir_due_date: string;
    launched_at: string;
    product_manager: string;
    days_until_due: number;
}

export interface PirDetail {
    project: any;
    conditions: any[];
    metrics: any[];
}

@Injectable({ providedIn: 'root' })
export class PirService {
    private http = inject(HttpClient);
    private apiUrl = '/api/pir';

    getPending(): Observable<PirItem[]> {
        return this.http.get<PirItem[]>(`${this.apiUrl}/pending`);
    }

    getDetail(npaId: string): Observable<PirDetail> {
        return this.http.get<PirDetail>(`${this.apiUrl}/${npaId}`);
    }

    submit(npaId: string, payload: { actor_name: string; findings: string; conditions_met?: any[] }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${npaId}/submit`, payload);
    }

    approve(npaId: string, payload: { actor_name: string; comments?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${npaId}/approve`, payload);
    }

    extend(npaId: string, payload: { actor_name: string; months: number; reason: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${npaId}/extend`, payload);
    }
}
