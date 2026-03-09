"""
Risk Tools — 4 tools
Powers the Risk Agent: risk assessments, market factors, external parties.
Mirrors server/mcp/src/tools/risk.ts exactly.
"""
import json

from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# ─── Tool 1: risk_run_assessment ──────────────────────────────────

RUN_ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "risk_domains_json": {
            "type": "string",
            "description": "JSON string array of risk domain assessments. Each object requires: domain (e.g. CREDIT, MARKET, OPERATIONAL, LIQUIDITY, LEGAL, REPUTATIONAL, CYBER), status (one of PASS, FAIL, WARN), score (number 0-100). Optional: findings (comma-separated string). Example: [{\"domain\":\"CREDIT\",\"status\":\"PASS\",\"score\":80}]",
        },
        "overall_risk_rating": {"type": "string", "description": "Overall risk rating. Must be one of: LOW, MEDIUM, HIGH, CRITICAL"},
    },
    "required": ["project_id", "risk_domains_json", "overall_risk_rating"],
}


async def risk_run_assessment_handler(inp: dict) -> ToolResult:
    VALID_RESULTS = {"PASS", "FAIL", "WARNING"}

    # Accept risk_domains as JSON string or direct array
    domains_raw = inp.get("risk_domains_json") or inp.get("risk_domains", [])
    if isinstance(domains_raw, str):
        domains_raw = json.loads(domains_raw)
    # Normalize findings from string to list if needed
    for d in domains_raw:
        if isinstance(d.get("findings"), str):
            d["findings"] = [f.strip() for f in d["findings"].split(",") if f.strip()]

    results = []
    for domain in domains_raw:
        # Resilient field mapping: accept 'status' or 'level' for backward compatibility
        status = domain.get("status") or domain.get("level", "PASS")
        status = status.upper()
        # Map common values to DB-valid results
        if status not in VALID_RESULTS:
            status_map = {"HIGH": "WARNING", "CRITICAL": "FAIL", "LOW": "PASS",
                          "MEDIUM": "WARNING", "WARN": "WARNING", "OK": "PASS",
                          "APPLICABLE": "PASS", "NOT_APPLICABLE": "PASS"}
            status = status_map.get(status, "PASS")

        score = domain.get("score", 0)

        # Write to npa_risk_checks per architecture spec
        row_id = await execute(
            """INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by, checked_at)
               VALUES (%s, %s, %s, %s, %s, NOW())""",
            [inp["project_id"], domain["domain"], status,
             json.dumps(domain["findings"]) if domain.get("findings") else None,
             "RISK_AGENT"],
        )
        results.append({"id": row_id, "domain": domain["domain"], "status": status, "score": score})

    await execute(
        "UPDATE npa_projects SET risk_level = %s WHERE id = %s",
        [inp["overall_risk_rating"], inp["project_id"]],
    )

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "assessments": results,
        "overall_risk_rating": inp["overall_risk_rating"],
        "domains_assessed": len(results),
        "critical_domains": [d["domain"] for d in domains_raw if (d.get("status") or d.get("level", "")).upper() in ("FAIL", "HIGH", "CRITICAL")],
    })


# ─── Tool 2: risk_get_market_factors ──────────────────────────────

GET_MARKET_FACTORS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def risk_get_market_factors_handler(inp: dict) -> ToolResult:
    factors = await query(
        "SELECT * FROM npa_market_risk_factors WHERE project_id = %s ORDER BY risk_factor",
        [inp["project_id"]],
    )
    applicable = [f for f in factors if f.get("is_applicable")]
    uncaptured = [f for f in applicable if not f.get("var_capture") and not f.get("stress_capture")]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "factors": factors,
        "summary": {
            "total": len(factors),
            "applicable": len(applicable),
            "var_captured": sum(1 for f in applicable if f.get("var_capture")),
            "stress_captured": sum(1 for f in applicable if f.get("stress_capture")),
            "uncaptured_risks": [f["risk_factor"] for f in uncaptured],
        },
    })


# ─── Tool 3: risk_add_market_factor ───────────────────────────────

