"""
DCE Account Opening — SA-6 Tool Integration Tests
==================================================
Tests for all 6 SA-6 MCP tools. Run inside the dce_mcp_sa6 container.

Test cases use seed data from db/012_sa6_seed.sql:
  - AO-2026-000401: Stellar Trading Pte Ltd (SGP CORP, FUTURES+OPTIONS)
    → Standard case: APPROVED, IRB, MEDIUM risk — TMO_VALIDATED path
  - AO-2026-000402: Dragon Phoenix Holdings Ltd (HKG CORP, MULTI_PRODUCT)
    → Edge case: APPROVED_WITH_CONDITIONS, SA, HIGH risk — TMO_DISCREPANCY_FOUND

Run command (from project root):
    export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
    docker cp tests/test_sa6_tools.py dce_mcp_sa6:/app/test_sa6_tools.py
    docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \\
      dce_mcp_sa6 python /app/test_sa6_tools.py

Expected: 42/42 passed
"""

import sys
import json
import traceback
import datetime

# ─── Direct import (same Python env as sa6_server.py) ──────────────────────
from sa6_server import (
    sa6_get_case_context,
    sa6_build_config_spec,
    sa6_generate_tmo_instruction,
    sa6_park_for_tmo_execution,
    sa6_validate_system_config,
    sa6_complete_node,
    _get_conn,
)

# ─── Test case constants ────────────────────────────────────────────────────
TEST_CASE_STANDARD  = "AO-2026-000401"   # Stellar — APPROVED, IRB → TMO_VALIDATED
TEST_CASE_EDD       = "AO-2026-000402"   # Dragon Phoenix — APPROVED_WITH_CONDITIONS → DISCREPANCY

