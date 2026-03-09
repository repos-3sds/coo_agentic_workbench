import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { NpaService } from '../../../services/npa.service';

export interface NPAPipelineItem {
  id: string;
  displayId: string;
  name: string;
  productType: string;
  businessUnit: string;
  currentStage: string;
  status: 'on-track' | 'at-risk' | 'blocked' | 'completed';
  daysInStage: number;
  owner: string;
  lastUpdated: string;
}

@Component({
  selector: 'app-npa-pipeline-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
    <div class="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm">
      <div class="p-6 pb-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <lucide-icon name="file-text" class="w-5 h-5 text-muted-foreground"></lucide-icon>
            NPA Pipeline
          </h3>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
            View All NPAs
          </button>
        </div>
      </div>
      <div class="p-6 pt-0">
        <div class="w-full overflow-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">NPA ID</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Product Name</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Business Unit</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Current Stage</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Days in Stage</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Owner</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr *ngFor="let item of pipelineData" 
                  class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group">
                <td class="p-2 align-middle font-medium">
                  <a (click)="onViewDetail.emit(item.id)" class="text-primary hover:underline cursor-pointer">
                    {{ item.displayId }}
                  </a>
                </td>
                <td class="p-2 align-middle">{{ item.name }}</td>
                <td class="p-2 align-middle">
                  <span class="text-xs text-muted-foreground">{{ item.productType }}</span>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-xs">{{ item.businessUnit }}</span>
                </td>
                <td class="p-2 align-middle">
                  <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground border-border/50">
                    {{ item.currentStage }}
                  </div>
                </td>
                <td class="p-2 align-middle">
                   <div [ngClass]="getStatusClasses(item.status)" class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1 border-transparent">
                      <lucide-icon [name]="getStatusIcon(item.status)" class="w-3 h-3"></lucide-icon>
                      {{ getStatusLabel(item.status) }}
                   </div>
                </td>
                <td class="p-2 align-middle">
                  <span [ngClass]="getDaysClasses(item.daysInStage)">
                     {{ item.daysInStage }}d
                  </span>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-sm text-muted-foreground">{{ item.owner }}</span>
                </td>
                <td class="p-2 align-middle">
                   <button (click)="onViewDetail.emit(item.id)" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100">
                      <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                   </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class NpaPipelineTableComponent implements OnInit {
  @Output() onViewDetail = new EventEmitter<string>();

  pipelineData: NPAPipelineItem[] = [];

  private npaService = inject(NpaService);

  constructor() { }

  ngOnInit() {
    this.npaService.getAll().subscribe({
      next: (npas) => {
        this.pipelineData = npas.map(p => ({
          id: p.id,
          displayId: p.display_id || p.id,
          name: p.title || 'Untitled',
          productType: p.npa_type || 'New Product',
          businessUnit: p.pm_team || 'Global Fin. Markets',
          currentStage: this.mapStage(p.current_stage),
          status: this.mapStatus(p.status),
          daysInStage: Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 3600 * 24)),
          owner: p.submitted_by || 'Unknown',
          lastUpdated: new Date(p.updated_at || p.created_at).toLocaleDateString()
        }));
      },
      error: (err) => console.error('Failed to load NPA pipeline from API', err)
    });
  }

  private mapStatus(dbStatus: string): 'on-track' | 'at-risk' | 'blocked' | 'completed' {
    switch (dbStatus) {
      case 'On Track': return 'on-track';
      case 'At Risk': return 'at-risk';
      case 'Blocked': return 'blocked';
      case 'Completed': return 'completed';
      case 'Warning': return 'at-risk';
      default: return 'on-track';
    }
  }

  private mapStage(backendStage: string): string {
    const map: any = {
      'IDEATION': 'Prospect (Ideation)',
      'INITIATION': 'Initiation',
      'DISCOVERY': 'Discovery',
      'REVIEW': 'Review',
      'DCE_REVIEW': 'Review',
      'RETURNED_TO_MAKER': 'Review',
      'RISK_ASSESSMENT': 'Sign-Off',
      'GOVERNANCE': 'Pre Launch',
      'SIGN_OFF': 'Sign-Off',
      'PENDING_SIGN_OFFS': 'Sign-Off',
      'PENDING_FINAL_APPROVAL': 'Pre Launch',
      'APPROVED': 'Pre Launch',
      'LAUNCH_PREP': 'Pre Launch',
      'UAT': 'Pre Launch',
      'LAUNCH': 'Launch',
      'LAUNCHED': 'Launch',
      'PIR': 'PIR / Monitoring',
      'MONITORING': 'PIR / Monitoring'
    };
    return map[backendStage] || backendStage || 'Discovery';
  }

  getStatusClasses(status: string): string {
    const config: Record<string, string> = {
      'on-track': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]',
      'at-risk': 'bg-amber-500/10 text-amber-600',
      'blocked': 'bg-[hsl(var(--status-exception-bg))] text-[hsl(var(--status-exception))]',
      'completed': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]'
    };
    return config[status] || '';
  }

  getStatusIcon(status: string): string {
    const config: Record<string, string> = {
      'on-track': 'check-circle-2',
      'at-risk': 'alert-triangle',
      'blocked': 'alert-triangle',
      'completed': 'check-circle-2'
    };
    return config[status] || 'circle';
  }

  getStatusLabel(status: string): string {
    const config: Record<string, string> = {
      'on-track': 'On Track',
      'at-risk': 'At Risk',
      'blocked': 'Blocked',
      'completed': 'Completed'
    };
    return config[status] || status;
  }

  getDaysClasses(days: number): string {
    if (days > 7) return 'text-[hsl(var(--status-exception))] font-medium';
    if (days > 5) return 'text-amber-600 font-medium';
    return 'text-sm';
  }
}
