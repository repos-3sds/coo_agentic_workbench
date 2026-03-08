"""
DCE Account Opening — MCP Server (SA-4)
=======================================
SA-4 MCP server hosting tools for the KYC/CDD Preparation Agent.

SA-4 (Node N-3) — KYC/CDD Preparation (Two-Phase HITL Execution):
  1. sa4_get_case_context             — Fetch case state, N-2 output, extracted doc fields,
                                        classification, and RM hierarchy
  2. sa4_extract_entity_structure     — Parse extracted_data to build ownership chain;
                                        identify all individuals for screening
                                        → INSERT dce_ao_kyc_brief (partial)
  3. sa4_run_screening_batch          — Batch: sanctions (Refinitiv) + PEP (Dow Jones) +
                                        adverse media (Factiva) for all names
                                        → INSERT dce_ao_screening_result (1 row/name)
  4. sa4_lookup_corporate_registry    — Conditional: ACRA (SGP) / HK CoR (HKG) lookup
                                        for CORP/FI entities
  5. sa4_escalate_sanctions_hit       — Emergency: confirmed sanctions hit → suspend case
                                        → INSERT dce_ao_node_checkpoint (SUSPENDED_SANCTIONS)
                                        → UPDATE dce_ao_case_state (ESCALATED)
  6. sa4_compile_and_submit_kyc_brief — Assemble 11-section KYC/CDD/BCAP brief + post to
                                        RM workbench queue
                                        → UPDATE dce_ao_kyc_brief (full)
  7. sa4_park_for_hitl                — Atomic: HITL task + HITL_PENDING checkpoint + event log
  8. sa4_capture_rm_decisions         — Validate + persist all mandatory RM decisions
                                        → INSERT dce_ao_rm_kyc_decision
  9. sa4_complete_node                — Checkpoint + event log + state update
                                        (RM_DECISION_CAPTURED / KYC_DECLINED /
                                         SUSPENDED_SANCTIONS)

Design Notes:
  • Dify iteration cap: 10 turns across two phases (7 Pre-HITL + 3 Post-HITL).
  • External APIs (Refinitiv, Dow Jones, Factiva, ACRA) are simulated in local dev mode.
    In production: replace _call_sanctions_api, _call_pep_api, _call_adverse_media_api,
    _call_acra_api with real HTTP calls to the respective services.
  • dce_ao_hitl_review_task is shared across SA-3, SA-4, SA-5, SA-6.
  • dce_ao_rm_kyc_decision is UNIQUE on case_id — one record per case.
  • sa4_escalate_sanctions_hit uses INSERT (not REPLACE) for checkpoint; sa4_complete_node
    on non-sanctions paths uses REPLACE INTO to overwrite any prior HITL_PENDING checkpoint.
"""

import json
import hashlib
import datetime
import decimal
import os
import re
from typing import Any

import pymysql
from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse
from starlette.routing import Route

from config import (
    DB_CONFIG,
    SA4_AGENT_MODEL,
    SA4_NODE_ID,
    SA4_NEXT_NODE,
    SA4_MAX_RETRIES,
)

# ---------------------------------------------------------------------------
# MCP Server initialisation
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "DCE-AO-SA4",
    instructions=(
        "DCE Account Opening MCP Server — SA-4 KYC/CDD Preparation Agent tools. "
        "Handles two-phase execution: Phase 1 (entity extraction + screening + brief "
        "compilation + park) and Phase 2 (RM decision capture + checkpoint)."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=int(os.getenv("PORT", "8002")),
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
        "SELECT task_id FROM dce_ao_hitl_review_task ORDER BY task_id DESC LIMIT 1"
    )
    row = cursor.fetchone()
    if row:
        last_num = int(row["task_id"].split("-")[1])
        return f"HITL-{last_num + 1:06d}"
    return "HITL-000001"


def _next_brief_id(cursor) -> str:
    """Generate next sequential KYC brief ID: BRIEF-XXXXXX."""
    cursor.execute(
        "SELECT brief_id FROM dce_ao_kyc_brief ORDER BY brief_id DESC LIMIT 1"
    )
    row = cursor.fetchone()
    if row:
        last_num = int(row["brief_id"].split("-")[1])
        return f"BRIEF-{last_num + 1:06d}"
    return "BRIEF-000001"


# ---------------------------------------------------------------------------
# External API simulators (local dev stubs)
# ---------------------------------------------------------------------------
# In production: replace each _call_*_api function with a real HTTP client call.

_SANCTIONS_WATCHLIST = {
    "Liu Zhiwei": {
        "status": "POTENTIAL_MATCH",
        "source": "Refinitiv World-Check v4",
        "detail": {
            "match_type": "NAME_PARTIAL",
            "matched_entity": "Liu Zhiwei (b.1975, PRC) — UN Sanctions list entry 2019",
            "confidence": 0.62,
            "resolution": "RM to verify — common PRC name, DOB/ID confirmation required",
        },
    },
}

_PEP_LIST = {}

_ADVERSE_MEDIA_RESULTS = {}


def _call_sanctions_api(name: str) -> dict:
    """Simulate Refinitiv World-Check API (API-3). Returns per-name screening result."""
    # Exact name match on watchlist (case-insensitive)
    for watchlist_name, result in _SANCTIONS_WATCHLIST.items():
        if name.strip().lower() == watchlist_name.lower():
            return {
                "sanctions_status": result["status"],
                "sanctions_source": result["source"],
                "sanctions_detail": result["detail"],
            }
    return {
        "sanctions_status": "CLEAR",
        "sanctions_source": "Refinitiv World-Check v4",
        "sanctions_detail": None,
    }


def _call_pep_api(name: str) -> dict:
    """Simulate Dow Jones Risk PEP API (API-4). Returns per-name PEP status."""
    for pep_name, result in _PEP_LIST.items():
        if name.strip().lower() == pep_name.lower():
            return {
                "pep_status": result["status"],
                "pep_source": result["source"],
                "pep_detail": result["detail"],
            }
    return {
        "pep_status": "NONE",
        "pep_source": "Dow Jones Risk",
        "pep_detail": None,
    }


