import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LucideAngularModule, UploadCloud, Edit2, AlertCircle, Paperclip } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { NpaSection, NpaField, FieldLineage } from '../../../lib/npa-interfaces';
import { NpaService, NpaListItem } from '../../../services/npa.service';
import { AgentGovernanceService, ReadinessResult } from '../../../services/agent-governance.service';
import { NPA_PART_C_TEMPLATE, NPA_APPENDICES_TEMPLATE, TemplateNode, collectFieldKeys, getNavSections, FIELD_REGISTRY_MAP } from '../../../lib/npa-template-definition';
import { WorkflowStreamEvent } from '../../../lib/agent-interfaces';

@Component({
   selector: 'app-npa-template-editor',
   standalone: true,
   imports: [CommonModule, LucideAngularModule, FormsModule],
   templateUrl: './npa-template-editor.component.html',
   styleUrls: ['./npa-template-editor.component.css']
})
export class NpaTemplateEditorComponent implements OnInit, OnDestroy {
   @Output() close = new EventEmitter<void>();
   @Input() inputData: any = null;
   @Output() onSave = new EventEmitter<any>();
   @Input() initialViewMode: 'live' | 'document' | 'form' = 'document';

   private http = inject(HttpClient);
   private governanceService = inject(AgentGovernanceService);
   private npaService = inject(NpaService);

   activeSection = '';
   focusedField: NpaField | null = null;
   editingField: string | null = null;
   viewMode: 'live' | 'document' | 'form' = 'document';
   showValidationModal = false;
   validationResult: ReadinessResult | null = null;
   isRunningGovernance = false;
   isDraftingField = false;
   isLoadingSimilar = false;
   similarNpas: NpaListItem[] = [];


   // NPA document sections for grouping live fields into the official template structure
   readonly npaSections: { id: string; numbering: string; label: string; icon: string }[] = [
      { id: 'PC.I', numbering: 'I', label: 'Product Specifications (Basic Information)', icon: 'package' },
      { id: 'PC.II', numbering: 'II', label: 'Operational & Technology Information', icon: 'settings' },
      { id: 'PC.III', numbering: 'III', label: 'Pricing Model Details', icon: 'calculator' },
      { id: 'PC.IV', numbering: 'IV', label: 'Risk Analysis', icon: 'shield-alert' },
      { id: 'PC.V', numbering: 'V', label: 'Data Management', icon: 'database' },
      { id: 'PC.VI', numbering: 'VI', label: 'Other Risk Identification', icon: 'alert-triangle' },
      { id: 'APP', numbering: 'App', label: 'Appendices', icon: 'file-text' },
   ];

   // Reverse lookup: field_key → section prefix (e.g., 'product_name' → 'PC.I')
   private fieldToSectionMap = new Map<string, string>();


   sections: NpaSection[] = [];

   // Template tree references
   templateTree = NPA_PART_C_TEMPLATE;
   appendicesTree = NPA_APPENDICES_TEMPLATE;
   templateNavSections = getNavSections();

   // O(1) field lookup by key — built after sections load
   private fieldMap = new Map<string, NpaField>();

   // Cache for node completion calculations
   private completionCache = new Map<string, number>();
   // All template nodes indexed by id (for completion lookups)
   private nodeIndex = new Map<string, TemplateNode>();

   trackByNavId(_index: number, item: { id: string }): string {
      return item.id;
   }

   trackByNodeId(_index: number, node: { id: string }): string {
      return node.id;
   }

   trackByFieldKey(_index: number, key: string): string {
      return key;
   }

