# COO Command Center — Production Wiring Guide (2026-02-23)

This guide explains how to wire **UI**, **API**, **DB**, **Agents (Dify)**, and **MCP Tools** across environments (local, cloud, and in-bank).

No Railway/Render URLs are required by the codebase; those are deployment choices. In production, you replace them via **environment variables** and **reverse proxy routing**.

---

## 1) System overview (how layers connect)

```mermaid
flowchart LR
  U["Browser (Angular SPA)"] -->|/api/*| A["Node/Express API\n(also serves SPA in prod)"]
  A -->|MySQL| DB["MySQL\n(npa_workbench schema)"]

  A -->|HTTPS| D["Dify Cloud / Dify On‑Prem"]
  D -->|Tools (REST OpenAPI)\n and/or MCP SSE| M["MCP Tools Server (Python)\n/health /openapi.json\n/mcp/sse"]
  M -->|MySQL| DB
```

Key design principle:
- The Angular UI calls **relative** paths like `/api/...`. If the SPA and API are on the **same origin** in prod, you avoid CORS and URL drift entirely.

---

## 2) Deployable services in this repo

### A) `npa-workbench` (Node): Angular + Express API
- **Express API** lives in `server/`.
- In production, Express serves the built SPA from `dist/.../browser` and also serves `/api/*`.
- Health: `GET /api/health`

### B) `mcp-tools` (Python): MCP Tools Server
- Lives in `server/mcp-python/`
- Exposes:
  - Health: `GET /health`
  - REST tools: `GET /openapi.json`, `POST /tools/<tool_name>`
  - MCP SSE transport: `/mcp/sse` and `/mcp/messages` (single-port mount)

### C) MySQL (external)
- Schema expects `npa_workbench` (default), with `ref_npa_fields` and `npa_form_data` used heavily by Draft Builder.

### D) Dify Agents (external or on-prem)
- The API proxies all agent calls via `server/routes/dify-proxy.js` so browser never sees agent keys.
- Agent IDs + environment key names are defined in `shared/agent-registry.json`.

---

## 3) Environment wiring patterns

### Pattern 1 (recommended): **Single origin** (SPA + API together)
Use one hostname, e.g.:
- `https://coo-command-center.bank.internal`

Routing:
- `/` → Angular SPA (static)
- `/api/*` → Express API (same process)

Benefit:
- UI never needs to know API URLs.
- No CORS headaches.

### Pattern 2: Split origin (SPA and API on different hosts)
If required, you must:
- Configure CORS on API (`server/index.js` uses `cors()`).
- Configure UI to call the API base URL (currently it assumes relative `/api`).

If you want split origin in-bank, prefer a reverse proxy that still presents a single public origin to the browser.

---

## 4) Required environment variables (what changes per environment)

### 4.1 API service (`server/index.js`)

**Database**
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME` (e.g. `npa_workbench` or `railway`)

**Auth**
- `JWT_SECRET` (required in real prod; default is dev-only)
- `DEMO_PASSWORD` (optional; demo mode)

**Dify (Agents)**
- `DIFY_BASE_URL` (default in `render.yaml`: `https://api.dify.ai/v1`)

Agent API keys (set these as secrets in your runtime, never commit):
- All agents are defined in `shared/agent-registry.json` via `"envKey"`.
- Minimum for Draft Builder sign-off chat:
  - `DIFY_KEY_AG_NPA_BIZ`
  - `DIFY_KEY_AG_NPA_TECH_OPS`
  - `DIFY_KEY_AG_NPA_FINANCE`
  - `DIFY_KEY_AG_NPA_RMG`
  - `DIFY_KEY_AG_NPA_LCS`
- Common orchestrators/workflows used across the app:
  - `DIFY_KEY_MASTER_COO`
  - `DIFY_KEY_NPA_ORCHESTRATOR`
  - `DIFY_KEY_IDEATION`
  - `DIFY_KEY_CLASSIFIER`
  - `DIFY_KEY_AUTOFILL`
  - `DIFY_KEY_RISK`
  - `DIFY_KEY_GOVERNANCE`
  - `DIFY_KEY_DILIGENCE`
  - `DIFY_KEY_DOC_LIFECYCLE`
  - `DIFY_KEY_MONITORING`
  - `DIFY_KEY_NOTIFICATION`

**Dify reliability / debugging (optional)**
- `DIFY_DEBUG=1` (enables deeper logs)
- `DIFY_CHAT_TIMEOUT_MS` (default 120000)
- `DIFY_CHAT_MAX_RETRIES` (default 0)
- `JSON_BODY_LIMIT` (default `2mb`)

Operational checks:
- `GET /api/health` should return `{status:"UP", db:"CONNECTED"}`
- `GET /api/dify/agents/status` should return configured agents (true/false)

### 4.2 MCP Tools service (`server/mcp-python/`)

**Database** (same as API)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Server**
- `PORT` / `REST_PORT` / `MCP_PORT` (single-port deploys usually set these to the same value)
- `PUBLIC_URL` (important for OpenAPI `servers[].url`, used by Dify tool import)
- `ENV=production` (optional)

