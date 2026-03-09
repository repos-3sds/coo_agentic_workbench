# Architecture Gap Register
## NPA Business Process vs. Agentic Architecture — Complete Findings

**Date:** 2026-02-18
**Method:** Exhaustive comparison of NPA business rules (from KB docs) against actual codebase implementation (server/, src/, DB schema)
**Scope:** 13 logical agents, 7 Dify apps, 41 DB tables, 12 API route modules, 7 NPA Detail tabs, full state machine

---

## PART A: BUSINESS RULE CHECKLIST (44 Rules Tested)

### Category 1: Product Classification (10 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R01 | Prohibited check runs BEFORE classification (not after) | SOP §2.1, KB/03 | **PARTIAL** — RISK agent runs in Wave 2 (t=2s), CLASSIFIER runs in Wave 1 (t=0). Prohibited check should be Step 0. | **Angular UI** — Wave execution order in `npa-detail.component.ts` fires CLASSIFIER before RISK. MCP tool `classify_determine_track` DOES set stage=PROHIBITED correctly, but it's called too late. | GAP |
| R02 | Two-stage model: Stage 1 (NTG/Variation/Existing) THEN Stage 2 (track selection) | KB/03, Classification Agent | **YES** — CLASSIFIER workflow outputs both `type` and `track` | **Dify Prompt + MCP Tool** — Working correctly. Dify prompt (`KB_Classification_Agent.md`) instructs two-stage logic; MCP tool `classify_determine_track` persists both fields. | OK |
| R03 | NTG triggers: new product, new role, new channel, new segment, new geography, new exchange | Standard §2.1.1 | **PARTIAL** — CLASSIFIER uses semantic similarity + LLM reasoning, but the 6 specific NTG sub-triggers are not explicitly coded as rules | **Dify Prompt** — The 6 NTG sub-triggers are described in KB but rely on LLM reasoning, not deterministic rules. No MCP tool validates sub-trigger type. | GAP |
| R04 | Variation triggers: bundling, cross-book, accounting change, manual workarounds, ESG, fintech, 3rd-party channels | Standard §2.1.2 | **PARTIAL** — CLASSIFIER handles high-level variation detection but the 7 specific triggers from §2.1.2 are not individually validated | **Dify Prompt** — Same as R03. Variation triggers are in KB text but not codified as deterministic rules in MCP tools. | GAP |
| R05 | Existing sub-categories: new-to-location, dormant (<1yr, 1-3yr, ≥3yr), expired | Standard §2.1.3 | **PARTIAL** — DB has `npa_type` varchar but no dormancy period tracking or sub-category field | **DB Schema + MCP Tool** — No `dormancy_period` column or `npa_subtype` column in `npa_projects`. No MCP tool checks transaction history for dormancy. | GAP |
| R06 | Classification confidence threshold: ≥75% proceed, <75% escalate to human | KB/03 Classification Agent | **YES** — CLASSIFIER outputs `overallConfidence` and the agent spec documents the 75% threshold | **Dify Prompt + MCP Tool** — Working. Prompt defines threshold; MCP tool `classify_determine_track` stores `confidence_score`. | OK |
| R07 | Cross-border detection during classification triggers 5 mandatory SOPs | Standard §2.3.2 | **PARTIAL** — `is_cross_border` field exists in DB, GOVERNANCE agent lists mandatory signoffs, but no automatic enforcement that cross-border → 5 mandatory SOPs | **Express API + MCP Tool** — `is_cross_border` stored but `governance_create_signoff_matrix` MCP tool doesn't force 5 mandatory SOPs when flag is true. Express API has no enforcement either. | GAP |
| R08 | Bundling detection: 8-condition checklist | GFM SOP §Bundling | **NO** — No bundling condition table, no 8-condition checker, no arbitration team routing | **DB Schema + MCP Tool + Dify Prompt** — No `ref_bundling_conditions` table. No MCP tool for bundling check. No Dify prompt covers bundling workflow. All layers missing. | GAP |
| R09 | Evergreen eligibility check during classification | GFM SOP §Evergreen | **NO** — No Evergreen product list table, no limit tracking, no Evergreen-specific routing | **DB Schema + MCP Tool + Dify Prompt** — No `ref_evergreen_products` table. No MCP tool for Evergreen limits. No Dify prompt covers Evergreen. All layers missing. | GAP |
| R10 | Prohibited = Hard Stop, workflow termination, no exceptions | SOP §Prohibited | **PARTIAL** — RISK agent can emit HARD_STOP but there's no code that actually prevents stage progression. UI shows warning but doesn't block API calls | **Express API + Angular UI** — MCP tool `classify_determine_track` correctly sets `stage=PROHIBITED, status=STOPPED`. BUT Express API `approvals.js` has ZERO guards — no middleware checks for PROHIBITED status before allowing transitions. Angular UI shows badge but doesn't disable action buttons. | GAP |

### Category 2: Approval Track Routing (9 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R11 | NTG → ALWAYS Full NPA, no exceptions | Standard §2.1.1, KB/03 | **NO** — No enforcement. `approval_track` is set by CLASSIFIER output but nothing prevents an NTG product from being routed to NPA Lite | **Express API** — `governance.js` POST /classification saves whatever the CLASSIFIER outputs without validating NTG→FULL_NPA rule. No DB constraint either. | GAP |
| R12 | NPA Lite B1 (Impending Deal): 48-hour notice, any-SOP-objection fallback | GFM SOP | **NO** — No 48-hour timer, no objection mechanism, no auto-approval after timeout | **All Layers** — No DB sub-type field, no MCP tool, no Dify prompt, no Express endpoint, no Angular UI. Entire workflow missing. | GAP |
| R13 | NPA Lite B2 (NLNOC): Joint COO+MLR decision | GFM SOP | **NO** — No NLNOC-specific workflow | **All Layers** — Same as R12. No infrastructure for NPA Lite sub-types. | GAP |
| R14 | NPA Lite B3 (Fast-Track Dormant): 5 criteria check | GFM SOP | **NO** — No dormant reactivation workflow, no 5-criteria checker | **All Layers** — Same as R12. No 5-criteria checker in any layer. | GAP |
| R15 | NPA Lite B4 (Addendum): Live NPA only, no new features, no validity extension | GFM SOP | **NO** — No addendum tracking, no link to parent NPA | **DB Schema + All Layers** — No `parent_npa_id` column. No addendum workflow in any layer. | GAP |
| R16 | Full NPA requires PAC approval BEFORE NPA starts | Standard §2.2.2 | **PARTIAL** — `pac_approval_status` column exists in DB but no gate that blocks NPA initiation until PAC = 'Approved' | **Express API** — `approvals.js` has no pre-transition guard checking `pac_approval_status`. DB column exists but is informational only. | GAP |
| R17 | Bundling: All 8 conditions pass → Arbitration Team; any fail → Full NPA/Lite | GFM SOP | **NO** — Same as R08 | **All Layers** — Same as R08. No bundling infrastructure. | GAP |
| R18 | Evergreen: Trade immediately, log within 30 min, parallel NPA Lite reactivation | GFM SOP | **NO** — No Evergreen workflow exists | **All Layers** — Same as R09. No Evergreen infrastructure. | GAP |
| R19 | Approval track determines sign-off party set (Full=all 7, Lite=reduced, Bundling=Arbitration) | Standard §2.4 | **NO** — Sign-off parties are hardcoded in seed-demo. `ref_signoff_routing_rules` table exists but is never queried by any route | **Express API + MCP Tool** — `ref_signoff_routing_rules` table is populated in DB. MCP tool `get_signoff_routing_rules` CAN read it. But Express `approvals.js` never calls it, and `governance_create_signoff_matrix` doesn't use the routing rules to dynamically assign SOPs. | GAP |

