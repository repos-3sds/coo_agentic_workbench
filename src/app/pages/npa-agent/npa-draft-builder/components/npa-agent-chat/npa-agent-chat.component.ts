import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { DifyService } from '../../../../../services/dify/dify.service';
import { ChatSessionService } from '../../../../../services/chat-session.service';
import { HttpClient } from '@angular/common/http';
import {
   SignOffGroup,
   SignOffGroupId,
   SIGN_OFF_GROUPS,
   AgentChat,
   ChatMessage,
   FieldState
} from '../../npa-draft-builder.component';

/** Parsed field suggestion from @@NPA_META@@ in agent response */
export interface FieldSuggestion {
   fieldKey: string;
   label?: string;
   value: string;
   confidence?: number;
   format?: 'text' | 'bullets';
}

@Component({
   selector: 'app-npa-agent-chat',
   standalone: true,
   imports: [CommonModule, FormsModule, SharedIconsModule],
   templateUrl: './npa-agent-chat.component.html',
   styleUrls: ['./npa-agent-chat.component.css']
})
export class NpaAgentChatComponent implements OnInit, AfterViewChecked {
   @Input() signOffGroups: SignOffGroup[] = SIGN_OFF_GROUPS;
   @Input() activeAgentId: SignOffGroupId = 'BIZ';
   @Input() agentChats = new Map<SignOffGroupId, AgentChat>();
   @Input() sectionFieldGroups = new Map<string, { topic: string; numbering: string; guidance?: string; fields: FieldState[] }[]>();
   @Input() inputData: any = null;

   @Output() agentSelected = new EventEmitter<SignOffGroupId>();
   @Output() messageSent = new EventEmitter<{ agentId: SignOffGroupId; message: string; context: string }>();
   @Output() validateRequested = new EventEmitter<void>();
   @Output() applySuggestion = new EventEmitter<FieldSuggestion>();

   @ViewChild('chatContainer') chatContainer!: ElementRef;

   private cdr = inject(ChangeDetectorRef);
   private difyService = inject(DifyService);
   private chatSessionService = inject(ChatSessionService);
   private http = inject(HttpClient);
   private shouldScrollToBottom = false;

   chatInput = '';

   /** Pending field suggestions parsed from last agent response */
   pendingSuggestions: FieldSuggestion[] = [];

   /** If the user clicked the field AI button, we remember which field to apply the next answer to. */
   private pendingFieldHelp: { fieldKey: string; label?: string } | null = null;

   agentConfigured = new Map<string, boolean>();
   isTestingAgent = false;

   /** Maps Draft Builder sign-off groups to Dify agent registry keys */
   private readonly agentIdMap: Record<SignOffGroupId, string> = {
      BIZ: 'AG_NPA_BIZ',
      TECH_OPS: 'AG_NPA_TECH_OPS',
      FINANCE: 'AG_NPA_FINANCE',
      RMG: 'AG_NPA_RMG',
      LCS: 'AG_NPA_LCS'
   };

   ngOnInit(): void {
      this.refreshAgentStatus();
   }

   ngAfterViewChecked(): void {
      if (this.shouldScrollToBottom) {
         this.scrollToBottom();
         this.shouldScrollToBottom = false;
      }
   }

   selectAgent(agentId: SignOffGroupId): void {
      this.activeAgentId = agentId;
      this.pendingSuggestions = [];
      this.agentSelected.emit(agentId);
   }

   getActiveGroup(): SignOffGroup {
      return this.signOffGroups.find(g => g.id === this.activeAgentId) || this.signOffGroups[0];
   }

   getActiveAgentChat(): AgentChat | undefined {
      return this.agentChats.get(this.activeAgentId);
   }

   isActiveAgentConfigured(): boolean {
      const agentKey = this.agentIdMap[this.activeAgentId];
      return this.agentConfigured.get(agentKey) === true;
   }

   refreshAgentStatus(): void {
      this.http.get<{ agents: any[] }>('/api/dify/agents/status').subscribe({
         next: (res: any) => {
            const agents: any[] = Array.isArray(res?.agents) ? res.agents : Array.isArray(res) ? res : [];
            const map = new Map<string, boolean>();
            for (const a of agents) {
               if (!a?.id) continue;
               map.set(String(a.id), !!a.configured);
            }
            this.agentConfigured = map;
            this.cdr.detectChanges();
         },
         error: () => {
            // Non-fatal: keep unknown status
         }
      });
   }

