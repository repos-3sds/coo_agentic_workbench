#!/usr/bin/env python3
"""
Context Engine Runner — Subprocess entry point for Node.js bridge.

Reads a JSON command from stdin, executes the corresponding context engine
function, and writes JSON result to stdout.

Commands:
    assemble — Run the full 7-stage pipeline
    health   — Return engine version and available modules

Usage (from Node.js):
    echo '{"command":"health"}' | python3 runner.py
"""

from __future__ import annotations

import json
import sys
import traceback


def handle_assemble(payload: dict) -> dict:
    """Run the assembler pipeline and return the context package."""
    from context_engine import assemble_context

    request = payload.get("request", {})
    archetype = payload.get("archetype", "worker")
    domain = payload.get("domain", "NPA")
    user_context = payload.get("user_context", {})

    result = assemble_context(
        request=request,
        archetype=archetype,
        domain=domain,
        user_context=user_context,
        adapters=None,  # Server-side adapters not yet wired
    )

    return result


def handle_health(_payload: dict) -> dict:
    """Return engine health info."""
    import context_engine

    modules = [
        "trust", "contracts", "provenance", "token_counter",
        "scoper", "budget", "assembler", "memory", "delegation",
        "tracer", "circuit_breaker", "mcp_provenance",
    ]

    available = []
    for mod_name in modules:
        try:
            __import__(f"context_engine.{mod_name}")
            available.append(mod_name)
        except ImportError:
            pass

    return {
        "version": context_engine.__version__,
        "modules": available,
        "module_count": len(available),
    }


COMMANDS = {
    "assemble": handle_assemble,
    "health": handle_health,
}


def main() -> None:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError as e:
        json.dump({"error": f"Invalid JSON input: {e}"}, sys.stdout)
        sys.exit(1)

    command = payload.pop("command", None)
    if not command or command not in COMMANDS:
        json.dump(
            {"error": f"Unknown command: {command}. Valid: {list(COMMANDS.keys())}"},
            sys.stdout,
        )
        sys.exit(1)

    try:
        result = COMMANDS[command](payload)
        json.dump(result, sys.stdout, default=str)
    except Exception as e:
        json.dump(
            {"error": str(e), "traceback": traceback.format_exc()},
            sys.stdout,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
