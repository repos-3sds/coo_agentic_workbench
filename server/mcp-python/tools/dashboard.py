"""
Dashboard Tools — 1 tool
Executive-level KPI snapshots for the COO dashboard and monitoring agent.
"""
from registry import ToolDefinition, ToolResult, registry
from db import query


# ─── Tool 1: get_dashboard_kpis ──────────────────────────────────

GET_DASHBOARD_KPIS_SCHEMA = {
    "type": "object",
    "properties": {
        "snapshot_date": {"type": "string", "description": "Specific date (YYYY-MM-DD) to get KPIs for. Defaults to latest."},
        "include_live": {"type": "string", "description": "Include live-computed metrics from current DB state. Use 'true' or 'false'. Defaults to true"},
    },
}


async def get_dashboard_kpis_handler(inp: dict) -> ToolResult:
    # Get stored KPI snapshot
    if inp.get("snapshot_date"):
        snapshots = await query(
            """SELECT * FROM npa_kpi_snapshots
               WHERE snapshot_date = %s
               ORDER BY created_at DESC LIMIT 1""",
            [inp["snapshot_date"]],
        )
    else:
        snapshots = await query(
            "SELECT * FROM npa_kpi_snapshots ORDER BY snapshot_date DESC LIMIT 1",
        )

    snapshot = snapshots[0] if snapshots else None

    # Compute live metrics if requested
    live = None
    if str(inp.get("include_live", "true")).lower() not in ("false", "0", "no"):
        # Active NPA count by status
        status_counts = await query(
            """SELECT status, COUNT(*) as cnt
               FROM npa_projects
               GROUP BY status""",
        )

        # Stage distribution
        stage_counts = await query(
            """SELECT current_stage, COUNT(*) as cnt
               FROM npa_projects
               WHERE status = 'ACTIVE'
               GROUP BY current_stage""",
        )

        # Risk distribution
        risk_counts = await query(
            """SELECT risk_level, COUNT(*) as cnt
               FROM npa_projects
               WHERE status = 'ACTIVE'
               GROUP BY risk_level""",
        )

        # Open breach alerts
        breach_counts = await query(
            """SELECT severity, COUNT(*) as cnt
               FROM npa_breach_alerts
               WHERE status IN ('OPEN', 'ESCALATED')
               GROUP BY severity""",
        )

        # SLA breaches
        sla_breached = await query(
            """SELECT COUNT(*) as cnt
               FROM npa_signoffs
               WHERE sla_breached = 1 AND status = 'PENDING'""",
        )

        # Pending signoffs
        pending_signoffs = await query(
            "SELECT COUNT(*) as cnt FROM npa_signoffs WHERE status = 'PENDING'",
        )

        live = {
            "status_distribution": {row["status"]: row["cnt"] for row in status_counts},
            "stage_distribution": {row["current_stage"]: row["cnt"] for row in stage_counts},
            "risk_distribution": {row["risk_level"]: row["cnt"] for row in risk_counts},
            "open_breaches": {row["severity"]: row["cnt"] for row in breach_counts},
            "sla_breaches_pending": sla_breached[0]["cnt"] if sla_breached else 0,
            "pending_signoffs": pending_signoffs[0]["cnt"] if pending_signoffs else 0,
        }

    return ToolResult(success=True, data={
        "snapshot": snapshot,
        "live": live,
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_dashboard_kpis", description="Get executive-level dashboard KPIs: pipeline value, active NPAs, cycle times, approval rates, and live status distribution.", category="dashboard", input_schema=GET_DASHBOARD_KPIS_SCHEMA, handler=get_dashboard_kpis_handler),
])
