-- Migration 011: Add file/link fields for KB documents (Feb 23, 2026)
-- Goal:
--   - Enable hosting PDFs inside the app (uploads/kb/*)
--   - Enable link-out to official sources (source_url)
--   - Keep kb_documents as the single registry (no separate tables)
--
-- Compatible with MySQL and MariaDB (information_schema + dynamic SQL).

SET @db := DATABASE();

-- source_url: official/public link (MAS/PDPC/SSO/BIS etc.)
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='source_url') = 0,
  'ALTER TABLE kb_documents ADD COLUMN source_url TEXT NULL AFTER display_date',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- file_path: relative path under uploads/ (served via API)
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

-- visibility: INTERNAL (default) | PUBLIC (for non-sensitive docs)
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND COLUMN_NAME='visibility') = 0,
  'ALTER TABLE kb_documents ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT ''INTERNAL'' AFTER sha256',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Helpful index for filtering/sorting
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='kb_documents' AND INDEX_NAME='idx_kb_ui_category') = 0,
  'ALTER TABLE kb_documents ADD INDEX idx_kb_ui_category (ui_category)',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

