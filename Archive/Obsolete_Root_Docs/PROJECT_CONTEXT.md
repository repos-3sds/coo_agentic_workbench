# COO Multi-Agent Workbench — Project Context

> **Use this file to resume work in a new Claude Code session.** Paste its contents as the first message.
> **Last Updated:** 2026-02-17

## Project

**Name:** `agent-command-hub-angular` (COO Multi-Agent Workbench)
**Stack:** Angular 19 + Express 5 + Python FastMCP + MariaDB 10.6 + Dify Cloud
**Purpose:** AI-powered COO Workbench with 13 agents across 4 tiers for NPA (New Product Approval) processing

---

## Architecture — 13 Agents, 4 Tiers

| Tier | Agent ID | Dify Type | Dify App | Status |
|------|----------|-----------|----------|--------|
| **T1** | MASTER_COO | Chatflow | CF_NPA_Orchestrator | ✅ Live |
| **T2** | NPA_ORCHESTRATOR | Chatflow | CF_NPA_Orchestrator | ✅ Configured |
| **T3** | IDEATION | Chatflow | CF_NPA_Ideation | ✅ Live |
| **T3** | CLASSIFIER | Workflow | WF_NPA_Classify_Predict | ✅ Live |
| **T3** | ML_PREDICT | Workflow | WF_NPA_Classify_Predict | ✅ Configured |
| **T3** | AUTOFILL | Workflow | WF_NPA_Autofill | ⚠️ Key needed |
| **T3** | RISK | Workflow | WF_NPA_Risk | ⚠️ Key needed |
| **T3** | GOVERNANCE | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T3** | DILIGENCE | Chatflow | CF_NPA_Query_Assistant | ⚠️ Key needed |
| **T3** | DOC_LIFECYCLE | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T3** | MONITORING | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |
| **T4** | KB_SEARCH | Chatflow | CF_NPA_Query_Assistant | ⚠️ Key needed |
| **T4** | NOTIFICATION | Workflow | WF_NPA_Governance_Ops | ⚠️ Key needed |

---

## Live Deployments

### Dify Cloud (Self-hosted)
- **URL:** `http://dify.3senses.social` (port 80)
- **3 Chatflow apps created:** CF_NPA_Orchestrator, CF_NPA_Ideation, CF_NPA_Query_Assistant
- **4 Workflow apps planned:** WF_NPA_Classify_Predict, WF_NPA_Autofill, WF_NPA_Risk, WF_NPA_Governance_Ops
- **MCP SSE connected:** All 71 tools discovered via `/mcp/sse`

### MCP Tools Server (Railway)
- **Base URL:** `https://coo-mcp-tools.up.railway.app`
- **Health:** `/health` — 71 tools, 18 categories
- **REST API:** `/tools/{tool_name}` (POST) + `/openapi.json`
- **MCP SSE:** `/mcp/sse` (Dify native MCP — via ASGI Path Router)

### Railway MySQL
- **Internal:** `mysql.railway.internal:3306` (used by MCP server)
- **42 tables** with seed data

### Local Development
- **Angular Frontend:** `npx ng serve` → port 4200 (proxies `/api/*` to 3000)
- **Express API:** `node server/index.js` → port 3000
- **MCP Python Server:** port 3002 (Railway hosted)

---

## Codebase Structure

