-- DCE Account Opening — Seed Data
-- Source: DCE_AO_Table_Schemas.md mock data
-- Date: 2026-03-02

USE dce_agent;

-- ============================================
-- 1. dce_ao_case_state (3 rows)
-- ============================================
INSERT INTO dce_ao_case_state
    (case_id, status, current_node, completed_nodes, failed_nodes, retry_counts, case_type, priority, rm_id, client_name, jurisdiction, sla_deadline, created_at, updated_at, hitl_queue, event_count)
VALUES
    ('AO-2026-000101', 'ACTIVE', 'N-1', '["N-0"]', '[]', '{}', 'INSTITUTIONAL_FUTURES', 'URGENT', 'RM-0042', 'ABC Trading Pte Ltd', 'SGP', '2026-03-02 11:30:00', '2026-03-02 09:30:00', '2026-03-02 09:32:15', NULL, 4),
    ('AO-2026-000102', 'ACTIVE', 'N-0', '[]', '[]', '{}', 'OTC_DERIVATIVES', 'STANDARD', 'RM-0118', 'Global Commodities HK Ltd', 'HKG', '2026-03-04 14:00:00', '2026-03-02 14:00:00', '2026-03-02 14:00:00', NULL, 1),
    ('AO-2026-000103', 'ACTIVE', 'N-0', '[]', '[{"node":"N-0","reason":"RM not found in HR system"}]', '{"N-0":1}', 'RETAIL_FUTURES', 'DEFERRED', 'RM-9999', 'Tan Wei Ming', 'SGP', '2026-03-09 10:00:00', '2026-03-02 10:00:00', '2026-03-02 10:05:30', NULL, 2);

-- ============================================
-- 2. dce_ao_node_checkpoint (3 rows)
-- ============================================
INSERT INTO dce_ao_node_checkpoint
    (checkpoint_id, case_id, node_id, attempt_number, status, input_snapshot, output_json, context_block_hash, started_at, completed_at, duration_seconds, next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    (1, 'AO-2026-000101', 'N-0', 1, 'COMPLETE',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"rm.john@dbs.com","subject":"New DCE AO - ABC Trading"}}',
     '{"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","client_name":"ABC Trading Pte Ltd","jurisdiction":"SGP","confidence":0.94}',
     'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
     '2026-03-02 09:30:00', '2026-03-02 09:32:15', 135.200, 'N-1', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1240,"output":380,"total":1620}'),

    (2, 'AO-2026-000102', 'N-0', 1, 'IN_PROGRESS',
     '{"submission_source":"PORTAL","raw_payload":{"form_data_json":{"client_name":"Global Commodities HK Ltd"}}}',
     NULL,
     'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
     '2026-03-02 14:00:00', NULL, NULL, NULL, NULL, 0, 'claude-sonnet-4-6', NULL),

    (3, 'AO-2026-000103', 'N-0', 1, 'FAILED',
     '{"submission_source":"EMAIL","raw_payload":{"sender_email":"unknown@dbs.com"}}',
     NULL,
     'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
     '2026-03-02 10:00:00', '2026-03-02 10:05:30', 330.000, NULL,
     'RM-9999 not found in HR system -- manual assignment required', 1, 'claude-sonnet-4-6',
     '{"input":980,"output":120,"total":1100}');

-- ============================================
-- 3. dce_ao_event_log (5 rows)
-- ============================================
INSERT INTO dce_ao_event_log
    (event_id, case_id, event_type, from_state, to_state, event_payload, triggered_by, triggered_at, kafka_offset)
VALUES
    (1, 'AO-2026-000101', 'SUBMISSION_RECEIVED', NULL, 'N-0:IN_PROGRESS',
     '{"source":"EMAIL","sender":"rm.john@dbs.com","attachments_count":2}',
     'AGENT', '2026-03-02 09:30:00', 10001),

    (2, 'AO-2026-000101', 'CASE_CLASSIFIED', 'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"account_type":"INSTITUTIONAL_FUTURES","confidence":0.94,"priority":"URGENT"}',
     'AGENT', '2026-03-02 09:31:05', 10002),

    (3, 'AO-2026-000101', 'CASE_CREATED', 'N-0:IN_PROGRESS', 'N-0:IN_PROGRESS',
     '{"case_id":"AO-2026-000101","rm_id":"RM-0042","rm_manager_id":"MGR-0012"}',
     'AGENT', '2026-03-02 09:31:30', 10003),

    (4, 'AO-2026-000101', 'NODE_COMPLETED', 'N-0:IN_PROGRESS', 'N-0:COMPLETE',
     '{"next_node":"N-1","documents_staged":2,"notification_sent":true}',
     'AGENT', '2026-03-02 09:32:15', 10004),

    (5, 'AO-2026-000103', 'NODE_FAILED', 'N-0:IN_PROGRESS', 'N-0:FAILED',
     '{"failure":"RM-9999 not found in HR system","retry_count":1,"escalation":"manual_assignment"}',
     'AGENT', '2026-03-02 10:05:30', 10008);

