-- ============================================================================
-- DCE Account Opening — Seed Data for SA-1 (Intake & Triage Agent)
-- ============================================================================
-- Version : 1.1.0
-- Date    : 2026-03-02
-- Database: MariaDB (ABS OpenShift)
-- Scope   : 10 test cases covering all account types, entity types,
--            jurisdictions, priorities, submission sources, and edge cases
-- Depends : DCE_AO_Table_Schemas.md (DDL must be executed first)
-- ============================================================================

-- Insertion order follows foreign key dependencies:
--   1. dce_ao_case_state           (no FK)
--   2. dce_ao_submission_raw       (FK → dce_ao_case_state)
--   3. dce_ao_classification_result(FK → dce_ao_case_state, dce_ao_submission_raw)
--   4. dce_ao_rm_hierarchy         (FK → dce_ao_case_state)
--   5. dce_ao_document_staged      (FK → dce_ao_case_state, dce_ao_submission_raw)
--   6. dce_ao_node_checkpoint      (FK → dce_ao_case_state)
--   7. dce_ao_event_log            (no FK, but logically depends on case)
--   8. dce_ao_notification_log     (FK → dce_ao_case_state)

-- ============================================================================
-- Test Case Coverage Matrix
-- ============================================================================
--
-- Case ID         | Account Type           | Entity  | Juris | Priority | Source | Status       | Edge Case
-- ----------------|------------------------|---------|-------|----------|--------|--------------|-----------------------------
-- AO-2026-000101  | INSTITUTIONAL_FUTURES  | CORP    | SGP   | URGENT   | EMAIL  | N-1 (done)   | Happy path, Platinum client
-- AO-2026-000102  | OTC_DERIVATIVES        | CORP    | HKG   | STANDARD | PORTAL | N-0 (in-prog)| Portal submission
-- AO-2026-000103  | RETAIL_FUTURES         | INDIV   | SGP   | DEFERRED | EMAIL  | N-0 (failed) | RM not found in HR
-- AO-2026-000104  | COMMODITIES_PHYSICAL   | CORP    | CHN   | URGENT   | EMAIL  | N-1 (done)   | China jurisdiction, dual product
-- AO-2026-000105  | MULTI_PRODUCT          | FUND    | SGP   | STANDARD | PORTAL | N-1 (done)   | Fund entity, multi-product
-- AO-2026-000106  | INSTITUTIONAL_FUTURES  | FI      | HKG   | URGENT   | API    | N-0 (done)   | Financial Institution, API sub
-- AO-2026-000107  | OTC_DERIVATIVES        | SPV     | SGP   | STANDARD | EMAIL  | N-0 (failed) | SPV entity, low confidence
-- AO-2026-000108  | RETAIL_FUTURES         | INDIV   | HKG   | DEFERRED | PORTAL | N-1 (done)   | HKG individual retail
-- AO-2026-000109  | COMMODITIES_PHYSICAL   | CORP    | OTHER | STANDARD | EMAIL  | N-0 (in-prog)| Non-standard jurisdiction
-- AO-2026-000110  | MULTI_PRODUCT          | CORP    | SGP   | URGENT   | PORTAL | N-0 (failed) | Duplicate submission blocked
--
-- Coverage:
--   Account Types : 5/5  (INSTITUTIONAL_FUTURES, RETAIL_FUTURES, OTC_DERIVATIVES, COMMODITIES_PHYSICAL, MULTI_PRODUCT)
--   Entity Types  : 5/5  (CORP, FUND, FI, SPV, INDIVIDUAL)
--   Jurisdictions : 4/4  (SGP, HKG, CHN, OTHER)
--   Priorities    : 3/3  (URGENT, STANDARD, DEFERRED)
--   Sources       : 3/3  (EMAIL, PORTAL, API)
--   Statuses      : 3/3  (COMPLETE, IN_PROGRESS, FAILED)
-- ============================================================================


-- --------------------------------------------------------------------------
-- 1. dce_ao_case_state
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts,
     case_type, priority, rm_id, client_name, jurisdiction, sla_deadline,
     created_at, updated_at, hitl_queue, event_count)
VALUES
    -- CASE 1: INSTITUTIONAL_FUTURES | CORP | SGP | URGENT | EMAIL | Happy path
    ('AO-2026-000101', 'ACTIVE', 'N-1',
     '["N-0"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'URGENT', 'RM-0042',
     'ABC Trading Pte Ltd', 'SGP',
     '2026-03-02 11:30:00',
     '2026-03-02 09:30:00', '2026-03-02 09:32:15', NULL, 4),

    -- CASE 2: OTC_DERIVATIVES | CORP | HKG | STANDARD | PORTAL | In progress
    ('AO-2026-000102', 'ACTIVE', 'N-0',
     '[]', '[]', '{}',
     'OTC_DERIVATIVES', 'STANDARD', 'RM-0118',
     'Global Commodities HK Ltd', 'HKG',
     '2026-03-04 14:00:00',
     '2026-03-02 14:00:00', '2026-03-02 14:00:00', NULL, 1),

    -- CASE 3: RETAIL_FUTURES | INDIVIDUAL | SGP | DEFERRED | EMAIL | Failed (RM not found)
    ('AO-2026-000103', 'ACTIVE', 'N-0',
     '[]',
     '[{"node":"N-0","reason":"RM not found in HR system"}]',
     '{"N-0":1}',
     'RETAIL_FUTURES', 'DEFERRED', 'RM-9999',
     'Tan Wei Ming', 'SGP',
     '2026-03-09 10:00:00',
     '2026-03-02 10:00:00', '2026-03-02 10:05:30', NULL, 2),

    -- CASE 4: COMMODITIES_PHYSICAL | CORP | CHN | URGENT | EMAIL | China jurisdiction
    ('AO-2026-000104', 'ACTIVE', 'N-1',
     '["N-0"]', '[]', '{}',
     'COMMODITIES_PHYSICAL', 'URGENT', 'RM-0067',
     'Shanghai Metals Import Export Co Ltd', 'CHN',
     '2026-03-02 13:00:00',
     '2026-03-02 11:00:00', '2026-03-02 11:03:40', NULL, 4),

    -- CASE 5: MULTI_PRODUCT | FUND | SGP | STANDARD | PORTAL | Fund entity
    ('AO-2026-000105', 'ACTIVE', 'N-1',
     '["N-0"]', '[]', '{}',
     'MULTI_PRODUCT', 'STANDARD', 'RM-0091',
     'Temasek Alpha Fund III', 'SGP',
     '2026-03-04 09:15:00',
     '2026-03-02 09:15:00', '2026-03-02 09:18:22', NULL, 4),

    -- CASE 6: INSTITUTIONAL_FUTURES | FI | HKG | URGENT | API | Financial Institution
    ('AO-2026-000106', 'ACTIVE', 'N-1',
     '["N-0"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'URGENT', 'RM-0155',
     'HSBC Securities Services (Asia) Ltd', 'HKG',
     '2026-03-02 17:00:00',
     '2026-03-02 15:00:00', '2026-03-02 15:01:55', NULL, 4),

    -- CASE 7: OTC_DERIVATIVES | SPV | SGP | STANDARD | EMAIL | Low confidence classification
    ('AO-2026-000107', 'ACTIVE', 'N-0',
     '[]',
     '[{"node":"N-0","reason":"Classification confidence 0.71 — below threshold for auto-proceed, flagged for RM confirmation"}]',
     '{"N-0":1}',
     'OTC_DERIVATIVES', 'STANDARD', 'RM-0033',
     'Pinnacle Structured Products SPV-1 Pte Ltd', 'SGP',
     '2026-03-04 16:30:00',
     '2026-03-02 16:30:00', '2026-03-02 16:34:10', NULL, 3),

    -- CASE 8: RETAIL_FUTURES | INDIVIDUAL | HKG | DEFERRED | PORTAL | HKG individual
    ('AO-2026-000108', 'ACTIVE', 'N-1',
     '["N-0"]', '[]', '{}',
     'RETAIL_FUTURES', 'DEFERRED', 'RM-0201',
     'Li Mei Ling', 'HKG',
     '2026-03-09 08:45:00',
     '2026-03-02 08:45:00', '2026-03-02 08:48:30', NULL, 4),

    -- CASE 9: COMMODITIES_PHYSICAL | CORP | OTHER (AUS) | STANDARD | EMAIL | Non-standard jurisdiction
    ('AO-2026-000109', 'ACTIVE', 'N-0',
     '[]', '[]', '{}',
     'COMMODITIES_PHYSICAL', 'STANDARD', 'RM-0078',
     'BHP Commodities Trading Pty Ltd', 'OTHER',
     '2026-03-04 12:20:00',
     '2026-03-02 12:20:00', '2026-03-02 12:20:00', NULL, 1),

    -- CASE 10: MULTI_PRODUCT | CORP | SGP | URGENT | PORTAL | Duplicate submission blocked
    ('AO-2026-000110', 'ACTIVE', 'N-0',
     '[]',
     '[{"node":"N-0","reason":"Duplicate submission detected — SHA256 hash matches existing submission for AO-2026-000101"}]',
     '{"N-0":1}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0042',
     'ABC Trading Pte Ltd', 'SGP',
     '2026-03-02 11:30:00',
     '2026-03-02 10:30:00', '2026-03-02 10:30:45', NULL, 2);


