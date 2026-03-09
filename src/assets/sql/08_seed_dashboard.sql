-- 08_seed_dashboard.sql
-- Dashboard aggregations, assessments, workflow states, form data, clusters, prospects, audit log, KPIs

-- ==========================================
-- MARKET CLUSTERS (4)
-- ==========================================
INSERT INTO npa_market_clusters (cluster_name, npa_count, growth_percent, intensity_percent) VALUES
('Sustainability (ESG)',  18, 45.00,  85.00),
('Digital Assets',        12, 120.00, 95.00),
('AI Advisory',            9, 28.00,  60.00),
('SME Lending',           24, 12.00,  40.00);

-- ==========================================
-- PRODUCT OPPORTUNITIES / PROSPECTS (5)
-- ==========================================
INSERT INTO npa_prospects (name, theme, probability, estimated_value, value_currency, status) VALUES
('Tokenized Real Estate Fund',     'Digital Assets',   25.00, 45000000.00,  'USD', 'Pre-Seed'),
('Carbon Credit Exchange',         'Sustainability',   60.00, 120000000.00, 'USD', 'Pre-Seed'),
('Algorithmic FX Hedging',         'AI Advisory',      40.00, 15000000.00,  'USD', 'Pre-Seed'),
('Supply Chain Finance 2.0',       'SME Lending',      85.00, 8000000.00,   'USD', 'Pre-Seed'),
('Quantum Key Custody',            'Cybersecurity',    10.00, 200000000.00, 'USD', 'Pre-Seed');

-- ==========================================
-- KPI SNAPSHOTS (3 snapshots for trend calculation)
-- ==========================================
INSERT INTO npa_kpi_snapshots (snapshot_date, pipeline_value, active_npas, avg_cycle_days, approval_rate, approvals_completed, approvals_total, critical_risks) VALUES
('2026-02-11', 142500000.00, 42, 32.00, 94.00, 178, 190, 3),
('2026-01-11', 128000000.00, 38, 34.50, 92.00, 165, 180, 5),
('2025-12-11', 115000000.00, 35, 36.00, 91.00, 155, 170, 4);

-- ==========================================
-- INTAKE ASSESSMENTS (7 domains x 12 NPAs = 84 rows)
-- ==========================================

-- NPA #1: Digital Asset Custody
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-001', 'STRATEGIC', 'PASS', 100, '{"observation": "Aligns with digital transformation strategy."}'),
('NPA-2026-001', 'RISK',      'WARN',  60, '{"observation": "New risk categories: Custody Risk, Cyber Risk."}'),
('NPA-2026-001', 'LEGAL',     'FAIL',  40, '{"observation": "Cross-border legal opinion for HK pending."}'),
('NPA-2026-001', 'OPS',       'PASS',  85, '{"observation": "Settlement process defined. Manual exception handling initially."}'),
('NPA-2026-001', 'TECH',      'WARN',  70, '{"observation": "New custody wallet infrastructure required."}'),
('NPA-2026-001', 'DATA',      'PASS',  90, '{"observation": "Data privacy requirements mapped."}'),
('NPA-2026-001', 'FINANCE',   'PASS', 100, '{"observation": "ROI analysis completed and approved."}');

-- NPA #2: FX Put Option
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-002', 'STRATEGIC', 'PASS', 100, '{"observation": "Standard product extension."}'),
('NPA-2026-002', 'RISK',      'PASS',  85, '{"observation": "Standard FX option risk within tolerance."}'),
('NPA-2026-002', 'LEGAL',     'PASS',  95, '{"observation": "Existing ISDA framework applies."}'),
('NPA-2026-002', 'OPS',       'PASS', 100, '{"observation": "Existing booking model applies."}'),
('NPA-2026-002', 'TECH',      'PASS', 100, '{"observation": "Murex already configured for GBP/USD."}'),
('NPA-2026-002', 'DATA',      'PASS',  95, '{"observation": "Standard reporting already in place."}'),
('NPA-2026-002', 'FINANCE',   'PASS',  90, '{"observation": "ROAE meets minimum threshold."}');

