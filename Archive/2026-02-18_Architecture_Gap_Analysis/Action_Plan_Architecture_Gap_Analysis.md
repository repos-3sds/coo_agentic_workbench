# Action Plan: Agentic Architecture Gap Analysis & Critique
## COO Multi-Agent Workbench — Architecture vs. NPA Business Process Alignment

**Date:** 2026-02-18
**Prerequisite:** `NPA_Business_Process_Deep_Knowledge.md` (completed today)
**Objective:** Systematically compare what the NPA business process REQUIRES against what the architecture ACTUALLY implements, identify critical gaps, logic holes, and missing orchestration, then produce a prioritized remediation roadmap.

---

## Executive Summary

Having deeply studied the NPA business process (18-section report covering classification, approval tracks, sign-offs, bundling, evergreen, PIR, loop-backs, circuit breakers, cross-border rules, prohibited list checking, and 5 real NPAs), I now need to systematically compare those business rules against three layers of our implementation:

1. **The 13 logical agents** — Do they cover all business decision points?
2. **The 7 Dify apps** — Do their prompts/workflows implement the business rules correctly?
3. **The Express API + Angular UI** — Does the data flow support the full NPA lifecycle?

---

## Phase 1: Deep Codebase Audit (Understand What We Built)
**Goal:** Build a complete mental model of every component before critiquing

### Step 1.1 — Map the Agent Decision Logic
**What:** Read every Dify agent's actual prompt/workflow configuration (not the KB spec — the *actual* implementation)
**How:**
- Read `server/config/dify-agents.js` for agent registry (DONE via explore agent)
- Read `server/routes/dify-proxy.js` for envelope parsing contract (DONE)
- Trace what `@@NPA_META@@` actions each agent can emit (ROUTE_DOMAIN, DELEGATE_AGENT, FINALIZE_DRAFT, SHOW_ERROR, SHOW_RAW_RESPONSE)
- Map: Which agent can route TO which other agent? Is there a dead-end?

**Deliverable:** Agent routing graph (who calls whom, what actions trigger transitions)

### Step 1.2 — Map the Database State Machine
**What:** Understand every NPA stage transition and what triggers it
**How:**
- Read `npa_projects` stage/status columns and all valid values
- Read `npa_workflow_states` table for transition history
- Read `npa_signoffs` table for sign-off states
- Read `npa_loop_backs` table for loop-back tracking
- Read `npa_escalations` table for circuit breaker
- Trace: What code actually MOVES an NPA from stage A to stage B?

**Deliverable:** NPA state machine diagram (stages, transitions, triggers, guards)

### Step 1.3 — Map the UI Data Consumption
**What:** Understand what the frontend expects vs. what the backend provides
**How:**
- Cross-reference the 7 NPA Detail tabs against their data sources (DONE via explore)
- Identify which tabs show LIVE agent data vs. DB-persisted data vs. MOCKED data
- Identify which UI actions actually write back to the DB (approve, reject, rework, comment)

**Deliverable:** UI data dependency matrix (tab → service → endpoint → table → agent)

---

## Phase 2: Business Rule Extraction (What the Process DEMANDS)
**Goal:** Extract every testable business rule from the NPA process documentation

### Step 2.1 — Classification Rules Audit
**What:** Extract every classification rule from the deep knowledge report and verify implementation
**Rules to verify:**
- [ ] NTG triggers: brand new product, new role, new channel, new segment, new geography, new exchange
- [ ] Variation triggers: bundling, cross-book, accounting change, manual workarounds, ESG, fintech, new 3rd-party channels
- [ ] Existing sub-categories: new-to-location, dormant (<1yr, 1-3yr, ≥3yr), expired
- [ ] Prohibited check BEFORE classification (not after)
- [ ] PAC required for NTG BEFORE NPA starts
- [ ] Two-stage model enforced (Stage 1 classification THEN Stage 2 track selection)

**How:** Read the CLASSIFIER workflow inputs/outputs. Does it implement all 9 approval track branches?

### Step 2.2 — Approval Track Routing Rules
**What:** Verify all 5 tracks and their sub-types
**Rules to verify:**
- [ ] Full NPA: always for NTG, high-risk variation, expired+variations
- [ ] NPA Lite B1 (Impending Deal): 48-hour notice, any-SOP-objection fallback
- [ ] NPA Lite B2 (NLNOC): joint COO+MLR decision, no-objection concurrence
- [ ] NPA Lite B3 (Fast-Track Dormant): 5 criteria (live trade history, not prohibited, PIR done, no variation, no booking change)
- [ ] NPA Lite B4 (Addendum): live NPA only, no new features, no validity extension
- [ ] Bundling: 8-condition checker, arbitration team routing
- [ ] Evergreen: 3-year validity, 6 limit types, special liquidity exemption
- [ ] Prohibited: 3-layer hard stop (internal, regulatory, sanctions)

