# AUTOFILL Workflow — Dify Setup Guide
# Updated: 2026-02-21 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 1.1 — Updated for slim prompt architecture (v3.0)

## Dify App Type: WORKFLOW (not Agent/Chat)

The Template AutoFill Agent is a **Tier 3 stateless workflow** — it receives structured input (product data + classification result + optional risk flags), analyzes the best historical NPA match, categorizes all fields into 3 buckets (AUTO/ADAPTED/MANUAL), and returns structured JSON output with auto-filled content. No conversation state.

---

## Step 1: Create Workflow App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Workflow**
2. Name: `WF_NPA_Autofill`
3. Description: "Template AutoFill Agent — auto-populates 70-80% of NPA template fields by intelligently copying and adapting content from similar historical approved NPAs. Targets 60-90 minute manual process reduction to 15-20 minutes."

## Step 2: Workflow Node Layout

```
[START] → [Knowledge Retrieval] → [LLM Node: AutoFill Engine] → [END]
```

**IMPORTANT — Dify Workflow node types:**
- **LLM Node**: Pure text-in/text-out. Cannot call tools. This is the correct node type for the AutoFill Agent.
- **Agent Node**: LLM + tool-calling loop. NOT needed here — the AutoFill Agent performs all field analysis analytically.

The AutoFill Agent does NOT need MCP tools directly. It receives KB context via Knowledge Retrieval and returns structured JSON. The Express proxy handles DB persistence (writing to `npa_form_data` table) downstream.

### Node 1: START
Input variables (define in Workflow input schema):

```json
{
  "project_id": { "type": "string", "required": false, "default": "", "description": "NPA project ID (e.g., PRJ-xxxx)" },
  "product_description": { "type": "string", "required": true, "description": "Full text description of the proposed product — PRIMARY input for both KB retrieval and field generation" },
  "product_category": { "type": "string", "required": false, "default": "", "description": "Fixed Income | FX | Equity | Structured Note | Derivative" },
  "underlying_asset": { "type": "string", "required": false, "default": "", "description": "e.g. GBP/USD, CNY IRS, S&P 500" },
  "notional_amount": { "type": "number", "required": false, "default": 0, "description": "Notional in base currency (USD)" },
  "currency": { "type": "string", "required": false, "default": "USD" },
  "customer_segment": { "type": "string", "required": false, "default": "", "description": "Retail | HNW | Corporate | Institutional | Bank" },
  "booking_location": { "type": "string", "required": false, "default": "" },
  "counterparty_location": { "type": "string", "required": false, "default": "" },
  "is_cross_border": { "type": "boolean", "required": false, "default": false },
  "classification_type": { "type": "string", "required": false, "default": "", "description": "NTG | Variation | Existing — from Classifier output" },
  "approval_track": { "type": "string", "required": false, "default": "", "description": "FULL_NPA | NPA_LITE | BUNDLING | EVERGREEN | PROHIBITED — from Classifier output" },
  "npa_lite_subtype": { "type": "string", "required": false, "default": "", "description": "B1 | B2 | B3 | B4 — only if approval_track == NPA_LITE" },
  "similar_npa_id": { "type": "string", "required": false, "default": "", "description": "Best-matching historical NPA ID from Classification (e.g., TSG1917)" },
  "similarity_score": { "type": "number", "required": false, "default": 0, "description": "Similarity score 0-1 from Classification Agent" },
  "counterparty_rating": { "type": "string", "required": false, "default": "", "description": "e.g. A-, BBB+, AA" },
  "use_case": { "type": "string", "required": false, "default": "", "description": "Hedging | Speculation | Arbitrage | Risk Management" },
  "pac_approved": { "type": "boolean", "required": false, "default": false, "description": "Whether PAC has pre-approved (required for NTG products)" },
  "dormancy_status": { "type": "string", "required": false, "default": "", "description": "active | dormant_under_3y | dormant_over_3y | expired" },
  "loop_back_count": { "type": "number", "required": false, "default": 0, "description": "Number of loop-backs on this NPA (circuit breaker at 3)" },
  "evergreen_notional_used": { "type": "number", "required": false, "default": 0, "description": "Current Evergreen notional usage in USD" },
  "evergreen_deal_count": { "type": "number", "required": false, "default": 0, "description": "Current Evergreen deal count" },
  "reference_npa_id": { "type": "string", "required": false, "default": "", "description": "User-confirmed reference NPA ID from Ideation Agent Q10 (e.g., TSG1917). Highest-priority content source for auto-fill." }
}
```

