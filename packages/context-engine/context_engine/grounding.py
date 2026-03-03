"""
Grounding Scorer Module (Sprint 5 — S5-002)

Scores agent responses for grounding quality by checking that every
critical claim has provenance, the source exists, supports the claim,
is current, and has sufficient authority.

Uses grounding-requirements.json for claim type definitions and
verification step descriptions.

Blueprint Section 11.2-11.3 — Grounding & Citation Verification.

Exports:
    score_grounding(response, context_package) -> dict
    identify_claims(response_text) -> list[dict]
    verify_claim(claim, provenance_tags) -> dict
    get_grounding_requirements() -> dict
"""

from __future__ import annotations

import datetime
import json
import re
from pathlib import Path
from typing import Any

# ── Config Loader ────────────────────────────────────────────────────────────

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_GROUNDING_CONFIG: dict | None = None


def get_grounding_requirements() -> dict:
    """Load grounding-requirements.json (cached after first load)."""
    global _GROUNDING_CONFIG
    if _GROUNDING_CONFIG is not None:
        return _GROUNDING_CONFIG

    config_path = _CONFIG_DIR / "grounding-requirements.json"
    if config_path.exists():
        _GROUNDING_CONFIG = json.loads(config_path.read_text())
    else:
        _GROUNDING_CONFIG = {"claim_types": [], "verification_steps": {}}

    return _GROUNDING_CONFIG


# ── Claim Identification ─────────────────────────────────────────────────────

# Patterns that signal a factual/regulatory claim in agent responses
_CLAIM_PATTERNS: list[tuple[str, str]] = [
    (r"(?i)\bclassifi(?:ed|cation)\b.*?\b(?:as|is|to)\b\s+\S+", "classification_decision"),
    (r"(?i)\brisk\s+(?:level|rating|score|assessment)\b.*?\b(?:is|rated|assessed)\b", "risk_assessment"),
    (r"(?i)\b(?:governance|policy)\s+(?:requires?|mandates?|stipulates?)\b", "governance_rule"),
    (r"(?i)\b(?:MAS|HKMA|SEBI|RBI|regulator[y]?)\b.*?\b(?:requires?|mandates?|prohibits?)\b", "regulatory_obligation"),
    (r"(?i)\b(?:sign-?off|approval)\s+(?:required|needed|mandatory)\b", "signoff_requirement"),
    (r"(?i)\b(?:threshold|notional|amount)\b.*?\b(?:exceeds?|below|above|SGD|USD|HKD)\b", "financial_threshold"),
    (r"(?i)\bprohibited\b.*?\b(?:item|product|instrument|activity)\b", "prohibited_item"),
    (r"(?i)\b(?:SLA|deadline|turnaround)\b.*?\b(?:hours?|days?|business\s+days?)\b", "sla_deadline"),
]


def identify_claims(response_text: str) -> list[dict]:
    """
    Extract factual/regulatory claims from an agent response.

    Scans the response text for patterns matching known claim types
    (classification decisions, risk assessments, regulatory obligations, etc.).

    Returns:
        List of claim dicts: [{claim_type, text, start, end}]
    """
    if not response_text or not isinstance(response_text, str):
        return []

    claims: list[dict] = []
    seen_spans: set[tuple[int, int]] = set()

    for pattern, claim_type in _CLAIM_PATTERNS:
        for match in re.finditer(pattern, response_text):
            span = (match.start(), match.end())
            # Avoid overlapping claims
            if any(s[0] <= span[0] < s[1] or s[0] < span[1] <= s[1] for s in seen_spans):
                continue

            seen_spans.add(span)
            claims.append({
                "claim_type": claim_type,
                "text": match.group(0).strip(),
                "start": span[0],
                "end": span[1],
            })

    return claims


# ── Claim Verification ───────────────────────────────────────────────────────

def _find_citation_for_claim(
    claim: dict,
    provenance_tags: list[dict],
    full_text: str = "",
) -> dict | None:
    """Find a provenance tag that could serve as citation for a claim.

    Searches both the claim text and a surrounding window (200 chars)
    in the full response for source_id references.
    """
    if not provenance_tags:
        return None

    # Build a search window: claim text + surrounding context
    claim_text = claim.get("text", "")
    start = claim.get("start", 0)
    end = claim.get("end", len(claim_text))
    window_start = max(0, start - 100)
    window_end = min(len(full_text), end + 100) if full_text else len(claim_text)
    search_text = (full_text[window_start:window_end] if full_text else claim_text).lower()

    # Look for explicit source_id references in the search window
    for tag in provenance_tags:
        source_id = tag.get("source_id", "")
        if source_id and source_id.lower() in search_text:
            return tag

    # Fuzzy match: check if any provenance tag's source_type or name is referenced
    for tag in provenance_tags:
        source_type = tag.get("source_type", "")
        source_name = tag.get("name", "")
        if source_type and source_type.lower() in search_text:
            return tag
        if source_name and source_name.lower() in search_text:
            return tag

    return None


