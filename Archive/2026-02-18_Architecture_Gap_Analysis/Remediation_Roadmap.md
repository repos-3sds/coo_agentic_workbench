# Remediation Roadmap
## Closing the Architecture Gaps — Phased Implementation Plan

**Date:** 2026-02-18
**Input:** Architecture Gap Register (22 gaps, 44 business rules tested, root cause layer traced per gap)
**Principle:** Fix compliance blockers first, then core workflow, then enhancements
**Key Finding:** Express API is the bottleneck in 17 of 22 gaps — pure CRUD passthrough with zero business rule enforcement

---

## Layer Legend

| Abbrev | Layer | Location | Role |
|--------|-------|----------|------|
| **EXP** | Express API | `server/routes/*.js`, `server/index.js` | Backend HTTP endpoints, middleware, scheduled jobs |
| **ANG** | Angular UI | `src/app/pages/**/*.ts` | Frontend components, state management, wave execution |
| **MCP** | MCP Tools | `server/mcp-python/tools/*.py` (Railway) | Python FastMCP tools called by Dify agents for DB operations |
| **DIFY** | Dify Prompts | `Context/Dify_Agent_KBs/KB_*.md` (synced to Dify Cloud) | LLM agent system prompts and workflow configs |
| **DB** | Database Schema | Railway MariaDB (41 tables) | Schema, reference data, constraints |

---

## Sprint Overview

| Sprint | Duration | Focus | Gaps Closed | Primary Layers Touched | Business Impact |
|--------|----------|-------|-------------|----------------------|----------------|
| **Sprint 0** | 1-2 days | P0 Compliance Blockers | GAP-001, 002, 003 | EXP, ANG | Prevent regulatory violations |
| **Sprint 1** | 3-5 days | Core State Machine & Persistence | GAP-004, 005, 007, 013 | EXP, ANG, MCP | Working approval workflow end-to-end |
| **Sprint 2** | 3-5 days | Agent Write-Back & Wave Reorder | Obs 1, Obs 4 | ANG, EXP | Agent decisions persist and chain correctly |
| **Sprint 3** | 3-5 days | SLA, Thresholds & Monitoring | GAP-006, 010, 012, 017 | EXP, MCP | Automated compliance monitoring |
| **Sprint 4** | 5-7 days | PIR, Bundling & Conditional Approvals | GAP-008, 011, 014, 015 | DB, EXP, MCP, DIFY, ANG | Full lifecycle coverage |
| **Sprint 5** | 7-10 days | Evergreen & Advanced Workflows | GAP-009, 016, 018 | DB, EXP, MCP, DIFY, ANG | Competitive advantage features |

**Total: ~25-35 days of focused work**

---

## Sprint 0: Compliance Blockers (1-2 Days)

> **Goal:** Eliminate regulatory risk. After this sprint, prohibited products cannot proceed, NTG products cannot skip PAC, and NTG always routes to Full NPA.

### Task 0.1 — Enforce Prohibited Hard Stop (GAP-001)

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Reorder wave execution: RISK → Wave 0 (t=0), CLASSIFIER → Wave 1 (t=after RISK completes). If RISK returns `hardStop: true`, abort all subsequent waves and disable all action buttons. |
| **EXP** | `server/routes/approvals.js` | Add middleware guard before ANY stage transition endpoint: query `npa_risk_checks WHERE project_id = :id AND result = 'FAIL'`. If any FAIL exists → reject with 403 "Prohibited product cannot proceed". |
| **MCP** | No change needed | `classify_determine_track` already correctly sets `stage=PROHIBITED, status=STOPPED`. This part works. |

**Why this ordering matters:** The MCP tool does the right thing. The Express API just doesn't enforce it. The Angular UI shows it too late. Fix the gate + the wave order.

