SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
SET UNIQUE_CHECKS=0;
SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;
DROP TABLE IF EXISTS `agent_messages`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `agent_messages` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(36) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL CHECK (`role` in ('user','agent')),
  `agent_identity_id` varchar(50) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `agent_confidence` decimal(5,2) DEFAULT NULL,
  `reasoning_chain` text DEFAULT NULL COMMENT 'Why the agent made this decision',
  `citations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Source documents/NPAs referenced' CHECK (json_valid(`citations`)),
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  CONSTRAINT `agent_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `agent_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `agent_sessions`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `agent_sessions` (
  `id` varchar(36) NOT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(100) DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `agent_identity` varchar(50) DEFAULT NULL COMMENT 'Which agent owns this session',
  `current_stage` varchar(50) DEFAULT NULL,
  `handoff_from` varchar(50) DEFAULT NULL COMMENT 'Agent that handed off to this one',
  `conversation_state_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Dify per-agent conversation state (JSON)' CHECK (json_valid(`conversation_state_json`)),
  `ended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `agent_sessions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `kb_documents`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `kb_documents` (
  `doc_id` varchar(100) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `embedding_id` varchar(100) DEFAULT NULL,
  `last_synced` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_agent_routing_decisions`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_agent_routing_decisions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(36) DEFAULT NULL,
  `project_id` varchar(36) DEFAULT NULL,
  `source_agent` varchar(50) NOT NULL COMMENT 'Agent that made the routing decision',
  `target_agent` varchar(50) NOT NULL COMMENT 'Agent being routed to',
  `routing_reason` text DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT NULL,
  `context_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Preserved context passed to target' CHECK (json_valid(`context_payload`)),
  `decided_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_route_session` (`session_id`),
  KEY `idx_route_project` (`project_id`),
  CONSTRAINT `npa_agent_routing_decisions_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `agent_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_approvals`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_approvals` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `approval_type` varchar(50) NOT NULL COMMENT 'CHECKER, GFM_COO, PAC',
  `approver_id` varchar(36) DEFAULT NULL,
  `approver_role` varchar(100) DEFAULT NULL,
  `decision` varchar(30) DEFAULT NULL COMMENT 'APPROVE, REJECT, CONDITIONAL_APPROVE',
  `decision_date` timestamp NULL DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `conditions_imposed` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_approvals_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_audit_log`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) DEFAULT NULL,
  `actor_name` varchar(255) NOT NULL,
  `actor_role` varchar(100) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL COMMENT 'NPA_CREATED, SUBMITTED, APPROVED, REJECTED, DOCUMENT_UPLOADED, AGENT_CLASSIFIED, etc.',
  `action_details` text DEFAULT NULL,
  `is_agent_action` tinyint(1) DEFAULT 0,
  `agent_name` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `reasoning` text DEFAULT NULL,
  `model_version` varchar(50) DEFAULT NULL,
  `source_citations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`source_citations`)),
  PRIMARY KEY (`id`),
  KEY `idx_audit_project` (`project_id`),
  KEY `idx_audit_timestamp` (`timestamp`),
  KEY `idx_audit_action` (`action_type`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_breach_alerts`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_breach_alerts` (
  `id` varchar(20) NOT NULL COMMENT 'e.g., BR-001',
  `project_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `severity` varchar(20) NOT NULL COMMENT 'CRITICAL, WARNING, INFO',
  `description` text NOT NULL,
  `threshold_value` varchar(100) DEFAULT NULL,
  `actual_value` varchar(100) DEFAULT NULL,
  `escalated_to` varchar(255) DEFAULT NULL,
  `sla_hours` int(11) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'OPEN' COMMENT 'OPEN, ACKNOWLEDGED, RESOLVED, ESCALATED',
  `triggered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_breach_alerts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_classification_assessments`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_classification_assessments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `criteria_id` int(11) NOT NULL,
  `score` int(11) NOT NULL DEFAULT 0 COMMENT '0=Not Met, 1=Partially Met, 2=Fully Met',
  `evidence` text DEFAULT NULL,
  `assessed_by` varchar(50) DEFAULT 'CLASSIFICATION_AGENT',
  `confidence` decimal(5,2) DEFAULT NULL,
  `assessed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `criteria_id` (`criteria_id`),
  KEY `idx_class_assess_proj` (`project_id`),
  CONSTRAINT `npa_classification_assessments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `npa_classification_assessments_ibfk_2` FOREIGN KEY (`criteria_id`) REFERENCES `ref_classification_criteria` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=116 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_classification_scorecards`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_classification_scorecards` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `total_score` int(11) NOT NULL,
  `calculated_tier` varchar(50) NOT NULL,
  `breakdown` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`breakdown`)),
  `override_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_classification_scorecards_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_comments`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_comments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `comment_type` varchar(50) NOT NULL COMMENT 'APPROVER_QUESTION, MAKER_RESPONSE, AI_ANSWER, SYSTEM_ALERT, CHECKER_NOTE',
  `comment_text` text NOT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `author_role` varchar(100) DEFAULT NULL,
  `parent_comment_id` bigint(20) DEFAULT NULL,
  `generated_by_ai` tinyint(1) DEFAULT 0,
  `ai_agent` varchar(100) DEFAULT NULL,
  `ai_confidence` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_comments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_documents`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_documents` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_type` varchar(100) DEFAULT NULL COMMENT 'TERM_SHEET, CREDIT_REPORT, RISK_MEMO, LEGAL_OPINION, ISDA, TAX_ASSESSMENT',
  `file_size` varchar(20) DEFAULT NULL,
  `file_extension` varchar(10) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `validation_status` varchar(50) DEFAULT 'PENDING' COMMENT 'VALID, PENDING, INVALID, WARNING',
  `uploaded_by` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `version` int(11) DEFAULT 1,
  `validation_stage` varchar(50) DEFAULT NULL COMMENT 'AUTOMATED, BUSINESS, RISK, COMPLIANCE, LEGAL, FINAL',
  `criticality` varchar(20) DEFAULT NULL COMMENT 'CRITICAL, IMPORTANT, OPTIONAL',
  `required_by_stage` varchar(50) DEFAULT NULL COMMENT 'CHECKER, SIGN_OFF, LAUNCH',
  `doc_requirement_id` int(11) DEFAULT NULL COMMENT 'FK to ref_document_requirements',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_documents_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_escalations`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_escalations` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `escalation_level` int(11) NOT NULL,
  `trigger_type` varchar(50) NOT NULL,
  `trigger_detail` text DEFAULT NULL,
  `escalated_to` varchar(255) NOT NULL,
  `escalated_by` varchar(255) DEFAULT 'GOVERNANCE_AGENT',
  `status` varchar(30) DEFAULT 'ACTIVE' COMMENT 'ACTIVE, RESOLVED, OVERRIDDEN',
  `resolution` text DEFAULT NULL,
  `escalated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_esc_proj` (`project_id`),
  CONSTRAINT `npa_escalations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_external_parties`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_external_parties` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `party_name` varchar(255) NOT NULL,
  `party_role` text DEFAULT NULL,
  `risk_profile_id` varchar(50) DEFAULT NULL,
  `vendor_tier` varchar(20) DEFAULT NULL COMMENT 'TIER_1_CRITICAL, TIER_2, TIER_3',
  `grc_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_external_parties_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_form_data`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_form_data` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) DEFAULT NULL,
  `field_key` varchar(100) DEFAULT NULL,
  `field_value` text DEFAULT NULL,
  `lineage` varchar(20) DEFAULT NULL CHECK (`lineage` in ('AUTO','ADAPTED','MANUAL')),
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `field_key` (`field_key`),
  CONSTRAINT `npa_form_data_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `npa_form_data_ibfk_2` FOREIGN KEY (`field_key`) REFERENCES `ref_npa_fields` (`field_key`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_intake_assessments`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_intake_assessments` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `domain` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL CHECK (`status` in ('PASS','FAIL','WARN')),
  `score` int(11) DEFAULT 0,
  `findings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`findings`)),
  `assessed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_intake_assessments_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_jurisdictions`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_jurisdictions` (
  `project_id` varchar(36) DEFAULT NULL,
  `jurisdiction_code` varchar(10) DEFAULT NULL COMMENT 'SG, HK, CN, IN, etc.',
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_jurisdictions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_kpi_snapshots`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_kpi_snapshots` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `snapshot_date` date NOT NULL,
  `pipeline_value` decimal(18,2) DEFAULT NULL,
  `active_npas` int(11) DEFAULT NULL,
  `avg_cycle_days` decimal(5,2) DEFAULT NULL,
  `approval_rate` decimal(5,2) DEFAULT NULL,
  `approvals_completed` int(11) DEFAULT NULL,
  `approvals_total` int(11) DEFAULT NULL,
  `critical_risks` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_loop_backs`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_loop_backs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `loop_back_number` int(11) NOT NULL,
  `loop_back_type` varchar(50) NOT NULL COMMENT 'CHECKER_REJECTION, APPROVAL_CLARIFICATION, LAUNCH_PREP_ISSUE',
  `initiated_by_party` varchar(50) NOT NULL,
  `initiator_name` varchar(255) DEFAULT NULL,
  `reason` text NOT NULL,
  `requires_npa_changes` tinyint(1) DEFAULT 1,
  `routed_to` varchar(30) DEFAULT NULL COMMENT 'MAKER, AI, CHECKER',
  `routing_reasoning` text DEFAULT NULL,
  `initiated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `delay_days` decimal(5,2) DEFAULT NULL,
  `resolution_type` varchar(50) DEFAULT NULL COMMENT 'MAKER_FIXED, AI_ANSWERED, CHECKER_REVIEWED, ESCALATED',
  `resolution_details` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_loop_backs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_market_clusters`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_market_clusters` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(100) NOT NULL,
  `npa_count` int(11) DEFAULT 0,
  `growth_percent` decimal(5,2) DEFAULT NULL,
  `intensity_percent` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_market_risk_factors`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_market_risk_factors` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `risk_factor` varchar(50) NOT NULL COMMENT 'IR_DELTA, IR_VEGA, FX_DELTA, FX_VEGA, EQ_DELTA, CREDIT_SPREAD, CRYPTO_DELTA, etc.',
  `is_applicable` tinyint(1) DEFAULT 0,
  `sensitivity_report` tinyint(1) DEFAULT 0,
  `var_capture` tinyint(1) DEFAULT 0,
  `stress_capture` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mrf_proj` (`project_id`),
  CONSTRAINT `npa_market_risk_factors_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_monitoring_thresholds`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_monitoring_thresholds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `metric_name` varchar(100) NOT NULL COMMENT 'trading_volume, pnl, var_utilization, counterparty_exposure',
  `warning_value` decimal(18,2) NOT NULL,
  `critical_value` decimal(18,2) NOT NULL,
  `comparison` varchar(10) NOT NULL DEFAULT 'GT' COMMENT 'GT, LT, EQ',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_monitoring_thresholds_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_performance_metrics`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_performance_metrics` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `days_since_launch` int(11) DEFAULT NULL,
  `total_volume` decimal(18,2) DEFAULT NULL,
  `volume_currency` varchar(3) DEFAULT 'USD',
  `realized_pnl` decimal(18,2) DEFAULT NULL,
  `active_breaches` int(11) DEFAULT 0,
  `counterparty_exposure` decimal(18,2) DEFAULT NULL,
  `var_utilization` decimal(5,2) DEFAULT NULL,
  `collateral_posted` decimal(18,2) DEFAULT NULL,
  `next_review_date` date DEFAULT NULL,
  `health_status` varchar(20) DEFAULT NULL COMMENT 'healthy, warning, critical',
  `snapshot_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_performance_metrics_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_post_launch_conditions`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_post_launch_conditions` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) DEFAULT NULL,
  `condition_text` text NOT NULL,
  `owner_party` varchar(50) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'PENDING',
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_post_launch_conditions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_prerequisite_results`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_prerequisite_results` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `check_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, PASS, FAIL, WAIVED, N/A',
  `evidence` text DEFAULT NULL,
  `validated_by` varchar(255) DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `check_id` (`check_id`),
  KEY `idx_prereq_proj` (`project_id`),
  CONSTRAINT `npa_prerequisite_results_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `npa_prerequisite_results_ibfk_2` FOREIGN KEY (`check_id`) REFERENCES `ref_prerequisite_checks` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_projects`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_projects` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `product_category` varchar(100) DEFAULT NULL,
  `npa_type` varchar(50) DEFAULT NULL COMMENT 'New-to-Group, Variation, Existing, NPA Lite',
  `risk_level` varchar(20) DEFAULT NULL CHECK (`risk_level` in ('LOW','MEDIUM','HIGH')),
  `is_cross_border` tinyint(1) DEFAULT 0,
  `notional_amount` decimal(18,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT NULL,
  `current_stage` varchar(50) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'ACTIVE' COMMENT 'On Track, At Risk, Delayed, Blocked, Completed',
  `submitted_by` varchar(100) NOT NULL,
  `product_manager` varchar(255) DEFAULT NULL,
  `pm_team` varchar(100) DEFAULT NULL,
  `template_name` varchar(100) DEFAULT NULL,
  `kickoff_date` date DEFAULT NULL,
  `proposal_preparer` varchar(255) DEFAULT NULL,
  `pac_approval_status` varchar(50) DEFAULT 'N/A',
  `approval_track` varchar(50) DEFAULT NULL COMMENT 'FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN, PROHIBITED',
  `estimated_revenue` decimal(18,2) DEFAULT NULL,
  `predicted_approval_likelihood` decimal(5,2) DEFAULT NULL,
  `predicted_timeline_days` decimal(5,2) DEFAULT NULL,
  `predicted_bottleneck` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `launched_at` timestamp NULL DEFAULT NULL,
  `pir_status` varchar(50) DEFAULT 'NOT_REQUIRED',
  `pir_due_date` date DEFAULT NULL,
  `classification_confidence` decimal(5,2) DEFAULT NULL,
  `classification_method` varchar(30) DEFAULT NULL COMMENT 'AGENT, MANUAL, OVERRIDE',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_prospects`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_prospects` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `theme` varchar(100) DEFAULT NULL,
  `probability` decimal(5,2) DEFAULT NULL,
  `estimated_value` decimal(18,2) DEFAULT NULL,
  `value_currency` varchar(3) DEFAULT 'USD',
  `status` varchar(50) DEFAULT 'Pre-Seed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_risk_checks`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_risk_checks` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `check_layer` varchar(30) NOT NULL,
  `result` varchar(20) NOT NULL COMMENT 'PASS, FAIL, WARNING',
  `matched_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of matched prohibited item IDs' CHECK (json_valid(`matched_items`)),
  `checked_by` varchar(50) DEFAULT 'RISK_AGENT',
  `checked_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_risk_proj` (`project_id`),
  CONSTRAINT `npa_risk_checks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_signoffs`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_signoffs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) DEFAULT NULL,
  `party` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED, REWORK',
  `approver_user_id` varchar(100) DEFAULT NULL,
  `approver_name` varchar(255) DEFAULT NULL,
  `approver_email` varchar(255) DEFAULT NULL,
  `decision_date` timestamp NULL DEFAULT NULL,
  `sla_deadline` timestamp NULL DEFAULT NULL,
  `sla_breached` tinyint(1) DEFAULT 0,
  `started_review_at` timestamp NULL DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `clarification_question` text DEFAULT NULL,
  `clarification_answer` text DEFAULT NULL,
  `clarification_answered_by` varchar(50) DEFAULT NULL COMMENT 'AI or MAKER',
  `loop_back_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_signoffs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `npa_workflow_states`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `npa_workflow_states` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `project_id` varchar(36) NOT NULL,
  `stage_id` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'NOT_STARTED',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `blockers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`blockers`)),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_workflow_states_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_classification_criteria`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_classification_criteria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL COMMENT 'PRODUCT_INNOVATION, MARKET_CUSTOMER, RISK_REGULATORY, FINANCIAL_OPERATIONAL',
  `criterion_code` varchar(20) NOT NULL,
  `criterion_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `indicator_type` varchar(20) NOT NULL DEFAULT 'NTG' COMMENT 'NTG, VARIATION, EXISTING',
  `weight` int(11) NOT NULL DEFAULT 1,
  `threshold_value` int(11) DEFAULT NULL COMMENT 'Score threshold that triggers this criterion',
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `criterion_code` (`criterion_code`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_document_requirements`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_document_requirements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_code` varchar(50) NOT NULL,
  `doc_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(30) NOT NULL COMMENT 'CORE, CONDITIONAL, SUPPLEMENTARY',
  `criticality` varchar(20) NOT NULL COMMENT 'CRITICAL, IMPORTANT, OPTIONAL',
  `required_for` varchar(100) DEFAULT 'ALL' COMMENT 'ALL, FULL_NPA, NPA_LITE, BUNDLING',
  `source` varchar(30) DEFAULT 'BUSINESS' COMMENT 'BUSINESS, AUTO_GENERATED, EXTERNAL, REGULATORY',
  `template_available` tinyint(1) DEFAULT 0,
  `required_by_stage` varchar(50) DEFAULT NULL COMMENT 'CHECKER, SIGN_OFF, LAUNCH, PIR',
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_code` (`doc_code`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_document_rules`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_document_rules` (
  `id` varchar(50) NOT NULL,
  `doc_code` varchar(50) NOT NULL,
  `doc_name` varchar(255) NOT NULL,
  `condition_logic` text NOT NULL,
  `criticality` varchar(20) NOT NULL DEFAULT 'CONDITIONAL',
  `source_party` varchar(50) NOT NULL DEFAULT 'BUSINESS',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_escalation_rules`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_escalation_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `escalation_level` int(11) NOT NULL COMMENT '1=Dept Head, 2=BU Head, 3=GPH, 4=Group COO, 5=CEO',
  `authority_name` varchar(100) NOT NULL,
  `trigger_type` varchar(50) NOT NULL COMMENT 'SLA_BREACH, LOOP_BACK_LIMIT, DISAGREEMENT, RISK_THRESHOLD',
  `trigger_threshold` varchar(50) NOT NULL COMMENT 'e.g. 3 for loop-back count, 48 for hours',
  `action_required` text NOT NULL,
  `auto_escalate` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_field_options`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_field_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `field_id` varchar(50) DEFAULT NULL,
  `value` varchar(100) DEFAULT NULL,
  `label` varchar(100) DEFAULT NULL,
  `order_index` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `field_id` (`field_id`),
  CONSTRAINT `ref_field_options_ibfk_1` FOREIGN KEY (`field_id`) REFERENCES `ref_npa_fields` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_npa_fields`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_npa_fields` (
  `id` varchar(50) NOT NULL,
  `section_id` varchar(50) DEFAULT NULL,
  `field_key` varchar(100) DEFAULT NULL,
  `label` varchar(255) DEFAULT NULL,
  `field_type` varchar(20) DEFAULT NULL COMMENT 'text, decimal, select, date, upload',
  `is_required` tinyint(1) DEFAULT 0,
  `tooltip` text DEFAULT NULL,
  `order_index` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `field_key` (`field_key`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `ref_npa_fields_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `ref_npa_sections` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_npa_sections`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_npa_sections` (
  `id` varchar(50) NOT NULL,
  `template_id` varchar(50) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `order_index` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `ref_npa_sections_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `ref_npa_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_npa_templates`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_npa_templates` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `version` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_prerequisite_categories`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_prerequisite_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_code` varchar(30) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `weight` int(11) NOT NULL DEFAULT 10 COMMENT 'Weight in readiness scorecard (total=100)',
  `description` text DEFAULT NULL,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `category_code` (`category_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_prerequisite_checks`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_prerequisite_checks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `check_code` varchar(50) NOT NULL,
  `check_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `mandatory_for` varchar(100) DEFAULT 'ALL' COMMENT 'ALL, FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN',
  `is_critical` tinyint(1) DEFAULT 0,
  `order_index` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `check_code` (`check_code`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `ref_prerequisite_checks_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `ref_prerequisite_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_prohibited_items`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_prohibited_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `layer` varchar(30) NOT NULL COMMENT 'INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC',
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `jurisdictions` varchar(255) DEFAULT 'ALL',
  `severity` varchar(20) DEFAULT 'HARD_STOP' COMMENT 'HARD_STOP, CONDITIONAL, WARNING',
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `last_synced` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_code` (`item_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `ref_signoff_routing_rules`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `ref_signoff_routing_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `approval_track` varchar(30) NOT NULL COMMENT 'FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN',
  `party_group` varchar(50) NOT NULL COMMENT 'RISK_MGMT, TECH_OPS, LEGAL_COMPLIANCE, FINANCE, INFO_SECURITY',
  `party_name` varchar(100) NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT 1,
  `sla_hours` int(11) NOT NULL DEFAULT 48,
  `can_parallel` tinyint(1) DEFAULT 1,
  `sequence_order` int(11) DEFAULT 0,
  `trigger_condition` text DEFAULT NULL COMMENT 'JSON: conditions that require this signoff',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `users`;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `job_title` varchar(255) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `role` varchar(50) NOT NULL COMMENT 'MAKER, CHECKER, APPROVER, COO, ADMIN',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SET character_set_client = @saved_cs_client;
SET TIME_ZONE=@OLD_TIME_ZONE;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;
SET SQL_NOTES=@OLD_SQL_NOTES;
INSERT IGNORE INTO ref_npa_sections (id, template_id, title, description, order_index)
VALUES
    ('SEC_IDEATION_FULL', 'FULL_NPA_V1', 'Ideation & Concept', 'Early-stage concept notes, rationale, and market analysis captured during ideation', -1),
    ('SEC_IDEATION_STD',  'STD_NPA_V2',  'Ideation & Concept', 'Early-stage concept notes, rationale, and market analysis captured during ideation', 0);
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index)
VALUES
    ('FLD_CONCEPT_NOTES',    'SEC_IDEATION_FULL', 'concept_notes',     'Concept Notes',      'text',    0, 'Freeform ideation and concept notes captured during initial product discussions', 1),
    ('FLD_PROD_RATIONALE',   'SEC_IDEATION_FULL', 'product_rationale', 'Product Rationale',   'text',    0, 'Business rationale and justification for the proposed product',                  2),
    ('FLD_TARGET_MARKET',    'SEC_IDEATION_FULL', 'target_market',     'Target Market',       'text',    0, 'Description of the target market segment and customer base',                     3),
    ('FLD_EST_REVENUE',      'SEC_IDEATION_FULL', 'estimated_revenue', 'Estimated Revenue',   'decimal', 0, 'Estimated annual revenue in USD',                                                4);
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS validity_expiry DATE DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS extension_count INT DEFAULT 0;
ALTER TABLE npa_documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS approval_track_subtype VARCHAR(10) DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_approval_likelihood DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_timeline_days INT DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_bottleneck VARCHAR(200) DEFAULT NULL;
INSERT IGNORE INTO `ref_npa_sections` (`id`, `template_id`, `title`, `description`, `order_index`) VALUES
('PC.I', 'STD_NPA_V2', 'Product Specifications (Basic Information)', 'Core product definition, rationale, and business model', 0),
('PC.II', 'STD_NPA_V2', 'Operational & Technology Information', 'Operating model, booking, technical platform, and resiliency', 1),
('PC.III', 'STD_NPA_V2', 'Pricing Model Details', 'Methodology, assumptions, and validation details', 2),
('PC.IV', 'STD_NPA_V2', 'Risk Analysis', 'Market, liquidity, credit, and reputational risk assessments', 3),
('PC.V', 'STD_NPA_V2', 'Data Management', 'Governance, privacy, and reporting requirements', 4),
('PC.VI', 'STD_NPA_V2', 'Other Risk Identification', 'Additional operational risks and mitigants', 5),
('PC.VII', 'STD_NPA_V2', 'Trading Product Assessment', 'Specific assessment for trading instruments', 6),
('APP.1', 'STD_NPA_V2', 'Appendix 1: Entity/Location', 'Booking and sales entity structure', 7),
('APP.2', 'STD_NPA_V2', 'Appendix 2: Intellectual Property', 'MBS and third-party IP considerations', 8),
('APP.3', 'STD_NPA_V2', 'Appendix 3: Financial Crime', 'AML, sanctions, and fraud risk assessment', 9),
('APP.4', 'STD_NPA_V2', 'Appendix 4: Risk Data Aggregation', 'Compliance with RDAR requirements', 10),
('APP.5', 'STD_NPA_V2', 'Appendix 5: Trading Products', 'Additional info for trading instruments', 11),
('APP.6', 'STD_NPA_V2', 'Appendix 6: Third-Party Platforms', 'Risk assessment for hosted communication channels', 12);
INSERT IGNORE INTO `ref_npa_fields` (`id`, `section_id`, `field_key`, `label`, `field_type`, `is_required`, `tooltip`, `order_index`) VALUES
('FLD_BUSINESS_RATIONALE', 'PC.I', 'business_rationale', 'Business Rationale', 'textarea', 1, NULL, 0),
('FLD_PROBLEM_STATEMENT', 'PC.I', 'problem_statement', 'Problem Statement', 'textarea', 0, NULL, 1),
('FLD_VALUE_PROPOSITION', 'PC.I', 'value_proposition', 'Value Proposition', 'textarea', 0, NULL, 2),
('FLD_CUSTOMER_BENEFIT', 'PC.I', 'customer_benefit', 'Benefits to Customers', 'textarea', 0, NULL, 3),
('FLD_BU_BENEFIT', 'PC.I', 'bu_benefit', 'Benefits to BU/SU', 'textarea', 0, NULL, 4),
('FLD_PRODUCT_NAME', 'PC.I', 'product_name', 'Product Name', 'text', 1, NULL, 5),
('FLD_PRODUCT_TYPE', 'PC.I', 'product_type', 'Product Type', 'dropdown', 0, NULL, 6),
('FLD_UNDERLYING_ASSET', 'PC.I', 'underlying_asset', 'Underlying Asset', 'text', 0, NULL, 7),
('FLD_CURRENCY_DENOMINATION', 'PC.I', 'currency_denomination', 'Currency Denomination', 'dropdown', 0, NULL, 8),
('FLD_TENOR', 'PC.I', 'tenor', 'Tenor', 'text', 0, NULL, 9),
('FLD_FUNDING_TYPE', 'PC.I', 'funding_type', 'Funded vs Unfunded', 'dropdown', 0, NULL, 10),
('FLD_REPRICING_INFO', 'PC.I', 'repricing_info', 'Repricing Information', 'textarea', 0, NULL, 11),
('FLD_PRODUCT_ROLE', 'PC.I', 'product_role', 'Role of Proposing Unit', 'dropdown', 0, NULL, 12),
('FLD_PRODUCT_MATURITY', 'PC.I', 'product_maturity', 'Product Maturity', 'dropdown', 0, NULL, 13),
('FLD_PRODUCT_LIFECYCLE', 'PC.I', 'product_lifecycle', 'Product Life Cycle', 'textarea', 0, NULL, 14),
('FLD_PRODUCT_FEATURES', 'PC.I', 'product_features', 'Product Features Summary', 'textarea', 0, NULL, 15),
('FLD_NOTIONAL_AMOUNT', 'PC.I', 'notional_amount', 'Transaction Volume (Notional)', 'currency', 1, NULL, 16),
('FLD_REVENUE_YEAR1', 'PC.I', 'revenue_year1', 'Revenue Year 1 (Gross)', 'currency', 0, NULL, 17),
('FLD_REVENUE_YEAR1_NET', 'PC.I', 'revenue_year1_net', 'Revenue Year 1 (Net of TP)', 'currency', 0, NULL, 18),
('FLD_REVENUE_YEAR2', 'PC.I', 'revenue_year2', 'Revenue Year 2 (Gross)', 'currency', 0, NULL, 19),
('FLD_REVENUE_YEAR2_NET', 'PC.I', 'revenue_year2_net', 'Revenue Year 2 (Net of TP)', 'currency', 0, NULL, 20),
('FLD_REVENUE_YEAR3', 'PC.I', 'revenue_year3', 'Revenue Year 3 (Gross)', 'currency', 0, NULL, 21),
('FLD_REVENUE_YEAR3_NET', 'PC.I', 'revenue_year3_net', 'Revenue Year 3 (Net of TP)', 'currency', 0, NULL, 22),
('FLD_EXPECTED_VOLUME', 'PC.I', 'expected_volume', 'Expected Annual Volume', 'text', 0, NULL, 23),
('FLD_TARGET_ROI', 'PC.I', 'target_roi', 'Target ROI', 'text', 0, NULL, 24),
('FLD_REVENUE_STREAMS', 'PC.I', 'revenue_streams', 'Revenue Streams', 'bullet_list', 0, NULL, 25),
('FLD_GROSS_MARGIN_SPLIT', 'PC.I', 'gross_margin_split', 'Gross Margin Split', 'textarea', 0, NULL, 26),
('FLD_COST_ALLOCATION', 'PC.I', 'cost_allocation', 'Cost Allocation', 'textarea', 0, NULL, 27),
('FLD_SPV_INVOLVED', 'PC.I', 'spv_involved', 'Is SPV/SPE Involved?', 'yesno', 0, NULL, 28),
('FLD_SPV_DETAILS', 'PC.I', 'spv_details', 'SPV Details', 'textarea', 0, NULL, 29),
('FLD_SPV_ARRANGER', 'PC.I', 'spv_arranger', 'SPV Arranger', 'text', 0, NULL, 30),
('FLD_SPV_COUNTRY', 'PC.I', 'spv_country', 'SPV Country of Incorporation', 'text', 0, NULL, 31),
('FLD_CUSTOMER_SEGMENTS', 'PC.I', 'customer_segments', 'Target Customer Segments', 'multiselect', 0, NULL, 32),
('FLD_CUSTOMER_RESTRICTIONS', 'PC.I', 'customer_restrictions', 'Regulatory Restrictions on Customers', 'textarea', 0, NULL, 33),
('FLD_CUSTOMER_SUITABILITY', 'PC.I', 'customer_suitability', 'Customer Suitability Criteria', 'textarea', 0, NULL, 34),
('FLD_CUSTOMER_MIN_TURNOVER', 'PC.I', 'customer_min_turnover', 'Minimum Annual Turnover', 'currency', 0, NULL, 35),
('FLD_CUSTOMER_GEOGRAPHIC', 'PC.I', 'customer_geographic', 'Geographic Scope', 'multiselect', 0, NULL, 36),
('FLD_DISTRIBUTION_CHANNELS', 'PC.I', 'distribution_channels', 'Distribution Channels', 'multiselect', 0, NULL, 37),
('FLD_CHANNEL_RATIONALE', 'PC.I', 'channel_rationale', 'Multi-Entity/Location Rationale', 'textarea', 0, NULL, 38),
('FLD_SALES_SUITABILITY', 'PC.I', 'sales_suitability', 'Sales Suitability', 'textarea', 0, NULL, 39),
('FLD_ONBOARDING_PROCESS', 'PC.I', 'onboarding_process', 'Customer Onboarding Process', 'textarea', 0, NULL, 40),
('FLD_MARKETING_PLAN', 'PC.I', 'marketing_plan', 'Marketing & Communication Plan', 'textarea', 0, NULL, 41),
('FLD_PAC_REFERENCE', 'PC.I', 'pac_reference', 'PAC Reference Number', 'text', 0, NULL, 42),
('FLD_PAC_CONDITIONS', 'PC.I', 'pac_conditions', 'PAC Conditions List', 'bullet_list', 0, NULL, 43),
('FLD_PAC_DATE', 'PC.I', 'pac_date', 'PAC Approval Date', 'date', 0, NULL, 44),
('FLD_EXTERNAL_PARTIES_INVOLVED', 'PC.I', 'external_parties_involved', 'External Parties Involved?', 'yesno', 0, NULL, 45),
('FLD_IP_CONSIDERATIONS', 'PC.I', 'ip_considerations', 'IP Considerations', 'textarea', 0, NULL, 46),
('FLD_EXTERNAL_PARTY_NAMES', 'PC.I', 'external_party_names', 'External Party Names', 'bullet_list', 0, NULL, 47),
('FLD_RASP_REFERENCE', 'PC.I', 'rasp_reference', 'RASP Baseline Reference', 'text', 0, NULL, 48),
('FLD_ESG_DATA_USED', 'PC.I', 'esg_data_used', 'ESG/Sustainable Data Used?', 'yesno', 0, NULL, 49),
('FLD_FRONT_OFFICE_MODEL', 'PC.II', 'front_office_model', 'Front Office Operating Model', 'textarea', 0, NULL, 50),
('FLD_MIDDLE_OFFICE_MODEL', 'PC.II', 'middle_office_model', 'Middle Office Operating Model', 'textarea', 0, NULL, 51),
('FLD_BACK_OFFICE_MODEL', 'PC.II', 'back_office_model', 'Back Office Operating Model', 'textarea', 0, NULL, 52),
('FLD_THIRD_PARTY_OPS', 'PC.II', 'third_party_ops', 'Third Party Operations', 'textarea', 0, NULL, 53),
('FLD_COLLATERAL_MGMT_OPS', 'PC.II', 'collateral_mgmt_ops', 'Collateral Management Requirements', 'textarea', 0, NULL, 54),
('FLD_BOOKING_LEGAL_FORM', 'PC.II', 'booking_legal_form', 'Booking Legal Form', 'text', 0, NULL, 55),
('FLD_BOOKING_FAMILY', 'PC.II', 'booking_family', 'Booking Family', 'text', 0, NULL, 56),
('FLD_BOOKING_TYPOLOGY', 'PC.II', 'booking_typology', 'Booking Typology', 'text', 0, NULL, 57),
('FLD_PORTFOLIO_ALLOCATION', 'PC.II', 'portfolio_allocation', 'Portfolio Allocation', 'text', 0, NULL, 58),
('FLD_CONFIRMATION_PROCESS', 'PC.II', 'confirmation_process', 'Confirmation Process', 'textarea', 0, NULL, 59),
('FLD_RECONCILIATION', 'PC.II', 'reconciliation', 'Reconciliation', 'textarea', 0, NULL, 60),
('FLD_EXCEPTION_HANDLING', 'PC.II', 'exception_handling', 'Exception & Manual Handling', 'textarea', 0, NULL, 61),
('FLD_ACCOUNTING_TREATMENT', 'PC.II', 'accounting_treatment', 'Accounting Treatment', 'textarea', 0, NULL, 62),
('FLD_SETTLEMENT_FLOW', 'PC.II', 'settlement_flow', 'Settlement Flow Description', 'textarea', 0, NULL, 63),
('FLD_NEW_SYSTEM_CHANGES', 'PC.II', 'new_system_changes', 'New System Changes Required?', 'yesno', 0, NULL, 64),
('FLD_BOOKING_SYSTEM', 'PC.II', 'booking_system', 'Booking System', 'dropdown', 0, NULL, 65),
('FLD_TECH_REQUIREMENTS', 'PC.II', 'tech_requirements', 'Technology Requirements', 'textarea', 0, NULL, 66),
('FLD_SYSTEM_INTEGRATION', 'PC.II', 'system_integration', 'System Integration Scope', 'textarea', 0, NULL, 67),
('FLD_VALUATION_MODEL', 'PC.II', 'valuation_model', 'Valuation Model', 'textarea', 0, NULL, 68),
('FLD_FO_SYSTEM_CHANGES', 'PC.II', 'fo_system_changes', 'Front Office System Changes', 'textarea', 0, NULL, 69),
('FLD_SETTLEMENT_METHOD', 'PC.II', 'settlement_method', 'Settlement Method', 'dropdown', 0, NULL, 70),
('FLD_BE_SYSTEM_CHANGES', 'PC.II', 'be_system_changes', 'Back End System Changes', 'textarea', 0, NULL, 71),
('FLD_MANUAL_WORKAROUNDS', 'PC.II', 'manual_workarounds', 'Manual Work-Arounds', 'textarea', 0, NULL, 72),
('FLD_SYSTEM_ENHANCEMENTS', 'PC.II', 'system_enhancements', 'System Enhancements Involved?', 'yesno', 0, NULL, 73),
('FLD_ISS_DEVIATIONS', 'PC.II', 'iss_deviations', 'ISS Policy Deviations', 'textarea', 0, NULL, 74),
('FLD_PENTEST_STATUS', 'PC.II', 'pentest_status', 'Penetration Test Status', 'dropdown', 0, NULL, 75),
('FLD_SECURITY_ASSESSMENT', 'PC.II', 'security_assessment', 'Security Assessment Details', 'textarea', 0, NULL, 76),
('FLD_GRC_ID', 'PC.II', 'grc_id', 'GRC ID (External Party Risk)', 'text', 0, NULL, 77),
('FLD_HSM_REQUIRED', 'PC.II', 'hsm_required', 'HSM Required?', 'yesno', 0, NULL, 78),
('FLD_RTO_TARGET', 'PC.II', 'rto_target', 'Recovery Time Objective (RTO)', 'text', 0, NULL, 79),
('FLD_RPO_TARGET', 'PC.II', 'rpo_target', 'Recovery Point Objective (RPO)', 'text', 0, NULL, 80),
('FLD_DR_TESTING_PLAN', 'PC.II', 'dr_testing_plan', 'DR Testing Plan', 'textarea', 0, NULL, 81),
('FLD_BIA_CONSIDERATIONS', 'PC.II', 'bia_considerations', 'BIA Considerations', 'textarea', 0, NULL, 82),
('FLD_BCP_REQUIREMENTS', 'PC.II', 'bcp_requirements', 'Updated BCP Requirements', 'textarea', 0, NULL, 83),
('FLD_CONTINUITY_MEASURES', 'PC.II', 'continuity_measures', 'Additional Continuity Measures', 'textarea', 0, NULL, 84),
('FLD_PRICING_MODEL_REQUIRED', 'PC.III', 'pricing_model_required', 'Pricing Model Validation Required?', 'yesno', 0, NULL, 85),
('FLD_PRICING_METHODOLOGY', 'PC.III', 'pricing_methodology', 'Pricing Methodology', 'textarea', 0, NULL, 86),
('FLD_ROAE_ANALYSIS', 'PC.III', 'roae_analysis', 'ROAE Analysis', 'textarea', 0, NULL, 87),
('FLD_PRICING_ASSUMPTIONS', 'PC.III', 'pricing_assumptions', 'Pricing Assumptions', 'textarea', 0, NULL, 88),
('FLD_BESPOKE_ADJUSTMENTS', 'PC.III', 'bespoke_adjustments', 'Bespoke Adjustments', 'textarea', 0, NULL, 89),
('FLD_PRICING_MODEL_NAME', 'PC.III', 'pricing_model_name', 'Pricing Model Name', 'text', 0, NULL, 90),
('FLD_MODEL_VALIDATION_DATE', 'PC.III', 'model_validation_date', 'Model Validation Date', 'date', 0, NULL, 91),
('FLD_MODEL_RESTRICTIONS', 'PC.III', 'model_restrictions', 'Model Restrictions', 'textarea', 0, NULL, 92),
('FLD_RISK_DATA_ASSESSMENT_REF', 'PC.III', 'risk_data_assessment_ref', 'Risk Data Assessment Tool Reference', 'text', 0, NULL, 93),
('FLD_SIMM_TREATMENT', 'PC.III', 'simm_treatment', 'SIMM Treatment', 'textarea', 0, NULL, 94),
('FLD_SIMM_SENSITIVITIES', 'PC.III', 'simm_sensitivities', 'SIMM Sensitivities', 'textarea', 0, NULL, 95),
('FLD_LEGAL_OPINION', 'PC.IV', 'legal_opinion', 'Legal Opinion', 'textarea', 0, NULL, 96),
('FLD_LICENSING_REQUIREMENTS', 'PC.IV', 'licensing_requirements', 'Licensing Requirements', 'textarea', 0, NULL, 97),
('FLD_PRIMARY_REGULATION', 'PC.IV', 'primary_regulation', 'Primary Regulation', 'text', 0, NULL, 98),
('FLD_SECONDARY_REGULATIONS', 'PC.IV', 'secondary_regulations', 'Secondary Regulations', 'bullet_list', 0, NULL, 99),
('FLD_REGULATORY_REPORTING', 'PC.IV', 'regulatory_reporting', 'Regulatory Reporting', 'textarea', 0, NULL, 100),
('FLD_CROSS_BORDER_REGULATIONS', 'PC.IV', 'cross_border_regulations', 'Cross-Border Regulatory Considerations', 'textarea', 0, NULL, 101),
('FLD_LEGAL_DOCS_REQUIRED', 'PC.IV', 'legal_docs_required', 'Legal Documentation Required', 'bullet_list', 0, NULL, 102),
('FLD_SANCTIONS_CHECK', 'PC.IV', 'sanctions_check', 'Sanctions Check', 'yesno', 0, NULL, 103),
('FLD_AML_CONSIDERATIONS', 'PC.IV', 'aml_considerations', 'AML Considerations', 'textarea', 0, NULL, 104),
('FLD_TAX_IMPACT', 'PC.IV', 'tax_impact', 'Tax Impact', 'textarea', 0, NULL, 105),
('FLD_ACCOUNTING_BOOK', 'PC.IV', 'accounting_book', 'Trading Book vs Banking Book', 'dropdown', 0, NULL, 106),
('FLD_FAIR_VALUE_TREATMENT', 'PC.IV', 'fair_value_treatment', 'Fair Value Treatment', 'textarea', 0, NULL, 107),
('FLD_ON_OFF_BALANCE', 'PC.IV', 'on_off_balance', 'On/Off Balance Sheet', 'dropdown', 0, NULL, 108),
('FLD_TAX_JURISDICTIONS', 'PC.IV', 'tax_jurisdictions', 'Tax Jurisdictions Analysis', 'textarea', 0, NULL, 109),
('FLD_MARKET_RISK', 'PC.IV', 'market_risk', 'Market Risk Assessment', 'textarea', 1, NULL, 110),
('FLD_RISK_CLASSIFICATION', 'PC.IV', 'risk_classification', 'Risk Classification', 'dropdown', 0, NULL, 111),
('FLD_PRICING_PARAMETERS', 'PC.IV', 'pricing_parameters', 'Relevant Pricing Parameters', 'textarea', 0, NULL, 112),
('FLD_MRF_IR_DELTA', 'PC.IV', 'mrf_ir_delta', 'MRF: IR Delta', 'yesno', 0, NULL, 113),
('FLD_MRF_IR_VEGA', 'PC.IV', 'mrf_ir_vega', 'MRF: IR Vega', 'yesno', 0, NULL, 114),
('FLD_MRF_IR_GAMMA', 'PC.IV', 'mrf_ir_gamma', 'MRF: IR Gamma', 'yesno', 0, NULL, 115),
('FLD_MRF_FX_DELTA', 'PC.IV', 'mrf_fx_delta', 'MRF: FX Delta', 'yesno', 0, NULL, 116),
('FLD_MRF_FX_VEGA', 'PC.IV', 'mrf_fx_vega', 'MRF: FX Vega', 'yesno', 0, NULL, 117),
('FLD_MRF_EQ_DELTA', 'PC.IV', 'mrf_eq_delta', 'MRF: Equity Delta', 'yesno', 0, NULL, 118),
('FLD_MRF_EQ_VEGA', 'PC.IV', 'mrf_eq_vega', 'MRF: Equity Vega', 'yesno', 0, NULL, 119),
('FLD_MRF_COMMODITY', 'PC.IV', 'mrf_commodity', 'MRF: Commodity', 'yesno', 0, NULL, 120),
('FLD_MRF_CREDIT', 'PC.IV', 'mrf_credit', 'MRF: Credit', 'yesno', 0, NULL, 121),
('FLD_MRF_CORRELATION', 'PC.IV', 'mrf_correlation', 'MRF: Correlation', 'yesno', 0, NULL, 122),
('FLD_LIQUIDITY_RISK', 'PC.IV', 'liquidity_risk', 'Funding/Liquidity Risk', 'textarea', 0, NULL, 123),
('FLD_LIQUIDITY_COST', 'PC.IV', 'liquidity_cost', 'Corporate Risk Liquidity Cost', 'textarea', 0, NULL, 124),
('FLD_CONTINGENT_CASHFLOW', 'PC.IV', 'contingent_cashflow', 'Contingent Cash Flow Risk', 'yesno', 0, NULL, 125),
('FLD_CONTINGENT_CASHFLOW_DESC', 'PC.IV', 'contingent_cashflow_desc', 'Contingent Cash Flow Description', 'textarea', 0, NULL, 126),
('FLD_TRADING_BOOK_ASSIGNMENT', 'PC.IV', 'trading_book_assignment', 'Trading Book Assignment Confirmed?', 'yesno', 0, NULL, 127),
('FLD_REGULATORY_CAPITAL', 'PC.IV', 'regulatory_capital', 'Regulatory Capital Requirements', 'textarea', 0, NULL, 128),
('FLD_VAR_CAPTURE', 'PC.IV', 'var_capture', 'VaR Capture', 'textarea', 0, NULL, 129),
('FLD_MODEL_VALIDATION_PROC', 'PC.IV', 'model_validation_proc', 'Model Validation Procedures', 'textarea', 0, NULL, 130),
('FLD_CREDIT_RISK', 'PC.IV', 'credit_risk', 'Credit Risk Assessment', 'textarea', 1, NULL, 131),
('FLD_NEW_LIMIT_TYPES', 'PC.IV', 'new_limit_types', 'New Credit Limit Types Required?', 'yesno', 0, NULL, 132),
('FLD_CREDIT_SUPPORT_REQUIRED', 'PC.IV', 'credit_support_required', 'Credit Support Required?', 'yesno', 0, NULL, 133),
('FLD_COUNTERPARTY_DEFAULT', 'PC.IV', 'counterparty_default', 'Risk Mitigation Measures', 'textarea', 0, NULL, 134),
('FLD_COLLATERAL_FRAMEWORK', 'PC.IV', 'collateral_framework', 'Collateral Framework', 'textarea', 0, NULL, 135),
('FLD_STRESS_TEST_RESULTS', 'PC.IV', 'stress_test_results', 'Stress Test Results', 'textarea', 0, NULL, 136),
('FLD_STRESS_SCENARIOS', 'PC.IV', 'stress_scenarios', 'Stress Scenarios', 'textarea', 0, NULL, 137),
('FLD_EXPOSURE_LIMITS', 'PC.IV', 'exposure_limits', 'Limits to Cover Exposure', 'textarea', 0, NULL, 138),
('FLD_MONITORING_PARTY', 'PC.IV', 'monitoring_party', 'Monitoring Party', 'text', 0, NULL, 139),
('FLD_CUSTODY_RISK', 'PC.IV', 'custody_risk', 'Custody Risk', 'textarea', 0, NULL, 140),
('FLD_COLLATERAL_RISK_RATED', 'PC.IV', 'collateral_risk_rated', 'Collateral Risk-Rated per Core Policy?', 'yesno', 0, NULL, 141),
('FLD_COUNTERPARTY_RATING', 'PC.IV', 'counterparty_rating', 'Counterparty Rating', 'text', 0, NULL, 142),
('FLD_PFE_STANDARDS', 'PC.IV', 'pfe_standards', 'PFE Standards (Standardized Approach)', 'textarea', 0, NULL, 143),
('FLD_EAD_CALCULATION', 'PC.IV', 'ead_calculation', 'EAD & Capital (Internal Model)', 'textarea', 0, NULL, 144),
('FLD_LARGE_EXPOSURE_RULES', 'PC.IV', 'large_exposure_rules', 'Large Exposure Rules', 'textarea', 0, NULL, 145),
('FLD_CONCENTRATION_LIMITS', 'PC.IV', 'concentration_limits', 'Concentration Limits', 'textarea', 0, NULL, 146),
('FLD_CCR_FRAMEWORK', 'PC.IV', 'ccr_framework', 'Counterparty Credit Risk Framework', 'textarea', 0, NULL, 147),
('FLD_REPUTATIONAL_RISK', 'PC.IV', 'reputational_risk', 'Reputational Risk Assessment', 'textarea', 0, NULL, 148),
('FLD_NEGATIVE_IMPACT', 'PC.IV', 'negative_impact', 'Potential Negative Impact?', 'yesno', 0, NULL, 149),
('FLD_ESG_ASSESSMENT', 'PC.IV', 'esg_assessment', 'ESG Assessment', 'textarea', 0, NULL, 150),
('FLD_ESG_CLASSIFICATION', 'PC.IV', 'esg_classification', 'ESG Classification', 'dropdown', 0, NULL, 151),
('FLD_DATA_GOVERNANCE', 'PC.V', 'data_governance', 'Data Governance Framework', 'textarea', 0, NULL, 152),
('FLD_DATA_OWNERSHIP', 'PC.V', 'data_ownership', 'Data Ownership', 'text', 0, NULL, 153),
('FLD_DATA_STEWARDSHIP', 'PC.V', 'data_stewardship', 'Data Stewardship', 'text', 0, NULL, 154),
('FLD_DATA_QUALITY_MONITORING', 'PC.V', 'data_quality_monitoring', 'Data Quality Monitoring', 'textarea', 0, NULL, 155),
('FLD_DATA_PRIVACY', 'PC.V', 'data_privacy', 'Data Privacy Assessment', 'textarea', 0, NULL, 156),
('FLD_DATA_RETENTION', 'PC.V', 'data_retention', 'Data Retention Policy', 'textarea', 0, NULL, 157),
('FLD_GDPR_COMPLIANCE', 'PC.V', 'gdpr_compliance', 'GDPR/Privacy Compliance', 'yesno', 0, NULL, 158),
('FLD_PURE_ASSESSMENT_ID', 'PC.V', 'pure_assessment_id', 'PURE Assessment ID', 'text', 0, NULL, 159),
('FLD_PURE_PURPOSEFUL', 'PC.V', 'pure_purposeful', 'PURE: Purposeful', 'textarea', 0, NULL, 160),
('FLD_PURE_UNSURPRISING', 'PC.V', 'pure_unsurprising', 'PURE: Unsurprising', 'textarea', 0, NULL, 161),
('FLD_PURE_RESPECTFUL', 'PC.V', 'pure_respectful', 'PURE: Respectful', 'textarea', 0, NULL, 162),
('FLD_PURE_EXPLAINABLE', 'PC.V', 'pure_explainable', 'PURE: Explainable', 'textarea', 0, NULL, 163),
('FLD_REPORTING_REQUIREMENTS', 'PC.V', 'reporting_requirements', 'Risk Data Aggregation & Reporting', 'textarea', 0, NULL, 164),
('FLD_AUTOMATED_REPORTING', 'PC.V', 'automated_reporting', 'Automated Regulatory Reporting', 'textarea', 0, NULL, 165),
('FLD_OTHER_RISKS_EXIST', 'PC.VI', 'other_risks_exist', 'Other Risks Not Described in I-V?', 'yesno', 0, NULL, 166),
('FLD_OPERATIONAL_RISK', 'PC.VI', 'operational_risk', 'Operational Risk Assessment', 'textarea', 0, NULL, 167),
('FLD_ADDITIONAL_RISK_MITIGANTS', 'PC.VI', 'additional_risk_mitigants', 'Additional Risk Mitigants', 'bullet_list', 0, NULL, 168),
('FLD_TRADING_PRODUCT', 'PC.VII', 'trading_product', 'Involves Trading Product?', 'yesno', 0, NULL, 169),
('FLD_APPENDIX5_REQUIRED', 'PC.VII', 'appendix5_required', 'Appendix 5 Assessment Required?', 'yesno', 0, NULL, 170),
('FLD_BOOKING_ENTITY', 'APP.1', 'booking_entity', 'Booking Entity', 'text', 1, NULL, 171),
('FLD_SALES_ENTITY', 'APP.1', 'sales_entity', 'Sales / Origination Entity', 'text', 0, NULL, 172),
('FLD_SALES_LOCATION', 'APP.1', 'sales_location', 'Sales / Origination Location', 'text', 0, NULL, 173),
('FLD_BOOKING_LOCATION', 'APP.1', 'booking_location', 'Booking Location', 'text', 0, NULL, 174),
('FLD_RISK_TAKING_ENTITY', 'APP.1', 'risk_taking_entity', 'Risk Taking Entity', 'text', 0, NULL, 175),
('FLD_RISK_TAKING_LOCATION', 'APP.1', 'risk_taking_location', 'Risk Taking Location', 'text', 0, NULL, 176),
('FLD_PROCESSING_ENTITY', 'APP.1', 'processing_entity', 'Processing Entity', 'text', 0, NULL, 177),
('FLD_PROCESSING_LOCATION', 'APP.1', 'processing_location', 'Processing Location', 'text', 0, NULL, 178),
('FLD_COUNTERPARTY', 'APP.1', 'counterparty', 'Counterparty', 'text', 0, NULL, 179),
('FLD_MBS_IP_EXISTS', 'APP.2', 'mbs_ip_exists', 'MBS IP Created/Used?', 'yesno', 0, NULL, 180),
('FLD_MBS_IP_DETAILS', 'APP.2', 'mbs_ip_details', 'MBS IP Details', 'textarea', 0, NULL, 181),
('FLD_THIRD_PARTY_IP_EXISTS', 'APP.2', 'third_party_ip_exists', 'Third Party IP Used?', 'yesno', 0, NULL, 182),
('FLD_THIRD_PARTY_IP_DETAILS', 'APP.2', 'third_party_ip_details', 'Third Party IP Details', 'textarea', 0, NULL, 183),
('FLD_IP_LICENSING', 'APP.2', 'ip_licensing', 'IP Licensing Arrangements', 'textarea', 0, NULL, 184),
('FLD_AML_ASSESSMENT', 'APP.3', 'aml_assessment', 'AML Assessment', 'textarea', 1, NULL, 185),
('FLD_TERRORISM_FINANCING', 'APP.3', 'terrorism_financing', 'Terrorism Financing Risk', 'textarea', 0, NULL, 186),
('FLD_SANCTIONS_ASSESSMENT', 'APP.3', 'sanctions_assessment', 'Sanctions Assessment', 'textarea', 0, NULL, 187),
('FLD_FRAUD_RISK', 'APP.3', 'fraud_risk', 'Fraud Risk Assessment', 'textarea', 0, NULL, 188),
('FLD_BRIBERY_CORRUPTION', 'APP.3', 'bribery_corruption', 'Bribery & Corruption Risk', 'textarea', 0, NULL, 189),
('FLD_FC_RISK_RATING', 'APP.3', 'fc_risk_rating', 'Overall Financial Crime Risk Rating', 'dropdown', 0, NULL, 190),
('FLD_FC_MITIGATION_MEASURES', 'APP.3', 'fc_mitigation_measures', 'FC Mitigation Measures', 'bullet_list', 0, NULL, 191),
('FLD_RDA_COMPLIANCE', 'APP.4', 'rda_compliance', 'RDA Regulatory Compliance', 'textarea', 0, NULL, 192),
('FLD_RDA_DATA_SOURCES', 'APP.4', 'rda_data_sources', 'Risk Data Sources', 'bullet_list', 0, NULL, 193),
('FLD_RDA_AGGREGATION_METHOD', 'APP.4', 'rda_aggregation_method', 'Data Aggregation Methodology', 'textarea', 0, NULL, 194),
('FLD_APP5_REVENUE_SHARING', 'APP.5', 'app5_revenue_sharing', 'Revenue Sharing Model', 'textarea', 0, NULL, 195),
('FLD_APP5_CAPITAL_ALLOCATION', 'APP.5', 'app5_capital_allocation', 'Capital Allocation', 'textarea', 0, NULL, 196),
('FLD_APP5_HEDGE_PURPOSE', 'APP.5', 'app5_hedge_purpose', 'Hedge Purpose?', 'yesno', 0, NULL, 197),
('FLD_APP5_HEDGE_DESCRIPTION', 'APP.5', 'app5_hedge_description', 'Hedge Description', 'textarea', 0, NULL, 198),
('FLD_COLLATERAL_TYPES', 'APP.5', 'collateral_types', 'Collateral Types', 'multiselect', 0, NULL, 199),
('FLD_CUSTODY_ARRANGEMENTS', 'APP.5', 'custody_arrangements', 'Custody Arrangements', 'textarea', 0, NULL, 200),
('FLD_VALUATION_METHOD', 'APP.5', 'valuation_method', 'Valuation Method', 'textarea', 0, NULL, 201),
('FLD_FUNDING_SOURCE', 'APP.5', 'funding_source', 'Funding Source', 'textarea', 0, NULL, 202),
('FLD_BOOKING_SCHEMA', 'APP.5', 'booking_schema', 'Booking Schema', 'textarea', 0, NULL, 203),
('FLD_LIFECYCLE_MANAGEMENT', 'APP.5', 'lifecycle_management', 'Lifecycle Management', 'textarea', 0, NULL, 204),
('FLD_CROSS_PRODUCT_INTEGRATION', 'APP.5', 'cross_product_integration', 'Cross-Product Integration', 'textarea', 0, NULL, 205),
('FLD_APP5_TECH_ARCHITECTURE', 'APP.5', 'app5_tech_architecture', 'Technology Architecture', 'textarea', 0, NULL, 206),
('FLD_APP5_SECURITY_REQ', 'APP.5', 'app5_security_req', 'Security Requirements', 'textarea', 0, NULL, 207),
('FLD_APP5_SCALABILITY', 'APP.5', 'app5_scalability', 'Scalability Requirements', 'textarea', 0, NULL, 208),
('FLD_APP5_COMPLIANCE_FRAMEWORK', 'APP.5', 'app5_compliance_framework', 'Compliance Framework', 'textarea', 0, NULL, 209),
('FLD_APP5_REG_MONITORING', 'APP.5', 'app5_reg_monitoring', 'Regulatory Monitoring', 'textarea', 0, NULL, 210),
('FLD_THIRD_PARTY_PLATFORM', 'APP.6', 'third_party_platform', 'Third-Party Platform Used?', 'yesno', 0, NULL, 211),
('FLD_PLATFORM_NAME', 'APP.6', 'platform_name', 'Platform Name', 'text', 0, NULL, 212),
('FLD_PLATFORM_RISK_ASSESSMENT', 'APP.6', 'platform_risk_assessment', 'Platform Risk Assessment', 'textarea', 0, NULL, 213),
('FLD_INFO_SECURITY_ASSESSMENT', 'APP.6', 'info_security_assessment', 'Information Security Assessment', 'textarea', 0, NULL, 214),
('FLD_DATA_RESIDENCY', 'APP.6', 'data_residency', 'Data Residency Consideration', 'textarea', 0, NULL, 215),
('FLD_PRODUCT_CURRENCY_PAIR', 'PC.I', 'product_currency_pair', 'Currency Pair (if FX)', 'text', 0, NULL, 216),
('FLD_PRODUCT_BENCHMARK', 'PC.I', 'product_benchmark', 'Benchmark / Reference Rate', 'text', 0, NULL, 217),
('FLD_PRODUCT_NOTIONAL_CCY', 'PC.I', 'product_notional_ccy', 'Notional Currency', 'dropdown', 0, NULL, 218),
('FLD_TRANSFER_PRICING', 'PC.I', 'transfer_pricing', 'Transfer Pricing Methodology', 'textarea', 0, NULL, 219),
('FLD_BREAK_EVEN_TIMELINE', 'PC.I', 'break_even_timeline', 'Break-Even Timeline', 'text', 0, NULL, 220),
('FLD_COMPETITIVE_LANDSCAPE', 'PC.I', 'competitive_landscape', 'Competitive Landscape', 'textarea', 0, NULL, 221),
('FLD_MARKET_OPPORTUNITY', 'PC.I', 'market_opportunity', 'Market Opportunity Assessment', 'textarea', 0, NULL, 222),
('FLD_CUSTOMER_ACCREDITATION', 'PC.I', 'customer_accreditation', 'Customer Accreditation Requirements', 'textarea', 0, NULL, 223),
('FLD_KYC_REQUIREMENTS', 'PC.I', 'kyc_requirements', 'KYC/CDD Requirements', 'textarea', 0, NULL, 224),
('FLD_COMPLAINTS_HANDLING', 'PC.I', 'complaints_handling', 'Complaints Handling Process', 'textarea', 0, NULL, 225),
('FLD_TRADE_CAPTURE_SYSTEM', 'PC.II', 'trade_capture_system', 'Trade Capture System', 'text', 0, NULL, 226),
('FLD_RISK_SYSTEM', 'PC.II', 'risk_system', 'Risk Management System', 'text', 0, NULL, 227),
('FLD_REPORTING_SYSTEM', 'PC.II', 'reporting_system', 'Reporting System', 'text', 0, NULL, 228),
('FLD_STP_RATE', 'PC.II', 'stp_rate', 'Expected STP Rate', 'text', 0, NULL, 229),
('FLD_NOSTRO_ACCOUNTS', 'PC.II', 'nostro_accounts', 'Nostro Account Requirements', 'textarea', 0, NULL, 230),
('FLD_MKTDATA_REQUIREMENTS', 'PC.II', 'mktdata_requirements', 'Market Data Requirements', 'textarea', 0, NULL, 231),
('FLD_FVA_ADJUSTMENT', 'PC.III', 'fva_adjustment', 'FVA Adjustment', 'textarea', 0, NULL, 232),
('FLD_XVA_TREATMENT', 'PC.III', 'xva_treatment', 'XVA Treatment', 'textarea', 0, NULL, 233),
('FLD_DAY_COUNT_CONVENTION', 'PC.III', 'day_count_convention', 'Day Count Convention', 'dropdown', 0, NULL, 234),
('FLD_WRONG_WAY_RISK', 'PC.IV', 'wrong_way_risk', 'Wrong-Way Risk', 'textarea', 0, NULL, 235),
('FLD_CVA_DVA_IMPACT', 'PC.IV', 'cva_dva_impact', 'CVA/DVA Impact', 'textarea', 0, NULL, 236),
('FLD_NETTING_AGREEMENTS', 'PC.IV', 'netting_agreements', 'Netting Agreements', 'textarea', 0, NULL, 237),
('FLD_ISDA_MASTER', 'PC.IV', 'isda_master', 'ISDA Master Agreement', 'yesno', 0, NULL, 238),
('FLD_CSA_IN_PLACE', 'PC.IV', 'csa_in_place', 'CSA in Place', 'yesno', 0, NULL, 239),
('FLD_COUNTRY_RISK', 'PC.IV', 'country_risk', 'Country Risk Assessment', 'textarea', 0, NULL, 240),
('FLD_MODEL_RISK', 'PC.IV', 'model_risk', 'Model Risk', 'textarea', 0, NULL, 241),
('FLD_DATA_LINEAGE', 'PC.V', 'data_lineage', 'Data Lineage Documentation', 'textarea', 0, NULL, 242),
('FLD_DATA_CLASSIFICATION', 'PC.V', 'data_classification', 'Data Classification Level', 'dropdown', 0, NULL, 243),
('FLD_HEDGE_ENTITY', 'APP.1', 'hedge_entity', 'Hedge Entity', 'text', 0, NULL, 244),
('FLD_HEDGE_LOCATION', 'APP.1', 'hedge_location', 'Hedge Location', 'text', 0, NULL, 245),
('FLD_CLEARING_ENTITY', 'APP.1', 'clearing_entity', 'Clearing Entity', 'text', 0, NULL, 246),
('FLD_MARGIN_METHODOLOGY', 'APP.5', 'margin_methodology', 'Margin Methodology', 'textarea', 0, NULL, 247),
('FLD_CLOSE_OUT_NETTING', 'APP.5', 'close_out_netting', 'Close-Out Netting', 'textarea', 0, NULL, 248),
('FLD_TRADE_REPORTING', 'APP.5', 'trade_reporting', 'Trade Reporting Requirements', 'textarea', 0, NULL, 249),
('FLD_CLEARING_OBLIGATION', 'APP.5', 'clearing_obligation', 'Clearing Obligation', 'yesno', 0, NULL, 250),
('FLD_CUSTOMER_OBJECTIVES', 'PC.I', 'customer_objectives', 'Customer Objectives & Risk Profile', 'textarea', 0, NULL, 251),
('FLD_CUSTOMER_KEY_RISKS', 'PC.I', 'customer_key_risks', 'Key Risks Faced by Target Customers', 'textarea', 0, NULL, 252),
('FLD_SALES_SURVEILLANCE', 'PC.I', 'sales_surveillance', 'Sales Surveillance Process', 'textarea', 0, NULL, 253),
('FLD_STAFF_TRAINING', 'PC.I', 'staff_training', 'Staff Training Requirements', 'textarea', 0, NULL, 254),
('FLD_OPS_ADEQUACY_CHECKLIST', 'PC.II', 'ops_adequacy_checklist', 'Operational Adequacy Checklist', 'checkbox_group', 0, NULL, 255),
('FLD_OPERATING_ACCOUNT_CONTROLS', 'PC.II', 'operating_account_controls', 'Operating Account Controls', 'textarea', 0, NULL, 256),
('FLD_LIMIT_STRUCTURE', 'PC.II', 'limit_structure', 'Limit Structure', 'textarea', 0, NULL, 257),
('FLD_LIMIT_MONITORING', 'PC.II', 'limit_monitoring', 'Limit Monitoring Process', 'textarea', 0, NULL, 258),
('FLD_MANUAL_FALLBACK', 'PC.II', 'manual_fallback', 'Manual Process Fallback Required?', 'yesno', 0, NULL, 259),
('FLD_MANUAL_FALLBACK_DETAILS', 'PC.II', 'manual_fallback_details', 'Manual Fallback Details', 'textarea', 0, NULL, 260),
('FLD_COLLATERAL_ELIGIBILITY', 'PC.II', 'collateral_eligibility', 'Eligible Collateral Types', 'textarea', 0, NULL, 261),
('FLD_COLLATERAL_HAIRCUTS', 'PC.II', 'collateral_haircuts', 'Collateral Haircuts', 'textarea', 0, NULL, 262),
('FLD_MARGIN_FREQUENCY', 'PC.II', 'margin_frequency', 'Margining Frequency', 'dropdown', 0, NULL, 263),
('FLD_COLLATERAL_DISPUTES', 'PC.II', 'collateral_disputes', 'Collateral Dispute Resolution', 'textarea', 0, NULL, 264),
('FLD_CUSTODY_REQUIRED', 'PC.II', 'custody_required', 'Custody Account Required?', 'yesno', 0, NULL, 265),
('FLD_CUSTODY_DETAILS', 'PC.II', 'custody_details', 'Custody Arrangement Details', 'textarea', 0, NULL, 266),
('FLD_TRADE_REPOSITORY_REPORTING', 'PC.II', 'trade_repository_reporting', 'Trade Repository / ESFR Reporting', 'textarea', 0, NULL, 267),
('FLD_SFEMC_REFERENCES', 'PC.II', 'sfemc_references', 'SFEMC / Code of Conduct References', 'textarea', 0, NULL, 268),
('FLD_BCM_CRITICAL_PROCESSES', 'PC.II', 'bcm_critical_processes', 'Critical Business Processes', 'textarea', 0, NULL, 269),
('FLD_BCM_RECOVERY_STRATEGY', 'PC.II', 'bcm_recovery_strategy', 'Recovery Strategy', 'textarea', 0, NULL, 270),
('FLD_BCM_ALTERNATE_SITE', 'PC.II', 'bcm_alternate_site', 'Alternate Site Arrangements', 'textarea', 0, NULL, 271),
('FLD_BCM_COMMUNICATION_PLAN', 'PC.II', 'bcm_communication_plan', 'Crisis Communication Plan', 'textarea', 0, NULL, 272),
('FLD_BCM_TESTING_FREQUENCY', 'PC.II', 'bcm_testing_frequency', 'BCM Testing Frequency', 'dropdown', 0, NULL, 273),
('FLD_BCM_VENDOR_DEPENDENCIES', 'PC.II', 'bcm_vendor_dependencies', 'Vendor/Third-Party Dependencies', 'textarea', 0, NULL, 274),
('FLD_BCM_STAFF_AWARENESS', 'PC.II', 'bcm_staff_awareness', 'Staff Awareness & Training', 'textarea', 0, NULL, 275),
('FLD_BCM_REGULATORY_COMPLIANCE', 'PC.II', 'bcm_regulatory_compliance', 'BCM Regulatory Compliance', 'textarea', 0, NULL, 276),
('FLD_BCM_INCIDENT_RESPONSE', 'PC.II', 'bcm_incident_response', 'Incident Response Plan', 'textarea', 0, NULL, 277),
('FLD_SIMM_BACKTESTING', 'PC.III', 'simm_backtesting', 'SIMM Backtesting Results', 'textarea', 0, NULL, 278),
('FLD_SERVICE_OUTPUT_FEES', 'PC.IV', 'service_output_fees', 'Service Output Fees', 'textarea', 0, NULL, 279),
('FLD_SERVICE_FEE_STRUCTURE', 'PC.IV', 'service_fee_structure', 'Fee Structure Details', 'textarea', 0, NULL, 280),
('FLD_SERVICE_FEE_ALLOCATION', 'PC.IV', 'service_fee_allocation', 'Fee Allocation Methodology', 'textarea', 0, NULL, 281),
('FLD_REG_MATCHING_IFRS', 'PC.IV', 'reg_matching_ifrs', 'IFRS Regulatory Matching', 'textarea', 0, NULL, 282),
('FLD_REG_MATCHING_MAS', 'PC.IV', 'reg_matching_mas', 'MAS Notice Regulatory Matching', 'textarea', 0, NULL, 283),
('FLD_REG_MATCHING_GST', 'PC.IV', 'reg_matching_gst', 'GST Treatment', 'textarea', 0, NULL, 284),
('FLD_REG_MATCHING_WHT', 'PC.IV', 'reg_matching_wht', 'Withholding Tax Treatment', 'textarea', 0, NULL, 285),
('FLD_FC_CONDUCT_CONSIDERATIONS', 'PC.IV', 'fc_conduct_considerations', 'Conduct Considerations', 'textarea', 0, NULL, 286),
('FLD_FC_MAR_ASSESSMENT', 'PC.IV', 'fc_mar_assessment', 'MAR Assessment', 'textarea', 0, NULL, 287),
('FLD_FC_MAR_SUB_ITEMS', 'PC.IV', 'fc_mar_sub_items', 'MAR Sub-Items (MAS References)', 'bullet_list', 0, NULL, 288),
('FLD_FC_MRA_BOUNDARY_TEST', 'PC.IV', 'fc_mra_boundary_test', 'MRA Boundary Test Required?', 'yesno', 0, NULL, 289),
('FLD_FC_MRA_DETAILS', 'PC.IV', 'fc_mra_details', 'MRA Boundary Test Details', 'textarea', 0, NULL, 290),
('FLD_FLR_LCR_NSFR_METRICS', 'PC.IV', 'flr_lcr_nsfr_metrics', 'LCR/NSFR/EAFL Metrics', 'textarea', 0, NULL, 291),
('FLD_FLR_HQLA_QUALIFICATION', 'PC.IV', 'flr_hqla_qualification', 'HQLA Qualification', 'yesno', 0, NULL, 292),
('FLD_FLR_CASHFLOW_MODELING', 'PC.IV', 'flr_cashflow_modeling', 'Cashflow Modeling', 'textarea', 0, NULL, 293),
('FLD_FLR_LIQUIDITY_FACILITY', 'PC.IV', 'flr_liquidity_facility', 'Liquidity Facility Required?', 'yesno', 0, NULL, 294),
('FLD_FLR_LIMIT_IMPLEMENTATION', 'PC.IV', 'flr_limit_implementation', 'Limit Implementation Plan', 'textarea', 0, NULL, 295),
('FLD_APP5_VALUATION_MODEL', 'APP.5', 'app5_valuation_model', 'Valuation Model (Trading)', 'textarea', 0, NULL, 296),
('FLD_RDA_REPORTING_FREQUENCY', 'PC.V', 'rda_reporting_frequency', 'RDAR Reporting Frequency', 'dropdown', 0, NULL, 297),
('FLD_RDA_DATA_QUALITY', 'APP.4', 'rda_data_quality', 'Data Quality Assessment', 'textarea', 0, NULL, 298),
('FLD_FC_POLICY_FRAMEWORK', 'APP.3', 'fc_policy_framework', 'Financial Crime Policy Framework', 'textarea', 0, NULL, 299),
('FLD_FC_SCREENING_CONTROLS', 'APP.3', 'fc_screening_controls', 'Screening Controls', 'textarea', 0, NULL, 300),
('FLD_FC_TRANSACTION_MONITORING', 'APP.3', 'fc_transaction_monitoring', 'Transaction Monitoring', 'textarea', 0, NULL, 301),
('FLD_FC_SUSPICIOUS_REPORTING', 'APP.3', 'fc_suspicious_reporting', 'Suspicious Transaction Reporting', 'textarea', 0, NULL, 302),
('FLD_FC_RECORD_KEEPING', 'APP.3', 'fc_record_keeping', 'Record Keeping Requirements', 'textarea', 0, NULL, 303),
('FLD_FC_STAFF_TRAINING', 'APP.3', 'fc_staff_training', 'Financial Crime Staff Training', 'textarea', 0, NULL, 304),
('FLD_FC_INDEPENDENT_TESTING', 'APP.3', 'fc_independent_testing', 'Independent Testing Program', 'textarea', 0, NULL, 305),
('FLD_FC_VALIDATION_PROCESS', 'APP.3', 'fc_validation_process', 'Validation Process', 'textarea', 0, NULL, 306),
('FLD_FC_SURVEILLANCE_TOOLS', 'APP.3', 'fc_surveillance_tools', 'Surveillance Tools', 'textarea', 0, NULL, 307),
('FLD_FC_REGULATORY_REPORTING', 'APP.3', 'fc_regulatory_reporting', 'Regulatory Reporting Obligations', 'textarea', 0, NULL, 308),
('FLD_FC_DATA_PRIVACY_COMPLIANCE', 'APP.3', 'fc_data_privacy_compliance', 'Data Privacy Compliance', 'textarea', 0, NULL, 309),
('FLD_FC_DATA_SHARING_AGREEMENTS', 'APP.3', 'fc_data_sharing_agreements', 'Data Sharing Agreements', 'textarea', 0, NULL, 310),
('FLD_TP_USE_CASE_DESCRIPTION', 'APP.6', 'tp_use_case_description', 'Use Case Description', 'textarea', 0, NULL, 311),
('FLD_TP_BUSINESS_JUSTIFICATION', 'APP.6', 'tp_business_justification', 'Business Justification', 'textarea', 0, NULL, 312),
('FLD_TP_RISK_RATING', 'APP.6', 'tp_risk_rating', 'Risk Rating', 'dropdown', 0, NULL, 313),
('FLD_TP_RISK_MITIGANTS', 'APP.6', 'tp_risk_mitigants', 'Risk Mitigants', 'textarea', 0, NULL, 314),
('FLD_TP_DATA_CLASSIFICATION', 'APP.6', 'tp_data_classification', 'Data Classification', 'dropdown', 0, NULL, 315),
('FLD_TP_USER_POPULATION', 'APP.6', 'tp_user_population', 'User Population', 'textarea', 0, NULL, 316),
('FLD_TP_INTEGRATION_SCOPE', 'APP.6', 'tp_integration_scope', 'Integration Scope', 'textarea', 0, NULL, 317),
('FLD_TP_DATA_FLOW', 'APP.6', 'tp_data_flow', 'Data Flow Description', 'textarea', 0, NULL, 318),
('FLD_TP_EXIT_STRATEGY', 'APP.6', 'tp_exit_strategy', 'Exit Strategy', 'textarea', 0, NULL, 319),
('FLD_TP_ENCRYPTION_STANDARDS', 'APP.6', 'tp_encryption_standards', 'Encryption Standards', 'textarea', 0, NULL, 320),
('FLD_TP_ACCESS_CONTROLS', 'APP.6', 'tp_access_controls', 'Access Controls', 'textarea', 0, NULL, 321),
('FLD_TP_AUDIT_LOGGING', 'APP.6', 'tp_audit_logging', 'Audit Logging', 'yesno', 0, NULL, 322),
('FLD_TP_VULNERABILITY_MGMT', 'APP.6', 'tp_vulnerability_mgmt', 'Vulnerability Management', 'textarea', 0, NULL, 323),
('FLD_TP_INCIDENT_RESPONSE', 'APP.6', 'tp_incident_response', 'Incident Response Plan', 'textarea', 0, NULL, 324),
('FLD_TP_CERTIFICATIONS', 'APP.6', 'tp_certifications', 'Security Certifications', 'checkbox_group', 0, NULL, 325),
('FLD_TP_CYBER_ASSESSMENT', 'APP.6', 'tp_cyber_assessment', 'Cybersecurity Assessment', 'textarea', 0, NULL, 326),
('FLD_TP_COMMUNICATION_ARCHIVAL', 'APP.6', 'tp_communication_archival', 'Communication Archival', 'yesno', 0, NULL, 327),
('FLD_TP_RETENTION_POLICY', 'APP.6', 'tp_retention_policy', 'Data Retention Policy', 'textarea', 0, NULL, 328),
('FLD_TP_EDISCOVERY', 'APP.6', 'tp_ediscovery', 'e-Discovery Capability', 'yesno', 0, NULL, 329),
('FLD_TP_DATA_OWNERSHIP', 'APP.6', 'tp_data_ownership', 'Data Ownership', 'textarea', 0, NULL, 330),
('FLD_TP_IP_RIGHTS', 'APP.6', 'tp_ip_rights', 'IP Rights', 'textarea', 0, NULL, 331),
('FLD_TP_PDPA_COMPLIANCE', 'APP.6', 'tp_pdpa_compliance', 'PDPA Compliance', 'textarea', 0, NULL, 332),
('FLD_TP_CROSS_BORDER_TRANSFER', 'APP.6', 'tp_cross_border_transfer', 'Cross-Border Data Transfer', 'textarea', 0, NULL, 333),
('FLD_TP_DATA_DELETION', 'APP.6', 'tp_data_deletion', 'Data Deletion Process', 'textarea', 0, NULL, 334),
('FLD_TP_CONSENT_MANAGEMENT', 'APP.6', 'tp_consent_management', 'Consent Management', 'textarea', 0, NULL, 335),
('FLD_TP_BREACH_NOTIFICATION', 'APP.6', 'tp_breach_notification', 'Breach Notification Process', 'textarea', 0, NULL, 336),
('FLD_TP_DPO_CONTACT', 'APP.6', 'tp_dpo_contact', 'Data Protection Officer Contact', 'text', 0, NULL, 337),
('FLD_TP_PRIVACY_IMPACT', 'APP.6', 'tp_privacy_impact', 'Privacy Impact Assessment', 'textarea', 0, NULL, 338);
ALTER TABLE npa_form_data
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();
DELETE fd_old
FROM npa_form_data fd_old
JOIN npa_form_data fd_new
  ON fd_old.project_id = fd_new.project_id
 AND fd_old.field_key = fd_new.field_key
 AND fd_old.id < fd_new.id;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_form_data'
    AND index_name = 'uniq_npa_form_data_project_field'
);
SET @sql := IF(
  @idx_exists = 0,
  'ALTER TABLE npa_form_data ADD UNIQUE KEY uniq_npa_form_data_project_field (project_id, field_key)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE npa_projects
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();
UPDATE ref_npa_fields
SET field_type = 'dropdown'
WHERE LOWER(TRIM(field_type)) IN ('select', 'radio');
UPDATE ref_npa_fields
SET field_type = 'multiselect'
WHERE LOWER(TRIM(field_type)) IN ('multi-select', 'multi_select');
UPDATE ref_npa_fields
SET field_type = 'checkbox_group'
WHERE LOWER(TRIM(field_type)) IN ('checkbox-group', 'checkboxgroup');
UPDATE ref_npa_fields
SET field_type = 'yesno'
WHERE LOWER(TRIM(field_type)) IN ('yes/no', 'yes_no', 'yes-no');
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_projects'
    AND index_name = 'idx_npa_projects_created_at'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_projects ADD INDEX idx_npa_projects_created_at (created_at)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_projects'
    AND index_name = 'idx_npa_projects_current_stage'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_projects ADD INDEX idx_npa_projects_current_stage (current_stage)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_projects'
    AND index_name = 'idx_npa_projects_status'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_projects ADD INDEX idx_npa_projects_status (status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_projects'
    AND index_name = 'idx_npa_projects_approval_track'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_projects ADD INDEX idx_npa_projects_approval_track (approval_track)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_projects'
    AND index_name = 'idx_npa_projects_npa_type'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_projects ADD INDEX idx_npa_projects_npa_type (npa_type)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_signoffs'
    AND index_name = 'idx_npa_signoffs_project_status'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_signoffs ADD INDEX idx_npa_signoffs_project_status (project_id, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_breach_alerts'
    AND index_name = 'idx_npa_breaches_project_status'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_breach_alerts ADD INDEX idx_npa_breaches_project_status (project_id, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
CREATE TABLE IF NOT EXISTS evidence_library (
  record_id       VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  evidence_type   VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  relevance_score INT NULL,
  event_date      DATE NULL,
  display_date    VARCHAR(32) NULL,
  icon_name       VARCHAR(50) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_el_type (evidence_type),
  INDEX idx_el_status (status),
  INDEX idx_el_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
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
  evidence_type   VARCHAR(20) NOT NULL,
  status          VARCHAR(20) NOT NULL,
  relevance_score INT NULL,
  event_date      DATE NULL,
  display_date    VARCHAR(32) NULL,
  icon_name       VARCHAR(50) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_el_type (evidence_type),
  INDEX idx_el_status (status),
  INDEX idx_el_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO kb_documents
  (doc_id, filename, doc_type, embedding_id, last_synced, title, description, ui_category, agent_target, icon_name, display_date)
VALUES
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
SET @db := DATABASE();
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='scope') = 0,
  'ALTER TABLE npa_comments ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT ''DRAFT'' AFTER comment_type',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='field_key') = 0,
  'ALTER TABLE npa_comments ADD COLUMN field_key VARCHAR(255) NULL AFTER scope',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='author_user_id') = 0,
  'ALTER TABLE npa_comments ADD COLUMN author_user_id VARCHAR(36) NULL AFTER comment_text',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND INDEX_NAME='idx_npa_comments_scope_field') = 0,
  'ALTER TABLE npa_comments ADD INDEX idx_npa_comments_scope_field (project_id, scope, field_key, created_at)',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
SET @db := DATABASE();
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='agent_sessions' AND COLUMN_NAME='conversation_state_json') = 0,
  'ALTER TABLE agent_sessions ADD COLUMN conversation_state_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT ''Dify per-agent conversation state (JSON)'' CHECK (json_valid(conversation_state_json))',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT;
SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS;
SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION;
SET NAMES utf8mb4;
SET @OLD_TIME_ZONE=@@TIME_ZONE;
SET TIME_ZONE='+00:00';
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;
LOCK TABLES `agent_messages` WRITE;
ALTER TABLE `agent_messages` DISABLE KEYS;
INSERT INTO `agent_messages` (`id`, `session_id`, `role`, `agent_identity_id`, `content`, `timestamp`, `metadata`, `agent_confidence`, `reasoning_chain`, `citations`) VALUES (1,'SES-001','agent','MASTER_COO_ORCHESTRATOR','Routing to NPA Domain - detected new product creation intent','2026-01-15 09:14:01','{\"routing\": \"NPA_DOMAIN\"}',97.50,'Tokenized: \"create NPA\", \"digital asset custody\". Matched NPA_DOMAIN with 0.97 confidence.',NULL),(2,'SES-001','agent','NPA_DOMAIN_ORCHESTRATOR','Routing to Ideation Agent for new NPA creation','2026-01-15 09:14:02','{\"target\": \"IDEATION_AGENT\"}',95.00,'Intent=CREATE_NPA, no existing draft found for user USR-001',NULL),(3,'SES-001','agent','IDEATION_AGENT','Hello! I\'m your NPA Agent. I can help you create New Product Approvals. What product would you like to create an NPA for today?','2026-01-15 09:14:05',NULL,NULL,NULL,NULL),(4,'SES-001','user',NULL,'I want to create an NPA for expanding our Digital Asset Custody service to institutional clients in Hong Kong and Singapore','2026-01-15 09:14:30',NULL,NULL,NULL,NULL),(5,'SES-001','agent','IDEATION_AGENT','Excellent! I understand you want to expand **Digital Asset Custody** to institutional clients across **Hong Kong and Singapore**. Let me gather key details:\n\n**1. Product Structure:**\n- What digital assets will be covered? (BTC, ETH, stablecoins?)\n- What custody model? (Hot/Cold/Hybrid wallet?)','2026-01-15 09:15:00','{\"similar_npas\": [\"TSG2025-089\"]}',92.00,'Extracted: product=Digital Asset Custody, geography=HK+SG, segment=institutional. Similar NPA found: TSG2025-089 (87% match).','[\"TSG2025-089\"]'),(6,'SES-001','user',NULL,'BTC, ETH, and major stablecoins. Hybrid wallet model with Fireblocks for cold storage. Target AUM of $2B within 12 months.','2026-01-15 09:16:00',NULL,NULL,NULL,NULL),(7,'SES-001','agent','IDEATION_AGENT','Got it! **BTC, ETH, stablecoins** with **hybrid custody via Fireblocks**, targeting **$2B AUM**.\n\n**2. Business Context:**\n- Which business unit will manage this?\n- What\'s the revenue model? (Custody fees, transaction fees?)\n- Do you have existing client demand?','2026-01-15 09:16:30',NULL,94.00,'Product structure clear. Need business context for classification.',NULL),(8,'SES-001','user',NULL,'Treasury & Markets will manage. Revenue from 15bps annual custody fee plus 25bps transaction fees. We have 12 institutional clients already expressing interest.','2026-01-15 09:17:30',NULL,NULL,NULL,NULL),(9,'SES-001','agent','IDEATION_AGENT','**Cross-Border Detection:** Identified HK + SG dual jurisdiction requiring MAS and SFC compliance.\n\n**3. Risk & Regulatory:**\n- Any specific regulatory licenses needed?\n- What\'s your target timeline for launch?','2026-01-15 09:18:00',NULL,96.00,'Cross-border flag triggered. Revenue model: 15bps+25bps. 12 pipeline clients = strong demand signal.',NULL),(10,'SES-001','user',NULL,'We need MAS CMS license extension and SFC Type 1 license. Target launch Q2 2026.','2026-01-15 09:19:00',NULL,NULL,NULL,NULL),(11,'SES-001','agent','IDEATION_AGENT','**NPA Summary: Digital Asset Custody Expansion**\n- Product: Institutional digital asset custody (BTC, ETH, stablecoins)\n- Custody: Hybrid model via Fireblocks\n- Target AUM: $2B in 12 months\n- Revenue: 15bps custody + 25bps transaction\n- Jurisdictions: Singapore + Hong Kong\n- Timeline: Q2 2026 launch\n\n**AI Analysis:**\n- Similar NPA: TSG2025-089 (87% match)\n- Classification: New-to-Group (institutional custody is new capability)\n- Predicted Timeline: 12-16 weeks\n- Required Sign-offs: 6 parties\n\nReady to generate your NPA draft?','2026-01-15 09:20:00','{\"classification\": \"NTG\", \"criteria_met\": 12}',95.00,'All 7 discovery questions answered. Classification: NTG (12/20 criteria met, well above 6 threshold). Cross-border complexity adds 2-3 weeks.','[\"TSG2025-089\", \"MAS_CMS_Guidelines_2025\"]'),(12,'SES-001','user',NULL,'Yes, generate the NPA draft','2026-01-15 09:21:00',NULL,NULL,NULL,NULL),(13,'SES-001','agent','IDEATION_AGENT','**Processing...**\n\n✅ Prohibited List Check: PASSED\n✅ Classification: New-to-Group → Full NPA\n✅ Template: TSG2025-089 adapted\n✅ Auto-Fill: 74% completion (35/47 fields)\n✅ Risk Prediction: Medium-High, 12-16 weeks\n✅ Sign-off Matrix: 6 mandatory approvers\n\n**Draft NPA Generated!**\nTransitioning to workflow...','2026-01-15 09:22:00','{\"autofill_pct\": 74, \"manual_fields\": 12}',93.00,'Risk PASSED (all 4 layers clear). Template adapted from TSG2025-089 with custody-specific modifications. 12 fields need manual input.','[\"TSG2025-089\"]'),(14,'SES-004','agent','IDEATION_AGENT','Hello! What product would you like to create an NPA for?','2026-01-20 10:00:05',NULL,NULL,NULL,NULL),(15,'SES-004','user',NULL,'Crypto Custody Prime - a premium custody service for hedge funds with multi-sig wallets and institutional-grade insurance','2026-01-20 10:01:00',NULL,NULL,NULL,NULL),(16,'SES-004','agent','IDEATION_AGENT','I see you want **Crypto Custody Prime** for hedge funds. This is similar to our Digital Asset Custody NPA (NPA-2026-001) but with premium features.\n\nClassification: Likely **Variation** of existing custody product.\n\nLet me gather specifics...','2026-01-20 10:01:30',NULL,88.00,'Detected similarity to NPA-2026-001 (82% match). Variation likely - same asset class, different tier/features.','[\"NPA-2026-001\"]'),(17,'SES-004','user',NULL,'Yes, it builds on NPA-2026-001 but adds multi-sig governance, dedicated compliance officer per client, and $500M insurance coverage via Lloyd\'s','2026-01-20 10:03:00',NULL,NULL,NULL,NULL),(18,'SES-004','agent','IDEATION_AGENT','**Classification Update:** Confirming **Variation** (Material) - existing product with significant feature additions.\n\nApproval Track: Full NPA (material variation with insurance component)\nPredicted Timeline: 8-10 weeks\n\nGenerating draft...','2026-01-20 10:04:00',NULL,91.00,'Material variation confirmed: 4/8 variation criteria met (new vendor Lloyd\'s, new risk profile with insurance, new customer governance model, new compliance model).','[\"NPA-2026-001\", \"LLOYDS_CRYPTO_INSURANCE_2025\"]'),(19,'SES-005','agent','GOVERNANCE_AGENT','Sign-off orchestration initiated for NPA-2026-004. Routing to 5 approvers in parallel/sequential mode.\n\nParallel Track: Credit + MLR + Operations\nSequential: Legal → Finance\n\nSLA: 48 hours per approver.','2026-01-22 14:00:30','{\"parallel\": [\"Credit\",\"MLR\",\"Ops\"], \"sequential\": [\"Legal\",\"Finance\"]}',96.00,'Approval track=FULL_NPA, 5 mandatory parties identified from ref_signoff_routing_rules. Parallel optimization saves 1.5 days on critical path.',NULL),(20,'SES-005','agent','NOTIFICATION_AGENT','Notifications sent to 5 approvers:\n- Jane Tan (Credit): SLA deadline Jan 24 14:00\n- Ahmad Razak (MLR): SLA deadline Jan 24 14:00\n- Kevin Patel (Ops): SLA deadline Jan 24 14:00\n- Lisa Wong (Legal): Queued after parallel track\n- Mark Lee (Finance): Queued after Legal','2026-01-22 14:01:00',NULL,NULL,NULL,NULL),(21,'SES-005','agent','GOVERNANCE_AGENT','**SLA Warning:** Ahmad Razak (MLR) has not started review. 36-hour mark reached. Auto-reminder sent.','2026-01-24 02:00:00',NULL,90.00,'SLA monitoring: 36h warning threshold hit for MLR reviewer. Pattern: MLR typically reviews within 40h (based on last 50 NPAs).',NULL),(22,'SES-005','agent','GOVERNANCE_AGENT','**Clarification Request:** Jane Tan (Credit) asks: \"What is the insurance coverage structure for Lloyd\'s policy? Is it per-client or aggregate?\"','2026-01-23 10:15:00','{\"loop_back_type\": \"CLARIFICATION\"}',NULL,'Loop-back type: APPROVAL_CLARIFICATION. Routing to Conversational Diligence first (68% chance it can answer from KB).',NULL),(23,'SES-005','agent','CONVERSATIONAL_DILIGENCE','Based on the NPA draft and Lloyd\'s Crypto Insurance Framework (2025): The insurance is **per-client** with aggregate pool backup. Each institutional client gets $500M individual coverage, with a $2B aggregate pool across the platform.\n\n*Source: Lloyd\'s Crypto Custody Insurance Terms v3.2, Section 4.1*','2026-01-23 10:16:00',NULL,87.00,'Found answer in KB: Lloyd\'s framework doc matched with 91% relevance. Per-client structure confirmed with aggregate backup.','[\"LLOYDS_CRYPTO_INSURANCE_TERMS_V3.2\"]'),(24,'SES-006','agent','IDEATION_AGENT','Hello! What product would you like to create an NPA for?','2026-01-18 11:00:05',NULL,NULL,NULL,NULL),(25,'SES-006','user',NULL,'Global Green Bond ETF - an ESG-focused fixed income ETF tracking a custom green bond index','2026-01-18 11:01:00',NULL,NULL,NULL,NULL),(26,'SES-006','agent','IDEATION_AGENT','**Global Green Bond ETF** - interesting! This is a New-to-Group product as MBS doesn\'t currently offer ETF products.\n\n**Key Questions:**\n1. What\'s the target index? Custom or existing (e.g., Bloomberg MSCI Green Bond)?\n2. What listing venue(s)? SGX, HKEX?\n3. Target fund size?','2026-01-18 11:02:00','{\"classification_preliminary\": \"NTG\"}',93.00,'Classification: Clearly NTG - ETF product category is new for MBS. Requires new regulatory licenses (MAS CIS License for fund management).',NULL),(27,'SES-006','user',NULL,'Custom green bond index tracked by FTSE Russell. Listing on SGX with potential HKEX dual listing. Target $500M seed, growing to $2B in 3 years.','2026-01-18 11:04:00',NULL,NULL,NULL,NULL),(28,'SES-007','agent','RISK_AGENT','**4-Layer Prohibited Check for NPA-2026-003:**\n\nLayer 1 - Internal Policy: ✅ PASSED (Green bonds align with ESG mandate)\nLayer 2 - Regulatory: ✅ PASSED (MAS supports green finance; CIS License applicable)\nLayer 3 - Sanctions: ✅ PASSED (No sanctioned entity exposure in index methodology)\nLayer 4 - Dynamic: ⚠️ WARNING (Greenwashing scrutiny - enhanced due diligence recommended)\n\n**Result: PASSED with advisory note**','2026-01-19 09:00:30','{\"result\": \"PASS_WITH_ADVISORY\"}',94.00,'All 4 layers checked. Layer 4 flagged greenwashing risk per EU Taxonomy Regulation alignment requirements. Not a HARD_STOP but requires enhanced ESG validation.','[\"MAS_GREEN_FINANCE_GUIDE_2025\", \"EU_TAXONOMY_REG_2024\"]'),(29,'SES-008','agent','IDEATION_AGENT','Hello! What product would you like to create an NPA for?','2026-02-01 09:00:05',NULL,NULL,NULL,NULL),(30,'SES-008','user',NULL,'Carbon Credit Exchange - a platform for trading voluntary carbon credits and carbon offsets for corporate clients','2026-02-01 09:01:00',NULL,NULL,NULL,NULL),(31,'SES-008','agent','IDEATION_AGENT','**Carbon Credit Exchange** - this is timely! Strong regulatory tailwind with Singapore\'s carbon tax increases.\n\nI\'ve found no similar products in our NPA history, so this will likely be **New-to-Group**.\n\nLet me understand the scope...','2026-02-01 09:02:00',NULL,90.00,'KB search: 0 similar NPAs found. Clearly NTG - new asset class (carbon credits), new market infrastructure, new regulatory framework. 14/20 NTG criteria likely met.',NULL),(32,'SES-008','user',NULL,'We want to offer Verra VCS and Gold Standard credits. Corporate clients in APAC. Trading via our own marketplace with T+2 settlement. Target $100M volume Year 1.','2026-02-01 09:04:00',NULL,NULL,NULL,NULL),(33,'SES-008','agent','IDEATION_AGENT','Got it! **Verra VCS + Gold Standard**, **APAC corporates**, **proprietary marketplace**, **$100M Y1 volume**.\n\nThis triggers multiple NTG criteria:\n- New asset class (carbon credits)\n- New marketplace infrastructure\n- New regulatory landscape (Singapore carbon tax, CORSIA)\n- New settlement mechanism\n- New external dependencies (Verra, Gold Standard registries)\n\n**Classification: New-to-Group (Full NPA)**\n**Predicted Timeline: 16-20 weeks** (regulatory complexity)','2026-02-01 09:05:00',NULL,95.00,'NTG criteria score: 14/20 met across all 4 categories. Full NPA mandatory. Longest timeline prediction due to novel regulatory landscape and marketplace build.','[\"SG_CARBON_TAX_ACT_2024\", \"VERRA_VCS_STANDARD_V4\"]'),(34,'SES-009','agent','MONITORING_AGENT','**Daily Monitoring Report - NPA-2026-007 (FX Accumulator USD/SGD)**\n\nDay 45 post-launch:\n- Trading Volume: $340M (vs $500M target) ⚠️ 68% of target\n- Realized P&L: $2.1M (on track)\n- VaR Utilization: 73% ⚠️ approaching 80% warning\n- Active Breaches: 1 (counterparty concentration)\n- Counterparty Exposure: $180M / $200M limit\n\n**Alert:** Counterparty concentration with Bank ABC approaching limit.','2026-02-05 08:00:30','{\"health\": \"warning\", \"alerts\": 2}',91.00,'Volume below 70% threshold - warning generated. VaR approaching warning level. Counterparty concentration at 90% of limit - breach alert created.',NULL),(35,'SES-009','agent','MONITORING_AGENT','**Breach Alert:** Counterparty exposure to Bank ABC reached $192M against $200M limit. Auto-escalating to Risk Management.\n\nRecommendation: Reduce new trades with Bank ABC or increase limit with Credit Committee approval.','2026-02-06 10:30:00','{\"breach_type\": \"COUNTERPARTY_CONCENTRATION\"}',95.00,'Hard threshold: $200M per-counterparty. Current: $192M (96%). Auto-escalation triggered at 95% threshold.',NULL),(36,'SES-010','agent','GOVERNANCE_AGENT','**Sign-off Status: NPA-2026-008 (ESG-Linked Trade Finance)**\n\n✅ Credit (Jane Tan): APPROVED (Jan 27)\n✅ MLR (Ahmad Razak): APPROVED (Jan 28)\n❌ Operations (Kevin Patel): REJECTED - \"Supply chain verification system not ready\"\n⏳ Legal (Lisa Wong): ON HOLD (pending ops resolution)\n⏳ Finance (Mark Lee): ON HOLD\n\n**Loop-back #1 initiated.** Routing to Maker for operational readiness fix.','2026-01-29 11:00:00','{\"loop_back_count\": 1, \"circuit_breaker\": \"1/3\"}',88.00,'Loop-back type: CHECKER_REJECTION from Operations. Requires NPA changes (system readiness). Routing to MAKER. Circuit breaker: 1/3 loop-backs used.',NULL),(37,'SES-010','agent','GOVERNANCE_AGENT','**Loop-back #2:** Operations rejects again - \"Integration testing incomplete for supply chain ESG scoring module.\"\n\n**Circuit Breaker Status: 2/3** - One more rejection triggers auto-escalation to COO.\n\nRecommendation: Schedule joint workshop between Ops and Tech teams to resolve integration blockers.','2026-02-03 15:00:00','{\"loop_back_count\": 2, \"circuit_breaker\": \"2/3\"}',85.00,'Second rejection from same party (Operations). Pattern detected: technology dependency issue. Circuit breaker at 2/3. Recommending workshop before third attempt.',NULL);
ALTER TABLE `agent_messages` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `agent_sessions` WRITE;
ALTER TABLE `agent_sessions` DISABLE KEYS;
INSERT INTO `agent_sessions` (`id`, `project_id`, `user_id`, `started_at`, `agent_identity`, `current_stage`, `handoff_from`, `ended_at`) VALUES ('SES-001','NPA-2026-001','USR-001','2026-01-15 09:14:00','IDEATION_AGENT','IDEATION',NULL,'2026-01-15 09:36:00'),('SES-002','NPA-2026-001','USR-001','2026-01-15 09:36:00','CLASSIFICATION_AGENT','CLASSIFICATION','IDEATION_AGENT','2026-01-15 09:37:00'),('SES-003','NPA-2026-001','USR-001','2026-01-15 09:37:00','TEMPLATE_AUTOFILL','DISCOVERY','CLASSIFICATION_AGENT','2026-01-15 09:42:00'),('SES-004','NPA-2026-004','USR-002','2026-01-20 10:00:00','IDEATION_AGENT','IDEATION',NULL,'2026-01-20 10:25:00'),('SES-005','NPA-2026-004','USR-002','2026-01-22 14:00:00','GOVERNANCE_AGENT','SIGN_OFFS','RISK_AGENT',NULL),('SES-006','NPA-2026-003','USR-003','2026-01-18 11:00:00','IDEATION_AGENT','IDEATION',NULL,'2026-01-18 11:30:00'),('SES-007','NPA-2026-003','USR-003','2026-01-19 09:00:00','RISK_AGENT','RISK_ASSESSMENT','CLASSIFICATION_AGENT','2026-01-19 09:01:00'),('SES-008','NPA-2026-010','USR-005','2026-02-01 09:00:00','IDEATION_AGENT','IDEATION',NULL,'2026-02-01 09:28:00'),('SES-009','NPA-2026-007','USR-001','2026-02-05 08:00:00','MONITORING_AGENT','MONITORING','GOVERNANCE_AGENT',NULL),('SES-010','NPA-2026-008','USR-003','2026-01-25 10:00:00','GOVERNANCE_AGENT','SIGN_OFFS','RISK_AGENT',NULL);
ALTER TABLE `agent_sessions` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `kb_documents` WRITE;
ALTER TABLE `kb_documents` DISABLE KEYS;
INSERT INTO `kb_documents` (`doc_id`, `filename`, `doc_type`, `embedding_id`, `last_synced`) VALUES ('KB-HIST-001','TSG2025-089_Digital_Custody.pdf','HISTORICAL_NPA','emb-hn-001','2025-11-15 00:00:00'),('KB-HIST-002','TSG2024-156_FX_Options.pdf','HISTORICAL_NPA','emb-hn-002','2024-09-20 00:00:00'),('KB-HIST-003','TSG2025-201_ESG_Bonds.pdf','HISTORICAL_NPA','emb-hn-003','2025-12-01 00:00:00'),('KB-HIST-004','TSG2024-089_Crypto_Spot.pdf','HISTORICAL_NPA','emb-hn-004','2024-06-15 00:00:00'),('KB-HIST-005','TSG2025-045_Carbon_Credits.pdf','HISTORICAL_NPA','emb-hn-005','2025-03-10 00:00:00'),('KB-NPA-001','NPA_Golden_Template.md','GOLDEN_SOURCE','emb-gs-001','2026-02-01 00:00:00'),('KB-NPA-002','NPA_Approvals.md','GOLDEN_SOURCE','emb-gs-002','2026-02-01 00:00:00'),('KB-NPA-003','NPA_Classifications.md','GOLDEN_SOURCE','emb-gs-003','2026-02-01 00:00:00'),('KB-NPA-004','NPA_Documents_Required.md','GOLDEN_SOURCE','emb-gs-004','2026-02-01 00:00:00'),('KB-NPA-005','NPA_Pre_Requisites.md','GOLDEN_SOURCE','emb-gs-005','2026-02-01 00:00:00'),('KB-NPA-006','NPA_Filled_Template.md','FILLED_TEMPLATE','emb-ft-001','2026-02-11 00:00:00'),('KB-NPA-007','NPA_Mock_Conversation.md','MOCK_DATA','emb-mc-001','2026-02-11 00:00:00'),('KB-POL-001','MBS_Prohibited_Products_2026.pdf','POLICY','emb-pl-001','2026-01-01 00:00:00'),('KB-POL-002','MBS_ESG_Investment_Policy.pdf','POLICY','emb-pl-002','2025-09-01 00:00:00'),('KB-POL-003','MBS_Digital_Assets_Policy.pdf','POLICY','emb-pl-003','2025-11-01 00:00:00'),('KB-REG-001','MAS_CMS_Guidelines_2025.pdf','REGULATORY','emb-rg-001','2025-08-01 00:00:00'),('KB-REG-002','MAS_DPT_License_Guide.pdf','REGULATORY','emb-rg-002','2025-06-01 00:00:00'),('KB-REG-003','SFC_Type1_Requirements.pdf','REGULATORY','emb-rg-003','2025-07-01 00:00:00'),('KB-REG-004','PBOC_SFC_SwapConnect_Framework.pdf','REGULATORY','emb-rg-004','2025-04-01 00:00:00'),('KB-REG-005','EU_Taxonomy_Regulation_2024.pdf','REGULATORY','emb-rg-005','2024-12-01 00:00:00');
ALTER TABLE `kb_documents` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_agent_routing_decisions` WRITE;
ALTER TABLE `npa_agent_routing_decisions` DISABLE KEYS;
INSERT INTO `npa_agent_routing_decisions` (`id`, `session_id`, `project_id`, `source_agent`, `target_agent`, `routing_reason`, `confidence`, `context_payload`, `decided_at`) VALUES (1,'SES-001','NPA-2026-001','MASTER_COO_ORCHESTRATOR','NPA_DOMAIN_ORCHESTRATOR','User intent: create NPA for digital asset custody',97.50,'{\"intent\": \"CREATE_NPA\", \"domain_scores\": {\"NPA\": 0.97, \"DESK_SUPPORT\": 0.12}}','2026-01-15 09:14:01'),(2,'SES-001','NPA-2026-001','NPA_DOMAIN_ORCHESTRATOR','IDEATION_AGENT','New NPA creation - route to ideation',95.00,'{\"npa_stage\": \"IDEATION\", \"user_id\": \"USR-001\"}','2026-01-15 09:14:02'),(3,'SES-002','NPA-2026-001','NPA_DOMAIN_ORCHESTRATOR','CLASSIFICATION_AGENT','Ideation complete - route to classification',96.00,'{\"product_attrs\": {\"asset_class\": \"digital_custody\", \"geography\": \"SG_HK\"}}','2026-01-15 09:36:00'),(4,'SES-002','NPA-2026-001','CLASSIFICATION_AGENT','RISK_AGENT','Classification: NTG. Route to prohibited check',92.00,'{\"classification\": \"NTG\", \"criteria_met\": 12, \"criteria_total\": 20}','2026-01-15 09:37:00'),(5,'SES-003','NPA-2026-001','NPA_DOMAIN_ORCHESTRATOR','TEMPLATE_AUTOFILL','Risk PASSED. Route to template autofill',94.00,'{\"risk_result\": \"PASS\", \"template_source\": \"TSG2025-089\"}','2026-01-15 09:37:30'),(6,'SES-004','NPA-2026-004','MASTER_COO_ORCHESTRATOR','NPA_DOMAIN_ORCHESTRATOR','Create NPA for Crypto Custody Prime',96.00,'{\"intent\": \"CREATE_NPA\"}','2026-01-20 10:00:01'),(7,'SES-004','NPA-2026-004','NPA_DOMAIN_ORCHESTRATOR','IDEATION_AGENT','New NPA creation',95.00,NULL,'2026-01-20 10:00:02'),(8,'SES-005','NPA-2026-004','NPA_DOMAIN_ORCHESTRATOR','GOVERNANCE_AGENT','Sign-offs required. 5 parties identified.',96.00,'{\"approval_track\": \"FULL_NPA\", \"parties\": 5}','2026-01-22 14:00:00'),(9,'SES-005','NPA-2026-004','GOVERNANCE_AGENT','CONVERSATIONAL_DILIGENCE','Clarification from Credit reviewer. Routing to CD for auto-answer.',88.00,'{\"question\": \"Lloyd insurance structure\", \"loop_back_type\": \"CLARIFICATION\"}','2026-01-23 10:15:00'),(10,'SES-006','NPA-2026-003','MASTER_COO_ORCHESTRATOR','NPA_DOMAIN_ORCHESTRATOR','Create NPA for Green Bond ETF',95.00,NULL,'2026-01-18 11:00:01'),(11,'SES-007','NPA-2026-003','CLASSIFICATION_AGENT','RISK_AGENT','NTG classification confirmed. 4-layer check required.',93.00,'{\"classification\": \"NTG\"}','2026-01-19 09:00:00'),(12,'SES-008','NPA-2026-010','MASTER_COO_ORCHESTRATOR','NPA_DOMAIN_ORCHESTRATOR','Create NPA for Carbon Credit Exchange',94.00,NULL,'2026-02-01 09:00:01'),(13,'SES-009','NPA-2026-007','NPA_DOMAIN_ORCHESTRATOR','MONITORING_AGENT','Product launched. Initiating post-launch monitoring.',97.00,'{\"launched_at\": \"2026-01-20\", \"monitoring_thresholds_set\": true}','2026-02-05 08:00:00'),(14,'SES-010','NPA-2026-008','NPA_DOMAIN_ORCHESTRATOR','GOVERNANCE_AGENT','Sign-off orchestration for ESG Trade Finance',95.00,'{\"approval_track\": \"FULL_NPA\"}','2026-01-25 10:00:00');
ALTER TABLE `npa_agent_routing_decisions` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_approvals` WRITE;
ALTER TABLE `npa_approvals` DISABLE KEYS;
INSERT INTO `npa_approvals` (`id`, `project_id`, `approval_type`, `approver_id`, `approver_role`, `decision`, `decision_date`, `comments`, `conditions_imposed`, `created_at`) VALUES (1,'NPA-2026-006','CHECKER','USR-006','NPA Champion','APPROVE','2025-09-22 10:00:00','Evergreen track approved.',NULL,'2025-09-22 10:00:00'),(2,'NPA-2026-007','CHECKER','USR-007','Senior Reviewer','APPROVE','2025-08-28 14:00:00','All sign-offs received. Proceeding to launch.',NULL,'2025-08-28 14:00:00'),(3,'NPA-2026-007','GFM_COO','USR-015','GFM COO','APPROVE','2025-09-01 09:00:00','Approved for launch. Monitor knock-out barrier performance.',NULL,'2025-09-01 09:00:00'),(4,'NPA-2026-011','CHECKER','USR-007','Senior Reviewer','APPROVE','2026-01-25 12:30:00','Evergreen auto-approval confirmed.',NULL,'2026-01-25 12:30:00');
ALTER TABLE `npa_approvals` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_audit_log` WRITE;
ALTER TABLE `npa_audit_log` DISABLE KEYS;
INSERT INTO `npa_audit_log` (`id`, `project_id`, `actor_name`, `actor_role`, `action_type`, `action_details`, `is_agent_action`, `agent_name`, `timestamp`, `confidence_score`, `reasoning`, `model_version`, `source_citations`) VALUES (1,'NPA-2026-001','Sarah Jenkins','Maker','NPA_CREATED','Digital Asset Custody Expansion created via Product Ideation Agent.',0,NULL,'2025-11-15 09:00:00',NULL,NULL,NULL,NULL),(2,'NPA-2026-001','Classification Router','Agent','AGENT_CLASSIFIED','Classified as New-to-Group (confidence: 95%). Approval Track: FULL_NPA.',1,'Classification Router','2025-11-15 09:05:00',95.00,'Automated classification based on 20 NTG criteria assessment','CLASSIFICATION_AGENT_v1.0',NULL),(3,'NPA-2026-001','Prohibited List Checker','Agent','PROHIBITED_CHECK','PASSED all 4 layers. No matches.',1,'Prohibited List Checker','2025-11-15 09:06:00',98.00,'4-layer prohibited check executed in 0.3 seconds','RISK_AGENT_v1.0',NULL),(4,'NPA-2026-001','Template Auto-Fill','Agent','TEMPLATE_AUTOFILL','15/47 fields auto-filled from historical NPAs.',1,'Template Auto-Fill','2025-11-15 09:10:00',NULL,NULL,NULL,NULL),(5,'NPA-2026-001','ML Prediction Agent','Agent','PREDICTION_GENERATED','Approval likelihood: 65%. Timeline: 14.5 days. Bottleneck: Legal.',1,'ML Prediction','2025-11-15 09:12:00',NULL,NULL,NULL,NULL),(6,'NPA-2026-001','David Chen','Checker','CHECKER_REVIEW','Checker reviewed and approved for sign-off routing.',0,NULL,'2025-12-06 09:00:00',NULL,NULL,NULL,NULL),(7,'NPA-2026-001','Jane Tan','Credit Approver','SIGNOFF_APPROVED','RMG-Credit sign-off approved.',0,NULL,'2025-12-10 14:00:00',NULL,NULL,NULL,NULL),(8,'NPA-2026-001','Conversational Diligence','Agent','AI_ANSWERED_QUERY','Answered Finance VP VaR question without maker loop-back.',1,'Conversational Diligence','2025-12-09 14:02:00',NULL,NULL,NULL,NULL),(9,'NPA-2026-002','Sarah Lim','Maker','NPA_CREATED','FX Put Option GBP/USD created.',0,NULL,'2025-12-01 10:30:00',NULL,NULL,NULL,NULL),(10,'NPA-2026-002','Classification Router','Agent','AGENT_CLASSIFIED','Classified as Variation (confidence: 92%). Track: NPA_LITE.',1,'Classification Router','2025-12-01 10:35:00',95.00,'Automated classification based on 20 NTG criteria assessment','CLASSIFICATION_AGENT_v1.0',NULL),(11,'NPA-2026-002','Template Auto-Fill','Agent','TEMPLATE_AUTOFILL','37/47 fields auto-filled from TSG1917 (94% similarity).',1,'Template Auto-Fill','2025-12-01 10:40:00',NULL,NULL,NULL,NULL),(12,'NPA-2026-002','David Chen','Checker','CHECKER_REVIEW','All auto-filled fields verified. Ready for sign-offs.',0,NULL,'2025-12-05 14:00:00',NULL,NULL,NULL,NULL),(13,'NPA-2026-003','Sarah Jenkins','Maker','NPA_CREATED','Global Green Bond ETF created.',0,NULL,'2025-11-01 08:00:00',NULL,NULL,NULL,NULL),(14,'NPA-2026-004','Mike Ross','Maker','NPA_CREATED','Crypto Custody Prime created.',0,NULL,'2025-12-20 11:00:00',NULL,NULL,NULL,NULL),(15,'NPA-2026-005','Elena Torres','Maker','NPA_CREATED','AI Wealth Advisory Platform created.',0,NULL,'2026-01-10 09:00:00',NULL,NULL,NULL,NULL),(16,'NPA-2026-006','Amanda Lee','Maker','NPA_CREATED','Multi-Currency Deposit created.',0,NULL,'2025-09-15 08:00:00',NULL,NULL,NULL,NULL),(17,'NPA-2026-006','Approval Orchestrator','Agent','PRODUCT_LAUNCHED','Multi-Currency Deposit launched successfully.',1,'Approval Orchestrator','2025-10-01 08:00:00',NULL,NULL,NULL,NULL),(18,'NPA-2026-007','James Liu','Maker','NPA_CREATED','FX Accumulator USD/SGD created.',0,NULL,'2025-08-01 07:30:00',NULL,NULL,NULL,NULL),(19,'NPA-2026-007','Elena Torres','GFM COO','COO_APPROVED','Approved for launch. Monitor barrier performance.',0,NULL,'2025-09-01 09:00:00',NULL,NULL,NULL,NULL),(20,'NPA-2026-007','Approval Orchestrator','Agent','PRODUCT_LAUNCHED','FX Accumulator launched. Monitoring activated.',1,'Approval Orchestrator','2025-09-15 00:00:00',NULL,NULL,NULL,NULL),(21,'NPA-2026-008','Robert Tan','Maker','NPA_CREATED','ESG-Linked Trade Finance created.',0,NULL,'2025-10-01 10:00:00',NULL,NULL,NULL,NULL),(22,'NPA-2026-008','Approval Orchestrator','Agent','CIRCUIT_BREAKER','Circuit breaker triggered after 3 loop-backs. Escalated to Governance Forum.',1,'Approval Orchestrator','2025-11-25 10:05:00',NULL,NULL,NULL,NULL),(23,'NPA-2026-009','Elena Torres','Maker','NPA_CREATED','Algo FX Hedging Bot created.',0,NULL,'2026-01-05 14:00:00',NULL,NULL,NULL,NULL),(24,'NPA-2026-010','Sarah Jenkins','Maker','NPA_CREATED','Carbon Credit Exchange created.',0,NULL,'2026-01-20 09:30:00',NULL,NULL,NULL,NULL),(25,'NPA-2026-011','Jessica Wu','Maker','NPA_CREATED','Retail Wealth App Enhancement created.',0,NULL,'2026-01-25 11:00:00',NULL,NULL,NULL,NULL),(26,'NPA-2026-011','System','Agent','EVERGREEN_AUTOAPPROVED','Auto-approved via Evergreen track in < 1 hour.',1,'Approval Orchestrator','2026-01-25 12:30:00',NULL,NULL,NULL,NULL),(27,'NPA-2026-012','Alex Rivera','Maker','NPA_CREATED','Leveraged Crypto CFD Product created.',0,NULL,'2026-02-01 15:00:00',NULL,NULL,NULL,NULL),(28,'NPA-2026-012','Prohibited List Checker','Agent','PROHIBITED_HARD_STOP','HARD STOP: Leveraged crypto CFDs for retail violate MAS SFA 04-N15 and MBS IP-2024-003.',1,'Prohibited List Checker','2026-02-01 15:01:00',98.00,'4-layer prohibited check executed in 0.3 seconds','RISK_AGENT_v1.0',NULL),(29,'NPA-2026-007','Monitoring Agent','Agent','BREACH_DETECTED','Volume threshold breach detected on FX Accumulator. Daily volume $192M vs $128M cap.',1,'Monitoring Agent','2026-02-11 06:30:00',NULL,NULL,NULL,NULL),(30,'NPA-2026-003','Monitoring Agent','Agent','BREACH_DETECTED','Counterparty rating downgrade detected. Moody\'s downgraded from A- to BBB+.',1,'Monitoring Agent','2026-02-10 18:00:00',NULL,NULL,NULL,NULL);
ALTER TABLE `npa_audit_log` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_breach_alerts` WRITE;
ALTER TABLE `npa_breach_alerts` DISABLE KEYS;
INSERT INTO `npa_breach_alerts` (`id`, `project_id`, `title`, `severity`, `description`, `threshold_value`, `actual_value`, `escalated_to`, `sla_hours`, `status`, `triggered_at`, `resolved_at`) VALUES ('BR-001','NPA-2026-007','Volume Threshold Exceeded','CRITICAL','Daily trading volume $192M exceeds approved cap of $128M.','$128M daily cap','$192M actual','Head of FX Trading',4,'OPEN','2026-02-11 06:30:00',NULL),('BR-002','NPA-2026-007','Concentration Limit Warning','WARNING','Single counterparty exposure approaching 80% of approved limit.','80% of $110M limit','78% utilized ($85.8M)','RMG-Credit Team',24,'ACKNOWLEDGED','2026-02-09 14:00:00',NULL),('BR-003','NPA-2026-003','Counterparty Rating Downgrade','CRITICAL','Moody\'s downgraded primary counterparty from A- to BBB+.','Minimum A- rating','BBB+ (downgraded)','Credit Risk Team',4,'ESCALATED','2026-02-10 18:00:00',NULL),('BR-004','NPA-2026-003','Collateral Coverage Below Threshold','WARNING','Collateral coverage ratio 92% vs required minimum 95%.','95% coverage','92% coverage','Operations Team',24,'OPEN','2026-02-10 09:00:00',NULL),('BR-005','NPA-2026-003','P&L Drawdown Alert','WARNING','Cumulative P&L drawdown -$0.4M exceeds warning threshold of -$0.3M.','-$0.3M threshold','-$0.4M actual','Finance PC',48,'ACKNOWLEDGED','2026-02-08 16:00:00',NULL),('BR-006','NPA-2026-006','Early Withdrawal Spike','WARNING','Early withdrawal rate 8.2% exceeds expected 5% for Q4.','5% quarterly','8.2% actual','Consumer Banking Head',48,'RESOLVED','2025-12-20 10:00:00','2025-12-22 14:00:00'),('BR-007','NPA-2026-007','Knock-Out Barrier Proximity','CRITICAL','USD/SGD spot rate within 0.5% of knock-out barrier. High risk of barrier event.','1.3450 barrier','1.3385 current (0.48% away)','FX Trading Desk Head + RMG',2,'OPEN','2026-02-11 08:15:00',NULL);
ALTER TABLE `npa_breach_alerts` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_classification_assessments` WRITE;
ALTER TABLE `npa_classification_assessments` DISABLE KEYS;
INSERT INTO `npa_classification_assessments` (`id`, `project_id`, `criteria_id`, `score`, `evidence`, `assessed_by`, `confidence`, `assessed_at`) VALUES (1,'NPA-2026-012',1,2,'Digital currency trading - no existing equivalent in MBS portfolio','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(2,'NPA-2026-012',2,2,'Crypto volatility and 24/7 trading fundamentally different risk profile','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(3,'NPA-2026-012',3,2,'BTC, ETH, ADA, SOL - new asset classes for MBS','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(4,'NPA-2026-012',4,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(5,'NPA-2026-012',5,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(6,'NPA-2026-012',6,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(7,'NPA-2026-012',7,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(8,'NPA-2026-012',8,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(9,'NPA-2026-012',9,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(10,'NPA-2026-012',10,0,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(11,'NPA-2026-012',11,2,'MAS Digital Payment Token Service License required','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(12,'NPA-2026-012',12,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(13,'NPA-2026-012',13,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(14,'NPA-2026-012',14,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(15,'NPA-2026-012',15,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(16,'NPA-2026-012',16,2,'New CRY booking family, DGTL group, SPOT type','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(17,'NPA-2026-012',17,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(18,'NPA-2026-012',18,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(19,'NPA-2026-012',19,1,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(20,'NPA-2026-012',20,2,'Auto-assessed by Classification Agent','CLASSIFICATION_AGENT',92.50,'2026-02-11 04:23:05'),(32,'NPA-2026-003',1,2,'ETF product category entirely new for MBS','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(33,'NPA-2026-003',2,1,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(34,'NPA-2026-003',3,0,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(35,'NPA-2026-003',4,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(36,'NPA-2026-003',5,0,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(37,'NPA-2026-003',6,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(38,'NPA-2026-003',7,1,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(39,'NPA-2026-003',8,1,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(40,'NPA-2026-003',9,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(41,'NPA-2026-003',10,0,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(42,'NPA-2026-003',11,2,'MAS CIS License for fund management required','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(43,'NPA-2026-003',12,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(44,'NPA-2026-003',13,1,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(45,'NPA-2026-003',14,0,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(46,'NPA-2026-003',15,0,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(47,'NPA-2026-003',16,2,'New ETF creation/redemption booking infrastructure','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(48,'NPA-2026-003',17,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(49,'NPA-2026-003',18,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(50,'NPA-2026-003',19,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(51,'NPA-2026-003',20,2,'Auto-assessed','CLASSIFICATION_AGENT',91.00,'2026-02-11 04:32:26'),(63,'NPA-2026-004',21,1,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(64,'NPA-2026-004',22,0,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(65,'NPA-2026-004',23,2,'Premium tier targeting hedge funds specifically','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(66,'NPA-2026-004',24,1,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(67,'NPA-2026-004',25,0,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(68,'NPA-2026-004',26,2,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(69,'NPA-2026-004',27,2,'New vendor: Lloyd\'s of London for insurance','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(70,'NPA-2026-004',28,0,'Auto-assessed','CLASSIFICATION_AGENT',88.00,'2026-02-11 04:32:26'),(78,'NPA-2026-010',1,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(79,'NPA-2026-010',2,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(80,'NPA-2026-010',3,2,'Carbon credits - entirely new asset class','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(81,'NPA-2026-010',4,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(82,'NPA-2026-010',5,2,'Custom marketplace platform required','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(83,'NPA-2026-010',6,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(84,'NPA-2026-010',7,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(85,'NPA-2026-010',8,1,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(86,'NPA-2026-010',9,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(87,'NPA-2026-010',10,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(88,'NPA-2026-010',11,2,'Singapore Carbon Tax Act compliance + CORSIA framework','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(89,'NPA-2026-010',12,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(90,'NPA-2026-010',13,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(91,'NPA-2026-010',14,1,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(92,'NPA-2026-010',15,1,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(93,'NPA-2026-010',16,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(94,'NPA-2026-010',17,2,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(95,'NPA-2026-010',18,1,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(96,'NPA-2026-010',19,0,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(97,'NPA-2026-010',20,0,'Auto-assessed','CLASSIFICATION_AGENT',95.00,'2026-02-11 04:32:26'),(109,'NPA-2026-001',1,8,'Digital asset custody is a new capability not currently offered','CLASSIFICATION_AGENT',92.50,'2026-02-11 05:42:25'),(110,'NPA-2026-001',2,9,'Requires new technology infrastructure for cold/hot wallets','CLASSIFICATION_AGENT',95.00,'2026-02-11 05:42:25'),(111,'NPA-2026-001',3,7,'Introduces novel risk vectors - key management, chain forks','CLASSIFICATION_AGENT',88.00,'2026-02-11 05:42:25'),(112,'NPA-2026-001',4,6,'Existing compliance framework partially applicable','CLASSIFICATION_AGENT',82.00,'2026-02-11 05:42:25'),(113,'NPA-2026-001',5,8,'New regulatory landscape - MAS PS-N02 digital asset guidelines','CLASSIFICATION_AGENT',91.00,'2026-02-11 05:42:25'),(114,'NPA-2026-001',6,5,'Moderate client impact - institutional clients only initially','CLASSIFICATION_AGENT',78.00,'2026-02-11 05:42:25'),(115,'NPA-2026-001',7,7,'Cross-border implications with multiple jurisdictions','CLASSIFICATION_AGENT',85.00,'2026-02-11 05:42:25');
ALTER TABLE `npa_classification_assessments` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_classification_scorecards` WRITE;
ALTER TABLE `npa_classification_scorecards` DISABLE KEYS;
INSERT INTO `npa_classification_scorecards` (`id`, `project_id`, `total_score`, `calculated_tier`, `breakdown`, `override_reason`, `created_at`) VALUES (1,'NPA-2026-001',18,'New-to-Group','{\"market_innovation\": true, \"product_structure\": true, \"tech_platform\": true, \"regulatory_framework\": true}',NULL,'2026-02-11 02:50:09'),(2,'NPA-2026-002',8,'Variation','{\"currency_pair_extension\": true, \"tenor_extension\": false}',NULL,'2026-02-11 02:50:09'),(3,'NPA-2026-003',17,'New-to-Group','{\"new_asset_class\": true, \"etf_structure\": true, \"multi_jurisdiction\": true}',NULL,'2026-02-11 02:50:09'),(4,'NPA-2026-004',14,'Variation','{\"defi_integration\": true, \"premium_tier\": true, \"cold_storage\": true}',NULL,'2026-02-11 02:50:09'),(5,'NPA-2026-005',5,'Existing','{\"ai_enhancement\": true, \"no_risk_change\": true}',NULL,'2026-02-11 02:50:09'),(6,'NPA-2026-006',2,'Existing','{\"tenor_extension\": true, \"no_risk_change\": true}',NULL,'2026-02-11 02:50:09'),(7,'NPA-2026-007',12,'Variation','{\"leverage_structure\": true, \"barrier_feature\": true}',NULL,'2026-02-11 02:50:09'),(8,'NPA-2026-008',19,'New-to-Group','{\"esg_framework\": true, \"cross_border\": true, \"new_market\": true, \"regulatory_complexity\": true}',NULL,'2026-02-11 02:50:09'),(9,'NPA-2026-009',6,'Existing','{\"algorithmic_trading\": true, \"automation\": true}',NULL,'2026-02-11 02:50:09'),(10,'NPA-2026-010',20,'New-to-Group','{\"blockchain_settlement\": true, \"new_asset_class\": true, \"regulatory_gap\": true, \"market_creation\": true}',NULL,'2026-02-11 02:50:09'),(11,'NPA-2026-011',1,'Existing','{\"ui_only\": true}',NULL,'2026-02-11 02:50:09'),(12,'NPA-2026-012',0,'PROHIBITED','{\"leveraged_crypto\": true, \"retail_banned\": true, \"regulatory_violation\": true}',NULL,'2026-02-11 02:50:09');
ALTER TABLE `npa_classification_scorecards` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_comments` WRITE;
ALTER TABLE `npa_comments` DISABLE KEYS;
INSERT INTO `npa_comments` (`id`, `project_id`, `comment_type`, `comment_text`, `author_name`, `author_role`, `parent_comment_id`, `generated_by_ai`, `ai_agent`, `ai_confidence`, `created_at`) VALUES (1,'NPA-2026-001','SYSTEM_ALERT','NPA classified as New-to-Group by Classification Router Agent. Confidence: 95%.','Classification Router','Agent',NULL,1,'Classification Router',95.00,'2025-11-15 09:05:00'),(2,'NPA-2026-001','SYSTEM_ALERT','Prohibited List Check: PASSED. No matches found across 4 compliance layers.','Prohibited List Checker','Agent',NULL,1,'Prohibited List Checker',100.00,'2025-11-15 09:06:00'),(3,'NPA-2026-001','APPROVER_QUESTION','What is the expected daily VaR impact of this custody service?','Mark Lee','Finance Approver',NULL,0,NULL,NULL,'2025-12-09 14:00:00'),(4,'NPA-2026-001','AI_ANSWER','Based on analysis of similar custody services (TSG1845, TSG1792), the expected VaR impact is $360K daily under normal market conditions.','Conversational Diligence Agent','Agent',NULL,1,'Conversational Diligence',88.00,'2025-12-09 14:02:00'),(5,'NPA-2026-001','APPROVER_QUESTION','Has the HK Securities and Futures Commission been consulted regarding custody license requirements?','Lisa Wong','Legal Approver',NULL,0,NULL,NULL,'2025-12-12 14:30:00'),(6,'NPA-2026-001','MAKER_RESPONSE','We have engaged Baker McKenzie HK for the legal opinion. Expected delivery by end of January 2026.','Sarah Jenkins','Maker',NULL,0,NULL,NULL,'2025-12-13 09:00:00'),(7,'NPA-2026-002','SYSTEM_ALERT','NPA classified as Variation by Classification Router Agent. Confidence: 92%. Approval Track: NPA Lite.','Classification Router','Agent',NULL,1,'Classification Router',92.00,'2025-12-01 10:35:00'),(8,'NPA-2026-002','SYSTEM_ALERT','Template Auto-Fill completed: 37/47 fields populated (78%). Source: TSG1917 (94% similarity).','Template Auto-Fill Engine','Agent',NULL,1,'Template Auto-Fill',94.00,'2025-12-01 10:40:00'),(9,'NPA-2026-002','SYSTEM_ALERT','ML Prediction: 78% approval likelihood. Predicted timeline: 4.2 days. Bottleneck: Finance.','ML Prediction Agent','Agent',NULL,1,'ML Prediction',78.00,'2025-12-01 10:42:00'),(10,'NPA-2026-002','CHECKER_NOTE','All auto-filled fields verified. Manual fields completed by maker. Ready for sign-off routing.','David Chen','Checker',NULL,0,NULL,NULL,'2025-12-05 14:00:00'),(11,'NPA-2026-004','APPROVER_QUESTION','What is the cold storage architecture? Need details on HSM integration for security assessment.','Rachel Ng','Technology Approver',NULL,0,NULL,NULL,'2026-02-08 10:00:00'),(12,'NPA-2026-004','MAKER_RESPONSE','Architecture uses Thales Luna HSM with multi-sig 3-of-5 threshold. Full architecture document has been uploaded.','Mike Ross','Maker',NULL,0,NULL,NULL,'2026-02-09 16:00:00'),(13,'NPA-2026-008','SYSTEM_ALERT','WARNING: Circuit breaker triggered. 3 loop-backs detected. Escalating to NPA Governance Forum.','Approval Orchestrator','Agent',NULL,1,'Approval Orchestrator',100.00,'2025-11-25 10:05:00'),(14,'NPA-2026-008','SYSTEM_ALERT','NPA Governance Forum convened. Review scheduled for 2025-12-05.','Approval Orchestrator','Agent',NULL,1,'Approval Orchestrator',100.00,'2025-11-26 09:00:00'),(15,'NPA-2026-008','APPROVER_QUESTION','The ESG scoring methodology has been revised 3 times. What assurance do we have the latest version meets MBS framework requirements?','Jane Tan','Credit Approver',NULL,0,NULL,NULL,'2025-11-15 10:00:00'),(16,'NPA-2026-008','MAKER_RESPONSE','We have engaged the Group Sustainability team to co-develop the methodology. Version 3.2 has been validated against MBS Sustainability Framework.','Robert Tan','Maker',NULL,0,NULL,NULL,'2025-11-18 09:00:00'),(17,'NPA-2026-006','SYSTEM_ALERT','Product launched successfully on 2025-10-01. Auto-monitoring activated.','Approval Orchestrator','Agent',NULL,1,NULL,NULL,'2025-10-01 08:00:00'),(18,'NPA-2026-012','SYSTEM_ALERT','HARD STOP: Product flagged as PROHIBITED. Leveraged crypto CFDs for retail clients violate MAS Notice SFA 04-N15 and MBS Internal Policy IP-2024-003.','Prohibited List Checker','Agent',NULL,1,'Prohibited List Checker',100.00,'2026-02-01 15:01:00'),(19,'NPA-2026-012','SYSTEM_ALERT','Prohibition layers matched: (1) Internal Policy - retail leverage crypto banned, (2) Regulatory - MAS SFA 04-N15 prohibits leveraged crypto for retail, (3) Sanctions - N/A, (4) Dynamic - current MAS advisory against crypto leverage products.','Prohibited List Checker','Agent',NULL,1,'Prohibited List Checker',100.00,'2026-02-01 15:01:01');
ALTER TABLE `npa_comments` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_documents` WRITE;
ALTER TABLE `npa_documents` DISABLE KEYS;
INSERT INTO `npa_documents` (`id`, `project_id`, `document_name`, `document_type`, `file_size`, `file_extension`, `category`, `validation_status`, `uploaded_by`, `uploaded_at`, `version`, `validation_stage`, `criticality`, `required_by_stage`, `doc_requirement_id`) VALUES (1,'NPA-2026-001','Digital_Asset_Custody_Term_Sheet_v3.pdf','TERM_SHEET','2.4 MB','pdf','Product Specs','VALID','Sarah Jenkins','2025-11-15 09:30:00',1,NULL,NULL,NULL,NULL),(2,'NPA-2026-001','Custody_Credit_Risk_Assessment.pdf','CREDIT_REPORT','1.8 MB','pdf','Risk Analysis','VALID','Jane Tan','2025-12-08 10:00:00',1,NULL,NULL,NULL,NULL),(3,'NPA-2026-001','ROAE_Model_Custody_v2.xlsx','RISK_MEMO','856 KB','xlsx','Pricing Model','VALID','Mark Lee','2025-12-09 11:00:00',1,NULL,NULL,NULL,NULL),(4,'NPA-2026-001','HK_Regulatory_Framework_Analysis.pdf','LEGAL_OPINION','3.1 MB','pdf','Regulatory','PENDING','Lisa Wong','2025-12-12 14:00:00',1,NULL,NULL,NULL,NULL),(5,'NPA-2026-001','AML_KYC_Assessment_Custody.pdf','RISK_MEMO','1.2 MB','pdf','Risk Analysis','VALID','Ahmad Razak','2025-12-07 09:00:00',1,NULL,NULL,NULL,NULL),(6,'NPA-2026-001','Custody_Technology_Architecture.pdf','TERM_SHEET','4.5 MB','pdf','Operational','VALID','Michael Chen','2025-11-20 14:00:00',1,NULL,NULL,NULL,NULL),(7,'NPA-2026-002','FX_Put_Option_GBPUSD_Term_Sheet.pdf','TERM_SHEET','1.5 MB','pdf','Product Specs','VALID','Sarah Lim','2025-12-01 10:45:00',1,NULL,NULL,NULL,NULL),(8,'NPA-2026-002','Black_Scholes_Pricing_Model.xlsx','RISK_MEMO','945 KB','xlsx','Pricing Model','VALID','Sarah Lim','2025-12-02 09:00:00',1,NULL,NULL,NULL,NULL),(9,'NPA-2026-002','VaR_Impact_Analysis_FX_Option.pdf','RISK_MEMO','780 KB','pdf','Risk Analysis','VALID','Jane Tan','2026-01-13 08:30:00',1,NULL,NULL,NULL,NULL),(10,'NPA-2026-002','Murex_Configuration_Checklist.pdf','TERM_SHEET','320 KB','pdf','Operational','VALID','Rachel Ng','2026-01-15 14:00:00',1,NULL,NULL,NULL,NULL),(11,'NPA-2026-002','ISDA_Master_Agreement_Acme.pdf','ISDA','2.8 MB','pdf','Legal','VALID','David Chen','2025-12-05 14:00:00',1,NULL,NULL,NULL,NULL),(12,'NPA-2026-003','Green_Bond_ETF_Prospectus_Draft.pdf','TERM_SHEET','5.2 MB','pdf','Product Specs','VALID','Sarah Jenkins','2025-11-05 08:00:00',1,NULL,NULL,NULL,NULL),(13,'NPA-2026-003','ESG_Compliance_Framework.pdf','LEGAL_OPINION','2.1 MB','pdf','Regulatory','PENDING','Lisa Wong','2025-12-01 10:00:00',1,NULL,NULL,NULL,NULL),(14,'NPA-2026-003','Bond_Index_Methodology.pdf','TERM_SHEET','1.8 MB','pdf','Product Specs','VALID','John Smith','2025-11-10 09:00:00',1,NULL,NULL,NULL,NULL),(15,'NPA-2026-003','Revenue_Projection_Green_Bond.xlsx','RISK_MEMO','1.1 MB','xlsx','Pricing Model','WARNING','Mark Lee','2025-12-15 11:00:00',1,NULL,NULL,NULL,NULL),(16,'NPA-2026-004','Crypto_Custody_Prime_Proposal.pdf','TERM_SHEET','3.8 MB','pdf','Product Specs','VALID','Mike Ross','2025-12-20 11:30:00',1,NULL,NULL,NULL,NULL),(17,'NPA-2026-004','HSM_Architecture_Thales_Luna.pdf','TERM_SHEET','6.2 MB','pdf','Operational','VALID','Mike Ross','2026-02-09 16:00:00',1,NULL,NULL,NULL,NULL),(18,'NPA-2026-004','DeFi_Integration_Risk_Assessment.pdf','RISK_MEMO','2.4 MB','pdf','Risk Analysis','PENDING','Jane Tan','2026-01-18 09:00:00',1,NULL,NULL,NULL,NULL),(19,'NPA-2026-004','Digital_Asset_Regulatory_Review.pdf','LEGAL_OPINION','1.9 MB','pdf','Regulatory','PENDING','Lisa Wong','2026-02-10 11:00:00',1,NULL,NULL,NULL,NULL),(20,'NPA-2026-007','FX_Accumulator_USDSGD_Term_Sheet.pdf','TERM_SHEET','1.9 MB','pdf','Product Specs','VALID','James Liu','2025-08-01 08:00:00',1,NULL,NULL,NULL,NULL),(21,'NPA-2026-007','Barrier_Risk_Analysis.pdf','RISK_MEMO','1.4 MB','pdf','Risk Analysis','VALID','Jane Tan','2025-08-18 08:00:00',1,NULL,NULL,NULL,NULL),(22,'NPA-2026-007','Accumulator_Pricing_Model.xlsx','RISK_MEMO','2.2 MB','xlsx','Pricing Model','VALID','Mark Lee','2025-08-19 10:00:00',1,NULL,NULL,NULL,NULL),(23,'NPA-2026-008','ESG_Trade_Finance_Proposal_v3.pdf','TERM_SHEET','4.1 MB','pdf','Product Specs','WARNING','Robert Tan','2025-10-01 10:00:00',1,NULL,NULL,NULL,NULL),(24,'NPA-2026-008','ESG_Scoring_Methodology_v3.2.pdf','TERM_SHEET','2.8 MB','pdf','Product Specs','VALID','Robert Tan','2025-11-18 09:00:00',1,NULL,NULL,NULL,NULL),(25,'NPA-2026-008','Vietnam_Legal_Framework_Gap.pdf','LEGAL_OPINION','1.5 MB','pdf','Regulatory','INVALID','Lisa Wong','2025-11-25 10:00:00',1,NULL,NULL,NULL,NULL),(26,'NPA-2026-008','Revenue_Model_ESG_Revised.xlsx','RISK_MEMO','890 KB','xlsx','Pricing Model','WARNING','Mark Lee','2025-11-20 14:00:00',1,NULL,NULL,NULL,NULL),(27,'NPA-2026-010','Carbon_Credit_Platform_Concept.pdf','TERM_SHEET','3.5 MB','pdf','Product Specs','VALID','Sarah Jenkins','2026-01-20 10:00:00',1,NULL,NULL,NULL,NULL),(28,'NPA-2026-010','Blockchain_Settlement_Architecture.pdf','TERM_SHEET','5.8 MB','pdf','Operational','PENDING','Michael Chen','2026-01-25 14:00:00',1,NULL,NULL,NULL,NULL);
ALTER TABLE `npa_documents` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_escalations` WRITE;
ALTER TABLE `npa_escalations` DISABLE KEYS;
INSERT INTO `npa_escalations` (`id`, `project_id`, `escalation_level`, `trigger_type`, `trigger_detail`, `escalated_to`, `escalated_by`, `status`, `resolution`, `escalated_at`, `resolved_at`) VALUES (1,'NPA-2026-008',1,'LOOP_BACK_LIMIT','Operations rejected twice - supply chain ESG scoring module integration incomplete','Kevin Patel (Dept Head)','GOVERNANCE_AGENT','ACTIVE',NULL,'2026-02-03 15:30:00',NULL),(2,'NPA-2026-001',1,'SLA_BREACH','Finance sign-off exceeded 48-hour SLA by 6 hours','Mark Lee (Dept Head)','GOVERNANCE_AGENT','RESOLVED','Finance team reassigned reviewer. Sign-off completed within 4 hours of escalation.','2026-01-20 14:00:00','2026-01-20 18:30:00'),(3,'NPA-2026-007',2,'RISK_THRESHOLD','Counterparty exposure to Bank ABC at 96% of $200M limit','Risk Committee (BU Head)','MONITORING_AGENT','ACTIVE',NULL,'2026-02-06 10:30:00',NULL),(4,'NPA-2026-002',2,'DISAGREEMENT','Credit and MLR disagreed on GBP/USD put option risk classification','BU Head - Treasury','GOVERNANCE_AGENT','RESOLVED','BU Head mediated: classified as Medium risk with enhanced monitoring. Both parties accepted.','2026-01-25 09:00:00','2026-01-26 11:00:00');
ALTER TABLE `npa_escalations` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_external_parties` WRITE;
ALTER TABLE `npa_external_parties` DISABLE KEYS;
INSERT INTO `npa_external_parties` (`id`, `project_id`, `party_name`, `party_role`, `risk_profile_id`, `vendor_tier`, `grc_id`, `created_at`) VALUES (1,'NPA-2026-001','Fireblocks','Digital asset custody and security infrastructure','EXT-2026-001','TIER_1_CRITICAL','FBK-2026-001','2026-02-11 04:32:26'),(2,'NPA-2026-001','Elliptic','Blockchain analytics and AML compliance monitoring','EXT-2026-002','TIER_2','ELP-2026-002','2026-02-11 04:32:26'),(3,'NPA-2026-001','CoinMetrics','Real-time pricing feeds and market data provider','EXT-2026-003','TIER_2','CMT-2026-003','2026-02-11 04:32:26'),(4,'NPA-2026-004','Fireblocks','Cold storage multi-sig custody infrastructure','EXT-2026-001','TIER_1_CRITICAL','FBK-2026-001','2026-02-11 04:32:26'),(5,'NPA-2026-004','Lloyd\'s of London','Crypto custody insurance - $500M per-client coverage','EXT-2026-004','TIER_1_CRITICAL','LLO-2026-004','2026-02-11 04:32:26'),(6,'NPA-2026-004','Chainalysis','Enhanced transaction monitoring and forensics','EXT-2026-005','TIER_2','CHA-2026-005','2026-02-11 04:32:26'),(7,'NPA-2026-003','FTSE Russell','Custom green bond index provider and calculation agent','EXT-2026-006','TIER_1_CRITICAL','FTR-2026-006','2026-02-11 04:32:26'),(8,'NPA-2026-003','SGX','Primary listing venue for ETF','EXT-2026-007','TIER_1_CRITICAL','SGX-2026-007','2026-02-11 04:32:26'),(9,'NPA-2026-010','Verra','Verified Carbon Standard (VCS) registry and verification','EXT-2026-008','TIER_1_CRITICAL','VER-2026-008','2026-02-11 04:32:26'),(10,'NPA-2026-010','Gold Standard','Gold Standard carbon credit certification and registry','EXT-2026-009','TIER_1_CRITICAL','GLD-2026-009','2026-02-11 04:32:26'),(11,'NPA-2026-010','Xpansiv','Carbon credit market data and pricing benchmarks','EXT-2026-010','TIER_2','XPN-2026-010','2026-02-11 04:32:26'),(12,'NPA-2026-007','Bloomberg','FX execution and pricing platform','EXT-2026-011','TIER_1_CRITICAL','BLM-2026-011','2026-02-11 04:32:26'),(13,'NPA-2026-008','EcoVadis','Supply chain ESG scoring and assessment platform','EXT-2026-012','TIER_2','ECO-2026-012','2026-02-11 04:32:26'),(14,'NPA-2026-008','Sustainalytics','ESG risk ratings for trade finance counterparties','EXT-2026-013','TIER_2','SUS-2026-013','2026-02-11 04:32:26');
ALTER TABLE `npa_external_parties` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_form_data` WRITE;
ALTER TABLE `npa_form_data` DISABLE KEYS;
INSERT INTO `npa_form_data` (`id`, `project_id`, `field_key`, `field_value`, `lineage`, `confidence_score`, `metadata`) VALUES (1,'NPA-2026-001','product_name','Digital Asset Custody Service','MANUAL',100.00,NULL),(2,'NPA-2026-001','product_type','Custody Services','AUTO',95.00,'{\"source\": \"Classification Agent\"}'),(3,'NPA-2026-001','desk','Singapore Digital Assets Desk','AUTO',99.00,NULL),(4,'NPA-2026-001','business_unit','Digital Assets','AUTO',99.00,NULL),(5,'NPA-2026-001','notional_amount','50000000','MANUAL',100.00,NULL),(6,'NPA-2026-001','underlying_asset','Bitcoin, Ethereum, Stablecoins','MANUAL',100.00,NULL),(7,'NPA-2026-001','tenor','Ongoing','MANUAL',100.00,NULL),(8,'NPA-2026-001','business_rationale','Growing institutional demand for digital asset custody in APAC. Expected $12.8M annual revenue.','ADAPTED',85.00,'{\"source\": \"KB Search\", \"adaptation_logic\": \"Enhanced from similar custody NPA\"}'),(9,'NPA-2026-001','booking_system','Custom/In-House','MANUAL',100.00,NULL),(10,'NPA-2026-001','settlement_method','Net Settlement','AUTO',92.00,NULL),(11,'NPA-2026-001','market_risk','Operational risk from custody wallet infrastructure. VaR N/A for custody.','ADAPTED',80.00,'{\"source\": \"TSG1845\"}'),(12,'NPA-2026-001','credit_risk','Counterparty default risk mitigated through cold storage segregation.','ADAPTED',82.00,'{\"source\": \"TSG1845\"}'),(13,'NPA-2026-001','risk_classification','HIGH','AUTO',98.00,NULL),(14,'NPA-2026-001','primary_regulation','MAS PS Act, HK SFC Type 1 License','MANUAL',100.00,NULL),(15,'NPA-2026-001','sanctions_check','Clear - No Matches','AUTO',100.00,NULL),(16,'NPA-2026-002','product_name','FX Put Option GBP/USD','AUTO',98.00,'{\"source\": \"Ideation Agent\"}'),(17,'NPA-2026-002','product_type','FX Option','AUTO',99.00,'{\"source\": \"Classification Agent\"}'),(18,'NPA-2026-002','desk','Singapore FX Desk','AUTO',99.00,NULL),(19,'NPA-2026-002','business_unit','Treasury & Markets','AUTO',99.00,NULL),(20,'NPA-2026-002','notional_amount','75000000','MANUAL',100.00,NULL),(21,'NPA-2026-002','underlying_asset','GBP / USD','AUTO',99.00,NULL),(22,'NPA-2026-002','tenor','6 Months','AUTO',99.00,'{\"source\": \"TSG1917\"}'),(23,'NPA-2026-002','strike_price','1.2750','ADAPTED',92.00,'{\"source\": \"TSG1917\", \"adaptation_logic\": \"Adjusted for current market levels\"}'),(24,'NPA-2026-002','business_rationale','Corporate hedging client requires GBP/USD protection for upcoming CapEx program.','ADAPTED',85.00,'{\"source\": \"TSG1917\", \"adaptation_logic\": \"Adapted currency pair and client context\"}'),(25,'NPA-2026-002','booking_system','Murex','AUTO',99.00,'{\"source\": \"TSG1917\"}'),(26,'NPA-2026-002','valuation_model','Black-Scholes','AUTO',99.00,'{\"source\": \"TSG1917\"}'),(27,'NPA-2026-002','settlement_method','Cash (USD)','AUTO',96.00,'{\"source\": \"TSG1917\"}'),(28,'NPA-2026-002','counterparty','Acme Corp (HK)','MANUAL',100.00,NULL),(29,'NPA-2026-002','counterparty_rating','A-','AUTO',98.00,'{\"source\": \"Bloomberg API\"}'),(30,'NPA-2026-002','market_risk','VaR impact: $360K daily. Within standard FX option risk limits.','ADAPTED',88.00,'{\"source\": \"TSG1917\"}'),(31,'NPA-2026-002','credit_risk','Counterparty A- rated. Collateral agreement in place.','ADAPTED',90.00,'{\"source\": \"TSG1917\"}'),(32,'NPA-2026-002','roae_analysis','ROAE: 18.5% (above 15% threshold). Sensitivity: +/-2% for 10bp vol shift.','ADAPTED',85.00,'{\"source\": \"TSG1917\", \"adaptation_logic\": \"Adjusted for current rates and vol surface\"}'),(33,'NPA-2026-002','risk_classification','MEDIUM','AUTO',95.00,NULL),(34,'NPA-2026-002','primary_regulation','MAS 656','AUTO',95.00,'{\"source\": \"Policy Engine\"}'),(35,'NPA-2026-002','sanctions_check','Clear - No Matches','AUTO',100.00,NULL),(36,'NPA-2026-002','booking_entity','MBS Bank Ltd, Singapore','AUTO',99.00,'{\"source\": \"TSG1917\"}'),(37,'NPA-2026-003','product_name','Global Green Bond ETF','MANUAL',100.00,NULL),(38,'NPA-2026-003','product_type','ETF','AUTO',97.00,'{\"source\": \"Classification Agent\"}'),(39,'NPA-2026-003','business_unit','Wealth Management','AUTO',99.00,NULL),(40,'NPA-2026-003','notional_amount','120000000','MANUAL',100.00,NULL),(41,'NPA-2026-003','business_rationale','Growing demand for ESG-compliant investment products in APAC wealth segment.','MANUAL',100.00,NULL),(42,'NPA-2026-003','risk_classification','HIGH','AUTO',94.00,NULL),(43,'NPA-2026-004','product_name','Crypto Custody Prime','MANUAL',100.00,NULL),(44,'NPA-2026-004','product_type','Custody Services','AUTO',96.00,NULL),(45,'NPA-2026-004','business_unit','Digital Assets','AUTO',99.00,NULL),(46,'NPA-2026-004','notional_amount','85000000','MANUAL',100.00,NULL),(47,'NPA-2026-004','risk_classification','HIGH','AUTO',97.00,NULL),(48,'NPA-2026-004','tech_requirements','Thales Luna HSM with multi-sig 3-of-5 threshold. Cold storage infrastructure.','MANUAL',100.00,NULL),(49,'NPA-2026-005','product_name','AI Wealth Advisory Platform','MANUAL',100.00,NULL),(50,'NPA-2026-005','product_type','Advisory','AUTO',98.00,NULL),(51,'NPA-2026-005','business_unit','Wealth Management','AUTO',99.00,NULL),(52,'NPA-2026-005','notional_amount','15000000','MANUAL',100.00,NULL),(53,'NPA-2026-005','risk_classification','LOW','AUTO',96.00,NULL),(54,'NPA-2026-005','tech_requirements','Claude API integration. Existing wealth platform UI.','MANUAL',100.00,NULL);
ALTER TABLE `npa_form_data` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_intake_assessments` WRITE;
ALTER TABLE `npa_intake_assessments` DISABLE KEYS;
INSERT INTO `npa_intake_assessments` (`id`, `project_id`, `domain`, `status`, `score`, `findings`, `assessed_at`) VALUES (1,'NPA-2026-001','STRATEGIC','PASS',100,'{\"observation\": \"Aligns with digital transformation strategy.\"}','2026-02-11 02:50:09'),(2,'NPA-2026-001','RISK','WARN',60,'{\"observation\": \"New risk categories: Custody Risk, Cyber Risk.\"}','2026-02-11 02:50:09'),(3,'NPA-2026-001','LEGAL','FAIL',40,'{\"observation\": \"Cross-border legal opinion for HK pending.\"}','2026-02-11 02:50:09'),(4,'NPA-2026-001','OPS','PASS',85,'{\"observation\": \"Settlement process defined. Manual exception handling initially.\"}','2026-02-11 02:50:09'),(5,'NPA-2026-001','TECH','WARN',70,'{\"observation\": \"New custody wallet infrastructure required.\"}','2026-02-11 02:50:09'),(6,'NPA-2026-001','DATA','PASS',90,'{\"observation\": \"Data privacy requirements mapped.\"}','2026-02-11 02:50:09'),(7,'NPA-2026-001','FINANCE','PASS',100,'{\"observation\": \"ROI analysis completed and approved.\"}','2026-02-11 02:50:09'),(8,'NPA-2026-002','STRATEGIC','PASS',100,'{\"observation\": \"Standard product extension.\"}','2026-02-11 02:50:09'),(9,'NPA-2026-002','RISK','PASS',85,'{\"observation\": \"Standard FX option risk within tolerance.\"}','2026-02-11 02:50:09'),(10,'NPA-2026-002','LEGAL','PASS',95,'{\"observation\": \"Existing ISDA framework applies.\"}','2026-02-11 02:50:09'),(11,'NPA-2026-002','OPS','PASS',100,'{\"observation\": \"Existing booking model applies.\"}','2026-02-11 02:50:09'),(12,'NPA-2026-002','TECH','PASS',100,'{\"observation\": \"Murex already configured for GBP/USD.\"}','2026-02-11 02:50:09'),(13,'NPA-2026-002','DATA','PASS',95,'{\"observation\": \"Standard reporting already in place.\"}','2026-02-11 02:50:09'),(14,'NPA-2026-002','FINANCE','PASS',90,'{\"observation\": \"ROAE meets minimum threshold.\"}','2026-02-11 02:50:09'),(15,'NPA-2026-003','STRATEGIC','PASS',100,'{\"observation\": \"Strong alignment with ESG strategy.\"}','2026-02-11 02:50:09'),(16,'NPA-2026-003','RISK','WARN',65,'{\"observation\": \"ESG rating methodology risk. Greenwashing risk.\"}','2026-02-11 02:50:09'),(17,'NPA-2026-003','LEGAL','WARN',70,'{\"observation\": \"Multi-jurisdiction regulatory requirements.\"}','2026-02-11 02:50:09'),(18,'NPA-2026-003','OPS','PASS',80,'{\"observation\": \"ETF creation/redemption process needs setup.\"}','2026-02-11 02:50:09'),(19,'NPA-2026-003','TECH','WARN',75,'{\"observation\": \"New index tracking system required.\"}','2026-02-11 02:50:09'),(20,'NPA-2026-003','DATA','PASS',85,'{\"observation\": \"ESG data aggregation pipeline needed.\"}','2026-02-11 02:50:09'),(21,'NPA-2026-003','FINANCE','PASS',95,'{\"observation\": \"Strong revenue projections. Meets ROAE threshold.\"}','2026-02-11 02:50:09'),(22,'NPA-2026-004','STRATEGIC','PASS',90,'{\"observation\": \"Addresses growing institutional demand.\"}','2026-02-11 02:50:09'),(23,'NPA-2026-004','RISK','WARN',55,'{\"observation\": \"DeFi integration introduces smart contract risk.\"}','2026-02-11 02:50:09'),(24,'NPA-2026-004','LEGAL','WARN',60,'{\"observation\": \"Evolving regulatory landscape for digital assets.\"}','2026-02-11 02:50:09'),(25,'NPA-2026-004','OPS','PASS',75,'{\"observation\": \"Cold storage operations require specialized training.\"}','2026-02-11 02:50:09'),(26,'NPA-2026-004','TECH','FAIL',45,'{\"observation\": \"HSM infrastructure build required. 4-6 weeks lead time.\"}','2026-02-11 02:50:09'),(27,'NPA-2026-004','DATA','PASS',80,'{\"observation\": \"Blockchain data integration needed.\"}','2026-02-11 02:50:09'),(28,'NPA-2026-004','FINANCE','PASS',88,'{\"observation\": \"Revenue model validated by Finance.\"}','2026-02-11 02:50:09'),(29,'NPA-2026-005','STRATEGIC','PASS',100,'{\"observation\": \"Strong alignment with AI-first strategy.\"}','2026-02-11 02:50:09'),(30,'NPA-2026-005','RISK','PASS',90,'{\"observation\": \"Low risk - advisory only, no principal risk.\"}','2026-02-11 02:50:09'),(31,'NPA-2026-005','LEGAL','PASS',85,'{\"observation\": \"AI advisory regulations reviewed.\"}','2026-02-11 02:50:09'),(32,'NPA-2026-005','OPS','PASS',95,'{\"observation\": \"Existing wealth platform infrastructure.\"}','2026-02-11 02:50:09'),(33,'NPA-2026-005','TECH','PASS',80,'{\"observation\": \"Claude API integration straightforward.\"}','2026-02-11 02:50:09'),(34,'NPA-2026-005','DATA','PASS',90,'{\"observation\": \"Customer data handling reviewed.\"}','2026-02-11 02:50:09'),(35,'NPA-2026-005','FINANCE','PASS',85,'{\"observation\": \"Subscription revenue model validated.\"}','2026-02-11 02:50:09'),(36,'NPA-2026-006','STRATEGIC','PASS',100,'{\"observation\": \"Standard product enhancement.\"}','2026-02-11 02:50:09'),(37,'NPA-2026-006','RISK','PASS',100,'{\"observation\": \"No additional risk.\"}','2026-02-11 02:50:09'),(38,'NPA-2026-006','OPS','PASS',100,'{\"observation\": \"Existing processes apply.\"}','2026-02-11 02:50:09'),(39,'NPA-2026-007','STRATEGIC','PASS',95,'{\"observation\": \"Strong client demand for FX accumulator.\"}','2026-02-11 02:50:09'),(40,'NPA-2026-007','RISK','WARN',70,'{\"observation\": \"Knock-out barrier risk requires monitoring.\"}','2026-02-11 02:50:09'),(41,'NPA-2026-007','FINANCE','PASS',85,'{\"observation\": \"ROAE validated. Barrier risk priced appropriately.\"}','2026-02-11 02:50:09'),(42,'NPA-2026-008','STRATEGIC','PASS',90,'{\"observation\": \"Supports ESG lending targets.\"}','2026-02-11 02:50:09'),(43,'NPA-2026-008','RISK','FAIL',35,'{\"observation\": \"ESG scoring methodology not validated.\"}','2026-02-11 02:50:09'),(44,'NPA-2026-008','LEGAL','FAIL',30,'{\"observation\": \"Vietnam legal framework inadequate.\"}','2026-02-11 02:50:09'),(45,'NPA-2026-008','FINANCE','FAIL',40,'{\"observation\": \"ROAE below minimum threshold.\"}','2026-02-11 02:50:09'),(46,'NPA-2026-009','STRATEGIC','PASS',95,'{\"observation\": \"Automates manual hedging processes.\"}','2026-02-11 02:50:09'),(47,'NPA-2026-009','RISK','PASS',80,'{\"observation\": \"Algorithm risk within tolerance.\"}','2026-02-11 02:50:09'),(48,'NPA-2026-009','TECH','WARN',65,'{\"observation\": \"ML model deployment requires review.\"}','2026-02-11 02:50:09'),(49,'NPA-2026-010','STRATEGIC','PASS',100,'{\"observation\": \"First-mover advantage in carbon trading.\"}','2026-02-11 02:50:09'),(50,'NPA-2026-010','RISK','WARN',55,'{\"observation\": \"Carbon credit valuation risk.\"}','2026-02-11 02:50:09'),(51,'NPA-2026-010','LEGAL','WARN',60,'{\"observation\": \"Regulatory framework still evolving.\"}','2026-02-11 02:50:09'),(52,'NPA-2026-011','STRATEGIC','PASS',100,'{\"observation\": \"Minor UI improvement.\"}','2026-02-11 02:50:09'),(53,'NPA-2026-011','RISK','PASS',100,'{\"observation\": \"No risk impact.\"}','2026-02-11 02:50:09'),(54,'NPA-2026-012','STRATEGIC','FAIL',0,'{\"observation\": \"PROHIBITED - Leveraged crypto CFDs for retail.\"}','2026-02-11 02:50:09'),(55,'NPA-2026-012','RISK','FAIL',0,'{\"observation\": \"PROHIBITED - Regulatory non-compliance.\"}','2026-02-11 02:50:09');
ALTER TABLE `npa_intake_assessments` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_jurisdictions` WRITE;
ALTER TABLE `npa_jurisdictions` DISABLE KEYS;
INSERT INTO `npa_jurisdictions` (`project_id`, `jurisdiction_code`) VALUES ('NPA-2026-001','SG'),('NPA-2026-001','HK'),('NPA-2026-002','SG'),('NPA-2026-003','SG'),('NPA-2026-003','HK'),('NPA-2026-003','LN'),('NPA-2026-004','HK'),('NPA-2026-004','SG'),('NPA-2026-005','SG'),('NPA-2026-006','SG'),('NPA-2026-007','SG'),('NPA-2026-008','SG'),('NPA-2026-008','VN'),('NPA-2026-008','ID'),('NPA-2026-009','SG'),('NPA-2026-010','SG'),('NPA-2026-010','AU'),('NPA-2026-011','SG'),('NPA-2026-012','SG');
ALTER TABLE `npa_jurisdictions` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_kpi_snapshots` WRITE;
ALTER TABLE `npa_kpi_snapshots` DISABLE KEYS;
INSERT INTO `npa_kpi_snapshots` (`id`, `snapshot_date`, `pipeline_value`, `active_npas`, `avg_cycle_days`, `approval_rate`, `approvals_completed`, `approvals_total`, `critical_risks`, `created_at`) VALUES (1,'2026-02-11',142500000.00,42,32.00,94.00,178,190,3,'2026-02-11 02:50:09'),(2,'2026-01-11',128000000.00,38,34.50,92.00,165,180,5,'2026-02-11 02:50:09'),(3,'2025-12-11',115000000.00,35,36.00,91.00,155,170,4,'2026-02-11 02:50:09');
ALTER TABLE `npa_kpi_snapshots` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_loop_backs` WRITE;
ALTER TABLE `npa_loop_backs` DISABLE KEYS;
INSERT INTO `npa_loop_backs` (`id`, `project_id`, `loop_back_number`, `loop_back_type`, `initiated_by_party`, `initiator_name`, `reason`, `requires_npa_changes`, `routed_to`, `routing_reasoning`, `initiated_at`, `resolved_at`, `delay_days`, `resolution_type`, `resolution_details`) VALUES (1,'NPA-2026-001',1,'APPROVAL_CLARIFICATION','Legal & Compliance','Lisa Wong','External legal opinion required for HK cross-border jurisdiction.',1,'MAKER','Requires procurement of external legal opinion - cannot be handled by AI.','2025-12-15 10:00:00',NULL,NULL,NULL,NULL),(2,'NPA-2026-002',1,'APPROVAL_CLARIFICATION','Finance (PC)','Mark Lee','Need clarification on VaR impact assessment.',0,'AI','Question can be answered from existing NPA data and KB historical analysis.','2026-01-18 09:00:00','2026-01-18 09:05:00',0.00,'AI_ANSWERED','Conversational Diligence Agent provided VaR estimate of $360K based on similar NPA TSG1917.'),(3,'NPA-2026-004',1,'APPROVAL_CLARIFICATION','Technology','Rachel Ng','Cold storage HSM architecture details needed for security assessment.',1,'MAKER','Technical architecture documentation requires maker input.','2026-02-08 10:00:00','2026-02-09 16:00:00',1.25,'MAKER_FIXED','Maker provided Thales Luna HSM architecture document with multi-sig details.'),(4,'NPA-2026-008',1,'APPROVAL_CLARIFICATION','RMG-Credit','Jane Tan','ESG scoring methodology needs alignment with MBS Sustainability Framework.',1,'MAKER','Requires fundamental ESG methodology rework.','2025-10-25 10:00:00','2025-11-01 14:00:00',7.00,'MAKER_FIXED','Maker updated ESG scoring to align with MBS framework v3.2.'),(5,'NPA-2026-008',2,'APPROVAL_CLARIFICATION','Finance (PC)','Mark Lee','ROAE projections unrealistic. Revenue model needs revision.',1,'MAKER','Revenue model fundamentally flawed - requires maker correction.','2025-11-10 09:00:00','2025-11-18 16:00:00',8.50,'MAKER_FIXED','Maker revised revenue model with conservative assumptions.'),(6,'NPA-2026-008',3,'APPROVAL_CLARIFICATION','Legal & Compliance','Lisa Wong','Vietnam legal framework assessment inadequate. Local counsel engagement required.',1,'MAKER','Requires procurement of local legal counsel in Vietnam.','2025-11-25 10:00:00',NULL,NULL,'ESCALATED','Circuit breaker triggered after 3 loop-backs. Escalated to NPA Governance Forum.');
ALTER TABLE `npa_loop_backs` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_market_clusters` WRITE;
ALTER TABLE `npa_market_clusters` DISABLE KEYS;
INSERT INTO `npa_market_clusters` (`id`, `cluster_name`, `npa_count`, `growth_percent`, `intensity_percent`, `created_at`) VALUES (1,'Sustainability (ESG)',18,45.00,85.00,'2026-02-11 02:50:09'),(2,'Digital Assets',12,120.00,95.00,'2026-02-11 02:50:09'),(3,'AI Advisory',9,28.00,60.00,'2026-02-11 02:50:09'),(4,'SME Lending',24,12.00,40.00,'2026-02-11 02:50:09');
ALTER TABLE `npa_market_clusters` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_market_risk_factors` WRITE;
ALTER TABLE `npa_market_risk_factors` DISABLE KEYS;
INSERT INTO `npa_market_risk_factors` (`id`, `project_id`, `risk_factor`, `is_applicable`, `sensitivity_report`, `var_capture`, `stress_capture`, `notes`) VALUES (1,'NPA-2026-001','CRYPTO_DELTA',1,1,1,1,'BTC/ETH/stablecoin price movements'),(2,'NPA-2026-001','CRYPTO_VEGA',1,1,1,1,'Implied volatility on digital assets'),(3,'NPA-2026-001','FX_DELTA',1,1,1,1,'USD/SGD exposure from custody fees'),(4,'NPA-2026-001','CORRELATION',1,1,0,1,'Cross-asset correlation risk'),(5,'NPA-2026-007','FX_DELTA',1,1,1,1,'USD/SGD spot rate sensitivity'),(6,'NPA-2026-007','FX_VEGA',1,1,1,1,'USD/SGD implied volatility'),(7,'NPA-2026-007','IR_DELTA',1,1,1,1,'Interest rate differential impact'),(8,'NPA-2026-007','CORRELATION',1,0,0,1,'FX-rates correlation under stress'),(9,'NPA-2026-003','IR_DELTA',1,1,1,1,'Duration risk on green bond portfolio'),(10,'NPA-2026-003','IR_VEGA',0,0,0,0,'Not applicable for bond ETF'),(11,'NPA-2026-003','CREDIT_SPREAD',1,1,1,1,'Green bond credit spread widening'),(12,'NPA-2026-003','FX_DELTA',1,1,1,1,'Multi-currency bond holdings'),(13,'NPA-2026-003','LIQUIDITY',1,1,0,1,'ETF creation/redemption liquidity risk'),(14,'NPA-2026-010','COMMODITY',1,1,1,1,'Carbon credit price volatility'),(15,'NPA-2026-010','FX_DELTA',1,1,1,0,'Multi-currency settlement exposure'),(16,'NPA-2026-010','CORRELATION',1,0,0,1,'Carbon-energy correlation risk'),(17,'NPA-2026-002','FX_DELTA',1,1,1,1,'GBP/USD spot sensitivity'),(18,'NPA-2026-002','FX_VEGA',1,1,1,1,'GBP/USD implied vol sensitivity'),(19,'NPA-2026-002','FX_GAMMA',1,1,1,1,'Second-order delta sensitivity'),(20,'NPA-2026-002','IR_DELTA',1,1,1,0,'GBP vs USD rate differential');
ALTER TABLE `npa_market_risk_factors` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_monitoring_thresholds` WRITE;
ALTER TABLE `npa_monitoring_thresholds` DISABLE KEYS;
INSERT INTO `npa_monitoring_thresholds` (`id`, `project_id`, `metric_name`, `warning_value`, `critical_value`, `comparison`, `is_active`, `created_at`) VALUES (1,'NPA-2026-007','monthly_volume',350000000.00,250000000.00,'LT',1,'2026-02-11 04:32:26'),(2,'NPA-2026-007','var_utilization_pct',80.00,95.00,'GT',1,'2026-02-11 04:32:26'),(3,'NPA-2026-007','counterparty_exposure',180000000.00,195000000.00,'GT',1,'2026-02-11 04:32:26'),(4,'NPA-2026-007','realized_pnl_monthly',1500000.00,500000.00,'LT',1,'2026-02-11 04:32:26'),(5,'NPA-2026-007','active_breaches',1.00,3.00,'GT',1,'2026-02-11 04:32:26'),(6,'NPA-2026-006','deposit_volume',100000000.00,50000000.00,'LT',1,'2026-02-11 04:32:26'),(7,'NPA-2026-006','interest_cost_ratio',2.50,3.00,'GT',1,'2026-02-11 04:32:26'),(8,'NPA-2026-006','customer_churn_pct',5.00,10.00,'GT',1,'2026-02-11 04:32:26'),(9,'NPA-2026-006','regulatory_breaches',0.00,1.00,'GT',1,'2026-02-11 04:32:26');
ALTER TABLE `npa_monitoring_thresholds` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_performance_metrics` WRITE;
ALTER TABLE `npa_performance_metrics` DISABLE KEYS;
INSERT INTO `npa_performance_metrics` (`id`, `project_id`, `days_since_launch`, `total_volume`, `volume_currency`, `realized_pnl`, `active_breaches`, `counterparty_exposure`, `var_utilization`, `collateral_posted`, `next_review_date`, `health_status`, `snapshot_date`) VALUES (1,'NPA-2026-006',133,42800000.00,'SGD',1200000.00,0,0.00,22.50,0.00,'2026-04-01','healthy','2026-02-11 02:50:09'),(2,'NPA-2026-007',149,128500000.00,'USD',3800000.00,2,87000000.00,68.00,12500000.00,'2026-03-15','warning','2026-02-11 02:50:09'),(3,'NPA-2026-003',90,85200000.00,'USD',-400000.00,3,42000000.00,78.50,8500000.00,'2026-02-28','critical','2026-02-11 02:50:09'),(4,'NPA-2026-001',30,15000000.00,'USD',450000.00,0,12000000.00,15.00,3000000.00,'2026-06-15','healthy','2026-02-11 02:50:09');
ALTER TABLE `npa_performance_metrics` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_post_launch_conditions` WRITE;
ALTER TABLE `npa_post_launch_conditions` DISABLE KEYS;
INSERT INTO `npa_post_launch_conditions` (`id`, `project_id`, `condition_text`, `owner_party`, `due_date`, `status`) VALUES (1,'NPA-2026-007','Implement daily VaR reporting to MLR within 30 days of launch','MLR','2026-02-20','COMPLETED'),(2,'NPA-2026-007','Complete staff training for all FX desk traders on accumulator risk','Operations','2026-02-15','COMPLETED'),(3,'NPA-2026-007','Submit quarterly performance report to Risk Committee','Finance','2026-03-31','PENDING'),(4,'NPA-2026-007','Conduct 90-day Post-Implementation Review (PIR)','Product Mgmt','2026-04-20','PENDING'),(5,'NPA-2026-007','Establish counterparty concentration monitoring with $200M per-name limit','Credit','2026-01-25','COMPLETED'),(6,'NPA-2026-006','Update pricing engine for multi-currency interest calculation','Technology','2026-01-30','COMPLETED'),(7,'NPA-2026-006','Conduct anti-money laundering review for cross-border deposits','Compliance','2026-02-28','COMPLETED'),(8,'NPA-2026-006','Submit annual product review to Governance Forum','Product Mgmt','2026-12-31','PENDING'),(9,'NPA-2026-011','Complete user acceptance testing with 50 pilot users','Technology','2026-02-15','COMPLETED'),(10,'NPA-2026-011','Update customer-facing terms and conditions','Legal','2026-02-10','COMPLETED');
ALTER TABLE `npa_post_launch_conditions` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_prerequisite_results` WRITE;
ALTER TABLE `npa_prerequisite_results` DISABLE KEYS;
INSERT INTO `npa_prerequisite_results` (`id`, `project_id`, `check_id`, `status`, `evidence`, `validated_by`, `validated_at`) VALUES (1,'NPA-2026-001',1,'PASS','Business case approved by ExCo Jan 2026','Sarah Lim','2026-01-14 12:00:00'),(2,'NPA-2026-001',2,'PASS','Validated by responsible team','Sarah Lim','2026-01-14 12:00:00'),(3,'NPA-2026-001',3,'PASS','Validated by responsible team','Sarah Lim','2026-01-14 12:00:00'),(4,'NPA-2026-001',4,'PASS','Validated by responsible team','Sarah Lim','2026-01-14 12:00:00'),(5,'NPA-2026-001',5,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(6,'NPA-2026-001',6,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(7,'NPA-2026-001',7,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(8,'NPA-2026-001',8,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(9,'NPA-2026-001',9,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(10,'NPA-2026-001',10,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(11,'NPA-2026-001',11,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(12,'NPA-2026-001',12,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(13,'NPA-2026-001',13,'PASS','Validated by responsible team','Alex Kumar','2026-01-14 12:00:00'),(14,'NPA-2026-001',14,'PASS','Validated by responsible team','Alex Kumar','2026-01-14 12:00:00'),(15,'NPA-2026-001',15,'PASS','Penetration testing completed by CrowdStrike, no critical findings','Alex Kumar','2026-01-14 12:00:00'),(16,'NPA-2026-001',16,'PASS','Validated by responsible team','Alex Kumar','2026-01-14 12:00:00'),(17,'NPA-2026-001',17,'PASS','MAS CMS license extension filed, SFC Type 1 application submitted','Lisa Wong','2026-01-14 12:00:00'),(18,'NPA-2026-001',18,'PASS','Validated by responsible team','Lisa Wong','2026-01-14 12:00:00'),(19,'NPA-2026-001',19,'PASS','Validated by responsible team','Lisa Wong','2026-01-14 12:00:00'),(20,'NPA-2026-001',20,'PASS','Validated by responsible team','Lisa Wong','2026-01-14 12:00:00'),(21,'NPA-2026-001',21,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(22,'NPA-2026-001',22,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(23,'NPA-2026-001',23,'PASS','4-layer prohibited check PASSED on Jan 15 2026','System','2026-01-14 12:00:00'),(24,'NPA-2026-001',24,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(25,'NPA-2026-001',25,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(26,'NPA-2026-001',26,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(27,'NPA-2026-001',27,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(28,'NPA-2026-001',28,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(29,'NPA-2026-001',29,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(30,'NPA-2026-001',30,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(31,'NPA-2026-001',31,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(32,'NPA-2026-001',32,'PASS','Validated by responsible team','System','2026-01-14 12:00:00'),(64,'NPA-2026-003',5,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(65,'NPA-2026-003',6,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(66,'NPA-2026-003',7,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(67,'NPA-2026-003',24,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(68,'NPA-2026-003',25,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(69,'NPA-2026-003',26,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(70,'NPA-2026-003',27,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(71,'NPA-2026-003',28,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(72,'NPA-2026-003',29,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(73,'NPA-2026-003',30,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(74,'NPA-2026-003',31,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(75,'NPA-2026-003',32,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(76,'NPA-2026-003',17,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(77,'NPA-2026-003',18,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(78,'NPA-2026-003',19,'PENDING','Auto-validated during NPA creation','James Liu',NULL),(79,'NPA-2026-003',20,'PENDING','Auto-validated during NPA creation','James Liu',NULL),(80,'NPA-2026-003',21,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(81,'NPA-2026-003',22,'PENDING','Auto-validated during NPA creation','James Liu',NULL),(82,'NPA-2026-003',23,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(83,'NPA-2026-003',8,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(84,'NPA-2026-003',9,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(85,'NPA-2026-003',10,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(86,'NPA-2026-003',11,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(87,'NPA-2026-003',12,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(88,'NPA-2026-003',1,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(89,'NPA-2026-003',2,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(90,'NPA-2026-003',3,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(91,'NPA-2026-003',4,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(92,'NPA-2026-003',13,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(93,'NPA-2026-003',14,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(94,'NPA-2026-003',15,'PASS','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(95,'NPA-2026-003',16,'PENDING','Auto-validated during NPA creation','James Liu','2026-01-18 12:00:00'),(127,'NPA-2026-010',1,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(128,'NPA-2026-010',2,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(129,'NPA-2026-010',3,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(130,'NPA-2026-010',4,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(131,'NPA-2026-010',5,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(132,'NPA-2026-010',6,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(133,'NPA-2026-010',7,'PENDING',NULL,'Alex Rivera',NULL),(134,'NPA-2026-010',8,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(135,'NPA-2026-010',9,'PENDING',NULL,'Alex Rivera',NULL),(136,'NPA-2026-010',10,'PENDING',NULL,'Alex Rivera',NULL),(137,'NPA-2026-010',11,'PENDING',NULL,'Alex Rivera',NULL),(138,'NPA-2026-010',12,'PENDING',NULL,'Alex Rivera',NULL),(139,'NPA-2026-010',13,'PENDING',NULL,'Alex Rivera',NULL),(140,'NPA-2026-010',14,'PENDING',NULL,'Alex Rivera',NULL),(141,'NPA-2026-010',15,'PENDING',NULL,'Alex Rivera',NULL),(142,'NPA-2026-010',16,'PENDING',NULL,'Alex Rivera',NULL),(143,'NPA-2026-010',17,'PENDING',NULL,'Alex Rivera',NULL),(144,'NPA-2026-010',18,'PENDING',NULL,'Alex Rivera',NULL),(145,'NPA-2026-010',19,'PENDING',NULL,'Alex Rivera',NULL),(146,'NPA-2026-010',20,'PENDING',NULL,'Alex Rivera',NULL),(147,'NPA-2026-010',21,'PENDING',NULL,'Alex Rivera',NULL),(148,'NPA-2026-010',22,'PENDING',NULL,'Alex Rivera',NULL),(149,'NPA-2026-010',23,'PENDING',NULL,'Alex Rivera',NULL),(150,'NPA-2026-010',24,'PENDING',NULL,'Alex Rivera',NULL),(151,'NPA-2026-010',25,'PENDING',NULL,'Alex Rivera',NULL),(152,'NPA-2026-010',26,'PENDING',NULL,'Alex Rivera',NULL),(153,'NPA-2026-010',27,'PENDING',NULL,'Alex Rivera',NULL),(154,'NPA-2026-010',28,'PENDING',NULL,'Alex Rivera',NULL),(155,'NPA-2026-010',29,'PENDING',NULL,'Alex Rivera',NULL),(156,'NPA-2026-010',30,'PASS','Completed during ideation phase','Alex Rivera','2026-02-01 10:00:00'),(157,'NPA-2026-010',31,'PENDING',NULL,'Alex Rivera',NULL),(158,'NPA-2026-010',32,'PENDING',NULL,'Alex Rivera',NULL);
ALTER TABLE `npa_prerequisite_results` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_projects` WRITE;
ALTER TABLE `npa_projects` DISABLE KEYS;
INSERT INTO `npa_projects` (`id`, `title`, `description`, `product_category`, `npa_type`, `risk_level`, `is_cross_border`, `notional_amount`, `currency`, `current_stage`, `status`, `submitted_by`, `product_manager`, `pm_team`, `template_name`, `kickoff_date`, `proposal_preparer`, `pac_approval_status`, `approval_track`, `estimated_revenue`, `predicted_approval_likelihood`, `predicted_timeline_days`, `predicted_bottleneck`, `created_at`, `updated_at`, `launched_at`, `pir_status`, `pir_due_date`, `classification_confidence`, `classification_method`) VALUES ('NPA-2026-001','Digital Asset Custody Expansion','Proposal to expand digital asset custody services to institutional clients across APAC.','Custody Services','New-to-Group','HIGH',1,50000000.00,'USD','PENDING_SIGN_OFFS','At Risk','Sarah Jenkins','Sarah Jenkins','Digital Solutions','Standard NPA v2.1','2025-11-15','Michael Chen','In Review','FULL_NPA',12800000.00,65.00,14.50,'Legal & Compliance','2025-11-15 09:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-002','FX Put Option GBP/USD','Extension of existing FX Option product with new GBP/USD currency pair for corporate hedging clients.','FX Derivatives','Variation','MEDIUM',0,75000000.00,'USD','PENDING_SIGN_OFFS','On Track','Sarah Lim','Sarah Lim','FX Trading','NPA Lite v1.0','2025-12-01','David Chen','N/A','NPA_LITE',3200000.00,78.00,4.20,'Finance','2025-12-01 10:30:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-003','Global Green Bond ETF','Launch of ESG-compliant green bond exchange-traded fund for wealth management clients.','Fixed Income / ETF','New-to-Group','HIGH',1,120000000.00,'USD','RISK_ASSESSMENT','On Track','Sarah Jenkins','Sarah Jenkins','Investment Products','ETF Template v2.1','2025-11-01','John Smith','Pending','FULL_NPA',15200000.00,72.00,18.00,'RMG-Credit','2025-11-01 08:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-004','Crypto Custody Prime','Premium custody solution for high-net-worth digital asset holders with cold storage and DeFi integration.','Digital Custody','Variation','HIGH',1,85000000.00,'USD','DCE_REVIEW','At Risk','Mike Ross','Mike Ross','Digital Solutions','Custody Template v1.3','2025-12-20','Emily Chen','In Review','FULL_NPA',9100000.00,55.00,12.00,'Technology','2025-12-20 11:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-005','AI Wealth Advisory Platform','AI-powered investment advisory service for mass affluent segment using Claude models.','Advisory','Existing','LOW',0,15000000.00,'SGD','DISCOVERY','On Track','Elena Torres','Elena Torres','Wealth Technology','Advisory Template v1.0','2026-01-10','Jessica Wu','N/A','NPA_LITE',8500000.00,88.00,3.50,'Operations','2026-01-10 09:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-006','Multi-Currency Deposit','Enhancement to existing multi-currency time deposit product with new tenor options.','Deposit','Variation','LOW',0,200000000.00,'SGD','LAUNCHED','Completed','Amanda Lee','Amanda Lee','Consumer Products','Deposit Template v3.0','2025-09-15','David Chen','Approved','EVERGREEN',1200000.00,95.00,0.50,NULL,'2025-09-15 08:00:00','0000-00-00 00:00:00','2025-10-01 00:00:00','NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-007','FX Accumulator - USD/SGD','Leveraged FX accumulator structure for USD/SGD with knock-out barriers.','FX Derivatives','Variation','MEDIUM',0,150000000.00,'USD','LAUNCHED','Warning','James Liu','James Liu','FX Trading','FX Structured v2.0','2025-08-01','Amanda Lee','Approved','FULL_NPA',3800000.00,82.00,8.00,'Finance','2025-08-01 07:30:00','0000-00-00 00:00:00','2025-09-15 00:00:00','PENDING','2026-03-15',NULL,NULL),('NPA-2026-008','ESG-Linked Trade Finance','Sustainability-linked trade finance facility with ESG performance targets and margin incentives.','Trade Finance','New-to-Group','HIGH',1,45000000.00,'USD','PENDING_SIGN_OFFS','Blocked','Robert Tan','Robert Tan','Institutional Banking','Trade Finance v1.5','2025-10-01','James Liu','Pending','FULL_NPA',2800000.00,45.00,22.00,'Legal & Compliance','2025-10-01 10:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-009','Algorithmic FX Hedging Bot','Automated FX hedging algorithm for corporate treasury clients using ML-driven execution.','FX Derivatives','Existing','MEDIUM',0,30000000.00,'USD','RISK_ASSESSMENT','On Track','Elena Torres','Elena Torres','FX Technology','Advisory Template v1.0','2026-01-05','Alex Rivera','N/A','NPA_LITE',6500000.00,85.00,5.00,'Technology','2026-01-05 14:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-010','Carbon Credit Exchange','Platform for trading verified carbon credits across APAC markets with blockchain settlement.','Commodities / ESG','New-to-Group','HIGH',1,90000000.00,'USD','DISCOVERY','On Track','Sarah Jenkins','Sarah Jenkins','Sustainability Products','Standard NPA v2.1','2026-01-20','Michael Chen','Pending','FULL_NPA',12000000.00,60.00,20.00,'RMG-Credit','2026-01-20 09:30:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-011','Retail Wealth App - UI Enhancement','Minor UI updates to existing wealth app portfolio view. No change to product logic or risk.','Retail Banking','Existing','LOW',0,0.00,'SGD','APPROVED','Completed','Jessica Wu','Jessica Wu','Consumer Products','Evergreen Template v1.0','2026-01-25','Amanda Lee','N/A','EVERGREEN',0.00,98.00,0.50,NULL,'2026-01-25 11:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL),('NPA-2026-012','Leveraged Crypto CFD Product','Contracts for Difference on cryptocurrency pairs with 10x leverage for retail clients.','Crypto Derivatives','New-to-Group','HIGH',0,25000000.00,'USD','PROHIBITED','Stopped','Alex Rivera','Alex Rivera','Digital Assets',NULL,'2026-02-01',NULL,'N/A','PROHIBITED',0.00,0.00,0.00,'Prohibited List Checker','2026-02-01 15:00:00','0000-00-00 00:00:00',NULL,'NOT_REQUIRED',NULL,NULL,NULL);
ALTER TABLE `npa_projects` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_prospects` WRITE;
ALTER TABLE `npa_prospects` DISABLE KEYS;
INSERT INTO `npa_prospects` (`id`, `name`, `theme`, `probability`, `estimated_value`, `value_currency`, `status`, `created_at`) VALUES (1,'Tokenized Real Estate Fund','Digital Assets',25.00,45000000.00,'USD','Pre-Seed','2026-02-11 02:50:09'),(2,'Carbon Credit Exchange','Sustainability',60.00,120000000.00,'USD','Pre-Seed','2026-02-11 02:50:09'),(3,'Algorithmic FX Hedging','AI Advisory',40.00,15000000.00,'USD','Pre-Seed','2026-02-11 02:50:09'),(4,'Supply Chain Finance 2.0','SME Lending',85.00,8000000.00,'USD','Pre-Seed','2026-02-11 02:50:09'),(5,'Quantum Key Custody','Cybersecurity',10.00,200000000.00,'USD','Pre-Seed','2026-02-11 02:50:09');
ALTER TABLE `npa_prospects` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_risk_checks` WRITE;
ALTER TABLE `npa_risk_checks` DISABLE KEYS;
INSERT INTO `npa_risk_checks` (`id`, `project_id`, `check_layer`, `result`, `matched_items`, `checked_by`, `checked_at`) VALUES (1,'NPA-2026-001','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-15 09:37:01'),(2,'NPA-2026-001','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-15 09:37:02'),(3,'NPA-2026-001','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-15 09:37:03'),(4,'NPA-2026-001','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-15 09:37:04'),(5,'NPA-2026-003','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-19 09:00:10'),(6,'NPA-2026-003','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-19 09:00:11'),(7,'NPA-2026-003','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-19 09:00:12'),(8,'NPA-2026-003','DYNAMIC','WARNING','[\"Greenwashing scrutiny advisory\"]','RISK_AGENT','2026-01-19 09:00:13'),(9,'NPA-2026-004','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-21 10:00:01'),(10,'NPA-2026-004','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-21 10:00:02'),(11,'NPA-2026-004','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-21 10:00:03'),(12,'NPA-2026-004','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-21 10:00:04'),(13,'NPA-2026-007','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-10 09:00:01'),(14,'NPA-2026-007','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-10 09:00:02'),(15,'NPA-2026-007','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-10 09:00:03'),(16,'NPA-2026-007','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-10 09:00:04'),(17,'NPA-2026-010','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-02-01 09:30:01'),(18,'NPA-2026-010','REGULATORY','WARNING','[\"Novel regulatory landscape - Singapore Carbon Tax Act\"]','RISK_AGENT','2026-02-01 09:30:02'),(19,'NPA-2026-010','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-02-01 09:30:03'),(20,'NPA-2026-010','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-02-01 09:30:04'),(21,'NPA-2026-012','INTERNAL_POLICY','FAIL','[\"PRH_IP_02\",\"PRH_IP_03\"]','RISK_AGENT','2026-02-08 14:00:01'),(22,'NPA-2026-012','REGULATORY','FAIL','[\"PRH_RG_01\"]','RISK_AGENT','2026-02-08 14:00:02'),(23,'NPA-2026-012','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-02-08 14:00:03'),(24,'NPA-2026-012','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-02-08 14:00:04'),(25,'NPA-2026-002','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-12 11:00:01'),(26,'NPA-2026-002','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-12 11:00:02'),(27,'NPA-2026-002','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-12 11:00:03'),(28,'NPA-2026-002','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-12 11:00:04'),(29,'NPA-2026-008','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-22 09:00:01'),(30,'NPA-2026-008','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-22 09:00:02'),(31,'NPA-2026-008','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-22 09:00:03'),(32,'NPA-2026-008','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-22 09:00:04'),(33,'NPA-2026-009','INTERNAL_POLICY','PASS',NULL,'RISK_AGENT','2026-01-28 10:00:01'),(34,'NPA-2026-009','REGULATORY','PASS',NULL,'RISK_AGENT','2026-01-28 10:00:02'),(35,'NPA-2026-009','SANCTIONS','PASS',NULL,'RISK_AGENT','2026-01-28 10:00:03'),(36,'NPA-2026-009','DYNAMIC','PASS',NULL,'RISK_AGENT','2026-01-28 10:00:04');
ALTER TABLE `npa_risk_checks` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_signoffs` WRITE;
ALTER TABLE `npa_signoffs` DISABLE KEYS;
INSERT INTO `npa_signoffs` (`id`, `project_id`, `party`, `department`, `status`, `approver_user_id`, `approver_name`, `approver_email`, `decision_date`, `sla_deadline`, `sla_breached`, `started_review_at`, `comments`, `clarification_question`, `clarification_answer`, `clarification_answered_by`, `loop_back_count`, `created_at`) VALUES (1,'NPA-2026-001','RMG-Credit','RMG-Credit','APPROVED','USR-008','Jane Tan','jane.tan@mbs.com','2025-12-10 14:00:00','2025-12-12 09:00:00',0,'2025-12-08 10:00:00','Credit framework approved. Counterparty limits set at $50M.',NULL,NULL,NULL,0,'2025-12-06 09:00:00'),(2,'NPA-2026-001','Finance (PC)','Finance','APPROVED','USR-009','Mark Lee','mark.lee@mbs.com','2025-12-11 16:30:00','2025-12-13 09:00:00',0,'2025-12-09 11:00:00','ROAE meets threshold. Revenue projection validated.','What is the expected VaR impact?','Based on historical analysis, VaR impact is estimated at $360K daily.','AI',0,'2025-12-06 09:00:00'),(3,'NPA-2026-001','Legal & Compliance','Legal & Compliance','REWORK','USR-011','Lisa Wong','lisa.wong@mbs.com','2025-12-15 10:00:00','2025-12-14 09:00:00',1,'2025-12-12 14:00:00','Cross-border legal opinion for HK jurisdiction still pending from external counsel.','Has the external legal opinion for HK been commissioned?',NULL,NULL,1,'2025-12-06 09:00:00'),(4,'NPA-2026-001','MLR','MLR','APPROVED','USR-012','Ahmad Razak','ahmad.razak@mbs.com','2025-12-09 11:00:00','2025-12-11 09:00:00',0,'2025-12-07 09:00:00','AML/KYC requirements mapped. No concerns.',NULL,NULL,NULL,0,'2025-12-06 09:00:00'),(5,'NPA-2026-001','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,'2026-02-13 09:00:00',0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-06 09:00:00'),(6,'NPA-2026-001','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,'2026-02-13 09:00:00',0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-06 09:00:00'),(7,'NPA-2026-002','RMG-Credit','RMG-Credit','APPROVED','USR-008','Jane Tan','jane.tan@mbs.com','2026-01-15 10:00:00','2026-01-17 10:30:00',0,'2026-01-13 08:00:00','Standard FX option risk within tolerance.',NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(8,'NPA-2026-002','Finance (PC)','Finance','UNDER_REVIEW','USR-009','Mark Lee','mark.lee@mbs.com',NULL,'2026-02-14 10:30:00',0,'2026-02-12 09:00:00',NULL,NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(9,'NPA-2026-002','Finance VP','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(10,'NPA-2026-002','Operations','Operations','APPROVED','USR-013','Kevin Patel','kevin.patel@mbs.com','2026-01-16 15:00:00','2026-01-18 10:30:00',0,'2026-01-14 10:00:00','Standard booking flow. No operational concerns.',NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(11,'NPA-2026-002','Technology','Technology','APPROVED','USR-014','Rachel Ng','rachel.ng@mbs.com','2026-01-17 11:00:00','2026-01-19 10:30:00',0,'2026-01-15 14:00:00','Murex configuration verified. No build required.',NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(12,'NPA-2026-002','MLR','MLR','APPROVED','USR-012','Ahmad Razak','ahmad.razak@mbs.com','2026-01-14 09:00:00','2026-01-16 10:30:00',0,'2026-01-13 10:00:00','No AML concerns for standard FX product.',NULL,NULL,NULL,0,'2026-01-12 10:30:00'),(13,'NPA-2026-003','RMG-Credit','RMG-Credit','UNDER_REVIEW','USR-008','Jane Tan','jane.tan@mbs.com',NULL,'2026-02-14 08:00:00',0,'2026-02-10 09:00:00',NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(14,'NPA-2026-003','Finance (PC)','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(15,'NPA-2026-003','Finance VP','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(16,'NPA-2026-003','Legal & Compliance','Legal & Compliance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(17,'NPA-2026-003','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(18,'NPA-2026-003','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-12-15 08:00:00'),(19,'NPA-2026-004','RMG-Credit','RMG-Credit','APPROVED','USR-008','Jane Tan','jane.tan@mbs.com','2026-01-20 14:00:00','2026-01-22 11:00:00',0,'2026-01-18 09:00:00','Credit limits approved with enhanced monitoring.',NULL,NULL,NULL,0,'2026-01-15 11:00:00'),(20,'NPA-2026-004','Finance (PC)','Finance','APPROVED','USR-009','Mark Lee','mark.lee@mbs.com','2026-01-22 10:00:00','2026-01-24 11:00:00',0,'2026-01-19 14:00:00','Revenue model validated.',NULL,NULL,NULL,0,'2026-01-15 11:00:00'),(21,'NPA-2026-004','Technology','Technology','CLARIFICATION_NEEDED','USR-014','Rachel Ng','rachel.ng@mbs.com',NULL,'2026-02-12 11:00:00',0,'2026-02-08 10:00:00',NULL,'What is the cold storage architecture? Need details on HSM integration.','The architecture uses Thales Luna HSM with multi-sig 3-of-5 threshold. Full architecture doc attached.','MAKER',1,'2026-01-15 11:00:00'),(22,'NPA-2026-004','Legal & Compliance','Legal & Compliance','UNDER_REVIEW','USR-011','Lisa Wong','lisa.wong@mbs.com',NULL,'2026-02-14 11:00:00',0,'2026-02-10 11:00:00',NULL,NULL,NULL,NULL,0,'2026-01-15 11:00:00'),(23,'NPA-2026-004','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-15 11:00:00'),(24,'NPA-2026-004','MLR','MLR','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-15 11:00:00'),(25,'NPA-2026-005','RMG-Credit','RMG-Credit','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-20 09:00:00'),(26,'NPA-2026-005','Finance (PC)','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-20 09:00:00'),(27,'NPA-2026-005','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-20 09:00:00'),(28,'NPA-2026-005','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-01-20 09:00:00'),(29,'NPA-2026-006','Business Head','Consumer Banking','APPROVED','USR-007','Amanda Lee','amanda.lee@mbs.com','2025-09-20 10:00:00','2025-09-22 08:00:00',0,'2025-09-18 08:00:00','Approved. Standard deposit enhancement.',NULL,NULL,NULL,0,'2025-09-16 08:00:00'),(30,'NPA-2026-006','Group Product Head','Product Control','APPROVED','USR-006','David Chen','david.chen@mbs.com','2025-09-21 14:00:00','2025-09-23 08:00:00',0,'2025-09-19 09:00:00','Approved as Evergreen track.',NULL,NULL,NULL,0,'2025-09-16 08:00:00'),(31,'NPA-2026-007','RMG-Credit','RMG-Credit','APPROVED','USR-008','Jane Tan','jane.tan@mbs.com','2025-08-20 10:00:00','2025-08-22 07:30:00',0,'2025-08-18 08:00:00','Accumulator risk limits established.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(32,'NPA-2026-007','Finance (PC)','Finance','APPROVED','USR-009','Mark Lee','mark.lee@mbs.com','2025-08-22 14:00:00','2025-08-24 07:30:00',0,'2025-08-19 10:00:00','Pricing model validated. ROAE within targets.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(33,'NPA-2026-007','Finance VP','Finance','APPROVED','USR-010','Robert Koh','robert.koh@mbs.com','2025-08-25 09:00:00','2025-08-27 07:30:00',0,'2025-08-23 11:00:00','Approved. Monitor knock-out barrier closely.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(34,'NPA-2026-007','Operations','Operations','APPROVED','USR-013','Kevin Patel','kevin.patel@mbs.com','2025-08-21 16:00:00','2025-08-23 07:30:00',0,'2025-08-19 14:00:00','Operational readiness confirmed.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(35,'NPA-2026-007','Technology','Technology','APPROVED','USR-014','Rachel Ng','rachel.ng@mbs.com','2025-08-22 11:00:00','2025-08-24 07:30:00',0,'2025-08-20 09:00:00','Murex booking flow configured and tested.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(36,'NPA-2026-007','MLR','MLR','APPROVED','USR-012','Ahmad Razak','ahmad.razak@mbs.com','2025-08-19 15:00:00','2025-08-21 07:30:00',0,'2025-08-17 10:00:00','No AML concerns.',NULL,NULL,NULL,0,'2025-08-15 07:30:00'),(37,'NPA-2026-008','RMG-Credit','RMG-Credit','REWORK','USR-008','Jane Tan','jane.tan@mbs.com','2025-11-15 10:00:00','2025-11-10 10:00:00',1,'2025-11-05 09:00:00','ESG scoring methodology not aligned with MBS framework. Needs rework.',NULL,NULL,NULL,3,'2025-10-15 10:00:00'),(38,'NPA-2026-008','Finance (PC)','Finance','REJECTED','USR-009','Mark Lee','mark.lee@mbs.com','2025-11-20 14:00:00','2025-11-18 10:00:00',1,'2025-11-10 11:00:00','ROAE below minimum threshold. Revenue projections unrealistic.',NULL,NULL,NULL,2,'2025-10-15 10:00:00'),(39,'NPA-2026-008','Legal & Compliance','Legal & Compliance','REWORK','USR-011','Lisa Wong','lisa.wong@mbs.com','2025-12-01 09:00:00','2025-11-25 10:00:00',1,'2025-11-18 14:00:00','Vietnam legal framework insufficient. Need local counsel opinion.',NULL,NULL,NULL,2,'2025-10-15 10:00:00'),(40,'NPA-2026-008','MLR','MLR','APPROVED','USR-012','Ahmad Razak','ahmad.razak@mbs.com','2025-10-25 11:00:00','2025-10-27 10:00:00',0,'2025-10-20 09:00:00','AML checks passed for all jurisdictions.',NULL,NULL,NULL,0,'2025-10-15 10:00:00'),(41,'NPA-2026-008','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-10-15 10:00:00'),(42,'NPA-2026-008','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2025-10-15 10:00:00'),(43,'NPA-2026-009','RMG-Credit','RMG-Credit','UNDER_REVIEW','USR-008','Jane Tan','jane.tan@mbs.com',NULL,'2026-02-14 14:00:00',0,'2026-02-10 10:00:00',NULL,NULL,NULL,NULL,0,'2026-02-01 14:00:00'),(44,'NPA-2026-009','Finance (PC)','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 14:00:00'),(45,'NPA-2026-009','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 14:00:00'),(46,'NPA-2026-009','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 14:00:00'),(47,'NPA-2026-010','RMG-Credit','RMG-Credit','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(48,'NPA-2026-010','Finance (PC)','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(49,'NPA-2026-010','Finance VP','Finance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(50,'NPA-2026-010','Legal & Compliance','Legal & Compliance','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(51,'NPA-2026-010','Operations','Operations','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(52,'NPA-2026-010','Technology','Technology','PENDING',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,0,'2026-02-01 09:30:00'),(53,'NPA-2026-011','Business Head','Consumer Banking','APPROVED','USR-004','Jessica Wu','jessica.wu@mbs.com','2026-01-25 11:30:00','2026-01-27 11:00:00',0,NULL,'Auto-approved via Evergreen track.',NULL,NULL,NULL,0,'2026-01-25 11:00:00'),(54,'NPA-2026-011','Group Product Head','Product Control','APPROVED','USR-006','David Chen','david.chen@mbs.com','2026-01-25 12:00:00','2026-01-27 11:00:00',0,NULL,'Evergreen approval confirmed.',NULL,NULL,NULL,0,'2026-01-25 11:00:00');
ALTER TABLE `npa_signoffs` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `npa_workflow_states` WRITE;
ALTER TABLE `npa_workflow_states` DISABLE KEYS;
INSERT INTO `npa_workflow_states` (`id`, `project_id`, `stage_id`, `status`, `started_at`, `completed_at`, `blockers`) VALUES (1,'NPA-2026-001','INITIATION','COMPLETED','2025-11-15 09:00:00','2025-11-15 10:00:00',NULL),(2,'NPA-2026-001','REVIEW','COMPLETED','2025-11-15 10:00:00','2025-12-06 09:00:00',NULL),(3,'NPA-2026-001','SIGN_OFF','IN_PROGRESS','2025-12-06 09:00:00',NULL,NULL),(4,'NPA-2026-001','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(5,'NPA-2026-001','MONITORING','NOT_STARTED',NULL,NULL,NULL),(6,'NPA-2026-002','INITIATION','COMPLETED','2025-12-01 10:30:00','2025-12-01 11:00:00',NULL),(7,'NPA-2026-002','REVIEW','COMPLETED','2025-12-01 11:00:00','2025-12-05 14:00:00',NULL),(8,'NPA-2026-002','SIGN_OFF','IN_PROGRESS','2026-01-12 10:30:00',NULL,NULL),(9,'NPA-2026-002','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(10,'NPA-2026-002','MONITORING','NOT_STARTED',NULL,NULL,NULL),(11,'NPA-2026-003','INITIATION','COMPLETED','2025-11-01 08:00:00','2025-11-01 09:00:00',NULL),(12,'NPA-2026-003','REVIEW','IN_PROGRESS','2025-11-01 09:00:00',NULL,NULL),(13,'NPA-2026-003','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(14,'NPA-2026-003','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(15,'NPA-2026-003','MONITORING','NOT_STARTED',NULL,NULL,NULL),(16,'NPA-2026-004','INITIATION','COMPLETED','2025-12-20 11:00:00','2025-12-20 12:00:00',NULL),(17,'NPA-2026-004','REVIEW','IN_PROGRESS','2025-12-20 12:00:00',NULL,NULL),(18,'NPA-2026-004','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(19,'NPA-2026-004','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(20,'NPA-2026-004','MONITORING','NOT_STARTED',NULL,NULL,NULL),(21,'NPA-2026-005','INITIATION','IN_PROGRESS','2026-01-10 09:00:00',NULL,NULL),(22,'NPA-2026-005','REVIEW','NOT_STARTED',NULL,NULL,NULL),(23,'NPA-2026-005','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(24,'NPA-2026-005','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(25,'NPA-2026-005','MONITORING','NOT_STARTED',NULL,NULL,NULL),(26,'NPA-2026-006','INITIATION','COMPLETED','2025-09-15 08:00:00','2025-09-15 08:30:00',NULL),(27,'NPA-2026-006','REVIEW','COMPLETED','2025-09-15 08:30:00','2025-09-16 08:00:00',NULL),(28,'NPA-2026-006','SIGN_OFF','COMPLETED','2025-09-16 08:00:00','2025-09-22 10:00:00',NULL),(29,'NPA-2026-006','LAUNCH','COMPLETED','2025-09-22 10:00:00','2025-10-01 00:00:00',NULL),(30,'NPA-2026-006','MONITORING','IN_PROGRESS','2025-10-01 00:00:00',NULL,NULL),(31,'NPA-2026-007','INITIATION','COMPLETED','2025-08-01 07:30:00','2025-08-01 08:00:00',NULL),(32,'NPA-2026-007','REVIEW','COMPLETED','2025-08-01 08:00:00','2025-08-15 07:30:00',NULL),(33,'NPA-2026-007','SIGN_OFF','COMPLETED','2025-08-15 07:30:00','2025-08-28 14:00:00',NULL),(34,'NPA-2026-007','LAUNCH','COMPLETED','2025-08-28 14:00:00','2025-09-15 00:00:00',NULL),(35,'NPA-2026-007','MONITORING','IN_PROGRESS','2025-09-15 00:00:00',NULL,NULL),(36,'NPA-2026-008','INITIATION','COMPLETED','2025-10-01 10:00:00','2025-10-01 11:00:00',NULL),(37,'NPA-2026-008','REVIEW','COMPLETED','2025-10-01 11:00:00','2025-10-15 10:00:00',NULL),(38,'NPA-2026-008','SIGN_OFF','BLOCKED','2025-10-15 10:00:00',NULL,'[\"RMG-Credit\", \"Finance\", \"Legal\"]'),(39,'NPA-2026-008','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(40,'NPA-2026-008','MONITORING','NOT_STARTED',NULL,NULL,NULL),(41,'NPA-2026-009','INITIATION','COMPLETED','2026-01-05 14:00:00','2026-01-05 15:00:00',NULL),(42,'NPA-2026-009','REVIEW','IN_PROGRESS','2026-01-05 15:00:00',NULL,NULL),(43,'NPA-2026-009','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(44,'NPA-2026-009','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(45,'NPA-2026-009','MONITORING','NOT_STARTED',NULL,NULL,NULL),(46,'NPA-2026-010','INITIATION','IN_PROGRESS','2026-01-20 09:30:00',NULL,NULL),(47,'NPA-2026-010','REVIEW','NOT_STARTED',NULL,NULL,NULL),(48,'NPA-2026-010','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(49,'NPA-2026-010','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(50,'NPA-2026-010','MONITORING','NOT_STARTED',NULL,NULL,NULL),(51,'NPA-2026-011','INITIATION','COMPLETED','2026-01-25 11:00:00','2026-01-25 11:10:00',NULL),(52,'NPA-2026-011','REVIEW','COMPLETED','2026-01-25 11:10:00','2026-01-25 12:00:00',NULL),(53,'NPA-2026-011','SIGN_OFF','COMPLETED','2026-01-25 12:00:00','2026-01-25 12:30:00',NULL),(54,'NPA-2026-011','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(55,'NPA-2026-011','MONITORING','NOT_STARTED',NULL,NULL,NULL),(56,'NPA-2026-012','INITIATION','COMPLETED','2026-02-01 15:00:00','2026-02-01 15:01:00',NULL),(57,'NPA-2026-012','REVIEW','NOT_STARTED',NULL,NULL,NULL),(58,'NPA-2026-012','SIGN_OFF','NOT_STARTED',NULL,NULL,NULL),(59,'NPA-2026-012','LAUNCH','NOT_STARTED',NULL,NULL,NULL),(60,'NPA-2026-012','MONITORING','NOT_STARTED',NULL,NULL,NULL);
ALTER TABLE `npa_workflow_states` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_classification_criteria` WRITE;
ALTER TABLE `ref_classification_criteria` DISABLE KEYS;
INSERT INTO `ref_classification_criteria` (`id`, `category`, `criterion_code`, `criterion_name`, `description`, `indicator_type`, `weight`, `threshold_value`, `is_active`) VALUES (1,'PRODUCT_INNOVATION','NTG_PI_01','Entirely new product category','Product has no existing equivalent in MBS portfolio','NTG',2,NULL,1),(2,'PRODUCT_INNOVATION','NTG_PI_02','Novel risk profile','Risk characteristics fundamentally different from existing products','NTG',2,NULL,1),(3,'PRODUCT_INNOVATION','NTG_PI_03','New underlying asset class','Underlying asset not previously traded or held by MBS','NTG',2,NULL,1),(4,'PRODUCT_INNOVATION','NTG_PI_04','New pricing/valuation methodology','Requires new models or valuation approaches','NTG',1,NULL,1),(5,'PRODUCT_INNOVATION','NTG_PI_05','New technology platform required','Cannot be supported by existing systems','NTG',1,NULL,1),(6,'MARKET_CUSTOMER','NTG_MC_01','New customer segment','Targeting customer segments not previously served','NTG',2,NULL,1),(7,'MARKET_CUSTOMER','NTG_MC_02','New market/geography','Entering market where MBS has no existing presence','NTG',2,NULL,1),(8,'MARKET_CUSTOMER','NTG_MC_03','New distribution channel','Requires fundamentally new distribution infrastructure','NTG',1,NULL,1),(9,'MARKET_CUSTOMER','NTG_MC_04','New regulatory framework','Subject to regulations MBS has not previously navigated','NTG',2,NULL,1),(10,'MARKET_CUSTOMER','NTG_MC_05','New competitive landscape','Operating in market with entirely different competitive dynamics','NTG',1,NULL,1),(11,'RISK_REGULATORY','NTG_RR_01','New regulatory license required','Requires new licensing or regulatory approval','NTG',2,NULL,1),(12,'RISK_REGULATORY','NTG_RR_02','New risk management framework','Existing risk frameworks insufficient','NTG',2,NULL,1),(13,'RISK_REGULATORY','NTG_RR_03','New compliance program needed','Requires dedicated compliance monitoring program','NTG',1,NULL,1),(14,'RISK_REGULATORY','NTG_RR_04','Cross-border regulatory complexity','Multi-jurisdictional regulatory navigation required','NTG',2,NULL,1),(15,'RISK_REGULATORY','NTG_RR_05','Enhanced AML/KYC requirements','Standard AML/KYC insufficient for product','NTG',1,NULL,1),(16,'FINANCIAL_OPERATIONAL','NTG_FO_01','New booking infrastructure','Existing booking systems cannot accommodate product','NTG',2,NULL,1),(17,'FINANCIAL_OPERATIONAL','NTG_FO_02','New settlement mechanism','Settlement process fundamentally different from existing','NTG',2,NULL,1),(18,'FINANCIAL_OPERATIONAL','NTG_FO_03','New capital treatment','Product requires new regulatory capital calculation','NTG',1,NULL,1),(19,'FINANCIAL_OPERATIONAL','NTG_FO_04','Significant operational build','Requires new operational processes and teams','NTG',1,NULL,1),(20,'FINANCIAL_OPERATIONAL','NTG_FO_05','New external dependency','Critical dependency on new external parties/vendors','NTG',1,NULL,1),(21,'VARIATION','VAR_01','Change in underlying asset or reference rate','Underlying shifts but product mechanics remain same','VARIATION',1,NULL,1),(22,'VARIATION','VAR_02','Change in tenor or maturity range','Extension or reduction of product tenor range','VARIATION',1,NULL,1),(23,'VARIATION','VAR_03','Change in target customer segment','Expanding to adjacent customer segments','VARIATION',1,NULL,1),(24,'VARIATION','VAR_04','Change in distribution channel','Adding new distribution channel to existing product','VARIATION',1,NULL,1),(25,'VARIATION','VAR_05','Change in jurisdiction or booking location','Extending product to new booking entity/jurisdiction','VARIATION',1,NULL,1),(26,'VARIATION','VAR_06','Change in risk limits or parameters','Material change to risk thresholds or limits','VARIATION',1,NULL,1),(27,'VARIATION','VAR_07','Change in external party or vendor','Switching or adding critical third-party providers','VARIATION',1,NULL,1),(28,'VARIATION','VAR_08','Change in regulatory treatment or framework','Regulatory change affecting product operation','VARIATION',1,NULL,1);
ALTER TABLE `ref_classification_criteria` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_document_requirements` WRITE;
ALTER TABLE `ref_document_requirements` DISABLE KEYS;
INSERT INTO `ref_document_requirements` (`id`, `doc_code`, `doc_name`, `description`, `category`, `criticality`, `required_for`, `source`, `template_available`, `required_by_stage`, `order_index`) VALUES (1,'DOC_TERM_SHEET','Final Term Sheet',NULL,'CORE','CRITICAL','ALL','BUSINESS',0,'CHECKER',1),(2,'DOC_RISK_MEMO','Risk Assessment Memorandum',NULL,'CORE','CRITICAL','ALL','BUSINESS',0,'SIGN_OFF',2),(3,'DOC_LEGAL_OPINION','External Legal Opinion',NULL,'CORE','CRITICAL','FULL_NPA','EXTERNAL',0,'SIGN_OFF',3),(4,'DOC_BIZ_CASE','Business Case Document',NULL,'CORE','CRITICAL','ALL','BUSINESS',0,'CHECKER',4),(5,'DOC_COMPLIANCE','Compliance Assessment',NULL,'CORE','CRITICAL','ALL','BUSINESS',0,'SIGN_OFF',5),(6,'DOC_CREDIT_REPORT','Credit Risk Report',NULL,'CORE','IMPORTANT','ALL','BUSINESS',0,'SIGN_OFF',6),(7,'DOC_TECH_SPEC','Technology Specification',NULL,'CORE','IMPORTANT','FULL_NPA','BUSINESS',0,'SIGN_OFF',7),(8,'DOC_OPS_RUNBOOK','Operational Runbook',NULL,'CORE','IMPORTANT','ALL','BUSINESS',0,'LAUNCH',8),(9,'DOC_BCP','Business Continuity Plan',NULL,'CONDITIONAL','IMPORTANT','FULL_NPA','BUSINESS',0,'LAUNCH',9),(10,'DOC_SECURITY','Security Assessment Report',NULL,'CONDITIONAL','IMPORTANT','FULL_NPA','BUSINESS',0,'SIGN_OFF',10),(11,'DOC_ISDA','ISDA/Master Agreement Confirmations',NULL,'CONDITIONAL','IMPORTANT','ALL','EXTERNAL',0,'SIGN_OFF',11),(12,'DOC_CPTY_RATINGS','Counterparty Credit Ratings',NULL,'CONDITIONAL','IMPORTANT','ALL','EXTERNAL',0,'SIGN_OFF',12),(13,'DOC_MARKET_RESEARCH','Market Research / Competitive Analysis',NULL,'SUPPLEMENTARY','OPTIONAL','FULL_NPA','BUSINESS',0,'CHECKER',13),(14,'DOC_CLIENT_DEMAND','Client Demand Analysis',NULL,'SUPPLEMENTARY','OPTIONAL','ALL','BUSINESS',0,'CHECKER',14),(15,'DOC_TRAINING','Training Materials Draft',NULL,'SUPPLEMENTARY','OPTIONAL','FULL_NPA','BUSINESS',0,'LAUNCH',15),(16,'DOC_IMPL_TIMELINE','Implementation Timeline (detailed)',NULL,'SUPPLEMENTARY','OPTIONAL','ALL','BUSINESS',0,'CHECKER',16),(17,'DOC_BUDGET','Budget Allocation Memo',NULL,'SUPPLEMENTARY','OPTIONAL','FULL_NPA','BUSINESS',0,'SIGN_OFF',17),(18,'DOC_REG_FILING','Regulatory Filing Templates',NULL,'CONDITIONAL','IMPORTANT','FULL_NPA','REGULATORY',0,'LAUNCH',18),(19,'DOC_VENDOR_DD','Vendor Due Diligence Reports',NULL,'CONDITIONAL','IMPORTANT','FULL_NPA','EXTERNAL',0,'SIGN_OFF',19),(20,'DOC_TAX_ANALYSIS','Tax Impact Analysis',NULL,'CONDITIONAL','IMPORTANT','FULL_NPA','BUSINESS',0,'SIGN_OFF',20);
ALTER TABLE `ref_document_requirements` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_document_rules` WRITE;
ALTER TABLE `ref_document_rules` DISABLE KEYS;
INSERT INTO `ref_document_rules` (`id`, `doc_code`, `doc_name`, `condition_logic`, `criticality`, `source_party`) VALUES ('RULE_LEGAL_OPINION','DOC_LEGAL_OPINION','External Legal Opinion','is_cross_border == true','CONDITIONAL','LEGAL'),('RULE_RISK_MEMO','DOC_RISK_MEMO','Market Risk Memo','npa_type == \"FULL\" && notional > 10000000','CORE','RISK'),('RULE_TAX_SIGNOFF','DOC_TAX_SIGNOFF','Tax Impact Assessment','npa_type == \"FULL\" || jurisdiction in [\"CN\", \"IN\"]','CONDITIONAL','FINANCE');
ALTER TABLE `ref_document_rules` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_escalation_rules` WRITE;
ALTER TABLE `ref_escalation_rules` DISABLE KEYS;
INSERT INTO `ref_escalation_rules` (`id`, `escalation_level`, `authority_name`, `trigger_type`, `trigger_threshold`, `action_required`, `auto_escalate`) VALUES (1,1,'Department Head','SLA_BREACH','48','Review and reassign approver or extend SLA',1),(2,1,'Department Head','LOOP_BACK_LIMIT','2','Review loop-back pattern, provide guidance',0),(3,2,'Business Unit Head','SLA_BREACH','72','Escalate resource allocation, mandate priority',1),(4,2,'Business Unit Head','DISAGREEMENT','1','Mediate between conflicting sign-off parties',0),(5,3,'Group Product Head','LOOP_BACK_LIMIT','3','Circuit breaker activated - review full NPA',1),(6,3,'Group Product Head','RISK_THRESHOLD','HIGH','Review risk assessment and approve/reject',0),(7,4,'Group COO','SLA_BREACH','120','Executive intervention, mandate resolution',1),(8,4,'Group COO','LOOP_BACK_LIMIT','4','Governance Forum referral',1),(9,5,'CEO','RISK_THRESHOLD','CRITICAL','Board-level review required',0);
ALTER TABLE `ref_escalation_rules` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_field_options` WRITE;
ALTER TABLE `ref_field_options` DISABLE KEYS;
INSERT INTO `ref_field_options` (`id`, `field_id`, `value`, `label`, `order_index`) VALUES (1,'FLD_RISK_TYPE','LOW','Low Risk',1),(2,'FLD_RISK_TYPE','MEDIUM','Medium Risk',2),(3,'FLD_RISK_TYPE','HIGH','High Risk',3),(4,'FLD_PROD_TYPE','FX_OPTION','FX Option',1),(5,'FLD_PROD_TYPE','FX_FORWARD','FX Forward',2),(6,'FLD_PROD_TYPE','SWAP','Interest Rate Swap',3),(7,'FLD_PROD_TYPE','STRUCTURED','Structured Product',4),(8,'FLD_PROD_TYPE','FIXED_INCOME','Fixed Income',5),(9,'FLD_PROD_TYPE','DEPOSIT','Deposit',6),(10,'FLD_PROD_TYPE','TRADE_FINANCE','Trade Finance',7),(11,'FLD_PROD_TYPE','CUSTODY','Custody Services',8),(12,'FLD_PROD_TYPE','ADVISORY','Advisory',9),(13,'FLD_PROD_TYPE','ETF','ETF',10),(14,'FLD_BIZ_UNIT','T_AND_M','Treasury & Markets',1),(15,'FLD_BIZ_UNIT','WEALTH_MGMT','Wealth Management',2),(16,'FLD_BIZ_UNIT','CORP_BANKING','Corporate Banking',3),(17,'FLD_BIZ_UNIT','INST_BANKING','Institutional Banking',4),(18,'FLD_BIZ_UNIT','CONSUMER','Consumer Banking',5),(19,'FLD_BIZ_UNIT','DIGITAL_ASSETS','Digital Assets',6),(20,'FLD_BOOKING_SYS','MUREX','Murex',1),(21,'FLD_BOOKING_SYS','CALYPSO','Calypso',2),(22,'FLD_BOOKING_SYS','SUMMIT','Summit',3),(23,'FLD_BOOKING_SYS','FLEXCUBE','Flexcube',4),(24,'FLD_BOOKING_SYS','CUSTOM','Custom/In-House',5),(25,'FLD_SETTLEMENT','CASH_USD','Cash (USD)',1),(26,'FLD_SETTLEMENT','CASH_SGD','Cash (SGD)',2),(27,'FLD_SETTLEMENT','PHYSICAL','Physical Delivery',3),(28,'FLD_SETTLEMENT','NET_SETTLE','Net Settlement',4),(29,'FLD_CPTY_RATING','AAA','AAA',1),(30,'FLD_CPTY_RATING','AA+','AA+',2),(31,'FLD_CPTY_RATING','AA','AA',3),(32,'FLD_CPTY_RATING','AA-','AA-',4),(33,'FLD_CPTY_RATING','A+','A+',5),(34,'FLD_CPTY_RATING','A','A',6),(35,'FLD_CPTY_RATING','A-','A-',7),(36,'FLD_CPTY_RATING','BBB+','BBB+',8),(37,'FLD_CPTY_RATING','BBB','BBB',9),(38,'FLD_CPTY_RATING','BBB-','BBB-',10),(39,'FLD_SANCTIONS','CLEAR','Clear - No Matches',1),(40,'FLD_SANCTIONS','REVIEW','Under Review',2),(41,'FLD_SANCTIONS','FLAGGED','Flagged - Manual Check',3),(42,'FLD_SIGNOFF_ORDER','PARALLEL','Parallel Processing',1),(43,'FLD_SIGNOFF_ORDER','SEQUENTIAL','Sequential Processing',2),(44,'FLD_BIZ_CASE','YES','Yes - Approved',1),(45,'FLD_BIZ_CASE','NO','No - Pending',2),(46,'FLD_NPA_PROCESS','FULL_NPA','Full NPA',1),(47,'FLD_NPA_PROCESS','NPA_LITE','NPA Lite',2),(48,'FLD_NPA_PROCESS','BUNDLING','Bundling',3),(49,'FLD_NPA_PROCESS','EVERGREEN','Evergreen',4),(50,'FLD_PROD_ROLE','PRINCIPAL','Principal',1),(51,'FLD_PROD_ROLE','MANUFACTURER','Manufacturer',2),(52,'FLD_PROD_ROLE','DISTRIBUTOR','Distributor',3),(53,'FLD_PROD_ROLE','AGENT','Agent',4),(54,'FLD_FUNDING','FUNDED','Funded',1),(55,'FLD_FUNDING','UNFUNDED','Unfunded',2),(56,'FLD_FUNDING','HYBRID','Hybrid',3),(57,'FLD_BOOK_LEGAL','ISDA','ISDA Master Agreement',1),(58,'FLD_BOOK_LEGAL','GMRA','GMRA',2),(59,'FLD_BOOK_LEGAL','GMSLA','GMSLA',3),(60,'FLD_BOOK_LEGAL','NAFMII','NAFMII',4),(61,'FLD_BOOK_LEGAL','CUSTOM','Custom Agreement',5),(62,'FLD_BIA','YES','Yes - Completed',1),(63,'FLD_BIA','NO','No - Pending',2),(64,'FLD_HSM','YES','Yes',1),(65,'FLD_HSM','NO','No',2),(66,'FLD_PENTEST','COMPLETED','Completed',1),(67,'FLD_PENTEST','SCHEDULED','Scheduled',2),(68,'FLD_PENTEST','NOT_DONE','Not Yet Done',3),(69,'FLD_GDPR','YES','Yes',1),(70,'FLD_GDPR','NO','No',2),(71,'FLD_DATA_OWNER','YES','Yes',1),(72,'FLD_DATA_OWNER','NO','No',2);
ALTER TABLE `ref_field_options` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_npa_fields` WRITE;
ALTER TABLE `ref_npa_fields` DISABLE KEYS;
INSERT INTO `ref_npa_fields` (`id`, `section_id`, `field_key`, `label`, `field_type`, `is_required`, `tooltip`, `order_index`) VALUES ('FLD_AML','SEC_FINCRIME','aml_assessment','AML Assessment','text',1,NULL,1),('FLD_AUTH','SEC_BASIC','approving_authority','Approving Authority','text',1,NULL,9),('FLD_BACK_OFF','SEC_OPS','back_office_model','Back Office Model','text',0,NULL,22),('FLD_BESPOKE_ADJ','SEC_PRICE','bespoke_adjustments','Bespoke Adjustments','text',0,'Custom pricing adjustments if any',4),('FLD_BIA','SEC_BCP','bia_completed','BIA Completed?','select',0,NULL,3),('FLD_BIZ_CASE','SEC_BASIC','business_case_status','Business Case Approved?','select',1,NULL,4),('FLD_BIZ_UNIT','SEC_PROD','business_unit','Business Unit','select',1,'Organizational business unit',4),('FLD_BOOKING_ENTITY','SEC_ENTITY','booking_entity','Booking Entity','text',1,'Legal entity for booking',1),('FLD_BOOKING_SYS','SEC_OPS','booking_system','Booking System','select',1,'Primary booking platform',1),('FLD_BOOK_FAMILY','SEC_OPS','booking_family','Booking Family (IRD/FXD/CRY)','text',0,NULL,24),('FLD_BOOK_LEGAL','SEC_OPS','booking_legal_form','Booking Legal Form (ISDA/GMRA/etc)','select',0,NULL,23),('FLD_BOOK_SCHEMA','SEC_TRADING','booking_schema','Booking Schema','text',0,NULL,5),('FLD_BOOK_TYPE','SEC_OPS','booking_typology','Booking Typology/Contract','text',0,NULL,25),('FLD_BRIBERY','SEC_FINCRIME','bribery_corruption','Bribery & Corruption Risk','text',1,NULL,5),('FLD_CHANNELS','SEC_COMM','distribution_channels','Channel Availability','text',1,NULL,1),('FLD_COLLATERAL','SEC_TRADING','collateral_types','Collateral Types','text',0,NULL,1),('FLD_CONFIRM','SEC_OPS','confirmation_process','Confirmation Process','text',0,'Trade confirmation workflow',4),('FLD_COUNTERPARTY','SEC_ENTITY','counterparty','Counterparty','text',1,'Primary counterparty name',2),('FLD_CPTY_RATING','SEC_ENTITY','counterparty_rating','Counterparty Rating','select',1,'Credit rating of counterparty',3),('FLD_CREDIT_RISK','SEC_RISK','credit_risk','Credit Risk','text',1,'Counterparty and credit risk assessment',2),('FLD_CUST_GEO','SEC_CUST','geographic_scope','Geographic Focus','text',0,NULL,4),('FLD_CUST_PROFILE','SEC_CUST','customer_profile','Target Customer Profile','text',0,NULL,3),('FLD_CUST_REG','SEC_CUST','customer_restrictions','Regulatory Restrictions','text',0,NULL,2),('FLD_CUST_SEG','SEC_CUST','customer_segments','Target Customer Segments','text',1,NULL,1),('FLD_DATA_OWNER','SEC_DATA','data_ownership','Data Ownership Defined?','select',0,NULL,12),('FLD_DATA_PRIVACY','SEC_DATA','data_privacy','Data Privacy Requirements','text',1,'GDPR/PDPA compliance requirements',1),('FLD_DATA_RETENTION','SEC_DATA','data_retention','Data Retention Policy','text',0,'Data retention period and approach',2),('FLD_DESK','SEC_PROD','desk','Desk','text',1,'Trading desk responsible for the product',3),('FLD_DR_FREQ','SEC_BCP','dr_test_frequency','DR Testing Frequency','text',0,NULL,4),('FLD_FRAUD','SEC_FINCRIME','fraud_risk','Fraud Risk Assessment','text',1,NULL,4),('FLD_FRONT_OFF','SEC_OPS','front_office_model','Front Office Operating Model','text',0,NULL,20),('FLD_FUNDING','SEC_PROD','funding_type','Funding Type','select',0,NULL,21),('FLD_FUNDING_SRC','SEC_TRADING','funding_source','Funding Source','text',0,NULL,3),('FLD_GDPR','SEC_DATA','gdpr_compliance','GDPR Compliance Required?','select',0,NULL,11),('FLD_GPH','SEC_BASIC','group_product_head','Group Product Head','text',1,NULL,2),('FLD_HEDGE_PURPOSE','SEC_TRADING','hedging_purpose','Hedging Purpose','text',0,NULL,4),('FLD_HSM','SEC_OPS','hsm_required','HSM Key Management Required?','select',0,NULL,30),('FLD_IP_CONSIDER','SEC_ENTITY','ip_considerations','IP Considerations','text',0,'Intellectual property considerations',5),('FLD_ISDA','SEC_LEGAL','isda_agreement','ISDA Agreement','text',0,'ISDA master agreement details',2),('FLD_ISS_DEVIATE','SEC_OPS','iss_deviations','ISS Policy Deviations','text',0,NULL,32),('FLD_KICKOFF','SEC_BASIC','kickoff_date','NPA Kick-off Meeting Date','date',1,NULL,7),('FLD_LEGAL_OPINION','SEC_LEGAL','legal_opinion','External Legal Opinion','text',0,'External legal opinion reference',1),('FLD_LIFECYCLE','SEC_PROD','product_lifecycle','Product Life Cycle','text',0,NULL,23),('FLD_LIQ_RISK','SEC_RISK','liquidity_risk','Liquidity Risk','text',0,'Liquidity risk assessment',4),('FLD_MARKETING','SEC_COMM','marketing_plan','Marketing & Communication','text',0,NULL,3),('FLD_MATURITY','SEC_PROD','product_maturity','Product Maturity/Tenor','text',0,NULL,22),('FLD_MID_OFF','SEC_OPS','middle_office_model','Middle Office Model','text',0,NULL,21),('FLD_MKT_RISK','SEC_RISK','market_risk','Market Risk (VaR)','text',1,'Value at Risk and market risk assessment',1),('FLD_MODEL_DATE','SEC_PRICE','model_validation_date','Model Validation Date','date',0,NULL,11),('FLD_MODEL_NAME','SEC_PRICE','pricing_model_name','Model Name & Version','text',0,NULL,10),('FLD_MTJ','SEC_BASIC','mtj_journey','MtJ Journey(s) Impacted','text',0,NULL,8),('FLD_NOTIONAL','SEC_PROD','notional_amount','Notional Amount (USD)','decimal',1,NULL,2),('FLD_NPA_PROCESS','SEC_BASIC','npa_process_type','NPA/NPA Lite Process?','select',1,NULL,5),('FLD_OPS_RISK','SEC_RISK','operational_risk','Operational Risk','text',1,'Key operational risks identified',3),('FLD_PAC_DATE','SEC_BASIC','pac_approval_date','PAC Approval Date','date',0,NULL,6),('FLD_PAC_REF','SEC_PROD','pac_reference','PAC Approval Reference','text',0,'PAC committee reference number if applicable',10),('FLD_PENTEST','SEC_OPS','pentest_status','Penetration Testing Status','select',0,NULL,31),('FLD_PM_NAME','SEC_BASIC','product_manager_name','Product Manager Name & Team','text',1,NULL,1),('FLD_PORTFOLIO','SEC_OPS','portfolio_allocation','Portfolio Allocation','text',0,NULL,26),('FLD_PREPARER','SEC_BASIC','proposal_preparer','Proposal Preparer/Lead','text',1,NULL,3),('FLD_PRICE_ASSUME','SEC_PRICE','pricing_assumptions','Pricing Assumptions','text',0,'Key assumptions underpinning the pricing',3),('FLD_PRICE_METHOD','SEC_PRICE','pricing_methodology','Pricing Methodology','text',1,'How the product is priced',1),('FLD_PROD_NAME','SEC_PROD','product_name','Product Name','text',1,NULL,1),('FLD_PROD_ROLE','SEC_PROD','product_role','Role of PU (Manufacturer/Distributor/Agent)','select',0,NULL,20),('FLD_PROD_TYPE','SEC_PROD','product_type','Product Type','select',1,'Primary product classification',2),('FLD_PURE_ID','SEC_DATA','pure_assessment_id','PURE Assessment ID','text',0,NULL,10),('FLD_RATIONALE','SEC_PROD','business_rationale','Business Rationale','text',1,'Business justification for the product',9),('FLD_RECON','SEC_OPS','reconciliation','Reconciliation','text',0,'Reconciliation approach and frequency',5),('FLD_REG_PRIMARY','SEC_REG','primary_regulation','Primary Regulation','text',1,'Primary regulatory framework (e.g. MAS 656)',1),('FLD_REG_REPORTING','SEC_REG','regulatory_reporting','Regulatory Reporting','text',0,'Required regulatory reports',3),('FLD_REG_SECONDARY','SEC_REG','secondary_regulations','Secondary Regulations','text',0,'Additional applicable regulations',2),('FLD_REPORTING','SEC_DATA','reporting_requirements','Reporting Requirements','text',0,'Regulatory and internal reporting needs',3),('FLD_REP_RISK','SEC_RISK','reputational_risk','Reputational Risk','text',0,'Reputational risk considerations',5),('FLD_REQ_SIGNOFFS','SEC_SIGN','required_signoffs','Required Sign-Offs','text',1,'List of required approval parties',1),('FLD_REVENUE_Y1','SEC_PROD','revenue_year1','Year 1 Revenue Estimate','decimal',0,NULL,24),('FLD_REVENUE_Y2','SEC_PROD','revenue_year2','Year 2 Revenue Estimate','decimal',0,NULL,25),('FLD_REVENUE_Y3','SEC_PROD','revenue_year3','Year 3 Revenue Estimate','decimal',0,NULL,26),('FLD_RISK_CAP','SEC_RISK','regulatory_capital','Regulatory Capital Treatment','text',0,NULL,12),('FLD_RISK_CPTY','SEC_RISK','counterparty_default','Counterparty Default Risk','text',0,NULL,13),('FLD_RISK_CUSTODY','SEC_RISK','custody_risk','Custody Risk','text',0,NULL,14),('FLD_RISK_ESG','SEC_RISK','esg_assessment','ESG Risk Assessment','text',0,NULL,15),('FLD_RISK_MKT_VaR','SEC_RISK','var_capture','VaR Capture Method','text',0,NULL,10),('FLD_RISK_STRESS','SEC_RISK','stress_scenarios','Stress Testing Scenarios','text',0,NULL,11),('FLD_RISK_TYPE','SEC_RISK','risk_classification','Risk Classification','select',1,NULL,1),('FLD_ROAE','SEC_PRICE','roae_analysis','ROAE Sensitivity Analysis','text',1,'Return on Average Equity analysis',2),('FLD_ROI_TARGET','SEC_PROD','target_roi','Target ROI','text',0,NULL,27),('FLD_RPO','SEC_BCP','rpo_minutes','Recovery Point Objective (min)','decimal',0,NULL,2),('FLD_RTO','SEC_BCP','rto_hours','Recovery Time Objective (hrs)','decimal',0,NULL,1),('FLD_SANCTIONS','SEC_REG','sanctions_check','Sanctions Check','select',1,'OFAC/UN/EU sanctions screening result',4),('FLD_SANCTIONS_FC','SEC_FINCRIME','sanctions_assessment','Sanctions Assessment','text',1,NULL,3),('FLD_SETTLEMENT','SEC_OPS','settlement_method','Settlement Method','select',1,'Settlement type and currency',3),('FLD_SIGNOFF_ORDER','SEC_SIGN','signoff_order','Sign-Off Processing','select',0,'Parallel or sequential processing',2),('FLD_SIMM','SEC_PRICE','simm_treatment','SIMM Treatment','text',0,NULL,12),('FLD_SPV','SEC_PROD','spv_details','Special Purpose Vehicle','text',0,NULL,28),('FLD_STRIKE','SEC_ENTITY','strike_price','Strike Price','decimal',0,'Strike price if applicable',4),('FLD_SUITABILITY','SEC_COMM','sales_suitability','Sales Suitability Process','text',0,NULL,2),('FLD_SUPP_DOCS','SEC_DOCS','supporting_documents','Additional Documents','upload',0,'Upload any supporting files',2),('FLD_TAX_IMPACT','SEC_LEGAL','tax_impact','Tax Impact Assessment','text',0,'Tax implications and assessment',3),('FLD_TECH_REQ','SEC_OPS','tech_requirements','Technology Requirements','text',0,'Additional technology build requirements',6),('FLD_TENOR','SEC_PROD','tenor','Tenor','text',1,'Product maturity or duration',7),('FLD_TERM_SHEET','SEC_DOCS','term_sheet','Term Sheet','upload',1,'Upload term sheet document',1),('FLD_TERRORISM','SEC_FINCRIME','terrorism_financing','Terrorism Financing Check','text',1,NULL,2),('FLD_TRADE_DATE','SEC_PROD','trade_date','Trade Date','date',0,'Expected first trade date',8),('FLD_UNDERLYING','SEC_PROD','underlying_asset','Underlying Asset','text',1,'Underlying asset or reference',6),('FLD_VAL_METHOD','SEC_TRADING','valuation_method','Valuation Methodology','text',0,NULL,2),('FLD_VAL_MODEL','SEC_OPS','valuation_model','Valuation Model','text',1,'Pricing/valuation methodology',2);
ALTER TABLE `ref_npa_fields` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_npa_sections` WRITE;
ALTER TABLE `ref_npa_sections` DISABLE KEYS;
INSERT INTO `ref_npa_sections` (`id`, `template_id`, `title`, `description`, `order_index`) VALUES ('SEC_BASIC','FULL_NPA_V1','Part A: Basic Product Information','Product name, PM, BU, PAC approval, approving authority',0),('SEC_BCP','FULL_NPA_V1','Business Continuity','BIA, BCP, RTO/RPO, alternative delivery',11),('SEC_COMM','FULL_NPA_V1','Commercialization','Channel availability, suitability, marketing',4),('SEC_CUST','FULL_NPA_V1','Target Customers','Target segments, regulatory restrictions, customer profile',3),('SEC_DATA','STD_NPA_V2','Data Management','Data privacy, retention, and reporting',5),('SEC_DOCS','STD_NPA_V2','Supporting Documents','Attached files and evidence',10),('SEC_ENTITY','STD_NPA_V2','Appendices (Entity & IP)','Entity structure and intellectual property',7),('SEC_FINCRIME','FULL_NPA_V1','Appendix 3: Financial Crime','AML, sanctions, fraud, bribery/corruption',12),('SEC_LEGAL','STD_NPA_V2','Legal Considerations','Legal opinions and documentation requirements',9),('SEC_OPS','STD_NPA_V2','Operational & Technology','Booking, settlement, and technology requirements',2),('SEC_PRICE','STD_NPA_V2','Pricing Model','Pricing methodology and assumptions',3),('SEC_PROD','STD_NPA_V2','Product Overview','Core product definition',1),('SEC_REG','STD_NPA_V2','Regulatory Requirements','Compliance and regulatory obligations',6),('SEC_RISK','STD_NPA_V2','Risk Assessment','Key risk factors',2),('SEC_RISKDATA','FULL_NPA_V1','Appendix 4: Risk Data Aggregation','Data aggregation, reporting, stress testing',13),('SEC_SIGN','STD_NPA_V2','Sign-Off Matrix','Required approvals and sign-off parties',8),('SEC_SIGNOFF','FULL_NPA_V1','Part B: Sign-off Parties','Required sign-off groups and parties',1),('SEC_TRADING','FULL_NPA_V1','Appendix 5: Trading Products','Collateral, valuation, funding, lifecycle',14);
ALTER TABLE `ref_npa_sections` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_npa_templates` WRITE;
ALTER TABLE `ref_npa_templates` DISABLE KEYS;
INSERT INTO `ref_npa_templates` (`id`, `name`, `version`, `is_active`) VALUES ('FULL_NPA_V1','Full NPA Template',1,1),('STD_NPA_V2','Standard NPA Template',2,1);
ALTER TABLE `ref_npa_templates` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_prerequisite_categories` WRITE;
ALTER TABLE `ref_prerequisite_categories` DISABLE KEYS;
INSERT INTO `ref_prerequisite_categories` (`id`, `category_code`, `category_name`, `weight`, `description`, `order_index`) VALUES (1,'STRATEGIC','Strategic Alignment',15,'Business case, market research, senior management approval',1),(2,'CLASSIFICATION','Classification Readiness',10,'Product classification completed and validated',2),(3,'STAKEHOLDER','Stakeholder Readiness',20,'All sign-off parties resourced and available',3),(4,'TECHNICAL','Technical Infrastructure',15,'Systems, platforms, and integrations ready',4),(5,'REGULATORY','Regulatory & Compliance',15,'Licensing, regulatory approvals, compliance programs',5),(6,'RISK_MGMT','Risk Management',10,'Risk frameworks, limits, and monitoring in place',6),(7,'DATA_MGMT','Data Management',5,'Data governance, privacy, PURE assessment',7),(8,'FINANCIAL','Financial Framework',5,'Pricing models, capital allocation, P&L setup',8),(9,'PROJECT_MGMT','Project Management',5,'Timeline, milestones, resource allocation',9);
ALTER TABLE `ref_prerequisite_categories` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_prerequisite_checks` WRITE;
ALTER TABLE `ref_prerequisite_checks` DISABLE KEYS;
INSERT INTO `ref_prerequisite_checks` (`id`, `category_id`, `check_code`, `check_name`, `description`, `mandatory_for`, `is_critical`, `order_index`) VALUES (1,1,'STR_01','Business case documented and approved',NULL,'ALL',1,1),(2,1,'STR_02','Market research completed',NULL,'FULL_NPA',0,2),(3,1,'STR_03','Revenue projections supported',NULL,'ALL',1,3),(4,1,'STR_04','Senior management approval obtained',NULL,'FULL_NPA',1,4),(5,2,'CLS_01','Classification criteria assessed',NULL,'ALL',1,1),(6,2,'CLS_02','Approval track determined',NULL,'ALL',1,2),(7,2,'CLS_03','Classification validated by reviewer',NULL,'FULL_NPA',0,3),(8,3,'STK_01','Risk Management team capacity confirmed',NULL,'ALL',1,1),(9,3,'STK_02','Technology team resources allocated',NULL,'ALL',1,2),(10,3,'STK_03','Legal/Compliance team engaged',NULL,'ALL',1,3),(11,3,'STK_04','Finance team engaged for P&L setup',NULL,'ALL',0,4),(12,3,'STK_05','Escalation procedures defined',NULL,'ALL',0,5),(13,4,'TEC_01','System capacity assessment completed',NULL,'ALL',1,1),(14,4,'TEC_02','Integration requirements mapped',NULL,'ALL',1,2),(15,4,'TEC_03','Security assessment completed',NULL,'ALL',1,3),(16,4,'TEC_04','Performance impact analyzed',NULL,'FULL_NPA',0,4),(17,5,'REG_01','Licensing requirements identified',NULL,'ALL',1,1),(18,5,'REG_02','Regulatory approvals timeline mapped',NULL,'ALL',1,2),(19,5,'REG_03','Local compliance teams engaged',NULL,'FULL_NPA',0,3),(20,5,'REG_04','Cross-border requirements assessed',NULL,'FULL_NPA',0,4),(21,6,'RSK_01','Risk framework designed',NULL,'ALL',1,1),(22,6,'RSK_02','Risk limits proposed',NULL,'ALL',1,2),(23,6,'RSK_03','Prohibited list check completed',NULL,'ALL',1,3),(24,7,'DAT_01','Data governance framework defined',NULL,'ALL',0,1),(25,7,'DAT_02','PURE assessment completed',NULL,'FULL_NPA',0,2),(26,7,'DAT_03','Privacy compliance assessed',NULL,'ALL',0,3),(27,8,'FIN_01','Pricing model validated',NULL,'ALL',1,1),(28,8,'FIN_02','Capital allocation confirmed',NULL,'FULL_NPA',0,2),(29,8,'FIN_03','Tax treatment determined',NULL,'ALL',0,3),(30,9,'PRJ_01','Project timeline defined',NULL,'ALL',0,1),(31,9,'PRJ_02','Resource allocation confirmed',NULL,'ALL',0,2),(32,9,'PRJ_03','Milestones and dependencies mapped',NULL,'FULL_NPA',0,3);
ALTER TABLE `ref_prerequisite_checks` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_prohibited_items` WRITE;
ALTER TABLE `ref_prohibited_items` DISABLE KEYS;
INSERT INTO `ref_prohibited_items` (`id`, `layer`, `item_code`, `item_name`, `description`, `jurisdictions`, `severity`, `effective_from`, `effective_to`, `last_synced`) VALUES (1,'INTERNAL_POLICY','PRH_IP_01','Binary Options','All binary/digital options prohibited by group policy','ALL','HARD_STOP','2020-01-01',NULL,'2026-02-11 04:23:05'),(2,'INTERNAL_POLICY','PRH_IP_02','CFDs for Retail','Contracts for difference prohibited for retail clients','ALL','HARD_STOP','2019-06-01',NULL,'2026-02-11 04:23:05'),(3,'INTERNAL_POLICY','PRH_IP_03','Leveraged Crypto (>5x)','Cryptocurrency products with leverage exceeding 5x','ALL','HARD_STOP','2022-01-01',NULL,'2026-02-11 04:23:05'),(4,'REGULATORY','PRH_RG_01','Unregistered Securities (SG)','Securities not registered with MAS','SG','HARD_STOP','2020-01-01',NULL,'2026-02-11 04:23:05'),(5,'REGULATORY','PRH_RG_02','ICO Tokens (HK)','Initial Coin Offering tokens per SFC guidance','HK','HARD_STOP','2021-03-01',NULL,'2026-02-11 04:23:05'),(6,'SANCTIONS','PRH_SN_01','OFAC SDN List Entities','US Treasury OFAC Specially Designated Nationals','ALL','HARD_STOP','2020-01-01',NULL,'2026-02-11 04:23:05'),(7,'SANCTIONS','PRH_SN_02','EU Sanctions List','European Union consolidated sanctions list','ALL','HARD_STOP','2020-01-01',NULL,'2026-02-11 04:23:05'),(8,'DYNAMIC','PRH_DY_01','Russia-linked Instruments','Products with material Russian counterparty exposure','ALL','HARD_STOP','2022-03-01',NULL,'2026-02-11 04:23:05'),(9,'DYNAMIC','PRH_DY_02','Myanmar Financial Products','Products involving Myanmar financial institutions','ALL','CONDITIONAL','2021-02-01',NULL,'2026-02-11 04:23:05');
ALTER TABLE `ref_prohibited_items` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `ref_signoff_routing_rules` WRITE;
ALTER TABLE `ref_signoff_routing_rules` DISABLE KEYS;
INSERT INTO `ref_signoff_routing_rules` (`id`, `approval_track`, `party_group`, `party_name`, `is_mandatory`, `sla_hours`, `can_parallel`, `sequence_order`, `trigger_condition`) VALUES (1,'FULL_NPA','RISK_MGMT','Market & Liquidity Risk',1,48,1,1,NULL),(2,'FULL_NPA','RISK_MGMT','Credit Risk',1,48,1,1,NULL),(3,'FULL_NPA','TECH_OPS','Technology Architecture',1,48,1,1,NULL),(4,'FULL_NPA','TECH_OPS','Operations',1,48,1,1,NULL),(5,'FULL_NPA','LEGAL_COMPLIANCE','Legal',1,48,0,2,NULL),(6,'FULL_NPA','LEGAL_COMPLIANCE','Compliance',1,48,0,2,NULL),(7,'FULL_NPA','FINANCE','Finance',1,72,0,3,NULL),(8,'FULL_NPA','FINANCE','Tax',1,48,0,3,NULL),(9,'FULL_NPA','INFO_SECURITY','Cybersecurity',1,48,1,1,NULL),(10,'NPA_LITE','RISK_MGMT','Market & Liquidity Risk',1,36,1,1,NULL),(11,'NPA_LITE','RISK_MGMT','Credit Risk',1,36,1,1,NULL),(12,'NPA_LITE','TECH_OPS','Operations',1,36,1,1,NULL),(13,'NPA_LITE','LEGAL_COMPLIANCE','Compliance',1,36,0,2,NULL),(14,'NPA_LITE','FINANCE','Finance',1,48,0,3,NULL),(15,'BUNDLING','RISK_MGMT','Credit Risk',1,24,1,1,NULL),(16,'BUNDLING','LEGAL_COMPLIANCE','Compliance',1,24,1,1,NULL),(17,'BUNDLING','FINANCE','Finance',1,36,0,2,NULL),(18,'EVERGREEN','RISK_MGMT','Market & Liquidity Risk',1,24,1,1,NULL),(19,'EVERGREEN','LEGAL_COMPLIANCE','Compliance',1,24,1,1,NULL);
ALTER TABLE `ref_signoff_routing_rules` ENABLE KEYS;
UNLOCK TABLES;
LOCK TABLES `users` WRITE;
ALTER TABLE `users` DISABLE KEYS;
INSERT INTO `users` (`id`, `email`, `employee_id`, `full_name`, `display_name`, `department`, `job_title`, `location`, `role`, `is_active`, `created_at`, `updated_at`) VALUES ('USR-001','sarah.lim@mbs.com','EMP-10001','Sarah Lim','Sarah L.','Treasury & Markets','Senior FX Trader','Singapore','MAKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-002','michael.chen@mbs.com','EMP-10002','Michael Chen','Michael C.','Digital Assets','VP Digital Products','Hong Kong','MAKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-003','james.liu@mbs.com','EMP-10003','James Liu','James L.','Institutional Banking','Director Trade Finance','Singapore','MAKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-004','jessica.wu@mbs.com','EMP-10004','Jessica Wu','Jessica W.','Wealth Management','AVP Investment Products','Singapore','MAKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-005','alex.rivera@mbs.com','EMP-10005','Alex Rivera','Alex R.','Treasury & Markets','Equities Desk Head','Singapore','MAKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-006','david.chen@mbs.com','EMP-10006','David Chen','David C.','Product Control','NPA Champion / Checker','Singapore','CHECKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-007','amanda.lee@mbs.com','EMP-10007','Amanda Lee','Amanda L.','Product Control','Senior NPA Reviewer','Singapore','CHECKER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-008','jane.tan@mbs.com','EMP-10008','Jane Tan','Jane T.','RMG-Credit','Head of Credit Risk','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-009','mark.lee@mbs.com','EMP-10009','Mark Lee','Mark L.','Finance','VP Product Control Finance','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-010','robert.koh@mbs.com','EMP-10010','Robert Koh','Robert K.','Finance','Finance VP / Senior Controller','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-011','lisa.wong@mbs.com','EMP-10011','Lisa Wong','Lisa W.','Legal & Compliance','Head of Product Legal','Hong Kong','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-012','ahmad.razak@mbs.com','EMP-10012','Ahmad Razak','Ahmad R.','MLR','Money Laundering Reporting Officer','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-013','kevin.patel@mbs.com','EMP-10013','Kevin Patel','Kevin P.','Operations','Head of Trade Operations','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-014','rachel.ng@mbs.com','EMP-10014','Rachel Ng','Rachel N.','Technology','VP Technology Solutions','Singapore','APPROVER',1,'2026-02-11 02:41:55','2026-02-11 02:41:55'),('USR-015','elena.torres@mbs.com','EMP-10015','Elena Torres','Elena T.','COO Office','GFM Chief Operating Officer','Singapore','COO',1,'2026-02-11 02:41:55','2026-02-11 02:41:55');
ALTER TABLE `users` ENABLE KEYS;
UNLOCK TABLES;
SET TIME_ZONE=@OLD_TIME_ZONE;
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT;
SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS;
SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION;
SET SQL_NOTES=@OLD_SQL_NOTES;
SET UNIQUE_CHECKS=1;
SET FOREIGN_KEY_CHECKS=1;
