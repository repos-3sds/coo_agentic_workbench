"""
Notification Tools — 3 tools
Notification management: pending alerts, send notifications, mark as read.
Uses aggregation queries across existing tables (no dedicated notification table).
"""
import json
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_pending_notifications ────────────────────────────

GET_PENDING_NOTIFICATIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "Filter by NPA project ID"},
        "user_role": {"type": "string", "description": "Filter by user role (MAKER, CHECKER, APPROVER, COO, ADMIN)"},
        "limit": {"type": "integer", "description": "Max notifications. Defaults to 20"},
    },
}


async def get_pending_notifications_handler(inp: dict) -> ToolResult:
    notifications = []
    limit = inp.get("limit", 20)
    project_filter = ""
    project_params = []

    if inp.get("project_id"):
        project_filter = " AND project_id = %s"
        project_params = [inp["project_id"]]

    # 1. SLA breaches (pending signoffs past deadline)
    sla_alerts = await query(
        f"""SELECT s.id, s.project_id, s.party, s.approver_name, s.sla_deadline,
                   p.title as npa_title
            FROM npa_signoffs s
            JOIN npa_projects p ON p.id = s.project_id
            WHERE s.status = 'PENDING' AND s.sla_breached = 1{project_filter}
            ORDER BY s.sla_deadline ASC
            LIMIT %s""",
        project_params + [limit],
    )
    for a in sla_alerts:
        notifications.append({
            "type": "SLA_BREACH",
            "severity": "CRITICAL",
            "title": f"SLA breached: {a['party']} signoff for {a.get('npa_title', a['project_id'])}",
            "project_id": a["project_id"],
            "details": {"signoff_id": a["id"], "approver": a["approver_name"], "deadline": str(a.get("sla_deadline"))},
        })

    # 2. Open breach alerts
    breach_alerts = await query(
        f"""SELECT ba.id, ba.project_id, ba.title, ba.severity, ba.triggered_at,
                   p.title as npa_title
            FROM npa_breach_alerts ba
            JOIN npa_projects p ON p.id = ba.project_id
            WHERE ba.status IN ('OPEN', 'ESCALATED'){project_filter}
            ORDER BY ba.triggered_at DESC
            LIMIT %s""",
        project_params + [limit],
    )
    for b in breach_alerts:
        notifications.append({
            "type": "BREACH_ALERT",
            "severity": b["severity"],
            "title": b["title"],
            "project_id": b["project_id"],
            "details": {"alert_id": b["id"], "triggered_at": str(b.get("triggered_at"))},
        })

    # 3. Pending approvals (signoffs awaiting decision)
    pending_approvals = await query(
        f"""SELECT s.id, s.project_id, s.party, s.approver_name,
                   p.title as npa_title
            FROM npa_signoffs s
            JOIN npa_projects p ON p.id = s.project_id
            WHERE s.status = 'PENDING' AND (s.sla_breached IS NULL OR s.sla_breached = 0){project_filter}
            ORDER BY s.created_at ASC
            LIMIT %s""",
        project_params + [limit],
    )
    for pa in pending_approvals:
        notifications.append({
            "type": "PENDING_APPROVAL",
            "severity": "INFO",
            "title": f"Approval needed: {pa['party']} for {pa.get('npa_title', pa['project_id'])}",
            "project_id": pa["project_id"],
            "details": {"signoff_id": pa["id"], "approver": pa["approver_name"]},
        })

    # 4. Unanswered clarification questions
    clarifications = await query(
        f"""SELECT s.id, s.project_id, s.party, s.clarification_question,
                   p.title as npa_title
            FROM npa_signoffs s
            JOIN npa_projects p ON p.id = s.project_id
            WHERE s.status = 'REWORK' AND s.clarification_question IS NOT NULL
                  AND (s.clarification_answer IS NULL OR s.clarification_answer = ''){project_filter}
            ORDER BY s.decision_date DESC
            LIMIT %s""",
        project_params + [limit],
    )
    for c in clarifications:
        notifications.append({
            "type": "CLARIFICATION_NEEDED",
            "severity": "WARNING",
            "title": f"Clarification needed from {c['party']} for {c.get('npa_title', c['project_id'])}",
            "project_id": c["project_id"],
            "details": {"signoff_id": c["id"], "question": c["clarification_question"]},
        })

    # Sort by severity
    severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    notifications.sort(key=lambda n: severity_order.get(n["severity"], 3))

    return ToolResult(success=True, data={
        "notifications": notifications[:limit],
        "total": len(notifications),
        "by_type": _count_by(notifications, "type"),
        "by_severity": _count_by(notifications, "severity"),
    })


