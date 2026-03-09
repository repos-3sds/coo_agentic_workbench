import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { DceHitlReviewTask, DceDecisionField } from '../../services/dce.service';

@Component({
    selector: 'app-dce-hitl-review-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedIconsModule],
    template: `
        <div class="rounded-xl border overflow-hidden"
             [ngClass]="getBannerBorderClass()">

            <!-- Status Banner -->
            <div class="px-5 py-3 flex items-center justify-between"
                 [ngClass]="getBannerBgClass()">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center"
                         [ngClass]="getBannerIconBgClass()">
                        <lucide-icon *ngIf="hitlTask?.status === 'DECIDED'" name="check-circle" [size]="16" class="text-white"></lucide-icon>
                        <lucide-icon *ngIf="hitlTask?.status === 'PENDING'" name="clock" [size]="16" class="text-white"></lucide-icon>
                        <lucide-icon *ngIf="hitlTask?.status === 'IN_REVIEW'" name="loader-2" [size]="16" class="text-white animate-spin"></lucide-icon>
                        <lucide-icon *ngIf="hitlTask?.status === 'EXPIRED'" name="alert-triangle" [size]="16" class="text-white"></lucide-icon>
                    </div>
                    <div>
                        <p class="text-sm font-bold" [ngClass]="getBannerTextClass()">
                            {{ getStatusLabel() }}
                        </p>
                        <p class="text-xs" [ngClass]="getBannerSubTextClass()">
                            {{ getGateLabel() }} &middot; {{ getPersonaLabel() }}
                        </p>
                    </div>
                </div>

                <!-- SLA indicator -->
                <div class="flex items-center gap-3">
                    <div *ngIf="hitlTask && hitlTask.status !== 'DECIDED'" class="text-right">
                        <p class="text-[10px] font-semibold uppercase tracking-wider"
                           [ngClass]="hitlTask.sla_breached ? 'text-red-600' : getBannerSubTextClass()">
                            {{ hitlTask.sla_breached ? 'SLA BREACHED' : 'SLA Remaining' }}
                        </p>
                        <p class="text-sm font-bold font-mono"
                           [ngClass]="hitlTask.sla_breached ? 'text-red-700' : getBannerTextClass()">
                            {{ getSlaRemaining() }}
                        </p>
                    </div>
                    <div *ngIf="hitlTask?.status === 'DECIDED'" class="text-right">
                        <p class="text-[10px] font-semibold uppercase tracking-wider text-green-600">Completed</p>
                        <p class="text-xs text-green-700">{{ formatDate(hitlTask?.decided_at) }}</p>
                    </div>
                </div>
            </div>

            <!-- Reviewer Card -->
            <div class="px-5 py-3 bg-white border-b flex items-center justify-between"
                 [ngClass]="getBannerBorderClass()">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                         [ngClass]="getAvatarClass()">
                        {{ getInitials(hitlTask?.assigned_name) }}
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-slate-900">{{ hitlTask?.assigned_name || 'Unassigned' }}</p>
                        <p class="text-xs text-slate-500">{{ hitlTask?.assigned_to_id || '—' }}</p>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          [ngClass]="getPersonaBadgeClass()">
                        {{ hitlTask?.assigned_persona || reviewType }}
                    </span>
                </div>

                <!-- SLA progress bar -->
                <div *ngIf="hitlTask && hitlTask.status !== 'DECIDED'" class="w-32">
                    <div class="w-full bg-slate-100 rounded-full h-1.5">
                        <div class="h-1.5 rounded-full transition-all duration-500"
                             [ngClass]="slaPercent > 80 ? 'bg-red-500' : slaPercent > 50 ? 'bg-amber-500' : 'bg-green-500'"
                             [style.width.%]="slaPercent"></div>
                    </div>
                    <p class="text-[9px] text-slate-400 mt-0.5 text-right">{{ slaPercent.toFixed(0) }}% elapsed</p>
                </div>
            </div>

            <!-- Action Buttons (only when PENDING or IN_PROGRESS) -->
            <div *ngIf="hitlTask && (hitlTask.status === 'PENDING' || hitlTask.status === 'IN_REVIEW')"
                 class="px-5 py-3 bg-slate-50 flex items-center gap-2 flex-wrap">
                <button (click)="showDecisionForm = !showDecisionForm"
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5">
                    <lucide-icon name="check" [size]="14"></lucide-icon>
                    Approve
                </button>
                <button (click)="onReject.emit(hitlTask)"
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5">
                    <lucide-icon name="x" [size]="14"></lucide-icon>
                    Reject
                </button>
                <button (click)="onClarify.emit(hitlTask)"
                    class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5">
                    <lucide-icon name="help-circle" [size]="14"></lucide-icon>
                    Clarify
                </button>
                <div class="flex-1"></div>
                <button (click)="onEscalate.emit(hitlTask)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center gap-1.5">
                    <lucide-icon name="arrow-up-right" [size]="14"></lucide-icon>
                    Escalate
                </button>
                <button (click)="onNudge.emit(hitlTask)"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center gap-1.5">
                    <lucide-icon name="bell" [size]="14"></lucide-icon>
                    Nudge
                </button>
            </div>

            <!-- Decision Form (slide down) -->
            <div *ngIf="showDecisionForm && decisionFields?.length"
                 class="px-5 py-4 bg-white border-t border-slate-200">
                <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {{ getDecisionFormTitle() }}
                </h4>
                <div class="grid grid-cols-2 gap-4">
                    <div *ngFor="let field of decisionFields" [ngClass]="field.type === 'textarea' ? 'col-span-2' : ''">
                        <label class="block text-xs font-medium text-slate-600 mb-1">
                            {{ field.label }}
                            <span *ngIf="field.required" class="text-red-500">*</span>
                        </label>

                        <!-- Text input -->
                        <input *ngIf="field.type === 'text' || field.type === 'number'"
                               [type]="field.type"
                               [(ngModel)]="field.value"
                               class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                               [placeholder]="field.label">

                        <!-- Textarea -->
                        <textarea *ngIf="field.type === 'textarea'"
                                  [(ngModel)]="field.value"
                                  rows="2"
                                  class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none"
                                  [placeholder]="field.label"></textarea>

                        <!-- Select -->
                        <select *ngIf="field.type === 'select'"
                                [(ngModel)]="field.value"
                                class="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white">
                            <option value="">Select...</option>
                            <option *ngFor="let opt of field.options" [value]="opt.value">{{ opt.label }}</option>
                        </select>

                        <!-- Checkbox -->
                        <div *ngIf="field.type === 'checkbox'" class="flex items-center gap-2 mt-1">
                            <input type="checkbox" [(ngModel)]="field.value"
                                   class="rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                            <span class="text-sm text-slate-600">{{ field.label }}</span>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 mt-4">
                    <button (click)="showDecisionForm = false"
                        class="px-4 py-1.5 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
                        Cancel
                    </button>
                    <button (click)="submitDecision()"
                        class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5">
                        <lucide-icon name="send" [size]="14"></lucide-icon>
                        Submit Decision
                    </button>
                </div>
            </div>
        </div>
    `,
})
export class DceHitlReviewPanelComponent implements OnInit, OnChanges {
    @Input() hitlTask: DceHitlReviewTask | null = null;
    @Input() reviewType: 'SIGNATURE' | 'KYC' | 'CREDIT' | 'CONFIG' = 'SIGNATURE';
    @Input() decisionFields: DceDecisionField[] = [];