### Category 3: Sign-Off Party Logic (7 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R20 | Full NPA → ALL 7 SOPs engaged | Standard §2.4 | **HARDCODED** — seed-demo creates 8 signoff rows but this is static, not derived from classification | **Express API + MCP Tool** — `npas.js` seed-demo hardcodes 8 SOPs. MCP tool `governance_create_signoff_matrix` creates signoffs but doesn't consult `ref_signoff_routing_rules` to determine WHICH SOPs based on track. | GAP |
| R21 | Cross-border override → 5 mandatory SOPs cannot be waived | Standard §2.3.2 | **NO** — No enforcement. Cross-border flag exists but doesn't force specific SOPs | **MCP Tool + Express API** — `governance_create_signoff_matrix` doesn't check `is_cross_border` flag to force Finance, Credit, MLR, Tech, Ops. No Express middleware validates this. | GAP |
| R22 | NTG from overseas → Head Office sign-offs required | Standard §2.4.3 | **NO** — No Head Office vs Location sign-off distinction | **DB Schema + MCP Tool** — No `signoff_location` (Head Office vs Location) column in `npa_signoffs`. No MCP tool checks jurisdiction + NTG combo to determine Head Office requirement. | GAP |
| R23 | Each SOP can set: permanent restrictions, product parameters, post-launch conditions | Standard §2.4.2 | **PARTIAL** — `npa_post_launch_conditions` table exists and is populated in seed-demo, but no UI for SOPs to create them during sign-off | **Angular UI** — DB table and schema are correct. Missing: Angular sign-off UI has no "Add Condition" form/modal when approving. | GAP |
| R24 | SOP sign-off with conditions (APPROVED_CONDITIONAL) | Standard §2.4.2 | **PARTIAL** — `APPROVED_CONDITIONAL` type exists in TypeScript but no UI trigger | **Angular UI** — TypeScript type defined in `approval.model.ts`. DB supports it. Missing: no "Approve with Conditions" button in sign-off UI component. | GAP |
| R25 | Checker reviews before SOPs | Standard §2.3 (Maker→Checker model) | **YES** — State machine: DRAFT → PENDING_CHECKER → PENDING_SIGN_OFFS | **Angular UI** — Working. State machine in `approval-dashboard.component.ts` enforces this order locally. (Note: not enforced server-side per GAP-013) | OK |
| R26 | COO final approval after all SOPs sign off | Standard §2.5 | **YES** — State machine: PENDING_SIGN_OFFS → PENDING_FINAL_APPROVAL → APPROVED | **Angular UI** — Working. `checkIfAllSignedOff()` auto-transitions locally. (Note: not enforced server-side per GAP-013) | OK |

### Category 4: Lifecycle & Validity (8 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R27 | NPA valid for 1 year from approval | Standard §2.7.1 | **PARTIAL** — `validity_expiry` column exists in DB but no auto-expiration logic, no cron job, no enforcement | **Express API** — DB column exists. No scheduled job in Express `server/index.js` to check expiry. No transition endpoint to auto-expire. | GAP |
| R28 | One-time +6mo extension, requires unanimous SOP consent | Standard §2.7.2 | **NO** — No extension workflow, no extension history tracking | **All Layers** — No `extension_count` or `extension_history` in DB. No MCP tool. No Express endpoint. No UI. | GAP |
| R29 | Expired NPA → must engage COO for reactivation requirements | Standard §2.7.1 | **NO** — No expiration detection, no reactivation workflow | **Express API** — No scheduled job to detect expired NPAs. No reactivation endpoint. | GAP |
| R30 | PIR mandatory for ALL NTG within 6 months of launch | Standard §2.8.2 | **PARTIAL** — `pir_status` and `pir_due_date` columns exist but no auto-scheduling, no reminders, no enforcement | **Express API** — DB columns exist. No code in any transition endpoint auto-sets `pir_due_date` when stage→LAUNCHED. No scheduled job sends reminders. | GAP |
| R31 | PIR mandatory for products with post-launch conditions | Standard §2.8.2 | **PARTIAL** — Same as R30, plus no link between conditions and PIR trigger | **Express API + MCP Tool** — `npa_post_launch_conditions` table exists. No logic links condition existence to PIR requirement. | GAP |
| R32 | GFM stricter: PIR mandatory for ALL launched products | GFM SOP | **NO** — No GFM-specific PIR enforcement | **Express API** — No GFM-specific business unit config. PIR logic doesn't exist at all (R30). | GAP |
| R33 | Launch = first sale/offer OR first trade (not indication of interest) | Standard §2.7 footnote 7 | **PARTIAL** — `launched_at` timestamp exists but no definition enforcement | **Express API** — `launched_at` column exists. No validation of what constitutes "launch" vs "indication of interest". Low priority. | OK-ISH |
| R34 | Dormant = no transactions in last 12 months | Standard §2.1.3b | **NO** — No transaction monitoring, no dormancy detection | **DB Schema + Express API** — No transaction log table. No MCP tool queries trade activity. No scheduled dormancy check. | GAP |

