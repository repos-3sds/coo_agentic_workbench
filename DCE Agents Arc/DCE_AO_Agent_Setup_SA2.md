# DCE Account Opening — Agent Setup: SA-2 Document Collection & Completeness

| Field | Value |
|---|---|
| **Agent ID** | SA-2 |
| **DAG Node** | N-1 |
| **Agent Name** | Document Collection & Completeness Agent |
| **Dify Type** | Workflow (WF) |
| **LLM Primary** | Claude Sonnet 4.6 (completeness assessment, decision making) |
| **LLM Secondary** | Claude Haiku 4.5 (rejection reasoning, chase composition) |
| **Total Skills** | 8 |
| **SLA Window** | 24 hours (STANDARD) · 8 hours (URGENT) |
| **Max Retries** | 3 (internal to N-1 — no DAG back-edge) |
| **HITL Required** | Conditional (missing docs after 2 collection attempts → RM Branch Manager) |
| **Trigger** | Orchestrator invocation after N-0 NODE_COMPLETED event |
| **Upstream** | N-0 (SA-1 Intake & Triage) |
| **Downstream** | N-2 (SA-4 KYC/CDD Assessment) |

---

## 1. Agent Purpose

SA-2 is the **document intelligence gateway** for every account opening case. It receives pre-staged documents and classification data from SA-1, generates the applicable document checklist from KB-2, runs OCR on all submitted documents, assesses completeness against mandatory and optional requirements, validates document expiry and issuing authority, and makes the routing decision: proceed to KYC (N-2), retry with RM chase, escalate to Branch Manager, or terminate. SA-2 produces a structured `N1Output` that gates downstream processing — no case proceeds to KYC without mandatory document completeness confirmed.

SA-2 retries are **internal** to N-1 — the Orchestrator never routes back to N-0. Each retry increments the attempt counter, re-processes only newly submitted documents, and escalates the notification chain (RM → RM + Manager → Branch Manager).

---

## 2. Dify Workflow Canvas — Node Map

