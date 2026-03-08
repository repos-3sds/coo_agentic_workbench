-- DCE Account Opening — SA-2 Seed Data (reordered for FK constraints)
-- Source: DCE_AO_Seed_Data_SA2.sql
-- Fix: Move staged documents insert before OCR results that reference them

USE dce_agent;

-- --------------------------------------------------------------------------
-- 0. Additional staged documents for CASE 108 Attempt 2 resubmission
--    (Must come BEFORE OCR results that reference DOC-000029 to DOC-000032)
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    ('DOC-000029', 'AO-2026-000108', 8,
     'CLP_Electricity_Bill_Jan2026.pdf', 'application/pdf', 81920,
     'gridfs://ao-documents/dd29a0b1c2d3e4f5a6b7c8d9',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '29a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
     '2026-03-03 10:15:10', '2026-03-03 10:15:05'),

    ('DOC-000030', 'AO-2026-000108', 8,
     'Employment_Letter_LiMeiLing.pdf', 'application/pdf', 102400,
     'gridfs://ao-documents/ee30b1c2d3e4f5a6b7c8d9e0',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '30b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
     '2026-03-03 10:15:12', '2026-03-03 10:15:05'),

    ('DOC-000031', 'AO-2026-000108', 8,
     'Risk_Disclosure_Signed.pdf', 'application/pdf', 153600,
     'gridfs://ao-documents/ff31c2d3e4f5a6b7c8d9e0f1',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '31c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
     '2026-03-03 10:15:14', '2026-03-03 10:15:05'),

    ('DOC-000032', 'AO-2026-000108', 8,
     'GTA_v4.2_Signed_LiMeiLing.pdf', 'application/pdf', 409600,
     'gridfs://ao-documents/0032d3e4f5a6b7c8d9e0f1a2',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '32d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
     '2026-03-03 10:15:16', '2026-03-03 10:15:05');

-- --------------------------------------------------------------------------
-- 1. dce_ao_document_checklist
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_document_checklist
    (checklist_id, case_id, attempt_number, account_type, jurisdiction,
     entity_type, products_requested, checklist_version,
     mandatory_count, optional_count, regulatory_basis,
     generated_at, generated_by_model, kb_chunks_used)
VALUES
    (1, 'AO-2026-000101', 1,
     'INSTITUTIONAL_FUTURES', 'SGP', 'CORP',
     '["FUTURES","OPTIONS"]',
     'KB2-v3.1', 8, 3,
     'MAS Notice AML/CFT 01 Para 6; MAS Technology Risk Guidelines; Companies Act Cap 50',
     '2026-03-02 09:33:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-01","chunk-12","chunk-15"]}'),

    (2, 'AO-2026-000104', 1,
     'COMMODITIES_PHYSICAL', 'CHN', 'CORP',
     '["COMMODITIES_PHYSICAL","FUTURES"]',
     'KB2-v3.1', 10, 2,
     'MAS Notice AML/CFT 01; MAS Notice on Commodity Trading; PRC Foreign Investment Law compliance',
     '2026-03-02 11:04:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-01","chunk-19","chunk-28","chunk-42"]}'),

    (3, 'AO-2026-000105', 1,
     'MULTI_PRODUCT', 'SGP', 'FUND',
     '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
     'KB2-v3.1', 12, 4,
     'MAS SFA (Securities and Futures Act); MAS CIS Code; MAS Notice AML/CFT 01; Fund Management Guidelines',
     '2026-03-02 09:19:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-01","chunk-33","chunk-34","chunk-36","chunk-39"]}'),

    (4, 'AO-2026-000106', 1,
     'INSTITUTIONAL_FUTURES', 'HKG', 'FI',
     '["FUTURES","OPTIONS"]',
     'KB2-v3.1', 9, 3,
     'HKMA SPM AML/CFT; SFC Code of Conduct; SFC Licensing Requirements; Banking Ordinance',
     '2026-03-02 15:02:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-01","chunk-12","chunk-40","chunk-41"]}'),

    (5, 'AO-2026-000108', 1,
     'RETAIL_FUTURES', 'HKG', 'INDIVIDUAL',
     '["FUTURES"]',
     'KB2-v3.1', 6, 2,
     'HKMA SPM AML/CFT; SFC Suitability Requirements; Personal Data (Privacy) Ordinance',
     '2026-03-02 08:49:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-05","chunk-06","chunk-43"]}'),

    (6, 'AO-2026-000108', 2,
     'RETAIL_FUTURES', 'HKG', 'INDIVIDUAL',
     '["FUTURES"]',
     'KB2-v3.1', 6, 2,
     'HKMA SPM AML/CFT; SFC Suitability Requirements; Personal Data (Privacy) Ordinance',
     '2026-03-03 10:15:00', 'claude-sonnet-4-6',
     '{"KB-2":["chunk-05","chunk-06","chunk-43"]}');

