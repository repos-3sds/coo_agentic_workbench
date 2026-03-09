import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { MarkdownModule } from 'ngx-markdown';
import { DifyService } from '../../services/dify/dify.service';
import { ToastService } from '../../services/toast.service';

type StudioDoc = {
  id: string;
  owner_user_id: string;
  title: string;
  description?: string | null;
  doc_type?: string | null;
  ui_category?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | string;
  generated_markdown?: string | null;
  kb_doc_id?: string | null;
  rejection_reason?: string | null;
};

type StudioFile = {
  id: number;
  filename: string;
  mime_type?: string | null;
};

@Component({
  selector: 'app-knowledge-studio-doc',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedIconsModule, MarkdownModule],
  template: `
  <div class="h-full w-full flex flex-col bg-slate-50">
    <header class="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button (click)="router.navigate(['/knowledge/studio'])" class="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
        </button>
        <div>
          <div class="text-xs text-slate-500">Knowledge & Evidence / Knowledge Studio</div>
          <div class="text-lg font-bold text-slate-900 leading-tight">{{ doc?.title || docId }}</div>
          <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span class="px-2 py-0.5 rounded-full border"
              [class.bg-amber-50]="doc?.status==='DRAFT'"
              [class.text-amber-700]="doc?.status==='DRAFT'"
              [class.border-amber-200]="doc?.status==='DRAFT'"
              [class.bg-blue-50]="doc?.status==='SUBMITTED'"
              [class.text-blue-700]="doc?.status==='SUBMITTED'"
              [class.border-blue-200]="doc?.status==='SUBMITTED'"
              [class.bg-green-50]="doc?.status==='APPROVED'"
              [class.text-green-700]="doc?.status==='APPROVED'"
              [class.border-green-200]="doc?.status==='APPROVED'"
              [class.bg-red-50]="doc?.status==='REJECTED'"
              [class.text-red-700]="doc?.status==='REJECTED'"
              [class.border-red-200]="doc?.status==='REJECTED'">
              {{ doc?.status || '—' }}
            </span>
            <span *ngIf="doc?.kb_doc_id" class="text-slate-600">• Published to KB</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input #fileInput type="file" multiple accept=".pdf,.md,.mmd,.txt,.eml,application/pdf,text/markdown,text/plain"
          class="hidden" (change)="onUploadFiles($event)">
        <button (click)="fileInput.click()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold">
          <lucide-icon name="upload-cloud" class="w-4 h-4"></lucide-icon>
          Upload Sources
        </button>
        <button (click)="openGenerateModal()" [disabled]="doc?.status!=='DRAFT'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">
          <lucide-icon name="sparkles" class="w-4 h-4"></lucide-icon>
          Generate Draft
        </button>
        <button *ngIf="doc?.status==='DRAFT'" (click)="submitForApproval()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
          Submit to KB
        </button>
      </div>
    </header>

    <div *ngIf="uploadMsg || uploadError" class="px-6 pt-4">
      <div *ngIf="uploadMsg" class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
        {{ uploadMsg }}
      </div>
      <div *ngIf="uploadError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
        {{ uploadError }}
      </div>
    </div>

    <div class="flex-1 min-h-0 flex gap-4 p-6">
      <!-- Left: Sources -->
      <section class="w-[28%] min-w-[280px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="paperclip" class="w-4 h-4 text-slate-500"></lucide-icon>
            Sources
          </div>
          <div class="text-xs text-slate-500">
            <span *ngIf="isUploading" class="inline-flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Uploading…
            </span>
            <span *ngIf="!isUploading">{{ files.length }}</span>
          </div>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div *ngFor="let f of files" (click)="selectFile(f)"
            class="w-full px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-3"
            [class.bg-slate-50]="selectedFile?.id===f.id">
            <div class="min-w-0">
              <div class="text-sm font-semibold text-slate-800 truncate">{{ f.filename }}</div>
              <div class="text-xs text-slate-500 truncate">{{ f.mime_type || '—' }}</div>
            </div>
            <button (click)="removeFile(f, $event)" title="Remove source"
              class="shrink-0 p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700">
              <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          <div *ngIf="files.length===0" class="p-6 text-xs text-slate-500">Upload sources (PDF/Markdown/email) to ground the draft.</div>
        </div>
      </section>

      <!-- Middle: Draft -->
      <section class="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="file-text" class="w-4 h-4 text-slate-500"></lucide-icon>
            Draft (Markdown)
          </div>
          <div class="flex items-center gap-2">
            <button (click)="viewMode='edit'" class="px-2.5 py-1 rounded-md text-xs border"
              [class.bg-slate-900]="viewMode==='edit'" [class.text-white]="viewMode==='edit'"
              [class.border-slate-900]="viewMode==='edit'" [class.bg-white]="viewMode!=='edit'"
              [class.text-slate-700]="viewMode!=='edit'" [class.border-slate-200]="viewMode!=='edit'">Edit</button>
            <button (click)="viewMode='preview'" class="px-2.5 py-1 rounded-md text-xs border"
              [class.bg-slate-900]="viewMode==='preview'" [class.text-white]="viewMode==='preview'"
              [class.border-slate-900]="viewMode==='preview'" [class.bg-white]="viewMode!=='preview'"
              [class.text-slate-700]="viewMode!=='preview'" [class.border-slate-200]="viewMode!=='preview'">Preview</button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-4">
          <textarea *ngIf="viewMode==='edit'" [(ngModel)]="draftText" rows="18"
            class="w-full h-full min-h-[360px] border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
          <div *ngIf="viewMode==='preview'" class="prose prose-slate max-w-none">
            <markdown [data]="draftText || ''"></markdown>
          </div>
        </div>
      </section>

      <!-- Right: Preview selected source -->
      <section class="w-[28%] min-w-[320px] bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="eye" class="w-4 h-4 text-slate-500"></lucide-icon>
            Preview
          </div>
          <div class="text-xs text-slate-500 truncate max-w-[180px]">{{ selectedFile?.filename || '—' }}</div>
        </div>
        <div class="flex-1 min-h-0">
          <div *ngIf="!selectedFile" class="h-full flex items-center justify-center text-center p-6 text-xs text-slate-500">
            Select a source to preview.
          </div>

          <iframe *ngIf="selectedPreviewUrl && selectedPreviewKind==='pdf'" class="w-full h-full" [src]="selectedPreviewUrl"></iframe>
          <div *ngIf="selectedPreviewKind==='md' && selectedMarkdownText" class="w-full h-full overflow-y-auto p-4 prose prose-slate max-w-none">
            <markdown [data]="selectedMarkdownText"></markdown>
          </div>
          <div *ngIf="previewError" class="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl m-4">
            {{ previewError }}
          </div>
          <div *ngIf="selectedFile && selectedPreviewKind==='other'" class="h-full flex items-center justify-center text-center p-6 text-xs text-slate-500">
            Preview is not available for this file type.
          </div>
        </div>
      </section>
    </div>

    <!-- Generate modal -->
    <div *ngIf="showGenerate" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/40" (click)="closeGenerateModal()"></div>
      <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500">Knowledge Studio</div>
            <div class="text-lg font-bold text-slate-900">Generate Draft</div>
          </div>
          <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-600" (click)="closeGenerateModal()">
            <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Agent</label>
              <select [(ngModel)]="generateForm.agent_id" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="KB_SEARCH">KB Search</option>
                <option value="DILIGENCE">Diligence</option>
                <option value="MASTER_COO">Master COO</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Output guidance</label>
              <select [(ngModel)]="generateForm.preset" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="report">Report</option>
                <option value="checklist">Checklist</option>
                <option value="sop">SOP</option>
                <option value="flow">Workflow (Mermaid)</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Instruction</label>
            <textarea [(ngModel)]="generateForm.instruction" rows="4"
              placeholder="What should this draft contain? e.g. include summary, risks, controls, and a checklist."
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Extra context (optional)</label>
            <textarea [(ngModel)]="generateForm.context" rows="4"
              placeholder="Paste email thread / meeting notes / constraints."
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
          </div>
          <div *ngIf="genError" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{{ genError }}</div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
          <button (click)="closeGenerateModal()"
            class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button (click)="generate()" [disabled]="isGenerating"
            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">
            Generate
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class KnowledgeStudioDocComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private difyService = inject(DifyService);
  private toast = inject(ToastService);

  docId = '';
  doc: StudioDoc | null = null;
  files: StudioFile[] = [];

  viewMode: 'edit' | 'preview' = 'preview';
  draftText = '';

  selectedFile: StudioFile | null = null;
  selectedPreviewKind: 'pdf' | 'md' | 'other' = 'other';
  selectedPreviewUrl: SafeResourceUrl | null = null;
  selectedMarkdownText = '';
  previewError: string | null = null;
  private objectUrl: string | null = null;

  showGenerate = false;
  isGenerating = false;
  genError: string | null = null;
  generateForm = { agent_id: 'KB_SEARCH', preset: 'report', instruction: '', context: '' };

  isUploading = false;
  uploadMsg: string | null = null;
  uploadError: string | null = null;

  private sub: any;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((p) => {
      this.docId = p.get('id') || '';
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe?.();
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      try { URL.revokeObjectURL(this.objectUrl); } catch { /* ignore */ }
      this.objectUrl = null;
    }
  }

  load() {
    this.http.get<{ doc: StudioDoc; files: StudioFile[] }>(`/api/studio/docs/${encodeURIComponent(this.docId)}`).subscribe({
      next: (res) => {
        this.doc = res.doc;
        this.files = Array.isArray(res.files) ? res.files : [];
        this.draftText = String(this.doc?.generated_markdown || '');
      }
    });
  }

  onUploadFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    this.isUploading = true;
    this.uploadMsg = null;
    this.uploadError = null;

    const form = new FormData();
    for (const f of files) form.append('files', f);

    this.http.post<{ files: StudioFile[] }>(`/api/studio/docs/${encodeURIComponent(this.docId)}/upload`, form).subscribe({
      next: (res) => {
        this.files = Array.isArray(res?.files) ? res.files : this.files;
        input.value = '';
        this.isUploading = false;
        this.uploadMsg = `Uploaded ${files.length} source file${files.length === 1 ? '' : 's'}.`;
      },
      error: (e) => {
        input.value = '';
        this.isUploading = false;
        const msg = e?.error?.error || e?.message || 'Upload failed';
        this.uploadError = String(msg);
      }
    });
  }

  selectFile(f: StudioFile) {
    this.selectedFile = f;
    this.selectedPreviewUrl = null;
    this.selectedMarkdownText = '';
    this.previewError = null;
    this.revokeObjectUrl();

    const name = (f.filename || '').toLowerCase();
    if (name.endsWith('.pdf')) {
      this.selectedPreviewKind = 'pdf';
      const url = `/api/studio/docs/${encodeURIComponent(this.docId)}/files/${encodeURIComponent(String(f.id))}`;
      // Important: <iframe> requests do NOT include JWT headers, so preview via a blob request.
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.revokeObjectUrl();
          this.objectUrl = URL.createObjectURL(blob);
          this.selectedPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        },
        error: (e) => {
          const maybeBlob = e?.error;
          if (maybeBlob instanceof Blob) {
            maybeBlob.text().then((txt) => {
              try {
                const parsed = JSON.parse(txt || '{}');
                this.previewError = String(parsed?.error || parsed?.message || e?.message || 'Failed to load PDF preview');
              } catch {
                this.previewError = String(txt || e?.message || 'Failed to load PDF preview');
              }
            }).catch(() => {
              this.previewError = String(e?.message || 'Failed to load PDF preview');
            });
            return;
          }

          const msg = e?.error?.error || e?.message || 'Failed to load PDF preview';
          this.previewError = String(msg);
        }
      });
      return;
    }
    if (name.endsWith('.md') || name.endsWith('.mmd') || name.endsWith('.txt') || name.endsWith('.eml')) {
      this.selectedPreviewKind = 'md';
      const url = `/api/studio/docs/${encodeURIComponent(this.docId)}/files/${encodeURIComponent(String(f.id))}`;
      this.http.get(url, { responseType: 'text' }).subscribe({
        next: (txt) => this.selectedMarkdownText = txt || '',
        error: (e) => {
          const msg = e?.error?.error || e?.message || 'Unable to load preview';
          this.selectedMarkdownText = '';
          this.previewError = String(msg);
        }
      });
      return;
    }
    this.selectedPreviewKind = 'other';
  }

  removeFile(f: StudioFile, ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    if (!confirm(`Remove "${f.filename}" from sources?`)) return;
    this.previewError = null;
    this.http.delete<{ files: StudioFile[] }>(`/api/studio/docs/${encodeURIComponent(this.docId)}/files/${encodeURIComponent(String(f.id))}`).subscribe({
      next: (res) => {
        this.files = Array.isArray(res?.files) ? res.files : this.files.filter(x => x.id !== f.id);
        this.uploadMsg = `Removed "${f.filename}".`;
        this.uploadError = null;
        if (this.selectedFile?.id === f.id) {
          this.selectedFile = null;
          this.selectedPreviewKind = 'other';
          this.selectedPreviewUrl = null;
          this.selectedMarkdownText = '';
          this.previewError = null;
          this.revokeObjectUrl();
        }
      },
      error: (e) => {
        const msg = e?.error?.error || e?.message || 'Failed to remove source';
        this.uploadError = String(msg);
      }
    });
  }

  openGenerateModal() {
    this.showGenerate = true;
    this.genError = null;
    this.generateForm = { agent_id: 'KB_SEARCH', preset: 'report', instruction: '', context: '' };
  }

  closeGenerateModal() {
    this.showGenerate = false;
  }

  generate() {
    if (!this.docId) return;
    this.isGenerating = true;
    this.genError = null;

    const presetHint: Record<string, string> = {
      report: 'Write a structured report with headings, key points, and recommendations.',
      checklist: 'Write a checklist with actionable items and acceptance criteria.',
      sop: 'Write an SOP with steps, roles, and controls.',
      flow: 'Include a Mermaid flowchart and describe the workflow clearly.',
    };

    const instruction = [
      presetHint[this.generateForm.preset] || '',
      (this.generateForm.instruction || '').trim()
    ].filter(Boolean).join('\n');

    this.http.post<{ doc: StudioDoc }>(`/api/studio/docs/${encodeURIComponent(this.docId)}/generate`, {
      agent_id: this.generateForm.agent_id,
      instruction,
      context: this.generateForm.context || ''
    }).subscribe({
      next: (res) => {
        this.doc = res.doc;
        this.draftText = String(this.doc?.generated_markdown || '');
        this.viewMode = 'preview';
        this.isGenerating = false;
        this.showGenerate = false;
      },
      error: (e) => {
        const maybeBlob = e?.error;
        if (maybeBlob instanceof Blob) {
          maybeBlob.text().then((txt) => {
            try {
              const parsed = JSON.parse(txt || '{}');
              this.genError = String(parsed?.error || parsed?.message || e?.message || 'Generation failed');
            } catch {
              this.genError = String(txt || e?.message || 'Generation failed');
            }
            this.isGenerating = false;
          }).catch(() => {
            this.genError = String(e?.message || 'Generation failed');
            this.isGenerating = false;
          });
          return;
        }

        this.genError = e?.error?.error || e?.message || 'Generation failed';
        this.isGenerating = false;
      }
    });
  }

  submitForApproval() {
    if (!confirm('Submit this draft for KB approval?')) return;
    this.http.post(`/api/studio/docs/${encodeURIComponent(this.docId)}/submit`, {}).subscribe({
      next: () => this.load(),
      error: (e) => this.toast.error(e?.error?.error || 'Submit failed')
    });
  }
}
