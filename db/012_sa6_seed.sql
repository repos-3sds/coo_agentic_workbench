-- DCE Account Opening — SA-6 Seed Data
-- Version: 1.0.0 | Date: 2026-03-08
-- Scope: Two SA-6 test cases at N-5 (Static Configuration)
--
-- Case AO-2026-000401: Stellar Trading Pte Ltd (SGP CORP, FUTURES+OPTIONS)
--   Standard case — APPROVED, IRB approach, MEDIUM KYC risk
--   Test: happy path — config spec build → TMO instruction → all pass validation
--
-- Case AO-2026-000402: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT)
--   Edge case — APPROVED_WITH_CONDITIONS, SA approach, HIGH KYC risk
--   Test: validation with discrepancies → TMO_DISCREPANCY_FOUND

USE dce_agent;

-- ============================================
-- 0. submission_raw — stub rows required by FK
-- ============================================
INSERT IGNORE INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, sender_email, email_subject,
     received_at, processing_status, attachments_count)
VALUES
    (401, 'AO-2026-000401', 'EMAIL',
     'david.tan@abs.com', 'DCE Account Opening — Stellar Trading Pte Ltd',
     '2026-02-18 08:00:00', 'PROCESSED', 6),
    (402, 'AO-2026-000402', 'PORTAL_UPLOAD',
     'mei.wong@abs.com', 'DCE Account Opening — Dragon Phoenix Holdings [URGENT]',
     '2026-02-20 10:00:00', 'PROCESSED', 8);

-- ============================================
-- 1. case_state — two cases at N-5 ACTIVE
--    (these cases have completed N-0 through N-4)
-- ============================================
INSERT IGNORE INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts,
     case_type, priority, rm_id, client_name, jurisdiction, sla_deadline,
     created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000401', 'ACTIVE', 'N-5',
     '["N-0","N-1","N-2","N-3","N-4"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'STANDARD', 'RM-0061',
     'Stellar Trading Pte Ltd', 'SGP',
     '2026-03-05 17:00:00',
     '2026-02-18 08:00:00', '2026-03-01 14:00:00', NULL, 28),

    ('AO-2026-000402', 'ACTIVE', 'N-5',
     '["N-0","N-1","N-2","N-3","N-4"]', '[]', '{}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0092',
     'Dragon Phoenix Holdings Ltd', 'HKG',
     '2026-03-03 17:00:00',
     '2026-02-20 10:00:00', '2026-03-02 16:00:00', NULL, 32);

-- ============================================
-- 2. rm_hierarchy — RM details
-- ============================================
INSERT IGNORE INTO dce_ao_rm_hierarchy
    (case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email, resolution_source)
VALUES
    ('AO-2026-000401', 'RM-0061', 'David Tan Chee Keong',
     'david.tan@abs.com', 'Singapore Main Branch', 'Institutional Futures Desk',
     'RM-MGR-005', 'Christine Lee Siew Ping', 'christine.lee@abs.com', 'HR_SYSTEM'),

    ('AO-2026-000402', 'RM-0092', 'Mei Wong Lai Yee',
     'mei.wong@abs.com', 'Hong Kong Branch', 'Multi-Asset Desk',
     'RM-MGR-006', 'Philip Chan Chi Ming', 'philip.chan@abs.com', 'HR_SYSTEM');

-- ============================================
-- 3. classification_result
-- ============================================
INSERT IGNORE INTO dce_ao_classification_result
    (case_id, submission_id, account_type, account_type_confidence,
     account_type_reasoning, client_name, client_entity_type, jurisdiction,
     products_requested, priority, priority_reason, sla_deadline,
     classifier_model, priority_model, classified_at)
VALUES
    (
        'AO-2026-000401', 401,
        'INSTITUTIONAL_FUTURES', 0.971,
        'Singapore-incorporated proprietary trading firm with MAS CMS licence. Products: FUTURES and OPTIONS. Standard institutional profile.',
        'Stellar Trading Pte Ltd', 'CORP', 'SGP',
        '["FUTURES","OPTIONS"]',
        'STANDARD', 'Clean submission with complete document set',
        '2026-03-05 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-18 08:05:00'
    ),
    (
        'AO-2026-000402', 402,
        'MULTI_PRODUCT', 0.955,
        'HKG-incorporated investment holding company. Products: FUTURES, OTC_DERIVATIVES, COMMODITIES_PHYSICAL. Multi-product classification with complex structure.',
        'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
        '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
        'URGENT', 'Key institutional client — expedited processing requested',
        '2026-03-03 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-20 10:05:00'
    );

