import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AoFormProgressComponent } from './dce-ao-form-progress.component';
import {
    AoFormSectionDef, AoFormData, AoFormFieldValue,
    AoFormProgress, AoSourceAgent,
} from './dce-ao-form.interfaces';
import { getVisibleSections } from './dce-ao-form.config';
import { buildAoFormData } from './dce-ao-form-mock';
import {
    DceCaseState, DceClassification, DceSignatureVerification,
    DceKycBrief, DceCreditResponse, DceConfigResponse,
} from '../../../services/dce.service';

@Component({
    selector: 'app-dce-ao-form',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule, AoFormProgressComponent],
    template: `
    <div class="flex h-full bg-white">
        <!-- ═══ LEFT SIDEBAR: Section Navigation ═══ -->
        <div class="w-72 flex-none border-r border-slate-200 bg-slate-50/50 flex flex-col overflow-hidden">
            <!-- Overall progress -->
            <div class="p-4 border-b border-slate-200">
                <div class="flex items-center gap-3 mb-3">
                    <app-ao-form-progress [percent]="overallProgress.percent" [size]="52"></app-ao-form-progress>
                    <div>
                        <div class="text-sm font-semibold text-slate-800">AO Form Completion</div>
                        <div class="text-xs text-slate-500">
                            {{ overallProgress.filled }}/{{ overallProgress.total }} fields filled
                        </div>
                    </div>
                </div>

                <!-- Agent legend -->
                <div class="flex flex-wrap gap-1.5 mt-2">
                    <span *ngFor="let agent of activeAgents"
                        [ngClass]="getAgentBadgeClass(agent)"
                        class="text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {{ agent }}
                    </span>
                </div>
            </div>

            <!-- Section list -->
            <div class="flex-1 overflow-y-auto p-2">
                <button *ngFor="let section of visibleSections; let i = index"
                    (click)="scrollToSection(section.id)"
                    [ngClass]="{ 'bg-white shadow-sm border-sky-200 ring-1 ring-sky-100': activeSectionId === section.id,
                                 'hover:bg-white/80': activeSectionId !== section.id }"
                    class="w-full text-left p-2.5 rounded-lg mb-1 transition-all group border border-transparent">
                    <div class="flex items-center gap-2.5">
                        <app-ao-form-progress
                            [percent]="getSectionProgress(section.id).percent"
                            [size]="28" [showLabel]="false">
                        </app-ao-form-progress>
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-medium text-slate-700 truncate">{{ section.title }}</div>
                            <div class="text-[10px] text-slate-400 mt-0.5">
                                {{ getSectionProgress(section.id).filled }}/{{ getSectionProgress(section.id).total }}
                                <span class="ml-1">
                                    <span *ngFor="let a of section.sourceAgents"
                                        [ngClass]="getAgentDotClass(a)"
                                        class="inline-block w-1.5 h-1.5 rounded-full ml-0.5">
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <!-- ═══ CENTER: Scrollable Form Content ═══ -->
        <div class="flex-1 overflow-y-auto" #formContent>
            <!-- Sections -->
            <div class="p-6 space-y-4">
                <div *ngFor="let section of visibleSections"
                    [id]="'ao-section-' + section.id"
                    class="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">

                    <!-- Section Header -->
                    <button (click)="toggleSection(section.id)"
                        class="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/80 transition-colors">
                        <lucide-icon [name]="section.icon" class="w-4 h-4 text-slate-400 flex-none"></lucide-icon>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm font-semibold text-slate-800">{{ section.title }}</div>
                            <div *ngIf="section.subtitle" class="text-[11px] text-slate-400 mt-0.5">{{ section.subtitle }}</div>
                        </div>

                        <!-- Agent pills -->
                        <div class="flex items-center gap-1 mr-2">
                            <span *ngFor="let a of section.sourceAgents"
                                [ngClass]="getAgentBadgeClass(a)"
                                class="text-[10px] px-1.5 py-0.5 rounded font-medium">
                                {{ a }}
                            </span>
                        </div>

                        <!-- Progress -->
                        <span class="text-[11px] text-slate-400 font-mono w-12 text-right">
                            {{ getSectionProgress(section.id).filled }}/{{ getSectionProgress(section.id).total }}
                        </span>

                        <!-- Chevron -->
                        <lucide-icon
                            [name]="isSectionExpanded(section.id) ? 'chevron-up' : 'chevron-down'"
                            class="w-4 h-4 text-slate-300 flex-none">
                        </lucide-icon>
                    </button>

                    <!-- Section Content -->
                    <div *ngIf="isSectionExpanded(section.id)"
                        class="px-5 pb-4 pt-2 border-t border-slate-100">
                        <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                            <ng-container *ngFor="let field of section.fields">
                                <div [ngClass]="{ 'col-span-2': field.gridSpan === 2 }">
                                    <!-- Label row -->
                                    <div class="flex items-center gap-1.5 mb-1">
                                        <label class="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                                            {{ field.label }}
                                        </label>
                                        <span *ngIf="field.required"
                                            class="text-[9px] text-red-400">*</span>
                                    </div>

                                    <!-- Value row -->
                                    <div class="flex items-start gap-2">
                                        <!-- Filled value -->
                                        <ng-container *ngIf="getFieldValue(field.key) as fv">
                                            <ng-container [ngSwitch]="fv.fillStatus">
                                                <!-- FILLED -->
                                                <ng-container *ngSwitchCase="'FILLED'">
                                                    <!-- Checkbox -->
                                                    <ng-container *ngIf="field.type === 'checkbox'; else textValue">
                                                        <div class="flex items-center gap-1.5">
                                                            <div [ngClass]="fv.value ? 'bg-emerald-500' : 'bg-slate-300'"
                                                                class="w-4 h-4 rounded flex items-center justify-center">
                                                                <lucide-icon *ngIf="fv.value" name="check"
                                                                    class="w-3 h-3 text-white"></lucide-icon>
                                                            </div>
                                                            <span class="text-sm text-slate-700">{{ fv.value ? 'Yes' : 'No' }}</span>
                                                        </div>
                                                    </ng-container>
                                                    <ng-template #textValue>
                                                        <span class="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{{ fv.value }}</span>
                                                    </ng-template>
                                                </ng-container>

                                                <!-- PENDING -->
                                                <span *ngSwitchCase="'PENDING'"
                                                    class="text-sm text-slate-400 italic flex items-center gap-1.5">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    Pending
                                                </span>

                                                <!-- REQUIRES_ACTION -->
                                                <span *ngSwitchCase="'REQUIRES_ACTION'"
                                                    class="text-sm text-amber-600 italic flex items-center gap-1.5">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                    Requires Action
                                                </span>

                                                <!-- NOT_APPLICABLE -->
                                                <span *ngSwitchDefault
                                                    class="text-sm text-slate-300 italic">N/A</span>
                                            </ng-container>

                                            <!-- Source badge -->
                                            <span *ngIf="fv.filledBy"
                                                [ngClass]="getAgentBadgeClass(fv.filledBy)"
                                                class="text-[9px] px-1.5 py-0.5 rounded font-medium flex-none mt-0.5">
                                                {{ fv.filledBy }}
                                            </span>

                                            <!-- Confidence -->
                                            <span *ngIf="fv.confidence && fv.fillStatus === 'FILLED'"
                                                class="text-[9px] text-slate-400 flex-none mt-0.5"
                                                [title]="'AI confidence: ' + fv.confidence + '%'">
                                                {{ fv.confidence }}%
                                            </span>
                                        </ng-container>
                                    </div>
                                </div>
                            </ng-container>
                        </div>
                    </div>
                </div>

                <!-- Empty state if no sections -->
                <div *ngIf="visibleSections.length === 0"
                    class="text-center py-16 text-slate-400">
                    <lucide-icon name="file-x" class="w-10 h-10 mx-auto mb-3 text-slate-300"></lucide-icon>
                    <p class="text-sm">No form sections available</p>
                </div>
            </div>
        </div>

        <!-- ═══ RIGHT COLUMN: Assistant Panel (collapsible) ═══ -->
        <div class="flex-none bg-white border-l border-slate-200 flex flex-col overflow-hidden transition-[width] duration-200"
             [class.w-96]="!rightPanelCollapsed"
             [class.w-12]="rightPanelCollapsed">

            <!-- Panel Header -->
            <div class="flex-none flex items-center justify-between px-2 py-2 border-b border-slate-200 bg-slate-50/50">
                <button (click)="rightPanelCollapsed = !rightPanelCollapsed"
                    class="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    [title]="rightPanelCollapsed ? 'Expand panel' : 'Collapse panel'">
                    <lucide-icon name="menu" class="w-4 h-4"></lucide-icon>
                </button>
                <div *ngIf="!rightPanelCollapsed" class="text-[11px] font-bold text-slate-700">Assistant Panel</div>
                <div *ngIf="!rightPanelCollapsed" class="w-8"></div>
            </div>

            <!-- Tabbed Header -->
            <div *ngIf="!rightPanelCollapsed" class="flex-none flex items-center p-1.5 bg-slate-50 border-b border-slate-200">
                <button (click)="rightPanelTab = 'CHAT'"
                    class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors"
                    [ngClass]="rightPanelTab === 'CHAT'
                        ? 'bg-white shadow-sm text-slate-800'
                        : 'text-slate-400 hover:text-slate-600'">
                    <lucide-icon name="message-square" class="w-3.5 h-3.5"></lucide-icon>
                    Chat
                </button>
                <button (click)="rightPanelTab = 'SOURCES'"
                    class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors"
                    [ngClass]="rightPanelTab === 'SOURCES'
                        ? 'bg-white shadow-sm text-blue-700 border border-blue-100'
                        : 'text-slate-400 hover:text-slate-600'">
                    <lucide-icon name="book-open" class="w-3.5 h-3.5"></lucide-icon>
                    Sources
                </button>
                <button (click)="rightPanelTab = 'ISSUES'"
                    class="flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors"
                    [ngClass]="rightPanelTab === 'ISSUES'
                        ? 'bg-white shadow-sm text-rose-700 border border-rose-100'
                        : 'text-slate-400 hover:text-slate-600'">
                    <lucide-icon name="alert-circle" class="w-3.5 h-3.5"></lucide-icon>
                    Issues
                    <span *ngIf="pendingFieldCount > 0"
                        class="ml-1 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        {{ pendingFieldCount }}
                    </span>
                </button>
            </div>

            <!-- TAB: Chat with DCE Agents -->
            <div *ngIf="!rightPanelCollapsed && rightPanelTab === 'CHAT'" class="flex-1 flex flex-col min-h-0">
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <!-- Agent Selector -->
                    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Select Agent</div>
                    <div class="flex flex-wrap gap-1.5 mb-4">
                        <button *ngFor="let agent of dceAgentList"
                            (click)="selectedChatAgent = agent.id"
                            class="text-[10px] px-2 py-1 rounded-md font-semibold transition-all border"
                            [ngClass]="selectedChatAgent === agent.id
                                ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
                            {{ agent.label }}
                        </button>
                    </div>

                    <!-- Chat Messages -->
                    <div *ngFor="let msg of agentChatMessages" class="flex gap-2" [ngClass]="{ 'flex-row-reverse': msg.role === 'user' }">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-none"
                             [ngClass]="msg.role === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-sky-100 text-sky-700'">
                            {{ msg.role === 'user' ? 'U' : 'A' }}
                        </div>
                        <div class="rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%]"
                             [ngClass]="msg.role === 'user' ? 'bg-indigo-50 text-indigo-900' : 'bg-slate-50 text-slate-800 border border-slate-200'">
                            {{ msg.content }}
                        </div>
                    </div>

                    <!-- Empty state -->
                    <div *ngIf="agentChatMessages.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
                        <div class="w-10 h-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center mb-3">
                            <lucide-icon name="message-square" class="w-5 h-5 text-sky-300"></lucide-icon>
                        </div>
                        <h4 class="text-[11px] font-bold text-slate-700 mb-1">Chat with DCE Agents</h4>
                        <p class="text-[10px] text-slate-400 max-w-[200px]">Ask agents about field values, request re-assessment, or get help filling pending fields.</p>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="flex-none p-3 border-t border-slate-200 bg-white">
                    <div class="flex items-center gap-2">
                        <input type="text" [(ngModel)]="chatInput"
                            (keydown.enter)="sendChatMessage()"
                            placeholder="Ask an agent..."
                            class="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100">
                        <button (click)="sendChatMessage()" [disabled]="!chatInput.trim()"
                            class="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-30 transition-colors">
                            <lucide-icon name="send" class="w-3.5 h-3.5"></lucide-icon>
                        </button>
                    </div>
                </div>
            </div>

            <!-- TAB: Source Mapping -->
            <div *ngIf="!rightPanelCollapsed && rightPanelTab === 'SOURCES'" class="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-3">
                <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Field Source Mapping</div>

                <div *ngFor="let entry of sourceMappingEntries"
                    class="p-3 rounded-lg border border-slate-200 bg-white">
                    <div class="flex items-center justify-between gap-2 mb-1.5">
                        <span class="text-[11px] font-bold text-slate-800 truncate">{{ entry.label }}</span>
                        <span [ngClass]="getAgentBadgeClass(entry.agent)"
                            class="text-[9px] px-1.5 py-0.5 rounded font-medium flex-none">
                            {{ entry.agent }}
                        </span>
                    </div>
                    <div *ngIf="entry.source" class="text-[10px] text-slate-500 leading-relaxed">
                        <span class="font-semibold text-slate-600">Source:</span> {{ entry.source }}
                    </div>
                    <div *ngIf="entry.confidence" class="mt-1 flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all"
                                [ngClass]="entry.confidence > 90 ? 'bg-emerald-400' : entry.confidence > 70 ? 'bg-amber-400' : 'bg-rose-400'"
                                [style.width.%]="entry.confidence"></div>
                        </div>
                        <span class="text-[9px] font-mono text-slate-400">{{ entry.confidence }}%</span>
                    </div>
                </div>

                <!-- Empty state -->
                <div *ngIf="sourceMappingEntries.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
                    <div class="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center mb-3">
                        <lucide-icon name="book-open" class="w-5 h-5 text-blue-300"></lucide-icon>
                    </div>
                    <h4 class="text-[11px] font-bold text-slate-700 mb-1">Source Mapping</h4>
                    <p class="text-[10px] text-slate-400 max-w-[200px]">Shows where each field value came from — agent, document, or manual entry.</p>
                </div>
            </div>

            <!-- TAB: Issues -->
            <div *ngIf="!rightPanelCollapsed && rightPanelTab === 'ISSUES'" class="flex-1 flex flex-col min-h-0 bg-white">
                <div class="px-4 py-3 border-b border-slate-200 bg-slate-50/50">
                    <div class="text-xs font-bold text-slate-800">Issues & Pending Fields</div>
                    <div class="mt-1 text-[11px] text-slate-500">Fields pending agent processing or requiring manual action.</div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <!-- Summary cards -->
                    <div class="grid grid-cols-2 gap-2">
                        <div class="p-3 rounded-lg border border-slate-200 bg-white">
                            <div class="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pending</div>
                            <div class="text-xl font-bold text-amber-600 mt-1">{{ pendingFieldCount }}</div>
                        </div>
                        <div class="p-3 rounded-lg border border-slate-200 bg-white">
                            <div class="text-[10px] uppercase tracking-wider font-bold text-slate-400">Requires Action</div>
                            <div class="text-xl font-bold text-rose-600 mt-1">{{ actionRequiredCount }}</div>
                        </div>
                    </div>

                    <div *ngIf="pendingFieldCount === 0 && actionRequiredCount === 0"
                        class="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        All fields complete — no outstanding issues.
                    </div>

                    <!-- Issue list -->
                    <ng-container *ngFor="let section of visibleSections">
                        <ng-container *ngFor="let field of section.fields">
                            <div *ngIf="getFieldValue(field.key)?.fillStatus === 'PENDING' || getFieldValue(field.key)?.fillStatus === 'REQUIRES_ACTION'"
                                class="p-3 rounded-lg border"
                                [ngClass]="getFieldValue(field.key)?.fillStatus === 'REQUIRES_ACTION'
                                    ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'">
                                <div class="flex items-center justify-between gap-2">
                                    <div class="min-w-0">
                                        <div class="text-[11px] font-bold truncate"
                                            [ngClass]="getFieldValue(field.key)?.fillStatus === 'REQUIRES_ACTION'
                                                ? 'text-rose-800' : 'text-amber-800'">
                                            {{ field.label }}
                                        </div>
                                        <div class="text-[10px] font-mono"
                                            [ngClass]="getFieldValue(field.key)?.fillStatus === 'REQUIRES_ACTION'
                                                ? 'text-rose-600' : 'text-amber-600'">
                                            {{ section.title }}
                                        </div>
                                    </div>
                                    <button (click)="scrollToSection(section.id)"
                                        class="px-3 py-1.5 rounded-lg bg-white border text-[11px] font-bold transition-colors"
                                        [ngClass]="getFieldValue(field.key)?.fillStatus === 'REQUIRES_ACTION'
                                            ? 'border-rose-200 text-rose-700 hover:bg-rose-100'
                                            : 'border-amber-200 text-amber-700 hover:bg-amber-100'">
                                        Jump
                                    </button>
                                </div>
                            </div>
                        </ng-container>
                    </ng-container>
                </div>
            </div>
        </div>
    </div>
    `,
})
export class DceAoFormComponent implements OnInit, OnChanges {
    @Input() caseData: DceCaseState | null = null;
    @Input() classification: DceClassification | null = null;
    @Input() kycBrief: DceKycBrief | null = null;
    @Input() signatureData: DceSignatureVerification | null = null;
    @Input() creditResponse: DceCreditResponse | null = null;
    @Input() configResponse: DceConfigResponse | null = null;

