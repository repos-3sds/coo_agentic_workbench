"""
DCE Account Opening — MCP Server (SA-5)
=======================================
SA-5 MCP server hosting tools for the Credit Preparation Agent.

SA-5 (Node N-4) — Credit Preparation (Two-Phase HITL Execution):
  1. sa5_get_case_context          — Fetch case state, N-3 output, RM KYC decisions,
                                     classification, financial doc IDs, and RM hierarchy
  2. sa5_extract_financial_data    — Simulated extraction of financial metrics from
                                     audited statements; calculate credit ratios
                                     → INSERT dce_ao_financial_extract (1 row/year/doc)
  3. sa5_compile_credit_brief      — Build 10-section credit brief; post to Credit Team
                                     workbench queue
                                     → INSERT dce_ao_credit_brief
  4. sa5_park_for_credit_review    — Atomic: HITL task + HITL_PENDING checkpoint + event log
                                     → INSERT dce_ao_hitl_review_task
                                     → INSERT dce_ao_node_checkpoint (HITL_PENDING)
                                     → UPDATE dce_ao_case_state (HITL_PENDING)
  5. sa5_capture_credit_decisions  — Validate + persist all mandatory Credit Team decisions
                                     → INSERT dce_ao_credit_decision
  6. sa5_complete_node             — Final checkpoint + state advance to N-5
                                     → REPLACE INTO dce_ao_node_checkpoint (COMPLETE/FAILED)
                                     → UPDATE dce_ao_case_state
                                     → UPDATE dce_ao_credit_brief (credit_outcome_flag)
                                     → INSERT dce_ao_event_log (CREDIT_APPROVED / CREDIT_DECLINED)

Transport: StreamableHTTP (MCP protocol)
Port: 8003
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
from config import DB_CONFIG, SA5_NODE_ID, SA5_NEXT_NODE, SA5_AGENT_MODEL

# ─── FastMCP app ─────────────────────────────────────────────────────────────
PORT = int(os.getenv("PORT", "8003"))

mcp = FastMCP(
    "DCE-AO-SA5",
    instructions=(
        "DCE Account Opening MCP Server — SA-5 Credit Preparation Agent tools. "
        "Handles two-phase execution: Phase 1 (financial extraction + credit brief "
        "compilation + park for Credit Team review) and Phase 2 (credit decision "
        "capture + node completion)."
    ),
    host=os.getenv("HOST", "0.0.0.0"),
    port=PORT,
)

# ─── Simulated financial data (local dev — replaces Document API) ─────────────
# In production these come from audited financial statements via Document API
_SIMULATED_FINANCIALS = {
    # doc_id → {fiscal_year: {financial fields}}
    "DOC-000302": {   # Meridian 2024 FS
        2024: {
            "total_equity": 45_000_000.0, "net_asset_value": 47_200_000.0,
            "total_debt": 5_000_000.0, "current_assets": 38_000_000.0,
            "current_liabilities": 8_000_000.0, "revenue": 12_500_000.0,
            "net_profit": 3_800_000.0, "existing_debt_obligations": 1_200_000.0,
            "currency": "SGD", "extraction_confidence": 0.94,
        }
    },
    "DOC-000303": {   # Meridian 2023 FS
        2023: {
            "total_equity": 40_000_000.0, "net_asset_value": 42_100_000.0,
            "total_debt": 4_500_000.0, "current_assets": 33_000_000.0,
            "current_liabilities": 7_200_000.0, "revenue": 11_000_000.0,
            "net_profit": 3_200_000.0, "existing_debt_obligations": 1_000_000.0,
            "currency": "SGD", "extraction_confidence": 0.93,
        }
    },
    "DOC-000304": {   # Meridian 2022 FS
        2022: {
            "total_equity": 35_500_000.0, "net_asset_value": 37_000_000.0,
            "total_debt": 4_000_000.0, "current_assets": 28_500_000.0,
            "current_liabilities": 6_500_000.0, "revenue": 9_800_000.0,
            "net_profit": 2_700_000.0, "existing_debt_obligations": 800_000.0,
            "currency": "SGD", "extraction_confidence": 0.91,
        }
    },
    "DOC-000312": {   # Pacific Horizon 2024 FS (HKD → SGD approx 0.172)
        2024: {
            "total_equity": 120_000_000.0, "net_asset_value": 125_000_000.0,
            "total_debt": 35_000_000.0, "current_assets": 95_000_000.0,
            "current_liabilities": 28_000_000.0, "revenue": 42_000_000.0,
            "net_profit": 9_800_000.0, "existing_debt_obligations": 15_000_000.0,
            "currency": "HKD", "extraction_confidence": 0.91,
        }
    },
    "DOC-000313": {   # Pacific Horizon 2023 FS
        2023: {
            "total_equity": 108_000_000.0, "net_asset_value": 112_000_000.0,
            "total_debt": 30_000_000.0, "current_assets": 82_000_000.0,
            "current_liabilities": 25_000_000.0, "revenue": 38_500_000.0,
            "net_profit": 8_200_000.0, "existing_debt_obligations": 13_000_000.0,
            "currency": "HKD", "extraction_confidence": 0.89,
        }
    },
}

# FX rates to SGD (local dev approximation)
_FX_TO_SGD = {
    "SGD": 1.0,
    "HKD": 0.172,
    "USD": 1.34,
    "EUR": 1.45,
    "GBP": 1.70,
}

# Simulated Credit Team workbench base URL
_WORKBENCH_BASE = "https://workbench.dce.internal/credit-briefs"


# ─── DB helpers ──────────────────────────────────────────────────────────────

def _get_conn() -> pymysql.connections.Connection:
    return pymysql.connect(
        **DB_CONFIG,
        cursorclass=pymysql.cursors.DictCursor,
    )


def _gen_id(prefix: str, length: int = 6) -> str:
    """Generate a random ID like CBRIEF-000001."""
    digits = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{digits}"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


# ─── Tool 1: sa5_get_case_context ────────────────────────────────────────────

@mcp.tool()
def sa5_get_case_context(case_id: str, phase: str = "PHASE1") -> dict[str, Any]:
    """
    Fetch the complete case context needed for SA-5 Credit Preparation.

    Returns:
    - case_state: core case record (status, current_node, priority, rm_id, jurisdiction, etc.)
    - rm_hierarchy: RM details (name, email, branch, manager)
    - classification_result: account_type, products_requested, entity_type
    - rm_kyc_decisions: completed RM decisions from SA-4 (read-only)
    - n3_output: SA-4 node N-3 checkpoint output (KYC brief summary)
    - financial_doc_ids: list of financial statement doc IDs available for extraction
    - extracted_data: entity data from AO form (directors, UBOs, entity name)
    - phase: PHASE1 (credit brief compilation) | PHASE2 (decision capture)
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

            # 2. RM hierarchy
            cursor.execute(
                "SELECT * FROM dce_ao_rm_hierarchy WHERE case_id = %s",
                (case_id,),
            )
            rm_hierarchy = cursor.fetchone() or {}

            # 3. Classification result (products_requested, account_type, entity_type)
            cursor.execute(
                "SELECT * FROM dce_ao_classification_result WHERE case_id = %s "
                "ORDER BY classified_at DESC LIMIT 1",
                (case_id,),
            )
            classification_result = cursor.fetchone() or {}

            # Deserialise products_requested JSON string
            if classification_result.get("products_requested"):
                try:
                    if isinstance(classification_result["products_requested"], str):
                        classification_result["products_requested"] = json.loads(
                            classification_result["products_requested"]
                        )
                except (json.JSONDecodeError, TypeError):
                    pass

            # 4. RM KYC decisions from SA-4 (read-only)
            cursor.execute(
                "SELECT * FROM dce_ao_rm_kyc_decision WHERE case_id = %s",
                (case_id,),
            )
            rm_kyc_decisions = cursor.fetchone() or {}
            # Deserialise JSON columns
            for col in ("additional_conditions",):
                if rm_kyc_decisions.get(col) and isinstance(rm_kyc_decisions[col], str):
                    try:
                        rm_kyc_decisions[col] = json.loads(rm_kyc_decisions[col])
                    except (json.JSONDecodeError, TypeError):
                        pass
            # Convert bcap_clearance to Python bool (MariaDB stores as TINYINT)
            if "bcap_clearance" in rm_kyc_decisions:
                rm_kyc_decisions["bcap_clearance"] = bool(rm_kyc_decisions["bcap_clearance"])

            # 5. N-3 checkpoint output (SA-4 completion record)
            cursor.execute(
                "SELECT output_json FROM dce_ao_node_checkpoint "
                "WHERE case_id = %s AND node_id = 'N-3' AND status = 'COMPLETE' "
                "ORDER BY attempt_number DESC LIMIT 1",
                (case_id,),
            )
            n3_row = cursor.fetchone()
            n3_output = {}
            if n3_row and n3_row.get("output_json"):
                try:
                    n3_output = json.loads(n3_row["output_json"])
                except (json.JSONDecodeError, TypeError):
                    n3_output = {}

            # 6. Financial statement doc IDs (staged docs with financial FS filenames)
            cursor.execute(
                """
                SELECT doc_id, filename, file_size_bytes, storage_url
                FROM dce_ao_document_staged
                WHERE case_id = %s
                  AND (filename LIKE '%%FS%%'
                    OR filename LIKE '%%financial%%'
                    OR filename LIKE '%%Audited%%'
                    OR filename LIKE '%%Financial_Statement%%')
                ORDER BY filename DESC
                """,
                (case_id,),
            )
            financial_docs = cursor.fetchall() or []
            financial_doc_ids = [d["doc_id"] for d in financial_docs]

            # 7. Entity data from AO form OCR result
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

            # Serialise datetime fields in case_state for JSON safety
            for field in ("sla_deadline", "created_at", "updated_at"):
                if isinstance(case_state.get(field), datetime):
                    case_state[field] = case_state[field].strftime("%Y-%m-%d %H:%M:%S")

        return {
            "status": "success",
            "phase": phase,
            "case_state": case_state,
            "rm_hierarchy": rm_hierarchy,
            "classification_result": classification_result,
            "rm_kyc_decisions": rm_kyc_decisions,
            "n3_output": n3_output,
            "financial_doc_ids": financial_doc_ids,
            "financial_docs": financial_docs,
            "extracted_data": extracted_data,
        }
    finally:
        conn.close()


