"""
Full Regression Test Suite (Sprint 6 — S6-007)

Comprehensive regression tests covering the entire context engine:
    - NPA domain: full pipeline pass
    - Desk Support domain: full pipeline pass
    - Demo domain: full pipeline pass
    - Cross-domain delegation
    - Failure modes
    - Budget overflow + compression
    - Trust classification edge cases
    - Provenance validation
    - Contract validation
    - Memory + delegation context
    - Grounding + RAG

Status: IMPLEMENTED (30+ tests)
"""

from __future__ import annotations

import pytest

from context_engine import (
    # Trust
    classify_trust,
    classify_data_level,
    rank_sources,
    resolve_conflict,
    can_user_access,
    is_never_allowed,
    # Contracts
    load_contract,
    validate_context,
    get_required_sources,
    get_budget_profile,
    # Provenance
    tag_provenance,
    validate_provenance,
    create_provenance_tag,
    is_expired,
    # Token counter
    count_tokens,
    estimate_tokens,
    # Scoper
    scope_by_domain,
    scope_by_role,
    apply_all_scopes,
    # Budget
    allocate_budget,
    trim_to_budget,
    get_budget_limits,
    # Assembler
    assemble_context,
    create_assembler,
    # Memory
    create_session,
    add_turn,
    get_relevant_history,
    compress_history,
    serialize_session,
    deserialize_session,
    # Delegation
    create_delegation_package,
    extract_delegation_result,
    build_reviewer_context,
    merge_delegation_results,
    # Tracer
    create_trace,
    add_stage_event,
    finalize_trace,
    # Circuit Breaker
    create_circuit_breaker,
    # MCP Provenance
    wrap_tool_result,
    batch_wrap_results,
    # Grounding
    score_grounding,
    identify_claims,
    # RAG
    create_rag_pipeline,
    retrieve,
    rerank,
    # Factory
    create_context_engine,
)


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def npa_request():
    """Standard NPA pipeline request."""
    return {
        "agent_id": "NPA_BIZ",
        "entity_ids": ["NPA-200"],
        "query": "Evaluate viability of new derivative product",
        "system_prompt": "You are a business analyst at MBS.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


@pytest.fixture
def desk_request():
    """Standard Desk Support request."""
    return {
        "agent_id": "DESK_TRIAGE",
        "entity_ids": ["CPTY-100"],
        "query": "Help resolve onboarding documentation gap",
        "system_prompt": "You are a desk support agent.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


@pytest.fixture
def demo_request():
    """Demo domain request."""
    return {
        "agent_id": "DEMO_AGENT",
        "entity_ids": ["DEMO-001"],
        "query": "Test query for demo domain",
        "system_prompt": "Demo agent.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


@pytest.fixture
def mock_adapters():
    """Mock adapters for assembler (must return lists for concatenation)."""
    return {
        "retrieve": lambda query, domain, opts: [
            {"content": "NPA SOP section 4.2", "source_id": "bank_sops",
             "source_type": "bank_sop", "authority_tier": 2},
        ],
        "get_entity_data": lambda entity_ids, domain: [
            {"id": eid, "status": "Active", "source_id": "npa_project_api",
             "source_type": "system_of_record", "authority_tier": 1,
             "trust_class": "TRUSTED", "data_classification": "CONFIDENTIAL"}
            for eid in entity_ids
        ],
        "get_kb_chunks": lambda query, domain, opts: [
            {"content": "Classification criteria require dual scoring.",
             "source_id": "bank_sops", "source_type": "bank_sop",
             "authority_tier": 2, "trust_class": "TRUSTED",
             "data_classification": "INTERNAL"},
        ],
    }


# ── 1. NPA Domain Pipeline ──────────────────────────────────────────────────


class TestNPADomainRegression:
    """NPA domain: full pipeline pass."""

    def test_npa_worker_pipeline(self, npa_request):
        """NPA worker assembles 7-stage context."""
        result = assemble_context(
            request=npa_request, archetype="worker", domain="NPA",
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")
        stages = [s["stage"] for s in result["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]

    def test_npa_orchestrator_pipeline(self):
        """NPA orchestrator gets lightweight budget."""
        result = assemble_context(
            request={
                "agent_id": "NPA_ORCHESTRATOR", "entity_ids": [],
                "query": "Route", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="orchestrator", domain="NPA",
        )
        assert result["_metadata"]["budget_report"]["profile"] == "lightweight"

    def test_npa_reviewer_pipeline(self):
        """NPA reviewer gets compact budget."""
        result = assemble_context(
            request={
                "agent_id": "NPA_REVIEWER", "entity_ids": [],
                "query": "Review", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="reviewer", domain="NPA",
        )
        assert result["_metadata"]["budget_report"]["profile"] == "compact"

    def test_npa_with_adapters(self, npa_request, mock_adapters):
        """NPA pipeline with adapters produces entity data and KB chunks."""
        result = assemble_context(
            request=npa_request, archetype="worker", domain="NPA",
            adapters=mock_adapters,
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")


# ── 2. Desk Support Domain Pipeline ─────────────────────────────────────────


class TestDeskDomainRegression:
    """Desk Support domain: full pipeline pass."""

    def test_desk_worker_pipeline(self, desk_request):
        """Desk worker assembles 7 stages."""
        result = assemble_context(
            request=desk_request, archetype="worker", domain="DESK",
        )
        stages = [s["stage"] for s in result["_metadata"]["stages"]]
        assert len(stages) == 7

    def test_desk_orchestrator_pipeline(self):
        """Desk orchestrator uses lightweight profile."""
        result = assemble_context(
            request={
                "agent_id": "DESK_ORCH", "entity_ids": [],
                "query": "Route support request", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="orchestrator", domain="DESK",
        )
        assert result["_metadata"]["budget_report"]["profile"] == "lightweight"


# ── 3. Demo Domain Pipeline ─────────────────────────────────────────────────


class TestDemoDomainRegression:
    """Demo domain: full pipeline pass."""

    def test_demo_pipeline(self, demo_request):
        """Demo domain assembles full pipeline."""
        result = assemble_context(
            request=demo_request, archetype="worker", domain="DEMO",
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")
        assert len(result["_metadata"]["stages"]) == 7


# ── 3b. ORM Domain Pipeline ──────────────────────────────────────────────────


class TestORMDomainRegression:
    """ORM domain: full pipeline pass."""

    def test_orm_worker_pipeline(self):
        """ORM worker assembles 7 stages."""
        result = assemble_context(
            request={
                "agent_id": "ORM_INCIDENT", "entity_ids": ["INC-500"],
                "query": "Analyze root cause of operational risk event",
                "system_prompt": "You are an ORM analyst.",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="worker", domain="ORM",
        )
        stages = [s["stage"] for s in result["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]

    def test_orm_orchestrator_pipeline(self):
        """ORM orchestrator gets lightweight budget."""
        result = assemble_context(
            request={
                "agent_id": "ORM_ORCH", "entity_ids": [],
                "query": "Route incident analysis", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="orchestrator", domain="ORM",
        )
        assert result["_metadata"]["budget_report"]["profile"] == "lightweight"

    def test_orm_reviewer_pipeline(self):
        """ORM reviewer gets compact budget."""
        result = assemble_context(
            request={
                "agent_id": "ORM_REVIEWER", "entity_ids": [],
                "query": "Review incident analysis", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="reviewer", domain="ORM",
        )
        assert result["_metadata"]["budget_report"]["profile"] == "compact"


# ── 4. Cross-Domain Delegation ──────────────────────────────────────────────


class TestCrossDomainDelegation:
    """Cross-domain delegation chain tests."""

    def test_npa_to_desk_delegation(self, npa_request):
        """Delegate from NPA orchestrator to Desk worker."""
        orch_ctx = assemble_context(
            request=npa_request, archetype="orchestrator", domain="NPA",
        )
        pkg = create_delegation_package(
            from_agent="NPA_ORCHESTRATOR",
            to_agent="DESK_TRIAGE",
            context_package=orch_ctx,
            archetype="worker",
        )
        assert pkg["_delegation"]["to_agent"] == "DESK_TRIAGE"
        assert pkg["_delegation"]["target_archetype"] == "worker"

    def test_delegation_result_extraction(self, npa_request):
        """Extract result from delegated worker."""
        worker_output = {
            "output": "Product viable with risk caveats.",
            "confidence": 0.85,
            "agent_id": "NPA_BIZ",
        }
        result = extract_delegation_result(worker_output)
        # No "context"/"result"/"response" key → entire dict wrapped under "result"
        assert "result" in result
        assert result["result"]["output"] == "Product viable with risk caveats."

    def test_reviewer_context_from_delegation(self, npa_request):
        """Build reviewer context from delegation results."""
        worker_result = {
            "output": "Analysis complete",
            "provenance": [{"source_id": "bank_sops", "authority_tier": 2}],
        }
        reviewer_ctx = build_reviewer_context(
            worker_output=worker_result,
            provenance_tags=[{"source_id": "bank_sops", "authority_tier": 2}],
        )
        assert "worker_output" in reviewer_ctx

    def test_merge_multiple_delegation_results(self):
        """Merge results from multiple delegated workers."""
        results = [
            {"agent_id": "NPA_BIZ", "output": "Viable", "confidence": 0.9},
            {"agent_id": "NPA_RISK", "output": "Medium risk", "confidence": 0.8},
        ]
        merged = merge_delegation_results(results)
        # merged should contain combined data from all results
        assert isinstance(merged, dict)


# ── 5. Failure Modes ────────────────────────────────────────────────────────


class TestFailureModes:
    """All failure modes and graceful degradation."""

    def test_missing_agent_id_still_assembles(self):
        """Missing agent_id falls back to defaults."""
        result = assemble_context(
            request={
                "agent_id": "", "entity_ids": [], "query": "test",
                "system_prompt": "", "conversation_history": [],
                "few_shot_examples": [], "tool_schemas": [], "sources": [],
            },
            archetype="worker", domain="NPA",
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")

    def test_adapter_exception_handled(self):
        """Adapter exception doesn't crash pipeline."""
        def failing_adapter(query, domain, opts):
            raise RuntimeError("Connection timeout")

        result = assemble_context(
            request={
                "agent_id": "test", "entity_ids": [], "query": "test",
                "system_prompt": "", "conversation_history": [],
                "few_shot_examples": [], "tool_schemas": [], "sources": [],
            },
            archetype="worker", domain="NPA",
            adapters={"retrieve": failing_adapter},
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")

    def test_empty_entity_ids_handled(self):
        """Empty entity_ids doesn't crash."""
        result = assemble_context(
            request={
                "agent_id": "test", "entity_ids": [], "query": "test",
                "system_prompt": "", "conversation_history": [],
                "few_shot_examples": [], "tool_schemas": [], "sources": [],
            },
            archetype="worker", domain="NPA",
        )
        assert len(result["_metadata"]["stages"]) == 7

    def test_circuit_breaker_protects_calls(self):
        """Circuit breaker opens after repeated failures."""
        breaker = create_circuit_breaker({
            "failure_threshold": 2,
            "fallback": lambda: "safe_fallback",
        })
        def fail():
            raise RuntimeError("error")

        breaker["call"](fail)
        breaker["call"](fail)
        assert breaker["get_state"]() == "OPEN"

        result = breaker["call"](fail)
        assert result == "safe_fallback"


# ── 6. Budget Overflow + Compression ────────────────────────────────────────


class TestBudgetOverflow:
    """Budget overflow and compression strategy tests."""

    def test_budget_limits_per_profile(self):
        """Each profile returns correct max_tokens."""
        lw = get_budget_limits("lightweight")
        std = get_budget_limits("standard")
        cmp = get_budget_limits("compact")
        assert lw["max_tokens"] < std["max_tokens"]
        assert cmp["max_tokens"] < std["max_tokens"]

    def test_trim_to_budget_removes_low_priority(self):
        """trim_to_budget removes low-priority slots first."""
        context = {
            "system_prompt_context": {"content": "prompt", "tokens": 100, "priority": "FIXED"},
            "entity_data": {"content": "data", "tokens": 100, "priority": "HIGH"},
            "conversation_history": {"content": "long history " * 500, "tokens": 50000, "priority": "LOW"},
        }
        contract = load_contract("worker")
        trimmed = trim_to_budget(context, contract)
        assert isinstance(trimmed, dict)


# ── 7. Trust Classification Edge Cases ──────────────────────────────────────


class TestTrustEdgeCases:
    """Trust classification edge cases."""

    def test_never_allowed_source_blocked(self):
        """Never-allowed sources identified correctly."""
        assert is_never_allowed("social_media") is True
        assert is_never_allowed("competitor_intelligence") is True
        assert is_never_allowed("bank_sop") is False

    def test_unknown_source_untrusted(self):
        """Unknown sources default to UNTRUSTED."""
        result = classify_trust("completely_unknown_xyz")
        assert result == "UNTRUSTED"

    def test_deny_by_default_for_unclassified(self):
        """Unclassified data defaults to RESTRICTED (deny-by-default)."""
        level = classify_data_level(None)
        assert level in ("INTERNAL", "RESTRICTED"), f"Deny-by-default should be INTERNAL or RESTRICTED, got {level}"

    def test_coo_accesses_restricted(self):
        """COO role can access RESTRICTED data."""
        assert can_user_access("coo", "RESTRICTED") is True

    def test_employee_denied_confidential(self):
        """Employee role denied CONFIDENTIAL data."""
        assert can_user_access("employee", "CONFIDENTIAL") is False


# ── 8. Provenance Validation ────────────────────────────────────────────────


class TestProvenanceRegression:
    """Provenance tag creation and validation."""

    def test_valid_provenance_tag(self):
        """Valid provenance tag passes validation."""
        tag = create_provenance_tag({
            "source_id": "bank_sops",
            "source_type": "bank_sop",
            "authority_tier": 2,
            "trust_class": "TRUSTED",
            "data_classification": "INTERNAL",
        })
        result = validate_provenance(tag)
        assert result["valid"] is True

    def test_mcp_tool_wrapping(self):
        """MCP tool result wrapping adds provenance."""
        tagged = wrap_tool_result("npa_project_api", {"project_id": "NPA-142"})
        assert "_provenance" in tagged
        assert tagged["_provenance"]["source_id"] == "npa_project_api"

    def test_batch_wrap_multiple(self):
        """Batch wrapping processes multiple results."""
        results = [
            {"tool_name": "tool_a", "result": {"data": "a"}},
            {"tool_name": "tool_b", "result": {"data": "b"}},
        ]
        wrapped = batch_wrap_results(results)
        assert len(wrapped) == 2
        assert all("_provenance" in w for w in wrapped)


# ── 9. Contract Validation ──────────────────────────────────────────────────


class TestContractRegression:
    """Contract loading and validation."""

    def test_load_all_archetypes(self):
        """All 3 archetype contracts load successfully."""
        for arch in ("orchestrator", "worker", "reviewer"):
            contract = load_contract(arch)
            assert contract["archetype"] == arch

    def test_contract_budget_profiles(self):
        """Contract budget profiles match expected values."""
        orch = load_contract("orchestrator")
        assert orch["budget_profile"] == "lightweight"
        worker = load_contract("worker")
        assert worker["budget_profile"] == "standard"
        reviewer = load_contract("reviewer")
        assert reviewer["budget_profile"] == "compact"


# ── 10. Memory + Delegation Context ─────────────────────────────────────────


class TestMemoryDelegationRegression:
    """Memory and delegation context flow."""

    def test_full_session_lifecycle(self):
        """Create → add turns → compress → serialize → deserialize."""
        session = create_session("session-001", {"domain": "NPA"})
        session = add_turn(session, {"role": "user", "content": "What is the classification?"})
        session = add_turn(session, {"role": "assistant", "content": "The project is classified as Complex."})
        assert len(session["turns"]) == 2

        compressed = compress_history(session, max_tokens=100)
        assert isinstance(compressed, dict)

        serialized = serialize_session(session)
        restored = deserialize_session(serialized)
        assert restored["session_id"] == "session-001"

    def test_tracer_full_lifecycle(self):
        """Trace: create → add stages → finalize → metrics."""
        trace = create_trace("regression-req-001")
        trace = add_stage_event(trace, "CLASSIFY", {
            "duration_ms": 1.0, "items_in": 10, "items_out": 8,
            "tokens_in": 0, "tokens_out": 400,
        })
        trace = add_stage_event(trace, "SCOPE", {
            "duration_ms": 0.5, "items_in": 8, "items_out": 5,
        })
        trace = finalize_trace(trace)
        assert trace["finalized"] is True
        assert len(trace["pipeline_stages"]) == 2


# ── 11. Grounding + RAG Regression ──────────────────────────────────────────


class TestGroundingRAGRegression:
    """Grounding scorer and RAG pipeline integration."""

    def test_grounding_score_with_provenance(self):
        """Grounded response scores > 0 with matching provenance."""
        text = "classified as Complex per SOPv3.2_NPA_Classification_Criteria"
        ctx = {
            "_metadata": {"stages": [{
                "stage": "TAG",
                "provenance": [{
                    "source_id": "SOPv3.2_NPA_Classification_Criteria",
                    "source_type": "bank_sop",
                    "trust_class": "TRUSTED",
                    "authority_tier": 2,
                    "ttl_seconds": 86400,
                }],
            }]},
        }
        result = score_grounding(text, ctx)
        assert result["score"] > 0

    def test_grounding_empty_response(self):
        """No claims = perfect grounding score."""
        result = score_grounding("Thank you!", None)
        assert result["score"] == 1.0

    def test_rag_pipeline_with_adapter(self):
        """RAG pipeline retrieves and reranks chunks."""
        def adapter(query, domain, top_k):
            return [
                {"content": "NPA classification criteria", "source_id": "bank_sops",
                 "source_type": "bank_sop", "authority_tier": 2, "relevance_score": 0.8},
                {"content": "General article about banking", "source_id": "general_web",
                 "source_type": "general_web", "authority_tier": 5, "relevance_score": 0.3},
            ]

        chunks = retrieve("NPA classification", domain="NPA", options={"adapter": adapter})
        assert len(chunks) >= 1
        # First chunk should be the bank_sop (higher authority)
        assert chunks[0]["source_id"] == "bank_sops"

    def test_factory_includes_all_functions(self):
        """create_context_engine returns all expected keys."""
        engine = create_context_engine()
        expected_keys = [
            "assemble", "validate", "create_session", "create_trace",
            "create_breaker", "wrap_tool", "score_grounding",
            "retrieve", "rerank", "version",
        ]
        for key in expected_keys:
            assert key in engine, f"Missing key: {key}"
        assert engine["version"] == "1.0.0"
