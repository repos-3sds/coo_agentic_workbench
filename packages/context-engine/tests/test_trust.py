"""Tests for context_engine.trust — Trust Classification & Source Authority Engine."""

import pytest
from context_engine.trust import (
    classify_trust,
    classify_data_level,
    rank_sources,
    resolve_conflict,
    can_user_access,
    is_never_allowed,
    get_source_hierarchy,
    get_source_tier,
    reset_cache,
)


class TestClassifyTrust:
    def test_mcp_tool_results_trusted(self):
        assert classify_trust("mcp_tool_results") == "TRUSTED"

    def test_bank_sops_trusted(self):
        assert classify_trust("bank_sops_from_kb") == "TRUSTED"

    def test_regulatory_docs_trusted(self):
        assert classify_trust("regulatory_docs_from_kb") == "TRUSTED"

    def test_agent_outputs_trusted(self):
        assert classify_trust("agent_outputs_with_provenance") == "TRUSTED"

    def test_reference_data_tables_trusted(self):
        assert classify_trust("reference_data_tables") == "TRUSTED"

    def test_user_free_text_untrusted(self):
        assert classify_trust("user_free_text") == "UNTRUSTED"

    def test_uploaded_documents_untrusted(self):
        assert classify_trust("uploaded_documents") == "UNTRUSTED"

    def test_external_api_untrusted(self):
        assert classify_trust("external_api_responses") == "UNTRUSTED"

    def test_unknown_source_untrusted(self):
        assert classify_trust("some_random_thing") == "UNTRUSTED"

    def test_none_untrusted(self):
        assert classify_trust(None) == "UNTRUSTED"

    def test_empty_string_untrusted(self):
        assert classify_trust("") == "UNTRUSTED"

    def test_never_allowed_throws(self):
        for src in ["unverified_web_scrapes", "social_media",
                     "competitor_intelligence", "user_pasted_claiming_policy"]:
            with pytest.raises(ValueError, match="NEVER"):
                classify_trust(src)


class TestClassifyDataLevel:
    def test_public(self):
        assert classify_data_level("PUBLIC") == "PUBLIC"

    def test_internal(self):
        assert classify_data_level("INTERNAL") == "INTERNAL"

    def test_confidential(self):
        assert classify_data_level("CONFIDENTIAL") == "CONFIDENTIAL"

    def test_restricted(self):
        assert classify_data_level("RESTRICTED") == "RESTRICTED"

    def test_unknown_defaults_internal(self):
        assert classify_data_level("something_random") == "INTERNAL"

    def test_none_defaults_internal(self):
        assert classify_data_level(None) == "INTERNAL"


class TestRankSources:
    def test_sorts_by_tier(self):
        sources = [
            {"name": "c", "authority_tier": 3},
            {"name": "a", "authority_tier": 1},
            {"name": "b", "authority_tier": 2},
        ]
        result = rank_sources(sources)
        assert [s["authority_tier"] for s in result] == [1, 2, 3]

    def test_stable_sort_equal_tiers(self):
        sources = [
            {"name": "first", "authority_tier": 2},
            {"name": "second", "authority_tier": 2},
        ]
        result = rank_sources(sources)
        assert result[0]["name"] == "first"
        assert result[1]["name"] == "second"

    def test_empty_input(self):
        assert rank_sources([]) == []


class TestResolveConflict:
    def test_higher_authority_wins(self):
        result = resolve_conflict(
            {"authority_tier": 1, "source_type": "system_of_record"},
            {"authority_tier": 2, "source_type": "bank_sop"},
        )
        assert result["winner"]["authority_tier"] == 1

    def test_sor_wins_same_tier(self):
        result = resolve_conflict(
            {"authority_tier": 2, "source_type": "system_of_record"},
            {"authority_tier": 2, "source_type": "bank_sop"},
        )
        assert result["winner"]["source_type"] == "system_of_record"

    def test_newer_date_wins(self):
        result = resolve_conflict(
            {"authority_tier": 2, "source_type": "bank_sop", "effective_date": "2025-01-01"},
            {"authority_tier": 2, "source_type": "bank_sop", "effective_date": "2026-01-01"},
        )
        assert result["winner"]["effective_date"] == "2026-01-01"

    def test_group_wins_over_local(self):
        result = resolve_conflict(
            {"authority_tier": 2, "source_type": "bank_sop", "scope": "group"},
            {"authority_tier": 2, "source_type": "bank_sop", "scope": "local"},
        )
        assert result["winner"]["scope"] == "group"

    def test_unresolved_needs_human_review(self):
        result = resolve_conflict(
            {"authority_tier": 2, "source_type": "bank_sop"},
            {"authority_tier": 2, "source_type": "bank_sop"},
        )
        assert result["resolution"] == "NEEDS_HUMAN_REVIEW"


class TestCanUserAccess:
    def test_employee_internal(self):
        assert can_user_access("employee", "INTERNAL") is True

    def test_employee_public(self):
        assert can_user_access("employee", "PUBLIC") is True

    def test_employee_confidential_denied(self):
        assert can_user_access("employee", "CONFIDENTIAL") is False

    def test_analyst_confidential(self):
        assert can_user_access("analyst", "CONFIDENTIAL") is True

    def test_analyst_restricted_denied(self):
        assert can_user_access("analyst", "RESTRICTED") is False

    def test_checker_restricted(self):
        assert can_user_access("checker", "RESTRICTED") is True

    def test_coo_restricted(self):
        assert can_user_access("coo", "RESTRICTED") is True

    def test_unknown_role_denied(self):
        assert can_user_access("random_role", "PUBLIC") is False


class TestIsNeverAllowed:
    def test_blocked_sources(self):
        for src in ["unverified_web_scrapes", "social_media",
                     "competitor_intelligence", "user_pasted_claiming_policy"]:
            assert is_never_allowed(src) is True

    def test_allowed_source(self):
        assert is_never_allowed("mcp_tool_results") is False

    def test_empty_string(self):
        assert is_never_allowed("") is False


class TestSourceHierarchy:
    def test_returns_5_tiers(self):
        tiers = get_source_hierarchy()
        assert len(tiers) == 5

    def test_tiers_ordered(self):
        tiers = get_source_hierarchy()
        assert [t["tier"] for t in tiers] == [1, 2, 3, 4, 5]

    def test_get_tier_known(self):
        tier = get_source_tier("system_of_record")
        assert tier is not None
        assert tier["tier"] == 1

    def test_get_tier_unknown(self):
        assert get_source_tier("nonexistent") is None


class TestResetCache:
    def test_reset_and_reload(self):
        # First load
        classify_trust("mcp_tool_results")
        # Reset
        reset_cache()
        # Should reload fine
        assert classify_trust("mcp_tool_results") == "TRUSTED"
