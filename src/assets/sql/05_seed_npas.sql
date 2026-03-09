-- 05_seed_npas.sql
-- 12 NPA projects covering all types, tracks, stages, and statuses
-- First clear any existing test data
DELETE FROM npa_form_data;
DELETE FROM npa_signoffs;
DELETE FROM npa_post_launch_conditions;
DELETE FROM npa_classification_scorecards;
DELETE FROM npa_intake_assessments;
DELETE FROM npa_workflow_states;
DELETE FROM npa_jurisdictions;
DELETE FROM npa_projects WHERE id LIKE 'NPA-2026-%';

-- ==========================================
-- NPA #1: Digital Asset Custody (NTG, Full NPA, Sign-Off, At Risk)
-- ==========================================
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-001', 'Digital Asset Custody Expansion', 'Proposal to expand digital asset custody services to institutional clients across APAC.', 'Custody Services', 'New-to-Group', 'HIGH', TRUE, 50000000.00, 'USD', 'PENDING_SIGN_OFFS', 'At Risk', 'Sarah Jenkins', 'Sarah Jenkins', 'Digital Solutions', 'Standard NPA v2.1', '2025-11-15', 'Michael Chen', 'In Review', 'FULL_NPA', 12800000.00, 65.00, 14.50, 'Legal & Compliance', '2025-11-15 09:00:00');

-- NPA #2: FX Put Option GBP/USD (Variation, NPA Lite, Sign-Off, On Track)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-002', 'FX Put Option GBP/USD', 'Extension of existing FX Option product with new GBP/USD currency pair for corporate hedging clients.', 'FX Derivatives', 'Variation', 'MEDIUM', FALSE, 75000000.00, 'USD', 'PENDING_SIGN_OFFS', 'On Track', 'Sarah Lim', 'Sarah Lim', 'FX Trading', 'NPA Lite v1.0', '2025-12-01', 'David Chen', 'N/A', 'NPA_LITE', 3200000.00, 78.00, 4.20, 'Finance', '2025-12-01 10:30:00');

-- NPA #3: Green Bond ETF (NTG, Full NPA, Risk Assess, On Track)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-003', 'Global Green Bond ETF', 'Launch of ESG-compliant green bond exchange-traded fund for wealth management clients.', 'Fixed Income / ETF', 'New-to-Group', 'HIGH', TRUE, 120000000.00, 'USD', 'RISK_ASSESSMENT', 'On Track', 'Sarah Jenkins', 'Sarah Jenkins', 'Investment Products', 'ETF Template v2.1', '2025-11-01', 'John Smith', 'Pending', 'FULL_NPA', 15200000.00, 72.00, 18.00, 'RMG-Credit', '2025-11-01 08:00:00');

-- NPA #4: Crypto Custody Prime (Variation, Full NPA, DCE Review, At Risk)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-004', 'Crypto Custody Prime', 'Premium custody solution for high-net-worth digital asset holders with cold storage and DeFi integration.', 'Digital Custody', 'Variation', 'HIGH', TRUE, 85000000.00, 'USD', 'DCE_REVIEW', 'At Risk', 'Mike Ross', 'Mike Ross', 'Digital Solutions', 'Custody Template v1.3', '2025-12-20', 'Emily Chen', 'In Review', 'FULL_NPA', 9100000.00, 55.00, 12.00, 'Technology', '2025-12-20 11:00:00');

-- NPA #5: AI Wealth Advisory (Existing, NPA Lite, Discovery, On Track)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-005', 'AI Wealth Advisory Platform', 'AI-powered investment advisory service for mass affluent segment using Claude models.', 'Advisory', 'Existing', 'LOW', FALSE, 15000000.00, 'SGD', 'DISCOVERY', 'On Track', 'Elena Torres', 'Elena Torres', 'Wealth Technology', 'Advisory Template v1.0', '2026-01-10', 'Jessica Wu', 'N/A', 'NPA_LITE', 8500000.00, 88.00, 3.50, 'Operations', '2026-01-10 09:00:00');

-- NPA #6: Multi-Currency Deposit (Variation, Evergreen, Launched, Completed)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at, launched_at, pir_status, pir_due_date) VALUES
('NPA-2026-006', 'Multi-Currency Deposit', 'Enhancement to existing multi-currency time deposit product with new tenor options.', 'Deposit', 'Variation', 'LOW', FALSE, 200000000.00, 'SGD', 'LAUNCHED', 'Completed', 'Amanda Lee', 'Amanda Lee', 'Consumer Products', 'Deposit Template v3.0', '2025-09-15', 'David Chen', 'Approved', 'EVERGREEN', 1200000.00, 95.00, 0.50, NULL, '2025-09-15 08:00:00', '2025-10-01 00:00:00', 'NOT_REQUIRED', NULL);

