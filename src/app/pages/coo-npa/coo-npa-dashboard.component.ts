import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AGENT_REGISTRY, AgentDefinition } from '../../lib/agent-interfaces';
import { NpaService } from '../../services/npa.service';
import { DashboardService } from '../../services/dashboard.service';
import { MonitoringService } from '../../services/monitoring.service';
import { EscalationQueueComponent } from '../escalation-queue/escalation-queue.component';
import { PirManagementComponent } from '../pir-management/pir-management.component';
import { BundlingAssessmentComponent } from '../bundling-assessment/bundling-assessment.component';
import { DocumentManagerComponent } from '../document-manager/document-manager.component';
import { EvergreenDashboardComponent } from '../evergreen-dashboard/evergreen-dashboard.component';
import { DifyAgentService } from '../../services/dify/dify-agent.service';
import { KbListOverlayComponent } from '../../components/npa/dashboard/kb-list-overlay.component';

interface KpiMetric {
    label: string;
    value: string;
    subValue?: string;
    trend: string;
    trendUp: boolean;
    color: string;
    icon: string;
}

interface NpaItem {
    id?: string;
    displayId?: string;
    productName: string;
    location: string;
    businessUnit: string;
    kickoffDate: string;
    productManager: string;
    pmTeam: string;
    pacApproval: string;
    proposalPreparer: string;
    template: string;
    classification: 'Complex' | 'Standard' | 'Light';
    stage: 'Initiation' | 'Discovery' | 'Review' | 'Sign-Off' | 'Pre Launch' | 'Launch' | 'PIR / Monitoring';
    status: 'On Track' | 'At Risk' | 'Delayed';
    ageDays: number;
}

