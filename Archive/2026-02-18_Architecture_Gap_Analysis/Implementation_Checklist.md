# Implementation Checklist
## COO Multi-Agent Workbench — Phase-by-Phase Progress Tracker

**Created:** 2026-02-18
**Strategy:** Express API first (bottleneck in 17/22 gaps), DB verification as Step 0
**Input Documents:** Architecture_Gap_Register.md (22 gaps), Remediation_Roadmap.md (6 sprints)

---

## Phase 0: Documentation & Analysis (COMPLETE)

- [x] NPA Business Process Deep Knowledge report (951 lines) — `NPA_Business_Process_Deep_Knowledge.md`
- [x] Action Plan for Architecture Gap Analysis — `Action_Plan_Architecture_Gap_Analysis.md`
- [x] Architecture Gap Register (44 rules, 22 gaps, 5 observations) — `Architecture_Gap_Register.md`
- [x] Root Cause Layer tracing added to all 22 gaps, 44 rules, 5 observations
- [x] Part D: Root Cause Distribution by Layer added to Gap Register
- [x] Remediation Roadmap with layer-per-task tables — `Remediation_Roadmap.md`
- [x] Implementation Checklist created (this document)
- [x] Tech Rationale: Dify vs Express — cross-verified against codebase + Dify docs — `Tech_Rationale_Dify_vs_Express.md`

---

## Phase 0.5: DB Verification Pass

**Goal:** Confirm all 41 tables exist, reference data is populated, schema matches gap register assumptions. Zero changes expected — this is READ-ONLY validation.

- [x] Read `schema-only.sql` (994 lines, 41 CREATE TABLEs) — all tables verified
- [x] Verify `npa_projects` schema — FOUND: `pac_approval_status` (default 'N/A'), `pir_status` (default 'NOT_REQUIRED'), `pir_due_date`, `is_cross_border`, `npa_type`, `approval_track`, `notional_amount`, `current_stage`, `classification_confidence`, `launched_at`. **MISSING: `validity_expiry`** → logged as D-001
- [x] Verify `ref_signoff_routing_rules` — 19 rows confirmed: FULL_NPA=9, NPA_LITE=5, BUNDLING=3, EVERGREEN=2
- [x] Verify `ref_escalation_rules` — 9 rows: LOOP_BACK_LIMIT at levels 2(threshold=2), 3(threshold=3), 4(threshold=4). Circuit breaker at level 3. Correct.
- [x] Verify `npa_signoffs` schema — `sla_deadline`, `sla_breached`, `loop_back_count` all confirmed
- [x] Verify `npa_risk_checks` schema — `check_layer`, `result` (PASS/FAIL/WARNING) confirmed
- [x] Verify `npa_escalations` schema — `trigger_type`, `escalation_level`, `status` confirmed
- [x] Verify `npa_audit_log` schema — `confidence_score`, `reasoning`, `source_citations` confirmed
- [x] Verify `npa_loop_backs` schema — `loop_back_type`, `loop_back_number` confirmed
- [x] Verify `npa_post_launch_conditions` schema — confirmed
- [x] Verify `npa_breach_alerts` schema — confirmed
- [x] Verify `npa_classification_scorecards` schema — confirmed
- [x] Verify `npa_form_data` schema — confirmed with `lineage` CHECK constraint
- [x] Verify `npa_documents` schema — `file_size`, `file_extension`, `validation_status` confirmed. **MISSING: `file_path`** → logged as D-002
- [x] Verify `npa_performance_metrics` schema — confirmed
- [x] Verify `ref_prohibited_items` — 9 rows: 3 INTERNAL, 2 REGULATORY, 2 SANCTIONS, 2 DYNAMIC
- [x] Verify `users` — 15 users: 5 MAKER, 2 CHECKER, 7 APPROVER, 1 COO
- [x] Document discrepancies — 5 logged (D-001 through D-005), 2 OPEN, 3 CLOSED

---

## Sprint 0: P0 Compliance Blockers (1-2 Days)

**Gaps Closed:** GAP-001, GAP-002, GAP-003
**Primary Layers:** Express API + Angular UI

### Task 0.1 — Enforce Prohibited Hard Stop (GAP-001)
- [x] **EXP:** Added `checkProhibitedGate()` function in `server/routes/approvals.js` — queries `npa_risk_checks WHERE project_id = :id AND result = 'FAIL'`, returns 403 if FAIL exists. Applied to sign-off decision endpoint.
- [x] **ANG:** Reorder wave execution in `npa-detail.component.ts` — RISK → Wave 0 (t=0), CLASSIFIER → Wave 1 (after RISK completes). If `hardStop: true`, abort subsequent waves and disable action buttons *(completed Sprint 2 — Task 2.2)*
- [x] **TEST:** Smoke test created — `server/tests/smoke-test.js` Task 0.1: prohibited hard stop gate check

### Task 0.2 — PAC Gate for NTG (GAP-002)
- [x] **EXP:** Added `checkPacGate()` function in `server/routes/approvals.js` — if `npa_type = 'New-to-Group'` AND `pac_approval_status != 'Approved'` → return 403. Applied via `enforceComplianceGates()` middleware.
- [x] **ANG:** Added PAC Status indicator badge in NPA Detail header (`npa-detail.component.ts`). Shows PAC: Approved (green), Pending/N/A (amber), Rejected (red) for NTG products. Added `isNtg`, `pacStatus`, `pacBlocked` computed properties.
- [x] **TEST:** Smoke test created — Task 0.2: PAC gate enforcement for NTG products

### Task 0.3 — NTG→Full NPA Lock (GAP-003)
- [x] **EXP:** In `server/routes/governance.js` POST /classification — if `calculatedTier = 'New-to-Group'`, force `approval_track = 'FULL_NPA'` regardless of input. Logs override to `npa_audit_log` with reason citing Standard §2.1.1. Also now persists `approval_track` to `npa_projects` (was missing before).
- [x] **MCP:** Updated `classify_determine_track` in `classification.py` — if `npa_type = 'New-to-Group'`, overrides any track to `FULL_NPA`, logs `NTG_TRACK_OVERRIDE` audit entry. Belt-and-suspenders with Express governance.js.
- [x] **TEST:** Smoke test created — Task 0.3: NTG→FULL_NPA lock via governance classification

