-- 03_extend_schema.sql
-- Extend MariaDB schema with missing tables and ALTER existing tables

-- ==========================================
-- 1. Users Table
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    department VARCHAR(100),
    job_title VARCHAR(255),
    location VARCHAR(100),
    role VARCHAR(50) NOT NULL COMMENT 'MAKER, CHECKER, APPROVER, COO, ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. ALTER npa_projects - Add missing columns
-- ==========================================
ALTER TABLE npa_projects
    ADD COLUMN IF NOT EXISTS product_manager VARCHAR(255) AFTER submitted_by,
    ADD COLUMN IF NOT EXISTS pm_team VARCHAR(100) AFTER product_manager,
    ADD COLUMN IF NOT EXISTS template_name VARCHAR(100) AFTER pm_team,
    ADD COLUMN IF NOT EXISTS kickoff_date DATE AFTER template_name,
    ADD COLUMN IF NOT EXISTS proposal_preparer VARCHAR(255) AFTER kickoff_date,
    ADD COLUMN IF NOT EXISTS pac_approval_status VARCHAR(50) DEFAULT 'N/A' AFTER proposal_preparer,
    ADD COLUMN IF NOT EXISTS approval_track VARCHAR(50) COMMENT 'FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN, PROHIBITED' AFTER pac_approval_status,
    ADD COLUMN IF NOT EXISTS estimated_revenue DECIMAL(18,2) AFTER approval_track,
    ADD COLUMN IF NOT EXISTS predicted_approval_likelihood DECIMAL(5,2) AFTER estimated_revenue,
    ADD COLUMN IF NOT EXISTS predicted_timeline_days DECIMAL(5,2) AFTER predicted_approval_likelihood,
    ADD COLUMN IF NOT EXISTS predicted_bottleneck VARCHAR(100) AFTER predicted_timeline_days,
    ADD COLUMN IF NOT EXISTS launched_at TIMESTAMP NULL AFTER updated_at,
    ADD COLUMN IF NOT EXISTS pir_status VARCHAR(50) DEFAULT 'NOT_REQUIRED' AFTER launched_at,
    ADD COLUMN IF NOT EXISTS pir_due_date DATE AFTER pir_status,
    ADD COLUMN IF NOT EXISTS product_category VARCHAR(100) AFTER description,
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'ACTIVE' COMMENT 'On Track, At Risk, Delayed, Blocked, Completed' AFTER current_stage;

-- ==========================================
-- 3. ALTER npa_signoffs - Add missing columns
-- ==========================================
ALTER TABLE npa_signoffs
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) AFTER party,
    ADD COLUMN IF NOT EXISTS approver_name VARCHAR(255) AFTER approver_user_id,
    ADD COLUMN IF NOT EXISTS approver_email VARCHAR(255) AFTER approver_name,
    ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP NULL AFTER decision_date,
    ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT FALSE AFTER sla_deadline,
    ADD COLUMN IF NOT EXISTS started_review_at TIMESTAMP NULL AFTER sla_breached,
    ADD COLUMN IF NOT EXISTS clarification_question TEXT AFTER comments,
    ADD COLUMN IF NOT EXISTS clarification_answer TEXT AFTER clarification_question,
    ADD COLUMN IF NOT EXISTS clarification_answered_by VARCHAR(50) COMMENT 'AI or MAKER' AFTER clarification_answer,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER loop_back_count;

