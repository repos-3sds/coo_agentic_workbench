# COO Multi-Agent Workbench — Agent Test Report

**Date:** 2026-02-27
**Test Project:** `NPA-f2d96cc5538c452ba501ab5efc27d5ec` (Green Bond ETF - MBS-FTSE Green Bond Index Fund, NPA-2026-1111111)
**Environment:** Express backend (localhost:3000) → Dify API (api.dify.ai/v1)
**Tester:** Claude Code (Automated)

---

## Executive Summary

| # | Agent | Dify Status | Returns Usable JSON? | UI Displays Data? | DB Persists? | Verdict |
|---|-------|-------------|---------------------|-------------------|-------------|---------|
| 1 | **RISK** | succeeded | YES | YES (partial) | YES (12 rows) | PASS (with issues) |
| 2 | **CLASSIFIER** | succeeded | NO — empty trace | Fallback only | YES (1 row, score=0) | FAIL |
| 3 | **ML_PREDICT** | succeeded | NO — empty trace | Synthesized from classifier | YES (1 row) | FAIL |
| 4 | **GOVERNANCE** | succeeded | NO — MCP tool timeout | "Not yet run" message | NO (0 signoffs) | FAIL |
| 5 | **DOC_LIFECYCLE** | succeeded | NO — Python trace dump | Spinner/loading | YES (agent_result only) | FAIL |
| 6 | **MONITORING** | succeeded | NO — empty trace | Synthesized from DB metrics | YES (monitoring_results) | PARTIAL |

**Overall: 1 of 6 agents returns structured data. 5 of 6 fail to produce final JSON output.**

---

## Test Methodology

1. Each agent was called via `POST /api/dify/workflow` with the test project ID
2. Raw Dify SSE stream was collected by the Express proxy (`dify-proxy.js`)
3. The `collectWorkflowSSEStream()` function assembled the final response
4. Response was captured before any frontend parsing (`parseJsonOutput`)
5. DB state was checked before and after each test

### Input Payload (from `buildWorkflowInputs()`)
```json
{
  "project_id": "NPA-f2d96cc5538c452ba501ab5efc27d5ec",
  "product_name": "Green Bond ETF - MBS-FTSE Green Bond Index Fund",
  "product_type": "Variation",
  "risk_level": "MEDIUM",
  "description": "ETF - Exchange-Traded Fund",
  "npa_type": "Variation",
  "classification": "NPA Lite",
  "notional_amount": null,
  "is_cross_border": false,
  "jurisdictions": "Singapore"
}
```

---

## Detailed Agent Test Results

### 1. RISK Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Risk` |
| Env Key | `DIFY_KEY_RISK` |
| API Response Status | `succeeded` |
| Output Format | `outputs.result` = String (markdown-fenced JSON) |
| Parseable? | YES — `parseJsonOutput` strips ` ```json ``` ` and parses |
| Response Size | ~33 KB |

**Output Structure (actual keys returned):**
```
risk_assessment         → { project_id, overall_risk_rating, overall_score, hard_stop, ... }
layer_results           → Array[5]: INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC_RULES, FINANCE_TAX
domain_assessments      → Array[7]: CREDIT, MARKET, OPERATIONAL, LIQUIDITY, LEGAL, REPUTATIONAL, CYBER
prerequisite_validation → { readiness_score, total_checks, passed, failed, pending, ... }
npa_lite_risk_profile   → { subtype, eligible, conditions_met[], conditions_failed[] }
pir_requirements        → { required, type, deadline_months, conditions[] }
validity_risk           → { valid, expiry_date, extension_eligible, notes }
circuit_breaker         → { triggered, loop_back_count, threshold, escalation_target }
evergreen_limits        → { eligible, notional_remaining, deal_count_remaining, flags[] }
notional_flags          → { finance_vp_required, cfo_required, roae_required, threshold_breached }
mandatory_signoffs      → Array[1]: strings
recommendations         → Array[12]: strings
sop_bottleneck_risk     → { bottleneck_parties[], estimated_days, critical_path }
```

**Rationale:** RISK is the ONLY agent returning clean markdown-fenced JSON. This is because the RISK Dify workflow is configured as a pure **Workflow** (not an Agent/ReAct loop), so it always produces a deterministic output.

**Issues Found:**
- Returns `overall_risk_rating: "CRITICAL"` and `hard_stop: true` due to sparse input data (the test NPA has minimal fields populated)
- All 5 layers return `status: "FAIL"` — this is technically correct given the empty form data, but misleading for a MEDIUM-risk Variation NPA
- `overall_score: 15` seems too low — the Risk agent is penalizing for missing data rather than actual risk

