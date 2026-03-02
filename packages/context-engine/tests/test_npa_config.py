import json
import os

NPA_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'domains', 'npa.json')

def load_config():
    with open(NPA_CONFIG_PATH) as f:
        return json.load(f)

def test_load_config():
    config = load_config()
    assert isinstance(config, dict)

def test_domain_id():
    config = load_config()
    assert config["domain_id"] == "NPA"

def test_primary_entity():
    config = load_config()
    assert config["primary_entity"] == "project_id"

def test_context_sources_system_of_record():
    config = load_config()
    sources = config.get("context_sources", [])
    types = [s.get("source_type") for s in sources]
    assert "system_of_record" in types

def test_context_sources_bank_sops():
    config = load_config()
    sources = config.get("context_sources", [])
    types = [s.get("source_type") for s in sources]
    assert "bank_sop" in types

def test_scoping_fields():
    config = load_config()
    fields = config.get("scoping_fields", [])
    assert "project_id" in fields
    assert "jurisdiction" in fields

def test_untrusted_content_non_empty():
    config = load_config()
    untrusted = config.get("untrusted_content", [])
    assert isinstance(untrusted, list)
    assert len(untrusted) > 0

def test_agents_list_contains_npa_orchestrator():
    config = load_config()
    agents = config.get("agents", [])
    agent_ids = [a.get("agent_id") for a in agents]
    assert "NPA_ORCHESTRATOR" in agent_ids

def test_agents_have_orchestrator_and_worker_archetypes():
    config = load_config()
    agents = config.get("agents", [])
    archetypes = set(a.get("archetype") for a in agents)
    assert "orchestrator" in archetypes
    assert "worker" in archetypes

def test_grounding_overrides():
    config = load_config()
    overrides = config.get("grounding_overrides", {})
    assert "required_claim_types" in overrides


# M-007: source_type canonical validation against source-priority.json
CANONICAL_SOURCE_TYPES = {
    "system_of_record",
    "bank_sop",
    "industry_standard",
    "regulatory",
    "user_provided",
    "ai_generated",
}


def test_all_source_types_are_canonical():
    """Every context_source's source_type must match a canonical type from source-priority.json."""
    config = load_config()
    for source in config.get("context_sources", []):
        st = source.get("source_type")
        assert st in CANONICAL_SOURCE_TYPES, (
            f"source_id={source.get('source_id')}: source_type '{st}' "
            f"not in canonical set {CANONICAL_SOURCE_TYPES}"
        )
