import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { OrchestratorChatComponent } from '../../../components/npa/ideation-chat/ideation-chat.component';
import { DceDagVisualizerComponent, DagNode } from '../../../components/dce/dce-dag-visualizer.component';
import { DceHitlReviewPanelComponent } from '../../../components/dce/dce-hitl-review-panel.component';
import { DceAoFormComponent } from '../../../components/dce/dce-ao-form/dce-ao-form.component';
import { AoFormProgressComponent } from '../../../components/dce/dce-ao-form/dce-ao-form-progress.component';
import { AoFormProgress, AoSourceAgent } from '../../../components/dce/dce-ao-form/dce-ao-form.interfaces';
import { getVisibleSections } from '../../../components/dce/dce-ao-form/dce-ao-form.config';
import { buildAoFormData } from '../../../components/dce/dce-ao-form/dce-ao-form-mock';
import {
   DceService,
   DceCaseState,
   DceClassification,
   DceCheckpoint,
   DceRmHierarchy,
   DceCompletenessAssessment,
   DceStagedDocument,
   DceChecklistItem,
   DceEvent,
   DceNotification,
   DceSignatureVerification,
   DceSignatory,
   DceKycBrief,
   DceKycScreeningResult,
   DceCreditResponse,
   DceCreditBrief,
   DceFinancialExtract,
   DceCreditDecision,
   DceConfigResponse,
   DceConfigSpec,
   DceTmoInstruction,
   DceSystemValidation,
   DceHitlReviewTask,
   DceDecisionField,
   DceRmKycDecision,
} from '../../../services/dce.service';
import { ChatSessionService } from '../../../services/chat-session.service';
import {
   getMockCaseDetail, getMockDocuments, getMockSignatures,
   getMockKyc, getMockCredit, getMockConfig, getMockEvents, getMockHitlTasks,
} from './dce-mock-data';
import { catchError, of } from 'rxjs';

export type DceDetailTab = 'OVERVIEW' | 'DOCUMENTS' | 'SIGNATURES' | 'KYC' | 'CREDIT' | 'CONFIG' | 'PIPELINE' | 'EVENTS' | 'CHAT';

@Component({
   selector: 'app-dce-work-item',
   standalone: true,
   imports: [
      CommonModule, FormsModule, LucideAngularModule,
      OrchestratorChatComponent, DceDagVisualizerComponent, DceHitlReviewPanelComponent,
      DceAoFormComponent, AoFormProgressComponent,
   ],
   templateUrl: './dce-work-item.component.html',
   styleUrls: ['./dce-work-item.component.css']
})
export class DceWorkItemComponent implements OnInit {
   @Input() dceContext: any = null;
   @Output() onBack = new EventEmitter<void>();

   activeTab: DceDetailTab = 'OVERVIEW';

   // AO Form overlay (NPA Draft Card pattern)
   showAoForm = false;
   aoFormProgress: AoFormProgress = { filled: 0, total: 0, percent: 0 };
   aoFormAgents: AoSourceAgent[] = [];
   aoFormSectionCount = 0;

   // Case data
   caseId: string | null = null;
   caseData: DceCaseState | null = null;
   classification: DceClassification | null = null;
   checkpoints: DceCheckpoint[] = [];
   rmHierarchy: DceRmHierarchy | null = null;
   completeness: DceCompletenessAssessment | null = null;

   // Documents (SA-2)
   stagedDocuments: DceStagedDocument[] = [];
   checklistItems: DceChecklistItem[] = [];

   // Events
   events: DceEvent[] = [];
   notifications: DceNotification[] = [];

   // Signatures (SA-3) — typed
   signatureData: DceSignatureVerification | null = null;

   // KYC (SA-4) — typed
   kycBrief: DceKycBrief | null = null;

