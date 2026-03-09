import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, Subject, BehaviorSubject, catchError, retry, timer, retryWhen, mergeMap, throwError } from 'rxjs';
import {
    AgentAction,
    AgentActivityUpdate,
    AgentMetadata,
    DifyChatResponse,
    DifyWorkflowResponse,
    DifyStreamChunk,
    WorkflowStreamEvent,
    AGENT_REGISTRY
} from '../../lib/agent-interfaces';
import { AuthService } from '../auth.service';
import AGENT_REGISTRY_JSON from '../../../../shared/agent-registry.json';

export interface DifyAgentResponse {
    answer: string;
    conversationId?: string;
    messageId?: string;
    metadata: AgentMetadata;
}

/** Streaming events emitted by sendMessageStreamed() */
export type StreamEvent =
    | { type: 'chunk'; text: string }                    // Incremental text (display immediately)
    | { type: 'thought'; thought: string }                // Agent reasoning step (optional UI)
    | { type: 'done'; response: DifyAgentResponse };      // Final parsed response with metadata

/**
 * Tracks the conversation state for a single Dify app.
 * Each Dify app (Orchestrator, Ideation, Diligence, etc.) has its own
 * conversation namespace — you cannot send a conversation_id from one
 * app to another.
 */
interface AgentConversation {
    conversationId: string | null;
    messageCount: number;
    startedAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class DifyService {
    private useMockDify = false; // Toggle: true=mock, false=real Dify
    private conversationStep = 0;

    // ─── Per-Agent Conversation Management ───────────────────────
    // Each Dify app has its own conversation thread. When the UI switches
    // from Orchestrator → Ideation → back, each agent resumes its own
    // conversation seamlessly.
    private conversations = new Map<string, AgentConversation>();

    // The currently active agent (drives UI label + message routing)
    private _activeAgentId = 'MASTER_COO';

    // Agent delegation stack — supports nested handoff + return
    // e.g. MASTER_COO → NPA_ORCHESTRATOR → IDEATION → back to NPA_ORCHESTRATOR
    private delegationStack: string[] = [];

    // Observable streams for real-time updates
    private agentActivity$ = new Subject<AgentActivityUpdate>();
    private streaming$ = new Subject<string>();

    // Emits when the active agent changes (components subscribe to update UI)
    private activeAgentChanged$ = new Subject<{ fromAgent: string; toAgent: string; reason: string }>();

    constructor(private http: HttpClient, private ngZone: NgZone, private auth: AuthService) { }

    private static readonly difyAppAliasToAgentId: Record<string, string> = (() => {
        const out: Record<string, string> = {};
        const priority: Record<string, number> = {};

        // Multiple internal agent IDs can point to the same Dify app (e.g. DILIGENCE + KB_SEARCH).
        // Prefer the higher-priority agent (lower tier number). If tied, keep the first seen.
        const setAlias = (key: string, agentId: string, tier: number) => {
            if (!key) return;
            const existingTier = priority[key];
            if (existingTier === undefined || tier < existingTier) {
                out[key] = agentId;
                priority[key] = tier;
            }
        };

        for (const a of (AGENT_REGISTRY_JSON as any[])) {
            if (!a?.id) continue;
            const id = String(a.id);
            const tier = typeof a.tier === 'number' ? a.tier : 99;

            if (a.difyApp) setAlias(String(a.difyApp), id, tier);
            if (Array.isArray(a.aliases)) {
                for (const alias of a.aliases) {
                    if (alias) setAlias(String(alias), id, tier);
                }
            }
        }
        return out;
    })();

    private get difyUser(): string {
        return this.auth.currentUser?.id || 'anonymous';
    }

    private get authHeader(): string | null {
        return this.auth.token ? `Bearer ${this.auth.token}` : null;
    }

    // ─── Public Getters ──────────────────────────────────────────

    /** Get the current active agent ID */
    get activeAgentId(): string {
        return this._activeAgentId;
    }

    /** Get the conversation ID for a specific agent (or current agent) */
    getConversationId(agentId?: string): string | null {
        const id = agentId || this._activeAgentId;
        return this.conversations.get(id)?.conversationId || null;
    }

    /** Get agent activity stream (which agents are running/done) */
    getAgentActivity(): Observable<AgentActivityUpdate> {
        return this.agentActivity$.asObservable();
    }

    /** Get streaming text chunks */
    getStreamingText(): Observable<string> {
        return this.streaming$.asObservable();
    }

    /** Get notified when the active agent changes (for UI updates) */
    getAgentChanges(): Observable<{ fromAgent: string; toAgent: string; reason: string }> {
        return this.activeAgentChanged$.asObservable();
    }

    /** Check if we have a prior conversation with a specific agent */
    hasConversation(agentId: string): boolean {
        return this.conversations.has(agentId) && !!this.conversations.get(agentId)?.conversationId;
    }

    /** Restore a conversation ID for a specific agent (used when resuming a session) */
    restoreConversation(agentId: string, conversationId: string): void {
        this.setConversationId(agentId, conversationId);
    }

    /** Export current multi-agent conversation state for persistence. */
    exportConversationState(): { activeAgentId: string; delegationStack: string[]; conversations: Record<string, string> } {
        const conversations: Record<string, string> = {};
        for (const [agentId, conv] of this.conversations.entries()) {
            if (conv?.conversationId) conversations[agentId] = conv.conversationId;
        }
        return {
            activeAgentId: this._activeAgentId,
            delegationStack: [...this.delegationStack],
            conversations
        };
    }

    /** Restore multi-agent conversation state (after reload / session load). */
    restoreConversationState(state: any): void {
        if (!state || typeof state !== 'object') return;
        const conversations = state.conversations && typeof state.conversations === 'object' ? state.conversations : {};
        for (const [agentId, conversationId] of Object.entries(conversations)) {
            if (typeof conversationId === 'string' && conversationId) {
                this.restoreConversation(String(agentId), conversationId);
            }
        }
        if (Array.isArray(state.delegationStack)) {
            this.delegationStack = state.delegationStack.map(String);
        }
        if (typeof state.activeAgentId === 'string' && state.activeAgentId) {
            this.setActiveAgent(state.activeAgentId);
        }
    }

    // ─── Agent Routing ───────────────────────────────────────────

    /**
     * Switch the active agent. Used when:
     * - Orchestrator delegates to Ideation (DELEGATE_AGENT / ROUTE_DOMAIN)
     * - Ideation hands back to Orchestrator (FINALIZE_DRAFT with target_agent)
     * - User navigates between agent views
     *
     * Pushes the current agent onto the delegation stack so we can return.
     */
    switchAgent(toAgentId: string, reason: string = 'manual'): void {
        const fromAgent = this._activeAgentId;
        if (fromAgent === toAgentId) return; // No-op if same agent

        // Push current agent to stack (for returnToPreviousAgent)
        this.delegationStack.push(fromAgent);

        this._activeAgentId = toAgentId;

        this.activeAgentChanged$.next({ fromAgent, toAgent: toAgentId, reason });
    }

    /**
     * Return to the previous agent in the delegation stack.
     * Used when a specialist agent (e.g. Ideation) completes and
     * hands back to the orchestrator.
     */
    returnToPreviousAgent(reason: string = 'handoff_complete'): string {
        const previousAgent = this.delegationStack.pop() || 'MASTER_COO';
        const fromAgent = this._activeAgentId;

        this._activeAgentId = previousAgent;

        this.activeAgentChanged$.next({ fromAgent, toAgent: previousAgent, reason });
        return previousAgent;
    }

    /**
     * Set active agent directly without pushing to delegation stack.
     * Used for UI-only agent label changes where no actual Dify app
     * switch is needed (e.g. display context updates).
     */
    setActiveAgent(agentId: string): void {
        const fromAgent = this._activeAgentId;
        if (fromAgent === agentId) return;
        this._activeAgentId = agentId;
        this.activeAgentChanged$.next({ fromAgent, toAgent: agentId, reason: 'set_active' });
    }

    /**
     * Process metadata from a Dify response and handle agent routing actions.
     * Returns routing info so the caller can render cards/notifications.
     *
     * This centralizes all routing logic — components don't need to
     * know the routing rules, they just call this and react to the return.
     */
    processAgentRouting(metadata: AgentMetadata): { shouldSwitch: boolean; targetAgent?: string; action: AgentAction } {
        const action = metadata?.agent_action;
        const payload = metadata?.payload;

        // Dify LLMs sometimes output Dify app names (e.g. "CF_NPA_Query_Assistant")
        // instead of internal agent_ids (e.g. "DILIGENCE"). Normalize them.
        const normalizeAgent = (id: string) => DifyService.difyAppAliasToAgentId[id] || id;

        // DELEGATE_AGENT: Explicit delegation to a specific agent
        if (action === 'DELEGATE_AGENT' && payload?.target_agent) {
            const target = normalizeAgent(payload.target_agent);
            this.switchAgent(target, `delegate:${action}`);
            return { shouldSwitch: true, targetAgent: target, action };
        }

        // ROUTE_DOMAIN: Orchestrator identified the domain — route to domain agent
        if (action === 'ROUTE_DOMAIN' && payload) {
            // Dify proxy produces payload.data.domainId (nested under data).
            // Support both flat (payload.domainId) and nested (payload.data.domainId).
            const domainId = payload.domainId || payload.data?.domainId;

            // Map domainId to the correct Dify agent_id
            const domainAgentMap: Record<string, string> = {
                'NPA': 'NPA_ORCHESTRATOR',
                'IDEATION': 'IDEATION',
                'RISK': 'RISK',
                'KB': 'KB_SEARCH',
                'OPS': 'GOVERNANCE',
                'DESK': 'DILIGENCE',
            };

            // If Dify explicitly set target_agent (e.g. "IDEATION"), prefer that
            // over the generic domainId mapping. This enables direct agent-to-agent
            // handoff within a ROUTE_DOMAIN action.
            let targetAgent: string;
            if (payload.target_agent && payload.target_agent !== 'MASTER_COO') {
                // Normalize: Dify app name → internal agent_id (if needed)
                targetAgent = normalizeAgent(payload.target_agent);
            } else {
                targetAgent = domainAgentMap[domainId] || 'NPA_ORCHESTRATOR';
            }

            // All domain agents (including NPA_ORCHESTRATOR) are separate Dify apps
            // with their own API keys and conversation_ids — do a real delegation
            this.switchAgent(targetAgent, `route_domain:${domainId}`);
            return { shouldSwitch: true, targetAgent, action };
        }

        // FINALIZE_DRAFT with target_agent: Agent completed, hand back
        if (action === 'FINALIZE_DRAFT' && payload?.target_agent) {
            // Don't auto-switch — let the component decide when to switch back
            return { shouldSwitch: false, targetAgent: payload.target_agent, action };
        }

        return { shouldSwitch: false, action: action || 'SHOW_RAW_RESPONSE' };
    }

    // ─── Chat Messages ───────────────────────────────────────────

    /**
     * Send a chat message to a Dify Chatflow/Agent app.
     * Automatically resolves the correct conversation_id for the target agent.
     *
     * @param query - User's message
     * @param userContext - Additional inputs for Dify
     * @param agentId - Target agent (defaults to activeAgentId)
     */
    sendMessage(query: string, userContext: any = {}, agentId?: string): Observable<DifyAgentResponse> {
        const targetAgent = agentId || this._activeAgentId;

        if (this.useMockDify) {
            return this.mockDifyLogic(query);
        }

        // Get the conversation_id for THIS specific agent
        const conversationId = this.getConversationId(targetAgent);

        return this.http.post<DifyChatResponse>('/api/dify/chat', {
            agent_id: targetAgent,
            query,
            inputs: userContext,
            conversation_id: conversationId,
            user: this.difyUser,
            response_mode: 'blocking'
        }).pipe(
            // No client-side retries — Express proxy already handles retries server-side.
            // Double retries caused 1m+ latency (up to 12 Dify calls per message).
            map(res => {
                // Store conversation_id scoped to THIS agent
                this.setConversationId(targetAgent, res.conversation_id);

                return {
                    answer: res.answer,
                    conversationId: res.conversation_id,
                    messageId: res.message_id,
                    metadata: res.metadata
                } as DifyAgentResponse;
            })
        );
    }

    /**
     * Send a chat message with SSE streaming support.
     * Returns immediately, emits chunks via streaming$ observable.
     */
    sendMessageStreaming(query: string, userContext: any = {}, agentId?: string): void {
        const targetAgent = agentId || this._activeAgentId;

        if (this.useMockDify) {
            const words = 'I am analyzing your request and routing to the appropriate specialist agent...'.split(' ');
            let i = 0;
            const interval = setInterval(() => {
                if (i < words.length) {
                    this.streaming$.next(words[i] + ' ');
                    i++;
                } else {
                    clearInterval(interval);
                    this.streaming$.next('[DONE]');
                }
            }, 100);
            return;
        }

        const conversationId = this.getConversationId(targetAgent);

        const body = JSON.stringify({
            agent_id: targetAgent,
            query,
            inputs: userContext,
            conversation_id: conversationId,
            user: this.difyUser,
            response_mode: 'streaming'
        });

        fetch('/api/dify/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.authHeader ? { Authorization: this.authHeader } : {})
            },
            body
        }).then(response => {
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            const read = (): void => {
                reader?.read().then(({ done, value }) => {
                    if (done) {
                        this.streaming$.next('[DONE]');
                        return;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(l => l.startsWith('data:'));
                    for (const line of lines) {
                        try {
                            const data: DifyStreamChunk = JSON.parse(line.slice(5).trim());
                            if (data.answer) {
                                this.streaming$.next(data.answer);
                            }
                            if (data.conversation_id) {
                                this.setConversationId(targetAgent, data.conversation_id);
                            }
                        } catch { /* skip malformed chunks */ }
                    }
                    read();
                });
            };
            read();
        });
    }