# ─── Tool 2: sa5_extract_financial_data ──────────────────────────────────────

@mcp.tool()
def sa5_extract_financial_data(
    case_id: str,
    credit_brief_id: str,
    financial_doc_ids: list[str],
    entity_name: str = "",
    jurisdiction: str = "SGD",
) -> dict[str, Any]:
    """
    Extract and calculate credit metrics from financial statement documents.

    In production: calls LLM node to OCR/parse financial statements from Document API.
    In local dev: uses simulated financial data from _SIMULATED_FINANCIALS lookup.

    For each (doc_id, fiscal_year):
      - Extracts raw financial fields
      - Applies FX conversion to SGD
      - Calculates leverage_ratio = total_debt / total_equity
      - Calculates liquidity_ratio = current_assets / current_liabilities
      - Writes dce_ao_financial_extract row

    Returns aggregated multi-year summary with YoY trend calculations.
    """
    extracts = []
    reporting_currency = "SGD"

    for doc_id in financial_doc_ids:
        sim = _SIMULATED_FINANCIALS.get(doc_id, {})
        if not sim:
            # Unknown doc — simulate basic stub
            sim = {
                datetime.now().year - 1: {
                    "total_equity": 10_000_000.0, "net_asset_value": 11_000_000.0,
                    "total_debt": 2_000_000.0, "current_assets": 8_000_000.0,
                    "current_liabilities": 3_000_000.0, "revenue": 5_000_000.0,
                    "net_profit": 1_000_000.0, "existing_debt_obligations": 500_000.0,
                    "currency": "SGD", "extraction_confidence": 0.75,
                }
            }

        for fiscal_year, fields in sim.items():
            reporting_currency = fields.get("currency", "SGD")
            fx = _FX_TO_SGD.get(reporting_currency, 1.0)

            total_equity = fields.get("total_equity", 0.0)
            total_debt = fields.get("total_debt", 0.0)
            current_assets = fields.get("current_assets", 0.0)
            current_liabilities = fields.get("current_liabilities", 1.0)  # avoid div/0
            revenue = fields.get("revenue", 0.0)
            net_profit = fields.get("net_profit", 0.0)

            leverage_ratio = round(total_debt / total_equity, 4) if total_equity else None
            liquidity_ratio = round(current_assets / current_liabilities, 4) if current_liabilities else None

            extracts.append({
                "doc_id": doc_id,
                "fiscal_year": fiscal_year,
                "fiscal_year_end_date": f"{fiscal_year}-12-31",
                "reporting_currency": reporting_currency,
                "total_equity": total_equity,
                "net_asset_value": fields.get("net_asset_value", total_equity),
                "total_debt": total_debt,
                "current_assets": current_assets,
                "current_liabilities": current_liabilities,
                "revenue": revenue,
                "net_profit": net_profit,
                "existing_debt_obligations": fields.get("existing_debt_obligations", 0.0),
                "fx_rate_to_sgd": fx,
                "total_equity_sgd": round(total_equity * fx, 2),
                "revenue_sgd": round(revenue * fx, 2),
                "net_profit_sgd": round(net_profit * fx, 2),
                "leverage_ratio": leverage_ratio,
                "liquidity_ratio": liquidity_ratio,
                "extraction_confidence": fields.get("extraction_confidence", 0.85),
                "extraction_notes": None,
                "extracted_by_model": SA5_AGENT_MODEL,
            })

    # Sort by fiscal year ascending
    extracts.sort(key=lambda x: x["fiscal_year"])

    # Persist to dce_ao_financial_extract
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            for e in extracts:
                cursor.execute(
                    """
                    INSERT IGNORE INTO dce_ao_financial_extract
                        (case_id, credit_brief_id, doc_id, fiscal_year, fiscal_year_end_date,
                         reporting_currency, total_equity, net_asset_value, total_debt,
                         current_assets, current_liabilities, revenue, net_profit,
                         existing_debt_obligations, fx_rate_to_sgd,
                         total_equity_sgd, revenue_sgd, net_profit_sgd,
                         leverage_ratio, liquidity_ratio,
                         extraction_confidence, extraction_notes, extracted_by_model,
                         extracted_at)
                    VALUES
                        (%s, %s, %s, %s, %s,
                         %s, %s, %s, %s,
                         %s, %s, %s, %s,
                         %s, %s,
                         %s, %s, %s,
                         %s, %s,
                         %s, %s, %s,
                         %s)
                    """,
                    (
                        case_id, credit_brief_id, e["doc_id"], e["fiscal_year"],
                        e["fiscal_year_end_date"],
                        e["reporting_currency"], e["total_equity"], e["net_asset_value"],
                        e["total_debt"], e["current_assets"], e["current_liabilities"],
                        e["revenue"], e["net_profit"], e["existing_debt_obligations"],
                        e["fx_rate_to_sgd"],
                        e["total_equity_sgd"], e["revenue_sgd"], e["net_profit_sgd"],
                        e["leverage_ratio"], e["liquidity_ratio"],
                        e["extraction_confidence"], e["extraction_notes"],
                        e["extracted_by_model"], _now(),
                    ),
                )
        conn.commit()
    finally:
        conn.close()

    # Build aggregated summary (most recent year as primary, YoY trends)
    summary: dict[str, Any] = {"years_analysed": len(extracts), "by_year": extracts}
    if extracts:
        latest = extracts[-1]  # Most recent (sorted asc, last = newest)
        summary["most_recent_year"] = latest["fiscal_year"]
        summary["total_equity_sgd"] = latest["total_equity_sgd"]
        summary["net_asset_value_sgd"] = round(
            latest.get("net_asset_value", latest["total_equity"]) * latest["fx_rate_to_sgd"], 2
        )
        summary["leverage_ratio"] = latest["leverage_ratio"]
        summary["liquidity_ratio"] = latest["liquidity_ratio"]
        summary["revenue_sgd"] = latest["revenue_sgd"]
        summary["net_profit_sgd"] = latest["net_profit_sgd"]

        # YoY revenue and profitability trends
        if len(extracts) >= 2:
            prev = extracts[-2]
            if prev["revenue_sgd"] and prev["revenue_sgd"] > 0:
                rev_trend = ((latest["revenue_sgd"] - prev["revenue_sgd"]) / prev["revenue_sgd"]) * 100
                summary["revenue_trend_pct"] = round(rev_trend, 2)
            else:
                summary["revenue_trend_pct"] = None

            if prev["net_profit_sgd"] and prev["net_profit_sgd"] > 0:
                profit_trend = (
                    (latest["net_profit_sgd"] - prev["net_profit_sgd"]) / prev["net_profit_sgd"]
                ) * 100
                summary["profitability_trend_pct"] = round(profit_trend, 2)
            else:
                summary["profitability_trend_pct"] = None
        else:
            summary["revenue_trend_pct"] = None
            summary["profitability_trend_pct"] = None

        # Estimated initial limit: conservative = 10% of total equity (simplified model)
        equity = summary["total_equity_sgd"] or 0
        summary["estimated_initial_limit_sgd"] = round(equity * 0.10, 2)

    return {
        "status": "success",
        "case_id": case_id,
        "credit_brief_id": credit_brief_id,
        "extracts_written": len(extracts),
        "financial_summary": summary,
    }


