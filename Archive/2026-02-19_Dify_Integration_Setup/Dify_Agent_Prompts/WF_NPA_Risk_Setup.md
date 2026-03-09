# RISK ASSESSMENT Workflow — Dify Setup Guide
# Updated: 2026-02-19 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 1.0

## Dify App Type: WORKFLOW (not Agent/Chat)

The Risk Assessment Agent is a **Tier 3 stateless workflow** — it receives structured input (product data + classification result), runs a 5-layer risk cascade and 7-domain assessment, and returns structured risk output. No conversation state.

---

## Step 1: Create Workflow App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Workflow**
2. Name: `NPA_Risk_Assessment`
3. Description: "5-layer risk validation cascade with 7-domain assessment (Credit, Market, Operational, Liquidity, Legal, Reputational, Cyber). Produces structured risk rating, prerequisite validation, PIR requirements, and actionable recommendations."

## Step 2: Workflow Node Layout

```
[START] → [Knowledge Retrieval] → [LLM Node: Risk Assessor] → [END]
```

**IMPORTANT — Dify Workflow node types:**
- **LLM Node**: Pure text-in/text-out. Cannot call tools. This is the correct node type for the Risk Agent.
- **Agent Node**: LLM + tool-calling loop. NOT needed here — the Risk Agent performs purely analytical assessment.

The Risk Agent does NOT need MCP tools. It performs all assessments analytically based on input data and knowledge base context. Downstream workflow nodes (or the Orchestrator) handle persistence to DB.

### Node 1: START
Input variables (define in Workflow input schema):

```json
{
  "project_id": { "type": "string", "required": false, "default": "", "description": "NPA project ID for tracking (e.g., PRJ-xxxx)" },
  "product_description": { "type": "string", "required": true, "description": "Full text description of the proposed product — this is the primary input" },
  "product_category": { "type": "string", "required": false, "default": "", "description": "e.g. Fixed Income, FX, Equity, Structured Note, Derivative" },
  "underlying_asset": { "type": "string", "required": false, "default": "", "description": "e.g. GBP/USD, CNY IRS, S&P 500" },
  "notional_amount": { "type": "number", "required": false, "default": 0, "description": "Notional in base currency" },
  "currency": { "type": "string", "required": false, "default": "USD" },
  "customer_segment": { "type": "string", "required": false, "default": "", "description": "Retail | HNW | Corporate | Institutional | Bank" },
  "booking_location": { "type": "string", "required": false, "default": "" },
  "counterparty_location": { "type": "string", "required": false, "default": "" },
  "is_cross_border": { "type": "boolean", "required": false, "default": false },
  "classification_type": { "type": "string", "required": false, "default": "", "description": "NTG | Variation | Existing — from Classifier output" },
  "approval_track": { "type": "string", "required": false, "default": "", "description": "FULL_NPA | NPA_LITE | BUNDLING | EVERGREEN | PROHIBITED — from Classifier output" },
  "npa_lite_subtype": { "type": "string", "required": false, "default": "", "description": "B1 | B2 | B3 | B4 — from Classifier output, if applicable" },
  "counterparty_rating": { "type": "string", "required": false, "default": "", "description": "e.g. A-, BBB+, AA" },
  "use_case": { "type": "string", "required": false, "default": "", "description": "Hedging | Speculation | Arbitrage | Risk Management" },
  "pac_approved": { "type": "boolean", "required": false, "default": false, "description": "Whether PAC has approved (required for NTG)" },
  "dormancy_status": { "type": "string", "required": false, "default": "", "description": "active | dormant_under_3y | dormant_over_3y | expired" },
  "loop_back_count": { "type": "number", "required": false, "default": 0, "description": "Number of loop-backs on this NPA (circuit breaker at 3)" },
  "evergreen_notional_used": { "type": "number", "required": false, "default": 0, "description": "Current Evergreen notional usage in USD (GFM-wide aggregate)" },
  "evergreen_deal_count": { "type": "number", "required": false, "default": 0, "description": "Current Evergreen deal count (GFM-wide aggregate)" }
}
```

**CRITICAL:** The `product_description` field is the most important input — it contains the richest semantic context for both the Knowledge Retrieval query and the LLM assessment.

### Node 2: Knowledge Retrieval (Recommended)
- **Dataset**: "NPA Risk Assessment" (upload the KB docs — see Step 4)
  - `KB_Risk_Agent.md`
  - `KB_NPA_Policies.md`
  - `KB_Prohibited_Items.md`
- **Query**: `{{product_description}}`
  > **Dify constraint**: Knowledge Retrieval query accepts only **ONE variable**. Use `product_description` as it contains the richest semantic context for retrieval. Do NOT try to concatenate multiple variables into the query — Dify does not support this.
- **Top K**: 5
- **Score Threshold**: 0.5

### Node 3: LLM Node (Risk Assessor)
- **Model**: Claude 3.5 Sonnet (or GPT-4o) — needs strong reasoning for multi-domain risk assessment
- **System Prompt**: Copy from `WF_NPA_Risk_Prompt.md`
- **User Message Template**:
```
Perform a comprehensive risk assessment for this NPA product:

Product Description: {{product_description}}
Product Category: {{product_category}}
Underlying Asset: {{underlying_asset}}
Notional Amount: {{notional_amount}} {{currency}}
Customer Segment: {{customer_segment}}
Booking Location: {{booking_location}}
Counterparty Location: {{counterparty_location}}
Cross-Border: {{is_cross_border}}
Classification Type: {{classification_type}}
Approval Track: {{approval_track}}
NPA Lite Sub-Type: {{npa_lite_subtype}}
Counterparty Rating: {{counterparty_rating}}
Use Case: {{use_case}}
PAC Approved: {{pac_approved}}
Dormancy Status: {{dormancy_status}}
Loop-Back Count: {{loop_back_count}}
Evergreen Notional Used: {{evergreen_notional_used}}
Evergreen Deal Count: {{evergreen_deal_count}}
Project ID: {{project_id}}

{{#context#}}
Reference Knowledge:
{{context}}
{{/context#}}

Return ONLY a valid JSON object with the complete risk assessment result.
```
- **Temperature**: 0.1 (deterministic, consistent risk assessment)
- **Max Tokens**: 6000 (risk output is larger than classification due to 7 domains + 5 layers)
- **Tools**: NONE — This is an **LLM Node**, NOT an Agent Node. LLM Nodes cannot have tools attached.

