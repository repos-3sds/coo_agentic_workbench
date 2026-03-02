"""
RAG Pipeline Tests (Sprint 5 — S5-009)

Tests for retrieve, rerank, create_rag_pipeline, get_chunking_strategy,
and get_rag_config.

Status: IMPLEMENTED
"""

from __future__ import annotations

import pytest

from context_engine.rag import (
    create_rag_pipeline,
    retrieve,
    rerank,
    get_chunking_strategy,
    get_rag_config,
)


# ── Mock Adapter ─────────────────────────────────────────────────────────────

def mock_adapter(query, domain, top_k):
    """Returns synthetic chunks for testing."""
    chunks = [
        {
            "chunk_id": "chunk_001",
            "content": "NPA classification criteria require scoring across complexity, financial impact, and regulatory domains.",
            "source_id": "bank_sops",
            "source_type": "bank_sop",
            "authority_tier": 2,
            "domain": domain,
        },
        {
            "chunk_id": "chunk_002",
            "content": "MAS Notice 637 requires stress testing for all derivative products.",
            "source_id": "industry_standards",
            "source_type": "industry_standard",
            "authority_tier": 3,
            "domain": domain,
        },
        {
            "chunk_id": "chunk_003",
            "content": "Risk assessment framework for operational and market risk evaluation.",
            "source_id": "bank_sops",
            "source_type": "bank_sop",
            "authority_tier": 2,
            "domain": domain,
        },
        {
            "chunk_id": "chunk_004",
            "content": "General web article about banking trends and fintech innovations.",
            "source_id": "general_web",
            "source_type": "general_web",
            "authority_tier": 5,
            "domain": domain,
        },
        {
            "chunk_id": "chunk_005",
            "content": "NPA project data from system of record showing current status.",
            "source_id": "npa_project_api",
            "source_type": "system_of_record",
            "authority_tier": 1,
            "domain": domain,
        },
    ]
    return chunks[:top_k]


# ── get_rag_config ───────────────────────────────────────────────────────────


class TestGetRagConfig:
    """Tests for loading RAG config."""

    def test_returns_dict(self):
        """Config returns a dict."""
        config = get_rag_config()
        assert isinstance(config, dict)

    def test_has_stage_top_k(self):
        """Config has stage1 and stage2 top_k."""
        config = get_rag_config()
        assert "stage1_top_k" in config
        assert "stage2_top_k" in config
        assert config["stage1_top_k"] == 40
        assert config["stage2_top_k"] == 8

    def test_has_chunking_strategies(self):
        """Config has chunking strategies."""
        config = get_rag_config()
        assert "chunking_strategies" in config
        strategies = config["chunking_strategies"]
        assert "sop_document" in strategies
        assert "regulatory_notice" in strategies
        assert "default" in strategies


# ── get_chunking_strategy ────────────────────────────────────────────────────


class TestGetChunkingStrategy:
    """Tests for chunking strategy lookup."""

    def test_sop_document_section_aware(self):
        """SOP documents use section_aware chunking."""
        strategy = get_chunking_strategy("sop_document")
        assert strategy["method"] == "section_aware"
        assert strategy["chunk_size"] == 512

    def test_regulatory_notice(self):
        """Regulatory notices use section_aware with smaller chunks."""
        strategy = get_chunking_strategy("regulatory_notice")
        assert strategy["method"] == "section_aware"
        assert strategy["chunk_size"] == 384

    def test_entity_record_field_level(self):
        """Entity records use field_level chunking."""
        strategy = get_chunking_strategy("entity_record")
        assert strategy["method"] == "field_level"
        assert strategy["overlap"] == 0

    def test_unknown_type_returns_default(self):
        """Unknown doc type returns default strategy."""
        strategy = get_chunking_strategy("unknown_type_xyz")
        assert strategy["method"] == "fixed_size"


# ── retrieve ─────────────────────────────────────────────────────────────────


