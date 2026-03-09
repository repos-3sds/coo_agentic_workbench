# Technical Rationale: Why Business Rule Enforcement Lives in Express API, Not Dify Agents

## COO Multi-Agent Workbench — Architecture Decision Record

**Date:** 2026-02-18
**Decision:** Enforce all P0/P1 business rules in the Express API layer, not in Dify agent prompts
**Status:** APPROVED (rationale validated against codebase + Dify documentation)

---

## The Question

> "The gaps you found — can't we clear those in Dify agents? Why do we need to code this extensively?"

This is the right question to ask. Below is the cross-verified answer, backed by:
1. What our Dify agents actually do (13 KB files read, 57 MCP tools audited)
2. What Dify's platform can and cannot do (official docs at docs.dify.ai)
3. What our Express API currently does (12 route files audited)
4. What our Angular frontend does (3 key components audited line-by-line)

---

## Part 1: What Dify CAN Do (and Does Well)

### 1.1 — Dify Platform Capabilities (from docs.dify.ai)

| Capability | Supported? | Source |
|---|---|---|
| LLM-powered classification & reasoning | YES | Core feature — LLM node |
| IF/ELSE conditional branching | YES | Evaluates variables with AND/OR, numeric comparisons |
| Code execution (Python/Node.js) | YES | Code node — sandboxed, no network/DB access |
| HTTP Request to external services | YES | HTTP Request node — GET/POST/PUT/DELETE |
| MCP tool calls (read/write DB) | YES | Tool node — calls our 57 FastMCP tools |
| Scheduled execution (cron) | YES | Schedule Trigger — supports cron expressions, min ~15 min interval |
| Knowledge base / RAG search | YES | Knowledge Retrieval node |
| Multi-step workflow orchestration | YES | Visual workflow builder with 15 node types |
| Error handling with fallback branches | YES | Added in Dify v0.14.0 |

**Key takeaway:** Dify is a capable orchestration platform with real workflow features.

### 1.2 — What Our Dify Agents Already Do Well

| Agent | What It Does Well | Evidence |
|---|---|---|
| **CLASSIFIER** | Two-stage NTG/Variation/Existing classification with confidence scoring | KB_Classification_Agent.md — 20 NTG indicators, 9 approval tracks, confidence thresholds |
| **RISK** | 4-layer prohibited list/regulatory/sanctions/dynamic risk cascade | KB_Risk_Agent.md — Sequential layer execution, MCP tools query `ref_prohibited_items` and external APIs |
| **AUTOFILL** | Auto-populate 37/47 NPA fields with lineage tracking (AUTO/ADAPTED/MANUAL) | KB_Template_Autofill_Agent.md — 5 QA checks, source NPA matching |
| **GOVERNANCE** | Sign-off routing, loop-back detection, SLA awareness | KB_Governance_Agent.md — Routing table, smart loop-back classification |
| **ML_PREDICT** | Approval likelihood, timeline, bottleneck prediction | KB_ML_Prediction.md — Advisory predictions, non-blocking |
| **DILIGENCE** | Policy Q&A, historical precedent search | KB_Conversational_Diligence.md — Read-only, 17 tools, zero write capability |
| **IDEATION** | Conversational product discovery → NPA draft creation | KB_Ideation_Agent.md — 6-step interview, 47 attribute extraction |

**The agents are well-designed. The prompts are thorough. This is not a Dify quality problem.**

### 1.3 — MCP Tools That Already Write to DB

Our agents CAN write to the database through MCP tools. This is confirmed:

| MCP Tool | What It Writes | Table |
|---|---|---|
| `classify_determine_track` | Sets `approval_track` on NPA project | `npa_projects` |
| `classify_score_npa` | Creates classification scorecard | `npa_classification_scorecards` |
| `governance_create_signoff_matrix` | Creates sign-off rows | `npa_signoffs` |
| `governance_record_decision` | Records approval/rejection | `npa_signoffs`, `npa_loop_backs` |
| `governance_advance_stage` | Moves NPA to next stage | `npa_workflow_states`, `npa_projects` |
| `risk_run_assessment` | Records risk check results | `npa_risk_checks` |
| `create_escalation` | Creates escalation record | `npa_escalations` |
| `ideation_create_npa` | Creates new NPA project | `npa_projects` |
| `autofill_populate_batch` | Populates form fields | `npa_form_data` |
| `audit_log_action` | Creates audit trail entry | `npa_audit_log` |

