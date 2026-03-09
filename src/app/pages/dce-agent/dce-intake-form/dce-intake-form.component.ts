import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';

type IntakeChannel = 'PORTAL' | 'EMAIL' | 'API';

@Component({
    selector: 'app-dce-intake-form',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedIconsModule],
    template: `
        <div class="max-w-4xl mx-auto py-8 px-4">
            <!-- Header -->
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <lucide-icon name="file-plus-2" class="w-5 h-5 text-sky-500"></lucide-icon>
                        New Account Opening
                    </h1>
                    <p class="text-sm text-slate-500 mt-1">Submit a new account opening request via any channel</p>
                </div>
                <button (click)="onBack.emit()"
                    class="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5">
                    <lucide-icon name="arrow-left" class="w-4 h-4"></lucide-icon>
                    Back
                </button>
            </div>

            <!-- Channel Tabs -->
            <div class="flex bg-white rounded-t-xl border border-b-0 border-slate-200">
                <button *ngFor="let ch of channels"
                    (click)="activeChannel = ch.id"
                    [ngClass]="activeChannel === ch.id
                        ? 'border-sky-600 text-sky-700 bg-sky-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
                    class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-all">
                    <lucide-icon [name]="ch.icon" class="w-4 h-4"></lucide-icon>
                    {{ ch.label }}
                </button>
            </div>

            <!-- Form Body -->
            <div class="bg-white rounded-b-xl border border-slate-200 p-8 shadow-sm">

                <!-- ═══════ PORTAL TAB ═══════ -->
                <div *ngIf="activeChannel === 'PORTAL'" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Client Name *</label>
                            <input type="text" [(ngModel)]="portalForm.client_name"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                placeholder="e.g. ABC Trading Pte Ltd">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Entity Type *</label>
                            <select [(ngModel)]="portalForm.entity_type"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white">
                                <option value="">Select...</option>
                                <option value="CORP">Corporate</option>
                                <option value="FUND">Fund</option>
                                <option value="FI">Financial Institution</option>
                                <option value="SPV">Special Purpose Vehicle</option>
                                <option value="INDIVIDUAL">Individual</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Jurisdiction *</label>
                            <select [(ngModel)]="portalForm.jurisdiction"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none bg-white">
                                <option value="SGP">Singapore</option>
                                <option value="HKG">Hong Kong</option>
                                <option value="CHN">China</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Contact Person *</label>
                            <input type="text" [(ngModel)]="portalForm.contact_person"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                placeholder="e.g. John Tan">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">Contact Email *</label>
                            <input type="email" [(ngModel)]="portalForm.contact_email"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                placeholder="e.g. john@abc.com">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-600 mb-1.5">RM Employee ID</label>
                            <input type="text" [(ngModel)]="portalForm.rm_employee_id"
                                class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                                placeholder="e.g. RM-0042">
                        </div>
                    </div>

                    <!-- Products -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-2">Products Requested *</label>
                        <div class="flex flex-wrap gap-3">
                            <label *ngFor="let prod of productOptions" class="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" [checked]="portalForm.products.includes(prod.value)"
                                    (change)="toggleProduct(prod.value)"
                                    class="rounded border-slate-300 text-sky-600 focus:ring-sky-500">
                                <span class="text-sm text-slate-700">{{ prod.label }}</span>
                            </label>
                        </div>
                    </div>

                    <!-- Document Upload Zone (mock) -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-2">Documents</label>
                        <div class="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-sky-300 transition-colors cursor-pointer">
                            <lucide-icon name="upload-cloud" class="w-8 h-8 text-slate-300 mx-auto mb-2"></lucide-icon>
                            <p class="text-sm text-slate-500">Drop files here or click to upload</p>
                            <p class="text-xs text-slate-400 mt-1">PDF, DOCX, XLSX up to 10MB each</p>
                        </div>
                        <div *ngIf="mockFiles.length" class="mt-3 space-y-2">
                            <div *ngFor="let f of mockFiles" class="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded px-3 py-2">
                                <lucide-icon name="file-text" class="w-4 h-4 text-slate-400"></lucide-icon>
                                {{ f }}
                                <lucide-icon name="check-circle-2" class="w-4 h-4 text-green-500 ml-auto"></lucide-icon>
                            </div>
                        </div>
                    </div>

                    <button (click)="submitPortal()"
                        [disabled]="!portalForm.client_name || !portalForm.entity_type"
                        class="w-full py-3 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        [ngClass]="portalForm.client_name && portalForm.entity_type
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
                        <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
                        Submit Portal Application
                    </button>
                </div>

                <!-- ═══════ EMAIL TAB ═══════ -->
                <div *ngIf="activeChannel === 'EMAIL'" class="space-y-6">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Sender Email *</label>
                        <input type="email" [(ngModel)]="emailForm.sender_email"
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            placeholder="e.g. rm@broker.com">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Subject *</label>
                        <input type="text" [(ngModel)]="emailForm.subject"
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                            placeholder="e.g. New Account Opening - ABC Trading Pte Ltd">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1.5">Body *</label>
                        <textarea [(ngModel)]="emailForm.body_text" rows="8"
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none font-mono"
                            placeholder="Paste email content here..."></textarea>
                    </div>

                    <!-- Attachment Zone -->
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-2">Attachments</label>
                        <div class="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-sky-300 transition-colors cursor-pointer">
                            <lucide-icon name="paperclip" class="w-6 h-6 text-slate-300 mx-auto mb-2"></lucide-icon>
                            <p class="text-sm text-slate-500">Attach email documents</p>
                        </div>
                    </div>

                    <button (click)="submitEmail()"
                        [disabled]="!emailForm.sender_email || !emailForm.subject || !emailForm.body_text"
                        class="w-full py-3 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        [ngClass]="emailForm.sender_email && emailForm.subject && emailForm.body_text
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
                        <lucide-icon name="mail" class="w-4 h-4"></lucide-icon>
                        Submit Email Intake
                    </button>
                </div>

                <!-- ═══════ API TAB ═══════ -->
                <div *ngIf="activeChannel === 'API'" class="space-y-6">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-semibold text-slate-600">API Request Body (JSON)</label>
                            <span class="text-[10px] font-mono px-2 py-0.5 rounded"
                                  [ngClass]="isJsonValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                {{ isJsonValid ? 'Valid JSON' : 'Invalid JSON' }}
                            </span>
                        </div>
                        <textarea [(ngModel)]="apiJson" (ngModelChange)="validateJson()"
                            rows="18"
                            class="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none resize-none font-mono bg-slate-50 leading-relaxed"></textarea>
                    </div>

                    <button (click)="submitApi()"
                        [disabled]="!isJsonValid"
                        class="w-full py-3 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                        [ngClass]="isJsonValid
                            ? 'bg-sky-600 hover:bg-sky-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'">
                        <lucide-icon name="code-2" class="w-4 h-4"></lucide-icon>
                        Submit API Request
                    </button>
                </div>
            </div>
        </div>
    `,
})
export class DceIntakeFormComponent {
    @Output() onSubmit = new EventEmitter<{ channel: string; payload: any }>();
    @Output() onBack = new EventEmitter<void>();

