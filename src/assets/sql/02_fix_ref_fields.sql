-- 02_fix_ref_fields.sql
-- Add all 10 NPA sections and 47 template fields to support full form data

-- ==========================================
-- Add missing sections to ref_npa_sections
-- ==========================================
INSERT IGNORE INTO ref_npa_sections (id, template_id, title, description, order_index) VALUES
('SEC_PROD',  'STD_NPA_V2', 'Product & Business Case', 'Core product definition and business rationale', 1),
('SEC_OPS',   'STD_NPA_V2', 'Operational & Technology', 'Booking, settlement, and technology requirements', 2),
('SEC_PRICE', 'STD_NPA_V2', 'Pricing Model', 'Pricing methodology and assumptions', 3),
('SEC_RISK',  'STD_NPA_V2', 'Risk Assessments', 'Market, credit, operational, and liquidity risks', 4),
('SEC_DATA',  'STD_NPA_V2', 'Data Management', 'Data privacy, retention, and reporting', 5),
('SEC_REG',   'STD_NPA_V2', 'Regulatory Requirements', 'Compliance and regulatory obligations', 6),
('SEC_ENTITY','STD_NPA_V2', 'Appendices (Entity & IP)', 'Entity structure and intellectual property', 7),
('SEC_SIGN',  'STD_NPA_V2', 'Sign-Off Matrix', 'Required approvals and sign-off parties', 8),
('SEC_LEGAL', 'STD_NPA_V2', 'Legal Considerations', 'Legal opinions and documentation requirements', 9),
('SEC_DOCS',  'STD_NPA_V2', 'Supporting Documents', 'Attached files and evidence', 10);

-- ==========================================
-- Add all 60+ fields to ref_npa_fields
-- ==========================================

