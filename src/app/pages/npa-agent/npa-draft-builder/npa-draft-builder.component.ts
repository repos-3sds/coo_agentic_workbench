import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import {
   NPA_PART_C_TEMPLATE,
   NPA_APPENDICES_TEMPLATE,
   TemplateNode,
   collectFieldKeys,
   getNavSections,
   NPA_FIELD_REGISTRY,
   FIELD_REGISTRY_MAP,
   FieldRegistryEntry
} from '../../../lib/npa-template-definition';
import { FieldLineage, LineageMetadata, NpaFieldType, Citation } from '../../../lib/npa-interfaces';
import { WorkflowStreamEvent } from '../../../lib/agent-interfaces';

// Sub-components
import { NpaFieldRendererComponent } from './components/npa-field-renderer/npa-field-renderer.component';
import { NpaSectionStepperComponent } from './components/npa-section-stepper/npa-section-stepper.component';
import { NpaAgentChatComponent, FieldSuggestion } from './components/npa-agent-chat/npa-agent-chat.component';

// ────────────────────────────────────────────────────────────
// Types (exported for child components to import)
// ────────────────────────────────────────────────────────────

export type SignOffGroupId = 'BIZ' | 'TECH_OPS' | 'FINANCE' | 'RMG' | 'LCS';

export interface SignOffGroup {
   id: SignOffGroupId;
   label: string;
   shortLabel: string;
   icon: string;
   color: string;
   bgClass: string;
   textClass: string;
   borderClass: string;
   sections: string[];
}

export interface StepperSection {
   id: string;
   numbering: string;
   label: string;
   icon: string;
   fieldCount: number;
   filledCount: number;
   owner: SignOffGroupId;
   status: 'empty' | 'partial' | 'complete' | 'streaming';
   children: TemplateNode[];
}

export interface FieldState {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   lineageMetadata?: LineageMetadata;
   strategy: string;
   confidence?: number;
   source?: string;
   nodeId?: string;
   isStreaming: boolean;
   isEditing: boolean;
   type: NpaFieldType;
   placeholder?: string;
   tooltip?: string;
   required?: boolean;
   options?: string[];
   bulletItems?: string[];
   selectedOptions?: string[];
   yesNoValue?: boolean | null;
   conditionalText?: string;
   dependsOn?: { field: string; value: string };
   attachable?: boolean;
   attachedFiles?: string[];
   referenceUrl?: string;
   currencyCode?: string;
   tableColumns?: string[];
   tableData?: any[][];
   validationError?: string;
}

export interface AgentChat {
   id: SignOffGroupId;
   messages: ChatMessage[];
   isConnected: boolean;
   isStreaming: boolean;
   streamText: string;
   sessionId?: string;
}

export interface ChatMessage {
   role: 'user' | 'agent' | 'system';
   content: string;
   timestamp: Date;
   fieldRef?: string;
}

// ────────────────────────────────────────────────────────────
// Comments (UI-only placeholder; persistence comes later)
// ────────────────────────────────────────────────────────────

interface CommentReply {
   id: number;
   author: string;
   when: string;
   text: string;
}

interface CommentItem {
   id: number;
   author: string;
   when: string;
   text: string;
   replies: CommentReply[];
}

interface CommentThread {
   key: string;
   title: string;
   ref: string;
   comments: CommentItem[];
}

type CommentScope = 'DRAFT' | 'FIELD';

interface DbCommentRow {
   id: number;
   project_id: string;
   comment_type: string;
   scope?: string | null;
   field_key?: string | null;
   comment_text: string;
   author_user_id?: string | null;
   author_name?: string | null;
   author_role?: string | null;
   parent_comment_id?: number | null;
   created_at: string;
}

// ────────────────────────────────────────────────────────────
// Sign-Off Group Definitions
// ────────────────────────────────────────────────────────────

export const SIGN_OFF_GROUPS: SignOffGroup[] = [
   {
      id: 'BIZ',
      label: 'Proposing Unit (Business)',
      shortLabel: 'Business',
      icon: 'briefcase',
      color: 'blue',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-700',
      borderClass: 'border-blue-200',
      sections: ['PC.I', 'PC.VII']
   },
   {
      id: 'TECH_OPS',
      label: 'T&O + ISS',
      shortLabel: 'T&O',
      icon: 'settings',
      color: 'indigo',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-700',
      borderClass: 'border-indigo-200',
      sections: ['PC.II']
   },
   {
      id: 'FINANCE',
      label: 'Group Finance',
      shortLabel: 'Finance',
      icon: 'calculator',
      color: 'emerald',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
      sections: ['PC.III', 'PC.V']
   },
   {
      id: 'RMG',
      label: 'RMG (Market & Credit)',
      shortLabel: 'RMG',
      icon: 'shield-alert',
      color: 'rose',
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-700',
      borderClass: 'border-rose-200',
      sections: ['PC.IV', 'PC.VI']
   },
   {
      id: 'LCS',
      label: 'Legal, Compliance & Secretariat',
      shortLabel: 'Legal',
      icon: 'scale',
      color: 'amber',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-700',
      borderClass: 'border-amber-200',
      sections: ['APP.1', 'APP.2', 'APP.3', 'APP.4', 'APP.5', 'APP.6']
   }
];

@Component({
   selector: 'app-npa-draft-builder',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      SharedIconsModule,
      NpaFieldRendererComponent,
      NpaSectionStepperComponent,
      NpaAgentChatComponent
   ],
   templateUrl: './npa-draft-builder.component.html',
   styleUrls: ['./npa-draft-builder.component.css']
})
export class NpaDraftBuilderComponent implements OnInit, OnDestroy {
   @Output() close = new EventEmitter<void>();
   @Output() onSave = new EventEmitter<any>();
   @Input() inputData: any = null;

   private http = inject(HttpClient);
   private cdr = inject(ChangeDetectorRef);
   private authService = inject(AuthService);

   @ViewChild('agentChat') agentChatComponent?: NpaAgentChatComponent;

   /** Read-only UI mode for non Maker/Checker personas */
   isReadOnly = false;

   /** Right panel collapse (hamburger) */
   rightPanelCollapsed = false;

   /** Save status */
   draftSaveError: string | null = null;

   // ─── Issues / Required tracking (for layout + right panel) ───────────────
   requiredMissingBySection: Record<string, number> = {};
   requiredTotal = 0;
   requiredFilled = 0;
   requiredMissing = 0;
   focusedFieldKey: string | null = null;