-- NPA #3: Green Bond ETF
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-003', 'STRATEGIC', 'PASS', 100, '{"observation": "Strong alignment with ESG strategy."}'),
('NPA-2026-003', 'RISK',      'WARN',  65, '{"observation": "ESG rating methodology risk. Greenwashing risk."}'),
('NPA-2026-003', 'LEGAL',     'WARN',  70, '{"observation": "Multi-jurisdiction regulatory requirements."}'),
('NPA-2026-003', 'OPS',       'PASS',  80, '{"observation": "ETF creation/redemption process needs setup."}'),
('NPA-2026-003', 'TECH',      'WARN',  75, '{"observation": "New index tracking system required."}'),
('NPA-2026-003', 'DATA',      'PASS',  85, '{"observation": "ESG data aggregation pipeline needed."}'),
('NPA-2026-003', 'FINANCE',   'PASS',  95, '{"observation": "Strong revenue projections. Meets ROAE threshold."}');

-- NPA #4: Crypto Custody Prime
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-004', 'STRATEGIC', 'PASS',  90, '{"observation": "Addresses growing institutional demand."}'),
('NPA-2026-004', 'RISK',      'WARN',  55, '{"observation": "DeFi integration introduces smart contract risk."}'),
('NPA-2026-004', 'LEGAL',     'WARN',  60, '{"observation": "Evolving regulatory landscape for digital assets."}'),
('NPA-2026-004', 'OPS',       'PASS',  75, '{"observation": "Cold storage operations require specialized training."}'),
('NPA-2026-004', 'TECH',      'FAIL',  45, '{"observation": "HSM infrastructure build required. 4-6 weeks lead time."}'),
('NPA-2026-004', 'DATA',      'PASS',  80, '{"observation": "Blockchain data integration needed."}'),
('NPA-2026-004', 'FINANCE',   'PASS',  88, '{"observation": "Revenue model validated by Finance."}');

-- NPA #5: AI Wealth Advisory
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-005', 'STRATEGIC', 'PASS', 100, '{"observation": "Strong alignment with AI-first strategy."}'),
('NPA-2026-005', 'RISK',      'PASS',  90, '{"observation": "Low risk - advisory only, no principal risk."}'),
('NPA-2026-005', 'LEGAL',     'PASS',  85, '{"observation": "AI advisory regulations reviewed."}'),
('NPA-2026-005', 'OPS',       'PASS',  95, '{"observation": "Existing wealth platform infrastructure."}'),
('NPA-2026-005', 'TECH',      'PASS',  80, '{"observation": "Claude API integration straightforward."}'),
('NPA-2026-005', 'DATA',      'PASS',  90, '{"observation": "Customer data handling reviewed."}'),
('NPA-2026-005', 'FINANCE',   'PASS',  85, '{"observation": "Subscription revenue model validated."}');

-- NPA #6-12: Simplified assessments
INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings) VALUES
('NPA-2026-006', 'STRATEGIC', 'PASS', 100, '{"observation": "Standard product enhancement."}'),
('NPA-2026-006', 'RISK',      'PASS', 100, '{"observation": "No additional risk."}'),
('NPA-2026-006', 'OPS',       'PASS', 100, '{"observation": "Existing processes apply."}'),
('NPA-2026-007', 'STRATEGIC', 'PASS',  95, '{"observation": "Strong client demand for FX accumulator."}'),
('NPA-2026-007', 'RISK',      'WARN',  70, '{"observation": "Knock-out barrier risk requires monitoring."}'),
('NPA-2026-007', 'FINANCE',   'PASS',  85, '{"observation": "ROAE validated. Barrier risk priced appropriately."}'),
('NPA-2026-008', 'STRATEGIC', 'PASS',  90, '{"observation": "Supports ESG lending targets."}'),
('NPA-2026-008', 'RISK',      'FAIL',  35, '{"observation": "ESG scoring methodology not validated."}'),
('NPA-2026-008', 'LEGAL',     'FAIL',  30, '{"observation": "Vietnam legal framework inadequate."}'),
('NPA-2026-008', 'FINANCE',   'FAIL',  40, '{"observation": "ROAE below minimum threshold."}'),
('NPA-2026-009', 'STRATEGIC', 'PASS',  95, '{"observation": "Automates manual hedging processes."}'),
('NPA-2026-009', 'RISK',      'PASS',  80, '{"observation": "Algorithm risk within tolerance."}'),
('NPA-2026-009', 'TECH',      'WARN',  65, '{"observation": "ML model deployment requires review."}'),
('NPA-2026-010', 'STRATEGIC', 'PASS', 100, '{"observation": "First-mover advantage in carbon trading."}'),
('NPA-2026-010', 'RISK',      'WARN',  55, '{"observation": "Carbon credit valuation risk."}'),
('NPA-2026-010', 'LEGAL',     'WARN',  60, '{"observation": "Regulatory framework still evolving."}'),
('NPA-2026-011', 'STRATEGIC', 'PASS', 100, '{"observation": "Minor UI improvement."}'),
('NPA-2026-011', 'RISK',      'PASS', 100, '{"observation": "No risk impact."}'),
('NPA-2026-012', 'STRATEGIC', 'FAIL',   0, '{"observation": "PROHIBITED - Leveraged crypto CFDs for retail."}'),
('NPA-2026-012', 'RISK',      'FAIL',   0, '{"observation": "PROHIBITED - Regulatory non-compliance."}');

