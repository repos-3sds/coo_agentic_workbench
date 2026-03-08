-- DCE Account Opening — SA-5 Credit Preparation Agent Tables
-- Version: 1.0.0 | Date: 2026-03-08
-- Scope: SA-5 Credit Preparation Agent (Node N-4)
-- Depends On:
--   SA-1 tables: dce_ao_case_state, dce_ao_rm_hierarchy, dce_ao_node_checkpoint, dce_ao_event_log
--   SA-2 tables: dce_ao_document_ocr_result, dce_ao_classification_result
--   SA-3 tables: dce_ao_hitl_review_task (reused for CREDIT_REVIEW tasks)
--   SA-4 tables: dce_ao_rm_kyc_decision (SA-5 reads this; never writes)

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_credit_brief
-- Credit brief compiled by SA-5 agent
-- One record per case per attempt (UNIQUE on case_id + attempt_number)
-- Partial INSERT on financial extraction; full UPDATE after compilation
-- Immutable once brief_url is set (regulatory requirement)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_credit_brief (
    credit_brief_id                 VARCHAR(30) PRIMARY KEY,        -- CBRIEF-XXXXXX
    case_id                         VARCHAR(20) NOT NULL,
    attempt_number                  INT NOT NULL DEFAULT 1,

    -- Entity summary (from case context)
    entity_legal_name               VARCHAR(200) NOT NULL,
    entity_type                     ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    jurisdiction                    VARCHAR(10),

    -- Products requested (from classification)
    products_requested              JSON,                           -- ["FUTURES","OTC_DERIVATIVES",...]

    -- RM recommendations (read from dce_ao_rm_kyc_decision — stored for brief context)
    caa_approach                    ENUM('IRB','SA') NOT NULL,
    recommended_dce_limit_sgd       DECIMAL(15,2) NOT NULL,
    recommended_dce_pce_limit_sgd   DECIMAL(15,2) NOT NULL,
    osca_case_number                VARCHAR(50) NOT NULL,
    limit_exposure_indication       TEXT,
    kyc_risk_rating                 ENUM('LOW','MEDIUM','HIGH') NOT NULL,  -- UNACCEPTABLE never reaches SA-5

    -- Financial summary (populated by sa5_extract_financial_data)
    financial_years_analysed        INT DEFAULT 0,                  -- Number of fiscal years extracted
    total_equity_sgd                DECIMAL(20,2),                  -- Most recent year
    net_asset_value_sgd             DECIMAL(20,2),                  -- Most recent year
    leverage_ratio                  DECIMAL(10,4),                  -- total_debt / total_equity
    liquidity_ratio                 DECIMAL(10,4),                  -- current_assets / current_liabilities
    revenue_sgd                     DECIMAL(20,2),                  -- Most recent year
    net_profit_sgd                  DECIMAL(20,2),                  -- Most recent year
    revenue_trend_pct               DECIMAL(8,4),                   -- YoY revenue change %
    profitability_trend_pct         DECIMAL(8,4),                   -- YoY profitability change %
    estimated_initial_limit_sgd     DECIMAL(15,2),                  -- SA-5 calculated estimate

    -- Brief output (populated by sa5_compile_credit_brief)
    brief_url                       VARCHAR(500),                   -- Credit Team Workbench URL
    open_questions                  JSON,                           -- Questions for Credit Team
    comparable_benchmarks           JSON,                           -- KB-6 comparable client ranges

    -- Outcome tracking (updated by sa5_complete_node)
    credit_outcome_flag             ENUM('PENDING','APPROVED','APPROVED_WITH_CONDITIONS','DECLINED')
                                    DEFAULT 'PENDING',

    -- Agent metadata
    compiled_by_model               VARCHAR(50),                    -- e.g. claude-sonnet-4-6 or qwen2.5:32b
    kb_chunks_used                  JSON,                           -- KB-6 chunk IDs used
    compiled_at                     DATETIME DEFAULT NOW(),

    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_outcome (credit_outcome_flag)
);

