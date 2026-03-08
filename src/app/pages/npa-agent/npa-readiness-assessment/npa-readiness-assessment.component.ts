import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AgentGovernanceService, ReadinessResult } from '../../../services/agent-governance.service';
import { inject } from '@angular/core';

interface ReadinessCategory {
    id: string;
    name: string;
    description: string;
    weight: number;
    icon: string;
    status: 'PENDING' | 'PASS' | 'FAIL' | 'WARNING';
    score: number;
    questions: CheckQuestion[];
}

interface CheckQuestion {
    id: string;
    text: string;
    required: boolean;
    checked: boolean;
    evidence: string;
    attachments: string[];
    isAiFilled?: boolean;
}

@Component({
    selector: 'app-npa-readiness-assessment',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(10px)' }),
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        trigger('expand', [
            transition(':enter', [
                style({ height: 0, opacity: 0 }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ height: 0, opacity: 0 }))
            ])
        ])
    ],
    template: `
    <div [ngClass]="embedded ? 'h-full flex flex-col bg-slate-50' : 'fixed inset-0 z-[200] bg-slate-50 flex flex-col'" class="font-sans text-slate-900">
      
      <!-- STEP 1: INITIAL IDEA INPUT -->
      <div *ngIf="step === 'INPUT'" [@fadeIn] class="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
         <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
             <div class="p-10">
                 <div class="flex items-center gap-4 mb-8">
                     <div class="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                         <lucide-icon name="sparkles" class="w-6 h-6"></lucide-icon>
                     </div>
                     <div>
                         <h1 class="text-2xl font-bold text-slate-900">New Product Initiation</h1>
                         <p class="text-slate-500">Describe your comprehensive idea to run a preliminary AI readiness check.</p>
                     </div>
                 </div>

                 <div class="space-y-6">
                     <div>
                         <label class="block text-sm font-semibold text-slate-700 mb-2">Product Name</label>
                         <input type="text" [(ngModel)]="projectTitle" placeholder="e.g., Cross-Border QR Payment Link" 
                                class="w-full px-4 py-3 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-lg placeholder:text-slate-300">
                     </div>

                     <div>
                         <label class="block text-sm font-semibold text-slate-700 mb-2">Brief Description / Concept</label>
                         <textarea [(ngModel)]="projectDescription" rows="5" placeholder="Describe the product features, target market, and technology..." 
                                   class="w-full px-4 py-3 rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 text-base placeholder:text-slate-300"></textarea>
                         <p class="text-xs text-slate-400 mt-2 text-right">0/500 characters</p>
                     </div>
                 </div>

                 <div class="mt-10 flex justify-end gap-3">
                     <button (click)="cancel.emit()" class="px-6 py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors">Cancel</button>
                     <button (click)="startAnalysis()" 
                             [disabled]="!projectTitle || !projectDescription"
                             class="px-8 py-3 bg-mbs-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-mbs-primary-hover transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                         <lucide-icon name="bot" class="w-5 h-5"></lucide-icon>
                         Run AI Readiness Check
                     </button>
                 </div>
             </div>
         </div>
      </div>

      <!-- STEP 2: ANALYZING LOADING STATE -->
      <div *ngIf="step === 'ANALYZING'" [@fadeIn] class="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <div class="text-center">
              <div class="relative w-24 h-24 mx-auto mb-8">
                  <div class="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                  <div class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  <lucide-icon name="brain-circuit" class="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse"></lucide-icon>
              </div>
              <h2 class="text-2xl font-bold text-slate-900 mb-2">Analyzing Policy Alignment...</h2>
              <div class="text-slate-500 h-6 overflow-hidden">
                  <p class="animate-bounce">Checking MBS Strategic Priorities FY2026...</p>
              </div>
          </div>
      </div>

      <!-- STEP 3: THE READINESS CHECKLIST (Pre-Filled) -->
      <div *ngIf="step === 'CHECKLIST'" class="flex flex-col h-full"> 
          <!-- HEADER -->
          <div class="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
            <div class="flex items-center gap-4">
              <div class="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-indigo-100 shadow-md">
                <lucide-icon name="shield-check" class="w-5 h-5"></lucide-icon>
              </div>
              <div>
                <h1 class="text-base font-bold text-slate-900 leading-tight">NPA Readiness Gate</h1>
                <div class="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span>Ref: TSG-2026-POL-01</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span class="text-indigo-600 flex items-center gap-1"><lucide-icon name="sparkles" class="w-3 h-3"></lucide-icon> AI Assisted</span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center gap-6">
               <!-- LEGENDS MOVED HERE -->
               <div class="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-wide border-r border-slate-100 pr-6 mr-2">
                 <div class="flex items-center gap-1.5 opacity-60">
                     <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                     <span>Unready</span>
                 </div>
                 <div class="flex items-center gap-1.5 opacity-80">
                     <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                     <span>Conditional</span>
                 </div>
                 <div class="flex items-center gap-1.5 text-slate-900">
                     <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span>Ready (>85%)</span>
                 </div>
               </div>

              <div class="text-right">
                 <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</div>
                 <div class="text-xl font-black tabular-nums tracking-tight leading-none" [ngClass]="getScoreColorClass()">
                    {{ totalScore | number:'1.0-0' }}%
                 </div>
              </div>
              
              <button (click)="cancel.emit()" class="text-slate-400 hover:text-slate-600">
                  <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- CONTEXT BAR -->
          <div class="bg-indigo-50/50 border-b border-indigo-100 px-6 py-3 shrink-0">
              <div class="flex items-start gap-3">
                  <lucide-icon name="file-text" class="w-4 h-4 text-indigo-500 mt-0.5 shrink-0"></lucide-icon>
                  <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-bold text-slate-800 truncate">{{ projectTitle }}</h3>
                      <p class="text-xs text-slate-500 line-clamp-1">{{ projectDescription }}</p>
                  </div>
                  <button class="text-[10px] font-medium text-indigo-600 hover:text-indigo-800 underline">View Full Brief</button>
              </div>
          </div>

          <!-- MAIN CONTENT -->
          <div class="flex-1 overflow-hidden flex">
            <!-- SIDEBAR -->
            <div class="w-72 bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar">
              <div class="p-4">
                 <h3 class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 pl-1">Assessment Domains</h3>
                 <div class="space-y-1.5">
                    <button *ngFor="let cat of categories" 
                            (click)="selectCategory(cat)"
                            class="w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden group"
                            [ngClass]="activeCategory.id === cat.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'">
                        
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-semibold text-sm leading-none" [ngClass]="activeCategory.id === cat.id ? 'text-indigo-900' : 'text-slate-700'">{{ cat.name }}</span>
                            <lucide-icon [name]="getCategoryIcon(cat)" class="w-3.5 h-3.5" [ngClass]="getStatusColor(cat.status)"></lucide-icon>
                        </div>
                        
                        <div class="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                            <span [ngClass]="cat.score === 100 ? 'text-emerald-600 font-semibold' : ''">{{ getProgress(cat) }}</span>
                            <!-- AI Sparkle if category has AI filled items -->
                            <lucide-icon *ngIf="hasAiContent(cat)" name="sparkles" class="w-3 h-3 text-amber-500 fill-amber-100"></lucide-icon>
                        </div>

                        <!-- Progress Bar -->
                        <div class="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-500" 
                             [style.width.%]="(cat.score / 100) * 100"
                             *ngIf="activeCategory.id === cat.id"></div>
                    </button>
                 </div>
              </div>
            </div>

            <!-- RIGHT PANEL -->
            <div class="flex-1 bg-slate-50/50 p-6 overflow-y-auto">
               <div [@fadeIn] class="max-w-3xl mx-auto pb-10">
                  
                  <div class="mb-6 flex items-start gap-4">
                      <div class="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                         <lucide-icon [name]="activeCategory.icon" class="w-6 h-6"></lucide-icon>
                      </div>
                      <div>
                          <h2 class="text-xl font-bold text-slate-900 leading-tight">{{ activeCategory.name }}</h2>
                          <p class="text-slate-500 mt-1 text-sm leading-relaxed">{{ activeCategory.description }}</p>
                      </div>
                  </div>

                  <!-- QUESTIONS LIST -->
                  <div class="space-y-4">
                      <div *ngFor="let q of activeCategory.questions" 
                           class="bg-white rounded-xl shadow-sm border border-slate-200 transition-all hover:shadow-md relative overflow-hidden"
                           [class.border-indigo-200]="q.checked && !q.isAiFilled"
                           [class.border-amber-200]="q.isAiFilled && q.checked">
                           
                           <!-- AI BADGE -->
                           <div *ngIf="q.isAiFilled" class="absolute top-0 right-0 bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-amber-100 flex items-center gap-1">
                               <lucide-icon name="sparkles" class="w-3 h-3"></lucide-icon>
                               AI PRE-FILLED
                           </div>

                          <div class="p-4 flex items-start gap-3">
                              <div class="pt-0.5">
                                  <input type="checkbox" [(ngModel)]="q.checked" (change)="calculateScore()"
                                         class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-colors">
                              </div>
                              <div class="flex-1">
                                  <div class="flex items-center justify-between pr-24">
                                      <p class="text-sm font-medium text-slate-700 leading-snug cursor-pointer select-none" 
                                         (click)="q.checked = !q.checked; calculateScore()">
                                          {{ q.text }}
                                      </p>
                                  </div>
                                  
                                  <!-- EVIDENCE SECTION -->
                                  <div *ngIf="q.checked" [@expand] class="mt-3 pl-0">
                                      <div class="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3">
                                          
                                          <!-- Justification -->
                                          <div>
                                              <label class="flex justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                                  Justification / Evidence
                                                  <span *ngIf="q.isAiFilled" class="text-amber-600 flex items-center gap-1">
                                                      <lucide-icon name="bot" class="w-3 h-3"></lucide-icon> AI Suggestion
                                                  </span>
                                              </label>
                                              <textarea [(ngModel)]="q.evidence" 
                                                        rows="2" 
                                                        class="w-full text-sm rounded-md border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 bg-white placeholder:text-slate-400"
                                                        [class.bg-amber-50]="q.isAiFilled"
                                                        [class.border-amber-200]="q.isAiFilled"
                                                        placeholder="Describe how this requirement is met..."></textarea>
                                          </div>

                                          <!-- Attachments -->
                                          <div>
                                              <label class="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Supporting Documents</label>
                                              <div class="flex flex-wrap gap-2">
                                                  <div *ngFor="let file of q.attachments" class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-slate-200 shadow-sm text-xs text-slate-600">
                                                      <lucide-icon name="file" class="w-3 h-3 text-slate-400"></lucide-icon>
                                                      {{ file }}
                                                      <button (click)="removeFile(q, file)" class="ml-1 text-slate-400 hover:text-red-500">
                                                          <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                                                      </button>
                                                  </div>

                                                  <button (click)="mockUpload(q)" class="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-md text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                                                      <lucide-icon name="upload-cloud" class="w-3 h-3"></lucide-icon>
                                                      Attach
                                                  </button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- NEXT BUTTON -->
                  <div class="mt-6 flex justify-end">
                      <button (click)="nextCategory()" class="px-5 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-all shadow-md shadow-slate-200 flex items-center gap-2">
                          Next Domain
                          <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                      </button>
                  </div>

               </div>
            </div>
          </div>
          
           <!-- FOOTER -->
          <div class="bg-white border-t border-slate-200 h-16 px-6 flex items-center justify-end z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <button (click)="submit()" 
                     [disabled]="totalScore < 85"
                     class="px-8 py-3 rounded-lg font-bold text-white text-sm shadow-md transition-all transform active:scale-95 flex items-center gap-2"
                     [ngClass]="totalScore >= 85 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'">
                 <lucide-icon name="rocket" class="w-4 h-4"></lucide-icon>
                 {{ totalScore >= 85 ? 'Proceed to Setup' : 'Readiness Threshold Not Met' }}
             </button>
          </div>
      </div>

    </div>
  `,
    styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #cbd5e1; }
  `]
})
export class NpaReadinessAssessmentComponent {

    @Input() embedded = false;
    @Output() cancel = new EventEmitter<void>();
    @Output() completed = new EventEmitter<any>();

    step: 'INPUT' | 'ANALYZING' | 'CHECKLIST' = 'INPUT';
    projectTitle = '';
    projectDescription = '';

    totalScore = 0;

    categories: ReadinessCategory[] = [
        {
            id: 'strategic',
            name: 'Strategic Alignment',
            description: 'Ensures the product aligns with bank priorities and has a validated business case.',
            weight: 15,
            icon: 'target',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 's1', text: 'Product aligns with MBS strategic priorities', required: true, checked: false, evidence: '', attachments: [] },
                { id: 's2', text: 'Business case document prepared and approved', required: true, checked: false, evidence: '', attachments: [] },
                { id: 's3', text: 'Market opportunity and customer demand validated', required: true, checked: false, evidence: '', attachments: [] }
            ]
        },
        // ... (Other categories remain the same, just keeping the structure)
        {
            id: 'stakeholder',
            name: 'Stakeholder Readiness',
            description: 'Confirms that Risk, Legal, Ops, and Finance teams are engaged and resourced.',
            weight: 20,
            icon: 'users',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 'h1', text: 'Risk Management Group briefed and resourced', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'h2', text: 'Tech & Ops impact assessment initiated', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'h3', text: 'Legal/Compliance roadmap prepared', required: true, checked: false, evidence: '', attachments: [] }
            ]
        },
        {
            id: 'regulatory',
            name: 'Regulatory Landscape',
            description: 'Validates that licensing and cross-border requirements are understood.',
            weight: 15,
            icon: 'scale',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 'r1', text: 'All target jurisdictions identified', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'r2', text: 'Regulatory timeline mapped', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'r3', text: 'Licensing requirements confirmed', required: true, checked: false, evidence: '', attachments: [] }
            ]
        },
        {
            id: 'tech',
            name: 'Technical Infrastructure',
            description: 'Assesses system capability and architecture readiness.',
            weight: 15,
            icon: 'server',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 't1', text: 'System capability analysis completed', required: true, checked: false, evidence: '', attachments: [] },
                { id: 't2', text: 'InfoSec / Architecture planning initiated', required: true, checked: false, evidence: '', attachments: [] },
                { id: 't3', text: 'Integration requirements mapped', required: false, checked: false, evidence: '', attachments: [] }
            ]
        },
        {
            id: 'risk',
            name: 'Risk Management',
            description: 'Ensures risk frameworks and models are being prepared.',
            weight: 10,
            icon: 'alert-triangle',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 'rk1', text: 'Risk categories identified (Credit, Market, Ops)', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'rk2', text: 'Risk measurement methodology defined', required: false, checked: false, evidence: '', attachments: [] }
            ]
        },
        {
            id: 'data',
            name: 'Data Governance',
            description: 'Checks for data privacy, residency, and quality controls.',
            weight: 10,
            icon: 'database',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 'd1', text: 'Data privacy/GDPR requirements assessed', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'd2', text: 'Data classification completed', required: false, checked: false, evidence: '', attachments: [] }
            ]
        },
        {
            id: 'finance',
            name: 'Financial Framework',
            description: 'Validates accounting treatment and capital requirements.',
            weight: 15,
            icon: 'pie-chart',
            status: 'PENDING',
            score: 0,
            questions: [
                { id: 'f1', text: 'Accounting treatment determined', required: true, checked: false, evidence: '', attachments: [] },
                { id: 'f2', text: 'Capital and funding estimated', required: false, checked: false, evidence: '', attachments: [] },
                { id: 'f3', text: 'Project budget approved', required: true, checked: false, evidence: '', attachments: [] }
            ]
        }
    ];

    activeCategory: ReadinessCategory = this.categories[0];

    private governanceService = inject(AgentGovernanceService);
    // UUID for the project (simulate new ID or pass from parent)
    @Input() projectId = 'NPA-' + Math.floor(Math.random() * 10000);

    constructor() {
        this.calculateScore();
    }

    startAnalysis() {
        this.step = 'ANALYZING';

        this.governanceService.analyzeReadiness(this.projectDescription)
            .subscribe(result => {
                this.applyAnalysisResult(result);
                this.step = 'CHECKLIST';
            });
    }

    applyAnalysisResult(result: ReadinessResult) {
        // Map service result to UI categories
        // For simplicity, we match by ID or Name

        result.domains.forEach(d => {
            const cat = this.categories.find(c => c.id === d.id || c.name === d.name);
            if (cat) {
                // If service says FAIL/MISSING, we mark relevant questions
                if (d.status !== 'PASS') {
                    // Find a question to flag
                    const q = cat.questions[0]; // simplistic mapping
                    q.evidence = d.observation;
                    q.isAiFilled = true;
                    // If missing, maybe uncheck it?
                    // The UI logic is: Checked means "I have this". 
                    // So if it's MISSING, we might check it but add "Draft" or leave unchecked?
                    // Let's assume Checked = "We know we need this", but status comes from evidence.
                    // Actually getting the UI right: 
                    // If Service says "Risk FAIL", it means we found a Risk issue.
                    // Let's just populate the Evidence field which triggers the logic.
                    q.checked = true; // Auto-check to show we looked at it
                } else if (d.status === 'PASS') {
                    const q = cat.questions[0];
                    q.checked = true;
                    q.isAiFilled = true;
                    q.evidence = d.observation;
                }
            }
        });

        this.calculateScore();
    }

    // preFillData is replaced by applyAnalysisResult

    selectCategory(cat: ReadinessCategory) {
        this.activeCategory = cat;
    }

    nextCategory() {
        const idx = this.categories.indexOf(this.activeCategory);
        if (idx < this.categories.length - 1) {
            this.activeCategory = this.categories[idx + 1];
        }
    }

    calculateScore() {
        let overallScore = 0;

        this.categories.forEach(cat => {
            const totalQ = cat.questions.length;
            const checkedQ = cat.questions.filter(q => q.checked).length;

            cat.score = totalQ > 0 ? (checkedQ / totalQ) * 100 : 0;

            if (cat.score === 100) cat.status = 'PASS';
            else if (cat.score > 0) cat.status = 'WARNING';
            else cat.status = 'FAIL';

            overallScore += (cat.score / 100) * cat.weight;
        });

        this.totalScore = overallScore;
    }

    // ... Helpers
    getScoreColorClass() {
        if (this.totalScore >= 85) return 'text-emerald-600';
        if (this.totalScore >= 70) return 'text-amber-500';
        return 'text-rose-600';
    }

    getStatusColor(status: string) {
        switch (status) {
            case 'PASS': return 'text-emerald-500';
            case 'WARNING': return 'text-amber-500';
            case 'FAIL': return 'text-rose-400';
            default: return 'text-slate-300';
        }
    }

    getCategoryIcon(cat: ReadinessCategory): string {
        if (cat.status === 'PASS') return 'check-circle';
        return cat.icon;
    }

    getProgress(cat: ReadinessCategory) {
        const checked = cat.questions.filter(q => q.checked).length;
        return `${checked}/${cat.questions.length}`;
    }

    hasAiContent(cat: ReadinessCategory): boolean {
        return cat.questions.some(q => q.isAiFilled);
    }

    mockUpload(q: CheckQuestion) {
        const mockFiles = ['strategy_paper_v1.pdf', 'market_analysis.xlsx', 'reg_checklist_hk.docx'];
        const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
        q.attachments.push(randomFile);
    }

    removeFile(q: CheckQuestion, file: string) {
        q.attachments = q.attachments.filter(f => f !== file);
    }

    submit() {
        if (this.totalScore >= 85) {

            // 1. Create Project Record First
            this.governanceService.createProject(this.projectTitle, this.projectDescription)
                .subscribe({
                    next: (proj) => {
                        this.projectId = proj.id; // Update with real DB ID

                        // 2. Prepare result for saving
                        const result: ReadinessResult = {
                            isReady: true,
                            score: this.totalScore,
                            overallAssessment: 'Passed Readiness Gate',
                            domains: this.categories.map(c => ({
                                name: c.name,
                                id: c.id,
                                status: c.status === 'PASS' ? 'PASS' : c.status === 'WARNING' ? 'WARNING' : 'FAIL',
                                observation: c.questions.filter(q => q.evidence).map(q => q.evidence).join('; ') || 'No issues.'
                            })) as any
                        };

                        // 3. Save Assessment
                        this.governanceService.saveReadinessAssessment(this.projectId, result)
                            .subscribe({
                                next: (res) => {
                                    this.completed.emit({
                                        score: this.totalScore,
                                        title: this.projectTitle,
                                        description: this.projectDescription,
                                        projectId: this.projectId, // Pass real ID up
                                        dbId: res.id
                                    });
                                },
                                error: (err) => console.error('Failed to save readiness:', err)
                            });
                    },
                    error: (err) => console.error('Failed to create project:', err)
                });
        }
    }
}
