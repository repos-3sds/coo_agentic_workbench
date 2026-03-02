# DCE Account Opening — TO-BE Process

## Full-Scale End-to-End Agentic Solution Model

**Organisation:** DBS Bank — Treasury & Markets, Derivatives & Commodities Execution (DCE) Desk
**Document Purpose:** Future state process design for agentic AI solution
**Foundation:** DCE_Current_Process.md (Discovery Document)
**Last Updated:** 2026-02-28

---

## 1. TRANSFORMATION OVERVIEW

### From → To

| Dimension | AS-IS (Current) | TO-BE (Agentic) |
|---|---|---|
| **Orchestration** | COO Desk Support manually coordinates via email | AI Orchestrator Agent manages workflow, routes tasks, tracks parallel streams |
| **Document Intake** | Functional email inbox — manual read and process | AI Email Ingestion Agent — auto-monitors inbox, extracts, classifies, and routes documents |
| **Document Review** | Manual checklist comparison by Desk Support | AI Document Intelligence Agent — auto-validates completeness, extracts data, flags gaps |
| **Signature Verification** | Manual eyeball check by Desk Support | AI Signature Agent — extracts, compares, presents confidence score; human approves |
| **Case Tracking** | Excel spreadsheet — no real-time visibility | Agentic Workbench — real-time case status for all internal stakeholders |
| **Priority Management** | Email tone — informal, subjective | Structured priority flags with SLA engine and auto-escalation |
| **Parallel Stream Coordination** | Email-based — blind coordination | Orchestrator Agent tracks both streams in real-time, auto-triggers Welcome Kit |
| **Follow-ups & Escalation** | Manual emails by Desk Support | Notification Agent — auto-reminders, SLA breach alerts, escalation triggers |
| **Customer Communication** | None — customer calls Sales Dealer to ask | Automated email updates at key milestones (document received, account live, Welcome Kit). Sales Dealer has full visibility to answer customer queries instantly. |
| **Audit Trail** | None | Every action logged — actor + timestamp + evidence + outcome — immutable |
| **Account Opening Time** | 3–15 days | Minutes to hours (limited only by human decision time) |

---

## 2. AGENTIC ARCHITECTURE — AGENT REGISTRY

### 2.1 Agent Inventory

| # | Agent Name | Type | Runtime | Primary Responsibility |
|---|---|---|---|---|
| A1 | **Orchestrator Agent** | Supervisor Agent | Dify + Python MCP | Central workflow engine — replaces manual coordination. Routes work, tracks state, manages parallel streams, enforces SLA. |
| A2 | **Email Ingestion Agent** | Autonomous Agent | Python MCP | Monitors Outlook/Exchange inbox. Extracts emails + attachments. Classifies documents. Creates or updates cases. |
| A3 | **Document Intelligence Agent** | Autonomous Agent | Python MCP + LLM | OCR, document classification, completeness validation, data extraction, checklist verification. |
| A4 | **Signature Verification Agent** | Human-in-the-Loop Agent | Python MCP + LLM | Extracts signatures from documents. Compares against stored specimens. Presents match confidence score. Waits for human approval. |
| A5 | **Notification Agent** | Autonomous Agent | Python MCP | All outbound communications — task assignments, reminders, SLA alerts, escalations, Welcome Kit dispatch. |
| A6 | **Audit & Compliance Agent** | Background Agent | Python MCP | Logs every action with full evidence chain. Validates process compliance. Generates audit reports on demand. |
| A7 | **Data Sync Agent** | Integration Agent | Python MCP + Kafka | Manages real-time integration with downstream systems (UBIX, CQG, CLS, SIC, IDB) via Kafka and CV via API. |

### 2.2 Agent Interaction Model

