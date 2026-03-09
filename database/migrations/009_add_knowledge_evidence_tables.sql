-- Migration 009: (LEGACY) Evidence Library table + seed (Feb 23, 2026)
--
-- IMPORTANT:
--   - The Knowledge Base "registry" should live in `kb_documents` (used by MCP/RAG tools).
--   - UI metadata columns + UI seed rows are handled by migration 010:
--       `010_expand_kb_documents_and_add_evidence_library.sql`
--   - This migration is retained only for historical/backward compatibility and
--     now intentionally does NOT create a separate `knowledge_documents` table
--     to avoid duplicate sources of truth.
--
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS + UPSERT seed).

CREATE TABLE IF NOT EXISTS evidence_library (
  record_id       VARCHAR(64) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT NOT NULL,
  evidence_type   VARCHAR(20) NOT NULL,       -- PRECEDENTS | AUDITS | EXCEPTIONS
  status          VARCHAR(20) NOT NULL,       -- APPROVED | REJECTED | SEALED | GRANTED
  relevance_score INT NULL,                   -- percent (0-100)
  event_date      DATE NULL,
  display_date    VARCHAR(32) NULL,           -- e.g. "12 Nov 2025"
  icon_name       VARCHAR(50) NULL,           -- lucide icon name
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_el_type (evidence_type),
  INDEX idx_el_status (status),
  INDEX idx_el_date (event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Seed: Evidence Library ───────────────────────────────────────────────
INSERT INTO evidence_library
  (record_id, title, description, evidence_type, status, relevance_score, event_date, display_date, icon_name)
VALUES
  ('TSG1917', 'Exchange-Listed IR Options',
    'US Exchange-listed Interest Rate Futures and Options. Grandfathered product with T&M HK precedent. Track: No NPA Required. Model validation already completed.',
    'PRECEDENTS', 'APPROVED', 99, '2025-11-12', '12 Nov 2025', 'git-commit'),
  ('TSG2042', 'NAFMII Repo Agreement',
    'Pledged Bond Repo in CIBM. Classification: NTG. Cross-border settlement via MBS China. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 85, '2025-10-04', '04 Oct 2025', 'git-commit'),
  ('TSG2055', 'Nikko AM-ICBC SG China Bond ETF',
    'Nikko AM-ICBC SG China Bond ETF subscription. Classification: Deal-specific. Requires individual deal approval rather than standing NPA.',
    'PRECEDENTS', 'REJECTED', 78, '2025-09-19', '19 Sep 2025', 'git-commit'),
  ('TSG2339', 'Swap Connect Platform',
    'Interest Rate Swaps via Swap Connect platform (cross-border HK ↔ China). ISDA with novation to HKEx OTC Clear. Track: Full NPA.',
    'PRECEDENTS', 'APPROVED', 92, '2025-08-05', '05 Aug 2025', 'git-commit'),
  ('TSG2543', 'Multi-Asset Complex Structured Product',
    'Complex structured product across multiple asset classes. Triggered multiple SOP reviews; rejected due to prolonged clearance timelines.',
    'PRECEDENTS', 'REJECTED', 65, '2025-07-22', '22 Jul 2025', 'git-commit'),
  ('AUD-2026-041', 'Q1 Regulatory Submission Log',
    'Immutable log of MAS 656 regulatory checks performed by the Compliance Agent.',
    'AUDITS', 'SEALED', NULL, '2026-03-01', '01 Mar 2026', 'shield-check'),
  ('EXC-091A', 'Evergreen Cap Override - FX Forwards',
    'Temporary lifting of the $500M GFM cap for Q1 hedging demands.',
    'EXCEPTIONS', 'GRANTED', NULL, '2026-02-28', '28 Feb 2026', 'alert-circle'),
  ('AUD-2025-992', 'Annual Model Validation Sign-offs',
    'RMG validation certificates for 32 active pricing models.',
    'AUDITS', 'SEALED', NULL, '2025-12-31', '31 Dec 2025', 'shield-check')
ON DUPLICATE KEY UPDATE
  title=VALUES(title),
  description=VALUES(description),
  evidence_type=VALUES(evidence_type),
  status=VALUES(status),
  relevance_score=VALUES(relevance_score),
  event_date=VALUES(event_date),
  display_date=VALUES(display_date),
  icon_name=VALUES(icon_name),
  updated_at=CURRENT_TIMESTAMP;
