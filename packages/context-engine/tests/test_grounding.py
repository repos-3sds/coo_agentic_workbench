"""
Grounding Scorer Tests (Sprint 5 — S5-002)

Tests for identify_claims, verify_claim, score_grounding, and
get_grounding_requirements.

Status: IMPLEMENTED
"""

from __future__ import annotations

import pytest

from context_engine.grounding import (
    identify_claims,
    verify_claim,
    score_grounding,
    get_grounding_requirements,
)


# ── get_grounding_requirements ───────────────────────────────────────────────


class TestGetGroundingRequirements:
    """Tests for loading grounding config."""

    def test_loads_claim_types(self):
        """Config contains claim_types list."""
        config = get_grounding_requirements()
        assert "claim_types" in config
        assert len(config["claim_types"]) >= 5

    def test_loads_verification_steps(self):
        """Config contains verification_steps dict."""
        config = get_grounding_requirements()
        assert "verification_steps" in config
        steps = config["verification_steps"]
        assert "has_citation" in steps
        assert "source_exists" in steps
        assert "source_supports_claim" in steps
        assert "source_is_current" in steps
        assert "authority_sufficient" in steps

    def test_each_claim_type_has_required_fields(self):
        """Each claim type has claim_type, requires_citation, min_authority_tier."""
        config = get_grounding_requirements()
        for ct in config["claim_types"]:
            assert "claim_type" in ct
            assert "requires_citation" in ct
            assert "min_authority_tier" in ct


# ── identify_claims ──────────────────────────────────────────────────────────


class TestIdentifyClaims:
    """Tests for claim extraction from agent response text."""

    def test_empty_text_returns_empty(self):
        """Empty string returns no claims."""
        assert identify_claims("") == []

    def test_none_returns_empty(self):
        """None returns no claims."""
        assert identify_claims(None) == []

    def test_non_string_returns_empty(self):
        """Non-string returns no claims."""
        assert identify_claims(42) == []

    def test_detects_classification_claim(self):
        """Detects classification decision claims."""
        text = "The NPA has been classified as Complex based on scoring criteria."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "classification_decision" in types

    def test_detects_risk_assessment(self):
        """Detects risk assessment claims."""
        text = "The risk level is rated as HIGH for operational risk."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "risk_assessment" in types

    def test_detects_governance_rule(self):
        """Detects governance/policy requirement claims."""
        text = "Governance requires that all Complex NPAs go through dual sign-off."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "governance_rule" in types

    def test_detects_regulatory_obligation(self):
        """Detects regulatory obligation claims."""
        text = "MAS requires annual stress testing for all derivative products."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "regulatory_obligation" in types

    def test_detects_signoff_requirement(self):
        """Detects sign-off requirement claims."""
        text = "Sign-off required from Legal, Compliance, and Finance teams."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "signoff_requirement" in types

    def test_detects_financial_threshold(self):
        """Detects financial threshold claims."""
        text = "The notional amount exceeds SGD 100 million."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "financial_threshold" in types

    def test_detects_sla_deadline(self):
        """Detects SLA/deadline claims."""
        text = "SLA turnaround is 5 business days for standard reviews."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "sla_deadline" in types

    def test_detects_prohibited_item(self):
        """Detects prohibited item claims."""
        text = "Crypto derivatives are a prohibited instrument under bank policy."
        claims = identify_claims(text)
        types = [c["claim_type"] for c in claims]
        assert "prohibited_item" in types

    def test_no_claims_in_neutral_text(self):
        """Neutral text without regulatory/factual claims returns empty."""
        text = "Thank you for your question. Let me help you with that."
        claims = identify_claims(text)
        assert len(claims) == 0

    def test_claims_include_text_and_span(self):
        """Each claim has text, start, and end fields."""
        text = "The risk level is rated as HIGH."
        claims = identify_claims(text)
        assert len(claims) >= 1
        claim = claims[0]
        assert "text" in claim
        assert "start" in claim
        assert "end" in claim
        assert isinstance(claim["start"], int)
        assert isinstance(claim["end"], int)

    def test_multiple_claims_detected(self):
        """Multiple different claim types detected in same text."""
        text = (
            "The NPA has been classified as Complex. "
            "MAS requires quarterly reporting for this product type. "
            "The notional amount exceeds USD 50 million."
        )
        claims = identify_claims(text)
        types = {c["claim_type"] for c in claims}
        assert len(types) >= 2


# ── verify_claim ─────────────────────────────────────────────────────────────


