import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-evidence-library',
  standalone: true,
  imports: [CommonModule, SharedIconsModule],
  templateUrl: './evidence-library.html',
  styleUrl: './evidence-library.css',
})
export class EvidenceLibraryComponent implements OnInit {
  activeCategory: 'ALL' | 'PRECEDENTS' | 'PATTERNS' | 'AUDITS' | 'EXCEPTIONS' = 'ALL';
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  evidenceItems: any[] = [];
  isLoading = true;

  ngOnInit() {
    const tab = String(this.route.snapshot.queryParamMap.get('tab') || '').toUpperCase();
    if (tab === 'PATTERNS') this.activeCategory = 'PATTERNS';
    if (tab === 'PRECEDENTS') this.activeCategory = 'PRECEDENTS';
    if (tab === 'AUDITS') this.activeCategory = 'AUDITS';
    if (tab === 'EXCEPTIONS') this.activeCategory = 'EXCEPTIONS';
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
    this.http.get<any[]>('/api/evidence').subscribe({
      next: (items) => {
        this.evidenceItems = items.map(d => ({
          ...d,
          id: d.record_id,
          type: d.evidence_type,
          icon: d.icon_name,
          date: d.display_date || (d.event_date ? new Date(d.event_date).toLocaleDateString() : 'N/A'),
          desc: d.description,
          score: d.relevance_score
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[EvidenceLibrary] Failed to fetch data from database', err);
        this.isLoading = false;
      }
    });
  }

  get filteredItems() {
    if (this.activeCategory === 'PATTERNS') return [];
    if (this.activeCategory === 'ALL') return this.evidenceItems;
    return this.evidenceItems.filter(item => item.type === this.activeCategory);
  }

  get precedentPatterns() {
    const precedents = this.evidenceItems.filter(i => i.type === 'PRECEDENTS');
    const total = precedents.length;
    const approved = precedents.filter(p => p.status === 'APPROVED').length;
    const rejected = precedents.filter(p => p.status === 'REJECTED').length;

    const scores = precedents.map(p => (typeof p.score === 'number' ? p.score : null)).filter(s => s !== null) as number[];
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const keywordCounts = new Map<string, number>();
    const stop = new Set([
      'the', 'and', 'for', 'with', 'via', 'from', 'into', 'over', 'under', 'to', 'of', 'in', 'a', 'an', 'on', 'by',
      'product', 'agreement', 'platform', 'listed', 'multi', 'asset'
    ]);
    for (const p of precedents) {
      const words = String(p.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\\s-]/g, ' ')
        .split(/\\s+/)
        .map(w => w.trim())
        .filter(w => w.length >= 3 && !stop.has(w));
      for (const w of words) keywordCounts.set(w, (keywordCounts.get(w) || 0) + 1);
    }
    const topKeywords = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v]) => ({ k, v }));

    return [
      {
        id: 'PAT-001',
        icon: 'radar',
        title: 'Precedent Outcome Mix',
        desc: total ? `Approved ${approved}/${total}, Rejected ${rejected}/${total}.` : 'No precedents available yet.',
        metric: total ? `${Math.round((approved / total) * 100)}% approved` : 'N/A',
      },
      {
        id: 'PAT-002',
        icon: 'bar-chart-2',
        title: 'Average Relevance Score',
        desc: avgScore === null ? 'No scored precedents yet.' : `Average relevance across scored precedents: ${avgScore}%.`,
        metric: avgScore === null ? 'N/A' : `${avgScore}%`,
      },
      {
        id: 'PAT-003',
        icon: 'search',
        title: 'Common Themes (from titles)',
        desc: topKeywords.length ? topKeywords.map(t => `${t.k} (${t.v})`).join(', ') : 'Not enough data to infer themes.',
        metric: topKeywords.length ? `${topKeywords[0].k}` : 'N/A',
      },
    ];
  }
}
