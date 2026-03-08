# DCE Account Opening — Agent Setup: SA-4 KYC/CDD Preparation

| Field | Value |
|---|---|
| **Agent ID** | SA-4 |
| **DAG Node** | N-3 |
| **Agent Name** | KYC/CDD Preparation Agent |
| **Dify Type** | Agent (AG) — Autonomous Reasoning Loop with HITL Pause |
| **LLM** | Claude Sonnet 4.6 (full agent reasoning loop) |
| **Total Skills** | 9 |
| **SLA Window** | 4 hours (agent processing) + 2 business days RM review (URGENT) / 5 business days (STANDARD) |
| **Max Retries** | 1 (if RM returns incomplete decisions — returned to workbench with missing fields) |
| **HITL Required** | **YES** — Relationship Manager must complete full KYC/CDD/BCAP review and submit all mandatory decisions |
| **Trigger** | HTTP Request from DCE Orchestrator on `SIGNATURE_APPROVED` event |
| **Upstream** | N-2 (SA-3 Signature Verification) |
| **Downstream** | N-4 (SA-5 Credit Preparation) + N-4b (SA-6 Static Config — spec prep begins in parallel on `RM_DECISION_CAPTURED`) |
| **HITL Actor** | Relationship Manager (Agentic Workbench — RM View + optional Chatflow CF companion) |
| **Compliance Rules** | MAS Notice SFA 02-N13 (CDD/KYC), MAS Notice 626 (AML/CFT), HKMA AML/CFT Guidelines |

---

## 1. Agent Purpose

SA-4 is the **KYC/CDD intelligence engine** of the account opening pipeline. It uses Dify's Agent (AG) type — the only Agent-type node in the DCE AO DAG — because entity structure analysis, multi-jurisdiction ownership chain mapping, and screening result interpretation require dynamic reasoning that cannot be reduced to a fixed deterministic DAG path.

**Core responsibilities:**

1. **Entity Structure Analysis:** Parses extracted document data to build the legal entity's complete ownership chain — identifying parent entities, subsidiaries, beneficial owners (above the 25% regulatory threshold), directors, authorised signatories, and guarantors.

2. **Comprehensive Screening:** Runs all identified names (entity + directors + UBOs + guarantors) through sanctions lists (Refinitiv World-Check), PEP databases (Dow Jones Risk), and adverse media sources (Factiva) in a single batch call. A **confirmed sanctions hit triggers immediate case suspension** — the agent does not continue.

3. **KYC/CDD/BCAP Brief Compilation:** Assembles a structured review brief covering entity summary, ownership structure map, ACRA/CoI validation, directors' identification summary (minimum 2 key directors), UBO/guarantor details, screening results, source of wealth indicators, MAS retail investor flags (if applicable), risk factors, and open questions for RM investigation.

4. **RM Review Facilitation:** Posts brief to the RM's Agentic Workbench queue. An optional Chatflow (CF) companion agent allows the RM to ask clarifying questions about screening findings before submitting decisions.

5. **RM Decision Capture:** Validates and persists all mandatory RM decisions: KYC risk rating, CDD clearance, BCAP clearance, Credit Assessment Approach (IRB/SA), recommended DCE Limit (SGD), recommended DCE-PCE Limit (SGD), OSCA case number, and limit exposure indication.

---

## 2. Dify Agent Canvas — Reasoning Loop Structure

> **Dify Agent (AG) Type:** Unlike Workflow (WF), the Agent type uses an autonomous LLM reasoning loop. The agent receives a system prompt, a set of tools, and knowledge bases. It dynamically decides which tools to call and in what order based on entity structure complexity. Simple CORP entities may skip ACRA validation; complex fund/SPV structures may require multiple rounds of corporate registry lookups. The canvas describes the reasoning loop rather than a static node DAG.

