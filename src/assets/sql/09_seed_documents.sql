-- 09_seed_documents.sql
-- 30+ documents across NPAs

-- NPA #1: Digital Asset Custody (6 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-001', 'Digital_Asset_Custody_Term_Sheet_v3.pdf',    'TERM_SHEET',     '2.4 MB',  'pdf',  'Product Specs',     'VALID',   'Sarah Jenkins', '2025-11-15 09:30:00'),
('NPA-2026-001', 'Custody_Credit_Risk_Assessment.pdf',          'CREDIT_REPORT',  '1.8 MB',  'pdf',  'Risk Analysis',     'VALID',   'Jane Tan',      '2025-12-08 10:00:00'),
('NPA-2026-001', 'ROAE_Model_Custody_v2.xlsx',                  'RISK_MEMO',      '856 KB',  'xlsx', 'Pricing Model',     'VALID',   'Mark Lee',      '2025-12-09 11:00:00'),
('NPA-2026-001', 'HK_Regulatory_Framework_Analysis.pdf',        'LEGAL_OPINION',  '3.1 MB',  'pdf',  'Regulatory',        'PENDING', 'Lisa Wong',     '2025-12-12 14:00:00'),
('NPA-2026-001', 'AML_KYC_Assessment_Custody.pdf',              'RISK_MEMO',      '1.2 MB',  'pdf',  'Risk Analysis',     'VALID',   'Ahmad Razak',   '2025-12-07 09:00:00'),
('NPA-2026-001', 'Custody_Technology_Architecture.pdf',          'TERM_SHEET',     '4.5 MB',  'pdf',  'Operational',       'VALID',   'Michael Chen',  '2025-11-20 14:00:00');

-- NPA #2: FX Put Option (5 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-002', 'FX_Put_Option_GBPUSD_Term_Sheet.pdf',   'TERM_SHEET',    '1.5 MB',  'pdf',  'Product Specs',   'VALID',   'Sarah Lim',    '2025-12-01 10:45:00'),
('NPA-2026-002', 'Black_Scholes_Pricing_Model.xlsx',       'RISK_MEMO',     '945 KB',  'xlsx', 'Pricing Model',   'VALID',   'Sarah Lim',    '2025-12-02 09:00:00'),
('NPA-2026-002', 'VaR_Impact_Analysis_FX_Option.pdf',      'RISK_MEMO',     '780 KB',  'pdf',  'Risk Analysis',   'VALID',   'Jane Tan',     '2026-01-13 08:30:00'),
('NPA-2026-002', 'Murex_Configuration_Checklist.pdf',      'TERM_SHEET',    '320 KB',  'pdf',  'Operational',     'VALID',   'Rachel Ng',    '2026-01-15 14:00:00'),
('NPA-2026-002', 'ISDA_Master_Agreement_Acme.pdf',         'ISDA',          '2.8 MB',  'pdf',  'Legal',           'VALID',   'David Chen',   '2025-12-05 14:00:00');

-- NPA #3: Green Bond ETF (4 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-003', 'Green_Bond_ETF_Prospectus_Draft.pdf',    'TERM_SHEET',    '5.2 MB',  'pdf',  'Product Specs',   'VALID',    'Sarah Jenkins', '2025-11-05 08:00:00'),
('NPA-2026-003', 'ESG_Compliance_Framework.pdf',           'LEGAL_OPINION', '2.1 MB',  'pdf',  'Regulatory',      'PENDING',  'Lisa Wong',     '2025-12-01 10:00:00'),
('NPA-2026-003', 'Bond_Index_Methodology.pdf',             'TERM_SHEET',    '1.8 MB',  'pdf',  'Product Specs',   'VALID',    'John Smith',    '2025-11-10 09:00:00'),
('NPA-2026-003', 'Revenue_Projection_Green_Bond.xlsx',     'RISK_MEMO',     '1.1 MB',  'xlsx', 'Pricing Model',   'WARNING',  'Mark Lee',      '2025-12-15 11:00:00');

-- NPA #4: Crypto Custody Prime (4 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-004', 'Crypto_Custody_Prime_Proposal.pdf',      'TERM_SHEET',    '3.8 MB',  'pdf',  'Product Specs',   'VALID',   'Mike Ross',     '2025-12-20 11:30:00'),
('NPA-2026-004', 'HSM_Architecture_Thales_Luna.pdf',       'TERM_SHEET',    '6.2 MB',  'pdf',  'Operational',     'VALID',   'Mike Ross',     '2026-02-09 16:00:00'),
('NPA-2026-004', 'DeFi_Integration_Risk_Assessment.pdf',   'RISK_MEMO',     '2.4 MB',  'pdf',  'Risk Analysis',   'PENDING', 'Jane Tan',      '2026-01-18 09:00:00'),
('NPA-2026-004', 'Digital_Asset_Regulatory_Review.pdf',    'LEGAL_OPINION', '1.9 MB',  'pdf',  'Regulatory',      'PENDING', 'Lisa Wong',     '2026-02-10 11:00:00');

-- NPA #7: FX Accumulator (3 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-007', 'FX_Accumulator_USDSGD_Term_Sheet.pdf',  'TERM_SHEET',    '1.9 MB',  'pdf',  'Product Specs',   'VALID',   'James Liu',     '2025-08-01 08:00:00'),
('NPA-2026-007', 'Barrier_Risk_Analysis.pdf',              'RISK_MEMO',     '1.4 MB',  'pdf',  'Risk Analysis',   'VALID',   'Jane Tan',      '2025-08-18 08:00:00'),
('NPA-2026-007', 'Accumulator_Pricing_Model.xlsx',         'RISK_MEMO',     '2.2 MB',  'xlsx', 'Pricing Model',   'VALID',   'Mark Lee',      '2025-08-19 10:00:00');

-- NPA #8: ESG Trade Finance (4 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-008', 'ESG_Trade_Finance_Proposal_v3.pdf',     'TERM_SHEET',     '4.1 MB',  'pdf',  'Product Specs',   'WARNING', 'Robert Tan',    '2025-10-01 10:00:00'),
('NPA-2026-008', 'ESG_Scoring_Methodology_v3.2.pdf',      'TERM_SHEET',     '2.8 MB',  'pdf',  'Product Specs',   'VALID',   'Robert Tan',    '2025-11-18 09:00:00'),
('NPA-2026-008', 'Vietnam_Legal_Framework_Gap.pdf',        'LEGAL_OPINION',  '1.5 MB',  'pdf',  'Regulatory',      'INVALID', 'Lisa Wong',     '2025-11-25 10:00:00'),
('NPA-2026-008', 'Revenue_Model_ESG_Revised.xlsx',         'RISK_MEMO',      '890 KB',  'xlsx', 'Pricing Model',   'WARNING', 'Mark Lee',      '2025-11-20 14:00:00');

-- NPA #10: Carbon Credit Exchange (2 docs)
INSERT INTO npa_documents (project_id, document_name, document_type, file_size, file_extension, category, validation_status, uploaded_by, uploaded_at) VALUES
('NPA-2026-010', 'Carbon_Credit_Platform_Concept.pdf',    'TERM_SHEET',    '3.5 MB',  'pdf',  'Product Specs',   'VALID',   'Sarah Jenkins', '2026-01-20 10:00:00'),
('NPA-2026-010', 'Blockchain_Settlement_Architecture.pdf', 'TERM_SHEET',    '5.8 MB',  'pdf',  'Operational',     'PENDING', 'Michael Chen',  '2026-01-25 14:00:00');
