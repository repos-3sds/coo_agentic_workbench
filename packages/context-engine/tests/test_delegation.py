import pytest
from datetime import datetime, timezone
from context_engine.delegation import (
    create_delegation_package,
    extract_delegation_result,
    build_reviewer_context,
    merge_delegation_results,
)

def test_create_delegation_package_worker_strips_routing():
    pkg = {
        "routing_decision": "worker1",
        "delegation_plan": ["a"],
        "agent_selection_reasoning": "b",
        "orchestration_trace": "c",
        "internal_scores": "d",
        "valid_key": "x",
        "_metadata": {"delegation_plan": "foo"},
    }
    res = create_delegation_package("A", "B", pkg, "worker")
    assert "routing_decision" not in res
    assert "delegation_plan" not in res
    assert "agent_selection_reasoning" not in res
    assert "orchestration_trace" not in res
    assert "internal_scores" not in res
    assert "valid_key" in res
    assert "delegation_plan" not in res.get("_metadata", {})


def test_create_delegation_package_adds_delegation_metadata():
    res = create_delegation_package("SourceA", "TargetB", {}, "reviewer")
    assert "_delegation" in res
    assert res["_delegation"]["from_agent"] == "SourceA"
    assert res["_delegation"]["to_agent"] == "TargetB"
    assert res["_delegation"]["target_archetype"] == "reviewer"


def test_create_delegation_package_type_error():
    with pytest.raises(TypeError):
        create_delegation_package("A", "B", "not a dict", "worker")


def test_extract_delegation_result_context_key():
    worker_out = {"context": "extracted", "other": "ignored"}
    res = extract_delegation_result(worker_out)
    assert res["context"] == "extracted"


def test_extract_delegation_result_no_keys():
    worker_out = {"my_custom": "value"}
    res = extract_delegation_result(worker_out)
    assert res["result"] == {"my_custom": "value"}


def test_build_reviewer_context():
    worker_out = {
        "result": "review this",
        "_metadata": {"provenance_tags": [{"source_id": "sys", "source_type": "system_of_record", "authority_tier": 1, "trust_class": "TRUSTED", "fetched_at": "2026-03-02T08:30:00+00:00", "ttl_seconds": 3600, "data_classification": "INTERNAL"}]}
    }
    res = build_reviewer_context(worker_out)
    assert res["worker_output"] == "review this"
    assert len(res["provenance_tags"]) == 1
    assert res["_delegation"]["source"] == "worker"


def test_merge_delegation_results():
    results = [
        {"result": "1", "provenance_tags": [{"a": 1}], "trace_id": "t1"},
        {"result": "2", "provenance_tags": [{"b": 2}], "trace_id": "t2"}
    ]
    res = merge_delegation_results(results)
    assert res["result_count"] == 2
    assert "1" in res["merged_results"]
    assert "2" in res["merged_results"]
    assert len(res["all_provenance_tags"]) == 2
    assert "t1" in res["trace_ids"]


# L-004: reviewer archetype delegation path
def test_create_delegation_package_reviewer_gets_system_prompt_and_worker_output():
    """Reviewer archetype via create_delegation_package should include system_prompt_context."""
    pkg = {
        "system_prompt_context": "You are the NPA reviewer.",
        "user_context": "Review this risk assessment.",
        "worker_output": {"analysis": "low risk"},
        "entity_data": [{"id": "e1"}],
        "routing_decision": "should_be_stripped",
        "_metadata": {"provenance_tags": [{"source_id": "s1"}], "trace_id": "t1"},
    }
    res = create_delegation_package("NPA_ORCH", "NPA_REVIEWER", pkg, "reviewer")
    # Reviewer should see system_prompt_context + user_context + worker_output
    assert "system_prompt_context" in res
    assert res["system_prompt_context"] == "You are the NPA reviewer."
    assert "user_context" in res
    assert "worker_output" in res
    # Reviewer should NOT see entity_data or routing_decision
    assert "entity_data" not in res
    assert "routing_decision" not in res
    # Delegation metadata present
    assert res["_delegation"]["target_archetype"] == "reviewer"


# M-009: build_reviewer_context includes system_prompt_context + user_context
def test_build_reviewer_context_includes_system_prompt_and_user_context():
    """build_reviewer_context should carry system_prompt_context and user_context."""
    worker_out = {
        "result": "risk is low",
        "system_prompt_context": "You are the NPA reviewer agent.",
        "user_context": "Please review the assessment.",
        "_metadata": {
            "provenance_tags": [
                {
                    "source_id": "sys",
                    "source_type": "system_of_record",
                    "authority_tier": 1,
                    "trust_class": "TRUSTED",
                    "fetched_at": "2026-03-02T08:30:00+00:00",
                    "ttl_seconds": 3600,
                    "data_classification": "INTERNAL",
                }
            ],
        },
    }
    res = build_reviewer_context(worker_out)
    assert res["worker_output"] == "risk is low"
    assert res["system_prompt_context"] == "You are the NPA reviewer agent."
    assert res["user_context"] == "Please review the assessment."
    assert len(res["provenance_tags"]) == 1
