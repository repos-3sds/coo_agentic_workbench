-- Phase 3 Schema Extensions: Governance & Workflow
-- Run this script to initialize the new tables required for the advanced governance logic.

-- 1. Intake Assessments (7-Domain Logic)
CREATE TABLE IF NOT EXISTS npa_intake_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    domain VARCHAR(50) NOT NULL COMMENT 'STRATEGIC, RISK, LEGAL, OPS, TECH, DATA, CLIENT',
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARN')),
    score INT DEFAULT 0 COMMENT '0-100 Readiness Score',
    findings JSON COMMENT 'List of gaps or issues identified',
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- 2. Classification Scorecards (20-Point Logic)
CREATE TABLE IF NOT EXISTS npa_classification_scorecards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    total_score INT NOT NULL COMMENT '0-20 Complexity Score',
    calculated_tier VARCHAR(50) NOT NULL COMMENT 'NPA_LITE, VARIATION, FULL',
    breakdown JSON NOT NULL COMMENT 'Scoring factors (e.g. { "new_market": 5 })',
    override_reason TEXT COMMENT 'If human overrides the AI classification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- 3. Workflow States (5-Gate Lifecycle)
CREATE TABLE IF NOT EXISTS npa_workflow_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(50) NOT NULL COMMENT 'INITIATION, REVIEW, LAUNCH, MONITORING, CLOSURE',
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' COMMENT 'NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    blockers JSON COMMENT 'List of blocking dependency IDs',
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- 4. Document Rules (Logic-Driven Requirements)
CREATE TABLE IF NOT EXISTS ref_document_rules (
    id VARCHAR(50) PRIMARY KEY COMMENT 'e.g., RULE_RISK_MEMO',
    doc_code VARCHAR(50) NOT NULL,
    doc_name VARCHAR(255) NOT NULL,
    condition_logic TEXT NOT NULL COMMENT 'JSON Logic or pseudo-code',
    criticality VARCHAR(20) NOT NULL DEFAULT 'CONDITIONAL',
    source_party VARCHAR(50) NOT NULL DEFAULT 'BUSINESS'
);

-- Seed Data: Sample Document Rules
INSERT INTO ref_document_rules (id, doc_code, doc_name, condition_logic, criticality, source_party) VALUES
('RULE_RISK_MEMO', 'DOC_RISK_MEMO', 'Market Risk Memo', 'npa_type == "FULL" && notional > 10000000', 'CORE', 'RISK'),
('RULE_LEGAL_OPINION', 'DOC_LEGAL_OPINION', 'External Legal Opinion', 'is_cross_border == true', 'CONDITIONAL', 'LEGAL'),
('RULE_TAX_SIGNOFF', 'DOC_TAX_SIGNOFF', 'Tax Impact Assessment', 'npa_type == "FULL" || jurisdiction in ["CN", "IN"]', 'CONDITIONAL', 'FINANCE');
