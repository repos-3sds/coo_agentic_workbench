"""
MCP Tool Provenance Wrapper (Sprint 4 — S4-006)

Provides utilities to wrap Model Context Protocol (MCP) tool results
with compliant provenance tags before they enter the context pipeline.

Blueprint Section 4 — Provenance bridge.

Status: IMPLEMENTED
"""

from __future__ import annotations

import traceback
from datetime import datetime, timezone
from typing import Any

from context_engine.provenance import tag_provenance


def create_tool_provenance(tool_name: str) -> dict:
    """
    Returns base provenance tag configuration for a tool.
    Auto-sets required trusted fields.
    """
    return {
        "source_id": tool_name,
        "source_type": "general_web",
        "authority_tier": 5,
        "trust_class": "UNTRUSTED",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 3600,
        "data_classification": "INTERNAL"  # Default if not specified
    }


def wrap_tool_result(tool_name: str, result: Any, metadata: dict | None = None) -> dict:
    """
    Returns tagged result with provenance.
    If result is an exception, tags it accordingly gracefully.
    """
    meta = create_tool_provenance(tool_name)
    if metadata:
        meta.update(metadata)
        
    is_error = isinstance(result, Exception)
    if is_error:
        meta["trust_class"] = "UNTRUSTED"
        meta["authority_tier"] = 5
        result_data = {"error": str(result), "traceback": traceback.format_exc()}
    else:
        result_data = result
        
    try:
        return tag_provenance(result_data, meta)
    except Exception as e:
        # Graceful degradation if tagging fails, return error provenance tag
        error_meta = create_tool_provenance(tool_name)
        error_meta["trust_class"] = "UNTRUSTED"
        error_meta["authority_tier"] = 5
        return tag_provenance({"error": f"Provenance wrapping failed: {str(e)}"}, error_meta)


def batch_wrap_results(results: list[dict]) -> list[dict]:
    """
    Wraps multiple results. Expected list of dicts with 
    keys: 'tool_name', 'result', and optional 'metadata'.
    """
    wrapped = []
    for item in results:
        tname = item.get("tool_name", "unknown_tool")
        res = item.get("result")
        meta = item.get("metadata")
        wrapped.append(wrap_tool_result(tname, res, meta))
    return wrapped