# ─── Tool 3: sa5_compile_credit_brief ────────────────────────────────────────

@mcp.tool()
def sa5_compile_credit_brief(
    case_id: str,
    entity_name: str,
    entity_type: str,
    jurisdiction: str,
    products_requested: list[str],
    rm_decisions: dict[str, Any],
    financial_summary: dict[str, Any],
    open_questions: Optional[list[str]] = None,
    comparable_benchmarks: Optional[dict[str, Any]] = None,
    kb_chunks_used: Optional[list[str]] = None,
    compiled_by_model: str = "",
) -> dict[str, Any]:
    """
    Compile the credit brief and post it to the Credit Team workbench queue.

    Writes a new record to dce_ao_credit_brief with:
    - Entity summary (name, type, jurisdiction)
    - Products requested + margin profiles (from KB-6)
    - RM recommendations (CAA, limits, OSCA)
    - Financial metrics (equity, NAV, leverage, liquidity, revenue trends)
    - Estimated initial limit
    - Open questions for Credit Team
    - Comparable benchmarks from KB-6

    Returns: credit_brief_id, brief_url, notification_sent
    """
    credit_brief_id = _gen_id("CBRIEF")
    brief_url = f"{_WORKBENCH_BASE}/{credit_brief_id}"
    compiled_model = compiled_by_model or SA5_AGENT_MODEL

    # Validate kyc_risk_rating — UNACCEPTABLE cases never reach SA-5
    kyc_risk_rating = rm_decisions.get("kyc_risk_rating", "MEDIUM")
    if kyc_risk_rating == "UNACCEPTABLE":
        return {
            "status": "error",
            "error": "KYC rating UNACCEPTABLE — case should not have reached SA-5. "
                     "This case was declined at SA-4.",
        }

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dce_ao_credit_brief
                    (credit_brief_id, case_id, attempt_number,
                     entity_legal_name, entity_type, jurisdiction,
                     products_requested,
                     caa_approach, recommended_dce_limit_sgd, recommended_dce_pce_limit_sgd,
                     osca_case_number, limit_exposure_indication, kyc_risk_rating,
                     financial_years_analysed,
                     total_equity_sgd, net_asset_value_sgd,
                     leverage_ratio, liquidity_ratio,
                     revenue_sgd, net_profit_sgd,
                     revenue_trend_pct, profitability_trend_pct,
                     estimated_initial_limit_sgd,
                     brief_url, open_questions, comparable_benchmarks,
                     credit_outcome_flag,
                     compiled_by_model, kb_chunks_used, compiled_at)
                VALUES
                    (%s, %s, %s,
                     %s, %s, %s,
                     %s,
                     %s, %s, %s,
                     %s, %s, %s,
                     %s,
                     %s, %s,
                     %s, %s,
                     %s, %s,
                     %s, %s,
                     %s,
                     %s, %s, %s,
                     'PENDING',
                     %s, %s, %s)
                """,
                (
                    credit_brief_id, case_id, 1,
                    entity_name, entity_type, jurisdiction,
                    json.dumps(products_requested),
                    rm_decisions.get("caa_approach", "IRB"),
                    rm_decisions.get("recommended_dce_limit_sgd", 0),
                    rm_decisions.get("recommended_dce_pce_limit_sgd", 0),
                    rm_decisions.get("osca_case_number", ""),
                    rm_decisions.get("limit_exposure_indication", ""),
                    kyc_risk_rating,
                    financial_summary.get("years_analysed", 0),
                    financial_summary.get("total_equity_sgd"),
                    financial_summary.get("net_asset_value_sgd"),
                    financial_summary.get("leverage_ratio"),
                    financial_summary.get("liquidity_ratio"),
                    financial_summary.get("revenue_sgd"),
                    financial_summary.get("net_profit_sgd"),
                    financial_summary.get("revenue_trend_pct"),
                    financial_summary.get("profitability_trend_pct"),
                    financial_summary.get("estimated_initial_limit_sgd"),
                    brief_url,
                    json.dumps(open_questions or []),
                    json.dumps(comparable_benchmarks or {}),
                    compiled_model,
                    json.dumps(kb_chunks_used or []),
                    _now(),
                ),
            )
        conn.commit()
    finally:
        conn.close()

    # Simulate posting to Credit Team workbench queue (stub HTTP call)
    notification_sent = True

    return {
        "status": "success",
        "credit_brief_id": credit_brief_id,
        "brief_url": brief_url,
        "notification_sent": notification_sent,
        "workbench_queue": "CREDIT_REVIEW",
        "message": (
            f"Credit brief {credit_brief_id} compiled for {entity_name}. "
            f"Posted to Credit Team workbench queue. Brief URL: {brief_url}"
        ),
    }


# ─── Tool 4: sa5_park_for_credit_review ──────────────────────────────────────

@mcp.tool()
def sa5_park_for_credit_review(
    case_id: str,
    credit_brief_id: str,
    rm_id: str,
    priority: str,
    brief_url: str,
    hitl_deadline: str,
) -> dict[str, Any]:
    """
    Atomic operation: create HITL task for Credit Team + park the workflow.

    Writes:
    1. dce_ao_hitl_review_task  (task_type=CREDIT_REVIEW, persona=CREDIT)
    2. dce_ao_node_checkpoint   (status=HITL_PENDING for N-4)
    3. dce_ao_event_log         (CREDIT_REVIEW_REQUESTED)
    4. dce_ao_case_state        (status=HITL_PENDING, hitl_queue=[task_id])

    Returns: hitl_task_id, case_status, checkpoint_written, next_action
    """
    hitl_task_id = _gen_id("HITL")
    now = _now()

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. HITL task for Credit Team
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
                    hitl_task_id, case_id, SA5_NODE_ID, "CREDIT_REVIEW", "CREDIT_TEAM",
                    rm_id, priority,
                    json.dumps({
                        "credit_brief_id": credit_brief_id,
                        "brief_url": brief_url,
                        "instructions": (
                            "Review the credit brief and provide: approved DCE limit (SGD), "
                            "approved DCE-PCE limit (SGD), confirm or adjust CAA approach "
                            "(IRB/SA), set any conditions, and submit APPROVED or DECLINED."
                        ),
                    }),
                    hitl_deadline, "PENDING", now,
                ),
            )

            # 2. N-4 checkpoint (HITL_PENDING)
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
                    case_id, SA5_NODE_ID, 1, "HITL_PENDING",
                    json.dumps({"credit_brief_id": credit_brief_id, "brief_url": brief_url}),
                    json.dumps({
                        "credit_brief_id": credit_brief_id,
                        "hitl_task_id": hitl_task_id,
                        "case_status": "HITL_PENDING",
                        "next_action": "CREDIT_TEAM_REVIEW",
                    }),
                    now, SA5_NEXT_NODE, 0, SA5_AGENT_MODEL,
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
                    case_id, "CREDIT_REVIEW_REQUESTED", "sa5_park_for_credit_review",
                    json.dumps({
                        "node_id": SA5_NODE_ID,
                        "hitl_task_id": hitl_task_id,
                        "credit_brief_id": credit_brief_id,
                        "assigned_persona": "CREDIT",
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

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "hitl_task_id": hitl_task_id,
        "case_status": "HITL_PENDING",
        "checkpoint_written": True,
        "next_action": "CREDIT_TEAM_REVIEW",
        "assigned_persona": "CREDIT_TEAM",
        "brief_url": brief_url,
    }


# ─── Tool 5: sa5_capture_credit_decisions ────────────────────────────────────

@mcp.tool()
def sa5_capture_credit_decisions(
    case_id: str,
    credit_brief_id: str,
    credit_decisions: dict[str, Any],
) -> dict[str, Any]:
    """
    Validate and persist Credit Team decisions.

    Mandatory fields in credit_decisions:
      - credit_outcome: APPROVED | APPROVED_WITH_CONDITIONS | DECLINED
      - approved_dce_limit_sgd: number (0 if declined)
      - approved_dce_pce_limit_sgd: number (0 if declined)
      - confirmed_caa_approach: IRB | SA
      - conditions: list (empty list if none)
      - credit_team_id: string
      - credit_team_name: string
      - decided_at: datetime string (YYYY-MM-DD HH:MM:SS or ISO 8601)

    Writes:
      - dce_ao_credit_decision (UNIQUE on case_id — one decision per case)

    Returns: decision_id, credit_outcome, decisions_stored, validation_status
    """
    # ── Validate mandatory fields ─────────────────────────────────────────────
    MANDATORY_FIELDS = [
        "credit_outcome",
        "approved_dce_limit_sgd",
        "approved_dce_pce_limit_sgd",
        "confirmed_caa_approach",
        "conditions",
        "credit_team_id",
        "credit_team_name",
        "decided_at",
    ]
    missing = [f for f in MANDATORY_FIELDS if f not in credit_decisions or
               (f not in ("conditions",) and credit_decisions[f] is None)]
    if missing:
        return {
            "status": "error",
            "validation_status": "INCOMPLETE",
            "missing_fields": missing,
            "message": f"Credit Team decision submission incomplete. Missing: {missing}",
        }

    # ── Validate enum values ───────────────────────────────────────────────────
    VALID_OUTCOMES = {"APPROVED", "APPROVED_WITH_CONDITIONS", "DECLINED"}
    VALID_CAA = {"IRB", "SA"}

    credit_outcome = str(credit_decisions.get("credit_outcome", "")).upper()
    if credit_outcome not in VALID_OUTCOMES:
        return {
            "status": "error",
            "validation_status": "INVALID_VALUE",
            "field": "credit_outcome",
            "message": f"credit_outcome must be one of {VALID_OUTCOMES}. Got: {credit_outcome}",
        }

    caa = str(credit_decisions.get("confirmed_caa_approach", "")).upper()
    if caa not in VALID_CAA:
        return {
            "status": "error",
            "validation_status": "INVALID_VALUE",
            "field": "confirmed_caa_approach",
            "message": f"confirmed_caa_approach must be one of {VALID_CAA}. Got: {caa}",
        }

    # ── Normalise decided_at to MariaDB DATETIME format ──────────────────────
    decided_at_raw = str(credit_decisions.get("decided_at", ""))
    try:
        # Handle ISO 8601 with timezone (e.g. 2026-03-10T10:00:00Z)
        decided_at_raw = decided_at_raw.replace("T", " ").replace("Z", "").split("+")[0].strip()
        decided_at = decided_at_raw[:19]  # Truncate to YYYY-MM-DD HH:MM:SS
    except Exception:
        decided_at = _now()

    conditions = credit_decisions.get("conditions", [])
    if not isinstance(conditions, list):
        conditions = []

    # ── Persist to DB ─────────────────────────────────────────────────────────
    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO dce_ao_credit_decision
                    (case_id, credit_brief_id,
                     credit_outcome, approved_dce_limit_sgd, approved_dce_pce_limit_sgd,
                     confirmed_caa_approach, conditions, decline_reason,
                     credit_team_id, credit_team_name, credit_team_email, decided_at)
                VALUES
                    (%s, %s,
                     %s, %s, %s,
                     %s, %s, %s,
                     %s, %s, %s, %s)
                """,
                (
                    case_id, credit_brief_id,
                    credit_outcome,
                    credit_decisions.get("approved_dce_limit_sgd", 0),
                    credit_decisions.get("approved_dce_pce_limit_sgd", 0),
                    caa,
                    json.dumps(conditions),
                    credit_decisions.get("decline_reason"),
                    credit_decisions.get("credit_team_id", ""),
                    credit_decisions.get("credit_team_name", ""),
                    credit_decisions.get("credit_team_email"),
                    decided_at,
                ),
            )
            decision_id = cursor.lastrowid
        conn.commit()
    finally:
        conn.close()

    return {
        "status": "success",
        "decision_id": decision_id,
        "credit_outcome": credit_outcome,
        "decisions_stored": True,
        "validation_status": "COMPLETE",
        "has_conditions": len(conditions) > 0,
        "conditions_count": len(conditions),
        "caa_approach": caa,
        "approved_dce_limit_sgd": credit_decisions.get("approved_dce_limit_sgd", 0),
        "approved_dce_pce_limit_sgd": credit_decisions.get("approved_dce_pce_limit_sgd", 0),
    }