@Component({
    selector: 'app-coo-npa-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, EscalationQueueComponent, PirManagementComponent, BundlingAssessmentComponent, DocumentManagerComponent, EvergreenDashboardComponent, KbListOverlayComponent],
    template: `
    @if (loading()) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    } @else {
    <div class="h-full w-full bg-slate-50/50 flex flex-col font-sans text-slate-900 group/dashboard relative overflow-hidden">

      <!-- HEADER -->
      <div class="bg-white border-b border-slate-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden flex-none">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">

          <!-- Identity -->
          <div class="flex items-start gap-6">
            <div class="relative group cursor-pointer">
              <!-- Avatar -->
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-white">
                 <lucide-icon name="layout-dashboard" class="w-10 h-10 text-white"></lucide-icon>
              </div>
              <!-- Pulse -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div class="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></div>
              </div>
            </div>

            <div class="space-y-3">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                     NPA Control Tower
                     <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 uppercase tracking-wide">Live Dashboard</span>
                  </h1>
                  <p class="text-lg text-slate-500 max-w-2xl leading-relaxed mt-1">
                     Executive overview for New Product Approvals. Monitor pipeline, track governance stages, and oversee approval workflows across all business units.
                  </p>
               </div>

               <!-- Key Stats Badge -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60">
                  <span class="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-help">
                     <lucide-icon name="layers" class="w-4 h-4 text-indigo-500"></lucide-icon>
                     {{ headerActiveNpas }} Active NPAs
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-help">
                     <lucide-icon name="check-circle" class="w-4 h-4 text-emerald-500"></lucide-icon>
                     {{ headerApprovalRate }}% Approval Rate
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-help">
                     <lucide-icon name="clock" class="w-4 h-4 text-blue-500"></lucide-icon>
                     {{ headerAvgCycle }} Days Avg Cycle
                  </span>
               </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex flex-col gap-3 w-full md:w-auto">
             <button (click)="navigateToCreate()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-mbs-primary hover:bg-mbs-primary-hover text-white rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-blue-100">
                <lucide-icon name="plus" class="w-6 h-6"></lucide-icon>
                Create NPA
             </button>
             <div class="grid grid-cols-2 gap-2">
                <button class="px-4 py-2 bg-white border border-mbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                </button>
                <button class="px-4 py-2 bg-white border border-mbs-border text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Filter
                </button>
             </div>
          </div>
        </div>
      </div>

      <!-- TABS -->
      <div class="border-b border-slate-200 bg-white">
         <div class="flex w-full max-w-7xl mx-auto px-6 sm:px-10 overflow-x-auto hide-scrollbar">
            <button
               [class.border-slate-900]="activeTab === 'overview'"
               [class.text-slate-900]="activeTab === 'overview'"
               [class.border-transparent]="activeTab !== 'overview'"
               [class.text-slate-500]="activeTab !== 'overview'"
               (click)="activeTab = 'overview'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               Overview
            </button>
            <button
               [class.border-slate-900]="activeTab === 'npa-pool'"
               [class.text-slate-900]="activeTab === 'npa-pool'"
               [class.border-transparent]="activeTab !== 'npa-pool'"
               [class.text-slate-500]="activeTab !== 'npa-pool'"
               (click)="activeTab = 'npa-pool'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               NPA Pool
            </button>
            <button
               [class.border-slate-900]="activeTab === 'monitoring'"
               [class.text-slate-900]="activeTab === 'monitoring'"
               [class.border-transparent]="activeTab !== 'monitoring'"
               [class.text-slate-500]="activeTab !== 'monitoring'"
               (click)="activeTab = 'monitoring'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap gap-2">
               Monitoring
               <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-600 border border-rose-200">{{ monitoringSummary.open_breaches }}</span>
            </button>
            <button
               [class.border-slate-900]="activeTab === 'escalations'"
               [class.text-slate-900]="activeTab === 'escalations'"
               [class.border-transparent]="activeTab !== 'escalations'"
               [class.text-slate-500]="activeTab !== 'escalations'"
               (click)="activeTab = 'escalations'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               Escalations
            </button>
            <button
               [class.border-slate-900]="activeTab === 'pir'"
               [class.text-slate-900]="activeTab === 'pir'"
               [class.border-transparent]="activeTab !== 'pir'"
               [class.text-slate-500]="activeTab !== 'pir'"
               (click)="activeTab = 'pir'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               PIR
            </button>
            <button
               [class.border-slate-900]="activeTab === 'bundling'"
               [class.text-slate-900]="activeTab === 'bundling'"
               [class.border-transparent]="activeTab !== 'bundling'"
               [class.text-slate-500]="activeTab !== 'bundling'"
               (click)="activeTab = 'bundling'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               Bundling
            </button>
            <button
               [class.border-slate-900]="activeTab === 'documents'"
               [class.text-slate-900]="activeTab === 'documents'"
               [class.border-transparent]="activeTab !== 'documents'"
               [class.text-slate-500]="activeTab !== 'documents'"
               (click)="activeTab = 'documents'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               Documents
            </button>
            <button
               [class.border-slate-900]="activeTab === 'evergreen'"
               [class.text-slate-900]="activeTab === 'evergreen'"
               [class.border-transparent]="activeTab !== 'evergreen'"
               [class.text-slate-500]="activeTab !== 'evergreen'"
               (click)="activeTab = 'evergreen'"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap">
               Evergreen
            </button>
         </div>
      </div>

      <!-- BODY -->
      <div class="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-8 relative z-10 scrollbar-thin max-w-7xl mx-auto w-full">

         <!-- OVERVIEW TAB CONTENT -->
         <div *ngIf="activeTab === 'overview'" class="space-y-8">

         <!-- 1. KPI CARDS (Enriched) -->
         <div class="grid grid-cols-4 gap-6">
            <div *ngFor="let kpi of kpis" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
               <div class="flex justify-between items-start mb-4">
                   <div class="p-2 rounded-lg" [ngClass]="'bg-' + kpi.color + '-50 text-' + kpi.color + '-600'">
                      <lucide-icon [name]="kpi.icon" class="w-5 h-5"></lucide-icon>
                   </div>
                   <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100 group-hover:border-slate-200 transition-colors">YTD</span>
               </div>
               <div class="space-y-1">
                   <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{{ kpi.label }}</div>
                   <div class="flex items-baseline gap-2">
                       <span class="text-3xl font-bold text-slate-900 tracking-tight">{{ kpi.value }}</span>
                       <span *ngIf="kpi.subValue" class="text-sm font-medium text-slate-400">{{ kpi.subValue }}</span>
                   </div>
               </div>
               <div class="mt-4 flex items-center gap-2 text-xs font-medium pt-3 border-t border-slate-50">
                   <span [ngClass]="kpi.trendUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'" class="px-1.5 py-0.5 rounded flex items-center gap-1">
                       <lucide-icon [name]="kpi.trendUp ? 'trending-up' : 'trending-down'" class="w-3 h-3"></lucide-icon>
                       {{ kpi.trend }}
                   </span>
                   <span class="text-slate-400">vs last month</span>
               </div>
            </div>
         </div>

         <!-- 2. CHARTS & PIPELINE ROW -->
         <div class="grid grid-cols-12 gap-6">
             
             <!-- LEFT: Donut Chart (Classification) -->
             <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <lucide-icon name="pie-chart" class="w-4 h-4 text-slate-400"></lucide-icon> Mix by Class
                 </h3>
                 
                 <div class="flex-1 flex flex-col items-center justify-center relative">
                     <!-- CSS Donut Chart -->
                     <div class="w-40 h-40 rounded-full relative" 
                          [style.background]="classificationGradient">
                         <!-- Inner Circle -->
                         <div class="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                             <span class="text-3xl font-bold text-slate-900">{{ classificationTotal }}</span>
                             <span class="text-[10px] font-bold text-slate-400 uppercase">Total Active</span>
                         </div>
                     </div>
                 </div>

                 <div class="mt-6 space-y-3">
                     <div *ngFor="let cm of classificationMix" class="flex items-center justify-between text-xs">
                         <div class="flex items-center gap-2">
                             <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="cm.color"></div>
                             <span class="font-medium text-slate-600">{{ cm.type }}</span>
                         </div>
                         <span class="font-bold text-slate-900">{{ cm.percentage }}%</span>
                     </div>
                 </div>
             </div>

             <!-- MIDDLE: Pipeline Flow (Visual) -->
             <div class="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-8">
                     <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <lucide-icon name="git-merge" class="w-4 h-4 text-slate-400"></lucide-icon> Pipeline Health
                     </h3>
                     <div class="flex gap-2">
                         <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Avg Cycle: 32d</span>
                     </div>
                 </div>

                 <!-- Flow Chart -->
                 <div class="flex-1 flex items-center relative px-2">
                     <!-- Connector Line -->
                     <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>

                     <!-- Stages -->
                     <div class="w-full flex justify-between relative z-10">
                         <div *ngFor="let stage of pipelineStages" class="flex flex-col items-center gap-3 group cursor-pointer">
                             <!-- Circle/Node -->
                             <div class="w-12 h-12 rounded-xl border-2 bg-white flex items-center justify-center shadow-sm transition-all duration-300"
                                  [ngClass]="{
                                      'border-slate-200 text-slate-400 group-hover:border-slate-300': stage.status === 'normal',
                                      'border-amber-400 text-amber-600 shadow-amber-100 bg-amber-50': stage.status === 'warning',
                                      'border-rose-500 text-rose-600 shadow-rose-100 bg-rose-50': stage.status === 'danger',
                                      'border-emerald-500 text-emerald-600 shadow-emerald-100 bg-emerald-50': stage.status === 'success'
                                  }">
                                  <span class="text-lg font-bold">{{ stage.count }}</span>
                             </div>
                             
                             <!-- Label -->
                             <div class="text-center space-y-0.5">
                                 <div class="text-xs font-bold text-slate-900">{{ stage.name }}</div>
                                 <div class="text-[10px] font-mono text-slate-400">{{ stage.avgTime }}</div>
                             </div>

                             <!-- Tooltip (Metric) -->
                             <div *ngIf="stage.risk > 0" class="absolute -top-10 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce">
                                 {{ stage.risk }} Delayed
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- RIGHT: Bar Chart (Ageing) -->
             <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <lucide-icon name="clock" class="w-4 h-4 text-slate-400"></lucide-icon> Ageing Analysis
                 </h3>
                 
                 <div class="flex-1 flex items-end justify-between gap-3 min-h-[160px]">
                     <div *ngFor="let age of ageing" class="flex-1 flex flex-col items-center gap-2 group">
                         <div class="text-[10px] font-bold text-slate-900 mb-1">{{ age.count }}</div>
                         <div class="w-full rounded-t-lg bg-indigo-600 group-hover:bg-indigo-700 transition-all duration-300" [style.height.px]="age.height">
                         </div>
                         <div class="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">{{ age.label }}</div>
                     </div>
                 </div>
             </div>
         </div>

         <!-- 3. STRATEGIC INSIGHTS (Clusters & Prospects) -->
         <div class="grid grid-cols-2 gap-6">
             <!-- Market Clusters -->
             <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-6">
                     <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <lucide-icon name="layout-grid" class="w-4 h-4 text-slate-400"></lucide-icon> Market Clusters
                     </h3>
                     <span class="text-xs font-semibold text-slate-500">Theme Concentration</span>
                 </div>
                 
                 <div class="flex-1 grid grid-cols-2 gap-4">
                     <div *ngFor="let cluster of clusters" class="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group relative overflow-hidden">
                         <div class="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-transform group-hover:scale-150" [ngClass]="cluster.color"></div>
                         
                         <div class="relative z-10">
                             <div class="flex justify-between items-start mb-2">
                                 <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-600 border border-slate-100 shadow-sm">{{ cluster.count }} Products</span>
                                 <lucide-icon name="arrow-up-right" class="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors"></lucide-icon>
                             </div>
                             <h4 class="text-sm font-bold text-slate-900 mb-0.5">{{ cluster.name }}</h4>
                             <p class="text-[10px] text-slate-500 mb-3">{{ cluster.growth }} Growth</p>
                             
                             <div class="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                 <div class="h-full rounded-full" [ngClass]="cluster.color.replace('bg-', 'bg-')" [style.width]="cluster.intensity"></div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>

             <!-- Product Opportunities (Prospects) -->
             <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                 <div class="flex items-center justify-between mb-6">
                     <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <lucide-icon name="telescope" class="w-4 h-4 text-slate-400"></lucide-icon> Product Opportunities
                     </h3>
                     <button class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                         View Pipeline <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
                     </button>
                 </div>
                 
                 <div class="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                     <div *ngFor="let item of prospects" class="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group cursor-pointer">
                         <div class="flex items-center gap-4">
                             <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                 {{ item.prob }}%
                             </div>
                             <div>
                                 <h4 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{{ item.name }}</h4>
                                 <p class="text-[10px] text-slate-500 font-medium">{{ item.theme }} • Est. {{ item.estValue }}</p>
                             </div>
                         </div>
                         <div class="flex items-center gap-2">
                             <span class="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-500">Pre-Seed</span>
                             <button class="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                                 <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
                             </button>
                         </div>
                     </div>
                     <div class="p-3 rounded-lg border border-dashed border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all gap-2">
                         <lucide-icon name="plus-circle" class="w-3.5 h-3.5"></lucide-icon> Add Prospect
                     </div>
                 </div>
             </div>
         </div>

         <!-- 4. DATA GRID & TOP REVENUE -->
         <div class="grid grid-cols-12 gap-6">
             
             <!-- MAIN TABLE -->
             <div class="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                 <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                     <div class="flex items-center gap-3">
                         <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                             <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                         </div>
                         <h3 class="text-sm font-bold text-slate-900">Active Approvals Queue</h3>
                         <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">14 Active</span>
                     </div>
                     <div class="flex gap-2">
                         <input type="text" placeholder="Search projects..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-48 transition-all">
                         <button class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                             <lucide-icon name="filter" class="w-4 h-4"></lucide-icon>
                         </button>
                     </div>
                 </div>

                 <div class="flex-1 overflow-x-auto">
                     <table class="w-full text-left text-xs">
                         <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm">
                             <tr>
                                 <th class="px-6 py-3 w-1/3">Project</th>
                                 <th class="px-6 py-3">Manager & Stage</th>
                                 <th class="px-6 py-3 text-right">Age</th>
                                 <th class="px-6 py-3 text-center">Status</th>
                                 <th class="px-6 py-3"></th>
                             </tr>
                         </thead>
                         <tbody class="divide-y divide-slate-100">
                             <tr *ngFor="let row of npaPool.slice(0, 6)" (click)="navigateToDetail(row)" class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                 <td class="px-6 py-4">
                                     <div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ row.productName }}</div>
                                     <div class="flex items-center gap-2 mt-1">
                                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                                              [ngClass]="{
                                                'bg-purple-50 text-purple-700 border-purple-100': row.classification === 'Complex',
                                                'bg-blue-50 text-blue-700 border-blue-100': row.classification === 'Standard',
                                                'bg-emerald-50 text-emerald-700 border-emerald-100': row.classification === 'Light'
                                              }">{{ row.classification }}</span>
                                        <span class="text-[10px] text-slate-400">{{ row.location }}</span>
                                     </div>
                                 </td>
                                 <td class="px-6 py-4">
                                     <div class="text-slate-700 font-medium">{{ row.productManager }}</div>
                                     <div class="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                                         <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {{ row.stage }}
                                     </div>
                                 </td>
                                 <td class="px-6 py-4 text-right font-mono text-slate-500 font-medium">{{ row.ageDays }}d</td>
                                 <td class="px-6 py-4 text-center">
                                     <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                           [ngClass]="{
                                              'bg-emerald-50 text-emerald-700 border-emerald-100': row.status === 'On Track',
                                              'bg-amber-50 text-amber-700 border-amber-100': row.status === 'At Risk',
                                              'bg-rose-50 text-rose-700 border-rose-100': row.status === 'Delayed'
                                           }">
                                         <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                            'bg-emerald-500': row.status === 'On Track',
                                            'bg-amber-500': row.status === 'At Risk',
                                            'bg-rose-500': row.status === 'Delayed'
                                         }"></span>
                                         {{ row.status }}
                                     </span>
                                 </td>
                                 <td class="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                         <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                                     </button>
                                 </td>
                             </tr>
                         </tbody>
                     </table>
                 </div>
                 <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                     <span class="text-xs text-slate-500 font-medium">Showing 6 of 14 items</span>
                     <div class="flex gap-2">
                         <button class="px-3 py-1 bg-white border border-mbs-border rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50">Previous</button>
                         <button class="px-3 py-1 bg-white border border-mbs-border rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700">Next</button>
                     </div>
                 </div>
             </div>

             <!-- RIGHT: Top Revenue Opportunities -->
             <div class="col-span-4 space-y-6">
                 <div class="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 relative">
                     <div class="absolute top-0 right-0 p-24 bg-indigo-600/20 rounded-full blur-3xl -mr-12 -mt-12"></div>
                     
                     <div class="px-6 py-5 border-b border-white/10 relative z-10 flex justify-between items-center">
                         <h3 class="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <lucide-icon name="gem" class="w-4 h-4 text-emerald-400"></lucide-icon> Top Revenue
                         </h3>
                         <span class="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-1 rounded">PROJ. REVENUE</span>
                     </div>
                     
                     <div class="divide-y divide-white/5 relative z-10">
                         <div *ngFor="let item of topRevenue; let i = index" class="p-5 hover:bg-white/5 transition-colors cursor-pointer group">
                             <div class="flex justify-between items-start mb-1">
                                 <div class="flex items-center gap-3">
                                     <span class="text-xs font-mono text-slate-500">#{{i+1}}</span>
                                     <h4 class="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">{{ item.name }}</h4>
                                 </div>
                                 <div class="font-bold text-emerald-400 text-sm shadow-emerald-500/20 drop-shadow-sm">{{ item.revenue }}</div>
                             </div>
                             <div class="flex justify-between items-center mt-2 pl-7">
                                 <span class="text-[10px] text-slate-400">{{ item.owner }} • {{ item.stage }}</span>
                                 <div class="flex items-center gap-2">
                                     <div class="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                         <div class="h-full bg-emerald-500" [style.width.%]="item.progress"></div>
                                     </div>
                                     <span class="text-[10px] font-mono text-slate-500">{{ item.progress }}%</span>
                                 </div>
                             </div>
                         </div>
                     </div>
                     <div class="p-3 bg-white/5 text-center cursor-pointer hover:bg-white/10 transition-colors">
                         <span class="text-xs font-bold text-slate-400">View All Opportunities</span>
                     </div>
                 </div>

                 <!-- Alerts / Notifications Block -->
                 <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                      <div class="flex items-center gap-2 mb-4">
                          <lucide-icon name="bell" class="w-4 h-4 text-slate-400"></lucide-icon>
                          <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Alerts</h4>
                      </div>
                      <div class="space-y-3">
                          <div class="flex gap-3 items-start">
                              <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-none"></div>
                              <div>
                                  <p class="text-xs font-semibold text-slate-800">Risk Assessment Overdue</p>
                                  <p class="text-[10px] text-slate-500">Crypto Custody Prime • 2h ago</p>
                              </div>
                          </div>
                          <div class="flex gap-3 items-start">
                              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-none"></div>
                              <div>
                                  <p class="text-xs font-semibold text-slate-800">DCE Review Required</p>
                                  <p class="text-[10px] text-slate-500">Credit Link Note • 5h ago</p>
                              </div>
                          </div>
                      </div>
                 </div>
             </div>
         </div>

         <!-- 5. KNOWLEDGE BASES (Linked KBs) -->
         <div class="mt-6">
            <section class="flex flex-col">
               <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-3">
                     <div class="p-2 bg-purple-100 text-purple-700 rounded-lg">
                        <lucide-icon name="book-open" class="w-5 h-5"></lucide-icon>
                     </div>
                     <h2 class="text-sm font-bold text-slate-700 uppercase tracking-widest">
                        Linked Knowledge Bases
                     </h2>
                  </div>
                  <button class="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5" (click)="navigateToCreate()">
                      <lucide-icon name="plus" class="w-3 h-3"></lucide-icon> Add KB
                  </button>
               </div>
               
               <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
                  <div class="divide-y divide-slate-100 min-h-[160px]">
                     <div *ngIf="difyKbs.length === 0" class="p-6 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                        <lucide-icon name="loader-2" class="w-6 h-6 animate-spin text-slate-300"></lucide-icon>
                        Loading Knowledge Bases...
                     </div>
                     
                     <div *ngFor="let kb of difyKbs | slice:0:4" class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div class="flex items-center gap-4">
                           <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                              <lucide-icon name="database" class="w-5 h-5"></lucide-icon>
                           </div>
                           <div>
                              <h4 class="text-sm font-bold text-slate-900 group-hover:text-indigo-600" [title]="kb.name">{{ kb.name | slice:0:30 }}{{ kb.name.length > 30 ? '...' : '' }}</h4>
                              <p class="text-xs text-slate-500">{{ kb.document_count || kb.total_documents || 0 }} records • {{ kb.provider || 'Dify' }}</p>
                           </div>
                        </div>
                        <div class="flex items-center gap-3">
                           <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SYNCED</span>
                           <lucide-icon name="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-indigo-400"></lucide-icon>
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
         </div>

         </div>
         <!-- END OVERVIEW TAB CONTENT -->

         <!-- NPA POOL TAB CONTENT -->
         <div *ngIf="activeTab === 'npa-pool'" class="space-y-6">

            <!-- Full-Width NPA Pool Table -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                            <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                        </div>
                        <h3 class="text-sm font-bold text-slate-900">Complete NPA Pool</h3>
                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{{ npaPool.length }} Total</span>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" placeholder="Search projects..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all">
                        <button class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                            <lucide-icon name="filter" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button class="px-3 py-1.5 bg-white border border-mbs-border text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-x-auto scrollbar-thin">
                    <table class="text-left text-xs" style="min-width: 1800px;">
                        <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm sticky top-0">
                            <tr>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 140px;">NPA ID</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 200px;">Product Name</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 120px;">Location</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 150px;">Business Unit</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Kickoff Date</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 140px;">Product Manager</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 150px;">PM Team</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">PAC Approval</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 140px;">Proposal Preparer</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 160px;">Template</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Classification</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 110px;">Stage</th>
                                <th class="px-4 py-3 whitespace-nowrap text-center" style="min-width: 100px;">Status</th>
                                <th class="px-4 py-3 whitespace-nowrap text-right" style="min-width: 70px;">Age</th>
                                <th class="px-4 py-3 whitespace-nowrap" style="min-width: 50px;"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            <tr *ngFor="let row of npaPool" (click)="navigateToDetail(row)" class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="font-mono text-xs text-indigo-600 font-semibold">{{ row.displayId || row.id }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ row.productName }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.location }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.businessUnit }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 font-mono text-[11px]">{{ row.kickoffDate }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 font-medium">{{ row.productManager }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.pmTeam }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.pacApproval }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.proposalPreparer }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700">{{ row.template }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                                          [ngClass]="{
                                            'bg-purple-50 text-purple-700 border-purple-100': row.classification === 'Complex',
                                            'bg-blue-50 text-blue-700 border-blue-100': row.classification === 'Standard',
                                            'bg-emerald-50 text-emerald-700 border-emerald-100': row.classification === 'Light'
                                          }">{{ row.classification }}</span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap">
                                    <div class="text-slate-700 text-[11px]">{{ row.stage }}</div>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-center">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                          [ngClass]="{
                                             'bg-emerald-50 text-emerald-700 border-emerald-100': row.status === 'On Track',
                                             'bg-amber-50 text-amber-700 border-amber-100': row.status === 'At Risk',
                                             'bg-rose-50 text-rose-700 border-rose-100': row.status === 'Delayed'
                                          }">
                                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                           'bg-emerald-500': row.status === 'On Track',
                                           'bg-amber-500': row.status === 'At Risk',
                                           'bg-rose-500': row.status === 'Delayed'
                                        }"></span>
                                        {{ row.status }}
                                    </span>
                                </td>
                                <td class="px-4 py-4 whitespace-nowrap text-right font-mono text-slate-500 font-medium">{{ row.ageDays }}d</td>
                                <td class="px-4 py-4 whitespace-nowrap text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                        <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Showing {{ npaPool.length }} of {{ npaPool.length }} items</span>
                    <div class="flex gap-2">
                        <button class="px-3 py-1 bg-white border border-mbs-border rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50" disabled>Previous</button>
                        <button class="px-3 py-1 bg-white border border-mbs-border rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700" disabled>Next</button>
                    </div>
                </div>
            </div>

         </div>
         <!-- END NPA POOL TAB CONTENT -->

         <!-- MONITORING TAB CONTENT -->
         <div *ngIf="activeTab === 'monitoring'" class="space-y-8">

            <!-- Aggregate KPIs -->
            <div class="grid grid-cols-4 gap-6">
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-rose-50 text-rose-600">
                        <lucide-icon name="alert-triangle" class="w-5 h-5"></lucide-icon>
                     </div>
                     <span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">LIVE</span>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">{{ monitoringSummary.open_breaches }}</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Breaches</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <lucide-icon name="clock" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">{{ monitoringSummary.warning_count }}h</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Resolution Time</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <lucide-icon name="arrow-up-circle" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">{{ monitoringSummary.critical_count }}</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Open Escalations</div>
               </div>
               <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div class="flex items-center justify-between mb-3">
                     <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <lucide-icon name="check-circle" class="w-5 h-5"></lucide-icon>
                     </div>
                  </div>
                  <div class="text-3xl font-bold text-slate-900">{{ monitoringSummary.total_launched }}</div>
                  <div class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Launched Products</div>
               </div>
            </div>

            <!-- Agent Health Grid (13 agents across 4 tiers) -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="p-1.5 bg-indigo-100 rounded text-indigo-600">
                        <lucide-icon name="brain-circuit" class="w-4 h-4"></lucide-icon>
                     </div>
                     <h3 class="text-sm font-bold text-slate-900">Agent Fleet Status</h3>
                     <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{{ agentsByTier.length }} Tiers / {{ allAgents.length }} Agents</span>
                  </div>
               </div>
               <div class="p-6 space-y-4">
                  <div *ngFor="let tier of agentsByTier">
                     <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tier {{ tier.tier }} — {{ tier.label }}</h4>
                     <div class="flex flex-wrap gap-2">
                        <div *ngFor="let agent of tier.agents" class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                           <div class="w-7 h-7 rounded-full flex items-center justify-center" [ngClass]="agent.color">
                              <lucide-icon [name]="agent.icon" class="w-3.5 h-3.5"></lucide-icon>
                           </div>
                           <span class="text-xs font-medium text-slate-700">{{ agent.name }}</span>
                           <span class="w-2 h-2 rounded-full bg-green-500"></span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- Post-Launch NPA Health Table -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                        <lucide-icon name="activity" class="w-4 h-4"></lucide-icon>
                     </div>
                     <h3 class="text-sm font-bold text-slate-900">Post-Launch NPA Health</h3>
                  </div>
               </div>
               <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                     <tr>
                        <th class="px-6 py-3">Product</th>
                        <th class="px-6 py-3">Volume (MTD)</th>
                        <th class="px-6 py-3">P&L</th>
                        <th class="px-6 py-3 text-center">Breaches</th>
                        <th class="px-6 py-3 text-center">Health</th>
                     </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                     <tr *ngFor="let npa of launchedNpas" class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4">
                           <div class="font-bold text-slate-900 text-sm">{{ npa.name }}</div>
                           <div class="text-[10px] text-slate-400 mt-0.5">{{ npa.desk }}</div>
                        </td>
                        <td class="px-6 py-4 font-mono text-slate-700">{{ npa.volume }}</td>
                        <td class="px-6 py-4 font-mono" [ngClass]="npa.pnl.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'">{{ npa.pnl }}</td>
                        <td class="px-6 py-4 text-center">
                           <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                 [ngClass]="npa.breachCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'">
                              {{ npa.breachCount }}
                           </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                           <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                 [ngClass]="{
                                    'bg-emerald-50 text-emerald-700 border-emerald-100': npa.health === 'Healthy',
                                    'bg-amber-50 text-amber-700 border-amber-100': npa.health === 'Warning',
                                    'bg-rose-50 text-rose-700 border-rose-100': npa.health === 'Critical'
                                 }">
                              <span class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                 'bg-emerald-500': npa.health === 'Healthy',
                                 'bg-amber-500': npa.health === 'Warning',
                                 'bg-rose-500': npa.health === 'Critical'
                              }"></span>
                              {{ npa.health }}
                           </span>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>

            <!-- Breach Details -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
               <h3 class="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <lucide-icon name="shield-alert" class="w-4 h-4 text-rose-500"></lucide-icon>
                  Recent Breaches Across Portfolio
               </h3>
               <div class="space-y-4">
                  <div *ngFor="let breach of monitoringBreaches" class="flex gap-4 p-4 rounded-lg border transition-all"
                       [ngClass]="breach.severity === 'critical' ? 'bg-rose-50/40 border-rose-100' : 'bg-amber-50/40 border-amber-100'">
                     <div class="flex-none pt-0.5">
                        <div class="w-2 h-2 rounded-full mt-1.5" [ngClass]="breach.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'"></div>
                     </div>
                     <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                           <h4 class="font-bold text-slate-900 text-sm">{{ breach.title }}</h4>
                           <span class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                                 [ngClass]="breach.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'">{{ breach.severity }}</span>
                        </div>
                        <p class="text-xs text-slate-600 mb-1">{{ breach.description }}</p>
                        <div class="flex items-center gap-4 text-[10px] text-slate-400">
                           <span>{{ breach.product }}</span>
                           <span>{{ breach.triggeredAt }}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
         <!-- END MONITORING TAB CONTENT -->

         <!-- ESCALATIONS TAB -->
         <div *ngIf="activeTab === 'escalations'" class="h-full -mx-6 sm:-mx-10 -my-8">
            <app-escalation-queue></app-escalation-queue>
         </div>

         <!-- PIR TAB -->
         <div *ngIf="activeTab === 'pir'" class="h-full -mx-6 sm:-mx-10 -my-8">
            <app-pir-management></app-pir-management>
         </div>

         <!-- BUNDLING TAB -->
         <div *ngIf="activeTab === 'bundling'" class="h-full -mx-6 sm:-mx-10 -my-8">
            <app-bundling-assessment></app-bundling-assessment>
         </div>

         <!-- DOCUMENTS TAB -->
         <div *ngIf="activeTab === 'documents'" class="h-full -mx-6 sm:-mx-10 -my-8">
            <app-document-manager></app-document-manager>
         </div>

         <!-- EVERGREEN TAB -->
         <div *ngIf="activeTab === 'evergreen'" class="h-full -mx-6 sm:-mx-10 -my-8">
            <app-evergreen-dashboard></app-evergreen-dashboard>
         </div>

      </div>
      
      <!-- KB Overlay -->
      <app-kb-list-overlay
          [isOpen]="isKbOverlayOpen"
          [kbSets]="difyKbs"
          (closeOverlay)="isKbOverlayOpen = false">
      </app-kb-list-overlay>
    </div>
    }
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
  `]
})
export class CooNpaDashboardComponent implements OnInit {

