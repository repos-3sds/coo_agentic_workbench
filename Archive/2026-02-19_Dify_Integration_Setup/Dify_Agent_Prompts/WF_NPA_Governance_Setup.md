# GOVERNANCE Workflow — Dify Setup Guide
# Updated: 2026-02-20 | Version: 3.0 — Dedicated app (split from super-app)

## Dify App Type: WORKFLOW (Agent Node with tool-calling)

The Governance Agent is a **Tier 3 stateless workflow** — it receives NPA context, calls 13 MCP tools for sign-off matrix management, SLA monitoring, loop-back tracking, escalation, and stage advancement, then returns structured JSON.

### Architecture
```
NPA_ORCHESTRATOR (Tier 2) → switchAgent('GOVERNANCE')
  └── WF_NPA_Governance (Tier 3, DIFY_KEY_GOVERNANCE)
        └── 13 MCP Tools (governance + audit)
```

---

## Step 1: Create Workflow App
1. Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Governance`
3. Description: "Sign-off orchestration, SLA management, loop-backs, circuit breaker, escalations, PAC gating, stage advancement."

## Step 2: Workflow Node Layout
```
[START] → [Knowledge Retrieval] → [Agent Node: Governance] → [END]
```

### START — Input Variables
| Variable | Type | Required | Default |
|----------|------|----------|---------|
| project_id | string | yes | — |
| approval_track | string | no | "" |
| classification_type | string | no | "" |
| current_stage | string | no | "" |
| is_cross_border | boolean | no | false |
| npa_lite_subtype | string | no | "" |
| notional_amount | number | no | 0 |
| context | string | no | "{}" |

### Knowledge Retrieval
- Dataset: `KB_Governance_Agent.md`
- Query: `{{project_id}} {{approval_track}} {{current_stage}}`
- Top K: 5, Score: 0.5

### Agent Node
- Model: Claude 3.5 Sonnet | Temperature: 0.1 | Max Tokens: 4000
- Agent Strategy: Function Calling (recommended) or ReAct
- Max Iterations: 10 (governance may chain multiple tool calls: routing → matrix → SLA → decisions)
- System Prompt: Copy from `WF_NPA_Governance_Prompt.md`
- **User Message Template**:
```
Manage NPA governance workflow:

Project ID: {{project_id}}
Approval Track: {{approval_track}}
Classification Type: {{classification_type}}
Current Stage: {{current_stage}}
Cross-Border: {{is_cross_border}}
NPA Lite Sub-Type: {{npa_lite_subtype}}
Notional Amount: {{notional_amount}}
Context: {{context}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the governance action result.
```
- Tools: 13 Custom Tools (see Step 3)

## Step 3: Custom Tools (13) — via OpenAPI Import

In the Agent Node, click **"Add Tool"** > **Custom Tool** > Import from OpenAPI spec URL: `{MCP_SERVER_URL}/openapi.json`
Select ONLY the 13 tools listed below:

| # | Tool | Category |
|---|------|----------|
| 1 | `governance_get_signoffs` | Governance |
| 2 | `governance_create_signoff_matrix` | Governance |
| 3 | `governance_record_decision` | Governance |
| 4 | `governance_check_loopbacks` | Governance |
| 5 | `governance_advance_stage` | Governance |
| 6 | `get_signoff_routing_rules` | Governance |
| 7 | `check_sla_status` | Governance |
| 8 | `create_escalation` | Governance |
| 9 | `get_escalation_rules` | Governance |
| 10 | `save_approval_decision` | Governance |
| 11 | `add_comment` | Governance |
| 12 | `audit_log_action` | Audit |
| 13 | `get_npa_by_id` | Utility |

**Note:** Workflow apps use Custom Tools (OpenAPI import). Chatflow apps use MCP Tools (MCP SSE plugin).

## Step 4: KB Upload
Upload `KB_Governance_Agent.md` to Dify Knowledge dataset.

## Step 5: API Key
Add to `.env`: `DIFY_KEY_GOVERNANCE=app-xxxxx`

## Step 6: Test

```bash
# Test: Sign-off matrix creation (NTG, cross-border, $75M)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"GOVERNANCE","inputs":{"project_id":"NPA-2026-001","approval_track":"FULL_NPA","classification_type":"NTG","current_stage":"SIGN_OFF","is_cross_border":true,"notional_amount":75000000}}'

# Test: Circuit breaker (NPA-2026-008 has 3 loop-backs in seed data)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"GOVERNANCE","inputs":{"project_id":"NPA-2026-008","approval_track":"FULL_NPA","current_stage":"SIGN_OFF","context":"{\"action\":\"CHECK_LOOPBACKS\"}"}}'
```