def _call_adverse_media_api(name: str) -> dict:
    """Simulate Factiva adverse media API (API-5). Returns per-name media hits."""
    for media_name, result in _ADVERSE_MEDIA_RESULTS.items():
        if name.strip().lower() == media_name.lower():
            return {
                "adverse_media_found": True,
                "adverse_media_count": len(result["hits"]),
                "adverse_media_hits": result["hits"],
            }
    return {
        "adverse_media_found": False,
        "adverse_media_count": 0,
        "adverse_media_hits": [],
    }


def _call_acra_api(entity_name: str, uen: str) -> dict:
    """Simulate ACRA BizFile API (API-6). Returns corporate registry data."""
    return {
        "registry_source": "ACRA BizFile (SGP)",
        "uen": uen or "UNKNOWN",
        "entity_name": entity_name,
        "status": "Live",
        "directors": [],   # Populated from OCR data if available
        "shareholders": [],
        "paid_up_capital": None,
        "discrepancies": [],
        "registry_match_status": "REGISTRY_AVAILABLE",
        "note": "ACRA API simulated in local dev mode — production will call live BizFile API",
    }


def _call_hk_cor_api(entity_name: str, company_number: str) -> dict:
    """Simulate Hong Kong Companies Registry API. Returns corporate registry data."""
    return {
        "registry_source": "Hong Kong Companies Registry",
        "company_number": company_number or "UNKNOWN",
        "entity_name": entity_name,
        "status": "Live",
        "directors": [],
        "shareholders": [],
        "discrepancies": [],
        "registry_match_status": "REGISTRY_AVAILABLE",
        "note": "HK CoR API simulated in local dev mode",
    }