# ─── Tool 6: sa5_complete_node ────────────────────────────────────────────────

@mcp.tool()
def sa5_complete_node(
    case_id: str,
    outcome: str,
    credit_brief_id: str,
    credit_decisions: dict[str, Any],
    n4_output: dict[str, Any],
    hitl_task_id: str = "",
    failure_reason: Optional[str] = None,
) -> dict[str, Any]:
    """
    Finalise SA-5 execution: write checkpoint, update case state, fire Kafka event.

    Outcomes:
      CREDIT_APPROVED         → checkpoint COMPLETE, case ACTIVE/N-5, Kafka CREDIT_APPROVED
      CREDIT_APPROVED_WITH_CONDITIONS → checkpoint COMPLETE, case ACTIVE/N-5, Kafka event
      CREDIT_DECLINED         → checkpoint FAILED, case ESCALATED/DEAD, no Kafka advance

    Writes:
    - REPLACE INTO dce_ao_node_checkpoint (N-4, attempt 1)
    - UPDATE dce_ao_case_state (status, current_node, hitl_queue)
    - UPDATE dce_ao_credit_brief (credit_outcome_flag)
    - INSERT dce_ao_event_log (NODE_COMPLETED + CREDIT_APPROVED or CREDIT_DECLINED)
    - INSERT dce_ao_hitl_review_task status → CLOSED (if hitl_task_id provided)
    """
    valid_outcomes = {
        "CREDIT_APPROVED",
        "CREDIT_APPROVED_WITH_CONDITIONS",
        "CREDIT_DECLINED",
    }
    if outcome not in valid_outcomes:
        return {
            "status": "error",
            "error": f"Invalid outcome: {outcome}. Must be one of {valid_outcomes}",
        }

    is_approved = outcome in ("CREDIT_APPROVED", "CREDIT_APPROVED_WITH_CONDITIONS")
    checkpoint_status = "COMPLETE" if is_approved else "FAILED"
    next_node = SA5_NEXT_NODE if is_approved else "DEAD"
    case_status = "ACTIVE" if is_approved else "ESCALATED"
    kafka_event_type = "CREDIT_APPROVED" if is_approved else "CREDIT_DECLINED"
    now = _now()

    # Map outcome to credit_outcome_flag enum
    outcome_flag_map = {
        "CREDIT_APPROVED": "APPROVED",
        "CREDIT_APPROVED_WITH_CONDITIONS": "APPROVED_WITH_CONDITIONS",
        "CREDIT_DECLINED": "DECLINED",
    }
    credit_outcome_flag = outcome_flag_map.get(outcome, "DECLINED")

    conn = _get_conn()
    try:
        with conn.cursor() as cursor:
            # 1. Checkpoint — REPLACE INTO handles both HITL_PENDING → COMPLETE transitions
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
                    case_id, SA5_NODE_ID, 1, checkpoint_status,
                    json.dumps({"hitl_task_id": hitl_task_id, "credit_decisions": credit_decisions}),
                    json.dumps(n4_output),
                    case_id, SA5_NODE_ID,
                    now,
                    next_node,
                    failure_reason,
                    0, SA5_AGENT_MODEL,
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

            # 3. Update credit brief outcome flag
            cursor.execute(
                """
                UPDATE dce_ao_credit_brief
                SET credit_outcome_flag = %s
                WHERE credit_brief_id = %s
                """,
                (credit_outcome_flag, credit_brief_id),
            )

            # 4. Event log: NODE_COMPLETED
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, "NODE_COMPLETED", "sa5_complete_node",
                    json.dumps({
                        "node_id": SA5_NODE_ID,
                        "outcome": outcome,
                        "next_node": next_node,
                        "credit_brief_id": credit_brief_id,
                    }),
                    now,
                ),
            )

            # 5. Event log: CREDIT_APPROVED or CREDIT_DECLINED
            cursor.execute(
                """
                INSERT INTO dce_ao_event_log
                    (case_id, event_type, triggered_by, event_payload, triggered_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    case_id, kafka_event_type, "sa5_complete_node",
                    json.dumps({
                        "credit_brief_id": credit_brief_id,
                        "credit_outcome": credit_outcome_flag,
                        "approved_dce_limit_sgd": credit_decisions.get("approved_dce_limit_sgd"),
                        "approved_dce_pce_limit_sgd": credit_decisions.get("approved_dce_pce_limit_sgd"),
                        "confirmed_caa_approach": credit_decisions.get("confirmed_caa_approach"),
                        "has_conditions": bool(credit_decisions.get("conditions")),
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
        "kafka_event_published": is_approved,
        "kafka_event_type": kafka_event_type,
        "credit_outcome_flag": credit_outcome_flag,
    }


# ─── Health endpoint & routing ────────────────────────────────────────────────

async def _health(request):
    return JSONResponse({"status": "ok", "service": "dce-sa5-credit-preparation", "port": PORT})


mcp.settings.streamable_http_path = "/mcp"
mcp._custom_starlette_routes.append(Route("/health", _health))


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "streamable-http")
    print(f"[SA-5] Starting DCE Credit Preparation MCP Server on port {PORT} (transport={transport})")
    mcp.run(transport=transport)