```
══════════════════ PHASE 1 — PRE-HITL (AGENT LOOP) ══════════════════

[START NODE]
  │  Input: {case_id, extracted_data{}, entity_type, jurisdiction, products_requested[]}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-4 Regulatory Requirements]               ← Node 1
  │  Query: "KYC/CDD requirements for {entity_type} in {jurisdiction}
  │           trading {products_requested}"
  │  Max Chunks: 6 | Relevance: > 0.75
  │  Output: {regulatory_rules, cdd_triggers, edd_criteria, retail_investor_obligations}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-3 GTA & Schedule Reference]              ← Node 2
  │  Query: "Applicable product schedules and regulatory classification
  │           for {products_requested}"
  │  Max Chunks: 4 | Relevance: > 0.75
  │  Output: {applicable_schedules, regulatory_classification}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-6 DCE Product Reference]                 ← Node 3
  │  Query: "Product risk profiles and margin requirements for {products_requested}"
  │  Max Chunks: 3 | Relevance: > 0.70
  │  Output: {product_risk_profiles, typical_margin_profiles}
  │
  ──────────────── AGENT REASONING LOOP BEGINS ────────────────────────

  System Prompt (SA-4 Role Scope Template):
  ┌─────────────────────────────────────────────────────────────────────┐
  │ "You are the DCE KYC/CDD Preparation Specialist at ABS Bank.        │
  │  Your task is to prepare a COMPLETE, ACCURATE, and AUDITABLE        │
  │  KYC/CDD/BCAP review brief for the Relationship Manager.            │
  │                                                                      │
  │  MANDATORY RULES:                                                    │
  │  1. Screen ALL individual names in the entity structure.             │
  │     No director, UBO, guarantor, or signatory may be omitted.       │
  │     Indirect UBOs above 25% threshold must be identified.           │
  │  2. If a sanctions hit is CONFIRMED (not potential): call            │
  │     sa4_escalate_sanctions_hit IMMEDIATELY. Do not compile brief.    │
  │     Do not continue the loop. Return suspended outcome.              │
  │  3. You surface FINDINGS for RM review — you do NOT make KYC        │
  │     determinations. Risk rating is RM's decision.                    │
  │  4. Distinguish CONFIRMED hits vs POTENTIAL MATCH clearly.          │
  │     Potential matches must be flagged in brief for RM investigation. │
  │  5. Brief must cover all sections: entity summary, ownership chain,  │
  │     ACRA/CoI validation, director IDs, screening results,            │
  │     source of wealth, risk factors, retail investor flag, open Qs.  │
  │  Context: {AO Case State Block — case_id, account_type, priority,   │
  │            jurisdiction, N-2 output, KB chunks}"                    │
  └─────────────────────────────────────────────────────────────────────┘

  ├─► TOOL: sa4_get_case_context                                  (Turn 1)
  │     • Fetch case state from dce_ao_case_state
  │     • Fetch N-2 N2Output from dce_ao_node_checkpoint (specimens + verification status)
  │     • Fetch classification result (account_type, entity_type, products, jurisdiction)
  │     • Fetch all OCR-extracted document fields from dce_ao_document_ocr_result
  │       (entity_name, directors, UBOs, addresses, LEI, signatory_names, etc.)
  │     Output: {case_context, extracted_data{}, n2_output, classification_result}
  │
  ├─► TOOL: sa4_extract_entity_structure                          (Turn 2)
  │     • Parse extracted_data to build complete ownership chain
  │     • Identify: parent entities, subsidiaries, beneficial owners (> 25% threshold)
  │     • Identify: all directors (from CoI/ACRA), authorised signatories, guarantors
  │     • Cross-reference N-2 verified signatories for identity confirmation
  │     • Output individuals_to_screen[] — deduplicated list of all names requiring screening
  │     DB Write: INSERT dce_ao_kyc_brief (partial — entity structure section only)
  │     Output: {entity_structure{}, individuals_to_screen[], ownership_chain_json}
  │
  ├─► TOOL: sa4_run_screening_batch                               (Turn 3)
  │     • COMBINED batch for ALL names in individuals_to_screen[]:
  │       — sanctions_screener (API-3: Refinitiv World-Check):
  │             screen entity + all directors + UBOs + guarantors
  │             Returns: per-name hit_status (CLEAR/POTENTIAL_MATCH/HIT_CONFIRMED), detail
  │       — pep_screener (API-4: Dow Jones Risk):
  │             screen directors and UBOs for PEP status
  │             Returns: per-name pep_status, source, pep_category
  │       — adverse_media_search (API-5: Factiva):
  │             search adverse media for entity + key individuals
  │             Returns: per-name media_hits[], source, date, summary
  │     DB Write: INSERT dce_ao_screening_result (1 row per name screened)
  │     Output: {sanctions_results[], pep_results[], adverse_media_results[]}
  │
  ├─► [AGENT DECISION POINT] — Sanctions Hit Assessment            (Turn 4 — LLM reasoning)
  │     IF any name has sanctions_status = HIT_CONFIRMED:
  │       └─► TOOL: sa4_escalate_sanctions_hit                    (IMMEDIATE STOP)
  │                 • HTTP POST /api/escalations
  │                     {type: SANCTIONS_HIT, case_id, hit_detail, names_hit[]}
  │                 • Notify Compliance via SA-7 (SANCTIONS_ESCALATION, priority: CRITICAL)
  │                 • INSERT dce_ao_node_checkpoint (N-3, SUSPENDED_SANCTIONS)
  │                 • UPDATE dce_ao_case_state SET status=ESCALATED
  │                 • INSERT dce_ao_event_log (SANCTIONS_HIT)
  │                 → END NODE (case suspended — no further processing)
  │
  ├─► [AGENT DECISION POINT] — Corporate Registry Lookup (Conditional)
  │     IF entity_type = CORP or FI AND jurisdiction IN (SGP, HKG):
  │       └─► TOOL: sa4_lookup_corporate_registry                 (Turn 4 or 5)
  │                 • SGP: ACRA BizFile API (API-6) — directors, shareholders, reg. capital
  │                 • HKG: Hong Kong Companies Registry — similar fields
  │                 • Cross-reference against submitted ACRA extract or Certificate of Incumbency
  │                 • Identify discrepancies (missing directors, shareholding changes)
  │                 Output: {acra_data{}, discrepancies[], registry_match_status}
  │
  ├─► TOOL: sa4_compile_and_submit_kyc_brief                      (Turn 5 or 6)
  │     Assemble complete KYC/CDD/BCAP brief using all gathered data:
  │       Section 1 — Entity Summary:
  │         legal_name, jurisdiction, incorporation_date, LEI, entity_type,
  │         registered_address, operating_address
  │       Section 2 — Ownership Structure:
  │         tabular ownership chain (entity → % shareholding → jurisdiction per level)
  │         beneficial owners above 25% threshold with ID references
  │       Section 3 — ACRA / CoI Summary:
  │         directors listed, shareholders, registered capital, discrepancies if any
  │       Section 4 — Directors' Identification:
  │         minimum 2 key directors — name, ID type, ID number, nationality, role
  │       Section 5 — UBO / Guarantor Identification:
  │         each UBO and guarantor with ID details and % ownership/relationship
  │       Section 6 — Screening Results:
  │         sanctions: CLEAR / POTENTIAL_MATCH (detail) / HIT_CONFIRMED (stops earlier)
  │         PEP: NONE / FLAGGED (names, categories, sources)
  │         adverse media: CLEAR / FOUND (number of hits, severity, topics)
  │       Section 7 — Source of Wealth Indicators:
  │         extracted from financial documents (if present) — revenue, equity, business nature
  │       Section 8 — Risk Factors Identified:
  │         jurisdiction risk, entity complexity, PEP exposure, product risk, client tier
  │       Section 9 — Retail Investor Flag:
  │         is_retail_investor (true/false) + MAS risk disclosure confirmation if applicable
  │       Section 10 — Open Questions for RM:
  │         specific gaps, unresolved discrepancies, items requiring RM investigation
  │       Section 11 — Suggested Risk Rating Range:
  │         agent-suggested range only (LOW/MEDIUM/HIGH) — RM makes final determination
  │     • POST /api/workbench/rm-review-queue {case_id, kyc_brief}
  │     • Notify RM via SA-7 (TASK_ASSIGNMENT: KYC_CDD_REVIEW, deadline, priority)
  │     DB Write: UPDATE dce_ao_kyc_brief (full brief — all sections completed)
  │     Output: {kyc_brief_id, brief_url, notification_sent}
  │
  ──────────────── AGENT REASONING LOOP ENDS ─────────────────────────
  │
  ▼
[CODE: Checkpoint Writer — HITL_PENDING]                          ← Node 4
  │  MCP Tool: sa4_park_for_hitl
  │  • INSERT dce_ao_hitl_review_task (HITL-XXXXXX, N-3, RM, PENDING)
  │  • INSERT dce_ao_node_checkpoint (N-3, HITL_PENDING)
  │  • UPDATE dce_ao_case_state SET status=HITL_PENDING
  │  • INSERT dce_ao_event_log (KYC_BRIEF_SUBMITTED)
  │
  ▼
[END: HITL_PENDING]                                               ← Node 5
  Return: {status: "HITL_PENDING", kyc_brief_id, brief_url,
           rm_id, hitl_deadline, next_action: "RM_REVIEW"}

══════════════════════════════════════════════════════════════════════
  ──  EXECUTION PARKS HERE                                           ──
  ──  RM reviews KYC/CDD/BCAP brief in Agentic Workbench             ──
  ──  Optional: RM uses Chatflow (CF) companion agent to query       ──
  ──    screening results, ask clarifying questions about entities   ──
  ──  RM submits all mandatory decisions via RM View decision form   ──
  ──  Spring Boot calls Dify Workflow resume endpoint with           ──
  ──  rm_decisions payload                                           ──
══════════════════════════════════════════════════════════════════════

═══════════════════ PHASE 2 — POST-HITL (RESUMED) ═══════════════════

[START: Resume Node — RM Decision Received]                       ← Node 6
  │  Input: {case_id, mode: "RESUME", hitl_task_id, rm_decisions{}}
  │
  ▼
[CODE: RM Decision Validator]                                     ← Node 7 (SKL-09)
  │  Validate all mandatory RM fields are present and valid:
  │    ✓ kyc_risk_rating        — must be: LOW / MEDIUM / HIGH / UNACCEPTABLE
  │    ✓ cdd_clearance          — must be: CLEARED / ENHANCED_DUE_DILIGENCE / DECLINED
  │    ✓ bcap_clearance         — must be: true / false
  │    ✓ caa_approach           — must be: IRB / SA
  │    ✓ recommended_dce_limit_sgd      — must be: numeric, > 0
  │    ✓ recommended_dce_pce_limit_sgd  — must be: numeric, > 0
  │    ✓ osca_case_number       — must be: non-empty string
  │    ✓ limit_exposure_indication      — must be: non-empty string
  │  Output: {validation_status, missing_fields[], rm_decisions_validated}
  │
  ▼
[IF/ELSE: All Mandatory Fields Present?]                          ← Node 8
  │
  ├─ NO (missing_fields[] not empty)
  │     [HTTP: Return to RM Workbench with specific missing fields highlighted]
  │     [CODE: Write N-3 HITL_PENDING checkpoint (partial submission)]
  │     [END: Return {next_node: "HITL_PENDING", missing_fields[],
  │                   message: "Please complete all mandatory fields"}]
  │
  └─ YES — Continue
  │
  ▼
[IF/ELSE: KYC Risk Rating = UNACCEPTABLE?]                        ← Node 9
  │
  ├─ YES
  │     [HTTP: PATCH /api/cases/{case_id} {status: KYC_DECLINED}]
  │     [HTTP: Notify DCE Orchestrator (KYC_DECLINED)]
  │     [HTTP: Trigger SA-7 (notify Sales Dealer + RM with KYC_DECLINED reason)]
  │     [CODE: Write N-3 FAILED checkpoint]
  │     [INSERT dce_ao_event_log (KYC_DECLINED, NODE_FAILED)]
  │     [END: Return {next_node: "DEAD", reason: "KYC_DECLINED_BY_RM",
  │                   rm_id, decided_at}]
  │
  └─ NO — Continue
  │
  ▼
[CODE: Store RM Decisions]                                        ← Node 10 (SKL-08)
  │  MCP Tool: sa4_capture_rm_decisions
  │  • INSERT dce_ao_rm_kyc_decision (all validated RM fields)
  │  • UPDATE dce_ao_case_state {rm_decision_captured: true}
  │  • PATCH /api/cases/{case_id}/rm_decisions {rm_decisions_validated}
  │  Output: {decision_id, decisions_stored}
  │
  ▼
[CODE: Checkpoint Writer]                                         ← Node 11 (MANDATORY)
  │  MCP Tool: sa4_complete_node
  │  • INSERT dce_ao_node_checkpoint (N-3, COMPLETE, output_json = N3Output)
  │  • UPDATE dce_ao_case_state SET current_node='N-4',
  │           completed_nodes=['N-0','N-1','N-2','N-3'],
  │           status='ACTIVE'
  │  • INSERT dce_ao_event_log (RM_DECISION_CAPTURED, NODE_COMPLETED)
  │  • HTTP: Notify DCE Orchestrator (RM_DECISION_CAPTURED)
  │  • TOOL: kafka_publish (dce.rm.decision.captured)
  │    → Triggers parallel: SA-5 Credit Preparation (N-4)
  │                       + SA-6 Static Config spec prep (N-4b begins in parallel)
  │
  ▼
[END: Return N3Output JSON]                                       ← Node 12
```

