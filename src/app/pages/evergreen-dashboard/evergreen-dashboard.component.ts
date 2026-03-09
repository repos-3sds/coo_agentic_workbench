import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { EvergreenService, EvergreenProduct } from '../../services/evergreen.service';

@Component({
    selector: 'app-evergreen-dashboard',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <lucide-icon name="refresh-cw" class="w-6 h-6 text-emerald-600"></lucide-icon>
            Evergreen Products
          </h1>
          <p class="text-sm text-slate-500 mt-1">Pre-approved products with same-day trading under approved limits.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100"
               *ngIf="breachedCount > 0">
            {{ breachedCount }} Over Limit
          </div>
          <div class="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
            {{ products.length }} Active
          </div>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-4">
        <div class="grid grid-cols-4 gap-4 max-w-4xl">
          <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <lucide-icon name="layers" class="w-4 h-4"></lucide-icon>
            </div>
            <div>
              <div class="text-xl font-bold text-slate-900">{{ products.length }}</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Total Active</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <lucide-icon name="bar-chart-3" class="w-4 h-4"></lucide-icon>
            </div>
            <div>
              <div class="text-xl font-bold text-slate-900">{{ avgUtilization }}%</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Avg Utilization</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <lucide-icon name="alert-triangle" class="w-4 h-4"></lucide-icon>
            </div>
            <div>
              <div class="text-xl font-bold text-slate-900">{{ highUtilCount }}</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">&gt;80% Utilized</div>
            </div>
          </div>
          <div class="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg border border-slate-100">
            <div class="p-2 bg-red-50 text-red-600 rounded-lg">
              <lucide-icon name="shield-alert" class="w-4 h-4"></lucide-icon>
            </div>
            <div>
              <div class="text-xl font-bold text-slate-900">{{ breachedCount }}</div>
              <div class="text-[10px] font-bold text-slate-400 uppercase">Limit Breaches</div>
            </div>
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
                  <th class="px-6 py-3">Category</th>
                  <th class="px-6 py-3 text-right">Approved Limit</th>
                  <th class="px-6 py-3 text-right">30d Volume</th>
                  <th class="px-6 py-3">Utilization</th>
                  <th class="px-6 py-3 text-center">Status</th>
                  <th class="px-6 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let p of products" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="font-bold text-slate-900 text-sm">{{ p.title }}</div>
                    <div class="text-[10px] text-slate-400 font-mono mt-0.5">{{ p.id }}</div>
                  </td>
                  <td class="px-6 py-4 text-slate-600">{{ p.product_category || 'N/A' }}</td>
                  <td class="px-6 py-4 text-right font-mono text-slate-700">
                    {{ p.currency }} {{ formatAmount(p.approved_limit) }}
                  </td>
                  <td class="px-6 py-4 text-right font-mono text-slate-700">
                    {{ p.currency }} {{ formatAmount(p.volume_30d) }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                        <div class="h-full rounded-full transition-all"
                             [style.width.%]="Math.min(p.utilization_pct, 100)"
                             [ngClass]="{
                               'bg-emerald-500': p.utilization_pct < 60,
                               'bg-amber-500': p.utilization_pct >= 60 && p.utilization_pct < 80,
                               'bg-red-500': p.utilization_pct >= 80
                             }"></div>
                      </div>
                      <span class="text-[11px] font-bold w-10 text-right"
                            [ngClass]="{
                              'text-emerald-600': p.utilization_pct < 60,
                              'text-amber-600': p.utilization_pct >= 60 && p.utilization_pct < 80,
                              'text-red-600': p.utilization_pct >= 80
                            }">{{ p.utilization_pct }}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200': p.utilization_pct < 60,
                            'bg-amber-50 text-amber-700 border-amber-200': p.utilization_pct >= 60 && p.utilization_pct < 80,
                            'bg-red-50 text-red-700 border-red-200': p.utilization_pct >= 80
                          }">
                      {{ p.utilization_pct >= 100 ? 'BREACHED' : p.utilization_pct >= 80 ? 'HIGH' : p.utilization_pct >= 60 ? 'MODERATE' : 'HEALTHY' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-slate-400 text-[11px]">{{ formatDate(p.last_metric_date) }}</td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="products.length === 0" class="text-center py-20">
              <lucide-icon name="refresh-cw" class="w-12 h-12 text-slate-300 mx-auto mb-4"></lucide-icon>
              <h3 class="text-lg font-medium text-slate-900">No Evergreen products</h3>
              <p class="text-slate-500 mt-2">No products are currently on the Evergreen track.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class EvergreenDashboardComponent implements OnInit {
    private evergreenService = inject(EvergreenService);
    Math = Math;

    products: EvergreenProduct[] = [];

    get avgUtilization() {
        if (this.products.length === 0) return 0;
        return Math.round(this.products.reduce((sum, p) => sum + p.utilization_pct, 0) / this.products.length);
    }
    get highUtilCount() { return this.products.filter(p => p.utilization_pct >= 80).length; }
    get breachedCount() { return this.products.filter(p => p.utilization_pct >= 100).length; }

    ngOnInit() { this.loadData(); }

    loadData() {
        this.evergreenService.getAll().subscribe({
            next: (data) => this.products = data,
            error: (err) => console.error('[EVERGREEN] Load failed', err)
        });
    }

    formatAmount(val: number): string {
        if (!val) return '0';
        if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + 'M';
        if (val >= 1_000) return (val / 1_000).toFixed(0) + 'K';
        return String(val);
    }

    formatDate(d: string): string {
        if (!d) return '-';
        return new Date(d).toLocaleDateString();
    }
}