class TestRetrieve:
    """Tests for the main retrieve function."""

    def test_no_adapter_returns_empty(self):
        """Without adapter, retrieve returns empty list."""
        chunks = retrieve("test query", domain="NPA")
        assert chunks == []

    def test_with_adapter_returns_chunks(self):
        """With adapter, retrieve returns chunks."""
        chunks = retrieve("NPA classification", domain="NPA", options={
            "adapter": mock_adapter,
        })
        assert len(chunks) > 0

    def test_chunks_have_provenance(self):
        """Every returned chunk has a _provenance tag."""
        chunks = retrieve("classification criteria", domain="NPA", options={
            "adapter": mock_adapter,
        })
        for chunk in chunks:
            assert "_provenance" in chunk
            assert "source_id" in chunk["_provenance"]

    def test_higher_tier_sources_ranked_first(self):
        """T1/T2 sources appear before T4/T5 in results."""
        chunks = retrieve("NPA project data classification", domain="NPA", options={
            "adapter": mock_adapter,
            "stage2_top_k": 5,
        })
        if len(chunks) >= 2:
            # Verify global sort monotonicity — every consecutive pair
            tiers = [c.get("authority_tier", 5) for c in chunks]
            for i in range(len(tiers) - 1):
                assert tiers[i] <= tiers[i + 1], (
                    f"Sort violation at index {i}: tier {tiers[i]} > tier {tiers[i + 1]}"
                )

    def test_custom_top_k(self):
        """Custom stage2_top_k limits results."""
        chunks = retrieve("test", domain="NPA", options={
            "adapter": mock_adapter,
            "stage2_top_k": 2,
        })
        assert len(chunks) <= 2

    def test_chunks_have_rag_score(self):
        """Reranked chunks include _rag_score."""
        chunks = retrieve("classification", domain="NPA", options={
            "adapter": mock_adapter,
        })
        for chunk in chunks:
            assert "_rag_score" in chunk

    def test_dedup_removes_duplicates(self):
        """Duplicate chunks are deduplicated."""
        def dup_adapter(query, domain, top_k):
            chunk = {
                "chunk_id": "chunk_001",
                "content": "NPA classification criteria and scoring rules.",
                "source_id": "bank_sops",
                "source_type": "bank_sop",
                "authority_tier": 2,
                "relevance_score": 0.9,
            }
            return [chunk.copy() for _ in range(5)]

        chunks = retrieve("NPA classification", domain="NPA", options={
            "adapter": dup_adapter,
        })
        # After dedup, should have only 1 unique chunk
        assert len(chunks) == 1


# ── rerank ───────────────────────────────────────────────────────────────────


class TestRerank:
    """Tests for standalone reranking."""

    def test_reranks_by_score(self):
        """Reranking orders by combined score descending."""
        chunks = [
            {"content": "Less relevant text", "source_type": "general_web", "authority_tier": 5, "domain": "NPA"},
            {"content": "NPA classification scoring criteria", "source_type": "bank_sop", "authority_tier": 2, "domain": "NPA"},
        ]
        result = rerank("NPA classification", chunks, top_k=2)
        assert len(result) >= 1
        # Bank SOP should score higher than general web for NPA query
        if len(result) >= 2:
            assert result[0].get("_rag_score", 0) >= result[1].get("_rag_score", 0)

    def test_respects_top_k(self):
        """Rerank limits to top_k."""
        chunks = [
            {"content": f"Chunk {i}", "source_type": "bank_sop", "authority_tier": 2, "domain": "NPA"}
            for i in range(10)
        ]
        result = rerank("test", chunks, top_k=3)
        assert len(result) <= 3

    def test_empty_input_returns_empty(self):
        """Empty chunks returns empty."""
        assert rerank("test", [], top_k=8) == []


# ── create_rag_pipeline ──────────────────────────────────────────────────────


class TestCreateRagPipeline:
    """Tests for the factory function."""

    def test_returns_dict_with_functions(self):
        """Factory returns dict with expected keys."""
        pipeline = create_rag_pipeline()
        assert "retrieve" in pipeline
        assert "rerank" in pipeline
        assert "get_config" in pipeline
        assert "get_chunking_strategy" in pipeline
        assert callable(pipeline["retrieve"])
        assert callable(pipeline["rerank"])

    def test_config_override(self):
        """Factory accepts config overrides."""
        pipeline = create_rag_pipeline({"stage2_top_k": 12})
        config = pipeline["get_config"]()
        assert config["stage2_top_k"] == 12

    def test_pipeline_retrieve_works(self):
        """Pipeline's retrieve function works with adapter."""
        pipeline = create_rag_pipeline()
        chunks = pipeline["retrieve"]("classification", domain="NPA", options={
            "adapter": mock_adapter,
        })
        assert len(chunks) > 0