    visibleSections: AoFormSectionDef[] = [];
    formData: AoFormData | null = null;
    overallProgress: AoFormProgress = { filled: 0, total: 0, percent: 0 };
    sectionProgressMap = new Map<string, AoFormProgress>();
    activeSectionId = '';
    expandedSections = new Set<string>();
    activeAgents: AoSourceAgent[] = [];

    // Right panel state
    rightPanelCollapsed = false;
    rightPanelTab: 'CHAT' | 'SOURCES' | 'ISSUES' = 'CHAT';
    chatInput = '';
    selectedChatAgent = 'SA-1';
    agentChatMessages: { role: 'user' | 'agent'; content: string }[] = [];
    sourceMappingEntries: { label: string; agent: AoSourceAgent; source: string; confidence: number | null }[] = [];
    pendingFieldCount = 0;
    actionRequiredCount = 0;

    dceAgentList = [
        { id: 'SA-1', label: 'SA-1 Intake' },
        { id: 'SA-2', label: 'SA-2 Docs' },
        { id: 'SA-3', label: 'SA-3 Signature' },
        { id: 'SA-4', label: 'SA-4 KYC' },
        { id: 'SA-5', label: 'SA-5 Credit' },
        { id: 'SA-6', label: 'SA-6 Config' },
        { id: 'SA-7', label: 'SA-7 Notify' },
    ];