---

## Sprint 1: Core State Machine & Persistence (3-5 Days)

**Gaps Closed:** GAP-004, GAP-005, GAP-007, GAP-013
**Primary Layers:** Express API + Angular UI + MCP Tools

### Task 1.1 — Server-Side Stage Transitions (GAP-013)
- [x] **EXP:** Created `server/routes/transitions.js` with 9 transition endpoints: submit, checker-approve, checker-return, resubmit, request-rework, final-approve, reject, withdraw, launch. Each uses `FOR UPDATE` row lock, `BEGIN...COMMIT` transactions, validates `current_stage`, creates `npa_audit_log` entry, and returns full NPA object.
- [x] **EXP:** Registered route in `server/index.js` as `app.use('/api/transitions', transitionsRoutes)`. Verified server boots cleanly.
- [x] **EXP:** Wired `checkAllSignoffsComplete()` into `approvals.js` signoff decision endpoint — auto-advances NPA to `PENDING_FINAL_APPROVAL` when last SOP party approves.
- [x] **EXP:** Updated approvals dashboard query to include `PENDING_CHECKER` and `ESCALATED` stages.
- [x] **ANG:** Replaced ALL 5 local state mutations in `approval-dashboard.component.ts` (`submit`, `approve`, `requestRework`, `reject`, `finalApprove`) with HTTP calls to transitions API. Added `reloadItems()` for full data refresh after each transition. Removed local `checkIfAllSignedOff()`. Build verified.
- [x] **ANG:** Added 9 transition methods to `approval.service.ts`: `submitNpa`, `resubmitNpa`, `checkerApprove`, `checkerReturn`, `requestRework`, `finalApprove`, `rejectNpa`, `withdrawNpa`, `launchNpa`.
- [x] **TEST:** Smoke test created — Task 1.1: transitions API route mounting + submit/withdraw/launch endpoints

### Task 1.2 — Dynamic SOP Assignment (GAP-004)
- [x] **EXP:** Created `assignSignoffParties(conn, npa)` function in `transitions.js` — queries `ref_signoff_routing_rules` filtered by `approval_track`, deduplicates by `party_name`, creates `npa_signoffs` rows with `sla_deadline = NOW() + sla_hours`.
- [x] **EXP:** Cross-border override implemented — forces Finance, Credit Risk, Compliance, Technology Architecture, Operations regardless of track.
- [x] **EXP:** NTG overseas override implemented — checks `npa_jurisdictions` for non-SG codes, forces Head Office Legal + Compliance.
- [x] **EXP:** Wired into `checker-approve` transition endpoint — signoffs created atomically in same transaction.
- [x] **MCP:** Updated `governance_create_signoff_matrix` in `governance.py` — now queries `npa_projects.notional_amount` and adds ROAE (>$20M), Finance VP (>$50M), CFO (>$100M) signoffs with deduplication.
- [x] **TEST:** Smoke test created — Task 1.2: signoff party list endpoint + notional threshold verification

### Task 1.3 — Circuit Breaker (GAP-005)
- [x] **EXP:** In `request-rework` endpoint: increments `loop_back_count` on signoff row, inserts `npa_loop_backs` record, queries `ref_escalation_rules WHERE trigger_type = 'LOOP_BACK_LIMIT'` sorted DESC by threshold.
- [x] **EXP:** If loop_back_number >= threshold (level 3 = GPH at 3): inserts `npa_escalations` with `ACTIVE` status, sets `current_stage = 'ESCALATED'`, `status = 'Blocked'`.
- [x] **ANG:** Removed local loop_back_count increment — now handled server-side. `requestRework()` calls API and shows escalation alert if circuit breaker triggers.
- [x] **TEST:** Smoke test created — Task 1.3: request-rework endpoint + circuit breaker trigger

### Task 1.4 — Add Missing Stage Values (GAP-007)
- [x] **EXP:** Added `POST /withdraw` endpoint — allowed from DRAFT, INITIATION, RETURNED_TO_MAKER, PENDING_CHECKER → WITHDRAWN.
- [x] **EXP:** Added `POST /launch` endpoint — APPROVED → LAUNCHED, sets `launched_at = NOW()`, auto-sets `pir_status = 'PENDING'` and `pir_due_date = NOW() + 6 MONTHS` for NTG products.
- [x] **ANG:** Updated `mapStageToNpaStage()` — added INITIATION, ESCALATED, WITHDRAWN, PIR_REQUIRED, EXPIRED. Changed fallback from 'DRAFT' to pass-through `stage`.
- [x] **TEST:** Smoke test created — Task 1.4: withdraw + launch transition endpoints

---

## Sprint 2: Agent Write-Back & Wave Reorder (3-5 Days)

**Gaps Closed:** Obs 1, Obs 4
**Primary Layers:** Angular UI + Express API

### Task 2.1 — Agent Result Persistence (Obs 1)
- [x] **EXP:** Created 7 persist endpoints in `server/routes/agents.js`: POST `/persist/classifier` (upserts `npa_classification_scorecards`, updates `npa_projects`), `/persist/risk` (replaces `npa_risk_checks` by RISK_AGENT, upserts `npa_intake_assessments`), `/persist/autofill` (upserts `npa_form_data` with AUTO lineage), `/persist/ml-predict` (updates `predicted_*` columns on `npa_projects`), `/persist/governance` (updates signoff metadata), `/persist/doc-lifecycle` (upserts `npa_documents`), `/persist/monitoring` (upserts `npa_monitoring_thresholds`). All include `npa_audit_log` entries with `is_agent_action = 1`.
- [x] **ANG:** Added `persistAgentResult()` fire-and-forget method to `npa-detail.component.ts`. Each case in `handleAgentResult()` now calls persist after mapping agent outputs.
- [x] **TEST:** Smoke test created — Task 2.1: classifier + risk agent persist endpoints

### Task 2.2 — Wave Dependency Chain (Obs 4)
- [x] **ANG:** Replaced `timer()` with proper RxJS `concatMap` + `forkJoin` chain in `runAgentAnalysis()`. New wave order: W0(RISK hard-stop gate) → W1(CLASSIFIER + ML_PREDICT parallel) → W2(AUTOFILL + GOVERNANCE parallel) → W3(DOC_LIFECYCLE → MONITORING sequential). If RISK returns `hard_stop=true`, EMPTY is emitted and all subsequent waves abort with error messages.
- [x] **TEST:** Verified via Angular build — wave dependency chain compiles (RxJS concatMap+forkJoin)