**CRITICAL:** The `product_description` field is the most important input — it contains the richest semantic context for both the Knowledge Retrieval query and the LLM analysis.

**IMPORTANT:** The `reference_npa_id` field is the second most impactful input — when a user provides a reference NPA during Ideation (Q10), it becomes the primary content source for auto-fill. This can boost coverage from 45% to 85%+ and produce comprehensive, multi-paragraph field values.

### Node 2: Knowledge Retrieval (Recommended)
- **Dataset**: "NPA AutoFill Templates" (upload the KB docs — see Step 4)
  - `KB_Template_Autofill_Agent.md` (primary — 60+ field categorization, adaptation techniques, QA rules)
  - `KB_NPA_Templates.md` (supporting — full template structure reference)
  - `KB_NPA_Policies.md` (supporting — policy rules, thresholds, cross-border)
- **Query**: `{{product_description}}`
  > **Dify constraint**: Knowledge Retrieval query accepts only **ONE variable**. Use `product_description` as it contains the richest semantic context for retrieval. Do NOT try to concatenate multiple variables into the query.
- **Top K**: 5
- **Score Threshold**: 0.5

### Node 3: LLM Node (AutoFill Engine)
- **Model**: Claude 3.5 Sonnet (or GPT-4o) — needs strong analytical reasoning for field categorization, adaptation logic, and QA checks
- **System Prompt**: Copy from `WF_NPA_Autofill_Prompt.md` (~330 lines / ~18K chars)

> **ARCHITECTURE NOTE — Slim Prompt + KB Retrieval:**
> The system prompt (v3.0) deliberately does NOT contain field-level reference tables, content examples, or detailed bucket categorizations. Those are stored in the KB (`KB_Template_Autofill_Agent.md`) and retrieved dynamically via the Knowledge Retrieval Node. This design:
> - **Saves tokens** — reference data is only retrieved when relevant to the product type
> - **Eliminates duplication** — one source of truth in the KB, not duplicated in the prompt
> - **Enables targeted retrieval** — RAG fetches the most relevant KB sections for each product
>
> The prompt contains: Role + IO contract + decision logic + rules. The KB contains: field_key → section mapping (§1), content standards + examples (§1b), NPA Lite sub-type coverage (§1c), dormancy routing (§1d), bucket field tables with adaptation techniques (§2), and edge case guidance (§3–§9).
- **User Message Template**:
```
Auto-fill the NPA template for this product:

Product Description: {{product_description}}
Product Category: {{product_category}}
Underlying Asset: {{underlying_asset}}
Notional Amount: {{notional_amount}} {{currency}}
Customer Segment: {{customer_segment}}
Booking Location: {{booking_location}}
Counterparty Location: {{counterparty_location}}
Cross-Border: {{is_cross_border}}
Classification: {{classification_type}}
Approval Track: {{approval_track}}
NPA Lite Sub-Type: {{npa_lite_subtype}}
Similar NPA ID: {{similar_npa_id}}
Similarity Score: {{similarity_score}}
Counterparty Rating: {{counterparty_rating}}
Use Case: {{use_case}}
PAC Approved: {{pac_approved}}
Dormancy Status: {{dormancy_status}}
Loop-Back Count: {{loop_back_count}}
Evergreen Notional Used: {{evergreen_notional_used}}
Evergreen Deal Count: {{evergreen_deal_count}}
Reference NPA ID: {{reference_npa_id}}

Knowledge Base Context:
{{#context#}}

Based on the product details, classification, and knowledge base context above, auto-fill the NPA template. Return ONLY the JSON output as specified in your instructions.
```

**Important Notes:**
- `{{#context#}}` is the Dify syntax for injecting Knowledge Retrieval results into the LLM prompt
- All variables are passed from the START node
- The LLM Node does NOT have tool access — it returns pure JSON text

### Node 4: END
- **Output variable**: Map the LLM Node's text output to the workflow output
- Set output variable name: `result` (or `outputs`)
- The Express proxy will receive this as `data.outputs.result`

## Step 3: API Key & Environment

1. After publishing the workflow, go to **API Access** panel
2. Copy the **API Key** (secret key starting with `app-`)
3. In your Express `.env` file, set:
```
DIFY_KEY_AUTOFILL=app-xxxxxxxxxxxxxxxxxx
```
4. The Express proxy uses this key in `server/config/dify-agents.js` (AUTOFILL entry)

## Step 4: Knowledge Base Setup

