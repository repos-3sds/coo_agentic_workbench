import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface Dependency {
    id: string;
    function: string;
    agent: string;
    status: 'ok' | 'pending' | 'blocked' | 'exception';
    details?: string;
}

@Component({
    selector: 'app-dependency-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow h-full">
      <div class="flex flex-col space-y-1.5 p-6 pb-4">
        <h3 class="font-semibold leading-none tracking-tight flex items-center gap-2">
          <lucide-icon name="share-2" class="w-4 h-4"></lucide-icon>
          Cross-Function Dependencies
        </h3>
      </div>
      <div class="p-6 pt-0 space-y-4">
         <div *ngFor="let dep of dependencies" class="flex items-start justify-between space-x-4 p-3 rounded-lg border bg-muted/40">
            <div class="space-y-1">
               <p class="text-sm font-medium leading-none">{{ dep.function }}</p>
               <p class="text-xs text-muted-foreground">{{ dep.details }}</p>
            </div>
            <div class="flex items-center">
               <span *ngIf="dep.status === 'ok'" class="flex h-2 w-2 rounded-full bg-green-500"></span>
               <span *ngIf="dep.status === 'pending'" class="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
               <span *ngIf="dep.status === 'blocked'" class="flex h-2 w-2 rounded-full bg-red-500"></span>
            </div>
         </div>
      </div>
    </div>
  `,
    styles: []
})
export class DependencyPanelComponent {
    @Input() dependencies: Dependency[] = [];
}