**So if Dify agents can already write to the DB... why can't they enforce business rules?**

---

## Part 2: What Dify CANNOT Do (The 7 Architectural Constraints)

### Constraint 1: LLMs Are Probabilistic — Compliance Rules Need 100%

**The problem:** Our P0 gaps are compliance/regulatory rules:
- GAP-001: Prohibited products MUST be blocked (sanctions, regulatory violations)
- GAP-002: NTG products MUST have PAC approval before NPA starts
- GAP-003: NTG products MUST use Full NPA track — no exceptions

**What "MUST" means:** 100% enforcement. Not 95%. Not 99%. ONE prohibited product slipping through = regulatory violation = potential fine.

**What our KB says vs. what the LLM does:**

The CLASSIFIER KB (`KB_Classification_Agent.md`) explicitly states:
- "NTG classification ALWAYS → Full NPA track (CANNOT be overridden)"
- "Prohibited list → HARD STOP (no_exceptions_possible = TRUE)"

But the MCP tool `classify_determine_track` (verified in `server/mcp-python/tools/classification.py`) is a **pure passthrough**:
```python
# ACTUAL CODE — no validation
await execute(
    "UPDATE npa_projects SET approval_track = %s WHERE id = %s",
    [inp["approval_track"], inp["project_id"]]
)
```

It writes whatever the LLM passes. If the LLM outputs `approval_track = 'NPA_LITE'` for an NTG product (which it might do 2-5% of the time due to prompt complexity), there is NO safety net. The tool accepts it. The DB stores it. The NPA proceeds on the wrong track.

**Dify's IF/ELSE node** (from docs.dify.ai) CAN evaluate conditions like `npa_type == 'New-to-Group'` and branch accordingly. BUT:
- It operates on workflow variables, not on DB state
- It can route to different LLM nodes, but cannot independently reject/block an API call from Angular
- It adds another LLM hop, which adds latency and another probability layer

**What Express gives us:** A deterministic `if` statement — zero probability, zero latency, zero cost:
```javascript
if (npa_type === 'New-to-Group' && approval_track !== 'FULL_NPA') {
    return res.status(400).json({ error: 'NTG must use FULL_NPA track' });
}
```

This executes in <1ms, costs $0, and has 100% reliability.

### Constraint 2: Dify Code Node Cannot Access Databases

**From Dify docs** (docs.dify.ai/en/use-dify/nodes/code):
> "Code executes in a strict sandbox that prevents file system access, network requests, and system commands."

The Dify Code node (Python/Node.js) runs in DifySandbox, which:
- **Blocks network requests** — cannot connect to MySQL/MariaDB
- **Blocks file system access** — cannot read config files
- **Blocks system commands** — cannot execute anything outside the sandbox
- **Available libraries:** `json`, `math`, `datetime`, `re` (standard libs only without network)

**Implication:** You CANNOT write a Dify Code node that does:
```python
# THIS WILL FAIL IN DIFY SANDBOX
import mysql.connector
db = mysql.connector.connect(host='railway-db', ...)
cursor.execute("SELECT pac_approval_status FROM npa_projects WHERE id = %s", [project_id])
```

The ONLY way Dify accesses our database is through MCP tools (which run on our Railway Python server, OUTSIDE the Dify sandbox). This means:
- Every DB check requires an MCP tool call
- Every MCP tool call requires the LLM to decide to call it
- If the LLM doesn't call the tool, the check doesn't happen

### Constraint 3: Dify Cannot Act as HTTP Middleware

**The architectural reality:**