   // Comments drawer state (non-breaking placeholder)
   commentsDrawerOpen = false;
   commentsDrawerTitle = '';
   commentsDrawerRef = '';
   commentDraft = '';
   replyToCommentId: number | null = null;
   replyDraft = '';
   activeThread: CommentThread | null = null;
   private threads = new Map<string, CommentThread>(); // fallback cache if DB unavailable
   commentsLoading = false;
   commentsError = '';
   private activeCommentScope: CommentScope = 'DRAFT';
   private activeCommentFieldKey: string | null = null;
   private draftCommentsCountValue = 0;

   // ─── Stepper State ──────────────────────────────────────────
   stepperSections: StepperSection[] = [];
   activeSectionId = 'PC.I';
   expandedSections = new Set<string>(['PC.I']);

   // ─── Field State ────────────────────────────────────────────
   fieldMap = new Map<string, FieldState>();
   sectionFieldGroups = new Map<string, { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[]>();

   // ─── Agent Chat ─────────────────────────────────────────────
   signOffGroups = SIGN_OFF_GROUPS;
   activeAgentId: SignOffGroupId = 'BIZ';
   agentChats = new Map<SignOffGroupId, AgentChat>();

   // ─── Live Streaming ─────────────────────────────────────────
   isStreaming = false;
   streamingAgent: SignOffGroupId | null = null;

   // ─── Auto-save ────────────────────────────────────────────
   private autoSaveTimer: ReturnType<typeof setInterval> | null = null;
   lastSavedAt: Date | null = null;
   isDirty = false;
   isSavingDraft = false;

   // ─── Completion Tracking ────────────────────────────────────
   overallProgress = 0;
   totalFields = 0;
   filledFields = 0;
   private statsRecomputeScheduled = false;

   // ─── NPA Classification ──────────────────────────────────────
   npaClassification: 'New-to-Group' | 'Variation' | 'Existing' | 'NPA Lite' = 'New-to-Group';
   private readonly npaLiteExcludedSections = new Set(['PC.III', 'PC.V', 'PC.VII', 'APP.4', 'APP.5', 'APP.6']);

   // ─── Validation ──────────────────────────────────────────────
   validationErrors: { field: string; label: string; section: string }[] = [];
   showValidation = false;

   // ─── Knowledge & Evidence Panel ─────────────────────────────
   agentPanelTab: 'CHAT' | 'KNOWLEDGE' | 'ISSUES' = 'CHAT'; // Toggle between Chat and KB/Issues
   selectedCitation: Citation | null = null; // Currently viewed citation

   // Track field-level changes so DB persists never wipe untouched fields.
   // Allows explicit clears (empty string) to be persisted safely.
   private dirtyFieldKeys = new Set<string>();

   // ─── Reference NPA Picker ────────────────────────────────────
   referenceNpaIds: string[] = [];
   referenceNpaDetails: { id: string; title: string }[] = []; // display info
   npaSearchResults: { id: string; title: string; npa_type: string }[] = [];
   showRefSearch = false;
   refSearchQuery = '';

   // ─── Expose to template ─────────────────────────────────────
   Math = Math;

   // ═══════════════════════════════════════════════════════════
   // Lifecycle
   // ═══════════════════════════════════════════════════════════

   ngOnInit(): void {
      const role = String(this.authService.currentUser?.role || '').toUpperCase();
      // Treat missing token as read-only (prevents a confusing "edit mode" with 401s on persist).
      this.isReadOnly = !(role === 'MAKER' || role === 'CHECKER') || !this.authService.token;

      if (this.inputData?.npaType) {
         this.npaClassification = this.inputData.npaType;
      }
      // Initialize reference NPAs from input context
      const inputRefs = this.inputData?.referenceNpaIds || [];
      if (inputRefs.length > 0) {
         this.referenceNpaIds = [...inputRefs];
         this.loadReferenceNpaDetails();
      }
      this.initializeSections();
      this.initializeFieldMap();
      this.initializeAgentChats();
      this.loadExistingFormData();
      this.startAutoSave();
   }

   ngOnDestroy(): void {
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
      // Flush any unsaved dirty fields to DB before component is destroyed (nav away)
      if (this.isDirty && this.dirtyFieldKeys.size > 0) {
         const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
         if (projectId) {
            this.persistFormDataToDb('autosave');
         }
      }
   }

   // ═══════════════════════════════════════════════════════════
   // Auto-save
   // ═══════════════════════════════════════════════════════════

   private startAutoSave(): void {
      this.autoSaveTimer = setInterval(() => {
         if (this.isDirty) this.autoSaveDraft();
      }, 30_000);
   }

   private autoSaveDraft(): void {
      const npaId = this.inputData?.npaId || this.inputData?.projectId || 'draft';
      const data: Record<string, { value: string; lineage: string }> = {};
      this.fieldMap.forEach((f, key) => {
         if (f.value && f.value.trim()) data[key] = { value: f.value, lineage: f.lineage };
      });
      try {
         sessionStorage.setItem(`_draft_builder_autosave_${npaId}`, JSON.stringify(data));
         this.lastSavedAt = new Date();
      } catch (e) { /* quota exceeded */ }

      // Also persist to DB when we have a real NPA ID (keeps drafts shareable across devices).
      const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      if (projectId) {
         this.persistFormDataToDb('autosave');
      }
   }

   // ═══════════════════════════════════════════════════════════
   // Initialization
   // ═══════════════════════════════════════════════════════════

   private initializeSections(): void {
      const navSections = getNavSections();
      this.stepperSections = navSections.map(ns => {
         const owner = this.getSectionOwner(ns.id);
         const icon = this.getSectionIcon(ns.id);
         const templateNode = this.getTemplateNode(ns.id);
         const allFieldKeys = templateNode ? collectFieldKeys(templateNode) : [];
         return {
            id: ns.id,
            numbering: ns.numbering,
            label: ns.label,
            icon,
            fieldCount: allFieldKeys.length,
            filledCount: 0,
            owner,
            status: 'empty' as const,
            children: templateNode?.children || []
         };
      });
   }

   private initializeFieldMap(): void {
      for (const entry of NPA_FIELD_REGISTRY) {
         const fieldState: FieldState = {
            key: entry.key,
            label: entry.label,
            value: '',
            lineage: 'MANUAL',
            strategy: entry.strategy,
            nodeId: entry.nodeId,
            isStreaming: false,
            isEditing: false,
            type: this.inferFieldType(entry),
            placeholder: entry.placeholder || this.getFieldPlaceholder(entry),
            tooltip: entry.ruleSource || entry.copySection || entry.llmCategory || '',
            required: entry.required ?? (entry.strategy !== 'MANUAL'),
            options: entry.options,
            dependsOn: entry.dependsOn,
            bulletItems: entry.fieldType === 'bullet_list' ? [''] : undefined,
            selectedOptions: (entry.fieldType === 'multiselect' || entry.fieldType === 'checkbox_group') ? [] : undefined,
            yesNoValue: entry.fieldType === 'yesno' ? null : undefined,
            currencyCode: entry.fieldType === 'currency' ? 'SGD' : undefined
         };
         this.fieldMap.set(entry.key, fieldState);
      }
      this.totalFields = this.fieldMap.size;
      this.buildSectionFieldGroups();
   }

   private buildSectionFieldGroups(): void {
      const allSections = [
         ...(NPA_PART_C_TEMPLATE.children || []),
         ...NPA_APPENDICES_TEMPLATE
      ];

      for (const section of allSections) {
         const sectionId = section.id;
         const groups: { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[] = [];

         if (section.children && section.children.length > 0) {
            for (const topic of section.children) {
               const topicFields = this.collectFieldStatesFromNode(topic);
               if (topicFields.length > 0 || (topic.children && topic.children.length > 0)) {
                  const allTopicFields: FieldState[] = [...topicFields];
                  if (topic.children) {
                     for (const child of topic.children) {
                        allTopicFields.push(...this.collectFieldStatesFromNode(child));
                        if (child.children) {
                           for (const subChild of child.children) {
                              allTopicFields.push(...this.collectFieldStatesFromNode(subChild));
                           }
                        }
                     }
                  }
                  if (allTopicFields.length > 0) {
                     groups.push({
                        topic: topic.label,
                        numbering: topic.numbering,
                        guidance: topic.guidance,
                        fields: allTopicFields
                     });
                  }
               }
            }
         } else if (section.fieldKeys && section.fieldKeys.length > 0) {
            const directFields = section.fieldKeys
               .map(k => this.fieldMap.get(k))
               .filter((f): f is FieldState => !!f);
            if (directFields.length > 0) {
               groups.push({
                  topic: section.label,
                  numbering: section.numbering,
                  guidance: section.guidance,
                  fields: directFields
               });
            }
         }

         this.sectionFieldGroups.set(sectionId, groups);
      }
   }

   private collectFieldStatesFromNode(node: TemplateNode): FieldState[] {
      const fields: FieldState[] = [];
      if (node.fieldKeys) {
         for (const key of node.fieldKeys) {
            const fs = this.fieldMap.get(key);
            if (fs) fields.push(fs);
         }
      }
      if (node.tableFieldMapping) {
         for (const mapping of node.tableFieldMapping) {
            const fs = this.fieldMap.get(mapping.fieldKey);
            if (fs) fields.push(fs);
         }
      }
      return fields;
   }

   private initializeAgentChats(): void {
      for (const group of SIGN_OFF_GROUPS) {
         this.agentChats.set(group.id, {
            id: group.id,
            messages: [{
               role: 'system',
               content: `${group.label} agent ready. I can help auto-fill and review fields in sections: ${group.sections.join(', ')}.`,
               timestamp: new Date()
            }],
            isConnected: false,
            isStreaming: false,
            streamText: ''
         });
      }
   }

   private loadExistingFormData(): void {
      if (!this.inputData?.npaId && !this.inputData?.projectId) return;
      const id = this.inputData.npaId || this.inputData.projectId;

      this.http.get<any[]>(`/api/npas/${id}/form-data`).subscribe({
         next: (formData) => {
            if (formData?.length) {
               this.applyFormDataToFieldMap(formData);
            } else {
               // Try sessionStorage fallback before triggering prefill
               const restored = this.restoreFromSessionStorage(id);
               if (!restored) {
                  // No persisted form data yet — this is a freshly created NPA.
                  // Trigger deterministic pre-fill (RULE + COPY) from reference NPA.
                  this.triggerPrefill(id);
               }
            }
         },
         error: (err) => {
            console.warn('[DraftBuilder] Could not load form data:', err.message);
            // On API failure, try sessionStorage as fallback
            this.restoreFromSessionStorage(id);
         }
      });
   }

   /**
    * Restore field data from sessionStorage autosave as fallback.
    * Returns true if any fields were restored.
    */
   private restoreFromSessionStorage(npaId: string): boolean {
      try {
         const saved = sessionStorage.getItem(`_draft_builder_autosave_${npaId}`);
         if (!saved) return false;
         const data: Record<string, { value: string; lineage: string }> = JSON.parse(saved);
         const keys = Object.keys(data);
         if (keys.length === 0) return false;

         const formData = keys.map(key => ({
            field_key: key,
            field_value: data[key].value,
            lineage: data[key].lineage || 'MANUAL'
         }));
         this.applyFormDataToFieldMap(formData);
         return true;
      } catch {
         return false;
      }
   }

   /**
    * Apply an array of form-data rows (from DB or prefill) to the fieldMap.
    * Updates progress and required stats after applying.
    */
   private applyFormDataToFieldMap(formData: any[]): void {
      let applied = 0;
      for (const fd of formData) {
         const fieldKey = fd.field_key;
         const value = fd.field_value ?? fd.value ?? '';
         const field = this.fieldMap.get(fieldKey);
         if (field && value) {
            field.value = value;
            field.lineage = (fd.lineage || 'AUTO') as FieldLineage;
            const rawConf = fd.confidence_score ?? fd.confidence ?? null;
            const confNum = rawConf === null || rawConf === undefined || rawConf === '' ? null : Number(rawConf);
            field.confidence = Number.isFinite(confNum as any) ? (confNum as any) : null;
            field.source = fd.metadata?.sourceSnippet || fd.source || null;

            // ── Rehydrate derived UI state from persisted field.value ──
            this.rehydrateFieldUiState(field);

            applied++;
         }
      }
      this.updateProgress();
      this.recomputeRequiredStats();
      this.cdr.detectChanges();
      return;
   }

   /**
    * Reconstruct UI-specific derived properties from the stored field.value.
    * Without this, bullet_list / yesno / checkbox_group / multiselect / table_grid
    * fields will appear blank on reload even though field.value has data in DB.
    */
   private rehydrateFieldUiState(field: any): void {
      if (!field || !field.value) return;
      const type = (field.type || '').toLowerCase();

      switch (type) {
         case 'bullet_list': {
            // field.value is a JSON array or newline-separated string
            try {
               const parsed = JSON.parse(field.value);
               field.bulletItems = Array.isArray(parsed) ? parsed : [field.value];
            } catch {
               field.bulletItems = field.value.split('\n').filter((s: string) => s.trim());
            }
            break;
         }
         case 'yesno':
         case 'yes_no': {
            const lower = field.value.toLowerCase().trim();
            field.yesNoValue = lower === 'yes' || lower === 'true' ? 'yes' : (lower === 'no' || lower === 'false' ? 'no' : null);
            // conditionalText is the explanation part after the yes/no choice
            if (field.value.includes('|')) {
               const parts = field.value.split('|');
               field.yesNoValue = parts[0].trim().toLowerCase() === 'yes' ? 'yes' : 'no';
               field.conditionalText = parts.slice(1).join('|').trim();
            }
            break;
         }
         case 'checkbox_group':
         case 'multiselect': {
            // field.value is a comma-separated list or JSON array
            try {
               const parsed = JSON.parse(field.value);
               field.selectedOptions = Array.isArray(parsed) ? parsed : [field.value];
            } catch {
               field.selectedOptions = field.value.split(',').map((s: string) => s.trim()).filter((s: string) => s);
            }
            break;
         }
         case 'table_grid': {
            // field.value is a JSON 2D array or JSON object
            try {
               field.tableData = JSON.parse(field.value);
            } catch {
               field.tableData = null;
            }
            break;
         }
         case 'dropdown':
         case 'select': {
            // Ensure the value matches an option exactly
            // (no derived state needed, value is already set)
            break;
         }
      }
   }

   /**
    * Deterministic pre-fill: calls GET /api/npas/:id/prefill to get RULE + COPY
    * field values, persists them to DB, and applies them to the fieldMap.
    * LLM and MANUAL fields remain empty for user/agent input.
    */
   private triggerPrefill(npaId: string): void {
      this.http.get<any>(`/api/npas/${npaId}/prefill`).subscribe({
         next: (prefillResult) => {
            const filledFields = prefillResult?.filled_fields;
            if (!filledFields?.length) {
               return;
            }

            // Apply to fieldMap immediately (don't wait for persist round-trip)
            this.applyFormDataToFieldMap(filledFields);

            // Persist to DB in background so future loads pick it up
            this.http.post(`/api/npas/${npaId}/prefill/persist`, {
               filled_fields: filledFields
            }).subscribe({
               error: (err) => console.warn('[DraftBuilder] Prefill persist failed (fields still applied to UI):', err.message)
            });
         },
         error: (err) => console.warn('[DraftBuilder] Prefill failed:', err.message)
      });
   }

   // ═══════════════════════════════════════════════════════════
   // Reference NPA Picker
   // ═══════════════════════════════════════════════════════════

   /** Load display details for reference NPA IDs */
   private loadReferenceNpaDetails(): void {
      this.referenceNpaDetails = this.referenceNpaIds.map(id => ({ id, title: 'Loading...' }));
      for (const refId of this.referenceNpaIds) {
         this.http.get<any>(`/api/npas/${refId}`).subscribe({
            next: (npa) => {
               const idx = this.referenceNpaDetails.findIndex(r => r.id === refId);
               if (idx >= 0) {
                  this.referenceNpaDetails[idx] = { id: refId, title: npa.title || refId };
                  this.cdr.detectChanges();
               }
            },
            error: () => { } // keep the ID as display
         });
      }
   }

   /** Search NPAs for the reference picker */
   searchNpas(query: string): void {
      this.refSearchQuery = query;
      if (!query || query.length < 2) {
         this.npaSearchResults = [];
         return;
      }
      this.http.get<any[]>('/api/npas').subscribe({
         next: (npas) => {
            const q = query.toLowerCase();
            this.npaSearchResults = npas
               .filter(n => !this.referenceNpaIds.includes(n.id))  // exclude already selected
               .filter(n => n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
               .slice(0, 5)
               .map(n => ({ id: n.id, title: n.title, npa_type: n.npa_type }));
            this.cdr.detectChanges();
         }
      });
   }

   /** Add a reference NPA */
   addReferenceNpa(npa: { id: string; title: string }): void {
      if (this.referenceNpaIds.includes(npa.id)) return;
      this.referenceNpaIds.push(npa.id);
      this.referenceNpaDetails.push({ id: npa.id, title: npa.title });
      this.npaSearchResults = [];
      this.refSearchQuery = '';
      this.showRefSearch = false;
      this.persistReferenceNpaIds();
      this.retriggerPrefillWithRefs();
   }

   /** Remove a reference NPA */
   removeReferenceNpa(refId: string): void {
      this.referenceNpaIds = this.referenceNpaIds.filter(id => id !== refId);
      this.referenceNpaDetails = this.referenceNpaDetails.filter(r => r.id !== refId);
      this.persistReferenceNpaIds();
      // Don't re-trigger prefill on removal — fields already filled stay
   }

   /** Persist reference NPA IDs to the DB */
   private persistReferenceNpaIds(): void {
      const projectId = this.inputData?.npaId || this.inputData?.projectId || '';
      if (!projectId) return;
      this.http.put(`/api/npas/${projectId}`, { reference_npa_ids: this.referenceNpaIds }).subscribe({
         error: (err) => console.warn('[DraftBuilder] Failed to save reference NPAs:', err.message)
      });
   }

   /** Re-trigger prefill with updated reference NPA list */
   private retriggerPrefillWithRefs(): void {
      const npaId = this.inputData?.npaId || this.inputData?.projectId || '';
      if (!npaId || this.referenceNpaIds.length === 0) return;
      const qs = `?similar_npa_ids=${encodeURIComponent(this.referenceNpaIds.join(','))}`;
      this.http.get<any>(`/api/npas/${npaId}/prefill${qs}`).subscribe({
         next: (prefillResult) => {
            const filledFields = prefillResult?.filled_fields?.filter((f: any) => f.strategy === 'COPY');
            if (!filledFields?.length) return;
            this.applyFormDataToFieldMap(filledFields);
            // Persist updated fields
            this.http.post(`/api/npas/${npaId}/prefill/persist`, { filled_fields: filledFields }).subscribe({
               error: () => { }
            });
         }
      });
   }

   // ═══════════════════════════════════════════════════════════
   // Child Component Event Handlers
   // ═══════════════════════════════════════════════════════════

   /** Fired by NpaFieldRendererComponent when a field value changes */
   onFieldEdited(field: FieldState): void {
      this.isDirty = true;
      this.focusedFieldKey = field.key;
      this.dirtyFieldKeys.add(field.key);
      // Clear validation error when user provides a value
      if (field.value && field.value.trim() !== '') {
         field.validationError = undefined;
      }
      this.scheduleStatsRecompute();
   }

   /** Fired by NpaFieldRendererComponent when a field is cleared */
   onFieldCleared(field: FieldState): void {
      this.isDirty = true;
      this.dirtyFieldKeys.add(field.key);
      this.scheduleStatsRecompute();
   }

   /** Fired by NpaFieldRendererComponent — delegates to the agent chat */
   askAgentAboutField(field: FieldState): void {
      this.focusedFieldKey = field.key;
      const sectionId = field.nodeId?.split('.').slice(0, 2).join('.') || '';
      const owner = this.getSectionOwner(sectionId);
      this.activeAgentId = owner;
      this.agentPanelTab = 'CHAT';

      // Ensure the chat component is rendered (it's behind an *ngIf) and receives the new activeAgentId.
      this.cdr.detectChanges();
      setTimeout(() => this.agentChatComponent?.askAboutField(field), 0);
   }


   /** Apply a field suggestion from agent chat (@@NPA_META@@ parsed) */
   onApplyFieldSuggestion(suggestion: FieldSuggestion): void {
      const field = this.fieldMap.get(suggestion.fieldKey);
      if (field) {
         this.focusedFieldKey = field.key;
         const format = (suggestion as any)?.format || 'text';
         if (format === 'bullets' && field.type === 'bullet_list') {
            const items = this.parseBulletItems(suggestion.value);
            field.bulletItems = items.length ? items : [''];
            const joined = (field.bulletItems || []).filter(b => String(b || '').trim()).join('\n\u2022 ');
            field.value = joined ? `\u2022 ${joined}` : '';
         } else {
            field.value = suggestion.value;
            // Best-effort: keep bullet_list editor in sync if we received a bulleted response.
            if (field.type === 'bullet_list') {
               const items = this.parseBulletItems(suggestion.value);
               if (items.length) {
                  field.bulletItems = items;
                  const joined = items.filter(b => String(b || '').trim()).join('\n\u2022 ');
                  field.value = joined ? `\u2022 ${joined}` : field.value;
               }
            }
         }
         field.lineage = 'ADAPTED';
         field.confidence = suggestion.confidence;
         field.validationError = undefined;
         this.isDirty = true;
         this.dirtyFieldKeys.add(field.key);
         this.scheduleStatsRecompute();
         // Persist immediately so "anything over draft" is DB-backed (comments + field edits).
         this.persistFormDataToDb('autosave');
      } else {
         console.warn(`[DraftBuilder] Unknown field key in suggestion: ${suggestion.fieldKey}`);
      }
   }

   private scheduleStatsRecompute(): void {
      if (this.statsRecomputeScheduled) return;
      this.statsRecomputeScheduled = true;
      setTimeout(() => {
         this.statsRecomputeScheduled = false;
         this.updateProgress();
         this.recomputeRequiredStats();
         this.cdr.detectChanges();
      }, 100);
   }

   private parseBulletItems(text: string): string[] {
      const raw = String(text || '').trim();
      if (!raw) return [];
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const items: string[] = [];
      for (const line of lines) {
         // Remove common bullet/number prefixes: "• ", "- ", "* ", "1. ", "1) "
         const cleaned = line
            .replace(/^([•*-]|\d+[\.\)])\s+/, '')
            .replace(/^\u2022\s+/, '')
            .trim();
         if (!cleaned) continue;
         items.push(cleaned);
         if (items.length >= 60) break;
      }
      // If it's a single paragraph, allow splitting by semicolon as a last resort.
      if (items.length <= 1 && raw.length > 120 && raw.includes(';')) {
         const semi = raw.split(';').map(s => s.trim()).filter(Boolean);
         if (semi.length > 1) return semi.slice(0, 60);
      }
      return items;
   }

   /** Fired by NpaFieldRendererComponent when a user clicks a KB Citation */
   onCitationClick(citation: Citation): void {
      this.selectedCitation = citation;
      this.agentPanelTab = 'KNOWLEDGE'; // Switch right panel tab to Knowledge
   }

   // ═══════════════════════════════════════════════════════════
   // Navigation
   // ═══════════════════════════════════════════════════════════

   selectSection(sectionId: string): void {
      this.activeSectionId = sectionId;
      if (!this.expandedSections.has(sectionId)) {
         this.expandedSections.add(sectionId);
      }
      // Auto-switch agent tab to match the new section's owner
      const owner = this.getSectionOwner(sectionId);
      if (owner !== this.activeAgentId) {
         this.activeAgentId = owner;
      }
   }

   selectAgent(agentId: SignOffGroupId): void {
      this.activeAgentId = agentId;
   }

   navigateNext(): void {
      const idx = this.stepperSections.findIndex(s => s.id === this.activeSectionId);
      if (idx < this.stepperSections.length - 1) {
         this.selectSection(this.stepperSections[idx + 1].id);
      }
   }

   navigatePrev(): void {
      const idx = this.stepperSections.findIndex(s => s.id === this.activeSectionId);
      if (idx > 0) {
         this.selectSection(this.stepperSections[idx - 1].id);
      }
   }

   // ────────────────────────────────────────────────────────────
   // Comments Drawer (DB-backed)
   // ────────────────────────────────────────────────────────────

   private nowLabel(): string {
      return new Date().toLocaleString();
   }

   private ensureThread(key: string, title: string, ref: string): CommentThread {
      const existing = this.threads.get(key);
      if (existing) return existing;
      const created: CommentThread = { key, title, ref, comments: [] };
      this.threads.set(key, created);
      return created;
   }

   draftCommentCount(): number {
      return this.draftCommentsCountValue;
   }

   openCommentsForDraft(): void {
      const npaId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      const title = 'Draft Comments';
      const ref = npaId ? `Draft: ${npaId}` : 'Draft';
      const key = `draft:${String(npaId || 'unknown')}`;
      this.activeCommentScope = 'DRAFT';
      this.activeCommentFieldKey = null;
      this.activeThread = this.ensureThread(key, title, ref);
      this.commentsDrawerTitle = title;
      this.commentsDrawerRef = ref;
      this.commentDraft = '';
      this.replyToCommentId = null;
      this.replyDraft = '';
      this.commentsDrawerOpen = true;
      this.loadCommentsFromDb('DRAFT', null, key, title, ref);
   }

   openCommentsForField(field: FieldState): void {
      const refKey = field.key || field.nodeId || field.label || 'field';
      const title = `${field.label || 'Field'} — Comments`;
      const ref = `Field: ${field.label || ''} · ${refKey}`;
      const key = `field:${String(refKey)}`;
      this.activeCommentScope = 'FIELD';
      this.activeCommentFieldKey = field.key || null;
      this.activeThread = this.ensureThread(key, title, ref);
      this.commentsDrawerTitle = title;
      this.commentsDrawerRef = ref;
      this.commentDraft = '';
      this.replyToCommentId = null;
      this.replyDraft = '';
      this.commentsDrawerOpen = true;
      this.loadCommentsFromDb('FIELD', this.activeCommentFieldKey, key, title, ref);
   }

   closeCommentsDrawer(): void {
      this.commentsDrawerOpen = false;
      this.commentDraft = '';
      this.replyToCommentId = null;
      this.replyDraft = '';
      this.activeThread = null;
      this.commentsLoading = false;
      this.commentsError = '';
   }

   postComment(): void {
      if (!this.activeThread) return;
      const text = String(this.commentDraft || '').trim();
      if (!text) return;
      const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      if (!projectId) {
         // Fallback: no DB context
         const author = this.authService.currentUser?.display_name || this.authService.currentUser?.full_name || 'User';
         this.activeThread.comments.push({
            id: Date.now(),
            author,
            when: this.nowLabel(),
            text,
            replies: []
         });
         this.commentDraft = '';
         return;
      }

      this.commentsError = '';
      this.commentsLoading = true;
      this.http.post(`/api/npas/${encodeURIComponent(projectId)}/comments`, {
         scope: this.activeCommentScope,
         field_key: this.activeCommentScope === 'FIELD' ? this.activeCommentFieldKey : null,
         text
      }).subscribe({
         next: () => {
            this.commentDraft = '';
            const threadKey = this.activeThread?.key || `draft:${projectId}`;
            this.loadCommentsFromDb(this.activeCommentScope, this.activeCommentFieldKey, threadKey, this.commentsDrawerTitle, this.commentsDrawerRef);
         },
         error: (err) => {
            this.commentsLoading = false;
            this.commentsError = err?.error?.error || err?.message || 'Failed to post comment';
         }
      });
   }

   startReply(commentId: number): void {
      this.replyToCommentId = commentId;
      this.replyDraft = '';
   }

   cancelReply(): void {
      this.replyToCommentId = null;
      this.replyDraft = '';
   }

   postReply(): void {
      if (!this.activeThread || !this.replyToCommentId) return;
      const text = String(this.replyDraft || '').trim();
      if (!text) return;
      const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      if (!projectId) {
         // Fallback: no DB context
         const target = this.activeThread.comments.find(c => c.id === this.replyToCommentId);
         if (!target) return;
         const author = this.authService.currentUser?.display_name || this.authService.currentUser?.full_name || 'User';
         target.replies.push({
            id: Date.now(),
            author,
            when: this.nowLabel(),
            text
         });
         this.replyToCommentId = null;
         this.replyDraft = '';
         return;
      }

      this.commentsError = '';
      this.commentsLoading = true;
      this.http.post(`/api/npas/${encodeURIComponent(projectId)}/comments`, {
         scope: this.activeCommentScope,
         field_key: this.activeCommentScope === 'FIELD' ? this.activeCommentFieldKey : null,
         text,
         parent_id: this.replyToCommentId
      }).subscribe({
         next: () => {
            this.replyToCommentId = null;
            this.replyDraft = '';
            const threadKey = this.activeThread?.key || `draft:${projectId}`;
            this.loadCommentsFromDb(this.activeCommentScope, this.activeCommentFieldKey, threadKey, this.commentsDrawerTitle, this.commentsDrawerRef);
         },
         error: (err) => {
            this.commentsLoading = false;
            this.commentsError = err?.error?.error || err?.message || 'Failed to post reply';
         }
      });
   }

   trackByCommentId(_i: number, c: CommentItem): string {
      return String(c.id);
   }

   trackByReplyId(_i: number, r: CommentReply): string {
      return String(r.id);
   }

   private loadCommentsFromDb(
      scope: CommentScope,
      fieldKey: string | null,
      threadKey: string,
      title: string,
      ref: string
   ): void {
      const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      if (!projectId) return;

      this.commentsLoading = true;
      this.commentsError = '';

      const params: any = { scope };
      if (fieldKey) params.field_key = fieldKey;

      this.http.get<DbCommentRow[]>(`/api/npas/${encodeURIComponent(projectId)}/comments`, { params }).subscribe({
         next: (rows) => {
            const thread = this.buildThreadFromRows(rows || [], threadKey, title, ref);
            this.threads.set(threadKey, thread);
            this.activeThread = thread;
            if (scope === 'DRAFT') {
               this.draftCommentsCountValue = thread.comments.length;
            }
            this.commentsLoading = false;
            this.cdr.detectChanges();
         },
         error: (err) => {
            this.commentsLoading = false;
            this.commentsError = err?.error?.error || err?.message || 'Failed to load comments';
         }
      });
   }

   private buildThreadFromRows(rows: DbCommentRow[], key: string, title: string, ref: string): CommentThread {
      const thread: CommentThread = { key, title, ref, comments: [] };
      const topLevel = new Map<number, CommentItem>();

      for (const r of rows) {
         const parentId = (r.parent_comment_id === undefined ? null : r.parent_comment_id) as number | null;
         if (parentId === null) {
            const item: CommentItem = {
               id: Number(r.id),
               author: r.author_name || 'User',
               when: r.created_at ? new Date(r.created_at).toLocaleString() : this.nowLabel(),
               text: r.comment_text || '',
               replies: []
            };
            topLevel.set(item.id, item);
            thread.comments.push(item);
         }
      }

      for (const r of rows) {
         const parentId = (r.parent_comment_id === undefined ? null : r.parent_comment_id) as number | null;
         if (parentId === null) continue;
         const parent = topLevel.get(Number(parentId));
         if (!parent) continue;
         parent.replies.push({
            id: Number(r.id),
            author: r.author_name || 'User',
            when: r.created_at ? new Date(r.created_at).toLocaleString() : this.nowLabel(),
            text: r.comment_text || ''
         });
      }

      return thread;
   }

   // ═══════════════════════════════════════════════════════════
   // Progress
   // ═══════════════════════════════════════════════════════════

   private updateProgress(): void {
      let filled = 0;
      let total = 0;
      this.fieldMap.forEach(f => {
         const sectionId = f.nodeId?.split('.').slice(0, 2).join('.') || '';
         if (!this.isSectionApplicable(sectionId)) return;
         total++;
         if (f.value && f.value.trim() !== '') filled++;
      });
      this.totalFields = total;
      this.filledFields = filled;
      this.overallProgress = total > 0 ? Math.round((filled / total) * 100) : 0;

      for (const section of this.stepperSections) {
         const groups = this.sectionFieldGroups.get(section.id) || [];
         const allFields = groups.flatMap(g => g.fields);
         section.fieldCount = allFields.length;
         section.filledCount = allFields.filter(f => f.value && f.value.trim() !== '').length;
         section.status = !this.isSectionApplicable(section.id) ? 'complete'
            : section.filledCount === 0 ? 'empty'
               : section.filledCount >= section.fieldCount ? 'complete'
                  : 'partial';
      }
   }

   private updateSectionProgress(fieldKey: string): void {
      const entry = FIELD_REGISTRY_MAP.get(fieldKey);
      if (!entry?.nodeId) return;
      const sectionId = entry.nodeId.split('.').slice(0, 2).join('.');
      const section = this.stepperSections.find(s => s.id === sectionId);
      if (section) {
         const groups = this.sectionFieldGroups.get(section.id) || [];
         const allFields = groups.flatMap(g => g.fields);
         section.filledCount = allFields.filter(f => f.value && f.value.trim() !== '').length;
         section.status = section.filledCount === 0 ? 'empty'
            : section.filledCount >= section.fieldCount ? 'complete'
               : 'partial';
      }
      this.updateProgress();
   }

   // ═══════════════════════════════════════════════════════════
   // Helpers (used by template & child components)
   // ═══════════════════════════════════════════════════════════

   getActiveSection(): StepperSection | undefined {
      return this.stepperSections.find(s => s.id === this.activeSectionId);
   }

   getActiveSectionGroups(): { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[] {
      return this.sectionFieldGroups.get(this.activeSectionId) || [];
   }

   getGroupForSection(sectionId: string): SignOffGroup {
      const owner = this.getSectionOwner(sectionId);
      return SIGN_OFF_GROUPS.find(g => g.id === owner) || SIGN_OFF_GROUPS[0];
   }

   getSectionOwner(sectionId: string): SignOffGroupId {
      for (const group of SIGN_OFF_GROUPS) {
         if (group.sections.includes(sectionId)) return group.id;
      }
      if (sectionId.startsWith('APP')) return 'LCS';
      return 'BIZ';
   }

   shouldShowField(field: FieldState): boolean {
      if (!field.dependsOn) return true;
      const parentField = this.fieldMap.get(field.dependsOn.field);
      if (!parentField) return true;
      return parentField.value === field.dependsOn.value;
   }

   isSectionApplicable(sectionId: string): boolean {
      if (this.npaClassification !== 'NPA Lite') return true;
      return !this.npaLiteExcludedSections.has(sectionId);
   }

   setClassification(classification: 'New-to-Group' | 'Variation' | 'Existing' | 'NPA Lite'): void {
      this.npaClassification = classification;
      this.updateProgress();
   }

   // ═══════════════════════════════════════════════════════════
   // Validation
   // ═══════════════════════════════════════════════════════════

   validateDraft(): boolean {
      this.validationErrors = [];
      // Clear previous validation errors from all fields
      this.fieldMap.forEach(field => { field.validationError = undefined; });

      this.fieldMap.forEach((field, key) => {
         if (!field.required) return;
         if (!this.isSectionApplicable(field.nodeId?.split('.').slice(0, 2).join('.') || '')) return;
         if (!field.value || field.value.trim() === '') {
            const sectionId = field.nodeId?.split('.').slice(0, 2).join('.') || 'Unknown';
            field.validationError = 'This field is required';
            this.validationErrors.push({ field: key, label: field.label, section: sectionId });
         }
      });
      this.showValidation = this.validationErrors.length > 0;
      this.recomputeRequiredStats();
      return this.validationErrors.length === 0;
   }

   goToValidationError(error: { field: string; section: string }): void {
      this.selectSection(error.section);
      this.showValidation = false;
   }

   dismissValidation(): void {
      this.showValidation = false;
   }

   openIssuesPanel(): void {
      this.agentPanelTab = 'ISSUES';
      this.recomputeRequiredStats();
      if (this.rightPanelCollapsed) this.rightPanelCollapsed = false;
   }

   goToNextMissingRequired(): void {
      const first = this.validationErrors?.[0];
      if (!first) return;
      this.jumpToField(first.field, first.section);
   }

   jumpToField(fieldKey: string, sectionId?: string): void {
      if (sectionId) this.selectSection(sectionId);
      this.focusedFieldKey = fieldKey;
      // Let the DOM render the section content before scrolling.
      setTimeout(() => {
         const el = document.getElementById(`field_${fieldKey}`);
         if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
   }

   private recomputeRequiredStats(): void {
      const bySection: Record<string, number> = {};
      let missing = 0;
      let total = 0;
      let filled = 0;

      this.fieldMap.forEach((f) => {
         if (!f.required) return;
         const sectionId = f.nodeId?.split('.').slice(0, 2).join('.') || '';
         if (!this.isSectionApplicable(sectionId)) return;

         total++;
         const hasValue = !!(f.value && String(f.value).trim());
         if (hasValue) filled++;
         if (!hasValue) {
            missing++;
            bySection[sectionId] = (bySection[sectionId] || 0) + 1;
         }
      });

      // If validationErrors is populated, prefer it for section mapping (more exact).
      if (this.validationErrors?.length) {
         const by: Record<string, number> = {};
         for (const e of this.validationErrors) {
            by[e.section] = (by[e.section] || 0) + 1;
         }
         this.requiredMissingBySection = by;
      } else {
         this.requiredMissingBySection = bySection;
      }

      this.requiredTotal = total;
      this.requiredFilled = filled;
      this.requiredMissing = missing;
   }

   requiredProgressPercent(): number {
      if (!this.requiredTotal) return 0;
      return Math.round((this.requiredFilled / this.requiredTotal) * 100);
   }

   // ═══════════════════════════════════════════════════════════
   // Save
   // ═══════════════════════════════════════════════════════════

   saveDraft(skipValidation = false): void {
      if (!skipValidation) this.validateDraft();

      if (this.isReadOnly) return;

      this.persistFormDataToDb('manual', () => {
         const fields: any[] = [];
         this.fieldMap.forEach((field, key) => {
            if (!this.isSectionApplicable(field.nodeId?.split('.').slice(0, 2).join('.') || '')) return;
            fields.push({
               field_key: key,
               field_value: field.value || '',
               lineage: field.lineage,
               confidence_score: field.confidence ?? null,
               metadata: {
                  sourceSnippet: field.source,
                  strategy: field.strategy,
                  fieldType: field.type
               }
            });
         });
         this.onSave.emit({
            fields,
            classification: this.npaClassification,
            validationErrors: this.validationErrors.length,
            progress: this.overallProgress
         });
      });
   }

   private persistFormDataToDb(mode: 'manual' | 'autosave', afterPersist?: () => void): void {
      const projectId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      if (!projectId) return;

      // If not authenticated, don't spam requests; surface a clear error to the user.
      if (!this.authService.token) {
         this.draftSaveError = 'Not authenticated. Please re-login to save changes.';
         this.isDirty = true;
         return;
      }

      // Persist only fields that changed (prevents wiping seeded/prefilled values).
      const filled_fields: any[] = [];
      const keysToPersist = Array.from(this.dirtyFieldKeys);
      for (const key of keysToPersist) {
         const field = this.fieldMap.get(key);
         if (!field) continue;
         if (!this.isSectionApplicable(field.nodeId?.split('.').slice(0, 2).join('.') || '')) continue;

         const rawConf: any = (field as any).confidence;
         const confNum = rawConf === null || rawConf === undefined || rawConf === '' ? null : Number(rawConf);
         filled_fields.push({
            field_key: key,
            value: field.value ?? '',
            lineage: field.lineage || 'MANUAL',
            confidence: Number.isFinite(confNum as any) ? (confNum as any) : null,
            source: field.source || null,
            strategy: field.strategy || 'MANUAL'
         });
      }

      if (filled_fields.length === 0) return;
      if (this.isSavingDraft) return;

      this.isSavingDraft = true;
      this.draftSaveError = null;
      const sentKeys = new Set(filled_fields.map(f => String(f.field_key)));
      this.http.post(`/api/npas/${encodeURIComponent(projectId)}/form-data`, { filled_fields }).subscribe({
         next: () => {
            this.lastSavedAt = new Date();
            for (const k of sentKeys) this.dirtyFieldKeys.delete(k);
            this.isDirty = this.dirtyFieldKeys.size > 0;
            this.isSavingDraft = false;
            this.draftSaveError = null;
            afterPersist?.();
            this.cdr.detectChanges();
         },
         error: (err) => {
            this.isSavingDraft = false;
            const status = Number(err?.status || 0);
            if (status === 401) {
               this.draftSaveError = 'Session expired. Please log in again to save.';
            } else {
               const base = err?.error?.error || err?.message || 'Failed to save draft to DB';
               const details = Array.isArray(err?.error?.details) ? err.error.details : null;
               if (details?.length) {
                  const first = details[0];
                  this.draftSaveError = `${base}: ${String(first.path || 'field')} — ${String(first.message || '')}`;
               } else {
                  this.draftSaveError = base;
               }
            }
            this.isDirty = true;
            console.warn('[DraftBuilder] Failed to persist form data:', this.draftSaveError, err?.error?.details || '');
            this.cdr.detectChanges();
         }
      });
   }

   // ═══════════════════════════════════════════════════════════
   // Private Helpers
   // ═══════════════════════════════════════════════════════════

   private getSectionIcon(sectionId: string): string {
      const iconMap: Record<string, string> = {
         'PC.I': 'package', 'PC.II': 'settings', 'PC.III': 'calculator',
         'PC.IV': 'shield-alert', 'PC.V': 'database', 'PC.VI': 'alert-triangle',
         'PC.VII': 'bar-chart-2', 'APP.1': 'building', 'APP.2': 'key',
         'APP.3': 'shield', 'APP.4': 'pie-chart', 'APP.5': 'trending-up', 'APP.6': 'globe'
      };
      return iconMap[sectionId] || 'file-text';
   }

   private getTemplateNode(sectionId: string): TemplateNode | undefined {
      if (sectionId.startsWith('PC.')) {
         return NPA_PART_C_TEMPLATE.children?.find(c => c.id === sectionId);
      }
      return NPA_APPENDICES_TEMPLATE.find(a => a.id === sectionId);
   }

   private inferFieldType(entry: FieldRegistryEntry): NpaFieldType {
      if (entry.fieldType) return entry.fieldType;
      if (entry.key.includes('date') || entry.key.includes('_at')) return 'date';
      if (entry.key.includes('amount') || entry.key.includes('revenue') || entry.key.includes('roi')) return 'currency';
      if (entry.strategy === 'LLM') return 'textarea';
      if (entry.key.startsWith('mrf_')) return 'dropdown';
      return 'text';
   }

   private getFieldPlaceholder(entry: FieldRegistryEntry): string {
      if (entry.strategy === 'RULE') return 'Auto-populated from system';
      if (entry.strategy === 'COPY') return 'Copied from similar NPA';
      if (entry.strategy === 'LLM') return 'AI-generated content';
      return 'Enter value manually';
   }

   // ─── TrackBy Functions ────────────────────────────────────

   trackByFieldKey(_index: number, field: FieldState): string {
      return field.key;
   }

   trackByGroupTopic(_index: number, group: { topic: string }): string {
      return group.topic;
   }

   trackBySectionId(_index: number, section: StepperSection): string {
      return section.id;
   }
}