```
                                    ┌─────────────────────┐
                                    │   AGENTIC WORKBENCH  │
                                    │      (Angular)       │
                                    │                      │
                                    │  Sales Dealer View   │
                                    │  Desk Support View   │
                                    │  RM View             │
                                    │  Credit View         │
                                    │  TMO Static View     │
                                    │  Management View     │
                                    └──────────┬───────────┘
                                               │
                                    ┌──────────▼───────────┐
                                    │   JAVA + SPRING BOOT │
                                    │     Backend APIs     │
                                    │                      │
                                    │  Case Management API │
                                    │  Document API        │
                                    │  Workflow API        │
                                    │  Audit API           │
                                    │  Notification API    │
                                    └──────────┬───────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          │                    │                    │
               ┌──────────▼──────┐  ┌─────────▼────────┐  ┌───────▼────────┐
               │  DIFY PLATFORM  │  │    MariaDB        │  │    MongoDB     │
               │  (AI Gateway)   │  │ (Structured Data) │  │  (Documents)   │
               │                 │  │                   │  │                │
               │ Claude / Gemini │  │ Cases, Status,    │  │ Scanned Docs,  │
               │ Model Router    │  │ Approvals, Audit, │  │ Signatures,    │
               │ Auth, Logging   │  │ SLA, Metrics      │  │ PDFs, Evidence │
               └────────┬────────┘  └───────────────────┘  └────────────────┘
                        │
          ┌─────────────┼─────────────────────────────────────┐
          │             │             │            │           │
   ┌──────▼──────┐ ┌───▼────┐ ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
   │ Orchestrator│ │ Email  │ │ Document  │ │Signat.│ │Notification│
   │   Agent     │ │Ingest. │ │Intelligence│ │Verif. │ │  Agent     │
   │   (A1)      │ │Agent   │ │  Agent    │ │Agent  │ │  (A5)      │
   │             │ │(A2)    │ │  (A3)     │ │(A4)   │ │            │
   └──────┬──────┘ └───┬────┘ └─────┬─────┘ └───┬───┘ └─────┬─────┘
          │             │            │            │           │
          │        ┌────▼────┐       │            │      ┌────▼─────┐
          │        │Outlook/ │       │            │      │ Email /  │
          │        │Exchange │       │            │      │ In-App   │
          │        │ Inbox   │       │            │      │ Alerts   │
          │        └─────────┘       │            │      └──────────┘
          │                          │            │
   ┌──────▼──────────────────────────▼────────────▼──────┐
   │              KAFKA EVENT BUS                         │
   │  (Case Events, Document Events, Approval Events)    │
   └──────┬──────────┬──────────┬──────────┬─────────────┘
          │          │          │          │
     ┌────▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌──────┐
     │ UBIX  │  │ CQG  │  │ CLS  │  │ SIC  │  │  CV  │
     │       │  │      │  │      │  │      │  │ (API)│
     └───────┘  └──────┘  └──────┘  └──────┘  └──────┘
```

---

## 3. MCP TOOLS REGISTRY (Python)

### 3.1 Email & Document Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T01 | `email_monitor` | Connects to Outlook/Exchange via Microsoft Graph API. Monitors functional inbox for new emails. | A2 (Email Ingestion) |
| T02 | `email_attachment_extractor` | Extracts all attachments from an email. Returns file metadata + binary content. | A2 |
| T03 | `document_classifier` | Classifies a document against the known checklist (Schedule 1, 7A, 8A, GTA, ID Proof, etc.). Uses LLM vision. | A3 (Document Intelligence) |
| T04 | `document_ocr` | Performs OCR on scanned/photographed documents. Extracts structured text. | A3 |
| T05 | `document_data_extractor` | Extracts structured fields from a classified document (names, IDs, dates, amounts, LEI codes, etc.). | A3 |
| T06 | `checklist_validator` | Compares extracted documents against the required checklist for a case. Returns completeness status + missing items. | A3 |
| T07 | `document_store` | Stores documents in MongoDB with metadata, case linkage, and version tracking. | A3, A4 |

### 3.2 Signature Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T08 | `signature_extractor` | Extracts signature regions from document images using vision model. | A4 (Signature Verification) |
| T09 | `signature_comparator` | Compares two signature images and returns a similarity/confidence score. | A4 |
| T10 | `signature_store` | Persists verified signature specimens in MongoDB, linked to customer profile + signatory identity. | A4 |
| T11 | `signatory_authority_checker` | Validates that the signer is listed as an authorised signatory in the company mandate on file. | A4 |

### 3.3 Workflow & Orchestration Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T12 | `case_create` | Creates a new account opening case in MariaDB with initial status, priority, and linked documents. | A1 (Orchestrator) |
| T13 | `case_update_status` | Updates case status, step status, or sub-task status. Emits Kafka event. | A1 |
| T14 | `case_get_status` | Retrieves full case status including all parallel streams, pending actions, ageing. | A1 |
| T15 | `task_assign` | Assigns a task to a specific team/persona with deadline and priority. | A1 |
| T16 | `task_complete` | Marks a task as complete with evidence (who, when, what was done, supporting data). | A1 |
| T17 | `parallel_stream_tracker` | Tracks Credit (4A) and TMO Static (4B) streams independently. Returns combined completion status. | A1 |
| T18 | `sla_engine` | Calculates ageing, checks SLA thresholds, triggers escalation events. | A1 |
| T19 | `priority_manager` | Manages case priority (Normal / High / Urgent). Supports structured priority flags from Sales Dealer. | A1 |

### 3.4 Notification Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T20 | `send_email_notification` | Sends email via Outlook/Exchange (reminders, task assignments, escalations). | A5 (Notification) |
| T21 | `send_inapp_notification` | Pushes real-time notification to Agentic Workbench UI for specific personas. | A5 |
| T22 | `send_escalation` | Sends escalation alert to DCE Sales Desk Head with case context, ageing, and blocking reason. | A5 |
| T23 | `send_welcome_kit` | Generates and dispatches Welcome Kit to customer via email upon all-stream completion. | A5 |
| T24 | `send_customer_email` | Sends status update or action-required emails to customer (missing docs, clarifications, physical copy reminders). | A5 |

