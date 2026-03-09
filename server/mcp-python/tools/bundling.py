"""
Bundling Framework Tools — 2 tools (GAP-008)
8-condition check from GFM SOP 2024 §3.1 to determine whether a product
variation qualifies for BUNDLING track (reduced SOPs).
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: bundling_assess ─────────────────────────────────────

BUNDLING_ASSESS_SCHEMA = {
    "type": "object",
    "properties": {
        "child_id": {"type": "string", "description": "NPA project ID of the child (new variation)"},
        "parent_id": {"type": "string", "description": "NPA project ID of the approved parent product"},
    },
    "required": ["child_id", "parent_id"],
}


async def bundling_assess_handler(inp: dict) -> ToolResult:
    child_rows = await query("SELECT * FROM npa_projects WHERE id = %s", [inp["child_id"]])
    if not child_rows:
        return ToolResult(success=False, error="Child project not found")
    child = child_rows[0]

    parent_rows = await query("SELECT * FROM npa_projects WHERE id = %s", [inp["parent_id"]])
    if not parent_rows:
        return ToolResult(success=False, error="Parent project not found")
    parent = parent_rows[0]

    conditions = []
    all_passed = True

    # C1: Existing approved parent
    c1 = parent.get("current_stage") == "LAUNCHED"
    conditions.append({"id": 1, "name": "Existing Approved Parent Product", "passed": c1,
                       "detail": f"Parent: {parent['title']}" if c1 else "No approved parent product found"})
    if not c1:
        all_passed = False

    # C2: Same product category
    c2 = child.get("product_category") == parent.get("product_category")
    conditions.append({"id": 2, "name": "Same Product Category", "passed": c2,
                       "detail": f"Category: {child.get('product_category')}" if c2 else
                       f"Mismatch: {child.get('product_category')} vs {parent.get('product_category')}"})
    if not c2:
        all_passed = False

    # C3: No new risk type
    child_risks = await query("SELECT DISTINCT check_layer FROM npa_risk_checks WHERE project_id = %s", [child["id"]])
    parent_risks = await query("SELECT DISTINCT check_layer FROM npa_risk_checks WHERE project_id = %s", [parent["id"]])
    parent_layers = {r["check_layer"] for r in parent_risks}
    new_risks = [r for r in child_risks if r["check_layer"] not in parent_layers]
    c3 = len(new_risks) == 0
    conditions.append({"id": 3, "name": "No New Risk Type", "passed": c3,
                       "detail": "No new risk layers" if c3 else
                       f"New risk layers: {', '.join(r['check_layer'] for r in new_risks)}"})
    if not c3:
        all_passed = False

    # C4: Within approved notional limits (120% buffer)
    parent_notional = float(parent.get("notional_amount") or 0)
    child_notional = float(child.get("notional_amount") or 0)
    c4 = parent_notional > 0 and child_notional <= parent_notional * 1.2
    conditions.append({"id": 4, "name": "Within Notional Limits", "passed": c4,
                       "detail": f"{child_notional} <= {parent_notional * 1.2} (120%)" if c4 else
                       f"Exceeds: {child_notional} > {parent_notional * 1.2}"})
    if not c4:
        all_passed = False

    # C5: Same booking entity (proxy: same currency)
    c5 = child.get("currency") == parent.get("currency")
    conditions.append({"id": 5, "name": "Same Booking Entity", "passed": c5,
                       "detail": f"Currency: {child.get('currency')}" if c5 else "Booking entity mismatch"})
    if not c5:
        all_passed = False

    # C6: Same jurisdiction set
    child_j = await query("SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = %s", [child["id"]])
    parent_j = await query("SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = %s", [parent["id"]])
    parent_jset = {j["jurisdiction_code"] for j in parent_j}
    new_j = [j["jurisdiction_code"] for j in child_j if j["jurisdiction_code"] not in parent_jset]
    c6 = len(new_j) == 0
    conditions.append({"id": 6, "name": "Same Jurisdiction Set", "passed": c6,
                       "detail": "No new jurisdictions" if c6 else f"New: {', '.join(new_j)}"})
    if not c6:
        all_passed = False

    # C7: No new counterparty type
    child_cp = await query(
        "SELECT field_value FROM npa_form_data WHERE project_id = %s AND field_key = 'counterparty_type'",
        [child["id"]])
    parent_cp = await query(
        "SELECT field_value FROM npa_form_data WHERE project_id = %s AND field_key = 'counterparty_type'",
        [parent["id"]])
    c7 = (not child_cp) or (parent_cp and child_cp[0].get("field_value") == parent_cp[0].get("field_value"))
    conditions.append({"id": 7, "name": "No New Counterparty Type", "passed": bool(c7),
                       "detail": "Same counterparty type" if c7 else "New counterparty type detected"})
    if not c7:
        all_passed = False

    # C8: Within operational capacity (ops signoff on parent)
    ops_signoff = await query(
        "SELECT status FROM npa_signoffs WHERE project_id = %s AND party = 'Operations' AND status = 'APPROVED'",
        [parent["id"]])
    c8 = len(ops_signoff) > 0
    conditions.append({"id": 8, "name": "Within Operational Capacity", "passed": c8,
                       "detail": "Ops capacity confirmed via parent" if c8 else "No ops capacity confirmation"})
    if not c8:
        all_passed = False

    pass_count = sum(1 for c in conditions if c["passed"])
    if all_passed:
        recommended = "BUNDLING"
    elif pass_count >= 6:
        recommended = "NPA_LITE"
    else:
        recommended = "FULL_NPA"

    return ToolResult(success=True, data={
        "child_id": inp["child_id"],
        "parent_id": inp["parent_id"],
        "parent_title": parent.get("title"),
        "conditions": conditions,
        "all_passed": all_passed,
        "pass_count": pass_count,
        "recommended_track": recommended,
    })


# ─── Tool 2: bundling_apply ─────────────────────────────────────

BUNDLING_APPLY_SCHEMA = {
    "type": "object",
    "properties": {
        "child_id": {"type": "string", "description": "NPA project ID to set as BUNDLING"},
        "parent_id": {"type": "string", "description": "Parent product NPA ID"},
        "actor_name": {"type": "string", "description": "Who applied the bundling track"},
    },
    "required": ["child_id", "parent_id"],
}


async def bundling_apply_handler(inp: dict) -> ToolResult:
    await execute(
        "UPDATE npa_projects SET approval_track = 'BUNDLING', updated_at = NOW() WHERE id = %s",
        [inp["child_id"]],
    )
    await execute(
        """INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
           VALUES (%s, %s, 'BUNDLING_APPLIED', %s, 0)""",
        [inp["child_id"], inp.get("actor_name", "SYSTEM"),
         json.dumps({"parent_id": inp["parent_id"]})],
    )
    return ToolResult(success=True, data={
        "child_id": inp["child_id"],
        "parent_id": inp["parent_id"],
        "status": "BUNDLING_APPLIED",
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="bundling_assess", description="Run the 8-condition bundling assessment comparing a child NPA against its parent product. Determines if BUNDLING track is eligible.", category="bundling", input_schema=BUNDLING_ASSESS_SCHEMA, handler=bundling_assess_handler),
    ToolDefinition(name="bundling_apply", description="Apply the BUNDLING approval track to an NPA after passing the 8-condition check.", category="bundling", input_schema=BUNDLING_APPLY_SCHEMA, handler=bundling_apply_handler),
])
