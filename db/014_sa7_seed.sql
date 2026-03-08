-- DCE Account Opening — SA-7 Seed Data
-- Version: 1.0.0 | Date: 2026-03-08
-- Scope: Two SA-7 test cases at N-6 (Notification Agent)
--
-- Case AO-2026-000501: Stellar Trading Pte Ltd (SGP CORP, FUTURES+OPTIONS)
--   Standard case — APPROVED, IRB approach, MEDIUM KYC risk
--   Test: happy path — welcome kit → batch notifications → case COMPLETED
--
-- Case AO-2026-000502: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT)
--   Edge case — APPROVED_WITH_CONDITIONS, SA approach, HIGH KYC risk
--   Test: welcome kit with conditions → batch notifications → case COMPLETED

USE dce_agent;

-- ============================================
-- 0. submission_raw — stub rows required by FK
-- ============================================
INSERT IGNORE INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, sender_email, email_subject,
     received_at, processing_status, attachments_count)
VALUES
    (501, 'AO-2026-000501', 'EMAIL',
     'peter.lim@abs.com', 'DCE Account Opening — Stellar Trading Pte Ltd',
     '2026-02-17 08:00:00', 'PROCESSED', 6),
    (502, 'AO-2026-000502', 'PORTAL_UPLOAD',
     'grace.ho@abs.com', 'DCE Account Opening — Dragon Phoenix Holdings [URGENT]',
     '2026-02-19 10:00:00', 'PROCESSED', 8);

-- ============================================
-- 1. case_state — two cases at N-6 ACTIVE
--    (these cases have completed N-0 through N-5)
-- ============================================
INSERT IGNORE INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts,
     case_type, priority, rm_id, client_name, jurisdiction, sla_deadline,
     created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000501', 'ACTIVE', 'N-6',
     '["N-0","N-1","N-2","N-3","N-4","N-5"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'STANDARD', 'RM-0071',
     'Stellar Trading Pte Ltd', 'SGP',
     '2026-03-10 17:00:00',
     '2026-02-17 08:00:00', '2026-03-04 14:00:00', NULL, 34),

    ('AO-2026-000502', 'ACTIVE', 'N-6',
     '["N-0","N-1","N-2","N-3","N-4","N-5"]', '[]', '{}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0072',
     'Dragon Phoenix Holdings Ltd', 'HKG',
     '2026-03-07 17:00:00',
     '2026-02-19 10:00:00', '2026-03-05 16:00:00', NULL, 38);

-- ============================================
-- 2. rm_hierarchy — RM details
-- ============================================
INSERT IGNORE INTO dce_ao_rm_hierarchy
    (case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email, resolution_source)
VALUES
    ('AO-2026-000501', 'RM-0071', 'Peter Lim Wei Chong',
     'peter.lim@abs.com', 'Singapore Main Branch', 'Institutional Futures Desk',
     'RM-MGR-007', 'Catherine Goh Siew Lian', 'catherine.goh@abs.com', 'HR_SYSTEM'),

    ('AO-2026-000502', 'RM-0072', 'Grace Ho Mei Ling',
     'grace.ho@abs.com', 'Hong Kong Branch', 'Multi-Asset Desk',
     'RM-MGR-008', 'Raymond Tse Chi Wai', 'raymond.tse@abs.com', 'HR_SYSTEM');

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
        'AO-2026-000501', 501,
        'INSTITUTIONAL_FUTURES', 0.974,
        'Singapore-incorporated proprietary trading firm with MAS CMS licence. Products: FUTURES and OPTIONS. Standard institutional profile.',
        'Stellar Trading Pte Ltd', 'CORP', 'SGP',
        '["FUTURES","OPTIONS"]',
        'STANDARD', 'Clean submission with complete document set',
        '2026-03-10 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-17 08:05:00'
    ),
    (
        'AO-2026-000502', 502,
        'MULTI_PRODUCT', 0.958,
        'HKG-incorporated investment holding company. Products: FUTURES, OPTIONS, OTC_DERIVATIVES. Multi-product classification with complex structure.',
        'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
        '["FUTURES","OPTIONS","OTC_DERIVATIVES"]',
        'URGENT', 'Key institutional client — expedited processing requested',
        '2026-03-07 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-19 10:05:00'
    );

-- ============================================
-- 4. document_staged — AO forms and financial statements
-- ============================================
INSERT IGNORE INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- Case 501: Stellar — AO Form
    ('DOC-000501', 'AO-2026-000501', 501,
     'Stellar_AO_Form.pdf', 'application/pdf', 262000,
     'gridfs://ao-documents/d501a1b2c3d4e5f6a7b8c9d0',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4e5f6a7b8c9d0e1f2',
     '2026-02-17 08:00:30', '2026-02-17 08:00:25'),

    -- Case 501: Financial Statement
    ('DOC-000511', 'AO-2026-000501', 501,
     'Stellar_Audited_FS_2024.pdf', 'application/pdf', 530000,
     'gridfs://ao-documents/d511b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4e5f6a7b8c9d0e1f2a3',
     '2026-02-17 08:00:32', '2026-02-17 08:00:25'),

    -- Case 502: Dragon Phoenix — AO Form
    ('DOC-000502', 'AO-2026-000502', 502,
     'DragonPhoenix_AO_Form.pdf', 'application/pdf', 295000,
     'gridfs://ao-documents/d502c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4e5f6a7b8c9d0e1f2a3b4',
     '2026-02-19 10:00:30', '2026-02-19 10:00:25'),

    -- Case 502: Financial Statement
    ('DOC-000512', 'AO-2026-000502', 502,
     'DragonPhoenix_Audited_FS_2024.pdf', 'application/pdf', 650000,
     'gridfs://ao-documents/d512d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4e5f6a7b8c9d0e1f2a3b4c5',
     '2026-02-19 10:00:32', '2026-02-19 10:00:25');

