# CLASSIFIER Workflow — Dify Setup Guide
# Updated: 2026-02-19 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 2.4 — S1 (MCP URL), S2 (agent_id), S3 (Agent Node for tools), S4 (KB query single variable)

## Dify App Type: WORKFLOW (not Agent/Chat)

The Classifier is a **Tier 3 stateless workflow** — it receives structured input, runs classification logic, and returns structured output. No conversation state.

---

## Step 1: Create Workflow App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Classifier`
3. Description: "Dual-mode NPA Classification & Prediction. Classifies products into NTG/Variation/Existing with 29-criteria scorecard (21 NTG + 8 VAR) and generates ML predictions."

## Step 2: Workflow Node Layout

```
[START] → [Knowledge Retrieval] → [Agent Node: Classifier] → [END]
                                        ↕
                                   [10 MCP Tools]
```

**IMPORTANT — Dify Workflow node types**:
- **LLM Node**: Pure text-in/text-out. Cannot call tools.
- **Agent Node**: LLM + tool-calling loop. The LLM decides which tools to invoke based on reasoning.
- Since the Classifier needs to **conditionally** call MCP tools (e.g., only persist to DB when `project_id` is provided), use an **Agent Node**, not an LLM Node. Attach all 10 MCP tools directly to the Agent Node.

### Node 1: START
Input variables (define in Workflow input schema):

```json
{
  "agent_id": { "type": "string", "required": true, "description": "CLASSIFIER or ML_PREDICT — determines which mode the dual-app operates in" },
  "product_description": { "type": "string", "required": true },
  "product_category": { "type": "string", "required": false, "default": "" },
  "underlying_asset": { "type": "string", "required": false, "default": "" },
  "notional_amount": { "type": "number", "required": false, "default": 0 },
  "currency": { "type": "string", "required": false, "default": "USD" },
  "customer_segment": { "type": "string", "required": false, "default": "" },
  "booking_location": { "type": "string", "required": false, "default": "" },
  "counterparty_location": { "type": "string", "required": false, "default": "" },
  "is_cross_border": { "type": "boolean", "required": false, "default": false },
  "project_id": { "type": "string", "required": false, "default": "" }
}
```

**CRITICAL:** The `agent_id` field is required for the dual-mode dispatch logic in the LLM prompt (Section A vs Section B). If omitted, the workflow defaults to CLASSIFIER mode but the input schema should enforce it explicitly.

### Node 2: Knowledge Retrieval (Optional but recommended)
- **Dataset**: "NPA Classification" (upload the 3 KB docs)
  - `KB_Classification_Criteria.md`
  - `KB_Prohibited_Items.md`
  - `KB_Product_Taxonomy.md`
- **Query**: `{{product_description}}`
  > **Dify constraint**: Knowledge Retrieval query accepts only ONE variable. Use `product_description` as it contains the richest semantic context for retrieval.
- **Top K**: 5
- **Score Threshold**: 0.5

### Node 3: Agent Node (Classifier)
- **Model**: Claude 3.5 Sonnet (or GPT-4o) — needs strong reasoning for scoring
- **Agent Strategy**: Function Calling (recommended) or ReAct
- **Max Iterations**: 5 (allows tool calls for DB persistence when project_id is provided)
- **System Prompt**: Copy from `WF_NPA_Classifier_Prompt.md`
- **User Message Template**:
```
Agent Mode: {{agent_id}}

Classify this product:

Product Description: {{product_description}}
Product Category: {{product_category}}
Underlying Asset: {{underlying_asset}}
Notional Amount: {{notional_amount}} {{currency}}
Customer Segment: {{customer_segment}}
Booking Location: {{booking_location}}
Counterparty Location: {{counterparty_location}}
Cross-Border: {{is_cross_border}}
Project ID: {{project_id}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the classification result.
```
- **Temperature**: 0.1 (we want deterministic, consistent classification)
- **Max Tokens**: 4000
- **Tools**: Attach the 10 MCP tools listed in Step 3 directly to this Agent Node

### Node 4: END
Output variables:
- `result`: The full LLM response (JSON string)

Map the LLM output to workflow output.

## Step 3: Attach MCP Tools to Agent Node

