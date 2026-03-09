# Deep Research Report on AUTOFILL Agent Architecture for NPA Template Completion in MBS GFM

## Executive summary

Vikram, the best-performing architecture under your constraints is a **Chatflow-first, schema-constrained, copy‑first “delta generation” pipeline**—which is closest to **Approach D (something else)**, but implemented **within Dify Cloud** to preserve your workflow builder, RAG, and prompt management. It combines three ideas:

**Copy-first (baseline) + deterministic rules + sectioned structured LLM deltas**, while separating **human-readable streaming** from **machine-parseable outputs**.

This is the only option that simultaneously addresses your top priorities:

- **Field accuracy & key exactness**: you stop asking an LLM to “invent” an entire 72-field JSON in one go. Instead, you (a) start from an already-correct 72-key baseline object (from the DB + template registry) and (b) ask the LLM to output only a small delta set under a JSON Schema with `additionalProperties: false`, then validate and merge server-side. Dify supports structured outputs via JSON Schema in LLM nodes, and can stream UI text separately via Answer nodes. citeturn6view0turn6view1turn6view3turn21view0turn20view1  
- **Readable streaming UX (no raw JSON)**: you do **not** stream the structured JSON to the user. Instead, you stream curated, human-readable progress (“Filled Product Specs…”, “Drafted Market Risk bullets…”) using **Chatflow Answer nodes**, which have variable-aware streaming. citeturn6view3turn21view0turn20view1  
- **Latency < 3 minutes (and often far less perceived)**: the fastest way is to **avoid generating 72 fields**. Since you already have `similar_npa_id` + `similarity_score`, you can “instant fill” 70–80% by copying baseline fields and only LLM-generate what changes. Anthropic explicitly notes latency is heavily driven by prompt/output token lengths and recommends aggressively minimizing both plus using streaming for perceived responsiveness. citeturn5view0turn18search20turn20view1  
- **Reliability & simplicity**: no fragile “3 branches + Python merge” for the full document. Chatflow still allows multiple sequential LLM nodes and multiple Answer nodes; and Dify’s flow rules clarify what parallelism does/doesn’t allow (parallel branches cannot access each other’s outputs until after they join). citeturn21view0turn20view1  

**Why not Approach A (fix 3-parallel workflow)?**  
Even if you fix schema drift by listing exact keys, the core UX and reliability issues remain: Dify’s streaming behavior is easiest to make user-friendly in Chatflow with Answer nodes; and community reports show that in workflows, streamed “message” chunks can be lost or delayed depending on downstream nodes (e.g., Template/Iteration), resulting in “all-at-once” output at `node_finish` rather than token streaming. citeturn4search4turn4search27turn20view1  

**Why not Approach B (Chatflow but parse Markdown/text at the end)?**  
Parsing conversational text is less reliable than consuming a structured output channel. Dify can deliver workflow/node events in the stream (node_started/node_finished, workflow_started/workflow_finished) and you can place your structured JSON in node outputs while separately streaming clean text. citeturn20view1turn6view3turn21view0  

**Critical platform risk to plan for now:**  
On Anthropic’s own API, **Claude Sonnet 3.5 is retired** (retired October 28, 2025), and **Claude Sonnet 3.7 is retired February 19, 2026**—which matters for long-term stability and structured-output capabilities. If MBS is still using Sonnet 3.5 via a managed provider (or existing-customer access on a partner platform), you should still **design a migration path** to a currently active model tier. citeturn19view1turn19view0  

## Research findings from primary sources

### Dify streaming and why Chatflow is the right UX container

Dify’s Service API supports **SSE streaming** (`response_mode: "streaming"`) as the recommended mode; blocking mode can be interrupted after ~100 seconds due to Cloudflare restrictions, which aligns with the pain you saw (multi-minute runs). citeturn20view0turn20view1  

For Chatflow apps specifically:

