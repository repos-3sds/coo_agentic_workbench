import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface SubAgent {
  id: string;
  name: string;
  description: string;
  taskType: 'Ingest' | 'Analyze' | 'Decide' | 'Review' | 'Report' | 'Validate' | 'Monitor';
  state: 'idle' | 'running' | 'waiting' | 'escalated' | 'completed' | 'error';
  confidence: 'low' | 'medium' | 'high';
  version: string;
  lastUpdated: string;
  lastRun?: string;
  npaStage: 'discover' | 'review' | 'sign_off' | 'launch' | 'monitoring';
}

@Component({
  selector: 'app-sub-agent-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors p-4">
      
      <!-- Top Row: Title & Actions -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h4 class="font-medium text-foreground truncate">{{ subAgent.name }}</h4>
            <span [ngClass]="getTaskTypeClasses(subAgent.taskType)" 
                  class="px-2 py-0.5 text-xs font-medium rounded border">
              {{ subAgent.taskType }}
            </span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ subAgent.description }}</p>
        </div>
        
        <button class="h-8 w-8 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors">
          <lucide-icon name="more-horizontal" class="h-4 w-4 text-slate-500"></lucide-icon>
        </button>
      </div>

      <!-- Bottom Row: Status -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- State Badge -->
          <div [ngClass]="getStateClasses(subAgent.state)"
               class="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium">
             <lucide-icon [name]="getStateIcon(subAgent.state)" [class]="getIconAnimation(subAgent.state) + ' w-3.5 h-3.5'"></lucide-icon>
             {{ getStateLabel(subAgent.state) }}
          </div>

          <!-- Confidence -->
          <div class="flex items-center gap-1 text-xs">
            <span class="text-muted-foreground">Confidence:</span>
            <span [ngClass]="getConfidenceColor(subAgent.confidence)" class="font-medium">
              {{ subAgent.confidence | titlecase }}
            </span>
          </div>
        </div>

        <!-- Last Run -->
        <span *ngIf="subAgent.lastRun" class="text-xs text-muted-foreground">
          Last run: {{ subAgent.lastRun }}
        </span>
      </div>

      <!-- Version Info -->
      <div class="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
        <span>v{{ subAgent.version }}</span>
        <span>Updated: {{ subAgent.lastUpdated }}</span>
      </div>

    </div>
  `
})
export class SubAgentCardComponent {
  @Input({ required: true }) subAgent!: SubAgent;
  @Output() viewActivity = new EventEmitter<void>();

  getTaskTypeClasses(type: string): string {
    const config: Record<string, string> = {
      Ingest: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      Analyze: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      Decide: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      Review: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      Report: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      Validate: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      Monitor: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
    };
    return config[type] || 'bg-slate-100 text-slate-600 border-slate-200';
  }

  getStateClasses(state: string): string {
    const config: Record<string, string> = {
      idle: 'bg-muted/50 text-muted-foreground',
      running: 'bg-[hsl(var(--status-progress-bg))] text-[hsl(var(--status-progress))]',
      waiting: 'bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))]',
      escalated: 'bg-[hsl(var(--status-exception-bg))] text-[hsl(var(--status-exception))]',
      completed: 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]',
      error: 'bg-destructive/10 text-destructive'
    };
    return config[state] || '';
  }

  getStateLabel(state: string): string {
    const config: Record<string, string> = {
      idle: 'Idle',
      running: 'Running',
      waiting: 'Waiting for Input',
      escalated: 'Escalated',
      completed: 'Completed',
      error: 'Error'
    };
    return config[state] || state;
  }

  getStateIcon(state: string): string {
    const config: Record<string, string> = {
      idle: 'pause',
      running: 'loader-2',
      waiting: 'clock',
      escalated: 'alert-circle',
      completed: 'check-circle-2',
      error: 'alert-circle'
    };
    return config[state] || 'circle';
  }

  getIconAnimation(state: string): string {
    return state === 'running' ? 'animate-spin' : '';
  }

  getConfidenceColor(level: string): string {
    const config: Record<string, string> = {
      low: 'text-[hsl(var(--status-exception))]',
      medium: 'text-[hsl(var(--status-progress))]',
      high: 'text-[hsl(var(--status-completed))]'
    };
    return config[level] || '';
  }
}