### Task 0.2 — PAC Gate for NTG (GAP-002)

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/approvals.js` (or new `transitions.js`) | In submit/transition logic: if `npa_type = 'New-to-Group'` AND `pac_approval_status != 'Approved'` → return 400 "PAC approval required before NPA can proceed for New-to-Group products" |
| **ANG** | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Add "PAC Status" indicator in NPA Detail header (green check if approved, red block if pending/missing). Disable submit button when PAC not approved for NTG. |
| **DB** | No change needed | `pac_approval_status` column already exists in `npa_projects`. Schema is correct. |

### Task 0.3 — NTG→Full NPA Lock (GAP-003)

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/governance.js` | In POST /classification endpoint: if `npa_type = 'New-to-Group'`, force `approval_track = 'FULL_NPA'` regardless of CLASSIFIER output. Log override in `npa_audit_log` with reason "NTG auto-override to FULL_NPA per Standard §2.1.1". |
| **MCP** | `server/mcp-python/tools/classification.py` (`classify_determine_track`) | Add deterministic guard: if `npa_type == 'New-to-Group'`, override `approval_track` to `FULL_NPA` before DB write. Belt-and-suspenders with Express. |
| **DIFY** | No change needed | Prompt already instructs FULL_NPA for NTG. The issue is lack of deterministic enforcement, not prompt content. |

---

## Sprint 1: Core State Machine & Persistence (3-5 Days)

> **Goal:** Approval workflow works end-to-end with server-side state transitions, dynamic SOP assignment, and circuit breaker. This sprint eliminates the SINGLE BIGGEST ARCHITECTURAL GAP: the frontend-only state machine.

### Task 1.1 — Server-Side Stage Transitions (GAP-013)

**Root Cause:** `approval-dashboard.component.ts` lines 460-564 — `submit()`, `approve()`, `requestRework()`, `finalApprove()`, `checkIfAllSignedOff()` ALL update LOCAL COMPONENT STATE ONLY. No API calls. Express API has no transition endpoints.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | New `server/routes/transitions.js` | Create dedicated endpoints with validation guards (see table below) |
| **ANG** | `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | Replace local state mutations with HTTP calls to new transition endpoints. Remove `submit()`, `approve()`, `requestRework()`, `finalApprove()` local logic — replace with service calls. |
| **ANG** | `src/app/services/approval.service.ts` | Add methods: `submitNpa(id)`, `checkerApprove(id)`, `requestRework(id, reason)`, `finalApprove(id)` that call new Express endpoints. |

**Transition Endpoints:**

| Endpoint | From Stage | To Stage | Guards |
|----------|-----------|----------|--------|
| `POST /api/npas/:id/submit` | DRAFT | PENDING_CHECKER | Must have title, description; if NTG, PAC approved; if PROHIBITED, reject |
| `POST /api/npas/:id/checker-approve` | PENDING_CHECKER | PENDING_SIGN_OFFS | Assign SOPs dynamically (Task 1.2) |
| `POST /api/npas/:id/checker-return` | PENDING_CHECKER | RETURNED_TO_MAKER | Reason required |
| `POST /api/npas/:id/resubmit` | RETURNED_TO_MAKER | PENDING_SIGN_OFFS | Reset returned SOPs to PENDING |
| `POST /api/npas/:id/request-rework` | PENDING_SIGN_OFFS | RETURNED_TO_MAKER | Party + reason; increment loop_back; circuit breaker check (Task 1.3) |
| `POST /api/npas/:id/final-approve` | PENDING_FINAL_APPROVAL | APPROVED | Verify all SOPs = APPROVED/APPROVED_CONDITIONAL; set validity_expiry |
| `POST /api/npas/:id/reject` | any (except terminal) | REJECTED | Reason required |

Each endpoint:
- Validates `current_stage` matches expected FROM state (prevents race conditions)
- Uses DB transaction (`BEGIN...COMMIT`)
- Creates `npa_audit_log` entry (Task 3.4 helper)
- Returns updated NPA object
- Includes Sprint 0 guards (prohibited check, PAC gate, NTG→FULL_NPA)

### Task 1.2 — Dynamic SOP Assignment (GAP-004)

**Root Cause:** `ref_signoff_routing_rules` table is populated but never queried. MCP tool `get_signoff_routing_rules` exists but Dify GOVERNANCE prompt never invokes it. `governance_create_signoff_matrix` creates signoffs with hardcoded list.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` (inside `checker-approve`) | New function `assignSignoffParties(projectId)` that queries `ref_signoff_routing_rules` |
| **MCP** | `server/mcp-python/tools/governance.py` (`governance_create_signoff_matrix`) | Update to read `ref_signoff_routing_rules` filtered by `approval_track`, apply cross-border and NTG-overseas overrides |
| **DB** | No change needed | `ref_signoff_routing_rules` already populated with per-track routing data |