-- --------------------------------------------------------------------------
-- 2. dce_ao_document_checklist_item
-- --------------------------------------------------------------------------

-- CASE 101: 8 mandatory + 3 optional = 11 items
INSERT INTO dce_ao_document_checklist_item
    (item_id, checklist_id, case_id, doc_type_code, doc_type_name,
     requirement, regulatory_ref, max_age_days, accepted_formats,
     matched_doc_id, match_status, match_confidence, notes)
VALUES
    (1,  1, 'AO-2026-000101', 'AO_FORM',           'Account Opening Application Form',     'MANDATORY', 'ABS Internal Policy',       NULL, '["PDF"]',      'DOC-000001', 'MATCHED', 0.980, NULL),
    (2,  1, 'AO-2026-000101', 'CERT_INCORP',       'Certificate of Incorporation',         'MANDATORY', 'Companies Act Cap 50',       NULL, '["PDF"]',      'DOC-000002', 'MATCHED', 0.920, 'Extracted from Corporate Profile'),
    (3,  1, 'AO-2026-000101', 'BOARD_RES',         'Board Resolution for AO',              'MANDATORY', 'ABS Internal Policy',        NULL, '["PDF"]',      'DOC-000002', 'MATCHED', 0.870, 'Found within Corporate Profile PDF'),
    (4,  1, 'AO-2026-000101', 'MEM_ARTICLES',      'Memorandum & Articles of Association',  'MANDATORY', 'Companies Act Cap 50',       NULL, '["PDF"]',      'DOC-000002', 'MATCHED', 0.850, 'Found within Corporate Profile PDF'),
    (5,  1, 'AO-2026-000101', 'UBO_DECLARATION',   'Ultimate Beneficial Owner Declaration', 'MANDATORY', 'MAS AML/CFT 01 Para 6.2',   NULL, '["PDF"]',      'DOC-000001', 'MATCHED', 0.910, 'Section in AO Form'),
    (6,  1, 'AO-2026-000101', 'ID_DIRECTORS',      'Directors ID Copies',                  'MANDATORY', 'MAS AML/CFT 01',            NULL, '["PDF","JPG"]','DOC-000002', 'MATCHED', 0.890, NULL),
    (7,  1, 'AO-2026-000101', 'GTA_SIGNED',        'General Terms Agreement (Signed)',      'MANDATORY', 'ABS Legal',                  NULL, '["PDF"]',      'DOC-000001', 'MATCHED', 0.950, 'GTA v4.2 detected'),
    (8,  1, 'AO-2026-000101', 'AUTH_SIGNATORY',    'Authorised Signatory List',            'MANDATORY', 'ABS Internal Policy',        NULL, '["PDF"]',      'DOC-000001', 'MATCHED', 0.940, 'Section in AO Form'),
    (9,  1, 'AO-2026-000101', 'FIN_STATEMENTS',    'Audited Financial Statements',         'OPTIONAL',  'Credit Assessment input',    365, '["PDF","XLSX"]', NULL,        'UNMATCHED', NULL, 'Not submitted -- optional for intake'),
    (10, 1, 'AO-2026-000101', 'TAX_CERT',          'Tax Residency Certificate',            'OPTIONAL',  'CRS Requirements',           365, '["PDF"]',      NULL,         'UNMATCHED', NULL, NULL),
    (11, 1, 'AO-2026-000101', 'ORG_CHART',         'Organisational Structure Chart',       'OPTIONAL',  'MAS AML/CFT 01',            NULL, '["PDF","PNG"]', NULL,        'UNMATCHED', NULL, NULL),

    -- CASE 108 Attempt 1: 6 mandatory + 2 optional = 8 items
    (12, 5, 'AO-2026-000108', 'AO_FORM_INDIV',     'Individual Account Opening Form',      'MANDATORY', 'ABS Internal Policy',        NULL, '["PDF"]',      'DOC-000022', 'MATCHED', 0.960, NULL),
    (13, 5, 'AO-2026-000108', 'HKID_COPY',         'Hong Kong ID Card Copy',               'MANDATORY', 'HKMA SPM AML/CFT',          NULL, '["PDF","JPG"]','DOC-000023', 'MATCHED', 0.990, NULL),
    (14, 5, 'AO-2026-000108', 'ADDR_PROOF',        'Proof of Address (< 3 months)',        'MANDATORY', 'HKMA SPM AML/CFT',           90, '["PDF","JPG"]', NULL,        'UNMATCHED', NULL, 'MISSING -- not submitted'),
    (15, 5, 'AO-2026-000108', 'INCOME_PROOF',      'Proof of Income / Employment Letter',  'MANDATORY', 'SFC Suitability',            180, '["PDF"]',      NULL,         'UNMATCHED', NULL, 'MISSING -- not submitted'),
    (16, 5, 'AO-2026-000108', 'RISK_DISCLOSURE',   'Risk Disclosure Acknowledgement',      'MANDATORY', 'SFC Code of Conduct',        NULL, '["PDF"]',      NULL,         'UNMATCHED', NULL, 'MISSING -- not submitted'),
    (17, 5, 'AO-2026-000108', 'GTA_SIGNED',        'General Terms Agreement (Signed)',      'MANDATORY', 'ABS Legal',                  NULL, '["PDF"]',      NULL,         'UNMATCHED', NULL, 'MISSING -- not submitted'),
    (18, 5, 'AO-2026-000108', 'BANK_REF',          'Bank Reference Letter',                'OPTIONAL',  'ABS Internal Policy',        180, '["PDF"]',      NULL,         'UNMATCHED', NULL, NULL),
    (19, 5, 'AO-2026-000108', 'INVEST_EXP_DECL',   'Investment Experience Declaration',    'OPTIONAL',  'SFC Suitability',            NULL, '["PDF"]',      NULL,         'UNMATCHED', NULL, NULL),

    -- CASE 108 Attempt 2: Same 8 items — now all mandatory matched
    (20, 6, 'AO-2026-000108', 'AO_FORM_INDIV',     'Individual Account Opening Form',      'MANDATORY', 'ABS Internal Policy',        NULL, '["PDF"]',      'DOC-000022', 'MATCHED', 0.960, NULL),
    (21, 6, 'AO-2026-000108', 'HKID_COPY',         'Hong Kong ID Card Copy',               'MANDATORY', 'HKMA SPM AML/CFT',          NULL, '["PDF","JPG"]','DOC-000023', 'MATCHED', 0.990, NULL),
    (22, 6, 'AO-2026-000108', 'ADDR_PROOF',        'Proof of Address (< 3 months)',        'MANDATORY', 'HKMA SPM AML/CFT',           90, '["PDF","JPG"]','DOC-000029', 'MATCHED', 0.940, 'Utility bill dated 2026-01-15'),
    (23, 6, 'AO-2026-000108', 'INCOME_PROOF',      'Proof of Income / Employment Letter',  'MANDATORY', 'SFC Suitability',            180, '["PDF"]',     'DOC-000030', 'MATCHED', 0.920, NULL),
    (24, 6, 'AO-2026-000108', 'RISK_DISCLOSURE',   'Risk Disclosure Acknowledgement',      'MANDATORY', 'SFC Code of Conduct',        NULL, '["PDF"]',     'DOC-000031', 'MATCHED', 0.970, NULL),
    (25, 6, 'AO-2026-000108', 'GTA_SIGNED',        'General Terms Agreement (Signed)',      'MANDATORY', 'ABS Legal',                  NULL, '["PDF"]',     'DOC-000032', 'MATCHED', 0.950, 'GTA v4.2 detected'),
    (26, 6, 'AO-2026-000108', 'BANK_REF',          'Bank Reference Letter',                'OPTIONAL',  'ABS Internal Policy',        180, '["PDF"]',      NULL,         'UNMATCHED', NULL, NULL),
    (27, 6, 'AO-2026-000108', 'INVEST_EXP_DECL',   'Investment Experience Declaration',    'OPTIONAL',  'SFC Suitability',            NULL, '["PDF"]',      NULL,         'UNMATCHED', NULL, NULL);

