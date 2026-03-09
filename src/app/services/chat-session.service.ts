import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Represents a single message within a chat session.
 * Maps to the agent_messages table in the Railway MySQL database.
 */
export interface StoredMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: string; // ISO string
    agentIdentityId?: string;
    cardType?: string;
    cardData?: any;
    agentAction?: string;
}

/**
 * A saved chat session with metadata.
 * Maps to the agent_sessions table (+ joined agent_messages).
 */
export interface ChatSession {
    id: string;
    title: string;
    preview: string;          // First user message or first 80 chars
    createdAt: string;        // ISO string (started_at)
    updatedAt: string;        // ISO string (updated_at)
    messageCount: number;
    messages: StoredMessage[];
    activeAgentId?: string;   // Which agent was active at end of session
    conversationState?: any;  // Per-agent conversation_id map + delegation stack + active agent
    projectId?: string;       // NPA project this session belongs to (scoped rehydration)
    domainAgent?: {
        id: string;
        name: string;
        icon: string;
        color: string;
    };
}

/** Shape returned by the Express GET /api/agents/sessions endpoint */
interface SessionRow {
    id: string;
    project_id: string | null;
    user_id: string | null;
    title: string | null;
    preview: string | null;
    started_at: string;
    updated_at: string;
    agent_identity: string | null;
    domain_agent_json: any;
    conversation_state_json?: any;
    current_stage: string | null;
    handoff_from: string | null;
    ended_at: string | null;
    message_count: number;
    messages?: any[];
}

const API_BASE = '/api/agents';
const ACTIVE_SESSION_STORAGE_KEY = 'coo_active_chat_session_id';

@Injectable({
    providedIn: 'root'
})
export class ChatSessionService {
    private http = inject(HttpClient);

    /** All saved sessions (reactive signal) */
    private _sessions = signal<ChatSession[]>([]);

    /** Public read-only signal */
    sessions = this._sessions.asReadonly();

