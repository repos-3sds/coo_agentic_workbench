"""
Governance Extension Tools — 6 tools
Additional governance capabilities: routing rules, SLA status, escalations, approvals, comments.
"""
import json
from datetime import datetime, timezone

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: get_signoff_routing_rules ────────────────────────────

GET_SIGNOFF_ROUTING_RULES_SCHEMA = {
    "type": "object",
    "properties": {
        "approval_track": {"type": "string", "description": "Filter by approval track (FULL_NPA, NPA_LITE, BUNDLING, EVERGREEN)"},
    },
}


async def get_signoff_routing_rules_handler(inp: dict) -> ToolResult:
    conditions = []
    params = []

    if inp.get("approval_track"):
        conditions.append("approval_track = %s")
        params.append(inp["approval_track"])

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""

    rules = await query(
        f"""SELECT id, approval_track, party_group, party_name, is_mandatory,
                   sla_hours, can_parallel, sequence_order, trigger_condition
            FROM ref_signoff_routing_rules{where}
            ORDER BY approval_track, sequence_order""",
        params,
    )

    # Group by approval track
    by_track = {}
    for r in rules:
        track = r["approval_track"]
        by_track.setdefault(track, []).append(r)

    return ToolResult(success=True, data={
        "rules": rules,
        "by_track": by_track,
        "total": len(rules),
    })


# ─── Tool 2: check_sla_status ────────────────────────────────────

CHECK_SLA_STATUS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def check_sla_status_handler(inp: dict) -> ToolResult:
    signoffs = await query(
        """SELECT id, party, approver_name, status, sla_deadline,
                  sla_breached, started_review_at, decision_date, created_at
           FROM npa_signoffs
           WHERE project_id = %s""",
        [inp["project_id"]],
    )

    now = datetime.now(timezone.utc)
    sla_details = []

    for s in signoffs:
        deadline_str = s.get("sla_deadline")
        is_breached = bool(s.get("sla_breached"))

        if deadline_str and not is_breached and s["status"] == "PENDING":
            # Check if now past deadline
            try:
                if isinstance(deadline_str, str):
                    deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                else:
                    deadline = deadline_str.replace(tzinfo=timezone.utc) if deadline_str.tzinfo is None else deadline_str
                if now > deadline:
                    is_breached = True
                    # Mark as breached in DB
                    await execute(
                        "UPDATE npa_signoffs SET sla_breached = 1 WHERE id = %s",
                        [s["id"]],
                    )
            except Exception:
                pass

        sla_details.append({
            "signoff_id": s["id"],
            "party": s["party"],
            "approver": s["approver_name"],
            "status": s["status"],
            "sla_deadline": str(deadline_str) if deadline_str else None,
            "sla_breached": is_breached,
        })

    breached = [d for d in sla_details if d["sla_breached"]]
    pending = [d for d in sla_details if d["status"] == "PENDING"]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "signoffs": sla_details,
        "summary": {
            "total": len(sla_details),
            "pending": len(pending),
            "breached": len(breached),
            "breached_parties": [b["party"] for b in breached],
        },
    })


# ─── Tool 3: create_escalation ───────────────────────────────────

CREATE_ESCALATION_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "escalation_level": {"type": "integer", "description": "Escalation level (1=Dept Head, 2=BU Head, 3=GPH, 4=Group COO, 5=CEO)"},
        "trigger_type": {"type": "string", "description": "What triggered the escalation (SLA_BREACH, LOOP_BACK_LIMIT, DISAGREEMENT, RISK_THRESHOLD)"},
        "reason": {"type": "string", "description": "Detailed reason for escalation"},
        "escalated_by": {"type": "string", "description": "Who/what triggered the escalation"},
    },
    "required": ["project_id", "escalation_level", "trigger_type", "reason"],
}


