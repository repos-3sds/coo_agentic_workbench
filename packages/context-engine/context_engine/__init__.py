from __future__ import annotations

"""
COO Context Engine — Public API

Standalone context engineering pipeline for the COO Agentic Workbench.
Assembles the right data, from the right sources, at the right time,
for AI agents operating across NPA, ORM, DCE, and Desk Support domains.

Architecture: 7-stage pipeline
    Classify -> Scope -> Retrieve -> Rank -> Budget -> Assemble -> Tag

Usage:
    from context_engine import classify_trust, load_contract, tag_provenance
    from context_engine.trust import rank_sources, resolve_conflict
"""

__version__ = "1.0.0"

# Sprint 1 modules
from context_engine.trust import (
    classify_trust,
    classify_data_level,
    rank_sources,
    resolve_conflict,
    can_user_access,
    is_never_allowed,
    get_source_hierarchy,
    get_source_tier,
)

from context_engine.contracts import (
    load_contract,
    validate_context,
    get_required_sources,
    get_budget_profile,
    get_optional_context,
    get_excluded_context,
    list_archetypes,
    get_contract_version,
)

from context_engine.provenance import (
    tag_provenance,
    validate_provenance,
    is_expired,
    get_authority_tier,
    strip_provenance,
    create_provenance_tag,
    merge_provenance,
    get_required_fields,
    compute_chunk_hash,
)

# Sprint 2 modules
from context_engine.token_counter import (
    count_tokens,
    count_tokens_batch,
    count_tokens_for_object,
    estimate_tokens,
    estimate_context_tokens,
    get_model_limit,
    truncate_to_tokens,
)

from context_engine.scoper import (
    scope_by_domain,
    scope_by_entity,
    scope_by_jurisdiction,
    scope_by_classification,
    scope_by_role,
    scope_by_temporal,
    apply_all_scopes,
    scope_context,
    get_scoping_rules,
    filter_by_entitlements,
)

from context_engine.budget import (
    allocate_budget,
    check_budget,
    trim_to_budget,
    get_budget_limits,
    get_overflow_report,
    get_budget_for_profile,
    handle_overflow,
)

from context_engine.assembler import (
    assemble_context,
    validate_assembled_context,
    create_assembler,
)

# Sprint 3 modules
from context_engine.memory import (
    create_session,
    add_turn,
    get_relevant_history,
    get_working_memory,
    get_entity_memory,
    update_entity_memory,
    get_domain_memory,
    update_domain_memory,
    compress_history,
    serialize_session,
    deserialize_session,
)

from context_engine.delegation import (
    create_delegation_package,
    extract_delegation_result,
    build_reviewer_context,
    merge_delegation_results,
)

from context_engine.tracer import (
    create_trace,
    add_stage_event,
    finalize_trace,
    get_trace_metrics,
    serialize_trace,
)

# Sprint 4 modules
from context_engine.circuit_breaker import (
    create_circuit_breaker,
    call_with_breaker,
    get_breaker_state,
)

from context_engine.mcp_provenance import (
    create_tool_provenance,
    wrap_tool_result,
    batch_wrap_results,
)

# Sprint 5 modules
from context_engine.grounding import (
    score_grounding,
    identify_claims,
    verify_claim,
    get_grounding_requirements,
)

from context_engine.rag import (
    create_rag_pipeline,
    retrieve,
    rerank,
    get_chunking_strategy,
    get_rag_config,
)


# ── Convenience Factory ──────────────────────────────────────────────────


def create_context_engine(config: dict | None = None) -> dict:
    """
    Convenience factory: creates a fully-configured context engine instance.

    Returns a dict with bound functions for the main pipeline operations.
    This is the recommended entry point for consuming applications.

    Args:
        config: Optional configuration overrides.

    Returns:
        Dict with keys: assemble, validate, create_session, create_trace,
        create_breaker, wrap_tool, version, config.
    """
    cfg = config or {}
    assembler = create_assembler(cfg)

    return {
        "assemble": assembler["assemble"],
        "validate": assembler["validate"],
        "create_session": create_session,
        "create_trace": create_trace,
        "create_breaker": create_circuit_breaker,
        "wrap_tool": wrap_tool_result,
        "score_grounding": score_grounding,
        "retrieve": retrieve,
        "rerank": rerank,
        "version": __version__,
        "config": cfg,
    }


__all__ = [
    # Trust
    "classify_trust", "classify_data_level", "rank_sources",
    "resolve_conflict", "can_user_access", "is_never_allowed",
    "get_source_hierarchy", "get_source_tier",
    # Contracts
    "load_contract", "validate_context", "get_required_sources",
    "get_budget_profile", "get_optional_context", "get_excluded_context",
    "list_archetypes", "get_contract_version",
    # Provenance
    "tag_provenance", "validate_provenance", "is_expired",
    "get_authority_tier", "strip_provenance", "create_provenance_tag",
    "merge_provenance", "get_required_fields", "compute_chunk_hash",
    # Token Counter
    "count_tokens", "count_tokens_batch", "count_tokens_for_object",
    "estimate_tokens", "estimate_context_tokens", "get_model_limit",
    "truncate_to_tokens",
    # Scoper
    "scope_by_domain", "scope_by_entity", "scope_by_jurisdiction",
    "scope_by_classification", "scope_by_role", "scope_by_temporal",
    "apply_all_scopes", "scope_context", "get_scoping_rules",
    "filter_by_entitlements",
    # Budget
    "allocate_budget", "check_budget", "trim_to_budget", "get_budget_limits",
    "get_overflow_report", "get_budget_for_profile", "handle_overflow",
    # Assembler
    "assemble_context", "validate_assembled_context", "create_assembler",
    # Memory (Sprint 3)
    "create_session", "add_turn", "get_relevant_history",
    "get_working_memory", "get_entity_memory", "update_entity_memory",
    "get_domain_memory", "update_domain_memory", "compress_history",
    "serialize_session", "deserialize_session",
    # Delegation (Sprint 3)
    "create_delegation_package", "extract_delegation_result",
    "build_reviewer_context", "merge_delegation_results",
    # Tracer (Sprint 3)
    "create_trace", "add_stage_event", "finalize_trace",
    "get_trace_metrics", "serialize_trace",
    # Circuit Breaker (Sprint 4)
    "create_circuit_breaker", "call_with_breaker", "get_breaker_state",
    # MCP Provenance (Sprint 4)
    "create_tool_provenance", "wrap_tool_result", "batch_wrap_results",
    # Grounding (Sprint 5)
    "score_grounding", "identify_claims", "verify_claim",
    "get_grounding_requirements",
    # RAG (Sprint 5)
    "create_rag_pipeline", "retrieve", "rerank",
    "get_chunking_strategy", "get_rag_config",
    # Factory
    "create_context_engine",
]
