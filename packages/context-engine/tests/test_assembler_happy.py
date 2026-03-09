"""
Tests for Core Context Assembler pipeline (S2-009).
Contains 20+ tests asserting pipeline stage mapping, component contracts
and graceful degradation during integration failure modes.
"""

from __future__ import annotations

import pytest

from context_engine.assembler import (
    assemble_context,
    validate_assembled_context,
    create_assembler,
)


@pytest.fixture
def base_request():
    return {
        "agent_id": "Agent_007",
        "entity_ids": ["PROJ-101"],
        "entity_type": "project",
        "query": "What are the compliance risks?",
        "system_prompt": "You are a risk classifier.",
        "conversation_history": [
            {"role": "user", "content": "analyze PROJ-101"}
        ],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [
            {
                "data": "Initial input document",
                "source_type": "user_input"
            }
        ]
    }


@pytest.fixture
def mock_adapters():
    """Mock adapters returning realistic data payload dict arrays."""
    def _retrieve(query_dict: dict) -> list[dict]:
        return [
            {
                "content": "Cross-agent classification notes.",
                "provenance": {
                    "source_id": "AgentResult_42",
                    "source_type": "agent_output",
                    "authority_tier": 3,
                    "fetched_at": "2026-03-02T10:00:00Z",
                    "ttl_seconds": 3600,
                    "trust_class": "TRUSTED",
                    "data_classification": "INTERNAL"
                }
            }
        ]

    def _get_entity_data(entity_ids: list[str], domain: str) -> list[dict]:
        return [
            {
                "entity_id": entity_ids[0],
                "entity_type": "project",
                "status": "active",
                "domain": domain,
                "provenance": {
                    "source_id": f"SoR:{entity_ids[0]}",
                    "source_type": "system_of_record",
                    "authority_tier": 1,
                    "fetched_at": "2026-03-02T10:00:00Z",
                    "ttl_seconds": 3600,
                    "trust_class": "TRUSTED",
                    "data_classification": "CONFIDENTIAL",
                    "jurisdiction": "GLOBAL"
                }
            }
        ]

    def _get_kb_chunks(domain: str, query: str) -> list[dict]:
        return [
            {
                "snippet": "Compliance requires manual overrides.",
                "provenance": {
                    "source_id": "SOP_Override_v4",
                    "source_type": "bank_sop",
                    "authority_tier": 2,
                    "fetched_at": "2026-03-02T10:00:00Z",
                    "ttl_seconds": 86400,
                    "trust_class": "TRUSTED",
                    "data_classification": "PUBLIC"
                }
            }
        ]

    return {
        "retrieve": _retrieve,
        "get_entity_data": _get_entity_data,
        "get_kb_chunks": _get_kb_chunks
    }


@pytest.fixture
def user_context():
    return {
        "user_id": "u4312",
        "role": "analyst",
        "department": "Risk",
        "jurisdiction": "SG",
        "session_id": "sess-alpha-9"
    }


def test_pipeline_trace_id(base_request, mock_adapters, user_context):
    """Ensure the pipeline metadata produces a ctx- traced id."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    assert res["_metadata"]["trace_id"].startswith("ctx-")


def test_pipeline_has_7_stages(base_request, mock_adapters, user_context):
    """The pipeline must output precisely 7 distinct stage metadata records."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    stages = [s["stage"] for s in res["_metadata"]["stages"]]
    assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]


def test_budget_report_is_present(base_request, mock_adapters, user_context):
    """Ensure that the pipeline budget allocates tokens reporting its output limits."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    budget = res["_metadata"]["budget_report"]
    assert "total" in budget
    assert "within_budget" in budget
    assert "profile" in budget
    assert budget["profile"] == "standard"


def test_validate_archetype_propagation(base_request, mock_adapters, user_context):
    """Ensure the requested archetype propagates to the pipeline tags natively."""
    res = assemble_context(
        base_request, "reviewer", "ORM", user_context, mock_adapters
    )
    assert res["_metadata"]["archetype"] == "reviewer"


def test_validate_domain_propagation(base_request, mock_adapters, user_context):
    """Ensure the requested domain propagates natively."""
    res = assemble_context(
        base_request, "orchestrator", "DCE", user_context, mock_adapters
    )
    assert res["_metadata"]["domain"] == "DCE"


def test_base_context_keys(base_request, mock_adapters, user_context):
    """Verify that all drafted internal dictionaries propagate correctly."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    ctx = res["context"]
    assert "system_prompt_context" in ctx
    assert "entity_data" in ctx
    assert "knowledge_chunks" in ctx
    assert "cross_agent_context" in ctx
    assert "few_shot_examples" in ctx
    assert "conversation_history" in ctx
    assert "tool_schemas" in ctx
    assert "user_context" in ctx


