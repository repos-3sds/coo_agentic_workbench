import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface WorkflowStage {
    id: string;
    label: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';
    date?: Date;
    duration?: string;
    subTasks?: { label: string; status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'; assignee?: string }[];
}


@Component({
    selector: 'app-npa-workflow-visualizer',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="w-full">
      
      <!-- HORIZONTAL STEPPER (Macro View) -->
      <div class="relative flex items-center justify-between mb-12 px-4">
        <!-- Connecting Line -->
        <div class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full"></div>
        <div class="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-1000 ease-out -z-10 rounded-full" [style.width]="progressPercentage + '%'"></div>

        <!-- Steps -->
        <div *ngFor="let stage of stages; let i = index" class="relative flex flex-col items-center group cursor-default">
          
          <!-- Icon Circle -->
          <div class="w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-sm z-10"
               [ngClass]="getStageStyles(stage.status)">
              <lucide-icon [name]="getStageIcon(stage.id)" class="w-5 h-5"></lucide-icon>
          </div>

          <!-- Label -->
          <div class="absolute top-14 w-32 text-center transition-all duration-300"
               [ngClass]="stage.status === 'PENDING' ? 'opacity-50 grayscale' : 'opacity-100'">
            <p class="text-sm font-bold text-slate-900">{{ stage.label }}</p>
            <p *ngIf="stage.date" class="text-[10px] text-slate-500 mt-0.5 font-mono">{{ stage.date | date:'MMM d' }}</p>
            <p *ngIf="stage.status === 'IN_PROGRESS'" class="text-[10px] text-blue-600 font-bold uppercase tracking-wider animate-pulse mt-0.5">Active</p>
          </div>

        </div>
      </div>

      <!-- DETAILED SWIMLANES (Micro View for Active Stage) -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <!-- Header -->
          <div class="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div>
                  <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Current Phase: {{ currentStage?.label }}
                    <span *ngIf="currentStage?.status === 'IN_PROGRESS'" class="relative flex h-2.5 w-2.5 ml-1">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                    </span>
                  </h3>
                  <p class="text-sm text-slate-500 mt-1">
                    <ng-container *ngIf="targetCompletion">Target Completion: {{ targetCompletion | date:'mediumDate' }} • </ng-container>
                    <span *ngIf="blockerCount > 0" class="text-amber-600 font-semibold">{{ blockerCount }} Blocker{{ blockerCount > 1 ? 's' : '' }}</span>
                    <span *ngIf="blockerCount === 0" class="text-green-600 font-semibold">No Blockers</span>
                  </p>
              </div>
              <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-slate-500 uppercase">Progress</span>
                  <div class="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-green-500 rounded-full transition-all duration-500" [style.width]="velocityPercent + '%'"></div>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">{{ velocityPercent }}%</span>
              </div>
          </div>

          <!-- Task List -->
          <div class="divide-y divide-slate-100">
             <div *ngFor="let task of currentStage?.subTasks" class="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                 
                 <!-- Status Icon -->
                 <div class="flex-none pt-1">
                    <div *ngIf="task.status === 'COMPLETED'" class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <lucide-icon name="check" class="w-3.5 h-3.5"></lucide-icon>
                    </div>
                    <div *ngIf="task.status === 'IN_PROGRESS'" class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center animate-pulse">
                        <lucide-icon name="loader-2" class="w-3.5 h-3.5 animate-spin"></lucide-icon>
                    </div>
                     <div *ngIf="task.status === 'PENDING'" class="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <lucide-icon name="circle" class="w-3.5 h-3.5"></lucide-icon>
                    </div>
                 </div>

                 <!-- Content -->
                 <div class="flex-1">
                     <p class="text-sm font-medium text-slate-900" [class.line-through]="task.status === 'COMPLETED'" [class.text-slate-400]="task.status === 'COMPLETED'">{{ task.label }}</p>
                     <p *ngIf="task.assignee" class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <lucide-icon name="user" class="w-3 h-3"></lucide-icon> {{ task.assignee }}
                     </p>
                 </div>

                 <!-- Action -->
                 <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                     <button *ngIf="task.status !== 'COMPLETED'" class="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200">
                        View Details
                     </button>
                 </div>

             </div>
          </div>
          
          <!-- Footer -->
          <div *ngIf="stages.length > 0" class="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-center text-slate-500">
              {{ projectId ? 'NPA: ' + projectId : 'Workflow' }} • {{ stages.length }} Stages
          </div>

      </div>

    </div>
  `,
    styles: []
})
export class NpaWorkflowVisualizerComponent implements OnInit {
    @Input() stages: WorkflowStage[] = [];
    @Input() targetCompletion: Date | null = null;
    @Input() projectId: string = '';

    get currentStage() {
        return this.stages.find(s => s.status === 'IN_PROGRESS')
            || this.stages.filter(s => s.status === 'COMPLETED').pop(); // Last completed as fallback
    }

    get progressPercentage(): number {
        if (!this.stages.length) return 0;
        const idx = this.stages.findIndex(s => s.status === 'IN_PROGRESS');
        if (idx === -1) {
            // All completed or all pending
            const allDone = this.stages.every(s => s.status === 'COMPLETED');
            return allDone ? 100 : 0;
        }
        return (idx / (this.stages.length - 1)) * 100;
    }

    get blockerCount(): number {
        return this.stages.filter(s => s.status === 'BLOCKED').length;
    }

    get velocityPercent(): number {
        if (!this.stages.length) return 0;
        const completed = this.stages.filter(s => s.status === 'COMPLETED').length;
        return Math.round((completed / this.stages.length) * 100);
    }

    constructor() { }

    ngOnInit() { }

    getStageStyles(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-green-600 text-white border-green-600';
            case 'IN_PROGRESS': return 'bg-white text-blue-600 border-blue-600 shadow-blue-200 shadow-lg scale-110';
            case 'PENDING': return 'bg-white text-slate-300 border-slate-200';
            case 'BLOCKED': return 'bg-white text-red-500 border-red-500';
            default: return '';
        }
    }

    getStageIcon(id: string): string {
        switch (id) {
            case 'INITIATION': return 'play';
            case 'REVIEW': return 'users';
            case 'SIGN_OFF': return 'pen-tool';
            case 'LAUNCH': return 'rocket';
            case 'MONITORING': return 'activity';
            case 'ARCHIVE': return 'archive';
            default: return 'circle';
        }
    }

}
