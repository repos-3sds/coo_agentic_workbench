"""Tests for context_engine.contracts — Contract Loader & Validator."""

import json
import pytest
from pathlib import Path
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


# ── load_contract ─────────────────────────────────────────────────────────


class TestLoadContract:
    def test_load_orchestrator(self, contracts_dir):
        c = load_contract("orchestrator", contracts_dir)
        assert c["contract_id"] == "orchestrator"
        assert c["archetype"] == "orchestrator"

    def test_load_worker(self, contracts_dir):
        c = load_contract("worker", contracts_dir)
        assert c["contract_id"] == "worker"
        assert c["archetype"] == "worker"

    def test_load_reviewer(self, contracts_dir):
        c = load_contract("reviewer", contracts_dir)
        assert c["contract_id"] == "reviewer"
        assert c["archetype"] == "reviewer"

    def test_unknown_archetype_raises(self, contracts_dir):
        with pytest.raises(ValueError, match="Unknown contract archetype"):
            load_contract("rogue_agent", contracts_dir)

    def test_missing_file_raises(self, tmp_path):
        with pytest.raises(FileNotFoundError):
            load_contract("orchestrator", tmp_path)

    def test_malformed_json_raises(self, tmp_path):
        bad = tmp_path / "orchestrator.json"
        bad.write_text("{broken json!!!", encoding="utf-8")
        with pytest.raises(json.JSONDecodeError):
            load_contract("orchestrator", tmp_path)

    def test_contract_missing_required_fields(self, tmp_path):
        """Contract with no contract_id or archetype must raise ValueError."""
        bad = tmp_path / "orchestrator.json"
        bad.write_text('{"description": "incomplete"}', encoding="utf-8")
        with pytest.raises(ValueError, match="missing required fields"):
            load_contract("orchestrator", tmp_path)

    def test_all_contracts_have_version(self, contracts_dir):
        for arch in ("orchestrator", "worker", "reviewer"):
            c = load_contract(arch, contracts_dir)
            assert "version" in c, f"{arch} contract missing version field"

    def test_all_contracts_have_budget_profile(self, contracts_dir):
        for arch in ("orchestrator", "worker", "reviewer"):
            c = load_contract(arch, contracts_dir)
            assert "budget_profile" in c, f"{arch} contract missing budget_profile"


# ── validate_context ──────────────────────────────────────────────────────


