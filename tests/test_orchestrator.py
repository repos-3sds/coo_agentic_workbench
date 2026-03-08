#!/usr/bin/env python3
"""
Domain Orchestrator — MCP Tool Tests
=====================================
Calls orchestrator MCP tools on port 8006 and validates responses.
Tests the full E2E pipeline: N-0 → N-6 → DONE.

Usage:
    python tests/test_orchestrator.py          (from host)
    docker exec dce_mcp_orchestrator python /app/tests/test_orchestrator.py  (from container)
"""

import json
import sys
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MCP_URL = "http://127.0.0.1:8006/mcp"
TEST_CASE_ID = "AO-2026-000601"

PASS = 0
FAIL = 0


def _call_mcp(tool_name: str, arguments: dict, session_id: str = "") -> dict:
    """Call an orchestrator MCP tool and return the parsed result."""
    # Initialize session if needed
    if not session_id:
        init_payload = json.dumps({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": "2025-03-26",
                "capabilities": {},
                "clientInfo": {"name": "test-orchestrator", "version": "1.0.0"},
            },
        }).encode()
        req = urllib.request.Request(
            MCP_URL,
            data=init_payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json, text/event-stream",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            session_id = resp.headers.get("Mcp-Session-Id", "")
            resp.read()

    # Call the tool
    call_payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }).encode()

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id

    req2 = urllib.request.Request(MCP_URL, data=call_payload, headers=headers)
    with urllib.request.urlopen(req2, timeout=300) as resp2:
        raw = resp2.read().decode("utf-8", errors="replace")

    # Parse SSE
    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            try:
                parsed = json.loads(line[6:])
                if "result" in parsed:
                    content = parsed["result"].get("content", [])
                    for item in content:
                        if item.get("type") == "text":
                            return json.loads(item["text"])
                    return parsed["result"]
                elif "error" in parsed:
                    return {"error": parsed["error"]}
            except json.JSONDecodeError:
                continue

    return {"error": "No result found", "raw": raw[:500]}


def check(label: str, condition: bool, detail: str = ""):
    """Assert a test condition."""
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  ✅ {label}")
    else:
        FAIL += 1
        detail_str = f" — {detail}" if detail else ""
        print(f"  ❌ {label}{detail_str}")


# ---------------------------------------------------------------------------
# T0: Reset test case (clean slate)
# ---------------------------------------------------------------------------
def test_reset():
    print("\n═══ T0: Reset Test Case ═══")
    result = _call_mcp("orch_reset_test_case", {"case_id": TEST_CASE_ID})
    check("Reset returns ok", result.get("status") == "ok", json.dumps(result)[:200])
    check("Case ID matches", result.get("case_id") == TEST_CASE_ID)


# ---------------------------------------------------------------------------
# T1: Pipeline status for fresh case
# ---------------------------------------------------------------------------
def test_pipeline_status_fresh():
    print("\n═══ T1: Pipeline Status (Fresh Case) ═══")
    result = _call_mcp("orch_get_pipeline_status", {"case_id": TEST_CASE_ID})
    check("Status is ok", result.get("status") == "ok")
    check("Pipeline status is NEW_CASE", result.get("pipeline_status") == "NEW_CASE")
    check("Next node is N-0", result.get("next_node") == "N-0")
    check("Completed nodes empty", result.get("completed_nodes") == [])
    check("No checkpoints", result.get("checkpoint_count") == 0)


# ---------------------------------------------------------------------------
# T2: Execute N-0 (Case Intake)
# ---------------------------------------------------------------------------
def test_execute_n0():
    print("\n═══ T2: Execute N-0 (Case Intake) ═══")
    result = _call_mcp("orch_execute_node", {
        "case_id": TEST_CASE_ID,
        "node_id": "N-0",
        "auto_hitl": True,
    })
    check("No error", "error" not in result, result.get("error", ""))
    check("Node ID is N-0", result.get("node_id") == "N-0")
    check("Outcome is COMPLETE", result.get("outcome") == "COMPLETE")
    check("Next node is N-1", result.get("next_node") == "N-1")
    check("Has case_id", bool(result.get("case_id")))
    check("Tools called >= 3", len(result.get("tools_called", [])) >= 3)
    # Store the actual case_id for subsequent tests
    return result.get("case_id", TEST_CASE_ID)


