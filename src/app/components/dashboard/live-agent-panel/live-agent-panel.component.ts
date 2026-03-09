import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface AgentStep {
    id: string;
    name: string;
    agent: string;
    status: 'queued' | 'in-progress' | 'completed' | 'exception';
    timestamp?: string;
    duration?: string;
    details?: string;
    dataSources?: string[];
}

export interface Workflow {
    id: string;
    title: string;
    function: string;
    desk: string;
    status: 'queued' | 'in-progress' | 'completed' | 'exception';
    assignedAgent: string;
    steps: AgentStep[];
    startTime: string;
    estimatedCompletion?: string;
}

@Component({
    selector: 'app-live-agent-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow h-full flex flex-col">
      <div class="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 class="font-semibold leading-none tracking-tight flex items-center gap-2">
          <lucide-icon name="activity" class="w-5 h-5 text-primary"></lucide-icon>
          Live Agent Orchestration
        </h3>
        <p class="text-sm text-muted-foreground">
          Real-time visualization of {{ workflow?.title }}
        </p>
      </div>
      
      <div class="p-6 pt-2 flex-grow overflow-auto">
        <div class="relative space-y-8 pl-2">
          <!-- Connector Line -->
          <div class="absolute left-6 top-4 bottom-4 w-px bg-border z-0"></div>

          <div *ngFor="let step of workflow?.steps; let i = index; let last = last" class="relative z-10 grid grid-cols-[auto,1fr] gap-4 items-start group">
             <!-- Status Dot -->
             <div class="mt-1 flex items-center justify-center w-8 h-8 rounded-full border bg-background transition-colors"
                  [ngClass]="getStatusColor(step.status)">
                <lucide-icon [name]="getStatusIcon(step.status)" class="w-4 h-4 text-foreground"></lucide-icon>
             </div>

             <!-- Content -->
             <div class="space-y-1.5 p-3 rounded-lg border bg-card/50 transition-all hover:bg-muted/50"
                  [class.border-primary]="step.status === 'in-progress'">
                <div class="flex items-center justify-between">
                   <h4 class="font-medium text-sm">{{ step.name }}</h4>
                   <span class="text-xs text-muted-foreground">{{ step.timestamp }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                   <lucide-icon name="bot" class="w-3 h-3"></lucide-icon>
                   {{ step.agent }}
                </div>
                <!-- Details & Animation for active step -->
                <div *ngIf="step.status === 'in-progress' || step.details" class="text-xs mt-2 bg-muted/30 p-2 rounded text-foreground/80">
                   {{ step.details }}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class LiveAgentPanelComponent {
    @Input() workflow?: Workflow;

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed': return 'border-green-500 bg-green-500 text-white';
            case 'in-progress': return 'border-blue-500 animate-pulse ring-4 ring-blue-500/20';
            case 'exception': return 'border-destructive bg-destructive text-white';
            default: return 'border-muted-foreground/30 text-muted-foreground';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'completed': return 'check';
            case 'in-progress': return 'loader-2'; // or refresh-cw
            case 'exception': return 'alert-triangle';
            default: return 'circle'; // or clock
        }
    }
}