-- ==========================================
-- CLASSIFICATION SCORECARDS (12 NPAs)
-- ==========================================
INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown) VALUES
('NPA-2026-001', 18, 'New-to-Group',  '{"market_innovation": true, "product_structure": true, "tech_platform": true, "regulatory_framework": true}'),
('NPA-2026-002', 8,  'Variation',     '{"currency_pair_extension": true, "tenor_extension": false}'),
('NPA-2026-003', 17, 'New-to-Group',  '{"new_asset_class": true, "etf_structure": true, "multi_jurisdiction": true}'),
('NPA-2026-004', 14, 'Variation',     '{"defi_integration": true, "premium_tier": true, "cold_storage": true}'),
('NPA-2026-005', 5,  'Existing',      '{"ai_enhancement": true, "no_risk_change": true}'),
('NPA-2026-006', 2,  'Existing',      '{"tenor_extension": true, "no_risk_change": true}'),
('NPA-2026-007', 12, 'Variation',     '{"leverage_structure": true, "barrier_feature": true}'),
('NPA-2026-008', 19, 'New-to-Group',  '{"esg_framework": true, "cross_border": true, "new_market": true, "regulatory_complexity": true}'),
('NPA-2026-009', 6,  'Existing',      '{"algorithmic_trading": true, "automation": true}'),
('NPA-2026-010', 20, 'New-to-Group',  '{"blockchain_settlement": true, "new_asset_class": true, "regulatory_gap": true, "market_creation": true}'),
('NPA-2026-011', 1,  'Existing',      '{"ui_only": true}'),
('NPA-2026-012', 0,  'PROHIBITED',    '{"leveraged_crypto": true, "retail_banned": true, "regulatory_violation": true}');

-- ==========================================
-- WORKFLOW STATES (5 gates x 12 NPAs = 60 rows)
-- ==========================================

-- NPA #1: In Sign-Off phase
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-001', 'INITIATION',  'COMPLETED',   '2025-11-15 09:00:00', '2025-11-15 10:00:00'),
('NPA-2026-001', 'REVIEW',      'COMPLETED',   '2025-11-15 10:00:00', '2025-12-06 09:00:00'),
('NPA-2026-001', 'SIGN_OFF',    'IN_PROGRESS',  '2025-12-06 09:00:00', NULL),
('NPA-2026-001', 'LAUNCH',      'NOT_STARTED', NULL, NULL),
('NPA-2026-001', 'MONITORING',  'NOT_STARTED', NULL, NULL);

-- NPA #2: In Sign-Off phase
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-002', 'INITIATION',  'COMPLETED',   '2025-12-01 10:30:00', '2025-12-01 11:00:00'),
('NPA-2026-002', 'REVIEW',      'COMPLETED',   '2025-12-01 11:00:00', '2025-12-05 14:00:00'),
('NPA-2026-002', 'SIGN_OFF',    'IN_PROGRESS',  '2026-01-12 10:30:00', NULL),
('NPA-2026-002', 'LAUNCH',      'NOT_STARTED', NULL, NULL),
('NPA-2026-002', 'MONITORING',  'NOT_STARTED', NULL, NULL);

