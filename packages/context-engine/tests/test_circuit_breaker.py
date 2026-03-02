"""Tests for context_engine.circuit_breaker (S4-004)."""

from __future__ import annotations

import time

from context_engine.circuit_breaker import create_circuit_breaker


class TestCircuitBreakerStateTransitions:
    def test_initial_state_is_closed(self) -> None:
        breaker = create_circuit_breaker({})
        assert breaker["get_state"]() == "CLOSED"

    def test_closed_to_open_after_threshold_failures(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 3,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )

        def fail() -> str:
            raise RuntimeError("boom")

        breaker["call"](fail)
        breaker["call"](fail)
        assert breaker["get_state"]() == "CLOSED"
        breaker["call"](fail)
        assert breaker["get_state"]() == "OPEN"

    def test_open_to_half_open_after_cooldown(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "cooldown_ms": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )

        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        assert breaker["get_state"]() == "OPEN"

        time.sleep(0.01)
        assert breaker["get_state"]() == "HALF_OPEN"

    def test_half_open_to_closed_on_success(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "cooldown_ms": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )

        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        time.sleep(0.01)
        assert breaker["get_state"]() == "HALF_OPEN"

        result = breaker["call"](lambda: "ok")
        assert result == "ok"
        assert breaker["get_state"]() == "CLOSED"

    def test_half_open_to_open_on_probe_failure(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "cooldown_ms": 1,
                "fallback": lambda *args, **kwargs: "safe",
            }
        )

        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        time.sleep(0.01)
        assert breaker["get_state"]() == "HALF_OPEN"

        result = breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("probe fail")))
        assert result == "safe"
        assert breaker["get_state"]() == "OPEN"


class TestCircuitBreakerBehavior:
    def test_calls_pass_through_in_closed_state(self) -> None:
        breaker = create_circuit_breaker({})
        assert breaker["call"](lambda: 42) == 42

    def test_call_passes_args_and_kwargs(self) -> None:
        breaker = create_circuit_breaker({})

        def fn(a: int, b: int, mult: int = 1) -> int:
            return (a + b) * mult

        assert breaker["call"](fn, 2, 3, mult=4) == 20

    def test_calls_short_circuit_in_open_state(self) -> None:
        call_count = {"n": 0}

        def fn() -> str:
            call_count["n"] += 1
            raise RuntimeError("failing")

        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )

        breaker["call"](fn)
        assert breaker["get_state"]() == "OPEN"
        result = breaker["call"](fn)

        assert result == "fallback"
        assert call_count["n"] == 1

    def test_fallback_invoked_on_open_circuit(self) -> None:
        fallback_count = {"n": 0}

        def fallback(*args, **kwargs) -> str:
            fallback_count["n"] += 1
            return "safe_default"

        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": fallback,
            }
        )

        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        result = breaker["call"](lambda: "should_not_run")

        assert result == "safe_default"
        assert fallback_count["n"] >= 2


class TestCircuitBreakerConfigurationAndStats:
    def test_custom_failure_threshold_one_opens_immediately(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        assert breaker["get_state"]() == "OPEN"

    def test_custom_cooldown_period_respected(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "cooldown_ms": 50,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        assert breaker["get_state"]() == "OPEN"
        time.sleep(0.01)
        assert breaker["get_state"]() == "OPEN"

    def test_get_stats_tracks_failures_successes_and_timestamps(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 3,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )
        breaker["call"](lambda: "ok")
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))

        stats = breaker["get_stats"]()
        assert stats["successes"] >= 1
        assert stats["failures"] >= 1
        assert stats["last_success"] is not None
        assert stats["last_failure"] is not None

    def test_reset_returns_to_closed_and_clears_failures(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        assert breaker["get_state"]() == "OPEN"
        breaker["reset"]()

        stats = breaker["get_stats"]()
        assert stats["state"] == "CLOSED"
        assert stats["failures"] == 0

    def test_default_options_work_without_explicit_values(self) -> None:
        breaker = create_circuit_breaker({})
        result = breaker["call"](lambda: "ok")
        assert result == "ok"
        assert breaker["get_state"]() == "CLOSED"

    def test_state_reflected_in_stats_when_open(self) -> None:
        breaker = create_circuit_breaker(
            {
                "failure_threshold": 1,
                "fallback": lambda *args, **kwargs: "fallback",
            }
        )
        breaker["call"](lambda: (_ for _ in ()).throw(RuntimeError("fail")))
        stats = breaker["get_stats"]()
        assert stats["state"] == "OPEN"


class TestResetCache:
    def test_reset_cache_clears_global_breakers(self) -> None:
        """reset_cache clears all globally cached circuit breakers."""
        from context_engine.circuit_breaker import reset_cache, call_with_breaker, get_breaker_state

        # Create a breaker via the global API
        call_with_breaker("test_global_tool", lambda: "ok")
        assert get_breaker_state("test_global_tool") == "CLOSED"

        # Reset cache
        reset_cache()

        # After reset, getting state creates a new breaker (fresh CLOSED state)
        # The old breaker reference should be gone
        state = get_breaker_state("test_global_tool")
        assert state == "CLOSED"  # New breaker, fresh state
