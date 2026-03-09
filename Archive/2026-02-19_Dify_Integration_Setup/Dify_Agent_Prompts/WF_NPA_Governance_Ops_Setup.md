# GOVERNANCE OPS Workflow — Dify Setup Guide
# Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 1.0

## Dify App Type: WORKFLOW (not Agent/Chat)

The Governance Ops Agent is a **Tier 3 stateless workflow SUPER-APP** — it serves 4 logical agents (GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION) dispatched via the `agent_mode` input field. It receives structured input, calls MCP tools for DB operations, and returns structured JSON output.

### Architecture Context

```
MASTER_COO (Tier 1, CF_COO_Orchestrator)
  └── NPA_ORCHESTRATOR (Tier 2, CF_NPA_Orchestrator)
        └── GOVERNANCE / DOC_LIFECYCLE / MONITORING / NOTIFICATION (Tier 3, WF_NPA_Governance_Ops)
              ├── 11 Governance MCP Tools
              ├── 5 Document MCP Tools
              ├── 7 Monitoring MCP Tools
              ├── 3 Notification MCP Tools
              └── 4 Utility MCP Tools
```

**Key:** This is a single Dify Workflow App (`WF_NPA_Governance_Ops`) that powers 4 logical agents based on the `agent_mode` input. The same API key (`DIFY_KEY_GOVERNANCE`) is used for all 4 modes. The NPA_ORCHESTRATOR calls this workflow with different `agent_mode` values depending on the user's intent.

---

## Step 1: Create Workflow App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Governance_Ops`
3. Description: "Super-app serving 4 logical agents — Governance sign-off orchestration, Document lifecycle management, Post-launch monitoring, and Notification engine. Dispatched via agent_mode input."

## Step 2: Workflow Node Layout

```
[START] → [Knowledge Retrieval] → [Agent Node: Governance Ops] → [END]
```

**IMPORTANT — Node type choice:**
- **Agent Node** (NOT LLM Node): This workflow needs tool-calling capability because it interacts with the database via 30 MCP tools. Use an **Agent Node** so the LLM can call tools in a loop.
- The Agent Node enables the LLM to: call `governance_get_signoffs`, record decisions, create escalations, check breaches, send notifications, etc.

### Node 1: START
Input variables (define in Workflow input schema):

```json
{
  "agent_mode": { "type": "string", "required": true, "options": ["GOVERNANCE", "DOC_LIFECYCLE", "MONITORING", "NOTIFICATION"], "description": "Which logical agent to activate" },
  "project_id": { "type": "string", "required": true, "description": "NPA project ID (e.g., NPA-2026-001)" },
  "approval_track": { "type": "string", "required": false, "default": "", "description": "FULL_NPA | NPA_LITE | BUNDLING | EVERGREEN" },
  "classification_type": { "type": "string", "required": false, "default": "", "description": "NTG | Variation | Existing" },
  "current_stage": { "type": "string", "required": false, "default": "", "description": "INITIATION | CLASSIFICATION | REVIEW | SIGN_OFF | LAUNCH | MONITORING | PIR" },
  "is_cross_border": { "type": "boolean", "required": false, "default": false },
  "npa_lite_subtype": { "type": "string", "required": false, "default": "", "description": "B1 | B2 | B3 | B4 (for NPA Lite only)" },
  "notional_amount": { "type": "number", "required": false, "default": 0, "description": "Notional in base currency (triggers threshold escalations)" },
  "context": { "type": "string", "required": false, "default": "{}", "description": "Mode-specific additional context as JSON string" }
}
```

### Node 2: Knowledge Retrieval (Recommended)
- **Dataset**: "NPA Governance Ops" (upload the KB docs — see Step 4)
  - `KB_Governance_Agent.md`
  - `KB_Doc_Lifecycle.md`
  - `KB_Monitoring_Agent.md`
  - `KB_Notification_Agent.md`
- **Query**: `{{agent_mode}} {{project_id}} {{approval_track}} {{current_stage}}`
  > **Dify constraint**: Knowledge Retrieval query accepts only **ONE variable**. If Dify doesn't allow concatenation, use `{{agent_mode}}` as the primary query — it determines which KB content is most relevant.
- **Top K**: 5
- **Score Threshold**: 0.5