   testActiveAgent(): void {
      const chat = this.agentChats.get(this.activeAgentId);
      if (!chat || this.isTestingAgent) return;

      const agentKey = this.agentIdMap[this.activeAgentId];
      chat.messages.push({
         role: 'system',
         content: `Testing connection for ${this.getActiveGroup().shortLabel} agent...`,
         timestamp: new Date()
      });
      this.shouldScrollToBottom = true;
      this.isTestingAgent = true;

      const npaId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      const npaTitle = this.inputData?.title || '';
      const inputs = {
         current_project_id: npaId ? String(npaId) : '',
         npa_data: npaTitle ? `NPA title: ${npaTitle}` : ''
      };

      this.difyService.sendMessage('Connection test: reply with OK and your agent name.', inputs, agentKey).subscribe({
         next: (resp) => {
            chat.messages.push({
               role: 'agent',
               content: resp.answer || 'OK',
               timestamp: new Date()
            });
            chat.isConnected = true;
            this.agentConfigured.set(agentKey, true);
            this.autoSaveSession(chat);
            this.shouldScrollToBottom = true;
            this.isTestingAgent = false;
            this.cdr.detectChanges();
         },
         error: (err) => {
            const msg = err?.error?.error || err?.message || 'Connection test failed';
            chat.messages.push({
               role: 'system',
               content: `Connection test failed. ${String(msg)}`,
               timestamp: new Date()
            });
            this.autoSaveSession(chat);
            this.shouldScrollToBottom = true;
            this.isTestingAgent = false;
            this.cdr.detectChanges();
         }
      });
   }

   sendChatMessage(): void {
      if (!this.chatInput.trim()) return;
      const chat = this.agentChats.get(this.activeAgentId);
      if (!chat) return;

      const userMessage = this.chatInput.trim();
      chat.messages.push({
         role: 'user',
         content: userMessage,
         timestamp: new Date()
      });
      this.autoSaveSession(chat);
      this.chatInput = '';
      this.pendingSuggestions = [];
      this.shouldScrollToBottom = true;

      // Build context with current section fields for the agent
      const agentKey = this.agentIdMap[this.activeAgentId];
      const group = this.signOffGroups.find(g => g.id === this.activeAgentId);
      const sectionContext = this.buildAgentContext(group);

      const fullPrompt = sectionContext
         ? `[Context: Reviewing NPA sections ${group?.sections.join(', ')}]\n\n${sectionContext}\n\nUser question: ${userMessage}`
         : userMessage;

      // Use blocking mode (server collects SSE and returns JSON). This is far more reliable
      // in dev/proxy environments than piping SSE streams end-to-end.
      chat.isStreaming = true;
      chat.streamText = '';

      const npaId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      const inputs = {
         current_project_id: npaId ? String(npaId) : '',
         current_stage: 'draft_builder',
         user_message: userMessage
      };

      this.difyService.sendMessage(fullPrompt, inputs, agentKey).subscribe({
         next: (resp) => {
            const answerText = String(resp.answer || '').trim();
            chat.messages.push({
               role: 'agent',
               content: answerText,
               timestamp: new Date()
            });

            const rawSuggestions = (resp as any)?.metadata?.payload?.field_suggestions;
            if (Array.isArray(rawSuggestions) && rawSuggestions.length) {
               this.pendingSuggestions = rawSuggestions.map((s: any) => ({
                  fieldKey: String(s.field_key || s.fieldKey || ''),
                  label: s.label ? String(s.label) : undefined,
                  value: String(s.suggested_value ?? s.value ?? ''),
                  confidence: typeof s.confidence === 'number' ? s.confidence : undefined
               })).filter((s: FieldSuggestion) => !!s.fieldKey);
            } else {
               // Fallback: if the user clicked "Ask agent about this field", provide an apply-to-field action
               // even when the agent did not return structured metadata.
               if (this.pendingFieldHelp?.fieldKey && answerText) {
                  this.pendingSuggestions = [{
                     fieldKey: this.pendingFieldHelp.fieldKey,
                     label: this.pendingFieldHelp.label,
                     value: answerText,
                     format: 'text'
                  }];
               } else {
                  this.pendingSuggestions = [];
               }
            }

            this.pendingFieldHelp = null;
            chat.isStreaming = false;
            chat.streamText = '';
            chat.isConnected = true;
            this.shouldScrollToBottom = true;
            this.autoSaveSession(chat);
            this.cdr.detectChanges();
         },
         error: (err) => {
            const apiDetail =
               err?.error?.metadata?.trace?.error_detail ||
               err?.error?.metadata?.trace?.detail ||
               err?.error?.detail ||
               err?.error?.error ||
               err?.message ||
               'Unknown error';

            console.warn(`[AgentChat] Agent ${agentKey} error:`, apiDetail);
            chat.messages.push({
               role: 'system',
               content: `Agent request failed (HTTP ${err?.status || 'N/A'}). ${String(apiDetail)}`,
               timestamp: new Date()
            });
            chat.isStreaming = false;
            chat.streamText = '';
            this.shouldScrollToBottom = true;
            this.autoSaveSession(chat);
            this.cdr.detectChanges();
         }
      });
   }

