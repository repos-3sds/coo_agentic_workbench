"""
Integration test for SA-1 MCP tools against live MariaDB.
Exercises all 5 tools in the correct agent iteration order.
"""

import sys
import os
import json

# Add src to path so we can import the tools
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "mcp_servers"))

from config import DB_CONFIG
from sa1_server import (
    sa1_get_intake_context,
    sa1_create_case_full,
    sa1_stage_documents_batch,
    sa1_notify_stakeholders,
    sa1_complete_node,
)

PASS = 0
FAIL = 0


def check(label, result, key="status", expected="success"):
    global PASS, FAIL
    actual = result.get(key) if isinstance(result, dict) else None
    ok = actual == expected
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {label}")
    if not ok:
        print(f"         Expected {key}={expected}, got {actual}")
        if "error" in result:
            print(f"         Error: {result['error']}")
        FAIL += 1
    else:
        PASS += 1
    return ok


def main():
    global PASS, FAIL
    print("=" * 70)
    print("SA-1 MCP Tools — Integration Test against MariaDB")
    print(f"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print("=" * 70)

    # ------------------------------------------------------------------
    # TOOL 1: sa1_get_intake_context (new case)
    # ------------------------------------------------------------------
    print("\n--- Tool 1: sa1_get_intake_context (new case) ---")
    ctx = sa1_get_intake_context(case_id="", submission_source="EMAIL")
    check("Returns is_retry=False for new case", ctx, "is_retry", False)
    check("case_state is None for new case", ctx, "case_state", None)
    assert ctx["workflow_spec"]["agent_id"] == "SA-1"
    assert "INSTITUTIONAL_FUTURES" in ctx["enum_reference"]["account_type"]
    print(f"  [PASS] workflow_spec and enum_reference populated")
    PASS += 1

    # ------------------------------------------------------------------
    # TOOL 1: sa1_get_intake_context (retry — existing case)
    # ------------------------------------------------------------------
    print("\n--- Tool 1: sa1_get_intake_context (retry — AO-2026-000101) ---")
    ctx_retry = sa1_get_intake_context(case_id="AO-2026-000101", submission_source="EMAIL")
    check("Returns is_retry=True for existing case", ctx_retry, "is_retry", True)
    assert ctx_retry["case_state"] is not None
    assert ctx_retry["case_state"]["case_id"] == "AO-2026-000101"
    print(f"  [PASS] case_state loaded: {ctx_retry['case_state']['client_name']}")
    PASS += 1
    assert len(ctx_retry["prior_checkpoints"]) > 0
    print(f"  [PASS] prior_checkpoints loaded: {len(ctx_retry['prior_checkpoints'])} entries")
    PASS += 1
    assert len(ctx_retry["prior_events"]) > 0
    print(f"  [PASS] prior_events loaded: {len(ctx_retry['prior_events'])} entries")
    PASS += 1

    # ------------------------------------------------------------------
    # TOOL 2: sa1_create_case_full
    # ------------------------------------------------------------------
    print("\n--- Tool 2: sa1_create_case_full ---")
    case_result = sa1_create_case_full(
        submission_source="EMAIL",
        received_at="2026-03-02 16:00:00",
        rm_employee_id="RM-0200",
        email_message_id="TEST-MSG-001",
        sender_email="rm.test@abs.com",
        email_subject="Test DCE AO - TestCorp Pte Ltd",
        email_body_text="Dear DCE Team, Please initiate AO for TestCorp Pte Ltd.",
        attachments_count=2,
        account_type="INSTITUTIONAL_FUTURES",
        account_type_confidence=0.92,
        account_type_reasoning="Email mentions institutional futures. Corporate entity SGP.",
        client_name="TestCorp Pte Ltd",
        client_entity_type="CORP",
        jurisdiction="SGP",
        products_requested='["FUTURES","OPTIONS"]',
        priority="STANDARD",
        priority_reason="Standard client tier; no urgency flags",
        sla_deadline="2026-03-05 16:00:00",
        kb_chunks_used='{"KB-1":["chunk-01"],"KB-9":["chunk-01"]}',
        flagged_for_review=False,
        rm_name="Test RM",
        rm_email="rm.test@abs.com",
        rm_branch="Test Branch",
        rm_desk="DCE Sales Desk SGP",
        rm_manager_id="MGR-0100",
        rm_manager_name="Test Manager",
        rm_manager_email="mgr.test@abs.com",
        rm_resolution_source="HR_SYSTEM",
    )
    check("Case creation succeeds", case_result)
    case_id = case_result.get("case_id")
    submission_id = case_result.get("submission_id")
    print(f"  [INFO] Created case_id: {case_id}")
    print(f"  [INFO] submission_id: {submission_id}")
    print(f"  [INFO] classification_id: {case_result.get('classification_id')}")
    print(f"  [INFO] assignment_id: {case_result.get('assignment_id')}")
    print(f"  [INFO] events_written: {case_result.get('events_written')}")
    assert case_id is not None and case_id.startswith("AO-2026-")
    PASS += 1
    assert case_result["events_written"] == 3
    print(f"  [PASS] 3 events written (SUBMISSION_RECEIVED, CASE_CLASSIFIED, CASE_CREATED)")
    PASS += 1

    # ------------------------------------------------------------------
    # TOOL 3: sa1_stage_documents_batch
    # ------------------------------------------------------------------
    print("\n--- Tool 3: sa1_stage_documents_batch ---")
    docs_result = sa1_stage_documents_batch(
        case_id=case_id,
        submission_id=submission_id,
        documents_json=json.dumps([
            {
                "filename": "AO_Form_Test.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 200000,
                "storage_url": "gridfs://ao-documents/test001",
                "source": "EMAIL_ATTACHMENT",
            },
            {
                "filename": "Corporate_Profile_Test.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 500000,
                "storage_url": "gridfs://ao-documents/test002",
                "source": "EMAIL_ATTACHMENT",
            },
        ]),
    )
    check("Document staging succeeds", docs_result)
    assert docs_result["total_staged"] == 2
    print(f"  [PASS] 2 documents staged: {[d['doc_id'] for d in docs_result['documents_staged']]}")
    PASS += 1
    assert docs_result["total_bytes"] == 700000
    print(f"  [PASS] Total bytes: {docs_result['total_bytes']}")
    PASS += 1

    # ------------------------------------------------------------------
    # TOOL 4: sa1_notify_stakeholders
    # ------------------------------------------------------------------
    print("\n--- Tool 4: sa1_notify_stakeholders ---")
    notif_result = sa1_notify_stakeholders(
        case_id=case_id,
        notifications_json=json.dumps([
            {
                "notification_type": "CASE_CREATED",
                "channel": "EMAIL",
                "recipient_id": "RM-0200",
                "recipient_email": "rm.test@abs.com",
                "recipient_role": "RM",
                "subject": f"[{case_id}] Case Created -- TestCorp Pte Ltd",
                "body_summary": f"Your DCE AO case has been created. Case ID: {case_id}.",
                "template_id": "TPL-INTAKE-01",
            },
            {
                "notification_type": "CASE_CREATED",
                "channel": "EMAIL",
                "recipient_id": "MGR-0100",
                "recipient_email": "mgr.test@abs.com",
                "recipient_role": "RM_MANAGER",
                "subject": f"[{case_id}] New AO Case -- TestCorp Pte Ltd",
                "body_summary": f"A new STANDARD DCE AO case has been created by RM Test RM.",
                "template_id": "TPL-INTAKE-02",
            },
            {
                "notification_type": "CASE_CREATED",
                "channel": "IN_APP_TOAST",
                "recipient_id": "RM-0200",
                "recipient_role": "RM",
                "subject": f"New case {case_id} created",
                "body_summary": "STANDARD -- TestCorp Pte Ltd -- Institutional Futures.",
                "template_id": "TPL-TOAST-01",
            },
            {
                "notification_type": "CASE_CREATED",
                "channel": "KAFKA_EVENT",
                "recipient_role": "SYSTEM",
                "subject": "ao.case.created",
                "body_summary": json.dumps({
                    "case_id": case_id,
                    "account_type": "INSTITUTIONAL_FUTURES",
                    "priority": "STANDARD",
                    "rm_id": "RM-0200",
                }),
            },
        ]),
    )
    check("Notification dispatch succeeds", notif_result)
    assert notif_result["notifications_sent"] == 4
    print(f"  [PASS] 4 notifications sent: {notif_result['notification_ids']}")
    PASS += 1

    # ------------------------------------------------------------------
    # TOOL 5: sa1_complete_node (SUCCESS path)
    # ------------------------------------------------------------------
    print("\n--- Tool 5: sa1_complete_node (COMPLETE) ---")
    n0_output = json.dumps({
        "case_id": case_id,
        "account_type": "INSTITUTIONAL_FUTURES",
        "priority": "STANDARD",
        "priority_reason": "Standard client tier; no urgency flags",
        "client_name": "TestCorp Pte Ltd",
        "client_entity_type": "CORP",
        "jurisdiction": "SGP",
        "rm_id": "RM-0200",
        "rm_manager_id": "MGR-0100",
        "products_requested": ["FUTURES", "OPTIONS"],
        "next_node": "N-1",
        "confidence": 0.92,
        "intake_notes": "Test case — 2 documents pre-staged.",
    })

    complete_result = sa1_complete_node(
        case_id=case_id,
        status="COMPLETE",
        attempt_number=1,
        input_snapshot=json.dumps({
            "submission_source": "EMAIL",
            "raw_payload": {"sender_email": "rm.test@abs.com"},
        }),
        output_json=n0_output,
        started_at="2026-03-02 16:00:00",
        duration_seconds=120.5,
        token_usage='{"input":1200,"output":350,"total":1550}',
        documents_staged_count=2,
        notifications_sent=True,
    )
    check("Node completion succeeds", complete_result)
    assert complete_result["next_node"] == "N-1"
    print(f"  [PASS] next_node = N-1 (case advanced to SA-2)")
    PASS += 1
    print(f"  [INFO] checkpoint_id: {complete_result.get('checkpoint_id')}")
    print(f"  [INFO] event_id: {complete_result.get('event_id')}")

    # ------------------------------------------------------------------
    # VERIFY: Re-read context for completed case
    # ------------------------------------------------------------------
    print("\n--- Verify: sa1_get_intake_context for completed case ---")
    verify = sa1_get_intake_context(case_id=case_id, submission_source="EMAIL")
    assert verify["case_state"]["current_node"] == "N-1"
    print(f"  [PASS] case_state.current_node = N-1 (advanced)")
    PASS += 1
    assert verify["case_state"]["client_name"] == "TestCorp Pte Ltd"
    print(f"  [PASS] case_state.client_name = TestCorp Pte Ltd")
    PASS += 1

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
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
