"""
Budget Allocator (Sprint 2 — S2-004)

Allocates token budget across context slots based on contract budget profiles.
Uses token_counter for measurement and budget-defaults.json for profiles.

Depends on: token_counter (S2-003), contracts (S1-013)

Blueprint Section 7 — Budget stage of the 7-stage pipeline.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from context_engine.token_counter import count_tokens, count_tokens_for_object

# ── Config Loading ─────────────────────────────────────────────────────────

CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"

_budget_config: dict | None = None


def _load_budget_config() -> dict:
    """Load and cache budget-defaults.json."""
    global _budget_config
    if _budget_config is not None:
        return _budget_config
    fp = CONFIG_DIR / "budget-defaults.json"
    if not fp.exists():
        raise FileNotFoundError(f"Budget config not found: {fp}")
    _budget_config = json.loads(fp.read_text(encoding="utf-8"))
    return _budget_config


def reset_cache() -> None:
    """Clear the cached budget config (for testing)."""
    global _budget_config
    _budget_config = None


# ── Priority ordering for overflow trimming ───────────────────────────────

_PRIORITY_ORDER = {
    "FIXED": 0,
    "HIGH": 1,
    "MEDIUM": 2,
    "LOW": 3,
    "ADAPTIVE": 4,
}

# Maps overflow strategy names to the slot they trim
_OVERFLOW_SLOT_MAP = {
    "compress_conversation_history": "conversation_history",
    "reduce_few_shot_examples": "few_shot_examples",
    "prune_lowest_kb_chunks": "knowledge_chunks",
    "trim_cross_agent_reasoning": "cross_agent_context",
}


# ── Public API ─────────────────────────────────────────────────────────────


def get_budget_limits(profile: str) -> dict:
    """
    Load budget limits for a named profile from budget-defaults.json.

    Args:
        profile: One of "lightweight", "standard", "compact".

    Returns:
        Dict with keys: max_tokens, total_budget_pct, allocations (merged with
        profile overrides), overflow_strategy, never_compress.

    Raises:
        ValueError: If profile name is not found in config.
    """
    cfg = _load_budget_config()
    profiles = cfg.get("profiles", {})
    if profile not in profiles:
        raise ValueError(
            f"Unknown budget profile '{profile}'. "
            f"Available: {list(profiles.keys())}"
        )

    prof = profiles[profile]
    base_allocs = cfg.get("allocations", {})

    # Merge base allocations with profile overrides
    merged = {}
    overrides = prof.get("allocation_overrides", {})
    for slot, base in base_allocs.items():
        slot_alloc = dict(base)  # copy
        if slot in overrides:
            slot_alloc.update(overrides[slot])
        merged[slot] = slot_alloc

    return {
        "max_tokens": prof.get("max_tokens", cfg.get("total_budget", 128000)),
        "total_budget_pct": prof.get("total_budget_pct", 1.0),
        "allocations": merged,
        "overflow_strategy": cfg.get("overflow_strategy", []),
        "never_compress": cfg.get("never_compress", []),
        "response_headroom": cfg.get("response_headroom", {"min": 10000, "max": 20000}),
    }


def allocate_budget(
    context_package: dict,
    contract: dict,
    model: str = "cl100k_base",
) -> dict:
    """
    Allocate token budget across context slots per contract budget profile.

    Measures actual token usage per slot and compares against the profile limits.

    Args:
        context_package: Dict of {slot_name: content} where content is str or serializable.
        contract: A loaded contract dict (must contain "budget_profile").
        model: The tiktoken encoding for counting.

    Returns:
        Dict with keys: allocations, total, limit, remaining, profile, within_budget.
    """
    profile_name = contract.get("budget_profile", "standard")
    limits = get_budget_limits(profile_name)
    max_tokens = limits["max_tokens"]
    headroom = limits["response_headroom"].get("min", 10000)
    available = max_tokens - headroom

    slot_allocs = limits["allocations"]
    allocations: dict[str, dict] = {}
    total = 0

    for slot, content in context_package.items():
        if content is None:
            tokens = 0
        elif isinstance(content, str):
            tokens = count_tokens(content, model)
        else:
            tokens = count_tokens_for_object(content, model)

        slot_limit = slot_allocs.get(slot, {})
        slot_max = slot_limit.get("max", available)
        priority = slot_limit.get("priority", "MEDIUM")

        allocations[slot] = {
            "tokens": tokens,
            "max": slot_max,
            "priority": priority,
            "over": max(0, tokens - slot_max),
        }
        total += tokens

    return {
        "allocations": allocations,
        "total": total,
        "limit": available,
        "remaining": available - total,
        "profile": profile_name,
        "within_budget": total <= available,
    }


def check_budget(
    context_package: dict,
    contract: dict,
    model: str = "cl100k_base",
) -> dict:
    """
    Check if a context package fits within budget constraints.

    Args:
        context_package: Dict of {slot_name: content}.
        contract: A loaded contract dict (must contain "budget_profile").
        model: The tiktoken encoding for counting.

    Returns:
        Dict: {within_budget: bool, total_tokens: int, limit: int, overflow_slots: list}
    """
    result = allocate_budget(context_package, contract, model)

    overflow_slots = [
        slot for slot, info in result["allocations"].items()
        if info["over"] > 0
    ]

    return {
        "within_budget": result["within_budget"],
        "total_tokens": result["total"],
        "limit": result["limit"],
        "overflow_slots": overflow_slots,
    }


def trim_to_budget(
    context_package: dict,
    contract: dict,
    model: str = "cl100k_base",
) -> dict:
    """
    Trim a context package to fit within budget by removing lowest-priority
    content first, following the overflow_strategy order.

    Never trims slots listed in never_compress.

    Args:
        context_package: Dict of {slot_name: content}.
        contract: A loaded contract dict.
        model: The tiktoken encoding for counting.

    Returns:
        Dict: {trimmed_context: dict, removed_slots: list, final_tokens: int}
    """
    profile_name = contract.get("budget_profile", "standard")
    limits = get_budget_limits(profile_name)
    never_compress = set(limits["never_compress"])
    overflow_strategy = limits["overflow_strategy"]

    # Start with a copy
    trimmed = dict(context_package)
    removed: list[str] = []

    # Check current budget
    budget_check = allocate_budget(trimmed, contract, model)

    if budget_check["within_budget"]:
        return {
            "trimmed_context": trimmed,
            "removed_slots": [],
            "final_tokens": budget_check["total"],
        }

    # Apply overflow strategies in order
    for strategy in overflow_strategy:
        target_slot = _OVERFLOW_SLOT_MAP.get(strategy)
        if not target_slot:
            continue
        if target_slot in never_compress:
            continue
        if target_slot not in trimmed:
            continue

        # Remove the slot content
        trimmed[target_slot] = "" if isinstance(trimmed[target_slot], str) else None
        removed.append(target_slot)

        # Re-check
        budget_check = allocate_budget(trimmed, contract, model)
        if budget_check["within_budget"]:
            break

    # If still over budget, trim remaining non-protected slots by priority
    if not budget_check["within_budget"]:
        slot_priorities = []
        for slot in trimmed:
            if slot in never_compress or slot in removed:
                continue
            alloc_info = budget_check["allocations"].get(slot, {})
            priority = alloc_info.get("priority", "MEDIUM")
            slot_priorities.append((slot, _PRIORITY_ORDER.get(priority, 2)))

        # Sort by priority descending (highest number = lowest priority = trim first)
        slot_priorities.sort(key=lambda x: x[1], reverse=True)

        for slot, _ in slot_priorities:
            trimmed[slot] = "" if isinstance(trimmed[slot], str) else None
            removed.append(slot)

            budget_check = allocate_budget(trimmed, contract, model)
            if budget_check["within_budget"]:
                break

    return {
        "trimmed_context": trimmed,
        "removed_slots": removed,
        "final_tokens": budget_check["total"],
    }


def get_overflow_report(
    context_package: dict,
    contract: dict,
    model: str = "cl100k_base",
) -> dict:
    """
    Generate a report on overflow status for a context package.

    Returns per-slot overflow details and recommended trim order.

    Args:
        context_package: Dict of {slot_name: content}.
        contract: A loaded contract dict (must contain "budget_profile").
        model: The tiktoken encoding for counting.

    Returns:
        Dict with keys: over_budget, overflow_slots, total_over,
        recommended_trim_order, budget_report.
    """
    budget_report = allocate_budget(context_package, contract, model)
    overflow_slots = []
    total_over = 0

    for slot, info in budget_report["allocations"].items():
        if info["over"] > 0:
            overflow_slots.append({
                "slot": slot,
                "tokens": info["tokens"],
                "max": info["max"],
                "over_by": info["over"],
                "priority": info["priority"],
            })
            total_over += info["over"]

    # Recommend trim order: lowest-priority first
    overflow_slots.sort(
        key=lambda s: _PRIORITY_ORDER.get(s["priority"], 2),
        reverse=True,
    )

    profile_name = contract.get("budget_profile", "standard")
    limits = get_budget_limits(profile_name)

    return {
        "over_budget": not budget_report["within_budget"],
        "overflow_slots": overflow_slots,
        "total_over": total_over,
        "recommended_trim_order": [s["slot"] for s in overflow_slots],
        "budget_report": budget_report,
        "overflow_strategy": limits["overflow_strategy"],
    }


# ── Aliases for story spec compliance (S2-004) ────────────────────────────
# Story spec used camelCase JS names; Python API uses snake_case equivalents.
get_budget_for_profile = get_budget_limits
handle_overflow = trim_to_budget
