import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
    DceService,
    DceCaseState,
    DceCaseFilters,
    DceCaseListResponse,
} from '../../services/dce.service';

@Component({
    selector: 'app-dce-case-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    @if (loading()) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    } @else {
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">DCE Case Pipeline</h1>
          <p class="text-sm text-slate-500 mt-1">Digital Client Engagement &mdash; end-to-end onboarding cases.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
            {{ totalCases }} Total
          </div>
        </div>
      </div>

      <!-- FILTER BAR -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-3">
        <div class="flex items-center gap-4 flex-wrap">

          <!-- Status -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
            <select [(ngModel)]="filterStatus" (ngModelChange)="onFilterChange()"
                    class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="HITL_PENDING">HITL Pending</option>
              <option value="ESCALATED">Escalated</option>
              <option value="DONE">Done</option>
              <option value="DEAD">Dead</option>
            </select>
          </div>

          <!-- Priority -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority</label>
            <select [(ngModel)]="filterPriority" (ngModelChange)="onFilterChange()"
                    class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
              <option value="">All</option>
              <option value="URGENT">Urgent</option>
              <option value="STANDARD">Standard</option>
              <option value="DEFERRED">Deferred</option>
            </select>
          </div>

          <!-- Jurisdiction -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</label>
            <select [(ngModel)]="filterJurisdiction" (ngModelChange)="onFilterChange()"
                    class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
              <option value="">All</option>
              <option value="SGP">SGP</option>
              <option value="HKG">HKG</option>
              <option value="CHN">CHN</option>
            </select>
          </div>

          <!-- Current Node -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Node</label>
            <select [(ngModel)]="filterNode" (ngModelChange)="onFilterChange()"
                    class="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400">
              <option value="">All</option>
              <option value="N-0">N-0 Intake &amp; Triage</option>
              <option value="N-1">N-1 Document Collection</option>
              <option value="N-2">N-2 KYC/CDD Assessment</option>
              <option value="HITL_RM">HITL_RM Pending RM Action</option>
            </select>
          </div>

          <!-- Reset -->
          <div class="flex flex-col gap-1">
            <label class="text-[10px] text-transparent">Reset</label>
            <button (click)="resetFilters()"
                    class="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 overflow-auto p-8">
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Case ID</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Client Name</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Account Type</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Node</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Deadline</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of cases"
                  [routerLink]="['/functions/dce/cases', c.case_id]"
                  class="border-b border-slate-100 hover:bg-blue-50/40 cursor-pointer transition-colors">
                <td class="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{{ c.case_id }}</td>
                <td class="px-4 py-3 font-medium text-slate-800">{{ c.client_name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ c.case_type }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        [ngClass]="dceService.getPriorityColor(c.priority)">
                    {{ c.priority }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700">
                    {{ c.current_node }}
                  </span>
                  <span class="ml-1.5 text-xs text-slate-400">{{ dceService.getNodeLabel(c.current_node) }}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        [ngClass]="dceService.getStatusColor(c.status)">
                    {{ c.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-slate-600"
                    [ngClass]="{'text-red-600 font-semibold': isSlaBreached(c.sla_deadline)}">
                  {{ c.sla_deadline | date:'dd MMM yyyy, HH:mm' }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-500">{{ c.created_at | date:'dd MMM yyyy' }}</td>
              </tr>

              <!-- EMPTY STATE -->
              <tr *ngIf="cases.length === 0">
                <td colspan="8" class="text-center py-16 text-slate-400">
                  <p class="text-base font-medium">No cases found</p>
                  <p class="text-xs mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="flex items-center justify-between mt-4 text-sm text-slate-600">
          <div>
            Showing <strong>{{ paginationStart }}</strong>&ndash;<strong>{{ paginationEnd }}</strong> of <strong>{{ totalCases }}</strong> cases
          </div>
          <div class="flex items-center gap-2">
            <button (click)="prevPage()" [disabled]="currentOffset === 0"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span class="text-xs text-slate-400">Page {{ currentPage }} of {{ totalPages }}</span>
            <button (click)="nextPage()" [disabled]="currentOffset + pageSize >= totalCases"
                    class="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

    </div>
    }
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class DceCaseListComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    dceService = inject(DceService);

    loading = signal(true);

    cases: DceCaseState[] = [];
    totalCases = 0;
    pageSize = 20;
    currentOffset = 0;

    // Filter model
    filterStatus = '';
    filterPriority = '';
    filterJurisdiction = '';
    filterNode = '';

    // ── Computed pagination helpers ──────────────────────────────────────

    get currentPage(): number {
        return Math.floor(this.currentOffset / this.pageSize) + 1;
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalCases / this.pageSize));
    }

    get paginationStart(): number {
        return this.totalCases === 0 ? 0 : this.currentOffset + 1;
    }

    get paginationEnd(): number {
        return Math.min(this.currentOffset + this.pageSize, this.totalCases);
    }

    // ── Lifecycle ────────────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadCases();
    }

    // ── Data loading ─────────────────────────────────────────────────────

    loadCases(): void {
        this.loading.set(true);

        const filters: DceCaseFilters = {
            limit: this.pageSize,
            offset: this.currentOffset,
        };
        if (this.filterStatus) filters.status = this.filterStatus;
        if (this.filterPriority) filters.priority = this.filterPriority;
        if (this.filterJurisdiction) filters.jurisdiction = this.filterJurisdiction;
        if (this.filterNode) filters.current_node = this.filterNode;

        this.dceService.listCases(filters).pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (res: DceCaseListResponse) => {
                this.cases = res.cases;
                this.totalCases = res.total;
                this.loading.set(false);
            },
            error: (err) => {
                console.error('[DCE] Failed to load cases', err);
                this.cases = [];
                this.totalCases = 0;
                this.loading.set(false);
            }
        });
    }

    // ── Filter actions ───────────────────────────────────────────────────

    onFilterChange(): void {
        this.currentOffset = 0;
        this.loadCases();
    }

    resetFilters(): void {
        this.filterStatus = '';
        this.filterPriority = '';
        this.filterJurisdiction = '';
        this.filterNode = '';
        this.currentOffset = 0;
        this.loadCases();
    }

    // ── Pagination actions ───────────────────────────────────────────────

    prevPage(): void {
        if (this.currentOffset > 0) {
            this.currentOffset = Math.max(0, this.currentOffset - this.pageSize);
            this.loadCases();
        }
    }

    nextPage(): void {
        if (this.currentOffset + this.pageSize < this.totalCases) {
            this.currentOffset += this.pageSize;
            this.loadCases();
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    isSlaBreached(slaDeadline: string): boolean {
        if (!slaDeadline) return false;
        return new Date(slaDeadline).getTime() < Date.now();
    }
}
