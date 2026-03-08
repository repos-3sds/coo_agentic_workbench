-- DCE Account Opening — SA-4 Seed Data
-- Version: 1.0.0 | Date: 2026-03-07
-- Scope: Two SA-4 test cases at N-3 (KYC/CDD Preparation)
--
-- Case AO-2026-000201: ABC Capital Management Pte Ltd (SGP CORP, INSTITUTIONAL_FUTURES)
--   Standard case — CLEAR sanctions, 2 directors, 1 corporate UBO
--   Test: happy path — entity extraction → screening CLEAR → brief compilation → RM APPROVE
--
-- Case AO-2026-000202: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT, URGENT)
--   Edge case — POTENTIAL_MATCH on one director, conditional ACRA lookup
--   Test: potential match flagged in brief → RM reviews → ENHANCED_DUE_DILIGENCE

USE dce_agent;

-- ============================================
-- 0. submission_raw — stub rows required by FK
--    dce_ao_classification_result.submission_id → dce_ao_submission_raw.submission_id
-- ============================================
INSERT IGNORE INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, sender_email, email_subject,
     received_at, processing_status, attachments_count)
VALUES
    (201, 'AO-2026-000201', 'EMAIL',
     'david.tan@abs.com', 'DCE Account Opening — ABC Capital Management',
     '2026-03-03 08:00:00', 'PROCESSED', 5),
    (202, 'AO-2026-000202', 'EMAIL',
     'michael.wong@abs.com', 'DCE Account Opening — Dragon Phoenix Holdings',
     '2026-03-04 09:30:00', 'PROCESSED', 5);

-- ============================================
-- 1. case_state — two cases at N-3 ACTIVE
-- ============================================
INSERT IGNORE INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts,
     case_type, priority, rm_id, client_name, jurisdiction, sla_deadline,
     created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000201', 'ACTIVE', 'N-3',
     '["N-0","N-1","N-2"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'STANDARD', 'RM-0042',
     'ABC Capital Management Pte Ltd', 'SGP',
     '2026-03-09 17:00:00',
     '2026-03-03 08:00:00', '2026-03-05 11:20:00', NULL, 12),

    ('AO-2026-000202', 'ACTIVE', 'N-3',
     '["N-0","N-1","N-2"]', '[]', '{}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0073',
     'Dragon Phoenix Holdings Ltd', 'HKG',
     '2026-03-07 17:00:00',
     '2026-03-04 09:30:00', '2026-03-06 14:45:00', NULL, 14);

-- ============================================
-- 2. rm_hierarchy — RM details for the cases
-- ============================================
INSERT IGNORE INTO dce_ao_rm_hierarchy
    (case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email, resolution_source)
VALUES
    ('AO-2026-000201', 'RM-0042', 'David Tan Wei Jian',
     'david.tan@abs.com', 'Singapore Main Branch', 'Institutional Desk',
     'RM-MGR-001', 'Janet Lim Pei Ling', 'janet.lim@abs.com', 'HR_SYSTEM'),

    ('AO-2026-000202', 'RM-0073', 'Michael Wong Kai Fong',
     'michael.wong@abs.com', 'Hong Kong Branch', 'Corporate Desk',
     'RM-MGR-002', 'Grace Chan Siu Wai', 'grace.chan@abs.com', 'HR_SYSTEM');

-- ============================================
-- 3. classification_result — account type + entity info
-- ============================================
INSERT IGNORE INTO dce_ao_classification_result
    (case_id, submission_id, account_type, account_type_confidence,
     account_type_reasoning, client_name, client_entity_type, jurisdiction,
     products_requested, priority, priority_reason, sla_deadline,
     classifier_model, priority_model, classified_at)
VALUES
    (
        'AO-2026-000201', 201,
        'INSTITUTIONAL_FUTURES', 0.956,
        'Entity is a Singapore-incorporated investment management company with MAS CMS licence. Products requested (futures, options) align with INSTITUTIONAL_FUTURES classification. Clean AO form with complete entity data.',
        'ABC Capital Management Pte Ltd', 'CORP', 'SGP',
        '["FUTURES","OPTIONS"]',
        'STANDARD', 'Clean submission, complete documents, standard corporate AO',
        '2026-03-09 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-03-03 08:04:12'
    ),
    (
        'AO-2026-000202', 202,
        'MULTI_PRODUCT', 0.941,
        'HKG-incorporated holding company requesting futures, OTC derivatives, and commodities physical products. Multi-product classification. URGENT priority due to client relationship flag.',
        'Dragon Phoenix Holdings Ltd', 'CORP', 'HKG',
        '["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
        'URGENT', 'Key client flagged by RM — multi-product, time-sensitive',
        '2026-03-07 17:00:00',
        'claude-sonnet-4-6', 'claude-haiku-4-5', '2026-03-04 09:34:08'
    );

