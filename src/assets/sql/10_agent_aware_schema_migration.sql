-- ============================================================
-- AGENT-AWARE SCHEMA MIGRATION v2.0
-- Supports 13-agent architecture + Golden Source requirements
-- + Full NPA Filled Template (TSG2026 Digital Currency)
-- ============================================================
-- Run: docker exec -i npa_mariadb mysql -unpa_user -pnpa_password npa_workbench < src/assets/sql/10_agent_aware_schema_migration.sql

-- ────────────────────────────────────────────────────────────
-- 1. CLASSIFICATION AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_classification_criteria (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category        VARCHAR(50)  NOT NULL COMMENT 'PRODUCT_INNOVATION, MARKET_CUSTOMER, RISK_REGULATORY, FINANCIAL_OPERATIONAL',
    criterion_code  VARCHAR(20)  NOT NULL UNIQUE,
    criterion_name  VARCHAR(255) NOT NULL,
    description     TEXT,
    indicator_type  VARCHAR(20)  NOT NULL DEFAULT 'NTG' COMMENT 'NTG, VARIATION, EXISTING',
    weight          INT          NOT NULL DEFAULT 1,
    threshold_value INT          DEFAULT NULL COMMENT 'Score threshold that triggers this criterion',
    is_active       TINYINT(1)   DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS npa_classification_assessments (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36)  NOT NULL,
    criteria_id     INT          NOT NULL,
    score           INT          NOT NULL DEFAULT 0 COMMENT '0=Not Met, 1=Partially Met, 2=Fully Met',
    evidence        TEXT         DEFAULT NULL,
    assessed_by     VARCHAR(50)  DEFAULT 'CLASSIFICATION_AGENT',
    confidence      DECIMAL(5,2) DEFAULT NULL,
    assessed_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id)  REFERENCES npa_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_id) REFERENCES ref_classification_criteria(id),
    INDEX idx_class_assess_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 2. PREREQUISITE AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_prerequisite_categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_code   VARCHAR(30)  NOT NULL UNIQUE,
    category_name   VARCHAR(100) NOT NULL,
    weight          INT          NOT NULL DEFAULT 10 COMMENT 'Weight in readiness scorecard (total=100)',
    description     TEXT,
    order_index     INT          DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ref_prerequisite_checks (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT          NOT NULL,
    check_code      VARCHAR(50)  NOT NULL UNIQUE,
    check_name      VARCHAR(255) NOT NULL,
    description     TEXT,
    mandatory_for   VARCHAR(100) DEFAULT 'ALL' COMMENT 'ALL, FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN',
    is_critical     TINYINT(1)   DEFAULT 0,
    order_index     INT          DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES ref_prerequisite_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS npa_prerequisite_results (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36) NOT NULL,
    check_id        INT         NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, PASS, FAIL, WAIVED, N/A',
    evidence        TEXT,
    validated_by    VARCHAR(255),
    validated_at    TIMESTAMP   NULL DEFAULT NULL,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (check_id)   REFERENCES ref_prerequisite_checks(id),
    INDEX idx_prereq_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 3. GOVERNANCE / APPROVAL AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_signoff_routing_rules (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    approval_track  VARCHAR(30)  NOT NULL COMMENT 'FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN',
    party_group     VARCHAR(50)  NOT NULL COMMENT 'RISK_MGMT, TECH_OPS, LEGAL_COMPLIANCE, FINANCE, INFO_SECURITY',
    party_name      VARCHAR(100) NOT NULL,
    is_mandatory    TINYINT(1)   DEFAULT 1,
    sla_hours       INT          NOT NULL DEFAULT 48,
    can_parallel    TINYINT(1)   DEFAULT 1,
    sequence_order  INT          DEFAULT 0,
    trigger_condition TEXT       DEFAULT NULL COMMENT 'JSON: conditions that require this signoff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ref_escalation_rules (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    escalation_level INT         NOT NULL COMMENT '1=Dept Head, 2=BU Head, 3=GPH, 4=Group COO, 5=CEO',
    authority_name  VARCHAR(100) NOT NULL,
    trigger_type    VARCHAR(50)  NOT NULL COMMENT 'SLA_BREACH, LOOP_BACK_LIMIT, DISAGREEMENT, RISK_THRESHOLD',
    trigger_threshold VARCHAR(50) NOT NULL COMMENT 'e.g. 3 for loop-back count, 48 for hours',
    action_required TEXT         NOT NULL,
    auto_escalate   TINYINT(1)  DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS npa_escalations (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36)  NOT NULL,
    escalation_level INT         NOT NULL,
    trigger_type    VARCHAR(50)  NOT NULL,
    trigger_detail  TEXT,
    escalated_to    VARCHAR(255) NOT NULL,
    escalated_by    VARCHAR(255) DEFAULT 'GOVERNANCE_AGENT',
    status          VARCHAR(30)  DEFAULT 'ACTIVE' COMMENT 'ACTIVE, RESOLVED, OVERRIDDEN',
    resolution      TEXT,
    escalated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    resolved_at     TIMESTAMP    NULL DEFAULT NULL,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    INDEX idx_esc_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 4. RISK AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_prohibited_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    layer           VARCHAR(30)  NOT NULL COMMENT 'INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC',
    item_code       VARCHAR(50)  NOT NULL UNIQUE,
    item_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    jurisdictions   VARCHAR(255) DEFAULT 'ALL',
    severity        VARCHAR(20)  DEFAULT 'HARD_STOP' COMMENT 'HARD_STOP, CONDITIONAL, WARNING',
    effective_from  DATE         NOT NULL,
    effective_to    DATE         DEFAULT NULL,
    last_synced     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS npa_risk_checks (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36)  NOT NULL,
    check_layer     VARCHAR(30)  NOT NULL,
    result          VARCHAR(20)  NOT NULL COMMENT 'PASS, FAIL, WARNING',
    matched_items   JSON         DEFAULT NULL COMMENT 'Array of matched prohibited item IDs',
    checked_by      VARCHAR(50)  DEFAULT 'RISK_AGENT',
    checked_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    INDEX idx_risk_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 5. DOCUMENT LIFECYCLE AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ref_document_requirements (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    doc_code        VARCHAR(50)  NOT NULL UNIQUE,
    doc_name        VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(30)  NOT NULL COMMENT 'CORE, CONDITIONAL, SUPPLEMENTARY',
    criticality     VARCHAR(20)  NOT NULL COMMENT 'CRITICAL, IMPORTANT, OPTIONAL',
    required_for    VARCHAR(100) DEFAULT 'ALL' COMMENT 'ALL, FULL_NPA, NPA_LITE, BUNDLING',
    source          VARCHAR(30)  DEFAULT 'BUSINESS' COMMENT 'BUSINESS, AUTO_GENERATED, EXTERNAL, REGULATORY',
    template_available TINYINT(1) DEFAULT 0,
    required_by_stage VARCHAR(50) DEFAULT NULL COMMENT 'CHECKER, SIGN_OFF, LAUNCH, PIR',
    order_index     INT          DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 6. AGENT ORCHESTRATION TABLES (Master + Domain Orchestrator)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_agent_routing_decisions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id      VARCHAR(36)  DEFAULT NULL,
    project_id      VARCHAR(36)  DEFAULT NULL,
    source_agent    VARCHAR(50)  NOT NULL COMMENT 'Agent that made the routing decision',
    target_agent    VARCHAR(50)  NOT NULL COMMENT 'Agent being routed to',
    routing_reason  TEXT,
    confidence      DECIMAL(5,2) DEFAULT NULL,
    context_payload JSON         DEFAULT NULL COMMENT 'Preserved context passed to target',
    decided_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES agent_sessions(id) ON DELETE SET NULL,
    INDEX idx_route_session (session_id),
    INDEX idx_route_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 7. MONITORING AGENT TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_monitoring_thresholds (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36)  NOT NULL,
    metric_name     VARCHAR(100) NOT NULL COMMENT 'trading_volume, pnl, var_utilization, counterparty_exposure',
    warning_value   DECIMAL(18,2) NOT NULL,
    critical_value  DECIMAL(18,2) NOT NULL,
    comparison      VARCHAR(10)  NOT NULL DEFAULT 'GT' COMMENT 'GT, LT, EQ',
    is_active       TINYINT(1)   DEFAULT 1,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 8. FILLED TEMPLATE SUPPORT - Extended Sections & Fields
--    Maps Part A-VII + Appendix 1-5 from Filled Template
-- ────────────────────────────────────────────────────────────

-- Add new sections matching the filled template structure
INSERT IGNORE INTO ref_npa_templates (id, name, version, is_active)
VALUES ('FULL_NPA_V1', 'Full NPA Template', 1, 1);

INSERT IGNORE INTO ref_npa_sections (id, template_id, title, description, order_index) VALUES
('SEC_BASIC',   'FULL_NPA_V1', 'Part A: Basic Product Information',   'Product name, PM, BU, PAC approval, approving authority', 0),
('SEC_SIGNOFF', 'FULL_NPA_V1', 'Part B: Sign-off Parties',            'Required sign-off groups and parties', 1),
('SEC_CUST',    'FULL_NPA_V1', 'Target Customers',                    'Target segments, regulatory restrictions, customer profile', 3),
('SEC_COMM',    'FULL_NPA_V1', 'Commercialization',                   'Channel availability, suitability, marketing', 4),
('SEC_BCP',     'FULL_NPA_V1', 'Business Continuity',                 'BIA, BCP, RTO/RPO, alternative delivery', 11),
('SEC_FINCRIME','FULL_NPA_V1', 'Appendix 3: Financial Crime',         'AML, sanctions, fraud, bribery/corruption', 12),
('SEC_RISKDATA','FULL_NPA_V1', 'Appendix 4: Risk Data Aggregation',   'Data aggregation, reporting, stress testing', 13),
('SEC_TRADING', 'FULL_NPA_V1', 'Appendix 5: Trading Products',        'Collateral, valuation, funding, lifecycle', 14);

-- Add new fields from Filled Template that don't exist yet
-- Part A: Basic Product Information
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, order_index) VALUES
('FLD_PM_NAME',     'SEC_BASIC', 'product_manager_name',  'Product Manager Name & Team',  'text',   1, 1),
('FLD_GPH',         'SEC_BASIC', 'group_product_head',    'Group Product Head',           'text',   1, 2),
('FLD_PREPARER',    'SEC_BASIC', 'proposal_preparer',     'Proposal Preparer/Lead',       'text',   1, 3),
('FLD_BIZ_CASE',    'SEC_BASIC', 'business_case_status',  'Business Case Approved?',      'select', 1, 4),
('FLD_NPA_PROCESS', 'SEC_BASIC', 'npa_process_type',      'NPA/NPA Lite Process?',        'select', 1, 5),
('FLD_PAC_DATE',    'SEC_BASIC', 'pac_approval_date',     'PAC Approval Date',            'date',   0, 6),
('FLD_KICKOFF',     'SEC_BASIC', 'kickoff_date',          'NPA Kick-off Meeting Date',    'date',   1, 7),
('FLD_MTJ',         'SEC_BASIC', 'mtj_journey',           'MtJ Journey(s) Impacted',      'text',   0, 8),
('FLD_AUTH',        'SEC_BASIC', 'approving_authority',    'Approving Authority',          'text',   1, 9),
-- Part C.I: Product Specifications extras
('FLD_PROD_ROLE',   'SEC_PROD',  'product_role',          'Role of PU (Manufacturer/Distributor/Agent)', 'select', 0, 20),
('FLD_FUNDING',     'SEC_PROD',  'funding_type',          'Funding Type',                 'select', 0, 21),
('FLD_MATURITY',    'SEC_PROD',  'product_maturity',      'Product Maturity/Tenor',       'text',   0, 22),
('FLD_LIFECYCLE',   'SEC_PROD',  'product_lifecycle',     'Product Life Cycle',           'text',   0, 23),
('FLD_REVENUE_Y1',  'SEC_PROD',  'revenue_year1',         'Year 1 Revenue Estimate',      'decimal',0, 24),
('FLD_REVENUE_Y2',  'SEC_PROD',  'revenue_year2',         'Year 2 Revenue Estimate',      'decimal',0, 25),
('FLD_REVENUE_Y3',  'SEC_PROD',  'revenue_year3',         'Year 3 Revenue Estimate',      'decimal',0, 26),
('FLD_ROI_TARGET',  'SEC_PROD',  'target_roi',            'Target ROI',                   'text',   0, 27),
('FLD_SPV',         'SEC_PROD',  'spv_details',           'Special Purpose Vehicle',      'text',   0, 28),
-- Target Customer section
('FLD_CUST_SEG',    'SEC_CUST',  'customer_segments',     'Target Customer Segments',     'text',   1, 1),
('FLD_CUST_REG',    'SEC_CUST',  'customer_restrictions', 'Regulatory Restrictions',      'text',   0, 2),
('FLD_CUST_PROFILE','SEC_CUST',  'customer_profile',      'Target Customer Profile',      'text',   0, 3),
('FLD_CUST_GEO',    'SEC_CUST',  'geographic_scope',      'Geographic Focus',             'text',   0, 4),
-- Commercialization
('FLD_CHANNELS',    'SEC_COMM',  'distribution_channels', 'Channel Availability',         'text',   1, 1),
('FLD_SUITABILITY', 'SEC_COMM',  'sales_suitability',     'Sales Suitability Process',    'text',   0, 2),
('FLD_MARKETING',   'SEC_COMM',  'marketing_plan',        'Marketing & Communication',    'text',   0, 3),
-- Operational extras
('FLD_FRONT_OFF',   'SEC_OPS',   'front_office_model',    'Front Office Operating Model', 'text',   0, 20),
('FLD_MID_OFF',     'SEC_OPS',   'middle_office_model',   'Middle Office Model',          'text',   0, 21),
('FLD_BACK_OFF',    'SEC_OPS',   'back_office_model',     'Back Office Model',            'text',   0, 22),
('FLD_BOOK_LEGAL',  'SEC_OPS',   'booking_legal_form',    'Booking Legal Form (ISDA/GMRA/etc)', 'select', 0, 23),
('FLD_BOOK_FAMILY', 'SEC_OPS',   'booking_family',        'Booking Family (IRD/FXD/CRY)', 'text',   0, 24),
('FLD_BOOK_TYPE',   'SEC_OPS',   'booking_typology',      'Booking Typology/Contract',    'text',   0, 25),
('FLD_PORTFOLIO',   'SEC_OPS',   'portfolio_allocation',  'Portfolio Allocation',         'text',   0, 26),
('FLD_RTO',         'SEC_BCP',   'rto_hours',             'Recovery Time Objective (hrs)', 'decimal',0, 1),
('FLD_RPO',         'SEC_BCP',   'rpo_minutes',           'Recovery Point Objective (min)','decimal',0, 2),
('FLD_BIA',         'SEC_BCP',   'bia_completed',         'BIA Completed?',               'select', 0, 3),
('FLD_DR_FREQ',     'SEC_BCP',   'dr_test_frequency',     'DR Testing Frequency',         'text',   0, 4),
-- Info Security (extend existing SEC_OPS)
('FLD_HSM',         'SEC_OPS',   'hsm_required',          'HSM Key Management Required?', 'select', 0, 30),
('FLD_PENTEST',     'SEC_OPS',   'pentest_status',        'Penetration Testing Status',   'select', 0, 31),
('FLD_ISS_DEVIATE', 'SEC_OPS',   'iss_deviations',        'ISS Policy Deviations',        'text',   0, 32),
-- Pricing extras
('FLD_MODEL_NAME',  'SEC_PRICE', 'pricing_model_name',    'Model Name & Version',         'text',   0, 10),
('FLD_MODEL_DATE',  'SEC_PRICE', 'model_validation_date', 'Model Validation Date',        'date',   0, 11),
('FLD_SIMM',        'SEC_PRICE', 'simm_treatment',        'SIMM Treatment',               'text',   0, 12),
-- Risk Assessment extras from filled template
('FLD_RISK_MKT_VaR','SEC_RISK',  'var_capture',           'VaR Capture Method',           'text',   0, 10),
('FLD_RISK_STRESS', 'SEC_RISK',  'stress_scenarios',      'Stress Testing Scenarios',     'text',   0, 11),
('FLD_RISK_CAP',    'SEC_RISK',  'regulatory_capital',    'Regulatory Capital Treatment',  'text',   0, 12),
('FLD_RISK_CPTY',   'SEC_RISK',  'counterparty_default',  'Counterparty Default Risk',    'text',   0, 13),
('FLD_RISK_CUSTODY','SEC_RISK',  'custody_risk',          'Custody Risk',                 'text',   0, 14),
('FLD_RISK_ESG',    'SEC_RISK',  'esg_assessment',        'ESG Risk Assessment',          'text',   0, 15),
-- Data Management extras
('FLD_PURE_ID',     'SEC_DATA',  'pure_assessment_id',    'PURE Assessment ID',           'text',   0, 10),
('FLD_GDPR',        'SEC_DATA',  'gdpr_compliance',       'GDPR Compliance Required?',    'select', 0, 11),
('FLD_DATA_OWNER',  'SEC_DATA',  'data_ownership',        'Data Ownership Defined?',      'select', 0, 12),
-- Financial Crime (Appendix 3)
('FLD_AML',         'SEC_FINCRIME','aml_assessment',       'AML Assessment',               'text',   1, 1),
('FLD_TERRORISM',   'SEC_FINCRIME','terrorism_financing',   'Terrorism Financing Check',    'text',   1, 2),
('FLD_SANCTIONS_FC','SEC_FINCRIME','sanctions_assessment',  'Sanctions Assessment',         'text',   1, 3),
('FLD_FRAUD',       'SEC_FINCRIME','fraud_risk',            'Fraud Risk Assessment',        'text',   1, 4),
('FLD_BRIBERY',     'SEC_FINCRIME','bribery_corruption',    'Bribery & Corruption Risk',    'text',   1, 5),
-- Trading Products (Appendix 5)
('FLD_COLLATERAL',  'SEC_TRADING','collateral_types',      'Collateral Types',             'text',   0, 1),
('FLD_VAL_METHOD',  'SEC_TRADING','valuation_method',      'Valuation Methodology',        'text',   0, 2),
('FLD_FUNDING_SRC', 'SEC_TRADING','funding_source',        'Funding Source',               'text',   0, 3),
('FLD_HEDGE_PURPOSE','SEC_TRADING','hedging_purpose',      'Hedging Purpose',              'text',   0, 4),
('FLD_BOOK_SCHEMA', 'SEC_TRADING','booking_schema',        'Booking Schema',               'text',   0, 5);

-- Add ref_field_options for new select fields
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_BIZ_CASE',   'YES',       'Yes - Approved',     1),
('FLD_BIZ_CASE',   'NO',        'No - Pending',       2),
('FLD_NPA_PROCESS', 'FULL_NPA', 'Full NPA',           1),
('FLD_NPA_PROCESS', 'NPA_LITE', 'NPA Lite',           2),
('FLD_NPA_PROCESS', 'BUNDLING', 'Bundling',           3),
('FLD_NPA_PROCESS', 'EVERGREEN','Evergreen',          4),
('FLD_PROD_ROLE',   'PRINCIPAL',   'Principal',       1),
('FLD_PROD_ROLE',   'MANUFACTURER','Manufacturer',    2),
('FLD_PROD_ROLE',   'DISTRIBUTOR', 'Distributor',     3),
('FLD_PROD_ROLE',   'AGENT',       'Agent',           4),
('FLD_FUNDING',     'FUNDED',      'Funded',          1),
('FLD_FUNDING',     'UNFUNDED',    'Unfunded',        2),
('FLD_FUNDING',     'HYBRID',      'Hybrid',          3),
('FLD_BOOK_LEGAL',  'ISDA',   'ISDA Master Agreement',  1),
('FLD_BOOK_LEGAL',  'GMRA',   'GMRA',                   2),
('FLD_BOOK_LEGAL',  'GMSLA',  'GMSLA',                  3),
('FLD_BOOK_LEGAL',  'NAFMII', 'NAFMII',                 4),
('FLD_BOOK_LEGAL',  'CUSTOM', 'Custom Agreement',        5),
('FLD_BIA',         'YES', 'Yes - Completed',  1),
('FLD_BIA',         'NO',  'No - Pending',     2),
('FLD_HSM',         'YES', 'Yes',  1),
('FLD_HSM',         'NO',  'No',   2),
('FLD_PENTEST',     'COMPLETED', 'Completed',      1),
('FLD_PENTEST',     'SCHEDULED', 'Scheduled',      2),
('FLD_PENTEST',     'NOT_DONE',  'Not Yet Done',   3),
('FLD_GDPR',        'YES', 'Yes',  1),
('FLD_GDPR',        'NO',  'No',   2),
('FLD_DATA_OWNER',  'YES', 'Yes',  1),
('FLD_DATA_OWNER',  'NO',  'No',   2);

-- ────────────────────────────────────────────────────────────
-- 9. EXTERNAL PARTIES TABLE (from Filled Template Section C.I.5)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_external_parties (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id      VARCHAR(36)  NOT NULL,
    party_name      VARCHAR(255) NOT NULL,
    party_role      TEXT,
    risk_profile_id VARCHAR(50)  DEFAULT NULL,
    vendor_tier     VARCHAR(20)  DEFAULT NULL COMMENT 'TIER_1_CRITICAL, TIER_2, TIER_3',
    grc_id          VARCHAR(50)  DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 10. MARKET RISK FACTORS TABLE (from Filled Template IV.B)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS npa_market_risk_factors (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id          VARCHAR(36)  NOT NULL,
    risk_factor         VARCHAR(50)  NOT NULL COMMENT 'IR_DELTA, IR_VEGA, FX_DELTA, FX_VEGA, EQ_DELTA, CREDIT_SPREAD, CRYPTO_DELTA, etc.',
    is_applicable       TINYINT(1)   DEFAULT 0,
    sensitivity_report  TINYINT(1)   DEFAULT 0,
    var_capture         TINYINT(1)   DEFAULT 0,
    stress_capture      TINYINT(1)   DEFAULT 0,
    notes               TEXT,
    FOREIGN KEY (project_id) REFERENCES npa_projects(id) ON DELETE CASCADE,
    INDEX idx_mrf_proj (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 11. ALTER EXISTING TABLES for agent enrichment
-- ────────────────────────────────────────────────────────────

-- Enrich agent_sessions with agent identity and handoff tracking
ALTER TABLE agent_sessions
    ADD COLUMN IF NOT EXISTS agent_identity VARCHAR(50) DEFAULT NULL COMMENT 'Which agent owns this session',
    ADD COLUMN IF NOT EXISTS current_stage  VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS handoff_from   VARCHAR(50) DEFAULT NULL COMMENT 'Agent that handed off to this one',
    ADD COLUMN IF NOT EXISTS ended_at       TIMESTAMP   NULL DEFAULT NULL;

-- Enrich agent_messages with confidence and reasoning for audit compliance
ALTER TABLE agent_messages
    ADD COLUMN IF NOT EXISTS agent_confidence  DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS reasoning_chain   TEXT         DEFAULT NULL COMMENT 'Why the agent made this decision',
    ADD COLUMN IF NOT EXISTS citations         JSON         DEFAULT NULL COMMENT 'Source documents/NPAs referenced';

-- Enrich npa_documents with version tracking and criticality
ALTER TABLE npa_documents
    ADD COLUMN IF NOT EXISTS version           INT          DEFAULT 1,
    ADD COLUMN IF NOT EXISTS validation_stage  VARCHAR(50)  DEFAULT NULL COMMENT 'AUTOMATED, BUSINESS, RISK, COMPLIANCE, LEGAL, FINAL',
    ADD COLUMN IF NOT EXISTS criticality       VARCHAR(20)  DEFAULT NULL COMMENT 'CRITICAL, IMPORTANT, OPTIONAL',
    ADD COLUMN IF NOT EXISTS required_by_stage VARCHAR(50)  DEFAULT NULL COMMENT 'CHECKER, SIGN_OFF, LAUNCH',
    ADD COLUMN IF NOT EXISTS doc_requirement_id INT         DEFAULT NULL COMMENT 'FK to ref_document_requirements';

-- Enrich npa_audit_log for compliance-grade audit trail
ALTER TABLE npa_audit_log
    ADD COLUMN IF NOT EXISTS confidence_score  DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS reasoning         TEXT         DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS model_version     VARCHAR(50)  DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS source_citations  JSON         DEFAULT NULL;

-- Add classification confidence to npa_projects
ALTER TABLE npa_projects
    ADD COLUMN IF NOT EXISTS classification_confidence DECIMAL(5,2) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS classification_method     VARCHAR(30)  DEFAULT NULL COMMENT 'AGENT, MANUAL, OVERRIDE';

-- ────────────────────────────────────────────────────────────
-- 12. SEED: 20 NTG Classification Criteria (from Golden Source)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_classification_criteria (category, criterion_code, criterion_name, description, indicator_type, weight) VALUES
-- Product Innovation (5 criteria)
('PRODUCT_INNOVATION', 'NTG_PI_01', 'Entirely new product category',           'Product has no existing equivalent in MBS portfolio', 'NTG', 2),
('PRODUCT_INNOVATION', 'NTG_PI_02', 'Novel risk profile',                      'Risk characteristics fundamentally different from existing products', 'NTG', 2),
('PRODUCT_INNOVATION', 'NTG_PI_03', 'New underlying asset class',              'Underlying asset not previously traded or held by MBS', 'NTG', 2),
('PRODUCT_INNOVATION', 'NTG_PI_04', 'New pricing/valuation methodology',       'Requires new models or valuation approaches', 'NTG', 1),
('PRODUCT_INNOVATION', 'NTG_PI_05', 'New technology platform required',        'Cannot be supported by existing systems', 'NTG', 1),
-- Market & Customer (5 criteria)
('MARKET_CUSTOMER',    'NTG_MC_01', 'New customer segment',                    'Targeting customer segments not previously served', 'NTG', 2),
('MARKET_CUSTOMER',    'NTG_MC_02', 'New market/geography',                    'Entering market where MBS has no existing presence', 'NTG', 2),
('MARKET_CUSTOMER',    'NTG_MC_03', 'New distribution channel',                'Requires fundamentally new distribution infrastructure', 'NTG', 1),
('MARKET_CUSTOMER',    'NTG_MC_04', 'New regulatory framework',                'Subject to regulations MBS has not previously navigated', 'NTG', 2),
('MARKET_CUSTOMER',    'NTG_MC_05', 'New competitive landscape',               'Operating in market with entirely different competitive dynamics', 'NTG', 1),
-- Risk & Regulatory (5 criteria)
('RISK_REGULATORY',    'NTG_RR_01', 'New regulatory license required',         'Requires new licensing or regulatory approval', 'NTG', 2),
('RISK_REGULATORY',    'NTG_RR_02', 'New risk management framework',           'Existing risk frameworks insufficient', 'NTG', 2),
('RISK_REGULATORY',    'NTG_RR_03', 'New compliance program needed',           'Requires dedicated compliance monitoring program', 'NTG', 1),
('RISK_REGULATORY',    'NTG_RR_04', 'Cross-border regulatory complexity',      'Multi-jurisdictional regulatory navigation required', 'NTG', 2),
('RISK_REGULATORY',    'NTG_RR_05', 'Enhanced AML/KYC requirements',           'Standard AML/KYC insufficient for product', 'NTG', 1),
-- Financial & Operational (5 criteria)
('FINANCIAL_OPERATIONAL','NTG_FO_01','New booking infrastructure',              'Existing booking systems cannot accommodate product', 'NTG', 2),
('FINANCIAL_OPERATIONAL','NTG_FO_02','New settlement mechanism',                'Settlement process fundamentally different from existing', 'NTG', 2),
('FINANCIAL_OPERATIONAL','NTG_FO_03','New capital treatment',                   'Product requires new regulatory capital calculation', 'NTG', 1),
('FINANCIAL_OPERATIONAL','NTG_FO_04','Significant operational build',           'Requires new operational processes and teams', 'NTG', 1),
('FINANCIAL_OPERATIONAL','NTG_FO_05','New external dependency',                 'Critical dependency on new external parties/vendors', 'NTG', 1),
-- Variation criteria (8 material variation questions)
('VARIATION', 'VAR_01', 'Change in underlying asset or reference rate',         'Underlying shifts but product mechanics remain same', 'VARIATION', 1),
('VARIATION', 'VAR_02', 'Change in tenor or maturity range',                    'Extension or reduction of product tenor range', 'VARIATION', 1),
('VARIATION', 'VAR_03', 'Change in target customer segment',                    'Expanding to adjacent customer segments', 'VARIATION', 1),
('VARIATION', 'VAR_04', 'Change in distribution channel',                       'Adding new distribution channel to existing product', 'VARIATION', 1),
('VARIATION', 'VAR_05', 'Change in jurisdiction or booking location',           'Extending product to new booking entity/jurisdiction', 'VARIATION', 1),
('VARIATION', 'VAR_06', 'Change in risk limits or parameters',                  'Material change to risk thresholds or limits', 'VARIATION', 1),
('VARIATION', 'VAR_07', 'Change in external party or vendor',                   'Switching or adding critical third-party providers', 'VARIATION', 1),
('VARIATION', 'VAR_08', 'Change in regulatory treatment or framework',          'Regulatory change affecting product operation', 'VARIATION', 1);

-- ────────────────────────────────────────────────────────────
-- 13. SEED: 9 Prerequisite Categories with weights
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_prerequisite_categories (category_code, category_name, weight, description, order_index) VALUES
('STRATEGIC',    'Strategic Alignment',         15, 'Business case, market research, senior management approval', 1),
('CLASSIFICATION','Classification Readiness',   10, 'Product classification completed and validated', 2),
('STAKEHOLDER',  'Stakeholder Readiness',       20, 'All sign-off parties resourced and available', 3),
('TECHNICAL',    'Technical Infrastructure',     15, 'Systems, platforms, and integrations ready', 4),
('REGULATORY',   'Regulatory & Compliance',      15, 'Licensing, regulatory approvals, compliance programs', 5),
('RISK_MGMT',    'Risk Management',              10, 'Risk frameworks, limits, and monitoring in place', 6),
('DATA_MGMT',    'Data Management',               5, 'Data governance, privacy, PURE assessment', 7),
('FINANCIAL',    'Financial Framework',            5, 'Pricing models, capital allocation, P&L setup', 8),
('PROJECT_MGMT', 'Project Management',             5, 'Timeline, milestones, resource allocation', 9);

-- ────────────────────────────────────────────────────────────
-- 14. SEED: Prerequisite Checks (key items per category)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_prerequisite_checks (category_id, check_code, check_name, mandatory_for, is_critical, order_index) VALUES
-- Strategic Alignment
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STRATEGIC'), 'STR_01', 'Business case documented and approved', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STRATEGIC'), 'STR_02', 'Market research completed', 'FULL_NPA', 0, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STRATEGIC'), 'STR_03', 'Revenue projections supported', 'ALL', 1, 3),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STRATEGIC'), 'STR_04', 'Senior management approval obtained', 'FULL_NPA', 1, 4),
-- Classification
((SELECT id FROM ref_prerequisite_categories WHERE category_code='CLASSIFICATION'), 'CLS_01', 'Classification criteria assessed', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='CLASSIFICATION'), 'CLS_02', 'Approval track determined', 'ALL', 1, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='CLASSIFICATION'), 'CLS_03', 'Classification validated by reviewer', 'FULL_NPA', 0, 3),
-- Stakeholder Readiness
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STAKEHOLDER'), 'STK_01', 'Risk Management team capacity confirmed', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STAKEHOLDER'), 'STK_02', 'Technology team resources allocated', 'ALL', 1, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STAKEHOLDER'), 'STK_03', 'Legal/Compliance team engaged', 'ALL', 1, 3),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STAKEHOLDER'), 'STK_04', 'Finance team engaged for P&L setup', 'ALL', 0, 4),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='STAKEHOLDER'), 'STK_05', 'Escalation procedures defined', 'ALL', 0, 5),
-- Technical Infrastructure
((SELECT id FROM ref_prerequisite_categories WHERE category_code='TECHNICAL'), 'TEC_01', 'System capacity assessment completed', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='TECHNICAL'), 'TEC_02', 'Integration requirements mapped', 'ALL', 1, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='TECHNICAL'), 'TEC_03', 'Security assessment completed', 'ALL', 1, 3),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='TECHNICAL'), 'TEC_04', 'Performance impact analyzed', 'FULL_NPA', 0, 4),
-- Regulatory & Compliance
((SELECT id FROM ref_prerequisite_categories WHERE category_code='REGULATORY'), 'REG_01', 'Licensing requirements identified', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='REGULATORY'), 'REG_02', 'Regulatory approvals timeline mapped', 'ALL', 1, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='REGULATORY'), 'REG_03', 'Local compliance teams engaged', 'FULL_NPA', 0, 3),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='REGULATORY'), 'REG_04', 'Cross-border requirements assessed', 'FULL_NPA', 0, 4),
-- Risk Management
((SELECT id FROM ref_prerequisite_categories WHERE category_code='RISK_MGMT'), 'RSK_01', 'Risk framework designed', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='RISK_MGMT'), 'RSK_02', 'Risk limits proposed', 'ALL', 1, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='RISK_MGMT'), 'RSK_03', 'Prohibited list check completed', 'ALL', 1, 3),
-- Data Management
((SELECT id FROM ref_prerequisite_categories WHERE category_code='DATA_MGMT'), 'DAT_01', 'Data governance framework defined', 'ALL', 0, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='DATA_MGMT'), 'DAT_02', 'PURE assessment completed', 'FULL_NPA', 0, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='DATA_MGMT'), 'DAT_03', 'Privacy compliance assessed', 'ALL', 0, 3),
-- Financial Framework
((SELECT id FROM ref_prerequisite_categories WHERE category_code='FINANCIAL'), 'FIN_01', 'Pricing model validated', 'ALL', 1, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='FINANCIAL'), 'FIN_02', 'Capital allocation confirmed', 'FULL_NPA', 0, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='FINANCIAL'), 'FIN_03', 'Tax treatment determined', 'ALL', 0, 3),
-- Project Management
((SELECT id FROM ref_prerequisite_categories WHERE category_code='PROJECT_MGMT'), 'PRJ_01', 'Project timeline defined', 'ALL', 0, 1),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='PROJECT_MGMT'), 'PRJ_02', 'Resource allocation confirmed', 'ALL', 0, 2),
((SELECT id FROM ref_prerequisite_categories WHERE category_code='PROJECT_MGMT'), 'PRJ_03', 'Milestones and dependencies mapped', 'FULL_NPA', 0, 3);