-- NPA #3: In Risk Assessment (Review phase)
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-003', 'INITIATION',  'COMPLETED',   '2025-11-01 08:00:00', '2025-11-01 09:00:00'),
('NPA-2026-003', 'REVIEW',      'IN_PROGRESS',  '2025-11-01 09:00:00', NULL),
('NPA-2026-003', 'SIGN_OFF',    'NOT_STARTED', NULL, NULL),
('NPA-2026-003', 'LAUNCH',      'NOT_STARTED', NULL, NULL),
('NPA-2026-003', 'MONITORING',  'NOT_STARTED', NULL, NULL);

-- NPA #4: DCE Review
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-004', 'INITIATION',  'COMPLETED',   '2025-12-20 11:00:00', '2025-12-20 12:00:00'),
('NPA-2026-004', 'REVIEW',      'IN_PROGRESS',  '2025-12-20 12:00:00', NULL),
('NPA-2026-004', 'SIGN_OFF',    'NOT_STARTED', NULL, NULL),
('NPA-2026-004', 'LAUNCH',      'NOT_STARTED', NULL, NULL),
('NPA-2026-004', 'MONITORING',  'NOT_STARTED', NULL, NULL);

-- NPA #5: Discovery
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-005', 'INITIATION',  'IN_PROGRESS',  '2026-01-10 09:00:00', NULL),
('NPA-2026-005', 'REVIEW',      'NOT_STARTED', NULL, NULL),
('NPA-2026-005', 'SIGN_OFF',    'NOT_STARTED', NULL, NULL),
('NPA-2026-005', 'LAUNCH',      'NOT_STARTED', NULL, NULL),
('NPA-2026-005', 'MONITORING',  'NOT_STARTED', NULL, NULL);

-- NPA #6: Launched (all complete)
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-006', 'INITIATION',  'COMPLETED', '2025-09-15 08:00:00', '2025-09-15 08:30:00'),
('NPA-2026-006', 'REVIEW',      'COMPLETED', '2025-09-15 08:30:00', '2025-09-16 08:00:00'),
('NPA-2026-006', 'SIGN_OFF',    'COMPLETED', '2025-09-16 08:00:00', '2025-09-22 10:00:00'),
('NPA-2026-006', 'LAUNCH',      'COMPLETED', '2025-09-22 10:00:00', '2025-10-01 00:00:00'),
('NPA-2026-006', 'MONITORING',  'IN_PROGRESS','2025-10-01 00:00:00', NULL);

-- NPA #7: Launched (monitoring active)
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-007', 'INITIATION',  'COMPLETED', '2025-08-01 07:30:00', '2025-08-01 08:00:00'),
('NPA-2026-007', 'REVIEW',      'COMPLETED', '2025-08-01 08:00:00', '2025-08-15 07:30:00'),
('NPA-2026-007', 'SIGN_OFF',    'COMPLETED', '2025-08-15 07:30:00', '2025-08-28 14:00:00'),
('NPA-2026-007', 'LAUNCH',      'COMPLETED', '2025-08-28 14:00:00', '2025-09-15 00:00:00'),
('NPA-2026-007', 'MONITORING',  'IN_PROGRESS','2025-09-15 00:00:00', NULL);

-- NPA #8: Blocked at Sign-Off
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at, blockers) VALUES
('NPA-2026-008', 'INITIATION',  'COMPLETED',   '2025-10-01 10:00:00', '2025-10-01 11:00:00', NULL),
('NPA-2026-008', 'REVIEW',      'COMPLETED',   '2025-10-01 11:00:00', '2025-10-15 10:00:00', NULL),
('NPA-2026-008', 'SIGN_OFF',    'BLOCKED',     '2025-10-15 10:00:00', NULL, '["RMG-Credit", "Finance", "Legal"]'),
('NPA-2026-008', 'LAUNCH',      'NOT_STARTED', NULL, NULL, NULL),
('NPA-2026-008', 'MONITORING',  'NOT_STARTED', NULL, NULL, NULL);