### Step 2.3 — Cross-Cutting Rules (Overrides)
**What:** Verify business rules that override normal flow regardless of track
**Rules to verify:**
- [ ] Cross-border → 5 mandatory SOPs (Finance, Credit, MLR, Tech, Ops) — cannot be waived
- [ ] NTG from overseas → Head Office sign-offs required
- [ ] Circuit breaker: 3 loop-backs → auto-escalate to Governance Forum
- [ ] Notional thresholds: >$20M ROAE, >$50M Finance VP, >$100M CFO
- [ ] Validity: 1-year default, one-time +6mo extension, unanimous SOP consensus
- [ ] PIR: mandatory for all NTG within 6 months, GFM extends to all launched products

### Step 2.4 — Sign-Off Party Logic
**What:** Verify SOP assignment logic
**Rules to verify:**
- [ ] Full NPA → ALL 7 SOPs engaged
- [ ] NPA Lite → reduced set based on risk areas
- [ ] Cross-border override → 5 mandatory regardless of track
- [ ] NTG from overseas → Head Office function sign-offs
- [ ] Non-NTG core markets → location sign-off party
- [ ] Non-NTG international centres → location or head office (discretion)
- [ ] Each SOP can set: permanent restrictions, product parameters, post-launch conditions

---

## Phase 3: Gap Identification (Where Architecture Fails Business)
**Goal:** Produce a definitive gap register with severity ratings

### Step 3.1 — Agent Coverage Gap Matrix
**What:** For each business decision point, does an agent handle it?

| Business Decision | Required Agent | Exists? | Correctly Implemented? | Gap Severity |
|-------------------|---------------|---------|----------------------|-------------|
| Prohibited check (4 layers) | RISK | Yes | Partial? | TBD |
| Two-stage classification | CLASSIFIER | Yes | TBD | TBD |
| NPA Lite sub-type routing | CLASSIFIER/GOVERNANCE | Yes | TBD | TBD |
| Bundling 8-condition check | CLASSIFIER | Yes | TBD | TBD |
| Evergreen limit tracking | MONITORING | Yes | TBD | TBD |
| Cross-border SOP override | GOVERNANCE | Yes | TBD | TBD |
| PIR scheduling & tracking | MONITORING | Yes | TBD | TBD |
| Circuit breaker detection | GOVERNANCE | Yes | TBD | TBD |
| Notional threshold escalation | GOVERNANCE | Yes | TBD | TBD |
| PAC pre-approval for NTG | ??? | ??? | TBD | TBD |
| Dormant reactivation logic | CLASSIFIER | Yes | TBD | TBD |
| Validity extension workflow | ??? | ??? | TBD | TBD |
| Approximate booking detection | ??? | ??? | TBD | TBD |

### Step 3.2 — Data Model Gap Analysis
**What:** For each business entity, is there a table? Are columns sufficient?

Check:
- [ ] Are all 4 NPA Lite sub-types representable in `npa_projects.approval_track`?
- [ ] Is bundling condition checklist stored anywhere?
- [ ] Are Evergreen limits tracked (notional consumed, deal count)?
- [ ] Is PAC approval status tracked as a prerequisite gate?
- [ ] Is validity expiry tracked with extension history?
- [ ] Is PIR status tracked with deadline and SOP sign-off?
- [ ] Are post-launch conditions tracked per SOP?
- [ ] Is the prohibited list stored and queryable?

### Step 3.3 — Orchestration Logic Gaps
**What:** Does the system actually enforce business process sequencing?

Check:
- [ ] Can an NTG product skip PAC and go straight to NPA? (should be impossible)
- [ ] Can an NPA be approved without all mandatory SOPs signed off?
- [ ] Can a cross-border NPA skip the 5 mandatory SOPs?
- [ ] Does the system actually enforce the 1-year validity (auto-expire)?
- [ ] Does the system enforce PIR within 6 months?
- [ ] Does the circuit breaker actually fire at loop-back #3?
- [ ] Can a prohibited product slip through to approval?
- [ ] Is Evergreen limit checking real-time or just display?

### Step 3.4 — UI Workflow Gaps
**What:** Can a user complete the full NPA lifecycle through the UI?