### Category 5: Loop-Backs & Escalation (5 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R35 | Circuit breaker: 3 loop-backs → auto-escalate to Governance Forum | GFM SOP, KB/03 | **PARTIAL** — `loop_back_count` tracked, `ref_escalation_rules` table exists with threshold, but NO code checks count ≥ 3 and triggers escalation | **Angular UI + Express API** — `approval-dashboard.component.ts` increments `loop_back_count` locally but never checks threshold. `ref_escalation_rules` table has `threshold=3` but Express API has no endpoint that reads it. No server-side enforcement. | GAP |
| R36 | 4 types of loop-back tracked (Checker rejection, Approval clarification, Launch prep, Post-launch corrective) | KB/03 | **PARTIAL** — `npa_loop_backs.loop_back_type` supports all 4 values but only APPROVAL_CLARIFICATION is created in seed-demo | **Express API** — DB schema supports all 4 types. Only seed-demo populates one type. No route creates loop-back records for real user actions. | OK-ISH |
| R37 | SLA: 48 hours per approver | GFM SOP | **PARTIAL** — `sla_deadline` and `sla_breached` columns exist in npa_signoffs but no automated SLA monitoring or alerting | **Express API** — DB columns exist. No scheduled job in Express. `sla_deadline` only set by seed-demo, not by real signoff creation. No breach detection logic. | GAP |
| R38 | Escalation levels: Dept Head → BU Head → GPH → Group COO → CEO | ref_escalation_rules | **SCHEMA ONLY** — Table populated but no code reads it or triggers escalations | **Express API + MCP Tool** — `ref_escalation_rules` table has 5 levels populated. No MCP tool reads escalation rules. No Express route triggers escalation. DB data exists but is dead. | GAP |
| R39 | Unresolved issues → escalate to COO, Location Head, RMG-OR | Standard §2.9.2 | **NO** — No dispute resolution workflow | **All Layers** — No `npa_disputes` table. No MCP tool. No Express endpoint. No Angular UI for dispute filing. | GAP |

### Category 6: Notional Thresholds & Special Rules (5 Rules)

| # | Rule | Source | Implemented? | Root Cause Layer | Verdict |
|---|------|--------|-------------|-----------------|---------|
| R40 | Notional >$20M → ROAE sensitivity analysis required | GFM SOP | **NO** — No threshold checking on notional_amount | **MCP Tool + Express API** — `notional_amount` stored in `npa_projects`. No MCP tool checks threshold. No Express route validates notional. Signoff assignment ignores amount. | GAP |
| R41 | Notional >$50M → Finance VP review required | GFM SOP | **NO** — Same | **MCP Tool + Express API** — Same as R40. `governance_create_signoff_matrix` doesn't check notional amount to add Finance VP. | GAP |
| R42 | Notional >$100M → CFO review required | GFM SOP | **NO** — Same | **MCP Tool + Express API** — Same as R40. No CFO escalation logic in any layer. | GAP |
| R43 | Evergreen limits: $500M total, $250M long tenor, 10/20 deal cap | GFM SOP | **NO** — No Evergreen limit tracking whatsoever | **DB Schema + All Layers** — No `ref_evergreen_products` or `npa_evergreen_usage` tables. No MCP tool. No Express endpoint. No UI. All layers missing. | GAP |
| R44 | Liquidity management products: Evergreen caps waived | GFM SOP | **NO** — No product-type exception logic | **DB Schema + All Layers** — Same as R43. Can't have exception logic when base Evergreen logic doesn't exist. | GAP |

---

## PART B: GAP REGISTER (Prioritized Findings)

### Summary Statistics

| Category | Total Rules | OK | Partial | Missing | Gap Rate |
|----------|------------|-----|---------|---------|----------|
| Classification | 10 | 2 | 5 | 3 | **80%** |
| Approval Tracks | 9 | 0 | 1 | 8 | **100%** |
| Sign-Off Logic | 7 | 2 | 2 | 3 | **71%** |
| Lifecycle & Validity | 8 | 1 | 4 | 3 | **88%** |
| Loop-Backs & Escalation | 5 | 1 | 3 | 1 | **80%** |
| Thresholds & Special | 5 | 0 | 0 | 5 | **100%** |
| **TOTAL** | **44** | **6 (14%)** | **15 (34%)** | **23 (52%)** | **86%** |

**6 rules fully implemented. 15 partially (schema exists, logic missing). 23 completely missing.**

---

### P0 — BLOCKERS (Compliance/Regulatory Risk)

#### GAP-001: Prohibited Check Not Enforced as Gate
- **Severity:** P0 — CRITICAL
- **Rules:** R01, R10
- **Root Cause Layer:** **Angular UI** (wave order) + **Express API** (no gate middleware)
  - `npa-detail.component.ts` — Wave execution fires CLASSIFIER at t=0, RISK at t=2000ms. Should be reversed.
  - `server/routes/approvals.js` — No middleware checks `npa_risk_checks` for FAIL before allowing stage transitions.
  - MCP tool `classify_determine_track` correctly sets `stage=PROHIBITED, status=STOPPED` — this part works.
- **Business Rule:** Prohibited products must be stopped BEFORE any NPA processing begins. Hard stop = workflow termination.
- **Expected:** Prohibited check runs as Step 0, before classification. If FAIL, NPA cannot be created.
- **Actual:** RISK agent runs in Wave 2 (t=2000ms), AFTER CLASSIFIER. Even when RISK returns `hardStop: true`, no code prevents the NPA from progressing through stages. The UI shows a warning but the API has no gate.
- **Impact:** A prohibited product (e.g., crypto derivative for retail, sanctioned entity) could theoretically progress through sign-off. Regulatory violation risk.
- **Fix:**
  1. Move prohibited check to before CLASSIFIER (Wave 0 or pre-classification gate)
  2. Add server-side enforcement: if `npa_risk_checks` has any `FAIL` result, block stage transitions via API middleware
  3. Add DB constraint or trigger: `npa_projects.current_stage` cannot advance past INITIATION if risk_check FAIL exists
- **Affected:** `server/routes/approvals.js`, `npa-detail.component.ts` wave execution, new middleware
- **Effort:** M (2-3 days)

#### GAP-002: No PAC Gate for New-to-Group Products
- **Severity:** P0 — CRITICAL
- **Rules:** R16
- **Root Cause Layer:** **Express API** (no pre-transition guard)
  - `server/routes/approvals.js` — No check for `pac_approval_status` before allowing DRAFT→PENDING_CHECKER transition.
  - DB column `pac_approval_status` exists in `npa_projects` — schema is correct.
  - Angular UI `approval-dashboard.component.ts` `submit()` method has no PAC validation either.
- **Business Rule:** PAC approval is required BEFORE NPA starts for NTG products. This is a Group requirement.
- **Expected:** If `npa_type = 'New-to-Group'`, NPA cannot enter Stage 2 (NPA Process) until `pac_approval_status = 'Approved'`.
- **Actual:** `pac_approval_status` column exists but is purely informational. An NTG product can be submitted, reviewed, and approved without PAC ever being consulted.
- **Impact:** Group governance violation. Audit finding. NTG products launched without proper committee oversight.
- **Fix:**
  1. Add server-side check: if `npa_type='New-to-Group'` AND `pac_approval_status != 'Approved'`, reject stage transition from DRAFT → PENDING_CHECKER
  2. Add PAC submission workflow (or at minimum, a manual confirmation gate)
- **Affected:** `server/routes/approvals.js`, approval-dashboard.component.ts submit logic
- **Effort:** S (1 day)

