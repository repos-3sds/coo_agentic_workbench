"""
Domain Orchestrator MCP Server — DCE Account Opening Pipeline.

Drives cases through the complete DAG: N-0 → N-1 → N-2 → N-3 → N-4 → N-5 → N-6 → DONE.
Calls sub-agent MCP tools directly via HTTP (JSON-RPC 2.0 over SSE).
Provides auto_hitl mode for end-to-end testing.

Port: 8006  |  Health: GET /health  |  MCP: POST /mcp
"""

import json
import os
import time
import uuid
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import Any, Optional

import pymysql
from mcp.server.fastmcp import FastMCP

from config import (
    DB_CONFIG,
    MCP_PORTS,
    MCP_CONTAINERS,
    PIPELINE_NODES,
    PIPELINE_TERMINAL,
    HITL_NODES,
    ORCH_PORT,
)

# ---------------------------------------------------------------------------
# FastMCP server
# ---------------------------------------------------------------------------
PORT = int(os.getenv("PORT", str(ORCH_PORT)))

mcp = FastMCP(
    "DCE-AO-Orchestrator",
    instructions=(
        "DCE Account Opening Domain Orchestrator MCP Server. "
        "Drives cases through the complete pipeline: N-0 → N-6 → DONE. "
        "Calls sub-agent MCP tools directly via HTTP."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=PORT,
)

# ---------------------------------------------------------------------------
# DB helper
# ---------------------------------------------------------------------------
def get_conn():
    """Return a fresh DB connection."""
    return pymysql.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        autocommit=False,
        cursorclass=pymysql.cursors.DictCursor,
    )


# ---------------------------------------------------------------------------
# MCP HTTP caller — JSON-RPC 2.0 over SSE
# ---------------------------------------------------------------------------
def _resolve_host(node_id: str) -> str:
    """Resolve the MCP server host for a given node."""
    mode = os.getenv("MCP_HOST_MODE", "local")
    if mode == "docker":
        return MCP_CONTAINERS.get(node_id, "localhost")
    return "127.0.0.1"