-- ============================================
-- 4. document_staged — documents for each case
-- ============================================
INSERT IGNORE INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- Case 201: ABC Capital Management
    ('DOC-000201', 'AO-2026-000201', 201,
     'ABC_Capital_AO_Form.pdf', 'application/pdf', 245760,
     'gridfs://ao-documents/c201a1b2c3d4e5f6a7b8c9d0',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
     '2026-03-03 08:00:30', '2026-03-03 08:00:25'),

    ('DOC-000202', 'AO-2026-000201', 201,
     'ACRA_BizProfile_ABCCapital_2026.pdf', 'application/pdf', 184320,
     'gridfs://ao-documents/c202b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
     '2026-03-03 08:00:32', '2026-03-03 08:00:25'),

    ('DOC-000203', 'AO-2026-000201', 201,
     'Director1_NRIC_TanWeiJianDir.pdf', 'application/pdf', 61440,
     'gridfs://ao-documents/c203c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
     '2026-03-03 08:00:34', '2026-03-03 08:00:25'),

    ('DOC-000204', 'AO-2026-000201', 201,
     'Director2_NRIC_LimHuiYing.pdf', 'application/pdf', 61440,
     'gridfs://ao-documents/c204d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
     '2026-03-03 08:00:36', '2026-03-03 08:00:25'),

    ('DOC-000205', 'AO-2026-000201', 201,
     'GTA_v4.2_Signed_ABCCapital.pdf', 'application/pdf', 409600,
     'gridfs://ao-documents/c205e5f6a7b8c9d0e1f2a3b4',
     'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
     '2026-03-03 08:00:38', '2026-03-03 08:00:25'),

    -- Case 202: Dragon Phoenix Holdings
    ('DOC-000211', 'AO-2026-000202', 202,
     'DragonPhoenix_AO_Form.pdf', 'application/pdf', 278528,
     'gridfs://ao-documents/c211f6a7b8c9d0e1f2a3b4c5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
     '2026-03-04 09:30:30', '2026-03-04 09:30:25'),

    ('DOC-000212', 'AO-2026-000202', 202,
     'HKCoR_Certificate_DragonPhoenix.pdf', 'application/pdf', 143360,
     'gridfs://ao-documents/c212a7b8c9d0e1f2a3b4c5d6',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8',
     '2026-03-04 09:30:32', '2026-03-04 09:30:25'),

    ('DOC-000213', 'AO-2026-000202', 202,
     'Director1_HKID_WongSiuMan.pdf', 'application/pdf', 81920,
     'gridfs://ao-documents/c213b8c9d0e1f2a3b4c5d6e7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
     '2026-03-04 09:30:34', '2026-03-04 09:30:25'),

    ('DOC-000214', 'AO-2026-000202', 202,
     'Director2_Passport_LiuZhiwei.pdf', 'application/pdf', 102400,
     'gridfs://ao-documents/c214c9d0e1f2a3b4c5d6e7f8',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0',
     '2026-03-04 09:30:36', '2026-03-04 09:30:25'),

    ('DOC-000215', 'AO-2026-000202', 202,
     'GTA_v4.2_Signed_DragonPhoenix.pdf', 'application/pdf', 409600,
     'gridfs://ao-documents/c215d0e1f2a3b4c5d6e7f8a9',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1',
     '2026-03-04 09:30:38', '2026-03-04 09:30:25');

-- ============================================
-- 5. document_ocr_result — extracted fields
--    (normally populated by SA-2 OCR pipeline;
--     seeded here so SA-4 sa4_get_case_context can read entity data)
-- ============================================
INSERT IGNORE INTO dce_ao_document_ocr_result
    (doc_id, case_id, detected_doc_type, ocr_confidence, extracted_text,
     issuing_authority, issue_date, expiry_date, signatory_names,
     document_language, page_count, has_signatures, has_stamps,
     flagged_for_review, ocr_engine, processing_time_ms, processed_at)
