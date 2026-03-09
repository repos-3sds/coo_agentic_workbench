import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NpaField } from '../../../lib/npa-interfaces';

export interface RequiredDocument {
   id: string;
   name: string;
   category: 'CORE' | 'CONDITIONAL' | 'EXTERNAL' | 'LEGAL' | 'RISK' | 'TECH';
   source: 'BUSINESS' | 'RISK' | 'LEGAL' | 'COMPLIANCE' | 'OPS' | 'TECH' | 'EXTERNAL';
   status: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED' | 'AT_RISK' | 'MISSING';
   isCriticalPath: boolean;
   autoFillPercentage?: number;
   owner?: string;
   notes?: string;
}

@Component({
   selector: 'app-document-dependency-matrix',
   standalone: true,
   imports: [CommonModule, LucideAngularModule],
   template: `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      <!-- Header / Summary -->
      <div class="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              Document Dependency Matrix
              <span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">
                 {{ npaType || 'NPA Full' }}
              </span>
           </h3>
           <p class="text-sm text-slate-500 mt-1">
              {{ completionPercentage }}% Complete • <span class="text-red-600 font-semibold">{{ criticalMissingCount }} Critical Missing</span>
           </p>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2">
           <button *ngFor="let cat of categories" 
                   (click)="activeCategory = cat"
                   [class]="activeCategory === cat ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-slate-100'"
                   class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all">
              {{ cat }}
           </button>
        </div>
      </div>

      <!-- Matrix List -->
      <div class="divide-y divide-slate-100">
         <div *ngFor="let doc of filteredDocs" class="group hover:bg-slate-50 transition-colors p-4 flex items-center justify-between">
            
            <!-- Left: Icon & Info -->
            <div class="flex items-center gap-4 flex-1">
               <!-- Status Icon -->
               <div [ngClass]="getStatusColor(doc.status)" class="w-10 h-10 rounded-full flex items-center justify-center flex-none">
                  <lucide-icon [name]="getStatusIcon(doc.status)" class="w-5 h-5"></lucide-icon>
               </div>
               
               <div>
                  <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                     {{ doc.name }}
                     <span *ngIf="doc.isCriticalPath" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        CRITICAL
                     </span>
                  </h4>
                  <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                     <span class="flex items-center gap-1">
                        <lucide-icon name="user" class="w-3 h-3"></lucide-icon>
                        {{ doc.owner || 'Unassigned' }}
                     </span>
                     <span class="flex items-center gap-1">
                        <lucide-icon name="building-2" class="w-3 h-3"></lucide-icon>
                        {{ doc.source }}
                     </span>
                     <span *ngIf="doc.autoFillPercentage" class="flex items-center gap-1 text-green-600">
                        <lucide-icon name="sparkles" class="w-3 h-3"></lucide-icon>
                        {{ doc.autoFillPercentage }}% Auto-fill
                     </span>
                  </div>
               </div>
            </div>

            <!-- Right: Action -->
            <div class="flex items-center gap-3">
               <span class="text-xs font-semibold px-2 py-1 rounded" [ngClass]="getStatusBadge(doc.status)">
                  {{ doc.status.replace('_', ' ') }}
               </span>
               <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <lucide-icon name="more-vertical" class="w-4 h-4"></lucide-icon>
               </button>
            </div>

         </div>
      </div>

      <!-- Footer -->
      <div class="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
         <span>Source: NPA_Documents_Required.md (v1.0)</span>
         <button class="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Generate Missing Docs <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
         </button>
      </div>

    </div>
  `,
   styles: []
})
export class DocumentDependencyMatrixComponent implements OnInit, OnChanges {
   @Input() npaContext: any = null; // To derive type/features

   // Derived from npaContext
   npaType: string = 'NPA Full (New-to-Group)';

   categories = ['ALL', 'CORE', 'RISK', 'LEGAL', 'TECH'];
   activeCategory = 'ALL';

