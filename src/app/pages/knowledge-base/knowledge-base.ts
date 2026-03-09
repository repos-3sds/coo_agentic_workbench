import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedIconsModule],
  templateUrl: './knowledge-base.html',
  styleUrl: './knowledge-base.css'
})
export class KnowledgeBaseComponent implements OnInit {
  activeTab: 'ALL' | 'UNIVERSAL' | 'AGENT' | 'WORKFLOW' = 'ALL';
  private http = inject(HttpClient);
  private router = inject(Router);

  // Fallback (used when DB/API is unavailable)
  private fallbackUniversalDocs = [
    { title: 'MBS Group NPA Policy & Standard', id: 'MBS_10_S_0012_GR', desc: 'Overarching global policy (RMG-OR). Defines NTG vs Variation vs Existing classifications and standard 1-year validity.', type: 'PDF', date: 'Oct 2025', icon: 'file-text' },
    { title: 'GFM NPA Standard Operating Procedures', id: 'GFM_SOP_v2.3', desc: 'Stricter GFM-specific rules. Dictates mandatory 5 sign-offs for cross-border deals and 3-loop-back circuit breaker.', type: 'Docs', date: 'Jan 2026', icon: 'book-open' },
    { title: 'Global Prohibited & Sanctions List', id: 'SANCTIONS_2026', desc: 'OFAC, UN, EU sanctions list plus internal prohibited products. "Hard Stop" reference for Ideation Agent.', type: 'Database', date: 'Live', icon: 'alert-triangle' },
    { title: 'Regulatory & License Mapping Matrix', id: 'REG_MATRIX_Q1', desc: 'Matrix of allowed activities per jurisdiction (MAS in SG, HKMA in HK, FCA in UK).', type: 'Sheet', date: 'Feb 2026', icon: 'map' },
    { title: 'Historical NPA Master Archive', id: 'NPA_ARCHIVE_DB', desc: 'Indexed database of all past NPA documents (1,784+ records) for similarity searches.', type: 'Database', date: 'Live', icon: 'archive' },
    { title: 'MBS Group Holdings Liquidity Policy', id: 'MBS_LIQ_POL', desc: 'Enterprise-wide liquidity requirements affecting GFM funding and capital products.', type: 'PDF', date: 'Dec 2025', icon: 'droplet' },
    { title: 'GFM Data Management Policy (PURE)', id: 'D4D_PURE_v1', desc: 'Design for Data (D4D) standards for ensuring Risk Data Aggregation and Reporting compliance.', type: 'Docs', date: 'Nov 2025', icon: 'database' },
    { title: 'Product Approval Committee Charter', id: 'PAC_CHARTER_26', desc: 'Group PAC mandate for approving New-To-Group (NTG) products before the NPA process begins.', type: 'PDF', date: 'Jan 2026', icon: 'users' },
    { title: 'External Platform Review Standards', id: 'EXT_PLATFORM_STDS', desc: 'Checklists and risk controls for connecting GFM product flows to third-party vendor platforms.', type: 'Sheet', date: 'Aug 2025', icon: 'monitor-speaker' },
    { title: 'MBS Group Sustainability Framework', id: 'ESG_FRAMEWORK', desc: 'Definitions and criteria for classifying products as "Green", "Social", or "Sustainable".', type: 'PDF', date: 'May 2025', icon: 'leaf' }
  ];