-- --------------------------------------------------------------------------
-- 2. dce_ao_submission_raw
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source,
     email_message_id, sender_email, email_subject, email_body_text,
     portal_form_id, portal_form_data,
     rm_employee_id, received_at, processed_at, processing_status,
     failure_reason, raw_payload_hash, attachments_count, created_at)
VALUES
    -- CASE 1: EMAIL | INSTITUTIONAL_FUTURES | CORP | SGP
    (1, 'AO-2026-000101', 'EMAIL',
     'AAMkAGE2NDYXMS00ZTK3LTQ3NTUtOWZhMy01YzEwMWIxZDhhNjI=',
     'rm.john@abs.com',
     'New DCE Account Opening - ABC Trading Pte Ltd',
     'Dear DCE Team,\n\nPlease initiate Account Opening for ABC Trading Pte Ltd.\nInstitutional futures account required.\n\nProducts: Futures, Options\nJurisdiction: Singapore\nClient Type: Corporate\nIncorporation: Singapore, 2010\nUEN: 201012345A\n\nAttached:\n1. AO_Form_Signed.pdf\n2. Corporate_Profile.pdf\n\nRegards,\nJohn Tan\nRM-0042',
     NULL, NULL,
     'RM-0042',
     '2026-03-02 09:30:00', '2026-03-02 09:30:45', 'PROCESSED',
     NULL,
     'f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a09',
     2, '2026-03-02 09:30:00'),

    -- CASE 2: PORTAL | OTC_DERIVATIVES | CORP | HKG
    (2, 'AO-2026-000102', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-007',
     '{"client_name":"Global Commodities HK Ltd","entity_type":"CORP","jurisdiction":"HKG","products":["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"contact_person":"David Wong","contact_email":"david.wong@globalcommodities.hk","registered_address":"88 Queensway, Admiralty, Hong Kong","incorporation_date":"2018-06-15","business_nature":"Commodities Trading","annual_revenue_usd":"50000000","expected_monthly_volume":"200"}',
     'RM-0118',
     '2026-03-02 14:00:00', NULL, 'PROCESSING',
     NULL,
     'a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192',
     3, '2026-03-02 14:00:00'),

    -- CASE 3: EMAIL | RETAIL_FUTURES | INDIVIDUAL | SGP | FAILED
    (3, NULL, 'EMAIL',
     'BBNkBHF3QWRXMS0xWTI4LTQ4NTUtOTNhNy02YzEyMzRlNWY3OGI=',
     'unknown@abs.com',
     'AO Request - Tan Wei Ming',
     'Dear DCE Team,\n\nPlease open a retail futures account for Tan Wei Ming.\nIndividual client, Singapore resident.\nNRIC: S8812345A\n\nProduct: Futures\n\nRegards,\nRM-9999',
     NULL, NULL,
     'RM-9999',
     '2026-03-02 10:00:00', '2026-03-02 10:05:30', 'FAILED',
     'RM-9999 not found in HR system — employee ID does not exist or is inactive',
     'd6e7f8a3b4c5091a2b3c4d5e6f7081920a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
     1, '2026-03-02 10:00:00'),

    -- CASE 4: EMAIL | COMMODITIES_PHYSICAL | CORP | CHN
    (4, 'AO-2026-000104', 'EMAIL',
     'CCPkCIF4RWSYMT0yWjM5LTU5NjYtOURiOC03ZDEzNDVmNmc5OGM=',
     'rm.liu@abs.com',
     'Urgent AO - Shanghai Metals Import Export Co Ltd - Commodities',
     'Dear DCE Team,\n\nURGENT: Please initiate AO for Shanghai Metals Import Export Co Ltd.\nCorporate entity registered in China (PRC).\nPrimary business: Physical commodities trading — base metals and precious metals.\n\nProducts: Commodities Physical, Futures (hedging)\nJurisdiction: China (booking via SGP branch)\nClient Tier: Gold\n\nAttached:\n1. AO_Form_CN.pdf\n2. Business_License_CN.pdf\n3. Financial_Statements_2024_CN.pdf\n4. Authorized_Signatory_List.pdf\n\nNote: All documents have certified English translations attached.\n\nRegards,\nLiu Wei\nRM-0067',
     NULL, NULL,
     'RM-0067',
     '2026-03-02 11:00:00', '2026-03-02 11:01:10', 'PROCESSED',
     NULL,
     '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
     4, '2026-03-02 11:00:00'),

    -- CASE 5: PORTAL | MULTI_PRODUCT | FUND | SGP
    (5, 'AO-2026-000105', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-012',
     '{"client_name":"Temasek Alpha Fund III","entity_type":"FUND","jurisdiction":"SGP","products":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"fund_manager":"Temasek Capital Management Pte Ltd","fund_type":"CLOSED_END","fund_domicile":"SGP","fund_size_usd":"500000000","fund_inception_date":"2025-01-15","investment_mandate":"Multi-asset absolute return","prime_broker":"Goldman Sachs","administrator":"State Street Fund Services","auditor":"KPMG","contact_person":"Rachel Ng","contact_email":"rachel.ng@temasek-cm.sg"}',
     'RM-0091',
     '2026-03-02 09:15:00', '2026-03-02 09:16:30', 'PROCESSED',
     NULL,
     '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
     6, '2026-03-02 09:15:00'),

    -- CASE 6: API | INSTITUTIONAL_FUTURES | FI | HKG
    (6, 'AO-2026-000106', 'API',
     NULL, NULL, NULL, NULL,
     NULL,
     '{"client_name":"HSBC Securities Services (Asia) Ltd","entity_type":"FI","jurisdiction":"HKG","products":["FUTURES","OPTIONS"],"lei":"5493006W5RWQLKGH1T16","fi_type":"BANK_SUBSIDIARY","parent_entity":"HSBC Holdings plc","regulatory_status":"SFC_Licensed","sfc_license_number":"AHI396","contact_person":"James Chen","contact_email":"james.chen@hsbc.com.hk","expected_monthly_volume":"5000","settlement_currency":["USD","HKD","CNH"]}',
     'RM-0155',
     '2026-03-02 15:00:00', '2026-03-02 15:00:35', 'PROCESSED',
     NULL,
     '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
     5, '2026-03-02 15:00:00'),

    -- CASE 7: EMAIL | OTC_DERIVATIVES | SPV | SGP | LOW CONFIDENCE
    (7, 'AO-2026-000107', 'EMAIL',
     'DDQkDJG5TXTYNT0zYUQ0LTY1NzctOUViOS04ZTI0NTZnN2g5OER=',
     'rm.kumar@abs.com',
     'AO Request - Pinnacle Structured Products SPV',
     'Hi DCE Team,\n\nNew account opening request for a structured products SPV.\nEntity: Pinnacle Structured Products SPV-1 Pte Ltd\nThis is a special purpose vehicle for structured OTC derivatives.\nNot entirely sure which account type applies — possibly OTC Derivatives?\n\nThe SPV was recently incorporated and documentation is still being finalised.\n\nAttached: Draft AO form (incomplete)\n\nRegards,\nKumar Patel\nRM-0033',
     NULL, NULL,
     'RM-0033',
     '2026-03-02 16:30:00', '2026-03-02 16:34:10', 'FAILED',
     'Classification confidence 0.71 — below auto-proceed threshold of 0.80. Flagged for RM confirmation.',
     '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
     1, '2026-03-02 16:30:00'),

    -- CASE 8: PORTAL | RETAIL_FUTURES | INDIVIDUAL | HKG
    (8, 'AO-2026-000108', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-003',
     '{"client_name":"Li Mei Ling","entity_type":"INDIVIDUAL","jurisdiction":"HKG","products":["FUTURES"],"id_type":"HKID","id_number":"A1234567","date_of_birth":"1985-08-22","nationality":"HKG","residential_address":"Flat 12B, Tower 3, Taikoo Shing, Hong Kong","employment_status":"EMPLOYED","employer":"Li & Partners Consulting Ltd","annual_income_hkd":"1200000","net_worth_hkd":"8000000","investment_experience_years":"5","risk_tolerance":"MODERATE"}',
     'RM-0201',
     '2026-03-02 08:45:00', '2026-03-02 08:46:20', 'PROCESSED',
     NULL,
     '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
     2, '2026-03-02 08:45:00'),

    -- CASE 9: EMAIL | COMMODITIES_PHYSICAL | CORP | OTHER (AUS) | IN PROGRESS
    (9, 'AO-2026-000109', 'EMAIL',
     'EERkEKH6UYUZOU0zYkU1LTc2ODgtOUZjMC05ZjM1NjdoOGk5OEU=',
     'rm.anderson@abs.com',
     'New AO - BHP Commodities Trading - Australia',
     'Dear DCE Team,\n\nPlease initiate account opening for BHP Commodities Trading Pty Ltd.\nAustralian corporate entity.\nPrimary business: Physical commodities — iron ore, coal, copper.\n\nProducts: Commodities Physical\nJurisdiction: Australia (booking via SGP)\nABN: 49 004 028 077\n\nNote: Client is subsidiary of BHP Group Limited (ASX-listed).\nWill need to check if OTHER jurisdiction requires additional regulatory steps.\n\nAttached:\n1. AO_Form_AUS.pdf\n2. ASIC_Certificate.pdf\n3. Annual_Report_2025.pdf\n\nRegards,\nMark Anderson\nRM-0078',
     NULL, NULL,
     'RM-0078',
     '2026-03-02 12:20:00', NULL, 'PROCESSING',
     NULL,
     '6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
     3, '2026-03-02 12:20:00'),

    -- CASE 10: PORTAL | MULTI_PRODUCT | CORP | SGP | Duplicate blocked
    (10, 'AO-2026-000110', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-019',
     '{"client_name":"ABC Trading Pte Ltd","entity_type":"CORP","jurisdiction":"SGP","products":["FUTURES","OPTIONS","OTC_DERIVATIVES"],"contact_person":"John Tan","contact_email":"rm.john@abs.com"}',
     'RM-0042',
     '2026-03-02 10:30:00', '2026-03-02 10:30:45', 'FAILED',
     'Duplicate submission detected — client name + RM ID matches active case AO-2026-000101. SHA256 content similarity exceeds 85% threshold.',
     'f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a09',
     2, '2026-03-02 10:30:00');