---

## 3. Node / Tool Significance Table

> SA-4 uses Dify Agent (AG) type. The "nodes" are either deterministic KB retrieval nodes (pre-loop) or tool calls within the autonomous agent reasoning loop. The tool call sequence is dynamic — the table shows the expected path for a standard corporate entity. Complex fund/SPV/multi-jurisdictional structures may require additional corporate registry lookups or multiple screening passes.

| # | Node / Tool | Type | Skill | Significance | Failure Impact |
|---|---|---|---|---|---|
| KB-1 | KB-4 Retrieval (Regulatory) | Knowledge Retrieval | — | Loads jurisdiction-specific CDD/KYC rules, EDD triggers, and retail investor obligations. Defines what the brief must cover for this entity type and jurisdiction. | KB failure → use cached regulatory rules; alert KB Admin |
| KB-2 | KB-3 Retrieval (GTA) | Knowledge Retrieval | — | Loads applicable product schedules. Determines if any product-specific KYC steps are required (e.g., Schedule 7A requires exchange membership confirmation). | KB failure → use hardcoded product-schedule mapping |
| KB-3 | KB-6 Retrieval (Products) | Knowledge Retrieval | — | Loads product risk profiles and typical margin data. Used to contextualise the suggested risk rating range in the brief. | KB failure → omit product risk context section |
| 1 | `sa4_get_case_context` | Tool | SKL-01 | **Mandatory first call.** Loads all extracted document data from SA-2 OCR results. Without this, the agent has no entity data to work with — cannot identify persons to screen or build ownership chain. | Abort — no entity data = no brief possible |
| 2 | `sa4_extract_entity_structure` | Tool | SKL-02 | **Core structure task.** Builds the ownership chain and identifies ALL individuals requiring screening. Completeness here is a compliance obligation — missed individuals create regulatory exposure. | Extraction failure → flag for manual entity review by KYC Analyst |
| 3 | `sa4_run_screening_batch` | Tool | SKL-03/04/05 | **Compliance gate.** Screens all entity names + directors + UBOs simultaneously across sanctions, PEP, and adverse media. Confirmed sanctions hit = immediate case suspension, no brief compiled. | Screening API failure → retry 2x → hold case, alert Compliance (cannot bypass) |
| — | Sanctions Assessment | Agent Decision | — | **Hard stop rule.** Agent evaluates screening results. CONFIRMED hit → `sa4_escalate_sanctions_hit` immediately. POTENTIAL MATCH → flagged in brief for RM investigation. | Confirmed hit → SUSPENDED_SANCTIONS → no downstream processing |
| 4 | `sa4_lookup_corporate_registry` | Tool | SKL-06 | **Conditional.** For SGP/HKG CORP and FI entities, validates corporate registry data (ACRA/Hong Kong CoR) against submitted documents. Identifies undisclosed directors or shareholding discrepancies. | ACRA API failure → note in brief: "Registry unavailable — RM to confirm manually" |
| 5 | `sa4_compile_and_submit_kyc_brief` | Tool | SKL-07 | **Highest-value output.** The KYC/CDD/BCAP brief is the primary regulatory deliverable of this node. Quality directly determines RM decision quality and the defensibility of the account opening audit trail. | Retry 1x → if still fails, email RM directly with raw screening data |
| 6 | `sa4_park_for_hitl` | Tool | SKL-08 | Creates HITL task record for RM and writes HITL_PENDING checkpoint. Atomic operation — ensures HITL task and checkpoint are consistent. | Checkpoint failure → case stuck at N-2 state |
| 7 | RM Decision Validator | Code Node | SKL-09 | Validates ALL mandatory RM decision fields. Catches incomplete submissions before they reach the DB. Prevents downstream Credit/Static Config from processing with incomplete KYC data. | Incomplete submission → return to RM with highlighted missing fields |
| 8 | KYC UNACCEPTABLE Router | IF/ELSE | — | Hard gate. UNACCEPTABLE KYC risk rating = case terminated (DEAD). No credit assessment proceeds for unacceptable risk profiles. Protects ABS from onboarding high-risk entities. | N/A — deterministic |
| 9 | `sa4_capture_rm_decisions` | Tool | SKL-08 | Stores all RM decisions atomically. These are the regulatory-required human approvals that must be immutably recorded for MAS/HKMA audit. | DB failure → retry 3x → hard block (decisions must be persisted) |
| 10 | `sa4_complete_node` | Tool | — | **MANDATORY.** Advances case to N-4, fires RM_DECISION_CAPTURED Kafka event that triggers parallel SA-5 (Credit) and SA-6 (Static Config spec prep). | Checkpoint failure → case stuck at N-3 state |

