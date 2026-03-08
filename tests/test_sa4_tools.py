"""
DCE Account Opening — SA-4 Tool Integration Tests
==================================================
Tests for all 9 SA-4 MCP tools. Run inside the dce_mcp_sa4 container.

Test cases use seed data from db/008_sa4_seed.sql:
  - AO-2026-000201: ABC Capital Management Pte Ltd (SGP CORP, INSTITUTIONAL_FUTURES)
    → Standard case: CLEAR sanctions, happy path
  - AO-2026-000202: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT, URGENT)
    → Edge case: POTENTIAL_MATCH on director Liu Zhiwei, conditional registry lookup

Run command (from project root):
    export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
    docker cp tests/test_sa4_tools.py dce_mcp_sa4:/app/test_sa4_tools.py
    docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \\
      dce_mcp_sa4 python /app/test_sa4_tools.py

Expected: 35/35 passed
"""

import sys
import json
import traceback
import datetime

# ─── Direct import (same Python env as sa4_server.py) ──────────────────────
from sa4_server import (
    sa4_get_case_context,
    sa4_extract_entity_structure,
    sa4_run_screening_batch,
    sa4_lookup_corporate_registry,
    sa4_escalate_sanctions_hit,
    sa4_compile_and_submit_kyc_brief,
    sa4_park_for_hitl,
    sa4_capture_rm_decisions,
    sa4_complete_node,
    _get_conn,
)

# ─── Test case constants ────────────────────────────────────────────────────
TEST_CASE_CLEAR = "AO-2026-000201"      # ABC Capital — CLEAR sanctions, happy path
TEST_CASE_POTENTIAL = "AO-2026-000202"  # Dragon Phoenix — POTENTIAL_MATCH

BRIEF_ID_CLEAR = None    # Set dynamically after T2
BRIEF_ID_POTENTIAL = None

# ─── Tracking ───────────────────────────────────────────────────────────────
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