-- --------------------------------------------------------------------------
-- 3. dce_ao_classification_result
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_classification_result
    (classification_id, case_id, submission_id,
     account_type, account_type_confidence, account_type_reasoning,
     client_name, client_entity_type, jurisdiction, products_requested,
     priority, priority_reason, sla_deadline,
     classifier_model, priority_model, kb_chunks_used,
     classified_at, flagged_for_review)
VALUES
    -- CASE 1: INSTITUTIONAL_FUTURES | CORP | SGP | HIGH confidence
    (1, 'AO-2026-000101', 1,
     'INSTITUTIONAL_FUTURES', 0.940,
     'Email explicitly mentions institutional futures trading. Corporate entity (Pte Ltd suffix). Singapore domiciled. AO form confirms futures + options products. KB-1 chunk-14 matches INSTITUTIONAL_FUTURES criteria: corporate entity + futures + options combination.',
     'ABC Trading Pte Ltd', 'CORP', 'SGP',
     '["FUTURES","OPTIONS"]',
     'URGENT',
     'Client tier: Platinum (existing ABS relationship). RM flagged urgency in email. Regulatory deadline for MAS reporting approaching end of quarter.',
     '2026-03-02 11:30:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-14","chunk-22"],"KB-9":["chunk-03"]}',
     '2026-03-02 09:31:05', FALSE),

    -- CASE 2: OTC_DERIVATIVES | CORP | HKG
    (2, 'AO-2026-000102', 2,
     'OTC_DERIVATIVES', 0.880,
     'Portal form explicitly selects OTC Derivatives as primary product. Secondary product: Commodities Physical. Corporate entity registered in Hong Kong. KB-1 chunk-08 confirms OTC_DERIVATIVES classification for corporate entities with derivatives + commodities combination.',
     'Global Commodities HK Ltd', 'CORP', 'HKG',
     '["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
     'STANDARD',
     'Standard client tier (new relationship). No urgency flags set in portal form. Normal SLA applies per KB-9 chunk-01.',
     '2026-03-04 14:00:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-08","chunk-31"],"KB-9":["chunk-01"]}',
     '2026-03-02 14:01:20', FALSE),

    -- CASE 3: RETAIL_FUTURES | INDIVIDUAL | SGP | LOW confidence (flagged)
    (3, 'AO-2026-000103', 3,
     'RETAIL_FUTURES', 0.720,
     'Email indicates individual retail client seeking futures trading. Limited product detail — only mentions "Futures" without specifying contract types. No AO form attached for confirmation. KB-1 chunk-05 partial match: individual + futures = RETAIL_FUTURES but confidence reduced due to missing form data.',
     'Tan Wei Ming', 'INDIVIDUAL', 'SGP',
     '["FUTURES"]',
     'DEFERRED',
     'Individual retail client. No urgency indicators in email. Single product request. KB-9 chunk-02: individual retail + no urgency = DEFERRED.',
     '2026-03-09 10:00:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-05"],"KB-9":["chunk-02"]}',
     '2026-03-02 10:02:00', TRUE),

    -- CASE 4: COMMODITIES_PHYSICAL | CORP | CHN | HIGH confidence
    (4, 'AO-2026-000104', 4,
     'COMMODITIES_PHYSICAL', 0.910,
     'Email specifies physical commodities trading — base metals and precious metals. Chinese corporate entity. Futures requested as hedging instrument (secondary). KB-1 chunk-19 confirms COMMODITIES_PHYSICAL when primary business is physical trading even with futures hedging component.',
     'Shanghai Metals Import Export Co Ltd', 'CORP', 'CHN',
     '["COMMODITIES_PHYSICAL","FUTURES"]',
     'URGENT',
     'RM explicitly marked URGENT in subject line. Gold tier client. China jurisdiction requires additional regulatory checks which add processing time — urgency justified.',
     '2026-03-02 13:00:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-19","chunk-27"],"KB-9":["chunk-03","chunk-07"]}',
     '2026-03-02 11:01:40', FALSE),

    -- CASE 5: MULTI_PRODUCT | FUND | SGP | HIGH confidence
    (5, 'AO-2026-000105', 5,
     'MULTI_PRODUCT', 0.960,
     'Portal form lists three product types: Futures, OTC Derivatives, Commodities Physical. Fund entity (closed-end, $500M AUM). Multi-asset absolute return mandate requires all three product types. KB-1 chunk-33 confirms MULTI_PRODUCT classification when 3+ product types selected by fund entities.',
     'Temasek Alpha Fund III', 'FUND', 'SGP',
     '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
     'STANDARD',
     'New fund relationship. Standard onboarding timeline. No urgency flags despite large AUM. KB-9 chunk-01: new relationship + no urgency = STANDARD.',
     '2026-03-04 09:15:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-33","chunk-34","chunk-35"],"KB-9":["chunk-01"]}',
     '2026-03-02 09:16:00', FALSE),

    -- CASE 6: INSTITUTIONAL_FUTURES | FI | HKG | HIGH confidence
    (6, 'AO-2026-000106', 6,
     'INSTITUTIONAL_FUTURES', 0.970,
     'API submission from SFC-licensed financial institution. HSBC subsidiary with active LEI. Products: Futures + Options — institutional-grade. KB-1 chunk-14 + chunk-40 confirm INSTITUTIONAL_FUTURES for FI entities with futures/options. FI classification carries additional regulatory requirements per KB-1 chunk-41.',
     'HSBC Securities Services (Asia) Ltd', 'FI', 'HKG',
     '["FUTURES","OPTIONS"]',
     'URGENT',
     'Financial institution client. FI onboarding has stricter SLA per HKMA guidelines. RM flagged urgency due to pending SFC deadline for client reporting.',
     '2026-03-02 17:00:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-14","chunk-40","chunk-41"],"KB-9":["chunk-03","chunk-08"]}',
     '2026-03-02 15:00:20', FALSE),

    -- CASE 7: OTC_DERIVATIVES | SPV | SGP | LOW confidence (flagged)
    (7, 'AO-2026-000107', 7,
     'OTC_DERIVATIVES', 0.710,
     'Email mentions structured OTC derivatives SPV. RM unsure of classification. SPV recently incorporated — limited documentation. KB-1 chunk-08 partial match for OTC_DERIVATIVES but SPV entities often require MULTI_PRODUCT if underlying structure spans multiple asset classes. Insufficient data to confirm — flagged for RM review.',
     'Pinnacle Structured Products SPV-1 Pte Ltd', 'SPV', 'SGP',
     '["OTC_DERIVATIVES"]',
     'STANDARD',
     'New SPV entity. Standard processing. No urgency flags.',
     '2026-03-04 16:30:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-08","chunk-38"],"KB-9":["chunk-01"]}',
     '2026-03-02 16:32:15', TRUE),

    -- CASE 8: RETAIL_FUTURES | INDIVIDUAL | HKG | HIGH confidence
    (8, 'AO-2026-000108', 8,
     'RETAIL_FUTURES', 0.890,
     'Portal form clearly identifies individual client in HKG. Single product: Futures. HKID provided. Employment and income details confirm retail classification. KB-1 chunk-05 full match: individual + single futures product + HKG jurisdiction = RETAIL_FUTURES.',
     'Li Mei Ling', 'INDIVIDUAL', 'HKG',
     '["FUTURES"]',
     'DEFERRED',
     'Individual retail client. Moderate risk tolerance. No urgency indicators. KB-9 chunk-02: individual retail = DEFERRED unless RM flags urgency.',
     '2026-03-09 08:45:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-05","chunk-06"],"KB-9":["chunk-02"]}',
     '2026-03-02 08:46:00', FALSE),

    -- CASE 9: COMMODITIES_PHYSICAL | CORP | OTHER
    (9, 'AO-2026-000109', 9,
     'COMMODITIES_PHYSICAL', 0.850,
     'Email specifies physical commodities — iron ore, coal, copper. Large Australian corporate (BHP subsidiary). ASX-listed parent. KB-1 chunk-19 matches COMMODITIES_PHYSICAL. Jurisdiction OTHER (Australia) may require additional regulatory review per KB-1 chunk-45.',
     'BHP Commodities Trading Pty Ltd', 'CORP', 'OTHER',
     '["COMMODITIES_PHYSICAL"]',
     'STANDARD',
     'Large corporate but new ABS relationship. No urgency flags. OTHER jurisdiction adds complexity but not urgency.',
     '2026-03-04 12:20:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-19","chunk-45"],"KB-9":["chunk-01","chunk-09"]}',
     '2026-03-02 12:21:30', FALSE),

    -- CASE 10: MULTI_PRODUCT | CORP | SGP (duplicate — classified before block)
    (10, 'AO-2026-000110', 10,
     'MULTI_PRODUCT', 0.830,
     'Portal form lists Futures + Options + OTC Derivatives — qualifies as MULTI_PRODUCT per KB-1 chunk-33. However, client name and RM ID match active case AO-2026-000101 — likely duplicate submission. Classification completed but case flagged for dedup review.',
     'ABC Trading Pte Ltd', 'CORP', 'SGP',
     '["FUTURES","OPTIONS","OTC_DERIVATIVES"]',
     'URGENT',
     'Same RM (RM-0042) as AO-2026-000101. Platinum tier. However, submission flagged as potential duplicate.',
     '2026-03-02 11:30:00',
     'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-33","chunk-14"],"KB-9":["chunk-03"]}',
     '2026-03-02 10:30:30', TRUE);


