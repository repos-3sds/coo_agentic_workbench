"""
Jurisdiction Adapter Tools — 3 tools
Powers the Jurisdiction Adapter Agent: jurisdiction lookups, regulatory rules, classification weight adaptation.
Uses npa_jurisdictions table (project_id, jurisdiction_code) and ref_prohibited_items (jurisdictions column).
"""
from registry import ToolDefinition, ToolResult, registry
from db import execute, query


# Known jurisdiction metadata (no ref_jurisdictions table exists in DB)
_JURISDICTION_META = {
    "SG": {"name": "Singapore", "region": "APAC", "regulatory_body": "MAS", "risk_weight_modifier": 1.0, "is_restricted": False},
    "HK": {"name": "Hong Kong", "region": "APAC", "regulatory_body": "HKMA/SFC", "risk_weight_modifier": 1.0, "is_restricted": False},
    "CN": {"name": "China", "region": "APAC", "regulatory_body": "PBOC/CSRC", "risk_weight_modifier": 1.3, "is_restricted": True},
    "IN": {"name": "India", "region": "APAC", "regulatory_body": "RBI/SEBI", "risk_weight_modifier": 1.2, "is_restricted": False},
    "LN": {"name": "London", "region": "EMEA", "regulatory_body": "FCA/PRA", "risk_weight_modifier": 1.0, "is_restricted": False},
    "AU": {"name": "Australia", "region": "APAC", "regulatory_body": "APRA/ASIC", "risk_weight_modifier": 1.0, "is_restricted": False},
    "VN": {"name": "Vietnam", "region": "APAC", "regulatory_body": "SBV", "risk_weight_modifier": 1.4, "is_restricted": True},
    "ID": {"name": "Indonesia", "region": "APAC", "regulatory_body": "OJK/BI", "risk_weight_modifier": 1.2, "is_restricted": False},
}


# ─── Tool 1: get_npa_jurisdictions ──────────────────────────────

GET_NPA_JURISDICTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
    },
    "required": ["project_id"],
}


async def get_npa_jurisdictions_handler(inp: dict) -> ToolResult:
    rows = await query(
        "SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = %s ORDER BY jurisdiction_code",
        [inp["project_id"]],
    )

    jurisdictions = []
    restricted = []
    regions = set()

    for row in rows:
        code = row["jurisdiction_code"]
        meta = _JURISDICTION_META.get(code, {"name": code, "region": "UNKNOWN", "regulatory_body": "UNKNOWN", "risk_weight_modifier": 1.0, "is_restricted": False})
        entry = {"jurisdiction_code": code, **meta}
        jurisdictions.append(entry)
        if meta.get("is_restricted"):
            restricted.append(code)
        regions.add(meta.get("region", "UNKNOWN"))

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "jurisdictions": jurisdictions,
        "summary": {
            "total": len(jurisdictions),
            "restricted_count": len(restricted),
            "restricted_codes": restricted,
            "regions": list(regions),
        },
    })


# ─── Tool 2: get_jurisdiction_rules ─────────────────────────────

GET_JURISDICTION_RULES_SCHEMA = {
    "type": "object",
    "properties": {
        "jurisdiction_code": {"type": "string", "description": "Jurisdiction code (e.g. SG, HK, IN, CN)"},
    },
    "required": ["jurisdiction_code"],
}


async def get_jurisdiction_rules_handler(inp: dict) -> ToolResult:
    code = inp["jurisdiction_code"]
    meta = _JURISDICTION_META.get(code)

    if not meta:
        return ToolResult(success=False, error=f"Unknown jurisdiction code '{code}'")

    jurisdiction = {"jurisdiction_code": code, **meta}

    # Get prohibited items specific to this jurisdiction
    prohibited = await query(
        """SELECT item_code, item_name, severity, description, layer
           FROM ref_prohibited_items
           WHERE (jurisdictions LIKE %s OR jurisdictions = 'ALL')
             AND (effective_to IS NULL OR effective_to > NOW())
           ORDER BY severity DESC""",
        [f"%{code}%"],
    )

    return ToolResult(success=True, data={
        "jurisdiction": jurisdiction,
        "prohibited_items": prohibited,
        "prohibited_count": len(prohibited),
    })


# ─── Tool 3: adapt_classification_weights ────────────────────────

ADAPT_CLASSIFICATION_WEIGHTS_SCHEMA = {
    "type": "object",
    "properties": {
        "project_id": {"type": "string", "description": "NPA project ID"},
        "base_score": {"type": "number", "description": "Base classification score before jurisdiction adjustment"},
    },
    "required": ["project_id", "base_score"],
}


async def adapt_classification_weights_handler(inp: dict) -> ToolResult:
    # Get jurisdictions for this NPA
    rows = await query(
        "SELECT jurisdiction_code FROM npa_jurisdictions WHERE project_id = %s",
        [inp["project_id"]],
    )

    if not rows:
        return ToolResult(success=True, data={
            "project_id": inp["project_id"],
            "base_score": inp["base_score"],
            "adjusted_score": inp["base_score"],
            "adjustment": 0,
            "jurisdictions_applied": [],
            "note": "No jurisdictions linked to project; score unchanged",
        })

    jurisdictions_applied = []
    max_modifier = 1.0
    has_restricted = False

    for row in rows:
        code = row["jurisdiction_code"]
        meta = _JURISDICTION_META.get(code, {"name": code, "risk_weight_modifier": 1.0, "is_restricted": False})
        modifier = meta.get("risk_weight_modifier", 1.0)
        restricted = meta.get("is_restricted", False)

        if modifier > max_modifier:
            max_modifier = modifier
        if restricted:
            has_restricted = True

        jurisdictions_applied.append({
            "code": code,
            "name": meta.get("name", code),
            "modifier": modifier,
            "restricted": restricted,
        })

    adjusted_score = round(inp["base_score"] * max_modifier, 2)
    # Cap at 20 (max classification score)
    adjusted_score = min(adjusted_score, 20.0)

    # If any restricted jurisdiction, auto-escalate to FULL
    if has_restricted:
        adjusted_score = max(adjusted_score, 15.0)

    return ToolResult(success=True, data={
        "project_id": inp["project_id"],
        "base_score": inp["base_score"],
        "adjusted_score": adjusted_score,
        "adjustment": round(adjusted_score - inp["base_score"], 2),
        "max_modifier": max_modifier,
        "has_restricted_jurisdiction": has_restricted,
        "jurisdictions_applied": jurisdictions_applied,
    })


# ── Register ──────────────────────────────────────────────────────
registry.register_all([
    ToolDefinition(name="get_npa_jurisdictions", description="Get all jurisdictions linked to an NPA project with their regulatory details.", category="jurisdiction", input_schema=GET_NPA_JURISDICTIONS_SCHEMA, handler=get_npa_jurisdictions_handler),
    ToolDefinition(name="get_jurisdiction_rules", description="Get regulatory rules, restrictions, and prohibited items for a specific jurisdiction.", category="jurisdiction", input_schema=GET_JURISDICTION_RULES_SCHEMA, handler=get_jurisdiction_rules_handler),
    ToolDefinition(name="adapt_classification_weights", description="Adapt classification weights based on NPA's linked jurisdictions. Applies risk weight modifiers and restriction escalations.", category="jurisdiction", input_schema=ADAPT_CLASSIFICATION_WEIGHTS_SCHEMA, handler=adapt_classification_weights_handler),
])