### Task 2.3 — Pass Agent Outputs Between Waves
- [x] **ANG:** Added `waveContext: Record<string, any>` to component. Each agent's raw outputs are accumulated as `${agentId.toLowerCase()}_result` keys. Merged into workflow inputs for each subsequent wave via `{ ...inputs, ...this.waveContext, ...extraInputs }`.
- [x] **TEST:** Verified via Angular build — waveContext accumulator compiles

---

## Sprint 3: SLA, Thresholds & Monitoring (3-5 Days)

**Gaps Closed:** GAP-006, GAP-010, GAP-012, GAP-017
**Primary Layers:** Express API + MCP Tools

### Task 3.1 — SLA Monitoring (GAP-006)
- [x] **EXP:** Created `server/jobs/sla-monitor.js` — `checkSlaBreaches()` finds signoffs past SLA deadline (`WHERE status IN ('PENDING','UNDER_REVIEW','CLARIFICATION_NEEDED') AND NOW() > sla_deadline AND sla_breached = 0`), sets `sla_breached = 1`, creates `npa_breach_alerts` with severity (WARNING < 48h, CRITICAL >= 48h), logs `SLA_BREACHED` audit entry, updates project status to 'Delayed'.
- [x] **EXP:** Created `checkValidityExpiry()` in same job — flags LAUNCHED NPAs past `validity_expiry` as EXPIRED. Gracefully skips if column not yet added (D-001).
- [x] **EXP:** Registered in `server/index.js` — `startSlaMonitor(15 * 60 * 1000)` fires on server boot and every 15 min. Exports `startMonitor`, `stopMonitor`, `runSlaMonitor` for testing.
- [x] **EXP:** SLA deadlines already set when signoffs created in `assignSignoffParties()` (Sprint 1) — `DATE_ADD(NOW(), INTERVAL sla_hours HOUR)` from `ref_signoff_routing_rules`.
- [x] **TEST:** Smoke test created — Task 3.1: breach alerts endpoint verification

### Task 3.2 — Notional Threshold Checks (GAP-012)
- [x] **EXP:** Added notional threshold checks to `assignSignoffParties()` in `transitions.js`: >$20M adds ROAE (72h SLA), >$50M adds Finance VP (72h SLA), >$100M adds CFO (96h SLA). All use `NOTIONAL_THRESHOLD` party_group and are deduplicated via the existing `partyMap`.
- [x] **MCP:** Updated `governance_create_signoff_matrix` in `governance.py` — adds ROAE (>$20M), Finance VP (>$50M), CFO (>$100M) with deduplication against existing parties.
- [x] **TEST:** Smoke test created — Task 3.2: verified via SOP assignment + code review of notional thresholds

### Task 3.3 — Validity Expiry Management (GAP-010)
- [x] **EXP:** In `final-approve` endpoint: set `validity_expiry = DATE_ADD(NOW(), INTERVAL 1 YEAR)` with graceful fallback if column not yet migrated (ER_BAD_FIELD_ERROR)
- [x] **EXP:** Validity expiry monitoring integrated into `sla-monitor.js` `checkValidityExpiry()` — no separate `validity-monitor.js` needed
- [x] **EXP:** Created `POST /:id/extend-validity` endpoint in `transitions.js` — extends by 1-24 months, requires reason, `FOR UPDATE` lock, increments `extension_count`
- [x] **DB:** Created `database/migrations/003_sprint_3_5_schema.sql` — adds `validity_expiry DATE`, `extension_count INT`, `file_path VARCHAR(500)`, `approval_track_subtype VARCHAR(10)`, predicted_* columns. Safe to run multiple times (IF NOT EXISTS).
- [x] **TEST:** Smoke test created — Task 3.3: extend-validity endpoint

### Task 3.4 — Audit Logging Middleware (GAP-017)
- [x] **EXP:** Created `server/middleware/audit.js` — provides `auditLog(opts)` standalone function (accepts conn or uses pool, supports all `npa_audit_log` columns including agent fields) and `auditMiddleware(modulePrefix)` Express middleware (auto-logs POST/PUT/PATCH/DELETE on response finish, fire-and-forget).
- [x] **EXP:** Wired `auditMiddleware` into `server/index.js` for 13 route modules: GOV, NPA, APPROVAL, CLASSIFY, RISK, PREREQ, AGENT, TRANSITION, PIR, BUNDLING, EVERGREEN, ESCALATION, DOCUMENT. Excluded: users (read-only), monitoring (read-only), dashboard (read-only), audit (circular), dify (proxy).
- [x] **TEST:** Smoke test created — Task 3.4: audit log entries query endpoint

---

## Sprint 4: PIR, Bundling & Conditional Approvals (5-7 Days)

**Gaps Closed:** GAP-008, GAP-011, GAP-014, GAP-015
**Primary Layers:** All 5 layers

### Task 4.1 — PIR Workflow (GAP-011)
- [x] **EXP:** `pir_due_date` already auto-set in `launch` transition (Sprint 1): 6 months for NTG, per `transitions.js`.
- [x] **EXP:** Created `server/routes/pir.js` with 4 endpoints: GET `/pending` (NPAs with PENDING/SUBMITTED/OVERDUE PIR), GET `/:id` (PIR details + conditions + metrics), POST `/:id/submit` (validates PENDING/OVERDUE → SUBMITTED, updates conditions), POST `/:id/approve` (SUBMITTED → COMPLETED), POST `/:id/extend` (extends pir_due_date by N months).
- [x] **EXP:** Added `checkPirOverdue()` to `sla-monitor.js` — marks PIR as OVERDUE when `pir_due_date < NOW()`, updates status to 'At Risk'.
- [x] **EXP:** Registered in `server/index.js` as `app.use('/api/pir', pirRoutes)`.
- [x] **ANG:** Created `src/app/pages/pir-management/pir-management.component.ts` — PIR table with status KPI strip, submit/approve/extend actions, days_until_due color coding. Created `src/app/services/pir.service.ts`. Route: `/functions/pir`.
- [x] **TEST:** Smoke test created — Task 4.1: PIR pending list endpoint