-- --------------------------------------------------------------------------
-- 4. dce_ao_rm_hierarchy
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_rm_hierarchy
    (assignment_id, case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email,
     resolution_source, resolved_at)
VALUES
    -- CASE 1: SGP RM — HR resolved
    (1, 'AO-2026-000101',
     'RM-0042', 'John Tan', 'rm.john@abs.com',
     'Marina Bay Financial Centre', 'DCE Sales Desk SGP',
     'MGR-0012', 'Sarah Lim', 'sarah.lim@abs.com',
     'HR_SYSTEM', '2026-03-02 09:31:25'),

    -- CASE 2: HKG RM — Portal provided
    (2, 'AO-2026-000102',
     'RM-0118', 'David Wong', 'david.wong@abs.com',
     'Central HK Branch', 'DCE Sales Desk HKG',
     'MGR-0045', 'Michael Chan', 'michael.chan@abs.com',
     'PORTAL_PROVIDED', '2026-03-02 14:01:10'),

    -- CASE 3: No record — RM-9999 not found

    -- CASE 4: CHN coverage RM — HR resolved
    (3, 'AO-2026-000104',
     'RM-0067', 'Liu Wei', 'rm.liu@abs.com',
     'ABS Shanghai Representative Office', 'DCE Sales Desk CHN',
     'MGR-0023', 'Chen Xiaoming', 'chen.xiaoming@abs.com',
     'HR_SYSTEM', '2026-03-02 11:01:15'),

    -- CASE 5: Fund coverage RM — Portal provided
    (4, 'AO-2026-000105',
     'RM-0091', 'Rachel Ng', 'rachel.ng@abs.com',
     'Marina Bay Financial Centre', 'DCE Institutional Desk SGP',
     'MGR-0012', 'Sarah Lim', 'sarah.lim@abs.com',
     'PORTAL_PROVIDED', '2026-03-02 09:15:50'),

    -- CASE 6: FI coverage RM — HR resolved (API submission)
    (5, 'AO-2026-000106',
     'RM-0155', 'James Leung', 'james.leung@abs.com',
     'Central HK Branch', 'DCE FI Desk HKG',
     'MGR-0045', 'Michael Chan', 'michael.chan@abs.com',
     'HR_SYSTEM', '2026-03-02 15:00:30'),

    -- CASE 7: SPV coverage RM — HR resolved
    (6, 'AO-2026-000107',
     'RM-0033', 'Kumar Patel', 'rm.kumar@abs.com',
     'Marina Bay Financial Centre', 'DCE Structured Products Desk SGP',
     'MGR-0018', 'Priya Sharma', 'priya.sharma@abs.com',
     'HR_SYSTEM', '2026-03-02 16:31:00'),

    -- CASE 8: HKG individual RM — Portal provided
    (7, 'AO-2026-000108',
     'RM-0201', 'Annie Cheung', 'annie.cheung@abs.com',
     'Tsim Sha Tsui Branch', 'DCE Retail Desk HKG',
     'MGR-0052', 'Peter Ho', 'peter.ho@abs.com',
     'PORTAL_PROVIDED', '2026-03-02 08:45:40'),

    -- CASE 9: AUS coverage RM — HR resolved
    (8, 'AO-2026-000109',
     'RM-0078', 'Mark Anderson', 'rm.anderson@abs.com',
     'Marina Bay Financial Centre', 'DCE International Desk SGP',
     'MGR-0023', 'Chen Xiaoming', 'chen.xiaoming@abs.com',
     'HR_SYSTEM', '2026-03-02 12:20:45'),

    -- CASE 10: Same RM as Case 1 (duplicate submission)
    (9, 'AO-2026-000110',
     'RM-0042', 'John Tan', 'rm.john@abs.com',
     'Marina Bay Financial Centre', 'DCE Sales Desk SGP',
     'MGR-0012', 'Sarah Lim', 'sarah.lim@abs.com',
     'HR_SYSTEM', '2026-03-02 10:30:20');


