import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ContextSource {
    source_id: string;
    source_type: string;
    authority_tier: number;
    trust_class: 'TRUSTED' | 'UNTRUSTED';
    domain: string;
    last_used: string;
    hit_count: number;
}

@Component({
    selector: 'app-context-sources-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-sources-tab.component.html',
    styleUrls: ['./context-sources-tab.component.scss']
})
export class ContextSourcesTabComponent implements OnInit {
    sources: ContextSource[] = [];
    groupedSources: { [tier: number]: ContextSource[] } = {};
    tiers: number[] = [];
    loading = true;
    error: string | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.http.get<ContextSource[]>('/api/context/sources').pipe(
            catchError(err => {
                this.error = 'Failed to load context sources: ' + err.message;
                return of([]);
            })
        ).subscribe(data => {
            this.sources = data;
            this.groupSources();
            this.loading = false;
        });
    }

    private groupSources(): void {
        this.groupedSources = {};
        this.sources.forEach(src => {
            const tier = src.authority_tier || 999;
            if (!this.groupedSources[tier]) {
                this.groupedSources[tier] = [];
            }
            this.groupedSources[tier].push(src);
        });

        // Sort tiers ascending (T1 at top)
        this.tiers = Object.keys(this.groupedSources)
            .map(k => Number(k))
            .sort((a, b) => a - b);
    }

    getTrustBadgeClass(trustClass: string): string {
        switch (trustClass) {
            case 'TRUSTED': return 'bg-success';
            case 'UNTRUSTED': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }

    getTierName(tier: number): string {
        switch (tier) {
            case 1: return 'Tier 1 (System of Record)';
            case 2: return 'Tier 2 (Bank SOP)';
            case 3: return 'Tier 3 (Industry Standard)';
            case 4: return 'Tier 4 (External Official)';
            case 5: return 'Tier 5 (General Web)';
            default: return `Tier ${tier} (Unknown)`;
        }
    }
}
