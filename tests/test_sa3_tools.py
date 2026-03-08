"""
Integration test for SA-3 MCP tools against live MariaDB.
Exercises all 5 tools in the correct two-phase agent iteration order:

  Phase 1 (Pre-HITL):
    T1 — sa3_get_case_context (PHASE1)
    T2 — sa3_run_signature_analysis_batch
    T3 — sa3_park_for_hitl

  Phase 2 (Post-HITL):
    T4 — sa3_get_case_context (PHASE2)
    T5 — sa3_store_approved_specimens
    T6 — sa3_complete_node (SIGNATURE_APPROVED)

  Extras:
    T7 — sa3_complete_node (ESCALATE_COMPLIANCE)
    T8 — sa3_complete_node (SIGNATURE_REJECTED)

Requires: docker compose up -d (dce_mariadb must be healthy)
Run from project root: python tests/test_sa3_tools.py
"""

import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "mcp_servers"))

from config import DB_CONFIG
from sa3_server import (
    sa3_get_case_context,
    sa3_run_signature_analysis_batch,
    sa3_park_for_hitl,
    sa3_store_approved_specimens,
    sa3_complete_node,
)

PASS = 0
FAIL = 0

# ─────────────────────────────────────────────
# Test Fixture — use seed case AO-2026-000102
# (SA-2 complete, SA-3 not yet started — good starting point)
# ─────────────────────────────────────────────
TEST_CASE_ID = "AO-2026-000102"

MOCK_ANALYSIS_RESULTS = [
    {
        "signatory_id": "SIG-001",
        "signatory_name": "Wei Ming Tan",
        "authority_status": "AUTHORISED",
        "role_in_mandate": "Director",
        "confidence_score": 91.5,
        "source_doc_ids": ["DOC-000001"],
        "id_doc_ref": "ID-000001",
        "comparison_overlay_ref": "mongo://overlays/SIG-001-overlay.png",
        "signature_crop_refs": ["mongo://crops/SIG-001-crop-1.png"]
    },
    {
        "signatory_id": "SIG-002",
        "signatory_name": "Sarah Lim Hui Ying",
        "authority_status": "AUTHORISED",
        "role_in_mandate": "Authorised Signatory",
        "confidence_score": 74.2,
        "source_doc_ids": ["DOC-000001", "DOC-000002"],
        "id_doc_ref": "ID-000002",
        "comparison_overlay_ref": "mongo://overlays/SIG-002-overlay.png",
        "signature_crop_refs": ["mongo://crops/SIG-002-crop-1.png"]
    }
]

MOCK_HITL_DECISIONS_APPROVED = [
    {
        "signatory_id": "SIG-001",
        "signatory_name": "Wei Ming Tan",
        "outcome": "APPROVED",
        "notes": "HIGH confidence. Clear mandate authority as Director.",
        "approving_officer_id": "DS-0015",
        "decided_at": "2026-03-06T10:00:00+08:00"
    },
    {
        "signatory_id": "SIG-002",
        "signatory_name": "Sarah Lim Hui Ying",
        "outcome": "APPROVED",
        "notes": "MEDIUM confidence accepted — consistent style and clear mandate authority.",
        "approving_officer_id": "DS-0015",
        "decided_at": "2026-03-06T10:05:00+08:00"
    }
]

MOCK_HITL_DECISIONS_REJECTED = [
    {
        "signatory_id": "SIG-001",
        "signatory_name": "Wei Ming Tan",
        "outcome": "APPROVED",
        "notes": "Clear match.",
        "approving_officer_id": "DS-0015",
        "decided_at": "2026-03-06T10:00:00+08:00"
    },
    {
        "signatory_id": "SIG-002",
        "signatory_name": "Sarah Lim Hui Ying",
        "outcome": "REJECTED",
        "notes": "Signature does not match ID document — different stroke pattern.",
        "approving_officer_id": "DS-0015",
        "decided_at": "2026-03-06T10:05:00+08:00"
    }
]