-- --------------------------------------------------------------------------
-- 5. dce_ao_document_staged
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- CASE 1: 2 email attachments
    ('DOC-000001', 'AO-2026-000101', 1,
     'AO_Form_Signed.pdf', 'application/pdf', 245760,
     'gridfs://ao-documents/66a1b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80919',
     '2026-03-02 09:31:50', '2026-03-02 09:31:45'),

    ('DOC-000002', 'AO-2026-000101', 1,
     'Corporate_Profile.pdf', 'application/pdf', 1048576,
     'gridfs://ao-documents/77b2c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, 'f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a20',
     '2026-03-02 09:31:55', '2026-03-02 09:31:45'),

    -- CASE 2: 3 portal uploads
    ('DOC-000003', 'AO-2026-000102', 2,
     'AO_Application_Form.pdf', 'application/pdf', 512000,
     'gridfs://ao-documents/88c3d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, 'a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b30',
     '2026-03-02 14:01:30', '2026-03-02 14:01:25'),

    ('DOC-000004', 'AO-2026-000102', 2,
     'Board_Resolution.pdf', 'application/pdf', 204800,
     'gridfs://ao-documents/99d4e5f6a7b8c9d0e1f2a3b4',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, 'b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c40',
     '2026-03-02 14:01:32', '2026-03-02 14:01:25'),

    ('DOC-000005', 'AO-2026-000102', 2,
     'Financial_Statements_2025.xlsx',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 3145728,
     'gridfs://ao-documents/aae5f6a7b8c9d0e1f2a3b4c5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, 'c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d50',
     '2026-03-02 14:01:35', '2026-03-02 14:01:25'),

    -- CASE 3: No documents — intake failed before staging

    -- CASE 4: 4 email attachments (Chinese corporate with translations)
    ('DOC-000006', 'AO-2026-000104', 4,
     'AO_Form_CN.pdf', 'application/pdf', 389120,
     'gridfs://ao-documents/bb01a2b3c4d5e6f7a8b9c0d1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2',
     '2026-03-02 11:02:10', '2026-03-02 11:02:00'),

    ('DOC-000007', 'AO-2026-000104', 4,
     'Business_License_CN.pdf', 'application/pdf', 156672,
     'gridfs://ao-documents/cc12b3c4d5e6f7a8b9c0d1e2',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '12b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
     '2026-03-02 11:02:15', '2026-03-02 11:02:00'),

    ('DOC-000008', 'AO-2026-000104', 4,
     'Financial_Statements_2024_CN.pdf', 'application/pdf', 2097152,
     'gridfs://ao-documents/dd23c4d5e6f7a8b9c0d1e2f3',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
     '2026-03-02 11:02:20', '2026-03-02 11:02:00'),

    ('DOC-000009', 'AO-2026-000104', 4,
     'Authorized_Signatory_List.pdf', 'application/pdf', 102400,
     'gridfs://ao-documents/ee34d5e6f7a8b9c0d1e2f3a4',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '34d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
     '2026-03-02 11:02:25', '2026-03-02 11:02:00'),

    -- CASE 5: 6 portal uploads (Fund — extensive documentation)
    ('DOC-000010', 'AO-2026-000105', 5,
     'AO_Form_Fund.pdf', 'application/pdf', 614400,
     'gridfs://ao-documents/ff45e6f7a8b9c0d1e2f3a4b5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '45e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
     '2026-03-02 09:16:10', '2026-03-02 09:16:00'),

    ('DOC-000011', 'AO-2026-000105', 5,
     'Fund_Prospectus.pdf', 'application/pdf', 5242880,
     'gridfs://ao-documents/0056f7a8b9c0d1e2f3a4b5c6',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '56f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
     '2026-03-02 09:16:20', '2026-03-02 09:16:00'),

    ('DOC-000012', 'AO-2026-000105', 5,
     'Investment_Management_Agreement.pdf', 'application/pdf', 1572864,
     'gridfs://ao-documents/1167a8b9c0d1e2f3a4b5c6d7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '67a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8',
     '2026-03-02 09:16:25', '2026-03-02 09:16:00'),

    ('DOC-000013', 'AO-2026-000105', 5,
     'Board_Resolution_Fund.pdf', 'application/pdf', 204800,
     'gridfs://ao-documents/2278b9c0d1e2f3a4b5c6d7e8',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '78b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
     '2026-03-02 09:16:28', '2026-03-02 09:16:00'),

    ('DOC-000014', 'AO-2026-000105', 5,
     'Fund_Audited_Accounts_2025.pdf', 'application/pdf', 3145728,
     'gridfs://ao-documents/3389c0d1e2f3a4b5c6d7e8f9',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '89c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0',
     '2026-03-02 09:16:32', '2026-03-02 09:16:00'),

    ('DOC-000015', 'AO-2026-000105', 5,
     'Authorized_Signatories_Fund.pdf', 'application/pdf', 153600,
     'gridfs://ao-documents/449ad1e2f3a4b5c6d7e8f9a0',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '9ad1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1',
     '2026-03-02 09:16:35', '2026-03-02 09:16:00'),

    -- CASE 6: 5 API uploads (FI — regulatory docs)
    ('DOC-000016', 'AO-2026-000106', 6,
     'AO_Form_FI.pdf', 'application/pdf', 409600,
     'gridfs://ao-documents/55abe2f3a4b5c6d7e8f9a0b1',
     'ao-documents', 'API_UPLOAD', 'UPLOADED',
     NULL, 'abe2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
     '2026-03-02 15:00:45', '2026-03-02 15:00:40'),

    ('DOC-000017', 'AO-2026-000106', 6,
     'SFC_License_Copy.pdf', 'application/pdf', 102400,
     'gridfs://ao-documents/66bcf3a4b5c6d7e8f9a0b1c2',
     'ao-documents', 'API_UPLOAD', 'UPLOADED',
     NULL, 'bcf3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
     '2026-03-02 15:00:48', '2026-03-02 15:00:40'),

    ('DOC-000018', 'AO-2026-000106', 6,
     'LEI_Certificate.pdf', 'application/pdf', 81920,
     'gridfs://ao-documents/77cda4b5c6d7e8f9a0b1c2d3',
     'ao-documents', 'API_UPLOAD', 'UPLOADED',
     NULL, 'cda4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4',
     '2026-03-02 15:00:50', '2026-03-02 15:00:40'),

    ('DOC-000019', 'AO-2026-000106', 6,
     'HSBC_Annual_Report_2025.pdf', 'application/pdf', 10485760,
     'gridfs://ao-documents/88deb5c6d7e8f9a0b1c2d3e4',
     'ao-documents', 'API_UPLOAD', 'UPLOADED',
     NULL, 'deb5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5',
     '2026-03-02 15:01:05', '2026-03-02 15:00:40'),

    ('DOC-000020', 'AO-2026-000106', 6,
     'Authorized_Signatories_HSBC.pdf', 'application/pdf', 204800,
     'gridfs://ao-documents/99efc6d7e8f9a0b1c2d3e4f5',
     'ao-documents', 'API_UPLOAD', 'UPLOADED',
     NULL, 'efc6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6',
     '2026-03-02 15:01:08', '2026-03-02 15:00:40'),

    -- CASE 7: 1 email attachment (incomplete — SPV)
    ('DOC-000021', 'AO-2026-000107', 7,
     'Draft_AO_Form_SPV.pdf', 'application/pdf', 163840,
     'gridfs://ao-documents/aaf0d7e8f9a0b1c2d3e4f5a6',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, 'f0d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7',
     '2026-03-02 16:31:30', '2026-03-02 16:31:25'),

    -- CASE 8: 2 portal uploads (individual HKG)
    ('DOC-000022', 'AO-2026-000108', 8,
     'AO_Form_Individual_HK.pdf', 'application/pdf', 307200,
     'gridfs://ao-documents/bb01e8f9a0b1c2d3e4f5a6b7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '01e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8',
     '2026-03-02 08:46:10', '2026-03-02 08:46:05'),

    ('DOC-000023', 'AO-2026-000108', 8,
     'HKID_Copy.pdf', 'application/pdf', 51200,
     'gridfs://ao-documents/cc12f9a0b1c2d3e4f5a6b7c8',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '12f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
     '2026-03-02 08:46:12', '2026-03-02 08:46:05'),

    -- CASE 9: 3 email attachments (Australian corporate)
    ('DOC-000024', 'AO-2026-000109', 9,
     'AO_Form_AUS.pdf', 'application/pdf', 450560,
     'gridfs://ao-documents/dd23a0b1c2d3e4f5a6b7c8d9',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '23a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
     '2026-03-02 12:21:10', '2026-03-02 12:21:00'),

    ('DOC-000025', 'AO-2026-000109', 9,
     'ASIC_Certificate.pdf', 'application/pdf', 122880,
     'gridfs://ao-documents/ee34b1c2d3e4f5a6b7c8d9e0',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '34b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
     '2026-03-02 12:21:15', '2026-03-02 12:21:00'),

    ('DOC-000026', 'AO-2026-000109', 9,
     'Annual_Report_2025_BHP.pdf', 'application/pdf', 8388608,
     'gridfs://ao-documents/ff45c2d3e4f5a6b7c8d9e0f1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED',
     NULL, '45c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
     '2026-03-02 12:21:25', '2026-03-02 12:21:00'),

    -- CASE 10: 2 portal uploads (duplicate submission)
    ('DOC-000027', 'AO-2026-000110', 10,
     'AO_Form_Signed_v2.pdf', 'application/pdf', 256000,
     'gridfs://ao-documents/0056d3e4f5a6b7c8d9e0f1a2',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '56d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
     '2026-03-02 10:30:35', '2026-03-02 10:30:30'),

    ('DOC-000028', 'AO-2026-000110', 10,
     'Corporate_Profile_Updated.pdf', 'application/pdf', 1126400,
     'gridfs://ao-documents/1167e4f5a6b7c8d9e0f1a2b3',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '67e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
     '2026-03-02 10:30:38', '2026-03-02 10:30:30');