   // Credit (SA-5) — typed
   creditResponse: DceCreditResponse | null = null;
   get creditBrief(): DceCreditBrief | null { return this.creditResponse?.credit_brief || null; }
   get financialExtracts(): DceFinancialExtract[] { return this.creditResponse?.financial_extracts || []; }
   get creditDecision(): DceCreditDecision | null { return this.creditResponse?.credit_decision || null; }

   // Config (SA-6) — typed
   configResponse: DceConfigResponse | null = null;
   get configSpec(): DceConfigSpec | null { return this.configResponse?.config_spec || null; }
   get tmoInstructions(): DceTmoInstruction | null { return this.configResponse?.tmo_instructions || null; }
   get systemValidations(): DceSystemValidation[] { return this.configResponse?.system_validations || []; }

   // HITL tasks
   hitlTasks: DceHitlReviewTask[] = [];

   // KYC RM decision form model
   kycDecisionFields: DceDecisionField[] = [
      { key: 'kyc_risk_rating', label: 'KYC Risk Rating', type: 'select', required: true, options: [
         { label: 'LOW', value: 'LOW' }, { label: 'MEDIUM', value: 'MEDIUM' },
         { label: 'HIGH', value: 'HIGH' }, { label: 'UNACCEPTABLE', value: 'UNACCEPTABLE' },
      ]},
      { key: 'cdd_clearance', label: 'CDD Clearance', type: 'select', required: true, options: [
         { label: 'Cleared', value: 'CLEARED' }, { label: 'Enhanced Due Diligence', value: 'ENHANCED_DUE_DILIGENCE' },
         { label: 'Declined', value: 'DECLINED' },
      ]},
      { key: 'bcap_clearance', label: 'BCAP Clearance', type: 'checkbox', required: true },
      { key: 'caa_approach', label: 'CAA Approach', type: 'select', required: true, options: [
         { label: 'IRB', value: 'IRB' }, { label: 'SA', value: 'SA' },
      ]},
      { key: 'recommended_dce_limit_sgd', label: 'DCE Limit (SGD)', type: 'number', required: true },
      { key: 'recommended_dce_pce_limit_sgd', label: 'PCE Limit (SGD)', type: 'number', required: true },
      { key: 'osca_case_number', label: 'OSCA Case Number', type: 'text', required: true },
      { key: 'additional_conditions', label: 'Additional Conditions', type: 'textarea', required: false },
   ];

   // Credit decision form model
   creditDecisionFields: DceDecisionField[] = [
      { key: 'credit_outcome', label: 'Credit Outcome', type: 'select', required: true, options: [
         { label: 'Approved', value: 'APPROVED' }, { label: 'Approved with Conditions', value: 'APPROVED_WITH_CONDITIONS' },
         { label: 'Declined', value: 'DECLINED' },
      ]},
      { key: 'approved_dce_limit_sgd', label: 'Approved DCE Limit (SGD)', type: 'number', required: true },
      { key: 'approved_dce_pce_limit_sgd', label: 'Approved PCE Limit (SGD)', type: 'number', required: true },
      { key: 'confirmed_caa_approach', label: 'Confirmed CAA Approach', type: 'select', required: true, options: [
         { label: 'IRB', value: 'IRB' }, { label: 'SA', value: 'SA' },
      ]},
      { key: 'conditions', label: 'Conditions', type: 'textarea', required: false },
   ];

   // Signature decision fields (empty — signature decisions use direct approve/reject per signatory)
   signatureDecisionFields: DceDecisionField[] = [];

   // Config decision fields (TMO just validates)
   configDecisionFields: DceDecisionField[] = [];

