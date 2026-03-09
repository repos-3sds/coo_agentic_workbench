-- Migration 003: Sprint 3-5 Schema Additions
-- Addresses: D-001 (validity_expiry), D-002 (file_path), GAP-014 (approval_track_subtype)
-- Safe to run multiple times (uses IF NOT EXISTS / column existence checks)

-- D-001: Add validity_expiry column to npa_projects
-- Used by: final-approve (sets +1 year), sla-monitor (checkValidityExpiry), extend-validity endpoint
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS validity_expiry DATE DEFAULT NULL;

-- D-001: Add extension_count to track how many times validity was extended
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS extension_count INT DEFAULT 0;

-- D-002: Add file_path to npa_documents for actual file storage location
ALTER TABLE npa_documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) DEFAULT NULL;

-- GAP-014: Add approval_track_subtype for NPA Lite B1-B4 sub-types
-- Used by: assignSignoffParties() in transitions.js
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS approval_track_subtype VARCHAR(10) DEFAULT NULL;

-- GAP-015: Ensure APPROVED_CONDITIONAL status is valid for signoffs
-- (No schema change needed — npa_signoffs.status is VARCHAR, not ENUM)

-- Add predicted columns if not present (Sprint 2 agent persistence)
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_approval_likelihood DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_timeline_days INT DEFAULT NULL;
ALTER TABLE npa_projects ADD COLUMN IF NOT EXISTS predicted_bottleneck VARCHAR(200) DEFAULT NULL;