-- --------------------------------------------------------------------------
-- 6. dce_ao_node_checkpoint
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_node_checkpoint
    (checkpoint_id, case_id, node_id, attempt_number, status,
     input_snapshot, output_json, context_block_hash,
     started_at, completed_at, duration_seconds, next_node,
     failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- CASE 1: N-0 COMPLETE
    (1, 'AO-2026-000101', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.john@abs.com","subject":"New DCE Account Opening - ABC Trading Pte Ltd","attachments":["AO_Form_Signed.pdf","Corporate_Profile.pdf"]},"received_at":"2026-03-02T09:30:00+08:00","rm_employee_id":"RM-0042"}',
     '{"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","client_name":"ABC Trading Pte Ltd","client_entity_type":"CORP","jurisdiction":"SGP","rm_id":"RM-0042","rm_manager_id":"MGR-0012","products_requested":["FUTURES","OPTIONS"],"next_node":"N-1","confidence":0.94}',
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6',
     '2026-03-02 09:30:00', '2026-03-02 09:32:15', 135.200,
     'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1240,"output":380,"total":1620}'),

    -- CASE 2: N-0 IN_PROGRESS
    (2, 'AO-2026-000102', 'N-0', 1, 'IN_PROGRESS',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Global Commodities HK Ltd","entity_type":"CORP","products":["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"jurisdiction":"HKG"}},"received_at":"2026-03-02T14:00:00+08:00","rm_employee_id":"RM-0118"}',
     NULL,
     'b2c3d4e5f6a1b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7',
     '2026-03-02 14:00:00', NULL, NULL,
     NULL, NULL, 0, 'claude-sonnet-4-6', NULL),

    -- CASE 3: N-0 FAILED (RM not found)
    (3, 'AO-2026-000103', 'N-0', 1, 'FAILED',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"unknown@abs.com","subject":"AO Request - Tan Wei Ming"},"received_at":"2026-03-02T10:00:00+08:00","rm_employee_id":"RM-9999"}',
     NULL,
     'c3d4e5f6a1b2c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8',
     '2026-03-02 10:00:00', '2026-03-02 10:05:30', 330.000,
     NULL, 'RM-9999 not found in HR system — employee ID does not exist or has been deactivated.',
     1, 'claude-sonnet-4-6', '{"input":980,"output":120,"total":1100}'),

    -- CASE 4: N-0 COMPLETE (CHN corporate)
    (4, 'AO-2026-000104', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.liu@abs.com","subject":"Urgent AO - Shanghai Metals Import Export Co Ltd"},"received_at":"2026-03-02T11:00:00+08:00","rm_employee_id":"RM-0067"}',
     '{"case_id":"AO-2026-000104","account_type":"COMMODITIES_PHYSICAL","priority":"URGENT","client_name":"Shanghai Metals Import Export Co Ltd","client_entity_type":"CORP","jurisdiction":"CHN","rm_id":"RM-0067","rm_manager_id":"MGR-0023","products_requested":["COMMODITIES_PHYSICAL","FUTURES"],"next_node":"N-1","confidence":0.91}',
     'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9',
     '2026-03-02 11:00:00', '2026-03-02 11:03:40', 220.000,
     'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1580,"output":420,"total":2000}'),

    -- CASE 5: N-0 COMPLETE (Fund)
    (5, 'AO-2026-000105', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Temasek Alpha Fund III","entity_type":"FUND","products":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]}},"received_at":"2026-03-02T09:15:00+08:00","rm_employee_id":"RM-0091"}',
     '{"case_id":"AO-2026-000105","account_type":"MULTI_PRODUCT","priority":"STANDARD","client_name":"Temasek Alpha Fund III","client_entity_type":"FUND","jurisdiction":"SGP","rm_id":"RM-0091","rm_manager_id":"MGR-0012","products_requested":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"next_node":"N-1","confidence":0.96}',
     'e5f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0',
     '2026-03-02 09:15:00', '2026-03-02 09:18:22', 202.000,
     'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1890,"output":510,"total":2400}'),

    -- CASE 6: N-0 COMPLETE (FI via API)
    (6, 'AO-2026-000106', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"API","raw_payload":{"client_name":"HSBC Securities Services (Asia) Ltd","entity_type":"FI","lei":"5493006W5RWQLKGH1T16","products":["FUTURES","OPTIONS"]},"received_at":"2026-03-02T15:00:00+08:00","rm_employee_id":"RM-0155"}',
     '{"case_id":"AO-2026-000106","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","client_name":"HSBC Securities Services (Asia) Ltd","client_entity_type":"FI","jurisdiction":"HKG","rm_id":"RM-0155","rm_manager_id":"MGR-0045","products_requested":["FUTURES","OPTIONS"],"next_node":"N-1","confidence":0.97}',
     'f6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1',
     '2026-03-02 15:00:00', '2026-03-02 15:01:55', 115.000,
     'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1450,"output":390,"total":1840}'),

    -- CASE 7: N-0 FAILED (low confidence — SPV)
    (7, 'AO-2026-000107', 'N-0', 1, 'FAILED',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.kumar@abs.com","subject":"AO Request - Pinnacle Structured Products SPV"},"received_at":"2026-03-02T16:30:00+08:00","rm_employee_id":"RM-0033"}',
     NULL,
     'a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2',
     '2026-03-02 16:30:00', '2026-03-02 16:34:10', 250.000,
     NULL, 'Classification confidence 0.71 — below auto-proceed threshold of 0.80. Flagged for RM confirmation.',
     1, 'claude-sonnet-4-6', '{"input":1120,"output":280,"total":1400}'),

    -- CASE 8: N-0 COMPLETE (HKG individual)
    (8, 'AO-2026-000108', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Li Mei Ling","entity_type":"INDIVIDUAL","products":["FUTURES"],"jurisdiction":"HKG"}},"received_at":"2026-03-02T08:45:00+08:00","rm_employee_id":"RM-0201"}',
     '{"case_id":"AO-2026-000108","account_type":"RETAIL_FUTURES","priority":"DEFERRED","client_name":"Li Mei Ling","client_entity_type":"INDIVIDUAL","jurisdiction":"HKG","rm_id":"RM-0201","rm_manager_id":"MGR-0052","products_requested":["FUTURES"],"next_node":"N-1","confidence":0.89}',
     'b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3',
     '2026-03-02 08:45:00', '2026-03-02 08:48:30', 210.000,
     'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1050,"output":320,"total":1370}'),

    -- CASE 9: N-0 IN_PROGRESS (AUS corporate)
    (9, 'AO-2026-000109', 'N-0', 1, 'IN_PROGRESS',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.anderson@abs.com","subject":"New AO - BHP Commodities Trading - Australia"},"received_at":"2026-03-02T12:20:00+08:00","rm_employee_id":"RM-0078"}',
     NULL,
     'c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f4',
     '2026-03-02 12:20:00', NULL, NULL,
     NULL, NULL, 0, 'claude-sonnet-4-6', NULL),

    -- CASE 10: N-0 FAILED (duplicate)
    (10, 'AO-2026-000110', 'N-0', 1, 'FAILED',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"ABC Trading Pte Ltd","entity_type":"CORP","products":["FUTURES","OPTIONS","OTC_DERIVATIVES"]}},"received_at":"2026-03-02T10:30:00+08:00","rm_employee_id":"RM-0042"}',
     NULL,
     'd0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8a9b0c1d2e3f4a5',
     '2026-03-02 10:30:00', '2026-03-02 10:30:45', 45.000,
     NULL, 'Duplicate submission detected — SHA256 hash matches AO-2026-000101. Client: ABC Trading Pte Ltd, RM: RM-0042.',
     1, 'claude-sonnet-4-6', '{"input":680,"output":90,"total":770}');


-- --------------------------------------------------------------------------
-- 7. dce_ao_event_log
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_event_log
    (event_id, case_id, event_type, from_state, to_state,
     event_payload, triggered_by, triggered_at, kafka_offset)
