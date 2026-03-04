-- DCE Account Opening — SA-3 Signature Verification Agent — Seed Data
-- Version: 1.0.0 | Date: 2026-03-04
-- Scope: SA-3 Signature Verification Agent (Node N-2) seed data
--
-- Scenarios covered:
--   Case 101 (SGP/CORP/URGENT)     : 2 signatories (HIGH + MEDIUM) → both APPROVED → N-3
--   Case 105 (SGP/FUND/URGENT)     : 3 signatories (HIGH + MEDIUM + LOW) → LOW → ESCALATE_COMPLIANCE
--   Case 108 (HKG/INDIVIDUAL/STD)  : 1 signatory (HIGH) → APPROVED → N-3
--
-- Dependencies: Run AFTER 001–005 (SA-1 + SA-2 seed data)

USE dce_agent;

-- ============================================================================
-- 0. PREREQUISITES — SA-1/SA-2 data required before SA-3 seed can execute
-- ============================================================================

-- 0a. Additional staged documents for Case 105 (Asiatic Growth Fund LP)
--     SA-1/SA-2 seeds did not stage execution docs for this case.
--     SA-3 requires signed documents and ID docs for signature extraction.

INSERT INTO dce_ao_document_staged
    (doc_id, case_id, submission_id, filename, mime_type, file_size_bytes,
     storage_url, storage_bucket, source, upload_status,
     upload_failure_reason, checksum_sha256, uploaded_at, created_at)
VALUES
    ('DOC-000010', 'AO-2026-000105', 5,
     'AO_Form_Asiatic_Growth_Fund.pdf', 'application/pdf', 327680,
     'gridfs://ao-documents/aa10b2c3d4e5f6a7b8c9d0e1',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '10a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0',
     '2026-03-02 09:18:10', '2026-03-02 09:18:05'),

    ('DOC-000011', 'AO-2026-000105', 5,
     'Fund_Prospectus_Asiatic_Growth.pdf', 'application/pdf', 2097152,
     'gridfs://ao-documents/bb11c3d4e5f6a7b8c9d0e1f2',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '11b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
     '2026-03-02 09:18:15', '2026-03-02 09:18:05'),

    ('DOC-000012', 'AO-2026-000105', 5,
     'Investment_Management_Agreement.pdf', 'application/pdf', 512000,
     'gridfs://ao-documents/cc12d4e5f6a7b8c9d0e1f2a3',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '12c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
     '2026-03-02 09:18:18', '2026-03-02 09:18:05'),

    ('DOC-000013', 'AO-2026-000105', 5,
     'Board_Resolution_Mandate_Signatory_List.pdf', 'application/pdf', 245760,
     'gridfs://ao-documents/dd13e5f6a7b8c9d0e1f2a3b4',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '13d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
     '2026-03-02 09:18:20', '2026-03-02 09:18:05'),

    ('DOC-000014', 'AO-2026-000105', 5,
     'Passport_Andrew_Ng_Kai_Wen.pdf', 'application/pdf', 81920,
     'gridfs://ao-documents/ee14f6a7b8c9d0e1f2a3b4c5',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '14e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
     '2026-03-02 09:18:22', '2026-03-02 09:18:05'),

    ('DOC-000015', 'AO-2026-000105', 5,
     'Passport_Rachel_Tan_Siew_Mei.pdf', 'application/pdf', 81920,
     'gridfs://ao-documents/ff15a7b8c9d0e1f2a3b4c5d6',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '15f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
     '2026-03-02 09:18:24', '2026-03-02 09:18:05'),

    ('DOC-000016', 'AO-2026-000105', 5,
     'NRIC_Kenneth_Goh_Wee_Liang.pdf', 'application/pdf', 61440,
     'gridfs://ao-documents/0016b8c9d0e1f2a3b4c5d6e7',
     'ao-documents', 'PORTAL_UPLOAD', 'UPLOADED',
     NULL, '16a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
     '2026-03-02 09:18:26', '2026-03-02 09:18:05');

-- 0b. RM hierarchy entries for Cases 105 and 108
--     (Case 101 already has RM hierarchy from SA-1 seed: RM-0042 John Tan)

