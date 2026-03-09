# COO Multi‑Agent Workbench — Bottlenecks & Gaps Checklist

**Date:** 2026-02-23  
**Scope:** Database (MySQL/MariaDB), Agents (Dify proxy + MCP tools), UI (Angular)  
**Goal:** Turn the current MVP into a stable, scalable, and correctly‑persisting system.

## How To Use This Checklist

- Priorities:
  - **P0** = data integrity / security / correctness (must fix before scale/demo)
  - **P1** = reliability / performance / operability
  - **P2** = quality / UX polish / maintainability
- Each item includes: **Why**, **Where**, **Fix approach**, **Acceptance criteria**.

---

# 1) Database (DB) — Bottlenecks & Gaps

## P0 — Data Integrity & Correctness

### DB‑P0‑01 — Fix broken “UPSERT” for `npa_form_data` (duplicate rows risk)
- [x] **Why:** Multiple endpoints rely on `INSERT ... ON DUPLICATE KEY UPDATE`, but `npa_form_data` has **no unique key** on `(project_id, field_key)`, so “upserts” can silently create duplicates. This breaks reads (duplicate fields), inflates table size, and makes lineage/confidence unreliable.
- [x] **Where:**
  - Schema: `database/schema-only.sql` (`npa_form_data`)
  - Upsert callers: `server/routes/npas.js` (draft save + prefill persist), `server/routes/agents.js` (autofill persist), `server/mcp-python/tools/autofill.py` (populate tools)
- [x] **Fix approach:**
  1. Add a migration to **dedupe existing rows** for each `(project_id, field_key)` group (keep latest by `MAX(id)` unless a better tie-breaker exists).
  2. Add **unique index**: `UNIQUE KEY uq_npa_form_data_project_field (project_id, field_key)`.
  3. Validate all upsert statements succeed and no duplicates remain.
- [x] **Acceptance criteria:**
  - `SELECT project_id, field_key, COUNT(*) c FROM npa_form_data GROUP BY project_id, field_key HAVING c > 1;` returns **0 rows**.
  - Updating the same field twice results in **one row** changing (not two rows created).

### DB‑P0‑02 — Resolve `updated_at` mismatch for `npa_form_data`
- [x] **Why:** Code updates `npa_form_data.updated_at`, but the dump schema does not include that column. This can cause runtime SQL errors depending on the route used.
- [x] **Where:** `server/routes/agents.js` (autofill persist includes `updated_at = NOW()`); schema in `database/schema-only.sql` / `database/npa_workbench_full_export.sql`
- [x] **Fix approach (choose one and standardize):**
  - Option A (preferred): Add `created_at` + `updated_at` columns to `npa_form_data` (with defaults + `ON UPDATE`) and keep the code.
  - Option B: Remove `updated_at` writes from code paths and rely on `id` ordering only.
- [x] **Acceptance criteria:** All persist routes succeed against a freshly bootstrapped DB with no “unknown column `updated_at`” errors.

### DB‑P0‑03 — Align DB bootstrap with the current 339‑field template
- [x] **Why:** The roadmap targets **339 fields**, but `database/deploy.sh` imports `database/npa_workbench_full_export.sql` which (per docs) only has ~106 `ref_npa_fields`. This creates FK failures or missing fields when the app expects the newer template.
- [x] **Where:**
  - Bootstrap: `database/deploy.sh`
  - Current field sync: `database/migrations/004_sync_339_fields.sql`
  - Doc mismatch: `database/README.md`
- [x] **Fix approach:**
  - Pick a single source of truth for local/prod schema:
    1. **Regenerate** `database/npa_workbench_full_export.sql` from a DB that has the 339 fields applied, **or**
    2. Update `database/deploy.sh` to import schema+seed and then apply **all migrations** (002/003/004) deterministically, **or**
    3. Replace “dump import” with “schema + seed + migrations” as the standard path.
- [x] **Acceptance criteria:**
  - Fresh local DB contains `COUNT(*) FROM ref_npa_fields` ≈ **339** (or whatever the app’s field registry requires).
  - `POST /api/npas/seed-demo` completes without FK errors.

### DB‑P0‑04 — Remove production reliance on `SET sql_mode = ''`
- [x] **Why:** Several routes disable SQL mode to work around strict-mode failures. This can mask data issues and create environment-specific bugs (local works, prod fails).
- [x] **Where:** `server/routes/npas.js` (`seed-demo` + create), plus any other route doing this pattern.
- [x] **Fix approach:**
  - Identify the schema defaults causing strict errors (notably `npa_projects.updated_at` defaulting to a zero timestamp).
  - Fix schema defaults to be valid under MySQL 8 strict mode.
  - Remove the `SET sql_mode = ''` statements from API code.
