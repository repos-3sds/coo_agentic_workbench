# DCE Account Opening — Database Table Schemas — SA-2 Document Collection Agent

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-02 |
| **Scope** | SA-2 Document Collection & Completeness Agent (Node N-1) |
| **Database** | MariaDB (DBS OpenShift) |
| **Depends On** | SA-1 tables: `dce_ao_case_state`, `dce_ao_document_staged`, `dce_ao_classification_result` |
| **Status** | Draft |

---

## Table of Contents

1. [SA-2 Agent-Specific Tables](#1-sa-2-agent-specific-tables)
   - 1.1 [dce_ao_document_checklist](#11-dce_ao_document_checklist)
   - 1.2 [dce_ao_document_checklist_item](#12-dce_ao_document_checklist_item)
   - 1.3 [dce_ao_document_ocr_result](#13-dce_ao_document_ocr_result)
   - 1.4 [dce_ao_document_review](#14-dce_ao_document_review)
   - 1.5 [dce_ao_completeness_assessment](#15-dce_ao_completeness_assessment)
   - 1.6 [dce_ao_gta_validation](#16-dce_ao_gta_validation)
2. [SA-2 Table Dependency Map](#2-sa-2-table-dependency-map)

---

## 1. SA-2 Agent-Specific Tables

### 1.1 `dce_ao_document_checklist`

**Purpose:** Stores the generated document checklist per case, produced by SA2.SKL-01 (Checklist Generator). One checklist per case per attempt. Derived from KB-2 (Document Checklist Rules) based on account_type + jurisdiction + products.

```sql
CREATE TABLE dce_ao_document_checklist (
    checklist_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,           -- Retry attempt (1, 2, 3)
    account_type        VARCHAR(30) NOT NULL,
    jurisdiction        VARCHAR(5) NOT NULL,
    entity_type         VARCHAR(20) NOT NULL,
    products_requested  JSON,                             -- ["FUTURES","OPTIONS",...]
    checklist_version   VARCHAR(20),                      -- KB-2 version used
    mandatory_count     INT NOT NULL DEFAULT 0,
    optional_count      INT NOT NULL DEFAULT 0,
    regulatory_basis    TEXT,                              -- MAS/HKMA rule references
    generated_at        DATETIME DEFAULT NOW(),
    generated_by_model  VARCHAR(50),                      -- LLM model used
    kb_chunks_used      JSON,                             -- KB-2 chunk IDs
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id)
);
```

---

### 1.2 `dce_ao_document_checklist_item`

**Purpose:** Individual checklist line items (mandatory and optional documents). Each row is one expected document type for a case. Linked to checklist header.

```sql
CREATE TABLE dce_ao_document_checklist_item (
    item_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    checklist_id        BIGINT NOT NULL,
    case_id             VARCHAR(20) NOT NULL,
    doc_type_code       VARCHAR(50) NOT NULL,             -- e.g. AO_FORM, BOARD_RES, CERT_INCORP
    doc_type_name       VARCHAR(200) NOT NULL,            -- Human-readable name
    requirement         ENUM('MANDATORY','OPTIONAL') NOT NULL,
    regulatory_ref      VARCHAR(200),                     -- e.g. "MAS Notice 127, Para 6.2"
    max_age_days        INT,                              -- e.g. 90 for utility bills
    accepted_formats    JSON,                             -- ["PDF","JPG","PNG"]
    matched_doc_id      VARCHAR(30),                      -- FK to dce_ao_document_staged.doc_id when matched
    match_status        ENUM('UNMATCHED','MATCHED','REJECTED','RESUBMISSION_REQUIRED') DEFAULT 'UNMATCHED',
    match_confidence    DECIMAL(4,3),                     -- OCR-based match confidence
    notes               TEXT,
    FOREIGN KEY (checklist_id) REFERENCES dce_ao_document_checklist(checklist_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_checklist (checklist_id),
    INDEX idx_case (case_id),
    INDEX idx_status (match_status)
);
```

---

### 1.3 `dce_ao_document_ocr_result`

**Purpose:** Stores OCR extraction results per document from SA2.SKL-02 (OCR & Metadata Extractor). One row per document processed. Links to `dce_ao_document_staged`.

```sql
CREATE TABLE dce_ao_document_ocr_result (
    ocr_id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_id              VARCHAR(30) NOT NULL,             -- FK to dce_ao_document_staged
    case_id             VARCHAR(20) NOT NULL,
    detected_doc_type   VARCHAR(50),                      -- What OCR thinks the doc is
    ocr_confidence      DECIMAL(4,3) NOT NULL,            -- 0.000 to 1.000
    extracted_text      MEDIUMTEXT,                       -- Full OCR text (truncated if >64KB)
    issuing_authority   VARCHAR(200),                     -- e.g. "ACRA", "SFC", "MAS"
    issue_date          DATE,
    expiry_date         DATE,
    signatory_names     JSON,                             -- ["John Tan", "Sarah Lim"]
    document_language   VARCHAR(10) DEFAULT 'EN',         -- ISO 639-1
    page_count          INT,
    has_signatures      BOOLEAN DEFAULT FALSE,
    has_stamps          BOOLEAN DEFAULT FALSE,            -- Company chop / notary stamp
    flagged_for_review  BOOLEAN DEFAULT FALSE,            -- TRUE if confidence < 0.80
    ocr_engine          VARCHAR(50),                      -- e.g. "azure-document-intelligence-v4"
    processing_time_ms  INT,
    processed_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (doc_id) REFERENCES dce_ao_document_staged(doc_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_doc (doc_id),
    INDEX idx_case (case_id),
    INDEX idx_flagged (flagged_for_review)
);
```

---

### 1.4 `dce_ao_document_review`

**Purpose:** Records the per-document decision (ACCEPTED / REJECTED / REQUIRES_RESUBMISSION) made by SA2.SKL-03 through SA2.SKL-06. Includes rejection reason from SA2.SKL-05 (Rejection Reasoner) and flag status from SA2.SKL-06 (Document Flagging Tool).

```sql
CREATE TABLE dce_ao_document_review (
    review_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_id              VARCHAR(30) NOT NULL,             -- FK to dce_ao_document_staged
    case_id             VARCHAR(20) NOT NULL,
    checklist_item_id   BIGINT,                           -- FK to dce_ao_document_checklist_item
    attempt_number      INT NOT NULL DEFAULT 1,
    -- Decision
    decision            ENUM('ACCEPTED','REJECTED','REQUIRES_RESUBMISSION') NOT NULL,
    decision_reason_code VARCHAR(50),                     -- e.g. EXPIRED, WRONG_TYPE, ILLEGIBLE
    -- Rejection details (from SKL-05)
    rejection_reason    TEXT,                              -- LLM-generated RM-actionable reason
    resubmission_instructions TEXT,                       -- What RM needs to provide
    regulatory_reference VARCHAR(200),                    -- Which regulation requires this
    -- Validity check (from SKL-04)
    validity_status     ENUM('VALID','EXPIRED','NEAR_EXPIRY','UNACCEPTABLE_SOURCE'),
    days_to_expiry      INT,
    validity_notes      TEXT,
    -- Flag status (from SKL-06)
    flagged_at          DATETIME,
    flag_status         ENUM('FLAGGED','CLEARED','PENDING') DEFAULT 'PENDING',
    -- Metadata
    reviewed_at         DATETIME DEFAULT NOW(),
    reviewed_by         VARCHAR(50) DEFAULT 'AGENT',      -- 'AGENT' or 'HUMAN:EMP-ID'
    FOREIGN KEY (doc_id) REFERENCES dce_ao_document_staged(doc_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_doc (doc_id),
    INDEX idx_case (case_id),
    INDEX idx_decision (decision),
    INDEX idx_attempt (case_id, attempt_number)
);
```

---

### 1.5 `dce_ao_completeness_assessment`

**Purpose:** Stores the overall completeness assessment result per case per attempt from SA2.SKL-03 (Completeness Assessor) and the final routing decision from SA2.SKL-08 (Decision Maker). One row per assessment attempt.

```sql
CREATE TABLE dce_ao_completeness_assessment (
    assessment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    checklist_id        BIGINT NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    -- Completeness result (from SKL-03)
    completeness_flag   BOOLEAN NOT NULL,                 -- TRUE = all mandatory present
    mandatory_docs_complete BOOLEAN NOT NULL,
    optional_docs_complete BOOLEAN NOT NULL,
    total_mandatory     INT NOT NULL,
    matched_mandatory   INT NOT NULL,
    total_optional      INT NOT NULL,
    matched_optional    INT NOT NULL,
    coverage_pct        DECIMAL(5,2),                     -- Overall coverage percentage
    missing_mandatory   JSON,                             -- ["CERT_INCORP","BOARD_RES"]
    missing_optional    JSON,                             -- ["FINANCIAL_PROJ"]
    rejected_docs       JSON,                             -- ["DOC-000003"]
    rejection_reasons   JSON,                             -- {"DOC-000003":"Expired > 90 days"}
    -- Decision (from SKL-08)
    next_node           VARCHAR(30),                      -- N-2 | HITL_RM | ESCALATE_BRANCH_MANAGER | DEAD
    decision_reasoning  TEXT,                             -- LLM reasoning for routing
    retry_recommended   BOOLEAN DEFAULT FALSE,
    sla_pct_consumed    DECIMAL(5,2),                     -- % of SLA window used
    -- Chase message (from SKL-07, if retry)
    rm_chase_message    TEXT,                              -- Composed chase text
    chase_sent_at       DATETIME,
    -- Metadata
    assessor_model      VARCHAR(50),
    decision_model      VARCHAR(50),
    assessed_at         DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (checklist_id) REFERENCES dce_ao_document_checklist(checklist_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_next (next_node)
);
```

---

### 1.6 `dce_ao_gta_validation`

**Purpose:** Stores GTA (General Terms Agreement) version and schedule validation results. Enriches the N-1 completeness check per Section 38 of the frozen DAG document. Uses KB-12 (GTA & Schedule Reference).

```sql
CREATE TABLE dce_ao_gta_validation (
    validation_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    -- GTA version check
    gta_version_submitted VARCHAR(20),                    -- e.g. "GTA v4.2"
    gta_version_current VARCHAR(20),                      -- From KB-3
    gta_version_match   BOOLEAN,
    -- Schedule coverage
    applicable_schedules JSON,                            -- ["Schedule 7A","Schedule 8A"]
    schedules_submitted JSON,
    schedules_missing   JSON,
    -- Addenda coverage
    addenda_required    JSON,                             -- Product/jurisdiction-specific
    addenda_submitted   JSON,
    addenda_missing     JSON,
    -- Overall status
    gta_validation_status ENUM('CURRENT','OUTDATED','MISSING') NOT NULL,
    validation_notes    TEXT,
    kb_chunks_used      JSON,                             -- KB-3 and KB-12 chunk IDs
    validated_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_status (gta_validation_status)
);
```

---

## 2. SA-2 Table Dependency Map

```
SA-1 Tables (upstream)                        SA-2 Tables (this agent)
═══════════════════════                        ═══════════════════════

dce_ao_case_state ─────────────────────┬──→ dce_ao_document_checklist
    │                                  │         │
dce_ao_classification_result           │         └──→ dce_ao_document_checklist_item
    │  (account_type, jurisdiction     │                    │
    │   used for checklist generation) │                    │ (matched_doc_id)
    │                                  │                    ▼
dce_ao_document_staged ────────────────┼──→ dce_ao_document_ocr_result
    │  (documents pre-staged by SA-1)  │
    │                                  ├──→ dce_ao_document_review
    │                                  │
    │                                  ├──→ dce_ao_completeness_assessment
    │                                  │
    │                                  └──→ dce_ao_gta_validation
    │
dce_ao_node_checkpoint  ←──────────────────  (SA-2 writes N-1 checkpoint)
    │
dce_ao_event_log  ←────────────────────────  (SA-2 writes DOC_ASSESSED, NODE_COMPLETED events)
    │
dce_ao_notification_log  ←─────────────────  (SA2.SKL-07 writes RM chase notifications)
```

| # | Table | Owner Skill(s) | Rows per Case | Shared? |
|---|---|---|---|---|
| 1 | `dce_ao_document_checklist` | SA2.SKL-01 | 1 per attempt (max 3) | SA-2 only |
| 2 | `dce_ao_document_checklist_item` | SA2.SKL-01 | 8–20 per checklist | SA-2 creates; SA-5 reads |
| 3 | `dce_ao_document_ocr_result` | SA2.SKL-02 | 1 per document | SA-2 creates; SA-5 reads |
| 4 | `dce_ao_document_review` | SA2.SKL-03 to SKL-06 | 1 per document per attempt | SA-2 only |
| 5 | `dce_ao_completeness_assessment` | SA2.SKL-03, SKL-07, SKL-08 | 1 per attempt (max 3) | SA-2 only |
| 6 | `dce_ao_gta_validation` | SA2.SKL-03 (enrichment) | 1 per attempt | SA-2 only |

---

> **Maintenance Note:** SA-2 reads from SA-1 tables (`dce_ao_document_staged`, `dce_ao_classification_result`) and writes to shared tables (`dce_ao_node_checkpoint`, `dce_ao_event_log`, `dce_ao_notification_log`). No SA-1 schema changes are required.
