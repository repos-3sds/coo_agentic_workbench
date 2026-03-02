"""
Integration test for SA-2 MCP tools against live MariaDB.
Exercises all 8 SA-2 tools in the correct agent iteration order using
seed data from db/005_sa2_seed_reordered.sql.

Seed data reference
-------------------
Cases:
  AO-2026-000101  INSTITUTIONAL_FUTURES / CORP / SGP -- fully complete
  AO-2026-000108  RETAIL_FUTURES / INDIVIDUAL / HKG -- incomplete att1, complete att2

Staged documents:
  DOC-000001  AO Form (case 101)          -- OCR seed exists
  DOC-000002  Corporate Profile (case 101) -- OCR seed exists
  DOC-000022  Individual AO Form (case 108) -- OCR seed exists
  DOC-000023  HKID Copy (case 108)          -- OCR seed exists
  DOC-000029  Electricity Bill (case 108 att2) -- OCR seed exists
  DOC-000030  Employment Letter (case 108 att2) -- OCR seed exists
  DOC-000031  Risk Disclosure (case 108 att2) -- OCR seed exists
  DOC-000032  GTA v4.2 Signed (case 108 att2) -- OCR seed exists

Checklists: 1-6  |  Checklist items: 1-27  |  OCR results: 1-8
Reviews: 1-10    |  Assessments: 1-6       |  GTA validations: 1-3
"""

import sys
import os
import json

# Add src to path so we can import the tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "mcp_servers"))

from config import DB_CONFIG
from sa1_server import (
    # SA-1 tools (used to create a fresh test case)
    sa1_create_case_full,
    sa1_stage_documents_batch,
    # SA-2 tools under test
    sa2_get_document_checklist,
    sa2_extract_document_metadata,
    sa2_validate_document_expiry,
    sa2_flag_document_for_review,
    sa2_send_notification,
    sa2_save_completeness_assessment,
    sa2_save_gta_validation,
    sa2_complete_node,
)

PASS = 0
FAIL = 0


def check(label, result, key="status", expected="success"):
    """Assert that result[key] == expected; tally PASS/FAIL."""
    global PASS, FAIL
    actual = result.get(key) if isinstance(result, dict) else None
    ok = actual == expected
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {label}")
    if not ok:
        print(f"         Expected {key}={expected!r}, got {actual!r}")
        if isinstance(result, dict) and "error" in result:
            print(f"         Error: {result['error']}")
        FAIL += 1
    else:
        PASS += 1
    return ok


def section(title):
    print(f"\n{'-' * 70}")
    print(f"  {title}")
    print(f"{'-' * 70}")