INSERT INTO dce_ao_rm_hierarchy
    (assignment_id, case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk,
     rm_manager_id, rm_manager_name, rm_manager_email,
     resolution_source, resolved_at)
VALUES
    (3, 'AO-2026-000105', 'RM-0073',
     'Marcus Loh Wei Jie', 'rm.marcus@dbs.com',
     'Marina Bay Financial Centre', 'DCE Sales Desk SGP',
     'MGR-0028', 'Victoria Chen Shu Wen', 'victoria.chen@dbs.com',
     'HR_SYSTEM', '2026-03-02 09:18:30'),

    (4, 'AO-2026-000108', 'RM-0134',
     'Annie Ho Mei Shan', 'rm.annie@dbs.com',
     'Central HK Branch', 'DCE Sales Desk HKG',
     'MGR-0038', 'Gary Yip Kin Wah', 'gary.yip@dbs.com',
     'HR_SYSTEM', '2026-03-02 08:48:30');

-- 0c. N-1 COMPLETE checkpoints for cases advancing to N-2
--     (SA-2 seed data creates SA-2 table rows but not the N-1 checkpoint)

INSERT INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status, input_snapshot, output_json,
     context_block_hash, started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    ('AO-2026-000101', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000101","trigger":"N0_COMPLETE"}',
     '{"case_id":"AO-2026-000101","completeness_flag":true,"mandatory_complete":true,"coverage_pct":72.73,"next_node":"N-2","gta_status":"CURRENT"}',
     'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2',
     '2026-03-02 09:33:00', '2026-03-02 09:35:00', 120.000,
     'N-2', NULL, 0, 'claude-sonnet-4-6',
     '{"input":2450,"output":680,"total":3130}'),

    ('AO-2026-000105', 'N-1', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000105","trigger":"N0_COMPLETE"}',
     '{"case_id":"AO-2026-000105","completeness_flag":true,"mandatory_complete":true,"coverage_pct":75.00,"next_node":"N-2","gta_status":"CURRENT"}',
     'c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3',
     '2026-03-02 09:19:00', '2026-03-02 09:22:00', 180.000,
     'N-2', NULL, 0, 'claude-sonnet-4-6',
     '{"input":3100,"output":820,"total":3920}'),

    ('AO-2026-000108', 'N-1', 2, 'COMPLETE',
     '{"case_id":"AO-2026-000108","trigger":"RM_RESUBMISSION","attempt":2}',
     '{"case_id":"AO-2026-000108","completeness_flag":true,"mandatory_complete":true,"coverage_pct":75.00,"next_node":"N-2","gta_status":"CURRENT"}',
     'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4',
     '2026-03-03 10:15:00', '2026-03-03 10:18:00', 180.000,
     'N-2', NULL, 1, 'claude-sonnet-4-6',
     '{"input":2200,"output":590,"total":2790}');

-- 0d. Advance case_state to current_node=N-2 for cases entering SA-3

UPDATE dce_ao_case_state
SET current_node = 'N-2',
    completed_nodes = '["N-0","N-1"]',
    updated_at = '2026-03-02 09:35:00'
WHERE case_id = 'AO-2026-000101';

UPDATE dce_ao_case_state
SET current_node = 'N-2',
    completed_nodes = '["N-0","N-1"]',
    updated_at = '2026-03-02 09:22:00'
WHERE case_id = 'AO-2026-000105';

UPDATE dce_ao_case_state
SET current_node = 'N-2',
    completed_nodes = '["N-0","N-1"]',
    retry_counts = '{"N-1":1}',
    updated_at = '2026-03-03 10:18:00'
WHERE case_id = 'AO-2026-000108';

-- ============================================================================
-- 1. dce_ao_signature_verification
--    Per-signatory analysis results from SA3.SKL-02/03/04
-- ============================================================================

INSERT INTO dce_ao_signature_verification
    (verification_id, case_id, attempt_number, signatory_id, signatory_name,
     authority_status, role_in_mandate, confidence_score, confidence_tier,
     source_doc_ids, id_doc_ref, comparison_overlay_ref, signature_crop_refs,
     flag_for_review, escalate_immediate, analysed_at)