-- NPA #9-12: Simplified states
INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, completed_at) VALUES
('NPA-2026-009', 'INITIATION', 'COMPLETED',  '2026-01-05 14:00:00', '2026-01-05 15:00:00'),
('NPA-2026-009', 'REVIEW',     'IN_PROGRESS', '2026-01-05 15:00:00', NULL),
('NPA-2026-009', 'SIGN_OFF',   'NOT_STARTED', NULL, NULL),
('NPA-2026-009', 'LAUNCH',     'NOT_STARTED', NULL, NULL),
('NPA-2026-009', 'MONITORING', 'NOT_STARTED', NULL, NULL),
('NPA-2026-010', 'INITIATION', 'IN_PROGRESS', '2026-01-20 09:30:00', NULL),
('NPA-2026-010', 'REVIEW',     'NOT_STARTED', NULL, NULL),
('NPA-2026-010', 'SIGN_OFF',   'NOT_STARTED', NULL, NULL),
('NPA-2026-010', 'LAUNCH',     'NOT_STARTED', NULL, NULL),
('NPA-2026-010', 'MONITORING', 'NOT_STARTED', NULL, NULL),
('NPA-2026-011', 'INITIATION', 'COMPLETED',  '2026-01-25 11:00:00', '2026-01-25 11:10:00'),
('NPA-2026-011', 'REVIEW',     'COMPLETED',  '2026-01-25 11:10:00', '2026-01-25 12:00:00'),
('NPA-2026-011', 'SIGN_OFF',   'COMPLETED',  '2026-01-25 12:00:00', '2026-01-25 12:30:00'),
('NPA-2026-011', 'LAUNCH',     'NOT_STARTED', NULL, NULL),
('NPA-2026-011', 'MONITORING', 'NOT_STARTED', NULL, NULL),
('NPA-2026-012', 'INITIATION', 'COMPLETED',  '2026-02-01 15:00:00', '2026-02-01 15:01:00'),
('NPA-2026-012', 'REVIEW',     'NOT_STARTED', NULL, NULL),
('NPA-2026-012', 'SIGN_OFF',   'NOT_STARTED', NULL, NULL),
('NPA-2026-012', 'LAUNCH',     'NOT_STARTED', NULL, NULL),
('NPA-2026-012', 'MONITORING', 'NOT_STARTED', NULL, NULL);

-- ==========================================
-- FORM DATA (Key fields for top 5 NPAs)
-- ==========================================

-- NPA #1: Digital Asset Custody
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-001', 'product_name',       'Digital Asset Custody Service',        'MANUAL',   100.00, NULL),
('NPA-2026-001', 'product_type',       'Custody Services',                     'AUTO',     95.00, '{"source": "Classification Agent"}'),
('NPA-2026-001', 'desk',              'Singapore Digital Assets Desk',         'AUTO',     99.00, NULL),
('NPA-2026-001', 'business_unit',      'Digital Assets',                       'AUTO',     99.00, NULL),
('NPA-2026-001', 'notional_amount',    '50000000',                             'MANUAL',   100.00, NULL),
('NPA-2026-001', 'underlying_asset',   'Bitcoin, Ethereum, Stablecoins',       'MANUAL',   100.00, NULL),
('NPA-2026-001', 'tenor',             'Ongoing',                              'MANUAL',   100.00, NULL),
('NPA-2026-001', 'business_rationale', 'Growing institutional demand for digital asset custody in APAC. Expected $12.8M annual revenue.', 'ADAPTED', 85.00, '{"source": "KB Search", "adaptation_logic": "Enhanced from similar custody NPA"}'),
('NPA-2026-001', 'booking_system',     'Custom/In-House',                      'MANUAL',   100.00, NULL),
('NPA-2026-001', 'settlement_method',  'Net Settlement',                       'AUTO',     92.00, NULL),
('NPA-2026-001', 'market_risk',        'Operational risk from custody wallet infrastructure. VaR N/A for custody.', 'ADAPTED', 80.00, '{"source": "TSG1845"}'),
('NPA-2026-001', 'credit_risk',        'Counterparty default risk mitigated through cold storage segregation.', 'ADAPTED', 82.00, '{"source": "TSG1845"}'),
('NPA-2026-001', 'risk_classification','HIGH',                                 'AUTO',     98.00, NULL),
('NPA-2026-001', 'primary_regulation', 'MAS PS Act, HK SFC Type 1 License',   'MANUAL',   100.00, NULL),
('NPA-2026-001', 'sanctions_check',    'Clear - No Matches',                   'AUTO',     100.00, NULL);

