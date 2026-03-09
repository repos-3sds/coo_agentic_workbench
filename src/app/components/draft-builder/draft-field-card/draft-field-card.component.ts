import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DraftField, DraftComment, FieldLineage, FieldStrategy } from '../models/draft.models';

@Component({
  selector: 'app-draft-field-card',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './draft-field-card.component.html',
  styleUrls: ['./draft-field-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftFieldCardComponent {
  @Input() field!: DraftField;
  @Input() comments: DraftComment[] = [];

  @Output() valueChanged = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<{ fieldKey: string; text: string }>();
  @Output() commentResolved = new EventEmitter<string>();
  @Output() bulletItemAdded = new EventEmitter<DraftField>();
  @Output() bulletItemRemoved = new EventEmitter<{ field: DraftField; index: number }>();
  @Output() multiselectToggled = new EventEmitter<{ field: DraftField; option: string }>();

  showComments = false;
  newCommentText = '';

  // ── Field-level comments ────────────────────────────────────

  get fieldComments(): DraftComment[] {
    return this.comments.filter(c => c.fieldKey === this.field.key);
  }

  get unresolvedCount(): number {
    return this.fieldComments.filter(c => !c.resolved).length;
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  submitComment(): void {
    if (!this.newCommentText.trim()) return;
    this.commentAdded.emit({ fieldKey: this.field.key, text: this.newCommentText.trim() });
    this.newCommentText = '';
  }

  onResolveComment(id: string): void {
    this.commentResolved.emit(id);
  }

  // ── Value change handlers ───────────────────────────────────

  onValueChange(): void {
    this.valueChanged.emit();
  }

  onYesNo(val: boolean): void {
    this.field.yesNoValue = val;
    this.field.value = val ? 'Yes' : 'No';
    this.valueChanged.emit();
  }

  onAddBullet(): void {
    this.bulletItemAdded.emit(this.field);
  }

  onRemoveBullet(index: number): void {
    this.bulletItemRemoved.emit({ field: this.field, index });
  }

  onToggleMultiselect(option: string): void {
    this.multiselectToggled.emit({ field: this.field, option });
  }

  // ── Display helpers ─────────────────────────────────────────

  get isUnfilled(): boolean {
    return this.field.required && !this.field.value && !(this.field.bulletItems?.length);
  }

  get lineageLabel(): string {
    const map: Record<FieldLineage, string> = {
      AUTO: 'AI filled',
      ADAPTED: 'From Ref NPA',
      MANUAL: 'Manual',
    };
    return map[this.field.lineage] || this.field.lineage;
  }

  get lineageColor(): string {
    const map: Record<FieldLineage, string> = {
      AUTO: 'bg-violet-50 text-violet-600 border-violet-200',
      ADAPTED: 'bg-amber-50 text-amber-600 border-amber-200',
      MANUAL: 'bg-slate-50 text-slate-500 border-slate-200',
    };
    return map[this.field.lineage] || 'bg-slate-50 text-slate-500 border-slate-200';
  }

  get lineageIcon(): string {
    const map: Record<FieldLineage, string> = {
      AUTO: 'sparkles',
      ADAPTED: 'copy',
      MANUAL: 'pencil',
    };
    return map[this.field.lineage] || 'pencil';
  }

  getWordCount(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }
}