-- --------------------------------------------------------------------------
-- 3. dce_ao_document_ocr_result
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_document_ocr_result
    (ocr_id, doc_id, case_id, detected_doc_type, ocr_confidence,
     extracted_text, issuing_authority, issue_date, expiry_date,
     signatory_names, document_language, page_count,
     has_signatures, has_stamps, flagged_for_review,
     ocr_engine, processing_time_ms, processed_at)
VALUES
    -- CASE 101: 2 documents
    (1, 'DOC-000001', 'AO-2026-000101', 'AO_FORM', 0.960,
     'ABS BANK LTD\nACCOUNT OPENING APPLICATION FORM\n\nEntity Name: ABC Trading Pte Ltd\nUEN: 201012345A\nRegistered Address: 1 Raffles Place #30-01 One Raffles Place Singapore 048616\n\nAccount Type: Institutional Futures & Options\nProducts Requested: Exchange-Traded Futures, Listed Options\n\nUltimate Beneficial Owners:\n1. John Tan Wei Ming (55%)\n2. Sarah Lim (30%)\n\nAuthorised Signatories:\n1. John Tan Wei Ming - Director\n2. Sarah Lim - Director\n\nGENERAL TERMS AGREEMENT v4.2\nI/We have read and agree to the General Terms Agreement...\n\nSigned: [signature present]\nDate: 2026-03-01',
     'ABS Bank Ltd', '2026-03-01', NULL,
     '["John Tan Wei Ming","Sarah Lim"]', 'EN', 12,
     TRUE, TRUE, FALSE,
     'azure-document-intelligence-v4', 3200,
     '2026-03-02 09:33:30'),

    (2, 'DOC-000002', 'AO-2026-000101', 'CORPORATE_PROFILE', 0.930,
     'CORPORATE PROFILE\nABC Trading Pte Ltd\n\nCERTIFICATE OF INCORPORATION\nCompany Registration No: 201012345A\nDate of Incorporation: 15 June 2010\nIssued by: ACRA\n\nBOARD RESOLUTION\nResolved that the Company shall open an account with ABS Bank Ltd...\nResolved on: 28 February 2026\n\nMEMORANDUM AND ARTICLES OF ASSOCIATION\n[Full M&A text...]\n\nDIRECTORS:\n1. John Tan Wei Ming - Appointed 2010\n2. Sarah Lim - Appointed 2015\n3. Ahmad bin Hassan - Appointed 2020',
     'ACRA', '2010-06-15', NULL,
     '["John Tan Wei Ming","Sarah Lim","Ahmad bin Hassan"]', 'EN', 28,
     TRUE, TRUE, FALSE,
     'azure-document-intelligence-v4', 5800,
     '2026-03-02 09:33:45'),

    -- CASE 108 Attempt 1: 2 documents
    (3, 'DOC-000022', 'AO-2026-000108', 'AO_FORM_INDIV', 0.950,
     'ABS BANK LTD\nINDIVIDUAL ACCOUNT OPENING FORM\n\nFull Name: Li Mei Ling\nHKID: A1234567\nDate of Birth: 22 August 1985\nNationality: Hong Kong SAR\nResidential Address: Flat 12B, Tower 3, Taikoo Shing, Hong Kong\n\nAccount Type: Retail Futures\nProducts: Exchange-Traded Futures\n\nEmployment: Li & Partners Consulting Ltd\nAnnual Income: HKD 1,200,000\nNet Worth: HKD 8,000,000\nInvestment Experience: 5 years',
     'ABS Bank Ltd', '2026-03-01', NULL,
     '["Li Mei Ling"]', 'EN', 6,
     TRUE, FALSE, FALSE,
     'azure-document-intelligence-v4', 1800,
     '2026-03-02 08:49:30'),

    (4, 'DOC-000023', 'AO-2026-000108', 'HKID_COPY', 0.970,
     'HONG KONG IDENTITY CARD\nName: LI MEI LING\nHKID No: A123456(7)\nDate of Birth: 22-08-1985\nSex: F\nDate of Issue: 15-03-2020',
     'Immigration Department HKSAR', '2020-03-15', NULL,
     '["Li Mei Ling"]', 'EN', 1,
     FALSE, FALSE, FALSE,
     'azure-document-intelligence-v4', 800,
     '2026-03-02 08:49:35'),

    -- CASE 108 Attempt 2: 4 resubmitted documents
    (5, 'DOC-000029', 'AO-2026-000108', 'ADDR_PROOF', 0.910,
     'CLP POWER HONG KONG LIMITED\nELECTRICITY BILL\n\nAccount Holder: LI MEI LING\nService Address: Flat 12B, Tower 3, Taikoo Shing, Hong Kong\nBill Date: 15 January 2026\nBill Period: 15 Dec 2025 - 14 Jan 2026\nAmount Due: HKD 485.00',
     'CLP Power Hong Kong', '2026-01-15', NULL,
     '["Li Mei Ling"]', 'EN', 1,
     FALSE, FALSE, FALSE,
     'azure-document-intelligence-v4', 900,
     '2026-03-03 10:16:00'),

    (6, 'DOC-000030', 'AO-2026-000108', 'INCOME_PROOF', 0.880,
     'LI & PARTNERS CONSULTING LTD\nEMPLOYMENT CONFIRMATION LETTER\n\nTo Whom It May Concern,\n\nThis is to confirm that Ms. Li Mei Ling (HKID: A1234567) has been employed as Senior Consultant since 1 March 2019.\nCurrent Annual Salary: HKD 1,200,000\n\nIssued: 25 February 2026\nSigned: [signature]\nHR Director: Wong Ka Man',
     'Li & Partners Consulting Ltd', '2026-02-25', NULL,
     '["Li Mei Ling","Wong Ka Man"]', 'EN', 1,
     FALSE, TRUE, FALSE,
     'azure-document-intelligence-v4', 1100,
     '2026-03-03 10:16:10'),

    (7, 'DOC-000031', 'AO-2026-000108', 'RISK_DISCLOSURE', 0.940,
     'ABS BANK LTD\nRISK DISCLOSURE STATEMENT\nFUTURES TRADING\n\nI, Li Mei Ling, acknowledge that I have read and understood the risks associated with futures trading...\n\nSigned: [signature]\nDate: 2 March 2026',
     'ABS Bank Ltd', '2026-03-02', NULL,
     '["Li Mei Ling"]', 'EN', 3,
     TRUE, FALSE, FALSE,
     'azure-document-intelligence-v4', 1000,
     '2026-03-03 10:16:15'),

    (8, 'DOC-000032', 'AO-2026-000108', 'GTA_SIGNED', 0.920,
     'ABS BANK LTD\nGENERAL TERMS AGREEMENT\nVersion 4.2\n\nI, Li Mei Ling, have read and agree to the General Terms Agreement v4.2...\n\nSchedule 7A - Futures Trading Terms: SIGNED\n\nSigned: [signature]\nDate: 2 March 2026',
     'ABS Bank Ltd', '2026-03-02', NULL,
     '["Li Mei Ling"]', 'EN', 8,
     TRUE, FALSE, FALSE,
     'azure-document-intelligence-v4', 2200,
     '2026-03-03 10:16:20');

