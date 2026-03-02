"""Edge and failure-mode tests for context_engine.assembler (S2-010)."""

from __future__ import annotations

import pytest

import context_engine.assembler as asm
from context_engine.assembler import assemble_context, validate_assembled_context


def _valid_provenance(
    source_id: str,
    source_type: str,
    authority_tier: int,
    data_classification: str = "INTERNAL",
) -> dict:
    return {
        "source_id": source_id,
        "source_type": source_type,
        "authority_tier": authority_tier,
        "fetched_at": "2026-03-02T10:00:00Z",
        "ttl_seconds": 3600,
        "trust_class": "TRUSTED",
        "data_classification": data_classification,
    }


@pytest.fixture
def edge_request() -> dict:
    return {
        "agent_id": "Agent_Edge_01",
        "entity_ids": ["PRJ-900"],
        "entity_type": "project",
        "query": "Assess risk concentration for PRJ-900",
        "system_prompt": "You are a banking risk worker.",
        "conversation_history": [{"role": "user", "content": "run risk analysis"}],
        "few_shot_examples": [{"input": "x", "output": "y"}],
        "tool_schemas": [{"name": "get_project"}],
        "sources": [{"data": "user input", "source_type": "user_input"}],
    }


@pytest.fixture
def user_context() -> dict:
    return {
        "user_id": "u-7701",
        "role": "analyst",
        "department": "COO",
        "jurisdiction": "SG",
        "session_id": "sess-edge-001",
    }


