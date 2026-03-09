"""
Ideation Tools — 5 tools
Powers the Ideation Agent: create NPAs, find similar products, check prohibited list.
Mirrors server/mcp/src/tools/ideation.ts exactly.
"""
import json
import uuid
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: ideation_create_npa ──────────────────────────────────

CREATE_NPA_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "Product/NPA title"},
        "description": {"type": "string", "description": "Product description"},
        "npa_type": {"type": "string", "description": "NPA classification type. Must be one of: New-to-Group, Variation, Existing"},
        "product_category": {"type": "string", "description": "Product category (e.g., Fixed Income, FX, Crypto)"},
        "risk_level": {"type": "string", "description": "Initial risk assessment level. Must be one of: LOW, MEDIUM, HIGH"},
        "is_cross_border": {"type": "string", "description": "Whether this involves cross-border jurisdictions. Use 'true' or 'false'. Defaults to false"},
        "notional_amount": {"type": "number", "description": "Estimated notional amount in USD"},
        "currency": {"type": "string", "description": "Currency code. Defaults to USD"},
        "submitted_by": {"type": "string", "description": "Name of the submitter. Defaults to AI-Agent"},
        "product_manager": {"type": "string", "description": "Assigned product manager"},
        "pm_team": {"type": "string", "description": "Product manager team"},
        "initial_stage": {"type": "string", "description": "Initial workflow stage for early creation. Defaults to IDEATION (Prospect NPA)."},
        "initial_status": {"type": "string", "description": "Initial project status label. Defaults to On Track."},
    },
    "required": ["title", "npa_type", "risk_level"],
}


async def ideation_create_npa_handler(inp: dict) -> ToolResult:
    npa_id = f"NPA-{uuid.uuid4().hex}"
    # Prospect-first: create the record early during ideation so the agent can
    # progressively persist concept fields before the formal NPA stages.
    initial_stage = inp.get("initial_stage") or "IDEATION"
    initial_status = inp.get("initial_status") or "On Track"
    await execute(
        """INSERT INTO npa_projects (id, title, description, npa_type, product_category, risk_level,
                                     is_cross_border, notional_amount, currency, submitted_by,
                                     product_manager, pm_team, current_stage, status, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())""",
        [
            npa_id, inp["title"], inp.get("description"), inp["npa_type"],
            inp.get("product_category"), inp["risk_level"],
            1 if str(inp.get("is_cross_border", "false")).lower() in ("true", "1", "yes") else 0,
            inp.get("notional_amount"),
            inp.get("currency") or "USD", inp.get("submitted_by") or "AI-Agent",
            inp.get("product_manager"), inp.get("pm_team"),
            initial_stage, initial_status,
        ],
    )
    return ToolResult(success=True, data={
        "npa_id": npa_id,
        "title": inp["title"],
        "npa_type": inp["npa_type"],
        "risk_level": inp["risk_level"],
        "current_stage": initial_stage,
        "status": initial_status,
        "message": f'NPA "{inp["title"]}" created successfully with ID {npa_id}',
    })


# ─── Tool 2: ideation_find_similar ────────────────────────────────

FIND_SIMILAR_SCHEMA = {
    "type": "object",
    "properties": {
        "search_term": {"type": "string", "description": "Product name or description to search for"},
        "npa_type": {"type": "string", "description": "Filter by NPA type"},
        "product_category": {"type": "string", "description": "Filter by product category"},
        "limit": {"type": "integer", "description": "Max results to return. Defaults to 10"},
    },
    "required": ["search_term"],
}


async def ideation_find_similar_handler(inp: dict) -> ToolResult:
    sql = """SELECT id, title, description, npa_type, product_category, risk_level,
                    current_stage, status, notional_amount, approval_track, created_at
             FROM npa_projects WHERE (title LIKE %s OR description LIKE %s)"""
    term = f"%{inp['search_term']}%"
    params: list = [term, term]

    if inp.get("npa_type"):
        sql += " AND npa_type = %s"
        params.append(inp["npa_type"])
    if inp.get("product_category"):
        sql += " AND product_category = %s"
        params.append(inp["product_category"])
    sql += " ORDER BY created_at DESC LIMIT %s"
    params.append(inp.get("limit", 10))

    results = await query(sql, params)
    return ToolResult(success=True, data={
        "matches": results,
        "count": len(results),
        "search_term": inp["search_term"],
    })


# ─── Tool 3: ideation_get_prohibited_list ─────────────────────────

PROHIBITED_LIST_SCHEMA = {
    "type": "object",
    "properties": {
        "product_description": {"type": "string", "description": "Product description to check against prohibited list"},
        "layer": {"type": "string", "description": "Filter by layer (INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC)"},
        "severity": {"type": "string", "description": "Filter by severity level"},
    },
    "required": [],
}


