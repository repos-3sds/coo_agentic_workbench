"""
Pipeline Tracer (Sprint 3)

Traces context assembly pipeline stages for observability.
Emits structured logs compatible with Langfuse/OpenTelemetry.

Blueprint Section 13 — Observability.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
import uuid
from typing import Any
from datetime import datetime, timezone


# ── Module-level trace store (keyed by trace_id) ────────────────────────

_trace_store: dict[str, dict] = {}


def create_trace(
    request_id: str,
    agent_id: str | None = None,
    domain: str | None = None,
    entity_id: str | None = None,
    user_id: str | None = None,
) -> dict:
    """
    Create a new pipeline trace with enterprise audit fields.

    Args:
        request_id: Unique request identifier from the caller.
        agent_id: Agent executing this pipeline (e.g. "NPA_ORCHESTRATOR").
        domain: Domain context (e.g. "NPA", "ORM").
        entity_id: Primary entity being operated on (e.g. "PRJ-001").
        user_id: End-user identifier for audit attribution.

    Returns:
        Trace dict with unique trace_id and enterprise audit fields.
    """
    trace_id = str(uuid.uuid4())
    trace = {
        "trace_id": trace_id,
        "request_id": request_id,
        "agent_id": agent_id,
        "domain": domain,
        "entity_id": entity_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pipeline_stages": {},
        "sources_used": [],
        "context_package_size_tokens": 0,
        "total_duration_ms": 0.0,
        "total_tokens": 0,
        "finalized": False,
    }
    # Store for retrieval via get_pipeline_trace
    _trace_store[trace_id] = trace
    return trace


def add_stage_event(trace: dict, stage_name: str, data: dict) -> dict:
    """
    Add a stage event to the trace, keyed by stage_name in pipeline_stages{}.

    Records: started_at, duration_ms, items_in, items_out, tokens_in,
    tokens_out, decisions[], and stage-specific fields (conflicts_detected,
    overflow, sources_tagged).

    Args:
        trace: The trace dict from create_trace().
        stage_name: Pipeline stage name (e.g. "classify", "scope", "rank").
        data: Stage execution data.

    Returns:
        The updated trace.
    """
    if trace.get("finalized"):
        return trace

    event = {
        "stage_name": stage_name,
        "started_at": data.get("started_at", datetime.now(timezone.utc).isoformat()),
        "duration_ms": float(data.get("duration_ms", 0.0)),
        "items_in": int(data.get("items_in", 0)),
        "items_out": int(data.get("items_out", 0)),
        "tokens_in": int(data.get("tokens_in", 0)),
        "tokens_out": int(data.get("tokens_out", 0)),
        "decisions": data.get("decisions", []),
        # Stage-specific fields (§13.2)
        "conflicts_detected": data.get("conflicts_detected", 0),
        "overflow": data.get("overflow", False),
        "sources_tagged": data.get("sources_tagged", 0),
    }

    # Store as dict keyed by stage_name (§13.2)
    trace["pipeline_stages"][stage_name] = event

    # Also track sources used
    sources = data.get("sources_used", [])
    if sources:
        for src in sources:
            if src not in trace["sources_used"]:
                trace["sources_used"].append(src)

    # Update context package size if provided
    if "context_package_size_tokens" in data:
        trace["context_package_size_tokens"] = data["context_package_size_tokens"]

    return trace


def finalize_trace(trace: dict) -> dict:
    """
    Finalize trace with computed totals (total_duration_ms, total_tokens).

    Args:
        trace: The trace dict.

    Returns:
        The finalized trace.
    """
    if trace.get("finalized"):
        return trace

    total_duration = 0.0
    total_tokens = 0

    for stage in trace.get("pipeline_stages", {}).values():
        total_duration += stage.get("duration_ms", 0.0)
        total_tokens += stage.get("tokens_out", 0)

    trace["total_duration_ms"] = total_duration
    trace["total_tokens"] = total_tokens
    trace["finalized"] = True
    trace["finalized_at"] = datetime.now(timezone.utc).isoformat()

    # Update store
    _trace_store[trace["trace_id"]] = trace
    return trace


def get_trace_metrics(trace: dict) -> dict:
    """
    Extract metrics from a trace for dashboarding.

    Returns:
        Dict with pipeline_stages, total_duration_ms, total_tokens,
        per_stage_tokens, sources_used, context_package_size_tokens.
    """
    per_stage_tokens: dict[str, int] = {}
    total_duration = trace.get("total_duration_ms", 0.0)
    total_tokens = trace.get("total_tokens", 0)

    for name, stage in trace.get("pipeline_stages", {}).items():
        per_stage_tokens[name] = stage.get("tokens_out", 0)

    return {
        "pipeline_stages": trace.get("pipeline_stages", {}),
        "total_duration_ms": total_duration,
        "total_tokens": total_tokens,
        "per_stage_tokens": per_stage_tokens,
        "sources_used": trace.get("sources_used", []),
        "context_package_size_tokens": trace.get("context_package_size_tokens", 0),
    }


def serialize_trace(trace: dict) -> str:
    """Serialize trace to JSON string for logging/export."""
    return json.dumps(trace)


def trace_stage(
    stage_name: str,
    input_data: Any,
    output_data: Any,
    duration_ms: float,
    trace: dict | None = None,
    **kwargs: Any,
) -> dict:
    """
    Record a pipeline stage execution trace.

    Convenience wrapper around add_stage_event for simpler call sites.

    Args:
        stage_name: Name of the pipeline stage.
        input_data: Input to the stage (used to compute items_in).
        output_data: Output from the stage (used to compute items_out).
        duration_ms: Execution time in milliseconds.
        trace: Optional trace to append to. Creates ephemeral if None.
        **kwargs: Additional stage-specific fields (conflicts_detected, etc.).

    Returns:
        Stage event dict.
    """
    items_in = len(input_data) if isinstance(input_data, (list, dict)) else 0
    items_out = len(output_data) if isinstance(output_data, (list, dict)) else 0

    event_data = {
        "duration_ms": duration_ms,
        "items_in": items_in,
        "items_out": items_out,
        **kwargs,
    }

    if trace is not None:
        add_stage_event(trace, stage_name, event_data)

    return {
        "stage": stage_name,
        "duration_ms": duration_ms,
        "items_in": items_in,
        "items_out": items_out,
        **kwargs,
    }


def get_pipeline_trace(trace_id: str) -> list[dict]:
    """
    Retrieve all stage events for a pipeline execution by trace_id.

    Args:
        trace_id: The trace_id from create_trace().

    Returns:
        List of stage event dicts, or empty list if trace not found.
    """
    trace = _trace_store.get(trace_id)
    if trace is None:
        return []
    return list(trace.get("pipeline_stages", {}).values())


def reset_cache() -> None:
    """Reset module-level trace store."""
    _trace_store.clear()
