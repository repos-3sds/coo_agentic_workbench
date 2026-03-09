import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-audit-preview-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 class="font-semibold leading-none tracking-tight flex items-center gap-2">
          <lucide-icon name="shield" class="w-4 h-4"></lucide-icon>
          Audit Controls
        </h3>
      </div>
      <div class="p-6 pt-0">
        <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <div class="flex items-center gap-3">
             <lucide-icon name="check-circle-2" class="w-5 h-5 text-green-600"></lucide-icon>
             <div>
                <p class="text-sm font-medium text-green-900 dark:text-green-100">Audit Trail Active</p>
                <p class="text-xs text-green-700 dark:text-green-300">Recording all agent actions for Workflow {{ workflowId }}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class AuditPreviewPanelComponent {
    @Input() workflowId?: string;
}
