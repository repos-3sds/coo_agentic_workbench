# 2-Stage RAG Pipeline Design — S5-009

**Version:** 1.0.0
**Status:** Implemented
**Module:** `packages/context-engine/context_engine/rag.py`

## Architecture

```
Query → [Stage 1: Broad Retrieval] → [Dedup] → [Stage 2: Rerank + Filter] → Chunks[]
              ↑                                         ↑
         Dify KB / Adapter                    Source Priority Boost
```

## Stage 1 — Broad Retrieval

- **Method:** BM25 + vector search (delegated to adapter)
- **Top K:** 40 (configurable via `stage1_top_k`)
- **Sources:** All domain-registered knowledge bases
- **Adapter Pattern:** `adapter(query, domain, top_k) -> chunks[]`

The pipeline uses Dependency Inversion — actual KB search is handled by an adapter function injected at call time. In production this calls Dify's Knowledge Base search API. For testing, mock adapters return synthetic chunks.

## Stage 2 — Reranking

- **Top K:** 8 (configurable via `stage2_top_k`)
- **Min Relevance:** 0.15 (configurable)
- **Scoring Formula:** `final_score = relevance * 0.6 + authority_boost * 0.4`

### Authority Boost

Chunks from higher-authority sources get scoring boosts:

| Tier | Source Type        | Boost |
|------|--------------------|-------|
| 1    | System of Record   | +0.40 |
| 2    | Bank SOP           | +0.30 |
| 3    | Industry Standard  | +0.20 |
| 4    | External Official  | +0.10 |
| 5    | General Web        | +0.00 |

This ensures T1 corpora (SoR) are ranked above T3 (industry standards) when relevance scores are similar.

## Deduplication

- Hash-based dedup using first 200 characters of content
- Removes near-duplicate chunks before reranking
- Configurable threshold (default 0.85)

## Chunking Strategies

| Doc Type            | Method          | Chunk Size | Overlap | Metadata Fields                |
|---------------------|-----------------|-----------|---------|-------------------------------|
| `sop_document`      | section_aware   | 512       | 64      | section_number, version, date |
| `regulatory_notice` | section_aware   | 384       | 48      | jurisdiction, regulator, id   |
| `template_document` | fixed_size      | 512       | 64      | template_id, version          |
| `entity_record`     | field_level     | 256       | 0       | entity_id, fetched_at         |
| `default`           | fixed_size      | 512       | 64      | (none)                        |

## Provenance Tags

Every chunk returned by the pipeline has a `_provenance` tag:

```json
{
  "source_id": "bank_sops",
  "source_type": "bank_sop",
  "authority_tier": 2,
  "trust_class": "TRUSTED",
  "fetched_at": "2026-03-02T10:00:00Z",
  "ttl_seconds": 3600,
  "extra": {
    "chunk_id": "chunk_042",
    "rag_score": 0.82
  }
}
```

## Integration with Dify KBs

The `adapter` function wraps Dify's `/datasets/{id}/document/search` API:

```python
def dify_kb_adapter(query, domain, top_k):
    # Map domain → Dify dataset IDs
    # Call Dify search API
    # Transform results to chunk format
    return chunks
```

## API

```python
from context_engine.rag import create_rag_pipeline, retrieve, rerank

# Factory
pipeline = create_rag_pipeline({"stage2_top_k": 10})
chunks = pipeline["retrieve"]("NPA classification criteria", domain="NPA")

# Direct call
chunks = retrieve("risk assessment framework", domain="NPA", options={
    "adapter": my_dify_adapter,
    "stage1_top_k": 50,
    "stage2_top_k": 10,
})

# Standalone rerank (when Stage 1 is handled externally)
reranked = rerank("query", pre_fetched_chunks, top_k=8)
```

## Configuration

Stored in `config/rag-pipeline.json` (optional — defaults built in):

```json
{
  "stage1_top_k": 40,
  "stage2_top_k": 8,
  "min_relevance_score": 0.15,
  "max_chunk_tokens": 512,
  "dedup_threshold": 0.85,
  "reranking_enabled": true
}
```