- [x] **Acceptance criteria:** All routes run with strict SQL mode enabled; no inserts/updates require disabling SQL mode.

### DB‑P0‑05 — Fix collision-prone NPA ID generation
- [x] **Why:** `NPA-2026-` + last 3 digits of `Date.now()` can collide (especially under concurrency / retries), leading to insert failures or data overwrites.
- [x] **Where:** `server/routes/npas.js` (create route)
- [x] **Fix approach:** Switch to `crypto.randomUUID()` (or ULID) and keep IDs stable as `varchar(36)`; update any code that assumes the `NPA-YYYY-###` format.
- [x] **Acceptance criteria:** Creating 100+ NPAs quickly produces **no duplicate IDs**.

### DB‑P0‑06 — Increase or chunk AUTOFILL persist batch size
- [x] **Why:** Zod caps persist batches to 200 fields, but the template is 339 fields; full-template autofill will fail or require client-side chunking.
- [x] **Where:** `server/validation/autofill-schema.js`
- [x] **Fix approach:** Either raise the limit safely (and ensure request size limits are OK) or implement a chunking contract (client sends multiple batches and server returns per-batch status).
- [x] **Acceptance criteria:** Persisting 339 fields works reliably and returns a clear success summary.

### DB‑P0‑07 — Avoid duplicate KB registries (`kb_documents` vs `knowledge_documents`)
- [x] **Why:** Two KB registries create drift: MCP/RAG uses `kb_documents` while UI-only tables can diverge.
- [x] **Where:** `database/migrations/009_add_knowledge_evidence_tables.sql`, `database/migrations/010_expand_kb_documents_and_add_evidence_library.sql`
- [x] **Fix approach:** Store UI metadata in `kb_documents` (single source of truth) and keep `knowledge_documents` out of the schema.
- [x] **Acceptance criteria:** Knowledge Base UI reads from `kb_documents` and there is no separate `knowledge_documents` table required for prod.

## P1 — Performance & Scalability

### DB‑P1‑01 — Reduce N+1 and correlated subqueries in list endpoints
- [x] **Why:** `GET /api/npas` and approvals endpoints use correlated `COUNT(*)` subqueries per project; this can degrade quickly with more rows.
- [x] **Where:** `server/routes/npas.js` (list), `server/routes/approvals.js` (list)
- [x] **Fix approach:** Replace correlated subqueries with joins + grouped aggregates, or compute counters in a materialized table (if needed).
- [x] **Acceptance criteria:** Query plans use indexes and response times stay stable as NPAs grow.

### DB‑P1‑02 — Collapse `GET /api/npas/:id` “many sequential queries”
- [x] **Why:** Detail endpoint runs many queries in sequence; latency adds up and increases DB connection usage.
- [x] **Where:** `server/routes/npas.js` (`GET /:id`)
- [x] **Fix approach:** Use `Promise.all` for independent queries and/or consolidated SQL joins.
- [x] **Acceptance criteria:** End-to-end response time improves measurably (baseline vs after).

### DB‑P1‑03 — Add indexes for high-frequency filters/sorts
- [x] **Why:** `npa_projects` has only a PK; routes filter/sort on `created_at`, `current_stage`, `status`, `approval_track`, `npa_type`, etc. Missing indexes will become a bottleneck.
- [x] **Where:** `database/schema-only.sql` (`npa_projects` and related tables)
- [x] **Fix approach:** Add targeted indexes (e.g., `(current_stage)`, `(status)`, `(created_at)`, `(approval_track)`) and composite indexes where needed.
- [x] **Acceptance criteria:** Key dashboard/list queries avoid full table scans at moderate row counts.

### DB‑P1‑04 — Bulk write optimization for form saves
- [x] **Why:** Draft save and autofill persist loop field-by-field with individual inserts; this is slow for 339 fields.
- [x] **Where:** `server/routes/npas.js` (PUT update), `server/routes/agents.js` (persist/autofill), `server/routes/npas.js` (prefill persist)
- [x] **Fix approach:** Convert to multi-row inserts (with upsert) per batch + single commit.
- [x] **Acceptance criteria:** Saving a full template is fast and doesn’t saturate the DB pool.

## P2 — Maintainability / Governance

### DB‑P2‑01 — Introduce a consistent migration/runbook story
- [x] **Why:** There are multiple schema sources (`schema-only.sql`, `init_full_database.sql`, `npa_workbench_full_export.sql`, migrations). This is a long-term drift risk.
- [x] **Where:** `database/` and `src/assets/sql/`
- [x] **Fix approach:** Decide on a canonical pipeline (migrations-only or dump-as-source) and document it; optionally add a `schema_migrations` table.
- [x] **Acceptance criteria:** A new developer can bootstrap the DB with a single documented path and get the same schema every time.