- The **Answer node** is designed to format what the user sees and to stream progressively based on variable resolution; the **order of variables in the Answer** determines what streams first (not upstream node execution order). citeturn6view3turn21view0  
- You can place **multiple Answer nodes** to stream content at different stages, which is a clean way to show incremental progress without exposing raw intermediate artifacts. citeturn6view3turn21view0  

Also, Dify’s advanced chat stream format includes **workflow and node events** in the SSE channel, including `workflow_started`, `node_started`, `node_finished`, `workflow_finished`, plus `message` chunks and `message_end`. This is exactly what you need to build a progress UI and to capture structured outputs from node outputs while showing readable text to the user. citeturn20view1turn2view2  

### Dify structured outputs and practical constraints

Dify supports “Structured Outputs” via JSON Schema in LLM nodes (visual editor or JSON Schema editor), but explicitly notes that reliability depends on model support—some models follow JSON Schema better than others; Dify can also retry on failure and route to failure branches. citeturn6view0turn6view1  

A common “gotcha” in Dify workflows is that an LLM node may still expose JSON as a **string in `text`** even when a schema is enabled, while a parsed object may appear in a structured field; downstream nodes may require conversion/extraction. This matches your “raw JSON tokens and parsing fragility” experience and is a strong reason to keep JSON off the user-facing stream and validate/merge in code. citeturn22view0  

### Dify parallelism and why it didn’t help your latency

Dify’s flow rules are explicit: nodes in parallel branches run simultaneously, **cannot reference each other’s outputs**, and only after the branches rejoin can downstream nodes access all branch outputs. Dify also caps parallel branches and nesting depth. citeturn21view0turn21view0  

So, parallelizing three “big schema” generations typically shifts the bottleneck to the slowest branch (as you observed), while also increasing merge complexity and schema-drift opportunities.

### Anthropic guidance on latency and schema reliability

Anthropic’s latency guidance is straightforward: for speed, **choose the right model**, **minimize prompt and output length**, and **use streaming** to reduce perceived latency. citeturn5view0turn20view1  

For schema reliability, Anthropic distinguishes **“structured outputs”** (validated JSON output formats and strict tool schemas) as the robust approach when you must guarantee data shape—but structured outputs availability is model-dependent. citeturn5view2turn9search13  

### Prompt caching in Dify with Anthropic models

If you can use Dify’s official Anthropic model plugin, it exposes multiple **prompt-caching toggles** (system/tool definitions/images/documents/tool results/message-flow threshold) and enforces Anthropic’s limit of **at most 4 `cache_control` blocks per request** by priority. This is a meaningful lever if you still carry large stable instructions or policy blocks, but it’s not a substitute for reducing output tokens. citeturn17view2turn5view1turn12view0  

### UX patterns: why “readable progressive fill” matters for long forms

Long forms are cognitively expensive; reducing perceived effort and uncertainty improves usability. Nielsen Norman Group explicitly calls out that forms are mental work and that structure/transparency/support reduce cognitive load—this supports your requirement to show “their NPA being filled” progressively rather than a spinner. citeturn23search1  

Progressive disclosure is a general pattern for complex interfaces: reveal details as needed rather than overwhelming users up front. In your context, that translates to streaming **high-level progress + key decisions** early, then populating exact fields once validated. citeturn23search4turn6view3  

## Recommended architecture

### Recommendation: Approach D implemented as a single Chatflow run with a dual-channel output strategy

A practical “best-of-all-worlds” design (still inside Dify Cloud) is:

- **One Chatflow invocation** (not two separate calls like Approach C)  
- **Two channels inside that single run**:
  - **UI channel**: Answer nodes stream progress text and brief previews (never JSON).
  - **Data channel**: LLM nodes emit section-level structured objects; a merge/validate node produces a canonical `fields[72]` object; Express consumes node outputs and persists them.

This yields the UX of Approach B, the accuracy of Approach A, and the simplicity of one orchestrated run.

### Copy-first “delta generation” as the main speed lever

Your own context already includes a killer optimization knob: `similar_npa_id` and `similarity_score`.

Instead of generating 72 fields from scratch:

1. **Express pre-fetches a baseline “known-good” NPA object** from MySQL using `similar_npa_id` (all 72 keys + values, already matching your Angular template).
2. **Express computes deterministic fields** (RULE mode) from product_category, booking_location, cross-border flags, etc. (often faster and more accurate than LLM).
3. The LLM is asked to generate **only the delta set**:
   - fields that must change (e.g., product_name, underlying_asset, tenor, notional_amount, counterparty_location details)
   - analytically reasoned narratives (market_risk / credit_risk / liquidity_risk / operational_risk) when needed
4. Express merges `baseline + rules + llm_deltas` into the final 72-field output.

This is how you realistically hit <3 minutes **and** cut cost: the fastest tokens are the ones you don’t generate. Anthropic’s guidance explicitly prioritizes minimizing prompt and output tokens to reduce latency. citeturn5view0turn18search20  

### Model lifecycle and “don’t get trapped on Sonnet 3.5”

You asked to use Claude 3.5 Sonnet. However, on Anthropic’s own API, Sonnet 3.5 is retired (retired Oct 28, 2025). If MBS is still using it via a partner platform or legacy access, you should still architect so the model can be swapped without changing schemas/UI. citeturn19view1turn19view0  

## Concrete implementation blueprint

### Chatflow node graph and streaming strategy

Below is a Dify Chatflow topology that avoids raw JSON streaming while still producing validated, exact-key outputs.

```mermaid
flowchart TD
  A[Start / Inputs] --> B[Baseline Fetch (Express pre-step)]
  B --> C[Knowledge Retrieval (RAG): similar NPAs + policy snippets]

  C --> D[Code Node: Build Field Registry + Delta Key List]
  D --> E[Answer Node: "Starting autofill..." (readable progress)]

  D --> F[LLM Node: Section I & II Deltas (Structured Output JSON)]
  F --> G[Answer Node: "Product & Ops drafted" + short preview]

  D --> H[LLM Node: Risk Analysis Deltas (Structured Output JSON)]
  H --> I[Answer Node: "Risk section drafted" + short preview]

  F --> J[Code Node: Merge + Validate + Fill Missing as MANUAL]
  H --> J

  J --> K[End / Final Outputs: fields[72] JSON (not shown to user)]
  K --> L[Answer Node: "Autofill complete" + next actions]
```

Key mechanics supported by Dify docs:

- Answer nodes are only in Chatflow, and they stream based on variable readiness and ordering. citeturn6view3turn21view0  
- Parallelism is possible but introduces access/merge constraints; the above is intentionally mostly sequential to keep outputs deterministic and observable. citeturn21view0  
- The SSE stream can include workflow/node events; use these to show progress and to capture node outputs without printing them. citeturn20view1  

### Express SSE proxy “sanitizer” pattern

Instead of streaming Dify’s SSE directly to Angular:

- Parse Dify SSE events (`message`, `node_started`, `node_finished`, `workflow_finished`, `error`, `ping`). citeturn20view1  
- Emit **your own SSE** to Angular with typed events, e.g.:
  - `ui_text_chunk` (only from Answer node message chunks)
  - `progress` (derived from node_started/node_finished)
  - `field_patch` (from validated structured outputs, never raw JSON tokens)
  - `final` (once fully merged)

This completely eliminates the “raw JSON flop show” even if the underlying nodes are producing JSON strings. It also gives you a stable contract for the Live/Doc/Form modes in Angular.

### Prioritized implementation steps

- **Step one: build a “field registry generator” in your repo** that reads `npa-template-definition.ts` and produces:
  - `ALL_KEYS[72]`
  - JSON Schemas per section (risk/product/ops/pricing/data/etc.)
  - a default registry table with max lengths and generation modes
- **Step two: implement baseline + deterministic prefill in Express**
  - load baseline by `similar_npa_id`
  - compute RULE fields (booking_family, booking_typology, risk factor flags, etc.)
  - immediately persist + stream baseline patches to Angular for instant gratification
- **Step three: move AUTOFILL into Chatflow with multiple Answer nodes**
  - stream progress text, not JSON
  - LLM nodes emit structured deltas only