    ngOnInit() {
        this.rebuild();
    }

    ngOnChanges(_changes: SimpleChanges) {
        this.rebuild();
    }

    private rebuild() {
        // Determine visible sections
        const entityType = this.classification?.client_entity_type || null;
        const products = this.classification?.products_requested || null;
        this.visibleSections = getVisibleSections(entityType, products);

        // Build form data from SA outputs
        this.formData = buildAoFormData(
            this.classification,
            this.kycBrief,
            this.signatureData,
            this.creditResponse,
            this.configResponse,
        );

        // Compute progress
        this.computeProgress();

        // Collect active agents
        this.collectActiveAgents();

        // Auto-expand first section if none expanded
        if (this.expandedSections.size === 0 && this.visibleSections.length > 0) {
            this.expandedSections.add(this.visibleSections[0].id);
            this.activeSectionId = this.visibleSections[0].id;
        }
    }

    private computeProgress() {
        let totalFilled = 0;
        let totalFields = 0;

        for (const section of this.visibleSections) {
            let sectionFilled = 0;
            const sectionTotal = section.fields.length;

            for (const field of section.fields) {
                const fv = this.formData?.fields[field.key];
                if (fv?.fillStatus === 'FILLED') {
                    sectionFilled++;
                    totalFilled++;
                }
            }
            totalFields += sectionTotal;
            this.sectionProgressMap.set(section.id, {
                filled: sectionFilled,
                total: sectionTotal,
                percent: sectionTotal > 0 ? Math.round((sectionFilled / sectionTotal) * 100) : 0,
            });
        }

        this.overallProgress = {
            filled: totalFilled,
            total: totalFields,
            percent: totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0,
        };
    }