### Task 4.2 — Bundling Framework (GAP-008)
- [x] **EXP:** Created `server/routes/bundling.js` with 8-condition assessment engine. GET `/:id/assess?parent_id=X` evaluates all 8 conditions (approved parent, same category, no new risk, within notional limits, same booking entity, same jurisdictions, no new counterparty, operational capacity) and recommends BUNDLING/NPA_LITE/FULL_NPA track. POST `/:id/apply` sets `approval_track = 'BUNDLING'`.
- [x] **EXP:** Registered in `server/index.js` as `app.use('/api/bundling', bundlingRoutes)`.
- [x] **MCP:** Created `server/mcp-python/tools/bundling.py` — `bundling_assess` (8-condition check) + `bundling_apply` tools. Registered in `__init__.py`.
- [x] **DIFY:** Updated `KB_Classification_Agent.md` — expanded Override 3 (Bundling) with 8-condition eligibility assessment logic (approved parent, same category, no new risk, notional limits, same entity, jurisdictions subset, no new counterparty, ops capacity). Updated Branch 8 decision tree and Section 11 tables.
- [x] **ANG:** Created `src/app/pages/bundling-assessment/bundling-assessment.component.ts` — two NPA dropdowns, 8-condition pass/fail display, recommendation card, apply button. Created `src/app/services/bundling.service.ts`. Route: `/functions/bundling`.
- [x] **TEST:** Smoke test created — Task 4.2: bundling assess endpoint with 8-condition response

### Task 4.3 — NPA Lite Sub-Types (GAP-014)
- [x] **EXP:** Added B1-B4 sub-type handling to `assignSignoffParties()` in `transitions.js`. When `approval_track = 'NPA_LITE'` and `approval_track_subtype` is set: B1 = 2 SOPs (Compliance + Finance), B2 = 3 SOPs (+ Credit Risk), B3 = 4 SOPs (+ Technology), B4 = full NPA_LITE set. Filters partyMap and ensures mandatory parties exist.
- [x] **DB:** `approval_track_subtype` column included in `database/migrations/003_sprint_3_5_schema.sql`
- [x] **MCP:** Updated `classify_determine_track` in `classification.py` — added `approval_track_subtype` (B1-B4) to schema and handler. Persists to `npa_projects.approval_track_subtype` with graceful fallback.
- [x] **TEST:** Smoke test created — Task 4.3: B1-B4 sub-type SOP assignment (code review verified)

### Task 4.4 — Conditional Approval (GAP-015)
- [x] **EXP:** Created POST `/npas/:id/signoffs/:party/approve-conditional` in `approvals.js` — validates conditions array, updates signoff to APPROVED_CONDITIONAL, saves conditions to `npa_post_launch_conditions`, triggers `checkAllSignoffsComplete`, creates audit log.
- [x] **EXP:** Created GET `/npas/:id/conditions` and PUT `/npas/:id/conditions/:condId` for CRUD on post-launch conditions (supports PENDING/MET/WAIVED/OVERDUE statuses).
- [x] **ANG:** Added "Approve w/ Conditions" teal button to `approval-dashboard.component.ts` (between Sign Off and Rework). Added `approveWithConditions()` method + 3 new methods to `approval.service.ts` (`approveConditional`, `getConditions`, `updateCondition`).
- [x] **TEST:** Smoke test created — Task 4.4: conditional approval + conditions list endpoints

---

## Sprint 5: Evergreen & Advanced Workflows (7-10 Days)

**Gaps Closed:** GAP-009, GAP-016, GAP-018
**Primary Layers:** All 5 layers

### Task 5.1 — Evergreen Product Management (GAP-009)
- [x] **EXP:** Created `server/routes/evergreen.js` with 4 endpoints: GET `/` (all Evergreen products with 30-day utilization + percentage), POST `/:id/record-usage` (records daily metrics to `npa_performance_metrics`, auto-generates breach alerts when volume exceeds approved limit), GET `/:id/utilization` (utilization history for N days), POST `/:id/annual-review` (records annual review completion/flags).
- [x] **EXP:** Registered in `server/index.js` as `app.use('/api/evergreen', evergreenRoutes)`.
- [x] **MCP:** Created `server/mcp-python/tools/evergreen.py` — `evergreen_list`, `evergreen_record_usage` (with limit breach detection), `evergreen_annual_review` tools. Registered in `__init__.py`.
- [x] **ANG:** Created `src/app/pages/evergreen-dashboard/evergreen-dashboard.component.ts` — utilization progress bars, KPI cards (Total Active, Avg Utilization, >80% Utilized, Limit Breaches). Created `src/app/services/evergreen.service.ts`. Route: `/functions/evergreen`.
- [x] **TEST:** Smoke test created — Task 5.1: evergreen product list endpoint

### Task 5.2 — Dispute Resolution (GAP-016)
- [x] **EXP:** Created `server/routes/escalations.js` with 5 endpoints: GET `/` (active escalation queue for COO, sorted by level DESC), GET `/npas/:id` (escalations for specific NPA), POST `/npas/:id/escalate` (creates manual escalation with level lookup from `ref_escalation_rules`, auto-blocks project at level 3+), PUT `/:id/resolve` (resolves escalation, unblocks NPA if no other active escalations, routes to PENDING_SIGN_OFFS or REJECTED based on decision), PUT `/:id/review` (marks as UNDER_REVIEW).
- [x] **EXP:** Registered in `server/index.js` as `app.use('/api/escalations', escalationsRoutes)`.
- [x] **ANG:** Created `src/app/pages/escalation-queue/escalation-queue.component.ts` — tabs (Active/Under Review/Resolved), resolve modal with PROCEED/REJECT, level badges L1-L3. Created `src/app/services/escalation.service.ts`. Route: `/functions/escalations`.
- [x] **TEST:** Smoke test created — Task 5.2: escalation list + per-NPA escalation endpoints

