# DCE Account Opening — Agent Setup: SA-3 Signature Verification

| Field | Value |
|---|---|
| **Agent ID** | SA-3 |
| **DAG Node** | N-2 |
| **Agent Name** | Signature Verification Agent |
| **Dify Type** | Workflow (WF) — Two-Phase Execution with HITL Pause |
| **LLM Primary** | Claude Sonnet 4.6 (verification summary synthesis) |
| **LLM Secondary** | None — confidence thresholds applied deterministically by Code nodes |
| **Total Skills** | 9 |
| **SLA Window** | 4 hours (URGENT) / 24 hours (STANDARD) / 48 hours (DEFERRED) — for COO Desk Support review |
| **Max Retries** | 1 (post-HITL re-verification on LOW confidence resubmission) |
| **HITL Required** | **YES** — COO Desk Support must APPROVE / REJECT / CLARIFY each signatory |
| **Trigger** | HTTP Request from DCE Orchestrator on `CHECKLIST_COMPLETE` event |
| **Upstream** | N-1 (SA-2 Document Collection) |
| **Downstream** | N-3 (SA-4 KYC/CDD Preparation) — triggered on `SIGNATURE_APPROVED` |
| **HITL Actor** | COO Desk Support (Agentic Workbench — Desk Support View) |

---

## 1. Agent Purpose

SA-3 is the **signature validation gate** that ensures all execution documents are correctly signed by individuals with proper corporate authority before the case advances to KYC/CDD. It operates in two distinct phases separated by a mandatory human-in-the-loop pause.

**Phase 1 — Pre-HITL (Automated):** Retrieves all execution-required documents and the company mandate. Extracts all signature regions using a trained vision model. Verifies each signatory's authority against the authorised signatory list in the mandate. Runs signature comparison against the corresponding ID document specimen, producing a confidence score (0–100). All results are synthesised into a structured workbench review report and posted to the COO Desk Support queue. The workflow then parks.

**Phase 2 — Post-HITL (Human-Resumed):** Upon Desk Support submission of decisions (APPROVE / REJECT / CLARIFY per signatory), the workflow resumes via Spring Boot's Dify resume endpoint. Approved signatures are stored as verified specimens in MongoDB — serving as the permanent regulatory evidence chain. Rejections route the case to `SIGNATURE_REJECTED`. CLARIFY decisions trigger SA-7 customer communication and park the workflow again pending resubmission.

Signature specimens stored by SA-3 are required audit evidence under MAS Notice SFA 02-N13, HKMA's AML/CFT guidelines, and DBS's internal signature verification policy.

---

## 2. Dify Workflow Canvas — Node Map

