"""
DCE Account Opening — SA-7 Tool Integration Tests
==================================================
Tests for all 6 SA-7 MCP tools. Run inside the dce_mcp_sa7 container.

Test cases use seed data from db/014_sa7_seed.sql:
  - AO-2026-000501: Stellar Trading Pte Ltd (SGP CORP, FUTURES+OPTIONS)
    -> Standard case: APPROVED, IRB, 10M/4M — welcome kit -> batch -> DONE
  - AO-2026-000502: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT)
    -> Edge case: APPROVED_WITH_CONDITIONS, SA, 18M/6M — 2 conditions

Run command (from project root):
    export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
    docker cp tests/test_sa7_tools.py dce_mcp_sa7:/app/test_sa7_tools.py
    docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \
      dce_mcp_sa7 python /app/test_sa7_tools.py

Expected: 55/55 passed
"""

import sys
import json
import traceback
import datetime

# --- Direct import (same Python env as sa7_server.py) -------------------------
from sa7_server import (
    sa7_get_case_context,
    sa7_generate_welcome_kit,
    sa7_send_notification,
    sa7_send_welcome_kit_batch,
    sa7_complete_case,
    sa7_get_notification_history,
    _get_conn,
)

# --- Test case constants ------------------------------------------------------
TEST_CASE_STANDARD  = "AO-2026-000501"   # Stellar — APPROVED, IRB -> DONE
TEST_CASE_EDD       = "AO-2026-000502"   # Dragon Phoenix — APPROVED_WITH_CONDITIONS -> DONE

KIT_ID_STANDARD  = None   # Set dynamically after T3
KIT_ID_EDD       = None

# --- Tracking -----------------------------------------------------------------
passed = 0
failed = 0
errors = []


