-- DCE Account Opening — SA-3 Signature Verification Agent Tables
-- Version: 1.0.0 | Date: 2026-03-04
-- Scope: SA-3 Signature Verification Agent (Node N-2)
-- Depends On: SA-1 tables (dce_ao_case_state, dce_ao_document_staged)

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_signature_verification
-- Per-signatory signature verification result
-- (Phase 1 output — immutable audit record)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_signature_verification (
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

-- ============================================
-- Table 2: dce_ao_signature_specimen
-- Approved signature specimens (post-HITL)
-- Permanent regulatory evidence per MAS/HKMA
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_signature_specimen (
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

-- ============================================
-- Table 3: dce_ao_hitl_review_task
-- Shared HITL table (SA-3, SA-4, SA-5, SA-6)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_hitl_review_task (
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