```
function assignSignoffParties(projectId):
  1. Read npa_projects: get approval_track, is_cross_border, npa_type, jurisdictions
  2. Query ref_signoff_routing_rules WHERE approval_track = :track AND is_mandatory = true
  3. If is_cross_border: force-add Finance, Credit, MLR, Tech, Ops (if not already)
  4. If NTG + any non-SG jurisdiction: force-add Head Office parties
  5. Check notional thresholds (>$20M→ROAE, >$50M→Finance VP, >$100M→CFO) — prep for Sprint 3
  6. Delete existing npa_signoffs for this project
  7. Insert new npa_signoffs rows with PENDING status and sla_deadline = NOW() + sla_hours
```

Wire this into `checker-approve` transition (Task 1.1).

### Task 1.3 — Circuit Breaker (GAP-005)

**Root Cause:** `approval-dashboard.component.ts` `requestRework()` (line ~498) increments `loop_back_count` locally but never checks threshold. `ref_escalation_rules` has `threshold=3` but Express API has no endpoint that reads it. `npa_escalations` table is empty.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` (inside `request-rework`) | Read `ref_escalation_rules` WHERE `trigger_type = 'LOOP_BACK_LIMIT'`. After incrementing loop_back_count, if count >= threshold → insert `npa_escalations`, set stage = 'ESCALATED'. |
| **ANG** | `approval-dashboard.component.ts` | Remove local loop_back_count increment. Call server endpoint instead. Handle ESCALATED stage in UI (show escalation notice, disable normal actions). |
| **DB** | No change needed | `ref_escalation_rules` (threshold=3, level=4), `npa_escalations`, `npa_loop_backs` all exist with correct schema. |

```
In request-rework endpoint:
1. Increment loop_back_count on the signoff row
2. Insert npa_loop_backs row (loop_back_type, reason, requested_by)
3. Query: SELECT MAX(loop_back_count) FROM npa_signoffs WHERE project_id = :id
4. Query: SELECT threshold FROM ref_escalation_rules WHERE trigger_type = 'LOOP_BACK_LIMIT'
5. If max >= threshold:
   - Insert npa_escalations (trigger_type: 'LOOP_BACK_LIMIT', escalation_level: 4)
   - Set current_stage = 'ESCALATED'
   - Return 200 with escalation notice
6. Else: set current_stage = 'RETURNED_TO_MAKER'
```

### Task 1.4 — Add Missing Stage Values (GAP-007)

**Root Cause:** `approval-dashboard.component.ts` `mapStageToNpaStage()` only handles 13 stage values. Express has no endpoints for withdraw, launch, expire transitions.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` | Add endpoints: `POST /withdraw` (DRAFT/RETURNED→WITHDRAWN), `POST /launch` (APPROVED→LAUNCHED, sets launched_at + pir_due_date) |
| **ANG** | `approval-dashboard.component.ts` | Update `mapStageToNpaStage()` to handle: ESCALATED, WITHDRAWN, PIR_REQUIRED, EXPIRED |
| **DB** | No change needed | `current_stage` is VARCHAR — accepts any value. No schema change. |

