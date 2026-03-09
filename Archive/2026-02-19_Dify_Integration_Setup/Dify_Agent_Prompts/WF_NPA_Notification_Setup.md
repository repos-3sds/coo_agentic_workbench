# NOTIFICATION Workflow — Dify Setup Guide
# Updated: 2026-02-20 | Version: 3.0 — Dedicated app (split from super-app)

## Dify App Type: WORKFLOW (Agent Node with tool-calling)

The Notification Agent is a **Tier 4 stateless workflow** — it receives alert context, calls 5 MCP tools for notification delivery, deduplication, escalation chains, and acknowledgment tracking, then returns structured JSON.

### Architecture
```
NPA_ORCHESTRATOR (Tier 2) → switchAgent('NOTIFICATION')
  └── WF_NPA_Notification (Tier 4, DIFY_KEY_NOTIFICATION)
        └── 5 MCP Tools (notifications + audit)
```

---

## Step 1: Create Workflow App
1. Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Notification`
3. Description: "Alert delivery, deduplication, escalation chains, severity-based routing, daily digest generation."

## Step 2: Workflow Node Layout
```
[START] → [Knowledge Retrieval] → [Agent Node: Notification] → [END]
```

### START — Input Variables
| Variable | Type | Required | Default |
|----------|------|----------|---------|
| project_id | string | yes | — |
| context | string | yes | "{}" |

### Knowledge Retrieval
- Dataset: `KB_Notification_Agent.md`
- Query: `{{project_id}}`
- Top K: 5, Score: 0.5

### Agent Node
- Model: Claude 3.5 Sonnet | Temperature: 0.1 | Max Tokens: 2000
- Agent Strategy: Function Calling (recommended) or ReAct
- Max Iterations: 5 (notification may chain: pending check → send → audit log)
- System Prompt: Copy from `WF_NPA_Notification_Prompt.md`
- **User Message Template**:
```
Process notification for this NPA:

Project ID: {{project_id}}
Context: {{context}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the notification result.
```
- Tools: 5 Custom Tools (see Step 3)

## Step 3: Custom Tools (5) — via OpenAPI Import

In the Agent Node, click **"Add Tool"** > **Custom Tool** > Import from OpenAPI spec URL: `{MCP_SERVER_URL}/openapi.json`
Select ONLY the 5 tools listed below:

| # | Tool | Category |
|---|------|----------|
| 1 | `send_notification` | Notifications |
| 2 | `get_pending_notifications` | Notifications |
| 3 | `mark_notification_read` | Notifications |
| 4 | `audit_log_action` | Audit |
| 5 | `get_npa_by_id` | Utility |

**Note:** Workflow apps use Custom Tools (OpenAPI import). Chatflow apps use MCP Tools (MCP SSE plugin).

## Step 4: KB Upload
Upload `KB_Notification_Agent.md` to Dify Knowledge dataset.

## Step 5: API Key
Add to `.env`: `DIFY_KEY_NOTIFICATION=app-xxxxx`

## Step 6: Test

```bash
# Test: SLA breach notification (Full NPA, 72h SLA breached by Finance)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"NOTIFICATION","inputs":{"project_id":"NPA-2026-001","context":"{\"alert_type\":\"SLA_BREACH\",\"severity\":\"CRITICAL\",\"details\":{\"sop\":\"Finance\",\"hours_overdue\":12,\"approval_track\":\"FULL_NPA\"}}"}}'

# Test: Circuit breaker alert (3 loop-backs detected)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"NOTIFICATION","inputs":{"project_id":"NPA-2026-008","context":"{\"alert_type\":\"CIRCUIT_BREAKER\",\"severity\":\"CRITICAL\",\"details\":{\"loopback_count\":3}}"}}'
```
