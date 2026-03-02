-- DCE Account Opening — Database Table Schemas
-- Version: 1.0.0 | Date: 2026-03-02
-- Scope: SA-1 Intake & Triage Agent (Node N-0) + Shared Orchestrator Tables

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_case_state (master table)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_case_state (
    case_id             VARCHAR(20) PRIMARY KEY,
    status              ENUM('ACTIVE','HITL_PENDING','ESCALATED','DONE','DEAD'),
    current_node        VARCHAR(10),
    completed_nodes     JSON,
    failed_nodes        JSON,
    retry_counts        JSON,
    case_type           VARCHAR(30),
    priority            ENUM('URGENT','STANDARD','DEFERRED'),
    rm_id               VARCHAR(20),
    client_name         VARCHAR(200),
    jurisdiction        VARCHAR(5),
    sla_deadline        DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    updated_at          DATETIME ON UPDATE NOW(),
    hitl_queue          JSON,
    event_count         INT DEFAULT 0
);

-- ============================================
-- Table 2: dce_ao_node_checkpoint
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_node_checkpoint (
    checkpoint_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    node_id             VARCHAR(10) NOT NULL,
    attempt_number      INT NOT NULL DEFAULT 1,
    status              ENUM('IN_PROGRESS','COMPLETE','FAILED','ESCALATED','HITL_PENDING'),
    input_snapshot      JSON,
    output_json         JSON,
    context_block_hash  VARCHAR(64),
    started_at          DATETIME,
    completed_at        DATETIME,
    duration_seconds    DECIMAL(10,3),
    next_node           VARCHAR(30),
    failure_reason      TEXT,
    retry_count         INT DEFAULT 0,
    agent_model         VARCHAR(50),
    token_usage         JSON,
    UNIQUE KEY (case_id, node_id, attempt_number),
    INDEX idx_case_node (case_id, node_id),
    INDEX idx_status (status),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id)
);

-- ============================================
-- Table 3: dce_ao_event_log
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_event_log (
    event_id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    event_type          VARCHAR(50) NOT NULL,
    from_state          VARCHAR(30),
    to_state            VARCHAR(30),
    event_payload       JSON,
    triggered_by        VARCHAR(50),
    triggered_at        DATETIME DEFAULT NOW(),
    kafka_offset        BIGINT,
    INDEX idx_case_events (case_id, triggered_at),
    INDEX idx_event_type (event_type)
);

-- ============================================
-- Table 4: dce_ao_submission_raw
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_submission_raw (
    submission_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20),
    submission_source   ENUM('EMAIL','PORTAL','API') NOT NULL,
    email_message_id    VARCHAR(200),
    sender_email        VARCHAR(200),
    email_subject       VARCHAR(500),
    email_body_text     MEDIUMTEXT,
    portal_form_id      VARCHAR(50),
    portal_form_data    JSON,
    rm_employee_id      VARCHAR(20),
    received_at         DATETIME NOT NULL,
    processed_at        DATETIME,
    processing_status   ENUM('RECEIVED','PROCESSING','PROCESSED','FAILED') DEFAULT 'RECEIVED',
    failure_reason      TEXT,
    raw_payload_hash    VARCHAR(64),
    attachments_count   INT DEFAULT 0,
    created_at          DATETIME DEFAULT NOW(),
    INDEX idx_case (case_id),
    INDEX idx_source (submission_source),
    INDEX idx_status (processing_status),
    INDEX idx_received (received_at),
    UNIQUE KEY idx_dedup (raw_payload_hash)
);

-- ============================================
-- Table 5: dce_ao_classification_result
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_classification_result (
    classification_id   BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    submission_id       BIGINT NOT NULL,
    account_type        ENUM(
                            'INSTITUTIONAL_FUTURES',
                            'RETAIL_FUTURES',
                            'OTC_DERIVATIVES',
                            'COMMODITIES_PHYSICAL',
                            'MULTI_PRODUCT'
                        ) NOT NULL,
    account_type_confidence DECIMAL(4,3) NOT NULL,
    account_type_reasoning  TEXT,
    client_name         VARCHAR(200) NOT NULL,
    client_entity_type  ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    jurisdiction        ENUM('SGP','HKG','CHN','OTHER') NOT NULL,
    products_requested  JSON,
    priority            ENUM('URGENT','STANDARD','DEFERRED') NOT NULL,
    priority_reason     TEXT,
    sla_deadline        DATETIME NOT NULL,
    classifier_model    VARCHAR(50),
    priority_model      VARCHAR(50),
    kb_chunks_used      JSON,
    classified_at       DATETIME DEFAULT NOW(),
    flagged_for_review  BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (submission_id) REFERENCES dce_ao_submission_raw(submission_id),
    INDEX idx_case (case_id),
    INDEX idx_type (account_type),
    INDEX idx_priority (priority),
    INDEX idx_flagged (flagged_for_review)
);

-- ============================================
-- Table 6: dce_ao_document_staged
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_document_staged (
    doc_id              VARCHAR(30) PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    submission_id       BIGINT NOT NULL,
    filename            VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    file_size_bytes     BIGINT,
    storage_url         VARCHAR(1000) NOT NULL,
    storage_bucket      VARCHAR(100) DEFAULT 'ao-documents',
    source              ENUM('EMAIL_ATTACHMENT','PORTAL_UPLOAD','API_UPLOAD') NOT NULL,
    upload_status       ENUM('PENDING','UPLOADED','FAILED') DEFAULT 'PENDING',
    upload_failure_reason TEXT,
    checksum_sha256     VARCHAR(64),
    uploaded_at         DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (submission_id) REFERENCES dce_ao_submission_raw(submission_id),
    INDEX idx_case (case_id),
    INDEX idx_status (upload_status)
);

-- ============================================
-- Table 7: dce_ao_rm_hierarchy
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_rm_hierarchy (
    assignment_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    rm_id               VARCHAR(20) NOT NULL,
    rm_name             VARCHAR(200) NOT NULL,
    rm_email            VARCHAR(200) NOT NULL,
    rm_branch           VARCHAR(100),
    rm_desk             VARCHAR(100),
    rm_manager_id       VARCHAR(20) NOT NULL,
    rm_manager_name     VARCHAR(200) NOT NULL,
    rm_manager_email    VARCHAR(200) NOT NULL,
    resolution_source   ENUM('HR_SYSTEM','MANUAL','PORTAL_PROVIDED') NOT NULL,
    resolved_at         DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_rm (case_id, rm_id),
    INDEX idx_rm (rm_id),
    INDEX idx_manager (rm_manager_id)
);

-- ============================================
-- Table 8: dce_ao_notification_log
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_notification_log (
    notification_id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    node_id             VARCHAR(10) NOT NULL,
    notification_type   VARCHAR(50) NOT NULL,
    channel             ENUM('EMAIL','SMS','IN_APP_TOAST','WORKBENCH_BADGE','KAFKA_EVENT') NOT NULL,
    recipient_id        VARCHAR(20),
    recipient_email     VARCHAR(200),
    recipient_role      VARCHAR(50),
    subject             VARCHAR(500),
    body_summary        TEXT,
    template_id         VARCHAR(50),
    delivery_status     ENUM('QUEUED','SENT','DELIVERED','FAILED','BOUNCED') DEFAULT 'QUEUED',
    failure_reason      TEXT,
    retry_count         INT DEFAULT 0,
    sent_at             DATETIME,
    delivered_at        DATETIME,
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id),
    INDEX idx_type (notification_type),
    INDEX idx_status (delivery_status),
    INDEX idx_recipient (recipient_id)
);
