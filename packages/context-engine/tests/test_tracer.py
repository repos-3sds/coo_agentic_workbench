"""Tests for context_engine.tracer (S3-005)."""

from __future__ import annotations

import json
from datetime import datetime

from context_engine.tracer import (
    add_stage_event,
    create_trace,
    finalize_trace,
    get_pipeline_trace,
    get_trace_metrics,
    reset_cache,
    serialize_trace,
    trace_stage,
)


class TestCreateTrace:
    def setup_method(self) -> None:
        reset_cache()

    def test_create_trace_has_unique_trace_id(self) -> None:
        trace_a = create_trace("req-001")
        trace_b = create_trace("req-001")
        assert trace_a["trace_id"] != trace_b["trace_id"]

    def test_create_trace_contains_created_at_iso_timestamp(self) -> None:
        trace = create_trace("req-001")
        parsed = datetime.fromisoformat(trace["created_at"])
        assert parsed is not None

    def test_create_trace_initial_state(self) -> None:
        trace = create_trace("req-001")
        assert trace["request_id"] == "req-001"
        assert trace["pipeline_stages"] == {}
        assert trace["finalized"] is False
        assert trace["total_duration_ms"] == 0.0
        assert trace["total_tokens"] == 0

    # H-001: enterprise audit fields
    def test_create_trace_has_enterprise_audit_fields(self) -> None:
        trace = create_trace(
            "req-001",
            agent_id="NPA_ORCHESTRATOR",
            domain="NPA",
            entity_id="PRJ-001",
            user_id="user-42",
        )
        assert trace["agent_id"] == "NPA_ORCHESTRATOR"
        assert trace["domain"] == "NPA"
        assert trace["entity_id"] == "PRJ-001"
        assert trace["user_id"] == "user-42"
        assert trace["sources_used"] == []
        assert trace["context_package_size_tokens"] == 0

    def test_create_trace_enterprise_fields_default_to_none(self) -> None:
        trace = create_trace("req-001")
        assert trace["agent_id"] is None
        assert trace["domain"] is None
        assert trace["entity_id"] is None
        assert trace["user_id"] is None


class TestAddStageEvent:
    def setup_method(self) -> None:
        reset_cache()

    def test_add_stage_event_stores_in_pipeline_stages_dict(self) -> None:
        trace = create_trace("req-001")
        updated = add_stage_event(
            trace,
            "CLASSIFY",
            {
                "duration_ms": 1.5,
                "items_in": 10,
                "items_out": 8,
                "tokens_in": 0,
                "tokens_out": 400,
                "decisions": ["dropped 2 items"],
            },
        )
        assert "CLASSIFY" in updated["pipeline_stages"]
        stage = updated["pipeline_stages"]["CLASSIFY"]
        assert stage["stage_name"] == "CLASSIFY"
        assert stage["duration_ms"] == 1.5
        assert stage["items_in"] == 10
        assert stage["items_out"] == 8
        assert stage["tokens_in"] == 0
        assert stage["tokens_out"] == 400
        assert stage["decisions"] == ["dropped 2 items"]

    def test_add_stage_event_maintains_stage_keys(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.0})
        add_stage_event(trace, "SCOPE", {"duration_ms": 2.0})
        add_stage_event(trace, "RETRIEVE", {"duration_ms": 3.0})
        assert list(trace["pipeline_stages"].keys()) == ["CLASSIFY", "SCOPE", "RETRIEVE"]

    def test_add_stage_event_defaults_missing_numeric_fields(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {})
        stage = trace["pipeline_stages"]["CLASSIFY"]
        assert stage["duration_ms"] == 0.0
        assert stage["items_in"] == 0
        assert stage["items_out"] == 0
        assert stage["tokens_in"] == 0
        assert stage["tokens_out"] == 0
        assert stage["decisions"] == []

    def test_add_stage_event_ignored_after_finalize(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.0})
        finalize_trace(trace)
        before = len(trace["pipeline_stages"])
        add_stage_event(trace, "SCOPE", {"duration_ms": 2.0})
        assert len(trace["pipeline_stages"]) == before

    # H-001: stage-specific fields
    def test_add_stage_event_includes_stage_specific_fields(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "RANK", {
            "duration_ms": 5.0,
            "conflicts_detected": 3,
            "overflow": True,
            "sources_tagged": 12,
        })
        stage = trace["pipeline_stages"]["RANK"]
        assert stage["conflicts_detected"] == 3
        assert stage["overflow"] is True
        assert stage["sources_tagged"] == 12

    def test_add_stage_event_tracks_sources_used(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "RETRIEVE", {
            "duration_ms": 10.0,
            "sources_used": ["npa_project_api", "bank_sops"],
        })
        assert "npa_project_api" in trace["sources_used"]
        assert "bank_sops" in trace["sources_used"]

    def test_add_stage_event_tracks_context_package_size(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "ASSEMBLE", {
            "duration_ms": 3.0,
            "context_package_size_tokens": 4500,
        })
        assert trace["context_package_size_tokens"] == 4500