async def ideation_get_prohibited_list_handler(inp: dict) -> ToolResult:
    sql = """SELECT id, layer, item_code, item_name, description, jurisdictions, severity,
                    effective_from, effective_to, last_synced
             FROM ref_prohibited_items WHERE 1=1"""
    params: list = []

    if inp.get("layer"):
        sql += " AND layer = %s"
        params.append(inp["layer"])
    if inp.get("severity"):
        sql += " AND severity = %s"
        params.append(inp["severity"])

    # Only return currently effective items
    sql += " AND (effective_to IS NULL OR effective_to > NOW())"
    sql += " ORDER BY layer, severity DESC, item_name"
    items = await query(sql, params)

    # Group by layer
    by_layer = {}
    for item in items:
        layer = item.get("layer", "UNKNOWN")
        by_layer.setdefault(layer, []).append(item)

    return ToolResult(success=True, data={
        "prohibited_items": items,
        "by_layer": by_layer,
        "total_items": len(items),
        "layers": list(by_layer.keys()),
    })


# ─── Tool 4: ideation_save_concept ────────────────────────────────

SAVE_CONCEPT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "concept_notes": {"type": "string", "description": "Freeform concept/ideation notes"},
        "product_rationale": {"type": "string", "description": "Business rationale for the product"},
        "target_market": {"type": "string", "description": "Target market description"},
        "estimated_revenue": {"type": "number", "description": "Estimated annual revenue"},
    },
    "required": ["project_id", "concept_notes"],
}


async def ideation_save_concept_handler(inp: dict) -> ToolResult:
    fields = [
        ("concept_notes", inp.get("concept_notes")),
        ("product_rationale", inp.get("product_rationale")),
        ("target_market", inp.get("target_market")),
        ("estimated_revenue", str(inp["estimated_revenue"]) if inp.get("estimated_revenue") is not None else None),
    ]
    fields = [(k, v) for k, v in fields if v is not None]

    # Check that the field_key exists in ref_npa_fields before inserting into npa_form_data (FK constraint)
    for key, value in fields:
        existing_field = await query(
            "SELECT field_key FROM ref_npa_fields WHERE field_key = %s",
            [key],
        )
        if existing_field:
            await execute(
                """INSERT INTO npa_form_data (project_id, field_key, field_value, lineage, confidence_score)
                   VALUES (%s, %s, %s, 'AUTO', 85.00)
                   ON DUPLICATE KEY UPDATE field_value = VALUES(field_value), lineage = 'AUTO', confidence_score = 85.00""",
                [inp["project_id"], key, value],
            )
        else:
            # Field not in reference table — store as description update on the project instead
            if key == "concept_notes":
                await execute(
                    "UPDATE npa_projects SET description = CONCAT(COALESCE(description, ''), %s) WHERE id = %s",
                    [f"\n[Concept Notes]: {value}", inp["project_id"]],
                )

    if inp.get("estimated_revenue") is not None:
        await execute(
            "UPDATE npa_projects SET estimated_revenue = %s WHERE id = %s",
            [inp["estimated_revenue"], inp["project_id"]],
        )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "fields_saved": len(fields),
        "field_keys": [k for k, _ in fields],
    })


# ─── Tool 5: ideation_list_templates ──────────────────────────────

LIST_TEMPLATES_SCHEMA = {
    "type": "object",
    "properties": {
        "active_only": {"type": "string", "description": "Only return active templates. Use 'true' or 'false'. Defaults to true"},
    },
    "required": [],
}


async def ideation_list_templates_handler(inp: dict) -> ToolResult:
    sql = """SELECT t.id, t.name, t.version, t.is_active,
                    COUNT(DISTINCT s.id) as section_count,
                    COUNT(DISTINCT f.id) as field_count
             FROM ref_npa_templates t
             LEFT JOIN ref_npa_sections s ON s.template_id = t.id
             LEFT JOIN ref_npa_fields f ON f.section_id = s.id"""

    active_only = str(inp.get("active_only", "true")).lower() not in ("false", "0", "no")
    if active_only:
        sql += " WHERE t.is_active = 1"

    sql += " GROUP BY t.id, t.name, t.version, t.is_active ORDER BY t.name"
    templates = await query(sql)

    return ToolResult(success=True, data={
        "templates": templates,
        "count": len(templates),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="ideation_create_npa", description="Create a new NPA project record in the database. Returns the new NPA ID for subsequent operations.", category="ideation", input_schema=CREATE_NPA_SCHEMA, handler=ideation_create_npa_handler),
    ToolDefinition(name="ideation_find_similar", description="Search for similar historical NPAs by product name, description, or category. Returns matching NPAs with their outcomes.", category="ideation", input_schema=FIND_SIMILAR_SCHEMA, handler=ideation_find_similar_handler),
    ToolDefinition(name="ideation_get_prohibited_list", description="Retrieve the prohibited products/activities list from classification criteria. Use this to check if a proposed product falls under prohibited categories.", category="ideation", input_schema=PROHIBITED_LIST_SCHEMA, handler=ideation_get_prohibited_list_handler),
    ToolDefinition(name="ideation_save_concept", description="Save initial product concept notes and rationale as form data for an NPA project.", category="ideation", input_schema=SAVE_CONCEPT_SCHEMA, handler=ideation_save_concept_handler),
    ToolDefinition(name="ideation_list_templates", description="List all available NPA templates with their sections and field counts.", category="ideation", input_schema=LIST_TEMPLATES_SCHEMA, handler=ideation_list_templates_handler),
])