```
══════════════════ PHASE 1 — PRE-HITL (AUTOMATED) ══════════════════

[START: Trigger from DCE Orchestrator]
  │  Input: {case_id, document_ids[], company_mandate_id}
  │
  ▼
[CODE: Context Injector]                                          ← Node 1
  │  • Reads N-1 N1Output from dce_ao_node_checkpoint
  │  • Initialises AO Case State Block for N-2
  │  • For retries: injects prior N-2 attempt context (analysis results if Phase 1 ran)
  │  Output: {context_block, n1_output, case_state, retry_context}
  │
  ▼
[HTTP: Fetch Execution Documents + Company Mandate]               ← Node 2 (SKL-01)
  │  • GET /api/documents?case_id={case_id}&type=execution_required
  │  • GET /api/documents/{company_mandate_id}
  │  Output: {execution_docs[], mandate_doc, authorised_signatories[]}
  │
  ▼
[KNOWLEDGE RETRIEVAL: KB-5 Signature Verification Guidelines]     ← Node 3
  │  Query: "Confidence thresholds and evidence packaging for signature verification
  │           in {jurisdiction} with {entity_type}"
  │  KB: KB-5 (Signature Verification Guidelines)
  │  Max Chunks: 3 | Relevance Filter: > 0.75
  │  Output: {kb_chunks_sig_verification, thresholds, evidence_requirements}
  │
  ▼
[CODE: Execution Doc Filter + Signatory Map Builder]              ← Node 4
  │  • Filter documents requiring execution from full document_ids[]
  │  • Build signatory map: signatory_name → [all docs they must sign]
  │  • Cross-reference against mandate authorised_signatories[]
  │  Output: {execution_docs_filtered[], signatory_map{}, mandate_signatories[]}
  │
  ▼
[CODE: Signature Analysis Batch Caller]                           ← Node 5 (SKL-02, SKL-03, SKL-04)
  │  MCP Tool: sa3_run_signature_analysis_batch
  │  For each signatory in signatory_map:
  │    Step 1 — signature_extractor (API-7):
  │             Extract all signature regions as image crops from their documents
  │             Returns: signature_crops[], page_refs[], field_labels[]
  │    Step 2 — signatory_authority_checker (MCP T-10):
  │             Cross-reference signatory name against mandate authorised list
  │             Returns: authority_status, role_in_mandate, discrepancies[]
  │    Step 3 — signature_comparator (API-7):
  │             Compare extracted signature against ID document specimen
  │             Returns: confidence_score (0–100), comparison_overlay_ref
  │  Output: {analysis_results[{signatory_name, authority_status, confidence_score,
  │                              comparison_overlay_ref, signature_crop_refs[]}]}
  │
  ▼
[CODE: Confidence Tier Classifier]                                ← Node 6
  │  Apply KB-5 thresholds per signatory:
  │    HIGH   (≥ 85%): auto_pass = true
  │    MEDIUM (60–84%): flag_for_review = true
  │    LOW    (< 60%): escalate_immediate = true
  │  Compute: overall_status (ALL_HIGH / MIXED_FLAGS / HAS_ESCALATIONS)
  │  Output: {classified_results[], has_low_confidence, overall_status}
  │
  ▼
[IF/ELSE: Has Immediate LOW Confidence Escalations?]              ← Node 7
  │
  ├─ YES (any signatory confidence < 60%)
  │     [CODE: Write ESCALATE checkpoint to dce_ao_node_checkpoint (ESCALATED)]
  │     [HTTP: Notify COO Desk Support + Compliance via SA-7]
  │     [END: Return {next_node: "ESCALATE_COMPLIANCE",
  │                   reason: "Signature confidence below 60% threshold",
  │                   escalated_signatories[]}]
  │
  └─ NO (all signatories ≥ 60%) — Continue
  │
  ▼
[LLM: Verification Summary — Claude Sonnet 4.6]                   ← Node 8 (SKL-05)
  │  System Prompt: SA-3 Role Scope Template
  │  Context: classified_results[] + KB-5 chunks + mandate_signatories + case_state
  │  Task: Build structured verification summary report for Desk Support workbench:
  │    • Overall status: ALL_HIGH / MIXED_FLAGS / HAS_ESCALATIONS
  │    • Per-signatory card: name, role in mandate, confidence score, tier, flag reason
  │    • Side-by-side comparison image reference (submitted vs ID specimen)
  │    • Reviewer guidance: what to check for MEDIUM confidence cases
  │    • Priority and HITL deadline
  │  Output: {verification_report, overall_status, reviewer_guidance}
  │
  ▼
[CODE: Output Assembler]                                          ← Node 9
  │  Package workbench payload:
  │    { case_id, verification_report, overall_status, flag_count,
  │      signatory_count, doc_refs[], hitl_deadline, priority }
  │  Output: {workbench_payload}
  │
  ▼
[HTTP: Post to COO Desk Support Workbench Queue]                  ← Node 10 (SKL-06)
  │  POST /api/workbench/signature-queue
  │  Payload: workbench_payload
  │  Output: {task_id, queue_position, workbench_url}
  │
  ▼
[CODE: Notify Desk Support + Park for HITL]                       ← Node 11 (SKL-07)
  │  MCP Tool: sa3_park_for_hitl
  │  • POST /api/notifications/inapp
  │      {persona: DESK_SUPPORT, case_id, action: SIGNATURE_REVIEW, deadline, priority}
  │  • INSERT dce_ao_hitl_review_task (HITL-XXXXXX, N-2, DESK_SUPPORT, PENDING)
  │  • INSERT dce_ao_node_checkpoint (N-2, HITL_PENDING)
  │  • UPDATE dce_ao_case_state SET status=HITL_PENDING
  │  • INSERT dce_ao_event_log (SIGNATURE_ANALYSED)
  │  Output: {hitl_task_id, checkpoint_written, notification_sent}
  │
  ▼
[END: HITL_PENDING]                                               ← Node 12
  Return: {status: "HITL_PENDING", hitl_task_id, workbench_url,
           next_action: "DESK_SUPPORT_REVIEW", sla_deadline}

══════════════════════════════════════════════════════════════════════
  ──  EXECUTION PARKS HERE                                           ──
  ──  Spring Boot holds workflow state in dce_ao_node_checkpoint     ──
  ──  COO Desk Support reviews signature comparison report in        ──
  ──  Agentic Workbench (Desk Support View)                          ──
  ──  Desk Support submits per-signatory decisions:                  ──
  ──    APPROVED | REJECTED | CLARIFY                                ──
  ──  Spring Boot calls Dify Workflow resume endpoint with           ──
  ──  decision payload                                               ──
══════════════════════════════════════════════════════════════════════

═══════════════════ PHASE 2 — POST-HITL (RESUMED) ═══════════════════

[START: Resume Node — Human Decision Received]                    ← Node 13
  │  Input: {case_id, mode: "RESUME", hitl_task_id,
  │          decisions[{signatory_id, outcome, notes, approving_officer_id, decided_at}]}
  │
  ▼
[CODE: Decision Validator + Batch Processor]                      ← Node 14 (SKL-08)
  │  • Validate every signatory from Phase 1 has a decision (completeness check)
  │  • Segregate: approved[], rejected[], clarify[]
  │  • If incomplete: return to workbench with missing signatories highlighted
  │  Output: {approved[], rejected[], clarify[], all_decided, missing_signatories[]}
  │
  ▼
[IF/ELSE: Any Rejections?]                                        ← Node 15
  │
  ├─ YES (any signatory REJECTED)
  │     [HTTP: PATCH /api/cases/{case_id} {status: SIGNATURE_REJECTED}]
  │     [HTTP: Notify DCE Orchestrator (SIGNATURE_REJECTED)]
  │     [CODE: Write N-2 FAILED checkpoint to dce_ao_node_checkpoint]
  │     [INSERT dce_ao_event_log (SIGNATURE_REJECTED)]
  │     [END: Return {next_node: "SIGNATURE_REJECTED",
  │                   rejected_signatories[], rejection_reasons[]}]
  │
  └─ NO — Continue
  │
  ▼
[IF/ELSE: Any CLARIFY Requests?]                                  ← Node 16
  │
  ├─ YES (any signatory CLARIFY)
  │     [HTTP: Trigger SA-7 (SIGNATURE_CLARIFICATION, customer email with specific signatory details)]
  │     [CODE: Write N-2 HITL_PENDING checkpoint (awaiting clarification resubmission)]
  │     [UPDATE dce_ao_hitl_review_task SET status=PENDING]
  │     [END: Return {next_node: "HITL_PENDING",
  │                   pending_clarifications[], clarification_sent: true}]
  │
  └─ NO (all approved) — Continue
  │
  ▼
[CODE: Store Approved Signature Specimens]                        ← Node 17 (SKL-09)
  │  MCP Tool: sa3_store_approved_specimens
  │  For each approved signatory:
  │    • POST /api/signatures (Signature Repository API)
  │        {signatory_id, entity_id, source_doc_id, confidence_score,
  │         approving_officer_id, comparison_overlay_ref, timestamp}
  │    • INSERT dce_ao_signature_specimen (SPEC-XXXXXX)
  │  Returns: {specimen_ids[], specimens_stored_count}
  │  DB Write: INSERT into dce_ao_signature_specimen (1 row per approved signatory)
  │
  ▼
[CODE: Checkpoint Writer + Orchestrator Notification]             ← Node 18 (MANDATORY)
  │  MCP Tool: sa3_complete_node
  │  • INSERT dce_ao_node_checkpoint (N-2, COMPLETE, output_json = N2Output)
  │  • UPDATE dce_ao_case_state SET current_node='N-3',
  │           completed_nodes=['N-0','N-1','N-2'],
  │           status='ACTIVE'
  │  • INSERT dce_ao_event_log (HITL_DECISION_RECEIVED, NODE_COMPLETED)
  │  • HTTP: Notify DCE Orchestrator (SIGNATURE_APPROVED)
  │  • TOOL: kafka_publish (dce.signature.approved)
  │
  ▼
[END: Return N2Output JSON]                                       ← Node 19
```