def test_no_adapters_provided(base_request, user_context):
    """Ensure the assembler defaults gracefully to empty datasets if none provided."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, None
    )
    ctx = res["context"]
    assert len(ctx["entity_data"]) == 0
    assert len(ctx["knowledge_chunks"]) == 0
    assert len(ctx["cross_agent_context"]) == 0


def test_adapter_exceptional_degradation(base_request, user_context):
    """Test catastrophic adapter failure defaults reliably without crashing."""
    def crash_retrieve(query_dict):
        raise RuntimeError("Network Error")
        
    def crash_entity(entity_ids, domain):
        raise ValueError("Unknown format")
        
    def crash_kb(domain, query):
        raise Exception("Database failure")
        
    poisoned_adapters = {
        "retrieve": crash_retrieve,
        "get_entity_data": crash_entity,
        "get_kb_chunks": crash_kb
    }
    
    res = assemble_context(
        base_request, "worker", "NPA", user_context, poisoned_adapters
    )
    ctx = res["context"]
    assert len(ctx["entity_data"]) == 0
    assert len(ctx["knowledge_chunks"]) == 0
    assert len(ctx["cross_agent_context"]) == 0


def test_adapter_valid_ingestion(base_request, mock_adapters, user_context):
    """Ensure that the mocked adapters correctly append records into context slices."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    ctx = res["context"]
    assert len(ctx["entity_data"]) == 1
    assert ctx["entity_data"][0]["entity_id"] == "PROJ-101"
    
    assert len(ctx["knowledge_chunks"]) == 1
    assert "Compliance requires" in ctx["knowledge_chunks"][0]["snippet"]
    
    assert len(ctx["cross_agent_context"]) == 1


def test_validate_assembled_context_success(base_request, mock_adapters, user_context):
    """Test that a generated valid context validates correctly against worker.json."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    
    # Needs assigned_task, tool_results, domain_knowledge, which are missing from mock so it will fail.
    # Hack: Inject properties manually to test validate_assembled_context function success.
    res["context"]["assigned_task"] = "task"
    res["context"]["tool_results"] = {}
    res["context"]["domain_knowledge"] = {}
    
    validation = validate_assembled_context(res["context"], "worker")
    assert validation["valid"] is True


def test_validate_assembled_context_failure(base_request, mock_adapters, user_context):
    """Test validation fails reliably on an unhacked payload (missing fields)."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    validation = validate_assembled_context(res["context"], "worker")
    assert validation["valid"] is False
    assert "assigned_task" in validation["missing_required"]


def test_create_assembler_factory_default_config(base_request, mock_adapters, user_context):
    """Test that the assembler factory produces a valid operational tuple."""
    factory = create_assembler()
    assert "assemble" in factory
    assert "validate" in factory
    assert factory["config"] == {}
    
    res = factory["assemble"](base_request, "worker", "NPA", user_context=user_context, adapters=mock_adapters)
    assert res["_metadata"]["archetype"] == "worker"


def test_create_assembler_factory_override_config():
    """Test that factory accepts and attaches non-default configurations."""
    cfg = {"strict_budget": True}
    factory = create_assembler(config=cfg)
    assert factory["config"]["strict_budget"] is True


def test_orchestrator_pipeline_budget(base_request, mock_adapters, user_context):
    """Ensure orchestrator yields lightweight budget profile records."""
    res = assemble_context(
        base_request, "orchestrator", "NPA", user_context, mock_adapters
    )
    budget = res["_metadata"]["budget_report"]
    assert budget["profile"] == "lightweight"


def test_reviewer_pipeline_budget(base_request, mock_adapters, user_context):
    """Ensure reviewer yields compact budget profile records."""
    res = assemble_context(
        base_request, "reviewer", "NPA", user_context, mock_adapters
    )
    budget = res["_metadata"]["budget_report"]
    assert budget["profile"] == "compact"


def test_stage_durations_are_tracked(base_request, mock_adapters, user_context):
    """Ensure float metric timings exist across standard assemblies."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    for stage in res["_metadata"]["stages"]:
        assert "duration_ms" in stage
        assert isinstance(stage["duration_ms"], float)


def test_provenance_tag_metadata_collected(base_request, mock_adapters, user_context):
    """Ensure provenance tags from retrieved assets properly aggregate within the TAG phase."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    tags = res["_metadata"]["provenance_tags"]
    # We included 3 valid tags nested inside our mock_adapters payloads so all 3 should collect.
    assert len(tags) == 3
    # Check that they originated from their respective providers
    source_ids = [t["source_id"] for t in tags]
    assert "AgentResult_42" in source_ids
    assert "SoR:PROJ-101" in source_ids
    assert "SOP_Override_v4" in source_ids