New stage vocabulary:
- `ESCALATED` — Circuit breaker triggered (from Task 1.3)
- `WITHDRAWN` — Maker voluntary withdrawal
- `PIR_REQUIRED` — Post-launch, PIR due (from Sprint 4)
- `EXPIRED` — Validity period ended (from Sprint 3)

---

## Sprint 2: Agent Write-Back & Wave Reorder (3-5 Days)

> **Goal:** Agent decisions persist to DB automatically. Wave order respects dependency chain. Fixes Observation 1 (Display-Only Agents) and Observation 4 (No Dependency Awareness).

### Task 2.1 — Agent Result Persistence (Obs 1)

**Root Cause:** `npa-detail.component.ts` `handleAgentResult()` maps outputs to COMPONENT PROPERTIES ONLY. No API call to persist. Agent results lost on page navigation. MCP tools DO have write capabilities but Angular doesn't trigger them post-wave.

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | After each wave completes, call persist endpoint for that agent's results |
| **EXP** | Multiple route files or new `server/routes/agent-results.js` | Create/verify persist endpoints for each agent type |
| **MCP** | Various tools in `server/mcp-python/tools/` | Verify MCP tools already persist (some do via Dify calls). Gap is Angular→Express, not MCP. |

**Auto-persist mapping:**

| Agent | Persist To | Endpoint | Layer Gap |
|-------|-----------|----------|-----------|
| CLASSIFIER | `npa_projects.npa_type`, `approval_track`, `classification_confidence`; `npa_classification_scorecards` | `POST /api/classification/npas/:id` | **EXP** — `governance.js` has this endpoint but Angular doesn't call it after wave completion |
| RISK | `npa_risk_checks` rows (one per layer) | `POST /api/risk-checks/npas/:id` | **EXP** — endpoint may need creation |
| AUTOFILL | `npa_form_data` rows (lineage=AUTO, confidence_score set) | `PUT /api/npas/:id/form-data/batch` | **EXP** — endpoint exists but Angular doesn't call it post-wave |
| GOVERNANCE | `npa_signoffs` (only if track already determined) | `PUT /api/approvals/npas/:id/signoffs/batch` | **EXP** — endpoint may need creation |
| DOC_LIFECYCLE | `npa_documents.validation_status` | `PUT /api/npas/:id/documents/validate` | **EXP** — new endpoint |
| MONITORING | `npa_performance_metrics`, `npa_breach_alerts` | `PUT /api/monitoring/npas/:id/metrics` | **EXP** — new endpoint |
| ML_PREDICT | `npa_projects.predicted_*` columns | `PUT /api/npas/:id/predictions` | **EXP** — new endpoint |

### Task 2.2 — Wave Dependency Chain (Obs 4)

**Root Cause:** `npa-detail.component.ts` fires waves on fixed `setTimeout` timers (0ms, 2000ms, 4000ms). `dify.service.ts` `runWorkflow()` sends the same static payload to all agents regardless of what prior agents returned.

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Replace `setTimeout` with RxJS `concatMap`/`switchMap`. Implement dependency-aware wave chain. |
| **ANG** | `src/app/services/dify.service.ts` | Modify `runWorkflow()` to accept accumulated context parameter from prior waves |

Reordered waves:

```
Wave 0 (t=0):       RISK (prohibited check — must complete before anything)
                     ↓ If hardStop → abort all subsequent waves

Wave 1 (t=after W0): CLASSIFIER + ML_PREDICT
                     ↓ CLASSIFIER result needed for Wave 2

Wave 2 (t=after W1): AUTOFILL (needs classification for template)
                      GOVERNANCE (needs classification for SOP assignment)

Wave 3 (t=after W2): DOC_LIFECYCLE, MONITORING
```

### Task 2.3 — Pass Agent Outputs Between Waves

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `dify.service.ts`, `npa-detail.component.ts` | Accumulate results from completed waves, pass as context to subsequent waves |

