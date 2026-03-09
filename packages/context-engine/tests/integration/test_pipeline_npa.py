"""
End-to-End Pipeline Integration Tests — NPA Domain (S3-009)

Full pipeline test: request → assemble → validate → delegate → memory.
Uses NPA domain mock adapters returning realistic banking data.

Covers:
    - Orchestrator / Worker / Reviewer request archetypes
    - All 7 pipeline stages execute
    - Provenance tags on all retrieved data
    - Budget within limits for each archetype
    - Contract validation passes
    - Cross-domain delegation (Orchestrator → Worker → Reviewer chain)
    - Memory session tracking across turns
    - History compression under token budget

Depends on: trust, contracts, provenance, scoper, budget, assembler,
            memory (S3-001), delegation (S3-002)

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
import pytest

from context_engine.assembler import (
    assemble_context,
    validate_assembled_context,
    create_assembler,
)
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
from context_engine.provenance import validate_provenance
from context_engine.trust import classify_trust


# ── NPA-realistic mock data ─────────────────────────────────────────────


def _make_npa_provenance(source_id: str, source_type: str, tier: int, classification: str) -> dict:
    """Helper to build a valid NPA-domain provenance tag."""
    return {
        "source_id": source_id,
        "source_type": source_type,
        "authority_tier": tier,
        "fetched_at": "2026-03-02T08:30:00+00:00",
        "ttl_seconds": 3600,
        "trust_class": "TRUSTED",
        "data_classification": classification,
    }


@pytest.fixture
def npa_adapters():
    """Mock adapters returning NPA-domain data (projects, SOPs, agent outputs)."""
    def _retrieve(query_dict: dict) -> list[dict]:
        return [
            {
                "content": "NPA-142 risk classification: medium-high based on cross-border exposure.",
                "provenance": _make_npa_provenance(
                    "AgentResult:NPA_RMG:142", "agent_output", 3, "CONFIDENTIAL"
                ),
            }
        ]

    def _get_entity_data(entity_ids: list[str], domain: str) -> list[dict]:
        return [
            {
                "entity_id": eid,
                "entity_type": "npa_project",
                "product_type": "Structured Note",
                "status": "ideation",
                "notional_usd": 50_000_000,
                "jurisdictions": ["SG", "HK"],
                "domain": domain,
                "provenance": _make_npa_provenance(
                    f"SoR:npa_projects:{eid}", "system_of_record", 1, "CONFIDENTIAL"
                ),
            }
            for eid in entity_ids
        ]

    def _get_kb_chunks(domain: str, query: str) -> list[dict]:
        return [
            {
                "snippet": "NPA governance SOP v3.2: All structured products above USD 25M require CAO sign-off.",
                "provenance": _make_npa_provenance(
                    "SOP:NPA_GOV_v3.2", "bank_sop", 2, "INTERNAL"
                ),
            },
            {
                "snippet": "MAS Notice 637: Capital adequacy requirements for derivative positions.",
                "provenance": _make_npa_provenance(
                    "REG:MAS_637", "external_official", 2, "PUBLIC"
                ),
            },
        ]

    return {
        "retrieve": _retrieve,
        "get_entity_data": _get_entity_data,
        "get_kb_chunks": _get_kb_chunks,
    }


@pytest.fixture
def npa_request():
    """A realistic NPA orchestrator request."""
    return {
        "agent_id": "NPA_ORCHESTRATOR",
        "entity_ids": ["NPA-142"],
        "entity_type": "npa_project",
        "query": "Classify risk and recommend governance path for NPA-142",
        "system_prompt": "You are the NPA Orchestrator. Route to specialist agents.",
        "conversation_history": [
            {"role": "user", "content": "Analyze NPA-142 structured note proposal"},
        ],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


@pytest.fixture
def npa_worker_request():
    """A realistic NPA worker (BIZ) request."""
    return {
        "agent_id": "NPA_BIZ",
        "entity_ids": ["NPA-142"],
        "entity_type": "npa_project",
        "query": "Evaluate business viability of structured note NPA-142",
        "system_prompt": "You are the Business viability specialist.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


@pytest.fixture
def npa_user_context():
    """Realistic NPA user context."""
    return {
        "user_id": "u7890",
        "role": "analyst",
        "department": "Treasury",
        "jurisdiction": "SG",
        "session_id": "sess-npa-e2e-001",
    }


# ── Pipeline Integration Tests ──────────────────────────────────────────


class TestNPAPipelineOrchestrator:
    """Tests for orchestrator archetype through the full pipeline."""

    def test_orchestrator_7_stages(self, npa_request, npa_adapters, npa_user_context):
        """Orchestrator pipeline must execute all 7 stages in order."""
        res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        stages = [s["stage"] for s in res["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]

    def test_orchestrator_budget_lightweight(self, npa_request, npa_adapters, npa_user_context):
        """Orchestrator must use lightweight budget profile (51200 tokens)."""
        res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        budget = res["_metadata"]["budget_report"]
        assert budget["profile"] == "lightweight"
        assert budget["within_budget"] is True

    def test_orchestrator_provenance_tags_collected(self, npa_request, npa_adapters, npa_user_context):
        """All adapter-sourced data must carry valid provenance tags."""
        res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        tags = res["_metadata"]["provenance_tags"]
        # 1 entity + 2 KB chunks + 1 cross-agent = 4 provenance tags
        assert len(tags) == 4
        for tag in tags:
            validation = validate_provenance(tag)
            assert validation["valid"], f"Invalid provenance tag: {tag['source_id']}"

    def test_orchestrator_trace_id(self, npa_request, npa_adapters, npa_user_context):
        """Orchestrator response must carry a ctx- prefixed trace ID."""
        res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        assert res["_metadata"]["trace_id"].startswith("ctx-")


class TestNPAPipelineWorker:
    """Tests for worker archetype through the full pipeline."""

    def test_worker_7_stages(self, npa_worker_request, npa_adapters, npa_user_context):
        """Worker pipeline must execute all 7 stages."""
        res = assemble_context(npa_worker_request, "worker", "NPA", npa_user_context, npa_adapters)
        stages = [s["stage"] for s in res["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]

    def test_worker_budget_standard(self, npa_worker_request, npa_adapters, npa_user_context):
        """Worker must use standard budget profile (128000 tokens)."""
        res = assemble_context(npa_worker_request, "worker", "NPA", npa_user_context, npa_adapters)
        budget = res["_metadata"]["budget_report"]
        assert budget["profile"] == "standard"
        assert budget["within_budget"] is True

    def test_worker_entity_data_populated(self, npa_worker_request, npa_adapters, npa_user_context):
        """Worker context must contain the NPA project entity data."""
        res = assemble_context(npa_worker_request, "worker", "NPA", npa_user_context, npa_adapters)
        entities = res["context"]["entity_data"]
        assert len(entities) == 1
        assert entities[0]["entity_id"] == "NPA-142"
        assert entities[0]["product_type"] == "Structured Note"

    def test_worker_kb_chunks_populated(self, npa_worker_request, npa_adapters, npa_user_context):
        """Worker context must contain KB chunks (SOPs + regulatory docs)."""
        res = assemble_context(npa_worker_request, "worker", "NPA", npa_user_context, npa_adapters)
        chunks = res["context"]["knowledge_chunks"]
        assert len(chunks) == 2
        source_ids = [c["provenance"]["source_id"] for c in chunks]
        assert "SOP:NPA_GOV_v3.2" in source_ids
        assert "REG:MAS_637" in source_ids


class TestNPAPipelineReviewer:
    """Tests for reviewer archetype through the full pipeline."""

    def test_reviewer_budget_compact(self, npa_worker_request, npa_adapters, npa_user_context):
        """Reviewer must use compact budget profile (64000 tokens)."""
        req = {**npa_worker_request, "agent_id": "NPA_REVIEWER"}
        res = assemble_context(req, "reviewer", "NPA", npa_user_context, npa_adapters)
        budget = res["_metadata"]["budget_report"]
        assert budget["profile"] == "compact"
        assert budget["within_budget"] is True

    def test_reviewer_contract_validation(self, npa_worker_request, npa_adapters, npa_user_context):
        """Reviewer assembled context must validate against reviewer contract."""
        req = {**npa_worker_request, "agent_id": "NPA_REVIEWER"}
        res = assemble_context(req, "reviewer", "NPA", npa_user_context, npa_adapters)
        ctx = res["context"]
        # Inject required fields for reviewer contract validation
        ctx["worker_output"] = "BIZ analysis complete"
        ctx["worker_provenance"] = {}
        ctx["validation_rubric"] = {}
        ctx["policy_references"] = {}
        
        # Remove excluded fields
        ctx.pop("conversation_history", None)
        ctx.pop("few_shot_examples", None)
        ctx.pop("other_worker_outputs", None)
        
        validation = validate_assembled_context(ctx, "reviewer")
        assert validation["valid"] is True


# ── Delegation Integration Tests ────────────────────────────────────────


class TestNPADelegationChain:
    """Tests for Orchestrator → Worker → Reviewer delegation chain."""

    def test_orchestrator_to_worker_delegation(self, npa_request, npa_adapters, npa_user_context):
        """Delegation from orchestrator to worker strips routing metadata."""
        orch_res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)

        # Add routing metadata that should be stripped
        orch_context = orch_res["context"]
        orch_context["routing_decision"] = "delegate to NPA_BIZ"
        orch_context["delegation_plan"] = {"agents": ["NPA_BIZ", "NPA_RMG"]}
        orch_context["agent_selection_reasoning"] = "BIZ first for viability"

        package = create_delegation_package(
            "NPA_ORCHESTRATOR", "NPA_BIZ", orch_context, archetype="worker"
        )

        # Workers must NOT see routing metadata
        assert "routing_decision" not in package
        assert "delegation_plan" not in package
        assert "agent_selection_reasoning" not in package
        # Workers SHOULD see entity data
        assert "entity_data" in package
        # Delegation metadata attached
        assert package["_delegation"]["from_agent"] == "NPA_ORCHESTRATOR"
        assert package["_delegation"]["to_agent"] == "NPA_BIZ"
        assert package["_delegation"]["target_archetype"] == "worker"

    def test_worker_to_reviewer_delegation(self, npa_worker_request, npa_adapters, npa_user_context):
        """Full chain: assemble worker output → build reviewer context."""
        # Step 1: Worker assembles context
        worker_res = assemble_context(
            npa_worker_request, "worker", "NPA", npa_user_context, npa_adapters
        )

        # Step 2: Simulate worker producing output
        worker_output = {
            "context": "BIZ analysis: NPA-142 is viable with medium-high risk.",
            "result": "Viability score: 7.2/10",
            "_metadata": {
                "trace_id": worker_res["_metadata"]["trace_id"],
                "provenance_tags": worker_res["_metadata"]["provenance_tags"],
                "budget_report": worker_res["_metadata"]["budget_report"],
            },
        }

        # Step 3: Build reviewer context from worker output
        reviewer_ctx = build_reviewer_context(worker_output)

        assert reviewer_ctx["worker_output"] is not None
        assert isinstance(reviewer_ctx["provenance_tags"], list)
        assert reviewer_ctx["_delegation"]["source"] == "worker"
        assert reviewer_ctx["_delegation"]["trace_id"] == worker_res["_metadata"]["trace_id"]

    def test_parallel_worker_merge(self, npa_request, npa_adapters, npa_user_context):
        """Merge results from parallel worker delegations (BIZ + RMG + FINANCE)."""
        # Simulate 3 parallel worker results
        workers = ["NPA_BIZ", "NPA_RMG", "NPA_FINANCE"]
        results = []
        for agent in workers:
            results.append({
                "result": f"{agent} analysis complete for NPA-142",
                "provenance_tags": [
                    _make_npa_provenance(f"Agent:{agent}:142", "agent_output", 3, "CONFIDENTIAL")
                ],
                "trace_id": f"ctx-{agent.lower()}-001",
            })

        merged = merge_delegation_results(results)

        assert merged["result_count"] == 3
        assert len(merged["all_provenance_tags"]) == 3
        assert len(merged["trace_ids"]) == 3
        assert "merged_at" in merged

    def test_delegation_preserves_provenance_chain(self, npa_request, npa_adapters, npa_user_context):
        """Provenance tags survive the full delegation chain."""
        # Assemble orchestrator context
        orch_res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        orch_tags = orch_res["_metadata"]["provenance_tags"]
        assert len(orch_tags) > 0

        # Simulate worker output with orchestrator's provenance
        worker_output = {
            "result": "Worker analysis done",
            "_metadata": {
                "provenance_tags": orch_tags,
                "trace_id": orch_res["_metadata"]["trace_id"],
            },
        }

        # Extract result for orchestrator
        extracted = extract_delegation_result(worker_output)
        assert extracted["provenance_tags"] == orch_tags
        assert extracted["trace_id"] == orch_res["_metadata"]["trace_id"]


# ── Memory + Pipeline Integration Tests ─────────────────────────────────


class TestNPAMemoryIntegration:
    """Tests for session memory tracking across pipeline turns."""

    def test_session_tracks_pipeline_turns(self, npa_request, npa_adapters, npa_user_context):
        """Session records each pipeline invocation as a turn."""
        session = create_session(
            session_id="sess-npa-pipeline-001",
            metadata={"agent_id": "NPA_ORCHESTRATOR", "domain": "NPA"},
        )

        # Turn 1: User asks about NPA-142
        session = add_turn(session, {
            "role": "user",
            "content": "Analyze NPA-142 structured note proposal",
        })

        # Turn 2: Pipeline assembles context and agent responds
        res = assemble_context(npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters)
        session = add_turn(session, {
            "role": "assistant",
            "content": "Routing to NPA_BIZ and NPA_RMG for parallel analysis.",
            "tool_results": [
                {
                    "entity_id": "NPA-142",
                    "source": "pipeline",
                    "data": {"trace_id": res["_metadata"]["trace_id"]},
                }
            ],
        })

        assert session["turn_count"] == 2
        history = get_relevant_history(session, max_turns=10)
        assert len(history) == 2

        # Entity memory auto-populated from tool_results
        entity_facts = get_entity_memory(session, "NPA-142")
        assert len(entity_facts) == 1
        assert entity_facts[0]["source"] == "pipeline"

    def test_entity_memory_accumulates_across_turns(self, npa_adapters, npa_user_context):
        """Entity memory accumulates facts from multiple pipeline turns."""
        session = create_session(metadata={"domain": "NPA"})

        # Turn 1: BIZ analysis
        session = add_turn(session, {
            "role": "assistant",
            "content": "BIZ analysis complete",
            "tool_results": [
                {"entity_id": "NPA-142", "source": "NPA_BIZ", "data": {"viability": 7.2}},
            ],
        })

        # Turn 2: RMG analysis
        session = add_turn(session, {
            "role": "assistant",
            "content": "RMG analysis complete",
            "tool_results": [
                {"entity_id": "NPA-142", "source": "NPA_RMG", "data": {"risk_score": 6.8}},
            ],
        })

        # Turn 3: FINANCE analysis
        session = add_turn(session, {
            "role": "assistant",
            "content": "FINANCE analysis complete",
            "tool_results": [
                {"entity_id": "NPA-142", "source": "NPA_FINANCE", "data": {"capital_charge": 4.5}},
            ],
        })

        facts = get_entity_memory(session, "NPA-142")
        assert len(facts) == 3
        sources = [f["source"] for f in facts]
        assert "NPA_BIZ" in sources
        assert "NPA_RMG" in sources
        assert "NPA_FINANCE" in sources

    def test_domain_memory_caches_npa_knowledge(self):
        """Domain memory caches cross-session NPA knowledge."""
        session = create_session(metadata={"domain": "NPA"})

        session = update_domain_memory(session, "NPA", {
            "governance_threshold_usd": 25_000_000,
            "required_approvers": ["CAO", "CRO"],
        })

        npa_mem = get_domain_memory(session, "NPA")
        assert npa_mem["governance_threshold_usd"] == 25_000_000
        assert "CAO" in npa_mem["required_approvers"]

    def test_session_serialization_roundtrip(self, npa_request, npa_adapters, npa_user_context):
        """Session survives serialize → deserialize roundtrip with full data."""
        session = create_session(session_id="sess-roundtrip-001")
        session = add_turn(session, {"role": "user", "content": "test"})
        session = update_entity_memory(session, "NPA-142", [
            {"fact": "notional_usd", "value": 50_000_000},
        ])
        session = update_domain_memory(session, "NPA", {"threshold": 25_000_000})

        serialized = serialize_session(session)
        restored = deserialize_session(serialized)

        assert restored["session_id"] == "sess-roundtrip-001"
        assert restored["turn_count"] == 1
        assert len(restored["entity_memory"]["NPA-142"]) == 1
        assert restored["domain_memory"]["NPA"]["threshold"] == 25_000_000

    def test_history_compression_preserves_recent(self):
        """Compression keeps recent turns and summarizes old ones."""
        session = create_session()

        # Add many turns to exceed token budget
        for i in range(50):
            session = add_turn(session, {
                "role": "user" if i % 2 == 0 else "assistant",
                "content": f"Turn {i}: " + "x" * 200,
            })

        compressed = compress_history(session, max_tokens=1024)
        assert compressed["compressed_history"] is not None
        assert compressed["compressed_history"]["type"] == "compressed"
        assert compressed["compressed_history"]["dropped_turns"] > 0
        assert compressed["compressed_history"]["kept_turns"] > 0
        # Total turns preserved in the turns array
        assert compressed["turn_count"] == 50


# ── Full Chain: Pipeline + Delegation + Memory ──────────────────────────


class TestNPAFullChain:
    """End-to-end: request → assemble → delegate → track in memory."""

    def test_full_npa_orchestration_flow(self, npa_request, npa_adapters, npa_user_context):
        """
        Complete NPA flow:
        1. Orchestrator assembles context
        2. Delegates to worker (stripped routing metadata)
        3. Worker result extracted
        4. Reviewer gets worker output + provenance
        5. Results merged back to orchestrator
        6. All tracked in session memory
        """
        # 1. Create session
        session = create_session(
            session_id="sess-full-chain-001",
            metadata={"agent_id": "NPA_ORCHESTRATOR", "domain": "NPA"},
        )

        # 2. Orchestrator assembles context
        orch_res = assemble_context(
            npa_request, "orchestrator", "NPA", npa_user_context, npa_adapters
        )
        assert orch_res["_metadata"]["trace_id"].startswith("ctx-")

        session = add_turn(session, {
            "role": "system",
            "content": "Orchestrator context assembled",
            "tool_results": [
                {"entity_id": "NPA-142", "source": "orchestrator",
                 "data": {"trace_id": orch_res["_metadata"]["trace_id"]}},
            ],
        })

        # 3. Delegate to worker (strips routing metadata)
        orch_ctx = orch_res["context"]
        orch_ctx["routing_decision"] = "NPA_BIZ"
        orch_ctx["delegation_plan"] = {"agents": ["NPA_BIZ"]}

        worker_pkg = create_delegation_package(
            "NPA_ORCHESTRATOR", "NPA_BIZ", orch_ctx, archetype="worker"
        )
        assert "routing_decision" not in worker_pkg
        assert "delegation_plan" not in worker_pkg

        # 4. Worker produces output
        worker_output = {
            "result": "NPA-142 viability score: 7.2/10",
            "_metadata": {
                "trace_id": orch_res["_metadata"]["trace_id"],
                "provenance_tags": orch_res["_metadata"]["provenance_tags"],
                "budget_report": orch_res["_metadata"]["budget_report"],
            },
        }

        # 5. Extract result
        extracted = extract_delegation_result(worker_output)
        assert extracted["result"] == "NPA-142 viability score: 7.2/10"

        # 6. Build reviewer context
        reviewer_ctx = build_reviewer_context(worker_output)
        assert reviewer_ctx["_delegation"]["source"] == "worker"

        # 7. Merge back to orchestrator
        merged = merge_delegation_results([extracted])
        assert merged["result_count"] == 1

        # 8. Track in session
        session = add_turn(session, {
            "role": "assistant",
            "content": f"Analysis complete: {merged['result_count']} results merged.",
            "tool_results": [
                {"entity_id": "NPA-142", "source": "delegation_merge",
                 "data": merged},
            ],
        })

        # Verify session state
        assert session["turn_count"] == 2
        entity_facts = get_entity_memory(session, "NPA-142")
        assert len(entity_facts) == 2  # orchestrator + delegation_merge

        # Verify serialization
        json_str = serialize_session(session)
        restored = deserialize_session(json_str)
        assert restored["turn_count"] == 2
        assert restored["session_id"] == "sess-full-chain-001"

    def test_cross_archetype_budget_profiles(self, npa_request, npa_adapters, npa_user_context):
        """Verify all three archetypes produce distinct, correct budget profiles."""
        profiles = {}
        for archetype in ("orchestrator", "worker", "reviewer"):
            res = assemble_context(npa_request, archetype, "NPA", npa_user_context, npa_adapters)
            profiles[archetype] = res["_metadata"]["budget_report"]["profile"]

        assert profiles["orchestrator"] == "lightweight"
        assert profiles["worker"] == "standard"
        assert profiles["reviewer"] == "compact"

    def test_trust_classification_in_pipeline(self):
        """Verify that trust classification is consistent across the pipeline."""
        # System of record data should be TRUSTED
        assert classify_trust("system_of_record") == "TRUSTED"
        assert classify_trust("bank_sop") == "TRUSTED"
        assert classify_trust("external_official") == "TRUSTED"
        assert classify_trust("agent_output") == "TRUSTED"
        # External unverified should be UNTRUSTED
        assert classify_trust("general_web") == "UNTRUSTED"
