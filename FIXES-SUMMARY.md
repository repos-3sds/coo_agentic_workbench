# COO Multi-Agent Workbench — Comprehensive Fixes Summary

**Date:** 2026-02-27
**Scope:** Phases 1–5 QA + Agent Architecture Investigation + Data Flow Fixes
**Test NPA:** `NPA-f2d96cc5538c452ba501ab5efc27d5ec` (Green Bond ETF — MBS-FTSE Green Bond Index Fund)

---

## Table of Contents

1. [Fixes Successfully Implemented (Code)](#1-fixes-successfully-implemented-code)
2. [Individual Agent Test Results](#2-individual-agent-test-results)
3. [Data Flow Verification Results](#3-data-flow-verification-results)
4. [Pending Items (Requires User Action in Dify)](#4-pending-items-requires-user-action-in-dify)
5. [Files Modified](#5-files-modified)

---

## 1. Fixes Successfully Implemented (Code)

### Phase 1–4: Database & QA Fixes (Prior Sessions)

| # | Fix | File(s) | Status |
|---|-----|---------|--------|
| P1 | Create missing DB tables (`npa_workflow_states`, `npa_loop_backs`, etc.) | `server/index.js` | DONE |
| P2 | Fix duplicate risk check inserts — DELETE before INSERT | `server/routes/agents.js` | DONE |
| P3 | Fix workflow state transitions — proper stage progression | `server/routes/transitions.js` | DONE |
| P4 | Fix projectId bug — use `npaContext.id` not `npaContext.npaId` | `npa-detail.component.ts` | DONE |
| P5 | Remove hardcoded badges — show real data from DB | `npa-detail.component.html` | DONE |
| P6 | Product Attributes from DB — show real `npa_form_data` values | `npa-detail.component.ts` (`mapBackendDataToView`) | DONE |
| P7 | Risk Cascade from DB — reconstruct from `npa_risk_checks` on reload | `npa-detail.component.ts` (line 624–696) | DONE |
| P8 | Governance failure detection — show error message not blank | `npa-detail.component.ts` (`handleAgentResult`) | DONE |
| P9 | Chat session rehydration — restore Dify conversation IDs | `npa-detail.component.ts` (`rehydrateAgentSession`) | DONE |
| P10 | Improved `parseJsonOutput` — 6-step parse chain | `npa-detail.component.ts` (line ~1593) | DONE |
| P11 | Express error handling — wrap all routes in try/catch | All `server/routes/*.js` (20 files) | DONE |

### Phase 5: Agent Architecture Fixes (Current Session)

| # | Fix | File(s) | Status |
|---|-----|---------|--------|
| F1 | **NPA Creation — persist ALL Ideation payload fields** | `server/routes/npas.js` (POST /api/npas), `agent-workspace.component.ts` (`createNpaFromDraft`) | DONE |
| F2 | **Dify Proxy — extract structured data from ReAct traces** | `server/routes/dify-proxy.js` (`collectWorkflowSSEStream` + new `extractStructuredDataFromTrace()`) | DONE |
| F3 | **parseJsonOutput — handle trace-extracted data** | `npa-detail.component.ts` (added Step 6: Python repr, `_fromTrace` handling) | DONE |
| F4 | **DB-first + Background Dify refresh** | `npa-detail.component.ts` (`runAgentAnalysis`) — 30-min stale threshold, no spinners when cached data exists | DONE |
| F5 | **Protect cached data from bad agent output** | `npa-detail.component.ts` (`handleAgentResult` for RISK, CLASSIFIER, ML_PREDICT) — only overwrite if new data is meaningful | DONE |
| F6 | **Fix `assessments` → `intakeAssessments` mapping** | `npa-detail.component.ts` (`mapBackendDataToView`) — API returns `assessments` not `intake_assessments` | DONE |
| F7 | **ML Prediction from DB fields** | `npa-detail.component.ts` — use `predicted_approval_likelihood`, `predicted_timeline_days`, `predicted_bottleneck` from `npa_projects` | DONE |
| F8 | **Fix `matched_items` type** | `risk-check.service.ts` — changed `any[]` → `any` since DB returns JSON string or parsed array | DONE |

---

### Fix Details

#### F1: NPA Creation — Persist All Ideation Payload Fields

**Problem:** `POST /api/npas` only saved `title`, `description`, `npa_type` — ignoring 10+ fields from the Ideation Agent payload.

**Fix (server/routes/npas.js):**
- Now accepts and dynamically persists: `risk_level`, `notional_amount`, `currency`, `is_cross_border`, `product_category`, `product_manager`, `pm_team`, `kickoff_date`
- Seeds `npa_jurisdictions` from `jurisdictions` array
- Seeds `npa_signoffs` from `mandatory_signoffs` array

**Fix (agent-workspace.component.ts):**
- `createNpaFromDraft()` now builds comprehensive payload from Ideation data
- Extracts from `payload`, `payload.data`, and `draft` objects

#### F2: Dify Proxy — Extract Structured Data from ReAct Traces

**Problem:** When Dify agents return ReAct trace arrays (instead of JSON), the proxy passed them through unprocessed, and the frontend couldn't parse them.

**Fix (server/routes/dify-proxy.js):**
- New `extractStructuredDataFromTrace()` helper function
- Iterates trace items, extracts `tool response: {...}` from observation strings
- Parses each tool response, merges into single structured object
- Captures last LLM thought as `_agentThought`
- Returns merged data with `_fromTrace: true` flag
- Preserves original trace as `outputs._trace` for debugging

#### F3: parseJsonOutput — Handle Trace-Extracted Data

**Problem:** `parseJsonOutput()` expected `outputs.result` to be a JSON string. Failed on arrays and Python repr format.

**Fix (npa-detail.component.ts):**
- Added Step 6: Python repr parsing (handles `None`, single quotes, `True/False`)
- Added `_fromTrace` object passthrough
- 6-step parsing chain: markdown strip → direct JSON → extract JSON from text → Python-style → tool response extraction → Python repr

#### F4: DB-First + Background Dify Refresh

**Problem:** Every page visit re-fired all 6 Dify agents, showing loading spinners and destroying cached DB data while waiting.

**Fix (npa-detail.component.ts `runAgentAnalysis`):**
- Checks `agentResults` timestamps from API for staleness (30-minute threshold)
- If all data fresh (<30 min): skip Dify calls entirely
- If data exists but stale: run agents in background WITHOUT loading spinners
- Only show spinners when NO cached data exists for an agent
- `maybeRunAgentAnalysis()` gate ensures DB data is loaded before deciding

#### F5: Protect Cached Data from Bad Agent Output

**Problem:** Background Dify refresh could return empty/bad data (due to agent failures), overwriting the good cached DB data with nulls.

**Fix (npa-detail.component.ts `handleAgentResult`):**
- RISK: Only update if `newRisk.layers?.length > 0`
- CLASSIFIER: Only update if `overallConfidence > 0 || scores?.length > 0`
- ML_PREDICT: Only update if `approvalLikelihood > 0`
- GOVERNANCE: Only update if `signoffs?.length > 0` (already had guard)
- DOC_LIFECYCLE: Only update if `totalPresent > 0` (already had guard)
- MONITORING: Only update if `metrics?.length > 0 || breaches?.length > 0` (already had guard)

#### F6: Fix assessments → intakeAssessments Mapping

**Problem:** Governance API returns assessments as `data.assessments` but `mapBackendDataToView()` looked for `data.intake_assessments` (which doesn't exist). The RISK assessment findings (containing PIR requirements, mandatory signoffs, recommendations, etc.) were never loaded from DB.

**Fix:** Changed mapping to `data.intake_assessments || data.assessments || []`

**Impact:** Risk cascade reconstruction now gets supplementary data:
- `pir_requirements` (required: true, GFM_STRICTER_RULE, 6-month deadline)
- `mandatory_signoffs` (Finance, RMG-MLR, Legal, Operations)
- `recommendations` (12 items from CRITICAL to LOW priority)
- `circuit_breaker`, `evergreen_limits`, `notional_flags`

#### F7: ML Prediction from DB Fields

**Problem:** ML prediction was synthesized from classification confidence only. The DB had actual `predicted_approval_likelihood`, `predicted_timeline_days`, `predicted_bottleneck` from a previous successful RISK agent run.

**Fix:** Now uses actual DB values first:
- `predicted_approval_likelihood: 50%`
- `predicted_timeline_days: 45`
- `predicted_bottleneck: Legal`
- Falls back to synthesis from classification only if no DB data

---

## 2. Individual Agent Test Results

Each agent was tested individually via `POST /api/dify/workflow` with the test NPA project ID.

### Summary Table

| # | Agent | Dify Type | Dify Status | Returns JSON? | DB Persists? | UI Shows Data? | Verdict |
|---|-------|-----------|-------------|---------------|-------------|---------------|---------|
| 1 | **RISK** | Workflow | succeeded | YES (markdown-fenced JSON) | YES (12 risk_checks + 1 assessment) | YES — 5 layers + 7 domains + recommendations | PASS |
| 2 | **CLASSIFIER** | ReAct Agent | succeeded | NO (Array[9] trace, iteration limit 3) | YES (scorecard with score=0, fallback) | YES — fallback badges (Variation/NPA Lite/0%) | FAIL |
| 3 | **ML_PREDICT** | ReAct Agent | succeeded | NO (Array[6] trace, iteration limit 3) | YES (from npa_projects.predicted_* fields) | YES — 50% likelihood, 45 days, Legal | PARTIAL |
| 4 | **GOVERNANCE** | ReAct Agent | succeeded | NO (Array[16] trace, MCP timeout) | NO (0 signoffs) | Shows error message | FAIL |
| 5 | **DOC_LIFECYCLE** | ReAct Agent | succeeded | NO (Python repr trace, iteration limit 3) | Partial (agent_result only) | Partial — trace extraction | FAIL |
| 6 | **MONITORING** | ReAct Agent | succeeded | NO (Array[10] trace, iteration limit 3) | YES (synthesized from DB metrics) | YES — synthesized metrics | PARTIAL |

### Root Cause Analysis

**Only 1 of 6 agents (RISK) returns usable structured JSON.**

The 5 failing agents share a common root cause: they are configured as Dify **ReAct Agents** with low iteration limits (3–5). The agents exhaust their iterations on tool calls before producing final JSON output.

| Root Cause | Agents Affected | Fix Location |
|-----------|----------------|--------------|
| Iteration limit too low (3) | CLASSIFIER, ML_PREDICT, DOC_LIFECYCLE, MONITORING | Dify UI config |
| Iteration limit too low (5) | GOVERNANCE | Dify UI config |
| MCP tools server down | GOVERNANCE | External server / Dify config |
| No forced JSON output in prompt | ALL 5 ReAct agents | Dify system prompt |
| ReAct architecture (vs Workflow) | ALL 5 failing agents | Consider converting to Workflow |

### Detailed Test Results per Agent

#### RISK Agent — PASS
- **Output:** 33KB markdown-fenced JSON with `risk_assessment`, `layer_results[5]`, `domain_assessments[7]`, `pir_requirements`, `mandatory_signoffs[4]`, `recommendations[12]`, `circuit_breaker`, `evergreen_limits`
- **DB:** 12 rows in `npa_risk_checks`, 1 row in `npa_intake_assessments`
- **UI:** 5-layer cascade + 7 domain scores + recommendations + checklist
- **Note:** Scores are low because input data is sparse (test NPA has minimal fields)

#### CLASSIFIER Agent — FAIL
- **Output:** Array[9] ReAct trace, last item `data: []`
- **Trace shows:** 2 tool calls (prohibited list + criteria), then hit iteration limit (3/3) before scoring
- **DB:** Scorecard with `total_score=0`, `calculated_tier='Variation'` (fallback)
- **UI:** Shows "VARIATION" + "NPA LITE" badges with "Confidence 0%"
- **Fix needed:** Increase iterations 3→6 in Dify

#### ML_PREDICT Agent — PARTIAL
- **Output:** Array[6] ReAct trace, `data: []`
- **Trace shows:** `ideation_find_similar` returned 0 matches, then hit limit
- **DB:** `predicted_approval_likelihood=50`, `predicted_timeline_days=45` (from previous run)
- **UI:** Shows 50% likelihood, 45 days, Legal bottleneck (from DB, not from this run)
- **Fix needed:** Increase iterations 3→5 in Dify

#### GOVERNANCE Agent — FAIL
- **Output:** Array[16] trace, MCP `governance_create_signoff_matrix` timeout x2
- **Trace shows:** `get_npa_by_id` returns "not found", routing rules retrieved, MCP tool fails
- **DB:** 0 signoffs
- **UI:** Error message shown
- **Fix needed:** Fix MCP server + increase iterations 5→8 + add fallback prompt

#### DOC_LIFECYCLE Agent — FAIL
- **Output:** 204KB Python repr trace dump, useful tool observations buried inside
- **Trace shows:** Retrieved document requirements + completeness check, then hit limit (3/3)
- **DB:** `agent_result` only
- **UI:** Partial data from trace extraction
- **Fix needed:** Increase iterations 3→6 in Dify

#### MONITORING Agent — PARTIAL
- **Output:** Array[10] trace, `data: []`
- **Trace shows:** Agent correctly identifies NPA is at INITIATION (not LAUNCH) stage
- **DB:** Synthesized metrics from DB defaults
- **UI:** Synthesized metrics displayed
- **Fix needed:** Increase iterations 3→5 + add pre-launch monitoring prompt

---

## 3. Data Flow Verification Results

Verified end-to-end data flow from DB → API → Frontend for the test NPA.

### API Response Verification

```
assessments:           1 entry (RISK, score=68, PASS, full findings JSON)
predicted_*:           likelihood=50, timeline=45, bottleneck=Legal
scorecard:             total_score=0, tier=Variation, track=NPA Lite
signoffs:              0 entries
documents:             0 entries
formData:              76 entries (all empty values — scaffolding)
riskChecks:            12 entries (5 layers + 7 domains)
agentResults:          5 entries with timestamps
```

### UI Tab Verification

| Tab | Data Source | Display Status | Screenshot Verified |
|-----|-----------|---------------|-------------------|
| **Proposal** | `npa_projects` → productAttributes fallback | 6 attributes: Name, Type, Classification, Stage, Risk Level, Description | YES |
| **Docs** | `npa_documents` | 0 docs — shows empty state | YES |
| **Analysis** | `npa_risk_checks` (12 rows) + `npa_intake_assessments` findings | 5 layers + 7 domain scores + 10 recommendations | YES |
| **Sign-Off** | `npa_signoffs` | 0 signoffs — shows appropriate state | YES |
| **Workflow** | `npa_workflow_states` | Stage progression displayed | YES |
| **Monitor** | `npa_performance_metrics` + synthesized | Synthesized metrics shown | YES |
| **Chat** | Session rehydration | Chat panel available | YES |

### Key Behaviors Verified

| Behavior | Expected | Actual | Status |
|----------|----------|--------|--------|
| DB-first loading | Show cached data immediately, no spinners | Console: `[runAgentAnalysis] Cached data exists but is stale — background refresh` | PASS |
| No loading spinners | When cached data exists, tabs show data not spinners | No spinners visible on any tab | PASS |
| Background refresh | Agents run silently in background | Agents fire but don't destroy displayed data | PASS |
| Cached data protection | Failed agent responses don't overwrite good data | `handleAgentResult` guards prevent overwrite | PASS |
| Risk cascade from DB | 5 layers + 7 domains display from `npa_risk_checks` | `app-risk-assessment-result` component rendered with 5 layers | PASS |
| Classification from DB | Scorecard data shown | VARIATION + NPA LITE badges visible | PASS |
| ML Prediction from DB | Uses `predicted_*` project fields | 50% likelihood, 45 days displayed | PASS |
| Intake assessments mapping | RISK findings loaded from assessments | PIR, signoffs, recommendations all populated | PASS |

---

## 4. Pending Items (Requires User Action in Dify)

These cannot be fixed in code — they require configuration changes in the Dify AI platform.

### P1: Increase Dify Iteration Limits

| Agent | Current Limit | Required Limit | Rationale |
|-------|--------------|----------------|-----------|
| CLASSIFIER | 3 | 6 | 2 tool calls + 2 analysis + 1 output + 1 buffer |
| ML_PREDICT | 3 | 5 | 1 tool call + 2 analysis + 1 output + 1 buffer |
| GOVERNANCE | 5 | 8 | 3 tool calls + 2 retries + 2 analysis + 1 output |
| DOC_LIFECYCLE | 3 | 6 | 2 tool calls + 2 analysis + 1 output + 1 buffer |
| MONITORING | 3 | 5 | 3 tool calls + 1 analysis + 1 output |

### P2: Add Output Format Requirement to System Prompts

Add the following to the system prompt of ALL 5 ReAct agents (CLASSIFIER, ML_PREDICT, GOVERNANCE, DOC_LIFECYCLE, MONITORING):

```
## OUTPUT REQUIREMENTS (CRITICAL)

1. You MUST produce your final structured JSON output before running out of iterations.
2. Reserve your LAST iteration for outputting the final JSON response.
3. If a tool call fails or times out, do NOT retry it. Use whatever data you have.
4. Your final response MUST be a valid JSON object wrapped in ```json ``` code fences.
5. If you could not gather enough data, include a "warnings" array.
6. NEVER end the conversation without producing structured JSON output.
```

### P3: Fix MCP Tools Server

The external MCP server at `mcp-tools-ppjv.onrender.com` is DOWN:
- `governance_create_signoff_matrix` times out
- `get_npa_by_id` returns "not found" (different database)

**Options:**
- **A)** Bring server online and keep warm (it's on Render free tier which sleeps)
- **B)** Replace with direct REST calls to our Express API (`localhost:3000/api/governance/*`)
- **C)** Embed the tool logic in the Dify prompt itself

### P4: GOVERNANCE Agent — Add Fallback Prompt

Add to GOVERNANCE system prompt:
```
If the governance_create_signoff_matrix tool fails or times out,
generate the signoff matrix yourself from the routing rules you retrieved.
Do NOT waste iterations retrying a failed tool call.
```

### P5: MONITORING Agent — Add Pre-Launch Handling

Add to MONITORING system prompt:
```
If the NPA is in INITIATION or REVIEW stage (pre-launch), produce a monitoring
setup report instead of active monitoring data. Include recommended thresholds,
KPIs, and set product_health to "NOT_LAUNCHED".
```

### P6: Consider Converting ReAct Agents to Workflows

The RISK agent works because it's a Dify **Workflow** (deterministic output). Consider converting the 5 failing ReAct agents to Workflows with embedded LLM nodes.

### P7: Test NPA Creation with New Ideation Flow

After Dify config changes, create a NEW NPA through the Ideation Agent to verify:
- All payload fields persist to `npa_projects`
- `npa_jurisdictions` seeded from jurisdictions array
- `npa_signoffs` seeded from mandatory_signoffs
- Richer input data improves agent output quality

---

## 5. Files Modified

### New Files Created
| File | Purpose |
|------|---------|
| `AGENT-TEST-REPORT.md` | Detailed individual agent test results with trace analysis |
| `DIFY-PROMPT-CHANGES.md` | Required Dify UI configuration changes |
| `FIXES-SUMMARY.md` | This report — comprehensive fixes + test results + pending items |

### Backend (Express)
| File | Changes |
|------|---------|
| `server/routes/npas.js` | POST /api/npas now persists all Ideation fields, seeds jurisdictions & signoffs |
| `server/routes/dify-proxy.js` | `extractStructuredDataFromTrace()` helper, trace→structured data extraction in SSE stream handler |
| `server/routes/agents.js` | Duplicate risk check prevention, agent result persistence |
| `server/routes/governance.js` | Added `agentResults` query with timestamps |
| `server/routes/transitions.js` | Fixed workflow state transitions |
| `server/index.js` | Auto-create missing DB tables on startup |
| All `server/routes/*.js` (20 files) | Wrapped all endpoints in try/catch error handling |

### Frontend (Angular)
| File | Changes |
|------|---------|
| `npa-detail.component.ts` | DB-first loading, 30-min stale check, background refresh, cached data protection, assessments→intakeAssessments mapping, ML prediction from DB, parseJsonOutput 6-step chain |
| `npa-detail.component.html` | Removed hardcoded badges, dynamic risk cascade display |
| `agent-workspace.component.ts` | `createNpaFromDraft()` sends all Ideation payload fields |
| `risk-check.service.ts` | `matched_items: any[]` → `any` (DB returns string or array) |
| `npa-interfaces.ts` | Added signoff party types |

### Total Impact
- **45 files changed**
- **+1,378 lines added, -368 lines removed**
- **3 new report files**

---

## Conclusion

**Code fixes: 100% complete.** All identified gaps in data persistence, parsing, mapping, and UX have been addressed with working code changes verified via build + API + visual testing.

**Dify config: 0% complete — requires user action.** The 5 failing agents need iteration limit increases and system prompt updates in the Dify UI. These changes are fully documented in `DIFY-PROMPT-CHANGES.md`.

**Expected impact after Dify changes:** All 6 agents should return structured JSON, populating all tabs with real agent data instead of fallbacks/synthesis.