- **Step four: validate + merge in one place**
  - either Dify Code Node or Express (preferred if you want stronger libraries, e.g., Ajv, and easier logging)
- **Step five: enforce exact keys + fallback**
  - missing keys → `MANUAL` with empty value + low confidence
  - too-long values → clamp + reduce confidence + flag for review
- **Step six: add evaluation harness**
  - replay a test set of historical NPAs and measure: key coverage, schema compliance, time-to-first-field, time-to-final, and user edits per field

## Output formats, schemas, and prompt templates

### Best output format for readability + machine parsing

**Do not try to parse the streamed human text into 72 fields.** Use a dual representation:

- **Machine output (for mapping and DB persistence):**
  - JSON object: `fields: Record<field_key, {value, lineage, confidence, source}>`
  - produced as a structured output on a node or as a final merged artifact
- **Human output (for streaming UX):**
  - short markdown paragraphs + small bullet previews per section
  - produced only from Answer nodes

Dify’s advanced chat stream includes node events; node outputs can contain your structured JSON; the Answer node can stream readable summaries separately. citeturn20view1turn6view3  

### JSON Schema example for Risk Analysis section

You requested a concrete schema for one section. Below is a **section-level schema** (not the full 72-field schema) designed to be merged into a baseline object.

Assumptions:
- Narrative fields are arrays of short bullets (best token-efficiency and predictable formatting).
- Flags are booleans.
- Every field carries `lineage`, `confidence`, `source`.

```json
{
  "name": "npa_risk_analysis_delta",
  "strict": true,
  "schema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "market_risk": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": {
            "type": "array",
            "minItems": 2,
            "maxItems": 6,
            "items": { "type": "string", "maxLength": 140 }
          },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },
      "credit_risk": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": {
            "type": "array",
            "minItems": 2,
            "maxItems": 6,
            "items": { "type": "string", "maxLength": 140 }
          },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },
      "liquidity_risk": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": {
            "type": "array",
            "minItems": 1,
            "maxItems": 5,
            "items": { "type": "string", "maxLength": 140 }
          },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },
      "operational_risk": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": {
            "type": "array",
            "minItems": 1,
            "maxItems": 6,
            "items": { "type": "string", "maxLength": 140 }
          },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },
      "reputational_risk": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": { "type": "array", "minItems": 1, "maxItems": 4, "items": { "type": "string", "maxLength": 140 } },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },
      "esg_assessment": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "value": { "type": "array", "minItems": 1, "maxItems": 5, "items": { "type": "string", "maxLength": 140 } },
          "lineage": { "type": "string", "enum": ["AUTO", "ADAPTED", "MANUAL"] },
          "confidence": { "type": "integer", "minimum": 0, "maximum": 100 },
          "source": { "type": "string", "maxLength": 120 }
        },
        "required": ["value", "lineage", "confidence", "source"]
      },

      "mrf_ir_delta": { "type": "boolean" },
      "mrf_ir_vega": { "type": "boolean" },
      "mrf_fx_delta": { "type": "boolean" },
      "mrf_fx_vega": { "type": "boolean" },
      "mrf_eq_delta": { "type": "boolean" },
      "mrf_eq_vega": { "type": "boolean" },
      "mrf_cs_delta": { "type": "boolean" },
      "mrf_cs_vega": { "type": "boolean" }
    },
    "required": [
      "market_risk",
      "credit_risk",
      "liquidity_risk",
      "operational_risk",
      "reputational_risk",
      "esg_assessment",
      "mrf_ir_delta",
      "mrf_ir_vega",
      "mrf_fx_delta",
      "mrf_fx_vega",
      "mrf_eq_delta",
      "mrf_eq_vega",
      "mrf_cs_delta",
      "mrf_cs_vega"
    ]
  }
}
```

This aligns with Dify’s JSON Schema usage and constraints for structured outputs. citeturn6view0turn6view1  

### Prompt template for a structured LLM node

This template is optimized for: (a) concise output, (b) exact schema compliance, (c) “delta-only” generation.