   // DAG pipeline nodes
   dagNodes: DagNode[] = [
      { id: 'N-0', label: 'Intake', status: 'PENDING' },
      { id: 'N-1', label: 'Documents', status: 'PENDING' },
      { id: 'N-2', label: 'Signatures', status: 'PENDING', isHitl: true, hitlPersona: 'Desk Support' },
      { id: 'N-3', label: 'KYC/CDD', status: 'PENDING', isHitl: true, hitlPersona: 'RM' },
      { id: 'N-4', label: 'Credit', status: 'PENDING', isHitl: true, hitlPersona: 'Credit Team' },
      { id: 'N-5', label: 'Config', status: 'PENDING', isHitl: true, hitlPersona: 'TMO Static' },
      { id: 'N-6', label: 'Notify', status: 'PENDING' },
   ];

   tabs: { id: DceDetailTab; label: string; icon: string; badge?: string }[] = [
      { id: 'OVERVIEW', label: 'Overview', icon: 'clipboard-list' },
      { id: 'DOCUMENTS', label: 'Docs', icon: 'folder-check' },
      { id: 'SIGNATURES', label: 'Signatures', icon: 'pen-tool' },
      { id: 'KYC', label: 'KYC', icon: 'shield-check' },
      { id: 'CREDIT', label: 'Credit', icon: 'landmark' },
      { id: 'CONFIG', label: 'Config', icon: 'settings' },
      { id: 'PIPELINE', label: 'Pipeline', icon: 'git-branch' },
      { id: 'EVENTS', label: 'Events', icon: 'activity' },
      { id: 'CHAT', label: 'Chat', icon: 'message-square' },
   ];

   // Expanded KYC sections for accordion
   expandedKycSections: Set<number> = new Set([0]);

   /** Document preview panel is only relevant on Overview and Docs tabs */
   private readonly DOC_PREVIEW_TABS: Set<DceDetailTab> = new Set(['OVERVIEW', 'DOCUMENTS']);
   get showDocumentPreview(): boolean {
      return this.DOC_PREVIEW_TABS.has(this.activeTab);
   }

   private dceService = inject(DceService);
   private chatSessionService = inject(ChatSessionService);

   private loadedForId: string | null = null;

   ngOnInit() {
      this.resolveContext();
   }

   private resolveContext() {
      if (this.dceContext) {
         this.caseId = this.dceContext.caseId || this.dceContext.case_id || this.dceContext.id || null;
      }
      if (this.caseId && this.loadedForId !== this.caseId) {
         this.loadedForId = this.caseId;
         this.loadCase(this.caseId);
      }
   }

   private loadCase(caseId: string) {
      // Case detail — fallback to mock
      this.dceService.getCaseDetail(caseId).pipe(
         catchError(() => of(getMockCaseDetail()))
      ).subscribe(res => {
         this.caseData = res.case_state;
         this.classification = res.classification;
         this.checkpoints = res.checkpoints || [];
         this.rmHierarchy = res.rm_hierarchy;
         this.completeness = res.completeness_assessment;
         this.updateDagNodes();
         this.updateTabBadges();
         this.computeAoFormSummary();
      });

      // Documents — fallback to mock
      this.dceService.getCaseDocuments(caseId).pipe(
         catchError(() => of(getMockDocuments()))
      ).subscribe(res => {
         this.stagedDocuments = res.staged_documents || [];
         this.checklistItems = res.checklist_items || [];
         this.updateTabBadges();
      });

      // Events — fallback to mock
      this.dceService.getCaseEvents(caseId).pipe(
         catchError(() => of(getMockEvents()))
      ).subscribe(res => {
         this.events = res.events || [];
         this.notifications = res.notifications || [];
         this.updateTabBadges();
      });

      // SA-3 Signatures — fallback to mock
      this.dceService.getCaseSignatures(caseId).pipe(
         catchError(() => of(getMockSignatures()))
      ).subscribe(res => {
         this.signatureData = res;
         this.updateTabBadges();
         this.computeAoFormSummary();
      });

      // SA-4 KYC — fallback to mock
      this.dceService.getCaseKyc(caseId).pipe(
         catchError(() => of(getMockKyc()))
      ).subscribe(res => {
         this.kycBrief = res;
         this.updateTabBadges();
         this.computeAoFormSummary();
      });

      // SA-5 Credit — fallback to mock
      this.dceService.getCaseCredit(caseId).pipe(
         catchError(() => of(getMockCredit()))
      ).subscribe(res => {
         this.creditResponse = res;
      });

      // SA-6 Config — fallback to mock
      this.dceService.getCaseConfig(caseId).pipe(
         catchError(() => of(getMockConfig()))
      ).subscribe(res => {
         this.configResponse = res;
      });

      // HITL tasks — from mock
      this.hitlTasks = getMockHitlTasks();

      // Rehydrate chat sessions
      this.chatSessionService.loadSessionsForProject(caseId);
   }