def main():
    global PASS, FAIL
    print("=" * 70)
    print("SA-2 MCP Tools -- Integration Test against MariaDB")
    print(f"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print("=" * 70)

    # ==================================================================
    # SETUP: Create a fresh test case + stage documents for write-tests
    # ==================================================================
    section("SETUP: Create fresh test case for SA-2 write operations")

    import time
    run_ts = int(time.time())  # unique per run to avoid dedup collision

    case_result = sa1_create_case_full(
        submission_source="EMAIL",
        received_at="2026-03-03 09:00:00",
        rm_employee_id="RM-0800",
        email_message_id=f"TEST-SA2-MSG-{run_ts}",
        sender_email="annie.ng@dbs.com",
        email_subject=f"AO - TestFund Capital Partners (run {run_ts})",
        email_body_text=f"Please open a multi-product account for TestFund. Run {run_ts}.",
        attachments_count=3,
        account_type="MULTI_PRODUCT",
        account_type_confidence=0.89,
        account_type_reasoning="Fund entity, multiple product lines.",
        client_name="TestFund Capital Partners",
        client_entity_type="FUND",
        jurisdiction="SGP",
        products_requested='["FUTURES","OTC_DERIVATIVES"]',
        priority="STANDARD",
        priority_reason="Standard fund onboarding",
        sla_deadline="2026-03-06 09:00:00",
        kb_chunks_used='{"KB-1":["chunk-01"],"KB-9":["chunk-01"]}',
        flagged_for_review=False,
        rm_name="Annie Ng",
        rm_email="annie.ng@dbs.com",
        rm_branch="Private Banking SGP",
        rm_desk="DCE Sales Desk SGP",
        rm_manager_id="MGR-0400",
        rm_manager_name="Robert Tan",
        rm_manager_email="robert.tan@dbs.com",
        rm_resolution_source="HR_SYSTEM",
    )
    TEST_CASE_ID = case_result.get("case_id")
    TEST_SUBMISSION_ID = case_result.get("submission_id")
    print(f"  [INFO] Test case created: {TEST_CASE_ID}")
    if case_result.get("status") != "success":
        print(f"  [ERROR] {case_result.get('error')}")
    assert TEST_CASE_ID is not None, f"Setup failed: {case_result.get('error', 'no case_id returned')}"

    # Stage 3 test documents
    docs_result = sa1_stage_documents_batch(
        case_id=TEST_CASE_ID,
        submission_id=TEST_SUBMISSION_ID,
        documents_json=json.dumps([
            {
                "filename": "AO_Form_TestFund.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 250000,
                "storage_url": "gridfs://ao-documents/test-sa2-001",
                "source": "EMAIL_ATTACHMENT",
            },
            {
                "filename": "Corporate_Profile_TestFund.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 600000,
                "storage_url": "gridfs://ao-documents/test-sa2-002",
                "source": "EMAIL_ATTACHMENT",
            },
            {
                "filename": "GTA_v4.2_Signed_TestFund.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 400000,
                "storage_url": "gridfs://ao-documents/test-sa2-003",
                "source": "EMAIL_ATTACHMENT",
            },
        ]),
    )
    staged_docs = docs_result.get("documents_staged", [])
    TEST_DOC_IDS = [d["doc_id"] for d in staged_docs]
    print(f"  [INFO] Staged {len(TEST_DOC_IDS)} docs: {TEST_DOC_IDS}")
    assert len(TEST_DOC_IDS) == 3, "Setup failed: expected 3 staged documents"

    # ==================================================================
    # TOOL 6: sa2_get_document_checklist
    # ==================================================================
    section("TOOL 6: sa2_get_document_checklist -- new FUND/SGP/MULTI_PRODUCT")

    # 6a. Generate checklist for our test case (FUND entity, MULTI_PRODUCT, SGP)
    cl_result = sa2_get_document_checklist(
        case_id=TEST_CASE_ID,
        account_type="MULTI_PRODUCT",
        jurisdiction="SGP",
        entity_type="FUND",
        products_requested='["FUTURES","OTC_DERIVATIVES"]',
        kb_context='{"KB-2":["chunk-01","chunk-33"]}',
    )
    check("Checklist generation succeeds", cl_result)
    checklist_id = cl_result.get("checklist_id")
    print(f"  [INFO] checklist_id: {checklist_id}")
    check("Attempt number is 1 (first attempt)", cl_result, "attempt_number", 1)

    # FUND mandatory: AO_FORM, CERT_INCORP, BOARD_RES, FUND_PPM, FUND_IMA,
    #   FUND_ADMIN_CONF, UBO_DECL, GTA, RISK_DISCLOSURE, MANDATE_LETTER
    # + MULTI_PRODUCT schedules: GTA_SCH_7A, GTA_SCH_9
    # = 12 mandatory
    mandatory_count = cl_result.get("mandatory_count", 0)
    assert mandatory_count == 12, f"Expected 12 mandatory docs, got {mandatory_count}"
    print(f"  [PASS] mandatory_count = {mandatory_count} (FUND + MULTI_PRODUCT schedules)")
    PASS += 1

    # FUND optional: FUND_NAV, BANK_REF = 2
    optional_count = cl_result.get("optional_count", 0)
    assert optional_count == 2, f"Expected 2 optional docs, got {optional_count}"
    print(f"  [PASS] optional_count = {optional_count}")
    PASS += 1

    # Verify mandatory doc type codes include key items
    mand_codes = [d["doc_type_code"] for d in cl_result.get("mandatory_docs", [])]
    for expected_code in ["AO_FORM", "GTA", "GTA_SCH_7A", "GTA_SCH_9", "FUND_PPM"]:
        assert expected_code in mand_codes, f"Missing {expected_code} in mandatory list"
    print(f"  [PASS] Mandatory list includes AO_FORM, GTA, GTA_SCH_7A, GTA_SCH_9, FUND_PPM")
    PASS += 1

    # 6b. Generate checklist for INDIVIDUAL/HKG/RETAIL_FUTURES (matches case 108 pattern)
    print()
    section("TOOL 6: sa2_get_document_checklist -- INDIVIDUAL/HKG/RETAIL_FUTURES")
    cl_indiv = sa2_get_document_checklist(
        case_id=TEST_CASE_ID,      # Re-use same case for attempt 2 test
        account_type="RETAIL_FUTURES",
        jurisdiction="HKG",
        entity_type="INDIVIDUAL",
        products_requested='["FUTURES"]',
    )
    check("INDIVIDUAL checklist succeeds", cl_indiv)
    check("Attempt number is 2 (second checklist for same case)", cl_indiv, "attempt_number", 2)

    # INDIVIDUAL mandatory: AO_FORM, ID_NRIC, PROOF_ADDR, GTA, RISK_DISCLOSURE
    # + RETAIL_FUTURES schedules: GTA_SCH_7A, CKA_FORM
    # + HKG/INDIVIDUAL extras: ID_HKID
    # = 8 mandatory
    indiv_mand = cl_indiv.get("mandatory_count", 0)
    assert indiv_mand == 8, f"Expected 8 mandatory for INDIVIDUAL/HKG, got {indiv_mand}"
    print(f"  [PASS] INDIVIDUAL/HKG mandatory_count = {indiv_mand}")
    PASS += 1

    indiv_codes = [d["doc_type_code"] for d in cl_indiv.get("mandatory_docs", [])]
    assert "ID_HKID" in indiv_codes, "ID_HKID not in INDIVIDUAL/HKG mandatory list"
    print(f"  [PASS] ID_HKID included (HKG jurisdiction extra)")
    PASS += 1

    # ==================================================================
    # TOOL 7: sa2_extract_document_metadata
    # ==================================================================
    section("TOOL 7: sa2_extract_document_metadata -- cached OCR (seed DOC-000001)")

    # 7a. Cached OCR for seed document DOC-000001 (AO Form, case 101)
    ocr_cached = sa2_extract_document_metadata(
        doc_id="DOC-000001",
        case_id="AO-2026-000101",
    )
    check("Cached OCR retrieval succeeds", ocr_cached)
    check("Source is 'cached' (from seed data)", ocr_cached, "source", "cached")
    check("Detected doc type is AO_FORM", ocr_cached, "detected_doc_type", "AO_FORM")
    assert ocr_cached.get("confidence_score", 0) >= 0.95
    print(f"  [PASS] confidence_score = {ocr_cached['confidence_score']} (>=0.95)")
    PASS += 1
    assert ocr_cached.get("has_signatures") is True
    print(f"  [PASS] has_signatures = True")
    PASS += 1
    assert len(ocr_cached.get("signatory_names", [])) >= 2
    print(f"  [PASS] signatory_names: {ocr_cached['signatory_names']}")
    PASS += 1

    # 7b. Cached OCR for seed document DOC-000029 (Address Proof, case 108 att2)
    print()
    section("TOOL 7: sa2_extract_document_metadata -- cached OCR (seed DOC-000029)")
    ocr_addr = sa2_extract_document_metadata(
        doc_id="DOC-000029",
        case_id="AO-2026-000108",
    )
    check("Cached ADDR_PROOF OCR succeeds", ocr_addr)
    check("Detected type is ADDR_PROOF", ocr_addr, "detected_doc_type", "ADDR_PROOF")
    assert "CLP" in (ocr_addr.get("extracted_text") or "")
    print(f"  [PASS] Extracted text contains CLP (electricity bill)")
    PASS += 1

    # 7c. New OCR (mock) for fresh staged document
    print()
    section("TOOL 7: sa2_extract_document_metadata -- new mock OCR")
    ocr_new = sa2_extract_document_metadata(
        doc_id=TEST_DOC_IDS[0],
        case_id=TEST_CASE_ID,
        filename="AO_Form_TestFund.pdf",
        mime_type="application/pdf",
    )
    check("New mock OCR succeeds", ocr_new)
    check("Source is 'new_extraction'", ocr_new, "source", "new_extraction")
    check("Detected doc type is AO_FORM (from filename)", ocr_new, "detected_doc_type", "AO_FORM")
    assert ocr_new.get("confidence_score", 0) >= 0.90
    print(f"  [PASS] confidence = {ocr_new['confidence_score']} (filename-inferred >=0.90)")
    PASS += 1

    # 7d. New OCR for GTA file (filename inference)
    ocr_gta = sa2_extract_document_metadata(
        doc_id=TEST_DOC_IDS[2],
        case_id=TEST_CASE_ID,
        filename="GTA_v4.2_Signed_TestFund.pdf",
    )
    check("GTA mock OCR succeeds", ocr_gta)
    check("Detected doc type is GTA_SIGNED", ocr_gta, "detected_doc_type", "GTA_SIGNED")

    # ==================================================================
    # TOOL 8: sa2_validate_document_expiry
    # ==================================================================
    section("TOOL 8: sa2_validate_document_expiry -- address proof (within 90-day limit)")

    # 8a. Address proof issued 2026-01-15 -> ~47 days old (well within 90-day limit)
    val_addr = sa2_validate_document_expiry(
        doc_id="DOC-000029",
        doc_type="ADDR_PROOF",
        issue_date="2026-01-15",
    )
    check("ADDR_PROOF validation succeeds", val_addr)
    check("Validity status is VALID", val_addr, "validity_status", "VALID")
    assert val_addr.get("days_to_expiry") is not None and val_addr["days_to_expiry"] > 0
    print(f"  [PASS] days_to_expiry = {val_addr['days_to_expiry']} (remaining in 90-day window)")
    PASS += 1
    assert "within" in val_addr.get("validity_notes", "").lower()
    print(f"  [PASS] validity_notes: {val_addr['validity_notes'][:80]}...")
    PASS += 1

    # 8b. Expired address proof (issued > 90 days ago)
    print()
    section("TOOL 8: sa2_validate_document_expiry -- expired address proof")
    val_expired = sa2_validate_document_expiry(
        doc_id="DOC-000029",
        doc_type="ADDR_PROOF",
        issue_date="2025-10-01",
    )
    check("Expired validation returns success", val_expired)
    check("Validity status is EXPIRED", val_expired, "validity_status", "EXPIRED")
    assert "exceeds" in val_expired.get("validity_notes", "").lower()
    print(f"  [PASS] validity_notes: {val_expired['validity_notes'][:80]}...")
    PASS += 1

    # 8c. Certificate of Incorporation -- perpetual validity
    print()
    section("TOOL 8: sa2_validate_document_expiry -- CERT_INCORP (perpetual)")
    val_perp = sa2_validate_document_expiry(
        doc_id="DOC-000002",
        doc_type="CERT_INCORP",
        issue_date="2010-06-15",
        issuing_authority="ACRA",
    )
    check("CERT_INCORP validation succeeds", val_perp)
    check("Perpetual doc is VALID", val_perp, "validity_status", "VALID")
    assert "perpetual" in val_perp.get("validity_notes", "").lower()
    print(f"  [PASS] validity_notes confirms perpetual: {val_perp['validity_notes']}")
    PASS += 1

    # 8d. Income proof within 180-day limit
    print()
    section("TOOL 8: sa2_validate_document_expiry -- INCOME_PROOF (within limit)")
    val_income = sa2_validate_document_expiry(
        doc_id="DOC-000030",
        doc_type="INCOME_PROOF",
        issue_date="2026-02-25",
    )
    check("INCOME_PROOF validation succeeds", val_income)
    check("INCOME_PROOF is VALID", val_income, "validity_status", "VALID")

    # 8e. Document with explicit expiry date (near expiry -- expires in 15 days)
    print()
    section("TOOL 8: sa2_validate_document_expiry -- near expiry (explicit date)")
    from datetime import date, timedelta
    near_expiry_date = (date.today() + timedelta(days=15)).isoformat()
    val_near = sa2_validate_document_expiry(
        doc_id="DOC-000002",
        doc_type="FIN_STMT",
        expiry_date=near_expiry_date,
    )
    check("Near-expiry validation succeeds", val_near)
    check("Validity status is NEAR_EXPIRY", val_near, "validity_status", "NEAR_EXPIRY")
    assert val_near.get("days_to_expiry") == 15
    print(f"  [PASS] days_to_expiry = {val_near['days_to_expiry']}")
    PASS += 1

    # ==================================================================
    # TOOL 9: sa2_flag_document_for_review
    # ==================================================================
    section("TOOL 9: sa2_flag_document_for_review -- ACCEPTED decision")

    # 9a. Accept a document (AO Form for test case)
    review_accept = sa2_flag_document_for_review(
        doc_id=TEST_DOC_IDS[0],
        case_id=TEST_CASE_ID,
        checklist_item_id=cl_result["mandatory_docs"][0]["item_id"],  # AO_FORM item
        attempt_number=1,
        decision="ACCEPTED",
        validity_status="VALID",
        validity_notes="AO Form dated 2026-03-03, within acceptable window",
    )
    check("ACCEPTED review succeeds", review_accept)
    check("Flag status is CLEARED", review_accept, "flag_status", "CLEARED")
    assert review_accept.get("review_id") is not None
    print(f"  [PASS] review_id: {review_accept['review_id']}")
    PASS += 1

    # 9b. Reject a document (expired doc)
    print()
    section("TOOL 9: sa2_flag_document_for_review -- REJECTED decision")
    review_reject = sa2_flag_document_for_review(
        doc_id=TEST_DOC_IDS[1],
        case_id=TEST_CASE_ID,
        checklist_item_id=cl_result["mandatory_docs"][1]["item_id"],  # CERT_INCORP item
        attempt_number=1,
        decision="REQUIRES_RESUBMISSION",
        rejection_reason_code="DOC_EXPIRED",
        rejection_reason_text="Financial statements are older than 18 months",
        resubmission_instructions="Please provide audited financial statements dated within the last 18 months",
        regulatory_reference="MAS AML/CFT Guidelines",
        validity_status="EXPIRED",
        days_to_expiry=0,
        validity_notes="Document issued 2024-01-15 -- 780 days old, exceeds 540-day limit",
    )
    check("REQUIRES_RESUBMISSION review succeeds", review_reject)
    check("Flag status is FLAGGED", review_reject, "flag_status", "FLAGGED")
    check("Decision recorded correctly", review_reject, "decision", "REQUIRES_RESUBMISSION")

    # ==================================================================
    # TOOL 10: sa2_send_notification
    # ==================================================================
    section("TOOL 10: sa2_send_notification -- RM chase (missing docs)")

    # 10a. RM chase for test case (retry 1)
    chase_msg = (
        f"Dear Annie,\n\n"
        f"Regarding case {TEST_CASE_ID} for client TestFund Capital Partners, "
        f"the following mandatory documents are still required:\n\n"
        f"1. Fund Prospectus (PPM)\n"
        f"2. Investment Management Agreement\n"
        f"3. Fund Administrator Confirmation\n"
        f"4. UBO Declaration\n\n"
        f"Please submit within 24 hours.\n\nRegards,\nDCE Document Processing"
    )
    notif_result = sa2_send_notification(
        case_id=TEST_CASE_ID,
        notification_type="RM_CHASE",
        recipients='["RM"]',
        message_text=chase_msg,
        retry_count=1,
        subject=f"[{TEST_CASE_ID}] Missing Documents -- Action Required",
    )
    check("RM chase notification succeeds", notif_result)
    assert notif_result.get("notifications_sent") == 1
    print(f"  [PASS] notifications_sent = 1 (RM only)")
    PASS += 1
    print(f"  [INFO] notification_ids: {notif_result.get('notification_ids')}")

    # 10b. Chase with RM + RM_MANAGER (retry 2 escalation)
    print()
    section("TOOL 10: sa2_send_notification -- escalated chase (RM + Manager)")
    notif_escalated = sa2_send_notification(
        case_id=TEST_CASE_ID,
        notification_type="RM_CHASE",
        recipients='["RM","RM_MANAGER"]',
        message_text="ESCALATION: Missing documents after 2nd reminder.",
        retry_count=2,
        subject=f"[{TEST_CASE_ID}] ESCALATION -- Missing Documents",
    )
    check("Escalated notification succeeds", notif_escalated)
    assert notif_escalated.get("notifications_sent") == 2
    print(f"  [PASS] notifications_sent = 2 (RM + RM_MANAGER)")
    PASS += 1

    # 10c. Notification for seed case AO-2026-000108 (has RM hierarchy data)
    print()
    section("TOOL 10: sa2_send_notification -- seed case AO-2026-000108")
    notif_seed = sa2_send_notification(
        case_id="AO-2026-000108",
        notification_type="DOC_COMPLETE",
        recipients='["RM"]',
        message_text="All mandatory documents received for case AO-2026-000108.",
        subject="[AO-2026-000108] Documents Complete",
    )
    check("Seed case notification succeeds", notif_seed)

    # ==================================================================
    # TOOL 11: sa2_save_completeness_assessment -- INCOMPLETE (chase RM)
    # ==================================================================
    section("TOOL 11: sa2_save_completeness_assessment -- INCOMPLETE (4 docs missing)")

    assess_incomplete = sa2_save_completeness_assessment(
        case_id=TEST_CASE_ID,
        checklist_id=checklist_id,
        attempt_number=1,
        completeness_flag=False,
        mandatory_docs_complete=False,
        optional_docs_complete=False,
        total_mandatory=12,
        matched_mandatory=3,
        total_optional=2,
        matched_optional=0,
        coverage_pct=21.43,
        missing_mandatory='["FUND_PPM","FUND_IMA","FUND_ADMIN_CONF","UBO_DECL","RISK_DISCLOSURE","MANDATE_LETTER","GTA_SCH_7A","GTA_SCH_9","BOARD_RES"]',
        missing_optional='["FUND_NAV","BANK_REF"]',
        rejected_docs="[]",
        rejection_reasons="{}",
        next_node="HITL_RM",
        decision_reasoning="Only 3 of 12 mandatory documents matched. 9 mandatory documents missing. Retry recommended -- composing RM chase.",
        retry_recommended=True,
        sla_pct_consumed=5.5,
        rm_chase_message=chase_msg,
    )
    check("Incomplete assessment succeeds", assess_incomplete)
    assert assess_incomplete.get("assessment_id") is not None
    print(f"  [PASS] assessment_id: {assess_incomplete['assessment_id']}")
    PASS += 1

    # ==================================================================
    # TOOL 11: sa2_save_completeness_assessment -- COMPLETE (all docs matched)
    # ==================================================================
    section("TOOL 11: sa2_save_completeness_assessment -- COMPLETE (all docs present)")

    assess_complete = sa2_save_completeness_assessment(
        case_id=TEST_CASE_ID,
        checklist_id=checklist_id,
        attempt_number=2,
        completeness_flag=True,
        mandatory_docs_complete=True,
        optional_docs_complete=False,
        total_mandatory=12,
        matched_mandatory=12,
        total_optional=2,
        matched_optional=0,
        coverage_pct=85.71,
        missing_mandatory="[]",
        missing_optional='["FUND_NAV","BANK_REF"]',
        rejected_docs="[]",
        rejection_reasons="{}",
        next_node="N-2",
        decision_reasoning="All 12 mandatory docs matched after RM resubmission. Proceeding to KYC/CDD.",
        retry_recommended=False,
        sla_pct_consumed=35.0,
    )
    check("Complete assessment succeeds", assess_complete)
    assert assess_complete.get("assessment_id") is not None
    print(f"  [PASS] assessment_id: {assess_complete['assessment_id']}")
    PASS += 1

    # ==================================================================
    # TOOL 12: sa2_save_gta_validation -- GTA MISSING
    # ==================================================================
    section("TOOL 12: sa2_save_gta_validation -- GTA MISSING (attempt 1)")

    gta_missing = sa2_save_gta_validation(
        case_id=TEST_CASE_ID,
        attempt_number=1,
        gta_version_submitted="",
        gta_version_current="GTA v4.2",
        gta_version_match=False,
        applicable_schedules='["Schedule 7A - Futures","Schedule 9 - OTC Derivatives"]',
        schedules_submitted="[]",
        schedules_missing='["Schedule 7A - Futures","Schedule 9 - OTC Derivatives"]',
        addenda_required='["SGP Addendum"]',
        addenda_submitted="[]",
        addenda_missing='["SGP Addendum"]',
        gta_validation_status="MISSING",
        validation_notes="GTA not submitted. Schedule 7A, Schedule 9, and SGP Addendum all required.",
        kb_chunks_used='{"KB-3":["chunk-01"],"KB-12":["chunk-04"]}',
    )
    check("GTA MISSING validation succeeds", gta_missing)
    assert gta_missing.get("validation_id") is not None
    print(f"  [PASS] validation_id: {gta_missing['validation_id']}")
    PASS += 1

    # ==================================================================
    # TOOL 12: sa2_save_gta_validation -- GTA CURRENT
    # ==================================================================
    section("TOOL 12: sa2_save_gta_validation -- GTA CURRENT (attempt 2)")

    gta_current = sa2_save_gta_validation(
        case_id=TEST_CASE_ID,
        attempt_number=2,
        gta_version_submitted="GTA v4.2",
        gta_version_current="GTA v4.2",
        gta_version_match=True,
        applicable_schedules='["Schedule 7A - Futures","Schedule 9 - OTC Derivatives"]',
        schedules_submitted='["Schedule 7A - Futures","Schedule 9 - OTC Derivatives"]',
        schedules_missing="[]",
        addenda_required='["SGP Addendum"]',
        addenda_submitted='["SGP Addendum"]',
        addenda_missing="[]",
        gta_validation_status="CURRENT",
        validation_notes="GTA v4.2 current. Both schedules signed. SGP Addendum present.",
        kb_chunks_used='{"KB-3":["chunk-01"],"KB-12":["chunk-04","chunk-05"]}',
    )
    check("GTA CURRENT validation succeeds", gta_current)
    assert gta_current.get("validation_id") is not None
    print(f"  [PASS] validation_id: {gta_current['validation_id']}")
    PASS += 1

    # ==================================================================
    # TOOL 13: sa2_complete_node -- FAILED path (retry recommended)
    # ==================================================================
    section("TOOL 13: sa2_complete_node -- FAILED (incomplete docs, retry)")

    n1_fail_output = json.dumps({
        "case_id": TEST_CASE_ID,
        "completeness_flag": False,
        "mandatory_matched": 3,
        "mandatory_total": 12,
        "missing_docs": ["FUND_PPM", "FUND_IMA", "FUND_ADMIN_CONF"],
        "next_action": "HITL_RM",
        "rm_chase_sent": True,
    })

    fail_result = sa2_complete_node(
        case_id=TEST_CASE_ID,
        status="FAILED",
        attempt_number=1,
        input_snapshot=json.dumps({"checklist_id": checklist_id, "attempt": 1}),
        output_json=n1_fail_output,
        started_at="2026-03-03 09:05:00",
        duration_seconds=300.0,
        failure_reason="Incomplete documents -- 9 of 12 mandatory missing. RM chase sent.",
        token_usage='{"input":2500,"output":800,"total":3300}',
        completeness_flag=False,
        next_node_override="HITL_RM",
    )
    check("FAILED node completion succeeds", fail_result)
    check("Next node is HITL_RM (override)", fail_result, "next_node", "HITL_RM")
    check("Node status is FAILED", fail_result, "node_status", "FAILED")
    assert fail_result.get("checkpoint_id") is not None
    print(f"  [PASS] checkpoint_id: {fail_result['checkpoint_id']}")
    PASS += 1
    assert fail_result.get("event_id") is not None
    print(f"  [PASS] event_id: {fail_result['event_id']}")
    PASS += 1

    # ==================================================================
    # TOOL 13: sa2_complete_node -- COMPLETE path (all docs present)
    # ==================================================================
    section("TOOL 13: sa2_complete_node -- COMPLETE (all docs, advance to N-2)")

    n1_success_output = json.dumps({
        "case_id": TEST_CASE_ID,
        "completeness_flag": True,
        "mandatory_matched": 12,
        "mandatory_total": 12,
        "coverage_pct": 85.71,
        "gta_status": "CURRENT",
        "gta_version": "GTA v4.2",
        "next_node": "N-2",
        "decision": "All mandatory documents matched. Proceeding to KYC/CDD.",
    })

    complete_result = sa2_complete_node(
        case_id=TEST_CASE_ID,
        status="COMPLETE",
        attempt_number=2,
        input_snapshot=json.dumps({"checklist_id": checklist_id, "attempt": 2}),
        output_json=n1_success_output,
        started_at="2026-03-03 14:00:00",
        duration_seconds=180.5,
        token_usage='{"input":3000,"output":600,"total":3600}',
        completeness_flag=True,
    )
    check("COMPLETE node completion succeeds", complete_result)
    check("Next node is N-2 (KYC/CDD)", complete_result, "next_node", "N-2")
    check("Node status is COMPLETE", complete_result, "node_status", "COMPLETE")
    assert complete_result.get("checkpoint_id") is not None
    print(f"  [PASS] checkpoint_id: {complete_result['checkpoint_id']}")
    PASS += 1
    assert complete_result.get("event_id") is not None
    print(f"  [PASS] event_id: {complete_result['event_id']}")
    PASS += 1
    assert complete_result.get("case_state_updated") is True
    print(f"  [PASS] case_state_updated = True")
    PASS += 1

    # ==================================================================
    # VERIFY: Case state after N-1 completion
    # ==================================================================
    section("VERIFY: Case state after full SA-2 pipeline")

    import pymysql
    conn = pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)
    try:
        with conn.cursor() as cur:
            # Check case_state
            cur.execute(
                "SELECT current_node, completed_nodes, status "
                "FROM dce_ao_case_state WHERE case_id = %s",
                (TEST_CASE_ID,),
            )
            cs = cur.fetchone()
            assert cs is not None, "Case state not found"
            assert cs["current_node"] == "N-2"
            print(f"  [PASS] current_node = N-2 (advanced to KYC/CDD)")
            PASS += 1

            completed = json.loads(cs["completed_nodes"] or "[]")
            assert "N-0" in completed and "N-1" in completed
            print(f"  [PASS] completed_nodes includes N-0 and N-1: {completed}")
            PASS += 1

            # Check checkpoint count for N-1
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-1'",
                (TEST_CASE_ID,),
            )
            cp_count = cur.fetchone()["cnt"]
            assert cp_count == 2, f"Expected 2 N-1 checkpoints (FAILED + COMPLETE), got {cp_count}"
            print(f"  [PASS] 2 N-1 checkpoints recorded (FAILED att1 + COMPLETE att2)")
            PASS += 1

            # Check event log entries for N-1
            cur.execute(
                "SELECT event_type, from_state, to_state FROM dce_ao_event_log "
                "WHERE case_id = %s AND event_type LIKE 'NODE_%%' "
                "AND from_state LIKE 'N-1%%' ORDER BY event_id",
                (TEST_CASE_ID,),
            )
            events = cur.fetchall()
            assert len(events) == 2, f"Expected 2 N-1 events, got {len(events)}"
            assert events[0]["event_type"] == "NODE_FAILED"
            assert events[1]["event_type"] == "NODE_COMPLETED"
            print(f"  [PASS] 2 N-1 events: NODE_FAILED -> NODE_COMPLETED")
            PASS += 1

            # Check completeness assessments
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_completeness_assessment "
                "WHERE case_id = %s",
                (TEST_CASE_ID,),
            )
            assess_count = cur.fetchone()["cnt"]
            assert assess_count == 2, f"Expected 2 assessments, got {assess_count}"
            print(f"  [PASS] 2 completeness assessments recorded")
            PASS += 1

            # Check GTA validations
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_gta_validation "
                "WHERE case_id = %s",
                (TEST_CASE_ID,),
            )
            gta_count = cur.fetchone()["cnt"]
            assert gta_count == 2, f"Expected 2 GTA validations, got {gta_count}"
            print(f"  [PASS] 2 GTA validations recorded (MISSING + CURRENT)")
            PASS += 1

            # Check document reviews
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_document_review "
                "WHERE case_id = %s",
                (TEST_CASE_ID,),
            )
            rev_count = cur.fetchone()["cnt"]
            assert rev_count == 2, f"Expected 2 reviews, got {rev_count}"
            print(f"  [PASS] 2 document reviews recorded (ACCEPTED + REQUIRES_RESUBMISSION)")
            PASS += 1

            # Check notifications
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_notification_log "
                "WHERE case_id = %s AND node_id = 'N-1'",
                (TEST_CASE_ID,),
            )
            notif_count = cur.fetchone()["cnt"]
            assert notif_count == 3, f"Expected 3 SA-2 notifications, got {notif_count}"
            print(f"  [PASS] 3 SA-2 notifications recorded (1 RM + 2 escalated)")
            PASS += 1

            # Check OCR results for test docs
            cur.execute(
                "SELECT COUNT(*) AS cnt FROM dce_ao_document_ocr_result "
                "WHERE case_id = %s",
                (TEST_CASE_ID,),
            )
            ocr_count = cur.fetchone()["cnt"]
            assert ocr_count >= 2, f"Expected >=2 OCR results, got {ocr_count}"
            print(f"  [PASS] {ocr_count} OCR results for test case (mock extractions)")
            PASS += 1
    finally:
        conn.close()

    # ==================================================================
    # SUMMARY
    # ==================================================================
    print("\n" + "=" * 70)
    total = PASS + FAIL
    print(f"Results: {PASS}/{total} passed, {FAIL} failed")
    if FAIL == 0:
        print("ALL TESTS PASSED")
    else:
        print(f"FAILURES: {FAIL}")
    print("=" * 70)

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
