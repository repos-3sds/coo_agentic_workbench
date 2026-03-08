-- DCE Account Opening — SA-5 Seed Data
-- Version: 1.0.0 | Date: 2026-03-08
-- Scope: Two SA-5 test cases at N-4 (Credit Preparation)
--
-- Case AO-2026-000301: Meridian Asset Management Pte Ltd (SGP CORP, INSTITUTIONAL_FUTURES)
--   Standard case — MEDIUM KYC risk, CLEARED CDD, IRB approach
--   Test: happy path — financial extraction → brief compilation → APPROVED
--
-- Case AO-2026-000302: Pacific Horizon Capital Ltd (HKG CORP, MULTI_PRODUCT, URGENT)
--   Edge case — HIGH KYC risk, ENHANCED_DUE_DILIGENCE, SA approach
--   Test: EDD condition tracked → APPROVED_WITH_CONDITIONS

USE dce_agent;

-- ============================================
-- 0. submission_raw — stub rows required by FK
-- ============================================
INSERT IGNORE INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, sender_email, email_subject,
     received_at, processing_status, attachments_count)
VALUES
    (301, 'AO-2026-000301', 'EMAIL',
     'james.lim@abs.com', 'DCE Account Opening — Meridian Asset Management',
     '2026-02-10 08:00:00', 'PROCESSED', 6),
    (302, 'AO-2026-000302', 'EMAIL',
     'alice.chen@abs.com', 'DCE Account Opening — Pacific Horizon Capital [URGENT]',
     '2026-02-12 09:30:00', 'PROCESSED', 7);

-- ============================================
-- 1. case_state — two cases at N-4 ACTIVE
--    (these cases have completed N-0, N-1, N-2, N-3)
-- ============================================
INSERT IGNORE INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts,
     case_type, priority, rm_id, client_name, jurisdiction, sla_deadline,
     created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000301', 'ACTIVE', 'N-4',
     '["N-0","N-1","N-2","N-3"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'STANDARD', 'RM-0051',
     'Meridian Asset Management Pte Ltd', 'SGP',
     '2026-02-20 17:00:00',
     '2026-02-10 08:00:00', '2026-02-15 16:30:00', NULL, 20),

    ('AO-2026-000302', 'ACTIVE', 'N-4',
     '["N-0","N-1","N-2","N-3"]', '[]', '{}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0087',
     'Pacific Horizon Capital Ltd', 'HKG',
     '2026-02-18 17:00:00',
     '2026-02-12 09:30:00', '2026-02-17 15:00:00', NULL, 22);

-- ============================================
-- 2. rm_hierarchy — RM details
-- ============================================
INSERT IGNORE INTO dce_ao_rm_hierarchy
    (case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email, resolution_source)
VALUES
    ('AO-2026-000301', 'RM-0051', 'James Lim Wei Kiat',
     'james.lim@abs.com', 'Singapore Main Branch', 'Institutional Desk',
     'RM-MGR-003', 'Rachel Ng Bee Leng', 'rachel.ng@abs.com', 'HR_SYSTEM'),

    ('AO-2026-000302', 'RM-0087', 'Alice Chen Mei Ling',
     'alice.chen@abs.com', 'Hong Kong Branch', 'Multi-Asset Desk',
     'RM-MGR-004', 'Henry Kwong Chi Fai', 'henry.kwong@abs.com', 'HR_SYSTEM');

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
        'AO-2026-000301', 301,
        'INSTITUTIONAL_FUTURES', 0.963,
        'Singapore-incorporated asset management company with MAS CMS licence (fund management). Products: FUTURES and OPTIONS. Standard institutional profile with clean document set.',
        'Meridian Asset Management Pte Ltd', 'CORP', 'SGP',
        '["FUTURES","OPTIONS"]',
        'STANDARD', 'Clean submission, complete documents, standard institutional AO',
        '2026-02-20 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-10 08:05:00'
    ),
    (
        'AO-2026-000302', 302,
        'MULTI_PRODUCT', 0.948,
        'HKG-incorporated investment holding company requesting futures, OTC derivatives, and commodities. Multi-product classification. URGENT due to key client relationship and existing trading relationship at another desk.',
        'Pacific Horizon Capital Ltd', 'CORP', 'HKG',
        '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
        'URGENT', 'Existing institutional relationship — expedited processing requested by RM',
        '2026-02-18 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-02-12 09:35:00'
    );