### Node 3: Agent Node (Governance Ops)
- **Model**: Claude 3.5 Sonnet (or GPT-4o) — needs strong reasoning for multi-domain governance logic
- **System Prompt**: Copy from `WF_NPA_Governance_Ops_Prompt.md` (everything below the `---` line)
- **User Message Template**:
```
Execute the {{agent_mode}} mode for the following NPA:

Project ID: {{project_id}}
Approval Track: {{approval_track}}
Classification Type: {{classification_type}}
Current Stage: {{current_stage}}
Cross-Border: {{is_cross_border}}
NPA Lite Sub-Type: {{npa_lite_subtype}}
Notional Amount: {{notional_amount}}
Additional Context: {{context}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the complete result for the {{agent_mode}} mode.
```
- **Temperature**: 0.1 (deterministic governance decisions)
- **Max Tokens**: 6000 (governance output can be large with sign-off matrices)
- **Tools**: Configure all 30 MCP tools (see Step 3)

### Node 4: END
Output variables:
- `result`: The full Agent Node response (JSON string)

Map the Agent Node output to workflow output.

## Step 3: Configure MCP Tools

The Agent Node needs access to **30 MCP tools** across 5 categories. Configure the MCP server connection:

- **MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
- **OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

### Governance Tools (11 tools)
| # | Tool Name | Description |
|---|-----------|-------------|
| 1 | `governance_get_signoffs` | Get full sign-off matrix with SLA status |
| 2 | `governance_create_signoff_matrix` | Initialize sign-offs with SLA deadlines (auto-adds notional threshold signers) |
| 3 | `governance_record_decision` | Record approve/reject/rework with loop-back tracking |
| 4 | `governance_check_loopbacks` | Check loop-back count and circuit breaker status |
| 5 | `governance_advance_stage` | Move NPA to next workflow stage |
| 6 | `get_signoff_routing_rules` | Get routing rules by approval track |
| 7 | `check_sla_status` | Check SLA status, identify breaches |
| 8 | `create_escalation` | Create escalation at 1-5 authority levels |
| 9 | `get_escalation_rules` | Get escalation rules matrix |
| 10 | `save_approval_decision` | Record formal approval (CHECKER, GFM_COO, PAC) |
| 11 | `add_comment` | Add threaded comments with AI confidence |

### Document Tools (5 tools)
| # | Tool Name | Description |
|---|-----------|-------------|
| 12 | `upload_document_metadata` | Record document upload metadata |
| 13 | `check_document_completeness` | Check completeness against stage requirements |
| 14 | `get_document_requirements` | Get document requirements by track and stage |
| 15 | `validate_document` | Update document validation status |
| 16 | `doc_lifecycle_validate` | Batch end-to-end validation for stage gates |

### Monitoring Tools (7 tools)
| # | Tool Name | Description |
|---|-----------|-------------|
| 17 | `get_performance_metrics` | Get post-launch performance data |
| 18 | `check_breach_thresholds` | Evaluate metrics against thresholds |
| 19 | `create_breach_alert` | Create breach alerts with severity |
| 20 | `get_monitoring_thresholds` | Get configured thresholds |
| 21 | `get_post_launch_conditions` | Get conditions with overdue detection |
| 22 | `update_condition_status` | Update condition status |
| 23 | `detect_approximate_booking` | GAP-020: Detect proxy trades |

### Notification Tools (3 tools)
| # | Tool Name | Description |
|---|-----------|-------------|
| 24 | `send_notification` | Send alerts with severity and channel routing |
| 25 | `get_pending_notifications` | Check undelivered notifications |
| 26 | `mark_notification_read` | Acknowledge notification, stop escalation |

### Utility Tools (4 tools)
| # | Tool Name | Description |
|---|-----------|-------------|
| 27 | `audit_log_action` | Log to immutable audit trail |
| 28 | `audit_get_trail` | Retrieve audit trail for NPA |
| 29 | `get_npa_by_id` | Look up NPA project details |
| 30 | `check_audit_completeness` | Check audit entry coverage |

## Step 4: Upload KB Documents to Dify

1. Go to Dify > Knowledge > Create Dataset: "NPA Governance Ops"
2. Upload these files:
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Governance_Agent.md`
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Doc_Lifecycle.md`
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Monitoring_Agent.md`
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Notification_Agent.md`
3. Settings:
   - Indexing mode: High Quality
   - Chunk size: 1000 tokens
   - Chunk overlap: 100 tokens
   - Retrieval: Hybrid (keyword + semantic)

