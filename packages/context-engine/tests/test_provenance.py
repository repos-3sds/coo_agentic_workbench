"""Tests for context_engine.provenance — Provenance Tagger & Validator."""

import json
import hashlib
import pytest
from datetime import datetime, timezone, timedelta
from context_engine.provenance import (
    tag_provenance,
    validate_provenance,
    is_expired,
    get_authority_tier,
    strip_provenance,
    create_provenance_tag,
    merge_provenance,
    get_required_fields,
    compute_chunk_hash,
    reset_cache,
)


# ── tag_provenance ────────────────────────────────────────────────────────


class TestTagProvenance:
    def test_tags_data_with_provenance(self, sample_provenance_tag):
        tagged = tag_provenance("hello", sample_provenance_tag)
        assert tagged["data"] == "hello"
        assert "_provenance" in tagged
        assert tagged["_provenance"]["source_id"] == "SoR:npa_projects:142"

    def test_tags_dict_data(self, sample_provenance_tag):
        data = {"key": "value", "nested": [1, 2, 3]}
        tagged = tag_provenance(data, sample_provenance_tag)
        assert tagged["data"] == data
        assert tagged["_provenance"]["trust_class"] == "TRUSTED"

    def test_tags_list_data(self, sample_provenance_tag):
        data = [1, 2, 3]
        tagged = tag_provenance(data, sample_provenance_tag)
        assert tagged["data"] == data

    def test_none_metadata_raises(self):
        with pytest.raises(TypeError, match="metadata argument is required"):
            tag_provenance("data", None)

    def test_empty_dict_metadata_raises(self):
        with pytest.raises(TypeError, match="metadata argument is required"):
            tag_provenance("data", {})

    def test_string_metadata_raises(self):
        with pytest.raises(TypeError):
            tag_provenance("data", "not_a_dict")

    def test_invalid_metadata_raises_valueerror(self):
        with pytest.raises(ValueError, match="invalid tag"):
            tag_provenance("data", {"source_id": "x"})  # missing required fields


# ── validate_provenance ───────────────────────────────────────────────────