---

## 3. Node Significance Table

| # | Node | Dify Type | Skill | Significance | Failure Impact |
|---|---|---|---|---|---|
| 1 | Context Injector | Code Node | — | Reads N-1 output from checkpoint. On retry: injects prior Phase 1 analysis to avoid re-running signature extraction. | Abort — cannot proceed without upstream N-1 context |
| 2 | Fetch Documents + Mandate | HTTP Request | SKL-01 | Retrieves execution documents AND the mandate. Mandate is essential — without it, authority check returns NOT_IN_MANDATE for all signatories. | Retry 2x → Alert Document Team (hard block) |
| 3 | KB-5 Retrieval | Knowledge Retrieval | — | Loads confidence threshold definitions and evidence packaging requirements. Without this, LLM has no reference for tier assignments. | KB failure → use hardcoded defaults (≥85/60–84/<60) + alert KB Admin |
| 4 | Execution Doc Filter + Signatory Map | Code Node | — | Identifies exactly which docs require execution and maps each signatory to their documents. Scope errors here → missed signatories → incomplete verification. | Wrong filter → compliance gap in signature coverage |
| 5 | Signature Analysis Batch | Code Node (MCP) | SKL-02/03/04 | **Core technical task.** Runs all 3 sub-operations (extract + authority check + compare) for every signatory in one batch. Returns confidence scores. | Model failure → retry 1x → route to Desk Support for manual review |
| 6 | Confidence Tier Classifier | Code Node | — | Deterministic threshold application. Ensures LOW confidence cases never reach Desk Support without proper escalation flag. | N/A — deterministic |
| 7 | LOW Confidence Router | IF/ELSE | — | Hard gate. Any signatory below 60% blocks Desk Support review and routes immediately to ESCALATE_COMPLIANCE. Prevents biased presentation of failing comparisons. | N/A — deterministic |
| 8 | Verification Summary LLM | LLM (Sonnet) | SKL-05 | Synthesises all per-signatory results into a readable workbench report. Provides reviewer guidance for MEDIUM confidence cases. Without this, Desk Support receives raw data only. | Retry 1x → use structured template fallback |
| 9 | Output Assembler | Code Node | — | Packages workbench payload with HITL deadline, priority, and all document references in a single structured object. | N/A — deterministic |
| 10 | Workbench Post | HTTP Request | SKL-06 | **Critical.** Posts signature review task to Desk Support queue. Without this, HITL cannot start — no one reviews the case. | Retry 3x → Email Desk Support manager directly |
| 11 | Notify + Park for HITL | Code Node (MCP) | SKL-07 | Atomic operation: writes HITL_PENDING checkpoint AND sends in-app notification together. Ensures Desk Support is notified every time HITL_PENDING is written. | Checkpoint failure → case stuck in N-1 state forever |
| 12 | END: HITL_PENDING | End Node | — | Returns HITL_PENDING to Orchestrator. Orchestrator holds case until Spring Boot resume signal. | N/A |
| 13 | Resume: Decision Received | Start Node | — | Entry point for Phase 2. Validates decision payload format. | Invalid payload format → reject, re-notify Desk Support |
| 14 | Decision Validator | Code Node | SKL-08 | Every signatory from Phase 1 must have a decision. Incomplete submissions return to workbench immediately with missing names highlighted. | Incomplete decisions → return to workbench |
| 15 | Rejection Router | IF/ELSE | — | Hard gate: one rejected signatory terminates the entire signature verification step. The full document set must be re-executed. | N/A — deterministic |
| 16 | Clarification Router | IF/ELSE | — | Clarify requests trigger SA-7 customer email and park the workflow again. Case waits for re-submitted signed documents. | SA-7 failure → log + retry notification (non-blocking) |
| 17 | Store Specimens | Code Node (MCP) | SKL-09 | **Audit-critical.** Approved specimens are permanent regulatory evidence. MAS/HKMA require retention. Failure MUST block N-3 advance. | Retry 3x → Alert Desk Support + Operations (hard block — N-3 cannot start) |
| 18 | Checkpoint Writer | Code Node (MCP) | — | **MANDATORY.** Writes N-2 COMPLETE, advances case to N-3, fires SIGNATURE_APPROVED event triggering SA-4. | Checkpoint failure → case stuck at N-2 state |
| 19 | END: N2Output | End Node | — | Returns N2Output to Orchestrator. Orchestrator triggers SA-4. | N/A |

