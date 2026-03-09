import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FieldLineage } from '../../../lib/npa-interfaces';

export interface LineageBadgeConfig {
   label: string;
   bgClass: string;
   textClass: string;
   dotClass: string;
}

const LINEAGE_MAP: Record<string, LineageBadgeConfig> = {
   AUTO: { label: 'Auto', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', dotClass: 'bg-emerald-400' },
   ADAPTED: { label: 'Adapted', bgClass: 'bg-amber-50', textClass: 'text-amber-700', dotClass: 'bg-amber-400' },
   MANUAL: { label: 'Manual', bgClass: 'bg-blue-50', textClass: 'text-blue-700', dotClass: 'bg-blue-400' }
};

const DEFAULT_BADGE: LineageBadgeConfig = {
   label: 'Unknown', bgClass: 'bg-slate-50', textClass: 'text-slate-600', dotClass: 'bg-slate-400'
};

@Component({
   selector: 'app-npa-lineage-badge',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './npa-lineage-badge.component.html'
})
export class NpaLineageBadgeComponent {
   @Input() lineage: FieldLineage = 'MANUAL';

   get badge(): LineageBadgeConfig {
      return LINEAGE_MAP[this.lineage] || DEFAULT_BADGE;
   }
}
