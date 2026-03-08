# AUTOFILL Agent Architecture — Problem Statement for Expert Consultation

## CONTEXT

We are building the **COO Multi-Agent Workbench** for MBS Bank's Global Financial Markets (GFM) division. The core feature is the **NPA (New Product Approval) Template AutoFill Agent** — an AI that pre-fills 70-80% of a 72-field NPA document by analyzing the product description, classification, and historical approved NPAs.

This is the HEART of the entire project. It reduces NPA form completion from 60-90 minutes to 15-20 minutes.

## TECH STACK

- **Frontend**: Angular 17 (standalone components, Tailwind CSS)
- **Backend**: Express.js (Node.js)
- **AI Platform**: Dify Cloud (supports Workflow apps and Chatflow apps)
- **LLM**: Claude 3.5 Sonnet (via Dify)
- **Database**: MySQL (field values stored in `npa_form_data` table)
- **Streaming**: Server-Sent Events (SSE) from Dify → Express proxy → Angular

## THE NPA TEMPLATE

The NPA document has **72 unique fields** organized into:

- **Section I**: Product Specifications (21 fields) — product_name, business_rationale, underlying_asset, tenor, notional_amount, customer_segments, etc.
- **Section II**: Operational & Technology (16 fields) — booking_system, booking_legal_form, booking_family, booking_typology, settlement_method, valuation_model, etc.
- **Section III**: Pricing Model (7 fields) — pricing_methodology, roae_analysis, simm_treatment, etc.
- **Section IV**: Risk Analysis (26 fields) — market_risk, credit_risk, liquidity_risk, plus 8 market risk factor flags (mrf_ir_delta, mrf_fx_delta, etc.), reputational_risk, esg_assessment, etc.
- **Section V**: Data Management (6 fields) — data_privacy, gdpr_compliance, pure_assessment_id, etc.
- **Section VI**: Other Risk (1 field) — operational_risk catch-all
- **Appendices**: Financial crime (5 fields), trading products (4 fields)

Most field values are SHORT (1-3 sentences or just a code/category). Example:
- `booking_family` → "IRD (Interest Rate Derivatives)"
- `booking_typology` → "IRD_IRS_VANILLA"
- `settlement_method` → "T+2 physical delivery via CLS"
- `primary_regulation` → "MAS 656, Subject to CFTC Part 20"

Some fields are NARRATIVE (3-8 bullet points):
- `business_rationale` → 4 bullet points explaining why this product
- `market_risk` → 4-5 bullet points on risk factors
- `credit_risk` → 3-4 bullet points on counterparty risk

## THE INPUT TO THE AGENT

The agent receives:
```json
{
  "product_description": "FX Forward on GBP/USD, 3-month tenor, $50M notional, for hedging...",
  "product_category": "FX",
  "underlying_asset": "GBP/USD",
  "notional_amount": 50000000,
  "classification_type": "Existing",
  "approval_track": "NPA_LITE",
  "is_cross_border": true,
  "counterparty_rating": "A-",
  "booking_location": "Singapore",
  "counterparty_location": "London",
  "similar_npa_id": "TSG1917",
  "similarity_score": 0.94
}
```

Plus Knowledge Base context retrieved from RAG (historical NPA templates, policy documents).

## THE REQUIRED OUTPUT

The agent must output 72 field_key/value pairs that map EXACTLY to our Angular template definition. Each field must have:
- `field_key` (exact match to Angular template, e.g., "booking_family" not "booking_product_family")
- `value` (the auto-filled content)
- `lineage` ("AUTO" for direct copy, "ADAPTED" for modified from source, "MANUAL" for user must fill)
- `confidence` (0-100)
- `source` (where the value came from, e.g., "TSG1917 direct copy")

## WHAT WE TRIED AND WHAT HAPPENED

### Attempt 1: Single LLM Workflow (Dify Workflow App — 1 LLM node)
- **Result**: ~9 minutes to complete
- **Why slow**: Generating 72 fields × ~150 tokens per field = ~10,800 output tokens. With a large system prompt (400+ lines of NPA business rules), the LLM takes very long.
- **Problem**: Unacceptable latency. Users stare at a spinner for 9 minutes.

### Attempt 2: 3 Parallel LLM Workflow (Dify Workflow App — 3 parallel LLM branches + Python merge)
- **Architecture**: Knowledge Retrieval → 3 parallel branches (LLM-A: Product & Ops, LLM-B: Pricing & Data, LLM-C: Risk & Compliance) → Python merge code → Output
- **Result**: Bottleneck branch (LLM-B) took 478 seconds (~8 min). Total wall-clock: ~8 min.
- **Problems**:
  1. **Field keys don't match**: The LLM prompt says "score ALL fields" but doesn't list the EXACT 72 keys. LLM invents keys like `market_risk_assessment` instead of `market_risk`. Of 53 fields generated, only 8 matched Angular's fieldMap. **11% effective match rate.**
  2. **Output too verbose**: LLM writes 200-word essays per field when real NPA values are 1-3 sentences. This is the primary latency driver.
  3. **Complex merge code**: Python node concatenates 3 JSON arrays. We spent multiple sessions fixing markdown-fenced JSON parsing and trailing comma errors.
  4. **User experience**: The SSE stream shows raw JSON tokens to the user during generation — looks like garbage, not "their NPA being filled."
  5. **No persistence**: Results vanish when editor closes.

