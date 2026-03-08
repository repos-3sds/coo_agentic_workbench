"""
DCE Account Opening — MCP Server (SA-6)
=======================================
SA-6 MCP server hosting tools for the Static Configuration Agent.

SA-6 (Node N-5) — Static Configuration (Two-Phase HITL Execution):
  1. sa6_get_case_context          — Fetch case state, credit decisions, N-4 output,
                                     authorised traders, products, jurisdiction
  2. sa6_build_config_spec         — Build UBIX/SIC/CV config from credit decisions
                                     + product reference
                                     → INSERT dce_ao_config_spec
  3. sa6_generate_tmo_instruction  — Persist LLM-generated TMO instruction document
                                     → INSERT dce_ao_tmo_instruction
                                     → UPDATE dce_ao_config_spec status
  4. sa6_park_for_tmo_execution    — Atomic: HITL task + checkpoint + event log + case state
                                     → INSERT dce_ao_hitl_review_task
                                     → INSERT dce_ao_node_checkpoint (HITL_PENDING)
                                     → UPDATE dce_ao_case_state (HITL_PENDING)
  5. sa6_validate_system_config    — Validate UBIX/SIC/CV read-back vs instruction
                                     → INSERT dce_ao_system_validation (3 rows)
  6. sa6_complete_node             — Final checkpoint, advance to N-6 or escalate
                                     → REPLACE dce_ao_node_checkpoint (COMPLETE/FAILED)
                                     → UPDATE dce_ao_case_state
                                     → UPDATE dce_ao_config_spec status
                                     → INSERT dce_ao_event_log

Transport: StreamableHTTP (MCP protocol)
Port: 8004
Health: GET /health → {"status": "ok"}
MCP: POST /mcp (JSON-RPC 2.0)
"""

import json
import os
import random
import string
from datetime import datetime
from typing import Any, Optional

import pymysql
import pymysql.cursors
from mcp.server.fastmcp import FastMCP
from starlette.responses import JSONResponse
from starlette.routing import Route

# ─── Config ──────────────────────────────────────────────────────────────────
from config import DB_CONFIG, SA6_NODE_ID, SA6_NEXT_NODE, SA6_AGENT_MODEL

# ─── FastMCP app ─────────────────────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8004"))