### 3.5 Integration Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T25 | `kafka_publish` | Publishes events to Kafka topics (case events, document events, approval events). | A7 (Data Sync) |
| T26 | `kafka_consume` | Consumes events from downstream systems (confirmation of account creation, limit assignment, etc.). | A7 |
| T27 | `ubix_account_create` | Triggers account creation in UBIX via Kafka. | A7 |
| T28 | `cqg_login_create` | Triggers CQG login creation via Kafka. | A7 |
| T29 | `cls_limit_update` | Triggers limit update in CLS via Kafka. | A7 |
| T30 | `sic_mapping_update` | Triggers SIC mapping via Kafka. | A7 |
| T31 | `cv_data_update` | Updates CV static data via API (REST). | A7 |
| T32 | `idb_platform_enable` | Enables IDB platform access for customer via Kafka. | A7 |

### 3.6 Audit Tools

| Tool ID | Tool Name | Description | Used By Agent(s) |
|---|---|---|---|
| T33 | `audit_log` | Creates an immutable audit entry: action + actor + timestamp + evidence + outcome. | A6 (Audit & Compliance) |
| T34 | `audit_report_generate` | Generates an audit report for a specific case or time period. | A6 |
| T35 | `compliance_check` | Validates that all required steps, documents, and approvals are complete before allowing case progression. | A6 |

---

## 4. TO-BE END-TO-END WORKFLOW — AGENTIC MODEL

### Phase 0: Document Ingestion (Automated — No Human Touch)

```
TRIGGER: New email arrives at functional inbox (Outlook/Exchange)

A2 (Email Ingestion Agent)
  ├─ T01: Detects new email in functional inbox
  ├─ T02: Extracts all attachments
  ├─ Passes each attachment to A3 (Document Intelligence Agent)
  │
  ├─ IF email matches an existing case → links documents to case
  ├─ IF new customer / no case exists → creates preliminary case record
  │
  └─ A6 (Audit): Logs ingestion event — email ID, sender, timestamp,
     attachment count, case linkage

A3 (Document Intelligence Agent)
  ├─ T04: OCR on each document (handles scanned physical copies)
  ├─ T03: Classifies each document (Schedule 1, 7A, GTA, ID Proof, etc.)
  ├─ T05: Extracts structured data fields (names, IDs, dates, LEI, etc.)
  ├─ T07: Stores classified document in MongoDB with metadata
  ├─ T06: Runs checklist validation — are all required documents present?
  │
  ├─ IF checklist complete → signals A1 (Orchestrator) to advance case
  ├─ IF checklist incomplete → signals A1 with missing document list
  │
  └─ A6 (Audit): Logs classification results, extraction confidence,
     completeness status per document
```

**Human touchpoint: NONE** — fully automated intake and classification.

---

### Phase 1: Case Creation & Sales Dealer Review (Agentic Workbench)

```
A1 (Orchestrator Agent)
  ├─ T12: Creates / updates case in MariaDB
  │   ├─ Customer profile data (extracted from documents by A3)
  │   ├─ Document checklist status (complete / incomplete + missing items)
  │   ├─ Priority flag (Normal by default; Sales Dealer can elevate)
  │   └─ Ageing counter starts
  │
  ├─ T15: Assigns "Sales Dealer Review" task
  │   └─ A5 (Notification): T21 → In-app notification to Sales Dealer
  │
  └─ A6 (Audit): Logs case creation, initial status, assigned Sales Dealer

SALES DEALER (Agentic Workbench — Sales Dealer View)
  ├─ Reviews case summary (auto-populated from document extraction)
  ├─ Confirms / corrects customer profile data
  ├─ Confirms product requirements and applicable schedules
  ├─ Sets priority if urgent (structured flag: Normal / High / Urgent)
  │
  ├─ IF documents incomplete:
  │   └─ Clicks "Notify Customer" → A5 sends checklist gap email to customer
  │       with specific missing documents listed
  │
  ├─ IF documents complete:
  │   └─ Clicks "Submit for Review" → advances case to Phase 2
  │
  └─ A6 (Audit): Logs Sales Dealer review, confirmations, priority setting
```

**Human touchpoint: Sales Dealer** — confirms data, sets priority, triggers customer notification if needed.

---

### Phase 2: Document Verification & Signature Check (Desk Support + AI)