-- NPA #2: FX Put Option
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-002', 'product_name',       'FX Put Option GBP/USD',                'AUTO',     98.00, '{"source": "Ideation Agent"}'),
('NPA-2026-002', 'product_type',       'FX Option',                            'AUTO',     99.00, '{"source": "Classification Agent"}'),
('NPA-2026-002', 'desk',              'Singapore FX Desk',                    'AUTO',     99.00, NULL),
('NPA-2026-002', 'business_unit',      'Treasury & Markets',                   'AUTO',     99.00, NULL),
('NPA-2026-002', 'notional_amount',    '75000000',                             'MANUAL',   100.00, NULL),
('NPA-2026-002', 'underlying_asset',   'GBP / USD',                            'AUTO',     99.00, NULL),
('NPA-2026-002', 'tenor',             '6 Months',                             'AUTO',     99.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'strike_price',       '1.2750',                               'ADAPTED',  92.00, '{"source": "TSG1917", "adaptation_logic": "Adjusted for current market levels"}'),
('NPA-2026-002', 'business_rationale', 'Corporate hedging client requires GBP/USD protection for upcoming CapEx program.', 'ADAPTED', 85.00, '{"source": "TSG1917", "adaptation_logic": "Adapted currency pair and client context"}'),
('NPA-2026-002', 'booking_system',     'Murex',                                'AUTO',     99.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'valuation_model',    'Black-Scholes',                        'AUTO',     99.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'settlement_method',  'Cash (USD)',                           'AUTO',     96.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'counterparty',       'Acme Corp (HK)',                       'MANUAL',   100.00, NULL),
('NPA-2026-002', 'counterparty_rating','A-',                                   'AUTO',     98.00, '{"source": "Bloomberg API"}'),
('NPA-2026-002', 'market_risk',        'VaR impact: $360K daily. Within standard FX option risk limits.', 'ADAPTED', 88.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'credit_risk',        'Counterparty A- rated. Collateral agreement in place.', 'ADAPTED', 90.00, '{"source": "TSG1917"}'),
('NPA-2026-002', 'roae_analysis',      'ROAE: 18.5% (above 15% threshold). Sensitivity: +/-2% for 10bp vol shift.', 'ADAPTED', 85.00, '{"source": "TSG1917", "adaptation_logic": "Adjusted for current rates and vol surface"}'),
('NPA-2026-002', 'risk_classification','MEDIUM',                               'AUTO',     95.00, NULL),
('NPA-2026-002', 'primary_regulation', 'MAS 656',                              'AUTO',     95.00, '{"source": "Policy Engine"}'),
('NPA-2026-002', 'sanctions_check',    'Clear - No Matches',                   'AUTO',     100.00, NULL),
('NPA-2026-002', 'booking_entity',     'MBS Bank Ltd, Singapore',              'AUTO',     99.00, '{"source": "TSG1917"}');

-- NPA #3: Green Bond ETF (selected fields)
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-003', 'product_name',       'Global Green Bond ETF',                'MANUAL',   100.00, NULL),
('NPA-2026-003', 'product_type',       'ETF',                                  'AUTO',     97.00, '{"source": "Classification Agent"}'),
('NPA-2026-003', 'business_unit',      'Wealth Management',                    'AUTO',     99.00, NULL),
('NPA-2026-003', 'notional_amount',    '120000000',                            'MANUAL',   100.00, NULL),
('NPA-2026-003', 'business_rationale', 'Growing demand for ESG-compliant investment products in APAC wealth segment.', 'MANUAL', 100.00, NULL),
('NPA-2026-003', 'risk_classification','HIGH',                                 'AUTO',     94.00, NULL);

