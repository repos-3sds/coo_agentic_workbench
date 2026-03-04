# DCE Account Opening — Database Table Schemas — SA-3 Signature Verification Agent

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-04 |
| **Scope** | SA-3 Signature Verification Agent (Node N-2) |
| **Database** | MariaDB (DBS OpenShift) |
| **Depends On** | SA-1 tables: `dce_ao_case_state`, `dce_ao_document_staged`, `dce_ao_rm_hierarchy`; SA-2 tables: `dce_ao_completeness_assessment` (N-1 completion triggers N-2) |
| **Status** | Draft |

---

## Table of Contents

1. [SA-3 Agent-Specific Tables](#1-sa-3-agent-specific-tables)
   - 1.1 [dce_ao_signature_verification](#11-dce_ao_signature_verification)
   - 1.2 [dce_ao_signature_specimen](#12-dce_ao_signature_specimen)
   - 1.3 [dce_ao_hitl_review_task](#13-dce_ao_hitl_review_task)
2. [SA-3 Table Dependency Map](#2-sa-3-table-dependency-map)

---

## 1. SA-3 Agent-Specific Tables

### 1.1 `dce_ao_signature_verification`

**Purpose:** Stores per-signatory signature verification results produced by SA3.SKL-02/03/04 (Signature Analysis Batch). One row per signatory per case per attempt. Records are **immutable** post-write — no updates permitted (audit trail requirement per MAS Notice SFA 02-N13). Each row captures: authority status (from mandate cross-reference), confidence score (from signature comparison model), confidence tier classification, and references to extracted signature crops and comparison overlays stored in MongoDB.

```sql
CREATE TABLE dce_ao_signature_verification (
    verification_id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                 VARCHAR(20) NOT NULL,
    attempt_number          INT NOT NULL DEFAULT 1,
    signatory_id            VARCHAR(50) NOT NULL,           -- Unique ID within mandate (SIG-XXXXXX)
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
```

**Mock Data (6 rows — 3 cases across SGP corporate, SGP fund, HKG individual):**

| verification_id | case_id | attempt_number | signatory_id | signatory_name | authority_status | role_in_mandate | confidence_score | confidence_tier | source_doc_ids | id_doc_ref | comparison_overlay_ref | signature_crop_refs | flag_for_review | escalate_immediate | analysed_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000101 | 1 | SIG-001 | John Tan Wei Ming | AUTHORISED | Director | 91.50 | HIGH | ["DOC-000001","DOC-000002"] | DOC-000002 | gridfs://sig-overlays/AO-2026-000101/SIG-001/overlay.png | ["gridfs://sig-crops/AO-2026-000101/SIG-001/crop_ao_form.png","gridfs://sig-crops/AO-2026-000101/SIG-001/crop_board_res.png"] | false | false | 2026-03-02T09:40:00 |
| 2 | AO-2026-000101 | 1 | SIG-002 | Sarah Lim Hui Ying | AUTHORISED | Director | 74.20 | MEDIUM | ["DOC-000001"] | DOC-000002 | gridfs://sig-overlays/AO-2026-000101/SIG-002/overlay.png | ["gridfs://sig-crops/AO-2026-000101/SIG-002/crop_ao_form.png"] | true | false | 2026-03-02T09:40:15 |
| 3 | AO-2026-000105 | 1 | SIG-003 | Andrew Ng Kai Wen | AUTHORISED | Fund Manager / GP | 88.30 | HIGH | ["DOC-000010","DOC-000012"] | DOC-000014 | gridfs://sig-overlays/AO-2026-000105/SIG-003/overlay.png | ["gridfs://sig-crops/AO-2026-000105/SIG-003/crop_ao_form.png","gridfs://sig-crops/AO-2026-000105/SIG-003/crop_ima.png"] | false | false | 2026-03-02T09:26:00 |
| 4 | AO-2026-000105 | 1 | SIG-004 | Rachel Tan Siew Mei | AUTHORISED | Director / GP | 67.50 | MEDIUM | ["DOC-000010"] | DOC-000015 | gridfs://sig-overlays/AO-2026-000105/SIG-004/overlay.png | ["gridfs://sig-crops/AO-2026-000105/SIG-004/crop_ao_form.png"] | true | false | 2026-03-02T09:26:15 |
| 5 | AO-2026-000105 | 1 | SIG-005 | Kenneth Goh Wee Liang | AUTHORISED | Company Secretary | 42.10 | LOW | ["DOC-000010"] | DOC-000016 | gridfs://sig-overlays/AO-2026-000105/SIG-005/overlay.png | ["gridfs://sig-crops/AO-2026-000105/SIG-005/crop_ao_form.png"] | false | true | 2026-03-02T09:26:30 |
| 6 | AO-2026-000108 | 1 | SIG-006 | Li Mei Ling | AUTHORISED | Account Holder | 95.20 | HIGH | ["DOC-000022","DOC-000031","DOC-000032"] | DOC-000023 | gridfs://sig-overlays/AO-2026-000108/SIG-006/overlay.png | ["gridfs://sig-crops/AO-2026-000108/SIG-006/crop_ao_form.png","gridfs://sig-crops/AO-2026-000108/SIG-006/crop_risk_disc.png","gridfs://sig-crops/AO-2026-000108/SIG-006/crop_gta.png"] | false | false | 2026-03-03T10:22:00 |

> **Scenario Coverage:**
> - **Case 101 (SGP/CORP):** 2 signatories — 1 HIGH, 1 MEDIUM → both approved after Desk Support review → N-3
> - **Case 105 (SGP/FUND):** 3 signatories — 1 HIGH, 1 MEDIUM, 1 LOW → LOW triggers immediate ESCALATE_COMPLIANCE
> - **Case 108 (HKG/INDIVIDUAL):** 1 signatory — HIGH → approved after Desk Support review → N-3

---

### 1.2 `dce_ao_signature_specimen`

**Purpose:** Stores metadata for approved signature specimens after COO Desk Support approval (Phase 2 — post-HITL). One row per approved signatory. The actual signature image is stored in MongoDB GridFS via the Signature Repository API (`POST /api/signatures`). The `mongodb_specimen_ref` column is the GridFS object ID. Specimens are permanent regulatory evidence required by MAS Notice SFA 02-N13, HKMA AML/CFT Guidelines, and DBS Internal Signature Verification Policy.

```sql
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
```

**Mock Data (3 rows — approved specimens from Cases 101 and 108):**

| specimen_id | case_id | signatory_id | signatory_name | entity_id | source_doc_id | confidence_score | approving_officer_id | approving_officer_name | mongodb_specimen_ref | comparison_overlay_ref | approved_at |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SPEC-000031 | AO-2026-000101 | SIG-001 | John Tan Wei Ming | ENT-ABC-2010 | DOC-000001 | 91.50 | DS-0015 | Marcus Cheong Wei Han | gridfs://sig-specimens/SPEC-000031.png | gridfs://sig-overlays/AO-2026-000101/SIG-001/overlay.png | 2026-03-02T11:25:00 |
| SPEC-000032 | AO-2026-000101 | SIG-002 | Sarah Lim Hui Ying | ENT-ABC-2010 | DOC-000001 | 74.20 | DS-0015 | Marcus Cheong Wei Han | gridfs://sig-specimens/SPEC-000032.png | gridfs://sig-overlays/AO-2026-000101/SIG-002/overlay.png | 2026-03-02T11:25:05 |
| SPEC-000033 | AO-2026-000108 | SIG-006 | Li Mei Ling | null | DOC-000022 | 95.20 | DS-0022 | Janet Yip Ka Man | gridfs://sig-specimens/SPEC-000033.png | gridfs://sig-overlays/AO-2026-000108/SIG-006/overlay.png | 2026-03-03T11:03:00 |

> **Note:** Case 105 has no specimens — escalated to compliance before HITL review due to LOW confidence signatory (Kenneth Goh, 42.10%).

---

### 1.3 `dce_ao_hitl_review_task`

**Purpose:** Shared HITL (Human-in-the-Loop) review task table used by SA-3, SA-4, SA-5, and SA-6. Each agent writes tasks with a different `assigned_persona` and `task_type`. For SA-3, tasks are assigned to COO Desk Support (`DESK_SUPPORT` persona) with task type `SIGNATURE_REVIEW`. The `task_payload` contains the full verification report posted to the Agentic Workbench (Desk Support View). The `decision_payload` contains per-signatory APPROVE/REJECT/CLARIFY decisions submitted by the reviewing officer.

```sql
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

**Mock Data (2 rows — SA-3 SIGNATURE_REVIEW tasks for Cases 101 and 108):**

| task_id | case_id | node_id | task_type | assigned_persona | assigned_to_id | status | priority | task_payload | deadline | decision_payload | decided_by_id | decided_at | created_at | updated_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HITL-000042 | AO-2026-000101 | N-2 | SIGNATURE_REVIEW | DESK_SUPPORT | DS-0015 | DECIDED | URGENT | {"overall_status":"MIXED_FLAGS","signatory_count":2,"flag_count":1,"signatories":[{"signatory_id":"SIG-001","name":"John Tan Wei Ming","role":"Director","confidence":91.5,"tier":"HIGH","flag":false},{"signatory_id":"SIG-002","name":"Sarah Lim Hui Ying","role":"Director","confidence":74.2,"tier":"MEDIUM","flag":true,"flag_reason":"Medium confidence -- review signature style consistency"}],"doc_refs":["DOC-000001","DOC-000002"],"workbench_url":"/workbench/signature-review/HITL-000042"} | 2026-03-02T13:42:00 | {"decisions":[{"signatory_id":"SIG-001","outcome":"APPROVED","notes":"Signature matches ID -- HIGH confidence. Clear mandate authority as Director."},{"signatory_id":"SIG-002","outcome":"APPROVED","notes":"MEDIUM confidence accepted -- consistent style and clear mandate authority as Director."}]} | DS-0015 | 2026-03-02T11:20:00 | 2026-03-02T09:42:00 | 2026-03-02T11:20:00 |
| HITL-000044 | AO-2026-000108 | N-2 | SIGNATURE_REVIEW | DESK_SUPPORT | DS-0022 | DECIDED | STANDARD | {"overall_status":"ALL_HIGH","signatory_count":1,"flag_count":0,"signatories":[{"signatory_id":"SIG-006","name":"Li Mei Ling","role":"Account Holder","confidence":95.2,"tier":"HIGH","flag":false}],"doc_refs":["DOC-000022","DOC-000023","DOC-000031","DOC-000032"],"workbench_url":"/workbench/signature-review/HITL-000044"} | 2026-03-04T10:22:00 | {"decisions":[{"signatory_id":"SIG-006","outcome":"APPROVED","notes":"HIGH confidence. Single signatory -- individual account. Signature matches HKID."}]} | DS-0022 | 2026-03-03T11:00:00 | 2026-03-03T10:22:00 | 2026-03-03T11:00:00 |

> **Note:** Case 105 has **no HITL task** — the LOW confidence signatory (Kenneth Goh, 42.10%) triggered immediate ESCALATE_COMPLIANCE routing at Node 7, bypassing the Desk Support review queue entirely.

---

## 2. SA-3 Table Dependency Map

```
SA-1 Tables (upstream)                        SA-3 Tables (this agent)
═══════════════════════                        ═══════════════════════

dce_ao_case_state ─────────────────────┬──→ dce_ao_signature_verification
    │                                  │       (1 row per signatory per case)
    │                                  │
dce_ao_document_staged ────────────────┼──→ dce_ao_signature_specimen
    │  (execution docs + ID docs       │       (1 row per approved signatory — post-HITL)
    │   used for signature extraction  │
    │   and comparison)                │
    │                                  └──→ dce_ao_hitl_review_task  (SHARED)
dce_ao_rm_hierarchy ───────────────────────   (SA-3 writes SIGNATURE_REVIEW tasks;
    │  (RM name for workbench context)        SA-4, SA-5, SA-6 write their own task types)
    │
SA-2 Tables (upstream)
═══════════════════════
dce_ao_completeness_assessment ────────────   (N-1 COMPLETE triggers N-2 start)
    │
dce_ao_node_checkpoint  ←──────────────────  (SA-3 writes N-2 checkpoint: HITL_PENDING → COMPLETE/ESCALATED)
    │
dce_ao_event_log  ←────────────────────────  (SA-3 writes SIGNATURE_ANALYSED, HITL_DECISION_RECEIVED,
    │                                         SIGNATURE_APPROVED / SIGNATURE_REJECTED / SIGNATURE_ESCALATED)
    │
dce_ao_notification_log  ←─────────────────  (SA-3 writes Desk Support workbench notifications)
```

| # | Table | Owner Skill(s) | Rows per Case | Shared? |
|---|---|---|---|---|
| 1 | `dce_ao_signature_verification` | SA3.SKL-02/03/04 | 1 per signatory (typically 2–4) | SA-3 creates (immutable); SA-9 reads for audit |
| 2 | `dce_ao_signature_specimen` | SA3.SKL-09 | 1 per approved signatory | SA-3 creates; SA-9 reads for audit trail |
| 3 | `dce_ao_hitl_review_task` | SA3.SKL-07 (creates); Phase 2 (updates) | 1 per HITL review (0 if escalated) | **Shared** — SA-3 writes SIGNATURE_REVIEW; SA-4 writes KYC_CDD_REVIEW; SA-5 writes CREDIT_REVIEW; SA-6 writes TMO_STATIC_REVIEW |

---

> **Maintenance Note:** SA-3 reads from SA-1 tables (`dce_ao_case_state`, `dce_ao_document_staged`, `dce_ao_rm_hierarchy`) and SA-2 tables (`dce_ao_node_checkpoint` for N-1 output). SA-3 writes to shared tables (`dce_ao_node_checkpoint`, `dce_ao_event_log`, `dce_ao_notification_log`). The `dce_ao_hitl_review_task` table is a shared HITL table created by SA-3 but written to by SA-4, SA-5, and SA-6 with different `task_type` and `assigned_persona` values. No SA-1 or SA-2 schema changes are required.
