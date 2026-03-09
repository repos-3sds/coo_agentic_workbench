# DOC LIFECYCLE Workflow — Dify Setup Guide
# Updated: 2026-02-20 | Version: 3.0 — Dedicated app (split from super-app)

## Dify App Type: WORKFLOW (Agent Node with tool-calling)

The Doc Lifecycle Agent is a **Tier 3 stateless workflow** — it receives NPA context, calls 7 MCP tools for document requirement checking, completeness validation, upload tracking, and expiry enforcement, then returns structured JSON.

### Architecture
```
NPA_ORCHESTRATOR (Tier 2) → switchAgent('DOC_LIFECYCLE')
  └── WF_NPA_Doc_Lifecycle (Tier 3, DIFY_KEY_DOC_LIFECYCLE)
        └── 7 MCP Tools (documents + audit)
```

---

## Step 1: Create Workflow App
1. Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Doc_Lifecycle`
3. Description: "Document completeness checking, upload tracking, validation, expiry enforcement, version control."

## Step 2: Workflow Node Layout
```
[START] → [Knowledge Retrieval] → [Agent Node: Doc Lifecycle] → [END]
```

### START — Input Variables
| Variable | Type | Required | Default |
|----------|------|----------|---------|
| project_id | string | yes | — |
| approval_track | string | no | "" |
| current_stage | string | no | "" |
| is_cross_border | boolean | no | false |
| notional_amount | number | no | 0 |
| context | string | no | "{}" |

### Knowledge Retrieval
- Dataset: `KB_Doc_Lifecycle.md`
- Query: `{{project_id}} {{approval_track}} {{current_stage}}`
- Top K: 5, Score: 0.5

### Agent Node
- Model: Claude 3.5 Sonnet | Temperature: 0.1 | Max Tokens: 3000
- Agent Strategy: Function Calling (recommended) or ReAct
- Max Iterations: 5 (doc checks typically need 2-3 tool calls: requirements → completeness → validate)
- System Prompt: Copy from `WF_NPA_Doc_Lifecycle_Prompt.md`
- **User Message Template**:
```
Check document lifecycle for this NPA:

Project ID: {{project_id}}
Approval Track: {{approval_track}}
Current Stage: {{current_stage}}
Cross-Border: {{is_cross_border}}
Notional Amount: {{notional_amount}}
Context: {{context}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the document lifecycle result.
```
- Tools: 7 Custom Tools (see Step 3)

## Step 3: Custom Tools (7) — via OpenAPI Import

In the Agent Node, click **"Add Tool"** > **Custom Tool** > Import from OpenAPI spec URL: `{MCP_SERVER_URL}/openapi.json`
Select ONLY the 7 tools listed below:

| # | Tool | Category |
|---|------|----------|
| 1 | `upload_document_metadata` | Documents |
| 2 | `check_document_completeness` | Documents |
| 3 | `get_document_requirements` | Documents |
| 4 | `validate_document` | Documents |
| 5 | `doc_lifecycle_validate` | Documents |
| 6 | `audit_log_action` | Audit |
| 7 | `get_npa_by_id` | Utility |

**Note:** Workflow apps use Custom Tools (OpenAPI import). Chatflow apps use MCP Tools (MCP SSE plugin).

## Step 4: KB Upload
Upload `KB_Doc_Lifecycle.md` to Dify Knowledge dataset.

## Step 5: API Key
Add to `.env`: `DIFY_KEY_DOC_LIFECYCLE=app-xxxxx`

## Step 6: Test

```bash
# Test: Document completeness check (Full NPA, $75M triggers Credit Committee Memo)
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"DOC_LIFECYCLE","inputs":{"project_id":"NPA-2026-001","approval_track":"FULL_NPA","current_stage":"SIGN_OFF","notional_amount":75000000}}'
```
