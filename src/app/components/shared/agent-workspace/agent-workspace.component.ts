import { Component, inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MarkdownModule } from 'ngx-markdown';
import { UserService } from '../../../services/user.service';
import { LayoutService } from '../../../services/layout.service';
import { DifyService, DifyAgentResponse, StreamEvent } from '../../../services/dify/dify.service';
import { ChatSessionService, ChatSession } from '../../../services/chat-session.service';
import { NpaService } from '../../../services/npa.service';
import { AGENT_REGISTRY, AgentAction, ClassificationResult, ClassificationScore } from '../../../lib/agent-interfaces';
import { ClassificationResultComponent } from '../../npa/agent-results/classification-result.component';
import { RiskAssessmentResultComponent } from '../../npa/agent-results/risk-assessment-result.component';
import { GovernanceStatusComponent } from '../../npa/agent-results/governance-status.component';
import { DocCompletenessComponent } from '../../npa/agent-results/doc-completeness.component';
import { MonitoringAlertsComponent } from '../../npa/agent-results/monitoring-alerts.component';
import { Subscription } from 'rxjs';
import { WorkspaceConfig, WorkspaceTemplate, TemplateCategory, TemplateInput } from './agent-workspace.interfaces';
import { TEMPLATE_CATEGORIES, WORKSPACE_TEMPLATES } from './agent-workspace-templates';

// ─── Local Interfaces ──────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    agentIdentity?: AgentIdentity;
    cardType?: 'DOMAIN_ROUTE' | 'CLASSIFICATION' | 'RISK' | 'HARD_STOP' | 'PREDICTION' | 'INFO' | 'GOVERNANCE' | 'DOC_STATUS' | 'MONITORING' | 'NPA_CREATED' | 'NPA_DRAFT_CTA';
    cardData?: any;
    agentAction?: string;
    isStreaming?: boolean; // True while SSE tokens are arriving (shows typing cursor)
}

interface AgentIdentity {
    id: string;
    name: string;
    role: string;
    color: string;
    icon: string;
}

