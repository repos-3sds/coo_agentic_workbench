"""
DCE Account Opening — MCP Server (SA-7)
=======================================
SA-7 MCP server hosting tools for the Notification Agent.

SA-7 (Node N-6) — Notification & Welcome Kit (FINAL node):
  1. sa7_get_case_context          — Fetch full case state, credit decisions, config spec,
                                     system validations, RM hierarchy, N-5 output
  2. sa7_generate_welcome_kit      — Build welcome kit with CQG login, IDB access,
                                     RM contact, conditions
                                     → INSERT dce_ao_welcome_kit
  3. sa7_send_notification         — Send a single notification via any channel
                                     → INSERT dce_ao_notification_log
  4. sa7_send_welcome_kit_batch    — Atomic batch of 5 notifications (customer, RM, ops, system)
                                     → INSERT dce_ao_notification_log (5 rows)
                                     → UPDATE dce_ao_welcome_kit
  5. sa7_complete_case             — FINAL node completion: checkpoint, case COMPLETED, events
                                     → REPLACE INTO dce_ao_node_checkpoint (N-6, COMPLETE)
                                     → UPDATE dce_ao_case_state (COMPLETED)
                                     → INSERT dce_ao_event_log (NODE_COMPLETED + CASE_COMPLETED)
  6. sa7_get_notification_history  — Read notification log for a case

Transport: StreamableHTTP (MCP protocol)
Port: 8005
Health: GET /health → {"status": "ok"}
MCP: POST /mcp (JSON-RPC 2.0)
"""

import json
import os
import random
import string
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

import pymysql
import pymysql.cursors
from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse
from starlette.routing import Route

# ─── Config ──────────────────────────────────────────────────────────────────
from config import DB_CONFIG, SA7_NODE_ID, SA7_NEXT_NODE, SA7_AGENT_MODEL

# ─── FastMCP app ─────────────────────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8005"))