  private fallbackAgentDocs = [
    { title: 'NPA Decision Matrix / Classification Tree', agent: 'Ideation', desc: 'Ontological decision tree for NTG vs. Variation vs. Existing mapping.', icon: 'git-branch' },
    { title: 'Evergreen Eligibility Master List', agent: 'Ideation', desc: 'Constantly maintained list of products eligible for the 3-year Evergreen track.', icon: 'list-checks' },
    { title: 'Evergreen Usage Tracker API', agent: 'Ideation', desc: 'Real-time tracker of current Evergreen notional usage against the $500M GFM-wide cap.', icon: 'activity' },
    { title: 'Approved FX Bundles List', agent: 'Ideation', desc: 'Catalog of 28+ pre-approved FX derivative bundles (KIKO, Boosted KO Forward) bypassing arbitration.', icon: 'package' },
    { title: 'Cross-Border Booking Rulebook', agent: 'Regulatory', desc: 'Legal implications for cross-location trades (e.g., SG booking with HK entity).', icon: 'globe' },
    { title: 'Third-Party Comm Channels Risk Matrix', agent: 'Compliance', desc: 'Classification matrix (High/Low impact) for using WhatsApp, WeChat, external sites.', icon: 'message-square' },
    { title: 'Standard Legal Template Library', agent: 'Legal', desc: 'Approved boilerplate clauses for ISDA, GMRA, NAFMII, and CSA agreements.', icon: 'scale' },
    { title: 'Financial Crime Risk Guidelines (Appx 3)', agent: 'Compliance', desc: 'Questionnaires and compliance standards for AML, CFT, and Fraud assessment.', icon: 'shield-alert' },
    { title: 'Accounting Treatment Standards', agent: 'Finance', desc: 'Rules determining Trading Book vs Banking Book, FVPL vs FVOCI.', icon: 'calculator' },
    { title: 'ROAE Sensitivity Analysis Templates', agent: 'Finance', desc: 'Required calculation templates for any product with a notional >$20M.', icon: 'trending-up' },
    { title: 'Global Tax Protocol Database', agent: 'Finance', desc: 'Guidelines on withholding taxes, VAT, and transfer pricing implications per jurisdiction.', icon: 'landmark' },
    { title: 'Approved Pricing Models Registry', agent: 'Market Risk', desc: 'Mathematically validated pricing models and their specific validation expiry dates.', icon: 'bar-chart-2' },
    { title: 'Risk Metric Thresholds', agent: 'Market Risk', desc: 'Acceptable tolerances for VaR, IR/FX Delta, Vega, LCR, and NSFR impacts.', icon: 'thermometer' },
    { title: 'Credit Exposure (PCE/SACCR) Methodologies', agent: 'Credit Risk', desc: 'Standard formulas for pre-settlement and counterparty credit risk calculations.', icon: 'percent' },
    { title: 'Eligible Collateral Master List', agent: 'Credit Risk', desc: 'Basel-eligible HQLA and acceptable collateral haircut matrices.', icon: 'shield-check' },
    { title: 'System Booking Schemas & Typologies', agent: 'Tech & Ops', desc: 'Mapping of standard products to Murex/Mini/FA typologies.', icon: 'server' },
    { title: 'BCM Standards (BIA/RTO/RPO)', agent: 'Tech & Ops', desc: 'Rules for required RTO/RPO limits and Business Impact Analysis generation.', icon: 'hard-drive' }
  ];

  private fallbackWorkflowDocs = [
    { title: 'SOP SLA Matrix', desc: 'Turnaround times for paths (e.g., 48 hours for Impending Deal, targets for Full NPA).', icon: 'clock' },
    { title: 'PIR Playbook', desc: 'Rules for triggering PIRs (6 months post-launch), tracking conditions, and repeating failed PIRs.', icon: 'clipboard-check' },
    { title: 'Governance Hierarchy & Escalation Paths', desc: 'Contact mapping for GFM COO Office, PAC, and Forum routing.', icon: 'network' },
    { title: 'Bundling Arbitration Team Charter', desc: 'Arbitration rules when a bundle fails one of the 8 safety conditions.', icon: 'gavel' },
    { title: 'Fast-Track Dormant Reactivation Rules', desc: 'Requirements to bypass NPA Lite for products dormant under 3 years with no variations.', icon: 'zap' }
  ];

  universalDocs: any[] = [...this.fallbackUniversalDocs];
  agentDocs: any[] = [...this.fallbackAgentDocs];
  workflowDocs: any[] = [...this.fallbackWorkflowDocs];
  isLoading = true;

  // ─── Upload modal state ─────────────────────────────────────
  showUploadModal = false;
  uploadError: string | null = null;
  showDifySyncModal = false;
  difySyncError: string | null = null;