def _count_by(items: list, key: str) -> dict:
    counts = {}
    for item in items:
        val = item.get(key, "UNKNOWN")
        counts[val] = counts.get(val, 0) + 1
    return counts


# ─── Tool 2: send_notification ────────────────────────────────────

SEND_NOTIFICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "notification_type": {"type": "string", "description": "Type: SLA_BREACH, STAGE_CHANGE, APPROVAL_NEEDED, ESCALATION, SYSTEM_ALERT"},
        "title": {"type": "string", "description": "Notification title"},
        "message": {"type": "string", "description": "Notification message body"},
        "severity": {"type": "string", "description": "Severity level. Must be one of: CRITICAL, WARNING, INFO"},
        "recipient_role": {"type": "string", "description": "Target role (MAKER, CHECKER, APPROVER, COO)"},
    },
    "required": ["project_id", "notification_type", "title", "message"],
}


async def send_notification_handler(inp: dict) -> ToolResult:
    # Log notification as an audit entry (since no dedicated table exists yet)
    await execute(
        """INSERT INTO npa_audit_log
               (project_id, actor_name, actor_role, action_type, action_details,
                is_agent_action, agent_name, timestamp)
           VALUES (%s, 'NOTIFICATION_SYSTEM', 'SYSTEM', 'NOTIFICATION_SENT', %s, 1, 'notification-agent', NOW())""",
        [inp["project_id"],
         json.dumps({
             "type": inp["notification_type"],
             "title": inp["title"],
             "message": inp["message"],
             "severity": inp.get("severity", "INFO"),
             "recipient_role": inp.get("recipient_role"),
         })],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "notification_type": inp["notification_type"],
        "title": inp["title"],
        "severity": inp.get("severity", "INFO"),
        "sent_at": datetime.now(timezone.utc).isoformat(),
    })


# ─── Tool 3: mark_notification_read ──────────────────────────────

MARK_NOTIFICATION_READ_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "notification_type": {"type": "string", "description": "Type of notification to acknowledge"},
        "reference_id": {"type": "string", "description": "Reference ID (e.g. signoff ID, alert ID) to mark as acknowledged"},
    },
    "required": ["project_id", "notification_type"],
}


async def mark_notification_read_handler(inp: dict) -> ToolResult:
    acknowledged = []

    # Handle different notification types by updating the source records
    if inp["notification_type"] == "BREACH_ALERT" and inp.get("reference_id"):
        await execute(
            "UPDATE npa_breach_alerts SET status = 'ACKNOWLEDGED' WHERE id = %s AND project_id = %s",
            [inp["reference_id"], inp["project_id"]],
        )
        acknowledged.append({"type": "BREACH_ALERT", "id": inp["reference_id"], "new_status": "ACKNOWLEDGED"})

    elif inp["notification_type"] == "SLA_BREACH":
        # Log acknowledgment in audit
        await execute(
            """INSERT INTO npa_audit_log
                   (project_id, actor_name, actor_role, action_type, action_details,
                    is_agent_action, timestamp)
               VALUES (%s, 'USER', 'SYSTEM', 'NOTIFICATION_READ', %s, 0, NOW())""",
            [inp["project_id"],
             json.dumps({"type": inp["notification_type"], "reference_id": inp.get("reference_id")})],
        )
        acknowledged.append({"type": "SLA_BREACH", "action": "logged_acknowledgment"})

    else:
        # Generic acknowledgment via audit log
        await execute(
            """INSERT INTO npa_audit_log
                   (project_id, actor_name, actor_role, action_type, action_details,
                    is_agent_action, timestamp)
               VALUES (%s, 'USER', 'SYSTEM', 'NOTIFICATION_READ', %s, 0, NOW())""",
            [inp["project_id"],
             json.dumps({"type": inp["notification_type"], "reference_id": inp.get("reference_id")})],
        )
        acknowledged.append({"type": inp["notification_type"], "action": "logged_acknowledgment"})

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "acknowledged": acknowledged,
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_pending_notifications", description="Get pending notifications aggregated from SLA breaches, breach alerts, pending approvals, and clarification requests.", category="notifications", input_schema=GET_PENDING_NOTIFICATIONS_SCHEMA, handler=get_pending_notifications_handler),
    ToolDefinition(name="send_notification", description="Send a notification for an NPA event (SLA breach, stage change, approval needed, escalation).", category="notifications", input_schema=SEND_NOTIFICATION_SCHEMA, handler=send_notification_handler),
    ToolDefinition(name="mark_notification_read", description="Mark a notification as read/acknowledged. Updates the source record where applicable.", category="notifications", input_schema=MARK_NOTIFICATION_READ_SCHEMA, handler=mark_notification_read_handler),
])
