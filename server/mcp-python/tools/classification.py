"""
Classification Tools — 5 tools
Powers the Classification Agent: domain assessments, scorecards, track determination.
Mirrors server/mcp/src/tools/classification.ts exactly.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: classify_assess_domains ──────────────────────────────

ASSESS_DOMAINS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID to assess"},
        "assessments_json": {
            "type": "string",
            "description": "JSON string array of domain assessments. Each object requires: domain (one of STRATEGIC, RISK, LEGAL, OPS, TECH, DATA, CLIENT), status (one of PASS, FAIL, WARN), score (number 0-100). Optional: findings (comma-separated string of gaps). Example: [{\"domain\":\"STRATEGIC\",\"status\":\"PASS\",\"score\":85,\"findings\":\"No gaps found\"}]",
        },
    },
    "required": ["project_id", "assessments_json"],
}


async def classify_assess_domains_handler(inp: dict) -> ToolResult:
    VALID_STATUSES = {"PASS", "FAIL", "WARN"}

    # Accept assessments as JSON string or direct array
    assessments_raw = inp.get("assessments_json") or inp.get("assessments", [])
    if isinstance(assessments_raw, str):
        assessments_raw = json.loads(assessments_raw)
    # Normalize findings from string to list if needed
    for a in assessments_raw:
        if isinstance(a.get("findings"), str):
            a["findings"] = [f.strip() for f in a["findings"].split(",") if f.strip()]

    results = []
    for a in assessments_raw:
        # Validate status matches DB CHECK constraint: ('PASS','FAIL','WARN')
        status = a.get("status", "PASS").upper()
        if status not in VALID_STATUSES:
            # Map common alternatives to valid values
            status_map = {"APPLICABLE": "PASS", "NOT_APPLICABLE": "PASS", "N/A": "PASS",
                          "WARNING": "WARN", "ERROR": "FAIL", "CRITICAL": "FAIL",
                          "READY": "PASS", "NOT_READY": "FAIL", "NEEDS_WORK": "WARN"}
            status = status_map.get(status, "WARN")

        # Ensure score is within valid range (0-100)
        score = min(100, max(0, int(a.get("score", 0))))

        # Write to npa_intake_assessments (domain-level intake)
        row_id = await execute(
            """INSERT INTO npa_intake_assessments (project_id, domain, status, score, findings, assessed_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            [inp["project_id"], a["domain"], status, score,
             json.dumps(a["findings"]) if a.get("findings") else None],
        )
        # Also write per-criteria scores to npa_classification_assessments (architecture spec)
        # Map domain to a criteria from ref_classification_criteria
        domain_criteria = await query(
            "SELECT id FROM ref_classification_criteria WHERE category = %s AND is_active = 1 LIMIT 1",
            [a["domain"]],
        )
        if domain_criteria:
            await execute(
                """INSERT INTO npa_classification_assessments (project_id, criteria_id, score, evidence, assessed_by, confidence, assessed_at)
                   VALUES (%s, %s, %s, %s, %s, %s, NOW())""",
                [inp["project_id"], domain_criteria[0]["id"], score,
                 json.dumps({"domain": a["domain"], "findings": a.get("findings", [])}),
                 "CLASSIFICATION_AGENT", score],
            )
        results.append({"id": row_id, "domain": a["domain"], "status": status, "score": score})

    avg_score = sum(a["score"] for a in assessments_raw) / len(assessments_raw)
    fail_count = sum(1 for a in assessments_raw if a["status"] == "FAIL")
    overall = "NOT_READY" if fail_count > 0 else ("READY" if avg_score >= 70 else "NEEDS_WORK")

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "assessments": results,
        "summary": {
            "average_score": round(avg_score),
            "overall_status": overall,
            "domains_assessed": len(results),
            "fail_count": fail_count,
            "warn_count": sum(1 for a in assessments_raw if a["status"] == "WARN"),
            "pass_count": sum(1 for a in assessments_raw if a["status"] == "PASS"),
        },
    })