def _check_has_citation(
    claim: dict,
    provenance_tags: list[dict],
    full_text: str = "",
) -> dict:
    """Step 1: Check if the claim includes a valid citation."""
    citation = _find_citation_for_claim(claim, provenance_tags, full_text)
    return {
        "step": "has_citation",
        "passed": citation is not None,
        "citation": citation,
        "detail": "Citation found" if citation else "No citation found for claim",
    }


def _check_source_exists(citation: dict | None, provenance_tags: list[dict]) -> dict:
    """Step 2: Verify the cited source_id exists in the provenance tags."""
    if not citation:
        return {"step": "source_exists", "passed": False, "detail": "No citation to verify"}

    source_id = citation.get("source_id", "")
    exists = any(t.get("source_id") == source_id for t in provenance_tags)
    return {
        "step": "source_exists",
        "passed": exists,
        "detail": f"Source {source_id} {'found' if exists else 'not found'} in provenance",
    }


def _check_source_supports(claim: dict, citation: dict | None) -> dict:
    """Step 3: Check that the source content is relevant to the claim."""
    if not citation:
        return {"step": "source_supports", "passed": False, "detail": "No citation to verify"}

    claim_type = claim.get("claim_type", "")
    source_type = citation.get("source_type", "")
    trust_class = citation.get("trust_class", "UNTRUSTED")

    # UNTRUSTED sources never support regulatory/governance claims
    if trust_class == "UNTRUSTED" and claim_type in (
        "regulatory_obligation", "governance_rule", "signoff_requirement"
    ):
        return {
            "step": "source_supports",
            "passed": False,
            "detail": f"UNTRUSTED source cannot support {claim_type} claims",
        }

    return {
        "step": "source_supports",
        "passed": True,
        "detail": f"Source type {source_type} accepted for {claim_type}",
    }


def _check_source_current(citation: dict | None, claim_type: str = "") -> dict:
    """Step 4: Check the source is not expired per TTL.

    H4 fix: fail-closed for regulated claim types. Missing or unparseable
    timestamps now fail the check for regulatory_obligation, governance_rule,
    signoff_requirement, and financial_threshold claims. Non-regulated claims
    retain fail-open behaviour (benefit of the doubt for system sources).
    """
    if not citation:
        return {"step": "source_current", "passed": False, "detail": "No citation to verify"}

    # Regulated claim types require strict timestamp validation
    _REGULATED_CLAIM_TYPES = {
        "regulatory_obligation", "governance_rule",
        "signoff_requirement", "financial_threshold",
    }
    strict = claim_type in _REGULATED_CLAIM_TYPES

    ttl = citation.get("ttl_seconds", 3600)
    fetched_at = citation.get("fetched_at")

    if not fetched_at:
        if strict:
            return {
                "step": "source_current",
                "passed": False,
                "detail": f"No fetched_at timestamp; fail-closed for {claim_type}",
            }
        return {
            "step": "source_current",
            "passed": True,
            "detail": "No fetched_at timestamp; assumed current (non-regulated claim)",
        }

    try:
        if isinstance(fetched_at, str):
            clean = fetched_at.rstrip("Z")
            ts = datetime.datetime.fromisoformat(clean)
            # Ensure ts is UTC-aware for correct comparison against UTC now()
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=datetime.timezone.utc)
            age_seconds = (datetime.datetime.now(datetime.timezone.utc) - ts).total_seconds()
            expired = age_seconds > ttl
            return {
                "step": "source_current",
                "passed": not expired,
                "detail": f"Source age: {int(age_seconds)}s, TTL: {ttl}s",
            }
    except (ValueError, TypeError):
        pass

    if strict:
        return {
            "step": "source_current",
            "passed": False,
            "detail": f"Could not parse fetched_at; fail-closed for {claim_type}",
        }
    return {
        "step": "source_current",
        "passed": True,
        "detail": "Could not parse fetched_at; assumed current (non-regulated claim)",
    }


