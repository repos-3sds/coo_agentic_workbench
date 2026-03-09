"""
Session Memory Manager (Sprint 3 — S3-001)

Manages conversation state across turns with a 4-tier memory model:
    - Working:  current turn inputs + tool results
    - Session:  conversation history (compressed)
    - Entity:   accumulated facts about primary entity
    - Domain:   cross-session domain knowledge cache

Pure state management — no persistence layer. The consuming app handles storage.

Depends on: token_counter (S2-003) for compression

Blueprint Section 8 — Memory & State.

Status: IMPLEMENTED
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from context_engine.token_counter import count_tokens, count_tokens_for_object


# ── Session Factory ───────────────────────────────────────────────────────


def create_session(
    session_id: str | None = None,
    metadata: dict | None = None,
) -> dict:
    """
    Create a new session state object.

    Args:
        session_id: Unique session identifier. Generated if not provided.
        metadata: Optional metadata (agent_id, domain, entity_ids, user_context).

    Returns:
        Session dict with working, session, entity, and domain memory tiers.
    """
    sid = session_id or f"sess-{uuid.uuid4().hex[:12]}"
    meta = metadata or {}

    return {
        "session_id": sid,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "metadata": meta,
        "turns": [],
        "working_memory": {},
        "entity_memory": {},
        "domain_memory": {},
        "compressed_history": None,
        "turn_count": 0,
    }


# ── Turn Management ───────────────────────────────────────────────────────


def add_turn(session: dict, turn: dict) -> dict:
    """
    Append a turn to the session's conversation history.

    A turn is typically: {role, content, tool_results, timestamp}.
    Automatically updates working_memory with the latest turn data.

    Args:
        session: The session state dict.
        turn: Dict with at least "role" and "content".

    Returns:
        The updated session (mutated in place for efficiency).

    Raises:
        TypeError: If session or turn is not a dict.
    """
    if not isinstance(session, dict):
        raise TypeError("add_turn: session must be a dict")
    if not isinstance(turn, dict):
        raise TypeError("add_turn: turn must be a dict")

    # Stamp timestamp if missing
    if "timestamp" not in turn:
        turn["timestamp"] = datetime.now(timezone.utc).isoformat()

    session["turns"].append(turn)
    session["turn_count"] = len(session["turns"])
    session["updated_at"] = datetime.now(timezone.utc).isoformat()

    # Update working memory with latest turn
    session["working_memory"] = {
        "current_turn": turn,
        "turn_index": session["turn_count"] - 1,
    }

    # Extract entity facts from tool results if present
    tool_results = turn.get("tool_results", [])
    for result in tool_results:
        entity_id = result.get("entity_id")
        if entity_id:
            _update_entity_memory(session, entity_id, result)

    return session


def get_relevant_history(
    session: dict,
    max_turns: int = 10,
) -> list[dict]:
    """
    Get the most recent conversation turns, up to max_turns.

    Args:
        session: The session state dict.
        max_turns: Maximum number of recent turns to return.

    Returns:
        List of turn dicts (most recent max_turns).
    """
    if not isinstance(session, dict):
        return []

    turns = session.get("turns", [])
    if max_turns <= 0:
        return []

    recent = turns[-max_turns:] if len(turns) > max_turns else list(turns)
    return recent


# ── Working Memory ────────────────────────────────────────────────────────


def get_working_memory(session: dict) -> dict:
    """
    Get the current working memory (latest turn context).

    Args:
        session: The session state dict.

    Returns:
        Dict with current_turn and turn_index, or empty dict.
    """
    if not isinstance(session, dict):
        return {}
    return session.get("working_memory", {})


# ── Entity Memory ─────────────────────────────────────────────────────────


def get_entity_memory(session: dict, entity_id: str) -> list[dict]:
    """
    Get accumulated facts about a specific entity.

    Args:
        session: The session state dict.
        entity_id: The entity to look up.

    Returns:
        List of fact dicts for the entity, or empty list.
    """
    if not isinstance(session, dict) or not entity_id:
        return []
    return session.get("entity_memory", {}).get(entity_id, [])


def update_entity_memory(
    session: dict,
    entity_id: str,
    facts: list[dict],
) -> dict:
    """
    Add facts to entity memory for a specific entity.

    Args:
        session: The session state dict.
        entity_id: The entity to update.
        facts: List of fact dicts to append.

    Returns:
        The updated session.
    """
    if not isinstance(session, dict):
        raise TypeError("update_entity_memory: session must be a dict")
    if not entity_id:
        raise ValueError("update_entity_memory: entity_id is required")

    if "entity_memory" not in session:
        session["entity_memory"] = {}

    existing = session["entity_memory"].get(entity_id, [])
    existing.extend(facts)
    session["entity_memory"][entity_id] = existing
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    return session


def _update_entity_memory(session: dict, entity_id: str, result: dict) -> None:
    """Internal helper to extract and store entity facts from a tool result."""
    fact = {
        "source": result.get("source", "tool_result"),
        "data": result.get("data", result),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if "entity_memory" not in session:
        session["entity_memory"] = {}
    if entity_id not in session["entity_memory"]:
        session["entity_memory"][entity_id] = []
    session["entity_memory"][entity_id].append(fact)


# ── Domain Memory ─────────────────────────────────────────────────────────


def get_domain_memory(session: dict, domain: str) -> dict:
    """
    Get cross-session domain knowledge cache.

    Args:
        session: The session state dict.
        domain: Domain identifier (e.g. "NPA", "ORM").

    Returns:
        Domain memory dict, or empty dict.
    """
    if not isinstance(session, dict) or not domain:
        return {}
    return session.get("domain_memory", {}).get(domain, {})


def update_domain_memory(
    session: dict,
    domain: str,
    data: dict,
) -> dict:
    """
    Update domain memory cache.

    Args:
        session: The session state dict.
        domain: Domain identifier.
        data: Dict of domain knowledge to merge.

    Returns:
        The updated session.
    """
    if not isinstance(session, dict):
        raise TypeError("update_domain_memory: session must be a dict")
    if not domain:
        raise ValueError("update_domain_memory: domain is required")

    if "domain_memory" not in session:
        session["domain_memory"] = {}
    if domain not in session["domain_memory"]:
        session["domain_memory"][domain] = {}

    session["domain_memory"][domain].update(data)
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    return session


# ── Compression ───────────────────────────────────────────────────────────


def compress_history(
    session: dict,
    max_tokens: int = 4096,
    model: str = "cl100k_base",
) -> dict:
    """
    Compress conversation history to fit within max_tokens.

    Strategy: keeps the most recent turns until the budget is met,
    then summarizes older turns into a compressed_history string.

    Args:
        session: The session state dict.
        max_tokens: Maximum tokens for the compressed history.
        model: The tiktoken encoding for counting.

    Returns:
        The updated session with compressed_history set.
    """
    if not isinstance(session, dict):
        raise TypeError("compress_history: session must be a dict")

    turns = session.get("turns", [])
    if not turns:
        session["compressed_history"] = None
        return session

    # Count total tokens for all turns
    total_tokens = count_tokens_for_object(turns, model)

    if total_tokens <= max_tokens:
        # Already fits — no compression needed
        session["compressed_history"] = None
        return session

    # Keep as many recent turns as fit within budget
    kept_turns: list[dict] = []
    kept_tokens = 0

    for turn in reversed(turns):
        turn_tokens = count_tokens_for_object(turn, model)
        if kept_tokens + turn_tokens > max_tokens:
            break
        kept_turns.insert(0, turn)
        kept_tokens += turn_tokens

    # Summarize dropped turns — preserve provenance tags (Blueprint §11)
    dropped_count = len(turns) - len(kept_turns)
    if dropped_count > 0:
        dropped_turns = turns[:dropped_count]
        summary_parts = []
        preserved_provenance: list[dict] = []
        for t in dropped_turns:
            role = t.get("role", "unknown")
            content = t.get("content", "")
            # Truncate content to keep summary compact
            if len(content) > 100:
                content = content[:100] + "..."
            summary_parts.append(f"[{role}]: {content}")
            # Preserve provenance tags from dropped turns
            prov = t.get("provenance_tags") or t.get("_provenance") or []
            if isinstance(prov, list):
                preserved_provenance.extend(prov)
            elif isinstance(prov, dict):
                preserved_provenance.append(prov)

        session["compressed_history"] = {
            "type": "compressed",
            "dropped_turns": dropped_count,
            "summary": "; ".join(summary_parts),
            "kept_turns": len(kept_turns),
            "preserved_provenance": preserved_provenance,
            "compressed_at": datetime.now(timezone.utc).isoformat(),
        }
    else:
        session["compressed_history"] = None

    return session


# ── Serialization ─────────────────────────────────────────────────────────


def serialize_session(session: dict) -> str:
    """
    Serialize a session state to a JSON string.

    Args:
        session: The session state dict.

    Returns:
        JSON string representation.

    Raises:
        TypeError: If session is not a dict.
    """
    if not isinstance(session, dict):
        raise TypeError("serialize_session: session must be a dict")
    return json.dumps(session, default=str)


def deserialize_session(data: str) -> dict:
    """
    Deserialize a JSON string back to a session state dict.

    Args:
        data: JSON string from serialize_session.

    Returns:
        Session state dict.

    Raises:
        TypeError: If data is not a string.
        ValueError: If JSON is invalid.
    """
    if not isinstance(data, str):
        raise TypeError("deserialize_session: data must be a string")
    try:
        session = json.loads(data)
    except json.JSONDecodeError as e:
        raise ValueError(f"deserialize_session: invalid JSON — {e}") from e

    if not isinstance(session, dict):
        raise ValueError("deserialize_session: JSON must decode to a dict")
    return session


# ── Compatibility shims (original stub API) ───────────────────────────────


def get_session_state(session_id: str) -> dict:
    """
    Retrieve current session state.

    Note: This is a convenience alias. In production, the consuming app
    manages persistence. This returns a fresh empty session.

    Args:
        session_id: The session ID to retrieve.

    Returns:
        A new session dict (no persistence layer in this package).
    """
    return create_session(session_id=session_id)


def update_session_state(session_id: str, updates: dict) -> dict:
    """
    Update session state with new data.

    Note: Convenience wrapper. Merges updates into a session's metadata.

    Args:
        session_id: The session ID.
        updates: Dict of fields to merge into session metadata.

    Returns:
        Updated session.
    """
    session = create_session(session_id=session_id)
    session["metadata"].update(updates)
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    return session


def get_delegation_context(agent_chain: list[str]) -> dict:
    """
    Get context to pass during agent delegation.

    Note: Full delegation logic is in delegation.py (S3-002).
    This is a compatibility shim.

    Args:
        agent_chain: List of agent IDs in the delegation chain.

    Returns:
        Basic delegation context dict.
    """
    return {
        "agent_chain": agent_chain,
        "depth": len(agent_chain),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
