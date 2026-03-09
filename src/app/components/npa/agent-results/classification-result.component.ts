import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { ClassificationResult } from '../../../lib/agent-interfaces';

@Component({
  selector: 'app-classification-result',
  standalone: true,
  imports: [CommonModule, SharedIconsModule],
  template: `
    <div class="space-y-5" *ngIf="result">

      <!-- Prohibited Hard Stop Banner -->
      <div *ngIf="result.prohibitedMatch?.matched"
           class="w-full bg-red-600 text-white rounded-lg p-4 flex items-center gap-3 shadow-lg animate-pulse">
        <lucide-icon name="shield-alert" class="w-6 h-6 flex-shrink-0"></lucide-icon>
        <div>
          <p class="font-bold text-lg">HARD STOP — Prohibited Product</p>
          <p class="text-sm text-red-100">
            Matched: {{ result.prohibitedMatch!.item }} (Layer: {{ result.prohibitedMatch!.layer }})
          </p>
        </div>
      </div>

      <!-- Header Row: Type Badge + Track Badge + Confidence -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <!-- Type Badge -->
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                  [ngClass]="getTypeBadgeClass(result.type)">
              <lucide-icon name="git-branch" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
              {{ result.type }}
            </span>
            <!-- Track Badge -->
            <span class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                  [ngClass]="getTrackBadgeClass(result.track)">
              <lucide-icon name="target" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
              {{ result.track }}
            </span>
          </div>

          <!-- Confidence -->
          <div class="flex items-center gap-2 text-sm">
            <lucide-icon name="gauge" class="w-4 h-4 text-slate-400"></lucide-icon>
            <span class="text-slate-500 font-medium">Confidence</span>
            <span class="font-bold text-lg"
                  [ngClass]="{
                    'text-green-600': result.overallConfidence >= 80,
                    'text-amber-600': result.overallConfidence >= 50 && result.overallConfidence < 80,
                    'text-red-600': result.overallConfidence < 50
                  }">
              {{ result.overallConfidence }}%
            </span>
          </div>
        </div>

        <!-- 7-Criteria Score Bars -->
        <div class="space-y-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Classification Criteria
          </h4>
          <div *ngFor="let score of result.scores" class="group">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-slate-700">{{ score.criterion }}</span>
              <span class="text-xs font-mono text-slate-500">
                {{ score.score }}/{{ score.maxScore }}
              </span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500"
                   [ngClass]="getScoreBarColor(score.score, score.maxScore)"
                   [style.width.%]="(score.score / score.maxScore) * 100">
              </div>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {{ score.reasoning }}
            </p>
          </div>
        </div>
      </div>

      <!-- Mandatory Sign-offs -->
      <div *ngIf="result.mandatorySignOffs.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          <lucide-icon name="clipboard-check" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
          Mandatory Sign-offs Required
        </h4>
        <div class="flex flex-wrap gap-2">
          <span *ngFor="let dept of result.mandatorySignOffs"
                class="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            {{ dept }}
          </span>
        </div>
      </div>

      <!-- Explainability: Summary + Triggers -->
      <div *ngIf="(result.analysisSummary && result.analysisSummary.length) || (result.ntgTriggers && result.ntgTriggers.length)"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <lucide-icon name="info" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
            Rationale
          </h4>
          <div *ngIf="result.workflowRunId" class="text-[11px] text-slate-400 font-mono">
            run: {{ result.workflowRunId }}
          </div>
        </div>

        <ul *ngIf="result.analysisSummary && result.analysisSummary.length" class="list-disc pl-5 space-y-1 text-sm text-slate-700">
          <li *ngFor="let line of result.analysisSummary">{{ line }}</li>
        </ul>

        <div *ngIf="result.ntgTriggers && result.ntgTriggers.length" class="mt-4">
          <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">NTG Triggers</div>
          <div class="space-y-1.5">
            <div *ngFor="let t of result.ntgTriggers" class="flex items-start justify-between gap-3 text-sm">
              <div class="text-slate-700">
                <span class="font-mono text-[11px] text-slate-400 mr-2">{{ t.id }}</span>
                <span class="font-medium">{{ t.name }}</span>
                <span *ngIf="t.reason" class="text-slate-500"> — {{ t.reason }}</span>
              </div>
              <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    [ngClass]="t.fired ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-50 text-slate-600 border border-slate-200'">
                {{ t.fired ? 'FIRED' : 'NO' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Agent Execution Trace -->
      <div *ngIf="result.traceSteps && result.traceSteps.length > 0"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
        <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span><lucide-icon name="git-commit" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon> Agent Trace</span>
          <span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-medium">{{ result.traceSteps.length }} steps</span>
        </h4>
        
        <div class="relative max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <div class="absolute top-2 bottom-2 left-[11px] w-px bg-slate-200"></div>
          
          <div class="space-y-4">
            <div *ngFor="let step of result.traceSteps; let last = last" class="relative z-10 flex gap-4">
              <!-- Step icon/dot -->
              <div class="flex-shrink-0 mt-1">
                <div class="w-6 h-6 rounded-full border-2 border-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm"
                     [ngClass]="step.data?.thought ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'">
                  <lucide-icon [name]="step.data?.thought ? 'brain-circuit' : 'wrench'" class="w-3 h-3"></lucide-icon>
                </div>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-lg p-3">
                <div class="flex items-center justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <span class="text-xs font-bold text-slate-700 truncate">
                      {{ (step.label || '').replace('claude-sonnet-4-5', 'Model') }}
                    </span>
                    <span *ngIf="step.data?.tool_name || step.data?.action || step.data?.action_name"
                          class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-700 border border-blue-200 truncate">
                      {{ step.data.tool_name || step.data.action || step.data.action_name }}
                    </span>
                  </div>
                  <span *ngIf="step.metadata?.elapsed_time" class="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {{ (step.metadata.elapsed_time) | number:'1.1-1' }}s
                  </span>
                </div>
                
                <!-- If it's a thought -->
                <div *ngIf="step.data?.thought" class="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {{ step.data.thought }}
                </div>
                
                <!-- Additional structured data to show instead of raw json -->
                <!-- Example: ideation_find_similar args -->
                <div *ngIf="!step.data?.thought && step.data?.action_input" class="mt-2 text-[11px] text-slate-500 font-mono leading-tight">
                  <div *ngFor="let key of getObjectKeys(step.data.action_input)">
                    <span class="text-slate-400">{{ key }}:</span> {{ step.data.action_input[key] | json }}
                  </div>
                </div>
                
                <!-- Tool output truncated -->
                <div *ngIf="step.data?.output || step.data?.observation" class="mt-2 text-xs font-mono text-slate-400 bg-slate-100 rounded p-2 overflow-hidden overflow-ellipsis line-clamp-3">
                  {{ (step.data.output || step.data.observation) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full classifier output (for audit/debug and during prompt migration to JSON-only) -->
      <div *ngIf="result.rawOutput"
           class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <lucide-icon name="file-text" class="w-3.5 h-3.5 inline-block mr-1 -mt-0.5"></lucide-icon>
            Full Output
          </h4>
          <button (click)="showFullOutput = !showFullOutput"
                  class="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 transition-colors">
            {{ showFullOutput ? 'Hide' : 'Show' }}
          </button>
        </div>
        <div *ngIf="showFullOutput" class="mt-3">
          <div class="text-xs text-slate-500 mb-2">
            If this output is narrative text, update the Dify workflow to return JSON-only so the UI can render structured scoring/summary automatically.
          </div>
          <pre class="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-[420px]">{{ result.rawOutput }}</pre>
        </div>
      </div>
    </div>
  `
})
export class ClassificationResultComponent {
  @Input() result!: ClassificationResult;
  showFullOutput = false;

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'NTG': return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Variation': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Existing': return 'bg-green-100 text-green-700 border border-green-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getTrackBadgeClass(track: string): string {
    switch (track) {
      case 'Full NPA': return 'bg-red-100 text-red-700 border border-red-200';
      case 'NPA Lite': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Evergreen': return 'bg-green-100 text-green-700 border border-green-200';
      case 'Prohibited': return 'bg-red-200 text-red-900 border border-red-300';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getScoreBarColor(score: number, maxScore: number): string {
    const pct = (score / maxScore) * 100;
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }

  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }
}
