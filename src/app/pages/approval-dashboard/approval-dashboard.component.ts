import { Component, DestroyRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { NpaProject, SignOffParty, SignOffDecision } from '../../lib/npa-interfaces';
import { NpaService } from '../../services/npa.service';
import { ApprovalService } from '../../services/approval.service';
import { LucideAngularModule } from 'lucide-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { AGENT_REGISTRY } from '../../lib/agent-interfaces';
import { ToastService } from '../../services/toast.service';

type WorkspaceView = 'INBOX' | 'DRAFTS' | 'WATCHLIST';

@Component({
   selector: 'app-approval-dashboard',
   standalone: true,
   imports: [CommonModule, FormsModule, SharedIconsModule, LucideAngularModule],
   template: `
    @if (loading()) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    } @else {
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
        <div>
           <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <lucide-icon [name]="headerIcon" class="w-6 h-6 text-indigo-600"></lucide-icon>
              {{ dashboardTitle }}
           </h1>
           <p class="text-sm text-slate-500 mt-1">{{ dashboardSubtitle }}</p>
        </div>
        <div class="flex items-center gap-3">
           <div class="flex items-center gap-1.5 bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
              <lucide-icon name="workflow" class="w-3.5 h-3.5 text-slate-500"></lucide-icon>
              Governance Agent
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
           </div>
           <div class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
              {{ filteredItems().length }} Item(s)
           </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-6xl mx-auto space-y-6">

            <!-- LIST -->
            <div *ngFor="let item of filteredItems()" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group relative">
                
                <!-- Rework Badge -->
                <div *ngIf="item.stage === 'RETURNED_TO_MAKER' && currentView() === 'INBOX'" class="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                   Action Required
                </div>

                <div class="p-6 flex items-start gap-6">
                   
                   <!-- ICON / TYPE -->
                   <div class="flex-none">
                      <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold shadow-sm"
                           [ngClass]="{
                             'bg-blue-50 text-blue-600': item.type === 'NPA',
                             'bg-purple-50 text-purple-600': item.type === 'DCE',
                             'bg-amber-50 text-amber-600': item.type === 'Limit Breach'
                           }">
                           <lucide-icon *ngIf="item.type === 'NPA'" name="file-box" class="w-6 h-6"></lucide-icon>
                           <lucide-icon *ngIf="item.type === 'DCE'" name="users" class="w-6 h-6"></lucide-icon>
                           <lucide-icon *ngIf="item.type === 'Limit Breach'" name="alert-triangle" class="w-6 h-6"></lucide-icon>
                      </div>
                   </div>

                   <!-- CONTENT -->
                   <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ item.type }}</span>
                          <span class="text-xs text-slate-400">{{ item.submittedDate | date:'mediumDate' }}</span>
                      </div>
                      <h3 class="text-lg font-bold text-slate-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors cursor-pointer">
                          {{ item.title }}
                      </h3>
                      <p class="text-sm text-slate-600 mb-4 line-clamp-2">{{ item.description }}</p>
                      
                      <div class="flex items-center gap-4 text-xs mb-4">
                          <div class="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              <lucide-icon name="user" class="w-3.5 h-3.5"></lucide-icon>
                              <span>{{ item.submittedBy }}</span>
                          </div>
                          <div class="flex items-center gap-1.5 px-2 py-1 rounded border"
                               [ngClass]="{
                                 'bg-green-50 text-green-700 border-green-100': item.riskLevel === 'LOW',
                                 'bg-yellow-50 text-yellow-700 border-yellow-100': item.riskLevel === 'MEDIUM',
                                 'bg-red-50 text-red-700 border-red-100': item.riskLevel === 'HIGH'
                               }">
                              <lucide-icon name="shield" class="w-3.5 h-3.5"></lucide-icon>
                              <span>{{ item.riskLevel }} Risk</span>
                          </div>
                           <!-- Stage Badge for generic views -->
                          <div class="flex items-center gap-1.5 px-2 py-1 rounded border bg-slate-100 text-slate-700 font-medium">
                              <lucide-icon name="activity" class="w-3.5 h-3.5"></lucide-icon>
                              <span>{{ item.stage }}</span>
                          </div>
                      </div>

                      <!-- APPROVAL MATRIX VISUALIZATION (Detail View) -->
                      <div *ngIf="shouldShowMatrix(item)" class="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <h4 class="text-xs font-bold text-slate-500 uppercase mb-2">Sign-Off Status</h4>
                          <div class="flex flex-wrap gap-2">
                             <div *ngFor="let party of item.requiredSignOffs" class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border"
                                  [ngClass]="getBadgeClass(item.signOffMatrix[party]?.status || 'PENDING')">
                                 <div class="w-1.5 h-1.5 rounded-full" [ngClass]="getDotClass(item.signOffMatrix[party]?.status || 'PENDING')"></div>
                                 <span class="capitalize">{{ formatParty(party) }}</span>
                                 <span *ngIf="item.signOffMatrix[party]?.status === 'APPROVED_CONDITIONAL'" class="text-[10px] ml-1 opacity-75">(Conditions)</span>
                             </div>
                          </div>
                           <div *ngFor="let party of item.requiredSignOffs">
                              <div *ngIf="item.signOffMatrix[party]?.status === 'REWORK_REQUIRED'" class="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 flex items-start gap-2">
                                  <lucide-icon name="alert-triangle" class="w-3 h-3 text-red-500 mt-0.5"></lucide-icon>
                                  <span><strong>{{ formatParty(party) }}:</strong> {{ item.signOffMatrix[party]?.comments }}</span>
                              </div>
                           </div>
                      </div>
                   </div>

                   <!-- ACTIONS -->
                   <div class="flex-none flex flex-col gap-2 pt-1 w-40">
                       
                       <!-- INBOX ACTIONS (Only relevant if in Inbox) -->
                       <ng-container *ngIf="currentView() === 'INBOX'">
                           
                           <!-- MAKER -->
                           <ng-container *ngIf="userRole() === 'MAKER'">
                               <button *ngIf="item.stage === 'RETURNED_TO_MAKER' || item.stage === 'DRAFT'" (click)="submit(item)"
                                       class="w-full px-4 py-2 bg-mbs-primary hover:bg-mbs-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                   <lucide-icon name="send" class="w-3.5 h-3.5"></lucide-icon>
                                   <span>{{ item.stage === 'DRAFT' ? 'Submit' : 'Resubmit' }}</span>
                               </button>
                           </ng-container>

                           <!-- CHECKER -->
                           <ng-container *ngIf="userRole() === 'CHECKER'">
                               <button (click)="approve(item)" class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                   <lucide-icon name="check" class="w-3.5 h-3.5"></lucide-icon> Approve
                               </button>
                               <button (click)="reject(item)" class="w-full px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                   <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon> Return
                               </button>
                           </ng-container>

                           <!-- FUNCTIONAL APPROVER -->
                           <ng-container *ngIf="isFunctionalApprover()">
                               <!-- Only show actions if MY specific department is pending -->
                               <div *ngIf="isMySignOffPending(item); else doneTemplate">
                                   <button (click)="approve(item)" class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all mb-2 flex items-center justify-center gap-2">
                                       <lucide-icon name="check-circle" class="w-3.5 h-3.5"></lucide-icon> Sign Off
                                   </button>
                                   <button (click)="approveWithConditions(item)" class="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all mb-2 flex items-center justify-center gap-2">
                                       <lucide-icon name="list-checks" class="w-3.5 h-3.5"></lucide-icon> w/ Conditions
                                   </button>
                                   <button (click)="requestRework(item)" class="w-full px-4 py-2 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                       <lucide-icon name="rotate-ccw" class="w-3.5 h-3.5"></lucide-icon> Rework
                                   </button>
                               </div>
                               <ng-template #doneTemplate>
                                   <div class="text-center py-2 px-3 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100 flex items-center justify-center gap-2">
                                       <lucide-icon name="check" class="w-3 h-3"></lucide-icon> Signed Off
                                   </div>
                               </ng-template>
                           </ng-container>

                            <!-- COO -->
                           <ng-container *ngIf="userRole() === 'COO'">
                               <button (click)="finalApprove(item)" class="w-full px-4 py-2 bg-green-800 hover:bg-green-900 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                   <lucide-icon name="check-Check" class="w-3.5 h-3.5"></lucide-icon> Final Approve
                               </button>
                               <button (click)="reject(item)" class="w-full px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                                   <lucide-icon name="x-circle" class="w-3.5 h-3.5"></lucide-icon> Reject
                               </button>
                           </ng-container>
                       </ng-container>

                       <!-- DRAFT ACTIONS -->
                       <ng-container *ngIf="currentView() === 'DRAFTS'">
                           <button (click)="editDraft(item)" class="w-full px-4 py-2 bg-white text-slate-700 border border-mbs-border hover:bg-slate-50 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                               <lucide-icon name="pencil" class="w-3.5 h-3.5"></lucide-icon> Edit Draft
                           </button>
                       </ng-container>

                       <!-- WATCHLIST ACTIONS -->
                       <ng-container *ngIf="currentView() === 'WATCHLIST'">
                            <!-- Status Badge is enough, maybe View Details again -->
                           <button class="w-full px-4 py-2 bg-white text-slate-700 border border-mbs-border hover:bg-slate-50 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                               <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon> View Status
                           </button>
                       </ng-container>

                         <!-- STATUS BADGE (IF DONE) -->
                       <div class="flex-none flex flex-col items-center justify-center mt-2" *ngIf="item.stage === 'APPROVED'">
                           <div class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-green-100 text-green-700">
                               <lucide-icon name="check-circle" class="w-4 h-4"></lucide-icon>
                               LAUNCHED
                           </div>
                       </div>

                       <!-- VIEW DETAILS -->
                       <button (click)="viewDetails(item)" class="w-full px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-all flex items-center justify-center gap-2 mt-auto">
                           <lucide-icon name="eye" class="w-3.5 h-3.5"></lucide-icon> Details
                       </button>

                   </div>

                </div>
            </div>

            <!-- EMPTY STATE -->
            <div *ngIf="filteredItems().length === 0" class="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                 <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                     <lucide-icon [name]="emptyIcon" class="w-8 h-8 text-slate-400"></lucide-icon>
                 </div>
                 <h3 class="text-lg font-medium text-slate-900">{{ emptyTitle }}</h3>
                 <p class="text-slate-500 max-w-sm mx-auto mt-2">{{ emptyMessage }}</p>
                 <button *ngIf="userRole() === 'MAKER' && currentView() === 'DRAFTS'" class="mt-6 px-4 py-2 bg-mbs-primary text-white rounded-lg hover:bg-mbs-primary-hover transition-colors text-sm font-semibold">
                     Create New Proposal
                 </button>
            </div>

        </div>
      </div>
    </div>
    }
   `,
   styles: []
})
export class ApprovalDashboardComponent {
   private destroyRef = inject(DestroyRef);
   private userService = inject(UserService);
   private npaService = inject(NpaService);
   private approvalService = inject(ApprovalService);
   private route = inject(ActivatedRoute);
   private router = inject(Router);
   private toast = inject(ToastService);

   loading = signal(true);

   userRole = () => this.userService.currentUser().role;

   // Current View Signal based on Route Data
   currentView = toSignal(
      this.route.data.pipe(map(d => (d['view'] as WorkspaceView) || 'INBOX')),
      { initialValue: 'INBOX' }
   );

   // Real data from API
   items: NpaProject[] = [];

   // Filtered Items Signal
   filteredItems = signal<NpaProject[]>([]);

   constructor() {
      // Load real data from API
      this.npaService.getAll().pipe(
         takeUntilDestroyed(this.destroyRef)
      ).subscribe({
         next: (npas) => {
            this.items = npas.map(n => this.mapApiToNpaProject(n));
            this.updateFilteredItems();
            this.loading.set(false);
         },
         error: (err) => {
            console.error('Failed to load NPAs for approval dashboard', err);
            this.loading.set(false);
         }
      });

      // Effect to update filtered items when view or role changes
      effect(() => {
         this.updateFilteredItems();
      }, { allowSignalWrites: true });
   }

   private mapApiToNpaProject(n: any): NpaProject {
      const signOffMatrix: any = {};
      const requiredSignOffs: SignOffParty[] = [];
      if (n.signoff_summary) {
         n.signoff_summary.forEach((s: any) => {
            const party = s.party as SignOffParty;
            requiredSignOffs.push(party);
            signOffMatrix[party] = {
               party,
               status: this.mapSignoffStatus(s.status),
               approverName: s.approver_name,
               loopBackCount: 0,
            };
         });
      }
      return {
         id: n.id,
         displayId: n.display_id || n.id,
         title: n.title,
         description: n.description || '',
         submittedBy: n.submitted_by,
         submittedDate: new Date(n.created_at),
         type: n.npa_type?.includes('DCE') ? 'DCE' : 'NPA',
         npaType: n.npa_type,
         riskLevel: n.risk_level || 'LOW',
         isCrossBorder: n.is_cross_border || false,
         jurisdictions: n.jurisdictions || [],
         notional: n.notional_amount || 0,
         stage: this.mapStageToNpaStage(n.current_stage),
         requiredSignOffs,
         signOffMatrix,
      };
   }

   private mapStageToNpaStage(stage: string): any {
      const map: any = {
         'DRAFT': 'DRAFT',
         'INITIATION': 'DRAFT',
         'PENDING_CHECKER': 'PENDING_CHECKER',
         'RETURNED_TO_MAKER': 'RETURNED_TO_MAKER',
         'PENDING_SIGN_OFFS': 'PENDING_SIGN_OFFS',
         'PENDING_FINAL_APPROVAL': 'PENDING_FINAL_APPROVAL',
         'APPROVED': 'APPROVED',
         'REJECTED': 'REJECTED',
         'DISCOVERY': 'DRAFT',
         'RISK_ASSESSMENT': 'PENDING_CHECKER',
         'DCE_REVIEW': 'PENDING_CHECKER',
         'LAUNCHED': 'APPROVED',
         // Sprint 1 (GAP-007): New stages
         'ESCALATED': 'ESCALATED',
         'WITHDRAWN': 'WITHDRAWN',
         'PIR_REQUIRED': 'PIR_REQUIRED',
         'EXPIRED': 'EXPIRED',
      };
      return map[stage] || stage;
   }

   private mapSignoffStatus(status: string): SignOffDecision {
      const map: any = {
         'PENDING': 'PENDING',
         'APPROVED': 'APPROVED',
         'REJECTED': 'REJECTED',
         'REWORK': 'REWORK_REQUIRED',
         'UNDER_REVIEW': 'PENDING',
         'CLARIFICATION_NEEDED': 'PENDING',
      };
      return map[status] || 'PENDING';
   }

   updateFilteredItems() {
      const role = this.userRole();
      const view = this.currentView();
      // console.log(`Updating Items - Role: ${role}, View: ${view}`);

      let result: NpaProject[] = [];

      if (view === 'INBOX') {
         result = this.getInboxItems(role);
      } else if (view === 'DRAFTS') {
         result = this.getDraftItems(role);
      } else if (view === 'WATCHLIST') {
         result = this.getWatchlistItems(role);
      }

      this.filteredItems.set(result);
   }

   // --- DATA FETCHING LOGIC ---

   getInboxItems(role: string): NpaProject[] {
      if (role === 'ADMIN') return this.items;

      if (role === 'MAKER') {
         return this.items.filter(i =>
            (i.submittedBy === 'Sarah Jenkins' || i.submittedBy === 'Mike Chen') &&
            i.stage === 'RETURNED_TO_MAKER'
         );
      }

      if (role === 'CHECKER') {
         return this.items.filter(i => i.stage === 'PENDING_CHECKER');
      }

      if (role.startsWith('APPROVER_')) {
         const myParty = this.getPartyFromRole(role);
         if (!myParty) return [];
         return this.items.filter(i =>
            i.stage === 'PENDING_SIGN_OFFS' &&
            i.requiredSignOffs.includes(myParty) &&
            (i.signOffMatrix[myParty]?.status === 'PENDING' || i.signOffMatrix[myParty]?.status === 'REWORK_REQUIRED')
         );
      }

      if (role === 'COO') {
         return this.items.filter(i => i.stage === 'PENDING_FINAL_APPROVAL');
      }

      return [];
   }

   getDraftItems(role: string): NpaProject[] {
      if (role !== 'MAKER') return []; // Only Makers have drafts
      return this.items.filter(i =>
         (i.submittedBy === 'Sarah Jenkins' || i.submittedBy === 'Mike Chen') &&
         i.stage === 'DRAFT'
      );
   }

   getWatchlistItems(role: string): NpaProject[] {
      if (role === 'MAKER') {
         return this.items.filter(i =>
            (i.submittedBy === 'Sarah Jenkins' || i.submittedBy === 'Mike Chen') &&
            i.stage !== 'DRAFT' && i.stage !== 'RETURNED_TO_MAKER'
         );
      }

      if (role.startsWith('APPROVER_')) {
         const myParty = this.getPartyFromRole(role);
         if (!myParty) return [];
         return this.items.filter(i =>
            i.requiredSignOffs.includes(myParty) &&
            (i.signOffMatrix[myParty]?.status === 'APPROVED' || i.signOffMatrix[myParty]?.status === 'APPROVED_CONDITIONAL')
         );
      }

      return [];
   }

   // --- UI HELPERS ---

   get dashboardTitle() {
      switch (this.currentView()) {
         case 'INBOX': return 'My Inbox';
         case 'DRAFTS': return 'My Drafts';
         case 'WATCHLIST': return 'Watchlist';
         default: return 'Workspace';
      }
   }

   get dashboardSubtitle() {
      switch (this.currentView()) {
         case 'INBOX': return 'Items requiring your immediate attention or action.';
         case 'DRAFTS': return 'Proposals currently in progress.';
         case 'WATCHLIST': return 'Track the status of your submitted or approved items.';
         default: return '';
      }
   }

   get headerIcon() {
      switch (this.currentView()) {
         case 'INBOX': return 'inbox';
         case 'DRAFTS': return 'file-edit';
         case 'WATCHLIST': return 'eye';
         default: return 'layout-dashboard';
      }
   }

   get emptyTitle() {
      if (this.currentView() === 'INBOX') return 'You see zero inbox.';
      if (this.currentView() === 'DRAFTS') return 'No drafts initiated.';
      return 'Nothing to watch.';
   }

   get emptyMessage() {
      if (this.currentView() === 'INBOX') return 'No pending actions for you! Time for a coffee?';
      if (this.currentView() === 'DRAFTS') return 'Start a new NPA in the Agent Dashboard.';
      return 'You haven\'t tracked any items yet.';
   }

   get emptyIcon() {
      if (this.currentView() === 'INBOX') return 'check-circle';
      if (this.currentView() === 'DRAFTS') return 'file-plus';
      return 'search';
   }

   shouldShowMatrix(item: NpaProject): boolean {
      // Always show matrix for context unless it's a raw draft
      if (item.stage === 'DRAFT') return false;
      return true;
   }

   // --- ACTIONS (Sprint 1: Now persisted via server-side transitions API) ---

   submit(item: NpaProject) {
      const actorName = item.submittedBy || 'Maker';
      const call$ = item.stage === 'RETURNED_TO_MAKER'
         ? this.approvalService.resubmitNpa(item.id, actorName)
         : this.approvalService.submitNpa(item.id, actorName);

      call$.subscribe({
         next: () => this.reloadItems(),
         error: (err) => this.toast.error(err.error?.error || 'Submit failed')
      });
   }

   approve(item: NpaProject) {
      const role = this.userRole();

      if (role === 'CHECKER') {
         this.approvalService.checkerApprove(item.id, 'Checker').subscribe({
            next: () => this.reloadItems(),
            error: (err) => this.toast.error(err.error?.error || 'Checker approval failed')
         });
      }
      else if (this.isFunctionalApprover()) {
         const party = this.getPartyFromRole(role);
         if (party) {
            this.approvalService.makeDecision(item.id, party, {
               decision: 'APPROVED',
               comments: 'Approved via dashboard'
            }).subscribe({
               next: () => this.reloadItems(),
               error: (err) => this.toast.error(err.error?.error || 'Sign-off failed')
            });
         }
      }
   }

   requestRework(item: NpaProject) {
      const role = this.userRole();
      if (this.isFunctionalApprover()) {
         const party = this.getPartyFromRole(role);
         const comment = prompt('Enter Rework Comments (e.g. "Fix ROAE"):', 'Please clarify section 3.');
         if (party && comment) {
            this.approvalService.requestRework(item.id, party, party, comment).subscribe({
               next: (res) => {
                  if (res.escalated) {
                     this.toast.warning(`Circuit breaker triggered\! NPA escalated to ${res.escalation_level >= 3 ? 'Governance Forum' : 'Management'}.`);
                  }
                  this.reloadItems();
               },
               error: (err) => this.toast.error(err.error?.error || 'Rework request failed')
            });
         }
      }
   }

   reject(item: NpaProject) {
      const reason = prompt('Enter rejection reason:');
      if (reason) {
         this.approvalService.rejectNpa(item.id, this.userRole(), reason).subscribe({
            next: () => this.reloadItems(),
            error: (err) => this.toast.error(err.error?.error || 'Rejection failed')
         });
      }
   }

   editDraft(item: NpaProject) {
      this.router.navigate(['/npa'], { queryParams: { projectId: item.id, mode: 'edit' } });
   }

   viewDetails(item: NpaProject) {
      this.router.navigate(['/npa'], { queryParams: { projectId: item.id } });
   }

   approveWithConditions(item: NpaProject) {
      const role = this.userRole();
      const party = this.getPartyFromRole(role);
      if (!party) return;
      const conditionText = prompt('Enter condition (e.g. "Complete ROAE assessment within 30 days"):');
      if (!conditionText) return;
      const dueDateStr = prompt('Due date (YYYY-MM-DD, or leave empty):', '');
      const conditions = [{ condition_text: conditionText, due_date: dueDateStr || undefined }];
      this.approvalService.approveConditional(item.id, party, { actor_name: party, conditions }).subscribe({
         next: () => this.reloadItems(),
         error: (err) => this.toast.error(err.error?.error || 'Conditional approval failed')
      });
   }

   finalApprove(item: NpaProject) {
      if (confirm('Grant Final Approval? Product will be LAUNCHED.')) {
         this.approvalService.finalApprove(item.id, 'COO').subscribe({
            next: () => this.reloadItems(),
            error: (err) => this.toast.error(err.error?.error || 'Final approval failed')
         });
      }
   }

   /** Reload all items from API after a transition */
   private reloadItems() {
      this.npaService.getAll().subscribe({
         next: (npas) => {
            this.items = npas.map(n => this.mapApiToNpaProject(n));
            this.updateFilteredItems();
         },
         error: (err) => console.error('Failed to reload NPAs', err)
      });
   }

   // --- HELPERS (Reuse) ---

   isFunctionalApprover() {
      return this.userRole().startsWith('APPROVER_');
   }

   getPartyFromRole(role: string): SignOffParty | null {
      if (role === 'APPROVER_RISK') return 'RMG-Credit';
      if (role === 'APPROVER_MARKET') return 'RMG-Market';
      if (role === 'APPROVER_FINANCE') return 'Group Finance';
      if (role === 'APPROVER_TAX') return 'Group Tax';
      if (role === 'APPROVER_LEGAL') return 'Legal & Compliance';
      if (role === 'APPROVER_OPS') return 'T&O-Ops';
      if (role === 'APPROVER_TECH') return 'T&O-Tech';
      return null;
   }

   formatParty(party: string) {
      return party.replace('RMG-', '').replace('Group ', '').replace('T&O-', '');
   }

   isMySignOffPending(item: NpaProject): boolean {
      const role = this.userRole();
      const party = this.getPartyFromRole(role);
      return !!(party && (item.signOffMatrix[party]?.status === 'PENDING' || item.signOffMatrix[party]?.status === 'REWORK_REQUIRED'));
   }

   // checkIfAllSignedOff is now handled server-side (transitions.js + approvals.js auto-advance)

   getBadgeClass(status: SignOffDecision) {
      switch (status) {
         case 'APPROVED': return 'bg-green-50 text-green-700 border-green-200';
         case 'APPROVED_CONDITIONAL': return 'bg-teal-50 text-teal-700 border-teal-200';
         case 'REWORK_REQUIRED': return 'bg-red-50 text-red-700 border-red-200';
         case 'REJECTED': return 'bg-slate-50 text-slate-700 border-slate-200';
         default: return 'bg-slate-50 text-slate-500 border-slate-200'; // Pending
      }
   }

   getDotClass(status: SignOffDecision) {
      switch (status) {
         case 'APPROVED': return 'bg-green-500';
         case 'APPROVED_CONDITIONAL': return 'bg-teal-500';
         case 'REWORK_REQUIRED': return 'bg-red-500';
         case 'REJECTED': return 'bg-slate-500';
         default: return 'bg-slate-300';
      }
   }
}
