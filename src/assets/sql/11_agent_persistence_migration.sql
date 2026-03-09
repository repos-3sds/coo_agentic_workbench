-- ============================================================
-- AGENT PERSISTENCE MIGRATION v1.1
-- Adds missing tables and columns for full agent output capture
-- Fixes: agent results lost on nav, incomplete DB schema
-- Compatible with MySQL 8+/9+ (uses COLLATE utf8mb4_general_ci)
-- ============================================================
-- MariaDB:  docker exec -i npa_mariadb mysql -unpa_user -pnpa_password npa_workbench < src/assets/sql/11_agent_persistence_migration.sql
-- MySQL/Railway: Run via Node.js migration runner (see server/run-migration.js)

-- ────────────────────────────────────────────────────────────
-- 1. UNIFIED AGENT RESULTS TABLE (captures ALL agent outputs)
--    Single table to store structured JSON for every agent run.
--    The npa-detail persist endpoints write here.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_agent_results (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
    agent_type      VARCHAR(30)  NOT NULL COMMENT 'classifier, ml-predict, risk, governance, doc-lifecycle, monitoring',
    result_data     JSON         NOT NULL COMMENT 'Full structured agent output',
    workflow_run_id VARCHAR(100) DEFAULT NULL COMMENT 'Dify workflow execution ID',
    status          VARCHAR(20)  DEFAULT 'SUCCESS' COMMENT 'SUCCESS, PARTIAL, FAILED',
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    INDEX idx_agent_results_proj (project_id),
    INDEX idx_agent_results_type (project_id, agent_type),
    UNIQUE KEY uq_agent_proj_type (project_id, agent_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ────────────────────────────────────────────────────────────
-- 2. ML PREDICTION TABLE (entirely missing)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_ml_predictions (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id          VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
    approval_likelihood DECIMAL(5,2) NOT NULL COMMENT '0-100 percentage',
    timeline_days       INT          NOT NULL COMMENT 'Predicted days to approval',
    bottleneck_dept     VARCHAR(100) DEFAULT NULL COMMENT 'Predicted bottleneck department',
    risk_score          DECIMAL(5,2) DEFAULT 0 COMMENT '0-100 risk score',
    features            JSON         DEFAULT NULL COMMENT 'Array of {name, importance, value}',
    comparison_insights JSON         DEFAULT NULL COMMENT 'Array of insight strings',
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    INDEX idx_ml_pred_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ────────────────────────────────────────────────────────────
-- 3. EXTEND npa_risk_checks — add missing aggregate columns
--    NOTE: MySQL 9+ does not support IF NOT EXISTS on ADD COLUMN.
--    Run each ALTER individually; ignore ER_DUP_FIELDNAME errors.
-- ────────────────────────────────────────────────────────────

-- Add overall risk assessment columns (persisted per-project, not per-layer)
ALTER TABLE npa_risk_checks ADD COLUMN overall_score     DECIMAL(5,2) DEFAULT NULL COMMENT 'Overall risk score 0-100';
ALTER TABLE npa_risk_checks ADD COLUMN overall_rating    VARCHAR(20)  DEFAULT NULL COMMENT 'LOW, MEDIUM, HIGH, CRITICAL';
ALTER TABLE npa_risk_checks ADD COLUMN hard_stop         TINYINT(1)   DEFAULT 0   COMMENT 'Whether product is prohibited';
ALTER TABLE npa_risk_checks ADD COLUMN hard_stop_reason  TEXT         DEFAULT NULL;

-- Create a risk_assessment_summary table for the full structured output
CREATE TABLE IF NOT EXISTS npa_risk_assessment_summary (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id            VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
    overall_score         DECIMAL(5,2) DEFAULT 0,
    overall_rating        VARCHAR(20)  DEFAULT 'MEDIUM',
    hard_stop             TINYINT(1)   DEFAULT 0,
    hard_stop_reason      TEXT         DEFAULT NULL,
    domain_assessments    JSON         DEFAULT NULL COMMENT 'Array of {domain, score, rating, keyFindings, mitigants}',
    pir_requirements      JSON         DEFAULT NULL COMMENT '{required, type, deadline_months, conditions}',
    notional_flags        JSON         DEFAULT NULL COMMENT '{finance_vp_required, cfo_required, roae_required, threshold_breached}',
    mandatory_signoffs    JSON         DEFAULT NULL COMMENT 'Array of sign-off party names',
    recommendations       JSON         DEFAULT NULL COMMENT 'Array of recommendation strings',
    circuit_breaker       JSON         DEFAULT NULL COMMENT '{triggered, loop_back_count, threshold, escalation_target}',
    evergreen_limits      JSON         DEFAULT NULL COMMENT '{eligible, notional_remaining, deal_count_remaining, flags}',
    validity_risk         JSON         DEFAULT NULL COMMENT '{valid, expiry_date, extension_eligible, notes}',
    npa_lite_risk_profile JSON         DEFAULT NULL COMMENT '{subtype, eligible, conditions_met, conditions_failed}',
    sop_bottleneck_risk   JSON         DEFAULT NULL COMMENT '{bottleneck_parties, estimated_days, critical_path}',
    prerequisites         JSON         DEFAULT NULL COMMENT 'Array of {name, status, category}',
    raw_json              JSON         DEFAULT NULL COMMENT 'Full raw agent output',
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    UNIQUE KEY uq_risk_summary_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ────────────────────────────────────────────────────────────
-- 4. EXTEND npa_classification_scorecards — add raw/trace columns
-- ────────────────────────────────────────────────────────────

ALTER TABLE npa_classification_scorecards ADD COLUMN approval_track    VARCHAR(30)  DEFAULT NULL COMMENT 'FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN, PROHIBITED';
ALTER TABLE npa_classification_scorecards ADD COLUMN raw_json          JSON         DEFAULT NULL COMMENT 'Full raw agent output';
ALTER TABLE npa_classification_scorecards ADD COLUMN workflow_run_id   VARCHAR(100) DEFAULT NULL COMMENT 'Dify workflow execution ID';
ALTER TABLE npa_classification_scorecards ADD COLUMN updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ────────────────────────────────────────────────────────────
-- 5. DOC LIFECYCLE SUMMARY TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_doc_lifecycle_summary (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id            VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
    completeness_percent  DECIMAL(5,2) DEFAULT 0,
    total_required        INT          DEFAULT 0,
    total_present         INT          DEFAULT 0,
    total_valid           INT          DEFAULT 0,
    stage_gate_status     VARCHAR(20)  DEFAULT 'BLOCKED' COMMENT 'CLEAR, WARNING, BLOCKED',
    missing_documents     JSON         DEFAULT NULL COMMENT 'Array of {document_name, document_type, status, notes, priority}',
    invalid_documents     JSON         DEFAULT NULL COMMENT 'Array of {docType, reason, action}',
    conditional_rules     JSON         DEFAULT NULL COMMENT 'Array of {condition, requiredDoc, status}',
    expiring_documents    JSON         DEFAULT NULL COMMENT 'Array of {docType, expiryDate, daysRemaining, alertLevel}',
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    UNIQUE KEY uq_doc_lifecycle_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ────────────────────────────────────────────────────────────
-- 6. MONITORING RESULTS TABLE (actual values, not just thresholds)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_monitoring_results (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id        VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
    product_health    VARCHAR(20) DEFAULT 'HEALTHY' COMMENT 'HEALTHY, WARNING, CRITICAL',
    metrics           JSON        DEFAULT NULL COMMENT 'Array of {name, value, unit, threshold, trend}',
    breaches          JSON        DEFAULT NULL COMMENT 'Array of {metric, threshold, actual, severity, message, trend}',
    conditions_data   JSON        DEFAULT NULL COMMENT 'Array of {type, description, deadline, status, daysRemaining}',
    pir_status        VARCHAR(50) DEFAULT 'Not Scheduled',
    pir_due_date      DATE        DEFAULT NULL,
    created_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    UNIQUE KEY uq_monitoring_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ────────────────────────────────────────────────────────────
-- 7. EXTEND npa_signoffs — add missing columns
-- ────────────────────────────────────────────────────────────

ALTER TABLE npa_signoffs ADD COLUMN escalation_info JSON DEFAULT NULL COMMENT '{level, escalatedTo, reason}';

-- ────────────────────────────────────────────────────────────
-- 8. EXTEND agent_sessions — ensure project_id + stage are indexed
--    (These columns may already exist in some environments)
-- ────────────────────────────────────────────────────────────

-- Run individually, ignore ER_DUP_FIELDNAME if already present:
-- ALTER TABLE agent_sessions ADD COLUMN project_id VARCHAR(36) DEFAULT NULL;
-- ALTER TABLE agent_sessions ADD COLUMN current_stage VARCHAR(50) DEFAULT NULL;
-- ALTER TABLE agent_sessions ADD INDEX idx_session_project (project_id);