-- --------------------------------------------------------------------------
-- 4. dce_ao_document_review
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_document_review
    (review_id, doc_id, case_id, checklist_item_id, attempt_number,
     decision, decision_reason_code,
     rejection_reason, resubmission_instructions, regulatory_reference,
     validity_status, days_to_expiry, validity_notes,
     flagged_at, flag_status, reviewed_at, reviewed_by)
VALUES
    -- CASE 101: All ACCEPTED
    (1, 'DOC-000001', 'AO-2026-000101', 1, 1,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'AO Form dated 2026-03-01, within acceptable window',
     NULL, 'CLEARED', '2026-03-02 09:34:00', 'AGENT'),

    (2, 'DOC-000002', 'AO-2026-000101', 2, 1,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'Certificate of Incorporation -- no expiry, perpetual validity',
     NULL, 'CLEARED', '2026-03-02 09:34:05', 'AGENT'),

    -- CASE 108 Attempt 1: 2 ACCEPTED
    (3, 'DOC-000022', 'AO-2026-000108', 12, 1,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'Individual AO form dated 2026-03-01',
     NULL, 'CLEARED', '2026-03-02 08:50:00', 'AGENT'),

    (4, 'DOC-000023', 'AO-2026-000108', 13, 1,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'HKID issued 2020 -- valid, no expiry for HK permanent residents',
     NULL, 'CLEARED', '2026-03-02 08:50:05', 'AGENT'),

    -- CASE 108 Attempt 2: All 6 ACCEPTED
    (5, 'DOC-000022', 'AO-2026-000108', 20, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, NULL,
     NULL, 'CLEARED', '2026-03-03 10:17:00', 'AGENT'),

    (6, 'DOC-000023', 'AO-2026-000108', 21, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, NULL,
     NULL, 'CLEARED', '2026-03-03 10:17:02', 'AGENT'),

    (7, 'DOC-000029', 'AO-2026-000108', 22, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', 320, 'Utility bill dated 2026-01-15 -- 46 days old, within 90-day limit',
     NULL, 'CLEARED', '2026-03-03 10:17:05', 'AGENT'),

    (8, 'DOC-000030', 'AO-2026-000108', 23, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', 174, 'Employment letter dated 2026-02-25 -- 6 days old',
     NULL, 'CLEARED', '2026-03-03 10:17:08', 'AGENT'),

    (9, 'DOC-000031', 'AO-2026-000108', 24, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'Risk disclosure signed 2026-03-02 -- no expiry',
     NULL, 'CLEARED', '2026-03-03 10:17:10', 'AGENT'),

    (10, 'DOC-000032', 'AO-2026-000108', 25, 2,
     'ACCEPTED', NULL, NULL, NULL, NULL,
     'VALID', NULL, 'GTA v4.2 signed -- current version confirmed',
     NULL, 'CLEARED', '2026-03-03 10:17:12', 'AGENT');