```
[START: Orchestrator Invocation]
  │
  │  Input: {case_state_block, case_id, account_type, jurisdiction,
  │          submitted_documents[], retry_count, prior_failure_reasons[]}
  │
  ▼
[CODE: Context Injector]                                   ← Node 1
  │  • Reads dce_ao_case_state for current case context
  │  • Reads dce_ao_classification_result for account_type, client_entity_type, products
  │  • Reads dce_ao_document_staged for pre-staged documents
  │  • Builds AO Case State Block + Completion Registry
  │  • On retry: injects prior failure context + corrective instructions
  │  Output: {context_block, case_state, retry_context, is_retry, sla_critical}
  │
  ▼
[IF/ELSE: First Attempt or Retry?]                         ← Node 2
  │
  ├─ FIRST (attempt_number = 1):
  │   │
  │   ▼
  │ [KNOWLEDGE RETRIEVAL: KB-2 Checklist Rules]            ← Node 3a (SKL-01)
  │   │  Query: "Document checklist requirements for {account_type}
  │   │          account opening in {jurisdiction} jurisdiction
  │   │          for products: {products_requested}"
  │   │  KB: KB-2 (Document Checklist Rules)
  │   │  Max Chunks: 8 | Relevance Filter: > 0.75
  │   │  Output: {kb_chunks_checklist}
  │   │
  │   ▼
  │ [HTTP: MCP get_document_checklist]                     ← Node 3b (SKL-01 cont.)
  │   │  Endpoint: POST /api/v1/documents/checklist
  │   │  Payload: {account_type, jurisdiction, products_requested,
  │   │            entity_type, kb_chunks}
  │   │  Response: {mandatory_docs[], optional_docs[], checklist_version,
  │   │             regulatory_basis}
  │   │  DB Write: INSERT into dce_ao_document_checklist
  │   │            INSERT into dce_ao_document_checklist_item (1 row per doc type)
  │   │
  │   ▼
  │ (continue to Node 4)
  │
  └─ RETRY (attempt_number > 1):
       │  Reuse existing checklist from dce_ao_document_checklist
       │  Read only NEW documents from dce_ao_document_staged
       │  (where submitted_at > last attempt timestamp)
       │
       ▼
     (continue to Node 4)
  │
  ▼
[HTTP: MCP extract_document_metadata — Loop per Document]  ← Node 4 (SKL-02)
  │  Endpoint: POST /api/v1/documents/{doc_id}/ocr
  │  Payload: {doc_id, storage_url, expected_doc_type}
  │  Response (per doc): {doc_id, extracted_text, detected_doc_type,
  │                       issuing_authority, issue_date, expiry_date,
  │                       signatory_names, confidence_score}
  │  On retry: Process ONLY new documents — skip already-accepted docs
  │  DB Write: INSERT into dce_ao_document_ocr_result (1 row per document)
  │  Gate: confidence < 0.80 → set flagged_for_review = TRUE
  │
  ▼
[CONCURRENT EXECUTION — Node 5 and Node 6 run in parallel]
  │
  ├─ [LLM: Completeness Assessor — Claude Sonnet]         ← Node 5 (SKL-03)
  │   │  System Prompt: SA-2 Role Scope Template
  │   │  User Context: checklist + submitted_documents_metadata + KB-2 chunks
  │   │  Task: Match OCR results to checklist items; identify
  │   │         missing mandatory, missing optional, rejected docs
  │   │  Output: {completeness_flag, mandatory_docs_complete,
  │   │           optional_docs_complete, coverage_pct,
  │   │           missing_mandatory[], missing_optional[]}
  │   │  DB Write: INSERT into dce_ao_completeness_assessment
  │   │            UPDATE dce_ao_document_checklist_item (match_status, matched_doc_id)
  │   │
  │   ▼
  │ [KNOWLEDGE RETRIEVAL: KB-3 + KB-12 GTA Reference]     ← Node 5b (SKL-03 enrichment)
  │   │  Query: "GTA version and schedule requirements for {products} in {jurisdiction}"
  │   │  KB: KB-3 (GTA Reference), KB-12 (GTA & Schedule Reference)
  │   │  Task: Validate GTA version, check schedule coverage,
  │   │         identify missing addenda
  │   │  DB Write: INSERT into dce_ao_gta_validation
  │   │
  │
  └─ [HTTP + CODE: Document Validity Checker]              ← Node 6 (SKL-04)
       │  Endpoint: POST /api/v1/documents/{doc_id}/validate
       │  Per document: check expiry date, issuing authority,
       │                document age limits (e.g., utility bills < 90 days)
       │  Output (per doc): {validity_status: VALID | EXPIRED |
       │                     NEAR_EXPIRY | UNACCEPTABLE_SOURCE,
       │                     days_to_expiry, validity_notes}
       │  Gate: Date parsing failure → flag for human review
  │
  ▼
[LLM: Rejection Reasoner — Claude Haiku]                   ← Node 7 (SKL-05)
  │  Only fires for docs where: decision = REJECTED or REQUIRES_RESUBMISSION
  │  Input: {doc_id, doc_type, rejection_cause, regulatory_requirement}
  │  Output: {rejection_reason_text, resubmission_instructions,
  │           regulatory_reference}
  │  DB Write: INSERT into dce_ao_document_review (1 row per document)
  │
  ▼
[HTTP: MCP flag_document_for_review]                       ← Node 8 (SKL-06)
  │  Endpoint: POST /api/v1/documents/{doc_id}/flag
  │  Payload: {doc_id, decision, rejection_reason_code, rejection_reason_text}
  │  Response: {doc_id, flagged_at, flag_status}
  │  DB Write: UPDATE dce_ao_document_review (flagged_at, flag_status)
  │
  ▼
[CODE: Output Validator — N1Output Pydantic]               ← Node 9
  │  Validates merged completeness + validity + review output against N1Output schema
  │  On failure: retry instruction block → loop back to Node 5
  │  Output: {validation_status, validated_output}
  │
  ▼
[IF/ELSE: Validation Pass?]                                ← Node 10
  │
  ├─ YES: Proceed to Decision
  │   │
  │   ▼
  │ [LLM + IF/ELSE: Decision Maker — Claude Sonnet]       ← Node 11 (SKL-08)
  │   │  Input: {completeness_flag, mandatory_docs_complete,
  │   │          optional_docs_complete, retry_count,
  │   │          sla_pct_consumed, failure_history}
  │   │  Decision logic:
  │   │    • Complete (all mandatory) → next_node = "N-2"
  │   │    • Incomplete + retry < 3    → next_node = "HITL_RM" (retry)
  │   │    • Incomplete + retry = 2    → next_node = "ESCALATE_BRANCH_MANAGER"
  │   │    • Incomplete + retry ≥ 3    → next_node = "DEAD"
  │   │  Constraint: Must NEVER return N-0 or any completed node
  │   │  DB Write: UPDATE dce_ao_completeness_assessment (next_node, decision_reasoning)
  │   │
  │   ▼
  │ [IF/ELSE: Retry Required?]                             ← Node 12
  │   │
  │   ├─ YES (next_node = "HITL_RM" or "ESCALATE_BRANCH_MANAGER"):
  │   │   │
  │   │   ▼
  │   │ [LLM: RM Chase Composer — Claude Haiku]            ← Node 13 (SKL-07)
  │   │   │  Input: {case_id, rm_name, client_name, missing_mandatory[],
  │   │   │          rejected_docs[], sla_remaining_hours, retry_count}
  │   │   │  Output: {chase_message_text, recipients}
  │   │   │  Note: retry_count = 2 → chase includes RM Branch Manager
  │   │   │
  │   │   ▼
  │   │ [HTTP: MCP send_notification]                      ← Node 14 (SKL-07 cont.)
  │   │   │  Endpoint: POST /api/v1/notifications/send
  │   │   │  Recipients: RM (always) + RM Manager (retry 2+) + Branch Mgr (retry 2 ceiling)
  │   │   │  DB Write: INSERT into dce_ao_notification_log
  │   │   │            UPDATE dce_ao_completeness_assessment (chase_sent_at, rm_chase_message)
  │   │   │
  │   │   ▼
  │   │ (continue to Checkpoint)
  │   │
  │   └─ NO (next_node = "N-2" or "DEAD"):
  │       │
  │       ▼
  │     (continue to Checkpoint)
  │
  │   ▼
  │ [CODE: Merge Agent Output + Tool Results]              ← Node 15
  │   │  Combines checklist, OCR, completeness, validity, reviews,
  │   │  GTA validation, chase message into complete N1Output JSON
  │   │
  │   ▼
  │ [CODE: Checkpoint Writer]                              ← Node 16 (MANDATORY)
  │   │  INSERT into dce_ao_node_checkpoint (N-1, status)
  │   │  UPDATE dce_ao_case_state SET current_node=next_node,
  │   │         completed_nodes = completed_nodes + '["N-1"]'
  │   │  INSERT into dce_ao_event_log (DOC_ASSESSED / NODE_COMPLETED / NODE_FAILED)
  │   │
  │   ▼
  │ [END: Return N1Output JSON]                            ← Node 17
  │
  └─ NO (Validation Failed):
       │
       ▼
     [IF/ELSE: Pydantic Retry Available? (attempt < 3)]    ← Node 18
       │
       ├─ YES: [CODE: Inject Pydantic correction instruction]
       │        [LOOP BACK → Node 5 with correction template]
       │
       └─ NO:  [CODE: Write FAILED checkpoint]
               [END: Return {next_node: "ESCALATE_BRANCH_MANAGER"}]
```