class TestFinalizeTrace:
    def setup_method(self) -> None:
        reset_cache()

    def test_finalize_trace_calculates_totals(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.5, "tokens_out": 100})
        add_stage_event(trace, "SCOPE", {"duration_ms": 2.5, "tokens_out": 300})
        finalized = finalize_trace(trace)
        assert finalized["total_duration_ms"] == 4.0
        assert finalized["total_tokens"] == 400
        assert finalized["finalized"] is True
        assert "finalized_at" in finalized

    def test_finalize_trace_is_idempotent(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.0, "tokens_out": 10})
        finalize_trace(trace)
        first = dict(trace)
        finalize_trace(trace)
        assert trace["total_duration_ms"] == first["total_duration_ms"]
        assert trace["total_tokens"] == first["total_tokens"]
        assert trace["finalized_at"] == first["finalized_at"]


class TestGetTraceMetrics:
    def setup_method(self) -> None:
        reset_cache()

    def test_get_trace_metrics_returns_per_stage_tokens(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"tokens_out": 120})
        add_stage_event(trace, "SCOPE", {"tokens_out": 80})
        finalize_trace(trace)
        metrics = get_trace_metrics(trace)
        assert metrics["per_stage_tokens"]["CLASSIFY"] == 120
        assert metrics["per_stage_tokens"]["SCOPE"] == 80

    def test_get_trace_metrics_total_matches_trace_totals(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 2.0, "tokens_out": 50})
        finalize_trace(trace)
        metrics = get_trace_metrics(trace)
        assert metrics["total_duration_ms"] == trace["total_duration_ms"]
        assert metrics["total_tokens"] == trace["total_tokens"]

    def test_get_trace_metrics_includes_sources_and_package_size(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "RETRIEVE", {
            "tokens_out": 200,
            "sources_used": ["npa_api"],
            "context_package_size_tokens": 3000,
        })
        finalize_trace(trace)
        metrics = get_trace_metrics(trace)
        assert "npa_api" in metrics["sources_used"]
        assert metrics["context_package_size_tokens"] == 3000


class TestSerializeTrace:
    def setup_method(self) -> None:
        reset_cache()

    def test_serialize_trace_returns_valid_json(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.0, "tokens_out": 5})
        payload = serialize_trace(trace)
        loaded = json.loads(payload)
        assert loaded["request_id"] == "req-001"
        assert "CLASSIFY" in loaded["pipeline_stages"]
        assert loaded["pipeline_stages"]["CLASSIFY"]["stage_name"] == "CLASSIFY"


# M-002: trace_stage and get_pipeline_trace are real implementations
class TestTraceStage:
    def setup_method(self) -> None:
        reset_cache()

    def test_trace_stage_returns_event_dict(self) -> None:
        result = trace_stage("CLASSIFY", [1, 2, 3], [1, 2], 5.0)
        assert result["stage"] == "CLASSIFY"
        assert result["duration_ms"] == 5.0
        assert result["items_in"] == 3
        assert result["items_out"] == 2

    def test_trace_stage_appends_to_trace_when_provided(self) -> None:
        trace = create_trace("req-001")
        trace_stage("SCOPE", [1, 2], [1], 3.0, trace=trace)
        assert "SCOPE" in trace["pipeline_stages"]
        assert trace["pipeline_stages"]["SCOPE"]["duration_ms"] == 3.0

    def test_trace_stage_passes_kwargs(self) -> None:
        result = trace_stage("RANK", [], [], 1.0, conflicts_detected=5)
        assert result["conflicts_detected"] == 5


class TestGetPipelineTrace:
    def setup_method(self) -> None:
        reset_cache()

    def test_get_pipeline_trace_returns_events_for_known_trace(self) -> None:
        trace = create_trace("req-001")
        add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.0, "tokens_out": 10})
        add_stage_event(trace, "SCOPE", {"duration_ms": 2.0, "tokens_out": 20})
        events = get_pipeline_trace(trace["trace_id"])
        assert len(events) == 2
        names = [e["stage_name"] for e in events]
        assert "CLASSIFY" in names
        assert "SCOPE" in names

    def test_get_pipeline_trace_returns_empty_for_unknown_id(self) -> None:
        assert get_pipeline_trace("nonexistent-id") == []
