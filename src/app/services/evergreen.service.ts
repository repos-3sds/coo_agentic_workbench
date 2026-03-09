import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvergreenProduct {
    id: string;
    title: string;
    product_category: string;
    approved_limit: number;
    currency: string;
    current_stage: string;
    status: string;
    launched_at: string;
    volume_30d: number;
    last_metric_date: string;
    utilization_pct: number;
}

export interface UtilizationData {
    approved_limit: number;
    currency: string;
    period_days: number;
    metrics: Array<{
        total_volume: number;
        realized_pnl: number;
        var_utilization: number;
        health_status: string;
        snapshot_date: string;
    }>;
}

@Injectable({ providedIn: 'root' })
export class EvergreenService {
    private http = inject(HttpClient);
    private apiUrl = '/api/evergreen';

    getAll(): Observable<EvergreenProduct[]> {
        return this.http.get<EvergreenProduct[]>(this.apiUrl);
    }

    getUtilization(id: string, days = 30): Observable<UtilizationData> {
        return this.http.get<UtilizationData>(`${this.apiUrl}/${id}/utilization?days=${days}`);
    }

    recordUsage(id: string, payload: { volume: number; pnl?: number; counterparty_exposure?: number; var_utilization?: number }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/record-usage`, payload);
    }

    annualReview(id: string, payload: { actor_name: string; findings: string; approved: boolean; next_review_date?: string }): Observable<any> {
        return this.http.post(`${this.apiUrl}/${id}/annual-review`, payload);
    }
}
