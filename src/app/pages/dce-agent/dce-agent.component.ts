import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { ChatInterfaceComponent } from '../../components/npa/chat-interface/chat-interface.component';
import { DceAgentDashboardComponent } from './dce-agent-dashboard/dce-agent-dashboard.component';
import { DceWorkItemComponent } from './dce-work-item/dce-work-item.component';
import { DceIntakeFormComponent } from './dce-intake-form/dce-intake-form.component';
import { LayoutService } from '../../services/layout.service';
import { DceService } from '../../services/dce.service';
import { DifyService } from '../../services/dify/dify.service';
import { ToastService } from '../../services/toast.service';

@Component({
   selector: 'app-dce-agent',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      ChatInterfaceComponent,
      DceAgentDashboardComponent,
      DceWorkItemComponent,
      DceIntakeFormComponent,
   ],
   template: `
    <!-- VIEW 1: Dashboard (Landing Page) -->
    <div *ngIf="viewMode === 'DASHBOARD'" class="h-full w-full overflow-y-auto scrollbar-hide">
        <app-dce-agent-dashboard
            (navigateToCreate)="goToIntake()"
            (navigateToDetail)="goToCase($event)">
        </app-dce-agent-dashboard>
    </div>

    <!-- VIEW 2: Intake Form (Multi-Channel Submission) -->
    <div *ngIf="viewMode === 'INTAKE'" class="h-[calc(100vh-64px)] w-full border-t border-slate-200 bg-slate-50 overflow-y-auto">
        <app-dce-intake-form
            (onSubmit)="handleIntakeSubmit($event)"
            (onBack)="goToDashboard()">
        </app-dce-intake-form>
    </div>

    <!-- VIEW 3: Work Item (Case Detail) -->
    <div *ngIf="viewMode === 'WORK_ITEM'" class="h-full w-full">
        <app-dce-work-item
            [dceContext]="dceContext"
            (onBack)="goToDashboard()">
        </app-dce-work-item>
    </div>
   `
})
export class DceAgentComponent implements OnInit, OnDestroy {
   private layoutService = inject(LayoutService);
   private route = inject(ActivatedRoute);
   private router = inject(Router);
   private dceService = inject(DceService);
   private difyService = inject(DifyService);
   private http = inject(HttpClient);
   private toast = inject(ToastService);

   viewMode: 'DASHBOARD' | 'INTAKE' | 'WORK_ITEM' = 'DASHBOARD';

   dceContext: any = null;

   ngOnInit() {
      this.route.queryParams.subscribe(params => {
         if (params['mode'] === 'create') {
            this.goToIntake();
         } else if (params['mode'] === 'detail') {
            this.dceContext = { caseId: params['caseId'] || params['case_id'] || null };
            this.viewMode = 'WORK_ITEM';
            this.layoutService.setSidebarVisible(false);
         }
      });
   }

   goToDashboard() {
      this.viewMode = 'DASHBOARD';
      this.dceContext = null;
      this.layoutService.setSidebarVisible(true);
   }

   goToIntake() {
      this.viewMode = 'INTAKE';
      this.layoutService.setSidebarVisible(false);
   }

   handleIntakeSubmit(event: { channel: string; payload: any }) {
      const payload = event.payload;
      const createData = {
         client_name: payload.client_name || 'Unknown Client',
         account_type: payload.account_type || payload.entity_type || 'Standard',
         priority: payload.priority || 'STANDARD',
         jurisdiction: payload.jurisdiction || 'SGP',
         products_requested: payload.products_requested || [],
         rm_id: payload.rm_id || null,
      };

      this.dceService.createCase(createData).subscribe({
         next: (res) => {
            const newCaseId = res.case_id || res.id;
            this.dceContext = { caseId: newCaseId, case_id: newCaseId, ...payload };
            this.viewMode = 'WORK_ITEM';
            this.layoutService.setSidebarVisible(false);
            this.toast.success(`Case ${newCaseId} created via ${event.channel}`);
         },
         error: () => {
            // Fallback to mock case ID
            const mockCaseId = 'AO-2026-MOCK-' + Date.now().toString().slice(-4);
            this.dceContext = { caseId: mockCaseId, case_id: mockCaseId, ...payload };
            this.viewMode = 'WORK_ITEM';
            this.layoutService.setSidebarVisible(false);
            this.toast.info(`Mock case ${mockCaseId} created (backend unavailable)`);
         }
      });
   }

   goToCaseWithData(payload: any) {
      if (payload?.caseId || payload?.case_id) {
         this.dceContext = payload;
         this.viewMode = 'WORK_ITEM';
         this.layoutService.setSidebarVisible(false);
      }
   }

   goToCase(caseId: string) {
      this.dceContext = { caseId };
      this.viewMode = 'WORK_ITEM';
      this.layoutService.setSidebarVisible(false);
   }

   ngOnDestroy() {
      this.layoutService.setSidebarVisible(true);
      this.layoutService.setSidebarState(false);
   }
}