-- ────────────────────────────────────────────────────────────
-- 15. SEED: Sign-off Routing Rules (from Filled Template Part B)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_signoff_routing_rules (approval_track, party_group, party_name, is_mandatory, sla_hours, can_parallel, sequence_order) VALUES
-- Full NPA routing
('FULL_NPA', 'RISK_MGMT',       'Market & Liquidity Risk',     1, 48, 1, 1),
('FULL_NPA', 'RISK_MGMT',       'Credit Risk',                 1, 48, 1, 1),
('FULL_NPA', 'TECH_OPS',        'Technology Architecture',     1, 48, 1, 1),
('FULL_NPA', 'TECH_OPS',        'Operations',                  1, 48, 1, 1),
('FULL_NPA', 'LEGAL_COMPLIANCE','Legal',                       1, 48, 0, 2),
('FULL_NPA', 'LEGAL_COMPLIANCE','Compliance',                  1, 48, 0, 2),
('FULL_NPA', 'FINANCE',         'Finance',                     1, 72, 0, 3),
('FULL_NPA', 'FINANCE',         'Tax',                         1, 48, 0, 3),
('FULL_NPA', 'INFO_SECURITY',   'Cybersecurity',               1, 48, 1, 1),
-- NPA Lite routing (fewer sign-offs, shorter SLAs)
('NPA_LITE', 'RISK_MGMT',       'Market & Liquidity Risk',     1, 36, 1, 1),
('NPA_LITE', 'RISK_MGMT',       'Credit Risk',                 1, 36, 1, 1),
('NPA_LITE', 'TECH_OPS',        'Operations',                  1, 36, 1, 1),
('NPA_LITE', 'LEGAL_COMPLIANCE','Compliance',                  1, 36, 0, 2),
('NPA_LITE', 'FINANCE',         'Finance',                     1, 48, 0, 3),
-- Bundling (minimal)
('BUNDLING', 'RISK_MGMT',       'Credit Risk',                 1, 24, 1, 1),
('BUNDLING', 'LEGAL_COMPLIANCE','Compliance',                  1, 24, 1, 1),
('BUNDLING', 'FINANCE',         'Finance',                     1, 36, 0, 2),
-- Evergreen (renewal - lightweight)
('EVERGREEN','RISK_MGMT',       'Market & Liquidity Risk',     1, 24, 1, 1),
('EVERGREEN','LEGAL_COMPLIANCE','Compliance',                  1, 24, 1, 1);

