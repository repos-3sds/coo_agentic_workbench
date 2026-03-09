import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dce-workflow-result',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-4">

        <!-- Status Banner -->
        <div class="flex items-center gap-3 p-3 rounded-lg border"
             [ngClass]="{
                'bg-green-50 border-green-200': status === 'succeeded',
                'bg-red-50 border-red-200': status === 'failed',
                'bg-yellow-50 border-yellow-200': status !== 'succeeded' && status !== 'failed'
             }">
            <svg *ngIf="status === 'succeeded'" class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <svg *ngIf="status === 'failed'" class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
                <div class="text-sm font-bold"
                     [ngClass]="{ 'text-green-800': status === 'succeeded', 'text-red-800': status === 'failed', 'text-yellow-800': status !== 'succeeded' && status !== 'failed' }">
                    Workflow {{ status === 'succeeded' ? 'Completed Successfully' : status === 'failed' ? 'Failed' : status }}
                </div>
                <div class="text-xs text-slate-500" *ngIf="workflowRunId">Run ID: {{ workflowRunId }}</div>
            </div>
        </div>

        <!-- SA-1 Specific Result Cards -->
        <ng-container *ngIf="agentId === 'DCE_SA1' && outputs">

            <!-- Classification -->
            <div class="bg-white rounded-lg border border-slate-200 p-4" *ngIf="outputs['classification'] || outputs['account_type']">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Classification</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div *ngIf="getOutput('account_type')">
                        <div class="text-[10px] text-slate-400 uppercase">Account Type</div>
                        <div class="text-sm font-semibold text-slate-900">{{ getOutput('account_type') }}</div>
                    </div>
                    <div *ngIf="getOutput('confidence') || getOutput('account_type_confidence')">
                        <div class="text-[10px] text-slate-400 uppercase">Confidence</div>
                        <div class="text-sm font-bold text-blue-700">{{ formatConfidence(getOutput('confidence') || getOutput('account_type_confidence')) }}</div>
                    </div>
                    <div *ngIf="getOutput('entity_type') || getOutput('client_entity_type')">
                        <div class="text-[10px] text-slate-400 uppercase">Entity Type</div>
                        <div class="text-sm font-semibold text-slate-900">{{ getOutput('entity_type') || getOutput('client_entity_type') }}</div>
                    </div>
                    <div *ngIf="getOutput('jurisdiction')">
                        <div class="text-[10px] text-slate-400 uppercase">Jurisdiction</div>
                        <div class="text-sm font-semibold text-slate-900">{{ getOutput('jurisdiction') }}</div>
                    </div>
                </div>
            </div>

            <!-- Priority & Case -->
            <div class="bg-white rounded-lg border border-slate-200 p-4" *ngIf="getOutput('priority') || getOutput('case_id')">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Case Details</h4>
                <div class="grid grid-cols-2 gap-3">
                    <div *ngIf="getOutput('case_id')">
                        <div class="text-[10px] text-slate-400 uppercase">Case ID</div>
                        <div class="text-sm font-mono font-semibold text-indigo-700">{{ getOutput('case_id') }}</div>
                    </div>
                    <div *ngIf="getOutput('priority')">
                        <div class="text-[10px] text-slate-400 uppercase">Priority</div>
                        <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                              [ngClass]="{
                                'bg-red-100 text-red-700': getOutput('priority') === 'URGENT',
                                'bg-blue-100 text-blue-700': getOutput('priority') === 'STANDARD',
                                'bg-slate-100 text-slate-600': getOutput('priority') !== 'URGENT' && getOutput('priority') !== 'STANDARD'
                              }">
                            {{ getOutput('priority') }}
                        </span>
                    </div>
                    <div *ngIf="getOutput('sla_deadline')">
                        <div class="text-[10px] text-slate-400 uppercase">SLA Deadline</div>
                        <div class="text-sm text-slate-700">{{ getOutput('sla_deadline') }}</div>
                    </div>
                    <div *ngIf="getOutput('current_node') || getOutput('next_node')">
                        <div class="text-[10px] text-slate-400 uppercase">Next Node</div>
                        <div class="text-sm font-semibold text-slate-900">{{ getOutput('current_node') || getOutput('next_node') }}</div>
                    </div>
                </div>
            </div>

            <!-- Documents Staged -->
            <div class="bg-white rounded-lg border border-slate-200 p-4" *ngIf="getOutput('documents_staged') || getOutput('staged_count')">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Documents Staged</h4>
                <div class="text-lg font-bold text-slate-900">{{ getOutput('documents_staged') || getOutput('staged_count') }}</div>
            </div>

            <!-- RM Assignment -->
            <div class="bg-white rounded-lg border border-slate-200 p-4" *ngIf="getOutput('rm_name') || getOutput('rm_id')">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">RM Assignment</h4>
                <div class="text-sm font-semibold text-slate-900">{{ getOutput('rm_name') || getOutput('rm_id') }}</div>
                <div class="text-xs text-slate-500" *ngIf="getOutput('rm_email')">{{ getOutput('rm_email') }}</div>
                <div class="text-xs text-slate-400" *ngIf="getOutput('rm_branch')">{{ getOutput('rm_branch') }} &middot; {{ getOutput('rm_desk') }}</div>
            </div>
        </ng-container>

        <!-- SA-2 Specific Result Cards -->
        <ng-container *ngIf="agentId === 'DCE_SA2' && outputs">

            <!-- Completeness -->
            <div class="bg-white rounded-lg border border-slate-200 p-4" *ngIf="getOutput('coverage_pct') !== null">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Completeness Assessment</h4>
                <div class="mb-3">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-semibold text-slate-700">Coverage</span>
                        <span class="text-xl font-bold"
                              [ngClass]="{
                                'text-green-600': toNum(getOutput('coverage_pct')) >= 80,
                                'text-yellow-600': toNum(getOutput('coverage_pct')) >= 50 && toNum(getOutput('coverage_pct')) < 80,
                                'text-red-600': toNum(getOutput('coverage_pct')) < 50
                              }">
                            {{ toNum(getOutput('coverage_pct')).toFixed(1) }}%
                        </span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-3">
                        <div class="h-3 rounded-full transition-all"
                             [style.width.%]="toNum(getOutput('coverage_pct'))"
                             [ngClass]="{
                                'bg-green-500': toNum(getOutput('coverage_pct')) >= 80,
                                'bg-yellow-500': toNum(getOutput('coverage_pct')) >= 50 && toNum(getOutput('coverage_pct')) < 80,
                                'bg-red-500': toNum(getOutput('coverage_pct')) < 50
                             }"></div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div *ngIf="getOutput('matched_mandatory') !== null">
                        <div class="text-[10px] text-slate-400 uppercase">Mandatory</div>
                        <div class="text-sm font-bold text-slate-900">{{ getOutput('matched_mandatory') }} / {{ getOutput('total_mandatory') }}</div>
                    </div>
                    <div *ngIf="getOutput('matched_optional') !== null">
                        <div class="text-[10px] text-slate-400 uppercase">Optional</div>
                        <div class="text-sm font-bold text-slate-900">{{ getOutput('matched_optional') }} / {{ getOutput('total_optional') }}</div>
                    </div>
                    <div *ngIf="getOutput('sla_pct_consumed') !== null">
                        <div class="text-[10px] text-slate-400 uppercase">SLA Consumed</div>
                        <div class="text-sm font-bold"
                             [ngClass]="{
                                'text-green-600': toNum(getOutput('sla_pct_consumed')) < 50,
                                'text-yellow-600': toNum(getOutput('sla_pct_consumed')) >= 50 && toNum(getOutput('sla_pct_consumed')) < 80,
                                'text-red-600': toNum(getOutput('sla_pct_consumed')) >= 80
                             }">
                            {{ toNum(getOutput('sla_pct_consumed')).toFixed(1) }}%
                        </div>
                    </div>
                    <div *ngIf="getOutput('next_node')">
                        <div class="text-[10px] text-slate-400 uppercase">Next Node</div>
                        <div class="text-sm font-semibold text-slate-900">{{ getOutput('next_node') }}</div>
                    </div>
                </div>
            </div>

            <!-- Missing Mandatory -->
            <div class="bg-red-50 rounded-lg border border-red-200 p-4"
                 *ngIf="getMissingDocs().length > 0">
                <h4 class="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Missing Mandatory Documents</h4>
                <ul class="space-y-1">
                    <li *ngFor="let doc of getMissingDocs()" class="flex items-center gap-2 text-sm text-red-800">
                        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                        {{ doc }}
                    </li>
                </ul>
            </div>

            <!-- Chase Message -->
            <div class="bg-amber-50 rounded-lg border border-amber-200 p-4"
                 *ngIf="getOutput('rm_chase_message')">
                <h4 class="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">RM Chase Message</h4>
                <p class="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{{ getOutput('rm_chase_message') }}</p>
            </div>

            <!-- Decision Reasoning -->
            <div class="bg-slate-50 rounded-lg border border-slate-200 p-4"
                 *ngIf="getOutput('decision_reasoning')">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Decision Reasoning</h4>
                <p class="text-sm text-slate-700 leading-relaxed">{{ getOutput('decision_reasoning') }}</p>
            </div>
        </ng-container>

        <!-- Fallback: Raw JSON for unknown/generic outputs -->
        <div class="bg-white rounded-lg border border-slate-200 p-4"
             *ngIf="outputs && !hasKnownFields()">
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Output</h4>
            <pre class="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 overflow-auto max-h-96 whitespace-pre-wrap">{{ outputs | json }}</pre>
        </div>

        <!-- Metadata -->
        <div class="text-xs text-slate-400 flex items-center gap-4 pt-2 border-t border-slate-100"
             *ngIf="workflowRunId || taskId">
            <span *ngIf="workflowRunId">Run: <span class="font-mono">{{ workflowRunId | slice:0:12 }}...</span></span>
            <span *ngIf="taskId">Task: <span class="font-mono">{{ taskId | slice:0:12 }}...</span></span>
        </div>
    </div>
    `,
})
export class DceWorkflowResultComponent {
    @Input() agentId: string = '';
    @Input() result: any = null;

    get status(): string {
        return this.result?.data?.status || 'unknown';
    }

    get outputs(): Record<string, any> | null {
        return this.result?.data?.outputs || null;
    }

    get workflowRunId(): string {
        return this.result?.workflow_run_id || '';
    }

    get taskId(): string {
        return this.result?.task_id || '';
    }

    getOutput(key: string): any {
        if (!this.outputs) return null;
        // Check top-level outputs
        if (this.outputs[key] !== undefined) return this.outputs[key];
        // Check nested in metadata payload
        const payload = this.result?.metadata?.payload;
        if (payload && payload[key] !== undefined) return payload[key];
        return null;
    }

    getMissingDocs(): string[] {
        const missing = this.getOutput('missing_mandatory');
        if (Array.isArray(missing)) return missing;
        return [];
    }

    formatConfidence(val: any): string {
        if (val === null || val === undefined) return '-';
        const num = Number(val);
        if (num <= 1) return (num * 100).toFixed(1) + '%';
        return num.toFixed(1) + '%';
    }

    toNum(val: any): number {
        return Number(val) || 0;
    }

    hasKnownFields(): boolean {
        if (!this.outputs) return false;
        const sa1Keys = ['account_type', 'classification', 'priority', 'case_id', 'documents_staged', 'staged_count', 'rm_name', 'rm_id'];
        const sa2Keys = ['coverage_pct', 'matched_mandatory', 'total_mandatory', 'missing_mandatory', 'rm_chase_message', 'decision_reasoning', 'next_node'];
        const keys = this.agentId === 'DCE_SA1' ? sa1Keys : this.agentId === 'DCE_SA2' ? sa2Keys : [];
        return keys.some(k => this.outputs![k] !== undefined);
    }
}
