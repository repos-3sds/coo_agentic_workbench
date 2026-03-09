import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { StepperSection, SignOffGroup, SIGN_OFF_GROUPS, SignOffGroupId } from '../../npa-draft-builder.component';

@Component({
   selector: 'app-npa-section-stepper',
   standalone: true,
   imports: [CommonModule, SharedIconsModule],
   templateUrl: './npa-section-stepper.component.html',
   styleUrls: ['./npa-section-stepper.component.css']
})
export class NpaSectionStepperComponent {
   @Input() sections: StepperSection[] = [];
   @Input() activeSectionId = '';
   @Input() filledFields = 0;
   @Input() totalFields = 0;
   @Input() overallProgress = 0;
   @Input() requiredMissingBySection: Record<string, number> = {};

   @Output() sectionSelected = new EventEmitter<string>();

   selectSection(sectionId: string): void {
      this.sectionSelected.emit(sectionId);
   }

   getGroupForSection(sectionId: string): SignOffGroup {
      for (const group of SIGN_OFF_GROUPS) {
         if (group.sections.includes(sectionId)) return group;
      }
      if (sectionId.startsWith('APP')) {
         return SIGN_OFF_GROUPS.find(g => g.id === 'LCS') || SIGN_OFF_GROUPS[0];
      }
      return SIGN_OFF_GROUPS[0];
   }

   getSectionProgressColor(section: StepperSection): string {
      if (section.status === 'complete') return 'bg-emerald-500';
      if (section.status === 'partial') return 'bg-amber-500';
      if (section.status === 'streaming') return 'bg-blue-500';
      return 'bg-slate-300';
   }

   trackBySectionId(_index: number, section: StepperSection): string {
      return section.id;
   }

   missingRequired(sectionId: string): number {
      return Number(this.requiredMissingBySection?.[sectionId] || 0);
   }
}