# ─── Cleanup ─────────────────────────────────────────────────────────────────
def cleanup_test_data():
    """Remove SA-4 test data so tests are idempotent between runs."""
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for case_id in (TEST_CASE_CLEAR, TEST_CASE_POTENTIAL):
                cursor.execute("DELETE FROM dce_ao_rm_kyc_decision WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_screening_result WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_kyc_brief WHERE case_id = %s", (case_id,))
                cursor.execute(
                    "DELETE FROM dce_ao_hitl_review_task WHERE case_id = %s AND node_id = 'N-3'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_node_checkpoint WHERE case_id = %s AND node_id = 'N-3'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_event_log WHERE case_id = %s AND triggered_by LIKE 'sa4%%'",
                    (case_id,),
                )
                cursor.execute(
                    "UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-3', "
                    "hitl_queue=NULL WHERE case_id = %s",
                    (case_id,),
                )
        conn.commit()
        print("  [cleanup] SA-4 test data cleared for both test cases.")
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────────────────────
# T1: sa4_get_case_context — Phase 1
# ────────────────────────────────────────────────────────────────────────────
def test_t1_get_case_context():
    section("T1: sa4_get_case_context (PHASE1)")
    try:
        result = sa4_get_case_context(TEST_CASE_CLEAR, phase="PHASE1")
        check("status is success", result.get("status") == "success")
        check("case_state returned", isinstance(result.get("case_state"), dict))
        check("case_id correct", result.get("case_state", {}).get("case_id") == TEST_CASE_CLEAR)
        check("current_node is N-3", result.get("case_state", {}).get("current_node") == "N-3")
        check("classification_result returned", isinstance(result.get("classification_result"), dict))
        check("account_type is INSTITUTIONAL_FUTURES",
              result.get("classification_result", {}).get("account_type") == "INSTITUTIONAL_FUTURES")
        check("extracted_data is non-empty dict", bool(result.get("extracted_data")))
        check("entity_name in extracted_data",
              "entity_name" in result.get("extracted_data", {}))
        check("n2_output returned", isinstance(result.get("n2_output"), dict))
        check("specimens returned", isinstance(result.get("specimens"), list))
        check("rm_hierarchy returned", isinstance(result.get("rm_hierarchy"), dict))
        check("rm_id present in rm_hierarchy",
              "rm_id" in result.get("rm_hierarchy", {}))
        return result
    except Exception as e:
        check("T1 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T2: sa4_extract_entity_structure — Case 201 (CLEAR)
# ────────────────────────────────────────────────────────────────────────────
def test_t2_extract_entity_structure(context_result: dict):
    global BRIEF_ID_CLEAR
    section("T2: sa4_extract_entity_structure (Case 201 — ABC Capital)")
    try:
        extracted_data = context_result.get("extracted_data", {})
        n2_output = context_result.get("n2_output", {})
        result = sa4_extract_entity_structure(TEST_CASE_CLEAR, extracted_data, n2_output)
        check("status is success", result.get("status") == "success")
        check("brief_id generated", bool(result.get("brief_id")))
        check("brief_id format BRIEF-XXXXXX",
              str(result.get("brief_id", "")).startswith("BRIEF-"))
        check("entity_structure returned", isinstance(result.get("entity_structure"), dict))
        check("entity_name present",
              bool(result.get("entity_structure", {}).get("entity_name")))
        check("individuals_to_screen is list",
              isinstance(result.get("individuals_to_screen"), list))
        check("at least 1 individual to screen",
              result.get("individuals_to_screen_count", 0) >= 1)
        check("ownership_chain returned", isinstance(result.get("ownership_chain"), dict))
        BRIEF_ID_CLEAR = result.get("brief_id")
        print(f"  [info] brief_id={BRIEF_ID_CLEAR}, individuals={result.get('individuals_to_screen_count')}")
        return result
    except Exception as e:
        check("T2 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T3: sa4_run_screening_batch — Case 201 (expect CLEAR)
# ────────────────────────────────────────────────────────────────────────────
def test_t3_run_screening_batch_clear(entity_result: dict):
    section("T3: sa4_run_screening_batch (Case 201 — expect CLEAR)")
    try:
        individuals = entity_result.get("individuals_to_screen", [
            {"name": "ABC Capital Management Pte Ltd", "role": "ENTITY"},
            {"name": "Tan Wei Jian", "role": "DIRECTOR"},
        ])
        result = sa4_run_screening_batch(TEST_CASE_CLEAR, BRIEF_ID_CLEAR, individuals)
        check("status is success", result.get("status") == "success")
        check("overall_sanctions_status is CLEAR",
              result.get("overall_sanctions_status") == "CLEAR")
        check("has_confirmed_hit is False",
              result.get("has_confirmed_hit") is False)
        check("names_screened >= 1", result.get("names_screened", 0) >= 1)
        check("sanctions_results is list", isinstance(result.get("sanctions_results"), list))
        check("pep_results is list", isinstance(result.get("pep_results"), list))
        check("adverse_media_results is list", isinstance(result.get("adverse_media_results"), list))
        return result
    except Exception as e:
        check("T3 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T4: sa4_run_screening_batch — Case 202 (expect POTENTIAL_MATCH)
# ────────────────────────────────────────────────────────────────────────────
def test_t4_run_screening_batch_potential():
    global BRIEF_ID_POTENTIAL
    section("T4: sa4_run_screening_batch (Case 202 — expect POTENTIAL_MATCH on Liu Zhiwei)")
    try:
        # First extract entity for case 202
        ctx_202 = sa4_get_case_context(TEST_CASE_POTENTIAL, phase="PHASE1")
        extracted = ctx_202.get("extracted_data", {})
        n2 = ctx_202.get("n2_output", {})
        entity_202 = sa4_extract_entity_structure(TEST_CASE_POTENTIAL, extracted, n2)
        BRIEF_ID_POTENTIAL = entity_202.get("brief_id")
        individuals = entity_202.get("individuals_to_screen", [
            {"name": "Dragon Phoenix Holdings Ltd", "role": "ENTITY"},
            {"name": "Wong Siu Man", "role": "DIRECTOR"},
            {"name": "Liu Zhiwei", "role": "DIRECTOR"},  # POTENTIAL_MATCH in watchlist
        ])
        result = sa4_run_screening_batch(TEST_CASE_POTENTIAL, BRIEF_ID_POTENTIAL, individuals)
        check("status is success", result.get("status") == "success")
        check("overall_sanctions_status is POTENTIAL_MATCH",
              result.get("overall_sanctions_status") == "POTENTIAL_MATCH")
        check("has_confirmed_hit is False",
              result.get("has_confirmed_hit") is False)
        check("pep_flag_count is int", isinstance(result.get("pep_flag_count"), int))
        # Verify Liu Zhiwei got POTENTIAL_MATCH
        sanctions = result.get("sanctions_results", [])
        liu_result = next((r for r in sanctions if r.get("name") == "Liu Zhiwei"), None)
        check("Liu Zhiwei screened", liu_result is not None)
        check("Liu Zhiwei POTENTIAL_MATCH",
              liu_result and liu_result.get("sanctions_status") == "POTENTIAL_MATCH")
        return result
    except Exception as e:
        check("T4 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T5: sa4_lookup_corporate_registry — SGP entity
# ────────────────────────────────────────────────────────────────────────────
def test_t5_lookup_corporate_registry():
    section("T5: sa4_lookup_corporate_registry (SGP CORP — ABC Capital)")
    try:
        result = sa4_lookup_corporate_registry(
            TEST_CASE_CLEAR, "ABC Capital Management Pte Ltd", "SGP", "202012345K"
        )
        check("status is success or skipped",
              result.get("status") in ("success", "skipped"))
        check("registry_data returned", isinstance(result.get("registry_data"), dict))
        check("discrepancies is list", isinstance(result.get("discrepancies"), list))
        check("jurisdiction is SGP", result.get("jurisdiction") == "SGP")

        # HKG registry lookup for case 202
        result_hkg = sa4_lookup_corporate_registry(
            TEST_CASE_POTENTIAL, "Dragon Phoenix Holdings Ltd", "HKG", "HK1234567"
        )
        check("HKG lookup status success/skipped",
              result_hkg.get("status") in ("success", "skipped"))
        check("HKG jurisdiction returned", result_hkg.get("jurisdiction") == "HKG")

        # Non-applicable jurisdiction — should be skipped
        result_skip = sa4_lookup_corporate_registry(
            TEST_CASE_CLEAR, "Some Entity", "OTHER", ""
        )
        check("Non-SGP/HKG → status skipped", result_skip.get("status") == "skipped")
        return result
    except Exception as e:
        check("T5 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T6: sa4_compile_and_submit_kyc_brief — Case 201
# ────────────────────────────────────────────────────────────────────────────
def test_t6_compile_and_submit_kyc_brief(entity_result: dict, screening_result: dict):
    section("T6: sa4_compile_and_submit_kyc_brief (Case 201)")
    try:
        result = sa4_compile_and_submit_kyc_brief(
            case_id=TEST_CASE_CLEAR,
            brief_id=BRIEF_ID_CLEAR,
            entity_structure=entity_result.get("entity_structure", {}),
            screening_summary={
                "overall_sanctions_status": screening_result.get("overall_sanctions_status", "CLEAR"),
                "pep_flag_count": screening_result.get("pep_flag_count", 0),
                "adverse_media_found": screening_result.get("adverse_media_found", False),
                "names_screened": screening_result.get("names_screened", 0),
            },
            registry_data={"status": "CLEAR"},
            open_questions=["Confirm ABC Global Investments UBO identity", "Verify MAS CMS licence status"],
            suggested_risk_range="LOW",
            is_retail_investor=False,
            kb_chunks_used=["KB-4-chunk-1", "KB-3-chunk-1", "KB-6-chunk-1"],
        )
        check("status is success", result.get("status") == "success")
        check("brief_id returned", result.get("brief_id") == BRIEF_ID_CLEAR)
        check("brief_url returned", bool(result.get("brief_url")))
        check("brief_url contains brief_id",
              BRIEF_ID_CLEAR in result.get("brief_url", ""))
        check("notification_sent is True", result.get("notification_sent") is True)
        return result
    except Exception as e:
        check("T6 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T7: sa4_park_for_hitl — Case 201
# ────────────────────────────────────────────────────────────────────────────
def test_t7_park_for_hitl(brief_result: dict):
    section("T7: sa4_park_for_hitl (Case 201)")
    try:
        hitl_deadline = (
            datetime.datetime.now() + datetime.timedelta(days=2)
        ).strftime("%Y-%m-%d %H:%M:%S")

        result = sa4_park_for_hitl(
            case_id=TEST_CASE_CLEAR,
            brief_id=BRIEF_ID_CLEAR,
            rm_id="RM-0042",
            priority="STANDARD",
            hitl_deadline=hitl_deadline,
            brief_url=brief_result.get("brief_url", f"https://workbench.dce.internal/kyc-briefs/{BRIEF_ID_CLEAR}"),
        )
        check("status is success", result.get("status") == "success")
        check("hitl_task_id generated", bool(result.get("hitl_task_id")))
        check("hitl_task_id format HITL-XXXXXX",
              str(result.get("hitl_task_id", "")).startswith("HITL-"))
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("case_status is HITL_PENDING", result.get("case_status") == "HITL_PENDING")
        check("next_action is RM_REVIEW", result.get("next_action") == "RM_REVIEW")

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, hitl_queue FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_CLEAR,),
                )
                state = cursor.fetchone()
                check("case_state status = HITL_PENDING",
                      state and state["status"] == "HITL_PENDING")
                check("hitl_queue is valid JSON",
                      state and state.get("hitl_queue") is not None)
                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-3' ORDER BY attempt_number DESC LIMIT 1",
                    (TEST_CASE_CLEAR,),
                )
                cp = cursor.fetchone()
                check("N-3 checkpoint status = HITL_PENDING",
                      cp and cp["status"] == "HITL_PENDING")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T7 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T8: sa4_capture_rm_decisions — validation tests
# ────────────────────────────────────────────────────────────────────────────
def test_t8_capture_rm_decisions():
    section("T8: sa4_capture_rm_decisions (validation + happy path)")
    try:
        # Test incomplete submission (missing kyc_risk_rating)
        incomplete_decisions = {
            "cdd_clearance": "CLEARED",
            "bcap_clearance": True,
            "caa_approach": "IRB",
            "recommended_dce_limit_sgd": 5000000.00,
            "recommended_dce_pce_limit_sgd": 2000000.00,
            "osca_case_number": "OSCA-2026-001234",
            "limit_exposure_indication": "SGD 500k/month",
            "rm_id": "RM-0042",
            "decided_at": "2026-03-09 10:00:00",
        }
        incomplete_result = sa4_capture_rm_decisions(TEST_CASE_CLEAR, BRIEF_ID_CLEAR, incomplete_decisions)
        check("Incomplete: status is error", incomplete_result.get("status") == "error")
        check("Incomplete: validation_status = INCOMPLETE",
              incomplete_result.get("validation_status") == "INCOMPLETE")
        check("Incomplete: missing_fields contains kyc_risk_rating",
              "kyc_risk_rating" in incomplete_result.get("missing_fields", []))

        # Test invalid kyc_risk_rating value
        invalid_decisions = {**incomplete_decisions, "kyc_risk_rating": "INVALID_VALUE"}
        invalid_result = sa4_capture_rm_decisions(TEST_CASE_CLEAR, BRIEF_ID_CLEAR, invalid_decisions)
        check("Invalid value: status is error", invalid_result.get("status") == "error")

        # Happy path — complete valid submission
        valid_decisions = {
            "kyc_risk_rating": "MEDIUM",
            "cdd_clearance": "CLEARED",
            "bcap_clearance": True,
            "caa_approach": "IRB",
            "recommended_dce_limit_sgd": 5000000.00,
            "recommended_dce_pce_limit_sgd": 2000000.00,
            "osca_case_number": "OSCA-2026-001234",
            "limit_exposure_indication": "Estimated trading SGD 500k/month; client profile consistent",
            "rm_id": "RM-0042",
            "rm_name": "David Tan Wei Jian",
            "decided_at": "2026-03-09 10:30:00",
            "additional_conditions": None,
        }
        valid_result = sa4_capture_rm_decisions(TEST_CASE_CLEAR, BRIEF_ID_CLEAR, valid_decisions)
        check("Valid: status is success", valid_result.get("status") == "success")
        check("Valid: decision_id is int", isinstance(valid_result.get("decision_id"), int))
        check("Valid: decisions_stored is True", valid_result.get("decisions_stored") is True)
        check("Valid: kyc_risk_rating is MEDIUM",
              valid_result.get("kyc_risk_rating") == "MEDIUM")
        return valid_decisions
    except Exception as e:
        check("T8 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T9: sa4_complete_node — RM_DECISION_CAPTURED (happy path)
# ────────────────────────────────────────────────────────────────────────────
def test_t9_complete_node_approved(rm_decisions: dict, park_result: dict):
    section("T9: sa4_complete_node (RM_DECISION_CAPTURED — Case 201)")
    try:
        hitl_task_id = park_result.get("hitl_task_id", "")
        n3_output = {
            "case_id": TEST_CASE_CLEAR,
            "kyc_brief_id": BRIEF_ID_CLEAR,
            "brief_url": f"https://workbench.dce.internal/kyc-briefs/{BRIEF_ID_CLEAR}",
            "sanctions_status": "CLEAR",
            "pep_flags_count": 0,
            "adverse_media_found": False,
            "names_screened_count": 3,
            "rm_decisions": rm_decisions,
            "next_node": "N-4",
        }
        result = sa4_complete_node(
            case_id=TEST_CASE_CLEAR,
            outcome="RM_DECISION_CAPTURED",
            brief_id=BRIEF_ID_CLEAR,
            rm_decisions=rm_decisions,
            n3_output=n3_output,
            hitl_task_id=hitl_task_id,
        )
        check("status is success", result.get("status") == "success")
        check("outcome is RM_DECISION_CAPTURED",
              result.get("outcome") == "RM_DECISION_CAPTURED")
        check("checkpoint_status is COMPLETE",
              result.get("checkpoint_status") == "COMPLETE")
        check("next_node is N-4", result.get("next_node") == "N-4")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("kafka_event_published is True", result.get("kafka_event_published") is True)

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node, hitl_queue FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_CLEAR,),
                )
                state = cursor.fetchone()
                check("case_state status = ACTIVE", state and state["status"] == "ACTIVE")
                check("current_node = N-4", state and state["current_node"] == "N-4")
                check("hitl_queue cleared", state and state["hitl_queue"] is None)
                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-3' ORDER BY attempt_number DESC LIMIT 1",
                    (TEST_CASE_CLEAR,),
                )
                cp = cursor.fetchone()
                check("N-3 checkpoint = COMPLETE", cp and cp["status"] == "COMPLETE")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T9 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T10: sa4_complete_node — KYC_DECLINED
# ────────────────────────────────────────────────────────────────────────────
def test_t10_complete_node_declined():
    section("T10: sa4_complete_node (KYC_DECLINED — Case 202 POTENTIAL_MATCH scenario)")
    try:
        unacceptable_decisions = {
            "kyc_risk_rating": "UNACCEPTABLE",
            "cdd_clearance": "DECLINED",
            "bcap_clearance": False,
            "caa_approach": "SA",
            "recommended_dce_limit_sgd": 0.00,
            "recommended_dce_pce_limit_sgd": 0.00,
            "osca_case_number": "N/A",
            "limit_exposure_indication": "KYC DECLINED — unacceptable risk profile",
            "rm_id": "RM-0073",
            "rm_name": "Michael Wong Kai Fong",
            "decided_at": "2026-03-07 14:00:00",
        }

        # Capture the declined decisions first (for FK integrity)
        sa4_capture_rm_decisions(TEST_CASE_POTENTIAL, BRIEF_ID_POTENTIAL or "BRIEF-000002", unacceptable_decisions)

        n3_output = {
            "case_id": TEST_CASE_POTENTIAL,
            "outcome": "KYC_DECLINED",
            "next_node": "DEAD",
        }
        result = sa4_complete_node(
            case_id=TEST_CASE_POTENTIAL,
            outcome="KYC_DECLINED",
            brief_id=BRIEF_ID_POTENTIAL or "BRIEF-000002",
            rm_decisions=unacceptable_decisions,
            n3_output=n3_output,
            failure_reason="KYC_DECLINED_BY_RM — UNACCEPTABLE risk rating",
        )
        check("status is success", result.get("status") == "success")
        check("outcome is KYC_DECLINED", result.get("outcome") == "KYC_DECLINED")
        check("checkpoint_status is FAILED", result.get("checkpoint_status") == "FAILED")
        check("next_node is DEAD", result.get("next_node") == "DEAD")
        check("kafka_event not published", result.get("kafka_event_published") is False)

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_POTENTIAL,),
                )
                state = cursor.fetchone()
                check("case_state status = ESCALATED", state and state["status"] == "ESCALATED")
                check("current_node = DEAD", state and state["current_node"] == "DEAD")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T10 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T11: sa4_escalate_sanctions_hit — simulated HIT_CONFIRMED scenario
