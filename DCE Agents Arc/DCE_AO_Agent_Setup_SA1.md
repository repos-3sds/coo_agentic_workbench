# DCE Account Opening — Agent Setup: SA-1 Intake & Triage

| Field | Value |
|---|---|
| **Agent ID** | SA-1 |
| **DAG Node** | N-0 |
| **Agent Name** | Case Intake & Triage Agent |
| **Dify Type** | Workflow (WF) |
| **LLM Primary** | Claude Sonnet 4.6 (classification) |
| **LLM Secondary** | Claude Haiku 4.5 (priority assessment) |
| **Total Skills** | 9 |
| **SLA Window** | 2 hours from submission |
| **Max Retries** | 2 |
| **HITL Required** | No |
| **Trigger** | MS Graph API email event / Portal form submission / API POST `/cases` |
| **Upstream** | None (entry point) |
| **Downstream** | N-1 (SA-2 Document Collection) |

---

## 1. Agent Purpose

SA-1 is the **entry point** for every account opening request. It receives raw submissions (email, portal, API), classifies the account type and priority, creates the case record, links the RM hierarchy, pre-stages attached documents, and notifies stakeholders. It produces a structured `N0Output` that drives the entire downstream pipeline.

---

## 2. Dify Workflow Canvas — Node Map

