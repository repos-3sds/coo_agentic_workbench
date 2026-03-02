"""Tests for context_engine.scoper (S2-007)."""

from __future__ import annotations

from copy import deepcopy

from context_engine.scoper import (
    apply_all_scopes,
    filter_by_entitlements,
    reset_domain_cache,
    scope_by_classification,
    scope_by_domain,
    scope_by_entity,
    scope_by_jurisdiction,
    scope_by_role,
    scope_by_temporal,
    scope_context,
)


SAMPLE_DATA = [
    {
        "id": "d1",
        "domain": "NPA",
        "entity_id": "PRJ-001",
        "entity_type": "project",
        "jurisdiction": "SG",
        "data_classification": "CONFIDENTIAL",
    },
    {
        "id": "d2",
        "domain": "ORM",
        "entity_id": "INC-042",
        "entity_type": "incident",
        "jurisdiction": "HK",
        "data_classification": "INTERNAL",
    },
    {
        "id": "d3",
        "domain": "NPA",
        "entity_id": "PRJ-001",
        "entity_type": "project",
        "jurisdiction": "GLOBAL",
        "data_classification": "PUBLIC",
    },
    {
        "id": "d4",
        "domain": "NPA",
        "entity_id": "PRJ-002",
        "entity_type": "project",
        "jurisdiction": "SG",
        "data_classification": "RESTRICTED",
    },
    {
        "id": "d5",
        "domain": "platform",
        "jurisdiction": "GLOBAL",
        "data_classification": "INTERNAL",
    },
    {
        "id": "d6",
        "jurisdiction": "GLOBAL",
        "data_classification": "PUBLIC",
    },
]


class TestScopeByDomain:
    def test_npa_filters_to_npa_platform_and_none_domain(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "NPA")
        assert {item["id"] for item in result} == {"d1", "d3", "d4", "d5", "d6"}

    def test_orm_filters_to_orm_platform_and_none_domain(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "ORM")
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_unknown_domain_keeps_platform_and_none_domain_only(self) -> None:
        result = scope_by_domain(deepcopy(SAMPLE_DATA), "UNKNOWN")
        assert {item["id"] for item in result} == {"d5", "d6"}

    def test_empty_data_returns_empty(self) -> None:
        assert scope_by_domain([], "NPA") == []


class TestScopeByEntity:
    def test_project_scoping_for_npa_entity(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id="PRJ-001", entity_type="project")
        assert {item["id"] for item in result} == {"d1", "d3", "d5", "d6"}

    def test_incident_scoping_for_orm_entity(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id="INC-042", entity_type="incident")
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_none_entity_id_returns_all_data(self) -> None:
        result = scope_by_entity(deepcopy(SAMPLE_DATA), entity_id=None)
        assert len(result) == len(SAMPLE_DATA)

    def test_no_matching_entity_returns_empty_when_no_global_items(self) -> None:
        bound_only = [
            {"id": "x1", "entity_id": "PRJ-001", "entity_type": "project"},
            {"id": "x2", "entity_id": "PRJ-002", "entity_type": "project"},
        ]
        result = scope_by_entity(bound_only, entity_id="PRJ-999", entity_type="project")
        assert result == []


class TestScopeByJurisdiction:
    def test_sg_jurisdiction_keeps_sg_and_global(self) -> None:
        result = scope_by_jurisdiction(deepcopy(SAMPLE_DATA), "SG")
        assert {item["id"] for item in result} == {"d1", "d3", "d4", "d5", "d6"}

    def test_unknown_jurisdiction_keeps_global_only(self) -> None:
        no_none = [
            {"id": "g1", "jurisdiction": "GLOBAL"},
            {"id": "h1", "jurisdiction": "HK"},
            {"id": "s1", "jurisdiction": "SG"},
        ]
        result = scope_by_jurisdiction(no_none, "JP")
        assert {item["id"] for item in result} == {"g1"}

    def test_empty_jurisdiction_returns_all(self) -> None:
        result = scope_by_jurisdiction(deepcopy(SAMPLE_DATA), "")
        assert len(result) == len(SAMPLE_DATA)


