import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentDefinition } from '../../lib/agent-interfaces';

@Component({
    selector: 'app-dce-agent-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col h-full">
        <!-- Header: icon + name -->
        <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                 [ngClass]="agent.color">
                <!-- Inbox icon for SA-1, File-check icon for SA-2 -->
                <svg *ngIf="agent.icon === 'inbox'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <svg *ngIf="agent.icon === 'file-check'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <svg *ngIf="agent.icon !== 'inbox' && agent.icon !== 'file-check'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
            </div>
            <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-slate-900 leading-tight">{{ agent.name }}</h3>
                <div class="flex items-center gap-2 mt-1">
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
                        {{ agent.difyType }}
                    </span>
                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        Tier {{ agent.tier }}
                    </span>
                    <span class="w-2 h-2 rounded-full bg-green-500" title="Configured"></span>
                </div>
            </div>
        </div>

        <!-- Description -->
        <p class="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{{ agent.description }}</p>

        <!-- Run button -->
        <button (click)="invoke.emit(agent.id)"
                class="w-full px-4 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 active:bg-sky-800 transition-colors flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Run Agent
        </button>
    </div>
    `,
})
export class DceAgentCardComponent {
    @Input() agent!: AgentDefinition;
    @Output() invoke = new EventEmitter<string>();
}
