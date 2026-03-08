# DCE Account Opening — Database Table Schemas

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-02 |
| **Scope** | SA-1 Intake & Triage Agent (Node N-0) + Shared Orchestrator Tables |
| **Database** | MariaDB (ABS OpenShift) |
| **Status** | Draft |

---

## Table of Contents

1. [Shared Orchestrator Tables (from Frozen DAG Doc)](#1-shared-orchestrator-tables)
   - 1.1 [dce_ao_case_state](#11-dce_ao_case_state)
   - 1.2 [dce_ao_node_checkpoint](#12-dce_ao_node_checkpoint)
   - 1.3 [dce_ao_event_log](#13-dce_ao_event_log)
2. [SA-1 Agent-Specific Tables](#2-sa-1-agent-specific-tables)
   - 2.1 [dce_ao_submission_raw](#21-dce_ao_submission_raw)
   - 2.2 [dce_ao_classification_result](#22-dce_ao_classification_result)
   - 2.3 [dce_ao_document_staged](#23-dce_ao_document_staged)
   - 2.4 [dce_ao_rm_hierarchy](#24-dce_ao_rm_hierarchy)
   - 2.5 [dce_ao_notification_log](#25-dce_ao_notification_log)

---

## 1. Shared Orchestrator Tables

> These tables are defined in the frozen DAG document (Sections 10, 23). Reproduced here for completeness — SA-1 creates the initial records.

### 1.1 `dce_ao_case_state`

**Purpose:** Master case lifecycle record. SA-1 creates this via SA1.SKL-04 (Case Record Creator).

```sql
CREATE TABLE dce_ao_case_state (
    case_id             VARCHAR(20) PRIMARY KEY,          -- AO-2026-XXXXXX
    status              ENUM('ACTIVE','HITL_PENDING','ESCALATED','DONE','DEAD'),
    current_node        VARCHAR(10),                      -- N-0 through N-8, DONE, DEAD
    completed_nodes     JSON,                             -- ["N-0","N-1","N-2"]
    failed_nodes        JSON,                             -- [{"node":"N-1","reason":"..."}]
    retry_counts        JSON,                             -- {"N-1":2,"N-3b":1}
    case_type           VARCHAR(30),
    priority            ENUM('URGENT','STANDARD','DEFERRED'),
    rm_id               VARCHAR(20),
    client_name         VARCHAR(200),
    jurisdiction        VARCHAR(5),
    sla_deadline        DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    updated_at          DATETIME ON UPDATE NOW(),
    hitl_queue          JSON,                             -- Active HITL tasks
    event_count         INT DEFAULT 0
);
```

**Mock Data (3 rows):**

| case_id | status | current_node | completed_nodes | failed_nodes | retry_counts | case_type | priority | rm_id | client_name | jurisdiction | sla_deadline | created_at | updated_at | hitl_queue | event_count |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AO-2026-000101 | ACTIVE | N-1 | ["N-0"] | [] | {} | INSTITUTIONAL_FUTURES | URGENT | RM-0042 | ABC Trading Pte Ltd | SGP | 2026-03-02T11:30:00 | 2026-03-02T09:30:00 | 2026-03-02T09:32:15 | null | 4 |
| AO-2026-000102 | ACTIVE | N-0 | [] | [] | {} | OTC_DERIVATIVES | STANDARD | RM-0118 | Global Commodities HK Ltd | HKG | 2026-03-04T14:00:00 | 2026-03-02T14:00:00 | 2026-03-02T14:00:00 | null | 1 |
| AO-2026-000103 | ACTIVE | N-0 | [] | [{"node":"N-0","reason":"RM not found in HR system"}] | {"N-0":1} | RETAIL_FUTURES | DEFERRED | RM-9999 | Tan Wei Ming | SGP | 2026-03-09T10:00:00 | 2026-03-02T10:00:00 | 2026-03-02T10:05:30 | null | 2 |

---

### 1.2 `dce_ao_node_checkpoint`

**Purpose:** Per-node execution checkpoint for crash recovery and audit. SA-1 writes the first checkpoint (N-0).

```sql
CREATE TABLE dce_ao_node_checkpoint (
    checkpoint_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    node_id             VARCHAR(10) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    status              ENUM('IN_PROGRESS','COMPLETE','FAILED','ESCALATED','HITL_PENDING'),
    input_snapshot      JSON,                             -- Full input to node (for replay)
    output_json         JSON,                             -- Pydantic-validated output
    context_block_hash  VARCHAR(64),                      -- SHA256 of injected context
    started_at          DATETIME,
    completed_at        DATETIME,
    duration_seconds    DECIMAL(10,3),
    next_node           VARCHAR(30),
    failure_reason      TEXT,
    retry_count         INT DEFAULT 0,
    agent_model         VARCHAR(50),                      -- LLM model version used
    token_usage         JSON,                             -- {input: N, output: N, total: N}
    UNIQUE KEY (case_id, node_id, attempt_number),
    INDEX idx_case_node (case_id, node_id),
    INDEX idx_status (status),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id)
);
```

**Mock Data (3 rows — all N-0 checkpoints):**

| checkpoint_id | case_id | node_id | attempt_number | status | input_snapshot | output_json | context_block_hash | started_at | completed_at | duration_seconds | next_node | failure_reason | retry_count | agent_model | token_usage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | N-0 | 1 | COMPLETE | {"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.john@abs.com","subject":"New DCE AO - ABC Trading"}} | {"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","client_name":"ABC Trading Pte Ltd","jurisdiction":"SGP","confidence":0.94} | a1b2c3d4e5f6... | 2026-03-02T09:30:00 | 2026-03-02T09:32:15 | 135.200 | N-1 | null | 0 | claude-sonnet-4-6 | {"input":1240,"output":380,"total":1620} |
| 2 | AO-2026-000102 | N-0 | 1 | IN_PROGRESS | {"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Global Commodities HK Ltd"}}} | null | b2c3d4e5f6a1... | 2026-03-02T14:00:00 | null | null | null | null | 0 | claude-sonnet-4-6 | null |
| 3 | AO-2026-000103 | N-0 | 1 | FAILED | {"submission_source":"EMAIL","raw_payload":{"sender_email":"unknown@abs.com"}} | null | c3d4e5f6a1b2... | 2026-03-02T10:00:00 | 2026-03-02T10:05:30 | 330.000 | null | RM-9999 not found in HR system — manual assignment required | 1 | claude-sonnet-4-6 | {"input":980,"output":120,"total":1100} |

---

### 1.3 `dce_ao_event_log`

**Purpose:** CQRS event store for audit trail. SA-1 writes SUBMISSION_RECEIVED, CASE_CREATED, CASE_CLASSIFIED events.

```sql
CREATE TABLE dce_ao_event_log (
    event_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    event_type          VARCHAR(50) NOT NULL,             -- FSM event names
    from_state          VARCHAR(30),
    to_state            VARCHAR(30),
    event_payload       JSON,
    triggered_by        VARCHAR(50),                      -- 'AGENT' | 'HUMAN:EMP-ID'
    triggered_at        DATETIME DEFAULT NOW(),
    kafka_offset        BIGINT,                           -- Kafka offset for traceability
    INDEX idx_case_events (case_id, triggered_at),
    INDEX idx_event_type (event_type)
);
```

**Mock Data (5 rows — SA-1 lifecycle events):**

| event_id | case_id | event_type | from_state | to_state | event_payload | triggered_by | triggered_at | kafka_offset |
|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | SUBMISSION_RECEIVED | null | N-0:IN_PROGRESS | {"source":"EMAIL","sender":"rm.john@abs.com","attachments_count":2} | AGENT | 2026-03-02T09:30:00 | 10001 |
| 2 | AO-2026-000101 | CASE_CLASSIFIED | N-0:IN_PROGRESS | N-0:IN_PROGRESS | {"account_type":"INSTITUTIONAL_FUTURES","confidence":0.94,"priority":"URGENT"} | AGENT | 2026-03-02T09:31:05 | 10002 |
| 3 | AO-2026-000101 | CASE_CREATED | N-0:IN_PROGRESS | N-0:IN_PROGRESS | {"case_id":"AO-2026-000101","rm_id":"RM-0042","rm_manager_id":"MGR-0012"} | AGENT | 2026-03-02T09:31:30 | 10003 |
| 4 | AO-2026-000101 | NODE_COMPLETED | N-0:IN_PROGRESS | N-0:COMPLETE | {"next_node":"N-1","documents_staged":2,"notification_sent":true} | AGENT | 2026-03-02T09:32:15 | 10004 |
| 5 | AO-2026-000103 | NODE_FAILED | N-0:IN_PROGRESS | N-0:FAILED | {"failure":"RM-9999 not found in HR system","retry_count":1,"escalation":"manual_assignment"} | AGENT | 2026-03-02T10:05:30 | 10008 |

---

## 2. SA-1 Agent-Specific Tables

### 2.1 `dce_ao_submission_raw`

**Purpose:** Stores every raw AO submission (email or portal) before processing. Serves as the immutable source-of-truth for what was received. Used by SA1.SKL-01 (Email Ingestion) and SA1.SKL-08 (Portal Submission Handler).

```sql
CREATE TABLE dce_ao_submission_raw (
    submission_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20),                      -- NULL until case is created by SKL-04
    submission_source   ENUM('EMAIL','PORTAL','API') NOT NULL,
    -- Email-specific fields
    email_message_id    VARCHAR(200),                     -- MS Graph message ID
    sender_email        VARCHAR(200),
    email_subject       VARCHAR(500),
    email_body_text     MEDIUMTEXT,
    -- Portal-specific fields
    portal_form_id      VARCHAR(50),                      -- Portal form submission ID
    portal_form_data    JSON,                             -- Structured form fields
    -- Common fields
    rm_employee_id      VARCHAR(20),
    received_at         DATETIME NOT NULL,
    processed_at        DATETIME,
    processing_status   ENUM('RECEIVED','PROCESSING','PROCESSED','FAILED') DEFAULT 'RECEIVED',
    failure_reason      TEXT,
    raw_payload_hash    VARCHAR(64),                      -- SHA256 for dedup
    attachments_count   INT DEFAULT 0,
    created_at          DATETIME DEFAULT NOW(),
    INDEX idx_case (case_id),
    INDEX idx_source (submission_source),
    INDEX idx_status (processing_status),
    INDEX idx_received (received_at),
    UNIQUE KEY idx_dedup (raw_payload_hash)
);
```

**Mock Data (3 rows):**

| submission_id | case_id | submission_source | email_message_id | sender_email | email_subject | email_body_text | portal_form_id | portal_form_data | rm_employee_id | received_at | processed_at | processing_status | failure_reason | raw_payload_hash | attachments_count | created_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | EMAIL | AAMkAGE2... | rm.john@abs.com | New DCE Account Opening - ABC Trading Pte Ltd | Dear DCE Team, Please initiate AO for ABC Trading Pte Ltd. Institutional futures account... | null | null | RM-0042 | 2026-03-02T09:30:00 | 2026-03-02T09:30:45 | PROCESSED | null | f8e7d6c5b4a3... | 2 | 2026-03-02T09:30:00 |
| 2 | AO-2026-000102 | PORTAL | null | null | null | null | PF-20260302-007 | {"client_name":"Global Commodities HK Ltd","entity_type":"CORP","products":["OTC_DERIVATIVES"],"jurisdiction":"HKG"} | RM-0118 | 2026-03-02T14:00:00 | null | PROCESSING | null | a3b4c5d6e7f8... | 3 | 2026-03-02T14:00:00 |
| 3 | null | EMAIL | BBNkBHF3... | unknown@abs.com | AO Request - Tan Wei Ming | Please open retail futures account for Tan Wei Ming... | null | null | RM-9999 | 2026-03-02T10:00:00 | 2026-03-02T10:05:30 | FAILED | RM-9999 not found in HR system | d6e7f8a3b4c5... | 1 | 2026-03-02T10:00:00 |

---

### 2.2 `dce_ao_classification_result`

**Purpose:** Stores the LLM classification output from SA1.SKL-02 (Account Type Classifier) and SA1.SKL-03 (Priority Assessor). Keeps confidence scores and reasoning for audit.

```sql
CREATE TABLE dce_ao_classification_result (
    classification_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    submission_id       BIGINT NOT NULL,
    -- Account Type Classification (SKL-02)
    account_type        ENUM(
                            'INSTITUTIONAL_FUTURES',
                            'RETAIL_FUTURES',
                            'OTC_DERIVATIVES',
                            'COMMODITIES_PHYSICAL',
                            'MULTI_PRODUCT'
                        ) NOT NULL,
    account_type_confidence DECIMAL(4,3) NOT NULL,        -- 0.000 to 1.000, must be >= 0.700
    account_type_reasoning  TEXT,                          -- LLM reasoning chain
    -- Entity Classification
    client_name         VARCHAR(200) NOT NULL,
    client_entity_type  ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    jurisdiction        ENUM('SGP','HKG','CHN','OTHER') NOT NULL,
    products_requested  JSON,                             -- ["FUTURES","OPTIONS",...]
    -- Priority Classification (SKL-03)
    priority            ENUM('URGENT','STANDARD','DEFERRED') NOT NULL,
    priority_reason     TEXT,
    sla_deadline        DATETIME NOT NULL,
    -- Metadata
    classifier_model    VARCHAR(50),                      -- e.g. claude-sonnet-4-6
    priority_model      VARCHAR(50),                      -- e.g. claude-haiku-4-5
    kb_chunks_used      JSON,                             -- KB-1 and KB-9 chunk IDs used
    classified_at       DATETIME DEFAULT NOW(),
    flagged_for_review  BOOLEAN DEFAULT FALSE,            -- TRUE if confidence < 0.80
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (submission_id) REFERENCES dce_ao_submission_raw(submission_id),
    INDEX idx_case (case_id),
    INDEX idx_type (account_type),
    INDEX idx_priority (priority),
    INDEX idx_flagged (flagged_for_review)
);
```

**Mock Data (3 rows):**

| classification_id | case_id | submission_id | account_type | account_type_confidence | account_type_reasoning | client_name | client_entity_type | jurisdiction | products_requested | priority | priority_reason | sla_deadline | classifier_model | priority_model | kb_chunks_used | classified_at | flagged_for_review |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | 1 | INSTITUTIONAL_FUTURES | 0.940 | Email mentions institutional futures trading, corporate entity, SGP domiciled. AO form confirms futures + options products. | ABC Trading Pte Ltd | CORP | SGP | ["FUTURES","OPTIONS"] | URGENT | Client tier: Platinum; RM flagged urgency; regulatory deadline approaching | 2026-03-02T11:30:00 | claude-sonnet-4-6 | claude-haiku-4-5 | {"KB-1":["chunk-14","chunk-22"],"KB-9":["chunk-03"]} | 2026-03-02T09:31:05 | false |
| 2 | AO-2026-000102 | 2 | OTC_DERIVATIVES | 0.880 | Portal form explicitly selects OTC Derivatives. Corporate entity in HKG jurisdiction. | Global Commodities HK Ltd | CORP | HKG | ["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"] | STANDARD | Standard client tier; no urgency flags; normal SLA applies | 2026-03-04T14:00:00 | claude-sonnet-4-6 | claude-haiku-4-5 | {"KB-1":["chunk-08","chunk-31"],"KB-9":["chunk-01"]} | 2026-03-02T14:01:20 | false |
| 3 | AO-2026-000103 | 3 | RETAIL_FUTURES | 0.720 | Email indicates individual retail client seeking futures trading. Limited product detail — low confidence. | Tan Wei Ming | INDIVIDUAL | SGP | ["FUTURES"] | DEFERRED | Individual retail; no urgency indicators; deferred processing acceptable | 2026-03-09T10:00:00 | claude-sonnet-4-6 | claude-haiku-4-5 | {"KB-1":["chunk-05"],"KB-9":["chunk-02"]} | 2026-03-02T10:02:00 | true |

---

### 2.3 `dce_ao_document_staged`

**Purpose:** Tracks all documents pre-staged from email attachments or portal uploads by SA1.SKL-06 (Document Pre-Stager). Documents are stored in MongoDB; this table holds metadata and pointers.

```sql
CREATE TABLE dce_ao_document_staged (
    doc_id              VARCHAR(30) PRIMARY KEY,           -- DOC-XXXXXX
    case_id             VARCHAR(20) NOT NULL,
    submission_id       BIGINT NOT NULL,
    filename            VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT,
    storage_url         VARCHAR(1000) NOT NULL,            -- MongoDB GridFS / object store URL
    storage_bucket      VARCHAR(100) DEFAULT 'ao-documents',
    source              ENUM('EMAIL_ATTACHMENT','PORTAL_UPLOAD','API_UPLOAD') NOT NULL,
    upload_status       ENUM('PENDING','UPLOADED','FAILED') DEFAULT 'PENDING',
    upload_failure_reason TEXT,
    checksum_sha256     VARCHAR(64),                       -- File integrity check
    uploaded_at         DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (submission_id) REFERENCES dce_ao_submission_raw(submission_id),
    INDEX idx_case (case_id),
    INDEX idx_status (upload_status)
);
```

**Mock Data (5 rows):**

| doc_id | case_id | submission_id | filename | mime_type | file_size_bytes | storage_url | storage_bucket | source | upload_status | upload_failure_reason | checksum_sha256 | uploaded_at | created_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOC-000001 | AO-2026-000101 | 1 | AO_Form_Signed.pdf | application/pdf | 245760 | gridfs://ao-documents/66a1b2c3d4e5 | ao-documents | EMAIL_ATTACHMENT | UPLOADED | null | e5f6a7b8c9d0... | 2026-03-02T09:31:50 | 2026-03-02T09:31:45 |
| DOC-000002 | AO-2026-000101 | 1 | Corporate_Profile.pdf | application/pdf | 1048576 | gridfs://ao-documents/77b2c3d4e5f6 | ao-documents | EMAIL_ATTACHMENT | UPLOADED | null | f6a7b8c9d0e1... | 2026-03-02T09:31:55 | 2026-03-02T09:31:45 |
| DOC-000003 | AO-2026-000102 | 2 | AO_Application_Form.pdf | application/pdf | 512000 | gridfs://ao-documents/88c3d4e5f6a7 | ao-documents | PORTAL_UPLOAD | UPLOADED | null | a7b8c9d0e1f2... | 2026-03-02T14:01:30 | 2026-03-02T14:01:25 |
| DOC-000004 | AO-2026-000102 | 2 | Board_Resolution.pdf | application/pdf | 204800 | gridfs://ao-documents/99d4e5f6a7b8 | ao-documents | PORTAL_UPLOAD | UPLOADED | null | b8c9d0e1f2a3... | 2026-03-02T14:01:32 | 2026-03-02T14:01:25 |
| DOC-000005 | AO-2026-000102 | 2 | Financial_Statements_2025.xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | 3145728 | gridfs://ao-documents/aae5f6a7b8c9 | ao-documents | PORTAL_UPLOAD | UPLOADED | null | c9d0e1f2a3b4... | 2026-03-02T14:01:35 | 2026-03-02T14:01:25 |

---

### 2.4 `dce_ao_rm_hierarchy`

**Purpose:** Stores RM-to-case assignment and resolved manager hierarchy from SA1.SKL-05 (RM & Manager Linker). Resolved from ABS HR system at case creation time.

```sql
CREATE TABLE dce_ao_rm_hierarchy (
    assignment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    rm_id               VARCHAR(20) NOT NULL,
    rm_name             VARCHAR(200) NOT NULL,
    rm_email            VARCHAR(200) NOT NULL,
    rm_branch           VARCHAR(100),
    rm_desk             VARCHAR(100),                     -- e.g. "DCE Sales Desk SGP"
    rm_manager_id       VARCHAR(20) NOT NULL,
    rm_manager_name     VARCHAR(200) NOT NULL,
    rm_manager_email    VARCHAR(200) NOT NULL,
    resolution_source   ENUM('HR_SYSTEM','MANUAL','PORTAL_PROVIDED') NOT NULL,
    resolved_at         DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_rm (case_id, rm_id),
    INDEX idx_rm (rm_id),
    INDEX idx_manager (rm_manager_id)
);
```

**Mock Data (2 rows):**

| assignment_id | case_id | rm_id | rm_name | rm_email | rm_branch | rm_desk | rm_manager_id | rm_manager_name | rm_manager_email | resolution_source | resolved_at |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | RM-0042 | John Tan | rm.john@abs.com | Marina Bay Financial Centre | DCE Sales Desk SGP | MGR-0012 | Sarah Lim | sarah.lim@abs.com | HR_SYSTEM | 2026-03-02T09:31:25 |
| 2 | AO-2026-000102 | RM-0118 | David Wong | david.wong@abs.com | Central HK Branch | DCE Sales Desk HKG | MGR-0045 | Michael Chan | michael.chan@abs.com | PORTAL_PROVIDED | 2026-03-02T14:01:10 |

---

### 2.5 `dce_ao_notification_log`

**Purpose:** Tracks every notification dispatched by SA1.SKL-07 (Intake Notifier) and SA1.SKL-09 (Closure & Go-Live Notifier). Shared table — will be reused by all agents' notification dispatches.

```sql
CREATE TABLE dce_ao_notification_log (
    notification_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    node_id             VARCHAR(10) NOT NULL,             -- Which node triggered the notification
    notification_type   VARCHAR(50) NOT NULL,             -- e.g. CASE_CREATED, SLA_WARNING, GO_LIVE
    channel             ENUM('EMAIL','SMS','IN_APP_TOAST','WORKBENCH_BADGE','KAFKA_EVENT') NOT NULL,
    recipient_id        VARCHAR(20),                      -- Employee ID or external ref
    recipient_email     VARCHAR(200),
    recipient_role      VARCHAR(50),                      -- RM, RM_MANAGER, COO, etc.
    subject             VARCHAR(500),
    body_summary        TEXT,                             -- First 500 chars of notification body
    template_id         VARCHAR(50),                      -- Notification template used
    delivery_status     ENUM('QUEUED','SENT','DELIVERED','FAILED','BOUNCED') DEFAULT 'QUEUED',
    failure_reason      TEXT,
    retry_count         INT DEFAULT 0,
    sent_at             DATETIME,
    delivered_at        DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id),
    INDEX idx_type (notification_type),
    INDEX idx_status (delivery_status),
    INDEX idx_recipient (recipient_id)
);
```

**Mock Data (4 rows — SA-1 intake notifications):**

| notification_id | case_id | node_id | notification_type | channel | recipient_id | recipient_email | recipient_role | subject | body_summary | template_id | delivery_status | failure_reason | retry_count | sent_at | delivered_at | created_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | N-0 | CASE_CREATED | EMAIL | RM-0042 | rm.john@abs.com | RM | [AO-2026-000101] Case Created — ABC Trading Pte Ltd | Your DCE Account Opening case has been created. Case ID: AO-2026-000101. Priority: URGENT. SLA Deadline: 2026-03-02 11:30 SGT. View in Workbench... | TPL-INTAKE-01 | DELIVERED | null | 0 | 2026-03-02T09:32:10 | 2026-03-02T09:32:12 | 2026-03-02T09:32:08 |
| 2 | AO-2026-000101 | N-0 | CASE_CREATED | EMAIL | MGR-0012 | sarah.lim@abs.com | RM_MANAGER | [AO-2026-000101] New AO Case — ABC Trading Pte Ltd (URGENT) | A new URGENT DCE Account Opening case has been created by RM John Tan. Case ID: AO-2026-000101. Client: ABC Trading Pte Ltd... | TPL-INTAKE-02 | DELIVERED | null | 0 | 2026-03-02T09:32:10 | 2026-03-02T09:32:14 | 2026-03-02T09:32:08 |
| 3 | AO-2026-000101 | N-0 | CASE_CREATED | IN_APP_TOAST | RM-0042 | null | RM | New case AO-2026-000101 created | URGENT — ABC Trading Pte Ltd — Institutional Futures. SLA: 2h. | TPL-TOAST-01 | DELIVERED | null | 0 | 2026-03-02T09:32:10 | 2026-03-02T09:32:10 | 2026-03-02T09:32:08 |
| 4 | AO-2026-000101 | N-0 | CASE_CREATED | KAFKA_EVENT | null | null | SYSTEM | ao.case.created | {"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","rm_id":"RM-0042"} | null | SENT | null | 0 | 2026-03-02T09:32:11 | null | 2026-03-02T09:32:08 |

---

## Summary — SA-1 Table Dependency Map

```
dce_ao_submission_raw
    │
    ├──→ dce_ao_classification_result   (1:1 per case)
    │
    ├──→ dce_ao_document_staged         (1:N per submission)
    │
    └──→ dce_ao_case_state              (1:1 — created by SKL-04)
             │
             ├──→ dce_ao_rm_hierarchy        (1:1 per case)
             │
             ├──→ dce_ao_notification_log    (1:N per case)
             │
             ├──→ dce_ao_node_checkpoint     (1:N per case)
             │
             └──→ dce_ao_event_log           (1:N per case)
```

| # | Table | Owner Skill(s) | Rows per Case | Shared? |
|---|---|---|---|---|
| 1 | `dce_ao_case_state` | SA1.SKL-04 (creates) | 1 | Yes — all agents read/update |
| 2 | `dce_ao_node_checkpoint` | All agents (write) | 1 per node | Yes — all agents write |
| 3 | `dce_ao_event_log` | All agents (write) | ~4 from SA-1 | Yes — all agents write |
| 4 | `dce_ao_submission_raw` | SA1.SKL-01, SA1.SKL-08 | 1 | SA-1 only |
| 5 | `dce_ao_classification_result` | SA1.SKL-02, SA1.SKL-03 | 1 | SA-1 only |
| 6 | `dce_ao_document_staged` | SA1.SKL-06 | 1–10 | SA-1 creates; SA-2 reads |
| 7 | `dce_ao_rm_hierarchy` | SA1.SKL-05 | 1 | SA-1 creates; all agents read |
| 8 | `dce_ao_notification_log` | SA1.SKL-07, SA1.SKL-09 | 3–5 from SA-1 | Yes — all agents write |

---

> **Maintenance Note:** As each subsequent agent (SA-2 through SA-9) is built, add its agent-specific tables to this document following the same format: DDL + mock data + dependency map.
