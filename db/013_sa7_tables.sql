-- DCE Account Opening — SA-7 Notification Agent Tables
-- Version: 1.0.0 | Date: 2026-03-08
-- Scope: SA-7 Notification Agent (Node N-6) — FINAL pipeline node
-- Depends On:
--   SA-1 tables: dce_ao_case_state, dce_ao_node_checkpoint, dce_ao_event_log
--   Shared table: dce_ao_notification_log (already exists in 001_create_tables.sql)
--   SA-6 tables: dce_ao_config_spec, dce_ao_tmo_instruction, dce_ao_system_validation

USE dce_agent;

-- ============================================
-- Table 1: dce_ao_welcome_kit
-- Welcome Kit details generated at account go-live (N-6)
-- Contains account reference, credentials, products, contacts
-- One record per case (UNIQUE on case_id)
-- ============================================
CREATE TABLE IF NOT EXISTS dce_ao_welcome_kit (
    kit_id                      VARCHAR(30) PRIMARY KEY,           -- WKIT-XXXXXX
    case_id                     VARCHAR(20) NOT NULL,

    -- Client details (snapshot at time of kit generation)
    entity_name                 VARCHAR(200) NOT NULL,
    entity_type                 VARCHAR(20),
    jurisdiction                VARCHAR(10),

    -- Account details
    account_reference           VARCHAR(50),                       -- UBIX account ref from config_spec
    products_enabled            JSON,                              -- ["FUTURES","OPTIONS",...]
    cqg_login_details           JSON,                              -- {username, temp_password, login_url} (simulated)
    idb_access_details          JSON,                              -- {portal_url, access_level} (simulated)

    -- Credit details snapshot
    approved_dce_limit_sgd      DECIMAL(15,2),
    approved_dce_pce_limit_sgd  DECIMAL(15,2),
    confirmed_caa_approach      ENUM('IRB','SA'),

    -- Operational contacts
    client_services_contact     JSON,                              -- {name, email, phone, desk}
    rm_contact                  JSON,                              -- {name, email, phone}

    -- Conditions / restrictions (from credit decision)
    conditions                  JSON,                              -- [{type, description}]
    statement_schedule          VARCHAR(100) DEFAULT 'Daily electronic + Monthly PDF',

    -- Kit status
    status                      ENUM('GENERATED','SENT','ACKNOWLEDGED') DEFAULT 'GENERATED',

    -- Notifications sent
    customer_notified           BOOLEAN DEFAULT FALSE,
    rm_notified                 BOOLEAN DEFAULT FALSE,
    ops_notified                BOOLEAN DEFAULT FALSE,
    notification_ids            JSON,                              -- [notification_id_1, notification_id_2, ...]

    -- Agent metadata
    generated_by_model          VARCHAR(50),
    generated_at                DATETIME DEFAULT NOW(),
    sent_at                     DATETIME,

    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case (case_id),
    INDEX idx_status (status)
);