-- ============================================
-- 5. document_ocr_result — AO form entity data
-- ============================================
INSERT IGNORE INTO dce_ao_document_ocr_result
    (doc_id, case_id, detected_doc_type, ocr_confidence, extracted_text,
     issuing_authority, issue_date, expiry_date, signatory_names,
     document_language, page_count, has_signatures, has_stamps,
     flagged_for_review, ocr_engine, processing_time_ms, processed_at)
VALUES
    -- Case 501: Stellar AO Form
    (
        'DOC-000501', 'AO-2026-000501',
        'AO_FORM', 0.985,
        '{"entity_name":"Stellar Trading Pte Ltd","uen":"201912345K","entity_type":"CORP","jurisdiction":"SGP","lei_number":"549300STELLAR01XYZAB","incorporation_date":"2019-06-15","registered_address":"1 Raffles Quay #28-10 North Tower Singapore 048583","directors":[{"name":"Peter Lim Wei Chong","id_type":"NRIC","id_number":"S7912345D","nationality":"SGP","role":"Director"},{"name":"Sarah Lim Mei Xin","id_type":"NRIC","id_number":"S8123456B","nationality":"SGP","role":"Director"}],"beneficial_owners":[{"name":"Stellar Capital Group Pte Ltd","percentage":80.0,"jurisdiction":"SGP","entity_type":"CORP"},{"name":"Peter Lim Wei Chong","percentage":20.0,"jurisdiction":"SGP","entity_type":"INDIVIDUAL"}],"authorised_traders":[{"name":"Peter Lim Wei Chong","designation":"Director / Head of Trading","id_number":"S7912345D"},{"name":"Ryan Ng Wei Ming","designation":"Senior Trader","id_number":"S8534567C"}],"products_requested":["FUTURES","OPTIONS"],"mas_cms_licence_number":"CMS100891-5"}',
        'DCE Operations', '2026-02-15', NULL,
        '["Peter Lim Wei Chong","Sarah Lim Mei Xin"]',
        'EN', 12, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 3100, '2026-02-17 08:10:00'
    ),
    -- Case 502: Dragon Phoenix AO Form
    (
        'DOC-000502', 'AO-2026-000502',
        'AO_FORM', 0.971,
        '{"entity_name":"Dragon Phoenix Holdings Ltd","company_number":"HK2345678","entity_type":"CORP","jurisdiction":"HKG","lei_number":"213800DRAGONPH02EFGH","incorporation_date":"2016-03-10","registered_address":"Suite 4501 Two IFC 8 Finance Street Central Hong Kong","directors":[{"name":"Michael Chen Wei","id_type":"HKID","id_number":"C2345678","nationality":"HKG","role":"Director"},{"name":"Lisa Zhang Hui","id_type":"PASSPORT","id_number":"G23456789","nationality":"CHN","role":"Director"},{"name":"James Park","id_type":"PASSPORT","id_number":"M98765432","nationality":"KOR","role":"Director"}],"beneficial_owners":[{"name":"Dragon Phoenix International BVI Ltd","percentage":100.0,"jurisdiction":"VGB","entity_type":"CORP"}],"authorised_traders":[{"name":"Michael Chen Wei","designation":"Director / CIO","id_number":"C2345678"},{"name":"Amy Liu Xin","designation":"Head of Derivatives","id_number":"C8765432"},{"name":"Kevin Park Joon","designation":"Commodities Trader","id_number":"M23456789"}],"products_requested":["FUTURES","OPTIONS","OTC_DERIVATIVES"]}',
        'DCE Operations', '2026-02-17', NULL,
        '["Michael Chen Wei","Lisa Zhang Hui","James Park"]',
        'EN', 16, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 4400, '2026-02-19 10:15:00'
    );

