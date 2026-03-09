import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { MonitoringResult } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-monitoring-alerts',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
        <div class="space-y-5" *ngIf="result">
            <!-- Product Health Banner -->
            <div
                class="flex items-center gap-3 rounded-xl px-5 py-4 border"
                [ngClass]="{
                    'bg-green-50 border-green-200 text-green-800': result.productHealth === 'HEALTHY',
                    'bg-amber-50 border-amber-200 text-amber-800': result.productHealth === 'WARNING',
                    'bg-red-50 border-red-200 text-red-800': result.productHealth === 'CRITICAL'
                }"
            >
                <lucide-icon
                    [name]="result.productHealth === 'HEALTHY' ? 'check-circle' : result.productHealth === 'WARNING' ? 'alert-triangle' : 'alert-circle'"
                    [size]="22"
                ></lucide-icon>
                <div>
                    <p class="font-semibold text-sm">Product Health: {{ result.productHealth }}</p>
                    <p class="text-xs opacity-80">{{ result.metrics.length }} metrics tracked &middot; {{ result.breaches.length }} breach(es) detected</p>
                </div>
            </div>

            <!-- Breaches Section -->
            <div *ngIf="result.breaches.length > 0" class="space-y-3">
                <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <lucide-icon name="alert-triangle" [size]="16"></lucide-icon>
                    Breach Alerts
                </h3>

                <!-- CRITICAL breaches first -->
                <div
                    *ngFor="let breach of sortedBreaches"
                    class="rounded-lg border p-4 space-y-2"
                    [ngClass]="{
                        'border-red-300 bg-red-50/60': breach.severity === 'CRITICAL',
                        'border-amber-300 bg-amber-50/60': breach.severity === 'WARNING'
                    }"
                >
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-sm text-slate-800">{{ breach.metric }}</span>
                        <span
                            class="text-xs font-semibold px-2 py-0.5 rounded-full"
                            [ngClass]="{
                                'bg-red-100 text-red-700': breach.severity === 'CRITICAL',
                                'bg-amber-100 text-amber-700': breach.severity === 'WARNING'
                            }"
                        >
                            {{ breach.severity }}
                        </span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate-600">
                        <span>Threshold: <strong>{{ breach.threshold }}</strong></span>
                        <span>Actual: <strong>{{ breach.actual }}</strong></span>
                        <span class="flex items-center gap-1">
                            Trend:
                            <lucide-icon
                                [name]="breach.trend === 'worsening' ? 'trending-up' : breach.trend === 'improving' ? 'trending-down' : 'arrow-right'"
                                [size]="14"
                                [ngClass]="{
                                    'text-red-500': breach.trend === 'worsening',
                                    'text-green-500': breach.trend === 'improving',
                                    'text-slate-400': breach.trend === 'stable'
                                }"
                            ></lucide-icon>
                            {{ breach.trend }}
                        </span>
                    </div>
                    <p class="text-xs text-slate-500">First detected: {{ breach.firstDetected }}</p>
                </div>
            </div>

            <!-- Conditions Checklist -->
            <div *ngIf="result.conditions.length > 0" class="space-y-3">
                <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <lucide-icon name="list-checks" [size]="16"></lucide-icon>
                    Conditions
                </h3>
                <div class="overflow-hidden rounded-lg border border-slate-200">
                    <table class="w-full text-xs">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-3 py-2 text-left font-medium text-slate-500">Type</th>
                                <th class="px-3 py-2 text-left font-medium text-slate-500">Description</th>
                                <th class="px-3 py-2 text-left font-medium text-slate-500">Deadline</th>
                                <th class="px-3 py-2 text-center font-medium text-slate-500">Days Left</th>
                                <th class="px-3 py-2 text-center font-medium text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr *ngFor="let cond of result.conditions" class="hover:bg-slate-50/50">
                                <td class="px-3 py-2 font-medium text-slate-700">{{ cond.type }}</td>
                                <td class="px-3 py-2 text-slate-600">{{ cond.description }}</td>
                                <td class="px-3 py-2 text-slate-500">{{ cond.deadline }}</td>
                                <td class="px-3 py-2 text-center">
                                    <span
                                        class="inline-block px-2 py-0.5 rounded-full font-semibold"
                                        [ngClass]="{
                                            'bg-red-100 text-red-700': cond.daysRemaining <= 7,
                                            'bg-amber-100 text-amber-700': cond.daysRemaining > 7 && cond.daysRemaining <= 30,
                                            'bg-green-100 text-green-700': cond.daysRemaining > 30
                                        }"
                                    >
                                        {{ cond.daysRemaining }}d
                                    </span>
                                </td>
                                <td class="px-3 py-2 text-center text-slate-600">{{ cond.status }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- PIR Status -->
            <div class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div class="flex items-center gap-2 text-sm text-slate-700">
                    <lucide-icon name="clipboard-list" [size]="16" class="text-slate-500"></lucide-icon>
                    <span class="font-medium">PIR Status:</span>
                    <span>{{ result.pirStatus }}</span>
                </div>
                <span *ngIf="result.pirDueDate" class="text-xs text-slate-500 flex items-center gap-1">
                    <lucide-icon name="clock" [size]="12"></lucide-icon>
                    Due: {{ result.pirDueDate }}
                </span>
            </div>
        </div>
    `
})
export class MonitoringAlertsComponent {
    @Input() result!: MonitoringResult;

    get sortedBreaches() {
        if (!this.result?.breaches) return [];
        return [...this.result.breaches].sort((a, b) => {
            if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
            if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
            return 0;
        });
    }
}
