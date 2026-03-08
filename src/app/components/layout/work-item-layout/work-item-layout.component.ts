import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { StageProgressComponent } from '../../common/stage-progress/stage-progress.component';
import { AuditLogComponent } from '../../common/audit-log/audit-log.component';

@Component({
   selector: 'app-work-item-layout',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, StageProgressComponent, AuditLogComponent],
   template: `
    <div class="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <!-- Left Rail: Macro Lifecycle -->
      <aside class="w-64 border-r border-slate-200 bg-white flex flex-col items-center py-6 overflow-y-auto shrink-0 shadow-sm">
         <app-stage-progress [stages]="stages" [currentStageIndex]="currentStageIndex"></app-stage-progress>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col min-w-0 bg-white">
        <!-- Work Item Header -->
        <header class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
          <div class="flex items-center gap-4">
             <div class="flex flex-col">
                <div class="flex items-center gap-2">
                    <h1 class="text-lg font-bold text-slate-900 tracking-tight">{{ workItemId }}</h1>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-bold"
                          [ngClass]="getModeColor(mode)">
                        {{ mode }} MODE
                    </span>
                </div>
                <span class="text-xs text-slate-500">{{ title }}</span>
             </div>
          </div>

          <div class="flex items-center gap-3">
             <span class="text-xs text-slate-500 font-mono">Last updated: Just now</span>
             <button class="px-3 py-1.5 rounded-lg bg-mbs-primary hover:bg-mbs-primary-hover text-white text-xs font-semibold transition-colors shadow-sm">
                Save & Continue
             </button>
          </div>
        </header>

        <!-- Dynamic Content (Layer 1) & Agent Overlay (Layer 2) -->
        <div class="flex flex-1 overflow-hidden relative">
           <!-- Layer 1: Human Content (Forms/Docs) -->
           <div class="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <ng-content select="[layer1]"></ng-content>
           </div>

           <!-- Layer 2: Agent Task Panel (Collapsible/Fixed) -->
           <aside class="w-80 border-l border-slate-200 bg-slate-50 overflow-y-auto">
              <div class="p-4 border-b border-slate-200 flex items-center justify-between">
                 <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Agents</h3>
                 <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <div class="p-4 space-y-4">
                 <ng-content select="[layer2]"></ng-content>
              </div>
           </aside>
        </div>

        <!-- Layer 3: Audit Log (Bottom Drawer) -->
        <app-audit-log class="shrink-0 border-t border-slate-200"></app-audit-log>
      </main>
    </div>
  `,
   styles: [`
    :host {
        display: block;
        height: 100%;
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: #333;
      border-radius: 3px;
    }
  `]
})
export class WorkItemLayoutComponent {
   @Input() workItemId: string = '';
   @Input() title: string = '';
   @Input() mode: 'APPROVAL' | 'MONITORING' | 'RECURRING' | 'REPORTING' | 'EXCEPTION' = 'APPROVAL';
   @Input() stages: any[] = [];
   @Input() currentStageIndex: number = 0;

   getModeColor(mode: string): string {
      switch (mode) {
         case 'APPROVAL': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
         case 'MONITORING': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
         case 'EXCEPTION': return 'bg-red-500/20 text-red-400 border border-red-500/30';
         default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      }
   }
}