-- ────────────────────────────────────────────────────────────
-- 16. SEED: Escalation Rules (5 levels from Golden Source)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_escalation_rules (escalation_level, authority_name, trigger_type, trigger_threshold, action_required, auto_escalate) VALUES
(1, 'Department Head',   'SLA_BREACH',      '48',  'Review and reassign approver or extend SLA', 1),
(1, 'Department Head',   'LOOP_BACK_LIMIT', '2',   'Review loop-back pattern, provide guidance', 0),
(2, 'Business Unit Head','SLA_BREACH',      '72',  'Escalate resource allocation, mandate priority', 1),
(2, 'Business Unit Head','DISAGREEMENT',    '1',   'Mediate between conflicting sign-off parties', 0),
(3, 'Group Product Head','LOOP_BACK_LIMIT', '3',   'Circuit breaker activated - review full NPA', 1),
(3, 'Group Product Head','RISK_THRESHOLD',  'HIGH','Review risk assessment and approve/reject', 0),
(4, 'Group COO',         'SLA_BREACH',      '120', 'Executive intervention, mandate resolution', 1),
(4, 'Group COO',         'LOOP_BACK_LIMIT', '4',   'Governance Forum referral', 1),
(5, 'CEO',               'RISK_THRESHOLD',  'CRITICAL', 'Board-level review required', 0);

