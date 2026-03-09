-- NPA Seed Data (Based on Golden Source Requirements)
-- populating npa_projects, npa_intake_assessments, npa_classification_scorecards, npa_signoffs, npa_form_data

-- ==========================================
-- 1. Project: Digital Asset Custody Expansion (Complete NTG Example)
-- "New-to-Group" classification based on NPA_Pre_Requisites.md
-- ==========================================

INSERT INTO npa_projects (id, title, description, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, submitted_by, created_at)
VALUES 
('NPA-2026-001', 'Digital Asset Custody Expansion', 'Proposal to expand digital asset custody services to institutional clients in Hong Kong. This introduces new technology infrastructure and regulatory requirements.', 'New-to-Group', 'HIGH', TRUE, 50000000.00, 'USD', 'PENDING_SIGN_OFFS', 'Sarah Jenkins', NOW());

-- Jurisdictions
INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES ('NPA-2026-001', 'SG'), ('NPA-2026-001', 'HK');

-- Intake Assessment (7 Domains from NPA_Pre_Requisites.md)
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings, assessed_at) VALUES
('NPA-2026-001', 'STRATEGIC', 'PASS', 100, '{"observation": "Aligns with digital transformation objectives (Strategic Alignment Assessment Phase 1.1)"}', NOW()),
('NPA-2026-001', 'RISK', 'WARN', 60, '{"observation": "New risk categories identified: Custody Risk, Cyber Risk. Requires detailed Risk Model validation."}', NOW()),
('NPA-2026-001', 'LEGAL', 'FAIL', 40, '{"observation": "Cross-border legal opinion for HK jurisdiction pending."}', NOW()),
('NPA-2026-001', 'OPS', 'PASS', 85, '{"observation": "Settlement process defined, but manual exception handling required initially."}', NOW()),
('NPA-2026-001', 'TECH', 'WARN', 70, '{"observation": "New custody wallet infrastructure integration required."}', NOW()),
('NPA-2026-001', 'DATA', 'PASS', 90, '{"observation": "Data privacy requirements mapped."}', NOW()),
('NPA-2026-001', 'FINANCE', 'PASS', 100, '{"observation": "ROI Analysis completed and approved."}', NOW());

-- Classification Scorecard (NTG Logic)
INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, created_at) VALUES
('NPA-2026-001', 18, 'New-to-Group', '{"market_innovation": true, "product_structure": true, "tech_platform": true, "regulatory_framework": true}', NOW());

-- Sign-offs (Based on NPA_Approvals.md Authority Matrix)
INSERT INTO npa_signoffs (project_id, party, status, approver_user_id, decision_date, comments, loop_back_count) VALUES
('NPA-2026-001', 'RMG-Credit', 'APPROVED', 'David Lee', NOW(), 'Credit limit framework approved.', 0),
('NPA-2026-001', 'RMG-Market', 'PENDING', NULL, NULL, NULL, 0),
('NPA-2026-001', 'Legal & Compliance', 'REWORK', 'James Tan', NOW(), 'Need external legal opinion for HK jurisdiction.', 1),
('NPA-2026-001', 'T&O-Tech', 'PENDING', NULL, NULL, NULL, 0),
('NPA-2026-001', 'Group Tax', 'PENDING', NULL, NULL, NULL, 0),
('NPA-2026-001', 'PAC', 'PENDING', NULL, NULL, 'Pending functional sign-offs before Committee review.', 0);

-- Form Data (Based on NPA_Golden_Template.md)
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-001', 'product_name', 'Digital Asset Custody Service', 'MANUAL', 100, NULL),
('NPA-2026-001', 'product_category', 'Custody Services', 'AUTO', 95, '{"source": "AI-Classification"}'),
('NPA-2026-001', 'target_clients', 'Institutional Investors, Family Offices', 'ADAPTED', 85, '{"adaptation_logic": "Expanded from standard custody list"}'),
('NPA-2026-001', 'risk_classification', 'HIGH', 'AUTO', 98, NULL),
('NPA-2026-001', 'booking_location', 'Singapore', 'AUTO', 100, NULL);


-- ==========================================
-- 2. Project: FX Put Option Variation (Variation Example)
-- "Variation" classification based on NPA_Pre_Requisites.md
-- ==========================================

