import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
    DceService,
    DceCaseDetailResponse,
    DceCaseDocumentsResponse,
    DceCaseEventsResponse,
    DceCaseState,
    DceClassification,
    DceCheckpoint,
    DceRmHierarchy,
    DceCompletenessAssessment,
    DceChecklistItem,
    DceEvent,
    DceNotification,
} from '../../services/dce.service';
import { DceAgentInvokerComponent } from '../../components/dce/dce-agent-invoker.component';

@Component({
    selector: 'app-dce-case-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, DceAgentInvokerComponent],
    styles: [`
        .node-connector {
            position: relative;
        }
        .node-connector::after {
            content: '';
            position: absolute;
            top: 50%;
            right: -2rem;
            width: 2rem;
            height: 2px;
            background: #cbd5e1;
        }
        .node-connector:last-child::after {
            display: none;
        }
        .coverage-bar-fill {
            transition: width 0.6s ease-in-out;
        }
    `],
    template: `
    <!-- Loading state -->
    @if (loading) {
        <div class="flex items-center justify-center h-screen bg-slate-50">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-4 text-sm text-slate-500">Loading case details...</p>
            </div>
        </div>
    }

    <!-- Error state -->
    @if (error) {
        <div class="flex items-center justify-center h-screen bg-slate-50">
            <div class="bg-white rounded-xl shadow-sm border border-red-200 p-8 max-w-md text-center">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span class="text-red-600 text-xl font-bold">!</span>
                </div>
                <h2 class="text-lg font-semibold text-slate-900 mb-2">Failed to load case</h2>
                <p class="text-sm text-slate-500 mb-4">{{ error }}</p>
                <a routerLink="/dce" class="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Back to Dashboard
                </a>
            </div>
        </div>
    }

    <!-- Main content -->
    @if (!loading && !error && caseState) {
    <div class="min-h-screen bg-slate-50">

        <!-- ═══ HEADER ═══ -->
        <div class="bg-white border-b border-slate-200 shadow-sm">
            <div class="max-w-7xl mx-auto px-6 py-5">
                <!-- Back link -->
                <a routerLink="/dce" class="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    Back to Cases
                </a>

                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <!-- Left: Case identity -->
                    <div>
                        <div class="flex items-center gap-3 flex-wrap">
                            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ caseState.client_name }}</h1>
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                  [ngClass]="dceService.getStatusColor(caseState.status)">
                                {{ caseState.status }}
                            </span>
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                                  [ngClass]="dceService.getPriorityColor(caseState.priority)">
                                {{ caseState.priority }}
                            </span>
                            <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                                {{ dceService.getNodeLabel(caseState.current_node) }}
                            </span>
                            <span class="text-slate-300">|</span>
                            <button (click)="onRunAgent('DCE_SA1')"
                                    class="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 hover:bg-sky-100 transition-colors">
                                Run SA-1
                            </button>
                            <button (click)="onRunAgent('DCE_SA2')"
                                    class="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold border border-sky-200 hover:bg-sky-100 transition-colors">
                                Run SA-2
                            </button>
                        </div>
                        <div class="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span class="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{{ caseState.case_id }}</span>
                            <span>{{ caseState.case_type }}</span>
                            <span class="text-slate-300">|</span>
                            <span>{{ caseState.jurisdiction }}</span>
                            <span class="text-slate-300">|</span>
                            <span>Created {{ caseState.created_at | date:'medium' }}</span>
                        </div>
                    </div>

                    <!-- Right: RM info + SLA -->
                    <div class="flex flex-col items-end gap-2 text-sm shrink-0">
                        @if (rmHierarchy) {
                            <div class="text-right">
                                <div class="font-semibold text-slate-700">{{ rmHierarchy.rm_name }}</div>
                                <div class="text-slate-500 text-xs">{{ rmHierarchy.rm_email }}</div>
                                <div class="text-slate-400 text-xs">{{ rmHierarchy.rm_branch }} &middot; {{ rmHierarchy.rm_desk }}</div>
                            </div>
                        }
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-slate-500">SLA Deadline:</span>
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                                  [ngClass]="isSlaBreached() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                                {{ caseState.sla_deadline | date:'MMM d, y HH:mm' }}
                                {{ isSlaBreached() ? '(BREACHED)' : '' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══ TAB NAV ═══ -->
        <div class="bg-white border-b border-slate-200">
            <div class="max-w-7xl mx-auto px-6">
                <div class="flex gap-6">
                    @for (tab of tabs; track tab.key) {
                        <button (click)="activeTab = tab.key"
                                class="px-1 py-3 text-sm font-semibold border-b-2 transition-colors"
                                [class.border-blue-600]="activeTab === tab.key"
                                [class.text-blue-600]="activeTab === tab.key"
                                [class.border-transparent]="activeTab !== tab.key"
                                [class.text-slate-500]="activeTab !== tab.key"
                                [class.hover:text-slate-700]="activeTab !== tab.key">
                            {{ tab.label }}
                        </button>
                    }
                </div>
            </div>
        </div>

        <!-- ═══ TAB CONTENT ═══ -->
        <div class="max-w-7xl mx-auto px-6 py-6">

            <!-- ─── WORKFLOW PROGRESS TAB ─── -->
            @if (activeTab === 'workflow') {
            <div class="space-y-6">
                <!-- Node pipeline -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-6">Workflow Progress</h2>
                    <div class="flex items-center justify-center gap-0 overflow-x-auto pb-2">
                        @for (node of pipelineNodes; track node.id; let last = $last) {
                            <div class="flex items-center">
                                <div class="flex flex-col items-center min-w-[120px]">
                                    <!-- Node circle -->
                                    <div class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all"
                                         [ngClass]="{
                                            'bg-green-500 text-white border-green-500 shadow-md shadow-green-200': getNodeStatus(node.id) === 'completed',
                                            'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200 ring-4 ring-blue-100': getNodeStatus(node.id) === 'current',
                                            'bg-slate-100 text-slate-400 border-slate-200': getNodeStatus(node.id) === 'future'
                                         }">
                                        @if (getNodeStatus(node.id) === 'completed') {
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                        } @else {
                                            {{ node.id }}
                                        }
                                    </div>
                                    <!-- Node label -->
                                    <div class="mt-2 text-center">
                                        <div class="text-xs font-semibold"
                                             [ngClass]="{
                                                'text-green-700': getNodeStatus(node.id) === 'completed',
                                                'text-blue-700': getNodeStatus(node.id) === 'current',
                                                'text-slate-400': getNodeStatus(node.id) === 'future'
                                             }">
                                            {{ dceService.getNodeLabel(node.id) }}
                                        </div>
                                        @if (getCheckpointForNode(node.id); as cp) {
                                            <div class="text-[10px] text-slate-400 mt-1">
                                                {{ cp.duration_seconds }}s &middot; {{ cp.agent_model || 'n/a' }}
                                            </div>
                                        }
                                    </div>
                                </div>
                                <!-- Connector arrow -->
                                @if (!last) {
                                    <div class="flex items-center mx-1">
                                        <div class="w-8 h-0.5"
                                             [ngClass]="{
                                                'bg-green-400': getNodeStatus(node.id) === 'completed',
                                                'bg-slate-200': getNodeStatus(node.id) !== 'completed'
                                             }"></div>
                                        <svg class="w-3 h-3 -ml-1"
                                             [ngClass]="{
                                                'text-green-400': getNodeStatus(node.id) === 'completed',
                                                'text-slate-300': getNodeStatus(node.id) !== 'completed'
                                             }"
                                             fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd"/>
                                        </svg>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                </div>

                <!-- Checkpoint Details Table -->
                @if (checkpoints.length > 0) {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 class="text-base font-bold text-slate-900 mb-4">Checkpoint History</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-slate-200 text-left">
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Node</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Attempt</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Status</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Duration</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Model</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Next Node</th>
                                    <th class="pb-3 font-semibold text-slate-600">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (cp of checkpoints; track cp.checkpoint_id) {
                                <tr class="border-b border-slate-100 hover:bg-slate-50">
                                    <td class="py-3 pr-4 font-mono text-xs">{{ cp.node_id }}</td>
                                    <td class="py-3 pr-4">{{ cp.attempt_number }}</td>
                                    <td class="py-3 pr-4">
                                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                                              [ngClass]="{
                                                'bg-green-100 text-green-700': cp.status === 'COMPLETED' || cp.status === 'SUCCESS',
                                                'bg-red-100 text-red-700': cp.status === 'FAILED',
                                                'bg-yellow-100 text-yellow-700': cp.status === 'RUNNING'
                                              }">
                                            {{ cp.status }}
                                        </span>
                                    </td>
                                    <td class="py-3 pr-4">{{ cp.duration_seconds ? (cp.duration_seconds + 's') : '-' }}</td>
                                    <td class="py-3 pr-4 text-xs text-slate-500">{{ cp.agent_model || '-' }}</td>
                                    <td class="py-3 pr-4 font-mono text-xs">{{ cp.next_node || '-' }}</td>
                                    <td class="py-3 text-xs text-slate-500">{{ cp.completed_at | date:'short' }}</td>
                                </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                }
            </div>
            }

            <!-- ─── CLASSIFICATION TAB ─── -->
            @if (activeTab === 'classification') {
            <div class="space-y-6">
                @if (classification) {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-5">Classification Details</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Account Type -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Type</div>
                            <div class="text-sm font-semibold text-slate-900">{{ classification.account_type }}</div>
                        </div>
                        <!-- Confidence -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confidence Score</div>
                            <div class="flex items-center gap-2">
                                <div class="flex-1 bg-slate-100 rounded-full h-2.5 max-w-[120px]">
                                    <div class="h-2.5 rounded-full transition-all"
                                         [style.width.%]="(classification.account_type_confidence || 0) * 100"
                                         [ngClass]="{
                                            'bg-green-500': (classification.account_type_confidence || 0) >= 0.8,
                                            'bg-yellow-500': (classification.account_type_confidence || 0) >= 0.5 && (classification.account_type_confidence || 0) < 0.8,
                                            'bg-red-500': (classification.account_type_confidence || 0) < 0.5
                                         }"></div>
                                </div>
                                <span class="text-sm font-bold text-slate-700">{{ ((classification.account_type_confidence || 0) * 100).toFixed(1) }}%</span>
                            </div>
                        </div>
                        <!-- Entity Type -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Entity Type</div>
                            <div class="text-sm font-semibold text-slate-900">{{ classification.client_entity_type }}</div>
                        </div>
                        <!-- Jurisdiction -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Jurisdiction</div>
                            <div class="text-sm font-semibold text-slate-900">{{ classification.jurisdiction }}</div>
                        </div>
                        <!-- Products -->
                        <div class="md:col-span-2">
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Products Requested</div>
                            <div class="flex flex-wrap gap-1.5">
                                @for (product of classification.products_requested; track product) {
                                    <span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">{{ product }}</span>
                                }
                                @if (!classification.products_requested || classification.products_requested.length === 0) {
                                    <span class="text-sm text-slate-400">None specified</span>
                                }
                            </div>
                        </div>
                        <!-- Priority -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Priority</div>
                            <span class="px-2.5 py-1 rounded-full text-xs font-bold"
                                  [ngClass]="dceService.getPriorityColor(classification.priority)">
                                {{ classification.priority }}
                            </span>
                        </div>
                        <!-- Classifier Model -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Classifier Model</div>
                            <div class="text-sm text-slate-600 font-mono">{{ classification.classifier_model }}</div>
                        </div>
                        <!-- Flagged -->
                        <div>
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Flagged for Review</div>
                            <span class="px-2 py-0.5 rounded text-xs font-semibold"
                                  [ngClass]="classification.flagged_for_review ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'">
                                {{ classification.flagged_for_review ? 'Yes' : 'No' }}
                            </span>
                        </div>
                    </div>

                    <!-- Priority Reasoning -->
                    @if (classification.priority_reason) {
                    <div class="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Priority Reasoning</div>
                        <p class="text-sm text-slate-700 leading-relaxed">{{ classification.priority_reason }}</p>
                    </div>
                    }

                    <!-- Account Type Reasoning -->
                    @if (classification.account_type_reasoning) {
                    <div class="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Type Reasoning</div>
                        <p class="text-sm text-slate-700 leading-relaxed">{{ classification.account_type_reasoning }}</p>
                    </div>
                    }
                </div>
                } @else {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div class="text-slate-400 text-sm">No classification data available for this case.</div>
                </div>
                }
            </div>
            }

            <!-- ─── DOCUMENTS TAB ─── -->
            @if (activeTab === 'documents') {
            <div class="space-y-6">
                <!-- Document Checklist -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-4">Document Checklist</h2>
                    @if (checklistItems.length > 0) {
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-slate-200 text-left">
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Doc Type</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Requirement</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Status</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Matched Doc</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Confidence</th>
                                    <th class="pb-3 font-semibold text-slate-600">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (item of checklistItems; track item.item_id) {
                                <tr class="border-b border-slate-100 hover:bg-slate-50">
                                    <td class="py-3 pr-4">
                                        <div class="font-semibold text-slate-900 text-xs">{{ item.doc_type_name }}</div>
                                        <div class="text-[10px] text-slate-400 font-mono">{{ item.doc_type_code }}</div>
                                    </td>
                                    <td class="py-3 pr-4">
                                        <span class="px-2 py-0.5 rounded text-xs font-semibold"
                                              [ngClass]="{
                                                'bg-red-50 text-red-700 border border-red-200': item.requirement === 'MANDATORY',
                                                'bg-slate-100 text-slate-600': item.requirement === 'OPTIONAL'
                                              }">
                                            {{ item.requirement }}
                                        </span>
                                    </td>
                                    <td class="py-3 pr-4">
                                        <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                                              [ngClass]="getMatchStatusClass(item)">
                                            {{ item.match_status }}
                                        </span>
                                    </td>
                                    <td class="py-3 pr-4 font-mono text-xs text-slate-500">{{ item.matched_doc_id || '-' }}</td>
                                    <td class="py-3 pr-4">
                                        @if (item.match_confidence !== null && item.match_confidence !== undefined) {
                                            <div class="flex items-center gap-2">
                                                <div class="w-16 bg-slate-100 rounded-full h-1.5">
                                                    <div class="h-1.5 rounded-full bg-blue-500" [style.width.%]="(item.match_confidence) * 100"></div>
                                                </div>
                                                <span class="text-xs text-slate-600">{{ (item.match_confidence * 100).toFixed(0) }}%</span>
                                            </div>
                                        } @else {
                                            <span class="text-xs text-slate-400">-</span>
                                        }
                                    </td>
                                    <td class="py-3 text-xs text-slate-500 max-w-[200px] truncate">{{ item.notes || '-' }}</td>
                                </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                    } @else {
                        <div class="text-center text-sm text-slate-400 py-8">No checklist items available.</div>
                    }
                </div>

                <!-- Staged Documents -->
                @if (stagedDocuments.length > 0) {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 class="text-base font-bold text-slate-900 mb-4">Staged Documents ({{ stagedDocuments.length }})</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        @for (doc of stagedDocuments; track doc.doc_id) {
                        <div class="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <div class="font-semibold text-sm text-slate-800 truncate">{{ doc.filename }}</div>
                            <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span>{{ doc.mime_type }}</span>
                                <span class="text-slate-300">|</span>
                                <span>{{ formatFileSize(doc.file_size_bytes) }}</span>
                            </div>
                            <div class="flex items-center justify-between mt-2">
                                <span class="font-mono text-[10px] text-slate-400">{{ doc.doc_id }}</span>
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                      [ngClass]="{
                                        'bg-green-100 text-green-700': doc.upload_status === 'UPLOADED' || doc.upload_status === 'COMPLETE',
                                        'bg-yellow-100 text-yellow-700': doc.upload_status === 'PENDING',
                                        'bg-red-100 text-red-700': doc.upload_status === 'FAILED'
                                      }">
                                    {{ doc.upload_status }}
                                </span>
                            </div>
                        </div>
                        }
                    </div>
                </div>
                }
            </div>
            }

            <!-- ─── COMPLETENESS TAB ─── -->
            @if (activeTab === 'completeness') {
            <div class="space-y-6">
                @if (completenessAssessment) {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-5">Completeness Assessment</h2>

                    <!-- Coverage bar -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-slate-700">Overall Coverage</span>
                            <span class="text-2xl font-bold"
                                  [ngClass]="{
                                    'text-green-600': completenessAssessment.coverage_pct >= 80,
                                    'text-yellow-600': completenessAssessment.coverage_pct >= 50 && completenessAssessment.coverage_pct < 80,
                                    'text-red-600': completenessAssessment.coverage_pct < 50
                                  }">
                                {{ completenessAssessment.coverage_pct.toFixed(1) }}%
                            </span>
                        </div>
                        <div class="w-full bg-slate-100 rounded-full h-4">
                            <div class="h-4 rounded-full coverage-bar-fill"
                                 [style.width.%]="completenessAssessment.coverage_pct"
                                 [ngClass]="{
                                    'bg-green-500': completenessAssessment.coverage_pct >= 80,
                                    'bg-yellow-500': completenessAssessment.coverage_pct >= 50 && completenessAssessment.coverage_pct < 80,
                                    'bg-red-500': completenessAssessment.coverage_pct < 50
                                 }"></div>
                        </div>
                    </div>

                    <!-- Stats cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mandatory</div>
                            <div class="text-xl font-bold text-slate-900 mt-1">
                                {{ completenessAssessment.matched_mandatory }} / {{ completenessAssessment.total_mandatory }}
                            </div>
                            <div class="text-xs mt-1"
                                 [ngClass]="completenessAssessment.matched_mandatory === completenessAssessment.total_mandatory ? 'text-green-600' : 'text-red-600'">
                                {{ completenessAssessment.matched_mandatory === completenessAssessment.total_mandatory ? 'Complete' : 'Incomplete' }}
                            </div>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Optional</div>
                            <div class="text-xl font-bold text-slate-900 mt-1">
                                {{ completenessAssessment.matched_optional }} / {{ completenessAssessment.total_optional }}
                            </div>
                            <div class="text-xs text-slate-500 mt-1">Matched</div>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">SLA Consumed</div>
                            <div class="text-xl font-bold mt-1"
                                 [ngClass]="{
                                    'text-green-600': completenessAssessment.sla_pct_consumed < 50,
                                    'text-yellow-600': completenessAssessment.sla_pct_consumed >= 50 && completenessAssessment.sla_pct_consumed < 80,
                                    'text-red-600': completenessAssessment.sla_pct_consumed >= 80
                                 }">
                                {{ completenessAssessment.sla_pct_consumed.toFixed(1) }}%
                            </div>
                            <div class="text-xs text-slate-500 mt-1">of SLA budget</div>
                        </div>
                        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Next Node</div>
                            <div class="text-sm font-bold text-slate-900 mt-2">
                                {{ dceService.getNodeLabel(completenessAssessment.next_node) }}
                            </div>
                        </div>
                    </div>

                    <!-- Missing Mandatory Documents -->
                    @if (completenessAssessment.missing_mandatory && completenessAssessment.missing_mandatory.length > 0) {
                    <div class="p-4 bg-red-50 rounded-lg border border-red-200 mb-6">
                        <div class="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Missing Mandatory Documents</div>
                        <ul class="space-y-1">
                            @for (doc of completenessAssessment.missing_mandatory; track doc) {
                                <li class="flex items-center gap-2 text-sm text-red-800">
                                    <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                                    </svg>
                                    {{ doc }}
                                </li>
                            }
                        </ul>
                    </div>
                    }

                    <!-- Decision Reasoning -->
                    @if (completenessAssessment.decision_reasoning) {
                    <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                        <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Decision Reasoning</div>
                        <p class="text-sm text-slate-700 leading-relaxed">{{ completenessAssessment.decision_reasoning }}</p>
                    </div>
                    }

                    <!-- RM Chase Message -->
                    @if (completenessAssessment.rm_chase_message) {
                    <div class="p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">RM Chase Message</div>
                        <p class="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{{ completenessAssessment.rm_chase_message }}</p>
                    </div>
                    }
                </div>
                } @else {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div class="text-slate-400 text-sm">No completeness assessment available for this case.</div>
                </div>
                }
            </div>
            }

            <!-- ─── AGENT ACTIONS TAB ─── -->
            @if (activeTab === 'agents') {
            <div class="space-y-6">
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-2">Run DCE Agents</h2>
                    <p class="text-sm text-slate-500 mb-6">Invoke specialized agents on this case. Results will update case data in the database.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- SA-1 Card -->
                        <div class="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-slate-900">SA-1: Intake & Triage</h3>
                                    <p class="text-xs text-slate-500">Classification, priority, case creation, RM linking</p>
                                </div>
                            </div>
                            <button (click)="onRunAgent('DCE_SA1')"
                                    class="w-full px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors">
                                Run SA-1 on this Case
                            </button>
                        </div>
                        <!-- SA-2 Card -->
                        <div class="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="text-sm font-bold text-slate-900">SA-2: Document Collection</h3>
                                    <p class="text-xs text-slate-500">Completeness check, GTA validation, RM chase</p>
                                </div>
                            </div>
                            <button (click)="onRunAgent('DCE_SA2')"
                                    class="w-full px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors">
                                Run SA-2 on this Case
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            }

            <!-- ─── EVENTS TAB ─── -->
            @if (activeTab === 'events') {
            <div class="space-y-6">
                <!-- Event Timeline -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 class="text-lg font-bold text-slate-900 mb-5">Event Timeline</h2>
                    @if (events.length > 0) {
                    <div class="relative">
                        <!-- Timeline line -->
                        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                        <div class="space-y-4">
                            @for (event of sortedEvents; track event.event_id) {
                            <div class="relative pl-10">
                                <!-- Timeline dot -->
                                <div class="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                     [ngClass]="{
                                        'bg-green-500': event.event_type === 'NODE_COMPLETED' || event.event_type === 'CASE_COMPLETED',
                                        'bg-blue-500': event.event_type === 'NODE_STARTED' || event.event_type === 'CASE_CREATED',
                                        'bg-yellow-500': event.event_type === 'HITL_REQUESTED' || event.event_type === 'ESCALATION',
                                        'bg-red-500': event.event_type === 'NODE_FAILED' || event.event_type === 'SLA_BREACH',
                                        'bg-slate-400': event.event_type !== 'NODE_COMPLETED' && event.event_type !== 'CASE_COMPLETED' && event.event_type !== 'NODE_STARTED' && event.event_type !== 'CASE_CREATED' && event.event_type !== 'HITL_REQUESTED' && event.event_type !== 'ESCALATION' && event.event_type !== 'NODE_FAILED' && event.event_type !== 'SLA_BREACH'
                                     }"></div>

                                <div class="bg-slate-50 rounded-lg border border-slate-200 p-4 hover:bg-white transition-colors">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="px-2 py-0.5 rounded text-xs font-bold"
                                              [ngClass]="{
                                                'bg-green-100 text-green-700': event.event_type === 'NODE_COMPLETED' || event.event_type === 'CASE_COMPLETED',
                                                'bg-blue-100 text-blue-700': event.event_type === 'NODE_STARTED' || event.event_type === 'CASE_CREATED',
                                                'bg-yellow-100 text-yellow-700': event.event_type === 'HITL_REQUESTED' || event.event_type === 'ESCALATION',
                                                'bg-red-100 text-red-700': event.event_type === 'NODE_FAILED' || event.event_type === 'SLA_BREACH',
                                                'bg-slate-100 text-slate-600': event.event_type !== 'NODE_COMPLETED' && event.event_type !== 'CASE_COMPLETED' && event.event_type !== 'NODE_STARTED' && event.event_type !== 'CASE_CREATED' && event.event_type !== 'HITL_REQUESTED' && event.event_type !== 'ESCALATION' && event.event_type !== 'NODE_FAILED' && event.event_type !== 'SLA_BREACH'
                                              }">
                                            {{ event.event_type }}
                                        </span>
                                        <span class="text-xs text-slate-400">{{ event.triggered_at | date:'MMM d, y HH:mm:ss' }}</span>
                                    </div>
                                    <div class="flex items-center gap-2 text-sm text-slate-600 mt-2">
                                        @if (event.from_state) {
                                            <span class="font-mono text-xs bg-slate-200 px-1.5 py-0.5 rounded">{{ event.from_state }}</span>
                                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                                            </svg>
                                            <span class="font-mono text-xs bg-slate-200 px-1.5 py-0.5 rounded">{{ event.to_state }}</span>
                                        }
                                    </div>
                                    <div class="text-xs text-slate-400 mt-2">
                                        Triggered by: <span class="font-medium text-slate-500">{{ event.triggered_by }}</span>
                                    </div>
                                </div>
                            </div>
                            }
                        </div>
                    </div>
                    } @else {
                        <div class="text-center text-sm text-slate-400 py-8">No events recorded for this case.</div>
                    }
                </div>

                <!-- Notifications -->
                @if (notifications.length > 0) {
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 class="text-base font-bold text-slate-900 mb-4">Notifications Sent ({{ notifications.length }})</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-slate-200 text-left">
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Type</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Channel</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Recipient</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Subject</th>
                                    <th class="pb-3 font-semibold text-slate-600 pr-4">Status</th>
                                    <th class="pb-3 font-semibold text-slate-600">Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (notif of notifications; track notif.notification_id) {
                                <tr class="border-b border-slate-100 hover:bg-slate-50">
                                    <td class="py-3 pr-4 text-xs font-semibold text-slate-700">{{ notif.notification_type }}</td>
                                    <td class="py-3 pr-4">
                                        <span class="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs font-medium">{{ notif.channel }}</span>
                                    </td>
                                    <td class="py-3 pr-4 text-xs text-slate-600">{{ notif.recipient_email }}</td>
                                    <td class="py-3 pr-4 text-xs text-slate-600 max-w-[200px] truncate">{{ notif.subject }}</td>
                                    <td class="py-3 pr-4">
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                              [ngClass]="{
                                                'bg-green-100 text-green-700': notif.delivery_status === 'DELIVERED' || notif.delivery_status === 'SENT',
                                                'bg-red-100 text-red-700': notif.delivery_status === 'FAILED',
                                                'bg-yellow-100 text-yellow-700': notif.delivery_status === 'PENDING'
                                              }">
                                            {{ notif.delivery_status }}
                                        </span>
                                    </td>
                                    <td class="py-3 text-xs text-slate-500">{{ notif.created_at | date:'short' }}</td>
                                </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
                }
            </div>
            }

        </div>

        <!-- Agent Invoker Overlay -->
        <app-dce-agent-invoker
            *ngIf="invokerAgentId"
            [agentId]="invokerAgentId"
            [prefillCaseId]="caseState?.case_id || ''"
            (close)="invokerAgentId = null"
            (completed)="onAgentCompleted($event)">
        </app-dce-agent-invoker>
    </div>
    }
    `,
})
export class DceCaseDetailComponent implements OnInit {
    dceService = inject(DceService);
    private route = inject(ActivatedRoute);