---

## 4. Knowledge Bases Required

| KB ID | KB Name | Used By Skill | Purpose | Query Pattern |
|---|---|---|---|---|
| **KB-5** | Signature Verification Guidelines | SKL-05 (LLM summary), Code nodes (threshold gate) | Confidence threshold definitions (HIGH ≥85% / MEDIUM 60–84% / LOW <60%), evidence packaging standards required for audit, acceptable ID document types per jurisdiction (SGP/HKG/CHN), escalation criteria for mismatch cases, model FAR/FRR performance benchmarks | "Confidence thresholds and evidence packaging requirements for signature verification in {jurisdiction}" |

**KB Configuration:**

| Setting | KB-5 |
|---|---|
| Max Chunks | 3 |
| Relevance Threshold | 0.75 |
| Embedding Model | text-embedding-3-large |
| Chunk Size | 400 tokens |
| Chunk Overlap | 40 tokens |

---

## 5. MCP Tools

> **Design Note — Consolidated for 10-Iteration Cap:**
> The 4 granular MCP tools from the global registry (T-08 `signature_extractor`, T-09 `signature_comparator`, T-10 `signatory_authority_checker`, T-11 `signature_store`) are consolidated into 2 batch MCP tools to fit within the Dify iteration cap. Context fetch, HITL parking, specimen storage, and checkpoint writing are each one atomic tool call. Total: 5 tools across 8 iterations.

