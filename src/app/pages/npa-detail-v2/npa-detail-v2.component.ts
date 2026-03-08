import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';

// ── Agent interface types ────────────────────────────────────────
import {
  ClassificationResult,
  RiskAssessment,
  MLPrediction,
  GovernanceState,
  DocCompletenessResult,
  MonitoringResult,
} from '../../lib/agent-interfaces';

// ── Page-level models & utilities ────────────────────────────────
import {
  DetailTab,
  TabDef,
  ProjectData,
  WorkflowStage,
  ChatMessage,
  DocumentItem,
  MissingDocItem,
  DraftProgressSummary,
  formatCurrency,
} from './models/npa-detail.models';

// ── Mock data constants ──────────────────────────────────────────
import {
  MOCK_TABS,
  MOCK_PROJECT,
  MOCK_CLASSIFICATION,
  MOCK_RISK,
  MOCK_ML_PREDICTION,
  MOCK_GOVERNANCE,
  MOCK_DOC_COMPLETENESS,
  MOCK_MONITORING,
  MOCK_WORKFLOW_STAGES,
  MOCK_DOCUMENTS,
  MOCK_MISSING_DOC_ITEMS,
  MOCK_CHAT_MESSAGES,
  MOCK_REFERENCE_NPAS,
  MOCK_DRAFT_COMMENTS,
  MOCK_DRAFT_AGENT_MESSAGES,
  MOCK_DRAFT_SECTIONS,
} from './models/npa-detail.mock-data';

// ── Draft builder types ──────────────────────────────────────────
import {
  DraftSection,
  DraftComment,
  DraftAgentMessage,
  ReferenceNPA,
} from '../../components/draft-builder/models/draft.models';

// ── Tab components ───────────────────────────────────────────────
import { ProposalTabComponent } from './tabs/proposal-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab.component';
import { AnalysisTabComponent } from './tabs/analysis-tab.component';
import { SignoffTabComponent } from './tabs/signoff-tab.component';
import { WorkflowTabComponent } from './tabs/workflow-tab.component';
import { MonitorTabComponent } from './tabs/monitor-tab.component';
import { ChatTabComponent } from './tabs/chat-tab.component';

// ── Draft builder overlay ────────────────────────────────────────
import { DraftBuilderOverlayComponent } from './draft-builder/draft-builder-overlay.component';

@Component({
  selector: 'app-npa-detail-v2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    SharedIconsModule,
    // Tab components
    ProposalTabComponent,
    DocumentsTabComponent,
    AnalysisTabComponent,
    SignoffTabComponent,
    WorkflowTabComponent,
    MonitorTabComponent,
    ChatTabComponent,
    // Draft builder overlay
    DraftBuilderOverlayComponent,
  ],
  templateUrl: './npa-detail-v2.component.html',
  styleUrls: ['./npa-detail-v2.component.scss'],
})
export class NpaDetailV2Component {

  // ── Tab State ──────────────────────────────────────────────────
  activeTab: DetailTab = 'PROPOSAL';
  tabs: TabDef[] = MOCK_TABS;

  setTab(tab: DetailTab): void {
    this.activeTab = tab;
  }

  // ── Mock Data (will be replaced by API calls) ──────────────────
  project: ProjectData = MOCK_PROJECT;
  classification: ClassificationResult = MOCK_CLASSIFICATION;
  risk: RiskAssessment = MOCK_RISK;
  mlPrediction: MLPrediction = MOCK_ML_PREDICTION;
  governance: GovernanceState = MOCK_GOVERNANCE;
  docCompleteness: DocCompletenessResult = MOCK_DOC_COMPLETENESS;
  monitoring: MonitoringResult = MOCK_MONITORING;
  workflowStages: WorkflowStage[] = MOCK_WORKFLOW_STAGES;
  documents: DocumentItem[] = MOCK_DOCUMENTS;
  missingDocItems: MissingDocItem[] = MOCK_MISSING_DOC_ITEMS;
  chatMessages: ChatMessage[] = [...MOCK_CHAT_MESSAGES];

  // Draft builder data
  draftSections: DraftSection[] = MOCK_DRAFT_SECTIONS;
  draftComments: DraftComment[] = [...MOCK_DRAFT_COMMENTS];
  draftAgentMessages: DraftAgentMessage[] = [...MOCK_DRAFT_AGENT_MESSAGES];
  referenceNPAs: ReferenceNPA[] = MOCK_REFERENCE_NPAS;
  selectedRefNPA: ReferenceNPA | null = null;

  // ── Draft Builder Overlay ──────────────────────────────────────
  showDraftBuilder = false;

  openDraftBuilder(): void {
    this.showDraftBuilder = true;
  }

  closeDraftBuilder(): void {
    this.showDraftBuilder = false;
  }

  // ── Chat Handler ───────────────────────────────────────────────
  onChatMessageSent(text: string): void {
    this.chatMessages.push({
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    });
  }

  // ── Draft Comment / Agent Handlers ─────────────────────────────
  onCommentAdded(event: { fieldKey: string; text: string }): void {
    this.draftComments.push({
      id: `c-${Date.now()}`,
      fieldKey: event.fieldKey,
      author: 'Sarah Chen',
      text: event.text,
      timestamp: new Date().toLocaleString(),
      resolved: false,
    });
  }

  onCommentResolved(commentId: string): void {
    const c = this.draftComments.find(x => x.id === commentId);
    if (c) c.resolved = true;
  }

  onAgentMessageSent(text: string): void {
    this.draftAgentMessages.push({
      id: `da-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    });
    // Simulated agent reply
    setTimeout(() => {
      this.draftAgentMessages.push({
        id: `da-${Date.now()}`,
        role: 'agent',
        agentTeam: 'Orchestrator',
        text: `Based on MBS policy guidelines, I recommend reviewing the relevant sections in the NPA template. Shall I pre-fill any specific fields?`,
        timestamp: new Date().toLocaleTimeString(),
        citations: ['NPA Policy Manual v4.2, Section 3.1', 'Trade Finance Ops Manual, Section 7.3'],
      });
    }, 800);
  }

  // ── Draft Progress (for proposal tab banner) ───────────────────
  getDraftProgress(): DraftProgressSummary {
    let filled = 0, total = 0, required = 0, requiredFilled = 0;
    for (const sec of this.draftSections) {
      for (const f of sec.fields) {
        total++;
        const isFilled = !!(f.value || (f.bulletItems && f.bulletItems.length > 0));
        if (isFilled) filled++;
        if (f.required) { required++; if (isFilled) requiredFilled++; }
      }
      if (sec.subSections) {
        for (const sub of sec.subSections) {
          for (const f of sub.fields) {
            total++;
            const isFilled = !!(f.value || (f.bulletItems && f.bulletItems.length > 0));
            if (isFilled) filled++;
            if (f.required) { required++; if (isFilled) requiredFilled++; }
          }
        }
      }
    }
    return { filled, total, required, requiredFilled };
  }

  // ── Utility (exposed to template) ──────────────────────────────
  formatCurrency = formatCurrency;
}