Currently all agents receive the same static inputs. After reorder:
- Wave 1 agents receive: `product_description` + `risk_check_result` (from Wave 0)
- Wave 2 agents receive: `product_description` + `classification_result` + `ml_prediction`
- Wave 3 agents receive: all prior results

---

## Sprint 3: SLA, Thresholds & Monitoring (3-5 Days)

> **Goal:** Automated compliance monitoring — SLA tracking, notional thresholds, validity management, audit logging. All changes in this sprint are Express API + scheduled jobs.

### Task 3.1 — SLA Monitoring (GAP-006)

**Root Cause:** Express `server/index.js` has no scheduled jobs. `sla_deadline` in `npa_signoffs` only set by seed-demo. `npa_breach_alerts` table exists but never written to.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | New `server/jobs/sla-monitor.js` | Scheduled job: every 15 min, check signoffs for SLA breach |
| **EXP** | `server/index.js` | Register SLA monitor job via `setInterval` or `node-cron` |
| **EXP** | `server/routes/transitions.js` (Task 1.2) | When signoffs created, set `sla_deadline = NOW() + sla_hours` (from `ref_signoff_routing_rules`) |
| **DB** | No change needed | `npa_signoffs.sla_deadline`, `sla_breached` + `npa_breach_alerts` table all exist |

```
SLA Monitor Job (every 15 minutes):
  1. Query npa_signoffs WHERE status = 'PENDING' AND sla_deadline IS NOT NULL
  2. For each:
     - If NOW() > sla_deadline AND sla_breached = false:
       - Set sla_breached = true
       - Insert npa_breach_alerts (severity: 'WARNING', title: 'SLA Breach: {party}')
     - If NOW() > sla_deadline + 24 hours:
       - Insert npa_escalations (trigger_type: 'SLA_BREACH')
```

### Task 3.2 — Notional Threshold Checks (GAP-012)

**Root Cause:** `governance_create_signoff_matrix` MCP tool doesn't check `notional_amount`. Express has no threshold validation. Thresholds aren't even stored as config.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` (`assignSignoffParties` from Task 1.2) | Add notional threshold checks |
| **MCP** | `server/mcp-python/tools/governance.py` | Update `governance_create_signoff_matrix` to check notional thresholds |
| **DB** | Optional: new `ref_notional_thresholds` table | Store thresholds as config rather than hardcoded |

```javascript
// Add to assignSignoffParties():
const notional = project.notional_amount;
if (notional > 20000000) flagRequiredDocument('ROAE_SENSITIVITY');
if (notional > 50000000) addSignoffParty('Finance VP');
if (notional > 100000000) addSignoffParty('CFO');
```

### Task 3.3 — Validity Expiry Management (GAP-010)

**Root Cause:** Express has no `final-approve` transition that sets `validity_expiry`. No scheduled job checks expiry dates. No extension endpoint.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` (inside `final-approve`) | Set `validity_expiry = NOW() + INTERVAL 1 YEAR` on approval |
| **EXP** | New `server/jobs/validity-monitor.js` | Daily: check expiry-30d→warn, expiry-0d→expire |
| **EXP** | `server/routes/transitions.js` | New endpoint: `POST /api/npas/:id/extend` (requires all original SOP consent) |
| **DB** | Add `extension_count` column to `npa_projects` | Track one-time extension allowance |

### Task 3.4 — Audit Logging Middleware (GAP-017)

**Root Cause:** Express routes never write to `npa_audit_log`. No reusable audit helper. Some MCP tools (e.g., `classify_determine_track`) create their own audit entries, but Express doesn't.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | New `server/middleware/audit.js` | Reusable helper function |
| **EXP** | All route files (`transitions.js`, `approvals.js`, `governance.js`, `npas.js`) | Call `auditLog()` in every transition, sign-off decision, document upload, agent action |
| **DB** | No change needed | `npa_audit_log` has rich schema (confidence_score, reasoning, citations). Ready. |