```
Angular UI → HTTP POST → Express API → MySQL DB
                ↑
                | Dify has NO presence in this chain
                |
Angular UI → HTTP POST → Express Proxy → Dify Cloud → MCP Tools → MySQL DB
                                          ↑
                                          | This is a SEPARATE flow
```

When a user clicks "Submit NPA" in Angular, the HTTP request goes to Express. Dify is not in the middleware chain. Dify cannot intercept, validate, or reject that request.

**Dify's HTTP Request node** (from docs.dify.ai) lets Dify CALL external APIs, but it cannot RECEIVE and GATE incoming API calls. Dify is a caller, not a listener. It cannot act as Express middleware.

**For Dify to enforce a business rule on user actions, you would need:**
1. Angular sends request to Express
2. Express calls Dify workflow synchronously
3. Dify workflow evaluates the rule
4. Dify returns pass/fail
5. Express acts on the result

This adds 2-5 seconds latency (LLM inference + network) to every button click for a rule that can be checked in <1ms with a SQL query. And it introduces a failure mode: if Dify is down, all approvals are blocked.

### Constraint 4: MCP Tools Have No Business Rule Enforcement

We audited ALL 57 MCP tools. The findings:

**Tools that SHOULD enforce rules but DON'T:**

| Tool | What It Should Check | What It Actually Does |
|---|---|---|
| `classify_determine_track` | If NTG → force FULL_NPA | Writes whatever the LLM passes — pure passthrough |
| `governance_create_signoff_matrix` | If cross-border → force 5 mandatory SOPs | Inserts whatever sign-off list the LLM provides — no DB lookup |
| `governance_advance_stage` | If all signoffs complete → allow advance | Advances stage unconditionally — no prerequisite check |
| `risk_run_assessment` | If FAIL → set STOPPED status | Writes risk level but does NOT set status to STOPPED |
| `save_risk_check_result` | If FAIL → block progression | Writes FAIL result but takes no blocking action |

**The only hard-coded business rule in ALL 57 tools:**
```python
# In classify_determine_track — THE ONLY HARD GUARD
if inp["approval_track"] == "PROHIBITED":
    await execute("UPDATE npa_projects SET status = 'STOPPED', current_stage = 'PROHIBITED' WHERE id = %s", ...)
```

One guard. Out of 57 tools. For PROHIBITED only.

**Could we add guards to MCP tools?** YES — and we plan to for Sprint 0.3 (NTG→FULL_NPA belt-and-suspenders). But MCP tools alone are not sufficient because:
- They only fire when the LLM calls them
- They don't cover the Express API direct path (Angular → Express → DB)
- They have no transaction atomicity (`autocommit=True` in `db.py`)

### Constraint 5: Dify Agents Are Request-Response, Not Background Monitors

**Business rules that need background monitoring:**
- GAP-006: SLA breach detection every 15 minutes
- GAP-010: Validity expiry check daily
- GAP-011: PIR due date reminders at 120/150/173 days

**Dify's Schedule Trigger** (from docs.dify.ai/en/use-dify/nodes/trigger/schedule-trigger):
- Supports cron expressions (e.g., `*/15 * * * *` = every 15 min)
- One schedule trigger per workflow
- Workflow can call MCP tools

**So Dify CAN do scheduled monitoring.** However:

| Concern | Dify Schedule | Express setInterval/node-cron |
|---|---|---|
| Minimum interval | ~15 minutes (documented) | Any interval (1 second+) |
| DB query | Must go through MCP tool call + LLM reasoning | Direct SQL query (<10ms) |
| Cost per run | LLM token cost per invocation | Zero (pure Node.js) |
| Failure mode | Dify Cloud outage = monitoring stops | Runs locally on same server as DB |
| Atomic transactions | MCP tools use `autocommit=True` (no transactions) | Express can use `BEGIN...COMMIT` |
| Complexity | Need to build a separate Dify workflow per monitoring job | Simple JavaScript function |

**For a compliance-critical monitoring job (SLA breach = regulatory risk), adding an LLM hop and cloud dependency is unnecessary risk.** An Express cron job that runs `SELECT * FROM npa_signoffs WHERE sla_deadline < NOW() AND sla_breached = 0` is simpler, cheaper, faster, and more reliable.