    private collectActiveAgents() {
        const agents = new Set<AoSourceAgent>();
        if (this.formData) {
            for (const fv of Object.values(this.formData.fields)) {
                if (fv.filledBy) agents.add(fv.filledBy);
            }
        }
        this.activeAgents = Array.from(agents).sort();

        // Build source mapping + issue counts
        this.buildSourceMapping();
        this.computeIssueCounts();
    }

    private buildSourceMapping() {
        this.sourceMappingEntries = [];
        for (const section of this.visibleSections) {
            for (const field of section.fields) {
                const fv = this.formData?.fields[field.key];
                if (fv?.filledBy && fv.fillStatus === 'FILLED') {
                    this.sourceMappingEntries.push({
                        label: field.label,
                        agent: fv.filledBy,
                        source: this.getSourceDescription(fv.filledBy, section.title),
                        confidence: fv.confidence || null,
                    });
                }
            }
        }
    }

    private computeIssueCounts() {
        this.pendingFieldCount = 0;
        this.actionRequiredCount = 0;
        for (const section of this.visibleSections) {
            for (const field of section.fields) {
                const fv = this.formData?.fields[field.key];
                if (fv?.fillStatus === 'PENDING') this.pendingFieldCount++;
                if (fv?.fillStatus === 'REQUIRES_ACTION') this.actionRequiredCount++;
            }
        }
    }