class TestScopeByClassification:
    def test_internal_max_excludes_confidential_and_restricted(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "INTERNAL")
        assert {item["id"] for item in result} == {"d2", "d3", "d5", "d6"}

    def test_restricted_max_keeps_all_levels(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "RESTRICTED")
        assert len(result) == len(SAMPLE_DATA)

    def test_public_max_keeps_only_public(self) -> None:
        result = scope_by_classification(deepcopy(SAMPLE_DATA), "PUBLIC")
        assert {item["id"] for item in result} == {"d3", "d6"}


class TestScopeByRole:
    def test_analyst_sees_up_to_confidential(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "analyst")
        assert {item["id"] for item in result} == {"d1", "d2", "d3", "d5", "d6"}

    def test_employee_sees_up_to_internal(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "employee")
        assert {item["id"] for item in result} == {"d2", "d3", "d5", "d6"}

    def test_coo_sees_everything(self) -> None:
        result = scope_by_role(deepcopy(SAMPLE_DATA), "coo")
        assert len(result) == len(SAMPLE_DATA)


class TestScopeByRoleDenyByDefault:
    """Tests for C-002 fix: missing data_classification defaults to RESTRICTED."""

    def test_missing_classification_denied_for_employee(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "employee")
        assert result == []

    def test_missing_classification_denied_for_analyst(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "analyst")
        assert result == []

    def test_missing_classification_allowed_for_coo(self) -> None:
        data = [{"id": "no_class", "domain": "NPA"}]
        result = scope_by_role(data, "coo")
        assert len(result) == 1

    def test_classification_from_provenance_fallback(self) -> None:
        data = [{"id": "prov_class", "provenance": {"data_classification": "PUBLIC"}}]
        result = scope_by_role(data, "employee")
        assert len(result) == 1


