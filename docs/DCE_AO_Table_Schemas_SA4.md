# DCE Account Opening — Database Table Schemas — SA-4 KYC/CDD Preparation Agent

| Field | Value |
|---|---|
| **Document Version** | 1.0.0 |
| **Date** | 2026-03-07 |
| **Scope** | SA-4 KYC/CDD Preparation Agent (Node N-3) |
| **Database** | MariaDB (ABS OpenShift) |
| **Depends On** | SA-1: `dce_ao_case_state`, `dce_ao_rm_hierarchy`, `dce_ao_node_checkpoint`; SA-2: `dce_ao_document_ocr_result`, `dce_ao_classification_result`; SA-3: `dce_ao_hitl_review_task` (shared), `dce_ao_signature_specimen` (read-only) |
| **Migration Files** | `db/007_sa4_tables.sql` (schema), `db/008_sa4_seed.sql` (test data) |
| **Status** | Draft |

---

## Table of Contents

1. [SA-4 Agent-Specific Tables](#1-sa-4-agent-specific-tables)
   - 1.1 [dce_ao_kyc_brief](#11-dce_ao_kyc_brief)
   - 1.2 [dce_ao_screening_result](#12-dce_ao_screening_result)
   - 1.3 [dce_ao_rm_kyc_decision](#13-dce_ao_rm_kyc_decision)
2. [Shared Tables Used by SA-4](#2-shared-tables-used-by-sa-4)
3. [SA-4 Table Dependency Map](#3-sa-4-table-dependency-map)

---

## 1. SA-4 Agent-Specific Tables

### 1.1 `dce_ao_kyc_brief`

**Purpose:** Stores the KYC/CDD brief compiled by the SA-4 agent during Phase 1 (TRIGGER mode). One record per case per attempt. The brief is written in two stages:

- **Stage A (Turn 2 — `sa4_extract_entity_structure`):** Initial INSERT with entity structure, ownership chain, directors, and beneficial owners list.
- **Stage B (Turn 5/6 — `sa4_compile_and_submit_kyc_brief`):** UPDATE with screening summary, brief URL, open questions, and risk range suggestion after all API calls complete.

The `brief_url` is the Agentic Workbench link posted to the RM for review. Once set, the brief is **immutable** (regulatory audit requirement per MAS Notice SFA 02-N13 and HKMA AMLO). The `suggested_risk_range` is the agent's suggestion only — the final `kyc_risk_rating` is always the RM's decision, stored in `dce_ao_rm_kyc_decision`.

```sql
CREATE TABLE IF NOT EXISTS dce_ao_kyc_brief (
    brief_id                    VARCHAR(30) PRIMARY KEY,        -- BRIEF-XXXXXX
    case_id                     VARCHAR(20) NOT NULL,
    attempt_number              INT NOT NULL DEFAULT 1,
    -- Entity summary (populated in Turn 2)
    entity_legal_name           VARCHAR(200) NOT NULL,
    entity_type                 ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    incorporation_jurisdiction  VARCHAR(10),
    incorporation_date          DATE,
    lei_number                  VARCHAR(20),
    -- Ownership structure (variable depth JSON — populated in Turn 2)
    ownership_chain             JSON,                           -- Nested ownership chain
    beneficial_owners           JSON,                          -- UBOs above 25% threshold with ID refs
    directors                   JSON,                          -- Director list with ID references
    -- Screening summary (populated in Turn 3 after batch screening)
    sanctions_status            ENUM('CLEAR','POTENTIAL_MATCH','HIT_CONFIRMED') NOT NULL DEFAULT 'CLEAR',
    pep_flag_count              INT DEFAULT 0,
    adverse_media_found         BOOLEAN DEFAULT FALSE,
    names_screened_count        INT DEFAULT 0,
    -- Retail investor (Singapore MAS obligation)
    is_retail_investor          BOOLEAN DEFAULT FALSE,
    mas_risk_disclosure_confirmed BOOLEAN DEFAULT FALSE,
    -- Brief output (populated in Turn 5/6 on compilation)
    brief_url                   VARCHAR(500),                  -- Workbench URL for RM review
    open_questions              JSON,                          -- Open questions for RM investigation
    suggested_risk_range        VARCHAR(20),                   -- Agent suggestion: LOW/MEDIUM/HIGH only
    -- Agent metadata
    compiled_by_model           VARCHAR(50),                   -- e.g. claude-sonnet-4-6
    kb_chunks_used              JSON,                          -- KB-4, KB-3, KB-6 chunk IDs used
    compiled_at                 DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_sanctions (sanctions_status)
);
```

**Mock Data (2 rows — one per test case):**

| brief_id | case_id | attempt_number | entity_legal_name | entity_type | incorporation_jurisdiction | sanctions_status | pep_flag_count | adverse_media_found | names_screened_count | suggested_risk_range | brief_url | compiled_at |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BRIEF-000201 | AO-2026-000201 | 1 | ABC Capital Management Pte Ltd | CORP | SGP | CLEAR | 0 | false | 4 | MEDIUM | /workbench/kyc-review/BRIEF-000201 | 2026-03-07 10:15:00 |
| BRIEF-000202 | AO-2026-000202 | 1 | Dragon Phoenix Holdings Ltd | CORP | HKG | POTENTIAL_MATCH | 0 | false | 3 | HIGH | /workbench/kyc-review/BRIEF-000202 | 2026-03-07 10:45:00 |

> **Scenario Coverage:**
> - **Case 201 (SGP/CORP — CLEAR):** All 4 individuals screened CLEAR. RM approves with MEDIUM risk rating. Case advances to N-4.
> - **Case 202 (HKG/CORP — POTENTIAL_MATCH):** Director Liu Zhiwei flags as POTENTIAL_MATCH on Refinitiv. RM reviews and assigns HIGH risk rating. Case continues with EDD.

---

### 1.2 `dce_ao_screening_result`

**Purpose:** Stores per-name AML/KYC screening results for all individuals and entities screened by SA-4. One row per person per case — covering the applicant entity itself, each director, each UBO above the 25% threshold (or 10% for PEPs), each guarantor, and each authorised signatory.

Screening covers three parallel API calls:
1. **Sanctions** — Refinitiv World-Check API (API-3): checks OFAC, UN, EU, MAS, HKMA consolidated lists
2. **PEP** — Dow Jones Risk API (API-4): Politically Exposed Person screening
3. **Adverse Media** — Factiva API (API-5): financial crime, fraud, regulatory action coverage

Records are **immutable** post-write (regulatory audit trail). If a re-screen is needed (e.g., fresh attempt), new rows are inserted with a new `brief_id` — old rows are never modified.

```sql
CREATE TABLE IF NOT EXISTS dce_ao_screening_result (
    screening_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    brief_id            VARCHAR(30) NOT NULL,
    person_name         VARCHAR(200) NOT NULL,
    person_role         ENUM('ENTITY','DIRECTOR','UBO','GUARANTOR',
                             'SIGNATORY','SHAREHOLDER') NOT NULL,
    -- Sanctions (Refinitiv World-Check API-3)
    sanctions_status    ENUM('CLEAR','POTENTIAL_MATCH','HIT_CONFIRMED') NOT NULL,
    sanctions_source    VARCHAR(100),                          -- e.g. "Refinitiv World-Check v4"
    sanctions_detail    JSON,                                  -- Hit detail if status != CLEAR
    -- PEP screening (Dow Jones Risk API-4)
    pep_status          ENUM('NONE','POTENTIAL_PEP','CONFIRMED_PEP') NOT NULL DEFAULT 'NONE',
    pep_source          VARCHAR(100),                          -- e.g. "Dow Jones Risk"
    pep_detail          JSON,                                  -- PEP category, country, source
    -- Adverse media (Factiva API-5)
    adverse_media_found BOOLEAN DEFAULT FALSE,
    adverse_media_count INT DEFAULT 0,
    adverse_media_hits  JSON,                                  -- Summary: source, date, topic, severity
    -- Metadata
    screened_at         DATETIME DEFAULT NOW(),
    screening_api_version VARCHAR(50),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (brief_id) REFERENCES dce_ao_kyc_brief(brief_id),
    INDEX idx_case (case_id),
    INDEX idx_brief (brief_id),
    INDEX idx_sanctions (sanctions_status),
    INDEX idx_name (person_name(100))
);
```

**Mock Data (7 rows across both test cases):**

| screening_id | case_id | brief_id | person_name | person_role | sanctions_status | pep_status | adverse_media_found | screened_at |
|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000201 | BRIEF-000201 | ABC Capital Management Pte Ltd | ENTITY | CLEAR | NONE | false | 2026-03-07 10:10:00 |
| 2 | AO-2026-000201 | BRIEF-000201 | Tan Wei Liang | DIRECTOR | CLEAR | NONE | false | 2026-03-07 10:10:05 |
| 3 | AO-2026-000201 | BRIEF-000201 | Sarah Chen Hui Min | DIRECTOR | CLEAR | NONE | false | 2026-03-07 10:10:10 |
| 4 | AO-2026-000201 | BRIEF-000201 | Lim Boon Keng | UBO | CLEAR | NONE | false | 2026-03-07 10:10:15 |
| 5 | AO-2026-000202 | BRIEF-000202 | Dragon Phoenix Holdings Ltd | ENTITY | CLEAR | NONE | false | 2026-03-07 10:40:00 |
| 6 | AO-2026-000202 | BRIEF-000202 | Liu Zhiwei | DIRECTOR | POTENTIAL_MATCH | NONE | false | 2026-03-07 10:40:05 |
| 7 | AO-2026-000202 | BRIEF-000202 | Wong Ka Fai | UBO | CLEAR | NONE | false | 2026-03-07 10:40:10 |

> **Note on Liu Zhiwei (row 6):** This POTENTIAL_MATCH is produced by the local `_SANCTIONS_WATCHLIST` stub in `sa4_server.py` — simulating a Refinitiv World-Check partial name match. In production, Refinitiv returns a `match_type: NAME_PARTIAL` hit for name similarity. The RM must adjudicate POTENTIAL_MATCH cases — confirm as HIT or clear as false positive — before proceeding to brief compilation.

---

### 1.3 `dce_ao_rm_kyc_decision`

**Purpose:** Stores the RM's mandatory KYC/CDD decision fields captured during Phase 2 (RESUME mode) by `sa4_capture_rm_decisions`. One record per case — the `UNIQUE KEY idx_case (case_id)` constraint enforces this. The decision record is **immutable** once written (regulatory evidence per MAS Notice 626 and MAS Notice SFA 02-N13). If the RM needs to amend a decision, a compliance escalation is required — this table is never updated directly.

All 10 mandatory fields must be present and valid before `sa4_complete_node` can proceed. The `Decision Validator` node in the Dify workflow enforces this check before routing to the KYC Risk Router.

```sql
CREATE TABLE IF NOT EXISTS dce_ao_rm_kyc_decision (
    decision_id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                         VARCHAR(20) NOT NULL,
    brief_id                        VARCHAR(30) NOT NULL,
    -- Mandatory RM decisions (all required)
    kyc_risk_rating                 ENUM('LOW','MEDIUM','HIGH','UNACCEPTABLE') NOT NULL,
    cdd_clearance                   ENUM('CLEARED','ENHANCED_DUE_DILIGENCE','DECLINED') NOT NULL,
    bcap_clearance                  BOOLEAN NOT NULL,
    caa_approach                    ENUM('IRB','SA') NOT NULL,
    recommended_dce_limit_sgd       DECIMAL(15,2) NOT NULL,
    recommended_dce_pce_limit_sgd   DECIMAL(15,2) NOT NULL,
    osca_case_number                VARCHAR(50) NOT NULL,
    limit_exposure_indication       TEXT,
    -- Additional RM conditions (optional free-form)
    additional_conditions           JSON,
    -- RM metadata
    rm_id                           VARCHAR(20) NOT NULL,
    rm_name                         VARCHAR(200),
    decided_at                      DATETIME NOT NULL,
    -- Chatflow companion usage (optional)
    chatflow_session_id             VARCHAR(50),
    chatflow_queries_count          INT DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (brief_id) REFERENCES dce_ao_kyc_brief(brief_id),
    UNIQUE KEY idx_case (case_id),
    INDEX idx_rm (rm_id),
    INDEX idx_rating (kyc_risk_rating)
);
```

**Mandatory Fields Reference:**

| Field | Valid Values | Notes |
|---|---|---|
| `kyc_risk_rating` | `LOW`, `MEDIUM`, `HIGH`, `UNACCEPTABLE` | UNACCEPTABLE → KYC_DECLINED path → case goes DEAD |
| `cdd_clearance` | `CLEARED`, `ENHANCED_DUE_DILIGENCE`, `DECLINED` | EDD requires additional documentation before N-4 |
| `bcap_clearance` | `true`, `false` | Conduct Risk Assessment Platform clearance |
| `caa_approach` | `IRB`, `SA` | Credit Approval Authority: Internal Ratings Based or Standardised |
| `recommended_dce_limit_sgd` | Decimal ≥ 0 | DCE credit facility limit in SGD |
| `recommended_dce_pce_limit_sgd` | Decimal ≥ 0 | Pre-settlement credit exposure limit in SGD |
| `osca_case_number` | String (non-empty) | OpenShift Credit Approval case reference |
| `limit_exposure_indication` | Text | Narrative on limit sizing rationale |
| `rm_id` | String (non-empty) | Relationship Manager employee ID |
| `decided_at` | DATETIME (`YYYY-MM-DD HH:MM:SS`) | When RM submitted decision |

**Mock Data (2 rows — one per test case, written during T8/T9 test execution):**

| decision_id | case_id | brief_id | kyc_risk_rating | cdd_clearance | bcap_clearance | caa_approach | recommended_dce_limit_sgd | recommended_dce_pce_limit_sgd | osca_case_number | rm_id | decided_at |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | AO-2026-000201 | BRIEF-000201 | MEDIUM | CLEARED | true | IRB | 5000000.00 | 500000.00 | OSCA-2026-0042 | RM-001 | 2026-03-07 11:00:00 |
| 2 | AO-2026-000202 | BRIEF-000202 | HIGH | ENHANCED_DUE_DILIGENCE | true | SA | 2000000.00 | 200000.00 | OSCA-2026-0043 | RM-001 | 2026-03-07 11:30:00 |

> **Note:** These rows are written by the SA-4 test suite (T8 + T9) and cleaned up by `cleanup_test_data()` after each run. The seed SQL (`008_sa4_seed.sql`) does not pre-populate these rows — they only exist after tests run or after an actual HITL cycle completes.

---

## 2. Shared Tables Used by SA-4

SA-4 reads from and writes to several tables created by earlier agents:

| Table | Owner | SA-4 Access | Purpose |
|---|---|---|---|
| `dce_ao_case_state` | SA-1 | READ + UPDATE | Reads case status, jurisdiction, product type; updates `status`, `current_node`, `hitl_queue` |
| `dce_ao_node_checkpoint` | SA-1 | INSERT + REPLACE | Writes N-3 checkpoints: `HITL_PENDING` (Phase 1), `COMPLETE`/`FAILED`/`SUSPENDED_SANCTIONS` (Phase 2). Uses `REPLACE INTO` to overwrite HITL_PENDING on completion |
| `dce_ao_event_log` | SA-1 | INSERT | Writes events: `KYC_BRIEF_COMPILED`, `HITL_REVIEW_REQUESTED`, `RM_KYC_DECISION_CAPTURED`, `KYC_APPROVED`, `KYC_DECLINED`, `SANCTIONS_HIT` |
| `dce_ao_rm_hierarchy` | SA-1 | READ | Reads `rm_id`, `rm_name`, `rm_head_id` for workbench context and notification routing |
| `dce_ao_document_ocr_result` | SA-2 | READ | Full JSON `extracted_text` containing entity structure (directors, UBOs, ownership chain, AO form data) |
| `dce_ao_classification_result` | SA-2 | READ | Case `product_type`, `client_jurisdiction`, `onboarding_track` — used to determine applicable CDD rules |
| `dce_ao_signature_specimen` | SA-3 | READ | Reads approved specimen IDs to cross-reference signatories during entity structure extraction |
| `dce_ao_hitl_review_task` | SA-3 | INSERT + UPDATE | **Shared HITL table.** SA-4 writes `KYC_CDD_REVIEW` tasks assigned to `RM` persona. Phase 2 reads the `decision_payload` from the task written by Phase 1 |
| `dce_ao_notification_log` | SA-1 | INSERT | Sends workbench notification to RM with KYC brief URL and review deadline |

### `dce_ao_hitl_review_task` — SA-4 Task Type

SA-4 writes `KYC_CDD_REVIEW` tasks to `dce_ao_hitl_review_task` during `sa4_park_for_hitl`. These tasks differ from SA-3's `SIGNATURE_REVIEW` tasks in the following ways:

| Field | SA-3 Value | SA-4 Value |
|---|---|---|
| `task_type` | `SIGNATURE_REVIEW` | `KYC_CDD_REVIEW` |
| `assigned_persona` | `DESK_SUPPORT` | `RM` |
| `node_id` | `N-2` | `N-3` |
| `task_payload` | Verification report with confidence tiers | KYC brief URL, screening results, open questions |
| `decision_payload` | Per-signatory APPROVE/REJECT/CLARIFY | 10 mandatory RM fields (risk rating, limits, OSCA number, etc.) |

---

## 3. SA-4 Table Dependency Map

```
Upstream Tables (read-only)              SA-4 Tables (new, this agent)
════════════════════════════             ══════════════════════════════

dce_ao_case_state ─────────────┬──────→ dce_ao_kyc_brief
    │  (status, jurisdiction,  │            (1 per case per attempt;
    │   product_type)          │             two-stage write: entity structure
    │                          │             then screening summary + brief URL)
dce_ao_classification_result ──┤
    │  (product_type,          │──────→ dce_ao_screening_result
    │   onboarding_track)      │            (1 row per individual screened;
    │                          │             immutable post-write)
dce_ao_document_ocr_result ────┤
    │  (extracted_text JSON:   │──────→ dce_ao_rm_kyc_decision
    │   directors, UBOs,       │            (1 per case — UNIQUE constraint;
    │   ownership_chain,       │             written by sa4_capture_rm_decisions;
    │   AO form fields)        │             immutable regulatory record)
    │                          │
dce_ao_signature_specimen ─────┤
    │  (approved signatories   │
    │   for cross-reference)   │
    │                          │
dce_ao_rm_hierarchy ───────────┘
    │  (RM name, head ID for
    │   notification routing)
    │

Shared Tables (read + write)
════════════════════════════
dce_ao_node_checkpoint  ←─────────────  SA-4 writes N-3 checkpoints:
    │                                    - HITL_PENDING (Phase 1, sa4_park_for_hitl)
    │                                    - COMPLETE / FAILED (Phase 2, sa4_complete_node)
    │                                    - SUSPENDED_SANCTIONS (sa4_escalate_sanctions_hit)
    │                                    Uses REPLACE INTO for Phase 2 (overwrites HITL_PENDING)

dce_ao_hitl_review_task ←─────────────  SA-4 writes KYC_CDD_REVIEW tasks (assigned to RM);
    │                                    Phase 2 reads decision_payload from same task

dce_ao_event_log  ←───────────────────  SA-4 writes: KYC_BRIEF_COMPILED, HITL_REVIEW_REQUESTED,
    │                                    RM_KYC_DECISION_CAPTURED, KYC_APPROVED, KYC_DECLINED,
    │                                    SANCTIONS_HIT

dce_ao_notification_log ←─────────────  SA-4 writes workbench notification to RM persona
```

### Table Summary

| # | Table | Owner Skill | Rows per Case | Shared? |
|---|---|---|---|---|
| 1 | `dce_ao_kyc_brief` | `sa4_extract_entity_structure` (INSERT), `sa4_compile_and_submit_kyc_brief` (UPDATE) | 1 per attempt (typically 1) | SA-4 creates; SA-9 reads for audit |
| 2 | `dce_ao_screening_result` | `sa4_run_screening_batch` | 1 per individual screened (typically 3–8) | SA-4 creates (immutable); SA-9 reads for audit |
| 3 | `dce_ao_rm_kyc_decision` | `sa4_capture_rm_decisions` | 1 per case (UNIQUE constraint) | SA-4 creates (immutable); SA-5 reads for credit context |

---

### Special Rules: Sanctions Hard Stop

If `sa4_run_screening_batch` returns `has_confirmed_hit: true`, the agent **must immediately** call `sa4_escalate_sanctions_hit` and **must not** proceed to `sa4_compile_and_submit_kyc_brief`. This is enforced by:

1. **Dify workflow:** Node `4000000010` (IF/ELSE) routes `has_confirmed_hit == true` to `4000000011` (Escalate) → `4000000012` (END Escalated). The compile/submit/park path is unreachable on this branch.
2. **DB state:** `sa4_escalate_sanctions_hit` writes a `SUSPENDED_SANCTIONS` node checkpoint with `status='FAILED'` and sets `dce_ao_case_state.status = 'ESCALATED'`. The case never advances to N-4.
3. **POTENTIAL_MATCH:** Does NOT trigger hard stop — the agent parks the POTENTIAL_MATCH in the brief and proceeds to compilation. The RM adjudicates POTENTIAL_MATCH during HITL review.

### Special Rules: KYC_DECLINED Path

If the RM sets `kyc_risk_rating = UNACCEPTABLE`, `sa4_complete_node` routes to the `KYC_DECLINED` outcome:
- Node checkpoint: `status = 'FAILED'`, `output_json.outcome = 'KYC_DECLINED'`
- Case state: `status = 'ESCALATED'`, `current_node = 'DEAD'`
- No N-4 trigger is sent — the application is permanently declined

---

> **Maintenance Note:** SA-4 reads `dce_ao_document_ocr_result.extracted_text` as the primary source of entity structure data (directors, UBOs, ownership chain). This JSON field is written by SA-2's OCR pipeline. If the OCR quality is poor (missing directors, incorrect UBO percentages), SA-4 will raise `open_questions` in the brief for the RM to resolve. SA-4 does NOT write back to SA-2 tables. The `dce_ao_rm_kyc_decision` table is read by SA-5 (Credit Assessment) to understand the approved DCE/PCE limits and CAA approach selected by the RM.
