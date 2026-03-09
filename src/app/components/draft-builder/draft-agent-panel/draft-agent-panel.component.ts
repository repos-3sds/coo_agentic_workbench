import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DraftAgentMessage, DraftAgentTab, ReferenceNPA } from '../models/draft.models';

@Component({
  selector: 'app-draft-agent-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, SharedIconsModule],
  templateUrl: './draft-agent-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftAgentPanelComponent {
  @Input() isOpen = true;
  @Input() messages: DraftAgentMessage[] = [];
  @Input() issues: { key: string; label: string }[] = [];
  @Input() selectedRefNPA: ReferenceNPA | null = null;

  @Output() togglePanel = new EventEmitter<void>();
  @Output() messageSent = new EventEmitter<string>();
  @Output() jumpToField = new EventEmitter<string>();

  activeTab: DraftAgentTab = 'chat';
  chatInput = '';

  onToggle(): void {
    this.togglePanel.emit();
  }

  onSendMessage(): void {
    if (!this.chatInput.trim()) return;
    this.messageSent.emit(this.chatInput.trim());
    this.chatInput = '';
  }

  onJumpToField(key: string): void {
    this.jumpToField.emit(key);
  }
}
