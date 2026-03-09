# COO Multi-Agent Workbench — Progress Report

> **Last Updated:** 2026-02-17
> **Branch:** `claude/priceless-thompson` → merged to `origin/main`
> **Status:** Core multi-agent flow WORKING end-to-end

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
| **T3 Specialist** | CLASSIFIER | Workflow | WF_NPA_Classify_Predict | ✅ Working |
| **T3 Specialist** | ML_PREDICT | Workflow | WF_NPA_Classify_Predict | ✅ Configured |
| **T3 Specialist** | AUTOFILL | Workflow | WF_NPA_Autofill | ⚠️ Key needed |
| **T3 Specialist** | RISK | Workflow | WF_NPA_Risk | ⚠️ Key needed |
| **T3 Specialist** | GOVERNANCE | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T3 Specialist** | DILIGENCE | Chatflow | CF_NPA_Query_Assistant | ⚠️ Key needed |
| **T3 Specialist** | DOC_LIFECYCLE | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T3 Specialist** | MONITORING | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T4 Utility** | KB_SEARCH | Chatflow | CF_NPA_Query_Assistant | ⚠️ Key needed |
| **T4 Utility** | NOTIFICATION | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |

**"Configured" = API key present in `.env`; "Key needed" = Dify app not yet created or key not added**

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
| **Stop Button** | Both chat components | ✅ NEW |
| **Enter/Shift+Enter** | Both chat components | ✅ NEW |
| NPA Dashboard | `npa-dashboard.component.ts` | ✅ Static |
| Pipeline Table | `npa-pipeline-table.component.ts` | ✅ Static |
| Approval Dashboard | `approval-dashboard` page | ✅ Static |

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

### 🔴 HIGH PRIORITY — Remaining Agents to Wire

These agents have entries in the registry but need Dify apps + API keys:

| Agent | Dify App Needed | What It Does |
|-------|----------------|--------------|
| **AUTOFILL** | WF_NPA_Autofill | Auto-fills 47-field NPA template from ideation data |
| **RISK** | WF_NPA_Risk | 4-layer risk cascade (Market, Credit, Ops, Regulatory) |
| **GOVERNANCE** | WF_NPA_Governance_Ops | Sign-off routing, SLA tracking, circuit breaker |
| **DILIGENCE** | CF_NPA_Query_Assistant | Conversational Q&A over Knowledge Base |
| **DOC_LIFECYCLE** | WF_NPA_Governance_Ops | Document validation, completeness checks |
| **MONITORING** | WF_NPA_Governance_Ops | Post-launch KPI tracking, PIR status |
| **KB_SEARCH** | CF_NPA_Query_Assistant | Semantic search across KB documents |
| **NOTIFICATION** | WF_NPA_Governance_Ops | Alert delivery via email/Slack/webhook |

**Steps for each:**
1. Create Dify app (Chatflow or Workflow) with appropriate system prompts
2. Add MCP tool access (Railway MCP SSE endpoint)
3. Get API key → add to `server/.env`
4. Test independently with curl
5. Wire frontend card rendering if needed

### 🟡 MEDIUM PRIORITY — Frontend Enhancements

| Task | Description | Files |
|------|-------------|-------|
| **Risk Assessment Card** | Render 4-layer risk cascade | `risk-assessment-result.component.ts` (exists, needs wiring) |
| **AutoFill Summary Card** | Show coverage %, fields filled | `autofill-summary.component.ts` (exists, needs wiring) |
| **Governance Status Card** | Sign-off matrix, SLA timer | `governance-status.component.ts` (exists, needs wiring) |
| **Doc Completeness Card** | Document checklist with status | `doc-completeness.component.ts` (exists, needs wiring) |
| **Monitoring Alerts Card** | Post-launch metrics | `monitoring-alerts.component.ts` (exists, needs wiring) |
| **KB Search Results** | Search result snippets | `kb-search-results.component.ts` (exists, needs wiring) |
| **Streaming Responses** | SSE real-time token streaming | DifyService has `sendMessageStreaming()` — not yet used in UI |
| **NPA Detail Page** | Full NPA view with all agent results | `npa-detail.component.ts` — partially built |
| **Approval Workflow** | Approval queue with sign-off buttons | `approval-dashboard` — static currently |

### 🟢 LOW PRIORITY — Polish & Infrastructure

| Task | Description |
|------|-------------|
| **Local MySQL Setup** | Create schema, seed data, remove need for fallback users |
| **Railway Auto-Scale** | Configure min instances to avoid cold starts |
| **Unit Tests** | Add tests for DifyService, proxy envelope parsing |
| **CI/CD Pipeline** | GitHub Actions for build, test, deploy |
| **Error Boundary** | Angular ErrorHandler for global error catching |
| **Loading States** | Skeleton screens instead of spinner |
| **Mobile Responsive** | Tailwind responsive breakpoints for chat interface |
| **Dark Mode** | Tailwind dark mode classes |

### 📋 Complete Agent Wiring Checklist

For each new agent, follow this checklist:

- [ ] Dify app created with system prompt + MCP tools
- [ ] API key added to `server/.env` as `DIFY_KEY_<AGENT_ID>`
- [ ] Agent config verified in `server/config/dify-agents.js`
- [ ] Tested with curl: `curl -X POST http://localhost:3000/api/dify/chat -H "Content-Type: application/json" -d '{"query": "test", "agentId": "AGENT_ID"}'`
- [ ] Frontend card component exists and renders correctly
- [ ] Agent action handler added to component's `handleResponse()`
- [ ] Auto-trigger logic added if needed (like CLASSIFIER after FINALIZE_DRAFT)
- [ ] End-to-end flow tested in browser

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
│   │                              9 result interfaces
│   └── npa-interfaces.ts         # NPA-specific types
├── services/
│   ├── dify/
│   │   ├── dify.service.ts       # Main Dify client (chat, workflow, routing)
│   │   └── dify-agent.service.ts # Agent-specific wrapper
│   ├── user.service.ts
│   ├── layout.service.ts
│   ├── npa.service.ts
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
│   ├── npa-agent/                # NPA workspace (detail, scorecard, etc.)
│   └── approval-dashboard/       # Approval queue
├── components/
│   ├── layout/                   # Main layout, sidebar, top bar
│   ├── dashboard/                # KPI cards, panels
│   ├── npa/
│   │   ├── ideation-chat/        # Orchestrator chat (NPA workspace)
│   │   ├── chat-interface/       # Generic chat UI
│   │   ├── agent-results/        # 9 result card components
│   │   ├── npa-dashboard/
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
| `TBD` | 2026-02-17 | feat: stop button + enter/shift+enter for chat input |
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

*This document is a living record. Update it as new agents are wired and bugs are discovered.*