**DB Persistence:** 12 rows in `npa_risk_checks` (5 layer + 7 domain), 1 row in `npa_risk_assessment_summary`. Working correctly.

**UI Mapping:** `mapRiskAssessment()` → `RiskAssessment` interface. Maps correctly when JSON parses. The 4-layer cascade shows all 5 layers with expandable findings.

**Verdict:** PASS — but output quality depends on input completeness

---

### 2. CLASSIFIER Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Classify_Predict` |
| Env Key | `DIFY_KEY_CLASSIFIER` |
| API Response Status | `succeeded` |
| Output Format | `outputs.result` = Array[9] (ReAct agent trace) |
| Parseable? | NO — Array of trace objects, last item has `data: []` (empty) |
| Response Size | ~133 KB |

**What happened (trace analysis):**
1. **Round 1:** Called `ideation_get_prohibited_list` — retrieved 11KB of prohibited products list
2. **Round 2:** Called `classify_get_criteria` — retrieved 28 NTG classification criteria (15KB)
3. **Round 3:** LLM started thinking about scoring but **hit iteration limit before emitting final JSON**

**Last LLM thought (not structured output):**
> "I have the criteria. Now I need to score this product. However, with only 'NPA Product' as the description and no other meaningful information... I cannot properly assess ANY of the 29 criteria."

**Root Cause:** The Dify app `WF_NPA_Classify_Predict` is configured as a **ReAct Agent** (not a Workflow). It has a 3-round iteration limit. The LLM uses 2 rounds for tool calls and has only 1 round left to think — not enough to emit the final structured JSON.

**DB Persistence:** 1 row in `npa_classification_scorecards` with `total_score=0`, `calculated_tier='Variation'`, `approval_track='NPA Lite'`. This comes from the `extractFallbackFromText()` function, not from actual agent output.

**UI Mapping:** Shows "VARIATION" + "NPA LITE" badges with "Confidence 0%" — all from fallback defaults.

**Gaps:**
1. **Dify iteration limit must be increased** from 3 to at least 5 (2 tool calls + 2 analysis + 1 output)
2. **Input data is too sparse** — the agent receives `"NPA Product"` as description instead of the full Ideation payload
3. **The frontend `parseJsonOutput()` does NOT handle Array outputs** — it expects `outputs.result` to be a string

**Verdict:** FAIL — Agent never produces final JSON due to iteration limit

---

### 3. ML_PREDICT Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Classify_Predict` (same as CLASSIFIER) |
| Env Key | `DIFY_KEY_CLASSIFIER` |
| API Response Status | `succeeded` |
| Output Format | `outputs.result` = Array[6] (ReAct agent trace) |
| Parseable? | NO — last item has `data: []` (empty) |
| Response Size | ~13 KB |

**What happened (trace analysis):**
1. **Round 1:** Called `ideation_find_similar` — searched for similar NPAs, found 0 matches
2. **Round 2:** LLM planned to generate predictions but **hit iteration limit**

**Last LLM thought:**
> "No similar NPAs found. Given the extremely sparse input data... I cannot make meaningful predictions. However, I must still provide a prediction output."

**Root Cause:** Same as CLASSIFIER — ReAct agent with too-low iteration limit. Also, the `ideation_find_similar` MCP tool returns 0 matches because the test NPA has minimal metadata.

**DB Persistence:** 1 row in `npa_ml_predictions` — but populated from the `mapMlPrediction()` fallback logic (synthesized from classifier result), not from actual ML output.

**UI Mapping:** Shows synthesized data: approval_likelihood from classifier confidence, timeline_days from track type (25 for LITE, 45 for FULL).

**Verdict:** FAIL — Agent never produces final JSON

---

### 4. GOVERNANCE Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Governance` |
| Env Key | `DIFY_KEY_GOVERNANCE` |
| API Response Status | `succeeded` |
| Output Format | `outputs.result` = Array[16] (ReAct agent trace) |
| Parseable? | NO — last item has `data: []` (empty) |
| Response Size | ~72 KB |