---

## 3. Node Significance Table

| # | Node | Dify Type | Skill | Significance | Failure Impact |
|---|---|---|---|---|---|
| 1 | Context Injector | Code Node | — | Builds AO Case State Block from MariaDB. On retry, injects prior failure context with corrective instructions (e.g., "focus on newly submitted docs, skip already-accepted"). | Case cannot proceed without context — abort |
| 2 | Attempt Router | IF/ELSE | — | Routes to checklist generation (first attempt) or checklist reuse (retry). Prevents redundant KB queries on retries. | Wrong path → unnecessary KB calls or missing checklist |
| 3a | KB-2 Retrieval | Knowledge Retrieval | SKL-01 | Loads document checklist rules for this account type + jurisdiction + products. **Core knowledge dependency** — without this, SA-2 cannot determine what documents are required. | KB failure → use last-known cached checklist + alert KB admin |
| 3b | Checklist Generator | HTTP Request | SKL-01 | Creates the checklist header and line items. **Foundational** — every downstream skill depends on the checklist to evaluate documents against. | Failure → hard block (no checklist = no assessment possible) |
| 4 | OCR & Metadata Extractor | HTTP Request (loop) | SKL-02 | **Critical data extraction.** Runs OCR on each document to extract text, doc type, dates, signatories. On retry, processes only new documents. | OCR service down → retry 3x → flag all docs for human review |
| 5 | Completeness Assessor | LLM (Sonnet) | SKL-03 | **Core cognitive task.** Matches OCR results to checklist items, determines mandatory/optional coverage. Drives the entire routing decision. | Low confidence match → default to REQUIRES_RESUBMISSION (conservative) |
| 5b | GTA Validator | Knowledge Retrieval | SKL-03 | Enriches completeness check with GTA version validation and schedule coverage using KB-3 and KB-12. | KB failure → skip GTA validation + flag for manual review |
| 6 | Validity Checker | HTTP + Code | SKL-04 | Validates document expiry, age limits, issuing authority. Runs concurrent with completeness assessment for throughput. | Date parsing failure → flag for human review |
| 7 | Rejection Reasoner | LLM (Haiku) | SKL-05 | Generates RM-actionable rejection reasons with resubmission instructions and regulatory references. Uses Haiku for speed. | LLM output missing → use template rejection reason |
| 8 | Document Flagger | HTTP Request | SKL-06 | Records per-document decisions in Document Management system. Tags rejected docs with reason codes. | API failure → buffer to local MariaDB + retry |
| 9 | Output Validator | Code Node | — | Pydantic validation of N1Output. Catches hallucinated values, invalid next_node, missing required fields. | Validation failure → retry or escalate |
| 10 | Validation Router | IF/ELSE | — | Routes to decision maker (pass) or Pydantic retry/escalation (fail). | N/A — deterministic |
| 11 | Decision Maker | LLM (Sonnet) + IF/ELSE | SKL-08 | **Final routing decision.** Weighs mandatory/optional completeness, retry history, SLA pressure. Constraint: must never return N-0 or any completed node. | Ambiguous → default to HITL_RM (conservative escalation) |
| 12 | Retry Router | IF/ELSE | — | Routes to chase composition (retry) or direct to checkpoint (complete/dead). | N/A — deterministic |
| 13 | RM Chase Composer | LLM (Haiku) | SKL-07 | Composes personalised chase notification listing missing/rejected docs with specific instructions. On retry 2 ceiling, includes Branch Manager. | Notification failure → log to failure queue + retry next check |
| 14 | Chase Sender | HTTP Request | SKL-07 | Sends chase email/notification to RM (+ escalation recipients on retry 2). | Delivery failure → retry 3x → notification failure queue |
| 15 | Output Merger | Code Node | — | Assembles the complete N1Output from all skill outputs. | N/A — deterministic merge |
| 16 | Checkpoint Writer | Code Node | — | **MANDATORY.** Persists N-1 completion/failure to MariaDB. Without this, crash recovery cannot resume and the Orchestrator cannot route to N-2. | Checkpoint failure → case stuck in N-1 forever |
| 17 | Return | End Node | — | Returns N1Output JSON to Orchestrator via Kafka. | N/A |