   /** Auto-ask the agent about a specific field */
   askAboutField(field: FieldState): void {
      this.pendingFieldHelp = { fieldKey: field.key, label: field.label };
      this.chatInput = `Help me fill the "${field.label}" field. What should the value be based on the product context?`;
      this.sendChatMessage();
   }

   /** Apply a field suggestion from agent response */
   onApplySuggestion(suggestion: FieldSuggestion): void {
      this.applySuggestion.emit(suggestion);
      // Remove applied suggestion from pending list
      this.pendingSuggestions = this.pendingSuggestions.filter(s => s.fieldKey !== suggestion.fieldKey);
      // Add confirmation message
      const chat = this.agentChats.get(this.activeAgentId);
      if (chat) {
         chat.messages.push({
            role: 'system',
            content: `Applied suggestion for "${suggestion.label || suggestion.fieldKey}".`,
            timestamp: new Date()
         });
         this.shouldScrollToBottom = true;
         this.autoSaveSession(chat);
         this.cdr.detectChanges();
      }
   }

   onApplySuggestionAsBullets(suggestion: FieldSuggestion): void {
      this.onApplySuggestion({ ...suggestion, format: 'bullets' });
   }

   /** Apply all pending suggestions */
   applyAllSuggestions(): void {
      for (const s of this.pendingSuggestions) {
         this.applySuggestion.emit(s);
      }
      const count = this.pendingSuggestions.length;
      this.pendingSuggestions = [];
      const chat = this.agentChats.get(this.activeAgentId);
      if (chat) {
         chat.messages.push({
            role: 'system',
            content: `Applied ${count} field suggestion${count > 1 ? 's' : ''}.`,
            timestamp: new Date()
         });
         this.shouldScrollToBottom = true;
         this.autoSaveSession(chat);
         this.cdr.detectChanges();
      }
   }

   isBulletField(fieldKey: string): boolean {
      if (!fieldKey) return false;
      for (const groups of this.sectionFieldGroups.values()) {
         for (const g of groups) {
            const f = g.fields?.find(ff => ff.key === fieldKey);
            if (f) return f.type === 'bullet_list';
         }
      }
      return false;
   }

   private autoSaveSession(chat: AgentChat): void {
      if (!chat.messages.length) return;
      const agentKey = this.agentIdMap[this.activeAgentId] || this.activeAgentId;
      const conversationId = this.difyService.getConversationId(agentKey);
      const conversationState = {
         activeAgentId: agentKey,
         delegationStack: [],
         conversations: conversationId ? { [agentKey]: conversationId } : {}
      };
      chat.sessionId = this.chatSessionService.saveSessionFor(
         chat.sessionId || null,
         chat.messages.map(m => ({
            role: m.role === 'system' ? 'agent' : m.role,
            content: m.content,
            timestamp: m.timestamp
         })),
         agentKey,
         null,
         { makeActive: false, conversationState }
      );
   }


   // ─── Meta Parsing ─────────────────────────────────────

   /** Parse @@NPA_META@@{...} from agent response text */
   private parseNpaMeta(text: string): { cleanText: string; suggestions: FieldSuggestion[] } {
      const metaPattern = /@@NPA_META@@(\{[\s\S]*?\})(?:@@END_META@@)?/g;
      const suggestions: FieldSuggestion[] = [];
      let cleanText = text;

      let match: RegExpExecArray | null;
      while ((match = metaPattern.exec(text)) !== null) {
         try {
            const meta = JSON.parse(match[1]);
            // Support both single field and array of fields
            const fields = meta.fields || (meta.field_key ? [meta] : []);
            for (const f of fields) {
               if (f.field_key && f.value !== undefined) {
                  suggestions.push({
                     fieldKey: f.field_key,
                     label: f.label || f.field_key,
                     value: String(f.value),
                     confidence: f.confidence
                  });
               }
            }
         } catch (e) {
            console.warn('[AgentChat] Failed to parse @@NPA_META@@:', e);
            this.tryExtractFieldsFromBrokenJson(match[1], suggestions);
         }
         cleanText = cleanText.replace(match[0], '').trim();
      }

      return { cleanText, suggestions };
   }

