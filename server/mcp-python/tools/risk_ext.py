"""
Risk Extension Tools — 4 tools
Additional risk capabilities: prerequisites, risk checks, form field lookups.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_prerequisite_categories ──────────────────────────

GET_PREREQUISITE_CATEGORIES_SCHEMA = {
    "type": "object",
    "properties": {
        "include_checks": {"type": "string", "description": "Include individual checks within each category. Use 'true' or 'false'. Defaults to true"},
    },
}


async def get_prerequisite_categories_handler(inp: dict) -> ToolResult:
    categories = await query(
        """SELECT id, category_code, category_name, weight, description, order_index
           FROM ref_prerequisite_categories
           ORDER BY order_index""",
    )

    if str(inp.get("include_checks", "true")).lower() not in ("false", "0", "no"):
        for cat in categories:
            checks = await query(
                """SELECT id, check_code, check_name, description, mandatory_for, is_critical, order_index
                   FROM ref_prerequisite_checks
                   WHERE category_id = %s
                   ORDER BY order_index""",
                [cat["id"]],
            )
            cat["checks"] = checks
            cat["check_count"] = len(checks)

    return ToolResult(success=True, data={
        "categories": categories,
        "total_categories": len(categories),
    })


# ─── Tool 2: validate_prerequisites ──────────────────────────────

VALIDATE_PREREQUISITES_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "approval_track": {"type": "string", "description": "Approval track to validate against (FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN)"},
    },
    "required": ["project_id"],
}


async def validate_prerequisites_handler(inp: dict) -> ToolResult:
    # Get project's approval track if not provided
    if not inp.get("approval_track"):
        proj = await query("SELECT approval_track FROM npa_projects WHERE id = %s", [inp["project_id"]])
        approval_track = proj[0]["approval_track"] if proj else "FULL_NPA"
    else:
        approval_track = inp["approval_track"]

    # Get all applicable checks
    checks = await query(
        """SELECT c.id, c.check_code, c.check_name, c.mandatory_for, c.is_critical,
                  cat.category_name, cat.weight
           FROM ref_prerequisite_checks c
           JOIN ref_prerequisite_categories cat ON cat.id = c.category_id
           WHERE c.mandatory_for IN ('ALL', %s)
           ORDER BY cat.order_index, c.order_index""",
        [approval_track],
    )

    # Get results for this project
    results = await query(
        """SELECT check_id, status, evidence, validated_by, validated_at
           FROM npa_prerequisite_results
           WHERE project_id = %s""",
        [inp["project_id"]],
    )
    result_map = {r["check_id"]: r for r in results}

    items = []
    passed = 0
    failed = 0
    pending = 0
    critical_fails = []

    for check in checks:
        result = result_map.get(check["id"])
        status = result["status"] if result else "PENDING"
        item = {
            "check_id": check["id"],
            "check_code": check["check_code"],
            "check_name": check["check_name"],
            "category": check["category_name"],
            "is_critical": bool(check["is_critical"]),
            "status": status,
            "evidence": result.get("evidence") if result else None,
            "validated_by": result.get("validated_by") if result else None,
        }
        items.append(item)

        if status == "PASS" or status == "WAIVED":
            passed += 1
        elif status == "FAIL":
            failed += 1
            if check["is_critical"]:
                critical_fails.append(check["check_name"])
        else:
            pending += 1

    total = len(items)
    readiness_score = round((passed / total) * 100) if total else 0
    is_ready = failed == 0 and pending == 0

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "approval_track": approval_track,
        "items": items,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "pending": pending,
            "critical_fails": critical_fails,
            "readiness_score": readiness_score,
            "is_ready": is_ready,
        },
    })


# ─── Tool 3: save_risk_check_result ──────────────────────────────

SAVE_RISK_CHECK_RESULT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "check_layer": {"type": "string", "description": "Risk check layer (e.g. PROHIBITED_LIST, SANCTIONS, AML, REPUTATIONAL)"},
        "result": {"type": "string", "description": "Check result. Must be one of: PASS, FAIL, WARNING"},
        "matched_items": {"type": "string", "description": "Comma-separated list of matched items (if any)"},
        "checked_by": {"type": "string", "description": "Who performed the check. Defaults to RISK_AGENT"},
    },
    "required": ["project_id", "check_layer", "result"],
}


async def save_risk_check_result_handler(inp: dict) -> ToolResult:
    matched_raw = inp.get("matched_items")
    if isinstance(matched_raw, str) and matched_raw:
        matched_json = json.dumps([m.strip() for m in matched_raw.split(",") if m.strip()])
    elif isinstance(matched_raw, list):
        matched_json = json.dumps(matched_raw) if matched_raw else None
    else:
        matched_json = None

    row_id = await execute(
        """INSERT INTO npa_risk_checks
               (project_id, check_layer, result, matched_items, checked_by, checked_at)
           VALUES (%s, %s, %s, %s, %s, NOW())""",
        [inp["project_id"], inp["check_layer"], inp["result"],
         matched_json, inp.get("checked_by", "RISK_AGENT")],
    )

    return ToolResult(success=True, data={
        "id": row_id,
        "project_id": inp["project_id"],
        "check_layer": inp["check_layer"],
        "result": inp["result"],
        "matched_count": len(inp.get("matched_items", [])),
    })


# ─── Tool 4: get_form_field_value ─────────────────────────────────

GET_FORM_FIELD_VALUE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "field_key": {"type": "string", "description": "Field key to look up (e.g. product_name, booking_entity)"},
    },
    "required": ["project_id", "field_key"],
}


async def get_form_field_value_handler(inp: dict) -> ToolResult:
    rows = await query(
        """SELECT fd.field_value, fd.lineage, fd.confidence_score, fd.metadata,
                  rf.label, rf.field_type, rf.tooltip
           FROM npa_form_data fd
           JOIN ref_npa_fields rf ON rf.field_key = fd.field_key
           WHERE fd.project_id = %s AND fd.field_key = %s""",
        [inp["project_id"], inp["field_key"]],
    )

    if not rows:
        return ToolResult(success=False, error=f"No value found for field '{inp['field_key']}' in project '{inp['project_id']}'")

    row = rows[0]
    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "field_key": inp["field_key"],
        "label": row["label"],
        "field_type": row["field_type"],
        "value": row["field_value"],
        "lineage": row["lineage"],
        "confidence_score": row.get("confidence_score"),
        "metadata": row.get("metadata"),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_prerequisite_categories", description="Get all prerequisite categories and their individual checks for NPA readiness validation.", category="risk", input_schema=GET_PREREQUISITE_CATEGORIES_SCHEMA, handler=get_prerequisite_categories_handler),
    ToolDefinition(name="validate_prerequisites", description="Validate all prerequisites for an NPA project and compute a readiness score.", category="risk", input_schema=VALIDATE_PREREQUISITES_SCHEMA, handler=validate_prerequisites_handler),
    ToolDefinition(name="save_risk_check_result", description="Save the result of a risk check layer (prohibited list, sanctions, AML, reputational).", category="risk", input_schema=SAVE_RISK_CHECK_RESULT_SCHEMA, handler=save_risk_check_result_handler),
    ToolDefinition(name="get_form_field_value", description="Look up a specific form field value for an NPA project with its lineage and confidence score.", category="risk", input_schema=GET_FORM_FIELD_VALUE_SCHEMA, handler=get_form_field_value_handler),
])
