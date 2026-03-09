-- Migration 016: Expand Knowledge Studio draft metadata (MySQL-compatible) (Feb 24, 2026)
-- Adds: studio_documents.agent_target, studio_documents.target_dataset_id
-- Uses information_schema + dynamic SQL (works on MySQL 8 where "ADD COLUMN IF NOT EXISTS" is not supported)

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