class TestValidateContext:
    # --- Orchestrator (rich format) ---

    def test_orchestrator_valid(self, orchestrator_contract):
        context = {
            "user_context": {"user_id": "U1", "role": "analyst"},
            "intent": {"task_type": "npa_classify"},
            "routing_context": {"domain": "NPA"},
            "entity_summary": {"entity_id": "P-123"},
        }
        result = validate_context(context, orchestrator_contract)
        assert result["valid"] is True
        assert result["missing_required"] == []

    def test_orchestrator_missing_one_slot(self, orchestrator_contract):
        context = {
            "user_context": {"user_id": "U1"},
            "intent": {"task_type": "npa_classify"},
            "routing_context": {"domain": "NPA"},
            # entity_summary missing
        }
        result = validate_context(context, orchestrator_contract)
        assert result["valid"] is False
        assert "entity_summary" in result["missing_required"]

    def test_orchestrator_none_slot_treated_as_missing(self, orchestrator_contract):
        context = {
            "user_context": {"user_id": "U1"},
            "intent": None,  # None counts as missing
            "routing_context": {"domain": "NPA"},
            "entity_summary": {"entity_id": "P-123"},
        }
        result = validate_context(context, orchestrator_contract)
        assert result["valid"] is False
        assert "intent" in result["missing_required"]

    def test_orchestrator_excluded_present_warns(self, orchestrator_contract):
        context = {
            "user_context": {"user_id": "U1"},
            "intent": {"task_type": "npa_classify"},
            "routing_context": {"domain": "NPA"},
            "entity_summary": {"entity_id": "P-123"},
            "raw_kb_chunks": ["some", "data"],  # excluded
        }
        result = validate_context(context, orchestrator_contract)
        assert result["valid"] is True  # excluded = warn, NOT invalidate
        assert "raw_kb_chunks" in result["unexpected_included"]
        assert len(result["warnings"]) > 0

    # --- Worker (simple format) ---

    def test_worker_valid(self, worker_contract):
        context = {
            "assigned_task": "classify NPA",
            "entity_data": {"id": "P-123"},
            "domain_knowledge": ["SOP-1"],
            "tool_results": {"risk": "high"},
            "user_context": {"role": "analyst"},
        }
        result = validate_context(context, worker_contract)
        assert result["valid"] is True
        assert result["missing_required"] == []

    def test_worker_missing_all(self, worker_contract):
        result = validate_context({}, worker_contract)
        assert result["valid"] is False
        assert len(result["missing_required"]) == 5

    def test_worker_excluded_present_warns(self, worker_contract):
        context = {
            "assigned_task": "t",
            "entity_data": "e",
            "domain_knowledge": "d",
            "tool_results": "tr",
            "user_context": "uc",
            "other_domain_data": "should not be here",
        }
        result = validate_context(context, worker_contract)
        assert result["valid"] is True
        assert "other_domain_data" in result["unexpected_included"]

    # --- Reviewer (simple format) ---

    def test_reviewer_valid(self, reviewer_contract):
        context = {
            "worker_output": {"result": "approved"},
            "worker_provenance": {"source_id": "S1"},
            "validation_rubric": {"checks": ["grounding"]},
            "policy_references": ["POL-1"],
        }
        result = validate_context(context, reviewer_contract)
        assert result["valid"] is True

    def test_reviewer_missing_one(self, reviewer_contract):
        context = {
            "worker_output": {"result": "approved"},
            # worker_provenance missing
            "validation_rubric": {"checks": ["grounding"]},
            "policy_references": ["POL-1"],
        }
        result = validate_context(context, reviewer_contract)
        assert result["valid"] is False
        assert "worker_provenance" in result["missing_required"]

    # --- Edge cases ---

    def test_none_contract_raises_typeerror(self):
        with pytest.raises(TypeError, match="valid contract dict"):
            validate_context({"slot": "value"}, None)

    def test_empty_dict_contract_raises_typeerror(self):
        with pytest.raises(TypeError, match="valid contract dict"):
            validate_context({"slot": "value"}, {})

    def test_none_context_reports_all_missing(self, worker_contract):
        result = validate_context(None, worker_contract)
        assert result["valid"] is False
        assert len(result["missing_required"]) == 5

    def test_empty_context_reports_all_missing(self, worker_contract):
        result = validate_context({}, worker_contract)
        assert result["valid"] is False
        assert len(result["missing_required"]) == 5


# ── get_required_sources (H-002) ──────────────────────────────────────────


class TestGetRequiredSources:
    def test_orchestrator_returns_spec_objects(self, orchestrator_contract):
        sources = get_required_sources(orchestrator_contract)
        assert len(sources) > 0
        for spec in sources:
            assert "source" in spec
            assert "slots" in spec
            assert "priority" in spec
            assert "fields" in spec
            assert isinstance(spec["slots"], list)

    def test_orchestrator_has_known_sources(self, orchestrator_contract):
        sources = get_required_sources(orchestrator_contract)
        source_names = [s["source"] for s in sources]
        assert "platform" in source_names
        assert "intent_classifier" in source_names
        assert "orchestration_registry" in source_names
        assert "system_of_record" in source_names

    def test_worker_simple_format_returns_empty(self, worker_contract):
        """Worker uses simple string format — no source specs available."""
        sources = get_required_sources(worker_contract)
        assert sources == []

    def test_reviewer_simple_format_returns_empty(self, reviewer_contract):
        sources = get_required_sources(reviewer_contract)
        assert sources == []

    def test_none_contract_returns_empty(self):
        assert get_required_sources(None) == []

    def test_empty_dict_returns_empty(self):
        assert get_required_sources({}) == []


# ── get_budget_profile ────────────────────────────────────────────────────


