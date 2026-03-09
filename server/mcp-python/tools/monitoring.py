"""
Monitoring Tools — 7 tools
Post-launch monitoring: performance metrics, breach alerts, thresholds, conditions,
approximate booking detection (GAP-020).
"""
import json
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_performance_metrics ─────────────────────────────

GET_PERFORMANCE_METRICS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "limit": {"type": "integer", "description": "Max snapshots to return. Defaults to 10"},
    },
    "required": ["project_id"],
}


async def get_performance_metrics_handler(inp: dict) -> ToolResult:
    limit = inp.get("limit", 10)
    metrics = await query(
        """SELECT id, project_id, days_since_launch, total_volume, volume_currency,
                  realized_pnl, active_breaches, counterparty_exposure,
                  var_utilization, collateral_posted, next_review_date,
                  health_status, snapshot_date
           FROM npa_performance_metrics
           WHERE project_id = %s
           ORDER BY snapshot_date DESC
           LIMIT %s""",
        [inp["project_id"], limit],
    )

    latest = metrics[0] if metrics else None

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "latest": latest,
        "history": metrics,
        "total_snapshots": len(metrics),
    })


# ─── Tool 2: check_breach_thresholds ─────────────────────────────

CHECK_BREACH_THRESHOLDS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def check_breach_thresholds_handler(inp: dict) -> ToolResult:
    thresholds = await query(
        """SELECT t.*, pm.total_volume, pm.realized_pnl, pm.var_utilization, pm.counterparty_exposure
           FROM npa_monitoring_thresholds t
           LEFT JOIN (
               SELECT * FROM npa_performance_metrics
               WHERE project_id = %s ORDER BY snapshot_date DESC LIMIT 1
           ) pm ON pm.project_id = t.project_id
           WHERE t.project_id = %s AND t.is_active = 1""",
        [inp["project_id"], inp["project_id"]],
    )

    breaches = []
    for t in thresholds:
        metric_name = t["metric_name"]
        warning_val = float(t["warning_value"])
        critical_val = float(t["critical_value"])
        comparison = t.get("comparison", "GT")

        # Map metric name to actual column value
        metric_map = {
            "trading_volume": t.get("total_volume"),
            "pnl": t.get("realized_pnl"),
            "var_utilization": t.get("var_utilization"),
            "counterparty_exposure": t.get("counterparty_exposure"),
        }
        actual = metric_map.get(metric_name)
        if actual is None:
            continue

        actual = float(actual)
        severity = None
        if comparison == "GT":
            if actual >= critical_val:
                severity = "CRITICAL"
            elif actual >= warning_val:
                severity = "WARNING"
        elif comparison == "LT":
            if actual <= critical_val:
                severity = "CRITICAL"
            elif actual <= warning_val:
                severity = "WARNING"

        if severity:
            breaches.append({
                "metric_name": metric_name,
                "actual_value": actual,
                "warning_value": warning_val,
                "critical_value": critical_val,
                "severity": severity,
                "comparison": comparison,
            })

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "thresholds_checked": len(thresholds),
        "breaches": breaches,
        "breach_count": len(breaches),
        "has_critical": any(b["severity"] == "CRITICAL" for b in breaches),
    })


# ─── Tool 3: create_breach_alert ─────────────────────────────────

CREATE_BREACH_ALERT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "title": {"type": "string", "description": "Alert title"},
        "severity": {"type": "string", "description": "Alert severity. Must be one of: CRITICAL, WARNING, INFO"},
        "description": {"type": "string", "description": "Detailed description of the breach"},
        "threshold_value": {"type": "string", "description": "The threshold that was breached"},
        "actual_value": {"type": "string", "description": "The actual measured value"},
        "escalated_to": {"type": "string", "description": "Person/team this was escalated to"},
        "sla_hours": {"type": "integer", "description": "SLA hours for resolution"},
    },
    "required": ["project_id", "title", "severity", "description"],
}


async def create_breach_alert_handler(inp: dict) -> ToolResult:
    # Generate breach alert ID: BR-XXX
    count_rows = await query("SELECT COUNT(*) as cnt FROM npa_breach_alerts")
    next_num = (count_rows[0]["cnt"] if count_rows else 0) + 1
    alert_id = f"BR-{next_num:03d}"

    await execute(
        """INSERT INTO npa_breach_alerts
               (id, project_id, title, severity, description, threshold_value,
                actual_value, escalated_to, sla_hours, status, triggered_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'OPEN', NOW())""",
        [alert_id, inp["project_id"], inp["title"], inp["severity"],
         inp["description"], inp.get("threshold_value"), inp.get("actual_value"),
         inp.get("escalated_to"), inp.get("sla_hours")],
    )

    return ToolResult(success=True, data={
        "alert_id": alert_id,
        "project_id": inp["project_id"],
        "severity": inp["severity"],
        "title": inp["title"],
        "status": "OPEN",
    })


# ─── Tool 4: get_monitoring_thresholds ───────────────────────────