---

## 4. Knowledge Bases Required

| KB ID | KB Name | Used By Skill | Purpose | Query Pattern |
|---|---|---|---|---|
| **KB-2** | Document Checklist Rules | SKL-01, SKL-03 | Entity type × product × jurisdiction → required document matrix. Splits into mandatory and optional lists with regulatory references. | `"Document checklist requirements for {account_type} account opening in {jurisdiction} jurisdiction for products: {products_requested}"` |
| **KB-1** | Document Taxonomy | SKL-02, SKL-03 | All known DCE document types, identifiers, required fields, versions. Used by OCR to classify detected document types. | `"Document type classification for {detected_doc_type} with issuing authority {issuing_authority}"` |
| **KB-3** | GTA Reference | SKL-03 (GTA validation) | Current GTA version, historical versions, effective dates. Used to validate submitted GTA version is current. | `"Current GTA version for {jurisdiction} effective as of {date}"` |
| **KB-12** | GTA & Schedule Reference | SKL-03 (GTA validation) | Product/jurisdiction-specific schedule applicability and addendum requirements. | `"GTA schedule requirements for {products} in {jurisdiction} including addenda"` |
| **KB-10** | FAQ / Exception Playbook | SKL-08 (decision support) | Exception handling paths, common resolution patterns. Helps decision maker handle edge cases. | `"Exception handling for {failure_type} in document collection"` |

**KB Configuration:**

| Setting | KB-2 | KB-1 | KB-3 | KB-12 | KB-10 |
|---|---|---|---|---|---|
| Max Chunks | 8 | 5 | 3 | 3 | 3 |
| Relevance Threshold | 0.75 | 0.75 | 0.75 | 0.75 | 0.75 |
| Embedding Model | text-embedding-3-large | text-embedding-3-large | text-embedding-3-large | text-embedding-3-large | text-embedding-3-large |
| Chunk Size | 500 tokens | 500 tokens | 300 tokens | 300 tokens | 300 tokens |
| Chunk Overlap | 50 tokens | 50 tokens | 30 tokens | 30 tokens | 30 tokens |

**Total Max Chunks per N-1 invocation: 8 (as per frozen doc line 1744)**

> Note: The 8-chunk limit applies to the primary KB retrieval (KB-2). Secondary KBs (KB-1, KB-3, KB-12, KB-10) are retrieved in separate nodes with their own chunk limits. The relevance filter pipeline applies to all: embed query → vector search → top-20 candidates → cross-encoder re-ranking → threshold > 0.75 → top-N.

---

## 5. MCP Tools