VALUES
    -- CASE 101: ABC Trading Pte Ltd (SGP/CORP) — 2 signatories, happy path
    (1, 'AO-2026-000101', 1, 'SIG-001', 'John Tan Wei Ming',
     'AUTHORISED', 'Director', 91.50, 'HIGH',
     '["DOC-000001","DOC-000002"]', 'DOC-000002',
     'gridfs://sig-overlays/AO-2026-000101/SIG-001/overlay.png',
     '["gridfs://sig-crops/AO-2026-000101/SIG-001/crop_ao_form.png","gridfs://sig-crops/AO-2026-000101/SIG-001/crop_board_res.png"]',
     FALSE, FALSE, '2026-03-02 09:40:00'),

    (2, 'AO-2026-000101', 1, 'SIG-002', 'Sarah Lim Hui Ying',
     'AUTHORISED', 'Director', 74.20, 'MEDIUM',
     '["DOC-000001"]', 'DOC-000002',
     'gridfs://sig-overlays/AO-2026-000101/SIG-002/overlay.png',
     '["gridfs://sig-crops/AO-2026-000101/SIG-002/crop_ao_form.png"]',
     TRUE, FALSE, '2026-03-02 09:40:15'),

    -- CASE 105: Asiatic Growth Fund LP (SGP/FUND) — 3 signatories, LOW → escalation
    (3, 'AO-2026-000105', 1, 'SIG-003', 'Andrew Ng Kai Wen',
     'AUTHORISED', 'Fund Manager / GP', 88.30, 'HIGH',
     '["DOC-000010","DOC-000012"]', 'DOC-000014',
     'gridfs://sig-overlays/AO-2026-000105/SIG-003/overlay.png',
     '["gridfs://sig-crops/AO-2026-000105/SIG-003/crop_ao_form.png","gridfs://sig-crops/AO-2026-000105/SIG-003/crop_ima.png"]',
     FALSE, FALSE, '2026-03-02 09:26:00'),

    (4, 'AO-2026-000105', 1, 'SIG-004', 'Rachel Tan Siew Mei',
     'AUTHORISED', 'Director / GP', 67.50, 'MEDIUM',
     '["DOC-000010"]', 'DOC-000015',
     'gridfs://sig-overlays/AO-2026-000105/SIG-004/overlay.png',
     '["gridfs://sig-crops/AO-2026-000105/SIG-004/crop_ao_form.png"]',
     TRUE, FALSE, '2026-03-02 09:26:15'),

    (5, 'AO-2026-000105', 1, 'SIG-005', 'Kenneth Goh Wee Liang',
     'AUTHORISED', 'Company Secretary', 42.10, 'LOW',
     '["DOC-000010"]', 'DOC-000016',
     'gridfs://sig-overlays/AO-2026-000105/SIG-005/overlay.png',
     '["gridfs://sig-crops/AO-2026-000105/SIG-005/crop_ao_form.png"]',
     FALSE, TRUE, '2026-03-02 09:26:30'),

    -- CASE 108: Li Mei Ling (HKG/INDIVIDUAL) — 1 signatory, happy path
    (6, 'AO-2026-000108', 1, 'SIG-006', 'Li Mei Ling',
     'AUTHORISED', 'Account Holder', 95.20, 'HIGH',
     '["DOC-000022","DOC-000031","DOC-000032"]', 'DOC-000023',
     'gridfs://sig-overlays/AO-2026-000108/SIG-006/overlay.png',
     '["gridfs://sig-crops/AO-2026-000108/SIG-006/crop_ao_form.png","gridfs://sig-crops/AO-2026-000108/SIG-006/crop_risk_disc.png","gridfs://sig-crops/AO-2026-000108/SIG-006/crop_gta.png"]',
     FALSE, FALSE, '2026-03-03 10:22:00');

-- ============================================================================
-- 2. dce_ao_hitl_review_task
--    Desk Support signature review tasks (Cases 101 + 108 only)
--    Case 105 escalated before HITL — no review task created
-- ============================================================================

INSERT INTO dce_ao_hitl_review_task
    (task_id, case_id, node_id, task_type, assigned_persona, assigned_to_id,
     status, priority, task_payload, deadline,
     decision_payload, decided_by_id, decided_at, created_at, updated_at)