class TestGetBudgetProfile:
    def test_orchestrator_lightweight(self, orchestrator_contract):
        assert get_budget_profile(orchestrator_contract) == "lightweight"

    def test_worker_standard(self, worker_contract):
        assert get_budget_profile(worker_contract) == "standard"

    def test_reviewer_compact(self, reviewer_contract):
        assert get_budget_profile(reviewer_contract) == "compact"

    def test_from_archetype_string(self, contracts_dir):
        # Uses default contracts_dir, should work as long as real files exist
        assert get_budget_profile("orchestrator") == "lightweight"
        assert get_budget_profile("worker") == "standard"
        assert get_budget_profile("reviewer") == "compact"

    def test_none_input(self):
        assert get_budget_profile(None) is None


# ── get_optional_context ──────────────────────────────────────────────────


class TestGetOptionalContext:
    def test_orchestrator(self, orchestrator_contract):
        opts = get_optional_context(orchestrator_contract)
        assert isinstance(opts, list)
        assert "prior_worker_results" in opts
        assert "delegation_stack" in opts
        assert "conversation_history" in opts

    def test_worker(self, worker_contract):
        opts = get_optional_context(worker_contract)
        assert "prior_worker_results" in opts
        assert "conversation_history" in opts
        assert "few_shot_examples" in opts

    def test_reviewer(self, reviewer_contract):
        opts = get_optional_context(reviewer_contract)
        assert "entity_data" in opts
        assert "injection_patterns" in opts

    def test_none_returns_empty(self):
        assert get_optional_context(None) == []


# ── get_excluded_context ──────────────────────────────────────────────────


class TestGetExcludedContext:
    def test_orchestrator(self, orchestrator_contract):
        excl = get_excluded_context(orchestrator_contract)
        assert "raw_kb_chunks" in excl
        assert "detailed_form_data" in excl
        assert "full_audit_trail" in excl

    def test_worker(self, worker_contract):
        excl = get_excluded_context(worker_contract)
        assert "other_domain_data" in excl
        assert "routing_metadata" in excl

    def test_reviewer(self, reviewer_contract):
        excl = get_excluded_context(reviewer_contract)
        assert "conversation_history" in excl
        assert "other_worker_outputs" in excl

    def test_none_returns_empty(self):
        assert get_excluded_context(None) == []


# ── list_archetypes ───────────────────────────────────────────────────────


class TestListArchetypes:
    def test_returns_three(self):
        archs = list_archetypes()
        assert len(archs) == 3
        assert "orchestrator" in archs
        assert "worker" in archs
        assert "reviewer" in archs


# ── get_contract_version ──────────────────────────────────────────────────


class TestGetContractVersion:
    def test_orchestrator_version(self, orchestrator_contract):
        assert get_contract_version(orchestrator_contract) == "1.0.0"

    def test_worker_version(self, worker_contract):
        assert get_contract_version(worker_contract) == "1.0"

    def test_reviewer_version(self, reviewer_contract):
        assert get_contract_version(reviewer_contract) == "1.0"

    def test_none_returns_none(self):
        assert get_contract_version(None) is None

    def test_empty_dict_returns_none(self):
        assert get_contract_version({}) is None


# ── Slot count alignment (C-001 regression) ──────────────────────────────


class TestSlotCountAlignment:
    """Ensure test mocks match real contract slot counts (prevents C-001 regression)."""

    def test_orchestrator_has_4_required_slots(self, orchestrator_contract):
        assert len(orchestrator_contract["required_context"]) == 4

    def test_worker_has_5_required_slots(self, worker_contract):
        assert len(worker_contract["required_context"]) == 5

    def test_reviewer_has_4_required_slots(self, reviewer_contract):
        assert len(reviewer_contract["required_context"]) == 4

    def test_orchestrator_has_3_optional_slots(self, orchestrator_contract):
        assert len(orchestrator_contract["optional_context"]) == 3

    def test_orchestrator_has_3_excluded_slots(self, orchestrator_contract):
        assert len(orchestrator_contract["excluded_context"]) == 3