    private destroyRef = inject(DestroyRef);
    private router = inject(Router);
    private npaService = inject(NpaService);
    private dashboardService = inject(DashboardService);
    private monitoringService = inject(MonitoringService);
    private difyService = inject(DifyAgentService);

    loading = signal(true);
    private pendingRequests = 3; // npaPool + dashboardKpis + monitoring

    private markRequestComplete() {
        this.pendingRequests--;
        if (this.pendingRequests <= 0) {
            this.loading.set(false);
        }
    }

    navigateToCreate() {
        this.router.navigate(['/agents/npa'], { queryParams: { mode: 'create' } });
    }

    navigateToDetail(npa: NpaItem) {
        if (npa.id) {
            this.router.navigate(['/agents/npa'], { queryParams: { mode: 'detail', projectId: npa.id } });
        } else {
            this.router.navigate(['/agents/npa'], { queryParams: { mode: 'detail', projectId: npa.productName } });
        }
    }

    activeTab: 'overview' | 'npa-pool' | 'monitoring' | 'escalations' | 'pir' | 'bundling' | 'documents' | 'evergreen' = 'overview';

    // States for overlay
    difyKbs: any[] = [];
    isKbOverlayOpen = false;

    // Header stats (bound from KPI API)
    headerActiveNpas = 0;
    headerApprovalRate = 0;
    headerAvgCycle = 0;

