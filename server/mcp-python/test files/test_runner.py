"""
Test all MCP tools via the REST API.
Works on Windows, Linux, Mac — uses only Python stdlib (no pip install needed).

Usage:
    python test_runner.py                                            # localhost:3002
    python test_runner.py https://mcp-tools-npa.apps.your-cluster.com
    python test_runner.py http://10.0.1.50:3002
"""

import json
import sys
import urllib.request
import urllib.error
from typing import Any, Dict, Optional, Tuple

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3002"
TOOLS_URL = f"{BASE_URL}/tools"
PASS = 0
FAIL = 0
TOTAL = 0
EXECUTED = set()


def _read_response_body(resp) -> str:
    try:
        raw = resp.read()
    except Exception:
        return ""
    try:
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return str(raw)[:500]


def request_json(method: str, url: str, data: Optional[Dict[str, Any]] = None, timeout: int = 20) -> Dict[str, Any]:
    """HTTP JSON helper with better diagnostics (handles HTML error pages cleanly)."""
    body = None
    headers = {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            text = _read_response_body(resp)
            try:
                return json.loads(text)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Non-JSON response (HTTP {getattr(resp, 'status', '?')}): {e}",
                    "raw_snippet": text[:400],
                }
    except urllib.error.HTTPError as e:
        text = _read_response_body(e)
        return {
            "success": False,
            "error": f"HTTPError {e.code}: {e.reason}",
            "raw_snippet": text[:400],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def get(url: str, timeout: int = 10) -> Dict[str, Any]:
    return request_json("GET", url, data=None, timeout=timeout)


def post(url: str, data: Dict[str, Any], timeout: int = 20) -> Dict[str, Any]:
    return request_json("POST", url, data=data, timeout=timeout)


def test_tool(name: str, data: dict):
    """Test a single tool and print PASS/FAIL."""
    global PASS, FAIL, TOTAL
    TOTAL += 1
    EXECUTED.add(name)
    resp = post(f"{TOOLS_URL}/{name}", data)
    if resp.get("success") is True:
        print(f"  PASS  {name}")
        PASS += 1
    else:
        print(f"  FAIL  {name}")
        err = json.dumps(resp, default=str)[:300]
        print(f"        Response: {err}")
        FAIL += 1
    return resp


def skip_tool(name: str, reason: str):
    print(f"  SKIP  {name} — {reason}")


def extract(resp, *keys):
    """Safely drill into nested response dict."""
    obj = resp
    for k in keys:
        if isinstance(obj, dict):
            obj = obj.get(k)
        elif isinstance(obj, list) and isinstance(k, int) and k < len(obj):
            obj = obj[k]
        else:
            return None
    return obj


# ────────────────────────────────────────────────────────────────
# Payload helpers (use OpenAPI schema + known IDs)
# ────────────────────────────────────────────────────────────────

def placeholder_for(schema: Dict[str, Any]) -> Any:
    if not isinstance(schema, dict):
        return "test"

    if "enum" in schema and isinstance(schema["enum"], list) and schema["enum"]:
        return schema["enum"][0]

    t = schema.get("type")
    if t == "string":
        return "test"
    if t == "integer":
        return 1
    if t == "number":
        return 1.0
    if t == "boolean":
        return True
    if t == "array":
        # Minimal non-empty array if items are primitive
        items = schema.get("items", {})
        return [placeholder_for(items)]
    if t == "object":
        return {}
    return "test"


def schema_for_tool(openapi: Dict[str, Any], tool_name: str) -> Dict[str, Any]:
    path = f"/tools/{tool_name}"
    post_spec = (((openapi or {}).get("paths") or {}).get(path) or {}).get("post") or {}
    schema = (
        (((post_spec.get("requestBody") or {}).get("content") or {}).get("application/json") or {}).get("schema")
        or {}
    )
    return schema if isinstance(schema, dict) else {}


def build_payload(schema: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    props = schema.get("properties") if isinstance(schema, dict) else {}
    required = schema.get("required") if isinstance(schema, dict) else []

    payload: Dict[str, Any] = {}
    if isinstance(required, list):
        for key in required:
            if isinstance(key, str):
                payload[key] = placeholder_for((props or {}).get(key, {}))

    # Contextual overrides
    for k, v in list(payload.items()):
        if k in ("project_id", "npa_id"):
            payload[k] = context.get("NPA_ID") or v
        elif k == "session_id":
            payload[k] = context.get("SESSION_ID") or v
        elif k == "signoff_id":
            payload[k] = context.get("SIGNOFF_ID") or v
        elif k == "document_id":
            payload[k] = context.get("DOCUMENT_ID") or v
        elif k == "doc_id":
            payload[k] = context.get("KB_DOC_ID") or v
        elif k == "condition_id":
            payload[k] = context.get("CONDITION_ID") or v

    # Some tools accept alternate param names
    if "signoffs_json" in payload and isinstance(payload.get("signoffs_json"), str):
        # Always provide a valid JSON array string
        payload["signoffs_json"] = json.dumps(context.get("SIGNOFFS_FIXTURE", []))

    return payload


# ═══════════════════════════════════════════════════════════════════
#  Preflight: Health Check
# ═══════════════════════════════════════════════════════════════════
print("--- Preflight: Health Check ---")
health = get(f"{BASE_URL}/health", timeout=8)
if health.get("status") == "ok":
    tool_count = health.get("tools") or health.get("tool_count") or "?"
    print(f"  OK     Server reachable - {tool_count} tools registered")
else:
    print(f"  FATAL  Cannot reach {BASE_URL}/health")
    print(f"         {health.get('error')}")
    if health.get("raw_snippet"):
        print(f"         Raw: {health.get('raw_snippet')}")
    print("         Is the server running? Check the URL and try again.")
    sys.exit(1)

print("--- Preflight: Tools + OpenAPI ---")
tools_list = get(f"{BASE_URL}/tools", timeout=15)
openapi = get(f"{BASE_URL}/openapi.json", timeout=15)
tools = tools_list.get("tools") if isinstance(tools_list.get("tools"), list) else []
tools_count = tools_list.get("count", len(tools))
paths_count = len((openapi.get("paths") or {})) if isinstance(openapi, dict) else 0
print(f"  Tools  {tools_count}")
print(f"  Paths  {paths_count} (OpenAPI)")
if tools_count and paths_count and tools_count != paths_count:
    print("  WARN   Tool count != OpenAPI path count (check /openapi.json generation)")
print()

print()
print("============================================")
print("  Testing MCP Tools (Python port)")
print("============================================")
print()

# ═══════════════════════════════════════════════════════════════════
#  Step 0: Create test NPA (needed by almost everything)
# ═══════════════════════════════════════════════════════════════════
print("--- Setup: Creating test NPA ---")
npa_resp = post(f"{TOOLS_URL}/ideation_create_npa", {
    "title": "Python Test Derivative",
    "npa_type": "Variation",
    "risk_level": "MEDIUM",
    "submitted_by": "Test-Script",
})
NPA_ID = extract(npa_resp, "data", "npa_id")
print(f"  Created test NPA: {NPA_ID}")
print()

# Shared context IDs for payload builder
CTX: Dict[str, Any] = {"NPA_ID": NPA_ID}

# ═══════════════════════════════════════════════════════════════════
#  1. SESSION (2 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Session Tools (2) ---")
test_tool("session_create", {"agent_id": "test-agent", "project_id": NPA_ID, "user_id": "tester"})

sess_resp = post(f"{TOOLS_URL}/session_create", {"agent_id": "test-agent-2", "project_id": NPA_ID})
SESSION_ID = extract(sess_resp, "data", "session_id")
CTX["SESSION_ID"] = SESSION_ID

test_tool("session_log_message", {
    "session_id": SESSION_ID, "role": "agent",
    "content": "Test message from Python MCP server",
    "agent_confidence": 95, "reasoning_chain": "Testing all tools",
    "citations": ["doc1.pdf", "doc2.pdf"],
})
print()

# Prepare signoffs + document fixture IDs for tools that require them.
print("--- Setup: Creating signoff + document fixtures ---")
SIGNOFFS_FIXTURE = [
    {"party": "Credit Risk", "department": "Risk Management", "approver_name": "John Smith", "approver_email": "john@test.com", "sla_hours": 48},
    {"party": "Legal", "department": "Legal & Compliance", "approver_name": "Jane Doe", "sla_hours": 72},
]
CTX["SIGNOFFS_FIXTURE"] = SIGNOFFS_FIXTURE

post(f"{TOOLS_URL}/governance_create_signoff_matrix", {"project_id": NPA_ID, "signoffs_json": json.dumps(SIGNOFFS_FIXTURE)})
signoff_resp = post(f"{TOOLS_URL}/governance_get_signoffs", {"project_id": NPA_ID})
SIGNOFF_ID = extract(signoff_resp, "data", "signoffs", 0, "id")
CTX["SIGNOFF_ID"] = SIGNOFF_ID
print(f"  Using signoff ID: {SIGNOFF_ID}")

doc_resp = post(f"{TOOLS_URL}/upload_document_metadata", {
    "project_id": NPA_ID,
    "document_name": "Python Test Term Sheet",
    "document_type": "TERM_SHEET",
    "file_extension": "pdf",
    "file_size": "1.0 MB",
})
DOCUMENT_ID = extract(doc_resp, "data", "document_id")
CTX["DOCUMENT_ID"] = DOCUMENT_ID
print(f"  Using document ID: {DOCUMENT_ID}")
print()

# Additional fixtures for tools with stricter preconditions (bundling / evergreen / doc lifecycle).
print("--- Setup: Creating bundling + evergreen fixtures ---")

# Bundling requires a parent product already in LAUNCHED stage.
parent_resp = post(f"{TOOLS_URL}/ideation_create_npa", {
    "title": "Python Test Parent Product (Bundling)",
    "npa_type": "Existing",
    "risk_level": "LOW",
    "product_category": "FX",
    "currency": "USD",
    "notional_amount": 1000000,
    "submitted_by": "Test-Script",
    "initial_stage": "LAUNCHED",
})
BUNDLING_PARENT_ID = extract(parent_resp, "data", "npa_id")
CTX["BUNDLING_PARENT_ID"] = BUNDLING_PARENT_ID

child_resp = post(f"{TOOLS_URL}/ideation_create_npa", {
    "title": "Python Test Child Product (Bundling)",
    "npa_type": "Variation",
    "risk_level": "LOW",
    "product_category": "FX",
    "currency": "USD",
    "notional_amount": 900000,
    "submitted_by": "Test-Script",
})
BUNDLING_CHILD_ID = extract(child_resp, "data", "npa_id")
CTX["BUNDLING_CHILD_ID"] = BUNDLING_CHILD_ID

# Bundling condition #8 expects an approved Operations signoff on the parent.
ops_signoffs = [{"party": "Operations", "department": "TECH_OPS", "approver_name": "Ops Approver", "sla_hours": 24}]
post(f"{TOOLS_URL}/governance_create_signoff_matrix", {"project_id": BUNDLING_PARENT_ID, "signoffs_json": json.dumps(ops_signoffs)})
ops_list = post(f"{TOOLS_URL}/governance_get_signoffs", {"project_id": BUNDLING_PARENT_ID})
OPS_SIGNOFF_ID = extract(ops_list, "data", "signoffs", 0, "id")
if OPS_SIGNOFF_ID:
    post(f"{TOOLS_URL}/governance_record_decision", {"signoff_id": OPS_SIGNOFF_ID, "decision": "APPROVED", "comments": "Approved via test runner"})

# Evergreen usage requires approval_track=EVERGREEN.
evergreen_resp = post(f"{TOOLS_URL}/ideation_create_npa", {
    "title": "Python Test Evergreen Product",
    "npa_type": "Existing",
    "risk_level": "LOW",
    "product_category": "FX",
    "currency": "USD",
    "notional_amount": 5000000,
    "submitted_by": "Test-Script",
})
EVERGREEN_ID = extract(evergreen_resp, "data", "npa_id")
CTX["EVERGREEN_ID"] = EVERGREEN_ID
if EVERGREEN_ID:
    post(f"{TOOLS_URL}/update_npa_project", {"project_id": EVERGREEN_ID, "updates_json": json.dumps({"approval_track": "EVERGREEN", "notional_amount": 5000000})})

print(f"  Bundling parent: {BUNDLING_PARENT_ID}")
print(f"  Bundling child:  {BUNDLING_CHILD_ID}")
print(f"  Evergreen NPA:   {EVERGREEN_ID}")
print()

# ═══════════════════════════════════════════════════════════════════
#  2. IDEATION (smoke)
# ═══════════════════════════════════════════════════════════════════
print("--- Ideation Tools (5) ---")
test_tool("ideation_create_npa", {
    "title": "Python Test Bond", "npa_type": "New-to-Group", "risk_level": "HIGH",
    "product_category": "Fixed Income", "description": "Test NPA from Python port",
    "is_cross_border": True, "notional_amount": 50000000, "currency": "USD",
    "submitted_by": "Python-Test",
})
test_tool("ideation_find_similar", {"search_term": "Python Test", "limit": 5})
test_tool("ideation_get_prohibited_list", {})
test_tool("ideation_save_concept", {
    "project_id": NPA_ID, "concept_notes": "Test concept from Python",
    "product_rationale": "Testing the port", "target_market": "Institutional",
    "estimated_revenue": 1000000,
})
test_tool("ideation_list_templates", {"active_only": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  3. CLASSIFICATION (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Classification Tools (5) ---")
test_tool("classify_assess_domains", {
    "project_id": NPA_ID,
    "assessments": [
        {"domain": "STRATEGIC", "status": "PASS", "score": 85, "findings": ["Aligned with strategy"]},
        {"domain": "RISK", "status": "WARN", "score": 65, "findings": ["Market risk needs review"]},
        {"domain": "LEGAL", "status": "PASS", "score": 90},
        {"domain": "OPS", "status": "PASS", "score": 80},
        {"domain": "TECH", "status": "PASS", "score": 75},
        {"domain": "DATA", "status": "PASS", "score": 88},
        {"domain": "CLIENT", "status": "PASS", "score": 92},
    ],
})
test_tool("classify_score_npa", {
    "project_id": NPA_ID, "total_score": 12, "calculated_tier": "FULL",
    "breakdown": {"new_market": 5, "regulatory_complexity": 4, "tech_change": 3},
})
test_tool("classify_determine_track", {
    "project_id": NPA_ID, "approval_track": "FULL_NPA",
    "reasoning": "Score 12/20 with high regulatory complexity requires full NPA review",
})
test_tool("classify_get_criteria", {})
test_tool("classify_get_assessment", {"project_id": NPA_ID})
print()

# ═══════════════════════════════════════════════════════════════════
#  4. AUTOFILL (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- AutoFill Tools (5) ---")
test_tool("autofill_get_template_fields", {"template_id": "FULL_NPA_V1"})
test_tool("autofill_populate_field", {
    "project_id": NPA_ID, "field_key": "product_name",
    "value": "Python Test Derivative", "lineage": "AUTO", "confidence_score": 95,
})
test_tool("autofill_populate_batch", {
    "project_id": NPA_ID,
    "fields": [
        {"field_key": "booking_entity", "value": "Test Entity", "lineage": "AUTO", "confidence_score": 90},
        {"field_key": "booking_system", "value": "Murex", "lineage": "AUTO", "confidence_score": 88},
    ],
})
test_tool("autofill_get_form_data", {"project_id": NPA_ID})
test_tool("autofill_get_field_options", {"field_id": "1"})
print()

# ═══════════════════════════════════════════════════════════════════
#  5. RISK (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Risk Tools (4) ---")
test_tool("risk_run_assessment", {
    "project_id": NPA_ID,
    "risk_domains": [
        {"domain": "CREDIT", "status": "PASS", "score": 80, "findings": ["Low credit exposure"]},
        {"domain": "MARKET", "status": "WARN", "score": 60, "findings": ["IR sensitivity high"]},
        {"domain": "OPERATIONAL", "status": "PASS", "score": 85},
    ],
    "overall_risk_rating": "MEDIUM",
})
test_tool("risk_get_market_factors", {"project_id": NPA_ID})
test_tool("risk_add_market_factor", {
    "project_id": NPA_ID, "risk_factor": "IR_DELTA", "is_applicable": True,
    "sensitivity_report": True, "var_capture": True, "stress_capture": False,
    "notes": "Primary interest rate risk",
})
test_tool("risk_get_external_parties", {"project_id": NPA_ID})
print()

# ═══════════════════════════════════════════════════════════════════
#  6. GOVERNANCE (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Governance Tools (5) ---")
test_tool("governance_create_signoff_matrix", {"project_id": NPA_ID, "signoffs_json": json.dumps(SIGNOFFS_FIXTURE)})
test_tool("governance_get_signoffs", {"project_id": NPA_ID})

signoff_resp = post(f"{TOOLS_URL}/governance_get_signoffs", {"project_id": NPA_ID})
SIGNOFF_ID = extract(signoff_resp, "data", "signoffs", 0, "id")
print(f"  (Using signoff ID: {SIGNOFF_ID})")

test_tool("governance_record_decision", {"signoff_id": SIGNOFF_ID, "decision": "APPROVED", "comments": "Approved via test"})
test_tool("governance_check_loopbacks", {"project_id": NPA_ID})
test_tool("governance_advance_stage", {"project_id": NPA_ID, "new_stage": "CLASSIFICATION", "reason": "Initiation phase complete - tested via Python"})
print()

# ═══════════════════════════════════════════════════════════════════
#  7. AUDIT (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Audit Tools (4) ---")
test_tool("audit_log_action", {
    "project_id": NPA_ID, "actor_name": "Test Script", "actor_role": "AI Agent",
    "action_type": "NPA_CREATED", "action_details": "Created test NPA via Python MCP server",
    "is_agent_action": True, "agent_name": "Test Agent", "confidence_score": 99,
    "reasoning": "Comprehensive testing of all tools", "model_version": "test-v1",
    "source_citations": ["test.pdf"],
})
test_tool("audit_get_trail", {"project_id": NPA_ID, "limit": 10})
test_tool("check_audit_completeness", {"project_id": NPA_ID})
test_tool("generate_audit_report", {"project_id": NPA_ID, "include_agent_reasoning": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  8. NPA DATA (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- NPA Data Tools (4) ---")
test_tool("get_npa_by_id", {"project_id": NPA_ID})
test_tool("list_npas", {"limit": 5})
test_tool("update_npa_project", {"project_id": NPA_ID, "updates": {"description": "Updated via test script", "product_manager": "Test PM"}})
test_tool("update_npa_predictions", {"project_id": NPA_ID, "classification_confidence": 92.5, "classification_method": "AGENT", "predicted_timeline_days": 45})
print()

# ═══════════════════════════════════════════════════════════════════
#  9. WORKFLOW (5 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Workflow Tools (5) ---")
test_tool("get_workflow_state", {"project_id": NPA_ID})
test_tool("advance_workflow_state", {"project_id": NPA_ID, "new_stage": "REVIEW", "reason": "Classification complete"})
test_tool("get_session_history", {"project_id": NPA_ID})
test_tool("log_routing_decision", {
    "session_id": SESSION_ID, "project_id": NPA_ID,
    "source_agent": "classification-agent", "target_agent": "autofill-agent",
    "routing_reason": "Classification complete, proceeding to form fill", "confidence": 92,
})
test_tool("get_user_profile", {"email": "ahmad.razak@mbs.com"})
print()

# ═══════════════════════════════════════════════════════════════════
#  10. MONITORING (6 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Monitoring Tools (6) ---")
test_tool("get_performance_metrics", {"project_id": NPA_ID})
test_tool("check_breach_thresholds", {"project_id": NPA_ID})
test_tool("create_breach_alert", {
    "project_id": NPA_ID, "title": "VaR Utilization Exceeds Warning",
    "severity": "WARNING", "description": "VaR utilization at 82% exceeds 80% warning threshold",
    "threshold_value": "80%", "actual_value": "82%", "sla_hours": 24,
})
test_tool("get_monitoring_thresholds", {"project_id": NPA_ID})
test_tool("get_post_launch_conditions", {"project_id": NPA_ID})

cond_resp = post(f"{TOOLS_URL}/get_post_launch_conditions", {"project_id": NPA_ID})
conditions = extract(cond_resp, "data", "conditions") or []
CONDITION_ID = conditions[0]["id"] if conditions else None
CTX["CONDITION_ID"] = CONDITION_ID
if CONDITION_ID:
    test_tool("update_condition_status", {"condition_id": CONDITION_ID, "status": "COMPLETED"})
else:
    skip_tool("update_condition_status", "no post-launch conditions exist to update")
print()

# ═══════════════════════════════════════════════════════════════════
#  11. DOCUMENTS (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Document Tools (4) ---")
test_tool("upload_document_metadata", {
    "project_id": NPA_ID, "document_name": "Test Term Sheet.pdf",
    "document_type": "TERM_SHEET", "file_size": "2.3 MB", "file_extension": "pdf",
    "uploaded_by": "Test Script", "criticality": "CRITICAL",
})
test_tool("check_document_completeness", {"project_id": NPA_ID})
test_tool("get_document_requirements", {"approval_track": "FULL_NPA"})

doc_resp = post(f"{TOOLS_URL}/upload_document_metadata", {
    "project_id": NPA_ID, "document_name": "Validation Test Doc.pdf", "document_type": "RISK_MEMO",
})
DOC_ID = extract(doc_resp, "data", "document_id")

test_tool("validate_document", {"document_id": DOC_ID, "validation_status": "VALID", "validation_stage": "AUTOMATED", "validated_by": "Test Script"})
print()

# ═══════════════════════════════════════════════════════════════════
#  12. GOVERNANCE EXT (6 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Governance Extension Tools (6) ---")
test_tool("get_signoff_routing_rules", {"approval_track": "FULL_NPA"})
test_tool("check_sla_status", {"project_id": NPA_ID})
test_tool("create_escalation", {
    "project_id": NPA_ID, "escalation_level": 1, "trigger_type": "SLA_BREACH",
    "reason": "Credit Risk signoff SLA breached by 24 hours", "escalated_by": "Test Agent",
})
test_tool("get_escalation_rules", {})
test_tool("save_approval_decision", {
    "project_id": NPA_ID, "approval_type": "CHECKER",
    "decision": "APPROVE", "comments": "All checks passed - approved via test",
})
test_tool("add_comment", {
    "project_id": NPA_ID, "comment_type": "SYSTEM_ALERT",
    "comment_text": "MCP tool suite test-run completed", "author_name": "Test Script",
    "generated_by_ai": True, "ai_agent": "test-agent",
})
print()

# ═══════════════════════════════════════════════════════════════════
#  13. RISK EXT (4 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Risk Extension Tools (4) ---")
test_tool("get_prerequisite_categories", {"include_checks": True})
test_tool("validate_prerequisites", {"project_id": NPA_ID})
test_tool("save_risk_check_result", {
    "project_id": NPA_ID, "check_layer": "PROHIBITED_LIST",
    "result": "PASS", "matched_items": [], "checked_by": "RISK_AGENT",
})
test_tool("get_form_field_value", {"project_id": NPA_ID, "field_key": "product_name"})
print()

# ═══════════════════════════════════════════════════════════════════
#  14. KB SEARCH (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- KB Search Tools (3) ---")
test_tool("search_kb_documents", {"search_term": "NPA", "limit": 5})
kb_sources = post(f"{TOOLS_URL}/list_kb_sources", {})
kb_docs = extract(kb_sources, "data", "sources") or []
KB_DOC_ID = kb_docs[0]["doc_id"] if kb_docs else None
CTX["KB_DOC_ID"] = KB_DOC_ID
if KB_DOC_ID:
    test_tool("get_kb_document_by_id", {"doc_id": KB_DOC_ID})
else:
    skip_tool("get_kb_document_by_id", "no KB docs seeded (kb_documents is empty)")
test_tool("list_kb_sources", {})
print()

# ═══════════════════════════════════════════════════════════════════
#  15. PROSPECTS (2 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Prospect Tools (2) ---")
prospects_resp = test_tool("get_prospects", {"limit": 5})
prospects = extract(prospects_resp, "data", "prospects") or []
PROSPECT_ID = prospects[0]["id"] if prospects else None
if PROSPECT_ID:
    test_tool("convert_prospect_to_npa", {"prospect_id": PROSPECT_ID, "submitted_by": "Test Script", "risk_level": "MEDIUM"})
else:
    skip_tool("convert_prospect_to_npa", "no prospects seeded (npa_prospects is empty)")
print()

# ═══════════════════════════════════════════════════════════════════
#  16. DASHBOARD (1 tool)
# ═══════════════════════════════════════════════════════════════════
print("--- Dashboard Tools (1) ---")
test_tool("get_dashboard_kpis", {"include_live": True})
print()

# ═══════════════════════════════════════════════════════════════════
#  17. NOTIFICATIONS (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Notification Tools (3) ---")
test_tool("get_pending_notifications", {"project_id": NPA_ID, "limit": 10})
test_tool("send_notification", {
    "project_id": NPA_ID, "notification_type": "SYSTEM_ALERT",
    "title": "Test Notification", "message": "MCP tool suite test-run completed", "severity": "INFO",
})
test_tool("mark_notification_read", {"project_id": NPA_ID, "notification_type": "SYSTEM_ALERT"})
print()

# ═══════════════════════════════════════════════════════════════════
#  18. JURISDICTION (3 tools)
# ═══════════════════════════════════════════════════════════════════
print("--- Jurisdiction Tools (3) ---")
test_tool("get_npa_jurisdictions", {"project_id": NPA_ID})
test_tool("get_jurisdiction_rules", {"jurisdiction_code": "SG"})
test_tool("adapt_classification_weights", {"project_id": NPA_ID, "base_score": 10})
print()

# ═══════════════════════════════════════════════════════════════════
#  Catch-all: run any tools not explicitly covered above
# ═══════════════════════════════════════════════════════════════════
all_tool_names = [t.get("name") for t in tools if isinstance(t, dict) and t.get("name")]
remaining = sorted({n for n in all_tool_names if isinstance(n, str)} - set(EXECUTED))
if remaining:
    print(f"--- Catch-all Tools ({len(remaining)}) ---")
    # Special-case tools that require very specific IDs or structured JSON payloads.
    # Keep them out of the generic schema-driven payload builder.
    remaining_set = set(remaining)

    if "bundling_assess" in remaining_set:
        # Ensure assess runs before apply (alphabetical ordering would run apply first).
        child_id = CTX.get("BUNDLING_CHILD_ID") or CTX.get("NPA_ID")
        parent_id = CTX.get("BUNDLING_PARENT_ID") or CTX.get("NPA_ID")
        assess = test_tool("bundling_assess", {"child_id": child_id, "parent_id": parent_id})
        remaining_set.discard("bundling_assess")
        # Only apply if assessment succeeded.
        if assess.get("success") is True and "bundling_apply" in remaining_set:
            test_tool("bundling_apply", {"child_id": child_id, "parent_id": parent_id, "actor_name": "Test Runner"})
            remaining_set.discard("bundling_apply")
    # If apply is still remaining (e.g., assess wasn't part of remaining), skip it.
    if "bundling_apply" in remaining_set:
        skip_tool("bundling_apply", "requires successful bundling_assess first")
        remaining_set.discard("bundling_apply")

    if "evergreen_record_usage" in remaining_set:
        eg_id = CTX.get("EVERGREEN_ID")
        if eg_id:
            test_tool("evergreen_record_usage", {
                "project_id": eg_id,
                "volume": 100000,
                "pnl": 1234.56,
                "counterparty_exposure": 50000,
                "var_utilization": 25,
            })
        else:
            skip_tool("evergreen_record_usage", "could not create EVERGREEN fixture project")
        remaining_set.discard("evergreen_record_usage")

    if "doc_lifecycle_validate" in remaining_set:
        if CTX.get("DOCUMENT_ID"):
            validations = [{
                "document_id": CTX["DOCUMENT_ID"],
                "validation_status": "VALID",
                "validation_stage": "AUTOMATED",
            }]
            test_tool("doc_lifecycle_validate", {"project_id": CTX.get("NPA_ID"), "validations_json": json.dumps(validations)})
        else:
            skip_tool("doc_lifecycle_validate", "no document fixture available")
        remaining_set.discard("doc_lifecycle_validate")

    # Run anything else with schema-driven payloads.
    for name in sorted(remaining_set):
        schema = schema_for_tool(openapi, name)
        payload = build_payload(schema, CTX)
        test_tool(name, payload)
    print()

# ═══════════════════════════════════════════════════════════════════
#  Results
# ═══════════════════════════════════════════════════════════════════
print("============================================")
print(f"  Results: {PASS} passed, {FAIL} failed, {TOTAL} total")
print("============================================")

sys.exit(1 if FAIL > 0 else 0)