-- NPA #4: Crypto Custody Prime (selected fields)
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-004', 'product_name',       'Crypto Custody Prime',                 'MANUAL',   100.00, NULL),
('NPA-2026-004', 'product_type',       'Custody Services',                     'AUTO',     96.00, NULL),
('NPA-2026-004', 'business_unit',      'Digital Assets',                       'AUTO',     99.00, NULL),
('NPA-2026-004', 'notional_amount',    '85000000',                             'MANUAL',   100.00, NULL),
('NPA-2026-004', 'risk_classification','HIGH',                                 'AUTO',     97.00, NULL),
('NPA-2026-004', 'tech_requirements',  'Thales Luna HSM with multi-sig 3-of-5 threshold. Cold storage infrastructure.',  'MANUAL', 100.00, NULL);

-- NPA #5: AI Wealth Advisory (selected fields)
INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score, metadata) VALUES
('NPA-2026-005', 'product_name',       'AI Wealth Advisory Platform',          'MANUAL',   100.00, NULL),
('NPA-2026-005', 'product_type',       'Advisory',                             'AUTO',     98.00, NULL),
('NPA-2026-005', 'business_unit',      'Wealth Management',                    'AUTO',     99.00, NULL),
('NPA-2026-005', 'notional_amount',    '15000000',                             'MANUAL',   100.00, NULL),
('NPA-2026-005', 'risk_classification','LOW',                                  'AUTO',     96.00, NULL),
('NPA-2026-005', 'tech_requirements',  'Claude API integration. Existing wealth platform UI.',  'MANUAL', 100.00, NULL);

