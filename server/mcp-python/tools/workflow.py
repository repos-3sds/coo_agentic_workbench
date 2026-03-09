"""
Workflow Tools — 5 tools
Workflow state management, session history, routing decisions, user profiles.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_workflow_state ──────────────────────────────────

GET_WORKFLOW_STATE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def get_workflow_state_handler(inp: dict) -> ToolResult:
    states = await query(
        """SELECT ws.*, p.current_stage as project_stage, p.status as project_status
           FROM npa_workflow_states ws
           JOIN npa_projects p ON p.id = ws.project_id
           WHERE ws.project_id = %s
           ORDER BY ws.started_at ASC""",
        [inp["project_id"]],
    )

    if not states:
        return ToolResult(success=False, error=f"No workflow state found for project '{inp['project_id']}'")

    current = next((s for s in states if s["status"] == "IN_PROGRESS"), None)
    completed = [s for s in states if s["status"] == "COMPLETED"]
    not_started = [s for s in states if s["status"] == "NOT_STARTED"]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "project_stage": states[0].get("project_stage"),
        "project_status": states[0].get("project_status"),
        "current_state": current,
        "all_states": states,
        "summary": {
            "total_stages": len(states),
            "completed": len(completed),
            "in_progress": 1 if current else 0,
            "not_started": len(not_started),
            "progress_pct": round((len(completed) / len(states)) * 100) if states else 0,
        },
    })


# ─── Tool 2: advance_workflow_state ──────────────────────────────

ADVANCE_WORKFLOW_STATE_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "new_stage": {"type": "string", "description": "New workflow stage to advance to"},
        "reason": {"type": "string", "description": "Reason for the stage transition"},
        "blockers": {"type": "string", "description": "Comma-separated list of any blockers for the new stage"},
    },
    "required": ["project_id", "new_stage"],
}


async def advance_workflow_state_handler(inp: dict) -> ToolResult:
    project = await query(
        "SELECT current_stage FROM npa_projects WHERE id = %s",
        [inp["project_id"]],
    )
    previous_stage = project[0].get("current_stage", "UNKNOWN") if project else "UNKNOWN"

    # Complete current IN_PROGRESS state
    await execute(
        """UPDATE npa_workflow_states SET status = 'COMPLETED', completed_at = NOW()
           WHERE project_id = %s AND status = 'IN_PROGRESS'""",
        [inp["project_id"]],
    )

    # Create new state
    blockers_raw = inp.get("blockers")
    if isinstance(blockers_raw, str) and blockers_raw:
        blockers_json = json.dumps([b.strip() for b in blockers_raw.split(",") if b.strip()])
    elif isinstance(blockers_raw, list):
        blockers_json = json.dumps(blockers_raw) if blockers_raw else None
    else:
        blockers_json = None
    await execute(
        """INSERT INTO npa_workflow_states (project_id, stage_id, status, started_at, blockers)
           VALUES (%s, %s, 'IN_PROGRESS', NOW(), %s)""",
        [inp["project_id"], inp["new_stage"], blockers_json],
    )

    # Update project's current_stage
    await execute(
        "UPDATE npa_projects SET current_stage = %s, updated_at = NOW() WHERE id = %s",
        [inp["new_stage"], inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "previous_stage": previous_stage,
        "new_stage": inp["new_stage"],
        "reason": inp.get("reason"),
        "blockers": inp.get("blockers"),
    })


# ─── Tool 3: get_session_history ─────────────────────────────────

GET_SESSION_HISTORY_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID to get session history for"},
        "agent_id": {"type": "string", "description": "Filter by specific agent identity"},
        "limit": {"type": "integer", "description": "Max sessions to return. Defaults to 20"},
    },
    "required": ["project_id"],
}


async def get_session_history_handler(inp: dict) -> ToolResult:
    conditions = ["s.project_id = %s"]
    params = [inp["project_id"]]

    if inp.get("agent_id"):
        conditions.append("s.agent_identity = %s")
        params.append(inp["agent_id"])

    limit = inp.get("limit", 20)
    params.append(limit)

    sessions = await query(
        f"""SELECT s.id, s.agent_identity, s.current_stage, s.handoff_from,
                   s.started_at, s.ended_at, s.user_id,
                   (SELECT COUNT(*) FROM agent_messages m WHERE m.session_id = s.id) as message_count
            FROM agent_sessions s
            WHERE {' AND '.join(conditions)}
            ORDER BY s.started_at DESC
            LIMIT %s""",
        params,
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "sessions": sessions,
        "total": len(sessions),
    })


# ─── Tool 4: log_routing_decision ────────────────────────────────

LOG_ROUTING_DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "session_id": {"type": "string", "description": "Current agent session ID"},
        "project_id": {"type": "string", "description": "NPA project ID"},
        "source_agent": {"type": "string", "description": "Agent making the routing decision"},
        "target_agent": {"type": "string", "description": "Agent being routed to"},
        "routing_reason": {"type": "string", "description": "Why the routing decision was made"},
        "confidence": {"type": "number", "description": "Confidence in routing decision 0-100"},
        "context_payload_json": {"type": "string", "description": "JSON string of context to pass to the target agent"},
    },
    "required": ["source_agent", "target_agent", "routing_reason"],
}


async def log_routing_decision_handler(inp: dict) -> ToolResult:
    context_raw = inp.get("context_payload_json") or inp.get("context_payload")
    if isinstance(context_raw, str):
        context_json = context_raw  # Already JSON string
    elif isinstance(context_raw, dict):
        context_json = json.dumps(context_raw)
    else:
        context_json = None

    row_id = await execute(
        """INSERT INTO npa_agent_routing_decisions
               (session_id, project_id, source_agent, target_agent, routing_reason, confidence, context_payload, decided_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
        [inp.get("session_id"), inp.get("project_id"),
         inp["source_agent"], inp["target_agent"],
         inp["routing_reason"], inp.get("confidence"),
         context_json],
    )

    return ToolResult(success=True, data={
        "id": row_id,
        "source_agent": inp["source_agent"],
        "target_agent": inp["target_agent"],
        "routing_reason": inp["routing_reason"],
    })