    kpis: KpiMetric[] = [];
    pipelineStages: any[] = [];
    ageing: any[] = [];
    topRevenue: any[] = [];
    npaPool: NpaItem[] = [];
    classificationMix: any[] = [];
    classificationTotal = 0;
    classificationGradient = 'conic-gradient(#e2e8f0 0% 100%)';
    clusters: any[] = [];
    prospects: any[] = [];
    launchedNpas: any[] = [];
    monitoringBreaches: any[] = [];
    monitoringSummary = { total_launched: 0, healthy_count: 0, warning_count: 0, critical_count: 0, open_breaches: 0, total_volume: 0 };

    // Agent fleet (from static registry — no DB table)
    allAgents = AGENT_REGISTRY;
    agentsByTier = this.groupAgentsByTier();

    ngOnInit() {
        this.loadAllData();
        this.loadDifyKbs();
    }

    private loadDifyKbs() {
        this.difyService.getConnectedKnowledgeBases().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (kbs) => this.difyKbs = kbs || [],
            error: (err) => console.warn('[COO Dashboard] Failed to load Dify KBs', err)
        });
    }

    /**
     * Fetch all data from real APIs in parallel
     */
    loadAllData() {
        // 1. NPA Pool from NpaService
        this.npaService.getAll().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (projects) => {
                this.npaPool = projects.map(p => ({
                    id: p.id,
                    displayId: p.display_id || p.id,
                    productName: p.title || 'Untitled',
                    location: p.jurisdictions?.[0] || 'SG',
                    businessUnit: p.pm_team || 'Global Fin. Markets',
                    kickoffDate: new Date(p.created_at).toLocaleDateString(),
                    productManager: p.product_manager || p.submitted_by || 'Unknown',
                    pmTeam: p.pm_team || 'N/A',
                    pacApproval: p.current_stage === 'APPROVED' ? 'Approved' : 'Pending',
                    proposalPreparer: p.submitted_by || 'Unknown',
                    template: p.product_category || p.npa_type || 'Standard NPA',
                    classification: this.mapClassification(p.npa_type, p.approval_track),
                    stage: this.mapStage(p.current_stage),
                    status: this.mapStatus(p.status),
                    ageDays: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24))
                }));
                this.markRequestComplete();
            },
            error: (err) => {
                console.error('[COO] Failed to load NPA pool', err);
                this.markRequestComplete();
            }
        });

        // 2. Dashboard KPIs + Pipeline + Ageing + Clusters + Prospects + Revenue + Classification (parallel)
        forkJoin({
            kpis: this.dashboardService.getKpis(),
            pipeline: this.dashboardService.getPipeline(),
            ageing: this.dashboardService.getAgeing(),
            clusters: this.dashboardService.getClusters(),
            prospects: this.dashboardService.getProspects(),
            revenue: this.dashboardService.getRevenue(),
            classification: this.dashboardService.getClassificationMix(),
        }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                // KPIs → header stats + KPI cards
                this.mapKpis(data.kpis);

                // Pipeline stages
                // Backend may return both INITIATION and DISCOVERY (etc). After mapping to UI labels,
                // merge duplicates so the overview does not show repeated stages (e.g. "Discovery" twice).
                const stageAgg = new Map<string, { name: string; count: number; avgTime: string; risk: number; status: string }>();
                for (const s of data.pipeline) {
                    const name = this.mapStage(s.stage);
                    const prev = stageAgg.get(name);
                    const count = Number(s.count || 0);
                    const risk = Number(s.risk_count || 0);
                    if (!prev) {
                        stageAgg.set(name, { name, count, risk, avgTime: '--', status: 'normal' });
                    } else {
                        prev.count += count;
                        prev.risk += risk;
                    }
                }

                const stageOrder = ['Initiation', 'Discovery', 'Review', 'Sign-Off', 'Pre Launch', 'Launch', 'PIR / Monitoring'];
                const staged = Array.from(stageAgg.values());
                staged.sort((a, b) => {
                    const ia = stageOrder.indexOf(a.name);
                    const ib = stageOrder.indexOf(b.name);
                    if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
                    if (ia === -1) return 1;
                    if (ib === -1) return -1;
                    return ia - ib;
                });
                for (const st of staged) {
                    st.status = st.risk > 0 ? 'danger' : (st.count > 10 ? 'warning' : 'normal');
                }
                this.pipelineStages = staged;

                // Ageing buckets → bar chart
                const maxCount = Math.max(...data.ageing.map(a => a.count), 1);
                this.ageing = data.ageing.map(a => ({
                    label: a.bucket,
                    count: a.count,
                    height: Math.max(10, Math.round((a.count / maxCount) * 120))
                }));

                // Market clusters
                const clusterColors = ['bg-emerald-500', 'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-amber-500', 'bg-rose-500'];
                this.clusters = data.clusters.map((c, i) => ({
                    name: c.cluster_name,
                    growth: (c.growth_percent >= 0 ? '+' : '') + c.growth_percent + '%',
                    count: c.npa_count,
                    color: clusterColors[i % clusterColors.length],
                    intensity: c.intensity_percent + '%'
                }));

                // Prospects
                this.prospects = data.prospects.map(p => ({
                    name: p.name,
                    theme: p.theme,
                    prob: Math.round(p.probability),
                    estValue: '$' + this.formatValue(p.estimated_value)
                }));

                // Top revenue
                this.topRevenue = data.revenue.map(r => ({
                    name: r.title,
                    owner: r.product_manager || '--',
                    stage: this.mapStage(r.current_stage),
                    revenue: '$' + this.formatValue(r.estimated_revenue),
                    progress: Math.min(100, Math.round((r.estimated_revenue / 50000000) * 100))
                }));

                // Classification Mix
                this.classificationTotal = data.classification.reduce((sum, c) => sum + c.count, 0);
                this.classificationMix = data.classification.map(c => ({
                    type: c.type || c.label, // API returns label
                    count: c.count,
                    percentage: this.classificationTotal > 0 ? Math.round((c.count / this.classificationTotal) * 100) : 0,
                    color: c.color
                }));

                // Build gradient
                if (this.classificationTotal > 0) {
                    let gradient = 'conic-gradient(';
                    let currentPct = 0;
                    this.classificationMix.forEach((c, i) => {
                        const nextPct = currentPct + c.percentage;
                        gradient += `${c.color} ${currentPct}% ${nextPct}%${i < this.classificationMix.length - 1 ? ', ' : ''}`;
                        currentPct = nextPct;
                    });
                    gradient += ')';
                    this.classificationGradient = gradient;
                } else {
                    this.classificationGradient = 'conic-gradient(#e2e8f0 0% 100%)';
                }
                this.markRequestComplete();
            },
            error: (err) => {
                console.error('[COO] Failed to load dashboard data', err);
                this.markRequestComplete();
            }
        });

        // 3. Monitoring data (parallel)
        forkJoin({
            summary: this.monitoringService.getSummary(),
            products: this.monitoringService.getProducts(),
            breaches: this.monitoringService.getBreaches(),
        }).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.monitoringSummary = data.summary;

                // Launched products → Post-Launch NPA Health table
                this.launchedNpas = data.products.map(p => ({
                    name: p.title,
                    desk: p.npa_type + (p.launched_at ? ' · Launched ' + new Date(p.launched_at).toLocaleDateString() : ' · Pre-Launch'),
                    volume: '$' + this.formatValue(p.total_volume),
                    pnl: (p.realized_pnl >= 0 ? '+$' : '-$') + this.formatValue(Math.abs(p.realized_pnl)),
                    breachCount: p.active_breaches,
                    health: p.health_status === 'healthy' ? 'Healthy' : (p.health_status === 'warning' ? 'Warning' : 'Critical')
                }));

                // Breach alerts → Recent Breaches list
                this.monitoringBreaches = data.breaches.map(b => ({
                    title: b.title,
                    severity: b.severity.toLowerCase(),
                    description: b.description,
                    product: b.npa_title || 'Unknown Product',
                    triggeredAt: this.timeAgo(b.triggered_at)
                }));
                this.markRequestComplete();
            },
            error: (err) => {
                console.error('[COO] Failed to load monitoring data', err);
                this.markRequestComplete();
            }
        });
    }

    // --- MAPPING HELPERS ---

    private mapKpis(kpis: any[]) {
        const findKpi = (label: string) => kpis.find(k => k.label.includes(label));
        const pipelineValue = findKpi('Pipeline');
        const avgCycle = findKpi('Cycle');
        const approvalRate = findKpi('Approval');
        const criticalRisks = findKpi('Critical') || findKpi('Risk');

        // Header stats — extract numeric values
        this.headerActiveNpas = Math.round(pipelineValue?.value || 0);
        this.headerApprovalRate = Math.round(approvalRate?.value || 0);
        this.headerAvgCycle = Math.round(avgCycle?.value || 0);

        // If the "42 Active NPAs" is in the subValue, parse it
        if (pipelineValue?.subValue) {
            const match = pipelineValue.subValue.match(/(\d+)/);
            if (match) this.headerActiveNpas = parseInt(match[1], 10);
        }

        const kpiColors = ['indigo', 'blue', 'emerald', 'rose'];
        const kpiIcons = ['layers', 'clock', 'check-circle', 'shield-alert'];

        this.kpis = [pipelineValue, avgCycle, approvalRate, criticalRisks]
            .filter(k => !!k)
            .map((k, i) => ({
                label: k.label,
                value: k.displayValue || String(k.value),
                subValue: k.subValue || '',
                trend: k.trend || '',
                trendUp: k.trendUp !== false,
                color: kpiColors[i] || 'slate',
                icon: kpiIcons[i] || 'activity'
            }));
    }

    private mapStage(backendStage: string): any {
        const map: any = {
            'INITIATION': 'Initiation',
            'DISCOVERY': 'Discovery',

            // Maker/Checker editing + rework
            'REVIEW': 'Review',
            'DCE_REVIEW': 'Review',
            'RETURNED_TO_MAKER': 'Review',

            // Domain assessments and parallel SOP review
            'RISK_ASSESSMENT': 'Sign-Off',
            'SIGN_OFF': 'Sign-Off',
            'PENDING_SIGN_OFFS': 'Sign-Off',

            // Post sign-off activities before the first trade / first marketed offer
            'GOVERNANCE': 'Pre Launch',
            'PENDING_FINAL_APPROVAL': 'Pre Launch',
            'APPROVED': 'Pre Launch',
            'LAUNCH_PREP': 'Pre Launch',
            'UAT': 'Pre Launch',

            // Launch and after
            'LAUNCH': 'Launch',
            'LAUNCHED': 'Launch',
            'PIR': 'PIR / Monitoring',
            'MONITORING': 'PIR / Monitoring'
        };
        return map[backendStage] || backendStage || 'Discovery';
    }

    private mapStatus(status: string): 'On Track' | 'At Risk' | 'Delayed' {
        const s = (status || '').toLowerCase();
        if (s === 'on track' || s === 'completed') return 'On Track';
        if (s === 'at risk' || s === 'warning') return 'At Risk';
        if (s === 'blocked' || s === 'delayed') return 'Delayed';
        return 'On Track';
    }

    private mapClassification(npaType: string, approvalTrack?: string): 'Complex' | 'Standard' | 'Light' {
        // Use approval_track if available for more precise mapping
        if (approvalTrack === 'FULL_NPA' || approvalTrack === 'PROHIBITED') return 'Complex';
        if (approvalTrack === 'NPA_LITE' || approvalTrack === 'EVERGREEN') return 'Light';
        if (approvalTrack === 'BUNDLING') return 'Standard';
        // Fallback to npa_type
        if (npaType === 'New-to-Group') return 'Complex';
        if (npaType === 'NPA Lite' || npaType === 'Existing') return 'Light';
        return 'Standard';
    }

    private formatValue(val: number): string {
        if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
        if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
        return '' + val;
    }

    private timeAgo(dateStr: string): string {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return hours + ' hours ago';
        const days = Math.floor(hours / 24);
        return days + (days === 1 ? ' day ago' : ' days ago');
    }

    onViewAll(section: string) {
        if (section === 'kb') {
            this.isKbOverlayOpen = true;
        }
    }

    private groupAgentsByTier() {
        const tierLabels: Record<number, string> = { 1: 'Strategic Command', 2: 'Domain Orchestration', 3: 'Specialist Workers', 4: 'Shared Utilities' };
        const tiers = [1, 2, 3, 4];
        return tiers.map(t => ({
            tier: t,
            label: tierLabels[t],
            agents: AGENT_REGISTRY.filter(a => a.tier === t)
        }));
    }
}