    /**
     * Send a chat message with TRUE SSE streaming.
     * Returns an Observable<StreamEvent> that emits:
     *  - { type:'chunk', text } as Dify streams answer tokens (display live)
     *  - { type:'thought', thought } for agent reasoning steps (update status bar)
     *  - { type:'done', response } when the full answer + metadata is ready
     *
     * The Express proxy pipes Dify's SSE stream directly when response_mode='streaming'.
     * This method parses those SSE events client-side, builds the full answer incrementally,
     * and at the end parses the [NPA_ACTION] markers from the accumulated text.
     */
    sendMessageStreamed(query: string, userContext: any = {}, agentId?: string): Observable<StreamEvent> {
        const targetAgent = agentId || this._activeAgentId;

        if (this.useMockDify) {
            return this._mockStreamedResponse(query);
        }

        const conversationId = this.getConversationId(targetAgent);

        return new Observable<StreamEvent>(subscriber => {
            let fullAnswer = '';
            let convId: string | undefined;
            let msgId: string | undefined;
            let abortController = new AbortController();

            const maxRetries = 3;
            const doFetch = (attempt: number): void => {
                fetch('/api/dify/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(this.authHeader ? { Authorization: this.authHeader } : {})
                    },
                    body: JSON.stringify({
                        agent_id: targetAgent,
                        query,
                        inputs: userContext,
                        conversation_id: conversationId,
                        user: this.difyUser,
                        response_mode: 'streaming'
                    }),
                    signal: abortController.signal
                }).then(response => {
                    if (!response.ok) {
                        const retryable = response.status === 502 || response.status === 503 || response.status === 504;
                        if (retryable && attempt < maxRetries) {
                            const delayMs = (attempt + 1) * 3000; // 3s, 6s, 9s
                            console.warn(`[DifyService] Chat stream retry ${attempt + 1}/${maxRetries} in ${delayMs}ms (HTTP ${response.status})`);
                            subscriber.next({ type: 'thought', thought: `Service temporarily unavailable, retrying (${attempt + 1}/${maxRetries})...` });
                            setTimeout(() => doFetch(attempt + 1), delayMs);
                            return;
                        }
                        subscriber.error(new Error(`HTTP ${response.status}`));
                        return;
                    }
                    const reader = response.body?.getReader();
                    if (!reader) { subscriber.error(new Error('No stream')); return; }
                    const decoder = new TextDecoder();
                    let buffer = '';
                    const eventQueue: StreamEvent[] = [];
                    let flushScheduled = false;
                    const scheduleFlush = () => {
                        if (flushScheduled) return;
                        flushScheduled = true;
                        const schedule = (cb: () => void) => {
                            if (typeof requestAnimationFrame === 'function') requestAnimationFrame(cb);
                            else setTimeout(cb, 16);
                        };
                        schedule(() => {
                            flushScheduled = false;
                            if (eventQueue.length === 0) return;
                            const toEmit = eventQueue.splice(0, eventQueue.length);
                            this.ngZone.run(() => {
                                for (const evt of toEmit) subscriber.next(evt);
                            });
                            if (eventQueue.length > 0) scheduleFlush();
                        });
                    };

                    const read = (): void => {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                // Stream ended — emit final parsed response
                                this.ngZone.run(() => this._finishStream(subscriber, fullAnswer, convId, msgId, targetAgent));
                                return;
                            }
                            buffer += decoder.decode(value, { stream: true });
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || ''; // keep partial last line

                            for (const line of lines) {
                                if (!line.startsWith('data:')) continue;
                                const jsonStr = line.slice(5).trim();
                                if (!jsonStr) continue;
                                try {
                                    const evt = JSON.parse(jsonStr);
                                    if (evt.event === 'agent_message' || evt.event === 'message') {
                                        const chunk = evt.answer || '';
                                        fullAnswer += chunk;
                                        if (chunk) eventQueue.push({ type: 'chunk', text: chunk });
                                    } else if (evt.event === 'agent_thought') {
                                        const thought = evt.thought || '';
                                        if (thought) eventQueue.push({ type: 'thought', thought });
                                    } else if (evt.event === 'message_end') {
                                        convId = evt.conversation_id || convId;
                                        msgId = evt.message_id || msgId;
                                    }
                                    if (evt.conversation_id) convId = evt.conversation_id;
                                    if (evt.message_id) msgId = evt.message_id;
                                } catch { /* skip malformed SSE lines */ }
                            }
                            if (eventQueue.length > 0) scheduleFlush();
                            read();
                        }).catch(err => {
                            if (err.name !== 'AbortError') {
                                // Stream interrupted — still emit what we have
                                this.ngZone.run(() => this._finishStream(subscriber, fullAnswer, convId, msgId, targetAgent));
                            }
                        });
                    };
                    read();
                }).catch(err => {
                    if (err.name === 'AbortError') return;
                    // Retry on network errors (fetch rejection, e.g. ECONNRESET)
                    if (attempt < maxRetries) {
                        const delayMs = (attempt + 1) * 3000;
                        console.warn(`[DifyService] Chat stream retry ${attempt + 1}/${maxRetries} in ${delayMs}ms (network error: ${err.message})`);
                        subscriber.next({ type: 'thought', thought: `Connection error, retrying (${attempt + 1}/${maxRetries})...` });
                        setTimeout(() => doFetch(attempt + 1), delayMs);
                        return;
                    }
                    subscriber.error(err);
                });
            };

            doFetch(0);

            // Teardown: abort fetch on unsubscribe
            return () => abortController.abort();
        });
    }

    /** Parse the accumulated answer for [NPA_ACTION] markers and emit final event */
    private _finishStream(
        subscriber: import('rxjs').Subscriber<StreamEvent>,
        fullAnswer: string, convId: string | undefined, msgId: string | undefined,
        targetAgent: string
    ) {
        if (convId) this.setConversationId(targetAgent, convId);

        // Parse the full answer through the blocking path's JSON endpoint to get metadata
        // For streaming, we parse markers client-side (simple regex for [NPA_ACTION] etc.)
        const metadata = this._parseMarkersClientSide(fullAnswer);
        const cleanAnswer = metadata._cleanAnswer;
        delete metadata._cleanAnswer;

        subscriber.next({
            type: 'done',
            response: {
                answer: cleanAnswer,
                conversationId: convId,
                messageId: msgId,
                metadata
            }
        });
        subscriber.complete();
    }

    /**
     * Client-side marker parser (mirrors server-side parseMarkers in dify-proxy.js).
     * Extracts [NPA_ACTION], [NPA_DATA], [NPA_AGENT], etc. from the full answer text.
     */
    private _parseMarkersClientSide(rawAnswer: string): any {
        if (!rawAnswer) {
            return { agent_action: 'SHOW_RAW_RESPONSE', agent_id: 'UNKNOWN', payload: {}, trace: {}, _cleanAnswer: '' };
        }

        // ── Try @@NPA_META@@{json} format first (Chatflow agents) ──
        const metaMatch = rawAnswer.match(/@@NPA_META@@(\{[\s\S]*\})$/);
        if (metaMatch) {
            try {
                const meta = JSON.parse(metaMatch[1]);
                const cleanAnswer = rawAnswer.slice(0, metaMatch.index).trimEnd();
                return {
                    agent_action: meta.agent_action || 'SHOW_RAW_RESPONSE',
                    agent_id: meta.agent_id || 'UNKNOWN',
                    payload: meta.payload || {},
                    trace: meta.trace || {},
                    _cleanAnswer: cleanAnswer
                };
            } catch (e) {
                console.warn('@@NPA_META@@ JSON parse failed:', e);
            }
        }

        // ── Try [NPA_ACTION]...[NPA_SESSION] marker format (Agent apps) ──
        const lines = rawAnswer.split('\n');
        const markers: Record<string, string> = {};
        let markerStartIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const stripped = lines[i].trim();
            if (stripped.startsWith('[NPA_')) {
                if (markerStartIndex === -1) markerStartIndex = i;
                const bracketEnd = stripped.indexOf(']');
                if (bracketEnd > 0) {
                    const key = stripped.substring(1, bracketEnd);
                    const value = stripped.substring(bracketEnd + 1).trim();
                    markers[key] = value;
                }
            }
        }

        if (markerStartIndex === -1 || !markers['NPA_ACTION']) {
            // ── Text-based delegation detection ──
            // Dify chatflow agents don't always emit [NPA_ACTION] markers.
            // Detect delegation intent from natural language patterns so the
            // frontend can switch the active agent even without formal markers.
            //
            // GUARD: Only orchestrator agents (MASTER_COO, NPA_ORCHESTRATOR) delegate.
            // Skip for specialist agents (IDEATION, RISK, CLASSIFIER, etc.) to avoid
            // false positives when they mention other agents in their responses.
            const delegatingAgents = ['MASTER_COO', 'NPA_ORCHESTRATOR', undefined, null, ''];
            const shouldCheckDelegation = delegatingAgents.includes(this._activeAgentId);

            const delegationPatterns: { pattern: RegExp; agentId: string; intent: string }[] = [
                { pattern: /(?:rout(?:e|ing)\b.{0,60}(?:cf_npa_ideation|ideation\s+(?:agent|specialist|workflow|module)))|rout(?:e|ing)\b.{0,60}ideation\b.{0,30}(?:interview|session|process)|initiating\s+ideation\s+(?:session|workflow)|starting\s+(?:the\s+)?ideation\s+interview|delegate.*ideation|conduct\s+(?:the\s+)?structured\s+(?:intake|interview).*ideation|structured\s+multi.?turn\s+interview/i, agentId: 'IDEATION', intent: 'create_npa' },
                { pattern: /(?:rout(?:e|ing)\b.{0,40}(?:the\s+)?classifier)|starting\s+classification|initiating\s+classification/i, agentId: 'CLASSIFIER', intent: 'classify_product' },
                { pattern: /(?:rout(?:e|ing)\b.{0,40}(?:the\s+)?risk\s+assess(?:ment\s+agent))|starting\s+risk\s+assessment|initiating\s+risk\s+assess/i, agentId: 'RISK', intent: 'assess_risk' },
                { pattern: /(?:rout(?:e|ing)\b.{0,40}(?:the\s+)?governance)|starting\s+governance\s+check/i, agentId: 'GOVERNANCE', intent: 'governance_check' },
                { pattern: /(?:rout(?:e|ing)\b.{0,40}(?:the\s+)?sign.?off)|starting\s+sign.?off\s+orchestration/i, agentId: 'SIGNOFF', intent: 'signoff_routing' },
                { pattern: /(?:rout(?:e|ing)\b.{0,40}cf_npa_query_assistant)|(?:rout(?:e|ing)\b.{0,40}(?:the\s+)?diligence)/i, agentId: 'DILIGENCE', intent: 'query_kb' },
            ];

            if (shouldCheckDelegation) {
                for (const dp of delegationPatterns) {
                    if (dp.pattern.test(rawAnswer)) {
                        return {
                            agent_action: 'DELEGATE_AGENT',
                            agent_id: this._activeAgentId || 'NPA_ORCHESTRATOR',
                            payload: {
                                target_agent: dp.agentId,
                                intent: dp.intent,
                                reason: 'Text-based delegation detected from agent response'
                            },
                            trace: {},
                            _cleanAnswer: rawAnswer
                        };
                    }
                }
            }

            return {
                agent_action: 'SHOW_RAW_RESPONSE', agent_id: 'UNKNOWN',
                payload: { raw_answer: rawAnswer }, trace: {},
                _cleanAnswer: rawAnswer
            };
        }

        const cleanAnswer = lines.slice(0, markerStartIndex).join('\n').trimEnd();

        let dataObj: any = {};
        if (markers['NPA_DATA']) {
            try { dataObj = JSON.parse(markers['NPA_DATA']); } catch { dataObj = { raw: markers['NPA_DATA'] }; }
        }

        return {
            agent_action: markers['NPA_ACTION'] || 'SHOW_RAW_RESPONSE',
            agent_id: markers['NPA_AGENT'] || 'UNKNOWN',
            payload: {
                projectId: markers['NPA_PROJECT'] || '',
                intent: markers['NPA_INTENT'] || '',
                target_agent: markers['NPA_TARGET'] || '',
                uiRoute: '/agents/npa',
                data: dataObj
            },
            trace: { session_id: markers['NPA_SESSION'] || '' },
            _cleanAnswer: cleanAnswer
        };
    }

    /** Mock streamed response for dev mode */
    private _mockStreamedResponse(query: string): Observable<StreamEvent> {
        return new Observable<StreamEvent>(sub => {
            const words = 'I am analyzing your request and routing to the appropriate specialist agent...'.split(' ');
            let i = 0;
            const iv = setInterval(() => {
                if (i < words.length) {
                    sub.next({ type: 'chunk', text: words[i] + ' ' });
                    i++;
                } else {
                    clearInterval(iv);
                    sub.next({ type: 'done', response: { answer: words.join(' '), metadata: { agent_action: 'SHOW_RAW_RESPONSE', agent_id: 'MASTER_COO', payload: {}, trace: {} } } });
                    sub.complete();
                }
            }, 80);
            return () => clearInterval(iv);
        });
    }

    /**
     * Execute a Dify Workflow agent (Tier 3 or 4).
     * Workflows are stateless — no conversation_id needed.
     */
    runWorkflow(agentId: string, inputs: Record<string, any> = {}): Observable<DifyWorkflowResponse> {
        if (this.useMockDify) {
            return this.mockWorkflow(agentId, inputs);
        }

        this.agentActivity$.next({ agentId, status: 'running' });

        return this.http.post<DifyWorkflowResponse>('/api/dify/workflow', {
            agent_id: agentId,
            inputs,
            user: this.difyUser,
            response_mode: 'blocking'
        }).pipe(
            // Retry on transient errors: status 0 (socket hang up / abort),
            // 502/503/504 (Dify rate limit / gateway errors)
            retryWhen(errors => {
                let attempt = 0;
                const maxRetries = 3;
                return errors.pipe(
                    mergeMap(err => {
                        attempt++;
                        const retryable = err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504;
                        if (retryable && attempt <= maxRetries) {
                            const delayMs = attempt * 3000; // 3s, 6s, 9s
                            console.warn(`[DifyService] ${agentId} retry ${attempt}/${maxRetries} in ${delayMs}ms (status=${err.status})`);
                            return timer(delayMs);
                        }
                        return throwError(() => err);
                    })
                );
            }),
            map(res => {
                this.agentActivity$.next({
                    agentId,
                    status: res.data.status === 'succeeded' ? 'done' : 'error'
                });
                return res;
            }),
            catchError(err => {
                console.error(`[DifyService] Workflow ${agentId} failed after retries:`, err);
                console.error(`[DifyService] ${agentId} error details — status: ${err.status}, statusText: ${err.statusText}, url: ${err.url}, message: ${err.message}`);
                this.agentActivity$.next({ agentId, status: 'error' });
                throw err;
            })
        );
    }


    // ─── State Management ────────────────────────────────────────

    /** Reset ALL conversation state (full reset on new session) */
    reset(): void {
        this.conversationStep = 0;
        this.conversations.clear();
        this.delegationStack = [];
        this._activeAgentId = 'MASTER_COO';
    }

    /** Reset only a specific agent's conversation (keep others intact) */
    resetAgent(agentId: string): void {
        this.conversations.delete(agentId);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    /** Store conversation_id scoped to a specific agent */
    private setConversationId(agentId: string, conversationId: string): void {
        const existing = this.conversations.get(agentId);
        if (existing) {
            existing.conversationId = conversationId;
            existing.messageCount++;
        } else {
            this.conversations.set(agentId, {
                conversationId,
                messageCount: 1,
                startedAt: new Date()
            });
        }
    }

    // ─── Mock Logic ──────────────────────────────────────────────

    /**
     * Master COO mock flow:
     *   Step 0: Domain detection (ROUTE_DOMAIN) + NPA greeting
     *   Step 1: Product description → Classification
     *   Step 2: Cross-border → Finalize
     *   Step 3+: Conversation done
     */
    private mockDifyLogic(query: string): Observable<DifyAgentResponse> {
        const lower = query.toLowerCase();

        // ─── Step 0: Master COO detects domain intent ───────────
        if (this.conversationStep === 0) {
            this.conversationStep++;
            const detectedDomain = this.detectDomain(lower);

            if (detectedDomain === 'NPA') {
                this.emitMockActivity(['MASTER_COO', 'NPA_ORCHESTRATOR']);
                return of({
                    answer: "I've identified this as a **New Product Approval** request. Routing you to the **NPA Domain Orchestrator**.\n\nPlease describe the product structure, underlying asset, and payout logic so I can begin the analysis.",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as AgentAction,
                        agent_id: 'MASTER_COO',
                        payload: {
                            domainId: 'NPA',
                            name: 'NPA Domain Orchestrator',
                            description: 'Create, classify, and manage New Product Approvals',
                            icon: 'target',
                            color: 'bg-orange-50 text-orange-600',
                            route: '/agents/npa'
                        },
                        trace: {}
                    }
                }).pipe(delay(1200));
            }

            if (detectedDomain === 'RISK') {
                this.emitMockActivity(['MASTER_COO', 'RISK']);
                return of({
                    answer: "I've identified this as a **Risk & Compliance** query. The Risk domain is currently in development.\n\nFor now, I can help you with NPA-related risk assessments through the NPA Agent. Would you like me to route you there?",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as AgentAction,
                        agent_id: 'MASTER_COO',
                        payload: {
                            domainId: 'RISK',
                            name: 'Risk Control Agent',
                            description: '4-layer risk cascade: Internal, Regulatory, Sanctions, Dynamic',
                            icon: 'shield-alert',
                            color: 'bg-red-50 text-red-600',
                            route: '/functions/orm'
                        },
                        trace: {}
                    }
                }).pipe(delay(1200));
            }

            if (detectedDomain === 'KB') {
                this.emitMockActivity(['MASTER_COO', 'KB_SEARCH']);
                return of({
                    answer: "I've routed your request to the **Knowledge Base Search Agent**. Let me search our SOPs, policies, and regulatory guidance for you.\n\nSearching...\n\n**Results (3 matches):**\n1. **MAS Notice 656** — Guidelines on Risk Management (92% match)\n2. **NPA SOP v4.2** — Standard Operating Procedure for Product Approvals (87% match)\n3. **T&M Policy Framework** — Trading & Markets Governance Policies (81% match)\n\nWould you like me to drill into any of these documents?",
                    metadata: {
                        agent_action: 'ROUTE_DOMAIN' as AgentAction,
                        agent_id: 'KB_SEARCH',
                        payload: {
                            domainId: 'KB',
                            name: 'KB Search Agent',
                            description: 'Semantic search over SOPs, policies, and regulatory guidance',
                            icon: 'search',
                            color: 'bg-fuchsia-50 text-fuchsia-600',
                            route: '/knowledge/base'
                        },
                        trace: {}
                    }
                }).pipe(delay(1500));
            }

            // Default: still route but explain capabilities
            this.emitMockActivity(['MASTER_COO']);
            return of({
                answer: "I'm the **Master COO Orchestrator**. I manage 7 COO domains:\n\n" +
                    "* **New Product Approval (NPA)** — Active\n" +
                    "* **Desk Support** — Coming Soon\n" +
                    "* **DCE Client Services** — Coming Soon\n" +
                    "* **Operational Risk** — Coming Soon\n" +
                    "* **Strategic PM** — Coming Soon\n" +
                    "* **Business Leads** — Coming Soon\n" +
                    "* **Business Analysis** — Coming Soon\n\n" +
                    "Currently, the **NPA domain** is fully active. Try asking me to create a new product, run a risk check, or search the knowledge base.",
                metadata: {
                    agent_action: 'SHOW_RAW_RESPONSE' as AgentAction,
                    agent_id: 'MASTER_COO',
                    payload: { raw_answer: 'Domain overview' },
                    trace: {}
                }
            }).pipe(delay(1000));
        }

        // ─── Step 1: Within NPA domain — Product description → Classification ───
        if (this.conversationStep === 1) {
            this.conversationStep++;

            if (lower.includes('crypto') || lower.includes('bitcoin')) {
                this.emitMockActivity(['CLASSIFIER', 'RISK']);
                return of({
                    answer: "**HARD STOP** — Prohibited item detected.\n\nMy analysis classifies this as a **New-to-Group (NTG)** product involving Crypto assets, which is on the **Prohibited List** (Layer: REGULATORY).\n\nYou cannot proceed with an NPA. Contact the Product Approval Committee for exemption review.",
                    metadata: {
                        agent_action: 'STOP_PROCESS' as AgentAction,
                        agent_id: 'RISK',
                        payload: {
                            type: 'NTG',
                            track: 'Prohibited',
                            hardStop: true,
                            prohibitedMatch: { matched: true, item: 'Cryptocurrency', layer: 'REGULATORY' }
                        },
                        trace: {}
                    }
                }).pipe(delay(2000));
            }

            this.emitMockActivity(['CLASSIFIER', 'KB_SEARCH', 'ML_PREDICT']);
            return of({
                answer: "I've analyzed your description and activated specialist agents:\n\n**Classification Agent**: Variation / Existing product\n**KB Search**: Found similar NPA 'TSG1917' (94% match)\n**ML Prediction**: 82% approval likelihood, est. 35 days\n\nOne critical check: **Will this product involve booking across multiple locations (Cross-Border)?**",
                metadata: {
                    agent_action: 'SHOW_CLASSIFICATION' as const,
                    agent_id: 'CLASSIFIER',
                    payload: {
                        type: 'Variation',
                        track: 'NPA Lite',
                        scores: [
                            { criterion: 'Novelty', score: 3, maxScore: 10, reasoning: 'Similar to existing FX products' },
                            { criterion: 'Complexity', score: 5, maxScore: 10, reasoning: 'Standard structured product' },
                            { criterion: 'Risk Impact', score: 4, maxScore: 10, reasoning: 'Within approved risk appetite' },
                            { criterion: 'Regulatory', score: 2, maxScore: 10, reasoning: 'Covered under existing MAS framework' },
                            { criterion: 'Technology', score: 3, maxScore: 10, reasoning: 'Minor booking system changes' },
                            { criterion: 'Market', score: 4, maxScore: 10, reasoning: 'Established market segment' },
                            { criterion: 'Cross-Border', score: 2, maxScore: 10, reasoning: 'Single jurisdiction expected' }
                        ],
                        overallConfidence: 88,
                        prohibitedMatch: { matched: false }
                    },
                    trace: {}
                }
            }).pipe(delay(2000));
        }

        // ─── Step 2: Cross-border answer → Finalize ───
        if (this.conversationStep === 2) {
            this.conversationStep++;
            const isCrossBorder = lower.includes('yes') || lower.includes('hk') || lower.includes('london') || lower.includes('hong kong');

            this.emitMockActivity(['GOVERNANCE', 'DOC_LIFECYCLE']);

            let answer = "All specialist agents have completed their analysis:\n\n### Summary\n";
            answer += `* **Track**: NPA Lite (Variation)\n`;
            answer += `* **Cross-Border**: ${isCrossBorder ? 'YES' : 'NO'}\n`;

            if (isCrossBorder) {
                answer += "* **Mandatory Sign-Offs**: Finance, Credit, MLR, Tech, Ops\n";
            } else {
                answer += "* **Mandatory Sign-Offs**: Finance, Credit, Ops\n";
            }

            answer += "\nThe NPA draft has been created. Access it from the notification below.";

            return of({
                answer,
                metadata: {
                    agent_action: 'FINALIZE_DRAFT' as AgentAction,
                    agent_id: 'NPA_ORCHESTRATOR',
                    payload: {
                        track: 'NPA_LITE',
                        isCrossBorder,
                        mandatorySignOffs: isCrossBorder
                            ? ['FINANCE', 'CREDIT', 'MLR', 'TECH', 'OPS']
                            : ['FINANCE', 'CREDIT', 'OPS'],
                        autoFillCoverage: 0,
                        mlPrediction: { approvalLikelihood: 82, timelineDays: 35, bottleneckDept: 'Legal' }
                    },
                    trace: {}
                }
            }).pipe(delay(2500));
        }

        return of({
            answer: "I've completed this analysis. You can reset the conversation to start a new query, or use the button above to open the full NPA workspace.",
            metadata: {
                agent_action: 'SHOW_RAW_RESPONSE' as AgentAction,
                agent_id: 'MASTER_COO',
                payload: { raw_answer: "Analysis complete." },
                trace: {}
            }
        }).pipe(delay(500));
    }

    /** Detect which COO domain the user is asking about */
    private detectDomain(lower: string): 'NPA' | 'RISK' | 'KB' | 'OPS' | 'DESK' | 'GENERAL' {
        const npaKeywords = ['npa', 'new product', 'product approval', 'create a product', 'structured note',
            'structured product', 'derivative', 'etf', 'fx accumulator', 'fx option', 'bond', 'swap',
            'approval', 'classify', 'classification', 'ideation', 'concept paper', 'prohibited'];
        const riskKeywords = ['risk assessment', 'risk check', 'compliance check', 'regulatory', 'sanctions',
            'prohibited list', 'risk cascade', 'operational risk', 'credit risk', 'market risk'];
        const kbKeywords = ['search', 'knowledge', 'sop', 'policy', 'guideline', 'mas notice', 'regulation',
            'documentation', 'procedure', 'framework'];
        const opsKeywords = ['settlement', 'booking', 'murex', 'operations', 'workflow', 'process flow'];
        const deskKeywords = ['desk support', 'trade error', 'booking error', 'system access', 'entitlement'];

        if (npaKeywords.some(k => lower.includes(k))) return 'NPA';
        if (riskKeywords.some(k => lower.includes(k))) return 'RISK';
        if (kbKeywords.some(k => lower.includes(k))) return 'KB';
        if (opsKeywords.some(k => lower.includes(k))) return 'OPS';
        if (deskKeywords.some(k => lower.includes(k))) return 'DESK';
        return 'GENERAL';
    }

    private mockWorkflow(agentId: string, inputs: Record<string, any>): Observable<DifyWorkflowResponse> {
        this.agentActivity$.next({ agentId, status: 'running' });

        const mockOutputs: Record<string, any> = {
            CLASSIFIER: {
                type: 'Variation', track: 'NPA Lite',
                scores: [{ criterion: 'Novelty', score: 3, maxScore: 10 }],
                overallConfidence: 88
            },
            RISK: {
                layers: [
                    { name: 'Internal Policy', status: 'PASS', details: 'Compliant' },
                    { name: 'Regulatory', status: 'PASS', details: 'MAS 656 compliant' },
                    { name: 'Sanctions', status: 'PASS', details: 'No matches' },
                    { name: 'Dynamic', status: 'WARNING', details: 'Elevated market volatility' }
                ],
                overallScore: 72, hardStop: false
            },
            ML_PREDICT: {
                approvalLikelihood: 82, timelineDays: 35,
                bottleneckDept: 'Legal', riskScore: 28
            },
            KB_SEARCH: {
                results: [
                    { docId: 'TSG1917', title: 'FX Structured Note', snippet: 'Similar FX derivative...', similarity: 0.94, source: 'Historical NPAs' },
                    { docId: 'TSG1845', title: 'Interest Rate Swap', snippet: 'IR product with...', similarity: 0.87, source: 'Historical NPAs' }
                ]
            },
            GOVERNANCE: {
                signoffs: [
                    { department: 'Finance', status: 'PENDING' },
                    { department: 'Credit', status: 'PENDING' },
                    { department: 'Operations', status: 'PENDING' }
                ],
                slaStatus: 'on_track', loopBackCount: 0, circuitBreaker: false
            }
        };

        const outputs = mockOutputs[agentId] || {};

        return of({
            workflow_run_id: `wf-${Date.now()}`,
            task_id: `task-${Date.now()}`,
            data: {
                outputs,
                status: 'succeeded' as const
            },
            metadata: {
                agent_action: 'SHOW_RAW_RESPONSE' as AgentAction,
                agent_id: agentId,
                payload: outputs,
                trace: {}
            }
        }).pipe(
            delay(1500),
            map(res => {
                this.agentActivity$.next({ agentId, status: 'done' });
                return res;
            })
        );
    }

    private emitMockActivity(agents: string[]): void {
        agents.forEach((agentId, i) => {
            setTimeout(() => {
                this.agentActivity$.next({ agentId, status: 'running' });
            }, i * 300);
            setTimeout(() => {
                this.agentActivity$.next({ agentId, status: 'done' });
            }, 1000 + i * 500);
        });
    }
}
