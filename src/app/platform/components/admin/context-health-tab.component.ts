import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface CircuitBreakerState {
    adapter: string;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
}

export interface PipelineHealth {
    status: 'healthy' | 'degraded' | 'down' | 'unhealthy';
    requests_per_minute: number;
    latency_p50_ms: number;
    latency_p95_ms: number;
    circuit_breakers: CircuitBreakerState[];
    active_domains: string[];
}

@Component({
    selector: 'app-context-health-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-health-tab.component.html',
    styleUrls: ['./context-health-tab.component.scss']
})
export class ContextHealthTabComponent implements OnInit, OnDestroy {
    healthData: PipelineHealth | null = null;
    loading: boolean = true;
    error: string | null = null;

    private destroy$ = new Subject<void>();

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        // Auto-refresh every 30 seconds
        timer(0, 30000)
            .pipe(
                takeUntil(this.destroy$),
                switchMap(() => {
                    this.loading = !this.healthData; // show loading only on initial fetch
                    return this.http.get<PipelineHealth>('/api/context/health').pipe(
                        catchError(err => {
                            this.error = 'Failed to load pipeline health data: ' + err.message;
                            this.loading = false;
                            return of(null);
                        })
                    );
                })
            )
            .subscribe(data => {
                if (data) {
                    this.healthData = data;
                    this.error = null;
                }
                this.loading = false;
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'healthy': return 'bg-success';
            case 'degraded': return 'bg-warning text-dark';
            case 'down': return 'bg-danger';
            case 'unhealthy': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getBreakerClass(state: string): string {
        switch (state) {
            case 'CLOSED': return 'bg-success';
            case 'OPEN': return 'bg-danger';
            case 'HALF_OPEN': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }
}