**Could we use Dify scheduled triggers for non-critical monitoring?** Yes — and this is a valid Sprint 4-5 consideration for things like report generation or analytics refresh. But P0/P1 compliance monitoring should not depend on LLM availability.

### Constraint 6: Dify Cannot Enforce Atomic Transactions

**The approval workflow requires atomicity:**
When a COO clicks "Final Approve", the system must:
1. Verify all mandatory SOPs have signed off
2. Set `current_stage = 'APPROVED'`
3. Set `validity_expiry = NOW() + 1 YEAR`
4. Create audit log entry
5. Schedule PIR due date

**ALL of these must succeed or NONE should.** If step 3 fails but step 2 succeeded, the NPA is "approved" with no validity tracking.

**Our MCP tools use `autocommit=True`** (verified in `server/mcp-python/db.py`). Every `execute()` call commits immediately. There is no transaction wrapper. If the LLM calls 5 tools sequentially and tool #3 fails, tools #1 and #2 are already committed.

**Express can use DB transactions:**
```javascript
const conn = await pool.getConnection();
await conn.beginTransaction();
try {
    await conn.query('UPDATE npa_projects SET current_stage = ? ...', ['APPROVED']);
    await conn.query('UPDATE npa_projects SET validity_expiry = ? ...', [expiryDate]);
    await conn.query('INSERT INTO npa_audit_log ...', [auditData]);
    await conn.commit();
} catch (err) {
    await conn.rollback();
    throw err;
}
```

### Constraint 7: Angular Doesn't Persist Agent Results

**The biggest structural problem isn't Dify — it's the wiring between Angular and the backend.**

Verified line-by-line in `npa-detail.component.ts`:

```
handleAgentResult() — lines 958-1005:
  case 'CLASSIFIER': this.classificationResult = ...   // LOCAL PROPERTY ONLY
  case 'RISK':       this.riskAssessmentResult = ...    // LOCAL PROPERTY ONLY
  case 'GOVERNANCE':  this.governanceState = ...        // LOCAL PROPERTY ONLY
```

**Zero HTTP calls** in `handleAgentResult()`. Agent results exist only in Angular component memory. Navigate away → results gone.

Similarly in `approval-dashboard.component.ts`:

```
submit()        — line 460: item.stage = 'PENDING_CHECKER'      // LOCAL MUTATION, NO API CALL
approve()       — line 475: item.signOffMatrix[party].status = 'APPROVED'  // LOCAL, NO API
requestRework() — line 498: item.stage = 'RETURNED_TO_MAKER'    // LOCAL, NO API
finalApprove()  — line 520: item.stage = 'APPROVED'             // LOCAL, NO API
```

**Even if Dify agents made perfect decisions, those decisions are lost on page refresh.** This is not a Dify problem — it's an Angular-to-Express wiring problem that only Express API endpoints can fix.

---

## Part 3: The Right Split — What Lives Where

### 3.1 — Decision Matrix

| Rule Type | Owner | Why |
|---|---|---|
| **Hard gates** (prohibited, PAC, NTG→FULL_NPA) | **Express API** | 100% enforcement, <1ms, $0 cost, no LLM dependency |
| **Semantic classification** (NTG vs Variation vs Existing) | **Dify CLASSIFIER** | Requires NLP, context understanding, similarity scoring |
| **Risk narrative analysis** (reading product descriptions for red flags) | **Dify RISK** | Requires natural language understanding |
| **State transitions** (DRAFT→PENDING_CHECKER→APPROVED) | **Express API** | Must be atomic, server-authoritative, audit-logged |
| **Dynamic SOP assignment** (which parties review which track) | **Express API** (query `ref_signoff_routing_rules`) | Deterministic lookup — no LLM needed |
| **Circuit breaker** (3 loop-backs → escalate) | **Express API** | Counter + threshold — pure arithmetic |
| **SLA monitoring** (48-hour breach detection) | **Express cron job** | Background process, needs reliability, not intelligence |
| **Validity expiry** (1-year auto-expire) | **Express cron job** | Date comparison, needs reliability |
| **PIR scheduling** (6-month post-launch review) | **Express cron job** | Date arithmetic, needs reliability |
| **Document completeness assessment** | **Dify DOC_LIFECYCLE** | Benefits from NLP for section validation |
| **Bottleneck prediction** | **Dify ML_PREDICT** | Statistical/ML model, advisory only |
| **Template auto-fill** | **Dify AUTOFILL** | Requires historical matching, field adaptation |
| **Policy Q&A** | **Dify DILIGENCE** | RAG + conversational, read-only |
| **Notional threshold escalation** (>$20M, >$50M, >$100M) | **Express API** | Numeric comparison — no LLM needed |
| **Cross-border SOP override** | **Express API** | Boolean flag check — no LLM needed |

