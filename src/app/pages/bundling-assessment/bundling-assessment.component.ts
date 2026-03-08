import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { BundlingService, BundlingAssessment } from '../../services/bundling.service';
import { NpaService } from '../../services/npa.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-bundling-assessment',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    template: `
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 shadow-sm">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <lucide-icon name="package" class="w-6 h-6 text-blue-600"></lucide-icon>
          Bundling Assessment
        </h1>
        <p class="text-sm text-slate-500 mt-1">Evaluate whether a new product can be bundled under an existing approved product.</p>
      </div>

      <!-- FORM -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-3xl mx-auto space-y-8">

          <!-- INPUT CARD -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <lucide-icon name="search" class="w-4 h-4 text-slate-400"></lucide-icon>
              Assess Bundling Eligibility
            </h2>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Child NPA (New Product)</label>
                <select [(ngModel)]="childId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">Select NPA...</option>
                  <option *ngFor="let n of npaList" [value]="n.id">{{ n.id }} - {{ n.title }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5">Parent NPA (Approved Product)</label>
                <select [(ngModel)]="parentId" class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">Select Parent...</option>
                  <option *ngFor="let n of approvedList" [value]="n.id">{{ n.id }} - {{ n.title }}</option>
                </select>
              </div>
            </div>

            <button (click)="runAssessment()" [disabled]="!childId || !parentId || loading"
                    class="px-6 py-2.5 bg-mbs-primary text-white rounded-lg text-sm font-semibold hover:bg-mbs-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <lucide-icon name="zap" class="w-4 h-4"></lucide-icon>
              {{ loading ? 'Evaluating...' : 'Run 8-Condition Assessment' }}
            </button>
          </div>

          <!-- RESULTS -->
          <div *ngIf="assessment" class="space-y-6">

            <!-- RECOMMENDATION -->
            <div class="rounded-xl border-2 p-6"
                 [ngClass]="{
                   'bg-green-50 border-green-300': assessment.recommended_track === 'BUNDLING',
                   'bg-amber-50 border-amber-300': assessment.recommended_track === 'NPA_LITE',
                   'bg-red-50 border-red-300': assessment.recommended_track === 'FULL_NPA'
                 }">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center"
                     [ngClass]="{
                       'bg-green-100 text-green-700': assessment.recommended_track === 'BUNDLING',
                       'bg-amber-100 text-amber-700': assessment.recommended_track === 'NPA_LITE',
                       'bg-red-100 text-red-700': assessment.recommended_track === 'FULL_NPA'
                     }">
                  <lucide-icon [name]="assessment.recommended_track === 'BUNDLING' ? 'check-circle' : assessment.recommended_track === 'NPA_LITE' ? 'alert-circle' : 'x-circle'" class="w-7 h-7"></lucide-icon>
                </div>
                <div>
                  <div class="text-lg font-bold">
                    Recommended: <span class="uppercase">{{ assessment.recommended_track.replace('_', ' ') }}</span>
                  </div>
                  <p class="text-sm mt-0.5 opacity-80">{{ assessment.recommendation_reason }}</p>
                  <p class="text-xs mt-1 opacity-60">{{ assessment.passed_count }}/{{ assessment.total_conditions }} conditions passed</p>
                </div>
              </div>
            </div>

            <!-- CONDITIONS TABLE -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-slate-200">
                <h3 class="text-sm font-bold text-slate-900">Condition Details</h3>
              </div>
              <div class="divide-y divide-slate-100">
                <div *ngFor="let c of assessment.conditions; let i = index" class="px-6 py-4 flex items-start gap-4">
                  <div class="flex-none pt-0.5">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center"
                         [ngClass]="c.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
                      <lucide-icon [name]="c.passed ? 'check' : 'x'" class="w-3.5 h-3.5"></lucide-icon>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="text-sm font-semibold text-slate-900">{{ c.condition }}</div>
                    <div class="text-xs text-slate-500 mt-0.5">{{ c.detail }}</div>
                  </div>
                  <span class="flex-none px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                        [ngClass]="c.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                    {{ c.passed ? 'PASS' : 'FAIL' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- APPLY BUNDLING -->
            <div *ngIf="assessment.recommended_track === 'BUNDLING'" class="flex justify-end">
              <button (click)="applyBundling()" class="px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2">
                <lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>
                Apply Bundling Track
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class BundlingAssessmentComponent {
    private bundlingService = inject(BundlingService);
    private npaService = inject(NpaService);
    private toast = inject(ToastService);

    npaList: any[] = [];
    approvedList: any[] = [];
    childId = '';
    parentId = '';
    loading = false;
    assessment: BundlingAssessment | null = null;

    constructor() {
        this.npaService.getAll().subscribe({
            next: (npas) => {
                this.npaList = npas;
                this.approvedList = npas.filter(n =>
                    n.current_stage === 'LAUNCHED' || n.current_stage === 'APPROVED'
                );
            }
        });
    }

    runAssessment() {
        if (!this.childId || !this.parentId) return;
        this.loading = true;
        this.assessment = null;
        this.bundlingService.assess(this.childId, this.parentId).subscribe({
            next: (data) => { this.assessment = data; this.loading = false; },
            error: (err) => { this.toast.error(err.error?.error || 'Assessment failed'); this.loading = false; }
        });
    }

    applyBundling() {
        if (!this.assessment || !confirm('Apply BUNDLING track to this NPA?')) return;
        this.bundlingService.apply(this.childId, this.parentId).subscribe({
            next: () => this.toast.success('Bundling track applied successfully!'),
            error: (err) => this.toast.error(err.error?.error || 'Apply failed')
        });
    }
}