  difySyncResult: {
    dataset_id: string;
    imported: number;
    skipped: number;
    errors: number;
    docs: Array<{
      doc_id: string;
      title: string;
      status: 'IMPORTED' | 'SKIPPED' | 'ERROR';
      reason?: string;
      downloaded_pdf?: boolean;
      source_url?: boolean;
    }>;
  } | null = null;
  difySyncForm = {
    dataset_id: '',
    ui_category: 'UNIVERSAL' as 'UNIVERSAL' | 'AGENT' | 'WORKFLOW',
    doc_type: 'REGULATORY',
    agent_target: '',
    icon_name: 'file-text',
    visibility: 'INTERNAL' as 'INTERNAL' | 'PUBLIC'
  };
  uploadForm = {
    title: '',
    description: '',
    ui_category: 'UNIVERSAL' as 'UNIVERSAL' | 'AGENT' | 'WORKFLOW',
    doc_type: 'REGULATORY',
    agent_target: '',
    icon_name: 'file-text',
    display_date: '',
    visibility: 'INTERNAL' as 'INTERNAL' | 'PUBLIC',
    source_url: ''
  };
  uploadFile: File | null = null;

  // ─── Dify Manage modal state ─────────────────────────────────
  showDifyManageModal = false;
  difyManageError: string | null = null;
  difyDatasets: any[] = [];
  selectedDifyDataset: any | null = null;
  selectedDatasetDocuments: any[] = [];
  isEditingDataset = false;
  datasetEditForm = { name: '', description: '' };

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    this.http.get<any[]>('/api/knowledge').subscribe({
      next: (docs) => {
        const list = Array.isArray(docs) ? docs : [];

        // Normalize + map kb_documents UI columns to expected template fields
        const mapDoc = (d: any) => {
          const category = String(d?.category || d?.ui_category || '').trim().toUpperCase();
          return {
            ...d,
            category,
            icon: d.icon_name || d.icon || 'file-text',
            desc: d.description,
            agent: d.agent_target,
            type: d.doc_type || d.doc_format || d.type || null,
            date: d.display_date || (d.last_synced ? new Date(d.last_synced).toLocaleDateString() : 'N/A')
          };
        };

        const mapped = list.map(mapDoc);

        const universal = mapped.filter(d => d.category === 'UNIVERSAL');
        const agent = mapped.filter(d => d.category === 'AGENT');
        const workflow = mapped.filter(d => d.category === 'WORKFLOW');

        // If DB returns any docs at all, prefer DB truth. Only fall back when API is unreachable/empty.
        if (mapped.length > 0) {
          this.universalDocs = universal;
          this.agentDocs = agent;
          this.workflowDocs = workflow;
        } else {
          this.universalDocs = [...this.fallbackUniversalDocs];
          this.agentDocs = [...this.fallbackAgentDocs];
          this.workflowDocs = [...this.fallbackWorkflowDocs];
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.warn('[KnowledgeBase] Failed to fetch data from DB; using fallback.', err);
        this.isLoading = false;
      }
    });
  }

  openDoc(doc: any) {
    // Prefer doc_id (stable public identifier); `id` is often an auto-increment PK.
    const id = doc?.doc_id || doc?.docId || doc?.id;
    if (!id) return;
    this.router.navigate(['/knowledge/base', id]);
  }

  openUploadModal() {
    this.showUploadModal = true;
    this.uploadError = null;
    this.uploadFile = null;
    this.uploadForm = {
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
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.uploadError = null;
    this.uploadFile = null;
  }

  openDifySyncModal() {
    this.showDifySyncModal = true;
    this.difySyncError = null;
    this.difySyncResult = null;
    this.difySyncForm = {
      dataset_id: '',
      ui_category: this.activeTab === 'AGENT' ? 'AGENT' : (this.activeTab === 'WORKFLOW' ? 'WORKFLOW' : 'UNIVERSAL'),
      doc_type: 'REGULATORY',
      agent_target: '',
      icon_name: 'file-text',
      visibility: 'INTERNAL'
    };
  }

  closeDifySyncModal() {
    this.showDifySyncModal = false;
    this.difySyncError = null;
    this.difySyncResult = null;
  }

  // ─── Dify Manage (datasets + documents) ─────────────────────

  openDifyManageModal() {
    this.showDifyManageModal = true;
    this.difyManageError = null;
    this.difyDatasets = [];
    this.selectedDifyDataset = null;
    this.selectedDatasetDocuments = [];
    this.isEditingDataset = false;
    this.datasetEditForm = { name: '', description: '' };
    this.loadDifyDatasets();
  }

  closeDifyManageModal() {
    this.showDifyManageModal = false;
    this.difyManageError = null;
    this.isEditingDataset = false;
  }

  loadDifyDatasets() {
    this.difyManageError = null;
    this.http.get<any>('/api/dify/datasets').subscribe({
      next: (res) => {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        this.difyDatasets = items;
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Failed to fetch datasets';
        this.difyManageError = String(msg);
        this.difyDatasets = [];
      }
    });
  }

  selectDifyDataset(ds: any) {
    this.selectedDifyDataset = ds;
    this.selectedDatasetDocuments = [];
    this.isEditingDataset = false;
    this.loadSelectedDatasetDocuments();
  }

  loadSelectedDatasetDocuments() {
    if (!this.selectedDifyDataset?.id) return;
    const datasetId = String(this.selectedDifyDataset.id);
    this.http.get<any>(`/api/dify/datasets/${encodeURIComponent(datasetId)}/documents`, { params: { page: 1, limit: 50 } }).subscribe({
      next: (res) => {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res?.documents) ? res.documents : [];
        this.selectedDatasetDocuments = items;
      },
      error: () => {
        this.selectedDatasetDocuments = [];
      }
    });
  }