```
agent-command-hub-angular/
├── src/app/
│   ├── pages/                    # 4 pages
│   │   ├── command-center/       # Master COO chat (LANDING + CHAT modes)
│   │   ├── npa-agent/            # NPA workspace (detail, scorecard, readiness)
│   │   ├── approval-dashboard/   # Approval queue
│   │   └── coo-npa/              # COO NPA Control Tower
│   ├── components/               # 30+ components
│   │   ├── npa/ideation-chat/    # Orchestrator chat (agent workspace)
│   │   ├── npa/agent-results/    # 9 result card components
│   │   ├── dashboard/            # KPI cards, panels
│   │   └── layout/               # Sidebar, top bar, main layout
│   ├── services/
│   │   ├── dify/dify.service.ts  # Dify API client (chat, workflow, routing)
│   │   └── ...                   # 12 services total
│   └── lib/
│       ├── agent-interfaces.ts   # 13-agent registry, 17 action types, 9 result interfaces
│       └── npa-interfaces.ts     # NPA-specific types
├── server/
│   ├── index.js                  # Express entry (crash protection, error middleware)
│   ├── db.js                     # MySQL pool (connectTimeout: 3000ms)
│   ├── .env                      # API keys (DIFY_KEY_*, DB creds)
│   ├── config/dify-agents.js     # 13-agent Dify key registry
│   ├── routes/
│   │   ├── dify-proxy.js         # SSE collector, envelope parser, 3-retry
│   │   └── ...                   # 12 Express route files
│   └── mcp-python/               # MCP Tools Server
│       ├── rest_server.py        # ⚠️ ASGI Path Router (DO NOT MODIFY)
│       ├── main.py               # 71 tools (return dicts, NOT json.dumps)
│       └── tools/                # 18 tool modules
├── database/
│   └── npa_workbench_full_export.sql
├── docs/                         # Enterprise documentation
│   ├── PROGRESS.md               # Detailed progress report & troubleshooting
│   ├── architecture/
│   ├── dify-agents/
│   ├── knowledge-base/
│   ├── mcp-server/
│   └── database/
└── Context/                      # Research & planning (internal reference)
```

---

## Key Implementation Details

### Frontend ↔ Dify Wiring

1. **DifyService** — Per-agent conversation management, delegation stack, Observable-based
2. **Envelope Protocol** — Dify agents embed `@@NPA_META@@{json}` in responses; proxy strips & returns as `metadata`
3. **Agent Routing** — `processAgentRouting()` handles ROUTE_DOMAIN, DELEGATE_AGENT, FINALIZE_DRAFT, etc.
4. **CLASSIFIER** — Auto-triggered as Workflow after FINALIZE_DRAFT; parses JSON from markdown code fences

### Critical Architecture Rules

- **`rest_server.py`** — ASGI Path Router splits `/mcp/*` → MCP SSE (no CORS) vs `/*` → FastAPI REST. **DO NOT MODIFY.** Another branch reverted this and broke MCP.
- **`main.py` tool handlers** — Must return plain `dict`, NOT `json.dumps()`. Returning strings causes double-serialization.
- **`dotenv` paths** — Must use `path.resolve(__dirname, '.env')`. Without absolute paths, env vars are undefined.
- **Express crash handlers** — Global `uncaughtException` + `unhandledRejection` handlers prevent server death.

### Working E2E Flows

- ✅ Master COO → ROUTE_DOMAIN → IDEATION (multi-turn conversation)
- ✅ IDEATION → FINALIZE_DRAFT → CLASSIFIER (auto-trigger, scorecard rendering)
- ✅ CLASSIFIER → PROHIBITED → HARD_STOP (blocks draft creation)
- ✅ Stop Button (cancels in-flight requests)
- ✅ Enter to send / Shift+Enter for newline

---

## What's Done

- ✅ Angular 19 frontend with 30+ components, 4 pages, full routing
- ✅ Express API with 14 route files + Dify proxy (SSE collector + envelope parser)
- ✅ Python MCP server with 71 tools (Railway deployed)
- ✅ 3 Dify agents live: MASTER_COO, IDEATION, CLASSIFIER
- ✅ Real agent routing working end-to-end
- ✅ CLASSIFIER wired to frontend with auto-trigger
- ✅ Express crash protection + fallback users
- ✅ Stop button + Enter/Shift+Enter chat UX
- ✅ Comprehensive PROGRESS.md documentation

## What's Pending

- Create remaining Dify apps (AUTOFILL, RISK, GOVERNANCE, DILIGENCE, DOC_LIFECYCLE, MONITORING)
- Wire frontend result cards for remaining agents (Risk, AutoFill, Governance, etc.)
- Implement SSE streaming for real-time token display
- Add API-key auth to MCP Tools Server
- Local MySQL setup (currently using fallback users)
- Unit tests, CI/CD pipeline

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Express | `cd server && node index.js` |
| Start Angular | `npx ng serve --port 4200` |
| Check agents | `curl http://localhost:3000/api/dify/agents/status` |
| Check MCP health | `curl https://coo-mcp-tools.up.railway.app/health` |
| Full progress report | `docs/PROGRESS.md` |
