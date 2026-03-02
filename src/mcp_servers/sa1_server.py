"""
DCE Account Opening — SA-1 Intake & Triage MCP Server
======================================================
Agent  : SA-1  |  DAG Node : N-0
Purpose: Case Intake & Triage — receives raw submissions, classifies,
         creates case records, stages documents, notifies stakeholders.

Tools (5 consolidated — optimised for ≤10 agent iterations):
  1. sa1_get_intake_context      — Context retrieval (new / retry)
  2. sa1_create_case_full        — Atomic case creation pipeline
  3. sa1_stage_documents_batch   — Batch document staging
  4. sa1_notify_stakeholders     — Multi-channel notification dispatch
  5. sa1_complete_node           — Checkpoint + event log + state update
"""

import json
import hashlib
import datetime
import os
from typing import Any

import pymysql
from mcp.server.fastmcp import FastMCP

from config import (
    DB_CONFIG,
    CASE_ID_PREFIX,
    CASE_ID_YEAR,
    SA1_AGENT_MODEL,
    SA1_PRIORITY_MODEL,
    SA1_NODE_ID,
    SA1_NEXT_NODE,
    SA1_MAX_RETRIES,
)

# ---------------------------------------------------------------------------
# MCP Server initialisation
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "DCE-AO-SA1",
    instructions="SA-1 Intake & Triage Agent — Case creation, classification, "
                 "document staging, and stakeholder notification tools.",
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8000")),
)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def _get_conn():
    """Return a fresh PyMySQL connection using DB_CONFIG."""
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)


def _generate_case_id(cursor) -> str:
    """Generate next sequential case_id: AO-2026-XXXXXX."""
    cursor.execute(
        "SELECT case_id FROM dce_ao_case_state "
        "WHERE case_id LIKE %s ORDER BY case_id DESC LIMIT 1",
        (f"{CASE_ID_PREFIX}-{CASE_ID_YEAR}-%",),
    )
    row = cursor.fetchone()
    if row:
        seq = int(row["case_id"].split("-")[-1]) + 1
    else:
        seq = 1
    return f"{CASE_ID_PREFIX}-{CASE_ID_YEAR}-{seq:06d}"