### Task 5.3 — Document Upload (GAP-018)
- [x] **EXP:** Created `server/routes/documents.js` with `multer` middleware. GET `/npas/:id` (list documents), GET `/npas/:id/requirements` (documents vs requirements matrix), POST `/npas/:id/upload` (file upload with type filter, 25MB limit, disk storage under `/uploads/:projectId/`), PUT `/:docId/validate` (update validation status), DELETE `/:docId`. Gracefully degrades if multer not installed (returns 501).
- [x] **EXP:** Installed `multer` package. Registered in `server/index.js` as `app.use('/api/documents', documentsRoutes)`.
- [x] **ANG:** Created `src/app/pages/document-manager/document-manager.component.ts` — file upload (FormData), document type selector, validation status badges, file type icon colors. Created `src/app/services/document.service.ts`. Route: `/functions/documents`.
- [x] **MCP:** Added `doc_lifecycle_validate` tool to `documents.py` — batch-validates all documents for an NPA, updates validation status/notes, returns completeness check.
- [x] **TEST:** Smoke test created — Task 5.3: document list + requirements matrix endpoints

---

## Cross-Cutting: Authentication (Not Sprint-Scoped)

- [x] **EXP:** Created `server/middleware/auth.js` — JWT-based auth with `signToken()`, `authMiddleware()` (non-blocking, parses Bearer token), `requireAuth()` (blocking). Auth routes: POST `/api/auth/login` (by user_id or email), GET `/api/auth/me`. Installed `jsonwebtoken` package.
- [x] **EXP:** Created `server/middleware/rbac.js` — `rbac(...roles)` middleware, `hasMinimumRole()` helper, role hierarchy: ADMIN(5) > COO(4) > APPROVER(3) > CHECKER(2) > MAKER(1).
- [x] **DB:** `users` table already exists with inline `role` column (15 users: 5 MAKER, 2 CHECKER, 7 APPROVER, 1 COO). No separate roles/user_roles tables needed.
- [x] **ANG:** Created login page (`src/app/pages/login/login.component.ts`) — user selection list with role-colored initials, sign-in button. Created `src/app/services/auth.service.ts` (login/logout, localStorage persistence, user$ observable). Created `src/app/interceptors/auth.interceptor.ts` (auto-attaches Bearer token). Wired interceptor in `app.config.ts`. Route: `/login`.

---

## P4 Future: Dormancy, Approximate Booking, Agent Health

### GAP-019 — Dormancy Detection
- [x] **EXP:** Added `checkDormancy()` to `server/jobs/sla-monitor.js` — queries LAUNCHED NPAs with no `npa_performance_metrics` entries in 12 months, flags status as 'Dormant', creates `DORMANCY_DETECTED` audit log entry citing R34. Graceful fallback if metrics table absent.
- [x] **TEST:** Smoke test created — dormancy check wired into SLA monitor

### GAP-020 — Approximate Booking Detection
- [x] **MCP:** Added `detect_approximate_booking` tool (Tool 7) to `server/mcp-python/tools/monitoring.py` — analyzes volume anomalies (>2x approved notional), volume spikes (>3x historical avg), risk check warnings with proxy/booking keywords. Calculates risk score, creates breach alert if HIGH risk. Returns recommendation (escalate/monitor/no action).
- [x] **TEST:** Smoke test created — MCP tool registered (code review verified)

### GAP-022 — Agent Health Monitoring
- [x] **EXP:** Created `server/jobs/agent-health.js` — pings all configured Dify agents every 5 min via `/parameters` endpoint. Tracks per-agent: status (HEALTHY/DEGRADED/TIMEOUT/UNREACHABLE/AUTH_FAILED), latency_ms, failure_count, consecutive_failures, uptime_pct. Parallel health checks with 10s timeout.
- [x] **EXP:** Added `GET /api/dify/agents/health` endpoint in `server/index.js` — returns summary (healthy/degraded/unhealthy/unconfigured counts) + per-agent health metrics.
- [x] **EXP:** Wired `startHealthMonitor(5 * 60 * 1000)` in `server/index.js` listen callback.
- [x] **TEST:** Smoke test created — agent health endpoint returns summary + agents array

---

## ERRORS & DISCREPANCIES LOG

| # | Date | Phase | File/Table | Issue Found | Severity | Resolution | Status |
|---|------|-------|-----------|-------------|----------|------------|--------|
| D-001 | 2026-02-18 | Phase 0.5 | `npa_projects` schema | Column `validity_expiry` referenced in Gap Register does NOT exist in `schema-only.sql`. The Remediation Roadmap Task 3.3 says "set `validity_expiry`" but the column needs to be ADDED. | MEDIUM | Added in `database/migrations/003_sprint_3_5_schema.sql`: `validity_expiry DATE` + `extension_count INT` | CLOSED |
| D-002 | 2026-02-18 | Phase 0.5 | `npa_documents` schema | Column `file_path` referenced in Gap Register does NOT exist. Schema has `file_size`, `file_extension` but no `file_path` for actual file storage location. | LOW | Added in `database/migrations/003_sprint_3_5_schema.sql`: `file_path VARCHAR(500)` | CLOSED |
| D-003 | 2026-02-18 | Phase 0.5 | `ref_escalation_rules` data | Gap Register says "threshold=3 for LOOP_BACK_LIMIT". Actually: Level 2 has threshold=2 (Dept Head review), Level 3 has threshold=3 (GPH circuit breaker), Level 4 has threshold=4 (Group COO). Circuit breaker per GFM SOP is at 3 — matching level 3/GPH. Correct. | INFO | No action needed — data is accurate, just multi-level | CLOSED |
| D-004 | 2026-02-18 | Phase 0.5 | `schema-only.sql` vs `full_export.sql` | `schema-only.sql` has 41 CREATE TABLE statements. `full_export.sql` has 42. One table missing from schema-only dump — likely `npa_approvals` ordering issue or the migration-added table. | LOW | Non-blocking — we use `full_export.sql` for deployment | CLOSED |
| D-005 | 2026-02-18 | Phase 0.5 | `ref_signoff_routing_rules` data | FULL_NPA has 9 parties (includes Tax). But Gap Register R20 says "ALL 7 SOPs." Actually the DB has 9 party rows for FULL_NPA including Tax and Cybersecurity (8 unique party_groups mapped to 9 party rows). This is MORE than the 7 SOPs in the business process. | INFO | No issue — DB is more comprehensive. The 9 parties cover all 7 SOP groups plus Tax and Cybersecurity. | CLOSED |

---

## FILES EDITED LOG