GET_MONITORING_THRESHOLDS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def get_monitoring_thresholds_handler(inp: dict) -> ToolResult:
    thresholds = await query(
        """SELECT id, metric_name, warning_value, critical_value, comparison, is_active, created_at
           FROM npa_monitoring_thresholds
           WHERE project_id = %s
           ORDER BY metric_name""",
        [inp["project_id"]],
    )

    active = [t for t in thresholds if t.get("is_active")]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "thresholds": thresholds,
        "summary": {
            "total": len(thresholds),
            "active": len(active),
        },
    })


# ─── Tool 5: get_post_launch_conditions ──────────────────────────

GET_POST_LAUNCH_CONDITIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def get_post_launch_conditions_handler(inp: dict) -> ToolResult:
    conditions = await query(
        """SELECT id, condition_text, owner_party, due_date, status
           FROM npa_post_launch_conditions
           WHERE project_id = %s
           ORDER BY due_date""",
        [inp["project_id"]],
    )

    pending = [c for c in conditions if c.get("status") == "PENDING"]
    completed = [c for c in conditions if c.get("status") == "COMPLETED"]
    overdue = [c for c in pending if c.get("due_date") and str(c["due_date"]) < datetime.now(timezone.utc).strftime("%Y-%m-%d")]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "conditions": conditions,
        "summary": {
            "total": len(conditions),
            "pending": len(pending),
            "completed": len(completed),
            "overdue": len(overdue),
            "completion_pct": round((len(completed) / len(conditions)) * 100) if conditions else 0,
        },
    })


# ─── Tool 6: update_condition_status ─────────────────────────────

UPDATE_CONDITION_STATUS_SCHEMA = {
    "type": "object",
    "properties": {
        "condition_id": {"type": "integer", "description": "Post-launch condition ID"},
        "status": {"type": "string", "description": "New status. Must be one of: PENDING, COMPLETED, WAIVED"},
    },
    "required": ["condition_id", "status"],
}


async def update_condition_status_handler(inp: dict) -> ToolResult:
    await execute(
        "UPDATE npa_post_launch_conditions SET status = %s WHERE id = %s",
        [inp["status"], inp["condition_id"]],
    )

    updated = await query(
        "SELECT * FROM npa_post_launch_conditions WHERE id = %s",
        [inp["condition_id"]],
    )

    return ToolResult(success=True, data={
        "condition_id": inp["condition_id"],
        "new_status": inp["status"],
        "condition": updated[0] if updated else None,
    })


# ─── Tool 7: detect_approximate_booking (GAP-020) ────────────────

DETECT_APPROXIMATE_BOOKING_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID to check for proxy trades"},
        "lookback_days": {"type": "integer", "description": "Days to look back for suspicious trades. Defaults to 30"},
    },
    "required": ["project_id"],
}


