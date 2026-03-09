import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-slide-in"
             [class]="getToastClasses(toast.type)"
             (click)="toastService.dismiss(toast.id)">
          <lucide-icon [name]="getIcon(toast.type)" class="w-5 h-5 mt-0.5 shrink-0"></lucide-icon>
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button class="text-current opacity-50 hover:opacity-100 shrink-0" (click)="toastService.dismiss(toast.id)">
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-slide-in { animation: slideIn 0.25s ease-out; }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  getToastClasses(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
}