SPEC_ID_STANDARD  = None   # Set dynamically after T3
SPEC_ID_EDD       = None
INSTRUCTION_ID_STANDARD = None
INSTRUCTION_ID_EDD = None

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
    """Remove SA-6 test data so tests are idempotent between runs."""
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for case_id in (TEST_CASE_STANDARD, TEST_CASE_EDD):
                cursor.execute("DELETE FROM dce_ao_system_validation WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_tmo_instruction WHERE case_id = %s", (case_id,))
                cursor.execute("DELETE FROM dce_ao_config_spec WHERE case_id = %s", (case_id,))
                cursor.execute(
                    "DELETE FROM dce_ao_hitl_review_task WHERE case_id = %s AND node_id = 'N-5'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_node_checkpoint WHERE case_id = %s AND node_id = 'N-5'",
                    (case_id,),
                )
                cursor.execute(
                    "DELETE FROM dce_ao_event_log WHERE case_id = %s AND triggered_by LIKE 'sa6%%'",
                    (case_id,),
                )
                cursor.execute(
                    "UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-5', "
                    "hitl_queue=NULL WHERE case_id = %s",
                    (case_id,),
                )
        conn.commit()
        print("  [cleanup] SA-6 test data cleared for both test cases.")
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────────────────────
# T1: sa6_get_case_context — Phase 1 (Standard case)
# ────────────────────────────────────────────────────────────────────────────
def test_t1_get_case_context():
    section("T1: sa6_get_case_context (PHASE1 — Stellar, standard)")
    try:
        result = sa6_get_case_context(TEST_CASE_STANDARD, phase="PHASE1")
        check("status is success", result.get("status") == "success")
        check("case_state returned", isinstance(result.get("case_state"), dict))
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_STANDARD)
        check("current_node is N-5",
              result.get("case_state", {}).get("current_node") == "N-5")
        check("credit_decisions returned", isinstance(result.get("credit_decisions"), dict))
        check("credit_outcome is APPROVED",
              result.get("credit_decisions", {}).get("credit_outcome") == "APPROVED")
        check("approved_dce_limit_sgd present",
              result.get("credit_decisions", {}).get("approved_dce_limit_sgd") is not None)
        check("n4_output returned", isinstance(result.get("n4_output"), dict))
        check("classification_result returned",
              isinstance(result.get("classification_result"), dict))
        check("products_requested is list",
              isinstance(result.get("classification_result", {}).get("products_requested"), list))
        check("authorised_traders is list",
              isinstance(result.get("authorised_traders"), list))
        check("at least 1 authorised trader",
              len(result.get("authorised_traders", [])) >= 1)
        check("extracted_data returned",
              isinstance(result.get("extracted_data"), dict))
        return result
    except Exception as e:
        check("T1 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T2: sa6_get_case_context — Phase 1 (EDD case)
# ────────────────────────────────────────────────────────────────────────────
def test_t2_get_case_context_edd():
    section("T2: sa6_get_case_context (PHASE1 — Dragon Phoenix, EDD)")
    try:
        result = sa6_get_case_context(TEST_CASE_EDD, phase="PHASE1")
        check("status is success", result.get("status") == "success")
        check("case_id correct",
              result.get("case_state", {}).get("case_id") == TEST_CASE_EDD)
        check("credit_outcome is APPROVED_WITH_CONDITIONS",
              result.get("credit_decisions", {}).get("credit_outcome") == "APPROVED_WITH_CONDITIONS")
        check("conditions exist",
              isinstance(result.get("credit_decisions", {}).get("conditions"), list)
              and len(result.get("credit_decisions", {}).get("conditions", [])) >= 1)
        check("approved_dce_limit_sgd = 18M",
              float(result.get("credit_decisions", {}).get("approved_dce_limit_sgd", 0)) == 18000000.0)
        check("authorised_traders >= 2",
              len(result.get("authorised_traders", [])) >= 2)
        return result
    except Exception as e:
        check("T2 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T3: sa6_build_config_spec — Standard case (FUTURES + OPTIONS)
# ────────────────────────────────────────────────────────────────────────────
def test_t3_build_config_spec(context_result: dict):
    global SPEC_ID_STANDARD
    section("T3: sa6_build_config_spec (Case 401 — Stellar, FUTURES+OPTIONS)")
    try:
        extracted = context_result.get("extracted_data", {})
        credit = context_result.get("credit_decisions", {})

        result = sa6_build_config_spec(
            case_id=TEST_CASE_STANDARD,
            entity_name="Stellar Trading Pte Ltd",
            entity_type="CORP",
            jurisdiction="SGP",
            lei_number=extracted.get("lei_number", "549300STELLAR01XYZAB"),
            products_requested=["FUTURES", "OPTIONS"],
            credit_outcome="APPROVED",
            approved_dce_limit_sgd=float(credit.get("approved_dce_limit_sgd", 10000000)),
            approved_dce_pce_limit_sgd=float(credit.get("approved_dce_pce_limit_sgd", 4000000)),
            confirmed_caa_approach="IRB",
            authorised_traders=context_result.get("authorised_traders", [
                {"name": "David Tan Chee Keong", "designation": "Director", "id_number": "S7812345A"},
                {"name": "Ryan Ng Wei Ming", "designation": "Senior Trader", "id_number": "S8534567C"},
            ]),
            kb_chunks_used=["KB-6-chunk-1", "KB-6-chunk-2"],
            compiled_by_model="qwen2.5:32b",
        )
        check("status is success", result.get("status") == "success")
        check("spec_id generated", bool(result.get("spec_id")))
        check("spec_id format CSPEC-XXXXXX",
              str(result.get("spec_id", "")).startswith("CSPEC-"))
        check("ubix_config returned", isinstance(result.get("ubix_config"), dict))
        check("ubix entity_name correct",
              result.get("ubix_config", {}).get("entity_name") == "Stellar Trading Pte Ltd")
        check("ubix product_permissions has 2 items",
              len(result.get("ubix_config", {}).get("product_permissions", [])) == 2)
        check("sic_config returned", isinstance(result.get("sic_config"), dict))
        check("sic credit_limits has dce_limit",
              result.get("sic_config", {}).get("credit_limits", {}).get("dce_limit_sgd") == 10000000)
        check("cv_config returned", isinstance(result.get("cv_config"), dict))
        check("cv credit_limit_sgd = 10M",
              result.get("cv_config", {}).get("credit_limit_sgd") == 10000000)
        check("cv caa_approach = IRB",
              result.get("cv_config", {}).get("caa_approach") == "IRB")
        check("authorised_traders formatted",
              len(result.get("authorised_traders", [])) == 2)
        check("traders_configured = 2", result.get("traders_configured") == 2)
        check("config_status = DRAFT", result.get("config_status") == "DRAFT")

        SPEC_ID_STANDARD = result.get("spec_id")
        print(f"  [info] spec_id={SPEC_ID_STANDARD}")
        return result
    except Exception as e:
        check("T3 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T4: sa6_build_config_spec — EDD case (MULTI_PRODUCT)
# ────────────────────────────────────────────────────────────────────────────
def test_t4_build_config_spec_edd(context_result: dict):
    global SPEC_ID_EDD
    section("T4: sa6_build_config_spec (Case 402 — Dragon Phoenix, MULTI_PRODUCT)")
    try:
        result = sa6_build_config_spec(
            case_id=TEST_CASE_EDD,
            entity_name="Dragon Phoenix Holdings Ltd",
            entity_type="CORP",
            jurisdiction="HKG",
            lei_number="213800DRAGONPH01ABCD",
            products_requested=["FUTURES", "OTC_DERIVATIVES", "COMMODITIES_PHYSICAL"],
            credit_outcome="APPROVED_WITH_CONDITIONS",
            approved_dce_limit_sgd=18000000.0,
            approved_dce_pce_limit_sgd=6000000.0,
            confirmed_caa_approach="SA",
            authorised_traders=context_result.get("authorised_traders", [
                {"name": "Michael Chen Wei", "designation": "Director / CIO", "id_number": "C1234567"},
                {"name": "Amy Liu Xin", "designation": "Head of Derivatives", "id_number": "C7654321"},
                {"name": "Kevin Park Joon", "designation": "Commodities Trader", "id_number": "M12345678"},
            ]),
            kb_chunks_used=["KB-6-chunk-1"],
        )
        check("status is success", result.get("status") == "success")
        check("ubix product_permissions has 3 items",
              len(result.get("ubix_config", {}).get("product_permissions", [])) == 3)
        check("sic commission_rates has 3 products",
              len(result.get("sic_config", {}).get("commission_rates", {})) == 3)
        check("cv caa_approach = SA",
              result.get("cv_config", {}).get("caa_approach") == "SA")
        check("traders_configured = 3", result.get("traders_configured") == 3)

        SPEC_ID_EDD = result.get("spec_id")
        print(f"  [info] spec_id={SPEC_ID_EDD}")
        return result
    except Exception as e:
        check("T4 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T5: sa6_generate_tmo_instruction — Standard case
# ────────────────────────────────────────────────────────────────────────────
def test_t5_generate_tmo_instruction():
    global INSTRUCTION_ID_STANDARD
    section("T5: sa6_generate_tmo_instruction (Case 401 — Stellar)")
    try:
        instruction_doc = {
            "ubix_instructions": "1. Create UBIX account for Stellar Trading Pte Ltd\n2. Set product permissions: FUTURES (SGX), OPTIONS (SGX)\n3. Enter LEI: 549300STELLAR01XYZAB\n4. Set regulatory flag: MAS_CMS\n5. Set reporting jurisdiction: SG",
            "sic_instructions": "1. Map account SIC-AO-2026-000401\n2. Set FUTURES commission: 2.5 bps base + 0.5 bps clearing + 1.0 bps exchange\n3. Set OPTIONS commission: 3.0 bps base + 0.5 bps clearing + 1.5 bps exchange\n4. Set DCE limit: SGD 10,000,000\n5. Set DCE-PCE limit: SGD 4,000,000",
            "cv_instructions": "1. Map contract CV-AO-2026-000401\n2. Set credit limit: SGD 10,000,000\n3. Set PCE limit: SGD 4,000,000\n4. Set margin multiplier: 1.0 (IRB)\n5. Set PCE haircut: 5.0%\n6. Set max tenor: 365 days",
            "trader_setup": "1. David Tan Chee Keong (S7812345A) — FULL_TRADING\n2. Ryan Ng Wei Ming (S8534567C) — FULL_TRADING",
            "validation_checklist": [
                "Verify UBIX account created with correct LEI",
                "Verify product permissions match instruction",
                "Verify SIC commission rates match instruction",
                "Verify CV credit limits match instruction",
                "Verify all traders configured with correct permissions",
            ],
        }
        result = sa6_generate_tmo_instruction(
            case_id=TEST_CASE_STANDARD,
            spec_id=SPEC_ID_STANDARD,
            instruction_document=instruction_doc,
            generated_by_model="qwen2.5:32b",
        )
        check("status is success", result.get("status") == "success")
        check("instruction_id generated", bool(result.get("instruction_id")))
        check("instruction_id format TINST-XXXXXX",
              str(result.get("instruction_id", "")).startswith("TINST-"))
        check("instruction_url returned", bool(result.get("instruction_url")))
        check("config_spec_status = INSTRUCTION_GENERATED",
              result.get("config_spec_status") == "INSTRUCTION_GENERATED")

        INSTRUCTION_ID_STANDARD = result.get("instruction_id")
        print(f"  [info] instruction_id={INSTRUCTION_ID_STANDARD}")
        return result
    except Exception as e:
        check("T5 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T6: sa6_generate_tmo_instruction — EDD case
# ────────────────────────────────────────────────────────────────────────────
def test_t6_generate_tmo_instruction_edd():
    global INSTRUCTION_ID_EDD
    section("T6: sa6_generate_tmo_instruction (Case 402 — Dragon Phoenix)")
    try:
        instruction_doc = {
            "ubix_instructions": "1. Create UBIX account for Dragon Phoenix Holdings Ltd\n2. Set product permissions: FUTURES (SGX), OTC_DERIVATIVES (OTC), COMMODITIES_PHYSICAL (LME)\n3. Enter LEI: 213800DRAGONPH01ABCD\n4. Set regulatory flags: ISDA_MASTER, COMMODITY_BROKER\n5. Set reporting jurisdiction: HK",
            "sic_instructions": "1. Map account SIC-AO-2026-000402\n2. Set FUTURES commission: 2.5 bps\n3. Set OTC_DERIVATIVES commission: 5.0 bps\n4. Set COMMODITIES commission: 4.0 bps\n5. Set DCE limit: SGD 18,000,000\n6. Set DCE-PCE limit: SGD 6,000,000",
            "cv_instructions": "1. Map contract CV-AO-2026-000402\n2. Set credit limit: SGD 18,000,000\n3. Set PCE limit: SGD 6,000,000\n4. Set margin multiplier: 1.25 (SA)\n5. Set PCE haircut: 8.0%\n6. Set max tenor: 180 days\n7. NOTE: OTC derivatives notional capped at SGD 8M per credit conditions",
            "trader_setup": "1. Michael Chen Wei (C1234567) — FULL_TRADING\n2. Amy Liu Xin (C7654321) — FULL_TRADING\n3. Kevin Park Joon (M12345678) — FULL_TRADING",
            "validation_checklist": [
                "Verify UBIX account with all 3 product permissions",
                "Verify SIC commission rates for all products",
                "Verify CV limits and margin rates (SA approach)",
                "Verify OTC notional cap per credit conditions",
                "Verify all 3 traders configured",
            ],
        }
        result = sa6_generate_tmo_instruction(
            case_id=TEST_CASE_EDD,
            spec_id=SPEC_ID_EDD,
            instruction_document=instruction_doc,
            generated_by_model="qwen2.5:32b",
        )
        check("status is success", result.get("status") == "success")
        check("instruction_id generated", bool(result.get("instruction_id")))
        check("config_spec_status = INSTRUCTION_GENERATED",
              result.get("config_spec_status") == "INSTRUCTION_GENERATED")

        INSTRUCTION_ID_EDD = result.get("instruction_id")
        print(f"  [info] instruction_id={INSTRUCTION_ID_EDD}")
        return result
    except Exception as e:
        check("T6 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T7: sa6_park_for_tmo_execution — Standard case
# ────────────────────────────────────────────────────────────────────────────
def test_t7_park_for_tmo_execution(instruction_result: dict):
    section("T7: sa6_park_for_tmo_execution (Case 401 — Stellar)")
    try:
        hitl_deadline = (
            datetime.datetime.now() + datetime.timedelta(days=2)
        ).strftime("%Y-%m-%d %H:%M:%S")
        instruction_url = instruction_result.get(
            "instruction_url",
            f"https://workbench.dce.internal/tmo-instructions/{INSTRUCTION_ID_STANDARD}"
        )

        result = sa6_park_for_tmo_execution(
            case_id=TEST_CASE_STANDARD,
            spec_id=SPEC_ID_STANDARD,
            instruction_id=INSTRUCTION_ID_STANDARD,
            instruction_url=instruction_url,
            rm_id="RM-0061",
            priority="STANDARD",
            hitl_deadline=hitl_deadline,
        )
        check("status is success", result.get("status") == "success")
        check("hitl_task_id generated", bool(result.get("hitl_task_id")))
        check("hitl_task_id format HITL-XXXXXX",
              str(result.get("hitl_task_id", "")).startswith("HITL-"))
        check("case_status = HITL_PENDING",
              result.get("case_status") == "HITL_PENDING")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("next_action = TMO_STATIC_EXECUTION",
              result.get("next_action") == "TMO_STATIC_EXECUTION")
        check("assigned_persona = TMO_STATIC",
              result.get("assigned_persona") == "TMO_STATIC")

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

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-5' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                cp = cursor.fetchone()
                check("N-5 checkpoint = HITL_PENDING",
                      cp and cp["status"] == "HITL_PENDING")

                cursor.execute(
                    "SELECT task_type, assigned_persona FROM dce_ao_hitl_review_task "
                    "WHERE case_id = %s AND node_id = 'N-5' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                task = cursor.fetchone()
                check("HITL task type = TMO_STATIC_REVIEW",
                      task and task["task_type"] == "TMO_STATIC_REVIEW")
                check("HITL assigned_persona = TMO_STATIC",
                      task and task["assigned_persona"] == "TMO_STATIC")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T7 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T8: sa6_validate_system_config — All Pass (Standard case)
# ────────────────────────────────────────────────────────────────────────────
def test_t8_validate_all_pass():
    section("T8: sa6_validate_system_config (Case 401 — all systems PASS)")
    try:
        # No overrides → simulated read-back matches instruction perfectly
        result = sa6_validate_system_config(
            case_id=TEST_CASE_STANDARD,
            spec_id=SPEC_ID_STANDARD,
        )
        check("status is success", result.get("status") == "success")
        check("overall_status = TMO_VALIDATED",
              result.get("overall_status") == "TMO_VALIDATED")
        check("all_systems_pass is True", result.get("all_systems_pass") is True)
        check("systems_validated = 3", result.get("systems_validated") == 3)
        check("total_discrepancies = 0", result.get("total_discrepancies") == 0)

        vs = result.get("validation_summary", {})
        check("UBIX = PASS", vs.get("UBIX") == "PASS")
        check("SIC = PASS", vs.get("SIC") == "PASS")
        check("CV = PASS", vs.get("CV") == "PASS")
        return result
    except Exception as e:
        check("T8 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T9: sa6_validate_system_config — With Discrepancies (EDD case)
# ────────────────────────────────────────────────────────────────────────────
def test_t9_validate_with_discrepancy():
    section("T9: sa6_validate_system_config (Case 402 — SIC discrepancy)")
    try:
        # First need to park case 402 (to have its spec in the right state)
        hitl_deadline = (
            datetime.datetime.now() + datetime.timedelta(days=1)
        ).strftime("%Y-%m-%d %H:%M:%S")
        sa6_park_for_tmo_execution(
            case_id=TEST_CASE_EDD,
            spec_id=SPEC_ID_EDD,
            instruction_id=INSTRUCTION_ID_EDD,
            instruction_url=f"https://workbench.dce.internal/tmo-instructions/{INSTRUCTION_ID_EDD}",
            rm_id="RM-0092",
            priority="URGENT",
            hitl_deadline=hitl_deadline,
        )

        # Inject a SIC discrepancy: wrong credit limits
        result = sa6_validate_system_config(
            case_id=TEST_CASE_EDD,
            spec_id=SPEC_ID_EDD,
            system_confirmations={
                "SIC": {
                    "credit_limits": {
                        "dce_limit_sgd": 15000000,  # Should be 18M — discrepancy!
                        "dce_pce_limit_sgd": 6000000,
                    },
                },
            },
        )
        check("status is success", result.get("status") == "success")
        check("overall_status = TMO_DISCREPANCY_FOUND",
              result.get("overall_status") == "TMO_DISCREPANCY_FOUND")
        check("all_systems_pass is False", result.get("all_systems_pass") is False)
        check("total_discrepancies >= 1", result.get("total_discrepancies", 0) >= 1)

        vs = result.get("validation_summary", {})
        check("UBIX = PASS", vs.get("UBIX") == "PASS")
        check("SIC = FAIL", vs.get("SIC") == "FAIL")
        check("CV = PASS", vs.get("CV") == "PASS")

        # Check discrepancy details
        per_system = result.get("per_system_results", [])
        sic_result = next((r for r in per_system if r["system_name"] == "SIC"), {})
        check("SIC has discrepancies",
              len(sic_result.get("discrepancies", [])) >= 1)
        return result
    except Exception as e:
        check("T9 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T10: sa6_complete_node — TMO_VALIDATED (happy path)
# ────────────────────────────────────────────────────────────────────────────
def test_t10_complete_node_validated(park_result: dict):
    section("T10: sa6_complete_node (TMO_VALIDATED — Case 401)")
    try:
        hitl_task_id = park_result.get("hitl_task_id", "")
        n5_output = {
            "case_id": TEST_CASE_STANDARD,
            "spec_id": SPEC_ID_STANDARD,
            "instruction_id": INSTRUCTION_ID_STANDARD,
            "validation_status": "TMO_VALIDATED",
            "all_systems_pass": True,
            "ubix_status": "PASS",
            "sic_status": "PASS",
            "cv_status": "PASS",
            "next_node": "N-6",
        }
        result = sa6_complete_node(
            case_id=TEST_CASE_STANDARD,
            outcome="TMO_VALIDATED",
            spec_id=SPEC_ID_STANDARD,
            instruction_id=INSTRUCTION_ID_STANDARD,
            n5_output=n5_output,
            hitl_task_id=hitl_task_id,
        )
        check("status is success", result.get("status") == "success")
        check("outcome = TMO_VALIDATED", result.get("outcome") == "TMO_VALIDATED")
        check("checkpoint_status = COMPLETE",
              result.get("checkpoint_status") == "COMPLETE")
        check("next_node = N-6", result.get("next_node") == "N-6")
        check("case_status = ACTIVE", result.get("case_status") == "ACTIVE")
        check("checkpoint_written is True", result.get("checkpoint_written") is True)
        check("event_type = TMO_CONFIG_COMPLETE",
              result.get("event_type") == "TMO_CONFIG_COMPLETE")

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
                check("current_node = N-6", state and state["current_node"] == "N-6")
                check("hitl_queue cleared", state and state["hitl_queue"] is None)

                cursor.execute(
                    "SELECT status FROM dce_ao_node_checkpoint "
                    "WHERE case_id = %s AND node_id = 'N-5' LIMIT 1",
                    (TEST_CASE_STANDARD,),
                )
                cp = cursor.fetchone()
                check("N-5 checkpoint = COMPLETE", cp and cp["status"] == "COMPLETE")
        finally:
            conn.close()
        return result
    except Exception as e:
        check("T10 no exception", False, str(e))
        traceback.print_exc()
        return {}


# ────────────────────────────────────────────────────────────────────────────
# T11: sa6_complete_node — TMO_DISCREPANCY_FOUND
# ────────────────────────────────────────────────────────────────────────────
def test_t11_complete_node_discrepancy():
    section("T11: sa6_complete_node (TMO_DISCREPANCY_FOUND — Case 402)")
    try:
        # Get HITL task for case 402
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT task_id FROM dce_ao_hitl_review_task "
                    "WHERE case_id = %s AND node_id = 'N-5' LIMIT 1",
                    (TEST_CASE_EDD,),
                )
                task_row = cursor.fetchone()
                hitl_task_id = task_row["task_id"] if task_row else ""
        finally:
            conn.close()

        n5_output = {
            "case_id": TEST_CASE_EDD,
            "spec_id": SPEC_ID_EDD,
            "instruction_id": INSTRUCTION_ID_EDD,
            "validation_status": "TMO_DISCREPANCY_FOUND",
            "all_systems_pass": False,
            "sic_discrepancies": [
                {"field": "credit_limits", "expected": 18000000, "actual": 15000000},
            ],
            "next_node": "N-5",
        }
        result = sa6_complete_node(
            case_id=TEST_CASE_EDD,
            outcome="TMO_DISCREPANCY_FOUND",
            spec_id=SPEC_ID_EDD,
            instruction_id=INSTRUCTION_ID_EDD,
            n5_output=n5_output,
            hitl_task_id=hitl_task_id,
            failure_reason="SIC credit limits mismatch: instructed 18M, configured 15M",
        )
        check("status is success", result.get("status") == "success")
        check("outcome = TMO_DISCREPANCY_FOUND",
              result.get("outcome") == "TMO_DISCREPANCY_FOUND")
        check("checkpoint_status = FAILED",
              result.get("checkpoint_status") == "FAILED")
        check("case_status = ESCALATED",
              result.get("case_status") == "ESCALATED")
        check("event_type = TMO_DISCREPANCY_ESCALATED",
              result.get("event_type") == "TMO_DISCREPANCY_ESCALATED")

        # Verify DB state
        conn = _get_conn()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT status, current_node FROM dce_ao_case_state WHERE case_id = %s",
                    (TEST_CASE_EDD,),
                )
                state = cursor.fetchone()
                check("case_state status = ESCALATED",
                      state and state["status"] == "ESCALATED")

                cursor.execute(
                    "SELECT status FROM dce_ao_tmo_instruction WHERE instruction_id = %s",
                    (INSTRUCTION_ID_EDD,),
                )
                inst = cursor.fetchone()
                check("TMO instruction status = TMO_FAILED",
                      inst and inst["status"] == "TMO_FAILED")
        finally:
            conn.close()
    except Exception as e:
        check("T11 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# T12: Error guards
# ────────────────────────────────────────────────────────────────────────────
def test_t12_error_guards():
    section("T12: Error guards")
    try:
        # Case not found
        result = sa6_get_case_context("AO-9999-999999", phase="PHASE1")
        check("Case not found: status is error", result.get("status") == "error")
        check("Case not found: error message present", bool(result.get("error")))

        # Invalid outcome
        result = sa6_complete_node(
            case_id=TEST_CASE_STANDARD,
            outcome="INVALID_OUTCOME",
            spec_id="CSPEC-000000",
            instruction_id="TINST-000000",
            n5_output={},
        )
        check("Invalid outcome: status is error", result.get("status") == "error")

        # Spec not found for validation
        result = sa6_validate_system_config(
            case_id=TEST_CASE_STANDARD,
            spec_id="CSPEC-NONEXIST",
        )
        check("Spec not found: status is error", result.get("status") == "error")
    except Exception as e:
        check("T12 no exception", False, str(e))
        traceback.print_exc()


# ────────────────────────────────────────────────────────────────────────────
# Main runner
# ────────────────────────────────────────────────────────────────────────────
def main():
    print("\n" + "=" * 60)
    print("  DCE Account Opening — SA-6 Tool Integration Tests")
    print("=" * 60)

    # Cleanup before tests
    section("Pre-Test: Cleanup")
    cleanup_test_data()

    # Run tests sequentially (each builds on prior results)
    context_401 = test_t1_get_case_context()
    context_402 = test_t2_get_case_context_edd()
    spec_401    = test_t3_build_config_spec(context_401)
    test_t4_build_config_spec_edd(context_402)
    inst_401    = test_t5_generate_tmo_instruction()
    test_t6_generate_tmo_instruction_edd()
    park_401    = test_t7_park_for_tmo_execution(inst_401)
    test_t8_validate_all_pass()
    test_t9_validate_with_discrepancy()
    test_t10_complete_node_validated(park_401)
    test_t11_complete_node_discrepancy()
    test_t12_error_guards()

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