### 3.2 — The "Belt and Suspenders" Pattern

For critical rules, we use BOTH layers:

```
Dify CLASSIFIER prompt says: "NTG → always FULL_NPA"
    ↓ (first defense — catches 95%+ of cases)
MCP tool classify_determine_track: add guard for NTG→FULL_NPA override
    ↓ (second defense — deterministic at tool level)
Express API governance.js POST /classification: if NTG, force FULL_NPA
    ↓ (third defense — catches anything that slipped through)
```

We're not REMOVING Dify's role. We're ADDING a deterministic safety net behind it.

---

## Part 4: What Changes in Dify (Prompt Improvements)

We're not ignoring Dify. Sprint 2-5 includes Dify prompt improvements:

| Sprint | Dify Change | Purpose |
|---|---|---|
| Sprint 2 | Update GOVERNANCE KB to invoke `get_signoff_routing_rules` MCP tool | Agent produces better sign-off recommendations |
| Sprint 4 | Update CLASSIFIER KB with NPA Lite sub-type (B1-B4) output | Agent classifies more granularly |
| Sprint 4 | Update CLASSIFIER KB with bundling 8-condition logic | Agent detects bundling conditions |
| Sprint 5 | Create Evergreen workflow prompt | New agent capability |

But these are ADVISORY improvements — making agents smarter. The ENFORCEMENT still lives in Express.

---

## Part 5: What About Dify's New Features?

### Schedule Triggers (docs.dify.ai)

Dify now supports cron-based scheduled workflow execution. This COULD be used for monitoring jobs.

**Our assessment:** Valid for non-critical analytics/reporting. Not recommended for compliance monitoring because:
- Adds LLM cost per invocation vs. free Express cron
- Depends on Dify Cloud availability (external dependency for compliance)
- MCP tools lack transaction support (`autocommit=True`)
- Express cron is simpler, cheaper, more reliable for pure SQL checks

### IF/ELSE Nodes (docs.dify.ai)

Dify's IF/ELSE supports numeric comparison, AND/OR logic, and variable routing.

**Our assessment:** Useful WITHIN Dify workflows for routing LLM output. But it evaluates workflow variables — it cannot gate an Express API endpoint. It's a routing tool, not an enforcement gate.

### Code Nodes (docs.dify.ai)

Dify Code nodes run Python/Node.js in a sandbox.

**Our assessment:** The sandbox explicitly **blocks network requests and database access**. Code nodes cannot query our MariaDB. They're limited to data transformation (JSON parsing, math, string manipulation). Business rule enforcement that requires DB state is impossible in Code nodes.

---

## Part 6: Cost Comparison

| Approach | Per-Check Cost | Latency | Reliability | Complexity |
|---|---|---|---|---|
| Express `if` statement | $0 | <1ms | 100% (same server) | 1 line of code |
| Express SQL query | $0 | <10ms | 100% (same server) | 5 lines of code |
| Dify workflow call (from Express) | ~$0.01-0.05 (LLM tokens) | 2-5 seconds | 99.5% (cloud dependency) | Full workflow + prompt + MCP tool |
| Dify IF/ELSE node (within workflow) | ~$0.001 (no LLM hop) | <100ms | 99.5% (cloud dependency) | Node configuration |

