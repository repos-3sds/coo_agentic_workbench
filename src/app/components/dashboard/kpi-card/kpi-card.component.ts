import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-kpi-card',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="rounded-xl border bg-card text-card-foreground shadow p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div class="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 class="tracking-tight text-sm font-medium text-muted-foreground">
          {{ label }}
        </h3>
        <!-- Dynamic icon would require a mapping or 'lucide-icon' with name input, 
             but name mapping can be tricky if names don't match exactly. 
             Simplified for now to use a generic icon or specific one if passed. -->
         <lucide-icon [name]="getIconName(icon)" class="h-4 w-4 text-muted-foreground"></lucide-icon>
      </div>
      <div class="pt-2">
        <div class="text-2xl font-bold">{{ value }}</div>
        <p class="text-xs text-muted-foreground flex items-center mt-1">
          <span [class]="getTrendColor(trend)" class="flex items-center mr-1">
             <lucide-icon *ngIf="trend === 'up'" name="trending-up" class="w-3 h-3 mr-1"></lucide-icon>
             <lucide-icon *ngIf="trend === 'down'" name="trending-down" class="w-3 h-3 mr-1"></lucide-icon>
             <span *ngIf="change">{{ change > 0 ? '+' : ''}}{{ change }}</span>
          </span>
          from last hour
        </p>
      </div>
    </div>
  `,
    styles: []
})
export class KpiCardComponent {
    @Input() label: string = '';
    @Input() value: number = 0;
    @Input() change?: number;
    @Input() trend?: 'up' | 'down' | 'stable';
    @Input() icon: string = 'activity';

    getTrendColor(trend?: 'up' | 'down' | 'stable'): string {
        switch (trend) {
            case 'up': return 'text-green-500';
            case 'down': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    }

    getIconName(iconProp: string): string {
        // Map mock data icon names to lucide-angular names
        const map: Record<string, string> = {
            'Workflow': 'workflow',
            'Bot': 'bot',
            'AlertTriangle': 'alert-triangle',
            'Clock': 'clock'
        };
        return map[iconProp] || 'activity';
    }
}