mcp = FastMCP(
    "DCE-AO-SA7",
    instructions=(
        "DCE Account Opening MCP Server — SA-7 Notification Agent tools. "
        "Handles welcome kit generation, multi-channel notifications "
        "(email, SMS, in-app, workbench, Kafka), and final case completion."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=PORT,
)

# ─── Simulated downstream system data (local dev) ────────────────────────────
# In production these come from real CQG/IDB system APIs and client services DB.

_SIMULATED_CQG_LOGIN = {
    "login_url": "https://cqg-sim.dce.internal/login",
    "platform": "CQG Integrated Client",
    "temp_password": "Welcome2026!",
    "password_change_required": True,
}

_SIMULATED_IDB_ACCESS = {
    "portal_url": "https://idb-portal.dce.internal",
    "access_level": "FULL_TRADING",
    "modules_enabled": ["TRADE_ENTRY", "POSITION_MGMT", "MARGIN_MONITOR", "REPORTS"],
}

_CLIENT_SERVICES_CONTACT = {
    "name": "DCE Client Services",
    "email": "client.services@abs.com",
    "phone": "+65 6123 4567",
    "desk": "Operations Floor 12",
}

# ─── Validation sets ─────────────────────────────────────────────────────────

VALID_NOTIFICATION_TYPES = {
    "TASK_ASSIGNMENT", "SLA_WARNING", "ESCALATION", "WELCOME_KIT",
    "ACCOUNT_LIVE_NOTICE", "RM_NOTIFICATION", "OPS_NOTIFICATION",
    "CREDIT_ALERT", "SYSTEM_EVENT", "COMPLIANCE_ALERT", "GENERAL",
}

VALID_CHANNELS = {"EMAIL", "SMS", "IN_APP_TOAST", "WORKBENCH_BADGE", "KAFKA_EVENT"}


# ─── DB helpers ──────────────────────────────────────────────────────────────

def _get_conn() -> pymysql.connections.Connection:
    return pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _gen_id(prefix: str, length: int = 6) -> str:
    """Generate a random ID like WKIT-000001."""
    digits = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{digits}"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ─── Tool 1: sa7_get_case_context ────────────────────────────────────────────

@mcp.tool()
def sa7_get_case_context(case_id: str) -> dict[str, Any]:
    """
    Fetch the complete case context needed for SA-7 Notification & Welcome Kit (N-6).

    Returns:
    - case_state: core case record (status, current_node, priority, jurisdiction)
    - config_spec: latest static configuration specification (parsed JSON columns)
    - credit_decision: credit team decisions (outcome, limits, CAA, conditions)
    - rm_hierarchy: RM details (name, email, phone)
    - system_validation_summary: total_systems, all_passed, per-system results
    - classification_result: account_type, products_requested, entity_type
    - n5_output: SA-6 node N-5 checkpoint output (config completion summary)

    Validation: case must exist, current_node must be 'N-6', status must be 'ACTIVE'.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Core case state — validate N-6 and ACTIVE
            cursor.execute(
                "SELECT * FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            case_state = cursor.fetchone()
            if not case_state:
                return {"status": "error", "error": f"Case {case_id} not found"}

            if case_state.get("current_node") != "N-6":
                return {
                    "status": "error",
                    "error": (
                        f"Case {case_id} is at node {case_state.get('current_node')}, "
                        f"expected N-6 for SA-7 processing"
                    ),
                }

            if case_state.get("status") != "ACTIVE":
                return {
                    "status": "error",
                    "error": (
                        f"Case {case_id} status is {case_state.get('status')}, "
                        f"expected ACTIVE for SA-7 processing"
                    ),
                }

            # Serialise datetime fields
            for field in ("sla_deadline", "created_at", "updated_at"):
                if isinstance(case_state.get(field), datetime):
                    case_state[field] = case_state[field].strftime("%Y-%m-%d %H:%M:%S")

            # 2. Config spec (latest by case_id)
            cursor.execute(
                "SELECT * FROM dce_ao_config_spec WHERE case_id = %s "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            config_spec = cursor.fetchone() or {}
            for col in ("ubix_config", "sic_config", "cv_config",
                        "authorised_traders", "products_requested",
                        "kb_chunks_used"):
                if config_spec.get(col) and isinstance(config_spec[col], str):
                    try:
                        config_spec[col] = json.loads(config_spec[col])
                    except (json.JSONDecodeError, TypeError):
                        pass
            for key, val in list(config_spec.items()):
                if isinstance(val, datetime):
                    config_spec[key] = val.strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(val, Decimal):
                    config_spec[key] = float(val)

            # 3. Credit decision
            cursor.execute(
                "SELECT * FROM dce_ao_credit_decision WHERE case_id = %s",
                (case_id,),
            )
            credit_decision = cursor.fetchone() or {}
            if credit_decision.get("conditions") and isinstance(credit_decision["conditions"], str):
                try:
                    credit_decision["conditions"] = json.loads(credit_decision["conditions"])
                except (json.JSONDecodeError, TypeError):
                    pass
            for key, val in list(credit_decision.items()):
                if isinstance(val, datetime):
                    credit_decision[key] = val.strftime("%Y-%m-%d %H:%M:%S")
                elif isinstance(val, Decimal):
                    credit_decision[key] = float(val)

            # 4. RM hierarchy
            cursor.execute(
                "SELECT * FROM dce_ao_rm_hierarchy WHERE case_id = %s",
                (case_id,),
            )
            rm_hierarchy = cursor.fetchone() or {}
            for key, val in list(rm_hierarchy.items()):
                if isinstance(val, datetime):
                    rm_hierarchy[key] = val.strftime("%Y-%m-%d %H:%M:%S")

            # 5. System validation (all rows for case_id — summarise)
            cursor.execute(
                "SELECT * FROM dce_ao_system_validation WHERE case_id = %s",
                (case_id,),
            )
            validation_rows = cursor.fetchall() or []
            per_system_results = []
            all_passed = True
            for row in validation_rows:
                for key, val in list(row.items()):
                    if isinstance(val, datetime):
                        row[key] = val.strftime("%Y-%m-%d %H:%M:%S")
                    elif isinstance(val, Decimal):
                        row[key] = float(val)
                for col in ("discrepancies", "configured_values"):
                    if row.get(col) and isinstance(row[col], str):
                        try:
                            row[col] = json.loads(row[col])
                        except (json.JSONDecodeError, TypeError):
                            pass
                per_system_results.append(row)
                if row.get("validation_status") != "PASS":
                    all_passed = False

            system_validation_summary = {
                "total_systems": len(validation_rows),
                "all_passed": all_passed,
                "per_system_results": per_system_results,
            }

            # 6. Classification result (latest by case_id)
            cursor.execute(
                "SELECT * FROM dce_ao_classification_result WHERE case_id = %s "
                "ORDER BY classified_at DESC LIMIT 1",
                (case_id,),
            )
            classification_result = cursor.fetchone() or {}
            if classification_result.get("products_requested"):
                try:
                    if isinstance(classification_result["products_requested"], str):
                        classification_result["products_requested"] = json.loads(
                            classification_result["products_requested"]
                        )
                except (json.JSONDecodeError, TypeError):
                    pass
            for key, val in list(classification_result.items()):
                if isinstance(val, datetime):
                    classification_result[key] = val.strftime("%Y-%m-%d %H:%M:%S")

            # 7. N-5 checkpoint output (SA-6 completion — COMPLETE)
            cursor.execute(
                "SELECT output_json FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-5' AND status = 'COMPLETE' "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            n5_row = cursor.fetchone()
            n5_output = {}
            if n5_row and n5_row.get("output_json"):
                try:
                    n5_output = json.loads(n5_row["output_json"])
                except (json.JSONDecodeError, TypeError):
                    n5_output = {}

        return {
            "status": "success",
            "case_state": case_state,
            "config_spec": config_spec,
            "credit_decision": credit_decision,
            "rm_hierarchy": rm_hierarchy,
            "system_validation_summary": system_validation_summary,
            "classification_result": classification_result,
            "n5_output": n5_output,
        }
    finally:
        conn.close()


# ─── Tool 2: sa7_generate_welcome_kit ────────────────────────────────────────

@mcp.tool()
def sa7_generate_welcome_kit(
    case_id: str,
    entity_name: str,
    entity_type: str,
    jurisdiction: str,
    account_reference: str,
    products_enabled: list[str],
    approved_dce_limit_sgd: float,
    approved_dce_pce_limit_sgd: float,
    confirmed_caa_approach: str,
    rm_name: str,
    rm_email: str,
    rm_phone: str = "",
    conditions: Optional[list[dict[str, Any]]] = None,
) -> dict[str, Any]:
    """
    Generate the welcome kit for a newly opened account.

    Includes:
    - CQG trading platform login details (simulated)
    - IDB portal access details (simulated)
    - RM contact information
    - Account summary (products, limits, conditions)
    - Client services contact

    Writes: dce_ao_welcome_kit (1 row)
    Returns: kit_id, cqg_login, idb_access, rm_contact, client_services_contact
    """
    kit_id = _gen_id("WKIT")
    gen_model = SA7_AGENT_MODEL
    now = _now()

    # Build CQG login details
    cqg_login = {**_SIMULATED_CQG_LOGIN, "username": f"CQG-{case_id}"}

    # Build IDB access details
    idb_access = _SIMULATED_IDB_ACCESS.copy()

    # Build RM contact
    rm_contact = {"name": rm_name, "email": rm_email, "phone": rm_phone}

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dce_ao_welcome_kit
                    (kit_id, case_id, entity_name, entity_type, jurisdiction,
                     account_reference, products_enabled,
                     approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
                     confirmed_caa_approach,
                     cqg_login_details, idb_access_details, rm_contact,
                     client_services_contact, conditions,
                     status, generated_by_model, generated_at)
                VALUES
                    (%s, %s, %s, %s, %s,
                     %s, %s,
                     %s, %s,
                     %s,
                     %s, %s, %s,
                     %s, %s,
                     %s, %s, %s)
                """,
                (
                    kit_id, case_id, entity_name, entity_type, jurisdiction,
                    account_reference, json.dumps(products_enabled),
                    approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
                    confirmed_caa_approach,
                    json.dumps(cqg_login), json.dumps(idb_access), json.dumps(rm_contact),
                    json.dumps(_CLIENT_SERVICES_CONTACT), json.dumps(conditions or []),
                    "GENERATED", gen_model, now,
                ),
            )
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "kit_id": kit_id,
        "case_id": case_id,
        "entity_name": entity_name,
        "cqg_login": cqg_login,
        "idb_access": idb_access,
        "rm_contact": rm_contact,
        "client_services_contact": _CLIENT_SERVICES_CONTACT,
        "products_enabled": products_enabled,
        "approved_dce_limit_sgd": approved_dce_limit_sgd,
        "approved_dce_pce_limit_sgd": approved_dce_pce_limit_sgd,
        "confirmed_caa_approach": confirmed_caa_approach,
        "conditions": conditions or [],
    }


