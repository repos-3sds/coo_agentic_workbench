"""Domain configuration validation tests (S6-003)."""

from __future__ import annotations

import json
from pathlib import Path


DOMAINS_DIR = Path(__file__).resolve().parent.parent / "domains"


def _domain_files() -> list[Path]:
    files = sorted(DOMAINS_DIR.glob("*.json"))
    return [p for p in files if p.name in {"npa.json", "desk.json", "demo.json", "orm.json"}]


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


class TestDomainConfigParsing:
    def test_domain_files_exist_for_known_configs(self) -> None:
        files = _domain_files()
        names = {p.name for p in files}
        assert "npa.json" in names
        assert "desk.json" in names
        assert "demo.json" in names

    def test_all_domain_files_parse_as_valid_json(self) -> None:
        for path in _domain_files():
            parsed = _load(path)
            assert isinstance(parsed, dict)


class TestRequiredFields:
    def test_all_domain_configs_have_required_top_level_fields(self) -> None:
        required = {"domain_id", "primary_entity", "context_sources", "scoping_fields", "agents"}
        for path in _domain_files():
            cfg = _load(path)
            assert required.issubset(cfg.keys())

    def test_domain_id_is_non_empty_string(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            assert isinstance(cfg["domain_id"], str)
            assert cfg["domain_id"].strip() != ""

    def test_primary_entity_is_non_empty_string(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            assert isinstance(cfg["primary_entity"], str)
            assert cfg["primary_entity"].strip() != ""

    def test_all_domain_configs_have_display_name(self) -> None:
        """Every domain config must have a non-empty display_name."""
        for path in _domain_files():
            cfg = _load(path)
            assert "display_name" in cfg, f"{path.name} missing display_name"
            assert isinstance(cfg["display_name"], str)
            assert cfg["display_name"].strip() != "", f"{path.name} has empty display_name"


class TestContextSources:
    def test_context_sources_is_non_empty_list(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            assert isinstance(cfg["context_sources"], list)
            assert len(cfg["context_sources"]) > 0

    def test_each_context_source_has_source_id(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for src in cfg["context_sources"]:
                assert isinstance(src.get("source_id"), str)
                assert src["source_id"].strip() != ""

    def test_each_context_source_has_source_type(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for src in cfg["context_sources"]:
                assert isinstance(src.get("source_type"), str)
                assert src["source_type"].strip() != ""

    CANONICAL_SOURCE_TYPES = {
        "system_of_record", "bank_sop", "industry_standard",
        "external_official", "general_web",
    }

    def test_each_context_source_has_canonical_source_type(self) -> None:
        """Every source_type must be in the canonical set from trust.py."""
        for path in _domain_files():
            cfg = _load(path)
            for src in cfg["context_sources"]:
                st = src.get("source_type", "")
                assert st in self.CANONICAL_SOURCE_TYPES, (
                    f"{path.name}: source '{src.get('source_id')}' has non-canonical "
                    f"source_type '{st}'. Valid: {self.CANONICAL_SOURCE_TYPES}"
                )

    def test_each_context_source_has_authority_tier_in_range_1_to_5(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for src in cfg["context_sources"]:
                assert isinstance(src.get("authority_tier"), int)
                assert 1 <= src["authority_tier"] <= 5


class TestScopingFields:
    def test_scoping_fields_is_non_empty_list(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            assert isinstance(cfg["scoping_fields"], list)
            assert len(cfg["scoping_fields"]) > 0

    def test_scoping_fields_are_non_empty_strings(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for field in cfg["scoping_fields"]:
                assert isinstance(field, str)
                assert field.strip() != ""


class TestAgents:
    def test_agents_is_non_empty_list(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            assert isinstance(cfg["agents"], list)
            assert len(cfg["agents"]) > 0

    def test_each_agent_has_agent_id(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for agent in cfg["agents"]:
                assert isinstance(agent.get("agent_id"), str)
                assert agent["agent_id"].strip() != ""

    def test_each_agent_has_archetype(self) -> None:
        for path in _domain_files():
            cfg = _load(path)
            for agent in cfg["agents"]:
                assert isinstance(agent.get("archetype"), str)
                assert agent["archetype"].strip() != ""


class TestCrossDomainConsistency:
    def test_no_duplicate_domain_ids(self) -> None:
        ids = [_load(path)["domain_id"] for path in _domain_files()]
        assert len(ids) == len(set(ids))

    def test_all_configs_share_base_schema_structure(self) -> None:
        base_keys = {"domain_id", "primary_entity", "context_sources", "scoping_fields", "agents"}
        for path in _domain_files():
            cfg = _load(path)
            assert base_keys.issubset(set(cfg.keys()))

    def test_orm_config_is_valid(self) -> None:
        """ORM config exists and has correct structure."""
        orm = DOMAINS_DIR / "orm.json"
        assert orm.exists(), "orm.json must exist"
        cfg = _load(orm)
        assert cfg["domain_id"] == "ORM"
        assert isinstance(cfg["context_sources"], list)
        assert isinstance(cfg["agents"], list)
