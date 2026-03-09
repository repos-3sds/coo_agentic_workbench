/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.6.25-MariaDB, for debian-linux-gnu (aarch64)
--
-- Host: localhost    Database: npa_workbench
-- ------------------------------------------------------
-- Server version	10.6.25-MariaDB-ubu2204

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agent_messages`
--

DROP TABLE IF EXISTS `agent_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agent_sessions`
--

DROP TABLE IF EXISTS `agent_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kb_documents`
--

DROP TABLE IF EXISTS `kb_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `kb_documents` (
  `doc_id` varchar(100) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `doc_type` varchar(50) DEFAULT NULL,
  `embedding_id` varchar(100) DEFAULT NULL,
  `last_synced` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_agent_routing_decisions`
--

DROP TABLE IF EXISTS `npa_agent_routing_decisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_approvals`
--

DROP TABLE IF EXISTS `npa_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_audit_log`
--

DROP TABLE IF EXISTS `npa_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_breach_alerts`
--

DROP TABLE IF EXISTS `npa_breach_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_classification_assessments`
--

DROP TABLE IF EXISTS `npa_classification_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_classification_scorecards`
--

DROP TABLE IF EXISTS `npa_classification_scorecards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_comments`
--

DROP TABLE IF EXISTS `npa_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_documents`
--

DROP TABLE IF EXISTS `npa_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_escalations`
--

DROP TABLE IF EXISTS `npa_escalations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_external_parties`
--

DROP TABLE IF EXISTS `npa_external_parties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_form_data`
--

DROP TABLE IF EXISTS `npa_form_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_intake_assessments`
--

DROP TABLE IF EXISTS `npa_intake_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_jurisdictions`
--

DROP TABLE IF EXISTS `npa_jurisdictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `npa_jurisdictions` (
  `project_id` varchar(36) DEFAULT NULL,
  `jurisdiction_code` varchar(10) DEFAULT NULL COMMENT 'SG, HK, CN, IN, etc.',
  KEY `project_id` (`project_id`),
  CONSTRAINT `npa_jurisdictions_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `npa_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_kpi_snapshots`
--

DROP TABLE IF EXISTS `npa_kpi_snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_loop_backs`
--

DROP TABLE IF EXISTS `npa_loop_backs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_market_clusters`
--

DROP TABLE IF EXISTS `npa_market_clusters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `npa_market_clusters` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(100) NOT NULL,
  `npa_count` int(11) DEFAULT 0,
  `growth_percent` decimal(5,2) DEFAULT NULL,
  `intensity_percent` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_market_risk_factors`
--

DROP TABLE IF EXISTS `npa_market_risk_factors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_monitoring_thresholds`
--

DROP TABLE IF EXISTS `npa_monitoring_thresholds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_performance_metrics`
--

DROP TABLE IF EXISTS `npa_performance_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_post_launch_conditions`
--

DROP TABLE IF EXISTS `npa_post_launch_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_prerequisite_results`
--

DROP TABLE IF EXISTS `npa_prerequisite_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_projects`
--

DROP TABLE IF EXISTS `npa_projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_prospects`
--

DROP TABLE IF EXISTS `npa_prospects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_risk_checks`
--

DROP TABLE IF EXISTS `npa_risk_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_signoffs`
--

DROP TABLE IF EXISTS `npa_signoffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `npa_workflow_states`
--

DROP TABLE IF EXISTS `npa_workflow_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_classification_criteria`
--

DROP TABLE IF EXISTS `ref_classification_criteria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_document_requirements`
--

DROP TABLE IF EXISTS `ref_document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_document_rules`
--

DROP TABLE IF EXISTS `ref_document_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ref_document_rules` (
  `id` varchar(50) NOT NULL,
  `doc_code` varchar(50) NOT NULL,
  `doc_name` varchar(255) NOT NULL,
  `condition_logic` text NOT NULL,
  `criticality` varchar(20) NOT NULL DEFAULT 'CONDITIONAL',
  `source_party` varchar(50) NOT NULL DEFAULT 'BUSINESS',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_escalation_rules`
--

DROP TABLE IF EXISTS `ref_escalation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_field_options`
--

DROP TABLE IF EXISTS `ref_field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_npa_fields`
--

DROP TABLE IF EXISTS `ref_npa_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_npa_sections`
--

DROP TABLE IF EXISTS `ref_npa_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_npa_templates`
--

DROP TABLE IF EXISTS `ref_npa_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ref_npa_templates` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `version` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_prerequisite_categories`
--

DROP TABLE IF EXISTS `ref_prerequisite_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_prerequisite_checks`
--

DROP TABLE IF EXISTS `ref_prerequisite_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_prohibited_items`
--

DROP TABLE IF EXISTS `ref_prohibited_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ref_signoff_routing_rules`
--

DROP TABLE IF EXISTS `ref_signoff_routing_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'npa_workbench'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-11  6:04:47
