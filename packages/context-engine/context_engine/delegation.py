"""
Delegation Context Module (Sprint 3 — S3-002)

Handles what context passes when agents delegate to each other.
Orchestrator -> Worker -> Reviewer delegation chain.

Respects contract boundaries:
    - Workers don't get routing metadata
    - Reviewers get worker output + provenance only
    - Orchestrators get composed results

Depends on: contracts (S1-013), provenance (S2-001)

Blueprint Section 8.3 — Delegation Context.

Status: IMPLEMENTED
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from context_engine.contracts import load_contract
from context_engine.provenance import validate_provenance


# ── Metadata keys that should NOT cross agent boundaries ──────────────────

_ROUTING_METADATA_KEYS = frozenset({
    "routing_decision",
    "delegation_plan",
    "agent_selection_reasoning",
    "orchestration_trace",
    "internal_scores",
})

_ORCHESTRATOR_ONLY_KEYS = frozenset({
    "delegation_results",
    "worker_assignments",
    "aggregation_strategy",
})


# ── Public API ────────────────────────────────────────────────────────────


def create_delegation_package(
    from_agent: str,
    to_agent: str,
    context_package: dict,
    archetype: str | None = None,
) -> dict:
    """
    Create a delegation context package for passing from one agent to another.

    Strips data that shouldn't cross agent boundaries based on the
    target agent's archetype.

    Args:
        from_agent: Source agent ID (e.g. "NPA_ORCHESTRATOR").
        to_agent: Target agent ID (e.g. "NPA_BIZ").
        context_package: The full context package to filter.
        archetype: Target agent archetype ("worker", "reviewer", "orchestrator").
                   If None, inferred as "worker".

    Returns:
        Filtered context package suitable for the target agent.
    """
    if not isinstance(context_package, dict):
        raise TypeError("create_delegation_package: context_package must be a dict")

    target_archetype = archetype or "worker"
    now = datetime.now(timezone.utc).isoformat()

    # Start with a copy of the context
    delegated: dict[str, Any] = {}

    if target_archetype == "worker":
        delegated = _build_worker_context(context_package)
    elif target_archetype == "reviewer":
        delegated = _build_reviewer_context(context_package)
    elif target_archetype == "orchestrator":
        delegated = _build_orchestrator_context(context_package)
    else:
        # Default to worker-level filtering for unknown archetypes
        delegated = _build_worker_context(context_package)

    # Add delegation metadata
    delegated["_delegation"] = {
        "from_agent": from_agent,
        "to_agent": to_agent,
        "target_archetype": target_archetype,
        "delegated_at": now,
    }

    return delegated


def extract_delegation_result(worker_output: dict) -> dict:
    """
    Extract the result from a worker's output for the orchestrator.

    Strips internal worker state and keeps only the meaningful output
    plus provenance.

    Args:
        worker_output: The full output from a worker agent.

    Returns:
        Dict with: result, provenance_tags, metadata.
    """
    if not isinstance(worker_output, dict):
        raise TypeError("extract_delegation_result: worker_output must be a dict")

    result: dict[str, Any] = {}

    # Extract the main response/result
    if "context" in worker_output:
        result["context"] = worker_output["context"]
    elif "result" in worker_output:
        result["result"] = worker_output["result"]
    elif "response" in worker_output:
        result["result"] = worker_output["response"]
    else:
        result["result"] = worker_output

    # Carry provenance tags
    metadata = worker_output.get("_metadata", {})
    result["provenance_tags"] = metadata.get("provenance_tags", [])

    # Keep trace ID for observability
    result["trace_id"] = metadata.get("trace_id")
    result["budget_report"] = metadata.get("budget_report")

    return result


def build_reviewer_context(
    worker_output: dict,
    provenance_tags: list[dict] | None = None,
) -> dict:
    """
    Build context for a reviewer agent from worker output.

    Reviewers get: worker output + provenance tags + system_prompt_context
    + user_context if present. They do NOT get entity data or KB chunks directly.

    Args:
        worker_output: The output from the worker agent.
        provenance_tags: Optional explicit provenance tags to include.

    Returns:
        Context package suitable for a reviewer.
    """
    if not isinstance(worker_output, dict):
        raise TypeError("build_reviewer_context: worker_output must be a dict")

    # Extract the worker's result
    worker_result = extract_delegation_result(worker_output)

    # Build reviewer context (aligned with _build_reviewer_context — §8.3)
    reviewer_ctx: dict[str, Any] = {
        "worker_output": worker_result.get("result") or worker_result.get("context"),
        "provenance_tags": provenance_tags or worker_result.get("provenance_tags", []),
    }

    # Include system_prompt_context and user_context if available
    # (matches _build_reviewer_context behavior for consistent reviewer judgment)
    if "system_prompt_context" in worker_output:
        reviewer_ctx["system_prompt_context"] = worker_output["system_prompt_context"]
    if "user_context" in worker_output:
        reviewer_ctx["user_context"] = worker_output["user_context"]

    # Validate provenance tags
    valid_tags = []
    for tag in reviewer_ctx["provenance_tags"]:
        validation = validate_provenance(tag)
        if validation["valid"]:
            valid_tags.append(tag)
    reviewer_ctx["provenance_tags"] = valid_tags

    reviewer_ctx["_delegation"] = {
        "source": "worker",
        "trace_id": worker_result.get("trace_id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    return reviewer_ctx


def merge_delegation_results(results: list[dict]) -> dict:
    """
    Merge results from multiple delegated workers into a composed response.

    Used by orchestrator to combine outputs from parallel worker delegations.

    Args:
        results: List of delegation results (from extract_delegation_result).

    Returns:
        Composed dict with: merged_results, all_provenance_tags,
        trace_ids, merged_at.
    """
    if not isinstance(results, list):
        raise TypeError("merge_delegation_results: results must be a list")

    merged_results: list[Any] = []
    all_provenance: list[dict] = []
    trace_ids: list[str] = []

    for r in results:
        if not isinstance(r, dict):
            continue

        # Collect the result data
        result_data = r.get("result") or r.get("context")
        if result_data is not None:
            merged_results.append(result_data)

        # Collect provenance tags
        tags = r.get("provenance_tags", [])
        all_provenance.extend(tags)

        # Collect trace IDs
        tid = r.get("trace_id")
        if tid:
            trace_ids.append(tid)

    return {
        "merged_results": merged_results,
        "result_count": len(merged_results),
        "all_provenance_tags": all_provenance,
        "trace_ids": trace_ids,
        "merged_at": datetime.now(timezone.utc).isoformat(),
    }


# ── Internal helpers ──────────────────────────────────────────────────────


def _build_worker_context(context_package: dict) -> dict:
    """Build context for a worker: strip routing metadata."""
    filtered: dict[str, Any] = {}
    for key, value in context_package.items():
        if key in _ROUTING_METADATA_KEYS:
            continue
        if key in _ORCHESTRATOR_ONLY_KEYS:
            continue
        if key == "_metadata":
            # Keep only non-routing metadata
            meta = value if isinstance(value, dict) else {}
            filtered["_metadata"] = {
                k: v for k, v in meta.items()
                if k not in ("delegation_plan", "agent_selection_reasoning")
            }
        else:
            filtered[key] = value
    return filtered


def _build_reviewer_context(context_package: dict) -> dict:
    """Build context for a reviewer: worker output + provenance only."""
    filtered: dict[str, Any] = {}

    # Reviewers get: system_prompt_context, user_context, and any worker_output
    for key in ("system_prompt_context", "user_context", "worker_output"):
        if key in context_package:
            filtered[key] = context_package[key]

    # Always include provenance
    if "_metadata" in context_package:
        meta = context_package["_metadata"]
        if isinstance(meta, dict):
            filtered["provenance_tags"] = meta.get("provenance_tags", [])
            filtered["trace_id"] = meta.get("trace_id")

    return filtered


def _build_orchestrator_context(context_package: dict) -> dict:
    """Build context for returning to orchestrator: full results."""
    # Orchestrators get everything back
    return dict(context_package)