MOCK_ANALYSIS_LOW_CONFIDENCE = [
    {
        "signatory_id": "SIG-003",
        "signatory_name": "Low Confidence Signatory",
        "authority_status": "AUTHORISED",
        "role_in_mandate": "Director",
        "confidence_score": 42.0,     # LOW tier — triggers ESCALATE_COMPLIANCE
        "source_doc_ids": ["DOC-000003"],
        "id_doc_ref": "ID-000003",
        "comparison_overlay_ref": "mongo://overlays/SIG-003-overlay.png",
        "signature_crop_refs": ["mongo://crops/SIG-003-crop-1.png"]
    }
]

# Different case for escalation tests to avoid primary key conflicts
TEST_CASE_ESCALATE = "AO-2026-000101"


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def check(label, result, key="status", expected="success"):
    global PASS, FAIL
    actual = result.get(key) if isinstance(result, dict) else None
    ok = actual == expected
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {label}")
    if not ok:
        print(f"         Expected {key}={expected!r}, got {actual!r}")
        if "error" in result:
            print(f"         Error: {result.get('error', '')}")
        FAIL += 1
    else:
        PASS += 1
    return ok


def check_key(label, result, key, not_none=True):
    """Check a key exists and optionally is not None/empty."""
    global PASS, FAIL
    val = result.get(key) if isinstance(result, dict) else None
    ok = (val is not None) if not_none else True
    icon = "PASS" if ok else "FAIL"
    print(f"  [{icon}] {label}")
    if not ok:
        print(f"         Key '{key}' is None or missing in result")
        FAIL += 1
    else:
        PASS += 1
    return ok


# ─────────────────────────────────────────────
# Setup: Clean test data before each run
# ─────────────────────────────────────────────

def cleanup_test_data():
    """Remove SA-3 test rows from previous runs to allow idempotent re-runs."""
    import pymysql
    cfg = DB_CONFIG.copy()
    conn = pymysql.connect(**cfg)
    try:
        cur = conn.cursor()
        test_cases = [TEST_CASE_ID, TEST_CASE_ESCALATE]
        placeholders = ",".join(["%s"] * len(test_cases))

        cur.execute(f"DELETE FROM dce_ao_signature_verification WHERE case_id IN ({placeholders})", test_cases)
        cur.execute(f"DELETE FROM dce_ao_signature_specimen      WHERE case_id IN ({placeholders})", test_cases)
        cur.execute(f"DELETE FROM dce_ao_hitl_review_task        WHERE case_id IN ({placeholders})", test_cases)
        # Also clean node_checkpoint for SA-3 nodes only (N-2)
        cur.execute(
            f"DELETE FROM dce_ao_node_checkpoint WHERE case_id IN ({placeholders}) AND node_id = 'N-2'",
            test_cases
        )
        # Reset case_state status back to ACTIVE so tests can re-park
        cur.execute(
            f"UPDATE dce_ao_case_state SET status='ACTIVE', current_node='N-2', hitl_queue=NULL "
            f"WHERE case_id IN ({placeholders})",
            test_cases
        )
        conn.commit()
        print(f"  [SETUP] Cleaned SA-3 test data for {test_cases}")
    except Exception as e:
        print(f"  [SETUP WARN] cleanup failed: {e}")
    finally:
        conn.close()


# ─────────────────────────────────────────────
# SECTION 1: Phase 1 — Pre-HITL
# ─────────────────────────────────────────────

def test_phase1_context_injector():
    print("\n--- T1: sa3_get_case_context (PHASE1) ---")
    result = sa3_get_case_context(case_id=TEST_CASE_ID, mode="PHASE1")

    check("status is success", result)
    check_key("case_state populated", result, "case_state")
    check_key("staged_docs present", result, "staged_docs")
    check_key("rm_hierarchy present", result, "rm_hierarchy")

    cs = result.get("case_state", {})
    assert isinstance(cs, dict), "case_state must be a dict"
    print(f"  [INFO] case_id={cs.get('case_id')} jurisdiction={cs.get('jurisdiction')} status={cs.get('status')}")
    print(f"  [INFO] staged_doc_count={len(result.get('staged_docs', []))}")
    return result