VALUES
    -- CASE 101: HITL DECIDED — both signatories approved by DS-0015
    ('HITL-000042', 'AO-2026-000101', 'N-2',
     'SIGNATURE_REVIEW', 'DESK_SUPPORT', 'DS-0015',
     'DECIDED', 'URGENT',
     '{
        "overall_status": "MIXED_FLAGS",
        "signatory_count": 2,
        "flag_count": 1,
        "signatories": [
            {
                "signatory_id": "SIG-001",
                "name": "John Tan Wei Ming",
                "role": "Director",
                "confidence": 91.5,
                "tier": "HIGH",
                "flag": false,
                "authority_status": "AUTHORISED"
            },
            {
                "signatory_id": "SIG-002",
                "name": "Sarah Lim Hui Ying",
                "role": "Director",
                "confidence": 74.2,
                "tier": "MEDIUM",
                "flag": true,
                "flag_reason": "Medium confidence -- review signature style consistency against ID document",
                "authority_status": "AUTHORISED"
            }
        ],
        "doc_refs": ["DOC-000001", "DOC-000002"],
        "workbench_url": "/workbench/signature-review/HITL-000042",
        "case_context": {
            "client_name": "ABC Trading Pte Ltd",
            "jurisdiction": "SGP",
            "entity_type": "CORP",
            "rm_name": "John Tan"
        }
     }',
     '2026-03-02 13:42:00',
     '{
        "decisions": [
            {
                "signatory_id": "SIG-001",
                "outcome": "APPROVED",
                "notes": "Signature matches ID document -- HIGH confidence. Clear mandate authority as Director."
            },
            {
                "signatory_id": "SIG-002",
                "outcome": "APPROVED",
                "notes": "MEDIUM confidence accepted -- consistent signature style and clear mandate authority as Director."
            }
        ]
     }',
     'DS-0015', '2026-03-02 11:20:00',
     '2026-03-02 09:42:00', '2026-03-02 11:20:00'),

    -- CASE 108: HITL DECIDED — single signatory approved by DS-0022
    ('HITL-000044', 'AO-2026-000108', 'N-2',
     'SIGNATURE_REVIEW', 'DESK_SUPPORT', 'DS-0022',
     'DECIDED', 'STANDARD',
     '{
        "overall_status": "ALL_HIGH",
        "signatory_count": 1,
        "flag_count": 0,
        "signatories": [
            {
                "signatory_id": "SIG-006",
                "name": "Li Mei Ling",
                "role": "Account Holder",
                "confidence": 95.2,
                "tier": "HIGH",
                "flag": false,
                "authority_status": "AUTHORISED"
            }
        ],
        "doc_refs": ["DOC-000022", "DOC-000023", "DOC-000031", "DOC-000032"],
        "workbench_url": "/workbench/signature-review/HITL-000044",
        "case_context": {
            "client_name": "Li Mei Ling",
            "jurisdiction": "HKG",
            "entity_type": "INDIVIDUAL",
            "rm_name": "Annie Ho Mei Shan"
        }
     }',
     '2026-03-04 10:22:00',
     '{
        "decisions": [
            {
                "signatory_id": "SIG-006",
                "outcome": "APPROVED",
                "notes": "HIGH confidence. Single signatory -- individual account. Signature matches HKID."
            }
        ]
     }',
     'DS-0022', '2026-03-03 11:00:00',
     '2026-03-03 10:22:00', '2026-03-03 11:00:00');

-- ============================================================================
-- 3. dce_ao_signature_specimen
--    Approved specimens stored post-HITL (Cases 101 + 108 only)
-- ============================================================================

INSERT INTO dce_ao_signature_specimen
    (specimen_id, case_id, signatory_id, signatory_name, entity_id,
     source_doc_id, confidence_score, approving_officer_id, approving_officer_name,
     mongodb_specimen_ref, comparison_overlay_ref, approved_at)
