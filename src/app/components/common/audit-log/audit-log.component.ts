import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-audit-log',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    template: `
    <div class="border-t border-[#2e2e2e] bg-[#111]">
      <div class="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-[#1a1a1a] transition-colors" (click)="toggle()">
        <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
           <lucide-icon name="scroll-text" class="w-4 h-4"></lucide-icon>
           Audit & Evidence Log
        </div>
        <lucide-icon [name]="expanded ? 'chevron-down' : 'chevron-up'" class="w-4 h-4 text-slate-500"></lucide-icon>
      </div>

      <div class="h-48 overflow-y-auto bg-[#0A0A0A] border-t border-[#2e2e2e]" *ngIf="expanded">
         <table class="w-full text-left border-collapse">
            <thead class="bg-[#141414] text-xs text-slate-500 font-mono sticky top-0">
               <tr>
                  <th class="px-6 py-2 font-medium">Timestamp</th>
                  <th class="px-6 py-2 font-medium">Actor</th>
                  <th class="px-6 py-2 font-medium">Action</th>
                  <th class="px-6 py-2 font-medium">Outcome</th>
               </tr>
            </thead>
            <tbody class="text-xs font-mono text-slate-400">
               <tr class="border-b border-[#1f1f1f] hover:bg-[#1f1f1f]/50 transition-colors">
                  <td class="px-6 py-2 text-slate-500">10:42:05 AM</td>
                  <td class="px-6 py-2 flex items-center gap-2">
                     <lucide-icon name="bot" class="w-3 h-3 text-purple-400"></lucide-icon>
                     <span class="text-purple-300">CompletenessCheckAgent</span>
                  </td>
                  <td class="px-6 py-2">Validate Required Fields</td>
                  <td class="px-6 py-2 text-green-400">PASSED</td>
               </tr>
               <tr class="border-b border-[#1f1f1f] hover:bg-[#1f1f1f]/50 transition-colors">
                  <td class="px-6 py-2 text-slate-500">10:41:58 AM</td>
                  <td class="px-6 py-2 flex items-center gap-2">
                     <lucide-icon name="bot" class="w-3 h-3 text-purple-400"></lucide-icon>
                     <span class="text-purple-300">DocExtractionAgent</span>
                  </td>
                  <td class="px-6 py-2">Parse PDF (Specs.pdf)</td>
                  <td class="px-6 py-2 text-green-400">SUCCESS (98%)</td>
               </tr>
                <tr class="border-b border-[#1f1f1f] hover:bg-[#1f1f1f]/50 transition-colors">
                  <td class="px-6 py-2 text-slate-500">10:41:45 AM</td>
                  <td class="px-6 py-2 flex items-center gap-2">
                     <lucide-icon name="user" class="w-3 h-3 text-blue-400"></lucide-icon>
                     <span class="text-blue-300">Vikramaditya</span>
                  </td>
                  <td class="px-6 py-2">Uploaded Document</td>
                  <td class="px-6 py-2 text-slate-400">Initial Submission</td>
               </tr>
            </tbody>
         </table>
      </div>
    </div>
  `
})
export class AuditLogComponent {
    expanded = false;

    toggle() {
        this.expanded = !this.expanded;
    }
}
