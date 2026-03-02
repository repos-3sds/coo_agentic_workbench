"""
Trust Classification & Source Authority Engine

Classifies content as TRUSTED/UNTRUSTED, ranks sources by authority tier,
resolves conflicts between sources, and enforces data access controls.

Loads configuration from:
    config/source-priority.json      (5-tier authority hierarchy)
    config/trust-classification.json (TRUSTED/UNTRUSTED rules)
    config/data-classification.json  (PUBLIC -> RESTRICTED taxonomy)

Blueprint Section 5
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Literal

# ── Config Loading ─────────────────────────────────────────────────────────

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"

_source_priority: dict | None = None
_trust_classification: dict | None = None
_data_classification: list | None = None


def _load_source_priority() -> dict:
    global _source_priority
    if _source_priority is not None:
        return _source_priority
    fp = CONFIG_DIR / "source-priority.json"
    if not fp.exists():
        raise FileNotFoundError(f"Source priority config not found: {fp}")
    _source_priority = json.loads(fp.read_text(encoding="utf-8"))
    return _source_priority


def _load_trust_classification() -> dict:
    global _trust_classification
    if _trust_classification is not None:
        return _trust_classification
    fp = CONFIG_DIR / "trust-classification.json"
    if not fp.exists():
        raise FileNotFoundError(f"Trust classification config not found: {fp}")
    _trust_classification = json.loads(fp.read_text(encoding="utf-8"))
    return _trust_classification


def _load_data_classification() -> list:
    global _data_classification
    if _data_classification is not None:
        return _data_classification
    fp = CONFIG_DIR / "data-classification.json"
    if not fp.exists():
        raise FileNotFoundError(f"Data classification config not found: {fp}")
    _data_classification = json.loads(fp.read_text(encoding="utf-8"))
    return _data_classification


# ── NEVER-Allowed Sources (hardcoded — single source of truth, H-001) ──────

NEVER_PATTERNS: list[str] = [
    "unverified_web_scrapes",
    "social_media",
    "competitor_intelligence",
    "user_pasted_claiming_policy",
]


# ── Role Hierarchy ─────────────────────────────────────────────────────────

ROLE_HIERARCHY: dict[str, int] = {
    "any": 0,
    "employee": 1,
    "analyst": 2,
    "checker": 3,
    "manager": 4,
    "coo": 5,
    "admin": 6,
}


# ── Public API ─────────────────────────────────────────────────────────────

def classify_trust(source_type: str | None) -> Literal["TRUSTED", "UNTRUSTED"]:
    """
    Classify a source type as TRUSTED or UNTRUSTED.
    Throws ValueError for NEVER-allowed sources.

    Returns UNTRUSTED as safe default for unknown sources.
    """
    if not source_type or not isinstance(source_type, str):
        return "UNTRUSTED"

    # Check NEVER list first — must throw
    if is_never_allowed(source_type):
        raise ValueError(
            f'Source "{source_type}" is NEVER allowed in the context pipeline. '
            f"Blocked by NEVER_PATTERNS policy."
        )

    # Check config rules
    config = _load_trust_classification()
    for rule in config.get("rules", []):
        pattern = rule.get("source_pattern", "")
        if re.match(pattern, source_type):
            return rule.get("trust_class", "UNTRUSTED")

    # Safe default
    return "UNTRUSTED"


def classify_data_level(data_type: str | None) -> str:
    """
    Classify data sensitivity level: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED.
    Returns INTERNAL as safe default for unknown types.
    """
    if not data_type or not isinstance(data_type, str):
        return "INTERNAL"

    levels = _load_data_classification()
    data_lower = data_type.lower()

    for level_def in levels:
        level_name = level_def.get("level", "")
        examples = level_def.get("examples", [])

        # Check if data_type matches level name
        if data_lower == level_name.lower():
            return level_name

        # Check if data_type matches any example
        for example in examples:
            if data_lower == example.lower():
                return level_name

    return "INTERNAL"


def rank_sources(sources: list[dict]) -> list[dict]:
    """
    Sort sources by authority tier (ascending: tier 1 first).
    Stable sort preserves input order for equal tiers.
    """
    if not sources:
        return []
    return sorted(sources, key=lambda s: s.get("authority_tier", 999))


def resolve_conflict(source_a: dict, source_b: dict) -> dict:
    """
    Resolve a conflict between two sources. Returns the winner with reason.

    Resolution rules (from source-priority.json):
      1. Higher authority tier wins (lower number)
      2. Same tier: system_of_record wins over non-SoR
      3. Same tier + type: newer effective_date wins
      4. Same tier: group policy wins over local policy
      5. Fallback: NEEDS_HUMAN_REVIEW
    """
    tier_a = source_a.get("authority_tier", 999)
    tier_b = source_b.get("authority_tier", 999)

    # Different tiers — lower number (higher authority) wins
    if tier_a != tier_b:
        winner = source_a if tier_a < tier_b else source_b
        return {
            "winner": winner,
            "reason": f"Higher authority tier: {min(tier_a, tier_b)} vs {max(tier_a, tier_b)}",
            "resolution": "authority_tier",
        }

    # Same tier — check source_type
    type_a = source_a.get("source_type", "")
    type_b = source_b.get("source_type", "")

    if type_a == "system_of_record" and type_b != "system_of_record":
        return {"winner": source_a, "reason": "System of record wins", "resolution": "sor_priority"}
    if type_b == "system_of_record" and type_a != "system_of_record":
        return {"winner": source_b, "reason": "System of record wins", "resolution": "sor_priority"}

    # Same tier + both SoR or both non-SoR — check effective_date
    date_a = source_a.get("effective_date", "")
    date_b = source_b.get("effective_date", "")
    if date_a and date_b and date_a != date_b:
        winner = source_a if date_a > date_b else source_b
        return {"winner": winner, "reason": "Newer effective_date wins", "resolution": "effective_date"}

    # Same tier — check group vs local policy
    scope_a = source_a.get("scope", "")
    scope_b = source_b.get("scope", "")
    if scope_a == "group" and scope_b == "local":
        return {"winner": source_a, "reason": "Group policy wins over local", "resolution": "policy_scope"}
    if scope_b == "group" and scope_a == "local":
        return {"winner": source_b, "reason": "Group policy wins over local", "resolution": "policy_scope"}

    # Cannot resolve
    return {
        "winner": None,
        "reason": "Cannot resolve — same tier, type, and date. Requires human review.",
        "resolution": "NEEDS_HUMAN_REVIEW",
    }


def can_user_access(user_role: str, data_classification: str) -> bool:
    """
    Check if a user role can access data at the given classification level.
    Uses role hierarchy and min_role_required from data-classification.json.
    """
    user_level = ROLE_HIERARCHY.get(user_role, -1)
    if user_level < 0:
        return False

    levels = _load_data_classification()
    for level_def in levels:
        if level_def.get("level") == data_classification:
            min_role = level_def.get("min_role_required", "admin")
            min_level = ROLE_HIERARCHY.get(min_role, 999)
            return user_level >= min_level

    return False


def is_never_allowed(source_type: str) -> bool:
    """
    Check if a source type is in the NEVER-allowed list.
    These sources must THROW, never silently return UNTRUSTED.
    """
    if not source_type:
        return False
    return source_type in NEVER_PATTERNS


def get_source_hierarchy() -> list[dict]:
    """
    Returns the full 5-tier source priority hierarchy.
    """
    config = _load_source_priority()
    return list(config.get("tiers", []))


def get_source_tier(source_type: str) -> dict | None:
    """
    Returns tier metadata for a specific source type.
    Returns None if source_type not found.
    """
    config = _load_source_priority()
    for tier in config.get("tiers", []):
        if tier.get("name") == source_type:
            return dict(tier)
    return None


def reset_cache() -> None:
    """Reset all cached configs. For testing only."""
    global _source_priority, _trust_classification, _data_classification
    _source_priority = None
    _trust_classification = None
    _data_classification = None