VALUES
    -- Case 201: AO Form (entity data)
    (
        'DOC-000201', 'AO-2026-000201',
        'AO_FORM', 0.982,
        '{"entity_name":"ABC Capital Management Pte Ltd","uen":"202012345K","entity_type":"CORP","jurisdiction":"SGP","lei_number":"5493001234567890ABCD","incorporation_date":"2020-06-15","registered_address":"1 Raffles Place #20-00 One Raffles Place Singapore 048616","operating_address":"1 Raffles Place #20-00 One Raffles Place Singapore 048616","directors":[{"name":"Tan Wei Jian","id_type":"NRIC","id_number":"S8012345A","nationality":"SGP","role":"Director"},{"name":"Lim Hui Ying","id_type":"NRIC","id_number":"S7856789B","nationality":"SGP","role":"Director"}],"beneficial_owners":[{"name":"ABC Global Investments Pte Ltd","percentage":80.0,"jurisdiction":"SGP","entity_type":"CORP"}],"authorised_traders":[{"name":"Tan Wei Jian","designation":"Director","id_number":"S8012345A"}],"products_requested":["FUTURES","OPTIONS"],"mas_cms_licence_number":"CMS100201-1"}',
        'DCE Operations', '2026-03-01', NULL,
        '["Tan Wei Jian","Lim Hui Ying"]',
        'EN', 12, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 3420, '2026-03-03 08:10:00'
    ),
    -- Case 201: ACRA BizProfile (corporate registry data)
    (
        'DOC-000202', 'AO-2026-000201',
        'ACRA_EXTRACT', 0.971,
        '{"uen":"202012345K","entity_name":"ABC Capital Management Pte Ltd","registration_date":"2020-06-15","status":"Live","registered_address":"1 Raffles Place #20-00 Singapore 048616","directors":[{"name":"Tan Wei Jian","id_number":"S8012345A","appointment_date":"2020-06-15"},{"name":"Lim Hui Ying","id_number":"S7856789B","appointment_date":"2021-03-01"}],"shareholders":[{"name":"ABC Global Investments Pte Ltd","shares":80000,"percentage":80.0,"nationality":"SGP"},{"name":"Tan Wei Jian","shares":20000,"percentage":20.0,"nationality":"SGP"}],"paid_up_capital":1000000}',
        'ACRA', '2026-02-15', NULL,
        NULL,
        'EN', 3, FALSE, TRUE, FALSE,
        'Tesseract-4.1', 1850, '2026-03-03 08:12:00'
    ),
    -- Case 202: AO Form (entity data)
    (
        'DOC-000211', 'AO-2026-000202',
        'AO_FORM', 0.968,
        '{"entity_name":"Dragon Phoenix Holdings Ltd","company_number":"HK1234567","entity_type":"CORP","jurisdiction":"HKG","lei_number":"213800XYZABC1234DEFG","incorporation_date":"2018-09-22","registered_address":"Suite 3801 38/F Two Exchange Square 8 Connaught Place Central Hong Kong","directors":[{"name":"Wong Siu Man","id_type":"HKID","id_number":"A1234561","nationality":"HKG","role":"Director"},{"name":"Liu Zhiwei","id_type":"PASSPORT","id_number":"E12345678","nationality":"CHN","role":"Director"}],"beneficial_owners":[{"name":"Dragon Phoenix International Ltd","percentage":100.0,"jurisdiction":"VGB","entity_type":"CORP"}],"authorised_traders":[{"name":"Wong Siu Man","designation":"Director","id_number":"A1234561"}],"products_requested":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]}',
        'DCE Operations', '2026-03-02', NULL,
        '["Wong Siu Man","Liu Zhiwei"]',
        'EN', 14, TRUE, TRUE, FALSE,
        'Tesseract-4.1', 4120, '2026-03-04 09:45:00'
    ),
    -- Case 202: HK CoR Certificate
    (
        'DOC-000212', 'AO-2026-000202',
        'CERTIFICATE_OF_INCUMBENCY', 0.959,
        '{"company_name":"Dragon Phoenix Holdings Ltd","company_number":"HK1234567","registration_date":"2018-09-22","registered_office":"Suite 3801 38/F Two Exchange Square Central Hong Kong","directors":[{"name":"Wong Siu Man","appointment_date":"2018-09-22"},{"name":"Liu Zhiwei","appointment_date":"2019-04-15"}],"shareholders":[{"name":"Dragon Phoenix International Ltd","shares":10000,"percentage":100.0}]}',
        'Hong Kong Companies Registry', '2026-02-20', NULL,
        NULL,
        'EN', 4, FALSE, TRUE, FALSE,
        'Tesseract-4.1', 2100, '2026-03-04 09:47:00'
    );

