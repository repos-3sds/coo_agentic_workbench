"""
Core Context Assembler — 7-Stage Pipeline (Sprint 2 — S2-008)

Orchestrates the full context assembly pipeline:
    1. Classify — load contract, classify trust on incoming sources
    2. Scope   — filter data by domain, entity, jurisdiction
    3. Retrieve — call adapters to fetch entity data, KB chunks
    4. Rank    — sort retrieved data by source authority tier
    5. Budget  — allocate tokens, handle overflow
    6. Assemble — compose the final context package
    7. Tag     — apply provenance tags to all assembled data

This is the top-level entry point that composes all S1 + S2 modules.

Depends on: trust, contracts, provenance, token_counter, budget, scoper

Blueprint Section 4 — Core pipeline.

Status: IMPLEMENTED
"""

from __future__ import annotations

import uuid
import time
from typing import Any, Callable, Protocol

from context_engine.trust import classify_trust, rank_sources
from context_engine.contracts import load_contract, validate_context, get_budget_profile
from context_engine.provenance import (
    tag_provenance,
    create_provenance_tag,
    validate_provenance,
)
from context_engine.scoper import apply_all_scopes
from context_engine.budget import allocate_budget, trim_to_budget


# ── Adapter Protocol ──────────────────────────────────────────────────────
# Dependency Inversion: the engine defines WHAT data it needs;
# the consuming app provides HOW via adapter functions.


class Adapters(Protocol):
    """Protocol for the adapter dict passed to assemble_context."""

    def retrieve(self, query: dict) -> list[dict]:
        """Fetch KB chunks matching a query. Returns list of tagged dicts."""
        ...

    def get_entity_data(self, entity_ids: list[str], domain: str) -> list[dict]:
        """Fetch entity data for given IDs and domain."""
        ...

    def get_kb_chunks(self, domain: str, query: str) -> list[dict]:
        """Fetch knowledge base chunks for a domain query."""
        ...


# ── Internal helpers ──────────────────────────────────────────────────────


def _make_trace_id() -> str:
    """Generate a unique trace ID for this pipeline run."""
    return f"ctx-{uuid.uuid4().hex[:12]}"


def _stage_event(name: str, start: float, details: dict | None = None) -> dict:
    """Create a trace event for a pipeline stage."""
    duration_ms = round((time.monotonic() - start) * 1000, 2)
    event = {"stage": name, "duration_ms": duration_ms}
    if details:
        event["details"] = details
    return event


# ── Public API ────────────────────────────────────────────────────────────