def _sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 1 — sa1_get_intake_context
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa1_get_intake_context(
    case_id: str = "",
    submission_source: str = "EMAIL",
) -> dict[str, Any]:
    """
    Retrieve full intake context for SA-1 processing.

    For NEW cases (case_id empty): returns an empty AO Case State template
    with field names, expected ENUM values, and the SA-1 workflow spec so
    the LLM knows exactly what to produce.

    For RETRY cases (case_id provided): returns the existing case_state,
    prior node_checkpoint(s), event_log entries, classification result,
    and failure context — everything needed to resume without extra queries.

    Parameters
    ----------
    case_id : str
        Leave empty for new submissions. Provide "AO-2026-XXXXXX" on retry.
    submission_source : str
        One of: EMAIL, PORTAL, API.

    Returns
    -------
    dict with keys:
        is_retry, case_state, prior_checkpoints, prior_events,
        prior_classification, workflow_spec, enum_reference
    """
    workflow_spec = {
        "agent_id": "SA-1",
        "node_id": SA1_NODE_ID,
        "next_node": SA1_NEXT_NODE,
        "max_retries": SA1_MAX_RETRIES,
        "primary_model": SA1_AGENT_MODEL,
        "secondary_model": SA1_PRIORITY_MODEL,
        "skills": [
            "SKL-01 Email Ingestion",
            "SKL-02 Account Type Classifier",
            "SKL-03 Priority Assessor",
            "SKL-04 Case Record Creator",
            "SKL-05 RM & Manager Linker",
            "SKL-06 Document Pre-Stager",
            "SKL-07 Intake Notifier",
            "SKL-08 Portal Submission Handler",
        ],
        "sla_window_hours": 2,
        "output_schema": "N0Output",
    }

    enum_reference = {
        "account_type": [
            "INSTITUTIONAL_FUTURES",
            "RETAIL_FUTURES",
            "OTC_DERIVATIVES",
            "COMMODITIES_PHYSICAL",
            "MULTI_PRODUCT",
        ],
        "priority": ["URGENT", "STANDARD", "DEFERRED"],
        "client_entity_type": ["CORP", "FUND", "FI", "SPV", "INDIVIDUAL"],
        "jurisdiction": ["SGP", "HKG", "CHN", "OTHER"],
        "submission_source": ["EMAIL", "PORTAL", "API"],
        "case_status": ["ACTIVE", "HITL_PENDING", "ESCALATED", "DONE", "DEAD"],
        "checkpoint_status": [
            "IN_PROGRESS", "COMPLETE", "FAILED", "ESCALATED", "HITL_PENDING",
        ],
    }

    # --- New case: return empty template ---
    if not case_id:
        return {
            "is_retry": False,
            "case_state": None,
            "prior_checkpoints": [],
            "prior_events": [],
            "prior_classification": None,
            "submission_source": submission_source,
            "workflow_spec": workflow_spec,
            "enum_reference": enum_reference,
        }

    # --- Retry case: fetch full prior context ---
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # 1. Case state
            cur.execute(
                "SELECT case_id, status, current_node, completed_nodes, "
                "failed_nodes, retry_counts, case_type, priority, rm_id, "
                "client_name, jurisdiction, sla_deadline, created_at, "
                "updated_at, hitl_queue, event_count "
                "FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            case_state = cur.fetchone()

            # 2. All N-0 checkpoints (shows prior attempts + failures)
            cur.execute(
                "SELECT checkpoint_id, node_id, attempt_number, status, "
                "input_snapshot, output_json, failure_reason, retry_count, "
                "agent_model, started_at, completed_at, duration_seconds "
                "FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = %s "
                "ORDER BY attempt_number",
                (case_id, SA1_NODE_ID),
            )
            checkpoints = cur.fetchall()

            # 3. All events for this case
            cur.execute(
                "SELECT event_id, event_type, from_state, to_state, "
                "event_payload, triggered_by, triggered_at "
                "FROM dce_ao_event_log "
                "WHERE case_id = %s ORDER BY triggered_at",
                (case_id,),
            )
            events = cur.fetchall()

            # 4. Classification result (if exists from prior attempt)
            cur.execute(
                "SELECT classification_id, account_type, "
                "account_type_confidence, account_type_reasoning, "
                "client_name, client_entity_type, jurisdiction, "
                "products_requested, priority, priority_reason, "
                "sla_deadline, flagged_for_review "
                "FROM dce_ao_classification_result WHERE case_id = %s",
                (case_id,),
            )
            classification = cur.fetchone()

        return {
            "is_retry": True,
            "case_state": case_state,
            "prior_checkpoints": checkpoints,
            "prior_events": events,
            "prior_classification": classification,
            "submission_source": submission_source,
            "workflow_spec": workflow_spec,
            "enum_reference": enum_reference,
        }
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 2 — sa1_create_case_full
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa1_create_case_full(
    # --- Submission fields ---
    submission_source: str,
    received_at: str,
    rm_employee_id: str,
    # Email-specific (optional)
    email_message_id: str = "",
    sender_email: str = "",
    email_subject: str = "",
    email_body_text: str = "",
    # Portal-specific (optional)
    portal_form_id: str = "",
    portal_form_data: str = "{}",
    # Common
    attachments_count: int = 0,
    # --- Classification output (from LLM) ---
    account_type: str = "INSTITUTIONAL_FUTURES",
    account_type_confidence: float = 0.90,
    account_type_reasoning: str = "",
    client_name: str = "",
    client_entity_type: str = "CORP",
    jurisdiction: str = "SGP",
    products_requested: str = "[]",
    # --- Priority output (from LLM) ---
    priority: str = "STANDARD",
    priority_reason: str = "",
    sla_deadline: str = "",
    # --- Classification metadata ---
    classifier_model: str = SA1_AGENT_MODEL,
    priority_model: str = SA1_PRIORITY_MODEL,
    kb_chunks_used: str = "{}",
    flagged_for_review: bool = False,
    # --- RM hierarchy (resolved by agent) ---
    rm_name: str = "",
    rm_email: str = "",
    rm_branch: str = "",
    rm_desk: str = "",
    rm_manager_id: str = "",
    rm_manager_name: str = "",
    rm_manager_email: str = "",
    rm_resolution_source: str = "HR_SYSTEM",
) -> dict[str, Any]:
    """
    Atomic case creation pipeline — executes 4 writes in a single transaction:

      1. INSERT dce_ao_submission_raw       — stores the raw submission
      2. INSERT dce_ao_case_state           — creates master case record
      3. INSERT dce_ao_classification_result — stores LLM classification + priority
      4. INSERT dce_ao_rm_hierarchy          — links RM + manager to case

    Also writes 3 events to dce_ao_event_log:
      - SUBMISSION_RECEIVED
      - CASE_CLASSIFIED
      - CASE_CREATED

    All writes are wrapped in a transaction — full rollback on any failure.

    Parameters
    ----------
    submission_source : str — EMAIL | PORTAL | API
    received_at : str — ISO datetime of submission receipt
    rm_employee_id : str — RM employee ID (e.g. "RM-0042")
    account_type : str — classified account type
    account_type_confidence : float — confidence 0.0–1.0
    client_name : str — client entity name
    client_entity_type : str — CORP | FUND | FI | SPV | INDIVIDUAL
    jurisdiction : str — SGP | HKG | CHN | OTHER
    products_requested : str — JSON array e.g. '["FUTURES","OPTIONS"]'
    priority : str — URGENT | STANDARD | DEFERRED
    sla_deadline : str — ISO datetime of SLA deadline
    rm_name, rm_email, rm_branch, rm_desk : str — RM details
    rm_manager_id, rm_manager_name, rm_manager_email : str — manager details

    Returns
    -------
    dict with keys: case_id, submission_id, classification_id,
                    assignment_id, events_written, full_case_record
    """
    now = _now()
    raw_hash = _sha256(
        f"{submission_source}:{email_message_id or portal_form_id}:"
        f"{rm_employee_id}:{received_at}"
    )

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # --- Generate case_id ---
            case_id = _generate_case_id(cur)

            # ── 1. INSERT dce_ao_submission_raw ──
            cur.execute(
                "INSERT INTO dce_ao_submission_raw "
                "(case_id, submission_source, email_message_id, sender_email, "
                "email_subject, email_body_text, portal_form_id, "
                "portal_form_data, rm_employee_id, received_at, processed_at, "
                "processing_status, raw_payload_hash, attachments_count, "
                "created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s)",
                (
                    case_id,
                    submission_source,
                    email_message_id or None,
                    sender_email or None,
                    email_subject or None,
                    email_body_text or None,
                    portal_form_id or None,
                    portal_form_data if portal_form_id else None,
                    rm_employee_id,
                    received_at,
                    now,
                    "PROCESSED",
                    raw_hash,
                    attachments_count,
                    now,
                ),
            )
            submission_id = cur.lastrowid

            # ── 2. INSERT dce_ao_case_state ──
            cur.execute(
                "INSERT INTO dce_ao_case_state "
                "(case_id, status, current_node, completed_nodes, "
                "failed_nodes, retry_counts, case_type, priority, rm_id, "
                "client_name, jurisdiction, sla_deadline, created_at, "
                "hitl_queue, event_count) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s)",
                (
                    case_id,
                    "ACTIVE",
                    SA1_NODE_ID,          # current_node = N-0
                    "[]",                  # completed_nodes
                    "[]",                  # failed_nodes
                    "{}",                  # retry_counts
                    account_type,          # case_type stores account_type value
                    priority,
                    rm_employee_id,
                    client_name,
                    jurisdiction,
                    sla_deadline or None,
                    received_at,
                    None,                  # hitl_queue
                    0,                     # event_count (updated below)
                ),
            )

            # ── 3. INSERT dce_ao_classification_result ──
            cur.execute(
                "INSERT INTO dce_ao_classification_result "
                "(case_id, submission_id, account_type, "
                "account_type_confidence, account_type_reasoning, "
                "client_name, client_entity_type, jurisdiction, "
                "products_requested, priority, priority_reason, "
                "sla_deadline, classifier_model, priority_model, "
                "kb_chunks_used, classified_at, flagged_for_review) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s, %s, %s)",
                (
                    case_id,
                    submission_id,
                    account_type,
                    account_type_confidence,
                    account_type_reasoning,
                    client_name,
                    client_entity_type,
                    jurisdiction,
                    products_requested,
                    priority,
                    priority_reason,
                    sla_deadline or None,
                    classifier_model,
                    priority_model,
                    kb_chunks_used,
                    now,
                    flagged_for_review,
                ),
            )
            classification_id = cur.lastrowid

            # ── 4. INSERT dce_ao_rm_hierarchy ──
            cur.execute(
                "INSERT INTO dce_ao_rm_hierarchy "
                "(case_id, rm_id, rm_name, rm_email, rm_branch, rm_desk, "
                "rm_manager_id, rm_manager_name, rm_manager_email, "
                "resolution_source, resolved_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id,
                    rm_employee_id,
                    rm_name,
                    rm_email,
                    rm_branch or None,
                    rm_desk or None,
                    rm_manager_id,
                    rm_manager_name,
                    rm_manager_email,
                    rm_resolution_source,
                    now,
                ),
            )
            assignment_id = cur.lastrowid

            # ── 5. Event log entries (3 events) ──
            events = [
                (
                    case_id, "SUBMISSION_RECEIVED", None, f"{SA1_NODE_ID}:IN_PROGRESS",
                    json.dumps({
                        "source": submission_source,
                        "sender": sender_email or rm_employee_id,
                        "attachments_count": attachments_count,
                    }),
                    "AGENT", received_at,
                ),
                (
                    case_id, "CASE_CLASSIFIED",
                    f"{SA1_NODE_ID}:IN_PROGRESS", f"{SA1_NODE_ID}:IN_PROGRESS",
                    json.dumps({
                        "account_type": account_type,
                        "confidence": account_type_confidence,
                        "priority": priority,
                    }),
                    "AGENT", now,
                ),
                (
                    case_id, "CASE_CREATED",
                    f"{SA1_NODE_ID}:IN_PROGRESS", f"{SA1_NODE_ID}:IN_PROGRESS",
                    json.dumps({
                        "case_id": case_id,
                        "rm_id": rm_employee_id,
                        "rm_manager_id": rm_manager_id,
                    }),
                    "AGENT", now,
                ),
            ]
            cur.executemany(
                "INSERT INTO dce_ao_event_log "
                "(case_id, event_type, from_state, to_state, event_payload, "
                "triggered_by, triggered_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                events,
            )

            # Update event_count
            cur.execute(
                "UPDATE dce_ao_case_state SET event_count = %s "
                "WHERE case_id = %s",
                (len(events), case_id),
            )

        conn.commit()

        return {
            "status": "success",
            "case_id": case_id,
            "submission_id": submission_id,
            "classification_id": classification_id,
            "assignment_id": assignment_id,
            "events_written": len(events),
            "full_case_record": {
                "case_id": case_id,
                "account_type": account_type,
                "priority": priority,
                "priority_reason": priority_reason,
                "client_name": client_name,
                "client_entity_type": client_entity_type,
                "jurisdiction": jurisdiction,
                "rm_id": rm_employee_id,
                "rm_name": rm_name,
                "rm_manager_id": rm_manager_id,
                "rm_manager_name": rm_manager_name,
                "products_requested": json.loads(products_requested),
                "sla_deadline": sla_deadline,
                "confidence": account_type_confidence,
                "flagged_for_review": flagged_for_review,
                "current_node": SA1_NODE_ID,
            },
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "case_id": None}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 3 — sa1_stage_documents_batch
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa1_stage_documents_batch(
    case_id: str,
    submission_id: int,
    documents_json: str,
) -> dict[str, Any]:
    """
    Batch-stage all attachments for a case in a single transaction.

    Writes one row per document to dce_ao_document_staged.
    Returns all generated doc_ids for downstream SA-2 consumption.

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    submission_id : int — FK to dce_ao_submission_raw.submission_id
    documents_json : str — JSON array of document objects:
        [
          {
            "filename": "AO_Form_Signed.pdf",
            "mime_type": "application/pdf",
            "file_size_bytes": 245760,
            "storage_url": "gridfs://ao-documents/...",
            "source": "EMAIL_ATTACHMENT",
            "checksum_sha256": "abc123..."
          }
        ]

    Returns
    -------
    dict with keys: status, case_id, documents_staged (list of doc_ids),
                    total_staged, total_bytes
    """
    docs = json.loads(documents_json)
    if not docs:
        return {
            "status": "success",
            "case_id": case_id,
            "documents_staged": [],
            "total_staged": 0,
            "total_bytes": 0,
        }

    now = _now()
    conn = _get_conn()
    try:
        staged = []
        total_bytes = 0
        with conn.cursor() as cur:
            # Get next doc_id sequence
            cur.execute(
                "SELECT doc_id FROM dce_ao_document_staged "
                "ORDER BY doc_id DESC LIMIT 1"
            )
            row = cur.fetchone()
            if row:
                seq = int(row["doc_id"].replace("DOC-", "")) + 1
            else:
                seq = 1

            for doc in docs:
                doc_id = f"DOC-{seq:06d}"
                file_size = doc.get("file_size_bytes", 0)
                total_bytes += file_size

                cur.execute(
                    "INSERT INTO dce_ao_document_staged "
                    "(doc_id, case_id, submission_id, filename, mime_type, "
                    "file_size_bytes, storage_url, storage_bucket, source, "
                    "upload_status, checksum_sha256, uploaded_at, created_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                    "%s, %s)",
                    (
                        doc_id,
                        case_id,
                        submission_id,
                        doc["filename"],
                        doc["mime_type"],
                        file_size,
                        doc.get("storage_url", ""),
                        doc.get("storage_bucket", "ao-documents"),
                        doc.get("source", "EMAIL_ATTACHMENT"),
                        "UPLOADED",
                        doc.get("checksum_sha256", _sha256(doc["filename"])),
                        now,
                        now,
                    ),
                )
                staged.append({
                    "doc_id": doc_id,
                    "filename": doc["filename"],
                    "mime_type": doc["mime_type"],
                    "file_size_bytes": file_size,
                })
                seq += 1

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "documents_staged": staged,
            "total_staged": len(staged),
            "total_bytes": total_bytes,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "documents_staged": []}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 4 — sa1_notify_stakeholders
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa1_notify_stakeholders(
    case_id: str,
    notifications_json: str,
) -> dict[str, Any]:
    """
    Dispatch all SA-1 intake notifications in a single batch transaction.

    Writes one row per notification to dce_ao_notification_log.
    Typical SA-1 notifications per case: RM email, RM Manager email,
    RM in-app toast, Kafka CASE_CREATED event = 4 rows.

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    notifications_json : str — JSON array of notification objects:
        [
          {
            "notification_type": "CASE_CREATED",
            "channel": "EMAIL",
            "recipient_id": "RM-0042",
            "recipient_email": "rm.john@dbs.com",
            "recipient_role": "RM",
            "subject": "[AO-2026-000101] Case Created",
            "body_summary": "Your DCE Account Opening case...",
            "template_id": "TPL-INTAKE-01"
          }
        ]
        Valid channels: EMAIL, SMS, IN_APP_TOAST, WORKBENCH_BADGE, KAFKA_EVENT

    Returns
    -------
    dict with keys: status, case_id, notifications_sent (count),
                    notification_ids (list)
    """
    notifications = json.loads(notifications_json)
    if not notifications:
        return {
            "status": "success",
            "case_id": case_id,
            "notifications_sent": 0,
            "notification_ids": [],
        }

    now = _now()
    conn = _get_conn()
    try:
        notification_ids = []
        with conn.cursor() as cur:
            for notif in notifications:
                channel = notif["channel"]
                # Kafka events are SENT (no delivery confirmation);
                # others are DELIVERED for mock purposes
                delivery_status = "SENT" if channel == "KAFKA_EVENT" else "DELIVERED"
                delivered_at = (
                    None if channel == "KAFKA_EVENT" else now
                )

                cur.execute(
                    "INSERT INTO dce_ao_notification_log "
                    "(case_id, node_id, notification_type, channel, "
                    "recipient_id, recipient_email, recipient_role, "
                    "subject, body_summary, template_id, delivery_status, "
                    "retry_count, sent_at, delivered_at, created_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                    "%s, %s, %s, %s, %s)",
                    (
                        case_id,
                        SA1_NODE_ID,
                        notif["notification_type"],
                        channel,
                        notif.get("recipient_id"),
                        notif.get("recipient_email"),
                        notif.get("recipient_role"),
                        notif.get("subject", ""),
                        notif.get("body_summary", ""),
                        notif.get("template_id"),
                        delivery_status,
                        0,
                        now,
                        delivered_at,
                        now,
                    ),
                )
                notification_ids.append(cur.lastrowid)

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "notifications_sent": len(notification_ids),
            "notification_ids": notification_ids,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "notifications_sent": 0}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 5 — sa1_complete_node
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa1_complete_node(
    case_id: str,
    status: str,
    attempt_number: int = 1,
    input_snapshot: str = "{}",
    output_json: str = "{}",
    started_at: str = "",
    duration_seconds: float = 0.0,
    failure_reason: str = "",
    token_usage: str = "{}",
    documents_staged_count: int = 0,
    notifications_sent: bool = True,
) -> dict[str, Any]:
    """
    Mandatory checkpoint writer — finalises N-0 execution.

    Performs 3 atomic writes in a single transaction:
      1. INSERT dce_ao_node_checkpoint — N-0 completion/failure record
      2. UPDATE dce_ao_case_state — advance current_node, update completed_nodes
      3. INSERT dce_ao_event_log — NODE_COMPLETED or NODE_FAILED event

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    status : str — COMPLETE | FAILED | ESCALATED
    attempt_number : int — which attempt this is (1, 2, or 3)
    input_snapshot : str — JSON of the original input to N-0
    output_json : str — JSON of the N0Output (Pydantic-validated)
    started_at : str — ISO datetime when N-0 processing began
    duration_seconds : float — total processing time
    failure_reason : str — if FAILED, the reason
    token_usage : str — JSON: {"input": N, "output": N, "total": N}
    documents_staged_count : int — how many docs were staged
    notifications_sent : bool — whether notifications were dispatched

    Returns
    -------
    dict with keys: status, checkpoint_id, event_id, case_state_updated,
                    next_node
    """
    now = _now()
    context_hash = _sha256(input_snapshot)

    is_success = status == "COMPLETE"
    next_node = SA1_NEXT_NODE if is_success else None
    event_type = "NODE_COMPLETED" if is_success else "NODE_FAILED"

    # State transitions
    if is_success:
        new_current_node = SA1_NEXT_NODE     # Advance to N-1
        new_completed_nodes = f'["{SA1_NODE_ID}"]'
        new_failed_nodes = "[]"
        from_state = f"{SA1_NODE_ID}:IN_PROGRESS"
        to_state = f"{SA1_NODE_ID}:COMPLETE"
    else:
        new_current_node = SA1_NODE_ID       # Stay at N-0
        new_completed_nodes = "[]"
        new_failed_nodes = json.dumps([{
            "node": SA1_NODE_ID,
            "reason": failure_reason,
        }])
        from_state = f"{SA1_NODE_ID}:IN_PROGRESS"
        to_state = f"{SA1_NODE_ID}:FAILED"

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # ── 1. INSERT dce_ao_node_checkpoint ──
            cur.execute(
                "INSERT INTO dce_ao_node_checkpoint "
                "(case_id, node_id, attempt_number, status, "
                "input_snapshot, output_json, context_block_hash, "
                "started_at, completed_at, duration_seconds, next_node, "
                "failure_reason, retry_count, agent_model, token_usage) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s)",
                (
                    case_id,
                    SA1_NODE_ID,
                    attempt_number,
                    status,
                    input_snapshot,
                    output_json if is_success else None,
                    context_hash,
                    started_at or now,
                    now,
                    duration_seconds,
                    next_node,
                    failure_reason or None,
                    max(0, attempt_number - 1),
                    SA1_AGENT_MODEL,
                    token_usage,
                ),
            )
            checkpoint_id = cur.lastrowid

            # ── 2. UPDATE dce_ao_case_state ──
            cur.execute(
                "UPDATE dce_ao_case_state SET "
                "current_node = %s, "
                "completed_nodes = %s, "
                "failed_nodes = %s, "
                "retry_counts = CASE "
                "  WHEN %s > 1 THEN JSON_SET(COALESCE(retry_counts, '{}'), "
                "    %s, %s) "
                "  ELSE retry_counts END, "
                "event_count = event_count + 1 "
                "WHERE case_id = %s",
                (
                    new_current_node,
                    new_completed_nodes,
                    new_failed_nodes,
                    attempt_number,
                    f"$.{SA1_NODE_ID}",
                    attempt_number - 1,
                    case_id,
                ),
            )

            # ── 3. INSERT dce_ao_event_log ──
            event_payload = {
                "next_node": next_node,
                "documents_staged": documents_staged_count,
                "notification_sent": notifications_sent,
            }
            if not is_success:
                event_payload = {
                    "failure": failure_reason,
                    "retry_count": attempt_number,
                    "escalation": (
                        "ESCALATE_RM_MANAGER"
                        if attempt_number >= SA1_MAX_RETRIES
                        else "retry"
                    ),
                }

            cur.execute(
                "INSERT INTO dce_ao_event_log "
                "(case_id, event_type, from_state, to_state, "
                "event_payload, triggered_by, triggered_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id,
                    event_type,
                    from_state,
                    to_state,
                    json.dumps(event_payload),
                    "AGENT",
                    now,
                ),
            )
            event_id = cur.lastrowid

        conn.commit()
        return {
            "status": "success",
            "checkpoint_id": checkpoint_id,
            "event_id": event_id,
            "case_state_updated": True,
            "next_node": next_node,
            "node_status": status,
            "case_id": case_id,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "checkpoint_id": None}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Health check route (added to MCP app's Starlette routes)
# ---------------------------------------------------------------------------
from starlette.responses import JSONResponse
from starlette.routing import Route


async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-ao-sa1"})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ---------------------------------------------------------------------------
# Server entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    mcp.run(transport=transport)