VALUES
    -- CASE 1: Full N-0 lifecycle (4 events)
    (1, 'AO-2026-000101', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"rm.john@abs.com","subject":"New DCE Account Opening - ABC Trading Pte Ltd","attachments_count":2}',
     'AGENT', '2026-03-02 09:30:00', 10001),
    (2, 'AO-2026-000101', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"INSTITUTIONAL_FUTURES","confidence":0.94,"priority":"URGENT","sla_deadline":"2026-03-02T11:30:00"}',
     'AGENT', '2026-03-02 09:31:05', 10002),
    (3, 'AO-2026-000101', 'CASE_CREATED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000101","rm_id":"RM-0042","rm_name":"John Tan","rm_manager_id":"MGR-0012","documents_staged":2}',
     'AGENT', '2026-03-02 09:31:30', 10003),
    (4, 'AO-2026-000101', 'NODE_COMPLETED',
     'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":2,"notification_sent":true,"duration_seconds":135.2}',
     'AGENT', '2026-03-02 09:32:15', 10004),

    -- CASE 2: Submission received only
    (5, 'AO-2026-000102', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"PORTAL","portal_form_id":"PF-20260302-007","attachments_count":3}',
     'AGENT', '2026-03-02 14:00:00', 10005),

    -- CASE 3: Submission + failure
    (6, 'AO-2026-000103', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"unknown@abs.com","attachments_count":1}',
     'AGENT', '2026-03-02 10:00:00', 10006),
    (7, 'AO-2026-000103', 'NODE_FAILED',
     'N-0:IN_PROGRESS', 'N-0:FAILED',
     '{"failure":"RM-9999 not found in HR system","retry_count":1,"skill":"SA1.SKL-05"}',
     'AGENT', '2026-03-02 10:05:30', 10007),

    -- CASE 4: CHN corporate — full N-0 lifecycle
    (8, 'AO-2026-000104', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"rm.liu@abs.com","attachments_count":4}',
     'AGENT', '2026-03-02 11:00:00', 10008),
    (9, 'AO-2026-000104', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"COMMODITIES_PHYSICAL","confidence":0.91,"priority":"URGENT","jurisdiction":"CHN"}',
     'AGENT', '2026-03-02 11:01:40', 10009),
    (10, 'AO-2026-000104', 'CASE_CREATED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000104","rm_id":"RM-0067","rm_name":"Liu Wei","rm_manager_id":"MGR-0023","documents_staged":4}',
     'AGENT', '2026-03-02 11:02:30', 10010),
    (11, 'AO-2026-000104', 'NODE_COMPLETED',
     'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":4,"notification_sent":true,"duration_seconds":220.0}',
     'AGENT', '2026-03-02 11:03:40', 10011),

    -- CASE 5: Fund — full N-0 lifecycle
    (12, 'AO-2026-000105', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"PORTAL","portal_form_id":"PF-20260302-012","attachments_count":6}',
     'AGENT', '2026-03-02 09:15:00', 10012),
    (13, 'AO-2026-000105', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"MULTI_PRODUCT","confidence":0.96,"priority":"STANDARD","entity_type":"FUND"}',
     'AGENT', '2026-03-02 09:16:00', 10013),
    (14, 'AO-2026-000105', 'CASE_CREATED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000105","rm_id":"RM-0091","rm_name":"Rachel Ng","rm_manager_id":"MGR-0012","documents_staged":6}',
     'AGENT', '2026-03-02 09:17:00', 10014),
    (15, 'AO-2026-000105', 'NODE_COMPLETED',
     'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":6,"notification_sent":true,"duration_seconds":202.0}',
     'AGENT', '2026-03-02 09:18:22', 10015),

    -- CASE 6: FI via API — full N-0 lifecycle
    (16, 'AO-2026-000106', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"API","lei":"5493006W5RWQLKGH1T16","attachments_count":5}',
     'AGENT', '2026-03-02 15:00:00', 10016),
    (17, 'AO-2026-000106', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"INSTITUTIONAL_FUTURES","confidence":0.97,"priority":"URGENT","entity_type":"FI"}',
     'AGENT', '2026-03-02 15:00:20', 10017),
    (18, 'AO-2026-000106', 'CASE_CREATED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000106","rm_id":"RM-0155","rm_name":"James Leung","rm_manager_id":"MGR-0045","documents_staged":5}',
     'AGENT', '2026-03-02 15:01:10', 10018),
    (19, 'AO-2026-000106', 'NODE_COMPLETED',
     'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":5,"notification_sent":true,"duration_seconds":115.0}',
     'AGENT', '2026-03-02 15:01:55', 10019),

    -- CASE 7: SPV — submission + classification failure
    (20, 'AO-2026-000107', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"rm.kumar@abs.com","attachments_count":1}',
     'AGENT', '2026-03-02 16:30:00', 10020),
    (21, 'AO-2026-000107', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"OTC_DERIVATIVES","confidence":0.71,"flagged_for_review":true}',
     'AGENT', '2026-03-02 16:32:15', 10021),
    (22, 'AO-2026-000107', 'NODE_FAILED',
     'N-0:IN_PROGRESS', 'N-0:FAILED',
     '{"failure":"Classification confidence below threshold","confidence":0.71,"threshold":0.80,"skill":"SA1.SKL-02"}',
     'AGENT', '2026-03-02 16:34:10', 10022),

    -- CASE 8: HKG individual — full N-0 lifecycle
    (23, 'AO-2026-000108', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"PORTAL","portal_form_id":"PF-20260302-003","attachments_count":2}',
     'AGENT', '2026-03-02 08:45:00', 10023),
    (24, 'AO-2026-000108', 'CASE_CLASSIFIED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"RETAIL_FUTURES","confidence":0.89,"priority":"DEFERRED","entity_type":"INDIVIDUAL"}',
     'AGENT', '2026-03-02 08:46:00', 10024),
    (25, 'AO-2026-000108', 'CASE_CREATED',
     'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000108","rm_id":"RM-0201","rm_name":"Annie Cheung","rm_manager_id":"MGR-0052","documents_staged":2}',
     'AGENT', '2026-03-02 08:47:00', 10025),
    (26, 'AO-2026-000108', 'NODE_COMPLETED',
     'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":2,"notification_sent":true,"duration_seconds":210.0}',
     'AGENT', '2026-03-02 08:48:30', 10026),

    -- CASE 9: AUS corporate — submission received only
    (27, 'AO-2026-000109', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"rm.anderson@abs.com","attachments_count":3}',
     'AGENT', '2026-03-02 12:20:00', 10027),

    -- CASE 10: Duplicate — submission + failure
    (28, 'AO-2026-000110', 'SUBMISSION_RECEIVED',
     NULL, 'N-0:IN_PROGRESS',
     '{"source":"PORTAL","portal_form_id":"PF-20260302-019","attachments_count":2}',
     'AGENT', '2026-03-02 10:30:00', 10028),
    (29, 'AO-2026-000110', 'NODE_FAILED',
     'N-0:IN_PROGRESS', 'N-0:FAILED',
     '{"failure":"Duplicate submission detected","matching_case":"AO-2026-000101","similarity":0.87,"skill":"SA1.SKL-01"}',
     'AGENT', '2026-03-02 10:30:45', 10029);


-- --------------------------------------------------------------------------
-- 8. dce_ao_notification_log
-- --------------------------------------------------------------------------

INSERT INTO dce_ao_notification_log
    (notification_id, case_id, node_id, notification_type, channel,
     recipient_id, recipient_email, recipient_role,
     subject, body_summary, template_id,
     delivery_status, failure_reason, retry_count,
     sent_at, delivered_at, created_at)
