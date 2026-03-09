import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AgentWorkItem } from '../../../services/dify/dify-agent.service';

@Component({
   selector: 'app-work-item-list',
   standalone: true,
   imports: [CommonModule, LucideAngularModule],
   template: `
    <div class="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-800 font-mono text-sm">
       <!-- Header -->
       <div class="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div class="flex gap-4">
             <span class="w-20">JOB ID</span>
             <span class="w-32">AGENT</span>
             <span>OPERATION</span>
          </div>
          <div class="flex gap-4 mr-8">
             <span class="w-24 text-right">STATUS</span>
             <span class="w-16 text-right">TIME</span>
          </div>
       </div>

       <!-- List -->
       <div class="divide-y divide-slate-800/50">
          <div *ngFor="let item of items" 
               class="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-default">
             
             <!-- Left Group -->
             <div class="flex gap-4 items-center">
                <span class="text-slate-500 w-20">{{ item.id }}</span>
                <span class="font-medium w-32 truncate" [ngClass]="getColorClass(item.color)">{{ item.agentName }}</span>
                <span class="text-slate-300 truncate max-w-[200px] md:max-w-md">{{ item.operation }}</span>
             </div>

             <!-- Right Group -->
             <div class="flex gap-4 justify-end items-center">
                <div class="w-24 flex justify-end">
                   <!-- Status Indicators -->
                   <span *ngIf="item.status === 'running'" class="text-green-400 flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Running
                   </span>
                   <span *ngIf="item.status === 'completed'" class="text-slate-500 flex items-center gap-1.5">
                      <lucide-icon name="check" class="w-3 h-3"></lucide-icon> Done
                   </span>
                   <span *ngIf="item.status === 'waiting'" class="text-amber-400 flex items-center gap-1.5">
                       <lucide-icon name="clock" class="w-3 h-3"></lucide-icon> Wait
                   </span>
                </div>
                <span class="text-slate-600 w-16 text-right font-mono text-xs">{{ item.duration }}</span>
             </div>
          </div>
          
          <!-- Empty State -->
          <div *ngIf="items.length === 0" class="px-4 py-8 text-center text-slate-600 italic">
             No active agent jobs running.
          </div>
       </div>
    </div>
  `
})
export class WorkItemListComponent {
   @Input() items: AgentWorkItem[] = [];

   getColorClass(color: string): string {
      const map: Record<string, string> = {
         blue: 'text-blue-400',
         purple: 'text-purple-400',
         amber: 'text-amber-400',
         green: 'text-green-400',
         red: 'text-red-400',
         fuchsia: 'text-fuchsia-400'
      };
      return map[color] || 'text-slate-400';
   }
}