```javascript
async function auditLog(projectId, actorName, actionType, details, isAgent = false) {
  await pool.query(
    'INSERT INTO npa_audit_log (project_id, action_type, actor_name, is_agent_action, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [projectId, actionType, actorName, isAgent, JSON.stringify(details)]
  );
}
```

Call in every transition endpoint, sign-off decision, document upload, and agent action.

---

## Sprint 4: PIR, Bundling & Conditional Approvals (5-7 Days)

> **Goal:** Post-launch review workflow, bundling condition checking, NPA Lite sub-types, and conditional approval mechanism. This sprint requires ALL layers.

### Task 4.1 — PIR Workflow (GAP-011)

**Root Cause:** Express has no `launch` endpoint to auto-set `pir_due_date`. No scheduled job for PIR reminders. Angular has no PIR UI. DB columns exist but are unused.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/transitions.js` (inside `launch`) | Auto-set `pir_status = 'PENDING'`, `pir_due_date = launched_at + 6 months`. Create `npa_post_launch_conditions` from SOP conditions. |
| **EXP** | New `server/jobs/pir-monitor.js` | Daily: check pir_due_date−30d→remind, pir_due_date<NOW()→escalate |
| **EXP** | `server/routes/transitions.js` | New endpoints: `POST /api/npas/:id/pir-submit`, `POST /api/npas/:id/pir-approve` |
| **ANG** | New PIR components | PIR submission page, PIR sign-off flow, condition resolution UI |
| **DB** | No change needed | `pir_status`, `pir_due_date` columns exist. `npa_post_launch_conditions` table exists. |

### Task 4.2 — Bundling Framework (GAP-008)

**Root Cause:** ALL LAYERS MISSING. No DB tables, no MCP tools, no Dify prompt, no Express endpoints, no Angular UI.

| Layer | File | Change |
|-------|------|--------|
| **DB** | Schema migration | Create `ref_bundling_conditions` (8 rows), `ref_approved_bundles` (pre-approved: DCD, Treasury Asset Swap, ELN, 28 FX), `npa_bundling_assessments` |
| **MCP** | New `server/mcp-python/tools/bundling.py` | New tools: `check_bundling_conditions`, `get_approved_bundles`, `create_bundling_assessment` |
| **DIFY** | Update `KB_Classification_Agent.md` or new bundling KB | Add 8-condition checklist logic, routing rules for arbitration team |
| **EXP** | New `server/routes/bundling.js` | Bundling assessment endpoints |
| **ANG** | New bundling condition UI | 8-condition checklist display, arbitration team routing UI |

**Workflow:**
1. CLASSIFIER detects bundling → check if in `ref_approved_bundles` → if yes, Bundling Approval (light)
2. If not pre-approved: evaluate 8 conditions via MCP tool
3. All pass → route to Arbitration Team. Any fail → escalate to Full NPA or NPA Lite

### Task 4.3 — NPA Lite Sub-Types (GAP-014)

**Root Cause:** DB has no sub-type column. Dify CLASSIFIER doesn't output sub-type. MCP `classify_determine_track` has no sub-type field.

| Layer | File | Change |
|-------|------|--------|
| **DB** | Schema migration | Add `approval_track_subtype` column to `npa_projects` |
| **MCP** | `server/mcp-python/tools/classification.py` | Update `classify_determine_track` to accept and persist sub-type |
| **DIFY** | `Context/Dify_Agent_KBs/KB_Classification_Agent.md` | Add sub-type classification instructions for NPA Lite B1-B4 |
| **EXP** | `server/routes/governance.js`, `transitions.js` | Wire sub-type into SOP assignment logic (each sub-type has different SOP requirements and timelines) |

Values: `IMPENDING_DEAL` (B1), `NLNOC` (B2), `FAST_TRACK_DORMANT` (B3), `ADDENDUM` (B4)

### Task 4.4 — Conditional Approval UI (GAP-015)

**Root Cause:** Angular UI only — TypeScript type `APPROVED_CONDITIONAL` is defined, DB supports it, but no UI button triggers it.

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | Add "Approve with Conditions" button alongside "Approve" in sign-off UI |
| **ANG** | New condition entry modal component | Fields: condition_text, due_date, owner_party. Persist to `npa_post_launch_conditions`. |
| **EXP** | `server/routes/approvals.js` | Endpoint to create post-launch conditions during sign-off |
| **DB** | No change needed | `npa_post_launch_conditions` table exists with correct schema. `npa_signoffs.decision` accepts `APPROVED_CONDITIONAL`. |

---

## Sprint 5: Evergreen & Advanced Workflows (7-10 Days)

> **Goal:** Evergreen product management (the competitive advantage), dispute resolution, document management. ALL layers involved.

### Task 5.1 — Evergreen Product Management (GAP-009)

**Root Cause:** ALL LAYERS MISSING. No DB tables, no MCP tools, no Dify prompt, no Express endpoints, no Angular UI.

| Layer | File | Change |
|-------|------|--------|
| **DB** | Schema migration | Create `ref_evergreen_products`, `npa_evergreen_usage` tables (see schema below) |
| **MCP** | New `server/mcp-python/tools/evergreen.py` | New tools: `check_evergreen_eligibility`, `check_evergreen_limits`, `log_evergreen_usage` |
| **DIFY** | Update CLASSIFIER KB or new Evergreen KB | Evergreen eligibility check instructions |
| **EXP** | New `server/routes/evergreen.js` | Evergreen trading endpoints, limit check, usage logging |
| **EXP** | New `server/jobs/evergreen-review.js` | Annual: flag dormant Evergreen products (>3 years no trades) |
| **ANG** | New Evergreen trading UI | Limit dashboard, same-day trade flow, parallel NPA Lite trigger |

**New Tables:**
```sql
ref_evergreen_products (
  id, product_type, product_name, approved_date, expiry_date,
  max_notional, max_deals_non_retail, max_deals_retail,
  max_retail_transaction, max_retail_aggregate,
  is_liquidity_mgmt, is_active
)

