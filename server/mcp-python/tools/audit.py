"""
Audit Tools — 2 tools
Powers the Audit Trail Agent: immutable logging of all human and agent actions.
Mirrors server/mcp/src/tools/audit.ts exactly.
"""
import json
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: audit_log_action ─────────────────────────────────────

LOG_ACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "actor_name": {"type": "string", "description": "Name of the person or agent performing the action"},
        "actor_role": {"type": "string", "description": "Role of the actor (e.g., Maker, Checker, Approver, AI Agent)"},
        "action_type": {"type": "string", "description": "Action type code (e.g., NPA_CREATED, CLASSIFIED, FORM_AUTOFILLED, SIGNOFF_APPROVED, STAGE_ADVANCED, LOOPBACK_TRIGGERED)"},
        "action_details": {"type": "string", "description": "Human-readable description of what happened"},
        "is_agent_action": {"type": "string", "description": "Whether this action was performed by an AI agent. Use 'true' or 'false'"},
        "agent_name": {"type": "string", "description": "Name of the AI agent (e.g., Classification Agent, AutoFill Agent)"},
        "confidence_score": {"type": "number", "description": "Agent confidence score 0-100 if applicable"},
        "reasoning": {"type": "string", "description": "Agent reasoning for the action"},
        "model_version": {"type": "string", "description": "AI model version used"},
        "source_citations": {"type": "string", "description": "Comma-separated list of source documents or data referenced"},
    },
    "required": ["project_id", "actor_name", "action_type"],
}


async def audit_log_action_handler(inp: dict) -> ToolResult:
    # Handle is_agent_action as string or boolean
    is_agent = inp.get("is_agent_action", False)
    if isinstance(is_agent, str):
        is_agent = is_agent.lower() in ("true", "1", "yes")

    # Handle source_citations as string (comma-separated) or list
    citations = inp.get("source_citations")
    if isinstance(citations, str) and citations:
        citations = json.dumps([c.strip() for c in citations.split(",") if c.strip()])
    elif isinstance(citations, list):
        citations = json.dumps(citations) if citations else None
    else:
        citations = None

    audit_id = await execute(
        """INSERT INTO npa_audit_log (project_id, actor_name, actor_role, action_type, action_details,
                                      is_agent_action, agent_name, timestamp, confidence_score, reasoning,
                                      model_version, source_citations)
           VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s, %s)""",
        [
            inp["project_id"],
            inp["actor_name"],
            inp.get("actor_role"),
            inp["action_type"],
            inp.get("action_details"),
            is_agent,
            inp.get("agent_name"),
            inp.get("confidence_score"),
            inp.get("reasoning"),
            inp.get("model_version"),
            citations,
        ],
    )
    return ToolResult(success=True, data={
        "audit_id": audit_id,
        "project_id": inp["project_id"],
        "action_type": inp["action_type"],
        "actor": inp["actor_name"],
        "is_agent": is_agent,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


# ─── Tool 2: audit_get_trail ──────────────────────────────────────

GET_TRAIL_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "action_type": {"type": "string", "description": "Filter by action type"},
        "agent_only": {"type": "string", "description": "Only show agent actions. Use 'true' or 'false'. Defaults to false"},
        "limit": {"type": "integer", "description": "Max entries to return. Defaults to 50"},
    },
    "required": ["project_id"],
}


async def audit_get_trail_handler(inp: dict) -> ToolResult:
    sql = """SELECT id, project_id, actor_name, actor_role, action_type, action_details,
                    is_agent_action, agent_name, timestamp, confidence_score, reasoning,
                    model_version, source_citations
             FROM npa_audit_log WHERE project_id = %s"""
    params: list = [inp["project_id"]]

    if inp.get("action_type"):
        sql += " AND action_type = %s"
        params.append(inp["action_type"])
    if str(inp.get("agent_only", "false")).lower() in ("true", "1", "yes"):
        sql += " AND is_agent_action = TRUE"

    sql += " ORDER BY timestamp DESC LIMIT %s"
    params.append(inp.get("limit", 50))

    entries = await query(sql, params)

    agent_actions = [e for e in entries if e.get("is_agent_action")]
    human_actions = [e for e in entries if not e.get("is_agent_action")]
    action_types = list({e["action_type"] for e in entries})

    avg_confidence = None
    if agent_actions:
        scores = [a.get("confidence_score", 0) for a in agent_actions if a.get("confidence_score") is not None]
        avg_confidence = round(sum(scores) / len(scores)) if scores else None

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "entries": entries,
        "summary": {
            "total": len(entries),
            "agent_actions": len(agent_actions),
            "human_actions": len(human_actions),
            "action_types": action_types,
            "avg_agent_confidence": avg_confidence,
        },
    })


# ─── Tool 3: check_audit_completeness ──────────────────────────────

CHECK_AUDIT_COMPLETENESS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}