## Step 5: Get API Key

After publishing the workflow:
1. Go to App > API Access
2. Copy the API key
3. Add to `.env`: `DIFY_KEY_GOVERNANCE=app-xxxxx`
4. This single key is used for all 4 logical agents (GOVERNANCE, DOC_LIFECYCLE, MONITORING, NOTIFICATION) in `server/config/dify-agents.js`

## Step 6: Test via Express Proxy

### Test 1: GOVERNANCE Mode — Sign-Off Matrix Creation

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "GOVERNANCE",
    "inputs": {
      "agent_mode": "GOVERNANCE",
      "project_id": "NPA-2026-001",
      "approval_track": "FULL_NPA",
      "classification_type": "NTG",
      "current_stage": "SIGN_OFF",
      "is_cross_border": true,
      "npa_lite_subtype": "",
      "notional_amount": 75000000,
      "context": "{\"action\": \"CREATE_SIGNOFF_MATRIX\"}"
    }
  }'
```

**Expected output**: JSON with `action_taken: "CREATE_SIGNOFF_MATRIX"`, 7+ SOPs created (all 7 core + Finance VP for >$50M), 72-hour SLA deadlines, cross-border 5-party override applied, PAC status verified.

### Test 2: GOVERNANCE Mode — SLA Check with Breach

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "GOVERNANCE",
    "inputs": {
      "agent_mode": "GOVERNANCE",
      "project_id": "NPA-2026-001",
      "approval_track": "FULL_NPA",
      "current_stage": "SIGN_OFF",
      "context": "{\"action\": \"CHECK_SLA\"}"
    }
  }'
```

**Expected output**: JSON with SLA status per party, breached parties flagged, escalation recommendation if breach detected.

### Test 3: GOVERNANCE Mode — Circuit Breaker

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "GOVERNANCE",
    "inputs": {
      "agent_mode": "GOVERNANCE",
      "project_id": "NPA-2026-008",
      "approval_track": "FULL_NPA",
      "current_stage": "SIGN_OFF",
      "context": "{\"action\": \"CHECK_LOOPBACKS\"}"
    }
  }'
```

**Expected output**: For NPA-2026-008 (seed data has 3 loop-backs), should return `circuit_breaker_triggered: true`, `action_required: "AUTO_ESCALATE_TO_COO"`.

### Test 4: DOC_LIFECYCLE Mode — Completeness Check

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "DOC_LIFECYCLE",
    "inputs": {
      "agent_mode": "DOC_LIFECYCLE",
      "project_id": "NPA-2026-001",
      "approval_track": "FULL_NPA",
      "current_stage": "SIGN_OFF",
      "notional_amount": 75000000,
      "context": "{\"action\": \"CHECK_COMPLETENESS\"}"
    }
  }'
```

**Expected output**: JSON with completeness percentage, missing/expired documents, conditional rules triggered (Credit Committee Memo for >$50M), stage gate status.

### Test 5: MONITORING Mode — Breach Detection

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MONITORING",
    "inputs": {
      "agent_mode": "MONITORING",
      "project_id": "NPA-2026-007",
      "current_stage": "MONITORING",
      "context": "{\"action\": \"CHECK_BREACHES\"}"
    }
  }'
```

**Expected output**: JSON with health status, any threshold breaches, PIR status (NPA-2026-007 is launched), post-launch conditions.

### Test 6: MONITORING Mode — Approximate Booking Detection

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MONITORING",
    "inputs": {
      "agent_mode": "MONITORING",
      "project_id": "NPA-2026-007",
      "current_stage": "MONITORING",
      "context": "{\"action\": \"DETECT_APPROXIMATE_BOOKING\", \"trade_id\": \"TRD-20260220-001\"}"
    }
  }'
```

**Expected output**: JSON with composite risk score, detection signals, risk level, and recommended action.

### Test 7: NOTIFICATION Mode — SLA Breach Alert

```bash
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NOTIFICATION",
    "inputs": {
      "agent_mode": "NOTIFICATION",
      "project_id": "NPA-2026-001",
      "context": "{\"alert_type\": \"SLA_BREACH\", \"party\": \"Finance\", \"hours_overdue\": 12}"
    }
  }'
```

**Expected output**: JSON with notification sent to Finance approver + manager, priority HIGH, logged to audit trail.