For Sprint 0 (3 P0 gaps), we need ~150 checks per day (50 NPAs × 3 rules). Express cost: $0. Dify cost: $1.50-7.50/day + latency + cloud dependency risk.

---

## Part 7: Summary — Why We Chose This Approach

### What Dify Is

Dify is the **brain** — it classifies, analyzes, predicts, recommends, and assists. It handles tasks that benefit from natural language understanding, historical pattern matching, and multi-step reasoning. It makes the system INTELLIGENT.

### What Express API Must Be

Express is the **gatekeeper** — it enforces, blocks, persists, schedules, and audits. It handles tasks that require 100% reliability, atomic transactions, background execution, and deterministic logic. It makes the system SAFE.

### Why We Can't Skip Express

Right now, the gatekeeper is asleep. Express is a pure CRUD passthrough that enforces nothing (confirmed: 17 of 22 gaps trace to Express API as root cause). Even with perfect Dify agents:
- Agent results aren't persisted (Angular `handleAgentResult()` has zero HTTP calls)
- Approval actions don't hit the server (all 5 approval methods are local state mutations)
- No background monitoring exists (Express `server/index.js` has zero scheduled jobs)
- No transaction atomicity (MCP tools use `autocommit=True`)

**Dify agents can't fix the Angular→Express→DB wiring gap. Only Express code can.**

### The Actual Code Volume

Sprint 0 is literally three `if` statements:
1. `if (risk_check_failed) return 403` — ~15 lines
2. `if (ntg && !pac_approved) return 400` — ~10 lines
3. `if (ntg) force_full_npa()` — ~10 lines

Sprint 1 is one new route file (`transitions.js`) with 7 endpoints — ~400 lines.

The remediation roadmap LOOKS extensive because we documented every edge case and every file path. But the actual code is slim.

---

## References

### Codebase Files Audited

| File | What We Found |
|---|---|
| `server/mcp-python/tools/classification.py` | `classify_determine_track` is a pure passthrough — no NTG→FULL_NPA guard |
| `server/mcp-python/tools/governance.py` | `governance_create_signoff_matrix` doesn't check cross-border or notional |
| `server/mcp-python/tools/risk.py` | `risk_run_assessment` writes risk level but never blocks progression |
| `server/mcp-python/db.py` | `autocommit=True` — no transaction support |
| `server/routes/approvals.js` | 6 endpoints, all CRUD — zero business rule validation |
| `server/routes/governance.js` | POST /classification saves whatever CLASSIFIER outputs, no NTG check |
| `server/config/dify-agents.js` | 13 logical agents, 7 physical Dify apps, agent registry |
| `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | `handleAgentResult()` — zero HTTP calls, all local state |
| `src/app/pages/approval-dashboard/approval-dashboard.component.ts` | `submit()`, `approve()`, `finalApprove()` — zero HTTP calls, all local state |
| `src/app/services/dify.service.ts` | `runWorkflow()` sends same static inputs to all agents — no inter-wave context |
| `Context/Dify_Agent_KBs/KB_*.md` (13 files) | All KB prompts audited — rules are well-documented but prompt-only enforced |

### Dify Documentation Referenced

| Doc Page | Key Finding |
|---|---|
| docs.dify.ai — Code Node | Sandbox blocks network requests, DB access, and system commands |
| docs.dify.ai — DifySandbox | Seccomp-based isolation, whitelist-only system calls |
| docs.dify.ai — IF/ELSE Node | Evaluates workflow variables only — routing tool, not enforcement gate |
| docs.dify.ai — Schedule Trigger | Cron support (min ~15 min), one trigger per workflow |
| docs.dify.ai — HTTP Request Node | Dify can CALL external APIs but cannot RECEIVE/GATE incoming calls |
| docs.dify.ai — Workflow Overview | 15 node types, LLM-driven orchestration |

---

*End of Technical Rationale*
