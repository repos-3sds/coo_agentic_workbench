import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface ContextTraceStage {
    stage_name: string;
    duration_ms: number;
    tokens_in: number;
    tokens_out: number;
    items_in: number;
    items_out: number;
    decisions: string[];
}

interface ContextTrace {
    trace_id: string;
    agent: string;
    domain: string;
    duration_ms: number;
    stage_count: number;
    stages: ContextTraceStage[];
}

@Component({
    selector: 'app-context-traces-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-traces-tab.component.html',
    styleUrls: ['./context-traces-tab.component.scss']
})
export class ContextTracesTabComponent implements OnInit {
    traces: ContextTrace[] = [];
    expandedTraceId: string | null = null;
    loading = true;
    error: string | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadTraces();
    }

    refresh(): void {
        this.loadTraces();
    }

    toggleExpanded(traceId: string): void {
        this.expandedTraceId = this.expandedTraceId === traceId ? null : traceId;
    }

    isExpanded(traceId: string): boolean {
        return this.expandedTraceId === traceId;
    }

    trackByTraceId(_index: number, trace: ContextTrace): string {
        return trace.trace_id;
    }

    private loadTraces(): void {
        this.loading = true;
        this.error = null;

        this.http.get<unknown>('/api/context/traces').subscribe({
            next: (response) => {
                const rawList = this.extractTraceList(response);
                this.traces = rawList.map(item => this.normalizeTrace(item));
                this.loading = false;
            },
            error: (err: { message?: string }) => {
                this.error = `Failed to load context traces: ${err?.message || 'Unknown error'}`;
                this.loading = false;
            }
        });
    }

    private extractTraceList(response: unknown): Record<string, unknown>[] {
        if (Array.isArray(response)) {
            return response as Record<string, unknown>[];
        }

        const payload = response as { traces?: unknown } | null;
        if (payload && Array.isArray(payload.traces)) {
            return payload.traces as Record<string, unknown>[];
        }

        return [];
    }

    private normalizeTrace(raw: Record<string, unknown>): ContextTrace {
        const traceId = String(raw['trace_id'] ?? raw['id'] ?? 'unknown-trace');
        const stages = this.normalizeStages(raw['stages']);
        const explicitStageCount = Number(raw['stage_count'] ?? raw['stages_count'] ?? NaN);

        return {
            trace_id: traceId,
            agent: String(raw['agent'] ?? raw['agent_id'] ?? raw['archetype'] ?? 'unknown-agent'),
            domain: String(raw['domain'] ?? raw['domain_id'] ?? 'platform'),
            duration_ms: Number(raw['duration_ms'] ?? raw['total_duration_ms'] ?? 0),
            stage_count: Number.isFinite(explicitStageCount) ? explicitStageCount : stages.length,
            stages
        };
    }

    private normalizeStages(rawStages: unknown): ContextTraceStage[] {
        if (!Array.isArray(rawStages)) {
            return [];
        }

        return rawStages.map((stage) => {
            const item = stage as Record<string, unknown>;
            return {
                stage_name: String(item['stage_name'] ?? item['name'] ?? item['stage'] ?? 'UNKNOWN'),
                duration_ms: Number(item['duration_ms'] ?? 0),
                tokens_in: Number(item['tokens_in'] ?? 0),
                tokens_out: Number(item['tokens_out'] ?? 0),
                items_in: Number(item['items_in'] ?? 0),
                items_out: Number(item['items_out'] ?? 0),
                decisions: Array.isArray(item['decisions']) ? (item['decisions'] as unknown[]).map(String) : []
            };
        });
    }
}
