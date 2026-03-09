import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AgentGovernanceService, ClassificationResult } from '../../../services/agent-governance.service';
import { inject } from '@angular/core';

export interface ClassificationCriterion {
    id: string;
    category: 'INNOVATION' | 'MARKET' | 'RISK' | 'FINANCIAL';
    text: string;
    met: boolean;
    reasoning: string; // filled by AI or User
    isAiFlagged?: boolean;
    isOverridden?: boolean;
}

@Component({
    selector: 'app-classification-scorecard',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 }))
            ])
        ])
    ],
    template: `
    <div [ngClass]="embedded ? 'h-full flex flex-col bg-slate-50' : 'fixed inset-0 z-[200] bg-slate-50 flex flex-col'" class="font-sans text-slate-900">
        
        <!-- HEADER -->
        <div class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div>
                <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <lucide-icon name="scale" class="w-5 h-5 text-indigo-600"></lucide-icon>
                    Classification Scorecard
                </h2>
                <p class="text-xs text-slate-500 mt-0.5">NPA Classification Framework v1.0 (Feb 2026)</p>
            </div>

            <div class="flex items-center gap-6">
                <!-- AI SCAN BUTTON -->
                <button (click)="scanProject()" 
                        [disabled]="isScanning"
                        class="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100">
                    <lucide-icon *ngIf="!isScanning" name="sparkles" class="w-4 h-4"></lucide-icon>
                    <lucide-icon *ngIf="isScanning" name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
                    {{ isScanning ? 'Scanning Brief...' : 'AI Risk Scan' }}
                </button>

                <div class="h-8 w-px bg-slate-200"></div>

                <!-- TIER DISPLAY -->
                <div class="text-right">
                    <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposed Tier</div>
                    <div class="text-xl font-black tracking-tight flex items-center justify-end gap-2" [ngClass]="getTierColor()">
                        {{ classificationTier }}
                        <span class="text-xs font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{{ totalScore }}/20</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- MAIN GRID -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
                
                <!-- CATEGORY BLOCK -->
                <div *ngFor="let cat of categories" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div class="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wide flex items-center gap-2">
                            <lucide-icon [name]="cat.icon" class="w-4 h-4 text-slate-400"></lucide-icon>
                            {{ cat.name }}
                        </h3>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                            {{ getCategoryScore(cat.id) }}/5
                        </span>
                    </div>
                    
                    <div class="divide-y divide-slate-50">
                        <div *ngFor="let criterion of getCriteria(cat.id)" 
                             class="p-4 hover:bg-slate-50/50 transition-colors group relative">
                            
                            <div class="flex items-start gap-3">
                                <div class="pt-0.5">
                                    <input type="checkbox" 
                                           [(ngModel)]="criterion.met" 
                                           (change)="calculateTier()"
                                           class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer">
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-slate-700 leading-snug" 
                                       [class.text-indigo-900]="criterion.met">
                                        {{ criterion.text }}
                                    </p>
                                    
                                    <!-- AI REASONING / EVIDENCE -->
                                    <div *ngIf="criterion.met || criterion.reasoning" [@fadeIn] class="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-600 flex items-start gap-2">
                                        <lucide-icon *ngIf="criterion.isAiFlagged" name="bot" class="w-3 h-3 text-indigo-500 mt-0.5 shrink-0"></lucide-icon>
                                        <p class="leading-relaxed">{{ criterion.reasoning || 'User manually selected this indicator.' }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- FOOTER -->
        <div class="bg-white border-t border-slate-200 p-4 flex justify-between items-center shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div class="flex items-center gap-4 text-xs text-slate-500">
                <div class="flex items-center gap-1.5">
                     <div class="w-2 h-2 rounded-full bg-emerald-500"></div> Lite (0-9)
                </div>
                <div class="flex items-center gap-1.5">
                     <div class="w-2 h-2 rounded-full bg-amber-500"></div> Standard (10-14)
                </div>
                <div class="flex items-center gap-1.5">
                     <div class="w-2 h-2 rounded-full bg-rose-500"></div> Complex (15+)
                </div>
            </div>

            <div class="flex gap-3">
                <button (click)="cancel.emit()" class="px-4 py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors">Back</button>
                <button (click)="confirm()" 
                        class="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold shadow-md hover:bg-slate-800 transition-all flex items-center gap-2">
                    Confirm Classification
                    <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                </button>
            </div>
        </div>
    </div>
    `
})
export class ClassificationScorecardComponent {

    @Input() projectDescription: string = '';
    @Input() embedded = false;
    @Output() cancel = new EventEmitter<void>();
    @Output() completed = new EventEmitter<{ tier: string, score: number }>();

    isScanning = false;
    totalScore = 0;
    classificationTier: 'LITE' | 'STANDARD' | 'COMPLEX' = 'LITE';

    categories = [
        { id: 'INNOVATION', name: 'Product Innovation', icon: 'zap' },
        { id: 'MARKET', name: 'Market & Customer', icon: 'users' },
        { id: 'RISK', name: 'Risk & Regulatory', icon: 'shield-alert' },
        { id: 'FINANCIAL', name: 'Financial & Ops', icon: 'banknote' }
    ];