-- ============================================
-- 4. document_staged — AO forms and financial statements
-- ============================================
INSERT IGNORE INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- Case 401: Stellar — AO Form
    ('DOC-000401', 'AO-2026-000401', 401,
     'Stellar_AO_Form.pdf', 'application/pdf', 256000,
     'gridfs://ao-documents/d401a1b2c3d4e5f6a7b8c9d0',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2',
     '2026-02-18 08:00:30', '2026-02-18 08:00:25'),

    -- Case 401: Financial Statements (3 years)
    ('DOC-000402', 'AO-2026-000401', 401,
     'Stellar_Audited_FS_2024.pdf', 'application/pdf', 520000,
     'gridfs://ao-documents/d402b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
     '2026-02-18 08:00:32', '2026-02-18 08:00:25'),

    ('DOC-000403', 'AO-2026-000401', 401,
     'Stellar_Audited_FS_2023.pdf', 'application/pdf', 505000,
     'gridfs://ao-documents/d403c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
     '2026-02-18 08:00:34', '2026-02-18 08:00:25'),

    ('DOC-000404', 'AO-2026-000401', 401,
     'Stellar_Financial_Statement_2022.pdf', 'application/pdf', 490000,
     'gridfs://ao-documents/d404d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
     '2026-02-18 08:00:36', '2026-02-18 08:00:25'),

    -- Case 402: Dragon Phoenix — AO Form
    ('DOC-000411', 'AO-2026-000402', 402,
     'DragonPhoenix_AO_Form.pdf', 'application/pdf', 290000,
     'gridfs://ao-documents/d411f6a7b8c9d0e1f2a3b4c5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
     '2026-02-20 10:00:30', '2026-02-20 10:00:25'),

    -- Case 402: Financial Statements (2 years)
    ('DOC-000412', 'AO-2026-000402', 402,
     'DragonPhoenix_Audited_FS_2024.pdf', 'application/pdf', 645000,
     'gridfs://ao-documents/d412a7b8c9d0e1f2a3b4c5d6',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'd6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
     '2026-02-20 10:00:32', '2026-02-20 10:00:25'),

    ('DOC-000413', 'AO-2026-000402', 402,
     'DragonPhoenix_Audited_FS_2023.pdf', 'application/pdf', 615000,
     'gridfs://ao-documents/d413b8c9d0e1f2a3b4c5d6e7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
     '2026-02-20 10:00:34', '2026-02-20 10:00:25');

-- ============================================
-- 5. document_ocr_result — AO form entity data
-- ============================================
INSERT IGNORE INTO dce_ao_document_ocr_result
    (doc_id, case_id, detected_doc_type, ocr_confidence, extracted_text,
     issuing_authority, issue_date, expiry_date, signatory_names,
     document_language, page_count, has_signatures, has_stamps,
     flagged_for_review, ocr_engine, processing_time_ms, processed_at)