-- ============================================
-- 4. dce_ao_submission_raw (3 rows)
-- ============================================
INSERT INTO dce_ao_submission_raw
    (submission_id, case_id, submission_source, email_message_id, sender_email, email_subject, email_body_text, portal_form_id, portal_form_data, rm_employee_id, received_at, processed_at, processing_status, failure_reason, raw_payload_hash, attachments_count, created_at)
VALUES
    (1, 'AO-2026-000101', 'EMAIL',
     'AAMkAGE2NDI0ZTk3LTg5MjctNGRhNy1hMzk1LWY0YTRlZGRmYjQ3Mg',
     'rm.john@dbs.com',
     'New DCE Account Opening - ABC Trading Pte Ltd',
     'Dear DCE Team, Please initiate AO for ABC Trading Pte Ltd. Institutional futures account. Key contacts attached. Regards, John Tan',
     NULL, NULL, 'RM-0042',
     '2026-03-02 09:30:00', '2026-03-02 09:30:45', 'PROCESSED', NULL,
     'f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a39281706f5e4d3c2b1a09', 2, '2026-03-02 09:30:00'),

    (2, 'AO-2026-000102', 'PORTAL',
     NULL, NULL, NULL, NULL,
     'PF-20260302-007',
     '{"client_name":"Global Commodities HK Ltd","entity_type":"CORP","products":["OTC_DERIVATIVES"],"jurisdiction":"HKG"}',
     'RM-0118',
     '2026-03-02 14:00:00', NULL, 'PROCESSING', NULL,
     'a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4', 3, '2026-03-02 14:00:00'),

    (3, NULL, 'EMAIL',
     'BBNkBHF3YzI1ZDk4LTk4MzItNGViOC1iNDU2LWM1ZDZlZmRmYjU4Mw',
     'unknown@dbs.com',
     'AO Request - Tan Wei Ming',
     'Please open retail futures account for Tan Wei Ming. Individual client, Singapore resident.',
     NULL, NULL, 'RM-9999',
     '2026-03-02 10:00:00', '2026-03-02 10:05:30', 'FAILED',
     'RM-9999 not found in HR system',
     'd6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7', 1, '2026-03-02 10:00:00');

-- ============================================
-- 5. dce_ao_classification_result (3 rows)
-- ============================================
INSERT INTO dce_ao_classification_result
    (classification_id, case_id, submission_id, account_type, account_type_confidence, account_type_reasoning, client_name, client_entity_type, jurisdiction, products_requested, priority, priority_reason, sla_deadline, classifier_model, priority_model, kb_chunks_used, classified_at, flagged_for_review)
VALUES
    (1, 'AO-2026-000101', 1, 'INSTITUTIONAL_FUTURES', 0.940,
     'Email mentions institutional futures trading, corporate entity, SGP domiciled. AO form confirms futures + options products.',
     'ABC Trading Pte Ltd', 'CORP', 'SGP', '["FUTURES","OPTIONS"]',
     'URGENT', 'Client tier: Platinum; RM flagged urgency; regulatory deadline approaching',
     '2026-03-02 11:30:00', 'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-14","chunk-22"],"KB-9":["chunk-03"]}',
     '2026-03-02 09:31:05', FALSE),

    (2, 'AO-2026-000102', 2, 'OTC_DERIVATIVES', 0.880,
     'Portal form explicitly selects OTC Derivatives. Corporate entity in HKG jurisdiction.',
     'Global Commodities HK Ltd', 'CORP', 'HKG', '["OTC_DERIVATIVES","COMMODITIES_PHYSICAL"]',
     'STANDARD', 'Standard client tier; no urgency flags; normal SLA applies',
     '2026-03-04 14:00:00', 'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-08","chunk-31"],"KB-9":["chunk-01"]}',
     '2026-03-02 14:01:20', FALSE),

    (3, 'AO-2026-000103', 3, 'RETAIL_FUTURES', 0.720,
     'Email indicates individual retail client seeking futures trading. Limited product detail -- low confidence.',
     'Tan Wei Ming', 'INDIVIDUAL', 'SGP', '["FUTURES"]',
     'DEFERRED', 'Individual retail; no urgency indicators; deferred processing acceptable',
     '2026-03-09 10:00:00', 'claude-sonnet-4-6', 'claude-haiku-4-5',
     '{"KB-1":["chunk-05"],"KB-9":["chunk-02"]}',
     '2026-03-02 10:02:00', TRUE);