# ─── Tool 5: get_user_profile ────────────────────────────────────

GET_USER_PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "user_id": {"type": "string", "description": "User ID (UUID)"},
        "email": {"type": "string", "description": "Look up by email instead of ID"},
        "employee_id": {"type": "string", "description": "Look up by employee ID"},
    },
}


async def get_user_profile_handler(inp: dict) -> ToolResult:
    if inp.get("user_id"):
        rows = await query("SELECT * FROM users WHERE id = %s", [inp["user_id"]])
    elif inp.get("email"):
        rows = await query("SELECT * FROM users WHERE email = %s", [inp["email"]])
    elif inp.get("employee_id"):
        rows = await query("SELECT * FROM users WHERE employee_id = %s", [inp["employee_id"]])
    else:
        return ToolResult(success=False, error="Provide user_id, email, or employee_id")

    if not rows:
        return ToolResult(success=False, error="User not found")

    user = rows[0]
    # Don't expose internal fields
    return ToolResult(success=True, data={
        "user": {
            "id": user["id"],
            "email": user["email"],
            "employee_id": user["employee_id"],
            "full_name": user["full_name"],
            "display_name": user.get("display_name"),
            "department": user.get("department"),
            "job_title": user.get("job_title"),
            "location": user.get("location"),
            "role": user["role"],
            "is_active": user.get("is_active"),
        },
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_workflow_state", description="Get the full workflow state for an NPA including all stage statuses, progress, and blockers.", category="workflow", input_schema=GET_WORKFLOW_STATE_SCHEMA, handler=get_workflow_state_handler),
    ToolDefinition(name="advance_workflow_state", description="Advance an NPA to the next workflow stage. Completes current stage and creates new IN_PROGRESS state.", category="workflow", input_schema=ADVANCE_WORKFLOW_STATE_SCHEMA, handler=advance_workflow_state_handler),
    ToolDefinition(name="get_session_history", description="Get the conversation session history for an NPA project, optionally filtered by agent.", category="workflow", input_schema=GET_SESSION_HISTORY_SCHEMA, handler=get_session_history_handler),
    ToolDefinition(name="log_routing_decision", description="Log an agent-to-agent routing decision with reason, confidence, and context payload.", category="workflow", input_schema=LOG_ROUTING_DECISION_SCHEMA, handler=log_routing_decision_handler),
    ToolDefinition(name="get_user_profile", description="Look up a user profile by ID, email, or employee ID. Returns role, department, and contact info.", category="workflow", input_schema=GET_USER_PROFILE_SCHEMA, handler=get_user_profile_handler),
])