```
[START: Trigger Event]
  │
  │  Input: {submission_source, raw_payload, received_at, rm_employee_id}
  │
  ▼
[CODE: Context Injector]                               ← Node 1
  │  • For new cases: Initialises empty AO Case State Block
  │  • For retries: Reads existing state from dce_ao_case_state
  │  • Builds Completion Registry (empty for N-0)
  │  Output: {context_block, case_state, retry_context}
  │
  ▼
[IF/ELSE: Submission Source Router]                     ← Node 2
  │
  ├─ EMAIL ──→ [HTTP: MS Graph API — Email Retrieval]  ← Node 3a (SKL-01)
  │              │  Retrieves email body, subject, sender, attachments
  │              │  Output: {subject, body_text, sender_email, attachments[]}
  │              ▼
  │            [CODE: Email Payload Normaliser]
  │              │  Maps email data → common intake schema
  │              Output: {normalised_intake}
  │
  ├─ PORTAL ──→ [HTTP: Portal API — Form Retrieval]    ← Node 3b (SKL-08)
  │              │  Retrieves structured form JSON + uploaded doc IDs
  │              │  Output: {form_data_json, uploaded_doc_ids}
  │              ▼
  │            [CODE: Portal Payload Normaliser]
  │              │  Validates mandatory fields, maps to common schema
  │              Output: {normalised_intake}
  │
  └─ API ────→ [CODE: API Payload Normaliser]           ← Node 3c
                 │  Validates JSON payload, maps to common schema
                 Output: {normalised_intake}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-1 Document Taxonomy]           ← Node 4
  │  Query: "Account type classification rules for {products_mentioned}"
  │  KB: KB-1 (Document Taxonomy — account type definitions, product mapping)
  │  Max Chunks: 5 | Relevance Filter: > 0.75
  │  Output: {kb_chunks_classification}
  │
  ▼
[LLM: Account Type Classifier — Claude Sonnet]         ← Node 5 (SKL-02)
  │  System Prompt: SA-1 Role Scope Template
  │  User Context: normalised_intake + KB-1 chunks
  │  Task: Classify into INSTITUTIONAL_FUTURES | RETAIL_FUTURES |
  │         OTC_DERIVATIVES | COMMODITIES_PHYSICAL | MULTI_PRODUCT
  │  Output: {account_type, confidence, client_name, entity_type,
  │           jurisdiction, products_requested}
  │
  ▼
[CODE: Classification Confidence Gate]                  ← Node 6
  │  If confidence < 0.70 → Flag for RM confirmation
  │  If confidence < 0.80 → Set flagged_for_review = TRUE
  │  Output: {classification_validated, flagged_for_review}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-9 SLA Policy]                  ← Node 7
  │  Query: "SLA window for {account_type} {priority_indicators}"
  │  KB: KB-9 (SLA Policy — SLA windows per priority and account type)
  │  Max Chunks: 3 | Relevance Filter: > 0.75
  │  Output: {kb_chunks_sla}
  │
  ▼
[LLM: Priority Assessor — Claude Haiku]                ← Node 8 (SKL-03)
  │  Task: Determine URGENT | STANDARD | DEFERRED
  │  Input: {account_type, client_tier, rm_urgency_flag} + KB-9 chunks
  │  Output: {priority, priority_reason, sla_deadline}
  │
  ▼
[CODE: Output Validator — N0Output Pydantic]            ← Node 9
  │  Validates merged classification + priority output against N0Output schema
  │  On failure: retry instruction block → loop back to Node 5
  │  Output: {validation_status, validated_output}
  │
  ▼
[IF/ELSE: Validation Pass?]                             ← Node 10
  │
  ├─ YES: Proceed to Tool Execution
  │   │
  │   ▼
  │ [HTTP: MCP create_case]                             ← Node 11 (SKL-04)
  │   │  Endpoint: POST /api/v1/cases
  │   │  Payload: {account_type, priority, sla_deadline, client_name,
  │   │            rm_id, jurisdiction, products_requested}
  │   │  Response: {case_id: "AO-2026-XXXXXX", case_url, created_at}
  │   │  DB Write: INSERT into dce_ao_case_state
  │   │            INSERT into dce_ao_submission_raw
  │   │            INSERT into dce_ao_classification_result
  │   │
  │   ▼
  │ [HTTP: MCP assign_rm + get_rm_hierarchy]            ← Node 12 (SKL-05)
  │   │  Endpoint: POST /api/v1/cases/{case_id}/rm
  │   │  + GET /api/v1/hr/employees/{rm_id}/hierarchy
  │   │  Response: {rm_id, rm_name, rm_manager_id, rm_manager_name}
  │   │  DB Write: INSERT into dce_ao_rm_hierarchy
  │   │
  │   ▼
  │ [HTTP: MCP stage_documents]                         ← Node 13 (SKL-06)
  │   │  Endpoint: POST /api/v1/documents/stage
  │   │  Payload: {case_id, attachments[{filename, content_base64, mime_type}]}
  │   │  Response: {staged_documents[{doc_id, filename, storage_url}]}
  │   │  DB Write: INSERT into dce_ao_document_staged (1 row per attachment)
  │   │
  │   ▼
  │ [HTTP: MCP send_notification]                       ← Node 14 (SKL-07)
  │   │  Endpoint: POST /api/v1/notifications/send
  │   │  Recipients: RM (email + toast), RM Manager (email), Kafka event
  │   │  DB Write: INSERT into dce_ao_notification_log (3-4 rows)
  │   │
  │   ▼
  │ [CODE: Merge Agent Output + Tool Results]           ← Node 15
  │   │  Combines classification, priority, case record, RM, documents, notifications
  │   │  Output: Complete N0Output JSON
  │   │
  │   ▼
  │ [CODE: Checkpoint Writer]                           ← Node 16 (MANDATORY)
  │   │  INSERT into dce_ao_node_checkpoint (N-0, COMPLETE)
  │   │  UPDATE dce_ao_case_state SET current_node='N-1',
  │   │         completed_nodes='["N-0"]'
  │   │  INSERT into dce_ao_event_log (NODE_COMPLETED)
  │   │
  │   ▼
  │ [END: Return N0Output JSON]                         ← Node 17
  │
  └─ NO (Validation Failed):
       │
       ▼
     [IF/ELSE: Retry Available? (attempt < 2)]          ← Node 18
       │
       ├─ YES: [CODE: Increment retry in dce_ao_case_state]
       │        [LOOP BACK → Node 5 with retry instruction]
       │
       └─ NO:  [CODE: Write FAILED checkpoint]
               [END: Return {next_node: "ESCALATE_RM_MANAGER"}]
```

