"""
DCE Account Opening — SA-5 Tool Integration Tests
==================================================
Tests for all 6 SA-5 MCP tools. Run inside the dce_mcp_sa5 container.

Test cases use seed data from db/010_sa5_seed.sql:
  - AO-2026-000301: Meridian Asset Management Pte Ltd (SGP CORP, INSTITUTIONAL_FUTURES)
    → Standard case: MEDIUM risk, CLEARED CDD, IRB approach — APPROVED path
  - AO-2026-000302: Pacific Horizon Capital Ltd (HKG CORP, MULTI_PRODUCT, URGENT)
    → Edge case: HIGH risk, ENHANCED_DUE_DILIGENCE, SA approach — APPROVED_WITH_CONDITIONS

Run command (from project root):
    export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
    docker cp tests/test_sa5_tools.py dce_mcp_sa5:/app/test_sa5_tools.py
    docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \\
      dce_mcp_sa5 python /app/test_sa5_tools.py

Expected: 38/38 passed
"""

import sys
import json
import traceback
import datetime

# ─── Direct import (same Python env as sa5_server.py) ──────────────────────
from sa5_server import (
    sa5_get_case_context,
    sa5_extract_financial_data,
    sa5_compile_credit_brief,
    sa5_park_for_credit_review,
    sa5_capture_credit_decisions,
    sa5_complete_node,
    _get_conn,
)

# ─── Test case constants ────────────────────────────────────────────────────
TEST_CASE_STANDARD  = "AO-2026-000301"   # Meridian — MEDIUM risk, CLEARED, IRB → APPROVED
TEST_CASE_EDD       = "AO-2026-000302"   # Pacific Horizon — HIGH risk, EDD → APPROVED_WITH_CONDITIONS

