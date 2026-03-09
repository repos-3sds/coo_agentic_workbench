import { Component, EventEmitter, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DceService, DceCaseState } from '../../../services/dce.service';

export interface DcePipelineItem {
   id: string;
   displayId: string;
   clientName: string;
   accountType: string;
   priority: string;
   currentNode: string;
   status: string;
   slaDeadline: string;
   created: string;
}

@Component({
   selector: 'app-dce-pipeline-table',
   standalone: true,
   imports: [CommonModule, LucideAngularModule],
   template: `
    <div class="rounded-xl border border-border/50 bg-card text-card-foreground shadow-sm">
      <div class="p-6 pb-3">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <lucide-icon name="briefcase" class="w-5 h-5 text-muted-foreground"></lucide-icon>
            DCE Case Pipeline
          </h3>
          <button class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3">
            View All Cases
          </button>
        </div>
      </div>
      <div class="p-6 pt-0">
        <div class="w-full overflow-auto">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50">
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Case ID</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Client Name</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Account Type</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Priority</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Current Node</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">SLA</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th class="h-10 px-2 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              <tr *ngFor="let item of pipelineData"
                  class="border-b transition-colors hover:bg-muted/50 group cursor-pointer"
                  (click)="onViewDetail.emit(item.id)">
                <td class="p-2 align-middle font-medium">
                  <span class="text-primary hover:underline cursor-pointer font-mono text-xs">{{ item.displayId }}</span>
                </td>
                <td class="p-2 align-middle font-medium text-slate-900">{{ item.clientName }}</td>
                <td class="p-2 align-middle">
                  <span class="text-xs text-muted-foreground">{{ item.accountType }}</span>
                </td>
                <td class="p-2 align-middle">
                  <span [ngClass]="getPriorityClasses(item.priority)"
                        class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold border-transparent">
                    {{ item.priority }}
                  </span>
                </td>
                <td class="p-2 align-middle">
                  <div class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold border-border/50 text-foreground">
                    {{ item.currentNode }}
                  </div>
                </td>
                <td class="p-2 align-middle">
                  <div [ngClass]="getStatusClasses(item.status)"
                       class="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold border-transparent gap-1">
                    <lucide-icon [name]="getStatusIcon(item.status)" class="w-3 h-3"></lucide-icon>
                    {{ item.status }}
                  </div>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-xs text-muted-foreground">{{ item.slaDeadline }}</span>
                </td>
                <td class="p-2 align-middle">
                  <span class="text-xs text-muted-foreground">{{ item.created }}</span>
                </td>
                <td class="p-2 align-middle">
                  <button (click)="$event.stopPropagation(); onViewDetail.emit(item.id)"
                          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100">
                    <lucide-icon name="arrow-right" class="w-4 h-4"></lucide-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="!pipelineData.length && !loading">
                <td colspan="9" class="p-8 text-center text-muted-foreground text-sm">
                  No cases found. Start a new account opening to create one.
                </td>
              </tr>
              <tr *ngIf="loading">
                <td colspan="9" class="p-8 text-center text-muted-foreground text-sm">
                  <lucide-icon name="loader-2" class="w-5 h-5 animate-spin inline-block mr-2"></lucide-icon>
                  Loading cases...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DcePipelineTableComponent implements OnInit {
   @Output() onViewDetail = new EventEmitter<string>();

   pipelineData: DcePipelineItem[] = [];
   loading = true;

   private dceService = inject(DceService);

   ngOnInit() {
      this.dceService.listCases({ limit: 25 }).subscribe({
         next: (res) => {
            this.pipelineData = (res.cases || []).map((c: DceCaseState) => ({
               id: c.case_id,
               displayId: c.case_id,
               clientName: c.client_name || 'Unknown',
               accountType: c.case_type || 'Standard',
               priority: c.priority || 'STANDARD',
               currentNode: this.getNodeLabel(c.current_node),
               status: c.status || 'ACTIVE',
               slaDeadline: c.sla_deadline ? new Date(c.sla_deadline).toLocaleDateString() : '—',
               created: new Date(c.created_at).toLocaleDateString()
            }));
            this.loading = false;
         },
         error: (err) => {
            console.warn('[DcePipeline] Failed to load cases', err);
            this.loading = false;
         }
      });
   }

   private getNodeLabel(nodeId: string): string {
      const labels: Record<string, string> = {
         'N-0': 'N-0 Intake',
         'N-1': 'N-1 Documents',
         'N-2': 'N-2 Signatures',
         'N-3': 'N-3 KYC/CDD',
         'N-4': 'N-4 Credit',
         'N-5': 'N-5 Config',
         'N-6': 'N-6 Notify',
         'DONE': 'Completed',
         'HITL_RM': 'Pending RM',
         'HITL_DESK': 'Pending Desk Support',
      };
      return labels[nodeId] || nodeId || 'N-0 Intake';
   }

   getStatusClasses(status: string): string {
      const config: Record<string, string> = {
         'ACTIVE': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]',
         'HITL_PENDING': 'bg-amber-500/10 text-amber-600',
         'ESCALATED': 'bg-[hsl(var(--status-exception-bg))] text-[hsl(var(--status-exception))]',
         'DONE': 'bg-[hsl(var(--status-completed-bg))] text-[hsl(var(--status-completed))]',
         'DEAD': 'bg-gray-100 text-gray-500',
      };
      return config[status] || 'bg-gray-100 text-gray-600';
   }

   getStatusIcon(status: string): string {
      const config: Record<string, string> = {
         'ACTIVE': 'check-circle-2',
         'HITL_PENDING': 'alert-triangle',
         'ESCALATED': 'alert-triangle',
         'DONE': 'check-circle-2',
         'DEAD': 'x-circle',
      };
      return config[status] || 'circle';
   }

   getPriorityClasses(priority: string): string {
      const config: Record<string, string> = {
         'URGENT': 'bg-red-100 text-red-700',
         'STANDARD': 'bg-blue-100 text-blue-700',
         'DEFERRED': 'bg-gray-100 text-gray-600',
      };
      return config[priority] || 'bg-gray-100 text-gray-600';
   }
}