ADD_MARKET_FACTOR_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "risk_factor": {"type": "string", "description": "Risk factor type (e.g., IR_DELTA, FX_VEGA, CRYPTO_DELTA, EQ_DELTA, CREDIT_SPREAD)"},
        "is_applicable": {"type": "string", "description": "Whether this risk factor applies to the product. Use 'true' or 'false'"},
        "sensitivity_report": {"type": "string", "description": "Whether sensitivity report is available. Use 'true' or 'false'"},
        "var_capture": {"type": "string", "description": "Whether VaR model captures this risk. Use 'true' or 'false'"},
        "stress_capture": {"type": "string", "description": "Whether stress testing captures this risk. Use 'true' or 'false'"},
        "notes": {"type": "string", "description": "Additional notes about this risk factor"},
    },
    "required": ["project_id", "risk_factor", "is_applicable"],
}


def _to_bool(val, default=False):
    """Convert string/bool to boolean."""
    if val is None:
        return default
    if isinstance(val, bool):
        return val
    if isinstance(val, str):
        return val.lower() in ("true", "1", "yes")
    return bool(val)


async def risk_add_market_factor_handler(inp: dict) -> ToolResult:
    is_applicable = _to_bool(inp.get("is_applicable"))
    sensitivity_report = _to_bool(inp.get("sensitivity_report"))
    var_capture = _to_bool(inp.get("var_capture"))
    stress_capture = _to_bool(inp.get("stress_capture"))

    existing = await query(
        "SELECT id FROM npa_market_risk_factors WHERE project_id = %s AND risk_factor = %s",
        [inp["project_id"], inp["risk_factor"]],
    )

    if existing:
        await execute(
            """UPDATE npa_market_risk_factors
               SET is_applicable = %s, sensitivity_report = %s, var_capture = %s, stress_capture = %s, notes = %s
               WHERE project_id = %s AND risk_factor = %s""",
            [is_applicable, sensitivity_report, var_capture, stress_capture,
             inp.get("notes"), inp["project_id"], inp["risk_factor"]],
        )
        return ToolResult(success=True, data={
            "action": "updated", "project_id": inp["project_id"], "risk_factor": inp["risk_factor"],
        })

    row_id = await execute(
        """INSERT INTO npa_market_risk_factors (project_id, risk_factor, is_applicable, sensitivity_report, var_capture, stress_capture, notes)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        [inp["project_id"], inp["risk_factor"], is_applicable,
         sensitivity_report, var_capture, stress_capture, inp.get("notes")],
    )
    return ToolResult(success=True, data={
        "id": row_id, "action": "created",
        "project_id": inp["project_id"], "risk_factor": inp["risk_factor"],
    })


# ─── Tool 4: risk_get_external_parties ────────────────────────────

GET_EXTERNAL_PARTIES_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def risk_get_external_parties_handler(inp: dict) -> ToolResult:
    parties = await query(
        "SELECT * FROM npa_external_parties WHERE project_id = %s ORDER BY party_name",
        [inp["project_id"]],
    )
    critical = [p for p in parties if p.get("vendor_tier") == "TIER_1_CRITICAL"]

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "parties": parties,
        "summary": {
            "total": len(parties),
            "critical_vendors": len(critical),
            "tier_breakdown": {
                "tier_1": len(critical),
                "tier_2": sum(1 for p in parties if p.get("vendor_tier") == "TIER_2"),
                "tier_3": sum(1 for p in parties if p.get("vendor_tier") == "TIER_3"),
            },
        },
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="risk_run_assessment", description="Execute a comprehensive risk assessment for an NPA across multiple risk domains (Credit, Market, Operational, etc.).", category="risk", input_schema=RUN_ASSESSMENT_SCHEMA, handler=risk_run_assessment_handler),
    ToolDefinition(name="risk_get_market_factors", description="Get all market risk factors for an NPA (IR Delta, FX Vega, Crypto Delta, etc.) with their capture status.", category="risk", input_schema=GET_MARKET_FACTORS_SCHEMA, handler=risk_get_market_factors_handler),
    ToolDefinition(name="risk_add_market_factor", description="Add or update a market risk factor for an NPA. Tracks VaR and stress test capture status.", category="risk", input_schema=ADD_MARKET_FACTOR_SCHEMA, handler=risk_add_market_factor_handler),
    ToolDefinition(name="risk_get_external_parties", description="Get external parties (vendors, counterparties, custodians) involved in an NPA with their risk profiles.", category="risk", input_schema=GET_EXTERNAL_PARTIES_SCHEMA, handler=risk_get_external_parties_handler),
])