# ---------------------------------------------------------------------------
# T3: Full Pipeline E2E (the main test)
# ---------------------------------------------------------------------------
def test_full_pipeline():
    print("\n═══ T3: Full Pipeline E2E (N-0 → DONE) ═══")
    print("  ⏳ Running full pipeline (this may take 30-60 seconds)...")
    result = _call_mcp("orch_run_full_pipeline", {
        "case_id": TEST_CASE_ID,
        "auto_hitl": True,
    })

    check("No error", "error" not in result and not result.get("errors"),
          str(result.get("error", result.get("errors", "")))[:300])
    check("Final status is DONE", result.get("final_status") == "DONE",
          f"Got: {result.get('final_status')}")
    check("All 7 nodes executed", len(result.get("nodes_executed", [])) == 7,
          f"Got: {result.get('nodes_executed')}")
    check("Nodes in correct order",
          result.get("nodes_executed") == ["N-0", "N-1", "N-2", "N-3", "N-4", "N-5", "N-6"],
          f"Got: {result.get('nodes_executed')}")
    check("HITL auto-resolved count >= 3", result.get("hitl_auto_resolved", 0) >= 3,
          f"Got: {result.get('hitl_auto_resolved')}")
    check("Total tools called >= 20", result.get("tools_called_total", 0) >= 20,
          f"Got: {result.get('tools_called_total')}")

    case_id = result.get("case_id", TEST_CASE_ID)
    print(f"  📋 Case ID: {case_id}")
    print(f"  ⏱️  Duration: {result.get('total_duration_seconds', '?')}s")
    print(f"  🔧 Tools called: {result.get('tools_called_total', '?')}")
    print(f"  🔄 HITL auto-resolved: {result.get('hitl_auto_resolved', '?')}")

    return case_id


# ---------------------------------------------------------------------------
# T4: Verify DB state after E2E
# ---------------------------------------------------------------------------
def test_db_verification(case_id: str):
    print(f"\n═══ T4: DB Verification (case: {case_id}) ═══")

    # Use pipeline status to check
    status = _call_mcp("orch_get_pipeline_status", {"case_id": case_id})
    check("Pipeline status is DONE", status.get("pipeline_status") == "DONE",
          f"Got: {status.get('pipeline_status')}")
    check("7 checkpoints", status.get("checkpoint_count", 0) >= 7,
          f"Got: {status.get('checkpoint_count')}")
    check("Events logged", status.get("event_count", 0) >= 14,
          f"Got: {status.get('event_count')}")

    # Check completion registry
    registry = _call_mcp("orch_get_completion_registry", {"case_id": case_id})
    reg_text = registry.get("completion_registry", "")
    for node in ["N-0", "N-1", "N-2", "N-3", "N-4", "N-5", "N-6"]:
        check(f"{node} shows COMPLETE in registry", f"{node} | COMPLETE" in reg_text,
              f"Registry: {reg_text[:200]}")


# ---------------------------------------------------------------------------
# T5: Error guards
# ---------------------------------------------------------------------------
def test_error_guards():
    print("\n═══ T5: Error Guards ═══")

    # Invalid case_id
    result = _call_mcp("orch_execute_node", {
        "case_id": "AO-INVALID-999",
        "node_id": "N-1",
    })
    check("Invalid case returns error", "error" in result)

    # Unknown node_id
    result = _call_mcp("orch_execute_node", {
        "case_id": TEST_CASE_ID,
        "node_id": "N-99",
    })
    check("Unknown node returns error", "error" in result)

    # Reset guard — wrong prefix
    result = _call_mcp("orch_reset_test_case", {"case_id": "AO-2026-000101"})
    check("Reset guard blocks non-test cases", "error" in result)


# ---------------------------------------------------------------------------
# T6: Reset and re-test (verify reset works)
# ---------------------------------------------------------------------------
def test_reset_and_rerun(case_id: str):
    print(f"\n═══ T6: Reset and Verify Clean State ═══")

    result = _call_mcp("orch_reset_test_case", {"case_id": case_id})
    check("Reset ok", result.get("status") == "ok")
    check("Rows deleted > 0", result.get("total_rows_deleted", 0) > 0,
          f"Got: {result.get('total_rows_deleted')}")

    # Verify clean state
    status = _call_mcp("orch_get_pipeline_status", {"case_id": case_id})
    check("After reset: NEW_CASE", status.get("pipeline_status") == "NEW_CASE")
    check("After reset: 0 checkpoints", status.get("checkpoint_count") == 0)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("  DCE Domain Orchestrator — MCP Tool Tests")
    print("=" * 60)

    # T0: Reset first
    test_reset()

    # T1: Fresh status
    test_pipeline_status_fresh()

    # T3: Full E2E pipeline (includes N-0 through N-6)
    e2e_case_id = test_full_pipeline()

    # T4: DB verification
    test_db_verification(e2e_case_id)

    # T5: Error guards
    test_error_guards()

    # T6: Reset and verify
    test_reset_and_rerun(e2e_case_id)

    # Summary
    print("\n" + "=" * 60)
    total = PASS + FAIL
    print(f"  Results: {PASS}/{total} passed, {FAIL} failed")
    if FAIL:
        print("  ⚠️  Some tests FAILED")
        sys.exit(1)
    else:
        print("  ✅ All tests PASSED")
    print("=" * 60)
