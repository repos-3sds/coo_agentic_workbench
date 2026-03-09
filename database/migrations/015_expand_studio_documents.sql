-- Migration 015: Expand Knowledge Studio draft metadata (Feb 24, 2026)
-- Goal:
--   - Allow tagging drafts (and later published KB docs) to specific agents
--   - Persist target Dify dataset UUID for publishing

ALTER TABLE `studio_documents`
  ADD COLUMN IF NOT EXISTS `agent_target` varchar(80) DEFAULT NULL AFTER `ui_category`,
  ADD COLUMN IF NOT EXISTS `target_dataset_id` varchar(60) DEFAULT NULL AFTER `agent_target`;