mcp = FastMCP(
    "DCE-AO-SA6",
    instructions=(
        "DCE Account Opening MCP Server — SA-6 Static Configuration Agent tools. "
        "Handles two-phase execution: Phase 1 (build config spec from credit decisions "
        "+ generate TMO instruction + park for TMO Static team execution) and Phase 2 "
        "(validate system configuration read-back + node completion)."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=PORT,
)

# ─── Simulated downstream system data (local dev) ────────────────────────────
# In production these come from real UBIX/SIC/CV system APIs.
# For local dev we simulate the product reference and system read-back data.

_SIMULATED_UBIX_PRODUCTS = {
    "FUTURES": {
        "exchange_code": "SGX",
        "product_permission": "EXCHANGE_TRADED_DERIVATIVES",
        "regulatory_flag": "MAS_CMS",
        "reporting_jurisdiction": "SG",
        "margin_class": "SPAN",
    },
    "OPTIONS": {
        "exchange_code": "SGX",
        "product_permission": "EXCHANGE_TRADED_OPTIONS",
        "regulatory_flag": "MAS_CMS",
        "reporting_jurisdiction": "SG",
        "margin_class": "SPAN",
    },
    "OTC_DERIVATIVES": {
        "exchange_code": "OTC",
        "product_permission": "OTC_DERIVATIVES",
        "regulatory_flag": "ISDA_MASTER",
        "reporting_jurisdiction": "HK",
        "margin_class": "SIMM",
    },
    "COMMODITIES_PHYSICAL": {
        "exchange_code": "LME",
        "product_permission": "PHYSICAL_COMMODITIES",
        "regulatory_flag": "COMMODITY_BROKER",
        "reporting_jurisdiction": "UK",
        "margin_class": "FIXED_PCT",
    },
}

_SIMULATED_SIC_COMMISSION = {
    "FUTURES": {"base_rate_bps": 2.5, "clearing_fee_bps": 0.5, "exchange_fee_bps": 1.0},
    "OPTIONS": {"base_rate_bps": 3.0, "clearing_fee_bps": 0.5, "exchange_fee_bps": 1.5},
    "OTC_DERIVATIVES": {"base_rate_bps": 5.0, "clearing_fee_bps": 0.0, "exchange_fee_bps": 0.0},
    "COMMODITIES_PHYSICAL": {"base_rate_bps": 4.0, "clearing_fee_bps": 0.8, "exchange_fee_bps": 1.2},
}

_SIMULATED_CV_LIMITS = {
    "IRB": {"margin_multiplier": 1.0, "pce_haircut_pct": 5.0, "max_tenor_days": 365},
    "SA": {"margin_multiplier": 1.25, "pce_haircut_pct": 8.0, "max_tenor_days": 180},
}

# TMO Static workbench base URL
_WORKBENCH_BASE = "https://workbench.dce.internal/tmo-instructions"


# ─── DB helpers ──────────────────────────────────────────────────────────────

def _get_conn() -> pymysql.connections.Connection:
    return pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _gen_id(prefix: str, length: int = 6) -> str:
    """Generate a random ID like CSPEC-000001."""
    digits = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{digits}"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ─── Tool 1: sa6_get_case_context ────────────────────────────────────────────

@mcp.tool()
def sa6_get_case_context(case_id: str, phase: str = "PHASE1") -> dict[str, Any]:
    """
    Fetch the complete case context needed for SA-6 Static Configuration.

    Returns:
    - case_state: core case record (status, current_node, priority, jurisdiction)
    - credit_decisions: Credit Team decisions from SA-5 (outcome, limits, CAA, conditions)
    - n4_output: SA-5 node N-4 checkpoint output (credit brief summary)
    - classification_result: account_type, products_requested, entity_type
    - extracted_data: entity data from AO form (directors, UBOs, authorised traders)
    - authorised_traders: list of traders from mandate letter
    - rm_hierarchy: RM details
    - phase: PHASE1 (config spec build) | PHASE2 (validation after TMO execution)
    """
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Core case state
            cursor.execute(
                "SELECT * FROM dce_ao_case_state WHERE case_id = %s",
                (case_id,),
            )
            case_state = cursor.fetchone()
            if not case_state:
                return {"status": "error", "error": f"Case {case_id} not found"}

            # 2. Credit decisions from SA-5
            cursor.execute(
                "SELECT * FROM dce_ao_credit_decision WHERE case_id = %s",
                (case_id,),
            )
            credit_decisions = cursor.fetchone() or {}
            # Deserialise conditions JSON
            if credit_decisions.get("conditions") and isinstance(credit_decisions["conditions"], str):
                try:
                    credit_decisions["conditions"] = json.loads(credit_decisions["conditions"])
                except (json.JSONDecodeError, TypeError):
                    pass

            # 3. N-4 checkpoint output (SA-5 completion — credit brief + decisions)
            cursor.execute(
                "SELECT output_json FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-4' AND status = 'COMPLETE' "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            n4_row = cursor.fetchone()
            n4_output = {}
            if n4_row and n4_row.get("output_json"):
                try:
                    n4_output = json.loads(n4_row["output_json"])
                except (json.JSONDecodeError, TypeError):
                    n4_output = {}

            # 4. Classification result (products_requested, account_type, entity_type)
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

            # 5. Entity data from AO form OCR result (includes authorised traders)
            cursor.execute(
                """
                SELECT doc_id, detected_doc_type, extracted_text
                FROM dce_ao_document_ocr_result
                WHERE case_id = %s AND detected_doc_type = 'AO_FORM'
                ORDER BY processed_at DESC LIMIT 1
                """,
                (case_id,),
            )
            ao_row = cursor.fetchone()
            extracted_data = {}
            if ao_row and ao_row.get("extracted_text"):
                try:
                    extracted_data = json.loads(ao_row["extracted_text"])
                except (json.JSONDecodeError, TypeError):
                    extracted_data = {}

            # Extract authorised traders from AO form data
            authorised_traders = extracted_data.get("authorised_traders", [])

            # 6. RM hierarchy
            cursor.execute(
                "SELECT * FROM dce_ao_rm_hierarchy WHERE case_id = %s",
                (case_id,),
            )
            rm_hierarchy = cursor.fetchone() or {}

            # 7. If PHASE2, also fetch the existing config spec
            config_spec = {}
            tmo_instruction = {}
            if phase.upper() == "PHASE2":
                cursor.execute(
                    "SELECT * FROM dce_ao_config_spec WHERE case_id = %s "
                    "ORDER BY attempt_number DESC LIMIT 1",
                    (case_id,),
                )
                spec_row = cursor.fetchone()
                if spec_row:
                    config_spec = spec_row
                    for col in ("ubix_config", "sic_config", "cv_config",
                                "authorised_traders", "products_requested",
                                "kb_chunks_used"):
                        if config_spec.get(col) and isinstance(config_spec[col], str):
                            try:
                                config_spec[col] = json.loads(config_spec[col])
                            except (json.JSONDecodeError, TypeError):
                                pass

                    # Also fetch TMO instruction
                    cursor.execute(
                        "SELECT * FROM dce_ao_tmo_instruction WHERE spec_id = %s",
                        (config_spec.get("spec_id"),),
                    )
                    inst_row = cursor.fetchone()
                    if inst_row:
                        tmo_instruction = inst_row
                        if tmo_instruction.get("instruction_document") and isinstance(
                            tmo_instruction["instruction_document"], str
                        ):
                            try:
                                tmo_instruction["instruction_document"] = json.loads(
                                    tmo_instruction["instruction_document"]
                                )
                            except (json.JSONDecodeError, TypeError):
                                pass

            # Serialise datetime fields for JSON safety
            for field in ("sla_deadline", "created_at", "updated_at"):
                if isinstance(case_state.get(field), datetime):
                    case_state[field] = case_state[field].strftime("%Y-%m-%d %H:%M:%S")
            if credit_decisions.get("decided_at") and isinstance(
                credit_decisions["decided_at"], datetime
            ):
                credit_decisions["decided_at"] = credit_decisions["decided_at"].strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            # Serialise datetimes in config_spec/tmo_instruction
            for obj in (config_spec, tmo_instruction):
                for key, val in list(obj.items()):
                    if isinstance(val, datetime):
                        obj[key] = val.strftime("%Y-%m-%d %H:%M:%S")

        return {
            "status": "success",
            "phase": phase,
            "case_state": case_state,
            "credit_decisions": credit_decisions,
            "n4_output": n4_output,
            "classification_result": classification_result,
            "extracted_data": extracted_data,
            "authorised_traders": authorised_traders,
            "rm_hierarchy": rm_hierarchy,
            "config_spec": config_spec,
            "tmo_instruction": tmo_instruction,
        }
    finally:
        conn.close()


# ─── Tool 2: sa6_build_config_spec ───────────────────────────────────────────

@mcp.tool()
def sa6_build_config_spec(
    case_id: str,
    entity_name: str,
    entity_type: str,
    jurisdiction: str,
    lei_number: str,
    products_requested: list[str],
    credit_outcome: str,
    approved_dce_limit_sgd: float,
    approved_dce_pce_limit_sgd: float,
    confirmed_caa_approach: str,
    authorised_traders: list[dict[str, Any]],
    conditions: Optional[list[dict[str, Any]]] = None,
    kb_chunks_used: Optional[list[str]] = None,
    compiled_by_model: str = "",
) -> dict[str, Any]:
    """
    Build the UBIX/SIC/CV configuration specification from credit decisions
    and product reference data.

    Generates:
    - ubix_config: entity static data, product permissions, regulatory flags
    - sic_config: account mapping, commission rates, credit limits, margin parameters
    - cv_config: credit limits, margin rates, settlement parameters
    - authorised_traders: formatted trader list with permissions

    Writes: dce_ao_config_spec (1 row)
    Returns: spec_id, ubix_config, sic_config, cv_config, status
    """
    spec_id = _gen_id("CSPEC")
    compiled_model = compiled_by_model or SA6_AGENT_MODEL
    caa = confirmed_caa_approach.upper()
    cv_params = _SIMULATED_CV_LIMITS.get(caa, _SIMULATED_CV_LIMITS["SA"])
    now = _now()

    # Build UBIX config
    ubix_product_permissions = []
    for product in products_requested:
        prod_ref = _SIMULATED_UBIX_PRODUCTS.get(product, {})
        ubix_product_permissions.append({
            "product": product,
            "exchange_code": prod_ref.get("exchange_code", "UNKNOWN"),
            "permission_code": prod_ref.get("product_permission", "UNKNOWN"),
            "regulatory_flag": prod_ref.get("regulatory_flag", ""),
            "reporting_jurisdiction": prod_ref.get("reporting_jurisdiction", jurisdiction[:2]),
            "margin_class": prod_ref.get("margin_class", "SPAN"),
        })

    ubix_config = {
        "entity_name": entity_name,
        "entity_type": entity_type,
        "lei_number": lei_number,
        "jurisdiction": jurisdiction,
        "regulatory_flags": list({p.get("regulatory_flag", "") for p in ubix_product_permissions if p.get("regulatory_flag")}),
        "product_permissions": ubix_product_permissions,
        "customer_static_data": {
            "reporting_jurisdiction": jurisdiction[:2] if jurisdiction else "SG",
            "caa_approach": caa,
            "kyc_status": "CLEARED",
        },
    }

    # Build SIC config
    sic_commission_rates = {}
    for product in products_requested:
        rates = _SIMULATED_SIC_COMMISSION.get(product, {"base_rate_bps": 3.0, "clearing_fee_bps": 0.5, "exchange_fee_bps": 1.0})
        sic_commission_rates[product] = rates

    sic_config = {
        "account_mapping": f"SIC-{case_id}",
        "product_permissions": products_requested,
        "commission_rates": sic_commission_rates,
        "credit_limits": {
            "dce_limit_sgd": approved_dce_limit_sgd,
            "dce_pce_limit_sgd": approved_dce_pce_limit_sgd,
        },
        "margin_parameters": {
            "margin_multiplier": cv_params["margin_multiplier"],
            "pce_haircut_pct": cv_params["pce_haircut_pct"],
        },
    }

    # Build CV config
    cv_config = {
        "contract_mapping": f"CV-{case_id}",
        "credit_limit_sgd": approved_dce_limit_sgd,
        "pce_limit_sgd": approved_dce_pce_limit_sgd,
        "caa_approach": caa,
        "margin_rates": {
            "margin_multiplier": cv_params["margin_multiplier"],
            "pce_haircut_pct": cv_params["pce_haircut_pct"],
            "max_tenor_days": cv_params["max_tenor_days"],
        },
        "settlement_account": f"SETTLE-{case_id}",
        "static_data_linkage": f"UBIX-{case_id}",
    }

    # Format authorised traders
    formatted_traders = []
    for trader in authorised_traders:
        formatted_traders.append({
            "name": trader.get("name", ""),
            "designation": trader.get("designation", ""),
            "id_number": trader.get("id_number", ""),
            "cqg_perms": "FULL_TRADING",
            "idb_perms": "FULL_TRADING",
        })

    # Persist to DB
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dce_ao_config_spec
                    (spec_id, case_id, attempt_number,
                     ubix_config, sic_config, cv_config,
                     authorised_traders,
                     status, credit_outcome,
                     approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
                     confirmed_caa_approach, products_requested,
                     compiled_by_model, kb_chunks_used, compiled_at)
                VALUES
                    (%s, %s, %s,
                     %s, %s, %s,
                     %s,
                     %s, %s,
                     %s, %s,
                     %s, %s,
                     %s, %s, %s)
                """,
                (
                    spec_id, case_id, 1,
                    json.dumps(ubix_config), json.dumps(sic_config), json.dumps(cv_config),
                    json.dumps(formatted_traders),
                    "DRAFT", credit_outcome,
                    approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
                    caa, json.dumps(products_requested),
                    compiled_model, json.dumps(kb_chunks_used or []), now,
                ),
            )
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "spec_id": spec_id,
        "case_id": case_id,
        "ubix_config": ubix_config,
        "sic_config": sic_config,
        "cv_config": cv_config,
        "authorised_traders": formatted_traders,
        "config_status": "DRAFT",
        "products_configured": len(products_requested),
        "traders_configured": len(formatted_traders),
    }


# ─── Tool 3: sa6_generate_tmo_instruction ────────────────────────────────────

@mcp.tool()
def sa6_generate_tmo_instruction(
    case_id: str,
    spec_id: str,
    instruction_document: dict[str, Any],
    generated_by_model: str = "",
) -> dict[str, Any]:
    """
    Persist the LLM-generated TMO instruction document.

    The instruction_document should contain structured sections:
    - ubix_instructions: step-by-step UBIX setup instructions
    - sic_instructions: SIC mapping and commission setup
    - cv_instructions: CV limit and margin setup
    - trader_setup: authorised trader configuration steps
    - validation_checklist: post-execution validation items

    Writes:
    - dce_ao_tmo_instruction (1 row)
    - UPDATE dce_ao_config_spec status → INSTRUCTION_GENERATED

    Returns: instruction_id, instruction_url, config_spec_status
    """
    instruction_id = _gen_id("TINST")
    instruction_url = f"{_WORKBENCH_BASE}/{instruction_id}"
    gen_model = generated_by_model or SA6_AGENT_MODEL
    now = _now()

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Insert TMO instruction
            cursor.execute(
                """
                INSERT INTO dce_ao_tmo_instruction
                    (instruction_id, case_id, spec_id,
                     instruction_document, instruction_url,
                     status, generated_by_model, generated_at)
                VALUES
                    (%s, %s, %s,
                     %s, %s,
                     %s, %s, %s)
                """,
                (
                    instruction_id, case_id, spec_id,
                    json.dumps(instruction_document), instruction_url,
                    "GENERATED", gen_model, now,
                ),
            )

            # 2. Update config spec status
            cursor.execute(
                """
                UPDATE dce_ao_config_spec
                SET status = 'INSTRUCTION_GENERATED', updated_at = %s
                WHERE spec_id = %s
                """,
                (now, spec_id),
            )

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "instruction_id": instruction_id,
        "instruction_url": instruction_url,
        "config_spec_status": "INSTRUCTION_GENERATED",
        "message": (
            f"TMO instruction {instruction_id} generated for spec {spec_id}. "
            f"Posted to TMO Static workbench: {instruction_url}"
        ),
    }


# ─── Tool 4: sa6_park_for_tmo_execution ──────────────────────────────────────

@mcp.tool()
def sa6_park_for_tmo_execution(
    case_id: str,
    spec_id: str,
    instruction_id: str,
    instruction_url: str,
    rm_id: str,
    priority: str,
    hitl_deadline: str,
) -> dict[str, Any]:
    """
    Atomic operation: create HITL task for TMO Static team + park the workflow.

    Writes:
    1. dce_ao_hitl_review_task  (task_type=TMO_STATIC_REVIEW, persona=TMO_STATIC)
    2. dce_ao_node_checkpoint   (status=HITL_PENDING for N-5)
    3. dce_ao_event_log         (TMO_INSTRUCTION_SENT)
    4. dce_ao_case_state        (status=HITL_PENDING)
    5. dce_ao_tmo_instruction   (status=SENT_TO_TMO)

    Returns: hitl_task_id, case_status, checkpoint_written, next_action
    """
    hitl_task_id = _gen_id("HITL")
    now = _now()

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. HITL task for TMO Static team
            cursor.execute(
                """
                INSERT INTO dce_ao_hitl_review_task
                    (task_id, case_id, node_id, task_type, assigned_persona,
                     assigned_to_id, priority, task_payload,
                     deadline, status, created_at)
                VALUES
                    (%s, %s, %s, %s, %s,
                     %s, %s, %s,
                     %s, %s, %s)
                """,
                (
                    hitl_task_id, case_id, SA6_NODE_ID, "TMO_STATIC_REVIEW", "TMO_STATIC",
                    rm_id, priority,
                    json.dumps({
                        "spec_id": spec_id,
                        "instruction_id": instruction_id,
                        "instruction_url": instruction_url,
                        "instructions": (
                            "Execute the TMO Static instruction in UBIX, SIC, and CV systems. "
                            "Create the account, set product permissions, commission rates, "
                            "credit limits, and configure authorised traders. "
                            "Confirm completion in the TMO workbench."
                        ),
                    }),
                    hitl_deadline, "PENDING", now,
                ),
            )

            # 2. N-5 checkpoint (HITL_PENDING)
            cursor.execute(
                """
                INSERT INTO dce_ao_node_checkpoint
                    (case_id, node_id, attempt_number, status,
                     input_snapshot, output_json,
                     started_at, next_node, retry_count, agent_model)
                VALUES
                    (%s, %s, %s, %s,
                     %s, %s,
                     %s, %s, %s, %s)
                """,
                (
                    case_id, SA6_NODE_ID, 1, "HITL_PENDING",
                    json.dumps({"spec_id": spec_id, "instruction_id": instruction_id}),
                    json.dumps({
                        "spec_id": spec_id,
                        "instruction_id": instruction_id,
                        "hitl_task_id": hitl_task_id,
                        "case_status": "HITL_PENDING",
                        "next_action": "TMO_STATIC_EXECUTION",
                    }),
                    now, SA6_NEXT_NODE, 0, SA6_AGENT_MODEL,
                ),
            )

            # 3. Event log
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, "TMO_INSTRUCTION_SENT", "sa6_park_for_tmo_execution",
                    json.dumps({
                        "node_id": SA6_NODE_ID,
                        "hitl_task_id": hitl_task_id,
                        "spec_id": spec_id,
                        "instruction_id": instruction_id,
                        "assigned_persona": "TMO_STATIC",
                        "priority": priority,
                    }),
                    now,
                ),
            )

            # 4. Case state → HITL_PENDING
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

            # 5. TMO instruction status → SENT_TO_TMO
            cursor.execute(
                """
                UPDATE dce_ao_tmo_instruction
                SET status = 'SENT_TO_TMO'
                WHERE instruction_id = %s
                """,
                (instruction_id,),
            )

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "hitl_task_id": hitl_task_id,
        "case_status": "HITL_PENDING",
        "checkpoint_written": True,
        "next_action": "TMO_STATIC_EXECUTION",
        "assigned_persona": "TMO_STATIC",
        "instruction_url": instruction_url,
    }


# ─── Tool 5: sa6_validate_system_config ──────────────────────────────────────

@mcp.tool()
def sa6_validate_system_config(
    case_id: str,
    spec_id: str,
    system_confirmations: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """
    Validate UBIX/SIC/CV system read-back values against the config specification.

    In production: reads actual configured values from each system API.
    In local dev: uses simulated read-back based on the config spec with optional
    overrides from system_confirmations to test discrepancy scenarios.

    Writes: dce_ao_system_validation (1 row per system = 3 rows)
    Updates: dce_ao_config_spec status → TMO_VALIDATED or TMO_DISCREPANCY_FOUND

    Returns: validation_summary, per_system_results, overall_status
    """
    now = _now()
    confirmations = system_confirmations or {}

    # Fetch the config spec
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM dce_ao_config_spec WHERE spec_id = %s",
                (spec_id,),
            )
            spec = cursor.fetchone()
            if not spec:
                return {"status": "error", "error": f"Config spec {spec_id} not found"}

            # Parse JSON columns
            ubix_config = json.loads(spec["ubix_config"]) if isinstance(spec.get("ubix_config"), str) else (spec.get("ubix_config") or {})
            sic_config = json.loads(spec["sic_config"]) if isinstance(spec.get("sic_config"), str) else (spec.get("sic_config") or {})
            cv_config = json.loads(spec["cv_config"]) if isinstance(spec.get("cv_config"), str) else (spec.get("cv_config") or {})

        # ── Simulate system read-back & validate ──────────────────────────────
        per_system_results = []
        all_pass = True

        for system_name, instructed_config in [
            ("UBIX", ubix_config),
            ("SIC", sic_config),
            ("CV", cv_config),
        ]:
            # Simulated read-back: by default mirrors the instruction (all pass)
            # Use system_confirmations overrides to inject discrepancies for testing
            sys_overrides = confirmations.get(system_name, {})
            configured_values = {**instructed_config, **sys_overrides}

            # Compare field by field
            discrepancies = []
            fields_checked = 0
            fields_passed = 0
            fields_failed = 0

            for field, expected_val in instructed_config.items():
                fields_checked += 1
                actual_val = configured_values.get(field)

                # Deep comparison for nested dicts/lists
                if json.dumps(expected_val, sort_keys=True, default=str) == json.dumps(actual_val, sort_keys=True, default=str):
                    fields_passed += 1
                else:
                    fields_failed += 1
                    discrepancies.append({
                        "field": field,
                        "expected": expected_val,
                        "actual": actual_val,
                        "severity": "HIGH" if field in ("credit_limit_sgd", "pce_limit_sgd", "credit_limits", "commission_rates") else "MEDIUM",
                    })

            validation_status = "PASS" if fields_failed == 0 else "FAIL"
            if validation_status == "FAIL":
                all_pass = False

            per_system_results.append({
                "system_name": system_name,
                "validation_status": validation_status,
                "fields_checked": fields_checked,
                "fields_passed": fields_passed,
                "fields_failed": fields_failed,
                "discrepancies": discrepancies,
            })

            # Write validation row
            cursor_write = conn.cursor()
            try:
                cursor_write.execute(
                    """
                    INSERT INTO dce_ao_system_validation
                        (case_id, spec_id, system_name,
                         validation_status, fields_checked, fields_passed, fields_failed,
                         discrepancies, configured_values, validated_at)
                    VALUES
                        (%s, %s, %s,
                         %s, %s, %s, %s,
                         %s, %s, %s)
                    """,
                    (
                        case_id, spec_id, system_name,
                        validation_status, fields_checked, fields_passed, fields_failed,
                        json.dumps(discrepancies), json.dumps(configured_values), now,
                    ),
                )
            finally:
                cursor_write.close()

        # Update config spec status
        overall_status = "TMO_VALIDATED" if all_pass else "TMO_DISCREPANCY_FOUND"
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE dce_ao_config_spec
                SET status = %s, updated_at = %s
                WHERE spec_id = %s
                """,
                (overall_status, now, spec_id),
            )

        conn.commit()
    finally:
        conn.close()

    total_discrepancies = sum(r["fields_failed"] for r in per_system_results)

    return {
        "status": "success",
        "overall_status": overall_status,
        "all_systems_pass": all_pass,
        "systems_validated": len(per_system_results),
        "total_discrepancies": total_discrepancies,
        "per_system_results": per_system_results,
        "validation_summary": {
            "UBIX": next((r["validation_status"] for r in per_system_results if r["system_name"] == "UBIX"), "N/A"),
            "SIC": next((r["validation_status"] for r in per_system_results if r["system_name"] == "SIC"), "N/A"),
            "CV": next((r["validation_status"] for r in per_system_results if r["system_name"] == "CV"), "N/A"),
        },
    }


# ─── Tool 6: sa6_complete_node ───────────────────────────────────────────────

@mcp.tool()
def sa6_complete_node(
    case_id: str,
    outcome: str,
    spec_id: str,
    instruction_id: str,
    n5_output: dict[str, Any],
    hitl_task_id: str = "",
    failure_reason: Optional[str] = None,
) -> dict[str, Any]:
    """
    Finalise SA-6 execution: write checkpoint, update case state, fire event.

    Outcomes:
      TMO_VALIDATED          → checkpoint COMPLETE, case ACTIVE/N-6, event TMO_CONFIG_COMPLETE
      TMO_DISCREPANCY_FOUND  → checkpoint FAILED, case ESCALATED, event TMO_DISCREPANCY_ESCALATED

    Writes:
    - REPLACE INTO dce_ao_node_checkpoint (N-5, attempt 1)
    - UPDATE dce_ao_case_state (status, current_node, hitl_queue)
    - UPDATE dce_ao_tmo_instruction status
    - INSERT dce_ao_event_log (NODE_COMPLETED + outcome event)
    - UPDATE dce_ao_hitl_review_task status → DECIDED (if hitl_task_id provided)
    """
    valid_outcomes = {"TMO_VALIDATED", "TMO_DISCREPANCY_FOUND"}
    if outcome not in valid_outcomes:
        return {
            "status": "error",
            "error": f"Invalid outcome: {outcome}. Must be one of {valid_outcomes}",
        }

    is_validated = outcome == "TMO_VALIDATED"
    checkpoint_status = "COMPLETE" if is_validated else "FAILED"
    next_node = SA6_NEXT_NODE if is_validated else SA6_NODE_ID  # stay at N-5 for retry
    case_status = "ACTIVE" if is_validated else "ESCALATED"
    event_type = "TMO_CONFIG_COMPLETE" if is_validated else "TMO_DISCREPANCY_ESCALATED"
    tmo_status = "TMO_COMPLETED" if is_validated else "TMO_FAILED"
    now = _now()

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Checkpoint — REPLACE INTO handles HITL_PENDING → COMPLETE transitions
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
                     (SELECT MIN(started_at) FROM (
                         SELECT started_at FROM dce_ao_node_checkpoint
                         WHERE case_id = %s AND node_id = %s
                     ) AS _sub),
                     %s, NULL,
                     %s, %s, %s, %s, %s)
                """,
                (
                    case_id, SA6_NODE_ID, 1, checkpoint_status,
                    json.dumps({"spec_id": spec_id, "instruction_id": instruction_id}),
                    json.dumps(n5_output),
                    case_id, SA6_NODE_ID,
                    now,
                    next_node,
                    failure_reason,
                    0, SA6_AGENT_MODEL,
                    json.dumps({"input": 0, "output": 0, "total": 0}),
                ),
            )

            # 2. Update case state
            cursor.execute(
                """
                UPDATE dce_ao_case_state
                SET status = %s,
                    current_node = %s,
                    hitl_queue = NULL,
                    updated_at = %s
                WHERE case_id = %s
                """,
                (case_status, next_node, now, case_id),
            )

            # 3. Update TMO instruction status
            cursor.execute(
                """
                UPDATE dce_ao_tmo_instruction
                SET status = %s
                WHERE instruction_id = %s
                """,
                (tmo_status, instruction_id),
            )

            # 4. Event log: NODE_COMPLETED
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, "NODE_COMPLETED", "sa6_complete_node",
                    json.dumps({
                        "node_id": SA6_NODE_ID,
                        "outcome": outcome,
                        "next_node": next_node,
                        "spec_id": spec_id,
                        "instruction_id": instruction_id,
                    }),
                    now,
                ),
            )

            # 5. Event log: outcome-specific event
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, event_type, "sa6_complete_node",
                    json.dumps({
                        "spec_id": spec_id,
                        "instruction_id": instruction_id,
                        "validation_status": outcome,
                        "next_node": next_node,
                        "failure_reason": failure_reason,
                    }),
                    now,
                ),
            )

            # 6. Close HITL task if provided
            if hitl_task_id:
                cursor.execute(
                    """
                    UPDATE dce_ao_hitl_review_task
                    SET status = 'DECIDED', decided_at = %s
                    WHERE task_id = %s
                    """,
                    (now, hitl_task_id),
                )

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "outcome": outcome,
        "checkpoint_status": checkpoint_status,
        "next_node": next_node,
        "case_status": case_status,
        "checkpoint_written": True,
        "event_published": True,
        "event_type": event_type,
        "tmo_instruction_status": tmo_status,
    }


# ─── Health endpoint & routing ────────────────────────────────────────────────

async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-sa6-static-configuration", "port": PORT})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    print(f"[SA-6] Starting DCE Static Configuration MCP Server on port {PORT} (transport={transport})")
    mcp.run(transport=transport)
