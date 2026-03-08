import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EscalationService, Escalation } from '../../services/escalation.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-escalation-queue',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    template: `
    @if (loading()) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    } @else {
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <lucide-icon name="alert-triangle" class="w-6 h-6 text-rose-600"></lucide-icon>
            Escalation Queue
          </h1>
          <p class="text-sm text-slate-500 mt-1">Dispute resolution and escalated issues requiring COO attention.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-100">
            {{ escalations.length }} Active
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="flex-none bg-white border-b border-slate-200 px-8">
        <div class="flex gap-6">
          <button *ngFor="let tab of tabs" (click)="activeTab = tab.key"
                  class="px-1 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors"
                  [class.border-slate-900]="activeTab === tab.key" [class.text-slate-900]="activeTab === tab.key"
                  [class.border-transparent]="activeTab !== tab.key" [class.text-slate-500]="activeTab !== tab.key">
            {{ tab.label }}
            <span *ngIf="tab.count > 0" class="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  [ngClass]="tab.key === 'active' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-5xl mx-auto space-y-4">

          <div *ngFor="let esc of filteredEscalations" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-start gap-4">
                  <!-- Level Badge -->
                  <div class="flex-none w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold shadow-sm"
                       [ngClass]="{
                         'bg-rose-50 text-rose-600 border border-rose-200': esc.escalation_level >= 3,
                         'bg-amber-50 text-amber-600 border border-amber-200': esc.escalation_level === 2,
                         'bg-blue-50 text-blue-600 border border-blue-200': esc.escalation_level <= 1
                       }">
                    L{{ esc.escalation_level }}
                  </div>
                  <div>
                    <h3 class="text-lg font-bold text-slate-900 leading-tight">{{ esc.npa_title }}</h3>
                    <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span class="bg-slate-100 px-2 py-0.5 rounded font-mono">{{ esc.project_id }}</span>
                      <span>{{ esc.npa_type }}</span>
                      <span class="text-slate-300">|</span>
                      <span>Stage: {{ esc.current_stage }}</span>
                    </div>
                  </div>
                </div>

                <!-- Status -->
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                      [ngClass]="{
                        'bg-rose-50 text-rose-700 border-rose-200': esc.status === 'ACTIVE',
                        'bg-amber-50 text-amber-700 border-amber-200': esc.status === 'UNDER_REVIEW',
                        'bg-green-50 text-green-700 border-green-200': esc.status === 'RESOLVED'
                      }">
                  {{ esc.status.replace('_', ' ') }}
                </span>
              </div>

              <!-- Trigger Detail -->
              <div class="bg-slate-50 rounded-lg p-3 mb-4 border border-slate-100">
                <h4 class="text-xs font-bold text-slate-500 uppercase mb-1">Escalation Reason</h4>
                <p class="text-sm text-slate-700">{{ parseReason(esc.trigger_detail) }}</p>
              </div>

              <!-- Meta Row -->
              <div class="flex items-center justify-between text-xs text-slate-500">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1.5">
                    <lucide-icon name="user" class="w-3.5 h-3.5"></lucide-icon>
                    Escalated by: <strong class="text-slate-700">{{ esc.escalated_by }}</strong>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <lucide-icon name="arrow-up-right" class="w-3.5 h-3.5"></lucide-icon>
                    To: <strong class="text-slate-700">{{ esc.escalated_to }}</strong>
                  </span>
                  <span class="flex items-center gap-1.5">
                    <lucide-icon name="clock" class="w-3.5 h-3.5"></lucide-icon>
                    {{ timeAgo(esc.escalated_at) }}
                  </span>
                </div>

                <!-- ACTIONS -->
                <div class="flex items-center gap-2" *ngIf="esc.status !== 'RESOLVED'">
                  <button *ngIf="esc.status === 'ACTIVE'" (click)="markUnderReview(esc)"
                          class="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1.5">
                    <lucide-icon name="eye" class="w-3 h-3"></lucide-icon> Review
                  </button>
                  <button (click)="openResolveModal(esc)"
                          class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors flex items-center gap-1.5">
                    <lucide-icon name="check-circle" class="w-3 h-3"></lucide-icon> Resolve
                  </button>
                </div>
              </div>

              <!-- Resolution (if resolved) -->
              <div *ngIf="esc.status === 'RESOLVED' && esc.resolution_notes" class="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                <h4 class="text-xs font-bold text-green-700 uppercase mb-1">Resolution</h4>
                <p class="text-sm text-green-800">{{ esc.resolution_notes }}</p>
                <p class="text-[10px] text-green-600 mt-1">Resolved {{ timeAgo(esc.resolved_at!) }}</p>
              </div>
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div *ngIf="filteredEscalations.length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <lucide-icon name="check-circle" class="w-8 h-8 text-green-400"></lucide-icon>
            </div>
            <h3 class="text-lg font-medium text-slate-900">No {{ activeTab }} escalations</h3>
            <p class="text-slate-500 mt-2">All clear! No issues require attention right now.</p>
          </div>
        </div>
      </div>

      <!-- RESOLVE MODAL -->
      <div *ngIf="resolveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900">Resolve Escalation</h2>
            <button (click)="resolveModal = null" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Decision</label>
              <div class="flex gap-3">
                <button (click)="resolveDecision = 'PROCEED'" class="flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors"
                        [ngClass]="resolveDecision === 'PROCEED' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
                  Proceed with NPA
                </button>
                <button (click)="resolveDecision = 'REJECT'" class="flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors"
                        [ngClass]="resolveDecision === 'REJECT' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
                  Reject NPA
                </button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Resolution Notes</label>
              <textarea [(ngModel)]="resolveNotes" rows="3" placeholder="Enter resolution details..."
                        class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"></textarea>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
            <button (click)="resolveModal = null" class="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg border border-mbs-border">Cancel</button>
            <button (click)="submitResolve()" [disabled]="!resolveNotes || !resolveDecision"
                    class="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
    }
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class EscalationQueueComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    private escalationService = inject(EscalationService);
    private toast = inject(ToastService);

    loading = signal(true);

    escalations: Escalation[] = [];
    activeTab: 'active' | 'under_review' | 'resolved' = 'active';

    resolveModal: Escalation | null = null;
    resolveDecision: 'PROCEED' | 'REJECT' | null = null;
    resolveNotes = '';

    get tabs() {
        return [
            { key: 'active' as const, label: 'Active', count: this.escalations.filter(e => e.status === 'ACTIVE').length },
            { key: 'under_review' as const, label: 'Under Review', count: this.escalations.filter(e => e.status === 'UNDER_REVIEW').length },
            { key: 'resolved' as const, label: 'Resolved', count: 0 }
        ];
    }

    get filteredEscalations(): Escalation[] {
        const statusMap: Record<string, string> = { active: 'ACTIVE', under_review: 'UNDER_REVIEW', resolved: 'RESOLVED' };
        return this.escalations.filter(e => e.status === statusMap[this.activeTab]);
    }

    ngOnInit() {
        this.loadEscalations();
    }

    loadEscalations() {
        this.escalationService.getActive().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.escalations = data;
                this.loading.set(false);
            },
            error: (err) => {
                console.error('[ESCALATION] Load failed', err);
                this.loading.set(false);
            }
        });
    }

    parseReason(triggerDetail: string): string {
        try {
            const parsed = JSON.parse(triggerDetail);
            return parsed.reason || triggerDetail;
        } catch {
            return triggerDetail;
        }
    }

    markUnderReview(esc: Escalation) {
        this.escalationService.markUnderReview(esc.id, 'COO').subscribe({
            next: () => this.loadEscalations(),
            error: (err) => this.toast.error(err.error?.error || 'Failed to mark under review')
        });
    }

    openResolveModal(esc: Escalation) {
        this.resolveModal = esc;
        this.resolveDecision = null;
        this.resolveNotes = '';
    }

    submitResolve() {
        if (!this.resolveModal || !this.resolveNotes || !this.resolveDecision) return;
        this.escalationService.resolve(this.resolveModal.id, {
            actor_name: 'COO',
            resolution: this.resolveNotes,
            decision: this.resolveDecision
        }).subscribe({
            next: () => {
                this.resolveModal = null;
                this.loadEscalations();
            },
            error: (err) => this.toast.error(err.error?.error || 'Resolve failed')
        });
    }

    timeAgo(dateStr: string): string {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return hours + 'h ago';
        return Math.floor(hours / 24) + 'd ago';
    }
}