  startEditSelectedDataset() {
    if (!this.selectedDifyDataset) return;
    this.isEditingDataset = true;
    this.datasetEditForm = {
      name: String(this.selectedDifyDataset?.name || ''),
      description: String(this.selectedDifyDataset?.description || ''),
    };
  }

  cancelEditSelectedDataset() {
    this.isEditingDataset = false;
  }

  saveSelectedDataset() {
    if (!this.selectedDifyDataset?.id) return;
    const datasetId = String(this.selectedDifyDataset.id);
    this.http.patch<any>(`/api/dify/datasets/${encodeURIComponent(datasetId)}`, {
      name: (this.datasetEditForm.name || '').trim(),
      description: (this.datasetEditForm.description || '').trim()
    }).subscribe({
      next: () => {
        this.selectedDifyDataset = { ...this.selectedDifyDataset, name: this.datasetEditForm.name, description: this.datasetEditForm.description };
        this.isEditingDataset = false;
        this.loadDifyDatasets();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Failed to update dataset';
        this.difyManageError = String(msg);
      }
    });
  }

  get difySyncDocs() {
    return this.difySyncResult?.docs || [];
  }

  submitDifySync() {
    this.difySyncError = null;
    this.difySyncResult = null;

    const datasetId = (this.difySyncForm.dataset_id || '').trim();
    if (!datasetId) {
      this.difySyncError = 'Please enter a Dify Dataset ID.';
      return;
    }

    this.http.post<any>('/api/kb/dify/sync', {
      dataset_id: datasetId,
      ui_category: this.difySyncForm.ui_category,
      doc_type: this.difySyncForm.doc_type,
      agent_target: (this.difySyncForm.agent_target || '').trim() || null,
      icon_name: (this.difySyncForm.icon_name || 'file-text').trim(),
      visibility: this.difySyncForm.visibility
    }).subscribe({
      next: (res) => {
        this.difySyncResult = res;
        this.fetchData();
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Sync failed';
        this.difySyncError = String(msg);
      }
    });
  }

  onUploadFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] || null;
  }

  submitUpload() {
    this.uploadError = null;
    if (!this.uploadFile) {
      this.uploadError = 'Please choose a PDF or Markdown file.';
      return;
    }

    const inferredTitle = this.uploadFile.name.replace(/\.(pdf|md|mmd)$/i, '');
    const form = new FormData();
    form.append('file', this.uploadFile);
    form.append('title', (this.uploadForm.title || inferredTitle).trim());
    form.append('description', (this.uploadForm.description || '').trim());
    form.append('ui_category', this.uploadForm.ui_category);
    form.append('doc_type', this.uploadForm.doc_type);
    form.append('agent_target', (this.uploadForm.agent_target || '').trim());
    form.append('icon_name', (this.uploadForm.icon_name || 'file-text').trim());
    form.append('display_date', (this.uploadForm.display_date || '').trim());
    form.append('visibility', this.uploadForm.visibility);
    if ((this.uploadForm.source_url || '').trim()) form.append('source_url', this.uploadForm.source_url.trim());

    this.http.post<any>('/api/kb/upload', form).subscribe({
      next: (res) => {
        this.closeUploadModal();
        this.fetchData();
        if (res?.doc_id) this.router.navigate(['/knowledge/base', res.doc_id]);
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Upload failed';
        this.uploadError = String(msg);
      }
    });
  }
}
