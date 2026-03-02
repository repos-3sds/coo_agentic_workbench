"""
RAG Pipeline Module (Sprint 5 — S5-009)

2-stage Retrieval-Augmented Generation pipeline:
    Stage 1: Broad retrieval (BM25 + vector, top_k=40)
    Stage 2: Reranking + contextual filtering (top_k=8)

Integrates with Dify Knowledge Bases and the source priority hierarchy.
Provenance tags are attached to every chunk returned.

Blueprint Section 6 — RAG Pipeline Architecture.

Exports:
    create_rag_pipeline(config) -> pipeline dict
    retrieve(query, domain, options) -> chunks[]
    rerank(query, chunks, top_k) -> reranked chunks[]
    get_chunking_strategy(doc_type) -> dict
    get_rag_config() -> dict
"""

from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any, Callable

from context_engine.provenance import create_provenance_tag

# ── Config ───────────────────────────────────────────────────────────────────

_CONFIG_DIR = Path(__file__).resolve().parent.parent / "config"
_DOMAINS_DIR = Path(__file__).resolve().parent.parent / "domains"

# Default pipeline settings
_DEFAULT_CONFIG: dict = {
    "stage1_top_k": 40,
    "stage2_top_k": 8,
    "min_relevance_score": 0.15,
    "max_chunk_tokens": 512,
    "dedup_threshold": 0.85,
    "reranking_enabled": True,
    "chunking_strategies": {
        "sop_document": {
            "method": "section_aware",
            "chunk_size": 512,
            "overlap": 64,
            "metadata_fields": ["section_number", "version", "effective_date"],
        },
        "regulatory_notice": {
            "method": "section_aware",
            "chunk_size": 384,
            "overlap": 48,
            "metadata_fields": ["jurisdiction", "regulator", "notice_id", "effective_date"],
        },
        "template_document": {
            "method": "fixed_size",
            "chunk_size": 512,
            "overlap": 64,
            "metadata_fields": ["template_id", "version"],
        },
        "entity_record": {
            "method": "field_level",
            "chunk_size": 256,
            "overlap": 0,
            "metadata_fields": ["entity_id", "fetched_at"],
        },
        "default": {
            "method": "fixed_size",
            "chunk_size": 512,
            "overlap": 64,
            "metadata_fields": [],
        },
    },
}

_rag_config: dict | None = None


def get_rag_config() -> dict:
    """Load RAG pipeline configuration (cached after first load)."""
    global _rag_config
    if _rag_config is not None:
        return _rag_config

    # Try loading from config file, fallback to defaults
    config_path = _CONFIG_DIR / "rag-pipeline.json"
    if config_path.exists():
        _rag_config = json.loads(config_path.read_text())
    else:
        _rag_config = _DEFAULT_CONFIG.copy()

    return _rag_config


def get_chunking_strategy(doc_type: str) -> dict:
    """Get chunking strategy for a document type."""
    config = get_rag_config()
    strategies = config.get("chunking_strategies", _DEFAULT_CONFIG["chunking_strategies"])
    return strategies.get(doc_type, strategies.get("default", {}))


# ── Domain Source Loading ────────────────────────────────────────────────────

def _load_domain_sources(domain: str) -> list[dict]:
    """Load context sources for a domain from its config."""
    domain_path = _DOMAINS_DIR / f"{domain.lower()}.json"
    if not domain_path.exists():
        return []
    try:
        config = json.loads(domain_path.read_text())
        return config.get("context_sources", [])
    except (json.JSONDecodeError, KeyError):
        return []


# ── Stage 1: Broad Retrieval ────────────────────────────────────────────────

def _compute_text_relevance(query: str, text: str) -> float:
    """
    Simple BM25-inspired keyword relevance scoring.
    In production this would use vector similarity from an embedding model.
    """
    if not query or not text:
        return 0.0

    query_terms = set(query.lower().split())
    text_lower = text.lower()

    if not query_terms:
        return 0.0

    matched = sum(1 for term in query_terms if term in text_lower)
    return matched / len(query_terms)


def _dedup_chunks(chunks: list[dict], threshold: float = 0.85) -> list[dict]:
    """Remove near-duplicate chunks based on content hash similarity."""
    seen_hashes: set[str] = set()
    unique: list[dict] = []

    for chunk in chunks:
        content = chunk.get("content", "")
        # Simple hash-based dedup (first 200 chars to catch near-dupes)
        key = hashlib.md5(content[:200].encode()).hexdigest()
        if key not in seen_hashes:
            seen_hashes.add(key)
            unique.append(chunk)

    return unique


def _stage1_retrieve(
    query: str,
    domain: str,
    top_k: int,
    adapter: Callable | None = None,
) -> list[dict]:
    """
    Stage 1: Broad retrieval across domain knowledge bases.

    If an adapter function is provided, delegates to it (e.g. Dify KB search).
    Otherwise returns an empty list (no local data to search).
    """
    if adapter is not None:
        try:
            raw_chunks = adapter(query, domain, top_k)
            if isinstance(raw_chunks, list):
                return raw_chunks
        except Exception as e:
            # Adapter failures are non-fatal — return empty
            return []

    return []


# ── Stage 2: Reranking ──────────────────────────────────────────────────────

def _apply_source_priority_boost(chunk: dict, domain_sources: list[dict]) -> float:
    """Boost relevance score based on source authority tier."""
    source_id = chunk.get("source_id", "")
    source_type = chunk.get("source_type", "")

    # Find matching domain source
    for src in domain_sources:
        if src.get("source_id") == source_id or src.get("source_type") == source_type:
            tier = src.get("authority_tier", 5)
            # T1 gets +0.4 boost, T2 gets +0.3, etc.
            return max(0, (5 - tier) * 0.1)

    return 0.0