INSERT INTO npa_projects (id, title, description, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, submitted_by, created_at)
VALUES 
('NPA-2026-002', 'FX Put Option GBP/USD Variation', 'Extension of existing FX Option product to include longer tenor (5Y) for corporate hedging.', 'Variation', 'MEDIUM', FALSE, 12000000.00, 'USD', 'RETURNED_TO_MAKER', 'Mike Chen', NOW());

INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES ('NPA-2026-002', 'SG');

INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings, assessed_at) VALUES
('NPA-2026-002', 'STRATEGIC', 'PASS', 100, NULL, NOW()),
('NPA-2026-002', 'RISK', 'WARN', 50, '{"observation": "Longer tenor increases counterparty credit risk exposure beyond standard limits."}', NOW()),
('NPA-2026-002', 'OPS', 'PASS', 100, '{"observation": "Existing booking model applies."}', NOW());

INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, created_at) VALUES
('NPA-2026-002', 12, 'Variation', '{"tenor_extension": true, "credit_risk_increase": true}', NOW());

INSERT INTO npa_signoffs (project_id, party, status, approver_user_id, decision_date, comments, loop_back_count) VALUES
('NPA-2026-002', 'RMG-Credit', 'REJECTED', 'Sarah Lim', NOW(), '5Y tenor requires additional collateral agreement. Please revise term sheet.', 2),
('NPA-2026-002', 'RMG-Market', 'APPROVED', 'John Doe', NOW(), 'Market risk within tolerance.', 0);

INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score) VALUES
('NPA-2026-002', 'product_name', 'FX Put Option GBP/USD', 'AUTO', 100),
('NPA-2026-002', 'tenor', '5 Years', 'MANUAL', 100);


-- ==========================================
-- 3. Project: Retail Wealth App Lite (NPA Lite Example)
-- "NPA Lite" classification based on NPA_Pre_Requisites.md
-- ==========================================

INSERT INTO npa_projects (id, title, description, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, submitted_by, created_at)
VALUES 
('NPA-2026-003', 'Retail Wealth App - UI Enhancement', 'Minor UI updates to existing wealth app. No change to underlying product logic or risk.', 'NPA Lite', 'LOW', FALSE, 0.00, 'SGD', 'APPROVED', 'Jessica Wu', NOW());

INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES ('NPA-2026-003', 'SG');

INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, created_at) VALUES
('NPA-2026-003', 2, 'NPA Lite', '{"minor_change": true, "no_risk_impact": true}', NOW());

INSERT INTO npa_signoffs (project_id, party, status, approver_user_id, decision_date, comments, loop_back_count) VALUES
('NPA-2026-003', 'Business Head', 'APPROVED', 'Alan Tan', NOW(), 'Proceed.', 0),
('NPA-2026-003', 'Group Product Head', 'APPROVED', 'Amelia Ong', NOW(), 'Approved as NPA Lite.', 0);


-- ==========================================
-- 4. Project: Vietnam Bond Trading (Cross-Border Example)
-- "Cross-Border" logic from KB_Ideation_Agent.md
-- ==========================================

INSERT INTO npa_projects (id, title, description, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, submitted_by, created_at)
VALUES 
('NPA-2026-004', 'Vietnam Bond Trading Desk', 'Establishment of new trading desk for Vietnamese Government Bonds.', 'New-to-Group', 'HIGH', TRUE, 100000000.00, 'USD', 'PENDING_FINAL_APPROVAL', 'Sarah Jenkins', NOW());

INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES ('NPA-2026-004', 'SG'), ('NPA-2026-004', 'VN');

INSERT INTO npa_signoffs (project_id, party, status, approver_user_id, decision_date, comments, loop_back_count) VALUES
('NPA-2026-004', 'RMG-Credit', 'APPROVED', 'David Lee', NOW(), NULL, 0),
('NPA-2026-004', 'Group Finance', 'APPROVED', 'Amanda Low', NOW(), NULL, 0),
('NPA-2026-004', 'Legal & Compliance', 'APPROVED', 'James Tan', NOW(), 'Subject to local counsel opinion on enforceability.', 0);

INSERT INTO npa_post_launch_conditions (project_id, condition_text, owner_party, due_date, status) VALUES
('NPA-2026-004', 'Quarterly volume review with Risk', 'RMG-Credit', DATE_ADD(NOW(), INTERVAL 3 MONTH), 'PENDING');