---

## 3. Node Significance Table

| # | Node | Dify Type | Skill | Significance | Failure Impact |
|---|---|---|---|---|---|
| 1 | Context Injector | Code Node | — | Builds AO Case State Block from MariaDB. For N-0, this is mostly initialisation. On retry, it injects prior failure context. | Case cannot proceed without context — abort |
| 2 | Submission Source Router | IF/ELSE | — | Routes to correct ingestion path. Ensures email vs portal vs API are handled by their respective parsers. | Wrong parser → malformed intake data |
| 3a | Email Retrieval | HTTP Request | SKL-01 | Fetches raw email from MS Graph API including attachments. This is the primary submission channel. | API failure → retry 3x → poll fallback every 2 min |
| 3b | Portal Form Retrieval | HTTP Request | SKL-08 | Fetches structured form data from Angular Workbench portal. Alternative entry point to email. | Invalid form → return validation errors to portal |
| 4 | KB-1 Retrieval | Knowledge Retrieval | — | Loads account type classification rules. Without this, the LLM has no reference for what constitutes each account type. | KB failure → use cached checklist + alert KB admin |
| 5 | Account Type Classifier | LLM (Sonnet) | SKL-02 | **Core cognitive task.** Classifies submission into one of 5 account types with confidence score. Drives entire downstream checklist, regulatory path, and credit model. | Low confidence → flag for RM review; wrong classification → wrong checklist at N-1 |
| 6 | Confidence Gate | Code Node | — | Hard gate: confidence < 0.70 blocks auto-proceed. Prevents low-quality classifications from polluting downstream nodes. | N/A — deterministic check |
| 7 | KB-9 Retrieval | Knowledge Retrieval | — | Loads SLA policy rules for priority determination. Maps client tier + urgency flags to SLA windows. | KB failure → default to STANDARD priority |
| 8 | Priority Assessor | LLM (Haiku) | SKL-03 | Lightweight cognitive task. Determines URGENT/STANDARD/DEFERRED and computes SLA deadline. Uses Haiku for speed. | Inconclusive → default to STANDARD |
| 9 | Output Validator | Code Node | — | Pydantic validation of N0Output. Catches hallucinated values, missing fields, invalid enums. | Validation failure → retry or escalate |
| 10 | Validation Router | IF/ELSE | — | Routes to tool execution (pass) or retry/escalation (fail). | N/A — deterministic |
| 11 | Case Record Creator | HTTP Request | SKL-04 | **Critical.** Creates the official case record with unique case_id. No downstream node can execute without a case_id. | Failure → retry 2x → alert Operations (hard block) |
| 12 | RM Linker | HTTP Request | SKL-05 | Links RM and manager to case. Enables all downstream notifications and HITL task routing. | RM not found → manual assignment task (blocks notifications) |
| 13 | Document Pre-Stager | HTTP Request | SKL-06 | Uploads attachments to document store. **Primary data handoff to SA-2** — without staged docs, SA-2 has nothing to OCR. | Storage failure → retry 3x → alert Document team |
| 14 | Intake Notifier | HTTP Request | SKL-07 | Sends case creation confirmation to RM + manager. Not blocking — case can proceed without notification. | Delivery failure → retry 3x → notification failure queue |
| 15 | Output Merger | Code Node | — | Assembles the complete N0Output from all skill outputs. | N/A — deterministic merge |
| 16 | Checkpoint Writer | Code Node | — | **MANDATORY.** Persists N-0 completion to MariaDB. Without this, crash recovery cannot resume and the Orchestrator cannot route to N-1. | Checkpoint failure → case stuck in N-0 forever |
| 17 | Return | End Node | — | Returns N0Output JSON to Orchestrator via Kafka. | N/A |

