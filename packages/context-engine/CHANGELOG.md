# Changelog — COO Context Engine

## [1.0.0] — 2026-03-02

First production release of the standalone Context Engine package.

### Architecture
- 7-stage pipeline: Classify → Scope → Retrieve → Rank → Budget → Assemble → Tag
- 14 Python modules, 1 external dependency (tiktoken for tokenization)
- Adapter pattern for Knowledge Base and Entity Data integration
- Domain-agnostic: NPA, ORM, DCE, Desk Support ready

### Modules (Sprint 1–5)

**Sprint 1 — Foundation**
- `trust.py` — 5-tier source hierarchy, data classification, RBAC, deny-by-default
- `contracts.py` — Archetype contracts (orchestrator / worker / reviewer)
- `provenance.py` — Provenance tag creation, validation, TTL expiry

**Sprint 2 — Core Pipeline**
- `token_counter.py` — tiktoken-based counting with fast estimation
- `scoper.py` — 6-dimension context filtering (domain, role, classification, jurisdiction, agent, hierarchy)
- `budget.py` — Token budget allocation, trimming, 3 budget profiles
- `assembler.py` — Core 7-stage pipeline orchestrator

**Sprint 3 — Memory & Delegation**
- `memory.py` — Session management, turn tracking, history compression, serialization
- `delegation.py` — Agent-to-agent context delegation, boundary enforcement

**Sprint 4 — Resilience & Observability**
- `tracer.py` — Request-level observability (per-stage timing, token counts)
- `circuit_breaker.py` — CLOSED → OPEN → HALF_OPEN with fallback
- `mcp_provenance.py` — MCP tool result wrapping with provenance tags

**Sprint 5 — Grounding & RAG**
- `grounding.py` — 8 claim patterns, 5-step verification, grounding score
- `rag.py` — 2-stage RAG pipeline (broad retrieval → rerank with authority boost)

### Server Integration (Sprint 4–5)
- `server/routes/context-admin.js` — 7 admin API routes (health, traces, sources, quality, contracts, budget)
- `server/services/context-bridge.js` — Node.js ↔ Python subprocess bridge
- `server/routes/dify-proxy.js` — Trace recording on context assembly

### Configuration
- Domain configs: `domains/npa.json`, `domains/desk.json`, `domains/orm.json`, `domains/demo.json`
- Archetype contracts: `config/contracts/orchestrator.json`, `worker.json`, `reviewer.json`
- Budget profiles: `config/budget-profiles.json`
- RAG pipeline: `config/rag-pipeline.json`

### Testing
- 397 tests total (unit + integration + regression + benchmarks)
- 33 regression tests across 11 categories (3 domains, delegation, failure modes, budget, trust, provenance, contracts, memory, grounding+RAG)
- 15 performance benchmarks with SLO validation

### Performance Baselines
- Assembly (worker, NPA, mock adapters): p50=0.16ms, p95=0.21ms, p99=0.27ms
- Token counting: ~3.7M tokens/sec
- Token estimation: ~12M calls/sec
- Circuit breaker overhead: ~2.1M calls/sec
- Grounding scorer: p95=0.03ms
- RAG rerank (40→8 chunks): p95=0.18ms
- Memory per assembly call: ~0.2 KB
- SLO target: p95 < 200ms — **PASS**

### Breaking Changes
- None (first release)
