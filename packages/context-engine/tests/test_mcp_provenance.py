"""Tests for context_engine.mcp_provenance (S4-007)."""

from __future__ import annotations

from datetime import datetime

from context_engine.mcp_provenance import (
    batch_wrap_results,
    create_tool_provenance,
    wrap_tool_result,
)


class TestCreateToolProvenance:
    def test_create_tool_provenance_defaults(self) -> None:
        prov = create_tool_provenance("npa_api")
        assert prov["source_id"] == "npa_api"
        assert prov["source_type"] == "general_web"
        assert prov["authority_tier"] == 5
        assert prov["trust_class"] == "UNTRUSTED"
        assert prov["ttl_seconds"] == 3600
        assert prov["data_classification"] == "INTERNAL"

    def test_create_tool_provenance_has_valid_timestamp(self) -> None:
        prov = create_tool_provenance("npa_api")
        parsed = datetime.fromisoformat(prov["fetched_at"])
        assert parsed is not None


class TestWrapToolResult:
    def test_wrap_tool_result_embeds_provenance_tag(self) -> None:
        wrapped = wrap_tool_result("tool_a", {"key": "val"})
        assert "_provenance" in wrapped
        assert wrapped["data"]["key"] == "val"

    def test_wrap_tool_result_metadata_overrides_defaults(self) -> None:
        wrapped = wrap_tool_result(
            "tool_a",
            {"ok": True},
            {"data_classification": "CONFIDENTIAL", "ttl_seconds": 120},
        )
        assert wrapped["_provenance"]["data_classification"] == "CONFIDENTIAL"
        assert wrapped["_provenance"]["ttl_seconds"] == 120

    def test_wrap_tool_result_exception_marks_untrusted(self) -> None:
        wrapped = wrap_tool_result("tool_a", Exception("upstream failed"))
        assert wrapped["_provenance"]["trust_class"] == "UNTRUSTED"
        assert wrapped["_provenance"]["authority_tier"] == 5
        assert "error" in wrapped["data"]

    def test_wrap_tool_result_handles_none_metadata(self) -> None:
        wrapped = wrap_tool_result("tool_a", {"v": 1}, None)
        assert wrapped["_provenance"]["source_id"] == "tool_a"

    def test_wrap_tool_result_source_id_matches_tool_name(self) -> None:
        wrapped = wrap_tool_result("get_project_details", {"project_id": "P-1"})
        assert wrapped["_provenance"]["source_id"] == "get_project_details"

    def test_wrap_tool_result_falls_back_when_metadata_invalid(self) -> None:
        wrapped = wrap_tool_result("tool_a", {"k": "v"}, {"authority_tier": 999})
        assert wrapped["_provenance"]["trust_class"] == "UNTRUSTED"
        assert wrapped["_provenance"]["authority_tier"] == 5
        assert "error" in wrapped["data"]


class TestBatchWrapResults:
    def test_batch_wrap_results_processes_multiple_items(self) -> None:
        results = [
            {"tool_name": "t1", "result": {"a": 1}},
            {"tool_name": "t2", "result": {"b": 2}},
        ]
        wrapped = batch_wrap_results(results)
        assert len(wrapped) == 2
        assert all("_provenance" in item for item in wrapped)

    def test_batch_wrap_results_empty_list_returns_empty(self) -> None:
        assert batch_wrap_results([]) == []

    def test_batch_wrap_mixed_success_and_failure(self) -> None:
        """Mixed batch: valid results + Exception results wrapped correctly."""
        results = [
            {"tool_name": "good_tool", "result": {"data": "ok"}},
            {"tool_name": "bad_tool", "result": Exception("connection timeout")},
            {"tool_name": "another_good", "result": {"data": "fine"}},
        ]
        wrapped = batch_wrap_results(results)
        assert len(wrapped) == 3
        # First and third should be UNTRUSTED (deny-by-default)
        assert wrapped[0]["_provenance"]["source_id"] == "good_tool"
        # Second should be UNTRUSTED due to Exception
        assert wrapped[1]["_provenance"]["trust_class"] == "UNTRUSTED"
        assert wrapped[1]["_provenance"]["authority_tier"] == 5
        # Third is valid
        assert wrapped[2]["_provenance"]["source_id"] == "another_good"
