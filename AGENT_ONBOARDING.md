# Agent Onboarding Guide

> **Read this first if you're a new AI agent (or developer) starting work on this project.**

This document tells you everything you need to know to navigate the codebase quickly and correctly. No guessing required.

---

## What This Project Does

This is the **COO Multi-Agent Workbench** — a banking operations platform that automates the **New Product Approval (NPA)** process using 18 AI agents.

A "New Product Approval" is a formal approval process banks follow before launching any new financial product. It involves:
1. **Ideation** — product concept, classification
2. **Risk + Governance** — multi-department sign-offs (Risk, Finance, Legal, Ops, Tech)
3. **Compliance & Documentation** — regulatory checklists, appendices
4. **Post-Launch Monitoring** — breach alerts, PIR reviews

Your agents automate this entire lifecycle through structured chat and background workflows.

---

## Core Technology

| Layer | Tech | Where |
|-------|------|--------|
| Frontend | Angular 19, TailwindCSS | `src/` |
| Backend API | Node.js + Express 5 | `server/` |
| AI Engine | Dify Cloud (Claude 3.7 Sonnet) | External |
| Database | MySQL/MariaDB | Railway (production), local optional |
| Deployment | Render (API + frontend) | `render.yaml` |

---

## The 3 Files You Must Read

1. **`server/config/dify-agents.js`** — All 18 agents, their Dify API keys, and which Dify app they map to. This is the source of truth for agent IDs.

2. **`server/routes/dify-proxy.js`** — How chat and workflow messages are proxied to Dify, SSE streaming logic, response envelope parsing, and the retry mechanism. Most backend agent bugs start here.

3. **`src/app/services/dify/dify.service.ts`** — The Angular service managing agent conversation state, agent switching/delegation, and the streaming event pipeline to the UI.

---

## Understanding the 18 Agents

Agents come in 3 types:
- **`type: 'chat'`** — Conversational Chatflow apps. Send to `/chat-messages` in Dify.
- **`type: 'workflow'`** — Single-run Workflow apps. Send to `/workflows/run` in Dify.

```
Tier 1 (Strategic)
  MASTER_COO          → CF_COO_Orchestrator      [chat] — entry point for all user messages

Tier 2 (Domain)
  NPA_ORCHESTRATOR    → CF_NPA_Orchestrator       [chat] — routes within the NPA lifecycle

Tier 3 (Specialist)
  IDEATION            → CF_NPA_Ideation           [chat]
  CLASSIFIER          → WF_NPA_Classify_Predict   [workflow]
  ML_PREDICT          → WF_NPA_Classify_Predict   [workflow] (shares key with CLASSIFIER)
  AUTOFILL            → WF_NPA_Autofill           [workflow]
  RISK                → WF_NPA_Risk               [workflow]
  GOVERNANCE          → WF_NPA_Governance         [workflow]
  DILIGENCE           → CF_NPA_Query_Assistant    [chat]
  DOC_LIFECYCLE       → WF_NPA_Doc_Lifecycle      [workflow]
  MONITORING          → WF_NPA_Monitoring         [workflow]

Tier 3B (Draft Builder Sign-Off Chat Agents)
  AG_NPA_BIZ          → CF_NPA_BIZ               [chat] — Section I & VII owns
  AG_NPA_TECH_OPS     → CF_NPA_TECH_OPS          [chat] — Section II owns
  AG_NPA_FINANCE      → CF_NPA_FINANCE           [chat] — Section III & V owns
  AG_NPA_RMG          → CF_NPA_RMG               [chat] — Section IV & VI owns
  AG_NPA_LCS          → CF_NPA_LCS               [chat] — Appendix 1–6 owns

Tier 4 (Utilities)
  KB_SEARCH           → CF_NPA_Query_Assistant   [chat] (shares key with DILIGENCE)
  NOTIFICATION        → WF_NPA_Notification      [workflow]
```

> ⚠️ **Important:** The `AG_NPA_*` Tier 3B agents require 11 input variables injected automatically by the proxy (`npa_data`, `current_project_id`, `current_stage`, etc.). Other agents will throw a 400 error if they receive these extra variables. This is handled in `server/routes/dify-proxy.js` via the `needsUniversalDefaults` array.

---

## Key Frontend Files

| File | Purpose |
|------|---------|
| `src/app/app.routes.ts` | All routes — `/`, `/agents/npa`, `/workspace/inbox`, etc. |
| `src/app/components/shared/agent-workspace/agent-workspace.component.ts` | ⭐ **Core chat UI** — used for both Command Center and NPA chat. 1300+ lines. |
| `src/app/pages/npa-agent/npa-agent.component.ts` | NPA hub — switches between DASHBOARD / IDEATION / WORK_ITEM modes |
| `src/app/pages/npa-agent/npa-draft-builder/` | 7-tab NPA form with per-section Dify agent integration |
| `src/app/lib/agent-interfaces.ts` | `AGENT_REGISTRY`, `AgentAction` enum (17 types), all agent metadata |
| `src/app/lib/npa-template-definition.ts` | All 100+ NPA form fields — keys, types, section mapping |

---

## Key Backend Files

| File | Purpose |
|------|---------|
| `server/index.js` | Express entry — loads all 19 route modules, global error handling, background jobs |
| `server/config/dify-agents.js` | 18 agent registry with Dify API key env var mapping |
| `server/routes/dify-proxy.js` | Primary Dify integration — `/api/dify/chat` and `/api/dify/workflow` |
| `server/routes/agents.js` | Chat session C R U D — `/api/agents/sessions` |
| `server/routes/npas.js` | Core NPA CRUD (62K file — all NPA data logic lives here) |
| `server/routes/transitions.js` | NPA stage machine — submission, checker approval, sign-offs, escalation |
| `server/jobs/agent-health.js` | Background: pings all 18 agents every 5 min, logs health |
| `server/jobs/sla-monitor.js` | Background: scans DB for SLA breaches every 15 min |

