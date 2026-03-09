import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DraftSection, SectionProgress } from '../models/draft.models';

@Component({
  selector: 'app-draft-section-nav',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './draft-section-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftSectionNavComponent {
  @Input() sections: DraftSection[] = [];
  @Input() activeSectionIndex = 0;

  @Output() sectionSelected = new EventEmitter<number>();

  onSelect(index: number): void {
    this.sectionSelected.emit(index);
  }

  isAppendixBoundary(index: number): boolean {
    if (index === 0) return false;
    return this.sections[index].id.startsWith('APP') && !this.sections[index - 1].id.startsWith('APP');
  }

  getSectionProgress(sec: DraftSection): SectionProgress {
    let filled = 0, total = 0, missingRequired = 0;
    const check = (fields: { value: string; required: boolean; bulletItems?: string[] }[]) => {
      for (const f of fields) {
        total++;
        if (f.value || (f.bulletItems && f.bulletItems.length > 0)) filled++;
        else if (f.required) missingRequired++;
      }
    };
    check(sec.fields);
    if (sec.subSections) {
      for (const sub of sec.subSections) check(sub.fields);
    }
    return { filled, total, missingRequired };
  }

  getProgressPercent(sec: DraftSection): number {
    const p = this.getSectionProgress(sec);
    return p.total > 0 ? Math.round((p.filled / p.total) * 100) : 0;
  }
}