VALUES
    -- CASE 101: 2 specimens (John Tan + Sarah Lim)
    ('SPEC-000031', 'AO-2026-000101', 'SIG-001', 'John Tan Wei Ming',
     'ENT-ABC-2010', 'DOC-000001', 91.50,
     'DS-0015', 'Marcus Cheong Wei Han',
     'gridfs://sig-specimens/SPEC-000031.png',
     'gridfs://sig-overlays/AO-2026-000101/SIG-001/overlay.png',
     '2026-03-02 11:25:00'),

    ('SPEC-000032', 'AO-2026-000101', 'SIG-002', 'Sarah Lim Hui Ying',
     'ENT-ABC-2010', 'DOC-000001', 74.20,
     'DS-0015', 'Marcus Cheong Wei Han',
     'gridfs://sig-specimens/SPEC-000032.png',
     'gridfs://sig-overlays/AO-2026-000101/SIG-002/overlay.png',
     '2026-03-02 11:25:05'),

    -- CASE 108: 1 specimen (Li Mei Ling — individual account, no entity_id)
    ('SPEC-000033', 'AO-2026-000108', 'SIG-006', 'Li Mei Ling',
     NULL, 'DOC-000022', 95.20,
     'DS-0022', 'Janet Yip Ka Man',
     'gridfs://sig-specimens/SPEC-000033.png',
     'gridfs://sig-overlays/AO-2026-000108/SIG-006/overlay.png',
     '2026-03-03 11:03:00');

-- ============================================================================
-- 4. dce_ao_node_checkpoint — N-2 checkpoints (SA-3 output)
-- ============================================================================

INSERT INTO dce_ao_node_checkpoint
    (case_id, node_id, attempt_number, status, input_snapshot, output_json,
     context_block_hash, started_at, completed_at, duration_seconds,
     next_node, failure_reason, retry_count, agent_model, token_usage)
