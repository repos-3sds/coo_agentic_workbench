"""
DCE Account Opening — MCP Server (SA-3)
=======================================
SA-3 MCP server hosting tools for the Signature Verification Agent.

SA-3 (Node N-2) — Signature Verification (Two-Phase HITL Execution):
  1. sa3_get_case_context             — Context retrieval (Phase 1 trigger / Phase 2 resume)
  2. sa3_run_signature_analysis_batch — Batch sig extraction + authority check + comparison
                                        → INSERT dce_ao_signature_verification
  3. sa3_park_for_hitl                — Atomic: HITL task + HITL_PENDING checkpoint + event log
  4. sa3_store_approved_specimens     — Batch store approved specimens
                                        → INSERT dce_ao_signature_specimen
  5. sa3_complete_node                — Checkpoint + event log + state update
                                        (SIGNATURE_APPROVED / SIGNATURE_REJECTED /
                                         HITL_PENDING / ESCALATE_COMPLIANCE)

Design Notes:
  • Dify iteration cap: 8 turns across two phases (4 Pre-HITL + 4 Post-HITL).
  • T-08 (signature_extractor), T-09 (signature_comparator), T-10 (signatory_authority_checker),
    T-11 (signature_store) from global registry are consolidated into 2 batch tools here.
  • Confidence tiers per KB-5: HIGH ≥ 85%, MEDIUM 60–84%, LOW < 60%.
  • dce_ao_signature_verification rows are IMMUTABLE — no updates post-write (audit requirement).
  • dce_ao_hitl_review_task is shared across SA-3, SA-4, SA-5, SA-6 (different assigned_persona).
"""

import json
import hashlib
import datetime
import decimal
import os
from typing import Any

import pymysql
from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse
from starlette.routing import Route

from config import (
    DB_CONFIG,
    SA3_AGENT_MODEL,
    SA3_NODE_ID,
    SA3_NEXT_NODE,
    SA3_MAX_RETRIES,
)

# ---------------------------------------------------------------------------
# MCP Server initialisation
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "DCE-AO-SA3",
    instructions=(
        "DCE Account Opening MCP Server — SA-3 Signature Verification Agent tools. "
        "Handles two-phase execution: Phase 1 (automated extraction + analysis + park) "
        "and Phase 2 (HITL decision processing + specimen storage + checkpoint)."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8001")),
)


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------
def _get_conn():
    """Return a fresh PyMySQL connection using DB_CONFIG."""
    return pymysql.connect(**DB_CONFIG, cursorclass=pymysql.cursors.DictCursor)


def _sha256(payload: str) -> str:
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _now() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _serialize(obj):
    """Recursively serialize datetimes and Decimals for JSON-safe return."""
    if obj is None:
        return None
    if isinstance(obj, list):
        for row in obj:
            if isinstance(row, dict):
                for k, v in row.items():
                    if isinstance(v, (datetime.datetime, datetime.date)):
                        row[k] = v.isoformat()
                    elif isinstance(v, decimal.Decimal):
                        row[k] = float(v)
        return obj
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, (datetime.datetime, datetime.date)):
                obj[k] = v.isoformat()
            elif isinstance(v, decimal.Decimal):
                obj[k] = float(v)
    return obj


def _next_hitl_id(cursor) -> str:
    """Generate next sequential HITL task ID: HITL-XXXXXX."""
    cursor.execute(
        "SELECT task_id FROM dce_ao_hitl_review_task "
        "ORDER BY task_id DESC LIMIT 1"
    )
    row = cursor.fetchone()
    seq = int(row["task_id"].replace("HITL-", "")) + 1 if row else 1
    return f"HITL-{seq:06d}"


def _next_spec_id(cursor) -> str:
    """Generate next sequential specimen ID: SPEC-XXXXXX."""
    cursor.execute(
        "SELECT specimen_id FROM dce_ao_signature_specimen "
        "ORDER BY specimen_id DESC LIMIT 1"
    )
    row = cursor.fetchone()
    seq = int(row["specimen_id"].replace("SPEC-", "")) + 1 if row else 1
    return f"SPEC-{seq:06d}"