# Required audit action types for a complete NPA lifecycle
_REQUIRED_ACTIONS = [
    "NPA_CREATED", "CLASSIFIED", "FORM_AUTOFILLED",
    "SIGNOFF_APPROVED", "STAGE_ADVANCED",
]


async def check_audit_completeness_handler(inp: dict) -> ToolResult:
    entries = await query(
        """SELECT DISTINCT action_type FROM npa_audit_log WHERE project_id = %s""",
        [inp["project_id"]],
    )
    logged_types = {e["action_type"] for e in entries}

    missing = [a for a in _REQUIRED_ACTIONS if a not in logged_types]
    present = [a for a in _REQUIRED_ACTIONS if a in logged_types]

    # Count totals
    counts = await query(
        """SELECT COUNT(*) as total,
                  SUM(CASE WHEN is_agent_action = 1 THEN 1 ELSE 0 END) as agent_count,
                  SUM(CASE WHEN is_agent_action = 0 OR is_agent_action IS NULL THEN 1 ELSE 0 END) as human_count
           FROM npa_audit_log WHERE project_id = %s""",
        [inp["project_id"]],
    )
    summary = counts[0] if counts else {"total": 0, "agent_count": 0, "human_count": 0}

    is_complete = len(missing) == 0

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "is_complete": is_complete,
        "required_actions": _REQUIRED_ACTIONS,
        "present_actions": present,
        "missing_actions": missing,
        "completeness_pct": round((len(present) / len(_REQUIRED_ACTIONS)) * 100) if _REQUIRED_ACTIONS else 100,
        "total_entries": summary["total"],
        "agent_entries": summary["agent_count"],
        "human_entries": summary["human_count"],
    })


# ─── Tool 4: generate_audit_report ────────────────────────────────

GENERATE_AUDIT_REPORT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "include_agent_reasoning": {"type": "string", "description": "Include AI agent reasoning chains in the report. Use 'true' or 'false'. Defaults to true"},
    },
    "required": ["project_id"],
}


async def generate_audit_report_handler(inp: dict) -> ToolResult:
    # Get all audit entries
    entries = await query(
        """SELECT id, actor_name, actor_role, action_type, action_details,
                  is_agent_action, agent_name, timestamp, confidence_score,
                  reasoning, model_version, source_citations
           FROM npa_audit_log WHERE project_id = %s
           ORDER BY timestamp ASC""",
        [inp["project_id"]],
    )

    # Get project info
    project = await query(
        "SELECT id, title, npa_type, current_stage, status, created_at FROM npa_projects WHERE id = %s",
        [inp["project_id"]],
    )

    # Build timeline
    timeline = []
    for e in entries:
        entry = {
            "timestamp": str(e.get("timestamp")) if e.get("timestamp") else None,
            "action": e["action_type"],
            "actor": e["actor_name"],
            "role": e.get("actor_role"),
            "details": e.get("action_details"),
            "is_agent": bool(e.get("is_agent_action")),
        }
        if str(inp.get("include_agent_reasoning", "true")).lower() not in ("false", "0", "no") and e.get("is_agent_action"):
            entry["agent_name"] = e.get("agent_name")
            entry["confidence"] = e.get("confidence_score")
            entry["reasoning"] = e.get("reasoning")
            entry["model_version"] = e.get("model_version")
        timeline.append(entry)

    # Stage transitions
    stage_entries = [e for e in entries if e["action_type"] == "STAGE_ADVANCED"]
    agent_entries = [e for e in entries if e.get("is_agent_action")]
    confidence_scores = [e["confidence_score"] for e in agent_entries if e.get("confidence_score") is not None]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "project": project[0] if project else None,
        "timeline": timeline,
        "summary": {
            "total_actions": len(entries),
            "stage_transitions": len(stage_entries),
            "agent_actions": len(agent_entries),
            "human_actions": len(entries) - len(agent_entries),
            "avg_agent_confidence": round(sum(confidence_scores) / len(confidence_scores)) if confidence_scores else None,
            "unique_actors": list({e["actor_name"] for e in entries}),
        },
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="audit_log_action", description="Write an immutable audit log entry. Tracks both human and AI agent actions with confidence scores and reasoning chains.", category="audit", input_schema=LOG_ACTION_SCHEMA, handler=audit_log_action_handler),
    ToolDefinition(name="audit_get_trail", description="Get the audit trail for an NPA. Returns chronological list of all actions with actor, reasoning, and timestamps.", category="audit", input_schema=GET_TRAIL_SCHEMA, handler=audit_get_trail_handler),
    ToolDefinition(name="check_audit_completeness", description="Check whether all required audit entries exist for an NPA lifecycle. Identifies missing mandatory audit actions.", category="audit", input_schema=CHECK_AUDIT_COMPLETENESS_SCHEMA, handler=check_audit_completeness_handler),
    ToolDefinition(name="generate_audit_report", description="Generate a comprehensive audit compliance report with timeline, actor summary, and agent reasoning chains.", category="audit", input_schema=GENERATE_AUDIT_REPORT_SCHEMA, handler=generate_audit_report_handler),
])