#### GAP-003: NTG→Full NPA Not Enforced
- **Severity:** P0 — CRITICAL
- **Rules:** R11
- **Root Cause Layer:** **Express API** (no validation on write) + **MCP Tool** (no override logic)
  - `server/routes/governance.js` POST /classification — Saves whatever CLASSIFIER outputs. No rule: "if NTG → force FULL_NPA".
  - MCP tool `classify_determine_track` — Sets `approval_track` from Dify output, doesn't enforce NTG→FULL_NPA override.
  - Dify Prompt (`KB_Classification_Agent.md`) — Instructs FULL_NPA for NTG in text, but LLM could deviate. No deterministic guard.
- **Business Rule:** NTG products MUST use Full NPA track. Never NPA Lite. Never Bundling. No exceptions.
- **Expected:** If classification = NTG, `approval_track` is automatically set to FULL_NPA and cannot be overridden.
- **Actual:** `approval_track` is set by CLASSIFIER output but nothing prevents it from being changed or set to NPA_LITE for an NTG product. No validation on write.
- **Impact:** NTG product could go through lighter review, missing mandatory sign-offs.
- **Fix:**
  1. Add validation in governance.js POST /classification: if `npa_type='New-to-Group'`, force `approval_track='FULL_NPA'`
  2. Add DB CHECK constraint: `npa_type != 'New-to-Group' OR approval_track = 'FULL_NPA'`
- **Affected:** `server/routes/governance.js`, schema
- **Effort:** S (0.5 day)

---

### P1 — CRITICAL (Core Workflow Broken)

#### GAP-004: Sign-Off Parties Not Dynamically Assigned by Track
- **Severity:** P1
- **Rules:** R19, R20, R21, R22
- **Root Cause Layer:** **Express API** (no routing query) + **MCP Tool** (partial)
  - `server/routes/approvals.js` — No function queries `ref_signoff_routing_rules`. Signoffs only come from seed-demo or MCP tool.
  - MCP tool `governance_create_signoff_matrix` — Creates signoffs but uses hardcoded list, doesn't read `ref_signoff_routing_rules` for track-specific assignment.
  - MCP tool `get_signoff_routing_rules` — EXISTS and CAN read the rules table, but is never invoked by the Dify GOVERNANCE prompt in the signoff creation flow.
  - DB `ref_signoff_routing_rules` — Correctly populated with per-track routing. Data is ready but unused.
- **Business Rule:** Full NPA = all 7 SOPs. NPA Lite = reduced set. Cross-border = 5 mandatory. NTG overseas = Head Office.
- **Expected:** When NPA enters PENDING_SIGN_OFFS, the system reads `approval_track` + `is_cross_border` + `npa_type` + jurisdictions to determine which SOPs are required, using `ref_signoff_routing_rules`.
- **Actual:** Seed-demo hardcodes 8 signoff rows regardless of classification. The `ref_signoff_routing_rules` table exists in DB but NO route ever queries it. Sign-off assignment is completely static.
- **Impact:** NPA Lite products get the same heavyweight review as Full NPA. Cross-border mandatory SOPs may be skipped. Wasted approver time or insufficient review.
- **Fix:**
  1. Create new function `assignSignoffParties(projectId)` that queries `ref_signoff_routing_rules` filtered by `approval_track`
  2. Apply cross-border override: if `is_cross_border = true`, force Finance, Credit, MLR, Tech, Ops
  3. Apply NTG overseas override: if jurisdictions include non-SG + NTG, force Head Office parties
  4. Call this function when stage transitions to PENDING_SIGN_OFFS
- **Affected:** New server function, `server/routes/approvals.js`, `ref_signoff_routing_rules` data
- **Effort:** M (2-3 days)

#### GAP-005: Circuit Breaker Not Implemented
- **Severity:** P1
- **Rules:** R35, R38
- **Root Cause Layer:** **Angular UI** (no threshold check) + **Express API** (no server-side enforcement)
  - `approval-dashboard.component.ts` `requestRework()` (line ~498-511) — Increments loop_back_count locally but NEVER checks if count ≥ 3. No escalation creation.
  - `server/routes/approvals.js` — No `request-rework` endpoint that could enforce circuit breaker server-side.
  - DB `ref_escalation_rules` — Has threshold=3 for LOOP_BACK_LIMIT, escalation_level=4. Data is correct but dead.
  - DB `npa_escalations` — Table schema is correct and ready. Never written to by real code.
- **Business Rule:** After 3 loop-backs on same NPA → automatic escalation to GFM COO / Governance Forum.
- **Expected:** When `requestRework()` increments `loop_back_count`, if count ≥ 3, auto-create escalation record in `npa_escalations` and transition to ESCALATED state.
- **Actual:** `loop_back_count` is incremented in the approval-dashboard component. `ref_escalation_rules` has threshold = 3. But NO code ever checks this threshold or creates an escalation.
- **Impact:** NPAs can loop indefinitely between Maker and SOPs without senior intervention. Resource waste, frustration, no resolution path.
- **Fix:**
  1. In `requestRework()` (approval-dashboard or server-side): after incrementing loop_back_count, check if >= 3
  2. If >= 3: insert into `npa_escalations` (trigger_type: LOOP_BACK_LIMIT, escalation_level: 4/Group COO)
  3. Change `current_stage` to ESCALATED (or a new GOVERNANCE_REVIEW stage)
  4. Send notification to COO (via NOTIFICATION agent or direct)
- **Affected:** `approval-dashboard.component.ts`, potentially new server endpoint
- **Effort:** S (1 day)

#### GAP-006: SLA Monitoring Not Automated
- **Severity:** P1
- **Rules:** R37
- **Root Cause Layer:** **Express API** (no scheduled job) + **MCP Tool** (partial)
  - `server/index.js` — No `setInterval` or cron job registered for SLA monitoring.
  - `server/routes/approvals.js` — When signoff is created, `sla_deadline` is not calculated (only seed-demo sets it).
  - MCP tool `governance_create_signoff_matrix` — Creates signoffs with `sla_deadline` field, but doesn't calculate `NOW() + 48h`.
  - DB `npa_signoffs` — Schema has `sla_deadline`, `sla_breached` columns. Ready to use.
  - DB `npa_breach_alerts` — Table exists and is ready. Never written to by real code.
