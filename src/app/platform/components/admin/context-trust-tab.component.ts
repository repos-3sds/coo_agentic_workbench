import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface TrustRule {
    source_pattern: string;
    trust_class: string;
    rationale: string;
}

interface TrustDecision {
    source_id: string;
    trust_class: string;
    domain: string;
    decided_at: string;
    reason: string;
}

interface ActiveScope {
    domain: string;
    fields: string[];
}

interface TrustPanelData {
    rules: TrustRule[];
    recent_decisions: TrustDecision[];
    active_domain_scoping: ActiveScope[];
}

@Component({
    selector: 'app-context-trust-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-trust-tab.component.html',
    styleUrls: ['./context-trust-tab.component.scss']
})
export class ContextTrustTabComponent implements OnInit {
    data: TrustPanelData = {
        rules: [],
        recent_decisions: [],
        active_domain_scoping: []
    };

    loading = true;
    error: string | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.loadTrustData();
    }

    refresh(): void {
        this.loadTrustData();
    }

    getTrustBadgeClass(trustClass: string): string {
        switch (trustClass) {
            case 'TRUSTED':
                return 'bg-success';
            case 'UNTRUSTED':
                return 'bg-warning text-dark';
            case 'NEVER':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    trackByRule(_index: number, rule: TrustRule): string {
        return `${rule.source_pattern}-${rule.trust_class}`;
    }

    trackByDecision(_index: number, item: TrustDecision): string {
        return `${item.source_id}-${item.decided_at}`;
    }

    trackByScope(_index: number, item: ActiveScope): string {
        return item.domain;
    }

    private loadTrustData(): void {
        this.loading = true;
        this.error = null;

        this.http.get<unknown>('/api/context/sources').subscribe({
            next: (response) => {
                this.data = this.normalizePayload(response);
                this.loading = false;
            },
            error: (err: { message?: string }) => {
                this.error = `Failed to load trust and source data: ${err?.message || 'Unknown error'}`;
                this.loading = false;
            }
        });
    }

    private normalizePayload(rawResponse: unknown): TrustPanelData {
        const raw = (rawResponse ?? {}) as Record<string, unknown>;

        // The API /api/context/sources returns { source_priority, trust_classification, domain_sources }
        // Map these actual API keys to the internal structure:
        //   source_priority / trust_classification → rules
        //   trust_classification → recent_decisions (fallback to raw.recent_decisions)
        //   domain_sources → active_domain_scoping
        return {
            rules: this.normalizeRules(raw.rules ?? raw.source_priority ?? raw.trust_classification),
            recent_decisions: this.normalizeDecisions(raw.recent_decisions ?? raw.trust_classification),
            active_domain_scoping: this.normalizeScopes(raw.active_domain_scoping ?? raw.domain_sources)
        };
    }

    private normalizeRules(rawRules: unknown): TrustRule[] {
        if (!Array.isArray(rawRules)) {
            return [];
        }

        return rawRules.map((item) => {
            const row = item as Record<string, unknown>;
            return {
                source_pattern: String(row.source_pattern ?? row.source_id ?? 'unknown_source'),
                trust_class: String(row.trust_class ?? 'UNTRUSTED'),
                rationale: String(row.rationale ?? row.treatment ?? 'No rationale provided')
            };
        });
    }

    private normalizeDecisions(rawDecisions: unknown): TrustDecision[] {
        if (!Array.isArray(rawDecisions)) {
            return [];
        }

        return rawDecisions.map((item) => {
            const row = item as Record<string, unknown>;
            return {
                source_id: String(row.source_id ?? row.source_pattern ?? 'unknown_source'),
                trust_class: String(row.trust_class ?? 'UNTRUSTED'),
                domain: String(row.domain ?? row.domain_id ?? 'platform'),
                decided_at: String(row.decided_at ?? row.fetched_at ?? ''),
                reason: String(row.reason ?? row.rationale ?? 'N/A')
            };
        });
    }

    private normalizeScopes(rawScopes: unknown): ActiveScope[] {
        if (Array.isArray(rawScopes)) {
            return rawScopes.map((item) => {
                if (typeof item === 'string') {
                    return { domain: item, fields: [] };
                }

                const row = item as Record<string, unknown>;
                return {
                    domain: String(row.domain ?? row.domain_id ?? 'unknown'),
                    fields: Array.isArray(row.fields) ? row.fields.map(String) : []
                };
            });
        }

        if (rawScopes && typeof rawScopes === 'object') {
            return Object.entries(rawScopes as Record<string, unknown>).map(([domain, fields]) => ({
                domain,
                fields: Array.isArray(fields) ? fields.map(String) : []
            }));
        }

        return [];
    }
}