-- ============================================
-- 6. node_checkpoint — N-0, N-1, N-2 COMPLETE
--    (SA-4 reads N-2 output for specimens + verification status)
-- ============================================
INSERT IGNORE INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status,
     input_snapshot, output_json, context_block_hash,
     started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- Case 201: N-0 (SA-1 Intake)
    (
        'AO-2026-000201', 'N-0', 1, 'COMPLETE',
        '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.david@abs.com","subject":"New DCE AO - ABC Capital Management"}}',
        '{"case_id":"AO-2026-000201","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD","client_name":"ABC Capital Management Pte Ltd","jurisdiction":"SGP","confidence":0.956}',
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
        '2026-03-03 08:00:00', '2026-03-03 08:04:12', 252.0,
        'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1520,"output":480,"total":2000}'
    ),
    -- Case 201: N-1 (SA-2 Document Collection)
    (
        'AO-2026-000201', 'N-1', 1, 'COMPLETE',
        '{"case_id":"AO-2026-000201","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD"}',
        '{"case_id":"AO-2026-000201","checklist_status":"ALL_CLEAR","documents_verified":5,"mandatory_complete":8,"optional_complete":2,"next_node":"N-2"}',
        'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
        '2026-03-03 09:00:00', '2026-03-04 10:15:00', 89100.0,
        'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":2840,"output":720,"total":3560}'
    ),
    -- Case 201: N-2 (SA-3 Signature Verification) — COMPLETE with specimens
    (
        'AO-2026-000201', 'N-2', 1, 'COMPLETE',
        '{"case_id":"AO-2026-000201","mode":"RESUME","hitl_task_id":"HITL-000050"}',
        '{"case_id":"AO-2026-000201","verification_status":"ALL_APPROVED","total_signatories":1,"approved_count":1,"rejected_count":0,"clarify_count":0,"signatories":[{"signatory_id":"SIG-201-001","signatory_name":"Tan Wei Jian","authority_status":"AUTHORISED","confidence_score":88.5,"confidence_tier":"HIGH","outcome":"APPROVED","specimen_id":"SPEC-000201"}],"specimens_stored":["SPEC-000201"],"reviewed_by_officer_id":"DS-0020","reviewed_at":"2026-03-05 11:15:00","next_node":"N-3","verification_notes":"1 signatory verified. HIGH confidence. Specimen stored."}',
        'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
        '2026-03-05 10:00:00', '2026-03-05 11:20:00', 4800.0,
        'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3200,"output":890,"total":4090}'
    ),

    -- Case 202: N-0 (SA-1 Intake)
    (
        'AO-2026-000202', 'N-0', 1, 'COMPLETE',
        '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Dragon Phoenix Holdings Ltd"}}}',
        '{"case_id":"AO-2026-000202","account_type":"MULTI_PRODUCT","priority":"URGENT","client_name":"Dragon Phoenix Holdings Ltd","jurisdiction":"HKG","confidence":0.941}',
        'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
        '2026-03-04 09:30:00', '2026-03-04 09:34:08', 248.0,
        'N-1', NULL, 0, 'claude-sonnet-4-6', '{"input":1680,"output":530,"total":2210}'
    ),
    -- Case 202: N-1 (SA-2 Document Collection)
    (
        'AO-2026-000202', 'N-1', 1, 'COMPLETE',
        '{"case_id":"AO-2026-000202","account_type":"MULTI_PRODUCT","priority":"URGENT"}',
        '{"case_id":"AO-2026-000202","checklist_status":"ALL_CLEAR","documents_verified":5,"mandatory_complete":10,"optional_complete":3,"next_node":"N-2"}',
        'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
        '2026-03-04 10:00:00', '2026-03-05 09:30:00', 83400.0,
        'N-2', NULL, 0, 'claude-sonnet-4-6', '{"input":3120,"output":810,"total":3930}'
    ),
    -- Case 202: N-2 (SA-3 Signature Verification) — COMPLETE
    (
        'AO-2026-000202', 'N-2', 1, 'COMPLETE',
        '{"case_id":"AO-2026-000202","mode":"RESUME","hitl_task_id":"HITL-000051"}',
        '{"case_id":"AO-2026-000202","verification_status":"ALL_APPROVED","total_signatories":1,"approved_count":1,"rejected_count":0,"clarify_count":0,"signatories":[{"signatory_id":"SIG-202-001","signatory_name":"Wong Siu Man","authority_status":"AUTHORISED","confidence_score":91.2,"confidence_tier":"HIGH","outcome":"APPROVED","specimen_id":"SPEC-000211"}],"specimens_stored":["SPEC-000211"],"reviewed_by_officer_id":"DS-0021","reviewed_at":"2026-03-06 14:40:00","next_node":"N-3","verification_notes":"1 signatory verified. HIGH confidence. Specimen stored."}',
        'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
        '2026-03-06 13:00:00', '2026-03-06 14:45:00', 6300.0,
        'N-3', NULL, 0, 'claude-sonnet-4-6', '{"input":3450,"output":920,"total":4370}'
    );

