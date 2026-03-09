import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SubAgent } from './sub-agent-card.component';

export type NPAStage = 'discover' | 'review' | 'sign_off' | 'launch' | 'monitoring';

export const npaStageConfig: Record<NPAStage, { label: string; description: string }> = {
  discover: { label: 'Discover', description: 'Ingestion & Triage' },
  review: { label: 'Review', description: 'Completeness Check' },
  sign_off: { label: 'Sign-Off', description: 'Approval Chains' },
  launch: { label: 'Launch', description: 'Pre-Go Live' },
  monitoring: { label: 'Monitoring', description: 'Post-Impl & Risk' }
};

@Component({
  selector: 'app-npa-process-tracker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="w-full py-4">
      <div class="flex items-center justify-between">
        <div *ngFor="let stage of stages; let i = index; let isLast = last" 
             class="flex items-center flex-1">
          
          <!-- Stage Node -->
          <div class="flex flex-col items-center">
            <div [ngClass]="getCircleClasses(stage)"
                 class="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-muted border-2 border-border text-muted-foreground">
              
              <ng-container [ngSwitch]="getStageStatus(stage)">
                <lucide-icon *ngSwitchCase="'completed'" name="check-circle-2" class="w-5 h-5"></lucide-icon>
                <lucide-icon *ngSwitchCase="'active'" name="loader-2" class="w-5 h-5 animate-spin"></lucide-icon>
                <span *ngSwitchDefault class="text-sm font-medium">{{ i + 1 }}</span>
              </ng-container>

            </div>
            
            <div class="mt-2 text-center">
              <p [ngClass]="getTextClasses(stage)" class="text-sm font-medium">
                {{ config[stage].label }}
              </p>
              <p class="text-xs text-muted-foreground mt-0.5 max-w-[120px] hidden lg:block">
                {{ config[stage].description }}
              </p>
            </div>
          </div>

          <!-- Connector Line -->
          <div *ngIf="!isLast" 
               [ngClass]="getLineClasses(stage)"
               class="flex-1 h-0.5 mx-2 mt-[-24px] bg-border transition-colors">
          </div>

        </div>
      </div>
    </div>
  `
})
export class NpaProcessTrackerComponent {
  @Input({ required: true }) subAgents: SubAgent[] = [];

  stages: NPAStage[] = ['discover', 'review', 'sign_off', 'launch', 'monitoring'];
  config = npaStageConfig;

  getStageStatus(stage: NPAStage): 'completed' | 'active' | 'pending' {
    const stageAgents = this.subAgents.filter(sa => sa.npaStage === stage);

    if (stageAgents.length === 0) return 'pending';

    const allCompleted = stageAgents.every(sa => sa.state === 'completed');
    const anyRunning = stageAgents.some(sa => sa.state === 'running' || sa.state === 'waiting');

    if (allCompleted) return 'completed';
    if (anyRunning) return 'active';

    // Check previous stages logic
    const stageIndex = this.stages.indexOf(stage);
    if (stageIndex > 0) {
      const previousStages = this.stages.slice(0, stageIndex);
      const previousCompleted = previousStages.every(ps => {
        const psAgents = this.subAgents.filter(sa => sa.npaStage === ps);
        return psAgents.length > 0 && psAgents.every(x => x.state === 'completed');
      });
      if (previousCompleted) return 'active';
    }

    return 'pending';
  }

  getCircleClasses(stage: NPAStage): string {
    const status = this.getStageStatus(stage);
    if (status === 'completed') return '!bg-[hsl(var(--status-completed))] !border-[hsl(var(--status-completed))] !text-white';
    if (status === 'active') return '!bg-[hsl(var(--status-progress))] !border-[hsl(var(--status-progress))] !text-white';
    return '';
  }

  getTextClasses(stage: NPAStage): string {
    const status = this.getStageStatus(stage);
    if (status === 'completed') return 'text-[hsl(var(--status-completed))]';
    if (status === 'active') return 'text-[hsl(var(--status-progress))]';
    return 'text-muted-foreground';
  }

  getLineClasses(stage: NPAStage): string {
    const status = this.getStageStatus(stage);
    if (status === 'completed') return '!bg-[hsl(var(--status-completed))]';
    return '';
  }
}