| # | Tool Name | Endpoint | HTTP Method | Skill | Purpose |
|---|---|---|---|---|---|
| 1 | `get_document_checklist` | `/api/v1/documents/checklist` | POST | SKL-01 | Generate document checklist from KB-2 based on account_type + jurisdiction + products |
| 2 | `extract_document_metadata` | `/api/v1/documents/{doc_id}/ocr` | POST | SKL-02 | OCR + metadata extraction per document via Azure Document Intelligence v4 |
| 3 | `validate_document_expiry` | `/api/v1/documents/{doc_id}/validate` | POST | SKL-04 | Check document expiry dates, issuing authority, age limits |
| 4 | `flag_document_for_review` | `/api/v1/documents/{doc_id}/flag` | POST | SKL-06 | Record document decision (ACCEPTED/REJECTED/REQUIRES_RESUBMISSION) in DMS |
| 5 | `send_notification` | `/api/v1/notifications/send` | POST | SKL-07 | Send RM chase notification with missing/rejected doc list and SLA impact |

**Tool Invocation Pattern:**

| Tool | Invocation | Loop? | Retry on Failure? |
|---|---|---|---|
| `get_document_checklist` | Once per case per first attempt | No | Yes (3x, then cache fallback) |
| `extract_document_metadata` | Once per document | Yes — loop over all docs | Yes (3x per doc) |
| `validate_document_expiry` | Once per document | Yes — loop concurrent with SKL-03 | Yes (2x) |
| `flag_document_for_review` | Once per document with decision | Yes — loop over decided docs | Yes (2x, then MariaDB buffer) |
| `send_notification` | Once per retry attempt | No | Yes (3x, then failure queue) |

---

## 6. Database Tables — Read/Write Map

### Tables SA-2 Reads (from SA-1)

| Table | Operation | When | Fields Used |
|---|---|---|---|
| `dce_ao_case_state` | SELECT | Context Injector (Node 1) | case_id, case_type, jurisdiction, priority, sla_deadline, current_node, retry_counts |
| `dce_ao_classification_result` | SELECT | Context Injector (Node 1) | account_type, client_entity_type, products_requested — drives KB-2 query for checklist |
| `dce_ao_document_staged` | SELECT | Context Injector (Node 1) + SKL-02 | doc_id, filename, storage_url, mime_type — the actual documents to OCR |
| `dce_ao_rm_hierarchy` | SELECT | SKL-07 (Chase Composer) | rm_name, rm_email, rm_manager_name, rm_manager_email — chase notification routing |
| `dce_ao_node_checkpoint` | SELECT | Context Injector (on retry) | Prior attempt outputs and failure details |

### Tables SA-2 Writes (creates)

| Table | Operation | Skill | When |
|---|---|---|---|
| `dce_ao_document_checklist` | INSERT | SKL-01 | Checklist header per case per attempt (1 row) |
| `dce_ao_document_checklist_item` | INSERT (8-20 rows) | SKL-01 | One row per required document type |
| `dce_ao_document_checklist_item` | UPDATE | SKL-03 | Set match_status, matched_doc_id, match_confidence when doc matched |
| `dce_ao_document_ocr_result` | INSERT (1 per doc) | SKL-02 | OCR extraction results per document |
| `dce_ao_document_review` | INSERT (1 per doc) | SKL-03 to SKL-06 | Per-document decision with rejection details |
| `dce_ao_completeness_assessment` | INSERT | SKL-03 | Overall completeness result per attempt |
| `dce_ao_completeness_assessment` | UPDATE | SKL-07, SKL-08 | Add chase message, next_node, decision reasoning |
| `dce_ao_gta_validation` | INSERT | SKL-03 | GTA version and schedule validation per attempt |

### Tables SA-2 Writes (shared with SA-1)

| Table | Operation | Skill | When |
|---|---|---|---|
| `dce_ao_case_state` | UPDATE | Checkpoint Writer | current_node, completed_nodes, retry_counts |
| `dce_ao_node_checkpoint` | INSERT | Checkpoint Writer | N-1 checkpoint with N1Output as output_json |
| `dce_ao_event_log` | INSERT (2-4 rows) | Throughout | DOC_ASSESSED, DOC_CHASE_SENT, NODE_COMPLETED / NODE_FAILED |
| `dce_ao_notification_log` | INSERT (1-3 rows) | SKL-07 | RM chase notifications (email, toast, Kafka) |
| `dce_ao_document_staged` | INSERT | N/A (RM resubmission) | New document rows when RM resubmits during retry |

---

## 7. Input Format

### Trigger: Orchestrator Invocation (First Attempt)