---

## Understanding the Chat Flow

```
User types in Angular chat
        │
        ▼
dify.service.sendMessageStreamed(query, inputs, agentId)
        │  Angular HttpClient POST
        ▼
server/routes/dify-proxy.js  POST /api/dify/chat
  1. Normalize agent_id (e.g. "CF_NPA_Query_Assistant" → "DILIGENCE")
  2. Look up agent config via getAgent(agent_id) — throws 400 if unknown
  3. Merge default inputs (only for Tier 3B AG_NPA_* agents)
  4. POST to Dify /chat-messages with streaming=true
  5. Pipe SSE back to Angular
        │
        ▼
dify.service.ts — parses SSE chunks
  - 'message' events → stream text tokens to UI
  - 'message_end' event → extract final answer, parse metadata envelope
        │
        ▼
parseAgentMetadata() in dify.service.ts
  - Tries @@NPA_META@@{json}@@END_META@@ format (Chatflow agents)
  - Falls back to [NPA_ACTION]...[NPA_SESSION] markers (Agent apps)
        │
        ▼
processAgentRouting() → handles action types:
  ROUTE_DOMAIN     → switch agent, show domain card
  DELEGATE_AGENT   → hand off to specialist agent
  CREATE_NPA       → trigger NPA record creation in DB
  SHOW_CARD        → render classification / risk card
  ...17 total action types
```

---

## Understanding the NPA Draft Builder

Located in `src/app/pages/npa-agent/npa-draft-builder/`.

The Draft Builder has 7 tabs, each mapped to an NPA section and a Dify sign-off agent:

| Tab | Section | Agent |
|-----|---------|-------|
| Business | Section I + VII | `AG_NPA_BIZ` |
| Tech & Ops | Section II | `AG_NPA_TECH_OPS` |
| Finance | Section III + V | `AG_NPA_FINANCE` |
| Risk | Section IV + VI | `AG_NPA_RMG` |
| Legal & Compliance | Appendix 1–6 | `AG_NPA_LCS` |
| Documents | — | (client-side only) |
| Summary | — | (read-only) |

Each tab has an embedded chat panel (`npa-agent-chat.component.ts`) that sends the current NPA field values as context to the relevant agent, allowing section-specific AI guidance.

---

## Common Tasks

### "I need to add a new agent"
1. Add entry to `DIFY_AGENTS` in `server/config/dify-agents.js`
2. Add env var `DIFY_KEY_<AGENT_ID>=app-xxx` to `server/.env` and Render env vars
3. Add agent to `AGENT_REGISTRY` array in `src/app/lib/agent-interfaces.ts`
4. If it's a Tier 3B Chatflow requiring 11 inputs, add its ID to the `needsUniversalDefaults` array in `server/routes/dify-proxy.js`

### "The chat is returning a 400 error"
- Check if the agent ID exists in `server/config/dify-agents.js`
- Check if the Dify API key is set in the environment
- Verify the agent isn't an "Agent app" that chokes on extra input variables (the `needsUniversalDefaults` guard)
- Run: `curl http://localhost:3000/api/dify/agents/health`

### "Sessions aren't saving/loading"
- Check `server/routes/agents.js` and the `agent_sessions` table
- Key columns: `title`, `preview`, `domain_agent_json`, `updated_at` (added via `server/fix-db-schema.js`)
- Timestamps must be in `YYYY-MM-DD HH:MM:SS` format (MySQL requirement)

### "I need to understand an NPA form field"
- Field definitions: `src/app/lib/npa-template-definition.ts`
- Dify agent ownership by field: `Context/Dify_Agent_Prompts/CF_NPA_BIZ_Prompt.md` (and other agent prompts)

### "I need to understand the DB schema"
- Full schema: `database/schema-only.sql`
- Full seed data: `database/seed-data-only.sql`

---

## What NOT to Edit

| Path | Reason |
|------|--------|
| `Context/Dify_Agent_Prompts/` | These are the system prompts deployed to Dify Cloud. Editing here only documents intent — you must also update them in Dify |
| `Context/Dify_Agent_KBs/` | Knowledge base source docs — Dify-managed |
| `dist/` | Auto-generated Angular build artifact |
| `database/npa_workbench_full_export.sql` | DB snapshot — use `schema-only.sql` + `seed-data-only.sql` instead |

---

## Deployment Notes

- **Render URL**: `https://npa-workbench.onrender.com`
- **Angular**: built via `npm run build` → served as static from `dist/` by Express
- **Railway DB**: connection via `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` env vars
- **Dify**: `DIFY_BASE_URL=https://api.dify.ai/v1` — cloud-hosted, not self-hosted

---

## Agent Action Types (17 total)

Defined in `src/app/lib/agent-interfaces.ts` as the `AgentAction` type:

```
ROUTE_DOMAIN        — COO routes to NPA/Risk/Finance domain
DELEGATE_AGENT      — NPA Orchestrator delegates to specialist
CREATE_NPA          — Trigger NPA DB record creation
SHOW_CARD           — Render a structured result card
CLASSIFICATION      — Show classification scorecard
RISK_ASSESSMENT     — Show risk result
HARD_STOP           — Blocked — prohibited product
FINALIZE_DRAFT      — Move to NPA Draft Builder
SHOW_RAW_RESPONSE   — Plain text response (no action)
SHOW_ERROR          — Show error state
...
```

The full list and payload shapes are in `src/app/lib/agent-interfaces.ts`.