---

## 4. Knowledge Bases Required

| KB ID | KB Name | Used By | Purpose | Query Pattern |
|---|---|---|---|---|
| **KB-4** | Regulatory Requirements KB | Agent KB retrieval (Node 1), `sa4_compile_and_submit_kyc_brief` | MAS and HKMA KYC/CDD rules by jurisdiction and entity type. CDD enhanced due diligence triggers. MAS retail investor obligations and risk disclosure requirements. Document certification and notarisation requirements. Sanctions screening obligations. | "KYC/CDD requirements for {entity_type} in {jurisdiction} trading {products_requested}" |
| **KB-3** | GTA & Schedule Reference KB | Agent KB retrieval (Node 2) | Applicable product schedules and regulatory classification per product. Product-specific KYC requirements embedded in schedule conditions. | "Applicable GTA schedules and regulatory classification for {products_requested}" |
| **KB-6** | DCE Product Reference KB | Agent KB retrieval (Node 3) | Product risk profiles and typical margin requirements. Provides context for agent's suggested risk rating range in the KYC brief. | "Product risk profile and typical margin requirements for {products_requested}" |

**KB Configuration:**

| Setting | KB-4 | KB-3 | KB-6 |
|---|---|---|---|
| Max Chunks | 6 | 4 | 3 |
| Relevance Threshold | 0.75 | 0.75 | 0.70 |
| Embedding Model | text-embedding-3-large | text-embedding-3-large | text-embedding-3-large |
| Chunk Size | 500 tokens | 400 tokens | 400 tokens |
| Chunk Overlap | 50 tokens | 40 tokens | 40 tokens |

