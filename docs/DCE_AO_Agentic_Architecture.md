# DCE Account Opening — Enterprise Agentic Architecture Blueprint

**Organisation:** DBS Bank — Treasury & Markets, Derivatives & Commodities Execution (DCE) Desk
**Use Case:** Account Opening (Use Case 2)
**Agent Platform:** Dify (hosted on OpenShift — DBS Private Cloud)
**Backend:** Java Spring Boot · MariaDB · MongoDB · Kafka
**Frontend:** Angular (Agentic Workbench)
**Document Version:** 1.0
**Date:** 2026-03-02
**Classification:** Internal — Restricted

---

## Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Dify Agent Type Reference](#2-dify-agent-type-reference)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [DCE Domain Orchestrator Agent](#4-dce-domain-orchestrator-agent)
5. [SA-1 — Inbox Monitor Agent](#5-sa-1--inbox-monitor-agent)
6. [SA-2 — Document Intelligence Agent](#6-sa-2--document-intelligence-agent)
7. [SA-3 — Signature Verification Agent](#7-sa-3--signature-verification-agent)
8. [SA-4 — KYC / CDD Preparation Agent](#8-sa-4--kyc--cdd-preparation-agent)
9. [SA-5 — Credit Preparation Agent](#9-sa-5--credit-preparation-agent)
10. [SA-6 — Static Configuration Agent](#10-sa-6--static-configuration-agent)
11. [SA-7 — Notification Agent](#11-sa-7--notification-agent)
12. [SA-8 — Integration Agent](#12-sa-8--integration-agent)
13. [SA-9 — Audit Agent](#13-sa-9--audit-agent)
14. [Knowledge Base Registry](#14-knowledge-base-registry)
15. [API & MCP Tool Registry](#15-api--mcp-tool-registry)
16. [End-to-End Agentic Flow Pipeline](#16-end-to-end-agentic-flow-pipeline)
17. [Stakeholder & Touchpoint Map](#17-stakeholder--touchpoint-map)
18. [Human-in-the-Loop Design Summary](#18-human-in-the-loop-design-summary)
19. [Agent Interaction Summary Matrix](#19-agent-interaction-summary-matrix)

---

## 1. Architecture Principles

| # | Principle | Application |
|---|---|---|
| 1 | **AI assists, human decides** | Every substantive decision — signature approval, KYC clearance, credit limit, account activation — is made by a named human. Agents prepare, route, validate, and track. |
| 2 | **Determinism over autonomy for financial controls** | Core orchestration and system integrations use Workflow (WF) agents — not open-ended reasoning agents — to ensure auditable, repeatable execution paths. |
| 3 | **Agent boundaries follow functional accountability** | Each sub-agent maps to one functional owner (Desk Support, RM, Credit Team, TMO Static). No agent crosses ownership boundaries. |
| 4 | **Every action is an audit event** | SA-9 (Audit Agent) fires on every agent output and every human decision. No action — agent or human — escapes the audit trail. |
| 5 | **Fail safe, not fail silent** | If any agent cannot execute, it logs the failure, escalates to the responsible human team, and the manual fallback path is activated. The workflow never stalls silently. |
| 6 | **Private cloud only** | All Dify agents, knowledge bases, LLM model calls, and APIs run within DBS OpenShift. No data leaves the DBS private cloud boundary. |
| 7 | **Single case identity** | Every event, agent call, document, decision, and notification is bound to a unique `case_id` (Account Opening Reference — AOR). All agents share this as the primary key. |

---

## 2. Dify Agent Type Reference

| Dify Type | Code | Behaviour | When to Use in DCE |
|---|---|---|---|
| **Workflow** | WF | Deterministic, node-based DAG execution. Defined sequence of nodes — Start → LLM / Tool / Code / Condition / Iteration → End. No free reasoning loop. | Structured pipelines with predictable steps and branching. Orchestration, document processing, notification, integration, audit. |
| **Chatflow** | CF | Conversational workflow. Maintains dialogue context across turns. Supports Answer nodes for interactive responses. | Human-facing interactions where a stakeholder needs to query, review, or respond iteratively — RM reviewing KYC brief, Desk Support reviewing signature results. |
| **Agent** | AG | LLM-powered autonomous reasoning loop. Dynamically decides which tools to call and in what order based on the task. Supports complex tool chaining. | Tasks requiring judgment, dynamic tool selection, and multi-step reasoning across variable inputs — KYC entity analysis, financial metric interpretation. |

> **DCE Platform Decision:** The dominant agent type in DCE Account Opening is **Workflow (WF)** — financial operations require deterministic, auditable execution. The KYC/CDD Preparation Agent uses **Agent (AG)** type because of the dynamic nature of entity structure analysis and multi-tool screening. Workbench-facing review interactions use **Chatflow (CF)** to support stakeholder dialogue.

---

## 3. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          DBS PRIVATE CLOUD (OpenShift)                           │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                    AGENTIC WORKBENCH (Angular SPA)                       │    │
│  │                                                                          │    │
│  │  [Sales Dealer View] [Desk Support View] [RM View] [Credit View]        │    │
│  │  [TMO Static View]   [Management View]   [Audit View]                   │    │
│  └────────────────────────────┬────────────────────────────────────────────┘    │
│                               │ REST / WebSocket                                 │
│  ┌────────────────────────────▼────────────────────────────────────────────┐    │
│  │               JAVA SPRING BOOT BACKEND (API Gateway)                    │    │
│  │                                                                          │    │
│  │  Case Mgmt API │ Document API │ Workflow API │ Audit API │ Notification  │    │
│  └────────┬───────────────┬─────────────────┬────────────────────┬─────────┘    │
│           │               │                 │                    │               │
│           ▼               ▼                 ▼                    ▼               │
│      ┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────────┐       │
│      │ MariaDB │    │ MongoDB  │    │    Kafka      │    │  Dify        │       │
│      │(Cases,  │    │(Docs,    │    │  Event Bus    │    │  Platform    │       │
│      │ Audit,  │    │ Sigs,    │    │               │    │  (AI Gateway)│       │
│      │ SLA)    │    │ PDFs)    │    │               │    │              │       │
│      └─────────┘    └──────────┘    └──────┬───────┘    └──────┬───────┘       │
│                                             │                    │               │
│                                             │         ┌──────────▼───────────┐  │
│                                             │         │   DCE DOMAIN         │  │
│                                             │         │   ORCHESTRATOR       │  │
│                                             │         │   AGENT  (WF)        │  │
│                                             │         └──────────┬───────────┘  │
│                                             │                    │               │
│                              ┌──────────────┼────────────────────┤               │
│                              │              │                    │               │
│              ┌───────────────▼──┐    ┌──────▼──────┐    ┌───────▼────────┐     │
│              │ SA-1  SA-2  SA-3  │    │ SA-4  SA-5  │    │ SA-6  SA-7    │     │
│              │ Inbox  DocIntel  Sig │    │KYC/CDD Credit│    │StaticCfg Notif│   │
│              │ (WF)  (WF)   (WF) │    │(AG)   (WF)  │    │ (WF)   (WF)  │     │
│              └──────────────────┘    └─────────────┘    └───────────────┘     │
│                                                                                  │
│              ┌──────────────────────────────────────────────────────────┐       │
│              │       SA-8 Integration Agent (WF)  │  SA-9 Audit (WF)   │       │
│              └──────────────────────┬─────────────────────────────────-─┘       │
│                                     │                                            │
└─────────────────────────────────────┼────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼──────────────────────────────┐
          │           │               │            │                  │
       ┌──▼──┐    ┌───▼──┐       ┌───▼──┐     ┌──▼───┐          ┌───▼──┐
       │UBIX │    │ CLS  │       │ CQG  │     │ SIC  │          │  CV  │
       │     │    │      │       │      │     │      │          │  IDB │
       └─────┘    └──────┘       └──────┘     └──────┘          └──────┘
                         DOWNSTREAM OPERATIONAL SYSTEMS
```

---

## 4. DCE Domain Orchestrator Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Domain-level master controller for the Account Opening use case. Single source of truth for case state, workflow phase, SLA, and parallel stream coordination. |
| **Trigger** | Webhook — fired by Spring Boot backend on case events (new email received, document validated, signature approved, RM decision captured, Credit decision captured, TMO Static confirmed) |
| **Input Variables** | `case_id`, `trigger_event`, `trigger_payload`, `timestamp` |
| **Output** | Updated case state pushed to MariaDB + Kafka event emitted |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · trigger_event · trigger_payload · timestamp

CODE NODE — Parse & Validate Trigger
  └─ Validate trigger_event is in known enum
  └─ Extract case context from trigger_payload

HTTP REQUEST NODE — Fetch Case State
  └─ GET /api/cases/{case_id} → current phase, status, priority, SLA timestamps

KNOWLEDGE RETRIEVAL NODE — SLA Policy KB
  └─ Retrieve SLA thresholds for this case's complexity class (Standard / Complex)

CODE NODE — SLA Calculation
  └─ Calculate elapsed time per phase
  └─ Determine SLA status: ON_TRACK / WARNING / BREACHED

CONDITION NODE (IF/ELSE) — Route by trigger_event
  │
  ├─ [EMAIL_RECEIVED]
  │     └─ HTTP REQUEST → Call SA-1 Inbox Monitor Agent
  │
  ├─ [DOCUMENTS_RECEIVED]
  │     └─ HTTP REQUEST → Call SA-2 Document Intelligence Agent
  │
  ├─ [CHECKLIST_COMPLETE]
  │     └─ HTTP REQUEST → Call SA-3 Signature Verification Agent
  │
  ├─ [SIGNATURE_APPROVED]
  │     └─ HTTP REQUEST → Call SA-4 KYC/CDD Preparation Agent (Phase 3A)
  │     └─ HTTP REQUEST → Call SA-6 Static Config Agent (begin spec prep — Phase 3 parallel)
  │
  ├─ [RM_DECISION_CAPTURED]
  │     └─ HTTP REQUEST → Call SA-5 Credit Preparation Agent (Phase 3B)
  │     └─ HTTP REQUEST → Call SA-6 Static Config Agent (full config release)
  │
  ├─ [CREDIT_APPROVED]
  │     └─ HTTP REQUEST → Call SA-8 Integration Agent (CLS, CQG, IDB triggers)
  │
  ├─ [TMO_STATIC_CONFIRMED]
  │     └─ Check parallel stream status (Credit stream + TMO Static stream)
  │
  └─ [BOTH_STREAMS_COMPLETE]
        └─ HTTP REQUEST → Call SA-9 Audit Agent (validate completion gate)
        └─ IF gate passes → HTTP REQUEST → Call SA-7 Notification Agent (Welcome Kit)
        └─ IF gate fails → route back to responsible team

CONDITION NODE — SLA Warning Check
  └─ IF WARNING → HTTP REQUEST → Call SA-7 (send SLA warning notification)
  └─ IF BREACHED → HTTP REQUEST → Call SA-7 (send escalation)

HTTP REQUEST NODE — Update Case State
  └─ PATCH /api/cases/{case_id}/status

TOOL NODE — kafka_publish
  └─ Emit dce.case.status.changed event

END NODE
  └─ Output: case_id · new_status · next_action · sla_status
```

### Knowledge Bases
| KB | Usage |
|---|---|
| SLA Policy KB | Retrieve SLA thresholds by complexity class to drive SLA calculation and escalation triggers |
| Exception Handling Playbook KB | Determine correct routing when an exception event is received (sanctions hit, credit decline, signature mismatch) |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Spring Boot Case Management API | Fetch and update case state (`GET /cases/{id}`, `PATCH /cases/{id}/status`) |
| Spring Boot Workflow API | Trigger sub-agent workflows (`POST /workflow/trigger`) |
| Kafka Producer (MCP Tool) | Publish case status change events |
| SA-1 through SA-9 Dify Workflow APIs | Invoke sub-agents via HTTP Request nodes |

---

## 5. SA-1 — Inbox Monitor Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Continuously watches the functional Outlook/Exchange inbox. Detects new emails, extracts metadata and attachments, identifies whether the email belongs to an existing case or represents a new account opening trigger, and hands the structured payload to the DCE Orchestrator. |
| **Trigger** | Scheduled (every 2 minutes) OR Webhook from Microsoft Graph API subscription (push notification on new email) |
| **Input Variables** | `run_timestamp` (scheduled) OR `email_notification_payload` (webhook) |
| **Output** | `case_id` · `email_id` · `attachment_list` · `email_intent` · `is_new_case` |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: run_timestamp OR email_notification_payload

TOOL NODE — email_monitor (Microsoft Graph API)
  └─ List unread emails from functional inbox since last run
  └─ Returns: [email_id, sender, subject, received_at, has_attachments]

CONDITION NODE — Any new emails?
  └─ IF none → END NODE (no-op)
  └─ IF emails found → continue

ITERATION NODE — For each new email
  │
  ├─ TOOL NODE — email_attachment_extractor
  │     └─ Extract all attachments: filename, content_type, binary_content, size
  │
  ├─ LLM NODE — Classify Email Intent
  │     └─ Prompt: Classify email as: NEW_ACCOUNT_OPENING / DOCUMENT_RESUBMISSION /
  │                MANDATE_LETTER / PHYSICAL_COPY_NOTICE / OTHER
  │     └─ Extract: customer name, any reference numbers, product mentions
  │
  ├─ CONDITION NODE — New or Existing Case?
  │     ├─ [NEW] → HTTP REQUEST: POST /api/cases (create preliminary case)
  │     │           └─ Returns new case_id
  │     └─ [EXISTING] → HTTP REQUEST: GET /api/cases?email_ref={email_id}
  │                      └─ Returns existing case_id
  │
  ├─ TOOL NODE — document_store (MongoDB)
  │     └─ Store each attachment with case_id linkage and email metadata
  │
  ├─ TOOL NODE — kafka_publish
  │     └─ Emit: dce.document.ingested (case_id, email_id, attachment_count)
  │
  └─ HTTP REQUEST NODE — Notify DCE Orchestrator
        └─ POST /workflow/trigger {case_id, trigger_event: DOCUMENTS_RECEIVED}

TOOL NODE — Mark emails as read / archive
  └─ Microsoft Graph API: mark processed emails

END NODE
  └─ Output: processed_email_count · cases_created · cases_updated
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Document Taxonomy KB | Used by the LLM classification node to correctly identify email intent from subject and body keywords |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Microsoft Graph API (email_monitor) | Connect to Outlook/Exchange, list unread emails from functional inbox |
| Microsoft Graph API (email_attachment_extractor) | Download attachment binaries from each email |
| Spring Boot Document API | Store attachment metadata and binaries linked to case_id |
| Spring Boot Case Management API | Create new case or look up existing case |
| Kafka Producer (kafka_publish) | Emit `dce.document.ingested` event |
| DCE Orchestrator Webhook | Trigger orchestrator on documents received |

---

## 6. SA-2 — Document Intelligence Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Receives a document set linked to a case. Performs OCR, classifies each document, extracts structured data fields, validates completeness against the case-specific checklist, performs cross-document consistency checks, and generates precise gap notices when items are missing or inconsistent. |
| **Trigger** | HTTP Request from DCE Orchestrator on `DOCUMENTS_RECEIVED` event |
| **Input Variables** | `case_id` · `document_ids[]` · `entity_type` · `products_requested[]` · `jurisdiction` |
| **Output** | `completeness_status` · `extracted_data` · `gap_items[]` · `consistency_flags[]` · `checklist_result` |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · document_ids[] · entity_type · products_requested[] · jurisdiction

HTTP REQUEST NODE — Fetch Documents
  └─ GET /api/documents?case_id={case_id}
  └─ Returns: document list with binaries (base64 or presigned URLs from MongoDB)

KNOWLEDGE RETRIEVAL NODE — Checklist Rules KB
  └─ Query: entity_type + products_requested + jurisdiction
  └─ Returns: required_document_list (mandatory + conditional schedules)

KNOWLEDGE RETRIEVAL NODE — Document Taxonomy KB
  └─ Retrieve all known document types with identifiers and required fields

ITERATION NODE — For each document
  │
  ├─ TOOL NODE — document_ocr
  │     └─ Extract machine-readable text from scanned/photographed document
  │
  ├─ LLM NODE (Vision) — Classify Document Type
  │     └─ Inputs: document image + Document Taxonomy KB context
  │     └─ Output: document_type · confidence_score · document_version
  │
  ├─ LLM NODE — Extract Structured Data Fields
  │     └─ Inputs: OCR text + document_type classification
  │     └─ Extract: entity_name, id_numbers, dates, addresses, LEI, director_names,
  │                  ubo_details, commission_terms, signatory_list, signatures_present
  │     └─ Output: extracted_fields (structured JSON)
  │
  ├─ CONDITION NODE — Extraction Confidence Check
  │     ├─ HIGH → proceed
  │     └─ LOW → flag for manual review, continue with partial data
  │
  └─ TOOL NODE — document_store
        └─ Update MongoDB document record: type, extracted_fields, confidence, version

CODE NODE — Completeness Validation
  └─ Compare extracted document_types against required_document_list
  └─ Identify: present_documents · missing_documents · conditional_unmet
  └─ Output: completeness_status (COMPLETE / INCOMPLETE) · missing_items[]

CODE NODE — Consistency Cross-Check
  └─ Compare entity_name across all documents
  └─ Compare director_names in mandate vs ACRA/CoI
  └─ Compare addresses across identity and corporate documents
  └─ Compare UBO declarations against corporate structure
  └─ Compare signatory_list vs authorised_traders named in request
  └─ Output: consistency_status · inconsistency_flags[]

CONDITION NODE — Complete & Consistent?
  │
  ├─ [COMPLETE + CONSISTENT]
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id} {phase: DOC_VALIDATION_PASSED}
  │     └─ TOOL: kafka_publish (dce.checklist.complete)
  │     └─ HTTP REQUEST: Notify DCE Orchestrator (CHECKLIST_COMPLETE)
  │
  ├─ [INCOMPLETE]
  │     └─ LLM NODE — Generate Precise Gap Notice
  │           └─ Inputs: missing_items[], inconsistency_flags[], Regulatory KB context
  │           └─ Output: gap_notice (specific items, document refs, resolution guidance)
  │     └─ HTTP REQUEST: POST /api/notifications (gap_notice → Sales Dealer workbench)
  │     └─ HTTP REQUEST: PUT /api/cases/{case_id}/gap_items
  │
  └─ [INCONSISTENCY FOUND]
        └─ LLM NODE — Generate Inconsistency Report
              └─ Specific field, document A vs document B, resolution path
        └─ HTTP REQUEST: POST /api/notifications (inconsistency → Sales Dealer)

TOOL NODE — kafka_publish
  └─ Emit: dce.document.classified (case_id, results_summary)

END NODE
  └─ Output: completeness_status · extracted_data{} · gap_items[] · consistency_flags[]
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Document Taxonomy KB | LLM document classification — all known document types, identifiers, version markers |
| Checklist Rules KB | Completeness validation — entity type × product × jurisdiction → required document matrix |
| GTA & Schedule Reference KB | Validate GTA version and applicable schedules for this case's product scope |
| Regulatory Requirements KB | Identify retail investor-specific document requirements (MAS risk disclosures) |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| OCR Service (document_ocr) | Extract text from scanned/photographed documents |
| LLM Vision (Claude via Dify) | Document type classification and structured field extraction |
| Spring Boot Document API | Fetch document binaries, update document metadata |
| Spring Boot Case Management API | Update case validation status, store gap items |
| Spring Boot Notification API | Post gap notices to Sales Dealer workbench view |
| Kafka Producer (kafka_publish) | Emit `dce.document.classified` and `dce.checklist.complete` events |
| DCE Orchestrator Webhook | Signal checklist complete to advance case |

---

## 7. SA-3 — Signature Verification Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) with Human-in-the-Loop pause |
| **Role** | Extracts signature regions from all submitted documents requiring execution. Validates each signatory's authority against the company mandate. Compares each signature against the corresponding ID document using a trained signature comparison model with confidence scoring. Presents results to COO Desk Support via the workbench for human approval. Parks execution until human decision is received. Stores verified specimens on approval. |
| **Trigger** | HTTP Request from DCE Orchestrator on `CHECKLIST_COMPLETE` event |
| **Input Variables** | `case_id` · `document_ids[]` · `company_mandate_id` |
| **Output** | `verification_results[]` (per signatory: authority_status · confidence_score · outcome) |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · document_ids[] · company_mandate_id

HTTP REQUEST NODE — Fetch Documents & Mandate
  └─ GET /api/documents?case_id={case_id}&type=execution_required
  └─ GET /api/documents/{company_mandate_id}

KNOWLEDGE RETRIEVAL NODE — Signature Verification Guidelines KB
  └─ Retrieve confidence thresholds: HIGH (≥85%) / MEDIUM (60–84%) / LOW (<60%)
  └─ Retrieve evidence packaging requirements for audit

ITERATION NODE — For each document requiring execution
  │
  ├─ TOOL NODE — signature_extractor
  │     └─ Vision model: identify and extract all signature regions as image crops
  │     └─ Returns: signature_regions[] (image, page_ref, field_label, signatory_name)
  │
  └─ (Build signatory map: signatory_name → all their signatures across documents)

ITERATION NODE — For each unique signatory
  │
  ├─ TOOL NODE — signatory_authority_checker
  │     └─ Cross-reference signatory name against company mandate authorised list
  │     └─ Returns: is_authorised · role_in_mandate · discrepancies[]
  │
  ├─ TOOL NODE — signature_comparator
  │     └─ Compare extracted signature against ID document signature specimen
  │     └─ Returns: confidence_score (0–100) · similarity_map (image overlay)
  │
  ├─ CODE NODE — Apply Confidence Threshold Rules
  │     └─ HIGH (≥85%): auto_pass = true
  │     └─ MEDIUM (60–84%): flag_for_review = true
  │     └─ LOW (<60%): escalate_immediate = true · pause_processing = true
  │
  └─ TEMPLATE TRANSFORM NODE — Build Signatory Verification Record
        └─ signatory_name · authority_status · confidence_score · flag_status
        └─ side_by_side_image_ref · submitted_doc_ref · id_doc_ref · timestamp

TEMPLATE TRANSFORM NODE — Build Verification Summary Report
  └─ Aggregate all signatory records into workbench-ready report
  └─ Overall status: ALL_HIGH / MIXED_FLAGS / HAS_ESCALATIONS

HTTP REQUEST NODE — Post to Desk Support Workbench Queue
  └─ POST /api/workbench/signature-queue
  └─ Payload: case_id · verification_report · documents_for_review · priority

TOOL NODE — kafka_publish
  └─ Emit: dce.signature.analysed (case_id, signatory_count, flag_count)

HTTP REQUEST NODE — Notify COO Desk Support (SA-7 trigger)
  └─ POST /api/notifications/inapp {persona: DESK_SUPPORT, case_id, action: SIGNATURE_REVIEW}

─── EXECUTION PARKS HERE ───────────────────────────────────────────
  (Spring Boot backend holds workflow state.
   COO Desk Support reviews in workbench and submits decision via API.
   Spring Boot calls Dify Workflow resume endpoint with decision payload.)
────────────────────────────────────────────────────────────────────

START (RESUME) NODE — Human Decision Received
  └─ Inputs: case_id · decisions[] [{signatory_id, outcome: APPROVED/REJECTED/CLARIFY, notes}]

ITERATION NODE — For each signatory decision
  │
  ├─ [APPROVED]
  │     └─ TOOL NODE — signature_store
  │           └─ Store specimen in MongoDB: signatory_id, entity_id, source_doc,
  │                                          confidence_score, approving_officer, timestamp
  │
  ├─ [REJECTED]
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id} {status: SIGNATURE_REJECTED}
  │     └─ HTTP REQUEST: Notify DCE Orchestrator (signature_rejected, reason)
  │
  └─ [CLARIFY]
        └─ HTTP REQUEST: Call SA-7 (send_customer_clarification_email)

CONDITION NODE — All Signatures Approved?
  ├─ [YES] → HTTP REQUEST: Notify DCE Orchestrator (SIGNATURE_APPROVED)
  │           TOOL: kafka_publish (dce.signature.approved)
  └─ [NO]  → HTTP REQUEST: Update case status (SIGNATURE_PENDING_CLARIFICATION)

END NODE
  └─ Output: verification_results[] · specimens_stored[] · overall_outcome
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Signature Verification Guidelines KB | Confidence threshold definitions, evidence packaging standards, escalation criteria |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Signature Extractor Model (signature_extractor) | Vision model — extract signature region crops from document images |
| Signature Comparison Model (signature_comparator) | Trained model — compare two signature images, return confidence score and visual overlay |
| signatory_authority_checker (MCP Tool) | Cross-reference signatory name against company mandate authorised list |
| signature_store (MCP Tool) | Persist verified signature specimen to MongoDB with full metadata |
| Spring Boot Document API | Fetch documents and ID proofs for comparison |
| Spring Boot Workbench API | Post signature review task to Desk Support queue |
| Spring Boot Notification API | In-app notification to COO Desk Support |
| Kafka Producer (kafka_publish) | Emit `dce.signature.analysed` and `dce.signature.approved` |
| Dify Workflow Resume API | Spring Boot calls this to resume workflow after human decision |

---

## 8. SA-4 — KYC / CDD Preparation Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Agent (AG) |
| **Role** | Dynamically extracts the legal entity structure and ownership chain from the extracted document data. Runs entity and individual names through sanctions, PEP, and adverse media screening tools. Reasons over variable corporate structures (simple entities, funds, multi-jurisdictional structures) to build a complete, structured KYC/CDD/BCAP review brief for the Relationship Manager. Captures all RM decisions including KYC risk rating, CDD/BCAP clearance, Credit Assessment Approach (IRB/SA), and limit recommendations. |
| **Trigger** | HTTP Request from DCE Orchestrator on `SIGNATURE_APPROVED` event |
| **Input Variables** | `case_id` · `extracted_data{}` · `entity_type` · `jurisdiction` · `products_requested[]` |
| **Output** | `kyc_brief{}` · `rm_decisions{}` (KYC rating, CDD, BCAP, CAA approach, DCE Limit, DCE-PCE Limit, OSCA case no.) |

### Building Blocks (Dify Nodes — Agent Reasoning Loop)

```
START NODE
  └─ Inputs: case_id · extracted_data{} · entity_type · jurisdiction · products_requested[]

KNOWLEDGE RETRIEVAL NODE — Regulatory Requirements KB
  └─ Retrieve KYC/CDD rules for this jurisdiction and entity type
  └─ Retrieve MAS retail investor requirements if entity_type = RETAIL

KNOWLEDGE RETRIEVAL NODE — GTA & Schedule Reference KB
  └─ Retrieve applicable product schedules and regulatory classification requirements

─── AGENT REASONING LOOP BEGINS ────────────────────────────────────
  (The Agent LLM receives system prompt, tools, KBs, and task context.
   It dynamically decides which tools to call and in what sequence
   based on the entity structure complexity.)

  System Prompt Role: "You are a DCE KYC/CDD Preparation Specialist.
  Your task is to prepare a complete KYC/CDD/BCAP review brief for the
  Relationship Manager. You have access to the following tools:
  entity_structure_extractor, sanctions_screener, pep_screener,
  adverse_media_search, acra_lookup, document_retriever, brief_compiler.
  Always screen ALL individual names found in the document set.
  Never make a KYC determination — surface findings for RM review."

  TOOL — entity_structure_extractor
    └─ Parse extracted_data to build ownership chain
    └─ Identify: parent entities, subsidiaries, beneficial owners (>threshold), directors

  TOOL — sanctions_screener
    └─ Screen: entity_name + all director_names + all UBO_names
    └─ Returns: hit_status, hit_detail per name

  CONDITION: IF sanctions hit confirmed → IMMEDIATE SUSPEND
    └─ HTTP REQUEST: POST /api/escalations {type: SANCTIONS_HIT, case_id, detail}
    └─ Notify Compliance (via SA-7) — DO NOT continue
    └─ END NODE (suspended)

  TOOL — pep_screener
    └─ Screen directors and UBOs for PEP status
    └─ Returns: pep_flags[] with source and detail

  TOOL — adverse_media_search
    └─ Search for adverse media on entity and key individuals
    └─ Returns: adverse_media_hits[] with source, date, summary

  TOOL — acra_lookup (or document_retriever for Certificate of Incumbency)
    └─ Retrieve corporate registry data: directors, shareholders, registered capital
    └─ Validate against submitted ACRA/CoI document

  TOOL — document_retriever
    └─ Retrieve UBO/Guarantor ID documents for brief inclusion
    └─ Confirm minimum 2 key directors' IDs are present

  TOOL — brief_compiler
    └─ Assemble structured KYC/CDD/BCAP brief:
        · Entity Summary (legal name, jurisdiction, incorporation date, LEI)
        · Ownership Structure Map (visual / tabular)
        · ACRA / Certificate of Incumbency Summary
        · Directors' Identification Summary (min 2 key directors)
        · UBO / Guarantor Identification Details
        · Screening Results (sanctions: CLEAR/HIT, PEP: NONE/FLAGGED, adverse media)
        · Source of Wealth Indicators (from financial documents)
        · Risk Factors Identified
        · Retail Investor Flag + MAS Risk Disclosure Confirmation (if applicable)
        · Open Questions for RM Investigation
        · Suggested Risk Rating Range (agent-suggested, RM confirms)

─── AGENT REASONING LOOP ENDS ──────────────────────────────────────

HTTP REQUEST NODE — Post Brief to RM Workbench Queue
  └─ POST /api/workbench/rm-review-queue {case_id, kyc_brief}

HTTP REQUEST NODE — Notify RM via SA-7
  └─ POST /workflow/trigger {agent: SA-7, action: NOTIFY_RM, case_id}

─── EXECUTION PARKS HERE (RM REVIEW) ───────────────────────────────
  (RM reviews brief in workbench — Chatflow (CF) companion agent
   allows RM to ask clarifying questions about screening results
   before submitting decisions.)
────────────────────────────────────────────────────────────────────

START (RESUME) NODE — RM Decision Received
  └─ Inputs: case_id · rm_decisions{}

PARAMETER EXTRACTOR NODE — Capture & Validate RM Decisions
  └─ kyc_risk_rating · cdd_clearance · bcap_clearance
  └─ caa_approach (IRB / SA) · recommended_dce_limit · recommended_dce_pce_limit
  └─ osca_case_number · limit_exposure_indication

CONDITION NODE — All mandatory RM fields present?
  ├─ YES → HTTP REQUEST: PATCH /api/cases/{case_id}/rm_decisions {rm_decisions}
  │         HTTP REQUEST: Notify DCE Orchestrator (RM_DECISION_CAPTURED)
  │         TOOL: kafka_publish (dce.rm.decision.captured)
  └─ NO  → HTTP REQUEST: Return to RM workbench (specific missing fields highlighted)

END NODE
  └─ Output: kyc_brief{} · rm_decisions{} · screening_results{}
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Regulatory Requirements KB | KYC/CDD rules by jurisdiction and entity type; MAS retail investor obligations; CDD enhanced due diligence triggers |
| GTA & Schedule Reference KB | Product-driven regulatory classification; applicable schedule confirmation |
| DCE Product Reference KB | Product risk profiles to inform suggested risk rating range |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Entity Structure Extractor (MCP Tool) | Parse extracted_data to build ownership chain and identify all individuals requiring screening |
| Sanctions Screener API | Screen all names against sanctions lists (e.g., Refinitiv World-Check API or internal screening tool) |
| PEP Screener API | Screen directors and UBOs for Politically Exposed Person status |
| Adverse Media Search API | Search adverse media databases for entity and key individuals |
| ACRA Lookup API (or document_retriever) | Retrieve Singapore corporate registry data for validation |
| Brief Compiler (MCP Tool) | Assemble structured KYC/CDD/BCAP brief from all gathered data |
| Spring Boot Workbench API | Post KYC brief to RM review queue |
| Spring Boot Notification API | Notify RM of pending review task |
| Kafka Producer (kafka_publish) | Emit `dce.rm.decision.captured` |
| Dify Workflow Resume API | Resume workflow after RM submits decisions |

---

## 9. SA-5 — Credit Preparation Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Extracts financial data from submitted audited financial statements, pre-calculates key credit metrics, and compiles a structured credit analysis brief for the Credit Team incorporating the RM's recommendations. Routes to Credit Team, captures their approved limits and conditions, and confirms downstream Credit system setups (CLS, CQG, IDB) are completed. |
| **Trigger** | HTTP Request from DCE Orchestrator on `RM_DECISION_CAPTURED` event |
| **Input Variables** | `case_id` · `rm_decisions{}` · `financial_document_ids[]` · `products_requested[]` |
| **Output** | `credit_brief{}` · `credit_decisions{}` (approved limits, conditions, CAA approach) |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · rm_decisions{} · financial_document_ids[] · products_requested[]

HTTP REQUEST NODE — Fetch Financial Documents
  └─ GET /api/documents?case_id={case_id}&type=financial_statements

KNOWLEDGE RETRIEVAL NODE — DCE Product Reference KB
  └─ Retrieve typical margin profiles for products_requested
  └─ Retrieve benchmarking data (comparable client limit ranges where available)

ITERATION NODE — For each financial statement
  │
  ├─ LLM NODE — Extract Financial Data
  │     └─ Extract: total_equity, net_asset_value, leverage_ratio, current_ratio,
  │                  revenue, net_profit, existing_debt_obligations
  │
  └─ TEMPLATE TRANSFORM NODE — Structure financial data by year

CODE NODE — Calculate Credit Metrics
  └─ net_asset_value · total_equity
  └─ leverage_ratio = total_debt / total_equity
  └─ liquidity_indicator = current_assets / current_liabilities
  └─ revenue_trend (YoY change)
  └─ profitability_trend (YoY change)
  └─ estimated_initial_limit = f(trading_volume, product_margin_profile)

TEMPLATE TRANSFORM NODE — Compile Credit Brief
  └─ Entity financial summary with pre-calculated metrics
  └─ Products requested + typical margin profiles
  └─ RM recommended CAA approach (IRB / SA)
  └─ RM recommended DCE Limit + DCE-PCE Limit in SGD
  └─ OSCA Case Number
  └─ Limit exposure indication from RM
  └─ Estimated initial limit requirement
  └─ Comparable client benchmarks (if available)
  └─ Any conditions from RM review noted

HTTP REQUEST NODE — Post Brief to Credit Team Workbench
  └─ POST /api/workbench/credit-review-queue {case_id, credit_brief}

HTTP REQUEST NODE — Notify Credit Team via SA-7
  └─ POST /workflow/trigger {agent: SA-7, action: NOTIFY_CREDIT, case_id}

─── EXECUTION PARKS HERE (CREDIT TEAM REVIEW) ──────────────────────
────────────────────────────────────────────────────────────────────

START (RESUME) NODE — Credit Decision Received
  └─ Inputs: case_id · credit_decisions{}

PARAMETER EXTRACTOR NODE — Capture & Validate Credit Decisions
  └─ approved_dce_limit · approved_dce_pce_limit
  └─ confirmed_caa_approach · conditions[] · credit_outcome (APPROVED/DECLINED)

CONDITION NODE — Approved or Declined?
  │
  ├─ [DECLINED]
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id} {status: CREDIT_DECLINED}
  │     └─ HTTP REQUEST: Notify DCE Orchestrator (CREDIT_DECLINED)
  │     └─ HTTP REQUEST: Call SA-7 (notify Sales Dealer with reason)
  │     └─ END (workflow terminated)
  │
  └─ [APPROVED]
        └─ CONDITION NODE — Any conditions?
             ├─ YES → HTTP REQUEST: POST /api/cases/{case_id}/conditions
             │         (tracked as open items, block Welcome Kit until resolved)
             └─ NO  → continue

HTTP REQUEST NODE — Store Credit Decisions
  └─ PATCH /api/cases/{case_id}/credit_decisions

HTTP REQUEST NODE — Notify DCE Orchestrator (CREDIT_APPROVED)
  └─ DCE Orchestrator triggers SA-8 for CLS, CQG, IDB setup

END NODE
  └─ Output: credit_brief{} · credit_decisions{} · conditions_tracker[]
```

### Knowledge Bases
| KB | Usage |
|---|---|
| DCE Product Reference KB | Typical margin profiles per product for limit context; comparable client benchmarks |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| LLM (Claude via Dify) | Extract financial data from audited statements (LLM node) |
| Spring Boot Document API | Fetch financial statement documents |
| Spring Boot Workbench API | Post credit brief to Credit Team review queue |
| Spring Boot Case Management API | Store credit decisions and conditions |
| Spring Boot Notification API | Notify Credit Team of pending review |
| Dify Workflow Resume API | Resume workflow after Credit Team submits decisions |

---

## 10. SA-6 — Static Configuration Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Builds the configuration specification for UBIX, SIC, and CV systems in two stages: (1) pre-builds the spec template during Phase 3 as soon as entity and product data is available, using placeholder values for credit limits; (2) on DCE Orchestrator signal, populates confirmed values and generates the complete, validated TMO Static instruction. After TMO Static executes, reads back configured values and validates correctness before releasing the completion signal. |
| **Trigger** | Stage 1: HTTP Request from DCE Orchestrator on `SIGNATURE_APPROVED` (begin prep) · Stage 2: HTTP Request on `RM_DECISION_CAPTURED` (full release) |
| **Input Variables** | `case_id` · `extracted_data{}` · `rm_decisions{}` · `credit_decisions{}` · `mandate_traders[]` |
| **Output** | `config_spec{}` · `tmo_instruction{}` · `validation_result{}` |

### Building Blocks (Dify Nodes)

```
─── STAGE 1: SPEC PRE-BUILD (runs in parallel with KYC/CDD and Credit) ───

START NODE (Stage 1)
  └─ Inputs: case_id · extracted_data{} · products_requested[]

KNOWLEDGE RETRIEVAL NODE — DCE Product Reference KB
  └─ Retrieve product permission codes for UBIX and SIC for products_requested

KNOWLEDGE RETRIEVAL NODE — Commission Structure KB
  └─ Retrieve commission rate reference (validate against Sales Dealer agreed rates)

KNOWLEDGE RETRIEVAL NODE — Downstream System Reference KB
  └─ Retrieve field mapping definitions for UBIX / SIC / CV

CODE NODE — Build Config Spec Template
  └─ UBIX fields: entity_name, address, LEI, entity_type, regulatory_flags,
                   reporting_jurisdiction, customer_static_data
  └─ SIC fields: account_mapping, product_permissions[], commission_rates (PLACEHOLDER),
                  credit_limits (PLACEHOLDER), margin_parameters
  └─ CV fields: contract_mapping, static_data_linkage, settlement_account_linkage,
                 customer_bank_details
  └─ Authorised traders: extracted from mandate letter (name, ID, designation)
  └─ Mark PLACEHOLDER fields: credit limits (pending Credit Team decision)

HTTP REQUEST NODE — Store Draft Config Spec
  └─ POST /api/cases/{case_id}/config_spec {status: DRAFT, spec: config_spec}

─── STAGE 2: FULL INSTRUCTION GENERATION ──────────────────────────

START NODE (Stage 2)
  └─ Inputs: case_id · rm_decisions{} · credit_decisions{}

HTTP REQUEST NODE — Fetch Draft Config Spec
  └─ GET /api/cases/{case_id}/config_spec

CODE NODE — Populate Confirmed Values
  └─ Replace PLACEHOLDER: commission_rates (from Sales Dealer intake)
  └─ Replace PLACEHOLDER: credit_limits = credit_decisions.approved_dce_limit +
                                            credit_decisions.approved_dce_pce_limit
  └─ Confirm all authorised trader details (name, ID, CQG perms, IDB perms)

TEMPLATE TRANSFORM NODE — Generate TMO Static Instruction
  └─ Produce structured instruction document (per schema in COO guide):
      SYSTEM 1 — UBIX: all account creation parameters
      SYSTEM 2 — SIC: all mapping + commission + limit parameters
      SYSTEM 3 — CV: all contract mapping + settlement parameters
      AUTHORISED TRADERS: formatted trader activation list
      CREDIT SYSTEM CROSS-CHECK: CLS/CQG/IDB confirmations (to be filled by Credit)
      VALIDATION CHECKLIST: named items for TMO Static officer to confirm

HTTP REQUEST NODE — Post Instruction to TMO Static Workbench
  └─ POST /api/workbench/tmo-queue {case_id, tmo_instruction}

HTTP REQUEST NODE — Notify TMO Static via SA-7
  └─ POST /workflow/trigger {agent: SA-7, action: NOTIFY_TMO_STATIC, case_id}

─── EXECUTION PARKS HERE (TMO STATIC EXECUTION) ────────────────────
────────────────────────────────────────────────────────────────────

START (RESUME) NODE — TMO Static Execution Confirmed
  └─ Inputs: case_id · system_confirmations{} (UBIX, SIC, CV each confirmed/failed)

─── STAGE 3: POST-EXECUTION VALIDATION ────────────────────────────

ITERATION NODE — For each system (UBIX, SIC, CV)
  │
  ├─ HTTP REQUEST NODE — Read Back Configured Values
  │     └─ GET /api/systems/{system}/account?case_id={case_id}
  │     └─ (Read-only API access — validate, do not write)
  │
  └─ CODE NODE — Validate Against Instruction
        └─ Compare: configured_value vs instructed_value per field
        └─ Flag any discrepancy with field_name, expected, actual

CONDITION NODE — All systems validated?
  │
  ├─ [ALL PASS]
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id} {tmo_stream: COMPLETE}
  │     └─ HTTP REQUEST: Notify DCE Orchestrator (TMO_STATIC_CONFIRMED)
  │     └─ TOOL: kafka_publish (dce.stream.4b.complete)
  │
  └─ [DISCREPANCY FOUND]
        └─ HTTP REQUEST: Return to TMO Static with specific discrepancy detail
        └─ HTTP REQUEST: Call SA-7 (notify TMO Static officer with correction required)
        └─ Block DCE Orchestrator until resolved

END NODE
  └─ Output: config_spec{} · tmo_instruction{} · validation_result{} · stream_status
```

### Knowledge Bases
| KB | Usage |
|---|---|
| DCE Product Reference KB | Product permission codes for UBIX and SIC configuration |
| Commission Structure KB | Commission rate reference tables for validation against Sales Dealer agreement |
| Downstream System Reference KB | Field mapping definitions for UBIX, SIC, CV — maps extracted data fields to system input fields |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Spring Boot Case Management API | Store/retrieve draft and final config spec |
| Spring Boot Workbench API | Post TMO Static instruction to workbench queue |
| Spring Boot Notification API | Notify TMO Static Team |
| UBIX Read API | Read back configured account values for validation |
| SIC Read API | Read back configured mapping and commission values for validation |
| CV Read API | Read back configured static data linkage for validation |
| Kafka Producer (kafka_publish) | Emit `dce.stream.4b.complete` |
| Dify Workflow Resume API | Resume workflow after TMO Static confirms execution |

---

## 11. SA-7 — Notification Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Central outbound communication engine. Handles all internal task notifications, SLA warnings, escalation alerts, customer communications (gap notices, physical copy reminders, clarification requests), and Welcome Kit dispatch. Fired exclusively by explicit DCE Orchestrator or sub-agent instructions — never self-triggered. |
| **Trigger** | HTTP Request from DCE Orchestrator or any sub-agent with `notification_type` and context |
| **Input Variables** | `case_id` · `notification_type` · `recipient` · `context_payload{}` |
| **Output** | `notification_status` · `delivery_confirmation` |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · notification_type · recipient · context_payload{}

KNOWLEDGE RETRIEVAL NODE — SLA Policy KB
  └─ Retrieve SLA context (current elapsed, threshold values) for escalation messages

CONDITION NODE — Route by notification_type
  │
  ├─ [TASK_ASSIGNMENT]
  │     └─ HTTP REQUEST: POST /api/notifications/inapp
  │           {persona: recipient, case_id, task_type, deadline, priority, sla_clock}
  │
  ├─ [SLA_WARNING]
  │     └─ LLM NODE: Generate warning message with specific case context and elapsed time
  │     └─ HTTP REQUEST: POST /api/notifications/inapp {persona: team_head, urgency: WARNING}
  │     └─ TOOL: send_email_notification (team member + team lead)
  │
  ├─ [SLA_ESCALATION]
  │     └─ LLM NODE: Generate escalation message (case_id, ageing, blocking team, reason)
  │     └─ CODE NODE: Determine escalation level (TEAM_HEAD / COO_DESK_MGMT / SALES_DESK_HEAD)
  │     └─ TOOL: send_escalation (recipient = level-appropriate escalation target)
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id} {escalation_level: n}
  │
  ├─ [GAP_NOTICE_TO_CUSTOMER]
  │     └─ LLM NODE: Format gap notice email (specific items, page refs, resolution path)
  │     └─ TOOL: send_customer_email
  │
  ├─ [SIGNATURE_CLARIFICATION]
  │     └─ LLM NODE: Generate signature clarification request (specific signatory, concern)
  │     └─ TOOL: send_customer_email
  │
  ├─ [PHYSICAL_COPY_REMINDER]
  │     └─ LLM NODE: Generate physical copy reminder (specific outstanding documents)
  │     └─ CODE NODE: Determine reminder level (Day 7 / Day 14 / Day 21 / Escalation)
  │     └─ TOOL: send_customer_email (Day 7, 14, 21)
  │     └─ TOOL: send_escalation (Day 21+ → COO Desk Support management)
  │
  ├─ [WELCOME_KIT]
  │     └─ LLM NODE: Compose Welcome Kit email body using case data:
  │           account_reference, products_enabled, cqg_login_credentials,
  │           client_services_contact, statement_schedule
  │     └─ TOOL: send_welcome_kit (to customer)
  │     └─ HTTP REQUEST: POST /api/notifications/inapp {persona: SALES_DEALER, action: ACCOUNT_LIVE}
  │     └─ HTTP REQUEST: POST /api/notifications/inapp {persona: DESK_SUPPORT, action: CASE_CLOSED}
  │
  └─ [SANCTIONS_ESCALATION]
        └─ TOOL: send_escalation (recipient: COMPLIANCE, priority: CRITICAL)
        └─ HTTP REQUEST: PATCH /api/cases/{case_id} {status: SUSPENDED_SANCTIONS}

TOOL NODE — kafka_publish
  └─ Emit: dce.notification.sent (case_id, notification_type, recipient)

END NODE
  └─ Output: notification_status · delivery_timestamp · channel_used
```

### Knowledge Bases
| KB | Usage |
|---|---|
| SLA Policy KB | Provide elapsed time and threshold context for SLA warning and escalation messages |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| send_email_notification (MCP Tool) | Send email via Outlook/Exchange (Microsoft Graph API) |
| send_inapp_notification (MCP Tool) | Push real-time notification to Agentic Workbench for specific persona |
| send_escalation (MCP Tool) | Send escalation alert to DCE Sales Desk Head or Compliance with full case context |
| send_welcome_kit (MCP Tool) | Generate and dispatch Welcome Kit email to customer |
| send_customer_email (MCP Tool) | Send status update, gap notice, or clarification request to customer |
| Spring Boot Notification API | Log notification history, update case notification status |
| Kafka Producer (kafka_publish) | Emit `dce.notification.sent` |

---

## 12. SA-8 — Integration Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Manages all programmatic interactions with downstream operational systems via the Kafka event bus and REST APIs. Executes specific downstream system operations (UBIX, CLS, CQG, SIC, CV, IDB) when instructed by the DCE Orchestrator. Waits for confirmation from each system and reports back in real time. Handles failures with immediate escalation to the responsible team. |
| **Trigger** | HTTP Request from DCE Orchestrator on `CREDIT_APPROVED` (CLS/CQG/IDB) and `TMO_STATIC_EXECUTING` (UBIX/SIC/CV) events |
| **Input Variables** | `case_id` · `operation_type` · `operation_payload{}` |
| **Output** | `system_confirmations{}` · `completion_status` |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: case_id · operation_type · operation_payload{}

CONDITION NODE — Route by operation_type
  │
  ├─ [CREDIT_SYSTEMS_SETUP]  (triggered after Credit Team approval)
  │     │
  │     ├─ TOOL NODE — cls_limit_update (Kafka)
  │     │     └─ Publish: dce.cls.limit.request {case_id, dce_limit, dce_pce_limit}
  │     │     └─ Wait for: dce.cls.limit.confirmed (consume from Kafka)
  │     │
  │     ├─ TOOL NODE — cqg_login_create (Kafka)
  │     │     └─ Publish: dce.cqg.login.request {case_id, trader_details}
  │     │     └─ Wait for: dce.cqg.login.confirmed
  │     │
  │     └─ TOOL NODE — idb_platform_enable (Kafka)
  │           └─ Publish: dce.idb.enable.request {case_id, trader_details}
  │           └─ Wait for: dce.idb.enabled.confirmed
  │
  └─ [STATIC_SYSTEMS_SETUP]  (triggered during TMO Static execution)
        │
        ├─ TOOL NODE — ubix_account_create (Kafka)
        │     └─ Publish: dce.ubix.account.request {case_id, config_spec.ubix}
        │     └─ Wait for: dce.ubix.account.confirmed
        │
        ├─ TOOL NODE — sic_mapping_update (Kafka)
        │     └─ Publish: dce.sic.mapping.request {case_id, config_spec.sic}
        │     └─ Wait for: dce.sic.mapping.confirmed
        │
        └─ TOOL NODE — cv_data_update (API)
              └─ POST /api/cv/static-data {case_id, config_spec.cv}
              └─ Wait for: 200 OK confirmation

ITERATION NODE — Check all confirmations received
  │
  ├─ [ALL CONFIRMED]
  │     └─ HTTP REQUEST: PATCH /api/cases/{case_id}/system_confirmations
  │     └─ HTTP REQUEST: Notify DCE Orchestrator (SYSTEMS_CONFIRMED)
  │     └─ TOOL: kafka_publish (dce.stream.complete — 4A or 4B depending on operation_type)
  │
  └─ [TIMEOUT or FAILURE on any system]
        └─ CODE NODE: Identify which system(s) failed
        └─ HTTP REQUEST: Call SA-7 (escalate to responsible team — Credit for CLS/CQG/IDB,
                          TMO Static for UBIX/SIC/CV)
        └─ HTTP REQUEST: PATCH /api/cases/{case_id} {system_failure: [system_name, error]}

END NODE
  └─ Output: system_confirmations{} · completion_status · failures[]
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Downstream System Reference KB | System endpoint definitions, Kafka topic names, payload schemas, timeout thresholds |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| ubix_account_create (Kafka MCP Tool) | Trigger account creation in UBIX via Kafka |
| sic_mapping_update (Kafka MCP Tool) | Trigger SIC mapping update via Kafka |
| cv_data_update (REST MCP Tool) | Update CV static data via REST API |
| cls_limit_update (Kafka MCP Tool) | Trigger limit update in CLS via Kafka |
| cqg_login_create (Kafka MCP Tool) | Trigger CQG login creation via Kafka |
| idb_platform_enable (Kafka MCP Tool) | Enable IDB platform access via Kafka |
| kafka_consume (MCP Tool) | Consume confirmation events from all downstream systems |
| kafka_publish (MCP Tool) | Publish operation requests and stream completion events |
| Spring Boot Case Management API | Update system confirmation status on case |

---

## 13. SA-9 — Audit Agent

### Overview

| Attribute | Detail |
|---|---|
| **Dify Agent Type** | Workflow (WF) |
| **Role** | Always-on background agent that creates an immutable audit log entry for every action — agent or human — in the account opening lifecycle. Validates compliance gates before phase transitions. Generates structured audit reports on demand. Acts as the regulatory evidence chain for MAS and HKMA. |
| **Trigger** | Kafka event subscription (fires on every `dce.*` event) OR HTTP Request for report generation OR HTTP Request for gate validation |
| **Input Variables** | `event_type` · `case_id` · `actor{}` · `action{}` · `evidence{}` · `outcome` |
| **Output** | `audit_id` · `gate_status` (for gate validation calls) · `report{}` (for report calls) |

### Building Blocks (Dify Nodes)

```
START NODE
  └─ Inputs: event_type · case_id · actor{} · action{} · evidence{} · outcome

CONDITION NODE — Route by event_type
  │
  ├─ [ACTION_LOG]
  │     └─ CODE NODE: Build Audit Entry
  │           └─ audit_id (UUID)
  │           └─ case_id
  │           └─ timestamp (ISO 8601 with milliseconds)
  │           └─ actor: {type: HUMAN/AGENT, id, name, team}
  │           └─ action: {type, description, phase}
  │           └─ evidence: {document_ids[], confidence_scores{}, ai_model_used,
  │                          comparison_image_refs[], api_responses{}, extracted_data{}}
  │           └─ outcome: APPROVED/REJECTED/ESCALATED/COMPLETED/FAILED
  │           └─ metadata: {ip_address, session_id, workbench_view}
  │
  │     └─ HTTP REQUEST: POST /api/audit/entries {audit_entry}
  │           (MariaDB — append-only, no update permitted)
  │
  ├─ [GATE_VALIDATION]
  │     └─ HTTP REQUEST: GET /api/audit/entries?case_id={case_id}
  │     └─ CODE NODE: Check Completion Gate
  │           └─ KYC/CDD/BCAP approved by RM ✓/✗
  │           └─ Sanctions screening confirmed clear ✓/✗
  │           └─ Credit Assessment Approach confirmed ✓/✗
  │           └─ DCE Limit + DCE-PCE Limit approved ✓/✗
  │           └─ OSCA Case Number recorded ✓/✗
  │           └─ CLS updated ✓/✗
  │           └─ CQG login created ✓/✗
  │           └─ IDB access enabled ✓/✗
  │           └─ GTA executed — all parties signed ✓/✗
  │           └─ All required schedules executed ✓/✗
  │           └─ All signatures verified and approved ✓/✗
  │           └─ UBIX configured ✓/✗
  │           └─ SIC configured ✓/✗
  │           └─ CV configured ✓/✗
  │           └─ Commission rates validated ✓/✗
  │           └─ Authorised traders loaded ✓/✗
  │
  │     └─ CONDITION NODE: Gate PASS or FAIL?
  │           ├─ PASS → HTTP REQUEST: Notify DCE Orchestrator (GATE_PASSED)
  │           └─ FAIL → HTTP REQUEST: Notify DCE Orchestrator (GATE_FAILED, missing_items[])
  │
  └─ [REPORT_GENERATION]
        └─ HTTP REQUEST: GET /api/audit/entries?case_id={case_id}&report_type={type}
        └─ LLM NODE: Structure and narrate audit report
        └─ CONDITION NODE: Report type
             ├─ CASE_TRAIL → Chronological per-case full trail
             ├─ AGENT_ACTIVITY → All agent actions in time period
             ├─ HUMAN_DECISIONS → All human approval/rejection decisions
             ├─ SLA_BREACH → All breach events with root cause
             ├─ SIGNATURE_VERIFICATION → All signature comparisons with scores
             └─ SYSTEM_INTEGRATION → All downstream system interactions

END NODE
  └─ Output: audit_id · gate_status · report{}
```

### Knowledge Bases
| KB | Usage |
|---|---|
| Regulatory Requirements KB | Gate validation — ensure all regulatory-mandated steps are present before activation |

### APIs / MCP Tools
| API / Tool | Purpose |
|---|---|
| Spring Boot Audit API | POST immutable audit entries to MariaDB append-only table |
| Spring Boot Audit API | GET audit entries for gate validation and report generation |
| Kafka Consumer (kafka_consume) | Subscribe to all `dce.*` events to trigger action log entries |
| LLM (Claude via Dify) | Narrate and structure audit reports for report generation requests |
| DCE Orchestrator Webhook | Notify orchestrator of gate pass/fail outcome |

---

## 14. Knowledge Base Registry

| # | KB Name | Content | Used By | Format |
|---|---|---|---|---|
| KB-1 | **Document Taxonomy KB** | All known DCE document types with identifiers, visual markers, required fields, acceptable versions, and language requirements. Covers Application Form, GTA versions, Schedule 7A/8A, risk disclosure schedules, consent forms, ID proof types, ACRA format, Certificate of Incumbency format, and all conditional schedules. | SA-1, SA-2 | Structured text + document sample references |
| KB-2 | **Checklist Rules KB** | Complete matrix: entity type × product type × jurisdiction → required document list (mandatory + conditional). Maps which schedules are triggered by which products. Maps retail investor flags to additional MAS risk disclosure requirements. | SA-2, SA-1 | Decision matrix / rule table |
| KB-3 | **GTA & Schedule Reference KB** | Full content and metadata of GTA versions, Schedule 7A (exchange-listed clearing), Schedule 8A (LME products), all other product/exchange-specific schedules. Applicability rules for each schedule. Addendum types and their triggers. | SA-2, SA-4 | Document content + applicability rules |
| KB-4 | **Regulatory Requirements KB** | MAS and HKMA regulations applicable to DCE account opening. KYC/CDD rules by jurisdiction. Retail investor obligations. Enhanced due diligence triggers. Sanctions screening obligations. Document certification and notarisation requirements by jurisdiction. Physical copy witnessing requirements. | SA-2, SA-4, SA-9 | Regulatory text + rule summaries |
| KB-5 | **Signature Verification Guidelines KB** | Confidence threshold definitions (HIGH/MEDIUM/LOW). Evidence packaging requirements for audit. Acceptable ID document types per jurisdiction. Escalation criteria for low-confidence and mismatch cases. Model performance benchmarks and FAR/FRR targets. | SA-3 | Policy document + threshold table |
| KB-6 | **DCE Product Reference KB** | All exchange-traded products enabled at DCE. Product codes, exchange affiliations, typical margin profiles, settlement types, applicable schedules, regulatory classifications per product. | SA-2, SA-4, SA-5, SA-6 | Product reference table |
| KB-7 | **Commission Structure KB** | Commission rate reference tables by product, exchange, and client segment. Used to validate that configured rates in SIC match the rates agreed during Sales Dealer engagement. | SA-6 | Rate table |
| KB-8 | **SLA Policy KB** | SLA targets by phase and complexity class (Standard / Complex). Escalation thresholds (75%, 90%, 100%, +1 day, +2 day). Priority multipliers (Normal / High / Urgent). Escalation ladder definitions. | DCE Agent, SA-7 | Policy table |
| KB-9 | **Exception Handling Playbook KB** | Defined handling path for each exception type: sanctions hit, credit decline, credit approval with conditions, signature low confidence, document integrity concern, GTA scope conflict, static config discrepancy, commission rate mismatch, CLS/CQG/IDB incomplete. Who owns it, what the agent does, what the human must decide. | DCE Agent | Exception → handling path table |
| KB-10 | **Downstream System Reference KB** | Field mapping definitions for UBIX, SIC, CV, CLS, CQG, IDB. Kafka topic names, payload schemas, timeout thresholds. API endpoint references. System owner and support contacts. | SA-6, SA-8 | Field mapping table + system specs |

---

## 15. API & MCP Tool Registry

### External / Integrated APIs

| # | API | Provider | Protocol | Used By | Purpose |
|---|---|---|---|---|---|
| API-1 | **Microsoft Graph API — Email** | Microsoft | REST / OAuth2 | SA-1, SA-7 | Monitor functional Outlook/Exchange inbox; extract emails and attachments; send outbound emails |
| API-2 | **OCR / Document Processing** | Azure Document Intelligence (internal) | REST | SA-2 | Extract text from scanned documents; structured field extraction from forms |
| API-3 | **Sanctions Screening API** | Internal / Refinitiv World-Check | REST | SA-4 | Screen entity and individual names against global sanctions lists |
| API-4 | **PEP Screening API** | Internal / Dow Jones Risk | REST | SA-4 | Screen directors and UBOs for Politically Exposed Person status |
| API-5 | **Adverse Media Search API** | Internal / Factiva or equivalent | REST | SA-4 | Search adverse media for entity and key individuals |
| API-6 | **ACRA Lookup API** | ACRA / BizFile (Singapore) | REST | SA-4 | Retrieve Singapore corporate registry data for entity validation |
| API-7 | **Signature Comparison API** | Internal model service | REST | SA-3 | Compare two signature images; return confidence score and visual overlay |
| API-8 | **UBIX API** | Internal (TMO Static) | REST / Kafka | SA-6, SA-8 | Account creation (write via Kafka); account validation (read via REST) |
| API-9 | **SIC API** | Internal (TMO Static) | REST / Kafka | SA-6, SA-8 | Account mapping and commission setup (write via Kafka); validation (read via REST) |
| API-10 | **CV API** | Internal (TMO Static) | REST | SA-6, SA-8 | Contract and static data mapping update via REST |
| API-11 | **CLS API** | Internal (Credit) | REST / Kafka | SA-8 | Credit limit update (write via Kafka); confirmation (read via REST) |
| API-12 | **CQG API** | CQG (via internal adapter) | REST / Kafka | SA-8 | Trading platform login creation (Kafka); confirmation |
| API-13 | **IDB Platform API** | Internal (Credit) | REST / Kafka | SA-8 | Inter-Dealer Broker platform access enablement (Kafka); confirmation |
| API-14 | **Kafka Event Bus** | Internal (Apache Kafka on OpenShift) | Kafka protocol | All agents | Event publishing and consumption across all agents and downstream systems |

### Internal Spring Boot Backend APIs

| # | API Endpoint Group | Used By | Purpose |
|---|---|---|---|
| INT-1 | **Case Management API** — `/api/cases` | DCE Agent, SA-1, SA-4, SA-5, SA-6 | Create, read, update case state; store sub-task results; manage parallel stream status |
| INT-2 | **Document API** — `/api/documents` | SA-1, SA-2, SA-3, SA-5, SA-6 | Store and retrieve documents (MongoDB); manage versions; link to case_id |
| INT-3 | **Workflow API** — `/api/workflow/trigger` | DCE Agent | Trigger sub-agent Dify workflows via Dify API; resume parked workflows |
| INT-4 | **Audit API** — `/api/audit` | SA-9 | Append-only audit log writes; audit trail reads; gate validation |
| INT-5 | **Notification API** — `/api/notifications` | SA-7, all agents | Post in-app notifications to workbench; log notification history |
| INT-6 | **Workbench API** — `/api/workbench` | SA-3, SA-4, SA-5, SA-6 | Post review tasks to persona-specific workbench queues (Desk Support, RM, Credit, TMO Static) |
| INT-7 | **Signature Repository API** — `/api/signatures` | SA-3 | Store and retrieve signature specimens; search by signatory_id or entity_id |
| INT-8 | **SLA API** — `/api/sla` | DCE Agent | Calculate and update SLA status per phase; retrieve thresholds |

### MCP Tools (Python MCP Server)

| # | Tool ID | Tool Name | Consumed By | Action |
|---|---|---|---|---|
| T-01 | `email_monitor` | Email Monitor | SA-1 | List unread emails from functional inbox via Microsoft Graph API |
| T-02 | `email_attachment_extractor` | Email Attachment Extractor | SA-1 | Extract all attachments from a specific email |
| T-03 | `document_ocr` | Document OCR | SA-2 | Run OCR on document image, return structured text |
| T-04 | `document_classifier` | Document Classifier | SA-2 | Classify document type using LLM vision |
| T-05 | `document_data_extractor` | Data Extractor | SA-2 | Extract structured fields from classified document |
| T-06 | `checklist_validator` | Checklist Validator | SA-2 | Compare extracted documents against required checklist |
| T-07 | `document_store` | Document Store | SA-1, SA-2 | Store documents in MongoDB with metadata and case linkage |
| T-08 | `signature_extractor` | Signature Extractor | SA-3 | Extract signature regions from document images |
| T-09 | `signature_comparator` | Signature Comparator | SA-3 | Compare two signature images, return confidence score |
| T-10 | `signatory_authority_checker` | Authority Checker | SA-3 | Validate signatory against company mandate authorised list |
| T-11 | `signature_store` | Signature Store | SA-3 | Persist verified signature specimen to MongoDB |
| T-12 | `kafka_publish` | Kafka Publisher | All agents | Publish events to Kafka topics |
| T-13 | `kafka_consume` | Kafka Consumer | SA-8, SA-9 | Consume confirmation events from downstream systems |
| T-14 | `send_email_notification` | Email Notification | SA-7 | Send email via Outlook/Exchange |
| T-15 | `send_inapp_notification` | In-App Notification | SA-7 | Push real-time notification to Agentic Workbench |
| T-16 | `send_escalation` | Escalation | SA-7 | Send escalation alert to DCE Sales Desk Head or Compliance |
| T-17 | `send_welcome_kit` | Welcome Kit | SA-7 | Generate and dispatch Welcome Kit to customer |
| T-18 | `send_customer_email` | Customer Email | SA-7 | Send gap notice, clarification request, or reminder to customer |
| T-19 | `ubix_account_create` | UBIX Account Create | SA-8 | Trigger account creation in UBIX via Kafka |
| T-20 | `sic_mapping_update` | SIC Mapping | SA-8 | Trigger SIC mapping update via Kafka |
| T-21 | `cv_data_update` | CV Static Update | SA-8 | Update CV static data via REST API |
| T-22 | `cls_limit_update` | CLS Limit Update | SA-8 | Trigger limit update in CLS via Kafka |
| T-23 | `cqg_login_create` | CQG Login Create | SA-8 | Trigger CQG login creation via Kafka |
| T-24 | `idb_platform_enable` | IDB Platform Enable | SA-8 | Enable IDB platform access via Kafka |

---

## 16. End-to-End Agentic Flow Pipeline

```
══════════════════════════════════════════════════════════════════════════════
 START: Sales Dealer submits account opening request via structured workbench
        form — OR — Customer emails documents to functional inbox
══════════════════════════════════════════════════════════════════════════════
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 0 — INTAKE                                   │
│  Agent: SA-1 (Inbox Monitor)                        │
│  • Detects email / structured intake                │
│  • Extracts attachments                             │
│  • Creates / links case                             │
│  • Emits: dce.document.ingested                     │
│  Stakeholder Touchpoint: NONE (fully automated)     │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 1 — DOCUMENT INTELLIGENCE                    │
│  Agent: SA-2 (Document Intelligence)                │
│  • OCR + classify + extract + validate              │
│  • Completeness check against checklist             │
│  • Cross-document consistency check                 │
│  Stakeholder Touchpoint:                            │
│  → Sales Dealer (workbench) — receives gap notice   │
│    if documents are missing or inconsistent         │
│  → Customer (email) — receives structured gap       │
│    notice with specific missing items               │
│                                                     │
│  [LOOP until checklist complete]                    │
│  Emits: dce.checklist.complete                      │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 2 — SIGNATURE VERIFICATION                   │
│  Agent: SA-3 (Signature Verification — HITL)        │
│  • Extract signatures from all execution documents  │
│  • Verify signatory authority                       │
│  • Compare vs ID docs — confidence scoring          │
│  • Present to Desk Support in workbench             │
│  PARK → Wait for human decision                     │
│  Stakeholder Touchpoint:                            │
│  → COO Desk Support (workbench) — reviews           │
│    AI confidence scores, side-by-side images,       │
│    clicks Approve / Reject / Clarify per signatory  │
│  → Customer (email) — clarification request if      │
│    signature needs resolution                       │
│  Emits: dce.signature.approved                      │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 3A — KYC / CDD / BCAP (parallel starts)     │
│  Agent: SA-4 (KYC/CDD Preparation — Agent type)    │
│  • Entity extraction + ownership mapping            │
│  • Sanctions + PEP + adverse media screening        │
│  • Compile structured RM review brief               │
│  PARK → Wait for RM decision                        │
│  Stakeholder Touchpoint:                            │
│  → Relationship Manager (workbench + CF chatflow)   │
│    reviews brief, can ask clarifying questions,     │
│    submits: KYC rating, CDD, BCAP, CAA (IRB/SA),   │
│    DCE Limit recommendation, OSCA Case No.          │
│                                                     │
│  ⚠ SANCTIONS HIT → IMMEDIATE SUSPEND               │
│    Escalate directly to Compliance                  │
│  Emits: dce.rm.decision.captured                    │
│                                                     │
│  ─── PARALLEL ──────────────────────────────────   │
│  PHASE 3 PREP — STATIC CONFIG SPEC BUILD           │
│  Agent: SA-6 (Stage 1 — runs in parallel)           │
│  • Pre-builds UBIX / SIC / CV config template       │
│  • Placeholders for credit limits                   │
│  • No stakeholder touchpoint at this stage          │
└──────────────────────────┬──────────────────────────┘
                           │
                   ┌───────┴───────┐
                   │               │
                   ▼               ▼
┌────────────────────┐   ┌────────────────────────────┐
│ PHASE 3B — CREDIT  │   │ PHASE 4 — TMO STATIC       │
│ Agent: SA-5        │   │ Agent: SA-6 (Stage 2 + 3)  │
│ • Extract financials│   │ • Full config spec release │
│ • Calc metrics     │   │ • Generate TMO instruction  │
│ • Credit brief     │   │ PARK → TMO Static executes  │
│ PARK → Credit Team │   │ • Validate configuration   │
│ reviews + decides  │   │ Stakeholder Touchpoint:     │
│ Stakeholder:       │   │ → TMO Static (workbench)   │
│ → Credit Team      │   │   reviews instruction,      │
│   (workbench)      │   │   executes UBIX/SIC/CV,     │
│   approves limits  │   │   confirms each system      │
│   executes CLS/CQG │   │ Emits: dce.stream.4b.       │
│   /IDB via SA-8    │   │         complete            │
│ Emits: dce.stream. │   └────────────────────────────┘
│   4a.complete      │
└────────────────────┘
         │                          │
         └──────────┬───────────────┘
                    │ BOTH STREAMS COMPLETE
                    ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 5 — COMPLETION GATE & ACTIVATION             │
│  Agents: SA-9 (gate validation) + DCE Orchestrator  │
│  • SA-9 validates all 16 completion gate items      │
│  • Gate passed → route to COO Desk Support Senior   │
│  PARK → Human activation approval                   │
│  Stakeholder Touchpoint:                            │
│  → COO Desk Support Senior (workbench)              │
│    reviews completion gate summary,                 │
│    confirms no overrides or open conditions,        │
│    clicks ACTIVATE ACCOUNT                          │
│  Gate fail → back to responsible team               │
└──────────────────────────┬──────────────────────────┘
                           │ ACTIVATION APPROVED
                           ▼
┌─────────────────────────────────────────────────────┐
│  PHASE 6 — WELCOME KIT & GO-LIVE                    │
│  Agents: SA-7 (Notification) + SA-8 (Integration)   │
│  • SA-7: Welcome Kit dispatched to customer         │
│  • SA-7: Account live notification → Sales Dealer   │
│  • SA-7: Case closed notification → Desk Support   │
│  • SA-9: Audit trail archived and locked            │
│  • SA-8: Final status events published to Kafka     │
│  Stakeholder Touchpoints:                           │
│  → Customer (email) — Welcome Kit                   │
│  → Sales Dealer (workbench) — account live          │
│  → Downstream systems — all confirmed               │
│  Emits: dce.account.golive · dce.welcome.kit.sent   │
└──────────────────────────┬──────────────────────────┘
                           │
══════════════════════════════════════════════════════════════════════════════
 END: Account live · All systems confirmed · Welcome Kit sent ·
      Audit trail complete and immutable · Case status = CLOSED
══════════════════════════════════════════════════════════════════════════════

─── CONTINUOUS BACKGROUND PROCESSES ─────────────────────────────────────────
  DCE Agent: SLA monitoring — fires SA-7 on every warning/breach
  DCE Agent: Physical copy tracking — fires SA-7 on Day 7/14/21 reminders
  SA-9: Audit Agent — fires on every Kafka event throughout lifecycle
─────────────────────────────────────────────────────────────────────────────
```

---

## 17. Stakeholder & Touchpoint Map

| Stakeholder | Role in Account Opening | Workbench View | Email Touchpoints | Decision Authority |
|---|---|---|---|---|
| **Sales Dealer** | Initiates account opening; owns customer relationship; sets priority; notifies customer of gaps | Sales Dealer View — My Cases, Case Summary, Priority Control, Customer Notification | Receives: case acknowledgment, account live notification | Priority flag (Normal/High/Urgent); trigger customer gap notice |
| **Customer** | Submits documents; provides clarifications when requested | None — email only | Receives: acknowledgment, gap notices, signature clarification requests, physical copy reminders, Welcome Kit | None — documents and clarifications only |
| **COO Desk Support** | Signature verification approval; physical copy oversight; final activation authority | Desk Support View — Doc Verification Queue, Signature Review Panel, Physical Copy Tracker, Escalation Panel | Receives: task assignment notifications, SLA warning alerts | Approve/Reject/Clarify each signature; mark physical copies received; activate account |
| **Relationship Manager** | KYC/CDD/BCAP review; credit approach recommendation; limit recommendation | RM View — My Review Queue, KYC/CDD/BCAP Panel, Credit Assessment Form | Receives: task assignment, SLA warning | KYC risk rating; CDD clearance; BCAP clearance; Credit Assessment Approach (IRB/SA); DCE Limit and DCE-PCE Limit recommendations; OSCA Case Number |
| **Credit Team** | Credit underwriting; final limit assignment; CLS/CQG/IDB execution | Credit View — My Limit Assignments, Limit Setup Panel, System Confirmation Status | Receives: task assignment, SLA warning | Final approved DCE Limit and DCE-PCE Limit; credit conditions; CLS update execution; CQG login creation; IDB access enablement |
| **TMO Static Team** | Account creation and static data configuration in UBIX, SIC, CV | TMO Static View — My Account Creations, Account Setup Panel, System Confirmation Status | Receives: task assignment, correction requests | Configuration execution in UBIX, SIC, CV; confirm each system completed |
| **DCE Sales Desk Head** | Escalation recipient when SLA is breached beyond threshold | Management View — full pipeline visibility | Receives: escalation alerts at +2 day SLA breach | Intervention and resolution of escalated cases |
| **Compliance Officer** | Sanctions hit adjudication; document integrity concerns | Compliance View (restricted — not in initial scope) | Receives: immediate escalation on any sanctions hit or integrity concern | Sanctions hit adjudication; document integrity decisions |
| **Regulator (MAS / HKMA)** | Regulatory oversight and audit inspection | None — audit reports on demand | None — regulatory engagement via management | None in-process; post-hoc audit access |

---

## 18. Human-in-the-Loop Design Summary

| Decision Point | Agent That Prepares | Human Who Decides | Mechanism | What Happens If Human Does Not Act |
|---|---|---|---|---|
| Document gap notification to customer | SA-2 generates gap notice | Sales Dealer triggers send from workbench | One-click "Notify Customer" button in workbench | SA-7 auto-escalates after Sales Dealer inaction SLA |
| Signature verification approval | SA-3 presents confidence scores and side-by-side images | COO Desk Support — Approve / Reject / Clarify per signatory | Signature Review Panel in workbench | DCE Agent raises SLA warning → escalation to Desk Support senior |
| KYC / CDD / BCAP clearance and limit recommendation | SA-4 prepares complete brief | Relationship Manager | RM View workbench + optional CF chatflow for Q&A | SLA escalation at 75% → to RM team head → to COO → to DCE Sales Desk Head |
| Credit limit approval | SA-5 prepares credit brief | Credit Team | Credit View workbench — Limit Setup Panel | SLA escalation ladder; credit stream blocks Welcome Kit |
| Account configuration execution | SA-6 generates complete instruction | TMO Static Team — executes in UBIX / SIC / CV | TMO Static View — Account Setup Panel with validation checklist | SLA escalation; SA-6 validation blocks completion gate |
| Final account activation | SA-9 validates completion gate → presents summary | COO Desk Support Senior | "Activate Account" confirmation in workbench | Completion gate blocks Welcome Kit; escalation if unresolved |

---

## 19. Agent Interaction Summary Matrix

| From → To | DCE Agent | SA-1 | SA-2 | SA-3 | SA-4 | SA-5 | SA-6 | SA-7 | SA-8 | SA-9 |
|---|---|---|---|---|---|---|---|---|---|---|
| **DCE Agent** | — | Trigger inbox scan | Trigger doc validation | Trigger sig verification | Trigger KYC prep | Trigger credit prep | Trigger config build | Trigger all notifications | Trigger system setups | Trigger gate validation |
| **SA-1** | Notify documents received | — | — | — | — | — | — | — | — | Emit audit event |
| **SA-2** | Notify checklist complete / gap found | — | — | — | — | — | — | Trigger gap notification | — | Emit audit event |
| **SA-3** | Notify signature approved / rejected | — | — | — | — | — | — | Trigger clarification email | — | Emit audit event |
| **SA-4** | Notify RM decision captured / sanctions hit | — | — | — | — | — | Trigger config prep | Trigger RM task notification | — | Emit audit event |
| **SA-5** | Notify credit decision | — | — | — | — | — | Provide credit limits | Trigger Credit task notification | — | Emit audit event |
| **SA-6** | Notify TMO stream complete | — | — | — | — | — | — | Trigger TMO task notification | — | Emit audit event |
| **SA-7** | — | — | — | — | — | — | — | — | — | Emit audit event |
| **SA-8** | Notify system confirmations | — | — | — | — | — | — | Trigger failure escalation | — | Emit audit event |
| **SA-9** | Notify gate pass / fail | — | — | — | — | — | — | — | — | — |

---

*Document prepared for: DCE Agentic Transformation Programme*
*Platform: Dify on OpenShift (DBS Private Cloud)*
*Review cycle: Before each implementation stage*
*Classification: Internal — Restricted*

*End of document*