### Node 4: END
Output variables:
- `result`: The full LLM response (JSON string)

Map the LLM output to workflow output.

## Step 3: NO MCP Tools Required

Unlike the Classifier (which uses an Agent Node with 10 MCP tools for optional DB persistence), the Risk Agent is a pure **LLM Node** with no tool access.

**Why no tools?**
- The Risk Agent performs purely analytical assessment — it doesn't need to read from or write to the database
- Persistence is handled by the **Orchestrator** or a downstream **Code Node** that parses the Risk Agent's JSON output and calls the appropriate MCP tools
- This keeps the Risk Agent fast (no tool-calling overhead) and deterministic

**If you need DB persistence:**
Add a **Code Node** after the LLM Node that:
1. Parses the JSON output from the LLM Node
2. Calls `risk_run_assessment` and `save_risk_check_result` via HTTP to the MCP server
3. The MCP server URL is: `{MCP_SERVER_URL}/mcp/sse`
4. The OpenAPI spec is at: `{MCP_SERVER_URL}/openapi.json`

## Step 4: Upload KB Documents to Dify

1. Go to Dify > Knowledge > Create Dataset: "NPA Risk Assessment"
2. Upload these files:
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Risk_Agent.md`
   - `Context/2026-02-19/Dify_KB_Docs/KB_NPA_Policies.md`
   - `Context/2026-02-19/Dify_KB_Docs/KB_Prohibited_Items.md` (if exists, otherwise use `Context/Dify_KB_Docs/KB_Prohibited_Items.md`)
3. Settings:
   - Indexing mode: High Quality
   - Chunk size: 1000 tokens
   - Chunk overlap: 100 tokens
   - Retrieval: Hybrid (keyword + semantic)

## Step 5: Get API Key

After publishing the workflow:
1. Go to App > API Access
2. Copy the API key
3. Add to `.env`: `DIFY_KEY_RISK=app-xxxxx`
4. Add to `server/config/dify-agents.js` under the RISK entry

## Step 6: Test via Express Proxy

```bash
# Test Risk Assessment
curl -X POST http://localhost:3000/api/dify/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "RISK",
    "inputs": {
      "product_description": "FX Option on GBP/USD with 6-month European expiry, knock-out barrier at 1.35, for corporate hedging. Back-to-back with institutional counterparty.",
      "product_category": "FX",
      "underlying_asset": "GBP/USD",
      "notional_amount": 25000000,
      "currency": "USD",
      "customer_segment": "Corporate",
      "booking_location": "Singapore",
      "counterparty_location": "London",
      "is_cross_border": true,
      "classification_type": "Variation",
      "approval_track": "NPA_LITE",
      "npa_lite_subtype": "B2",
      "counterparty_rating": "A-",
      "use_case": "Hedging",
      "pac_approved": false,
      "dormancy_status": "active",
      "loop_back_count": 0,
      "evergreen_notional_used": 0,
      "evergreen_deal_count": 0,
      "project_id": ""
    }
  }'
```

Expected output: JSON with `overall_risk_rating: "MEDIUM"` (cross-border override from LOW→MEDIUM), 7 domain scores, 5 layer results, PIR requirements, notional flags (Finance VP required >$20M, ROAE needed), and 5-party mandatory sign-offs.

## Step 7: Integration with Orchestrator

The NPA Orchestrator (MASTER_COO) calls the Risk workflow after the Classifier completes:

1. Classifier returns classification result (type, track, sub-type, PAC flag)
2. Orchestrator enriches the input with classification data + PAC status + dormancy + loop-back count
3. Orchestrator calls `RISK` workflow via `DifyService.runWorkflow()`
4. Risk result is displayed as a RISK_ASSESSMENT card in the chat UI
5. If CRITICAL/PROHIBITED: show HARD_STOP card
6. If prerequisite failures: show PREREQUISITE_PENDING card with pending items
7. Orchestrator persists risk results to DB via its own MCP tool access

The Express proxy already has the `/api/dify/workflow` endpoint ready. The Angular `DifyService.runWorkflow()` method is also ready. Just needs the API key.

## Step 8: Downstream Persistence (Optional Code Node)

If you want the workflow itself to persist results (instead of relying on the Orchestrator), add a **Code Node** after the LLM Node:

```javascript
// Code Node: Persist Risk Assessment to DB
const riskResult = JSON.parse(inputs.result);

// Call MCP server to persist
const response = await fetch('{MCP_SERVER_URL}/api/risk/assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    project_id: riskResult.risk_assessment.project_id,
    overall_rating: riskResult.risk_assessment.overall_risk_rating,
    overall_score: riskResult.risk_assessment.overall_score,
    domain_assessments: riskResult.domain_assessments,
    layer_results: riskResult.layer_results
  })
});

return { persisted: response.ok, result: inputs.result };
```

**Note:** This Code Node is optional. The Orchestrator can handle persistence via its own MCP tool access.