**What happened (trace analysis):**
1. **Round 1:** Called `get_npa_by_id` — NPA not found in MCP database (returns error)
2. **Round 2:** Called `get_signoff_routing_rules` — retrieved FULL_NPA routing rules (7KB)
3. **Round 3:** Called `governance_create_signoff_matrix` — **FAILED: MCP endpoint timeout** (`mcp-tools-ppjv.onrender.com` unreachable)
4. **Round 4:** Retried `governance_create_signoff_matrix` — **FAILED again** (same timeout)
5. **Round 5:** Called `audit_log_action` — Hit iteration limit (5/5)

**Root Causes:**
1. **External MCP tool server is DOWN** — `mcp-tools-ppjv.onrender.com/tools/governance_create_signoff_matrix` is timing out. This wastes 2 of 5 iterations on retries.
2. **`get_npa_by_id` returns "not found"** — The MCP tools database is separate from our Express/MariaDB. The test NPA doesn't exist there.
3. **Iteration limit of 5 is too low** when 2 iterations are wasted on MCP failures.

**DB Persistence:** 0 rows in `npa_signoffs`. The `npa_agent_results` row has `agent_type='governance'` but the result_data is the raw trace (unparseable).

**UI Mapping:** Sign-Off tab shows error message: "Governance workflow failed or timed out during analysis. Click 'Refresh Analysis' to retry." (This is from our FIX 4 — governance failure detection.)

**Gaps:**
1. **MCP tools server must be brought online** or tools must be replaced with direct DB queries
2. **Dify iteration limit should be 8+** to account for tool failures
3. **The Governance agent's prompt should include fallback logic**: if MCP tools fail, generate signoff matrix from the routing rules it already retrieved

**Verdict:** FAIL — MCP tool infrastructure failure + iteration limit

---

### 5. DOC_LIFECYCLE Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Doc_Lifecycle` |
| Env Key | `DIFY_KEY_DOC_LIFECYCLE` |
| API Response Status | `succeeded` |
| Output Format | TWO keys: `outputs.results` = Array[10] (trace), `outputs.result` = String (46KB Python repr) |
| Parseable? | NO — `outputs.result` is a Python repr dump of the trace, not JSON |
| Response Size | ~204 KB |

**What happened (trace analysis):**
1. **Round 1:** Called `get_document_requirements` — retrieved 10+ document requirements for FULL_NPA (12KB) ✅
2. **Round 2:** Called `check_document_completeness` — checked completeness, found approval_track=FULL_NPA, document requirements list ✅
3. **Round 3:** Called `audit_log_action` — **Hit iteration limit (3/3)**

**Critical Discovery:** The trace data CONTAINS useful structured information in the tool observation fields:
```json
{
  "approval_track": "FULL_NPA",
  "required_documents": ["NPA Submission Form", "Product Term Sheet", ...],
  "missing_documents": ["Product Term Sheet", "Risk Assessment Matrix", ...],
  "completeness_pct": 0,
  "critical_missing": 7
}
```

But this data is buried inside the trace `observation` field (as a `tool response: {...}` string), and the agent never gets to produce its final structured output because iteration limit = 3 is exhausted.

**Root Causes:**
1. **Iteration limit of 3 is FAR too low** — needs at least 5 (2 tool calls + 1 audit + 1 analysis + 1 output)
2. **`outputs.result` is Python repr format** — the Dify workflow serializes the trace as Python string instead of JSON
3. **Frontend `parseJsonOutput()` tries to parse this** but all attempts fail (logged as `[parseJsonOutput] All parse attempts failed`)

**DB Persistence:** `npa_agent_results` row exists with raw trace. `npa_documents` has some rows from the trace extraction attempt.

**UI Mapping:** Doc tab shows Document Dependency Matrix from `check_document_completeness` tool response extraction (partially working via our improved `parseJsonOutput`). Shows "Document completeness analysis in progress..." spinner.

**Gaps:**
1. **Increase iteration limit to 5+**
2. **Add output node to Dify workflow** that forces structured JSON output even if agent loop exhausts
3. **Fix parseJsonOutput** to extract data from `observation` fields in trace arrays

**Verdict:** FAIL — Useful data exists in trace but agent can't emit final JSON

---

### 6. MONITORING Agent

| Property | Value |
|----------|-------|
| Dify App | `WF_NPA_Monitoring` |
| Env Key | `DIFY_KEY_MONITORING` |
| API Response Status | `succeeded` |
| Output Format | `outputs.result` = Array[10] (ReAct agent trace) |
| Parseable? | NO — last item has `data: []` (empty) |
| Response Size | ~18 KB |