VALUES
    -- Case 401: Stellar AO Form
    (
        'DOC-000401', 'AO-2026-000401',
        'AO_FORM', 0.982,
        '{"entity_name":"Stellar Trading Pte Ltd","uen":"201912345K","entity_type":"CORP","jurisdiction":"SGP","lei_number":"549300STELLAR01XYZAB","incorporation_date":"2019-06-15","registered_address":"1 Raffles Quay #28-10 North Tower Singapore 048583","directors":[{"name":"David Tan Chee Keong","id_type":"NRIC","id_number":"S7812345A","nationality":"SGP","role":"Director"},{"name":"Sarah Lim Mei Xin","id_type":"NRIC","id_number":"S8123456B","nationality":"SGP","role":"Director"}],"beneficial_owners":[{"name":"Stellar Capital Group Pte Ltd","percentage":80.0,"jurisdiction":"SGP","entity_type":"CORP"},{"name":"David Tan Chee Keong","percentage":20.0,"jurisdiction":"SGP","entity_type":"INDIVIDUAL"}],"authorised_traders":[{"name":"David Tan Chee Keong","designation":"Director / Head of Trading","id_number":"S7812345A"},{"name":"Ryan Ng Wei Ming","designation":"Senior Trader","id_number":"S8534567C"}],"products_requested":["FUTURES","OPTIONS"],"mas_cms_licence_number":"CMS100789-3"}',
        'DCE Operations', '2026-02-16', NULL,
        '["David Tan Chee Keong","Sarah Lim Mei Xin"]',
        'EN', 12, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 3200, '2026-02-18 08:10:00'
    ),
    -- Case 402: Dragon Phoenix AO Form
    (
        'DOC-000411', 'AO-2026-000402',
        'AO_FORM', 0.968,
        '{"entity_name":"Dragon Phoenix Holdings Ltd","company_number":"HK1234567","entity_type":"CORP","jurisdiction":"HKG","lei_number":"213800DRAGONPH01ABCD","incorporation_date":"2015-11-20","registered_address":"Suite 3201 Two IFC 8 Finance Street Central Hong Kong","directors":[{"name":"Michael Chen Wei","id_type":"HKID","id_number":"C1234567","nationality":"HKG","role":"Director"},{"name":"Lisa Zhang Hui","id_type":"PASSPORT","id_number":"G12345678","nationality":"CHN","role":"Director"},{"name":"James Park","id_type":"PASSPORT","id_number":"M87654321","nationality":"KOR","role":"Director"}],"beneficial_owners":[{"name":"Dragon Phoenix International BVI Ltd","percentage":100.0,"jurisdiction":"VGB","entity_type":"CORP"}],"authorised_traders":[{"name":"Michael Chen Wei","designation":"Director / CIO","id_number":"C1234567"},{"name":"Amy Liu Xin","designation":"Head of Derivatives","id_number":"C7654321"},{"name":"Kevin Park Joon","designation":"Commodities Trader","id_number":"M12345678"}],"products_requested":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]}',
        'DCE Operations', '2026-02-18', NULL,
        '["Michael Chen Wei","Lisa Zhang Hui","James Park"]',
        'EN', 16, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 4500, '2026-02-20 10:15:00'
    );

