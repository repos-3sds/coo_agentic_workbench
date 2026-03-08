

SET @db := DATABASE();


SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='title') = 0,
  'ALTER TABLE kb_documents ADD COLUMN title VARCHAR(255) NULL AFTER filename',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='description') = 0,
  'ALTER TABLE kb_documents ADD COLUMN description TEXT NULL AFTER title',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='ui_category') = 0,
  'ALTER TABLE kb_documents ADD COLUMN ui_category VARCHAR(20) NULL AFTER doc_type',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='agent_target') = 0,
  'ALTER TABLE kb_documents ADD COLUMN agent_target VARCHAR(50) NULL AFTER ui_category',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='icon_name') = 0,
  'ALTER TABLE kb_documents ADD COLUMN icon_name VARCHAR(50) NULL AFTER agent_target',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='display_date') = 0,
  'ALTER TABLE kb_documents ADD COLUMN display_date VARCHAR(32) NULL AFTER icon_name',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='created_at') = 0,
  'ALTER TABLE kb_documents ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='updated_at') = 0,
  'ALTER TABLE kb_documents ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;


CREATE TABLE IF NOT EXISTS evidence_library (
  record_id       VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  evidence_type   VARCHAR(20) NOT NULL,       -- PRECEDENTS | AUDITS | EXCEPTIONS
  status          VARCHAR(20) NOT NULL,       -- APPROVED | REJECTED | SEALED | GRANTED
  relevance_score INT NULL,                   -- percent (0-100)
  event_date      DATE NULL,
  display_date    VARCHAR(32) NULL,           -- e.g. "12 Nov 2025"
  icon_name       VARCHAR(50) NULL,           -- lucide icon name
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_el_type (evidence_type),
  INDEX idx_el_status (status),
  INDEX idx_el_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


INSERT INTO kb_documents
  (doc_id, filename, doc_type, embedding_id, last_synced, title, description, ui_category, agent_target, icon_name, display_date)
VALUES
  -- UNIVERSAL
  ('MBS_10_S_0012_GR', 'MBS Group NPA Policy & Standard', 'POLICY', NULL, '2025-10-01 00:00:00',
    'MBS Group NPA Policy & Standard',
    'Overarching global policy (RMG-OR). Defines NTG vs Variation vs Existing classifications and standard 1-year validity.',
    'UNIVERSAL', NULL, 'file-text', 'Oct 2025'),
  ('GFM_SOP_v2.3', 'GFM NPA Standard Operating Procedures', 'SOP', NULL, '2026-01-01 00:00:00',
    'GFM NPA Standard Operating Procedures',
    'Stricter GFM-specific rules. Dictates mandatory 5 sign-offs for cross-border deals and 3-loop-back circuit breaker.',
    'UNIVERSAL', NULL, 'book-open', 'Jan 2026'),
  ('SANCTIONS_2026', 'Global Prohibited & Sanctions List', 'POLICY', NULL, '2026-01-01 00:00:00',
    'Global Prohibited & Sanctions List',
    'OFAC, UN, EU sanctions list plus internal prohibited products. \"Hard Stop\" reference for Ideation Agent.',
    'UNIVERSAL', NULL, 'alert-triangle', 'Live'),
  ('REG_MATRIX_Q1', 'Regulatory & License Mapping Matrix', 'REGULATORY', NULL, '2026-02-01 00:00:00',
    'Regulatory & License Mapping Matrix',
    'Matrix of allowed activities per jurisdiction (MAS in SG, HKMA in HK, FCA in UK).',
    'UNIVERSAL', NULL, 'map', 'Feb 2026'),
  ('NPA_ARCHIVE_DB', 'Historical NPA Master Archive', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Historical NPA Master Archive',
    'Indexed database of all past NPA documents (1,784+ records) for similarity searches.',
    'UNIVERSAL', NULL, 'archive', 'Live'),
  ('MBS_LIQ_POL', 'MBS Group Holdings Liquidity Policy', 'POLICY', NULL, '2025-12-01 00:00:00',
    'MBS Group Holdings Liquidity Policy',
    'Enterprise-wide liquidity requirements affecting GFM funding and capital products.',
    'UNIVERSAL', NULL, 'droplet', 'Dec 2025'),
  ('D4D_PURE_v1', 'GFM Data Management Policy (PURE)', 'POLICY', NULL, '2025-11-01 00:00:00',
    'GFM Data Management Policy (PURE)',
    'Design for Data (D4D) standards for ensuring Risk Data Aggregation and Reporting compliance.',
    'UNIVERSAL', NULL, 'database', 'Nov 2025'),
  ('PAC_CHARTER_26', 'Product Approval Committee Charter', 'POLICY', NULL, '2026-01-01 00:00:00',
    'Product Approval Committee Charter',
    'Group PAC mandate for approving New-To-Group (NTG) products before the NPA process begins.',
    'UNIVERSAL', NULL, 'users', 'Jan 2026'),
  ('EXT_PLATFORM_STDS', 'External Platform Review Standards', 'SOP', NULL, '2025-08-01 00:00:00',
    'External Platform Review Standards',
    'Checklists and risk controls for connecting GFM product flows to third-party vendor platforms.',
    'UNIVERSAL', NULL, 'monitor-speaker', 'Aug 2025'),
  ('ESG_FRAMEWORK', 'MBS Group Sustainability Framework', 'POLICY', NULL, '2025-05-01 00:00:00',
    'MBS Group Sustainability Framework',
    'Definitions and criteria for classifying products as \"Green\", \"Social\", or \"Sustainable\".',
    'UNIVERSAL', NULL, 'leaf', 'May 2025'),

  -- AGENT
  ('AGENT_ID_001', 'NPA Decision Matrix / Classification Tree', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'NPA Decision Matrix / Classification Tree',
    'Ontological decision tree for NTG vs. Variation vs. Existing mapping.',
    'AGENT', 'Ideation', 'git-branch', NULL),
  ('AGENT_ID_002', 'Evergreen Eligibility Master List', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Evergreen Eligibility Master List',
    'Constantly maintained list of products eligible for the 3-year Evergreen track.',
    'AGENT', 'Ideation', 'list-checks', NULL),
  ('AGENT_ID_003', 'Evergreen Usage Tracker API', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Evergreen Usage Tracker API',
    'Real-time tracker of current Evergreen notional usage against the $500M GFM-wide cap.',
    'AGENT', 'Ideation', 'activity', NULL),
  ('AGENT_ID_004', 'Approved FX Bundles List', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Approved FX Bundles List',
    'Catalog of 28+ pre-approved FX derivative bundles (KIKO, Boosted KO Forward) bypassing arbitration.',
    'AGENT', 'Ideation', 'package', NULL),
  ('AGENT_ID_005', 'Cross-Border Booking Rulebook', 'REGULATORY', NULL, '2026-02-01 00:00:00',
    'Cross-Border Booking Rulebook',
    'Legal implications for cross-location trades (e.g., SG booking with HK entity).',
    'AGENT', 'Regulatory', 'globe', NULL),
  ('AGENT_ID_006', 'Third-Party Comm Channels Risk Matrix', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Third-Party Comm Channels Risk Matrix',
    'Classification matrix (High/Low impact) for using WhatsApp, WeChat, external sites.',
    'AGENT', 'Compliance', 'message-square', NULL),
  ('AGENT_ID_007', 'Standard Legal Template Library', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Standard Legal Template Library',
    'Approved boilerplate clauses for ISDA, GMRA, NAFMII, and CSA agreements.',
    'AGENT', 'Legal', 'scale', NULL),
  ('AGENT_ID_008', 'Financial Crime Risk Guidelines (Appx 3)', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Financial Crime Risk Guidelines (Appx 3)',
    'Questionnaires and compliance standards for AML, CFT, and Fraud assessment.',
    'AGENT', 'Compliance', 'shield-alert', NULL),
  ('AGENT_ID_009', 'Accounting Treatment Standards', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Accounting Treatment Standards',
    'Rules determining Trading Book vs Banking Book, FVPL vs FVOCI.',
    'AGENT', 'Finance', 'calculator', NULL),
  ('AGENT_ID_010', 'ROAE Sensitivity Analysis Templates', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'ROAE Sensitivity Analysis Templates',
    'Required calculation templates for any product with a notional >$20M.',
    'AGENT', 'Finance', 'trending-up', NULL),
  ('AGENT_ID_011', 'Global Tax Protocol Database', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Global Tax Protocol Database',
    'Guidelines on withholding taxes, VAT, and transfer pricing implications per jurisdiction.',
    'AGENT', 'Finance', 'landmark', NULL),
  ('AGENT_ID_012', 'Approved Pricing Models Registry', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'Approved Pricing Models Registry',
    'Mathematically validated pricing models and their specific validation expiry dates.',
    'AGENT', 'Market Risk', 'bar-chart-2', NULL),
  ('AGENT_ID_013', 'Risk Metric Thresholds', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Risk Metric Thresholds',
    'Acceptable tolerances for VaR, IR/FX Delta, Vega, LCR, and NSFR impacts.',
    'AGENT', 'Market Risk', 'thermometer', NULL),
  ('AGENT_ID_014', 'Credit Exposure (PCE/SACCR) Methodologies', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Credit Exposure (PCE/SACCR) Methodologies',
    'Standard formulas for pre-settlement and counterparty credit risk calculations.',
    'AGENT', 'Credit Risk', 'percent', NULL),
  ('AGENT_ID_015', 'Eligible Collateral Master List', 'POLICY', NULL, '2026-02-01 00:00:00',
    'Eligible Collateral Master List',
    'Basel-eligible HQLA and acceptable collateral haircut matrices.',
    'AGENT', 'Credit Risk', 'shield-check', NULL),
  ('AGENT_ID_016', 'System Booking Schemas & Typologies', 'GOLDEN_SOURCE', NULL, '2026-02-01 00:00:00',
    'System Booking Schemas & Typologies',
    'Mapping of standard products to Murex/Mini/FA typologies.',
    'AGENT', 'Tech & Ops', 'server', NULL),
  ('AGENT_ID_017', 'BCM Standards (BIA/RTO/RPO)', 'POLICY', NULL, '2026-02-01 00:00:00',
    'BCM Standards (BIA/RTO/RPO)',
    'Rules for required RTO/RPO limits and Business Impact Analysis generation.',
    'AGENT', 'Tech & Ops', 'hard-drive', NULL),

  -- WORKFLOW
  ('WF_ID_001', 'SOP SLA Matrix', 'SOP', NULL, '2026-02-01 00:00:00',
    'SOP SLA Matrix',
    'Turnaround times for paths (e.g., 48 hours for Impending Deal, targets for Full NPA).',
    'WORKFLOW', NULL, 'clock', NULL),
  ('WF_ID_002', 'PIR Playbook', 'SOP', NULL, '2026-02-01 00:00:00',
    'PIR Playbook',
    'Rules for triggering PIRs (6 months post-launch), tracking conditions, and repeating failed PIRs.',
    'WORKFLOW', NULL, 'clipboard-check', NULL),
  ('WF_ID_003', 'Governance Hierarchy & Escalation Paths', 'SOP', NULL, '2026-02-01 00:00:00',
    'Governance Hierarchy & Escalation Paths',
    'Contact mapping for GFM COO Office, PAC, and Forum routing.',
    'WORKFLOW', NULL, 'network', NULL),
  ('WF_ID_004', 'Bundling Arbitration Team Charter', 'SOP', NULL, '2026-02-01 00:00:00',
    'Bundling Arbitration Team Charter',
    'Arbitration rules when a bundle fails one of the 8 safety conditions.',
    'WORKFLOW', NULL, 'gavel', NULL),
  ('WF_ID_005', 'Fast-Track Dormant Reactivation Rules', 'SOP', NULL, '2026-02-01 00:00:00',
    'Fast-Track Dormant Reactivation Rules',
    'Requirements to bypass NPA Lite for products dormant under 3 years with no variations.',
    'WORKFLOW', NULL, 'zap', NULL)
ON DUPLICATE KEY UPDATE
  filename=VALUES(filename),
  doc_type=VALUES(doc_type),
  last_synced=VALUES(last_synced),
  title=VALUES(title),
  description=VALUES(description),
  ui_category=VALUES(ui_category),
  agent_target=VALUES(agent_target),
  icon_name=VALUES(icon_name),
  display_date=VALUES(display_date),
  updated_at=CURRENT_TIMESTAMP;


INSERT INTO evidence_library
  (record_id, title, description, evidence_type, status, relevance_score, event_date, display_date, icon_name)
VALUES
  ('TSG1917', 'Exchange-Listed IR Options',
    'US Exchange-listed Interest Rate Futures and Options. Grandfathered product with T&M HK precedent. Track: No NPA Required. Model validation already completed.',
    'PRECEDENTS', 'APPROVED', 99, '2025-11-12', '12 Nov 2025', 'git-commit'),
  ('TSG2042', 'NAFMII Repo Agreement',
    'Pledged Bond Repo in CIBM. Classification: NTG. Cross-border settlement via MBS China. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 85, '2025-10-04', '04 Oct 2025', 'git-commit'),
  ('TSG2055', 'Nikko AM-ICBC SG China Bond ETF',
    'Nikko AM-ICBC SG China Bond ETF subscription. Classification: Deal-specific. Requires individual deal approval rather than standing NPA.',
    'PRECEDENTS', 'REJECTED', 78, '2025-09-19', '19 Sep 2025', 'git-commit'),
  ('TSG2339', 'Swap Connect Platform',
    'Interest Rate Swaps via Swap Connect platform (cross-border HK ↔ China). ISDA with novation to HKEx OTC Clear. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 92, '2025-08-05', '05 Aug 2025', 'git-commit'),
  ('TSG2543', 'Multi-Asset Complex Structured Product',
    'Complex structured product across multiple asset classes. Triggered multiple SOP reviews; rejected due to prolonged clearance timelines.',
    'PRECEDENTS', 'REJECTED', 65, '2025-07-22', '22 Jul 2025', 'git-commit'),
  ('AUD-2026-041', 'Q1 Regulatory Submission Log',
    'Immutable log of MAS 656 regulatory checks performed by the Compliance Agent.',
    'AUDITS', 'SEALED', NULL, '2026-03-01', '01 Mar 2026', 'shield-check'),
  ('EXC-091A', 'Evergreen Cap Override - FX Forwards',
    'Temporary lifting of the $500M GFM cap for Q1 hedging demands.',
    'EXCEPTIONS', 'GRANTED', NULL, '2026-02-28', '28 Feb 2026', 'alert-circle'),
  ('AUD-2025-992', 'Annual Model Validation Sign-offs',
    'RMG validation certificates for 32 active pricing models.',
    'AUDITS', 'SEALED', NULL, '2025-12-31', '31 Dec 2025', 'shield-check')
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  description=VALUES(description),
  evidence_type=VALUES(evidence_type),
  status=VALUES(status),
  relevance_score=VALUES(relevance_score),
  event_date=VALUES(event_date),
  display_date=VALUES(display_date),
  icon_name=VALUES(icon_name),
  updated_at=CURRENT_TIMESTAMP;



SET @db := DATABASE();

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='source_url') = 0,
  'ALTER TABLE kb_documents ADD COLUMN source_url TEXT NULL AFTER display_date',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='file_path') = 0,
  'ALTER TABLE kb_documents ADD COLUMN file_path VARCHAR(512) NULL AFTER source_url',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='mime_type') = 0,
  'ALTER TABLE kb_documents ADD COLUMN mime_type VARCHAR(100) NULL AFTER file_path',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='file_size') = 0,
  'ALTER TABLE kb_documents ADD COLUMN file_size BIGINT NULL AFTER mime_type',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='sha256') = 0,
  'ALTER TABLE kb_documents ADD COLUMN sha256 CHAR(64) NULL AFTER file_size',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='visibility') = 0,
  'ALTER TABLE kb_documents ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT ''INTERNAL'' AFTER sha256',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND INDEX_NAME='idx_kb_ui_category') = 0,
  'ALTER TABLE kb_documents ADD INDEX idx_kb_ui_category (ui_category)',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;