-- ============================================
-- 4. document_staged — 3 financial statement docs per case + other docs
-- ============================================
INSERT IGNORE INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- Case 301: Meridian — AO Form
    ('DOC-000301', 'AO-2026-000301', 301,
     'Meridian_AO_Form.pdf', 'application/pdf', 245760,
     'gridfs://ao-documents/d301a1b2c3d4e5f6a7b8c9d0',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
     '2026-02-10 08:00:30', '2026-02-10 08:00:25'),

    -- Case 301: Financial Statements (3 years)
    ('DOC-000302', 'AO-2026-000301', 301,
     'Meridian_Audited_FS_2024.pdf', 'application/pdf', 512000,
     'gridfs://ao-documents/d302b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
     '2026-02-10 08:00:32', '2026-02-10 08:00:25'),

    ('DOC-000303', 'AO-2026-000301', 301,
     'Meridian_Audited_FS_2023.pdf', 'application/pdf', 498000,
     'gridfs://ao-documents/d303c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
     '2026-02-10 08:00:34', '2026-02-10 08:00:25'),

    ('DOC-000304', 'AO-2026-000301', 301,
     'Meridian_Audited_FS_2022.pdf', 'application/pdf', 476000,
     'gridfs://ao-documents/d304d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
     '2026-02-10 08:00:36', '2026-02-10 08:00:25'),

    -- Case 302: Pacific Horizon — AO Form
    ('DOC-000311', 'AO-2026-000302', 302,
     'PacificHorizon_AO_Form.pdf', 'application/pdf', 278528,
     'gridfs://ao-documents/d311f6a7b8c9d0e1f2a3b4c5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
     '2026-02-12 09:30:30', '2026-02-12 09:30:25'),

    -- Case 302: Financial Statements (2 years available)
    ('DOC-000312', 'AO-2026-000302', 302,
     'PacificHorizon_Audited_FS_2024.pdf', 'application/pdf', 634000,
     'gridfs://ao-documents/d312a7b8c9d0e1f2a3b4c5d6',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
     '2026-02-12 09:30:32', '2026-02-12 09:30:25'),

    ('DOC-000313', 'AO-2026-000302', 302,
     'PacificHorizon_Audited_FS_2023.pdf', 'application/pdf', 601000,
     'gridfs://ao-documents/d313b8c9d0e1f2a3b4c5d6e7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
     '2026-02-12 09:30:34', '2026-02-12 09:30:25');

-- ============================================
-- 5. document_ocr_result — AO form entity data
--    (financial statements are extracted by SA-5 LLM node, not OCR)
-- ============================================
INSERT IGNORE INTO dce_ao_document_ocr_result
    (doc_id, case_id, detected_doc_type, ocr_confidence, extracted_text,
     issuing_authority, issue_date, expiry_date, signatory_names,
     document_language, page_count, has_signatures, has_stamps,
     flagged_for_review, ocr_engine, processing_time_ms, processed_at)
VALUES
    -- Case 301: Meridian AO Form
    (
        'DOC-000301', 'AO-2026-000301',
        'AO_FORM', 0.979,
        '{"entity_name":"Meridian Asset Management Pte Ltd","uen":"202145678M","entity_type":"CORP","jurisdiction":"SGP","lei_number":"549300MERIDIAN01ABCD","incorporation_date":"2021-03-10","registered_address":"80 Raffles Place #32-01 UOB Plaza Singapore 048624","directors":[{"name":"James Lim Wei Kiat","id_type":"NRIC","id_number":"S8234567C","nationality":"SGP","role":"Director"},{"name":"Priya Ramasamy","id_type":"NRIC","id_number":"S8912345D","nationality":"SGP","role":"Director"}],"beneficial_owners":[{"name":"Meridian Global Holdings Pte Ltd","percentage":75.0,"jurisdiction":"SGP","entity_type":"CORP"},{"name":"James Lim Wei Kiat","percentage":25.0,"jurisdiction":"SGP","entity_type":"INDIVIDUAL"}],"authorised_traders":[{"name":"James Lim Wei Kiat","designation":"Director","id_number":"S8234567C"}],"products_requested":["FUTURES","OPTIONS"],"mas_cms_licence_number":"CMS100456-2"}',
        'DCE Operations', '2026-02-08', NULL,
        '["James Lim Wei Kiat","Priya Ramasamy"]',
        'EN', 11, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 3100, '2026-02-10 08:10:00'
    ),
    -- Case 302: Pacific Horizon AO Form
    (
        'DOC-000311', 'AO-2026-000302',
        'AO_FORM', 0.965,
        '{"entity_name":"Pacific Horizon Capital Ltd","company_number":"HK9876543","entity_type":"CORP","jurisdiction":"HKG","lei_number":"213800PACIFIC01XYZAB","incorporation_date":"2017-04-15","registered_address":"Level 25 Gloucester Tower The Landmark 15 Queens Road Central Hong Kong","directors":[{"name":"Henry Fong Ka Wai","id_type":"HKID","id_number":"B2345671","nationality":"HKG","role":"Director"},{"name":"Sophie Laurent","id_type":"PASSPORT","id_number":"FR9876543","nationality":"FRA","role":"Director"},{"name":"Chen Wei","id_type":"PASSPORT","id_number":"G87654321","nationality":"CHN","role":"Director"}],"beneficial_owners":[{"name":"Pacific Horizon International BVI Ltd","percentage":100.0,"jurisdiction":"VGB","entity_type":"CORP"}],"authorised_traders":[{"name":"Henry Fong Ka Wai","designation":"Director","id_number":"B2345671"}],"products_requested":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]}',
        'DCE Operations', '2026-02-10', NULL,
        '["Henry Fong Ka Wai","Sophie Laurent","Chen Wei"]',
        'EN', 15, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 4350, '2026-02-12 09:45:00'
    );

