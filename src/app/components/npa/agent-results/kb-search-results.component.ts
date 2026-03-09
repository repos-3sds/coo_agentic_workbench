import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { KBSearchResult } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-kb-search-results',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
        <div class="space-y-3" *ngIf="results && results.length > 0">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <lucide-icon name="search" [size]="16"></lucide-icon>
                    Knowledge Base Results
                </h3>
                <span class="text-xs text-slate-400">{{ results.length }} result(s)</span>
            </div>

            <div class="space-y-2">
                <div
                    *ngFor="let item of displayedResults; let i = index"
                    class="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <lucide-icon name="file-text" [size]="14" class="text-slate-400 shrink-0"></lucide-icon>
                                <span class="text-sm font-medium text-slate-800 truncate">{{ item.title }}</span>
                            </div>
                            <p class="text-xs text-slate-500 line-clamp-2 ml-[22px]">{{ truncateSnippet(item.snippet) }}</p>
                        </div>
                        <span
                            class="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                            [ngClass]="getSimilarityClass(item.similarity)"
                        >
                            {{ (item.similarity * 100).toFixed(0) }}%
                        </span>
                    </div>
                    <div class="flex items-center gap-3 mt-2 ml-[22px]">
                        <span class="text-xs text-slate-400 flex items-center gap-1">
                            <lucide-icon name="database" [size]="11"></lucide-icon>
                            {{ item.source }}
                        </span>
                        <span
                            *ngIf="item.docType"
                            class="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                        >
                            {{ item.docType }}
                        </span>
                    </div>
                </div>
            </div>

            <p *ngIf="results.length > 5" class="text-xs text-slate-400 text-center pt-1">
                Showing 5 of {{ results.length }} results
            </p>
        </div>

        <div *ngIf="!results || results.length === 0" class="text-center py-8 text-slate-400">
            <lucide-icon name="search" [size]="28" class="mx-auto mb-2 opacity-50"></lucide-icon>
            <p class="text-sm">No knowledge base results found</p>
        </div>
    `
})
export class KbSearchResultsComponent {
    @Input() results: KBSearchResult[] = [];

    get displayedResults(): KBSearchResult[] {
        return this.results ? this.results.slice(0, 5) : [];
    }

    truncateSnippet(snippet: string): string {
        if (!snippet) return '';
        return snippet.length > 180 ? snippet.substring(0, 180) + '...' : snippet;
    }

    getSimilarityClass(similarity: number): Record<string, boolean> {
        const pct = similarity * 100;
        return {
            'bg-green-100 text-green-700': pct >= 90,
            'bg-amber-100 text-amber-700': pct >= 70 && pct < 90,
            'bg-slate-100 text-slate-600': pct < 70
        };
    }
}
