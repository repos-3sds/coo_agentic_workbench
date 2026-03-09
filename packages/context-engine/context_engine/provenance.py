"""
Provenance Tagger & Validator

Tags data with provenance metadata (source, authority tier, trust class,
freshness TTL), validates tags against schema, and checks expiry.
Every piece of data entering the context pipeline MUST have a provenance tag.

Loads schema from:
    config/provenance-schema.json

Blueprint Section 11
"""

from __future__ import annotations

import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ── Config Loading ─────────────────────────────────────────────────────────

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"

_schema: dict | None = None


def _load_schema() -> dict:
    global _schema
    if _schema is not None:
        return _schema
    fp = CONFIG_DIR / "provenance-schema.json"
    if not fp.exists():
        raise FileNotFoundError(f"Provenance schema not found: {fp}")
    _schema = json.loads(fp.read_text(encoding="utf-8"))
    return _schema


# ── Validation Constants ───────────────────────────────────────────────────

VALID_SOURCE_TYPES = (
    "system_of_record", "bank_sop", "industry_standard",
    "external_official", "general_web", "agent_output", "user_input",
)

VALID_TRUST_CLASSES = ("TRUSTED", "UNTRUSTED")

VALID_DATA_CLASSIFICATIONS = ("PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED")


# ── Internal Helpers ───────────────────────────────────────────────────────

def _validate_field(field_name: str, value: Any) -> str | None:
    """Validate a single field value. Returns error string or None."""
    if value is None:
        return f'Missing required field: "{field_name}"'

    validators = {
        "source_id": lambda v: (
            f'"source_id" must be a non-empty string, got: {type(v).__name__}'
            if not isinstance(v, str) or not v.strip() else None
        ),
        "source_type": lambda v: (
            f'"source_type" must be one of {VALID_SOURCE_TYPES}, got: "{v}"'
            if v not in VALID_SOURCE_TYPES else None
        ),
        "authority_tier": lambda v: (
            f'"authority_tier" must be an integer 1-5, got: {v}'
            if not isinstance(v, int) or v < 1 or v > 5 else None
        ),
        "fetched_at": lambda v: (
            f'"fetched_at" must be a valid ISO 8601 datetime string, got: "{v}"'
            if not isinstance(v, str) or not _is_valid_datetime(v) else None
        ),
        "ttl_seconds": lambda v: (
            f'"ttl_seconds" must be a non-negative integer, got: {v}'
            if not isinstance(v, int) or v < 0 else None
        ),
        "trust_class": lambda v: (
            f'"trust_class" must be one of {VALID_TRUST_CLASSES}, got: "{v}"'
            if v not in VALID_TRUST_CLASSES else None
        ),
        "data_classification": lambda v: (
            f'"data_classification" must be one of {VALID_DATA_CLASSIFICATIONS}, got: "{v}"'
            if v not in VALID_DATA_CLASSIFICATIONS else None
        ),
        "version": lambda v: (
            f'"version" must be a string, got: {type(v).__name__}'
            if not isinstance(v, str) else None
        ),
        "effective_date": lambda v: (
            f'"effective_date" must be a valid ISO 8601 date string, got: "{v}"'
            if not isinstance(v, str) or not _is_valid_date(v) else None
        ),
        "expiry_date": lambda v: (
            f'"expiry_date" must be a valid ISO 8601 date string, got: "{v}"'
            if not isinstance(v, str) or not _is_valid_date(v) else None
        ),
        "owner": lambda v: (
            f'"owner" must be a string, got: {type(v).__name__}'
            if not isinstance(v, str) else None
        ),
        "jurisdiction": lambda v: (
            f'"jurisdiction" must be a string, got: {type(v).__name__}'
            if not isinstance(v, str) else None
        ),
        "doc_section": lambda v: (
            f'"doc_section" must be a string, got: {type(v).__name__}'
            if not isinstance(v, str) else None
        ),
        "chunk_hash": lambda v: (
            f'"chunk_hash" must be a string, got: {type(v).__name__}'
            if not isinstance(v, str) else None
        ),
    }

    validator = validators.get(field_name)
    return validator(value) if validator else None


def _is_valid_datetime(s: str) -> bool:
    """Check if string is a valid ISO 8601 datetime."""
    try:
        datetime.fromisoformat(s.replace("Z", "+00:00"))
        return True
    except (ValueError, AttributeError):
        return False


def _is_valid_date(s: str) -> bool:
    """Check if string is a valid ISO 8601 date."""
    try:
        datetime.fromisoformat(s)
        return True
    except (ValueError, AttributeError):
        return False


# ── Public API ─────────────────────────────────────────────────────────────

def tag_provenance(data: Any, metadata: dict) -> dict:
    """
    Tag data with provenance metadata.

    Returns {"data": <original>, "_provenance": <validated_tag>}

    Raises:
        TypeError: If metadata is not a dict
        ValueError: If metadata fails validation
    """
    if not metadata or not isinstance(metadata, dict):
        raise TypeError("tag_provenance: metadata argument is required and must be a dict.")

    tag = create_provenance_tag(metadata)
    return {"data": data, "_provenance": tag}


def validate_provenance(tag: dict | None) -> dict[str, Any]:
    """
    Validate a provenance tag against the schema.

    Returns {"valid": bool, "errors": list[str]}
    """
    result: dict[str, Any] = {"valid": True, "errors": []}

    if not tag or not isinstance(tag, dict):
        result["valid"] = False
        result["errors"].append("Tag must be a non-null dict.")
        return result

    schema = _load_schema()
    required_fields = schema.get("required", [])

    # Check required fields
    for field in required_fields:
        error = _validate_field(field, tag.get(field))
        if error:
            result["valid"] = False
            result["errors"].append(error)

    # Check optional fields that are present
    all_fields = list((schema.get("properties") or {}).keys())
    for field in all_fields:
        if field not in required_fields and tag.get(field) is not None:
            error = _validate_field(field, tag[field])
            if error:
                result["valid"] = False
                result["errors"].append(error)

    return result


