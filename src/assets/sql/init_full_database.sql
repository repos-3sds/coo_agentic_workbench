-- NPA Master Database Schema (Unified)
-- Initial Version: 1.0 (Phase 4)

-- ==========================================
-- 1. Core Project Tables
-- ==========================================

CREATE TABLE IF NOT EXISTS npa_projects (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    npa_type VARCHAR(50) COMMENT 'New-to-Group, Variation, Existing, NPA Lite',
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    is_cross_border BOOLEAN DEFAULT FALSE,
    notional_amount DECIMAL(18,2),
    currency VARCHAR(3),
    current_stage VARCHAR(50),
    submitted_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS npa_jurisdictions (
    project_id VARCHAR(36),
    jurisdiction_code VARCHAR(10) COMMENT 'SG, HK, CN, IN, etc.',
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. Dynamic Form Definitions (Form Builder)
-- ==========================================

CREATE TABLE IF NOT EXISTS ref_npa_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    version INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ref_npa_sections (
    id VARCHAR(50) PRIMARY KEY,
    template_id VARCHAR(50),
    title VARCHAR(100),
    description TEXT,
    order_index INT,
    FOREIGN KEY (template_id) REFERENCES ref_npa_templates(id)
);

CREATE TABLE IF NOT EXISTS ref_npa_fields (
    id VARCHAR(50) PRIMARY KEY,
    section_id VARCHAR(50),
    field_key VARCHAR(100) UNIQUE,
    label VARCHAR(255),
    field_type VARCHAR(20) COMMENT 'text, decimal, select, date, upload',
    is_required BOOLEAN DEFAULT FALSE,
    tooltip TEXT,
    order_index INT,
    FOREIGN KEY (section_id) REFERENCES ref_npa_sections(id)
);

CREATE TABLE IF NOT EXISTS ref_field_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_id VARCHAR(50),
    value VARCHAR(100),
    label VARCHAR(100),
    order_index INT,
    FOREIGN KEY (field_id) REFERENCES ref_npa_fields(id)
);

-- ==========================================
-- 3. Dynamic Form Data (Values)
-- ==========================================

CREATE TABLE IF NOT EXISTS npa_form_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36),
    field_key VARCHAR(100),
    field_value TEXT,
    lineage VARCHAR(20) CHECK (lineage IN ('AUTO', 'ADAPTED', 'MANUAL')),
    confidence_score DECIMAL(5,2),
    metadata JSON,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (field_key) REFERENCES ref_npa_fields(field_key)
);

-- ==========================================
-- 4. Workflow & Approvals
-- ==========================================

CREATE TABLE IF NOT EXISTS npa_signoffs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36),
    party VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED, REWORK',
    approver_user_id VARCHAR(100),
    decision_date TIMESTAMP NULL,
    comments TEXT,
    loop_back_count INT DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS npa_post_launch_conditions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36),
    condition_text TEXT NOT NULL,
    owner_party VARCHAR(50),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. Agent Interactions & Knowledge Base
-- ==========================================

CREATE TABLE IF NOT EXISTS agent_sessions (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NULL,
    user_id VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agent_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36),
    role VARCHAR(20) CHECK (role IN ('user', 'agent')),
    agent_identity_id VARCHAR(50),
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kb_documents (
    doc_id VARCHAR(100) PRIMARY KEY,
    filename VARCHAR(255),
    doc_type VARCHAR(50),
    embedding_id VARCHAR(100),
    last_synced TIMESTAMP
);

-- ==========================================
-- 6. Phase 3 Extensions: Governance & Logic
-- ==========================================

CREATE TABLE IF NOT EXISTS npa_intake_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'FAIL', 'WARN')),
    score INT DEFAULT 0,
    findings JSON,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS npa_classification_scorecards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    total_score INT NOT NULL,
    calculated_tier VARCHAR(50) NOT NULL,
    breakdown JSON NOT NULL,
    override_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS npa_workflow_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    stage_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    blockers JSON,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ref_document_rules (
    id VARCHAR(50) PRIMARY KEY,
    doc_code VARCHAR(50) NOT NULL,
    doc_name VARCHAR(255) NOT NULL,
    condition_logic TEXT NOT NULL,
    criticality VARCHAR(20) NOT NULL DEFAULT 'CONDITIONAL',
    source_party VARCHAR(50) NOT NULL DEFAULT 'BUSINESS'
);

-- ==========================================
-- 7. Seed Data
-- ==========================================

-- Standard Document Rules
INSERT INTO ref_document_rules (id, doc_code, doc_name, condition_logic, criticality, source_party) VALUES
('RULE_RISK_MEMO', 'DOC_RISK_MEMO', 'Market Risk Memo', 'npa_type == "FULL" && notional > 10000000', 'CORE', 'RISK'),
('RULE_LEGAL_OPINION', 'DOC_LEGAL_OPINION', 'External Legal Opinion', 'is_cross_border == true', 'CONDITIONAL', 'LEGAL'),
('RULE_TAX_SIGNOFF', 'DOC_TAX_SIGNOFF', 'Tax Impact Assessment', 'npa_type == "FULL" || jurisdiction in ["CN", "IN"]', 'CONDITIONAL', 'FINANCE');

-- Standard Template
INSERT INTO ref_npa_templates (id, name, version) VALUES ('STD_NPA_V2', 'Standard NPA Template', 2);

INSERT INTO ref_npa_sections (id, template_id, title, description, order_index) VALUES 
('SEC_PROD', 'STD_NPA_V2', 'Product Overview', 'Core product definition', 1),
('SEC_RISK', 'STD_NPA_V2', 'Risk Assessment', 'Key risk factors', 2);

INSERT INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, order_index) VALUES
('FLD_PROD_NAME', 'SEC_PROD', 'product_name', 'Product Name', 'text', TRUE, 1),
('FLD_NOTIONAL', 'SEC_PROD', 'notional_amount', 'Notional Amount (USD)', 'decimal', TRUE, 2),
('FLD_RISK_TYPE', 'SEC_RISK', 'risk_classification', 'Risk Classification', 'select', TRUE, 1),
('FLD_CATEGORY', 'SEC_PROD', 'product_category', 'Product Category', 'select', TRUE, 3),
('FLD_CLIENTS', 'SEC_PROD', 'target_clients', 'Target Clients', 'text', TRUE, 4),
('FLD_LOCATION', 'SEC_PROD', 'booking_location', 'Booking Location', 'select', TRUE, 5),
('FLD_TENOR', 'SEC_PROD', 'tenor', 'Tenor', 'text', FALSE, 6);

INSERT INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_RISK_TYPE', 'LOW', 'Low Risk', 1),
('FLD_RISK_TYPE', 'MEDIUM', 'Medium Risk', 2),
('FLD_RISK_TYPE', 'HIGH', 'High Risk', 3);