**What happened (trace analysis):**
1. **Round 1:** Called `get_npa_by_id` — NPA not found in MCP database
2. **Round 2:** Called `get_performance_metrics` — returned 0 snapshots (no performance data)
3. **Round 3:** Called `get_monitoring_thresholds` — **Hit iteration limit (3/3)**

**LLM noted:** "The current stage is INITIATION... post-launch monitoring only applies to products in LAUNCH or MONITORING stages."

**Root Causes:**
1. **Iteration limit of 3 is too low** (same pattern as other agents)
2. **MCP `get_npa_by_id` fails** — NPA doesn't exist in MCP tools database
3. **Monitoring is premature** — this NPA is at INITIATION stage, not LAUNCH/MONITORING

**DB Persistence:** `npa_monitoring_results` row exists with synthesized data from `mapBackendDataToView()`.

**UI Mapping:** Monitor tab shows synthesized metrics (Days Since Launch: 0, Volume: $0, etc.) — all from DB defaults, not from actual agent output.

**Verdict:** PARTIAL — Agent correctly identifies monitoring is premature, but can't emit structured response to say so

---

## Cross-Cutting Issues

### Issue A: Dify ReAct Agent vs Workflow Architecture

| Agent | Dify Type | Returns JSON? | Problem |
|-------|-----------|---------------|---------|
| RISK | **Workflow** | YES | None — deterministic output |
| CLASSIFIER | **ReAct Agent** | NO | Trace array, iteration limit |
| ML_PREDICT | **ReAct Agent** | NO | Trace array, iteration limit |
| GOVERNANCE | **ReAct Agent** | NO | Trace array, MCP failures |
| DOC_LIFECYCLE | **ReAct Agent** | NO | Trace array, Python repr |
| MONITORING | **ReAct Agent** | NO | Trace array, iteration limit |

**Recommendation:** Convert all 5 failing agents from ReAct Agent → **Workflow** type in Dify, OR increase iteration limits to 8+ and add a mandatory final output node.

### Issue B: MCP Tools Server Down

The external MCP tools server at `mcp-tools-ppjv.onrender.com` is:
- **Timing out** on `governance_create_signoff_matrix`
- **Returning "not found"** on `get_npa_by_id` (different database)

**Recommendation:** Replace external MCP tools with direct calls to our Express API endpoints that already have the data in MariaDB.

### Issue C: Input Data Poverty

The test NPA has:
- **npa_projects:** Only title, description, npa_type, risk_level populated (4 of 31 columns)
- **npa_form_data:** 76 rows, ALL with empty values
- **No Ideation payload persisted** to npa_projects columns

Agents receive minimal context and produce low-quality or "can't assess" responses.

**Recommendation:** Fix NPA creation flow to persist ALL Ideation Agent payload fields to `npa_projects` columns AND populate `npa_form_data` from payload.

### Issue D: Frontend parseJsonOutput Doesn't Handle Arrays

`parseJsonOutput()` expects `outputs.result` to be a **string**. When Dify returns an **Array** (ReAct trace), it falls through all parse attempts and returns fallback defaults.

**Recommendation:** Add Array handling to `parseJsonOutput()` — extract the last non-empty data item from trace, or extract tool observations.

### Issue E: Express Proxy Discards Text Chunks for Array Outputs

In `dify-proxy.js` line 477:
```javascript
if (textChunks && !Array.isArray(outputs.result)) {
    outputs.result = textChunks;
}
```
When `outputs.result` is an Array, any `text_chunk` SSE events are discarded. These text chunks might contain the final structured answer.

**Recommendation:** Always capture text chunks as a separate `outputs._textAnswer` field regardless of result type.

---

## Data Flow Gap Analysis

### Ideation Agent → NPA Creation

| Ideation Payload Field | npa_projects Column | Currently Saved? |
|------------------------|--------------------|--------------------|
| `product_name` | `title` | YES |
| `product_description` | `description` | YES |
| `product_type` | `npa_type` | YES (mapped) |
| `risk_level` | `risk_level` | NO |
| `notional_size` | `notional_amount` | NO |
| `is_cross_border` | `is_cross_border` | NO |
| `asset_class` | `product_category` | NO |
| `jurisdictions` | (needs npa_jurisdictions insert) | NO |
| `regulatory_framework` | — | NO (no column) |
| `target_market` | — | NO (no column) |
| `distribution_channel` | — | NO (no column) |
| `risk_features` | — | NO (no column) |
| `mandatorySignOffs` | (needs npa_signoffs insert) | NO |
| `classification_type` | `npa_type` | PARTIAL |

