import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface AgentQualityScore {
    agent: string;
    grounding_score: number;
    claims_checked: number;
    grounded_claims: number;
    ungrounded_claims: number;
}

interface QualitySnapshot {
    grounding_score: number;
    claims_checked: number;
    grounded_claims: number;
    ungrounded_claims: number;
    per_agent_scores: AgentQualityScore[];
}

@Component({
    selector: 'app-context-quality-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-quality-tab.component.html',
    styleUrls: ['./context-quality-tab.component.scss']
})
export class ContextQualityTabComponent implements OnInit {
    quality: QualitySnapshot | null = null;
    loading = true;
    error: string | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadQuality();
    }

    refresh(): void {
        this.loadQuality();
    }

    get groundedPercent(): number {
        if (!this.quality || this.quality.claims_checked <= 0) {
            return 0;
        }
        return Math.round((this.quality.grounded_claims / this.quality.claims_checked) * 100);
    }

    trackByAgent(_index: number, item: AgentQualityScore): string {
        return item.agent;
    }

    private loadQuality(): void {
        this.loading = true;
        this.error = null;

        this.http.get<unknown>('/api/context/quality').subscribe({
            next: (response) => {
                this.quality = this.normalizeQuality(response);
                this.loading = false;
            },
            error: (err: { message?: string }) => {
                this.error = `Failed to load quality metrics: ${err?.message || 'Unknown error'}`;
                this.loading = false;
            }
        });
    }

    private normalizeQuality(rawResponse: unknown): QualitySnapshot {
        const raw = (rawResponse ?? {}) as Record<string, unknown>;
        const stats = ((raw.quality_stats ?? raw) as Record<string, unknown>);

        const grounded = Number(stats.grounded_claims ?? stats.claims_grounded ?? this.readNestedNumber(stats, ['claims', 'grounded']) ?? 0);
        const ungrounded = Number(stats.ungrounded_claims ?? stats.claims_ungrounded ?? this.readNestedNumber(stats, ['claims', 'ungrounded']) ?? 0);
        const checked = Number(stats.claims_checked ?? this.readNestedNumber(stats, ['claims', 'checked']) ?? grounded + ungrounded);

        return {
            grounding_score: Number(stats.grounding_score ?? stats.avg_grounding_score ?? stats.score ?? 0),
            claims_checked: checked,
            grounded_claims: grounded,
            ungrounded_claims: ungrounded,
            per_agent_scores: this.normalizeAgentScores(stats.per_agent_scores ?? stats.by_agent)
        };
    }

    private normalizeAgentScores(rawScores: unknown): AgentQualityScore[] {
        if (Array.isArray(rawScores)) {
            return rawScores.map(item => {
                const row = item as Record<string, unknown>;
                return {
                    agent: String(row.agent ?? row.agent_id ?? 'unknown-agent'),
                    grounding_score: Number(row.grounding_score ?? row.score ?? 0),
                    claims_checked: Number(row.claims_checked ?? 0),
                    grounded_claims: Number(row.grounded_claims ?? 0),
                    ungrounded_claims: Number(row.ungrounded_claims ?? 0)
                };
            });
        }

        if (rawScores && typeof rawScores === 'object') {
            return Object.entries(rawScores as Record<string, unknown>).map(([agent, value]) => ({
                agent,
                grounding_score: Number(value ?? 0),
                claims_checked: 0,
                grounded_claims: 0,
                ungrounded_claims: 0
            }));
        }

        return [];
    }

    private readNestedNumber(obj: Record<string, unknown>, path: string[]): number | null {
        let current: unknown = obj;

        for (const key of path) {
            if (!current || typeof current !== 'object' || !(key in (current as Record<string, unknown>))) {
                return null;
            }
            current = (current as Record<string, unknown>)[key];
        }

        const value = Number(current);
        return Number.isFinite(value) ? value : null;
    }
}