**System message (shared across nodes):**
- “You are an NPA template autofill engine. Output must conform exactly to the JSON Schema. Do not include any additional keys. For narrative values, return short bullet strings. If unsure, set lineage=MANUAL, confidence <=40, and keep value minimal.”

**User message (Risk node example):**
- Provide only:
  - product facts (category, underlying, tenor, notional, flags)
  - baseline values for the same keys (from similar NPA)
  - retrieved policy snippets (short, field-scoped)
  - explicit constraints: bullet count, max bullet length, no duplication

Why this matters: Anthropic’s official latency guidance emphasizes minimizing both input and output tokens, and directly instructing the model to be concise. citeturn5view0  

### Field registry table

You requested a full registry (72 rows). The **exact 72 keys are not present in your message** and are said to live in `npa-template-definition.ts`. Without that file content, I cannot truthfully enumerate your exact keys.

Instead, below is:

- a **registry schema** you should apply to all 72 keys, and  
- a **partial example** using only the keys explicitly named in your problem statement (these are likely a subset).

**Registry columns**
- `field_key`
- `section`
- `field_type` (code / short_text / bullets / boolean_flag / numeric)
- `generation_mode` (RULE / COPY / LLM / MANUAL)
- `max_len_or_items`
- `default_lineage`
- `notes`

**Partial registry example (from your described keys)**

| field_key | section | field_type | generation_mode | max_len_or_items | default_lineage | notes |
|---|---|---|---|---|---|---|
| product_name | Product Specifications | short_text | LLM | 120 chars | ADAPTED | Often affected by tenor/underlying; prefer delta gen |
| business_rationale | Product Specifications | bullets | LLM | 3–6 bullets | ADAPTED | Keep bullets ≤140 chars |
| underlying_asset | Product Specifications | code | RULE/COPY | 60 chars | AUTO | Prefer from input or baseline |
| tenor | Product Specifications | short_text | RULE/COPY | 60 chars | AUTO | Prefer from input or baseline |
| notional_amount | Product Specifications | numeric | RULE/COPY | n/a | AUTO | Prefer from input |
| customer_segments | Product Specifications | short_text | COPY/LLM | 160 chars | AUTO | Often stable per product category |
| booking_system | Operational & Technology | code | RULE/COPY | 80 chars | AUTO | Deterministic mapping by asset class |
| booking_legal_form | Operational & Technology | code | RULE/COPY | 80 chars | AUTO | Deterministic mapping |
| booking_family | Operational & Technology | code | RULE/COPY | 80 chars | AUTO | You cited “IRD”; map similarly for FX |
| booking_typology | Operational & Technology | code | RULE/COPY | 80 chars | AUTO | Strong candidate for lookup table |
| settlement_method | Operational & Technology | short_text | COPY/LLM | 160 chars | AUTO | Copy-first; adjust if cross-border |
| valuation_model | Operational & Technology | code | COPY/LLM | 120 chars | AUTO | Usually consistent within product type |
| pricing_methodology | Pricing Model | short_text | COPY/LLM | 200 chars | ADAPTED | Often stable per typology |
| roae_analysis | Pricing Model | bullets | MANUAL/LLM | 2–6 bullets | MANUAL | Consider requiring confirmation |
| simm_treatment | Pricing Model | short_text | COPY/LLM | 200 chars | ADAPTED | Often stable per typology |
| market_risk | Risk Analysis | bullets | LLM | 2–6 bullets | ADAPTED | Risk schema above |
| credit_risk | Risk Analysis | bullets | LLM | 2–6 bullets | ADAPTED | Consider counterparty_rating |
| liquidity_risk | Risk Analysis | bullets | LLM | 1–5 bullets | ADAPTED | Depends on tenor/market liquidity |
| reputational_risk | Risk Analysis | bullets | LLM | 1–4 bullets | ADAPTED | Often templated text |
| esg_assessment | Risk Analysis | bullets | COPY/LLM | 1–5 bullets | ADAPTED | Often policy-driven |
| data_privacy | Data Management | short_text | RULE/COPY | 200 chars | AUTO | Usually policy boilerplate |
| gdpr_compliance | Data Management | short_text | RULE/COPY | 200 chars | AUTO | Triggered by EU personal data exposure |
| pure_assessment_id | Data Management | code | MANUAL | 80 chars | MANUAL | Likely an external reference |
| operational_risk | Other Risk | bullets | LLM | 1–6 bullets | ADAPTED | Catch-all; keep concise |