-- Section 1: Product & Business Case (10 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_PROD_NAME',      'SEC_PROD', 'product_name',       'Product Name',              'text',     TRUE,  'Full product name as it will appear in systems', 1),
('FLD_PROD_TYPE',      'SEC_PROD', 'product_type',       'Product Type',              'select',   TRUE,  'Primary product classification', 2),
('FLD_DESK',           'SEC_PROD', 'desk',               'Desk',                      'text',     TRUE,  'Trading desk responsible for the product', 3),
('FLD_BIZ_UNIT',       'SEC_PROD', 'business_unit',      'Business Unit',             'select',   TRUE,  'Organizational business unit', 4),
('FLD_NOTIONAL',       'SEC_PROD', 'notional_amount',    'Notional Amount (USD)',      'decimal',  TRUE,  'Total notional value in USD equivalent', 5),
('FLD_UNDERLYING',     'SEC_PROD', 'underlying_asset',   'Underlying Asset',          'text',     TRUE,  'Underlying asset or reference', 6),
('FLD_TENOR',          'SEC_PROD', 'tenor',              'Tenor',                     'text',     TRUE,  'Product maturity or duration', 7),
('FLD_TRADE_DATE',     'SEC_PROD', 'trade_date',         'Trade Date',                'date',     FALSE, 'Expected first trade date', 8),
('FLD_RATIONALE',      'SEC_PROD', 'business_rationale', 'Business Rationale',        'text',     TRUE,  'Business justification for the product', 9),
('FLD_PAC_REF',        'SEC_PROD', 'pac_reference',      'PAC Approval Reference',    'text',     FALSE, 'PAC committee reference number if applicable', 10);

-- Section 2: Operational & Technology (6 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_BOOKING_SYS',    'SEC_OPS',  'booking_system',       'Booking System',            'select',  TRUE,  'Primary booking platform', 1),
('FLD_VAL_MODEL',      'SEC_OPS',  'valuation_model',      'Valuation Model',           'text',    TRUE,  'Pricing/valuation methodology', 2),
('FLD_SETTLEMENT',     'SEC_OPS',  'settlement_method',    'Settlement Method',         'select',  TRUE,  'Settlement type and currency', 3),
('FLD_CONFIRM',        'SEC_OPS',  'confirmation_process', 'Confirmation Process',      'text',    FALSE, 'Trade confirmation workflow', 4),
('FLD_RECON',          'SEC_OPS',  'reconciliation',       'Reconciliation',            'text',    FALSE, 'Reconciliation approach and frequency', 5),
('FLD_TECH_REQ',       'SEC_OPS',  'tech_requirements',    'Technology Requirements',   'text',    FALSE, 'Additional technology build requirements', 6);

-- Section 3: Pricing Model (4 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_PRICE_METHOD',   'SEC_PRICE','pricing_methodology',  'Pricing Methodology',       'text',    TRUE,  'How the product is priced', 1),
('FLD_ROAE',           'SEC_PRICE','roae_analysis',        'ROAE Sensitivity Analysis',  'text',    TRUE,  'Return on Average Equity analysis', 2),
('FLD_PRICE_ASSUME',   'SEC_PRICE','pricing_assumptions',  'Pricing Assumptions',        'text',    FALSE, 'Key assumptions underpinning the pricing', 3),
('FLD_BESPOKE_ADJ',    'SEC_PRICE','bespoke_adjustments',  'Bespoke Adjustments',        'text',    FALSE, 'Custom pricing adjustments if any', 4);

-- Section 4: Risk Assessments (5 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_MKT_RISK',       'SEC_RISK', 'market_risk',          'Market Risk (VaR)',          'text',    TRUE,  'Value at Risk and market risk assessment', 1),
('FLD_CREDIT_RISK',    'SEC_RISK', 'credit_risk',          'Credit Risk',                'text',    TRUE,  'Counterparty and credit risk assessment', 2),
('FLD_OPS_RISK',       'SEC_RISK', 'operational_risk',     'Operational Risk',           'text',    TRUE,  'Key operational risks identified', 3),
('FLD_LIQ_RISK',       'SEC_RISK', 'liquidity_risk',       'Liquidity Risk',             'text',    FALSE, 'Liquidity risk assessment', 4),
('FLD_REP_RISK',       'SEC_RISK', 'reputational_risk',    'Reputational Risk',          'text',    FALSE, 'Reputational risk considerations', 5);

-- Section 5: Data Management (3 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_DATA_PRIVACY',   'SEC_DATA', 'data_privacy',         'Data Privacy Requirements',  'text',    TRUE,  'GDPR/PDPA compliance requirements', 1),
('FLD_DATA_RETENTION', 'SEC_DATA', 'data_retention',       'Data Retention Policy',      'text',    FALSE, 'Data retention period and approach', 2),
('FLD_REPORTING',      'SEC_DATA', 'reporting_requirements','Reporting Requirements',     'text',    FALSE, 'Regulatory and internal reporting needs', 3);

-- Section 6: Regulatory Requirements (4 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_REG_PRIMARY',    'SEC_REG',  'primary_regulation',   'Primary Regulation',         'text',    TRUE,  'Primary regulatory framework (e.g. MAS 656)', 1),
('FLD_REG_SECONDARY',  'SEC_REG',  'secondary_regulations','Secondary Regulations',      'text',    FALSE, 'Additional applicable regulations', 2),
('FLD_REG_REPORTING',  'SEC_REG',  'regulatory_reporting', 'Regulatory Reporting',       'text',    FALSE, 'Required regulatory reports', 3),
('FLD_SANCTIONS',      'SEC_REG',  'sanctions_check',      'Sanctions Check',            'select',  TRUE,  'OFAC/UN/EU sanctions screening result', 4);

-- Section 7: Appendices - Entity & IP (5 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_BOOKING_ENTITY', 'SEC_ENTITY','booking_entity',      'Booking Entity',             'text',    TRUE,  'Legal entity for booking', 1),
('FLD_COUNTERPARTY',   'SEC_ENTITY','counterparty',        'Counterparty',               'text',    TRUE,  'Primary counterparty name', 2),
('FLD_CPTY_RATING',    'SEC_ENTITY','counterparty_rating', 'Counterparty Rating',        'select',  TRUE,  'Credit rating of counterparty', 3),
('FLD_STRIKE',         'SEC_ENTITY','strike_price',        'Strike Price',               'decimal', FALSE, 'Strike price if applicable', 4),
('FLD_IP_CONSIDER',    'SEC_ENTITY','ip_considerations',   'IP Considerations',          'text',    FALSE, 'Intellectual property considerations', 5);

-- Section 8: Sign-Off Matrix (2 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_REQ_SIGNOFFS',   'SEC_SIGN', 'required_signoffs',    'Required Sign-Offs',         'text',    TRUE,  'List of required approval parties', 1),
('FLD_SIGNOFF_ORDER',  'SEC_SIGN', 'signoff_order',        'Sign-Off Processing',        'select',  FALSE, 'Parallel or sequential processing', 2);

-- Section 9: Legal Considerations (3 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_LEGAL_OPINION',  'SEC_LEGAL','legal_opinion',        'External Legal Opinion',     'text',    FALSE, 'External legal opinion reference', 1),
('FLD_ISDA',           'SEC_LEGAL','isda_agreement',       'ISDA Agreement',             'text',    FALSE, 'ISDA master agreement details', 2),
('FLD_TAX_IMPACT',     'SEC_LEGAL','tax_impact',           'Tax Impact Assessment',      'text',    FALSE, 'Tax implications and assessment', 3);

-- Section 10: Supporting Documents (2 fields)
INSERT IGNORE INTO ref_npa_fields (id, section_id, field_key, label, field_type, is_required, tooltip, order_index) VALUES
('FLD_TERM_SHEET',     'SEC_DOCS', 'term_sheet',           'Term Sheet',                 'upload',  TRUE,  'Upload term sheet document', 1),
('FLD_SUPP_DOCS',      'SEC_DOCS', 'supporting_documents', 'Additional Documents',       'upload',  FALSE, 'Upload any supporting files', 2);

-- ==========================================
-- Add field options for select-type fields
-- ==========================================

-- Product Type options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_PROD_TYPE', 'FX_OPTION',        'FX Option',            1),
('FLD_PROD_TYPE', 'FX_FORWARD',       'FX Forward',           2),
('FLD_PROD_TYPE', 'SWAP',             'Interest Rate Swap',   3),
('FLD_PROD_TYPE', 'STRUCTURED',       'Structured Product',   4),
('FLD_PROD_TYPE', 'FIXED_INCOME',     'Fixed Income',         5),
('FLD_PROD_TYPE', 'DEPOSIT',          'Deposit',              6),
('FLD_PROD_TYPE', 'TRADE_FINANCE',    'Trade Finance',        7),
('FLD_PROD_TYPE', 'CUSTODY',          'Custody Services',     8),
('FLD_PROD_TYPE', 'ADVISORY',         'Advisory',             9),
('FLD_PROD_TYPE', 'ETF',              'ETF',                  10);

-- Business Unit options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_BIZ_UNIT', 'T_AND_M',          'Treasury & Markets',       1),
('FLD_BIZ_UNIT', 'WEALTH_MGMT',      'Wealth Management',        2),
('FLD_BIZ_UNIT', 'CORP_BANKING',     'Corporate Banking',        3),
('FLD_BIZ_UNIT', 'INST_BANKING',     'Institutional Banking',    4),
('FLD_BIZ_UNIT', 'CONSUMER',         'Consumer Banking',         5),
('FLD_BIZ_UNIT', 'DIGITAL_ASSETS',   'Digital Assets',           6);

-- Booking System options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_BOOKING_SYS', 'MUREX',     'Murex',             1),
('FLD_BOOKING_SYS', 'CALYPSO',   'Calypso',           2),
('FLD_BOOKING_SYS', 'SUMMIT',    'Summit',            3),
('FLD_BOOKING_SYS', 'FLEXCUBE',  'Flexcube',          4),
('FLD_BOOKING_SYS', 'CUSTOM',    'Custom/In-House',   5);

-- Settlement Method options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_SETTLEMENT', 'CASH_USD',     'Cash (USD)',           1),
('FLD_SETTLEMENT', 'CASH_SGD',     'Cash (SGD)',           2),
('FLD_SETTLEMENT', 'PHYSICAL',     'Physical Delivery',    3),
('FLD_SETTLEMENT', 'NET_SETTLE',   'Net Settlement',       4);

-- Counterparty Rating options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_CPTY_RATING', 'AAA',  'AAA', 1),
('FLD_CPTY_RATING', 'AA+',  'AA+', 2),
('FLD_CPTY_RATING', 'AA',   'AA',  3),
('FLD_CPTY_RATING', 'AA-',  'AA-', 4),
('FLD_CPTY_RATING', 'A+',   'A+',  5),
('FLD_CPTY_RATING', 'A',    'A',   6),
('FLD_CPTY_RATING', 'A-',   'A-',  7),
('FLD_CPTY_RATING', 'BBB+', 'BBB+',8),
('FLD_CPTY_RATING', 'BBB',  'BBB', 9),
('FLD_CPTY_RATING', 'BBB-', 'BBB-',10);

-- Sanctions Check options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_SANCTIONS', 'CLEAR',   'Clear - No Matches',     1),
('FLD_SANCTIONS', 'REVIEW',  'Under Review',            2),
('FLD_SANCTIONS', 'FLAGGED', 'Flagged - Manual Check',  3);

-- Sign-Off Processing options
INSERT IGNORE INTO ref_field_options (field_id, value, label, order_index) VALUES
('FLD_SIGNOFF_ORDER', 'PARALLEL',   'Parallel Processing',   1),
('FLD_SIGNOFF_ORDER', 'SEQUENTIAL', 'Sequential Processing', 2);