VALUES
    -- CASE 101: N-2 COMPLETE → N-3
    ('AO-2026-000101', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000101","document_ids":["DOC-000001","DOC-000002"],"company_mandate_id":"DOC-000002","trigger":"CHECKLIST_COMPLETE"}',
     '{
        "case_id": "AO-2026-000101",
        "verification_status": "ALL_APPROVED",
        "total_signatories": 2,
        "approved_count": 2,
        "rejected_count": 0,
        "clarify_count": 0,
        "signatories": [
            {"signatory_id":"SIG-001","signatory_name":"John Tan Wei Ming","authority_status":"AUTHORISED","confidence_score":91.5,"confidence_tier":"HIGH","outcome":"APPROVED","specimen_id":"SPEC-000031","flag_reason":null},
            {"signatory_id":"SIG-002","signatory_name":"Sarah Lim Hui Ying","authority_status":"AUTHORISED","confidence_score":74.2,"confidence_tier":"MEDIUM","outcome":"APPROVED","specimen_id":"SPEC-000032","flag_reason":"MEDIUM confidence accepted -- consistent style; strong mandate authority."}
        ],
        "specimens_stored": ["SPEC-000031","SPEC-000032"],
        "reviewed_by_officer_id": "DS-0015",
        "reviewed_at": "2026-03-02T11:22:00+08:00",
        "next_node": "N-3",
        "verification_notes": "2 signatories verified. Both authorised under company mandate. All specimens stored."
     }',
     'e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
     '2026-03-02 09:36:00', '2026-03-02 11:25:30', 6570.000,
     'N-3', NULL, 0, 'claude-sonnet-4-6',
     '{"input":3200,"output":1450,"total":4650}'),

    -- CASE 105: N-2 ESCALATED → ESCALATE_COMPLIANCE
    ('AO-2026-000105', 'N-2', 1, 'ESCALATED',
     '{"case_id":"AO-2026-000105","document_ids":["DOC-000010","DOC-000011","DOC-000012","DOC-000013"],"company_mandate_id":"DOC-000013","trigger":"CHECKLIST_COMPLETE"}',
     '{
        "case_id": "AO-2026-000105",
        "verification_status": "HAS_REJECTIONS",
        "total_signatories": 3,
        "approved_count": 0,
        "rejected_count": 0,
        "clarify_count": 0,
        "signatories": [
            {"signatory_id":"SIG-003","signatory_name":"Andrew Ng Kai Wen","authority_status":"AUTHORISED","confidence_score":88.3,"confidence_tier":"HIGH","outcome":null,"specimen_id":null,"flag_reason":null},
            {"signatory_id":"SIG-004","signatory_name":"Rachel Tan Siew Mei","authority_status":"AUTHORISED","confidence_score":67.5,"confidence_tier":"MEDIUM","outcome":null,"specimen_id":null,"flag_reason":"Medium confidence -- flagged for review"},
            {"signatory_id":"SIG-005","signatory_name":"Kenneth Goh Wee Liang","authority_status":"AUTHORISED","confidence_score":42.1,"confidence_tier":"LOW","outcome":null,"specimen_id":null,"flag_reason":"LOW confidence -- immediate escalation to Compliance"}
        ],
        "specimens_stored": [],
        "reviewed_by_officer_id": null,
        "reviewed_at": null,
        "next_node": "ESCALATE_COMPLIANCE",
        "verification_notes": "Signatory Kenneth Goh Wee Liang confidence 42.10% below 60% threshold. Immediate escalation to Compliance per KB-5 policy."
     }',
     'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6',
     '2026-03-02 09:23:00', '2026-03-02 09:28:00', 300.000,
     'ESCALATE_COMPLIANCE',
     'Signatory SIG-005 (Kenneth Goh Wee Liang) confidence 42.10% below 60% threshold. Escalated per KB-5 Signature Verification Guidelines.',
     0, 'claude-sonnet-4-6',
     '{"input":2800,"output":920,"total":3720}'),

    -- CASE 108: N-2 COMPLETE → N-3
    ('AO-2026-000108', 'N-2', 1, 'COMPLETE',
     '{"case_id":"AO-2026-000108","document_ids":["DOC-000022","DOC-000023","DOC-000031","DOC-000032"],"company_mandate_id":null,"trigger":"CHECKLIST_COMPLETE"}',
     '{
        "case_id": "AO-2026-000108",
        "verification_status": "ALL_APPROVED",
        "total_signatories": 1,
        "approved_count": 1,
        "rejected_count": 0,
        "clarify_count": 0,
        "signatories": [
            {"signatory_id":"SIG-006","signatory_name":"Li Mei Ling","authority_status":"AUTHORISED","confidence_score":95.2,"confidence_tier":"HIGH","outcome":"APPROVED","specimen_id":"SPEC-000033","flag_reason":null}
        ],
        "specimens_stored": ["SPEC-000033"],
        "reviewed_by_officer_id": "DS-0022",
        "reviewed_at": "2026-03-03T11:00:00+08:00",
        "next_node": "N-3",
        "verification_notes": "1 signatory verified. Individual account -- account holder signature confirmed against HKID. Specimen stored."
     }',
     'a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7',
     '2026-03-03 10:19:00', '2026-03-03 11:03:30', 2670.000,
     'N-3', NULL, 0, 'claude-sonnet-4-6',
     '{"input":1800,"output":680,"total":2480}');

-- ============================================================================
-- 5. dce_ao_event_log — SA-3 lifecycle events
-- ============================================================================

INSERT INTO dce_ao_event_log
    (case_id, event_type, from_state, to_state,
     event_payload, triggered_by, triggered_at, kafka_offset)