def is_expired(tag: dict | None, now: datetime | None = None) -> bool:
    """
    Check if a provenance tag's data has expired (fetched_at + ttl_seconds).

    Args:
        tag: The provenance tag
        now: Override current time (for testing)

    Returns True if expired.
    """
    if not tag or not isinstance(tag, dict):
        return True

    fetched_at = tag.get("fetched_at")
    ttl = tag.get("ttl_seconds")

    if not fetched_at or not isinstance(ttl, (int, float)):
        return True

    try:
        fetched_time = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return True

    current = now or datetime.now(timezone.utc)
    # Ensure current is timezone-aware
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    # Ensure fetched_time is timezone-aware
    if fetched_time.tzinfo is None:
        fetched_time = fetched_time.replace(tzinfo=timezone.utc)

    elapsed = (current - fetched_time).total_seconds()
    return elapsed > ttl


def get_authority_tier(tag: dict | None) -> int:
    """
    Returns the authority tier from a provenance tag.
    Returns -1 if not available or invalid.
    """
    if not tag or not isinstance(tag, dict):
        return -1
    tier = tag.get("authority_tier")
    if isinstance(tier, int) and 1 <= tier <= 5:
        return tier
    return -1


def strip_provenance(tagged_data: Any) -> Any:
    """
    Strip provenance metadata from tagged data, returning raw data.
    Works with data tagged by tag_provenance().
    """
    if not tagged_data or not isinstance(tagged_data, dict):
        return tagged_data

    # tag_provenance() format: {"data": ..., "_provenance": ...}
    if "data" in tagged_data and "_provenance" in tagged_data:
        return tagged_data["data"]

    # Direct _provenance on object
    if "_provenance" in tagged_data:
        stripped = dict(tagged_data)
        del stripped["_provenance"]
        return stripped

    return tagged_data


def create_provenance_tag(fields: dict) -> dict:
    """
    Create a validated provenance tag from raw fields.
    Adds defaults for fetched_at (now) and ttl_seconds (3600).

    Raises ValueError if required fields are missing or invalid.
    """
    if not fields or not isinstance(fields, dict):
        raise TypeError("create_provenance_tag: fields argument is required and must be a dict.")

    tag = {
        "source_id": fields.get("source_id"),
        "source_type": fields.get("source_type"),
        "authority_tier": fields.get("authority_tier"),
        "fetched_at": fields.get("fetched_at") or datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": fields.get("ttl_seconds", 3600),
        "trust_class": fields.get("trust_class"),
        "data_classification": fields.get("data_classification"),
    }

    # Copy optional fields if present
    for key in ("version", "effective_date", "expiry_date", "owner",
                "jurisdiction", "doc_section", "chunk_hash"):
        if fields.get(key) is not None:
            tag[key] = fields[key]

    # Validate
    validation = validate_provenance(tag)
    if not validation["valid"]:
        raise ValueError(
            f"create_provenance_tag: invalid tag — {'; '.join(validation['errors'])}"
        )

    return tag


def merge_provenance(
    tag_a: dict | None,
    tag_b: dict | None,
    now: datetime | None = None,
) -> dict:
    """
    Merge two provenance tags for derived data.
    Takes the LOWER authority (higher tier number) and MORE RESTRICTIVE classification.

    Args:
        tag_a: First provenance tag.
        tag_b: Second provenance tag.
        now: Override current time (for deterministic testing).
    """
    if not tag_a or not isinstance(tag_a, dict):
        return tag_b or {}
    if not tag_b or not isinstance(tag_b, dict):
        return tag_a

    classification_order = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]

    class_a_raw = tag_a.get("data_classification", "RESTRICTED")
    class_b_raw = tag_b.get("data_classification", "RESTRICTED")
    class_a = classification_order.index(class_a_raw) if class_a_raw in classification_order else 3
    class_b = classification_order.index(class_b_raw) if class_b_raw in classification_order else 3

    trust_class = (
        "UNTRUSTED"
        if tag_a.get("trust_class") == "UNTRUSTED" or tag_b.get("trust_class") == "UNTRUSTED"
        else "TRUSTED"
    )

    current = now or datetime.now(timezone.utc)

    return {
        "source_id": f"merged:{tag_a.get('source_id', '?')}+{tag_b.get('source_id', '?')}",
        "source_type": "agent_output",
        "authority_tier": max(tag_a.get("authority_tier", 5), tag_b.get("authority_tier", 5)),
        "fetched_at": current.isoformat(),
        "ttl_seconds": min(tag_a.get("ttl_seconds", 0), tag_b.get("ttl_seconds", 0)),
        "trust_class": trust_class,
        "data_classification": classification_order[max(class_a, class_b)],
    }


def get_required_fields() -> list[str]:
    """Returns the list of required provenance fields from the schema."""
    schema = _load_schema()
    return list(schema.get("required", []))


def compute_chunk_hash(content: str | Any) -> str:
    """Compute SHA-256 hash for content. Useful for chunk_hash field.

    Returns hash with 'sha256:' prefix per blueprint §4.3.
    """
    if not isinstance(content, str):
        content = json.dumps(content, default=str)
    return f"sha256:{hashlib.sha256(content.encode('utf-8')).hexdigest()}"


def reset_cache() -> None:
    """Reset cached schema. For testing only."""
    global _schema
    _schema = None