---

## 5. MCP Tools

> **Design Note — Consolidated for 10-Iteration Cap:**
> SA-4 is an Agent (AG) type with a dynamic reasoning loop. The 10-iteration cap covers both pre-HITL and post-HITL phases combined. The 5 granular screening tools from the MCP registry (T-12 sanctions_screener, T-13 pep_screener, T-14 adverse_media_search, T-15 acra_lookup, T-16 brief_compiler) are consolidated into 3 batch MCP tools to stay within the cap while retaining per-name granularity in the structured response payloads.

| # | Tool Name | Covers Skills | DB Tables Written | Purpose |
|---|---|---|---|---|
| 1 | `sa4_get_case_context` | SKL-01, Context Injector | READ: `dce_ao_case_state`, `dce_ao_node_checkpoint`, `dce_ao_document_ocr_result`, `dce_ao_classification_result`, `dce_ao_signature_specimen` | Fetches complete case context: case state, N-2 N2Output from checkpoint (specimens + verification status), classification result (account_type, entity_type, products), and all OCR-extracted document fields (entity_name, directors, UBOs, LEI, addresses, etc.). For retries: includes prior N-3 attempt context. |
| 2 | `sa4_extract_entity_structure` | SKL-02 | INSERT: `dce_ao_kyc_brief` (partial — entity_structure section) | Parses extracted_data to build the complete ownership chain JSON. Identifies all individuals requiring screening: directors, beneficial owners (>25%), guarantors, authorised signatories. Cross-references N-2 verified signatories for identity confirmation. Returns structured entity_structure{} and deduplicated individuals_to_screen[]. |
| 3 | `sa4_run_screening_batch` | SKL-03, SKL-04, SKL-05 | INSERT: `dce_ao_screening_result` (1 row per name screened) | Atomic batch screening for ALL names in individuals_to_screen[]: (1) sanctions_screener via Refinitiv World-Check API (API-3), (2) pep_screener via Dow Jones Risk API (API-4), (3) adverse_media_search via Factiva API (API-5). Returns per-name sanctions_status, pep_status, adverse_media_hits[]. Confirmed sanctions hit returned with HIT_CONFIRMED flag for agent to detect. |
| 4 | `sa4_lookup_corporate_registry` | SKL-06 | READ only (external validation — no write to case tables) | Conditional tool — agent calls for SGP/HKG corporate entities. Queries ACRA BizFile (Singapore, API-6) or Hong Kong Companies Registry. Returns: directors[], shareholders[], registered_capital, incorporation_date. Cross-references against submitted ACRA extract or Certificate of Incumbency to identify discrepancies. |
| 5 | `sa4_escalate_sanctions_hit` | Emergency | INSERT: `dce_ao_node_checkpoint` (SUSPENDED_SANCTIONS); UPDATE: `dce_ao_case_state` {status: ESCALATED}; INSERT: `dce_ao_event_log` (SANCTIONS_HIT) | Called ONLY on HIT_CONFIRMED sanctions result. Posts to Compliance escalation API (`POST /api/escalations`), triggers SA-7 SANCTIONS_ESCALATION notification (priority: CRITICAL), writes SUSPENDED_SANCTIONS checkpoint. Terminates agent loop immediately. This tool must never be skipped on a confirmed hit. |
| 6 | `sa4_compile_and_submit_kyc_brief` | SKL-07 | UPDATE: `dce_ao_kyc_brief` (full — all 11 sections) | Assembles complete KYC/CDD/BCAP brief from all gathered data. Posts to RM workbench queue (`POST /api/workbench/rm-review-queue`). Triggers RM notification via SA-7 (TASK_ASSIGNMENT). Returns kyc_brief_id and brief_url. |
| 7 | `sa4_park_for_hitl` | SKL-08 | INSERT: `dce_ao_hitl_review_task`; INSERT: `dce_ao_node_checkpoint` (HITL_PENDING); UPDATE: `dce_ao_case_state`; INSERT: `dce_ao_event_log` (KYC_BRIEF_SUBMITTED) | Creates HITL task record for RM (task_type: KYC_CDD_REVIEW). Writes HITL_PENDING checkpoint. Parks workflow. Atomic transaction. |
| 8 | `sa4_capture_rm_decisions` | SKL-09 | INSERT: `dce_ao_rm_kyc_decision`; UPDATE: `dce_ao_case_state` (`rm_decision_captured: true`); PATCH: Spring Boot Case API | Validates completeness of all RM decisions against N3Output schema. Stores validated RM decisions atomically. Patches Spring Boot case record with rm_decisions. Returns decision_id. |
| 9 | `sa4_complete_node` | Checkpoint Writer | INSERT: `dce_ao_node_checkpoint` (COMPLETE/FAILED/SUSPENDED); UPDATE: `dce_ao_case_state`; INSERT: `dce_ao_event_log` (RM_DECISION_CAPTURED, NODE_COMPLETED) | Mandatory checkpoint writer. On COMPLETE: advances current_node to N-4, fires RM_DECISION_CAPTURED Kafka event triggering parallel SA-5 (Credit) and SA-6 (Static Config spec prep). On DEAD (KYC_DECLINED): records failure. On SUSPENDED_SANCTIONS: already written by sa4_escalate_sanctions_hit. |

**Agent Iteration Flow (maximum 10 turns — split across both phases):**

