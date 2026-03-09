import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AgentCapability } from '../../../services/dify/dify-agent.service';

@Component({
    selector: 'app-capability-card',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div 
      class="group bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
      [ngClass]="getHoverClass(capability.color)"
      (click)="toggleExpand()">
      
      <!-- Icon & Header -->
      <div class="flex justify-between items-start mb-4">
         <div class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              [ngClass]="getIconBgClass(capability.color)">
            <lucide-icon [name]="capability.icon" class="w-5 h-5"></lucide-icon>
         </div>
         <!-- Expand Chevron -->
         <div class="text-slate-300 group-hover:text-slate-500 transition-colors">
            <lucide-icon [name]="isExpanded ? 'chevron-up' : 'chevron-down'" class="w-4 h-4"></lucide-icon>
         </div>
      </div>

      <h3 class="font-bold text-slate-900 mb-1">{{ capability.name }}</h3>
      
      <!-- Description (Truncated when collapsed, full when expanded) -->
      <p class="text-sm text-slate-500 mb-4 transition-all duration-300" 
         [class.line-clamp-2]="!isExpanded">
         {{ capability.description }}
      </p>

      <!-- Bottom Row: Stats & Action -->
      <div class="flex items-center justify-between text-xs mt-auto">
         <span class="font-mono text-slate-400">
            <span class="font-semibold text-slate-600">{{ capability.stats.value }}</span> {{ capability.stats.label }}
         </span>
         
         <button 
            (click)="onActionClick($event)"
            class="font-semibold transition-transform group-hover:translate-x-1 flex items-center gap-1"
            [ngClass]="getTextClass(capability.color)">
            {{ capability.actionLabel }} <lucide-icon name="arrow-right" class="w-3 h-3"></lucide-icon>
         </button>
      </div>

      <!-- Expanded Content Area (Animated) -->
      <div *ngIf="isExpanded" class="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
         <div class="text-xs text-slate-500 space-y-2">
            <p><span class="font-semibold text-slate-700">How it works:</span> This agent uses Dify workflows to orchestrate the process.</p>
            <div class="flex items-center gap-2">
               <span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono">Model: GPT-4o</span>
               <span class="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono">Tools: 3</span>
            </div>
             <button class="w-full mt-3 py-1.5 rounded-lg bg-mbs-primary text-white font-semibold hover:bg-mbs-primary-hover transition-colors">
               Launch Full Mode
            </button>
         </div>
      </div>
    </div>
  `,
    styles: []
})
export class CapabilityCardComponent {
    @Input({ required: true }) capability!: AgentCapability;
    @Input() isExpanded = false;
    @Output() action = new EventEmitter<void>();
    @Output() expand = new EventEmitter<void>();

    onActionClick(e: Event) {
        e.stopPropagation(); // Prevent card expansion
        this.action.emit();
    }

    toggleExpand() {
        this.expand.emit();
    }

    // --- Style Helpers ---
    getHoverClass(color: string): string {
        const map: Record<string, string> = {
            blue: 'hover:border-blue-200',
            purple: 'hover:border-purple-200',
            amber: 'hover:border-amber-200',
            green: 'hover:border-green-200',
            indigo: 'hover:border-indigo-200',
            red: 'hover:border-red-200'
        };
        return map[color] || 'hover:border-slate-200';
    }

    getIconBgClass(color: string): string {
        const map: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            purple: 'bg-purple-50 text-purple-600',
            amber: 'bg-amber-50 text-amber-600',
            green: 'bg-green-50 text-green-600',
            indigo: 'bg-indigo-50 text-indigo-600',
            red: 'bg-red-50 text-red-600'
        };
        return map[color] || 'bg-slate-50 text-slate-600';
    }

    getTextClass(color: string): string {
        const map: Record<string, string> = {
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            amber: 'text-amber-600',
            green: 'text-green-600',
            indigo: 'text-indigo-600',
            red: 'text-red-600'
        };
        return map[color] || 'text-slate-600';
    }
}
