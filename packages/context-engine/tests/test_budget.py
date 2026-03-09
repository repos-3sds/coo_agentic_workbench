"""Tests for context_engine.budget (S2-005)."""

from __future__ import annotations

import json

import pytest

import context_engine.budget as budget_module
import context_engine.token_counter as token_counter_module
from context_engine.budget import (
    allocate_budget,
    check_budget,
    get_budget_limits,
    trim_to_budget,
)
from context_engine.token_counter import count_tokens


def _make_contract(profile: str) -> dict:
    return {
        "contract_id": "test_contract",
        "budget_profile": profile,
    }


class _DummyEncoder:
    """Simple deterministic encoder used to avoid networked tiktoken downloads in tests."""

    def encode(self, text: str) -> list[int]:
        if not text:
            return []
        # Tokenize by whitespace for deterministic test behavior.
        return list(range(len(text.split())))

    def decode(self, tokens: list[int]) -> str:
        return "x " * len(tokens)


class TestGetBudgetLimits:
    def test_lightweight_profile_has_reduced_max_tokens(self) -> None:
        limits = get_budget_limits("lightweight")
        assert limits["max_tokens"] == 51200
        assert limits["total_budget_pct"] == 0.40

    def test_standard_profile_has_default_max_tokens(self) -> None:
        limits = get_budget_limits("standard")
        assert limits["max_tokens"] == 128000
        assert limits["total_budget_pct"] == 1.0

    def test_compact_profile_has_minimal_max_tokens(self) -> None:
        limits = get_budget_limits("compact")
        assert limits["max_tokens"] == 64000
        assert limits["total_budget_pct"] == 0.50

    def test_unknown_profile_raises_value_error(self) -> None:
        with pytest.raises(ValueError, match="Unknown budget profile"):
            get_budget_limits("unknown_profile")

    def test_lightweight_overrides_entity_data_cap(self) -> None:
        limits = get_budget_limits("lightweight")
        assert limits["allocations"]["entity_data"]["max"] == 10000

    def test_compact_overrides_conversation_history_cap(self) -> None:
        limits = get_budget_limits("compact")
        assert limits["allocations"]["conversation_history"]["max"] == 3000