-- NPA #7: FX Accumulator USD/SGD (Variation, Full NPA, Launched, Warning)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at, launched_at, pir_status, pir_due_date) VALUES
('NPA-2026-007', 'FX Accumulator - USD/SGD', 'Leveraged FX accumulator structure for USD/SGD with knock-out barriers.', 'FX Derivatives', 'Variation', 'MEDIUM', FALSE, 150000000.00, 'USD', 'LAUNCHED', 'Warning', 'James Liu', 'James Liu', 'FX Trading', 'FX Structured v2.0', '2025-08-01', 'Amanda Lee', 'Approved', 'FULL_NPA', 3800000.00, 82.00, 8.00, 'Finance', '2025-08-01 07:30:00', '2025-09-15 00:00:00', 'PENDING', '2026-03-15');

-- NPA #8: ESG-Linked Trade Finance (NTG, Full NPA, Sign-Off, Blocked)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-008', 'ESG-Linked Trade Finance', 'Sustainability-linked trade finance facility with ESG performance targets and margin incentives.', 'Trade Finance', 'New-to-Group', 'HIGH', TRUE, 45000000.00, 'USD', 'PENDING_SIGN_OFFS', 'Blocked', 'Robert Tan', 'Robert Tan', 'Institutional Banking', 'Trade Finance v1.5', '2025-10-01', 'James Liu', 'Pending', 'FULL_NPA', 2800000.00, 45.00, 22.00, 'Legal & Compliance', '2025-10-01 10:00:00');

-- NPA #9: Algo Trading Bot (Existing, NPA Lite, Risk Assess, On Track)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-009', 'Algorithmic FX Hedging Bot', 'Automated FX hedging algorithm for corporate treasury clients using ML-driven execution.', 'FX Derivatives', 'Existing', 'MEDIUM', FALSE, 30000000.00, 'USD', 'RISK_ASSESSMENT', 'On Track', 'Elena Torres', 'Elena Torres', 'FX Technology', 'Advisory Template v1.0', '2026-01-05', 'Alex Rivera', 'N/A', 'NPA_LITE', 6500000.00, 85.00, 5.00, 'Technology', '2026-01-05 14:00:00');

-- NPA #10: Carbon Credit Exchange (NTG, Full NPA, Discovery, On Track)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-010', 'Carbon Credit Exchange', 'Platform for trading verified carbon credits across APAC markets with blockchain settlement.', 'Commodities / ESG', 'New-to-Group', 'HIGH', TRUE, 90000000.00, 'USD', 'DISCOVERY', 'On Track', 'Sarah Jenkins', 'Sarah Jenkins', 'Sustainability Products', 'Standard NPA v2.1', '2026-01-20', 'Michael Chen', 'Pending', 'FULL_NPA', 12000000.00, 60.00, 20.00, 'RMG-Credit', '2026-01-20 09:30:00');

-- NPA #11: Retail Wealth App Enhancement (Existing, Evergreen, Approved, Completed)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-011', 'Retail Wealth App - UI Enhancement', 'Minor UI updates to existing wealth app portfolio view. No change to product logic or risk.', 'Retail Banking', 'Existing', 'LOW', FALSE, 0.00, 'SGD', 'APPROVED', 'Completed', 'Jessica Wu', 'Jessica Wu', 'Consumer Products', 'Evergreen Template v1.0', '2026-01-25', 'Amanda Lee', 'N/A', 'EVERGREEN', 0.00, 98.00, 0.50, NULL, '2026-01-25 11:00:00');

-- NPA #12: Prohibited Crypto Derivative (NTG, Prohibited, Hard Stop)
INSERT INTO npa_projects (id, title, description, product_category, npa_type, risk_level, is_cross_border, notional_amount, currency, current_stage, status, submitted_by, product_manager, pm_team, template_name, kickoff_date, proposal_preparer, pac_approval_status, approval_track, estimated_revenue, predicted_approval_likelihood, predicted_timeline_days, predicted_bottleneck, created_at) VALUES
('NPA-2026-012', 'Leveraged Crypto CFD Product', 'Contracts for Difference on cryptocurrency pairs with 10x leverage for retail clients.', 'Crypto Derivatives', 'New-to-Group', 'HIGH', FALSE, 25000000.00, 'USD', 'PROHIBITED', 'Stopped', 'Alex Rivera', 'Alex Rivera', 'Digital Assets', NULL, '2026-02-01', NULL, 'N/A', 'PROHIBITED', 0.00, 0.00, 0.00, 'Prohibited List Checker', '2026-02-01 15:00:00');

-- ==========================================
-- Jurisdictions for all NPAs
-- ==========================================
INSERT INTO npa_jurisdictions (project_id, jurisdiction_code) VALUES
('NPA-2026-001', 'SG'), ('NPA-2026-001', 'HK'),
('NPA-2026-002', 'SG'),
('NPA-2026-003', 'SG'), ('NPA-2026-003', 'HK'), ('NPA-2026-003', 'LN'),
('NPA-2026-004', 'HK'), ('NPA-2026-004', 'SG'),
('NPA-2026-005', 'SG'),
('NPA-2026-006', 'SG'),
('NPA-2026-007', 'SG'),
('NPA-2026-008', 'SG'), ('NPA-2026-008', 'VN'), ('NPA-2026-008', 'ID'),
('NPA-2026-009', 'SG'),
('NPA-2026-010', 'SG'), ('NPA-2026-010', 'AU'),
('NPA-2026-011', 'SG'),
('NPA-2026-012', 'SG');