```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-000101",
  "account_type": "INSTITUTIONAL_FUTURES",
  "jurisdiction": "SGP",
  "submitted_documents": [
    {
      "doc_id": "DOC-000001",
      "filename": "AO_Form_Signed.pdf",
      "storage_url": "mongodb://docstore/dce/DOC-000001",
      "mime_type": "application/pdf",
      "submitted_at": "2026-03-02T09:30:00+08:00",
      "source": "EMAIL_ATTACHMENT"
    },
    {
      "doc_id": "DOC-000002",
      "filename": "Corporate_Profile.pdf",
      "storage_url": "mongodb://docstore/dce/DOC-000002",
      "mime_type": "application/pdf",
      "submitted_at": "2026-03-02T09:30:00+08:00",
      "source": "EMAIL_ATTACHMENT"
    }
  ],
  "retry_count": 0,
  "prior_failure_reasons": []
}
```

### Trigger: Orchestrator Invocation (Retry — Attempt 2)

```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-000101",
  "account_type": "INSTITUTIONAL_FUTURES",
  "jurisdiction": "SGP",
  "submitted_documents": [
    {
      "doc_id": "DOC-000001",
      "filename": "AO_Form_Signed.pdf",
      "storage_url": "mongodb://docstore/dce/DOC-000001",
      "mime_type": "application/pdf",
      "submitted_at": "2026-03-02T09:30:00+08:00",
      "source": "EMAIL_ATTACHMENT"
    },
    {
      "doc_id": "DOC-000029",
      "filename": "Board_Resolution_v2.pdf",
      "storage_url": "mongodb://docstore/dce/DOC-000029",
      "mime_type": "application/pdf",
      "submitted_at": "2026-03-02T11:05:00+08:00",
      "source": "PORTAL_UPLOAD"
    }
  ],
  "retry_count": 1,
  "prior_failure_reasons": [
    {
      "attempt": 1,
      "failed_at": "2026-03-02T10:15:00+08:00",
      "failure_type": "MISSING_DOCUMENTS",
      "failure_detail": "Missing: Board Resolution (Corporate), Certificate of Incumbency",
      "resolution": "RM notified. Documents resubmitted at 2026-03-02T11:05:00"
    }
  ]
}
```

### Injected Retry Context Template (prepended to LLM calls on retry)

```
════════════════════════════════════════════════════════════════
RETRY CONTEXT — THIS IS ATTEMPT 2 OF 3 MAXIMUM
════════════════════════════════════════════════════════════════

PREVIOUS ATTEMPT FAILED:
• Node: N-1 (Document Collection)
• Attempt: 1 of 3
• Failed at: 2026-03-02T10:15:00+08:00
• Failure type: MISSING_DOCUMENTS
• Missing documents identified:
  - "Board Resolution (Corporate)" — MANDATORY for CORP entity type
  - "Certificate of Incumbency" — MANDATORY for SGP jurisdiction
• Action taken: RM notified via email at 10:20. RM confirmed docs resubmission.
• New documents submitted at: 2026-03-02T11:05:00+08:00

CORRECTIVE INSTRUCTION FOR THIS ATTEMPT:
• Focus validation on the newly submitted documents:
  - Board_Resolution_v2.pdf (submitted 11:05)
  - Corp_Incumbency_Certificate.pdf (submitted 11:05)
• Do NOT re-validate documents already accepted in Attempt 1
• The following documents were ACCEPTED in Attempt 1 (skip re-validation):
  - AO_Form_Signed.pdf ✅
  - Corporate_Profile.pdf ✅
  - MAS_Form_1A.pdf ✅
• If this attempt also fails, escalate to RM Branch Manager
  (do not attempt a 3rd time for missing mandatory docs — retry limit reached)
════════════════════════════════════════════════════════════════
```

---

## 8. Output Format — N1Output (Pydantic)

```python
class DocumentRecord(BaseModel):
    doc_id: str                     # e.g., "DOC-000001"
    doc_type: str                   # From KB-2 Document Taxonomy
    filename: str
    status: Literal["ACCEPTED", "REJECTED", "REQUIRES_RESUBMISSION"]
    rejection_reason: Optional[str]
    expiry_date: Optional[date]

class N1Output(BaseModel):
    completeness_flag: bool         # TRUE = all mandatory docs present and valid
    mandatory_docs_complete: bool
    optional_docs_complete: bool
    documents: List[DocumentRecord]
    missing_mandatory: List[str]    # ["CERT_INCORP", "BOARD_RES"]
    missing_optional: List[str]     # ["FINANCIAL_PROJ"]
    rejected_docs: List[str]        # ["DOC-000003"]
    rejection_reasons: Dict[str, str]  # {"DOC-000003": "Expired > 90 days"}
    next_node: Literal["N-2", "HITL_RM", "ESCALATE_BRANCH_MANAGER", "DEAD"]
    retry_recommended: bool
    failure_reason: Optional[str]
    rm_chase_message: Optional[str] # Populated only if retry_recommended=True
```