CREDIT_BRIEF_ID_STANDARD  = None   # Set dynamically after T3
CREDIT_BRIEF_ID_EDD       = None

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
    """Remove SA-5 test data so tests are idempotent between runs."""
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for case_id in (TEST_CASE_STANDARD, TEST_CASE_EDD):
                cursor.execute("DELETE FROM dce_ao_credit_decision WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_financial_extract WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_credit_brief WHERE case_id = %s", (case_id,))
                cursor.execute(
                    "DELETE FROM dce_ao_hitl_review_task WHERE case_id = %s AND node_id = 'N-4'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_node_checkpoint WHERE case_id = %s AND node_id = 'N-4'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_event_log WHERE case_id = %s AND triggered_by LIKE 'sa5%%'",
                    (case_id,),
                )
                cursor.execute(
                    "UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-4', "
                    "hitl_queue=NULL WHERE case_id = %s",
                    (case_id,),
                )
        conn.commit()
        print("  [cleanup] SA-5 test data cleared for both test cases.")
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────────────────────
# T1: sa5_get_case_context — Phase 1 (Standard case)
# ────────────────────────────────────────────────────────────────────────────
def test_t1_get_case_context():
    section("T1: sa5_get_case_context (PHASE1 — Meridian, standard)")
    try:
        result = sa5_get_case_context(TEST_CASE_STANDARD, phase="PHASE1")
        check("status is success", result.get("status") == "success")
        check("case_state returned", isinstance(result.get("case_state"), dict))
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_STANDARD)
        check("current_node is N-4",
              result.get("case_state", {}).get("current_node") == "N-4")
        check("rm_hierarchy returned", isinstance(result.get("rm_hierarchy"), dict))
        check("rm_id in rm_hierarchy", bool(result.get("rm_hierarchy", {}).get("rm_id")))
        check("classification_result returned",
              isinstance(result.get("classification_result"), dict))
        check("account_type is INSTITUTIONAL_FUTURES",
              result.get("classification_result", {}).get("account_type") == "INSTITUTIONAL_FUTURES")
        check("products_requested is list",
              isinstance(result.get("classification_result", {}).get("products_requested"), list))
        check("rm_kyc_decisions returned", isinstance(result.get("rm_kyc_decisions"), dict))
        check("kyc_risk_rating present",
              bool(result.get("rm_kyc_decisions", {}).get("kyc_risk_rating")))
        check("caa_approach present",
              bool(result.get("rm_kyc_decisions", {}).get("caa_approach")))
        check("recommended_dce_limit present",
              result.get("rm_kyc_decisions", {}).get("recommended_dce_limit_sgd") is not None)
        check("n3_output returned", isinstance(result.get("n3_output"), dict))
        check("financial_doc_ids is list", isinstance(result.get("financial_doc_ids"), list))
        check("at least 1 financial doc found",
              len(result.get("financial_doc_ids", [])) >= 1)
        check("extracted_data returned (entity from AO form)",
              isinstance(result.get("extracted_data"), dict))
        return result
    except Exception as e:
        check("T1 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T2: sa5_get_case_context — Phase 1 (EDD case)
# ────────────────────────────────────────────────────────────────────────────
def test_t2_get_case_context_edd():
    section("T2: sa5_get_case_context (PHASE1 — Pacific Horizon, EDD case)")
    try:
        result = sa5_get_case_context(TEST_CASE_EDD, phase="PHASE1")
        check("status is success", result.get("status") == "success")
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_EDD)
        check("kyc_risk_rating is HIGH",
              result.get("rm_kyc_decisions", {}).get("kyc_risk_rating") == "HIGH")
        check("cdd_clearance is ENHANCED_DUE_DILIGENCE",
              result.get("rm_kyc_decisions", {}).get("cdd_clearance") == "ENHANCED_DUE_DILIGENCE")
        check("caa_approach is SA",
              result.get("rm_kyc_decisions", {}).get("caa_approach") == "SA")
        check("financial_doc_ids found",
              len(result.get("financial_doc_ids", [])) >= 1)
        return result
    except Exception as e:
        check("T2 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T3: sa5_extract_financial_data — Standard case (3 years)
# ────────────────────────────────────────────────────────────────────────────
def test_t3_extract_financial_data(context_result: dict):
    global CREDIT_BRIEF_ID_STANDARD
    section("T3: sa5_extract_financial_data (Case 301 — Meridian, 3 years)")
    # We need a credit_brief_id placeholder for the FK — generate before financial extraction
    # In the real workflow this comes from sa5_compile_credit_brief, but for isolation
    # we create a temporary one in DB for FK integrity
    conn = _get_conn()
    tmp_brief_id = "CBRIEF-TEST01"
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM dce_ao_credit_brief WHERE credit_brief_id = %s", (tmp_brief_id,))
            cursor.execute(
                """
                INSERT INTO dce_ao_credit_brief
                    (credit_brief_id, case_id, attempt_number, entity_legal_name, entity_type,
                     caa_approach, recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
                     osca_case_number, kyc_risk_rating, compiled_by_model)
                VALUES (%s, %s, 99, 'Test Entity', 'CORP', 'IRB', 0, 0, 'TEST', 'MEDIUM', 'test')
                """,
                (tmp_brief_id, TEST_CASE_STANDARD),
            )
        conn.commit()
        CREDIT_BRIEF_ID_STANDARD = tmp_brief_id
    finally:
        conn.close()

    try:
        financial_doc_ids = context_result.get("financial_doc_ids",
                                               ["DOC-000302", "DOC-000303", "DOC-000304"])
        result = sa5_extract_financial_data(
            case_id=TEST_CASE_STANDARD,
            credit_brief_id=CREDIT_BRIEF_ID_STANDARD,
            financial_doc_ids=financial_doc_ids,
            entity_name="Meridian Asset Management Pte Ltd",
            jurisdiction="SGP",
        )
        check("status is success", result.get("status") == "success")
        check("extracts_written >= 1", result.get("extracts_written", 0) >= 1)
        check("financial_summary returned", isinstance(result.get("financial_summary"), dict))
        fs = result.get("financial_summary", {})
        check("years_analysed >= 1", fs.get("years_analysed", 0) >= 1)
        check("total_equity_sgd > 0",
              (fs.get("total_equity_sgd") or 0) > 0)
        check("leverage_ratio present", fs.get("leverage_ratio") is not None)
        check("liquidity_ratio present", fs.get("liquidity_ratio") is not None)
        check("revenue_sgd > 0", (fs.get("revenue_sgd") or 0) > 0)
        check("estimated_initial_limit_sgd > 0",
              (fs.get("estimated_initial_limit_sgd") or 0) > 0)
        if fs.get("years_analysed", 0) >= 2:
            check("revenue_trend_pct present",
                  fs.get("revenue_trend_pct") is not None)
            check("profitability_trend_pct present",
                  fs.get("profitability_trend_pct") is not None)
        print(f"  [info] years={fs.get('years_analysed')}, equity_sgd={fs.get('total_equity_sgd'):,.0f}, "
              f"lev={fs.get('leverage_ratio')}, liq={fs.get('liquidity_ratio')}, "
              f"est_limit={fs.get('estimated_initial_limit_sgd'):,.0f}")
        return result
    except Exception as e:
        check("T3 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T4: sa5_extract_financial_data — EDD case (2 years, HKD)
# ────────────────────────────────────────────────────────────────────────────
def test_t4_extract_financial_data_edd():
    global CREDIT_BRIEF_ID_EDD
    section("T4: sa5_extract_financial_data (Case 302 — Pacific Horizon, HKD, 2 years)")
    conn = _get_conn()
    tmp_brief_id = "CBRIEF-TEST02"
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM dce_ao_credit_brief WHERE credit_brief_id = %s", (tmp_brief_id,))
            cursor.execute(
                """
                INSERT INTO dce_ao_credit_brief
                    (credit_brief_id, case_id, attempt_number, entity_legal_name, entity_type,
                     caa_approach, recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
                     osca_case_number, kyc_risk_rating, compiled_by_model)
                VALUES (%s, %s, 99, 'Test Entity EDD', 'CORP', 'SA', 0, 0, 'TEST2', 'HIGH', 'test')
                """,
                (tmp_brief_id, TEST_CASE_EDD),
            )
        conn.commit()
        CREDIT_BRIEF_ID_EDD = tmp_brief_id
    finally:
        conn.close()

    try:
        result = sa5_extract_financial_data(
            case_id=TEST_CASE_EDD,
            credit_brief_id=CREDIT_BRIEF_ID_EDD,
            financial_doc_ids=["DOC-000312", "DOC-000313"],
            entity_name="Pacific Horizon Capital Ltd",
            jurisdiction="HKG",
        )
        check("status is success", result.get("status") == "success")
        check("extracts_written >= 1", result.get("extracts_written", 0) >= 1)
        fs = result.get("financial_summary", {})
        check("years_analysed >= 1", fs.get("years_analysed", 0) >= 1)
        check("total_equity_sgd > 0", (fs.get("total_equity_sgd") or 0) > 0)
        # HKD → SGD conversion: equity 120M HKD × 0.172 ≈ 20.64M SGD
        check("FX conversion applied (equity_sgd < equity_hkd)",
              (fs.get("total_equity_sgd") or 0) < 120_000_000)
        print(f"  [info] HKD case: equity_sgd={fs.get('total_equity_sgd'):,.0f}, "
              f"lev={fs.get('leverage_ratio')}, est_limit={fs.get('estimated_initial_limit_sgd'):,.0f}")
        return result
    except Exception as e:
        check("T4 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T5: sa5_compile_credit_brief — Standard case
# ────────────────────────────────────────────────────────────────────────────
def test_t5_compile_credit_brief(context_result: dict, financial_result: dict):
    global CREDIT_BRIEF_ID_STANDARD
    section("T5: sa5_compile_credit_brief (Case 301 — Meridian)")
    try:
        rm_decisions = context_result.get("rm_kyc_decisions", {
            "kyc_risk_rating": "MEDIUM",
            "cdd_clearance": "CLEARED",
            "bcap_clearance": True,
            "caa_approach": "IRB",
            "recommended_dce_limit_sgd": 8000000,
            "recommended_dce_pce_limit_sgd": 3000000,
            "osca_case_number": "OSCA-2026-003001",
            "limit_exposure_indication": "Estimated monthly trading SGD 800k",
        })
        financial_summary = financial_result.get("financial_summary", {
            "years_analysed": 3, "total_equity_sgd": 45000000,
            "leverage_ratio": 0.1111, "liquidity_ratio": 4.75,
            "revenue_sgd": 12500000, "net_profit_sgd": 3800000,
            "revenue_trend_pct": 13.64, "profitability_trend_pct": 18.75,
            "estimated_initial_limit_sgd": 4500000,
        })

        result = sa5_compile_credit_brief(
            case_id=TEST_CASE_STANDARD,
            entity_name="Meridian Asset Management Pte Ltd",
            entity_type="CORP",
            jurisdiction="SGP",
            products_requested=["FUTURES", "OPTIONS"],
            rm_decisions=rm_decisions,
            financial_summary=financial_summary,
            open_questions=[
                "Confirm NAV calculation methodology",
                "Verify MAS CMS licence renewal status",
            ],
            comparable_benchmarks={
                "FUTURES": {"typical_limit_range_sgd": "3M-10M", "margin_profile": "5-10%"},
                "OPTIONS": {"typical_limit_range_sgd": "2M-8M", "margin_profile": "8-15%"},
            },
            kb_chunks_used=["KB-6-chunk-1", "KB-6-chunk-2"],
            compiled_by_model="qwen2.5:32b",
        )
        check("status is success", result.get("status") == "success")
        check("credit_brief_id generated", bool(result.get("credit_brief_id")))
        check("credit_brief_id format CBRIEF-XXXXXX",
              str(result.get("credit_brief_id", "")).startswith("CBRIEF-"))
        check("brief_url returned", bool(result.get("brief_url")))
        check("brief_url contains credit_brief_id",
              result.get("credit_brief_id", "") in result.get("brief_url", ""))
        check("notification_sent is True", result.get("notification_sent") is True)
        check("workbench_queue is CREDIT_REVIEW",
              result.get("workbench_queue") == "CREDIT_REVIEW")

        # Update global for subsequent tests
        CREDIT_BRIEF_ID_STANDARD = result.get("credit_brief_id")
        # Clean up the temp brief we created in T3
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM dce_ao_financial_extract WHERE credit_brief_id = 'CBRIEF-TEST01'")
                cursor.execute(
                    "DELETE FROM dce_ao_credit_brief WHERE credit_brief_id = 'CBRIEF-TEST01'")
            conn.commit()
        finally:
            conn.close()

        print(f"  [info] credit_brief_id={CREDIT_BRIEF_ID_STANDARD}")
        return result
    except Exception as e:
        check("T5 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T6: sa5_compile_credit_brief — UNACCEPTABLE KYC rating guard
# ────────────────────────────────────────────────────────────────────────────
def test_t6_compile_brief_unacceptable_guard():
    section("T6: sa5_compile_credit_brief (UNACCEPTABLE guard — should reject)")
    try:
        result = sa5_compile_credit_brief(
            case_id=TEST_CASE_STANDARD,
            entity_name="Test Entity",
            entity_type="CORP",
            jurisdiction="SGP",
            products_requested=["FUTURES"],
            rm_decisions={"kyc_risk_rating": "UNACCEPTABLE", "caa_approach": "SA",
                          "recommended_dce_limit_sgd": 0, "recommended_dce_pce_limit_sgd": 0,
                          "osca_case_number": "N/A", "limit_exposure_indication": "N/A"},
            financial_summary={},
        )
        check("UNACCEPTABLE guard: status is error", result.get("status") == "error")
        check("UNACCEPTABLE guard: error message present", bool(result.get("error")))
    except Exception as e:
        check("T6 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# T7: sa5_park_for_credit_review — Standard case
# ────────────────────────────────────────────────────────────────────────────
def test_t7_park_for_credit_review(brief_result: dict):
    section("T7: sa5_park_for_credit_review (Case 301 — Meridian)")
    try:
        hitl_deadline = (
            datetime.datetime.now() + datetime.timedelta(days=2)
        ).strftime("%Y-%m-%d %H:%M:%S")
        brief_url = brief_result.get(
            "brief_url",
            f"https://workbench.dce.internal/credit-briefs/{CREDIT_BRIEF_ID_STANDARD}"
        )

        result = sa5_park_for_credit_review(
            case_id=TEST_CASE_STANDARD,
            credit_brief_id=CREDIT_BRIEF_ID_STANDARD,
            rm_id="RM-0051",
            priority="STANDARD",
            brief_url=brief_url,
            hitl_deadline=hitl_deadline,
        )
        check("status is success", result.get("status") == "success")
        check("hitl_task_id generated", bool(result.get("hitl_task_id")))
        check("hitl_task_id format HITL-XXXXXX",
              str(result.get("hitl_task_id", "")).startswith("HITL-"))
        check("case_status is HITL_PENDING",
              result.get("case_status") == "HITL_PENDING")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("next_action is CREDIT_TEAM_REVIEW",
              result.get("next_action") == "CREDIT_TEAM_REVIEW")
        check("assigned_persona is CREDIT_TEAM", result.get("assigned_persona") == "CREDIT_TEAM")

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, hitl_queue FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_STANDARD,),
                )
                state = cursor.fetchone()
                check("case_state status = HITL_PENDING",
                      state and state["status"] == "HITL_PENDING")
                check("hitl_queue populated",
                      state and state.get("hitl_queue") is not None)

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-4' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                cp = cursor.fetchone()
                check("N-4 checkpoint status = HITL_PENDING",
                      cp and cp["status"] == "HITL_PENDING")

                cursor.execute(
                    "SELECT task_type, assigned_persona FROM dce_ao_hitl_review_task "
                    "WHERE case_id = %s AND node_id = 'N-4' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                task = cursor.fetchone()
                check("HITL task type = CREDIT_REVIEW",
                      task and task["task_type"] == "CREDIT_REVIEW")
                check("HITL assigned_persona = CREDIT_TEAM",
                      task and task["assigned_persona"] == "CREDIT_TEAM")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T7 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T8: sa5_capture_credit_decisions — validation tests
# ────────────────────────────────────────────────────────────────────────────
def test_t8_capture_credit_decisions():
    section("T8: sa5_capture_credit_decisions (validation + APPROVED happy path)")
    try:
        # Test incomplete submission (missing credit_outcome)
        incomplete = {
            "approved_dce_limit_sgd": 8000000,
            "approved_dce_pce_limit_sgd": 3000000,
            "confirmed_caa_approach": "IRB",
            "conditions": [],
            "credit_team_id": "CT-001",
            "credit_team_name": "Sarah Tan",
            "decided_at": "2026-03-10 10:00:00",
        }
        inc_result = sa5_capture_credit_decisions(
            TEST_CASE_STANDARD, CREDIT_BRIEF_ID_STANDARD, incomplete
        )
        check("Incomplete: status is error", inc_result.get("status") == "error")
        check("Incomplete: validation_status = INCOMPLETE",
              inc_result.get("validation_status") == "INCOMPLETE")
        check("Incomplete: missing credit_outcome",
              "credit_outcome" in inc_result.get("missing_fields", []))

        # Test invalid credit_outcome value
        invalid = {**incomplete, "credit_outcome": "MAYBE"}
        inv_result = sa5_capture_credit_decisions(
            TEST_CASE_STANDARD, CREDIT_BRIEF_ID_STANDARD, invalid
        )
        check("Invalid value: status is error", inv_result.get("status") == "error")

        # Happy path — APPROVED, no conditions
        valid_approved = {
            "credit_outcome": "APPROVED",
            "approved_dce_limit_sgd": 8000000.00,
            "approved_dce_pce_limit_sgd": 3000000.00,
            "confirmed_caa_approach": "IRB",
            "conditions": [],
            "credit_team_id": "CT-001",
            "credit_team_name": "Sarah Tan Bee Lian",
            "credit_team_email": "sarah.tan@abs.com",
            "decided_at": "2026-03-10 10:00:00",
        }
        approved_result = sa5_capture_credit_decisions(
            TEST_CASE_STANDARD, CREDIT_BRIEF_ID_STANDARD, valid_approved
        )
        check("APPROVED: status is success", approved_result.get("status") == "success")
        check("APPROVED: decision_id is int",
              isinstance(approved_result.get("decision_id"), int))
        check("APPROVED: decisions_stored is True",
              approved_result.get("decisions_stored") is True)
        check("APPROVED: credit_outcome = APPROVED",
              approved_result.get("credit_outcome") == "APPROVED")
        check("APPROVED: has_conditions is False",
              approved_result.get("has_conditions") is False)
        check("APPROVED: approved_dce_limit_sgd correct",
              approved_result.get("approved_dce_limit_sgd") == 8000000.00)
        return valid_approved
    except Exception as e:
        check("T8 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T9: sa5_complete_node — CREDIT_APPROVED (happy path)
# ────────────────────────────────────────────────────────────────────────────
def test_t9_complete_node_approved(credit_decisions: dict, park_result: dict):
    section("T9: sa5_complete_node (CREDIT_APPROVED — Case 301)")
    try:
        hitl_task_id = park_result.get("hitl_task_id", "")
        n4_output = {
            "case_id": TEST_CASE_STANDARD,
            "credit_brief_id": CREDIT_BRIEF_ID_STANDARD,
            "credit_outcome": "APPROVED",
            "approved_dce_limit_sgd": 8000000,
            "approved_dce_pce_limit_sgd": 3000000,
            "confirmed_caa_approach": "IRB",
            "conditions": [],
            "next_node": "N-5",
        }
        result = sa5_complete_node(
            case_id=TEST_CASE_STANDARD,
            outcome="CREDIT_APPROVED",
            credit_brief_id=CREDIT_BRIEF_ID_STANDARD,
            credit_decisions=credit_decisions,
            n4_output=n4_output,
            hitl_task_id=hitl_task_id,
        )
        check("status is success", result.get("status") == "success")
        check("outcome is CREDIT_APPROVED", result.get("outcome") == "CREDIT_APPROVED")
        check("checkpoint_status is COMPLETE",
              result.get("checkpoint_status") == "COMPLETE")
        check("next_node is N-5", result.get("next_node") == "N-5")
        check("case_status is ACTIVE", result.get("case_status") == "ACTIVE")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("kafka_event_published is True", result.get("kafka_event_published") is True)
        check("kafka_event_type is CREDIT_APPROVED",
              result.get("kafka_event_type") == "CREDIT_APPROVED")

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node, hitl_queue FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_STANDARD,),
                )
                state = cursor.fetchone()
                check("case_state status = ACTIVE", state and state["status"] == "ACTIVE")
                check("current_node = N-5", state and state["current_node"] == "N-5")
                check("hitl_queue cleared", state and state["hitl_queue"] is None)

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-4' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                cp = cursor.fetchone()
                check("N-4 checkpoint = COMPLETE", cp and cp["status"] == "COMPLETE")

                cursor.execute(
                    "SELECT credit_outcome_flag FROM dce_ao_credit_brief "
                    "WHERE credit_brief_id = %s",
                    (CREDIT_BRIEF_ID_STANDARD,),
                )
                brief = cursor.fetchone()
                check("credit_brief outcome_flag = APPROVED",
                      brief and brief["credit_outcome_flag"] == "APPROVED")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T9 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T10: sa5_capture_credit_decisions — APPROVED_WITH_CONDITIONS (EDD case)
# ────────────────────────────────────────────────────────────────────────────
def test_t10_approved_with_conditions():
    global CREDIT_BRIEF_ID_EDD
    section("T10: sa5_capture_credit_decisions + sa5_complete_node (APPROVED_WITH_CONDITIONS)")
    try:
        # Compile brief for EDD case first
        rm_decisions_edd = {
            "kyc_risk_rating": "HIGH",
            "cdd_clearance": "ENHANCED_DUE_DILIGENCE",
            "caa_approach": "SA",
            "recommended_dce_limit_sgd": 15000000,
            "recommended_dce_pce_limit_sgd": 5000000,
            "osca_case_number": "OSCA-2026-003002",
            "limit_exposure_indication": "Multi-product; elevated risk; EDD in progress",
        }
        brief_result = sa5_compile_credit_brief(
            case_id=TEST_CASE_EDD,
            entity_name="Pacific Horizon Capital Ltd",
            entity_type="CORP",
            jurisdiction="HKG",
            products_requested=["FUTURES", "OTC_DERIVATIVES", "COMMODITIES_PHYSICAL"],
            rm_decisions=rm_decisions_edd,
            financial_summary={
                "years_analysed": 2, "total_equity_sgd": 20640000,
                "leverage_ratio": 0.2917, "liquidity_ratio": 3.393,
                "revenue_sgd": 7224000, "net_profit_sgd": 1685600,
                "estimated_initial_limit_sgd": 2064000,
            },
            open_questions=[
                "Await source-of-funds declaration from VGB UBO",
                "EDD documentation to be provided within 30 days",
            ],
            kb_chunks_used=["KB-6-chunk-1"],
        )
        CREDIT_BRIEF_ID_EDD = brief_result.get("credit_brief_id")
        check("EDD brief compiled", bool(CREDIT_BRIEF_ID_EDD))

        # Park for review
        deadline = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
        park_result = sa5_park_for_credit_review(
            case_id=TEST_CASE_EDD,
            credit_brief_id=CREDIT_BRIEF_ID_EDD,
            rm_id="RM-0087",
            priority="URGENT",
            brief_url=f"https://workbench.dce.internal/credit-briefs/{CREDIT_BRIEF_ID_EDD}",
            hitl_deadline=deadline,
        )
        check("EDD park: status success", park_result.get("status") == "success")

        # Capture decisions with conditions
        edd_decisions = {
            "credit_outcome": "APPROVED_WITH_CONDITIONS",
            "approved_dce_limit_sgd": 12000000.00,
            "approved_dce_pce_limit_sgd": 4000000.00,
            "confirmed_caa_approach": "SA",
            "conditions": [
                {
                    "type": "EDD_CLOSURE",
                    "description": "Source of funds declaration required from Pacific Horizon International BVI Ltd (UBO)",
                    "owner": "RM-0087",
                    "open_until_date": "2026-04-10",
                },
                {
                    "type": "CREDIT_CONDITION",
                    "description": "OTC derivatives notional capped at SGD 5M until EDD resolved",
                    "owner": "CT-001",
                    "open_until_date": "2026-04-10",
                },
            ],
            "credit_team_id": "CT-002",
            "credit_team_name": "Kevin Lau Chee Meng",
            "credit_team_email": "kevin.lau@abs.com",
            "decided_at": "2026-03-11T09:30:00Z",
        }
        cap_result = sa5_capture_credit_decisions(
            TEST_CASE_EDD, CREDIT_BRIEF_ID_EDD, edd_decisions
        )
        check("EDD capture: status success", cap_result.get("status") == "success")
        check("EDD capture: credit_outcome = APPROVED_WITH_CONDITIONS",
              cap_result.get("credit_outcome") == "APPROVED_WITH_CONDITIONS")
        check("EDD capture: has_conditions is True", cap_result.get("has_conditions") is True)
        check("EDD capture: conditions_count = 2", cap_result.get("conditions_count") == 2)

        # Complete node
        comp_result = sa5_complete_node(
            case_id=TEST_CASE_EDD,
            outcome="CREDIT_APPROVED_WITH_CONDITIONS",
            credit_brief_id=CREDIT_BRIEF_ID_EDD,
            credit_decisions=edd_decisions,
            n4_output={
                "case_id": TEST_CASE_EDD,
                "credit_outcome": "APPROVED_WITH_CONDITIONS",
                "conditions_count": 2,
                "next_node": "N-5",
            },
            hitl_task_id=park_result.get("hitl_task_id", ""),
        )
        check("EDD complete: status success", comp_result.get("status") == "success")
        check("EDD complete: outcome = CREDIT_APPROVED_WITH_CONDITIONS",
              comp_result.get("outcome") == "CREDIT_APPROVED_WITH_CONDITIONS")
        check("EDD complete: checkpoint_status = COMPLETE",
              comp_result.get("checkpoint_status") == "COMPLETE")
        check("EDD complete: next_node = N-5", comp_result.get("next_node") == "N-5")
        check("EDD complete: kafka_event_published",
              comp_result.get("kafka_event_published") is True)

        # Verify credit_brief outcome flag
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT credit_outcome_flag FROM dce_ao_credit_brief "
                    "WHERE credit_brief_id = %s",
                    (CREDIT_BRIEF_ID_EDD,),
                )
                brief = cursor.fetchone()
                check("EDD brief flag = APPROVED_WITH_CONDITIONS",
                      brief and brief["credit_outcome_flag"] == "APPROVED_WITH_CONDITIONS")
        finally:
            conn.close()
    except Exception as e:
        check("T10 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# T11: sa5_complete_node — CREDIT_DECLINED (separate test case)
# ────────────────────────────────────────────────────────────────────────────
def test_t11_complete_node_declined():
    section("T11: sa5_complete_node (CREDIT_DECLINED — isolated test)")
    # Use a separate brief/case record to avoid FK conflicts with T9
    conn = _get_conn()
    tmp_brief_id = "CBRIEF-DECL01"
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM dce_ao_credit_brief WHERE credit_brief_id = %s", (tmp_brief_id,))
            cursor.execute(
                """
                INSERT INTO dce_ao_credit_brief
                    (credit_brief_id, case_id, attempt_number, entity_legal_name, entity_type,
                     caa_approach, recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
                     osca_case_number, kyc_risk_rating, compiled_by_model)
                VALUES (%s, %s, 99, 'Test Decline Entity', 'CORP', 'SA', 0, 0, 'DECL', 'MEDIUM', 'test')
                """,
                (tmp_brief_id, TEST_CASE_STANDARD),
            )
        conn.commit()
    finally:
        conn.close()

    try:
        declined_decisions = {
            "credit_outcome": "DECLINED",
            "approved_dce_limit_sgd": 0,
            "approved_dce_pce_limit_sgd": 0,
            "confirmed_caa_approach": "SA",
            "conditions": [],
            "decline_reason": "Insufficient equity base; leverage ratio exceeds threshold for requested limit size",
            "credit_team_id": "CT-003",
            "credit_team_name": "Lisa Wong",
            "decided_at": "2026-03-12 14:00:00",
        }
        # T8 already wrote APPROVED for case 301; clear it so T11 can write DECLINED
        # (dce_ao_credit_decision has UNIQUE KEY on case_id)
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM dce_ao_credit_decision WHERE case_id = %s",
                    (TEST_CASE_STANDARD,),
                )
            conn.commit()
        finally:
            conn.close()

        # Capture decisions first (FK requires credit_brief_id to exist in dce_ao_credit_brief)
        sa5_capture_credit_decisions(TEST_CASE_STANDARD, tmp_brief_id, declined_decisions)

        result = sa5_complete_node(
            case_id=TEST_CASE_STANDARD,
            outcome="CREDIT_DECLINED",
            credit_brief_id=tmp_brief_id,
            credit_decisions=declined_decisions,
            n4_output={
                "case_id": TEST_CASE_STANDARD,
                "credit_outcome": "DECLINED",
                "next_node": "DEAD",
            },
            failure_reason="CREDIT_DECLINED — insufficient equity for requested limits",
        )
        check("DECLINED: status is success", result.get("status") == "success")
        check("DECLINED: outcome is CREDIT_DECLINED",
              result.get("outcome") == "CREDIT_DECLINED")
        check("DECLINED: checkpoint_status = FAILED",
              result.get("checkpoint_status") == "FAILED")
        check("DECLINED: next_node = DEAD", result.get("next_node") == "DEAD")
        check("DECLINED: kafka_event_published is False",
              result.get("kafka_event_published") is False)
        check("DECLINED: kafka_event_type is CREDIT_DECLINED",
              result.get("kafka_event_type") == "CREDIT_DECLINED")

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_STANDARD,),
                )
                state = cursor.fetchone()
                # Note: T9 already advanced case 301 to N-5/ACTIVE; DECLINED writes ESCALATED/DEAD
                check("case_state status = ESCALATED",
                      state and state["status"] == "ESCALATED")
                check("current_node = DEAD",
                      state and state["current_node"] == "DEAD")

                cursor.execute(
                    "SELECT credit_outcome_flag FROM dce_ao_credit_brief "
                    "WHERE credit_brief_id = %s",
                    (tmp_brief_id,),
                )
                brief = cursor.fetchone()
                check("Brief outcome_flag = DECLINED",
                      brief and brief["credit_outcome_flag"] == "DECLINED")
        finally:
            conn.close()

        # Cleanup temp brief
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "DELETE FROM dce_ao_credit_decision WHERE credit_brief_id = %s",
                    (tmp_brief_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_credit_brief WHERE credit_brief_id = %s",
                    (tmp_brief_id,),
                )
            conn.commit()
        finally:
            conn.close()

    except Exception as e:
        check("T11 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# T12: sa5_get_case_context — case not found guard
# ────────────────────────────────────────────────────────────────────────────
def test_t12_case_not_found():
    section("T12: sa5_get_case_context (case not found guard)")
    try:
        result = sa5_get_case_context("AO-9999-999999", phase="PHASE1")
        check("Not found: status is error", result.get("status") == "error")
        check("Not found: error message present", bool(result.get("error")))
    except Exception as e:
        check("T12 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# Main runner
# ────────────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "=" * 60)
    print("  DCE Account Opening — SA-5 Tool Integration Tests")
    print("=" * 60)

    # Cleanup before tests
    section("Pre-Test: Cleanup")
    cleanup_test_data()

    # Run tests sequentially (each builds on prior results)
    context_301   = test_t1_get_case_context()
    test_t2_get_case_context_edd()
    financial_301 = test_t3_extract_financial_data(context_301)
    test_t4_extract_financial_data_edd()
    brief_301     = test_t5_compile_credit_brief(context_301, financial_301)
    test_t6_compile_brief_unacceptable_guard()
    park_301      = test_t7_park_for_credit_review(brief_301)
    decisions_301 = test_t8_capture_credit_decisions()
    test_t9_complete_node_approved(decisions_301, park_301)
    test_t10_approved_with_conditions()
    test_t11_complete_node_declined()
    test_t12_case_not_found()

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