def check(description: str, condition: bool, detail: str = ""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  ✓ {description}")
    else:
        failed += 1
        err = f"  ✗ {description}" + (f" — {detail}" if detail else "")
        print(err)
        errors.append(err)


def section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


# --- Cleanup ------------------------------------------------------------------
def cleanup_test_data():
    """Remove SA-7 test data so tests are idempotent between runs."""
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for case_id in (TEST_CASE_STANDARD, TEST_CASE_EDD):
                # Remove SA-7 artefacts
                cursor.execute("DELETE FROM dce_ao_notification_log WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_welcome_kit WHERE case_id = %s", (case_id,))
                cursor.execute(
                    "DELETE FROM dce_ao_node_checkpoint WHERE case_id = %s AND node_id = 'N-6'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_event_log WHERE case_id = %s AND triggered_by LIKE 'sa7%%'",
                    (case_id,),
                )
                # Reset case_state back to N-6 ACTIVE (undo any DONE from prior runs)
                cursor.execute(
                    "UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-6', "
                    "completed_nodes='[\"N-0\",\"N-1\",\"N-2\",\"N-3\",\"N-4\",\"N-5\"]', "
                    "hitl_queue=NULL WHERE case_id = %s",
                    (case_id,),
                )
        conn.commit()
        print("  [cleanup] SA-7 test data cleared for both test cases.")
    finally:
        conn.close()


# --------------------------------------------------------------------------
# T1: sa7_get_case_context — Case 501 (Standard)
# --------------------------------------------------------------------------
def test_t1_get_case_context():
    section("T1: sa7_get_case_context (Case 501 — Stellar, standard)")
    try:
        result = sa7_get_case_context(TEST_CASE_STANDARD)
        check("status is success", result.get("status") == "success")
        check("case_state returned", isinstance(result.get("case_state"), dict))
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_STANDARD)
        check("current_node is N-6",
              result.get("case_state", {}).get("current_node") == "N-6")
        check("case status is ACTIVE",
              result.get("case_state", {}).get("status") == "ACTIVE")
        check("config_spec returned", isinstance(result.get("config_spec"), dict))
        check("config_spec status = TMO_VALIDATED",
              result.get("config_spec", {}).get("status") == "TMO_VALIDATED")
        check("credit_decision returned", isinstance(result.get("credit_decision"), dict))
        check("credit_outcome is APPROVED",
              result.get("credit_decision", {}).get("credit_outcome") == "APPROVED")
        check("system_validation_summary returned",
              isinstance(result.get("system_validation_summary"), dict))
        check("system_validation all_passed = True",
              result.get("system_validation_summary", {}).get("all_passed") is True)
        check("system_validation total_systems = 3",
              result.get("system_validation_summary", {}).get("total_systems") == 3)
        return result
    except Exception as e:
        check("T1 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T2: sa7_get_case_context — Case 502 (EDD / Conditions)
# --------------------------------------------------------------------------
def test_t2_get_case_context_edd():
    section("T2: sa7_get_case_context (Case 502 — Dragon Phoenix, conditions)")
    try:
        result = sa7_get_case_context(TEST_CASE_EDD)
        check("status is success", result.get("status") == "success")
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_EDD)
        check("credit_outcome is APPROVED_WITH_CONDITIONS",
              result.get("credit_decision", {}).get("credit_outcome") == "APPROVED_WITH_CONDITIONS")
        check("confirmed_caa_approach is SA",
              result.get("credit_decision", {}).get("confirmed_caa_approach") == "SA")
        check("conditions present",
              isinstance(result.get("credit_decision", {}).get("conditions"), list)
              and len(result.get("credit_decision", {}).get("conditions", [])) >= 1)
        check("rm_hierarchy returned", isinstance(result.get("rm_hierarchy"), dict))
        return result
    except Exception as e:
        check("T2 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T3: sa7_generate_welcome_kit — Case 501 (Standard)
# --------------------------------------------------------------------------
def test_t3_generate_welcome_kit():
    global KIT_ID_STANDARD
    section("T3: sa7_generate_welcome_kit (Case 501 — Stellar)")
    try:
        result = sa7_generate_welcome_kit(
            case_id=TEST_CASE_STANDARD,
            entity_name="Stellar Trading Pte Ltd",
            entity_type="CORP",
            jurisdiction="SGP",
            account_reference="UBIX-ST-501",
            products_enabled=["FUTURES", "OPTIONS"],
            approved_dce_limit_sgd=10000000.0,
            approved_dce_pce_limit_sgd=4000000.0,
            confirmed_caa_approach="IRB",
            rm_name="Peter Lim Wei Chong",
            rm_email="peter.lim@abs.com",
            rm_phone="+65 6234 5678",
        )
        check("status is success", result.get("status") == "success")
        check("kit_id generated", bool(result.get("kit_id")))
        check("kit_id format WKIT-XXXXXX",
              str(result.get("kit_id", "")).startswith("WKIT-"))
        check("products_enabled = [FUTURES, OPTIONS]",
              result.get("products_enabled") == ["FUTURES", "OPTIONS"])
        check("cqg_login returned", isinstance(result.get("cqg_login"), dict))
        check("cqg_login username = CQG-AO-2026-000501",
              result.get("cqg_login", {}).get("username") == "CQG-AO-2026-000501")
        check("idb_access returned", isinstance(result.get("idb_access"), dict))
        check("rm_contact returned", isinstance(result.get("rm_contact"), dict))
        check("rm_contact email correct",
              result.get("rm_contact", {}).get("email") == "peter.lim@abs.com")
        check("client_services_contact returned",
              isinstance(result.get("client_services_contact"), dict))
        check("conditions is empty list", result.get("conditions") == [])

        KIT_ID_STANDARD = result.get("kit_id")
        print(f"  [info] kit_id={KIT_ID_STANDARD}")
        return result
    except Exception as e:
        check("T3 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T4: sa7_generate_welcome_kit — Case 502 (with conditions)
# --------------------------------------------------------------------------
def test_t4_generate_welcome_kit_edd():
    global KIT_ID_EDD
    section("T4: sa7_generate_welcome_kit (Case 502 — Dragon Phoenix, conditions)")
    try:
        conditions = [
            {
                "type": "EDD_CLOSURE",
                "description": "Source of funds declaration required from Dragon Phoenix International BVI Ltd",
                "owner": "RM-0072",
                "open_until_date": "2026-04-15",
            },
            {
                "type": "CREDIT_CONDITION",
                "description": "OTC derivatives notional capped at SGD 8M until EDD resolved",
                "owner": "CT-004",
                "open_until_date": "2026-04-15",
            },
        ]
        result = sa7_generate_welcome_kit(
            case_id=TEST_CASE_EDD,
            entity_name="Dragon Phoenix Holdings Ltd",
            entity_type="CORP",
            jurisdiction="HKG",
            account_reference="UBIX-DP-502",
            products_enabled=["FUTURES", "OPTIONS", "OTC_DERIVATIVES"],
            approved_dce_limit_sgd=18000000.0,
            approved_dce_pce_limit_sgd=6000000.0,
            confirmed_caa_approach="SA",
            rm_name="Grace Ho Mei Ling",
            rm_email="grace.ho@abs.com",
            rm_phone="+852 3456 7890",
            conditions=conditions,
        )
        check("status is success", result.get("status") == "success")
        check("kit_id generated", bool(result.get("kit_id")))
        check("kit_id format WKIT-XXXXXX",
              str(result.get("kit_id", "")).startswith("WKIT-"))
        check("products_enabled has 3 items",
              len(result.get("products_enabled", [])) == 3)
        check("conditions_count = 2",
              len(result.get("conditions", [])) == 2)
        check("cqg_login username = CQG-AO-2026-000502",
              result.get("cqg_login", {}).get("username") == "CQG-AO-2026-000502")

        KIT_ID_EDD = result.get("kit_id")
        print(f"  [info] kit_id={KIT_ID_EDD}")
        return result
    except Exception as e:
        check("T4 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T5: sa7_send_welcome_kit_batch — Case 501
# --------------------------------------------------------------------------
def test_t5_send_welcome_kit_batch():
    section("T5: sa7_send_welcome_kit_batch (Case 501 — Stellar)")
    try:
        result = sa7_send_welcome_kit_batch(
            case_id=TEST_CASE_STANDARD,
            kit_id=KIT_ID_STANDARD,
            entity_name="Stellar Trading Pte Ltd",
            rm_id="RM-0071",
            rm_name="Peter Lim Wei Chong",
            rm_email="peter.lim@abs.com",
            customer_email="david.tan@abs.com",
        )
        check("status is success", result.get("status") == "success")
        check("batch_size = 5", result.get("batch_size") == 5)
        check("notification_ids has 5 items",
              len(result.get("notification_ids", [])) == 5)
        check("customer_notified = True", result.get("customer_notified") is True)
        check("rm_notified = True", result.get("rm_notified") is True)
        check("ops_notified = True", result.get("ops_notified") is True)

        # Verify channels via notification history
        history = sa7_get_notification_history(TEST_CASE_STANDARD)
        channels_used = set(n.get("channel") for n in history.get("notifications", []))
        check("channels include EMAIL", "EMAIL" in channels_used)
        check("channels include IN_APP_TOAST", "IN_APP_TOAST" in channels_used)
        check("channels include WORKBENCH_BADGE", "WORKBENCH_BADGE" in channels_used)
        check("channels include KAFKA_EVENT", "KAFKA_EVENT" in channels_used)

        return result
    except Exception as e:
        check("T5 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T6: sa7_send_welcome_kit_batch — Case 502
# --------------------------------------------------------------------------
def test_t6_send_welcome_kit_batch_edd():
    section("T6: sa7_send_welcome_kit_batch (Case 502 — Dragon Phoenix)")
    try:
        result = sa7_send_welcome_kit_batch(
            case_id=TEST_CASE_EDD,
            kit_id=KIT_ID_EDD,
            entity_name="Dragon Phoenix Holdings Ltd",
            rm_id="RM-0072",
            rm_name="Grace Ho Mei Ling",
            rm_email="grace.ho@abs.com",
            customer_email="michael.chen@abs.com",
        )
        check("status is success", result.get("status") == "success")
        check("batch_size = 5", result.get("batch_size") == 5)
        check("notification_ids has 5 items",
              len(result.get("notification_ids", [])) == 5)
        check("customer_notified = True", result.get("customer_notified") is True)
        return result
    except Exception as e:
        check("T6 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T7: sa7_complete_case — Case 501 (happy path -> DONE)
# --------------------------------------------------------------------------
def test_t7_complete_case():
    section("T7: sa7_complete_case (Case 501 — Stellar -> DONE)")
    try:
        result = sa7_complete_case(
            case_id=TEST_CASE_STANDARD,
            kit_id=KIT_ID_STANDARD,
            notifications_sent=5,
        )
        check("status is success", result.get("status") == "success")
        check("case_status = DONE", result.get("case_status") == "DONE")
        check("checkpoint_written = True", result.get("checkpoint_written") is True)
        check("events_published = True", result.get("events_published") is True)
        check("completed_nodes includes N-6",
              "N-6" in result.get("completed_nodes", []))

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node, completed_nodes FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_STANDARD,),
                )
                state = cursor.fetchone()
                check("DB: case_state status = DONE",
                      state and state["status"] == "DONE")

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-6' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                cp = cursor.fetchone()
                check("DB: N-6 checkpoint = COMPLETE",
                      cp and cp["status"] == "COMPLETE")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T7 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T8: sa7_complete_case — Case 502
# --------------------------------------------------------------------------
def test_t8_complete_case_edd():
    section("T8: sa7_complete_case (Case 502 — Dragon Phoenix -> DONE)")
    try:
        result = sa7_complete_case(
            case_id=TEST_CASE_EDD,
            kit_id=KIT_ID_EDD,
            notifications_sent=5,
        )
        check("status is success", result.get("status") == "success")
        check("case_status = DONE", result.get("case_status") == "DONE")
        check("checkpoint_written = True", result.get("checkpoint_written") is True)
        check("completed_nodes includes N-6",
              "N-6" in result.get("completed_nodes", []))

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_EDD,),
                )
                state = cursor.fetchone()
                check("DB: case_state status = DONE",
                      state and state["status"] == "DONE")

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-6' LIMIT 1",
                    (TEST_CASE_EDD,),
                )
                cp = cursor.fetchone()
                check("DB: N-6 checkpoint = COMPLETE",
                      cp and cp["status"] == "COMPLETE")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T8 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T9: sa7_send_notification — Ad-hoc single notification