# ─── Tool 2: classify_score_npa ───────────────────────────────────

SCORE_NPA_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "total_score": {"type": "number", "description": "Total complexity score 0-20"},
        "calculated_tier": {"type": "string", "description": "Determined classification tier. Must be one of: NPA_LITE, VARIATION, FULL"},
        "breakdown": {"type": "string", "description": "JSON string of scoring factor breakdown. Example: {\"new_market\":5,\"regulatory_complexity\":3}"},
        "override_reason": {"type": "string", "description": "Reason if human overrides AI classification"},
    },
    "required": ["project_id", "total_score", "calculated_tier", "breakdown"],
}


async def classify_score_npa_handler(inp: dict) -> ToolResult:
    # Accept breakdown as string or dict
    breakdown = inp["breakdown"]
    if isinstance(breakdown, str):
        breakdown = json.loads(breakdown)

    scorecard_id = await execute(
        """INSERT INTO npa_classification_scorecards (project_id, total_score, calculated_tier, breakdown, override_reason, created_at)
           VALUES (%s, %s, %s, %s, %s, NOW())""",
        [inp["project_id"], inp["total_score"], inp["calculated_tier"],
         json.dumps(breakdown), inp.get("override_reason")],
    )

    confidence = None if inp.get("override_reason") else 92.5
    method = "OVERRIDE" if inp.get("override_reason") else "AGENT"
    await execute(
        "UPDATE npa_projects SET classification_confidence = %s, classification_method = %s WHERE id = %s",
        [confidence, method, inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "scorecard_id": scorecard_id,
        "project_id": inp["project_id"],
        "total_score": inp["total_score"],
        "calculated_tier": inp["calculated_tier"],
        "breakdown": breakdown,
        "classification_method": method,
    })


# ─── Tool 3: classify_determine_track ─────────────────────────────

DETERMINE_TRACK_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "approval_track": {"type": "string", "description": "Determined approval track. Must be one of: FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN, PROHIBITED"},
        "approval_track_subtype": {"type": "string", "description": "NPA Lite sub-type. Must be one of: B1, B2, B3, B4. Only applicable when track is NPA_LITE"},
        "reasoning": {"type": "string", "description": "Explanation for the track determination"},
    },
    "required": ["project_id", "approval_track", "reasoning"],
}


async def classify_determine_track_handler(inp: dict) -> ToolResult:
    track = inp["approval_track"]
    ntg_override = False

    # GAP-003 belt-and-suspenders: NTG products MUST go through FULL_NPA per Standard §2.1.1
    project = await query("SELECT npa_type FROM npa_projects WHERE id = %s", [inp["project_id"]])
    if project and project[0].get("npa_type") == "New-to-Group" and track != "FULL_NPA":
        track = "FULL_NPA"
        ntg_override = True

    # GAP-014: Persist sub-type for NPA Lite (B1-B4)
    subtype = inp.get("approval_track_subtype")
    if track == "NPA_LITE" and subtype in ("B1", "B2", "B3", "B4"):
        try:
            await execute(
                "UPDATE npa_projects SET approval_track = %s, approval_track_subtype = %s WHERE id = %s",
                [track, subtype, inp["project_id"]],
            )
        except Exception:
            # Graceful fallback if column not yet migrated
            await execute(
                "UPDATE npa_projects SET approval_track = %s WHERE id = %s",
                [track, inp["project_id"]],
            )
    else:
        await execute(
            "UPDATE npa_projects SET approval_track = %s WHERE id = %s",
            [track, inp["project_id"]],
        )

    if track == "PROHIBITED":
        await execute(
            "UPDATE npa_projects SET status = 'STOPPED', current_stage = 'PROHIBITED' WHERE id = %s",
            [inp["project_id"]],
        )

    if ntg_override:
        await execute(
            """INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action, agent_name)
               VALUES (%s, 'SYSTEM', 'NTG_TRACK_OVERRIDE', %s, 1, 'CLASSIFICATION_AGENT')""",
            [inp["project_id"],
             json.dumps({"original_track": inp["approval_track"], "forced_track": "FULL_NPA",
                          "reason": "Standard §2.1.1: New-to-Group products require FULL_NPA"})],
        )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "approval_track": track,
        "approval_track_subtype": subtype if track == "NPA_LITE" else None,
        "original_track": inp["approval_track"] if ntg_override else None,
        "ntg_override_applied": ntg_override,
        "reasoning": inp["reasoning"],
        "is_prohibited": track == "PROHIBITED",
    })


