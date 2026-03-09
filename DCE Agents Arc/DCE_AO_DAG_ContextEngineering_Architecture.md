# DCE Account Opening — DAG Orchestration + Context Engineering
## Enhanced Agentic Architecture Guide

---

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-02 |
| **Author** | Ranga Bodavalla |
| **Use Case** | DCE Account Opening (AO) |
| **Platform** | Dify (Workflow / Agent / Chatflow) |
| **Deployment** | ABS OpenShift Private Cloud |
| **Regulatory Scope** | MAS (SGP) · HKMA (HKG) |
| **Status** | Draft — Architecture Review |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Philosophy](#2-architecture-philosophy)
3. [Part I — DAG Orchestration Layer](#part-i--dag-orchestration-layer)
   - 3. [DAG Design Principles](#3-dag-design-principles)
   - 4. [Node Inventory](#4-node-inventory)
   - 5. [Node Specification Sheet](#5-node-specification-sheet)
   - 6. [Parallel Fork/Join — Credit & TMO Static Streams](#6-parallel-forkjoin--credit--tmo-static-streams)
   - 7. [State Machine FSM Specification](#7-state-machine-fsm-specification)
   - 8. [Checkpoint & Crash Recovery Pattern](#8-checkpoint--crash-recovery-pattern)
   - 9. [Retry Ceiling & Escalation Matrix](#9-retry-ceiling--escalation-matrix)
   - 10. [State Persistence Schema — MariaDB](#10-state-persistence-schema--mariadb)
4. [Part II — Context Engineering Layer](#part-ii--context-engineering-layer)
   - 11. [Context Engineering Principles](#11-context-engineering-principles)
   - 12. [AO Case State Block — Master Injection Schema](#12-ao-case-state-block--master-injection-schema)
   - 13. [Completion Registry Pattern](#13-completion-registry-pattern)
   - 14. [Retry Awareness & Failure History Injection](#14-retry-awareness--failure-history-injection)
   - 15. [Role Scope Templates — System Prompts](#15-role-scope-templates--system-prompts)
   - 16. [Pydantic Output Models — Structured Contracts](#16-pydantic-output-models--structured-contracts)
   - 17. [KB Relevance Filter Strategy](#17-kb-relevance-filter-strategy)
   - 18. [HITL Trigger Criteria — Constitutional Rules](#18-hitl-trigger-criteria--constitutional-rules)
5. [Part III — Dify Implementation Guide](#part-iii--dify-implementation-guide)
   - 19. [DAG-to-Dify Node Mapping](#19-dag-to-dify-node-mapping)
   - 20. [Dify Workflow Canvas Structure per Node](#20-dify-workflow-canvas-structure-per-node)
   - 21. [Variable Propagation Strategy](#21-variable-propagation-strategy)
   - 22. [Context Injection via Dify Code Nodes](#22-context-injection-via-dify-code-nodes)
6. [Part IV — Audit, Compliance & Observability](#part-iv--audit-compliance--observability)
   - 23. [Event Log Schema — CQRS + Event Sourcing](#23-event-log-schema--cqrs--event-sourcing)
   - 24. [MAS / HKMA Compliance Checkpoint Map](#24-mas--hkma-compliance-checkpoint-map)
   - 25. [Observability & SLA Monitoring](#25-observability--sla-monitoring)
7. [Part V — Implementation Roadmap](#part-v--implementation-roadmap)
   - 26. [Phased Implementation Plan](#26-phased-implementation-plan)
   - 27. [Engineering Standards Checklist](#27-engineering-standards-checklist)
8. [Part VI — Agent Skills Registry](#agent-skills-master-table)
   - [Skill Taxonomy](#skill-taxonomy)
   - [Domain Orchestrator — Skill Set](#domain-orchestrator--skill-set)
   - [SA-1 — Case Intake & Triage Agent (Node N-0)](#sa-1--case-intake--triage-agent-node-n-0)
   - [SA-2 — Document Collection Agent (Node N-1)](#sa-2--document-collection-agent-node-n-1)
   - [SA-4 — KYC / CDD Assessment Agent (Node N-2)](#sa-4--kyc--cdd-assessment-agent-node-n-2)
   - [SA-6 — Credit Assessment Agent (Node N-3a)](#sa-6--credit-assessment-agent-node-n-3a)
   - [SA-7 — TMO Static Data Agent (Node N-3b)](#sa-7--tmo-static-data-agent-node-n-3b)
   - [SA-5 — Signature Verification Agent (Node N-5)](#sa-5--signature-verification-agent-node-n-5)
   - [SA-8 — Regulatory Configuration Agent (Node N-6)](#sa-8--regulatory-configuration-agent-node-n-6)
   - [SA-9 — Activation Review Agent (Node N-7)](#sa-9--activation-review-agent-node-n-7)
   - [SA-3 — Downstream Provisioning Agent (Node N-8)](#sa-3--downstream-provisioning-agent-node-n-8)
   - [Agent Skills Master Table](#agent-skills-master-table)
9. [Part VII — Workbench UI Integration & Lifecycle Coverage](#28-authoritative-agent-identifier-map)
   - 28. [Authoritative Agent Identifier Map](#28-authoritative-agent-identifier-map)
   - 29. [Complete Lifecycle Phase Matrix](#29-complete-lifecycle-phase-matrix)
   - 30. [Workbench Persona View Specifications](#30-workbench-persona-view-specifications)
   - 31. [Per-Node UI-Ready Output Extensions](#31-per-node-ui-ready-output-extensions)
   - 32. [Alert & Notification Taxonomy](#32-alert--notification-taxonomy)
   - 33. [Notification & Communication — Cross-Cutting Capability](#33-notification--communication--cross-cutting-capability)
   - 34. [Audit & Compliance — Cross-Cutting Capability & Completion Gate](#34-audit--compliance--cross-cutting-capability--completion-gate)
   - 35. [KPI Dashboard Data Model](#35-kpi-dashboard-data-model)
   - 36. [Extended Lifecycle Stages — Post-DAG & Background Processes](#36-extended-lifecycle-stages--post-dag--background-processes)
   - 37. [Commission Structure Validation](#37-commission-structure-validation)
   - 38. [GTA & Schedule Reference Handling](#38-gta--schedule-reference-handling)
   - 39. [Enhanced Knowledge Base Registry (DAG-Aligned)](#39-enhanced-knowledge-base-registry-dag-aligned)
   - 40. [Engineering Standards Checklist — UI & Lifecycle Extensions](#40-engineering-standards-checklist--ui--lifecycle-extensions)

---

## 1. Executive Summary

This document provides the **definitive enhanced architecture guide** for the DCE Account Opening (AO) agentic system at ABS Bank. It combines two complementary and mutually reinforcing architectural layers:

| Layer | Purpose | Guarantee Type |
|---|---|---|
| **DAG Orchestration** | Structural cycle prevention, state persistence, deterministic flow | **Deterministic** |
| **Context Engineering** | LLM decision quality, retry awareness, role clarity, output schema | **Probabilistic (improved)** |

The DAG layer provides the **rails** — structural guarantees that the system cannot enter infinite loops, all failures have ceilings, and every state change is auditable. The Context Engineering layer provides the **driver quality** — ensuring each LLM agent call is given the right information, in the right structure, with the right constraints to make high-quality decisions.

Both layers together satisfy:
- **MAS Technology Risk Management Guidelines** — deterministic audit trail, human oversight
- **HKMA Supervisory Policy Manual** — documented controls, escalation procedures
- **ABS Internal Risk Framework** — HITL at all critical decision points, retry ceilings, SLA monitoring

---

## 2. Architecture Philosophy

### Two-Layer Mental Model

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         DCE AO AGENTIC SYSTEM                           ║
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │                    LAYER 1: DAG ORCHESTRATION                        │ ║
║  │                                                                       │ ║
║  │   Structural guarantee: no back-edges, no cycles, all paths finite   │ ║
║  │                                                                       │ ║
║  │   N-0 → N-1 → N-2 → ┬─ N-3a ─┐                                      │ ║
║  │                      │        ├→ N-4 → N-5 → N-6 → N-7 → N-8 → DONE │ ║
║  │                      └─ N-3b ─┘                                      │ ║
║  │                                                                       │ ║
║  │   Responsibilities:                                                   │ ║
║  │   • Cycle prevention (by construction — no back-edges in graph)      │ ║
║  │   • State persistence (checkpoint to MariaDB at every node exit)     │ ║
║  │   • Retry ceilings (max attempts per node, global max)               │ ║
║  │   • HITL gate enforcement (mandatory human approval at N-5, N-7)     │ ║
║  │   • Escalation routing (deterministic escalation per failure type)   │ ║
║  │   • Audit trail (every state transition logged to event store)       │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
║                                  │                                       ║
║                    Context window │ of every LLM call                   ║
║                                  ▼                                       ║
║  ┌─────────────────────────────────────────────────────────────────────┐ ║
║  │                 LAYER 2: CONTEXT ENGINEERING                         │ ║
║  │                                                                       │ ║
║  │   Intelligence quality: better LLM decisions within the DAG rails   │ ║
║  │                                                                       │ ║
║  │   Responsibilities:                                                   │ ║
║  │   • AO Case State Block injection (full current state in every call) │ ║
║  │   • Completion Registry (explicit list of completed nodes)           │ ║
║  │   • Retry awareness (inject retry count + prior failure reasons)     │ ║
║  │   • Role scope isolation (tight system prompts per sub-agent)        │ ║
║  │   • Pydantic output models (structured contracts on all outputs)     │ ║
║  │   • KB relevance filters (precision RAG, not corpus dumping)        │ ║
║  │   • HITL constitutional rules (mandatory escalation criteria)        │ ║
║  └─────────────────────────────────────────────────────────────────────┘ ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Core Design Invariants

These invariants are **never violated** regardless of agent output:

| # | Invariant | Enforcement Point |
|---|---|---|
| I-1 | No DAG node may invoke a previously completed node | Completion Registry + DAG topology |
| I-2 | No sub-agent may communicate directly with another sub-agent | Kafka publish-only pattern; orchestrator is sole consumer |
| I-3 | Every node exit must write a checkpoint to MariaDB before returning | Checkpoint pattern — mandatory final step in every Dify workflow |
| I-4 | Retry count must never exceed the node's ceiling | Retry counter in MariaDB; orchestrator reads before invoking |
| I-5 | N-5 (Signature) and N-7 (Activation) always require human approval | HITL constitutional rule in orchestrator system prompt |
| I-6 | A node failure after ceiling is reached routes to ESCALATION, never retried | Escalation matrix enforced by DAG transition logic |
| I-7 | All agent outputs must conform to their Pydantic model | Validation step in Dify Code node after every LLM node |

---

# Part I — DAG Orchestration Layer

---

## 3. DAG Design Principles

### Why DAG for DCE Account Opening

A **Directed Acyclic Graph** (DAG) is a graph where:
- Edges have direction (A → B, not B → A)
- No path from any node leads back to itself (acyclic — no cycles)

For DCE AO, the DAG guarantees that the workflow progresses **strictly forward**. The properties that make DAG non-negotiable for a regulated financial process:

| Property | DAG Guarantee | Why It Matters for DCE AO |
|---|---|---|
| **Acyclicity** | By graph construction, cycles cannot exist | No infinite loops between orchestrator and sub-agents |
| **Topological ordering** | Nodes can be executed in a guaranteed sequence | Dependencies (e.g., KYC before Credit) are structurally enforced |
| **Finite termination** | All paths lead to terminal nodes (DONE or DEAD) | MAS examiners can always determine final case disposition |
| **Parallelism** | Independent branches (N-3a, N-3b) execute concurrently | Reduces AO TAT (turnaround time) |
| **Determinism** | Given the same inputs, the same path is taken | Reproducibility for audit and regulatory review |

### What "No Back-Edge" Means in Practice

```
FORBIDDEN (causes cycle):
  N-2 KYC → N-1 Document  ← NEVER
  N-5 Signature → N-3a Credit ← NEVER
  N-7 Activation → N-2 KYC ← NEVER

ALLOWED (side effects only — not graph traversal):
  N-7 Activation detects issue → Publish event to Kafka → Human reviews →
  Human makes correction in UI → New case variant created (new N-0 entry) ← CORRECT PATTERN
```

When a downstream node detects a problem that originated in an upstream node, the resolution path is:
1. Route to **HITL** (human corrects the upstream issue)
2. Human re-submits as a **new workflow run** (new DAG traversal from N-0)
3. The original run is **closed as SUPERSEDED** in the audit log
4. **Never** navigate backwards in the existing graph

---

## 4. Node Inventory

### Full Node Map

```
                    ┌─────────────────────────────┐
                    │  TRIGGER                     │
                    │  (Email · API · Portal)      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-0: Case Intake & Triage   │  SA-1
                    │  Classify · Priority · Route │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-1: Document Collection    │  SA-2
                    │  Completeness · Validation   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-2: KYC/CDD Assessment     │  SA-4
                    │  Screening · Risk Rating     │
                    └──────────────┬──────────────┘
                                   │
               ┌───────────────────┼───────────────────┐
               │    PARALLEL FORK  │                   │
               ▼                                       ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│  N-3a: Credit Assessment │  SA-6   │  N-3b: TMO Static Data   │  SA-7
│  Limit · Grade · Margin  │         │  Entity · Settlement     │
└──────────────┬───────────┘         └──────────────┬───────────┘
               │                                    │
               │         PARALLEL JOIN              │
               └───────────────────┬────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-4: JOIN Gate              │  [No Agent]
                    │  Variable Aggregator         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-5: Signature Verification │  SA-5
                    │  *** MANDATORY HITL ***      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-6: Regulatory Config      │  SA-8
                    │  CLS · Margin · Reporting    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-7: Activation Review      │  SA-9
                    │  *** MANDATORY HITL ***      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  N-8: Downstream Provisioning│  SA-3
                    │  UBIX · CLS · CQG · SIC     │
                    └──────────────┬──────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│  DONE                    │         │  DEAD                    │
│  Account Live · Notified │         │  Rejected · Escalated    │
└──────────────────────────┘         └──────────────────────────┘
```

### Node Summary Table

| Node | Name | Sub-Agent | Dify Type | HITL | Max Retries | Terminal? |
|---|---|---|---|---|---|---|
| **N-0** | Case Intake & Triage | SA-1 | Workflow (WF) | No | 2 | No |
| **N-1** | Document Collection & Completeness | SA-2 | Workflow (WF) | Conditional | 3 | No |
| **N-2** | KYC/CDD Assessment | SA-4 | Agent (AG) | Conditional | 1 | No |
| **N-3a** | Credit Assessment | SA-6 | Workflow (WF) | Conditional | 2 | No |
| **N-3b** | TMO Static Data Setup | SA-7 | Workflow (WF) | Conditional | 3 | No |
| **N-4** | JOIN Gate (Parallel Sync) | — | Variable Aggregator | No | N/A | No |
| **N-5** | Signature Verification | SA-5 | Workflow (WF) | **Mandatory** | 0 | No |
| **N-6** | Regulatory Config | SA-8 | Workflow (WF) | Conditional | 2 | No |
| **N-7** | Activation Review | SA-9 | Workflow (WF) | **Mandatory** | 0 | No |
| **N-8** | Downstream Provisioning | SA-3 | Workflow (WF) | No | 3 per system | No |
| **DONE** | Account Live & Notified | SA-1 | Workflow (WF) | No | — | **Yes** |
| **DEAD** | Terminal Failure / Rejection | — | End Node | No | — | **Yes** |

---

## 5. Node Specification Sheet

### N-0 — Case Intake & Triage

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-1 (Intake & Triage Agent) |
| **Dify Type** | Workflow (WF) |
| **Trigger** | MS Graph API email event · Portal form submission · API POST `/cases` |
| **SLA Window** | 2 hours from submission |
| **Max Retries** | 2 |
| **Escalation** | RM Manager → DCE COO (if data too incomplete to classify) |

**Input Schema:**
```json
{
  "submission_source": "EMAIL | PORTAL | API",
  "raw_payload": {
    "sender_email": "rm.john@abs.com",
    "subject": "New DCE Account Opening - ABC Trading Pte Ltd",
    "body_text": "...",
    "attachments": ["AO_Form.pdf", "Corporate_Profile.pdf"]
  },
  "received_at": "2026-03-02T09:30:00+08:00",
  "rm_employee_id": "RM-0042"
}
```

**Output Schema (Pydantic: `N0Output`):**
```python
class N0Output(BaseModel):
    case_id: str                    # Generated: AO-2026-XXXXXX
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
    next_node: Literal["N-1"]       # Always N-1 from N-0
    confidence: float = Field(ge=0.7, le=1.0, description="Classification confidence")
    intake_notes: Optional[str]
```

**Dify Canvas (Internal Structure):**
```
[Start] → [Code: Context Injector] → [LLM: Triage Classifier]
        → [Code: Output Validator (Pydantic N0Output)]
        → [HTTP: MCP create-case tool]
        → [HTTP: MCP assign-rm tool]
        → [Code: Checkpoint Writer (MariaDB)]
        → [End: Return N0Output]
```

**MCP Tools Called:**
- `create_case` — Creates AO case record in Case Management system
- `assign_rm` — Links RM and RM Manager to case
- `send_notification` — Notifies RM of case creation with case ID

---

### N-1 — Document Collection & Completeness Check

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-2 (Document Processing Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 24 hours (STANDARD) · 8 hours (URGENT) |
| **Max Retries** | 3 (each retry = RM notification to provide missing docs) |
| **Escalation** | After Retry 2: HITL → RM Branch Manager |
| **HITL Trigger** | Missing mandatory docs after 2 collection attempts |

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "account_type": "INSTITUTIONAL_FUTURES",
  "jurisdiction": "SGP",
  "submitted_documents": [
    {
      "doc_id": "DOC-001",
      "filename": "AO_Form_Signed.pdf",
      "submitted_at": "2026-03-02T09:30:00+08:00",
      "source": "EMAIL_ATTACHMENT"
    }
  ],
  "retry_count": 0,
  "prior_failure_reasons": []
}
```

**Output Schema (Pydantic: `N1Output`):**
```python
class DocumentRecord(BaseModel):
    doc_id: str
    doc_type: str       # From KB-2: Document Taxonomy
    filename: str
    status: Literal["ACCEPTED", "REJECTED", "REQUIRES_RESUBMISSION"]
    rejection_reason: Optional[str]
    expiry_date: Optional[date]

class N1Output(BaseModel):
    completeness_flag: bool
    mandatory_docs_complete: bool
    optional_docs_complete: bool
    documents: List[DocumentRecord]
    missing_mandatory: List[str]
    missing_optional: List[str]
    rejected_docs: List[str]
    rejection_reasons: Dict[str, str]
    next_node: Literal["N-2", "HITL_RM", "ESCALATE_BRANCH_MANAGER", "DEAD"]
    retry_recommended: bool
    failure_reason: Optional[str]
    rm_chase_message: Optional[str]  # Populated if retry_recommended=True
```

**MCP Tools Called:**
- `get_document_checklist` — Pulls applicable checklist from KB-2 based on account_type + jurisdiction
- `extract_document_metadata` — OCR + metadata extraction per document
- `validate_document_expiry` — Checks document validity dates
- `flag_document_for_review` — Flags rejected/suspicious documents
- `send_notification` — Sends RM chase notification with missing doc list

---

### N-2 — KYC / CDD Assessment

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-4 (KYC/CDD Agent) |
| **Dify Type** | Agent (AG) — tool-use loop for multi-source screening |
| **SLA Window** | 4 hours (STANDARD) · 2 hours (URGENT) |
| **Max Retries** | 1 (AML/sanctions hits → immediate escalation, no retry) |
| **Escalation** | PEP/Sanctions hit: Compliance Officer (MANDATORY, immediate) |
| **HITL Trigger** | Any PEP flag · Sanctions hit · EDD required · Risk score > threshold |

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "entity_data": {
    "legal_name": "ABC Trading Pte Ltd",
    "registration_number": "202012345A",
    "jurisdiction": "SGP",
    "incorporation_date": "2020-06-15",
    "registered_address": "1 Raffles Place, Singapore 048616"
  },
  "beneficial_owners": [
    {
      "name": "John Tan Wei Ming",
      "id_type": "NRIC",
      "id_number": "SXXXX123A",
      "dob": "1975-03-15",
      "nationality": "SGP",
      "ownership_pct": 55.0
    }
  ],
  "directors": ["..."],
  "retry_count": 0
}
```

**Output Schema (Pydantic: `N2Output`):**
```python
class ScreeningResult(BaseModel):
    screening_source: str       # OFAC, UN, MAS, WorldCheck, etc.
    hit_type: Literal["CLEAR", "POTENTIAL", "CONFIRMED"]
    hit_details: Optional[str]
    screened_at: datetime

class N2Output(BaseModel):
    kyc_status: Literal["PASS", "FAIL", "EDD_REQUIRED", "PENDING_HUMAN_REVIEW"]
    cdd_level: Literal["STANDARD", "ENHANCED", "SIMPLIFIED"]
    risk_rating: Literal["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]
    pep_flag: bool
    sanctions_flag: bool
    adverse_media_flag: bool
    screening_results: List[ScreeningResult]
    edd_triggers: List[str]
    beneficial_owner_results: List[Dict]
    compliance_officer_id: Optional[str]    # Assigned if escalation needed
    next_node: Literal["N-3a_N-3b_PARALLEL", "HITL_COMPLIANCE", "DEAD"]
    failure_reason: Optional[str]
    kyc_reference: str          # External screening reference number
```

**MCP Tools Called (Agent tool-use loop):**
- `screen_entity` — Runs entity against sanctions/PEP lists (OFAC, UN, MAS)
- `screen_individual` — Screens individual beneficial owners
- `get_adverse_media` — Checks adverse media databases
- `calculate_risk_rating` — Applies ABS risk model based on all screening results
- `assign_compliance_officer` — If escalation needed, assigns CO from roster
- `create_edd_task` — Creates Enhanced Due Diligence task if EDD required

---

### N-3a — Credit Assessment (Parallel Stream A)

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-6 (Credit Assessment Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 8 hours (STANDARD) · 4 hours (URGENT) |
| **Max Retries** | 2 |
| **Escalation** | After Retry 2: Senior Credit Officer |
| **HITL Trigger** | Credit score below threshold · Large limit request · Complex structure |
| **Runs Concurrent With** | N-3b (TMO Static Data) |

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "kyc_output": "<<N2Output>>",
  "financial_data": {
    "audited_accounts_years": 3,
    "total_assets": 50000000,
    "net_assets": 15000000,
    "revenue": 8000000,
    "currency": "SGD"
  },
  "products_requested": ["FUTURES_SGX", "OPTIONS_SGX"],
  "credit_limit_requested": 5000000,
  "retry_count": 0,
  "prior_failure_reasons": []
}
```

**Output Schema (Pydantic: `N3aOutput`):**
```python
class N3aOutput(BaseModel):
    credit_approved: bool
    credit_grade: Literal["A", "B", "C", "D", "NR"]
    credit_limit_approved: int          # In SGD
    credit_limit_requested: int
    initial_margin_rate: float          # Percentage
    variation_margin_rate: float
    margin_call_threshold: int
    products_approved: List[str]
    products_declined: List[str]
    credit_conditions: List[str]        # Special conditions if any
    next_node: Literal["JOIN_N4", "HITL_CREDIT", "ESCALATE_SCO", "DEAD"]
    credit_officer_id: Optional[str]
    failure_reason: Optional[str]
    credit_reference: str
    valid_until: date                   # Credit approval expiry
```

**MCP Tools Called:**
- `get_credit_model` — Retrieves applicable credit model for entity type
- `run_credit_scoring` — Executes credit scoring algorithm
- `get_product_eligibility` — Checks product eligibility rules per credit grade
- `calculate_margin_requirements` — Computes initial/variation margin
- `create_credit_approval` — Records credit decision in credit system

---

### N-3b — TMO Static Data Setup (Parallel Stream B)

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-7 (TMO Static Data Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 8 hours (STANDARD) · 4 hours (URGENT) |
| **Max Retries** | 3 |
| **Escalation** | After Retry 3: TMO Operations Manager |
| **HITL Trigger** | Settlement instruction conflict · Existing entity mismatch |
| **Runs Concurrent With** | N-3a (Credit Assessment) |

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "kyc_output": "<<N2Output>>",
  "entity_data": "<<from N-0>>",
  "products_requested": ["FUTURES_SGX", "OPTIONS_SGX"],
  "settlement_instructions": {
    "bank_name": "ABS Bank Singapore",
    "account_number": "XXXX-XXXX-XXXX",
    "swift_code": "ABSSSGSG",
    "currency": "SGD"
  },
  "retry_count": 0,
  "prior_failure_reasons": []
}
```

**Output Schema (Pydantic: `N3bOutput`):**
```python
class N3bOutput(BaseModel):
    tmo_setup_complete: bool
    ubix_entity_id: Optional[str]      # Created or linked in UBIX
    sic_counterparty_id: Optional[str] # Created in SIC
    static_data_records: List[Dict]
    settlement_instructions_validated: bool
    products_configured: List[str]
    existing_entity_found: bool
    entity_merge_required: bool         # Trigger HITL if True
    next_node: Literal["JOIN_N4", "HITL_TMO_OPS", "ESCALATE_TMO_MGR", "DEAD"]
    tmo_officer_id: Optional[str]
    failure_reason: Optional[str]
    tmo_reference: str
```

**MCP Tools Called:**
- `search_ubix_entity` — Searches UBIX for existing entity to prevent duplicates
- `create_ubix_entity` — Creates new entity in UBIX trading system
- `validate_settlement_instructions` — Validates banking instructions
- `setup_sic_counterparty` — Creates counterparty record in SIC
- `configure_product_static` — Sets up product-specific static data per product type

---

### N-4 — JOIN Gate (Parallel Stream Synchronisation)

| Property | Specification |
|---|---|
| **Sub-Agent** | None — Pure aggregation node |
| **Dify Type** | Variable Aggregator Node |
| **Purpose** | Wait for N-3a AND N-3b to both complete before proceeding |
| **Logic** | Logical AND — both streams must succeed |
| **Failure Handling** | If either stream DEAD → entire JOIN = DEAD (no partial activation) |
| **Max Retries** | N/A |

**JOIN Gate Logic:**
```
IF N3a.next_node == "JOIN_N4" AND N3b.next_node == "JOIN_N4":
    → Proceed to N-5 (both streams succeeded)
    → Merge N3aOutput + N3bOutput into JoinedCreditTMOOutput

ELIF N3a.next_node == "HITL_CREDIT" OR N3b.next_node == "HITL_TMO_OPS":
    → Route to appropriate HITL handler
    → Hold at JOIN gate until HITL resolution
    → On HITL approval: re-evaluate JOIN gate

ELIF N3a.next_node == "DEAD" OR N3b.next_node == "DEAD":
    → Entire case → DEAD
    → No partial proceeding permitted
```

**Output Schema (Pydantic: `N4JoinOutput`):**
```python
class N4JoinOutput(BaseModel):
    credit_output: N3aOutput
    tmo_output: N3bOutput
    all_streams_complete: bool = True   # Always True if we reach N-4
    combined_products: List[str]        # Intersection of approved products
    next_node: Literal["N-5"]           # Always N-5 from N-4
```

---

### N-5 — Signature Verification

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-5 (Signature Verification Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 24 hours from signature request |
| **Max Retries** | 0 — **HITL is always mandatory at this node** |
| **HITL Type** | Wet-signature physical review by Compliance / Operations |
| **Escalation** | Invalid signatures after HITL: Legal Officer |

**Design Rationale:** Signature verification involves legal authority and identity attestation. No automated system should have final authority on signature authenticity for financial account documents at a regulated bank. This is an **unconditional HITL node**.

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "documents_for_signature": [
    {
      "doc_id": "DOC-001",
      "doc_type": "ACCOUNT_OPENING_FORM",
      "required_signatories": ["CEO", "CFO"],
      "signature_page": 12
    }
  ],
  "authorised_signatory_list": [
    {
      "name": "John Tan Wei Ming",
      "role": "CEO",
      "specimen_signature_ref": "SIG-REF-001"
    }
  ],
  "join_output": "<<N4JoinOutput>>"
}
```

**Agent Pre-Processing Output (before HITL):**
```python
class SignaturePreCheckResult(BaseModel):
    doc_id: str
    doc_type: str
    signatures_found: int
    signatures_required: int
    ai_match_score: float       # Similarity score — NOT binding, for human reference only
    ai_confidence: Literal["HIGH", "MEDIUM", "LOW", "UNCLEAR"]
    anomalies_detected: List[str]
    signatory_identified: Optional[str]
    recommendation: Literal["LIKELY_VALID", "LIKELY_INVALID", "INCONCLUSIVE"]
    human_review_notes: str     # AI-generated context for the human reviewer

class N5Output(BaseModel):
    all_signatures_verified: bool
    signature_results: List[SignatureVerificationResult]
    verified_by: str            # Human reviewer employee ID — mandatory
    verified_at: datetime
    legal_review_required: bool
    next_node: Literal["N-6", "ESCALATE_LEGAL", "DEAD"]
    hitl_complete: bool = True  # Always True — HITL is mandatory
```

**MCP Tools Called:**
- `retrieve_specimen_signatures` — Pulls authorised specimen signatures from Signature Repository
- `extract_signatures_from_doc` — Extracts signature images from PDFs
- `compute_signature_similarity` — AI-based similarity score (advisory only)
- `create_hitl_task` — Creates human review task in Workbench
- `record_signature_decision` — Records human reviewer's final decision

---

### N-6 — Regulatory Configuration

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-8 (Regulatory Config Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 4 hours from N-5 completion |
| **Max Retries** | 2 |
| **Escalation** | After Retry 2: Compliance Officer |
| **HITL Trigger** | Conflicting regulatory requirements · Novel product/jurisdiction combination |

**Input Schema:**
```json
{
  "case_state_block": "<<AO_CASE_STATE_BLOCK>>",
  "case_id": "AO-2026-001234",
  "kyc_output": "<<N2Output>>",
  "credit_output": "<<N3aOutput>>",
  "tmo_output": "<<N3bOutput>>",
  "signature_output": "<<N5Output>>",
  "jurisdiction": "SGP",
  "products_approved": ["FUTURES_SGX", "OPTIONS_SGX"],
  "entity_type": "CORP",
  "cdd_level": "STANDARD",
  "retry_count": 0
}
```

**Output Schema (Pydantic: `N6Output`):**
```python
class RegulatoryParameter(BaseModel):
    parameter_name: str
    parameter_value: str
    regulatory_basis: str   # e.g., "MAS Notice SFA 04-N02"
    effective_from: date

class N6Output(BaseModel):
    regulatory_config_complete: bool
    cls_setup_required: bool
    cls_counterparty_id: Optional[str]
    margin_rules_applied: List[str]
    reporting_obligations: List[str]     # MAS, HKMA, TR reporting flags
    position_limit_rules: List[str]
    product_restrictions: List[str]
    regulatory_parameters: List[RegulatoryParameter]
    compliance_sign_off_required: bool
    next_node: Literal["N-7", "HITL_COMPLIANCE", "ESCALATE_CO", "DEAD"]
    failure_reason: Optional[str]
```

**MCP Tools Called:**
- `get_regulatory_rules` — Pulls applicable rules from KB-3 (Regulatory Requirements)
- `configure_cls` — Sets up CLS (Continuous Linked Settlement) if FX products
- `set_margin_rules` — Applies regulatory margin requirements to account
- `configure_reporting_flags` — Sets MAS/HKMA trade reporting flags
- `set_position_limits` — Applies regulatory position limit controls

---

### N-7 — Activation Review

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-9 (Activation Review Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 24 hours — assigned to DCE COO / Relationship Head |
| **Max Retries** | 0 — **HITL is always mandatory at this node** |
| **HITL Type** | Senior management approval: DCE COO or delegated authority |
| **Escalation** | Rejection: RM + RM Manager + Client notified |

**Design Rationale:** Final account activation requires explicit senior management sign-off. This is a **4-eyes principle** control point — the AI system prepares the complete dossier and recommendation, but the human makes the final binding decision.

**Agent Pre-Processing — Complete Case Dossier:**
```python
class CaseDossier(BaseModel):
    case_id: str
    case_summary: str               # AI-generated executive summary
    client_name: str
    account_type: str
    products_approved: List[str]
    credit_limit: int
    risk_rating: str
    kyc_status: str
    signature_status: str
    regulatory_config_status: str
    outstanding_conditions: List[str]
    ai_recommendation: Literal["APPROVE", "APPROVE_WITH_CONDITIONS", "REJECT", "SEEK_MORE_INFO"]
    ai_recommendation_rationale: str
    risk_flags: List[str]
    total_tac_days: float           # Total time in AO process

class N7Output(BaseModel):
    activation_decision: Literal["APPROVED", "APPROVED_WITH_CONDITIONS", "REJECTED", "DEFERRED"]
    conditions: List[str]           # Any conditions attached to approval
    approved_by: str                # Senior approver employee ID
    approved_at: datetime
    rejection_reason: Optional[str]
    deferral_reason: Optional[str]
    next_node: Literal["N-8", "DEAD"]
    hitl_complete: bool = True
```

**MCP Tools Called:**
- `compile_case_dossier` — Aggregates all node outputs into approval package
- `create_activation_task` — Creates HITL task in Workbench for senior approver
- `calculate_aggregate_risk` — Computes composite risk score across all dimensions
- `check_approval_authority` — Validates approver has authority for this credit limit/risk level
- `record_activation_decision` — Records final decision with full audit trail

---

### N-8 — Downstream Provisioning

| Property | Specification |
|---|---|
| **Sub-Agent** | SA-3 (System Integration Agent) |
| **Dify Type** | Workflow (WF) |
| **SLA Window** | 2 hours from activation approval |
| **Max Retries** | 3 per downstream system (independent retry per system) |
| **Escalation** | Technology Operations on persistent downstream failure |
| **HITL** | None — fully automated provisioning |

**Downstream Systems Provisioned:**

| System | Purpose | API | Retry Independent? |
|---|---|---|---|
| UBIX | Trading platform entity activation | UBIX Entity API | Yes |
| SIC | Settlement instructions confirmation | SIC Config API | Yes |
| CQG | Market data and trading terminal | CQG Account API | Yes |
| CLS | CLS settlement setup (if FX) | CLS Counterparty API | Yes |
| CV | Credit value adjustment system | CV Limit API | Yes |

**Output Schema (Pydantic: `N8Output`):**
```python
class SystemProvisioningResult(BaseModel):
    system_name: str
    provisioning_status: Literal["SUCCESS", "PARTIAL", "FAILED"]
    system_reference_id: str
    retry_count: int
    error_message: Optional[str]

class N8Output(BaseModel):
    all_systems_provisioned: bool
    provisioning_results: List[SystemProvisioningResult]
    ubix_account_id: str
    account_go_live_timestamp: datetime
    next_node: Literal["DONE", "ESCALATE_TECH_OPS"]
    partial_provisioning: bool          # True if some systems succeeded, some failed
    failed_systems: List[str]
```

---

## 6. Parallel Fork/Join — Credit & TMO Static Streams

### Parallel Execution Design

The parallel streams (N-3a and N-3b) are independent processes that can execute concurrently because they have **no data dependency** on each other — both only depend on the output of N-2 (KYC/CDD).

```
                      N-2 Output (KYC/CDD Complete)
                              │
               ┌──────────────┴──────────────┐
               │          PARALLEL FORK        │
               ▼                              ▼
    ┌────────────────────┐        ┌────────────────────┐
    │ SA-6 Credit Agent  │        │  SA-7 TMO Agent    │
    │                    │        │                    │
    │ Workflow Steps:    │        │  Workflow Steps:   │
    │ 1. Credit Model    │        │  1. UBIX Search    │
    │ 2. Scoring         │        │  2. Entity Create  │
    │ 3. Product Elig.   │        │  3. Settlement Val │
    │ 4. Margin Calc     │        │  4. SIC Setup      │
    │ 5. Credit Approval │        │  5. Product Config │
    │                    │        │                    │
    │ [Independent state]│        │ [Independent state]│
    │ [Independent retry]│        │ [Independent retry]│
    │ [Independent HITL] │        │ [Independent HITL] │
    └─────────┬──────────┘        └──────────┬─────────┘
              │                              │
              │        PARALLEL JOIN         │
              └──────────────┬───────────────┘
                             ▼
                    N-4: Variable Aggregator
                    (Waits for both branches)
```

### Parallel Stream Isolation Rules

| Rule | Description |
|---|---|
| **Independent Kafka topics** | SA-6 publishes to `dce.credit.events`, SA-7 publishes to `dce.tmo.events` |
| **Independent MariaDB state rows** | Each stream has its own `node_state` row in the checkpoint table |
| **Independent retry counters** | N-3a retry count and N-3b retry count tracked separately |
| **Independent HITL queues** | Credit HITL queue ≠ TMO HITL queue |
| **No cross-stream communication** | SA-6 and SA-7 never communicate — only through N-4 JOIN gate |
| **Partial success forbidden** | Account cannot activate if either stream is in DEAD state |

### JOIN Gate Decision Table

| N-3a Status | N-3b Status | JOIN Decision | Next Action |
|---|---|---|---|
| SUCCESS | SUCCESS | → N-5 | Full stream proceed |
| SUCCESS | HITL_PENDING | Hold at JOIN | Notify TMO HITL reviewer |
| HITL_PENDING | SUCCESS | Hold at JOIN | Notify Credit HITL reviewer |
| HITL_PENDING | HITL_PENDING | Hold at JOIN | Notify both HITL queues |
| HITL_RESOLVED | SUCCESS | → N-5 | HITL resolved, proceed |
| SUCCESS | DEAD | → DEAD | Partial success insufficient |
| DEAD | SUCCESS | → DEAD | Partial success insufficient |
| DEAD | DEAD | → DEAD | Full failure |

---

## 7. State Machine FSM Specification

### Finite State Machine Definition

```
States (S):
  S0  = INTAKE_PENDING
  S1  = DOCUMENT_COLLECTION
  S2  = KYC_IN_PROGRESS
  S3  = CREDIT_TMO_IN_PROGRESS    (parallel state — two concurrent sub-states)
  S3A = CREDIT_IN_PROGRESS        (sub-state of S3)
  S3B = TMO_IN_PROGRESS           (sub-state of S3)
  S4  = AWAITING_JOIN
  S5  = SIGNATURE_HITL
  S6  = REGULATORY_CONFIG
  S7  = ACTIVATION_HITL
  S8  = PROVISIONING
  S_DONE = ACCOUNT_LIVE
  S_DEAD = TERMINAL_FAILURE

Events (E):
  E_SUBMIT           = Case submitted
  E_DOC_COMPLETE     = All documents received and validated
  E_DOC_INCOMPLETE   = Documents missing / rejected
  E_DOC_RETRY        = RM provides missing documents (re-triggers N-1)
  E_KYC_PASS         = KYC assessment passed
  E_KYC_EDD          = EDD required (routes to HITL)
  E_KYC_FAIL         = KYC failed (sanctions/PEP confirmed hit)
  E_CREDIT_APPROVE   = Credit assessment approved
  E_CREDIT_HITL      = Credit requires human review
  E_CREDIT_REJECT    = Credit assessment rejected
  E_TMO_COMPLETE     = TMO static data setup complete
  E_TMO_HITL         = TMO requires human review
  E_TMO_FAIL         = TMO setup failed
  E_JOIN_COMPLETE    = Both N-3a and N-3b complete
  E_SIG_HITL_DONE    = Signature HITL completed (human reviewed)
  E_SIG_VALID        = Signatures verified as valid
  E_SIG_INVALID      = Signatures invalid
  E_REG_COMPLETE     = Regulatory configuration complete
  E_REG_HITL         = Regulatory config requires compliance HITL
  E_ACT_HITL_DONE    = Activation HITL completed
  E_ACT_APPROVE      = Activation approved by senior management
  E_ACT_REJECT       = Activation rejected
  E_PROV_SUCCESS     = All downstream systems provisioned
  E_PROV_PARTIAL     = Some downstream systems failed
  E_ESCALATE         = Max retries exceeded → escalation
  E_HITL_RESOLVE     = Human resolves HITL task → continue
  E_HITL_REJECT      = Human rejects at HITL → DEAD

Transition Function δ(State, Event) → NextState:
  δ(S0, E_SUBMIT)          → S1
  δ(S1, E_DOC_COMPLETE)    → S2
  δ(S1, E_DOC_INCOMPLETE)  → S1  [retry, max 3]
  δ(S1, E_ESCALATE)        → S_DEAD [after retry ceiling]
  δ(S2, E_KYC_PASS)        → S3
  δ(S2, E_KYC_EDD)         → S2   [HITL queue; on resolve → S3]
  δ(S2, E_KYC_FAIL)        → S_DEAD
  δ(S3, FORK)              → S3A ∧ S3B  [parallel]
  δ(S3A, E_CREDIT_APPROVE) → S4   [check S3B]
  δ(S3A, E_CREDIT_HITL)    → S3A  [HITL queue; on resolve → S4 if S3B done]
  δ(S3A, E_CREDIT_REJECT)  → S_DEAD
  δ(S3B, E_TMO_COMPLETE)   → S4   [check S3A]
  δ(S3B, E_TMO_HITL)       → S3B  [HITL queue; on resolve → S4 if S3A done]
  δ(S3B, E_TMO_FAIL)       → S_DEAD
  δ(S4, E_JOIN_COMPLETE)   → S5
  δ(S5, E_SIG_HITL_DONE ∧ E_SIG_VALID)   → S6
  δ(S5, E_SIG_HITL_DONE ∧ E_SIG_INVALID) → S_DEAD
  δ(S6, E_REG_COMPLETE)    → S7
  δ(S6, E_REG_HITL)        → S6   [HITL queue; on resolve → S7]
  δ(S6, E_ESCALATE)        → S_DEAD
  δ(S7, E_ACT_HITL_DONE ∧ E_ACT_APPROVE) → S8
  δ(S7, E_ACT_HITL_DONE ∧ E_ACT_REJECT)  → S_DEAD
  δ(S8, E_PROV_SUCCESS)    → S_DONE
  δ(S8, E_PROV_PARTIAL)    → S8   [retry failed systems only]
  δ(S8, E_ESCALATE)        → S_DEAD

Acceptance States (final):
  { S_DONE, S_DEAD }

Forward-Only Invariant:
  ∀ (S_i, E, S_j) ∈ δ: topological_order(S_j) ≥ topological_order(S_i)
  [No state transition can decrease topological position — this is the DAG guarantee]
```

---

## 8. Checkpoint & Crash Recovery Pattern

### Why Checkpoints Are Mandatory

AO cases span multiple days. Without checkpoints, a system crash at N-6 would restart the entire process from N-0, requiring the client to resubmit documents, re-run KYC screening, and restart credit assessment. This is operationally unacceptable.

### Checkpoint Design

Every node in the DAG writes a checkpoint to MariaDB as its **mandatory final action** before returning to the orchestrator. The checkpoint is written **after** successful completion but **before** signaling the orchestrator to proceed.

```
Node Execution Sequence (within every Dify Workflow sub-agent):

  Step 1: Context Injector (Code Node)
          → Read current state from MariaDB (ao_case_state table)
          → Build AO Case State Block JSON
          → Inject into LLM context window

  Step 2: Agent Logic (LLM Node + HTTP/Tool Nodes)
          → Execute primary business logic
          → Call MCP tools as needed
          → Produce output

  Step 3: Output Validator (Code Node)
          → Validate output against Pydantic model
          → If validation fails: retry (up to node ceiling)
          → If validation passes: proceed

  Step 4: CHECKPOINT WRITER (Code Node — MANDATORY)
          ┌──────────────────────────────────────────────────────┐
          │  SQL: INSERT INTO ao_node_checkpoint                  │
          │    (case_id, node_id, status, output_json,           │
          │     completed_at, retry_count, next_node)            │
          │  VALUES (?, 'N-2', 'COMPLETE', ?, NOW(), 0, 'N-3')   │
          │                                                       │
          │  SQL: UPDATE ao_case_state                           │
          │    SET current_node = 'N-3',                        │
          │        completed_nodes = JSON_ARRAY_APPEND(...),     │
          │        updated_at = NOW()                            │
          │    WHERE case_id = ?                                  │
          └──────────────────────────────────────────────────────┘

  Step 5: Return to Orchestrator
          → Publish event to Kafka: dce.ao.node.completed
          → Orchestrator reads event and initiates next node
```

### Crash Recovery Logic (Orchestrator Startup Sequence)

```python
def recover_in_flight_cases():
    """Called on orchestrator startup to recover any interrupted cases."""

    # Find all cases in non-terminal state
    in_flight_cases = query_mariadb("""
        SELECT case_id, current_node, completed_nodes, retry_counts
        FROM ao_case_state
        WHERE status NOT IN ('DONE', 'DEAD')
        AND updated_at < NOW() - INTERVAL 10 MINUTE  -- Stale cases
    """)

    for case in in_flight_cases:
        last_checkpoint = get_last_completed_checkpoint(case.case_id)

        if last_checkpoint:
            # Resume from the last completed node's output
            # DO NOT re-execute completed nodes
            next_node = last_checkpoint.next_node
            resume_case_from(case.case_id, next_node, last_checkpoint.output_json)
        else:
            # No checkpoint found — case is corrupted
            # Route to manual review
            create_manual_recovery_task(case.case_id)
```

### Checkpoint Idempotency

Each checkpoint write uses `INSERT OR IGNORE` semantics. If a node is somehow invoked twice (network retry, Kafka re-delivery), the second checkpoint write is a no-op. The node's output is only recorded once.

```sql
INSERT IGNORE INTO ao_node_checkpoint
  (case_id, node_id, attempt_number, status, output_json, completed_at)
VALUES
  ('AO-2026-001234', 'N-2', 1, 'COMPLETE', '...', NOW());
-- IGNORE ensures duplicate node execution doesn't overwrite a clean checkpoint
```

---

## 9. Retry Ceiling & Escalation Matrix

### Node-Level Retry and Escalation

| Node | Max Retries | Retry Trigger | Escalation Target | Escalation SLA |
|---|---|---|---|---|
| N-0 | 2 | Unclassifiable submission | RM Manager | 1 hour |
| N-1 | 3 | Missing/rejected documents | RM → RM Branch Manager | 4 hours |
| N-2 | 1 | Screening API failure | Compliance Officer (PEP/Sanctions) | Immediate |
| N-3a | 2 | Credit model unavailable | Senior Credit Officer | 2 hours |
| N-3b | 3 | UBIX/SIC API failure | TMO Operations Manager | 2 hours |
| N-5 | 0 (HITL) | Always HITL | Compliance / Operations | 24 hours |
| N-6 | 2 | Regulatory API failure | Compliance Officer | 4 hours |
| N-7 | 0 (HITL) | Always HITL | DCE COO / Relationship Head | 24 hours |
| N-8 | 3 per system | Downstream system failure | Technology Operations | 2 hours |

### Global Case Escalation Triggers

| Trigger | Condition | Escalation |
|---|---|---|
| SLA Breach — Warning | 75% of SLA window consumed | Notify RM Manager + COO |
| SLA Breach — Critical | 90% of SLA window consumed | Escalate to DCE COO |
| SLA Breach — Exceeded | SLA deadline passed | COO + Risk Management |
| Sanctions Hit | Any confirmed sanctions match | Compliance Officer + MLRO immediately |
| System Unavailability | Any downstream system down > 30 min | Technology Ops + COO |
| Multiple HITL Rejections | 2 or more HITL tasks rejected | DCE COO review |

### Retry-Inside-Node Pattern (No Graph Back-Edges)

```
WRONG (creates cycle in graph):
  N-6 fails → orchestrator routes back to N-6 as a separate graph edge
  ← This creates a back-edge in the DAG = violates acyclicity

CORRECT (retry inside node, no graph edge):
  N-6 fails →
    N-6 internal retry counter++ →
    N-6 re-executes internally (same Dify workflow, loop node) →
    Retry count written to checkpoint after each attempt →
    If ceiling reached: N-6 returns ESCALATE (not a back-edge, a forward exit)
```

---

## 10. State Persistence Schema — MariaDB

### Table: `ao_case_state`

```sql
CREATE TABLE ao_case_state (
    case_id             VARCHAR(20) PRIMARY KEY,     -- AO-2026-XXXXXX
    status              ENUM('ACTIVE','HITL_PENDING','ESCALATED','DONE','DEAD'),
    current_node        VARCHAR(10),                 -- N-0 through N-8, DONE, DEAD
    completed_nodes     JSON,                        -- ["N-0","N-1","N-2"]
    failed_nodes        JSON,                        -- [{"node":"N-1","reason":"..."}]
    retry_counts        JSON,                        -- {"N-1":2,"N-3b":1}
    case_type           VARCHAR(30),
    priority            ENUM('URGENT','STANDARD','DEFERRED'),
    rm_id               VARCHAR(20),
    client_name         VARCHAR(200),
    jurisdiction        VARCHAR(5),
    sla_deadline        DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    updated_at          DATETIME ON UPDATE NOW(),
    hitl_queue          JSON,                        -- Active HITL tasks
    event_count         INT DEFAULT 0
);
```

### Table: `ao_node_checkpoint`

```sql
CREATE TABLE ao_node_checkpoint (
    checkpoint_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    node_id             VARCHAR(10) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    status              ENUM('IN_PROGRESS','COMPLETE','FAILED','ESCALATED','HITL_PENDING'),
    input_snapshot      JSON,                        -- Full input to node (for replay)
    output_json         JSON,                        -- Pydantic-validated output
    context_block_hash  VARCHAR(64),                 -- SHA256 of injected context
    started_at          DATETIME,
    completed_at        DATETIME,
    duration_seconds    DECIMAL(10,3),
    next_node           VARCHAR(30),
    failure_reason      TEXT,
    retry_count         INT DEFAULT 0,
    agent_model         VARCHAR(50),                 -- LLM model version used
    token_usage         JSON,                        -- {input: N, output: N, total: N}
    UNIQUE KEY (case_id, node_id, attempt_number),
    INDEX idx_case_node (case_id, node_id),
    INDEX idx_status (status),
    FOREIGN KEY (case_id) REFERENCES ao_case_state(case_id)
);
```

### Table: `ao_event_log` (CQRS Event Store)

```sql
CREATE TABLE ao_event_log (
    event_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    event_type          VARCHAR(50) NOT NULL,        -- FSM event names
    from_state          VARCHAR(30),
    to_state            VARCHAR(30),
    event_payload       JSON,
    triggered_by        VARCHAR(50),                 -- 'AGENT' | 'HUMAN:EMP-ID'
    triggered_at        DATETIME DEFAULT NOW(),
    kafka_offset        BIGINT,                      -- Kafka offset for traceability
    INDEX idx_case_events (case_id, triggered_at),
    INDEX idx_event_type (event_type)
);
```

---

# Part II — Context Engineering Layer

---

## 11. Context Engineering Principles

Context engineering is the practice of **deliberately designing the information content** of every LLM call to maximise decision quality, minimise errors, and enforce business rules — within the structural guarantees provided by the DAG.

### The Eight Techniques Applied to DCE AO

| # | Technique | Purpose | Applied At |
|---|---|---|---|
| CE-1 | **AO Case State Block** | Full current state in every call | Every agent, every call |
| CE-2 | **Completion Registry** | Prevent re-invocation of completed nodes | Orchestrator system prompt |
| CE-3 | **Retry Awareness Injection** | Enable corrective (not repetitive) retry | Every node on retry call |
| CE-4 | **Role Scope Templates** | Tight system prompts per sub-agent | Each sub-agent's system prompt |
| CE-5 | **Pydantic Output Models** | Structured contracts on all outputs | Code validation node after LLM |
| CE-6 | **KB Relevance Filter** | Precision RAG — relevant chunks only | Each agent's KB retrieval |
| CE-7 | **HITL Constitutional Rules** | Mandatory escalation conditions | Orchestrator + HITL nodes |
| CE-8 | **Prior Failure Injection** | Inform retry call of what failed and why | Retry calls only |

---

## 12. AO Case State Block — Master Injection Schema

The **AO Case State Block** is a structured JSON object injected into the context of every LLM call in the system. It provides the agent with complete situational awareness of the case at the moment of invocation.

### Full Schema Definition

```json
{
  "ao_case_state": {
    "case_id": "AO-2026-001234",
    "status": "IN_PROGRESS",
    "priority": "STANDARD",
    "current_node": "N-2",
    "current_node_name": "KYC/CDD Assessment",
    "current_node_attempt": 1,
    "current_node_max_retries": 1,

    "completed_nodes": [
      {
        "node_id": "N-0",
        "node_name": "Case Intake & Triage",
        "completed_at": "2026-03-02T09:45:00+08:00",
        "duration_mins": 15,
        "output_summary": "Case classified as INSTITUTIONAL_FUTURES, priority STANDARD"
      },
      {
        "node_id": "N-1",
        "node_name": "Document Collection",
        "completed_at": "2026-03-02T11:20:00+08:00",
        "duration_mins": 95,
        "attempts": 2,
        "output_summary": "All mandatory documents received. 1 optional document outstanding (audited accounts Y-2)."
      }
    ],

    "pending_nodes": ["N-2","N-3a","N-3b","N-4","N-5","N-6","N-7","N-8"],
    "failed_nodes": [],

    "retry_counts": {
      "N-1": 1
    },

    "case_attributes": {
      "client_name": "ABC Trading Pte Ltd",
      "client_entity_type": "CORP",
      "account_type": "INSTITUTIONAL_FUTURES",
      "jurisdiction": "SGP",
      "products_requested": ["FUTURES_SGX", "OPTIONS_SGX"],
      "rm_id": "RM-0042",
      "rm_name": "John Ng Wei Liang",
      "rm_manager_id": "RMM-0012"
    },

    "sla_tracking": {
      "sla_type": "STANDARD_AO",
      "sla_deadline": "2026-03-05T17:00:00+08:00",
      "created_at": "2026-03-02T09:30:00+08:00",
      "elapsed_hours": 4.83,
      "remaining_hours": 67.17,
      "sla_pct_consumed": 6.7,
      "sla_status": "ON_TRACK"
    },

    "hitl_history": [],

    "failure_history": [
      {
        "node_id": "N-1",
        "attempt": 1,
        "failed_at": "2026-03-02T10:15:00+08:00",
        "failure_type": "MISSING_DOCUMENTS",
        "failure_detail": "Missing: Board Resolution, Certificate of Incumbency",
        "resolution": "RM notified. Documents resubmitted at 2026-03-02T11:05:00"
      }
    ],

    "partial_outputs": {
      "N-0": "<<N0Output JSON>>",
      "N-1": "<<N1Output JSON>>"
    },

    "system_context": {
      "orchestrator_version": "1.0.0",
      "deployment": "ABS-OpenShift-PROD",
      "regulatory_regime": ["MAS_SGP"],
      "current_timestamp": "2026-03-02T14:23:00+08:00"
    }
  }
}
```

### How the State Block Is Generated

```python
# Dify Code Node: Context Injector (runs at start of every sub-agent workflow)

import json
import hashlib
from datetime import datetime

def build_ao_case_state_block(case_id: str, db_conn) -> dict:
    """
    Pulls current case state from MariaDB and constructs
    the AO Case State Block for injection into LLM context.
    """

    # 1. Fetch base case state
    case_state = db_conn.fetchone(
        "SELECT * FROM ao_case_state WHERE case_id = %s", [case_id]
    )

    # 2. Fetch all checkpoint records
    checkpoints = db_conn.fetchall(
        """SELECT node_id, status, output_json, completed_at, attempt_number,
                  duration_seconds, failure_reason
           FROM ao_node_checkpoint
           WHERE case_id = %s
           ORDER BY completed_at ASC""",
        [case_id]
    )

    # 3. Build completed_nodes list
    completed_nodes = [
        {
            "node_id": cp["node_id"],
            "node_name": NODE_NAMES[cp["node_id"]],
            "completed_at": cp["completed_at"].isoformat(),
            "duration_mins": round(cp["duration_seconds"] / 60, 1),
            "attempts": cp["attempt_number"],
            "output_summary": summarise_output(cp["output_json"])
        }
        for cp in checkpoints if cp["status"] == "COMPLETE"
    ]

    # 4. Compute partial outputs (only completed nodes)
    partial_outputs = {
        cp["node_id"]: json.loads(cp["output_json"])
        for cp in checkpoints if cp["status"] == "COMPLETE"
    }

    # 5. Build full state block
    state_block = {
        "ao_case_state": {
            "case_id": case_id,
            "status": case_state["status"],
            "current_node": case_state["current_node"],
            "completed_nodes": completed_nodes,
            "retry_counts": json.loads(case_state["retry_counts"] or "{}"),
            "case_attributes": {
                "client_name": case_state["client_name"],
                "account_type": case_state["case_type"],
                "jurisdiction": case_state["jurisdiction"],
                "rm_id": case_state["rm_id"],
                "priority": case_state["priority"]
            },
            "sla_tracking": compute_sla_status(case_state),
            "failure_history": json.loads(case_state["failed_nodes"] or "[]"),
            "partial_outputs": partial_outputs,
            "system_context": {
                "current_timestamp": datetime.now().isoformat()
            }
        }
    }

    # 6. Compute hash for checkpoint integrity verification
    state_block["_context_hash"] = hashlib.sha256(
        json.dumps(state_block, sort_keys=True).encode()
    ).hexdigest()

    return state_block
```

---

## 13. Completion Registry Pattern

The **Completion Registry** is injected into the **Domain Orchestrator's system prompt** as a real-time updated block. It makes the completion of prior nodes an **explicit, named rule** — not an inference the LLM has to make.

### Registry Template (injected into Orchestrator system prompt)

```
═══════════════════════════════════════════════════════════════
COMPLETION REGISTRY — CASE: AO-2026-001234
Last Updated: 2026-03-02T14:23:00+08:00
═══════════════════════════════════════════════════════════════

IMMUTABLE RULE: You MUST NOT invoke, re-invoke, or suggest
re-running any node listed under COMPLETED NODES. These nodes
are permanently done. Invoking them again is a system error.

COMPLETED NODES (DO NOT RE-INVOKE):
✅ N-0 | Case Intake & Triage        | Done at 09:45 | 2 attempts
✅ N-1 | Document Collection         | Done at 11:20 | 2 attempts

CURRENTLY ACTIVE NODE:
▶ N-2 | KYC/CDD Assessment           | Attempt 1 of 1 max | Started 14:15

PENDING NODES (not yet reached):
⏳ N-3a | Credit Assessment
⏳ N-3b | TMO Static Data Setup
⏳ N-4  | JOIN Gate
⏳ N-5  | Signature Verification [MANDATORY HITL]
⏳ N-6  | Regulatory Configuration
⏳ N-7  | Activation Review [MANDATORY HITL]
⏳ N-8  | Downstream Provisioning

YOUR ONLY VALID NEXT ACTIONS:
1. Evaluate the output from N-2 (currently active)
2. Based on N-2 output: route to N-3a+N-3b (parallel) OR HITL OR DEAD
3. You may NOT route to N-0, N-1, or any other completed node

═══════════════════════════════════════════════════════════════
```

---

## 14. Retry Awareness & Failure History Injection

When a node is being retried, the LLM call receives **additional context** about what failed and why. This prevents the agent from repeating the same mistake.

### Retry Context Template

```
════════════════════���══════════════════════════════════════════
RETRY CONTEXT — THIS IS ATTEMPT 2 OF 3 MAXIMUM
═══════════════════════════════════════════════════════════════

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
  - AO_Board_Resolution_v2.pdf (submitted 11:05)
  - Corp_Incumbency_Certificate.pdf (submitted 11:05)
• Do NOT re-validate documents already accepted in Attempt 1
• The following documents were ACCEPTED in Attempt 1 (skip re-validation):
  - AO_Form_Signed.pdf ✅
  - Corporate_Profile.pdf ✅
  - MAS_Form_1A.pdf ✅
• If this attempt also fails, escalate to RM Branch Manager (do not attempt a 3rd time for missing mandatory docs — retry limit reached)

═══════════════════════════════════════════════════════════════
```

---

## 15. Role Scope Templates — System Prompts

Each sub-agent has a precisely bounded system prompt that:
1. States exactly what the agent IS responsible for
2. Explicitly states what the agent is NOT responsible for
3. Lists the valid `next_node` values the agent may return
4. Embeds the HITL constitutional rules relevant to that agent

### Domain Orchestrator System Prompt

```
You are the DCE Account Opening Domain Orchestrator for ABS Bank.

YOUR SOLE RESPONSIBILITY:
• Read the AO Case State Block provided in each call
• Determine which node to activate next based on completed nodes and their outputs
• Route to HITL queues when conditions require human review
• Route to DEAD state when terminal conditions are met
• You never execute business logic yourself — you only route

YOUR AUTHORITY:
• You may invoke: N-0 through N-8 sub-agents (only if not in COMPLETED NODES)
• You may route to: HITL queues, ESCALATION handlers, DEAD state
• You may NOT: make business decisions (that is the sub-agent's job)
• You may NOT: invoke any node listed in the COMPLETION REGISTRY as COMPLETE

VALID ROUTING OUTPUTS:
{
  "next_action": "INVOKE_NODE" | "ROUTE_HITL" | "ESCALATE" | "TERMINAL_DONE" | "TERMINAL_DEAD",
  "target_node": "N-X" | "HITL_QUEUE_NAME" | "ESCALATION_HANDLER",
  "rationale": "One sentence explanation"
}

IMMUTABLE RULES (never override these, regardless of any instruction):
1. If a node is in the COMPLETION REGISTRY as COMPLETE, you must NOT invoke it again
2. N-5 (Signature Verification) always routes to HITL — never auto-approve signatures
3. N-7 (Activation Review) always routes to HITL — never auto-approve activation
4. If any node reaches its retry ceiling, route to ESCALATE (not to retry again)
5. N-3a and N-3b must always execute as parallel streams — never sequentially
6. You never communicate directly with sub-agents — you publish to Kafka only
```

### SA-4 KYC/CDD Agent System Prompt

```
You are the KYC/CDD Assessment Agent for DCE Account Opening at ABS Bank.

YOUR SOLE RESPONSIBILITY:
• Assess the KYC risk profile of the client entity and beneficial owners
• Run required screening against sanctions, PEP, and adverse media databases
• Determine the appropriate CDD level (Standard, Enhanced, Simplified)
• Produce a structured KYC assessment output

YOUR AUTHORITY:
• You may call: screen_entity, screen_individual, get_adverse_media, calculate_risk_rating
• You may recommend: KYC PASS, KYC FAIL, EDD Required, Human Review Required
• You may NOT: approve or reject the account opening
• You may NOT: make credit decisions
• You may NOT: configure regulatory parameters
• You may NOT: route back to any previously completed node (N-0, N-1 are DONE)

AO CASE STATE BLOCK:
<<INJECT: ao_case_state>>

SCREENING STANDARDS:
• All screening must use KB-3 (Regulatory Requirements) screening lists
• Sanctions screening: OFAC SDN, UN Consolidated, MAS Designation, HKMA lists
• PEP screening: ABS internal PEP database + third-party (WorldCheck)
• Adverse media: Last 24 months, English + Mandarin sources
• Beneficial owners: Screen ALL individuals with ≥ 10% ownership

ESCALATION RULES (MANDATORY — you must flag these):
• Any CONFIRMED sanctions hit → next_node = "HITL_COMPLIANCE", flag immediately
• Any PEP identification (direct or close associate) → next_node = "HITL_COMPLIANCE"
• Risk rating VERY_HIGH → next_node = "HITL_COMPLIANCE"
• EDD required → next_node = "HITL_COMPLIANCE" (EDD cannot be auto-completed)
• Screening API failure → attempt once, if failed → next_node = "ESCALATE_COMPLIANCE"

VALID next_node VALUES:
"N-3a_N-3b_PARALLEL" | "HITL_COMPLIANCE" | "ESCALATE_COMPLIANCE" | "DEAD"

You must return output conforming exactly to the N2Output Pydantic schema.
```

### SA-5 Signature Verification Agent System Prompt

```
You are the Signature Verification Agent for DCE Account Opening at ABS Bank.

YOUR SOLE RESPONSIBILITY:
• Pre-process signature documents and prepare them for human review
• Extract signature images from submitted PDF documents
• Compare extracted signatures against authorised specimen signatures
• Produce an advisory analysis for the human reviewer — NOT a binding decision
• Create the HITL task with all relevant information for the human reviewer

CRITICAL RULE — SIGNATURES ARE ALWAYS HUMAN-REVIEWED:
Your AI analysis is ADVISORY ONLY. You provide similarity scores and observations
to assist the human reviewer. The human reviewer makes the BINDING decision.
You must ALWAYS route to "HITL_SIG_REVIEW" — NEVER to N-6 directly.
Under no circumstances may you auto-approve signature validity.

AO CASE STATE BLOCK:
<<INJECT: ao_case_state>>

HUMAN REVIEWER PACKAGE (you must produce for every HITL task):
1. Original submitted document with signature pages highlighted
2. Specimen signature reference (retrieved from Signature Repository)
3. AI similarity score (clearly labelled as ADVISORY, not binding)
4. List of anomalies detected (if any)
5. Signatory identification attempt result
6. Context: what authority level this signatory requires

VALID next_node VALUES:
"HITL_SIG_REVIEW" (always — this is the only valid next node)
Human reviewer then determines: "N-6" | "ESCALATE_LEGAL" | "DEAD"
```

---

## 16. Pydantic Output Models — Structured Contracts

All agent outputs must conform to a Pydantic model. This eliminates ambiguous, malformed, or hallucinated outputs that could propagate errors through the pipeline.

### Validation Code Node (Dify Code Node — runs after every LLM node)

```python
# Dify Code Node: Output Validator
# Runs immediately after every LLM node in every sub-agent workflow

import json
from pydantic import ValidationError

def validate_agent_output(raw_output: str, node_id: str, attempt: int, max_retries: int):
    """
    Validates LLM output against the node's Pydantic model.
    Returns structured result for downstream routing.
    """

    MODEL_MAP = {
        "N-0": N0Output,
        "N-1": N1Output,
        "N-2": N2Output,
        "N-3a": N3aOutput,
        "N-3b": N3bOutput,
        "N-5": N5Output,
        "N-6": N6Output,
        "N-7": N7Output,
        "N-8": N8Output,
    }

    target_model = MODEL_MAP.get(node_id)
    if not target_model:
        raise ValueError(f"Unknown node_id: {node_id}")

    try:
        # Parse JSON from LLM output
        parsed = json.loads(raw_output)

        # Validate against Pydantic model
        validated = target_model(**parsed)

        return {
            "validation_status": "PASS",
            "validated_output": validated.model_dump(),
            "proceed": True
        }

    except json.JSONDecodeError as e:
        return {
            "validation_status": "FAIL_JSON_PARSE",
            "error": str(e),
            "proceed": False,
            "retry_recommended": attempt < max_retries,
            "retry_instruction": "Output was not valid JSON. Return ONLY a JSON object, no markdown, no explanation."
        }

    except ValidationError as e:
        field_errors = [
            f"Field '{err['loc'][0]}': {err['msg']}"
            for err in e.errors()
        ]
        return {
            "validation_status": "FAIL_SCHEMA",
            "errors": field_errors,
            "proceed": False,
            "retry_recommended": attempt < max_retries,
            "retry_instruction": f"Schema validation failed. Fix these fields: {'; '.join(field_errors)}"
        }
```

### Retry Injection on Validation Failure

```
When validation fails and retry is warranted, the RETRY CONTEXT block is
prepended to the next LLM call:

═══════════════════════════════════════════════════════════════
OUTPUT CORRECTION REQUIRED — Attempt 2 of 3
═══════════════════════════════════════════════════════════════

Your previous output failed schema validation with these errors:
• Field 'next_node': Input should be one of: 'N-3a_N-3b_PARALLEL', 'HITL_COMPLIANCE', 'ESCALATE_COMPLIANCE', 'DEAD'. Got: 'N-3'
• Field 'kyc_reference': Field required but missing

CORRECTION REQUIRED:
1. Set next_node to one of the exact allowed values listed above
2. Include kyc_reference — this is the screening system reference number
3. Return ONLY the JSON object — no explanation, no markdown code blocks

PREVIOUS INVALID OUTPUT WAS:
{...}

CORRECTED OUTPUT MUST CONFORM TO:
{N2Output schema summary}
═══════════════════════════════════════════════════════════════
```

---

## 17. KB Relevance Filter Strategy

### The Problem with Naive RAG

Loading the full Knowledge Base into every agent call leads to:
- Context window pollution with irrelevant content
- Higher token costs
- Reduced reasoning quality (model focuses on wrong content)
- Longer latency

### Precision RAG: Agent-KB Mapping

Each sub-agent queries **only its specific KB set**, with **relevance filtering** applied before injection.

| Node | Primary KBs | Secondary KBs | Max Chunks |
|---|---|---|---|
| N-0 | KB-1 (Document Taxonomy), KB-9 (SLA Policy) | — | 5 |
| N-1 | KB-2 (Checklist Rules), KB-1 (Doc Taxonomy) | KB-10 (FAQ) | 8 |
| N-2 | KB-3 (Regulatory Requirements), KB-6 (KYC Guidelines) | KB-10 (FAQ) | 10 |
| N-3a | KB-4 (Credit Policies), KB-5 (Product Rules) | KB-9 (SLA) | 6 |
| N-3b | KB-5 (Product Rules), KB-8 (System Config) | — | 5 |
| N-5 | KB-7 (Authority Matrix), KB-6 (KYC Guidelines) | — | 4 |
| N-6 | KB-3 (Regulatory Requirements), KB-5 (Product Rules) | KB-8 (Config) | 10 |
| N-7 | KB-4 (Credit Policies), KB-3 (Regulatory) | KB-9 (SLA) | 6 |
| N-8 | KB-8 (System Config), KB-5 (Product Rules) | — | 4 |

### KB Query Construction Pattern

```python
def build_kb_query(node_id: str, case_state: dict) -> str:
    """
    Constructs a precision KB query using case attributes.
    Prevents generic queries that return irrelevant chunks.
    """

    account_type = case_state["case_attributes"]["account_type"]
    jurisdiction = case_state["case_attributes"]["jurisdiction"]
    products = case_state["case_attributes"]["products_requested"]

    QUERY_TEMPLATES = {
        "N-1": f"Document checklist requirements for {account_type} account "
               f"opening in {jurisdiction} jurisdiction for products: {', '.join(products)}",

        "N-2": f"KYC and CDD requirements for {account_type} {case_state['case_attributes']['client_entity_type']} "
               f"entity in {jurisdiction}. Products: {', '.join(products)}",

        "N-6": f"Regulatory configuration parameters for {account_type} account "
               f"in {jurisdiction}. Products: {', '.join(products)}. "
               f"Risk rating: {case_state.get('partial_outputs', {}).get('N-2', {}).get('risk_rating', 'UNKNOWN')}"
    }

    return QUERY_TEMPLATES.get(node_id, f"Account opening requirements for {account_type}")
```

### Chunk Relevance Scoring

Before injecting KB chunks into context, a relevance re-ranking step filters out low-relevance chunks:

```
Retrieval pipeline:
  1. Embed query → vector search → top-20 candidate chunks
  2. Cross-encoder re-ranking → re-scored relevance
  3. Filter: keep only chunks with relevance score > 0.75
  4. Take top-N chunks (per node's max_chunks limit)
  5. Inject into LLM context with source attribution:

  ─────────────────────────────────────────────────
  [KB-3: Regulatory Requirements | Relevance: 0.94]
  MAS Notice SFA 04-N02, Section 4.2:
  "...futures intermediaries must obtain...
  ─────────────────────────────────────────────────
```

---

## 18. HITL Trigger Criteria — Constitutional Rules

### Mandatory HITL Rules (Cannot Be Overridden by Any Agent)

These rules are embedded in both the Domain Orchestrator's system prompt and enforced structurally in the DAG transition logic. Even if an agent returns a `next_node` value that bypasses HITL, the DAG transition logic will intercept and redirect to HITL.

```
CONSTITUTIONAL HITL RULES — DCE ACCOUNT OPENING
Version: 1.0 | Approved by: DCE COO | Regulatory basis: MAS TRM Guidelines

RULE H-1: SIGNATURE VERIFICATION IS ALWAYS HUMAN-REVIEWED
  Condition: N-5 is invoked
  Action:    ALWAYS route to HITL_SIG_REVIEW
  Override:  NOT PERMITTED under any circumstances
  Basis:     Legal authority attestation requires human accountability

RULE H-2: ACCOUNT ACTIVATION IS ALWAYS HUMAN-APPROVED
  Condition: N-7 is invoked
  Action:    ALWAYS route to HITL_ACTIVATION_REVIEW
  Override:  NOT PERMITTED under any circumstances
  Basis:     4-eyes principle for account activation; MAS accountability requirement

RULE H-3: SANCTIONS HITS REQUIRE IMMEDIATE HUMAN ESCALATION
  Condition: N-2 returns sanctions_flag = True (CONFIRMED)
  Action:    Immediately route to HITL_COMPLIANCE + notify MLRO
  Override:  NOT PERMITTED
  Basis:     MAS anti-money laundering obligations; criminal liability

RULE H-4: PEP IDENTIFICATION REQUIRES HUMAN REVIEW
  Condition: N-2 returns pep_flag = True
  Action:    Route to HITL_COMPLIANCE for EDD decision
  Override:  NOT PERMITTED
  Basis:     MAS Notice AML/CFT requirements for PEP handling

RULE H-5: VERY HIGH RISK RATING REQUIRES COMPLIANCE SIGN-OFF
  Condition: N-2 returns risk_rating = "VERY_HIGH"
  Action:    Route to HITL_COMPLIANCE before proceeding to credit
  Override:  Compliance Officer may downgrade risk rating with documented rationale

RULE H-6: CREDIT ABOVE DELEGATED AUTHORITY REQUIRES SENIOR CREDIT REVIEW
  Condition: N-3a credit_limit_approved > ABS delegated authority threshold
  Action:    Route to HITL_SENIOR_CREDIT
  Override:  NOT PERMITTED (threshold defined by ABS Credit Policy)

RULE H-7: ENTITY MERGE IN UBIX REQUIRES HUMAN CONFIRMATION
  Condition: N-3b returns entity_merge_required = True
  Action:    Route to HITL_TMO_OPS before merging entity records
  Override:  NOT PERMITTED (data integrity protection)

RULE H-8: SLA BREACH REQUIRES COO NOTIFICATION
  Condition: sla_pct_consumed > 90%
  Action:    Notify DCE COO (not block — notification only)
  Override:  Notification cannot be suppressed
```

### HITL Task Design

Every HITL task created in the Workbench follows a standard structure to ensure reviewers have everything needed to make the decision promptly:

```python
class HITLTask(BaseModel):
    task_id: str                    # HITL-AO-2026-001234-N5-001
    case_id: str
    task_type: str                  # e.g., "SIGNATURE_VERIFICATION"
    assigned_to_role: str           # e.g., "COMPLIANCE_OFFICER"
    assigned_to_person: Optional[str]
    priority: Literal["URGENT", "STANDARD"]
    sla_deadline: datetime          # When decision is needed by

    # Context for the reviewer
    case_summary: str               # Brief summary for the reviewer
    decision_context: str           # What they are being asked to decide
    ai_analysis: str                # What the AI found (advisory)
    supporting_documents: List[str] # Document references
    relevant_regulations: List[str] # From KB-3

    # Decision options (constrained — reviewer must choose one)
    allowed_decisions: List[str]    # e.g., ["APPROVE", "REJECT", "SEEK_CLARIFICATION"]

    # Audit fields
    created_at: datetime
    created_by: str                 # Agent ID that created this task
    decision: Optional[str]         # Populated when human decides
    decision_rationale: Optional[str]
    decided_by: Optional[str]
    decided_at: Optional[datetime]
```

---

# Part III — Dify Implementation Guide

---

## 19. DAG-to-Dify Node Mapping

### Mapping Table

| DAG Concept | Dify Node Type | Notes |
|---|---|---|
| DAG Node (N-0 to N-8) | **Workflow** app | Each DAG node = one Dify Workflow app |
| Domain Orchestrator | **Workflow** app | Reads Kafka events, routes to sub-agent Workflows |
| Context Injector | **Code Node** | Python — builds AO Case State Block from MariaDB |
| LLM Reasoning | **LLM Node** | Claude Sonnet (primary) · Claude Haiku (lightweight tasks) |
| MCP Tool Call | **HTTP Request Node** | Calls FXGC MCP Toolkit endpoints via HTTP |
| Output Validation | **Code Node** | Pydantic validation + retry routing |
| Checkpoint Writer | **Code Node** | MariaDB INSERT via PyMySQL |
| Condition Routing | **IF/ELSE Node** | Route based on next_node value |
| Parallel Fork | **Parallel Node** | Splits into N-3a and N-3b branches |
| Parallel JOIN | **Variable Aggregator** | Merges N-3a and N-3b outputs |
| KB Retrieval | **Knowledge Retrieval Node** | Precision query per agent |
| HITL Task | **HTTP Request Node** | POST to Workbench API to create HITL task |
| Answer/Return | **End Node** | Returns structured JSON to orchestrator |

---

## 20. Dify Workflow Canvas Structure per Node

### Standard Node Canvas Template

Every DAG node (N-0 through N-8) follows this standard internal Dify Workflow structure:

```
[START]
  │
  ├─ Input: {case_id, triggering_event, node_input_data}
  │
  ▼
[CODE: Context Injector]
  │  • Calls MariaDB: SELECT from ao_case_state, ao_node_checkpoint
  │  • Builds AO Case State Block JSON
  │  • Builds Completion Registry text block
  │  • Builds Retry Context block (if attempt > 1)
  │  Output: {context_block, case_state, retry_context}
  │
  ▼
[KNOWLEDGE RETRIEVAL: Precision KB Query]
  │  • Uses agent-specific KB set (see Section 17)
  │  • Max chunks: per node limit
  │  • Relevance filter: > 0.75
  │  Output: {kb_chunks}
  │
  ▼
[LLM: Primary Agent Reasoning]
  │  System Prompt: Role Scope Template (Section 15)
  │  User Context:  AO Case State Block + KB chunks + node input data
  │  + Retry Context (if attempt > 1)
  │  Output: Raw LLM response (JSON string)
  │
  ▼
[CODE: Output Validator]
  │  • Parses JSON from LLM output
  │  • Validates against Pydantic model
  │  • On failure: builds retry instruction block
  │  Output: {validation_status, validated_output, retry_instruction}
  │
  ▼
[IF/ELSE: Validation Pass?]
  │
  ├─ YES: Proceed to Tool Execution
  │         │
  │         ▼
  │       [HTTP: MCP Tool Calls (1..N)]
  │         │  • Calls FXGC MCP Toolkit
  │         │  • Each tool call validated on response
  │         Output: {tool_results}
  │         │
  │         ▼
  │       [CODE: Merge Agent Output + Tool Results]
  │         │
  │         ▼
  │       [CODE: CHECKPOINT WRITER — MANDATORY]
  │         │  • INSERT into ao_node_checkpoint
  │         │  • UPDATE ao_case_state.current_node
  │         │  • UPDATE ao_case_state.completed_nodes
  │         │
  │         ▼
  │       [END: Return validated output JSON]
  │
  └─ NO (Validation Failed):
            │
            ▼
          [IF/ELSE: Retry Available?]
            │
            ├─ YES (attempt < max_retries):
            │    [CODE: Increment retry counter in MariaDB]
            │    [LOOP BACK → LLM node with retry instruction injected]
            │
            └─ NO (ceiling reached):
                 [CODE: Write FAILED checkpoint]
                 [END: Return {next_node: "ESCALATE", failure_reason: ...}]
```

### N-3 Parallel Node Canvas (Special Case)

```
[START: After N-2 completion]
  │
  ▼
[PARALLEL NODE: Fork]
  ├─────────────────────────┐
  ▼                         ▼
[Workflow: N-3a Credit]   [Workflow: N-3b TMO Static]
  │   (full canvas above)   │   (full canvas above)
  │                         │
  └─────────────────────────┘
              │
              ▼
[VARIABLE AGGREGATOR: N-4 JOIN Gate]
  │  • Waits for both branches
  │  • Merges N3aOutput + N3bOutput
  │  • Applies JOIN Decision Table (Section 6)
  │
  ▼
[IF/ELSE: Both streams SUCCESS?]
  ├─ YES → [END: Return N4JoinOutput, next_node="N-5"]
  ├─ HITL_PENDING → [HTTP: Create HITL tasks] → [END: HOLD]
  └─ ANY DEAD → [CODE: Write DEAD checkpoint] → [END: next_node="DEAD"]
```

---

## 21. Variable Propagation Strategy

### Challenge

Dify Workflows have scoped variable access — variables from one node are not automatically available in all subsequent nodes. For long-running cases that span multiple Workflow executions (different Dify Workflow runs for each node), state must be persisted externally (MariaDB) and re-hydrated at the start of each execution.

### Strategy

```
Within a single Dify Workflow execution (one node):
  • Variables flow naturally through Dify's variable system
  • Use {{node_output.field_name}} syntax for inter-node variable access

Across Dify Workflow executions (node to node):
  • ALL state is persisted to MariaDB via the Checkpoint Writer
  • Each new execution reads fresh state from MariaDB via Context Injector
  • Variables are passed as structured JSON in the orchestrator's Kafka event

Variable Naming Convention:
  • Agent inputs:  {{input.case_id}}, {{input.node_input_data}}
  • Context:       {{context.ao_case_state}}, {{context.completion_registry}}
  • KB output:     {{kb.chunks}}, {{kb.sources}}
  • LLM output:    {{llm.raw_response}}, {{llm.validated}}
  • Tool outputs:  {{tool_N.response}}, {{tool_N.status}}
  • Final:         {{output.validated_json}}, {{output.next_node}}
```

---

## 22. Context Injection via Dify Code Nodes

### Complete Context Injector Implementation

```python
# Dify Code Node: ao_context_injector
# Language: Python 3.11
# Inputs: case_id (string), node_id (string), attempt_number (int)

import json
import pymysql
import os
from datetime import datetime, timezone

def main(case_id: str, node_id: str, attempt_number: int) -> dict:

    conn = pymysql.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ["DB_PORT"]),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.environ["DB_NAME"],
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with conn.cursor() as cur:

            # 1. Fetch current case state
            cur.execute(
                "SELECT * FROM ao_case_state WHERE case_id = %s", [case_id]
            )
            case_state = cur.fetchone()

            if not case_state:
                return {"error": f"Case {case_id} not found"}

            # 2. Fetch completed checkpoints
            cur.execute(
                """SELECT node_id, output_json, completed_at, attempt_number,
                          duration_seconds, failure_reason, next_node
                   FROM ao_node_checkpoint
                   WHERE case_id = %s AND status = 'COMPLETE'
                   ORDER BY completed_at ASC""",
                [case_id]
            )
            checkpoints = cur.fetchall()

            # 3. Fetch failure history
            cur.execute(
                """SELECT node_id, attempt_number, status, failure_reason, completed_at
                   FROM ao_node_checkpoint
                   WHERE case_id = %s AND status IN ('FAILED', 'ESCALATED')
                   ORDER BY completed_at ASC""",
                [case_id]
            )
            failures = cur.fetchall()
    finally:
        conn.close()

    # 4. Build AO Case State Block
    completed_nodes = []
    partial_outputs = {}

    for cp in checkpoints:
        completed_nodes.append({
            "node_id": cp["node_id"],
            "completed_at": cp["completed_at"].isoformat() if cp["completed_at"] else None,
            "attempts": cp["attempt_number"],
            "duration_mins": round(cp["duration_seconds"] / 60, 1) if cp["duration_seconds"] else None
        })
        if cp["output_json"]:
            partial_outputs[cp["node_id"]] = json.loads(cp["output_json"])

    # 5. Compute SLA status
    now = datetime.now(timezone.utc)
    deadline = case_state["sla_deadline"]
    created = case_state["created_at"]
    total_sla_secs = (deadline - created).total_seconds()
    elapsed_secs = (now - created.replace(tzinfo=timezone.utc)).total_seconds()
    pct_consumed = round(elapsed_secs / total_sla_secs * 100, 1)

    # 6. Build Completion Registry text
    completed_node_ids = [cp["node_id"] for cp in checkpoints]
    registry_lines = []
    for node_id, node_name in NODE_NAMES.items():
        if node_id in completed_node_ids:
            registry_lines.append(f"✅ COMPLETE — {node_id} | {node_name}")
        elif node_id == node_id:
            registry_lines.append(f"▶  ACTIVE   — {node_id} | {node_name} | Attempt {attempt_number}")
        else:
            registry_lines.append(f"⏳ PENDING  — {node_id} | {node_name}")

    completion_registry = "\n".join(registry_lines)

    # 7. Build retry context (if attempt > 1)
    retry_context = None
    if attempt_number > 1 and failures:
        last_failure = failures[-1]
        retry_context = f"""
RETRY CONTEXT — ATTEMPT {attempt_number}
Previous attempt failed: {last_failure['failure_reason']}
Failed at: {last_failure['completed_at']}
Correct the identified issue in this attempt.
"""

    # 8. Assemble full AO Case State Block
    ao_case_state_block = {
        "ao_case_state": {
            "case_id": case_id,
            "status": case_state["status"],
            "current_node": node_id,
            "current_node_attempt": attempt_number,
            "current_node_max_retries": MAX_RETRIES.get(node_id, 2),
            "completed_nodes": completed_nodes,
            "pending_nodes": [n for n in NODE_NAMES if n not in completed_node_ids and n != node_id],
            "retry_counts": json.loads(case_state["retry_counts"] or "{}"),
            "case_attributes": {
                "client_name": case_state["client_name"],
                "account_type": case_state["case_type"],
                "jurisdiction": case_state["jurisdiction"],
                "rm_id": case_state["rm_id"],
                "priority": case_state["priority"]
            },
            "sla_tracking": {
                "sla_deadline": deadline.isoformat(),
                "elapsed_hours": round(elapsed_secs / 3600, 2),
                "remaining_hours": round((total_sla_secs - elapsed_secs) / 3600, 2),
                "sla_pct_consumed": pct_consumed,
                "sla_status": "CRITICAL" if pct_consumed > 90 else "WARNING" if pct_consumed > 75 else "ON_TRACK"
            },
            "partial_outputs": partial_outputs,
            "system_context": {
                "current_timestamp": now.isoformat(),
                "orchestrator_version": "1.0.0"
            }
        }
    }

    return {
        "ao_case_state_block_json": json.dumps(ao_case_state_block, indent=2),
        "completion_registry_text": completion_registry,
        "retry_context_text": retry_context or "",
        "is_retry": attempt_number > 1,
        "sla_critical": pct_consumed > 90,
        "partial_outputs": partial_outputs
    }

# Constants
NODE_NAMES = {
    "N-0": "Case Intake & Triage",
    "N-1": "Document Collection",
    "N-2": "KYC/CDD Assessment",
    "N-3a": "Credit Assessment",
    "N-3b": "TMO Static Data",
    "N-4": "JOIN Gate",
    "N-5": "Signature Verification",
    "N-6": "Regulatory Configuration",
    "N-7": "Activation Review",
    "N-8": "Downstream Provisioning"
}

MAX_RETRIES = {
    "N-0": 2, "N-1": 3, "N-2": 1,
    "N-3a": 2, "N-3b": 3,
    "N-5": 0, "N-6": 2, "N-7": 0, "N-8": 3
}
```

---

# Part IV — Audit, Compliance & Observability

---

## 23. Event Log Schema — CQRS + Event Sourcing

Every state transition in the DCE AO system is recorded as an immutable event in the `ao_event_log` table. This provides:
- **Complete audit trail** for MAS/HKMA examinations
- **Time-travel queries** ("what was the state at 14:32 on March 2?")
- **Forensic analysis** capability for any dispute or investigation

### Event Types Registry

| Event Type | Trigger | Payload |
|---|---|---|
| `CASE_SUBMITTED` | New AO submission received | Submission metadata |
| `NODE_STARTED` | Orchestrator invokes a node | Node ID, attempt number, input hash |
| `NODE_COMPLETED` | Node finishes successfully | Node ID, output hash, duration |
| `NODE_FAILED` | Node fails (validation/error) | Node ID, failure reason, retry count |
| `NODE_ESCALATED` | Ceiling reached, escalated | Node ID, escalation target |
| `HITL_TASK_CREATED` | HITL task sent to Workbench | Task ID, reviewer role, SLA deadline |
| `HITL_TASK_ASSIGNED` | HITL assigned to specific person | Task ID, assignee employee ID |
| `HITL_DECISION_RECORDED` | Human makes decision | Decision, rationale, decider ID |
| `PARALLEL_FORK` | N-3a/N-3b fork starts | Fork ID, branch list |
| `PARALLEL_JOIN` | N-4 aggregates both streams | Fork ID, join result |
| `CHECKPOINT_WRITTEN` | Node writes checkpoint | Checkpoint ID, MariaDB row |
| `SLA_WARNING` | 75% SLA consumed | Remaining hours, notified parties |
| `SLA_CRITICAL` | 90% SLA consumed | Remaining hours, escalation |
| `SLA_BREACHED` | SLA deadline passed | Case age, responsible parties |
| `CASE_ACTIVATED` | Account goes live | UBIX ID, timestamp |
| `CASE_REJECTED` | Case terminated | Reason, node of failure |
| `CASE_SUPERSEDED` | Case replaced by new run | Successor case ID |

### Audit Report Query Examples

```sql
-- Full audit trail for a case (MAS examiner view)
SELECT
    event_id, event_type, from_state, to_state,
    triggered_by, triggered_at,
    JSON_PRETTY(event_payload) as details
FROM ao_event_log
WHERE case_id = 'AO-2026-001234'
ORDER BY triggered_at ASC;

-- All HITL decisions in last 30 days
SELECT
    el.case_id, el.triggered_at,
    JSON_EXTRACT(el.event_payload, '$.task_type') as task_type,
    JSON_EXTRACT(el.event_payload, '$.decision') as decision,
    JSON_EXTRACT(el.event_payload, '$.decided_by') as decided_by,
    JSON_EXTRACT(el.event_payload, '$.decision_rationale') as rationale
FROM ao_event_log el
WHERE event_type = 'HITL_DECISION_RECORDED'
AND triggered_at > NOW() - INTERVAL 30 DAY;

-- Cases with SLA breaches
SELECT
    cs.case_id, cs.client_name, cs.priority,
    cs.sla_deadline, cs.updated_at,
    TIMESTAMPDIFF(HOUR, cs.sla_deadline, cs.updated_at) as hours_over_sla
FROM ao_case_state cs
WHERE EXISTS (
    SELECT 1 FROM ao_event_log el
    WHERE el.case_id = cs.case_id
    AND el.event_type = 'SLA_BREACHED'
)
ORDER BY hours_over_sla DESC;
```

---

## 24. MAS / HKMA Compliance Checkpoint Map

| Regulatory Requirement | Architecture Implementation | Node | Evidence |
|---|---|---|---|
| MAS Notice SFA 04-N02: Client onboarding controls | HITL mandatory at N-5, N-7 | N-5, N-7 | HITL decision events in audit log |
| MAS AML/CFT: Customer due diligence | KYC/CDD Agent (SA-4) with EDD HITL | N-2 | N2Output + screening references |
| MAS AML/CFT: PEP enhanced scrutiny | Constitutional Rule H-4 (mandatory HITL on PEP) | N-2 | HITL task + compliance decision |
| MAS AML/CFT: Sanctions screening | Constitutional Rule H-3 (immediate MLRO notification) | N-2 | Sanctions screening reference |
| MAS TRM: Audit trails | CQRS Event Log + ao_event_log table | All nodes | Event log — every state transition |
| MAS TRM: System controls | Retry ceilings + Pydantic validation | All nodes | ao_node_checkpoint records |
| MAS TRM: Human oversight | 4-eyes at N-5, N-7; HITL gates throughout | N-5, N-7, conditional HITL | HITL decision records |
| HKMA SPM: Account opening controls | DAG prevents out-of-sequence steps | All nodes | Topological ordering enforced |
| ABS Credit Policy: Delegated authority | Constitutional Rule H-6 (credit HITL above threshold) | N-3a | Credit approval record |
| ABS Risk Framework: 4-eyes | N-7 mandatory senior management approval | N-7 | Activation HITL record |

---

## 25. Observability & SLA Monitoring

### Monitoring Dashboard — Key Metrics

| Metric | Source | Alert Threshold |
|---|---|---|
| Active cases count | `ao_case_state` WHERE status='ACTIVE' | Info only |
| Cases at HITL (blocking) | `ao_case_state` WHERE status='HITL_PENDING' | > 10 cases |
| SLA warning cases | `ao_case_state` WHERE sla_pct > 75 | Any |
| SLA critical cases | `ao_case_state` WHERE sla_pct > 90 | Immediate alert |
| Node average duration | `ao_node_checkpoint` GROUP BY node_id | > 2x baseline |
| Retry rate per node | `ao_node_checkpoint` WHERE attempt > 1 | > 20% of runs |
| Downstream system failures | `ao_node_checkpoint` WHERE node_id='N-8' AND status='FAILED' | Any |
| Token usage per case | `ao_node_checkpoint` SUM(token_usage.total) | > cost threshold |
| HITL resolution time | Time between HITL_TASK_CREATED and HITL_DECISION_RECORDED | > SLA deadline |

---

# Part V — Implementation Roadmap

---

## 26. Phased Implementation Plan

### Phase 1 — Foundation (Weeks 1–4)

**Goal:** DAG infrastructure, state persistence, orchestrator skeleton

| Week | Deliverable |
|---|---|
| W1 | MariaDB schema (`ao_case_state`, `ao_node_checkpoint`, `ao_event_log`) |
| W1 | Kafka topics provisioned (`dce.ao.*` topic set) |
| W2 | Domain Orchestrator Workflow (Dify) — routing logic, no LLM yet |
| W2 | Context Injector Code Node (Python) — reads from MariaDB |
| W3 | Checkpoint Writer Code Node — writes to MariaDB |
| W3 | N-0 (Case Intake) complete implementation |
| W4 | N-1 (Document Collection) complete implementation |
| W4 | End-to-end test: N-0 → N-1 → checkpoint → recovery test |

**Definition of Done:** A case submitted via API flows through N-0 and N-1, writes checkpoints, and recovers correctly after simulated crash.

---

### Phase 2 — Core Agents (Weeks 5–10)

**Goal:** All 9 sub-agents implemented and individually tested

| Week | Deliverable |
|---|---|
| W5 | N-2 (KYC/CDD Agent) — SA-4 as Dify Agent type |
| W6 | N-3a (Credit Assessment) — SA-6 |
| W6 | N-3b (TMO Static Data) — SA-7 |
| W7 | N-4 (Parallel JOIN Gate) + end-to-end parallel test |
| W8 | N-5 (Signature Verification) + Workbench HITL integration |
| W8 | N-6 (Regulatory Config) — SA-8 |
| W9 | N-7 (Activation Review) + HITL for senior approval |
| W9 | N-8 (Downstream Provisioning) — UBIX, SIC, CQG integrations |
| W10 | End-to-end AO test: full happy path N-0 → DONE |

**Definition of Done:** A complete AO case runs end-to-end with all HITL touchpoints, checkpoints, and audit log populated.

---

### Phase 3 — Context Engineering (Weeks 11–13)

**Goal:** Layer context engineering on all agents; validate quality improvement

| Week | Deliverable |
|---|---|
| W11 | AO Case State Block injection in all agents |
| W11 | Completion Registry in Orchestrator system prompt |
| W11 | Pydantic output validation in all Code nodes |
| W12 | Role Scope Templates finalized for all 9 sub-agents |
| W12 | Retry Awareness injection on all retry paths |
| W12 | KB Relevance Filter implementation — precision RAG |
| W13 | HITL Constitutional Rules embedded in Orchestrator |
| W13 | Prior Failure Injection on all retry invocations |
| W13 | A/B test: context-engineered vs. baseline — measure decision quality |

**Definition of Done:** All 8 context engineering techniques implemented. Decision quality measurably improved vs. baseline (fewer validation failures, fewer unnecessary HITL escalations).

---

### Phase 4 — Production Hardening (Weeks 14–16)

**Goal:** Security, performance, compliance sign-off, production release

| Week | Deliverable |
|---|---|
| W14 | Compliance audit: MAS checkpoint map review with Compliance team |
| W14 | SLA monitoring dashboard (Grafana/internal tooling) |
| W14 | Load testing: 50 concurrent cases |
| W15 | Penetration test: AI injection defense (prompt injection testing) |
| W15 | DR (Disaster Recovery) test: checkpoint recovery under failure |
| W15 | Token usage optimisation pass |
| W16 | UAT with DCE Operations team |
| W16 | Production deployment to OpenShift |
| W16 | Hypercare monitoring (first 4 weeks post-go-live) |

---

## 27. Engineering Standards Checklist

Every sub-agent implementation must pass this checklist before being considered production-ready:

### DAG Layer Checklist

- [ ] Node is implemented as a Dify Workflow app
- [ ] Node canvas follows Standard Node Canvas Template (Section 20)
- [ ] Node has no back-edges (cannot invoke a prior node)
- [ ] Retry ceiling is implemented as an internal loop (not a DAG back-edge)
- [ ] Checkpoint Writer is the last Code Node before the End Node
- [ ] Checkpoint uses `INSERT IGNORE` for idempotency
- [ ] All valid `next_node` values are documented and implemented in IF/ELSE routing
- [ ] Escalation path is implemented for ceiling-exceeded scenario
- [ ] HITL tasks are created with full HITLTask schema (Section 18)
- [ ] Parallel streams (N-3a/N-3b) have independent retry counters

### Context Engineering Checklist

- [ ] Context Injector Code Node is the first node after Start
- [ ] AO Case State Block is injected into LLM system or user prompt
- [ ] Completion Registry text is included in Orchestrator system prompt
- [ ] Retry Context is injected when attempt_number > 1
- [ ] Prior Failure Reason is injected on retry calls
- [ ] Role Scope Template limits the agent to its specific domain
- [ ] Pydantic Output Validator is present after every LLM node
- [ ] KB query is precision-constructed (not generic)
- [ ] Max chunks limit is respected per node specification
- [ ] HITL Constitutional Rules are embedded in Orchestrator prompt

### Compliance Checklist

- [ ] All state transitions logged to `ao_event_log`
- [ ] N-5 always routes to HITL (no auto-approval path exists)
- [ ] N-7 always routes to HITL (no auto-approval path exists)
- [ ] Sanctions hit immediately routes to MLRO + Compliance Officer
- [ ] PEP identification routes to HITL_COMPLIANCE
- [ ] Credit above delegated authority routes to HITL_SENIOR_CREDIT
- [ ] Entity merge in UBIX requires HITL confirmation
- [ ] SLA monitoring is active with alert thresholds
- [ ] Token usage is logged per node per case (cost tracking)
- [ ] All agent model versions are logged in checkpoint records

---

## Appendix A — Quick Reference: Node → Sub-Agent → Dify Type

| Node | Sub-Agent | Dify App Type | Primary KB | Primary MCP Tools |
|---|---|---|---|---|
| N-0 | SA-1 Intake & Triage | Workflow (WF) | KB-1, KB-9 | create_case, assign_rm, send_notification |
| N-1 | SA-2 Document Processing | Workflow (WF) | KB-1, KB-2 | get_document_checklist, validate_document_expiry |
| N-2 | SA-4 KYC/CDD | **Agent (AG)** | KB-3, KB-6 | screen_entity, screen_individual, get_adverse_media |
| N-3a | SA-6 Credit Assessment | Workflow (WF) | KB-4, KB-5 | run_credit_scoring, calculate_margin_requirements |
| N-3b | SA-7 TMO Static Data | Workflow (WF) | KB-5, KB-8 | search_ubix_entity, create_ubix_entity, setup_sic_counterparty |
| N-4 | — (Variable Aggregator) | Variable Aggregator | — | — |
| N-5 | SA-5 Signature Verification | Workflow (WF) | KB-6, KB-7 | retrieve_specimen_signatures, create_hitl_task |
| N-6 | SA-8 Regulatory Config | Workflow (WF) | KB-3, KB-5 | get_regulatory_rules, configure_cls, set_margin_rules |
| N-7 | SA-9 Activation Review | Workflow (WF) | KB-4, KB-3 | compile_case_dossier, create_activation_task |
| N-8 | SA-3 System Integration | Workflow (WF) | KB-8 | provision_ubix, provision_cls, provision_cqg |

---

## Appendix B — Context Engineering Techniques Summary

| Technique | When Applied | What It Solves |
|---|---|---|
| CE-1: AO Case State Block | Every LLM call | Stale context, lost state across executions |
| CE-2: Completion Registry | Orchestrator calls | Re-invocation of completed nodes |
| CE-3: Retry Awareness | Retry calls (attempt > 1) | Repeating the same mistake on retry |
| CE-4: Role Scope Templates | Every agent, system prompt | Out-of-scope decisions, cross-agent confusion |
| CE-5: Pydantic Output Models | After every LLM node | Malformed outputs, hallucinated field values |
| CE-6: KB Relevance Filter | Every KB retrieval | Context pollution, irrelevant knowledge chunks |
| CE-7: HITL Constitutional Rules | Orchestrator + HITL nodes | Bypassing mandatory human oversight |
| CE-8: Prior Failure Injection | Retry calls | Uninformed retries that repeat the same failure |

---

# Part VI — Agent Skills Registry

---

## Skill Taxonomy

Every agent in the DCE AO system possesses a set of **skills** — discrete, named capabilities that the agent can invoke to accomplish its mandate. Skills are classified into six categories:

| Category | Icon | Description |
|---|---|---|
| **Cognitive** | 🧠 | LLM-based reasoning, classification, analysis, and decision-making |
| **Tool** | 🔧 | MCP tool calls and external API integrations |
| **Knowledge** | 📚 | Knowledge Base retrieval, regulatory lookup, policy application |
| **Integration** | 🔗 | Direct system integrations (UBIX, SIC, CLS, CQG, MariaDB) |
| **HITL** | 👤 | Human-in-the-loop task creation, assignment, and resolution tracking |
| **Observability** | 📊 | Audit logging, SLA tracking, event publishing, notification dispatch |

### Skill Card Format

Each skill is documented using this standard structure:

```
Skill Name         : Human-readable name
Skill ID           : Unique identifier (SA-X.SKL-YY)
Category           : One of the six categories above
Dify Node Type     : Which Dify node implements this skill
Input              : What the skill requires
Output             : What the skill produces
Trigger Condition  : When this skill is invoked
Error Handling     : What happens on failure
Regulatory Basis   : MAS/HKMA rule reference (if applicable)
```

---

## Domain Orchestrator — Skill Set

> **Role:** Routes cases through the DAG. Never executes business logic.
> **Dify Type:** Workflow (WF) — stateless router
> **Total Skills:** 8

---

### 🧠 ORCH.SKL-01 — Case State Reader

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-01 |
| **Category** | Cognitive + Integration |
| **Dify Node** | Code Node (Python) |
| **Description** | Reads the full AO case state from MariaDB and constructs the AO Case State Block and Completion Registry for context injection |
| **Input** | `case_id`, `triggering_event` (Kafka event payload) |
| **Output** | `ao_case_state_block` (JSON), `completion_registry` (text), `current_node`, `retry_counts` |
| **Trigger** | On every Kafka event received on `dce.ao.orchestrator.events` topic |
| **Error Handling** | If case not found → log `CASE_NOT_FOUND` event → alert Operations |
| **Regulatory Basis** | MAS TRM: Audit trail requires current state to be persisted and retrievable |

---

### 🧠 ORCH.SKL-02 — Next Node Router

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-02 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node + IF/ELSE Node |
| **Description** | Analyses the output of the last completed node and determines the correct next action: invoke next DAG node, create HITL task, escalate, or terminate |
| **Input** | `ao_case_state_block`, `completion_registry`, `last_node_output` (Pydantic-validated JSON) |
| **Output** | `next_action` (INVOKE_NODE \| ROUTE_HITL \| ESCALATE \| TERMINAL_DONE \| TERMINAL_DEAD), `target_node`, `rationale` |
| **Trigger** | After ORCH.SKL-01 completes on each Kafka event |
| **Error Handling** | Invalid routing output → Pydantic validation fail → route to ESCALATE by default |
| **Regulatory Basis** | MAS TRM: Process control — no back-edges permitted; DAG invariant enforced |
| **Guardrails** | Completion Registry hard-blocks re-invocation of completed nodes |

---

### 👤 ORCH.SKL-03 — HITL Queue Manager

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-03 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API) |
| **Description** | Creates, assigns, and monitors HITL tasks in the Angular Agentic Workbench. Tracks HITL resolution and re-triggers routing on human decision |
| **Input** | `hitl_task_spec` (HITLTask Pydantic model), `case_id`, `reviewer_role`, `sla_deadline` |
| **Output** | `hitl_task_id`, `assigned_to`, `sla_deadline`, `workbench_url` |
| **Trigger** | When ORCH.SKL-02 returns `next_action = ROUTE_HITL` |
| **Error Handling** | Workbench API unavailable → retry 3× → escalate to Technology Ops |
| **Regulatory Basis** | MAS TRM: Human oversight; 4-eyes principle |
| **Sub-skills** | Task creation, role-based assignment, SLA deadline setting, escalation on non-response |

---

### 🔗 ORCH.SKL-04 — Parallel Stream Coordinator

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-04 |
| **Category** | Integration |
| **Dify Node** | Parallel Node + Variable Aggregator |
| **Description** | Forks execution into N-3a (Credit) and N-3b (TMO Static) concurrent streams, tracks both independently, aggregates on JOIN gate (N-4) |
| **Input** | `n2_output` (N2Output), `case_id` |
| **Output** | `fork_id`, `branch_statuses` {N-3a: status, N-3b: status}, `join_output` (N4JoinOutput when both complete) |
| **Trigger** | When N-2 output `next_node = "N-3a_N-3b_PARALLEL"` |
| **Error Handling** | Either branch DEAD → full JOIN = DEAD; HITL in either branch → hold JOIN; independent retries per branch |
| **Regulatory Basis** | Operational efficiency — parallel reduces AO TAT |

---

### 📊 ORCH.SKL-05 — SLA Monitor & Alerter

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-05 |
| **Category** | Observability |
| **Dify Node** | Code Node (runs on every orchestrator invocation) |
| **Description** | Computes current SLA consumption percentage, triggers warning/critical/breach alerts to appropriate stakeholders |
| **Input** | `case_state.sla_deadline`, `case_state.created_at`, `current_timestamp` |
| **Output** | `sla_status` (ON_TRACK \| WARNING \| CRITICAL \| BREACHED), `pct_consumed`, `remaining_hours` |
| **Trigger** | Every orchestrator invocation |
| **Error Handling** | SLA calculation failure → log warning but do not block case processing |
| **Regulatory Basis** | MAS TRM: SLA commitment monitoring; operational governance |
| **Alert Matrix** | 75% → RM Manager notified; 90% → DCE COO notified; 100% → Breach event logged + Risk Management |

---

### 📊 ORCH.SKL-06 — Event Publisher

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-06 |
| **Category** | Observability |
| **Dify Node** | HTTP Request Node (Kafka REST Proxy) |
| **Description** | Publishes state transition events to the `dce.ao.events` Kafka topic for the CQRS event store |
| **Input** | `event_type`, `case_id`, `from_state`, `to_state`, `event_payload` |
| **Output** | `kafka_offset`, `partition`, `publish_timestamp` |
| **Trigger** | Every state transition; every HITL creation/resolution; every node start/complete |
| **Error Handling** | Kafka publish failure → retry 3× with backoff → write to dead-letter table in MariaDB |
| **Regulatory Basis** | MAS TRM: Complete, immutable audit trail |

---

### 🔧 ORCH.SKL-07 — Escalation Handler

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-07 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Notification API + Workbench API) |
| **Description** | Routes cases to the appropriate escalation handler when a node exceeds its retry ceiling. Creates escalation task, notifies escalation target, updates case status |
| **Input** | `case_id`, `failed_node`, `escalation_target_role`, `failure_summary`, `retry_history` |
| **Output** | `escalation_task_id`, `notified_parties`, `escalation_status` |
| **Trigger** | When any node returns `next_node = "ESCALATE_*"` |
| **Error Handling** | Escalation notification failure → write to emergency alert log → SMS fallback |
| **Regulatory Basis** | MAS TRM: Escalation path documentation |

---

### 🧠 ORCH.SKL-08 — Crash Recovery Orchestrator

| Field | Detail |
|---|---|
| **Skill ID** | ORCH.SKL-08 |
| **Category** | Cognitive + Integration |
| **Dify Node** | Code Node (startup recovery scan) |
| **Description** | On system startup, scans for stale in-flight cases (updated > 10 min ago, non-terminal state), resumes each from its last valid checkpoint |
| **Input** | Queries `ao_case_state` for stale cases, reads last checkpoint from `ao_node_checkpoint` |
| **Output** | `recovered_cases[]`, `unrecoverable_cases[]` |
| **Trigger** | Orchestrator service startup; also scheduled every 5 minutes |
| **Error Handling** | No checkpoint found → create manual recovery task in Workbench |
| **Regulatory Basis** | MAS TRM: Business continuity; system resilience |

---

## SA-1 — Case Intake & Triage Agent (Node N-0)

> **Role:** First contact for all AO submissions. Classifies, prioritises, and creates the case record.
> **Dify Type:** Workflow (WF)
> **Total Skills:** 9

---

### 🔧 SA1.SKL-01 — Email Ingestion & Parsing

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-01 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Microsoft Graph API) |
| **Description** | Monitors the DCE AO shared Outlook inbox (`dce.accountopening@abs.com`), retrieves new emails, extracts body text and all attachments |
| **Input** | Graph API webhook event: `{message_id, sender, received_at}` |
| **Output** | `{subject, body_text, sender_email, received_at, attachments: [{filename, content_base64, mime_type}]}` |
| **Trigger** | MS Graph API webhook → new email in monitored mailbox |
| **Error Handling** | API failure → retry 3× → fallback to polling every 2 minutes |
| **Regulatory Basis** | Operational — ensures no submission is missed |

---

### 🧠 SA1.SKL-02 — Account Type Classifier

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-02 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) |
| **Description** | Classifies the submission into the correct DCE account type based on email content, attached form data, and KB-1 (Document Taxonomy) |
| **Input** | `{body_text, form_data_extracted, rm_id}` + KB-1 chunks (account type rules) |
| **Output** | `account_type` (INSTITUTIONAL_FUTURES \| RETAIL_FUTURES \| OTC_DERIVATIVES \| COMMODITIES_PHYSICAL \| MULTI_PRODUCT), `confidence` (≥ 0.70 required) |
| **Trigger** | After SA1.SKL-01 completes |
| **Error Handling** | Confidence < 0.70 → flag for RM confirmation before proceeding |
| **KB Used** | KB-1: Document Taxonomy (account type definitions, product mapping) |

---

### 🧠 SA1.SKL-03 — Priority Assessor

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-03 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Haiku — lightweight) |
| **Description** | Determines case priority (URGENT / STANDARD / DEFERRED) based on client tier, product urgency indicators, RM escalation flags, and SLA policy from KB-9 |
| **Input** | `{account_type, client_tier, products_requested, rm_urgency_flag}` + KB-9 chunks |
| **Output** | `priority`, `priority_reason`, `sla_deadline` (computed from priority + submission timestamp) |
| **Trigger** | After SA1.SKL-02 completes |
| **Error Handling** | Default to STANDARD if priority assessment inconclusive |
| **KB Used** | KB-9: SLA Policy (SLA windows per priority and account type) |

---

### 🔧 SA1.SKL-04 — Case Record Creator

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Case Management API) |
| **Description** | Creates the official AO case record in the Case Management system with a unique case ID and all classified attributes |
| **Input** | `{account_type, priority, sla_deadline, client_name, rm_id, jurisdiction, products_requested, submission_metadata}` |
| **Output** | `{case_id: "AO-2026-XXXXXX", case_url, created_at}` |
| **Trigger** | After SA1.SKL-03 (priority) completes |
| **Error Handling** | Case creation failure → retry 2× → alert Operations (case cannot proceed without case ID) |
| **MCP Tool** | `create_case` |

---

### 🔧 SA1.SKL-05 — RM & Manager Linker

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-05 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Case Management API) |
| **Description** | Links the submitting RM and their manager to the case record. Resolves RM Manager from ABS HR system if not provided |
| **Input** | `{case_id, rm_id}` |
| **Output** | `{rm_id, rm_name, rm_manager_id, rm_manager_name, rm_branch}` |
| **Trigger** | After SA1.SKL-04 completes |
| **Error Handling** | RM not found in HR system → create manual assignment task |
| **MCP Tool** | `assign_rm`, `get_rm_hierarchy` |

---

### 🔧 SA1.SKL-06 — Document Pre-Stager

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-06 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Document Management API) |
| **Description** | Uploads all email attachments to the Document Management system (MongoDB), tagged with case ID, submission timestamp, and source |
| **Input** | `{case_id, attachments: [{filename, content_base64, mime_type}]}` |
| **Output** | `{staged_documents: [{doc_id, filename, storage_url, uploaded_at}]}` |
| **Trigger** | After SA1.SKL-05 completes |
| **Error Handling** | Storage failure → retry 3× → alert Document Management team |
| **MCP Tool** | `stage_documents` |

---

### 📊 SA1.SKL-07 — Intake Notifier

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-07 |
| **Category** | Observability |
| **Dify Node** | HTTP Request Node (Notification API) |
| **Description** | Sends case creation confirmation to the RM with case ID, priority, SLA deadline, and a workbench link. Also notifies RM Manager of case creation |
| **Input** | `{case_id, rm_email, rm_manager_email, priority, sla_deadline, account_type, client_name}` |
| **Output** | `{notification_ids: [...], sent_at}` |
| **Trigger** | After SA1.SKL-06 completes (all documents staged) |
| **Error Handling** | Email delivery failure → retry 3× → log to notification failure queue |
| **MCP Tool** | `send_notification` |

---

### 🧠 SA1.SKL-08 — Portal Submission Handler

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-08 |
| **Category** | Cognitive + Tool |
| **Dify Node** | HTTP Request Node (Portal API) + Code Node (form data parser) |
| **Description** | Handles AO submissions via the Angular Agentic Workbench portal (as opposed to email). Parses structured form data, validates mandatory fields, maps to internal schema |
| **Input** | Portal API webhook: `{form_data_json, uploaded_doc_ids, submitted_by_rm_id}` |
| **Output** | Same as SA1.SKL-01 output (normalised to common intake schema) |
| **Trigger** | Portal form submission webhook event |
| **Error Handling** | Invalid form data → return validation errors to portal for RM correction |
| **Note** | Skills SA1.SKL-01 and SA1.SKL-08 are alternative entry points — only one fires per submission |

---

### 📊 SA1.SKL-09 — Closure & Go-Live Notifier

| Field | Detail |
|---|---|
| **Skill ID** | SA1.SKL-09 |
| **Category** | Observability |
| **Dify Node** | HTTP Request Node (Notification API) |
| **Description** | On case DONE state (after N-8 provisioning), sends account activation confirmation to RM, RM Manager, and client. Closes the case record with final disposition |
| **Input** | `{case_id, n8_output (N8Output), rm_email, client_contact}` |
| **Output** | `{notifications_sent, case_closed_at, final_case_status}` |
| **Trigger** | TERMINAL_DONE event from Domain Orchestrator |
| **Error Handling** | Notification failure → retry 3× → fallback to Workbench task for RM to notify manually |
| **MCP Tool** | `send_notification`, `close_case` |

---

## SA-2 — Document Collection Agent (Node N-1)

> **Role:** Validates document completeness and quality for all submitted materials.
> **Dify Type:** Workflow (WF)
> **Total Skills:** 8

---

### 📚 SA2.SKL-01 — Checklist Generator

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-01 |
| **Category** | Knowledge |
| **Dify Node** | Knowledge Retrieval Node + Code Node |
| **Description** | Generates the precise document checklist applicable to this case by querying KB-2 with account type + jurisdiction + products requested. Splits into mandatory and optional lists |
| **Input** | `{account_type, jurisdiction, products_requested, client_entity_type}` |
| **Output** | `{mandatory_docs: [...], optional_docs: [...], checklist_version, regulatory_basis}` |
| **Trigger** | First step of N-1 execution |
| **Error Handling** | KB retrieval failure → use last-known checklist from local cache + alert KB admin |
| **KB Used** | KB-2: Document Checklist Rules |
| **MCP Tool** | `get_document_checklist` |

---

### 🔧 SA2.SKL-02 — OCR & Metadata Extractor

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Document API — OCR service) |
| **Description** | Runs OCR on all submitted documents to extract text content and metadata (document type, issuing authority, date, signatory names). Populates document metadata records in MongoDB |
| **Input** | `{doc_id, storage_url, expected_doc_type}` (for each submitted document) |
| **Output** | `{doc_id, extracted_text, detected_doc_type, issuing_authority, issue_date, expiry_date, signatory_names, confidence_score}` |
| **Trigger** | After SA2.SKL-01 (checklist generated) — runs for each submitted document |
| **Error Handling** | OCR confidence < 0.80 → flag document for human review; do not block other documents |
| **MCP Tool** | `extract_document_metadata` |

---

### 🧠 SA2.SKL-03 — Completeness Assessor

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-03 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) |
| **Description** | Compares submitted documents against the generated checklist. Identifies missing mandatory documents, missing optional documents, and documents that need resubmission. Uses OCR metadata to match submitted docs to checklist items |
| **Input** | `{checklist, submitted_documents_metadata, account_type, jurisdiction}` + KB-2 chunks |
| **Output** | `{completeness_flag, mandatory_docs_complete, missing_mandatory[], missing_optional[], coverage_pct}` |
| **Trigger** | After SA2.SKL-02 (OCR) for all documents |
| **Error Handling** | Ambiguous document type match → default to REQUIRES_RESUBMISSION (conservative) |
| **KB Used** | KB-2: Document Checklist Rules |

---

### 🔧 SA2.SKL-04 — Document Validity Checker

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Document API) + Code Node (date validation) |
| **Description** | Validates document expiry dates, confirms issuing authority is acceptable, checks document age limits (e.g., utility bills < 3 months old) |
| **Input** | `{doc_id, doc_type, issue_date, expiry_date, issuing_authority}` |
| **Output** | `{validity_status: VALID \| EXPIRED \| NEAR_EXPIRY \| UNACCEPTABLE_SOURCE, days_to_expiry, validity_notes}` |
| **Trigger** | Concurrent with SA2.SKL-03 — runs for each document |
| **Error Handling** | Date parsing failure → flag for human review |
| **MCP Tool** | `validate_document_expiry` |
| **Regulatory Basis** | MAS AML/CFT: Document recency requirements |

---

### 🧠 SA2.SKL-05 — Rejection Reasoner

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-05 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Haiku) |
| **Description** | For each rejected or flagged document, generates a clear, RM-actionable rejection reason explaining what is wrong and what is needed for resubmission |
| **Input** | `{doc_id, doc_type, rejection_cause, regulatory_requirement}` |
| **Output** | `{rejection_reason_text, resubmission_instructions, regulatory_reference}` |
| **Trigger** | After SA2.SKL-03 and SA2.SKL-04 — for each rejected/invalid document |
| **Error Handling** | LLM output missing → use template rejection reason |

---

### 🔧 SA2.SKL-06 — Document Flagging Tool

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-06 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Document API) |
| **Description** | Records document-level decisions (ACCEPTED / REJECTED / REQUIRES_RESUBMISSION) in the Document Management system. Tags rejected documents with reason codes |
| **Input** | `{doc_id, decision, rejection_reason_code, rejection_reason_text}` |
| **Output** | `{doc_id, flagged_at, flag_status}` |
| **Trigger** | After SA2.SKL-05 — for each document with a decision |
| **Error Handling** | API failure → write to local MariaDB buffer + retry |
| **MCP Tool** | `flag_document_for_review` |

---

### 👤 SA2.SKL-07 — RM Chase Composer

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-07 |
| **Category** | HITL + Cognitive |
| **Dify Node** | LLM Node (Claude Haiku) + HTTP Request Node (Notification API) |
| **Description** | Composes a personalised chase email/notification to the RM listing all missing and rejected documents with specific resubmission instructions and the SLA impact |
| **Input** | `{case_id, rm_name, client_name, missing_mandatory[], rejected_docs[], sla_remaining_hours, retry_count}` |
| **Output** | `{chase_message_text, chase_sent_at, notification_id}` |
| **Trigger** | When completeness_flag = False and retry < ceiling (retry recommended) |
| **Error Handling** | Notification failure → log and retry on next scheduled check |
| **MCP Tool** | `send_notification` |
| **Note** | On retry_count = 2 (ceiling), chase goes to RM Branch Manager (not just RM) |

---

### 🧠 SA2.SKL-08 — Document Completeness Decision Maker

| Field | Detail |
|---|---|
| **Skill ID** | SA2.SKL-08 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node + IF/ELSE Node |
| **Description** | Makes the final completeness decision: proceed to N-2, retry (RM chase), escalate to Branch Manager HITL, or terminate. Weighs mandatory vs optional completeness, retry history, and SLA pressure |
| **Input** | `{completeness_flag, mandatory_docs_complete, optional_docs_complete, retry_count, sla_pct_consumed, failure_history}` |
| **Output** | `next_node` (N-2 \| HITL_RM \| ESCALATE_BRANCH_MANAGER \| DEAD) |
| **Trigger** | After all document checks complete |
| **Error Handling** | Ambiguous decision → default to HITL_RM (conservative escalation) |
| **Constraint** | Must never return N-0 or any completed node in `next_node` |

---

## SA-4 — KYC / CDD Assessment Agent (Node N-2)

> **Role:** Screens entity and beneficial owners; determines risk rating and CDD level.
> **Dify Type:** Agent (AG) — multi-step tool-use loop
> **Total Skills:** 9

---

### 🔧 SA4.SKL-01 — Entity Sanctions Screener

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-01 |
| **Category** | Tool |
| **Dify Node** | Tool Call (AG type — iterated) |
| **Description** | Screens the legal entity against all mandatory sanctions lists: OFAC SDN, UN Security Council Consolidated List, MAS Designation List, HKMA list (for HKG jurisdiction), EU/UK lists (if applicable) |
| **Input** | `{legal_name, registration_number, jurisdiction, aliases[]}` |
| **Output** | `{screening_results: [{list, hit_type: CLEAR\|POTENTIAL\|CONFIRMED, hit_details, reference}], screened_at}` |
| **Trigger** | First tool call in KYC Agent loop |
| **Error Handling** | API timeout → retry once; second failure → ESCALATE_COMPLIANCE (cannot proceed without screening) |
| **MCP Tool** | `screen_entity` |
| **Regulatory Basis** | MAS Notice AML/CFT 01: Mandatory sanctions screening before onboarding |

---

### 🔧 SA4.SKL-02 — Individual Sanctions & PEP Screener

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-02 |
| **Category** | Tool |
| **Dify Node** | Tool Call (AG type — iterated for each individual) |
| **Description** | Screens all beneficial owners (≥10% ownership), directors, and authorised signatories against sanctions lists, PEP databases (ABS internal + WorldCheck), and close associate lists |
| **Input** | `{name, id_type, id_number, dob, nationality, role, ownership_pct}` (per individual) |
| **Output** | `{individual_results: [{name, pep_flag, pep_category, sanctions_flag, screening_refs}]}` |
| **Trigger** | After SA4.SKL-01, for each individual in the UBO/director list |
| **Error Handling** | Same as SA4.SKL-01 — cannot proceed without screening |
| **MCP Tool** | `screen_individual` |
| **Regulatory Basis** | MAS Notice AML/CFT 01: UBO identification and screening |

---

### 🔧 SA4.SKL-03 — Adverse Media Scanner

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-03 |
| **Category** | Tool |
| **Dify Node** | Tool Call (AG type) |
| **Description** | Searches adverse media databases for negative news about the entity and key individuals. Covers English + Mandarin sources for last 24 months. Categories: fraud, corruption, regulatory sanctions, criminal proceedings |
| **Input** | `{entity_name, individual_names[], date_range: "24M"}` |
| **Output** | `{adverse_media_flag, articles_found: [{headline, source, date, category, severity: LOW\|MEDIUM\|HIGH}]}` |
| **Trigger** | Concurrent with SA4.SKL-02 (runs in parallel within the Agent loop) |
| **Error Handling** | Partial results → proceed with available data; log data gap in output |
| **MCP Tool** | `get_adverse_media` |
| **Regulatory Basis** | MAS Notice AML/CFT 01: Ongoing customer due diligence |

---

### 📚 SA4.SKL-04 — Regulatory CDD Rule Lookup

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-04 |
| **Category** | Knowledge |
| **Dify Node** | Knowledge Retrieval Node (KB-3, KB-6) |
| **Description** | Retrieves the applicable CDD requirements for the specific combination of entity type, jurisdiction, account type, and product set. Determines what level of due diligence is mandated |
| **Input** | `{entity_type, jurisdiction, account_type, products_requested}` |
| **Output** | `{applicable_cdd_rules[], required_cdd_level, edd_triggers[], regulatory_references[]}` |
| **Trigger** | After entity and individual screening results are available |
| **Error Handling** | KB retrieval failure → escalate to Compliance Officer for manual CDD determination |
| **KB Used** | KB-3: Regulatory Requirements; KB-6: KYC/AML Guidelines |

---

### 🧠 SA4.SKL-05 — Risk Rating Calculator

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-05 |
| **Category** | Cognitive + Tool |
| **Dify Node** | HTTP Request Node (Risk Scoring API) + LLM Node (reasoning) |
| **Description** | Applies ABS's internal risk scoring model to produce a composite risk rating (LOW / MEDIUM / HIGH / VERY_HIGH) based on: entity type, jurisdiction risk, product risk, PEP exposure, adverse media, sanctions proximity |
| **Input** | `{entity_type, jurisdiction, products, pep_flags, sanctions_results, adverse_media, cdd_factors}` |
| **Output** | `{risk_rating, risk_score_components: {entity: N, jurisdiction: N, product: N, pep: N, adverse_media: N}, aggregate_score}` |
| **Trigger** | After all screening (SKL-01 to SKL-03) and rule lookup (SKL-04) complete |
| **Error Handling** | Scoring API failure → LLM-based risk assessment with explicit uncertainty flag |
| **MCP Tool** | `calculate_risk_rating` |
| **Regulatory Basis** | MAS Notice AML/CFT 01: Risk-based approach to CDD |

---

### 🧠 SA4.SKL-06 — EDD Trigger Identifier

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-06 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) |
| **Description** | Determines whether Enhanced Due Diligence (EDD) is required and identifies the specific EDD triggers based on screening results, risk rating, and regulatory rules |
| **Input** | `{risk_rating, pep_flags, adverse_media_flag, cdd_rules, jurisdiction, entity_type}` |
| **Output** | `{edd_required: bool, edd_triggers: [...], edd_requirements: [...], edd_owner_role}` |
| **Trigger** | After SA4.SKL-05 completes |
| **Error Handling** | Ambiguous EDD determination → flag as EDD_REQUIRED (conservative) |
| **Regulatory Basis** | MAS Notice AML/CFT 01 Section 6: Enhanced CDD circumstances |

---

### 👤 SA4.SKL-07 — Compliance Officer Assigner

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-07 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API + HR API) |
| **Description** | When compliance HITL is required (PEP, sanctions, VERY_HIGH risk, EDD), assigns the case to an available Compliance Officer from the duty roster. Creates HITL task with full screening dossier |
| **Input** | `{case_id, hitl_reason, screening_results, risk_rating, edd_triggers}` |
| **Output** | `{assigned_co_id, co_name, hitl_task_id, sla_deadline}` |
| **Trigger** | When any constitutional HITL rule H-3, H-4, or H-5 is triggered |
| **Error Handling** | No CO available → escalate to Head of Compliance |
| **MCP Tool** | `assign_compliance_officer`, `create_hitl_task` |
| **Regulatory Basis** | MAS: Compliance officer accountability for AML decisions |

---

### 🔧 SA4.SKL-08 — EDD Task Creator

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-08 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Case Management API) |
| **Description** | Creates a structured Enhanced Due Diligence task in the Case Management system, specifying what additional information or verification is required and the responsible party |
| **Input** | `{case_id, edd_triggers, edd_requirements, assigned_co_id}` |
| **Output** | `{edd_task_id, edd_requirements_list, assigned_to, due_date}` |
| **Trigger** | When SA4.SKL-06 returns `edd_required = True` |
| **Error Handling** | Task creation failure → log EDD requirement to audit table + alert |
| **MCP Tool** | `create_edd_task` |

---

### 🧠 SA4.SKL-09 — KYC Disposition Synthesiser

| Field | Detail |
|---|---|
| **Skill ID** | SA4.SKL-09 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) + Code Node (Pydantic N2Output) |
| **Description** | Synthesises all screening and assessment results into the final N2Output, determines `kyc_status` and `next_node`, and writes the KYC reference to the Case Management system |
| **Input** | All outputs from SKL-01 to SKL-08 |
| **Output** | `N2Output` (complete, Pydantic-validated) |
| **Trigger** | Final step after all KYC tools have been called |
| **Error Handling** | Synthesis uncertainty → kyc_status = PENDING_HUMAN_REVIEW → HITL_COMPLIANCE |
| **Constraint** | `next_node` must be one of: N-3a_N-3b_PARALLEL \| HITL_COMPLIANCE \| DEAD |

---

## SA-6 — Credit Assessment Agent (Node N-3a)

> **Role:** Evaluates creditworthiness and determines credit limit, grade, and margin requirements.
> **Dify Type:** Workflow (WF) — Parallel Stream A
> **Total Skills:** 7

---

### 📚 SA6.SKL-01 — Credit Model Selector

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-01 |
| **Category** | Knowledge |
| **Dify Node** | Knowledge Retrieval Node (KB-4) |
| **Description** | Identifies the correct ABS credit assessment model to apply based on entity type, account type, and product set. Different models apply to institutional vs retail clients, futures vs OTC |
| **Input** | `{entity_type, account_type, products_requested, jurisdiction}` |
| **Output** | `{credit_model_id, credit_model_name, model_version, applicable_factors[], weight_schema}` |
| **Trigger** | First step in N-3a execution |
| **Error Handling** | No matching model found → escalate to Senior Credit Officer for manual assessment |
| **KB Used** | KB-4: Credit Policies |
| **MCP Tool** | `get_credit_model` |

---

### 🔧 SA6.SKL-02 — Credit Scorer

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Credit Scoring API) |
| **Description** | Executes the selected credit scoring algorithm against the client's financial data (audited accounts, assets, revenue, liabilities). Returns raw credit score and component breakdown |
| **Input** | `{credit_model_id, financial_data: {total_assets, net_assets, revenue, liabilities, years_audited}, entity_type}` |
| **Output** | `{raw_score, credit_grade: A\|B\|C\|D\|NR, score_components: {financial_strength, liquidity, leverage, profitability}, model_version}` |
| **Trigger** | After SA6.SKL-01 selects the model |
| **Error Handling** | Scoring API failure → retry 2× → fallback to manual scoring HITL |
| **MCP Tool** | `run_credit_scoring` |
| **Regulatory Basis** | ABS Credit Policy: Standardised scoring for consistency |

---

### 📚 SA6.SKL-03 — Product Eligibility Assessor

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-03 |
| **Category** | Knowledge |
| **Dify Node** | Knowledge Retrieval Node (KB-5) + Code Node (eligibility matrix) |
| **Description** | Maps the credit grade to the set of products the client is eligible to trade. Applies ABS product eligibility matrix — lower credit grades have access to fewer/simpler products |
| **Input** | `{credit_grade, products_requested, entity_type, jurisdiction}` |
| **Output** | `{products_approved: [...], products_declined: [...], decline_reasons: {...}, eligibility_matrix_version}` |
| **Trigger** | After SA6.SKL-02 completes |
| **Error Handling** | KB lookup failure → conservative: approve only lowest-risk products |
| **KB Used** | KB-5: Product Rules |
| **MCP Tool** | `get_product_eligibility` |

---

### 🧠 SA6.SKL-04 — Credit Limit Determiner

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-04 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) + HTTP Request Node |
| **Description** | Determines the appropriate credit limit given the credit grade, client's net assets, product types, and ABS credit policy constraints. Compares against requested limit and applies any haircuts |
| **Input** | `{credit_grade, credit_score, net_assets, products_approved, credit_limit_requested, kyc_risk_rating}` |
| **Output** | `{credit_limit_approved, credit_limit_requested, limit_rationale, credit_conditions[]}` |
| **Trigger** | After SA6.SKL-03 completes |
| **Error Handling** | Limit determination ambiguity → route to Senior Credit Officer HITL |
| **Regulatory Basis** | ABS Credit Policy: Credit limit authority matrix |

---

### 🔧 SA6.SKL-05 — Margin Requirements Calculator

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-05 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Margin Calculation API) |
| **Description** | Calculates initial margin and variation margin requirements for each approved product. Applies exchange-mandated minimums (SGX, HKEx) plus ABS house margin |
| **Input** | `{products_approved, credit_grade, credit_limit_approved, jurisdiction}` |
| **Output** | `{margin_schedule: [{product, initial_margin_pct, variation_margin_pct, margin_call_threshold}]}` |
| **Trigger** | After SA6.SKL-04 completes |
| **Error Handling** | Exchange margin data unavailable → use last known values from KB-4 with timestamp warning |
| **MCP Tool** | `calculate_margin_requirements` |
| **Regulatory Basis** | MAS SFA: Exchange-mandated margin requirements |

---

### 🔧 SA6.SKL-06 — Credit Approval Recorder

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-06 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Credit System API) |
| **Description** | Records the credit decision in the ABS credit system with full audit trail: model used, score, grade, limit, approver, conditions, validity period |
| **Input** | `{case_id, credit_grade, credit_limit_approved, products_approved, margin_schedule, credit_conditions}` |
| **Output** | `{credit_reference, recorded_at, valid_until, credit_system_url}` |
| **Trigger** | After all credit determinations complete |
| **Error Handling** | Recording failure → retry 2× → alert Credit Operations |
| **MCP Tool** | `create_credit_approval` |

---

### 👤 SA6.SKL-07 — Credit HITL Escalator

| Field | Detail |
|---|---|
| **Skill ID** | SA6.SKL-07 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API) |
| **Description** | Creates a HITL task for the Senior Credit Officer when: credit limit requested is above delegated authority, credit grade is D or NR, complex multi-product structure requires manual review, or client is in a high-risk jurisdiction |
| **Input** | `{case_id, escalation_reason, credit_score, credit_grade, limit_requested, financial_summary, kyc_risk_rating}` |
| **Output** | `{hitl_task_id, assigned_sco_id, sla_deadline, escalation_reason}` |
| **Trigger** | Constitutional Rule H-6 (credit above delegated authority), or credit_grade = D/NR |
| **Error Handling** | No SCO available → escalate to Head of Credit |
| **MCP Tool** | `create_hitl_task` |

---

## SA-7 — TMO Static Data Agent (Node N-3b)

> **Role:** Sets up trading system static data (entity records, settlement instructions, product configuration).
> **Dify Type:** Workflow (WF) — Parallel Stream B
> **Total Skills:** 7

---

### 🔧 SA7.SKL-01 — UBIX Entity Deduplicator

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-01 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (UBIX Entity API) |
| **Description** | Searches UBIX trading system for any existing entity records matching the client (by registration number, legal name, aliases). Prevents duplicate entity creation |
| **Input** | `{legal_name, registration_number, jurisdiction, aliases[]}` |
| **Output** | `{existing_entity_found: bool, existing_entity_id: str, match_confidence: float, match_details}` |
| **Trigger** | First step in N-3b execution |
| **Error Handling** | UBIX API unavailable → retry 3× → escalate to TMO Ops Manager |
| **MCP Tool** | `search_ubix_entity` |

---

### 🔧 SA7.SKL-02 — UBIX Entity Creator / Merger

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-02 |
| **Category** | Tool + HITL |
| **Dify Node** | HTTP Request Node (UBIX Entity API) + IF/ELSE Node |
| **Description** | Creates a new UBIX entity record if none exists (SA7.SKL-01 = not found). If an existing record is found, raises HITL for human decision on whether to merge or create separately. Never auto-merges — constitutional rule H-7 |
| **Input** | `{case_id, entity_data, kyc_output, existing_entity_found, existing_entity_id}` |
| **Output** | `{ubix_entity_id, entity_action: CREATED\|LINKED\|PENDING_MERGE_HITL, created_at}` |
| **Trigger** | After SA7.SKL-01 |
| **Error Handling** | Creation failure → retry 3× → escalate to TMO Ops Manager |
| **MCP Tool** | `create_ubix_entity` |
| **Regulatory Basis** | Data integrity — HITL required for entity merges (Constitutional Rule H-7) |

---

### 🔧 SA7.SKL-03 — Settlement Instruction Validator

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-03 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Settlement Validation API) |
| **Description** | Validates the client's submitted settlement/banking instructions: SWIFT BIC validation, IBAN check, account name match, correspondent bank verification |
| **Input** | `{bank_name, account_number, swift_code, iban, currency, account_holder_name}` |
| **Output** | `{validation_status: VALID\|INVALID\|REQUIRES_VERIFICATION, validation_details, swift_valid, iban_valid, name_match_score}` |
| **Trigger** | After SA7.SKL-01 (concurrent with SA7.SKL-02) |
| **Error Handling** | Validation API failure → flag for manual verification; do not block entity creation |
| **MCP Tool** | `validate_settlement_instructions` |
| **Regulatory Basis** | MAS: Correspondent banking due diligence |

---

### 🔧 SA7.SKL-04 — SIC Counterparty Registrar

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (SIC Config API) |
| **Description** | Creates the counterparty record in the SIC (Settlement and Instruction Control) system with all settlement instructions, counterparty codes, and product mappings |
| **Input** | `{ubix_entity_id, entity_data, settlement_instructions_validated, products_approved}` |
| **Output** | `{sic_counterparty_id, sic_settlement_codes[], created_at}` |
| **Trigger** | After SA7.SKL-02 (UBIX entity available) and SA7.SKL-03 (settlement instructions validated) |
| **Error Handling** | SIC API failure → retry 3× → escalate to TMO Ops Manager |
| **MCP Tool** | `setup_sic_counterparty` |

---

### 📚 SA7.SKL-05 — Product Static Configurator

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-05 |
| **Category** | Knowledge + Tool |
| **Dify Node** | Knowledge Retrieval Node (KB-5, KB-8) + HTTP Request Node |
| **Description** | Configures product-specific static data for each approved product: contract specifications, settlement conventions, haircuts, trading limits. Uses KB-5 for product rules and KB-8 for system configuration |
| **Input** | `{ubix_entity_id, sic_counterparty_id, products_approved, credit_output_N3a}` |
| **Output** | `{products_configured: [{product, ubix_config_id, sic_config_id, parameters_set}]}` |
| **Trigger** | After SA7.SKL-04 (SIC counterparty registered) |
| **Error Handling** | Product config failure → retry for that product; other products proceed |
| **KB Used** | KB-5: Product Rules; KB-8: System Configuration |
| **MCP Tool** | `configure_product_static` |

---

### 🧠 SA7.SKL-06 — Static Data Completeness Verifier

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-06 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Haiku) + Code Node |
| **Description** | Verifies that all required static data has been successfully configured across UBIX and SIC for every approved product. Produces a completeness checklist |
| **Input** | `{products_approved, products_configured, ubix_entity_id, sic_counterparty_id, settlement_instructions_validated}` |
| **Output** | `{tmo_setup_complete: bool, missing_config: [...], incomplete_products: [...]}` |
| **Trigger** | After SA7.SKL-05 (all product configurations attempted) |
| **Error Handling** | Verification failure for any product → flag as incomplete; escalate incomplete products to TMO Ops |

---

### 👤 SA7.SKL-07 — TMO HITL Task Creator

| Field | Detail |
|---|---|
| **Skill ID** | SA7.SKL-07 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API) |
| **Description** | Creates HITL tasks for TMO Operations Manager when: entity merge decision required (Constitutional Rule H-7), settlement instructions cannot be validated, or static data configuration fails after retry ceiling |
| **Input** | `{case_id, hitl_reason, entity_context, settlement_context, incomplete_config_details}` |
| **Output** | `{hitl_task_id, assigned_tmo_mgr_id, sla_deadline}` |
| **Trigger** | Entity merge required; settlement validation fail; setup failure after ceiling |
| **Error Handling** | Task creation failure → SMS alert to TMO Ops Manager |
| **MCP Tool** | `create_hitl_task` |

---

## SA-5 — Signature Verification Agent (Node N-5)

> **Role:** Prepares signature analysis for mandatory human review. Never auto-approves.
> **Dify Type:** Workflow (WF) — HITL gateway
> **Total Skills:** 7

---

### 🔧 SA5.SKL-01 — Signature Page Extractor

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-01 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Document API — signature extraction) |
| **Description** | Identifies and extracts signature images from each document requiring signatures. Uses AI-based signature region detection to locate signature blocks, signatory fields, and date fields |
| **Input** | `{doc_id, storage_url, signature_page_numbers[], required_signatories[]}` |
| **Output** | `{extracted_signatures: [{doc_id, page_number, signature_image_url, signatory_field_label, date_signed}]}` |
| **Trigger** | First step of N-5 for each document requiring signature |
| **Error Handling** | No signature found on expected page → flag as SIGNATURE_MISSING (not missing document — different alert) |
| **MCP Tool** | `extract_signatures_from_doc` |

---

### 🔧 SA5.SKL-02 — Specimen Signature Retriever

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Signature Repository API) |
| **Description** | Retrieves the authorised specimen signatures for all required signatories from the ABS Signature Repository. Matches by signatory name, role, and entity. Returns specimen images and authority level |
| **Input** | `{authorised_signatory_list: [{name, role, entity}]}` |
| **Output** | `{specimens: [{signatory_id, name, role, specimen_image_url, authority_level, valid_from, valid_until}]}` |
| **Trigger** | Concurrent with SA5.SKL-01 |
| **Error Handling** | Specimen not found → flag as NEW_SIGNATORY (requires additional verification); do not block process |
| **MCP Tool** | `retrieve_specimen_signatures` |
| **Regulatory Basis** | ABS Signature Authority Policy: Only pre-registered signatories are valid |

---

### 🔧 SA5.SKL-03 — AI Similarity Scorer

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-03 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Signature Analysis API) |
| **Description** | Computes a similarity score between each extracted signature and the corresponding specimen signature using AI-based biometric comparison. Score is ADVISORY ONLY — not a binding verification decision |
| **Input** | `{submitted_signature_image_url, specimen_image_url}` (per signature pair) |
| **Output** | `{similarity_score: 0.0-1.0, confidence: HIGH\|MEDIUM\|LOW\|UNCLEAR, anomalies_detected: [...], comparison_method}` |
| **Trigger** | After SA5.SKL-01 and SA5.SKL-02 — for each signature pair |
| **Error Handling** | Comparison API failure → proceed with human review; note API unavailability in HITL package |
| **MCP Tool** | `compute_signature_similarity` |
| **Important** | Output is labelled **ADVISORY ONLY** in all HITL packages — human reviewer makes binding decision |

---

### 🧠 SA5.SKL-04 — Anomaly Detector

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-04 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet — multimodal, image analysis) |
| **Description** | Reviews extracted signatures for anomalies: signs of digital manipulation, whitespace overlay, copy-paste artifacts, inconsistent ink, impossible angles. Generates advisory anomaly report for the human reviewer |
| **Input** | `{extracted_signature_images[], document_context}` |
| **Output** | `{anomalies_detected: [{type, severity: LOW\|MEDIUM\|HIGH, description, affected_signature}], overall_anomaly_risk}` |
| **Trigger** | After SA5.SKL-01 (extracted signatures available) |
| **Error Handling** | LLM analysis failure → proceed with UNKNOWN anomaly risk flag in HITL package |

---

### 🧠 SA5.SKL-05 — Signatory Identifier

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-05 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Haiku) |
| **Description** | Attempts to identify which authorised signatory signed each signature block by cross-referencing extracted name text (printed below signature), signatory field labels, and the authorised signatory list |
| **Input** | `{extracted_signature_labels[], authorised_signatory_list[], printed_name_text}` |
| **Output** | `{identified_signatories: [{signature_location, identified_as, identification_confidence, identification_basis}]}` |
| **Trigger** | After SA5.SKL-01 |
| **Error Handling** | Low identification confidence → mark as UNIDENTIFIED; flag for human reviewer |

---

### 👤 SA5.SKL-06 — HITL Package Assembler & Task Creator

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-06 |
| **Category** | HITL + Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) + HTTP Request Node (Workbench API) |
| **Description** | Assembles a complete Signature Verification HITL package for the human reviewer: AI similarity scores (clearly labelled ADVISORY), anomaly report, signatory identification, authority matrix, all signature image pairs side-by-side. Creates the Workbench HITL task with all supporting materials |
| **Input** | All outputs from SA5.SKL-01 to SA5.SKL-05; `authority_matrix` from KB-7 |
| **Output** | `{hitl_task_id, package_url, reviewer_role: "COMPLIANCE_OFFICER", sla_deadline, documents_in_scope}` |
| **Trigger** | After all signature analysis skills complete — this is always the final step |
| **Error Handling** | Package assembly failure → create minimal HITL task with available materials |
| **MCP Tool** | `create_hitl_task` |
| **KB Used** | KB-7: Authority Matrix |
| **Constitutional Rule** | H-1: Signature verification ALWAYS routes to HITL — never auto-approved |

---

### 🔧 SA5.SKL-07 — Signature Decision Recorder

| Field | Detail |
|---|---|
| **Skill ID** | SA5.SKL-07 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Signature Repository API + Case Management API) |
| **Description** | Records the human reviewer's signature verification decision in the Signature Repository (for audit) and Case Management system. Updates the document-level signature status for each verified/rejected document |
| **Input** | `{hitl_task_id, reviewer_decision, verified_by_employee_id, verified_at, document_level_decisions[]}` |
| **Output** | `{signature_verification_record_id, all_signatures_verified, next_node}` |
| **Trigger** | On HITL task resolution (human submits decision in Workbench) |
| **Error Handling** | Recording failure → retry 3× → alert Compliance Operations |
| **MCP Tool** | `record_signature_decision` |
| **Regulatory Basis** | MAS: Audit record of who verified signatures and when |

---

## SA-8 — Regulatory Configuration Agent (Node N-6)

> **Role:** Applies all regulatory parameters, reporting obligations, and compliance controls to the account.
> **Dify Type:** Workflow (WF)
> **Total Skills:** 8

---

### 📚 SA8.SKL-01 — Regulatory Rule Engine

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-01 |
| **Category** | Knowledge |
| **Dify Node** | Knowledge Retrieval Node (KB-3, KB-5) + LLM Node |
| **Description** | Retrieves and applies all regulatory rules applicable to this account: MAS SFA rules, MAS Notice requirements, HKMA requirements (for HKG), product-specific regulations (MAS FCA for futures, SFA for OTC), and ABS internal policies |
| **Input** | `{account_type, jurisdiction, products_approved, entity_type, cdd_level, risk_rating}` |
| **Output** | `{applicable_rules: [{rule_id, rule_name, regulatory_basis, parameters_required, obligation_type}]}` |
| **Trigger** | First step in N-6 |
| **Error Handling** | Incomplete rule retrieval → escalate to Compliance Officer for manual review |
| **KB Used** | KB-3: Regulatory Requirements; KB-5: Product Rules |
| **MCP Tool** | `get_regulatory_rules` |

---

### 🔧 SA8.SKL-02 — CLS Setup Executor

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (CLS API) |
| **Description** | Sets up the client as a CLS-eligible counterparty in the Continuous Linked Settlement system (applicable for FX and multi-currency products). Registers payment netting instructions and settlement currencies |
| **Input** | `{ubix_entity_id, sic_counterparty_id, products_approved, settlement_currencies, jurisdiction}` |
| **Output** | `{cls_counterparty_id, cls_settlement_currencies[], cls_setup_at}` |
| **Trigger** | If products include FX or multi-currency derivatives |
| **Error Handling** | CLS API failure → retry 2× → escalate; account can proceed but FX products restricted until CLS done |
| **MCP Tool** | `configure_cls` |
| **Regulatory Basis** | BCBS/IOSCO: Reduction of settlement risk via CLS |

---

### 🔧 SA8.SKL-03 — Regulatory Margin Rule Setter

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-03 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Margin System API) |
| **Description** | Applies regulatory margin rules to the account beyond the credit-determined margins: EMIR/MAS uncleared OTC margin rules, exchange-mandated position limits, concentration limits |
| **Input** | `{ubix_entity_id, products_approved, credit_margin_schedule, regulatory_rules}` |
| **Output** | `{margin_rules_applied: [{product, regulatory_initial_margin, regulatory_variation_margin, basis}]}` |
| **Trigger** | After SA8.SKL-01 (rules identified) |
| **Error Handling** | Margin API failure → retry 2× → use last known regulatory minimums from KB-3 |
| **MCP Tool** | `set_margin_rules` |
| **Regulatory Basis** | MAS SFA: Mandatory margin requirements for derivatives |

---

### 🔧 SA8.SKL-04 — Trade Reporting Flag Configurator

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Regulatory Reporting System API) |
| **Description** | Sets all trade reporting flags on the account: MAS trade repository reporting (for OTC derivatives), HKMA trade reporting (for HKG), MiFID II reporting flags (for EU-connected counterparties), transaction reporting |
| **Input** | `{ubix_entity_id, entity_type, jurisdiction, products_approved, regulatory_rules}` |
| **Output** | `{reporting_flags_set: [{regulation, report_type, reporting_frequency, repository, effective_from}]}` |
| **Trigger** | After SA8.SKL-01 |
| **Error Handling** | Flag configuration failure → alert Regulatory Reporting team; account cannot go live without correct flags |
| **MCP Tool** | `configure_reporting_flags` |
| **Regulatory Basis** | MAS SFA 04-N02: Trade repository reporting obligations |

---

### 🔧 SA8.SKL-05 — Position Limit Configurator

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-05 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Risk System API) |
| **Description** | Sets regulatory and ABS-internal position limits on the account for each product: single contract limits, net position limits, concentration limits, large trader reporting thresholds |
| **Input** | `{ubix_entity_id, products_approved, credit_limit_approved, regulatory_rules, client_classification}` |
| **Output** | `{position_limits: [{product, single_contract_limit, net_position_limit, concentration_limit, large_trader_threshold}]}` |
| **Trigger** | After SA8.SKL-01 |
| **Error Handling** | API failure → retry 2× → set conservative default limits from KB-3 + flag for manual override |
| **MCP Tool** | `set_position_limits` |
| **Regulatory Basis** | MAS SFA: Position limit controls; exchange rules |

---

### 📚 SA8.SKL-06 — Product Restriction Applier

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-06 |
| **Category** | Knowledge + Tool |
| **Dify Node** | Knowledge Retrieval Node (KB-5) + Code Node |
| **Description** | Applies any product-specific restrictions derived from regulatory rules: e.g., retail clients cannot trade certain OTC products, restricted entities may not trade certain commodities, accredited investor confirmations required for complex products |
| **Input** | `{products_approved, entity_type, client_classification, regulatory_rules, kyc_risk_rating}` |
| **Output** | `{product_restrictions: [{product, restriction_type, restriction_basis, can_be_lifted_by}]}` |
| **Trigger** | After SA8.SKL-01 |
| **Error Handling** | KB failure → apply conservative restrictions; flag for Compliance review |
| **KB Used** | KB-5: Product Rules |
| **Regulatory Basis** | MAS SFA: Product access controls |

---

### 🧠 SA8.SKL-07 — Regulatory Config Verifier

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-07 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) |
| **Description** | Reviews all configured regulatory parameters across SKL-02 to SKL-06 for internal consistency and completeness. Identifies any gaps, conflicts, or missing configurations before the case proceeds to activation |
| **Input** | Outputs from all SA8 configuration skills |
| **Output** | `{config_complete: bool, gaps_identified: [...], conflicts_detected: [...], compliance_sign_off_required: bool}` |
| **Trigger** | After all configuration skills complete |
| **Error Handling** | Verification failure → escalate to Compliance Officer |

---

### 👤 SA8.SKL-08 — Compliance HITL Escalator

| Field | Detail |
|---|---|
| **Skill ID** | SA8.SKL-08 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API) |
| **Description** | Creates a Compliance Officer HITL task when: novel product/jurisdiction combination has no precedent in KB-3, conflicting regulatory requirements require judgment, compliance_sign_off_required = True, or after retry ceiling |
| **Input** | `{case_id, escalation_reason, regulatory_gaps, conflicts, config_summary}` |
| **Output** | `{hitl_task_id, assigned_co_id, sla_deadline}` |
| **Trigger** | SA8.SKL-07 returns compliance_sign_off_required or gaps/conflicts found |
| **Error Handling** | Task creation failure → alert Head of Compliance directly |
| **MCP Tool** | `create_hitl_task` |

---

## SA-9 — Activation Review Agent (Node N-7)

> **Role:** Compiles the complete case dossier and presents it to senior management for final activation approval.
> **Dify Type:** Workflow (WF) — HITL gateway
> **Total Skills:** 7

---

### 🧠 SA9.SKL-01 — Case Dossier Compiler

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-01 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) + HTTP Request Node (Case Dossier API) |
| **Description** | Compiles all node outputs (N-0 through N-6) into a comprehensive, well-structured activation dossier for the senior approver. Includes executive summary, key metrics, risk flags, outstanding conditions, and complete case timeline |
| **Input** | `{partial_outputs: {N-0 through N-6 outputs}, case_attributes, sla_tracking}` |
| **Output** | `{dossier_id, executive_summary, case_timeline, key_metrics_table, outstanding_conditions[], dossier_url}` |
| **Trigger** | First step in N-7 execution |
| **Error Handling** | Missing node output → clearly mark as MISSING in dossier; do not fabricate data |
| **MCP Tool** | `compile_case_dossier` |

---

### 🔧 SA9.SKL-02 — Aggregate Risk Scorer

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Risk Aggregation API) |
| **Description** | Computes a composite risk score across all dimensions: KYC risk, credit risk, product risk, regulatory risk, operational risk. Produces a multi-dimensional risk matrix for the approver |
| **Input** | `{kyc_risk_rating, credit_grade, products_approved, regulatory_flags, sla_breaches, hitl_count}` |
| **Output** | `{aggregate_risk_score, risk_dimensions: {kyc, credit, product, regulatory, operational}, risk_matrix_url}` |
| **Trigger** | After SA9.SKL-01 |
| **Error Handling** | API failure → LLM-based risk synthesis with uncertainty flag |
| **MCP Tool** | `calculate_aggregate_risk` |

---

### 🧠 SA9.SKL-03 — AI Activation Recommender

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-03 |
| **Category** | Cognitive |
| **Dify Node** | LLM Node (Claude Sonnet) |
| **Description** | Based on the compiled dossier and risk scores, generates an AI recommendation (APPROVE / APPROVE_WITH_CONDITIONS / REJECT / SEEK_MORE_INFO) with detailed rationale. This recommendation is ADVISORY — the human makes the final binding decision |
| **Input** | `{dossier_summary, aggregate_risk_score, outstanding_conditions, credit_grade, kyc_status, regulatory_config_complete}` |
| **Output** | `{ai_recommendation, ai_recommendation_rationale, conditions_if_approve[], seek_info_items_if_deferred[]}` |
| **Trigger** | After SA9.SKL-02 |
| **Error Handling** | LLM reasoning failure → recommendation = "SEEK_MORE_INFO" with "Unable to generate recommendation" note |
| **Important** | Output labelled ADVISORY in HITL task — human approver not bound by AI recommendation |

---

### 🔧 SA9.SKL-04 — Approval Authority Validator

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (HR + Governance API) |
| **Description** | Determines the appropriate approver role based on credit limit, risk rating, and ABS delegated authority matrix. Validates that the assigned approver has the requisite authority level. Prevents under-authority approvals |
| **Input** | `{credit_limit_approved, aggregate_risk_score, account_type, jurisdiction}` |
| **Output** | `{required_approver_role, required_authority_level, authority_matrix_reference}` |
| **Trigger** | After SA9.SKL-03 |
| **Error Handling** | Authority lookup failure → default to DCE COO (highest authority) |
| **MCP Tool** | `check_approval_authority` |
| **Regulatory Basis** | ABS Governance Framework: Delegated authority matrix |

---

### 👤 SA9.SKL-05 — Activation HITL Task Creator

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-05 |
| **Category** | HITL |
| **Dify Node** | HTTP Request Node (Workbench API) |
| **Description** | Creates the Activation Review HITL task in the Workbench for the senior approver. Attaches the full dossier, risk matrix, AI recommendation, and all supporting documents. Routes to the correct approver per authority matrix |
| **Input** | `{case_id, dossier_url, risk_matrix_url, ai_recommendation, required_approver_role, sla_deadline}` |
| **Output** | `{hitl_task_id, assigned_approver_id, assigned_approver_name, task_url, sla_deadline}` |
| **Trigger** | After SA9.SKL-04 — this is always the terminal step of N-7 pre-HITL processing |
| **Error Handling** | Task creation failure → direct email to DCE COO with dossier link |
| **MCP Tool** | `create_activation_task` |
| **Constitutional Rule** | H-2: Activation ALWAYS requires human approval — no auto-approve path |

---

### 🔧 SA9.SKL-06 — Activation Decision Recorder

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-06 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (Case Management API + Audit API) |
| **Description** | Records the senior approver's activation decision with full audit trail: decision, rationale, approver identity, timestamp, conditions attached, digital signature of the decision record |
| **Input** | `{hitl_task_id, activation_decision, conditions[], rejection_reason, approved_by_employee_id, approved_at}` |
| **Output** | `{activation_record_id, decision_hash, audit_trail_url, next_node}` |
| **Trigger** | On HITL task resolution — human submits decision in Workbench |
| **Error Handling** | Recording failure → retry 3× → alert Chief Operating Officer directly |
| **MCP Tool** | `record_activation_decision` |
| **Regulatory Basis** | MAS TRM: Senior management accountability; decision audit trail |

---

### 📊 SA9.SKL-07 — Rejection Notifier

| Field | Detail |
|---|---|
| **Skill ID** | SA9.SKL-07 |
| **Category** | Observability |
| **Dify Node** | LLM Node (Claude Haiku) + HTTP Request Node (Notification API) |
| **Description** | If activation is rejected, generates a professionally worded rejection notification for the RM (and client if appropriate), explaining the outcome without disclosing confidential credit or compliance information. Closes the case as DEAD |
| **Input** | `{case_id, rejection_reason, rm_id, client_name, approved_by_employee_id, disclosure_constraints}` |
| **Output** | `{notification_sent_to: [...], notification_ids, case_closed_as: "DEAD"}` |
| **Trigger** | When activation_decision = REJECTED |
| **Error Handling** | Notification failure → Workbench task for RM to notify manually |
| **MCP Tool** | `send_notification`, `close_case` |

---

## SA-3 — Downstream Provisioning Agent (Node N-8)

> **Role:** Activates the account across all downstream trading and settlement systems.
> **Dify Type:** Workflow (WF) — fully automated
> **Total Skills:** 9

---

### 🔧 SA3.SKL-01 — UBIX Account Activator

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-01 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (UBIX Entity API) |
| **Description** | Activates the UBIX entity record: transitions from PENDING to ACTIVE status, applies approved products, credit limits, margin rules, position limits, and go-live timestamp |
| **Input** | `{ubix_entity_id, credit_limit_approved, products_approved, margin_rules, position_limits, activation_decision_record_id}` |
| **Output** | `{ubix_entity_id, ubix_status: "ACTIVE", go_live_timestamp, activated_products[]}` |
| **Trigger** | First provisioning step after N-7 APPROVED |
| **Error Handling** | Retry 3× (independent of other systems); failure → escalate to Technology Ops; partial states → no rollback (forward-only) |
| **MCP Tool** | `provision_ubix` |

---

### 🔧 SA3.SKL-02 — CLS Counterparty Activator

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-02 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (CLS API) |
| **Description** | Activates the CLS counterparty record, enables FX settlement netting, and registers the effective date for CLS eligibility |
| **Input** | `{cls_counterparty_id, activation_date, settlement_currencies[]}` |
| **Output** | `{cls_status: "ACTIVE", effective_date, cls_reference}` |
| **Trigger** | Concurrent with SA3.SKL-01 (independent retry) |
| **Error Handling** | Retry 3×; if CLS unavailable → account activated without CLS (FX restricted); alert TMO |
| **MCP Tool** | `provision_cls` |

---

### 🔧 SA3.SKL-03 — CQG Terminal Provisioner

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-03 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (CQG Account API) |
| **Description** | Creates or activates the CQG trading terminal account for the client. Links to UBIX entity, sets product access, configures market data entitlements |
| **Input** | `{ubix_entity_id, products_approved, client_name, entity_type, market_data_entitlements}` |
| **Output** | `{cqg_account_id, cqg_login, market_data_status, activated_products[]}` |
| **Trigger** | Concurrent with SA3.SKL-01 (independent retry) |
| **Error Handling** | Retry 3×; CQG failure → alert Technology Ops; account active but terminal access pending |
| **MCP Tool** | `provision_cqg` |

---

### 🔧 SA3.SKL-04 — SIC Settlement Activator

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-04 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (SIC Config API) |
| **Description** | Activates the SIC counterparty record, enables settlement instruction processing, and confirms SWIFT connectivity |
| **Input** | `{sic_counterparty_id, settlement_instructions_validated, products_configured[]}` |
| **Output** | `{sic_status: "ACTIVE", settlement_routes_confirmed[], swift_connectivity_status}` |
| **Trigger** | Concurrent with SA3.SKL-01 (independent retry) |
| **Error Handling** | Retry 3×; SIC failure → alert Settlement Operations |
| **MCP Tool** | `provision_sic` |

---

### 🔧 SA3.SKL-05 — CV Credit Limit Provisioner

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-05 |
| **Category** | Tool |
| **Dify Node** | HTTP Request Node (CV Limit API) |
| **Description** | Sets the approved credit limit in the CV (Credit Value Adjustment) system, enabling real-time credit exposure monitoring and pre-trade limit checks |
| **Input** | `{ubix_entity_id, credit_limit_approved, credit_grade, margin_rules, products_approved}` |
| **Output** | `{cv_limit_id, credit_limit_set, pre_trade_check_enabled, cv_reference}` |
| **Trigger** | Concurrent with SA3.SKL-01 (independent retry) |
| **Error Handling** | Retry 3×; CV failure → account cannot trade until limit set; escalate immediately |
| **MCP Tool** | `provision_cv_limit` |

---

### 🔧 SA3.SKL-06 — Provisioning Status Aggregator

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-06 |
| **Category** | Tool + Cognitive |
| **Dify Node** | Code Node (aggregation logic) |
| **Description** | Aggregates the provisioning results from all downstream systems (SA3.SKL-01 to SA3.SKL-05). Determines overall provisioning status: all success, partial success, or full failure |
| **Input** | `{ubix_result, cls_result, cqg_result, sic_result, cv_result}` |
| **Output** | `{all_systems_provisioned: bool, partial_provisioning: bool, failed_systems: [...], provisioning_summary}` |
| **Trigger** | After all parallel provisioning skills complete (Parallel JOIN) |
| **Error Handling** | Aggregation logic failure → default to partial_provisioning = True; manual review |

---

### 🔧 SA3.SKL-07 — Failed System Retry Handler

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-07 |
| **Category** | Tool |
| **Dify Node** | Code Node (retry loop) + HTTP Request Nodes (per failed system) |
| **Description** | For any systems that failed in the initial provisioning round, executes targeted retries up to the per-system ceiling (3 retries independent of each other). Only retries failed systems — does not re-provision successful systems |
| **Input** | `{failed_systems: [...], case_id, activation_record_id}` |
| **Output** | `{retry_results: [{system, attempt, status}], remaining_failures: [...]}` |
| **Trigger** | When SA3.SKL-06 returns `partial_provisioning = True` |
| **Error Handling** | After 3 retries per system → escalate that system to Technology Ops; case proceeds as partial |

---

### 📊 SA3.SKL-08 — Technology Ops Escalator

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-08 |
| **Category** | Observability |
| **Dify Node** | HTTP Request Node (Notification API + Workbench API) |
| **Description** | For any downstream system that fails after all retries, creates a Technology Operations incident ticket, notifies the on-call Technology team, and creates a Workbench task for manual provisioning follow-up |
| **Input** | `{failed_systems: [...], system_error_details, case_id, case_summary}` |
| **Output** | `{incident_ids: [...], notified_parties, workbench_tasks_created}` |
| **Trigger** | When SA3.SKL-07 returns any remaining_failures |
| **Error Handling** | Escalation notification failure → SMS to Technology Ops on-call lead |
| **MCP Tool** | `create_incident_ticket`, `send_notification` |

---

### 📊 SA3.SKL-09 — Go-Live Event Publisher

| Field | Detail |
|---|---|
| **Skill ID** | SA3.SKL-09 |
| **Category** | Observability |
| **Dify Node** | HTTP Request Node (Kafka REST Proxy) + Code Node |
| **Description** | Publishes the account go-live event to the `dce.ao.account.activated` Kafka topic for consumption by downstream systems: reporting, risk monitoring, BI dashboards. Triggers the DONE terminal path in the Domain Orchestrator |
| **Input** | `{case_id, ubix_entity_id, go_live_timestamp, products_activated, credit_limit, client_name}` |
| **Output** | `{kafka_offset, event_id, next_node: "DONE"}` |
| **Trigger** | After SA3.SKL-06 confirms all critical systems provisioned (or partial with non-critical systems) |
| **Error Handling** | Kafka publish failure → write to dead-letter table + alert; account still considered live |
| **Regulatory Basis** | Internal reporting obligations; downstream risk monitoring |

---

## Agent Skills Master Table

### Complete Skills Inventory — All Agents

| Skill ID | Agent | Skill Name | Category | Dify Node | MCP Tool |
|---|---|---|---|---|---|
| ORCH.SKL-01 | Orchestrator | Case State Reader | Integration | Code Node | — |
| ORCH.SKL-02 | Orchestrator | Next Node Router | Cognitive | LLM + IF/ELSE | — |
| ORCH.SKL-03 | Orchestrator | HITL Queue Manager | HITL | HTTP Request | Workbench API |
| ORCH.SKL-04 | Orchestrator | Parallel Stream Coordinator | Integration | Parallel + Aggregator | — |
| ORCH.SKL-05 | Orchestrator | SLA Monitor & Alerter | Observability | Code Node | Notification API |
| ORCH.SKL-06 | Orchestrator | Event Publisher | Observability | HTTP Request | Kafka REST |
| ORCH.SKL-07 | Orchestrator | Escalation Handler | Tool | HTTP Request | Notification + Workbench |
| ORCH.SKL-08 | Orchestrator | Crash Recovery Orchestrator | Cognitive | Code Node | — |
| SA1.SKL-01 | SA-1 | Email Ingestion & Parsing | Tool | HTTP Request | MS Graph API |
| SA1.SKL-02 | SA-1 | Account Type Classifier | Cognitive | LLM Node | — |
| SA1.SKL-03 | SA-1 | Priority Assessor | Cognitive | LLM Node | — |
| SA1.SKL-04 | SA-1 | Case Record Creator | Tool | HTTP Request | `create_case` |
| SA1.SKL-05 | SA-1 | RM & Manager Linker | Tool | HTTP Request | `assign_rm` |
| SA1.SKL-06 | SA-1 | Document Pre-Stager | Tool | HTTP Request | `stage_documents` |
| SA1.SKL-07 | SA-1 | Intake Notifier | Observability | HTTP Request | `send_notification` |
| SA1.SKL-08 | SA-1 | Portal Submission Handler | Cognitive + Tool | HTTP Request | Portal API |
| SA1.SKL-09 | SA-1 | Closure & Go-Live Notifier | Observability | HTTP Request | `send_notification`, `close_case` |
| SA2.SKL-01 | SA-2 | Checklist Generator | Knowledge | KB Retrieval | `get_document_checklist` |
| SA2.SKL-02 | SA-2 | OCR & Metadata Extractor | Tool | HTTP Request | `extract_document_metadata` |
| SA2.SKL-03 | SA-2 | Completeness Assessor | Cognitive | LLM Node | — |
| SA2.SKL-04 | SA-2 | Document Validity Checker | Tool | HTTP Request | `validate_document_expiry` |
| SA2.SKL-05 | SA-2 | Rejection Reasoner | Cognitive | LLM Node | — |
| SA2.SKL-06 | SA-2 | Document Flagging Tool | Tool | HTTP Request | `flag_document_for_review` |
| SA2.SKL-07 | SA-2 | RM Chase Composer | HITL + Cognitive | LLM + HTTP | `send_notification` |
| SA2.SKL-08 | SA-2 | Document Completeness Decision Maker | Cognitive | LLM + IF/ELSE | — |
| SA4.SKL-01 | SA-4 | Entity Sanctions Screener | Tool | Tool Call (AG) | `screen_entity` |
| SA4.SKL-02 | SA-4 | Individual Sanctions & PEP Screener | Tool | Tool Call (AG) | `screen_individual` |
| SA4.SKL-03 | SA-4 | Adverse Media Scanner | Tool | Tool Call (AG) | `get_adverse_media` |
| SA4.SKL-04 | SA-4 | Regulatory CDD Rule Lookup | Knowledge | KB Retrieval | — |
| SA4.SKL-05 | SA-4 | Risk Rating Calculator | Cognitive + Tool | HTTP + LLM | `calculate_risk_rating` |
| SA4.SKL-06 | SA-4 | EDD Trigger Identifier | Cognitive | LLM Node | — |
| SA4.SKL-07 | SA-4 | Compliance Officer Assigner | HITL | HTTP Request | `assign_compliance_officer` |
| SA4.SKL-08 | SA-4 | EDD Task Creator | Tool | HTTP Request | `create_edd_task` |
| SA4.SKL-09 | SA-4 | KYC Disposition Synthesiser | Cognitive | LLM + Code Node | — |
| SA6.SKL-01 | SA-6 | Credit Model Selector | Knowledge | KB Retrieval | `get_credit_model` |
| SA6.SKL-02 | SA-6 | Credit Scorer | Tool | HTTP Request | `run_credit_scoring` |
| SA6.SKL-03 | SA-6 | Product Eligibility Assessor | Knowledge | KB Retrieval + Code | `get_product_eligibility` |
| SA6.SKL-04 | SA-6 | Credit Limit Determiner | Cognitive | LLM + HTTP | — |
| SA6.SKL-05 | SA-6 | Margin Requirements Calculator | Tool | HTTP Request | `calculate_margin_requirements` |
| SA6.SKL-06 | SA-6 | Credit Approval Recorder | Tool | HTTP Request | `create_credit_approval` |
| SA6.SKL-07 | SA-6 | Credit HITL Escalator | HITL | HTTP Request | `create_hitl_task` |
| SA7.SKL-01 | SA-7 | UBIX Entity Deduplicator | Tool | HTTP Request | `search_ubix_entity` |
| SA7.SKL-02 | SA-7 | UBIX Entity Creator / Merger | Tool + HITL | HTTP + IF/ELSE | `create_ubix_entity` |
| SA7.SKL-03 | SA-7 | Settlement Instruction Validator | Tool | HTTP Request | `validate_settlement_instructions` |
| SA7.SKL-04 | SA-7 | SIC Counterparty Registrar | Tool | HTTP Request | `setup_sic_counterparty` |
| SA7.SKL-05 | SA-7 | Product Static Configurator | Knowledge + Tool | KB + HTTP | `configure_product_static` |
| SA7.SKL-06 | SA-7 | Static Data Completeness Verifier | Cognitive | LLM + Code | — |
| SA7.SKL-07 | SA-7 | TMO HITL Task Creator | HITL | HTTP Request | `create_hitl_task` |
| SA5.SKL-01 | SA-5 | Signature Page Extractor | Tool | HTTP Request | `extract_signatures_from_doc` |
| SA5.SKL-02 | SA-5 | Specimen Signature Retriever | Tool | HTTP Request | `retrieve_specimen_signatures` |
| SA5.SKL-03 | SA-5 | AI Similarity Scorer | Tool | HTTP Request | `compute_signature_similarity` |
| SA5.SKL-04 | SA-5 | Anomaly Detector | Cognitive | LLM Node (multimodal) | — |
| SA5.SKL-05 | SA-5 | Signatory Identifier | Cognitive | LLM Node | — |
| SA5.SKL-06 | SA-5 | HITL Package Assembler & Task Creator | HITL + Cognitive | LLM + HTTP | `create_hitl_task` |
| SA5.SKL-07 | SA-5 | Signature Decision Recorder | Tool | HTTP Request | `record_signature_decision` |
| SA8.SKL-01 | SA-8 | Regulatory Rule Engine | Knowledge | KB Retrieval + LLM | `get_regulatory_rules` |
| SA8.SKL-02 | SA-8 | CLS Setup Executor | Tool | HTTP Request | `configure_cls` |
| SA8.SKL-03 | SA-8 | Regulatory Margin Rule Setter | Tool | HTTP Request | `set_margin_rules` |
| SA8.SKL-04 | SA-8 | Trade Reporting Flag Configurator | Tool | HTTP Request | `configure_reporting_flags` |
| SA8.SKL-05 | SA-8 | Position Limit Configurator | Tool | HTTP Request | `set_position_limits` |
| SA8.SKL-06 | SA-8 | Product Restriction Applier | Knowledge + Tool | KB + Code | — |
| SA8.SKL-07 | SA-8 | Regulatory Config Verifier | Cognitive | LLM Node | — |
| SA8.SKL-08 | SA-8 | Compliance HITL Escalator | HITL | HTTP Request | `create_hitl_task` |
| SA9.SKL-01 | SA-9 | Case Dossier Compiler | Cognitive | LLM + HTTP | `compile_case_dossier` |
| SA9.SKL-02 | SA-9 | Aggregate Risk Scorer | Tool | HTTP Request | `calculate_aggregate_risk` |
| SA9.SKL-03 | SA-9 | AI Activation Recommender | Cognitive | LLM Node | — |
| SA9.SKL-04 | SA-9 | Approval Authority Validator | Tool | HTTP Request | `check_approval_authority` |
| SA9.SKL-05 | SA-9 | Activation HITL Task Creator | HITL | HTTP Request | `create_activation_task` |
| SA9.SKL-06 | SA-9 | Activation Decision Recorder | Tool | HTTP Request | `record_activation_decision` |
| SA9.SKL-07 | SA-9 | Rejection Notifier | Observability | LLM + HTTP | `send_notification`, `close_case` |
| SA3.SKL-01 | SA-3 | UBIX Account Activator | Tool | HTTP Request | `provision_ubix` |
| SA3.SKL-02 | SA-3 | CLS Counterparty Activator | Tool | HTTP Request | `provision_cls` |
| SA3.SKL-03 | SA-3 | CQG Terminal Provisioner | Tool | HTTP Request | `provision_cqg` |
| SA3.SKL-04 | SA-3 | SIC Settlement Activator | Tool | HTTP Request | `provision_sic` |
| SA3.SKL-05 | SA-3 | CV Credit Limit Provisioner | Tool | HTTP Request | `provision_cv_limit` |
| SA3.SKL-06 | SA-3 | Provisioning Status Aggregator | Tool + Cognitive | Code Node | — |
| SA3.SKL-07 | SA-3 | Failed System Retry Handler | Tool | Code + HTTP | — |
| SA3.SKL-08 | SA-3 | Technology Ops Escalator | Observability | HTTP Request | `create_incident_ticket` |
| SA3.SKL-09 | SA-3 | Go-Live Event Publisher | Observability | HTTP Request | Kafka REST |

---

### Skills Count by Agent

| Agent | Node | Cognitive | Tool | Knowledge | Integration | HITL | Observability | **Total** |
|---|---|---|---|---|---|---|---|---|
| Domain Orchestrator | — | 2 | 1 | 0 | 1 | 1 | 2 | **8** (+ SKL-08 dual) |
| SA-1 Intake & Triage | N-0 | 3 | 3 | 0 | 0 | 0 | 3 | **9** |
| SA-2 Document Collection | N-1 | 3 | 2 | 1 | 0 | 1 | 0 | **8** (+ dual) |
| SA-4 KYC/CDD | N-2 | 3 | 3 | 1 | 0 | 1 | 0 | **9** (+ dual) |
| SA-6 Credit Assessment | N-3a | 2 | 3 | 1 | 0 | 1 | 0 | **7** |
| SA-7 TMO Static Data | N-3b | 1 | 3 | 1 | 0 | 1 | 0 | **7** (+ dual) |
| SA-5 Signature Verification | N-5 | 2 | 3 | 0 | 0 | 1 | 0 | **7** (+ dual) |
| SA-8 Regulatory Config | N-6 | 1 | 4 | 2 | 0 | 1 | 0 | **8** |
| SA-9 Activation Review | N-7 | 2 | 3 | 0 | 0 | 1 | 1 | **7** |
| SA-3 Downstream Provisioning | N-8 | 0 | 6 | 0 | 0 | 0 | 3 | **9** |
| **TOTAL** | | **19** | **31** | **6** | **1** | **8** | **9** | **75** |

---

### Skills by Category — Cross-Agent View

| Category | Skills Count | Primary Agents | Purpose |
|---|---|---|---|
| 🧠 **Cognitive** | 19 (25%) | SA-4, SA-1, SA-2 | LLM-based reasoning, classification, analysis |
| 🔧 **Tool** | 31 (41%) | SA-3, SA-4, SA-8 | MCP tool calls, API integrations |
| 📚 **Knowledge** | 6 (8%) | SA-4, SA-6, SA-8 | KB retrieval, regulatory lookup |
| 🔗 **Integration** | 1 (1%) | Orchestrator | Cross-system coordination |
| 👤 **HITL** | 8 (11%) | All agents | Human-in-the-loop management |
| 📊 **Observability** | 9 (12%) | SA-1, SA-3, Orchestrator | Audit, SLA, notifications |

---

---

# Part VII — Workbench UI Integration, Lifecycle Coverage & KPI Framework

---

## 28. Authoritative Agent Identifier Map

This Part VII uses the agent identifiers defined in Parts I–VI (Appendix A) as the authoritative mapping. All references below follow this frozen assignment:

| DAG Node | Sub-Agent | Agent Name | Dify Type |
|---|---|---|---|
| **N-0** | SA-1 | Intake & Triage Agent | Workflow (WF) |
| **N-1** | SA-2 | Document Processing Agent | Workflow (WF) |
| **N-2** | SA-4 | KYC/CDD Assessment Agent | Agent (AG) |
| **N-3a** | SA-6 | Credit Assessment Agent | Workflow (WF) |
| **N-3b** | SA-7 | TMO Static Data Agent | Workflow (WF) |
| **N-4** | — | JOIN Gate (Variable Aggregator) | Variable Aggregator |
| **N-5** | SA-5 | Signature Verification Agent | Workflow (WF) + HITL |
| **N-6** | SA-8 | Regulatory Configuration Agent | Workflow (WF) |
| **N-7** | SA-9 | Activation Review Agent | Workflow (WF) + HITL |
| **N-8** | SA-3 | Downstream Provisioning Agent | Workflow (WF) |

**Cross-cutting capabilities** (not DAG nodes, but invoked by all nodes):

| Capability | Implementation | Described In |
|---|---|---|
| **Notification & Communication** | Orchestrator-dispatched via Kafka + HTTP; each node can trigger notifications as part of its workflow | Section 33 |
| **Audit & Event Logging** | CQRS event store (`ao_event_log`); every node writes audit events via Checkpoint Writer and Kafka publish | Section 23, Section 34 |
| **Completion Gate Validation** | Deterministic code-node check embedded in orchestrator before N-7 invocation | Section 34 |

---

## 29. Complete Lifecycle Phase Matrix

### Full Phase Matrix

The ordering below follows the DAG topology defined in Parts I–VI (N-0 → N-1 → N-2 → N-3a/N-3b → N-4 → N-5 → N-6 → N-7 → N-8 → DONE).

| Phase | DAG Node(s) | Agent(s) | Phase Name | Stakeholder Touchpoints | HITL Type | SLA Window | UI View | Key Outputs | KPI |
|---|---|---|---|---|---|---|---|---|---|
| **P0** | N-0 | SA-1 | Case Intake & Triage | None (automated) | None | 2 hours | Sales Dealer — New Case Card | case_id, account_type, priority, jurisdiction | Intake-to-triage time; classification accuracy |
| **P1** | N-1 | SA-2 | Document Intelligence | Sales Dealer (gap notice); Customer (email) | Conditional (missing docs after 2 attempts) | 24h (STD) / 8h (URG) | Sales Dealer — Doc Status Panel; Customer — Email | completeness_status, gap_items[], extracted_data | First-pass completeness rate; gap resolution cycle time |
| **P2** | N-2 | SA-4 | KYC/CDD Assessment | RM (workbench + chatflow Q&A); Compliance (sanctions hit) | Conditional (PEP/sanctions/EDD/VERY_HIGH risk) | 4h (STD) / 2h (URG) | RM — KYC Review Panel + CF Chat | kyc_status, risk_rating, screening_results, edd_triggers | Screening pass rate; EDD escalation rate; sanctions hit rate |
| **P3a** | N-3a | SA-6 | Credit Assessment | Credit Team (workbench) | Conditional (complex structure / high limit) | 8h (STD) / 4h (URG) | Credit — Limit Setup Panel | credit_grade, limits, margin_rates, conditions | Credit approval rate; avg limit vs requested |
| **P3b** | N-3b | SA-7 | TMO Static Data Setup | TMO Static Team (workbench) | Conditional (entity merge / settlement conflict) | 8h (STD) / 4h (URG) | TMO — Account Setup Panel | ubix_entity_id, sic_counterparty_id, validation_result | Config accuracy rate; system rejection rate |
| **P3-JOIN** | N-4 | — | Parallel Stream Sync | None (structural) | None | N/A | Management — Pipeline Tracker | combined_products, both_streams_status | Parallel completion delta (time between streams) |
| **P4** | N-5 | SA-5 | Signature Verification | COO Desk Support (workbench) | **Mandatory** | 24 hours | Desk Support — Sig Review Panel | verification_results, ai_match_scores, verified_by | AI pre-check accuracy; HITL review turnaround |
| **P5** | N-6 | SA-8 | Regulatory Configuration | Compliance (conditional) | Conditional (conflicting regs / novel combination) | 4 hours | Compliance — Reg Config Review | regulatory_parameters, margin_rules, reporting_flags | Config completeness rate; manual override rate |
| **P6** | N-7 | SA-9 | Activation Review | DCE COO / Relationship Head (workbench) | **Mandatory** (4-eyes) | 24 hours | Management — Activation Panel | activation_decision, case_dossier, risk_flags | Activation approval rate; deferral rate; avg review time |
| **P7** | N-8 | SA-3 | Downstream Provisioning | Tech Ops (on failure only) | None | 2 hours | Management — System Status Panel | provisioning_results, account_go_live_timestamp | System success rate per downstream; avg provisioning time |
| **P8** | Post N-8 | Orchestrator | Welcome Kit & Go-Live | Customer (email); Sales Dealer (workbench); Desk Support (workbench) | None | 1 hour post-activation | Sales Dealer — Account Live Card | welcome_kit_status, delivery_confirmation | Time-to-welcome-kit; email delivery success rate |
| **P9** | Post P8 | Orchestrator | Case Closure & Audit Archive | Audit/Compliance (on demand) | None | Post go-live | Audit — Case Trail View | audit_report, gate_validation_result | Audit completeness score; evidence chain integrity |
| **BG-1** | Post N-8 | Orchestrator | Physical Copy Tracking | COO Desk Support; Customer (email) | None (reminder-based) | Day 7/14/21 reminders | Desk Support — Physical Copy Tracker | reminder_level, outstanding_physical_docs | Physical copy receipt rate; avg days to receipt |
| **BG-2** | Continuous | Orchestrator | SLA Monitoring | All stakeholders (tiered) | None (alert-based) | Continuous | Management — SLA Dashboard | sla_status per case, breach_count, at_risk_cases | SLA compliance rate; avg case age; breach frequency |

---

## 30. Workbench Persona View Specifications

### 30.1 Sales Dealer View

**Purpose:** Case originator — tracks own cases, manages customer communication, sets priority.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **My Cases Queue** | Table: case_id, client_name, status, priority, current_phase, sla_status, created_at, days_open | `ao_case_state` filtered by rm_id | Sort, filter, search, export |
| **New Case Card** | Summary card on case creation: client_name, account_type, products, priority, assigned_rm | N-0 output (`N0Output`) | View details, escalate priority |
| **Document Status Panel** | Per-case: document checklist with status icons per doc (RECEIVED / MISSING / REJECTED / ACCEPTED) | N-1 output (`N1Output.documents[]`) | Trigger gap notice to customer, upload replacement docs |
| **Gap Notice Composer** | Pre-populated email draft: missing items list, document-specific instructions, deadline | N-1 output (`N1Output.missing_mandatory[]`, `rm_chase_message`) | Edit, preview, send via Orchestrator notification dispatch |
| **Case Timeline** | Chronological event feed: every phase entry/exit, every HITL decision, every notification sent | `ao_event_log` for case_id | Scroll, filter by event type |
| **Account Live Card** | Confirmation card: account_ref, products_enabled, go_live_timestamp, welcome_kit_status | N-8 output (SA-3) + Welcome Kit dispatch | View Welcome Kit, download |
| **SLA Indicator** | Traffic-light badge: ON_TRACK (green) / WARNING (amber) / CRITICAL (red) / BREACHED (red flash) | `ao_case_state.sla_tracking` | View SLA breakdown by phase |

**Table Schema — My Cases Queue:**
```
┌────────────┬───────────────────┬─────────────┬──────────┬─────────────────┬───────────┬──────────┬───────────┐
│ Case ID    │ Client Name       │ Account Type│ Priority │ Current Phase   │ SLA Status│ Days Open│ Next Action│
├────────────┼───────────────────┼─────────────┼──────────┼─────────────────┼───────────┼──────────┼───────────┤
│ AO-2026-001│ ABC Trading Pte   │ INST_FUTURES│ STANDARD │ KYC/CDD Review  │ 🟢 ON_TRACK│ 1.2     │ RM Review  │
│ AO-2026-002│ XYZ Fund Mgmt     │ OTC_DERIV   │ URGENT   │ Document Gaps   │ 🟡 WARNING │ 3.5     │ Chase Docs │
│ AO-2026-003│ PQR Corp          │ MULTI_PROD  │ DEFERRED │ Activation HITL │ 🔴 CRITICAL│ 7.0     │ COO Review │
└────────────┴───────────────────┴─────────────┴──────────┴─────────────────┴───────────┴──────────┴───────────┘
```

---

### 30.2 COO Desk Support View

**Purpose:** Signature verification, physical copy oversight, final activation authority.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **Signature Review Queue** | Table: case_id, client_name, signatory_count, flag_count, overall_status, sla_deadline | N-5 pre-check output | Open signature review panel |
| **Signature Review Panel** | Per-signatory card: side-by-side image (submitted vs specimen), AI confidence score (advisory badge), authority status, anomalies list | `SignaturePreCheckResult` per signatory | APPROVE / REJECT / CLARIFY per signatory; add notes |
| **Physical Copy Tracker** | Table: case_id, client_name, outstanding_docs[], reminder_level (Day 7/14/21), last_reminder_sent | `ao_case_state` + physical copy tracking table | Mark received, trigger next reminder, escalate |
| **Escalation Panel** | Incoming escalations: case_id, escalation_source, reason, severity, sla_remaining | `ao_event_log` WHERE event_type = 'NODE_ESCALATED' | Acknowledge, assign, resolve, defer |
| **Activation Queue** | Cases ready for final activation: case_id, client_name, gate_checklist_summary, risk_flags[], ai_recommendation | N-7 CaseDossier (SA-9) + Completion Gate validation | ACTIVATE / REJECT / DEFER with rationale |
| **Activation Gate Checklist** | 20-item visual checklist with tick/cross per gate item (see Section 34) | Completion Gate validation output (Orchestrator code node) | View detail per item; override with rationale |

**Signature Review Panel — Per-Signatory Card Layout:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  SIGNATORY: John Tan Wei Ming  │  ROLE: CEO  │  AUTHORITY: ✅ Authorised    │
├────────────────────────┬────────────────────────────────────────────────────┤
│  SUBMITTED SIGNATURE   │  SPECIMEN SIGNATURE          │  AI ANALYSIS        │
│  ┌──────────────────┐  │  ┌──────────────────┐        │                     │
│  │  [signature img]  │  │  │  [specimen img]   │        │  Score: 87% (HIGH) │
│  └──────────────────┘  │  └──────────────────┘        │  Anomalies: None    │
│  Doc: AO_Form p.12     │  Ref: SIG-REF-001            │  Advisory: LIKELY   │
│                        │                              │           VALID     │
├────────────────────────┴────────────────────────────────────────────────────┤
│  ⚠️ This AI score is ADVISORY ONLY. You must make the binding decision.     │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ ✅ APPROVE ]    [ ❌ REJECT ]    [ ❓ CLARIFY ]                          │
│  Notes: [_______________________________________________]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 30.3 Relationship Manager (RM) View

**Purpose:** KYC/CDD/BCAP review, credit approach recommendation, limit recommendation.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **My Review Queue** | Table: case_id, client_name, entity_type, jurisdiction, priority, sla_deadline, brief_ready | `ao_case_state` filtered by rm_id + HITL queue | Open KYC review panel |
| **KYC/CDD/BCAP Review Panel** | Structured KYC brief with sections: Entity Summary, Ownership Structure, Directors ID Summary, UBO Details, Screening Results (colour-coded), Risk Factors, Open Questions | N-2 output (`N2Output`) + `kyc_brief{}` | Review each section; flag concerns |
| **Screening Results Dashboard** | Per-entity and per-individual: sanctions (CLEAR/HIT), PEP (NONE/FLAGGED), adverse media (NONE/FOUND), with source attribution | `N2Output.screening_results[]` | View detail per result; download screening report |
| **RM Decision Form** | Structured form: KYC Risk Rating (dropdown), CDD Clearance (Y/N), BCAP Clearance (Y/N), CAA Approach (IRB/SA), DCE Limit (SGD), DCE-PCE Limit (SGD), OSCA Case No, Limit Exposure Indication | — | Submit (all mandatory fields validated); Save Draft |
| **Chatflow Q&A** | Interactive chat with SA-4 agent — RM can ask clarifying questions about screening results, ownership structure, or regulatory requirements | Dify Chatflow (CF) companion to SA-4 | Ask questions; view KB-cited answers |
| **Case Timeline** | Same as Sales Dealer but filtered to RM-relevant events | `ao_event_log` | View phase history |

**RM Decision Form Fields:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  RM DECISION CAPTURE — Case: AO-2026-001234                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  KYC Risk Rating:      [ LOW ▾ ]  (LOW / MEDIUM / HIGH / VERY_HIGH)       │
│  CDD Clearance:        [ ✅ CLEARED ]  [ ❌ NOT CLEARED ]                   │
│  BCAP Clearance:       [ ✅ CLEARED ]  [ ❌ NOT CLEARED ]                   │
│  CAA Approach:         ( ) IRB   ( ) Standardised Approach                 │
│  DCE Limit (SGD):      [ 5,000,000     ]                                   │
│  DCE-PCE Limit (SGD):  [ 2,000,000     ]                                   │
│  OSCA Case Number:     [ OSCA-2026-XXX ]                                   │
│  Limit Exposure:       [ Within existing group limit ▾ ]                   │
│                                                                             │
│  RM Notes:             [________________________________________]          │
│                                                                             │
│  [ 💾 Save Draft ]                          [ ✅ Submit Decision ]          │
│                                                                             │
│  ⚠️ All fields are mandatory. Submission is irrevocable and audited.        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 30.4 Credit Team View

**Purpose:** Credit underwriting, final limit assignment, downstream credit system execution.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **My Limit Assignments** | Table: case_id, client_name, rm_recommended_limit, products, caa_approach, priority, sla_deadline | `ao_case_state` + N-3a input | Open credit review panel |
| **Credit Review Panel** | Structured credit brief: entity financial summary, pre-calculated metrics (leverage, liquidity, revenue trend), products + typical margin profiles, RM recommendations, comparable benchmarks | N-3a input + SA-6 credit brief | Review metrics; request additional info |
| **Financial Metrics Dashboard** | Visual cards: Total Equity, Net Asset Value, Leverage Ratio, Current Ratio, Revenue Trend (YoY), Profitability Trend with RAG indicators | Extracted from financial statements by SA-6 | View trend charts (3-year) |
| **Credit Decision Form** | Approved DCE Limit (SGD), Approved DCE-PCE Limit (SGD), Confirmed CAA Approach, Credit Grade, Conditions[], Credit Outcome (APPROVED/DECLINED) | — | Submit decision; add conditions; decline with reason |
| **System Confirmation Status** | Per downstream system: CLS (limit update status), CQG (login creation status), IDB (platform enable status) — with real-time Kafka event status | SA-3 output (N-8) / `ao_node_checkpoint` for N-8 | View error details; trigger retry |

**Financial Metrics Dashboard Cards:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Equity │ │ Leverage     │ │ Current      │ │ Revenue      │
│              │ │ Ratio        │ │ Ratio        │ │ Trend        │
│  SGD 15M     │ │  2.3x        │ │  1.8x        │ │  +12% YoY    │
│  🟢 Strong   │ │  🟡 Moderate  │ │  🟢 Healthy   │ │  🟢 Growing   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Net Profit   │ │ Existing     │ │ RM Limit Rec │ │ Est. Initial │
│ Margin       │ │ Debt         │ │              │ │ Margin Req.  │
│  8.2%        │ │  SGD 35M     │ │  SGD 5M      │ │  SGD 500K    │
│  🟢 Positive  │ │  🟡 Notable   │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

### 30.5 TMO Static Team View

**Purpose:** Account creation and static data configuration in UBIX, SIC, CV.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **My Account Creations** | Table: case_id, client_name, systems_to_configure, priority, sla_deadline, stage (DRAFT/FINAL/EXECUTING/VALIDATED) | `ao_case_state` + N-3b state | Open account setup panel |
| **TMO Static Instruction** | Structured instruction document: UBIX parameters, SIC mapping + commission + limits, CV contract mapping + settlement, Authorised Traders list, Validation Checklist | N-3b TMO instruction output | Download instruction; mark items complete |
| **System-by-System Setup Panel** | Per system (UBIX, SIC, CV): field-by-field instruction with expected value, actual value (post-execution), validation status | SA-7 config_spec (N-3b) + SA-7 readback validation | Mark system complete; flag discrepancy |
| **Validation Checklist** | Named checklist items with tick/cross: entity created, settlement validated, products configured, commission rates correct, traders loaded, limits set | N-3b validation output | Confirm each item; report issue per item |

**System Setup Panel — UBIX Example:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  UBIX ACCOUNT SETUP — Case: AO-2026-001234                                 │
├──────────────────┬───────────────────┬──────────────┬───────────────────────┤
│  Field           │  Instructed Value │  Actual Value│  Status               │
├──────────────────┼───────────────────┼──────────────┼───────────────────────┤
│  Entity Name     │  ABC Trading Pte  │  ABC Trading │  ✅ Match             │
│  Entity Type     │  CORP             │  CORP        │  ✅ Match             │
│  LEI             │  5493001KJTIIGC..│  5493001KJT..│  ✅ Match             │
│  Jurisdiction    │  SGP              │  SGP         │  ✅ Match             │
│  Reg. Flags      │  MAS_LICENSED     │  —           │  ❌ MISSING           │
│  Products        │  FUTURES_SGX, OPT │  FUTURES_SGX │  ⚠️ PARTIAL           │
├──────────────────┴───────────────────┴──────────────┴───────────────────────┤
│  Overall: 4/6 fields validated  │  2 discrepancies require correction       │
│  [ ✅ Mark System Complete ]     [ ❌ Flag Discrepancy ]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 30.6 Management View

**Purpose:** Full pipeline visibility, SLA monitoring, escalation handling.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **Pipeline Dashboard** | Case pipeline funnel: cases per phase, avg days in each phase, bottleneck indicator | `ao_case_state` aggregate | Drill into any phase |
| **SLA Heatmap** | All active cases: case_id, current_phase, sla_pct_consumed, colour-coded (green/amber/red) | `ao_case_state.sla_tracking` | Click to view case detail |
| **Escalation Queue** | All unresolved escalations: case_id, escalation_type, severity, days_open, owning_team | `ao_event_log` WHERE event_type LIKE 'ESCALAT%' | Assign, intervene, override |
| **Team Performance** | Per-team HITL response time (avg, p95), cases completed this week, SLA compliance rate | `ao_event_log` + `ao_node_checkpoint` | View team drill-down |
| **Daily KPI Summary** | Cards: cases opened today, cases activated today, avg case age, SLA compliance %, STP rate, breach count | Computed from `ao_case_state` + `ao_event_log` | Export report |
| **Activation Panel** | Cases pending N-7 activation review: complete dossier summary, AI recommendation, risk flags | N-7 CaseDossier | ACTIVATE / REJECT / DEFER |

---

### 30.7 Audit & Compliance View

**Purpose:** Regulatory evidence chain, audit reports, compliance oversight.

| Panel | Content | Data Source | Actions Available |
|---|---|---|---|
| **Case Audit Trail** | Full chronological event log for selected case: every state transition, agent action, human decision, with timestamps and actor IDs | `ao_event_log` ORDER BY triggered_at | Filter by event type; export for MAS review |
| **Gate Validation Report** | 16-item completion gate checklist for selected case (see Section 34) | SA-9 gate validation output | View evidence per gate item |
| **Screening Evidence** | Per-case: all sanctions/PEP/adverse media screening results with source references and timestamps | N-2 output (`N2Output.screening_results[]`) | Download screening certificate |
| **HITL Decision Log** | All human decisions: decision_type, decider, rationale, timestamp, case_id | `ao_event_log` WHERE event_type = 'HITL_DECISION_RECORDED' | Filter by decision type, reviewer |
| **Report Generator** | On-demand reports: Case Trail, Agent Activity, Human Decisions, SLA Breach Analysis, Signature Verification Summary, System Integration Log | SA-9 report generation | Generate, preview, export PDF |
| **Token Usage & Cost** | Per-case and per-node token consumption: input tokens, output tokens, total, estimated cost | `ao_node_checkpoint.token_usage` | View by case, by node, by time period |

---

## 31. Per-Node UI-Ready Output Extensions

Every Pydantic output model should include a `ui_envelope` section that provides rendering-ready data for the Angular Workbench. This is injected by the Checkpoint Writer Code Node after Pydantic validation passes.

### UI Envelope Schema (appended to every node output)

```python
class UITimelineEntry(BaseModel):
    event_title: str               # "KYC Assessment Complete"
    event_description: str         # "Risk rating: MEDIUM. No sanctions hits. 1 PEP flag for RM review."
    event_icon: Literal["intake", "document", "kyc", "credit", "tmo", "signature",
                        "regulatory", "activation", "provisioning", "done", "dead",
                        "hitl", "alert", "notification"]
    event_colour: Literal["green", "amber", "red", "blue", "grey"]
    timestamp: datetime

class UIActionItem(BaseModel):
    action_id: str                 # "review_kyc_brief"
    action_label: str              # "Review KYC/CDD Brief"
    action_target_persona: str     # "RM"
    action_url: str                # "/workbench/rm/review/{case_id}"
    action_priority: Literal["CRITICAL", "HIGH", "NORMAL"]
    action_deadline: Optional[datetime]

class UIAlert(BaseModel):
    alert_id: str
    alert_type: Literal["SLA_WARNING", "SLA_CRITICAL", "SLA_BREACHED",
                        "SANCTIONS_HIT", "PEP_FLAG", "DOC_GAP", "SIG_LOW_CONFIDENCE",
                        "CREDIT_DECLINE", "SYSTEM_FAILURE", "ENTITY_MERGE_CONFLICT",
                        "COMMISSION_MISMATCH", "ESCALATION", "HITL_OVERDUE",
                        "PHYSICAL_COPY_OVERDUE"]
    alert_severity: Literal["INFO", "WARNING", "CRITICAL", "EMERGENCY"]
    alert_message: str
    alert_recipient_roles: List[str]
    alert_requires_action: bool
    alert_auto_escalate_after_hours: Optional[int]

class UIKPIDataPoint(BaseModel):
    kpi_name: str                  # "node_duration_minutes"
    kpi_value: float
    kpi_unit: str                  # "minutes"
    kpi_benchmark: Optional[float] # Baseline comparison value
    kpi_status: Literal["GOOD", "ACCEPTABLE", "POOR"]

class UIStatusBadge(BaseModel):
    badge_label: str               # "KYC PASS"
    badge_colour: Literal["green", "amber", "red", "blue", "grey", "purple"]
    badge_icon: str                # "shield-check"
    badge_tooltip: str             # "KYC assessment passed. Risk: MEDIUM."

class UIProgressUpdate(BaseModel):
    overall_progress_pct: int      # 0-100
    current_phase_name: str
    phases_complete: int
    phases_total: int
    estimated_completion: Optional[datetime]

class UIEnvelope(BaseModel):
    """Appended to every node output for workbench rendering."""
    case_id: str
    node_id: str
    node_name: str
    timestamp: datetime

    # Summary for dashboard cards
    ui_summary: str                # Human-readable 1-2 sentence summary
    ui_status_badge: UIStatusBadge

    # Timeline feed
    ui_timeline_entry: UITimelineEntry

    # Actions for workbench
    ui_action_items: List[UIActionItem]

    # Alerts triggered by this node
    ui_alerts: List[UIAlert]

    # KPI data points generated
    ui_kpi_data_points: List[UIKPIDataPoint]

    # Overall case progress
    ui_progress: UIProgressUpdate

    # Audit trail reference
    ui_audit_event_ids: List[str]  # Event IDs written to ao_event_log
```

### Node-Specific UI Envelope Examples

**N-0 (Case Intake) — UI Envelope:**
```json
{
  "ui_summary": "New case created: ABC Trading Pte Ltd — Institutional Futures (SGP). Priority: STANDARD. Assigned to RM John Ng.",
  "ui_status_badge": {
    "badge_label": "INTAKE COMPLETE",
    "badge_colour": "green",
    "badge_icon": "inbox-check",
    "badge_tooltip": "Case classified and created successfully."
  },
  "ui_timeline_entry": {
    "event_title": "Case Intake Complete",
    "event_description": "Case AO-2026-001234 created. Account type: INSTITUTIONAL_FUTURES. Products: FUTURES_SGX, OPTIONS_SGX.",
    "event_icon": "intake",
    "event_colour": "green",
    "timestamp": "2026-03-02T09:45:00+08:00"
  },
  "ui_action_items": [
    {
      "action_id": "view_case_detail",
      "action_label": "View Case Details",
      "action_target_persona": "SALES_DEALER",
      "action_url": "/workbench/sales/cases/AO-2026-001234",
      "action_priority": "NORMAL",
      "action_deadline": null
    }
  ],
  "ui_alerts": [],
  "ui_kpi_data_points": [
    {"kpi_name": "intake_duration_minutes", "kpi_value": 15.0, "kpi_unit": "minutes", "kpi_benchmark": 20.0, "kpi_status": "GOOD"}
  ],
  "ui_progress": {
    "overall_progress_pct": 11,
    "current_phase_name": "Document Collection",
    "phases_complete": 1,
    "phases_total": 9,
    "estimated_completion": "2026-03-05T17:00:00+08:00"
  }
}
```

**N-2 (KYC/CDD with PEP flag) — UI Envelope:**
```json
{
  "ui_summary": "KYC assessment requires RM review. PEP flag identified on director. Risk rating: HIGH. Routing to Compliance HITL.",
  "ui_status_badge": {
    "badge_label": "PEP FLAGGED",
    "badge_colour": "red",
    "badge_icon": "alert-triangle",
    "badge_tooltip": "PEP identified on beneficial owner. Mandatory compliance review."
  },
  "ui_action_items": [
    {
      "action_id": "review_kyc_brief",
      "action_label": "Review KYC/CDD Brief (URGENT)",
      "action_target_persona": "COMPLIANCE_OFFICER",
      "action_url": "/workbench/compliance/review/AO-2026-001234",
      "action_priority": "CRITICAL",
      "action_deadline": "2026-03-02T16:23:00+08:00"
    }
  ],
  "ui_alerts": [
    {
      "alert_id": "ALT-PEP-001234",
      "alert_type": "PEP_FLAG",
      "alert_severity": "CRITICAL",
      "alert_message": "PEP identification: John Tan Wei Ming (CEO, 55% owner) — WorldCheck match. EDD required per MAS AML/CFT Notice.",
      "alert_recipient_roles": ["COMPLIANCE_OFFICER", "RM", "RM_MANAGER"],
      "alert_requires_action": true,
      "alert_auto_escalate_after_hours": 2
    }
  ]
}
```

---

## 32. Alert & Notification Taxonomy

### Complete Alert Type Registry

| Alert ID | Alert Type | Severity | Trigger Condition | Recipients | UI Rendering | Auto-Escalation |
|---|---|---|---|---|---|---|
| ALT-SLA-WARN | SLA_WARNING | WARNING | sla_pct_consumed > 75% | RM Manager, Team owning current phase | Amber banner in Management View | None — notification only |
| ALT-SLA-CRIT | SLA_CRITICAL | CRITICAL | sla_pct_consumed > 90% | DCE COO, RM Manager, Phase team | Red banner + email alert | Escalate to COO if unresolved in 2h |
| ALT-SLA-BRCH | SLA_BREACHED | EMERGENCY | sla_deadline passed | DCE COO, Risk Management, All involved | Red flash badge + SMS + email | Immediate COO intervention |
| ALT-SANC | SANCTIONS_HIT | EMERGENCY | N-2 sanctions_flag = True (CONFIRMED) | Compliance Officer, MLRO, RM | Red modal dialog — blocks all other actions | Immediate — no delay |
| ALT-PEP | PEP_FLAG | CRITICAL | N-2 pep_flag = True | Compliance Officer, RM, RM Manager | Red badge on case + alert toast | 2 hours → MLRO notification |
| ALT-RISK | HIGH_RISK_RATING | CRITICAL | N-2 risk_rating = "VERY_HIGH" | Compliance Officer | Amber badge + review queue highlight | 4 hours → Senior Compliance |
| ALT-DOC-GAP | DOC_GAP | WARNING | N-1 missing_mandatory not empty | Sales Dealer, RM | Amber badge on case; gap notice ready | 24h → RM Manager; 48h → Sales Head |
| ALT-DOC-REJ | DOC_REJECTED | WARNING | N-1 any doc status = REJECTED | Sales Dealer | Amber badge with rejection reason | Same as DOC_GAP |
| ALT-SIG-LOW | SIG_LOW_CONFIDENCE | CRITICAL | N-5 ai_confidence = "LOW" | Desk Support, Legal Officer | Red highlight in Sig Review Panel | Immediate — Legal escalation |
| ALT-SIG-MIS | SIG_MISMATCH | WARNING | N-5 anomalies_detected not empty | Desk Support | Amber highlight with anomaly details | 4 hours → Legal |
| ALT-CRED-DEC | CREDIT_DECLINE | WARNING | N-3a credit_approved = False | Sales Dealer, RM | Grey badge "CREDIT DECLINED" | None — case terminated |
| ALT-CRED-COND | CREDIT_CONDITIONS | INFO | N-3a credit_conditions not empty | Sales Dealer, RM | Blue info badge with condition list | None — tracked in case |
| ALT-SYS-FAIL | SYSTEM_FAILURE | CRITICAL | N-8 any system provisioning_status = "FAILED" | Technology Operations, COO | Red system status card | 30 min → Tech Ops Manager |
| ALT-MERGE | ENTITY_MERGE_CONFLICT | WARNING | N-3b entity_merge_required = True | TMO Operations | Amber badge; merge review panel shown | 2 hours → TMO Manager |
| ALT-COMM | COMMISSION_MISMATCH | WARNING | N-3b (SA-7) commission validation mismatch | Sales Dealer, TMO Static | Amber badge with mismatch detail | 4 hours → Sales Desk Head |
| ALT-HITL-DUE | HITL_OVERDUE | WARNING | HITL task open > 50% of its SLA | Task assignee, their manager | Amber pulse on task card | 75% SLA → Manager; 100% → COO |
| ALT-PHYS | PHYSICAL_COPY_OVERDUE | WARNING | Physical copy not received by Day 7/14/21 | Desk Support, Customer (email) | Amber badge + reminder counter | Day 7: Reminder 1; Day 14: Reminder 2; Day 21: Escalation |
| ALT-GATE | GATE_FAILED | CRITICAL | Orchestrator Completion Gate: any item failed | DCE COO, Responsible team | Red banner with specific failed items | 2 hours → COO escalation |

### Notification Channel Matrix

| Notification Type | In-App Toast | Workbench Badge | Email | SMS | Kafka Event |
|---|---|---|---|---|---|
| Task Assignment | Yes | Yes | Yes | No | Yes |
| SLA Warning | Yes | Yes | Yes | No | Yes |
| SLA Breach | Yes | Yes (flash) | Yes | Yes (COO) | Yes |
| Sanctions Hit | Yes (modal) | Yes (red) | Yes (immediate) | Yes (MLRO) | Yes |
| Document Gap Notice | Yes | Yes | Yes (to customer) | No | Yes |
| Signature Review Ready | Yes | Yes | Yes | No | Yes |
| Credit Decision Ready | Yes | Yes | No | No | Yes |
| System Failure | Yes | Yes | Yes | Yes (Tech Ops) | Yes |
| Welcome Kit Sent | Yes | Yes | Yes (to customer) | No | Yes |
| Account Go-Live | Yes | Yes | Yes | No | Yes |
| Physical Copy Reminder | No | Yes | Yes (to customer) | No | Yes |

---

## 33. Notification & Communication — Cross-Cutting Capability

The DAG architecture distributes notifications across nodes via Kafka events and Orchestrator dispatch. This section specifies the **notification contract** — the standard input/output schemas that any node or the Orchestrator uses when dispatching outbound communications. This is implemented as reusable Code Nodes and HTTP Request Nodes within existing workflows — **not** a separate numbered sub-agent (SA-1 through SA-9 are fully assigned per Appendix A).

### Notification Dispatch Specification

| Property | Specification |
|---|---|
| **Implementation** | Reusable Dify Code Node + HTTP Request Node (invokable from any workflow) |
| **Dify Type** | Workflow (WF) — stateless, request-driven |
| **Role** | Central outbound communication engine: task notifications, SLA alerts, customer emails, Welcome Kit, escalation dispatch |
| **Trigger** | HTTP Request from any node or Orchestrator with `notification_type` and context |
| **Max Retries** | 2 (per delivery attempt) |

**Input Schema:**
```python
class NotificationInput(BaseModel):
    case_id: str
    notification_type: Literal[
        "TASK_ASSIGNMENT",
        "SLA_WARNING",
        "SLA_ESCALATION",
        "SLA_BREACH",
        "GAP_NOTICE_TO_CUSTOMER",
        "SIGNATURE_CLARIFICATION",
        "PHYSICAL_COPY_REMINDER",
        "WELCOME_KIT",
        "SANCTIONS_ESCALATION",
        "CREDIT_DECLINE_NOTICE",
        "SYSTEM_FAILURE_ALERT",
        "ACCOUNT_LIVE_NOTICE",
        "CASE_CLOSED_NOTICE",
        "HITL_OVERDUE_REMINDER",
        "GENERAL_STATUS_UPDATE"
    ]
    recipient_role: str            # "SALES_DEALER", "RM", "DESK_SUPPORT", "CREDIT_TEAM", etc.
    recipient_person_id: Optional[str]
    context_payload: Dict          # Notification-type-specific data
    priority: Literal["NORMAL", "HIGH", "CRITICAL"]
    channels: List[Literal["INAPP", "EMAIL", "SMS"]]
```

**Output Schema:**
```python
class NotificationOutput(BaseModel):
    notification_id: str
    notification_type: str
    delivery_status: Literal["SENT", "PARTIAL", "FAILED"]
    channels_delivered: List[str]
    channels_failed: List[str]
    delivered_at: datetime
    recipient_acknowledged: bool   # For in-app — has the user seen it?
```

### Notification Types — Detailed Templates

| Type | Subject/Title Template | Body Template Variables | Channels |
|---|---|---|---|
| TASK_ASSIGNMENT | "[DCE] New task: {task_type} — {client_name}" | case_id, task_type, deadline, priority, sla_clock, action_url | INAPP + EMAIL |
| SLA_WARNING | "[DCE] SLA Warning — {client_name} at {sla_pct}%" | case_id, client_name, current_phase, blocking_team, elapsed_hours, remaining_hours | INAPP + EMAIL |
| SLA_BREACH | "[DCE] SLA BREACHED — {client_name}" | Same as warning + escalation_level, management_notification | INAPP + EMAIL + SMS |
| GAP_NOTICE_TO_CUSTOMER | "Documents Required — {case_ref}" | case_ref, missing_items[], document_instructions, resolution_deadline, contact_details | EMAIL (to customer) |
| WELCOME_KIT | "Welcome to ABS DCE — {client_name}" | account_ref, products_enabled, cqg_credentials, client_services_contact, statement_schedule | EMAIL (to customer) |
| SANCTIONS_ESCALATION | "[URGENT] Sanctions Alert — {case_id}" | case_id, entity_name, screening_detail, sanctions_list_source, immediate_action_required | INAPP + EMAIL + SMS |

---

## 34. Audit & Compliance — Cross-Cutting Capability & Completion Gate

Audit and compliance functions are implemented via the CQRS event store (`ao_event_log`, Section 23) and deterministic code-node validation within the Orchestrator workflow. These are **not** a separate numbered sub-agent — audit event writing is embedded in every node's Checkpoint Writer, and the Completion Gate is a Code Node in the Orchestrator that runs before invoking SA-9 (Activation Review Agent, N-7).

### Audit Capability Specification

| Property | Specification |
|---|---|
| **Implementation** | Embedded in every node's Checkpoint Writer + Kafka Event Publisher (ORCH.SKL-06) |
| **Dify Type** | Code Nodes within existing workflows |
| **Role** | Immutable audit trail via `ao_event_log`; completion gate validation; on-demand report generation |
| **Trigger** | Every node exit (automatic); Kafka event subscription; HTTP Request for gate/report |

### Completion Gate — 20-Item Checklist

Before the Orchestrator invokes N-7 (SA-9 Activation Review), it runs a deterministic Completion Gate validation to verify every prerequisite is complete. This is the **master gate** before an account can go live.

| # | Gate Item | Source Node | Validation Rule | Evidence Required |
|---|---|---|---|---|
| G-01 | Case created and classified | N-0 | `N0Output.case_id` exists | case_id in ao_case_state |
| G-02 | All mandatory documents received | N-1 | `N1Output.mandatory_docs_complete = true` | Document list with ACCEPTED status |
| G-03 | No rejected documents outstanding | N-1 | `N1Output.rejected_docs` is empty | Rejection cleared or re-submitted |
| G-04 | KYC/CDD assessment passed | N-2 | `N2Output.kyc_status = "PASS"` | KYC reference number |
| G-05 | Sanctions screening: all CLEAR | N-2 | `N2Output.sanctions_flag = false` | Screening result references |
| G-06 | PEP: cleared or HITL-resolved | N-2 | `pep_flag = false` OR HITL decision = APPROVED | HITL decision record if PEP |
| G-07 | Risk rating assigned | N-2 | `N2Output.risk_rating` is not null | Risk rating in case record |
| G-08 | Credit assessment complete | N-3a | `N3aOutput.credit_approved = true` | Credit reference number |
| G-09 | Credit limits assigned | N-3a | `credit_limit_approved > 0` | Credit approval record |
| G-10 | TMO static data configured | N-3b | `N3bOutput.tmo_setup_complete = true` | TMO reference number |
| G-11 | UBIX entity created/linked | N-3b | `ubix_entity_id` is not null | UBIX entity ID |
| G-12 | SIC counterparty registered | N-3b | `sic_counterparty_id` is not null | SIC counterparty ID |
| G-13 | Settlement instructions validated | N-3b | `settlement_instructions_validated = true` | Validation record |
| G-14 | All signatures verified by human | N-5 | `N5Output.all_signatures_verified = true` | HITL decision records per signatory |
| G-15 | Regulatory config applied | N-6 | `N6Output.regulatory_config_complete = true` | Regulatory parameters list |
| G-16 | Margin rules set | N-6 | `margin_rules_applied` is not empty | Margin rule IDs |
| G-17 | Trade reporting flags configured | N-6 | `reporting_obligations` is not empty | Reporting flag list |
| G-18 | RM decisions captured (all fields) | N-2 HITL | All RM decision fields non-null | RM decision audit record |
| G-19 | Commission rates validated | N-3b (SA-7) | Commission config matches Sales Dealer agreement | Commission validation record |
| G-20 | Authorised traders loaded | N-3b (SA-7) | Trader list in UBIX matches mandate | Trader activation list |

**Gate Validation Output:**
```python
class GateCheckItem(BaseModel):
    gate_number: int               # G-01 through G-20
    gate_description: str
    gate_status: Literal["PASS", "FAIL", "NOT_APPLICABLE"]
    evidence_reference: Optional[str]
    failure_detail: Optional[str]

class GateValidationResult(BaseModel):
    case_id: str
    gate_passed: bool
    total_items: int
    passed_items: int
    failed_items: int
    na_items: int
    gate_checks: List[GateCheckItem]
    blocking_failures: List[str]   # Gate items that block activation
    validated_at: datetime
    validated_by: str              # "Orchestrator Completion Gate v1.0.0"
```

---

## 35. KPI Dashboard Data Model

### 35.1 Case-Level KPIs (per case)

| KPI ID | KPI Name | Formula | Unit | Benchmark | RAG Thresholds |
|---|---|---|---|---|---|
| KPI-C01 | Total Case Duration | `completed_at - created_at` | hours | 72h (STD) / 24h (URG) | GREEN: < 80% SLA; AMBER: 80-100%; RED: > 100% |
| KPI-C02 | Phase Dwell Time | `phase_exit_time - phase_entry_time` per phase | hours | Varies per phase (see P-level KPIs) | Varies |
| KPI-C03 | HITL Wait Time | Sum of all HITL task open durations | hours | < 8h total | GREEN: < 8h; AMBER: 8-16h; RED: > 16h |
| KPI-C04 | Retry Count | Total retries across all nodes | count | 0-1 | GREEN: 0; AMBER: 1-2; RED: > 2 |
| KPI-C05 | Escalation Count | Total escalations in case | count | 0 | GREEN: 0; AMBER: 1; RED: > 1 |
| KPI-C06 | Document Resubmission Count | Number of doc chase cycles in N-1 | count | 0-1 | GREEN: 0; AMBER: 1; RED: > 1 |
| KPI-C07 | Total Token Usage | Sum of tokens across all nodes | tokens | < 50K per case | GREEN: < 50K; AMBER: 50-100K; RED: > 100K |
| KPI-C08 | Straight-Through Score | % of nodes that completed without HITL or retry | % | > 70% | GREEN: > 70%; AMBER: 50-70%; RED: < 50% |

### 35.2 Phase-Level KPIs (per node/phase)

| KPI ID | Phase | KPI Name | Benchmark | Alert Threshold |
|---|---|---|---|---|
| KPI-P01 | N-0 Intake | Triage duration | < 30 min | > 60 min |
| KPI-P02 | N-0 Intake | Classification confidence | > 0.85 | < 0.70 (auto-flag) |
| KPI-P03 | N-1 Documents | First-pass completeness rate | > 60% | < 40% (process issue) |
| KPI-P04 | N-1 Documents | Gap resolution cycle time | < 24h | > 48h |
| KPI-P05 | N-2 KYC | Screening execution time | < 15 min | > 30 min (API issue) |
| KPI-P06 | N-2 KYC | PEP/Sanctions flag rate | < 5% (portfolio) | > 10% (review screening source) |
| KPI-P07 | N-2 KYC | EDD escalation rate | < 10% | > 20% (review thresholds) |
| KPI-P08 | N-3a Credit | Credit approval rate | > 85% | < 70% (review intake quality) |
| KPI-P09 | N-3a Credit | Avg limit approved vs requested | > 80% | < 50% (misaligned expectations) |
| KPI-P10 | N-3b TMO | Config accuracy (post-validation) | > 95% fields match | < 90% (training issue) |
| KPI-P11 | N-3b TMO | Entity merge rate | < 5% | > 10% (data quality) |
| KPI-P12 | N-3a/3b | Parallel stream delta | < 2h between completions | > 8h (one stream blocking) |
| KPI-P13 | N-5 Signatures | AI pre-check accuracy (vs human decision) | > 90% agreement | < 80% (model retrain) |
| KPI-P14 | N-5 Signatures | HITL reviewer turnaround | < 4h | > 12h |
| KPI-P15 | N-6 Regulatory | Regulatory config duration | < 2h | > 4h |
| KPI-P16 | N-7 Activation | Activation review turnaround | < 8h | > 24h |
| KPI-P17 | N-7 Activation | Approval rate | > 95% (at this stage) | < 90% (upstream quality issue) |
| KPI-P18 | N-8 Provisioning | System provisioning success rate | > 99% per system | < 95% (system stability issue) |
| KPI-P19 | N-8 Provisioning | Avg provisioning time | < 30 min | > 60 min |

### 35.3 Portfolio-Level KPIs (aggregate)

| KPI ID | KPI Name | Formula | Frequency | Target |
|---|---|---|---|---|
| KPI-A01 | SLA Compliance Rate | Cases within SLA / Total cases closed | Weekly | > 90% |
| KPI-A02 | Straight-Through Processing (STP) Rate | Cases with zero HITL escalations / Total cases | Weekly | > 30% (Phase 1); > 50% (Phase 3) |
| KPI-A03 | Average Case Age (Active) | Mean(now - created_at) for all ACTIVE cases | Daily | < 48h |
| KPI-A04 | Cases Opened / Activated / Rejected | Count per period | Daily | Trend monitoring |
| KPI-A05 | Agent Accuracy (Pydantic validation pass rate) | Outputs passing first validation / Total outputs | Weekly | > 95% |
| KPI-A06 | HITL Reviewer Avg Response Time | Mean time from HITL task creation to decision | Weekly | < 4h |
| KPI-A07 | Cost Per Case (Token) | Avg total tokens per completed case | Monthly | Trend down |
| KPI-A08 | Escalation Rate | Cases with at least 1 escalation / Total cases | Weekly | < 10% |
| KPI-A09 | Breach Severity Score | Weighted: WARNING × 1 + CRITICAL × 3 + BREACH × 10 | Weekly | Trend down |
| KPI-A10 | Physical Copy Receipt Rate | Cases with all physical copies within 21 days | Monthly | > 90% |

### KPI Dashboard SQL Queries

```sql
-- KPI-A01: SLA Compliance Rate (last 7 days)
SELECT
    COUNT(CASE WHEN sla_pct_consumed <= 100 THEN 1 END) * 100.0 / COUNT(*) AS sla_compliance_pct,
    COUNT(*) AS total_cases_closed
FROM ao_case_state
WHERE status IN ('DONE', 'DEAD')
AND updated_at > NOW() - INTERVAL 7 DAY;

-- KPI-A02: STP Rate (last 7 days)
SELECT
    COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM ao_event_log el
        WHERE el.case_id = cs.case_id
        AND el.event_type IN ('HITL_TASK_CREATED', 'NODE_ESCALATED')
    ) THEN 1 END) * 100.0 / COUNT(*) AS stp_rate
FROM ao_case_state cs
WHERE cs.status = 'DONE'
AND cs.updated_at > NOW() - INTERVAL 7 DAY;

-- KPI-A06: HITL Reviewer Avg Response Time
SELECT
    AVG(TIMESTAMPDIFF(MINUTE,
        created.triggered_at,
        decided.triggered_at
    )) / 60.0 AS avg_hours
FROM ao_event_log created
JOIN ao_event_log decided
    ON decided.case_id = created.case_id
    AND JSON_EXTRACT(decided.event_payload, '$.task_id') =
        JSON_EXTRACT(created.event_payload, '$.task_id')
    AND decided.event_type = 'HITL_DECISION_RECORDED'
WHERE created.event_type = 'HITL_TASK_CREATED'
AND created.triggered_at > NOW() - INTERVAL 7 DAY;

-- Pipeline funnel (Management Dashboard)
SELECT
    current_node,
    COUNT(*) as case_count,
    AVG(TIMESTAMPDIFF(HOUR, created_at, NOW())) as avg_age_hours,
    SUM(CASE WHEN JSON_EXTRACT(sla_tracking, '$.sla_status') = 'CRITICAL' THEN 1 ELSE 0 END) as critical_count
FROM ao_case_state
WHERE status = 'ACTIVE'
GROUP BY current_node
ORDER BY FIELD(current_node, 'N-0','N-1','N-2','N-3a','N-3b','N-4','N-5','N-6','N-7','N-8');
```

---

## 36. Extended Lifecycle Stages — Post-DAG & Background Processes

### 36.1 Physical Copy Tracking Lifecycle

**Physical copy management** is a continuous background process with Day 7/14/21 reminder escalation, triggered after account activation (N-8 → DONE). Managed by the Orchestrator as a post-activation background workflow.

**Physical Copy States:**
```
PHYSICAL_COPY_NOT_REQUIRED → (no tracking needed)
PHYSICAL_COPY_PENDING → Day 7 Reminder → Day 14 Reminder → Day 21 Escalation → RECEIVED / OVERDUE
```

**Persistence Schema:**
```sql
CREATE TABLE ao_physical_copy_tracker (
    tracker_id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id         VARCHAR(20) NOT NULL,
    doc_type        VARCHAR(50) NOT NULL,        -- e.g., "GTA_ORIGINAL", "SCHEDULE_7A_ORIGINAL"
    status          ENUM('PENDING','REMINDER_1','REMINDER_2','ESCALATED','RECEIVED','WAIVED'),
    expected_by     DATE,                         -- 21 days from account activation
    reminder_1_sent DATETIME,                     -- Day 7
    reminder_2_sent DATETIME,                     -- Day 14
    escalation_sent DATETIME,                     -- Day 21
    received_at     DATETIME,
    received_by     VARCHAR(50),                  -- Desk Support employee ID
    tracking_notes  TEXT,
    FOREIGN KEY (case_id) REFERENCES ao_case_state(case_id)
);
```

**UI: Physical Copy Tracker Panel (Desk Support View):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHYSICAL COPY TRACKER — Active Cases                                       │
├────────────┬───────────────┬───────────────┬──────────┬──────────┬──────────┤
│ Case ID    │ Client Name   │ Document      │ Status   │ Days Out │ Action   │
├────────────┼───────────────┼───────────────┼──────────┼──────────┼──────────┤
│ AO-2026-001│ ABC Trading   │ GTA Original  │ 🟡 Rem 1 │ 8        │ [Remind] │
│ AO-2026-001│ ABC Trading   │ Sch 7A Orig   │ 🟢 Pending│ 8       │ —        │
│ AO-2026-002│ XYZ Fund      │ GTA Original  │ 🔴 Escal │ 22       │ [Escal.] │
│ AO-2026-003│ PQR Corp      │ GTA Original  │ ✅ Recvd  │ —       │ —        │
└────────────┴───────────────┴───────────────┴──────────┴──────────┴──────────┘
```

---

### 36.2 Welcome Kit & Go-Live Stage

After N-8 (SA-3) provisioning succeeds and the case reaches DONE state, the Orchestrator dispatches the Welcome Kit. Output schema for UI rendering:

**Welcome Kit Output Schema:**
```python
class WelcomeKitOutput(BaseModel):
    case_id: str
    client_name: str
    account_reference: str          # UBIX account reference
    products_enabled: List[str]     # Products live for trading
    cqg_login_details: Optional[Dict]  # CQG terminal credentials (if applicable)
    idb_access_details: Optional[Dict] # IDB platform credentials (if applicable)
    client_services_contact: Dict   # Name, phone, email of assigned client services
    statement_schedule: str         # "Monthly" / "Weekly" as configured
    important_dates: Dict           # GTA effective date, first margin call date
    regulatory_disclosures: List[str]  # Applicable risk disclosures
    welcome_kit_sent_at: datetime
    welcome_kit_channel: Literal["EMAIL"]
    delivery_confirmation: bool
```

---

### 36.3 Case Closure & Archival Stage

After Welcome Kit dispatch, the case must be formally closed:

```python
class CaseClosureOutput(BaseModel):
    case_id: str
    closure_status: Literal["ACTIVATED", "REJECTED", "SUPERSEDED", "WITHDRAWN"]
    closure_reason: str
    closed_at: datetime
    closed_by: str                  # Agent ID or Human employee ID
    total_case_duration_hours: float
    total_phases_completed: int
    total_hitl_decisions: int
    total_retries: int
    total_escalations: int
    total_token_usage: int
    audit_trail_event_count: int
    audit_trail_locked: bool        # True — no further events permitted
    physical_copy_tracking_active: bool  # True if physical copies still pending
```

---

### 36.4 Post-TMO-Execution Readback Validation

Post-execution **readback validation** after TMO Static (SA-7, N-3b) executes — reading configured values back from UBIX/SIC/CV and comparing against the instruction. This enriches the N-3b output for UI validation display.

**Enhancement to N3bOutput:**
```python
class SystemReadbackResult(BaseModel):
    system_name: Literal["UBIX", "SIC", "CV"]
    fields_checked: int
    fields_matched: int
    fields_mismatched: int
    mismatches: List[Dict]         # [{field, expected, actual}]
    readback_status: Literal["ALL_MATCH", "PARTIAL_MATCH", "MISMATCH"]

class N3bOutputEnhanced(N3bOutput):
    """Enhanced N-3b output with readback validation."""
    readback_results: List[SystemReadbackResult]
    all_systems_validated: bool
    commission_rates_validated: bool
    authorised_traders_loaded: bool
    trader_count_loaded: int
    trader_count_expected: int
```

---

### 36.5 Chatflow Companion for RM KYC Review

A **Chatflow (CF)** companion agent allows the RM to ask clarifying questions about the KYC brief during HITL review at N-2. This interactive capability complements the structured KYC review panel.

**Chatflow Specification:**
```
CF-RM-KYC: RM KYC Review Chatflow Companion
├── Dify Type: Chatflow (CF)
├── Activated: When RM opens KYC review panel in workbench
├── Context: Full N-2 output + AO Case State Block + KB-3 + KB-6
├── Capabilities:
│   ├── Answer questions about screening results
│   ├── Explain ownership structures
│   ├── Cite regulatory requirements from KB-3
│   ├── Clarify risk rating calculation methodology
│   └── Surface additional screening details on request
├── Constraints:
│   ├── Read-only — cannot modify case state
│   ├── Cannot make KYC decisions
│   ├── Must cite KB source for all regulatory statements
│   └── Session bound to case_id
└── Output: Conversation log appended to audit trail
```

---

## 37. Commission Structure Validation

Commission rate validation within N-3b (SA-7, TMO Static Data Agent) ensures configured rates in SIC match the Sales Dealer agreement. This enriches the N-3b workflow with an additional validation step using KB-11 (Commission Structure).

**Commission Validation Schema:**
```python
class CommissionValidation(BaseModel):
    case_id: str
    product: str
    exchange: str
    agreed_rate: float              # From Sales Dealer intake
    configured_rate: float          # In SIC system
    rate_match: bool
    variance_pct: Optional[float]   # If mismatched
    validation_status: Literal["MATCH", "MISMATCH", "NOT_CONFIGURED"]
    kb7_reference_rate: float       # Benchmark from KB-7
    within_policy_band: bool        # True if agreed rate is within KB-7 policy range
```

---

## 38. GTA & Schedule Reference Handling

GTA version validation and schedule applicability within N-1 (SA-2, Document Processing Agent) ensures the correct GTA version and all required schedules are submitted. This enriches the N-1 completeness check using KB-12 (GTA & Schedule Reference).

**GTA Validation Schema:**
```python
class GTAValidation(BaseModel):
    case_id: str
    gta_version_submitted: str      # e.g., "GTA v4.2"
    gta_version_current: str        # From KB-3
    gta_version_match: bool
    applicable_schedules: List[str] # e.g., ["Schedule 7A", "Schedule 8A"]
    schedules_submitted: List[str]
    schedules_missing: List[str]
    addenda_required: List[str]     # Product/jurisdiction-specific addenda
    addenda_submitted: List[str]
    addenda_missing: List[str]
    gta_validation_status: Literal["CURRENT", "OUTDATED", "MISSING"]
```

---

## 39. Enhanced Knowledge Base Registry (DAG-Aligned)

The DAG document references KB-1 through KB-10 but does not define all of them with the same rigour as the Reference Architecture. Reconciled registry:

| KB-ID | KB Name | Content | Used By (DAG Nodes) | Reference Doc Equivalent |
|---|---|---|---|---|
| KB-1 | Document Taxonomy | All known DCE document types, identifiers, required fields, versions | N-0, N-1 | KB-1 Document Taxonomy KB |
| KB-2 | Checklist Rules | Entity type x product x jurisdiction → required doc matrix | N-1 | KB-2 Checklist Rules KB |
| KB-3 | Regulatory Requirements | MAS/HKMA regulations, KYC/CDD rules, retail investor obligations, sanctions obligations | N-2, N-6, N-7 | KB-4 Regulatory Requirements KB |
| KB-4 | Credit Policies | Credit models, delegated authority thresholds, credit grading rules | N-3a, N-7 | (Partial in KB-6 DCE Product Reference) |
| KB-5 | Product Rules | Product codes, exchanges, margin profiles, settlement types, regulatory classifications | N-3a, N-3b, N-6 | KB-6 DCE Product Reference KB |
| KB-6 | KYC Guidelines | KYC screening standards, EDD triggers, CDD level determination | N-2, N-5 | (Partial in KB-4 Regulatory Requirements) |
| KB-7 | Authority Matrix | Signing authority levels, delegation rules, who can approve what | N-5 | KB-5 Signature Verification Guidelines KB |
| KB-8 | System Config | Downstream system field mappings, API specs, timeout thresholds | N-3b, N-8 | KB-10 Downstream System Reference KB |
| KB-9 | SLA Policy | SLA windows by priority/complexity, escalation thresholds and ladder | Orchestrator (ORCH.SKL-05) | KB-8 SLA Policy KB |
| KB-10 | FAQ / Exception Playbook | Exception handling paths, common resolution patterns | N-1, N-2 | KB-9 Exception Handling Playbook KB |
| **KB-11** | **Commission Structure** | Commission rate tables by product, exchange, client segment | N-3b (SA-7) validation | KB-7 Commission Structure KB |
| **KB-12** | **GTA & Schedule Reference** | GTA versions, schedule applicability rules, addendum triggers | N-1 (doc validation) | KB-3 GTA & Schedule Reference KB |

---

## 40. Engineering Standards Checklist — UI & Lifecycle Extensions

Additions to the checklist in Section 27:

### UI Integration Checklist

- [ ] Every node output includes `UIEnvelope` (Section 31)
- [ ] `ui_summary` is human-readable, 1-2 sentences, no JSON
- [ ] `ui_status_badge` colour follows alert severity conventions
- [ ] `ui_action_items` include valid workbench URLs for target persona
- [ ] `ui_alerts` are published via Orchestrator notification dispatch for multi-channel delivery
- [ ] `ui_timeline_entry` is appended to case timeline in Workbench
- [ ] `ui_kpi_data_points` are written to KPI aggregation table
- [ ] `ui_progress` percentage is computed correctly (phases_complete / phases_total)

### Lifecycle Coverage Checklist

- [ ] Physical copy tracking is initialised on account activation (N-8 DONE)
- [ ] Welcome Kit is dispatched within 1 hour of activation approval (via Orchestrator notification dispatch)
- [ ] Case closure record is written after Welcome Kit confirmation
- [ ] Audit trail is locked (no further events) after case closure
- [ ] GTA version and schedule applicability are validated during N-1
- [ ] Commission rates are validated during N-3b static data setup
- [ ] Post-TMO readback validation executes before N-3b returns SUCCESS
- [ ] RM Chatflow (CF) companion is available during N-2 HITL review
- [ ] All 20 completion gate items (Section 34) pass before N-7 activation

### Alert & Notification Checklist

- [ ] All 17 alert types (Section 32) have defined trigger conditions
- [ ] Each alert specifies: severity, recipients, channels, auto-escalation timer
- [ ] Notification dispatch capability handles all outbound: email, in-app, SMS
- [ ] Customer-facing emails use LLM-generated content with regulatory-compliant language
- [ ] Sanctions hit (ALT-SANC) triggers immediate modal in all active workbench sessions
- [ ] SLA breach (ALT-SLA-BRCH) triggers SMS to DCE COO

### KPI Checklist

- [ ] All 8 case-level KPIs (Section 35.1) are computed at case closure
- [ ] All 19 phase-level KPIs (Section 35.2) are computed at node exit
- [ ] All 10 portfolio-level KPIs (Section 35.3) are computed on scheduled basis
- [ ] KPI dashboard SQL queries are deployed as Grafana/internal dashboard panels
- [ ] Token usage is tracked per node per case in `ao_node_checkpoint.token_usage`

---

*Document End*

*Classification: ABS Internal — Restricted*
*Review Cycle: Quarterly or on significant architectural change*
*Approved By: [DCE COO signature required before production deployment]*