def test_invalid_provenance_is_filtered(base_request, mock_adapters, user_context):
    """Ensure badly formed provenance tags are dropped during tag collection."""
    # Inject bad tag into request source mapping
    bad_req = base_request.copy()
    bad_req["sources"] = [
        {
            "data": "xyz",
            "provenance": {
                "source_id": "BadTag",
                # missing other required schema fields
            }
        }
    ]
    res = assemble_context(
        bad_req, "worker", "NPA", user_context, mock_adapters
    )
    
    tags = res["_metadata"]["provenance_tags"]
    source_ids = [t["source_id"] for t in tags]
    assert "BadTag" not in source_ids
    assert len(tags) == 3  # The 3 from the valid adapters are still retained
    

def test_missing_user_context_is_empty_dict(base_request, mock_adapters):
    """Ensure user_context properly coerces to an empty dict if None."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context=None, adapters=mock_adapters
    )
    assert res["context"]["user_context"] == {}


def test_budget_trim_trigger(base_request, mock_adapters, user_context, monkeypatch):
    """Test that context correctly attempts a hard trim if budget constraints trigger."""
    import context_engine.assembler as asm

    def fake_allocate(draft_context, contract, model="cl100k_base"):
        return {
            "total": 999999, "within_budget": False, "profile": "compact",
            "allocations": {}, "limit": 100, "remaining": -999899,
        }

    def fake_trim(draft_context, contract, model="cl100k_base"):
        return {
            "trimmed_context": draft_context,
            "removed_slots": ["knowledge_chunks"],
            "final_tokens": 5,
        }

    monkeypatch.setattr(asm, "allocate_budget", fake_allocate)
    monkeypatch.setattr(asm, "trim_to_budget", fake_trim)
    
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    report = res["_metadata"]["budget_report"]
    assert report["within_budget"] is False
    assert report["trimmed"] is True
    assert "knowledge_chunks" in report["removed_slots"]
    assert report["final_tokens"] == 5


def test_empty_query_skips_kb(base_request, mock_adapters, user_context):
    """Ensure that if the query is blank, KB retrieval is explicitly skipped."""
    req = base_request.copy()
    req["query"] = ""  # blank query
    
    res = assemble_context(
        req, "worker", "NPA", user_context, mock_adapters
    )
    # The KB adapter gets skipped if query string is falsy 
    assert len(res["context"]["knowledge_chunks"]) == 0


def test_empty_entity_ids_skips_entity_fetch(base_request, mock_adapters, user_context):
    """Ensure that if entity_ids is empty, entity retrieval is skipped."""
    req = base_request.copy()
    req["entity_ids"] = [] 
    
    res = assemble_context(
        req, "worker", "NPA", user_context, mock_adapters
    )
    # The entity adapter gets skipped if ids array is falsy
    assert len(res["context"]["entity_data"]) == 0


def test_extra_retrieval_returns_cross_agent_context(base_request, mock_adapters, user_context):
    """Ensure that the cross-agent context retrieves and populates the context block."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    # The 'retrieve' adapter returns 1 cross_agent row in the mock
    assert len(res["context"]["cross_agent_context"]) == 1
    assert "Cross-agent classification" in res["context"]["cross_agent_context"][0]["content"]


def test_request_sources_carry_down(base_request, mock_adapters, user_context):
    """Ensure that user-provided `sources` on the request map down stream correctly."""
    req = base_request.copy()
    req["sources"] = [{"data": "Direct Input", "source_type": "user_input"}]
    
    res = assemble_context(
        req, "worker", "NPA", user_context, mock_adapters
    )
    
    # Locate CLASSIFY stage array before scope to verify it picked it up
    stages = res["_metadata"]["stages"]
    classify = next(s for s in stages if s["stage"] == "CLASSIFY")
    assert classify["details"]["sources_classified"] >= 1


def test_scoping_eliminates_out_of_bounds_data(base_request, mock_adapters, user_context):
    """Verify that the Scoper stage actively drops un-entitled data sources."""
    # The mock returns CONFIDENTIAL data, but if we set max_classification to PUBLIC, 
    # the SCOPE phase drops it before RETRIEVE
    req = base_request.copy()
    req["sources"] = [{
        "data": "Secret",
        "provenance": {"data_classification": "RESTRICTED", "source_type": "user"}
    }]
    
    # We will pass a user_context with generic access
    restricted_user = {"role": "guest"}  # guest can't see RESTRICTED
    res = assemble_context(
        req, "worker", "NPA", restricted_user, mock_adapters
    )
    
    stages = res["_metadata"]["stages"]
    scope = next(s for s in stages if s["stage"] == "SCOPE")
    assert scope["details"]["after"] == 0


def test_system_prompt_propagation(base_request, mock_adapters, user_context):
    """Ensure system prompt goes straight through unchanged into the package."""
    res = assemble_context(
        base_request, "worker", "NPA", user_context, mock_adapters
    )
    assert res["context"]["system_prompt_context"] == "You are a risk classifier."