---

## 4. Knowledge Bases Required

| KB ID | KB Name | Used By Skill | Purpose | Query Pattern |
|---|---|---|---|---|
| **KB-1** | Document Taxonomy | SKL-02 | Account type definitions, product-to-account mapping rules, entity type classification criteria | "Account type classification rules for {products_mentioned} by {entity_type} in {jurisdiction}" |
| **KB-9** | SLA Policy | SKL-03 | SLA windows per priority level per account type, escalation timelines, client tier priority overrides | "SLA window for {account_type} with {client_tier} priority indicators" |

**KB Configuration:**

| Setting | KB-1 | KB-9 |
|---|---|---|
| Max Chunks | 5 | 3 |
| Relevance Threshold | 0.75 | 0.75 |
| Embedding Model | text-embedding-3-large | text-embedding-3-large |
| Chunk Size | 500 tokens | 300 tokens |
| Chunk Overlap | 50 tokens | 30 tokens |

---

## 5. MCP Tools

> **Design Note — Consolidated for 10-Iteration Cap:**
> Tools are consolidated so that SA-1 completes in ≤7 agent iterations (4 tool calls + 3 LLM reasoning turns). Original granular tools (`create_case`, `assign_rm`, `get_rm_hierarchy`) are merged into `sa1_create_case_full`. Context retrieval and checkpoint writing are promoted from CODE nodes to MCP tools.

| # | Tool Name | Covers Skills | DB Tables Written | Purpose |
|---|---|---|---|---|
| 1 | `sa1_get_intake_context` | Context Injector | READ: `dce_ao_case_state`, `dce_ao_node_checkpoint`, `dce_ao_event_log`, `dce_ao_classification_result` | For new cases: returns empty template + ENUM reference + workflow spec. For retries: returns full prior context (case state, checkpoints, events, classification) in one call. |
| 2 | `sa1_create_case_full` | SKL-01/SKL-08, SKL-04, SKL-02+SKL-03, SKL-05 | INSERT: `dce_ao_submission_raw`, `dce_ao_case_state`, `dce_ao_classification_result`, `dce_ao_rm_hierarchy`, `dce_ao_event_log` (×3) | Atomic transaction: stores raw submission + creates case + writes classification/priority + resolves RM hierarchy + logs 3 events (SUBMISSION_RECEIVED, CASE_CLASSIFIED, CASE_CREATED). |
| 3 | `sa1_stage_documents_batch` | SKL-06 | INSERT: `dce_ao_document_staged` (1-N rows) | Batch-stages all attachments in one call. Generates sequential doc_ids (DOC-XXXXXX). Returns doc_id list for SA-2 handoff. |
| 4 | `sa1_notify_stakeholders` | SKL-07 | INSERT: `dce_ao_notification_log` (3-4 rows) | Dispatches all notifications (RM email, RM Manager email, RM toast, Kafka event) in one batch transaction. |
| 5 | `sa1_complete_node` | Checkpoint Writer | INSERT: `dce_ao_node_checkpoint`; UPDATE: `dce_ao_case_state`; INSERT: `dce_ao_event_log` (NODE_COMPLETED/NODE_FAILED) | Mandatory checkpoint writer. Advances `current_node` to N-1 on success, records failure context on failure. Atomic transaction. |

**Agent Iteration Flow (7 turns total):**

| Turn | Type | Tool / Action |
|---|---|---|
| 1 | Tool | `sa1_get_intake_context` — fetch context + ENUM reference |
| 2 | LLM (Sonnet) | Account Type Classification using KB-1 chunks |
| 3 | LLM (Haiku) | Priority Assessment using KB-9 chunks |
| 4 | Tool | `sa1_create_case_full` — atomic case creation pipeline |
| 5 | Tool | `sa1_stage_documents_batch` — stage all attachments |
| 6 | Tool | `sa1_notify_stakeholders` — dispatch all notifications |
| 7 | Tool | `sa1_complete_node` — write checkpoint + advance to N-1 |

