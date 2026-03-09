import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PirService, PirItem } from '../../services/pir.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-pir-management',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
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
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <lucide-icon name="clipboard-check" class="w-6 h-6 text-purple-600"></lucide-icon>
            Post-Implementation Reviews
          </h1>
          <p class="text-sm text-slate-500 mt-1">Track and manage PIR submissions for launched products.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100"
               *ngIf="overdueCount > 0">
            {{ overdueCount }} Overdue
          </div>
          <div class="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-100">
            {{ items.length }} Pending
          </div>
        </div>
      </div>

      <!-- KPI STRIP -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-4">
        <div class="flex gap-8 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span class="text-slate-500">Overdue:</span>
            <span class="font-bold text-slate-900">{{ overdueCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <span class="text-slate-500">Due < 30d:</span>
            <span class="font-bold text-slate-900">{{ dueSoonCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span class="text-slate-500">Submitted:</span>
            <span class="font-bold text-slate-900">{{ submittedCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <span class="text-slate-500">Completed:</span>
            <span class="font-bold text-slate-900">{{ completedCount }}</span>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-6xl mx-auto">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th class="px-6 py-3">Product</th>
                  <th class="px-6 py-3">Type</th>
                  <th class="px-6 py-3">PIR Status</th>
                  <th class="px-6 py-3">Due Date</th>
                  <th class="px-6 py-3 text-right">Days Left</th>
                  <th class="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let item of items" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 text-sm">{{ item.title }}</div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">{{ item.id }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-50 text-slate-600 border-slate-200">{{ item.npa_type }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-red-50 text-red-700 border-red-200': item.pir_status === 'OVERDUE',
                            'bg-amber-50 text-amber-700 border-amber-200': item.pir_status === 'PENDING',
                            'bg-blue-50 text-blue-700 border-blue-200': item.pir_status === 'SUBMITTED',
                            'bg-green-50 text-green-700 border-green-200': item.pir_status === 'COMPLETED'
                          }">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [ngClass]="{
                              'bg-red-500': item.pir_status === 'OVERDUE',
                              'bg-amber-500': item.pir_status === 'PENDING',
                              'bg-blue-500': item.pir_status === 'SUBMITTED',
                              'bg-green-500': item.pir_status === 'COMPLETED'
                            }"></span>
                      {{ item.pir_status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-600 font-mono text-[11px]">
                    {{ item.pir_due_date | date:'mediumDate' }}
                  </td>
                  <td class="px-6 py-4 text-right font-mono font-medium"
                      [ngClass]="{
                        'text-red-600': item.days_until_due < 0,
                        'text-amber-600': item.days_until_due >= 0 && item.days_until_due <= 30,
                        'text-slate-500': item.days_until_due > 30
                      }">
                    {{ item.days_until_due < 0 ? item.days_until_due + 'd' : '+' + item.days_until_due + 'd' }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button *ngIf="item.pir_status === 'PENDING' || item.pir_status === 'OVERDUE'"
                              (click)="submitPir(item)"
                              class="px-3 py-1.5 bg-mbs-primary text-white rounded-lg text-xs font-semibold hover:bg-mbs-primary-hover transition-colors">
                        Submit PIR
                      </button>
                      <button *ngIf="item.pir_status === 'SUBMITTED'"
                              (click)="approvePir(item)"
                              class="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[11px] font-semibold hover:bg-green-700 transition-colors">
                        Approve
                      </button>
                      <button *ngIf="item.pir_status !== 'COMPLETED'"
                              (click)="extendPir(item)"
                              class="px-3 py-1.5 bg-white text-slate-700 border border-mbs-border rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                        Extend
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- EMPTY STATE -->
            <div *ngIf="items.length === 0" class="text-center py-20">
              <lucide-icon name="clipboard-check" class="w-12 h-12 text-slate-300 mx-auto mb-4"></lucide-icon>
              <h3 class="text-lg font-medium text-slate-900">No PIRs pending</h3>
              <p class="text-slate-500 mt-2">All launched products have completed their reviews.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class PirManagementComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    private pirService = inject(PirService);
    private toast = inject(ToastService);

    loading = signal(true);

    items: PirItem[] = [];

    get overdueCount() { return this.items.filter(i => i.pir_status === 'OVERDUE').length; }
    get dueSoonCount() { return this.items.filter(i => i.pir_status === 'PENDING' && i.days_until_due <= 30 && i.days_until_due >= 0).length; }
    get submittedCount() { return this.items.filter(i => i.pir_status === 'SUBMITTED').length; }
    get completedCount() { return this.items.filter(i => i.pir_status === 'COMPLETED').length; }

    ngOnInit() { this.loadData(); }

    loadData() {
        this.pirService.getPending().pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe({
            next: (data) => {
                this.items = data;
                this.loading.set(false);
            },
            error: (err) => {
                console.error('[PIR] Load failed', err);
                this.loading.set(false);
            }
        });
    }

    submitPir(item: PirItem) {
        const findings = prompt('Enter PIR findings summary:');
        if (!findings) return;
        this.pirService.submit(item.id, { actor_name: 'COO', findings }).subscribe({
            next: () => this.loadData(),
            error: (err) => this.toast.error(err.error?.error || 'Submit failed')
        });
    }

    approvePir(item: PirItem) {
        if (!confirm('Approve this PIR? This will mark the review as complete.')) return;
        this.pirService.approve(item.id, { actor_name: 'COO' }).subscribe({
            next: () => this.loadData(),
            error: (err) => this.toast.error(err.error?.error || 'Approval failed')
        });
    }

    extendPir(item: PirItem) {
        const reason = prompt('Reason for extension:');
        if (!reason) return;
        const months = parseInt(prompt('Extend by how many months?', '3') || '0', 10);
        if (months <= 0) return;
        this.pirService.extend(item.id, { actor_name: 'COO', months, reason }).subscribe({
            next: () => this.loadData(),
            error: (err) => this.toast.error(err.error?.error || 'Extension failed')
        });
    }
}