   private updateDagNodes() {
      if (!this.caseData) return;
      const completed = new Set(this.caseData.completed_nodes || []);
      const current = this.caseData.current_node;
      const failed = new Set((this.caseData.failed_nodes || []).map((f: any) => typeof f === 'string' ? f : f.node_id));
      const hitl = this.caseData.status === 'HITL_PENDING';

      this.dagNodes = this.dagNodes.map(node => {
         let status: DagNode['status'] = 'PENDING';
         if (completed.has(node.id)) {
            status = 'COMPLETED';
         } else if (node.id === current) {
            status = hitl ? 'HITL_PENDING' : 'IN_PROGRESS';
         } else if (failed.has(node.id)) {
            status = 'FAILED';
         }
         return { ...node, status };
      });
   }

   private updateTabBadges() {
      const tabMap = new Map(this.tabs.map(t => [t.id, t]));

      // Documents badge
      const docTab = tabMap.get('DOCUMENTS');
      if (docTab) {
         const matched = this.checklistItems.filter(i => i.match_status === 'MATCHED').length;
         docTab.badge = `${matched}/${this.checklistItems.length}`;
      }

      // Signatures badge
      const sigTab = tabMap.get('SIGNATURES');
      if (sigTab && this.signatureData) {
         const pending = this.signatureData.signatories.filter(s => !s.outcome).length;
         sigTab.badge = pending > 0 ? `${pending}` : undefined;
      }

      // KYC HITL badge
      const kycTab = tabMap.get('KYC');
      if (kycTab && this.caseData?.status === 'HITL_PENDING' && this.caseData?.current_node === 'N-3') {
         kycTab.badge = 'HITL';
      }

      // Credit HITL badge
      const creditTab = tabMap.get('CREDIT');
      if (creditTab && this.caseData?.status === 'HITL_PENDING' && this.caseData?.current_node === 'N-4') {
         creditTab.badge = 'HITL';
      }

      // Config HITL badge
      const configTab = tabMap.get('CONFIG');
      if (configTab && this.caseData?.status === 'HITL_PENDING' && this.caseData?.current_node === 'N-5') {
         configTab.badge = 'HITL';
      }

      // Events count
      const eventsTab = tabMap.get('EVENTS');
      if (eventsTab) {
         eventsTab.badge = `${this.events.length}`;
      }
   }

   // ─── HITL Task Helpers ────────────────────────────────────────────

   getHitlTaskForNode(nodeId: string): DceHitlReviewTask | null {
      return this.hitlTasks.find(t => t.node_id === nodeId) || null;
   }

   get activeHitlTask(): DceHitlReviewTask | null {
      return this.hitlTasks.find(t => t.status === 'PENDING' || t.status === 'IN_REVIEW') || null;
   }

   // ─── HITL Decision Handlers ──────────────────────────────────────

