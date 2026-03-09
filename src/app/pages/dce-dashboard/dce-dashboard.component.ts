import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import {
    DceService,
    DceDashboardKpis,
    DceCaseState,
    DceCaseListResponse,
} from '../../services/dce.service';
import { AGENT_REGISTRY, AgentDefinition } from '../../lib/agent-interfaces';
import { DceAgentCardComponent } from '../../components/dce/dce-agent-card.component';
import { DceAgentInvokerComponent } from '../../components/dce/dce-agent-invoker.component';

interface KpiMetric {
    label: string;
    value: string;
    subValue?: string;
    trend: string;
    trendUp: boolean;
    color: string;
    icon: string;
}

@Component({
    selector: 'app-dce-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule, DceAgentCardComponent, DceAgentInvokerComponent],
    template: `
    @if (loading) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    } @else {
    <div class="h-full w-full bg-slate-50/50 flex flex-col font-sans text-slate-900 relative overflow-hidden">

      <!-- ═══ HEADER ═══ -->
      <div class="bg-white border-b border-slate-200 pt-8 pb-10 px-6 sm:px-10 shadow-sm relative overflow-hidden flex-none">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">

          <!-- Identity -->
          <div class="flex items-start gap-6">
            <div class="relative group cursor-pointer">
              <!-- Avatar -->
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 ring-4 ring-white">
                 <lucide-icon name="building-2" class="w-10 h-10 text-white"></lucide-icon>
              </div>
              <!-- Pulse -->
              <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                 <div class="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white animate-pulse"></div>
              </div>
            </div>

            <div class="space-y-3">
               <div>
                  <h1 class="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                     DCE Control Tower
                     <span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 uppercase tracking-wide">Live Dashboard</span>
                  </h1>
                  <p class="text-lg text-slate-500 max-w-2xl leading-relaxed mt-1">
                     Digital Client Engagement &mdash; Account Opening pipeline, SLA tracking, 7-node DAG orchestration across 8 specialist agents.
                  </p>
               </div>

               <!-- Key Stats Badges -->
               <div class="flex items-center gap-6 text-sm font-medium text-slate-600 bg-slate-50 inline-flex px-4 py-2 rounded-lg border border-slate-200/60" *ngIf="kpis">
                  <span class="flex items-center gap-1.5 hover:text-indigo-600 transition-colors cursor-help">
                     <lucide-icon name="layers" class="w-4 h-4 text-indigo-500"></lucide-icon>
                     {{ kpis.by_status['ACTIVE'] || 0 }} Active Cases
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-amber-600 transition-colors cursor-help">
                     <lucide-icon name="clock" class="w-4 h-4 text-amber-500"></lucide-icon>
                     {{ kpis.by_status['HITL_PENDING'] || 0 }} HITL Pending
                  </span>
                  <div class="w-px h-4 bg-slate-300"></div>
                  <span class="flex items-center gap-1.5 hover:text-blue-600 transition-colors cursor-help">
                     <lucide-icon name="clock" class="w-4 h-4 text-blue-500"></lucide-icon>
                     {{ formatDuration(kpis.avg_duration_seconds) }} Avg Cycle
                  </span>
               </div>
            </div>
          </div>

          <!-- Primary CTA -->
          <div class="flex flex-col gap-3 w-full md:w-auto">
             <button (click)="navigateToCreate()" class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 focus:ring-4 focus:ring-indigo-100">
                <lucide-icon name="plus" class="w-6 h-6"></lucide-icon>
                New Case
             </button>
             <div class="grid grid-cols-2 gap-2">
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                </button>
                <button class="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2">
                   <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Filter
                </button>
             </div>
          </div>
        </div>
      </div>

      <!-- ═══ TABS ═══ -->
      <div class="border-b border-slate-200 bg-white">
         <div class="flex w-full max-w-7xl mx-auto px-6 sm:px-10 overflow-x-auto hide-scrollbar">
            <button *ngFor="let tab of tabList"
               [class.border-slate-900]="activeTab === tab.id"
               [class.text-slate-900]="activeTab === tab.id"
               [class.border-transparent]="activeTab !== tab.id"
               [class.text-slate-500]="activeTab !== tab.id"
               (click)="activeTab = tab.id"
               class="flex-1 flex items-center justify-center px-2 py-3 text-sm font-semibold border-b-2 hover:text-slate-900 transition-colors whitespace-nowrap gap-2">
               {{ tab.label }}
               <span *ngIf="tab.badge" class="px-1.5 py-0.5 rounded-full text-[10px] font-bold" [ngClass]="tab.badgeClass || 'bg-slate-100 text-slate-600 border border-slate-200'">{{ tab.badge }}</span>
            </button>
         </div>
      </div>

      <!-- ═══ BODY ═══ -->
      <div class="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-8 relative z-10 scrollbar-thin max-w-7xl mx-auto w-full">

         <!-- ═══ OVERVIEW TAB ═══ -->
         <div *ngIf="activeTab === 'overview'" class="space-y-8">

            <!-- 1. KPI CARDS (enriched, like NPA) -->
            <div class="grid grid-cols-4 gap-6">
               <div *ngFor="let kpi of kpiCards" class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
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

            <!-- 2. CHARTS ROW: Jurisdiction Donut + Pipeline Flow + SLA Ageing -->
            <div class="grid grid-cols-12 gap-6" *ngIf="kpis">

                <!-- LEFT: Donut Chart (Jurisdiction) -->
                <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <lucide-icon name="pie-chart" class="w-4 h-4 text-slate-400"></lucide-icon> By Jurisdiction
                    </h3>
                    <div class="flex-1 flex flex-col items-center justify-center relative">
                        <div class="w-40 h-40 rounded-full relative" [style.background]="jurisdictionGradient">
                            <div class="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                                <span class="text-3xl font-bold text-slate-900">{{ kpis.total_cases }}</span>
                                <span class="text-[10px] font-bold text-slate-400 uppercase">Total Cases</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 space-y-3">
                        <div *ngFor="let jm of jurisdictionMix" class="flex items-center justify-between text-xs">
                            <div class="flex items-center gap-2">
                                <div class="w-2.5 h-2.5 rounded-full" [style.background-color]="jm.color"></div>
                                <span class="font-medium text-slate-600">{{ jm.label }}</span>
                            </div>
                            <span class="font-bold text-slate-900">{{ jm.pct }}%</span>
                        </div>
                    </div>
                </div>

                <!-- MIDDLE: Pipeline Flow (Visual) -->
                <div class="col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-8">
                        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                           <lucide-icon name="git-merge" class="w-4 h-4 text-slate-400"></lucide-icon> Pipeline Flow
                        </h3>
                        <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Avg Cycle: {{ formatDuration(kpis.avg_duration_seconds) }}</span>
                    </div>
                    <div class="flex-1 flex items-center relative px-2">
                        <div class="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                        <div class="w-full flex justify-between relative z-10">
                            <div *ngFor="let stage of pipelineStages" class="flex flex-col items-center gap-3 group cursor-pointer relative">
                                <div class="w-12 h-12 rounded-xl border-2 bg-white flex items-center justify-center shadow-sm transition-all duration-300"
                                     [ngClass]="{
                                         'border-slate-200 text-slate-400 group-hover:border-slate-300': stage.status === 'normal',
                                         'border-amber-400 text-amber-600 shadow-amber-100 bg-amber-50': stage.status === 'warning',
                                         'border-rose-500 text-rose-600 shadow-rose-100 bg-rose-50': stage.status === 'danger',
                                         'border-emerald-500 text-emerald-600 shadow-emerald-100 bg-emerald-50': stage.status === 'success'
                                     }">
                                     <span class="text-lg font-bold">{{ stage.count }}</span>
                                </div>
                                <div class="text-center space-y-0.5">
                                    <div class="text-xs font-bold text-slate-900">{{ stage.label }}</div>
                                    <div class="text-[10px] font-mono text-slate-400">{{ stage.nodeId }}</div>
                                </div>
                                <div *ngIf="stage.hitl" class="absolute -top-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-bounce">
                                    HITL
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT: SLA Ageing Bar Chart -->
                <div class="col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <lucide-icon name="clock" class="w-4 h-4 text-slate-400"></lucide-icon> Case Ageing
                    </h3>
                    <div class="flex-1 flex items-end justify-between gap-3 min-h-[160px]">
                        <div *ngFor="let age of ageingBuckets" class="flex-1 flex flex-col items-center gap-2 group">
                            <div class="text-[10px] font-bold text-slate-900 mb-1">{{ age.count }}</div>
                            <div class="w-full rounded-t-lg group-hover:opacity-80 transition-all duration-300" [ngClass]="age.barColor" [style.height.px]="age.height"></div>
                            <div class="text-[10px] font-bold text-slate-400 uppercase text-center leading-tight">{{ age.label }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. STATUS / PRIORITY ROW -->
            <div class="grid grid-cols-2 gap-6" *ngIf="kpis">
                <!-- Status Breakdown -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <lucide-icon name="bar-chart-3" class="w-4 h-4 text-slate-400"></lucide-icon> Status Breakdown
                    </h3>
                    <div class="w-full h-8 rounded-full overflow-hidden flex bg-slate-100" *ngIf="kpis.total_cases > 0">
                      <div *ngFor="let s of statusKeys"
                           [style.width.%]="((kpis.by_status[s] || 0) / kpis.total_cases) * 100"
                           [ngClass]="getStatusBarColor(s)"
                           class="h-full transition-all duration-300 flex items-center justify-center"
                           [title]="s + ': ' + (kpis.by_status[s] || 0)">
                        <span class="text-[10px] font-bold text-white" *ngIf="((kpis.by_status[s] || 0) / kpis.total_cases) > 0.08">{{ kpis.by_status[s] || 0 }}</span>
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-4 mt-4">
                      <div *ngFor="let s of statusKeys" class="flex items-center gap-2 text-xs">
                        <span class="w-3 h-3 rounded-full" [ngClass]="getStatusDotColor(s)"></span>
                        <span class="text-slate-600 font-medium">{{ s.replace('_', ' ') }}</span>
                        <span class="text-slate-900 font-bold">{{ kpis.by_status[s] || 0 }}</span>
                      </div>
                    </div>
                </div>

                <!-- Priority Distribution -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 class="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <lucide-icon name="bar-chart-2" class="w-4 h-4 text-slate-400"></lucide-icon> Priority Distribution
                    </h3>
                    <div class="space-y-4">
                      <div *ngFor="let p of priorityKeys" class="flex items-center gap-3">
                        <span class="text-xs font-semibold text-slate-600 w-24 uppercase">{{ p }}</span>
                        <div class="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div [style.width.%]="kpis.total_cases ? ((kpis.by_priority[p] || 0) / kpis.total_cases) * 100 : 0"
                               [ngClass]="getPriorityBarColor(p)"
                               class="h-full rounded-full transition-all duration-300 flex items-center justify-center">
                            <span class="text-[10px] font-bold text-white" *ngIf="kpis.total_cases && ((kpis.by_priority[p] || 0) / kpis.total_cases) > 0.08">{{ kpis.by_priority[p] || 0 }}</span>
                          </div>
                        </div>
                        <span class="text-xs font-bold text-slate-500 w-8 text-right">{{ kpis.by_priority[p] || 0 }}</span>
                      </div>
                    </div>
                </div>
            </div>

            <!-- 4. DATA GRID & RECENT ALERTS -->
            <div class="grid grid-cols-12 gap-6">

                <!-- MAIN TABLE -->
                <div class="col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                                <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                            </div>
                            <h3 class="text-sm font-bold text-slate-900">Active Cases Queue</h3>
                            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{{ recentCases.length }} Shown</span>
                        </div>
                        <div class="flex gap-2">
                            <input type="text" placeholder="Search cases..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-48 transition-all">
                        </div>
                    </div>
                    <div class="flex-1 overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm">
                                <tr>
                                    <th class="px-6 py-3 w-1/3">Client</th>
                                    <th class="px-6 py-3">Node & Type</th>
                                    <th class="px-6 py-3 text-right">Age</th>
                                    <th class="px-6 py-3 text-center">Status</th>
                                    <th class="px-6 py-3"></th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr *ngFor="let row of recentCases.slice(0, 6)"
                                    [routerLink]="['/agents/dce']" [queryParams]="{ mode: 'detail', caseId: row.case_id }"
                                    class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                    <td class="px-6 py-4">
                                        <div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ row.client_name }}</div>
                                        <div class="flex items-center gap-2 mt-1">
                                           <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                                                 [ngClass]="dceService.getPriorityColor(row.priority)">{{ row.priority }}</span>
                                           <span class="text-[10px] text-slate-400">{{ row.jurisdiction }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <div class="text-slate-700 font-medium">{{ dceService.getNodeLabel(row.current_node) }}</div>
                                        <div class="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                                            <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div> {{ row.case_type }}
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-right font-mono text-slate-500 font-medium">{{ getCaseAge(row) }}d</td>
                                    <td class="px-6 py-4 text-center">
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                                              [ngClass]="getStatusBadgeClass(row.status)">
                                            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getStatusDotColor(row.status)"></span>
                                            {{ row.status.replace('_', ' ') }}
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
                        <span class="text-xs text-slate-500 font-medium">Showing {{ (recentCases.length > 6 ? 6 : recentCases.length) }} of {{ totalCases }}</span>
                        <button (click)="activeTab = 'case-pool'" class="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700">View All</button>
                    </div>
                </div>

                <!-- RIGHT: SLA / Alerts -->
                <div class="col-span-4 space-y-6">
                    <!-- SLA Breaches Card (dark) -->
                    <div class="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800 relative">
                        <div class="absolute top-0 right-0 p-24 bg-rose-600/20 rounded-full blur-3xl -mr-12 -mt-12"></div>
                        <div class="px-6 py-5 border-b border-white/10 relative z-10 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                               <lucide-icon name="alert-triangle" class="w-4 h-4 text-rose-400"></lucide-icon> SLA Health
                            </h3>
                            <span class="text-[10px] font-bold text-slate-400 bg-white/10 px-2 py-1 rounded">LIVE</span>
                        </div>
                        <div class="divide-y divide-white/5 relative z-10">
                            <div class="p-5 flex justify-between items-center">
                                <div>
                                    <div class="text-3xl font-bold" [ngClass]="kpis && kpis.sla_breaches > 0 ? 'text-rose-400' : 'text-emerald-400'">{{ kpis?.sla_breaches || 0 }}</div>
                                    <div class="text-[10px] text-slate-400 uppercase font-bold mt-1">Active Breaches</div>
                                </div>
                                <div class="w-16 h-16 rounded-xl flex items-center justify-center" [ngClass]="kpis && kpis.sla_breaches > 0 ? 'bg-rose-500/20' : 'bg-emerald-500/20'">
                                    <lucide-icon [name]="kpis && kpis.sla_breaches > 0 ? 'shield-alert' : 'shield-check'" class="w-8 h-8" [ngClass]="kpis && kpis.sla_breaches > 0 ? 'text-rose-400' : 'text-emerald-400'"></lucide-icon>
                                </div>
                            </div>
                            <div *ngFor="let c of breachedCases.slice(0, 3)" class="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                <div class="flex justify-between items-start mb-1">
                                    <h4 class="font-bold text-white text-xs truncate max-w-[160px]">{{ c.client_name }}</h4>
                                    <span class="text-[10px] font-bold text-rose-400">BREACHED</span>
                                </div>
                                <div class="text-[10px] text-slate-400">{{ dceService.getNodeLabel(c.current_node) }} &bull; {{ c.jurisdiction }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Alerts -->
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                         <div class="flex items-center gap-2 mb-4">
                             <lucide-icon name="bell" class="w-4 h-4 text-slate-400"></lucide-icon>
                             <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Alerts</h4>
                         </div>
                         <div class="space-y-3">
                             <div class="flex gap-3 items-start">
                                 <div class="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-none"></div>
                                 <div>
                                     <p class="text-xs font-semibold text-slate-800">KYC Screening Escalation</p>
                                     <p class="text-[10px] text-slate-500">Temasek Holdings &bull; 2h ago</p>
                                 </div>
                             </div>
                             <div class="flex gap-3 items-start">
                                 <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-none"></div>
                                 <div>
                                     <p class="text-xs font-semibold text-slate-800">Document Resubmission Required</p>
                                     <p class="text-[10px] text-slate-500">CapitaLand Investment &bull; 5h ago</p>
                                 </div>
                             </div>
                             <div class="flex gap-3 items-start">
                                 <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-none"></div>
                                 <div>
                                     <p class="text-xs font-semibold text-slate-800">Credit Decision Pending TMO</p>
                                     <p class="text-[10px] text-slate-500">Jardine Matheson &bull; 1d ago</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>

         </div>
         <!-- END OVERVIEW TAB -->

         <!-- ═══ CASE POOL TAB ═══ -->
         <div *ngIf="activeTab === 'case-pool'" class="space-y-6">
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="p-1.5 bg-slate-100 rounded text-slate-500">
                            <lucide-icon name="list" class="w-4 h-4"></lucide-icon>
                        </div>
                        <h3 class="text-sm font-bold text-slate-900">Complete Case Pool</h3>
                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">{{ totalCases }} Total</span>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" placeholder="Search cases..." class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-200 w-64 transition-all">
                        <button class="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2">
                            <lucide-icon name="download" class="w-3.5 h-3.5"></lucide-icon> Export
                        </button>
                    </div>
                </div>
                <div class="flex-1 overflow-x-auto scrollbar-thin">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold backdrop-blur-sm sticky top-0">
                            <tr>
                                <th class="px-4 py-3">Case ID</th>
                                <th class="px-4 py-3">Client</th>
                                <th class="px-4 py-3">Type</th>
                                <th class="px-4 py-3">Jurisdiction</th>
                                <th class="px-4 py-3">Priority</th>
                                <th class="px-4 py-3">Node</th>
                                <th class="px-4 py-3 text-center">Status</th>
                                <th class="px-4 py-3">SLA</th>
                                <th class="px-4 py-3 text-right">Age</th>
                                <th class="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 bg-white">
                            <tr *ngFor="let c of recentCases"
                                [routerLink]="['/agents/dce']" [queryParams]="{ mode: 'detail', caseId: c.case_id }"
                                class="hover:bg-slate-50 transition-colors group cursor-pointer">
                                <td class="px-4 py-4"><div class="font-mono text-xs text-indigo-600 font-semibold">{{ c.case_id | slice:0:16 }}</div></td>
                                <td class="px-4 py-4"><div class="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{{ c.client_name }}</div></td>
                                <td class="px-4 py-4 text-slate-700">{{ c.case_type }}</td>
                                <td class="px-4 py-4 text-slate-700">{{ c.jurisdiction }}</td>
                                <td class="px-4 py-4">
                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border" [ngClass]="dceService.getPriorityColor(c.priority)">{{ c.priority }}</span>
                                </td>
                                <td class="px-4 py-4 text-slate-700 text-[11px]">{{ dceService.getNodeLabel(c.current_node) }}</td>
                                <td class="px-4 py-4 text-center">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" [ngClass]="getStatusBadgeClass(c.status)">
                                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getStatusDotColor(c.status)"></span>
                                        {{ c.status.replace('_', ' ') }}
                                    </span>
                                </td>
                                <td class="px-4 py-4">
                                    <span [ngClass]="isSlaBreached(c) ? 'text-red-600 font-bold' : 'text-slate-500'">
                                      {{ c.sla_deadline | date:'MMM d' }}
                                      <span *ngIf="isSlaBreached(c)" class="text-[9px] ml-1 text-red-500 font-bold">BREACHED</span>
                                    </span>
                                </td>
                                <td class="px-4 py-4 text-right font-mono text-slate-500 font-medium">{{ getCaseAge(c) }}d</td>
                                <td class="px-4 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button class="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
                                        <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span class="text-xs text-slate-500 font-medium">Showing {{ recentCases.length }} of {{ totalCases }} cases</span>
                </div>
            </div>
         </div>
         <!-- END CASE POOL TAB -->

         <!-- ═══ AGENTS TAB ═══ -->
         <div *ngIf="activeTab === 'agents'" class="space-y-6">

            <!-- Agent Fleet Status -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div class="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                     <div class="p-1.5 bg-indigo-100 rounded text-indigo-600">
                        <lucide-icon name="brain-circuit" class="w-4 h-4"></lucide-icon>
                     </div>
                     <h3 class="text-sm font-bold text-slate-900">DCE Agent Fleet</h3>
                     <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100">{{ dceAgents.length }} Agents</span>
                  </div>
               </div>
               <div class="p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <app-dce-agent-card
                       *ngFor="let agent of dceAgents"
                       [agent]="agent"
                       (invoke)="onInvokeAgent($event)">
                     </app-dce-agent-card>
                  </div>
               </div>
            </div>
         </div>
         <!-- END AGENTS TAB -->

         <!-- ═══ PIPELINE TAB ═══ -->
         <div *ngIf="activeTab === 'pipeline'" class="space-y-6">
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <lucide-icon name="git-branch" class="w-4 h-4 text-slate-400"></lucide-icon> 7-Node DAG Pipeline
                </h2>
                <div class="flex items-center gap-2 overflow-x-auto pb-4">
                  <ng-container *ngFor="let n of nodeKeys; let last = last">
                    <div class="flex flex-col items-center min-w-[130px] px-5 py-4 rounded-xl border bg-slate-50 hover:shadow-md transition-shadow"
                         [ngClass]="(kpis?.by_node?.[n] || 0) > 0 ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'">
                      <div class="text-2xl font-bold text-indigo-700">{{ kpis?.by_node?.[n] || 0 }}</div>
                      <div class="text-[10px] font-bold text-slate-500 uppercase mt-1 text-center leading-tight">{{ dceService.getNodeLabel(n) }}</div>
                      <div class="text-[10px] text-slate-400 mt-0.5 font-mono">{{ n }}</div>
                    </div>
                    <svg *ngIf="!last" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </ng-container>
                </div>
            </div>

            <!-- Cases by node -->
            <div *ngFor="let n of nodeKeys" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 flex items-center gap-3" *ngIf="getCasesForNode(n).length > 0">
                    <span class="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">{{ n }}</span>
                    <h3 class="text-sm font-bold text-slate-900">{{ dceService.getNodeLabel(n) }}</h3>
                    <span class="text-xs text-slate-400">{{ getCasesForNode(n).length }} cases</span>
                </div>
                <div *ngFor="let c of getCasesForNode(n)" class="px-6 py-3 flex items-center justify-between border-b border-slate-50 last:border-none hover:bg-slate-50 cursor-pointer transition-colors"
                     [routerLink]="['/agents/dce']" [queryParams]="{ mode: 'detail', caseId: c.case_id }">
                    <div class="flex items-center gap-4">
                        <span class="font-bold text-sm text-slate-800">{{ c.client_name }}</span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border" [ngClass]="dceService.getPriorityColor(c.priority)">{{ c.priority }}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-xs text-slate-500">{{ c.jurisdiction }}</span>
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border" [ngClass]="getStatusBadgeClass(c.status)">
                            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getStatusDotColor(c.status)"></span>
                            {{ c.status.replace('_', ' ') }}
                        </span>
                    </div>
                </div>
            </div>
         </div>
         <!-- END PIPELINE TAB -->

      </div>

      <!-- Agent Invoker Overlay -->
      <app-dce-agent-invoker
        *ngIf="invokerAgentId"
        [agentId]="invokerAgentId"
        (close)="invokerAgentId = null"
        (completed)="onWorkflowCompleted($event)">
      </app-dce-agent-invoker>
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
export class DceDashboardComponent implements OnInit {
    dceService = inject(DceService);
    private router = inject(Router);

    kpis: DceDashboardKpis | null = null;
    recentCases: DceCaseState[] = [];
    totalCases = 0;
    loading = true;
    invokerAgentId: string | null = null;
    dceAgents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.domain === 'DCE');

    activeTab: 'overview' | 'case-pool' | 'pipeline' | 'agents' = 'overview';
    tabList = [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'case-pool' as const, label: 'Case Pool' },
        { id: 'pipeline' as const, label: 'Pipeline' },
        { id: 'agents' as const, label: 'Agents', badge: String(AGENT_REGISTRY.filter(a => a.domain === 'DCE').length), badgeClass: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
    ];

    statusKeys: string[] = ['ACTIVE', 'HITL_PENDING', 'ESCALATED', 'DONE', 'DEAD'];
    priorityKeys: string[] = ['URGENT', 'STANDARD', 'DEFERRED'];
    nodeKeys: string[] = ['N-0', 'N-1', 'N-2', 'N-3', 'N-4', 'N-5', 'N-6', 'HITL_RM', 'DONE'];

    kpiCards: KpiMetric[] = [];
    jurisdictionMix: { label: string; pct: number; color: string }[] = [];
    jurisdictionGradient = 'conic-gradient(#e2e8f0 0% 100%)';
    pipelineStages: { nodeId: string; label: string; count: number; status: string; hitl: boolean }[] = [];
    ageingBuckets: { label: string; count: number; height: number; barColor: string }[] = [];
    breachedCases: DceCaseState[] = [];

    ngOnInit(): void {
        this.loadDashboard();
    }

    navigateToCreate(): void {
        this.router.navigate(['/agents/dce'], { queryParams: { mode: 'create' } });
    }

    loadDashboard(): void {
        this.loading = true;

        this.dceService.getDashboardKpis().subscribe({
            next: (data) => {
                this.kpis = data;
                if (data.by_node) {
                    const extra = Object.keys(data.by_node).filter(k => !this.nodeKeys.includes(k));
                    if (extra.length) {
                        this.nodeKeys = [...this.nodeKeys.filter(k => k !== 'DONE'), ...extra, 'DONE'];
                    }
                }
                this.buildDerivedData();
            },
            error: () => {
                this.kpis = this.getMockKpis();
                this.buildDerivedData();
            }
        });

        this.dceService.listCases({ limit: 50, offset: 0 }).subscribe({
            next: (resp: DceCaseListResponse) => {
                this.recentCases = resp.cases || [];
                this.totalCases = resp.total || 0;
                this.breachedCases = this.recentCases.filter(c => this.isSlaBreached(c));
                this.loading = false;
            },
            error: () => {
                const mock = this.getMockCases();
                this.recentCases = mock;
                this.totalCases = mock.length;
                this.breachedCases = this.recentCases.filter(c => this.isSlaBreached(c));
                this.loading = false;
            }
        });
    }

    private buildDerivedData(): void {
        if (!this.kpis) return;
        this.buildKpiCards();
        this.buildJurisdictionDonut();
        this.buildPipelineStages();
        this.buildAgeingBuckets();
    }

    private buildKpiCards(): void {
        if (!this.kpis) return;
        this.kpiCards = [
            { label: 'Total Cases', value: String(this.kpis.total_cases), trend: '+12%', trendUp: true, color: 'indigo', icon: 'layers' },
            { label: 'Active', value: String(this.kpis.by_status['ACTIVE'] || 0), subValue: 'cases', trend: '+8%', trendUp: true, color: 'emerald', icon: 'activity' },
            { label: 'HITL Pending', value: String(this.kpis.by_status['HITL_PENDING'] || 0), subValue: 'awaiting', trend: '-3%', trendUp: false, color: 'amber', icon: 'clock' },
            { label: 'SLA Breaches', value: String(this.kpis.sla_breaches), trend: this.kpis.sla_breaches > 0 ? '+2' : '0', trendUp: this.kpis.sla_breaches === 0, color: this.kpis.sla_breaches > 0 ? 'rose' : 'emerald', icon: 'shield-alert' },
        ];
    }

    private buildJurisdictionDonut(): void {
        if (!this.kpis) return;
        const jur = this.kpis.by_jurisdiction;
        const total = this.kpis.total_cases || 1;
        const colors: Record<string, string> = { SGP: '#6366f1', HKG: '#8b5cf6', CHN: '#ec4899', OTHER: '#94a3b8' };
        const entries = Object.entries(jur).sort((a, b) => b[1] - a[1]);
        this.jurisdictionMix = entries.map(([k, v]) => ({
            label: k, pct: Math.round((v / total) * 100), color: colors[k] || '#94a3b8'
        }));
        let cumPct = 0;
        const stops = entries.map(([k, v]) => {
            const start = cumPct;
            const pct = (v / total) * 100;
            cumPct += pct;
            return `${colors[k] || '#94a3b8'} ${start}% ${cumPct}%`;
        });
        this.jurisdictionGradient = `conic-gradient(${stops.join(', ')})`;
    }

    private buildPipelineStages(): void {
        if (!this.kpis) return;
        const nodes = ['N-0', 'N-1', 'N-2', 'N-3', 'N-4', 'N-5', 'N-6'];
        const labels = ['Intake', 'Docs', 'Signatures', 'KYC', 'Credit', 'Config', 'Notify'];
        const hitlNodes = new Set(['N-2', 'N-3', 'N-4', 'N-5']);
        this.pipelineStages = nodes.map((n, i) => {
            const count = this.kpis!.by_node[n] || 0;
            let status = 'normal';
            if (count > 5) status = 'warning';
            if (count > 10) status = 'danger';
            if (count === 0) status = 'success';
            return { nodeId: n, label: labels[i], count, status, hitl: hitlNodes.has(n) && count > 0 };
        });
    }

    private buildAgeingBuckets(): void {
        const buckets = [
            { label: '0-2d', count: 8, barColor: 'bg-indigo-500' },
            { label: '3-5d', count: 12, barColor: 'bg-indigo-500' },
            { label: '6-10d', count: 9, barColor: 'bg-amber-500' },
            { label: '11-20d', count: 7, barColor: 'bg-amber-500' },
            { label: '20d+', count: 6, barColor: 'bg-rose-500' },
        ];
        const maxCount = Math.max(...buckets.map(b => b.count), 1);
        this.ageingBuckets = buckets.map(b => ({
            ...b,
            height: Math.max(10, Math.round((b.count / maxCount) * 120))
        }));
    }

    getCaseAge(c: DceCaseState): number {
        if (!c.created_at) return 0;
        return Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
    }

    getCasesForNode(nodeId: string): DceCaseState[] {
        return this.recentCases.filter(c => c.current_node === nodeId);
    }

    // ── Mock data ──────────────────────────────────────────────────────

    private getMockKpis(): DceDashboardKpis {
        return {
            total_cases: 42,
            by_status: { ACTIVE: 18, HITL_PENDING: 9, ESCALATED: 3, DONE: 11, DEAD: 1 },
            by_priority: { URGENT: 6, STANDARD: 28, DEFERRED: 8 },
            by_jurisdiction: { SGP: 22, HKG: 12, CHN: 5, OTHER: 3 },
            by_node: { 'N-0': 4, 'N-1': 6, 'N-2': 5, 'N-3': 7, 'N-4': 3, 'N-5': 2, 'N-6': 1, 'HITL_RM': 3, 'DONE': 11 },
            sla_breaches: 2,
            avg_duration_seconds: 172800,
        };
    }

    private getMockCases(): DceCaseState[] {
        const now = new Date();
        const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400000).toISOString();
        const sla = (daysAhead: number) => new Date(now.getTime() + daysAhead * 86400000).toISOString();
        const c = (id: string, client: string, type: string, pri: DceCaseState['priority'], node: string, st: DceCaseState['status'], jur: DceCaseState['jurisdiction'], slaDays: number, daysAgo: number, done: string[]): DceCaseState => ({
            case_id: id, client_name: client, case_type: type, priority: pri, current_node: node, status: st,
            jurisdiction: jur, sla_deadline: sla(slaDays), created_at: d(daysAgo), updated_at: d(daysAgo),
            completed_nodes: done, failed_nodes: [], retry_counts: {}, rm_id: 'RM-001', hitl_queue: null, event_count: 0,
        });
        return [
            c('DCE-2026-0042-SGP-001', 'Temasek Holdings Pte Ltd',    'Corporate',     'URGENT',   'N-3',  'HITL_PENDING', 'SGP', -1,  5, ['N-0','N-1','N-2']),
            c('DCE-2026-0041-HKG-002', 'Li & Fung Trading Ltd',       'Corporate',     'STANDARD', 'N-4',  'ACTIVE',       'HKG',  3,  4, ['N-0','N-1','N-2','N-3']),
            c('DCE-2026-0040-SGP-003', 'Mapletree Investments Pte Ltd','Corporate',     'STANDARD', 'N-1',  'ACTIVE',       'SGP',  5,  3, ['N-0']),
            c('DCE-2026-0039-HKG-004', 'Jardine Matheson Holdings',   'Corporate',     'URGENT',   'N-5',  'HITL_PENDING', 'HKG',  1,  7, ['N-0','N-1','N-2','N-3','N-4']),
            c('DCE-2026-0038-SGP-005', 'CapitaLand Investment Ltd',    'Institutional', 'STANDARD', 'N-2',  'ACTIVE',       'SGP',  4,  2, ['N-0','N-1']),
            c('DCE-2026-0037-CHN-006', 'CITIC Securities Co Ltd',     'Institutional', 'DEFERRED', 'N-0',  'ACTIVE',       'CHN', 10,  1, []),
            c('DCE-2026-0036-HKG-007', 'Sun Hung Kai Properties',     'Corporate',     'STANDARD', 'DONE', 'DONE',         'HKG',  0, 14, ['N-0','N-1','N-2','N-3','N-4','N-5','N-6']),
            c('DCE-2026-0035-SGP-008', 'GIC Private Limited',         'Sovereign',     'URGENT',   'N-6',  'ACTIVE',       'SGP',  2,  6, ['N-0','N-1','N-2','N-3','N-4','N-5']),
            c('DCE-2026-0034-OTHER-09','HSBC Asset Management',       'Institutional', 'STANDARD', 'N-3',  'ESCALATED',    'OTHER',-2, 10, ['N-0','N-1','N-2']),
            c('DCE-2026-0033-SGP-010', 'Olam Group Limited',          'Corporate',     'DEFERRED', 'DONE', 'DONE',         'SGP',  0, 21, ['N-0','N-1','N-2','N-3','N-4','N-5','N-6']),
        ];
    }

    // ── Formatting helpers ─────────────────────────────────────────────

    formatDuration(seconds: number): string {
        if (!seconds || seconds <= 0) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remHours = hours % 24;
            return `${days}d ${remHours}h`;
        }
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    isSlaBreached(c: DceCaseState): boolean {
        if (!c.sla_deadline) return false;
        return new Date(c.sla_deadline) < new Date();
    }

    getStatusBarColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': 'bg-green-500', 'HITL_PENDING': 'bg-yellow-400',
            'ESCALATED': 'bg-red-500', 'DONE': 'bg-slate-300', 'DEAD': 'bg-slate-200',
        };
        return colors[status] || 'bg-slate-200';
    }

    getStatusDotColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': 'bg-green-500', 'HITL_PENDING': 'bg-yellow-400',
            'ESCALATED': 'bg-red-500', 'DONE': 'bg-slate-400', 'DEAD': 'bg-slate-300',
        };
        return colors[status] || 'bg-slate-300';
    }

    getStatusBadgeClass(status: string): string {
        const map: Record<string, string> = {
            'ACTIVE': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'HITL_PENDING': 'bg-amber-50 text-amber-700 border-amber-100',
            'ESCALATED': 'bg-rose-50 text-rose-700 border-rose-100',
            'DONE': 'bg-slate-50 text-slate-600 border-slate-200',
            'DEAD': 'bg-slate-50 text-slate-400 border-slate-200',
        };
        return map[status] || 'bg-slate-50 text-slate-600 border-slate-200';
    }

    getPriorityBarColor(priority: string): string {
        const colors: Record<string, string> = {
            'URGENT': 'bg-red-500', 'STANDARD': 'bg-blue-500', 'DEFERRED': 'bg-slate-400',
        };
        return colors[priority] || 'bg-slate-400';
    }

    onInvokeAgent(agentId: string): void {
        this.invokerAgentId = agentId;
    }

    onWorkflowCompleted(_result: any): void {
        this.loadDashboard();
    }
}
