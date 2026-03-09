# MONITORING Workflow — Dify Setup Guide
# Updated: 2026-02-20 | Version: 3.0 — Dedicated app (split from super-app)

## Dify App Type: WORKFLOW (Agent Node with tool-calling)

The Monitoring Agent is a **Tier 3 stateless workflow** — it receives NPA context, calls 12 MCP tools for post-launch performance monitoring, breach detection, PIR scheduling, dormancy detection, approximate booking analysis, and Evergreen annual review, then returns structured JSON.

### Architecture
```
NPA_ORCHESTRATOR (Tier 2) → switchAgent('MONITORING')
  └── WF_NPA_Monitoring (Tier 3, DIFY_KEY_MONITORING)
        └── 12 MCP Tools (monitoring + evergreen + audit)
```

---

## Step 1: Create Workflow App
1. Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Monitoring`
3. Description: "Post-launch monitoring, breach detection, PIR scheduling, dormancy detection, approximate booking detection, Evergreen annual review."

## Step 2: Workflow Node Layout
```
[START] → [Knowledge Retrieval] → [Agent Node: Monitoring] → [END]
```

### START — Input Variables
| Variable | Type | Required | Default |
|----------|------|----------|---------|
| project_id | string | yes | — |
| current_stage | string | no | "" |
| context | string | no | "{}" |

### Knowledge Retrieval
- Dataset: `KB_Monitoring_Agent.md`
- Query: `{{project_id}} {{current_stage}}`
- Top K: 5, Score: 0.5

### Agent Node
- Model: Claude 3.5 Sonnet | Temperature: 0.1 | Max Tokens: 3000
- Agent Strategy: Function Calling (recommended) or ReAct
- Max Iterations: 8 (monitoring may chain: metrics → breach check → alert → conditions → PIR)
- System Prompt: Copy from `WF_NPA_Monitoring_Prompt.md`
- **User Message Template**:
```
Perform post-launch monitoring for this NPA:

Project ID: {{project_id}}
Current Stage: {{current_stage}}
Context: {{context}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the monitoring result.
```
- Tools: 12 Custom Tools (see Step 3)

## Step 3: Custom Tools (12) — via OpenAPI Import

In the Agent Node, click **"Add Tool"** > **Custom Tool** > Import from OpenAPI spec URL: `{MCP_SERVER_URL}/openapi.json`
Select ONLY the 12 tools listed below:

| # | Tool | Category |
|---|------|----------|
| 1 | `get_performance_metrics` | Monitoring |
| 2 | `check_breach_thresholds` | Monitoring |
| 3 | `create_breach_alert` | Monitoring |
| 4 | `get_monitoring_thresholds` | Monitoring |
| 5 | `get_post_launch_conditions` | Monitoring |
| 6 | `update_condition_status` | Monitoring |
| 7 | `detect_approximate_booking` | Monitoring |
| 8 | `evergreen_list` | Evergreen |
| 9 | `evergreen_record_usage` | Evergreen |
| 10 | `evergreen_annual_review` | Evergreen |
| 11 | `audit_log_action` | Audit |
| 12 | `get_npa_by_id` | Utility |

**Note:** Workflow apps use Custom Tools (OpenAPI import). Chatflow apps use MCP Tools (MCP SSE plugin).

## Step 4: KB Upload
Upload `KB_Monitoring_Agent.md` to Dify Knowledge dataset.

## Step 5: API Key
Add to `.env`: `DIFY_KEY_MONITORING=app-xxxxx`

## Step 6: Test

```bash
# Test: Post-launch health check (product in monitoring stage)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"MONITORING","inputs":{"project_id":"NPA-2026-002","current_stage":"MONITORING","context":"{\"action\":\"CHECK_HEALTH\"}"}}'

# Test: Approximate booking detection (GAP-020)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"MONITORING","inputs":{"project_id":"NPA-2026-002","current_stage":"MONITORING","context":"{\"action\":\"DETECT_APPROXIMATE_BOOKING\",\"trade_id\":\"TRD-20260215-004\"}"}}'

# Test: PIR reminder check (product launched 130 days ago)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"MONITORING","inputs":{"project_id":"NPA-2026-002","current_stage":"MONITORING","context":"{\"action\":\"CHECK_PIR_STATUS\"}"}}'
```
