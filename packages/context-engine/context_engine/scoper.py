"""
Domain Context Scoper (Sprint 2 — S2-006)

Scopes context data by domain, entity, and user entitlements.
Applies domain-specific filtering rules from the 6 scoping dimensions.

Depends on: trust (S1-011)

Blueprint Section 10 — Scope stage of the 7-stage pipeline.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from context_engine.trust import can_user_access

# ── Domain config loading ─────────────────────────────────────────────────
_DOMAINS_DIR = Path(__file__).resolve().parent.parent / "domains"
_domain_cache: dict[str, dict] = {}


def scope_by_domain(data: list[dict], domain_id: str) -> list[dict]:
    """Filters data matching the domain or the generic 'platform' domain."""
    return [
        item for item in data
        if item.get("domain") in (domain_id, "platform", None)
    ]


def scope_by_entity(data: list[dict], entity_id: str, entity_type: str = "project") -> list[dict]:
    """Filters data matching the specific entity_id and entity_type."""
    if not entity_id:
        return data

    filtered = []
    for item in data:
        item_entity_id = item.get("entity_id")
        item_entity_type = item.get("entity_type", "project")
        
        # Keep items that are globally scoped (no entity bound) or match precisely
        if not item_entity_id:
            filtered.append(item)
        elif item_entity_id == entity_id and item_entity_type == entity_type:
            filtered.append(item)
            
    return filtered


def scope_by_jurisdiction(data: list[dict], jurisdiction: str) -> list[dict]:
    """Filters data matching the exact jurisdiction or GLOBAL."""
    if not jurisdiction:
        return data

    filtered = []
    for item in data:
        # Check either root dict or nested provenance
        item_jurisdiction = item.get("jurisdiction")
        if not item_jurisdiction and "provenance" in item:
            item_jurisdiction = item["provenance"].get("jurisdiction")
            
        if item_jurisdiction in (jurisdiction, "GLOBAL", None):
            filtered.append(item)
            
    return filtered


def scope_by_classification(data: list[dict], max_level: str) -> list[dict]:
    """
    Filters data preventing items classified above the max_level.
    Ordinals: PUBLIC (0) < INTERNAL (1) < CONFIDENTIAL (2) < RESTRICTED (3)
    """
    if not max_level:
        return data
        
    ordinals = {
        "PUBLIC": 0,
        "INTERNAL": 1,
        "CONFIDENTIAL": 2,
        "RESTRICTED": 3
    }
    
    max_ordinal = ordinals.get(max_level.upper(), 0)
    
    filtered = []
    for item in data:
        classification = item.get("data_classification")
        if not classification and "provenance" in item:
            classification = item["provenance"].get("data_classification")
            
        # Deny-by-default: unknown classifications treated as RESTRICTED (banking compliance)
        item_ordinal = ordinals.get(classification, 3) if classification else 0
        if item_ordinal <= max_ordinal:
            filtered.append(item)
            
    return filtered


def scope_by_role(data: list[dict], user_role: str) -> list[dict]:
    """
    Filters data by establishing entitlements utilizing trust module's
    can_user_access rules natively.
    """
    if not user_role:
        return data
        
    filtered = []
    for item in data:
        classification = item.get("data_classification")
        if not classification and "provenance" in item:
            classification = item["provenance"].get("data_classification")
        if not classification:
            classification = "RESTRICTED"  # deny-by-default for banking compliance

        if can_user_access(user_role, classification):
            filtered.append(item)
            
    return filtered


def scope_by_temporal(data: list[dict]) -> list[dict]:
    """
    Filters data requiring that effective_date is past, and expiry_date
    is in the future. Treats missing keys as always valid.
    """
    now = datetime.now(timezone.utc).isoformat()
    filtered = []
    
    for item in data:
        effective = item.get("effective_date")
        expiry = item.get("expiry_date")
        
        # Check provenance nested mapping if applicable
        if not effective and not expiry and "provenance" in item:
            effective = item["provenance"].get("effective_date")
            expiry = item["provenance"].get("expiry_date")
            
        if effective and effective > now:
            continue
            
        if expiry and expiry < now:
            continue
            
        filtered.append(item)
        
    return filtered


def apply_all_scopes(data: list[dict], scoping_config: dict) -> list[dict]:
    """
    Chains all granular scoping functions passing through the relevant keys
    provided from the configuration.
    
    Args:
        data: List of dictionary documents/records
        scoping_config: Config holding keys [domain, entity_id, entity_type, jurisdiction, max_classification, user_role]
    """
    scoped = data
    
    # 1. Domain
    if "domain" in scoping_config:
        scoped = scope_by_domain(scoped, scoping_config["domain"])
        
    # 2. Entity
    if "entity_id" in scoping_config:
        etype = scoping_config.get("entity_type", "project")
        scoped = scope_by_entity(scoped, scoping_config["entity_id"], etype)
        
    # 3. Jurisdiction
    if "jurisdiction" in scoping_config:
        scoped = scope_by_jurisdiction(scoped, scoping_config["jurisdiction"])
        
    # 4. Classification
    if "max_classification" in scoping_config:
        scoped = scope_by_classification(scoped, scoping_config["max_classification"])
        
    # 5. Role
    if "user_role" in scoping_config:
        scoped = scope_by_role(scoped, scoping_config["user_role"])
        
    # 6. Temporal constraints
    scoped = scope_by_temporal(scoped)
        
    return scoped


def scope_context(context_package: dict, domain: str, entity_id: str | None = None) -> dict:
    """
    Apply domain-specific scoping rules to a context package.

    Args:
        context_package: Dict of ``{slot_name: list[dict] | Any}``.
        domain: Domain identifier (e.g. ``"NPA"``).
        entity_id: Optional entity ID to scope by.

    Returns:
        A new dict with the same slots, where list-of-dict slots have been
        scoped by domain (and optionally entity).
    """
    rules = get_scoping_rules(domain)
    config: dict[str, Any] = {"domain": domain}
    if entity_id:
        config["entity_id"] = entity_id
        config["entity_type"] = rules.get("entity_type", "project")

    result = {}
    for slot, data in context_package.items():
        if isinstance(data, list) and all(isinstance(i, dict) for i in data):
            result[slot] = apply_all_scopes(data, config)
        else:
            result[slot] = data
    return result


def get_scoping_rules(domain: str) -> dict:
    """
    Load scoping rules for a domain from its config file.

    Args:
        domain: Domain identifier (e.g. ``"NPA"``).

    Returns:
        Dict with keys: domain, entity_type, scoping_fields.
        Returns a minimal default if no config file exists.
    """
    if domain in _domain_cache:
        cfg = _domain_cache[domain]
    else:
        domain_path = _DOMAINS_DIR / f"{domain.lower()}.json"
        if domain_path.exists():
            try:
                cfg = json.loads(domain_path.read_text(encoding="utf-8"))
                _domain_cache[domain] = cfg
            except (json.JSONDecodeError, KeyError):
                cfg = {}
        else:
            cfg = {}

    return {
        "domain": domain,
        "entity_type": cfg.get("primary_entity", "project"),
        "scoping_fields": cfg.get("scoping_fields", []),
    }


def filter_by_entitlements(context_package: dict, user_role: str, domain: str) -> dict:
    """
    Filter context based on user role entitlements.

    Args:
        context_package: Dict of ``{slot_name: list[dict] | Any}``.
        user_role: The user's role (e.g. ``"analyst"``, ``"coo"``).
        domain: Domain identifier.

    Returns:
        A new dict with the same slots, where list-of-dict slots have been
        filtered to only include items the user is entitled to see.
    """
    result = {}
    for slot, data in context_package.items():
        if isinstance(data, list) and all(isinstance(i, dict) for i in data):
            result[slot] = scope_by_role(data, user_role)
        else:
            result[slot] = data
    return result


def reset_domain_cache() -> None:
    """Clear the cached domain configs (for testing)."""
    _domain_cache.clear()