class TestValidateProvenance:
    def test_valid_tag(self, sample_provenance_tag):
        result = validate_provenance(sample_provenance_tag)
        assert result["valid"] is True
        assert result["errors"] == []

    def test_none_tag(self):
        result = validate_provenance(None)
        assert result["valid"] is False
        assert len(result["errors"]) > 0

    def test_empty_dict(self):
        result = validate_provenance({})
        assert result["valid"] is False
        # Empty dict triggers "non-null dict" guard (Python: not {} is True)
        assert len(result["errors"]) >= 1

    def test_missing_source_id(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        del tag["source_id"]
        result = validate_provenance(tag)
        assert result["valid"] is False
        assert any("source_id" in e for e in result["errors"])

    def test_invalid_source_type(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["source_type"] = "invalid_type"
        result = validate_provenance(tag)
        assert result["valid"] is False
        assert any("source_type" in e for e in result["errors"])

    def test_invalid_authority_tier_too_high(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["authority_tier"] = 99
        result = validate_provenance(tag)
        assert result["valid"] is False
        assert any("authority_tier" in e for e in result["errors"])

    def test_invalid_authority_tier_zero(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["authority_tier"] = 0
        result = validate_provenance(tag)
        assert result["valid"] is False

    def test_invalid_trust_class(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["trust_class"] = "MAYBE"
        result = validate_provenance(tag)
        assert result["valid"] is False

    def test_invalid_data_classification(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["data_classification"] = "TOP_SECRET"
        result = validate_provenance(tag)
        assert result["valid"] is False

    def test_invalid_fetched_at_format(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["fetched_at"] = "not-a-datetime"
        result = validate_provenance(tag)
        assert result["valid"] is False

    def test_negative_ttl(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["ttl_seconds"] = -100
        result = validate_provenance(tag)
        assert result["valid"] is False

    def test_valid_with_optional_fields(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["version"] = "2.1.0"
        tag["effective_date"] = "2026-01-01"
        tag["owner"] = "NPA Team"
        tag["jurisdiction"] = "SG"
        tag["doc_section"] = "Section 4.2"
        tag["chunk_hash"] = "abc123"
        result = validate_provenance(tag)
        assert result["valid"] is True

    def test_invalid_optional_field_detected(self, sample_provenance_tag):
        tag = dict(sample_provenance_tag)
        tag["version"] = 42  # Should be string
        result = validate_provenance(tag)
        assert result["valid"] is False
        assert any("version" in e for e in result["errors"])


# ── is_expired ────────────────────────────────────────────────────────────


class TestIsExpired:
    def test_fresh_data_not_expired(self):
        now = datetime.now(timezone.utc)
        tag = {
            "fetched_at": now.isoformat(),
            "ttl_seconds": 3600,
        }
        assert is_expired(tag, now=now) is False

    def test_stale_data_expired(self):
        past = datetime.now(timezone.utc) - timedelta(hours=2)
        tag = {
            "fetched_at": past.isoformat(),
            "ttl_seconds": 3600,  # 1 hour TTL
        }
        assert is_expired(tag) is True

    def test_exact_boundary(self):
        """Data at exactly TTL boundary should be expired (elapsed > ttl)."""
        now = datetime.now(timezone.utc)
        past = now - timedelta(seconds=3601)
        tag = {
            "fetched_at": past.isoformat(),
            "ttl_seconds": 3600,
        }
        assert is_expired(tag, now=now) is True

    def test_just_before_expiry(self):
        now = datetime.now(timezone.utc)
        past = now - timedelta(seconds=3599)
        tag = {
            "fetched_at": past.isoformat(),
            "ttl_seconds": 3600,
        }
        assert is_expired(tag, now=now) is False

    def test_none_tag_expired(self):
        assert is_expired(None) is True

    def test_missing_fetched_at_expired(self):
        assert is_expired({"ttl_seconds": 3600}) is True

    def test_missing_ttl_expired(self):
        assert is_expired({"fetched_at": datetime.now(timezone.utc).isoformat()}) is True

    def test_zero_ttl_not_expired_at_exact_moment(self):
        """TTL of 0 with elapsed=0: 0 > 0 is False, so not expired at exact fetch time."""
        now = datetime.now(timezone.utc)
        tag = {"fetched_at": now.isoformat(), "ttl_seconds": 0}
        assert is_expired(tag, now=now) is False  # 0 > 0 is False

    def test_z_suffix_datetime(self):
        """ISO 8601 with Z suffix should be parsed correctly."""
        now = datetime.now(timezone.utc)
        fetched = (now - timedelta(seconds=100)).strftime("%Y-%m-%dT%H:%M:%SZ")
        tag = {"fetched_at": fetched, "ttl_seconds": 3600}
        assert is_expired(tag, now=now) is False


# ── get_authority_tier ────────────────────────────────────────────────────


class TestGetAuthorityTier:
    def test_valid_tier(self, sample_provenance_tag):
        assert get_authority_tier(sample_provenance_tag) == 1

    def test_tier_5(self):
        assert get_authority_tier({"authority_tier": 5}) == 5

    def test_invalid_tier_zero(self):
        assert get_authority_tier({"authority_tier": 0}) == -1

    def test_invalid_tier_too_high(self):
        assert get_authority_tier({"authority_tier": 6}) == -1

    def test_none_tag(self):
        assert get_authority_tier(None) == -1

    def test_missing_field(self):
        assert get_authority_tier({"source_id": "x"}) == -1

    def test_string_tier(self):
        assert get_authority_tier({"authority_tier": "1"}) == -1  # Must be int


# ── strip_provenance ─────────────────────────────────────────────────────


class TestStripProvenance:
    def test_strip_tagged_data(self, sample_provenance_tag):
        tagged = tag_provenance("hello", sample_provenance_tag)
        raw = strip_provenance(tagged)
        assert raw == "hello"

    def test_strip_dict_data(self, sample_provenance_tag):
        tagged = tag_provenance({"key": "val"}, sample_provenance_tag)
        raw = strip_provenance(tagged)
        assert raw == {"key": "val"}

    def test_strip_inline_provenance(self):
        """Strip _provenance from a dict that has it inline."""
        obj = {"name": "doc", "content": "text", "_provenance": {"source_id": "S1"}}
        raw = strip_provenance(obj)
        assert raw == {"name": "doc", "content": "text"}
        assert "_provenance" not in raw

    def test_strip_none(self):
        assert strip_provenance(None) is None

    def test_strip_string(self):
        assert strip_provenance("hello") == "hello"

    def test_strip_no_provenance(self):
        data = {"key": "val"}
        assert strip_provenance(data) == data


# ── create_provenance_tag ─────────────────────────────────────────────────


class TestCreateProvenanceTag:
    def test_creates_valid_tag(self):
        tag = create_provenance_tag({
            "source_id": "SoR:test:1",
            "source_type": "system_of_record",
            "authority_tier": 1,
            "trust_class": "TRUSTED",
            "data_classification": "INTERNAL",
        })
        assert tag["source_id"] == "SoR:test:1"
        assert tag["source_type"] == "system_of_record"
        assert tag["authority_tier"] == 1
        assert "fetched_at" in tag  # Auto-generated
        assert tag["ttl_seconds"] == 3600  # Default

    def test_custom_ttl(self):
        tag = create_provenance_tag({
            "source_id": "SoR:test:2",
            "source_type": "bank_sop",
            "authority_tier": 2,
            "trust_class": "TRUSTED",
            "data_classification": "CONFIDENTIAL",
            "ttl_seconds": 7200,
        })
        assert tag["ttl_seconds"] == 7200

    def test_with_optional_fields(self):
        tag = create_provenance_tag({
            "source_id": "SoR:test:3",
            "source_type": "system_of_record",
            "authority_tier": 1,
            "trust_class": "TRUSTED",
            "data_classification": "INTERNAL",
            "version": "3.0",
            "owner": "COO Office",
            "jurisdiction": "SG",
            "doc_section": "4.2.1",
        })
        assert tag["version"] == "3.0"
        assert tag["owner"] == "COO Office"
        assert tag["jurisdiction"] == "SG"
        assert tag["doc_section"] == "4.2.1"

    def test_missing_required_raises(self):
        with pytest.raises(ValueError, match="invalid tag"):
            create_provenance_tag({"source_id": "x"})

    def test_none_raises_typeerror(self):
        with pytest.raises(TypeError, match="fields argument is required"):
            create_provenance_tag(None)

    def test_empty_dict_raises_typeerror(self):
        with pytest.raises(TypeError, match="fields argument is required"):
            create_provenance_tag({})

    def test_custom_fetched_at(self):
        tag = create_provenance_tag({
            "source_id": "SoR:test:4",
            "source_type": "system_of_record",
            "authority_tier": 1,
            "fetched_at": "2026-01-15T10:00:00+00:00",
            "trust_class": "TRUSTED",
            "data_classification": "PUBLIC",
        })
        assert tag["fetched_at"] == "2026-01-15T10:00:00+00:00"


# ── merge_provenance ──────────────────────────────────────────────────────


class TestMergeProvenance:
    def test_merge_takes_lower_authority(self):
        tag_a = {"source_id": "A", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        tag_b = {"source_id": "B", "authority_tier": 3, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 1800}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["authority_tier"] == 3  # Lower authority = higher number

    def test_merge_takes_more_restrictive_classification(self):
        tag_a = {"source_id": "A", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "PUBLIC", "ttl_seconds": 3600}
        tag_b = {"source_id": "B", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "CONFIDENTIAL", "ttl_seconds": 3600}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["data_classification"] == "CONFIDENTIAL"

    def test_merge_untrusted_wins(self):
        tag_a = {"source_id": "A", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        tag_b = {"source_id": "B", "authority_tier": 1, "trust_class": "UNTRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["trust_class"] == "UNTRUSTED"

    def test_merge_takes_shorter_ttl(self):
        tag_a = {"source_id": "A", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 7200}
        tag_b = {"source_id": "B", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 1800}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["ttl_seconds"] == 1800

    def test_merged_source_type_is_agent_output(self):
        tag_a = {"source_id": "A", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        tag_b = {"source_id": "B", "authority_tier": 2, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["source_type"] == "agent_output"

    def test_merged_source_id_format(self):
        tag_a = {"source_id": "X", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        tag_b = {"source_id": "Y", "authority_tier": 1, "trust_class": "TRUSTED",
                 "data_classification": "INTERNAL", "ttl_seconds": 3600}
        merged = merge_provenance(tag_a, tag_b)
        assert merged["source_id"] == "merged:X+Y"

    def test_none_a_returns_b(self):
        tag_b = {"source_id": "B"}
        assert merge_provenance(None, tag_b) == tag_b

    def test_none_b_returns_a(self):
        tag_a = {"source_id": "A"}
        assert merge_provenance(tag_a, None) == tag_a

    def test_both_none(self):
        assert merge_provenance(None, None) == {}


# ── get_required_fields ───────────────────────────────────────────────────


class TestGetRequiredFields:
    def test_returns_7_fields(self):
        fields = get_required_fields()
        assert len(fields) == 7

    def test_expected_fields(self):
        fields = get_required_fields()
        expected = [
            "source_id", "source_type", "authority_tier",
            "fetched_at", "ttl_seconds", "trust_class", "data_classification",
        ]
        for f in expected:
            assert f in fields, f"Missing required field: {f}"


# ── compute_chunk_hash ────────────────────────────────────────────────────


class TestComputeChunkHash:
    def test_string_hash(self):
        h = compute_chunk_hash("hello world")
        raw = hashlib.sha256("hello world".encode("utf-8")).hexdigest()
        assert h == f"sha256:{raw}"

    def test_dict_hash(self):
        data = {"key": "value"}
        h = compute_chunk_hash(data)
        raw = hashlib.sha256(json.dumps(data, default=str).encode("utf-8")).hexdigest()
        assert h == f"sha256:{raw}"

    def test_deterministic(self):
        assert compute_chunk_hash("test") == compute_chunk_hash("test")

    def test_different_content_different_hash(self):
        assert compute_chunk_hash("a") != compute_chunk_hash("b")

    def test_returns_prefixed_hex_string(self):
        h = compute_chunk_hash("anything")
        assert h.startswith("sha256:")
        hex_part = h[len("sha256:"):]
        assert len(hex_part) == 64  # SHA-256 hex = 64 chars
        assert all(c in "0123456789abcdef" for c in hex_part)


# ── reset_cache ───────────────────────────────────────────────────────────


class TestResetCache:
    def test_reset_and_reload(self):
        # First call loads schema
        get_required_fields()
        # Reset
        reset_cache()
        # Should reload fine
        fields = get_required_fields()
        assert len(fields) == 7
