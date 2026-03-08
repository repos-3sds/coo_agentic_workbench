-- 06_seed_approvals.sql
-- Sign-offs, loop-backs, and comments for all 12 NPAs

-- ==========================================
-- SIGN-OFFS (~65 records across 12 NPAs)
-- ==========================================

-- NPA #1: Digital Asset Custody (At Risk - Legal stuck)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, clarification_question, clarification_answer, clarification_answered_by, loop_back_count, created_at) VALUES
('NPA-2026-001', 'RMG-Credit',       'RMG-Credit',       'APPROVED', 'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     '2025-12-10 14:00:00', '2025-12-12 09:00:00', FALSE, '2025-12-08 10:00:00', 'Credit framework approved. Counterparty limits set at $50M.', NULL, NULL, NULL, 0, '2025-12-06 09:00:00'),
('NPA-2026-001', 'Finance (PC)',      'Finance',          'APPROVED', 'USR-009', 'Mark Lee',     'mark.lee@mbs.com',     '2025-12-11 16:30:00', '2025-12-13 09:00:00', FALSE, '2025-12-09 11:00:00', 'ROAE meets threshold. Revenue projection validated.', 'What is the expected VaR impact?', 'Based on historical analysis, VaR impact is estimated at $360K daily.', 'AI', 0, '2025-12-06 09:00:00'),
('NPA-2026-001', 'Legal & Compliance','Legal & Compliance','REWORK',   'USR-011', 'Lisa Wong',    'lisa.wong@mbs.com',    '2025-12-15 10:00:00', '2025-12-14 09:00:00', TRUE,  '2025-12-12 14:00:00', 'Cross-border legal opinion for HK jurisdiction still pending from external counsel.', 'Has the external legal opinion for HK been commissioned?', NULL, NULL, 1, '2025-12-06 09:00:00'),
('NPA-2026-001', 'MLR',              'MLR',              'APPROVED', 'USR-012', 'Ahmad Razak',  'ahmad.razak@mbs.com',  '2025-12-09 11:00:00', '2025-12-11 09:00:00', FALSE, '2025-12-07 09:00:00', 'AML/KYC requirements mapped. No concerns.', NULL, NULL, NULL, 0, '2025-12-06 09:00:00'),
('NPA-2026-001', 'Operations',       'Operations',       'PENDING',  NULL,      NULL,           NULL,                   NULL,                  '2026-02-13 09:00:00', FALSE, NULL,                   NULL, NULL, NULL, NULL, 0, '2025-12-06 09:00:00'),
('NPA-2026-001', 'Technology',        'Technology',       'PENDING',  NULL,      NULL,           NULL,                   NULL,                  '2026-02-13 09:00:00', FALSE, NULL,                   NULL, NULL, NULL, NULL, 0, '2025-12-06 09:00:00');

-- NPA #2: FX Put Option (On Track - mostly approved)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, loop_back_count, created_at) VALUES
('NPA-2026-002', 'RMG-Credit',       'RMG-Credit',       'APPROVED',      'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     '2026-01-15 10:00:00', '2026-01-17 10:30:00', FALSE, '2026-01-13 08:00:00', 'Standard FX option risk within tolerance.', 0, '2026-01-12 10:30:00'),
('NPA-2026-002', 'Finance (PC)',      'Finance',          'UNDER_REVIEW',  'USR-009', 'Mark Lee',     'mark.lee@mbs.com',     NULL,                  '2026-02-14 10:30:00', FALSE, '2026-02-12 09:00:00', NULL, 0, '2026-01-12 10:30:00'),
('NPA-2026-002', 'Finance VP',        'Finance',          'PENDING',       NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2026-01-12 10:30:00'),
('NPA-2026-002', 'Operations',       'Operations',       'APPROVED',      'USR-013', 'Kevin Patel',  'kevin.patel@mbs.com',  '2026-01-16 15:00:00', '2026-01-18 10:30:00', FALSE, '2026-01-14 10:00:00', 'Standard booking flow. No operational concerns.', 0, '2026-01-12 10:30:00'),
('NPA-2026-002', 'Technology',        'Technology',       'APPROVED',      'USR-014', 'Rachel Ng',    'rachel.ng@mbs.com',    '2026-01-17 11:00:00', '2026-01-19 10:30:00', FALSE, '2026-01-15 14:00:00', 'Murex configuration verified. No build required.', 0, '2026-01-12 10:30:00'),
('NPA-2026-002', 'MLR',              'MLR',              'APPROVED',      'USR-012', 'Ahmad Razak',  'ahmad.razak@mbs.com',  '2026-01-14 09:00:00', '2026-01-16 10:30:00', FALSE, '2026-01-13 10:00:00', 'No AML concerns for standard FX product.', 0, '2026-01-12 10:30:00');

-- NPA #3: Green Bond ETF (In risk assessment, partial sign-offs)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, loop_back_count, created_at) VALUES
('NPA-2026-003', 'RMG-Credit',       'RMG-Credit',       'UNDER_REVIEW',  'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     NULL,                  '2026-02-14 08:00:00', FALSE, '2026-02-10 09:00:00', NULL, 0, '2025-12-15 08:00:00'),
('NPA-2026-003', 'Finance (PC)',      'Finance',          'PENDING',       NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-12-15 08:00:00'),
('NPA-2026-003', 'Finance VP',        'Finance',          'PENDING',       NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-12-15 08:00:00'),
('NPA-2026-003', 'Legal & Compliance','Legal & Compliance','PENDING',      NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-12-15 08:00:00'),
('NPA-2026-003', 'Operations',       'Operations',       'PENDING',       NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-12-15 08:00:00'),
('NPA-2026-003', 'Technology',        'Technology',       'PENDING',       NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-12-15 08:00:00');

-- NPA #4: Crypto Custody Prime (At Risk - tech blocker)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, clarification_question, clarification_answer, clarification_answered_by, loop_back_count, created_at) VALUES
('NPA-2026-004', 'RMG-Credit',       'RMG-Credit',       'APPROVED',             'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     '2026-01-20 14:00:00', '2026-01-22 11:00:00', FALSE, '2026-01-18 09:00:00', 'Credit limits approved with enhanced monitoring.', NULL, NULL, NULL, 0, '2026-01-15 11:00:00'),
('NPA-2026-004', 'Finance (PC)',      'Finance',          'APPROVED',             'USR-009', 'Mark Lee',     'mark.lee@mbs.com',     '2026-01-22 10:00:00', '2026-01-24 11:00:00', FALSE, '2026-01-19 14:00:00', 'Revenue model validated.', NULL, NULL, NULL, 0, '2026-01-15 11:00:00'),
('NPA-2026-004', 'Technology',        'Technology',       'CLARIFICATION_NEEDED', 'USR-014', 'Rachel Ng',    'rachel.ng@mbs.com',    NULL,                  '2026-02-12 11:00:00', FALSE, '2026-02-08 10:00:00', NULL, 'What is the cold storage architecture? Need details on HSM integration.', 'The architecture uses Thales Luna HSM with multi-sig 3-of-5 threshold. Full architecture doc attached.', 'MAKER', 1, '2026-01-15 11:00:00'),
('NPA-2026-004', 'Legal & Compliance','Legal & Compliance','UNDER_REVIEW',        'USR-011', 'Lisa Wong',    'lisa.wong@mbs.com',    NULL,                  '2026-02-14 11:00:00', FALSE, '2026-02-10 11:00:00', NULL, NULL, NULL, NULL, 0, '2026-01-15 11:00:00'),
('NPA-2026-004', 'Operations',       'Operations',       'PENDING',              NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, NULL, NULL, NULL, 0, '2026-01-15 11:00:00'),
('NPA-2026-004', 'MLR',              'MLR',              'PENDING',              NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, NULL, NULL, NULL, 0, '2026-01-15 11:00:00');

-- NPA #5: AI Wealth Advisory (Early stage, no sign-offs yet)
INSERT INTO npa_signoffs (project_id, party, department, status, loop_back_count, created_at) VALUES
('NPA-2026-005', 'RMG-Credit',  'RMG-Credit',  'PENDING', 0, '2026-01-20 09:00:00'),
('NPA-2026-005', 'Finance (PC)','Finance',      'PENDING', 0, '2026-01-20 09:00:00'),
('NPA-2026-005', 'Operations',  'Operations',   'PENDING', 0, '2026-01-20 09:00:00'),
('NPA-2026-005', 'Technology',   'Technology',   'PENDING', 0, '2026-01-20 09:00:00');

-- NPA #6: Multi-Currency Deposit (Launched - all approved)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, loop_back_count, created_at) VALUES
('NPA-2026-006', 'Business Head',     'Consumer Banking', 'APPROVED', 'USR-007', 'Amanda Lee',   'amanda.lee@mbs.com',   '2025-09-20 10:00:00', '2025-09-22 08:00:00', FALSE, '2025-09-18 08:00:00', 'Approved. Standard deposit enhancement.', 0, '2025-09-16 08:00:00'),
('NPA-2026-006', 'Group Product Head','Product Control',  'APPROVED', 'USR-006', 'David Chen',   'david.chen@mbs.com',   '2025-09-21 14:00:00', '2025-09-23 08:00:00', FALSE, '2025-09-19 09:00:00', 'Approved as Evergreen track.', 0, '2025-09-16 08:00:00');

-- NPA #7: FX Accumulator (Launched - all approved)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, loop_back_count, created_at) VALUES
('NPA-2026-007', 'RMG-Credit',       'RMG-Credit',       'APPROVED', 'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     '2025-08-20 10:00:00', '2025-08-22 07:30:00', FALSE, '2025-08-18 08:00:00', 'Accumulator risk limits established.', 0, '2025-08-15 07:30:00'),
('NPA-2026-007', 'Finance (PC)',      'Finance',          'APPROVED', 'USR-009', 'Mark Lee',     'mark.lee@mbs.com',     '2025-08-22 14:00:00', '2025-08-24 07:30:00', FALSE, '2025-08-19 10:00:00', 'Pricing model validated. ROAE within targets.', 0, '2025-08-15 07:30:00'),
('NPA-2026-007', 'Finance VP',        'Finance',          'APPROVED', 'USR-010', 'Robert Koh',   'robert.koh@mbs.com',   '2025-08-25 09:00:00', '2025-08-27 07:30:00', FALSE, '2025-08-23 11:00:00', 'Approved. Monitor knock-out barrier closely.', 0, '2025-08-15 07:30:00'),
('NPA-2026-007', 'Operations',       'Operations',       'APPROVED', 'USR-013', 'Kevin Patel',  'kevin.patel@mbs.com',  '2025-08-21 16:00:00', '2025-08-23 07:30:00', FALSE, '2025-08-19 14:00:00', 'Operational readiness confirmed.', 0, '2025-08-15 07:30:00'),
('NPA-2026-007', 'Technology',        'Technology',       'APPROVED', 'USR-014', 'Rachel Ng',    'rachel.ng@mbs.com',    '2025-08-22 11:00:00', '2025-08-24 07:30:00', FALSE, '2025-08-20 09:00:00', 'Murex booking flow configured and tested.', 0, '2025-08-15 07:30:00'),
('NPA-2026-007', 'MLR',              'MLR',              'APPROVED', 'USR-012', 'Ahmad Razak',  'ahmad.razak@mbs.com',  '2025-08-19 15:00:00', '2025-08-21 07:30:00', FALSE, '2025-08-17 10:00:00', 'No AML concerns.', 0, '2025-08-15 07:30:00');

-- NPA #8: ESG Trade Finance (Blocked - 3 loop-backs, circuit breaker)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, started_review_at, comments, loop_back_count, created_at) VALUES
('NPA-2026-008', 'RMG-Credit',       'RMG-Credit',       'REWORK',   'USR-008', 'Jane Tan',     'jane.tan@mbs.com',     '2025-11-15 10:00:00', '2025-11-10 10:00:00', TRUE,  '2025-11-05 09:00:00', 'ESG scoring methodology not aligned with MBS framework. Needs rework.', 3, '2025-10-15 10:00:00'),
('NPA-2026-008', 'Finance (PC)',      'Finance',          'REJECTED', 'USR-009', 'Mark Lee',     'mark.lee@mbs.com',     '2025-11-20 14:00:00', '2025-11-18 10:00:00', TRUE,  '2025-11-10 11:00:00', 'ROAE below minimum threshold. Revenue projections unrealistic.', 2, '2025-10-15 10:00:00'),
('NPA-2026-008', 'Legal & Compliance','Legal & Compliance','REWORK',  'USR-011', 'Lisa Wong',    'lisa.wong@mbs.com',    '2025-12-01 09:00:00', '2025-11-25 10:00:00', TRUE,  '2025-11-18 14:00:00', 'Vietnam legal framework insufficient. Need local counsel opinion.', 2, '2025-10-15 10:00:00'),
('NPA-2026-008', 'MLR',              'MLR',              'APPROVED', 'USR-012', 'Ahmad Razak',  'ahmad.razak@mbs.com',  '2025-10-25 11:00:00', '2025-10-27 10:00:00', FALSE, '2025-10-20 09:00:00', 'AML checks passed for all jurisdictions.', 0, '2025-10-15 10:00:00'),
('NPA-2026-008', 'Operations',       'Operations',       'PENDING',  NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-10-15 10:00:00'),
('NPA-2026-008', 'Technology',        'Technology',       'PENDING',  NULL,      NULL,           NULL,                   NULL,                  NULL,                  FALSE, NULL,                   NULL, 0, '2025-10-15 10:00:00');

-- NPA #9: Algo Trading Bot
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, sla_deadline, started_review_at, loop_back_count, created_at) VALUES
('NPA-2026-009', 'RMG-Credit',  'RMG-Credit',  'UNDER_REVIEW', 'USR-008', 'Jane Tan',    'jane.tan@mbs.com',    '2026-02-14 14:00:00', '2026-02-10 10:00:00', 0, '2026-02-01 14:00:00'),
('NPA-2026-009', 'Finance (PC)','Finance',      'PENDING',      NULL,      NULL,          NULL,                  NULL,                  NULL,                  0, '2026-02-01 14:00:00'),
('NPA-2026-009', 'Technology',   'Technology',   'PENDING',      NULL,      NULL,          NULL,                  NULL,                  NULL,                  0, '2026-02-01 14:00:00'),
('NPA-2026-009', 'Operations',  'Operations',   'PENDING',      NULL,      NULL,          NULL,                  NULL,                  NULL,                  0, '2026-02-01 14:00:00');

-- NPA #10: Carbon Credit Exchange (Discovery, no sign-offs active)
INSERT INTO npa_signoffs (project_id, party, department, status, loop_back_count, created_at) VALUES
('NPA-2026-010', 'RMG-Credit',        'RMG-Credit',        'PENDING', 0, '2026-02-01 09:30:00'),
('NPA-2026-010', 'Finance (PC)',       'Finance',           'PENDING', 0, '2026-02-01 09:30:00'),
('NPA-2026-010', 'Finance VP',         'Finance',           'PENDING', 0, '2026-02-01 09:30:00'),
('NPA-2026-010', 'Legal & Compliance', 'Legal & Compliance','PENDING', 0, '2026-02-01 09:30:00'),
('NPA-2026-010', 'Operations',        'Operations',        'PENDING', 0, '2026-02-01 09:30:00'),
('NPA-2026-010', 'Technology',         'Technology',        'PENDING', 0, '2026-02-01 09:30:00');

-- NPA #11: Retail Wealth App (Evergreen - auto-approved)
INSERT INTO npa_signoffs (project_id, party, department, status, approver_user_id, approver_name, approver_email, decision_date, sla_deadline, sla_breached, comments, loop_back_count, created_at) VALUES
('NPA-2026-011', 'Business Head',      'Consumer Banking', 'APPROVED', 'USR-004', 'Jessica Wu',   'jessica.wu@mbs.com',   '2026-01-25 11:30:00', '2026-01-27 11:00:00', FALSE, 'Auto-approved via Evergreen track.', 0, '2026-01-25 11:00:00'),
('NPA-2026-011', 'Group Product Head', 'Product Control',  'APPROVED', 'USR-006', 'David Chen',   'david.chen@mbs.com',   '2026-01-25 12:00:00', '2026-01-27 11:00:00', FALSE, 'Evergreen approval confirmed.', 0, '2026-01-25 11:00:00');

-- ==========================================
-- LOOP-BACKS (8 records)
-- ==========================================

-- NPA #1: 1 loop-back (Legal requesting external opinion)
INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, routing_reasoning, initiated_at, resolved_at, delay_days, resolution_type, resolution_details) VALUES
('NPA-2026-001', 1, 'APPROVAL_CLARIFICATION', 'Legal & Compliance', 'Lisa Wong', 'External legal opinion required for HK cross-border jurisdiction.', TRUE, 'MAKER', 'Requires procurement of external legal opinion - cannot be handled by AI.', '2025-12-15 10:00:00', NULL, NULL, NULL, NULL);

-- NPA #2: 1 loop-back (Finance VaR question, answered by AI)
INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, routing_reasoning, initiated_at, resolved_at, delay_days, resolution_type, resolution_details) VALUES
('NPA-2026-002', 1, 'APPROVAL_CLARIFICATION', 'Finance (PC)', 'Mark Lee', 'Need clarification on VaR impact assessment.', FALSE, 'AI', 'Question can be answered from existing NPA data and KB historical analysis.', '2026-01-18 09:00:00', '2026-01-18 09:05:00', 0.00, 'AI_ANSWERED', 'Conversational Diligence Agent provided VaR estimate of $360K based on similar NPA TSG1917.');

-- NPA #4: 1 loop-back (Tech requesting architecture details)
INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, routing_reasoning, initiated_at, resolved_at, delay_days, resolution_type, resolution_details) VALUES
('NPA-2026-004', 1, 'APPROVAL_CLARIFICATION', 'Technology', 'Rachel Ng', 'Cold storage HSM architecture details needed for security assessment.', TRUE, 'MAKER', 'Technical architecture documentation requires maker input.', '2026-02-08 10:00:00', '2026-02-09 16:00:00', 1.25, 'MAKER_FIXED', 'Maker provided Thales Luna HSM architecture document with multi-sig details.');

-- NPA #8: 3 loop-backs (Circuit breaker triggered!)
INSERT INTO npa_loop_backs (project_id, loop_back_number, loop_back_type, initiated_by_party, initiator_name, reason, requires_npa_changes, routed_to, routing_reasoning, initiated_at, resolved_at, delay_days, resolution_type, resolution_details) VALUES
('NPA-2026-008', 1, 'APPROVAL_CLARIFICATION', 'RMG-Credit', 'Jane Tan', 'ESG scoring methodology needs alignment with MBS Sustainability Framework.', TRUE, 'MAKER', 'Requires fundamental ESG methodology rework.', '2025-10-25 10:00:00', '2025-11-01 14:00:00', 7.00, 'MAKER_FIXED', 'Maker updated ESG scoring to align with MBS framework v3.2.'),
('NPA-2026-008', 2, 'APPROVAL_CLARIFICATION', 'Finance (PC)', 'Mark Lee', 'ROAE projections unrealistic. Revenue model needs revision.', TRUE, 'MAKER', 'Revenue model fundamentally flawed - requires maker correction.', '2025-11-10 09:00:00', '2025-11-18 16:00:00', 8.50, 'MAKER_FIXED', 'Maker revised revenue model with conservative assumptions.'),
('NPA-2026-008', 3, 'APPROVAL_CLARIFICATION', 'Legal & Compliance', 'Lisa Wong', 'Vietnam legal framework assessment inadequate. Local counsel engagement required.', TRUE, 'MAKER', 'Requires procurement of local legal counsel in Vietnam.', '2025-11-25 10:00:00', NULL, NULL, 'ESCALATED', 'Circuit breaker triggered after 3 loop-backs. Escalated to NPA Governance Forum.');

-- ==========================================
-- COMMENTS (25+ records)
-- ==========================================

-- NPA #1 comments
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, ai_agent, ai_confidence, created_at) VALUES
('NPA-2026-001', 'SYSTEM_ALERT',     'NPA classified as New-to-Group by Classification Router Agent. Confidence: 95%.', 'Classification Router', 'Agent', TRUE, 'Classification Router', 95.00, '2025-11-15 09:05:00'),
('NPA-2026-001', 'SYSTEM_ALERT',     'Prohibited List Check: PASSED. No matches found across 4 compliance layers.', 'Prohibited List Checker', 'Agent', TRUE, 'Prohibited List Checker', 100.00, '2025-11-15 09:06:00'),
('NPA-2026-001', 'APPROVER_QUESTION','What is the expected daily VaR impact of this custody service?', 'Mark Lee', 'Finance Approver', FALSE, NULL, NULL, '2025-12-09 14:00:00'),
('NPA-2026-001', 'AI_ANSWER',        'Based on analysis of similar custody services (TSG1845, TSG1792), the expected VaR impact is $360K daily under normal market conditions.', 'Conversational Diligence Agent', 'Agent', TRUE, 'Conversational Diligence', 88.00, '2025-12-09 14:02:00'),
('NPA-2026-001', 'APPROVER_QUESTION','Has the HK Securities and Futures Commission been consulted regarding custody license requirements?', 'Lisa Wong', 'Legal Approver', FALSE, NULL, NULL, '2025-12-12 14:30:00'),
('NPA-2026-001', 'MAKER_RESPONSE',   'We have engaged Baker McKenzie HK for the legal opinion. Expected delivery by end of January 2026.', 'Sarah Jenkins', 'Maker', FALSE, NULL, NULL, '2025-12-13 09:00:00');

-- NPA #2 comments
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, ai_agent, ai_confidence, created_at) VALUES
('NPA-2026-002', 'SYSTEM_ALERT',     'NPA classified as Variation by Classification Router Agent. Confidence: 92%. Approval Track: NPA Lite.', 'Classification Router', 'Agent', TRUE, 'Classification Router', 92.00, '2025-12-01 10:35:00'),
('NPA-2026-002', 'SYSTEM_ALERT',     'Template Auto-Fill completed: 47/60 fields populated (78%). Source: TSG1917 (94% similarity).', 'Template Auto-Fill Engine', 'Agent', TRUE, 'Template Auto-Fill', 94.00, '2025-12-01 10:40:00'),
('NPA-2026-002', 'SYSTEM_ALERT',     'ML Prediction: 78% approval likelihood. Predicted timeline: 4.2 days. Bottleneck: Finance.', 'ML Prediction Agent', 'Agent', TRUE, 'ML Prediction', 78.00, '2025-12-01 10:42:00'),
('NPA-2026-002', 'CHECKER_NOTE',     'All auto-filled fields verified. Manual fields completed by maker. Ready for sign-off routing.', 'David Chen', 'Checker', FALSE, NULL, NULL, '2025-12-05 14:00:00');

-- NPA #4 comments
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, ai_agent, ai_confidence, created_at) VALUES
('NPA-2026-004', 'APPROVER_QUESTION','What is the cold storage architecture? Need details on HSM integration for security assessment.', 'Rachel Ng', 'Technology Approver', FALSE, NULL, NULL, '2026-02-08 10:00:00'),
('NPA-2026-004', 'MAKER_RESPONSE',   'Architecture uses Thales Luna HSM with multi-sig 3-of-5 threshold. Full architecture document has been uploaded.', 'Mike Ross', 'Maker', FALSE, NULL, NULL, '2026-02-09 16:00:00');

-- NPA #8 comments (escalated)
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, ai_agent, ai_confidence, created_at) VALUES
('NPA-2026-008', 'SYSTEM_ALERT',     'WARNING: Circuit breaker triggered. 3 loop-backs detected. Escalating to NPA Governance Forum.', 'Approval Orchestrator', 'Agent', TRUE, 'Approval Orchestrator', 100.00, '2025-11-25 10:05:00'),
('NPA-2026-008', 'SYSTEM_ALERT',     'NPA Governance Forum convened. Review scheduled for 2025-12-05.', 'Approval Orchestrator', 'Agent', TRUE, 'Approval Orchestrator', 100.00, '2025-11-26 09:00:00'),
('NPA-2026-008', 'APPROVER_QUESTION','The ESG scoring methodology has been revised 3 times. What assurance do we have the latest version meets MBS framework requirements?', 'Jane Tan', 'Credit Approver', FALSE, NULL, NULL, '2025-11-15 10:00:00'),
('NPA-2026-008', 'MAKER_RESPONSE',   'We have engaged the Group Sustainability team to co-develop the methodology. Version 3.2 has been validated against MBS Sustainability Framework.', 'Robert Tan', 'Maker', FALSE, NULL, NULL, '2025-11-18 09:00:00');

-- NPA #6 comments (launched product)
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, created_at) VALUES
('NPA-2026-006', 'SYSTEM_ALERT',     'Product launched successfully on 2025-10-01. Auto-monitoring activated.', 'Approval Orchestrator', 'Agent', TRUE, '2025-10-01 08:00:00');

-- NPA #12 comments (prohibited)
INSERT INTO npa_comments (project_id, comment_type, comment_text, author_name, author_role, generated_by_ai, ai_agent, ai_confidence, created_at) VALUES
('NPA-2026-012', 'SYSTEM_ALERT',     'HARD STOP: Product flagged as PROHIBITED. Leveraged crypto CFDs for retail clients violate MAS Notice SFA 04-N15 and MBS Internal Policy IP-2024-003.', 'Prohibited List Checker', 'Agent', TRUE, 'Prohibited List Checker', 100.00, '2026-02-01 15:01:00'),
('NPA-2026-012', 'SYSTEM_ALERT',     'Prohibition layers matched: (1) Internal Policy - retail leverage crypto banned, (2) Regulatory - MAS SFA 04-N15 prohibits leveraged crypto for retail, (3) Sanctions - N/A, (4) Dynamic - current MAS advisory against crypto leverage products.', 'Prohibited List Checker', 'Agent', TRUE, 'Prohibited List Checker', 100.00, '2026-02-01 15:01:01');

-- NPA Approvals (top-level)
INSERT INTO npa_approvals (project_id, approval_type, approver_id, approver_role, decision, decision_date, comments, created_at) VALUES
('NPA-2026-006', 'CHECKER',  'USR-006', 'NPA Champion', 'APPROVE', '2025-09-22 10:00:00', 'Evergreen track approved.', '2025-09-22 10:00:00'),
('NPA-2026-007', 'CHECKER',  'USR-007', 'Senior Reviewer', 'APPROVE', '2025-08-28 14:00:00', 'All sign-offs received. Proceeding to launch.', '2025-08-28 14:00:00'),
('NPA-2026-007', 'GFM_COO',  'USR-015', 'GFM COO', 'APPROVE', '2025-09-01 09:00:00', 'Approved for launch. Monitor knock-out barrier performance.', '2025-09-01 09:00:00'),
('NPA-2026-011', 'CHECKER',  'USR-007', 'Senior Reviewer', 'APPROVE', '2026-01-25 12:30:00', 'Evergreen auto-approval confirmed.', '2026-01-25 12:30:00');