| # | Tool Name | Covers Skills | DB Tables Written | Purpose |
|---|---|---|---|---|
| 1 | `sa3_get_case_context` | Context Injector | READ: `dce_ao_case_state`, `dce_ao_node_checkpoint`, `dce_ao_document_staged`, `dce_ao_rm_hierarchy` | Fetches complete case context: case state, N-1 output from checkpoint, staged document metadata, RM hierarchy for notification routing. For retries: returns Phase 1 analysis results if already run, enabling Phase 2 to resume without re-extraction. |
| 2 | `sa3_run_signature_analysis_batch` | SKL-02, SKL-03, SKL-04 | INSERT: `dce_ao_signature_verification` (1 row per signatory) | Atomic batch analysis across all signatories: (1) calls `signature_extractor` model (API-7) to extract signature crops from documents, (2) calls `signatory_authority_checker` (T-10) to validate mandate authority, (3) calls `signature_comparator` model (API-7) for confidence-scored comparison against ID document. Returns per-signatory: confidence_score, authority_status, comparison_overlay_ref, signature_crop_refs[]. |
| 3 | `sa3_park_for_hitl` | SKL-07 | INSERT: `dce_ao_hitl_review_task`; INSERT: `dce_ao_node_checkpoint` (HITL_PENDING); UPDATE: `dce_ao_case_state`; INSERT: `dce_ao_event_log` (SIGNATURE_ANALYSED) | Atomic operation: sends in-app notification to Desk Support persona, creates HITL task record, writes HITL_PENDING checkpoint. Both checkpoint and notification committed in same transaction — prevents orphaned HITL tasks without checkpoint records. |
| 4 | `sa3_store_approved_specimens` | SKL-09 | INSERT: `dce_ao_signature_specimen` (1 row per approved signatory) | Batch stores all approved signature specimens via Spring Boot Signature Repository API (`POST /api/signatures`). Each specimen stored with: signatory_id, entity_id, source_doc_id, confidence_score, approving_officer_id, comparison_overlay_ref, MongoDB GridFS reference. Returns specimen_ids[] for inclusion in N2Output. |
| 5 | `sa3_complete_node` | Checkpoint Writer | INSERT: `dce_ao_node_checkpoint` (COMPLETE/FAILED/ESCALATED); UPDATE: `dce_ao_case_state`; INSERT: `dce_ao_event_log` (HITL_DECISION_RECEIVED, NODE_COMPLETED / SIGNATURE_REJECTED / SIGNATURE_APPROVED) | Mandatory checkpoint writer. On SIGNATURE_APPROVED: advances current_node to N-3, fires Kafka event. On SIGNATURE_REJECTED: records failure context. On HITL_PENDING (clarify): keeps node in HITL state. Atomic transaction. |

**Agent Iteration Flow (8 turns total — split across two execution phases):**

| Phase | Turn | Type | Tool / Action |
|---|---|---|---|
| **Pre-HITL** | 1 | Tool | `sa3_get_case_context` — fetch case state + N-1 output + execution doc metadata |
| | 2 | Tool | `sa3_run_signature_analysis_batch` — extract + authority check + compare all signatories |
| | 3 | LLM (Sonnet) | Verification Summary — synthesise results into workbench-ready report with reviewer guidance |
| | 4 | Tool | `sa3_park_for_hitl` — post to workbench, write HITL_PENDING checkpoint |
| **— PARK: HITL —** | — | HUMAN | COO Desk Support reviews + submits decisions (APPROVED / REJECTED / CLARIFY) |
| **Post-HITL** | 5 | Tool | `sa3_get_case_context` — fetch HITL decision payload + Phase 1 context |
| | 6 | Code | Decision Validator — segregate approve/reject/clarify (deterministic, no tool call) |
| | 7 | Tool | `sa3_store_approved_specimens` — batch store all approved signatures in MongoDB |
| | 8 | Tool | `sa3_complete_node` — write N-2 COMPLETE checkpoint + advance to N-3 |

---

## 6. Database Tables — Read/Write Map

