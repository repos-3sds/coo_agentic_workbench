import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DocCompletenessResult } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-doc-completeness',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
        <div class="space-y-5" *ngIf="result">
            <!-- Stage Gate Status Banner -->
            <div
                class="flex items-center gap-3 rounded-xl px-5 py-4 border"
                [ngClass]="{
                    'bg-green-50 border-green-200 text-green-800': result.stageGateStatus === 'CLEAR',
                    'bg-amber-50 border-amber-200 text-amber-800': result.stageGateStatus === 'WARNING',
                    'bg-red-50 border-red-200 text-red-800': result.stageGateStatus === 'BLOCKED'
                }"
            >
                <lucide-icon
                    [name]="result.stageGateStatus === 'CLEAR' ? 'check-circle' : result.stageGateStatus === 'WARNING' ? 'alert-triangle' : 'alert-circle'"
                    [size]="22"
                ></lucide-icon>
                <div>
                    <p class="font-semibold text-sm">Stage Gate: {{ result.stageGateStatus }}</p>
                    <p class="text-xs opacity-80">{{ result.totalPresent }}/{{ result.totalRequired }} documents present &middot; {{ result.totalValid }} valid</p>
                </div>
            </div>

            <!-- Completeness Progress Bar -->
            <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                    <span class="font-medium text-slate-700 flex items-center gap-1.5">
                        <lucide-icon name="file-check" [size]="15"></lucide-icon>
                        Document Completeness
                    </span>
                    <span class="font-semibold" [ngClass]="percentTextClass">{{ result.completenessPercent }}%</span>
                </div>
                <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                        class="h-full rounded-full transition-all duration-500 ease-out"
                        [ngClass]="progressBarClass"
                        [style.width.%]="result.completenessPercent"
                    ></div>
                </div>
            </div>

            <!-- Missing Documents -->
            <div *ngIf="result.missingDocs.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <lucide-icon name="file-search" [size]="13"></lucide-icon>
                    Missing Documents ({{ result.missingDocs.length }})
                </h4>
                <div class="space-y-1.5">
                    <div
                        *ngFor="let doc of result.missingDocs"
                        class="flex items-center justify-between rounded-lg border px-3 py-2.5"
                        [ngClass]="{
                            'border-red-200 bg-red-50/50': doc.priority === 'BLOCKING',
                            'border-amber-200 bg-amber-50/50': doc.priority === 'WARNING'
                        }"
                    >
                        <div class="flex items-center gap-2 min-w-0">
                            <lucide-icon
                                name="file"
                                [size]="14"
                                [ngClass]="{
                                    'text-red-400': doc.priority === 'BLOCKING',
                                    'text-amber-400': doc.priority === 'WARNING'
                                }"
                            ></lucide-icon>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-slate-700 truncate">{{ doc.docType }}</p>
                                <p class="text-xs text-slate-500">{{ doc.reason }}</p>
                            </div>
                        </div>
                        <span
                            class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                            [ngClass]="{
                                'bg-red-100 text-red-700': doc.priority === 'BLOCKING',
                                'bg-amber-100 text-amber-700': doc.priority === 'WARNING'
                            }"
                        >
                            {{ doc.priority }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Invalid Documents -->
            <div *ngIf="result.invalidDocs.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <lucide-icon name="alert-circle" [size]="13"></lucide-icon>
                    Invalid Documents ({{ result.invalidDocs.length }})
                </h4>
                <div class="space-y-1.5">
                    <div
                        *ngFor="let doc of result.invalidDocs"
                        class="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                    >
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-slate-700">{{ doc.docType }}</span>
                            <lucide-icon name="x-circle" [size]="14" class="text-red-400"></lucide-icon>
                        </div>
                        <p class="text-xs text-slate-500 mt-0.5">{{ doc.reason }}</p>
                        <p class="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <lucide-icon name="arrow-right" [size]="11"></lucide-icon>
                            {{ doc.action }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Conditional Rules -->
            <div *ngIf="result.conditionalRules.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <lucide-icon name="git-branch" [size]="13"></lucide-icon>
                    Conditional Rules Triggered ({{ result.conditionalRules.length }})
                </h4>
                <div class="overflow-hidden rounded-lg border border-slate-200">
                    <table class="w-full text-xs">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-3 py-2 text-left font-medium text-slate-500">Condition</th>
                                <th class="px-3 py-2 text-left font-medium text-slate-500">Required Doc</th>
                                <th class="px-3 py-2 text-center font-medium text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr *ngFor="let rule of result.conditionalRules" class="hover:bg-slate-50/50">
                                <td class="px-3 py-2 text-slate-600">{{ rule.condition }}</td>
                                <td class="px-3 py-2 font-medium text-slate-700">{{ rule.requiredDoc }}</td>
                                <td class="px-3 py-2 text-center">
                                    <span class="inline-flex items-center gap-1">
                                        <lucide-icon
                                            [name]="rule.status === 'present' ? 'check-circle' : 'circle'"
                                            [size]="12"
                                            [ngClass]="{
                                                'text-green-500': rule.status === 'present',
                                                'text-slate-300': rule.status !== 'present'
                                            }"
                                        ></lucide-icon>
                                        <span [ngClass]="{'text-green-600': rule.status === 'present', 'text-slate-500': rule.status !== 'present'}">
                                            {{ rule.status }}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Expiring Documents -->
            <div *ngIf="result.expiringDocs.length > 0" class="space-y-2">
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <lucide-icon name="clock" [size]="13"></lucide-icon>
                    Expiring Documents ({{ result.expiringDocs.length }})
                </h4>
                <div class="space-y-1.5">
                    <div
                        *ngFor="let doc of result.expiringDocs"
                        class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                    >
                        <div class="flex items-center gap-2 min-w-0">
                            <lucide-icon name="file-text" [size]="14" class="text-slate-400 shrink-0"></lucide-icon>
                            <div class="min-w-0">
                                <p class="text-sm font-medium text-slate-700 truncate">{{ doc.docType }}</p>
                                <p class="text-xs text-slate-500">Expires: {{ doc.expiryDate }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 shrink-0 ml-2">
                            <span
                                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                                [ngClass]="{
                                    'bg-red-100 text-red-700': doc.daysRemaining <= 7,
                                    'bg-amber-100 text-amber-700': doc.daysRemaining > 7 && doc.daysRemaining <= 30,
                                    'bg-green-100 text-green-700': doc.daysRemaining > 30
                                }"
                            >
                                {{ doc.daysRemaining }}d left
                            </span>
                            <span
                                class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
                                [ngClass]="{
                                    'bg-red-100 text-red-600': doc.alertLevel === 'CRITICAL' || doc.alertLevel === 'HIGH',
                                    'bg-amber-100 text-amber-600': doc.alertLevel === 'MEDIUM' || doc.alertLevel === 'WARNING',
                                    'bg-slate-100 text-slate-500': doc.alertLevel === 'LOW' || doc.alertLevel === 'INFO'
                                }"
                            >
                                {{ doc.alertLevel }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class DocCompletenessComponent {
    @Input() result!: DocCompletenessResult;

    get progressBarClass(): Record<string, boolean> {
        if (!this.result) return {};
        return {
            'bg-green-500': this.result.stageGateStatus === 'CLEAR',
            'bg-amber-500': this.result.stageGateStatus === 'WARNING',
            'bg-red-500': this.result.stageGateStatus === 'BLOCKED'
        };
    }

    get percentTextClass(): Record<string, boolean> {
        if (!this.result) return {};
        return {
            'text-green-600': this.result.stageGateStatus === 'CLEAR',
            'text-amber-600': this.result.stageGateStatus === 'WARNING',
            'text-red-600': this.result.stageGateStatus === 'BLOCKED'
        };
    }
}
