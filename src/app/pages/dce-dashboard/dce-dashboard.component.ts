import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    DceService,
    DceDashboardKpis,
    DceCaseState,
    DceCaseListResponse,
} from '../../services/dce.service';
import { AGENT_REGISTRY, AgentDefinition } from '../../lib/agent-interfaces';
import { DceAgentCardComponent } from '../../components/dce/dce-agent-card.component';
import { DceAgentInvokerComponent } from '../../components/dce/dce-agent-invoker.component';

@Component({
    selector: 'app-dce-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, DceAgentCardComponent, DceAgentInvokerComponent],
    template: `
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- ═══ HEADER ═══ -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            DCE Operations Dashboard
          </h1>
          <p class="text-sm text-slate-500 mt-1">Digital Client Engagement &mdash; pipeline overview, SLA tracking, and case management.</p>
        </div>
        <div class="flex items-center gap-3" *ngIf="kpis">
          <div class="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100"
               *ngIf="kpis.sla_breaches > 0">
            {{ kpis.sla_breaches }} SLA Breaches
          </div>
          <div class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
            {{ kpis.total_cases }} Total Cases
          </div>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div *ngIf="loading" class="flex-1 flex items-center justify-center">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          <span class="text-slate-400 text-sm font-medium">Loading dashboard data...</span>
        </div>
      </div>

      <!-- ERROR STATE -->
      <div *ngIf="error" class="flex-1 flex items-center justify-center">
        <div class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-sm">
          {{ error }}
        </div>
      </div>

      <!-- ═══ DASHBOARD CONTENT ═══ -->
      <div *ngIf="!loading && !error && kpis" class="flex-1 overflow-auto p-8 space-y-6">
        <div class="max-w-7xl mx-auto space-y-6">

          <!-- ── 6 KPI CARDS ── -->
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

            <!-- Total Cases -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Cases</span>
                <span class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">#</span>
              </div>
              <div class="text-2xl font-bold text-slate-900">{{ kpis.total_cases }}</div>
            </div>

            <!-- Active -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                <span class="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                  <span class="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </span>
              </div>
              <div class="text-2xl font-bold text-green-700">{{ kpis.by_status['ACTIVE'] || 0 }}</div>
            </div>

            <!-- HITL Pending -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HITL Pending</span>
                <span class="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-yellow-600">{{ kpis.by_status['HITL_PENDING'] || 0 }}</div>
            </div>

            <!-- SLA Breaches -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SLA Breaches</span>
                <span class="w-7 h-7 rounded-lg flex items-center justify-center"
                      [ngClass]="kpis.sla_breaches > 0 ? 'bg-red-50' : 'bg-green-50'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4"
                       [ngClass]="kpis.sla_breaches > 0 ? 'text-red-600' : 'text-green-600'"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </span>
              </div>
              <div class="text-2xl font-bold" [ngClass]="kpis.sla_breaches > 0 ? 'text-red-600' : 'text-green-600'">
                {{ kpis.sla_breaches }}
              </div>
            </div>

            <!-- Avg Duration -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Duration</span>
                <span class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
              </div>
              <div class="text-2xl font-bold text-slate-900">{{ formatDuration(kpis.avg_duration_seconds) }}</div>
            </div>

            <!-- By Jurisdiction -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition-shadow">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">By Jurisdiction</span>
                <span class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
              </div>
              <div class="flex flex-wrap gap-1 mt-1">
                <span *ngFor="let j of objectKeys(kpis.by_jurisdiction)"
                      class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  {{ j }}: {{ kpis.by_jurisdiction[j] }}
                </span>
              </div>
            </div>
          </div>

          <!-- ── DCE AGENT CAPABILITIES ── -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">DCE Agent Capabilities</h2>
              <span class="text-xs text-slate-400">{{ dceAgents.length }} Agents</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <app-dce-agent-card
                *ngFor="let agent of dceAgents"
                [agent]="agent"
                (invoke)="onInvokeAgent($event)">
              </app-dce-agent-card>
            </div>
          </div>

          <!-- ── MIDDLE ROW: Status Breakdown + Priority Distribution ── -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Status Breakdown -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Status Breakdown</h2>

              <!-- Stacked bar -->
              <div class="w-full h-8 rounded-full overflow-hidden flex bg-slate-100" *ngIf="kpis.total_cases > 0">
                <div *ngFor="let s of statusKeys"
                     [style.width.%]="((kpis.by_status[s] || 0) / kpis.total_cases) * 100"
                     [ngClass]="getStatusBarColor(s)"
                     class="h-full transition-all duration-300 flex items-center justify-center"
                     [title]="s + ': ' + (kpis.by_status[s] || 0)">
                  <span class="text-[10px] font-bold text-white"
                        *ngIf="((kpis.by_status[s] || 0) / kpis.total_cases) > 0.08">
                    {{ kpis.by_status[s] || 0 }}
                  </span>
                </div>
              </div>
              <div *ngIf="kpis.total_cases === 0" class="text-sm text-slate-400">No cases yet.</div>

              <!-- Legend -->
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
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Priority Distribution</h2>
              <div class="space-y-4">
                <div *ngFor="let p of priorityKeys" class="flex items-center gap-3">
                  <span class="text-xs font-semibold text-slate-600 w-24 uppercase">{{ p }}</span>
                  <div class="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div [style.width.%]="kpis.total_cases ? ((kpis.by_priority[p] || 0) / kpis.total_cases) * 100 : 0"
                         [ngClass]="getPriorityBarColor(p)"
                         class="h-full rounded-full transition-all duration-300 flex items-center justify-center">
                      <span class="text-[10px] font-bold text-white"
                            *ngIf="kpis.total_cases && ((kpis.by_priority[p] || 0) / kpis.total_cases) > 0.08">
                        {{ kpis.by_priority[p] || 0 }}
                      </span>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-slate-500 w-8 text-right">{{ kpis.by_priority[p] || 0 }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── NODE PIPELINE ── -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Node Pipeline</h2>
            <div class="flex items-center gap-2 overflow-x-auto pb-2">
              <ng-container *ngFor="let n of nodeKeys; let last = last">
                <div class="flex flex-col items-center min-w-[120px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:shadow-md transition-shadow">
                  <div class="text-lg font-bold text-indigo-700">{{ kpis.by_node[n] || 0 }}</div>
                  <div class="text-[10px] font-bold text-slate-500 uppercase mt-1 text-center leading-tight">{{ dceService.getNodeLabel(n) }}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">{{ n }}</div>
                </div>
                <svg *ngIf="!last" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </ng-container>
            </div>
          </div>

          <!-- ── RECENT CASES TABLE ── -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Recent Cases</h2>
              <span class="text-xs text-slate-400">Showing {{ recentCases.length }} of {{ totalCases }}</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th class="px-4 py-3">Case ID</th>
                    <th class="px-4 py-3">Client</th>
                    <th class="px-4 py-3">Type</th>
                    <th class="px-4 py-3">Priority</th>
                    <th class="px-4 py-3">Node</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">SLA</th>
                    <th class="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr *ngFor="let c of recentCases"
                      [routerLink]="'/functions/dce/cases/' + c.case_id"
                      class="hover:bg-indigo-50/40 cursor-pointer transition-colors">
                    <td class="px-4 py-3 font-mono font-semibold text-indigo-700">{{ c.case_id | slice:0:12 }}...</td>
                    <td class="px-4 py-3 font-medium text-slate-800">{{ c.client_name }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ c.case_type }}</td>
                    <td class="px-4 py-3">
                      <span [ngClass]="dceService.getPriorityColor(c.priority)"
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {{ c.priority }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-600">{{ dceService.getNodeLabel(c.current_node) }}</td>
                    <td class="px-4 py-3">
                      <span [ngClass]="dceService.getStatusColor(c.status)"
                            class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {{ c.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span [ngClass]="isSlaBreached(c) ? 'text-red-600 font-bold' : 'text-slate-500'">
                        {{ c.sla_deadline | date:'MMM d, HH:mm' }}
                        <span *ngIf="isSlaBreached(c)" class="text-[9px] ml-1 text-red-500 font-bold">BREACHED</span>
                      </span>
                    </td>
                    <td class="px-4 py-3 text-slate-400">{{ c.created_at | date:'MMM d, yyyy' }}</td>
                  </tr>
                  <tr *ngIf="recentCases.length === 0">
                    <td colspan="8" class="px-4 py-8 text-center text-slate-400">No cases found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- Agent Invoker Overlay -->
      <app-dce-agent-invoker
        *ngIf="invokerAgentId"
        [agentId]="invokerAgentId"
        (close)="invokerAgentId = null"
        (completed)="onWorkflowCompleted($event)">
      </app-dce-agent-invoker>
    </div>
    `,
    styles: [`
        :host { display: block; height: 100%; }
    `]
})
export class DceDashboardComponent implements OnInit {
    dceService = inject(DceService);

