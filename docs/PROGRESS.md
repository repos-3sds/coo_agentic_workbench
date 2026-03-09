# COO Multi-Agent Workbench — Progress Report

> **Last Updated:** 2026-02-18
> **Branch:** `claude/priceless-thompson` → merged to `origin/main`
> **Status:** Full NPA Lifecycle with 7-Agent Analysis Engine LIVE on Railway

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [What Has Been Built](#2-what-has-been-built)
3. [Problems Encountered & How They Were Fixed](#3-problems-encountered--how-they-were-fixed)
4. [Frontend ↔ Dify Wiring — Complete Guide](#4-frontend--dify-wiring--complete-guide)
5. [Error Troubleshooting Playbook](#5-error-troubleshooting-playbook)
6. [What NOT to Touch & Why](#6-what-not-to-touch--why)
7. [What's Working Now](#7-whats-working-now)
8. [Next Steps & Agenda](#8-next-steps--agenda)
9. [File Reference Map](#9-file-reference-map)
10. [Commit History](#10-commit-history)
11. [Session 3 (2026-02-18): NPA Detail Lifecycle + Seed Demo + Template Editor](#11-session-3-2026-02-18-npa-detail-lifecycle--seed-demo--template-editor)

---

## 1. Architecture Overview

### System Topology

```
┌─────────────────────────────────────────────────────────┐
│  BROWSER (localhost:4200)                                │
│  Angular 19 + Tailwind + Lucide Icons                    │
│                                                          │
│  ┌─────────────────┐  ┌──────────────────────────────┐  │
│  │ Command Center   │  │ Ideation Chat (Orchestrator) │  │
│  │ (Landing + Chat) │  │ (NPA Agent Workspace)        │  │
│  └────────┬─────────┘  └─────────────┬────────────────┘  │
│           │ /api/*                    │ /api/*            │
└───────────┼───────────────────────────┼──────────────────┘
            │ proxy.conf.json           │
            ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│  EXPRESS API (localhost:3000)                             │
│  server/index.js                                         │
│                                                          │
│  Routes:                                                 │
│  ├── /api/dify/chat      → dify-proxy.js (SSE collector)│
│  ├── /api/dify/workflow   → dify-proxy.js (blocking)    │
│  ├── /api/users           → users.js (DB + fallback)    │
│  ├── /api/npas            → npas.js                     │
│  ├── /api/agents/status   → agents.js                   │
│  └── /api/health          → inline handler              │
│                                                          │
│  Crash Protection:                                       │
│  ├── Express error middleware (after all routes)         │
│  ├── process.on('uncaughtException')                    │
│  └── process.on('unhandledRejection')                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP POST to Dify Cloud
                         ▼
┌─────────────────────────────────────────────────────────┐
│  DIFY CLOUD (dify.3senses.social)                        │
│                                                          │
│  7 Apps (3 Chatflows + 4 Workflows):                     │
│  ├── CF_NPA_Orchestrator  → MASTER_COO + NPA_ORCH       │
│  ├── CF_NPA_Ideation      → IDEATION agent              │
│  ├── CF_NPA_Query_Asst    → DILIGENCE + KB_SEARCH       │
│  ├── WF_NPA_Classify      → CLASSIFIER + ML_PREDICT     │
│  ├── WF_NPA_Autofill      → AUTOFILL                    │
│  ├── WF_NPA_Risk          → RISK                        │
│  └── WF_NPA_Governance    → GOVERNANCE + DOC + MON + NOT│
│                                                          │
│  Each app has MCP tool access to Railway server           │
└────────────────────────┬────────────────────────────────┘
                         │ MCP SSE / REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│  MCP TOOLS SERVER (Railway: coo-mcp-tools.up.railway.app)│
│  Port 3002 — ASGI Path Router                            │
│                                                          │
│  /mcp/*  → MCP SSE App (NO CORS, NO middleware)          │
│  /*      → FastAPI REST App (with CORS middleware)       │
│                                                          │
│  71 Tools across 18 modules:                             │
│  session, ideation, classification, autofill, risk,      │
│  governance, audit, npa_data, workflow, monitoring,       │
│  documents, governance_ext, risk_ext, kb_search,         │
│  prospects, dashboard, notifications, jurisdiction       │
│                                                          │
│  Database: Railway MySQL (aiomysql async pool)           │
└─────────────────────────────────────────────────────────┘
```

### Data Flow for a Chat Message

```
1. User types in textarea → presses Enter
2. Angular component calls difyService.sendMessage(content)
3. DifyService POSTs to /api/dify/chat with { query, conversation_id, user, agentId }
4. Express dify-proxy.js:
   a. Looks up agent config from dify-agents.js (API key + base URL)
   b. POSTs to Dify Cloud /chat-messages (response_mode: blocking)
   c. Dify processes the chatflow, may call MCP tools on Railway
   d. Dify returns answer + metadata
   e. Proxy parses envelope (@@NPA_META@@ or [NPA_ACTION] markers)
   f. Returns clean JSON: { answer, conversation_id, metadata }
5. Angular receives response:
   a. DifyService.processAgentRouting() checks metadata.agent_action
   b. If ROUTE_DOMAIN/DELEGATE_AGENT → switches active agent, auto-sends greeting
   c. If FINALIZE_DRAFT → triggers CLASSIFIER workflow automatically
   d. If SHOW_CLASSIFICATION → renders ClassificationResultComponent
   e. Component pushes message to messages[] array → template renders
```

### Port Map

| Port | Service | Notes |
|------|---------|-------|
| 4200 | Angular Dev Server | `npx ng serve` — proxies `/api/*` to 3000 |
| 3000 | Express API | `node server/index.js` — must start FIRST |
| 3002 | MCP Tools Server | Railway hosted, ASGI Path Router |
| 3306 | MySQL/MariaDB | Optional locally — fallback users if down |

---

## 2. What Has Been Built

### 2.1 Agent Registry (13 Agents, 4 Tiers)

| Tier | Agent ID | Type | Dify App | Status |
|------|----------|------|----------|--------|
| **T1 Strategic** | MASTER_COO | Chatflow | CF_NPA_Orchestrator | ✅ Working |
| **T2 Domain** | NPA_ORCHESTRATOR | Chatflow | CF_NPA_Orchestrator | ✅ Configured |
| **T3 Specialist** | IDEATION | Chatflow | CF_NPA_Ideation | ✅ Working |
| **T3 Specialist** | CLASSIFIER | Workflow | WF_NPA_Classify_Predict | ✅ Working (NPA Detail) |
| **T3 Specialist** | ML_PREDICT | Workflow | WF_NPA_Classify_Predict | ✅ Working (NPA Detail) |
| **T3 Specialist** | AUTOFILL | Workflow | WF_NPA_Autofill | ✅ Working (NPA Detail) |
| **T3 Specialist** | RISK | Workflow | WF_NPA_Risk | ✅ Working (NPA Detail) |
| **T3 Specialist** | GOVERNANCE | Workflow | WF_NPA_Governance_Ops | ✅ Working (NPA Detail) |
| **T3 Specialist** | DILIGENCE | Chatflow | CF_NPA_Query_Assistant | ✅ Working (NPA Detail Chat tab) |
| **T3 Specialist** | DOC_LIFECYCLE | Workflow | WF_NPA_Governance_Ops | ✅ Working (NPA Detail) |
| **T3 Specialist** | MONITORING | Workflow | WF_NPA_Governance_Ops | ✅ Working (NPA Detail) |
| **T4 Utility** | KB_SEARCH | Chatflow | CF_NPA_Query_Assistant | ✅ Integrated via Diligence |
| **T4 Utility** | NOTIFICATION | Workflow | WF_NPA_Governance_Ops | ✅ Integrated via Governance |

**ALL 13 agents now have API keys configured and are wired to the NPA Detail page's 7-tab analysis engine.**

### 2.2 Frontend Features Implemented

| Feature | Component | Status |
|---------|-----------|--------|
| Command Center (landing + chat) | `command-center.component.ts` | ✅ Working |
| Ideation Chat (NPA workspace) | `ideation-chat.component.ts` | ✅ Working |
| Agent Routing UI | Both components | ✅ Working |
| CLASSIFIER auto-trigger | Both components | ✅ Working |
| Classification Scorecard Card | `classification-result.component.ts` | ✅ Working |
| Hard Stop (Prohibited) Card | Both chat templates | ✅ Working |
| ML Prediction Card | Both chat templates | ✅ Working |
| Agent Activity Strip | Both chat templates | ✅ Working |
| Draft Ready Banner | Both chat templates | ✅ Working |
| Stop Button | Both chat components | ✅ Working |
| Enter/Shift+Enter | Both chat components | ✅ Working |
| NPA Dashboard | `npa-dashboard.component.ts` | ✅ Working |
| Pipeline Table | `npa-pipeline-table.component.ts` | ✅ Static |
| Approval Dashboard | `approval-dashboard` page | ✅ Static |
| **NPA Detail — 7-Tab Lifecycle** | `npa-detail.component.ts` | ✅ **NEW** |
| **7-Agent Analysis Engine** | `npa-detail.component.ts` | ✅ **NEW** |
| **Template Editor (3-column)** | `npa-template-editor.component.ts` | ✅ **NEW** |
| **Seed Demo NPA Button** | `npa-dashboard.component.ts` | ✅ **NEW** |
| **Agent Wave Firing (3 waves)** | `npa-detail.component.ts` | ✅ **NEW** |

### 2.3 Backend Features Implemented

| Feature | File | Status |
|---------|------|--------|
| Dify Proxy (SSE collector) | `server/routes/dify-proxy.js` | ✅ Working |
| Envelope Parsing (2 formats) | `server/routes/dify-proxy.js` | ✅ Working |
| 3-Retry Strategy | `server/routes/dify-proxy.js` | ✅ Working |
| Agent Config Registry | `server/config/dify-agents.js` | ✅ Working |
| Express Crash Protection | `server/index.js` | ✅ Working |
| Fallback Users (no-DB mode) | `server/routes/users.js` | ✅ Working |
| Fast-Fail DB Timeout (3s) | `server/db.js` | ✅ Working |
| MCP Tools (71 tools) | `server/mcp-python/` | ✅ Railway |
| ASGI Path Router | `server/mcp-python/rest_server.py` | ✅ Railway |
| **Seed Demo Endpoint** | `server/routes/npas.js` | ✅ **NEW** |
| **Governance Signoff API** | `server/routes/governance.js` | ✅ **NEW** |
| **NPA Form Sections API** | `server/routes/npas.js` | ✅ Working |

---

## 3. Problems Encountered & How They Were Fixed

### 3.1 — 503 Service Unavailable (ALL agents unconfigured)

**Symptoms:**
- `/api/dify/chat` returning 503 for every agent
- Agent status showed `configured: 0, unconfigured: 13`
- All `DIFY_KEY_*` env vars were `undefined`

**Root Cause:** `require('dotenv').config()` searches for `.env` in `process.cwd()`, NOT relative to the file. When Express was started from the project root, it couldn't find `server/.env`.

**Fix (commit `70c5edb`):**
```javascript
// server/index.js — line 1
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

// server/config/dify-agents.js — line 1
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
```

**Lesson:** ALWAYS use absolute paths with `dotenv`. Never assume CWD.

---

### 3.2 — "Extra data: line 1 column 166" MCP Parse Error

**Symptoms:**
- Dify showed "Extra data" error when calling MCP tools
- Master COO got stuck on "processing" indefinitely
- MCP tools returned valid data but Dify couldn't parse it

**Root Cause:** MCP tool handlers returned `json.dumps(dict)` (a JSON **string**). FastMCP then wrapped this string in a `TextContent` object and serialized the whole thing again → the response was TWO concatenated JSON objects: `{"success": true, "data": {...}}{"type": "text", ...}`.

**Fix (commit `70c5edb`):**
```python
# server/mcp-python/main.py — tool handler
# BEFORE (broken): return json.dumps(d, default=str)
# AFTER (correct): return d   # Plain dict — FastMCP serialises ONCE
```

**Lesson:** FastMCP handles serialization internally. Tool handlers must return plain dicts, NOT JSON strings.

---

### 3.3 — Express Server Crashing Mid-Request

**Symptoms:**
- `/api/dify/chat` returned 500 then `ERR_CONNECTION_REFUSED`
- `[vite] server connection lost` in Angular console
- Server died on unhandled async rejections

**Root Cause:** No global `uncaughtException` or `unhandledRejection` handlers. Any unhandled async error killed the Node.js process.

**Fix (commit `3429968`):**
```javascript
// server/index.js — after all routes
app.use((err, req, res, next) => {
    console.error('[EXPRESS ERROR]', err.stack || err.message);
    res.status(500).json({ error: 'Internal server error' });
});

process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
```

**Lesson:** ALWAYS add global error handlers in production Express apps. Without them, one bad request kills the entire server.

---

### 3.4 — /api/users Returning 500 (No Local MySQL)

**Symptoms:**
- `GET /api/users` → 500 Internal Server Error
- `connect ECONNREFUSED 127.0.0.1:3306`

**Root Cause:** No local MySQL running. The route had no fallback.

**Fix (commit `3429968`):**
```javascript
// server/routes/users.js
const FALLBACK_USERS = [
    { id: 1, full_name: 'Sarah Chen', role: 'Product Manager', ... },
    { id: 2, full_name: 'James Wilson', role: 'Risk Analyst', ... },
    // ... 5 mock users total
];

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users WHERE is_active = 1');
        res.json(rows);
    } catch (err) {
        console.warn('[USERS] DB unavailable, returning fallback users');
        res.json(FALLBACK_USERS);  // ← Returns 200 with mock data
    }
});
```

**Lesson:** Always have fallback data for non-critical endpoints. Users list is cosmetic; don't let it break the app.

---

### 3.5 — Database Connection Hanging for 30+ Seconds

**Symptoms:**
- `/api/users` and `/api/health` took 30+ seconds before timing out
- Express appeared unresponsive during this time

**Root Cause:** mysql2's default `connectTimeout` is very long. When MySQL isn't running, the connection attempt hangs.

**Fix (commit `dd391cc`):**
```javascript
// server/db.js
const pool = mysql.createPool({
    // ... connection details
    connectTimeout: 3000,     // ← Fail in 3 seconds, not 30
    enableKeepAlive: false    // ← Don't keep dead connections alive
});
```

**Lesson:** Always set explicit `connectTimeout` for database pools, especially when the DB might not be running locally.

---

### 3.6 — Missing Lucide "route" Icon

**Symptoms:**
- Console error: `The "route" icon has not been provided by any available icon providers`

**Root Cause:** The lucide-angular package doesn't include a "route" icon.

**Fix (commit `dd391cc`):**
```html
<!-- BEFORE: name="route" -->
<!-- AFTER:  name="navigation" -->
```

**Lesson:** Check lucide icon availability at https://lucide.dev before using icon names.

---

### 3.7 — ASGI Path Router vs CORS Interference (from prior session)

**Symptoms:**
- MCP SSE connections received duplicate JSON in responses
- Dify couldn't parse MCP tool results
- Only happened when MCP was mounted inside FastAPI

**Root Cause:** FastAPI's CORS middleware intercepted MCP SSE responses and injected CORS headers. The SSE protocol handler then sent its own response, resulting in two JSON payloads concatenated.

**Fix (prior session, preserved in `rest_server.py`):**
```python
# ASGI-level path router — splits traffic BEFORE any middleware
class ASGIPathRouter:
    def __init__(self, mcp_app, rest_app, mcp_prefix="/mcp"):
        self.mcp_app = mcp_app
        self.rest_app = rest_app
        self.mcp_prefix = mcp_prefix

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if path.startswith(self.mcp_prefix):
            scope["path"] = path[len(self.mcp_prefix):] or "/"
            await self.mcp_app(scope, receive, send)
        else:
            await self.rest_app(scope, receive, send)
```

> ⚠️ **CRITICAL: The other agent's branch (`d9de4d0`) reverted this fix.** We preserved the ASGI Path Router and only cherry-picked the dict return fix from that branch. **DO NOT revert `rest_server.py`.**

---

### 3.8 — 504 Gateway Timeout from Dify (Intermittent)

**Symptoms:**
- Dify returns 504 when calling MCP tools
- Happens after Railway server has been idle

**Root Cause:** Railway cold starts. The MCP server takes ~5-10 seconds to wake up after inactivity.

**Mitigation (not a code fix):**
- The 3-retry strategy in `dify-proxy.js` handles this
- Pre-warm Railway with: `curl https://coo-mcp-tools.up.railway.app/health`
- First request after cold start may timeout; retries succeed

---

## 4. Frontend ↔ Dify Wiring — Complete Guide

### 4.1 How Agent Routing Works

```
User sends message
    ↓
DifyService.sendMessage(content)
    ↓ uses activeAgentId (default: MASTER_COO)
    ↓
Express /api/dify/chat
    ↓ looks up agent key in dify-agents.js
    ↓ POSTs to Dify Cloud
    ↓
Dify returns answer with @@NPA_META@@ envelope
    ↓
Express parseEnvelope() extracts:
  { agent_action, agent_id, target_agent, payload }
    ↓
Returns to Angular as response.metadata
    ↓
DifyService.processAgentRouting(metadata):
  - ROUTE_DOMAIN  → switchAgent(target_agent)
  - DELEGATE_AGENT → switchAgent(target_agent), push previous
  - ASK_CLARIFICATION → stay on current agent
  - FINALIZE_DRAFT → trigger finishDraft()
  - SHOW_CLASSIFICATION → render scorecard card
  - HARD_STOP → render prohibited card, block draft
    ↓
Component handleResponse() / handleDifyResponse():
  - Pushes agent message to messages[]
  - If shouldSwitch: auto-sends greeting to new agent
  - Updates currentAgent for UI labels
```

### 4.2 Envelope Protocol

Dify agents embed metadata in their text responses using two formats:

**Format 1 — Marker (used by Agent apps):**
```
Here is my analysis...

[NPA_ACTION]ROUTE_DOMAIN
[NPA_DATA]{"target_agent": "IDEATION", "intent": "create new product"}
[NPA_SESSION]{"session_id": "abc123"}
```

**Format 2 — Meta JSON (used by Chatflows, preferred):**
```
Here is my analysis...

@@NPA_META@@{"agent_action":"ROUTE_DOMAIN","agent_id":"MASTER_COO","target_agent":"IDEATION","payload":{"intent":"create new product"}}
```

The proxy strips these markers from the `answer` field and returns them in `metadata`.

### 4.3 CLASSIFIER Workflow Integration

The CLASSIFIER is a **Dify Workflow** (not a Chatflow). It's triggered automatically when a draft is finalized:

```typescript
// In finishDraft() — both components
const classifierInputs = {
    product_name: payload?.product_name || payload?.title,
    product_description: payload?.product_description || payload?.description,
    product_type: payload?.product_type || '',
    asset_class: payload?.asset_class || '',
    target_market: payload?.target_market || '',
    // ... more fields
};

this.difyService.runWorkflow('CLASSIFIER', classifierInputs).subscribe({
    next: (res) => {
        if (res.data.status === 'succeeded') {
            const result = this.parseClassifierResponse(res.data.outputs);
            // Render as CLASSIFICATION or HARD_STOP card
        }
    }
});
```

**The CLASSIFIER response** comes back as JSON wrapped in markdown code fences:
```
```json
{
  "classification_type": "FULL_NPA",
  "scorecard": { ... },
  "prohibited_check": { "is_prohibited": false },
  "mandatory_signoffs": ["Credit", "Risk", "Ops"]
}
```​
```

`parseClassifierResponse()` strips the fences, parses JSON, and maps to `ClassificationResult`.

### 4.4 Conversation Management

Each Dify app maintains its own conversation thread:

```typescript
// DifyService internals
private conversationIds = new Map<string, string>();  // agentId → conversationId
private delegationStack: string[] = [];               // for nested handoffs
public activeAgentId = 'MASTER_COO';                  // currently active agent

// When switching agents:
switchAgent(targetId: string) {
    this.activeAgentId = targetId;
    // New agent gets fresh conversation (no ID) on first message
}

// When returning from delegation:
returnToPreviousAgent(reason: string) {
    const prev = this.delegationStack.pop();
    if (prev) this.activeAgentId = prev;
}
```

### 4.5 Adding a New Agent — Step by Step

1. **Create Dify App** (Chatflow or Workflow) on dify.3senses.social
2. **Get API Key** from Dify → add to `server/.env`:
   ```
   DIFY_KEY_MY_NEW_AGENT=app-xxxxxxxxxxxx
   ```
3. **Register in `server/config/dify-agents.js`**:
   ```javascript
   MY_NEW_AGENT: {
       difyAppId: 'MY_NEW_AGENT',
       apiKey: process.env.DIFY_KEY_MY_NEW_AGENT,
       type: 'chatflow',  // or 'workflow'
       baseUrl: difyBaseUrl
   }
   ```
4. **Add to `src/app/lib/agent-interfaces.ts`** → AGENT_REGISTRY array:
   ```typescript
   { id: 'MY_NEW_AGENT', name: 'My Agent', tier: 3, icon: 'bot', color: 'blue',
     difyType: 'chatflow', description: 'Does something useful' }
   ```
5. **Handle routing** in the component's `handleResponse()`:
   - The existing `processAgentRouting()` handles standard actions
   - For custom card types, add new `cardType` in the ChatMessage interface
6. **Restart Express** — the agent will be auto-detected

---

## 5. Error Troubleshooting Playbook

### Quick Diagnosis

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| 503 on all agents | `.env` not loaded | Check `DIFY_KEY_MASTER_COO` is set. Restart Express |
| 503 on specific agent | Missing API key | Add `DIFY_KEY_xxx` to `server/.env` |
| "Extra data" parse error | MCP tool returning JSON string | Ensure tool handlers return `dict`, not `json.dumps()` |
| Agent stuck on "processing" | Dify timeout calling MCP | Check Railway health: `curl https://coo-mcp-tools.up.railway.app/health` |
| `ERR_CONNECTION_REFUSED` | Express crashed | Restart: `node server/index.js` |
| Angular white page | Angular not running | Start: `npx ng serve --port 4200` |
| `/api/users` 500 | MySQL not running (expected) | Non-critical — fallback users returned. Ignore |
| 504 Gateway Timeout | Railway cold start | Retry. Pre-warm with health endpoint |
| `[vite] server connection lost` | Angular dev server died | Restart Angular: `npx ng serve` |
| "route" icon error | Missing lucide icon | Change to "navigation" or another valid icon |
| CLASSIFIER returns empty | Markdown code fences not stripped | Check `parseClassifierResponse()` regex |

### How to Restart Everything

```bash
# From project root:
cd server && node index.js &          # Express on 3000
cd .. && npx ng serve --port 4200 &   # Angular on 4200

# Verify:
curl http://localhost:3000/api/dify/agents/status
curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/
```

### How to Check Agent Configuration

```bash
curl http://localhost:3000/api/dify/agents/status
# Returns: { configured: N, unconfigured: M, agents: [...] }
```

### How to Test MCP Server Health

```bash
curl https://coo-mcp-tools.up.railway.app/health
# Returns: { status: "ok", tools: 71 }
```

### Console Clues

Look for these in Express logs:
```
[DIFY-PROXY] ROUTE_DOMAIN: domainId=NPA, target_agent=IDEATION  ← Agent routing working
[DIFY-PROXY] Envelope parsed: { agent_action: "..." }           ← Metadata extraction working
[USERS] DB unavailable, returning fallback users                 ← Expected if no MySQL
[FATAL] Uncaught Exception: ...                                  ← Bug! Check stack trace
```

---

## 6. What NOT to Touch & Why

### ❌ DO NOT MODIFY

| File | Reason |
|------|--------|
| `server/mcp-python/rest_server.py` | **ASGI Path Router is critical.** The other branch reverted this and broke MCP. The dual-mount (`/mcp/*` → MCP SSE, `/*` → FastAPI) prevents CORS interference. Changing this will break all MCP tool calls from Dify. |
| `server/routes/dify-proxy.js` (parseEnvelope) | Envelope parsing supports both `[NPA_ACTION]` markers and `@@NPA_META@@` formats. Both are used by different Dify apps. Removing either format will break agent routing. |
| `server/mcp-python/main.py` (return dict) | Tool handlers MUST return plain dicts. Returning `json.dumps()` causes double-serialization ("Extra data" error). This was a hard-to-diagnose bug — don't revert. |
| `server/config/dify-agents.js` (dotenv path) | The `path.resolve(__dirname, '..', '.env')` is required. Without it, env vars are undefined when Express starts from project root. |
| `proxy.conf.json` | Angular's `/api/*` proxy to Express. Changing this breaks all API calls. |
| `server/index.js` (error handlers) | The global crash protection handlers prevent the server from dying on unhandled errors. Removing them will cause random crashes. |

### ✅ SAFE TO MODIFY

| File | What's Safe |
|------|-------------|
| Chat component templates | UI changes, new card types, styling |
| `agent-interfaces.ts` | Adding new AgentAction types, new result interfaces |
| `server/routes/*.js` (except dify-proxy) | CRUD routes can be modified freely |
| `server/mcp-python/tools/*.py` | MCP tool logic can be updated (just return dicts!) |
| `src/app/components/npa/agent-results/*` | Result card components are standalone |
| Any `*.service.ts` | Service methods can be extended |

---

## 7. What's Working Now

### Verified End-to-End Flows

**✅ Flow 1: Master COO → Routing → Ideation**
```
User: "I want to create a new ESG Green Bond Fund"
→ MASTER_COO receives, identifies as NPA domain
→ Emits ROUTE_DOMAIN with target_agent=IDEATION
→ Frontend auto-switches to IDEATION agent
→ IDEATION greets user and starts product ideation
→ Multi-turn conversation about product details
→ IDEATION emits FINALIZE_DRAFT with payload
→ Frontend shows "Draft Ready" banner
→ CLASSIFIER workflow auto-triggers
→ Classification scorecard card renders
```

**✅ Flow 2: CLASSIFIER Prohibited Check**
```
User describes a prohibited product (e.g., binary options)
→ Same flow as above until CLASSIFIER
→ CLASSIFIER returns prohibited_check.is_prohibited = true
→ Frontend shows HARD_STOP card (red)
→ Draft creation blocked
```

**✅ Flow 3: Stop Button**
```
User sends message → agent starts processing
→ Red stop button appears (replaces send button)
→ User clicks stop → HTTP request cancelled
→ "Request cancelled by user" message appears
→ User can type and send new message immediately
```

### UX Features Working

- **Stop Button**: Red ■ icon replaces send → when clicked, cancels XHR, resets state
- **Enter to Send**: Press Enter in chat textarea → sends message
- **Shift+Enter**: Press Shift+Enter → inserts new line (textarea auto-grows)
- **Textarea Auto-Grow**: Min 44px → max 120px height
- **Agent Activity Strip**: Shows which agents are running/done
- **Thinking Indicator**: Animated spinner with agent name
- **Draft Ready Banner**: Green banner with "Review Now" button

---

## 8. Next Steps & Agenda

### ✅ COMPLETED (Session 3) — All 7 Agents Wired

All 7 Dify workflow/chatflow agents are now wired to the NPA Detail page. The previous "HIGH PRIORITY" items are done:

| Agent | Status | Tab in NPA Detail |
|-------|--------|-------------------|
| **CLASSIFIER** | ✅ Wired | Analysis tab (Classification scorecard) |
| **ML_PREDICT** | ✅ Wired | Analysis tab (Approval likelihood, timeline, bottleneck) |
| **AUTOFILL** | ✅ Wired | Proposal tab (Template coverage %, lineage breakdown) |
| **RISK** | ✅ Wired | Analysis tab (4-layer risk cascade) |
| **GOVERNANCE** | ✅ Wired | Sign-Off tab (6-department sign-off matrix, SLA) |
| **DOC_LIFECYCLE** | ✅ Wired | Documents tab (Completeness %, stage gate status) |
| **MONITORING** | ✅ Wired | Monitor tab (Product health, breach alerts, PIR) |
| **DILIGENCE** | ✅ Wired | Chat tab (Conversational Q&A with KB citations) |

### 🔴 HIGH PRIORITY — MCP Tool & Agent Prompt Alignment

The Dify autofill agent prompt and MCP tools have mismatches with the actual database schema:

| Issue | Detail | Fix Needed |
|-------|--------|------------|
| **Template ID mismatch** | MCP `autofill_get_template_fields` defaults to `"npa-full-template"` (doesn't exist). DB has `FULL_NPA_V1` and `STD_NPA_V2` | Update default in `server/mcp-python/tools/autofill.py` line 17 |
| **Field count gap** | Dify prompt says 47 fields / 9 sections. DB has 144 fields / 18 sections across 2 templates | Update `WF_NPA_Autofill_Prompt.md` field counts |
| **Stale bucket ratios** | Prompt says 28 DIRECT_COPY (60%), 9 ADAPTED (19%), 10 MANUAL (21%). Actual field distribution differs | Recalculate based on real DB schema |
| **Agent interface field names** | `AutoFillField` uses `fieldName` but MCP returns `field_key` | Verify mapper in `npa-detail.component.ts` handles both |
| **Coverage targets** | Hardcoded 78% for Variation, 45% for NTG — may not match actual field availability | Make dynamic based on template structure |

### 🟡 MEDIUM PRIORITY — Frontend Enhancements

| Task | Description | Status |
|------|-------------|--------|
| **Template Editor field editing** | Click-to-edit fields in the document view | Scaffolded but needs field mutation wiring |
| **Template Editor auto-fill action** | "Auto-fill Empty Fields" button in right sidebar | Button exists, needs backend action |
| **Approval Workflow** | Approval queue with interactive sign-off buttons | Static currently |
| **Streaming Responses** | SSE real-time token streaming | DifyService has `sendMessageStreaming()` — not yet used |
| **NPA Creation from Ideation** | After FINALIZE_DRAFT, auto-create NPA in DB | Currently creates via seed-demo only |
| **Pipeline Table live data** | Wire pipeline table to real NPA list | Static currently |

### 🟢 LOW PRIORITY — Polish & Infrastructure

| Task | Description |
|------|-------------|
| **Railway Auto-Scale** | Configure min instances to avoid cold starts |
| **Unit Tests** | Add tests for DifyService, proxy envelope parsing |
| **CI/CD Pipeline** | GitHub Actions for build, test, deploy |
| **Error Boundary** | Angular ErrorHandler for global error catching |
| **Loading States** | Skeleton screens instead of spinner |
| **Mobile Responsive** | Tailwind responsive breakpoints for chat interface |
| **Dark Mode** | Tailwind dark mode classes |

---

## 9. File Reference Map

### Server

```
server/
├── index.js                    # Express entry point (port 3000)
│                                 - dotenv with absolute path
│                                 - CORS, body-parser
│                                 - All route mounts
│                                 - Error middleware + crash protection
├── db.js                       # MySQL pool (connectTimeout: 3000ms)
├── .env                        # API keys (DIFY_KEY_*, DB creds)
├── config/
│   └── dify-agents.js          # 13-agent registry with API keys
├── routes/
│   ├── dify-proxy.js           # Dify API proxy (SSE collector, envelope parser, retries)
│   ├── agents.js               # GET /api/dify/agents/status
│   ├── users.js                # GET /api/users (with fallback)
│   ├── npas.js                 # NPA CRUD
│   ├── approvals.js            # Approval workflow
│   ├── classification.js       # Classification endpoints
│   ├── risk-checks.js          # Risk assessment
│   ├── governance.js           # Governance sign-offs
│   ├── audit.js                # Audit trail
│   ├── monitoring.js           # Monitoring metrics
│   ├── dashboard.js            # Dashboard aggregation
│   └── prerequisites.js        # Prerequisite checks
└── mcp-python/
    ├── rest_server.py           # ⚠️ ASGI Path Router (DO NOT MODIFY)
    ├── main.py                  # MCP server (71 tools, returns dicts)
    ├── registry.py              # Tool registration
    ├── db.py                    # aiomysql pool
    ├── start.py                 # Startup script
    └── tools/                   # 18 tool modules
        ├── session.py
        ├── ideation.py
        ├── classification.py
        ├── autofill.py
        ├── risk.py
        ├── governance.py
        ├── audit.py
        ├── npa_data.py
        ├── workflow.py
        ├── monitoring.py
        ├── documents.py
        ├── governance_ext.py
        ├── risk_ext.py
        ├── kb_search.py
        ├── prospects.py
        ├── dashboard.py
        ├── notifications.py
        └── jurisdiction.py
```

### Frontend

```
src/app/
├── app.ts, app.config.ts, app.routes.ts
├── lib/
│   ├── agent-interfaces.ts      # 13-agent registry, 17 AgentAction types,
│   │                              9 result interfaces (AutoFill, Risk, ML, Gov, etc.)
│   └── npa-interfaces.ts         # NPA-specific types
├── services/
│   ├── dify/
│   │   ├── dify.service.ts       # Main Dify client (chat, workflow, routing)
│   │   │                          + runWorkflow() for 7-agent fire
│   │   └── dify-agent.service.ts # Agent-specific wrapper
│   ├── user.service.ts
│   ├── layout.service.ts
│   ├── npa.service.ts            # + seedDemo(), getFormSections(), getSignoffs()
│   ├── classification.service.ts
│   ├── approval.service.ts
│   ├── audit.service.ts
│   ├── dashboard.service.ts
│   ├── monitoring.service.ts
│   ├── risk-check.service.ts
│   ├── prerequisite.service.ts
│   └── agent-governance.service.ts
├── pages/
│   ├── command-center/           # Main dashboard + chat
│   ├── coo-npa/                  # NPA dashboard
│   ├── npa-agent/
│   │   ├── npa-agent.component.ts    # Route dispatcher (?mode=detail&npaId=X)
│   │   ├── npa-detail/               # ⭐ 7-tab NPA lifecycle view (1257 lines)
│   │   │   └── npa-detail.component.ts
│   │   ├── npa-template-editor/      # ⭐ 3-column document editor (816 lines)
│   │   │   └── npa-template-editor.component.ts
│   │   ├── npa-scorecard/
│   │   └── npa-chat-panel/
│   └── approval-dashboard/       # Approval queue
├── components/
│   ├── layout/                   # Main layout, sidebar, top bar
│   ├── dashboard/                # KPI cards, panels
│   ├── npa/
│   │   ├── ideation-chat/        # Orchestrator chat (NPA workspace)
│   │   ├── chat-interface/       # Generic chat UI
│   │   ├── agent-results/        # 9 result card components
│   │   ├── npa-dashboard/        # + "Demo NPA" button
│   │   ├── capability-card/
│   │   ├── agent-health-panel/
│   │   ├── sub-agent-card/
│   │   ├── work-item-list/
│   │   ├── npa-pipeline-table/
│   │   ├── npa-process-tracker/
│   │   ├── npa-workflow-visualizer/
│   │   └── document-dependency-matrix/
│   ├── common/
│   │   ├── audit-log/
│   │   └── stage-progress/
│   └── placeholder/
└── shared/
    └── icons/shared-icons.module.ts   # Lucide icon registry
```

---

## 10. Commit History

| Hash | Date | Description |
|------|------|-------------|
| `TBD` | 2026-02-18 | feat: seed-demo endpoint, 3-column template editor, NPA detail lifecycle enhancements |
| `7cda192` | 2026-02-18 | feat: wire all 7 Dify agents to NPA Lifecycle tabs with real cloud data |
| `86b0f14` | 2026-02-18 | chore: clean obsolete files, update all docs to enterprise-grade |
| `f75a49f` | 2026-02-17 | feat: stop button, enter/shift+enter chat input, and comprehensive PROGRESS.md |
| `dd391cc` | 2026-02-17 | fix: fast-fail DB timeout + fix missing lucide route icon |
| `3429968` | 2026-02-17 | feat: wire CLASSIFIER to frontend, crash-proof Express, fallback users |
| `70c5edb` | 2026-02-17 | fix: dotenv absolute paths + MCP dict return to prevent Dify parse errors |
| `be334ec` | 2026-02-16 | feat: multi-agent routing, CLASSIFIER workflow, SSE stream handling, KB provisioning |
| `ea30f06` | 2026-02-16 | fix: use compact JSON in MCP tool responses |
| `d3baff7` | 2026-02-16 | fix: isolate MCP SSE from FastAPI CORS middleware |
| `a3374f2` | 2026-02-16 | docs: add Railway deployment status document |
| `073d9a0` | 2026-02-16 | fix: resolve 18 audit bugs across KB docs, interfaces, and server routes |

---

## Testing Parameters

### Test Scenario 1: Full NPA / NTG (ESG Green Bond Fund)

```
Product Name: ESG Green Bond Fund
Product Type: Structured Note
Asset Class: Fixed Income — Green Bonds
Target Market: Institutional Investors + HNWI
Distribution: Private Placement + Wealth Advisory
Risk Features: Principal-at-risk, Market-linked, ESG scoring
Jurisdictions: Singapore, Hong Kong
Notional Size: SGD 200 million
Regulatory Framework: MAS SFA, HKMA
```
**Expected:** Full NPA track, NTG classification, high classification score (20+/30)

### Test Scenario 2: NPA Lite (SGD Fixed Deposit Variation)

```
Product Name: SGD Enhanced Fixed Deposit - 18M Tenor
Product Type: Time Deposit Variation
Asset Class: Cash / Money Market
Target Market: Retail Banking Customers
Distribution: Branch Network + Digital Banking
Risk Features: Capital guaranteed, fixed rate, early withdrawal penalty
Jurisdictions: Singapore
Notional Size: SGD 50 million
Regulatory Framework: MAS Banking Act
```
**Expected:** NPA Lite / Variation track, low classification score (<10/30)

### Test Scenario 3: Prohibited Product (HARD STOP)

```
Product Name: Crypto Binary Options Fund
Product Type: Binary Options
Asset Class: Cryptocurrency Derivatives
Target Market: Retail
Distribution: Online Platform
Risk Features: Binary payoff, total loss possible, crypto underlying
Jurisdictions: Singapore
```
**Expected:** PROHIBITED classification, HARD_STOP card, draft blocked

---

---

## 11. Session 3 (2026-02-18): NPA Detail Lifecycle + Seed Demo + Template Editor

### 11.1 What Was Built This Session

This session transformed the application from a "chat-only" agent demo into a **full NPA lifecycle management tool** with 7 working agent tabs, a seed-demo endpoint for instant rich data, and a document-style template editor.

**Summary of changes: 8 files modified, +1195 / -443 lines**

### 11.2 NPA Detail Page — 7-Tab Agent Analysis Engine

**File:** `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` (1257 lines)

The NPA Detail page is the centerpiece of the application. It loads an NPA from the database and fires all 7 Dify agents in parallel waves to populate each tab with real AI analysis.

#### 7 Tabs

| Tab | Agent(s) | What It Shows |
|-----|----------|---------------|
| **Proposal** | AUTOFILL | Template coverage %, lineage breakdown (AUTO/ADAPTED/MANUAL), time saved, field details with click-to-view |
| **Documents** | DOC_LIFECYCLE | Completeness %, missing docs, invalid docs, expiring docs, conditional rules, stage gate status |
| **Analysis** | CLASSIFIER + ML_PREDICT + RISK | Classification scorecard, approval likelihood %, predicted timeline, bottleneck dept, 4-layer risk cascade |
| **Sign-Off** | GOVERNANCE | 6-department sign-off matrix (APPROVED/PENDING/REJECTED), SLA tracking, loop-back count, circuit breaker |
| **Workflow** | (uses DB data) | Workflow stage visualization, timestamps |
| **Monitor** | MONITORING | Product health (HEALTHY/WARNING/CRITICAL), breach alerts, performance metrics, post-launch conditions, PIR status |
| **Chat** | DILIGENCE | Conversational Q&A with KB citations, related questions |

#### Agent Firing Strategy — 3 Waves

Agents are fired in staggered waves to avoid overwhelming the Dify API:

```
Wave 1 (0ms):   CLASSIFIER + ML_PREDICT
Wave 2 (2000ms): RISK + AUTOFILL
Wave 3 (4000ms): GOVERNANCE + DOC_LIFECYCLE
Wave 4 (7000ms): MONITORING
```

Each agent call:
1. Receives `buildWorkflowInputs()` — a rich input object built from `npa_projects` + `npa_form_data`
2. Runs via `DifyService.runWorkflow(agentId, inputs)` → Express proxy → Dify Cloud → MCP tools
3. Response is mapped through type-specific mappers (e.g., `mapAutoFillSummary()`, `mapRiskAssessment()`)
4. Tab data is populated and the UI updates reactively

#### buildWorkflowInputs() — Hardened Field Extraction

```
For each field, the method tries 3 sources in order:
1. npa_form_data (field_key → value)
2. npa_projects column (e.g., d.notional_amount)
3. Sensible default (e.g., 'USD', 0, 'Retail')
```

This ensures agents always receive meaningful inputs even if `npa_form_data` is partially populated.

#### Response Mappers

Each Dify workflow returns a different shape. The component has dedicated mappers:

| Mapper | Input Shape | Output Interface |
|--------|-------------|-----------------|
| `mapClassification()` | `classification_type`, `scorecard`, `prohibited_check` | `ClassificationResult` |
| `mapMLPrediction()` | `approval_likelihood`, `predicted_timeline`, `bottleneck` | `MLPrediction` |
| `mapRiskAssessment()` | `risk_layers[]`, `overall_score`, `hard_stop` | `RiskAssessment` |
| `mapAutoFillSummary()` | `autofill_result.coverage`, `filled_fields[]` | `AutoFillSummary` |
| `mapGovernanceState()` | `signoffs[]`, `sla_status`, `loop_back_count` | `GovernanceState` |
| `mapDocCompleteness()` | `completeness_percent`, `missing_docs[]`, `stage_gate_status` | `DocCompletenessResult` |
| `mapMonitoringResult()` | `product_health`, `breaches[]`, `metrics[]` | `MonitoringResult` |

### 11.3 Seed Demo Endpoint

**File:** `server/routes/npas.js` — `POST /api/npas/seed-demo` (+324 lines)

Creates a fully-equipped demo NPA with rich data across **12 database tables** in a single transaction. This allows instant testing of all 7 agent tabs without going through the full ideation → classification → approval flow.

#### What Gets Seeded

| Table | Rows | Content |
|-------|------|---------|
| `npa_projects` | 1 | "TSG2026 Digital Currency Trading Platform" — all 25 columns populated |
| `npa_form_data` | 102 | Full NPA template coverage: Product specs, risk analysis, operations, legal/compliance, revenue projections, appendices |
| `npa_jurisdictions` | 3 | SG (primary), HK, LN — cross-border |
| `npa_documents` | 10 | Mixed status: 4 VALID, 3 PENDING_REVIEW, 2 EXPIRED, 1 MISSING |
| `npa_signoffs` | 6 | 3 APPROVED, 1 UNDER_REVIEW, 2 PENDING — with assignees and SLA deadlines |
| `npa_workflow_states` | 5 | INITIATION + REVIEW completed, RISK_ASSESSMENT in progress, SIGN_OFF + LAUNCH pending |
| `npa_classification_scorecards` | 1 | 7-criterion breakdown: novelty, risk, complexity, cross-border, volume, regulatory, concentration |
| `npa_intake_assessments` | 7 | All domains: STRATEGIC, RISK, LEGAL, FINANCE, OPS, TECH, DATA — mixed HIGH/MEDIUM/LOW |
| `npa_breach_alerts` | 2 | 1 WARNING (volume threshold), 1 CRITICAL (latency SLA) |
| `npa_performance_metrics` | 1 | Realistic snapshot: revenue, volume, utilization, incidents |
| `npa_post_launch_conditions` | 3 | Mixed: 1 MET, 1 IN_PROGRESS, 1 PENDING |
| `npa_loop_backs` | 1 | Technology risk loop-back with status RESOLVED |

#### Data Design Choices (for Maximum Agent Output)

- **Product: Digital Currency Trading Platform** — Novel, complex, cross-border = maximum classification depth
- **is_cross_border: true** (SG + HK + LN) → 5-6 party sign-offs, enhanced compliance checks
- **notional_amount: $500M** → Triggers ROAE review, Finance VP, CFO flags
- **npa_type: 'New-to-Group'** → FULL_NPA track, maximum review depth
- **risk_level: HIGH** → All 4 risk layers activated
- **Form data: 102 narrative-rich fields** — each field contains 50-250 word explanations with rationale, not just short values

#### Usage

```
POST http://localhost:3000/api/npas/seed-demo
Response: { "id": "NPA-DEMO-181", "status": "SEEDED" }
```

Or click "Demo NPA" button on the NPA Dashboard.

### 11.4 Template Editor — 3-Column Document View

**File:** `src/app/pages/npa-agent/npa-template-editor/npa-template-editor.component.ts` (816 lines)

Full-screen overlay for viewing/editing the NPA draft document. Accessible by clicking "Click to view NPA Draft" button on the Proposal tab.

#### Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Top Bar (h-12, dark slate-900)                                   │
│  [← Back]   [Document Title]   [Last saved: ...]   [Close ×]    │
├────────┬──────────────────────────────────────┬──────────────────┤
│ LEFT   │  CENTER                               │  RIGHT          │
│ w-60   │  flex-1                                │  w-72           │
│        │                                        │                 │
│ Stats  │  Dark gradient header strip            │  Document       │
│ ──── │  (title, subtitle, classification)      │  Summary        │
│ 67%   │                                        │  ────           │
│ compl  │  Section headers (sticky, z-10)        │  Completion %   │
│        │  ┌──────────────────────────┐         │  Lineage bars   │
│ Nav    │  │ Section 1: Basic Info  ■ │         │  Section status  │
│ ──── │  │ field_key: value          │         │  Action buttons  │
│ • Basic│  │ field_key: value          │         │                 │
│ • Prod │  └──────────────────────────┘         │  — OR —         │
│ • Risk │                                        │                 │
│ • Ops  │  Section headers (sticky)              │  Source         │
│        │  ┌──────────────────────────┐         │  Inspector      │
│ Footer │  │ Section 2: Product Specs │         │  (on field      │
│ ──── │  │ ...                       │         │   click)        │
│ 144    │  └──────────────────────────┘         │                 │
│ total  │                                        │                 │
└────────┴──────────────────────────────────────┴──────────────────┘
```

#### Left Sidebar (Navigation + Stats)
- Completion percentage header with stacked lineage counts (auto / adapted / manual)
- Section navigation with `border-l-2` active indicator and mini completion bars
- Footer: Total Fields, Filled, Empty, Sections counts

#### Center (Document Content)
- Dark gradient header strip with title, subtitle, classification badge, meta row
- Sections render directly on white background (no paper/shadow wrapper)
- Sticky section headers with completion badges (`backdrop-blur-sm`)
- Fields displayed as `field_key → value` with lineage color coding

#### Right Sidebar (Summary / Inspector)
- **Default state:** Document Summary dashboard
  - Large completion percentage with ring indicator
  - Lineage breakdown with stacked bar chart
  - Section-by-section status with check/alert/circle icons
  - Action buttons: "Run Governance Check", "Auto-fill Empty Fields"
  - Contextual tip
- **On field click:** Source Inspector
  - Field name, lineage badge, confidence score
  - Adaptation logic explanation
  - Source snippet
  - "Ask Agent to Draft" button for manual fields

#### Key TypeScript Methods Added

```typescript
getLineageCount(lineage: string): number  // Count fields with specific lineage
getTotalFieldCount(): number              // All non-header fields
getFilledFieldCount(): number             // Fields with non-empty values
```

### 11.5 NPA Dashboard — Demo NPA Button

**File:** `src/app/components/npa/dashboard/npa-dashboard.component.ts`

Added a "Demo NPA" button next to the "Continue Draft" CTA that:
1. Calls `POST /api/npas/seed-demo`
2. Navigates to `?mode=detail&npaId=NPA-DEMO-XXX`
3. Shows the full 7-tab NPA lifecycle with all agents firing

### 11.6 DifyService Enhancements

**File:** `src/app/services/dify/dify.service.ts`

- Added `runWorkflow()` method that handles both workflow and chatflow agent types
- Proper error handling with retry-safe patterns
- Returns typed observables compatible with the detail component's subscription pattern

### 11.7 NPA Agent Router Enhancement

**File:** `src/app/pages/npa-agent/npa-agent.component.ts`

- Added `?mode=detail&npaId=XXX` query parameter routing
- When `mode=detail`, sets `npaContext = { npaId }` and `viewMode = 'WORK_ITEM'`
- `goToDetail(npaId)` method for programmatic navigation from dashboard

### 11.8 Known Issues & Gaps

| Issue | Impact | Status |
|-------|--------|--------|
| **MCP autofill template_id mismatch** | `autofill_get_template_fields` defaults to `"npa-full-template"` but DB has `FULL_NPA_V1` / `STD_NPA_V2` | Identified, not yet fixed |
| **Autofill prompt field count** | Dify prompt says 47 fields but DB has 144 | Identified, not yet updated |
| **Template editor field editing** | Click-to-edit not yet wired to backend mutation | Scaffolded, needs API calls |
| **Railway cold starts** | First request after idle may timeout (5-10s wake) | Mitigated by 3-retry strategy |
| **`nul` files in repo** | Windows artifact files `nul`, `server/nul` in untracked | Should be gitignored |

---

## 12. How We Are Building Things — Architecture Decisions

### 12.1 Development Approach

**Local Dev + Cloud Backend:** Angular runs locally on port 4200, Express API on port 3000. Both proxy to cloud services:
- Dify Cloud (dify.3senses.social) for AI agent processing
- Railway MySQL for persistent data
- Railway MCP server for tool execution

**Worktree-based development:** Using `git worktree` via `.claude/worktrees/priceless-thompson` to isolate changes. Changes are committed to `claude/priceless-thompson` branch then merged to `main`.

### 12.2 Agent Integration Pattern

All 7 specialist agents follow the same integration pattern:

```
1. Frontend builds workflow inputs from DB data (buildWorkflowInputs)
2. DifyService.runWorkflow(agentId, inputs) → POST /api/dify/workflow
3. Express proxy looks up agent config, POSTs to Dify Cloud
4. Dify processes workflow, calls MCP tools on Railway as needed
5. Dify returns structured JSON output
6. Express proxy returns response to frontend
7. Frontend mapper converts Dify output → TypeScript interface
8. Angular template renders the typed data in the appropriate tab
```

### 12.3 Database Schema (Key Tables)

The NPA lifecycle uses 12+ related tables:

| Table | Purpose | Key Columns |
|-------|---------|------------|
| `npa_projects` | Master NPA record | id, title, npa_type, risk_level, current_stage, approval_track |
| `npa_form_data` | Field-level form values | project_id, field_key, field_value, lineage, confidence_score |
| `ref_npa_templates` | Template definitions | id (FULL_NPA_V1, STD_NPA_V2) |
| `ref_npa_sections` | Template sections | template_id, title, order_index |
| `ref_npa_fields` | Template field definitions | section_id, field_key, field_type, is_required |
| `npa_documents` | Attached documents | project_id, doc_type, status, expiry_date |
| `npa_signoffs` | Approval sign-offs | project_id, department, status, assignee, sla_deadline |
| `npa_workflow_states` | Process stages | project_id, stage_name, status, started_at, completed_at |
| `npa_classification_scorecards` | AI classification results | project_id, criteria JSON |
| `npa_breach_alerts` | Monitoring alerts | project_id, severity, metric, threshold, actual |
| `npa_performance_metrics` | KPI snapshots | project_id, metric JSON |
| `npa_post_launch_conditions` | Post-launch requirements | project_id, condition, status, deadline |

### 12.4 Dify App → Agent Mapping

```
CF_NPA_Orchestrator    → MASTER_COO + NPA_ORCHESTRATOR (chatflow)
CF_NPA_Ideation        → IDEATION (chatflow)
CF_NPA_Query_Assistant → DILIGENCE + KB_SEARCH (chatflow)
WF_NPA_Classify_Predict → CLASSIFIER + ML_PREDICT (workflow)
WF_NPA_Autofill        → AUTOFILL (workflow)
WF_NPA_Risk            → RISK (workflow)
WF_NPA_Governance_Ops  → GOVERNANCE + DOC_LIFECYCLE + MONITORING + NOTIFICATION (workflow)
```

Each Dify app has its own API key in `server/.env` (prefixed `DIFY_KEY_`).

---

*This document is a living record. Update it as new agents are wired and bugs are discovered.*