VALUES
    -- CASE 101 events
    ('AO-2026-000101', 'SIGNATURE_ANALYSED',
     'N-2:IN_PROGRESS', 'N-2:HITL_PENDING',
     '{"signatory_count":2,"high_count":1,"medium_count":1,"low_count":0,"overall_status":"MIXED_FLAGS"}',
     'AGENT', '2026-03-02 09:42:00', 10020),

    ('AO-2026-000101', 'HITL_DECISION_RECEIVED',
     'N-2:HITL_PENDING', 'N-2:IN_PROGRESS',
     '{"hitl_task_id":"HITL-000042","decided_by":"DS-0015","approved":2,"rejected":0,"clarify":0}',
     'HUMAN:DS-0015', '2026-03-02 11:20:00', 10021),

    ('AO-2026-000101', 'SIGNATURE_APPROVED',
     'N-2:IN_PROGRESS', 'N-2:COMPLETE',
     '{"specimens_stored":["SPEC-000031","SPEC-000032"],"next_node":"N-3"}',
     'AGENT', '2026-03-02 11:25:30', 10022),

    ('AO-2026-000101', 'NODE_COMPLETED',
     'N-2:COMPLETE', 'N-3:PENDING',
     '{"node":"N-2","duration_seconds":6570,"next_node":"N-3","verification_status":"ALL_APPROVED"}',
     'AGENT', '2026-03-02 11:25:30', 10023),

    -- CASE 105 events (escalation — no HITL)
    ('AO-2026-000105', 'SIGNATURE_ANALYSED',
     'N-2:IN_PROGRESS', 'N-2:ESCALATED',
     '{"signatory_count":3,"high_count":1,"medium_count":1,"low_count":1,"overall_status":"HAS_ESCALATIONS","escalated_signatory":"SIG-005","escalated_confidence":42.10}',
     'AGENT', '2026-03-02 09:27:00', 10030),

    ('AO-2026-000105', 'SIGNATURE_ESCALATED',
     'N-2:ESCALATED', 'ESCALATE_COMPLIANCE',
     '{"reason":"Signatory SIG-005 confidence 42.10% below 60% threshold","escalated_to":"COMPLIANCE","signatory_name":"Kenneth Goh Wee Liang"}',
     'AGENT', '2026-03-02 09:28:00', 10031),

    ('AO-2026-000105', 'NODE_FAILED',
     'N-2:ESCALATED', 'ESCALATE_COMPLIANCE',
     '{"node":"N-2","reason":"LOW confidence escalation","duration_seconds":300,"next_node":"ESCALATE_COMPLIANCE"}',
     'AGENT', '2026-03-02 09:28:00', 10032),

    -- CASE 108 events
    ('AO-2026-000108', 'SIGNATURE_ANALYSED',
     'N-2:IN_PROGRESS', 'N-2:HITL_PENDING',
     '{"signatory_count":1,"high_count":1,"medium_count":0,"low_count":0,"overall_status":"ALL_HIGH"}',
     'AGENT', '2026-03-03 10:22:30', 10040),

    ('AO-2026-000108', 'HITL_DECISION_RECEIVED',
     'N-2:HITL_PENDING', 'N-2:IN_PROGRESS',
     '{"hitl_task_id":"HITL-000044","decided_by":"DS-0022","approved":1,"rejected":0,"clarify":0}',
     'HUMAN:DS-0022', '2026-03-03 11:00:00', 10041),

    ('AO-2026-000108', 'SIGNATURE_APPROVED',
     'N-2:IN_PROGRESS', 'N-2:COMPLETE',
     '{"specimens_stored":["SPEC-000033"],"next_node":"N-3"}',
     'AGENT', '2026-03-03 11:03:30', 10042),

    ('AO-2026-000108', 'NODE_COMPLETED',
     'N-2:COMPLETE', 'N-3:PENDING',
     '{"node":"N-2","duration_seconds":2670,"next_node":"N-3","verification_status":"ALL_APPROVED"}',
     'AGENT', '2026-03-03 11:03:30', 10043);

-- ============================================================================
-- 6. dce_ao_notification_log — SA-3 Desk Support notifications
-- ============================================================================

INSERT INTO dce_ao_notification_log
    (case_id, node_id, notification_type, channel,
     recipient_id, recipient_email, recipient_role,
     subject, body_summary, template_id,
     delivery_status, failure_reason, retry_count,
     sent_at, delivered_at, created_at)