> **Column Mapping Notes:**
> - `dce_ao_hitl_review_task` is a **shared HITL table** used by SA-3, SA-4, SA-5, and SA-6. Each agent writes tasks with a different `assigned_persona` (DESK_SUPPORT / RM / CREDIT_TEAM / TMO_STATIC) and `task_type`.
> - `dce_ao_signature_specimen` stores metadata only. The actual signature image is stored in MongoDB GridFS via the Signature Repository API (`/api/signatures`). The `mongodb_specimen_ref` column is the GridFS object ID.
> - Signature verification results in `dce_ao_signature_verification` are immutable — no updates permitted post-write (audit trail requirement).

### Tables SA-3 Writes (creates)

| Table | Operation | Skill | When |
|---|---|---|---|
| `dce_ao_signature_verification` | INSERT (1 row per signatory) | SKL-02/03/04 | After batch analysis completes (Phase 1) |
| `dce_ao_hitl_review_task` | INSERT | SKL-07 | When parking for HITL (Phase 1 end) |
| `dce_ao_signature_specimen` | INSERT (1 row per approved signatory) | SKL-09 | After Desk Support approves (Phase 2) |
| `dce_ao_node_checkpoint` | INSERT | Phase 1 end + Phase 2 end | HITL_PENDING → COMPLETE (or REJECTED / ESCALATED) |
| `dce_ao_event_log` | INSERT (2–3 rows) | Throughout | SIGNATURE_ANALYSED, HITL_DECISION_RECEIVED, NODE_COMPLETED / SIGNATURE_REJECTED |

### Tables SA-3 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context Injector (case type, jurisdiction, priority, current_node) |
| `dce_ao_node_checkpoint` | SELECT | Context Injector (N-1 output, prior N-2 attempt if retry) |
| `dce_ao_document_staged` | SELECT | Batch analysis (MongoDB storage URLs for signature extraction) |
| `dce_ao_rm_hierarchy` | SELECT | Desk Support notification routing (RM name for workbench context) |

### New Tables SA-3 Creates

```sql
-- Per-signatory signature verification result (Phase 1 output — immutable audit record)
CREATE TABLE dce_ao_signature_verification (
    verification_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                 VARCHAR(20) NOT NULL,
    attempt_number          INT NOT NULL DEFAULT 1,
    signatory_id            VARCHAR(50) NOT NULL,           -- Unique ID within mandate
    signatory_name          VARCHAR(200) NOT NULL,
    authority_status        ENUM('AUTHORISED','UNAUTHORISED','NOT_IN_MANDATE') NOT NULL,
    role_in_mandate         VARCHAR(100),                   -- e.g. "Director", "Authorised Signatory"
    confidence_score        DECIMAL(5,2) NOT NULL,          -- 0.00 to 100.00
    confidence_tier         ENUM('HIGH','MEDIUM','LOW') NOT NULL,
    source_doc_ids          JSON,                           -- Document IDs where signature was found
    id_doc_ref              VARCHAR(30),                    -- ID document used for comparison
    comparison_overlay_ref  VARCHAR(500),                   -- MongoDB ref to side-by-side overlay image
    signature_crop_refs     JSON,                           -- MongoDB refs to extracted signature crops
    flag_for_review         BOOLEAN DEFAULT FALSE,          -- TRUE for MEDIUM tier
    escalate_immediate      BOOLEAN DEFAULT FALSE,          -- TRUE for LOW tier
    analysed_at             DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_sig_attempt (case_id, signatory_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_tier (confidence_tier),
    INDEX idx_escalate (escalate_immediate)
);

-- Approved signature specimens (post-HITL — permanent regulatory evidence)
CREATE TABLE dce_ao_signature_specimen (
    specimen_id             VARCHAR(30) PRIMARY KEY,        -- SPEC-XXXXXX
    case_id                 VARCHAR(20) NOT NULL,
    signatory_id            VARCHAR(50) NOT NULL,
    signatory_name          VARCHAR(200) NOT NULL,
    entity_id               VARCHAR(50),                    -- Corporate entity (from case)
    source_doc_id           VARCHAR(30) NOT NULL,           -- FK to dce_ao_document_staged
    confidence_score        DECIMAL(5,2) NOT NULL,          -- Score at time of verification
    approving_officer_id    VARCHAR(20) NOT NULL,           -- Desk Support officer who approved
    approving_officer_name  VARCHAR(200),
    mongodb_specimen_ref    VARCHAR(500) NOT NULL,          -- GridFS object ID for signature image
    comparison_overlay_ref  VARCHAR(500),                   -- GridFS ref to comparison overlay
    approved_at             DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id),
    INDEX idx_signatory (signatory_id),
    INDEX idx_entity (entity_id)
);

-- Shared HITL review task table (used by SA-3, SA-4, SA-5, SA-6)
CREATE TABLE dce_ao_hitl_review_task (
    task_id                 VARCHAR(30) PRIMARY KEY,        -- HITL-XXXXXX
    case_id                 VARCHAR(20) NOT NULL,
    node_id                 VARCHAR(10) NOT NULL,           -- N-2, N-3, N-4, N-5
    task_type               ENUM('SIGNATURE_REVIEW','KYC_CDD_REVIEW',
                                  'CREDIT_REVIEW','TMO_STATIC_REVIEW') NOT NULL,
    assigned_persona        ENUM('DESK_SUPPORT','RM','CREDIT_TEAM','TMO_STATIC') NOT NULL,
    assigned_to_id          VARCHAR(20),                    -- Specific officer if pre-assigned
    status                  ENUM('PENDING','IN_REVIEW','DECIDED','EXPIRED') DEFAULT 'PENDING',
    priority                ENUM('URGENT','STANDARD','DEFERRED') NOT NULL,
    task_payload            JSON NOT NULL,                  -- Full report/brief posted to workbench
    deadline                DATETIME NOT NULL,              -- HITL SLA deadline
    decision_payload        JSON,                           -- Decisions submitted by human
    decided_by_id           VARCHAR(20),
    decided_at              DATETIME,
    created_at              DATETIME DEFAULT NOW(),
    updated_at              DATETIME ON UPDATE NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id),
    INDEX idx_persona (assigned_persona),
    INDEX idx_status (status),
    INDEX idx_node (node_id)
);
```