def _stage2_rerank(
    query: str,
    chunks: list[dict],
    top_k: int,
    domain_sources: list[dict],
    min_relevance: float = 0.15,
) -> list[dict]:
    """
    Stage 2: Rerank chunks by combined relevance + authority score.

    Scoring formula: final_score = relevance * 0.6 + authority_boost * 0.4

    Filters out chunks below min_relevance threshold.
    Returns top_k chunks with provenance tags.
    """
    scored: list[tuple[float, dict]] = []

    for chunk in chunks:
        content = chunk.get("content", "")
        relevance = chunk.get("relevance_score", _compute_text_relevance(query, content))
        authority_boost = _apply_source_priority_boost(chunk, domain_sources)
        final_score = relevance * 0.6 + authority_boost * 0.4

        if final_score >= min_relevance or relevance >= min_relevance:
            chunk["_rag_score"] = round(final_score, 4)
            chunk["_relevance_score"] = round(relevance, 4)
            chunk["_authority_boost"] = round(authority_boost, 4)
            scored.append((final_score, chunk))

    # Sort by final score descending
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


# ── Provenance Tagging ──────────────────────────────────────────────────────

def _derive_trust_class(tier: int) -> str:
    """Derive trust_class from authority tier (T1-T4 = TRUSTED, T5 = UNTRUSTED)."""
    return "TRUSTED" if tier <= 4 else "UNTRUSTED"


def _tag_chunk_provenance(chunk: dict) -> dict:
    """Attach provenance tag to a chunk."""
    tier = chunk.get("authority_tier", 5)
    prov = create_provenance_tag({
        "source_id": chunk.get("source_id", "unknown"),
        "source_type": chunk.get("source_type", "unknown"),
        "authority_tier": tier,
        "trust_class": chunk.get("trust_class", _derive_trust_class(tier)),
        "data_classification": chunk.get("data_classification", "INTERNAL"),
    })

    chunk["_provenance"] = prov
    return chunk


# ── Public API ───────────────────────────────────────────────────────────────

def retrieve(
    query: str,
    domain: str = "NPA",
    options: dict | None = None,
) -> list[dict]:
    """
    Execute the full 2-stage RAG pipeline.

    Stage 1: Broad retrieval (top_k=40 by default).
    Stage 2: Rerank + filter (top_k=8 by default).

    Args:
        query: The search query.
        domain: Domain ID for scoping (NPA, DESK, ORM, etc.).
        options: Optional overrides:
            - stage1_top_k: int (default 40)
            - stage2_top_k: int (default 8)
            - adapter: Callable for external KB retrieval
            - min_relevance: float (default 0.15)

    Returns:
        List of chunk dicts with provenance tags.
    """
    opts = options or {}
    config = get_rag_config()

    stage1_top_k = opts.get("stage1_top_k", config.get("stage1_top_k", 40))
    stage2_top_k = opts.get("stage2_top_k", config.get("stage2_top_k", 8))
    min_relevance = opts.get("min_relevance", config.get("min_relevance_score", 0.15))
    adapter = opts.get("adapter", None)

    # Load domain sources for authority boosting
    domain_sources = _load_domain_sources(domain)

    # Stage 1: Broad retrieval
    raw_chunks = _stage1_retrieve(query, domain, stage1_top_k, adapter)

    # Deduplicate
    dedup_threshold = config.get("dedup_threshold", 0.85)
    unique_chunks = _dedup_chunks(raw_chunks, dedup_threshold)

    # Stage 2: Rerank
    if config.get("reranking_enabled", True):
        final_chunks = _stage2_rerank(
            query, unique_chunks, stage2_top_k, domain_sources, min_relevance
        )
    else:
        final_chunks = unique_chunks[:stage2_top_k]

    # Tag provenance on every returned chunk
    for chunk in final_chunks:
        _tag_chunk_provenance(chunk)

    return final_chunks


def rerank(
    query: str,
    chunks: list[dict],
    top_k: int = 8,
) -> list[dict]:
    """
    Standalone reranking function.

    Reranks pre-retrieved chunks by relevance + authority.
    Useful when Stage 1 is handled externally (e.g. by Dify).

    Args:
        query: The search query.
        chunks: Pre-retrieved chunks.
        top_k: Number of top chunks to return.

    Returns:
        Reranked list of chunk dicts.
    """
    config = get_rag_config()
    min_relevance = config.get("min_relevance_score", 0.15)

    # Try to infer domain from chunks
    domain_sources: list[dict] = []
    if chunks:
        domain = chunks[0].get("domain", "NPA")
        domain_sources = _load_domain_sources(domain)

    return _stage2_rerank(query, chunks, top_k, domain_sources, min_relevance)


def create_rag_pipeline(config: dict | None = None) -> dict:
    """
    Factory: create a configured RAG pipeline instance.

    Returns a dict with bound functions for retrieval operations.

    Args:
        config: Optional overrides for pipeline settings.

    Returns:
        Dict with keys: retrieve, rerank, get_config, get_chunking_strategy.
    """
    if config:
        global _rag_config
        _rag_config = {**_DEFAULT_CONFIG, **config}

    return {
        "retrieve": retrieve,
        "rerank": rerank,
        "get_config": get_rag_config,
        "get_chunking_strategy": get_chunking_strategy,
    }