```
A1 (Orchestrator Agent)
  ├─ T15: Assigns "Document & Signature Verification" task to Desk Support
  │   └─ A5 (Notification): T21 → In-app notification to COO Desk Support
  │
  └─ Simultaneously triggers A4 (Signature Verification Agent)

A4 (Signature Verification Agent) — runs in parallel while Desk Support opens case
  ├─ T08: Extracts signature regions from all submitted documents
  ├─ T11: Checks each signatory against company mandate (authorised signatories list)
  │
  ├─ FOR EACH signatory:
  │   ├─ T09: Compares extracted signature against ID document signature
  │   ├─ Returns confidence score (0–100%) per signature
  │   └─ T10: If verified, stores signature specimen linked to customer profile
  │
  ├─ Presents results on Agentic Workbench:
  │   ├─ Signatory name
  │   ├─ Authority status (Authorised Director: YES/NO)
  │   ├─ Signature match confidence (e.g., 94.2%)
  │   ├─ Side-by-side signature images (submitted vs ID document)
  │   └─ Flag: HIGH CONFIDENCE / LOW CONFIDENCE / MISMATCH
  │
  └─ A6 (Audit): Logs every comparison — input images, confidence score,
     AI model used, timestamp

COO DESK SUPPORT (Agentic Workbench — Desk Support View)
  ├─ Reviews AI-prepared verification summary:
  │   ├─ Document completeness (pre-validated by A3)
  │   ├─ Signature verification results (pre-analysed by A4)
  │   ├─ Data extraction summary (pre-extracted by A3)
  │
  ├─ FOR EACH signature:
  │   ├─ Reviews AI confidence score + side-by-side images
  │   └─ Clicks "Approve" or "Reject" or "Clarify with Customer"
  │       ├─ Approve → signature verified, case advances
  │       ├─ Reject → case paused, reason logged
  │       └─ Clarify → A5 sends clarification request to customer
  │
  ├─ Confirms physical copy tracking status (Pending / Received per document)
  │
  ├─ Clicks "Submit to RM" → advances case to Phase 3
  │
  └─ A6 (Audit): Logs Desk Support decisions — approval/rejection per signature,
     overall document verification outcome, physical copy status
```

**Human touchpoint: COO Desk Support** — reviews AI analysis, makes final approval decision on signatures. AI assists, human decides.

---

### Phase 3: RM Review — KYC, CDD, BCAP, Credit Assessment (RM View)

```
A1 (Orchestrator Agent)
  ├─ T15: Assigns "RM Review" task to appropriate RM
  │   ├─ RM assignment logic: based on existing customer relationship,
  │   │   nature of business, IBG Tier (data from Sales Dealer input)
  │   └─ A5 (Notification): T21 → In-app notification to assigned RM
  │
  └─ T18: SLA timer starts for RM Review step

RM (Agentic Workbench — RM View)
  ├─ Reviews case with all pre-extracted data and verified documents
  │
  ├─ CDD Clearance:
  │   ├─ Uploads CDD Clearance Doc (or syncs from existing CDD system)
  │   └─ Marks CDD as Cleared / Pending
  │
  ├─ BCAP Clearance:
  │   ├─ Uploads BCAP Clearance evidence
  │   └─ Marks BCAP as Cleared / Pending
  │
  ├─ Additional Documents Review:
  │   ├─ ACRA / Certificate of Incumbency
  │   ├─ Min 2 Key Directors ID
  │   └─ UBO / Guarantor ID
  │
  ├─ Credit Assessment Recommendation:
  │   ├─ Selects CAA Approach: IRB or SA
  │   ├─ Indicates Limit Exposure
  │   ├─ Enters OSCA Case No.
  │   ├─ Recommends DCE Limit (SGD)
  │   └─ Recommends DCE-PCE Limit (SGD)
  │
  ├─ Customer Segment Classification
  │
  ├─ IF retail investor → ensures additional Risk Disclosure Agreements present
  │
  ├─ Clicks "Submit RM Review" → advances case to Phase 4 (parallel streams)
  │
  └─ A6 (Audit): Logs RM review — all decisions, CAA approach, limit
     recommendations, clearance statuses, documents reviewed

A1 (Orchestrator Agent) — on RM submission:
  ├─ Validates all mandatory RM fields are complete (T35: compliance check)
  ├─ IF valid → triggers Phase 4A and Phase 4B simultaneously
  └─ IF incomplete → returns to RM with specific gaps highlighted
```

**Human touchpoint: RM** — conducts KYC/CDD/BCAP review, recommends credit approach and limits.

---

### Phase 4A: Credit — Limit Assignment & Platform Enablement (Parallel Stream)

