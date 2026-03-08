-- DCE Account Opening — Additional SA-1 prerequisite data required by SA-2 seed
-- These cases reached N-1 and are referenced by SA-2 seed data
-- Cases: 104, 105, 106, 108 (101 already exists from SA-1 seed)

USE dce_agent;

-- ============================================
-- 1. Additional case_state records
-- ============================================
INSERT INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts, case_type, priority, rm_id, client_name, jurisdiction, sla_deadline, created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000104', 'ACTIVE', 'N-1', '["N-0"]', '[]', '{}',
     'COMMODITIES_PHYSICAL', 'STANDARD', 'RM-0055',
     'Zhonghua Resources Trading Co Ltd', 'CHN',
     '2026-03-05 11:00:00', '2026-03-02 11:00:00', '2026-03-02 11:03:45', NULL, 4),

    ('AO-2026-000105', 'ACTIVE', 'N-1', '["N-0"]', '[]', '{}',
     'MULTI_PRODUCT', 'URGENT', 'RM-0073',
     'Asiatic Growth Fund LP', 'SGP',
     '2026-03-02 17:00:00', '2026-03-02 09:15:00', '2026-03-02 09:18:30', NULL, 4),

    ('AO-2026-000106', 'ACTIVE', 'N-1', '["N-0"]', '[]', '{}',
     'INSTITUTIONAL_FUTURES', 'STANDARD', 'RM-0091',
     'Pacific Securities Ltd', 'HKG',
     '2026-03-05 15:00:00', '2026-03-02 15:00:00', '2026-03-02 15:01:45', NULL, 4),

    ('AO-2026-000108', 'ACTIVE', 'N-1', '["N-0"]', '[]', '{"N-1":1}',
     'RETAIL_FUTURES', 'STANDARD', 'RM-0134',
     'Li Mei Ling', 'HKG',
     '2026-03-05 08:45:00', '2026-03-02 08:45:00', '2026-03-03 10:18:00', NULL, 6);

-- ============================================
-- 2. Additional submission_raw records
-- ============================================
INSERT INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, email_message_id, sender_email, email_subject, email_body_text, portal_form_id, portal_form_data, rm_employee_id, received_at, processed_at, processing_status, failure_reason, raw_payload_hash, attachments_count, created_at)
VALUES
    (4, 'AO-2026-000104', 'EMAIL',
     'CCMkCIF4YzM2ZDk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4NA',
     'rm.lee@abs.com',
     'New DCE AO - Zhonghua Resources Trading Co Ltd - Commodities Physical',
     'Dear DCE Team, Please initiate AO for Zhonghua Resources Trading Co Ltd. Physical commodities and futures. PRC entity. Docs attached with certified English translations.',
     NULL, NULL, 'RM-0055',
     '2026-03-02 11:00:00', '2026-03-02 11:03:45', 'PROCESSED', NULL,
     'e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5', 5, '2026-03-02 11:00:00'),

    (5, 'AO-2026-000105', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-003',
     '{"client_name":"Asiatic Growth Fund LP","entity_type":"FUND","products":["FUTURES","OTC_DERIVATIVES","COMMODITIES_PHYSICAL"],"jurisdiction":"SGP"}',
     'RM-0073',
     '2026-03-02 09:15:00', '2026-03-02 09:18:30', 'PROCESSED', NULL,
     'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6', 8, '2026-03-02 09:15:00'),

    (6, 'AO-2026-000106', 'EMAIL',
     'DDNkDIG5ZDQ3ZTk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4NQ',
     'rm.chan@abs.com',
     'DCE Account Opening - Pacific Securities Ltd - Institutional Futures HKG',
     'Dear DCE Team, Please open institutional futures account for Pacific Securities Ltd. SFC-licensed FI, HKG jurisdiction. All regulatory docs attached.',
     NULL, NULL, 'RM-0091',
     '2026-03-02 15:00:00', '2026-03-02 15:01:45', 'PROCESSED', NULL,
     'a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7', 4, '2026-03-02 15:00:00'),

    (7, 'AO-2026-000108', 'EMAIL',
     'FFNkFIH7ZDY5ZTk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4Nw',
     'rm.annie@abs.com',
     'New AO - Li Mei Ling - Retail Futures HKG',
     'Dear DCE Team, Please initiate retail futures AO for Li Mei Ling. Individual HKG client. Partial docs attached, remaining to follow.',
     NULL, NULL, 'RM-0134',
     '2026-03-02 08:45:00', '2026-03-02 08:48:30', 'PROCESSED', NULL,
     'c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9', 2, '2026-03-02 08:45:00'),

    -- Submission 8: Case 108 resubmission (portal upload of missing docs)
    (8, 'AO-2026-000108', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260303-001',
     '{"resubmission_for":"AO-2026-000108","documents":["ADDR_PROOF","INCOME_PROOF","RISK_DISCLOSURE","GTA"]}',
     'RM-0134',
     '2026-03-03 10:14:00', '2026-03-03 10:15:05', 'PROCESSED', NULL,
     'd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0', 4, '2026-03-03 10:14:00');