# ─── Tool 4: classify_get_criteria ────────────────────────────────

GET_CRITERIA_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "description": "Filter by criteria category (PRODUCT_INNOVATION, MARKET_CUSTOMER, etc.)"},
        "indicator_type": {"type": "string", "description": "Filter by indicator type (NTG, VARIATION, EXISTING)"},
    },
    "required": [],
}


async def classify_get_criteria_handler(inp: dict) -> ToolResult:
    sql = "SELECT * FROM ref_classification_criteria WHERE is_active = 1"
    params: list = []

    if inp.get("category"):
        sql += " AND category = %s"
        params.append(inp["category"])
    if inp.get("indicator_type"):
        sql += " AND indicator_type = %s"
        params.append(inp["indicator_type"])
    sql += " ORDER BY category, weight DESC"

    criteria = await query(sql, params)
    return ToolResult(success=True, data={"criteria": criteria, "count": len(criteria)})


# ─── Tool 5: classify_get_assessment ──────────────────────────────

GET_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def classify_get_assessment_handler(inp: dict) -> ToolResult:
    assessments = await query(
        "SELECT * FROM npa_intake_assessments WHERE project_id = %s ORDER BY domain",
        [inp["project_id"]],
    )
    scorecards = await query(
        "SELECT * FROM npa_classification_scorecards WHERE project_id = %s ORDER BY created_at DESC LIMIT 1",
        [inp["project_id"]],
    )
    detailed = await query(
        """SELECT ca.*, rc.category, rc.criterion_name, rc.indicator_type, rc.weight
           FROM npa_classification_assessments ca
           JOIN ref_classification_criteria rc ON ca.criteria_id = rc.id
           WHERE ca.project_id = %s
           ORDER BY rc.category, rc.weight DESC""",
        [inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "intake_assessments": assessments,
        "scorecard": scorecards[0] if scorecards else None,
        "detailed_criteria_assessments": detailed,
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="classify_assess_domains", description="Run a 7-domain intake assessment for an NPA. Evaluates Strategic, Risk, Legal, Ops, Tech, Data, and Client readiness.", category="classification", input_schema=ASSESS_DOMAINS_SCHEMA, handler=classify_assess_domains_handler),
    ToolDefinition(name="classify_score_npa", description="Generate a classification scorecard for an NPA. Scores 0-20 determine tier (NPA Lite, Variation, Full NPA).", category="classification", input_schema=SCORE_NPA_SCHEMA, handler=classify_score_npa_handler),
    ToolDefinition(name="classify_determine_track", description="Set the approval track for an NPA based on classification results. Updates the project record.", category="classification", input_schema=DETERMINE_TRACK_SCHEMA, handler=classify_determine_track_handler),
    ToolDefinition(name="classify_get_criteria", description="Get classification criteria reference data. Used to evaluate NPA complexity and determine the right tier.", category="classification", input_schema=GET_CRITERIA_SCHEMA, handler=classify_get_criteria_handler),
    ToolDefinition(name="classify_get_assessment", description="Retrieve existing intake assessments and classification scorecard for an NPA.", category="classification", input_schema=GET_ASSESSMENT_SCHEMA, handler=classify_get_assessment_handler),
])