def _apply_confidence_tier(score: float) -> str:
    """Apply KB-5 threshold definitions to determine confidence tier."""
    if score >= 85.0:
        return "HIGH"
    elif score >= 60.0:
        return "MEDIUM"
    else:
        return "LOW"


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 1 — sa3_get_case_context
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa3_get_case_context(
    case_id: str,
    mode: str = "PHASE1",
) -> dict[str, Any]:
    """
    Retrieve full SA-3 context for signature verification processing.

    Supports two execution modes:

      PHASE1 — New trigger from DCE Orchestrator (CHECKLIST_COMPLETE event).
               Returns case state, N-1 checkpoint output (N1Output), staged
               document metadata (storage URLs needed for signature extraction),
               RM hierarchy for notification routing, and the SA-3 workflow spec.

      PHASE2 — Resume after HITL (Desk Support decision payload received via
               Spring Boot Dify resume endpoint). Returns all PHASE1 data PLUS:
               the HITL task with decision_payload (per-signatory outcomes), and
               all Phase 1 signature verification results so decisions can be
               processed without re-running extraction.

    Retry detection: if prior dce_ao_signature_verification rows exist for this
    case, phase1_results will be populated even in PHASE1 mode, allowing the
    workflow to skip re-extraction on retry.

    Parameters
    ----------
    case_id : str
        Case identifier e.g. "AO-2026-000101".
    mode : str
        "PHASE1" for new trigger. "PHASE2" for HITL resume.

    Returns
    -------
    dict with keys:
        status, mode, case_state, n1_output, staged_docs, rm_hierarchy,
        phase1_results, hitl_task, workflow_spec, enum_reference
    """
    workflow_spec = {
        "agent_id": "SA-3",
        "node_id": SA3_NODE_ID,
        "next_node": SA3_NEXT_NODE,
        "max_retries": SA3_MAX_RETRIES,
        "primary_model": SA3_AGENT_MODEL,
        "hitl_actor": "COO_DESK_SUPPORT",
        "hitl_required": True,
        "skills": [
            "SKL-01 Fetch Execution Documents + Company Mandate",
            "SKL-02 Signature Extractor (API-7 batch)",
            "SKL-03 Signatory Authority Checker (T-10 mandate cross-reference)",
            "SKL-04 Signature Comparator (API-7 confidence-scored comparison)",
            "SKL-05 Verification Summary LLM (Claude Sonnet — workbench report)",
            "SKL-06 Post to COO Desk Support Workbench Queue",
            "SKL-07 Notify Desk Support + Park for HITL",
            "SKL-08 Decision Validator + Batch Processor (Phase 2 entry)",
            "SKL-09 Store Approved Signature Specimens (MongoDB GridFS)",
        ],
        "sla_window_hours": {"URGENT": 4, "STANDARD": 24, "DEFERRED": 48},
        "output_schema": "N2Output",
        "kb_required": ["KB-5 Signature Verification Guidelines"],
        "iteration_map": {
            "phase1": [
                "Turn 1 — sa3_get_case_context (PHASE1)",
                "Turn 2 — sa3_run_signature_analysis_batch",
                "Turn 3 — LLM: Verification Summary (Claude Sonnet)",
                "Turn 4 — sa3_park_for_hitl",
            ],
            "phase2": [
                "Turn 5 — sa3_get_case_context (PHASE2)",
                "Turn 6 — Code: Decision Validator (deterministic, no tool call)",
                "Turn 7 — sa3_store_approved_specimens",
                "Turn 8 — sa3_complete_node",
            ],
        },
    }

    enum_reference = {
        "authority_status": ["AUTHORISED", "UNAUTHORISED", "NOT_IN_MANDATE"],
        "confidence_tier": ["HIGH", "MEDIUM", "LOW"],
        "confidence_thresholds": {
            "HIGH": "score >= 85.0 — auto-pass, no flag",
            "MEDIUM": "60.0 <= score < 85.0 — flag_for_review=True, Desk Support decides",
            "LOW": "score < 60.0 — escalate_immediate=True, ESCALATE_COMPLIANCE",
        },
        "hitl_outcome_per_signatory": ["APPROVED", "REJECTED", "CLARIFY"],
        "verification_status": [
            "ALL_APPROVED",
            "PARTIAL_APPROVED",
            "HAS_REJECTIONS",
            "CLARIFICATION_REQUIRED",
        ],
        "next_node_options": [
            "N-3",                    # All approved
            "SIGNATURE_REJECTED",     # Any rejected
            "HITL_PENDING",           # Clarify requested — wait for resubmission
            "ESCALATE_COMPLIANCE",    # LOW confidence before HITL
        ],
        "checkpoint_status": [
            "IN_PROGRESS", "COMPLETE", "FAILED", "ESCALATED", "HITL_PENDING",
        ],
        "hitl_task_status": ["PENDING", "IN_REVIEW", "DECIDED", "EXPIRED"],
        "priority": ["URGENT", "STANDARD", "DEFERRED"],
    }

    conn = _get_conn()
    try:
        with conn.cursor() as cur:

            # ── 1. Case state ──
            cur.execute(
                "SELECT case_id, status, current_node, completed_nodes, "
                "failed_nodes, retry_counts, case_type, priority, rm_id, "
                "client_name, jurisdiction, sla_deadline, created_at, "
                "updated_at, hitl_queue, event_count "
                "FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            case_state = cur.fetchone()
            if not case_state:
                return {
                    "status": "error",
                    "error": f"Case {case_id} not found in dce_ao_case_state.",
                }

            # ── 2. N-1 COMPLETE checkpoint (carries N1Output for SA-3 context) ──
            cur.execute(
                "SELECT checkpoint_id, node_id, attempt_number, status, "
                "output_json, started_at, completed_at, duration_seconds "
                "FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-1' AND status = 'COMPLETE' "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            n1_checkpoint = cur.fetchone()
            n1_output = None
            if n1_checkpoint and n1_checkpoint.get("output_json"):
                raw = n1_checkpoint["output_json"]
                try:
                    n1_output = json.loads(raw) if isinstance(raw, str) else raw
                except (json.JSONDecodeError, TypeError):
                    n1_output = raw

            # ── 3. Staged documents (execution docs + mandate — need storage_url for API-7) ──
            cur.execute(
                "SELECT doc_id, filename, mime_type, file_size_bytes, "
                "storage_url, storage_bucket, source, upload_status, uploaded_at "
                "FROM dce_ao_document_staged WHERE case_id = %s "
                "ORDER BY doc_id ASC",
                (case_id,),
            )
            staged_docs = cur.fetchall()

            # ── 4. RM hierarchy (for Desk Support workbench notification routing) ──
            cur.execute(
                "SELECT rm_id, rm_name, rm_email, rm_branch, rm_desk, "
                "rm_manager_id, rm_manager_name, rm_manager_email "
                "FROM dce_ao_rm_hierarchy WHERE case_id = %s",
                (case_id,),
            )
            rm_hierarchy = cur.fetchone()

            # ── 5. Prior Phase 1 analysis results (PHASE2 or retry detection) ──
            cur.execute(
                "SELECT verification_id, signatory_id, signatory_name, "
                "authority_status, role_in_mandate, confidence_score, "
                "confidence_tier, source_doc_ids, id_doc_ref, "
                "comparison_overlay_ref, signature_crop_refs, "
                "flag_for_review, escalate_immediate, analysed_at, attempt_number "
                "FROM dce_ao_signature_verification "
                "WHERE case_id = %s "
                "ORDER BY attempt_number DESC, verification_id ASC",
                (case_id,),
            )
            phase1_results = cur.fetchall()

            # ── 6. HITL task — only populated on PHASE2 ──
            hitl_task = None
            if mode == "PHASE2":
                cur.execute(
                    "SELECT task_id, node_id, task_type, assigned_persona, "
                    "status, priority, task_payload, deadline, "
                    "decision_payload, decided_by_id, decided_at, "
                    "created_at, updated_at "
                    "FROM dce_ao_hitl_review_task "
                    "WHERE case_id = %s AND node_id = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (case_id, SA3_NODE_ID),
                )
                hitl_task = cur.fetchone()

        is_retry = len(phase1_results) > 0 and mode == "PHASE1"

        return {
            "status": "success",
            "mode": mode,
            "is_retry": is_retry,
            "case_state": _serialize(case_state),
            "n1_output": n1_output,
            "staged_docs": _serialize(staged_docs),
            "rm_hierarchy": _serialize(rm_hierarchy),
            "phase1_results": _serialize(phase1_results),
            "hitl_task": _serialize(hitl_task),
            "workflow_spec": workflow_spec,
            "enum_reference": enum_reference,
        }

    except Exception as e:
        return {"status": "error", "error": str(e)}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 2 — sa3_run_signature_analysis_batch
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa3_run_signature_analysis_batch(
    case_id: str,
    attempt_number: int = 1,
    analysis_results_json: str = "[]",
) -> dict[str, Any]:
    """
    Persist per-signatory signature analysis results — one INSERT per signatory.

    Called by the Dify Code Node (Node 5 — Signature Analysis Batch Caller) after
    the batch analysis has completed externally via API-7:
      Step 1 — signature_extractor (API-7): extracted signature crops from docs
      Step 2 — signatory_authority_checker (T-10): cross-reference vs mandate
      Step 3 — signature_comparator (API-7): confidence-scored comparison vs ID doc

    This tool applies KB-5 confidence tier thresholds to each result and persists
    to dce_ao_signature_verification. Rows are IMMUTABLE post-write (audit trail).

    Confidence Tier Logic (KB-5):
        HIGH   (score >= 85.0): flag_for_review=False, escalate_immediate=False
        MEDIUM (60.0 <= score < 85.0): flag_for_review=True, escalate_immediate=False
        LOW    (score < 60.0):  flag_for_review=False, escalate_immediate=True

    Overall Status:
        ALL_HIGH        — all signatories HIGH tier
        MIXED_FLAGS     — at least one MEDIUM, no LOW
        HAS_ESCALATIONS — at least one LOW confidence signatory

    Parameters
    ----------
    case_id : str
        Case identifier e.g. "AO-2026-000101".
    attempt_number : int
        Which verification attempt this belongs to (default 1).
    analysis_results_json : str
        JSON array of per-signatory analysis objects from Dify batch caller:
        [
          {
            "signatory_id": "SIG-001",
            "signatory_name": "John Tan Wei Ming",
            "authority_status": "AUTHORISED",
            "role_in_mandate": "Director",
            "confidence_score": 91.5,
            "source_doc_ids": ["DOC-000001", "DOC-000003"],
            "id_doc_ref": "DOC-000004",
            "comparison_overlay_ref": "gridfs://ao-signatures/overlay-SIG-001.png",
            "signature_crop_refs": ["gridfs://ao-signatures/crop-SIG-001-p1.png"]
          }
        ]

    Returns
    -------
    dict with keys:
        status, case_id, attempt_number, verification_ids (list),
        classified_results (list), overall_status, has_low_confidence,
        total_signatories, high_count, medium_count, low_count
    """
    results = json.loads(analysis_results_json)
    if not results:
        return {
            "status": "error",
            "error": "analysis_results_json must not be empty. Provide at least one signatory.",
            "case_id": case_id,
        }

    now = _now()
    conn = _get_conn()
    try:
        classified = []
        verification_ids = []
        high_count = medium_count = low_count = 0

        with conn.cursor() as cur:
            for sig in results:
                score = float(sig.get("confidence_score", 0.0))
                tier = _apply_confidence_tier(score)
                flag_for_review = tier == "MEDIUM"
                escalate_immediate = tier == "LOW"

                if tier == "HIGH":
                    high_count += 1
                elif tier == "MEDIUM":
                    medium_count += 1
                else:
                    low_count += 1

                source_doc_ids = sig.get("source_doc_ids", [])
                sig_crop_refs = sig.get("signature_crop_refs", [])

                cur.execute(
                    "INSERT INTO dce_ao_signature_verification "
                    "(case_id, attempt_number, signatory_id, signatory_name, "
                    "authority_status, role_in_mandate, confidence_score, "
                    "confidence_tier, source_doc_ids, id_doc_ref, "
                    "comparison_overlay_ref, signature_crop_refs, "
                    "flag_for_review, escalate_immediate, analysed_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        case_id,
                        attempt_number,
                        sig["signatory_id"],
                        sig["signatory_name"],
                        sig.get("authority_status", "AUTHORISED"),
                        sig.get("role_in_mandate"),
                        score,
                        tier,
                        json.dumps(source_doc_ids) if isinstance(source_doc_ids, list)
                            else source_doc_ids,
                        sig.get("id_doc_ref"),
                        sig.get("comparison_overlay_ref"),
                        json.dumps(sig_crop_refs) if isinstance(sig_crop_refs, list)
                            else sig_crop_refs,
                        flag_for_review,
                        escalate_immediate,
                        now,
                    ),
                )
                verification_ids.append(cur.lastrowid)

                classified.append({
                    "signatory_id": sig["signatory_id"],
                    "signatory_name": sig["signatory_name"],
                    "authority_status": sig.get("authority_status", "AUTHORISED"),
                    "role_in_mandate": sig.get("role_in_mandate"),
                    "confidence_score": score,
                    "confidence_tier": tier,
                    "flag_for_review": flag_for_review,
                    "escalate_immediate": escalate_immediate,
                    "comparison_overlay_ref": sig.get("comparison_overlay_ref"),
                    "signature_crop_refs": sig_crop_refs,
                    "id_doc_ref": sig.get("id_doc_ref"),
                    "source_doc_ids": source_doc_ids,
                })

        # Determine overall_status — used by IF/ELSE Node 7 in Dify canvas
        if low_count > 0:
            overall_status = "HAS_ESCALATIONS"
        elif medium_count > 0:
            overall_status = "MIXED_FLAGS"
        else:
            overall_status = "ALL_HIGH"

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "attempt_number": attempt_number,
            "verification_ids": verification_ids,
            "classified_results": classified,
            "overall_status": overall_status,
            "has_low_confidence": low_count > 0,
            "total_signatories": len(results),
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
        }

    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "case_id": case_id}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 3 — sa3_park_for_hitl
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa3_park_for_hitl(
    case_id: str,
    attempt_number: int = 1,
    task_payload_json: str = "{}",
    priority: str = "STANDARD",
    deadline: str = "",
    assigned_to_id: str = "",
) -> dict[str, Any]:
    """
    Atomic HITL parking — 4 writes committed in a single transaction.

    Executed at the end of Phase 1 (Node 11 in Dify canvas) after the
    verification report has been posted to the COO Desk Support Workbench Queue
    (POST /api/workbench/signature-queue).

    Transaction writes:
      1. INSERT dce_ao_hitl_review_task (HITL-XXXXXX, task_type=SIGNATURE_REVIEW,
         assigned_persona=DESK_SUPPORT, status=PENDING)
         — Creates the review task visible in Agentic Workbench Desk Support View.

      2. INSERT dce_ao_node_checkpoint (N-2, status=HITL_PENDING)
         — Records Phase 1 complete; workflow state preserved for Phase 2 resume.

      3. UPDATE dce_ao_case_state (status=HITL_PENDING, hitl_queue=HITL-XXXXXX)
         — Marks case as awaiting human decision.

      4. INSERT dce_ao_event_log (event_type=SIGNATURE_ANALYSED)
         — Audit record: Phase 1 complete, parked for Desk Support review.

    The atomic commit guarantees no orphaned HITL tasks exist without a
    corresponding HITL_PENDING checkpoint — preventing cases from being stuck.

    Parameters
    ----------
    case_id : str
        Case identifier e.g. "AO-2026-000101".
    attempt_number : int
        Current N-2 attempt number (default 1).
    task_payload_json : str
        JSON object — the full verification report for the workbench:
        {
          "overall_status": "MIXED_FLAGS",
          "flag_count": 1,
          "signatory_count": 2,
          "verified_signatories": [...],
          "doc_refs": ["DOC-000001", ...],
          "workbench_url": "/workbench/signature-review/...",
          "hitl_deadline": "2026-03-02T22:45:00+08:00",
          "reviewer_guidance": "1 MEDIUM confidence signatory requires manual review..."
        }
    priority : str
        URGENT | STANDARD | DEFERRED (determines Desk Support SLA window).
    deadline : str
        ISO 8601 datetime for HITL SLA deadline.
        Auto-calculated from priority if not provided: URGENT=4h, STANDARD=24h, DEFERRED=48h.
    assigned_to_id : str
        Optional: specific Desk Support officer ID if pre-assigned. Leave empty for pool.

    Returns
    -------
    dict with keys:
        status, case_id, hitl_task_id, checkpoint_id, event_id,
        hitl_deadline, assigned_persona, priority, message
    """
    now = _now()

    # Auto-compute deadline from priority if not supplied
    if not deadline:
        sla_hours = {"URGENT": 4, "STANDARD": 24, "DEFERRED": 48}.get(priority, 24)
        deadline_dt = datetime.datetime.now() + datetime.timedelta(hours=sla_hours)
        deadline = deadline_dt.strftime("%Y-%m-%d %H:%M:%S")

    conn = _get_conn()
    try:
        with conn.cursor() as cur:

            # ── 1. INSERT dce_ao_hitl_review_task ──
            hitl_task_id = _next_hitl_id(cur)
            cur.execute(
                "INSERT INTO dce_ao_hitl_review_task "
                "(task_id, case_id, node_id, task_type, assigned_persona, "
                "assigned_to_id, status, priority, task_payload, deadline, "
                "created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    hitl_task_id,
                    case_id,
                    SA3_NODE_ID,
                    "SIGNATURE_REVIEW",
                    "DESK_SUPPORT",
                    assigned_to_id or None,
                    "PENDING",
                    priority,
                    task_payload_json,
                    deadline,
                    now,
                    now,
                ),
            )

            # ── 2. INSERT dce_ao_node_checkpoint (HITL_PENDING) ──
            input_hash = _sha256(f"{case_id}:{SA3_NODE_ID}:{attempt_number}:{hitl_task_id}")
            cur.execute(
                "INSERT INTO dce_ao_node_checkpoint "
                "(case_id, node_id, attempt_number, status, "
                "input_snapshot, output_json, context_block_hash, "
                "started_at, completed_at, duration_seconds, next_node, "
                "failure_reason, retry_count, agent_model, token_usage) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id,
                    SA3_NODE_ID,
                    attempt_number,
                    "HITL_PENDING",
                    json.dumps({
                        "hitl_task_id": hitl_task_id,
                        "priority": priority,
                        "deadline": deadline,
                    }),
                    None,             # output_json — not yet complete (Phase 2 pending)
                    input_hash,
                    now,
                    now,
                    0.0,
                    "HITL_PENDING",
                    None,
                    max(0, attempt_number - 1),
                    SA3_AGENT_MODEL,
                    "{}",
                ),
            )
            checkpoint_id = cur.lastrowid

            # ── 3. UPDATE dce_ao_case_state ──
            cur.execute(
                "UPDATE dce_ao_case_state SET "
                "status = 'HITL_PENDING', "
                "hitl_queue = %s, "
                "event_count = event_count + 1 "
                "WHERE case_id = %s",
                (json.dumps([hitl_task_id]), case_id),
            )

            # ── 4. INSERT dce_ao_event_log (SIGNATURE_ANALYSED) ──
            cur.execute(
                "INSERT INTO dce_ao_event_log "
                "(case_id, event_type, from_state, to_state, "
                "event_payload, triggered_by, triggered_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    case_id,
                    "SIGNATURE_ANALYSED",
                    f"{SA3_NODE_ID}:IN_PROGRESS",
                    f"{SA3_NODE_ID}:HITL_PENDING",
                    json.dumps({
                        "hitl_task_id": hitl_task_id,
                        "assigned_persona": "DESK_SUPPORT",
                        "priority": priority,
                        "deadline": deadline,
                    }),
                    "AGENT",
                    now,
                ),
            )
            event_id = cur.lastrowid

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "hitl_task_id": hitl_task_id,
            "checkpoint_id": checkpoint_id,
            "event_id": event_id,
            "hitl_deadline": deadline,
            "assigned_persona": "DESK_SUPPORT",
            "priority": priority,
            "message": (
                f"Case {case_id} parked for HITL. "
                f"Task {hitl_task_id} created for COO Desk Support review. "
                f"SLA deadline: {deadline}."
            ),
        }

    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "case_id": case_id}
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 4 — sa3_store_approved_specimens
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa3_store_approved_specimens(
    case_id: str,
    approved_signatories_json: str = "[]",
) -> dict[str, Any]:
    """
    Batch-store approved signature specimens — post-HITL, audit-critical operation.

    Inserts one row per approved signatory into dce_ao_signature_specimen.
    Each row is the permanent regulatory evidence record required under:
      • MAS Notice SFA 02-N13 (signature specimen retention)
      • HKMA AML/CFT Guidelines (signatory identity verification records)
      • ABS internal Signature Verification Policy

    The actual signature image is stored in MongoDB GridFS via the Spring Boot
    Signature Repository API (POST /api/signatures) by the Dify workflow BEFORE
    calling this tool. This tool writes the MariaDB metadata record only:
    mongodb_specimen_ref = the GridFS object ID returned by the API.

    Failure MUST block N-3 advance — if specimens cannot be stored, the audit
    trail is incomplete and the case cannot proceed to KYC/CDD.

    Parameters
    ----------
    case_id : str
        Case identifier e.g. "AO-2026-000101".
    approved_signatories_json : str
        JSON array of approved signatory objects (one entry per approved signatory):
        [
          {
            "signatory_id": "SIG-001",
            "signatory_name": "John Tan Wei Ming",
            "entity_id": "ENT-00042",
            "source_doc_id": "DOC-000001",
            "confidence_score": 91.5,
            "approving_officer_id": "DS-0015",
            "approving_officer_name": "Priya Sharma",
            "mongodb_specimen_ref": "gridfs://ao-signatures/SPEC-sig001.png",
            "comparison_overlay_ref": "gridfs://ao-signatures/overlay-SIG-001.png"
          }
        ]

    Returns
    -------
    dict with keys:
        status, case_id, specimen_ids (list), specimens_stored_count, message
    """
    approved = json.loads(approved_signatories_json)
    if not approved:
        return {
            "status": "success",
            "case_id": case_id,
            "specimen_ids": [],
            "specimens_stored_count": 0,
            "message": "No approved signatories provided — nothing stored.",
        }

    now = _now()
    conn = _get_conn()
    try:
        specimen_ids = []
        with conn.cursor() as cur:
            for sig in approved:
                spec_id = _next_spec_id(cur)
                cur.execute(
                    "INSERT INTO dce_ao_signature_specimen "
                    "(specimen_id, case_id, signatory_id, signatory_name, "
                    "entity_id, source_doc_id, confidence_score, "
                    "approving_officer_id, approving_officer_name, "
                    "mongodb_specimen_ref, comparison_overlay_ref, approved_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        spec_id,
                        case_id,
                        sig["signatory_id"],
                        sig["signatory_name"],
                        sig.get("entity_id"),
                        sig["source_doc_id"],
                        float(sig.get("confidence_score", 0.0)),
                        sig["approving_officer_id"],
                        sig.get("approving_officer_name"),
                        sig["mongodb_specimen_ref"],
                        sig.get("comparison_overlay_ref"),
                        now,
                    ),
                )
                specimen_ids.append(spec_id)

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "specimen_ids": specimen_ids,
            "specimens_stored_count": len(specimen_ids),
            "message": (
                f"{len(specimen_ids)} specimen(s) stored for case {case_id}. "
                f"IDs: {', '.join(specimen_ids)}. "
                f"Regulatory evidence chain is complete."
            ),
        }

    except Exception as e:
        conn.rollback()
        return {
            "status": "error",
            "error": str(e),
            "case_id": case_id,
            "specimen_ids": [],
            "specimens_stored_count": 0,
        }
    finally:
        conn.close()