-- ============================================
-- 6. node_checkpoint — N-0 through N-3 COMPLETE
-- ============================================
INSERT IGNORE INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status,
     input_snapshot, output_json, context_block_hash,
     started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- Case 301: N-0
    ('AO-2026-000301', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"james.lim@abs.com","subject":"DCE Account Opening — Meridian Asset Management"}}',
     '{"case_id":"AO-2026-000301","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD","client_name":"Meridian Asset Management Pte Ltd","jurisdiction":"SGP","confidence":0.963}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a301',
     '2026-02-10 08:00:00', '2026-02-10 08:05:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1520,"output":480,"total":2000}'),

    -- Case 301: N-1
    ('AO-2026-000301', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000301","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD"}',
     '{"case_id":"AO-2026-000301","checklist_status":"ALL_CLEAR","documents_verified":6,"mandatory_complete":9,"optional_complete":3,"next_node":"N-2"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b301',
     '2026-02-10 09:00:00', '2026-02-11 10:00:00', 90000.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":2840,"output":720,"total":3560}'),

    -- Case 301: N-2
    ('AO-2026-000301', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000301","mode":"RESUME","hitl_task_id":"HITL-000060"}',
     '{"case_id":"AO-2026-000301","verification_status":"ALL_APPROVED","total_signatories":1,"approved_count":1,"rejected_count":0,"clarify_count":0,"specimens_stored":["SPEC-000301"],"next_node":"N-3"}',
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c301',
     '2026-02-12 09:00:00', '2026-02-12 11:00:00', 7200.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3100,"output":840,"total":3940}'),

    -- Case 301: N-3
    ('AO-2026-000301', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000301","mode":"HITL_REVIEW","hitl_task_id":"HITL-000061"}',
     '{"case_id":"AO-2026-000301","kyc_brief_id":"BRIEF-000301","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000301","sanctions_status":"CLEAR","pep_flags_count":0,"adverse_media_found":false,"names_screened_count":4,"rm_decisions":{"kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED","bcap_clearance":true,"caa_approach":"IRB","recommended_dce_limit_sgd":8000000,"recommended_dce_pce_limit_sgd":3000000,"osca_case_number":"OSCA-2026-003001","limit_exposure_indication":"Estimated monthly trading SGD 800k; medium exposure","rm_id":"RM-0051","decided_at":"2026-02-14 14:00:00"},"next_node":"N-4"}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d301',
     '2026-02-13 09:00:00', '2026-02-15 16:30:00', 202200.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":4200,"output":1100,"total":5300}'),

    -- Case 302: N-0
    ('AO-2026-000302', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"alice.chen@abs.com","subject":"DCE Account Opening — Pacific Horizon Capital [URGENT]"}}',
     '{"case_id":"AO-2026-000302","account_type":"MULTI_PRODUCT","priority":"URGENT","client_name":"Pacific Horizon Capital Ltd","jurisdiction":"HKG","confidence":0.948}',
     'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e302',
     '2026-02-12 09:30:00', '2026-02-12 09:35:00', 300.0,
     'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1680,"output":530,"total":2210}'),

    -- Case 302: N-1
    ('AO-2026-000302', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000302","account_type":"MULTI_PRODUCT","priority":"URGENT"}',
     '{"case_id":"AO-2026-000302","checklist_status":"ALL_CLEAR","documents_verified":7,"mandatory_complete":12,"optional_complete":3,"next_node":"N-2"}',
     'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f302',
     '2026-02-12 10:00:00', '2026-02-13 09:00:00', 82800.0,
     'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":3120,"output":810,"total":3930}'),

    -- Case 302: N-2
    ('AO-2026-000302', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000302","mode":"RESUME","hitl_task_id":"HITL-000062"}',
     '{"case_id":"AO-2026-000302","verification_status":"ALL_APPROVED","total_signatories":1,"approved_count":1,"rejected_count":0,"clarify_count":0,"specimens_stored":["SPEC-000311"],"next_node":"N-3"}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a302',
     '2026-02-13 10:00:00', '2026-02-13 14:00:00', 14400.0,
     'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3450,"output":920,"total":4370}'),

    -- Case 302: N-3
    ('AO-2026-000302', 'N-3', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000302","mode":"HITL_REVIEW","hitl_task_id":"HITL-000063"}',
     '{"case_id":"AO-2026-000302","kyc_brief_id":"BRIEF-000302","brief_url":"https://workbench.dce.internal/kyc-briefs/BRIEF-000302","sanctions_status":"POTENTIAL_MATCH","pep_flags_count":1,"adverse_media_found":true,"names_screened_count":5,"rm_decisions":{"kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE","bcap_clearance":true,"caa_approach":"SA","recommended_dce_limit_sgd":15000000,"recommended_dce_pce_limit_sgd":5000000,"osca_case_number":"OSCA-2026-003002","limit_exposure_indication":"Multi-product; HKG entity with VGB UBO; exposure elevated","rm_id":"RM-0087","decided_at":"2026-02-17 14:30:00"},"next_node":"N-4"}',
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b302',
     '2026-02-14 09:00:00', '2026-02-17 15:00:00', 302400.0,
     'N-4', NULL, 0, 'claude-sonnet-4-6', '{"input":5100,"output":1400,"total":6500}');

