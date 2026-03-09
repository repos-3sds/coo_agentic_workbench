-- Migration 006: Make npa_projects.updated_at strict-mode friendly (Feb 23, 2026)
--
-- Removes the invalid zero-timestamp default so MySQL 8 strict-mode does not require
-- session-level sql_mode overrides in application code.

ALTER TABLE npa_projects
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

