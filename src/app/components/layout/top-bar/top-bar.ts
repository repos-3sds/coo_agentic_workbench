import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { LayoutService } from '../../../services/layout.service';
import { UserService, UserRole } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-top-bar',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
    <header class="h-16 w-full bg-[#172733] text-white flex items-center px-0 transition-all duration-300">
      
      <!-- Left: Branding & Toggle Container -->
      <div class="h-full flex items-center border-r border-[#2a3b4d] transition-all duration-300"
           [ngClass]="{'w-64 justify-between px-4': !isCollapsed(), 'w-[52px] justify-center': isCollapsed()}">

         <!-- Hamburger (collapsed = only this is visible) -->
         <button *ngIf="isCollapsed()" (click)="toggleSidebar()" class="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white" title="Expand Sidebar">
             <lucide-icon name="menu" class="w-5 h-5"></lucide-icon>
         </button>

         <!-- Logo (expanded only) -->
         <div *ngIf="!isCollapsed()" class="flex items-center select-none overflow-hidden h-full py-3">
             <img src="assets/logos/Expanded_Logo.svg" alt="Mistral AI" class="h-8 max-w-[180px] object-contain">
         </div>

         <!-- Menu Toggle (visible when expanded) -->
         <button *ngIf="!isCollapsed()" (click)="toggleSidebar()" class="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white fade-in flex-none" title="Collapse Sidebar">
             <lucide-icon name="panel-left" class="w-5 h-5"></lucide-icon>
         </button>
      </div>

      <!-- Right Side -->
      <div class="flex-1 flex items-center justify-between px-4">

          <!-- ═══ CHAT MODE: Show chat controls in header ═══ -->
          <div *ngIf="chatMode()" class="flex items-center gap-3 flex-1">
             <!-- Back Button -->
             <button (click)="chatMode()?.onBack?.()" class="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white" title="Back">
                 <lucide-icon name="arrow-left" class="w-5 h-5"></lucide-icon>
             </button>
             <div class="h-5 w-px bg-gray-600"></div>
             <!-- Agent Identity -->
             <div class="flex items-center gap-2.5">
                 <div class="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                     <lucide-icon name="brain-circuit" class="w-3.5 h-3.5 text-violet-300"></lucide-icon>
                 </div>
                 <div>
                    <h2 class="text-xs font-bold text-gray-100 leading-none">{{ chatMode()?.title }}</h2>
                    <p class="text-[10px] font-mono text-green-400 leading-none mt-0.5">{{ chatMode()?.subtitle }}</p>
                 </div>
             </div>
          </div>

          <!-- ═══ CHAT MODE: Center tabs ═══ -->
          <div *ngIf="chatMode()" class="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
             <button (click)="chatMode()?.onTabChange?.('TEMPLATES')"
                     class="px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
                     [ngClass]="chatMode()?.activeTab === 'TEMPLATES' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'">
                 <lucide-icon name="layout-template" class="w-3 h-3"></lucide-icon>
                 Templates
             </button>
             <button (click)="chatMode()?.onTabChange?.('CHAT')"
                     class="px-3 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5"
                     [ngClass]="chatMode()?.activeTab === 'CHAT' ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'">
                 <lucide-icon name="message-square" class="w-3 h-3"></lucide-icon>
                 Chat
             </button>
          </div>

          <!-- ═══ CHAT MODE: Right actions ═══ -->
          <div *ngIf="chatMode()" class="flex items-center gap-2">
             <button (click)="chatMode()?.onNewChat?.()" title="New Conversation"
                     class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 hover:text-blue-100 transition-all border border-blue-400/20 hover:border-blue-400/40 text-xs font-semibold">
                 <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
                 <span>New Chat</span>
             </button>
             <button (click)="chatMode()?.onResetChat?.()" title="Reset current chat"
                     class="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-red-400">
                 <lucide-icon name="rotate-ccw" class="w-4 h-4"></lucide-icon>
             </button>
             <div class="h-5 w-px bg-gray-600 mx-1"></div>
             <span class="text-[10px] text-green-400 font-medium flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
             </span>
             <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/20 border border-indigo-400 ml-2">
                 {{ currentUser().name.charAt(0) }}
             </div>
          </div>

          <!-- ═══ NORMAL MODE: Role Switcher ═══ -->
          <div *ngIf="!chatMode()" class="hidden md:flex items-center gap-4 text-sm relative">
             
             <!-- Role Trigger -->
             <div (click)="toggleRoleMenu()" class="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer transition-colors px-3 py-1.5 rounded hover:bg-white/5 border border-transparent hover:border-gray-700 select-none">
                <div class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                     [ngClass]="getRoleBadgeClass(currentUser().role)">
                     {{ getRoleInitial(currentUser().role) }}
                </div>
                <div class="flex flex-col text-left">
                    <span class="text-xs font-bold text-gray-200 leading-none">{{ currentUser().name }}</span>
                    <span class="text-[10px] text-gray-500 leading-none uppercase tracking-wider mt-0.5">{{ formatRoleName(currentUser().role) }}</span>
                </div>
                <lucide-icon name="chevron-down" class="w-3 h-3 ml-2 transition-transform duration-200" [class.rotate-180]="isRoleMenuOpen"></lucide-icon>
             </div>

             <!-- Role Dropdown Menu -->
             <div *ngIf="isRoleMenuOpen" class="absolute top-full left-0 mt-2 w-64 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                <div class="px-3 py-2 border-b border-[#334155] bg-[#0f172a]/50">
                    <span class="text-[10px] uppercase font-bold text-gray-500">Proposing Unit</span>
                </div>
                
                <button (click)="switchRole('MAKER')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Maker</div>
                        <div class="text-[10px] text-gray-500">Create & Correct</div>
                    </div>
                    <lucide-icon *ngIf="currentUser().role === 'MAKER'" name="check" class="w-3 h-3 text-blue-500"></lucide-icon>
                </button>

                <button (click)="switchRole('CHECKER')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Checker</div>
                        <div class="text-[10px] text-gray-500">4-Eyes Review</div>
                    </div>
                    <lucide-icon *ngIf="currentUser().role === 'CHECKER'" name="check" class="w-3 h-3 text-purple-500"></lucide-icon>
                </button>

                <div class="px-3 py-2 border-b border-t border-[#334155] bg-[#0f172a]/50 mt-1">
                    <span class="text-[10px] uppercase font-bold text-gray-500">Functional Approvers</span>
                </div>

                <button (click)="switchRole('APPROVER_RISK')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Credit Risk</div>
                        <div class="text-[10px] text-gray-500">Credit Limits & Exposures</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_MARKET')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-pink-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Market Risk</div>
                        <div class="text-[10px] text-gray-500">VaR & Stress Tests</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_FINANCE')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Finance Controller</div>
                        <div class="text-[10px] text-gray-500">ROAE & Capital</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_TAX')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-teal-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Group Tax</div>
                        <div class="text-[10px] text-gray-500">Cross-Border Tax</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_LEGAL')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Legal & Compliance</div>
                        <div class="text-[10px] text-gray-500">Regulatory & Contracts</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_OPS')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Ops Lead</div>
                        <div class="text-[10px] text-gray-500">Settlement & Process</div>
                    </div>
                </button>

                <button (click)="switchRole('APPROVER_TECH')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">Tech Lead</div>
                        <div class="text-[10px] text-gray-500">System Readiness</div>
                    </div>
                </button>

                <div class="px-3 py-2 border-b border-t border-[#334155] bg-[#0f172a]/50 mt-1">
                    <span class="text-[10px] uppercase font-bold text-gray-500">Final Approval</span>
                </div>

                <button (click)="switchRole('COO')" class="flex items-center gap-3 px-4 py-2 hover:bg-[#334155] transition-colors text-left group">
                    <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div class="flex-1">
                        <div class="text-xs font-bold text-gray-200">COO</div>
                        <div class="text-[10px] text-gray-500">Final Gatekeeper</div>
                    </div>
                    <lucide-icon *ngIf="currentUser().role === 'COO'" name="check" class="w-3 h-3 text-yellow-500"></lucide-icon>
                </button>
             </div>
          </div>
          


      </div>
    </header>
  `,
    styles: []
})
export class TopBarComponent {
    private layoutService = inject(LayoutService);
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private router = inject(Router);

    isCollapsed = this.layoutService.isSidebarCollapsed;
    chatMode = this.layoutService.chatMode;
    currentUser = this.userService.currentUser;
    authUser = toSignal(this.authService.user$, { initialValue: this.authService.currentUser });
    isRoleMenuOpen = false;

    toggleSidebar() {
        this.layoutService.toggleSidebar();
    }

    toggleRoleMenu() {
        this.isRoleMenuOpen = !this.isRoleMenuOpen;
    }

    switchRole(role: UserRole) {
        this.userService.switchRole(role);
        this.isRoleMenuOpen = false;
    }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    getInitials(name: string | undefined): string {
        if (!name) return '?';
        return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
    }

    getRoleBadgeClass(role: string) {
        if (role === 'MAKER') return 'bg-blue-600 text-white';
        if (role === 'CHECKER') return 'bg-purple-600 text-white';
        if (role === 'COO') return 'bg-yellow-600 text-white';
        if (role === 'ADMIN') return 'bg-gray-600 text-white';

        if (role === 'APPROVER_RISK') return 'bg-red-600 text-white';
        if (role === 'APPROVER_MARKET') return 'bg-pink-600 text-white';
        if (role === 'APPROVER_FINANCE') return 'bg-emerald-600 text-white';
        if (role === 'APPROVER_TAX') return 'bg-teal-600 text-white';
        if (role === 'APPROVER_LEGAL') return 'bg-indigo-400 text-white';
        if (role === 'APPROVER_OPS') return 'bg-orange-600 text-white';
        if (role === 'APPROVER_TECH') return 'bg-cyan-600 text-white';

        return 'bg-gray-600 text-white';
    }

    getRoleInitial(role: string) {
        if (role === 'MAKER') return 'M';
        if (role === 'CHECKER') return 'C';
        if (role === 'COO') return 'O';
        if (role === 'ADMIN') return 'A';

        if (role === 'APPROVER_RISK') return 'CR';
        if (role === 'APPROVER_MARKET') return 'MR';
        if (role === 'APPROVER_FINANCE') return 'F';
        if (role === 'APPROVER_TAX') return 'TX';
        if (role === 'APPROVER_LEGAL') return 'L';
        if (role === 'APPROVER_OPS') return 'Op';
        if (role === 'APPROVER_TECH') return 'T';

        return '?';
    }

    formatRoleName(role: string) {
        if (role.startsWith('APPROVER_')) {
            return role.replace('APPROVER_', '') + ' HEAD';
        }
        return role + ' VIEW';
    }
}