class TestScopeByTemporal:
    """Tests for scope_by_temporal() — C-001 fix."""

    def test_no_temporal_fields_passes_through(self) -> None:
        data = [{"id": "d1", "domain": "NPA"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_future_effective_date_excluded(self) -> None:
        data = [{"id": "d1", "effective_date": "2099-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert result == []

    def test_past_effective_date_included(self) -> None:
        data = [{"id": "d1", "effective_date": "2020-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_past_expiry_date_excluded(self) -> None:
        data = [{"id": "d1", "expiry_date": "2020-01-01T00:00:00+00:00"}]
        result = scope_by_temporal(data)
        assert result == []

    def test_future_expiry_date_included(self) -> None:
        data = [{"id": "d1", "expiry_date": "2099-12-31T23:59:59+00:00"}]
        result = scope_by_temporal(data)
        assert len(result) == 1

    def test_temporal_fields_in_provenance(self) -> None:
        data = [{"id": "d1", "provenance": {"expiry_date": "2020-01-01T00:00:00+00:00"}}]
        result = scope_by_temporal(data)
        assert result == []

    def test_empty_list_returns_empty(self) -> None:
        assert scope_by_temporal([]) == []


class TestApplyAllScopes:
    def test_chains_domain_entity_and_jurisdiction(self) -> None:
        config = {
            "domain": "NPA",
            "entity_id": "PRJ-001",
            "entity_type": "project",
            "jurisdiction": "SG",
        }
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), config)
        # d1 matches fully; d3 is GLOBAL and entity match; d5/d6 survive as unbound GLOBAL platform/none-domain data
        assert {item["id"] for item in result} == {"d1", "d3", "d5", "d6"}

    def test_partial_config_applies_only_present_scopes(self) -> None:
        config = {"domain": "ORM", "user_role": "employee"}
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), config)
        assert {item["id"] for item in result} == {"d2", "d5", "d6"}

    def test_empty_config_returns_all_data(self) -> None:
        result = apply_all_scopes(deepcopy(SAMPLE_DATA), {})
        assert len(result) == len(SAMPLE_DATA)

    def test_empty_input_returns_empty(self) -> None:
        result = apply_all_scopes([], {"domain": "NPA", "entity_id": "PRJ-001"})
        assert result == []


# ── M-010 fix: deny-by-default for unknown classification ──────────────


class TestScopeByClassificationDenyByDefault:
    """M-010: Unknown classification strings must be treated as RESTRICTED."""

    def test_unknown_classification_blocked_at_public_max(self) -> None:
        data = [{"id": "u1", "data_classification": "SUPER_SECRET"}]
        result = scope_by_classification(data, "PUBLIC")
        assert result == []

    def test_unknown_classification_blocked_at_internal_max(self) -> None:
        data = [{"id": "u1", "data_classification": "CUSTOM_LEVEL"}]
        result = scope_by_classification(data, "INTERNAL")
        assert result == []

    def test_unknown_classification_blocked_at_confidential_max(self) -> None:
        data = [{"id": "u1", "data_classification": "UNKNOWN_LEVEL"}]
        result = scope_by_classification(data, "CONFIDENTIAL")
        assert result == []

    def test_unknown_classification_passes_at_restricted_max(self) -> None:
        data = [{"id": "u1", "data_classification": "CUSTOM_LEVEL"}]
        result = scope_by_classification(data, "RESTRICTED")
        assert len(result) == 1

    def test_none_classification_treated_as_public(self) -> None:
        """Items with no classification at all default to ordinal 0 (pass through)."""
        data = [{"id": "u1"}]
        result = scope_by_classification(data, "PUBLIC")
        assert len(result) == 1

    def test_unknown_classification_in_provenance_blocked(self) -> None:
        data = [{"id": "u1", "provenance": {"data_classification": "BIZARRE"}}]
        result = scope_by_classification(data, "INTERNAL")
        assert result == []


# ── M-011 fix: scope_context and filter_by_entitlements tests ──────────


class TestScopeContext:
    """Tests for scope_context() — the high-level domain scoping entry point."""

    def setup_method(self) -> None:
        reset_domain_cache()

    def test_scope_context_filters_by_domain(self) -> None:
        pkg = {
            "entity_data": [
                {"id": "n1", "domain": "NPA"},
                {"id": "o1", "domain": "ORM"},
                {"id": "p1", "domain": "platform"},
            ],
            "system_prompt_context": "You are the NPA worker.",
        }
        result = scope_context(pkg, domain="NPA")
        ids = {item["id"] for item in result["entity_data"]}
        assert "n1" in ids
        assert "p1" in ids
        assert "o1" not in ids
        # Scalar slot passes through unchanged
        assert result["system_prompt_context"] == "You are the NPA worker."

    def test_scope_context_filters_by_domain_and_entity(self) -> None:
        # NPA config has primary_entity="project_id", so entity_type must match
        pkg = {
            "entity_data": [
                {"id": "n1", "domain": "NPA", "entity_id": "PRJ-001", "entity_type": "project_id"},
                {"id": "n2", "domain": "NPA", "entity_id": "PRJ-002", "entity_type": "project_id"},
                {"id": "g1", "domain": "NPA"},  # globally scoped within NPA (no entity_id)
            ],
        }
        result = scope_context(pkg, domain="NPA", entity_id="PRJ-001")
        ids = {item["id"] for item in result["entity_data"]}
        assert "n1" in ids
        assert "g1" in ids  # no entity_id → globally scoped
        assert "n2" not in ids

    def test_scope_context_scalar_slots_pass_through(self) -> None:
        pkg = {
            "system_prompt_context": "immutable prompt",
            "metadata": 42,
            "flag": True,
        }
        result = scope_context(pkg, domain="NPA")
        assert result["system_prompt_context"] == "immutable prompt"
        assert result["metadata"] == 42
        assert result["flag"] is True

    def test_scope_context_empty_list_slots_stay_empty(self) -> None:
        pkg = {"entity_data": []}
        result = scope_context(pkg, domain="NPA")
        assert result["entity_data"] == []

    def test_scope_context_uses_domain_config_entity_type(self) -> None:
        """NPA domain config has primary_entity='project_id', which maps to entity_type."""
        pkg = {
            "entity_data": [
                {"id": "n1", "domain": "NPA", "entity_id": "PRJ-001", "entity_type": "project_id"},
                {"id": "n2", "domain": "NPA", "entity_id": "PRJ-001", "entity_type": "incident_id"},
            ],
        }
        result = scope_context(pkg, domain="NPA", entity_id="PRJ-001")
        ids = {item["id"] for item in result["entity_data"]}
        # n1 matches the NPA primary_entity type; n2 does not
        assert "n1" in ids
        assert "n2" not in ids

    def test_scope_context_unknown_domain_still_works(self) -> None:
        pkg = {
            "entity_data": [
                {"id": "n1", "domain": "UNKNOWN_DOMAIN"},
                {"id": "p1", "domain": "platform"},
            ],
        }
        result = scope_context(pkg, domain="UNKNOWN_DOMAIN")
        ids = {item["id"] for item in result["entity_data"]}
        assert "n1" in ids
        assert "p1" in ids


class TestFilterByEntitlements:
    """Tests for filter_by_entitlements() — role-based context filtering."""

    def test_employee_sees_only_internal_and_public(self) -> None:
        pkg = {
            "knowledge_chunks": [
                {"id": "p1", "data_classification": "PUBLIC"},
                {"id": "i1", "data_classification": "INTERNAL"},
                {"id": "c1", "data_classification": "CONFIDENTIAL"},
                {"id": "r1", "data_classification": "RESTRICTED"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="employee", domain="NPA")
        ids = {item["id"] for item in result["knowledge_chunks"]}
        assert ids == {"p1", "i1"}

    def test_analyst_sees_up_to_confidential(self) -> None:
        pkg = {
            "knowledge_chunks": [
                {"id": "p1", "data_classification": "PUBLIC"},
                {"id": "c1", "data_classification": "CONFIDENTIAL"},
                {"id": "r1", "data_classification": "RESTRICTED"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="analyst", domain="NPA")
        ids = {item["id"] for item in result["knowledge_chunks"]}
        assert ids == {"p1", "c1"}

    def test_coo_sees_everything(self) -> None:
        pkg = {
            "knowledge_chunks": [
                {"id": "p1", "data_classification": "PUBLIC"},
                {"id": "r1", "data_classification": "RESTRICTED"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="coo", domain="NPA")
        ids = {item["id"] for item in result["knowledge_chunks"]}
        assert ids == {"p1", "r1"}

    def test_scalar_slots_pass_through(self) -> None:
        pkg = {
            "system_prompt_context": "immutable",
            "knowledge_chunks": [
                {"id": "p1", "data_classification": "PUBLIC"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="employee", domain="NPA")
        assert result["system_prompt_context"] == "immutable"

    def test_missing_classification_denied_for_employee(self) -> None:
        """Items missing data_classification default to RESTRICTED (deny-by-default)."""
        pkg = {
            "entity_data": [
                {"id": "no_class"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="employee", domain="NPA")
        assert result["entity_data"] == []

    def test_empty_package_returns_empty(self) -> None:
        result = filter_by_entitlements({}, user_role="analyst", domain="NPA")
        assert result == {}

    def test_multiple_slots_filtered_independently(self) -> None:
        pkg = {
            "knowledge_chunks": [
                {"id": "k1", "data_classification": "PUBLIC"},
                {"id": "k2", "data_classification": "RESTRICTED"},
            ],
            "entity_data": [
                {"id": "e1", "data_classification": "INTERNAL"},
                {"id": "e2", "data_classification": "CONFIDENTIAL"},
            ],
        }
        result = filter_by_entitlements(pkg, user_role="employee", domain="NPA")
        k_ids = {item["id"] for item in result["knowledge_chunks"]}
        e_ids = {item["id"] for item in result["entity_data"]}
        assert k_ids == {"k1"}
        assert e_ids == {"e1"}