-- ============================================
-- 3. Additional document_staged records
-- ============================================
INSERT INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes, storage_url, storage_bucket, source, upload_status, upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    -- CASE 108 initial submission docs
    ('DOC-000022', 'AO-2026-000108', 7,
     'AO_Form_Individual_LiMeiLing.pdf', 'application/pdf', 184320,
     'gridfs://ao-documents/cc22e5f6a7b8c9d0', 'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     '22e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
     '2026-03-02 08:48:10', '2026-03-02 08:48:05'),

    ('DOC-000023', 'AO-2026-000108', 7,
     'HKID_LiMeiLing.pdf', 'application/pdf', 61440,
     'gridfs://ao-documents/cc23f6a7b8c9d0e1', 'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     '23f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
     '2026-03-02 08:48:12', '2026-03-02 08:48:05');

-- ============================================
-- 4. Additional node_checkpoint records (N-0 COMPLETE for new cases)
-- ============================================
INSERT INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status, input_snapshot, output_json, context_block_hash, started_at, completed_at, duration_seconds, next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    ('AO-2026-000104', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.lee@abs.com","subject":"New DCE AO - Zhonghua Resources"}}',
     '{"case_id":"AO-2026-000104","account_type":"COMMODITIES_PHYSICAL","priority":"STANDARD","client_name":"Zhonghua Resources Trading Co Ltd","jurisdiction":"CHN","confidence":0.91}',
     'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
     '2026-03-02 11:00:00', '2026-03-02 11:03:45', 225.000, 'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1480,"output":420,"total":1900}'),

    ('AO-2026-000105', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Asiatic Growth Fund LP"}}}',
     '{"case_id":"AO-2026-000105","account_type":"MULTI_PRODUCT","priority":"URGENT","client_name":"Asiatic Growth Fund LP","jurisdiction":"SGP","confidence":0.96}',
     'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
     '2026-03-02 09:15:00', '2026-03-02 09:18:30', 210.000, 'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1650,"output":510,"total":2160}'),

    ('AO-2026-000106', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.chan@abs.com","subject":"DCE AO - Pacific Securities Ltd"}}',
     '{"case_id":"AO-2026-000106","account_type":"INSTITUTIONAL_FUTURES","priority":"STANDARD","client_name":"Pacific Securities Ltd","jurisdiction":"HKG","confidence":0.93}',
     'f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1',
     '2026-03-02 15:00:00', '2026-03-02 15:01:45', 105.000, 'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1310,"output":390,"total":1700}'),

    ('AO-2026-000108', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.annie@abs.com","subject":"New AO - Li Mei Ling"}}',
     '{"case_id":"AO-2026-000108","account_type":"RETAIL_FUTURES","priority":"STANDARD","client_name":"Li Mei Ling","jurisdiction":"HKG","confidence":0.88}',
     'a8b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
     '2026-03-02 08:45:00', '2026-03-02 08:48:30', 210.000, 'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1050,"output":340,"total":1390}');