---

# 2) Agents (Dify + Proxy + MCP) — Bottlenecks & Gaps

## P0 — Correctness / Security / Cost Control

### AG‑P0‑01 — Replace hardcoded Dify `user` identity (multi-user isolation)
- [x] **Why:** Dify conversations are scoped by `user`. Using `user-123` / `default-user` merges conversations across all real users and breaks auditability.
- [x] **Where:** `src/app/services/dify/dify.service.ts`, `server/routes/dify-proxy.js`
- [x] **Fix approach:** Use the authenticated user from JWT (e.g., `req.user.userId`), pass it end-to-end, and ensure conversation history fetch uses the same value.
- [x] **Acceptance criteria:** Two different logins never share the same Dify conversation thread.

### AG‑P0‑02 — Ensure auth headers are sent for Dify streaming calls
- [x] **Why:** Dify streaming uses `fetch`, so Angular’s auth interceptor does not attach JWTs; if `/api/dify/*` is secured later, chat breaks.
- [x] **Where:** `src/app/services/dify/dify.service.ts` (fetch calls), `src/app/interceptors/auth.interceptor.ts`
- [x] **Fix approach:** Add `Authorization: Bearer <token>` to fetch requests (or migrate streaming to HttpClient with events).
- [x] **Acceptance criteria:** Streaming works when `/api/dify/*` requires auth.

### AG‑P0‑03 — Abort upstream Dify requests on client disconnect
- [x] **Why:** If the browser closes/unsubscribes, the server keeps streaming from Dify; this wastes tokens, CPU, and open sockets.
- [x] **Where:** `server/routes/dify-proxy.js` (stream piping)
- [x] **Fix approach:** Wire `req.on('close')` / `res.on('close')` to cancel/abort the axios request + underlying stream.
- [x] **Acceptance criteria:** Disconnecting the client quickly stops the upstream Dify stream.

### AG‑P0‑04 — Fix workflow input coercion for structured inputs
- [x] **Why:** Proxy stringifies all non-strings; JSON objects/arrays become `"[object Object]"` which breaks workflows expecting JSON text.
- [x] **Where:** `server/routes/dify-proxy.js` workflow safeInputs coercion
- [x] **Fix approach:** If input is an object/array, `JSON.stringify` it; keep strings as-is; keep null/undefined omitted.
- [x] **Acceptance criteria:** Workflows that require JSON inputs behave correctly.

### AG‑P0‑05 — Update MCP autofill tools for current field types/options
- [x] **Why:** `autofill_get_template_fields` only loads options when `field_type in ('select','multi-select')`, but the newer template uses `dropdown` / `multiselect`.
- [x] **Where:** `server/mcp-python/tools/autofill.py`
- [x] **Fix approach:** Expand recognition to include `dropdown`, `multiselect`, `checkbox_group` (as applicable) and align with the Angular registry.
- [x] **Acceptance criteria:** Dropdown/multiselect fields return options correctly from `ref_field_options`.

### AG‑P0‑06 — Fix collision-prone NPA ID generation in MCP Python tools
- [x] **Why:** `NPA-YYYY-####` generation can collide under concurrency and cause intermittent insert failures when MCP tools create projects directly in the DB.
- [x] **Where:** `server/mcp-python/tools/ideation.py`, `server/mcp-python/tools/prospects.py`
- [x] **Fix approach:** Use a UUID-based ID (e.g., `NPA-<uuid>`) consistent with the Node API.
- [x] **Acceptance criteria:** Creating many NPAs via MCP tools produces no duplicate IDs or insert errors.

## P1 — Reliability / Observability

### AG‑P1‑01 — Make agent health checks more meaningful (reduce false positives)
- [x] **Why:** Health monitor treats HTTP 404 as “ok”, which can mark agents healthy even if the endpoint is wrong; it also doesn’t validate the specific agent app.
- [x] **Where:** `server/jobs/agent-health.js`
- [x] **Fix approach:** Use a Dify-supported endpoint that reliably checks auth + app availability (and record distinct failure modes).
- [x] **Acceptance criteria:** Health dashboard differentiates misconfiguration vs outage with low false positives.

### AG‑P1‑02 — Normalize agent/app alias maps in one place
- [x] **Why:** Alias maps exist in both FE and BE; drift will cause routing bugs.
- [x] **Where:** `server/routes/dify-proxy.js`, `src/app/services/dify/dify.service.ts`
- [x] **Fix approach:** Centralize alias map (shared JSON/TS file) or enforce a single canonical mapping.
- [x] **Acceptance criteria:** Adding/renaming a Dify app requires updating one mapping location.

---

# 3) UI (Angular) — Bottlenecks & Gaps

## P0 — Correctness / UX Breakers

