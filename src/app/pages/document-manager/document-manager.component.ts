import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { DocumentService, NpaDocument } from '../../services/document.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-document-manager',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    template: `
    @if (loading()) {
      <div class="flex items-center justify-center h-64">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    } @else {
    <div class="h-full flex flex-col bg-slate-50 font-sans text-slate-900">

      <!-- HEADER -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <lucide-icon name="file-stack" class="w-6 h-6 text-blue-600"></lucide-icon>
            Document Manager
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ npaId ? 'Documents for NPA ' + npaId : 'Upload and manage NPA documents.' }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
            {{ documents.length }} Documents
          </div>
        </div>
      </div>

      <!-- UPLOAD BAR -->
      <div class="flex-none bg-white border-b border-slate-200 px-8 py-4">
        <div class="flex items-center gap-4">
          <div *ngIf="npaId" class="flex-1 flex items-center gap-3">
            <input #fileInput type="file" (change)="onFileSelected($event)" class="hidden"
                   accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg">
            <button (click)="fileInput.click()"
                    class="px-4 py-2 bg-mbs-primary text-white rounded-lg text-sm font-semibold hover:bg-mbs-primary-hover transition-colors flex items-center gap-2">
              <lucide-icon name="upload-cloud" class="w-4 h-4"></lucide-icon>
              Upload Document
            </button>
            <select [(ngModel)]="uploadDocType" class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="OTHER">Type: Other</option>
              <option value="TERM_SHEET">Term Sheet</option>
              <option value="RISK_ASSESSMENT">Risk Assessment</option>
              <option value="LEGAL_OPINION">Legal Opinion</option>
              <option value="PRICING_MODEL">Pricing Model</option>
              <option value="PAC_SUBMISSION">PAC Submission</option>
              <option value="COMPLIANCE_CLEARANCE">Compliance Clearance</option>
            </select>
            <span *ngIf="uploadProgress" class="text-sm text-blue-600 font-medium animate-pulse">
              Uploading...
            </span>
          </div>
          <div *ngIf="!npaId" class="text-sm text-slate-500">
            Select an NPA to manage documents.
            <input [(ngModel)]="npaIdInput" placeholder="Enter NPA ID (e.g. NPA-001)" class="ml-3 px-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48">
            <button (click)="loadNpa()" class="ml-2 px-3 py-1.5 bg-mbs-primary text-white rounded-lg text-xs font-semibold hover:bg-mbs-primary-hover transition-colors">Load</button>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div class="flex-1 overflow-auto p-8">
        <div class="max-w-5xl mx-auto">
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th class="px-6 py-3">Document</th>
                  <th class="px-6 py-3">Type</th>
                  <th class="px-6 py-3">Size</th>
                  <th class="px-6 py-3 text-center">Validation</th>
                  <th class="px-6 py-3">Uploaded</th>
                  <th class="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr *ngFor="let doc of documents" class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold"
                           [ngClass]="getFileIconClass(doc.file_extension)">
                        {{ (doc.file_extension || '').replace('.','').toUpperCase() || '?' }}
                      </div>
                      <div>
                        <div class="font-bold text-slate-900 text-sm">{{ doc.document_name }}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">{{ doc.category || 'Uncategorized' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{{ doc.document_type }}</span>
                  </td>
                  <td class="px-6 py-4 text-slate-500 font-mono text-[11px]">{{ doc.file_size }}</td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                          [ngClass]="{
                            'bg-green-50 text-green-700 border-green-200': doc.validation_status === 'VALID',
                            'bg-amber-50 text-amber-700 border-amber-200': doc.validation_status === 'PENDING',
                            'bg-red-50 text-red-700 border-red-200': doc.validation_status === 'INVALID',
                            'bg-yellow-50 text-yellow-700 border-yellow-200': doc.validation_status === 'WARNING'
                          }">
                      <span class="w-1.5 h-1.5 rounded-full"
                            [ngClass]="{
                              'bg-green-500': doc.validation_status === 'VALID',
                              'bg-amber-500': doc.validation_status === 'PENDING',
                              'bg-red-500': doc.validation_status === 'INVALID',
                              'bg-yellow-500': doc.validation_status === 'WARNING'
                            }"></span>
                      {{ doc.validation_status }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-slate-600 text-[11px]">{{ doc.uploaded_by }}</div>
                    <div class="text-slate-400 text-[10px]">{{ doc.uploaded_at | date:'short' }}</div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button *ngIf="doc.validation_status === 'PENDING'" (click)="validateDoc(doc, 'VALID')"
                              class="p-1.5 hover:bg-green-50 rounded text-green-600" title="Mark Valid">
                        <lucide-icon name="check" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                      <button *ngIf="doc.validation_status === 'PENDING'" (click)="validateDoc(doc, 'INVALID')"
                              class="p-1.5 hover:bg-red-50 rounded text-red-600" title="Mark Invalid">
                        <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                      <button (click)="deleteDoc(doc)" class="p-1.5 hover:bg-slate-100 rounded text-slate-400" title="Delete">
                        <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div *ngIf="documents.length === 0" class="text-center py-20">
              <lucide-icon name="file-plus" class="w-12 h-12 text-slate-300 mx-auto mb-4"></lucide-icon>
              <h3 class="text-lg font-medium text-slate-900">No documents yet</h3>
              <p class="text-slate-500 mt-2">{{ npaId ? 'Upload documents for this NPA.' : 'Enter an NPA ID to get started.' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    }
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class DocumentManagerComponent implements OnInit {
    private destroyRef = inject(DestroyRef);
    private docService = inject(DocumentService);
    private route = inject(ActivatedRoute);
    private toast = inject(ToastService);

    loading = signal(true);

    npaId = '';
    npaIdInput = '';
    documents: NpaDocument[] = [];
    uploadDocType = 'OTHER';
    uploadProgress = false;

    ngOnInit() {
        this.route.queryParams.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(params => {
            if (params['npaId']) {
                this.npaId = params['npaId'];
                this.loadDocuments();
            } else {
                this.loading.set(false);
            }
        });
    }

    loadNpa() {
        if (this.npaIdInput) {
            this.npaId = this.npaIdInput;
            this.loadDocuments();
        }
    }

    loadDocuments() {
        if (!this.npaId) return;
        this.docService.getByNpa(this.npaId).subscribe({
            next: (docs) => {
                this.documents = docs;
                this.loading.set(false);
            },
            error: (err) => {
                console.error('[DOCS] Load failed', err);
                this.loading.set(false);
            }
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || !this.npaId) return;

        this.uploadProgress = true;
        this.docService.upload(this.npaId, file, {
            document_type: this.uploadDocType,
            uploaded_by: 'user'
        }).subscribe({
            next: () => {
                this.uploadProgress = false;
                this.loadDocuments();
                input.value = '';
            },
            error: (err) => {
                this.uploadProgress = false;
                this.toast.error(err.error?.error || 'Upload failed');
            }
        });
    }

    validateDoc(doc: NpaDocument, status: string) {
        this.docService.validate(doc.id, { validation_status: status }).subscribe({
            next: () => this.loadDocuments(),
            error: (err) => this.toast.error(err.error?.error || 'Validation update failed')
        });
    }

    deleteDoc(doc: NpaDocument) {
        if (!confirm(`Delete "${doc.document_name}"?`)) return;
        this.docService.delete(doc.id).subscribe({
            next: () => this.loadDocuments(),
            error: (err) => this.toast.error(err.error?.error || 'Delete failed')
        });
    }

    getFileIconClass(ext: string): string {
        const e = (ext || '').toLowerCase();
        if (e.includes('pdf')) return 'bg-red-50 text-red-600 border border-red-100';
        if (e.includes('doc')) return 'bg-blue-50 text-blue-600 border border-blue-100';
        if (e.includes('xls')) return 'bg-green-50 text-green-600 border border-green-100';
        if (e.includes('ppt')) return 'bg-orange-50 text-orange-600 border border-orange-100';
        if (e.includes('png') || e.includes('jpg') || e.includes('jpeg')) return 'bg-purple-50 text-purple-600 border border-purple-100';
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
}