@pytest.fixture
def deterministic_budget(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_allocate(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
        return {
            "allocations": {},
            "total": 1200,
            "limit": 100000,
            "remaining": 98800,
            "profile": contract.get("budget_profile", "standard"),
            "within_budget": True,
        }

    def fake_trim(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
        return {
            "trimmed_context": draft_context,
            "removed_slots": [],
            "final_tokens": 1200,
        }

    monkeypatch.setattr(asm, "allocate_budget", fake_allocate)
    monkeypatch.setattr(asm, "trim_to_budget", fake_trim)


class TestFailureScenarios:
    def test_adapter_raises_exception_graceful_degradation(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: (_ for _ in ()).throw(RuntimeError("boom")),
            "get_kb_chunks": lambda domain, query: (_ for _ in ()).throw(ValueError("bad kb")),
            "retrieve": lambda query: (_ for _ in ()).throw(Exception("retrieve fail")),
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)

        assert result["context"]["entity_data"] == []
        assert result["context"]["knowledge_chunks"] == []
        assert result["context"]["cross_agent_context"] == []

    def test_adapter_returns_empty_lists_handled(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: [],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [],
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)

        assert result["context"]["entity_data"] == []
        assert result["context"]["knowledge_chunks"] == []
        assert result["context"]["cross_agent_context"] == []

    def test_adapter_returns_none_degrades_gracefully(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: None,
            "get_kb_chunks": lambda domain, query: None,
            "retrieve": lambda payload: None,
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)
        assert result["context"]["entity_data"] == []
        assert result["context"]["knowledge_chunks"] == []
        assert result["context"]["cross_agent_context"] == []


class TestEdgeCases:
    def test_zero_entity_data_still_assembles_with_empty_entity_slot(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        req = dict(edge_request)
        req["entity_ids"] = []

        adapters = {
            "get_entity_data": lambda entity_ids, domain: [{"entity_id": "unexpected"}],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [],
        }

        result = assemble_context(req, "worker", "NPA", user_context, adapters)

        assert result["context"]["entity_data"] == []
        assert "entity_data" in result["context"]

    def test_massive_data_budget_overflow_handled(
        self,
        edge_request: dict,
        user_context: dict,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        def fake_allocate(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
            return {
                "allocations": {},
                "total": 900000,
                "limit": 50000,
                "remaining": -850000,
                "profile": contract.get("budget_profile", "standard"),
                "within_budget": False,
            }

        def fake_trim(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
            trimmed = dict(draft_context)
            trimmed["knowledge_chunks"] = []
            return {
                "trimmed_context": trimmed,
                "removed_slots": ["knowledge_chunks", "conversation_history"],
                "final_tokens": 42000,
            }

        monkeypatch.setattr(asm, "allocate_budget", fake_allocate)
        monkeypatch.setattr(asm, "trim_to_budget", fake_trim)

        adapters = {
            "get_entity_data": lambda entity_ids, domain: [{"entity_id": "PRJ-900"}],
            "get_kb_chunks": lambda domain, query: [{"chunk": "x" * 100000}],
            "retrieve": lambda payload: [{"note": "x" * 100000}],
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)
        report = result["_metadata"]["budget_report"]

        assert report["within_budget"] is False
        assert report["trimmed"] is True
        assert report["removed_slots"] == ["knowledge_chunks", "conversation_history"]
        assert report["final_tokens"] == 42000

    def test_no_kb_chunks_still_returns_valid_context_shape(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: [{"entity_id": "PRJ-900"}],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [{"result": "ok"}],
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)

        assert result["context"]["knowledge_chunks"] == []
        assert "_metadata" in result
        assert "stages" in result["_metadata"]

    def test_unknown_archetype_raises_value_error(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        with pytest.raises(ValueError, match="Unknown contract archetype"):
            assemble_context(edge_request, "unknown", "NPA", user_context, adapters={})

    def test_missing_required_context_reports_validation_failures(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})
        validation = validate_assembled_context(result["context"], "worker")

        assert validation["valid"] is False
        assert "assigned_task" in validation["missing_required"]
        assert "domain_knowledge" in validation["missing_required"]
        assert "tool_results" in validation["missing_required"]


class TestAdapterInterface:
    def test_adapter_called_with_correct_params(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        calls: dict = {}

        def get_entity_data(entity_ids: list[str], domain: str) -> list[dict]:
            calls["entity"] = {"entity_ids": entity_ids, "domain": domain}
            return []

        def get_kb_chunks(domain: str, query: str) -> list[dict]:
            calls["kb"] = {"domain": domain, "query": query}
            return []

        def retrieve(payload: dict) -> list[dict]:
            calls["retrieve"] = payload
            return []

        adapters = {
            "get_entity_data": get_entity_data,
            "get_kb_chunks": get_kb_chunks,
            "retrieve": retrieve,
        }

        assemble_context(edge_request, "worker", "NPA", user_context, adapters)

        assert calls["entity"] == {"entity_ids": ["PRJ-900"], "domain": "NPA"}
        assert calls["kb"] == {
            "domain": "NPA",
            "query": "Assess risk concentration for PRJ-900",
        }
        assert calls["retrieve"] == {
            "domain": "NPA",
            "query": "Assess risk concentration for PRJ-900",
            "entity_ids": ["PRJ-900"],
        }

    def test_adapter_results_with_valid_provenance_are_collected(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: [
                {
                    "entity_id": entity_ids[0],
                    "provenance": _valid_provenance(
                        source_id=f"SoR:{entity_ids[0]}",
                        source_type="system_of_record",
                        authority_tier=1,
                        data_classification="CONFIDENTIAL",
                    ),
                }
            ],
            "get_kb_chunks": lambda domain, query: [
                {
                    "snippet": "SOP guidance",
                    "provenance": _valid_provenance(
                        source_id="SOP:v5",
                        source_type="bank_sop",
                        authority_tier=2,
                        data_classification="PUBLIC",
                    ),
                }
            ],
            "retrieve": lambda payload: [
                {
                    "note": "cross-agent result",
                    "provenance": _valid_provenance(
                        source_id="Agent:result-77",
                        source_type="agent_output",
                        authority_tier=3,
                        data_classification="INTERNAL",
                    ),
                }
            ],
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)
        tags = result["_metadata"]["provenance_tags"]
        source_ids = {tag["source_id"] for tag in tags}

        assert {f"SoR:PRJ-900", "SOP:v5", "Agent:result-77"}.issubset(source_ids)

    def test_multiple_adapters_can_be_provided(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        adapters = {
            "get_entity_data": lambda entity_ids, domain: [{"entity_id": entity_ids[0]}],
            "get_kb_chunks": lambda domain, query: [{"snippet": "chunk"}],
            "retrieve": lambda payload: [{"summary": "retrieved"}],
        }

        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters)

        assert len(result["context"]["entity_data"]) == 1
        assert len(result["context"]["knowledge_chunks"]) == 1
        assert len(result["context"]["cross_agent_context"]) == 1


class TestPipelineIntegrity:
    def test_pipeline_has_all_7_stages(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})
        stage_names = [stage["stage"] for stage in result["_metadata"]["stages"]]

        assert stage_names == [
            "CLASSIFY",
            "SCOPE",
            "RETRIEVE",
            "RANK",
            "BUDGET",
            "ASSEMBLE",
            "TAG",
        ]

    def test_trace_id_is_present_and_prefixed(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})
        trace_id = result["_metadata"]["trace_id"]

        assert isinstance(trace_id, str)
        assert trace_id.startswith("ctx-")
        assert len(trace_id) > 8

    def test_trace_id_is_unique_per_run(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result_a = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})
        result_b = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})

        assert result_a["_metadata"]["trace_id"] != result_b["_metadata"]["trace_id"]

    def test_budget_report_is_present(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})
        report = result["_metadata"]["budget_report"]

        assert "total" in report
        assert "within_budget" in report
        assert "profile" in report

    def test_stage_events_include_duration_ms(
        self,
        edge_request: dict,
        user_context: dict,
        deterministic_budget: None,
    ) -> None:
        result = assemble_context(edge_request, "worker", "NPA", user_context, adapters={})

        for stage in result["_metadata"]["stages"]:
            assert "duration_ms" in stage
            assert isinstance(stage["duration_ms"], float)