| Phase | Turn | Type | Tool / Action |
|---|---|---|---|
| **Pre-HITL** | 1 | Tool | `sa4_get_case_context` — fetch case + N-2 output + all extracted document fields |
| | 2 | Tool | `sa4_extract_entity_structure` — build ownership chain + identify all persons to screen |
| | 3 | Tool | `sa4_run_screening_batch` — sanctions + PEP + adverse media for ALL names in one batch |
| | 4 | LLM decision | Agent evaluates results → if HIT_CONFIRMED: call `sa4_escalate_sanctions_hit` (STOP) |
| | 5 | Tool (conditional) | `sa4_lookup_corporate_registry` — ACRA/HKCoR validation (for CORP/FI entities in SGP/HKG) |
| | 6 | Tool | `sa4_compile_and_submit_kyc_brief` — assemble 11-section brief + post to RM workbench |
| | 7 | Tool | `sa4_park_for_hitl` — write HITL_PENDING checkpoint |
| **— PARK: HITL —** | — | HUMAN | RM reviews KYC brief, optionally queries CF companion, submits all mandatory decisions |
| **Post-HITL** | 8 | Code | Decision Validator — validate all mandatory RM fields (deterministic, no tool call) |
| | 9 | Tool | `sa4_capture_rm_decisions` — validate + store RM decisions atomically |
| | 10 | Tool | `sa4_complete_node` — write N-3 COMPLETE checkpoint + advance to N-4 |

---

## 6. Database Tables — Read/Write Map

> **Column Mapping Notes:**
> - `dce_ao_kyc_brief.ownership_chain` stores the full entity ownership structure as nested JSON. For complex fund/SPV structures this may have 3–5 levels of nesting.
> - `dce_ao_screening_result` has one row per individual name screened — entity itself, each director, each UBO, guarantors. A case with 5 directors and 3 UBOs = 9 screening rows (entity + 5 + 3).
> - `dce_ao_rm_kyc_decision` is UNIQUE on case_id — only one RM decision record per case. Resubmissions overwrite the prior decision (with audit captured in `dce_ao_event_log`).

### Tables SA-4 Writes (creates)

| Table | Operation | Skill | When |
|---|---|---|---|
| `dce_ao_kyc_brief` | INSERT (partial) + UPDATE (full) | SKL-02 + SKL-07 | Entity structure section on extraction; full 11-section brief on compilation |
| `dce_ao_screening_result` | INSERT (1 row per name) | SKL-03/04/05 | After batch screening completes |
| `dce_ao_rm_kyc_decision` | INSERT | SKL-09 | After RM submits decisions (Phase 2) |
| `dce_ao_hitl_review_task` | INSERT | SKL-08 | When parking for HITL (Phase 1 end) |
| `dce_ao_node_checkpoint` | INSERT | Phase 1 end + Phase 2 end | HITL_PENDING → COMPLETE (or DEAD / SUSPENDED_SANCTIONS) |
| `dce_ao_event_log` | INSERT (3–4 rows) | Throughout | KYC_SCREENING_COMPLETE, KYC_BRIEF_SUBMITTED, RM_DECISION_CAPTURED, NODE_COMPLETED / NODE_FAILED / SANCTIONS_HIT |

### Tables SA-4 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context fetch (case type, jurisdiction, priority) |
| `dce_ao_node_checkpoint` | SELECT | Context fetch (N-2 N2Output, prior N-3 attempt if retry) |
| `dce_ao_document_ocr_result` | SELECT | Entity structure extraction (all OCR-extracted fields) |
| `dce_ao_classification_result` | SELECT | Account type, entity type, products, jurisdiction |
| `dce_ao_signature_specimen` | SELECT | Confirm signatory identities vs mandate signatories |
| `dce_ao_rm_hierarchy` | SELECT | RM details for HITL notification routing and brief header |

### New Tables SA-4 Creates

```sql
-- KYC/CDD Brief (one record per case per attempt — compiled by SA-4)
CREATE TABLE dce_ao_kyc_brief (
    brief_id                    VARCHAR(30) PRIMARY KEY,        -- BRIEF-XXXXXX
    case_id                     VARCHAR(20) NOT NULL,
    attempt_number              INT NOT NULL DEFAULT 1,
    -- Entity summary
    entity_legal_name           VARCHAR(200) NOT NULL,
    entity_type                 ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    incorporation_jurisdiction  VARCHAR(10),
    incorporation_date          DATE,
    lei_number                  VARCHAR(20),
    -- Ownership structure (variable depth JSON)
    ownership_chain             JSON,                           -- Nested ownership chain
    beneficial_owners           JSON,                           -- UBOs above 25% threshold
    directors                   JSON,                           -- Director list with ID references
    -- Screening summary
    sanctions_status            ENUM('CLEAR','POTENTIAL_MATCH','HIT_CONFIRMED') NOT NULL,
    pep_flag_count              INT DEFAULT 0,
    adverse_media_found         BOOLEAN DEFAULT FALSE,
    names_screened_count        INT DEFAULT 0,
    -- Retail investor
    is_retail_investor          BOOLEAN DEFAULT FALSE,
    mas_risk_disclosure_confirmed BOOLEAN DEFAULT FALSE,
    -- Brief output
    brief_url                   VARCHAR(500),                   -- Workbench URL
    open_questions              JSON,                           -- Open questions for RM
    suggested_risk_range        VARCHAR(20),                    -- Agent suggestion: LOW/MEDIUM/HIGH
    -- Metadata
    compiled_by_model           VARCHAR(50),                    -- e.g. claude-sonnet-4-6
    kb_chunks_used              JSON,                           -- KB-4, KB-3, KB-6 chunk IDs
    compiled_at                 DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_sanctions (sanctions_status)
);

-- Per-name screening results (one row per individual/entity screened)
CREATE TABLE dce_ao_screening_result (
    screening_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    brief_id            VARCHAR(30) NOT NULL,
    person_name         VARCHAR(200) NOT NULL,
    person_role         ENUM('ENTITY','DIRECTOR','UBO','GUARANTOR',
                             'SIGNATORY','SHAREHOLDER') NOT NULL,
    -- Sanctions
    sanctions_status    ENUM('CLEAR','POTENTIAL_MATCH','HIT_CONFIRMED') NOT NULL,
    sanctions_source    VARCHAR(100),                           -- e.g. "Refinitiv World-Check v4"
    sanctions_detail    JSON,                                   -- Hit detail if status != CLEAR
    -- PEP
    pep_status          ENUM('NONE','POTENTIAL_PEP','CONFIRMED_PEP') NOT NULL DEFAULT 'NONE',
    pep_source          VARCHAR(100),                           -- e.g. "Dow Jones Risk"
    pep_detail          JSON,                                   -- PEP category, country, source
    -- Adverse media
    adverse_media_found BOOLEAN DEFAULT FALSE,
    adverse_media_count INT DEFAULT 0,
    adverse_media_hits  JSON,                                   -- Summary: source, date, topic
    -- Metadata
    screened_at         DATETIME DEFAULT NOW(),
    screening_api_version VARCHAR(50),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (brief_id) REFERENCES dce_ao_kyc_brief(brief_id),
    INDEX idx_case (case_id),
    INDEX idx_brief (brief_id),
    INDEX idx_sanctions (sanctions_status),
    INDEX idx_name (person_name)
);

-- RM KYC/CDD decisions (captured post-HITL — immutable regulatory record)
CREATE TABLE dce_ao_rm_kyc_decision (
    decision_id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                         VARCHAR(20) NOT NULL,
    brief_id                        VARCHAR(30) NOT NULL,
    -- Mandatory RM decisions
    kyc_risk_rating                 ENUM('LOW','MEDIUM','HIGH','UNACCEPTABLE') NOT NULL,
    cdd_clearance                   ENUM('CLEARED','ENHANCED_DUE_DILIGENCE','DECLINED') NOT NULL,
    bcap_clearance                  BOOLEAN NOT NULL,
    caa_approach                    ENUM('IRB','SA') NOT NULL,
    recommended_dce_limit_sgd       DECIMAL(15,2) NOT NULL,
    recommended_dce_pce_limit_sgd   DECIMAL(15,2) NOT NULL,
    osca_case_number                VARCHAR(50) NOT NULL,
    limit_exposure_indication       TEXT,
    -- Additional conditions (optional)
    additional_conditions           JSON,
    -- RM metadata
    rm_id                           VARCHAR(20) NOT NULL,
    rm_name                         VARCHAR(200),
    decided_at                      DATETIME NOT NULL,
    -- Chatflow context (if RM used CF companion agent)
    chatflow_session_id             VARCHAR(50),
    chatflow_queries_count          INT DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (brief_id) REFERENCES dce_ao_kyc_brief(brief_id),
    UNIQUE KEY idx_case (case_id),                              -- One decision record per case
    INDEX idx_rm (rm_id),
    INDEX idx_rating (kyc_risk_rating)
);
```

