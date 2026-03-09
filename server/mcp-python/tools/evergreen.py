"""
Evergreen Product Management Tools — 3 tools (GAP-009)
Pre-approved product types with same-day trading under approved limits.
Annual review, usage tracking, and limit breach detection.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: evergreen_list ──────────────────────────────────────

EVERGREEN_LIST_SCHEMA = {
    "type": "object",
    "properties": {},
}


async def evergreen_list_handler(inp: dict) -> ToolResult:
    rows = await query("""
        SELECT p.id, p.title, p.product_category, p.notional_amount AS approved_limit,
               p.currency, p.current_stage, p.status, p.launched_at,
               (SELECT COALESCE(SUM(pm.total_volume), 0) FROM npa_performance_metrics pm
                WHERE pm.project_id = p.id AND pm.snapshot_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
               ) AS volume_30d
        FROM npa_projects p
        WHERE p.approval_track = 'EVERGREEN'
          AND p.current_stage IN ('LAUNCHED', 'APPROVED')
        ORDER BY p.launched_at DESC
    """, [])

    products = []
    for r in rows:
        limit_val = float(r.get("approved_limit") or 0)
        vol_val = float(r.get("volume_30d") or 0)
        products.append({
            **r,
            "utilization_pct": round((vol_val / limit_val) * 100) if limit_val > 0 else 0,
        })

    return ToolResult(success=True, data={
        "products": products,
        "total": len(products),
    })


# ─── Tool 2: evergreen_record_usage ─────────────────────────────

EVERGREEN_RECORD_USAGE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "Evergreen product NPA ID"},
        "volume": {"type": "number", "description": "Trading volume to record"},
        "pnl": {"type": "number", "description": "Realized P&L"},
        "counterparty_exposure": {"type": "number", "description": "Counterparty exposure amount"},
        "var_utilization": {"type": "number", "description": "VaR utilization percentage (0-100)"},
    },
    "required": ["project_id", "volume"],
}


async def evergreen_record_usage_handler(inp: dict) -> ToolResult:
    project_rows = await query("SELECT * FROM npa_projects WHERE id = %s", [inp["project_id"]])
    if not project_rows:
        return ToolResult(success=False, error="Project not found")
    npa = project_rows[0]

    if npa.get("approval_track") != "EVERGREEN":
        return ToolResult(success=False, error="Product is not on EVERGREEN track")

    launched = npa.get("launched_at")
    import math
    from datetime import datetime, timezone
    if launched:
        if isinstance(launched, str):
            launched_dt = datetime.fromisoformat(launched.replace("Z", "+00:00"))
        else:
            launched_dt = launched.replace(tzinfo=timezone.utc) if launched.tzinfo is None else launched
        days = max(0, (datetime.now(timezone.utc) - launched_dt).days)
    else:
        days = 0

    volume = float(inp.get("volume") or 0)
    pnl = float(inp.get("pnl") or 0)
    ce = float(inp.get("counterparty_exposure") or 0)
    var_u = float(inp.get("var_utilization") or 0)
    health = "critical" if var_u > 80 else ("warning" if var_u > 60 else "healthy")

    await execute(
        """INSERT INTO npa_performance_metrics
           (project_id, days_since_launch, total_volume, realized_pnl, counterparty_exposure, var_utilization, health_status)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [inp["project_id"], days, volume, pnl, ce, var_u, health],
    )

    # Check limit breach
    approved_limit = float(npa.get("notional_amount") or 0)
    limit_breached = False

    if approved_limit > 0 and volume > approved_limit:
        limit_breached = True
        max_rows = await query(
            "SELECT COALESCE(MAX(CAST(SUBSTRING(id, 4) AS UNSIGNED)), 0) AS max_num FROM npa_breach_alerts", [])
        breach_num = (max_rows[0]["max_num"] if max_rows else 0) + 1
        breach_id = f"BR-{breach_num:03d}"

        await execute(
            """INSERT INTO npa_breach_alerts (id, project_id, title, severity, description, threshold_value, actual_value, escalated_to, status)
               VALUES (%s, %s, %s, 'CRITICAL', %s, %s, %s, 'Head of Trading', 'OPEN')""",
            [breach_id, inp["project_id"], f"Evergreen Limit Breach: {npa.get('title')}",
             f"Volume {volume} exceeds limit of {approved_limit}",
             str(approved_limit), str(volume)],
        )
        await execute(
            """INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
               VALUES (%s, 'SYSTEM', 'EVERGREEN_LIMIT_BREACH', %s, 0)""",
            [inp["project_id"], json.dumps({"volume": volume, "limit": approved_limit})],
        )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "volume_recorded": volume,
        "health_status": health,
        "limit_breached": limit_breached,
    })


# ─── Tool 3: evergreen_annual_review ────────────────────────────

EVERGREEN_ANNUAL_REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "Evergreen product NPA ID"},
        "actor_name": {"type": "string", "description": "Reviewer name"},
        "findings": {"type": "string", "description": "Review findings summary"},
        "approved": {"type": "string", "description": "Whether the product is approved for another year. Use 'true' or 'false'"},
        "next_review_date": {"type": "string", "description": "Next annual review date (YYYY-MM-DD)"},
    },
    "required": ["project_id", "approved"],
}


async def evergreen_annual_review_handler(inp: dict) -> ToolResult:
    await execute(
        """INSERT INTO npa_audit_log (project_id, actor_name, action_type, action_details, is_agent_action)
           VALUES (%s, %s, 'EVERGREEN_ANNUAL_REVIEW', %s, 0)""",
        [inp["project_id"], inp.get("actor_name", "SYSTEM"),
         json.dumps({"findings": inp.get("findings"), "approved": inp["approved"],
                      "next_review_date": inp.get("next_review_date")})],
    )

    approved = str(inp.get("approved", "false")).lower() in ("true", "1", "yes")
    status = "REVIEW_APPROVED" if approved else "REVIEW_FLAGGED"
    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "status": status,
        "next_review_date": inp.get("next_review_date"),
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="evergreen_list", description="List all Evergreen products with their 30-day utilization against approved limits.", category="evergreen", input_schema=EVERGREEN_LIST_SCHEMA, handler=evergreen_list_handler),
    ToolDefinition(name="evergreen_record_usage", description="Record daily trading usage for an Evergreen product. Auto-creates breach alerts if limits exceeded.", category="evergreen", input_schema=EVERGREEN_RECORD_USAGE_SCHEMA, handler=evergreen_record_usage_handler),
    ToolDefinition(name="evergreen_annual_review", description="Record annual review completion for an Evergreen product.", category="evergreen", input_schema=EVERGREEN_ANNUAL_REVIEW_SCHEMA, handler=evergreen_annual_review_handler),
])
