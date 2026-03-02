"""
Circuit Breaker for Tool / Data Source Failures (Sprint 4)

Provides circuit breaker pattern for MCP tool calls and external data sources.
Prevents cascading failures in the context assembly pipeline.

Blueprint Section 12 — Failure Modes.

Status: IMPLEMENTED
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Callable

# Global cache to satisfy existing stub wrappers if necessary
_global_breakers: dict[str, dict] = {}


def create_circuit_breaker(options: dict) -> dict:
    """
    Creates a stateful circuit breaker instance.
    """
    failure_threshold = options.get("failure_threshold", 3)
    cooldown_ms = options.get("cooldown_ms", 10000)
    fallback = options.get("fallback", lambda *args, **kwargs: None)

    # Internal state mutated by closures
    state_machine = {
        "state": "CLOSED",
        "failures": 0,
        "successes": 0,
        "last_failure": 0.0,    # Monotonic float
        "last_failure_wall": 0.0, # Time float for metrics
        "last_success": 0.0,    # Monotonic float 
        "last_success_wall": 0.0  # Time float for metrics
    }

    def _get_current_state() -> str:
        current_st = state_machine["state"]
        if current_st == "OPEN":
            # Check cooldown to see if we should enter HALF_OPEN
            now_ms = time.monotonic() * 1000
            last_fail_ms = state_machine["last_failure"] * 1000
            if (now_ms - last_fail_ms) >= cooldown_ms:
                state_machine["state"] = "HALF_OPEN"
                return "HALF_OPEN"
        return current_st

    def get_state() -> str:
        return _get_current_state()

    def get_stats() -> dict:
        return {
            "failures": state_machine["failures"],
            "successes": state_machine["successes"],
            "state": _get_current_state(),
            "last_failure": datetime.fromtimestamp(state_machine["last_failure_wall"], timezone.utc).isoformat() if state_machine["last_failure_wall"] > 0 else None,
            "last_success": datetime.fromtimestamp(state_machine["last_success_wall"], timezone.utc).isoformat() if state_machine["last_success_wall"] > 0 else None,
        }

    def reset() -> None:
        state_machine["state"] = "CLOSED"
        state_machine["failures"] = 0
        state_machine["successes"] = 0

    def call(fn: Callable, *args: Any, **kwargs: Any) -> Any:
        st = _get_current_state()
        
        if st == "OPEN":
            # Short-circuit to fallback immediately
            return fallback(*args, **kwargs)
        
        # State is CLOSED or HALF_OPEN. Attempt call.
        try:
            res = fn(*args, **kwargs)
            # Success path
            state_machine["successes"] += 1
            state_machine["last_success"] = time.monotonic()
            state_machine["last_success_wall"] = time.time()
            if st == "HALF_OPEN":
                # Probe succeeded, reset to CLOSED
                state_machine["state"] = "CLOSED"
                state_machine["failures"] = 0
            else:
                # CLOSED state success: reset consecutive failures
                state_machine["failures"] = 0
            return res
        except Exception:
            # Failure path
            state_machine["failures"] += 1
            state_machine["last_failure"] = time.monotonic()
            state_machine["last_failure_wall"] = time.time()
            if st == "HALF_OPEN":
                # Probe failed, back to OPEN
                state_machine["state"] = "OPEN"
            else:
                # CLOSED state failure: check threshold
                if state_machine["failures"] >= failure_threshold:
                    state_machine["state"] = "OPEN"
                    
            return fallback(*args, **kwargs)

    return {
        "call": call,
        "get_state": get_state,
        "get_stats": get_stats,
        "reset": reset
    }


def reset_cache() -> None:
    """Reset global breakers."""
    _global_breakers.clear()


# Maintain backward stubs just in case
def call_with_breaker(tool_name: str, fn: Any, *args: Any, **kwargs: Any) -> Any:
    """Execute a function with circuit breaker protection. (Stub wrapper)"""
    if tool_name not in _global_breakers:
        _global_breakers[tool_name] = create_circuit_breaker({})
    return _global_breakers[tool_name]["call"](fn, *args, **kwargs)


def get_breaker_state(tool_name: str) -> str:
    """Get circuit breaker state: CLOSED, OPEN, HALF_OPEN."""
    if tool_name not in _global_breakers:
        _global_breakers[tool_name] = create_circuit_breaker({})
    return _global_breakers[tool_name]["get_state"]()
