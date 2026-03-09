import { Injectable, signal, computed } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private _nextId = 0;

  toasts = computed(() => this._toasts());

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = this._nextId++;
    this._toasts.update(t => [...t, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 4000): void { this.show(message, 'success', duration); }
  error(message: string, duration = 6000): void { this.show(message, 'error', duration); }
  warning(message: string, duration = 5000): void { this.show(message, 'warning', duration); }
  info(message: string, duration = 4000): void { this.show(message, 'info', duration); }

  dismiss(id: number): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
