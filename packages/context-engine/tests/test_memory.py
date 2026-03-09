import json
import pytest
from datetime import datetime, timezone

from context_engine.memory import (
    create_session,
    add_turn,
    get_relevant_history,
    compress_history,
    serialize_session,
    deserialize_session,
    get_working_memory,
    get_entity_memory,
    update_entity_memory,
    get_domain_memory,
    update_domain_memory,
)


def test_create_session():
    session = create_session(session_id="test-123", metadata={"domain": "NPA"})
    assert session["session_id"] == "test-123"
    assert session["metadata"]["domain"] == "NPA"
    assert "working_memory" in session
    assert "entity_memory" in session
    assert "domain_memory" in session


def test_create_session_none_args():
    session = create_session()
    assert session["session_id"].startswith("sess-")
    assert session["metadata"] == {}


def test_add_turn():
    session = create_session()
    turn = {"role": "user", "content": "hello"}
    session = add_turn(session, turn)
    assert session["turn_count"] == 1
    assert "timestamp" in session["turns"][0]
    
    wm = get_working_memory(session)
    assert wm["current_turn"]["content"] == "hello"


def test_add_turn_type_error():
    session = create_session()
    with pytest.raises(TypeError):
        add_turn(session, "not a dict")
    with pytest.raises(TypeError):
        add_turn("not a dict", {"role": "user"})


def test_get_relevant_history():
    session = create_session()
    for i in range(5):
        add_turn(session, {"role": "user", "content": f"msg {i}"})
    
    history = get_relevant_history(session, max_turns=3)
    assert len(history) == 3
    assert history[0]["content"] == "msg 2"
    assert history[2]["content"] == "msg 4"


def test_get_relevant_history_zero():
    session = create_session()
    add_turn(session, {"role": "user", "content": "msg"})
    history = get_relevant_history(session, max_turns=0)
    assert history == []


def test_compress_history_within_budget():
    session = create_session()
    add_turn(session, {"role": "user", "content": "msg"})
    session = compress_history(session, max_tokens=1000)
    assert session["compressed_history"] is None


def test_compress_history_over_budget():
    session = create_session()
    # Add turns that will exceed a tiny budget
    for i in range(10):
        add_turn(session, {"role": "user", "content": f"long message number {i}" * 5})
    
    session = compress_history(session, max_tokens=10)
    assert session["compressed_history"] is not None
    assert session["compressed_history"]["type"] == "compressed"
    assert session["compressed_history"]["dropped_turns"] > 0


def test_serialize_deserialize_roundtrip():
    session = create_session(session_id="roundtrip")
    add_turn(session, {"role": "user", "content": "hello"})
    update_entity_memory(session, "ent-1", [{"fact": 1}])
    update_domain_memory(session, "dom-1", {"key": "value"})

    data = serialize_session(session)
    restored = deserialize_session(data)
    
    assert restored["session_id"] == "roundtrip"
    assert restored["turn_count"] == 1
    assert restored["entity_memory"]["ent-1"][0]["fact"] == 1
    assert restored["domain_memory"]["dom-1"]["key"] == "value"


def test_deserialize_invalid_json():
    with pytest.raises(ValueError):
        deserialize_session("invalid json")


def test_4_tier_working_memory_updates():
    session = create_session()
    add_turn(session, {"role": "user", "content": "test 1"})
    wm = get_working_memory(session)
    assert wm["current_turn"]["content"] == "test 1"
    
    add_turn(session, {"role": "assistant", "content": "test 2"})
    wm = get_working_memory(session)
    assert wm["current_turn"]["content"] == "test 2"


def test_entity_memory_update_retrieve():
    session = create_session()
    update_entity_memory(session, "E1", [{"name": "project x"}])
    mem = get_entity_memory(session, "E1")
    assert len(mem) == 1
    assert mem[0]["name"] == "project x"


def test_domain_memory_update_retrieve():
    session = create_session()
    update_domain_memory(session, "D1", {"threshold": 100})
    mem = get_domain_memory(session, "D1")
    assert mem["threshold"] == 100


# M-008: entity auto-extract from tool_results in add_turn
def test_entity_auto_extract_from_tool_results():
    """add_turn should auto-extract entity facts from tool_results with entity_id."""
    session = create_session()
    turn = {
        "role": "assistant",
        "content": "Fetched project data",
        "tool_results": [
            {
                "entity_id": "PRJ-001",
                "source": "npa_project_api",
                "data": {"project_name": "Widget X", "status": "active"},
            },
        ],
    }
    session = add_turn(session, turn)
    # Entity memory should be auto-populated from tool_results
    facts = get_entity_memory(session, "PRJ-001")
    assert len(facts) == 1
    assert facts[0]["source"] == "npa_project_api"
    assert facts[0]["data"]["project_name"] == "Widget X"


def test_entity_auto_extract_skips_without_entity_id():
    """Tool results without entity_id should NOT populate entity memory."""
    session = create_session()
    turn = {
        "role": "assistant",
        "content": "General response",
        "tool_results": [
            {"data": {"general": "info"}},
        ],
    }
    session = add_turn(session, turn)
    assert session["entity_memory"] == {}


# M-001: compress_history preserves provenance tags
def test_compress_history_preserves_provenance():
    """Provenance tags from dropped turns must be preserved in compressed_history."""
    session = create_session()
    # Add turns with provenance that will be dropped
    for i in range(10):
        turn = {
            "role": "user",
            "content": f"message with provenance {i}" * 10,
            "provenance_tags": [{"source_id": f"src_{i}", "authority_tier": 1}],
        }
        add_turn(session, turn)

    session = compress_history(session, max_tokens=10)
    ch = session["compressed_history"]
    assert ch is not None
    assert "preserved_provenance" in ch
    assert isinstance(ch["preserved_provenance"], list)
    assert len(ch["preserved_provenance"]) > 0
    # Verify provenance tags from dropped turns are carried forward
    source_ids = {p.get("source_id") for p in ch["preserved_provenance"]}
    assert "src_0" in source_ids
