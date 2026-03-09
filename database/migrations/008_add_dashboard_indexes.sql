-- Migration 008: Add indexes for dashboard/list endpoints (Feb 23, 2026)
--
-- Goal:
--   Support common filters/sorts in /api/npas and /api/approvals without full scans.
--   Safe to run multiple times (uses IF NOT EXISTS where supported).

-- npa_projects: filters/sorts
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

-- npa_signoffs: aggregate counts by status
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_signoffs'
    AND index_name = 'idx_npa_signoffs_project_status'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_signoffs ADD INDEX idx_npa_signoffs_project_status (project_id, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- npa_breach_alerts: active breaches by status
SET @idx_exists := (
  SELECT COUNT(1)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'npa_breach_alerts'
    AND index_name = 'idx_npa_breaches_project_status'
);
SET @sql := IF(@idx_exists = 0, 'ALTER TABLE npa_breach_alerts ADD INDEX idx_npa_breaches_project_status (project_id, status)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