-- ────────────────────────────────────────────────────────────
-- 17. SEED: Document Requirements (from Golden Source + Filled Template)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_document_requirements (doc_code, doc_name, category, criticality, required_for, source, required_by_stage, order_index) VALUES
-- Critical (blocks approval)
('DOC_TERM_SHEET',     'Final Term Sheet',                       'CORE',        'CRITICAL',  'ALL',      'BUSINESS',       'CHECKER',  1),
('DOC_RISK_MEMO',      'Risk Assessment Memorandum',             'CORE',        'CRITICAL',  'ALL',      'BUSINESS',       'SIGN_OFF', 2),
('DOC_LEGAL_OPINION',  'External Legal Opinion',                 'CORE',        'CRITICAL',  'FULL_NPA', 'EXTERNAL',       'SIGN_OFF', 3),
('DOC_BIZ_CASE',       'Business Case Document',                 'CORE',        'CRITICAL',  'ALL',      'BUSINESS',       'CHECKER',  4),
('DOC_COMPLIANCE',     'Compliance Assessment',                  'CORE',        'CRITICAL',  'ALL',      'BUSINESS',       'SIGN_OFF', 5),
-- Important (may delay)
('DOC_CREDIT_REPORT',  'Credit Risk Report',                     'CORE',        'IMPORTANT', 'ALL',      'BUSINESS',       'SIGN_OFF', 6),
('DOC_TECH_SPEC',      'Technology Specification',                'CORE',        'IMPORTANT', 'FULL_NPA', 'BUSINESS',       'SIGN_OFF', 7),
('DOC_OPS_RUNBOOK',    'Operational Runbook',                     'CORE',        'IMPORTANT', 'ALL',      'BUSINESS',       'LAUNCH',   8),
('DOC_BCP',            'Business Continuity Plan',                'CONDITIONAL', 'IMPORTANT', 'FULL_NPA', 'BUSINESS',       'LAUNCH',   9),
('DOC_SECURITY',       'Security Assessment Report',              'CONDITIONAL', 'IMPORTANT', 'FULL_NPA', 'BUSINESS',       'SIGN_OFF', 10),
('DOC_ISDA',           'ISDA/Master Agreement Confirmations',     'CONDITIONAL', 'IMPORTANT', 'ALL',      'EXTERNAL',       'SIGN_OFF', 11),
('DOC_CPTY_RATINGS',   'Counterparty Credit Ratings',             'CONDITIONAL', 'IMPORTANT', 'ALL',      'EXTERNAL',       'SIGN_OFF', 12),
-- Supplementary
('DOC_MARKET_RESEARCH','Market Research / Competitive Analysis',  'SUPPLEMENTARY','OPTIONAL', 'FULL_NPA', 'BUSINESS',       'CHECKER',  13),
('DOC_CLIENT_DEMAND',  'Client Demand Analysis',                  'SUPPLEMENTARY','OPTIONAL', 'ALL',      'BUSINESS',       'CHECKER',  14),
('DOC_TRAINING',       'Training Materials Draft',                'SUPPLEMENTARY','OPTIONAL', 'FULL_NPA', 'BUSINESS',       'LAUNCH',   15),
('DOC_IMPL_TIMELINE',  'Implementation Timeline (detailed)',      'SUPPLEMENTARY','OPTIONAL', 'ALL',      'BUSINESS',       'CHECKER',  16),
('DOC_BUDGET',         'Budget Allocation Memo',                  'SUPPLEMENTARY','OPTIONAL', 'FULL_NPA', 'BUSINESS',       'SIGN_OFF', 17),
('DOC_REG_FILING',     'Regulatory Filing Templates',             'CONDITIONAL', 'IMPORTANT', 'FULL_NPA', 'REGULATORY',     'LAUNCH',   18),
('DOC_VENDOR_DD',      'Vendor Due Diligence Reports',            'CONDITIONAL', 'IMPORTANT', 'FULL_NPA', 'EXTERNAL',       'SIGN_OFF', 19),
('DOC_TAX_ANALYSIS',   'Tax Impact Analysis',                     'CONDITIONAL', 'IMPORTANT', 'FULL_NPA', 'BUSINESS',       'SIGN_OFF', 20);