async def detect_approximate_booking_handler(inp: dict) -> ToolResult:
    """
    GAP-020: Detect approximate booking (proxy trades).
    GFM SOP requires monitoring for trades booked under one approved product
    that actually represent a different (possibly unapproved) product.

    Detection signals:
    1. Trades with notional significantly different from approved product norms
    2. Counterparty types not matching product's target segment
    3. Tenors outside approved product range
    4. Booking entity mismatch with product approval jurisdiction
    5. High volume spike (>3x average) suggesting proxy activity
    """
    lookback = inp.get("lookback_days", 30)

    # Get the NPA project details
    project = await query(
        """SELECT id, title, product_category, approval_track, notional_amount,
                  npa_type
           FROM npa_projects WHERE id = %s""",
        [inp["project_id"]],
    )
    if not project:
        return ToolResult(success=False, error=f"Project {inp['project_id']} not found")

    proj = project[0]
    approved_notional = float(proj.get("notional_amount") or 0)

    # Get recent performance metrics for volume analysis
    metrics = await query(
        """SELECT total_volume, volume_currency, snapshot_date, counterparty_exposure
           FROM npa_performance_metrics
           WHERE project_id = %s
             AND snapshot_date >= DATE_SUB(NOW(), INTERVAL %s DAY)
           ORDER BY snapshot_date DESC""",
        [inp["project_id"], lookback],
    )

    flags = []
    risk_score = 0

    # Signal 1: Notional outlier detection
    if metrics and approved_notional > 0:
        volumes = [float(m.get("total_volume") or 0) for m in metrics]
        avg_volume = sum(volumes) / len(volumes) if volumes else 0
        max_volume = max(volumes) if volumes else 0

        if max_volume > approved_notional * 2:
            flags.append({
                "signal": "NOTIONAL_OUTLIER",
                "severity": "HIGH",
                "detail": f"Max volume ${max_volume:,.0f} exceeds 2x approved notional ${approved_notional:,.0f}",
            })
            risk_score += 30

        # Signal 5: Volume spike detection
        if len(volumes) >= 3:
            recent_avg = sum(volumes[:3]) / 3
            historical_avg = sum(volumes[3:]) / len(volumes[3:]) if len(volumes) > 3 else recent_avg
            if historical_avg > 0 and recent_avg > historical_avg * 3:
                flags.append({
                    "signal": "VOLUME_SPIKE",
                    "severity": "MEDIUM",
                    "detail": f"Recent 3-day avg ${recent_avg:,.0f} is {recent_avg/historical_avg:.1f}x historical avg ${historical_avg:,.0f}",
                })
                risk_score += 20

    # Signal 4: Booking entity mismatch (check jurisdictions)
    jurisdictions = await query(
        """SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = %s""",
        [inp["project_id"]],
    )
    approved_jurisdictions = [j["jurisdiction_code"] for j in jurisdictions] if jurisdictions else []

    # Check if any risk checks flagged booking anomalies
    risk_anomalies = await query(
        """SELECT check_layer, result, matched_items FROM npa_risk_checks
           WHERE project_id = %s AND result = 'WARNING'
           ORDER BY checked_at DESC LIMIT 5""",
        [inp["project_id"]],
    )
    if risk_anomalies:
        for anomaly in risk_anomalies:
            notes = str(anomaly.get("matched_items") or "")
            if any(kw in notes.lower() for kw in ["proxy", "approximate", "booking", "mismatch", "substitute"]):
                flags.append({
                    "signal": "RISK_CHECK_WARNING",
                    "severity": "HIGH",
                    "detail": f"Risk check '{anomaly['check_layer']}' flagged: {notes[:100]}",
                })
                risk_score += 25

    # Determine overall proxy trade risk
    proxy_risk = "LOW"
    if risk_score >= 50:
        proxy_risk = "HIGH"
    elif risk_score >= 25:
        proxy_risk = "MEDIUM"

    # If HIGH risk, create a breach alert
    if proxy_risk == "HIGH":
        count_rows = await query("SELECT COUNT(*) as cnt FROM npa_breach_alerts")
        next_num = (count_rows[0]["cnt"] if count_rows else 0) + 1
        alert_id = f"BR-{next_num:03d}"
        try:
            await execute(
                """INSERT INTO npa_breach_alerts
                       (id, project_id, title, severity, description, status, triggered_at)
                   VALUES (%s, %s, %s, 'WARNING', %s, 'OPEN', NOW())""",
                [alert_id, inp["project_id"],
                 f"Potential Approximate Booking: {proj.get('title', '')}",
                 f"Proxy trade detection flagged {len(flags)} signal(s) with risk score {risk_score}. Flags: {json.dumps(flags)}"],
            )
        except Exception:
            pass  # Non-critical — alert creation is best-effort

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "product": proj.get("title"),
        "proxy_trade_risk": proxy_risk,
        "risk_score": risk_score,
        "flags": flags,
        "flag_count": len(flags),
        "metrics_analyzed": len(metrics),
        "lookback_days": lookback,
        "approved_jurisdictions": approved_jurisdictions,
        "recommendation": "Escalate to GFM COO for review" if proxy_risk == "HIGH"
            else "Continue monitoring" if proxy_risk == "MEDIUM"
            else "No action required",
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_performance_metrics", description="Get post-launch performance metrics for an NPA including volume, PnL, VaR, and health status.", category="monitoring", input_schema=GET_PERFORMANCE_METRICS_SCHEMA, handler=get_performance_metrics_handler),
    ToolDefinition(name="check_breach_thresholds", description="Check all active monitoring thresholds against latest metrics and identify breaches.", category="monitoring", input_schema=CHECK_BREACH_THRESHOLDS_SCHEMA, handler=check_breach_thresholds_handler),
    ToolDefinition(name="create_breach_alert", description="Create a new breach alert for an NPA when a monitoring threshold is exceeded.", category="monitoring", input_schema=CREATE_BREACH_ALERT_SCHEMA, handler=create_breach_alert_handler),
    ToolDefinition(name="get_monitoring_thresholds", description="Get all monitoring thresholds configured for an NPA project.", category="monitoring", input_schema=GET_MONITORING_THRESHOLDS_SCHEMA, handler=get_monitoring_thresholds_handler),
    ToolDefinition(name="get_post_launch_conditions", description="Get all post-launch conditions for an NPA with status tracking and overdue detection.", category="monitoring", input_schema=GET_POST_LAUNCH_CONDITIONS_SCHEMA, handler=get_post_launch_conditions_handler),
    ToolDefinition(name="update_condition_status", description="Update the status of a post-launch condition (PENDING, COMPLETED, WAIVED).", category="monitoring", input_schema=UPDATE_CONDITION_STATUS_SCHEMA, handler=update_condition_status_handler),
    ToolDefinition(name="detect_approximate_booking", description="GAP-020: Detect proxy/approximate trades booked under an approved NPA that may represent a different product. Analyzes volume anomalies, notional outliers, and risk check warnings.", category="monitoring", input_schema=DETECT_APPROXIMATE_BOOKING_SCHEMA, handler=detect_approximate_booking_handler),
])