-- ============================================
-- 7. signature_specimen records from N-2
-- ============================================
INSERT IGNORE INTO dce_ao_signature_specimen
    (specimen_id, case_id, signatory_id, signatory_name, entity_id,
     source_doc_id, confidence_score, approving_officer_id, approving_officer_name,
     mongodb_specimen_ref, comparison_overlay_ref, approved_at)
VALUES
    ('SPEC-000301', 'AO-2026-000301', 'SIG-301-001',
     'James Lim Wei Kiat', 'ENTITY-301',
     'DOC-000301', 92.50, 'DS-0022', 'Kenneth Tan Boon Huat',
     'gridfs://sig-specimens/spec301a1b2c3d4e5f6a7b8',
     'gridfs://sig-overlays/ovl301a1b2c3d4e5f6a7b8',
     '2026-02-12 10:45:00'),
    ('SPEC-000311', 'AO-2026-000302', 'SIG-302-001',
     'Henry Fong Ka Wai', 'ENTITY-302',
     'DOC-000311', 88.70, 'DS-0023', 'Michelle Yip Wai Ling',
     'gridfs://sig-specimens/spec311b2c3d4e5f6a7b8c9',
     'gridfs://sig-overlays/ovl311b2c3d4e5f6a7b8c9',
     '2026-02-13 13:30:00');

-- ============================================
-- 8. kyc_brief records from completed N-3
--    (SA-5 reads these for context; must exist for FK in rm_kyc_decision)
-- ============================================
INSERT IGNORE INTO dce_ao_kyc_brief
    (brief_id, case_id, attempt_number, entity_legal_name, entity_type,
     incorporation_jurisdiction, sanctions_status, pep_flag_count, adverse_media_found,
     names_screened_count, brief_url, suggested_risk_range, compiled_by_model, compiled_at)
VALUES
    ('BRIEF-000301', 'AO-2026-000301', 1,
     'Meridian Asset Management Pte Ltd', 'CORP', 'SGP',
     'CLEAR', 0, FALSE, 4,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000301',
     'LOW', 'claude-sonnet-4-6', '2026-02-13 14:00:00'),

    ('BRIEF-000302', 'AO-2026-000302', 1,
     'Pacific Horizon Capital Ltd', 'CORP', 'HKG',
     'POTENTIAL_MATCH', 1, TRUE, 5,
     'https://workbench.dce.internal/kyc-briefs/BRIEF-000302',
     'MEDIUM', 'claude-sonnet-4-6', '2026-02-15 10:00:00');