To complete the required 72-row table, generate it from your TypeScript source of truth. This avoids the exact matching failures you already observed.

## Latency and cost implications

### Why your earlier runs took 8–9 minutes

Your earlier design forced the model to emit a very large completion (72 fields × verbose prose). Anthropic’s guidance makes it explicit: large prompts and large expected outputs increase latency; using streaming improves perceived latency but does not reduce compute time. citeturn5view0turn20view1  

### What should realistically hit < 3 minutes

With copy-first and delta-only generation:

- **Time-to-first-visible-progress**: near-immediate (baseline fields can populate instantly, then Answer node begins streaming).
- **Time-to-first-LLM-delta fields**: typically bounded by one section LLM call.
- **Time-to-final merge**: bounded by the slowest of two LLM nodes (Product/Ops and Risk) if run sequentially, or by slower one if you run them in parallel and merge after.

Dify’s flow rules allow parallel branches (up to 10), but you should only parallelize if you have stable schemas and trivial merges. citeturn21view0  

### Prompt caching in Dify for stable instructions

If you keep a long, stable NPA “business rules” system prompt, evaluate prompt caching. The official Anthropic plugin for Dify documents several caching switches and the 4-block `cache_control` limit. citeturn17view2turn12view0  

That said, caching does not reduce output-token generation time. The biggest win still comes from not generating 72 fields.

## Validation, backend safeguards, and testing checklist

### Exact-key enforcement and fallback behavior

At minimum:

- Maintain an authoritative `ALL_KEYS[72]` list from `npa-template-definition.ts`.
- When merging:
  - Keys missing after merge → create `{ value: "", lineage: "MANUAL", confidence: 0–20, source: "missing" }`
  - Extra keys → drop and log
- Reject or clamp:
  - values exceeding max length/bullet count → clamp + reduce confidence + log

This is the guardrail that stops schema drift from becoming a user-facing failure.

### Confidence thresholds and “review required” UX

Treat confidence as actionable:

- `confidence >= 80`: auto-accept and write to DB
- `50–79`: accept but visually flag for review
- `< 50` or `lineage = MANUAL`: do not overwrite user input; require explicit confirmation

### Logging and observability

Your proxy already sees node timings and token usage metadata in stream end events; store per-run telemetry:

- per-node elapsed time
- tokens in/out
- fields changed count
- validation errors and auto-repairs
- user edits after autofill (to measure true ROI)

Dify also exposes rich execution logs and run identifiers, which you can retain for auditability. citeturn4search12turn20view1  

### Implementation and testing checklist

- Add automatic extraction of 72 keys and section grouping from `npa-template-definition.ts` into:
  - JSON Schemas per section
  - a field registry CSV
- Implement baseline population from `similar_npa_id` (DB copy-first).
- Build a deterministic rule engine for stable fields (booking family/typology/etc.).
- Convert AUTOFILL to a Chatflow with:
  - multiple Answer nodes for readable progress
  - structured-output LLM nodes for delta sets only
  - one merge/validate node
- Replace “raw Dify SSE passthrough” with a proxy that:
  - parses Dify SSE and emits sanitized SSE events
  - never streams JSON tokens to the UI
  - streams patch updates and progress signals
- Add a regression suite:
  - replay past NPAs and measure key coverage, content length, time-to-first-field, time-to-final, and per-field edit rate
- Add a model swap plan:
  - Sonnet 3.5 lifecycle risk is significant on Anthropic’s own API; keep schemas and prompts model-agnostic so you can switch. citeturn19view1turn19view0