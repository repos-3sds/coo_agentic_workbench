import { Component, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ChatSessionService, ChatSession } from '../../../services/chat-session.service';

@Component({
    selector: 'app-chat-history-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, FormsModule],
    template: `
    <!-- Chat History Sidebar -->
    <div class="flex flex-col h-full bg-[#f9f9f9] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200/60">
            <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                <lucide-icon name="message-square" class="w-4 h-4 text-violet-600"></lucide-icon>
                Chat History
            </h3>
            <div class="flex items-center gap-1">
                <button (click)="onNewChat.emit()"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 hover:text-violet-700 transition-all border border-violet-200 hover:border-violet-300 text-xs font-semibold"
                        title="New Chat">
                    <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
                    <span>New Chat</span>
                </button>
                <button (click)="onClose.emit()"
                        class="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        title="Close panel">
                    <lucide-icon name="panel-left" class="w-4 h-4"></lucide-icon>
                </button>
            </div>
        </div>

        <!-- Search -->
        <div class="px-3 py-2 border-b border-slate-200/40">
            <div class="relative">
                <lucide-icon name="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"></lucide-icon>
                <input type="text"
                       [(ngModel)]="searchQuery"
                       placeholder="Search chats..."
                       class="w-full bg-white text-xs rounded-lg pl-8 pr-3 py-2 border border-slate-200 focus:border-violet-300 focus:ring-1 focus:ring-violet-200 focus:outline-none transition-all placeholder:text-slate-400">
            </div>
        </div>

        <!-- Session List -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
            <div *ngIf="filteredGroups().length === 0" class="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <lucide-icon name="message-square" class="w-5 h-5 text-slate-400"></lucide-icon>
                </div>
                <p class="text-sm text-slate-500 font-medium">No conversations yet</p>
                <p class="text-xs text-slate-400 mt-1">Start chatting with the COO Agent</p>
            </div>

            <div *ngFor="let group of filteredGroups()" class="py-1">
                <!-- Group Label -->
                <div class="px-4 py-1.5">
                    <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{{ group.label }}</span>
                </div>

                <!-- Session Items -->
                <div *ngFor="let session of group.sessions"
                     class="group relative mx-2 mb-0.5"
                     (mouseenter)="hoveredId = session.id"
                     (mouseleave)="hoveredId = null">
                    <button (click)="selectSession(session)"
                            class="w-full text-left px-3 py-2.5 rounded-lg transition-all text-[13px] flex items-start gap-2.5"
                            [ngClass]="session.id === activeSessionId()
                                ? 'bg-violet-50 border border-violet-200'
                                : 'hover:bg-slate-100/80 border border-transparent'">

                        <!-- Agent dot -->
                        <div class="w-5 h-5 rounded-md flex-none flex items-center justify-center mt-0.5"
                             [ngClass]="session.domainAgent?.color || 'bg-violet-50 text-violet-600'">
                            <lucide-icon [name]="session.domainAgent?.icon || 'brain-circuit'" class="w-3 h-3"></lucide-icon>
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <!-- Title (editable on double-click) -->
                            <div *ngIf="editingId !== session.id"
                                 class="font-medium text-slate-900 truncate leading-snug"
                                 (dblclick)="startRename(session)">
                                {{ session.title }}
                            </div>
                            <input *ngIf="editingId === session.id"
                                   [(ngModel)]="editTitle"
                                   (keydown.enter)="finishRename(session.id)"
                                   (blur)="finishRename(session.id)"
                                   class="w-full bg-white text-xs border border-violet-300 rounded px-1.5 py-0.5 focus:outline-none"
                                   #renameInput>

                            <!-- Preview -->
                            <p class="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                                {{ session.messageCount }} messages
                                <span class="mx-1">&middot;</span>
                                {{ formatTime(session.updatedAt) }}
                            </p>
                        </div>
                    </button>

                    <!-- Actions (on hover) -->
                    <div *ngIf="hoveredId === session.id"
                         class="absolute right-2 top-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-md border border-slate-200 shadow-sm px-0.5 py-0.5 z-10">
                        <button (click)="startRename(session); $event.stopPropagation()"
                                class="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                title="Rename">
                            <lucide-icon name="edit-3" class="w-3 h-3"></lucide-icon>
                        </button>
                        <button (click)="deleteSession(session.id); $event.stopPropagation()"
                                class="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                                title="Delete">
                            <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="p-3 border-t border-slate-200/60 flex-none">
            <button *ngIf="sessionService.sessions().length > 0"
                    (click)="sessionService.clearAll()"
                    class="w-full text-xs text-slate-400 hover:text-red-500 py-1.5 rounded-md hover:bg-red-50/50 transition-colors font-medium">
                Clear All History
            </button>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; height: 100%; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 2px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
    `]
})
export class ChatHistoryPanelComponent {
    @Output() onClose = new EventEmitter<void>();
    @Output() onNewChat = new EventEmitter<void>();
    @Output() onSelectSession = new EventEmitter<ChatSession>();

    sessionService = inject(ChatSessionService);
    activeSessionId = this.sessionService.activeSessionId;

    searchQuery = '';
    hoveredId: string | null = null;
    editingId: string | null = null;
    editTitle = '';

    /**
     * Filter grouped sessions by search query.
     */
    filteredGroups() {
        const groups = this.sessionService.groupedSessions();
        if (!this.searchQuery.trim()) return groups;

        const q = this.searchQuery.toLowerCase();
        return groups
            .map(g => ({
                ...g,
                sessions: g.sessions.filter(s =>
                    s.title.toLowerCase().includes(q) ||
                    s.preview.toLowerCase().includes(q)
                )
            }))
            .filter(g => g.sessions.length > 0);
    }

    selectSession(session: ChatSession) {
        this.sessionService.setActiveSession(session.id);
        this.onSelectSession.emit(session);
    }

    startRename(session: ChatSession) {
        this.editingId = session.id;
        this.editTitle = session.title;
    }

    finishRename(sessionId: string) {
        if (this.editTitle.trim()) {
            this.sessionService.renameSession(sessionId, this.editTitle.trim());
        }
        this.editingId = null;
    }

    deleteSession(sessionId: string) {
        this.sessionService.deleteSession(sessionId);
    }

    formatTime(isoString: string): string {
        const d = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