```
A1 (Orchestrator Agent)
  ├─ T15: Assigns "Credit Review & Limit Assignment" to Credit team
  │   ├─ Includes RM recommendations (CAA approach, DCE Limit, DCE-PCE Limit)
  │   └─ A5 (Notification): T21 → In-app notification to Credit team
  │
  └─ T17: Parallel stream tracker — marks Stream 4A as IN PROGRESS

CREDIT TEAM (Agentic Workbench — Credit View)
  ├─ Reviews RM recommendations
  ├─ Customer Segment Info (DBS Related Account, Owner Code, Segment details)
  ├─ Current Borrowings review (L&B)
  │
  ├─ Assigns DCE Limit + DCE-PCE Limit:
  │   └─ Enters final approved limits
  │
  ├─ Clicks "Execute Limit Setup" → triggers automated downstream actions:
  │
  │   A7 (Data Sync Agent) — executes in sequence:
  │   ├─ T29: CLS limit update (Kafka) → waits for confirmation
  │   ├─ T28: CQG login creation (Kafka) → waits for confirmation
  │   └─ T32: IDB platform enablement (Kafka) → waits for confirmation
  │
  │   Each confirmation is:
  │   ├─ Consumed by A7 via T26 (Kafka consume)
  │   ├─ Status updated in case via T13
  │   └─ Logged by A6 (Audit)
  │
  ├─ All Credit sub-tasks confirmed complete
  │
  └─ A1 (Orchestrator): T17 → marks Stream 4A as COMPLETE

A6 (Audit): Logs every Credit action — limit values, system confirmations,
   CQG login ID, IDB platforms enabled, timestamps
```

**Human touchpoint: Credit team** — reviews, approves limits, clicks execute. Downstream system updates are automated.

---

### Phase 4B: TMO Static — Account Creation & Static Data (Parallel Stream)

```
A1 (Orchestrator Agent)
  ├─ T15: Assigns "Account Creation & Static Data Setup" to TMO Static
  │   ├─ Pre-populates account details from extracted data (A3)
  │   └─ A5 (Notification): T21 → In-app notification to TMO Static
  │
  └─ T17: Parallel stream tracker — marks Stream 4B as IN PROGRESS

TMO STATIC (Agentic Workbench — TMO Static View)
  ├─ Reviews pre-populated account details:
  │   ├─ Entity Type, Name, NRIC/Tax ID, Job Title, Birth Date
  │   ├─ Account Name (DBS CIN Code), Date Open, Account Type
  │   ├─ PMM, Offset Method, Default Currency (USD), Trading Platform
  │   └─ Account Holders
  │
  ├─ Confirms / corrects data
  │
  ├─ Clicks "Create Account" → triggers automated downstream actions:
  │
  │   A7 (Data Sync Agent) — executes:
  │   ├─ T27: UBIX account creation (Kafka) → waits for confirmation
  │   ├─ T30: SIC mapping update (Kafka) → waits for confirmation
  │   └─ T31: CV static data update (API) → waits for confirmation
  │
  │   Each confirmation is:
  │   ├─ Consumed by A7 via T26 (Kafka consume) or API response
  │   ├─ Status updated in case via T13
  │   └─ Logged by A6 (Audit)
  │
  ├─ All TMO Static sub-tasks confirmed complete
  │
  └─ A1 (Orchestrator): T17 → marks Stream 4B as COMPLETE

A6 (Audit): Logs every TMO action — UBIX account ID, SIC mapping,
   CV update confirmation, timestamps
```

**Human touchpoint: TMO Static** — confirms pre-populated data, clicks create. Downstream system updates are automated.

---

### Phase 4 — Parallel Stream Convergence

```
A1 (Orchestrator Agent) — continuously monitors via T17:
  │
  ├─ Stream 4A (Credit): COMPLETE ✓
  ├─ Stream 4B (TMO Static): COMPLETE ✓
  │
  ├─ BOTH COMPLETE → auto-advances to Phase 5
  │
  ├─ ONE COMPLETE, ONE PENDING:
  │   ├─ Dashboard shows which stream is blocking
  │   ├─ T18 (SLA engine): If blocking stream exceeds threshold →
  │   │   A5: T22 → auto-escalation to DCE Sales Desk Head
  │   └─ A5: T21 → in-app alert to Desk Support showing blocking stream
  │
  └─ A6 (Audit): Logs stream completion times, convergence timestamp,
     any escalations triggered
```

**Human touchpoint: NONE** — fully automated convergence detection and advancement.

---

### Phase 5: Welcome Kit & Account Go-Live (Automated)

```
A1 (Orchestrator Agent)
  ├─ T35 (Compliance check): Final validation —
  │   ├─ All documents verified ✓
  │   ├─ All signatures approved ✓
  │   ├─ RM review complete ✓
  │   ├─ Credit limits assigned + all systems updated ✓
  │   ├─ Account created in UBIX + all systems mapped ✓
  │   └─ Physical copy tracking status noted (not a gate)
  │
  ├─ IF all checks pass:
  │   ├─ T13: Updates case status to "Account Live"
  │   ├─ A5 (Notification Agent):
  │   │   ├─ T23: Generates and sends Welcome Kit to customer
  │   │   ├─ T21: In-app notification to Sales Dealer — "Account is live"
  │   │   ├─ T21: In-app notification to Desk Support — case closed
  │   │   └─ T20: Email confirmation to customer
  │   │
  │   └─ A6 (Audit): Logs account go-live — timestamp, all system
  │      confirmations, Welcome Kit dispatch confirmation
  │
  └─ IF any check fails:
      ├─ Blocks go-live
      ├─ Routes back to appropriate team with specific failure reason
      └─ A6 (Audit): Logs blocked go-live with failure reason
```