-- ============================================
-- 7. signature_specimen — records from completed N-2
-- ============================================
INSERT IGNORE INTO dce_ao_signature_specimen
    (specimen_id, case_id, signatory_id, signatory_name, entity_id,
     source_doc_id, confidence_score, approving_officer_id, approving_officer_name,
     mongodb_specimen_ref, comparison_overlay_ref, approved_at)
VALUES
    (
        'SPEC-000201', 'AO-2026-000201', 'SIG-201-001',
        'Tan Wei Jian', 'ENTITY-201',
        'DOC-000205', 88.50, 'DS-0020', 'James Ho Boon Kiat',
        'gridfs://sig-specimens/spec201a1b2c3d4e5f6a7b8',
        'gridfs://sig-overlays/ovl201a1b2c3d4e5f6a7b8',
        '2026-03-05 11:15:00'
    ),
    (
        'SPEC-000211', 'AO-2026-000202', 'SIG-202-001',
        'Wong Siu Man', 'ENTITY-202',
        'DOC-000215', 91.20, 'DS-0021', 'Alice Ng Mei Fong',
        'gridfs://sig-specimens/spec211b2c3d4e5f6a7b8c9',
        'gridfs://sig-overlays/ovl211b2c3d4e5f6a7b8c9',
        '2026-03-06 14:40:00'
    );

-- ============================================
-- 8. event_log — prior N-0/N-1/N-2 events
-- ============================================
INSERT IGNORE INTO dce_ao_event_log
    (case_id, event_type, triggered_by, event_payload, triggered_at)
VALUES
    ('AO-2026-000201', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"INSTITUTIONAL_FUTURES"}', '2026-03-03 08:04:12'),
    ('AO-2026-000201', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-03-04 10:15:00'),
    ('AO-2026-000201', 'SIGNATURE_ANALYSED', 'sa3_park_for_hitl',
     '{"node_id":"N-2","hitl_task_id":"HITL-000050","signatory_count":1}', '2026-03-05 10:30:00'),
    ('AO-2026-000201', 'HITL_DECISION_RECEIVED', 'sa3_complete_node',
     '{"node_id":"N-2","reviewed_by":"DS-0020","outcome":"ALL_APPROVED"}', '2026-03-05 11:15:00'),
    ('AO-2026-000201', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000201"]}', '2026-03-05 11:20:00'),

    ('AO-2026-000202', 'NODE_COMPLETED', 'sa1_complete_node',
     '{"node_id":"N-0","next_node":"N-1","account_type":"MULTI_PRODUCT"}', '2026-03-04 09:34:08'),
    ('AO-2026-000202', 'NODE_COMPLETED', 'sa2_complete_node',
     '{"node_id":"N-1","next_node":"N-2","checklist_status":"ALL_CLEAR"}', '2026-03-05 09:30:00'),
    ('AO-2026-000202', 'SIGNATURE_ANALYSED', 'sa3_park_for_hitl',
     '{"node_id":"N-2","hitl_task_id":"HITL-000051","signatory_count":1}', '2026-03-06 13:30:00'),
    ('AO-2026-000202', 'HITL_DECISION_RECEIVED', 'sa3_complete_node',
     '{"node_id":"N-2","reviewed_by":"DS-0021","outcome":"ALL_APPROVED"}', '2026-03-06 14:40:00'),
    ('AO-2026-000202', 'NODE_COMPLETED', 'sa3_complete_node',
     '{"node_id":"N-2","next_node":"N-3","specimens_stored":["SPEC-000211"]}', '2026-03-06 14:45:00');