    /** Sessions grouped by date for sidebar display */
    groupedSessions = computed(() => {
        const sessions = this._sessions();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 86400000);
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        const monthAgo = new Date(today.getTime() - 30 * 86400000);

        const groups: { label: string; sessions: ChatSession[] }[] = [
            { label: 'Today', sessions: [] },
            { label: 'Yesterday', sessions: [] },
            { label: 'Previous 7 Days', sessions: [] },
            { label: 'Previous 30 Days', sessions: [] },
            { label: 'Older', sessions: [] },
        ];

        for (const s of sessions) {
            const d = new Date(s.updatedAt);
            if (d >= today) groups[0].sessions.push(s);
            else if (d >= yesterday) groups[1].sessions.push(s);
            else if (d >= weekAgo) groups[2].sessions.push(s);
            else if (d >= monthAgo) groups[3].sessions.push(s);
            else groups[4].sessions.push(s);
        }

        // Only return non-empty groups
        return groups.filter(g => g.sessions.length > 0);
    });

    /** The currently active session ID (null = new unsaved session) */
    private _activeSessionId = signal<string | null>(null);
    activeSessionId = this._activeSessionId.asReadonly();

    constructor() {
        // Restore last active session across reloads (best-effort).
        try {
            const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
            if (saved) this._activeSessionId.set(saved);
        } catch { /* ignore */ }
        // Load sessions from DB on startup (with retry on failure)
        this.loadSessionsWithRetry();
    }

    /**
     * Load sessions with automatic retry (2 retries, 3s apart).
     * Handles the case where Express server starts slightly after Angular.
     */
    private async loadSessionsWithRetry(retries = 2, delayMs = 3000): Promise<void> {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await this.loadSessionsFromDB();
                return; // Success — stop retrying
            } catch {
                if (attempt < retries) {
                    console.warn(`[ChatSessionService] Retry ${attempt + 1}/${retries} in ${delayMs / 1000}s...`);
                    await new Promise(r => setTimeout(r, delayMs));
                }
            }
        }
    }

    // ─── Public API ────────────────────────────────────────────

    /**
     * Save or update a chat session.
     * Called whenever the user sends/receives a message.
     * Uses optimistic updates (signal first) then persists to Railway MySQL.
     */
    saveSession(
        messages: { role: string; content: string; timestamp: Date; agentIdentity?: any; cardType?: string; cardData?: any; agentAction?: string }[],
        activeAgentId?: string,
        domainAgent?: { id: string; name: string; icon: string; color: string } | null
    ): string {
        return this.saveSessionFor(this._activeSessionId(), messages, activeAgentId, domainAgent, { makeActive: true });
    }

    /**
     * Save/update a specific session ID (or create one if null).
     * This avoids cross-component clobbering of the global activeSessionId
     * (e.g. Draft Builder agent chat saving while the main workspace is open).
     *
     * By default, this does NOT change the global activeSessionId unless makeActive=true.
     */
    saveSessionFor(
        sessionId: string | null,
        messages: { role: string; content: string; timestamp: Date; agentIdentity?: any; cardType?: string; cardData?: any; agentAction?: string }[],
        activeAgentId?: string,
        domainAgent?: { id: string; name: string; icon: string; color: string } | null,
        opts: { makeActive?: boolean; conversationState?: any; projectId?: string } = {}
    ): string {
        if (messages.length === 0) return '';

        const storedMessages: StoredMessage[] = messages.map(m => ({
            role: m.role as 'user' | 'agent',
            content: m.content,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
            agentIdentityId: m.agentIdentity?.id,
            cardType: m.cardType,
            cardData: m.cardData,
            agentAction: m.agentAction
        }));

        // Generate title from first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = this.generateTitle(firstUserMsg?.content || 'New Chat');
        const preview = (firstUserMsg?.content || 'New conversation').substring(0, 200);

        if (sessionId) {
            // ── Update existing session ──
            const sessions = [...this._sessions()];
            const idx = sessions.findIndex(s => s.id === sessionId);
            if (idx >= 0) {
                sessions[idx] = {
                    ...sessions[idx],
                    messages: storedMessages,
                    messageCount: storedMessages.length,
                    updatedAt: new Date().toISOString(),
                    activeAgentId,
                    domainAgent: domainAgent || undefined,
                    conversationState: opts.conversationState ?? sessions[idx].conversationState,
                    projectId: opts.projectId ?? sessions[idx].projectId,
                    title,
                    preview
                };
                // Move to front (most recent)
                const updated = sessions.splice(idx, 1)[0];
                sessions.unshift(updated);
                this._sessions.set(sessions);
            }
            // Persist to DB (fire-and-forget)
            this.updateSessionInDB(sessionId, title, preview, activeAgentId, domainAgent, storedMessages, opts.conversationState, opts.projectId);
        } else {
            // ── Create new session ──
            sessionId = this.generateId();
            const newSession: ChatSession = {
                id: sessionId,
                title,
                preview,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messageCount: storedMessages.length,
                messages: storedMessages,
                activeAgentId,
                conversationState: opts.conversationState,
                projectId: opts.projectId,
                domainAgent: domainAgent || undefined
            };
            const sessions = [newSession, ...this._sessions()];
            this._sessions.set(sessions);
            if (opts.makeActive) {
                this._activeSessionId.set(sessionId);
            }

            // Persist to DB (fire-and-forget)
            this.createSessionInDB(sessionId, title, preview, activeAgentId, domainAgent, storedMessages, opts.conversationState, opts.projectId);
        }

        if (opts.makeActive && sessionId) {
            this._activeSessionId.set(sessionId);
            try { localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId); } catch { /* ignore */ }
        }
        return sessionId!;
    }

    /**
     * Load a session by ID from the local signal cache.
     */
    getSession(sessionId: string): ChatSession | null {
        return this._sessions().find(s => s.id === sessionId) || null;
    }

    /**
     * Fetch a session with full messages from the database.
     * Used when loading a session from the sidebar (messages aren't in the list query).
     */
    async fetchSessionWithMessages(sessionId: string): Promise<ChatSession | null> {
        try {
            const row = await firstValueFrom(
                this.http.get<SessionRow>(`${API_BASE}/sessions/${sessionId}`)
            );
            return this.mapRowToSession(row, row.messages || []);
        } catch {
            return null;
        }
    }

    /**
     * Set the active session (when user clicks a session in sidebar).
     */
    setActiveSession(sessionId: string | null): void {
        this._activeSessionId.set(sessionId);
        try {
            if (sessionId) localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, sessionId);
            else localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
        } catch { /* ignore */ }
    }

    /**
     * Start a new (unsaved) session.
     */
    startNewSession(): void {
        this._activeSessionId.set(null);
        try { localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY); } catch { /* ignore */ }
    }

    /**
     * Delete a session by ID. Optimistic signal update then DB delete.
     */
    deleteSession(sessionId: string): void {
        const sessions = this._sessions().filter(s => s.id !== sessionId);
        this._sessions.set(sessions);
        if (this._activeSessionId() === sessionId) {
            this._activeSessionId.set(null);
        }
        // Persist to DB
        this.http.delete(`${API_BASE}/sessions/${sessionId}`).subscribe({
            error: (err) => console.warn('[ChatSessionService] DB delete failed:', err)
        });
    }

    /**
     * Rename a session. Optimistic signal update then DB update.
     */
    renameSession(sessionId: string, newTitle: string): void {
        const sessions = [...this._sessions()];
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) {
            sessions[idx] = { ...sessions[idx], title: newTitle };
            this._sessions.set(sessions);
            // Persist to DB
            this.http.put(`${API_BASE}/sessions/${sessionId}`, { title: newTitle }).subscribe({
                error: (err) => console.warn('[ChatSessionService] DB rename failed:', err)
            });
        }
    }

    /**
     * Get sessions scoped to a specific NPA project from the local signal cache.
     */
    getSessionsForProject(projectId: string): ChatSession[] {
        return this._sessions().filter(s => s.projectId === projectId);
    }

    /**
     * Get the most recent session for a project (for conversation rehydration).
     */
    getLatestSessionForProject(projectId: string): ChatSession | null {
        const sessions = this.getSessionsForProject(projectId);
        return sessions.length > 0 ? sessions[0] : null; // Already sorted by updatedAt DESC
    }

    /**
     * Load sessions scoped to a specific project from the DB.
     * Merges into the local signal (avoids duplicates).
     */
    async loadSessionsForProject(projectId: string): Promise<ChatSession[]> {
        try {
            const rows = await firstValueFrom(
                this.http.get<SessionRow[]>(`${API_BASE}/sessions?project_id=${encodeURIComponent(projectId)}`)
            );
            const projectSessions: ChatSession[] = rows.map(r => this.mapRowToSession(r));

            // Merge into local signal (replace existing project sessions, keep others)
            const existing = this._sessions().filter(s => s.projectId !== projectId);
            this._sessions.set([...projectSessions, ...existing]);

            return projectSessions;
        } catch (err) {
            console.warn(`[ChatSessionService] Failed to load sessions for project ${projectId}:`, err);
            return [];
        }
    }

    /**
     * Clear all sessions. Optimistic signal update then DB delete.
     */
    clearAll(): void {
        this._sessions.set([]);
        this._activeSessionId.set(null);
        // Persist to DB
        this.http.delete(`${API_BASE}/sessions`).subscribe({
            error: (err) => console.warn('[ChatSessionService] DB clear failed:', err)
        });
    }

    /**
     * Reload sessions from the Railway MySQL database.
     * Called on service init and can be called manually for refresh.
     */
    async loadSessionsFromDB(): Promise<void> {
        try {
            const rows = await firstValueFrom(
                this.http.get<SessionRow[]>(`${API_BASE}/sessions`)
            );
            const sessions: ChatSession[] = rows.map(r => this.mapRowToSession(r));
            this._sessions.set(sessions);
        } catch (err) {
            console.warn('[ChatSessionService] Failed to load sessions from DB:', err);
            this._sessions.set([]);
            throw err; // Re-throw so retry mechanism can catch it
        }
    }

    // ─── Private: DB Persistence ──────────────────────────────

    private async createSessionInDB(
        id: string,
        title: string,
        preview: string,
        activeAgentId?: string,
        domainAgent?: { id: string; name: string; icon: string; color: string } | null,
        messages?: StoredMessage[],
        conversationState?: any,
        projectId?: string
    ): Promise<void> {
        try {
            // 1. Create the session record (server accepts client-provided ID)
            await firstValueFrom(
                this.http.post(`${API_BASE}/sessions`, {
                    id,
                    title,
                    preview,
                    agent_identity: activeAgentId || null,
                    domain_agent_json: domainAgent || null,
                    conversation_state_json: conversationState || null,
                    project_id: projectId || null
                })
            );

            // 2. Batch-insert messages
            if (messages && messages.length > 0) {
                await this.batchSaveMessages(id, messages);
            }
        } catch (err) {
            console.warn('[ChatSessionService] DB create failed:', err);
        }
    }

    private async updateSessionInDB(
        id: string,
        title: string,
        preview: string,
        activeAgentId?: string,
        domainAgent?: { id: string; name: string; icon: string; color: string } | null,
        messages?: StoredMessage[],
        conversationState?: any,
        projectId?: string
    ): Promise<void> {
        try {
            // 1. Update session metadata
            await firstValueFrom(
                this.http.put(`${API_BASE}/sessions/${id}`, {
                    title,
                    preview,
                    agent_identity: activeAgentId || null,
                    domain_agent_json: domainAgent || null,
                    conversation_state_json: conversationState || null,
                    project_id: projectId || undefined
                })
            );

            // 2. Batch-replace messages
            if (messages && messages.length > 0) {
                await this.batchSaveMessages(id, messages);
            }
        } catch (err) {
            console.warn('[ChatSessionService] DB update failed:', err);
        }
    }

    private async batchSaveMessages(sessionId: string, messages: StoredMessage[]): Promise<void> {
        const dbMessages = messages.map(m => ({
            role: m.role,
            content: m.content,
            agent_identity_id: m.agentIdentityId || null,
            timestamp: m.timestamp || new Date().toISOString(),
            metadata: {
                cardType: m.cardType || null,
                cardData: m.cardData || null,
                agentAction: m.agentAction || null
            }
        }));

        await firstValueFrom(
            this.http.post(`${API_BASE}/sessions/${sessionId}/messages/batch`, {
                messages: dbMessages
            })
        );
    }

    // ─── Private: Mapping & Helpers ───────────────────────────

    /**
     * Map a DB row to the ChatSession interface used by the UI.
     */
    private mapRowToSession(row: SessionRow, messageRows?: any[]): ChatSession {
        const domainAgent = row.domain_agent_json
            ? (typeof row.domain_agent_json === 'string' ? JSON.parse(row.domain_agent_json) : row.domain_agent_json)
            : undefined;
        const conversationState = row.conversation_state_json
            ? (typeof row.conversation_state_json === 'string' ? JSON.parse(row.conversation_state_json) : row.conversation_state_json)
            : undefined;

        // Map DB messages to StoredMessage format (only present when fetching single session)
        const messages: StoredMessage[] = (messageRows || []).map((m: any) => {
            const metadata = m.metadata
                ? (typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata)
                : {};
            return {
                role: m.role as 'user' | 'agent',
                content: m.content,
                timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
                agentIdentityId: m.agent_identity_id || undefined,
                cardType: metadata?.cardType || undefined,
                cardData: metadata?.cardData || undefined,
                agentAction: metadata?.agentAction || undefined
            };
        });

        return {
            id: row.id,
            title: row.title || 'Untitled Chat',
            preview: row.preview || '',
            createdAt: row.started_at ? new Date(row.started_at).toISOString() : new Date().toISOString(),
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
            messageCount: row.message_count || messages.length,
            messages,
            activeAgentId: row.agent_identity || undefined,
            conversationState,
            projectId: row.project_id || undefined,
            domainAgent
        };
    }

    private generateId(): string {
        return `cs_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    private generateTitle(firstMessage: string): string {
        const clean = firstMessage
            .replace(/[#*_~`]/g, '')  // Remove markdown
            .replace(/\n/g, ' ')       // Flatten newlines
            .trim();
        if (clean.length <= 50) return clean;
        return clean.substring(0, 47) + '...';
    }
}