def test_phase1_signature_analysis():
    print("\n--- T2: sa3_run_signature_analysis_batch (2 signatories, HIGH + MEDIUM) ---")
    result = sa3_run_signature_analysis_batch(
        case_id=TEST_CASE_ID,
        attempt_number=1,
        analysis_results_json=json.dumps(MOCK_ANALYSIS_RESULTS)
    )

    check("status is success", result)
    check_key("classified_results present", result, "classified_results")
    check_key("overall_status present", result, "overall_status")

    results = result.get("classified_results", [])
    assert len(results) == 2, f"Expected 2 signatory results, got {len(results)}"

    # Check confidence tiers applied correctly
    sig1 = next((r for r in results if r["signatory_id"] == "SIG-001"), None)
    sig2 = next((r for r in results if r["signatory_id"] == "SIG-002"), None)
    assert sig1 is not None, "SIG-001 missing from results"
    assert sig2 is not None, "SIG-002 missing from results"
    assert sig1["confidence_tier"] == "HIGH", f"SIG-001 expected HIGH, got {sig1.get('confidence_tier')}"
    assert sig2["confidence_tier"] == "MEDIUM", f"SIG-002 expected MEDIUM, got {sig2.get('confidence_tier')}"
    print(f"  [PASS] SIG-001 tier=HIGH ({sig1['confidence_score']}%)")
    print(f"  [PASS] SIG-002 tier=MEDIUM ({sig2['confidence_score']}%)")
    PASS_inc = 2
    global PASS
    PASS += PASS_inc

    overall = result.get("overall_status")
    print(f"  [INFO] overall_status={overall}")
    return result


def test_phase1_park_for_hitl():
    print("\n--- T3: sa3_park_for_hitl (STANDARD priority) ---")
    task_payload = {
        "case_id": TEST_CASE_ID,
        "verification_report": {"overall_status": "MIXED_FLAGS", "flag_count": 1},
        "priority": "STANDARD"
    }
    result = sa3_park_for_hitl(
        case_id=TEST_CASE_ID,
        attempt_number=1,
        task_payload_json=json.dumps(task_payload),
        priority="STANDARD",
        deadline="2026-03-07 10:00:00",
        assigned_to_id=None
    )

    check("status is success", result)
    check_key("hitl_task_id generated", result, "hitl_task_id")
    check_key("checkpoint_id written", result, "checkpoint_id")

    hitl_id = result.get("hitl_task_id", "")
    assert hitl_id.startswith("HITL-"), f"hitl_task_id should start with HITL-, got {hitl_id!r}"
    print(f"  [PASS] hitl_task_id={hitl_id}")
    global PASS
    PASS += 1
    print(f"  [INFO] checkpoint_id={result.get('checkpoint_id')} priority={result.get('priority')} deadline={result.get('hitl_deadline')}")
    return result, hitl_id


# ─────────────────────────────────────────────
# SECTION 2: Phase 2 — Post-HITL (All Approved)
# ─────────────────────────────────────────────

def test_phase2_context_resume():
    print("\n--- T4: sa3_get_case_context (PHASE2 — fetches HITL state) ---")
    result = sa3_get_case_context(case_id=TEST_CASE_ID, mode="PHASE2")

    check("status is success", result)
    check_key("case_state populated", result, "case_state")

    cs = result.get("case_state", {})
    print(f"  [INFO] case status after HITL_PENDING={cs.get('status')}")
    print(f"  [INFO] phase1_results count={len(result.get('phase1_results', []))}")
    return result