   ngOnInit() {
      // Build field-to-section map early (uses static FIELD_REGISTRY_MAP, no DB dependency)
      this.buildFieldToSectionMap();

      const projectId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
      if (projectId) {
         this.npaService.getFormSections(projectId).subscribe({
            next: (apiSections) => {
               this.sections = apiSections.map((s: any) => ({
                  id: s.section_id || s.id,
                  title: s.title,
                  description: s.description,
                  fields: (s.fields || []).map((f: any) => ({
                     key: f.field_key || f.key,
                     label: f.label,
                     value: f.value || f.field_value || '',
                     lineage: f.lineage || 'MANUAL',
                     type: f.field_type || f.type || 'text',
                     required: f.is_required || f.required,
                     tooltip: f.tooltip,
                     placeholder: f.tooltip || '',
                     options: (f.options || []).map((o: any) => o.label || o.value || o),
                     lineageMetadata: f.metadata ? (typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata) : undefined
                  }))
               }));
               // Build O(1) field lookup map
               this.buildFieldMap();
               // Build node index for completion calculations
               this.buildNodeIndex();
               // Build reverse field-to-section map for Live view grouping
               this.buildFieldToSectionMap();

               if (this.sections.length > 0) {
                  this.activeSection = this.templateNavSections.length > 0 ? this.templateNavSections[0].id : this.sections[0].id;
               }
               if (this.inputData) {
                  this.mergeInputData();
               }
            },
            error: () => {
               console.warn('[TemplateEditor] Could not load form sections from API');
               if (this.inputData) {
                  this.mergeInputData();
               }
            }
         });
      } else {
         if (this.inputData) {
            this.mergeInputData();
         }
      }

      // Initialize from parent's requested viewMode
      if (this.initialViewMode) {
         this.viewMode = this.initialViewMode;
      }
   }

   ngOnDestroy(): void {
   }


   // --- Document helpers ---
   getDocTitle(): string {
      const titleField = this.findFieldByKey('product_name');
      return titleField?.value || this.inputData?.title || 'Untitled NPA';
   }

   getDocSubtitle(): string {
      const descField = this.findFieldByKey('product_description');
      if (descField?.value) {
         return descField.value.length > 150 ? descField.value.substring(0, 150) + '...' : descField.value;
      }
      return this.inputData?.description || '';
   }

   getDocDate(): string {
      const dateField = this.findFieldByKey('kickoff_date');
      return dateField?.value || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
   }

   getDocOwner(): string {
      const owner = this.findFieldByKey('product_manager_name');
      return owner?.value || this.inputData?.submitted_by || 'Product Manager';
   }

   getSectionNumber(index: number): string {
      const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII'];
      return romans[index] || String(index + 1);
   }

   /** HTML placeholder for empty field values */
   getEmptyPlaceholder(text: string): string {
      return '<span class="text-slate-400 italic">' + text + '</span>';
   }

   /** Return 1-based number for non-header fields within a section */
   getFieldNumber(section: NpaSection, fieldIndex: number): number {
      let count = 0;
      for (let i = 0; i <= fieldIndex; i++) {
         if (section.fields[i]?.type !== 'header') count++;
      }
      return count;
   }

   getSectionCompletion(section: NpaSection): number {
      const fields = section.fields.filter(f => f.type !== 'header');
      if (fields.length === 0) return 100;
      const filled = fields.filter(f => f.value && f.value.trim().length > 0).length;
      return Math.round((filled / fields.length) * 100);
   }

   getOverallCompletion(): number {
      const allFields = this.sections.flatMap(s => s.fields.filter(f => f.type !== 'header'));
      if (allFields.length === 0) return 0;
      const filled = allFields.filter(f => f.value && f.value.trim().length > 0).length;
      return Math.round((filled / allFields.length) * 100);
   }