Check:
- [ ] Can a Maker create a new NPA via the ideation flow? (Yes — confirmed)
- [ ] Can a Checker review and approve/reject? (Partially — buttons exist, wiring TBD)
- [ ] Can SOPs sign off with conditions? (TBD)
- [ ] Can a COO give final approval? (TBD)
- [ ] Can the system handle loop-backs (return to maker)? (TBD)
- [ ] Is there a PIR workflow? (TBD)
- [ ] Is there an Evergreen trading workflow? (TBD)
- [ ] Can the system handle NPA Lite Impending Deal (48-hour notice)? (TBD)

---

## Phase 4: Critique & Findings Report
**Goal:** Produce the final deliverable — a prioritized, actionable findings report

### Step 4.1 — Write the Gap Register
Format per finding:

```
GAP-001: [Title]
Severity: CRITICAL / HIGH / MEDIUM / LOW
Business Rule: [Reference to NPA process]
Expected Behavior: [What should happen]
Actual Behavior: [What actually happens or is missing]
Impact: [What goes wrong if this isn't fixed]
Affected Components: [Agent / API / DB / UI]
Recommended Fix: [Specific action]
Effort Estimate: S / M / L / XL
```

### Step 4.2 — Categorize Gaps

**Category A: Business Logic Gaps** — Rules that should be enforced but aren't
**Category B: Missing Agent Capabilities** — Business decisions with no agent coverage
**Category C: Data Model Gaps** — Business entities with no table/column
**Category D: Orchestration Gaps** — Process sequencing not enforced
**Category E: UI/UX Gaps** — Lifecycle steps with no user interface
**Category F: Integration Gaps** — External systems not connected

### Step 4.3 — Prioritize by Business Impact

| Priority | Criteria | Examples |
|----------|----------|---------|
| P0 (Blocker) | Compliance/regulatory risk if not fixed | Prohibited product slipping through, sanctions bypass |
| P1 (Critical) | Core workflow broken | NTG skipping PAC, approvals without mandatory SOPs |
| P2 (High) | Important but has workaround | Manual Evergreen tracking, PIR reminders via email |
| P3 (Medium) | Nice to have | Better UI for loop-back visualization |
| P4 (Low) | Future enhancement | Multilingual support, advanced analytics |

---

## Phase 5: Remediation Roadmap
**Goal:** Produce a phased implementation plan for closing gaps

### Step 5.1 — Quick Wins (< 1 day each)
- DB column additions, config changes, prompt updates

### Step 5.2 — Short-Term Fixes (1-3 days each)
- New agent prompts, API endpoint additions, UI wiring

### Step 5.3 — Medium-Term Work (1-2 weeks each)
- New workflow agents, state machine enforcement, integration work

### Step 5.4 — Long-Term Initiatives (1+ month)
- External system integration, regulatory intelligence, regional expansion

---

## Execution Timeline

| Phase | Duration | Output |
|-------|----------|--------|
| Phase 1: Deep Codebase Audit | ~2-3 hours | Agent routing graph, state machine diagram, UI data matrix |
| Phase 2: Business Rule Extraction | ~1-2 hours | Testable rule checklist (40+ rules) |
| Phase 3: Gap Identification | ~2-3 hours | Gap register (preliminary) |
| Phase 4: Critique & Findings | ~2 hours | Final gap register + categorization + prioritization |
| Phase 5: Remediation Roadmap | ~1 hour | Phased implementation plan |

**Total estimated effort:** 8-11 hours of deep analysis work
**Deliverables location:** `Context/2026-02-18/`

---

## Deliverables Checklist

| # | Deliverable | File | Status |
|---|-------------|------|--------|
| 1 | NPA Business Process Deep Knowledge | `NPA_Business_Process_Deep_Knowledge.md` | DONE |
| 2 | Action Plan (this document) | `Action_Plan_Architecture_Gap_Analysis.md` | DONE |
| 3 | Agent Routing Graph | `Agent_Routing_Graph.md` | PENDING |
| 4 | NPA State Machine Diagram | `NPA_State_Machine.md` | PENDING |
| 5 | Business Rule Checklist | `Business_Rule_Checklist.md` | PENDING |
| 6 | Gap Register (Full Findings) | `Architecture_Gap_Register.md` | PENDING |
| 7 | Remediation Roadmap | `Remediation_Roadmap.md` | PENDING |

---

## Approach Philosophy

This is NOT a theoretical exercise. Every gap will be traced to:
1. A **specific business rule** from the NPA SOP/Standard
2. A **specific file** in the codebase (or absence of one)
3. A **specific consequence** if left unfixed (regulatory risk, workflow break, data loss)
4. A **specific fix** with effort estimate

The goal is a document you can hand to any developer and say "fix these, in this order."

---

*End of Action Plan*