- **Business Rule:** Each approver has 48-hour SLA. Breach → escalation at 36hr/48hr/72hr.
- **Expected:** System monitors `sla_deadline` on each `npa_signoffs` row. When current time approaches deadline, trigger warnings. When breached, auto-escalate.
- **Actual:** `sla_deadline` and `sla_breached` columns exist but are never written to by any automated process. Only populated in seed-demo as static timestamps.
- **Impact:** Approvals can stall indefinitely. No visibility into bottlenecks until manual review.
- **Fix:**
  1. When sign-off party is assigned, set `sla_deadline = NOW() + 48 hours`
  2. Create scheduled job (cron or Express setInterval) to check signoffs WHERE `status = 'PENDING' AND sla_deadline < NOW()`
  3. When breached: set `sla_breached = true`, create breach_alert, trigger NOTIFICATION agent
  4. Expose SLA status in dashboard KPIs
- **Affected:** New scheduled job, `server/routes/approvals.js`, NOTIFICATION agent
- **Effort:** M (2-3 days)

#### GAP-007: State Machine Missing Critical States
- **Severity:** P1
- **Rules:** R05, R29, R34
- **Root Cause Layer:** **Angular UI** (incomplete state mapping) + **Express API** (no transition endpoints for new states)
  - `approval-dashboard.component.ts` — `mapStageToNpaStage()` only handles 13 stage values. Missing: ESCALATED, PIR_REQUIRED, WITHDRAWN, EXPIRED.
  - `server/routes/approvals.js` — No endpoints for `withdraw`, `launch`, `expire` transitions.
  - DB `npa_projects.current_stage` — VARCHAR column, can accept any value. No schema change needed.
  - MCP tool `classify_determine_track` — Only sets PROHIBITED state. No MCP tool for other lifecycle transitions.
- **Business Rule:** NPA lifecycle includes: Classification pending, Classified (by type), Escalated, PIR Required, Withdrawn, Archived, Dormant.
- **Expected:** `current_stage` column should support all lifecycle states.
- **Actual:** Only 13 stage values exist (DRAFT through LAUNCHED + PROHIBITED). Missing: PENDING_CLASSIFICATION, CLASSIFIED_*, ESCALATED, PIR_REQUIRED, PIR_IN_PROGRESS, WITHDRAWN, ARCHIVED. No dormancy detection.
- **Impact:** Cannot represent full NPA lifecycle in database. PIR, escalation, withdrawal, and dormancy are invisible to the system.
- **Fix:**
  1. Add missing stage values to the state machine (no schema change needed — varchar column)
  2. Add transition logic for: APPROVED → LAUNCHED → PIR_REQUIRED → PIR_COMPLETED
  3. Add transition logic for: any → WITHDRAWN (maker withdrawal) and APPROVED → ARCHIVED (validity expired)
  4. Add dormancy detection: if launched product has no transactions for 12 months, flag as DORMANT
- **Affected:** State machine logic throughout, `server/routes/approvals.js`, new PIR/withdrawal endpoints
- **Effort:** L (1 week)

---

### P2 — HIGH (Important, Has Manual Workaround)

#### GAP-008: No Bundling Workflow
- **Severity:** P2
- **Rules:** R08, R17
- **Root Cause Layer:** **DB Schema** + **MCP Tool** + **Dify Prompt** + **Express API** — All layers missing.
  - DB — No `ref_bundling_conditions` or `ref_approved_bundles` tables.
  - MCP — No bundling-specific tool (no `check_bundling_conditions` or similar).
  - Dify — `KB_Classification_Agent.md` mentions bundling as a track but no 8-condition logic.
  - Express — No bundling assessment endpoint.
  - Angular — No bundling condition UI.
- **Business Rule:** Bundling has 8-condition checklist. All pass → Arbitration Team. Any fail → Full NPA/Lite. Pre-approved bundles (DCD, Treasury Asset Swap, ELN) need no approval.
- **Expected:** When CLASSIFIER detects bundling, system checks 8 conditions, routes to Arbitration Team or escalates.
- **Actual:** No bundling condition table. No arbitration team workflow. No pre-approved bundle list. CLASSIFIER may detect bundling but there's nowhere to route it.
- **Impact:** Bundled products must be manually assessed. No efficiency gain for one of the most common NPA types.
- **Fix:**
  1. Create `ref_bundling_conditions` table (8 rows)
  2. Create `ref_approved_bundles` table (pre-approved combinations)
  3. Add bundling check to CLASSIFIER workflow or create new BUNDLING sub-agent
  4. Route to arbitration team members or Full NPA based on condition results
- **Effort:** L (1 week)

#### GAP-009: No Evergreen Product Management
- **Severity:** P2
- **Rules:** R09, R18, R43, R44
- **Root Cause Layer:** **DB Schema** + **MCP Tool** + **Dify Prompt** + **Express API** + **Angular UI** — All layers missing.
  - DB — No `ref_evergreen_products` or `npa_evergreen_usage` tables.
  - MCP — No Evergreen-specific tools (no limit check, no usage logging).
  - Dify — No Evergreen workflow prompt. CLASSIFIER mentions Evergreen as track name only.
  - Express — No Evergreen endpoints.
  - Angular — No Evergreen trading UI or limit dashboard.
- **Business Rule:** Evergreen products have 3-year validity, $500M notional cap, deal count limits. Can trade same day. Need parallel NPA Lite reactivation.
- **Expected:** System maintains Evergreen product list, tracks limit consumption in real-time, allows same-day trading within limits.
- **Actual:** No Evergreen product list. No limit tracking. No real-time usage monitoring. No parallel reactivation workflow. Zero Evergreen infrastructure exists.
- **Impact:** The competitive advantage of Evergreen (same-day trading) is completely unavailable. All products must go through standard NPA, even vanilla products that should be "always on."
- **Fix:**
  1. Create `ref_evergreen_products` table (product_id, approval_date, expiry_date, limits)
  2. Create `npa_evergreen_usage` table (running notional consumed, deal count)
  3. Add Evergreen eligibility check to CLASSIFIER
  4. Add Evergreen trading workflow: limit check → trade → log → parallel NPA Lite
  5. Annual review automation (flag products dormant > 3 years)
- **Effort:** XL (2+ weeks)

#### GAP-010: No Validity/Extension Management
- **Severity:** P2
- **Rules:** R27, R28, R29
- **Root Cause Layer:** **Express API** (no scheduled job, no transition logic)
  - `server/routes/approvals.js` — No `final-approve` transition that auto-sets `validity_expiry = NOW() + 1 YEAR`.
  - `server/index.js` — No scheduled job (setInterval/cron) to check expiry dates.
  - DB `npa_projects.validity_expiry` — Column exists. Never populated by real code (only seed-demo).
  - DB — No `extension_count` or `extension_history` columns for tracking one-time extension.
- **Business Rule:** NPA valid 1 year. One-time +6mo extension. Expired → engage COO. Auto-expire after validity period.
- **Expected:** System tracks validity_expiry, warns before expiry, auto-expires, supports extension request with unanimous SOP consent.
- **Actual:** `validity_expiry` column exists but is never populated with calculated dates. No auto-expiration. No extension workflow. No expiry warnings.
- **Fix:**
  1. When NPA approved: set `validity_expiry = approval_date + 1 year`
  2. Scheduled job: check `validity_expiry < NOW() + 30 days` → send warning
  3. Scheduled job: check `validity_expiry < NOW()` → set status to EXPIRED
  4. Create extension endpoint: requires all original SOPs' consent
