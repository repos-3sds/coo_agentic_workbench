import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-kb-list-overlay',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './kb-list-overlay.component.html'
})
export class KbListOverlayComponent {
    @Input() isOpen = false;
    @Input() kbSets: any[] = [];
    @Output() closeOverlay = new EventEmitter<void>();

    onClose() {
        this.closeOverlay.emit();
    }

    onManageInDify() {
        window.open('https://cloud.dify.ai/datasets', '_blank');
    }
}