> **Column mapping note:** `N1Output.failure_reason` has no dedicated column in `dce_ao_completeness_assessment` (which uses `decision_reasoning` for the routing rationale). `failure_reason` is persisted in `dce_ao_node_checkpoint.output_json` as part of the full N1Output JSON, and in `dce_ao_node_checkpoint.failure_reason` for failed checkpoints. Same pattern as SA-1's `intake_notes`. Additionally, `dce_ao_case_state.case_type` stores the value from `dce_ao_classification_result.account_type` — different column names, correct mapping.

### Completion Gate Validation (Orchestrator checks before routing to N-2)

| Gate ID | Rule | Source Field |
|---|---|---|
| G-02 | `N1Output.mandatory_docs_complete = true` | `mandatory_docs_complete` |
| G-03 | `N1Output.rejected_docs` is empty | `rejected_docs` |

### Sample Output JSON — Complete (→ N-2)

```json
{
  "completeness_flag": true,
  "mandatory_docs_complete": true,
  "optional_docs_complete": false,
  "documents": [
    {
      "doc_id": "DOC-000001",
      "doc_type": "AO_FORM",
      "filename": "AO_Form_Signed.pdf",
      "status": "ACCEPTED",
      "rejection_reason": null,
      "expiry_date": null
    },
    {
      "doc_id": "DOC-000002",
      "doc_type": "CORPORATE_PROFILE",
      "filename": "Corporate_Profile.pdf",
      "status": "ACCEPTED",
      "rejection_reason": null,
      "expiry_date": "2027-03-01"
    },
    {
      "doc_id": "DOC-000003",
      "doc_type": "BOARD_RES",
      "filename": "Board_Resolution.pdf",
      "status": "ACCEPTED",
      "rejection_reason": null,
      "expiry_date": null
    }
  ],
  "missing_mandatory": [],
  "missing_optional": ["FINANCIAL_PROJ"],
  "rejected_docs": [],
  "rejection_reasons": {},
  "next_node": "N-2",
  "retry_recommended": false,
  "failure_reason": null,
  "rm_chase_message": null
}
```

### Sample Output JSON — Incomplete (→ HITL_RM retry)

```json
{
  "completeness_flag": false,
  "mandatory_docs_complete": false,
  "optional_docs_complete": false,
  "documents": [
    {
      "doc_id": "DOC-000001",
      "doc_type": "AO_FORM",
      "filename": "AO_Form_Signed.pdf",
      "status": "ACCEPTED",
      "rejection_reason": null,
      "expiry_date": null
    },
    {
      "doc_id": "DOC-000003",
      "doc_type": "UTILITY_BILL",
      "filename": "Utility_Bill_2025.pdf",
      "status": "REJECTED",
      "rejection_reason": "Document expired — utility bill is 4 months old, maximum 3 months allowed per MAS AML/CFT requirements",
      "expiry_date": "2025-11-15"
    }
  ],
  "missing_mandatory": ["BOARD_RES", "CERT_INCORP"],
  "missing_optional": ["FINANCIAL_PROJ", "TAX_CLEARANCE"],
  "rejected_docs": ["DOC-000003"],
  "rejection_reasons": {
    "DOC-000003": "Expired — utility bill dated Nov 2025 exceeds 90-day limit. Please resubmit a utility bill dated within the last 3 months."
  },
  "next_node": "HITL_RM",
  "retry_recommended": true,
  "failure_reason": "2 mandatory documents missing (Board Resolution, Certificate of Incorporation). 1 document rejected (expired utility bill).",
  "rm_chase_message": "Dear RM,\n\nCase AO-2026-000101 (ABC Trading Pte Ltd) is missing the following mandatory documents:\n\n1. Board Resolution (Corporate) — Required for CORP entity type per MAS Notice 127\n2. Certificate of Incorporation — Required for SGP jurisdiction per ACRA requirements\n\nAdditionally, the following document was rejected:\n• Utility Bill (DOC-000003) — Expired (4 months old; max 3 months)\n\nPlease resubmit by 2026-03-03T09:30:00+08:00 (SLA: 18 hours remaining).\n\nThank you."
}
```

---

