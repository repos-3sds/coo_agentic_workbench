import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { RiskAssessment, RiskLayer, RiskDomainAssessment } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-risk-assessment-result',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5 relative" *ngIf="result">

      <!-- Hard Stop Overlay Banner -->
      <div *ngIf="result.hardStop"
           class="absolute inset-0 z-10 bg-red-600/95 rounded-xl flex flex-col items-center justify-center text-white p-8">
        <lucide-icon name="shield-alert" class="w-12 h-12 mb-3"></lucide-icon>
        <p class="text-2xl font-bold mb-2">HARD STOP</p>
        <p class="text-sm text-red-100 text-center max-w-md">
          {{ result.hardStopReason || 'This product has failed critical risk checks and cannot proceed.' }}
        </p>
      </div>

      <!-- Overall Risk Score + Rating -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <lucide-icon name="shield" class="w-4 h-4 text-slate-400"></lucide-icon>
            Overall Risk Score
          </h3>
          <div class="flex items-center gap-3">
            <span *ngIf="result.overallRating"
                  class="text-xs font-bold uppercase px-2.5 py-1 rounded-full"
                  [ngClass]="getRatingBadgeClass(result.overallRating)">
              {{ result.overallRating }}
            </span>
            <span class="text-2xl font-bold"
                  [ngClass]="{
                    'text-green-600': result.overallScore <= 30,
                    'text-amber-600': result.overallScore > 30 && result.overallScore <= 60,
                    'text-red-600': result.overallScore > 60
                  }">
              {{ result.overallScore }}/100
            </span>
          </div>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700"
               [ngClass]="{
                 'bg-green-500': result.overallScore <= 30,
                 'bg-amber-500': result.overallScore > 30 && result.overallScore <= 60,
                 'bg-red-500': result.overallScore > 60
               }"
               [style.width.%]="result.overallScore">
          </div>
        </div>
      </div>

      <!-- 5-Layer Risk Cascade -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Risk Cascade: Internal Policy &rarr; Regulatory &rarr; Sanctions &rarr; Dynamic &rarr; Finance &amp; Tax
        </h4>
        <div class="space-y-3">
          <div *ngFor="let layer of result.layers; let i = index">
            <div class="rounded-lg border overflow-hidden transition-all"
                 [ngClass]="getLayerBorderClass(layer.status)">
              <div class="flex items-center justify-between px-4 py-3 cursor-pointer"
                   [ngClass]="getLayerBgClass(layer.status)"
                   (click)="toggleLayer(i)">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-mono text-slate-400 w-4 text-center">{{ i + 1 }}</span>
                    <lucide-icon [name]="getStatusIcon(layer.status)"
                                 class="w-5 h-5"
                                 [ngClass]="getStatusIconColor(layer.status)">
                    </lucide-icon>
                  </div>
                  <span class="font-semibold text-sm text-slate-800">{{ layer.name }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                        [ngClass]="getStatusBadgeClass(layer.status)">
                    {{ layer.status }}
                  </span>
                  <lucide-icon [name]="expandedLayers[i] ? 'chevron-up' : 'chevron-down'"
                               class="w-4 h-4 text-slate-400">
                  </lucide-icon>
                </div>
              </div>
              <div *ngIf="expandedLayers[i]"
                   class="px-4 py-3 bg-white border-t border-slate-100">
                <p class="text-sm text-slate-600 mb-3">{{ layer.details }}</p>
                <div class="space-y-2">
                  <div *ngFor="let check of layer.checks"
                       class="flex items-center justify-between py-1.5 px-3 rounded-md"
                       [ngClass]="{
                         'bg-green-50': check.status === 'PASS',
                         'bg-red-50': check.status === 'FAIL',
                         'bg-amber-50': check.status === 'WARNING'
                       }">
                    <div class="flex items-center gap-2">
                      <lucide-icon [name]="getStatusIcon(check.status)"
                                   class="w-4 h-4"
                                   [ngClass]="getStatusIconColor(check.status)">
                      </lucide-icon>
                      <span class="text-sm font-medium text-slate-700">{{ check.name }}</span>
                    </div>
                    <span class="text-xs text-slate-500">{{ check.detail }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7-Domain Risk Assessment Grid -->
      <div *ngIf="result.domainAssessments?.length" class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          <lucide-icon name="layout-grid" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          7-Domain Risk Assessment
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div *ngFor="let domain of result.domainAssessments"
               class="rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow"
               [ngClass]="getDomainBorderClass(domain.rating)"
               (click)="toggleDomain(domain.domain)">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-slate-600 uppercase">{{ domain.domain }}</span>
              <span class="text-xs font-bold px-1.5 py-0.5 rounded"
                    [ngClass]="getRatingBadgeClass(domain.rating)">
                {{ domain.rating }}
              </span>
            </div>
            <div class="text-lg font-bold mb-1"
                 [ngClass]="getDomainScoreColor(domain.score)">
              {{ domain.score }}
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div class="h-full rounded-full transition-all"
                   [ngClass]="getDomainBarColor(domain.score)"
                   [style.width.%]="domain.score">
              </div>
            </div>
            <!-- Expanded details -->
            <div *ngIf="expandedDomains[domain.domain]" class="mt-3 pt-2 border-t border-slate-100">
              <div *ngIf="domain.keyFindings?.length" class="mb-2">
                <p class="text-[10px] font-semibold text-slate-400 uppercase mb-1">Findings</p>
                <ul class="space-y-0.5">
                  <li *ngFor="let f of domain.keyFindings" class="text-xs text-slate-600 flex items-start gap-1">
                    <span class="text-amber-500 mt-0.5">&#8226;</span> {{ f }}
                  </li>
                </ul>
              </div>
              <div *ngIf="domain.mitigants?.length">
                <p class="text-[10px] font-semibold text-slate-400 uppercase mb-1">Mitigants</p>
                <ul class="space-y-0.5">
                  <li *ngFor="let m of domain.mitigants" class="text-xs text-green-700 flex items-start gap-1">
                    <span class="text-green-500 mt-0.5">&#10003;</span> {{ m }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notional Flags -->
      <div *ngIf="result.notionalFlags && hasNotionalFlags"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="alert-circle" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Notional Threshold Flags
        </h4>
        <div class="flex flex-wrap gap-2">
          <span *ngIf="result.notionalFlags.finance_vp_required"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <lucide-icon name="user-check" class="w-3 h-3"></lucide-icon>
            Finance VP Required (&gt;$20M)
          </span>
          <span *ngIf="result.notionalFlags.cfo_required"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <lucide-icon name="user-check" class="w-3 h-3"></lucide-icon>
            CFO Required (&gt;$100M)
          </span>
          <span *ngIf="result.notionalFlags.roae_required"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <lucide-icon name="calculator" class="w-3 h-3"></lucide-icon>
            ROAE Analysis Required
          </span>
          <span *ngIf="result.notionalFlags.threshold_breached"
                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <lucide-icon name="trending-up" class="w-3 h-3"></lucide-icon>
            {{ result.notionalFlags.threshold_breached }}
          </span>
        </div>
      </div>

      <!-- PIR Requirements -->
      <div *ngIf="result.pirRequirements?.required"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="clipboard-check" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Post-Implementation Review (PIR)
        </h4>
        <div class="flex items-center gap-4 mb-2">
          <span class="text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {{ result.pirRequirements!.type || 'STANDARD' }}
          </span>
          <span *ngIf="result.pirRequirements!.deadline_months" class="text-sm text-slate-600">
            Deadline: {{ result.pirRequirements!.deadline_months }} months post-launch
          </span>
        </div>
        <ul *ngIf="result.pirRequirements!.conditions?.length" class="space-y-1 mt-2">
          <li *ngFor="let c of result.pirRequirements!.conditions" class="text-xs text-slate-600 flex items-start gap-1.5">
            <lucide-icon name="chevron-right" class="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0"></lucide-icon>
            {{ c }}
          </li>
        </ul>
      </div>

      <!-- Circuit Breaker -->
      <div *ngIf="result.circuitBreaker?.triggered"
           class="bg-red-50 rounded-xl border border-red-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">
          <lucide-icon name="zap-off" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Circuit Breaker TRIGGERED
        </h4>
        <div class="text-sm text-red-800">
          Loop-back count: <span class="font-bold">{{ result.circuitBreaker!.loop_back_count }}</span>
          / {{ result.circuitBreaker!.threshold || 3 }}
        </div>
        <div *ngIf="result.circuitBreaker!.escalation_target" class="text-sm text-red-700 mt-1">
          Auto-escalated to: <span class="font-semibold">{{ result.circuitBreaker!.escalation_target }}</span>
        </div>
      </div>

      <!-- Evergreen Limits -->
      <div *ngIf="result.evergreenLimits"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="refresh-cw" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Evergreen Eligibility
        </h4>
        <div class="flex items-center gap-3 mb-2">
          <span class="text-xs font-bold uppercase px-2 py-0.5 rounded-full"
                [ngClass]="result.evergreenLimits.eligible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'">
            {{ result.evergreenLimits.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE' }}
          </span>
        </div>
        <div *ngIf="result.evergreenLimits.eligible" class="grid grid-cols-2 gap-3 text-sm text-slate-600">
          <div *ngIf="result.evergreenLimits.notional_remaining !== undefined">
            Notional Remaining: <span class="font-semibold">{{ (result.evergreenLimits.notional_remaining || 0) | number }}M</span>
          </div>
          <div *ngIf="result.evergreenLimits.deal_count_remaining !== undefined">
            Deals Remaining: <span class="font-semibold">{{ result.evergreenLimits.deal_count_remaining }}</span>
          </div>
        </div>
        <div *ngIf="result.evergreenLimits.flags?.length" class="mt-2 flex flex-wrap gap-1">
          <span *ngFor="let f of result.evergreenLimits.flags"
                class="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            {{ f }}
          </span>
        </div>
      </div>

      <!-- Mandatory Sign-Offs -->
      <div *ngIf="result.mandatorySignoffs?.length"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="users" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Mandatory Sign-Offs ({{ result.mandatorySignoffs!.length }})
        </h4>
        <div class="flex flex-wrap gap-2">
          <span *ngFor="let party of result.mandatorySignoffs"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
            <lucide-icon name="circle-dot" class="w-3 h-3 text-slate-400"></lucide-icon>
            {{ party }}
          </span>
        </div>
      </div>

      <!-- Prerequisites Checklist -->
      <div *ngIf="result.prerequisites && result.prerequisites.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="list-checks" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Prerequisites
        </h4>
        <div class="space-y-2">
          <div *ngFor="let prereq of result.prerequisites"
               class="flex items-center gap-3 py-1.5">
            <lucide-icon [name]="prereq.status === 'PASS' ? 'check-circle-2' : 'x-circle'"
                         class="w-4 h-4"
                         [ngClass]="{
                           'text-green-500': prereq.status === 'PASS',
                           'text-red-500': prereq.status === 'FAIL'
                         }">
            </lucide-icon>
            <span class="text-sm text-slate-700">{{ prereq.name }}</span>
            <span class="text-xs text-slate-400 ml-auto px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
              {{ prereq.category }}
            </span>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div *ngIf="result.recommendations?.length"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="lightbulb" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Recommendations
        </h4>
        <ul class="space-y-2">
          <li *ngFor="let rec of result.recommendations; let i = index"
              class="flex items-start gap-2 text-sm text-slate-700">
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">
              {{ i + 1 }}
            </span>
            {{ rec }}
          </li>
        </ul>
      </div>
    </div>
  `
})
export class RiskAssessmentResultComponent implements OnChanges {
    @Input() result!: RiskAssessment;

    expandedLayers: boolean[] = [];
    expandedDomains: Record<string, boolean> = {};

    ngOnChanges(): void {
        // Dynamically size expandedLayers to match the actual number of layers
        if (this.result?.layers) {
            this.expandedLayers = this.result.layers.map(() => false);
        }
    }

    get hasNotionalFlags(): boolean {
        if (!this.result?.notionalFlags) return false;
        const nf = this.result.notionalFlags;
        return !!(nf.finance_vp_required || nf.cfo_required || nf.roae_required || nf.threshold_breached);
    }

    toggleLayer(index: number): void {
        this.expandedLayers[index] = !this.expandedLayers[index];
    }

    toggleDomain(domain: string): void {
        this.expandedDomains[domain] = !this.expandedDomains[domain];
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'PASS': return 'check-circle-2';
            case 'FAIL': return 'x-circle';
            case 'WARNING': return 'alert-triangle';
            default: return 'circle';
        }
    }

    getStatusIconColor(status: string): string {
        switch (status) {
            case 'PASS': return 'text-green-500';
            case 'FAIL': return 'text-red-500';
            case 'WARNING': return 'text-amber-500';
            default: return 'text-slate-400';
        }
    }

    getLayerBorderClass(status: string): string {
        switch (status) {
            case 'PASS': return 'border-green-200';
            case 'FAIL': return 'border-red-200';
            case 'WARNING': return 'border-amber-200';
            default: return 'border-slate-200';
        }
    }

    getLayerBgClass(status: string): string {
        switch (status) {
            case 'PASS': return 'bg-green-50/50';
            case 'FAIL': return 'bg-red-50/50';
            case 'WARNING': return 'bg-amber-50/50';
            default: return 'bg-slate-50';
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'PASS': return 'bg-green-100 text-green-700';
            case 'FAIL': return 'bg-red-100 text-red-700';
            case 'WARNING': return 'bg-amber-100 text-amber-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    }

    getRatingBadgeClass(rating: string): string {
        switch (rating?.toUpperCase()) {
            case 'LOW': return 'bg-green-100 text-green-700';
            case 'MEDIUM': return 'bg-amber-100 text-amber-700';
            case 'HIGH': return 'bg-red-100 text-red-700';
            case 'CRITICAL': return 'bg-red-200 text-red-800';
            default: return 'bg-slate-100 text-slate-700';
        }
    }

    getDomainBorderClass(rating: string): string {
        switch (rating?.toUpperCase()) {
            case 'LOW': return 'border-green-200';
            case 'MEDIUM': return 'border-amber-200';
            case 'HIGH': return 'border-red-200';
            case 'CRITICAL': return 'border-red-300';
            default: return 'border-slate-200';
        }
    }

    getDomainScoreColor(score: number): string {
        if (score <= 30) return 'text-green-600';
        if (score <= 60) return 'text-amber-600';
        return 'text-red-600';
    }

    getDomainBarColor(score: number): string {
        if (score <= 30) return 'bg-green-500';
        if (score <= 60) return 'bg-amber-500';
        return 'bg-red-500';
    }
}