def call_mcp_tool(node_id: str, tool_name: str, arguments: dict) -> dict:
    """
    Call a sub-agent MCP tool via HTTP JSON-RPC 2.0.
    Returns the parsed result dict from the tool.
    """
    host = _resolve_host(node_id)
    port = MCP_PORTS[node_id]
    url = f"http://{host}:{port}/mcp"

    # Step 1: Initialize session
    init_payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {"name": "orchestrator", "version": "1.0.0"},
        },
    }).encode()

    req = urllib.request.Request(
        url,
        data=init_payload,
        headers={"Content-Type": "application/json", "Accept": "application/json, text/event-stream"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        session_id = resp.headers.get("Mcp-Session-Id", "")
        # Read the init response (SSE)
        resp.read()

    # Step 2: Call the tool
    call_payload = json.dumps({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }).encode()

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["Mcp-Session-Id"] = session_id

    req2 = urllib.request.Request(url, data=call_payload, headers=headers)
    with urllib.request.urlopen(req2, timeout=120) as resp2:
        raw = resp2.read().decode("utf-8", errors="replace")

    # Parse SSE response — find the data: line with the result
    result_data = None
    for line in raw.split("\n"):
        line = line.strip()
        if line.startswith("data: "):
            try:
                parsed = json.loads(line[6:])
                if "result" in parsed:
                    result_data = parsed["result"]
                elif "error" in parsed:
                    return {"error": parsed["error"]}
            except json.JSONDecodeError:
                continue

    if result_data is None:
        return {"error": f"No result in SSE response for {tool_name}", "raw": raw[:500]}

    # Extract text content from MCP result
    content = result_data.get("content", [])
    for item in content:
        if item.get("type") == "text":
            try:
                return json.loads(item["text"])
            except json.JSONDecodeError:
                return {"text": item["text"]}

    return result_data


# ---------------------------------------------------------------------------
# Happy-path decision data for auto_hitl mode
# ---------------------------------------------------------------------------
HAPPY_PATH_DECISIONS = {
    # N-2 (SA3): Signature Verification — auto-approve all signatures
    "N-2": {
        "outcome": "SIGNATURE_APPROVED",
        "specimens": [
            {
                "signatory_id": "SIG-001",
                "signatory_name": "James Chen Wei Lin",
                "entity_id": "ENT-HORIZON-001",
                "source_doc_id": "DOC-AO-FORM",
                "confidence_score": 0.95,
                "approving_officer_id": "EMP-DS-001",
                "approving_officer_name": "Sarah Tan (Desk Support)",
                "mongodb_specimen_ref": f"mongo://specimens/SIG-001-{uuid.uuid4().hex[:8]}",
                "comparison_overlay_ref": f"s3://overlays/SIG-001-{uuid.uuid4().hex[:8]}.png",
            },
            {
                "signatory_id": "SIG-002",
                "signatory_name": "Michelle Wong Mei Ling",
                "entity_id": "ENT-HORIZON-001",
                "source_doc_id": "DOC-AO-FORM",
                "confidence_score": 0.92,
                "approving_officer_id": "EMP-DS-001",
                "approving_officer_name": "Sarah Tan (Desk Support)",
                "mongodb_specimen_ref": f"mongo://specimens/SIG-002-{uuid.uuid4().hex[:8]}",
                "comparison_overlay_ref": f"s3://overlays/SIG-002-{uuid.uuid4().hex[:8]}.png",
            },
        ],
    },
    # N-3 (SA4): KYC/CDD — RM approves with standard risk
    "N-3": {
        "outcome": "RM_DECISION_CAPTURED",
        "rm_decisions": {
            "kyc_risk_rating": "MEDIUM",
            "cdd_clearance": "CLEARED",
            "bcap_clearance": True,
            "caa_approach": "IRB",
            "recommended_dce_limit_sgd": 5000000.0,
            "recommended_dce_pce_limit_sgd": 2000000.0,
            "osca_case_number": "OSCA-2026-E2E-001",
            "limit_exposure_indication": "Within standard parameters for mid-cap corporate",
            "rm_id": "RM-001",
            "rm_name": "Ranga Bodavalla",
            "decided_at": "",  # filled at runtime
            "additional_conditions": [
                "Annual review of financial statements required",
                "Position limits to be monitored monthly",
            ],
        },
    },
    # N-4 (SA5): Credit — approve with standard conditions
    "N-4": {
        "outcome": "CREDIT_APPROVED",
        "credit_decisions": {
            "credit_outcome": "APPROVED",
            "approved_dce_limit_sgd": 5000000.0,
            "approved_dce_pce_limit_sgd": 2000000.0,
            "confirmed_caa_approach": "IRB",
            "conditions": [
                {"condition": "Annual review of credit facility", "type": "STANDARD"},
                {"condition": "Monthly margin utilization reporting", "type": "STANDARD"},
                {"condition": "Notification required for positions exceeding 80% of limit", "type": "MONITORING"},
            ],
            "credit_team_id": "CT-001",
            "credit_team_name": "Credit Assessment Team Alpha",
            "credit_team_email": "credit.alpha@absbank.com",
            "decided_at": "",  # filled at runtime
        },
    },
    # N-5 (SA6): TMO Static Config — all systems pass validation
    "N-5": {
        "outcome": "TMO_VALIDATED",
        # No additional decisions needed — sa6_validate_system_config
        # generates simulated PASS results by default
    },
}


# ---------------------------------------------------------------------------
# Node recipes — tool call sequences for each node
# ---------------------------------------------------------------------------

def _recipe_n0(case_id: str, auto_hitl: bool) -> dict:
    """N-0: Case Intake & Triage (SA1, port 8000)."""
    tools_called = []
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    start_time = time.time()

    # Read the raw submission to get entity data
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM dce_ao_submission_raw WHERE raw_payload_hash = SHA2('orch-e2e-test-case-601-horizon-capital', 256) LIMIT 1"
            )
            submission = cur.fetchone()
    finally:
        conn.close()

    if not submission:
        return {"error": "No raw submission found for E2E test case"}

    # Tool 1: Create case
    result = call_mcp_tool("N-0", "sa1_create_case_full", {
        "submission_source": "EMAIL",
        "received_at": now_str,
        "rm_employee_id": "RM-001",
        "email_message_id": submission.get("email_message_id", "MSG-ORCH-E2E-001@absbank.com"),
        "sender_email": submission.get("sender_email", "ranga.bodavalla@absbank.com"),
        "email_subject": submission.get("email_subject", "New Account Opening Request - Horizon Capital Markets"),
        "email_body_text": submission.get("email_body_text", "Account opening request"),
        "attachments_count": int(submission.get("attachments_count", 5)),
        "account_type": "INSTITUTIONAL_FUTURES",
        "account_type_confidence": 0.95,
        "account_type_reasoning": "Corporate entity requesting futures and options trading",
        "client_name": "Horizon Capital Markets Pte Ltd",
        "client_entity_type": "CORP",
        "jurisdiction": "SGP",
        "products_requested": json.dumps(["Futures", "Options on Futures"]),
        "priority": "STANDARD",
        "priority_reason": "Standard corporate account, no urgency flags",
        "sla_deadline": (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S"),
        "classifier_model": "claude-sonnet-4-6",
        "priority_model": "claude-haiku-4-5",
        "rm_name": "Ranga Bodavalla",
        "rm_email": "ranga.bodavalla@absbank.com",
        "rm_branch": "SGP-MAIN",
        "rm_desk": "DCE",
        "rm_manager_id": "RM-MGR-001",
        "rm_manager_name": "David Lim",
        "rm_manager_email": "david.lim@absbank.com",
        "rm_resolution_source": "HR_SYSTEM",
    })
    tools_called.append("sa1_create_case_full")

    if "error" in result:
        return {"error": f"sa1_create_case_full failed: {result['error']}", "tools_called": tools_called}

    created_case_id = result.get("case_id", case_id)
    submission_id = result.get("submission_id", 601)

    # Tool 2: Stage documents
    documents = [
        {"filename": "AO_Form_HorizonCapital_signed.pdf", "mime_type": "application/pdf", "file_size_bytes": 2450000, "storage_url": "s3://dce-docs/horizon/ao_form.pdf", "source": "EMAIL_ATTACHMENT", "checksum_sha256": "abc123def456"},
        {"filename": "Board_Resolution_2026.pdf", "mime_type": "application/pdf", "file_size_bytes": 890000, "storage_url": "s3://dce-docs/horizon/board_res.pdf", "source": "EMAIL_ATTACHMENT", "checksum_sha256": "bcd234efg567"},
        {"filename": "CoI_HorizonCapital.pdf", "mime_type": "application/pdf", "file_size_bytes": 1200000, "storage_url": "s3://dce-docs/horizon/coi.pdf", "source": "EMAIL_ATTACHMENT", "checksum_sha256": "cde345fgh678"},
        {"filename": "Financial_Statements_FY2024_2025.pdf", "mime_type": "application/pdf", "file_size_bytes": 5600000, "storage_url": "s3://dce-docs/horizon/financials.pdf", "source": "EMAIL_ATTACHMENT", "checksum_sha256": "def456ghi789"},
        {"filename": "Passport_Copies_Signatories.pdf", "mime_type": "application/pdf", "file_size_bytes": 3200000, "storage_url": "s3://dce-docs/horizon/passports.pdf", "source": "EMAIL_ATTACHMENT", "checksum_sha256": "efg567hij890"},
    ]
    result2 = call_mcp_tool("N-0", "sa1_stage_documents_batch", {
        "case_id": created_case_id,
        "submission_id": submission_id,
        "documents_json": json.dumps(documents),
    })
    tools_called.append("sa1_stage_documents_batch")

    # Tool 3: Notify stakeholders
    notifications = [
        {
            "notification_type": "CASE_CREATED",
            "channel": "EMAIL",
            "recipient_id": "RM-001",
            "recipient_email": "ranga.bodavalla@absbank.com",
            "recipient_role": "RM",
            "subject": f"New AO Case Created: {created_case_id} - Horizon Capital Markets",
            "body_summary": "Your account opening request for Horizon Capital Markets Pte Ltd has been received and is being processed.",
            "template_id": "TPL-CASE-CREATED",
        },
    ]
    result3 = call_mcp_tool("N-0", "sa1_notify_stakeholders", {
        "case_id": created_case_id,
        "notifications_json": json.dumps(notifications),
    })
    tools_called.append("sa1_notify_stakeholders")

    # Tool 4: Complete N-0
    result4 = call_mcp_tool("N-0", "sa1_complete_node", {
        "case_id": created_case_id,
        "status": "COMPLETE",
        "attempt_number": 1,
        "output_json": json.dumps({"account_type": "INSTITUTIONAL_FUTURES", "priority": "STANDARD", "client_name": "Horizon Capital Markets Pte Ltd"}),
        "started_at": now_str,
        "duration_seconds": round(time.time() - start_time, 3),
        "documents_staged_count": 5,
        "notifications_sent": True,
    })
    tools_called.append("sa1_complete_node")

    return {
        "node_id": "N-0",
        "outcome": "COMPLETE",
        "case_id": created_case_id,
        "next_node": "N-1",
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n1(case_id: str, auto_hitl: bool) -> dict:
    """N-1: Document Collection & Completeness (SA2, port 8000)."""
    tools_called = []
    start_time = time.time()

    # Tool 1: Get document checklist
    result1 = call_mcp_tool("N-1", "sa2_get_document_checklist", {
        "case_id": case_id,
        "account_type": "INSTITUTIONAL_FUTURES",
        "jurisdiction": "SGP",
        "entity_type": "CORP",
        "products_requested": json.dumps(["Futures", "Options on Futures"]),
    })
    tools_called.append("sa2_get_document_checklist")

    if "error" in result1:
        return {"error": f"sa2_get_document_checklist failed: {result1['error']}", "tools_called": tools_called}

    checklist_id = result1.get("checklist_id", 1)

    # Get staged document IDs
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT doc_id, filename, mime_type, storage_url FROM dce_ao_document_staged WHERE case_id = %s",
                (case_id,),
            )
            staged_docs = cur.fetchall()
    finally:
        conn.close()

    # Tool 2: Extract metadata for each document
    for doc in staged_docs[:3]:  # Process first 3 docs to keep it reasonable
        doc_id_str = str(doc["doc_id"])
        result_meta = call_mcp_tool("N-1", "sa2_extract_document_metadata", {
            "doc_id": doc_id_str,
            "case_id": case_id,
            "storage_url": doc.get("storage_url", ""),
            "filename": doc.get("filename", ""),
            "mime_type": doc.get("mime_type", "application/pdf"),
        })
        tools_called.append(f"sa2_extract_document_metadata({doc_id_str})")

    # Tool 3: Validate document expiry (for one doc)
    if staged_docs:
        result_exp = call_mcp_tool("N-1", "sa2_validate_document_expiry", {
            "doc_id": str(staged_docs[0]["doc_id"]),
            "doc_type": "AO_FORM",
            "expiry_date": "2027-12-31",
            "issue_date": "2026-01-15",
        })
        tools_called.append("sa2_validate_document_expiry")

    # Tool 4: Save completeness assessment
    result_assess = call_mcp_tool("N-1", "sa2_save_completeness_assessment", {
        "case_id": case_id,
        "checklist_id": checklist_id,
        "attempt_number": 1,
        "completeness_flag": True,
        "mandatory_docs_complete": True,
        "optional_docs_complete": False,
        "total_mandatory": 5,
        "matched_mandatory": 5,
        "total_optional": 3,
        "matched_optional": 0,
        "coverage_pct": 100.0,
        "missing_mandatory": "[]",
        "missing_optional": json.dumps(["Tax Residency Certificate", "Latest Management Accounts", "KYC Questionnaire"]),
        "next_node": "N-2",
        "decision_reasoning": "All 5 mandatory documents received and validated. Optional documents not required for processing.",
    })
    tools_called.append("sa2_save_completeness_assessment")

    # Tool 5: Complete N-1
    result_complete = call_mcp_tool("N-1", "sa2_complete_node", {
        "case_id": case_id,
        "status": "COMPLETE",
        "attempt_number": 1,
        "output_json": json.dumps({"completeness_flag": True, "mandatory_docs_complete": True, "next_node": "N-2"}),
        "started_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "duration_seconds": round(time.time() - start_time, 3),
        "completeness_flag": True,
    })
    tools_called.append("sa2_complete_node")

    return {
        "node_id": "N-1",
        "outcome": "COMPLETE",
        "case_id": case_id,
        "next_node": "N-2",
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n2(case_id: str, auto_hitl: bool) -> dict:
    """N-2: Signature Verification (SA3, port 8001). Two-phase HITL."""
    tools_called = []
    start_time = time.time()

    # Phase 1: Get context
    ctx = call_mcp_tool("N-2", "sa3_get_case_context", {"case_id": case_id, "mode": "PHASE1"})
    tools_called.append("sa3_get_case_context(PHASE1)")

    if "error" in ctx:
        return {"error": f"sa3_get_case_context failed: {ctx['error']}", "tools_called": tools_called}

    # Phase 1: Run signature analysis batch
    analysis_results = [
        {
            "signatory_id": "SIG-001",
            "signatory_name": "James Chen Wei Lin",
            "authority_status": "AUTHORISED_SIGNATORY",
            "role_in_mandate": "Director & CEO",
            "confidence_score": 0.95,
            "source_doc_ids": ["DOC-AO-FORM", "DOC-PASSPORT-1"],
            "id_doc_ref": "s3://dce-docs/horizon/passports.pdf#page1",
            "comparison_overlay_ref": "s3://overlays/sig-001-overlay.png",
            "signature_crop_refs": ["s3://crops/sig-001-p1.png", "s3://crops/sig-001-p2.png"],
        },
        {
            "signatory_id": "SIG-002",
            "signatory_name": "Michelle Wong Mei Ling",
            "authority_status": "AUTHORISED_SIGNATORY",
            "role_in_mandate": "CFO",
            "confidence_score": 0.92,
            "source_doc_ids": ["DOC-AO-FORM", "DOC-PASSPORT-2"],
            "id_doc_ref": "s3://dce-docs/horizon/passports.pdf#page3",
            "comparison_overlay_ref": "s3://overlays/sig-002-overlay.png",
            "signature_crop_refs": ["s3://crops/sig-002-p1.png"],
        },
    ]
    result_analysis = call_mcp_tool("N-2", "sa3_run_signature_analysis_batch", {
        "case_id": case_id,
        "attempt_number": 1,
        "analysis_results_json": json.dumps(analysis_results),
    })
    tools_called.append("sa3_run_signature_analysis_batch")

    # Phase 1: Park for HITL
    deadline = (datetime.utcnow() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
    result_park = call_mcp_tool("N-2", "sa3_park_for_hitl", {
        "case_id": case_id,
        "attempt_number": 1,
        "task_payload_json": json.dumps({"signatories": 2, "overall_status": "ALL_HIGH"}),
        "priority": "STANDARD",
        "deadline": deadline,
    })
    tools_called.append("sa3_park_for_hitl")

    hitl_task_id = result_park.get("hitl_task_id", "")

    if not auto_hitl:
        return {
            "node_id": "N-2",
            "outcome": "HITL_PENDING",
            "case_id": case_id,
            "hitl_task_id": hitl_task_id,
            "tools_called": tools_called,
            "duration_seconds": round(time.time() - start_time, 3),
            "message": "Parked for HITL review. Call orch_execute_node with auto_hitl=True to auto-resolve.",
        }

    # Phase 2 (auto_hitl): Get context again
    ctx2 = call_mcp_tool("N-2", "sa3_get_case_context", {"case_id": case_id, "mode": "PHASE2"})
    tools_called.append("sa3_get_case_context(PHASE2)")

    # Phase 2: Store approved specimens
    specimens = HAPPY_PATH_DECISIONS["N-2"]["specimens"]
    result_specimens = call_mcp_tool("N-2", "sa3_store_approved_specimens", {
        "case_id": case_id,
        "approved_signatories_json": json.dumps(specimens),
    })
    tools_called.append("sa3_store_approved_specimens")

    # Phase 2: Complete node
    result_complete = call_mcp_tool("N-2", "sa3_complete_node", {
        "case_id": case_id,
        "outcome": "SIGNATURE_APPROVED",
        "attempt_number": 1,
        "hitl_task_id": hitl_task_id,
        "output_json": json.dumps({"all_signatures_verified": True, "signatories_approved": 2}),
        "started_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "duration_seconds": round(time.time() - start_time, 3),
        "specimens_stored_json": json.dumps([s["signatory_id"] for s in specimens]),
        "reviewed_by_officer_id": "EMP-DS-001",
    })
    tools_called.append("sa3_complete_node")

    return {
        "node_id": "N-2",
        "outcome": "SIGNATURE_APPROVED",
        "case_id": case_id,
        "next_node": "N-3",
        "hitl_auto_resolved": True,
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n3(case_id: str, auto_hitl: bool) -> dict:
    """N-3: KYC/CDD Assessment (SA4, port 8002). Two-phase HITL."""
    tools_called = []
    start_time = time.time()

    # Phase 1: Get context
    ctx = call_mcp_tool("N-3", "sa4_get_case_context", {"case_id": case_id, "phase": "PHASE1"})
    tools_called.append("sa4_get_case_context(PHASE1)")

    if "error" in ctx:
        return {"error": f"sa4_get_case_context failed: {ctx['error']}", "tools_called": tools_called}

    # Phase 1: Extract entity structure
    extracted_data = ctx.get("extracted_data", {})
    n2_output = ctx.get("n2_output", {})
    result_entity = call_mcp_tool("N-3", "sa4_extract_entity_structure", {
        "case_id": case_id,
        "extracted_data": extracted_data if extracted_data else {
            "entity_name": "Horizon Capital Markets Pte Ltd",
            "entity_type": "CORP",
            "registration_number": "202600001A",
            "jurisdiction": "SGP",
            "date_of_incorporation": "2020-06-15",
            "registered_address": "1 Raffles Place, #30-01, One Raffles Place Tower 1, Singapore 048616",
            "directors": [
                {"name": "James Chen Wei Lin", "nationality": "SGP", "dob": "1975-03-22", "id_number": "S7522345A"},
                {"name": "Michelle Wong Mei Ling", "nationality": "SGP", "dob": "1980-11-08", "id_number": "S8011234B"},
            ],
            "shareholders": [
                {"name": "James Chen Wei Lin", "percentage": 60.0},
                {"name": "Michelle Wong Mei Ling", "percentage": 40.0},
            ],
        },
        "n2_output": n2_output if n2_output else {"all_signatures_verified": True},
    })
    tools_called.append("sa4_extract_entity_structure")

    if "error" in result_entity:
        return {"error": f"sa4_extract_entity_structure failed: {result_entity['error']}", "tools_called": tools_called}

    brief_id = result_entity.get("brief_id", "")

    # Phase 1: Run screening batch
    individuals = result_entity.get("individuals_to_screen", [
        "James Chen Wei Lin", "Michelle Wong Mei Ling",
    ])
    result_screen = call_mcp_tool("N-3", "sa4_run_screening_batch", {
        "case_id": case_id,
        "brief_id": brief_id,
        "individuals_to_screen": individuals if isinstance(individuals, list) else ["James Chen Wei Lin", "Michelle Wong Mei Ling"],
    })
    tools_called.append("sa4_run_screening_batch")

    # Phase 1: Compile and submit KYC brief
    result_compile = call_mcp_tool("N-3", "sa4_compile_and_submit_kyc_brief", {
        "case_id": case_id,
        "brief_id": brief_id,
        "entity_structure": result_entity.get("entity_structure", {}),
        "screening_summary": {
            "overall_sanctions_status": result_screen.get("overall_sanctions_status", "CLEAR"),
            "pep_flag_count": result_screen.get("pep_flag_count", 0),
            "adverse_media_found": result_screen.get("adverse_media_found", False),
        },
        "registry_data": {"source": "ACRA", "status": "ACTIVE", "match_status": "EXACT_MATCH"},
        "open_questions": ["Confirm beneficial ownership chain", "Verify source of funds declaration"],
        "suggested_risk_range": "MEDIUM",
        "is_retail_investor": False,
        "kb_chunks_used": ["KB-4: MAS Notice SFA04-N02", "KB-4: ABS Bank KYC Policy v3.1"],
    })
    tools_called.append("sa4_compile_and_submit_kyc_brief")

    brief_url = result_compile.get("brief_url", f"/workbench/kyc-briefs/{brief_id}")

    # Phase 1: Park for HITL
    deadline = (datetime.utcnow() + timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
    result_park = call_mcp_tool("N-3", "sa4_park_for_hitl", {
        "case_id": case_id,
        "brief_id": brief_id,
        "rm_id": "RM-001",
        "priority": "STANDARD",
        "hitl_deadline": deadline,
        "brief_url": brief_url,
    })
    tools_called.append("sa4_park_for_hitl")

    hitl_task_id = result_park.get("hitl_task_id", "")

    if not auto_hitl:
        return {
            "node_id": "N-3",
            "outcome": "HITL_PENDING",
            "case_id": case_id,
            "hitl_task_id": hitl_task_id,
            "brief_id": brief_id,
            "tools_called": tools_called,
            "duration_seconds": round(time.time() - start_time, 3),
        }

    # Phase 2 (auto_hitl): Get context
    ctx2 = call_mcp_tool("N-3", "sa4_get_case_context", {"case_id": case_id, "phase": "PHASE2"})
    tools_called.append("sa4_get_case_context(PHASE2)")

    # Phase 2: Capture RM decisions
    rm_decisions = HAPPY_PATH_DECISIONS["N-3"]["rm_decisions"].copy()
    rm_decisions["decided_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    result_rm = call_mcp_tool("N-3", "sa4_capture_rm_decisions", {
        "case_id": case_id,
        "brief_id": brief_id,
        "rm_decisions": rm_decisions,
    })
    tools_called.append("sa4_capture_rm_decisions")

    # Phase 2: Complete node
    n3_output = {
        "kyc_status": "PASS",
        "risk_rating": "MEDIUM",
        "cdd_level": "STANDARD",
        "products_approved": ["Futures", "Options on Futures"],
        "caa_approach": "IRB",
        "recommended_dce_limit_sgd": 5000000.0,
        "recommended_dce_pce_limit_sgd": 2000000.0,
    }
    result_complete = call_mcp_tool("N-3", "sa4_complete_node", {
        "case_id": case_id,
        "outcome": "RM_DECISION_CAPTURED",
        "brief_id": brief_id,
        "rm_decisions": rm_decisions,
        "n3_output": n3_output,
        "hitl_task_id": hitl_task_id,
    })
    tools_called.append("sa4_complete_node")

    return {
        "node_id": "N-3",
        "outcome": "RM_DECISION_CAPTURED",
        "case_id": case_id,
        "next_node": "N-4",
        "hitl_auto_resolved": True,
        "brief_id": brief_id,
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n4(case_id: str, auto_hitl: bool) -> dict:
    """N-4: Credit Preparation (SA5, port 8003). Two-phase HITL."""
    tools_called = []
    start_time = time.time()

    # Phase 1: Get context
    ctx = call_mcp_tool("N-4", "sa5_get_case_context", {"case_id": case_id, "phase": "PHASE1"})
    tools_called.append("sa5_get_case_context(PHASE1)")

    if "error" in ctx:
        return {"error": f"sa5_get_case_context failed: {ctx['error']}", "tools_called": tools_called}

    rm_decisions = ctx.get("rm_kyc_decisions", {})
    financial_doc_ids = ctx.get("financial_doc_ids", [])

    # Phase 1: Extract financial data
    result_fin = call_mcp_tool("N-4", "sa5_extract_financial_data", {
        "case_id": case_id,
        "credit_brief_id": "",  # will be auto-generated
        "financial_doc_ids": financial_doc_ids if financial_doc_ids else ["DOC-FIN-001"],
        "entity_name": "Horizon Capital Markets Pte Ltd",
        "jurisdiction": "SGP",
    })
    tools_called.append("sa5_extract_financial_data")

    credit_brief_id = result_fin.get("credit_brief_id", "")
    financial_summary = result_fin.get("financial_summary", {})

    # Phase 1: Compile credit brief
    result_brief = call_mcp_tool("N-4", "sa5_compile_credit_brief", {
        "case_id": case_id,
        "entity_name": "Horizon Capital Markets Pte Ltd",
        "entity_type": "CORP",
        "jurisdiction": "SGP",
        "products_requested": ["Futures", "Options on Futures"],
        "rm_decisions": rm_decisions if rm_decisions else {
            "caa_approach": "IRB",
            "recommended_dce_limit_sgd": 5000000.0,
            "recommended_dce_pce_limit_sgd": 2000000.0,
            "osca_case_number": "OSCA-2026-E2E-001",
            "limit_exposure_indication": "Within standard parameters",
            "kyc_risk_rating": "MEDIUM",
        },
        "financial_summary": financial_summary if financial_summary else {
            "total_equity_sgd": 25000000.0,
            "leverage_ratio": 1.8,
            "liquidity_ratio": 2.5,
            "revenue_sgd": 45000000.0,
        },
        "compiled_by_model": "claude-sonnet-4-6",
    })
    tools_called.append("sa5_compile_credit_brief")

    credit_brief_id = result_brief.get("credit_brief_id", credit_brief_id)
    brief_url = result_brief.get("brief_url", f"/workbench/credit-briefs/{credit_brief_id}")

    # Phase 1: Park for credit review
    deadline = (datetime.utcnow() + timedelta(hours=48)).strftime("%Y-%m-%d %H:%M:%S")
    result_park = call_mcp_tool("N-4", "sa5_park_for_credit_review", {
        "case_id": case_id,
        "credit_brief_id": credit_brief_id,
        "rm_id": "RM-001",
        "priority": "STANDARD",
        "brief_url": brief_url,
        "hitl_deadline": deadline,
    })
    tools_called.append("sa5_park_for_credit_review")

    hitl_task_id = result_park.get("hitl_task_id", "")

    if not auto_hitl:
        return {
            "node_id": "N-4",
            "outcome": "HITL_PENDING",
            "case_id": case_id,
            "hitl_task_id": hitl_task_id,
            "credit_brief_id": credit_brief_id,
            "tools_called": tools_called,
            "duration_seconds": round(time.time() - start_time, 3),
        }

    # Phase 2 (auto_hitl): Get context
    ctx2 = call_mcp_tool("N-4", "sa5_get_case_context", {"case_id": case_id, "phase": "PHASE2"})
    tools_called.append("sa5_get_case_context(PHASE2)")

    # Phase 2: Capture credit decisions
    credit_decisions = HAPPY_PATH_DECISIONS["N-4"]["credit_decisions"].copy()
    credit_decisions["decided_at"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    result_credit = call_mcp_tool("N-4", "sa5_capture_credit_decisions", {
        "case_id": case_id,
        "credit_brief_id": credit_brief_id,
        "credit_decisions": credit_decisions,
    })
    tools_called.append("sa5_capture_credit_decisions")

    # Phase 2: Complete node
    n4_output = {
        "credit_approved": True,
        "credit_outcome": "APPROVED",
        "approved_dce_limit_sgd": 5000000.0,
        "approved_dce_pce_limit_sgd": 2000000.0,
        "confirmed_caa_approach": "IRB",
    }
    result_complete = call_mcp_tool("N-4", "sa5_complete_node", {
        "case_id": case_id,
        "outcome": "CREDIT_APPROVED",
        "credit_brief_id": credit_brief_id,
        "credit_decisions": credit_decisions,
        "n4_output": n4_output,
        "hitl_task_id": hitl_task_id,
    })
    tools_called.append("sa5_complete_node")

    return {
        "node_id": "N-4",
        "outcome": "CREDIT_APPROVED",
        "case_id": case_id,
        "next_node": "N-5",
        "hitl_auto_resolved": True,
        "credit_brief_id": credit_brief_id,
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n5(case_id: str, auto_hitl: bool) -> dict:
    """N-5: Static Configuration (SA6, port 8004). Two-phase HITL."""
    tools_called = []
    start_time = time.time()

    # Phase 1: Get context
    ctx = call_mcp_tool("N-5", "sa6_get_case_context", {"case_id": case_id, "phase": "PHASE1"})
    tools_called.append("sa6_get_case_context(PHASE1)")

    if "error" in ctx:
        return {"error": f"sa6_get_case_context failed: {ctx['error']}", "tools_called": tools_called}

    credit_decisions = ctx.get("credit_decisions", {})
    classification = ctx.get("classification_result", {})
    traders = ctx.get("authorised_traders", [])

    # Phase 1: Build config spec
    result_spec = call_mcp_tool("N-5", "sa6_build_config_spec", {
        "case_id": case_id,
        "entity_name": "Horizon Capital Markets Pte Ltd",
        "entity_type": "CORP",
        "jurisdiction": "SGP",
        "lei_number": "5299001ABCDE12345678",
        "products_requested": ["Futures", "Options on Futures"],
        "credit_outcome": credit_decisions.get("credit_outcome", "APPROVED"),
        "approved_dce_limit_sgd": float(credit_decisions.get("approved_dce_limit_sgd", 5000000.0)),
        "approved_dce_pce_limit_sgd": float(credit_decisions.get("approved_dce_pce_limit_sgd", 2000000.0)),
        "confirmed_caa_approach": credit_decisions.get("confirmed_caa_approach", "IRB"),
        "authorised_traders": traders if traders else [
            {"name": "James Chen Wei Lin", "trader_id": "TRD-001", "desk": "DCE-FUTURES", "products": ["Futures", "Options on Futures"]},
            {"name": "Michelle Wong Mei Ling", "trader_id": "TRD-002", "desk": "DCE-FUTURES", "products": ["Futures"]},
        ],
        "conditions": [
            {"condition": "Annual review of credit facility", "type": "STANDARD"},
            {"condition": "Monthly margin utilization reporting", "type": "STANDARD"},
        ],
        "compiled_by_model": "claude-sonnet-4-6",
    })
    tools_called.append("sa6_build_config_spec")

    if "error" in result_spec:
        return {"error": f"sa6_build_config_spec failed: {result_spec['error']}", "tools_called": tools_called}

    spec_id = result_spec.get("spec_id", "")

    # Phase 1: Generate TMO instruction
    instruction_doc = {
        "ubix_instructions": {
            "action": "CREATE_ENTITY",
            "entity_name": "Horizon Capital Markets Pte Ltd",
            "entity_type": "CORPORATE",
            "lei": "5299001ABCDE12345678",
            "jurisdiction": "SGP",
        },
        "sic_instructions": {
            "action": "CREATE_COUNTERPARTY",
            "counterparty_name": "Horizon Capital Markets Pte Ltd",
            "products": ["FUTURES", "OPTIONS"],
        },
        "cv_instructions": {
            "action": "SETUP_CREDIT_VIEW",
            "dce_limit_sgd": 5000000.0,
            "pce_limit_sgd": 2000000.0,
            "caa_approach": "IRB",
        },
        "trader_setup": {
            "traders": [
                {"name": "James Chen Wei Lin", "id": "TRD-001"},
                {"name": "Michelle Wong Mei Ling", "id": "TRD-002"},
            ],
        },
        "validation_checklist": [
            "Verify UBIX entity creation",
            "Verify SIC counterparty setup",
            "Verify CreditView limit configuration",
            "Verify trader access provisioning",
        ],
    }
    result_instr = call_mcp_tool("N-5", "sa6_generate_tmo_instruction", {
        "case_id": case_id,
        "spec_id": spec_id,
        "instruction_document": instruction_doc,
        "generated_by_model": "claude-sonnet-4-6",
    })
    tools_called.append("sa6_generate_tmo_instruction")

    instruction_id = result_instr.get("instruction_id", "")
    instruction_url = result_instr.get("instruction_url", "")

    # Phase 1: Park for TMO execution
    deadline = (datetime.utcnow() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")
    result_park = call_mcp_tool("N-5", "sa6_park_for_tmo_execution", {
        "case_id": case_id,
        "spec_id": spec_id,
        "instruction_id": instruction_id,
        "instruction_url": instruction_url,
        "rm_id": "RM-001",
        "priority": "STANDARD",
        "hitl_deadline": deadline,
    })
    tools_called.append("sa6_park_for_tmo_execution")

    hitl_task_id = result_park.get("hitl_task_id", "")

    if not auto_hitl:
        return {
            "node_id": "N-5",
            "outcome": "HITL_PENDING",
            "case_id": case_id,
            "hitl_task_id": hitl_task_id,
            "spec_id": spec_id,
            "instruction_id": instruction_id,
            "tools_called": tools_called,
            "duration_seconds": round(time.time() - start_time, 3),
        }

    # Phase 2 (auto_hitl): Get context
    ctx2 = call_mcp_tool("N-5", "sa6_get_case_context", {"case_id": case_id, "phase": "PHASE2"})
    tools_called.append("sa6_get_case_context(PHASE2)")

    # Phase 2: Validate system config (default = all PASS)
    result_validate = call_mcp_tool("N-5", "sa6_validate_system_config", {
        "case_id": case_id,
        "spec_id": spec_id,
    })
    tools_called.append("sa6_validate_system_config")

    # Phase 2: Complete node
    n5_output = {
        "regulatory_config_complete": True,
        "all_systems_pass": True,
        "validation_summary": result_validate.get("validation_summary", "UBIX:PASS SIC:PASS CV:PASS"),
    }
    result_complete = call_mcp_tool("N-5", "sa6_complete_node", {
        "case_id": case_id,
        "outcome": "TMO_VALIDATED",
        "spec_id": spec_id,
        "instruction_id": instruction_id,
        "n5_output": n5_output,
        "hitl_task_id": hitl_task_id,
    })
    tools_called.append("sa6_complete_node")

    return {
        "node_id": "N-5",
        "outcome": "TMO_VALIDATED",
        "case_id": case_id,
        "next_node": "N-6",
        "hitl_auto_resolved": True,
        "spec_id": spec_id,
        "instruction_id": instruction_id,
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


def _recipe_n6(case_id: str, auto_hitl: bool) -> dict:
    """N-6: Notification & Welcome Kit (SA7, port 8005). FINAL node."""
    tools_called = []
    start_time = time.time()

    # Tool 1: Get case context
    ctx = call_mcp_tool("N-6", "sa7_get_case_context", {"case_id": case_id})
    tools_called.append("sa7_get_case_context")

    if "error" in ctx:
        return {"error": f"sa7_get_case_context failed: {ctx['error']}", "tools_called": tools_called}

    config_spec = ctx.get("config_spec", {})
    credit_decision = ctx.get("credit_decision", {})
    rm_hierarchy = ctx.get("rm_hierarchy", {})
    classification = ctx.get("classification_result", {})

    # Tool 2: Generate welcome kit
    result_kit = call_mcp_tool("N-6", "sa7_generate_welcome_kit", {
        "case_id": case_id,
        "entity_name": config_spec.get("entity_name", "Horizon Capital Markets Pte Ltd"),
        "entity_type": config_spec.get("entity_type", "CORP"),
        "jurisdiction": config_spec.get("jurisdiction", "SGP"),
        "account_reference": f"ACC-{case_id}",
        "products_enabled": config_spec.get("products_configured", ["Futures", "Options on Futures"]),
        "approved_dce_limit_sgd": float(credit_decision.get("approved_dce_limit_sgd", config_spec.get("approved_dce_limit_sgd", 5000000.0))),
        "approved_dce_pce_limit_sgd": float(credit_decision.get("approved_dce_pce_limit_sgd", config_spec.get("approved_dce_pce_limit_sgd", 2000000.0))),
        "confirmed_caa_approach": credit_decision.get("confirmed_caa_approach", config_spec.get("confirmed_caa_approach", "IRB")),
        "rm_name": rm_hierarchy.get("rm_name", "Ranga Bodavalla"),
        "rm_email": rm_hierarchy.get("rm_email", "ranga.bodavalla@absbank.com"),
        "rm_phone": rm_hierarchy.get("rm_phone", "+65 6123 4567"),
        "conditions": credit_decision.get("conditions", []),
    })
    tools_called.append("sa7_generate_welcome_kit")

    if "error" in result_kit:
        return {"error": f"sa7_generate_welcome_kit failed: {result_kit['error']}", "tools_called": tools_called}

    kit_id = result_kit.get("kit_id", "")

    # Tool 3: Send welcome kit batch (5 notifications)
    result_batch = call_mcp_tool("N-6", "sa7_send_welcome_kit_batch", {
        "case_id": case_id,
        "kit_id": kit_id,
        "entity_name": config_spec.get("entity_name", "Horizon Capital Markets Pte Ltd"),
        "rm_id": rm_hierarchy.get("rm_employee_id", "RM-001"),
        "rm_name": rm_hierarchy.get("rm_name", "Ranga Bodavalla"),
        "rm_email": rm_hierarchy.get("rm_email", "ranga.bodavalla@absbank.com"),
        "customer_email": "james.chen@horizoncapital.sg",
    })
    tools_called.append("sa7_send_welcome_kit_batch")

    batch_size = result_batch.get("batch_size", result_batch.get("notifications_sent", 5))

    # Tool 4: Complete case (FINAL)
    result_complete = call_mcp_tool("N-6", "sa7_complete_case", {
        "case_id": case_id,
        "kit_id": kit_id,
        "notifications_sent": batch_size,
    })
    tools_called.append("sa7_complete_case")

    return {
        "node_id": "N-6",
        "outcome": "CASE_COMPLETED",
        "case_id": case_id,
        "next_node": None,
        "final_status": "DONE",
        "kit_id": kit_id,
        "notifications_sent": batch_size,
        "tools_called": tools_called,
        "duration_seconds": round(time.time() - start_time, 3),
    }


# Recipe dispatch map
NODE_RECIPES = {
    "N-0": _recipe_n0,
    "N-1": _recipe_n1,
    "N-2": _recipe_n2,
    "N-3": _recipe_n3,
    "N-4": _recipe_n4,
    "N-5": _recipe_n5,
    "N-6": _recipe_n6,
}


# ---------------------------------------------------------------------------
# MCP Tools
# ---------------------------------------------------------------------------

@mcp.tool()
def orch_get_pipeline_status(case_id: str) -> dict[str, Any]:
    """
    Read the current pipeline status for a case.
    Returns case state, completed nodes, next node, completion registry.

    If case_id does not exist yet (fresh E2E test), returns a special
    'NEW_CASE' status indicating N-0 should be executed first.
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # Check if case exists
            cur.execute(
                "SELECT case_id, status, current_node, completed_nodes, priority "
                "FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            case_row = cur.fetchone()

            if not case_row:
                # Check if there's a raw submission for this
                return {
                    "status": "ok",
                    "case_id": case_id,
                    "pipeline_status": "NEW_CASE",
                    "current_node": None,
                    "completed_nodes": [],
                    "next_node": "N-0",
                    "hitl_pending": False,
                    "completion_registry": "No case created yet. Execute N-0 to begin.",
                    "checkpoint_count": 0,
                    "event_count": 0,
                }

            # Get checkpoints
            cur.execute(
                "SELECT node_id, status, next_node, completed_at "
                "FROM dce_ao_node_checkpoint WHERE case_id = %s ORDER BY checkpoint_id",
                (case_id,),
            )
            checkpoints = cur.fetchall()

            # Get event count
            cur.execute(
                "SELECT COUNT(*) as cnt FROM dce_ao_event_log WHERE case_id = %s",
                (case_id,),
            )
            event_count = cur.fetchone()["cnt"]

            # Derive completed nodes from checkpoints (more reliable than
            # case_state.completed_nodes which may lag behind during HITL flows)
            completed_nodes = [
                cp["node_id"] for cp in checkpoints
                if cp["status"] == "COMPLETE"
            ]

            # Determine next node
            case_status = case_row["status"]
            current_node = case_row["current_node"]
            hitl_pending = case_status == "HITL_PENDING"

            if case_status == "DONE":
                next_node = None
            elif case_status == "DEAD" or case_status == "ESCALATED":
                next_node = None
            elif hitl_pending:
                next_node = current_node  # Resume at same node (Phase 2)
            else:
                next_node = current_node

            # Build completion registry text
            registry_lines = []
            for node in PIPELINE_NODES:
                if node in completed_nodes:
                    cp = next((c for c in checkpoints if c["node_id"] == node and c["status"] == "COMPLETE"), None)
                    done_at = cp["completed_at"].strftime("%H:%M") if cp and cp.get("completed_at") else "?"
                    registry_lines.append(f"  {node} | COMPLETE | Done at {done_at}")
                elif node == current_node:
                    status_str = "HITL_PENDING" if hitl_pending else "ACTIVE"
                    registry_lines.append(f"  {node} | {status_str} | Current")
                else:
                    registry_lines.append(f"  {node} | PENDING")

            completion_registry = f"COMPLETION REGISTRY — CASE: {case_id}\n" + "\n".join(registry_lines)

            return {
                "status": "ok",
                "case_id": case_id,
                "pipeline_status": case_status,
                "current_node": current_node,
                "completed_nodes": completed_nodes,
                "next_node": next_node,
                "hitl_pending": hitl_pending,
                "completion_registry": completion_registry,
                "checkpoint_count": len(checkpoints),
                "event_count": event_count,
            }
    finally:
        conn.close()


@mcp.tool()
def orch_execute_node(
    case_id: str,
    node_id: str,
    auto_hitl: bool = True,
) -> dict[str, Any]:
    """
    Execute a single node's complete tool chain by calling sub-agent MCP tools.

    For HITL nodes (N-2, N-3, N-4, N-5), if auto_hitl=True, automatically
    executes both Phase 1 and Phase 2 with happy-path decisions.
    If auto_hitl=False, stops after Phase 1 (HITL_PENDING).
    """
    if node_id not in NODE_RECIPES:
        return {"error": f"Unknown node_id: {node_id}. Valid: {', '.join(PIPELINE_NODES)}"}

    # For N-0, case_id might not exist yet — that's OK
    if node_id != "N-0":
        # Verify node ordering
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT status, current_node, completed_nodes "
                    "FROM dce_ao_case_state WHERE case_id = %s",
                    (case_id,),
                )
                row = cur.fetchone()
                if not row:
                    return {"error": f"Case {case_id} not found. Execute N-0 first."}

                completed_raw = row.get("completed_nodes")
                if isinstance(completed_raw, str):
                    try:
                        completed = json.loads(completed_raw)
                    except json.JSONDecodeError:
                        completed = []
                elif isinstance(completed_raw, list):
                    completed = completed_raw
                else:
                    completed = []

                if node_id in completed:
                    return {"error": f"Node {node_id} is already COMPLETE for case {case_id}. Cannot re-execute."}

                if row["status"] == "DONE":
                    return {"error": f"Case {case_id} is already DONE."}
        finally:
            conn.close()

    # Execute the recipe
    recipe = NODE_RECIPES[node_id]
    try:
        result = recipe(case_id, auto_hitl)
    except Exception as e:
        result = {"error": str(e), "node_id": node_id}

    return result


@mcp.tool()
def orch_advance_pipeline(
    case_id: str,
    auto_hitl: bool = True,
) -> dict[str, Any]:
    """
    Auto-determine the next node from pipeline status and execute it.
    Returns the result of executing the next node.
    """
    # Get current status
    status = orch_get_pipeline_status(case_id)

    if status.get("pipeline_status") == "DONE":
        return {"status": "ok", "message": "Pipeline already DONE", "case_id": case_id, "final_status": "DONE"}

    if status.get("pipeline_status") in ("DEAD", "ESCALATED"):
        return {"status": "ok", "message": f"Pipeline terminated: {status.get('pipeline_status')}", "case_id": case_id}

    next_node = status.get("next_node")
    if not next_node:
        return {"error": "Cannot determine next node", "status_detail": status}

    # Execute the next node
    result = orch_execute_node(case_id, next_node, auto_hitl)

    # If N-0 created a new case_id, use it going forward
    if next_node == "N-0" and result.get("case_id"):
        case_id = result["case_id"]

    # Add pipeline progress info
    result["pipeline_progress"] = {
        "node_executed": next_node,
        "case_id": case_id,
        "pipeline_nodes_total": len(PIPELINE_NODES),
        "node_index": PIPELINE_NODES.index(next_node) + 1 if next_node in PIPELINE_NODES else 0,
    }

    return result


@mcp.tool()
def orch_run_full_pipeline(
    case_id: str,
    auto_hitl: bool = True,
) -> dict[str, Any]:
    """
    Run the entire pipeline from current position to DONE.
    If auto_hitl=True, automatically resolves all HITL gates.
    If auto_hitl=False, stops at the first HITL_PENDING node.

    Returns a summary of all nodes executed and final status.
    """
    start_time = time.time()
    nodes_executed = []
    all_tools_called = []
    hitl_auto_resolved = 0
    current_case_id = case_id
    errors = []

    for step in range(len(PIPELINE_NODES) + 1):  # +1 safety margin
        # Get current status
        status = orch_get_pipeline_status(current_case_id)

        pipeline_status = status.get("pipeline_status")
        if pipeline_status == "DONE":
            break
        if pipeline_status in ("DEAD", "ESCALATED"):
            errors.append(f"Pipeline terminated at step {step}: {pipeline_status}")
            break

        next_node = status.get("next_node")
        if not next_node:
            # Check if maybe we need to use the NEW_CASE path
            if pipeline_status == "NEW_CASE":
                next_node = "N-0"
            else:
                errors.append(f"Cannot determine next node at step {step}")
                break

        # Execute
        result = orch_execute_node(current_case_id, next_node, auto_hitl)

        if "error" in result:
            errors.append(f"Node {next_node} failed: {result['error']}")
            break

        # Track progress
        nodes_executed.append(next_node)
        all_tools_called.extend(result.get("tools_called", []))
        if result.get("hitl_auto_resolved"):
            hitl_auto_resolved += 1

        # If N-0 created a new case_id, switch to it
        if next_node == "N-0" and result.get("case_id"):
            current_case_id = result["case_id"]

        # If HITL_PENDING and not auto_hitl, stop
        if result.get("outcome") == "HITL_PENDING":
            return {
                "status": "ok",
                "case_id": current_case_id,
                "final_status": "HITL_PENDING",
                "stopped_at_node": next_node,
                "nodes_executed": nodes_executed,
                "tools_called_total": len(all_tools_called),
                "hitl_auto_resolved": hitl_auto_resolved,
                "total_duration_seconds": round(time.time() - start_time, 3),
                "message": f"Pipeline paused at {next_node} for HITL review.",
            }

    # Get final status
    final_status = orch_get_pipeline_status(current_case_id)

    return {
        "status": "ok",
        "case_id": current_case_id,
        "final_status": final_status.get("pipeline_status", "UNKNOWN"),
        "nodes_executed": nodes_executed,
        "tools_called_total": len(all_tools_called),
        "tools_called_detail": all_tools_called,
        "hitl_auto_resolved": hitl_auto_resolved,
        "total_duration_seconds": round(time.time() - start_time, 3),
        "errors": errors if errors else None,
        "final_completion_registry": final_status.get("completion_registry", ""),
    }


@mcp.tool()
def orch_get_completion_registry(case_id: str) -> dict[str, Any]:
    """
    Build and return the formatted completion registry for a case.
    Shows COMPLETED / ACTIVE / PENDING status for each pipeline node.
    """
    status = orch_get_pipeline_status(case_id)
    return {
        "status": "ok",
        "case_id": case_id,
        "pipeline_status": status.get("pipeline_status"),
        "completion_registry": status.get("completion_registry", ""),
        "completed_nodes": status.get("completed_nodes", []),
        "checkpoint_count": status.get("checkpoint_count", 0),
        "event_count": status.get("event_count", 0),
    }


@mcp.tool()
def orch_reset_test_case(case_id: str) -> dict[str, Any]:
    """
    Reset a test case to its initial state for re-testing.
    Deletes all data created during pipeline execution.
    GUARD: Only works for case IDs in the test range (AO-2026-0006*).
    """
    # Safety guard: only allow resetting test-range case IDs
    allowed_prefixes = ("AO-2026-0005", "AO-2026-0006", "AO-2026-0007")
    if not any(case_id.startswith(p) for p in allowed_prefixes):
        return {"error": f"Safety guard: can only reset test cases matching AO-2026-0005*/0006*/0007*. Got: {case_id}"}

    tables_to_clean = [
        "dce_ao_welcome_kit",
        "dce_ao_notification_log",
        "dce_ao_system_validation",
        "dce_ao_tmo_instruction",
        "dce_ao_config_spec",
        "dce_ao_credit_decision",
        "dce_ao_credit_brief",
        "dce_ao_financial_extract",
        "dce_ao_rm_kyc_decision",
        "dce_ao_screening_result",
        "dce_ao_kyc_brief",
        "dce_ao_signature_specimen",
        "dce_ao_signature_verification",
        "dce_ao_hitl_review_task",
        "dce_ao_completeness_assessment",
        "dce_ao_gta_validation",
        "dce_ao_document_review",
        "dce_ao_document_checklist_item",
        "dce_ao_document_checklist",
        "dce_ao_document_ocr_result",
        "dce_ao_document_staged",
        "dce_ao_event_log",
        "dce_ao_node_checkpoint",
        "dce_ao_rm_hierarchy",
        "dce_ao_classification_result",
        "dce_ao_case_state",
    ]

    conn = get_conn()
    cleaned = {}
    try:
        with conn.cursor() as cur:
            for table in tables_to_clean:
                try:
                    cur.execute(f"DELETE FROM {table} WHERE case_id = %s", (case_id,))
                    cleaned[table] = cur.rowcount
                except Exception:
                    # Table might not exist or column might not match
                    cleaned[table] = "skipped"
        conn.commit()
    except Exception as e:
        conn.rollback()
        return {"error": f"Reset failed: {str(e)}"}
    finally:
        conn.close()

    total_deleted = sum(v for v in cleaned.values() if isinstance(v, int))
    return {
        "status": "ok",
        "case_id": case_id,
        "tables_cleaned": len([v for v in cleaned.values() if isinstance(v, int) and v > 0]),
        "total_rows_deleted": total_deleted,
        "detail": cleaned,
    }


# ---------------------------------------------------------------------------
# Health endpoint & routing
# ---------------------------------------------------------------------------
from starlette.routing import Route
from starlette.responses import JSONResponse


async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-orchestrator", "port": PORT})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    print(f"[Orchestrator] Starting DCE Orchestrator MCP Server on port {PORT} (transport={transport})")
    mcp.run(transport=transport)