async def create_escalation_handler(inp: dict) -> ToolResult:
    # Look up the escalation rule
    rules = await query(
        """SELECT authority_name, action_required
           FROM ref_escalation_rules
           WHERE escalation_level = %s AND trigger_type = %s
           LIMIT 1""",
        [inp["escalation_level"], inp["trigger_type"]],
    )

    authority = rules[0]["authority_name"] if rules else f"Level-{inp['escalation_level']} Authority"
    action = rules[0]["action_required"] if rules else "Review and decide"

    # Write to npa_escalations table per architecture spec
    esc_id = await execute(
        """INSERT INTO npa_escalations
               (project_id, escalation_level, trigger_type, trigger_detail,
                escalated_to, escalated_by, status, escalated_at)
           VALUES (%s, %s, %s, %s, %s, %s, 'OPEN', NOW())""",
        [inp["project_id"], inp["escalation_level"], inp["trigger_type"],
         inp["reason"], authority, inp.get("escalated_by", "System")],
    )

    # Also log to audit trail for traceability
    await execute(
        """INSERT INTO npa_audit_log
               (project_id, actor_name, actor_role, action_type, action_details,
                is_agent_action, agent_name, timestamp)
           VALUES (%s, %s, 'SYSTEM', 'ESCALATION', %s, %s, %s, NOW())""",
        [inp["project_id"], inp.get("escalated_by", "System"),
         json.dumps({"level": inp["escalation_level"], "trigger": inp["trigger_type"],
                      "reason": inp["reason"], "authority": authority, "escalation_id": esc_id}),
         1 if inp.get("escalated_by") == "AI Agent" else 0,
         inp.get("escalated_by")],
    )

    return ToolResult(success=True, data={
        "escalation_id": esc_id,
        "project_id": inp["project_id"],
        "escalation_level": inp["escalation_level"],
        "authority": authority,
        "action_required": action,
        "trigger_type": inp["trigger_type"],
        "reason": inp["reason"],
        "status": "OPEN",
    })


# ─── Tool 4: get_escalation_rules ────────────────────────────────

GET_ESCALATION_RULES_SCHEMA = {
    "type": "object",
    "properties": {
        "trigger_type": {"type": "string", "description": "Filter by trigger type"},
    },
}


async def get_escalation_rules_handler(inp: dict) -> ToolResult:
    conditions = []
    params = []

    if inp.get("trigger_type"):
        conditions.append("trigger_type = %s")
        params.append(inp["trigger_type"])

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""

    rules = await query(
        f"""SELECT id, escalation_level, authority_name, trigger_type,
                   trigger_threshold, action_required, auto_escalate
            FROM ref_escalation_rules{where}
            ORDER BY escalation_level""",
        params,
    )

    return ToolResult(success=True, data={
        "rules": rules,
        "total": len(rules),
    })


# ─── Tool 5: save_approval_decision ──────────────────────────────

SAVE_APPROVAL_DECISION_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "approval_type": {"type": "string", "description": "Type of approval. Must be one of: CHECKER, GFM_COO, PAC"},
        "approver_id": {"type": "string", "description": "Approver's user ID"},
        "approver_role": {"type": "string", "description": "Approver's role"},
        "decision": {"type": "string", "description": "Approval decision. Must be one of: APPROVE, REJECT, CONDITIONAL_APPROVE"},
        "comments": {"type": "string", "description": "Approver's comments"},
        "conditions_imposed": {"type": "string", "description": "Any conditions for conditional approval"},
    },
    "required": ["project_id", "approval_type", "decision"],
}