In the Agent Node created in Step 2, add these 10 MCP tools. The Agent's LLM will decide which tools to call based on the input (e.g., skip DB writes when `project_id` is empty).

1. In the Agent Node settings, click **"Add Tool"**
2. Select **MCP** as the tool provider
3. Add each tool from the MCP server below

| # | MCP Tool | Purpose |
|---|----------|---------|
| 1 | `classify_get_criteria` | Read the 29 criteria from DB |
| 2 | `classify_assess_domains` | Write domain assessments to DB |
| 3 | `classify_score_npa` | Save scorecard to DB |
| 4 | `classify_determine_track` | Set approval track on project |
| 5 | `classify_get_assessment` | Read existing assessments |
| 6 | `ideation_get_prohibited_list` | Screen against prohibited items |
| 7 | `ideation_find_similar` | Find similar historical NPAs |
| 8 | `bundling_assess` | Assess whether product meets all 8 bundling conditions |
| 9 | `bundling_apply` | Apply bundling track and record condition results |
| 10 | `evergreen_list` | List products eligible for Evergreen (same-day) processing |

**MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
**OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

**NOTE**: Tools are optional for the classification logic itself — the Agent has the full criteria in its prompt and KB. The tools enable DB persistence when `project_id` is provided. The Agent LLM autonomously decides whether to call tools based on context.

**NOTE on MCP Tool Coverage**: The full COO Agentic Workbench MCP server exposes 87 total tools across 17 categories (ideation, classification, risk, governance, documents, monitoring, bundling, evergreen, escalation, approval, notification, audit, prerequisites, autofill, session, prospects, and KB search). This Classifier workflow uses 10 of those tools. Only attach the 10 tools listed above — loading all 87 tools overwhelms the LLM context window and causes timeouts.

## Step 4: Upload KB Documents to Dify

1. Go to Dify > Knowledge > Create Dataset: "NPA Classification"
2. Upload these 3 files:
   - `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
   - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
   - `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
3. Settings:
   - Indexing mode: High Quality
   - Chunk size: 1000 tokens
   - Chunk overlap: 100 tokens
   - Retrieval: Hybrid (keyword + semantic)

## Step 5: Get API Key

After publishing the workflow:
1. Go to App > API Access
2. Copy the API key
3. Add to `.env`: `DIFY_KEY_CLASSIFIER=app-xxxxx`
4. Add to `server/config/dify-agents.js` under the CLASSIFIER entry

## Step 6: Test via Express Proxy

```bash
# Test CLASSIFIER mode
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "CLASSIFIER",
    "inputs": {
      "agent_id": "CLASSIFIER",
      "product_description": "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging",
      "product_category": "FX",
      "underlying_asset": "GBP/USD",
      "notional_amount": 25000000,
      "currency": "USD",
      "customer_segment": "Corporate",
      "booking_location": "Singapore",
      "counterparty_location": "London",
      "is_cross_border": true
    }
  }'

# Test ML_PREDICT mode
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "ML_PREDICT",
    "inputs": {
      "agent_id": "ML_PREDICT",
      "product_description": "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging",
      "product_category": "FX",
      "underlying_asset": "GBP/USD",
      "notional_amount": 25000000,
      "currency": "USD",
      "customer_segment": "Corporate",
      "booking_location": "Singapore",
      "counterparty_location": "London",
      "is_cross_border": true
    }
  }'
```

Expected output: JSON with `type: "Variation"`, `track: "NPA_LITE"`, cross-border flags, 29 scored criteria (21 NTG + 8 VAR).

## Step 7: Integration with Orchestrator

The NPA Orchestrator (MASTER_COO) calls the Classifier workflow after the Ideation Agent completes:

1. Ideation Agent returns `FINALIZE_DRAFT` with product data
2. Orchestrator extracts product fields from the NPA draft
3. Orchestrator calls `CLASSIFIER` workflow via `DifyService.runWorkflow()`
4. Classification result is displayed as a CLASSIFICATION card in the chat UI
5. If PROHIBITED, show HARD_STOP card

The Express proxy already has the `/api/dify/workflow` endpoint ready. The Angular `DifyService.runWorkflow()` method is also ready. Just needs the API key.