class TestAllocateBudget:
    @pytest.fixture(autouse=True)
    def _stub_token_counting(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake_count_tokens(text: str, model: str = "cl100k_base") -> int:
            if not text:
                return 0
            return len(text.split())

        def fake_count_tokens_for_object(obj: object, model: str = "cl100k_base") -> int:
            if obj is None:
                return 0
            return len(json.dumps(obj).split())

        monkeypatch.setattr(budget_module, "count_tokens", fake_count_tokens)
        monkeypatch.setattr(budget_module, "count_tokens_for_object", fake_count_tokens_for_object)

    def test_normal_allocation_within_limits(self) -> None:
        context_package = {
            "system_prompt_context": "You are the NPA worker.",
            "entity_data": {"project_id": "PRJ-001", "status": "IN_REVIEW"},
            "knowledge_chunks": ["Policy A", "Policy B"],
            "conversation_history": "User asks for risk summary.",
        }
        contract = _make_contract("standard")

        result = allocate_budget(context_package, contract)

        assert result["profile"] == "standard"
        assert result["within_budget"] is True
        assert result["total"] >= 0
        assert result["remaining"] >= 0

    def test_overflow_sets_within_budget_false(self) -> None:
        huge_text = "risk_context " * 20000
        context_package = {
            "system_prompt_context": "You are the NPA worker.",
            "entity_data": "project data " * 4000,
            "knowledge_chunks": huge_text,
            "conversation_history": huge_text,
            "few_shot_examples": huge_text,
            "cross_agent_context": huge_text,
        }
        contract = _make_contract("compact")

        result = allocate_budget(context_package, contract)

        assert result["within_budget"] is False
        assert result["total"] > result["limit"]

    def test_never_compress_slots_are_present_in_allocation(self) -> None:
        context_package = {
            "system_prompt_context": "system " * 100,
            "entity_data": "entity " * 400,
            "conversation_history": "history " * 50,
        }
        contract = _make_contract("standard")

        result = allocate_budget(context_package, contract)

        assert "system_prompt_context" in result["allocations"]
        assert "entity_data" in result["allocations"]
        assert result["allocations"]["system_prompt_context"]["tokens"] > 0
        assert result["allocations"]["entity_data"]["tokens"] > 0

    def test_empty_context_package_returns_minimal_allocation(self) -> None:
        contract = _make_contract("standard")

        result = allocate_budget({}, contract)

        assert result["allocations"] == {}
        assert result["total"] == 0
        assert result["within_budget"] is True

    def test_none_slot_content_counts_as_zero_tokens(self) -> None:
        context_package = {
            "entity_data": None,
        }
        contract = _make_contract("lightweight")

        result = allocate_budget(context_package, contract)

        assert result["allocations"]["entity_data"]["tokens"] == 0


class TestCheckBudget:
    @pytest.fixture(autouse=True)
    def _stub_token_counting(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake_count_tokens(text: str, model: str = "cl100k_base") -> int:
            if not text:
                return 0
            return len(text.split())

        def fake_count_tokens_for_object(obj: object, model: str = "cl100k_base") -> int:
            if obj is None:
                return 0
            return len(json.dumps(obj).split())

        monkeypatch.setattr(budget_module, "count_tokens", fake_count_tokens)
        monkeypatch.setattr(budget_module, "count_tokens_for_object", fake_count_tokens_for_object)

    def test_within_budget_returns_true(self) -> None:
        context_package = {
            "system_prompt_context": "Short prompt",
            "entity_data": "Small payload",
        }
        contract = _make_contract("standard")

        result = check_budget(context_package, contract)

        assert result["within_budget"] is True
        assert result["total_tokens"] <= result["limit"]
        assert result["overflow_slots"] == []

    def test_over_budget_returns_false_with_overflow_slots(self) -> None:
        huge_text = "banking_context " * 25000
        context_package = {
            "system_prompt_context": "short",
            "entity_data": "short",
            "conversation_history": huge_text,
            "few_shot_examples": huge_text,
        }
        contract = _make_contract("lightweight")

        result = check_budget(context_package, contract)

        assert result["within_budget"] is False
        assert result["total_tokens"] > result["limit"]
        assert len(result["overflow_slots"]) >= 1


class TestTrimToBudget:
    @pytest.fixture(autouse=True)
    def _stub_token_counting(self, monkeypatch: pytest.MonkeyPatch) -> None:
        def fake_count_tokens(text: str, model: str = "cl100k_base") -> int:
            if not text:
                return 0
            return len(text.split())

        def fake_count_tokens_for_object(obj: object, model: str = "cl100k_base") -> int:
            if obj is None:
                return 0
            return len(json.dumps(obj).split())

        monkeypatch.setattr(budget_module, "count_tokens", fake_count_tokens)
        monkeypatch.setattr(budget_module, "count_tokens_for_object", fake_count_tokens_for_object)

    def test_trims_low_priority_before_protected_slots(self) -> None:
        huge_hist = "conversation " * 22000
        huge_examples = "example " * 20000
        huge_kb = "kbchunk " * 22000

        context_package = {
            "system_prompt_context": "immutable system prompt " * 500,
            "entity_data": "important entity data " * 3000,
            "knowledge_chunks": huge_kb,
            "few_shot_examples": huge_examples,
            "conversation_history": huge_hist,
            "cross_agent_context": "cross " * 18000,
        }
        contract = _make_contract("lightweight")

        result = trim_to_budget(context_package, contract)

        assert "conversation_history" in result["removed_slots"]
        assert "entity_data" not in result["removed_slots"]

    def test_stops_trimming_once_within_budget(self) -> None:
        # Sized so first two strategy trims are enough for lightweight profile.
        context_package = {
            "system_prompt_context": "sys " * 200,
            "entity_data": "entity " * 900,
            "conversation_history": "history " * 19000,
            "few_shot_examples": "shot " * 14000,
            "knowledge_chunks": "kb " * 1000,
            "cross_agent_context": "cross " * 1000,
        }
        contract = _make_contract("lightweight")

        result = trim_to_budget(context_package, contract)
        budget_after = check_budget(result["trimmed_context"], contract)

        assert budget_after["within_budget"] is True
        assert result["final_tokens"] <= budget_after["limit"]

    def test_never_compress_slots_not_trimmed(self) -> None:
        context_package = {
            "system_prompt_context": "system_prompt_text " * 800,
            "entity_data": "entity_data_text " * 2200,
            "conversation_history": "history_text " * 26000,
            "few_shot_examples": "examples_text " * 18000,
            "knowledge_chunks": "kb_text " * 18000,
            "cross_agent_context": "cross_text " * 18000,
        }
        contract = _make_contract("compact")

        result = trim_to_budget(context_package, contract)

        assert "system_prompt_context" not in result["removed_slots"]
        assert "entity_data" not in result["removed_slots"]
        assert result["trimmed_context"]["system_prompt_context"] == context_package["system_prompt_context"]
        assert result["trimmed_context"]["entity_data"] == context_package["entity_data"]

    def test_returns_original_when_already_within_budget(self) -> None:
        context_package = {
            "system_prompt_context": "short",
            "entity_data": "short",
            "conversation_history": "short",
        }
        contract = _make_contract("standard")

        result = trim_to_budget(context_package, contract)

        assert result["removed_slots"] == []
        assert result["trimmed_context"] == context_package

    def test_trimmed_slots_become_empty_or_none(self) -> None:
        context_package = {
            "system_prompt_context": "short",
            "entity_data": "short",
            "conversation_history": "history " * 30000,
        }
        contract = _make_contract("lightweight")

        result = trim_to_budget(context_package, contract)

        if "conversation_history" in result["removed_slots"]:
            assert result["trimmed_context"]["conversation_history"] == ""


class TestTokenCounterIntegration:
    @pytest.fixture(autouse=True)
    def _stub_encoder(self, monkeypatch: pytest.MonkeyPatch) -> None:
        token_counter_module.reset_cache()
        monkeypatch.setattr(token_counter_module, "_get_encoder", lambda model: _DummyEncoder())

    def test_empty_string_returns_zero_tokens(self) -> None:
        assert count_tokens("") == 0

    def test_known_text_returns_expected_count(self) -> None:
        assert count_tokens("hello world") == 2

    def test_unicode_text_is_counted(self) -> None:
        token_count = count_tokens("银行风险评估")
        assert isinstance(token_count, int)
        assert token_count == 1