-- ────────────────────────────────────────────────────────────
-- 18. SEED: Prohibited Items (sample from Risk Agent)
-- ────────────────────────────────────────────────────────────

INSERT INTO ref_prohibited_items (layer, item_code, item_name, description, jurisdictions, severity, effective_from) VALUES
('INTERNAL_POLICY', 'PRH_IP_01', 'Binary Options',                'All binary/digital options prohibited by group policy', 'ALL', 'HARD_STOP', '2020-01-01'),
('INTERNAL_POLICY', 'PRH_IP_02', 'CFDs for Retail',               'Contracts for difference prohibited for retail clients', 'ALL', 'HARD_STOP', '2019-06-01'),
('INTERNAL_POLICY', 'PRH_IP_03', 'Leveraged Crypto (>5x)',        'Cryptocurrency products with leverage exceeding 5x',    'ALL', 'HARD_STOP', '2022-01-01'),
('REGULATORY',      'PRH_RG_01', 'Unregistered Securities (SG)',   'Securities not registered with MAS',                   'SG',  'HARD_STOP', '2020-01-01'),
('REGULATORY',      'PRH_RG_02', 'ICO Tokens (HK)',               'Initial Coin Offering tokens per SFC guidance',         'HK',  'HARD_STOP', '2021-03-01'),
('SANCTIONS',       'PRH_SN_01', 'OFAC SDN List Entities',         'US Treasury OFAC Specially Designated Nationals',       'ALL', 'HARD_STOP', '2020-01-01'),
('SANCTIONS',       'PRH_SN_02', 'EU Sanctions List',              'European Union consolidated sanctions list',            'ALL', 'HARD_STOP', '2020-01-01'),
('DYNAMIC',         'PRH_DY_01', 'Russia-linked Instruments',      'Products with material Russian counterparty exposure',  'ALL', 'HARD_STOP', '2022-03-01'),
('DYNAMIC',         'PRH_DY_02', 'Myanmar Financial Products',     'Products involving Myanmar financial institutions',     'ALL', 'CONDITIONAL', '2021-02-01');