# ═══════════════════════════════════════════════════════════════════════════
# TOOL 5 — sa3_complete_node
# ═══════════════════════════════════════════════════════════════════════════
@mcp.tool()
def sa3_complete_node(
    case_id: str,
    outcome: str,
    attempt_number: int = 1,
    hitl_task_id: str = "",
    output_json: str = "{}",
    started_at: str = "",
    duration_seconds: float = 0.0,
    rejected_signatories_json: str = "[]",
    clarify_signatories_json: str = "[]",
    specimens_stored_json: str = "[]",
    reviewed_by_officer_id: str = "",
    token_usage: str = "{}",
) -> dict[str, Any]:
    """
    Mandatory SA-3 checkpoint writer — finalises N-2 execution.

    Handles 4 outcome paths with atomic DB writes per path:

    ── SIGNATURE_APPROVED (→ N-3) ──────────────────────────────────────────
      All signatories approved by Desk Support. All specimens stored.
      Writes:
        1. INSERT dce_ao_node_checkpoint (COMPLETE, next_node=N-3)
        2. UPDATE dce_ao_case_state (current_node=N-3, status=ACTIVE,
                                     completed_nodes appended with N-2)
        3. UPDATE dce_ao_hitl_review_task (status=DECIDED)
        4. INSERT dce_ao_event_log × 3:
             HITL_DECISION_RECEIVED → SIGNATURE_APPROVED → NODE_COMPLETED

    ── SIGNATURE_REJECTED ───────────────────────────────────────────────────
      At least one signatory rejected by Desk Support. Full re-execution required.
      Writes:
        1. INSERT dce_ao_node_checkpoint (FAILED, next_node=SIGNATURE_REJECTED)
        2. UPDATE dce_ao_case_state (status=ACTIVE, failed_nodes appended)
        3. UPDATE dce_ao_hitl_review_task (status=DECIDED)
        4. INSERT dce_ao_event_log × 3:
             HITL_DECISION_RECEIVED → SIGNATURE_REJECTED → NODE_FAILED

    ── HITL_PENDING (clarification requested) ───────────────────────────────
      Desk Support submitted CLARIFY for one or more signatories.
      SA-7 triggered externally to contact customer. Workflow parks again.
      Writes:
        1. UPDATE dce_ao_hitl_review_task (status=PENDING, awaiting resubmission)
        2. UPDATE dce_ao_case_state (status=HITL_PENDING — unchanged)
        3. INSERT dce_ao_event_log × 2:
             HITL_DECISION_RECEIVED → CLARIFICATION_SENT

    ── ESCALATE_COMPLIANCE (LOW confidence — Phase 1 bypass path) ───────────
      Called when has_low_confidence=True from sa3_run_signature_analysis_batch.
      Escalates before HITL — no Desk Support review for LOW confidence.
      Writes:
        1. INSERT dce_ao_node_checkpoint (ESCALATED, next_node=ESCALATE_COMPLIANCE)
        2. UPDATE dce_ao_case_state (status=ESCALATED)
        3. INSERT dce_ao_event_log × 2:
             SIGNATURE_ANALYSED → NODE_FAILED

    Parameters
    ----------
    case_id : str
        Case identifier e.g. "AO-2026-000101".
    outcome : str
        SIGNATURE_APPROVED | SIGNATURE_REJECTED | HITL_PENDING | ESCALATE_COMPLIANCE
    attempt_number : int
        N-2 attempt number (default 1).
    hitl_task_id : str
        HITL-XXXXXX task to update (required for APPROVED / REJECTED / HITL_PENDING).
    output_json : str
        N2Output JSON (Pydantic-validated). Required for SIGNATURE_APPROVED.
    started_at : str
        ISO datetime when N-2 Phase 1 began.
    duration_seconds : float
        Total N-2 processing time across both phases.
    rejected_signatories_json : str
        JSON array of rejected signatory objects (for SIGNATURE_REJECTED path).
    clarify_signatories_json : str
        JSON array of signatories needing clarification (for HITL_PENDING path).
    specimens_stored_json : str
        JSON array of specimen IDs stored (for SIGNATURE_APPROVED path).
    reviewed_by_officer_id : str
        Desk Support officer who submitted decisions (e.g. "DS-0015").
    token_usage : str
        JSON: {"input": N, "output": N, "total": N}

    Returns
    -------
    dict with keys:
        status, case_id, outcome, checkpoint_id, next_node,
        events_written, hitl_task_updated, message
    """
    valid_outcomes = [
        "SIGNATURE_APPROVED",
        "SIGNATURE_REJECTED",
        "HITL_PENDING",
        "ESCALATE_COMPLIANCE",
    ]
    if outcome not in valid_outcomes:
        return {
            "status": "error",
            "error": f"Invalid outcome '{outcome}'. Must be one of: {valid_outcomes}",
        }

    now = _now()
    rejected = json.loads(rejected_signatories_json)
    clarify = json.loads(clarify_signatories_json)
    specimens = json.loads(specimens_stored_json)
    input_hash = _sha256(output_json + case_id)

    conn = _get_conn()
    try:
        with conn.cursor() as cur:
            checkpoint_id = None
            events_written = 0
            hitl_task_updated = False
            events = []

            # ── Fetch current completed/failed node lists ──
            cur.execute(
                "SELECT completed_nodes, failed_nodes "
                "FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            cs = cur.fetchone()
            try:
                completed_nodes = json.loads(cs["completed_nodes"] or "[]")
            except (json.JSONDecodeError, TypeError):
                completed_nodes = []
            try:
                failed_nodes = json.loads(cs["failed_nodes"] or "[]")
            except (json.JSONDecodeError, TypeError):
                failed_nodes = []

            # ════════════════════════════════════════
            # PATH A — SIGNATURE_APPROVED → N-3
            # ════════════════════════════════════════
            if outcome == "SIGNATURE_APPROVED":

                # 1. INSERT checkpoint — COMPLETE
                cur.execute(
                    "REPLACE INTO dce_ao_node_checkpoint "
                    "(case_id, node_id, attempt_number, status, "
                    "input_snapshot, output_json, context_block_hash, "
                    "started_at, completed_at, duration_seconds, next_node, "
                    "failure_reason, retry_count, agent_model, token_usage) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        case_id, SA3_NODE_ID, attempt_number, "COMPLETE",
                        json.dumps({"outcome": outcome, "hitl_task_id": hitl_task_id}),
                        output_json,
                        input_hash,
                        started_at or now, now, duration_seconds,
                        SA3_NEXT_NODE, None,
                        max(0, attempt_number - 1),
                        SA3_AGENT_MODEL, token_usage,
                    ),
                )
                checkpoint_id = cur.lastrowid

                # 2. UPDATE case_state — advance to N-3
                if SA3_NODE_ID not in completed_nodes:
                    completed_nodes.append(SA3_NODE_ID)
                cur.execute(
                    "UPDATE dce_ao_case_state SET "
                    "current_node = %s, status = 'ACTIVE', "
                    "completed_nodes = %s, hitl_queue = NULL, "
                    "event_count = event_count + 3 "
                    "WHERE case_id = %s",
                    (SA3_NEXT_NODE, json.dumps(completed_nodes), case_id),
                )

                # 3. UPDATE HITL task → DECIDED
                if hitl_task_id:
                    cur.execute(
                        "UPDATE dce_ao_hitl_review_task SET "
                        "status = 'DECIDED', decided_by_id = %s, "
                        "decided_at = %s, updated_at = %s, "
                        "decision_payload = %s "
                        "WHERE task_id = %s",
                        (
                            reviewed_by_officer_id or None, now, now,
                            json.dumps({
                                "outcome": outcome,
                                "specimens_stored": specimens,
                                "approved_count": len(specimens),
                            }),
                            hitl_task_id,
                        ),
                    )
                    hitl_task_updated = True

                # 4. Events × 3
                events = [
                    (
                        case_id, "HITL_DECISION_RECEIVED",
                        f"{SA3_NODE_ID}:HITL_PENDING", f"{SA3_NODE_ID}:IN_PROGRESS",
                        json.dumps({
                            "hitl_task_id": hitl_task_id,
                            "reviewed_by": reviewed_by_officer_id,
                            "outcome": "ALL_APPROVED",
                        }),
                        "DESK_SUPPORT", now,
                    ),
                    (
                        case_id, "SIGNATURE_APPROVED",
                        f"{SA3_NODE_ID}:IN_PROGRESS", f"{SA3_NODE_ID}:COMPLETE",
                        json.dumps({
                            "specimens_stored": specimens,
                            "approved_count": len(specimens),
                        }),
                        "AGENT", now,
                    ),
                    (
                        case_id, "NODE_COMPLETED",
                        f"{SA3_NODE_ID}:COMPLETE", f"{SA3_NEXT_NODE}:IN_PROGRESS",
                        json.dumps({
                            "next_node": SA3_NEXT_NODE,
                            "duration_seconds": duration_seconds,
                        }),
                        "AGENT", now,
                    ),
                ]
                next_node = SA3_NEXT_NODE

            # ════════════════════════════════════════
            # PATH B — SIGNATURE_REJECTED
            # ════════════════════════════════════════
            elif outcome == "SIGNATURE_REJECTED":
                rejection_summary = json.dumps({
                    "rejected_signatories": rejected,
                    "rejection_count": len(rejected),
                })

                # 1. INSERT checkpoint — FAILED
                cur.execute(
                    "REPLACE INTO dce_ao_node_checkpoint "
                    "(case_id, node_id, attempt_number, status, "
                    "input_snapshot, output_json, context_block_hash, "
                    "started_at, completed_at, duration_seconds, next_node, "
                    "failure_reason, retry_count, agent_model, token_usage) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        case_id, SA3_NODE_ID, attempt_number, "FAILED",
                        json.dumps({"outcome": outcome, "hitl_task_id": hitl_task_id}),
                        None,
                        input_hash,
                        started_at or now, now, duration_seconds,
                        "SIGNATURE_REJECTED",
                        f"Desk Support rejected {len(rejected)} signatory(ies).",
                        max(0, attempt_number - 1),
                        SA3_AGENT_MODEL, token_usage,
                    ),
                )
                checkpoint_id = cur.lastrowid

                # 2. UPDATE case_state — record failure, keep at N-2
                failed_entry = {
                    "node": SA3_NODE_ID,
                    "reason": "SIGNATURE_REJECTED",
                    "rejected_count": len(rejected),
                }
                if failed_entry not in failed_nodes:
                    failed_nodes.append(failed_entry)
                cur.execute(
                    "UPDATE dce_ao_case_state SET "
                    "status = 'ACTIVE', failed_nodes = %s, "
                    "event_count = event_count + 3 "
                    "WHERE case_id = %s",
                    (json.dumps(failed_nodes), case_id),
                )

                # 3. UPDATE HITL task → DECIDED
                if hitl_task_id:
                    cur.execute(
                        "UPDATE dce_ao_hitl_review_task SET "
                        "status = 'DECIDED', decided_by_id = %s, "
                        "decided_at = %s, updated_at = %s, "
                        "decision_payload = %s "
                        "WHERE task_id = %s",
                        (
                            reviewed_by_officer_id or None, now, now,
                            rejection_summary, hitl_task_id,
                        ),
                    )
                    hitl_task_updated = True

                # 4. Events × 3
                events = [
                    (
                        case_id, "HITL_DECISION_RECEIVED",
                        f"{SA3_NODE_ID}:HITL_PENDING", f"{SA3_NODE_ID}:IN_PROGRESS",
                        json.dumps({
                            "hitl_task_id": hitl_task_id,
                            "reviewed_by": reviewed_by_officer_id,
                        }),
                        "DESK_SUPPORT", now,
                    ),
                    (
                        case_id, "SIGNATURE_REJECTED",
                        f"{SA3_NODE_ID}:IN_PROGRESS", f"{SA3_NODE_ID}:FAILED",
                        rejection_summary,
                        "DESK_SUPPORT", now,
                    ),
                    (
                        case_id, "NODE_FAILED",
                        f"{SA3_NODE_ID}:FAILED", f"{SA3_NODE_ID}:FAILED",
                        json.dumps({
                            "failure_reason": "SIGNATURE_REJECTED",
                            "rejected_count": len(rejected),
                            "next_action": "Full re-execution required after customer resubmits.",
                        }),
                        "AGENT", now,
                    ),
                ]
                next_node = "SIGNATURE_REJECTED"

            # ════════════════════════════════════════
            # PATH C — HITL_PENDING (clarification)
            # ════════════════════════════════════════
            elif outcome == "HITL_PENDING":

                # 1. Reset HITL task → PENDING (awaiting resubmission after SA-7 clarification)
                if hitl_task_id:
                    cur.execute(
                        "UPDATE dce_ao_hitl_review_task SET "
                        "status = 'PENDING', updated_at = %s, "
                        "decision_payload = %s "
                        "WHERE task_id = %s",
                        (
                            now,
                            json.dumps({
                                "clarify_signatories": clarify,
                                "clarify_count": len(clarify),
                                "clarification_requested_by": reviewed_by_officer_id,
                            }),
                            hitl_task_id,
                        ),
                    )
                    hitl_task_updated = True

                # 2. Keep case_state in HITL_PENDING
                cur.execute(
                    "UPDATE dce_ao_case_state SET "
                    "status = 'HITL_PENDING', "
                    "event_count = event_count + 2 "
                    "WHERE case_id = %s",
                    (case_id,),
                )

                # 3. Events × 2
                events = [
                    (
                        case_id, "HITL_DECISION_RECEIVED",
                        f"{SA3_NODE_ID}:HITL_PENDING", f"{SA3_NODE_ID}:HITL_PENDING",
                        json.dumps({
                            "hitl_task_id": hitl_task_id,
                            "reviewed_by": reviewed_by_officer_id,
                            "outcome": "CLARIFY",
                            "clarify_count": len(clarify),
                        }),
                        "DESK_SUPPORT", now,
                    ),
                    (
                        case_id, "CLARIFICATION_SENT",
                        f"{SA3_NODE_ID}:HITL_PENDING", f"{SA3_NODE_ID}:HITL_PENDING",
                        json.dumps({
                            "clarify_signatories": clarify,
                            "clarify_count": len(clarify),
                            "sa7_triggered": True,
                            "next_action": "Awaiting customer resubmission of signed documents.",
                        }),
                        "AGENT", now,
                    ),
                ]
                checkpoint_id = None   # No new checkpoint — stays at existing HITL_PENDING
                next_node = "HITL_PENDING"

            # ════════════════════════════════════════
            # PATH D — ESCALATE_COMPLIANCE (LOW confidence)
            # ════════════════════════════════════════
            else:  # ESCALATE_COMPLIANCE

                # 1. INSERT checkpoint — ESCALATED
                cur.execute(
                    "REPLACE INTO dce_ao_node_checkpoint "
                    "(case_id, node_id, attempt_number, status, "
                    "input_snapshot, output_json, context_block_hash, "
                    "started_at, completed_at, duration_seconds, next_node, "
                    "failure_reason, retry_count, agent_model, token_usage) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        case_id, SA3_NODE_ID, attempt_number, "ESCALATED",
                        json.dumps({"outcome": outcome}),
                        None,
                        input_hash,
                        started_at or now, now, duration_seconds,
                        "ESCALATE_COMPLIANCE",
                        "Signature confidence below 60% threshold — immediate compliance escalation.",
                        max(0, attempt_number - 1),
                        SA3_AGENT_MODEL, token_usage,
                    ),
                )
                checkpoint_id = cur.lastrowid

                # 2. UPDATE case_state — ESCALATED
                cur.execute(
                    "UPDATE dce_ao_case_state SET "
                    "status = 'ESCALATED', "
                    "event_count = event_count + 2 "
                    "WHERE case_id = %s",
                    (case_id,),
                )

                # 3. Events × 2
                events = [
                    (
                        case_id, "SIGNATURE_ANALYSED",
                        f"{SA3_NODE_ID}:IN_PROGRESS", f"{SA3_NODE_ID}:ESCALATED",
                        json.dumps({
                            "reason": "LOW confidence signature threshold breach (< 60%)",
                            "next_node": "ESCALATE_COMPLIANCE",
                            "compliance_notified": True,
                        }),
                        "AGENT", now,
                    ),
                    (
                        case_id, "NODE_FAILED",
                        f"{SA3_NODE_ID}:ESCALATED", f"{SA3_NODE_ID}:ESCALATED",
                        json.dumps({
                            "failure_reason": "ESCALATE_COMPLIANCE",
                            "escalation_target": "Compliance + COO Desk Support",
                        }),
                        "AGENT", now,
                    ),
                ]
                next_node = "ESCALATE_COMPLIANCE"

            # ── Write events (shared across all paths) ──
            if events:
                cur.executemany(
                    "INSERT INTO dce_ao_event_log "
                    "(case_id, event_type, from_state, to_state, "
                    "event_payload, triggered_by, triggered_at) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    events,
                )
                events_written = len(events)

        conn.commit()
        return {
            "status": "success",
            "case_id": case_id,
            "outcome": outcome,
            "checkpoint_id": checkpoint_id,
            "next_node": next_node,
            "events_written": events_written,
            "hitl_task_updated": hitl_task_updated,
            "message": (
                f"SA-3 N-2 finalised. Outcome: {outcome}. "
                f"Next: {next_node}. Events written: {events_written}."
            ),
        }

    except Exception as e:
        conn.rollback()
        return {"status": "error", "error": str(e), "case_id": case_id}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Health check route
# ---------------------------------------------------------------------------
async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-ao-sa3"})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ---------------------------------------------------------------------------
# Server entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    mcp.run(transport=transport)
