import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { MLPrediction } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-ml-prediction-result',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5" *ngIf="result">

      <!-- Top Row: Circular Gauge + Timeline + Bottleneck -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="grid grid-cols-3 gap-6">

          <!-- Circular Approval Gauge -->
          <div class="flex flex-col items-center">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Approval Likelihood
            </h4>
            <div class="relative w-28 h-28">
              <svg class="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <!-- Background circle -->
                <circle cx="50" cy="50" r="42" fill="none"
                        stroke="#e2e8f0" stroke-width="8" />
                <!-- Progress arc -->
                <circle cx="50" cy="50" r="42" fill="none"
                        [attr.stroke]="getGaugeColor(result.approvalLikelihood)"
                        stroke-width="8"
                        stroke-linecap="round"
                        [attr.stroke-dasharray]="getStrokeDasharray(result.approvalLikelihood)"
                        class="transition-all duration-1000" />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-bold"
                      [ngClass]="getGaugeTextClass(result.approvalLikelihood)">
                  {{ result.approvalLikelihood }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="flex flex-col items-center justify-center">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Estimated Timeline
            </h4>
            <div class="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
              <lucide-icon name="clock" class="w-5 h-5 text-blue-500"></lucide-icon>
              <span class="text-xl font-bold text-slate-800">{{ result.timelineDays }}</span>
              <span class="text-sm text-slate-500">days</span>
            </div>
          </div>

          <!-- Bottleneck Department -->
          <div class="flex flex-col items-center justify-center">
            <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Bottleneck Dept.
            </h4>
            <span class="px-4 py-2 rounded-lg text-sm font-bold"
                  [ngClass]="getBottleneckClass()">
              <lucide-icon name="alert-triangle" class="w-4 h-4 inline-block mr-1 -mt-0.5"></lucide-icon>
              {{ result.bottleneckDept }}
            </span>
          </div>

        </div>
      </div>

      <!-- Feature Importance Bar Chart (Top 5) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          <lucide-icon name="bar-chart-3" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Feature Importance (Top 5)
        </h4>
        <div class="space-y-3">
          <div *ngFor="let feature of topFeatures">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-slate-700">{{ feature.name }}</span>
                <span class="text-xs text-slate-400 font-mono">{{ feature.value }}</span>
              </div>
              <span class="text-xs font-bold text-slate-600">
                {{ (feature.importance * 100).toFixed(0) }}%
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                   [ngClass]="getFeatureBarColor(feature.importance)"
                   [style.width.%]="feature.importance * 100">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparison Insights -->
      <div *ngIf="result.comparisonInsights.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="lightbulb" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Comparison Insights
        </h4>
        <ul class="space-y-2">
          <li *ngFor="let insight of result.comparisonInsights"
              class="flex items-start gap-2 text-sm text-slate-600">
            <lucide-icon name="arrow-right" class="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0"></lucide-icon>
            {{ insight }}
          </li>
        </ul>
      </div>
    </div>
  `
})
export class MlPredictionResultComponent {
    @Input() result!: MLPrediction;

    get topFeatures() {
        if (!this.result?.features) return [];
        return [...this.result.features]
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 5);
    }

    getGaugeColor(pct: number): string {
        if (pct >= 70) return '#22c55e';
        if (pct >= 40) return '#f59e0b';
        return '#ef4444';
    }

    getGaugeTextClass(pct: number): string {
        if (pct >= 70) return 'text-green-600';
        if (pct >= 40) return 'text-amber-600';
        return 'text-red-600';
    }

    getStrokeDasharray(pct: number): string {
        const circumference = 2 * Math.PI * 42;
        const filled = (pct / 100) * circumference;
        return `${filled} ${circumference}`;
    }

    getBottleneckClass(): string {
        return 'bg-orange-100 text-orange-800 border border-orange-200';
    }

    getFeatureBarColor(importance: number): string {
        if (importance >= 0.7) return 'bg-indigo-500';
        if (importance >= 0.4) return 'bg-blue-400';
        return 'bg-slate-400';
    }
}