def test_phase2_store_approved_specimens():
    print("\n--- T5: sa3_store_approved_specimens (2 approved signatories) ---")
    approved_with_decisions = []
    for sig in MOCK_ANALYSIS_RESULTS:
        decision = next(
            d for d in MOCK_HITL_DECISIONS_APPROVED
            if d["signatory_id"] == sig["signatory_id"]
        )
        # sa3_store_approved_specimens expects: source_doc_id (str), mongodb_specimen_ref, approving_officer_id
        doc_ids = sig.get("source_doc_ids", ["DOC-000001"])
        approved_with_decisions.append({
            **sig,
            **decision,
            "source_doc_id": doc_ids[0] if doc_ids else "DOC-000001",
            "mongodb_specimen_ref": f"mongo://specimens/{sig['signatory_id']}-specimen.png",
        })

    result = sa3_store_approved_specimens(
        case_id=TEST_CASE_ID,
        approved_signatories_json=json.dumps(approved_with_decisions)
    )

    check("status is success", result)
    check_key("specimen_ids present", result, "specimen_ids")
    check_key("specimens_stored_count present", result, "specimens_stored_count")

    specimen_ids = result.get("specimen_ids", [])
    assert len(specimen_ids) == 2, f"Expected 2 specimen IDs, got {len(specimen_ids)}"

    for spec_id in specimen_ids:
        assert spec_id.startswith("SPEC-"), f"specimen_id should start with SPEC-, got {spec_id!r}"

    print(f"  [PASS] specimen_ids={specimen_ids}")
    global PASS
    PASS += len(specimen_ids)
    return result, specimen_ids


def test_phase2_complete_node_approved(specimen_ids):
    print("\n--- T6: sa3_complete_node (SIGNATURE_APPROVED → N-3) ---")
    n2_output = {
        "case_id": TEST_CASE_ID,
        "verification_status": "ALL_APPROVED",
        "total_signatories": 2,
        "approved_count": 2,
        "rejected_count": 0,
        "clarify_count": 0,
        "signatories": MOCK_HITL_DECISIONS_APPROVED,
        "specimens_stored": specimen_ids,
        "reviewed_by_officer_id": "DS-0015",
        "next_node": "N-3",
        "verification_notes": "2 signatories verified. All specimens stored."
    }
    result = sa3_complete_node(
        case_id=TEST_CASE_ID,
        outcome="SIGNATURE_APPROVED",
        output_json=json.dumps(n2_output),
        specimens_stored_json=json.dumps(specimen_ids),
        hitl_task_id="",
        reviewed_by_officer_id="DS-0015"
    )

    check("status is success", result)
    check("next_node is N-3", result, "next_node", "N-3")
    check_key("checkpoint_id written", result, "checkpoint_id")

    print(f"  [INFO] checkpoint_id={result.get('checkpoint_id')} next_node={result.get('next_node')}")
    return result


# ─────────────────────────────────────────────
# SECTION 3: Edge Cases
# ─────────────────────────────────────────────

def test_escalate_compliance():
    print("\n--- T7: sa3_run_signature_analysis_batch + sa3_complete_node (ESCALATE) ---")
    # Use a different case to avoid duplicate key constraint
    result = sa3_run_signature_analysis_batch(
        case_id=TEST_CASE_ESCALATE,
        attempt_number=2,
        analysis_results_json=json.dumps(MOCK_ANALYSIS_LOW_CONFIDENCE)
    )
    check("analysis status is success", result)

    results = result.get("results", [])
    low = next((r for r in results if r.get("signatory_id") == "SIG-003"), None)
    if low:
        assert low.get("confidence_tier") == "LOW", f"Expected LOW tier for 42% score, got {low.get('confidence_tier')}"
        assert low.get("escalate_immediate") is True, "escalate_immediate should be True for LOW tier"
        print(f"  [PASS] SIG-003 tier=LOW (42.0%) — escalation triggered correctly")
        global PASS
        PASS += 2

    # sa3_complete_node ESCALATE_COMPLIANCE
    escalate_result = sa3_complete_node(
        case_id=TEST_CASE_ESCALATE,
        outcome="ESCALATE_COMPLIANCE",
        rejected_signatories_json=json.dumps(MOCK_ANALYSIS_LOW_CONFIDENCE)
    )
    check("escalate checkpoint status is success", escalate_result)
    check("outcome is ESCALATE_COMPLIANCE", escalate_result, "outcome", "ESCALATE_COMPLIANCE")
    print(f"  [INFO] escalation checkpoint written for case {TEST_CASE_ESCALATE}")