class TestVerifyClaim:
    """Tests for single-claim verification against provenance tags."""

    def test_grounded_claim_with_matching_provenance(self):
        """Claim is grounded when provenance tag matches."""
        claim = {
            "claim_type": "classification_decision",
            "text": "classified as Complex per SOPv3.2_NPA_Classification_Criteria",
        }
        provenance = [{
            "source_id": "SOPv3.2_NPA_Classification_Criteria",
            "source_type": "bank_sop",
            "trust_class": "TRUSTED",
            "authority_tier": 2,
            "ttl_seconds": 86400,
        }]
        result = verify_claim(claim, provenance)
        assert result["grounded"] is True
        assert len(result["failed_steps"]) == 0

    def test_ungrounded_claim_no_provenance(self):
        """Claim is ungrounded with empty provenance list."""
        claim = {
            "claim_type": "risk_assessment",
            "text": "risk level is rated as HIGH",
        }
        result = verify_claim(claim, [])
        assert result["grounded"] is False
        assert "has_citation" in result["failed_steps"]

    def test_five_verification_steps_returned(self):
        """Each verification result contains exactly 5 steps."""
        claim = {
            "claim_type": "governance_rule",
            "text": "governance requires dual sign-off",
        }
        result = verify_claim(claim, [])
        assert len(result["steps"]) == 5
        step_names = [s["step"] for s in result["steps"]]
        assert step_names == [
            "has_citation",
            "source_exists",
            "source_supports",
            "source_current",
            "authority_sufficient",
        ]

    def test_untrusted_source_fails_governance_claim(self):
        """UNTRUSTED source cannot ground governance/regulatory claims."""
        claim = {
            "claim_type": "regulatory_obligation",
            "text": "MAS requires stress testing",
        }
        provenance = [{
            "source_id": "MAS",
            "source_type": "general_web",
            "trust_class": "UNTRUSTED",
            "authority_tier": 5,
        }]
        result = verify_claim(claim, provenance)
        assert result["grounded"] is False
        assert "source_supports" in result["failed_steps"]

    def test_insufficient_authority_fails(self):
        """Source with authority tier > required fails."""
        claim = {
            "claim_type": "financial_threshold",
            "text": "threshold exceeds SGD 100M per SoR:npa_projects:142",
        }
        # financial_threshold requires tier <= 1, but source is tier 3
        provenance = [{
            "source_id": "SoR:npa_projects:142",
            "source_type": "industry_standard",
            "trust_class": "TRUSTED",
            "authority_tier": 3,
        }]
        result = verify_claim(claim, provenance)
        assert "authority_sufficient" in result["failed_steps"]


# ── score_grounding ──────────────────────────────────────────────────────────


class TestScoreGrounding:
    """Tests for the main scoring function."""

    def test_empty_response_returns_perfect_score(self):
        """No claims = score 1.0."""
        result = score_grounding("Thank you for your question.", None)
        assert result["score"] == 1.0
        assert result["claims_checked"] == 0
        assert result["claims_grounded"] == 0

    def test_dict_response_extracts_text(self):
        """Dict response with 'text' key works."""
        result = score_grounding({"text": "Hello, how can I help?"}, None)
        assert result["score"] == 1.0

    def test_dict_response_extracts_content(self):
        """Dict response with 'content' key works."""
        result = score_grounding({"content": "Hello!"}, None)
        assert result["score"] == 1.0

    def test_dict_response_extracts_answer(self):
        """Dict response with 'answer' key works."""
        result = score_grounding({"answer": "Hello!"}, None)
        assert result["score"] == 1.0

    def test_none_response_returns_perfect_score(self):
        """None response returns score 1.0."""
        result = score_grounding(None, None)
        assert result["score"] == 1.0

    def test_ungrounded_claims_score_zero(self):
        """Claims without any provenance score 0."""
        text = "The NPA has been classified as Complex. The risk level is assessed as HIGH."
        result = score_grounding(text, None)
        assert result["claims_checked"] >= 1
        assert result["score"] == 0.0
        assert len(result["claims_ungrounded"]) >= 1

    def test_grounded_claims_with_provenance(self):
        """Claims with matching provenance score > 0."""
        text = "classified as Complex per SOPv3.2_NPA_Classification_Criteria"
        context = {
            "_metadata": {
                "stages": [{
                    "stage": "TAG",
                    "provenance": [{
                        "source_id": "SOPv3.2_NPA_Classification_Criteria",
                        "source_type": "bank_sop",
                        "trust_class": "TRUSTED",
                        "authority_tier": 2,
                        "ttl_seconds": 86400,
                    }],
                }],
            },
        }
        result = score_grounding(text, context)
        assert result["claims_checked"] >= 1
        assert result["claims_grounded"] >= 1
        assert result["score"] > 0

    def test_result_shape(self):
        """Result has all required keys."""
        result = score_grounding("Some text with risk level is assessed as HIGH.", None)
        assert "score" in result
        assert "claims_checked" in result
        assert "claims_grounded" in result
        assert "claims_ungrounded" in result
        assert "verification_steps" in result
        assert isinstance(result["score"], float)
        assert isinstance(result["claims_ungrounded"], list)
        assert isinstance(result["verification_steps"], list)

    def test_provenance_from_entity_data(self):
        """Collects provenance tags from entity_data items."""
        text = "The threshold exceeds SGD 50M per npa_project_api"
        context = {
            "_metadata": {"stages": []},
            "entity_data": [{
                "data": "some data",
                "_provenance": {
                    "source_id": "npa_project_api",
                    "source_type": "system_of_record",
                    "trust_class": "TRUSTED",
                    "authority_tier": 1,
                    "ttl_seconds": 3600,
                },
            }],
        }
        result = score_grounding(text, context)
        # Should find the provenance and attempt verification
        assert result["claims_checked"] >= 1

    def test_mixed_grounded_and_ungrounded(self):
        """Mix of grounded and ungrounded claims produces partial score."""
        # Use padding to ensure the SOP ref is far from the second claim
        text = (
            "classified as Complex per SOPv3.2_NPA_Classification_Criteria. "
            + "This is additional context about the project. " * 10
            + "The risk level is assessed as HIGH based on unknown analysis."
        )
        context = {
            "_metadata": {
                "stages": [{
                    "stage": "TAG",
                    "provenance": [{
                        "source_id": "SOPv3.2_NPA_Classification_Criteria",
                        "source_type": "bank_sop",
                        "trust_class": "TRUSTED",
                        "authority_tier": 2,
                        "ttl_seconds": 86400,
                    }],
                }],
            },
        }
        result = score_grounding(text, context)
        # At least one claim should be grounded, at least one not
        assert result["claims_checked"] >= 2
        assert 0 < result["score"] < 1.0
