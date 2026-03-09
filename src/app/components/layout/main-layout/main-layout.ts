import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../app-sidebar/app-sidebar';
import { TopBarComponent } from '../top-bar/top-bar';
import { ChatHistoryPanelComponent } from '../chat-history-panel/chat-history-panel.component';
import { LayoutService } from '../../../services/layout.service';
import { ToastContainerComponent } from '../../common/toast-container/toast-container.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppSidebarComponent, TopBarComponent, ChatHistoryPanelComponent, ToastContainerComponent],
  template: `
    <!-- Root Container: Dark background to match Header, creating the 'gap' effect for rounded corners -->
    <div class="h-screen flex flex-col bg-[#0e0e0e] overflow-hidden">
      <!-- Header (Full Width) -->
      <app-top-bar class="w-full h-16 z-50 flex-none relative"></app-top-bar>

      <!-- Body (Sidebar + Content) -->
      <div class="flex-1 flex flex-row overflow-hidden relative">

        <!-- Sidebar: Normal mode — show app sidebar -->
        <app-app-sidebar
            *ngIf="isSidebarVisible() && !chatMode()"
            class="flex-none h-full border-r border-border/40 transition-all duration-300 ease-in-out bg-[#f9f9f9] rounded-tl-2xl overflow-hidden"
            [ngClass]="{'w-64': !isCollapsed(), 'w-[52px]': isCollapsed()}">
        </app-app-sidebar>

        <!-- Sidebar: Chat mode — show chat history panel in sidebar slot -->
        <div *ngIf="chatMode()"
             class="flex-none h-full border-r border-border/40 transition-all duration-300 ease-in-out bg-[#f9f9f9] rounded-tl-2xl overflow-hidden"
             [ngClass]="!isCollapsed() ? 'w-64' : 'w-0'">
            <app-chat-history-panel *ngIf="!isCollapsed()"
                (onClose)="layoutService.setSidebarState(true)"
                (onNewChat)="chatMode()?.onNewChat?.()"
                (onSelectSession)="onSessionSelect($event)">
            </app-chat-history-panel>
        </div>

        <!-- Content Area -->
        <main class="flex-1 min-w-0 relative overflow-auto bg-white"
              [ngClass]="!isSidebarVisible() && !chatMode() ? 'rounded-t-2xl' : 'rounded-tr-2xl'">
             <router-outlet></router-outlet>
        </main>
      </div>
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: []
})
export class MainLayoutComponent {
  layoutService = inject(LayoutService);
  isCollapsed = this.layoutService.isSidebarCollapsed;
  isSidebarVisible = this.layoutService.isSidebarVisible;
  chatMode = this.layoutService.chatMode;

  // Forward session selection to the active workspace (via a callback stored in chatMode)
  onSessionSelect(session: any) {
    const config = this.chatMode();
    if (config?.onSelectSession) {
      config.onSelectSession(session);
    }
  }
}