-- ============================================
-- 6. dce_ao_document_staged (5 rows)
-- ============================================
INSERT INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes, storage_url, storage_bucket, source, upload_status, upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    ('DOC-000001', 'AO-2026-000101', 1, 'AO_Form_Signed.pdf', 'application/pdf', 245760,
     'gridfs://ao-documents/66a1b2c3d4e5', 'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', '2026-03-02 09:31:50', '2026-03-02 09:31:45'),

    ('DOC-000002', 'AO-2026-000101', 1, 'Corporate_Profile.pdf', 'application/pdf', 1048576,
     'gridfs://ao-documents/77b2c3d4e5f6', 'ao-documents', 'EMAIL_ATTACHMENT', 'UPLOADED', NULL,
     'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7', '2026-03-02 09:31:55', '2026-03-02 09:31:45'),

    ('DOC-000003', 'AO-2026-000102', 2, 'AO_Application_Form.pdf', 'application/pdf', 512000,
     'gridfs://ao-documents/88c3d4e5f6a7', 'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8', '2026-03-02 14:01:30', '2026-03-02 14:01:25'),

    ('DOC-000004', 'AO-2026-000102', 2, 'Board_Resolution.pdf', 'application/pdf', 204800,
     'gridfs://ao-documents/99d4e5f6a7b8', 'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9', '2026-03-02 14:01:32', '2026-03-02 14:01:25'),

    ('DOC-000005', 'AO-2026-000102', 2, 'Financial_Statements_2025.xlsx',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 3145728,
     'gridfs://ao-documents/aae5f6a7b8c9', 'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED', NULL,
     'c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0', '2026-03-02 14:01:35', '2026-03-02 14:01:25');

-- ============================================
-- 7. dce_ao_rm_hierarchy (2 rows)
-- ============================================
INSERT INTO dce_ao_rm_hierarchy
    (assignment_id, case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk, rm_manager_id, rm_manager_name, rm_manager_email, resolution_source, resolved_at)
VALUES
    (1, 'AO-2026-000101', 'RM-0042', 'John Tan', 'rm.john@dbs.com',
     'Marina Bay Financial Centre', 'DCE Sales Desk SGP',
     'MGR-0012', 'Sarah Lim', 'sarah.lim@dbs.com', 'HR_SYSTEM', '2026-03-02 09:31:25'),

    (2, 'AO-2026-000102', 'RM-0118', 'David Wong', 'david.wong@dbs.com',
     'Central HK Branch', 'DCE Sales Desk HKG',
     'MGR-0045', 'Michael Chan', 'michael.chan@dbs.com', 'PORTAL_PROVIDED', '2026-03-02 14:01:10');

-- ============================================
-- 8. dce_ao_notification_log (4 rows)
-- ============================================
INSERT INTO dce_ao_notification_log
    (notification_id, case_id, node_id, notification_type, channel, recipient_id, recipient_email, recipient_role, subject, body_summary, template_id, delivery_status, failure_reason, retry_count, sent_at, delivered_at, created_at)
VALUES
    (1, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'EMAIL', 'RM-0042', 'rm.john@dbs.com', 'RM',
     '[AO-2026-000101] Case Created -- ABC Trading Pte Ltd',
     'Your DCE Account Opening case has been created. Case ID: AO-2026-000101. Priority: URGENT. SLA Deadline: 2026-03-02 11:30 SGT. View in Workbench...',
     'TPL-INTAKE-01', 'DELIVERED', NULL, 0, '2026-03-02 09:32:10', '2026-03-02 09:32:12', '2026-03-02 09:32:08'),

    (2, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'EMAIL', 'MGR-0012', 'sarah.lim@dbs.com', 'RM_MANAGER',
     '[AO-2026-000101] New AO Case -- ABC Trading Pte Ltd (URGENT)',
     'A new URGENT DCE Account Opening case has been created by RM John Tan. Case ID: AO-2026-000101. Client: ABC Trading Pte Ltd...',
     'TPL-INTAKE-02', 'DELIVERED', NULL, 0, '2026-03-02 09:32:10', '2026-03-02 09:32:14', '2026-03-02 09:32:08'),

    (3, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'IN_APP_TOAST', 'RM-0042', NULL, 'RM',
     'New case AO-2026-000101 created',
     'URGENT -- ABC Trading Pte Ltd -- Institutional Futures. SLA: 2h.',
     'TPL-TOAST-01', 'DELIVERED', NULL, 0, '2026-03-02 09:32:10', '2026-03-02 09:32:10', '2026-03-02 09:32:08'),

    (4, 'AO-2026-000101', 'N-0', 'CASE_CREATED', 'KAFKA_EVENT', NULL, NULL, 'SYSTEM',
     'ao.case.created',
     '{"case_id":"AO-2026-000101","account_type":"INSTITUTIONAL_FUTURES","priority":"URGENT","rm_id":"RM-0042"}',
     NULL, 'SENT', NULL, 0, '2026-03-02 09:32:11', NULL, '2026-03-02 09:32:08');
