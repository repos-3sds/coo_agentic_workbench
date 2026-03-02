"""Failure mode tests (S4-005) covering 8 context-engine degradation modes."""

from __future__ import annotations

import pytest

import context_engine.assembler as asm
import context_engine.memory as memory_module
from context_engine import (
    add_turn,
    assemble_context,
    can_user_access,
    classify_trust,
    compress_history,
    create_circuit_breaker,
    create_session,
    deserialize_session,
    is_never_allowed,
    resolve_conflict,
    scope_by_domain,
    score_grounding,
    validate_provenance,
)


@pytest.fixture
def base_request() -> dict:
    return {
        "agent_id": "Worker_Failure_Test",
        "entity_ids": ["PRJ-500"],
        "entity_type": "project",
        "query": "Assess this project",
        "system_prompt": "You are a risk worker.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [{"data": "input", "source_type": "user_input"}],
    }


@pytest.fixture
def user_context() -> dict:
    return {
        "user_id": "u-100",
        "role": "analyst",
        "department": "COO",
        "jurisdiction": "SG",
        "session_id": "sess-failure-1",
    }


@pytest.fixture
def deterministic_budget(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_allocate(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
        return {
            "allocations": {},
            "total": 1000,
            "limit": 100000,
            "remaining": 99000,
            "profile": contract.get("budget_profile", "standard"),
            "within_budget": True,
        }

    def fake_trim(draft_context: dict, contract: dict, model: str = "cl100k_base") -> dict:
        return {
            "trimmed_context": draft_context,
            "removed_slots": [],
            "final_tokens": 1000,
        }

    monkeypatch.setattr(asm, "allocate_budget", fake_allocate)
    monkeypatch.setattr(asm, "trim_to_budget", fake_trim)


class TestFailureMode1McpToolUnreachable:
    def test_detect_open_circuit_after_consecutive_failures(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 2,
                "fallback": lambda *args, **kwargs: {"cached": True},
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("mcp unavailable")))
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("mcp unavailable")))
        assert breaker["get_state"]() == "OPEN"

    def test_degrade_to_fallback_when_open(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: {"cached": "stale"},
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("mcp unavailable")))
        result = breaker["call"](lambda: {"live": "data"})
        assert result == {"cached": "stale"}

    def test_mitigate_with_failure_stats_recorded(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: None,
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("mcp unavailable")))
        stats = breaker["get_stats"]()
        assert stats["failures"] >= 1
        assert stats["last_failure"] is not None


class TestFailureMode2KbSearchEmpty:
    def test_detect_empty_kb_chunks(self, base_request: dict, user_context: dict, deterministic_budget: None) -> None:
        adapters = {
            "get_entity_data": lambda ids, domain: [{"entity_id": ids[0]}],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [],
        }
        result = assemble_context(base_request, "worker", "NPA", user_context, adapters)
        assert result["context"]["knowledge_chunks"] == []

    def test_degrade_pipeline_still_assembles_without_kb(self, base_request: dict, user_context: dict, deterministic_budget: None) -> None:
        adapters = {
            "get_entity_data": lambda ids, domain: [{"entity_id": ids[0]}],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [],
        }
        result = assemble_context(base_request, "worker", "NPA", user_context, adapters)
        assert "context" in result
        assert "_metadata" in result

    def test_mitigate_with_retrieve_stage_logging_empty_kb(self, base_request: dict, user_context: dict, deterministic_budget: None) -> None:
        adapters = {
            "get_entity_data": lambda ids, domain: [],
            "get_kb_chunks": lambda domain, query: [],
            "retrieve": lambda payload: [],
        }
        result = assemble_context(base_request, "worker", "NPA", user_context, adapters)
        retrieve_stage = next(s for s in result["_metadata"]["stages"] if s["stage"] == "RETRIEVE")
        assert retrieve_stage["details"]["kb_chunks_count"] == 0


class TestFailureMode3TokenBudgetExceeded:
    def test_detect_budget_exceeded(self, base_request: dict, user_context: dict, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(
            asm,
            "allocate_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "allocations": {},
                "total": 999999,
                "limit": 1000,
                "remaining": -998999,
                "profile": "standard",
                "within_budget": False,
            },
        )
        monkeypatch.setattr(
            asm,
            "trim_to_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "trimmed_context": draft_context,
                "removed_slots": ["conversation_history"],
                "final_tokens": 900,
            },
        )

        result = assemble_context(base_request, "worker", "NPA", user_context, adapters={})
        assert result["_metadata"]["budget_report"]["within_budget"] is False

    def test_degrade_by_trimming_context(self, base_request: dict, user_context: dict, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(
            asm,
            "allocate_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "allocations": {},
                "total": 999999,
                "limit": 1000,
                "remaining": -998999,
                "profile": "standard",
                "within_budget": False,
            },
        )
        monkeypatch.setattr(
            asm,
            "trim_to_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "trimmed_context": draft_context,
                "removed_slots": ["knowledge_chunks", "conversation_history"],
                "final_tokens": 950,
            },
        )

        result = assemble_context(base_request, "worker", "NPA", user_context, adapters={})
        report = result["_metadata"]["budget_report"]
        assert report["trimmed"] is True
        assert "knowledge_chunks" in report["removed_slots"]

    def test_mitigate_with_budget_stage_logging(self, base_request: dict, user_context: dict, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(
            asm,
            "allocate_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "allocations": {},
                "total": 999999,
                "limit": 1000,
                "remaining": -998999,
                "profile": "standard",
                "within_budget": False,
            },
        )
        monkeypatch.setattr(
            asm,
            "trim_to_budget",
            lambda draft_context, contract, model="cl100k_base": {
                "trimmed_context": draft_context,
                "removed_slots": ["conversation_history"],
                "final_tokens": 900,
            },
        )

        result = assemble_context(base_request, "worker", "NPA", user_context, adapters={})
        budget_stage = next(s for s in result["_metadata"]["stages"] if s["stage"] == "BUDGET")
        assert budget_stage["details"]["within_budget"] is False