   onSignatureApprove(event: { task: DceHitlReviewTask; fields: Record<string, any> }) {
      if (!this.caseId || !this.signatureData) return;
      const decisions = this.signatureData.signatories.map(s => ({
         signatory_id: s.signatory_id,
         outcome: 'APPROVED',
         notes: 'Approved via HITL panel',
      }));
      this.dceService.submitSignatureDecision(this.caseId, {
         mode: 'RESUME',
         task_id: event.task.task_id,
         decisions,
      }).pipe(catchError(() => {
         // Mock mode — update local state
         event.task.status = 'DECIDED';
         event.task.decided_at = new Date().toISOString();
         return of(null);
      })).subscribe(() => {
         if (this.caseId) this.loadCase(this.caseId);
      });
   }

   onKycApprove(event: { task: DceHitlReviewTask; fields: Record<string, any> }) {
      if (!this.caseId) return;
      const rmDecisions: DceRmKycDecision = {
         kyc_risk_rating: event.fields['kyc_risk_rating'] || 'MEDIUM',
         cdd_clearance: event.fields['cdd_clearance'] || 'CLEARED',
         bcap_clearance: !!event.fields['bcap_clearance'],
         caa_approach: event.fields['caa_approach'] || 'IRB',
         recommended_dce_limit_sgd: Number(event.fields['recommended_dce_limit_sgd']) || 500000,
         recommended_dce_pce_limit_sgd: Number(event.fields['recommended_dce_pce_limit_sgd']) || 250000,
         osca_case_number: event.fields['osca_case_number'] || 'OSCA-TBD',
         limit_exposure_indication: 'Within policy limits',
         additional_conditions: event.fields['additional_conditions'] ? [event.fields['additional_conditions']] : null,
         rm_id: 'RM-0042',
         decided_at: new Date().toISOString(),
      };
      this.dceService.submitKycDecision(this.caseId, {
         mode: 'RESUME',
         task_id: event.task.task_id,
         rm_decisions: rmDecisions,
      }).pipe(catchError(() => {
         event.task.status = 'DECIDED';
         event.task.decided_at = new Date().toISOString();
         if (this.kycBrief) this.kycBrief.rm_decisions = rmDecisions;
         return of(null);
      })).subscribe(() => {
         if (this.caseId) this.loadCase(this.caseId);
      });
   }

   onCreditApprove(event: { task: DceHitlReviewTask; fields: Record<string, any> }) {
      if (!this.caseId) return;
      this.dceService.submitCreditDecision(this.caseId, {
         mode: 'RESUME',
         task_id: event.task.task_id,
         credit_decisions: {
            credit_outcome: event.fields['credit_outcome'] || 'APPROVED',
            approved_dce_limit_sgd: Number(event.fields['approved_dce_limit_sgd']) || 500000,
            approved_dce_pce_limit_sgd: Number(event.fields['approved_dce_pce_limit_sgd']) || 250000,
            confirmed_caa_approach: event.fields['confirmed_caa_approach'] || 'IRB',
            conditions: event.fields['conditions'] ? [event.fields['conditions']] : [],
         },
      }).pipe(catchError(() => {
         event.task.status = 'DECIDED';
         event.task.decided_at = new Date().toISOString();
         return of(null);
      })).subscribe(() => {
         if (this.caseId) this.loadCase(this.caseId);
      });
   }

   onConfigApprove(event: { task: DceHitlReviewTask; fields: Record<string, any> }) {
      if (!this.caseId) return;
      this.dceService.submitConfigValidation(this.caseId, {
         mode: 'RESUME',
         task_id: event.task.task_id,
      }).pipe(catchError(() => {
         event.task.status = 'DECIDED';
         event.task.decided_at = new Date().toISOString();
         return of(null);
      })).subscribe(() => {
         if (this.caseId) this.loadCase(this.caseId);
      });
   }

   onHitlReject(task: DceHitlReviewTask) {
      console.log('[DceWorkItem] HITL reject:', task);
      // In real implementation: would call a reject endpoint
   }

   onHitlClarify(task: DceHitlReviewTask) {
      console.log('[DceWorkItem] HITL clarify:', task);
   }

   onHitlEscalate(task: DceHitlReviewTask) {
      console.log('[DceWorkItem] HITL escalate:', task);
   }

