import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-stage-progress',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="w-full px-4 space-y-8">
       <div *ngFor="let stage of stages; let i = index" class="relative pl-6">
          <!-- Connector Line -->
          <div *ngIf="i !== stages.length - 1" 
               class="absolute left-[35px] top-8 bottom-[-32px] w-0.5 bg-[#2e2e2e]"
               [ngClass]="{'bg-blue-600': i < currentStageIndex}"></div>

          <div class="flex items-start gap-4 group cursor-default">
             <!-- Status Icon -->
             <div class="relative z-10 flex-none w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-300"
                  [ngClass]="getStageClasses(i)">
                
                <lucide-icon *ngIf="i < currentStageIndex" name="check" class="w-4 h-4"></lucide-icon>
                <span *ngIf="i === currentStageIndex" class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span *ngIf="i > currentStageIndex" class="text-[10px] font-bold text-slate-600">{{i + 1}}</span>
             </div>

             <div class="pt-1">
                <h4 class="text-sm font-medium transition-colors"
                    [ngClass]="i === currentStageIndex ? 'text-white' : i < currentStageIndex ? 'text-slate-300' : 'text-slate-600'">
                    {{ stage.label }}
                </h4>
                <p class="text-[10px] text-slate-500 mt-0.5" *ngIf="stage.description">{{ stage.description }}</p>
                
                <!-- Agent vs Human Indicators -->
                <div class="flex items-center gap-2 mt-2" *ngIf="i === currentStageIndex">
                   <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px]">
                      <lucide-icon name="bot" class="w-3 h-3"></lucide-icon>
                      <span>{{ stage.agentCount || 0 }}</span>
                   </div>
                   <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px]">
                      <lucide-icon name="user" class="w-3 h-3"></lucide-icon>
                      <span>{{ stage.humanCount || 1 }}</span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  `
})
export class StageProgressComponent {
    @Input() stages: any[] = [];
    @Input() currentStageIndex: number = 0;

    getStageClasses(index: number): string {
        if (index < this.currentStageIndex) {
            return 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]';
        } else if (index === this.currentStageIndex) {
            return 'bg-[#0e0e0e] border-blue-500 text-white ring-2 ring-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.3)]';
        } else {
            return 'bg-[#0e0e0e] border-[#2e2e2e] text-slate-600';
        }
    }
}
