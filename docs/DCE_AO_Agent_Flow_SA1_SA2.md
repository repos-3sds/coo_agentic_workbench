# DCE Account Opening — Agent Flow: SA-1 → SA-2

| Field | Value |
|---|---|
| **Date** | 2026-03-02 |
| **Scope** | Data handoff and execution flow between SA-1 (Intake & Triage) and SA-2 (Document Collection) |

---

## Execution Flow

```
SA-1 (N-0) Intake & Triage                    SA-2 (N-1) Document Collection
═══════════════════════                        ════════════════════════════════

SKL-01: Email/Portal ingestion
         │
SKL-02: Classify account type ──────────────→  SKL-01: Generate checklist
         │                        (reads         │     (uses account_type + jurisdiction
SKL-03: Assess priority           classification │      + entity_type from SA-1's
         │                        result)        │      dce_ao_classification_result
SKL-04: Create case record                      │      to query KB-2)
         │                                       │
SKL-05: Link RM hierarchy                       SKL-02: OCR all staged documents
         │                                       │     (reads dce_ao_document_staged
SKL-06: Pre-stage documents ─────────────────→   │      created by SA-1 SKL-06)
         │                   (documents are      │
SKL-07: Notify RM            the primary         SKL-03: Assess completeness
         │                   handoff between      │     (match OCR results → checklist)
         ▼                   the two agents)      │
  N0Output                                      SKL-04: Validate document expiry
  {next_node: "N-1"} ──→ Orchestrator ──→ N-1    │
                                                 SKL-05: Generate rejection reasons
                                                  │     (for any REJECTED/EXPIRED docs)
                                                  │
                                                 SKL-06: Flag documents in DMS
                                                  │
                                                 SKL-07: Compose RM chase
                                                  │     (if incomplete → retry)
                                                  │
                                                 SKL-08: Final routing decision
                                                  │
                                                  ▼
                                           ┌─────────────┐
                                           │ Complete?    │
                                           │             │
                                    YES    │   NO (retry  │    NO (ceiling)
                                    ▼      │   < 3)       │        ▼
                                  N-2      │     ▼        │      DEAD or
                                  (KYC)    │  HITL_RM     │  ESCALATE_BRANCH_MGR
                                           │  (chase)     │
                                           └─────────────┘
```

---

## Data Handoff: SA-1 Tables → SA-2

| SA-1 Table (written) | SA-2 Usage (read) | Purpose |
|---|---|---|
| `dce_ao_case_state` | Case context | case_type, jurisdiction, priority, sla_deadline, current_node |
| `dce_ao_classification_result` | Checklist generation input | account_type + entity_type + products_requested → drives KB-2 query for applicable document checklist |
| `dce_ao_document_staged` | Documents to process | The actual documents pre-staged by SA-1 SKL-06 — SA-2 runs OCR, validity checks, and checklist matching against these |
| `dce_ao_rm_hierarchy` | Chase notification routing | RM name, email, and manager details used by SA2.SKL-07 when composing chase notifications for missing documents |

---

## SA-2 Tables (written)

| Table | Owner Skill(s) | Purpose |
|---|---|---|
| `dce_ao_document_checklist` | SA2.SKL-01 | Generated checklist header per case per attempt |
| `dce_ao_document_checklist_item` | SA2.SKL-01 | Individual checklist line items (mandatory/optional) |
| `dce_ao_document_ocr_result` | SA2.SKL-02 | OCR extraction results per document |
| `dce_ao_document_review` | SA2.SKL-03 to SKL-06 | Per-document decision (ACCEPTED/REJECTED/REQUIRES_RESUBMISSION) |
| `dce_ao_completeness_assessment` | SA2.SKL-03, SKL-07, SKL-08 | Overall completeness result and routing decision |
| `dce_ao_gta_validation` | SA2.SKL-03 | GTA version and schedule validation |

---

## Shared Tables (SA-2 writes into SA-1 shared tables)

| Table | What SA-2 writes |
|---|---|
| `dce_ao_case_state` | Updates `current_node`, `completed_nodes`, `retry_counts` |
| `dce_ao_node_checkpoint` | N-1 checkpoint with N1Output as `output_json` |
| `dce_ao_event_log` | DOC_ASSESSED, DOC_CHASE_SENT, NODE_COMPLETED / NODE_FAILED events |
| `dce_ao_notification_log` | RM chase notifications (SKL-07) |
| `dce_ao_document_staged` | New document rows when RM resubmits during retry |

---

## Retry Mechanics

SA-2 retries are **internal** to N-1 — no DAG back-edge is created. Each retry follows this pattern:

```
Attempt 1                          Attempt 2                          Attempt 3
─────────                          ─────────                          ─────────
Generate checklist                 Reuse checklist                    Reuse checklist
OCR submitted docs                 OCR NEW docs only                  OCR NEW docs only
Assess completeness                Re-assess with new + old docs      Re-assess with new + old docs
  │                                  │                                  │
  ├─ Complete → N-2                  ├─ Complete → N-2                  ├─ Complete → N-2
  │                                  │                                  │
  └─ Incomplete                      └─ Incomplete                      └─ Incomplete
       │                                  │                                  │
       Chase RM (SKL-07)                  Chase RM + Manager                 ESCALATE_BRANCH_MANAGER
       retry_count = 1                    retry_count = 2                    or DEAD
```

- Each attempt creates new rows in `dce_ao_completeness_assessment` and `dce_ao_gta_validation` with incrementing `attempt_number`
- Checklist items update `match_status` and `matched_doc_id` as new documents arrive
- After attempt 2 ceiling is hit → HITL escalation to RM Branch Manager (mandatory)
- The Orchestrator never routes **back** to N-0 — retry stays inside N-1

---

## Orchestrator Handoff Sequence

```
1. SA-1 completes N-0
   └─ Writes N-0 checkpoint: status=COMPLETE, next_node="N-1"
   └─ Updates dce_ao_case_state: current_node="N-1", completed_nodes=["N-0"]
   └─ Publishes NODE_COMPLETED event to Kafka

2. Orchestrator receives NODE_COMPLETED event
   └─ Reads dce_ao_case_state → current_node = "N-1"
   └─ Reads Completion Registry → N-0 ✓, N-1 pending
   └─ Invokes SA-2 workflow with AO Case State Block injected

3. SA-2 executes N-1
   └─ Reads dce_ao_classification_result → determines checklist parameters
   └─ Reads dce_ao_document_staged → gets pre-staged documents
   └─ Runs skills SKL-01 through SKL-08
   └─ Writes N-1 checkpoint: status=COMPLETE, next_node="N-2"
   └─ Updates dce_ao_case_state: current_node="N-2", completed_nodes=["N-0","N-1"]

4. Orchestrator routes to N-2 (SA-4 KYC/CDD)
```

---

## Knowledge Bases Used

| KB | Used by | Purpose |
|---|---|---|
| KB-2: Document Checklist Rules | SA2.SKL-01, SKL-03 | Account type + jurisdiction → mandatory/optional document list |
| KB-3: GTA Reference | SA2.SKL-03 (GTA validation) | Current GTA version, applicable schedules |
| KB-12: GTA & Schedule Reference | SA2.SKL-03 (GTA validation) | Product/jurisdiction-specific addenda requirements |