npa_evergreen_usage (
  id, evergreen_product_id, project_id, trade_date,
  notional_amount, deal_type, logged_by, logged_at
)
```

**Workflow:**
1. CLASSIFIER checks Evergreen eligibility (product on list + original NPA active)
2. If eligible: MCP tool checks limits in real-time (SUM of `npa_evergreen_usage`)
3. If within limits: allow same-day trade, log usage, initiate parallel NPA Lite
4. If limits exceeded: block trade, show options (COO approval for limit increase, or standard NPA Lite)
5. If `is_liquidity_mgmt = true`: caps waived (R44)
6. Annual review job: flag dormant Evergreen products (> 3 years no trades)

### Task 5.2 — Dispute Resolution (GAP-016)

**Root Cause:** Angular UI has no "Escalate Issue" button. Express has no escalation creation endpoint. `npa_escalations` table exists but is never written to from approval flow.

| Layer | File | Change |
|-------|------|--------|
| **ANG** | `approval-dashboard.component.ts` | Add "Escalate Issue" button on rework/return-to-maker views |
| **EXP** | `server/routes/transitions.js` | New endpoint: `POST /api/npas/:id/escalate` (creates `npa_escalations`, notifies COO + RMG-OR) |
| **ANG** | New Escalation Queue component | COO Dashboard view for escalation queue |
| **DB** | No change needed | `npa_escalations` table has correct schema. |

### Task 5.3 — Document Upload (GAP-018)

**Root Cause:** Express has no file upload endpoint. No `multer` middleware. Angular upload button exists but calls nothing. MCP `documents` module has metadata tools but no file storage.

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/routes/documents.js` (new) | `POST /api/npas/:id/documents` with `multer` middleware for file upload |
| **EXP** | `server/index.js` | Register `multer`, configure upload directory (or cloud storage) |
| **ANG** | NPA Detail DOCUMENTS tab | Wire existing upload button to new endpoint. Add document viewer. |
| **MCP** | `server/mcp-python/tools/documents.py` | Wire DOC_LIFECYCLE agent to validate uploaded documents |
| **DB** | No change needed | `npa_documents` has `file_path`, `file_size`, `mime_type`, `validation_status`. Ready. |