   /** Fallback: extract individual field objects from malformed/truncated JSON */
   private tryExtractFieldsFromBrokenJson(jsonStr: string, suggestions: FieldSuggestion[]): void {
      const fieldPattern = /\{\s*"field_key"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]*)"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*"confidence"\s*:\s*([\d.]+))?\s*\}/g;
      let fieldMatch: RegExpExecArray | null;
      let recovered = 0;
      while ((fieldMatch = fieldPattern.exec(jsonStr)) !== null) {
         suggestions.push({
            fieldKey: fieldMatch[1],
            label: fieldMatch[2] || fieldMatch[1],
            value: fieldMatch[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            confidence: fieldMatch[4] ? parseFloat(fieldMatch[4]) : undefined
         });
         recovered++;
      }
   }

   /** Get the Dify app name for the active agent (for error messages) */
   private getAgentDifyAppName(): string {
      const names: Record<SignOffGroupId, string> = {
         BIZ: 'CF_NPA_BIZ',
         TECH_OPS: 'CF_NPA_TECH_OPS',
         FINANCE: 'CF_NPA_FINANCE',
         RMG: 'CF_NPA_RMG',
         LCS: 'CF_NPA_LCS'
      };
      return names[this.activeAgentId];
   }

   /** Build a summary of current field values in the agent's sections for context */
   private buildAgentContext(group: SignOffGroup | undefined): string {
      if (!group) return '';
      const lines: string[] = [];

      const npaId = this.inputData?.npaId || this.inputData?.projectId || this.inputData?.id || '';
      const npaTitle = this.inputData?.title || this.inputData?.product_name || '';
      const npaDesc = this.inputData?.description || '';
      const npaType = this.inputData?.npaType || this.inputData?.npa_type || '';

      const headerBits: string[] = [];
      if (npaId) headerBits.push(`NPA ID: ${npaId}`);
      if (npaTitle) headerBits.push(`Title: ${npaTitle}`);
      if (npaType) headerBits.push(`Classification: ${npaType}`);
      if (npaDesc) headerBits.push(`Description: ${String(npaDesc).substring(0, 240)}${String(npaDesc).length > 240 ? '...' : ''}`);
      if (headerBits.length) {
         lines.push(`NPA summary:\n- ${headerBits.join('\n- ')}`);
      }

      const missingRequired: { key: string; label: string; section: string }[] = [];

      for (const sectionId of group.sections) {
         const groups = this.sectionFieldGroups.get(sectionId) || [];
         for (const g of groups) {
            const filled = g.fields.filter(f => f.value && f.value.trim());
            if (filled.length > 0) {
               lines.push(`### ${g.topic}`);
               for (const f of filled) {
                  lines.push(`- **${f.label}**: ${f.value.substring(0, 200)}${f.value.length > 200 ? '...' : ''}`);
               }
            }

            for (const f of g.fields) {
               const isEmpty = !f.value || !String(f.value).trim();
               if (isEmpty && f.required) {
                  missingRequired.push({ key: f.key, label: f.label, section: sectionId });
               }
            }
         }
      }

      if (missingRequired.length > 0) {
         const top = missingRequired.slice(0, 30);
         lines.push('');
         lines.push('Missing required fields (please propose values; if unknown, ask 1 clarification question first):');
         for (const m of top) {
            lines.push(`- ${m.key} — ${m.label} (${m.section})`);
         }
         if (missingRequired.length > top.length) {
            lines.push(`- ...and ${missingRequired.length - top.length} more required fields`);
         }
      }

      return lines.length > 0 ? `Current field values:\n${lines.join('\n')}` : '';
   }

   private scrollToBottom(): void {
      try {
         if (this.chatContainer) {
            this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
         }
      } catch (err) { }
   }

   trackByMsgIndex(index: number, _msg: ChatMessage): number {
      return index;
   }
}
