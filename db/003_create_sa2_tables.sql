-- DCE Account Opening — SA-2 Document Collection Agent Tables
-- Version: 1.0.0 | Date: 2026-03-02
-- Scope: SA-2 Document Collection & Completeness Agent (Node N-1)

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_document_checklist
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_document_checklist (
    checklist_id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    account_type        VARCHAR(30) NOT NULL,
    jurisdiction        VARCHAR(5) NOT NULL,
    entity_type         VARCHAR(20) NOT NULL,
    products_requested  JSON,
    checklist_version   VARCHAR(20),
    mandatory_count     INT NOT NULL DEFAULT 0,
    optional_count      INT NOT NULL DEFAULT 0,
    regulatory_basis    TEXT,
    generated_at        DATETIME DEFAULT NOW(),
    generated_by_model  VARCHAR(50),
    kb_chunks_used      JSON,
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id)
);

-- ============================================
-- Table 2: dce_ao_document_checklist_item
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_document_checklist_item (
    item_id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    checklist_id        BIGINT NOT NULL,
    case_id             VARCHAR(20) NOT NULL,
    doc_type_code       VARCHAR(50) NOT NULL,
    doc_type_name       VARCHAR(200) NOT NULL,
    requirement         ENUM('MANDATORY','OPTIONAL') NOT NULL,
    regulatory_ref      VARCHAR(200),
    max_age_days        INT,
    accepted_formats    JSON,
    matched_doc_id      VARCHAR(30),
    match_status        ENUM('UNMATCHED','MATCHED','REJECTED','RESUBMISSION_REQUIRED') DEFAULT 'UNMATCHED',
    match_confidence    DECIMAL(4,3),
    notes               TEXT,
    FOREIGN KEY (checklist_id) REFERENCES dce_ao_document_checklist(checklist_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_checklist (checklist_id),
    INDEX idx_case (case_id),
    INDEX idx_status (match_status)
);

-- ============================================
-- Table 3: dce_ao_document_ocr_result
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_document_ocr_result (
    ocr_id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_id              VARCHAR(30) NOT NULL,
    case_id             VARCHAR(20) NOT NULL,
    detected_doc_type   VARCHAR(50),
    ocr_confidence      DECIMAL(4,3) NOT NULL,
    extracted_text      MEDIUMTEXT,
    issuing_authority   VARCHAR(200),
    issue_date          DATE,
    expiry_date         DATE,
    signatory_names     JSON,
    document_language   VARCHAR(10) DEFAULT 'EN',
    page_count          INT,
    has_signatures      BOOLEAN DEFAULT FALSE,
    has_stamps          BOOLEAN DEFAULT FALSE,
    flagged_for_review  BOOLEAN DEFAULT FALSE,
    ocr_engine          VARCHAR(50),
    processing_time_ms  INT,
    processed_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (doc_id) REFERENCES dce_ao_document_staged(doc_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_doc (doc_id),
    INDEX idx_case (case_id),
    INDEX idx_flagged (flagged_for_review)
);

-- ============================================
-- Table 4: dce_ao_document_review
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_document_review (
    review_id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    doc_id              VARCHAR(30) NOT NULL,
    case_id             VARCHAR(20) NOT NULL,
    checklist_item_id   BIGINT,
    attempt_number      INT NOT NULL DEFAULT 1,
    decision            ENUM('ACCEPTED','REJECTED','REQUIRES_RESUBMISSION') NOT NULL,
    decision_reason_code VARCHAR(50),
    rejection_reason    TEXT,
    resubmission_instructions TEXT,
    regulatory_reference VARCHAR(200),
    validity_status     ENUM('VALID','EXPIRED','NEAR_EXPIRY','UNACCEPTABLE_SOURCE'),
    days_to_expiry      INT,
    validity_notes      TEXT,
    flagged_at          DATETIME,
    flag_status         ENUM('FLAGGED','CLEARED','PENDING') DEFAULT 'PENDING',
    reviewed_at         DATETIME DEFAULT NOW(),
    reviewed_by         VARCHAR(50) DEFAULT 'AGENT',
    FOREIGN KEY (doc_id) REFERENCES dce_ao_document_staged(doc_id),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_doc (doc_id),
    INDEX idx_case (case_id),
    INDEX idx_decision (decision),
    INDEX idx_attempt (case_id, attempt_number)
);

-- ============================================
-- Table 5: dce_ao_completeness_assessment
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_completeness_assessment (
    assessment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    checklist_id        BIGINT NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    completeness_flag   BOOLEAN NOT NULL,
    mandatory_docs_complete BOOLEAN NOT NULL,
    optional_docs_complete BOOLEAN NOT NULL,
    total_mandatory     INT NOT NULL,
    matched_mandatory   INT NOT NULL,
    total_optional      INT NOT NULL,
    matched_optional    INT NOT NULL,
    coverage_pct        DECIMAL(5,2),
    missing_mandatory   JSON,
    missing_optional    JSON,
    rejected_docs       JSON,
    rejection_reasons   JSON,
    next_node           VARCHAR(30),
    decision_reasoning  TEXT,
    retry_recommended   BOOLEAN DEFAULT FALSE,
    sla_pct_consumed    DECIMAL(5,2),
    rm_chase_message    TEXT,
    chase_sent_at       DATETIME,
    assessor_model      VARCHAR(50),
    decision_model      VARCHAR(50),
    assessed_at         DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (checklist_id) REFERENCES dce_ao_document_checklist(checklist_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_next (next_node)
);

-- ============================================
-- Table 6: dce_ao_gta_validation
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_gta_validation (
    validation_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    gta_version_submitted VARCHAR(20),
    gta_version_current VARCHAR(20),
    gta_version_match   BOOLEAN,
    applicable_schedules JSON,
    schedules_submitted JSON,
    schedules_missing   JSON,
    addenda_required    JSON,
    addenda_submitted   JSON,
    addenda_missing     JSON,
    gta_validation_status ENUM('CURRENT','OUTDATED','MISSING') NOT NULL,
    validation_notes    TEXT,
    kb_chunks_used      JSON,
    validated_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_status (gta_validation_status)
);
