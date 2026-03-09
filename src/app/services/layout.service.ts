import { Injectable, signal } from '@angular/core';

export interface ChatModeConfig {
    active: boolean;
    title: string;
    subtitle: string;
    activeTab: 'CHAT' | 'TEMPLATES';
    onBack: () => void;
    onTabChange: (tab: 'CHAT' | 'TEMPLATES') => void;
    onNewChat: () => void;
    onResetChat: () => void;
    onSelectSession?: (session: any) => void;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    isSidebarCollapsed = signal(false);
    isSidebarVisible = signal(true);

    // Chat mode: replaces sidebar with chat history, shows chat controls in header
    chatMode = signal<ChatModeConfig | null>(null);

    toggleSidebar() {
        this.isSidebarCollapsed.update(v => !v);
    }

    setSidebarState(collapsed: boolean) {
        this.isSidebarCollapsed.set(collapsed);
    }

    setSidebarVisible(visible: boolean) {
        this.isSidebarVisible.set(visible);
    }

    enterChatMode(config: Omit<ChatModeConfig, 'active'>) {
        this.chatMode.set({ ...config, active: true });
    }

    exitChatMode() {
        this.chatMode.set(null);
    }

    updateChatTab(tab: 'CHAT' | 'TEMPLATES') {
        const current = this.chatMode();
        if (current) {
            this.chatMode.set({ ...current, activeTab: tab });
        }
    }

    updateChatSubtitle(subtitle: string) {
        const current = this.chatMode();
        if (current) {
            this.chatMode.set({ ...current, subtitle });
        }
    }
}