---

## Cross-Cutting: Authentication (Observation 5)

**Root Cause:** Express `server/index.js` has no auth middleware. No `passport`, `jsonwebtoken`, or session middleware installed. No role-based access control.

This is a separate workstream but blocks real-world usage. Before any production deployment:

| Layer | File | Change |
|-------|------|--------|
| **EXP** | `server/middleware/auth.js` (new) | JWT or session-based authentication middleware |
| **EXP** | `server/middleware/rbac.js` (new) | Role-based access control (Maker, Checker, Approver_*, COO, Admin) |
| **EXP** | All route files | Apply auth + rbac middleware to every route |
| **DB** | New `users`, `roles`, `user_roles` tables | User management schema |
| **ANG** | Login page, auth interceptor | Authentication UI and token management |

---

## Layer Change Heatmap (What Gets Touched Per Sprint)

| Sprint | Express API | Angular UI | MCP Tools | Dify Prompts | DB Schema |
|--------|:-----------:|:----------:|:---------:|:------------:|:---------:|
| **0** | 3 files | 1 file | — | — | — |
| **1** | 1 new file (transitions.js) | 2 files | 1 file | — | — |
| **2** | 1 new file + existing | 2 files | — | — | — |
| **3** | 2 new files (jobs) + middleware | — | 1 file | — | 1 column |
| **4** | 2 files + new routes | 3 new components | 2 new files | 1 file | 4 new tables + 1 column |
| **5** | 3 new files + jobs | 3 new components | 2 new files | 1 file | 2 new tables |

**Sprints 0-2 are almost entirely Express + Angular.** No schema changes, no new Dify prompts, minimal MCP changes. This means they can start immediately without DB migrations or Dify redeployment.

---

## Summary: Impact After All Sprints

| Metric | Before | After Sprint 0 | After Sprint 1 | After All Sprints |
|--------|--------|----------------|-----------------|-------------------|
| Business rules implemented | 6/44 (14%) | 9/44 (20%) | 18/44 (41%) | 38/44 (86%) |
| P0 gaps remaining | 3 | **0** | 0 | 0 |
| P1 gaps remaining | 4 | 4 | **0** | 0 |
| P2 gaps remaining | 6 | 6 | 6 | **0** |
| Approval workflow persisted | No | No | **Yes** | Yes |
| Agent results persisted | No | No | No | **Yes** (Sprint 2) |
| SLA monitoring | No | No | No | **Yes** (Sprint 3) |
| Evergreen trading | No | No | No | **Yes** (Sprint 5) |
| PIR workflow | No | No | No | **Yes** (Sprint 4) |

**Express API changes per sprint:**
- Sprint 0: 3 guard additions (< 50 LOC each)
- Sprint 1: 1 new route file with 7 endpoints (~400 LOC)
- Sprint 2: 7 persist endpoints (~200 LOC)
- Sprint 3: 2 scheduled jobs + 1 middleware (~250 LOC)
- Sprint 4: New routes + schema (~500 LOC)
- Sprint 5: New routes + jobs (~600 LOC)

---

## Deliverable Files (All in `Context/2026-02-18/`)

| # | File | Status |
|---|------|--------|
| 1 | `NPA_Business_Process_Deep_Knowledge.md` | COMPLETE |
| 2 | `Action_Plan_Architecture_Gap_Analysis.md` | COMPLETE |
| 3 | `Architecture_Gap_Register.md` | COMPLETE (updated with Root Cause Layer) |
| 4 | `Remediation_Roadmap.md` | COMPLETE (updated with Root Cause Layer per task) |

---

*End of Remediation Roadmap*
