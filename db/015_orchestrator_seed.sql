-- ============================================================
-- 015_orchestrator_seed.sql
-- Seed data for Domain Orchestrator E2E pipeline test
-- Case AO-2026-000601: Fresh submission (no case_state yet)
-- The Orchestrator creates case_state via SA-1 tools at N-0
-- ============================================================

-- Raw submission for E2E test case
-- sa1_create_case_full reads this via the submission_source/rm_employee_id
-- but actually creates the case fresh. We insert this so the orchestrator
-- knows what entity data to supply to sa1_create_case_full.
INSERT INTO dce_ao_submission_raw (
    submission_id, case_id, submission_source, email_message_id,
    sender_email, email_subject, email_body_text,
    rm_employee_id, received_at, processing_status,
    attachments_count, raw_payload_hash
) VALUES (
    601,
    NULL,  -- case_id is NULL until SA-1 creates the case
    'EMAIL',
    'MSG-ORCH-E2E-001@absbank.com',
    'ranga.bodavalla@absbank.com',
    'New Account Opening Request - Horizon Capital Markets Pte Ltd',
    'Dear DCE Team,\n\nPlease find attached the account opening documentation for our client Horizon Capital Markets Pte Ltd.\n\nEntity Type: Corporate\nJurisdiction: Singapore\nProducts Requested: Futures, Options on Futures\nPriority: Standard\n\nAll mandatory documents are attached including:\n1. Account Opening Form (signed)\n2. Board Resolution\n3. Certificate of Incorporation\n4. Audited Financial Statements (FY2024, FY2025)\n5. Passport copies of authorized signatories\n\nPlease process at your earliest convenience.\n\nBest regards,\nRanga Bodavalla\nRelationship Manager\nABS Bank DCE Division',
    'RM-001',
    '2026-03-09 09:00:00',
    'RECEIVED',
    5,
    SHA2('orch-e2e-test-case-601-horizon-capital', 256)
);
