-- Migration 014: Knowledge Studio drafts + approval workflow (Feb 24, 2026)
-- Goal:
--   - Allow users to create private/generated documents (drafts) that are NOT part of KB until approved
--   - Support multi-file uploads as sources for draft generation
--   - Allow privileged users (APPROVER/COO/ADMIN) to publish an approved draft into kb_documents

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

