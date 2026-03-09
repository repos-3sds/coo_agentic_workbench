import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Citation {
    source_id?: string;
    source_type?: string;
    authority_tier?: number;
    version?: string;
    effective_date?: string;
    doc_section?: string;
}

@Component({
    selector: 'app-citation-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './citation-panel.component.html',
    styleUrls: ['./citation-panel.component.scss']
})
export class CitationPanelComponent {
    @Input() citations: Citation[] = [];
    isExpanded: boolean = false;

    toggleExpand(): void {
        this.isExpanded = !this.isExpanded;
    }

    getTierIcon(tier?: number): string {
        switch (tier) {
            case 1: return 'bi-shield-fill-check text-success';
            case 2: return 'bi-file-earmark-text text-primary';
            case 3: return 'bi-building text-info';
            case 4: return 'bi-globe text-warning';
            default: return 'bi-file-person text-secondary';
        }
    }

    getTierName(tier?: number): string {
        switch (tier) {
            case 1: return 'Tier 1 (System of Record)';
            case 2: return 'Tier 2 (Bank SOP)';
            case 3: return 'Tier 3 (Industry Standard)';
            case 4: return 'Tier 4 (External Official)';
            default: return 'Tier 5 (General Web)';
        }
    }
}
