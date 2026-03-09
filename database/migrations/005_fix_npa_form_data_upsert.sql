-- Migration 005: Fix npa_form_data UPSERT behavior + timestamps (Feb 23, 2026)
--
-- Problem:
--   Multiple code paths use INSERT ... ON DUPLICATE KEY UPDATE for npa_form_data,
--   but the table has no UNIQUE constraint on (project_id, field_key). This causes
--   duplicate rows instead of true upserts.
--
-- Fix:
--   1) Add created_at / updated_at timestamps (code expects updated_at in some paths)
--   2) De-duplicate existing rows per (project_id, field_key) (keep latest by max(id))
--   3) Add UNIQUE KEY on (project_id, field_key) so upserts work
--
-- Safe to run multiple times.

-- 1) Timestamps (align with API expectations)
ALTER TABLE npa_form_data
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- 2) De-duplicate before adding UNIQUE KEY
-- Keep the newest row (highest id) per (project_id, field_key).
DELETE fd_old
FROM npa_form_data fd_old
JOIN npa_form_data fd_new
  ON fd_old.project_id = fd_new.project_id
 AND fd_old.field_key = fd_new.field_key
 AND fd_old.id < fd_new.id;

-- 3) Add UNIQUE KEY if missing
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