**Human touchpoint: NONE** — automated final validation and Welcome Kit dispatch.

---

### Phase 6: Authorised Traders Setup (Post-Account Opening)

```
TRIGGER: Mandate letter received (via email or Agentic Workbench upload)

A2 (Email Ingestion Agent) — if via email
  └─ Extracts mandate letter → routes to A3

A3 (Document Intelligence Agent)
  ├─ T04: OCR on mandate letter
  ├─ T05: Extracts trader details:
  │   ├─ Full Name
  │   ├─ ID No. / Passport No.
  │   ├─ Designation
  │   └─ Contact details (if present)
  │
  └─ Populates Authorised Traders table in case

A4 (Signature Verification Agent)
  ├─ T08: Extracts signatures from mandate letter
  ├─ T11: Verifies signatories are authorised company directors (from mandate on file)
  ├─ T09: Compares signatures against stored specimens
  └─ Presents confidence scores

COO DESK SUPPORT (Agentic Workbench)
  ├─ Reviews AI-extracted trader list
  ├─ Reviews signature verification results
  ├─ Approves / rejects each trader
  └─ Approved traders are activated

A6 (Audit): Full trail — extraction results, signature comparisons,
   Desk Support decisions, trader activation timestamps
```

**Human touchpoint: COO Desk Support** — reviews AI extraction and signature verification, approves traders.

---

### Phase 7: Physical Copy Tracking (Continuous Background Process)

```
A1 (Orchestrator Agent) — continuous background monitoring:
  │
  ├─ For each case with "Physical Copy: Pending" documents:
  │   ├─ T18 (SLA engine): Tracks physical copy ageing
  │   ├─ IF threshold exceeded (configurable, e.g., 14 days):
  │   │   └─ A5: T20 → Reminder email to customer + Sales Dealer
  │   │       "Physical originals for [document list] are pending"
  │   │
  │   └─ When physical copy arrives (Desk Support marks as Received):
  │       ├─ T13: Updates document physical copy status
  │       └─ A6 (Audit): Logs physical copy receipt — timestamp, who received
  │
  └─ Physical copy tracking does NOT block account go-live (confirmed design principle)
```

**Human touchpoint: COO Desk Support** — marks physical copies as received when they arrive.

---

## 5. SLA & ESCALATION ENGINE

### SLA Thresholds (Configurable)

| Step | SLA Target | Warning Threshold | Escalation Threshold |
|---|---|---|---|
| Phase 0: Document Ingestion | Instant (automated) | N/A | N/A |
| Phase 1: Sales Dealer Review | 2 hours | 1 hour | 2 hours |
| Phase 2: Document & Signature Verification | 4 hours | 2 hours | 4 hours |
| Phase 3: RM Review | 8 hours | 4 hours | 8 hours |
| Phase 4A: Credit Limit Assignment | 4 hours | 2 hours | 4 hours |
| Phase 4B: TMO Static Account Creation | 4 hours | 2 hours | 4 hours |
| Phase 5: Welcome Kit | Instant (automated) | N/A | N/A |
| **End-to-End** | **Same business day** | **4 hours** | **8 hours** |

*Note: SLA values above are illustrative and configurable. Actual thresholds to be agreed upon during implementation.*

### Priority Multipliers

| Priority | SLA Multiplier | Effect |
|---|---|---|
| Normal | 1.0x | Standard SLA thresholds |
| High | 0.5x | Half the time before escalation |
| Urgent | 0.25x | Quarter the time — immediate attention required |

### Escalation Path

```
Level 1: In-app reminder to assigned team member
    ↓ (if no action within warning threshold)
Level 2: In-app alert to team lead + email reminder
    ↓ (if no action within escalation threshold)
Level 3: Escalation to DCE Sales Desk Head with full case context
    ↓ (if still unresolved)
Level 4: Dashboard-level visibility — case flagged RED across all views
```

---

## 6. PERSONA-SPECIFIC WORKBENCH VIEWS

### 6.1 Sales Dealer View

| Feature | Detail |
|---|---|
| **My Cases** | All cases initiated by this Sales Dealer — real-time status, ageing, priority |
| **Case Summary** | Auto-populated from document extraction — confirm/correct and submit |
| **Priority Control** | Set / change case priority (Normal / High / Urgent) with structured flag |
| **Customer Notification** | One-click "Notify Customer" for missing documents — auto-generates checklist email |
| **Pipeline Handoff** | (Future) Receive pre-populated cases from Pipeline Management |

### 6.2 COO Desk Support View