    private getSourceDescription(agent: AoSourceAgent, sectionTitle: string): string {
        const sources: Record<string, string> = {
            'SA-1': 'Intake & Triage classification output',
            'SA-2': 'Document Collection OCR extraction',
            'SA-3': 'Signature Verification mandate matching',
            'SA-4': 'KYC/CDD screening and assessment',
            'SA-5': 'Credit Risk underwriting model',
            'SA-6': 'Account Configuration rules engine',
            'SA-7': 'Notification & Welcome Kit generation',
            'MANUAL': 'Manual RM entry',
        };
        return sources[agent || ''] || 'Agent output';
    }

    sendChatMessage() {
        if (!this.chatInput.trim()) return;
        const userMsg = this.chatInput.trim();
        this.agentChatMessages.push({ role: 'user', content: userMsg });
        this.chatInput = '';

        // Simulate agent response
        setTimeout(() => {
            const agentLabel = this.dceAgentList.find(a => a.id === this.selectedChatAgent)?.label || this.selectedChatAgent;
            this.agentChatMessages.push({
                role: 'agent',
                content: `[${agentLabel}] I've reviewed the request. Based on the current case data, I can confirm the field values are derived from the latest assessment run. Let me know if you need me to re-process any specific section.`,
            });
        }, 800);
    }