   getLineageCount(lineage: string): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header' && f.value && f.value.trim().length > 0 && f.lineage === lineage).length;
   }

   getTotalFieldCount(): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header').length;
   }

   getFilledFieldCount(): number {
      return this.sections.flatMap(s => s.fields).filter(f => f.type !== 'header' && f.value && f.value.trim().length > 0).length;
   }

   private findFieldByKey(key: string): NpaField | undefined {
      for (const s of this.sections) {
         const f = s.fields.find(f => f.key === key);
         if (f) return f;
      }
      return undefined;
   }

   /**
    * Format raw text content into document-style HTML with bullet points and paragraphs.
    * Detects patterns like "- item", "* item", "1. item" and wraps them in proper HTML lists.
    * Also converts line breaks into paragraphs for a Confluence-like reading experience.
    */
   formatDocContent(value: string | null): string {
      if (!value || !value.trim()) return '';

      // Split into lines (preserve empty lines for paragraph breaks)
      const lines = value.split('\n');

      // Check if content contains a markdown table
      const hasTable = lines.some(l => l.trim().match(/^\|.*\|$/)) && lines.some(l => l.trim().match(/^\|[\s\-\|]+\|$/));
      if (hasTable) {
         return this.formatWithTables(lines);
      }

      const trimmedLines = lines.map(l => l.trim()).filter(l => l.length > 0);

      let html = '';
      let inList = false;
      let listType = '';

      for (const line of trimmedLines) {
         // Apply inline markdown: **bold**
         const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

         // Detect bullet points: -, *, or numbered (1., 2., etc.)
         const bulletMatch = processed.match(/^[\-\*]\s+(.+)/);
         const numberedMatch = processed.match(/^\d+[\.\)]\s+(.+)/);

         if (bulletMatch) {
            if (!inList || listType !== 'ul') {
               if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
               html += '<ul>';
               inList = true;
               listType = 'ul';
            }
            html += `<li>${bulletMatch[1]}</li>`;
         } else if (numberedMatch) {
            if (!inList || listType !== 'ol') {
               if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
               html += '<ol>';
               inList = true;
               listType = 'ol';
            }
            html += `<li>${numberedMatch[1]}</li>`;
         } else {
            if (inList) {
               html += listType === 'ul' ? '</ul>' : '</ol>';
               inList = false;
            }
            // Check for semicolon-separated items — convert to bullet list
            if (line.includes(';') && line.split(';').length >= 3) {
               const items = line.split(';').map(i => i.trim()).filter(i => i);
               html += '<ul>';
               for (const item of items) {
                  html += `<li>${item.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}</li>`;
               }
               html += '</ul>';
            } else {
               html += `<p>${processed}</p>`;
            }
         }
      }

      if (inList) {
         html += listType === 'ul' ? '</ul>' : '</ol>';
      }

      return html;
   }

   /** Parse markdown table syntax into HTML table */
   private formatWithTables(lines: string[]): string {
      let html = '';
      let inTable = false;
      let headerDone = false;
      let inList = false;
      let listType = '';

      for (const rawLine of lines) {
         const line = rawLine.trim();
         if (!line) continue;

         const processed = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

         // Table row detection
         if (line.match(/^\|.*\|$/)) {
            // Skip separator row (|---|---|)
            if (line.match(/^\|[\s\-\|:]+\|$/)) {
               continue;
            }
            if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
            const cells = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'));
            if (!inTable) {
               html += '<table>';
               inTable = true;
               headerDone = false;
            }
            if (!headerDone) {
               html += '<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
               headerDone = true;
            } else {
               html += '<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>';
            }
         } else {
            if (inTable) { html += '</tbody></table>'; inTable = false; }
            // Bullet/numbered detection (same as formatDocContent)
            const bulletMatch = processed.match(/^[\-\*]\s+(.+)/);
            const numberedMatch = processed.match(/^\d+[\.\)]\s+(.+)/);
            if (bulletMatch) {
               if (!inList || listType !== 'ul') { if (inList) html += listType === 'ul' ? '</ul>' : '</ol>'; html += '<ul>'; inList = true; listType = 'ul'; }
               html += `<li>${bulletMatch[1]}</li>`;
            } else if (numberedMatch) {
               if (!inList || listType !== 'ol') { if (inList) html += listType === 'ul' ? '</ul>' : '</ol>'; html += '<ol>'; inList = true; listType = 'ol'; }
               html += `<li>${numberedMatch[1]}</li>`;
            } else {
               if (inList) { html += listType === 'ul' ? '</ul>' : '</ol>'; inList = false; }
               html += `<p>${processed}</p>`;
            }
         }
      }
      if (inTable) html += '</tbody></table>';
      if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
      return html;
   }

   // --- Inline editing ---
   startEditing(field: NpaField) {
      this.editingField = field.key;
      this.onFieldFocus(field);
      // Focus the input after Angular renders it
      setTimeout(() => {
         const el = document.querySelector('#form-container textarea:focus, #form-container input:focus') as HTMLElement;
         if (!el) {
            const editAreas = document.querySelectorAll('#form-container textarea, #form-container input[type="text"]');
            const last = editAreas[editAreas.length - 1] as HTMLElement;
            last?.focus();
         }
      }, 50);
   }

   stopEditing() {
      this.editingField = null;
   }

   // --- Governance Check — calls Dify WF_NPA_Governance agent first, then DB fallback ---
   validateGovernance() {
      this.isRunningGovernance = true;
      const projectId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
      const desc = this.extractDescriptionFromForm();

      // Collect all filled fields as context for the Governance agent
      const filledFields: Record<string, string> = {};
      for (const section of this.sections) {
         for (const field of section.fields) {
            if (field.value && field.value.trim()) {
               filledFields[field.key] = field.value.substring(0, 500); // Cap length
            }
         }
      }

      // Step 1: Try Dify WF_NPA_Governance workflow agent
      const payload = {
         app: 'WF_NPA_Governance',
         inputs: {
            project_id: projectId || 'demo',
            product_description: desc,
            completion_pct: String(this.getOverallCompletion()),
            total_fields: String(this.getTotalFieldCount()),
            filled_fields: String(this.getFilledFieldCount()),
            auto_filled: String(this.getLineageCount('AUTO')),
            form_snapshot: JSON.stringify(filledFields)
         },
         response_mode: 'blocking'
      };

      this.http.post<any>('/api/dify/workflow', payload).subscribe({
         next: (res) => {
            // Parse agent response into ReadinessResult
            const agentResult = this.parseGovernanceAgentResponse(res);
            if (agentResult) {
               this.validationResult = agentResult;
               this.showValidationModal = true;
               this.isRunningGovernance = false;

               // Also persist to DB for audit trail
               if (projectId) {
                  this.governanceService.saveReadinessAssessment(projectId, agentResult).subscribe();
               }
            } else {
               // Agent returned no parseable result — fall back to DB service
               this.fallbackToDbGovernance(desc, projectId);
            }
         },
         error: () => {
            // Dify agent unreachable — fall back to DB-based governance service
            this.fallbackToDbGovernance(desc, projectId);
         }
      });
   }

   /** Parse Dify Governance agent response into ReadinessResult */
   private parseGovernanceAgentResponse(res: any): ReadinessResult | null {
      try {
         const output = res?.data?.outputs || res?.outputs || res;
         const text = output?.text || output?.result || res?.answer || '';

         // Try to parse structured JSON from agent output
         const jsonMatch = text.match(/\{[\s\S]*"score"[\s\S]*\}/);
         if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
               isReady: (parsed.score || 0) >= 85,
               score: parsed.score || 0,
               overallAssessment: parsed.assessment || parsed.overallAssessment || '',
               domains: (parsed.domains || []).map((d: any) => ({
                  name: d.name || d.domain,
                  status: d.status || 'PENDING',
                  observation: d.observation || d.finding || ''
               }))
            };
         }

         // If no structured JSON, build result from text
         if (text.length > 20) {
            const score = this.getOverallCompletion();
            return {
               isReady: score >= 85,
               score,
               overallAssessment: text.substring(0, 500),
               domains: [
                  { name: 'Governance Agent Assessment', status: score >= 85 ? 'PASS' : 'FAIL', observation: text.substring(0, 300) }
               ]
            };
         }

         return null;
      } catch {
         return null;
      }
   }

   /** Fallback: try DB governance service, then local generation */
   private fallbackToDbGovernance(desc: string, projectId: string | undefined) {
      this.governanceService.analyzeReadiness(desc, projectId).subscribe({
         next: (result) => {
            this.validationResult = result;
            this.showValidationModal = true;
            this.isRunningGovernance = false;
         },
         error: () => {
            this.isRunningGovernance = false;
            // Final fallback: generate from field stats
            this.validationResult = this.generateFallbackGovernanceResult();
            this.showValidationModal = true;
         }
      });
   }

   /** Final fallback governance result when both agent and DB are unavailable */
   private generateFallbackGovernanceResult(): ReadinessResult {
      const completion = this.getOverallCompletion();
      const autoCount = this.getLineageCount('AUTO');
      const adaptedCount = this.getLineageCount('ADAPTED');
      const manualCount = this.getLineageCount('MANUAL');
      const emptyCount = this.getTotalFieldCount() - this.getFilledFieldCount();
      const score = Math.min(completion, 100);
      return {
         isReady: score >= 85,
         score,
         overallAssessment: score >= 85
            ? `Draft is ${score}% complete with ${autoCount} AI-filled, ${adaptedCount} adapted, and ${manualCount} manual entries. Appears sufficiently complete for review.`
            : `Draft is only ${score}% complete with ${emptyCount} empty fields remaining. Address gaps before submitting for governance review.`,
         domains: [
            { name: 'Product Specifications', status: completion > 60 ? 'PASS' : 'FAIL', observation: `${completion}% of fields completed across template.` },
            { name: 'Risk Assessment', status: autoCount > 10 ? 'PASS' : 'MISSING', observation: `${autoCount} fields auto-filled by agent. Review for accuracy.` },
            { name: 'Operational Readiness', status: emptyCount < 20 ? 'PASS' : 'FAIL', observation: `${emptyCount} fields still empty — manual input needed.` },
            { name: 'Legal & Regulatory', status: completion > 70 ? 'PASS' : 'MISSING', observation: 'Regulatory fields need review for jurisdiction compliance.' },
            { name: 'Data Governance', status: completion > 80 ? 'PASS' : 'MISSING', observation: 'Data management and aggregation fields need confirmation.' }
         ]
      };
   }

   closeValidationModal() {
      this.showValidationModal = false;
      this.validationResult = null;
   }

   getDomainStatusClass(status: string): string {
      switch (status) {
         case 'PASS': return 'bg-emerald-100 text-emerald-800';
         case 'FAIL': return 'bg-red-100 text-red-800';
         case 'MISSING': return 'bg-amber-100 text-amber-800';
         default: return 'bg-slate-100 text-slate-800';
      }
   }

   private extractDescriptionFromForm(): string {
      const prodName = this.findFieldValue('Product Overview', 'Product Name') || this.findFieldByKey('product_name')?.value || '';
      const riskType = this.findFieldValue('Risk Assessment', 'Primary Risk Type') || this.findFieldByKey('risk_classification')?.value || '';
      const rationale = this.findFieldByKey('business_rationale')?.value || '';
      return `${prodName}. ${riskType}. ${rationale.substring(0, 300)}`;
   }

   private findFieldValue(sectionTitle: string, fieldLabel: string): string | undefined {
      const sec = this.sections.find(s => s.title === sectionTitle);
      return sec?.fields.find(f => f.label === fieldLabel)?.value;
   }


   /** Load similar NPAs for reference */
   loadSimilarNpas() {
      this.isLoadingSimilar = true;
      this.npaService.getAll().subscribe({
         next: (allNpas) => {
            // Filter out current NPA and sort by relevance (same type/category first)
            const currentId = this.inputData?.projectId || this.inputData?.id || this.inputData?.npaId;
            const currentType = this.inputData?.npa_type || '';
            const currentCategory = this.inputData?.product_category || '';

            this.similarNpas = allNpas
               .filter(n => n.id !== currentId)
               .sort((a, b) => {
                  // Score: same type = 2, same category = 1
                  const scoreA = (a.npa_type === currentType ? 2 : 0) + (a.product_category === currentCategory ? 1 : 0);
                  const scoreB = (b.npa_type === currentType ? 2 : 0) + (b.product_category === currentCategory ? 1 : 0);
                  return scoreB - scoreA;
               })
               .slice(0, 5); // Top 5 most similar

            this.isLoadingSimilar = false;
         },
         error: () => {
            this.isLoadingSimilar = false;
         }
      });
   }

   /** View a similar NPA (opens in new browser tab for reference) */
   viewSimilarNpa(npa: NpaListItem) {
      // Open the NPA detail in a new tab for side-by-side reference
      window.open(`/npa/${npa.id}`, '_blank');
   }

   save() {
      this.onSave.emit(this.sections);
      this.close.emit();
   }

   mergeInputData() {
      if (!this.inputData) return;

      const productSection = this.sections.find(s => s.title === 'Product Details' || s.title === 'Product Overview');
      if (productSection) {
         if (this.inputData.title) this.updateField(productSection, 'Product Name', this.inputData.title);
         if (this.inputData.jurisdictions) this.updateField(productSection, 'Key Currencies', 'CNY (offshore), ' + (this.inputData.jurisdictions?.includes?.('Hong Kong') ? 'HKD' : ''));
      }

      const riskSection = this.sections.find(s => s.title === 'Risk Assessment');
      if (riskSection) {
         if (this.inputData.riskLevel) this.updateField(riskSection, 'Primary Risk Type', 'Market Risk (' + this.inputData.riskLevel + ')');
         if (this.inputData.notional) this.updateField(riskSection, 'Risk Limits (VaR)', 'Daily VaR limit for ' + (this.inputData.notional / 1000000) + 'M position');
      }

      const opsSection = this.sections.find(s => s.title === 'Operational Readiness');
      if (opsSection) {
         this.updateField(opsSection, 'Booking System', 'Murex (MX.3) - IRD Module');
         this.updateField(opsSection, 'Accounting Treatment', 'Fair Value Through Profit/Loss (FVTPL)');
         if (this.inputData.isCrossBorder) this.updateField(opsSection, 'Settlement Process', 'HKEx OTC Clear <> SHCH (Swap Connect)');
      }

      const legalSection = this.sections.find(s => s.title === 'Legal & Regulatory');
      if (legalSection && this.inputData.jurisdictions) {
         const jurisdictionStr = Array.isArray(this.inputData.jurisdictions) ? this.inputData.jurisdictions.join(', ') : this.inputData.jurisdictions;
         this.updateField(legalSection, 'Cross-Border Rules', `Review required for ${jurisdictionStr} counterparties`);
      }
   }

   updateField(section: NpaSection, label: string, value: string) {
      const field = section.fields.find(f => f.label === label);
      if (field) {
         field.value = value;
         field.lineage = 'AUTO';
         field.lineageMetadata = { sourceSnippet: 'Agent Chat', confidenceScore: 100 };
      }
   }

   closeEditor() {
      this.close.emit();
   }

   scrollToSection(id: string) {
      this.activeSection = id;
      const el = document.getElementById('sec-' + id);
      const container = document.getElementById('form-container');
      if (el && container) {
         // Calculate actual offset of element relative to scroll container
         let offsetTop = 0;
         let current: HTMLElement | null = el;
         while (current && current !== container) {
            offsetTop += current.offsetTop;
            current = current.offsetParent as HTMLElement | null;
         }
         container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
   }

   onFieldFocus(field: NpaField) {
      this.focusedField = field;
   }

   onScroll(e: any) {
      // Scroll spy — update activeSection based on scroll position using template nav IDs
      let lastMatch = '';
      for (const navItem of this.templateNavSections) {
         const el = document.getElementById('sec-' + navItem.id);
         if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200) {
               lastMatch = navItem.id;
            }
         }
      }
      if (lastMatch) {
         this.activeSection = lastMatch;
      }
   }

   autoSize(event: any) {
      const textarea = event.target;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }

   // ── Template tree helpers ──

   /** Build O(1) lookup map from all loaded sections' fields */
   private buildFieldMap() {
      this.fieldMap.clear();
      for (const section of this.sections) {
         for (const field of section.fields) {
            if (field.key) {
               this.fieldMap.set(field.key, field);
            }
         }
      }
   }

   /** Build index of all template nodes by ID for completion calculations */
   private buildNodeIndex() {
      this.nodeIndex.clear();
      const indexNode = (node: TemplateNode) => {
         this.nodeIndex.set(node.id, node);
         for (const child of (node.children || [])) {
            indexNode(child);
         }
      };
      indexNode(this.templateTree);
      for (const app of this.appendicesTree) {
         indexNode(app);
      }
   }

   /** Build reverse lookup: field_key → section prefix (PC.I, PC.II, ..., APP) using FIELD_REGISTRY_MAP nodeId */
   private buildFieldToSectionMap() {
      this.fieldToSectionMap.clear();
      FIELD_REGISTRY_MAP.forEach((entry, key) => {
         if (entry.nodeId) {
            // Extract section prefix: 'PC.I.1.a' → 'PC.I', 'APP.3' → 'APP'
            if (entry.nodeId.startsWith('APP')) {
               this.fieldToSectionMap.set(key, 'APP');
            } else {
               // PC.I.1.a → take first two parts: PC.I
               const parts = entry.nodeId.split('.');
               if (parts.length >= 2) {
                  this.fieldToSectionMap.set(key, parts[0] + '.' + parts[1]);
               }
            }
         }
      });
      // Also map header fields (hdr_*) to their sections based on naming convention
      for (const [key] of this.fieldMap) {
         if (key.startsWith('hdr_') && !this.fieldToSectionMap.has(key)) {
            if (key.includes('prod_')) this.fieldToSectionMap.set(key, 'PC.I');
            else if (key.includes('ops_')) this.fieldToSectionMap.set(key, 'PC.II');
            else if (key.includes('price_')) this.fieldToSectionMap.set(key, 'PC.III');
            else if (key.includes('risk_')) this.fieldToSectionMap.set(key, 'PC.IV');
            else if (key.includes('data_')) this.fieldToSectionMap.set(key, 'PC.V');
            else if (key.includes('reg_') || key.includes('legal_')) this.fieldToSectionMap.set(key, 'PC.IV');
         }
      }
   }

   /** O(1) field lookup by key — returns the field or null */
   getFieldForKey(key: string): NpaField | null {
      return this.fieldMap.get(key) || null;
   }

   /** Calculate completion percentage for a template node (recursive) */
   getNodeCompletion(nodeId: string): number {
      // Invalidate cache each call (cheap since template is small)
      const node = this.nodeIndex.get(nodeId);
      if (!node) return 0;

      const keys = collectFieldKeys(node);
      if (keys.length === 0) return 100;

      let filled = 0;
      for (const key of keys) {
         const field = this.fieldMap.get(key);
         if (field?.value && field.value.trim().length > 0) {
            filled++;
         }
      }
      return Math.round((filled / keys.length) * 100);
   }

   /** Calculate textarea rows based on content length */
   getTextareaRows(value: string | undefined): number {
      if (!value) return 3;
      const lines = value.split('\n').length;
      const charLines = Math.ceil(value.length / 80);
      return Math.min(Math.max(lines, charLines, 3), 16);
   }

   /** Split pipe-delimited table cell values (e.g., "Yes | Yes | No | Yes") */
   splitTableValue(value: string | undefined, expectedCols: number): string[] {
      if (!value) return Array(expectedCols).fill('—');
      const parts = value.split('|').map(s => s.trim());
      // Pad or trim to expected columns
      while (parts.length < expectedCols) parts.push('—');
      return parts.slice(0, expectedCols);
   }

   getInputStyles(lineage: FieldLineage, isFocused: boolean): string {
      let base = 'bg-white border transition-all text-slate-900 ';

      if (isFocused) {
         base += 'ring-2 ring-blue-100 border-blue-400 bg-white';
      } else {
         // Color-coded left border based on lineage
         switch (lineage) {
            case 'AUTO':
               base += 'border-slate-200 border-l-emerald-400 border-l-2 hover:border-emerald-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
               break;
            case 'ADAPTED':
               base += 'border-slate-200 border-l-amber-400 border-l-2 hover:border-amber-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
               break;
            default:
               base += 'border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
         }
      }
      return base;
   }

   /** Lineage badge CSS class for right sidebar */
   getLineageBadgeClass(lineage: string, hasValue: boolean): string {
      if (!hasValue) return 'bg-slate-100 text-slate-500';
      switch (lineage) {
         case 'AUTO': return 'bg-emerald-50 text-emerald-700';
         case 'ADAPTED': return 'bg-amber-50 text-amber-700';
         case 'MANUAL': return 'bg-blue-50 text-blue-700';
         default: return 'bg-slate-100 text-slate-500';
      }
   }
}