-- --------------------------------------------------------------------------
-- 5. dce_ao_completeness_assessment
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_completeness_assessment
    (assessment_id, case_id, checklist_id, attempt_number,
     completeness_flag, mandatory_docs_complete, optional_docs_complete,
     total_mandatory, matched_mandatory, total_optional, matched_optional,
     coverage_pct, missing_mandatory, missing_optional,
     rejected_docs, rejection_reasons,
     next_node, decision_reasoning, retry_recommended, sla_pct_consumed,
     rm_chase_message, chase_sent_at,
     assessor_model, decision_model, assessed_at)
VALUES
    -- CASE 101: Complete -> N-2
    (1, 'AO-2026-000101', 1, 1,
     TRUE, TRUE, FALSE,
     8, 8, 3, 0,
     72.73, '[]', '["FIN_STATEMENTS","TAX_CERT","ORG_CHART"]',
     '[]', '{}',
     'N-2',
     'All 8 mandatory documents matched with high confidence. 3 optional documents not submitted but not blocking. SLA at 8% consumed. Proceeding to KYC/CDD Assessment.',
     FALSE, 8.50,
     NULL, NULL,
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-02 09:35:00'),

    -- CASE 104: Complete -> N-2
    (2, 'AO-2026-000104', 2, 1,
     TRUE, TRUE, FALSE,
     10, 10, 2, 0,
     83.33, '[]', '["TAX_CERT_CN","AUDIT_CERT"]',
     '[]', '{}',
     'N-2',
     'All 10 mandatory documents matched including Chinese business license with certified English translation. CHN jurisdiction additional requirements satisfied. Proceeding to KYC.',
     FALSE, 15.00,
     NULL, NULL,
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-02 11:06:00'),

    -- CASE 105: Complete -> N-2
    (3, 'AO-2026-000105', 3, 1,
     TRUE, TRUE, FALSE,
     12, 12, 4, 0,
     75.00, '[]', '["SIDE_LETTER","SEED_INVESTOR_CERT","COMPLIANCE_MANUAL","VALUATION_POLICY"]',
     '[]', '{}',
     'N-2',
     'All 12 mandatory documents matched. Fund prospectus, IMA, board resolution, audited accounts all present. Multi-product checklist fully satisfied. 4 optional fund governance docs not submitted.',
     FALSE, 3.50,
     NULL, NULL,
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-02 09:22:00'),

    -- CASE 106: Complete -> N-2
    (4, 'AO-2026-000106', 4, 1,
     TRUE, TRUE, FALSE,
     9, 9, 3, 0,
     75.00, '[]', '["PARENT_ANNUAL_REPORT","GROUP_ORG_CHART","COMPLIANCE_CERT"]',
     '[]', '{}',
     'N-2',
     'All 9 mandatory documents matched. SFC license copy and LEI certificate confirmed. FI-specific regulatory documents present. Proceeding to KYC.',
     FALSE, 6.25,
     NULL, NULL,
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-02 15:04:00'),

    -- CASE 108 Attempt 1: INCOMPLETE -> chase RM
    (5, 'AO-2026-000108', 5, 1,
     FALSE, FALSE, FALSE,
     6, 2, 2, 0,
     25.00,
     '["ADDR_PROOF","INCOME_PROOF","RISK_DISCLOSURE","GTA_SIGNED"]',
     '["BANK_REF","INVEST_EXP_DECL"]',
     '[]', '{}',
     'HITL_RM',
     'Only 2 of 6 mandatory documents submitted (AO Form and HKID). 4 mandatory documents missing: Proof of Address, Income Proof, Risk Disclosure, GTA. Retry recommended -- composing RM chase notification.',
     TRUE, 2.10,
     'Dear Annie,\n\nRegarding case AO-2026-000108 for client Li Mei Ling, the following mandatory documents are still required:\n\n1. Proof of Address -- Utility bill, bank statement, or government letter dated within the last 3 months\n2. Proof of Income -- Employment letter or tax assessment notice (within 6 months)\n3. Risk Disclosure Statement -- ABS futures trading risk disclosure form (must be signed by client)\n4. General Terms Agreement -- GTA v4.2 (must be signed by client)\n\nPlease submit these documents within 24 hours to meet the SLA deadline.\n\nRegards,\nDCE Document Processing',
     '2026-03-02 08:52:00',
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-02 08:51:00'),

    -- CASE 108 Attempt 2: COMPLETE -> N-2
    (6, 'AO-2026-000108', 6, 2,
     TRUE, TRUE, FALSE,
     6, 6, 2, 0,
     75.00, '[]', '["BANK_REF","INVEST_EXP_DECL"]',
     '[]', '{}',
     'N-2',
     'All 6 mandatory documents now matched after RM resubmission. Address proof (utility bill, 46 days old -- within 90-day limit), income proof, risk disclosure, and GTA all validated. Proceeding to KYC.',
     FALSE, 52.00,
     NULL, NULL,
     'claude-sonnet-4-6', 'claude-sonnet-4-6',
     '2026-03-03 10:18:00');

-- --------------------------------------------------------------------------
-- 6. dce_ao_gta_validation
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_gta_validation
    (validation_id, case_id, attempt_number,
     gta_version_submitted, gta_version_current, gta_version_match,
     applicable_schedules, schedules_submitted, schedules_missing,
     addenda_required, addenda_submitted, addenda_missing,
     gta_validation_status, validation_notes, kb_chunks_used, validated_at)
VALUES
    -- CASE 101: GTA v4.2 current
    (1, 'AO-2026-000101', 1,
     'GTA v4.2', 'GTA v4.2', TRUE,
     '["Schedule 7A - Futures","Schedule 7B - Options"]',
     '["Schedule 7A - Futures","Schedule 7B - Options"]',
     '[]',
     '["SGP Addendum"]', '["SGP Addendum"]', '[]',
     'CURRENT', 'GTA v4.2 is current. Both applicable schedules signed. SGP addendum present.',
     '{"KB-3":["chunk-01"],"KB-12":["chunk-04","chunk-05"]}',
     '2026-03-02 09:34:30'),

    -- CASE 108 Attempt 1: GTA missing
    (2, 'AO-2026-000108', 1,
     NULL, 'GTA v4.2', FALSE,
     '["Schedule 7A - Futures"]',
     '[]', '["Schedule 7A - Futures"]',
     '["HKG Addendum"]', '[]', '["HKG Addendum"]',
     'MISSING', 'GTA not submitted. Schedule 7A (Futures) and HKG Addendum both required.',
     '{"KB-3":["chunk-01"],"KB-12":["chunk-04","chunk-09"]}',
     '2026-03-02 08:50:30'),

    -- CASE 108 Attempt 2: GTA now valid
    (3, 'AO-2026-000108', 2,
     'GTA v4.2', 'GTA v4.2', TRUE,
     '["Schedule 7A - Futures"]',
     '["Schedule 7A - Futures"]',
     '[]',
     '["HKG Addendum"]', '["HKG Addendum"]', '[]',
     'CURRENT', 'GTA v4.2 is current. Schedule 7A signed. HKG Addendum present.',
     '{"KB-3":["chunk-01"],"KB-12":["chunk-04","chunk-09"]}',
     '2026-03-03 10:17:30');