def assemble_context(
    request: dict,
    archetype: str,
    domain: str,
    user_context: dict | None = None,
    adapters: dict | None = None,
) -> dict:
    """
    Main entry point: assemble a complete context package for an agent.

    7-stage pipeline:
        1. Classify — load contract for archetype, classify trust
        2. Scope   — filter data by domain + entity + jurisdiction
        3. Retrieve — call adapters to fetch data
        4. Rank    — sort by source authority tier
        5. Budget  — allocate tokens, handle overflow
        6. Assemble — compose final context package
        7. Tag     — apply provenance tags to all data

    Args:
        request: Dict with keys: agent_id, entity_ids, query,
                 conversation_history, few_shot_examples, tool_schemas.
        archetype: One of "orchestrator", "worker", "reviewer".
        domain: Domain identifier (e.g. "NPA", "ORM").
        user_context: Optional dict with user_id, role, department,
                      jurisdiction, session_id.
        adapters: Optional dict with callable keys: retrieve, get_entity_data,
                  get_kb_chunks. If None, stages that need adapters produce empty data.

    Returns:
        Dict: {context: dict, _metadata: dict}
    """
    adapters = adapters or {}
    user_context = user_context or {}
    trace_id = _make_trace_id()
    stages: list[dict] = []

    # ── Stage 1: CLASSIFY ─────────────────────────────────────────────
    t0 = time.monotonic()
    contract = load_contract(archetype)
    profile = get_budget_profile(contract)

    # Classify trust on any pre-supplied sources in the request
    classified_sources: list[dict] = []
    for src in request.get("sources", []):
        source_type = src.get("source_type", "user_input")
        trust_class = classify_trust(source_type)
        classified_sources.append({**src, "trust_class": trust_class})

    stages.append(_stage_event("CLASSIFY", t0, {
        "archetype": archetype,
        "profile": profile,
        "sources_classified": len(classified_sources),
    }))

    # ── Stage 2: SCOPE ────────────────────────────────────────────────
    t0 = time.monotonic()
    scoping_config: dict[str, Any] = {"domain": domain}
    entity_ids = request.get("entity_ids", [])
    if entity_ids:
        scoping_config["entity_id"] = entity_ids[0]
        scoping_config["entity_type"] = request.get("entity_type", "project")
    if user_context.get("jurisdiction"):
        scoping_config["jurisdiction"] = user_context["jurisdiction"]
    if user_context.get("role"):
        scoping_config["user_role"] = user_context["role"]

    # Scope any pre-classified sources
    scoped_sources = apply_all_scopes(classified_sources, scoping_config)

    stages.append(_stage_event("SCOPE", t0, {
        "config": scoping_config,
        "before": len(classified_sources),
        "after": len(scoped_sources),
    }))

    # ── Stage 3: RETRIEVE ─────────────────────────────────────────────
    t0 = time.monotonic()
    entity_data: list[dict] = []
    kb_chunks: list[dict] = []

    get_entity_data_fn = adapters.get("get_entity_data")
    if get_entity_data_fn and entity_ids:
        try:
            result = get_entity_data_fn(entity_ids, domain)
            entity_data = result if result is not None else []
        except Exception:
            entity_data = []

    get_kb_chunks_fn = adapters.get("get_kb_chunks")
    query = request.get("query", "")
    if get_kb_chunks_fn and query:
        try:
            result = get_kb_chunks_fn(domain, query)
            kb_chunks = result if result is not None else []
        except Exception:
            kb_chunks = []

    retrieve_fn = adapters.get("retrieve")
    extra_retrieved: list[dict] = []
    if retrieve_fn:
        try:
            result = retrieve_fn({
                "domain": domain,
                "query": query,
                "entity_ids": entity_ids,
            })
            extra_retrieved = result if result is not None else []
        except Exception:
            extra_retrieved = []

    stages.append(_stage_event("RETRIEVE", t0, {
        "entity_data_count": len(entity_data),
        "kb_chunks_count": len(kb_chunks),
        "extra_retrieved_count": len(extra_retrieved),
    }))

    # ── Stage 4: RANK ─────────────────────────────────────────────────
    t0 = time.monotonic()
    all_sources = scoped_sources + entity_data + kb_chunks + extra_retrieved

    # Tag each item with its category so ranking can be applied per-slot
    n_scoped = len(scoped_sources)
    n_entity = len(entity_data)
    n_kb = len(kb_chunks)

    rankable = []
    for idx, item in enumerate(all_sources):
        prov = item.get("provenance", {})
        if idx < n_scoped:
            category = "_scoped"
        elif idx < n_scoped + n_entity:
            category = "entity_data"
        elif idx < n_scoped + n_entity + n_kb:
            category = "knowledge_chunks"
        else:
            category = "cross_agent_context"
        rankable.append({
            "data": item,
            "authority_tier": prov.get("authority_tier", 5),
            "source_type": prov.get("source_type", item.get("source_type", "general_web")),
            "_category": category,
        })

    ranked = rank_sources(rankable)

    # Extract ranked items back into their respective slots
    ranked_entity_data = [r["data"] for r in ranked if r["_category"] == "entity_data"]
    ranked_kb_chunks = [r["data"] for r in ranked if r["_category"] == "knowledge_chunks"]
    ranked_cross_agent = [r["data"] for r in ranked if r["_category"] == "cross_agent_context"]

    stages.append(_stage_event("RANK", t0, {
        "total_sources": len(all_sources),
        "ranked": len(ranked),
    }))

    # ── Stage 5: BUDGET ───────────────────────────────────────────────
    t0 = time.monotonic()

    # Build a draft context package from RANKED data (not pre-ranked)
    draft_context: dict[str, Any] = {
        "system_prompt_context": request.get("system_prompt", ""),
        "entity_data": ranked_entity_data,
        "knowledge_chunks": ranked_kb_chunks,
        "cross_agent_context": ranked_cross_agent,
        "few_shot_examples": request.get("few_shot_examples", []),
        "conversation_history": request.get("conversation_history", []),
        "tool_schemas": request.get("tool_schemas", []),
    }

    budget_report = allocate_budget(draft_context, contract)

    # If over budget, trim
    if not budget_report["within_budget"]:
        trim_result = trim_to_budget(draft_context, contract)
        draft_context = trim_result["trimmed_context"]
        budget_report["trimmed"] = True
        budget_report["removed_slots"] = trim_result["removed_slots"]
        budget_report["final_tokens"] = trim_result["final_tokens"]
    else:
        budget_report["trimmed"] = False

    stages.append(_stage_event("BUDGET", t0, {
        "total_tokens": budget_report["total"],
        "within_budget": budget_report["within_budget"],
        "profile": budget_report["profile"],
    }))

    # ── Stage 6: ASSEMBLE ─────────────────────────────────────────────
    t0 = time.monotonic()

    # Add user_context to the assembled package
    draft_context["user_context"] = user_context

    stages.append(_stage_event("ASSEMBLE", t0, {
        "slots": list(draft_context.keys()),
    }))

    # ── Stage 7: TAG ──────────────────────────────────────────────────
    t0 = time.monotonic()

    provenance_tags: list[dict] = []
    for item in all_sources:
        prov = item.get("provenance")
        if prov:
            validation = validate_provenance(prov)
            if validation["valid"]:
                provenance_tags.append(prov)

    stages.append(_stage_event("TAG", t0, {
        "provenance_tags_collected": len(provenance_tags),
    }))

    # ── Final output ──────────────────────────────────────────────────
    return {
        "context": draft_context,
        "_metadata": {
            "trace_id": trace_id,
            "archetype": archetype,
            "domain": domain,
            "stages": stages,
            "budget_report": budget_report,
            "provenance_tags": provenance_tags,
        },
    }


def validate_assembled_context(context_package: dict, archetype: str) -> dict:
    """
    Validate an assembled context package against its contract.

    Args:
        context_package: The "context" dict from assemble_context output.
        archetype: The archetype to validate against.

    Returns:
        Dict from contracts.validate_context: {valid, missing_required,
        unexpected_included, warnings}.
    """
    contract = load_contract(archetype)
    return validate_context(context_package, contract)


def create_assembler(config: dict | None = None) -> dict:
    """
    Factory to create a configured assembler instance.

    Args:
        config: Optional configuration overrides.

    Returns:
        Dict with callable keys: assemble, validate.
    """
    cfg = config or {}

    def _assemble(request: dict, archetype: str, domain: str, **kwargs: Any) -> dict:
        return assemble_context(
            request=request,
            archetype=archetype,
            domain=domain,
            user_context=kwargs.get("user_context"),
            adapters=kwargs.get("adapters"),
        )

    def _validate(context: dict, archetype: str) -> dict:
        return validate_assembled_context(context, archetype)

    return {
        "assemble": _assemble,
        "validate": _validate,
        "config": cfg,
    }