| Feature | Detail |
|---|---|
| **Operations Dashboard** | All active cases — status, ageing, blocking teams, SLA alerts |
| **Document Verification Queue** | Cases awaiting document + signature review — AI pre-analysis shown |
| **Signature Review Panel** | Side-by-side signature comparison with AI confidence scores — Approve/Reject/Clarify |
| **Physical Copy Tracker** | Per-document physical copy status across all cases |
| **Authorised Traders Queue** | Mandate letters pending review — AI-extracted trader lists shown |
| **Escalation Panel** | Cases at risk or breaching SLA — one-click escalate |

### 6.3 RM View

| Feature | Detail |
|---|---|
| **My Review Queue** | Cases assigned for RM review — pre-populated with extracted data |
| **KYC / CDD / BCAP Panel** | Upload and manage clearance documents — sync from CDD system |
| **Credit Assessment Form** | CAA approach selection, limit recommendations, checklists |
| **Retail Investor Flag** | Highlighted when customer is retail — ensures additional risk disclosure check |

### 6.4 Credit Team View

| Feature | Detail |
|---|---|
| **My Limit Assignments** | Cases awaiting credit limit assignment — RM recommendations shown |
| **Limit Setup Panel** | Assign DCE + DCE-PCE limits — one-click execute triggers CLS + CQG + IDB |
| **System Confirmation Status** | Real-time confirmation from CLS, CQG, IDB — green/pending/failed |

### 6.5 TMO Static View

| Feature | Detail |
|---|---|
| **My Account Creations** | Cases awaiting account creation — pre-populated account details |
| **Account Setup Panel** | Confirm/correct data — one-click create triggers UBIX + SIC + CV |
| **System Confirmation Status** | Real-time confirmation from UBIX, SIC, CV — green/pending/failed |

### 6.6 Customer Touchpoint (Email Only — Current Scope)

> **The customer is NOT a user of the Agentic Workbench.** The only customer touchpoint in the current scope is email.

| Touchpoint | Detail |
|---|---|
| **Document Submission** | Customer emails documents to the functional email inbox (as-is today) |
| **Missing Documents Notification** | System-generated email listing specific missing documents (triggered by Sales Dealer) |
| **Clarification Requests** | System-generated email when signature or document needs clarification (triggered by Desk Support) |
| **Physical Copy Reminders** | System-generated reminder email when physical originals are overdue |
| **Welcome Kit** | System-generated email with Welcome Kit upon account go-live |
| **Status Queries** | Customer contacts Sales Dealer (as-is today). Sales Dealer now has instant real-time case visibility in Workbench to answer immediately. |

### 6.7 Customer Portal (Future Vision — Not In Current Scope)

> For future exploration: a public-facing customer portal or website where customers can self-serve actions such as:
> - Track account opening application status
> - Upload documents directly
> - View account limits
> - Request account maintenance actions
>
> This is a bigger-picture item to explore after the Agentic Workbench is established. Architecture should be designed to support this extension.

---

## 7. AUDIT TRAIL STRUCTURE

### Audit Log Entry Schema

```
{
  "audit_id": "UUID",
  "case_id": "DCE-2026-00142",
  "timestamp": "2026-02-28T14:32:15.123Z",
  "actor": {
    "type": "HUMAN | AGENT",
    "id": "user_id or agent_id",
    "name": "John Tan | Orchestrator Agent (A1)",
    "team": "COO Desk Support"
  },
  "action": {
    "type": "DOCUMENT_VERIFIED | SIGNATURE_APPROVED | LIMIT_ASSIGNED | ...",
    "description": "Approved signature verification for Director Lee Wei Ming",
    "step": "Phase 2 — Document & Signature Verification"
  },
  "evidence": {
    "document_id": "DOC-UUID",
    "document_version": "v1.2",
    "signature_confidence_score": 94.2,
    "ai_model_used": "claude-sonnet-4-6",
    "comparison_images": ["img_submitted_ref", "img_id_ref"],
    "supporting_data": { ... }
  },
  "outcome": "APPROVED",
  "metadata": {
    "ip_address": "10.x.x.x",
    "session_id": "SESSION-UUID",
    "workbench_view": "desk_support"
  }
}
```

### Audit Reports Available

| Report | Description |
|---|---|
| **Case Audit Trail** | Complete chronological trail for a single case — every action from ingestion to go-live |
| **Agent Activity Report** | All actions taken by a specific AI agent over a time period — for AI governance |
| **Human Decision Report** | All human approval/rejection decisions — for compliance review |
| **SLA Breach Report** | All cases that breached SLA thresholds — with root cause (which step, which team) |
| **Signature Verification Report** | All signature comparisons with confidence scores and outcomes — for risk audit |
| **System Integration Report** | All downstream system interactions — success/failure, response times |

---

## 8. EVENT-DRIVEN ARCHITECTURE — KAFKA TOPICS