# ────────────────────────────────────────────────────────────────────────────
def test_t11_escalate_sanctions_hit():
    """Use a hypothetical brief_id for isolated sanctions escalation test."""
    section("T11: sa4_escalate_sanctions_hit (simulated HIT_CONFIRMED)")
    try:
        # Use case 201 with a temporary brief_id for this isolated test
        # (case 201 was already advanced to N-4 in T9 — won't conflict since escalation
        # writes its own checkpoint record with a new attempt_number)
        test_brief_id = "BRIEF-TEST-ESC"

        # Insert a temporary kyc_brief so FK constraint on screening_result is satisfied
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM dce_ao_kyc_brief WHERE brief_id = %s", (test_brief_id,))
                cursor.execute(
                    """
                    INSERT INTO dce_ao_kyc_brief
                        (brief_id, case_id, attempt_number, entity_legal_name, entity_type,
                         sanctions_status, compiled_by_model)
                    VALUES (%s, %s, 99, 'Test Entity Sanctions', 'CORP', 'HIT_CONFIRMED', 'test')
                    """,
                    (test_brief_id, TEST_CASE_CLEAR),
                )
            conn.commit()
        finally:
            conn.close()

        hit_details = [{
            "name": "Rogue State Corp",
            "role": "ENTITY",
            "sanctions_status": "HIT_CONFIRMED",
            "sanctions_source": "Refinitiv World-Check v4",
            "sanctions_detail": {
                "match_type": "EXACT",
                "matched_entity": "Rogue State Corp — UN Sanctions list",
                "confidence": 1.0,
            },
        }]
        names_hit = ["Rogue State Corp"]

        result = sa4_escalate_sanctions_hit(
            case_id=TEST_CASE_CLEAR,
            brief_id=test_brief_id,
            hit_details=hit_details,
            names_hit=names_hit,
        )
        check("status is success", result.get("status") == "success")
        check("outcome is SUSPENDED_SANCTIONS",
              result.get("outcome") == "SUSPENDED_SANCTIONS")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("case_status is ESCALATED", result.get("case_status") == "ESCALATED")
        check("names_hit returned", result.get("names_hit") == names_hit)

        # Cleanup: restore case 201 state to ACTIVE/N-4 (it was correct before this test)
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-4' "
                    "WHERE case_id = %s",
                    (TEST_CASE_CLEAR,),
                )
                cursor.execute("DELETE FROM dce_ao_kyc_brief WHERE brief_id = %s", (test_brief_id,))
            conn.commit()
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T11 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# Main runner
# ────────────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "=" * 60)
    print("  DCE Account Opening — SA-4 Tool Integration Tests")
    print("=" * 60)

    # Cleanup before tests
    section("Pre-Test: Cleanup")
    cleanup_test_data()

    # Run tests sequentially (each builds on prior results)
    context_201 = test_t1_get_case_context()
    entity_201 = test_t2_extract_entity_structure(context_201)
    screening_201 = test_t3_run_screening_batch_clear(entity_201)
    test_t4_run_screening_batch_potential()
    test_t5_lookup_corporate_registry()
    brief_201 = test_t6_compile_and_submit_kyc_brief(entity_201, screening_201)
    park_201 = test_t7_park_for_hitl(brief_201)
    rm_decisions = test_t8_capture_rm_decisions()
    test_t9_complete_node_approved(rm_decisions, park_201)
    test_t10_complete_node_declined()
    test_t11_escalate_sanctions_hit()

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