-- ============================================
-- Table 2: dce_ao_financial_extract
-- Per-document, per-fiscal-year financial data extracted by SA-5 LLM node
-- One row per (case_id, doc_id, fiscal_year)
-- Immutable post-write (audit trail of LLM extraction results)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_financial_extract (
    extract_id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                         VARCHAR(20) NOT NULL,
    credit_brief_id                 VARCHAR(30) NOT NULL,
    doc_id                          VARCHAR(30) NOT NULL,           -- Source financial statement doc

    -- Fiscal period
    fiscal_year                     INT NOT NULL,                   -- e.g. 2023, 2024, 2025
    fiscal_year_end_date            DATE,                           -- e.g. 2024-12-31

    -- Extracted financials (all in reporting currency, converted to SGD where possible)
    reporting_currency              CHAR(3) DEFAULT 'SGD',
    total_equity                    DECIMAL(20,2),
    net_asset_value                 DECIMAL(20,2),
    total_debt                      DECIMAL(20,2),
    current_assets                  DECIMAL(20,2),
    current_liabilities             DECIMAL(20,2),
    revenue                         DECIMAL(20,2),
    net_profit                      DECIMAL(20,2),
    existing_debt_obligations       DECIMAL(20,2),

    -- SGD-equivalent (after FX conversion)
    fx_rate_to_sgd                  DECIMAL(15,6) DEFAULT 1.0,
    total_equity_sgd                DECIMAL(20,2),
    revenue_sgd                     DECIMAL(20,2),
    net_profit_sgd                  DECIMAL(20,2),

    -- Calculated ratios
    leverage_ratio                  DECIMAL(10,4),                  -- total_debt / total_equity
    liquidity_ratio                 DECIMAL(10,4),                  -- current_assets / current_liabilities

    -- Extraction metadata
    extraction_confidence           DECIMAL(5,4),                   -- 0.0 to 1.0 (LLM confidence)
    extraction_notes                TEXT,                           -- Flags, caveats from LLM extraction
    extracted_by_model              VARCHAR(50),
    extracted_at                    DATETIME DEFAULT NOW(),

    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (credit_brief_id) REFERENCES dce_ao_credit_brief(credit_brief_id),
    UNIQUE KEY idx_case_doc_year (case_id, doc_id, fiscal_year),
    INDEX idx_case (case_id),
    INDEX idx_brief (credit_brief_id)
);

-- ============================================
-- Table 3: dce_ao_credit_decision
-- Credit Team decisions captured post-HITL
-- Immutable regulatory record — UNIQUE on case_id (one decision per case)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_credit_decision (
    decision_id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                         VARCHAR(20) NOT NULL,
    credit_brief_id                 VARCHAR(30) NOT NULL,

    -- Mandatory Credit Team decisions (all required — validated by Decision Validator node)
    credit_outcome                  ENUM('APPROVED','APPROVED_WITH_CONDITIONS','DECLINED') NOT NULL,
    approved_dce_limit_sgd          DECIMAL(15,2),                  -- NULL if declined
    approved_dce_pce_limit_sgd      DECIMAL(15,2),                  -- NULL if declined
    confirmed_caa_approach          ENUM('IRB','SA') NOT NULL,

    -- Conditions (if any — blocks Welcome Kit until resolved)
    conditions                      JSON,                           -- Array: [{type, description, owner, open_until_date}]

    -- Decline path (if credit_outcome = DECLINED)
    decline_reason                  TEXT,

    -- Credit Team metadata
    credit_team_id                  VARCHAR(20) NOT NULL,
    credit_team_name                VARCHAR(200),
    credit_team_email               VARCHAR(200),
    decided_at                      DATETIME NOT NULL,

    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (credit_brief_id) REFERENCES dce_ao_credit_brief(credit_brief_id),
    UNIQUE KEY idx_case (case_id),                                 -- One decision per case
    INDEX idx_credit_team (credit_team_id),
    INDEX idx_outcome (credit_outcome)
);