---

## 7. Input Format

### Trigger: SIGNATURE_APPROVED from DCE Orchestrator

```json
{
  "case_id": "AO-2026-000101",
  "extracted_data": {
    "entity_name": "ABC Trading Pte Ltd",
    "entity_type": "CORP",
    "jurisdiction": "SGP",
    "lei_number": "5493006W5RWQLKGH1T16",
    "incorporation_date": "2018-06-15",
    "registered_address": "1 Marina Boulevard, #28-00, Singapore 018989",
    "directors": [
      {
        "name": "John Tan Wei Ming",
        "id_type": "NRIC",
        "id_number": "S7812345A",
        "nationality": "SGP",
        "role": "Director"
      },
      {
        "name": "Sarah Lim Hui Ying",
        "id_type": "NRIC",
        "id_number": "S8023456B",
        "nationality": "SGP",
        "role": "Director"
      }
    ],
    "beneficial_owners": [
      {
        "name": "ABC Holdings Pte Ltd",
        "percentage": 75.0,
        "jurisdiction": "SGP",
        "entity_type": "CORP"
      }
    ],
    "authorised_traders": [
      {
        "name": "John Tan Wei Ming",
        "designation": "Director",
        "id_number": "S7812345A"
      }
    ]
  },
  "entity_type": "CORP",
  "jurisdiction": "SGP",
  "products_requested": ["FUTURES", "OPTIONS"],
  "trigger_event": "SIGNATURE_APPROVED",
  "triggered_at": "2026-03-02T11:30:00+08:00"
}
```

### Resume Trigger: RM Decision from Spring Boot

```json
{
  "case_id": "AO-2026-000101",
  "mode": "RESUME",
  "hitl_task_id": "HITL-000043",
  "rm_decisions": {
    "kyc_risk_rating": "MEDIUM",
    "cdd_clearance": "CLEARED",
    "bcap_clearance": true,
    "caa_approach": "IRB",
    "recommended_dce_limit_sgd": 5000000.00,
    "recommended_dce_pce_limit_sgd": 2500000.00,
    "osca_case_number": "OSCA-2026-001234",
    "limit_exposure_indication": "Estimated trading volume SGD 500k/month; client profile consistent with medium exposure",
    "additional_conditions": null,
    "rm_id": "RM-0042",
    "decided_at": "2026-03-03T14:30:00+08:00"
  }
}
```

---

## 8. Output Format — N3Output (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import Literal, List, Optional


class RMDecisions(BaseModel):
    kyc_risk_rating: Literal["LOW", "MEDIUM", "HIGH", "UNACCEPTABLE"]
    cdd_clearance: Literal["CLEARED", "ENHANCED_DUE_DILIGENCE", "DECLINED"]
    bcap_clearance: bool
    caa_approach: Literal["IRB", "SA"]
    recommended_dce_limit_sgd: float = Field(gt=0)
    recommended_dce_pce_limit_sgd: float = Field(gt=0)
    osca_case_number: str
    limit_exposure_indication: str
    additional_conditions: Optional[List[str]]
    rm_id: str
    decided_at: str                                          # ISO 8601


class N3Output(BaseModel):
    case_id: str                                             # AO-2026-XXXXXX
    kyc_brief_id: str                                        # BRIEF-XXXXXX
    sanctions_status: Literal["CLEAR", "POTENTIAL_MATCH", "HIT_CONFIRMED"]
    pep_flags_count: int = Field(ge=0)
    adverse_media_found: bool
    names_screened_count: int = Field(ge=1)
    rm_decisions: RMDecisions
    next_node: Literal["N-4", "ESCALATE_COMPLIANCE", "HITL_PENDING", "DEAD"]
    brief_url: str
    notes: Optional[str]