    // ─── Template Helpers ────────────────────────────────────────────────

    getFieldValue(key: string): AoFormFieldValue | null {
        return this.formData?.fields[key] || null;
    }

    getSectionProgress(sectionId: string): AoFormProgress {
        return this.sectionProgressMap.get(sectionId) || { filled: 0, total: 0, percent: 0 };
    }

    toggleSection(sectionId: string) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
            this.activeSectionId = sectionId;
        }
    }

    isSectionExpanded(sectionId: string): boolean {
        return this.expandedSections.has(sectionId);
    }

    scrollToSection(sectionId: string) {
        this.activeSectionId = sectionId;
        if (!this.expandedSections.has(sectionId)) {
            this.expandedSections.add(sectionId);
        }
        const el = document.getElementById('ao-section-' + sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    getAgentBadgeClass(agent: AoSourceAgent): string {
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
        return map[agent || ''] || 'bg-slate-100 text-slate-500';
    }

    getAgentDotClass(agent: AoSourceAgent): string {
        const map: Record<string, string> = {
            'SA-1': 'bg-blue-400',
            'SA-2': 'bg-purple-400',
            'SA-3': 'bg-emerald-400',
            'SA-4': 'bg-amber-400',
            'SA-5': 'bg-rose-400',
            'SA-6': 'bg-cyan-400',
            'SA-7': 'bg-indigo-400',
            'MANUAL': 'bg-slate-400',
        };
        return map[agent || ''] || 'bg-slate-300';
    }

    formatTime(iso: string): string {
        return new Date(iso).toLocaleString('en-SG', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        });
    }
}