CREATE TABLE IF NOT EXISTS `studio_documents` (
  `id` varchar(100) NOT NULL,
  `owner_user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `ui_category` varchar(50) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT|SUBMITTED|APPROVED|REJECTED',
  `visibility` varchar(30) NOT NULL DEFAULT 'PRIVATE' COMMENT 'PRIVATE|INTERNAL',
  `generated_markdown` longtext DEFAULT NULL,
  `generation_agent_id` varchar(80) DEFAULT NULL,
  `generation_conversation_id` varchar(255) DEFAULT NULL,
  `generation_meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`generation_meta`)),
  `kb_doc_id` varchar(100) DEFAULT NULL COMMENT 'Set after publish to kb_documents',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by_user_id` varchar(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejected_by_user_id` varchar(36) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_studio_owner` (`owner_user_id`),
  KEY `idx_studio_status` (`status`),
  KEY `idx_studio_kb_doc` (`kb_doc_id`),
  CONSTRAINT `studio_documents_ibfk_1` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `studio_document_files` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `studio_doc_id` varchar(100) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(120) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `sha256` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_studio_file_doc` (`studio_doc_id`),
  CONSTRAINT `studio_document_files_ibfk_1` FOREIGN KEY (`studio_doc_id`) REFERENCES `studio_documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;



SET @db := DATABASE();

SET @sql_agent_target := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='studio_documents' AND COLUMN_NAME='agent_target') = 0,
  'ALTER TABLE `studio_documents` ADD COLUMN `agent_target` varchar(80) DEFAULT NULL AFTER `ui_category`;',
  'SELECT 1;'
);
PREPARE stmt FROM @sql_agent_target;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_target_dataset_id := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA=@db AND TABLE_NAME='studio_documents' AND COLUMN_NAME='target_dataset_id') = 0,
  'ALTER TABLE `studio_documents` ADD COLUMN `target_dataset_id` varchar(60) DEFAULT NULL AFTER `agent_target`;',
  'SELECT 1;'
);
PREPARE stmt2 FROM @sql_target_dataset_id;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