---

## 7. Input Format

### Trigger: CHECKLIST_COMPLETE from DCE Orchestrator

```json
{
  "case_id": "AO-2026-000101",
  "document_ids": [
    "DOC-000001",
    "DOC-000002",
    "DOC-000003",
    "DOC-000004"
  ],
  "company_mandate_id": "DOC-000002",
  "trigger_event": "CHECKLIST_COMPLETE",
  "triggered_at": "2026-03-02T10:45:00+08:00"
}
```

### Resume Trigger: HITL Decision from Spring Boot

```json
{
  "case_id": "AO-2026-000101",
  "mode": "RESUME",
  "hitl_task_id": "HITL-000042",
  "decisions": [
    {
      "signatory_id": "SIG-001",
      "signatory_name": "John Tan Wei Ming",
      "outcome": "APPROVED",
      "notes": "Signature matches ID document — HIGH confidence. Clear mandate authority as Director.",
      "approving_officer_id": "DS-0015",
      "decided_at": "2026-03-02T11:20:00+08:00"
    },
    {
      "signatory_id": "SIG-002",
      "signatory_name": "Sarah Lim Hui Ying",
      "outcome": "APPROVED",
      "notes": "MEDIUM confidence accepted — consistent style and clear mandate authority as Authorised Signatory.",
      "approving_officer_id": "DS-0015",
      "decided_at": "2026-03-02T11:22:00+08:00"
    }
  ],
  "reviewed_by_id": "DS-0015",
  "reviewed_at": "2026-03-02T11:22:00+08:00"
}
```

---

## 8. Output Format — N2Output (Pydantic)

```python
from pydantic import BaseModel
from typing import Literal, List, Optional


class SignatoryOutcome(BaseModel):
    signatory_id: str                                      # e.g. SIG-001
    signatory_name: str
    authority_status: Literal["AUTHORISED", "UNAUTHORISED", "NOT_IN_MANDATE"]
    confidence_score: float                                # 0.0 to 100.0
    confidence_tier: Literal["HIGH", "MEDIUM", "LOW"]
    outcome: Literal["APPROVED", "REJECTED", "CLARIFY"]
    specimen_id: Optional[str]                             # SPEC-XXXXXX — set only if APPROVED
    flag_reason: Optional[str]                             # Notes from Desk Support officer


class N2Output(BaseModel):
    case_id: str                                           # AO-2026-XXXXXX
    verification_status: Literal[
        "ALL_APPROVED",
        "PARTIAL_APPROVED",
        "HAS_REJECTIONS",
        "CLARIFICATION_REQUIRED"
    ]
    total_signatories: int
    approved_count: int
    rejected_count: int
    clarify_count: int
    signatories: List[SignatoryOutcome]
    specimens_stored: List[str]                            # Specimen IDs stored in MongoDB
    reviewed_by_officer_id: str                            # Desk Support officer
    reviewed_at: str                                       # ISO 8601
    next_node: Literal["N-3", "SIGNATURE_REJECTED", "HITL_PENDING", "ESCALATE_COMPLIANCE"]
    verification_notes: Optional[str]
```