-- ============================================
-- 9. rm_kyc_decision — completed RM decisions from N-3
--    SA-5 reads these; never writes them
-- ============================================
INSERT IGNORE INTO dce_ao_rm_kyc_decision
    (case_id, brief_id,
     kyc_risk_rating, cdd_clearance, bcap_clearance, caa_approach,
     recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
     osca_case_number, limit_exposure_indication,
     additional_conditions, rm_id, rm_name, decided_at)
VALUES
    (
        'AO-2026-000301', 'BRIEF-000301',
        'MEDIUM', 'CLEARED', TRUE, 'IRB',
        8000000.00, 3000000.00,
        'OSCA-2026-003001',
        'Estimated monthly trading SGD 800k; medium exposure; product mix is exchange-traded only',
        NULL,
        'RM-0051', 'James Lim Wei Kiat', '2026-02-14 14:00:00'
    ),
    (
        'AO-2026-000302', 'BRIEF-000302',
        'HIGH', 'ENHANCED_DUE_DILIGENCE', TRUE, 'SA',
        15000000.00, 5000000.00,
        'OSCA-2026-003002',
        'Multi-product exposure; HKG entity with VGB UBO; POTENTIAL_MATCH on director flagged in brief; RM accepts risk with EDD',
        '[{"type":"EDD_REQUIREMENT","description":"Obtain source of funds declaration from UBO — Dragon Phoenix International BVI Ltd","owner":"RM-0087","open_until_date":"2026-03-01"}]',
        'RM-0087', 'Alice Chen Mei Ling', '2026-02-17 14:30:00'
    );

-- ============================================
-- 10. event_log — prior N-0 through N-3 events
-- ============================================
INSERT IGNORE INTO dce_ao_event_log
    (case_id, event_type, triggered_by, event_payload, triggered_at)
VALUES
    ('AO-2026-000301', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"INSTITUTIONAL_FUTURES"}', '2026-02-10 08:05:00'),
    ('AO-2026-000301', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-11 10:00:00'),
    ('AO-2026-000301', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000301"]}', '2026-02-12 11:00:00'),
    ('AO-2026-000301', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000301","sanctions_status":"CLEAR"}', '2026-02-13 14:00:00'),
    ('AO-2026-000301', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0051","kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED"}', '2026-02-14 14:00:00'),
    ('AO-2026-000301', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED","brief_id":"BRIEF-000301"}', '2026-02-15 16:30:00'),
    ('AO-2026-000301', 'RM_KYC_DECISION_CAPTURED', 'sa4_complete_node',
     '{"brief_id":"BRIEF-000301","kyc_risk_rating":"MEDIUM","cdd_clearance":"CLEARED","caa_approach":"IRB","recommended_dce_limit_sgd":8000000,"recommended_dce_pce_limit_sgd":3000000}', '2026-02-15 16:30:00'),

    ('AO-2026-000302', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"MULTI_PRODUCT"}', '2026-02-12 09:35:00'),
    ('AO-2026-000302', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-02-13 09:00:00'),
    ('AO-2026-000302', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000311"]}', '2026-02-13 14:00:00'),
    ('AO-2026-000302', 'KYC_BRIEF_COMPILED', 'sa4_compile_and_submit_kyc_brief',
     '{"node_id":"N-3","brief_id":"BRIEF-000302","sanctions_status":"POTENTIAL_MATCH","pep_flag_count":1}', '2026-02-15 10:00:00'),
    ('AO-2026-000302', 'HITL_DECISION_RECEIVED', 'sa4_complete_node',
     '{"node_id":"N-3","rm_id":"RM-0087","kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE"}', '2026-02-17 14:30:00'),
    ('AO-2026-000302', 'NODE_COMPLETED', 'sa4_complete_node',
     '{"node_id":"N-3","next_node":"N-4","outcome":"RM_DECISION_CAPTURED","brief_id":"BRIEF-000302"}', '2026-02-17 15:00:00'),
    ('AO-2026-000302', 'RM_KYC_DECISION_CAPTURED', 'sa4_complete_node',
     '{"brief_id":"BRIEF-000302","kyc_risk_rating":"HIGH","cdd_clearance":"ENHANCED_DUE_DILIGENCE","caa_approach":"SA","recommended_dce_limit_sgd":15000000,"recommended_dce_pce_limit_sgd":5000000}', '2026-02-17 15:00:00');