### Current State: BROKEN
- The parallel workflow technically runs end-to-end
- But only 8 of 72 fields actually populate in the NPA form
- Users see a "flop show" — 8 minutes of waiting for content that doesn't match their NPA

## THE QUESTION

We are considering **three architectural approaches** and need expert guidance on which is best:

### Approach A: Fix the 3-Parallel Workflow
- Keep the 3 parallel LLM branches
- Embed exact 72 field_keys into each branch prompt (split: 28/23/21 per branch)
- Force concise output (~40 tokens/field instead of 150)
- Simplify merge code
- **Expected**: ~90 sec - 3 min total, 50+ fields match
- **Risk**: Merge code remains fragile, user still sees raw JSON during stream, Dify workflow SSE doesn't stream from individual branches (only final output)

### Approach B: Switch to Chatflow (Chat Agent)
- Convert AUTOFILL from Workflow to Chatflow in Dify
- Single LLM with conversation-style streaming
- Output streams as READABLE TEXT (not JSON) — section by section
- User sees text appearing in real-time like ChatGPT (feels fast even if 3 min)
- After stream completes, Angular frontend parses the full text to extract field_key/value pairs
- Map to 72 fields and persist to DB
- **Expected**: ~2-4 min total (concise output), but PERCEIVED as fast due to streaming text
- **Risk**: Single LLM could still be slow; parsing structured data from conversational text is less reliable than JSON
- **Variant B2**: Chatflow outputs structured markdown (tables or key: value pairs) instead of prose — easier to parse while still streaming readably

### Approach C: Hybrid — Chatflow for UX + Workflow for Accuracy
- Phase 1: Chatflow streams a quick summary/preview to the user (30 sec)
- Phase 2: Workflow runs in background to generate precise field values
- When workflow completes, fields silently populate in the form
- **Expected**: User sees instant feedback, accurate fields arrive within 2-3 min
- **Risk**: Two separate agent calls = more complexity, more cost

### Approach D: Something else entirely?
- Should we skip Dify for this and call Claude API directly from Express?
- Should we use structured output / tool_use format?
- Should we split into smaller, faster agents (e.g., 6 agents × 12 fields each)?
- Should we pre-compute common field values and only LLM-generate the uncommon ones?

## CONSTRAINTS

1. **Dify Cloud is our AI platform** — we want to stay on Dify if possible (workflow builder, knowledge bases, prompt management)
2. **SSE streaming is required** — users must see progress, not wait for a spinner
3. **72 field_keys must match EXACTLY** — whatever the LLM outputs must map to our Angular template
4. **Latency target**: < 3 minutes total
5. **Cost**: We're paying per token. 3 parallel LLMs = 3× cost of 1 LLM.
6. **The output must be parseable** — we need to reliably extract field_key + value pairs
7. **Knowledge Base (RAG)** context is important — the LLM needs context from historical NPAs and policy documents

## WHAT MATTERS MOST

In priority order:
1. **Field accuracy** — all 72 keys must match, values must be NPA-realistic
2. **User experience** — user must see their NPA being filled, not raw JSON
3. **Speed** — < 3 minutes, or at least FEEL like < 3 minutes
4. **Reliability** — consistent output format, no fragile merge code
5. **Simplicity** — fewer moving parts = fewer things to break

## SPECIFIC QUESTIONS

1. Given the constraints, which approach (A, B, C, D) would you recommend and why?
2. If chatflow: How should we structure the LLM output for both readability AND reliable parsing? (Markdown tables? YAML? Key-value pairs? JSON but with section headers?)
3. If parallel workflow: How do we solve the "user sees raw JSON" problem? Dify workflow SSE doesn't stream from individual branches during execution.
4. Is there a way to get Claude to generate 72 fields significantly faster? (Structured output? Smaller prompt? Pre-filling obvious fields client-side?)
5. Should we separate "quick fields" (booking_system, booking_family — always the same for a product type) from "analytical fields" (market_risk, credit_risk — require LLM reasoning)? Quick fields could be lookup-table, analytical fields LLM-generated.
6. What output format balances human-readability (for streaming UX) with machine-parseability (for field mapping)?

## SUPPLEMENTARY INFO

- The `npa-template-definition.ts` file defines ALL 72 field_keys with labels, types, sections
- The `NPA_Filled_Template.md` shows what a completed NPA looks like (549 lines, ~3K words)
- We have 9 Dify agents total — AUTOFILL is the most critical
- Other agents (RISK, CLASSIFIER, GOVERNANCE) run first and their output feeds into AUTOFILL
- The Angular template editor has Live/Doc/Form view modes — Live shows streaming, Doc shows the rendered NPA document, Form shows editable fields
