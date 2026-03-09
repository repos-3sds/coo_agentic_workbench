import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface BreachAlert {
    id: string;
    project_id: string;
    title: string;
    description: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    threshold_value: string;
    actual_value: string;
    escalated_to: string;
    sla_hours: number;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';
    triggered_at: string;
    resolved_at: string | null;
    npa_title?: string;
}

export interface LaunchedProduct {
    id: string;
    title: string;
    npa_type: string;
    launched_at: string;
    days_since_launch: number;
    total_volume: number;
    volume_currency: string;
    realized_pnl: number;
    active_breaches: number;
    counterparty_exposure: number;
    var_utilization: number;
    collateral_posted: number;
    next_review_date: string;
    health_status: 'healthy' | 'warning' | 'critical';
}

export interface MonitoringSummary {
    total_launched: number;
    healthy_count: number;
    warning_count: number;
    critical_count: number;
    open_breaches: number;
    total_volume: number;
}

@Injectable({
    providedIn: 'root'
})
export class MonitoringService {
    private http = inject(HttpClient);
    private apiUrl = '/api/monitoring';

    /**
     * GET all active breach alerts
     * API returns project_title → we map to npa_title for component compatibility
     */
    getBreaches(): Observable<BreachAlert[]> {
        return this.http.get<any[]>(`${this.apiUrl}/breaches`).pipe(
            map(breaches => breaches.map(b => ({
                ...b,
                npa_title: b.project_title || b.npa_title || 'Unknown Product'
            })))
        );
    }

    /**
     * GET all launched products with metrics
     * API returns product_category (not npa_type), currency (not volume_currency),
     * and numeric fields as strings — we normalize here
     */
    getProducts(): Observable<LaunchedProduct[]> {
        return this.http.get<any[]>(`${this.apiUrl}/products`).pipe(
            map(products => products.map(p => ({
                ...p,
                npa_type: p.product_category || p.npa_type || '',
                volume_currency: p.currency ? '$' : '$',
                total_volume: parseFloat(p.total_volume) || 0,
                realized_pnl: parseFloat(p.realized_pnl) || 0,
                counterparty_exposure: parseFloat(p.counterparty_exposure) || 0,
                var_utilization: parseFloat(p.var_utilization) || 0,
                collateral_posted: parseFloat(p.collateral_posted) || 0,
            })))
        );
    }

    /**
     * GET breaches for a specific NPA
     */
    getNpaBreaches(npaId: string): Observable<BreachAlert[]> {
        return this.http.get<BreachAlert[]>(`${this.apiUrl}/npas/${npaId}/breaches`);
    }

    /**
     * GET performance metrics for a specific NPA
     */
    getNpaMetrics(npaId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/npas/${npaId}/metrics`);
    }

    /**
     * GET aggregate monitoring summary KPIs
     * API returns camelCase (activeBreaches, launchedProducts) →
     * we normalize to snake_case for MonitoringSummary interface
     */
    getSummary(): Observable<MonitoringSummary> {
        return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
            map(s => ({
                total_launched: s.launchedProducts ?? s.total_launched ?? 0,
                healthy_count: s.healthyCount ?? s.healthy_count ?? 0,
                warning_count: s.warningCount ?? s.warning_count ?? 0,
                critical_count: s.openEscalations ?? s.critical_count ?? 0,
                open_breaches: s.activeBreaches ?? s.open_breaches ?? 0,
                total_volume: s.totalVolume ?? s.total_volume ?? 0,
            }))
        );
    }
}