---

## 6. Database Tables — Read/Write Map

> **Column Mapping Notes:**
> - `dce_ao_case_state.case_type` stores the classified `account_type` value (e.g. `INSTITUTIONAL_FUTURES`). Different column name, same value.
> - `N0Output.intake_notes` has no dedicated DB column — it is persisted inside `dce_ao_node_checkpoint.output_json` as part of the full N0Output JSON.
> - `N0Output.confidence` maps to `dce_ao_classification_result.account_type_confidence`.

### Tables SA-1 Writes (creates)

| Table | Operation | Skill | When |
|---|---|---|---|
| `dce_ao_case_state` | INSERT | SKL-04 | Case record creation |
| `dce_ao_submission_raw` | INSERT | SKL-01/SKL-08 | Raw submission stored before processing |
| `dce_ao_classification_result` | INSERT | SKL-02 + SKL-03 | After classification and priority assessment |
| `dce_ao_rm_hierarchy` | INSERT | SKL-05 | After RM resolution from HR system |
| `dce_ao_document_staged` | INSERT (1-N rows) | SKL-06 | One row per attachment uploaded |
| `dce_ao_notification_log` | INSERT (3-4 rows) | SKL-07 | One row per notification channel |
| `dce_ao_node_checkpoint` | INSERT | Checkpoint Writer | N-0 checkpoint on completion/failure |
| `dce_ao_event_log` | INSERT (3-4 rows) | Throughout | SUBMISSION_RECEIVED, CASE_CLASSIFIED, CASE_CREATED, NODE_COMPLETED |

### Tables SA-1 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context Injector (on retry only — fresh case has no prior state) |
| `dce_ao_node_checkpoint` | SELECT | Context Injector (on retry — reads prior attempt failures) |

---

## 7. Input Format

### Trigger: Email Submission
```json
{
  "submission_source": "EMAIL",
  "raw_payload": {
    "email_message_id": "AAMkAGE2NDYXMS00ZTK3...",
    "sender_email": "rm.john@abs.com",
    "subject": "New DCE Account Opening - ABC Trading Pte Ltd",
    "body_text": "Dear DCE Team, Please initiate AO for ABC Trading...",
    "attachments": [
      {
        "filename": "AO_Form_Signed.pdf",
        "content_base64": "JVBERi0xLjQK...",
        "mime_type": "application/pdf"
      }
    ]
  },
  "received_at": "2026-03-02T09:30:00+08:00",
  "rm_employee_id": "RM-0042"
}
```

### Trigger: Portal Submission
```json
{
  "submission_source": "PORTAL",
  "raw_payload": {
    "portal_form_id": "PF-20260302-007",
    "form_data_json": {
      "client_name": "Global Commodities HK Ltd",
      "entity_type": "CORP",
      "jurisdiction": "HKG",
      "products": ["OTC_DERIVATIVES", "COMMODITIES_PHYSICAL"],
      "contact_person": "David Wong",
      "contact_email": "david.wong@globalcommodities.hk"
    },
    "uploaded_doc_ids": ["DOC-000003", "DOC-000004", "DOC-000005"]
  },
  "received_at": "2026-03-02T14:00:00+08:00",
  "rm_employee_id": "RM-0118"
}
```

### Trigger: API Submission
```json
{
  "submission_source": "API",
  "raw_payload": {
    "client_name": "HSBC Securities Services (Asia) Ltd",
    "entity_type": "FI",
    "jurisdiction": "HKG",
    "products": ["FUTURES", "OPTIONS"],
    "lei": "5493006W5RWQLKGH1T16",
    "fi_type": "BANK_SUBSIDIARY",
    "sfc_license_number": "AHI396"
  },
  "received_at": "2026-03-02T15:00:00+08:00",
  "rm_employee_id": "RM-0155"
}
```