### Sample Output JSON

```json
{
  "case_id": "AO-2026-000101",
  "verification_status": "ALL_APPROVED",
  "total_signatories": 2,
  "approved_count": 2,
  "rejected_count": 0,
  "clarify_count": 0,
  "signatories": [
    {
      "signatory_id": "SIG-001",
      "signatory_name": "John Tan Wei Ming",
      "authority_status": "AUTHORISED",
      "confidence_score": 91.5,
      "confidence_tier": "HIGH",
      "outcome": "APPROVED",
      "specimen_id": "SPEC-000031",
      "flag_reason": null
    },
    {
      "signatory_id": "SIG-002",
      "signatory_name": "Sarah Lim Hui Ying",
      "authority_status": "AUTHORISED",
      "confidence_score": 74.2,
      "confidence_tier": "MEDIUM",
      "outcome": "APPROVED",
      "specimen_id": "SPEC-000032",
      "flag_reason": "Medium confidence — accepted by DS-0015: consistent signature style; strong mandate authority."
    }
  ],
  "specimens_stored": ["SPEC-000031", "SPEC-000032"],
  "reviewed_by_officer_id": "DS-0015",
  "reviewed_at": "2026-03-02T11:22:00+08:00",
  "next_node": "N-3",
  "verification_notes": "2 signatories verified. Both authorised under company mandate. All specimens stored."
}
```

---

## 9. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| Fetch Documents (SKL-01) | API timeout / document not found | Yes | 2 | Alert Document Management | Document Management (hard block) |
| Fetch Mandate (SKL-01) | Mandate document missing | No | — | Flag all signatories as NOT_IN_MANDATE | COO Desk Support (manual mandate retrieval) |
| Signature Extractor model | Model failure / no signature region found | Yes | 1 | Flag signatory for Desk Support manual extraction | COO Desk Support |
| Signatory Authority Checker | Mandate not parseable / API failure | Yes | 1 | Return NOT_IN_MANDATE — Desk Support decides | COO Desk Support |
| Signature Comparator model | Model API failure | Yes | 1 | Return confidence = 0 → LOW tier → ESCALATE_COMPLIANCE | Compliance + COO Desk Support |
| LOW confidence (< 60%) | Threshold breach | No | — | Immediate ESCALATE_COMPLIANCE routing | Compliance / COO Desk Support |
| Workbench Post (SKL-06) | API failure | Yes | 3 | Email Desk Support manager directly | Desk Support Manager |
| HITL Deadline Breach | Desk Support no-action beyond SLA | Yes (reminders) | 3 (at 75%/90%/100% SLA) | SA-7 escalation chain | Desk Support → COO Desk Management |
| Specimen Storage (SKL-09) | MongoDB / Signature Repository API failure | Yes | 3 | Block N-3 advance — audit trail is mandatory | Document Management + Operations (hard block) |
| Checkpoint Write | MariaDB failure | Yes | 3 | Alert Operations | Operations (hard block) |

---

## 10. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow (WF) — Two-Phase (Pre-HITL + Post-HITL) |
| **Dify App Name** | `DCE-AO-SA3-Signature-Verification` |
| **Primary Model** | claude-sonnet-4-6 (SKL-05 verification summary) |
| **Secondary Model** | None — confidence tiers are deterministic |
| **Temperature** | 0.1 (verification summary must be factual and precise) |
| **Max Tokens** | 2048 |
| **Knowledge Bases** | KB-5 (Signature Verification Guidelines) |
| **MCP Tools** | sa3_get_case_context, sa3_run_signature_analysis_batch, sa3_park_for_hitl, sa3_store_approved_specimens, sa3_complete_node |
| **Max Agent Iterations** | 8 (4 tool + 1 LLM + 3 tool) — within 10-iteration cap |
| **Max Retries (Node)** | 1 |
| **SLA Window** | 4h (URGENT) / 24h (STANDARD) / 48h (DEFERRED) — Desk Support review window |
| **HITL Required** | YES — COO Desk Support |
| **Checkpoint** | Mandatory — HITL_PENDING (Phase 1 end) + COMPLETE / REJECTED / ESCALATED (Phase 2 end) |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | SIGNATURE_ANALYSED, HITL_DECISION_RECEIVED, SIGNATURE_APPROVED, SIGNATURE_REJECTED, NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa3_` |
| **Output Schema** | N2Output (Pydantic validated) |
| **Compliance References** | MAS Notice SFA 02-N13, HKMA AML/CFT Guidelines, DBS Signature Verification Policy |