| Topic | Publisher | Subscriber(s) | Purpose |
|---|---|---|---|
| `dce.case.created` | A1 (Orchestrator) | A5 (Notification), A6 (Audit) | New case created |
| `dce.case.status.changed` | A1 | All Agents, Workbench | Case status update |
| `dce.document.ingested` | A2 (Email Ingestion) | A3 (Doc Intelligence), A6 (Audit) | New document received |
| `dce.document.classified` | A3 (Doc Intelligence) | A1, A6 | Document classified and data extracted |
| `dce.checklist.complete` | A3 | A1 | All required documents received |
| `dce.signature.analysed` | A4 (Signature) | A1, Workbench | Signature comparison results ready |
| `dce.signature.approved` | Workbench (human) | A1, A4, A6 | Human approved signature |
| `dce.task.assigned` | A1 | A5, Workbench | Task assigned to a team/person |
| `dce.task.completed` | Workbench (human) | A1, A6 | Task marked complete |
| `dce.sla.warning` | A1 (SLA Engine) | A5 | SLA warning threshold reached |
| `dce.sla.breach` | A1 | A5, A6 | SLA breached — escalation triggered |
| `dce.stream.4a.complete` | A1 | A1 (self), A6 | Credit stream complete |
| `dce.stream.4b.complete` | A1 | A1 (self), A6 | TMO Static stream complete |
| `dce.account.golive` | A1 | A5, A6, A7 | All streams complete — account is live |
| `dce.welcome.kit.sent` | A5 | A6 | Welcome Kit dispatched to customer |
| `dce.ubix.account.confirmed` | A7 (from UBIX) | A1, A6 | UBIX account creation confirmed |
| `dce.cqg.login.confirmed` | A7 (from CQG) | A1, A6 | CQG login created |
| `dce.cls.limit.confirmed` | A7 (from CLS) | A1, A6 | CLS limit update confirmed |
| `dce.sic.mapping.confirmed` | A7 (from SIC) | A1, A6 | SIC mapping confirmed |
| `dce.idb.enabled.confirmed` | A7 (from IDB) | A1, A6 | IDB platform enabled |

---

## 9. TRANSFORMATION IMPACT SUMMARY

### Quantitative Impact (Projected)

| Metric | AS-IS | TO-BE | Improvement |
|---|---|---|---|
| End-to-end account opening | 3–15 days | Hours (same day) | 90%+ reduction |
| Manual coordination emails per case | 20–40+ | 0 | Eliminated |
| Document classification time | 15–30 min (manual) | Seconds (AI) | ~99% reduction |
| Signature verification time | 5–15 min (manual) | Seconds (AI) + minutes (human approval) | ~80% reduction |
| Authorised Trader extraction | 5–15 min (manual) | Seconds (AI) + minutes (human review) | ~80% reduction |
| Case visibility | None (Excel) | Real-time for all internal stakeholders; proactive email updates to customer | Full transparency |
| SLA tracking | None | Automated with escalation engine | From zero to automated |
| Audit trail | None | Complete evidence chain per action | Full compliance readiness |
| Desk Support coordination effort | ~80% of their time | ~20% (review + approve only) | ~75% reduction |

### Qualitative Impact

| Dimension | Impact |
|---|---|
| **Customer Experience** | Faster account opening, proactive email updates at key milestones, Sales Dealer can answer status queries instantly |
| **Revenue Protection** | Customers can trade on market opportunities without delay |
| **Operational Risk** | Eliminates manual errors, ensures no case falls through cracks |
| **Compliance** | Full audit trail, immutable records, AI governance built in |
| **Scalability** | System scales with volume — Desk Support bandwidth no longer a bottleneck |
| **Standardisation** | Consistent process every time — no dependency on individual knowledge |

---

## 10. DESIGN PRINCIPLES APPLIED

| # | Principle | How Applied |
|---|---|---|
| 1 | **Human-in-the-loop for signatures** | A4 presents confidence score → Desk Support approves/rejects in Workbench |
| 2 | **Single email entry point** | A2 monitors functional Outlook/Exchange inbox — auto-ingests and classifies |
| 3 | **Architecture for extensibility** | Agent registry, MCP tools, Kafka event bus all designed to extend to all 6 business areas |
| 4 | **Audit-ready by design** | A6 (Audit Agent) logs every action across all agents and human decisions |
| 5 | **Private cloud only** | All components deployed on OpenShift within DBS internal environment |
| 6 | **AI assists, human decides** | Every critical decision (signatures, approvals, limits) has human final authority |
| 7 | **North Star driven** | Every design choice optimises for: "No customer misses a market opportunity because their account isn't open" |
| 8 | **Zero coordination overhead** | Orchestrator Agent eliminates email chains — work is routed, tracked, and escalated automatically |

---

*This TO-BE Process document serves as the target state for the DCE Agentic Solution. It is designed to be directly translatable into technical implementation specifications.*

*End of document*
