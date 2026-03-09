"""
Prospect Tools — 2 tools
Product opportunity pipeline: list prospects, convert to formal NPA.
Used by the Ideation Agent.
"""
import uuid

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_prospects ────────────────────────────────────────

GET_PROSPECTS_SCHEMA = {
    "type": "object",
    "properties": {
        "status": {"type": "string", "description": "Filter by status (Pre-Seed, Seed, Qualified, Converted)"},
        "theme": {"type": "string", "description": "Filter by theme/category"},
        "limit": {"type": "integer", "description": "Max results. Defaults to 20"},
    },
}


async def get_prospects_handler(inp: dict) -> ToolResult:
    conditions = []
    params = []

    if inp.get("status"):
        conditions.append("status = %s")
        params.append(inp["status"])
    if inp.get("theme"):
        conditions.append("theme LIKE %s")
        params.append(f"%{inp['theme']}%")

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    limit = inp.get("limit", 20)
    params.append(limit)

    prospects = await query(
        f"""SELECT id, name, theme, probability, estimated_value, value_currency, status, created_at
            FROM npa_prospects{where}
            ORDER BY probability DESC, estimated_value DESC
            LIMIT %s""",
        params,
    )

    total_value = sum(float(p.get("estimated_value") or 0) for p in prospects)

    return ToolResult(success=True, data={
        "prospects": prospects,
        "total": len(prospects),
        "total_pipeline_value": total_value,
    })


# ─── Tool 2: convert_prospect_to_npa ─────────────────────────────

CONVERT_PROSPECT_TO_NPA_SCHEMA = {
    "type": "object",
    "properties": {
        "prospect_id": {"type": "integer", "description": "Prospect ID to convert"},
        "submitted_by": {"type": "string", "description": "Who is submitting the NPA"},
        "risk_level": {"type": "string", "description": "Initial risk level assessment. Must be one of: LOW, MEDIUM, HIGH"},
        "npa_type": {"type": "string", "description": "NPA type. Must be one of: New-to-Group, Variation, Existing. Defaults to New-to-Group"},
    },
    "required": ["prospect_id"],
}


async def convert_prospect_to_npa_handler(inp: dict) -> ToolResult:
    # Fetch the prospect
    prospects = await query(
        "SELECT * FROM npa_prospects WHERE id = %s",
        [inp["prospect_id"]],
    )

    if not prospects:
        return ToolResult(success=False, error=f"Prospect {inp['prospect_id']} not found")

    prospect = prospects[0]

    # Generate collision-resistant NPA ID (align with Node API convention)
    npa_id = f"NPA-{uuid.uuid4().hex}"

    # Create the NPA project from prospect data
    await execute(
        """INSERT INTO npa_projects
               (id, title, description, npa_type, risk_level, status,
                estimated_revenue, submitted_by, current_stage, created_at, updated_at)
           VALUES (%s, %s, %s, %s, %s, 'ACTIVE', %s, %s, 'INITIATION', NOW(), NOW())""",
        [npa_id, prospect["name"],
         f"Converted from prospect: {prospect.get('theme', '')}",
         inp.get("npa_type", "New-to-Group"),
         inp.get("risk_level", "MEDIUM"),
         prospect.get("estimated_value"),
         inp.get("submitted_by", "system")],
    )

    # Update prospect status to Converted
    await execute(
        "UPDATE npa_prospects SET status = 'Converted' WHERE id = %s",
        [inp["prospect_id"]],
    )

    # Create initial workflow state
    await execute(
        """INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at)
           VALUES (%s, 'INITIATION', 'IN_PROGRESS', NOW())""",
        [npa_id],
    )

    return ToolResult(success=True, data={
        "npa_id": npa_id,
        "prospect_id": inp["prospect_id"],
        "prospect_name": prospect["name"],
        "estimated_value": prospect.get("estimated_value"),
        "status": "Converted",
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_prospects", description="Get the product opportunity pipeline with optional status and theme filters.", category="ideation", input_schema=GET_PROSPECTS_SCHEMA, handler=get_prospects_handler),
    ToolDefinition(name="convert_prospect_to_npa", description="Convert a prospect from the pipeline into a formal NPA project. Creates the project and initial workflow state.", category="ideation", input_schema=CONVERT_PROSPECT_TO_NPA_SCHEMA, handler=convert_prospect_to_npa_handler),
])