**Gap:** 10 of 14 Ideation payload fields are NOT persisted to `npa_projects`.

### Agent Output → UI State

| Agent | Expected UI State | Actual Data Source | Accurate? |
|-------|-------------------|-------------------|-----------|
| RISK | `riskAssessmentResult` with 5 layers + 7 domains | Dify JSON (works) + DB reload | YES |
| CLASSIFIER | `classificationResult` with scores + track | Fallback defaults (score=0) | NO |
| ML_PREDICT | `mlPrediction` with likelihood + timeline | Synthesized from classifier | NO |
| GOVERNANCE | `governanceState` with signoffs[] | Empty — no signoffs in DB | NO |
| DOC_LIFECYCLE | `docCompleteness` with missing docs | Partial from trace extraction | PARTIAL |
| MONITORING | `monitoringResult` with metrics + breaches | Synthesized from DB defaults | PARTIAL |

---

## Required Fixes (Priority Order)

### P0: Critical — Agent Output Extraction

1. **Fix `parseJsonOutput()` to handle Array (trace) outputs** — Extract tool observations from trace items
2. **Fix `dify-proxy.js` to preserve text chunks** as `outputs._textAnswer` even when result is Array
3. **Fix `collectWorkflowSSEStream()` to extract last agent thought** as structured data fallback

### P1: High — Dify Configuration Changes (User must update in Dify)

4. **Increase iteration limits**: CLASSIFIER 3→6, ML_PREDICT 3→5, GOVERNANCE 5→8, DOC_LIFECYCLE 3→6, MONITORING 3→5
5. **Add mandatory output format instruction** to each agent's system prompt forcing JSON output in last iteration
6. **Replace or fix MCP tools server** — `mcp-tools-ppjv.onrender.com` is unreachable

### P2: High — NPA Creation Data Persistence

7. **Fix POST /api/npas** to accept and persist all Ideation payload fields (risk_level, notional_amount, etc.)
8. **Fix `createNpaFromDraft()`** to send all payload fields in the create request
9. **Populate npa_form_data** from Ideation payload (not just empty scaffolding)

### P3: Medium — UX: DB-First + Background Refresh

10. **Implement DB-first loading** — always show cached data immediately on page visit
11. **Background Dify refresh** — call agents in background only if data is stale (>30 min)
12. **Progressive UI update** — when background refresh returns new data, update UI without destroying cached view

### P4: Low — UI Refinement

13. **Map UI components to actual agent output fields** (not assumed structure)
14. **Add proper loading/error states** for each tab based on agent status
15. **Show "data from X minutes ago" timestamp** on cached data

---

## Dify Prompt Changes Needed

### All ReAct Agents — Add to System Prompt:

```
CRITICAL OUTPUT REQUIREMENT:
You MUST produce your final structured JSON output within the last iteration.
If you are running low on iterations, STOP making tool calls and immediately
output your structured JSON response with whatever data you have collected.

Your response MUST be a valid JSON object wrapped in ```json ``` markers.
Never leave the conversation without producing structured output.
If tool calls failed, use reasonable defaults and note the failures in a
"warnings" array field.
```

### CLASSIFIER — Increase iterations from 3 to 6

### ML_PREDICT — Increase iterations from 3 to 5

### GOVERNANCE — Increase iterations from 5 to 8

### DOC_LIFECYCLE — Increase iterations from 3 to 6

### MONITORING — Increase iterations from 3 to 5

### GOVERNANCE — Fix MCP tools or add fallback:

```
If the governance_create_signoff_matrix tool fails or times out,
generate the signoff matrix yourself from the routing rules you retrieved.
Do NOT waste additional iterations retrying a failed tool call.
```

---

## Test Conclusion

The fundamental issue is an **architecture mismatch**: 5 of 6 agents are configured as Dify **ReAct Agents** with low iteration limits, causing them to exhaust iterations on tool calls before producing final structured output. Combined with a failing external MCP tools server and sparse input data, the result is that the frontend receives unparseable trace arrays instead of the structured JSON it expects.

**The RISK agent works because it's a Dify Workflow (deterministic), not a ReAct Agent.**

The recommended fix path is:
1. Increase Dify iteration limits (user action in Dify UI)
2. Fix parseJsonOutput to extract data from trace arrays (code fix)
3. Implement DB-first loading with background refresh (code fix)
4. Persist all Ideation payload fields at NPA creation (code fix)