@Component({
    selector: 'app-agent-workspace',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, RouterLink, FormsModule, MarkdownModule,
        ClassificationResultComponent, RiskAssessmentResultComponent,
        GovernanceStatusComponent, DocCompletenessComponent, MonitoringAlertsComponent],
    template: `
    <!-- ═══════ VIEW: LANDING (Overview + Chat Input) — only if config.showLanding ═══════ -->
    <div *ngIf="config.showLanding && viewMode === 'LANDING'" class="min-h-full flex flex-col items-center justify-center px-8 bg-white text-slate-900 relative overflow-hidden h-full">

      <!-- Animated Blobs Background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 -left-4 w-96 h-96 bg-[#FF3E3E] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div class="absolute top-0 -right-4 w-96 h-96 bg-[#0077CC] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-32 left-20 w-96 h-96 bg-[#CC9955] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <!-- Content Wrapper -->
      <div class="relative z-10 w-full max-w-6xl flex flex-col items-center">

          <!-- Pilot Badge -->
          <div class="mb-8 px-4 py-1.5 rounded-full border border-red-200 bg-red-50 backdrop-blur-sm text-xs font-medium text-red-600 flex items-center gap-2 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            Pilot Active: NPA Automation (Phase 0)
          </div>

          <!-- Main Hero Text -->
          <h1 class="text-6xl font-bold tracking-tight mb-4 text-center text-slate-900">
            {{ config.title }}
          </h1>
          <p class="text-xl text-slate-500 font-normal mb-12 text-center max-w-2xl">
            Orchestrating complex operations across Trading & Markets with intelligent, task-aware agents.
          </p>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">

            <!-- Functional Agents Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group"
                 [class.opacity-50]="userRole() !== 'MAKER' && userRole() !== 'ADMIN'"
                 [class.pointer-events-none]="userRole() !== 'MAKER' && userRole() !== 'ADMIN'">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-red-50/80 border border-red-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="bot" class="w-7 h-7 text-[#FF3E3E]"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-900">Functional Agents</h3>
                    <p class="text-base text-slate-500 leading-relaxed">
                        Specialized agents for Ideation, Risk, Finance, and Tech approvals.
                    </p>
                </div>
                <div class="mt-6">
                    <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-red-50/30 transition-colors group/item" [routerLink]="['/agents/npa']">
                        <div class="flex items-center gap-3">
                             <div class="w-2 h-2 rounded-full bg-green-500"></div>
                             <span class="text-sm font-semibold text-slate-700">Product Ideation Agent</span>
                        </div>
                        <lucide-icon name="arrow-right" class="w-4 h-4 text-[#FF3E3E] opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                     <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                        <div class="flex items-center gap-3">
                             <div class="w-2 h-2 rounded-full bg-slate-300"></div>
                             <span class="text-sm font-semibold text-slate-700">Risk Control Agent</span>
                        </div>
                        <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>

            <!-- Work Items Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="layers" class="w-7 h-7 text-slate-800"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-900">Work Items</h3>
                    <p class="text-base text-slate-500 leading-relaxed">
                        Track cross-functional workflows, approvals, and exceptions in real-time.
                    </p>
                </div>
                <div class="mt-6">
                    <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-slate-50/50 transition-colors group/item" [routerLink]="['/workspace/inbox']">
                         <span class="text-sm font-semibold text-slate-700">My Dashboard</span>
                         <lucide-icon name="arrow-right" class="w-4 h-4 text-slate-500 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                    <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                         <span class="text-sm font-semibold text-slate-700">Exception Queue</span>
                         <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>

            <!-- Intelligence Card -->
            <div class="bg-white/60 backdrop-blur-xl rounded-xl flex flex-col shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden border border-white/50 group">
                <div class="p-8 pb-4 flex-1">
                    <div class="w-14 h-14 rounded-2xl bg-orange-50/80 border border-orange-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                        <lucide-icon name="brain-circuit" class="w-7 h-7 text-orange-600"></lucide-icon>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-slate-900">Intelligence</h3>
                    <p class="text-base text-slate-500 leading-relaxed">
                        Centralized Knowledge Base (SOPs), Policy Engine, and Audit Trails.
                    </p>
                </div>
                 <div class="mt-6">
                    <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-pointer hover:bg-orange-50/50 transition-colors group/item" [routerLink]="['/knowledge/base']">
                        <span class="text-sm font-semibold text-slate-700">Knowledge Base</span>
                        <lucide-icon name="arrow-right" class="w-4 h-4 text-orange-500 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300"></lucide-icon>
                    </div>
                     <div class="border-t border-slate-100/50 flex items-center justify-between px-8 py-5 cursor-not-allowed opacity-40">
                        <span class="text-sm font-semibold text-slate-700">Audit Logs</span>
                        <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
                    </div>
                </div>
            </div>
          </div>

          <!-- ═══ CHAT INPUT (Below Cards) ═══ -->
          <div class="mt-12 w-full max-w-3xl">
              <div class="relative flex items-center group">
                  <div class="absolute left-4 text-violet-400 group-focus-within:text-violet-600 transition-colors">
                      <lucide-icon name="brain-circuit" class="w-5 h-5"></lucide-icon>
                  </div>
                  <input type="text"
                         [(ngModel)]="landingInput"
                         (keydown.enter)="startChatFromLanding()"
                         (focus)="inputFocused = true"
                         (blur)="inputFocused = false"
                         placeholder="Ask the COO Agent — NPA, Risk, Operations, Desk Support..."
                         class="w-full bg-white/80 backdrop-blur-sm text-slate-900 text-sm rounded-2xl pl-12 pr-14 py-4 border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:outline-none transition-all placeholder:text-slate-400 shadow-lg hover:shadow-xl focus:shadow-xl">
                  <button (click)="startChatFromLanding()"
                          [disabled]="!landingInput.trim()"
                          class="absolute right-2 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                      <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                  </button>
              </div>
              <div class="flex items-center justify-center gap-4 mt-4">
                  <button *ngFor="let hint of quickHints" (click)="startChatFromHint(hint.prompt)"
                          class="text-[11px] text-slate-400 hover:text-violet-600 font-medium px-3 py-1.5 rounded-full border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all cursor-pointer">
                      {{ hint.label }}
                  </button>
              </div>
          </div>

          <!-- Footer Status -->
          <div class="mt-10 text-xs text-slate-400 font-mono">
             System Status: <span class="text-green-600">Online</span> &bull; Dify API: <span class="text-green-600">Connected</span> &bull; v0.1.0-alpha
          </div>
      </div>
    </div>

    <!-- ═══════ VIEW: CHAT (Full-screen chat workspace) ═══════ -->
    <div *ngIf="viewMode === 'CHAT'" class="h-full w-full flex flex-col bg-white"
         [ngClass]="{'h-[calc(100vh-64px)]': config.showLanding}">

      <!-- Chat Body — no redundant header, controls are in the main top bar -->
      <div class="flex-1 overflow-hidden flex flex-col">

        <!-- ═══ TAB: CHAT ═══ -->
        <div *ngIf="chatTab === 'CHAT'" class="flex-1 flex flex-col h-full">

          <!-- Messages -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scroll-smooth relative" #scrollContainer>

             <!-- Empty State -->
             <div *ngIf="messages.length === 0 && !isThinking" class="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
                <div class="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-5">
                    <lucide-icon name="message-square" class="w-8 h-8 text-violet-400"></lucide-icon>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-1">Start a conversation</h3>
                <p class="text-sm text-slate-400 mb-6 max-w-sm">{{ config.context === 'NPA_AGENT' ? 'Ask the NPA Agent about product approvals, risk, classification, or compliance.' : 'Ask the COO Agent about operations, risk, compliance, or knowledge base.' }}</p>
                <div class="flex flex-wrap justify-center gap-2 max-w-lg">
                    <button *ngFor="let chip of suggestionChips"
                            (click)="handleChipClick(chip.prompt)"
                            class="text-xs text-slate-500 hover:text-violet-700 font-medium px-3 py-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition-all cursor-pointer flex items-center gap-1.5">
                        <lucide-icon [name]="chip.icon" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                        {{ chip.label }}
                    </button>
                </div>
                <p class="text-[10px] text-slate-300 mt-6 font-mono">Press Enter to send &middot; Shift+Enter for newline</p>
             </div>

             <div *ngFor="let msg of messages" class="flex gap-4 group" [ngClass]="{'flex-row-reverse': msg.role === 'user'}">
                <!-- Avatar -->
                <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm relative"
                     [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white' : getAvatarClasses(msg.agentIdentity)">
                   <span *ngIf="msg.role === 'user'">{{ userInitial() }}</span>
                   <lucide-icon *ngIf="msg.role !== 'user'" [name]="msg.agentIdentity?.icon || 'brain-circuit'" class="w-4 h-4"></lucide-icon>
                </div>

                <!-- Bubble -->
                <div class="flex flex-col gap-2 max-w-[80%]">
                    <span *ngIf="msg.role === 'agent' && msg.agentIdentity" class="text-[10px] font-bold uppercase tracking-wider" [ngClass]="getAgentLabelClass(msg.agentIdentity)">
                        {{ msg.agentIdentity.name }}
                    </span>

                    <div class="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative group/msg"
                         [ngClass]="msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'">
                       <markdown *ngIf="msg.content" [data]="msg.content" class="agent-markdown"></markdown>
                       <span *ngIf="msg.isStreaming" class="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-0.5 rounded-sm align-text-bottom"></span>
                       <div *ngIf="!msg.isStreaming" class="flex items-center justify-between mt-2 pt-1.5" [ngClass]="msg.role === 'user' ? 'border-t border-indigo-500/30' : 'border-t border-slate-100'">
                           <span class="text-[9px] font-mono" [ngClass]="msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'">{{ msg.timestamp | date:'shortTime' }}</span>
                           <button *ngIf="msg.role === 'agent'"
                                   (click)="copyMessage(msg.content)"
                                   class="opacity-0 group-hover/msg:opacity-100 text-slate-300 hover:text-violet-600 transition-all p-1 rounded"
                                   title="Copy response">
                               <lucide-icon [name]="copiedMessageId === msg.timestamp.getTime() ? 'check' : 'clipboard-list'" class="w-3.5 h-3.5"></lucide-icon>
                           </button>
                       </div>
                    </div>

                    <!-- CARD: DOMAIN ROUTING -->
                    <div *ngIf="msg.cardType === 'DOMAIN_ROUTE' && msg.cardData" class="bg-violet-50 border border-violet-100 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                        <div class="flex items-center gap-2 mb-3">
                            <lucide-icon name="navigation" class="w-4 h-4 text-violet-600"></lucide-icon>
                            <span class="text-xs font-bold text-violet-900">Domain Identified</span>
                        </div>
                        <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-violet-200">
                            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="msg.cardData.color">
                                <lucide-icon [name]="msg.cardData.icon" class="w-5 h-5"></lucide-icon>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-sm font-bold text-slate-900">{{ msg.cardData.name }}</h4>
                                <p class="text-[10px] text-slate-500">{{ msg.cardData.description }}</p>
                            </div>
                            <lucide-icon name="check-circle" class="w-4 h-4 text-green-500"></lucide-icon>
                        </div>
                    </div>

                    <app-classification-result *ngIf="msg.cardType === 'CLASSIFICATION' && msg.cardData" [result]="msg.cardData" class="w-full animate-fade-in"></app-classification-result>

                    <!-- CARD: HARD STOP -->
                    <div *ngIf="msg.cardType === 'HARD_STOP' && msg.cardData" class="bg-red-50 border-2 border-red-300 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="p-2 bg-red-100 text-red-700 rounded-lg">
                                <lucide-icon name="shield-alert" class="w-5 h-5"></lucide-icon>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-red-900">PROHIBITED - Hard Stop</h4>
                                <p class="text-[10px] text-red-600 font-mono uppercase">{{ msg.cardData.prohibitedMatch?.layer || 'REGULATORY' }}</p>
                            </div>
                        </div>
                        <div class="text-xs text-red-800 p-2 bg-white/50 rounded border border-red-200">
                            Matched prohibited item: <strong>{{ msg.cardData.prohibitedMatch?.item || 'Unknown' }}</strong>. Process blocked.
                        </div>
                    </div>

                    <!-- CARD: PREDICTION -->
                    <div *ngIf="msg.cardType === 'PREDICTION' && msg.cardData" class="bg-amber-50 border border-amber-100 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="p-2 bg-amber-100 text-amber-700 rounded-lg"><lucide-icon name="trending-up" class="w-5 h-5"></lucide-icon></div>
                            <h4 class="text-sm font-bold text-amber-900">ML Prediction</h4>
                        </div>
                        <div class="grid grid-cols-3 gap-3 text-center">
                            <div><div class="text-2xl font-bold text-amber-900">{{ msg.cardData.approvalLikelihood || 0 }}%</div><div class="text-[10px] text-amber-600 uppercase font-bold">Approval</div></div>
                            <div><div class="text-2xl font-bold text-amber-900">{{ msg.cardData.timelineDays || 0 }}d</div><div class="text-[10px] text-amber-600 uppercase font-bold">Timeline</div></div>
                            <div><div class="text-sm font-bold text-amber-900">{{ msg.cardData.bottleneckDept || '-' }}</div><div class="text-[10px] text-amber-600 uppercase font-bold">Bottleneck</div></div>
                        </div>
                    </div>

                    <app-risk-assessment-result *ngIf="msg.cardType === 'RISK' && msg.cardData" [result]="msg.cardData" class="w-full animate-fade-in"></app-risk-assessment-result>
                    <app-governance-status *ngIf="msg.cardType === 'GOVERNANCE' && msg.cardData" [result]="msg.cardData" class="w-full animate-fade-in"></app-governance-status>
                    <app-doc-completeness *ngIf="msg.cardType === 'DOC_STATUS' && msg.cardData" [result]="msg.cardData" class="w-full animate-fade-in"></app-doc-completeness>
                    <app-monitoring-alerts *ngIf="msg.cardType === 'MONITORING' && msg.cardData" [result]="msg.cardData" class="w-full animate-fade-in"></app-monitoring-alerts>

                    <!-- CARD: NPA CREATED -->
                    <div *ngIf="msg.cardType === 'NPA_CREATED' && msg.cardData" class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm animate-fade-in w-full">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><lucide-icon name="check-circle" class="w-4 h-4 text-emerald-600"></lucide-icon></div>
                            <div><p class="text-sm font-semibold text-emerald-800">NPA Record Created</p><p class="text-xs text-emerald-600">{{ msg.cardData.npaId }}</p></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="bg-white/60 rounded-lg px-3 py-2"><span class="text-slate-500">Title</span><p class="font-medium text-slate-800 truncate">{{ msg.cardData.title }}</p></div>
                            <div class="bg-white/60 rounded-lg px-3 py-2"><span class="text-slate-500">Stage</span><p class="font-medium text-slate-800">{{ msg.cardData.stage }}</p></div>
                            <div class="bg-white/60 rounded-lg px-3 py-2"><span class="text-slate-500">Status</span><p class="font-medium text-emerald-700">{{ msg.cardData.status }}</p></div>
                            <div class="bg-white/60 rounded-lg px-3 py-2"><button (click)="navigateToDomain('/agents/npa')" class="text-emerald-600 hover:text-emerald-800 font-medium underline underline-offset-2">View in Dashboard</button></div>
                        </div>
                    </div>

                    <!-- CARD: NPA DRAFT CTA — prominent clickable card to navigate to lifecycle -->
                    <div *ngIf="msg.cardType === 'NPA_DRAFT_CTA' && msg.cardData"
                         class="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-5 shadow-md animate-fade-in w-full hover:shadow-lg transition-shadow cursor-pointer group"
                         (click)="navigateToNpaDraft(msg.cardData)">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
                                <lucide-icon name="file-check" class="w-5 h-5 text-white"></lucide-icon>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-bold text-emerald-900">NPA Draft Created Successfully</p>
                                <p class="text-xs text-emerald-600 font-mono">{{ msg.cardData.npaId }}</p>
                            </div>
                            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                                <lucide-icon name="arrow-right" class="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform"></lucide-icon>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs mb-4">
                            <div class="bg-white/70 rounded-lg px-3 py-2">
                                <span class="text-slate-500 block">Product</span>
                                <p class="font-medium text-slate-800 truncate">{{ msg.cardData.title }}</p>
                            </div>
                            <div class="bg-white/70 rounded-lg px-3 py-2">
                                <span class="text-slate-500 block">Stage</span>
                                <p class="font-medium text-emerald-700">{{ msg.cardData.stage }}</p>
                            </div>
                            <div class="bg-white/70 rounded-lg px-3 py-2">
                                <span class="text-slate-500 block">Status</span>
                                <p class="font-medium text-emerald-700">{{ msg.cardData.status }}</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 px-4 transition-colors text-sm font-semibold shadow-sm">
                            <lucide-icon name="external-link" class="w-4 h-4"></lucide-icon>
                            Open NPA Lifecycle
                        </div>
                    </div>

                </div>
             </div>

             <!-- Thinking Indicator -->
             <div *ngIf="isThinking" class="flex gap-3 items-start">
                 <div class="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center flex-none mt-0.5">
                     <lucide-icon name="loader-2" class="w-4 h-4 text-violet-600 animate-spin"></lucide-icon>
                 </div>
                 <div class="flex-1 bg-gradient-to-r from-violet-50/80 to-indigo-50/60 border border-violet-100 rounded-xl px-4 py-3">
                     <div class="flex items-center justify-between mb-1.5">
                         <span class="text-xs font-semibold text-violet-700">{{ thinkingMessage }}</span>
                         <span class="text-[10px] font-mono text-violet-400 bg-violet-100/60 px-2 py-0.5 rounded-full">{{ thinkingElapsed }}</span>
                     </div>
                     <div class="flex items-center gap-2">
                         <div class="flex gap-0.5">
                             <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 0ms"></span>
                             <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 150ms"></span>
                             <span class="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style="animation-delay: 300ms"></span>
                         </div>
                         <span class="text-[11px] text-violet-500 italic">{{ thinkingSubMessage }}</span>
                     </div>
                 </div>
             </div>
          </div>

          <!-- Agent Activity Strip -->
          <div *ngIf="getActiveAgentsList().length > 0" class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2 overflow-x-auto flex-none">
             <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-none">Agents:</span>
             <div *ngFor="let a of getActiveAgentsList()" class="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border flex-none"
                  [ngClass]="a.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' : a.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">
                <lucide-icon [name]="a.icon" class="w-3 h-3"></lucide-icon>
                {{ a.name }}
                <lucide-icon *ngIf="a.status === 'running'" name="loader-2" class="w-3 h-3 animate-spin"></lucide-icon>
                <lucide-icon *ngIf="a.status === 'done'" name="check" class="w-3 h-3"></lucide-icon>
             </div>
          </div>

          <!-- Generate Work Item Button -->
          <div *ngIf="showGenerateButton" class="px-4 py-3 border-t border-indigo-100 bg-indigo-50/50 flex-none">
             <button (click)="navigateToDomain(activeDomainRoute)"
                     class="w-full py-3 bg-mbs-primary hover:bg-mbs-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                <lucide-icon name="file-plus-2" class="w-4 h-4"></lucide-icon>
                Open in {{ activeDomainAgent?.name || 'Domain Agent' }}
             </button>
          </div>

          <!-- Chat Input -->
          <div class="p-4 bg-slate-50 border-t border-slate-200 flex-none">
             <div class="flex items-center justify-between mb-3 px-1">
                 <div class="flex items-center gap-2">
                     <span class="w-2 h-2 rounded-full animate-pulse" [ngClass]="activeDomainAgent ? 'bg-green-500' : 'bg-violet-500'"></span>
                     <span class="text-xs font-bold text-slate-500 uppercase tracking-wide">{{ activeDomainAgent ? activeDomainAgent.name : 'Master COO Orchestrator' }}</span>
                 </div>
                 <button *ngIf="messages.length > 0"
                         (click)="newChatFromSidebar()"
                         class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all border border-blue-200 hover:border-blue-300 text-xs font-semibold shadow-sm">
                     <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
                     New Chat
                 </button>
             </div>
             <div class="relative flex items-end">
                 <textarea rows="1"
                        [(ngModel)]="userInput"
                        (keydown)="handleKeyDown($event)"
                        [placeholder]="config.context === 'NPA_AGENT' ? 'Ask me anything about your NPA...' : 'Ask the COO Agent — NPA, Risk, Operations, Desk Support...'"
                        class="w-full bg-white text-slate-900 text-sm rounded-lg pl-4 pr-12 py-3 border border-slate-300 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm chat-textarea"
                        ></textarea>
                 <button *ngIf="!isThinking"
                         (click)="sendMessage()"
                         [disabled]="!userInput.trim()"
                         class="absolute right-2 bottom-2 p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                    <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                 </button>
                 <button *ngIf="isThinking"
                         (click)="stopRequest()"
                         class="absolute right-2 bottom-2 p-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
                         title="Stop processing">
                    <lucide-icon name="square" class="w-3.5 h-3.5"></lucide-icon>
                 </button>
             </div>
          </div>
        </div>

        <!-- ═══ TAB: TEMPLATES ═══ -->
        <div *ngIf="chatTab === 'TEMPLATES'" class="flex-1 flex flex-col h-full bg-slate-50 relative">

          <!-- Category Filter -->
          <div class="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-hide flex-none relative category-bar">
             <div class="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mr-2 flex-none">
                <lucide-icon name="filter" class="w-3.5 h-3.5"></lucide-icon> Categories:
             </div>
             <button *ngFor="let cat of filteredCategories"
                     (click)="selectedCategory = cat.id"
                     class="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex-none"
                     [ngClass]="selectedCategory === cat.id ? 'bg-violet-50 text-violet-700 border-violet-200 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'">
                 {{ cat.name }}
             </button>
          </div>

          <!-- Template Grid -->
          <div class="flex-1 overflow-y-auto p-6 md:p-8">
             <div class="max-w-5xl mx-auto space-y-6">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {{ getCategoryName(selectedCategory) }}
                        <span class="text-slate-400 font-normal text-sm">({{ getTemplatesByCategory(selectedCategory).length }} templates)</span>
                    </h3>
                    <div class="relative w-64">
                        <lucide-icon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></lucide-icon>
                        <input type="text" [(ngModel)]="templateSearchQuery" placeholder="Filter templates..." class="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div *ngFor="let t of getTemplatesByCategory(selectedCategory)"
                        class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group flex flex-col h-full"
                        (click)="handleTemplateClick(t)">
                      <div class="flex items-start justify-between mb-3">
                         <div class="p-2 rounded-lg" [ngClass]="t.iconBg">
                            <lucide-icon [name]="t.icon" class="w-5 h-5"></lucide-icon>
                         </div>
                         <lucide-icon name="arrow-right" class="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors"></lucide-icon>
                      </div>
                      <h4 class="text-sm font-bold text-slate-900 mb-1 group-hover:text-violet-700 transition-colors">{{ t.title }}</h4>
                      <p class="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{{ t.description }}</p>
                      <div *ngIf="t.successRate || t.avgTime" class="flex items-center gap-3 text-[10px] font-medium pt-3 border-t border-slate-100">
                         <span *ngIf="t.avgTime" class="text-slate-600 flex items-center gap-1">
                            <lucide-icon name="clock" class="w-3 h-3 text-slate-400"></lucide-icon> {{ t.avgTime }}
                         </span>
                         <span *ngIf="t.successRate" class="text-slate-600 flex items-center gap-1">
                            <lucide-icon name="check-circle" class="w-3 h-3 text-green-500"></lucide-icon> {{ t.successRate }}% success
                         </span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <!-- Right Panel: Template Form (Slide Over) — only in form mode -->
          <div *ngIf="config.showTemplateForm && activeTemplate" class="w-96 border-l border-slate-200 bg-white flex-none flex flex-col shadow-2xl absolute right-0 top-0 bottom-0 z-30 animate-slide-in">
             <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 class="text-sm font-bold text-slate-900 truncate pr-4">Configure Template</h3>
                <button (click)="activeTemplate = null" class="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1 transition-colors">
                   <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
                </button>
             </div>
             <div class="p-6 flex-1 overflow-y-auto">
                <div class="space-y-6">
                   <div class="flex items-start gap-3">
                      <div class="p-2 rounded-lg flex-none" [ngClass]="activeTemplate.iconBg">
                         <lucide-icon [name]="activeTemplate.icon" class="w-5 h-5"></lucide-icon>
                      </div>
                      <div>
                         <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Selected</label>
                         <p class="text-sm font-bold text-slate-900 leading-tight">{{ activeTemplate.title }}</p>
                      </div>
                   </div>
                   <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800">
                      {{ activeTemplate.description }}
                   </div>
                   <div class="space-y-4 pt-2">
                      <div *ngFor="let field of activeTemplate.inputs; let i = index">
                         <label class="block text-xs font-semibold text-slate-700 mb-1.5">{{ field.label }} <span *ngIf="field.required" class="text-red-500">*</span></label>
                         <input *ngIf="field.type !== 'textarea'" [type]="field.type || 'text'" [placeholder]="field.placeholder"
                                [(ngModel)]="templateFormValues[i]"
                                class="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow bg-white hover:bg-slate-50 focus:bg-white">
                         <textarea *ngIf="field.type === 'textarea'" [placeholder]="field.placeholder" rows="3"
                                   [(ngModel)]="templateFormValues[i]"
                                   class="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow bg-white hover:bg-slate-50 focus:bg-white"></textarea>
                      </div>
                   </div>
                </div>
             </div>
             <div class="p-4 border-t border-slate-200 bg-slate-50">
                <button (click)="submitTemplateForm()" class="w-full py-3 bg-mbs-primary hover:bg-mbs-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                   <lucide-icon name="sparkles" class="w-4 h-4"></lucide-icon> Generate with AI
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  `,
    styles: [`
    :host { display: block; height: 100%; }
    .scrollbar-thin::-webkit-scrollbar { width: 6px; }
    .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 3px; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .chat-textarea { resize: none; overflow-y: auto; min-height: 44px; max-height: 120px; }
    .animate-slide-in { animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    /* Category bar fade-out indicator */
    .category-bar::after {
        content: '';
        position: absolute; right: 0; top: 0; bottom: 0; width: 48px;
        background: linear-gradient(to right, transparent, white);
        pointer-events: none; z-index: 1;
    }
    /* Agent response markdown spacing */
    :host ::ng-deep .agent-markdown p { margin-bottom: 0.5rem; }
    :host ::ng-deep .agent-markdown p:last-child { margin-bottom: 0; }
    :host ::ng-deep .agent-markdown strong { font-weight: 700; }
    :host ::ng-deep .agent-markdown ul, :host ::ng-deep .agent-markdown ol { margin: 0.5rem 0; padding-left: 1.25rem; }
    :host ::ng-deep .agent-markdown li { margin-bottom: 0.25rem; }
  `]
})
export class AgentWorkspaceComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    @Input() config: WorkspaceConfig = {
        context: 'COMMAND_CENTER',
        showLanding: true,
        showSidebar: true,
        showTemplateForm: false,
        templateFilter: null,
        title: 'COO Multi-Agent Workbench',
        subtitle: 'Master Orchestrator'
    };

    @Output() onBack = new EventEmitter<void>();
    @Output() onComplete = new EventEmitter<any>();

    private userService = inject(UserService);
    private layoutService = inject(LayoutService);
    private difyService = inject(DifyService);
    private chatSessionService = inject(ChatSessionService);
    private npaService = inject(NpaService);
    private router = inject(Router);
    private activitySub?: Subscription;
    private currentSubscription?: Subscription;

    userRole = () => this.userService.currentUser().role;

    // ─── View State ─────────────────────────────────────────────
    viewMode: 'LANDING' | 'CHAT' = 'LANDING';
    chatTab: 'CHAT' | 'TEMPLATES' = 'TEMPLATES';
    isHistoryPanelOpen = true;

    // ─── Landing State ──────────────────────────────────────────
    landingInput = '';
    inputFocused = false;

    quickHints = [
        { label: 'Create an NPA', prompt: 'I want to create a new product approval for a structured note' },
        { label: 'Risk check', prompt: 'Run a risk assessment for a new FX derivative' },
        { label: 'Search policies', prompt: 'Search the knowledge base for MAS guidelines on structured deposits' },
        { label: 'My approvals', prompt: 'Show me my pending approvals and sign-off status' },
    ];

    // ─── Chat State ─────────────────────────────────────────────
    userInput = '';
    isThinking = false;
    thinkingMessage = 'Master COO analyzing request...';
    thinkingSubMessage = '';
    thinkingElapsed = '0s';
    private thinkingStartTime = 0;
    private thinkingTimerInterval: any = null;
    private thinkingSubMessageInterval: any = null;
    private thinkingSubMessageIndex = 0;
    messages: ChatMessage[] = [];
    showGenerateButton = false;
    activeDomainRoute = '';
    private pendingDraftPayload: any = null;
    activeDomainAgent: { id: string; name: string; icon: string; color: string } | null = null;
    readonly AGENTS: Record<string, AgentIdentity> = {};
    activeAgents: Map<string, 'idle' | 'running' | 'done' | 'error'> = new Map();

    // ─── Suggestion Chips (empty chat state) ────────────────────
    copiedMessageId: number | null = null;

    get suggestionChips() {
        if (this.config.context === 'NPA_AGENT') {
            return [
                { label: 'Create a new NPA', icon: 'file-plus', prompt: 'I want to create a new product approval for a structured note' },
                { label: 'Run risk assessment', icon: 'shield-alert', prompt: 'Run a risk assessment for a new FX derivative' },
                { label: 'Check compliance', icon: 'scale', prompt: 'Check MAS regulatory compliance for a structured deposit' },
                { label: 'Product classification', icon: 'layers', prompt: 'Classify a new equity-linked structured product' },
            ];
        }
        return [
            { label: 'Create an NPA', icon: 'file-plus', prompt: 'I want to create a new product approval for a structured note' },
            { label: 'Risk check', icon: 'shield-alert', prompt: 'Run a risk assessment for a new FX derivative' },
            { label: 'Search policies', icon: 'book-open', prompt: 'Search the knowledge base for MAS guidelines on structured deposits' },
            { label: 'My approvals', icon: 'clipboard-check', prompt: 'Show me my pending approvals and sign-off status' },
        ];
    }

    // ─── Template State ─────────────────────────────────────────
    selectedCategory = '';
    templateSearchQuery = '';
    activeTemplate: WorkspaceTemplate | null = null;
    templateFormValues: string[] = [];

    // Filtered categories and templates based on config
    filteredCategories: TemplateCategory[] = [];
    filteredTemplates: WorkspaceTemplate[] = [];

    constructor() {
        for (const agent of AGENT_REGISTRY) {
            this.AGENTS[agent.id] = {
                id: agent.id,
                name: agent.name,
                role: agent.description,
                color: agent.color,
                icon: agent.icon
            };
            this.activeAgents.set(agent.id, 'idle');
        }
    }

    ngOnInit() {
        // Apply template filter from config
        if (this.config.templateFilter && this.config.templateFilter.length > 0) {
            this.filteredCategories = TEMPLATE_CATEGORIES.filter(c => this.config.templateFilter!.includes(c.id));
            this.filteredTemplates = WORKSPACE_TEMPLATES.filter(t => this.config.templateFilter!.includes(t.category));
        } else {
            this.filteredCategories = TEMPLATE_CATEGORIES;
            this.filteredTemplates = WORKSPACE_TEMPLATES;
        }
        this.selectedCategory = this.filteredCategories[0]?.id || '';

        // If no landing page, start directly in chat mode and register with layout
        if (!this.config.showLanding) {
            this.viewMode = 'CHAT';
            this.chatTab = 'TEMPLATES';
            this.registerChatModeWithLayout();

            // Auto-restore the active session so navigating away/back doesn't look like
            // the conversation was "destroyed" until the user clicks it again.
            this.tryAutoRestoreActiveSession();
            // Sessions hydrate asynchronously from DB; retry a couple times.
            setTimeout(() => this.tryAutoRestoreActiveSession(), 500);
            setTimeout(() => this.tryAutoRestoreActiveSession(), 1500);
        }

        this.activitySub = this.difyService.getAgentActivity().subscribe(update => {
            this.activeAgents.set(update.agentId, update.status);
        });
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    ngOnDestroy() {
        this.activitySub?.unsubscribe();
        this.currentSubscription?.unsubscribe();
        this.stopThinkingTimer();
        this.autoSaveSession();
        // Always exit chat mode and restore sidebar on destroy
        this.layoutService.exitChatMode();
        this.layoutService.setSidebarVisible(true);
        this.layoutService.setSidebarState(false);
    }

    userInitial(): string {
        return this.userService.currentUser().name.charAt(0);
    }

    // ─── Landing → Chat Transition ──────────────────────────────

    startChatFromLanding() {
        if (!this.landingInput.trim()) return;
        const message = this.landingInput;
        this.landingInput = '';
        this.enterChatMode();
        this.processMessage(message);
    }

    startChatFromHint(prompt: string) {
        const existing = this.landingInput.trim();
        this.landingInput = '';
        this.enterChatMode();
        const combined = existing ? `${existing} — ${prompt}` : prompt;
        this.processMessage(combined);
    }

    private enterChatMode() {
        this.viewMode = 'CHAT';
        this.chatTab = 'CHAT';
        this.difyService.reset();
        this.registerChatModeWithLayout();
    }

    private registerChatModeWithLayout() {
        // Register chat mode with layout — replaces sidebar with chat history, adds controls to header
        this.layoutService.enterChatMode({
            title: this.config.title,
            subtitle: this.activeDomainAgent ? this.activeDomainAgent.name : this.config.subtitle,
            activeTab: this.chatTab,
            onBack: () => this.goBack(),
            onTabChange: (tab: 'CHAT' | 'TEMPLATES') => {
                this.chatTab = tab;
                this.layoutService.updateChatTab(tab);
            },
            onNewChat: () => this.newChatFromSidebar(),
            onResetChat: () => this.resetChat(),
            onSelectSession: (session: any) => this.loadSession(session),
        });

        // Expand sidebar slot to show chat history (ensure not collapsed)
        this.layoutService.setSidebarState(false);
    }

    goBack() {
        // Exit chat mode — restore sidebar
        this.layoutService.exitChatMode();

        if (this.config.showLanding) {
            this.autoSaveSession();
            this.chatSessionService.startNewSession();
            this.viewMode = 'LANDING';
            this.messages = [];
            this.activeDomainAgent = null;
            this.showGenerateButton = false;
            this.difyService.reset();
            this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
            this.layoutService.setSidebarVisible(true);
            this.layoutService.setSidebarState(false);
        } else {
            this.onBack.emit();
        }
    }

    // ─── Chat Logic ─────────────────────────────────────────────

    sendMessage() {
        if (!this.userInput.trim()) return;
        const content = this.userInput;
        this.userInput = '';
        this.processMessage(content);
    }

    /** Handle chip click: combine any existing typed input with the chip prompt, then auto-submit */
    handleChipClick(chipPrompt: string) {
        const existing = this.userInput.trim();
        const combined = existing ? `${existing} ${chipPrompt}` : chipPrompt;
        this.userInput = '';
        this.processMessage(combined);
    }

    stopRequest() {
        this.currentSubscription?.unsubscribe();
        this.currentSubscription = undefined;
        this.isThinking = false;
        this.stopThinkingTimer();
        this.messages.push({
            role: 'agent',
            content: '*Request cancelled by user.*',
            timestamp: new Date(),
            agentIdentity: this.AGENTS['MASTER_COO']
        });
    }

    handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (this.isThinking) {
                this.stopRequest();
            }
            if (this.userInput.trim()) {
                this.sendMessage();
            }
        }
    }

    // ─── Thinking Timer ─────────────────────────────────────────

    private readonly AGENT_THINKING_MESSAGES: Record<string, string[]> = {
        MASTER_COO: ['Analyzing your request...', 'Identifying the right domain...', 'Routing to specialist agent...', 'Evaluating request context...'],
        IDEATION: ['Gathering product information...', 'Searching for similar historical NPAs...', 'Checking prohibited products list...', 'Analyzing product structure...', 'Evaluating regulatory requirements...', 'Building NPA draft...'],
        CLASSIFIER: ['Running classification model...', 'Comparing against product taxonomy...', 'Checking prohibited/restricted lists...', 'Scoring product complexity...'],
        RISK: ['Evaluating risk factors...', 'Running risk scoring model...', 'Analyzing market exposure...', 'Checking regulatory risk limits...'],
        DILIGENCE: ['Searching knowledge base...', 'Retrieving relevant policies...', 'Cross-referencing guidelines...'],
        DEFAULT: ['Processing your request...', 'Analyzing data...', 'Preparing response...']
    };

    private startThinkingTimer(agentId: string) {
        this.thinkingStartTime = Date.now();
        this.thinkingElapsed = '0s';
        this.thinkingSubMessageIndex = 0;
        const messages = this.AGENT_THINKING_MESSAGES[agentId] || this.AGENT_THINKING_MESSAGES['DEFAULT'];
        this.thinkingSubMessage = messages[0];
        this.thinkingTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.thinkingStartTime) / 1000);
            this.thinkingElapsed = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
        }, 1000);
        this.thinkingSubMessageInterval = setInterval(() => {
            this.thinkingSubMessageIndex = (this.thinkingSubMessageIndex + 1) % messages.length;
            this.thinkingSubMessage = messages[this.thinkingSubMessageIndex];
        }, 4000);
    }

    private stopThinkingTimer() {
        if (this.thinkingTimerInterval) { clearInterval(this.thinkingTimerInterval); this.thinkingTimerInterval = null; }
        if (this.thinkingSubMessageInterval) { clearInterval(this.thinkingSubMessageInterval); this.thinkingSubMessageInterval = null; }
    }

    // ─── Message Processing ─────────────────────────────────────

    processMessage(content: string) {
        this.messages.push({ role: 'user', content, timestamp: new Date() });
        this.sessionDirty = true;
        this.isThinking = true;

        const currentAgent = this.difyService.activeAgentId;
        const agentDisplay = this.AGENTS[currentAgent];
        this.thinkingMessage = agentDisplay ? `${agentDisplay.name} is working` : 'Master COO Orchestrator is working';
        this.startThinkingTimer(currentAgent);

        // Push a placeholder message for streaming text to appear in
        const streamingMsg: ChatMessage = {
            role: 'agent', content: '', timestamp: new Date(),
            agentIdentity: agentDisplay || this.AGENTS['MASTER_COO'],
            isStreaming: true
        };
        this.messages.push(streamingMsg);

        this.currentSubscription?.unsubscribe();
        this.currentSubscription = this.difyService.sendMessageStreamed(content).subscribe({
            next: (evt: StreamEvent) => {
                if (evt.type === 'chunk') {
                    // Append text incrementally — user sees words appear live
                    streamingMsg.content += evt.text;
                } else if (evt.type === 'thought') {
                    // Update the thinking status message with agent's reasoning step
                    this.thinkingMessage = `${agentDisplay?.name || 'Agent'} is working`;
                    this.thinkingSubMessage = evt.thought;
                } else if (evt.type === 'done') {
                    // Remove the streaming placeholder
                    const idx = this.messages.indexOf(streamingMsg);
                    if (idx !== -1) this.messages.splice(idx, 1);
                    // Process the complete response (handles actions, cards, routing)
                    this.handleResponse(evt.response);
                }
            },
            error: () => {
                // Remove streaming placeholder on error
                const idx = this.messages.indexOf(streamingMsg);
                if (idx !== -1) this.messages.splice(idx, 1);
                const errorAgentId = this.difyService.activeAgentId || 'MASTER_COO';
                this.messages.push({
                    role: 'agent', content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date(), agentIdentity: this.AGENTS[errorAgentId] || this.AGENTS['MASTER_COO']
                });
                this.isThinking = false;
                this.stopThinkingTimer();
                this.autoSaveSession();
            }
        });
    }

    private handleResponse(res: DifyAgentResponse) {
        const agentId = this.difyService.activeAgentId || res.metadata?.agent_id || 'MASTER_COO';
        const identity = this.AGENTS[agentId] || this.AGENTS['MASTER_COO'];
        const action = res.metadata?.agent_action;

        let routing: ReturnType<typeof this.difyService.processAgentRouting> | null = null;
        if (res.metadata) {
            routing = this.difyService.processAgentRouting(res.metadata);
        }

        let cardType: ChatMessage['cardType'] = undefined;
        let cardData: any = undefined;

        if (action === 'ROUTE_DOMAIN' && res.metadata?.payload) {
            const p = res.metadata.payload;
            const domainData = p.data || p;
            cardType = 'DOMAIN_ROUTE';
            cardData = { ...domainData, target_agent: p.target_agent, intent: p.intent };
            this.activeDomainAgent = {
                id: domainData.domainId || p.domainId || 'NPA',
                name: domainData.name || p.name || 'NPA Domain Orchestrator',
                icon: domainData.icon || p.icon || 'target',
                color: domainData.color || p.color || 'bg-orange-50 text-orange-600'
            };
            this.layoutService.updateChatSubtitle(this.activeDomainAgent.name);
            const route = domainData.route || p.uiRoute || p.route;
            if (route) this.activeDomainRoute = route;
        } else if (action === 'DELEGATE_AGENT' && res.metadata?.payload) {
            const targetId = res.metadata.payload.target_agent;
            const targetAgent = this.AGENTS[targetId];
            if (targetAgent) {
                this.activeDomainAgent = { id: targetId, name: targetAgent.name, icon: targetAgent.icon, color: targetAgent.color };
                this.layoutService.updateChatSubtitle(targetAgent.name);
            }
            cardType = 'INFO';
            cardData = { title: `Delegating to ${targetAgent?.name || targetId}`, description: res.metadata.payload.reason || 'Switching to specialist agent' };
        } else if (action === 'SHOW_CLASSIFICATION' && res.metadata?.payload) {
            cardType = 'CLASSIFICATION'; cardData = res.metadata.payload;
        } else if (action === 'HARD_STOP' || action === 'STOP_PROCESS') {
            cardType = 'HARD_STOP'; cardData = res.metadata?.payload;
        } else if (action === 'SHOW_PREDICTION' && res.metadata?.payload) {
            cardType = 'PREDICTION'; cardData = res.metadata.payload;
        } else if (action === 'SHOW_RISK' && res.metadata?.payload) {
            cardType = 'RISK'; cardData = res.metadata.payload;
        } else if (action === 'SHOW_GOVERNANCE' && res.metadata?.payload) {
            cardType = 'GOVERNANCE'; cardData = res.metadata.payload;
        } else if (action === 'SHOW_DOC_STATUS' && res.metadata?.payload) {
            cardType = 'DOC_STATUS'; cardData = res.metadata.payload;
        } else if (action === 'SHOW_MONITORING' && res.metadata?.payload) {
            cardType = 'MONITORING'; cardData = res.metadata.payload;
        } else if (action === 'FINALIZE_DRAFT') {
            this.showGenerateButton = true;
            this.activeDomainRoute = res.metadata?.payload?.route || '/agents/npa';
            this.triggerClassifier(res.metadata?.payload);
            this.pendingDraftPayload = res.metadata?.payload;
            this.createNpaFromDraft(res.metadata?.payload);  // CTA card shown on success
            if (res.metadata?.payload?.target_agent) {
                this.difyService.returnToPreviousAgent('finalize_draft');
            }
            // Do NOT emit onComplete here — user clicks the CTA card to navigate
        }

        // Only push the agent message if there's visible content or a card to show.
        // Routing-only responses (e.g. ROUTE_DOMAIN with no display text) should not
        // leave an empty bubble — the local greeting below handles the UI.
        const hasContent = res.answer && res.answer.trim().length > 0;
        const hasCard = !!cardType && cardType !== 'DOMAIN_ROUTE';
        if (hasContent || hasCard) {
            this.messages.push({ role: 'agent', content: res.answer, timestamp: new Date(), agentIdentity: identity, cardType, cardData, agentAction: action });
            this.sessionDirty = true;
        }

        // Instant agent switch with local greeting + context forwarding
        if (routing?.shouldSwitch && routing.targetAgent) {
            const targetId = routing.targetAgent;
            const targetAgent = this.AGENTS[targetId];
            const intent = res.metadata?.payload?.intent || res.metadata?.payload?.data?.intent || '';
            if (targetAgent) {
                this.activeDomainAgent = { id: targetId, name: targetAgent.name, icon: targetAgent.icon, color: targetAgent.color };
                this.layoutService.updateChatSubtitle(targetAgent.name);
            }

            // For DELEGATE_AGENT: forward the orchestrator's answer as context
            // to the new agent so it has full product details from the conversation.
            // Auto-forward context during delegation or domain routing so the
            // target agent gets the information previously captured.
            if ((action === 'DELEGATE_AGENT' || action === 'ROUTE_DOMAIN') && targetId) {
                const greetIdentity = this.AGENTS[targetId] || this.AGENTS['MASTER_COO'];
                const agentName = targetAgent?.name || targetId;

                let title = 'Agent Handoff';
                let description = `${agentName} is taking over with full context.`;
                if (action === 'ROUTE_DOMAIN' && intent) {
                    title = 'Domain Orchestrator';
                    description = `Routing to ${agentName} to handle **${intent}**. Forwarding your request...`;
                }

                this.messages.push({
                    role: 'agent',
                    content: `**${agentName}** is now connected. Forwarding context...`,
                    timestamp: new Date(),
                    agentIdentity: greetIdentity,
                    cardType: 'INFO',
                    cardData: { title, description }
                });
                this.sessionDirty = true;

                // Auto-send the orchestrator's last response and user messages as context to the new agent
                this.isThinking = true;
                this.startThinkingTimer(`${agentName} is loading context...`);
                const contextSummary = this._buildDelegationContext(res.answer);
                this.currentSubscription?.unsubscribe();

                // For agent-workspace, we use sendMessageStreamed
                this.currentSubscription = this.difyService.sendMessageStreamed(
                    contextSummary,
                    { orchestrator_message: res.answer.substring(0, 4000) },
                    targetId
                ).subscribe({
                    next: (evt) => {
                        if (evt.type === 'done') {
                            this.handleResponse(evt.response);
                        }
                    },
                    error: () => {
                        this.isThinking = false;
                        this.stopThinkingTimer();
                    }
                });
            } else {
                // Standard routing (ROUTE_DOMAIN etc.) — show local greeting
                const greetIdentity = this.AGENTS[targetId] || this.AGENTS['MASTER_COO'];
                const agentName = targetAgent?.name || targetId;
                const intentLine = intent ? `\n\nI understand you'd like to **${intent}**. ` : '\n\n';
                const localGreeting = `**${agentName}** is ready.${intentLine}Go ahead and describe your product idea or requirement — I'll guide you through the process step by step.`;
                this.messages.push({ role: 'agent', content: localGreeting, timestamp: new Date(), agentIdentity: greetIdentity });
                this.sessionDirty = true;
                this.isThinking = false;
                this.stopThinkingTimer();
            }
        } else {
            this.isThinking = false;
            this.stopThinkingTimer();
        }

        this.autoSaveSession();
    }

    resetChat() {
        this.messages = [];
        this.activeDomainAgent = null;
        this.showGenerateButton = false;
        this.sessionDirty = false;
        this.difyService.reset();
        this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
        this.layoutService.updateChatSubtitle(this.config.subtitle);
    }

    // ─── Session Management ──────────────────────────────────────

    private sessionDirty = false;
    private didAutoRestoreSession = false;
    private sessionLoadSeq = 0;
    private sessionId: string | null = null;

    /**
     * Build a concise context message to send to the delegated agent.
     * Extracts key product details from the orchestrator's final response
     * so the specialist agent (e.g., Ideation) has full context.
     */
    private _buildDelegationContext(orchestratorAnswer: string): string {
        // Extract the most relevant parts — trim to avoid sending the entire verbose response
        const trimmed = orchestratorAnswer.substring(0, 3000);
        // Collect user messages from the conversation as context
        const userMessages = this.messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join(' | ');
        return `[CONTEXT FROM ORCHESTRATOR]\nThe following product details were gathered during the routing phase. Please use this context to begin the structured interview — do not re-ask questions already answered.\n\nUser's original request:\n${userMessages.substring(0, 2000)}\n\nOrchestrator summary:\n${trimmed}`;
    }

    private autoSaveSession(): void {
        if (this.messages.length === 0 || !this.sessionDirty) return;

        // If we don't have a session ID yet, we should make the new one active
        // But if we're just updating an existing session in the background, don't change global state.
        const isNew = !this.sessionId;

        this.sessionId = this.chatSessionService.saveSessionFor(
            this.sessionId,
            this.messages,
            this.difyService.activeAgentId,
            this.activeDomainAgent,
            { makeActive: isNew, conversationState: this.difyService.exportConversationState() }
        );
    }

    newChatFromSidebar(): void {
        this.autoSaveSession();
        this.resetChat();
        this.sessionId = null;
        this.chatSessionService.startNewSession();
    }

    async loadSession(session: ChatSession): Promise<void> {
        const loadSeq = ++this.sessionLoadSeq;
        this.autoSaveSession();
        this.difyService.reset();
        this.activeAgents.forEach((_, key) => this.activeAgents.set(key, 'idle'));
        this.showGenerateButton = false;

        const fullSession = await this.chatSessionService.fetchSessionWithMessages(session.id);
        // Ignore out-of-order async completions when the user clicks multiple sessions quickly.
        if (loadSeq !== this.sessionLoadSeq) return;
        const msgs = fullSession?.messages || session.messages || [];

        this.messages = msgs.map((m: any) => ({
            role: m.role, content: m.content, timestamp: new Date(m.timestamp),
            agentIdentity: m.agentIdentityId ? this.AGENTS[m.agentIdentityId] || this.AGENTS['MASTER_COO'] : undefined,
            cardType: m.cardType as any, cardData: m.cardData, agentAction: m.agentAction
        }));

        const domainAgent = fullSession?.domainAgent || session.domainAgent;
        this.activeDomainAgent = domainAgent || null;
        this.layoutService.updateChatSubtitle(this.activeDomainAgent?.name || this.config.subtitle);

        const activeAgent = fullSession?.activeAgentId || session.activeAgentId;
        if (activeAgent && activeAgent !== 'MASTER_COO') {
            this.difyService.setActiveAgent(activeAgent);
        }

        const state = fullSession?.conversationState || session.conversationState;
        if (state) {
            this.difyService.restoreConversationState(state);
        }

        this.chatSessionService.setActiveSession(session.id);
        this.sessionId = session.id;
        this.chatTab = 'CHAT';
        this.isThinking = false;
        this.stopThinkingTimer();
        this.sessionDirty = false;
    }

    private tryAutoRestoreActiveSession(): void {
        if (this.didAutoRestoreSession) return;
        const activeId = this.chatSessionService.activeSessionId();
        if (!activeId) return;

        // Prefer local cache first to avoid flashing; fetchSessionWithMessages will hydrate.
        const cached = this.chatSessionService.getSession(activeId);
        if (!cached) return;

        this.didAutoRestoreSession = true;
        this.sessionId = activeId;
        void this.loadSession(cached);
    }

    navigateToDomain(route: string) {
        if (route) {
            this.layoutService.setSidebarState(false);
            this.router.navigate([route]);
        }
    }

    navigateToNpaDraft(cardData: any) {
        const payload = {
            ...(cardData.draftPayload || {}),
            npaId: cardData.npaId,
            title: cardData.title,
            stage: cardData.stage,
            sessionId: cardData.sessionId,
            conversationId: cardData.conversationId
        };
        this.onComplete.emit(payload);
    }

    // ─── NPA Record Creation ────────────────────────────────────

    private createNpaFromDraft(payload?: any) {
        if (!payload) return;
        const d = payload.data || {};
        const title = payload.product_name || payload.title || d.product_name || d.title || d.name || 'Untitled NPA';
        const description = payload.product_description || payload.description || d.product_description || d.description || `${payload.product_type || d.product_type || ''} — ${payload.target_market || d.target_market || ''}`.trim();

        // Send ALL Ideation payload fields to POST /api/npas so npa_projects columns are populated
        const createPayload: any = {
            title, description,
            npa_type: payload.product_type || payload.npa_type || d.product_type || d.npa_type || 'STRUCTURED_PRODUCT',
            risk_level: payload.risk_level || d.risk_level || undefined,
            notional_amount: payload.notional_size || payload.notional_amount || d.notional_size || d.notional_amount || undefined,
            currency: payload.currency || d.currency || undefined,
            is_cross_border: payload.is_cross_border ?? d.is_cross_border ?? undefined,
            product_category: payload.asset_class || payload.product_category || d.asset_class || d.product_category || undefined,
            jurisdictions: payload.jurisdictions || d.jurisdictions || undefined,
            mandatory_signoffs: payload.mandatorySignOffs || payload.mandatory_signoffs || d.mandatorySignOffs || d.mandatory_signoffs || undefined,
        };
        // Remove undefined values so they don't get sent as "undefined" strings
        Object.keys(createPayload).forEach(k => createPayload[k] === undefined && delete createPayload[k]);

        this.npaService.create(createPayload).subscribe({
            next: (res) => {
                const isNpaContext = this.config.context === 'NPA_AGENT';
                // Re-run classification now that we have a real project_id so the workflow can persist results.
                this.triggerClassifier(payload, res.id);

                // Extract all data from payload to populate initial Product Attributes
                const excludeKeys = ['data', 'target_agent', 'uiRoute', 'projectId', 'intent', 'project_id', 'npaId', 'id', 'title', 'description', 'npa_type'];
                const formData: any[] = [];
                const sourceData = { ...(payload.data || {}), ...payload };

                for (const [key, value] of Object.entries(sourceData)) {
                    if (excludeKeys.includes(key) || value === null || value === undefined || value === '') continue;
                    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                        formData.push({
                            field_key: key,
                            field_value: String(value),
                            lineage: 'AUTO'
                        });
                    } else if (Array.isArray(value)) {
                        formData.push({
                            field_key: key,
                            field_value: value.join(', '),
                            lineage: 'AUTO'
                        });
                    }
                }

                // Ensure minimum fields are present
                if (!formData.find(f => f.field_key === 'risk_level')) {
                    formData.push({ field_key: 'risk_level', field_value: payload.risk_level || d.risk_level || 'MEDIUM', lineage: 'AUTO' });
                }
                if (!formData.find(f => f.field_key === 'is_cross_border')) {
                    formData.push({ field_key: 'is_cross_border', field_value: (payload.is_cross_border || d.is_cross_border) ? 'true' : 'false', lineage: 'AUTO' });
                }

                this.npaService.update(res.id, { formData }).subscribe({
                    error: (err) => console.warn('[AgentWorkspace] Failed to persist initial formData', err)
                });
                this.messages.push({
                    role: 'agent',
                    content: isNpaContext
                        ? `NPA Draft **${res.id}** created successfully! Click below to open the NPA Lifecycle view where you can review the proposal, track approvals, and continue chatting with the agent.`
                        : `NPA record **${res.id}** created successfully and is now in the **INITIATION** stage.`,
                    timestamp: new Date(), agentIdentity: this.AGENTS['NPA_ORCHESTRATOR'],
                    cardType: isNpaContext ? 'NPA_DRAFT_CTA' : 'NPA_CREATED',
                    cardData: {
                        npaId: res.id, title, stage: 'INITIATION', status: 'On Track',
                        draftPayload: this.pendingDraftPayload,
                        sessionId: this.chatSessionService.activeSessionId(),
                        conversationId: this.difyService.getConversationId()
                    }
                });
                this.sessionDirty = true;
                this.autoSaveSession();
            },
            error: (err) => {
                console.error('[NPA] Creation failed:', err);
                this.messages.push({
                    role: 'agent', content: 'NPA record creation failed — the draft data has been captured and you can create it manually from the NPA Dashboard.',
                    timestamp: new Date(), agentIdentity: this.AGENTS['NPA_ORCHESTRATOR'], agentAction: 'SHOW_ERROR'
                });
                this.sessionDirty = true;
                this.autoSaveSession();
            }
        });
    }

    // ─── CLASSIFIER Workflow ────────────────────────────────────

    private triggerClassifier(payload?: any, projectIdOverride?: string) {
        const d = payload?.data || {};
        const classifierInputs: Record<string, string> = {
            product_name: payload?.product_name || payload?.title || d.product_name || d.title || d.name || 'Untitled Product',
            product_description: payload?.product_description || payload?.description || d.product_description || d.description || '',
            product_type: payload?.product_type || d.product_type || '', asset_class: payload?.asset_class || d.asset_class || '',
            target_market: payload?.target_market || d.target_market || '', distribution_channel: payload?.distribution_channel || d.distribution_channel || '',
            risk_features: payload?.risk_features || d.risk_features || '', jurisdictions: (payload?.jurisdictions || d.jurisdictions || []).join?.(', ') || '',
            notional_size: payload?.notional_size || payload?.notional || d.notional_size || d.notional || '', regulatory_framework: payload?.regulatory_framework || d.regulatory_framework || ''
        };
        const projectId =
            projectIdOverride
            || payload?.project_id
            || payload?.projectId
            || payload?.npaId
            || payload?.id
            || d.project_id
            || d.projectId
            || '';
        if (projectId) classifierInputs['project_id'] = String(projectId);

        this.difyService.runWorkflow('CLASSIFIER', classifierInputs).subscribe({
            next: (res) => {
                if (res.data.status === 'succeeded') {
                    const classificationData = this.parseClassifierResponse(res.data.outputs);
                    classificationData.workflowRunId = res.workflow_run_id;
                    classificationData.taskId = res.task_id;
                    if (classificationData.prohibitedMatch?.matched) {
                        this.showGenerateButton = false;
                        this.messages.push({ role: 'agent', content: '**HARD STOP** — This product has been classified as **Prohibited**. NPA creation is blocked.', timestamp: new Date(), agentIdentity: this.AGENTS['CLASSIFIER'], cardType: 'HARD_STOP', cardData: classificationData });
                    } else {
                        this.messages.push({ role: 'agent', content: 'Classification analysis complete.', timestamp: new Date(), agentIdentity: this.AGENTS['CLASSIFIER'], cardType: 'CLASSIFICATION', cardData: classificationData });
                    }
                    this.sessionDirty = true;
                    this.autoSaveSession();
                }
            },
            error: (err) => {
                console.error('[CLASSIFIER] Workflow failed:', err);
                this.messages.push({ role: 'agent', content: 'Classification workflow encountered an error. You can still proceed with the NPA draft manually.', timestamp: new Date(), agentIdentity: this.AGENTS['CLASSIFIER'], agentAction: 'SHOW_ERROR' });
                this.sessionDirty = true;
                this.autoSaveSession();
            }
        });
    }

    private parseClassifierResponse(outputs: any): ClassificationResult {
        if (Array.isArray(outputs?.result)) {
            return this.mapClassificationFromTrace(outputs.result);
        }

        let rawResult = outputs?.result || '';
        const jsonMatch = typeof rawResult === 'string' ? rawResult.match(/```json\s*([\s\S]*?)\s*```/) : null;
        if (jsonMatch) rawResult = jsonMatch[1];

        let parsed: any;
        try { parsed = JSON.parse(rawResult); } catch {
            return {
                type: 'NTG',
                track: 'Full NPA',
                scores: [],
                overallConfidence: 0,
                mandatorySignOffs: [],
                analysisSummary: [
                    'Classifier returned unstructured (non-JSON) output. Update the Dify workflow to return JSON-only to enable structured scoring.',
                ],
                rawOutput: rawResult
            };
        }

        const trackMap: Record<string, string> = { 'FULL_NPA': 'Full NPA', 'NPA_LITE': 'NPA Lite', 'EVERGREEN': 'Evergreen', 'PROHIBITED': 'Prohibited', 'VARIATION': 'NPA Lite' };
        const typeMap: Record<string, string> = { 'FULL_NPA': 'NTG', 'NPA_LITE': 'Variation', 'EVERGREEN': 'Existing', 'PROHIBITED': 'NTG', 'VARIATION': 'Variation' };

        const sc = parsed.scorecard || parsed.score_card || {};
        const ntgScore = sc.ntg_total_score || 0;
        const ntgMax = sc.ntg_max_score || 30;

        const scores: ClassificationScore[] = [];
        const categories = [
            { key: 'product_innovation', name: 'Product Innovation', max: 15 },
            { key: 'market_customer', name: 'Market & Customer', max: 8 },
            { key: 'risk_regulatory', name: 'Risk & Regulatory', max: 7 },
            { key: 'financial_operational', name: 'Financial & Operational', max: 0 }
        ];
        for (const cat of categories) {
            const catData = sc[cat.key];
            if (catData) {
                scores.push({
                    criterion: cat.name, score: catData.subtotal || 0, maxScore: catData.max_subtotal || cat.max,
                    reasoning: Object.entries(catData).filter(([k]) => !['subtotal', 'max_subtotal'].includes(k)).map(([k, v]: [string, any]) => `${k}: ${v.score}/${v.max}`).join(', ')
                });
            }
        }
        const overallConfidence = ntgMax > 0 ? Math.round((1 - Math.abs(ntgScore - ntgMax / 2) / (ntgMax / 2)) * 100) : 80;

        const analysisSummary: string[] = [];
        const summary = parsed.analysis_summary || parsed.summary || {};
        if (summary?.prohibited_check) analysisSummary.push(`Prohibited check: ${summary.prohibited_check}`);
        if (summary?.cross_border !== undefined) analysisSummary.push(`Cross-border: ${summary.cross_border ? 'YES' : 'NO'}`);
        if (summary?.similar_npas) analysisSummary.push(`Similar NPAs: ${summary.similar_npas}`);
        if (summary?.product) analysisSummary.push(`Product: ${summary.product}`);

        const ntgTriggers: { id: string; name: string; fired: boolean; reason?: string }[] = [];
        const triggers = parsed.ntg_triggers || parsed.ntg_trigger_check || [];
        if (Array.isArray(triggers)) {
            for (const t of triggers) {
                if (!t) continue;
                ntgTriggers.push({
                    id: String(t.id || t.trigger_id || ''),
                    name: String(t.name || t.trigger || ''),
                    fired: !!(t.fired ?? t.applies ?? t.is_true),
                    reason: t.reason ? String(t.reason) : undefined
                });
            }
        }

        return {
            type: (typeMap[parsed.classification_type] || 'NTG') as any,
            track: (trackMap[parsed.classification_type] || 'Full NPA') as any,
            scores, overallConfidence: Math.max(overallConfidence, 60),
            ...(analysisSummary.length ? { analysisSummary } : {}),
            ...(ntgTriggers.length ? { ntgTriggers } : {}),
            rawOutput: outputs?.result || rawResult,
            rawJson: parsed,
            prohibitedMatch: parsed.prohibited_check ? {
                matched: parsed.prohibited_check.is_prohibited || false,
                item: (parsed.prohibited_check.matched_items || [])[0] || undefined,
                layer: parsed.prohibited_check.is_prohibited ? 'REGULATORY' : undefined
            } : undefined,
            mandatorySignOffs: parsed.mandatory_signoffs || []
        };
    }

    private mapClassificationFromTrace(trace: any[]): ClassificationResult {
        const toolErrors: string[] = [];
        const thoughts: string[] = [];

        for (const entry of trace) {
            const d = entry?.data || {};
            const observation = typeof d.observation === 'string' ? d.observation : '';
            const thought = typeof d.thought === 'string' ? d.thought : '';
            const toolName = d.tool_name || d.action_name || d.action;

            if (observation && observation.toLowerCase().includes('tool invoke error')) {
                toolErrors.push(`${toolName || 'tool'}: ${observation.split('\n')[0]}`);
            }
            if (thought) thoughts.push(thought.trim());
        }

        const rawText = thoughts.length ? thoughts[thoughts.length - 1] : JSON.stringify(trace, null, 2);

        const type =
            /classification:\s*(new-to-group|ntg)/i.test(rawText) ? 'NTG'
                : /classification:\s*existing/i.test(rawText) ? 'Existing'
                    : /classification:\s*variation/i.test(rawText) ? 'Variation'
                        : 'Variation';

        const track =
            /track:\s*full[_\s-]*npa/i.test(rawText) || /track:\s*full npa/i.test(rawText) ? 'Full NPA'
                : /track:\s*npa[_\s-]*lite/i.test(rawText) ? 'NPA Lite'
                    : /track:\s*bundling/i.test(rawText) ? 'Bundling'
                        : /track:\s*evergreen/i.test(rawText) ? 'Evergreen'
                            : /track:\s*prohibited/i.test(rawText) ? 'Prohibited'
                                : 'NPA Lite';

        const confidenceMatch = rawText.match(/confidence:\s*(\d+)\s*%/i);
        const overallConfidence = confidenceMatch ? Number(confidenceMatch[1]) : 0;

        // Extract category subtotals for a clean score bar view when no JSON scorecard is available.
        const scores: any[] = [];
        const catPatterns: { key: string; label: string; max: number }[] = [
            { key: 'PRODUCT_INNOVATION', label: 'Product Innovation', max: 8 },
            { key: 'MARKET_CUSTOMER', label: 'Market & Customer', max: 10 },
            { key: 'RISK_REGULATORY', label: 'Risk & Regulatory', max: 8 },
            { key: 'FINANCIAL_OPERATIONAL', label: 'Financial & Operational', max: 7 }
        ];
        for (const c of catPatterns) {
            const m = rawText.match(new RegExp(`${c.key}[\\s\\S]*?Subtotal:\\s*(\\d+)\\s*/\\s*(\\d+)`, 'i'));
            if (m) {
                scores.push({
                    criterion: c.label,
                    score: Number(m[1]),
                    maxScore: Number(m[2]) || c.max,
                    reasoning: `${c.key} subtotal from narrative output`
                });
            }
        }

        const analysisSummary: string[] = [];
        if (toolErrors.length) {
            analysisSummary.push(`Tool errors detected (${toolErrors.length}). Workflow likely returned trace/narrative output instead of JSON.`);
            analysisSummary.push(...toolErrors.slice(0, 5));
            if (toolErrors.length > 5) analysisSummary.push(`...and ${toolErrors.length - 5} more tool errors`);
        }

        return {
            type: type as any,
            track: track as any,
            scores,
            overallConfidence,
            ...(analysisSummary.length ? { analysisSummary } : {}),
            rawOutput: JSON.stringify(trace, null, 2),
            traceSteps: trace,
            mandatorySignOffs: []
        } as ClassificationResult;
    }

    // ─── Template Logic ─────────────────────────────────────────

    getCategoryName(id: string): string {
        return this.filteredCategories.find(c => c.id === id)?.name || 'Templates';
    }

    getTemplatesByCategory(catId: string): WorkspaceTemplate[] {
        let templates = this.filteredTemplates.filter(t => t.category === catId);
        if (this.templateSearchQuery.trim()) {
            const q = this.templateSearchQuery.toLowerCase();
            templates = templates.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
        }
        return templates;
    }

    handleTemplateClick(t: WorkspaceTemplate) {
        if (this.config.showTemplateForm && t.inputs && t.inputs.length > 0) {
            // Form-based mode: open slide-over panel
            this.activeTemplate = t;
            this.templateFormValues = t.inputs.map(() => '');
        } else {
            // Direct prompt mode: execute immediately
            this.chatTab = 'CHAT';
            this.processMessage(t.prompt);
        }
    }

    submitTemplateForm() {
        if (!this.activeTemplate) return;
        const templateTitle = this.activeTemplate.title;
        const inputs = this.activeTemplate.inputs || [];
        const filledInputs = inputs.map((inp, i) => `${inp.label}: ${this.templateFormValues[i] || '[Not specified]'}`).join('\n');
        const message = `Task: ${templateTitle}\n\n${filledInputs}`;

        this.activeTemplate = null;
        this.templateFormValues = [];
        this.chatTab = 'CHAT';
        this.processMessage(message);
    }

    // ─── Agent Activity ─────────────────────────────────────────

    getActiveAgentsList(): { id: string; name: string; icon: string; status: string }[] {
        return Array.from(this.activeAgents.entries())
            .filter(([_, status]) => status !== 'idle')
            .map(([id, status]) => {
                const agent = this.AGENTS[id];
                return { id, name: agent?.name || id, icon: agent?.icon || 'bot', status };
            });
    }

    getAvatarClasses(identity?: AgentIdentity): string {
        if (!identity) return 'bg-violet-50 border border-violet-200 text-violet-600';
        const parts = identity.color.split(' ');
        return `${parts[0] || 'bg-violet-50'} border border-slate-200 ${parts[1] || 'text-violet-600'}`;
    }

    getAgentLabelClass(identity?: AgentIdentity): string {
        if (!identity) return 'text-violet-600';
        return identity.color.split(' ')[1] || 'text-violet-600';
    }

    copyMessage(content: string) {
        navigator.clipboard.writeText(content).then(() => {
            this.copiedMessageId = Date.now();
            setTimeout(() => this.copiedMessageId = null, 2000);
        });
    }

    private scrollToBottom(): void {
        try {
            if (this.scrollContainer) {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            }
        } catch (err) { }
    }
}
