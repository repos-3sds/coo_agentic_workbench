-- Migration 013: Persist Dify conversation state per chat session (Feb 24, 2026)
-- Goal:
--   - Preserve multi-agent conversation continuity across page reloads
--   - Store per-agent conversation_id map + delegation stack + active agent
--
-- Column: conversation_state_json (JSON, nullable)
-- Example:
--   {
--     "activeAgentId": "IDEATION",
--     "delegationStack": ["MASTER_COO","NPA_ORCHESTRATOR"],
--     "conversations": { "MASTER_COO":"...", "NPA_ORCHESTRATOR":"...", "IDEATION":"..." }
--   }

SET @db := DATABASE();

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='agent_sessions' AND COLUMN_NAME='conversation_state_json') = 0,
  'ALTER TABLE agent_sessions ADD COLUMN conversation_state_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL COMMENT ''Dify per-agent conversation state (JSON)'' CHECK (json_valid(conversation_state_json))',
  'SELECT 1'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