-- ==========================================
-- 4. NPA Approvals (Top-level decisions)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    approval_type VARCHAR(50) NOT NULL COMMENT 'CHECKER, GFM_COO, PAC',
    approver_id VARCHAR(36),
    approver_role VARCHAR(100),
    decision VARCHAR(30) COMMENT 'APPROVE, REJECT, CONDITIONAL_APPROVE',
    decision_date TIMESTAMP NULL,
    comments TEXT,
    conditions_imposed TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. NPA Loop-Backs (Circuit Breaker tracking)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_loop_backs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    loop_back_number INT NOT NULL,
    loop_back_type VARCHAR(50) NOT NULL COMMENT 'CHECKER_REJECTION, APPROVAL_CLARIFICATION, LAUNCH_PREP_ISSUE',
    initiated_by_party VARCHAR(50) NOT NULL,
    initiator_name VARCHAR(255),
    reason TEXT NOT NULL,
    requires_npa_changes BOOLEAN DEFAULT TRUE,
    routed_to VARCHAR(30) COMMENT 'MAKER, AI, CHECKER',
    routing_reasoning TEXT,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    delay_days DECIMAL(5,2),
    resolution_type VARCHAR(50) COMMENT 'MAKER_FIXED, AI_ANSWERED, CHECKER_REVIEWED, ESCALATED',
    resolution_details TEXT,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. NPA Comments (Threaded discussion)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    comment_type VARCHAR(50) NOT NULL COMMENT 'APPROVER_QUESTION, MAKER_RESPONSE, AI_ANSWER, SYSTEM_ALERT, CHECKER_NOTE',
    comment_text TEXT NOT NULL,
    author_name VARCHAR(255),
    author_role VARCHAR(100),
    parent_comment_id BIGINT NULL,
    generated_by_ai BOOLEAN DEFAULT FALSE,
    ai_agent VARCHAR(100),
    ai_confidence DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. NPA Documents
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) COMMENT 'TERM_SHEET, CREDIT_REPORT, RISK_MEMO, LEGAL_OPINION, ISDA, TAX_ASSESSMENT',
    file_size VARCHAR(20),
    file_extension VARCHAR(10),
    category VARCHAR(100),
    validation_status VARCHAR(50) DEFAULT 'PENDING' COMMENT 'VALID, PENDING, INVALID, WARNING',
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 8. NPA Audit Log (Immutable)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100),
    action_type VARCHAR(100) NOT NULL COMMENT 'NPA_CREATED, SUBMITTED, APPROVED, REJECTED, DOCUMENT_UPLOADED, AGENT_CLASSIFIED, etc.',
    action_details TEXT,
    is_agent_action BOOLEAN DEFAULT FALSE,
    agent_name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_project (project_id),
    INDEX idx_audit_timestamp (timestamp DESC),
    INDEX idx_audit_action (action_type)
);

-- ==========================================
-- 9. NPA Breach Alerts (Post-launch monitoring)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_breach_alerts (
    id VARCHAR(20) PRIMARY KEY COMMENT 'e.g., BR-001',
    project_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL COMMENT 'CRITICAL, WARNING, INFO',
    description TEXT NOT NULL,
    threshold_value VARCHAR(100),
    actual_value VARCHAR(100),
    escalated_to VARCHAR(255),
    sla_hours INT,
    status VARCHAR(30) DEFAULT 'OPEN' COMMENT 'OPEN, ACKNOWLEDGED, RESOLVED, ESCALATED',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 10. NPA Performance Metrics (Post-launch)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_performance_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    days_since_launch INT,
    total_volume DECIMAL(18,2),
    volume_currency VARCHAR(3) DEFAULT 'USD',
    realized_pnl DECIMAL(18,2),
    active_breaches INT DEFAULT 0,
    counterparty_exposure DECIMAL(18,2),
    var_utilization DECIMAL(5,2),
    collateral_posted DECIMAL(18,2),
    next_review_date DATE,
    health_status VARCHAR(20) COMMENT 'healthy, warning, critical',
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 11. Market Clusters (COO Dashboard)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_market_clusters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cluster_name VARCHAR(100) NOT NULL,
    npa_count INT DEFAULT 0,
    growth_percent DECIMAL(5,2),
    intensity_percent DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 12. Product Opportunities / Prospects
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_prospects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(100),
    probability DECIMAL(5,2),
    estimated_value DECIMAL(18,2),
    value_currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Pre-Seed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 13. KPI Snapshots (Dashboard time-series)
-- ==========================================
CREATE TABLE IF NOT EXISTS npa_kpi_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    pipeline_value DECIMAL(18,2),
    active_npas INT,
    avg_cycle_days DECIMAL(5,2),
    approval_rate DECIMAL(5,2),
    approvals_completed INT,
    approvals_total INT,
    critical_risks INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
