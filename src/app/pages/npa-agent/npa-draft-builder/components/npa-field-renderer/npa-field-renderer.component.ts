import { Component, DoCheck, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../../../shared/icons/shared-icons.module';
import { NpaLineageBadgeComponent } from '../../../../../shared/components/npa-lineage-badge/npa-lineage-badge.component';
import { NpaStrategyBadgeComponent } from '../../../../../shared/components/npa-strategy-badge/npa-strategy-badge.component';
import { FieldState } from '../../npa-draft-builder.component';
import { Citation } from '../../../../../lib/npa-interfaces';

@Component({
   selector: 'app-npa-field-renderer',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      SharedIconsModule,
      NpaLineageBadgeComponent,
      NpaStrategyBadgeComponent
   ],
   templateUrl: './npa-field-renderer.component.html',
   styleUrls: ['./npa-field-renderer.component.css']
})
export class NpaFieldRendererComponent implements DoCheck {
   @Input() field!: FieldState;
   @Input() readOnly = false;

   @Output() fieldEdited = new EventEmitter<FieldState>();
   @Output() fieldCleared = new EventEmitter<FieldState>();
   @Output() askAgent = new EventEmitter<FieldState>();
   @Output() commentClicked = new EventEmitter<FieldState>();
   @Output() fileSelected = new EventEmitter<{ field: FieldState; event: Event }>();
   @Output() citationClick = new EventEmitter<Citation>(); // Emit when user clicks a KB citation

   @ViewChildren('autosize') autosizeTextareas!: QueryList<ElementRef<HTMLTextAreaElement>>;

   private lastObservedValue = '';
   private resizeScheduled = false;

   // ─── Field Editing ──────────────────────────────────────────

   onCitationClick(citation: Citation): void {
      this.citationClick.emit(citation);
   }

   startEditing(): void {
      this.field.isEditing = true;
   }

   finishEditing(): void {
      this.field.isEditing = false;
      if (this.field.value && this.field.lineage !== 'MANUAL') {
         this.field.lineage = 'ADAPTED';
      }
      this.fieldEdited.emit(this.field);
   }

   clearField(): void {
      this.field.value = '';
      this.field.lineage = 'MANUAL';
      this.field.confidence = undefined;
      this.field.source = undefined;
      this.fieldCleared.emit(this.field);
      this.scheduleAutosize();
   }

   onAskAgent(): void {
      this.askAgent.emit(this.field);
   }

   onCommentClick(): void {
      this.commentClicked.emit(this.field);
   }

   // ─── Bullet List ──────────────────────────────────────────────

   addBulletItem(): void {
      if (!this.field.bulletItems) this.field.bulletItems = [];
      this.field.bulletItems.push('');
      this.syncBulletToValue();
   }

   removeBulletItem(index: number): void {
      if (this.field.bulletItems) {
         this.field.bulletItems.splice(index, 1);
         this.syncBulletToValue();
      }
   }

   updateBulletItem(index: number, value: string): void {
      if (this.field.bulletItems) {
         this.field.bulletItems[index] = value;
         this.syncBulletToValue();
      }
   }

   private syncBulletToValue(): void {
      this.field.value = (this.field.bulletItems || []).filter(b => b.trim()).join('\n\u2022 ');
      if (this.field.value) this.field.value = '\u2022 ' + this.field.value;
      this.fieldEdited.emit(this.field);
   }

   // ─── Multiselect ──────────────────────────────────────────────

   toggleMultiSelectOption(option: string): void {
      if (!this.field.selectedOptions) this.field.selectedOptions = [];
      const idx = this.field.selectedOptions.indexOf(option);
      if (idx >= 0) {
         this.field.selectedOptions.splice(idx, 1);
      } else {
         this.field.selectedOptions.push(option);
      }
      this.field.value = this.field.selectedOptions.join(', ');
      this.fieldEdited.emit(this.field);
   }

   // ─── Yes / No ──────────────────────────────────────────────────

   setYesNo(value: boolean): void {
      this.field.yesNoValue = value;
      this.field.value = value ? 'Yes' : 'No';
      if (!value) this.field.conditionalText = '';
      this.fieldEdited.emit(this.field);
   }