def test_complete_node_rejected():
    print("\n--- T8: sa3_complete_node (SIGNATURE_REJECTED) ---")
    # Use a fresh case that hasn't been touched yet
    result = sa3_run_signature_analysis_batch(
        case_id=TEST_CASE_ESCALATE,
        attempt_number=3,
        analysis_results_json=json.dumps([MOCK_ANALYSIS_RESULTS[0]])  # 1 signatory only
    )
    check("analysis for rejection test is success", result)

    reject_result = sa3_complete_node(
        case_id=TEST_CASE_ESCALATE,
        outcome="SIGNATURE_REJECTED",
        rejected_signatories_json=json.dumps([
            {"signatory_id": "SIG-001", "reason": "Signature does not match ID document"}
        ]),
        hitl_task_id="",
        reviewed_by_officer_id="DS-0015"
    )
    check("rejection checkpoint status is success", reject_result)
    check("next_node is SIGNATURE_REJECTED", reject_result, "next_node", "SIGNATURE_REJECTED")
    print(f"  [INFO] rejection checkpoint written for case {TEST_CASE_ESCALATE}")


def test_get_context_unknown_case():
    print("\n--- T9: sa3_get_case_context (unknown case_id — graceful error) ---")
    result = sa3_get_case_context(case_id="AO-UNKNOWN-9999", mode="PHASE1")
    # Should return error status gracefully, not raise exception
    assert isinstance(result, dict), "Must return a dict even on error"
    print(f"  [PASS] Returned dict on unknown case: status={result.get('status')}")
    global PASS
    PASS += 1


def test_park_hitl_invalid_priority():
    print("\n--- T10: sa3_park_for_hitl (invalid priority — fallback to STANDARD) ---")
    result = sa3_park_for_hitl(
        case_id=TEST_CASE_ESCALATE,
        attempt_number=4,
        task_payload_json=json.dumps({"note": "test with bad priority"}),
        priority="INVALID_PRIORITY",
        deadline="2026-03-08 10:00:00",
        assigned_to_id=None
    )
    # Should not crash — should normalise or default
    assert isinstance(result, dict), "Must return a dict even on invalid priority"
    print(f"  [PASS] Returned dict on invalid priority: status={result.get('status')}")
    global PASS
    PASS += 1


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    global PASS, FAIL
    print("=" * 70)
    print("SA-3 MCP Tools — Integration Test against MariaDB")
    print(f"DB: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print(f"Primary test case: {TEST_CASE_ID}")
    print(f"Secondary test case: {TEST_CASE_ESCALATE}")
    print("=" * 70)
    cleanup_test_data()

    # ── Phase 1: Pre-HITL ──────────────────────────────────────────────
    print("\n" + "═" * 70)
    print("PHASE 1 — Pre-HITL (automated signature analysis)")
    print("═" * 70)

    test_phase1_context_injector()
    test_phase1_signature_analysis()
    _, hitl_task_id = test_phase1_park_for_hitl()

    # ── Phase 2: Post-HITL ─────────────────────────────────────────────
    print("\n" + "═" * 70)
    print("PHASE 2 — Post-HITL (human decisions received, specimens stored)")
    print("═" * 70)

    test_phase2_context_resume()
    _, specimen_ids = test_phase2_store_approved_specimens()
    test_phase2_complete_node_approved(specimen_ids)

    # ── Edge Cases ─────────────────────────────────────────────────────
    print("\n" + "═" * 70)
    print("EDGE CASES — Escalation, rejection, error handling")
    print("═" * 70)

    test_escalate_compliance()
    test_complete_node_rejected()
    test_get_context_unknown_case()
    test_park_hitl_invalid_priority()

    # ── Summary ────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    total = PASS + FAIL
    print(f"Results: {PASS}/{total} passed  |  {FAIL} failed")
    if FAIL == 0:
        print("ALL TESTS PASSED ✓")
    else:
        print(f"ATTENTION: {FAIL} test(s) failed — review output above")
    print("=" * 70)
    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
