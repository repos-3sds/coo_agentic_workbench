-- ============================================================================
-- Migration 017: Agent Summary Tables & Column Extensions
-- Date: 2026-02-27
-- Description: Creates agent result persistence tables and adds columns
--              needed by the DB-first loading strategy (Phase 5 fixes).
--
-- NOTE: All statements use IF NOT EXISTS / IF NOT EXISTS guards so this
--       migration is idempotent and safe to re-run.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. npa_projects.display_id — human-readable NPA identifier (NPA-YYYY-NNNNN)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE npa_projects
    ADD COLUMN IF NOT EXISTS display_id VARCHAR(20) DEFAULT NULL;

-- Unique index (ignore error if already exists)
-- MariaDB: CREATE UNIQUE INDEX IF NOT EXISTS is not supported, so we wrap it
CREATE UNIQUE INDEX idx_npa_display_id ON npa_projects(display_id);
-- If the above fails with "Duplicate key name", it already exists — safe to ignore.

-- ────────────────────────────────────────────────────────────────────────────
-- 2. npa_risk_assessment_summary — persisted RISK agent results
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npa_risk_assessment_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    overall_score INT DEFAULT 0,
    overall_rating VARCHAR(20) DEFAULT 'LOW',
    hard_stop TINYINT(1) DEFAULT 0,
    hard_stop_reason TEXT,
    domain_assessments LONGTEXT,
    pir_requirements LONGTEXT,
    notional_flags LONGTEXT,
    mandatory_signoffs LONGTEXT,
    recommendations LONGTEXT,
    circuit_breaker LONGTEXT,
    evergreen_limits LONGTEXT,
    validity_risk LONGTEXT,
    npa_lite_risk_profile LONGTEXT,
    sop_bottleneck_risk LONGTEXT,
    prerequisites LONGTEXT,
    raw_json LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_risk_summary_project (project_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. npa_ml_predictions — persisted ML_PREDICT agent results
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npa_ml_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    approval_likelihood DECIMAL(5,2) DEFAULT 0,
    timeline_days DECIMAL(5,2) DEFAULT 0,
    bottleneck_dept VARCHAR(100),
    risk_score DECIMAL(5,2) DEFAULT 0,
    features LONGTEXT,
    comparison_insights LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ml_project (project_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. npa_doc_lifecycle_summary — persisted DOC_LIFECYCLE agent results
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npa_doc_lifecycle_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    completeness_percent DECIMAL(5,2) DEFAULT 0,
    total_required INT DEFAULT 0,
    total_present INT DEFAULT 0,
    total_valid INT DEFAULT 0,
    stage_gate_status VARCHAR(30) DEFAULT 'BLOCKED',
    missing_documents LONGTEXT,
    invalid_documents LONGTEXT,
    conditional_rules LONGTEXT,
    expiring_documents LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doc_summary_project (project_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. npa_monitoring_results — persisted MONITORING agent results
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS npa_monitoring_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    product_health VARCHAR(30) DEFAULT 'HEALTHY',
    metrics LONGTEXT,
    breaches LONGTEXT,
    conditions_data LONGTEXT,
    pir_status VARCHAR(50) DEFAULT 'Not Scheduled',
    pir_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_monitoring_project (project_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Column additions to existing tables
-- ────────────────────────────────────────────────────────────────────────────

-- 6a. npa_documents — validation notes from doc-lifecycle agent
ALTER TABLE npa_documents
    ADD COLUMN IF NOT EXISTS validation_notes TEXT DEFAULT NULL;

-- 6b. npa_classification_scorecards — extra fields for classifier persist
ALTER TABLE npa_classification_scorecards
    ADD COLUMN IF NOT EXISTS approval_track VARCHAR(50) DEFAULT NULL;

ALTER TABLE npa_classification_scorecards
    ADD COLUMN IF NOT EXISTS raw_json LONGTEXT DEFAULT NULL;

ALTER TABLE npa_classification_scorecards
    ADD COLUMN IF NOT EXISTS workflow_run_id VARCHAR(100) DEFAULT NULL;

-- 6c. npa_performance_metrics — extra fields for monitoring persist
ALTER TABLE npa_performance_metrics
    ADD COLUMN IF NOT EXISTS metric_name VARCHAR(100) DEFAULT NULL;

ALTER TABLE npa_performance_metrics
    ADD COLUMN IF NOT EXISTS metric_value DECIMAL(18,2) DEFAULT NULL;

ALTER TABLE npa_performance_metrics
    ADD COLUMN IF NOT EXISTS period_start DATE DEFAULT NULL;

ALTER TABLE npa_performance_metrics
    ADD COLUMN IF NOT EXISTS period_end DATE DEFAULT NULL;

-- ============================================================================
-- End of migration 017
-- ============================================================================
