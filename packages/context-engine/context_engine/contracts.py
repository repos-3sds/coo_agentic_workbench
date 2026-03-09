"""
Context Contract Loader & Validator

Loads archetype-specific context contracts (orchestrator, worker, reviewer)
and validates context packages against them. Enforces what data each agent
type is required to receive, may optionally receive, and must never receive.

Handles two contract formats:
    Rich format (orchestrator): required_context is list of slot dicts
        [{"slot": "user_context", "fields": [...], "source": "platform", "priority": "CRITICAL"}]
    Simple format (worker, reviewer): required_context is list of strings
        ["assigned_task", "entity_data", "domain_knowledge"]

Blueprint Section 9
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# ── Constants ──────────────────────────────────────────────────────────────

CONTRACTS_DIR = Path(__file__).resolve().parent.parent / "contracts"
VALID_ARCHETYPES = ("orchestrator", "worker", "reviewer")
REQUIRED_CONTRACT_FIELDS = ("contract_id", "archetype")


# ── Internal Helpers ───────────────────────────────────────────────────────

def _extract_slot_names(context_array: list | None) -> list[str]:
    """Extract slot names from a context array (handles both rich and simple formats)."""
    if not context_array or not isinstance(context_array, list):
        return []
    result = []
    for item in context_array:
        if isinstance(item, str):
            result.append(item)
        elif isinstance(item, dict) and "slot" in item:
            result.append(item["slot"])
        else:
            result.append(str(item))
    return result


def _validate_contract_structure(contract: dict) -> list[str]:
    """Validate that a contract has required structural fields. Returns list of missing fields."""
    if not contract or not isinstance(contract, dict):
        return ["(entire object)"]
    return [f for f in REQUIRED_CONTRACT_FIELDS if f not in contract or contract[f] is None]


# ── Public API ─────────────────────────────────────────────────────────────

def load_contract(archetype: str, contracts_dir: str | Path | None = None) -> dict:
    """
    Load a context contract by archetype name.

    Args:
        archetype: One of "orchestrator", "worker", "reviewer"
        contracts_dir: Override contracts directory (defaults to contracts/)

    Returns:
        Parsed contract dict

    Raises:
        ValueError: If archetype is unknown
        FileNotFoundError: If contract file is missing
        json.JSONDecodeError: If contract file is malformed
    """
    directory = Path(contracts_dir) if contracts_dir else CONTRACTS_DIR

    if archetype not in VALID_ARCHETYPES:
        raise ValueError(
            f'Unknown contract archetype: "{archetype}". '
            f"Valid: {', '.join(VALID_ARCHETYPES)}"
        )

    file_path = directory / f"{archetype}.json"
    if not file_path.exists():
        raise FileNotFoundError(f"Contract file not found: {file_path}")

    try:
        contract = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise json.JSONDecodeError(
            f"Contract file malformed ({archetype}.json): {exc.msg}",
            exc.doc, exc.pos
        )

    # Validate structural integrity
    missing = _validate_contract_structure(contract)
    if missing:
        raise ValueError(
            f'Contract "{archetype}" missing required fields: {", ".join(missing)}. '
            f"Every contract must have: {', '.join(REQUIRED_CONTRACT_FIELDS)}"
        )

    return contract


def validate_context(
    context: dict[str, Any],
    contract: dict[str, Any],
) -> dict[str, Any]:
    """
    Validate a context package against a contract.

    Blueprint spec: validate_context(context_package, contract)
    - Checks all required_context slots are present (non-None)
    - Warns if excluded_context slots are present (does NOT invalidate)

    Args:
        context: The context package to validate
        contract: The contract to validate against

    Returns:
        {"valid": bool, "missing_required": list, "unexpected_included": list, "warnings": list}

    Raises:
        TypeError: If contract is None/invalid
    """
    # M-004: Guard against None contract
    if not contract or not isinstance(contract, dict):
        raise TypeError(
            "validate_context: a valid contract dict is required. "
            "Pass a loaded contract (with required_context) and a context package."
        )

    result: dict[str, Any] = {
        "valid": True,
        "missing_required": [],
        "unexpected_included": [],
        "warnings": [],
    }

    if not context or not isinstance(context, dict):
        required = _extract_slot_names(contract.get("required_context", []))
        result["valid"] = False
        result["missing_required"] = required
        return result

    # Check required slots
    required_slots = _extract_slot_names(contract.get("required_context", []))
    for slot in required_slots:
        if slot not in context or context[slot] is None:
            result["missing_required"].append(slot)

    if result["missing_required"]:
        result["valid"] = False

    # Check excluded slots — warn but don't invalidate
    excluded = contract.get("excluded_context", [])
    if isinstance(excluded, list):
        for slot in excluded:
            slot_name = slot if isinstance(slot, str) else slot.get("slot", str(slot))
            if slot_name in context and context[slot_name] is not None:
                result["unexpected_included"].append(slot_name)
                archetype = contract.get("archetype", "unknown")
                result["warnings"].append(
                    f'"{slot_name}" is present but marked as excluded in the {archetype} contract'
                )

    return result


def get_required_sources(contract: dict) -> list[dict]:
    """
    Returns source specifications from a contract's required_context.
    H-002: Returns full spec objects per Blueprint Section 9.

    For rich-format contracts (orchestrator): returns spec objects grouped by source.
    For simple-format contracts (worker, reviewer): returns empty list.

    Returns:
        List of {"source": str, "slots": list, "priority": str, "fields": list}
    """
    if not contract or not isinstance(contract.get("required_context"), list):
        return []

    source_map: dict[str, dict] = {}
    for item in contract["required_context"]:
        if isinstance(item, dict) and "source" in item:
            src = item["source"]
            if src not in source_map:
                source_map[src] = {
                    "source": src,
                    "slots": [],
                    "priority": item.get("priority", "MEDIUM"),
                    "fields": [],
                }
            spec = source_map[src]
            if "slot" in item:
                spec["slots"].append(item["slot"])
            if isinstance(item.get("fields"), list):
                spec["fields"].extend(item["fields"])

    return list(source_map.values())


def get_budget_profile(contract_or_archetype: dict | str, contracts_dir: str | Path | None = None) -> str | None:
    """
    Returns the budget profile for a given contract or archetype.

    Accepts either a loaded contract dict or an archetype string.
    """
    if isinstance(contract_or_archetype, str):
        contract = load_contract(contract_or_archetype, contracts_dir)
        return contract.get("budget_profile")
    if isinstance(contract_or_archetype, dict):
        return contract_or_archetype.get("budget_profile")
    return None


def get_optional_context(contract: dict) -> list[str]:
    """Returns optional context slot names from a contract."""
    if not contract:
        return []
    return _extract_slot_names(contract.get("optional_context", []))


def get_excluded_context(contract: dict) -> list[str]:
    """Returns excluded context slot names from a contract."""
    if not contract:
        return []
    excluded = contract.get("excluded_context", [])
    if isinstance(excluded, list):
        return [s if isinstance(s, str) else str(s) for s in excluded]
    return []


def list_archetypes() -> list[str]:
    """Returns the list of valid archetype names."""
    return list(VALID_ARCHETYPES)


def get_contract_version(contract: dict) -> str | None:
    """Returns the version string from a loaded contract."""
    if not contract or not isinstance(contract, dict):
        return None
    return contract.get("version")