    @Output() onApprove = new EventEmitter<{ task: DceHitlReviewTask; fields: Record<string, any> }>();
    @Output() onReject = new EventEmitter<DceHitlReviewTask>();
    @Output() onClarify = new EventEmitter<DceHitlReviewTask>();
    @Output() onEscalate = new EventEmitter<DceHitlReviewTask>();
    @Output() onNudge = new EventEmitter<DceHitlReviewTask>();

    showDecisionForm = false;
    slaPercent = 0;

    ngOnInit() { this.computeSlaPercent(); }
    ngOnChanges() { this.computeSlaPercent(); }

    private computeSlaPercent(): void {
        if (!this.hitlTask) { this.slaPercent = 0; return; }
        const created = new Date(this.hitlTask.created_at).getTime();
        const deadline = new Date(this.hitlTask.deadline).getTime();
        const now = Date.now();
        const total = deadline - created;
        if (total <= 0) { this.slaPercent = 100; return; }
        this.slaPercent = Math.round(Math.min(100, Math.max(0, ((now - created) / total) * 100)));
    }

    getStatusLabel(): string {
        if (!this.hitlTask) return 'No HITL Task';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'Review Completed';
            case 'PENDING': return 'Awaiting Review';
            case 'IN_REVIEW': return 'Review In Progress';
            case 'EXPIRED': return 'Expired';
            default: return this.hitlTask.status;
        }
    }

    getGateLabel(): string {
        if (!this.hitlTask) return '';
        const labels: Record<string, string> = {
            'N-2': 'Gate N-2 (Signature)',
            'N-3': 'Gate N-3 (KYC)',
            'N-4': 'Gate N-4 (Credit)',
            'N-5': 'Gate N-5 (Config)',
        };
        return labels[this.hitlTask.node_id] || `Gate ${this.hitlTask.node_id}`;
    }

    getPersonaLabel(): string {
        if (!this.hitlTask) return '';
        const labels: Record<string, string> = {
            'DESK_SUPPORT': 'Desk Support Officer',
            'RM': 'Relationship Manager',
            'CREDIT_TEAM': 'Credit Team',
            'TMO_STATIC': 'TMO Static Data',
        };
        return labels[this.hitlTask.assigned_persona] || this.hitlTask.assigned_persona;
    }

    getDecisionFormTitle(): string {
        const titles: Record<string, string> = {
            'SIGNATURE': 'Signature Verification Decision',
            'KYC': 'KYC/CDD RM Decision',
            'CREDIT': 'Credit Team Decision',
            'CONFIG': 'TMO Validation Confirmation',
        };
        return titles[this.reviewType] || 'Decision';
    }

    getBannerBgClass(): string {
        if (!this.hitlTask) return 'bg-slate-50';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'bg-green-50';
            case 'PENDING': return 'bg-amber-50';
            case 'IN_REVIEW': return 'bg-blue-50';
            case 'EXPIRED': return 'bg-red-50';
            default: return 'bg-slate-50';
        }
    }

    getBannerBorderClass(): string {
        if (!this.hitlTask) return 'border-slate-200';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'border-green-200';
            case 'PENDING': return 'border-amber-200';
            case 'IN_REVIEW': return 'border-blue-200';
            case 'EXPIRED': return 'border-red-200';
            default: return 'border-slate-200';
        }
    }

    getBannerIconBgClass(): string {
        if (!this.hitlTask) return 'bg-slate-400';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'bg-green-500';
            case 'PENDING': return 'bg-amber-500';
            case 'IN_REVIEW': return 'bg-blue-500';
            case 'EXPIRED': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    }

    getBannerTextClass(): string {
        if (!this.hitlTask) return 'text-slate-700';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'text-green-800';
            case 'PENDING': return 'text-amber-800';
            case 'IN_REVIEW': return 'text-blue-800';
            case 'EXPIRED': return 'text-red-800';
            default: return 'text-slate-700';
        }
    }

    getBannerSubTextClass(): string {
        if (!this.hitlTask) return 'text-slate-500';
        switch (this.hitlTask.status) {
            case 'DECIDED': return 'text-green-600';
            case 'PENDING': return 'text-amber-600';
            case 'IN_REVIEW': return 'text-blue-600';
            case 'EXPIRED': return 'text-red-600';
            default: return 'text-slate-500';
        }
    }

    getAvatarClass(): string {
        if (!this.hitlTask) return 'bg-slate-200 text-slate-600';
        switch (this.hitlTask.assigned_persona) {
            case 'DESK_SUPPORT': return 'bg-sky-100 text-sky-700';
            case 'RM': return 'bg-emerald-100 text-emerald-700';
            case 'CREDIT_TEAM': return 'bg-violet-100 text-violet-700';
            case 'TMO_STATIC': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-200 text-slate-600';
        }
    }

    getPersonaBadgeClass(): string {
        if (!this.hitlTask) return 'bg-slate-100 text-slate-600';
        switch (this.hitlTask.assigned_persona) {
            case 'DESK_SUPPORT': return 'bg-sky-100 text-sky-700';
            case 'RM': return 'bg-emerald-100 text-emerald-700';
            case 'CREDIT_TEAM': return 'bg-violet-100 text-violet-700';
            case 'TMO_STATIC': return 'bg-orange-100 text-orange-700';
            default: return 'bg-slate-100 text-slate-600';
        }
    }

    getInitials(name: string | null | undefined): string {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    getSlaRemaining(): string {
        if (!this.hitlTask) return '—';
        const deadline = new Date(this.hitlTask.deadline).getTime();
        const now = Date.now();
        const diff = deadline - now;
        if (diff <= 0) return 'Overdue';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }
        return `${hours}h ${minutes}m`;
    }

    formatDate(dateStr: string | null | undefined): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-SG', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }

    submitDecision(): void {
        if (!this.hitlTask) return;
        const fieldValues: Record<string, any> = {};
        for (const field of this.decisionFields) {
            fieldValues[field.key] = field.value;
        }
        this.onApprove.emit({ task: this.hitlTask, fields: fieldValues });
        this.showDecisionForm = false;
    }
}
