# UI Changes for Agent Integration

> **Purpose:** This document details every Angular frontend change needed to replace the current 100% mock data flow with real Dify Chatflow + MCP tool-backed agent interactions. It is designed to be implemented **after** the Dify agents and MCP tools are running.

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Target Architecture](#2-target-architecture)
3. [Change 1: DifyService — Real Streaming API](#3-change-1-difyservice--real-streaming-api)
4. [Change 2: OrchestratorChatComponent — SSE Streaming](#4-change-2-orchestratorchatcomponent--sse-streaming)
5. [Change 3: ChatMessage Model — Agent Metadata](#5-change-3-chatmessage-model--agent-metadata)
6. [Change 4: AgentGovernanceService — Remove Mock Logic](#6-change-4-agentgovernanceservice--remove-mock-logic)
7. [Change 5: DifyAgentService — Live Health & Work Items](#7-change-5-difyagentservice--live-health--work-items)
8. [Change 6: NpaDetailComponent — Auto-Refresh Tabs](#8-change-6-npadetailcomponent--auto-refresh-tabs)
9. [Change 7: New AgentActivityPanelComponent](#9-change-7-new-agentactivitypanelcomponent)
10. [Change 8: New DifyConversationService](#10-change-8-new-difyconversationservice)
11. [Change 9: Session Linkage (conversation_id <-> npa_id)](#11-change-9-session-linkage)
12. [Change 10: New Express Proxy Routes for Dify](#12-change-10-new-express-proxy-routes-for-dify)
13. [Change 11: Environment Configuration](#13-change-11-environment-configuration)
14. [Change 12: Real-Time Polling Service](#14-change-12-real-time-polling-service)
15. [Change 13: Agent Visibility Cards in Chat](#15-change-13-agent-visibility-cards-in-chat)
16. [Change 14: NPA Pipeline Table — Live Data](#16-change-14-npa-pipeline-table--live-data)
17. [Change 15: Approval Dashboard — Live Sign-Offs](#17-change-15-approval-dashboard--live-sign-offs)
18. [File Impact Matrix](#18-file-impact-matrix)
19. [Implementation Priority & Phases](#19-implementation-priority--phases)
20. [Testing Checklist](#20-testing-checklist)

---

## 1. Current State Summary

The Angular frontend currently uses **100% mock data** for all AI agent interactions:

| Component / Service | Current State | Mock Pattern |
|---------------------|---------------|--------------|
| `DifyService` | `useMockDify = true` | Step-based conversation flow (0-3) with hardcoded responses |
| `AgentGovernanceService` | Mock readiness + classification | `mockReadinessLogic()` and `mockClassificationLogic()` with `of().pipe(delay())` |
| `DifyAgentService` | Mock capabilities, work items, health | Static arrays wrapped in `of().pipe(delay())` |
| `OrchestratorChatComponent` | Demo flow config | `FlowStep[]` array with trigger patterns and pre-written responses |
| `NpaDetailComponent` | Loads from Express API | `AgentGovernanceService.getProjectDetails()` — real API but no auto-refresh |
| Dashboard components | Static mock data | Hardcoded `AgentWorkItem[]`, `NPAPipelineItem[]`, `HealthMetrics` |

### Key Limitations

1. **No streaming** — Responses appear after a `setTimeout()` / `delay()`, not streamed token-by-token
2. **No session linkage** — No `conversation_id` persisted between chat and NPA records
3. **No agent visibility** — User cannot see which agent is running, which MCP tools are being called
4. **No auto-refresh** — NPA detail tabs don't update when agents write to the database
5. **No real-time status** — Dashboard shows static data, not live agent activity

---

## 2. Target Architecture

```
User Input (Chat)
    |
    v
Angular DifyService (HTTP SSE)
    |
    v
Express Proxy (/api/dify/*)
    |
    v
Dify Chatflow API (localhost:80)
    |
    v
Dify Agent Nodes
    |
    v
MCP Tools (REST API on port 3002)
    |
    v
MariaDB (npa_workbench)
    |
    v
Express API (existing /api/governance/* routes)
    |
    v
Angular Components (auto-refresh from DB)
```

**Data flows in two directions:**
- **Write path:** User chat -> Dify -> MCP tools -> MariaDB
- **Read path:** Angular -> Express API -> MariaDB -> UI components

The UI needs to poll or subscribe to changes from the Read path while the Write path executes.

---

## 3. Change 1: DifyService — Real Streaming API

**File:** `src/app/services/dify/dify.service.ts`

**What changes:**
- Replace mock logic with real Dify Chatflow API calls using SSE streaming
- Add `conversation_id` persistence per NPA session
- Add streaming response support (token-by-token rendering)
- Keep `useMockDify` flag for development fallback

### Current Interface

```typescript
export interface DifyAgentResponse {
    answer: string;
    metadata?: {
        agent_action?: 'ROUTE_WORK_ITEM' | 'ASK_CLARIFICATION' | 'STOP_PROCESS' | 'FINALIZE_DRAFT';
        payload?: any;
    };
}
```

### New Interface

```typescript
export interface DifyStreamEvent {
    event: 'message' | 'agent_message' | 'agent_thought' | 'message_end' | 'error' | 'message_file';
    task_id: string;
    message_id: string;
    conversation_id: string;
    answer?: string;           // Partial token (streaming)
    thought?: string;          // Agent reasoning (from agent_thought events)
    tool?: string;             // MCP tool name being called
    tool_input?: string;       // Tool input JSON
    observation?: string;      // Tool result
    created_at?: number;
    metadata?: {
        usage?: { total_tokens: number };
        retriever_resources?: any[];
    };
}

export interface DifyAgentResponse {
    answer: string;
    conversation_id: string;
    message_id: string;
    metadata?: {
        agent_action?: string;
        payload?: any;
        tools_used?: string[];
        agent_thoughts?: AgentThought[];
    };
}

export interface AgentThought {
    tool: string;
    tool_input: any;
    observation: string;
    thought: string;
    message_id: string;
}
```

### New Methods

```typescript
// Streaming version — returns Observable that emits partial tokens
sendMessageStream(query: string, conversationId?: string): Observable<DifyStreamEvent>

// Get conversation history from Dify
getConversationMessages(conversationId: string): Observable<any>

// Delete conversation
deleteConversation(conversationId: string): Observable<void>

// Get current conversation_id
getConversationId(): string | null
```

### Implementation Pattern

The Dify Chatflow API uses SSE streaming at `POST /v1/chat-messages` with `response_mode: 'streaming'`. The Angular service must:

1. Use `fetch()` (not HttpClient) for SSE support on POST requests
2. Parse the SSE stream using `ReadableStream` API
3. Emit `DifyStreamEvent` objects as they arrive
4. Accumulate the full answer for display
5. Extract `agent_thought` events to show tool calls in progress

```typescript
// Pseudocode — actual implementation
sendMessageStream(query: string, conversationId?: string): Observable<DifyStreamEvent> {
    return new Observable(subscriber => {
        fetch('/api/dify/chat-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                inputs: {},
                response_mode: 'streaming',
                conversation_id: conversationId || '',
                user: this.getUserId()
            })
        }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            // Read SSE stream and emit events
            // ...
        });
    });
}
```

---

## 4. Change 2: OrchestratorChatComponent — SSE Streaming

**File:** `src/app/components/npa/ideation-chat/ideation-chat.component.ts`

**What changes:**
- Remove `demoFlow` and `FlowStep[]` configuration entirely
- Replace `advanceConversation()` with real `DifyService.sendMessageStream()` calls
- Add token-by-token text rendering (typewriter effect)
- Add agent thought visualization (show tool calls in progress)
- Add `conversation_id` tracking

### Remove

```typescript
// DELETE these entirely:
private demoFlow: FlowStep[] = [];
private conversationStage = 0;
private initializeDemoFlow() { ... }
private advanceConversation(userContent: string) { ... }
private processNextStage() { ... }
private finishDraft() { ... }  // Replace with dynamic detection
```

### Replace With

```typescript
// NEW: Real conversation handling
private conversationId: string | null = null;
currentToolCall: string | null = null;    // Shows "Calling classify_assess_domains..."
currentThought: string | null = null;     // Agent reasoning

private processUserMessage(content: string) {
    this.messages.push({ role: 'user', content, timestamp: new Date() });
    this.userInput = '';
    this.isThinking = true;

    // Accumulate streamed response
    let fullAnswer = '';
    const agentThoughts: AgentThought[] = [];

    this.difyService.sendMessageStream(content, this.conversationId)
        .subscribe({
            next: (event) => {
                if (event.event === 'agent_thought') {
                    this.currentToolCall = event.tool;
                    this.currentThought = event.thought;
                    agentThoughts.push({
                        tool: event.tool,
                        tool_input: event.tool_input,
                        observation: event.observation,
                        thought: event.thought,
                        message_id: event.message_id
                    });
                }
                if (event.event === 'message' || event.event === 'agent_message') {
                    fullAnswer += event.answer || '';
                    this.updateStreamingMessage(fullAnswer);
                }
                if (event.event === 'message_end') {
                    this.conversationId = event.conversation_id;
                    this.isThinking = false;
                    this.currentToolCall = null;
                    this.finalizeMessage(fullAnswer, agentThoughts);
                }
            },
            error: (err) => {
                this.isThinking = false;
                this.messages.push({
                    role: 'agent',
                    content: 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date()
                });
            }
        });
}
```

### New Template Elements

Add a "tool call in progress" indicator below the thinking spinner:

```html
<!-- Tool Call Indicator -->
<div *ngIf="currentToolCall" class="flex gap-4 items-center">
    <div class="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
        <lucide-icon name="wrench" class="w-3 h-3 text-amber-600 animate-pulse"></lucide-icon>
    </div>
    <div class="text-xs">
        <span class="font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{{ currentToolCall }}</span>
        <span class="text-gray-400 ml-2">{{ currentThought }}</span>
    </div>
</div>
```

---

## 5. Change 3: ChatMessage Model — Agent Metadata

**File:** `src/app/lib/npa-interfaces.ts` (or inline in ideation-chat)

**What changes:** Extend `ChatMessage` to support streaming state and tool call metadata.

### New Interface

```typescript
interface ChatMessage {
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;              // True while tokens are still arriving
    agentIdentity?: AgentIdentity;
    cardType?: 'READINESS' | 'CLASSIFICATION' | 'RISK' | 'SIGNOFF' | 'STAGE_ADVANCE';
    cardData?: any;
    toolCalls?: ToolCallSummary[];      // MCP tools called during this response
    conversationId?: string;
    messageId?: string;
}

interface ToolCallSummary {
    tool: string;           // e.g., "classify_assess_domains"
    input: any;             // Tool input parameters
    output: any;            // Tool result
    duration_ms?: number;
    timestamp: Date;
}
```

---

## 6. Change 4: AgentGovernanceService — Remove Mock Logic

**File:** `src/app/services/agent-governance.service.ts`

**What changes:**
- Remove `mockReadinessLogic()` and `mockClassificationLogic()` methods entirely
- `analyzeReadiness()` and `analyzeClassification()` are NO LONGER called from Angular
- These functions are now handled by Dify agents calling MCP tools
- Keep `getProjectDetails()`, `getProjects()` as-is (they read from DB via Express API)
- Add new methods to read agent-generated data from the database

### Remove

```typescript
// DELETE:
private mockReadinessLogic(description: string): ReadinessResult { ... }
private mockClassificationLogic(description: string, jurisdiction: string): ClassificationResult { ... }

// MODIFY — These become read-only from DB:
analyzeReadiness(description: string): Observable<ReadinessResult>        // DELETE
saveReadinessAssessment(projectId, result): Observable<any>              // KEEP
analyzeClassification(description: string): Observable<ClassificationResult>  // DELETE
saveClassification(projectId, result): Observable<any>                   // KEEP
```

### Add

```typescript
// NEW: Read agent-generated assessments from database
getReadinessAssessment(projectId: string): Observable<ReadinessResult> {
    return this.http.get<any[]>(`${this.apiUrl}/readiness/${projectId}`).pipe(
        map(assessments => this.transformAssessmentsToReadinessResult(assessments))
    );
}

getClassificationResult(projectId: string): Observable<ClassificationResult> {
    return this.http.get<any>(`${this.apiUrl}/classification/${projectId}`).pipe(
        map(scorecard => this.transformScorecardToClassificationResult(scorecard))
    );
}

// Read sign-off matrix
getSignoffs(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/signoffs/${projectId}`);
}

// Read audit trail
getAuditTrail(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/audit/${projectId}`);
}

// Read workflow states
getWorkflowStates(projectId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workflow-states/${projectId}`);
}
```

---

## 7. Change 5: DifyAgentService — Live Health & Work Items

**File:** `src/app/services/dify/dify-agent.service.ts`

**What changes:**
- Replace all mock data with real API calls
- `getActiveWorkItems()` reads from `agent_messages` table via Express API
- `getAgentHealth()` checks MCP server health + Dify API health
- `getCapabilities()` can remain static (configuration) or load from MCP `/tools` endpoint

### Replace

```typescript
// REPLACE getActiveWorkItems() mock with:
getActiveWorkItems(): Observable<AgentWorkItem[]> {
    return this.http.get<any[]>('/api/agents/active-work').pipe(
        map(items => items.map(item => ({
            id: item.id,
            agentName: item.agent_name || item.sender,
            operation: item.content?.substring(0, 60) || 'Processing...',
            status: this.mapStatus(item.status),
            duration: item.duration || 'N/A',
            color: this.mapColor(item.sender)
        })))
    );
}

// REPLACE getAgentHealth() mock with:
getAgentHealth(): Observable<HealthMetrics> {
    return forkJoin({
        mcp: this.http.get<any>('http://localhost:3002/health'),
        dify: this.http.get<any>('/api/dify/health')
    }).pipe(
        map(({ mcp, dify }) => ({
            status: mcp.status === 'ok' && dify.status === 'ok' ? 'healthy' : 'degraded',
            latency: mcp.latency || 0,
            uptime: 99.9,
            activeAgents: mcp.tools || 0,
            totalDecisions: mcp.totalDecisions || 0
        }))
    );
}
```

---

## 8. Change 6: NpaDetailComponent — Auto-Refresh Tabs

**File:** `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts`

**What changes:**
- Add polling-based auto-refresh for tabs when an agent session is active
- When user is viewing the detail page and agents are working (via Dify chat), data should update automatically
- Each tab should have an independent refresh mechanism

### Add Polling Logic

```typescript
private refreshInterval: any = null;
private isAgentActive = false;

// Call this when entering detail view with an active conversation
startAutoRefresh(projectId: string, intervalMs: number = 5000) {
    this.isAgentActive = true;
    this.refreshInterval = setInterval(() => {
        this.refreshTabData(projectId);
    }, intervalMs);
}

stopAutoRefresh() {
    this.isAgentActive = false;
    if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
    }
}

private refreshTabData(projectId: string) {
    // Only refresh the active tab to minimize API calls
    switch (this.activeTab) {
        case 'PRODUCT_SPECS':
            this.governanceService.getProjectDetails(projectId).subscribe(data => {
                this.mapBackendDataToView(data);
            });
            break;
        case 'APPROVALS':
            this.governanceService.getSignoffs(projectId).subscribe(signoffs => {
                this.signoffData = signoffs;
            });
            break;
        case 'ANALYSIS':
            this.governanceService.getReadinessAssessment(projectId).subscribe(data => {
                this.readinessData = data;
            });
            break;
        case 'WORKFLOW':
            this.governanceService.getWorkflowStates(projectId).subscribe(states => {
                this.workflowStates = states;
            });
            break;
    }
}

ngOnDestroy() {
    this.stopAutoRefresh();
}
```

### Add Visual Indicator

When auto-refresh is active, show a subtle indicator:

```html
<!-- Auto-refresh indicator -->
<div *ngIf="isAgentActive" class="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
    Agent Active — Data auto-refreshing
</div>
```

---

## 9. Change 7: New AgentActivityPanelComponent

**New file:** `src/app/components/npa/agent-activity-panel/agent-activity-panel.component.ts`

**Purpose:** A slide-out or embedded panel showing real-time agent activity during the NPA creation flow. This gives the human full visibility into what agents are doing.

### What it shows:

1. **Active Agent** — Which agent is currently running (Ideation, Classification, Risk, etc.)
2. **Tool Calls** — Which MCP tools are being called with parameters
3. **Tool Results** — Abbreviated results from each tool call
4. **Timeline** — Chronological view of all agent actions
5. **Confidence Scores** — Agent confidence for each decision

### Data Source

Reads from:
- `agent_messages` table (via `GET /api/agents/messages?session_id=X`)
- `npa_audit_log` table (via `GET /api/audit/:projectId`)
- Real-time events from the Dify SSE stream (`agent_thought` events)

### Component Structure

```typescript
@Component({
    selector: 'app-agent-activity-panel',
    standalone: true,
    imports: [CommonModule, LucideAngularModule]
})
export class AgentActivityPanelComponent {
    @Input() sessionId: string;
    @Input() projectId: string;
    @Input() isExpanded = false;
    @Output() onToggle = new EventEmitter<void>();

    activities: AgentActivity[] = [];

    // Receives live events from parent chat component
    addLiveEvent(event: DifyStreamEvent) {
        if (event.event === 'agent_thought') {
            this.activities.unshift({
                timestamp: new Date(),
                agent: this.inferAgentFromTool(event.tool),
                tool: event.tool,
                thought: event.thought,
                status: 'running'
            });
        }
    }
}

interface AgentActivity {
    timestamp: Date;
    agent: string;
    tool: string;
    thought?: string;
    result?: string;
    confidence?: number;
    status: 'running' | 'completed' | 'error';
}
```

### Placement

This component can be placed:
- **Option A:** As a collapsible right panel in the Chat view (split pane: chat left, activity right)
- **Option B:** As a new tab in `NpaDetailComponent` (e.g., "Agent Activity" tab)
- **Option C:** As a slide-over drawer accessible from a floating button

**Recommended:** Option A for the ideation chat, Option B for the detail view.

---

## 10. Change 8: New DifyConversationService

**New file:** `src/app/services/dify/dify-conversation.service.ts`

**Purpose:** Manages the lifecycle of Dify conversations and links them to NPA projects.

### Interface

```typescript
@Injectable({ providedIn: 'root' })
export class DifyConversationService {
    private activeConversations = new Map<string, string>(); // npa_id -> conversation_id

    // Link a Dify conversation to an NPA project
    linkConversation(npaId: string, conversationId: string): void

    // Get conversation for an NPA
    getConversationForNpa(npaId: string): string | null

    // Start a new conversation for an NPA
    startConversation(npaId: string): Observable<string>  // Returns conversation_id

    // Resume existing conversation
    resumeConversation(npaId: string): Observable<ChatMessage[]>

    // Persist linkage to backend
    saveConversationLink(npaId: string, conversationId: string): Observable<void>
}
```

### Storage

The conversation-to-NPA linkage should be stored in:
- **Browser:** `sessionStorage` for the active session
- **Database:** `agent_sessions` table (via `session_create` MCP tool)

This allows the user to navigate away from the chat and return later to the same conversation.

---

## 11. Change 9: Session Linkage

**Concept:** Every NPA creation flow should have a traceable session chain:

```
Dify conversation_id <-> agent_sessions.id <-> npa_projects.id
```

### Database Changes Needed (Express API)

Add a new Express route to store the linkage:

**File:** `server/routes/agents.js` (new or existing)

```javascript
// POST /api/agents/link-session
router.post('/link-session', async (req, res) => {
    const { npa_id, conversation_id, session_id } = req.body;
    await db.query(
        `UPDATE agent_sessions SET project_id = ?, metadata = JSON_SET(COALESCE(metadata, '{}'), '$.conversation_id', ?)
         WHERE id = ?`,
        [npa_id, conversation_id, session_id]
    );
    res.json({ success: true });
});

// GET /api/agents/messages?session_id=X
router.get('/messages', async (req, res) => {
    const { session_id, project_id } = req.query;
    let sql = 'SELECT * FROM agent_messages WHERE 1=1';
    const params = [];
    if (session_id) { sql += ' AND session_id = ?'; params.push(session_id); }
    if (project_id) {
        sql += ' AND session_id IN (SELECT id FROM agent_sessions WHERE project_id = ?)';
        params.push(project_id);
    }
    sql += ' ORDER BY sent_at DESC LIMIT 100';
    const [rows] = await db.query(sql, params);
    res.json(rows);
});
```

### Angular Side

In the chat component, after the first Dify response creates an NPA:

```typescript
// After Dify creates an NPA (detected from agent_thought tool calls)
if (event.tool === 'ideation_create_npa' && event.observation) {
    const result = JSON.parse(event.observation);
    const npaId = result.data.npa_id;
    this.conversationService.linkConversation(npaId, this.conversationId);
    // Emit event so parent component knows the NPA ID
    this.npaCreated.emit(npaId);
}
```

---

## 12. Change 10: New Express Proxy Routes for Dify

**New file:** `server/routes/dify-proxy.js`

**Purpose:** The Angular app should NOT call the Dify API directly (CORS, API key exposure). Instead, add a proxy in the Express backend.

### Routes

```javascript
const express = require('express');
const router = express.Router();

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';

// Proxy: Chat Messages (Streaming)
router.post('/chat-messages', async (req, res) => {
    const response = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DIFY_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...req.body,
            response_mode: 'streaming',
            user: req.body.user || 'default-user'
        })
    });

    // Forward SSE stream to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    response.body.pipe(res);
});

// Proxy: Get conversation messages
router.get('/messages/:conversationId', async (req, res) => {
    const response = await fetch(
        `${DIFY_BASE_URL}/messages?conversation_id=${req.params.conversationId}&user=default-user`,
        { headers: { 'Authorization': `Bearer ${DIFY_API_KEY}` } }
    );
    const data = await response.json();
    res.json(data);
});

// Health check
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${DIFY_BASE_URL}/../health`);
        res.json({ status: response.ok ? 'ok' : 'error' });
    } catch (e) {
        res.json({ status: 'error', message: e.message });
    }
});

module.exports = router;
```

**Register in `server/index.js`:**

```javascript
app.use('/api/dify', require('./routes/dify-proxy'));
```

---

## 13. Change 11: Environment Configuration

**New file:** `src/environments/environment.ts`

```typescript
export const environment = {
    production: false,
    useMockDify: true,           // Toggle for development without Dify
    difyApiUrl: '/api/dify',     // Proxied through Express
    mcpRestUrl: 'http://localhost:3002',
    expressApiUrl: '/api',
    pollingIntervalMs: 5000,     // Auto-refresh interval when agent is active
};
```

**New file:** `src/environments/environment.prod.ts`

```typescript
export const environment = {
    production: true,
    useMockDify: false,
    difyApiUrl: '/api/dify',
    mcpRestUrl: '/mcp',         // Proxied in production
    expressApiUrl: '/api',
    pollingIntervalMs: 10000,
};
```

**Server-side `.env` additions:**

```
DIFY_BASE_URL=http://localhost/v1
DIFY_API_KEY=app-xxxxxxxxxxxxxxxx
```

---

## 14. Change 12: Real-Time Polling Service

**New file:** `src/app/services/realtime-polling.service.ts`

**Purpose:** Centralized polling service that components can subscribe to for data updates.

### Interface

```typescript
@Injectable({ providedIn: 'root' })
export class RealtimePollingService {
    private pollingSubjects = new Map<string, BehaviorSubject<any>>();
    private intervals = new Map<string, any>();

    // Start polling an endpoint
    startPolling(key: string, endpoint: string, intervalMs: number = 5000): Observable<any>

    // Stop polling
    stopPolling(key: string): void

    // Stop all polling
    stopAll(): void

    // Convenience methods for common resources
    pollProjectDetails(projectId: string): Observable<NpaProject>
    pollSignoffs(projectId: string): Observable<any[]>
    pollAuditTrail(projectId: string): Observable<any[]>
    pollAgentMessages(sessionId: string): Observable<any[]>
}
```

### Usage in Components

```typescript
// In NpaDetailComponent
ngOnInit() {
    this.pollingService.pollProjectDetails(this.projectId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => this.updateView(data));
}

ngOnDestroy() {
    this.pollingService.stopPolling(`project-${this.projectId}`);
}
```

### Future: SSE Alternative

For production, replace polling with Server-Sent Events from Express:

```javascript
// server/routes/events.js (future)
router.get('/events/:projectId', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    // Watch for DB changes and push events
});
```

---

## 15. Change 13: Agent Visibility Cards in Chat

**File:** `src/app/components/npa/ideation-chat/ideation-chat.component.ts`

**What changes:** Add new card types to render structured data from agent tool calls. Currently only `READINESS` and `CLASSIFICATION` cards exist. Add cards for:

### New Card Types

| Card Type | Trigger | Data Source |
|-----------|---------|-------------|
| `RISK` | `risk_run_assessment` tool result | Risk domain scores |
| `SIGNOFF` | `governance_create_signoff_matrix` result | Sign-off matrix |
| `STAGE_ADVANCE` | `governance_advance_stage` result | Stage transition |
| `AUTOFILL` | `autofill_populate_batch` result | Fields filled with lineage |
| `SIMILAR_NPA` | `ideation_find_similar` result | Similar historical NPAs |

### Detection Pattern

Parse `agent_thought` events to detect which tool was called and render the appropriate card:

```typescript
private detectCardType(event: DifyStreamEvent): string | null {
    if (!event.tool) return null;
    const cardMap: Record<string, string> = {
        'classify_assess_domains': 'READINESS',
        'classify_score_npa': 'CLASSIFICATION',
        'risk_run_assessment': 'RISK',
        'governance_create_signoff_matrix': 'SIGNOFF',
        'governance_advance_stage': 'STAGE_ADVANCE',
        'autofill_populate_batch': 'AUTOFILL',
        'ideation_find_similar': 'SIMILAR_NPA',
    };
    return cardMap[event.tool] || null;
}
```

### Example Card: Risk Assessment

```html
<div *ngIf="msg.cardType === 'RISK' && msg.cardData" class="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
    <h4 class="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 mb-3">
        <lucide-icon name="shield-alert" class="w-4 h-4"></lucide-icon>
        Risk Assessment — {{ msg.cardData.overall_risk_rating }}
    </h4>
    <div class="space-y-2">
        <div *ngFor="let domain of msg.cardData.assessments" class="flex items-center justify-between text-xs">
            <span class="font-medium text-gray-700">{{ domain.domain }}</span>
            <div class="flex items-center gap-2">
                <div class="w-16 h-1.5 bg-gray-200 rounded-full">
                    <div class="h-full rounded-full" [style.width.%]="domain.score"
                         [ngClass]="domain.status === 'PASS' ? 'bg-green-500' : domain.status === 'WARN' ? 'bg-amber-500' : 'bg-red-500'">
                    </div>
                </div>
                <span class="font-mono w-8 text-right">{{ domain.score }}</span>
            </div>
        </div>
    </div>
</div>
```

---

## 16. Change 14: NPA Pipeline Table — Live Data

**File:** `src/app/components/npa/dashboard/npa-pipeline-table.component.ts`

**What changes:** Replace static `NPAPipelineItem[]` with data from `GET /api/governance/projects`.

### Current (Mock)

```typescript
pipelineItems: NPAPipelineItem[] = [
    { id: 'NPA-2024-001', name: 'Digital Asset Custody...', ... }
    // Hardcoded array
];
```

### Replace With

```typescript
private governanceService = inject(AgentGovernanceService);

ngOnInit() {
    this.governanceService.getProjects().subscribe(projects => {
        this.pipelineItems = projects.map(p => ({
            id: p.id,
            name: p.title,
            productType: p.npa_type || 'Pending',
            businessUnit: p.product_family || 'N/A',
            currentStage: p.current_stage,
            status: this.mapStageToStatus(p.current_stage),
            daysInStage: this.calculateDaysInStage(p.updated_at),
            owner: p.submitted_by,
            lastUpdated: p.updated_at
        }));
    });
}
```

---

## 17. Change 15: Approval Dashboard — Live Sign-Offs

**File:** `src/app/pages/approval-dashboard/approval-dashboard.component.ts`

**What changes:**
- Load real sign-off data from `GET /api/governance/signoffs/:projectId`
- `approve()`, `reject()`, `requestRework()` should call real endpoints
- These endpoints already exist in the MCP REST API (port 3002) and should be proxied or called via Express

### New Express Route Needed

**File:** `server/routes/approvals.js` (extend existing)

```javascript
// Record approval decision
router.post('/decision', async (req, res) => {
    const { signoff_id, decision, comments } = req.body;
    await db.query(
        `UPDATE npa_signoffs SET status = ?, decision_date = NOW(), comments = ? WHERE id = ?`,
        [decision, comments, signoff_id]
    );
    res.json({ success: true });
});
```

---

## 18. File Impact Matrix

### New Files (7)

| File | Type | Description |
|------|------|-------------|
| `src/app/components/npa/agent-activity-panel/agent-activity-panel.component.ts` | Component | Real-time agent activity display |
| `src/app/services/dify/dify-conversation.service.ts` | Service | Conversation lifecycle management |
| `src/app/services/realtime-polling.service.ts` | Service | Centralized polling for data updates |
| `src/environments/environment.ts` | Config | Dev environment variables |
| `src/environments/environment.prod.ts` | Config | Prod environment variables |
| `server/routes/dify-proxy.js` | Route | Express proxy for Dify API |
| `server/routes/agents.js` | Route | Agent session and message endpoints |

### Modified Files (10)

| File | Impact | Effort |
|------|--------|--------|
| `src/app/services/dify/dify.service.ts` | **Major** — Replace mock with SSE streaming | High |
| `src/app/components/npa/ideation-chat/ideation-chat.component.ts` | **Major** — Remove demo flow, add streaming | High |
| `src/app/services/agent-governance.service.ts` | **Medium** — Remove mock logic, add read-only methods | Medium |
| `src/app/services/dify/dify-agent.service.ts` | **Medium** — Replace mocks with real API calls | Medium |
| `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | **Medium** — Add auto-refresh polling | Medium |
| `src/app/pages/npa-agent/npa-agent.component.ts` | **Low** — Pass conversation context between views | Low |
| `src/app/components/npa/dashboard/npa-pipeline-table.component.ts` | **Low** — Replace mock data | Low |
| `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | **Low** — Wire real sign-off endpoints | Low |
| `src/app/lib/npa-interfaces.ts` | **Low** — Add new interfaces | Low |
| `server/index.js` | **Low** — Register new proxy routes | Low |

### Unchanged Files

The following components and services need **no changes**:
- `NpaTemplateEditorComponent` — Already renders from data, doesn't care about source
- `NpaWorkflowVisualizerComponent` — Reads from component inputs
- `DocumentDependencyMatrixComponent` — Reads from Express API already
- `LayoutService` — Unchanged
- `MainLayoutComponent` — Unchanged
- `app.routes.ts` — No new routes needed

---

## 19. Implementation Priority & Phases

### Phase A: Foundation (Must-Have for MVP)

**Goal:** Real conversations with Dify through the chat interface.

| # | Change | Priority | Estimated Effort |
|---|--------|----------|-----------------|
| 1 | Express Dify proxy (`dify-proxy.js`) | P0 | 2 hours |
| 2 | Environment config files | P0 | 30 min |
| 3 | `DifyService` — streaming API | P0 | 4 hours |
| 4 | `OrchestratorChatComponent` — streaming render | P0 | 4 hours |
| 5 | `ChatMessage` model updates | P0 | 30 min |

**Outcome:** User can chat with Dify agent, see streamed responses, agents call MCP tools.

### Phase B: Data Visibility (Should-Have)

**Goal:** See agent-generated data in the NPA detail views.

| # | Change | Priority | Estimated Effort |
|---|--------|----------|-----------------|
| 6 | `AgentGovernanceService` — remove mocks | P1 | 2 hours |
| 7 | NPA Pipeline Table — live data | P1 | 2 hours |
| 8 | `NpaDetailComponent` — auto-refresh | P1 | 3 hours |
| 9 | Approval Dashboard — live sign-offs | P1 | 2 hours |

**Outcome:** Dashboard and detail views show real data written by agents.

### Phase C: Agent Visibility (Nice-to-Have)

**Goal:** Full transparency into what agents are doing.

| # | Change | Priority | Estimated Effort |
|---|--------|----------|-----------------|
| 10 | `DifyConversationService` | P2 | 2 hours |
| 11 | Session linkage (Express + Angular) | P2 | 3 hours |
| 12 | Agent Activity Panel component | P2 | 4 hours |
| 13 | Agent visibility cards in chat | P2 | 4 hours |
| 14 | `DifyAgentService` — live health | P2 | 2 hours |

**Outcome:** User can see which agent is running, which tools are being called, and confidence scores.

### Phase D: Real-Time Updates (Production)

**Goal:** Replace polling with server-push.

| # | Change | Priority | Estimated Effort |
|---|--------|----------|-----------------|
| 15 | `RealtimePollingService` | P3 | 3 hours |
| 16 | SSE events from Express (future) | P3 | 4 hours |

**Outcome:** Sub-second UI updates when agents write to the database.

### Total Estimated Effort: ~42 hours

---

## 20. Testing Checklist

### Phase A Tests (Foundation)

- [ ] Express proxy forwards requests to Dify API
- [ ] SSE stream correctly parsed in Angular
- [ ] Chat shows streamed tokens (typewriter effect)
- [ ] `conversation_id` persisted across messages
- [ ] Error handling: Dify down, timeout, malformed response
- [ ] `useMockDify = true` still works for offline development

### Phase B Tests (Data Visibility)

- [ ] Pipeline table loads real projects from `/api/governance/projects`
- [ ] NPA detail shows agent-generated assessments
- [ ] Sign-off matrix renders from database
- [ ] Form data tab shows auto-filled fields with lineage badges
- [ ] Auto-refresh triggers when agent is active

### Phase C Tests (Agent Visibility)

- [ ] Agent activity panel shows tool calls in real-time
- [ ] Card types render correctly for each MCP tool result
- [ ] Session linkage persists across page navigation
- [ ] Conversation resume works after browser refresh

### Phase D Tests (Real-Time)

- [ ] Polling service correctly starts/stops per component lifecycle
- [ ] No memory leaks from polling subscriptions
- [ ] SSE events push updates without polling (future)

---

## Quick Reference: API Endpoints Needed

### Express API (Existing — May Need Extension)

| Endpoint | Status | Used By |
|----------|--------|---------|
| `GET /api/governance/projects` | Exists | Pipeline table |
| `GET /api/governance/projects/:id` | Exists | NPA detail |
| `POST /api/governance/projects` | Exists | Project creation |
| `POST /api/governance/readiness` | Exists | Save readiness |
| `GET /api/governance/readiness/:id` | Exists | Read readiness |
| `GET /api/governance/classification/:id` | Exists | Read classification |
| `POST /api/governance/classification` | Exists | Save classification |
| `GET /api/governance/signoffs/:id` | **NEW** | Sign-off matrix |
| `GET /api/governance/workflow-states/:id` | **NEW** | Workflow history |
| `GET /api/audit/:projectId` | Exists | Audit trail |
| `POST /api/agents/link-session` | **NEW** | Session linkage |
| `GET /api/agents/messages` | **NEW** | Agent messages |

### Express Proxy for Dify (All New)

| Endpoint | Proxies To |
|----------|-----------|
| `POST /api/dify/chat-messages` | `POST http://localhost/v1/chat-messages` |
| `GET /api/dify/messages/:conversationId` | `GET http://localhost/v1/messages?conversation_id=X` |
| `GET /api/dify/health` | `GET http://localhost/health` |

### MCP REST API (Port 3002 — Already Built)

All 28 tools available at `POST http://localhost:3002/tools/{tool-name}`. These are called by Dify agents, not by Angular directly.