VALUES
    -- CASE 101: Desk Support workbench notification
    ('AO-2026-000101', 'N-2', 'SIGNATURE_REVIEW_REQUIRED', 'IN_APP_TOAST',
     'DS-0015', NULL, 'DESK_SUPPORT',
     'Signature Review Required — AO-2026-000101 (URGENT)',
     'Case AO-2026-000101 (ABC Trading Pte Ltd) requires signature verification review. 2 signatories: 1 HIGH, 1 MEDIUM (flagged). Review in Workbench.',
     'TPL-SIG-REVIEW-01',
     'DELIVERED', NULL, 0,
     '2026-03-02 09:42:05', '2026-03-02 09:42:05', '2026-03-02 09:42:00'),

    ('AO-2026-000101', 'N-2', 'SIGNATURE_REVIEW_REQUIRED', 'WORKBENCH_BADGE',
     'DS-0015', NULL, 'DESK_SUPPORT',
     'New Signature Review — HITL-000042',
     'Signature review task HITL-000042 posted to queue. Priority: URGENT. Deadline: 2026-03-02 13:42. Client: ABC Trading Pte Ltd.',
     'TPL-SIG-REVIEW-02',
     'DELIVERED', NULL, 0,
     '2026-03-02 09:42:05', '2026-03-02 09:42:06', '2026-03-02 09:42:00'),

    -- CASE 105: Compliance escalation notification (no Desk Support review)
    ('AO-2026-000105', 'N-2', 'SIGNATURE_ESCALATED', 'EMAIL',
     NULL, 'compliance.dce@dbs.com', 'COMPLIANCE',
     '[ESCALATION] Signature Verification — AO-2026-000105 — LOW Confidence',
     'Case AO-2026-000105 (Asiatic Growth Fund LP) escalated. Signatory Kenneth Goh Wee Liang confidence 42.10% below 60% threshold. Immediate compliance review required.',
     'TPL-SIG-ESCALATE-01',
     'DELIVERED', NULL, 0,
     '2026-03-02 09:28:05', '2026-03-02 09:28:08', '2026-03-02 09:28:00'),

    ('AO-2026-000105', 'N-2', 'SIGNATURE_ESCALATED', 'IN_APP_TOAST',
     NULL, NULL, 'DESK_SUPPORT',
     'Case Escalated — AO-2026-000105 — LOW Confidence Signature',
     'Case AO-2026-000105 has been escalated to Compliance. Signatory Kenneth Goh Wee Liang failed 60% confidence threshold. No Desk Support review required.',
     'TPL-SIG-ESCALATE-02',
     'DELIVERED', NULL, 0,
     '2026-03-02 09:28:05', '2026-03-02 09:28:05', '2026-03-02 09:28:00'),

    -- CASE 108: Desk Support workbench notification
    ('AO-2026-000108', 'N-2', 'SIGNATURE_REVIEW_REQUIRED', 'IN_APP_TOAST',
     'DS-0022', NULL, 'DESK_SUPPORT',
     'Signature Review Required — AO-2026-000108 (STANDARD)',
     'Case AO-2026-000108 (Li Mei Ling) requires signature verification review. 1 signatory: HIGH confidence. Review in Workbench.',
     'TPL-SIG-REVIEW-01',
     'DELIVERED', NULL, 0,
     '2026-03-03 10:22:35', '2026-03-03 10:22:35', '2026-03-03 10:22:30'),

    ('AO-2026-000108', 'N-2', 'SIGNATURE_REVIEW_REQUIRED', 'WORKBENCH_BADGE',
     'DS-0022', NULL, 'DESK_SUPPORT',
     'New Signature Review — HITL-000044',
     'Signature review task HITL-000044 posted to queue. Priority: STANDARD. Deadline: 2026-03-04 10:22. Client: Li Mei Ling.',
     'TPL-SIG-REVIEW-02',
     'DELIVERED', NULL, 0,
     '2026-03-03 10:22:35', '2026-03-03 10:22:36', '2026-03-03 10:22:30');

-- ============================================================================
-- 7. Update case_state to reflect SA-3 completion
-- ============================================================================

-- Case 101: Signatures approved → advance to N-3
UPDATE dce_ao_case_state
SET current_node = 'N-3',
    completed_nodes = '["N-0","N-1","N-2"]',
    updated_at = '2026-03-02 11:25:30',
    event_count = event_count + 4
WHERE case_id = 'AO-2026-000101';

-- Case 105: Escalated to compliance
UPDATE dce_ao_case_state
SET status = 'ESCALATED',
    current_node = 'ESCALATE_COMPLIANCE',
    updated_at = '2026-03-02 09:28:00',
    event_count = event_count + 3
WHERE case_id = 'AO-2026-000105';

-- Case 108: Signatures approved → advance to N-3
UPDATE dce_ao_case_state
SET current_node = 'N-3',
    completed_nodes = '["N-0","N-1","N-2"]',
    updated_at = '2026-03-03 11:03:30',
    event_count = event_count + 4
WHERE case_id = 'AO-2026-000108';