## Step 7: Integration with Orchestrator

The NPA Orchestrator delegates to this workflow via `switchAgent()`:

1. User asks governance-related question (e.g., "What's the sign-off status?", "Are all documents uploaded?")
2. NPA Orchestrator detects OPS domain → `ROUTE_DOMAIN` with `target_agent: "GOVERNANCE"`
3. Angular `DifyService.switchAgent('GOVERNANCE')` pushes Orchestrator to delegation stack
4. Express proxy routes to `WF_NPA_Governance_Ops` with appropriate `agent_mode`
5. Workflow executes, calls MCP tools, returns JSON
6. `dify-proxy.js` extracts metadata via `extractWorkflowMeta()`
7. Angular renders result as `SHOW_GOVERNANCE` / `SHOW_DOC_STATUS` / `SHOW_MONITORING` card
8. `DifyService.returnToPreviousAgent()` pops back to Orchestrator

### Agent Action → agent_mode Mapping (in dify-proxy.js)

| User Intent | AgentAction | agent_mode | Response Card |
|-------------|-------------|------------|---------------|
| Sign-off status, approvals | SHOW_GOVERNANCE | GOVERNANCE | GovernanceStatusComponent |
| Document status, upload | SHOW_DOC_STATUS | DOC_LIFECYCLE | DocumentStatusComponent |
| Monitoring, breaches, PIR | SHOW_MONITORING | MONITORING | MonitoringDashboardComponent |
| Alert delivery | (internal) | NOTIFICATION | (background) |

## Step 8: Business Rule Checklist

Verify these business rules are correctly enforced:

| Rule | Source | Validation |
|------|--------|------------|
| NTG → PAC gate before NPA starts | Deep Knowledge §3.1 | `save_approval_decision` with `approval_type: "PAC"` |
| NTG → always FULL_NPA track | Deep Knowledge §3.1 | Routing rules enforce all 7 SOPs |
| Cross-border → 5 mandatory SOPs | Deep Knowledge §7 | `is_cross_border=true` adds Finance, Credit, MLR, Tech, Ops |
| Circuit breaker at 3 loop-backs | Deep Knowledge §12 | `governance_check_loopbacks` triggers at count ≥ 3 |
| FULL_NPA SLA = 72h | Deep Knowledge §4 | `governance_create_signoff_matrix` uses 72h |
| NPA_LITE SLA = 48h | Deep Knowledge §4 | Routing rules apply 48h SLA |
| Evergreen = 3 years validity | Deep Knowledge §9 | Validity tracking in output |
| Standard = 1 year validity | Deep Knowledge §10 | Validity tracking in output |
| Extension = once, +6 months, unanimous | Deep Knowledge §10 | Extension logic in governance output |
| Bundling = 8 conditions ALL must pass | Deep Knowledge §8 | Bundling Arbitration Team assessment |
| B3 fast-track = prior trade + no prohibited + PIR done | Deep Knowledge §4 B3 | B3 eligibility check |
| B4 addendum = no new features, validity NOT extended | Deep Knowledge §4 B4 | B4 scope enforcement |
| PIR within 180 days | Deep Knowledge §11 | Monitoring mode PIR schedule |
| PIR mandatory for ALL launched (GFM rule) | Deep Knowledge §11 | GFM stricter rule enforced |
| Dormant = 12+ months no transactions | Deep Knowledge §3.3 | GAP-019 detection |
| Dormant ≥ 3 years → GFM COO escalation | Deep Knowledge §3.3 | Escalation to Level 4 |
| Notional > $20M → ROAE required | Deep Knowledge §13 | GAP-012 in create_signoff_matrix |
| Notional > $50M → Finance VP | Deep Knowledge §13 | GAP-012 auto-add |
| Notional > $100M → CFO | Deep Knowledge §13 | GAP-012 auto-add |
| Prohibited items → HARD_STOP | Deep Knowledge §4 Track E | 3 layers: internal, regulatory, sanctions |
| Bundling Arbitration Team composition | Deep Knowledge §8 | 6 members per KB |
| Evergreen limits ($500M total, etc.) | Deep Knowledge §9 | Limit tracking in governance |
| Approximate booking detection | GAP-020 | Composite risk scoring (5 signals) |
| Policy hierarchy: stricter rule prevails | Deep Knowledge §1 | GFM SOP vs Group Standard |
