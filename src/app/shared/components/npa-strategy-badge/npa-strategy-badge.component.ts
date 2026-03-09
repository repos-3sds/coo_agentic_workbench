import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StrategyBadgeConfig {
   label: string;
   bgClass: string;
   textClass: string;
}

const STRATEGY_MAP: Record<string, StrategyBadgeConfig> = {
   RULE: { label: 'Rule', bgClass: 'bg-slate-100', textClass: 'text-slate-600' },
   COPY: { label: 'Copy', bgClass: 'bg-violet-50', textClass: 'text-violet-600' },
   LLM: { label: 'AI', bgClass: 'bg-sky-50', textClass: 'text-sky-600' },
   MANUAL: { label: 'Manual', bgClass: 'bg-orange-50', textClass: 'text-orange-600' }
};

const DEFAULT_BADGE: StrategyBadgeConfig = {
   label: 'Unknown', bgClass: 'bg-slate-50', textClass: 'text-slate-500'
};

@Component({
   selector: 'app-npa-strategy-badge',
   standalone: true,
   imports: [CommonModule],
   templateUrl: './npa-strategy-badge.component.html'
})
export class NpaStrategyBadgeComponent {
   @Input() strategy = '';

   get badge(): StrategyBadgeConfig {
      return STRATEGY_MAP[this.strategy] || { ...DEFAULT_BADGE, label: this.strategy };
   }
}