### UI‑P0‑01 — Replace placeholder approver identity in approvals
- [x] **Why:** Approve/reject calls send `approver_user_id: 'current_user'`, so the DB/audit trail can’t attribute actions correctly.
- [x] **Where:** `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts`
- [x] **Fix approach:** Use `AuthService.currentUser` (id/name/email) and/or let the backend derive identity from JWT and ignore client-sent approver fields.
- [x] **Acceptance criteria:** Approval actions are recorded with the real logged-in user.

### UI‑P0‑02 — Return `ref_field_options` in `/api/npas/:id/form-sections`
- [x] **Why:** The template editor and DB-driven forms can’t render correct dropdown choices without options.
- [x] **Where:** `server/routes/npas.js` (`GET /:id/form-sections`)
- [x] **Fix approach:** Join `ref_field_options` into the response (by field id), return `options: [{value,label}]`.
- [x] **Acceptance criteria:** Dropdown/multiselect UI shows correct options without hardcoding.

### UI‑P0‑03 — Fix Lucide “icon not provided” runtime errors
- [x] **Why:** Missing icon registrations crash rendering for pages that bind icon names dynamically (e.g., Knowledge Base).
- [x] **Where:** `src/app/shared/icons/shared-icons.module.ts`, icon usage in `src/app/pages/knowledge-base/knowledge-base.ts`
- [x] **Fix approach:** Register the missing icons using their canonical export names (avoid aliasing icons like `Map as MapIcon`, which changes the registry key).
- [x] **Acceptance criteria:** No console errors like `The "map" icon has not been provided...` and Knowledge Base renders without icon failures.

## P1 — Performance / Responsiveness

### UI‑P1‑01 — Reduce change detection churn during streaming
- [x] **Why:** Streaming parses SSE lines inside `ngZone.run()` for every chunk, triggering frequent change detection and potentially jank.
- [x] **Where:** `src/app/services/dify/dify.service.ts` (`sendMessageStreamed`)
- [x] **Fix approach:** Parse stream outside Angular zone and re-enter only at a controlled cadence (e.g., animation frame / small batching).
- [x] **Acceptance criteria:** Streaming remains smooth with long outputs; CPU usage drops vs baseline.

### UI‑P1‑02 — Large-form rendering strategy for 339 fields
- [x] **Why:** Even with `trackBy`, rendering hundreds of fields can be heavy (especially with rich field types like tables/uploads).
- [x] **Where:** Draft builder components under `src/app/pages/npa-agent/npa-draft-builder/`
- [x] **Fix approach:** Lazy render by active section + virtualization for long lists; avoid recomputing group arrays frequently.
- [x] **Acceptance criteria:** Switching sections and typing remains responsive on mid-tier laptops.

## P2 — Security / Access Control

### UI‑P2‑01 — Enforce RBAC consistently across routes/actions
- [x] **Why:** Middleware exists, but routes don’t enforce it; UI only “greys out” some cards. This is not secure.
- [x] **Where:** `server/middleware/rbac.js`, server routes, UI gating
- [x] **Fix approach:** Decide which endpoints require auth/roles; enforce on backend; keep UI gating as convenience only.
- [x] **Acceptance criteria:** Unauthorized users receive 401/403 from backend for restricted actions.

---

# 4) Cross-Cutting “Alignment” Tasks (DB ↔ Agents ↔ UI)

## P0

### X‑P0‑01 — Unify field type vocabulary end-to-end
- [x] **Why:** There are multiple field-type taxonomies (DB legacy `select` vs new `dropdown`, etc.). Drift breaks rendering, option fetching, and autofill.
- [x] **Where:** `database/seed-data-only.sql`, `database/migrations/004_sync_339_fields.sql`, `src/app/lib/npa-interfaces.ts`, `server/mcp-python/tools/autofill.py`
- [x] **Fix approach:** Define a canonical set of types (matching `NpaFieldType`) and map legacy values during migration/ingest.
- [x] **Acceptance criteria:** UI can render any field returned from DB without ad-hoc conversions.

### X‑P0‑02 — Establish a single “current user” source of truth
- [x] **Why:** Several systems use placeholders (`default_user`, `user-123`, `current_user`). This breaks auditing, per-user sessions, and security.
- [x] **Where:** Dify proxy, approvals, sessions, and any persistence endpoints
- [x] **Fix approach:** Use JWT identity; propagate it to DB writes and to Dify `user`.
- [x] **Acceptance criteria:** Audit log entries and chat sessions are attributable to real users.

---

## Notes / Known Backlog (Not strictly “bugs”)

- Phase 4 roadmap items: autofill pipeline enhancement, similarity search for COPY strategy, validation summary panel, etc. (See `NPA-WORKBENCH-ROADMAP.md`.)
