import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DashboardKpi {
    label: string;
    value: number;
    displayValue: string;
    subValue?: string;
    trend?: string;
    trendUp?: boolean;
    icon: string;
}

export interface PipelineStage {
    stage: string;
    count: number;
    risk_count?: number;
}

export interface ClassificationMix {
    type?: string;
    label?: string;
    count: number;
    percentage?: number;
    color?: string;
}

export interface AgeingBucket {
    bucket: string;
    count: number;
}

export interface MarketCluster {
    id: number;
    cluster_name: string;
    npa_count: number;
    growth_percent: number;
    intensity_percent: number;
}

export interface Prospect {
    id: number;
    name: string;
    theme: string;
    probability: number;
    estimated_value: number;
    value_currency: string;
    status: string;
}

export interface RevenueNpa {
    id: string;
    title: string;
    estimated_revenue: number;
    product_manager: string | null;
    current_stage: string;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = '/api/dashboard';

    /**
     * GET Dashboard KPIs
     * API returns: [{ label, value (string like "$142.5M"), subValue, trend, trendUp, icon }]
     * We parse the display value to extract a numeric value for components that need numbers
     */
    getKpis(): Observable<DashboardKpi[]> {
        return this.http.get<any[]>(`${this.apiUrl}/kpis`).pipe(
            map(kpis => {
                if (!Array.isArray(kpis)) {
                    // Fallback for snapshot-style response
                    const s = (kpis as any).snapshot || kpis;
                    return [
                        { label: 'Pipeline Value', value: this.parseNumeric(s.pipeline_value), displayValue: s.pipeline_value, icon: 'trending-up' },
                        { label: 'Active NPAs', value: this.parseNumeric(s.active_npas), displayValue: '' + s.active_npas, icon: 'file-text' },
                        { label: 'Critical Risks', value: this.parseNumeric(s.critical_risks), displayValue: '' + s.critical_risks, icon: 'alert-triangle' },
                        { label: 'Avg Cycle Days', value: this.parseNumeric(s.avg_cycle_days), displayValue: '' + s.avg_cycle_days, icon: 'clock' },
                        { label: 'Approval Rate', value: this.parseNumeric(s.approval_rate), displayValue: '' + s.approval_rate, icon: 'check-circle-2' },
                    ];
                }
                return kpis.map(k => ({
                    label: k.label,
                    value: this.parseNumeric(k.value),
                    displayValue: k.value,
                    subValue: k.subValue,
                    trend: k.trend,
                    trendUp: k.trendUp,
                    icon: k.icon,
                }));
            })
        );
    }

    /**
     * GET Pipeline stage distribution
     */
    getPipeline(): Observable<PipelineStage[]> {
        return this.http.get<any[]>(`${this.apiUrl}/pipeline`).pipe(
            map(stages => stages.map(s => ({
                stage: s.stage,
                count: parseInt(s.count, 10) || 0,
                risk_count: parseInt(s.risk_count, 10) || 0,
            })))
        );
    }

    /**
     * GET Classification mix (donut chart data)
     */
    getClassificationMix(): Observable<ClassificationMix[]> {
        return this.http.get<ClassificationMix[]>(`${this.apiUrl}/classification-mix`);
    }

    /**
     * GET Ageing analysis
     * API returns { label, count (string) } → we normalize to { bucket, count (number) }
     */
    getAgeing(): Observable<AgeingBucket[]> {
        return this.http.get<any[]>(`${this.apiUrl}/ageing`).pipe(
            map(buckets => buckets.map(b => ({
                bucket: b.bucket || b.label || '',
                count: parseInt(b.count, 10) || 0,
            })))
        );
    }

    /**
     * GET Market clusters
     * API returns growth_percent, intensity_percent as strings → parse to numbers
     */
    getClusters(): Observable<MarketCluster[]> {
        return this.http.get<any[]>(`${this.apiUrl}/clusters`).pipe(
            map(clusters => clusters.map(c => ({
                id: c.id,
                cluster_name: c.cluster_name,
                npa_count: c.npa_count,
                growth_percent: parseFloat(c.growth_percent) || 0,
                intensity_percent: parseFloat(c.intensity_percent) || 0,
            })))
        );
    }

    /**
     * GET Prospects / Product opportunities
     * API returns probability, estimated_value as strings → parse to numbers
     */
    getProspects(): Observable<Prospect[]> {
        return this.http.get<any[]>(`${this.apiUrl}/prospects`).pipe(
            map(prospects => prospects.map(p => ({
                id: p.id,
                name: p.name,
                theme: p.theme,
                probability: parseFloat(p.probability) || 0,
                estimated_value: parseFloat(p.estimated_value) || 0,
                value_currency: p.value_currency || 'USD',
                status: p.status,
            })))
        );
    }

    /**
     * GET Top revenue NPAs
     * API returns estimated_revenue as string → parse to number
     */
    getRevenue(): Observable<RevenueNpa[]> {
        return this.http.get<any[]>(`${this.apiUrl}/revenue`).pipe(
            map(items => items.map(r => ({
                id: r.id,
                title: r.title,
                estimated_revenue: parseFloat(r.estimated_revenue) || 0,
                product_manager: r.product_manager,
                current_stage: r.current_stage,
                status: r.status,
            })))
        );
    }

    /**
     * GET Full NPA pool for COO dashboard
     */
    getNpaPool(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/npa-pool`);
    }

    /**
     * Parse a display string like "$142.5M", "94.00%", "32.00 Days", "3" into a number
     */
    private parseNumeric(val: any): number {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = String(val).replace(/[$,%]/g, '').replace(/M/gi, '').replace(/K/gi, '').replace(/Days/gi, '').trim();
        return parseFloat(str) || 0;
    }
}
