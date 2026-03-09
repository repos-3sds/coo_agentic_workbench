-- 04_seed_users.sql
-- 15 users across Makers, Checkers, Approvers, and COO

INSERT INTO users (id, email, employee_id, full_name, display_name, department, job_title, location, role) VALUES
-- Makers (5)
('USR-001', 'sarah.lim@mbs.com',      'EMP-10001', 'Sarah Lim',       'Sarah L.',    'Treasury & Markets',     'Senior FX Trader',              'Singapore', 'MAKER'),
('USR-002', 'michael.chen@mbs.com',    'EMP-10002', 'Michael Chen',    'Michael C.',  'Digital Assets',         'VP Digital Products',           'Hong Kong', 'MAKER'),
('USR-003', 'james.liu@mbs.com',       'EMP-10003', 'James Liu',       'James L.',    'Institutional Banking',  'Director Trade Finance',        'Singapore', 'MAKER'),
('USR-004', 'jessica.wu@mbs.com',      'EMP-10004', 'Jessica Wu',      'Jessica W.',  'Wealth Management',      'AVP Investment Products',       'Singapore', 'MAKER'),
('USR-005', 'alex.rivera@mbs.com',     'EMP-10005', 'Alex Rivera',     'Alex R.',     'Treasury & Markets',     'Equities Desk Head',            'Singapore', 'MAKER'),

-- Checkers (2)
('USR-006', 'david.chen@mbs.com',      'EMP-10006', 'David Chen',      'David C.',    'Product Control',        'NPA Champion / Checker',        'Singapore', 'CHECKER'),
('USR-007', 'amanda.lee@mbs.com',      'EMP-10007', 'Amanda Lee',      'Amanda L.',   'Product Control',        'Senior NPA Reviewer',           'Singapore', 'CHECKER'),

-- Approvers (7)
('USR-008', 'jane.tan@mbs.com',        'EMP-10008', 'Jane Tan',        'Jane T.',     'RMG-Credit',             'Head of Credit Risk',           'Singapore', 'APPROVER'),
('USR-009', 'mark.lee@mbs.com',        'EMP-10009', 'Mark Lee',        'Mark L.',     'Finance',                'VP Product Control Finance',    'Singapore', 'APPROVER'),
('USR-010', 'robert.koh@mbs.com',      'EMP-10010', 'Robert Koh',      'Robert K.',   'Finance',                'Finance VP / Senior Controller', 'Singapore', 'APPROVER'),
('USR-011', 'lisa.wong@mbs.com',       'EMP-10011', 'Lisa Wong',       'Lisa W.',     'Legal & Compliance',     'Head of Product Legal',         'Hong Kong', 'APPROVER'),
('USR-012', 'ahmad.razak@mbs.com',     'EMP-10012', 'Ahmad Razak',     'Ahmad R.',    'MLR',                    'Money Laundering Reporting Officer', 'Singapore', 'APPROVER'),
('USR-013', 'kevin.patel@mbs.com',     'EMP-10013', 'Kevin Patel',     'Kevin P.',    'Operations',             'Head of Trade Operations',      'Singapore', 'APPROVER'),
('USR-014', 'rachel.ng@mbs.com',       'EMP-10014', 'Rachel Ng',       'Rachel N.',   'Technology',             'VP Technology Solutions',        'Singapore', 'APPROVER'),

-- COO (1)
('USR-015', 'elena.torres@mbs.com',    'EMP-10015', 'Elena Torres',    'Elena T.',    'COO Office',             'GFM Chief Operating Officer',   'Singapore', 'COO');