   // Mock Master List (subset of Golden Source)
   allDocs: RequiredDocument[] = [
      // CORE
      { id: 'D1', name: 'NPA Submission Form', category: 'CORE', source: 'BUSINESS', status: 'COMPLETE', isCriticalPath: true, autoFillPercentage: 78, owner: 'Vikram A.' },
      { id: 'D2', name: 'Product Specification', category: 'CORE', source: 'BUSINESS', status: 'IN_PROGRESS', isCriticalPath: true, autoFillPercentage: 35, owner: 'Vikram A.' },
      { id: 'D3', name: 'Risk Assessment Matrix', category: 'RISK', source: 'RISK', status: 'AT_RISK', isCriticalPath: true, autoFillPercentage: 55, owner: 'Sarah J.', notes: 'Waiting on Market Risk sign-off' },

      // LEGAL
      { id: 'D4', name: 'Legal Documentation Summary', category: 'LEGAL', source: 'LEGAL', status: 'NOT_STARTED', isCriticalPath: false, autoFillPercentage: 45 },
      { id: 'D5', name: 'Regulatory Checklist', category: 'LEGAL', source: 'COMPLIANCE', status: 'IN_PROGRESS', isCriticalPath: true, owner: 'Compliance Team' },

      // TECH
      { id: 'D6', name: 'System Impact Assessment', category: 'TECH', source: 'TECH', status: 'COMPLETE', isCriticalPath: false, autoFillPercentage: 70, owner: 'IT Dept' },
      { id: 'D7', name: 'Ops Readiness Checklist', category: 'CORE', source: 'OPS', status: 'NOT_STARTED', isCriticalPath: true, autoFillPercentage: 75, owner: 'Ops Lead' }
   ];

   constructor() { }

   ngOnInit() {
      this.updateMatrix();
   }

   ngOnChanges(changes: SimpleChanges) {
      if (changes['npaContext']) {
         this.updateMatrix();
      }
   }

   get filteredDocs() {
      if (this.activeCategory === 'ALL') return this.allDocs;
      // Simple mapping for demo categories - in real app would match 'category' field more precisely
      if (this.activeCategory === 'RISK') return this.allDocs.filter(d => d.category === 'RISK' || d.source === 'RISK');
      if (this.activeCategory === 'LEGAL') return this.allDocs.filter(d => d.category === 'LEGAL' || d.source === 'LEGAL' || d.source === 'COMPLIANCE');
      if (this.activeCategory === 'TECH') return this.allDocs.filter(d => d.category === 'TECH' || d.source === 'TECH' || d.source === 'OPS');
      return this.allDocs.filter(d => d.category === this.activeCategory);
   }

   get completionPercentage() {
      const total = this.allDocs.length;
      const done = this.allDocs.filter(d => d.status === 'COMPLETE').length;
      return Math.round((done / total) * 100);
   }

   get criticalMissingCount() {
      return this.allDocs.filter(d => d.isCriticalPath && d.status !== 'COMPLETE').length;
   }

   updateMatrix() {
      // Logic to adapt allDocs based on npaContext
      // For mock demo, we might toggle some docs
   }

   getStatusColor(status: string): string {
      switch (status) {
         case 'COMPLETE': return 'bg-green-100 text-green-600';
         case 'IN_PROGRESS': return 'bg-blue-100 text-blue-600';
         case 'AT_RISK': return 'bg-amber-100 text-amber-600';
         case 'NOT_STARTED': return 'bg-slate-100 text-slate-400';
         case 'MISSING': return 'bg-red-100 text-red-600';
         default: return 'bg-slate-100';
      }
   }

   getStatusIcon(status: string): string {
      switch (status) {
         case 'COMPLETE': return 'check';
         case 'IN_PROGRESS': return 'loader-2';
         case 'AT_RISK': return 'alert-triangle';
         case 'NOT_STARTED': return 'circle-dashed';
         case 'MISSING': return 'x-circle';
         default: return 'circle';
      }
   }

   getStatusBadge(status: string): string {
      switch (status) {
         case 'COMPLETE': return 'bg-green-100 text-green-700';
         case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
         case 'AT_RISK': return 'bg-amber-100 text-amber-800 animate-pulse';
         case 'NOT_STARTED': return 'bg-slate-100 text-slate-600';
         case 'MISSING': return 'bg-red-100 text-red-700 font-bold';
         default: return 'bg-slate-100';
      }
   }

}
