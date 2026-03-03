import { Component, Input, Output, EventEmitter, OnInit, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DceService } from '../../services/dce.service';
import { DceWorkflowResultComponent } from './dce-workflow-result.component';
import { AGENT_REGISTRY, AgentDefinition } from '../../lib/agent-interfaces';

@Component({
    selector: 'app-dce-agent-invoker',
    standalone: true,
    imports: [CommonModule, FormsModule, DceWorkflowResultComponent],
    template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/40 z-40" (click)="close.emit()"></div>

    <!-- Panel -->
    <div class="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div>
                <h2 class="text-lg font-bold text-slate-900">{{ agentDef?.name || agentId }}</h2>
                <p class="text-xs text-slate-500 mt-0.5">{{ agentDef?.description }}</p>
            </div>
            <button (click)="close.emit()"
                    class="p-2 rounded-lg hover:bg-slate-200 transition-colors text-slate-500">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-auto p-6 space-y-6">

            <!-- Input Form -->
            <div class="bg-slate-50 rounded-xl border border-slate-200 p-5">
                <h3 class="text-sm font-bold text-slate-700 mb-3">Workflow Input</h3>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500 mb-1">Case ID</label>
                        <input type="text"
                               [(ngModel)]="caseId"
                               placeholder="e.g. AO-2026-000101"
                               class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono"
                               [disabled]="executing">
                    </div>
                </div>

                <button (click)="runWorkflow()"
                        [disabled]="executing || !caseId.trim()"
                        class="mt-4 w-full px-4 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 active:bg-sky-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                    <ng-container *ngIf="!executing">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Run {{ agentId === 'DCE_SA1' ? 'SA-1 Intake & Triage' : agentId === 'DCE_SA2' ? 'SA-2 Document Collection' : agentId }}
                    </ng-container>
                    <ng-container *ngIf="executing">
                        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Executing...
                    </ng-container>
                </button>
            </div>

            <!-- Execution Progress -->
            <div *ngIf="executing" class="flex flex-col items-center py-8">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600 mb-4"></div>
                <div class="text-sm font-semibold text-slate-700">Running {{ agentDef?.name || agentId }}...</div>
                <div class="text-xs text-slate-400 mt-1">This may take up to a minute. The workflow is executing on Dify.</div>
                <div class="text-xs text-slate-400 mt-2 font-mono">Elapsed: {{ elapsedSeconds }}s</div>
            </div>

            <!-- Error -->
            <div *ngIf="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <div class="text-sm font-bold text-red-800">Workflow Failed</div>
                        <p class="text-xs text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
                <button (click)="runWorkflow()"
                        class="mt-3 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors">
                    Retry
                </button>
            </div>

            <!-- Result -->
            <div *ngIf="result && !executing">
                <h3 class="text-sm font-bold text-slate-700 mb-3">Result</h3>
                <app-dce-workflow-result
                    [agentId]="agentId"
                    [result]="result">
                </app-dce-workflow-result>
            </div>
        </div>
    </div>
    `,
})
export class DceAgentInvokerComponent implements OnInit, OnChanges {
    @Input() agentId: string = '';
    @Input() prefillCaseId: string = '';
    @Output() close = new EventEmitter<void>();
    @Output() completed = new EventEmitter<any>();

    private dceService = inject(DceService);

    agentDef: AgentDefinition | undefined;
    caseId: string = '';
    executing = false;
    error: string | null = null;
    result: any = null;
    elapsedSeconds = 0;
    private timerHandle: any = null;

    ngOnInit(): void {
        this.resolveAgent();
        if (this.prefillCaseId) {
            this.caseId = this.prefillCaseId;
        }
    }

    ngOnChanges(): void {
        this.resolveAgent();
        if (this.prefillCaseId && !this.caseId) {
            this.caseId = this.prefillCaseId;
        }
    }

    private resolveAgent(): void {
        this.agentDef = AGENT_REGISTRY.find(a => a.id === this.agentId);
    }

    runWorkflow(): void {
        if (!this.caseId.trim() || this.executing) return;

        this.executing = true;
        this.error = null;
        this.result = null;
        this.elapsedSeconds = 0;

        // Start elapsed timer
        this.timerHandle = setInterval(() => {
            this.elapsedSeconds++;
        }, 1000);

        this.dceService.runWorkflow(this.agentId, { case_id: this.caseId.trim() }).subscribe({
            next: (res) => {
                this.result = res;
                this.executing = false;
                this.stopTimer();
                this.completed.emit(res);
            },
            error: (err) => {
                this.error = err?.error?.message || err?.error?.detail || err?.message || 'An unexpected error occurred';
                this.executing = false;
                this.stopTimer();
            },
        });
    }

    private stopTimer(): void {
        if (this.timerHandle) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }
}
