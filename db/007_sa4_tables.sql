-- DCE Account Opening — SA-4 KYC/CDD Preparation Agent Tables
-- Version: 1.0.0 | Date: 2026-03-07
-- Scope: SA-4 KYC/CDD Preparation Agent (Node N-3)
-- Depends On:
--   SA-1 tables: dce_ao_case_state, dce_ao_rm_hierarchy, dce_ao_node_checkpoint
--   SA-2 tables: dce_ao_document_ocr_result, dce_ao_classification_result
--   SA-3 tables: dce_ao_signature_specimen, dce_ao_hitl_review_task (reused)

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_kyc_brief
-- KYC/CDD brief compiled by SA-4 agent loop
-- One record per case per attempt (UNIQUE on case_id + attempt_number)
-- Partial INSERT on entity_structure extraction; full UPDATE after compilation
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_kyc_brief (
    brief_id                    VARCHAR(30) PRIMARY KEY,        -- BRIEF-XXXXXX
    case_id                     VARCHAR(20) NOT NULL,
    attempt_number              INT NOT NULL DEFAULT 1,
    -- Entity summary (populated in Phase 1, Turn 2)
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

-- ============================================
-- Table 2: dce_ao_screening_result
-- Per-name screening result — one row per individual/entity screened
-- (entity itself + each director + each UBO + each guarantor)
-- Immutable post-write (audit trail requirement)
-- ============================================
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

-- ============================================
-- Table 3: dce_ao_rm_kyc_decision
-- RM KYC/CDD decisions captured post-HITL
-- Immutable regulatory record — UNIQUE on case_id (one decision per case)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_rm_kyc_decision (
    decision_id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                         VARCHAR(20) NOT NULL,
    brief_id                        VARCHAR(30) NOT NULL,
    -- Mandatory RM decisions (all required — validated by Decision Validator node)
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
    -- Chatflow companion usage (optional — RM may query CF agent before deciding)
    chatflow_session_id             VARCHAR(50),
    chatflow_queries_count          INT DEFAULT 0,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (brief_id) REFERENCES dce_ao_kyc_brief(brief_id),
    UNIQUE KEY idx_case (case_id),                             -- One decision record per case
    INDEX idx_rm (rm_id),
    INDEX idx_rating (kyc_risk_rating)
);
