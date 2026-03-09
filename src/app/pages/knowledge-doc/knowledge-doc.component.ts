import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { DifyService, StreamEvent } from '../../services/dify/dify.service';
import { MarkdownModule } from 'ngx-markdown';
import { ToastService } from '../../services/toast.service';

type ChatMsg = { role: 'user' | 'agent'; content: string; streaming?: boolean; ts: number };

@Component({
  selector: 'app-knowledge-doc',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedIconsModule, MarkdownModule],
  template: `
  <div class="h-full w-full flex flex-col bg-slate-50">
    <!-- Header -->
    <header class="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button (click)="router.navigate(['/knowledge/base'])"
          class="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
        </button>
        <div>
          <div class="text-xs text-slate-500">Knowledge & Evidence / Knowledge Base</div>
          <div class="text-lg font-bold text-slate-900 leading-tight">{{ doc?.title || docId }}</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ doc?.doc_type || '' }} <span *ngIf="doc?.display_date">• {{ doc.display_date }}</span></div>
        </div>
      </div>

	      <div class="flex items-center gap-2">
	        <input #fileInput type="file" accept=".pdf,.md,.mmd,application/pdf,text/markdown"
	          class="hidden" (change)="onUploadFile($event)">
	        <button (click)="fileInput.click()" [disabled]="isUploading"
	          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold">
	          <lucide-icon name="upload-cloud" class="w-4 h-4"></lucide-icon>
	          <span *ngIf="!isUploading">Upload Document</span>
	          <span *ngIf="isUploading">Uploading…</span>
	        </button>
	        <button (click)="openEditModal()" *ngIf="doc"
	          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-sm font-semibold">
	          <lucide-icon name="pencil" class="w-4 h-4"></lucide-icon>
	          Edit Details
	        </button>
	        <button *ngIf="doc?.source_url" (click)="openSource()"
	          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold">
	          <lucide-icon name="external-link" class="w-4 h-4"></lucide-icon>
	          Open Source
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

    <!-- Split view -->
    <div class="flex-1 min-h-0 flex">
	      <!-- Left: Document -->
	      <section class="w-1/2 min-w-0 border-r border-slate-200 bg-white flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="file-text" class="w-4 h-4 text-slate-500"></lucide-icon>
            Document Viewer
          </div>
          <div class="text-xs text-slate-500" *ngIf="doc?.filename">{{ doc.filename }}</div>
        </div>

        <div class="flex-1 min-h-0">
	          <div *ngIf="!pdfUrl && !markdownText && !doc?.source_url" class="h-full flex items-center justify-center text-center p-8">
	            <div class="max-w-sm">
	              <div class="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
	                <lucide-icon name="help-circle" class="w-6 h-6 text-slate-500"></lucide-icon>
	              </div>
	              <div class="text-sm font-semibold text-slate-800">No document uploaded yet</div>
	              <div class="text-xs text-slate-500 mt-1">Upload a PDF or Markdown file to view it here and chat against it.</div>
	            </div>
	          </div>

          <iframe *ngIf="pdfUrl" class="w-full h-full" [src]="pdfUrl"></iframe>

          <div *ngIf="markdownText" class="w-full h-full overflow-y-auto p-4 prose prose-slate max-w-none">
            <markdown [data]="markdownText"></markdown>
          </div>

          <div *ngIf="!pdfUrl && doc?.source_url" class="h-full flex items-center justify-center text-center p-8">
            <div class="max-w-sm">
              <div class="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
                <lucide-icon name="link2" class="w-6 h-6 text-slate-500"></lucide-icon>
              </div>
              <div class="text-sm font-semibold text-slate-800">External official source</div>
              <div class="text-xs text-slate-500 mt-1">Some government sites block embedding. Use “Open Source”.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: Chat -->
      <section class="w-1/2 min-w-0 bg-white flex flex-col">
        <div class="flex-none px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon name="message-square" class="w-4 h-4 text-slate-500"></lucide-icon>
            Ask an Agent
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Agent</label>
            <select [(ngModel)]="selectedAgent"
              class="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white">
              <option value="KB_SEARCH">KB Search</option>
              <option value="DILIGENCE">Diligence</option>
              <option value="MASTER_COO">Master COO</option>
            </select>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          <div *ngFor="let m of messages"
            class="max-w-[92%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap"
            [class.ml-auto]="m.role==='user'"
            [class.bg-slate-900]="m.role==='user'"
            [class.text-white]="m.role==='user'"
            [class.bg-slate-50]="m.role==='agent'"
            [class.text-slate-800]="m.role==='agent'">
            <div [class.opacity-80]="m.streaming">{{ m.content }}</div>
          </div>

          <div *ngIf="isThinking" class="text-xs text-slate-500 flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Agent is thinking…
          </div>
        </div>

        <div class="flex-none border-t border-slate-200 p-3">
          <div class="flex items-end gap-2">
            <textarea [(ngModel)]="userInput" rows="2"
              (keydown.enter)="onEnter($event)"
              placeholder="Ask questions about this document…"
              class="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
            <button (click)="send()" [disabled]="!userInput.trim() || isThinking"
              class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold">
              Send
            </button>
          </div>
          <div class="text-[11px] text-slate-400 mt-2">
            Tip: Upload the same PDF into your Dify Dataset for best grounded answers.
          </div>
        </div>
      </section>
    </div>
	  </div>

	  <!-- Edit Details Modal -->
	  <div *ngIf="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center">
	    <div class="absolute inset-0 bg-slate-900/40" (click)="closeEditModal()"></div>
	    <div class="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
	      <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
	        <div>
	          <div class="text-xs text-slate-500">Knowledge Base</div>
	          <div class="text-lg font-bold text-slate-900">Edit Document Details</div>
	        </div>
	        <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-600" (click)="closeEditModal()">
	          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
	        </button>
	      </div>

	      <div class="p-6 space-y-4">
	        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Doc ID (read-only)</label>
	            <input [value]="docId" readonly class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-700">
	          </div>
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Linked Dify (read-only)</label>
	            <input [value]="difyLinkLabel || '—'" readonly class="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs bg-slate-50 text-slate-700">
	          </div>
	        </div>

	        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Title</label>
	            <input [(ngModel)]="editForm.title" type="text" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	          </div>
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Agent Target (optional)</label>
	            <input [(ngModel)]="editForm.agent_target" type="text" placeholder="e.g. CF_NPA_LCS"
	              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	          </div>
	        </div>

	        <div>
	          <label class="block text-xs font-semibold text-slate-600 mb-1">Description</label>
	          <textarea [(ngModel)]="editForm.description" rows="4"
	            class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"></textarea>
	        </div>

	        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
	            <select [(ngModel)]="editForm.ui_category" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	              <option value="UNIVERSAL">UNIVERSAL</option>
	              <option value="AGENT">AGENT</option>
	              <option value="WORKFLOW">WORKFLOW</option>
	            </select>
	          </div>
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Doc Type</label>
	            <input [(ngModel)]="editForm.doc_type" type="text" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	          </div>
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Visibility</label>
	            <select [(ngModel)]="editForm.visibility" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	              <option value="INTERNAL">INTERNAL</option>
	              <option value="PUBLIC">PUBLIC</option>
	            </select>
	          </div>
	        </div>

	        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Display date (optional)</label>
	            <input [(ngModel)]="editForm.display_date" type="text" placeholder="e.g. Jan 2026"
	              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	          </div>
	          <div>
	            <label class="block text-xs font-semibold text-slate-600 mb-1">Source URL (optional)</label>
	            <input [(ngModel)]="editForm.source_url" type="text" placeholder="https://…"
	              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
	          </div>
	        </div>

	        <div class="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
	          <input type="checkbox" [(ngModel)]="propagateToDify">
	          <div class="flex-1 min-w-0">
	            <div class="font-semibold text-slate-800">Propagate title to Dify (best-effort)</div>
	            <div class="text-slate-500">Requires a linked Dify doc and a local file copy (we re-upload the same content with the new name).</div>
	          </div>
	        </div>

	        <div *ngIf="difyKpis" class="border border-slate-200 rounded-2xl p-4">
	          <div class="text-xs font-semibold text-slate-600 mb-2">Dify KPIs</div>
	          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
	            <div>
	              <div class="text-[11px] text-slate-500">Words</div>
	              <div class="text-sm font-bold text-slate-900">{{ difyKpis.word_count ?? '—' }}</div>
	            </div>
	            <div>
	              <div class="text-[11px] text-slate-500">Tokens</div>
	              <div class="text-sm font-bold text-slate-900">{{ difyKpis.tokens ?? '—' }}</div>
	            </div>
	            <div>
	              <div class="text-[11px] text-slate-500">Chunks</div>
	              <div class="text-sm font-bold text-slate-900">{{ difyKpis.chunks ?? '—' }}</div>
	            </div>
	            <div>
	              <div class="text-[11px] text-slate-500">Indexing</div>
	              <div class="text-sm font-bold text-slate-900">{{ difyKpis.indexing_status ?? '—' }}</div>
	            </div>
	          </div>
	        </div>
	      </div>

	      <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
	        <button (click)="closeEditModal()"
	          class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-sm font-semibold text-slate-700">
	          Cancel
	        </button>
	        <button (click)="saveMeta()"
	          class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
	          Save
	        </button>
	      </div>
	    </div>
	  </div>
	  `
})
export class KnowledgeDocComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private dify = inject(DifyService);
  private toast = inject(ToastService);

  docId = '';
  doc: any = null;
  pdfUrl: SafeResourceUrl | null = null;
  markdownText: string | null = null;
  private objectUrl: string | null = null;
  private mermaidInitialized = false;

  selectedAgent: 'KB_SEARCH' | 'DILIGENCE' | 'MASTER_COO' = 'KB_SEARCH';
  messages: ChatMsg[] = [];
  userInput = '';
  isThinking = false;

  showEditModal = false;
  propagateToDify = false;
  editForm: any = {
    title: '',
    description: '',
    ui_category: 'UNIVERSAL',
    doc_type: 'REGULATORY',
    agent_target: '',
    icon_name: 'file-text',
    display_date: '',
    visibility: 'INTERNAL',
    source_url: ''
  };
  difyLinkLabel: string | null = null;
  difyKpis: any | null = null;

  isUploading = false;
  uploadMsg: string | null = null;
  uploadError: string | null = null;

  ngOnInit() {
    this.docId = String(this.route.snapshot.paramMap.get('id') || '');
    this.loadDoc();
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      try { URL.revokeObjectURL(this.objectUrl); } catch { /* ignore */ }
      this.objectUrl = null;
    }
  }

  private loadDoc() {
    this.http.get<any>(`/api/kb/${encodeURIComponent(this.docId)}`).subscribe({
      next: (doc) => {
        this.doc = doc;
        this.markdownText = null;
        this.refreshDifyKpis();
        // Important: do NOT iframe directly to /api/kb/:id/file because the Authorization
        // header from our JWT interceptor is not attached to <iframe> requests.
        // Instead, fetch as a blob via HttpClient (auth header included), then display
        // using a safe object URL.
        if (doc?.file_path) this.loadFileBlob();
        else {
          this.revokeObjectUrl();
          this.pdfUrl = null;
        }
      },
      error: () => {
        this.doc = null;
        this.revokeObjectUrl();
        this.pdfUrl = null;
        this.markdownText = null;
        this.difyLinkLabel = null;
        this.difyKpis = null;
      }
    });
  }

  private refreshDifyKpis(): void {
    this.difyKpis = null;
    this.difyLinkLabel = null;
    const embedding = String(this.doc?.embedding_id || '').trim();
    const m = embedding.match(/^([0-9a-f-]{36}):([0-9a-f-]{36})$/i);
    if (!m) return;
    const datasetId = m[1];
    const documentId = m[2];
    this.difyLinkLabel = `${datasetId}:${documentId}`;
    this.http.get<any>(`/api/dify/datasets/${encodeURIComponent(datasetId)}/documents/${encodeURIComponent(documentId)}`).subscribe({
      next: (detail) => {
        // These keys vary a bit by Dify version; we normalize to a small KPI card.
        const d = detail?.document || detail || {};
        this.difyKpis = {
          word_count: d.word_count ?? d.words ?? null,
          tokens: d.tokens ?? d.token_count ?? null,
          chunks: d.chunk_count ?? d.chunks ?? null,
          indexing_status: d.indexing_status ?? d.status ?? null,
        };
      },
      error: () => {
        this.difyKpis = null;
      }
    });
  }

  openEditModal(): void {
    if (!this.doc) return;
    this.showEditModal = true;
    this.propagateToDify = false;
    this.editForm = {
      title: this.doc?.title || '',
      description: this.doc?.description || '',
      ui_category: this.doc?.ui_category || this.doc?.category || 'UNIVERSAL',
      doc_type: this.doc?.doc_type || 'REGULATORY',
      agent_target: this.doc?.agent_target || '',
      icon_name: this.doc?.icon_name || 'file-text',
      display_date: this.doc?.display_date || '',
      visibility: this.doc?.visibility || 'INTERNAL',
      source_url: this.doc?.source_url || ''
    };
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  saveMeta(): void {
    const payload = {
      title: String(this.editForm.title || '').trim(),
      description: String(this.editForm.description || '').trim(),
      ui_category: String(this.editForm.ui_category || '').trim().toUpperCase(),
      doc_type: String(this.editForm.doc_type || '').trim().toUpperCase(),
      agent_target: String(this.editForm.agent_target || '').trim(),
      icon_name: String(this.editForm.icon_name || '').trim(),
      display_date: String(this.editForm.display_date || '').trim(),
      visibility: String(this.editForm.visibility || '').trim().toUpperCase(),
      source_url: String(this.editForm.source_url || '').trim(),
      propagate_to_dify: this.propagateToDify
    };
    this.http.patch<any>(`/api/kb/${encodeURIComponent(this.docId)}/meta`, payload).subscribe({
      next: (res) => {
        this.doc = res?.doc || this.doc;
        this.showEditModal = false;
        this.refreshDifyKpis();
      },
      error: (e) => {
        const msg = e?.error?.error || e?.message || 'Failed to save';
        this.toast.error(String(msg));
      }
    });
  }

  private loadFileBlob(): void {
    const url = `/api/kb/${encodeURIComponent(this.docId)}/file`;
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.revokeObjectUrl();
        const mime = (blob.type || '').toLowerCase();
        const isPdf = mime.includes('pdf') || String(this.doc?.mime_type || '').toLowerCase().includes('pdf');
        const isMarkdown =
          mime.includes('text/') ||
          String(this.doc?.mime_type || '').toLowerCase().includes('markdown') ||
          String(this.doc?.filename || '').toLowerCase().endsWith('.md') ||
          String(this.doc?.filename || '').toLowerCase().endsWith('.mmd');

        if (isPdf) {
          this.markdownText = null;
          this.objectUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
          return;
        }

        if (isMarkdown) {
          this.pdfUrl = null;
          blob.text().then((text) => {
            this.markdownText = text;
            // Render mermaid blocks if present
            setTimeout(() => this.tryRenderMermaid(), 0);
          });
          return;
        }

        // Unknown file type: treat as missing preview
        this.pdfUrl = null;
        this.markdownText = null;
      },
      error: (err) => {
        this.revokeObjectUrl();
        this.pdfUrl = null;
        this.markdownText = null;
        const msg = err?.error?.error || err?.message || 'Failed to load PDF';
        this.messages.push({
          role: 'agent',
          content: `Document viewer error: ${String(msg)}\n\nIf this is a permissions issue, please log in again and retry.`,
          ts: Date.now()
        });
      }
    });
  }

  private async tryRenderMermaid(): Promise<void> {
    if (!this.markdownText) return;

    const host = document.querySelector('app-knowledge-doc');
    if (!host) return;

    // Find mermaid code blocks produced by markdown renderer: <pre><code class="language-mermaid">...</code></pre>
    const codeBlocks = Array.from(host.querySelectorAll('pre > code.language-mermaid'));
    if (codeBlocks.length === 0) return;

    // Replace <pre><code> with <div class="mermaid">...</div>
    for (const code of codeBlocks) {
      const pre = code.parentElement;
      if (!pre) continue;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent || '';
      pre.replaceWith(div);
    }

    // Lazy-load mermaid only when needed
    const mermaid = (await import('mermaid')).default;
    if (!this.mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });
      this.mermaidInitialized = true;
    }

    try {
      await mermaid.run({ querySelector: 'div.mermaid' });
    } catch {
      // Non-fatal: leave code blocks as-is if render fails
    }
  }

  openSource() {
    if (!this.doc?.source_url) return;
    window.open(String(this.doc.source_url), '_blank', 'noopener,noreferrer');
  }

  onEnter(ev: Event) {
    const kev = ev as KeyboardEvent;
    if (kev.shiftKey) return;
    kev.preventDefault();
    this.send();
  }

  send() {
    const q = this.userInput.trim();
    if (!q || this.isThinking) return;
    this.userInput = '';

    const docTitle = this.doc?.title || this.docId;
    const contextPrefix =
      `Context (KB doc): ${docTitle} (doc_id: ${this.docId}). ` +
      `Answer strictly based on the document content available in the KB; if not found, say what is missing.`;

    this.messages.push({ role: 'user', content: q, ts: Date.now() });
    const agentMsg: ChatMsg = { role: 'agent', content: '', streaming: true, ts: Date.now() };
    this.messages.push(agentMsg);

    this.isThinking = true;

    const inputs = { kb_doc_id: this.docId, kb_doc_title: docTitle };
    const obs = this.dify.sendMessageStreamed(`${contextPrefix}\n\nUser question: ${q}`, inputs, this.selectedAgent);

    let sub: any;
    sub = obs.subscribe({
      next: (evt: StreamEvent) => {
        if (evt.type === 'chunk') {
          agentMsg.content += evt.text;
        } else if (evt.type === 'done') {
          agentMsg.content = evt.response.answer || agentMsg.content || '(no answer)';
          agentMsg.streaming = false;
          this.isThinking = false;
          sub?.unsubscribe?.();
        }
      },
      error: (e: any) => {
        agentMsg.content = `Error contacting agent: ${e?.message || 'unknown error'}`;
        agentMsg.streaming = false;
        this.isThinking = false;
        sub?.unsubscribe?.();
      }
    });
  }

  onUploadFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) return;

    this.isUploading = true;
    this.uploadMsg = null;
    this.uploadError = null;

    const form = new FormData();
    form.append('file', file);
    form.append('doc_id', this.docId || '');
    form.append('title', this.doc?.title || file.name.replace(/\.(pdf|md|mmd)$/i, ''));
    form.append('description', this.doc?.description || '');
    form.append('doc_type', this.doc?.doc_type || 'REGULATORY');
    form.append('ui_category', this.doc?.ui_category || '');
    form.append('agent_target', this.doc?.agent_target || '');
    form.append('icon_name', this.doc?.icon_name || 'file-text');
    form.append('display_date', this.doc?.display_date || '');
    form.append('visibility', this.doc?.visibility || 'INTERNAL');
    if (this.doc?.source_url) form.append('source_url', String(this.doc.source_url));

    this.http.post<any>('/api/kb/upload', form).subscribe({
      next: () => {
        input.value = '';
        this.isUploading = false;
        this.uploadMsg = `Uploaded “${file.name}”.`;
        this.loadDoc();
      },
      error: (e) => {
        input.value = '';
        this.isUploading = false;
        const msg = e?.error?.error || e?.message || 'Upload failed';
        this.uploadError = String(msg);
      }
    });
  }
}
