import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { UserService } from '../../services/user.service';

type StudioDoc = {
  id: string;
  owner_user_id: string;
  title: string;
  description?: string | null;
  doc_type?: string | null;
  ui_category?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | string;
  visibility: 'PRIVATE' | 'INTERNAL' | string;
  kb_doc_id?: string | null;
  updated_at?: string;
};

@Component({
  selector: 'app-knowledge-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedIconsModule],
  template: `
  <div class="h-full w-full bg-slate-50 flex flex-col">
    <header class="flex-none bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div>
        <div class="text-xs text-slate-500">Knowledge & Evidence</div>
        <div class="text-lg font-bold text-slate-900">Knowledge Studio</div>
        <div class="text-xs text-slate-500 mt-0.5">
          Create private drafts from PDFs/Markdown/emails and publish to KB after approval.
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button (click)="openCreateModal()"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
          <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
          New Draft
        </button>
      </div>
    </header>

    <div class="flex-1 min-h-0 p-6 space-y-4 overflow-y-auto">
      <div class="flex items-center gap-2">
        <button (click)="scope='my'; load()"
          class="px-3 py-1.5 rounded-lg text-sm font-semibold border"
          [class.bg-white]="scope!=='my'" [class.bg-slate-900]="scope==='my'"
          [class.text-white]="scope==='my'" [class.text-slate-700]="scope!=='my'"
          [class.border-slate-200]="scope!=='my'" [class.border-slate-900]="scope==='my'">
          My Drafts
        </button>
        <button *ngIf="canReview()" (click)="scope='submitted'; load()"
          class="px-3 py-1.5 rounded-lg text-sm font-semibold border"
          [class.bg-white]="scope!=='submitted'" [class.bg-slate-900]="scope==='submitted'"
          [class.text-white]="scope==='submitted'" [class.text-slate-700]="scope!=='submitted'"
          [class.border-slate-200]="scope!=='submitted'" [class.border-slate-900]="scope==='submitted'">
          Pending Approval
        </button>
      </div>

      <div *ngIf="error" class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
        {{ error }}
      </div>

      <div *ngIf="docs.length === 0" class="bg-white border border-slate-200 rounded-2xl p-10 text-center">
        <div class="w-12 h-12 rounded-xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
          <lucide-icon name="file-text" class="w-6 h-6 text-slate-500"></lucide-icon>
        </div>
        <div class="text-sm font-semibold text-slate-800">No drafts yet</div>
        <div class="text-xs text-slate-500 mt-1">Create a draft, generate Markdown, then submit for approval.</div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <button *ngFor="let d of docs" (click)="openDoc(d)"
          class="text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-bold text-slate-900 truncate">{{ d.title }}</div>
              <div class="text-xs text-slate-500 mt-1 line-clamp-2">{{ d.description || '—' }}</div>
            </div>
            <span class="shrink-0 text-[11px] px-2 py-1 rounded-full border"
              [class.bg-amber-50]="d.status==='DRAFT'"
              [class.text-amber-700]="d.status==='DRAFT'"
              [class.border-amber-200]="d.status==='DRAFT'"
              [class.bg-blue-50]="d.status==='SUBMITTED'"
              [class.text-blue-700]="d.status==='SUBMITTED'"
              [class.border-blue-200]="d.status==='SUBMITTED'"
              [class.bg-green-50]="d.status==='APPROVED'"
              [class.text-green-700]="d.status==='APPROVED'"
              [class.border-green-200]="d.status==='APPROVED'"
              [class.bg-red-50]="d.status==='REJECTED'"
              [class.text-red-700]="d.status==='REJECTED'"
              [class.border-red-200]="d.status==='REJECTED'">
              {{ d.status }}
            </span>
          </div>

          <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span class="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">{{ d.doc_type || 'DOC' }}</span>
            <span class="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">{{ d.ui_category || 'UNIVERSAL' }}</span>
            <span class="ml-auto" *ngIf="d.kb_doc_id">Published</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Create modal -->
    <div *ngIf="showCreate" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-slate-900/40" (click)="closeCreateModal()"></div>
      <div class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div class="text-xs text-slate-500">Knowledge Studio</div>
            <div class="text-lg font-bold text-slate-900">New Draft</div>
          </div>
          <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-600" (click)="closeCreateModal()">
            <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Title</label>
            <input [(ngModel)]="createForm.title" type="text" placeholder="e.g. MAS 626 Summary + Checklist"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1">Description (optional)</label>
            <textarea [(ngModel)]="createForm.description" rows="3" placeholder="What is this draft for?"
              class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"></textarea>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Doc type</label>
              <select [(ngModel)]="createForm.doc_type"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="REPORT">REPORT</option>
                <option value="POLICY">POLICY</option>
                <option value="WORKFLOW">WORKFLOW</option>
                <option value="CHECKLIST">CHECKLIST</option>
                <option value="TEMPLATE">TEMPLATE</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select [(ngModel)]="createForm.ui_category"
                class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
                <option value="UNIVERSAL">UNIVERSAL</option>
                <option value="AGENT">AGENT</option>
                <option value="WORKFLOW">WORKFLOW</option>
              </select>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
          <button (click)="closeCreateModal()"
            class="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-sm font-semibold text-slate-700">
            Cancel
          </button>
          <button (click)="createDoc()"
            class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
  `,
})
export class KnowledgeStudioComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private userService = inject(UserService);

  docs: StudioDoc[] = [];
  error: string | null = null;
  scope: 'my' | 'submitted' | 'all' = 'my';

  showCreate = false;
  createForm = {
    title: '',
    description: '',
    doc_type: 'REPORT',
    ui_category: 'UNIVERSAL',
  };

  canReview = computed(() => this.userService.currentUser().role.startsWith('APPROVER_') || this.userService.currentUser().role === 'COO' || this.userService.currentUser().role === 'ADMIN');

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.error = null;
    const scope = this.scope === 'submitted' ? 'submitted' : 'my';
    this.http.get<{ docs: StudioDoc[] }>('/api/studio/docs', { params: { scope } }).subscribe({
      next: (res) => this.docs = Array.isArray(res?.docs) ? res.docs : [],
      error: (e) => this.error = e?.error?.error || e?.message || 'Failed to load drafts'
    });
  }

  openDoc(d: StudioDoc) {
    this.router.navigate(['/knowledge/studio', d.id]);
  }

  openCreateModal() {
    this.showCreate = true;
    this.createForm = { title: '', description: '', doc_type: 'REPORT', ui_category: 'UNIVERSAL' };
  }

  closeCreateModal() {
    this.showCreate = false;
  }

  createDoc() {
    const title = (this.createForm.title || '').trim();
    if (!title) {
      this.error = 'Title is required.';
      return;
    }

    this.http.post<{ id: string }>('/api/studio/docs', {
      title,
      description: (this.createForm.description || '').trim() || null,
      doc_type: this.createForm.doc_type,
      ui_category: this.createForm.ui_category,
    }).subscribe({
      next: (res) => {
        if (res?.id) this.router.navigate(['/knowledge/studio', res.id]);
        this.showCreate = false;
        this.load();
      },
      error: (e) => this.error = e?.error?.error || e?.message || 'Failed to create'
    });
  }
}