### Dataset 1: NPA AutoFill Templates (Primary)
1. Go to Dify Cloud > Knowledge > Create Knowledge
2. Name: "NPA AutoFill Templates"
3. Upload these files:
   - `KB_Template_Autofill_Agent.md` — 60+ field categorization, 5 adaptation techniques, QA checks, edge cases
   - `KB_NPA_Templates.md` — Full template structure reference with Part A/B/C and all sections
4. **Chunking settings**:
   - Chunk size: **800 tokens** (AutoFill KB has detailed field-level content; smaller chunks improve precision)
   - Overlap: **100 tokens**
   - Separator: `---` (the KB uses `---` between major sections)
5. **Embedding model**: Same as other agents (text-embedding-3-small or equivalent)

### Dataset 2: NPA Policies (Shared — may already exist)
- Same dataset used by Classifier and Risk agents
- Contains `KB_NPA_Policies.md`, `KB_Prohibited_Items.md`

## Step 5: Testing

### Test Case 1: Variation Product with Reference NPA (Expected Coverage: 78%)
```json
{
  "product_description": "FX Forward on GBP/USD, 3-month tenor, $50M notional, for hedging purposes. Institutional client, booked in Singapore, counterparty in London.",
  "product_category": "FX",
  "underlying_asset": "GBP/USD",
  "notional_amount": 50000000,
  "currency": "USD",
  "customer_segment": "Institutional",
  "booking_location": "Singapore",
  "counterparty_location": "London",
  "is_cross_border": true,
  "classification_type": "Existing",
  "approval_track": "NPA_LITE",
  "npa_lite_subtype": "",
  "similar_npa_id": "TSG1917",
  "similarity_score": 0.94,
  "counterparty_rating": "A-",
  "use_case": "Hedging",
  "pac_approved": false,
  "dormancy_status": "active",
  "loop_back_count": 0,
  "evergreen_notional_used": 0,
  "evergreen_deal_count": 0,
  "reference_npa_id": "TSG1917"
}
```

**Expected Results:**
- Coverage: ~78% (~50 auto, ~18 adapted, ~12 manual out of 80+ field_keys)
- Cross-border flags: 5 mandatory sign-offs added
- Notional flags: ROAE required (>$20M), Finance VP required (=$50M)
- Validation warnings: ROAE analysis needed
- Source NPA: TSG1917 (94% similarity) — confirmed as reference_npa_id
- **Comprehensive field values**: Each auto-filled field should contain multi-paragraph content with rationale, risk factors, mitigants, and regulatory references (not one-liners)
- **Manual field draft suggestions**: business_rationale should have a 3-paragraph draft suggestion in smart_help
- Rich markdown values with **bold headers**, bullet points, and tables

### Test Case 2: NTG Product — No Reference NPA (Expected Coverage: 45%)
```json
{
  "product_description": "Credit Default Swap on investment grade corporate bonds, 5-year tenor, $75M notional. First CDS product for MBS. Requires new legal framework and ISDA credit support.",
  "product_category": "Derivative",
  "underlying_asset": "IG Corporate Bonds",
  "notional_amount": 75000000,
  "currency": "USD",
  "customer_segment": "Institutional",
  "booking_location": "Singapore",
  "counterparty_location": "Singapore",
  "is_cross_border": false,
  "classification_type": "NTG",
  "approval_track": "FULL_NPA",
  "npa_lite_subtype": "",
  "similar_npa_id": "",
  "similarity_score": 0,
  "counterparty_rating": "A+",
  "use_case": "Risk Management",
  "pac_approved": false,
  "dormancy_status": "",
  "loop_back_count": 0,
  "evergreen_notional_used": 0,
  "evergreen_deal_count": 0,
  "reference_npa_id": ""
}
```

**Expected Results:**
- Coverage: ~45% (generic template, no historical match — 80+ field_keys, ~35 auto-filled)
- Validation warnings: HARD_STOP (PAC not approved for NTG)
- Notional flags: ROAE + Finance VP required (>$50M)
- PIR: Mandatory within 6 months
- Validity: 12 months
- **No reference NPA**: Auto-filled content generated from KB context and product category templates. Fields should still be comprehensive (multi-paragraph with rationale) even without a reference source.
- **Manual field draft suggestions**: business_rationale should have a KB-generated draft in smart_help covering CDS market opportunity, strategic rationale for entering CDS market