   onHitlNudge(task: DceHitlReviewTask) {
      console.log('[DceWorkItem] HITL nudge:', task);
   }

   // ─── Signature helpers ────────────────────────────────────────────

   onSignatoryAction(signatory: DceSignatory, action: 'APPROVED' | 'REJECTED' | 'CLARIFY') {
      signatory.outcome = action;
      signatory.decided_at = new Date().toISOString();
      signatory.reviewer = 'Current User';
   }

   // ─── KYC section toggle ──────────────────────────────────────────

   toggleKycSection(index: number) {
      if (this.expandedKycSections.has(index)) {
         this.expandedKycSections.delete(index);
      } else {
         this.expandedKycSections.add(index);
      }
   }

   isKycSectionExpanded(index: number): boolean {
      return this.expandedKycSections.has(index);
   }

   // ─── Event icon helper ───────────────────────────────────────────

   getEventIcon(eventType: string): string {
      const map: Record<string, string> = {
         'CASE_CREATED': 'plus',
         'CLASSIFICATION_COMPLETE': 'scan-search',
         'NODE_COMPLETED': 'check-circle',
         'DOCUMENTS_STAGED': 'file-text',
         'CHECKLIST_COMPLETE': 'list-checks',
         'SIGNATURE_ANALYSED': 'pen-tool',
         'HITL_TASK_CREATED': 'clock',
         'HITL_DECISION_SUBMITTED': 'check-circle',
         'KYC_BRIEF_GENERATED': 'shield-check',
         'CREDIT_BRIEF_GENERATED': 'landmark',
         'CONFIG_SPEC_GENERATED': 'settings',
         'WELCOME_KIT_SENT': 'rocket',
      };
      return map[eventType] || 'arrow-right';
   }

   getEventIconColor(eventType: string): string {
      if (eventType.includes('COMPLETED') || eventType.includes('DECISION_SUBMITTED')) return 'bg-green-100 text-green-600';
      if (eventType.includes('HITL')) return 'bg-amber-100 text-amber-600';
      if (eventType.includes('FAILED') || eventType.includes('ERROR')) return 'bg-red-100 text-red-600';
      return 'bg-slate-100 text-slate-500';
   }

   // ─── AO Form Overlay (NPA Draft Card pattern) ───────────────────

   openAoForm(): void { this.showAoForm = true; }
   closeAoForm(): void { this.showAoForm = false; }

