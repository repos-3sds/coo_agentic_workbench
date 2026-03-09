-- Migration 012: Expand npa_comments to support Draft Builder comments (Feb 23, 2026)
-- Goal:
--   - Reuse existing npa_comments table (no duplicate tables)
--   - Support:
--       * draft-level comments
--       * field-level comments (by field_key)
--       * replies (already supported via parent_comment_id)
--   - Keep backward compatibility for existing comment feeds (approvals, system alerts, etc.)
--
-- Compatible with MySQL and MariaDB (information_schema + dynamic SQL).

SET @db := DATABASE();

-- scope: DRAFT | FIELD (default DRAFT for legacy rows)
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='scope') = 0,
  'ALTER TABLE npa_comments ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT ''DRAFT'' AFTER comment_type',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- field_key: for scope=FIELD (nullable for draft-level comments)
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='field_key') = 0,
  'ALTER TABLE npa_comments ADD COLUMN field_key VARCHAR(255) NULL AFTER scope',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- author_user_id: optional link to users.id (keeps UI attribution stable if names change)
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND COLUMN_NAME='author_user_id') = 0,
  'ALTER TABLE npa_comments ADD COLUMN author_user_id VARCHAR(36) NULL AFTER comment_text',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Helpful index for Draft Builder overlay fetches
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='npa_comments' AND INDEX_NAME='idx_npa_comments_scope_field') = 0,
  'ALTER TABLE npa_comments ADD INDEX idx_npa_comments_scope_field (project_id, scope, field_key, created_at)',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