- **Effort:** M (3-4 days)

#### GAP-011: No PIR Workflow
- **Severity:** P2
- **Rules:** R30, R31, R32
- **Root Cause Layer:** **Express API** (no launch transition, no scheduled job) + **Angular UI** (no PIR UI)
  - `server/routes/approvals.js` — No `launch` endpoint that would auto-set `pir_due_date` and `pir_status`.
  - `server/index.js` — No scheduled job for PIR reminders or enforcement.
  - Angular — No PIR submission page, no PIR sign-off flow, no condition resolution UI.
  - DB `npa_projects` — `pir_status`, `pir_due_date` columns exist. Ready but unwritten.
  - DB `npa_post_launch_conditions` — Table exists with correct schema. Populated in seed-demo only.
- **Business Rule:** PIR mandatory for NTG (6 months post-launch), for products with conditions, and GFM extends to ALL launched products.
- **Expected:** When product launched, system auto-schedules PIR. Sends reminders at 120, 150, 173 days. PIR has its own sign-off process.
- **Actual:** `pir_status` and `pir_due_date` columns exist. `npa_post_launch_conditions` table tracks conditions. But no auto-scheduling, no reminders, no PIR sign-off workflow.
- **Fix:**
  1. When stage → LAUNCHED: auto-set `pir_due_date = launched_at + 6 months`, `pir_status = 'PENDING'`
  2. Scheduled job: send PIR reminders at configurable intervals
  3. Create PIR sign-off workflow (simplified version of NPA sign-off)
  4. Track condition resolution against PIR
- **Effort:** L (1 week)

#### GAP-012: Notional Threshold Escalation Not Implemented
- **Severity:** P2
- **Rules:** R40, R41, R42
- **Root Cause Layer:** **MCP Tool** (no threshold logic in signoff creation) + **Express API** (no validation)
  - MCP tool `governance_create_signoff_matrix` — Creates signoffs but doesn't check `notional_amount` to add Finance VP/CFO.
  - `server/routes/approvals.js` — No threshold check when signoffs are created via any route.
  - DB `npa_projects.notional_amount` — Column exists and is populated. Just never checked.
  - No `ref_notional_thresholds` reference table (thresholds are not even stored as config).
- **Business Rule:** >$20M needs ROAE analysis, >$50M needs Finance VP, >$100M needs CFO.
- **Expected:** System checks `notional_amount` and automatically adds required reviews/approvals.
- **Actual:** `notional_amount` stored in DB but never checked against thresholds. No ROAE requirement tracking.
- **Fix:**
  1. In sign-off assignment logic: check notional_amount against thresholds
  2. If >$20M: flag ROAE analysis as required document
  3. If >$50M: add Finance VP to sign-off parties
  4. If >$100M: add CFO to sign-off parties
- **Effort:** S (1 day)

#### GAP-013: Approval Actions Not Wired to Backend
- **Severity:** P2
- **Rules:** R25, R26
- **Root Cause Layer:** **Angular UI** (local state only) + **Express API** (no transition endpoints)
  - `approval-dashboard.component.ts`:
    - `submit()` (line ~460) — Updates `item.stage` locally. NO API call to persist stage change.
    - `approve()` (line ~475) — Updates `item.stage` + `signOffMatrix` locally. NO API call.
    - `requestRework()` (line ~498) — Updates local state. NO API call.
    - `finalApprove()` (line ~520) — Updates local state. NO API call.
    - `checkIfAllSignedOff()` (line ~556) — Local loop, auto-transitions. NO API call.
  - `server/routes/approvals.js` — Only has `PUT /:id/signoffs/:signoffId/decision` (sign-off CRUD). No dedicated transition endpoints (submit, checker-approve, final-approve, etc.).
  - This is the **single most critical wiring gap** — the entire approval workflow is ephemeral.
- **Business Rule:** Maker submits, Checker approves, SOPs sign off, COO final approves.
- **Expected:** Each action persists to DB via API, triggers state transition, creates audit log.
- **Actual:** Frontend approval-dashboard has all the UI logic (submit, approve, requestRework, finalApprove) but these operate on LOCAL COMPONENT STATE only. The `NpaService.updateNpa()` method is called but it's a generic PUT that may not enforce state transitions server-side. Sign-off decisions call `ApprovalService.signoffDecision()` which DOES hit the server, but stage transitions happen client-side and may not persist correctly.
- **Impact:** Refreshing the page may lose approval state. Stage transitions may not be persisted.
- **Fix:**
  1. Create dedicated server endpoints for each transition:
     - POST `/api/npas/:id/submit` (DRAFT → PENDING_CHECKER)
     - POST `/api/npas/:id/checker-approve` (PENDING_CHECKER → PENDING_SIGN_OFFS)
     - POST `/api/npas/:id/request-rework` (PENDING_SIGN_OFFS → RETURNED_TO_MAKER)
     - POST `/api/npas/:id/final-approve` (PENDING_FINAL_APPROVAL → APPROVED)
  2. Each endpoint validates current stage, enforces transition rules, creates audit log
  3. Frontend calls these endpoints instead of doing local state manipulation
- **Effort:** M (3-4 days)

---

### P3 — MEDIUM (Nice to Have / Future Enhancement)