    kpis: DceDashboardKpis | null = null;
    recentCases: DceCaseState[] = [];
    totalCases = 0;
    loading = true;
    error: string | null = null;
    invokerAgentId: string | null = null;
    dceAgents: AgentDefinition[] = AGENT_REGISTRY.filter(a => a.domain === 'DCE');

    statusKeys: string[] = ['ACTIVE', 'HITL_PENDING', 'ESCALATED', 'DONE', 'DEAD'];
    priorityKeys: string[] = ['URGENT', 'STANDARD', 'DEFERRED'];
    nodeKeys: string[] = ['N-0', 'N-1', 'N-2', 'N-3', 'N-4', 'N-5', 'HITL_RM', 'DONE'];

    objectKeys = Object.keys;

    ngOnInit(): void {
        this.loadDashboard();
    }

    loadDashboard(): void {
        this.loading = true;
        this.error = null;

        // Load KPIs
        this.dceService.getDashboardKpis().subscribe({
            next: (data) => {
                this.kpis = data;
                // Dynamically include any node keys returned by the API that are not in the default set
                if (data.by_node) {
                    const extra = Object.keys(data.by_node).filter(k => !this.nodeKeys.includes(k));
                    if (extra.length) {
                        this.nodeKeys = [...this.nodeKeys.filter(k => k !== 'DONE'), ...extra, 'DONE'];
                    }
                }
            },
            error: (err) => {
                this.error = 'Failed to load dashboard KPIs. ' + (err?.message || '');
                this.loading = false;
            }
        });

        // Load recent cases (last 10)
        this.dceService.listCases({ limit: 10, offset: 0 }).subscribe({
            next: (resp: DceCaseListResponse) => {
                this.recentCases = resp.cases || [];
                this.totalCases = resp.total || 0;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load cases. ' + (err?.message || '');
                this.loading = false;
            }
        });
    }

    /** Format seconds into a human-readable duration string. */
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

    /** Returns true when the case SLA deadline has passed. */
    isSlaBreached(c: DceCaseState): boolean {
        if (!c.sla_deadline) return false;
        return new Date(c.sla_deadline) < new Date();
    }

    // ── Status bar / dot color helpers for the stacked breakdown chart ───

    getStatusBarColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': 'bg-green-500',
            'HITL_PENDING': 'bg-yellow-400',
            'ESCALATED': 'bg-red-500',
            'DONE': 'bg-slate-300',
            'DEAD': 'bg-slate-200',
        };
        return colors[status] || 'bg-slate-200';
    }

    getStatusDotColor(status: string): string {
        const colors: Record<string, string> = {
            'ACTIVE': 'bg-green-500',
            'HITL_PENDING': 'bg-yellow-400',
            'ESCALATED': 'bg-red-500',
            'DONE': 'bg-slate-400',
            'DEAD': 'bg-slate-300',
        };
        return colors[status] || 'bg-slate-300';
    }

    getPriorityBarColor(priority: string): string {
        const colors: Record<string, string> = {
            'URGENT': 'bg-red-500',
            'STANDARD': 'bg-blue-500',
            'DEFERRED': 'bg-slate-400',
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