    activeChannel: IntakeChannel = 'PORTAL';

    channels: { id: IntakeChannel; label: string; icon: string }[] = [
        { id: 'PORTAL', label: 'Portal', icon: 'layout-dashboard' },
        { id: 'EMAIL', label: 'Email', icon: 'mail' },
        { id: 'API', label: 'API', icon: 'code-2' },
    ];

    productOptions = [
        { label: 'Exchange Traded Futures', value: 'FUTURES' },
        { label: 'OTC Derivatives', value: 'OTC_DERIVATIVES' },
        { label: 'Commodities Physical', value: 'COMMODITIES_PHYSICAL' },
        { label: 'Multi-Product', value: 'MULTI_PRODUCT' },
        { label: 'Options', value: 'OPTIONS' },
    ];

    // Portal form
    portalForm = {
        client_name: '',
        entity_type: '',
        jurisdiction: 'SGP',
        contact_person: '',
        contact_email: '',
        rm_employee_id: '',
        products: [] as string[],
    };

    // Email form
    emailForm = {
        sender_email: '',
        subject: '',
        body_text: '',
    };

    // API JSON
    apiJson = JSON.stringify({
        submission_source: 'API',
        raw_payload: {
            client_name: 'Example Corp Ltd',
            entity_type: 'CORP',
            jurisdiction: 'SGP',
            products_requested: ['FUTURES', 'OPTIONS'],
            contact_person: 'Jane Smith',
            contact_email: 'jane@example.com',
            rm_employee_id: 'RM-0042',
        },
        received_at: new Date().toISOString(),
    }, null, 2);
    isJsonValid = true;

    // Mock uploaded files
    mockFiles: string[] = [];

    toggleProduct(value: string) {
        const idx = this.portalForm.products.indexOf(value);
        if (idx >= 0) {
            this.portalForm.products.splice(idx, 1);
        } else {
            this.portalForm.products.push(value);
        }
    }

    validateJson() {
        try {
            JSON.parse(this.apiJson);
            this.isJsonValid = true;
        } catch {
            this.isJsonValid = false;
        }
    }

    submitPortal() {
        this.onSubmit.emit({
            channel: 'PORTAL',
            payload: {
                submission_source: 'PORTAL',
                client_name: this.portalForm.client_name,
                account_type: this.portalForm.entity_type,
                jurisdiction: this.portalForm.jurisdiction,
                products_requested: this.portalForm.products,
                rm_id: this.portalForm.rm_employee_id,
                contact_person: this.portalForm.contact_person,
                contact_email: this.portalForm.contact_email,
            }
        });
    }

    submitEmail() {
        this.onSubmit.emit({
            channel: 'EMAIL',
            payload: {
                submission_source: 'EMAIL',
                client_name: this.extractClientFromSubject(this.emailForm.subject),
                account_type: 'Standard',
                raw_payload: {
                    sender_email: this.emailForm.sender_email,
                    subject: this.emailForm.subject,
                    body_text: this.emailForm.body_text,
                },
            }
        });
    }

    submitApi() {
        try {
            const parsed = JSON.parse(this.apiJson);
            this.onSubmit.emit({
                channel: 'API',
                payload: {
                    submission_source: 'API',
                    client_name: parsed.raw_payload?.client_name || 'API Client',
                    account_type: parsed.raw_payload?.entity_type || 'Standard',
                    jurisdiction: parsed.raw_payload?.jurisdiction || 'SGP',
                    products_requested: parsed.raw_payload?.products_requested || [],
                    rm_id: parsed.raw_payload?.rm_employee_id || null,
                    ...parsed,
                }
            });
        } catch { /* JSON already validated */ }
    }

    private extractClientFromSubject(subject: string): string {
        // Simple extraction: look for text after common patterns
        const match = subject.match(/(?:New Account|Account Opening|AO)\s*[-:–]\s*(.+)/i);
        return match?.[1]?.trim() || subject || 'Email Client';
    }
}
