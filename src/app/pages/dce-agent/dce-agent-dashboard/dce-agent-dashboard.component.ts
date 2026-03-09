import { Component, EventEmitter, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router, RouterModule } from '@angular/router';
import { DifyAgentService, AgentCapability, AgentWorkItem, HealthMetrics } from '../../../services/dify/dify-agent.service';
import { CapabilityCardComponent } from '../../../components/npa/dashboard/capability-card.component';
import { WorkItemListComponent } from '../../../components/npa/dashboard/work-item-list.component';
import { AgentHealthPanelComponent } from '../../../components/npa/dashboard/agent-health-panel.component';
import { KbListOverlayComponent } from '../../../components/npa/dashboard/kb-list-overlay.component';
import { DcePipelineTableComponent } from './dce-pipeline-table.component';

import { UserService } from '../../../services/user.service';
import { DceService } from '../../../services/dce.service';
import { AGENT_REGISTRY, AgentDefinition } from '../../../lib/agent-interfaces';

@Component({
   selector: 'app-dce-agent-dashboard',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      RouterModule,
      CapabilityCardComponent,
      WorkItemListComponent,
      AgentHealthPanelComponent,
      DcePipelineTableComponent,
      KbListOverlayComponent
   ],
   template: `
    <div class="min-h-screen bg-slate-50/50 pb-20 font-sans">

      <!-- SECTION 1: AGENT HERO & CTA -->
      <div class="bg-white border-b border-slate-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-sky-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">

          <!-- Identity -->
          <div class="flex items-start gap-6">
            <div class="relative group cursor-pointer">
              <!-- Avatar -->
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-200 ring-4 ring-white">
                 <lucide-icon name="bot" class="w-10 h-10 text-white"></lucide-icon>
              </div>
              <!-- Pulse -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div class="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></div>
              </div>
            </div>

            <div class="space-y-3">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                     DCE Agent
                     <span class="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100 uppercase tracking-wide">v1.0 Online</span>
                  </h1>
                  <p class="text-lg text-slate-500 max-w-2xl leading-relaxed mt-1">
                     Your AI-powered Account Opening workbench with 8 specialist agents. Intake clients, collect documents, verify signatures, prepare KYC briefs, assess credit, configure trading systems, and deliver welcome kits.
                  </p>
               </div>

               <!-- Key Stats Badge -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60">
                  <span class="flex items-center gap-1.5 hover:text-sky-600 transition-colors cursor-help">
                     <lucide-icon name="database" class="w-4 h-4 text-sky-500"></lucide-icon>
                     {{ heroActiveCases }} Active Cases
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-help">
                     <lucide-icon name="zap" class="w-4 h-4 text-amber-500"></lucide-icon>
                     {{ heroSlaOnTime }}% SLA On-Time
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-help">
                     <lucide-icon name="brain-circuit" class="w-4 h-4 text-purple-500"></lucide-icon>
                     {{ heroAvgDuration }}d Avg Duration
                  </span>
               </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex flex-col gap-3 w-full md:w-[420px]">
             <button (click)="onCreateNew()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-mbs-primary hover:bg-mbs-primary-hover text-white rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-blue-100">
                <lucide-icon name="message-square" class="w-6 h-6"></lucide-icon>
                Chat with Agent
                <span class="absolute right-0 top-0 -mt-1 -mr-1 flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                </span>
             </button>

             <div class="grid grid-cols-2 gap-2">
                <button *ngIf="userRole() === 'MAKER'" (click)="onCreateNew()" class="px-4 py-2 bg-white border border-mbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                   <lucide-icon name="file-edit" class="w-3.5 h-3.5"></lucide-icon> Continue Case
                </button>
                <button *ngIf="userRole() !== 'MAKER'" (click)="onOpenWorkspaceInbox()" class="px-4 py-2 bg-white border border-mbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                   <lucide-icon name="inbox" class="w-3.5 h-3.5"></lucide-icon> My Inbox
                </button>
                <button (click)="onSearchKb()" class="px-4 py-2 bg-white border border-mbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                   <lucide-icon name="search" class="w-3.5 h-3.5"></lucide-icon> Search KB
                </button>
             </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 sm:px-10 space-y-12 mt-12">

        <!-- SECTION 2: AGENT HEALTH & PERFORMANCE -->
        <section>
           <app-agent-health-panel [metrics]="(healthMetrics$ | async) || emptyMetrics"></app-agent-health-panel>
        </section>

        <!-- SECTION 3: CAPABILITIES -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-sky-100 text-sky-700 rounded-lg">
                 <lucide-icon name="target" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 Agent Capabilities
              </h2>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <app-capability-card
                *ngFor="let cap of capabilities$ | async"
                [capability]="cap"
                [isExpanded]="expandedCardId === cap.id"
                (expand)="onCardExpand(cap.id)"
                (action)="onCapabilityAction(cap.id)">
              </app-capability-card>
           </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

           <!-- SECTION 4: KNOWLEDGE BASES -->
           <section class="h-full flex flex-col">
              <div class="flex items-center justify-between mb-6">
                 <div class="flex items-center gap-3">
                    <div class="p-2 bg-purple-100 text-purple-700 rounded-lg">
                       <lucide-icon name="book-open" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Linked Knowledge Bases
                    </h2>
                 </div>
              </div>

              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                 <div class="divide-y divide-slate-100 min-h-[160px]">
                    <div *ngIf="difyKbs.length === 0" class="p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                       <lucide-icon name="loader-2" class="w-6 h-6 animate-spin text-slate-300"></lucide-icon>
                       Loading Knowledge Bases...
                    </div>

                    <div *ngFor="let kb of difyKbs | slice:0:4" class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                       <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                             <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                          </div>
                          <div>
                             <h4 class="text-sm font-bold text-slate-900 group-hover:text-sky-600" [title]="kb.name">{{ kb.name | slice:0:30 }}{{ kb.name.length > 30 ? '...' : '' }}</h4>
                             <p class="text-xs text-slate-500">{{ kb.document_count || kb.total_documents || 0 }} records</p>
                          </div>
                       </div>
                       <div class="flex items-center gap-3">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                          <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-sky-400"></lucide-icon>
                       </div>
                    </div>
                 </div>
                 <div class="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center mt-auto">
                    <button class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 w-full" (click)="onViewAll('kb')">
                       View All Knowledge Sources <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                    </button>
                 </div>
              </div>
           </section>

           <!-- SECTION 5: CONNECTED SERVICES -->
           <section class="h-full flex flex-col">
               <div class="flex items-center justify-between mb-6">
                 <div class="flex items-center gap-3">
                    <div class="p-2 bg-amber-100 text-amber-700 rounded-lg">
                       <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                    </div>
                    <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                       Connected Services
                    </h2>
                 </div>
              </div>

              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                 <div class="p-4 space-y-4 flex-1">
                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="shield-alert" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">Refinitiv World-Check</p>
                              <p class="text-[10px] text-slate-500">Sanctions Screening</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="scan-search" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">Dow Jones Risk & PEP</p>
                              <p class="text-[10px] text-slate-500">KYC Screening</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="share-2" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">ACRA / CoI Registry</p>
                              <p class="text-[10px] text-slate-500">Entity Verification</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                     </div>

                     <div class="w-full h-px bg-slate-100"></div>

                     <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <div class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                              <lucide-icon name="server" class="w-4 h-4"></lucide-icon>
                           </div>
                           <div>
                              <p class="text-sm font-bold text-slate-900">UBIX / SIC / CreditView</p>
                              <p class="text-[10px] text-slate-500">Trading Systems</p>
                           </div>
                        </div>
                        <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                     </div>
                  </div>
                  <div class="bg-slate-50 px-4 py-2 border-t border-slate-200 text-center mt-auto">
                     <button class="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 w-full" (click)="onViewAll('services')">
                        View All Connected Services <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                     </button>
                  </div>
               </div>
            </section>
        </div>

        <!-- SECTION 6: ACTIVE AGENT WORK ITEMS -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-sky-100 text-sky-700 rounded-lg">
                 <lucide-icon name="cpu" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 Active Agent Work Items
              </h2>
           </div>

           <app-work-item-list [items]="(workItems$ | async) || []"></app-work-item-list>
        </section>

        <!-- SECTION 7: DCE CASE PIPELINE TABLE -->
        <section>
           <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                 <lucide-icon name="briefcase" class="w-5 h-5"></lucide-icon>
              </div>
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                 DCE Case Pipeline
              </h2>
           </div>

           <app-dce-pipeline-table (onViewDetail)="onViewDetail($event)"></app-dce-pipeline-table>
        </section>

      </div>

      <!-- KB Overlay -->
      <app-kb-list-overlay
          [isOpen]="isKbOverlayOpen"
          [kbSets]="difyKbs"
          (closeOverlay)="isKbOverlayOpen = false">
      </app-kb-list-overlay>
    </div>
  `,
   styles: [`
    :host {
      display: block;
    }
  `]
})
export class DceAgentDashboardComponent implements OnInit {
   @Output() navigateToCreate = new EventEmitter<void>();
   @Output() navigateToDetail = new EventEmitter<string>();