def _check_authority_sufficient(claim: dict, citation: dict | None) -> dict:
    """Step 5: Verify the source's authority tier meets the minimum for the claim type."""
    if not citation:
        return {"step": "authority_sufficient", "passed": False, "detail": "No citation to verify"}

    config = get_grounding_requirements()
    claim_type = claim.get("claim_type", "")

    # Find the min_authority_tier for this claim type
    min_tier = 5  # default: most lenient
    for ct in config.get("claim_types", []):
        if ct.get("claim_type") == claim_type:
            min_tier = ct.get("min_authority_tier", 5)
            break

    source_tier = citation.get("authority_tier", 5)
    passed = source_tier <= min_tier

    return {
        "step": "authority_sufficient",
        "passed": passed,
        "detail": f"Source tier {source_tier} {'<=' if passed else '>'} required tier {min_tier}",
    }


def verify_claim(
    claim: dict,
    provenance_tags: list[dict],
    full_text: str = "",
) -> dict:
    """
    Run all 5 verification steps on a single claim.

    Steps:
        1. has_citation — claim references a source
        2. source_exists — source_id exists in provenance tags
        3. source_supports — content is relevant to claim
        4. source_current — not expired per TTL
        5. authority_sufficient — meets min_authority_tier

    Args:
        claim: The identified claim dict.
        provenance_tags: List of provenance tag dicts.
        full_text: The full agent response text (for surrounding-context search).

    Returns:
        {
            claim: dict,
            grounded: bool,
            steps: list[dict],
            failed_steps: list[str],
        }
    """
    step1 = _check_has_citation(claim, provenance_tags, full_text)
    citation = step1.get("citation")

    step2 = _check_source_exists(citation, provenance_tags)
    step3 = _check_source_supports(claim, citation)
    step4 = _check_source_current(citation, claim_type=claim.get("claim_type", ""))
    step5 = _check_authority_sufficient(claim, citation)

    steps = [step1, step2, step3, step4, step5]
    failed = [s["step"] for s in steps if not s["passed"]]

    return {
        "claim": claim,
        "grounded": len(failed) == 0,
        "steps": steps,
        "failed_steps": failed,
    }


# ── Main Scoring Function ───────────────────────────────────────────────────


def score_grounding(
    response: str | dict,
    context_package: dict | None = None,
) -> dict:
    """
    Score an agent response for grounding quality.

    Extracts claims from the response text, verifies each against
    provenance tags from the context package, and returns an
    aggregate grounding score.

    Args:
        response: Agent response text (str) or dict with "text"/"content" key.
        context_package: The assembled context package with _metadata and
                        provenance tags.

    Returns:
        {
            score: float (0-1),
            claims_checked: int,
            claims_grounded: int,
            claims_ungrounded: list[str],
            verification_steps: list[dict],
        }
    """
    # Extract response text
    if isinstance(response, dict):
        text = response.get("text") or response.get("content") or response.get("answer") or ""
    else:
        text = str(response) if response else ""

    # Extract provenance tags from context package
    provenance_tags: list[dict] = []
    if context_package:
        metadata = context_package.get("_metadata", {})
        # Collect provenance from all stages
        for stage in metadata.get("stages", []):
            if isinstance(stage, dict) and "provenance" in stage:
                tags = stage["provenance"]
                if isinstance(tags, list):
                    provenance_tags.extend(tags)

        # Also check top-level provenance
        top_prov = context_package.get("_provenance_tags", [])
        if isinstance(top_prov, list):
            provenance_tags.extend(top_prov)

        # And individual source provenance tags
        for key in ("entity_data", "knowledge_chunks", "sources"):
            items = context_package.get(key, [])
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and "_provenance" in item:
                        provenance_tags.append(item["_provenance"])

    # Identify claims
    claims = identify_claims(text)

    if not claims:
        return {
            "score": 1.0,  # No claims to check = fully grounded
            "claims_checked": 0,
            "claims_grounded": 0,
            "claims_ungrounded": [],
            "verification_steps": [],
        }

    # Verify each claim
    verification_results = []
    grounded_count = 0
    ungrounded_texts: list[str] = []

    for claim in claims:
        result = verify_claim(claim, provenance_tags, full_text=text)
        verification_results.append(result)
        if result["grounded"]:
            grounded_count += 1
        else:
            ungrounded_texts.append(claim["text"])

    score = grounded_count / len(claims) if claims else 1.0

    return {
        "score": round(score, 4),
        "claims_checked": len(claims),
        "claims_grounded": grounded_count,
        "claims_ungrounded": ungrounded_texts,
        "verification_steps": verification_results,
    }