# ─── Tool 3: sa7_send_notification ───────────────────────────────────────────

@mcp.tool()
def sa7_send_notification(
    case_id: str,
    notification_type: str,
    channel: str,
    recipient_id: str,
    recipient_email: str,
    recipient_role: str,
    subject: str,
    body_summary: str,
    template_id: str = "",
) -> dict[str, Any]:
    """
    Send a single notification via the specified channel.

    Supported notification_types: TASK_ASSIGNMENT, SLA_WARNING, ESCALATION,
        WELCOME_KIT, ACCOUNT_LIVE_NOTICE, RM_NOTIFICATION, OPS_NOTIFICATION,
        CREDIT_ALERT, SYSTEM_EVENT, COMPLIANCE_ALERT, GENERAL

    Supported channels: EMAIL, SMS, IN_APP_TOAST, WORKBENCH_BADGE, KAFKA_EVENT

    Writes: dce_ao_notification_log (1 row)
    Returns: notification_id, delivery_status, channel
    """
    if notification_type not in VALID_NOTIFICATION_TYPES:
        return {
            "status": "error",
            "error": (
                f"Invalid notification_type: {notification_type}. "
                f"Must be one of {sorted(VALID_NOTIFICATION_TYPES)}"
            ),
        }

    if channel not in VALID_CHANNELS:
        return {
            "status": "error",
            "error": (
                f"Invalid channel: {channel}. "
                f"Must be one of {sorted(VALID_CHANNELS)}"
            ),
        }

    now = _now()
    delivery_status = "SENT" if channel == "KAFKA_EVENT" else "DELIVERED"

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dce_ao_notification_log
                    (case_id, node_id, notification_type, channel,
                     recipient_id, recipient_email, recipient_role,
                     subject, body_summary, template_id,
                     delivery_status, sent_at)
                VALUES
                    (%s, %s, %s, %s,
                     %s, %s, %s,
                     %s, %s, %s,
                     %s, %s)
                """,
                (
                    case_id, SA7_NODE_ID, notification_type, channel,
                    recipient_id, recipient_email, recipient_role,
                    subject, body_summary, template_id,
                    delivery_status, now,
                ),
            )
            notification_id = cursor.lastrowid
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "notification_id": notification_id,
        "case_id": case_id,
        "notification_type": notification_type,
        "channel": channel,
        "recipient_id": recipient_id,
        "recipient_email": recipient_email,
        "delivery_status": delivery_status,
    }


# ─── Tool 4: sa7_send_welcome_kit_batch ──────────────────────────────────────

@mcp.tool()
def sa7_send_welcome_kit_batch(
    case_id: str,
    kit_id: str,
    entity_name: str,
    rm_id: str,
    rm_name: str,
    rm_email: str,
    customer_email: str,
) -> dict[str, Any]:
    """
    Send the welcome kit batch — atomic set of 5 notifications:

    1. Customer EMAIL       (WELCOME_KIT)         → customer_email
    2. RM IN_APP_TOAST      (ACCOUNT_LIVE_NOTICE)  → rm_id
    3. RM EMAIL             (RM_NOTIFICATION)      → rm_email
    4. Ops WORKBENCH_BADGE  (OPS_NOTIFICATION)     → DESK_SUPPORT
    5. System KAFKA_EVENT   (SYSTEM_EVENT)         → SYSTEM

    All in a single transaction. Updates welcome_kit status to SENT.

    Writes:
    - dce_ao_notification_log (5 rows)
    - UPDATE dce_ao_welcome_kit (status=SENT, notification_ids, sent_at)

    Returns: notification_ids list, batch_size
    """
    now = _now()
    notification_ids = []

    # Define the 5 notifications
    batch = [
        {
            "notification_type": "WELCOME_KIT",
            "channel": "EMAIL",
            "recipient_id": customer_email,
            "recipient_email": customer_email,
            "recipient_role": "CUSTOMER",
            "subject": f"Welcome to DCE — Account {case_id} is Live",
            "body_summary": (
                f"Dear {entity_name}, your DCE trading account {case_id} is now live. "
                f"Your welcome kit with CQG login and IDB access details is attached."
            ),
            "template_id": "TPL-WELCOME-KIT",
        },
        {
            "notification_type": "ACCOUNT_LIVE_NOTICE",
            "channel": "IN_APP_TOAST",
            "recipient_id": rm_id,
            "recipient_email": rm_email,
            "recipient_role": "RM",
            "subject": f"Account Live: {entity_name} ({case_id})",
            "body_summary": (
                f"Account {case_id} for {entity_name} is now live and trading-ready. "
                f"Welcome kit has been sent to the customer."
            ),
            "template_id": "TPL-ACCT-LIVE-TOAST",
        },
        {
            "notification_type": "RM_NOTIFICATION",
            "channel": "EMAIL",
            "recipient_id": rm_id,
            "recipient_email": rm_email,
            "recipient_role": "RM",
            "subject": f"Account Opening Complete: {entity_name} ({case_id})",
            "body_summary": (
                f"The account opening process for {entity_name} (Case {case_id}) "
                f"has been completed. All systems configured and welcome kit dispatched."
            ),
            "template_id": "TPL-RM-COMPLETE",
        },
        {
            "notification_type": "OPS_NOTIFICATION",
            "channel": "WORKBENCH_BADGE",
            "recipient_id": "DESK_SUPPORT",
            "recipient_email": _CLIENT_SERVICES_CONTACT["email"],
            "recipient_role": "OPS",
            "subject": f"New Account Live: {case_id}",
            "body_summary": (
                f"Account {case_id} ({entity_name}) is now live. "
                f"RM: {rm_name}. Welcome kit dispatched."
            ),
            "template_id": "TPL-OPS-NEW-ACCT",
        },
        {
            "notification_type": "SYSTEM_EVENT",
            "channel": "KAFKA_EVENT",
            "recipient_id": "SYSTEM",
            "recipient_email": "",
            "recipient_role": "SYSTEM",
            "subject": f"ACCOUNT_OPENED:{case_id}",
            "body_summary": json.dumps({
                "event": "ACCOUNT_OPENED",
                "case_id": case_id,
                "entity_name": entity_name,
                "kit_id": kit_id,
                "rm_id": rm_id,
                "timestamp": now,
            }),
            "template_id": "TPL-SYS-EVENT",
        },
    ]

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for notif in batch:
                delivery_status = "SENT" if notif["channel"] == "KAFKA_EVENT" else "DELIVERED"
                cursor.execute(
                    """
                    INSERT INTO dce_ao_notification_log
                        (case_id, node_id, notification_type, channel,
                         recipient_id, recipient_email, recipient_role,
                         subject, body_summary, template_id,
                         delivery_status, sent_at)
                    VALUES
                        (%s, %s, %s, %s,
                         %s, %s, %s,
                         %s, %s, %s,
                         %s, %s)
                    """,
                    (
                        case_id, SA7_NODE_ID, notif["notification_type"], notif["channel"],
                        notif["recipient_id"], notif["recipient_email"], notif["recipient_role"],
                        notif["subject"], notif["body_summary"], notif["template_id"],
                        delivery_status, now,
                    ),
                )
                notification_ids.append(cursor.lastrowid)

            # Update welcome kit status
            cursor.execute(
                """
                UPDATE dce_ao_welcome_kit
                SET status = 'SENT',
                    customer_notified = TRUE,
                    rm_notified = TRUE,
                    ops_notified = TRUE,
                    notification_ids = %s,
                    sent_at = %s
                WHERE kit_id = %s
                """,
                (json.dumps(notification_ids), now, kit_id),
            )

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "kit_id": kit_id,
        "case_id": case_id,
        "notification_ids": notification_ids,
        "batch_size": len(notification_ids),
        "customer_notified": True,
        "rm_notified": True,
        "ops_notified": True,
    }


# ─── Tool 5: sa7_complete_case ───────────────────────────────────────────────

@mcp.tool()
def sa7_complete_case(
    case_id: str,
    kit_id: str,
    notifications_sent: int,
) -> dict[str, Any]:
    """
    FINAL node completion — close the entire account opening case.

    Writes:
    1. REPLACE INTO dce_ao_node_checkpoint (N-6, COMPLETE, next_node=NULL)
    2. UPDATE dce_ao_case_state (status=COMPLETED, append N-6 to completed_nodes)
    3. INSERT dce_ao_event_log (NODE_COMPLETED for N-6)
    4. INSERT dce_ao_event_log (CASE_COMPLETED with full summary)

    Returns: case_status, checkpoint_written, events_published, completed_nodes
    """
    now = _now()

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Checkpoint — REPLACE INTO for N-6 COMPLETE
            cursor.execute(
                """
                REPLACE INTO dce_ao_node_checkpoint
                    (case_id, node_id, attempt_number, status,
                     input_snapshot, output_json,
                     started_at, completed_at, duration_seconds,
                     next_node, failure_reason, retry_count, agent_model, token_usage)
                VALUES
                    (%s, %s, %s, %s,
                     %s, %s,
                     %s, %s, NULL,
                     %s, %s, %s, %s, %s)
                """,
                (
                    case_id, SA7_NODE_ID, 1, "COMPLETE",
                    json.dumps({"kit_id": kit_id, "notifications_sent": notifications_sent}),
                    json.dumps({
                        "kit_id": kit_id,
                        "notifications_sent": notifications_sent,
                        "case_status": "DONE",
                    }),
                    now, now,
                    None,  # next_node — SA7_NEXT_NODE is None (FINAL)
                    None,  # failure_reason
                    0, SA7_AGENT_MODEL,
                    json.dumps({"input": 0, "output": 0, "total": 0}),
                ),
            )

            # 2. Read existing completed_nodes, append N-6, update case_state
            cursor.execute(
                "SELECT completed_nodes FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            row = cursor.fetchone()
            completed_nodes = []
            if row and row.get("completed_nodes"):
                try:
                    if isinstance(row["completed_nodes"], str):
                        completed_nodes = json.loads(row["completed_nodes"])
                    elif isinstance(row["completed_nodes"], list):
                        completed_nodes = row["completed_nodes"]
                except (json.JSONDecodeError, TypeError):
                    completed_nodes = []

            if "N-6" not in completed_nodes:
                completed_nodes.append("N-6")

            cursor.execute(
                """
                UPDATE dce_ao_case_state
                SET status = 'DONE',
                    completed_nodes = %s,
                    updated_at = %s
                WHERE case_id = %s
                """,
                (json.dumps(completed_nodes), now, case_id),
            )

            # 3. Event log: NODE_COMPLETED for N-6
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, "NODE_COMPLETED", "sa7_complete_case",
                    json.dumps({
                        "node_id": SA7_NODE_ID,
                        "outcome": "COMPLETE",
                        "next_node": None,
                        "kit_id": kit_id,
                        "notifications_sent": notifications_sent,
                    }),
                    now,
                ),
            )

            # 4. Event log: CASE_COMPLETED with full summary
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, "CASE_COMPLETED", "sa7_complete_case",
                    json.dumps({
                        "kit_id": kit_id,
                        "notifications_sent": notifications_sent,
                        "total_duration_estimate": "pipeline_complete",
                        "all_nodes_completed": completed_nodes,
                        "final_status": "DONE",
                    }),
                    now,
                ),
            )

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "case_id": case_id,
        "case_status": "DONE",
        "checkpoint_written": True,
        "events_published": True,
        "completed_nodes": completed_nodes,
        "kit_id": kit_id,
        "notifications_sent": notifications_sent,
    }


# ─── Tool 6: sa7_get_notification_history ────────────────────────────────────

@mcp.tool()
def sa7_get_notification_history(
    case_id: str,
    notification_type: Optional[str] = None,
) -> dict[str, Any]:
    """
    Read the notification log for a case, optionally filtered by notification_type.

    Returns all notification records ordered by notification_id DESC (most recent first).
    Datetime fields are serialised to strings for JSON safety.

    Returns: case_id, notification_type_filter, total, notifications list
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            if notification_type:
                cursor.execute(
                    """
                    SELECT * FROM dce_ao_notification_log
                    WHERE case_id = %s AND notification_type = %s
                    ORDER BY notification_id DESC
                    """,
                    (case_id, notification_type),
                )
            else:
                cursor.execute(
                    """
                    SELECT * FROM dce_ao_notification_log
                    WHERE case_id = %s
                    ORDER BY notification_id DESC
                    """,
                    (case_id,),
                )

            rows = cursor.fetchall() or []

            # Serialise datetime fields
            for row in rows:
                for key, val in list(row.items()):
                    if isinstance(val, datetime):
                        row[key] = val.strftime("%Y-%m-%d %H:%M:%S")
                    elif isinstance(val, Decimal):
                        row[key] = float(val)

        return {
            "status": "success",
            "case_id": case_id,
            "notification_type_filter": notification_type,
            "total": len(rows),
            "notifications": rows,
        }
    finally:
        conn.close()


# ─── Health endpoint & routing ────────────────────────────────────────────────

async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-sa7-notification", "port": PORT})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    print(f"[SA-7] Starting DCE Notification Agent MCP Server on port {PORT} (transport={transport})")
    mcp.run(transport=transport)