---

## 8. Output Format — N0Output (Pydantic)

```python
class N0Output(BaseModel):
    case_id: str                            # Generated: AO-2026-XXXXXX
    account_type: Literal[
        "INSTITUTIONAL_FUTURES",
        "RETAIL_FUTURES",
        "OTC_DERIVATIVES",
        "COMMODITIES_PHYSICAL",
        "MULTI_PRODUCT"
    ]
    priority: Literal["URGENT", "STANDARD", "DEFERRED"]
    priority_reason: Optional[str]
    client_name: str
    client_entity_type: Literal["CORP", "FUND", "FI", "SPV", "INDIVIDUAL"]
    jurisdiction: Literal["SGP", "HKG", "CHN", "OTHER"]
    rm_id: str
    rm_manager_id: str
    products_requested: List[str]
    next_node: Literal["N-1"]               # Always N-1 from N-0
    confidence: float = Field(ge=0.7, le=1.0)
    intake_notes: Optional[str]
```

### Sample Output JSON
```json
{
  "case_id": "AO-2026-000101",
  "account_type": "INSTITUTIONAL_FUTURES",
  "priority": "URGENT",
  "priority_reason": "Client tier: Platinum; RM flagged urgency; regulatory deadline approaching",
  "client_name": "ABC Trading Pte Ltd",
  "client_entity_type": "CORP",
  "jurisdiction": "SGP",
  "rm_id": "RM-0042",
  "rm_manager_id": "MGR-0012",
  "products_requested": ["FUTURES", "OPTIONS"],
  "next_node": "N-1",
  "confidence": 0.94,
  "intake_notes": "Platinum client with existing ABS relationship. 2 documents pre-staged."
}
```

---

## 9. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| MS Graph API (SKL-01) | API timeout/failure | Yes | 3 | Poll every 2 min | Technology Operations |
| Portal API (SKL-08) | Invalid form data | No | — | Return validation errors to portal | RM (portal UI) |
| Classification (SKL-02) | Confidence < 0.70 | No | — | Flag for RM confirmation | RM via Workbench |
| Classification (SKL-02) | LLM output malformed | Yes | 2 | Pydantic retry injection | RM Manager → DCE COO |
| Case Creation (SKL-04) | API failure | Yes | 2 | Alert Operations | Operations team (hard block) |
| RM Resolution (SKL-05) | RM not in HR system | No | — | Create manual assignment task | Operations team |
| Document Staging (SKL-06) | Storage failure | Yes | 3 | Alert Document Management team | Document Management |
| Notification (SKL-07) | Email delivery failure | Yes | 3 | Log to notification failure queue | None (non-blocking) |
| Output Validation | Pydantic schema fail | Yes | 2 | Retry with correction instruction | RM Manager → DCE COO |

---

## 10. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow |
| **Dify App Name** | `DCE-AO-SA1-Intake-Triage` |
| **Primary Model** | claude-sonnet-4-6 (SKL-02 classification) |
| **Secondary Model** | claude-haiku-4-5 (SKL-03 priority) |
| **Temperature** | 0.1 (low — classification must be deterministic) |
| **Max Tokens** | 2048 |
| **Knowledge Bases** | KB-1 (Document Taxonomy), KB-9 (SLA Policy) |
| **MCP Tools** | sa1_get_intake_context, sa1_create_case_full, sa1_stage_documents_batch, sa1_notify_stakeholders, sa1_complete_node |
| **Max Agent Iterations** | 7 (4 tool calls + 3 LLM turns) — within 10-iteration cap |
| **Max Retries (Node)** | 2 |
| **SLA Window** | 2 hours |
| **Checkpoint** | Mandatory — write to dce_ao_node_checkpoint on every exit |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | SUBMISSION_RECEIVED, CASE_CLASSIFIED, CASE_CREATED, NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa1_` |
| **Output Schema** | N0Output (Pydantic validated) |