VALUES
    -- CASE 1: 4 notifications (EMAIL RM, EMAIL MGR, TOAST, KAFKA)
    (1, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'EMAIL',
     'RM-0042', 'rm.john@abs.com', 'RM',
     '[AO-2026-000101] Case Created - ABC Trading Pte Ltd',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000101. Priority: URGENT. SLA Deadline: 2026-03-02 11:30 SGT.',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0,
     '2026-03-02 09:32:10', '2026-03-02 09:32:12', '2026-03-02 09:32:08'),

    (2, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'EMAIL',
     'MGR-0012', 'sarah.lim@abs.com', 'RM_MANAGER',
     '[AO-2026-000101] New AO Case - ABC Trading Pte Ltd (URGENT)',
     'A new URGENT DCE Account Opening case has been created by RM John Tan (RM-0042). Client: ABC Trading Pte Ltd.',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0,
     '2026-03-02 09:32:10', '2026-03-02 09:32:14', '2026-03-02 09:32:08'),

    (3, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST',
     'RM-0042', NULL, 'RM',
     'New case AO-2026-000101 created',
     'URGENT - ABC Trading Pte Ltd - Institutional Futures. SLA: 2h.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0,
     '2026-03-02 09:32:10', '2026-03-02 09:32:10', '2026-03-02 09:32:08'),

    (4, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT',
     NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","rm_id":"RM-0042"}',
     NULL, 'SENT', NULL, 0,
     '2026-03-02 09:32:11', NULL, '2026-03-02 09:32:08'),

    -- CASE 4: 4 notifications (CHN corporate)
    (5, 'AO-2026-000104', 'N-0', 'CASE_CREATED', 'EMAIL',
     'RM-0067', 'rm.liu@abs.com', 'RM',
     '[AO-2026-000104] Case Created - Shanghai Metals Import Export Co Ltd',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000104. Priority: URGENT. SLA Deadline: 2026-03-02 13:00 SGT.',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0,
     '2026-03-02 11:03:35', '2026-03-02 11:03:37', '2026-03-02 11:03:30'),

    (6, 'AO-2026-000104', 'N-0', 'CASE_CREATED', 'EMAIL',
     'MGR-0023', 'chen.xiaoming@abs.com', 'RM_MANAGER',
     '[AO-2026-000104] New AO Case - Shanghai Metals (URGENT, CHN)',
     'A new URGENT DCE Account Opening case for CHN jurisdiction. RM Liu Wei (RM-0067). Client: Shanghai Metals Import Export Co Ltd.',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0,
     '2026-03-02 11:03:35', '2026-03-02 11:03:38', '2026-03-02 11:03:30'),

    (7, 'AO-2026-000104', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST',
     'RM-0067', NULL, 'RM',
     'New case AO-2026-000104 created',
     'URGENT - Shanghai Metals Import Export Co Ltd - Commodities Physical. SLA: 2h.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0,
     '2026-03-02 11:03:35', '2026-03-02 11:03:35', '2026-03-02 11:03:30'),

    (8, 'AO-2026-000104', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT',
     NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000104","account_type":"COMMODITIES_PHYSICAL","priority":"URGENT","rm_id":"RM-0067","jurisdiction":"CHN"}',
     NULL, 'SENT', NULL, 0,
     '2026-03-02 11:03:36', NULL, '2026-03-02 11:03:30'),

    -- CASE 5: 4 notifications (Fund)
    (9, 'AO-2026-000105', 'N-0', 'CASE_CREATED', 'EMAIL',
     'RM-0091', 'rachel.ng@abs.com', 'RM',
     '[AO-2026-000105] Case Created - Temasek Alpha Fund III',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000105. Priority: STANDARD. Multi-Product account. SLA Deadline: 2026-03-04 09:15 SGT.',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0,
     '2026-03-02 09:18:18', '2026-03-02 09:18:20', '2026-03-02 09:18:15'),

    (10, 'AO-2026-000105', 'N-0', 'CASE_CREATED', 'EMAIL',
     'MGR-0012', 'sarah.lim@abs.com', 'RM_MANAGER',
     '[AO-2026-000105] New AO Case - Temasek Alpha Fund III (FUND)',
     'New DCE Account Opening case for Fund entity. RM Rachel Ng (RM-0091). Client: Temasek Alpha Fund III. Multi-Product.',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0,
     '2026-03-02 09:18:18', '2026-03-02 09:18:21', '2026-03-02 09:18:15'),

    (11, 'AO-2026-000105', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST',
     'RM-0091', NULL, 'RM',
     'New case AO-2026-000105 created',
     'STANDARD - Temasek Alpha Fund III - Multi-Product. SLA: 48h.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0,
     '2026-03-02 09:18:18', '2026-03-02 09:18:18', '2026-03-02 09:18:15'),

    (12, 'AO-2026-000105', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT',
     NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000105","account_type":"MULTI_PRODUCT","priority":"STANDARD","rm_id":"RM-0091","entity_type":"FUND"}',
     NULL, 'SENT', NULL, 0,
     '2026-03-02 09:18:19', NULL, '2026-03-02 09:18:15'),

    -- CASE 6: 4 notifications (FI via API)
    (13, 'AO-2026-000106', 'N-0', 'CASE_CREATED', 'EMAIL',
     'RM-0155', 'james.leung@abs.com', 'RM',
     '[AO-2026-000106] Case Created - HSBC Securities Services (Asia) Ltd',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000106. Priority: URGENT. FI client. SLA Deadline: 2026-03-02 17:00 SGT.',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0,
     '2026-03-02 15:01:50', '2026-03-02 15:01:52', '2026-03-02 15:01:48'),

    (14, 'AO-2026-000106', 'N-0', 'CASE_CREATED', 'EMAIL',
     'MGR-0045', 'michael.chan@abs.com', 'RM_MANAGER',
     '[AO-2026-000106] New AO Case - HSBC Securities (URGENT, FI)',
     'New URGENT DCE Account Opening case for Financial Institution. RM James Leung (RM-0155). Client: HSBC Securities Services (Asia) Ltd.',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0,
     '2026-03-02 15:01:50', '2026-03-02 15:01:53', '2026-03-02 15:01:48'),

    (15, 'AO-2026-000106', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST',
     'RM-0155', NULL, 'RM',
     'New case AO-2026-000106 created',
     'URGENT - HSBC Securities Services - Institutional Futures. SLA: 2h.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0,
     '2026-03-02 15:01:50', '2026-03-02 15:01:50', '2026-03-02 15:01:48'),

    (16, 'AO-2026-000106', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT',
     NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000106","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","rm_id":"RM-0155","entity_type":"FI","lei":"5493006W5RWQLKGH1T16"}',
     NULL, 'SENT', NULL, 0,
     '2026-03-02 15:01:51', NULL, '2026-03-02 15:01:48'),

    -- CASE 8: 4 notifications (HKG individual retail)
    (17, 'AO-2026-000108', 'N-0', 'CASE_CREATED', 'EMAIL',
     'RM-0201', 'annie.cheung@abs.com', 'RM',
     '[AO-2026-000108] Case Created - Li Mei Ling',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000108. Priority: DEFERRED. Retail Futures. SLA Deadline: 2026-03-09 08:45 SGT.',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0,
     '2026-03-02 08:48:25', '2026-03-02 08:48:27', '2026-03-02 08:48:22'),

    (18, 'AO-2026-000108', 'N-0', 'CASE_CREATED', 'EMAIL',
     'MGR-0052', 'peter.ho@abs.com', 'RM_MANAGER',
     '[AO-2026-000108] New AO Case - Li Mei Ling (DEFERRED)',
     'New DCE Account Opening case for individual retail client. RM Annie Cheung (RM-0201). Client: Li Mei Ling. HKG jurisdiction.',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0,
     '2026-03-02 08:48:25', '2026-03-02 08:48:28', '2026-03-02 08:48:22'),

    (19, 'AO-2026-000108', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST',
     'RM-0201', NULL, 'RM',
     'New case AO-2026-000108 created',
     'DEFERRED - Li Mei Ling - Retail Futures. SLA: 7d.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0,
     '2026-03-02 08:48:25', '2026-03-02 08:48:25', '2026-03-02 08:48:22'),

    (20, 'AO-2026-000108', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT',
     NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000108","account_type":"RETAIL_FUTURES","priority":"DEFERRED","rm_id":"RM-0201","entity_type":"INDIVIDUAL","jurisdiction":"HKG"}',
     NULL, 'SENT', NULL, 0,
     '2026-03-02 08:48:26', NULL, '2026-03-02 08:48:22');

    -- CASE 2, 3, 7, 9, 10: No notifications — either in-progress or failed before notification step


-- ============================================================================
-- Seed Data Summary
-- ============================================================================
--
-- Table                          | Rows | Cases Covered
-- -------------------------------|------|----------------------------------------------
-- dce_ao_case_state              |   10 | 101-110 (all 10 cases)
-- dce_ao_submission_raw          |   10 | 101-110 (all 10 cases)
-- dce_ao_classification_result   |   10 | 101-110 (all 10 cases)
-- dce_ao_rm_hierarchy            |    9 | 101, 102, 104-110 (103 failed RM lookup)
-- dce_ao_document_staged         |   28 | 101(2), 102(3), 104(4), 105(6), 106(5),
--                                |      | 107(1), 108(2), 109(3), 110(2)
-- dce_ao_node_checkpoint         |   10 | 101-110 (all 10 cases)
-- dce_ao_event_log               |   29 | 101(4), 102(1), 103(2), 104(4), 105(4),
--                                |      | 106(4), 107(3), 108(4), 109(1), 110(2)
-- dce_ao_notification_log        |   20 | 101(4), 104(4), 105(4), 106(4), 108(4)
-- -------------------------------|------|----------------------------------------------
-- TOTAL                          |  126 | 10 distinct cases
--
-- ============================================================================