### Test Case 3: Evergreen Product (Expected Coverage: 85%)
```json
{
  "product_description": "Vanilla IRS SGD 5-year fixed-float, standard ISDA documentation, retail customer segment.",
  "product_category": "Fixed Income",
  "underlying_asset": "SGD IRS",
  "notional_amount": 10000000,
  "currency": "SGD",
  "customer_segment": "Retail",
  "booking_location": "Singapore",
  "counterparty_location": "Singapore",
  "is_cross_border": false,
  "classification_type": "Existing",
  "approval_track": "EVERGREEN",
  "npa_lite_subtype": "",
  "similar_npa_id": "TSG1800",
  "similarity_score": 0.97,
  "counterparty_rating": "AA-",
  "use_case": "Hedging",
  "pac_approved": false,
  "dormancy_status": "active",
  "loop_back_count": 0,
  "evergreen_notional_used": 120000000,
  "evergreen_deal_count": 5,
  "reference_npa_id": "TSG1800"
}
```

**Expected Results:**
- Coverage: ~85% (near-verbatim copy from existing NPA — 80+ field_keys, ~68 auto-filled)
- Evergreen flags: limits OK ($120M/$500M used, 5/20 deals used)
- Validity: 36 months
- Evergreen checklist fields populated
- **Reference NPA TSG1800 (97% similarity)**: Comprehensive field values copied verbatim from reference. Each field should contain full multi-paragraph content with tables, risk factors, and regulatory references matching the depth of the reference NPA.

## Step 6: Downstream Integration

### How Express Proxy Handles AutoFill Output

1. Angular frontend calls `POST /api/agents/npas/{projectId}/run` with `agentId: 'AUTOFILL'`
2. Express proxy sends workflow to Dify Cloud via Workflow Run API
3. Dify returns JSON in `data.outputs.result`
4. Express returns result to Angular
5. Angular calls `mapAutoFillSummary()` to extract fields from the JSON
6. Angular calls `POST /api/agents/npas/{projectId}/persist/autofill` with field data
7. Express upserts each field into `npa_form_data` table with lineage tracking

### DB Table: `npa_form_data`
```sql
CREATE TABLE npa_form_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  field_value TEXT,
  lineage ENUM('AUTO', 'ADAPTED', 'MANUAL') DEFAULT 'AUTO',
  confidence_score DECIMAL(5,2) DEFAULT 90.00,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_field (project_id, field_key)
);
```

## Step 7: Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| LLM returns markdown instead of JSON | System prompt not strict enough | Ensure Rule #1 in prompt: "Output MUST be pure JSON" |
| Coverage always 0% | No KB context retrieved | Check Knowledge Retrieval query uses `{{product_description}}` |
| Missing cross-border sign-offs | `is_cross_border` not passed | Ensure START node maps this variable from input |
| Coverage always same regardless of track | `approval_track` not mapped | Check that Classifier output feeds into AutoFill input |
| Empty `filled_fields` array | LLM ran out of context | Reduce Knowledge Retrieval Top K from 5 to 3 |
| Confidence scores all 0 | Confidence in 0-1 range instead of 0-100 | Prompt says 0-100; mapAutoFillSummary divides by 100 |
| Field values are one-liners | LLM not producing comprehensive content | Reinforce Rule #10 in prompt: comprehensive multi-paragraph content is MANDATORY. Check KB retrieval returns `KB_Template_Autofill_Agent.md` §1b content standards |
| Manual fields have no draft suggestions | `smart_help` empty or generic | Reinforce Rule #20 in prompt: manual fields must include comprehensive draft suggestions adapted from reference NPA |
| reference_npa_id not used | Variable not mapped in START node | Ensure `reference_npa_id` is defined in workflow input schema and passed to LLM Node user message |

---

## Architecture Summary

```
Angular Frontend
    ↓ POST /api/agents/npas/{id}/run (agentId=AUTOFILL)
Express Proxy (server/routes/agents.js)
    ↓ POST {DIFY_BASE_URL}/workflows/run (API key from DIFY_KEY_AUTOFILL)
Dify Cloud Workflow
    [START] → [Knowledge Retrieval: KB_Template_Autofill_Agent.md]
            → [LLM Node: Claude 3.5 Sonnet with WF_NPA_Autofill_Prompt.md]
            → [END: returns JSON]
    ↓ Response to Express
Express Proxy
    ↓ Returns raw JSON to Angular
Angular Frontend
    ↓ mapAutoFillSummary() → AutoFillSummary interface
    ↓ persistAgentResult() → POST /api/agents/npas/{id}/persist/autofill
Express Proxy
    ↓ UPSERT into npa_form_data (field_key, value, lineage, confidence)
MySQL Database
```