-- ============================================
-- 6. node_checkpoint — N-0 through N-4 COMPLETE
-- ============================================
INSERT IGNORE INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status,
     input_snapshot, output_json, context_block_hash,
     started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- Case 401: N-0
    ('AO-2026-000401', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"david.tan@abs.com","subject":"DCE Account Opening — Stellar Trading Pte Ltd"}}',
     '{"case_id":"AO-2026-000401","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD","client_name":"Stellar Trading Pte Ltd","jurisdiction":"SGP","confidence":0.971}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a401',
     '2026-02-18 08:00:00', '2026-02-18 08:05:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1500,"output":470,"total":1970}'),

    -- Case 401: N-1
    ('AO-2026-000401', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000401","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD"}',
     '{"case_id":"AO-2026-000401","checklist_status":"ALL_CLEAR","documents_verified":6,"mandatory_complete":9,"optional_complete":3,"next_node":"N-2"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b401',
     '2026-02-18 09:00:00', '2026-02-19 10:00:00', 90000.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":2800,"output":710,"total":3510}'),

    -- Case 401: N-2
    ('AO-2026-000401', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000401","mode":"RESUME","hitl_task_id":"HITL-000070"}',
     '{"case_id":"AO-2026-000401","verification_status":"ALL_APPROVED","total_signatories":2,"approved_count":2,"specimens_stored":["SPEC-000401","SPEC-000402"],"next_node":"N-3"}',
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c401',
     '2026-02-20 09:00:00', '2026-02-20 11:00:00', 7200.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3050,"output":820,"total":3870}'),

    -- Case 401: N-3
    ('AO-2026-000401', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000401","mode":"HITL_REVIEW","hitl_task_id":"HITL-000071"}',
     '{"case_id":"AO-2026-000401","kyc_brief_id":"BRIEF-000401","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000401","sanctions_status":"CLEAR","pep_flags_count":0,"adverse_media_found":false,"names_screened_count":4,"rm_decisions":{"kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED","bcap_clearance":true,"caa_approach":"IRB","recommended_dce_limit_sgd":10000000,"recommended_dce_pce_limit_sgd":4000000,"osca_case_number":"OSCA-2026-004001","limit_exposure_indication":"Estimated monthly trading SGD 1.2M; medium exposure; exchange-traded only","rm_id":"RM-0061","decided_at":"2026-02-24 14:00:00"},"next_node":"N-4"}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d401',
     '2026-02-21 09:00:00', '2026-02-24 16:00:00', 284400.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":4100,"output":1050,"total":5150}'),

    -- Case 401: N-4
    ('AO-2026-000401', 'N-4', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000401","mode":"HITL_REVIEW","hitl_task_id":"HITL-000072"}',
     '{"case_id":"AO-2026-000401","credit_brief_id":"CBRIEF-000401","credit_outcome":"APPROVED","approved_dce_limit_sgd":10000000,"approved_dce_pce_limit_sgd":4000000,"confirmed_caa_approach":"IRB","conditions":[],"next_node":"N-5"}',
     'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e401',
     '2026-02-25 09:00:00', '2026-03-01 14:00:00', 450000.0,
     'N-5', NULL, 0, 'claude-sonnet-4-6', '{"input":5200,"output":1200,"total":6400}'),

    -- Case 402: N-0
    ('AO-2026-000402', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"PORTAL_UPLOAD","raw_payload":{"sender_email":"mei.wong@abs.com","subject":"DCE Account Opening — Dragon Phoenix Holdings [URGENT]"}}',
     '{"case_id":"AO-2026-000402","account_type":"MULTI_PRODUCT","priority":"URGENT","client_name":"Dragon Phoenix Holdings Ltd","jurisdiction":"HKG","confidence":0.955}',
     'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f402',
     '2026-02-20 10:00:00', '2026-02-20 10:05:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1650,"output":520,"total":2170}'),

    -- Case 402: N-1
    ('AO-2026-000402', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000402","account_type":"MULTI_PRODUCT","priority":"URGENT"}',
     '{"case_id":"AO-2026-000402","checklist_status":"ALL_CLEAR","documents_verified":8,"mandatory_complete":12,"optional_complete":4,"next_node":"N-2"}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a402',
     '2026-02-20 11:00:00', '2026-02-21 09:00:00', 79200.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":3100,"output":800,"total":3900}'),

    -- Case 402: N-2
    ('AO-2026-000402', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000402","mode":"RESUME","hitl_task_id":"HITL-000073"}',
     '{"case_id":"AO-2026-000402","verification_status":"ALL_APPROVED","total_signatories":3,"approved_count":3,"specimens_stored":["SPEC-000411","SPEC-000412","SPEC-000413"],"next_node":"N-3"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b402',
     '2026-02-22 10:00:00', '2026-02-22 14:00:00', 14400.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3400,"output":900,"total":4300}'),

    -- Case 402: N-3
    ('AO-2026-000402', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000402","mode":"HITL_REVIEW","hitl_task_id":"HITL-000074"}',
     '{"case_id":"AO-2026-000402","kyc_brief_id":"BRIEF-000402","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000402","sanctions_status":"POTENTIAL_MATCH","pep_flags_count":1,"adverse_media_found":true,"names_screened_count":6,"rm_decisions":{"kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE","bcap_clearance":true,"caa_approach":"SA","recommended_dce_limit_sgd":20000000,"recommended_dce_pce_limit_sgd":8000000,"osca_case_number":"OSCA-2026-004002","limit_exposure_indication":"Multi-product exposure; HKG entity with VGB UBO; elevated risk","rm_id":"RM-0092","decided_at":"2026-02-27 15:00:00"},"next_node":"N-4"}',
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c402',
     '2026-02-23 09:00:00', '2026-02-27 16:00:00', 378000.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":5000,"output":1350,"total":6350}'),

    -- Case 402: N-4
    ('AO-2026-000402', 'N-4', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000402","mode":"HITL_REVIEW","hitl_task_id":"HITL-000075"}',
     '{"case_id":"AO-2026-000402","credit_brief_id":"CBRIEF-000402","credit_outcome":"APPROVED_WITH_CONDITIONS","approved_dce_limit_sgd":18000000,"approved_dce_pce_limit_sgd":6000000,"confirmed_caa_approach":"SA","conditions":[{"type":"EDD_CLOSURE","description":"Source of funds declaration required from Dragon Phoenix International BVI Ltd","owner":"RM-0092","open_until_date":"2026-04-15"},{"type":"CREDIT_CONDITION","description":"OTC derivatives notional capped at SGD 8M until EDD resolved","owner":"CT-004","open_until_date":"2026-04-15"}],"next_node":"N-5"}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d402',
     '2026-02-28 09:00:00', '2026-03-02 16:00:00', 198000.0,
     'N-5', NULL, 0, 'claude-sonnet-4-6', '{"input":5800,"output":1500,"total":7300}');

-- ============================================
-- 7. signature_specimen records from N-2
-- ============================================
INSERT IGNORE INTO dce_ao_signature_specimen
    (specimen_id, case_id, signatory_id, signatory_name, entity_id,
     source_doc_id, confidence_score, approving_officer_id, approving_officer_name,
     mongodb_specimen_ref, comparison_overlay_ref, approved_at)
VALUES
    ('SPEC-000401', 'AO-2026-000401', 'SIG-401-001',
     'David Tan Chee Keong', 'ENTITY-401',
     'DOC-000401', 94.20, 'DS-0030', 'Kenneth Ong Boon Huat',
     'gridfs://sig-specimens/spec401a1b2c3d4e5f6a7b8',
     'gridfs://sig-overlays/ovl401a1b2c3d4e5f6a7b8',
     '2026-02-20 10:30:00'),
    ('SPEC-000402', 'AO-2026-000401', 'SIG-401-002',
     'Ryan Ng Wei Ming', 'ENTITY-401',
     'DOC-000401', 91.80, 'DS-0030', 'Kenneth Ong Boon Huat',
     'gridfs://sig-specimens/spec402b2c3d4e5f6a7b8c9',
     'gridfs://sig-overlays/ovl402b2c3d4e5f6a7b8c9',
     '2026-02-20 10:45:00'),
    ('SPEC-000411', 'AO-2026-000402', 'SIG-402-001',
     'Michael Chen Wei', 'ENTITY-402',
     'DOC-000411', 89.50, 'DS-0031', 'Angela Yip Wai Sum',
     'gridfs://sig-specimens/spec411c3d4e5f6a7b8c9d0',
     'gridfs://sig-overlays/ovl411c3d4e5f6a7b8c9d0',
     '2026-02-22 13:00:00'),
    ('SPEC-000412', 'AO-2026-000402', 'SIG-402-002',
     'Amy Liu Xin', 'ENTITY-402',
     'DOC-000411', 90.30, 'DS-0031', 'Angela Yip Wai Sum',
     'gridfs://sig-specimens/spec412d4e5f6a7b8c9d0e1',
     'gridfs://sig-overlays/ovl412d4e5f6a7b8c9d0e1',
     '2026-02-22 13:15:00'),
    ('SPEC-000413', 'AO-2026-000402', 'SIG-402-003',
     'Kevin Park Joon', 'ENTITY-402',
     'DOC-000411', 87.90, 'DS-0031', 'Angela Yip Wai Sum',
     'gridfs://sig-specimens/spec413e5f6a7b8c9d0e1f2',
     'gridfs://sig-overlays/ovl413e5f6a7b8c9d0e1f2',
     '2026-02-22 13:30:00');

-- ============================================
-- 8. kyc_brief records from completed N-3
-- ============================================
INSERT IGNORE INTO dce_ao_kyc_brief
    (brief_id, case_id, attempt_number, entity_legal_name, entity_type,
     incorporation_jurisdiction, sanctions_status, pep_flag_count, adverse_media_found,
     names_screened_count, brief_url, suggested_risk_range, compiled_by_model, compiled_at)
VALUES
    ('BRIEF-000401', 'AO-2026-000401', 1,
     'Stellar Trading Pte Ltd', 'CORP', 'SGP',
     'CLEAR', 0, FALSE, 4,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000401',
     'LOW', 'claude-sonnet-4-6', '2026-02-22 14:00:00'),

    ('BRIEF-000402', 'AO-2026-000402', 1,
     'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
     'POTENTIAL_MATCH', 1, TRUE, 6,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000402',
     'MEDIUM', 'claude-sonnet-4-6', '2026-02-25 10:00:00');

-- ============================================
-- 9. rm_kyc_decision — completed RM decisions from N-3
-- ============================================
INSERT IGNORE INTO dce_ao_rm_kyc_decision
    (case_id, brief_id,
     kyc_risk_rating, cdd_clearance, bcap_clearance, caa_approach,
     recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
     osca_case_number, limit_exposure_indication,
     additional_conditions, rm_id, rm_name, decided_at)
VALUES
    (
        'AO-2026-000401', 'BRIEF-000401',
        'MEDIUM', 'CLEARED', TRUE, 'IRB',
        10000000.00, 4000000.00,
        'OSCA-2026-004001',
        'Estimated monthly trading SGD 1.2M; medium exposure; exchange-traded products only',
        NULL,
        'RM-0061', 'David Tan Chee Keong', '2026-02-24 14:00:00'
    ),
    (
        'AO-2026-000402', 'BRIEF-000402',
        'HIGH', 'ENHANCED_DUE_DILIGENCE', TRUE, 'SA',
        20000000.00, 8000000.00,
        'OSCA-2026-004002',
        'Multi-product exposure; HKG entity with VGB UBO; elevated risk profile; EDD in progress',
        '[{"type":"EDD_REQUIREMENT","description":"Obtain source of funds declaration from Dragon Phoenix International BVI Ltd (UBO)","owner":"RM-0092","open_until_date":"2026-04-01"}]',
        'RM-0092', 'Mei Wong Lai Yee', '2026-02-27 15:00:00'
    );

-- ============================================
-- 10. credit_brief — completed credit briefs from N-4
-- ============================================
INSERT IGNORE INTO dce_ao_credit_brief
    (credit_brief_id, case_id, attempt_number,
     entity_legal_name, entity_type, jurisdiction,
     products_requested,
     caa_approach, recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
     osca_case_number, limit_exposure_indication, kyc_risk_rating,
     financial_years_analysed,
     total_equity_sgd, net_asset_value_sgd,
     leverage_ratio, liquidity_ratio,
     revenue_sgd, net_profit_sgd,
     revenue_trend_pct, profitability_trend_pct,
     estimated_initial_limit_sgd,
     brief_url, open_questions, comparable_benchmarks,
     credit_outcome_flag,
     compiled_by_model, kb_chunks_used, compiled_at)
VALUES
    ('CBRIEF-000401', 'AO-2026-000401', 1,
     'Stellar Trading Pte Ltd', 'CORP', 'SGP',
     '["FUTURES","OPTIONS"]',
     'IRB', 10000000.00, 4000000.00,
     'OSCA-2026-004001', 'Estimated monthly trading SGD 1.2M; medium exposure', 'MEDIUM',
     3,
     52000000.00, 54500000.00,
     0.0962, 5.1250,
     14500000.00, 4200000.00,
     12.80, 16.67,
     5200000.00,
     'https://workbench.dce.internal/credit-briefs/CBRIEF-000401',
     '["Confirm NAV calculation methodology"]', '{"FUTURES":{"typical_limit_range_sgd":"3M-12M"}}',
     'APPROVED',
     'qwen2.5:32b', '["KB-6-chunk-1","KB-6-chunk-2"]', '2026-02-26 14:00:00'),

    ('CBRIEF-000402', 'AO-2026-000402', 1,
     'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
     '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
     'SA', 20000000.00, 8000000.00,
     'OSCA-2026-004002', 'Multi-product; HKG entity with VGB UBO; elevated exposure', 'HIGH',
     2,
     25200000.00, 26400000.00,
     0.2500, 3.5714,
     8400000.00, 1960000.00,
     9.50, 19.51,
     2520000.00,
     'https://workbench.dce.internal/credit-briefs/CBRIEF-000402',
     '["Await EDD documentation","Confirm OTC derivatives notional cap"]',
     '{"FUTURES":{"typical_limit_range_sgd":"5M-20M"},"OTC_DERIVATIVES":{"typical_limit_range_sgd":"3M-15M"}}',
     'APPROVED_WITH_CONDITIONS',
     'qwen2.5:32b', '["KB-6-chunk-1"]', '2026-02-28 15:00:00');

-- ============================================
-- 11. credit_decision — completed credit decisions from N-4
-- ============================================
INSERT IGNORE INTO dce_ao_credit_decision
    (case_id, credit_brief_id,
     credit_outcome, approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
     confirmed_caa_approach, conditions, decline_reason,
     credit_team_id, credit_team_name, credit_team_email, decided_at)
VALUES
    (
        'AO-2026-000401', 'CBRIEF-000401',
        'APPROVED', 10000000.00, 4000000.00,
        'IRB', '[]', NULL,
        'CT-005', 'Mark Tan Choon Heng', 'mark.tan@abs.com', '2026-02-28 10:00:00'
    ),
    (
        'AO-2026-000402', 'CBRIEF-000402',
        'APPROVED_WITH_CONDITIONS', 18000000.00, 6000000.00,
        'SA',
        '[{"type":"EDD_CLOSURE","description":"Source of funds declaration required from Dragon Phoenix International BVI Ltd","owner":"RM-0092","open_until_date":"2026-04-15"},{"type":"CREDIT_CONDITION","description":"OTC derivatives notional capped at SGD 8M until EDD resolved","owner":"CT-004","open_until_date":"2026-04-15"}]',
        NULL,
        'CT-006', 'Jennifer Kwok Mei Lin', 'jennifer.kwok@abs.com', '2026-03-01 11:00:00'
    );

-- ============================================
-- 12. event_log — prior N-0 through N-4 events
-- ============================================
INSERT IGNORE INTO dce_ao_event_log
    (case_id, event_type, triggered_by, event_payload, triggered_at)
VALUES
    -- Case 401 events
    ('AO-2026-000401', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"INSTITUTIONAL_FUTURES"}', '2026-02-18 08:05:00'),
    ('AO-2026-000401', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-19 10:00:00'),
    ('AO-2026-000401', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000401","SPEC-000402"]}', '2026-02-20 11:00:00'),
    ('AO-2026-000401', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000401","sanctions_status":"CLEAR"}', '2026-02-22 14:00:00'),
    ('AO-2026-000401', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0061","kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED"}', '2026-02-24 14:00:00'),
    ('AO-2026-000401', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED"}', '2026-02-24 16:00:00'),
    ('AO-2026-000401', 'CREDIT_APPROVED', 'sa5_complete_node',
     '{"node_id":"N-4","credit_brief_id":"CBRIEF-000401","credit_outcome":"APPROVED","approved_dce_limit_sgd":10000000,"next_node":"N-5"}', '2026-03-01 14:00:00'),
    ('AO-2026-000401', 'NODE_COMPLETED', 'sa5_complete_node',
     '{"node_id":"N-4","next_node":"N-5","outcome":"CREDIT_APPROVED"}', '2026-03-01 14:00:00'),

    -- Case 402 events
    ('AO-2026-000402', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"MULTI_PRODUCT"}', '2026-02-20 10:05:00'),
    ('AO-2026-000402', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-21 09:00:00'),
    ('AO-2026-000402', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000411","SPEC-000412","SPEC-000413"]}', '2026-02-22 14:00:00'),
    ('AO-2026-000402', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000402","sanctions_status":"POTENTIAL_MATCH","pep_flag_count":1}', '2026-02-25 10:00:00'),
    ('AO-2026-000402', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0092","kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE"}', '2026-02-27 15:00:00'),
    ('AO-2026-000402', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED"}', '2026-02-27 16:00:00'),
    ('AO-2026-000402', 'CREDIT_APPROVED', 'sa5_complete_node',
     '{"node_id":"N-4","credit_brief_id":"CBRIEF-000402","credit_outcome":"APPROVED_WITH_CONDITIONS","approved_dce_limit_sgd":18000000,"conditions_count":2,"next_node":"N-5"}', '2026-03-02 16:00:00'),
    ('AO-2026-000402', 'NODE_COMPLETED', 'sa5_complete_node',
     '{"node_id":"N-4","next_node":"N-5","outcome":"CREDIT_APPROVED_WITH_CONDITIONS"}', '2026-03-02 16:00:00');