-- ==========================================
-- AUDIT LOG (30 entries over 30 days)
-- ==========================================
INSERT INTO npa_audit_log (project_id, actor_name, actor_role, action_type, action_details, is_agent_action, agent_name, timestamp) VALUES
('NPA-2026-001', 'Sarah Jenkins',           'Maker',              'NPA_CREATED',            'Digital Asset Custody Expansion created via Product Ideation Agent.', FALSE, NULL, '2025-11-15 09:00:00'),
('NPA-2026-001', 'Classification Router',   'Agent',              'AGENT_CLASSIFIED',       'Classified as New-to-Group (confidence: 95%). Approval Track: FULL_NPA.', TRUE, 'Classification Router', '2025-11-15 09:05:00'),
('NPA-2026-001', 'Prohibited List Checker', 'Agent',              'PROHIBITED_CHECK',       'PASSED all 4 layers. No matches.', TRUE, 'Prohibited List Checker', '2025-11-15 09:06:00'),
('NPA-2026-001', 'Template Auto-Fill',      'Agent',              'TEMPLATE_AUTOFILL',      '15/60 fields auto-filled from historical NPAs.', TRUE, 'Template Auto-Fill', '2025-11-15 09:10:00'),
('NPA-2026-001', 'ML Prediction Agent',     'Agent',              'PREDICTION_GENERATED',   'Approval likelihood: 65%. Timeline: 14.5 days. Bottleneck: Legal.', TRUE, 'ML Prediction', '2025-11-15 09:12:00'),
('NPA-2026-001', 'David Chen',              'Checker',            'CHECKER_REVIEW',         'Checker reviewed and approved for sign-off routing.', FALSE, NULL, '2025-12-06 09:00:00'),
('NPA-2026-001', 'Jane Tan',                'Credit Approver',    'SIGNOFF_APPROVED',       'RMG-Credit sign-off approved.', FALSE, NULL, '2025-12-10 14:00:00'),
('NPA-2026-001', 'Conversational Diligence','Agent',              'AI_ANSWERED_QUERY',      'Answered Finance VP VaR question without maker loop-back.', TRUE, 'Conversational Diligence', '2025-12-09 14:02:00'),
('NPA-2026-002', 'Sarah Lim',              'Maker',              'NPA_CREATED',            'FX Put Option GBP/USD created.', FALSE, NULL, '2025-12-01 10:30:00'),
('NPA-2026-002', 'Classification Router',   'Agent',              'AGENT_CLASSIFIED',       'Classified as Variation (confidence: 92%). Track: NPA_LITE.', TRUE, 'Classification Router', '2025-12-01 10:35:00'),
('NPA-2026-002', 'Template Auto-Fill',      'Agent',              'TEMPLATE_AUTOFILL',      '47/60 fields auto-filled from TSG1917 (94% similarity).', TRUE, 'Template Auto-Fill', '2025-12-01 10:40:00'),
('NPA-2026-002', 'David Chen',              'Checker',            'CHECKER_REVIEW',         'All auto-filled fields verified. Ready for sign-offs.', FALSE, NULL, '2025-12-05 14:00:00'),
('NPA-2026-003', 'Sarah Jenkins',           'Maker',              'NPA_CREATED',            'Global Green Bond ETF created.', FALSE, NULL, '2025-11-01 08:00:00'),
('NPA-2026-004', 'Mike Ross',              'Maker',              'NPA_CREATED',            'Crypto Custody Prime created.', FALSE, NULL, '2025-12-20 11:00:00'),
('NPA-2026-005', 'Elena Torres',            'Maker',              'NPA_CREATED',            'AI Wealth Advisory Platform created.', FALSE, NULL, '2026-01-10 09:00:00'),
('NPA-2026-006', 'Amanda Lee',              'Maker',              'NPA_CREATED',            'Multi-Currency Deposit created.', FALSE, NULL, '2025-09-15 08:00:00'),
('NPA-2026-006', 'Approval Orchestrator',   'Agent',              'PRODUCT_LAUNCHED',       'Multi-Currency Deposit launched successfully.', TRUE, 'Approval Orchestrator', '2025-10-01 08:00:00'),
('NPA-2026-007', 'James Liu',              'Maker',              'NPA_CREATED',            'FX Accumulator USD/SGD created.', FALSE, NULL, '2025-08-01 07:30:00'),
('NPA-2026-007', 'Elena Torres',            'GFM COO',            'COO_APPROVED',           'Approved for launch. Monitor barrier performance.', FALSE, NULL, '2025-09-01 09:00:00'),
('NPA-2026-007', 'Approval Orchestrator',   'Agent',              'PRODUCT_LAUNCHED',       'FX Accumulator launched. Monitoring activated.', TRUE, 'Approval Orchestrator', '2025-09-15 00:00:00'),
('NPA-2026-008', 'Robert Tan',              'Maker',              'NPA_CREATED',            'ESG-Linked Trade Finance created.', FALSE, NULL, '2025-10-01 10:00:00'),
('NPA-2026-008', 'Approval Orchestrator',   'Agent',              'CIRCUIT_BREAKER',        'Circuit breaker triggered after 3 loop-backs. Escalated to Governance Forum.', TRUE, 'Approval Orchestrator', '2025-11-25 10:05:00'),
('NPA-2026-009', 'Elena Torres',            'Maker',              'NPA_CREATED',            'Algo FX Hedging Bot created.', FALSE, NULL, '2026-01-05 14:00:00'),
('NPA-2026-010', 'Sarah Jenkins',           'Maker',              'NPA_CREATED',            'Carbon Credit Exchange created.', FALSE, NULL, '2026-01-20 09:30:00'),
('NPA-2026-011', 'Jessica Wu',              'Maker',              'NPA_CREATED',            'Retail Wealth App Enhancement created.', FALSE, NULL, '2026-01-25 11:00:00'),
('NPA-2026-011', 'System',                  'Agent',              'EVERGREEN_AUTOAPPROVED', 'Auto-approved via Evergreen track in < 1 hour.', TRUE, 'Approval Orchestrator', '2026-01-25 12:30:00'),
('NPA-2026-012', 'Alex Rivera',             'Maker',              'NPA_CREATED',            'Leveraged Crypto CFD Product created.', FALSE, NULL, '2026-02-01 15:00:00'),
('NPA-2026-012', 'Prohibited List Checker', 'Agent',              'PROHIBITED_HARD_STOP',   'HARD STOP: Leveraged crypto CFDs for retail violate MAS SFA 04-N15 and MBS IP-2024-003.', TRUE, 'Prohibited List Checker', '2026-02-01 15:01:00'),
('NPA-2026-007', 'Monitoring Agent',        'Agent',              'BREACH_DETECTED',        'Volume threshold breach detected on FX Accumulator. Daily volume $192M vs $128M cap.', TRUE, 'Monitoring Agent', '2026-02-11 06:30:00'),
('NPA-2026-003', 'Monitoring Agent',        'Agent',              'BREACH_DETECTED',        'Counterparty rating downgrade detected. Moody''s downgraded from A- to BBB+.', TRUE, 'Monitoring Agent', '2026-02-10 18:00:00');