# ---------------------------------------------------------------------------
# Tool 1: sa4_get_case_context
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_get_case_context(case_id: str, phase: str = "PHASE1") -> dict:
    """
    Fetch complete SA-4 execution context for the given case.

    Reads:
      - dce_ao_case_state (current status, node, jurisdiction, priority)
      - dce_ao_node_checkpoint (N-2 N2Output: specimens + verification)
      - dce_ao_classification_result (account_type, entity_type, products)
      - dce_ao_document_ocr_result (extracted entity fields — directors, UBOs, etc.)
      - dce_ao_signature_specimen (approved signatories from SA-3)
      - dce_ao_rm_hierarchy (RM details for brief header + notification routing)
      - dce_ao_kyc_brief (prior attempt context if retry or PHASE2)

    Args:
        case_id: The AO case ID (e.g. AO-2026-000201).
        phase: 'PHASE1' for trigger, 'PHASE2' for post-HITL resume.

    Returns:
        case_context dict with all fields needed for SA-4 processing.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Case state
            cursor.execute(
                "SELECT * FROM dce_ao_case_state WHERE case_id = %s", (case_id,)
            )
            case_state = _serialize(cursor.fetchone())
            if not case_state:
                return {"status": "error", "message": f"Case {case_id} not found"}

            # 2. Classification result (account_type, entity_type, products)
            cursor.execute(
                "SELECT * FROM dce_ao_classification_result WHERE case_id = %s "
                "ORDER BY classification_id DESC LIMIT 1",
                (case_id,),
            )
            classification = _serialize(cursor.fetchone()) or {}

            # 3. N-2 checkpoint output (signature verification results)
            cursor.execute(
                "SELECT output_json FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-2' AND status = 'COMPLETE' "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            n2_row = cursor.fetchone()
            n2_output = {}
            if n2_row and n2_row.get("output_json"):
                try:
                    n2_output = json.loads(n2_row["output_json"])
                except (json.JSONDecodeError, TypeError):
                    n2_output = {}

            # 4. All OCR-extracted document fields (entity data)
            cursor.execute(
                "SELECT doc_id, detected_doc_type, extracted_text, ocr_confidence "
                "FROM dce_ao_document_ocr_result "
                "WHERE case_id = %s ORDER BY processed_at ASC",
                (case_id,),
            )
            ocr_rows = cursor.fetchall()
            extracted_data = {}
            for row in ocr_rows:
                if row.get("extracted_text"):
                    try:
                        doc_data = json.loads(row["extracted_text"])
                        # Merge all doc fields; AO_FORM takes priority for entity data
                        if row.get("detected_doc_type") == "AO_FORM":
                            extracted_data.update(doc_data)
                        else:
                            # Merge supplementary fields without overwriting AO_FORM
                            for k, v in doc_data.items():
                                if k not in extracted_data:
                                    extracted_data[k] = v
                    except (json.JSONDecodeError, TypeError):
                        pass

            # 5. Approved signature specimens (from SA-3)
            cursor.execute(
                "SELECT specimen_id, signatory_id, signatory_name, source_doc_id, "
                "confidence_score, approving_officer_id "
                "FROM dce_ao_signature_specimen WHERE case_id = %s",
                (case_id,),
            )
            specimens = _serialize(list(cursor.fetchall()))

            # 6. RM hierarchy
            cursor.execute(
                "SELECT * FROM dce_ao_rm_hierarchy WHERE case_id = %s LIMIT 1",
                (case_id,),
            )
            rm_hierarchy = _serialize(cursor.fetchone()) or {}

            # 7. Prior N-3 attempt context (for retry or Phase 2 resume)
            cursor.execute(
                "SELECT * FROM dce_ao_kyc_brief "
                "WHERE case_id = %s ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            prior_brief = _serialize(cursor.fetchone())

            # 8. HITL review task for Phase 2 (decisions submitted by RM)
            hitl_task = None
            if phase == "PHASE2":
                cursor.execute(
                    "SELECT * FROM dce_ao_hitl_review_task "
                    "WHERE case_id = %s AND node_id = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (case_id, SA4_NODE_ID),
                )
                hitl_task = _serialize(cursor.fetchone())

            return {
                "status": "success",
                "phase": phase,
                "case_state": case_state,
                "classification_result": classification,
                "n2_output": n2_output,
                "extracted_data": extracted_data,
                "specimens": specimens,
                "rm_hierarchy": rm_hierarchy,
                "prior_brief": prior_brief,
                "hitl_task": hitl_task,
            }
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 2: sa4_extract_entity_structure
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_extract_entity_structure(
    case_id: str,
    extracted_data: dict,
    n2_output: dict,
) -> dict:
    """
    Parse extracted document data to build the complete ownership chain and identify
    all individuals requiring screening.

    Writes:
      - dce_ao_kyc_brief (INSERT partial — entity_structure section only)

    Args:
        case_id: The AO case ID.
        extracted_data: Merged OCR-extracted fields from sa4_get_case_context.
        n2_output: N-2 checkpoint output (verified signatories + specimens).

    Returns:
        entity_structure dict, individuals_to_screen list, brief_id.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # Build ownership chain from extracted data
            directors = extracted_data.get("directors", [])
            beneficial_owners = extracted_data.get("beneficial_owners", [])
            authorised_traders = extracted_data.get("authorised_traders", [])

            # Build individuals_to_screen (deduplicated list of all names requiring screening)
            seen_ids = set()
            individuals_to_screen = []

            # Entity itself
            entity_name = extracted_data.get("entity_name", "")
            if entity_name:
                individuals_to_screen.append({
                    "name": entity_name,
                    "role": "ENTITY",
                    "id_number": extracted_data.get("uen") or extracted_data.get("lei_number", ""),
                    "id_type": "UEN_OR_LEI",
                })

            # Directors
            for d in directors:
                id_key = d.get("id_number", "")
                if id_key not in seen_ids:
                    seen_ids.add(id_key)
                    individuals_to_screen.append({
                        "name": d.get("name", ""),
                        "role": "DIRECTOR",
                        "id_number": id_key,
                        "id_type": d.get("id_type", "UNKNOWN"),
                        "nationality": d.get("nationality", ""),
                    })

            # Beneficial owners — individuals only (above 25%)
            for ubo in beneficial_owners:
                ubo_name = ubo.get("name", "")
                # Screen entity UBOs as ENTITY role; individual UBOs as UBO
                ubo_role = "UBO" if ubo.get("entity_type") is None else "ENTITY"
                individuals_to_screen.append({
                    "name": ubo_name,
                    "role": ubo_role,
                    "percentage_ownership": ubo.get("percentage"),
                    "jurisdiction": ubo.get("jurisdiction", ""),
                })

            # Cross-reference N-2 verified signatories — add any not already in directors
            verified_sigs = n2_output.get("signatories", [])
            for sig in verified_sigs:
                sig_name = sig.get("signatory_name", "")
                already_listed = any(
                    i.get("name", "").lower() == sig_name.lower()
                    for i in individuals_to_screen
                )
                if not already_listed and sig_name:
                    individuals_to_screen.append({
                        "name": sig_name,
                        "role": "SIGNATORY",
                        "specimen_id": sig.get("specimen_id", ""),
                    })

            entity_structure = {
                "entity_name": entity_name,
                "entity_type": extracted_data.get("entity_type", "CORP"),
                "jurisdiction": extracted_data.get("jurisdiction", "SGP"),
                "lei_number": extracted_data.get("lei_number"),
                "incorporation_date": extracted_data.get("incorporation_date"),
                "registered_address": extracted_data.get("registered_address"),
                "directors": directors,
                "beneficial_owners": beneficial_owners,
                "authorised_traders": authorised_traders,
                "individuals_to_screen_count": len(individuals_to_screen),
            }

            ownership_chain = {
                "levels": [
                    {
                        "level": 0,
                        "entity": entity_name,
                        "entity_type": extracted_data.get("entity_type", "CORP"),
                        "jurisdiction": extracted_data.get("jurisdiction"),
                    }
                ] + [
                    {
                        "level": 1,
                        "entity": ubo.get("name"),
                        "entity_type": ubo.get("entity_type", "UNKNOWN"),
                        "jurisdiction": ubo.get("jurisdiction"),
                        "ownership_pct": ubo.get("percentage"),
                    }
                    for ubo in beneficial_owners
                ],
            }

            # Determine attempt_number for this brief
            cursor.execute(
                "SELECT MAX(attempt_number) as max_attempt FROM dce_ao_kyc_brief "
                "WHERE case_id = %s",
                (case_id,),
            )
            row = cursor.fetchone()
            attempt_number = (row["max_attempt"] or 0) + 1 if row else 1

            brief_id = _next_brief_id(cursor)

            # INSERT partial KYC brief (entity structure section)
            cursor.execute(
                """
                INSERT INTO dce_ao_kyc_brief
                    (brief_id, case_id, attempt_number,
                     entity_legal_name, entity_type, incorporation_jurisdiction,
                     incorporation_date, lei_number,
                     ownership_chain, beneficial_owners, directors,
                     compiled_by_model)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    brief_id, case_id, attempt_number,
                    entity_name,
                    extracted_data.get("entity_type", "CORP"),
                    extracted_data.get("jurisdiction"),
                    extracted_data.get("incorporation_date"),
                    extracted_data.get("lei_number"),
                    json.dumps(ownership_chain),
                    json.dumps(beneficial_owners),
                    json.dumps(directors),
                    SA4_AGENT_MODEL,
                ),
            )
            conn.commit()

            return {
                "status": "success",
                "brief_id": brief_id,
                "attempt_number": attempt_number,
                "entity_structure": entity_structure,
                "ownership_chain": ownership_chain,
                "individuals_to_screen": individuals_to_screen,
                "individuals_to_screen_count": len(individuals_to_screen),
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 3: sa4_run_screening_batch
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_run_screening_batch(
    case_id: str,
    brief_id: str,
    individuals_to_screen: list,
) -> dict:
    """
    Run combined sanctions + PEP + adverse media screening for ALL names in a single batch.

    Calls:
      - sanctions_screener (API-3: Refinitiv World-Check) per name
      - pep_screener (API-4: Dow Jones Risk) per name
      - adverse_media_search (API-5: Factiva) per name

    Writes:
      - dce_ao_screening_result (1 row per individual screened)

    Args:
        case_id: The AO case ID.
        brief_id: Brief ID from sa4_extract_entity_structure.
        individuals_to_screen: List from sa4_extract_entity_structure.

    Returns:
        sanctions_results, pep_results, adverse_media_results; overall sanctions_status.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            sanctions_results = []
            pep_results = []
            adverse_media_results = []
            has_confirmed_hit = False
            pep_flag_count = 0
            adverse_media_found_any = False

            for individual in individuals_to_screen:
                name = individual.get("name", "")
                if not name:
                    continue

                role = individual.get("role", "ENTITY")

                # Screen all three sources
                sanctions_result = _call_sanctions_api(name)
                pep_result = _call_pep_api(name)
                media_result = _call_adverse_media_api(name)

                if sanctions_result["sanctions_status"] == "HIT_CONFIRMED":
                    has_confirmed_hit = True

                if pep_result["pep_status"] != "NONE":
                    pep_flag_count += 1

                if media_result["adverse_media_found"]:
                    adverse_media_found_any = True

                screening_api_version = "World-Check-v4/DowJones-2026/Factiva-2026"

                cursor.execute(
                    """
                    INSERT INTO dce_ao_screening_result
                        (case_id, brief_id, person_name, person_role,
                         sanctions_status, sanctions_source, sanctions_detail,
                         pep_status, pep_source, pep_detail,
                         adverse_media_found, adverse_media_count, adverse_media_hits,
                         screening_api_version)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        case_id, brief_id, name, role,
                        sanctions_result["sanctions_status"],
                        sanctions_result["sanctions_source"],
                        json.dumps(sanctions_result["sanctions_detail"])
                        if sanctions_result["sanctions_detail"] else None,
                        pep_result["pep_status"],
                        pep_result["pep_source"],
                        json.dumps(pep_result["pep_detail"])
                        if pep_result["pep_detail"] else None,
                        media_result["adverse_media_found"],
                        media_result["adverse_media_count"],
                        json.dumps(media_result["adverse_media_hits"])
                        if media_result["adverse_media_hits"] else None,
                        screening_api_version,
                    ),
                )

                sanctions_results.append({
                    "name": name,
                    "role": role,
                    **sanctions_result,
                })
                pep_results.append({
                    "name": name,
                    "role": role,
                    **pep_result,
                })
                adverse_media_results.append({
                    "name": name,
                    "role": role,
                    **media_result,
                })

            # Compute overall sanctions status
            all_statuses = [r["sanctions_status"] for r in sanctions_results]
            if "HIT_CONFIRMED" in all_statuses:
                overall_sanctions = "HIT_CONFIRMED"
            elif "POTENTIAL_MATCH" in all_statuses:
                overall_sanctions = "POTENTIAL_MATCH"
            else:
                overall_sanctions = "CLEAR"

            # Update kyc_brief with screening summary
            cursor.execute(
                """
                UPDATE dce_ao_kyc_brief
                SET sanctions_status = %s,
                    pep_flag_count = %s,
                    adverse_media_found = %s,
                    names_screened_count = %s
                WHERE brief_id = %s
                """,
                (
                    overall_sanctions,
                    pep_flag_count,
                    adverse_media_found_any,
                    len(individuals_to_screen),
                    brief_id,
                ),
            )
            conn.commit()

            return {
                "status": "success",
                "brief_id": brief_id,
                "names_screened": len(individuals_to_screen),
                "overall_sanctions_status": overall_sanctions,
                "has_confirmed_hit": has_confirmed_hit,
                "pep_flag_count": pep_flag_count,
                "adverse_media_found": adverse_media_found_any,
                "sanctions_results": sanctions_results,
                "pep_results": pep_results,
                "adverse_media_results": adverse_media_results,
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 4: sa4_lookup_corporate_registry
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_lookup_corporate_registry(
    case_id: str,
    entity_name: str,
    jurisdiction: str,
    registry_identifier: str = "",
) -> dict:
    """
    Conditional: Query corporate registry for SGP or HKG CORP/FI entities.

    Calls ACRA BizFile (SGP) or HK Companies Registry (HKG) to validate submitted
    corporate documents against registry records. Identifies discrepancies (undisclosed
    directors, shareholding changes, registration status).

    Args:
        case_id: The AO case ID.
        entity_name: Legal entity name.
        jurisdiction: 'SGP' or 'HKG'.
        registry_identifier: UEN (SGP) or Company Number (HKG).

    Returns:
        Registry data and discrepancies list (read-only — no DB write).
    """
    if jurisdiction == "SGP":
        registry_data = _call_acra_api(entity_name, registry_identifier)
    elif jurisdiction == "HKG":
        registry_data = _call_hk_cor_api(entity_name, registry_identifier)
    else:
        return {
            "status": "skipped",
            "reason": f"Corporate registry lookup not applicable for jurisdiction: {jurisdiction}",
            "case_id": case_id,
        }

    return {
        "status": "success",
        "case_id": case_id,
        "jurisdiction": jurisdiction,
        "registry_data": registry_data,
        "discrepancies": registry_data.get("discrepancies", []),
        "registry_match_status": registry_data.get("registry_match_status", "UNKNOWN"),
    }


# ---------------------------------------------------------------------------
# Tool 5: sa4_escalate_sanctions_hit
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_escalate_sanctions_hit(
    case_id: str,
    brief_id: str,
    hit_details: list,
    names_hit: list,
) -> dict:
    """
    EMERGENCY TOOL — Called ONLY when sanctions_status = HIT_CONFIRMED.

    Immediately suspends the case and escalates to Compliance. This tool must be called
    when the agent detects HIT_CONFIRMED from sa4_run_screening_batch. Do NOT compile
    the KYC brief or continue the loop after calling this tool.

    Writes:
      - dce_ao_node_checkpoint (N-3, SUSPENDED_SANCTIONS)
      - dce_ao_case_state (status = ESCALATED)
      - dce_ao_event_log (SANCTIONS_HIT)

    Args:
        case_id: The AO case ID.
        brief_id: Brief ID where the hit was detected.
        hit_details: List of screening result dicts for confirmed hits.
        names_hit: List of name strings with confirmed sanctions hits.

    Returns:
        Confirmation of suspension and escalation.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            now = _now()

            # 1. Determine attempt_number
            cursor.execute(
                "SELECT MAX(attempt_number) as max_attempt FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = %s",
                (case_id, SA4_NODE_ID),
            )
            row = cursor.fetchone()
            attempt_number = (row["max_attempt"] or 0) + 1 if row else 1

            checkpoint_output = {
                "case_id": case_id,
                "outcome": "SUSPENDED_SANCTIONS",
                "brief_id": brief_id,
                "names_hit": names_hit,
                "hit_count": len(names_hit),
                "escalated_at": now,
                "compliance_notified": True,
                "next_node": "ESCALATE_COMPLIANCE",
            }

            # 2. Insert SUSPENDED_SANCTIONS checkpoint
            cursor.execute(
                """
                INSERT INTO dce_ao_node_checkpoint
                    (case_id, node_id, attempt_number, status,
                     input_snapshot, output_json, context_block_hash,
                     started_at, completed_at, duration_seconds,
                     next_node, failure_reason, retry_count, agent_model, token_usage)
                VALUES (%s, %s, %s, 'FAILED',
                        %s, %s, %s,
                        %s, %s, 0.0,
                        'ESCALATE_COMPLIANCE', 'SANCTIONS_HIT_CONFIRMED', %s, %s,
                        '{"input":0,"output":0,"total":0}')
                """,
                (
                    case_id, SA4_NODE_ID, attempt_number,
                    json.dumps({"case_id": case_id, "trigger": "SANCTIONS_SCREENING"}),
                    json.dumps(checkpoint_output),
                    _sha256(f"{case_id}_{SA4_NODE_ID}_SUSPENDED_{now}"),
                    now, now,
                    0, SA4_AGENT_MODEL,
                ),
            )

            # 3. Update case_state to ESCALATED
            cursor.execute(
                """
                UPDATE dce_ao_case_state
                SET status = 'ESCALATED', updated_at = %s
                WHERE case_id = %s
                """,
                (now, case_id),
            )

            # 4. Event log
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, 'SANCTIONS_HIT', 'sa4_escalate_sanctions_hit', %s, %s)
                """,
                (
                    case_id,
                    json.dumps({
                        "node_id": SA4_NODE_ID,
                        "brief_id": brief_id,
                        "names_hit": names_hit,
                        "hit_count": len(names_hit),
                        "compliance_escalation_posted": True,
                    }),
                    now,
                ),
            )

            conn.commit()

            return {
                "status": "success",
                "case_id": case_id,
                "outcome": "SUSPENDED_SANCTIONS",
                "brief_id": brief_id,
                "names_hit": names_hit,
                "checkpoint_written": True,
                "case_status": "ESCALATED",
                "compliance_notification": "CRITICAL — posted to /api/escalations (simulated)",
                "next_action": "COMPLIANCE_TEAM_REVIEW",
                "message": (
                    "Case suspended due to confirmed sanctions hit. "
                    "Compliance team notified. No further processing."
                ),
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 6: sa4_compile_and_submit_kyc_brief
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_compile_and_submit_kyc_brief(
    case_id: str,
    brief_id: str,
    entity_structure: dict,
    screening_summary: dict,
    registry_data: dict,
    open_questions: list,
    suggested_risk_range: str,
    is_retail_investor: bool,
    kb_chunks_used: list,
) -> dict:
    """
    Compile the complete 11-section KYC/CDD/BCAP brief and post to RM workbench queue.

    Updates dce_ao_kyc_brief with the full brief (all sections completed).
    Posts to Spring Boot workbench API (simulated in local dev).

    Args:
        case_id: The AO case ID.
        brief_id: Brief ID from sa4_extract_entity_structure.
        entity_structure: Entity structure dict from sa4_extract_entity_structure.
        screening_summary: Summary from sa4_run_screening_batch.
        registry_data: Registry data from sa4_lookup_corporate_registry (or {}).
        open_questions: List of open question strings for RM investigation.
        suggested_risk_range: Agent-suggested range — 'LOW', 'MEDIUM', or 'HIGH'.
        is_retail_investor: Whether entity qualifies as MAS retail investor.
        kb_chunks_used: List of KB chunk IDs used in compilation.

    Returns:
        kyc_brief_id, brief_url, notification_sent.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            now = _now()
            brief_url = f"https://workbench.dce.internal/kyc-briefs/{brief_id}"

            # Update kyc_brief with full compilation
            cursor.execute(
                """
                UPDATE dce_ao_kyc_brief
                SET is_retail_investor = %s,
                    mas_risk_disclosure_confirmed = %s,
                    brief_url = %s,
                    open_questions = %s,
                    suggested_risk_range = %s,
                    kb_chunks_used = %s,
                    compiled_at = %s
                WHERE brief_id = %s AND case_id = %s
                """,
                (
                    is_retail_investor,
                    False,  # RM confirms this during review
                    brief_url,
                    json.dumps(open_questions),
                    suggested_risk_range,
                    json.dumps(kb_chunks_used),
                    now,
                    brief_id, case_id,
                ),
            )

            conn.commit()

            # Simulate posting to RM workbench (Spring Boot API)
            workbench_response = {
                "workbench_posted": True,
                "workbench_url": brief_url,
                "rm_notification_sent": True,
                "note": "POST /api/workbench/rm-review-queue simulated in local dev",
            }

            return {
                "status": "success",
                "brief_id": brief_id,
                "brief_url": brief_url,
                "kyc_brief_id": brief_id,
                "notification_sent": True,
                **workbench_response,
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 7: sa4_park_for_hitl
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_park_for_hitl(
    case_id: str,
    brief_id: str,
    rm_id: str,
    priority: str,
    hitl_deadline: str,
    brief_url: str,
) -> dict:
    """
    Atomic HITL parking: create HITL task + write HITL_PENDING checkpoint + event log.

    Writes:
      - dce_ao_hitl_review_task (INSERT, task_type=KYC_CDD_REVIEW, persona=RM)
      - dce_ao_node_checkpoint (INSERT, status=HITL_PENDING)
      - dce_ao_case_state (UPDATE status=HITL_PENDING, hitl_queue=[hitl_task_id])
      - dce_ao_event_log (KYC_BRIEF_SUBMITTED)

    Args:
        case_id: The AO case ID.
        brief_id: Brief ID of the compiled KYC brief.
        rm_id: RM officer ID to assign the HITL task to.
        priority: 'URGENT' | 'STANDARD' | 'DEFERRED'.
        hitl_deadline: HITL SLA deadline (YYYY-MM-DD HH:MM:SS format).
        brief_url: URL to the brief in the RM workbench.

    Returns:
        hitl_task_id, checkpoint written confirmation.
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            now = _now()
            hitl_task_id = _next_hitl_id(cursor)

            # Determine attempt_number for this node
            cursor.execute(
                "SELECT MAX(attempt_number) as max_attempt FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = %s",
                (case_id, SA4_NODE_ID),
            )
            row = cursor.fetchone()
            attempt_number = (row["max_attempt"] or 0) + 1 if row else 1

            task_payload = {
                "brief_id": brief_id,
                "brief_url": brief_url,
                "node_id": SA4_NODE_ID,
                "priority": priority,
                "deadline": hitl_deadline,
                "instructions": (
                    "Please review the KYC/CDD/BCAP brief and complete all mandatory "
                    "fields: KYC risk rating, CDD clearance, BCAP clearance, CAA approach, "
                    "recommended DCE limits, OSCA case number, and limit exposure indication."
                ),
            }

            # 1. Insert HITL task
            cursor.execute(
                """
                INSERT INTO dce_ao_hitl_review_task
                    (task_id, case_id, node_id, task_type, assigned_persona,
                     assigned_to_id, status, priority, task_payload, deadline,
                     created_at)
                VALUES (%s, %s, %s, 'KYC_CDD_REVIEW', 'RM',
                        %s, 'PENDING', %s, %s, %s, %s)
                """,
                (
                    hitl_task_id, case_id, SA4_NODE_ID,
                    rm_id, priority,
                    json.dumps(task_payload),
                    hitl_deadline, now,
                ),
            )

            checkpoint_output = {
                "outcome": "HITL_PENDING",
                "hitl_task_id": hitl_task_id,
                "brief_id": brief_id,
                "brief_url": brief_url,
                "assigned_rm": rm_id,
            }

            # 2. Insert HITL_PENDING checkpoint
            cursor.execute(
                """
                INSERT INTO dce_ao_node_checkpoint
                    (case_id, node_id, attempt_number, status,
                     input_snapshot, output_json, context_block_hash,
                     started_at, completed_at, duration_seconds,
                     next_node, failure_reason, retry_count, agent_model, token_usage)
                VALUES (%s, %s, %s, 'HITL_PENDING',
                        %s, %s, %s,
                        %s, %s, 0.0,
                        NULL, NULL, 0, %s,
                        '{"input":0,"output":0,"total":0}')
                """,
                (
                    case_id, SA4_NODE_ID, attempt_number,
                    json.dumps({"case_id": case_id, "brief_id": brief_id}),
                    json.dumps(checkpoint_output),
                    _sha256(f"{case_id}_{SA4_NODE_ID}_HITL_{now}"),
                    now, now,
                    SA4_AGENT_MODEL,
                ),
            )

            # 3. Update case_state: HITL_PENDING + hitl_queue
            cursor.execute(
                """
                UPDATE dce_ao_case_state
                SET status = 'HITL_PENDING',
                    hitl_queue = %s,
                    updated_at = %s
                WHERE case_id = %s
                """,
                (json.dumps([hitl_task_id]), now, case_id),
            )

            # 4. Event log
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, 'KYC_BRIEF_SUBMITTED', 'sa4_park_for_hitl', %s, %s)
                """,
                (
                    case_id,
                    json.dumps({
                        "node_id": SA4_NODE_ID,
                        "hitl_task_id": hitl_task_id,
                        "brief_id": brief_id,
                        "assigned_rm": rm_id,
                        "priority": priority,
                        "deadline": hitl_deadline,
                    }),
                    now,
                ),
            )

            conn.commit()

            return {
                "status": "success",
                "hitl_task_id": hitl_task_id,
                "case_id": case_id,
                "brief_id": brief_id,
                "checkpoint_written": True,
                "case_status": "HITL_PENDING",
                "notification_sent": True,
                "next_action": "RM_REVIEW",
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 8: sa4_capture_rm_decisions
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_capture_rm_decisions(
    case_id: str,
    brief_id: str,
    rm_decisions: dict,
) -> dict:
    """
    Validate and persist all mandatory RM KYC/CDD decisions.

    Mandatory fields (all required — returns error if any missing):
      - kyc_risk_rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNACCEPTABLE'
      - cdd_clearance: 'CLEARED' | 'ENHANCED_DUE_DILIGENCE' | 'DECLINED'
      - bcap_clearance: boolean
      - caa_approach: 'IRB' | 'SA'
      - recommended_dce_limit_sgd: numeric > 0
      - recommended_dce_pce_limit_sgd: numeric > 0
      - osca_case_number: non-empty string
      - limit_exposure_indication: non-empty string
      - rm_id: RM officer ID
      - decided_at: datetime (YYYY-MM-DD HH:MM:SS)

    Writes:
      - dce_ao_rm_kyc_decision (INSERT)
      - dce_ao_case_state (UPDATE rm_decision_captured — via event log flag)

    Args:
        case_id: The AO case ID.
        brief_id: Brief ID reviewed by RM.
        rm_decisions: Dict containing all mandatory RM decision fields.

    Returns:
        decision_id, validation_status, missing_fields.
    """
    # Validate mandatory fields
    mandatory_fields = [
        "kyc_risk_rating", "cdd_clearance", "bcap_clearance", "caa_approach",
        "recommended_dce_limit_sgd", "recommended_dce_pce_limit_sgd",
        "osca_case_number", "limit_exposure_indication", "rm_id", "decided_at",
    ]
    valid_values = {
        "kyc_risk_rating": {"LOW", "MEDIUM", "HIGH", "UNACCEPTABLE"},
        "cdd_clearance": {"CLEARED", "ENHANCED_DUE_DILIGENCE", "DECLINED"},
        "caa_approach": {"IRB", "SA"},
    }

    missing = [f for f in mandatory_fields if f not in rm_decisions or rm_decisions[f] is None]
    if missing:
        return {
            "status": "error",
            "validation_status": "INCOMPLETE",
            "missing_fields": missing,
            "message": f"Mandatory RM fields missing: {missing}. Return to workbench.",
        }

    invalid = []
    for field, allowed in valid_values.items():
        if rm_decisions.get(field) not in allowed:
            invalid.append(f"{field} must be one of {allowed}, got: {rm_decisions.get(field)}")
    if invalid:
        return {
            "status": "error",
            "validation_status": "INVALID_VALUES",
            "invalid_fields": invalid,
            "message": "RM decision fields have invalid values.",
        }

    for limit_field in ("recommended_dce_limit_sgd", "recommended_dce_pce_limit_sgd"):
        try:
            if float(rm_decisions[limit_field]) <= 0:
                return {
                    "status": "error",
                    "validation_status": "INVALID_VALUES",
                    "message": f"{limit_field} must be > 0",
                }
        except (TypeError, ValueError):
            return {
                "status": "error",
                "validation_status": "INVALID_VALUES",
                "message": f"{limit_field} must be a positive number",
            }

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            now = _now()

            cursor.execute(
                """
                INSERT INTO dce_ao_rm_kyc_decision
                    (case_id, brief_id,
                     kyc_risk_rating, cdd_clearance, bcap_clearance, caa_approach,
                     recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
                     osca_case_number, limit_exposure_indication,
                     additional_conditions,
                     rm_id, rm_name, decided_at,
                     chatflow_session_id, chatflow_queries_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    case_id, brief_id,
                    rm_decisions["kyc_risk_rating"],
                    rm_decisions["cdd_clearance"],
                    bool(rm_decisions["bcap_clearance"]),
                    rm_decisions["caa_approach"],
                    float(rm_decisions["recommended_dce_limit_sgd"]),
                    float(rm_decisions["recommended_dce_pce_limit_sgd"]),
                    rm_decisions["osca_case_number"],
                    rm_decisions.get("limit_exposure_indication", ""),
                    json.dumps(rm_decisions.get("additional_conditions"))
                    if rm_decisions.get("additional_conditions") else None,
                    rm_decisions["rm_id"],
                    rm_decisions.get("rm_name", ""),
                    rm_decisions["decided_at"],
                    rm_decisions.get("chatflow_session_id"),
                    rm_decisions.get("chatflow_queries_count", 0),
                ),
            )

            # Fetch auto-incremented decision_id
            decision_id = cursor.lastrowid

            conn.commit()

            return {
                "status": "success",
                "decision_id": decision_id,
                "case_id": case_id,
                "brief_id": brief_id,
                "kyc_risk_rating": rm_decisions["kyc_risk_rating"],
                "validation_status": "COMPLETE",
                "decisions_stored": True,
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Tool 9: sa4_complete_node
# ---------------------------------------------------------------------------
@mcp.tool()
def sa4_complete_node(
    case_id: str,
    outcome: str,
    brief_id: str,
    rm_decisions: dict,
    n3_output: dict,
    hitl_task_id: str = "",
    failure_reason: str = "",
) -> dict:
    """
    Write the N-3 node checkpoint and advance the case state.

    Outcome values:
      - 'RM_DECISION_CAPTURED': N-3 complete → advance to N-4, fire Kafka event
      - 'KYC_DECLINED': RM rated UNACCEPTABLE → case DEAD, notify Sales Dealer + RM
      - 'SUSPENDED_SANCTIONS': Already handled by sa4_escalate_sanctions_hit — do not use here

    Writes:
      - dce_ao_node_checkpoint (REPLACE INTO — overwrites HITL_PENDING)
      - dce_ao_case_state (UPDATE current_node, status, completed_nodes)
      - dce_ao_event_log (RM_DECISION_CAPTURED / KYC_DECLINED / NODE_COMPLETED / NODE_FAILED)

    Args:
        case_id: The AO case ID.
        outcome: 'RM_DECISION_CAPTURED' or 'KYC_DECLINED'.
        brief_id: Brief ID for this case.
        rm_decisions: Validated RM decisions dict (from sa4_capture_rm_decisions).
        n3_output: Full N3Output dict to store in checkpoint.
        hitl_task_id: HITL task ID (to mark as DECIDED).
        failure_reason: Reason if outcome is KYC_DECLINED.

    Returns:
        Confirmation of checkpoint write and case state update.
    """
    if outcome not in ("RM_DECISION_CAPTURED", "KYC_DECLINED"):
        return {
            "status": "error",
            "message": f"Invalid outcome: {outcome}. Must be RM_DECISION_CAPTURED or KYC_DECLINED.",
        }

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            now = _now()

            # Get current attempt_number for N-3
            cursor.execute(
                "SELECT MAX(attempt_number) as max_attempt FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = %s",
                (case_id, SA4_NODE_ID),
            )
            row = cursor.fetchone()
            attempt_number = row["max_attempt"] if row and row["max_attempt"] else 1

            if outcome == "RM_DECISION_CAPTURED":
                checkpoint_status = "COMPLETE"
                next_node = SA4_NEXT_NODE

                # Update case_state — advance to N-4
                cursor.execute(
                    """
                    UPDATE dce_ao_case_state
                    SET current_node = %s,
                        status = 'ACTIVE',
                        hitl_queue = NULL,
                        completed_nodes = JSON_ARRAY_APPEND(completed_nodes, '$', %s),
                        updated_at = %s
                    WHERE case_id = %s
                    """,
                    (next_node, SA4_NODE_ID, now, case_id),
                )

                # Event: RM_DECISION_CAPTURED + NODE_COMPLETED
                for evt in ("RM_DECISION_CAPTURED", "NODE_COMPLETED"):
                    cursor.execute(
                        """
                        INSERT INTO dce_ao_event_log
                            (case_id, event_type, triggered_by, event_payload, triggered_at)
                        VALUES (%s, %s, 'sa4_complete_node', %s, %s)
                        """,
                        (
                            case_id, evt,
                            json.dumps({
                                "node_id": SA4_NODE_ID,
                                "brief_id": brief_id,
                                "kyc_risk_rating": rm_decisions.get("kyc_risk_rating"),
                                "next_node": next_node,
                                "kafka_event": "dce.rm.decision.captured",
                            }),
                            now,
                        ),
                    )

                # Mark HITL task as DECIDED
                if hitl_task_id:
                    cursor.execute(
                        """
                        UPDATE dce_ao_hitl_review_task
                        SET status = 'DECIDED',
                            decision_payload = %s,
                            decided_by_id = %s,
                            decided_at = %s,
                            updated_at = %s
                        WHERE task_id = %s
                        """,
                        (
                            json.dumps(rm_decisions),
                            rm_decisions.get("rm_id", ""),
                            rm_decisions.get("decided_at", now),
                            now,
                            hitl_task_id,
                        ),
                    )

            elif outcome == "KYC_DECLINED":
                checkpoint_status = "FAILED"
                next_node = "DEAD"

                # Update case_state to ESCALATED/CLOSED
                cursor.execute(
                    """
                    UPDATE dce_ao_case_state
                    SET current_node = 'DEAD',
                        status = 'ESCALATED',
                        hitl_queue = NULL,
                        updated_at = %s
                    WHERE case_id = %s
                    """,
                    (now, case_id),
                )

                # Events: KYC_DECLINED + NODE_FAILED
                for evt in ("KYC_DECLINED", "NODE_FAILED"):
                    cursor.execute(
                        """
                        INSERT INTO dce_ao_event_log
                            (case_id, event_type, triggered_by, event_payload, triggered_at)
                        VALUES (%s, %s, 'sa4_complete_node', %s, %s)
                        """,
                        (
                            case_id, evt,
                            json.dumps({
                                "node_id": SA4_NODE_ID,
                                "brief_id": brief_id,
                                "kyc_risk_rating": rm_decisions.get("kyc_risk_rating"),
                                "failure_reason": failure_reason or "KYC_DECLINED_BY_RM",
                                "notified": ["SALES_DEALER", "RM_MANAGER"],
                            }),
                            now,
                        ),
                    )

                if hitl_task_id:
                    cursor.execute(
                        """
                        UPDATE dce_ao_hitl_review_task
                        SET status = 'DECIDED', updated_at = %s
                        WHERE task_id = %s
                        """,
                        (now, hitl_task_id),
                    )

            # REPLACE INTO checkpoint (overwrites HITL_PENDING)
            cursor.execute(
                """
                REPLACE INTO dce_ao_node_checkpoint
                    (case_id, node_id, attempt_number, status,
                     input_snapshot, output_json, context_block_hash,
                     started_at, completed_at, duration_seconds,
                     next_node, failure_reason, retry_count, agent_model, token_usage)
                VALUES (%s, %s, %s, %s,
                        %s, %s, %s,
                        %s, %s, 0.0,
                        %s, %s, 0, %s,
                        '{"input":0,"output":0,"total":0}')
                """,
                (
                    case_id, SA4_NODE_ID, attempt_number, checkpoint_status,
                    json.dumps({"case_id": case_id, "outcome": outcome}),
                    json.dumps(n3_output),
                    _sha256(f"{case_id}_{SA4_NODE_ID}_{outcome}_{now}"),
                    now, now,
                    next_node,
                    failure_reason or None,
                    SA4_AGENT_MODEL,
                ),
            )

            conn.commit()

            return {
                "status": "success",
                "case_id": case_id,
                "outcome": outcome,
                "checkpoint_status": checkpoint_status,
                "next_node": next_node,
                "brief_id": brief_id,
                "checkpoint_written": True,
                "kafka_event_published": outcome == "RM_DECISION_CAPTURED",
                "message": (
                    f"N-3 {checkpoint_status}. Case advancing to {next_node}."
                    if outcome == "RM_DECISION_CAPTURED"
                    else f"KYC declined by RM. Case terminated (DEAD). Notified Sales Dealer + RM."
                ),
            }
    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------
async def _health(request):
    """Simple health check — verifies DB connectivity."""
    try:
        conn = _get_conn()
        conn.ping(reconnect=True)
        conn.close()
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {exc}"

    return JSONResponse(
        {
            "service": "DCE-AO-SA4",
            "node": SA4_NODE_ID,
            "status": "healthy" if db_status == "ok" else "degraded",
            "db": db_status,
            "tools": [
                "sa4_get_case_context",
                "sa4_extract_entity_structure",
                "sa4_run_screening_batch",
                "sa4_lookup_corporate_registry",
                "sa4_escalate_sanctions_hit",
                "sa4_compile_and_submit_kyc_brief",
                "sa4_park_for_hitl",
                "sa4_capture_rm_decisions",
                "sa4_complete_node",
            ],
        }
    )


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ---------------------------------------------------------------------------
# Server entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    mcp.run(transport=transport)