-- ============================================
-- 6. node_checkpoint — N-0 through N-5 COMPLETE
-- ============================================
INSERT IGNORE INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status,
     input_snapshot, output_json, context_block_hash,
     started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- Case 501: N-0
    ('AO-2026-000501', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"peter.lim@abs.com","subject":"DCE Account Opening — Stellar Trading Pte Ltd"}}',
     '{"case_id":"AO-2026-000501","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD","client_name":"Stellar Trading Pte Ltd","jurisdiction":"SGP","confidence":0.974}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a501',
     '2026-02-17 08:00:00', '2026-02-17 08:05:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1500,"output":470,"total":1970}'),

    -- Case 501: N-1
    ('AO-2026-000501', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000501","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD"}',
     '{"case_id":"AO-2026-000501","checklist_status":"ALL_CLEAR","documents_verified":6,"mandatory_complete":9,"optional_complete":3,"next_node":"N-2"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b501',
     '2026-02-17 09:00:00', '2026-02-18 10:00:00', 90000.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":2800,"output":710,"total":3510}'),

    -- Case 501: N-2
    ('AO-2026-000501', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000501","mode":"RESUME","hitl_task_id":"HITL-000080"}',
     '{"case_id":"AO-2026-000501","verification_status":"ALL_APPROVED","total_signatories":2,"approved_count":2,"specimens_stored":["SPEC-000501","SPEC-000502"],"next_node":"N-3"}',
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c501',
     '2026-02-19 09:00:00', '2026-02-19 11:00:00', 7200.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3050,"output":820,"total":3870}'),

    -- Case 501: N-3
    ('AO-2026-000501', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000501","mode":"HITL_REVIEW","hitl_task_id":"HITL-000081"}',
     '{"case_id":"AO-2026-000501","kyc_brief_id":"BRIEF-000501","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000501","sanctions_status":"CLEAR","pep_flags_count":0,"adverse_media_found":false,"names_screened_count":4,"rm_decisions":{"kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED","bcap_clearance":true,"caa_approach":"IRB","recommended_dce_limit_sgd":10000000,"recommended_dce_pce_limit_sgd":4000000,"osca_case_number":"OSCA-2026-005001","limit_exposure_indication":"Estimated monthly trading SGD 1.0M; medium exposure; exchange-traded only","rm_id":"RM-0071","decided_at":"2026-02-23 14:00:00"},"next_node":"N-4"}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d501',
     '2026-02-20 09:00:00', '2026-02-23 16:00:00', 284400.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":4100,"output":1050,"total":5150}'),

    -- Case 501: N-4
    ('AO-2026-000501', 'N-4', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000501","mode":"HITL_REVIEW","hitl_task_id":"HITL-000082"}',
     '{"case_id":"AO-2026-000501","credit_brief_id":"CBRIEF-000501","credit_outcome":"APPROVED","approved_dce_limit_sgd":10000000,"approved_dce_pce_limit_sgd":4000000,"confirmed_caa_approach":"IRB","conditions":[],"next_node":"N-5"}',
     'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e501',
     '2026-02-24 09:00:00', '2026-02-27 14:00:00', 277200.0,
     'N-5', NULL, 0, 'claude-sonnet-4-6', '{"input":5200,"output":1200,"total":6400}'),

    -- Case 501: N-5
    ('AO-2026-000501', 'N-5', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000501","credit_outcome":"APPROVED","approved_dce_limit_sgd":10000000,"confirmed_caa_approach":"IRB"}',
     '{"case_id":"AO-2026-000501","spec_id":"CSPEC-000501","instruction_id":"TINST-000501","validation_status":"TMO_VALIDATED","systems_validated":["UBIX","SIC","CV"],"next_node":"N-6"}',
     'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f501',
     '2026-02-28 09:00:00', '2026-03-03 14:00:00', 277200.0,
     'N-6', NULL, 0, 'claude-sonnet-4-6', '{"input":6100,"output":1400,"total":7500}'),

    -- Case 502: N-0
    ('AO-2026-000502', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"PORTAL_UPLOAD","raw_payload":{"sender_email":"grace.ho@abs.com","subject":"DCE Account Opening — Dragon Phoenix Holdings [URGENT]"}}',
     '{"case_id":"AO-2026-000502","account_type":"MULTI_PRODUCT","priority":"URGENT","client_name":"Dragon Phoenix Holdings Ltd","jurisdiction":"HKG","confidence":0.958}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a502',
     '2026-02-19 10:00:00', '2026-02-19 10:05:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1650,"output":520,"total":2170}'),

    -- Case 502: N-1
    ('AO-2026-000502', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000502","account_type":"MULTI_PRODUCT","priority":"URGENT"}',
     '{"case_id":"AO-2026-000502","checklist_status":"ALL_CLEAR","documents_verified":8,"mandatory_complete":12,"optional_complete":4,"next_node":"N-2"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b502',
     '2026-02-19 11:00:00', '2026-02-20 09:00:00', 79200.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":3100,"output":800,"total":3900}'),

    -- Case 502: N-2
    ('AO-2026-000502', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000502","mode":"RESUME","hitl_task_id":"HITL-000083"}',
     '{"case_id":"AO-2026-000502","verification_status":"ALL_APPROVED","total_signatories":3,"approved_count":3,"specimens_stored":["SPEC-000511","SPEC-000512","SPEC-000513"],"next_node":"N-3"}',
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c502',
     '2026-02-21 10:00:00', '2026-02-21 14:00:00', 14400.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3400,"output":900,"total":4300}'),

    -- Case 502: N-3
    ('AO-2026-000502', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000502","mode":"HITL_REVIEW","hitl_task_id":"HITL-000084"}',
     '{"case_id":"AO-2026-000502","kyc_brief_id":"BRIEF-000502","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000502","sanctions_status":"POTENTIAL_MATCH","pep_flags_count":1,"adverse_media_found":true,"names_screened_count":6,"rm_decisions":{"kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE","bcap_clearance":true,"caa_approach":"SA","recommended_dce_limit_sgd":20000000,"recommended_dce_pce_limit_sgd":8000000,"osca_case_number":"OSCA-2026-005002","limit_exposure_indication":"Multi-product exposure; HKG entity with VGB UBO; elevated risk","rm_id":"RM-0072","decided_at":"2026-02-26 15:00:00"},"next_node":"N-4"}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d502',
     '2026-02-22 09:00:00', '2026-02-26 16:00:00', 378000.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":5000,"output":1350,"total":6350}'),

    -- Case 502: N-4
    ('AO-2026-000502', 'N-4', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000502","mode":"HITL_REVIEW","hitl_task_id":"HITL-000085"}',
     '{"case_id":"AO-2026-000502","credit_brief_id":"CBRIEF-000502","credit_outcome":"APPROVED_WITH_CONDITIONS","approved_dce_limit_sgd":18000000,"approved_dce_pce_limit_sgd":6000000,"confirmed_caa_approach":"SA","conditions":[{"type":"EDD_CLOSURE","description":"Source of funds declaration required from Dragon Phoenix International BVI Ltd","owner":"RM-0072","open_until_date":"2026-04-15"},{"type":"CREDIT_CONDITION","description":"OTC derivatives notional capped at SGD 8M until EDD resolved","owner":"CT-004","open_until_date":"2026-04-15"}],"next_node":"N-5"}',
     'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e502',
     '2026-02-27 09:00:00', '2026-03-01 16:00:00', 198000.0,
     'N-5', NULL, 0, 'claude-sonnet-4-6', '{"input":5800,"output":1500,"total":7300}'),

    -- Case 502: N-5
    ('AO-2026-000502', 'N-5', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000502","credit_outcome":"APPROVED_WITH_CONDITIONS","approved_dce_limit_sgd":18000000,"confirmed_caa_approach":"SA"}',
     '{"case_id":"AO-2026-000502","spec_id":"CSPEC-000502","instruction_id":"TINST-000502","validation_status":"TMO_VALIDATED","systems_validated":["UBIX","SIC","CV"],"next_node":"N-6"}',
     'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f502',
     '2026-03-02 09:00:00', '2026-03-05 14:00:00', 277200.0,
     'N-6', NULL, 0, 'claude-sonnet-4-6', '{"input":6500,"output":1600,"total":8100}');

-- ============================================
-- 7. signature_specimen records from N-2
-- ============================================
INSERT IGNORE INTO dce_ao_signature_specimen
    (specimen_id, case_id, signatory_id, signatory_name, entity_id,
     source_doc_id, confidence_score, approving_officer_id, approving_officer_name,
     mongodb_specimen_ref, comparison_overlay_ref, approved_at)
VALUES
    ('SIG-000501', 'AO-2026-000501', 'SIG-501-001',
     'Peter Lim Wei Chong', 'ENTITY-501',
     'DOC-000501', 95.10, 'DS-0032', 'Kenneth Ong Boon Huat',
     'gridfs://sig-specimens/spec501a1b2c3d4e5f6a7b8',
     'gridfs://sig-overlays/ovl501a1b2c3d4e5f6a7b8',
     '2026-02-19 10:30:00'),
    ('SIG-000502', 'AO-2026-000501', 'SIG-501-002',
     'Ryan Ng Wei Ming', 'ENTITY-501',
     'DOC-000501', 92.40, 'DS-0032', 'Kenneth Ong Boon Huat',
     'gridfs://sig-specimens/spec502b2c3d4e5f6a7b8c9',
     'gridfs://sig-overlays/ovl502b2c3d4e5f6a7b8c9',
     '2026-02-19 10:45:00'),
    ('SIG-000511', 'AO-2026-000502', 'SIG-502-001',
     'Michael Chen Wei', 'ENTITY-502',
     'DOC-000502', 89.80, 'DS-0033', 'Angela Yip Wai Sum',
     'gridfs://sig-specimens/spec511c3d4e5f6a7b8c9d0',
     'gridfs://sig-overlays/ovl511c3d4e5f6a7b8c9d0',
     '2026-02-21 13:00:00'),
    ('SIG-000512', 'AO-2026-000502', 'SIG-502-002',
     'Amy Liu Xin', 'ENTITY-502',
     'DOC-000502', 90.60, 'DS-0033', 'Angela Yip Wai Sum',
     'gridfs://sig-specimens/spec512d4e5f6a7b8c9d0e1',
     'gridfs://sig-overlays/ovl512d4e5f6a7b8c9d0e1',
     '2026-02-21 13:15:00');

-- ============================================
-- 8. kyc_brief records from completed N-3
-- ============================================
INSERT IGNORE INTO dce_ao_kyc_brief
    (brief_id, case_id, attempt_number, entity_legal_name, entity_type,
     incorporation_jurisdiction, sanctions_status, pep_flag_count, adverse_media_found,
     names_screened_count, brief_url, suggested_risk_range, compiled_by_model, compiled_at)
VALUES
    ('BRIEF-000501', 'AO-2026-000501', 1,
     'Stellar Trading Pte Ltd', 'CORP', 'SGP',
     'CLEAR', 0, FALSE, 4,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000501',
     'LOW', 'claude-sonnet-4-6', '2026-02-21 14:00:00'),

    ('BRIEF-000502', 'AO-2026-000502', 1,
     'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
     'POTENTIAL_MATCH', 1, TRUE, 6,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000502',
     'HIGH', 'claude-sonnet-4-6', '2026-02-24 10:00:00');

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
        'AO-2026-000501', 'BRIEF-000501',
        'MEDIUM', 'CLEARED', TRUE, 'IRB',
        10000000.00, 4000000.00,
        'OSCA-2026-005001',
        'Estimated monthly trading SGD 1.0M; medium exposure; exchange-traded products only',
        NULL,
        'RM-0071', 'Peter Lim Wei Chong', '2026-02-23 14:00:00'
    ),
    (
        'AO-2026-000502', 'BRIEF-000502',
        'HIGH', 'ENHANCED_DUE_DILIGENCE', TRUE, 'SA',
        20000000.00, 8000000.00,
        'OSCA-2026-005002',
        'Multi-product exposure; HKG entity with VGB UBO; elevated risk profile; EDD in progress',
        '[{"type":"EDD_REQUIREMENT","description":"Obtain source of funds declaration from Dragon Phoenix International BVI Ltd (UBO)","owner":"RM-0072","open_until_date":"2026-04-01"}]',
        'RM-0072', 'Grace Ho Mei Ling', '2026-02-26 15:00:00'
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
    ('CBRIEF-000501', 'AO-2026-000501', 1,
     'Stellar Trading Pte Ltd', 'CORP', 'SGP',
     '["FUTURES","OPTIONS"]',
     'IRB', 10000000.00, 4000000.00,
     'OSCA-2026-005001', 'Estimated monthly trading SGD 1.0M; medium exposure', 'MEDIUM',
     3,
     55000000.00, 57500000.00,
     0.0850, 5.3200,
     15200000.00, 4500000.00,
     13.50, 17.20,
     5500000.00,
     'https://workbench.dce.internal/credit-briefs/CBRIEF-000501',
     '["Confirm NAV calculation methodology"]', '{"FUTURES":{"typical_limit_range_sgd":"3M-12M"}}',
     'APPROVED',
     'qwen2.5:32b', '["KB-6-chunk-1","KB-6-chunk-2"]', '2026-02-25 14:00:00'),

    ('CBRIEF-000502', 'AO-2026-000502', 1,
     'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
     '["FUTURES","OPTIONS","OTC_DERIVATIVES"]',
     'SA', 20000000.00, 8000000.00,
     'OSCA-2026-005002', 'Multi-product; HKG entity with VGB UBO; elevated exposure', 'HIGH',
     2,
     26000000.00, 27200000.00,
     0.2400, 3.6500,
     8800000.00, 2050000.00,
     10.20, 20.10,
     2600000.00,
     'https://workbench.dce.internal/credit-briefs/CBRIEF-000502',
     '["Await EDD documentation","Confirm OTC derivatives notional cap"]',
     '{"FUTURES":{"typical_limit_range_sgd":"5M-20M"},"OTC_DERIVATIVES":{"typical_limit_range_sgd":"3M-15M"}}',
     'APPROVED_WITH_CONDITIONS',
     'qwen2.5:32b', '["KB-6-chunk-1"]', '2026-02-27 15:00:00');

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
        'AO-2026-000501', 'CBRIEF-000501',
        'APPROVED', 10000000.00, 4000000.00,
        'IRB', '[]', NULL,
        'CT-007', 'Mark Tan Choon Heng', 'mark.tan@abs.com', '2026-02-26 10:00:00'
    ),
    (
        'AO-2026-000502', 'CBRIEF-000502',
        'APPROVED_WITH_CONDITIONS', 18000000.00, 6000000.00,
        'SA',
        '[{"type":"EDD_CLOSURE","description":"Source of funds declaration required from Dragon Phoenix International BVI Ltd","owner":"RM-0072","open_until_date":"2026-04-15"},{"type":"CREDIT_CONDITION","description":"OTC derivatives notional capped at SGD 8M until EDD resolved","owner":"CT-004","open_until_date":"2026-04-15"}]',
        NULL,
        'CT-008', 'Jennifer Kwok Mei Lin', 'jennifer.kwok@abs.com', '2026-02-28 11:00:00'
    );

-- ============================================
-- 12. config_spec — from SA-6 Node N-5 (TMO_VALIDATED)
-- ============================================
INSERT IGNORE INTO dce_ao_config_spec
    (spec_id, case_id, attempt_number,
     ubix_config, sic_config, cv_config, authorised_traders,
     status, credit_outcome, approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
     confirmed_caa_approach, products_requested,
     compiled_by_model, kb_chunks_used, compiled_at, updated_at)
VALUES
    (
        'CSPEC-000501', 'AO-2026-000501', 1,
        '{"entity_name":"Stellar Trading Pte Ltd","lei":"549300STELLAR01XYZAB","entity_type":"CORP","jurisdiction":"SGP","regulatory_flags":["MAS_CMS_LICENSED"],"product_permissions":["FUTURES","OPTIONS"],"exchange_memberships":["SGX","CME"],"account_code":"UBIX-ST-501"}',
        '{"account_mapping":{"primary_account":"SIC-ST-501","sub_accounts":["SIC-ST-501-FUT","SIC-ST-501-OPT"]},"commission_rates":{"FUTURES":0.0012,"OPTIONS":0.0018},"credit_limits":{"dce_limit_sgd":10000000,"pce_limit_sgd":4000000},"margin_parameters":{"initial_margin_pct":8.0,"maintenance_margin_pct":5.0},"billing_currency":"SGD"}',
        '{"contract_mapping":{"FUTURES":["SGX-NK","SGX-TW","CME-ES"],"OPTIONS":["SGX-NK-OPT","SGX-TW-OPT"]},"settlement_account":"CV-ST-501","credit_limit_sgd":10000000,"pce_limit_sgd":4000000,"margin_rates":{"FUTURES":8.0,"OPTIONS":12.0},"caa_approach":"IRB"}',
        '[{"name":"Peter Lim Wei Chong","designation":"Director / Head of Trading","id_number":"S7912345D","cqg_perms":["TRADE","VIEW"],"idb_perms":["TRADE"]},{"name":"Ryan Ng Wei Ming","designation":"Senior Trader","id_number":"S8534567C","cqg_perms":["TRADE","VIEW"],"idb_perms":["TRADE"]}]',
        'TMO_VALIDATED',
        'APPROVED', 10000000.00, 4000000.00,
        'IRB', '["FUTURES","OPTIONS"]',
        'claude-sonnet-4-6', '["KB-5-chunk-1","KB-5-chunk-2","KB-5-chunk-3"]',
        '2026-02-28 14:00:00', '2026-03-03 14:00:00'
    ),
    (
        'CSPEC-000502', 'AO-2026-000502', 1,
        '{"entity_name":"Dragon Phoenix Holdings Ltd","lei":"213800DRAGONPH02EFGH","entity_type":"CORP","jurisdiction":"HKG","regulatory_flags":["SFC_LICENSED"],"product_permissions":["FUTURES","OPTIONS","OTC_DERIVATIVES"],"exchange_memberships":["HKEX","SGX","CME"],"account_code":"UBIX-DP-502"}',
        '{"account_mapping":{"primary_account":"SIC-DP-502","sub_accounts":["SIC-DP-502-FUT","SIC-DP-502-OPT","SIC-DP-502-OTC"]},"commission_rates":{"FUTURES":0.0010,"OPTIONS":0.0015,"OTC_DERIVATIVES":0.0025},"credit_limits":{"dce_limit_sgd":18000000,"pce_limit_sgd":6000000},"margin_parameters":{"initial_margin_pct":10.0,"maintenance_margin_pct":6.5},"billing_currency":"SGD"}',
        '{"contract_mapping":{"FUTURES":["HKEX-HSI","SGX-NK","CME-ES"],"OPTIONS":["HKEX-HSI-OPT","SGX-NK-OPT"],"OTC_DERIVATIVES":["IRS","CCS","FX_FWD"]},"settlement_account":"CV-DP-502","credit_limit_sgd":18000000,"pce_limit_sgd":6000000,"margin_rates":{"FUTURES":10.0,"OPTIONS":14.0,"OTC_DERIVATIVES":18.0},"caa_approach":"SA","otc_notional_cap_sgd":8000000}',
        '[{"name":"Michael Chen Wei","designation":"Director / CIO","id_number":"C2345678","cqg_perms":["TRADE","VIEW"],"idb_perms":["TRADE"]},{"name":"Amy Liu Xin","designation":"Head of Derivatives","id_number":"C8765432","cqg_perms":["TRADE","VIEW"],"idb_perms":["TRADE"]},{"name":"Kevin Park Joon","designation":"Commodities Trader","id_number":"M23456789","cqg_perms":["TRADE","VIEW"],"idb_perms":["TRADE"]}]',
        'TMO_VALIDATED',
        'APPROVED_WITH_CONDITIONS', 18000000.00, 6000000.00,
        'SA', '["FUTURES","OPTIONS","OTC_DERIVATIVES"]',
        'claude-sonnet-4-6', '["KB-5-chunk-1","KB-5-chunk-2"]',
        '2026-03-02 14:00:00', '2026-03-05 14:00:00'
    );

-- ============================================
-- 13. tmo_instruction — from SA-6 Node N-5 (TMO_COMPLETED)
-- ============================================
INSERT IGNORE INTO dce_ao_tmo_instruction
    (instruction_id, case_id, spec_id,
     instruction_document, instruction_url, status,
     generated_by_model, generated_at)
VALUES
    (
        'TINST-000501', 'AO-2026-000501', 'CSPEC-000501',
        '{"ubix_instructions":["Create entity profile for Stellar Trading Pte Ltd (LEI: 549300STELLAR01XYZAB)","Set product permissions: FUTURES, OPTIONS","Configure exchange memberships: SGX, CME","Apply IRB regulatory flags"],"sic_instructions":["Create primary account SIC-ST-501","Create sub-accounts: SIC-ST-501-FUT, SIC-ST-501-OPT","Set commission rates per product schedule","Configure credit limits: DCE SGD 10M, PCE SGD 4M"],"cv_instructions":["Map contracts: SGX-NK, SGX-TW, CME-ES (FUTURES); SGX-NK-OPT, SGX-TW-OPT (OPTIONS)","Set settlement account CV-ST-501","Configure margin rates: FUTURES 8.0%, OPTIONS 12.0%"],"trader_setup":["Peter Lim Wei Chong — CQG: TRADE+VIEW, IDB: TRADE","Ryan Ng Wei Ming — CQG: TRADE+VIEW, IDB: TRADE"],"validation_checklist":["Verify entity LEI in UBIX","Confirm product permissions active","Validate credit limits in CV","Check trader CQG access"]}',
        'https://workbench.dce.internal/tmo-instructions/TINST-000501',
        'TMO_COMPLETED',
        'claude-sonnet-4-6', '2026-02-28 15:00:00'
    ),
    (
        'TINST-000502', 'AO-2026-000502', 'CSPEC-000502',
        '{"ubix_instructions":["Create entity profile for Dragon Phoenix Holdings Ltd (LEI: 213800DRAGONPH02EFGH)","Set product permissions: FUTURES, OPTIONS, OTC_DERIVATIVES","Configure exchange memberships: HKEX, SGX, CME","Apply SA regulatory flags","Note: APPROVED_WITH_CONDITIONS — EDD pending"],"sic_instructions":["Create primary account SIC-DP-502","Create sub-accounts: SIC-DP-502-FUT, SIC-DP-502-OPT, SIC-DP-502-OTC","Set commission rates per product schedule","Configure credit limits: DCE SGD 18M, PCE SGD 6M","Apply OTC notional cap: SGD 8M"],"cv_instructions":["Map contracts: HKEX-HSI, SGX-NK, CME-ES (FUTURES); HKEX-HSI-OPT, SGX-NK-OPT (OPTIONS); IRS, CCS, FX_FWD (OTC)","Set settlement account CV-DP-502","Configure margin rates: FUTURES 10.0%, OPTIONS 14.0%, OTC 18.0%","Apply OTC notional cap SGD 8M per credit condition"],"trader_setup":["Michael Chen Wei — CQG: TRADE+VIEW, IDB: TRADE","Amy Liu Xin — CQG: TRADE+VIEW, IDB: TRADE","Kevin Park Joon — CQG: TRADE+VIEW, IDB: TRADE"],"validation_checklist":["Verify entity LEI in UBIX","Confirm product permissions active (3 products)","Validate credit limits in CV","Confirm OTC notional cap applied","Check all 3 traders have CQG access"]}',
        'https://workbench.dce.internal/tmo-instructions/TINST-000502',
        'TMO_COMPLETED',
        'claude-sonnet-4-6', '2026-03-02 15:00:00'
    );

-- ============================================
-- 14. system_validation — from SA-6 Node N-5 (all PASS)
-- ============================================
INSERT IGNORE INTO dce_ao_system_validation
    (case_id, spec_id, system_name,
     validation_status, fields_checked, fields_passed, fields_failed,
     discrepancies, configured_values, validated_at)
VALUES
    -- Case 501: UBIX PASS
    ('AO-2026-000501', 'CSPEC-000501', 'UBIX',
     'PASS', 12, 12, 0,
     '[]',
     '{"entity_name":"Stellar Trading Pte Ltd","lei":"549300STELLAR01XYZAB","product_permissions":["FUTURES","OPTIONS"],"exchange_memberships":["SGX","CME"],"status":"ACTIVE"}',
     '2026-03-03 10:00:00'),

    -- Case 501: SIC PASS
    ('AO-2026-000501', 'CSPEC-000501', 'SIC',
     'PASS', 10, 10, 0,
     '[]',
     '{"primary_account":"SIC-ST-501","sub_accounts":["SIC-ST-501-FUT","SIC-ST-501-OPT"],"credit_limit_sgd":10000000,"pce_limit_sgd":4000000,"status":"ACTIVE"}',
     '2026-03-03 10:30:00'),

    -- Case 501: CV PASS
    ('AO-2026-000501', 'CSPEC-000501', 'CV',
     'PASS', 14, 14, 0,
     '[]',
     '{"settlement_account":"CV-ST-501","credit_limit_sgd":10000000,"pce_limit_sgd":4000000,"margin_rates":{"FUTURES":8.0,"OPTIONS":12.0},"status":"ACTIVE"}',
     '2026-03-03 11:00:00'),

    -- Case 502: UBIX PASS
    ('AO-2026-000502', 'CSPEC-000502', 'UBIX',
     'PASS', 15, 15, 0,
     '[]',
     '{"entity_name":"Dragon Phoenix Holdings Ltd","lei":"213800DRAGONPH02EFGH","product_permissions":["FUTURES","OPTIONS","OTC_DERIVATIVES"],"exchange_memberships":["HKEX","SGX","CME"],"status":"ACTIVE"}',
     '2026-03-05 10:00:00'),

    -- Case 502: SIC PASS
    ('AO-2026-000502', 'CSPEC-000502', 'SIC',
     'PASS', 13, 13, 0,
     '[]',
     '{"primary_account":"SIC-DP-502","sub_accounts":["SIC-DP-502-FUT","SIC-DP-502-OPT","SIC-DP-502-OTC"],"credit_limit_sgd":18000000,"pce_limit_sgd":6000000,"otc_notional_cap_sgd":8000000,"status":"ACTIVE"}',
     '2026-03-05 10:30:00'),

    -- Case 502: CV PASS
    ('AO-2026-000502', 'CSPEC-000502', 'CV',
     'PASS', 16, 16, 0,
     '[]',
     '{"settlement_account":"CV-DP-502","credit_limit_sgd":18000000,"pce_limit_sgd":6000000,"margin_rates":{"FUTURES":10.0,"OPTIONS":14.0,"OTC_DERIVATIVES":18.0},"otc_notional_cap_sgd":8000000,"status":"ACTIVE"}',
     '2026-03-05 11:00:00');

-- ============================================
-- 15. event_log — prior N-0 through N-5 events + KYC + credit + TMO
-- ============================================
INSERT IGNORE INTO dce_ao_event_log
    (case_id, event_type, triggered_by, event_payload, triggered_at)
VALUES
    -- Case 501 events
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"INSTITUTIONAL_FUTURES"}', '2026-02-17 08:05:00'),
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-18 10:00:00'),
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000501","SPEC-000502"]}', '2026-02-19 11:00:00'),
    ('AO-2026-000501', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000501","sanctions_status":"CLEAR"}', '2026-02-21 14:00:00'),
    ('AO-2026-000501', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0071","kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED"}', '2026-02-23 14:00:00'),
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED"}', '2026-02-23 16:00:00'),
    ('AO-2026-000501', 'CREDIT_APPROVED', 'sa5_complete_node',
     '{"node_id":"N-4","credit_brief_id":"CBRIEF-000501","credit_outcome":"APPROVED","approved_dce_limit_sgd":10000000,"next_node":"N-5"}', '2026-02-27 14:00:00'),
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa5_complete_node',
     '{"node_id":"N-4","next_node":"N-5","outcome":"CREDIT_APPROVED"}', '2026-02-27 14:00:00'),
    ('AO-2026-000501', 'TMO_CONFIG_COMPLETE', 'sa6_complete_node',
     '{"node_id":"N-5","spec_id":"CSPEC-000501","instruction_id":"TINST-000501","validation_status":"TMO_VALIDATED","systems_validated":["UBIX","SIC","CV"],"next_node":"N-6"}', '2026-03-03 14:00:00'),
    ('AO-2026-000501', 'NODE_COMPLETED', 'sa6_complete_node',
     '{"node_id":"N-5","next_node":"N-6","outcome":"TMO_VALIDATED"}', '2026-03-03 14:00:00'),

    -- Case 502 events
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"MULTI_PRODUCT"}', '2026-02-19 10:05:00'),
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-20 09:00:00'),
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000511","SPEC-000512","SPEC-000513"]}', '2026-02-21 14:00:00'),
    ('AO-2026-000502', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000502","sanctions_status":"POTENTIAL_MATCH","pep_flag_count":1}', '2026-02-24 10:00:00'),
    ('AO-2026-000502', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0072","kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE"}', '2026-02-26 15:00:00'),
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED"}', '2026-02-26 16:00:00'),
    ('AO-2026-000502', 'CREDIT_APPROVED', 'sa5_complete_node',
     '{"node_id":"N-4","credit_brief_id":"CBRIEF-000502","credit_outcome":"APPROVED_WITH_CONDITIONS","approved_dce_limit_sgd":18000000,"conditions_count":2,"next_node":"N-5"}', '2026-03-01 16:00:00'),
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa5_complete_node',
     '{"node_id":"N-4","next_node":"N-5","outcome":"CREDIT_APPROVED_WITH_CONDITIONS"}', '2026-03-01 16:00:00'),
    ('AO-2026-000502', 'TMO_CONFIG_COMPLETE', 'sa6_complete_node',
     '{"node_id":"N-5","spec_id":"CSPEC-000502","instruction_id":"TINST-000502","validation_status":"TMO_VALIDATED","systems_validated":["UBIX","SIC","CV"],"next_node":"N-6"}', '2026-03-05 14:00:00'),
    ('AO-2026-000502', 'NODE_COMPLETED', 'sa6_complete_node',
     '{"node_id":"N-5","next_node":"N-6","outcome":"TMO_VALIDATED"}', '2026-03-05 14:00:00');
