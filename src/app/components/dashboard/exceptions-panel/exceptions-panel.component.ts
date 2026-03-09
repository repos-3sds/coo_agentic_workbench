import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

// Interface matches the shape of breach alerts from monitoring API
export interface Exception {
    id: string;
    function: string;
    task: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    timestamp: string;
    assignee?: string;
    description: string;
}

@Component({
    selector: 'app-exceptions-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
   <div class="rounded-xl border bg-card text-card-foreground shadow">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold leading-none tracking-tight flex items-center gap-2 text-destructive">
          <lucide-icon name="alert-triangle" class="w-5 h-5"></lucide-icon>
          Exceptions & Breaches requiring Attention
        </h3>
      </div>
      <div class="p-6 pt-0">
         <div class="relative w-full overflow-auto">
            <table class="w-full caption-bottom text-sm text-left">
               <thead class="[&_tr]:border-b">
                  <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Severity</th>
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Function</th>
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Task / Exception</th>
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Time</th>
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground">Assignee</th>
                     <th class="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                  </tr>
               </thead>
               <tbody class="[&_tr:last-child]:border-0">
                  <tr *ngFor="let ex of exceptions" class="border-b transition-colors hover:bg-muted/50">
                     <td class="p-4 align-middle">
                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              [class.border-transparent]="true"
                              [ngClass]="getBadgeColor(ex.riskLevel)">
                           {{ ex.riskLevel | titlecase }}
                        </span>
                     </td>
                     <td class="p-4 align-middle">{{ ex.function }}</td>
                     <td class="p-4 align-middle font-medium">
                        {{ ex.task }}
                        <div class="text-xs text-muted-foreground font-normal">{{ ex.description }}</div>
                     </td>
                     <td class="p-4 align-middle">{{ ex.timestamp }}</td>
                     <td class="p-4 align-middle">
                        <div class="flex items-center gap-2">
                           <div class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs">JS</div>
                           {{ ex.assignee || 'Unassigned' }}
                        </div>
                     </td>
                     <td class="p-4 align-middle text-right">
                        <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3">
                           Review
                        </button>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
   </div>
  `,
    styles: []
})
export class ExceptionsPanelComponent {
    @Input() exceptions: Exception[] = [];

    getBadgeColor(level: string): string {
        switch (level) {
            case 'critical': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
            case 'high': return 'bg-orange-500 text-white hover:bg-orange-600';
            case 'medium': return 'bg-yellow-500 text-white hover:bg-yellow-600';
            default: return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
        }
    }
}
