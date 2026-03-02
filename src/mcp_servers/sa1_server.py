"""
DCE Account Opening — MCP Server (SA-1 + SA-2)
===============================================
Combined MCP server hosting tools for both SA-1 and SA-2.

SA-1 (Node N-0) — Intake & Triage:
  1. sa1_get_intake_context      — Context retrieval (new / retry)
  2. sa1_create_case_full        — Atomic case creation pipeline
  3. sa1_stage_documents_batch   — Batch document staging
  4. sa1_notify_stakeholders     — Multi-channel notification dispatch
  5. sa1_complete_node           — Checkpoint + event log + state update

SA-2 (Node N-1) — Document Collection & Completeness:
  6. sa2_get_document_checklist  — Generate doc checklist per account/entity type
  7. sa2_extract_document_metadata — OCR metadata extraction for staged documents
  8. sa2_validate_document_expiry — Validate expiry, age limits, issuing authority
  9. sa2_flag_document_for_review — Record review decision per document
 10. sa2_send_notification       — Chase notifications to RM / Branch Manager
 11. sa2_save_completeness_assessment — Persist completeness assessment to DB
 12. sa2_save_gta_validation     — Persist GTA version validation to DB
 13. sa2_complete_node           — Checkpoint + event log + state update for N-1
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
    SA2_AGENT_MODEL,
    SA2_NODE_ID,
    SA2_NEXT_NODE,
    SA2_MAX_RETRIES,
)

# ---------------------------------------------------------------------------
# MCP Server initialisation
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "DCE-AO",
    instructions="DCE Account Opening MCP Server — SA-1 (Intake & Triage) and "
                 "SA-2 (Document Collection & Completeness) tools.",
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


# ═══════════════════════════════════════════════════════════════════════════
# SA-2 DOCUMENT COLLECTION & COMPLETENESS TOOLS (Node N-1)
# ═══════════════════════════════════════════════════════════════════════════

# --- SA-2 document checklist rule tables (embedded from KB-1) ---
_MANDATORY_DOCS = {
    "CORP": ["AO_FORM", "CERT_INCORP", "BOARD_RES", "M_AND_A", "UBO_DECL",
             "GTA", "RISK_DISCLOSURE", "MANDATE_LETTER"],
    "FUND": ["AO_FORM", "CERT_INCORP", "BOARD_RES", "FUND_PPM", "FUND_IMA",
             "FUND_ADMIN_CONF", "UBO_DECL", "GTA", "RISK_DISCLOSURE",
             "MANDATE_LETTER"],
    "FI":   ["AO_FORM", "CERT_INCORP", "BOARD_RES", "FIN_STMT", "LEI_CERT",
             "GTA", "RISK_DISCLOSURE", "MANDATE_LETTER"],
    "SPV":  ["AO_FORM", "CERT_INCORP", "M_AND_A", "UBO_DECL", "GTA",
             "RISK_DISCLOSURE", "MANDATE_LETTER"],
    "INDIVIDUAL": ["AO_FORM", "ID_NRIC", "PROOF_ADDR", "GTA",
                   "RISK_DISCLOSURE"],
}
_OPTIONAL_DOCS = {
    "CORP": ["FIN_STMT", "BANK_REF", "LEI_CERT"],
    "FUND": ["FUND_NAV", "BANK_REF"],
    "FI":   ["BANK_REF"],
    "SPV":  ["FIN_STMT"],
    "INDIVIDUAL": ["BANK_REF", "ACCREDITED_INV"],
}
_ACCOUNT_SCHEDULES = {
    "INSTITUTIONAL_FUTURES": ["GTA_SCH_7A"],
    "RETAIL_FUTURES":        ["GTA_SCH_7A", "CKA_FORM"],
    "OTC_DERIVATIVES":       ["GTA_SCH_9", "ISDA_MASTER", "CSA"],
    "COMMODITIES_PHYSICAL":  ["GTA_SCH_10", "WAREHOUSE_AGT", "DELIVERY_INST"],
    "MULTI_PRODUCT":         ["GTA_SCH_7A", "GTA_SCH_9"],
}
_JURISDICTION_EXTRAS = {
    "HKG": {"INDIVIDUAL": ["ID_HKID"]},
    "SGP": {"INDIVIDUAL": ["CKA_FORM"]},
}
_DOC_NAMES = {
    "AO_FORM": "Account Opening Application Form",
    "CERT_INCORP": "Certificate of Incorporation",
    "BOARD_RES": "Board Resolution",
    "M_AND_A": "Memorandum & Articles of Association",
    "UBO_DECL": "UBO Declaration Form",
    "GTA": "General Trading Agreement",
    "RISK_DISCLOSURE": "Risk Disclosure Statement",
    "MANDATE_LETTER": "Mandate Letter / Authority Letter",
    "FUND_PPM": "Private Placement Memorandum",
    "FUND_IMA": "Investment Management Agreement",
    "FUND_ADMIN_CONF": "Fund Administrator Confirmation",
    "FUND_NAV": "NAV Statement",
    "FIN_STMT": "Audited Financial Statements",
    "LEI_CERT": "LEI Certificate",
    "BANK_REF": "Bank Reference Letter",
    "ID_NRIC": "National Identity Card (NRIC)",
    "ID_HKID": "Hong Kong Identity Card",
    "ID_PASSPORT": "Passport",
    "PROOF_ADDR": "Proof of Address",
    "ACCREDITED_INV": "Accredited Investor Declaration",
    "GTA_SCH_7A": "GTA Schedule 7A (Exchange-Traded Derivatives)",
    "GTA_SCH_9": "GTA Schedule 9 (OTC Derivatives)",
    "GTA_SCH_10": "GTA Schedule 10 (Physical Commodities)",
    "ISDA_MASTER": "ISDA Master Agreement",
    "CSA": "Credit Support Annex",
    "CKA_FORM": "Customer Knowledge Assessment",
    "WAREHOUSE_AGT": "Warehouse Agreement",
    "DELIVERY_INST": "Delivery Instructions",
    "COMMODITY_LIC": "Commodity Trading Licence",
}


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 6 — sa2_get_document_checklist
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_get_document_checklist(
    case_id: str,
    account_type: str,
    jurisdiction: str = "SGP",
    entity_type: str = "CORP",
    products_requested: str = "[]",
    kb_context: str = "",
) -> dict[str, Any]:
    """
    Generate document checklist for a case based on account type, entity type,
    jurisdiction, and products requested.

    Creates the checklist header (dce_ao_document_checklist) and line items
    (dce_ao_document_checklist_item). Returns mandatory and optional doc lists.

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    account_type : str — INSTITUTIONAL_FUTURES | RETAIL_FUTURES | OTC_DERIVATIVES |
                         COMMODITIES_PHYSICAL | MULTI_PRODUCT
    jurisdiction : str — SGP | HKG | CHN | OTHER
    entity_type : str — CORP | FUND | FI | SPV | INDIVIDUAL
    products_requested : str — JSON array of product codes
    kb_context : str — KB-2 retrieval context (optional, used for audit)

    Returns
    -------
    dict with mandatory_docs, optional_docs, checklist_id, mandatory_count,
    optional_count
    """
    now = _now()

    # Build mandatory list from entity type + account schedules + jurisdiction
    mandatory = list(_MANDATORY_DOCS.get(entity_type, _MANDATORY_DOCS["CORP"]))
    for sched in _ACCOUNT_SCHEDULES.get(account_type, []):
        if sched not in mandatory:
            mandatory.append(sched)
    # Jurisdiction-specific additions
    jur_extras = _JURISDICTION_EXTRAS.get(jurisdiction, {})
    for extra in jur_extras.get(entity_type, []):
        if extra not in mandatory:
            mandatory.append(extra)

    optional = list(_OPTIONAL_DOCS.get(entity_type, []))

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # Determine attempt number
            cur.execute(
                "SELECT MAX(attempt_number) AS max_att FROM dce_ao_document_checklist "
                "WHERE case_id = %s", (case_id,)
            )
            row = cur.fetchone()
            attempt = (row["max_att"] or 0) + 1

            # Insert checklist header
            cur.execute(
                "INSERT INTO dce_ao_document_checklist "
                "(case_id, attempt_number, account_type, jurisdiction, "
                "entity_type, products_requested, checklist_version, "
                "mandatory_count, optional_count, regulatory_basis, "
                "generated_at, generated_by_model, kb_chunks_used) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id, attempt, account_type, jurisdiction,
                    entity_type, products_requested, "KB2-v3.1",
                    len(mandatory), len(optional),
                    f"MAS/HKMA AML/CFT; Companies Act; DBS Internal Policy",
                    now, SA2_AGENT_MODEL, kb_context[:2000] if kb_context else "{}",
                ),
            )
            checklist_id = cur.lastrowid

            # Insert checklist items
            mandatory_items = []
            for doc_code in mandatory:
                cur.execute(
                    "INSERT INTO dce_ao_document_checklist_item "
                    "(checklist_id, case_id, doc_type_code, doc_type_name, "
                    "requirement, regulatory_ref, accepted_formats, "
                    "match_status) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        checklist_id, case_id, doc_code,
                        _DOC_NAMES.get(doc_code, doc_code),
                        "MANDATORY", "MAS/HKMA/DBS Policy",
                        '["PDF"]', "UNMATCHED",
                    ),
                )
                mandatory_items.append({
                    "item_id": cur.lastrowid,
                    "doc_type_code": doc_code,
                    "doc_type_name": _DOC_NAMES.get(doc_code, doc_code),
                    "requirement": "MANDATORY",
                })

            optional_items = []
            for doc_code in optional:
                cur.execute(
                    "INSERT INTO dce_ao_document_checklist_item "
                    "(checklist_id, case_id, doc_type_code, doc_type_name, "
                    "requirement, regulatory_ref, accepted_formats, "
                    "match_status) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        checklist_id, case_id, doc_code,
                        _DOC_NAMES.get(doc_code, doc_code),
                        "OPTIONAL", "DBS Policy",
                        '["PDF"]', "UNMATCHED",
                    ),
                )
                optional_items.append({
                    "item_id": cur.lastrowid,
                    "doc_type_code": doc_code,
                    "doc_type_name": _DOC_NAMES.get(doc_code, doc_code),
                    "requirement": "OPTIONAL",
                })

        conn.commit()
        return {
            "status": "success",
            "checklist_id": checklist_id,
            "case_id": case_id,
            "attempt_number": attempt,
            "mandatory_docs": mandatory_items,
            "optional_docs": optional_items,
            "mandatory_count": len(mandatory_items),
            "optional_count": len(optional_items),
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "mandatory_docs": [],
                "optional_docs": []}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 7 — sa2_extract_document_metadata
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_extract_document_metadata(
    doc_id: str,
    case_id: str = "",
    storage_url: str = "",
    filename: str = "",
    mime_type: str = "application/pdf",
    expected_doc_type: str = "",
) -> dict[str, Any]:
    """
    Extract OCR metadata from a staged document. If OCR result already exists
    in the database, returns the cached result. Otherwise creates a mock OCR
    entry based on file metadata.

    Parameters
    ----------
    doc_id : str — "DOC-XXXXXX"
    case_id : str — "AO-2026-XXXXXX" (resolved from doc if empty)
    storage_url : str — GridFS or S3 storage URL
    filename : str — original filename
    mime_type : str — MIME type
    expected_doc_type : str — expected doc type code (optional hint)

    Returns
    -------
    dict with detected_doc_type, confidence_score, extracted_text,
    expiry_date, issue_date, issuing_authority, signatory_names
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # Check for existing OCR result
            cur.execute(
                "SELECT ocr_id, detected_doc_type, ocr_confidence, "
                "extracted_text, issuing_authority, issue_date, expiry_date, "
                "signatory_names, document_language, page_count, "
                "has_signatures, has_stamps, flagged_for_review "
                "FROM dce_ao_document_ocr_result WHERE doc_id = %s "
                "ORDER BY ocr_id DESC LIMIT 1",
                (doc_id,),
            )
            existing = cur.fetchone()
            if existing:
                return {
                    "status": "success",
                    "source": "cached",
                    "doc_id": doc_id,
                    "detected_doc_type": existing["detected_doc_type"],
                    "confidence_score": float(existing["ocr_confidence"]),
                    "extracted_text": (existing["extracted_text"] or "")[:2000],
                    "issuing_authority": existing["issuing_authority"] or "",
                    "issue_date": str(existing["issue_date"]) if existing["issue_date"] else None,
                    "expiry_date": str(existing["expiry_date"]) if existing["expiry_date"] else None,
                    "signatory_names": json.loads(existing["signatory_names"] or "[]"),
                    "page_count": existing["page_count"],
                    "has_signatures": bool(existing["has_signatures"]),
                    "flagged_for_review": bool(existing["flagged_for_review"]),
                }

            # Resolve case_id from staged doc if not provided
            if not case_id:
                cur.execute(
                    "SELECT case_id FROM dce_ao_document_staged WHERE doc_id = %s",
                    (doc_id,),
                )
                doc_row = cur.fetchone()
                case_id = doc_row["case_id"] if doc_row else ""

            # Infer doc type from filename
            fname_lower = (filename or "").lower()
            detected = expected_doc_type or "UNKNOWN"
            confidence = 0.85
            if "ao_form" in fname_lower or "account_opening" in fname_lower:
                detected = "AO_FORM"
                confidence = 0.95
            elif "corporate_profile" in fname_lower or "corp_profile" in fname_lower:
                detected = "CORPORATE_PROFILE"
                confidence = 0.90
            elif "gta" in fname_lower:
                detected = "GTA_SIGNED"
                confidence = 0.92
            elif "risk_disclosure" in fname_lower:
                detected = "RISK_DISCLOSURE"
                confidence = 0.94
            elif "passport" in fname_lower:
                detected = "ID_PASSPORT"
                confidence = 0.96
            elif "nric" in fname_lower:
                detected = "ID_NRIC"
                confidence = 0.97
            elif "hkid" in fname_lower:
                detected = "HKID_COPY"
                confidence = 0.97
            elif "employment" in fname_lower or "income" in fname_lower:
                detected = "INCOME_PROOF"
                confidence = 0.88
            elif "electricity" in fname_lower or "utility" in fname_lower or "addr" in fname_lower:
                detected = "ADDR_PROOF"
                confidence = 0.91
            elif "board_res" in fname_lower:
                detected = "BOARD_RES"
                confidence = 0.90
            elif "financial" in fname_lower or "fin_stmt" in fname_lower:
                detected = "FIN_STMT"
                confidence = 0.89

            now = _now()
            cur.execute(
                "INSERT INTO dce_ao_document_ocr_result "
                "(doc_id, case_id, detected_doc_type, ocr_confidence, "
                "extracted_text, issuing_authority, document_language, "
                "page_count, has_signatures, flagged_for_review, "
                "ocr_engine, processing_time_ms, processed_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    doc_id, case_id, detected, confidence,
                    f"[Mock OCR] File: {filename}", "DBS Bank Ltd",
                    "EN", 1, False, confidence < 0.80,
                    "azure-document-intelligence-v4", 1500, now,
                ),
            )
            ocr_id = cur.lastrowid

        conn.commit()
        return {
            "status": "success",
            "source": "new_extraction",
            "doc_id": doc_id,
            "ocr_id": ocr_id,
            "detected_doc_type": detected,
            "confidence_score": confidence,
            "extracted_text": f"[Mock OCR] File: {filename}",
            "issuing_authority": "DBS Bank Ltd",
            "issue_date": None,
            "expiry_date": None,
            "signatory_names": [],
            "page_count": 1,
            "has_signatures": False,
            "flagged_for_review": confidence < 0.80,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "doc_id": doc_id}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 8 — sa2_validate_document_expiry
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_validate_document_expiry(
    doc_id: str,
    doc_type: str = "UNKNOWN",
    expiry_date: str = "",
    issue_date: str = "",
    issuing_authority: str = "",
    max_age_days: int = 0,
) -> dict[str, Any]:
    """
    Validate document expiry, age limits, and issuing authority acceptability.

    Rules:
    - PROOF_ADDR / ADDR_PROOF: must be < 90 days old (from issue_date)
    - INCOME_PROOF: must be < 180 days old
    - FIN_STMT: must be < 18 months (540 days) old
    - Documents with expiry_date: check if expired
    - Certificates (CERT_INCORP, ID_*): no expiry — perpetual validity

    Parameters
    ----------
    doc_id : str — "DOC-XXXXXX"
    doc_type : str — detected document type code
    expiry_date : str — ISO date (YYYY-MM-DD) or empty
    issue_date : str — ISO date (YYYY-MM-DD) or empty
    issuing_authority : str — issuing authority name
    max_age_days : int — override max age in days (0 = use defaults)

    Returns
    -------
    dict with validity_status, days_to_expiry, validity_notes
    """
    today = datetime.date.today()
    validity_status = "VALID"
    days_to_expiry = None
    notes = []

    # Age-limited document types with default max ages
    age_limits = {
        "PROOF_ADDR": 90, "ADDR_PROOF": 90,
        "INCOME_PROOF": 180,
        "FIN_STMT": 540, "MGMT_ACCTS": 365,
        "FUND_NAV": 90, "BANK_REF": 180,
    }

    # Check expiry date
    if expiry_date:
        try:
            exp = datetime.date.fromisoformat(expiry_date)
            days_to_expiry = (exp - today).days
            if days_to_expiry < 0:
                validity_status = "EXPIRED"
                notes.append(f"Document expired {abs(days_to_expiry)} days ago")
            elif days_to_expiry <= 30:
                validity_status = "NEAR_EXPIRY"
                notes.append(f"Expires in {days_to_expiry} days")
            else:
                notes.append(f"Valid, expires in {days_to_expiry} days")
        except (ValueError, TypeError):
            notes.append("Could not parse expiry_date")

    # Check age limit (from issue_date)
    effective_max = max_age_days or age_limits.get(doc_type, 0)
    if effective_max and issue_date:
        try:
            issued = datetime.date.fromisoformat(issue_date)
            age_days = (today - issued).days
            if age_days > effective_max:
                validity_status = "EXPIRED"
                notes.append(
                    f"Document is {age_days} days old, exceeds {effective_max}-day limit"
                )
            else:
                remaining = effective_max - age_days
                days_to_expiry = remaining
                notes.append(
                    f"Document is {age_days} days old, within {effective_max}-day limit "
                    f"({remaining} days remaining)"
                )
        except (ValueError, TypeError):
            notes.append("Could not parse issue_date")

    # Perpetual validity documents
    perpetual_types = {"CERT_INCORP", "ID_NRIC", "ID_HKID", "ID_PASSPORT",
                       "M_AND_A", "BOARD_RES", "UBO_DECL", "GTA",
                       "RISK_DISCLOSURE", "CKA_FORM"}
    if doc_type in perpetual_types and validity_status == "VALID":
        notes.append("Perpetual validity document — no expiry")

    if not notes:
        notes.append("No specific age or expiry constraints for this document type")

    return {
        "status": "success",
        "doc_id": doc_id,
        "doc_type": doc_type,
        "validity_status": validity_status,
        "days_to_expiry": days_to_expiry,
        "validity_notes": "; ".join(notes),
        "flagged_for_review": validity_status in ("EXPIRED", "UNACCEPTABLE_SOURCE"),
    }


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 9 — sa2_flag_document_for_review
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_flag_document_for_review(
    doc_id: str,
    case_id: str = "",
    checklist_item_id: int = 0,
    attempt_number: int = 1,
    decision: str = "REQUIRES_RESUBMISSION",
    rejection_reason_code: str = "",
    rejection_reason_text: str = "",
    resubmission_instructions: str = "",
    regulatory_reference: str = "",
    validity_status: str = "VALID",
    days_to_expiry: int = 0,
    validity_notes: str = "",
) -> dict[str, Any]:
    """
    Record a document review decision (ACCEPTED / REJECTED / REQUIRES_RESUBMISSION).

    Writes to dce_ao_document_review with full audit trail.

    Parameters
    ----------
    doc_id : str — "DOC-XXXXXX"
    case_id : str — "AO-2026-XXXXXX" (resolved from doc if empty)
    decision : str — ACCEPTED | REJECTED | REQUIRES_RESUBMISSION
    rejection_reason_code : str — machine-readable rejection code
    rejection_reason_text : str — human-readable rejection reason
    validity_status : str — VALID | EXPIRED | NEAR_EXPIRY | UNACCEPTABLE_SOURCE

    Returns
    -------
    dict with review_id, flag_status
    """
    now = _now()
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # Resolve case_id if not provided
            if not case_id:
                cur.execute(
                    "SELECT case_id FROM dce_ao_document_staged WHERE doc_id = %s",
                    (doc_id,),
                )
                doc_row = cur.fetchone()
                case_id = doc_row["case_id"] if doc_row else ""

            flag_status = "CLEARED" if decision == "ACCEPTED" else "FLAGGED"

            cur.execute(
                "INSERT INTO dce_ao_document_review "
                "(doc_id, case_id, checklist_item_id, attempt_number, "
                "decision, decision_reason_code, rejection_reason, "
                "resubmission_instructions, regulatory_reference, "
                "validity_status, days_to_expiry, validity_notes, "
                "flagged_at, flag_status, reviewed_at, reviewed_by) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s, %s)",
                (
                    doc_id, case_id,
                    checklist_item_id or None, attempt_number,
                    decision, rejection_reason_code or None,
                    rejection_reason_text or None,
                    resubmission_instructions or None,
                    regulatory_reference or None,
                    validity_status,
                    days_to_expiry if days_to_expiry else None,
                    validity_notes or None,
                    now if flag_status == "FLAGGED" else None,
                    flag_status, now, "AGENT",
                ),
            )
            review_id = cur.lastrowid

        conn.commit()
        return {
            "status": "success",
            "review_id": review_id,
            "doc_id": doc_id,
            "case_id": case_id,
            "decision": decision,
            "flag_status": flag_status,
        }
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "doc_id": doc_id}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 10 — sa2_send_notification
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_send_notification(
    case_id: str,
    notification_type: str = "RM_CHASE",
    recipients: str = '["RM"]',
    message_text: str = "",
    retry_count: int = 0,
    subject: str = "",
) -> dict[str, Any]:
    """
    Send notification to RM / Branch Manager about missing documents or
    case status updates.

    Writes to dce_ao_notification_log (same table used by SA-1).

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    notification_type : str — RM_CHASE | DOC_COMPLETE | ESCALATION
    recipients : str — JSON array of recipient roles e.g. '["RM","RM_MANAGER"]'
    message_text : str — notification body text
    retry_count : int — current retry count (affects recipient list)
    subject : str — notification subject (auto-generated if empty)

    Returns
    -------
    dict with notification_ids, notifications_sent count
    """
    now = _now()
    recipient_list = json.loads(recipients) if recipients else ["RM"]

    if not subject:
        subject = f"[{case_id}] {notification_type.replace('_', ' ').title()}"

    conn = _get_conn()
    try:
        notification_ids = []
        with conn.cursor() as cur:
            # Lookup RM info from case
            cur.execute(
                "SELECT rm_id, rm_email, rm_manager_id, rm_manager_email "
                "FROM dce_ao_rm_hierarchy WHERE case_id = %s LIMIT 1",
                (case_id,),
            )
            rm_row = cur.fetchone() or {}

            for role in recipient_list:
                if role == "RM":
                    recip_id = rm_row.get("rm_id", "")
                    recip_email = rm_row.get("rm_email", "")
                elif role in ("RM_MANAGER", "BRANCH_MANAGER"):
                    recip_id = rm_row.get("rm_manager_id", "")
                    recip_email = rm_row.get("rm_manager_email", "")
                else:
                    recip_id = role
                    recip_email = ""

                cur.execute(
                    "INSERT INTO dce_ao_notification_log "
                    "(case_id, node_id, notification_type, channel, "
                    "recipient_id, recipient_email, recipient_role, "
                    "subject, body_summary, template_id, delivery_status, "
                    "retry_count, sent_at, delivered_at, created_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                    "%s, %s, %s, %s, %s)",
                    (
                        case_id, SA2_NODE_ID, notification_type,
                        "EMAIL", recip_id, recip_email, role,
                        subject, message_text[:500] if message_text else "",
                        "TPL-RM-CHASE", "DELIVERED", 0,
                        now, now, now,
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
# TOOL 11 — sa2_save_completeness_assessment
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_save_completeness_assessment(
    case_id: str,
    checklist_id: int,
    attempt_number: int = 1,
    completeness_flag: bool = False,
    mandatory_docs_complete: bool = False,
    optional_docs_complete: bool = False,
    total_mandatory: int = 0,
    matched_mandatory: int = 0,
    total_optional: int = 0,
    matched_optional: int = 0,
    coverage_pct: float = 0.0,
    missing_mandatory: str = "[]",
    missing_optional: str = "[]",
    rejected_docs: str = "[]",
    rejection_reasons: str = "{}",
    next_node: str = "",
    decision_reasoning: str = "",
    retry_recommended: bool = False,
    sla_pct_consumed: float = 0.0,
    rm_chase_message: str = "",
) -> dict[str, Any]:
    """
    Persist completeness assessment to dce_ao_completeness_assessment.

    Returns
    -------
    dict with assessment_id, status
    """
    now = _now()
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO dce_ao_completeness_assessment "
                "(case_id, checklist_id, attempt_number, completeness_flag, "
                "mandatory_docs_complete, optional_docs_complete, "
                "total_mandatory, matched_mandatory, total_optional, "
                "matched_optional, coverage_pct, missing_mandatory, "
                "missing_optional, rejected_docs, rejection_reasons, "
                "next_node, decision_reasoning, retry_recommended, "
                "sla_pct_consumed, rm_chase_message, "
                "assessor_model, decision_model, assessed_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id, checklist_id, attempt_number,
                    completeness_flag, mandatory_docs_complete,
                    optional_docs_complete, total_mandatory, matched_mandatory,
                    total_optional, matched_optional, coverage_pct,
                    missing_mandatory, missing_optional,
                    rejected_docs, rejection_reasons,
                    next_node, decision_reasoning, retry_recommended,
                    sla_pct_consumed, rm_chase_message or None,
                    SA2_AGENT_MODEL, SA2_AGENT_MODEL, now,
                ),
            )
            assessment_id = cur.lastrowid
        conn.commit()
        return {"status": "success", "assessment_id": assessment_id,
                "case_id": case_id}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 12 — sa2_save_gta_validation
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_save_gta_validation(
    case_id: str,
    attempt_number: int = 1,
    gta_version_submitted: str = "",
    gta_version_current: str = "GTA v4.2",
    gta_version_match: bool = False,
    applicable_schedules: str = "[]",
    schedules_submitted: str = "[]",
    schedules_missing: str = "[]",
    addenda_required: str = "[]",
    addenda_submitted: str = "[]",
    addenda_missing: str = "[]",
    gta_validation_status: str = "MISSING",
    validation_notes: str = "",
    kb_chunks_used: str = "{}",
) -> dict[str, Any]:
    """
    Persist GTA version validation result to dce_ao_gta_validation.

    Returns
    -------
    dict with validation_id, status
    """
    now = _now()
    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO dce_ao_gta_validation "
                "(case_id, attempt_number, gta_version_submitted, "
                "gta_version_current, gta_version_match, "
                "applicable_schedules, schedules_submitted, "
                "schedules_missing, addenda_required, addenda_submitted, "
                "addenda_missing, gta_validation_status, validation_notes, "
                "kb_chunks_used, validated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s, %s)",
                (
                    case_id, attempt_number,
                    gta_version_submitted or None, gta_version_current,
                    gta_version_match, applicable_schedules,
                    schedules_submitted, schedules_missing,
                    addenda_required, addenda_submitted, addenda_missing,
                    gta_validation_status, validation_notes,
                    kb_chunks_used, now,
                ),
            )
            validation_id = cur.lastrowid
        conn.commit()
        return {"status": "success", "validation_id": validation_id,
                "case_id": case_id}
    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 13 — sa2_complete_node
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa2_complete_node(
    case_id: str,
    status: str,
    attempt_number: int = 1,
    input_snapshot: str = "{}",
    output_json: str = "{}",
    started_at: str = "",
    duration_seconds: float = 0.0,
    failure_reason: str = "",
    token_usage: str = "{}",
    completeness_flag: bool = False,
    next_node_override: str = "",
) -> dict[str, Any]:
    """
    Mandatory checkpoint writer for N-1 — finalises SA-2 execution.

    Performs 3 atomic writes:
      1. INSERT dce_ao_node_checkpoint — N-1 completion/failure record
      2. UPDATE dce_ao_case_state — advance current_node, update completed_nodes
      3. INSERT dce_ao_event_log — NODE_COMPLETED or NODE_FAILED event

    Parameters
    ----------
    case_id : str — "AO-2026-XXXXXX"
    status : str — COMPLETE | FAILED | ESCALATED
    attempt_number : int — attempt number (1-3)
    output_json : str — N1Output JSON
    failure_reason : str — if FAILED
    next_node_override : str — override next node routing (HITL_RM, DEAD, etc.)

    Returns
    -------
    dict with checkpoint_id, event_id, case_state_updated, next_node
    """
    now = _now()
    context_hash = _sha256(input_snapshot)

    is_success = status == "COMPLETE"
    next_node = next_node_override or (SA2_NEXT_NODE if is_success else None)
    event_type = "NODE_COMPLETED" if is_success else "NODE_FAILED"

    if is_success:
        new_current_node = next_node
        from_state = f"{SA2_NODE_ID}:IN_PROGRESS"
        to_state = f"{SA2_NODE_ID}:COMPLETE"
    else:
        new_current_node = SA2_NODE_ID
        from_state = f"{SA2_NODE_ID}:IN_PROGRESS"
        to_state = f"{SA2_NODE_ID}:FAILED"

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            # 1. INSERT checkpoint
            cur.execute(
                "INSERT INTO dce_ao_node_checkpoint "
                "(case_id, node_id, attempt_number, status, "
                "input_snapshot, output_json, context_block_hash, "
                "started_at, completed_at, duration_seconds, next_node, "
                "failure_reason, retry_count, agent_model, token_usage) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, "
                "%s, %s, %s, %s)",
                (
                    case_id, SA2_NODE_ID, attempt_number, status,
                    input_snapshot,
                    output_json if is_success else None,
                    context_hash,
                    started_at or now, now, duration_seconds,
                    next_node, failure_reason or None,
                    max(0, attempt_number - 1),
                    SA2_AGENT_MODEL, token_usage,
                ),
            )
            checkpoint_id = cur.lastrowid

            # 2. UPDATE case_state
            completed_json = json.dumps([SA1_NODE_ID, SA2_NODE_ID]) if is_success \
                else json.dumps([SA1_NODE_ID])
            failed_json = "[]" if is_success else json.dumps([{
                "node": SA2_NODE_ID, "reason": failure_reason,
            }])
            cur.execute(
                "UPDATE dce_ao_case_state SET "
                "current_node = %s, completed_nodes = %s, "
                "failed_nodes = %s, event_count = event_count + 1 "
                "WHERE case_id = %s",
                (new_current_node, completed_json, failed_json, case_id),
            )

            # 3. INSERT event
            event_payload = {
                "next_node": next_node,
                "completeness_flag": completeness_flag,
            }
            if not is_success:
                event_payload = {
                    "failure": failure_reason,
                    "retry_count": attempt_number,
                    "escalation": (
                        "ESCALATE_BRANCH_MANAGER"
                        if attempt_number >= SA2_MAX_RETRIES else "retry"
                    ),
                }
            cur.execute(
                "INSERT INTO dce_ao_event_log "
                "(case_id, event_type, from_state, to_state, "
                "event_payload, triggered_by, triggered_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id, event_type, from_state, to_state,
                    json.dumps(event_payload), "AGENT", now,
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
    return JSONResponse({"status": "ok", "service": "dce-ao-sa1-sa2"})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ---------------------------------------------------------------------------
# Server entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    mcp.run(transport=transport)