async def save_approval_decision_handler(inp: dict) -> ToolResult:
    row_id = await execute(
        """INSERT INTO npa_approvals
               (project_id, approval_type, approver_id, approver_role,
                decision, decision_date, comments, conditions_imposed, created_at)
           VALUES (%s, %s, %s, %s, %s, NOW(), %s, %s, NOW())""",
        [inp["project_id"], inp["approval_type"],
         inp.get("approver_id"), inp.get("approver_role"),
         inp["decision"], inp.get("comments"),
         inp.get("conditions_imposed")],
    )

    # Update project's PAC approval status if applicable
    if inp["approval_type"] == "PAC":
        status_map = {"APPROVE": "APPROVED", "REJECT": "REJECTED", "CONDITIONAL_APPROVE": "CONDITIONAL"}
        await execute(
            "UPDATE npa_projects SET pac_approval_status = %s, updated_at = NOW() WHERE id = %s",
            [status_map.get(inp["decision"], inp["decision"]), inp["project_id"]],
        )

    return ToolResult(success=True, data={
        "approval_id": row_id,
        "project_id": inp["project_id"],
        "approval_type": inp["approval_type"],
        "decision": inp["decision"],
    })


# ─── Tool 6: add_comment ─────────────────────────────────────────

ADD_COMMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "comment_type": {"type": "string", "description": "Type of comment. Must be one of: APPROVER_QUESTION, MAKER_RESPONSE, AI_ANSWER, SYSTEM_ALERT, CHECKER_NOTE"},
        "comment_text": {"type": "string", "description": "The comment text"},
        "author_name": {"type": "string", "description": "Author's name"},
        "author_role": {"type": "string", "description": "Author's role"},
        "parent_comment_id": {"type": "integer", "description": "Parent comment ID for threading"},
        "generated_by_ai": {"type": "string", "description": "Whether this was AI-generated. Use 'true' or 'false'"},
        "ai_agent": {"type": "string", "description": "Which AI agent generated this"},
        "ai_confidence": {"type": "number", "description": "AI confidence score"},
    },
    "required": ["project_id", "comment_type", "comment_text"],
}


async def add_comment_handler(inp: dict) -> ToolResult:
    # Handle generated_by_ai as string or boolean
    gen_by_ai = inp.get("generated_by_ai", False)
    if isinstance(gen_by_ai, str):
        gen_by_ai = gen_by_ai.lower() in ("true", "1", "yes")

    row_id = await execute(
        """INSERT INTO npa_comments
               (project_id, comment_type, comment_text, author_name, author_role,
                parent_comment_id, generated_by_ai, ai_agent, ai_confidence, created_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
        [inp["project_id"], inp["comment_type"], inp["comment_text"],
         inp.get("author_name"), inp.get("author_role"),
         inp.get("parent_comment_id"),
         gen_by_ai,
         inp.get("ai_agent"), inp.get("ai_confidence")],
    )

    return ToolResult(success=True, data={
        "comment_id": row_id,
        "project_id": inp["project_id"],
        "comment_type": inp["comment_type"],
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_signoff_routing_rules", description="Get sign-off routing rules that determine which departments must approve based on the approval track.", category="governance", input_schema=GET_SIGNOFF_ROUTING_RULES_SCHEMA, handler=get_signoff_routing_rules_handler),
    ToolDefinition(name="check_sla_status", description="Check SLA status for all signoffs on an NPA. Identifies breached and at-risk SLAs.", category="governance", input_schema=CHECK_SLA_STATUS_SCHEMA, handler=check_sla_status_handler),
    ToolDefinition(name="create_escalation", description="Create an escalation for an NPA when SLA breaches, loop-back limits, or risk thresholds are triggered.", category="governance", input_schema=CREATE_ESCALATION_SCHEMA, handler=create_escalation_handler),
    ToolDefinition(name="get_escalation_rules", description="Get the escalation rules matrix showing authority levels, triggers, and required actions.", category="governance", input_schema=GET_ESCALATION_RULES_SCHEMA, handler=get_escalation_rules_handler),
    ToolDefinition(name="save_approval_decision", description="Record a formal approval decision (CHECKER, GFM_COO, PAC) for an NPA project.", category="governance", input_schema=SAVE_APPROVAL_DECISION_SCHEMA, handler=save_approval_decision_handler),
    ToolDefinition(name="add_comment", description="Add a comment or question to an NPA project. Supports threading and AI-generated comments.", category="governance", input_schema=ADD_COMMENT_SCHEMA, handler=add_comment_handler),
])