class TestFailureMode4ProvenanceMissing:
    def test_detect_missing_required_provenance_fields(self) -> None:
        result = validate_provenance({"source_id": "partial"})
        assert result["valid"] is False

    def test_degrade_by_flagging_ungrounded(self) -> None:
        result = validate_provenance({})
        assert result["valid"] is False
        assert len(result["errors"]) > 0

    def test_mitigate_when_provenance_complete(self) -> None:
        tag = {
            "source_id": "SoR:project:1",
            "source_type": "system_of_record",
            "authority_tier": 1,
            "fetched_at": "2026-03-02T10:00:00+00:00",
            "ttl_seconds": 3600,
            "trust_class": "TRUSTED",
            "data_classification": "CONFIDENTIAL",
        }
        result = validate_provenance(tag)
        assert result["valid"] is True


class TestFailureMode5TrustClassificationAmbiguous:
    def test_detect_unknown_source_defaults_to_untrusted(self) -> None:
        assert classify_trust("unknown_xyz") == "UNTRUSTED"

    def test_degrade_unknown_source_is_not_never_list(self) -> None:
        assert is_never_allowed("unknown_xyz") is False

    def test_mitigate_never_allowed_is_blocked(self) -> None:
        assert is_never_allowed("social_media") is True
        with pytest.raises(ValueError):
            classify_trust("social_media")


class TestFailureMode6SessionStateCorrupted:
    def test_detect_corrupted_state_raises_value_error(self) -> None:
        with pytest.raises(ValueError):
            deserialize_session("{{invalid")

    def test_degrade_start_fresh_session(self) -> None:
        session = create_session("sess-fresh")
        assert session["session_id"] == "sess-fresh"
        assert session["turn_count"] == 0

    def test_mitigate_session_recovers_and_accepts_new_turn(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(memory_module, "count_tokens_for_object", lambda obj, model="cl100k_base": 1)

        session = create_session("sess-recover")
        add_turn(session, {"role": "user", "content": "hello"})
        compress_history(session, max_tokens=10)

        assert session["turn_count"] == 1
        assert session.get("compressed_history") is None


class TestFailureMode7CrossDomainConflict:
    def test_detect_only_target_domain_and_platform_kept(self) -> None:
        data = [
            {"id": "a", "domain": "NPA"},
            {"id": "b", "domain": "ORM"},
            {"id": "c", "domain": "platform"},
        ]
        result = scope_by_domain(data, "NPA")
        assert {r["id"] for r in result} == {"a", "c"}

    def test_degrade_wrong_domain_filtered_out(self) -> None:
        data = [
            {"id": "a", "domain": "NPA"},
            {"id": "b", "domain": "ORM"},
        ]
        result = scope_by_domain(data, "NPA")
        assert all(item["domain"] != "ORM" for item in result)

    def test_mitigate_unknown_domain_keeps_platform_only(self) -> None:
        data = [
            {"id": "a", "domain": "NPA"},
            {"id": "b", "domain": "platform"},
        ]
        result = scope_by_domain(data, "UNKNOWN")
        assert {r["id"] for r in result} == {"b"}


class TestFailureMode8SourceAuthorityConflict:
    def test_detect_higher_tier_wins(self) -> None:
        result = resolve_conflict(
            {"source_type": "system_of_record", "authority_tier": 1},
            {"source_type": "bank_sop", "authority_tier": 2},
        )
        assert result["winner"]["authority_tier"] == 1

    def test_degrade_unresolved_same_tier_flags_human_review(self) -> None:
        result = resolve_conflict(
            {"source_type": "bank_sop", "authority_tier": 2},
            {"source_type": "bank_sop", "authority_tier": 2},
        )
        assert result["resolution"] == "NEEDS_HUMAN_REVIEW"

    def test_mitigate_same_tier_sor_beats_non_sor(self) -> None:
        result = resolve_conflict(
            {"source_type": "system_of_record", "authority_tier": 2},
            {"source_type": "bank_sop", "authority_tier": 2},
        )
        assert result["winner"]["source_type"] == "system_of_record"