```

### Sample Output JSON

```json
{
  "case_id": "AO-2026-000101",
  "kyc_brief_id": "BRIEF-000101",
  "sanctions_status": "CLEAR",
  "pep_flags_count": 0,
  "adverse_media_found": false,
  "names_screened_count": 4,
  "rm_decisions": {
    "kyc_risk_rating": "MEDIUM",
    "cdd_clearance": "CLEARED",
    "bcap_clearance": true,
    "caa_approach": "IRB",
    "recommended_dce_limit_sgd": 5000000.00,
    "recommended_dce_pce_limit_sgd": 2500000.00,
    "osca_case_number": "OSCA-2026-001234",
    "limit_exposure_indication": "SGD 500k/month estimated trading volume; consistent with client profile",
    "additional_conditions": null,
    "rm_id": "RM-0042",
    "decided_at": "2026-03-03T14:30:00+08:00"
  },
  "next_node": "N-4",
  "brief_url": "https://workbench.abs.internal/kyc-briefs/BRIEF-000101",
  "notes": "4 names screened (entity + 2 directors + 1 UBO entity). All clear. Medium risk — OSCA linked. SA-5 and SA-6 now triggered in parallel."
}
```

---

## 9. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| Case Context Fetch (SKL-01) | DB connection / checkpoint not found | Yes | 2 | Alert Operations | Operations (hard block) |
| Entity Structure Extraction (SKL-02) | Malformed extracted_data / parsing error | No | — | Flag for manual entity review by KYC Analyst | KYC Analyst (hard block) |
| Sanctions Screening (SKL-03) | API timeout / unavailable | Yes | 3 | Hold case — screening is mandatory; cannot bypass | Compliance team (hard block) |
| **Sanctions Hit Confirmed** | **Compliance stop** | **No** | **—** | **IMMEDIATE SUSPEND — case terminated, Compliance escalated** | **Compliance (CRITICAL priority)** |
| PEP Screening (SKL-04) | API timeout | Yes | 2 | Mark as POTENTIAL_PEP in brief — RM must verify | Compliance team (noted in brief) |
| Adverse Media (SKL-05) | API failure | Yes | 2 | Note "API unavailable — RM to conduct manual check" in brief | RM (noted in brief) |
| ACRA Lookup (SKL-06) | ACRA API unavailable | Yes | 2 | Note "Registry unavailable — RM to confirm manually" in brief | RM (noted in brief) |
| Brief Compilation (SKL-07) | LLM malformed / timeout | Yes | 2 | Use structured template fallback with raw data | Email RM directly with raw data PDF |
| Workbench Post (SKL-07) | Spring Boot API failure | Yes | 3 | Email RM directly with brief | RM Manager |
| HITL Deadline Breach (RM) | RM no-action > SLA window | Yes (reminders) | 3 (Day 1/2/3 SLA warnings) | SA-7 escalation chain | RM → RM Manager → DCE COO |
| RM Decision Validation | Missing mandatory fields | No | — | Return to RM workbench with specific gaps highlighted | RM (in workbench) |
| RM Decision: UNACCEPTABLE | KYC risk unacceptable | No | — | Case terminated (DEAD) — notify Sales Dealer + RM | Notify Sales Dealer, RM Manager |
| Checkpoint Write | MariaDB failure | Yes | 3 | Alert Operations | Operations (hard block) |

---

## 10. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Agent (AG) — Autonomous Reasoning Loop |
| **Dify App Name** | `DCE-AO-SA4-KYC-CDD-Preparation` |
| **Primary Model** | claude-sonnet-4-6 (full agent reasoning + brief compilation) |
| **Secondary Model** | None — AG type uses a single model for the reasoning loop |
| **Temperature** | 0.2 (slightly higher than WF — dynamic tool selection + complex entity reasoning; brief sections must be precise) |
| **Max Tokens** | 4096 (KYC briefs require detailed structured output across 11 sections) |
| **Knowledge Bases** | KB-4 (Regulatory Requirements), KB-3 (GTA & Schedule Reference), KB-6 (DCE Product Reference) |
| **MCP Tools** | sa4_get_case_context, sa4_extract_entity_structure, sa4_run_screening_batch, sa4_lookup_corporate_registry, sa4_escalate_sanctions_hit, sa4_compile_and_submit_kyc_brief, sa4_park_for_hitl, sa4_capture_rm_decisions, sa4_complete_node |
| **Max Agent Iterations** | 10 (7 pre-HITL + 3 post-HITL) — at 10-iteration cap |
| **Max Retries (Node)** | 1 (incomplete RM decisions returned to workbench) |
| **SLA Window** | 4h agent processing + 2 business days RM review (URGENT) / 5 business days (STANDARD) |
| **HITL Required** | YES — Relationship Manager |
| **HITL Companion** | Optional Chatflow (CF) agent — allows RM to query screening findings before submitting decisions |
| **Checkpoint** | Mandatory — HITL_PENDING (Phase 1) + COMPLETE / DEAD / SUSPENDED_SANCTIONS (Phase 2) |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | KYC_SCREENING_INITIATED, SANCTIONS_SCREENING_COMPLETE, KYC_BRIEF_SUBMITTED, HITL_DECISION_RECEIVED, RM_DECISION_CAPTURED, KYC_DECLINED, SANCTIONS_HIT (emergency), NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa4_` |
| **Output Schema** | N3Output (Pydantic validated) |
| **Compliance References** | MAS Notice SFA 02-N13 (CDD/KYC), MAS Notice 626 (AML/CFT), HKMA AML/CFT Guidelines, ABS KYC Policy |
| **Downstream Triggered** | SA-5 Credit Preparation (N-4) + SA-6 Static Config spec prep (N-4b) — both start in parallel on `RM_DECISION_CAPTURED` Kafka event |
