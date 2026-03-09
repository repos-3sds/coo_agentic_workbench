# COO Agentic Workbench — Bottlenecks & Gaps Checklist (2026-02-23)

This is a working checklist for **DB → API → Agents/MCP → UI** readiness.

Legend:
- **P0** = blocks demo / prod validation
- **P1** = important quality / stability
- **P2** = polish / nice-to-have

---

## DB (MySQL / Railway)

### P0
- [ ] **Run/verify migrations in Railway** (schema drift is the #1 source of `500` + missing UI data).
  - `database/migrations/011_add_kb_document_files.sql` (KB PDF storage columns).
  - Verify `npa_form_data` exists and contains seed rows for `NPA-2026-001…005`.
- [ ] **Confirm UI is reading from the intended DB** (local dev often points at `server/.env` by default).
  - Standardize local run: `ENV_FILE=server/.env.railway node server/index.js`.
- [ ] **NPA Draft form-data endpoint exists and returns rows**.
  - `GET /api/npas/:id/form-data` must return an array of `{field_key, field_value,...}`.

### P1
- [ ] **Indexing for UX latency** (pool/dashboard pages should not “spin” on large datasets):
  - `npa_projects(created_at, status, current_stage)`
  - `npa_form_data(project_id, field_key)`
  - `kb_documents(doc_id, ui_category)`
  - `evidence_library(evidence_type, created_at)`
- [ ] **Autofill persistence at scale (339 fields)**:
  - Batch writes (avoid single huge SQL) and enforce payload limits.
  - Guard against MySQL `max_allowed_packet` issues.

### P2
- [ ] **Knowledge/Evidence metadata hygiene**:
  - Enforce `visibility` and `ui_category` allowed values via ENUM/CHECK (optional).

---

## API (Express / Node)

### P0
- [ ] **Eliminate “wrong env file” boot**:
  - Ensure dev/prod loads the expected `.env` file (avoid local DB by accident).
  - Confirm `DIFY_BASE_URL` and all `DIFY_KEY_*` variables exist in the runtime env (Render).
- [ ] **Stop returning hard-to-debug 500s**:
  - On DB failures, key routes should return either fallback (when safe) or structured `{error, detail}`.

### P1
- [ ] **Diagnostics for agent calls**:
  - When Dify returns SSE `event:error`, surface `code/status/message` in response metadata.
  - Add a “debug mode” toggle via env var (`DIFY_DEBUG=1`) that increases logs without leaking secrets.
- [ ] **JWT auth + role gates**:
  - Confirm `Authorization: Bearer <token>` is consistently applied for `/api/*` calls.
  - Decide which endpoints require auth vs can fallback (e.g., KB file streaming should remain protected).

---

## Agents (Dify) + MCP Tools

### P0
- [ ] **All required Dify apps have keys configured** (Render env vars):
  - COO orchestrator, NPA orchestrator, ideation, query assistant, classifier, risk, governance,
    monitoring, doc lifecycle, notification, and 5 sign-off agents (BIZ/TECH_OPS/FINANCE/RMG/LCS).
- [ ] **Sign-off agent UX validation**:
  - From Draft Builder, each sign-off agent must respond to a short “OK” prompt in <10s.
- [ ] **If Dify is erroring in Render but not locally**:
  - Verify Dify app tool configs (MCP endpoints) are reachable from Dify cloud.
  - Verify Render outbound connectivity + TLS (rare, but possible).

### P1
- [ ] **Conversation isolation**:
  - Ensure `user` passed to Dify is stable per logged-in user (not a shared default).
- [ ] **Workflow agent response envelopes**:
  - Ensure workflows output `agent_action/agent_id/payload/trace` consistently for UI rendering.

---

## UI (Angular)

### P0
- [ ] **No missing icon provider errors**:
  - Resolve Lucide missing icon runtime errors (`log-out`, `git-commit`, `map`, `landmark`, etc.).
- [ ] **Knowledge Base doc split-view navigation works**:
  - Clicking a KB card must navigate to `/knowledge/base/:doc_id`.
  - The doc viewer must load the PDF (`/api/kb/:docId/file`) and show chat on the right.
- [ ] **Evidence: Precedents & Patterns**:
  - Sidebar entry should open the Patterns view deterministically (via query param).

### P1
- [ ] **Upload UX**:
  - Add an interim “document details” step before selecting PDF (type, category, agent link).
  - Confirm the upload persists metadata + file and appears immediately in the KB list.
- [ ] **Login/JWT**:
  - Verify login produces a JWT, stored in `localStorage`, applied via interceptor, and `authGuard` redirects correctly.

---

## Deployment (Render/Railway) — Operational

### P0
- [ ] **No secrets in git**:
  - Ensure `.env*` and uploads folders are ignored.
  - Rotate keys later (they’ve been shared in chat during POC).
- [ ] **Render env var parity**:
  - Confirm Render has all `DIFY_KEY_*` + `DIFY_BASE_URL` + DB connection vars (if API connects directly).

### P1
- [ ] **Add basic observability**:
  - Standard request id, upstream latency logging for Dify routes, and structured error logs.

---

## Notes / Current Known Facts
- Autofill can appear “broken” if intentionally disabled in the UI flow; validate the toggle/state before debugging.