    // State
    loading = true;
    error: string | null = null;
    activeTab = 'workflow';

    // Data from API
    caseState: DceCaseState | null = null;
    classification: DceClassification | null = null;
    checkpoints: DceCheckpoint[] = [];
    rmHierarchy: DceRmHierarchy | null = null;
    completenessAssessment: DceCompletenessAssessment | null = null;
    checklistItems: DceChecklistItem[] = [];
    stagedDocuments: any[] = [];
    events: DceEvent[] = [];
    notifications: DceNotification[] = [];

    invokerAgentId: string | null = null;

    // Tab definitions
    tabs = [
        { key: 'workflow', label: 'Workflow Progress' },
        { key: 'classification', label: 'Classification' },
        { key: 'documents', label: 'Documents' },
        { key: 'completeness', label: 'Completeness' },
        { key: 'agents', label: 'Agent Actions' },
        { key: 'events', label: 'Event Timeline' },
    ];

    // Pipeline nodes
    pipelineNodes = [
        { id: 'N-0' },
        { id: 'N-1' },
        { id: 'N-2' },
        { id: 'N-3' },
        { id: 'N-4' },
        { id: 'N-5' },
    ];

    ngOnInit(): void {
        const caseId = this.route.snapshot.paramMap.get('caseId');
        if (!caseId) {
            this.error = 'No case ID provided in route.';
            this.loading = false;
            return;
        }

        forkJoin({
            detail: this.dceService.getCaseDetail(caseId),
            documents: this.dceService.getCaseDocuments(caseId),
            events: this.dceService.getCaseEvents(caseId),
        }).subscribe({
            next: ({ detail, documents, events }) => {
                // Case detail
                this.caseState = detail.case_state;
                this.classification = detail.classification;
                this.checkpoints = detail.checkpoints || [];
                this.rmHierarchy = detail.rm_hierarchy;
                this.completenessAssessment = detail.completeness_assessment;

                // Documents
                this.checklistItems = documents.checklist_items || [];
                this.stagedDocuments = documents.staged_documents || [];

                // Events
                this.events = events.events || [];
                this.notifications = events.notifications || [];

                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load case detail:', err);
                this.error = err?.error?.message || err?.message || 'An unexpected error occurred.';
                this.loading = false;
            },
        });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    isSlaBreached(): boolean {
        if (!this.caseState?.sla_deadline) return false;
        return new Date(this.caseState.sla_deadline) < new Date();
    }

    getNodeStatus(nodeId: string): 'completed' | 'current' | 'future' {
        if (!this.caseState) return 'future';
        if (this.caseState.completed_nodes?.includes(nodeId)) return 'completed';
        if (this.caseState.current_node === nodeId) return 'current';
        return 'future';
    }

    getCheckpointForNode(nodeId: string): DceCheckpoint | undefined {
        return this.checkpoints.find(
            (cp) => cp.node_id === nodeId && (cp.status === 'COMPLETED' || cp.status === 'SUCCESS')
        );
    }

    getMatchStatusClass(item: DceChecklistItem): string {
        switch (item.match_status) {
            case 'MATCHED':
                return 'bg-green-100 text-green-700';
            case 'UNMATCHED':
                return item.requirement === 'MANDATORY'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700';
            case 'REJECTED':
            case 'RESUBMISSION_REQUIRED':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-slate-100 text-slate-600';
        }
    }

    get sortedEvents(): DceEvent[] {
        return [...this.events].sort(
            (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
        );
    }

    formatFileSize(bytes: number): string {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    }

    // ── Agent Invocation ─────────────────────────────────────────────────────

    onRunAgent(agentId: string): void {
        this.invokerAgentId = agentId;
    }

    onAgentCompleted(_result: any): void {
        // Reload case data to reflect changes from the workflow
        const caseId = this.caseState?.case_id;
        if (caseId) {
            forkJoin({
                detail: this.dceService.getCaseDetail(caseId),
                documents: this.dceService.getCaseDocuments(caseId),
                events: this.dceService.getCaseEvents(caseId),
            }).subscribe({
                next: ({ detail, documents, events }) => {
                    this.caseState = detail.case_state;
                    this.classification = detail.classification;
                    this.checkpoints = detail.checkpoints || [];
                    this.rmHierarchy = detail.rm_hierarchy;
                    this.completenessAssessment = detail.completeness_assessment;
                    this.checklistItems = documents.checklist_items || [];
                    this.stagedDocuments = documents.staged_documents || [];
                    this.events = events.events || [];
                    this.notifications = events.notifications || [];
                },
            });
        }
    }
}
