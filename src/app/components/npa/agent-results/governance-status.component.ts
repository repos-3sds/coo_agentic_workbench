import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { GovernanceState } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-governance-status',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <div class="space-y-5" *ngIf="result">

      <!-- SLA Status Banner -->
      <div class="rounded-xl p-4 flex items-center gap-3"
           [ngClass]="getSlaStatusBannerClass(result.slaStatus)">
        <lucide-icon [name]="getSlaStatusIcon(result.slaStatus)"
                     class="w-5 h-5 flex-shrink-0">
        </lucide-icon>
        <div>
          <p class="font-bold text-sm">SLA Status: {{ getSlaStatusLabel(result.slaStatus) }}</p>
          <p class="text-xs opacity-80">
            {{ getSlaStatusDescription(result.slaStatus) }}
          </p>
        </div>
      </div>

      <!-- Sign-off Table -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 pt-5 pb-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <lucide-icon name="clipboard-check" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
            Department Sign-offs
          </h4>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-t border-b border-slate-100 bg-slate-50/50">
              <th class="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Department</th>
              <th class="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th class="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">Assignee</th>
              <th class="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase">SLA</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of result.signoffs"
                class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td class="px-5 py-3 font-medium text-slate-700">{{ item.department }}</td>
              <td class="px-5 py-3">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase"
                      [ngClass]="getStatusBadgeClass(item.status)">
                  <lucide-icon [name]="getStatusIcon(item.status)" class="w-3 h-3"></lucide-icon>
                  {{ formatStatus(item.status) }}
                </span>
              </td>
              <td class="px-5 py-3 text-slate-500">
                {{ item.assignee || '---' }}
              </td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full"
                        [ngClass]="{
                          'bg-green-500': !item.slaBreached,
                          'bg-red-500': item.slaBreached
                        }">
                  </span>
                  <span class="text-xs text-slate-500" *ngIf="item.slaDeadline">
                    {{ item.slaDeadline }}
                  </span>
                  <span class="text-xs text-slate-400" *ngIf="!item.slaDeadline">
                    N/A
                  </span>
                  <span *ngIf="item.slaBreached"
                        class="text-[10px] font-bold text-red-600 uppercase ml-1">
                    Breached
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loop-back Count & Circuit Breaker -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                 [ngClass]="{
                   'bg-slate-100 text-slate-500': result.loopBackCount < 2,
                   'bg-amber-100 text-amber-600': result.loopBackCount === 2,
                   'bg-red-100 text-red-600': result.loopBackCount >= 3
                 }">
              <lucide-icon name="rotate-ccw" class="w-5 h-5"></lucide-icon>
            </div>
            <div>
              <p class="text-sm font-semibold text-slate-700">Loop-back Count</p>
              <p class="text-xs text-slate-400">
                Threshold: {{ result.circuitBreakerThreshold }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-3xl font-bold"
                  [ngClass]="{
                    'text-slate-700': result.loopBackCount < 2,
                    'text-amber-600': result.loopBackCount === 2,
                    'text-red-600': result.loopBackCount >= 3
                  }">
              {{ result.loopBackCount }}
            </span>
            <span class="text-sm text-slate-400">/ {{ result.circuitBreakerThreshold }}</span>
          </div>
        </div>

        <!-- Circuit Breaker Warning -->
        <div *ngIf="result.circuitBreaker || result.loopBackCount >= 3"
             class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <lucide-icon name="alert-circle" class="w-5 h-5 text-red-500 flex-shrink-0"></lucide-icon>
          <div>
            <p class="text-sm font-bold text-red-700">Circuit Breaker Triggered</p>
            <p class="text-xs text-red-500">
              Loop-back limit reached ({{ result.loopBackCount }}/{{ result.circuitBreakerThreshold }}).
              Process requires escalation to proceed.
            </p>
          </div>
        </div>
      </div>

      <!-- Escalation Info -->
      <div *ngIf="result.escalation"
           class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-5">
        <div class="flex items-start gap-3">
          <lucide-icon name="arrow-up-right" class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0"></lucide-icon>
          <div>
            <h4 class="text-sm font-bold text-amber-800 mb-1">
              Escalation Level {{ result.escalation.level }}
            </h4>
            <p class="text-sm text-amber-700 mb-2">
              <span class="font-semibold">Escalated to:</span> {{ result.escalation.escalatedTo }}
            </p>
            <p class="text-xs text-amber-600">
              <span class="font-semibold">Reason:</span> {{ result.escalation.reason }}
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GovernanceStatusComponent {
    @Input() result!: GovernanceState;

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-700';
            case 'REJECTED': return 'bg-red-100 text-red-700';
            case 'REWORK': return 'bg-amber-100 text-amber-700';
            case 'PENDING':
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'APPROVED': return 'check-circle-2';
            case 'REJECTED': return 'x-circle';
            case 'REWORK': return 'rotate-ccw';
            case 'PENDING':
            default: return 'clock';
        }
    }

    formatStatus(status: string): string {
        switch (status) {
            case 'REWORK': return 'Rework';
            default: return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        }
    }

    getSlaStatusBannerClass(slaStatus: string): string {
        switch (slaStatus) {
            case 'on_track': return 'bg-green-50 text-green-800 border border-green-200';
            case 'at_risk': return 'bg-amber-50 text-amber-800 border border-amber-200';
            case 'breached': return 'bg-red-50 text-red-800 border border-red-200';
            default: return 'bg-slate-50 text-slate-800 border border-slate-200';
        }
    }

    getSlaStatusIcon(slaStatus: string): string {
        switch (slaStatus) {
            case 'on_track': return 'check-circle-2';
            case 'at_risk': return 'alert-triangle';
            case 'breached': return 'alert-circle';
            default: return 'clock';
        }
    }

    getSlaStatusLabel(slaStatus: string): string {
        switch (slaStatus) {
            case 'on_track': return 'On Track';
            case 'at_risk': return 'At Risk';
            case 'breached': return 'Breached';
            default: return 'Unknown';
        }
    }

    getSlaStatusDescription(slaStatus: string): string {
        switch (slaStatus) {
            case 'on_track': return 'All sign-offs are progressing within SLA deadlines.';
            case 'at_risk': return 'One or more sign-offs are approaching their SLA deadline.';
            case 'breached': return 'SLA deadlines have been exceeded. Immediate attention required.';
            default: return '';
        }
    }
}