Operational checks:
- `GET /health` → 200
- `GET /openapi.json` → has `/tools/*`
- Dify can reach the service from its network (critical in-bank)

---

## 5) Database migrations (must-run in target DB)

At minimum for Draft Builder persistence:
- `database/migrations/004_sync_339_fields.sql`
  - Ensures `ref_npa_fields` contains the full field registry.
  - Without this, saves can fail or fields can be dropped due to FK constraints.

For comments (Draft + Field):
- `database/migrations/012_expand_npa_comments_for_draft_builder.sql`

For Knowledge Base + Evidence UI:
- `database/migrations/009_add_knowledge_evidence_tables.sql`
- `database/migrations/010_expand_kb_documents_and_add_evidence_library.sql`
- `database/migrations/011_add_kb_document_files.sql`

How to apply migrations (any environment):
1. Create an env file (never commit secrets):
   - Copy `server/env.railway.example` → `server/.env.<env>`
2. Run:
   - `node server/apply-seed.js --env-file server/.env.<env> database/migrations/004_sync_339_fields.sql`

---

## 6) Wiring Dify ↔ MCP Tools (where most prod pain happens)

There are two distinct integration paths:

### Option A: Dify uses MCP Tools via REST OpenAPI (recommended in locked-down networks)
1. Deploy MCP Tools service at an internal URL, e.g. `https://mcp-tools.bank.internal`
2. Ensure `PUBLIC_URL=https://mcp-tools.bank.internal`
3. In Dify, create a **Custom Tool Provider** by importing:
   - `https://mcp-tools.bank.internal/openapi.json`
4. Ensure Dify apps/workflows reference those tools.

Pros:
- Works with standard HTTPS egress rules.
- Easier to monitor and firewall.

### Option B: Dify uses MCP SSE transport
1. Deploy MCP Tools service and expose:
   - `/mcp/sse` and `/mcp/messages`
2. Configure Dify MCP plugin/integration to point at:
   - `https://mcp-tools.bank.internal/mcp/sse`

Pros:
- Closer to “native MCP” semantics.
Cons:
- SSE/WebSocket-like behavior can be blocked by some proxies.

---

## 7) Wiring Agents (Dify) ↔ API (this repo)

The browser calls the API:
- `POST /api/dify/chat` for chatflow agents
- `POST /api/dify/workflow` for workflow agents

The API selects the correct Dify key based on:
- agent IDs and `envKey` entries in `shared/agent-registry.json`

To add or rename an agent safely:
1. Update `shared/agent-registry.json` with `id`, `difyApp`, and `envKey`.
2. Set the new env var in your prod runtime.
3. Validate with `GET /api/dify/agents/status`.

---

## 8) UI ↔ API wiring (avoid URL drift)

### Local dev
- UI: `http://localhost:4200`
- API: `http://localhost:3000`
- Proxy: `proxy.conf.json` maps `/api` → `http://localhost:3000`

Run:
- UI: `npm run start`
- API: `ENV_FILE=server/.env node server/index.js`

### Production
Prefer serving the SPA from Express (same host) so UI keeps using `/api/...` unchanged.

---

## 9) Deployment checklists (bank-friendly)

### API service checklist
- [ ] Set DB env vars and confirm `/api/health`
- [ ] Apply `database/migrations/004_sync_339_fields.sql`
- [ ] Set `JWT_SECRET`
- [ ] Set all required `DIFY_KEY_*` env vars
- [ ] Confirm `/api/dify/agents/status` shows configured=true

### MCP Tools checklist
- [ ] Set DB env vars
- [ ] Set `PUBLIC_URL` to the externally reachable URL (from Dify)
- [ ] Confirm `/health` and `/openapi.json`
- [ ] Confirm Dify can call at least one tool end-to-end

### Dify checklist
- [ ] Agents/apps exist with names in `shared/agent-registry.json` (`difyApp`)
- [ ] Tools provider configured (OpenAPI or MCP SSE)
- [ ] API keys generated and stored as runtime secrets in the API service

---

## 10) Common failure modes (and what to check)

### “I clicked Save but values disappeared”
- You likely persisted empty strings over seeded values.
- Ensure you are running the latest Draft Builder persistence logic (only persists changed fields).
- Confirm the DB row actually updated:
  - `SELECT field_value FROM npa_form_data WHERE project_id='<ID>' AND field_key='business_rationale';`

### “FK constraint fails on npa_form_data(field_key) → ref_npa_fields(field_key)”
- Apply `database/migrations/004_sync_339_fields.sql` on the target DB.

### “Agent not configured”
- Missing Dify key env var; check `shared/agent-registry.json` `envKey` and set it.

### CORS / network blocks in-bank
- Prefer single-origin routing.
- Prefer REST OpenAPI tools for MCP.
- Ensure firewall allows API → Dify and Dify → MCP Tools (or Dify on-prem).