   updateConditionalText(text: string): void {
      this.field.conditionalText = text;
      this.field.value = `${this.field.yesNoValue ? 'Yes' : 'No'} \u2014 ${text}`;
      this.fieldEdited.emit(this.field);
   }

   // ─── Checkbox Group ───────────────────────────────────────────

   toggleCheckboxOption(option: string): void {
      if (!this.field.selectedOptions) this.field.selectedOptions = [];
      const idx = this.field.selectedOptions.indexOf(option);
      if (idx >= 0) {
         this.field.selectedOptions.splice(idx, 1);
      } else {
         this.field.selectedOptions.push(option);
      }
      this.field.value = this.field.selectedOptions.join('; ');
      this.fieldEdited.emit(this.field);
   }

   // ─── File Upload ───────────────────────────────────────────────

   onFileSelect(event: Event): void {
      const input = event.target as HTMLInputElement;
      if (input.files) {
         if (!this.field.attachedFiles) this.field.attachedFiles = [];
         for (let i = 0; i < input.files.length; i++) {
            this.field.attachedFiles.push(input.files[i].name);
         }
         this.field.value = this.field.attachedFiles.join(', ');
         this.fieldEdited.emit(this.field);
      }
   }

   removeFile(index: number): void {
      if (this.field.attachedFiles) {
         this.field.attachedFiles.splice(index, 1);
         this.field.value = this.field.attachedFiles.join(', ');
         this.fieldEdited.emit(this.field);
      }
   }

   // ─── Textarea Auto-Resize ───────────────────────────────────────

   autoResize(event: Event): void {
      const textarea = event.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
   }

   ngDoCheck(): void {
      // Field values are often mutated in-place from the parent (same object reference),
      // so Angular won't trigger OnChanges. Detect and resize textareas when content changes.
      const current = String(this.field?.value || '');
      if (current !== this.lastObservedValue) {
         this.lastObservedValue = current;
         this.scheduleAutosize();
      }
   }

   private scheduleAutosize(): void {
      if (this.resizeScheduled) return;
      this.resizeScheduled = true;
      setTimeout(() => {
         this.resizeScheduled = false;
         this.resizeAllTextareas();
      }, 0);
   }

   private resizeAllTextareas(): void {
      if (!this.autosizeTextareas) return;
      for (const ref of this.autosizeTextareas.toArray()) {
         const el = ref?.nativeElement;
         if (!el) continue;
         el.style.height = 'auto';
         el.style.height = el.scrollHeight + 'px';
      }
   }

   // ─── Table Grid ──────────────────────────────────────────────────

   get tableRows(): any[][] {
      if (!this.field.tableData || this.field.tableData.length === 0) {
         // Initialize with 3 empty rows if columns defined
         if (this.field.tableColumns && this.field.tableColumns.length > 0) {
            this.field.tableData = [
               this.field.tableColumns.map(() => ''),
               this.field.tableColumns.map(() => ''),
               this.field.tableColumns.map(() => '')
            ];
         }
      }
      return this.field.tableData || [];
   }

   addTableRow(): void {
      if (!this.field.tableData) this.field.tableData = [];
      const cols = this.field.tableColumns?.length || 3;
      this.field.tableData.push(new Array(cols).fill(''));
      this.syncTableToValue();
   }

   removeTableRow(rowIndex: number): void {
      if (this.field.tableData && this.field.tableData.length > 1) {
         this.field.tableData.splice(rowIndex, 1);
         this.syncTableToValue();
      }
   }

   updateTableCell(rowIndex: number, colIndex: number, value: string): void {
      if (this.field.tableData) {
         this.field.tableData[rowIndex][colIndex] = value;
         this.syncTableToValue();
      }
   }

   private syncTableToValue(): void {
      // Serialize table data to JSON string for persistence
      this.field.value = JSON.stringify(this.field.tableData);
      this.fieldEdited.emit(this.field);
   }

   // ─── Helpers ───────────────────────────────────────────────────

   isOptionSelected(option: string): boolean {
      return (this.field.selectedOptions || []).includes(option);
   }

   trackByIndex(index: number): number {
      return index;
   }
}