#### GAP-014: NPA Lite Sub-Types Not Differentiated
- **Severity:** P3
- **Rules:** R12, R13, R14, R15
- **Root Cause Layer:** **DB Schema** (no sub-type column) + **Dify Prompt** (CLASSIFIER doesn't output sub-type) + **MCP Tool** (no sub-type field in `classify_determine_track`)
- **Business Rule:** 4 distinct NPA Lite sub-types: Impending Deal (B1), NLNOC (B2), Fast-Track Dormant (B3), Addendum (B4). Each has different rules.
- **Actual:** `approval_track = 'NPA_LITE'` is a single value. No sub-type tracking.
- **Fix:** Add `approval_track_subtype` column or extend `approval_track` to `NPA_LITE_B1`, `NPA_LITE_B2`, etc.
- **Effort:** M (2-3 days)

#### GAP-015: Conditional Approval (APPROVED_CONDITIONAL) Has No UI
- **Severity:** P3
- **Rules:** R23, R24
- **Root Cause Layer:** **Angular UI** (no button/modal)
  - `approval-dashboard.component.ts` — Approve action sets `status='APPROVED'` only. No "Approve with Conditions" path.
  - TypeScript `approval.model.ts` — `APPROVED_CONDITIONAL` type IS defined. Ready to use.
  - DB `npa_signoffs.decision` — Accepts any string. Schema supports it.
  - DB `npa_post_launch_conditions` — Table exists with correct schema. Just needs a UI to write to it.
- **Business Rule:** SOPs can approve with conditions (permanent restrictions, product parameters, post-launch conditions).
- **Actual:** TypeScript type exists. DB supports it. But no UI button triggers it. No condition entry form.
- **Fix:** Add "Approve with Conditions" button in sign-off UI. Add condition entry modal. Persist to `npa_post_launch_conditions`.
- **Effort:** M (2-3 days)

#### GAP-016: No Dispute Resolution / Escalation Workflow
- **Severity:** P3
- **Rules:** R39
- **Root Cause Layer:** **Angular UI** (no escalate button) + **Express API** (no escalation endpoint)
  - Angular — No "Escalate Issue" button in rework/return-to-maker views.
  - `server/routes/approvals.js` — No POST endpoint for creating escalations.
  - DB `npa_escalations` — Table exists with correct schema. Ready to receive escalation records.
- **Business Rule:** Unresolved issues between Maker and SOPs → escalate to COO, Location Head, RMG-OR.
- **Actual:** `npa_escalations` table exists but is never written to from the approval flow. No dispute flagging.
- **Fix:** Add "Escalate" button on rework requests. Create escalation workflow with notification.
- **Effort:** M (2 days)

#### GAP-017: Audit Logging Not Comprehensive
- **Severity:** P3
- **Rules:** Standard §2.10
- **Root Cause Layer:** **Express API** (no audit middleware)
  - `server/routes/approvals.js` — Sign-off decision endpoint does NOT create audit log entry.
  - `server/routes/npas.js` — CRUD operations do NOT create audit log entries.
  - `server/routes/governance.js` — Classification save does NOT create audit log entry.
  - No `server/middleware/audit.js` exists — no reusable audit helper.
  - DB `npa_audit_log` — Rich schema with `confidence_score`, `reasoning`, `citations`. Only populated by seed-demo.
  - MCP tools — Some tools (e.g., `classify_determine_track`) create their own audit entries. But Express routes do not.
- **Business Rule:** All NPA documents and decisions must be maintained in the bank's operational risk management system.
- **Actual:** `npa_audit_log` table exists with rich schema (confidence, reasoning, citations). But only seed-demo populates it. No route writes audit entries on real actions.
- **Fix:** Add audit logging middleware/function. Call on every stage transition, sign-off decision, agent action, document upload.
- **Effort:** M (2-3 days)

#### GAP-018: Document Upload Not Functional
- **Severity:** P3
- **Rules:** Standard §Part C
- **Root Cause Layer:** **Express API** (no upload endpoint) + **Angular UI** (button exists but no backend wiring)
  - `server/routes/` — No file upload endpoint. No `multer` middleware installed.
  - Angular NPA Detail DOCUMENTS tab — Upload UI button exists but calls no endpoint.
  - DB `npa_documents` — Full schema with `file_path`, `file_size`, `mime_type`, `validation_status`. Ready.
  - MCP tool `documents` module — Has tools for document metadata, but no file storage integration.
- **Business Rule:** NPA requires comprehensive documentation (term sheets, risk memos, legal opinions, tax assessments).
- **Actual:** Upload button exists in NPA Detail UI. `npa_documents` table has full schema. But no file upload endpoint exists in Express. No file storage.
- **Fix:** Add multer middleware for file upload. Store in filesystem or cloud storage. Create CRUD endpoints for documents.
- **Effort:** M (3 days)

---

### P4 — LOW (Future Enhancement)

#### GAP-019: No Dormancy Detection
- **Severity:** P4
- **Rules:** R34
- **Root Cause Layer:** **DB Schema** (no transaction log) + **Express API** (no scheduled job)
  - No trade/transaction table exists in schema to track product usage.
  - No scheduled job to query activity and detect 12-month inactivity.
- **Fix:** Scheduled job to check transaction history and flag dormant products.
- **Effort:** M

#### GAP-020: No Approximate Booking Detection
- **Severity:** P4
- **Root Cause Layer:** **Dify Prompt** (MONITORING agent doesn't cover this) + **MCP Tool** (no proxy trade detection tool)
- **Business Rule:** GFM SOP requires monitoring of approximate booking (proxy trades).
- **Fix:** Add monitoring rule in MONITORING agent.
- **Effort:** S

#### GAP-021: ref_signoff_routing_rules Table Populated But Never Used
- **Severity:** P4 (but feeding into GAP-004 which is P1)
- **Root Cause Layer:** **Express API** (no code reads the table) + **MCP Tool** (`get_signoff_routing_rules` tool exists but never invoked by Dify GOVERNANCE workflow)
  - DB data is correct and ready. The MCP tool to read it exists. The Dify prompt just never triggers the tool call.
- **Actual:** This reference table has the right schema to drive dynamic sign-off assignment but zero code reads from it.
- **Fix:** Wire into GAP-004 fix.
- **Effort:** Included in GAP-004

#### GAP-022: No Real-Time Agent Health Monitoring
- **Severity:** P4
- **Root Cause Layer:** **Express API** (no health check endpoint) + **Angular UI** (dashboard shows static/mocked data)
  - `server/routes/dify-proxy.js` — `/agents/status` returns configured count from `dify-agents.js` config, not live health.
  - Angular COO Dashboard monitoring tab — Displays agent cards but data is partially mocked.
- **Actual:** Agent statuses in COO Dashboard monitoring tab are partially mocked. `/api/dify/agents/status` returns configured/unconfigured counts but not live health.
- **Fix:** Periodic health pings to each Dify app. Store latency and availability.
- **Effort:** S

---

## PART C: ARCHITECTURE CRITIQUE — STRUCTURAL OBSERVATIONS

### Observation 1: Display-Only Agents (No Write-Back Loop)

**Root Cause Layer:** **Angular UI** (`npa-detail.component.ts` `handleAgentResult()`) + **Express API** (no auto-persist endpoints)

All 9 workflow agents (CLASSIFIER, ML_PREDICT, RISK, AUTOFILL, GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION) are **dead-ends**. They produce display output but NEVER write their results back to the database.

**Example:** CLASSIFIER determines `type: 'New-to-Group', track: 'Full NPA'` but this is only stored if the frontend calls a separate API to save classification. If the user navigates away, the agent's work is lost.

**The fundamental problem:** Agent results live in Angular component state (memory), not in persistent storage. There's no reconciliation loop between what agents decide and what the DB reflects.

**Note:** MCP tools DO have write capabilities (e.g., `classify_determine_track` writes to DB). The issue is that Dify agents call MCP tools for some operations, but the Angular UI's `handleAgentResult()` method only maps outputs to component properties — it doesn't trigger a second API call to persist the agent's decision.

**Recommendation:** After each wave completes, auto-persist agent results:
- CLASSIFIER → update `npa_projects.npa_type`, `approval_track`, `classification_confidence`
- RISK → insert/update `npa_risk_checks` rows
- AUTOFILL → update `npa_form_data` rows
- GOVERNANCE → update `npa_signoffs` assignment
- DOC_LIFECYCLE → update `npa_documents` validation status
- MONITORING → update `npa_performance_metrics`

### Observation 2: Frontend State Machine vs Backend State Machine

**Root Cause Layer:** **Angular UI** (`approval-dashboard.component.ts` — lines 460-564) + **Express API** (`approvals.js` — pure CRUD, no transition guards)

The approval workflow state machine lives **primarily in the Angular component** (`approval-dashboard.component.ts`), not in the Express backend. Stage transitions are computed client-side and persisted via generic PUT calls.

**Specifically:** `submit()`, `approve()`, `requestRework()`, `finalApprove()`, `checkIfAllSignedOff()` — ALL update local component variables. None make dedicated API calls. The Express API has no transition-specific endpoints — only generic CRUD.

**Risk:** Two browser tabs could make conflicting state transitions. No optimistic locking. No server-side validation of "is this transition legal from the current state?"

**Recommendation:** Move state machine to server. Create dedicated transition endpoints with guards.

### Observation 3: Fused Dify Apps — Disambiguation Risk

**Root Cause Layer:** **Dify Prompt** (single prompt handles 4 agent modes) + **Dify Platform** (configuration decision)

4 logical agents (GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION) share one Dify app (`WF_NPA_Governance_Ops`), disambiguated by an `agent_mode` input parameter. The Dify prompt in `KB_NPA_Governance_Ops.md` must switch behavior based on `agent_mode`. If the prompt doesn't properly disambiguate, the wrong agent's behavior could execute.

**Recommendation:** Monitor output quality per agent_mode. Consider splitting if accuracy differs between modes.

### Observation 4: Wave Execution — No Dependency Awareness

**Root Cause Layer:** **Angular UI** (`npa-detail.component.ts` — wave execution with `setTimeout`) + **Dify Service** (`dify.service.ts` — `runWorkflow()` receives static inputs)

Waves fire on fixed timers (0ms, 2000ms, 4000ms). But logically:
- GOVERNANCE needs CLASSIFIER results (to know which SOPs to assign)
- AUTOFILL needs CLASSIFIER results (to know product type for template selection)
- RISK should run BEFORE CLASSIFIER (prohibited check first)

**Current:** All agents receive the same static inputs (product description from DB). They don't receive other agents' outputs. `runWorkflow()` in `dify.service.ts` always sends the same payload regardless of what prior agents returned.

**Recommendation:** Re-order waves:
1. Wave 0: RISK (prohibited check)
2. Wave 1: CLASSIFIER + ML_PREDICT (if not prohibited)
3. Wave 2: AUTOFILL (using classification result), GOVERNANCE (using classification for SOP assignment)
4. Wave 3: DOC_LIFECYCLE, MONITORING

Use RxJS `switchMap`/`concatMap` instead of `setTimeout`. Pass prior wave outputs as inputs to later waves.

### Observation 5: No Authentication/Authorization

**Root Cause Layer:** **Express API** (no auth middleware in `server/index.js` or route files)

No auth middleware on any Express route. Any HTTP client can call any endpoint. In production, this means:
- Anyone can approve/reject NPAs
- Anyone can read all NPA data
- Anyone can invoke Dify agents (consuming API credits)

No `passport`, `jsonwebtoken`, or session middleware installed. No role-based access control. Not a business logic gap per se, but a foundational security gap that will need to be addressed before any real deployment.

---

## PART D: ROOT CAUSE DISTRIBUTION BY LAYER

| Layer | Gaps Where This Layer Is Primary/Contributing Cause | Key Pattern |
|-------|-----------------------------------------------------|-------------|
| **Express API** | GAP-001, 002, 003, 004, 005, 006, 007, 010, 011, 012, 013, 016, 017, 018, 019, 021, 022 (17 of 22) | **Pure CRUD passthrough. ZERO business rule enforcement. No transition endpoints, no scheduled jobs, no middleware guards.** |
| **Angular UI** | GAP-001, 005, 007, 013, 015, 022 (6 of 22) | Wave order wrong (R01). Approval state machine is LOCAL COMPONENT STATE ONLY — `submit()`, `approve()`, `finalApprove()` update variables, not DB. |
| **MCP Tools** | GAP-003, 004, 007, 012, 014, 020, 021 (7 of 22) | MCP tools exist for some operations but DON'T enforce business rules (e.g., `governance_create_signoff_matrix` doesn't check cross-border, notional thresholds, or routing rules). |
| **Dify Prompts** | GAP-003, 008, 009, 014, 020 (5 of 22) | Prompts describe business logic in natural language but rely on LLM reasoning for enforcement. No deterministic guards for critical rules. |
| **DB Schema** | GAP-005, 008, 009, 014, 015, 019, 043/044 (5 of 22) | Schema is STRONG for implemented features (41 tables). Missing tables only for features that don't exist yet (bundling, evergreen, dormancy). |
| **All Layers** | GAP-008, 009, 012-R15, 028, 039 (6 of 22) | Entire workflows that have zero implementation across any layer (bundling, evergreen, NPA Lite sub-types, dispute resolution). |

**Key Insight:** The Express API is the bottleneck in **17 of 22 gaps**. The DB schema is well-designed but the Express layer between it and the frontend/agents is a pure passthrough that enforces nothing. Fix the Express layer first.

---

## PART E: SUMMARY SCORECARD

| Area | Rules | Passing | Gap Rate | Worst Gap |
|------|-------|---------|----------|-----------|
| Product Classification | 10 | 2 | 80% | R01: Prohibited not enforced as gate |
| Approval Track Routing | 9 | 0 | 100% | R11-R19: No dynamic track routing |
| Sign-Off Party Logic | 7 | 2 | 71% | R19: Hardcoded SOPs |
| Lifecycle & Validity | 8 | 1 | 88% | R27-R29: No validity management |
| Loop-Backs & Escalation | 5 | 1 | 80% | R35: Circuit breaker not enforced |
| Thresholds & Special | 5 | 0 | 100% | R40-R44: Zero threshold logic |

**Overall: 6 of 44 rules fully implemented (14%). 86% gap rate.**

**However:** The foundational infrastructure is STRONG:
- 41 DB tables with correct schema
- Reference tables pre-populated with rules
- Agent routing graph is clean and well-designed
- UI has all the right pages and tabs
- The "wiring" between components is the main gap, not the components themselves

---

*End of Gap Register*