   private difyService = inject(DifyAgentService);
   private userService = inject(UserService);
   private dceService = inject(DceService);
   private router = inject(Router);

   userRole = () => this.userService.currentUser().role;

   capabilities$ = this.difyService.getCapabilities('DCE');
   workItems$ = this.difyService.getActiveWorkItems('DCE');
   healthMetrics$ = this.difyService.getAgentHealth();

   expandedCardId: string | null = null;
   isKbOverlayOpen = false;

   emptyMetrics: HealthMetrics = {
      status: 'down', latency: 0, uptime: 0, activeAgents: 0, totalAgents: 8, totalDecisions: 0
   };

   // Hero stats
   heroActiveCases = 0;
   heroSlaOnTime = 0;
   heroAvgDuration = 0;

   // DCE-domain agents from AGENT_REGISTRY
   dceAgents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.domain === 'DCE');

   // Live Dify KBs
   difyKbs: any[] = [];

   ngOnInit() {
      this.loadHeroStats();
      this.loadDifyKbs();
   }

   private loadHeroStats() {
      this.dceService.getDashboardKpis().subscribe({
         next: (kpis) => {
            this.heroActiveCases = kpis.total_cases || 0;
            this.heroSlaOnTime = kpis.sla_breaches != null
               ? Math.max(0, Math.round(100 - (kpis.sla_breaches / Math.max(kpis.total_cases, 1)) * 100))
               : 95;
            this.heroAvgDuration = kpis.avg_duration_seconds
               ? Math.round(kpis.avg_duration_seconds / 86400)
               : 0;
         },
         error: (err) => console.warn('[DceDashboard] Failed to load KPIs', err)
      });
   }

   private loadDifyKbs() {
      this.difyService.getConnectedKnowledgeBases().subscribe({
         next: (kbs) => {
            this.difyKbs = kbs || [];
         },
         error: (err) => console.warn('[DceDashboard] Failed to load Dify KBs', err)
      });
   }

   onCreateNew() {
      this.navigateToCreate.emit();
   }

   onSearchKb() {
      this.router.navigate(['/knowledge/base']);
   }

   onOpenWorkspaceInbox() {
      this.router.navigate(['/workspace/inbox']);
   }

   onCardExpand(id: string) {
      this.expandedCardId = this.expandedCardId === id ? null : id;
   }

   onCapabilityAction(id: string) {
      if (id === 'create_dce_case' || id === 'DCE_SA1') {
         this.onCreateNew();
      }
   }

   onViewDetail(caseId: string) {
      this.navigateToDetail.emit(caseId);
   }

   onViewAll(section: string) {
      if (section === 'kb') {
         this.isKbOverlayOpen = true;
      }
   }
}