| # | Date | Phase | File Path | Change Description | Lines Changed |
|---|------|-------|-----------|-------------------|---------------|
| 1 | 2026-02-18 | Phase 0 | `Context/2026-02-18/NPA_Business_Process_Deep_Knowledge.md` | Created — 951-line NPA business process report | New file |
| 2 | 2026-02-18 | Phase 0 | `Context/2026-02-18/Action_Plan_Architecture_Gap_Analysis.md` | Created — 5-phase action plan | New file |
| 3 | 2026-02-18 | Phase 0 | `Context/2026-02-18/Architecture_Gap_Register.md` | Created — 44 rules, 22 gaps, 5 observations. Updated with Root Cause Layer per gap + Part D distribution table | New file, then edited |
| 4 | 2026-02-18 | Phase 0 | `Context/2026-02-18/Remediation_Roadmap.md` | Created — 6 sprints with layer-per-task tables. Complete rewrite adding layer legend, heatmap, LOC estimates | New file, then rewritten |
| 5 | 2026-02-18 | Phase 0 | `Context/2026-02-18/Implementation_Checklist.md` | Created — This document | New file |
| 6 | 2026-02-18 | Phase 0 | `Context/2026-02-18/Tech_Rationale_Dify_vs_Express.md` | Created — Tech rationale with Dify docs cross-verification, 57 MCP tools audited, 13 KB files reviewed | New file |
| 7 | 2026-02-18 | Sprint 0 | `server/routes/approvals.js` | Added `checkProhibitedGate()`, `checkPacGate()`, `enforceComplianceGates()`. Applied to signoff decision endpoint. Exported for Sprint 1 reuse. | ~70 lines added |
| 8 | 2026-02-18 | Sprint 0 | `server/routes/governance.js` | Modified POST /classification: NTG→FULL_NPA enforcement, audit log override, persists `approval_track` to `npa_projects` | ~40 lines modified |
| 9 | 2026-02-18 | Sprint 1 | `server/routes/transitions.js` | **NEW FILE** — 9 transition endpoints (submit, checker-approve, checker-return, resubmit, request-rework, final-approve, reject, withdraw, launch). Dynamic SOP assignment, circuit breaker, audit logging. ~470 lines. | New file |
| 10 | 2026-02-18 | Sprint 1 | `server/index.js` | Registered transitions route: `app.use('/api/transitions', transitionsRoutes)` | 2 lines added |
| 11 | 2026-02-18 | Sprint 1 | `server/routes/approvals.js` | Wired `checkAllSignoffsComplete()` into signoff decision endpoint for auto-advance. Added PENDING_CHECKER and ESCALATED to dashboard query. | ~10 lines added |
| 12 | 2026-02-18 | Sprint 2 | `src/app/services/approval.service.ts` | Added 9 transition methods: submitNpa, resubmitNpa, checkerApprove, checkerReturn, requestRework, finalApprove, rejectNpa, withdrawNpa, launchNpa | ~55 lines added |
| 13 | 2026-02-18 | Sprint 2 | `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | Replaced 5 local state mutations with API calls. Added reloadItems(). Updated mapStageToNpaStage with new stages. Removed local checkIfAllSignedOff. Injected ApprovalService. | ~80 lines modified |
| 14 | 2026-02-18 | Sprint 3 | `server/jobs/sla-monitor.js` | **NEW FILE** — SLA breach detection (every 15 min), validity expiry monitoring, breach alert generation with auto-incrementing BR-xxx IDs, severity escalation. ~170 lines. | New file |
| 15 | 2026-02-18 | Sprint 3 | `server/middleware/audit.js` | **NEW FILE** — Reusable `auditLog(opts)` function (supports all npa_audit_log columns + conn param) + `auditMiddleware(prefix)` Express middleware factory. ~120 lines. | New file |
| 16 | 2026-02-18 | Sprint 3 | `server/routes/transitions.js` | Added notional threshold checks to `assignSignoffParties()`: >$20M→ROAE, >$50M→Finance VP, >$100M→CFO (GAP-012). | ~25 lines added |
| 17 | 2026-02-18 | Sprint 3 | `server/index.js` | Imported `startSlaMonitor` from `./jobs/sla-monitor`, registered `startSlaMonitor(15 * 60 * 1000)` in listen callback. | 3 lines added |
| 18 | 2026-02-18 | Sprint 2 | `server/routes/agents.js` | Added 7 agent result persistence endpoints: `/persist/classifier`, `/persist/risk`, `/persist/autofill`, `/persist/ml-predict`, `/persist/governance`, `/persist/doc-lifecycle`, `/persist/monitoring`. Each with upsert logic and audit logging. | ~250 lines added |
| 19 | 2026-02-18 | Sprint 2 | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Replaced `timer()` wave execution with RxJS `concatMap`+`forkJoin` dependency chain: W0(RISK)→W1(CLASSIFIER+ML)→W2(AUTOFILL+GOV)→W3(DOC→MON). Added `waveContext` accumulator, `persistAgentResult()` fire-and-forget method, hard-stop abort. Imported `HttpClient`, `forkJoin`, `EMPTY`, `concatMap`, `tap`. | ~120 lines modified |
| 20 | 2026-02-18 | Sprint 3 | `server/jobs/sla-monitor.js` | Added `checkPirOverdue()` — marks PIR as OVERDUE when past due date. Integrated into `runSlaMonitor()`. | ~30 lines added |
| 21 | 2026-02-18 | Sprint 4 | `server/routes/pir.js` | **NEW FILE** — PIR workflow: GET `/pending`, GET `/:id`, POST `/:id/submit`, POST `/:id/approve`, POST `/:id/extend`. ~140 lines. | New file |
| 22 | 2026-02-18 | Sprint 4 | `server/routes/bundling.js` | **NEW FILE** — 8-condition bundling assessment engine: GET `/:id/assess`, POST `/:id/apply`. Checks parent product, category match, risk types, notional limits, booking entity, jurisdictions, counterparty, ops capacity. ~140 lines. | New file |
| 23 | 2026-02-18 | Sprint 4 | `server/routes/transitions.js` | Added NPA Lite B1-B4 sub-type handling to `assignSignoffParties()`. Filters partyMap based on subtype, ensures mandatory parties exist. | ~30 lines added |
| 24 | 2026-02-18 | Sprint 4 | `server/routes/approvals.js` | Added conditional approval endpoint (POST `/approve-conditional`), conditions CRUD (GET + PUT `/conditions`). ~80 lines. | ~80 lines added |
| 25 | 2026-02-18 | Sprint 4+5 | `server/index.js` | Registered PIR, bundling, evergreen, escalations, documents routes. | 8 lines added |
| 26 | 2026-02-18 | Sprint 5 | `server/routes/evergreen.js` | **NEW FILE** — Evergreen product management: listing with utilization, usage recording with limit breach detection, utilization history, annual review. ~170 lines. | New file |
| 27 | 2026-02-18 | Sprint 5 | `server/routes/escalations.js` | **NEW FILE** — Dispute resolution/escalation queue: list active, per-NPA, manual escalation, resolve with decision routing, mark under review. ~140 lines. | New file |
| 28 | 2026-02-18 | Sprint 5 | `server/routes/documents.js` | **NEW FILE** — Document upload with multer: list, requirements matrix, file upload (25MB, type filter), validation status update, delete. Graceful degradation without multer. ~190 lines. | New file |

---

## QUICK REFERENCE: Gap → Sprint → Task Mapping

| Gap | Priority | Sprint | Task | Status |
|-----|----------|--------|------|--------|
| GAP-001 | P0 | Sprint 0 | Task 0.1 | EXP DONE, ANG Sprint 2 |
| GAP-002 | P0 | Sprint 0 | Task 0.2 | EXP+ANG DONE |
| GAP-003 | P0 | Sprint 0 | Task 0.3 | EXP+MCP DONE |
| GAP-004 | P1 | Sprint 1 | Task 1.2 | EXP+MCP DONE |
| GAP-005 | P1 | Sprint 1 | Task 1.3 | EXP+ANG DONE |
| GAP-006 | P1 | Sprint 3 | Task 3.1 | EXP DONE |
| GAP-007 | P1 | Sprint 1 | Task 1.4 | EXP+ANG DONE |
| GAP-008 | P2 | Sprint 4 | Task 4.2 | EXP+MCP+ANG+DIFY DONE |
| GAP-009 | P2 | Sprint 5 | Task 5.1 | EXP+MCP+ANG DONE |
| GAP-010 | P2 | Sprint 3 | Task 3.3 | EXP+DB DONE |
| GAP-011 | P2 | Sprint 4 | Task 4.1 | EXP+ANG DONE |
| GAP-012 | P2 | Sprint 3 | Task 3.2 | EXP+MCP DONE |
| GAP-013 | P2 | Sprint 1 | Task 1.1 | EXP+ANG DONE |
| GAP-014 | P3 | Sprint 4 | Task 4.3 | EXP+DB+MCP DONE |
| GAP-015 | P3 | Sprint 4 | Task 4.4 | EXP+ANG DONE |
| GAP-016 | P3 | Sprint 5 | Task 5.2 | EXP+ANG DONE |
| GAP-017 | P3 | Sprint 3 | Task 3.4 | EXP DONE (wired into 13 routes) |
| GAP-018 | P3 | Sprint 5 | Task 5.3 | EXP+MCP+ANG DONE |
| GAP-019 | P4 | P4 | Dormancy Detection | EXP DONE (sla-monitor checkDormancy) |
| GAP-020 | P4 | P4 | Approx Booking | MCP DONE (detect_approximate_booking) |
| GAP-021 | P4 | Sprint 1 | Task 1.2 | CLOSED (wired in Sprint 1 assignSignoffParties) |
| GAP-022 | P4 | P4 | Agent Health | EXP DONE (agent-health job + endpoint) |

| 29 | 2026-02-18 | Angular | `src/app/services/escalation.service.ts` | **NEW FILE** — Escalation API service: getActive, getByNpa, escalate, resolve, markUnderReview | New file |
| 30 | 2026-02-18 | Angular | `src/app/services/pir.service.ts` | **NEW FILE** — PIR API service: getPending, getDetail, submit, approve, extend | New file |
| 31 | 2026-02-18 | Angular | `src/app/services/evergreen.service.ts` | **NEW FILE** — Evergreen API service: getAll, getUtilization, recordUsage, annualReview | New file |
| 32 | 2026-02-18 | Angular | `src/app/services/bundling.service.ts` | **NEW FILE** — Bundling API service: assess, apply | New file |
| 33 | 2026-02-18 | Angular | `src/app/services/document.service.ts` | **NEW FILE** — Document API service: getByNpa, getRequirementsMatrix, upload (FormData), validate, delete | New file |
| 34 | 2026-02-18 | Angular | `src/app/pages/escalation-queue/escalation-queue.component.ts` | **NEW FILE** — Escalation queue with tabs, resolve modal, level badges | New file |
| 35 | 2026-02-18 | Angular | `src/app/pages/pir-management/pir-management.component.ts` | **NEW FILE** — PIR management table with KPI strip, submit/approve/extend | New file |
| 36 | 2026-02-18 | Angular | `src/app/pages/evergreen-dashboard/evergreen-dashboard.component.ts` | **NEW FILE** — Evergreen products with utilization bars, KPI cards | New file |
| 37 | 2026-02-18 | Angular | `src/app/pages/bundling-assessment/bundling-assessment.component.ts` | **NEW FILE** — 8-condition bundling assessment with NPA selection, recommendation card | New file |
| 38 | 2026-02-18 | Angular | `src/app/pages/document-manager/document-manager.component.ts` | **NEW FILE** — Document upload/management with file type icons, validation status | New file |
| 39 | 2026-02-18 | Angular | `src/app/app.routes.ts` | Added 5 lazy-loaded routes: escalations, pir, evergreen, bundling, documents | 15 lines added |
| 40 | 2026-02-18 | Angular | `src/app/components/layout/app-sidebar/app-sidebar.ts` | Added 6 sidebar navigation links for new pages | ~30 lines added |
| 41 | 2026-02-18 | Angular | `src/app/services/approval.service.ts` | Added 3 conditional approval methods: approveConditional, getConditions, updateCondition | ~20 lines added |
| 42 | 2026-02-18 | Angular | `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | Added "Approve w/ Conditions" button + approveWithConditions() method | ~25 lines added |
| 43 | 2026-02-18 | Sprint 3 | `server/routes/transitions.js` | Added validity_expiry to final-approve + POST /:id/extend-validity endpoint | ~60 lines added |
| 44 | 2026-02-18 | Sprint 3 | `database/migrations/003_sprint_3_5_schema.sql` | **NEW FILE** — D-001 (validity_expiry, extension_count), D-002 (file_path), GAP-014 (approval_track_subtype), predicted_* columns | New file |
| 45 | 2026-02-18 | Sprint 3 | `server/index.js` | Wired auditMiddleware into 13 route modules (GOV, NPA, APPROVAL, etc.) | ~20 lines modified |
| 46 | 2026-02-18 | MCP | `server/mcp-python/tools/bundling.py` | **NEW FILE** — bundling_assess (8-condition check) + bundling_apply MCP tools | New file |
| 47 | 2026-02-18 | MCP | `server/mcp-python/tools/evergreen.py` | **NEW FILE** — evergreen_list, evergreen_record_usage, evergreen_annual_review MCP tools | New file |
| 48 | 2026-02-18 | MCP | `server/mcp-python/tools/__init__.py` | Added bundling + evergreen imports | 2 lines added |
| 49 | 2026-02-18 | MCP | `server/mcp-python/tools/classification.py` | Updated `classify_determine_track` — NTG→FULL_NPA belt-and-suspenders guard with audit logging | ~25 lines added |
| 50 | 2026-02-18 | MCP | `server/mcp-python/tools/governance.py` | Updated `governance_create_signoff_matrix` — notional threshold checks (>$20M ROAE, >$50M Finance VP, >$100M CFO) | ~30 lines added |
| 51 | 2026-02-18 | MCP | `server/mcp-python/tools/classification.py` | Updated `classify_determine_track` — added `approval_track_subtype` (B1-B4) schema field, persistence with graceful fallback | ~20 lines added |
| 52 | 2026-02-18 | MCP | `server/mcp-python/tools/documents.py` | Added `doc_lifecycle_validate` tool (Tool 5) — batch-validates all documents for an NPA, returns completeness check | ~60 lines added |
| 53 | 2026-02-18 | Angular | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Added PAC Status indicator badge in header — green/amber/red, `isNtg`/`pacStatus`/`pacBlocked` computed properties | ~20 lines added |
| 54 | 2026-02-18 | Auth | `server/middleware/auth.js` | **NEW FILE** — JWT auth: signToken, authMiddleware (non-blocking), requireAuth (blocking), login/me routes. ~100 lines. | New file |
| 55 | 2026-02-18 | Auth | `server/middleware/rbac.js` | **NEW FILE** — RBAC middleware: rbac(), hasMinimumRole(), ROLE_HIERARCHY (ADMIN>COO>APPROVER>CHECKER>MAKER). ~40 lines. | New file |
| 56 | 2026-02-18 | Auth | `server/index.js` | Added global authMiddleware(), auth routes, jsonwebtoken dependency | ~5 lines added |
| 57 | 2026-02-18 | Auth | `src/app/services/auth.service.ts` | **NEW FILE** — AuthService: login/logout, localStorage, BehaviorSubject user$, token getter | New file |
| 58 | 2026-02-18 | Auth | `src/app/interceptors/auth.interceptor.ts` | **NEW FILE** — HttpInterceptorFn: auto-attaches Bearer token to /api requests | New file |
| 59 | 2026-02-18 | Auth | `src/app/pages/login/login.component.ts` | **NEW FILE** — User selection login page with role-colored initials, dark gradient background | New file |
| 60 | 2026-02-18 | Auth | `src/app/app.config.ts` | Added withInterceptors([authInterceptor]) to provideHttpClient | ~3 lines modified |
| 61 | 2026-02-18 | Auth | `src/app/app.routes.ts` | Added /login route (lazy-loaded) | 3 lines added |
| 62 | 2026-02-18 | DIFY | `Context/Dify_Agent_KBs/KB_Classification_Agent.md` | Updated Bundling Override 3: added 8-condition eligibility assessment, updated Branch 8 decision tree, added eligibility table in Section 11 | ~60 lines added |
| 63 | 2026-02-19 | TEST | `server/tests/smoke-test.js` | **NEW FILE** — Comprehensive API smoke test suite covering all 15 TEST items. Uses Node.js `node:test` (zero deps). 30+ test cases across auth, compliance gates, transitions, SOP, circuit breaker, agent persist, SLA, bundling, PIR, evergreen, escalations, documents. | New file |
| 64 | 2026-02-19 | TEST | `server/package.json` | Updated test script: `node --test tests/smoke-test.js` | 1 line modified |
| 65 | 2026-02-19 | P4 | `server/jobs/sla-monitor.js` | Added `checkDormancy()` — GAP-019: flags LAUNCHED NPAs with no metrics in 12 months as Dormant, audit log. Wired into `runSlaMonitor()`. | ~50 lines added |
| 66 | 2026-02-19 | P4 | `server/jobs/agent-health.js` | **NEW FILE** — GAP-022: Agent health monitor. Pings all Dify agents every 5 min, tracks latency/uptime/status per agent. ~160 lines. | New file |
| 67 | 2026-02-19 | P4 | `server/index.js` | Added agent-health import, GET `/api/dify/agents/health` endpoint, `startHealthMonitor()` in listen callback | ~8 lines added |
| 68 | 2026-02-19 | P4 | `server/mcp-python/tools/monitoring.py` | Added `detect_approximate_booking` tool (Tool 7) — GAP-020: proxy trade detection via volume anomalies, notional outliers, risk check warnings. ~120 lines. | ~120 lines added |
| 69 | 2026-02-19 | TEST | `server/tests/smoke-test.js` | Added 3 P4 test cases: dormancy detection, approximate booking MCP tool, agent health endpoint | ~30 lines added |

---

*Last updated: 2026-02-19 — ALL 22/22 GAPS COMPLETE. 6 Sprints (0-5) + P4 Future — Express API, Angular UI, MCP Tools, DIFY KB, Auth, DB Migration, Agent Health, Dormancy Detection, Approximate Booking — ALL DONE. Smoke test suite: 18 test groups, 35+ test cases. 69 files edited. All discrepancies (D-001–D-005) CLOSED. Run tests: `cd server && npm test` (requires running server + database).*