# --------------------------------------------------------------------------
def test_t9_send_adhoc_notification():
    """
    Must run BEFORE T7 marks case DONE (or after cleanup resets it).
    Since T7 already ran, we need to reset case 501 back to ACTIVE first.
    However, notification log INSERT does not check case status,
    so we can test it even after DONE.
    """
    section("T9: sa7_send_notification (Ad-hoc — Case 501, TASK_ASSIGNMENT, EMAIL)")
    try:
        result = sa7_send_notification(
            case_id=TEST_CASE_STANDARD,
            notification_type="TASK_ASSIGNMENT",
            channel="EMAIL",
            recipient_id="RM-0071",
            recipient_email="peter.lim@abs.com",
            recipient_role="RM",
            subject="Action Required: Review welcome kit for AO-2026-000501",
            body_summary="Please review the welcome kit dispatched for Stellar Trading Pte Ltd.",
        )
        check("status is success", result.get("status") == "success")
        check("notification_id returned", result.get("notification_id") is not None)
        check("notification_type = TASK_ASSIGNMENT",
              result.get("notification_type") == "TASK_ASSIGNMENT")
        check("channel = EMAIL", result.get("channel") == "EMAIL")
        check("delivery_status = DELIVERED",
              result.get("delivery_status") == "DELIVERED")
        return result
    except Exception as e:
        check("T9 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T10: sa7_get_notification_history
# --------------------------------------------------------------------------
def test_t10_get_notification_history():
    section("T10: sa7_get_notification_history (Case 501)")
    try:
        # Unfiltered — should include batch (5) + ad-hoc (1) = 6+
        result = sa7_get_notification_history(TEST_CASE_STANDARD)
        check("status is success", result.get("status") == "success")
        check("total >= 6 (batch + ad-hoc)",
              result.get("total", 0) >= 6)
        check("notifications is a list",
              isinstance(result.get("notifications"), list))

        # Filtered by notification_type
        filtered = sa7_get_notification_history(
            TEST_CASE_STANDARD, notification_type="TASK_ASSIGNMENT"
        )
        check("filtered status is success", filtered.get("status") == "success")
        check("filtered total >= 1", filtered.get("total", 0) >= 1)
        check("notification_type_filter = TASK_ASSIGNMENT",
              filtered.get("notification_type_filter") == "TASK_ASSIGNMENT")
        # Verify all returned rows match the filter
        all_match = all(
            n.get("notification_type") == "TASK_ASSIGNMENT"
            for n in filtered.get("notifications", [])
        )
        check("all filtered results are TASK_ASSIGNMENT", all_match)

        return result
    except Exception as e:
        check("T10 no exception", False, str(e))
        traceback.print_exc()
        return {}


# --------------------------------------------------------------------------
# T11: Error guards
# --------------------------------------------------------------------------
def test_t11_error_guards():
    section("T11: Error guards")
    try:
        # 1. Invalid case_id for get_case_context
        result = sa7_get_case_context("AO-9999-999999")
        check("Invalid case_id: status is error", result.get("status") == "error")
        check("Invalid case_id: error message present", bool(result.get("error")))

        # 2. Invalid notification_type
        result = sa7_send_notification(
            case_id=TEST_CASE_STANDARD,
            notification_type="INVALID_TYPE",
            channel="EMAIL",
            recipient_id="RM-0071",
            recipient_email="peter.lim@abs.com",
            recipient_role="RM",
            subject="Test",
            body_summary="Test",
        )
        check("Invalid notification_type: status is error", result.get("status") == "error")
        check("Invalid notification_type: error message present", bool(result.get("error")))

        # 3. Invalid channel
        result = sa7_send_notification(
            case_id=TEST_CASE_STANDARD,
            notification_type="TASK_ASSIGNMENT",
            channel="INVALID_CHANNEL",
            recipient_id="RM-0071",
            recipient_email="peter.lim@abs.com",
            recipient_role="RM",
            subject="Test",
            body_summary="Test",
        )
        check("Invalid channel: status is error", result.get("status") == "error")
        check("Invalid channel: error message present", bool(result.get("error")))

    except Exception as e:
        check("T11 no exception", False, str(e))
        traceback.print_exc()


# --------------------------------------------------------------------------
# Main runner
# --------------------------------------------------------------------------
def main():
    print("\n" + "=" * 60)
    print("  DCE Account Opening — SA-7 Tool Integration Tests")
    print("=" * 60)

    # Cleanup before tests
    section("Pre-Test: Cleanup")
    cleanup_test_data()

    # Run tests sequentially (each builds on prior results)
    test_t1_get_case_context()
    test_t2_get_case_context_edd()
    test_t3_generate_welcome_kit()
    test_t4_generate_welcome_kit_edd()
    test_t5_send_welcome_kit_batch()
    test_t6_send_welcome_kit_batch_edd()
    test_t7_complete_case()
    test_t8_complete_case_edd()
    test_t9_send_adhoc_notification()
    test_t10_get_notification_history()
    test_t11_error_guards()

    # Summary
    total = passed + failed
    print("\n" + "=" * 60)
    print(f"  Results: {passed}/{total} passed  |  {failed} failed")
    if errors:
        print("\n  Failed assertions:")
        for err in errors:
            print(f"  {err}")
    else:
        print("\n  ALL TESTS PASSED ✓")
    print("=" * 60)

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
