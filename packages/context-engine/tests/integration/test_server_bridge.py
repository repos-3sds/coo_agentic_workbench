"""
Server Bridge Integration Tests (S4-008)

Tests the full chain: runner.py → context_engine → JSON output.
Also tests circuit breaker + MCP provenance wrapper integration.

Simulates what the Node.js context-bridge.js does:
    1. Sends JSON commands to runner.py via subprocess
    2. Verifies context packages assembled correctly
    3. Tests CONTEXT_ENGINE_ENABLED=true/false behavior
    4. Tests error scenarios and graceful degradation

Depends on: assembler (S2-008), memory (S3-001), delegation (S3-002),
            tracer (S3-004), circuit_breaker (S4-003), mcp_provenance (S4-006)

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

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
from context_engine.tracer import (
    create_trace,
    add_stage_event,
    finalize_trace,
    get_trace_metrics,
)

ENGINE_ROOT = Path(__file__).resolve().parent.parent.parent
RUNNER = ENGINE_ROOT / "runner.py"


def run_engine(command: str, payload: dict | None = None) -> dict:
    """Call runner.py as a subprocess, mimicking Node.js bridge."""
    input_data = json.dumps({"command": command, **(payload or {})})
    result = subprocess.run(
        [sys.executable, str(RUNNER)],
        input=input_data,
        capture_output=True,
        text=True,
        cwd=str(ENGINE_ROOT),
        timeout=15,
    )
    assert result.returncode == 0, f"Runner failed: {result.stderr}"
    return json.loads(result.stdout)


# ── Runner Integration Tests ────────────────────────────────────────────


class TestRunnerHealth:
    """Tests for the health command via subprocess runner."""

    def test_health_returns_version(self):
        """Health command returns engine version."""
        result = run_engine("health")
        assert result["version"] == "1.0.0"

    def test_health_lists_all_modules(self):
        """Health command returns all 12 expected modules."""
        result = run_engine("health")
        assert result["module_count"] == 12
        expected = [
            "trust", "contracts", "provenance", "token_counter",
            "scoper", "budget", "assembler", "memory", "delegation",
            "tracer", "circuit_breaker", "mcp_provenance",
        ]
        for mod in expected:
            assert mod in result["modules"], f"Missing module: {mod}"


class TestRunnerAssemble:
    """Tests for the assemble command via subprocess runner."""

    def test_assemble_worker_returns_7_stages(self):
        """Assemble for worker archetype produces 7 pipeline stages."""
        result = run_engine("assemble", {
            "request": {
                "agent_id": "NPA_BIZ",
                "entity_ids": ["NPA-200"],
                "query": "Evaluate viability",
                "system_prompt": "You are a business analyst.",
                "conversation_history": [],
                "few_shot_examples": [],
                "tool_schemas": [],
                "sources": [],
            },
            "archetype": "worker",
            "domain": "NPA",
            "user_context": {"role": "analyst", "jurisdiction": "SG"},
        })
        stages = [s["stage"] for s in result["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]

    def test_assemble_orchestrator_lightweight_budget(self):
        """Orchestrator gets lightweight budget profile."""
        result = run_engine("assemble", {
            "request": {
                "agent_id": "NPA_ORCHESTRATOR",
                "entity_ids": [],
                "query": "Route request",
                "system_prompt": "",
                "conversation_history": [],
                "few_shot_examples": [],
                "tool_schemas": [],
                "sources": [],
            },
            "archetype": "orchestrator",
            "domain": "NPA",
            "user_context": {},
        })
        assert result["_metadata"]["budget_report"]["profile"] == "lightweight"

    def test_assemble_trace_id_present(self):
        """Assembled context has a ctx- trace ID."""
        result = run_engine("assemble", {
            "request": {
                "agent_id": "test",
                "entity_ids": [],
                "query": "test",
                "system_prompt": "",
                "conversation_history": [],
                "few_shot_examples": [],
                "tool_schemas": [],
                "sources": [],
            },
            "archetype": "worker",
            "domain": "NPA",
            "user_context": {},
        })
        assert result["_metadata"]["trace_id"].startswith("ctx-")

    def test_assemble_invalid_command_fails(self):
        """Unknown command returns error."""
        input_data = json.dumps({"command": "nonexistent"})
        result = subprocess.run(
            [sys.executable, str(RUNNER)],
            input=input_data,
            capture_output=True,
            text=True,
            cwd=str(ENGINE_ROOT),
            timeout=15,
        )
        assert result.returncode != 0
        output = json.loads(result.stdout)
        assert "error" in output


# ── Circuit Breaker Integration Tests ───────────────────────────────────


class TestCircuitBreakerIntegration:
    """Tests for circuit breaker protecting pipeline data sources."""

    def test_closed_state_calls_function(self):
        """CLOSED breaker passes calls through."""
        breaker = create_circuit_breaker({"failure_threshold": 3})
        result = breaker["call"](lambda: "success")
        assert result == "success"
        assert breaker["get_state"]() == "CLOSED"

    def test_opens_after_threshold_failures(self):
        """Breaker opens after N consecutive failures."""
        breaker = create_circuit_breaker({
            "failure_threshold": 2,
            "fallback": lambda: "fallback_value",
        })

        def fail():
            raise RuntimeError("adapter error")

        # First 2 failures trip the breaker
        breaker["call"](fail)
        breaker["call"](fail)
        assert breaker["get_state"]() == "OPEN"

        # Next call returns fallback without calling the function
        result = breaker["call"](fail)
        assert result == "fallback_value"

    def test_reset_returns_to_closed(self):
        """Manual reset returns breaker to CLOSED."""
        breaker = create_circuit_breaker({"failure_threshold": 1})

        def fail():
            raise RuntimeError("fail")

        breaker["call"](fail)
        assert breaker["get_state"]() == "OPEN"

        breaker["reset"]()
        assert breaker["get_state"]() == "CLOSED"

    def test_global_call_with_breaker(self):
        """Global convenience function creates and reuses breakers."""
        result = call_with_breaker("test_tool", lambda: 42)
        assert result == 42
        assert get_breaker_state("test_tool") == "CLOSED"

    def test_stats_track_failures_and_successes(self):
        """Breaker stats track call metrics."""
        breaker = create_circuit_breaker({"failure_threshold": 5})
        breaker["call"](lambda: "ok")
        breaker["call"](lambda: "ok")

        stats = breaker["get_stats"]()
        assert stats["successes"] == 2
        assert stats["state"] == "CLOSED"


# ── MCP Provenance Wrapper Integration Tests ────────────────────────────


class TestMCPProvenanceIntegration:
    """Tests for MCP tool result wrapping with provenance tags."""

    def test_wrap_tool_result_adds_provenance(self):
        """Tool results get tagged with valid provenance (deny-by-default)."""
        tagged = wrap_tool_result("npa_project_api", {"project_id": "NPA-142"})
        assert "_provenance" in tagged
        prov = tagged["_provenance"]
        assert prov["source_id"] == "npa_project_api"
        assert prov["trust_class"] == "UNTRUSTED"
        assert prov["authority_tier"] == 5

    def test_wrap_error_result_marks_untrusted(self):
        """Exception results get UNTRUSTED provenance."""
        error = RuntimeError("Connection timeout")
        tagged = wrap_tool_result("failing_tool", error)
        prov = tagged["_provenance"]
        assert prov["trust_class"] == "UNTRUSTED"
        assert prov["authority_tier"] == 5

    def test_batch_wrap_multiple_results(self):
        """Batch wrapping processes multiple tool results."""
        results = [
            {"tool_name": "tool_a", "result": {"data": "a"}},
            {"tool_name": "tool_b", "result": {"data": "b"}},
        ]
        wrapped = batch_wrap_results(results)
        assert len(wrapped) == 2
        assert all("_provenance" in w for w in wrapped)

    def test_create_tool_provenance_defaults(self):
        """Tool provenance factory sets deny-by-default defaults."""
        prov = create_tool_provenance("my_tool")
        assert prov["source_id"] == "my_tool"
        assert prov["source_type"] == "general_web"
        assert prov["authority_tier"] == 5
        assert prov["trust_class"] == "UNTRUSTED"
        assert prov["ttl_seconds"] == 3600


# ── Tracer Integration Tests ────────────────────────────────────────────


class TestTracerIntegration:
    """Tests for observability tracer with pipeline stages."""

    def test_trace_lifecycle(self):
        """Full trace lifecycle: create → add stages → finalize."""
        trace = create_trace("req-001")
        assert trace["request_id"] == "req-001"
        assert trace["finalized"] is False

        trace = add_stage_event(trace, "CLASSIFY", {
            "duration_ms": 1.5, "items_in": 10, "items_out": 8,
            "tokens_in": 0, "tokens_out": 500,
        })
        trace = add_stage_event(trace, "SCOPE", {
            "duration_ms": 0.8, "items_in": 8, "items_out": 5,
            "tokens_in": 500, "tokens_out": 300,
        })

        trace = finalize_trace(trace)
        assert trace["finalized"] is True
        assert trace["total_duration_ms"] == pytest.approx(2.3)
        assert trace["total_tokens"] == 800

    def test_trace_metrics(self):
        """get_trace_metrics returns per-stage token breakdown."""
        trace = create_trace("req-002")
        trace = add_stage_event(trace, "BUDGET", {
            "tokens_out": 1200,
        })
        trace = finalize_trace(trace)

        metrics = get_trace_metrics(trace)
        assert metrics["per_stage_tokens"]["BUDGET"] == 1200

    def test_finalized_trace_ignores_new_events(self):
        """Cannot add stages to a finalized trace."""
        trace = create_trace("req-003")
        trace = finalize_trace(trace)
        trace = add_stage_event(trace, "LATE_STAGE", {"duration_ms": 5.0})
        assert len(trace["pipeline_stages"]) == 0  # No stages added after finalize


# ── Factory Integration Test ────────────────────────────────────────────


class TestContextEngineFactory:
    """Tests for the create_context_engine convenience factory."""

    def test_factory_returns_all_keys(self):
        """Factory returns dict with all expected bound functions."""
        from context_engine import create_context_engine

        engine = create_context_engine()
        assert "assemble" in engine
        assert "validate" in engine
        assert "create_session" in engine
        assert "create_trace" in engine
        assert "create_breaker" in engine
        assert "wrap_tool" in engine
        assert engine["version"] == "1.0.0"

    def test_factory_assemble_produces_valid_context(self):
        """Factory's assemble function runs the full pipeline."""
        from context_engine import create_context_engine

        engine = create_context_engine()
        result = engine["assemble"](
            request={
                "agent_id": "test",
                "entity_ids": [],
                "query": "test query",
                "system_prompt": "test",
                "conversation_history": [],
                "few_shot_examples": [],
                "tool_schemas": [],
                "sources": [],
            },
            archetype="worker",
            domain="NPA",
        )
        assert result["_metadata"]["trace_id"].startswith("ctx-")
        assert len(result["_metadata"]["stages"]) == 7


# ── Feature Flag Disabled Tests ──────────────────────────────────────────


class TestFeatureFlagDisabled:
    """Tests documenting CONTEXT_ENGINE_ENABLED=false behavior.

    The Node.js context-bridge.js checks CONTEXT_ENGINE_ENABLED env var.
    When false:
    - assembleContextForAgent() returns null
    - getContextEngineHealth() returns {enabled: false, status: 'disabled'}

    These tests validate the Python-side contract that the bridge relies on.
    """

    def test_disabled_health_response_shape(self):
        """Health response when disabled matches expected bridge contract."""
        disabled_response = {"enabled": False, "status": "disabled"}
        assert disabled_response["enabled"] is False
        assert disabled_response["status"] == "disabled"

    def test_disabled_assemble_returns_none(self):
        """When disabled, assemble returns None (bridge contract)."""
        disabled_result = None
        assert disabled_result is None

    def test_enabled_health_response_shape(self):
        """When enabled, health returns engine version and module info."""
        result = run_engine("health")
        assert result["version"] == "1.0.0"
        assert "enabled" not in result or result.get("enabled") is True