-- ────────────────────────────────────────────────────────────
-- 19. SEED: Demo NPA Classification Assessment
--     (TSG2026 Digital Currency as NTG example)
-- ────────────────────────────────────────────────────────────

-- Find the Digital Currency NPA project (if exists from seed data)
-- This demonstrates how Classification Agent would score the filled template
INSERT INTO npa_classification_assessments (project_id, criteria_id, score, evidence, assessed_by, confidence)
SELECT
    p.id,
    c.id,
    CASE
        WHEN c.criterion_code IN ('NTG_PI_01','NTG_PI_02','NTG_PI_03','NTG_PI_05','NTG_MC_01','NTG_MC_04','NTG_RR_01','NTG_RR_02','NTG_RR_05','NTG_FO_01','NTG_FO_02','NTG_FO_05') THEN 2
        WHEN c.criterion_code IN ('NTG_PI_04','NTG_MC_02','NTG_MC_03','NTG_RR_03','NTG_RR_04','NTG_FO_03','NTG_FO_04') THEN 1
        ELSE 0
    END,
    CASE
        WHEN c.criterion_code = 'NTG_PI_01' THEN 'Digital currency trading - no existing equivalent in MBS portfolio'
        WHEN c.criterion_code = 'NTG_PI_02' THEN 'Crypto volatility and 24/7 trading fundamentally different risk profile'
        WHEN c.criterion_code = 'NTG_PI_03' THEN 'BTC, ETH, ADA, SOL - new asset classes for MBS'
        WHEN c.criterion_code = 'NTG_RR_01' THEN 'MAS Digital Payment Token Service License required'
        WHEN c.criterion_code = 'NTG_FO_01' THEN 'New CRY booking family, DGTL group, SPOT type'
        ELSE 'Auto-assessed by Classification Agent'
    END,
    'CLASSIFICATION_AGENT',
    92.5
FROM npa_projects p
CROSS JOIN ref_classification_criteria c
WHERE c.indicator_type = 'NTG'
AND p.id = (SELECT id FROM npa_projects ORDER BY created_at DESC LIMIT 1);

-- ────────────────────────────────────────────────────────────
-- VERIFY
-- ────────────────────────────────────────────────────────────

SELECT 'Migration complete. New table counts:' AS status;
SELECT TABLE_NAME, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'npa_workbench'
AND TABLE_NAME IN (
    'ref_classification_criteria',
    'npa_classification_assessments',
    'ref_prerequisite_categories',
    'ref_prerequisite_checks',
    'npa_prerequisite_results',
    'ref_signoff_routing_rules',
    'ref_escalation_rules',
    'npa_escalations',
    'ref_prohibited_items',
    'npa_risk_checks',
    'ref_document_requirements',
    'npa_agent_routing_decisions',
    'npa_monitoring_thresholds',
    'npa_external_parties',
    'npa_market_risk_factors'
)
ORDER BY TABLE_NAME;