   private computeAoFormSummary(): void {
      const entityType = this.classification?.client_entity_type || null;
      const products = this.classification?.products_requested || null;
      const sections = getVisibleSections(entityType, products);
      this.aoFormSectionCount = sections.length;

      const formData = buildAoFormData(
         this.classification, this.kycBrief, this.signatureData,
         this.creditResponse, this.configResponse,
      );

      let filled = 0;
      let total = 0;
      const agents = new Set<AoSourceAgent>();
      for (const section of sections) {
         for (const field of section.fields) {
            total++;
            const fv = formData.fields[field.key];
            if (fv?.fillStatus === 'FILLED') {
               filled++;
               if (fv.filledBy) agents.add(fv.filledBy);
            }
         }
      }
      this.aoFormProgress = { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
      this.aoFormAgents = Array.from(agents).sort();
   }

   getAoAgentBadgeClass(agent: string | null): string {
      if (!agent) return 'bg-slate-100 text-slate-600';
      const map: Record<string, string> = {
         'SA-1': 'bg-blue-100 text-blue-700',
         'SA-2': 'bg-purple-100 text-purple-700',
         'SA-3': 'bg-emerald-100 text-emerald-700',
         'SA-4': 'bg-amber-100 text-amber-700',
         'SA-5': 'bg-rose-100 text-rose-700',
         'SA-6': 'bg-cyan-100 text-cyan-700',
         'SA-7': 'bg-indigo-100 text-indigo-700',
         'MANUAL': 'bg-slate-100 text-slate-700',
      };
      return map[agent] || 'bg-slate-100 text-slate-600';
   }

   // ─── General Helpers ─────────────────────────────────────────────

   onRefreshCase() {
      if (this.caseId) {
         this.loadCase(this.caseId);
      }
   }

   getNodeLabel(nodeId: string | undefined): string {
      const labels: Record<string, string> = {
         'N-0': 'N-0 Intake & Triage',
         'N-1': 'N-1 Document Collection',
         'N-2': 'N-2 Signature Verification',
         'N-3': 'N-3 KYC/CDD',
         'N-4': 'N-4 Credit Risk',
         'N-5': 'N-5 Account Config',
         'N-6': 'N-6 Notification',
         'DONE': 'Completed',
         'HITL_RM': 'Pending RM Action',
         'HITL_DESK': 'Pending Desk Support',
      };
      return labels[nodeId || ''] || nodeId || '—';
   }

   getPriorityBadge(priority: string | undefined): string {
      const map: Record<string, string> = {
         'URGENT': 'bg-red-100 text-red-700 border-red-200',
         'STANDARD': 'bg-blue-100 text-blue-700 border-blue-200',
         'DEFERRED': 'bg-gray-100 text-gray-600 border-gray-200',
      };
      return map[priority || ''] || 'bg-blue-100 text-blue-700 border-blue-200';
   }

   getStatusBadge(status: string | undefined): string {
      const map: Record<string, string> = {
         'ACTIVE': 'bg-green-50 text-green-700 border-green-200',
         'HITL_PENDING': 'bg-amber-50 text-amber-700 border-amber-200',
         'ESCALATED': 'bg-red-50 text-red-700 border-red-200',
         'DONE': 'bg-slate-50 text-slate-600 border-slate-200',
         'DEAD': 'bg-gray-100 text-gray-500 border-gray-200',
      };
      return map[status || ''] || 'bg-green-50 text-green-700 border-green-200';
   }

   formatDate(dateStr: string | null | undefined): string {
      if (!dateStr) return '—';
      return new Date(dateStr).toLocaleDateString('en-SG', {
         day: '2-digit', month: 'short', year: 'numeric'
      });
   }

   formatDateTime(dateStr: string | null | undefined): string {
      if (!dateStr) return '—';
      return new Date(dateStr).toLocaleString('en-SG', {
         day: '2-digit', month: 'short', year: 'numeric',
         hour: '2-digit', minute: '2-digit'
      });
   }

   formatFileSize(bytes: number): string {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
   }

   getKycSectionKeys(): { key: string; label: string }[] {
      return [
         { key: 'entity_summary', label: '1. Entity Summary' },
         { key: 'ownership_chain', label: '2. Ownership Chain' },
         { key: 'acra_coi', label: '3. ACRA / Certificate of Incorporation' },
         { key: 'directors', label: '4. Directors' },
         { key: 'beneficial_owners', label: '5. Ultimate Beneficial Owners (UBOs)' },
         { key: 'screening_summary', label: '6. Screening Summary' },
         { key: 'source_of_wealth', label: '7. Source of Wealth' },
         { key: 'risk_factors', label: '8. Risk Factors' },
         { key: 'is_retail_investor', label: '9. Retail Investor Flag' },
         { key: 'open_questions', label: '10. Open Questions' },
         { key: 'suggested_risk_range', label: '11. Suggested Risk Rating' },
      ];
   }

   getKycFieldValue(key: string): string {
      if (!this.kycBrief) return '';
      return (this.kycBrief as any)[key] || '';
   }

   countByStatus(status: string): number {
      return this.checklistItems.filter(i => i.match_status === status).length;
   }

   formatSnakeCase(value: string | null | undefined): string {
      if (!value) return '—';
      return value.replace(/_/g, ' ');
   }
}