    criteria: ClassificationCriterion[] = [
        // INNOVATION
        { id: 'i1', category: 'INNOVATION', text: 'Novel Product Structure (New Architecture)', met: false, reasoning: '' },
        { id: 'i2', category: 'INNOVATION', text: 'New Asset Class (Previously Untradeable)', met: false, reasoning: '' },
        { id: 'i3', category: 'INNOVATION', text: 'Innovative Technology (Blockchain/AI)', met: false, reasoning: '' },
        { id: 'i4', category: 'INNOVATION', text: 'New Revenue Model', met: false, reasoning: '' },
        { id: 'i5', category: 'INNOVATION', text: 'Unique Market Position (Market Making)', met: false, reasoning: '' },

        // MARKET
        { id: 'm1', category: 'MARKET', text: 'New Customer Segment', met: false, reasoning: '' },
        { id: 'm2', category: 'MARKET', text: 'New Geographic Market', met: false, reasoning: '' },
        { id: 'm3', category: 'MARKET', text: 'New Distribution Channel', met: false, reasoning: '' },
        { id: 'm4', category: 'MARKET', text: 'New Partnership Model', met: false, reasoning: '' },

        // RISK
        { id: 'r1', category: 'RISK', text: 'New Risk Categories (e.g. Model Risk)', met: false, reasoning: '' },
        { id: 'r2', category: 'RISK', text: 'New Regulatory Framework', met: false, reasoning: '' },
        { id: 'r3', category: 'RISK', text: 'New Capital Treatment', met: false, reasoning: '' },
        { id: 'r4', category: 'RISK', text: 'New Compliance Monitoring', met: false, reasoning: '' },
        { id: 'r5', category: 'RISK', text: 'New Legal Agreements (Masters)', met: false, reasoning: '' },
        { id: 'r6', category: 'RISK', text: 'New Operational Processes', met: false, reasoning: '' },

        // FINANCIAL
        { id: 'f1', category: 'FINANCIAL', text: 'New Settlement Mechanism', met: false, reasoning: '' },
        { id: 'f2', category: 'FINANCIAL', text: 'New Currency Exposure', met: false, reasoning: '' },
        { id: 'f3', category: 'FINANCIAL', text: 'New Counterparty Types', met: false, reasoning: '' },
        { id: 'f4', category: 'FINANCIAL', text: 'New Pricing Model', met: false, reasoning: '' },
        { id: 'f5', category: 'FINANCIAL', text: 'New Data Requirements', met: false, reasoning: '' }
    ];

    getCriteria(catId: string) {
        return this.criteria.filter(c => c.category === catId);
    }

    getCategoryScore(catId: string) {
        return this.criteria.filter(c => c.category === catId && c.met).length;
    }

    calculateTier() {
        this.totalScore = this.criteria.filter(c => c.met).length;

        if (this.totalScore >= 15) {
            this.classificationTier = 'COMPLEX'; // New-to-Group
        } else if (this.totalScore >= 10) {
            this.classificationTier = 'STANDARD'; // Material Variation
        } else {
            this.classificationTier = 'LITE'; // Minor Variation/Existing
        }
    }

    getTierColor() {
        switch (this.classificationTier) {
            case 'COMPLEX': return 'text-rose-600';
            case 'STANDARD': return 'text-amber-500';
            default: return 'text-emerald-600';
        }
    }

    @Input() projectId = 'NPA-' + Math.floor(Math.random() * 10000);
    private governanceService = inject(AgentGovernanceService);

    scanProject() {
        this.isScanning = true;

        this.governanceService.analyzeClassification(this.projectDescription)
            .subscribe(result => {
                this.isScanning = false;
                this.classificationTier = result.tier === 'Existing' ? 'LITE' :
                    result.tier === 'NPA Lite' ? 'LITE' :
                        result.tier === 'Variation' ? 'STANDARD' : 'COMPLEX';

                // For now, we still run the local rule highlighter to show 'detail' 
                // because the mock service doesn't return criteria-level detail yet.
                this.applyAiRules();
            });
    }

    applyAiRules() {
        const desc = this.projectDescription.toLowerCase();

        // Example Rules - In a real app, this would come from the LLM
        if (desc.includes('crypto') || desc.includes('token') || desc.includes('blockchain')) {
            this.mark('i2', 'Asset Class: Digital Assets/Tokens detected.');
            this.mark('i3', 'Tech: DLT/Blockchain infrastructure detected.');
            this.mark('r1', 'Risk: New Operational & Custody risks associated with Digital Assets.');
        }

        if (desc.includes('cross-border') || desc.includes('international')) {
            this.mark('m2', 'Market: Multi-jurisdictional rollout detected.');
            this.mark('f2', 'Financial: FX and detailed currency exposure.');
        }

        if (desc.includes('retail') && desc.includes('complex')) {
            this.mark('r4', 'Compliance: Enhanced suitability checks needed for retail complex products.');
        }

        this.calculateTier();
    }

    mark(id: string, reason: string) {
        const c = this.criteria.find(x => x.id === id);
        if (c) {
            c.met = true;
            c.reasoning = reason;
            c.isAiFlagged = true;
        }
    }

    confirm() {
        // Create result object for service
        const result: ClassificationResult = {
            tier: this.classificationTier === 'LITE' ? 'NPA Lite' :
                this.classificationTier === 'STANDARD' ? 'Variation' : 'New-to-Group',
            riskLevel: 'LOW', // derived from tier usually
            reason: 'User Confirmed',
            requiredApprovers: [],
            score: this.totalScore,
            breakdown: this.criteria.filter(c => c.met).map(c => c.id)
        };

        this.governanceService.saveClassification(this.projectId, result)
            .subscribe({
                next: (res) => {
                    this.completed.emit({ tier: this.classificationTier, score: this.totalScore });
                },
                error: (err) => console.error('Failed to save classification:', err)
            });
    }
}