## 9. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| KB-2 Retrieval (SKL-01) | KB service unavailable | Yes | 3 | Use last-known cached checklist | KB Admin team |
| Checklist Generation (SKL-01) | No matching rules in KB-2 | No | — | Flag case for manual checklist creation | DCE Operations |
| OCR Service (SKL-02) | API timeout/failure | Yes | 3 per document | Flag document for human review; proceed with remaining docs | Technology Operations |
| OCR Confidence (SKL-02) | Confidence < 0.80 | No | — | Set flagged_for_review = TRUE; do not block other documents | Human reviewer (via Workbench) |
| Completeness LLM (SKL-03) | Ambiguous doc type match | No | — | Default to REQUIRES_RESUBMISSION (conservative) | RM (via chase notification) |
| Document Validity (SKL-04) | Date parsing failure | No | — | Flag for human review | Human reviewer (via Workbench) |
| Rejection Reasoner (SKL-05) | LLM output missing | No | — | Use template rejection reason | None (auto-fallback) |
| Document Flagging (SKL-06) | DMS API failure | Yes | 2 | Write to local MariaDB buffer | Technology Operations |
| Chase Notification (SKL-07) | Email delivery failure | Yes | 3 | Log to notification failure queue | None (non-blocking, retry next check) |
| Decision Maker (SKL-08) | Ambiguous decision | No | — | Default to HITL_RM (conservative escalation) | RM Manager |
| Output Validation | Pydantic schema fail | Yes | 3 | Retry with correction instruction template | RM Branch Manager → DCE COO |
| Checkpoint Writer | MariaDB write failure | Yes | 3 | Alert Operations (case stuck) | Technology Operations (hard block) |

### Escalation Timeline (N-1 specific)

| Retry | Elapsed | Action | Notification Recipients |
|---|---|---|---|
| Attempt 1 incomplete | 0–4 hours | Chase RM | RM only |
| Attempt 2 incomplete | 4–24 hours | Chase RM + Manager | RM + RM Manager |
| Attempt 2 ceiling hit | 24+ hours | Escalate to Branch Manager (HITL mandatory) | RM + RM Manager + Branch Manager |
| Attempt 3 incomplete | 48+ hours | DEAD or ESCALATE_BRANCH_MANAGER | Full chain + DCE COO |

### Alert Types (Workbench UI)

| Alert ID | Event | Severity | Trigger Condition | Recipients | UI Treatment |
|---|---|---|---|---|---|
| ALT-DOC-GAP | DOC_GAP | WARNING | `missing_mandatory` not empty | Sales Dealer, RM | Amber badge on case; gap notice email to customer |
| ALT-DOC-REJ | DOC_REJECTED | WARNING | Any doc status = REJECTED | Sales Dealer | Amber badge with rejection reason |

### Finite State Machine Transitions

```
δ(S1, E_DOC_COMPLETE)    → S2       [all mandatory docs complete → proceed to KYC]
δ(S1, E_DOC_INCOMPLETE)  → S1       [retry, max 3 internal attempts]
δ(S1, E_ESCALATE)        → S_DEAD   [after retry ceiling]
```

---

## 10. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow |
| **Dify App Name** | `DCE-AO-SA2-Document-Collection` |
| **Primary Model** | claude-sonnet-4-6 (SKL-03 completeness, SKL-08 decision) |
| **Secondary Model** | claude-haiku-4-5 (SKL-05 rejection reasoning, SKL-07 chase composition) |
| **Temperature** | 0.1 (low — document matching must be deterministic) |
| **Max Tokens** | 4096 (larger output due to per-document records) |
| **Knowledge Bases** | KB-2 (Checklist Rules), KB-1 (Document Taxonomy), KB-3 (GTA Reference), KB-12 (GTA & Schedule Reference), KB-10 (FAQ/Exception Playbook) |
| **MCP Tools** | get_document_checklist, extract_document_metadata, validate_document_expiry, flag_document_for_review, send_notification |
| **Max Retries (Internal)** | 3 (no DAG back-edge — retries are loops within N-1) |
| **Max Retries (Pydantic)** | 3 (output validation retries per attempt) |
| **SLA Window** | 24 hours (STANDARD) · 8 hours (URGENT) |
| **Checkpoint** | Mandatory — write to dce_ao_node_checkpoint on every exit |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | DOC_ASSESSED, DOC_CHASE_SENT, NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa2_` |
| **Output Schema** | N1Output (Pydantic validated) |
| **Completion Gates** | G-02: mandatory_docs_complete = true; G-03: rejected_docs is empty |
| **KPIs** | KPI-C06: Document Resubmission Count; KPI-P03: First-pass completeness rate (target > 60%, alert < 40%); KPI-P04: Gap resolution cycle time (target < 24h, alert > 48h) |
