# Context Engine — Claude Code Stories

**Agent:** Claude Code (Architect + Lead)
**Total Points:** 87 (45% of 195)
**Role:** Complex multi-file modules, architecture, integration, wiring, code review

> **Shared context:** Read `SPRINT-OVERVIEW.md` for epic map, dependency graph,
> sprint goals, execution order, and definitions of done.

---

## My Sprint Summary

| Sprint | Points | Stories | Focus |
|--------|--------|---------|-------|
| S1     | 11     | S1-001, S1-011, S1-013 | Scaffold + Trust engine + Contract loader |
| S2     | 18     | S2-001, S2-004, S2-008 | Provenance + Budget + CORE ASSEMBLER |
| S3     | 16     | S3-001, S3-002, S3-009, S3-010 | Memory + E2E test + Public API |
| S4     | 15     | S4-001, S4-002, S4-008 | Bridge + Wire dify-proxy + Integration test |
| S5     | 16     | S5-001, S5-002, S5-009, S5-010 | Admin API + Grounding + RAG design |
| S6     | 11     | S6-007, S6-008, S6-009 | Regression + Benchmarks + Merge PR |

---

## SPRINT 1 — Foundation (Week 1)

### S1-001: Project Scaffold
```
+-----------------------------------------------------------------------+
| ID       : S1-001                                                      |
| Title    : Create standalone package scaffold                          |
| Epic     : E1 (Scaffold)                                              |
| Points   : 3                                                          |
| Priority : P0 — MUST be done first (all other stories depend on this) |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Create the packages/context-engine/ directory with pyproject.toml,     |
|   directory structure, and empty module stubs. This is the skeleton    |
|   that all other stories build into.                                   |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/pyproject.toml exists                      |
|       - name: "coo-context-engine"                                    |
|       - version: "0.1.0"                                               |
|       - packages: ["context_engine"]                                           |
|       - [tool.pytest.ini_options] configured                 |
|       - dependencies: ["tiktoken>=0.7.0"]                     |
|       - NO other dependencies                                          |
|   [ ] Directory structure created (empty files OK):                    |
|       context_engine/__init__.py                                                     |
|       context_engine/assembler.py                                                 |
|       context_engine/trust.py                                                     |
|       context_engine/budget.py                                                    |
|       context_engine/provenance.py                                                |
|       context_engine/contracts.py                                                 |
|       context_engine/scoper.py                                                    |
|       context_engine/tracer.py                                                    |
|       config/                                                          |
|       contracts/                                                       |
|       domains/                                                         |
|       tests/unit/                                                      |
|   [ ] `pip install -e .` succeeds in packages/context-engine/               |
|   [ ] `pytest` runs (even if 0 tests initially)                     |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/pyproject.toml                                 |
|   packages/context-engine/context_engine/*.py  (stubs)                            |
|   packages/context-engine/tests/    (empty dir)                        |
|                                                                        |
| Blocked By: Nothing                                                    |
| Blocks: ALL other S1 stories                                           |
+-----------------------------------------------------------------------+
```

### S1-011: Trust Engine Module
```
+-----------------------------------------------------------------------+
| ID       : S1-011                                                      |
| Title    : Build trust classifier + source ranker module               |
| Epic     : E2 (Trust)                                                  |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Implement the trust classification engine and source priority        |
|   ranker. This module loads the configs (S1-002, S1-003, S1-004)      |
|   and provides programmatic APIs. Ref: Blueprint 5.1-5.3              |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/trust.py exists with exports:                                |
|       - classifyTrust(sourceType) -> "TRUSTED" | "UNTRUSTED"          |
|       - classifyDataLevel(dataType) -> "PUBLIC"|"INTERNAL"|etc        |
|       - rankSources(sources[]) -> sorted by authority tier             |
|       - resolveConflict(sourceA, sourceB) -> winner + reason           |
|       - canUserAccess(userRole, dataClassification) -> boolean         |
|       - isNeverAllowed(sourceType) -> boolean                          |
|   [ ] Loads configs from config/ directory (not hardcoded)             |
|   [ ] Pure functions — no side effects, no DB, no network              |
|   [ ] All functions work with provenance-tagged objects                |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/trust.py                                 |
|                                                                        |
| Blocked By: S1-001, S1-002 (Codex), S1-003 (Codex), S1-004 (Gemini)  |
| Blocks: S1-012 (Codex: tests)                                         |
+-----------------------------------------------------------------------+
```

### S1-013: Contract Loader Module
```
+-----------------------------------------------------------------------+
| ID       : S1-013                                                      |
| Title    : Build contract loader + validator module                    |
| Epic     : E3 (Contracts)                                              |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that loads contract JSON files and validates context          |
|   packages against them. Ref: Blueprint 9.1-9.2                       |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/contracts.py exists with exports:                            |
|       - loadContract(archetype) -> parsed contract object              |
|       - validateContext(contextPackage, contract) -> {                  |
|           valid: boolean,                                              |
|           missing_required: string[],                                  |
|           unexpected_included: string[],                               |
|           warnings: string[]                                           |
|         }                                                              |
|       - getRequiredSources(contract) -> source specs[]                 |
|       - getBudgetProfile(contract) -> budget profile name             |
|   [ ] Validates required_context slots are present                     |
|   [ ] Warns if excluded_context slots are present                      |
|   [ ] Pure functions — loads from contracts/ directory                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/contracts.py                             |
|                                                                        |
| Blocked By: S1-001, S1-008 (Codex), S1-009 (Gemini), S1-010 (Gemini) |
| Blocks: S1-014 (Gemini: tests)                                        |
+-----------------------------------------------------------------------+
```

---

## SPRINT 2 — Core Pipeline (Week 2)

### S2-001: Provenance Tagger Module
```
+-----------------------------------------------------------------------+
| ID       : S2-001                                                      |
| Title    : Build provenance tagger module                              |
| Epic     : E4 (Provenance)                                            |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that tags data with provenance metadata, validates tags,      |
|   and checks freshness. Uses the provenance schema from S1-006.        |
|   Ref: Blueprint Section 11                                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/provenance.py exists with exports:                           |
|       - tagProvenance(data, metadata) -> tagged data object            |
|       - validateProvenance(tag) -> { valid, errors[] }                 |
|       - isExpired(tag) -> boolean (checks fetched_at + ttl_seconds)    |
|       - getAuthorityTier(tag) -> integer 1-5                           |
|       - stripProvenance(taggedData) -> raw data (for output)           |
|       - createProvenanceTag(fields) -> validated tag object            |
|   [ ] Loads provenance-schema.json for validation                      |
|   [ ] Enforces required fields from schema                             |
|   [ ] TTL-based expiry check uses current time                         |
|   [ ] Pure functions — no side effects                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/provenance.py                            |
|                                                                        |
| Blocked By: S1-006 (Gemini: provenance schema)                        |
| Blocks: S2-002 (Codex: tests), S2-008 (assembler)                     |
+-----------------------------------------------------------------------+
```

### S2-004: Budget Allocator Module
```
+-----------------------------------------------------------------------+
| ID       : S2-004                                                      |
| Title    : Build token budget allocator module                         |
| Epic     : E5 (Budget)                                                 |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that allocates token budget across context slots,             |
|   handles overflow with compression strategies.                        |
|   Uses budget-defaults.json from S1-007 and tiktoken.            |
|   Ref: Blueprint Section 7                                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/budget.py exists with exports:                               |
|       - allocateBudget(totalTokens, slotRequests[]) -> allocation{}    |
|       - countTokens(text) -> integer (uses tiktoken)              |
|       - handleOverflow(allocation, overflow) -> compressed allocation   |
|       - getBudgetForProfile(profileName) -> allocation template        |
|       - isWithinBudget(allocation) -> boolean                          |
|       - getOverflowReport(allocation) -> { over_by, strategy_used }   |
|   [ ] Loads budget-defaults.json for default allocations               |
|   [ ] Overflow strategy: compress lowest priority first                |
|   [ ] Never compresses items in never_compress[]                       |
|   [ ] Uses tiktoken for accurate token counting                  |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/budget.py                                |
|                                                                        |
| Blocked By: S1-007 (Codex: budget config), S2-003 (Gemini: counter)   |
| Blocks: S2-005 (Codex: tests), S2-008 (assembler)                     |
+-----------------------------------------------------------------------+
```

### S2-008: Core Assembler (7-Stage Pipeline)
```
+-----------------------------------------------------------------------+
| ID       : S2-008                                                      |
| Title    : Build core context assembly pipeline (7 stages)             |
| Epic     : E7 (Assembly)                                               |
| Points   : 8                                                          |
| Priority : P0 — CRITICAL PATH                                         |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   The heart of the context engine. Implements the 7-stage              |
|   assembly pipeline with adapter interface for external data.          |
|   Ref: Blueprint Section 4                                             |
|                                                                        |
|   Pipeline: Classify -> Scope -> Retrieve -> Rank -> Budget ->         |
|             Assemble -> Tag                                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/assembler.py exists with exports:                            |
|       - assembleContext(request, adapters) -> contextPackage            |
|         Request: { agent_id, archetype, domain, entity_ids,            |
|                    user_context, conversation_history }                 |
|         Adapters: { retrieve: fn, getEntityData: fn,                   |
|                     getKBChunks: fn }  (dependency injection)           |
|       - createAssembler(config) -> assembler instance                  |
|   [ ] 7-stage pipeline implemented:                                    |
|       Stage 1 (CLASSIFY): Load contract for archetype, classify trust  |
|       Stage 2 (SCOPE): Filter data by domain + entity + jurisdiction   |
|       Stage 3 (RETRIEVE): Call adapters to fetch data                  |
|       Stage 4 (RANK): Sort by source authority tier                    |
|       Stage 5 (BUDGET): Allocate tokens, handle overflow               |
|       Stage 6 (ASSEMBLE): Compose final context package                |
|       Stage 7 (TAG): Apply provenance tags to all data                 |
|   [ ] Adapter interface (Dependency Inversion):                        |
|       - Engine defines WHAT data it needs                              |
|       - Consuming app provides HOW via adapter functions               |
|       - Works with mock adapters for testing                           |
|   [ ] Returns structured contextPackage:                               |
|       { system_prompt_context, entity_data, knowledge_chunks,          |
|         cross_agent_context, few_shot_examples,                        |
|         conversation_history, tool_schemas,                            |
|         _metadata: { trace_id, stages[], budget_report,                |
|                      provenance_tags[] } }                             |
|   [ ] Each stage emits trace events for observability                  |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/assembler.py                             |
|                                                                        |
| Blocked By: S2-001, S2-004, S2-003 (Gemini), S2-006 (Gemini),        |
|             S1-011, S1-013                                             |
| Blocks: S2-009 (Gemini: tests), S2-010 (Codex: tests),               |
|         S3-001, S3-004, S3-006, S3-009                                |
+-----------------------------------------------------------------------+
```

---

## SPRINT 3 — Memory, Observability & Domain Config (Week 3)

### S3-001: Session State Machine Module
```
+-----------------------------------------------------------------------+
| ID       : S3-001                                                      |
| Title    : Build session state machine module                          |
| Epic     : E8 (Memory)                                                 |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module managing conversation state across turns.                     |
|   4-tier memory: working (current), session (conversation),            |
|   entity (project-scoped), domain (cross-session).                     |
|   Ref: Blueprint Section 8                                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/memory.py exists with exports:                               |
|       - createSession(sessionId, metadata) -> session object           |
|       - addTurn(session, turn) -> updated session                      |
|       - getRelevantHistory(session, maxTurns) -> turns[]               |
|       - getWorkingMemory(session) -> current turn context              |
|       - getEntityMemory(session, entityId) -> entity facts[]           |
|       - compressHistory(session, maxTokens) -> compressed session      |
|       - serializeSession(session) -> JSON string                       |
|       - deserializeSession(json) -> session object                     |
|   [ ] 4-tier memory model implemented:                                 |
|       - Working: current turn inputs + tool results                    |
|       - Session: conversation history (compressed)                     |
|       - Entity: accumulated facts about primary entity                 |
|       - Domain: cross-session domain knowledge cache                   |
|   [ ] History compression uses budget module                           |
|   [ ] Pure state management — no persistence layer                     |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/memory.py                                |
|                                                                        |
| Blocked By: S2-008 (assembler)                                         |
| Blocks: S3-002, S3-003 (Gemini: tests), S3-009                        |
+-----------------------------------------------------------------------+
```

### S3-002: Delegation Context Module
```
+-----------------------------------------------------------------------+
| ID       : S3-002                                                      |
| Title    : Build delegation context module                             |
| Epic     : E8 (Memory)                                                 |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Handles what context passes when agents delegate to each other.      |
|   Orchestrator -> Worker -> Reviewer delegation chain.                 |
|   Ref: Blueprint Section 8.3                                           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/delegation.py exists with exports:                           |
|       - createDelegationPackage(fromAgent, toAgent,                    |
|           contextPackage) -> delegationContext                          |
|       - extractDelegationResult(workerOutput) -> resultForOrch         |
|       - buildReviewerContext(workerOutput, provenance) -> reviewerCtx  |
|       - mergeDelegationResults(results[]) -> composedResponse          |
|   [ ] Respects contract boundaries:                                    |
|       - Workers don't get routing metadata                             |
|       - Reviewers get worker output + provenance only                  |
|       - Orchestrators get composed results                             |
|   [ ] Strips data that shouldn't cross agent boundaries                |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/delegation.py                            |
|                                                                        |
| Blocked By: S3-001                                                     |
| Blocks: S3-003 (Gemini: tests), S3-009                                |
+-----------------------------------------------------------------------+
```

### S3-009: End-to-End Pipeline Test (NPA Mock)
```
+-----------------------------------------------------------------------+
| ID       : S3-009                                                      |
| Title    : Write end-to-end pipeline test with NPA mock data           |
| Epic     : E7 (Assembly)                                               |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full pipeline test: request -> assemble -> validate -> trace.        |
|   Uses NPA domain config + mock adapters returning realistic data.     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/integration/test_pipeline_npa.py exists                    |
|   [ ] Tests complete flow:                                             |
|       1. Create mock adapters returning NPA-like data                  |
|       2. assemble context for NPA_ORCHESTRATOR archetype               |
|       3. Verify all 7 stages execute                                   |
|       4. Verify provenance tags on all data                            |
|       5. Verify budget within limits                                   |
|       6. Verify contract validation passes                             |
|       7. Verify trace contains all stage events                        |
|   [ ] Tests cover:                                                     |
|       - Orchestrator request                                           |
|       - Worker request                                                 |
|       - Reviewer request                                               |
|       - Cross-domain delegation                                        |
|   [ ] Minimum 10 integration tests                                     |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/integration/test_pipeline_npa.py       |
|                                                                        |
| Blocked By: S3-001, S3-002, S3-004 (Gemini), S3-006 (Codex), S3-007  |
| Blocks: S3-010                                                         |
+-----------------------------------------------------------------------+
```

### S3-010: Public API __init__.py Finalization
```
+-----------------------------------------------------------------------+
| ID       : S3-010                                                      |
| Title    : Finalize public API (__init__.py)                           |
| Epic     : E1 (Scaffold)                                              |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Wire all modules into the public API surface. This is the            |
|   single entry point consumers use.                                    |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/__init__.py re-exports:                                         |
|       - From trust.py: classifyTrust, rankSources, etc.               |
|       - From provenance.py: tagProvenance, validateProvenance, etc.    |
|       - From budget.py: allocateBudget, countTokens, etc.             |
|       - From contracts.py: loadContract, validateContext, etc.         |
|       - From assembler.py: assembleContext, createAssembler            |
|       - From scoper.py: scopeByDomain, etc.                           |
|       - From memory.py: createSession, addTurn, etc.                  |
|       - From delegation.py: createDelegationPackage, etc.             |
|       - From tracer.py: createTrace, etc.                              |
|   [ ] Convenience factory: createContextEngine(config) -> engine       |
|   [ ] Full test suite passes: pytest (ALL tests green)               |
|   [ ] No circular dependencies                                        |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/__init__.py (populated)                     |
|                                                                        |
| Blocked By: ALL S3 stories                                             |
| Blocks: S4-001                                                         |
+-----------------------------------------------------------------------+
```

---

## SPRINT 4 — Integration Bridge & Hardening (Week 4)

### S4-001: Context Bridge (Server Adapter)
```
+-----------------------------------------------------------------------+
| ID       : S4-001                                                      |
| Title    : Build context bridge (server adapter)                       |
| Epic     : E11 (Integration)                                          |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Thin bridge that adapts the context engine for the Express server.   |
|   Implements the adapter interface using actual MCP tools and DB.      |
|   This is where the standalone package meets the real app.             |
|   Ref: Blueprint Section 16.2                                          |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] server/services/context_bridge.py exists with:                   |
|       - createServerAdapters(mcpTools, db) -> adapters object          |
|         (implements the adapter interface from assembler.py)           |
|       - assembleContextForAgent(agentId, request) -> contextPackage    |
|       - getContextEngineHealth() -> health status                      |
|   [ ] Adapter implementations:                                         |
|       - retrieve: calls MCP tools via existing tool runner             |
|       - getEntityData: calls DB via existing queries                   |
|       - getKBChunks: calls Dify KB search API                          |
|   [ ] Error handling: graceful degradation if engine unavailable       |
|   [ ] Lazy-loads context engine (package may not exist yet)            |
|                                                                        |
| Files Created:                                                         |
|   server/services/context_bridge.py                                    |
|                                                                        |
| Blocked By: S3-010                                                     |
| Blocks: S4-002, S4-005 (Codex), S4-008                                |
+-----------------------------------------------------------------------+
```

### S4-002: Wire Bridge into dify_proxy.py
```
+-----------------------------------------------------------------------+
| ID       : S4-002                                                      |
| Title    : Wire context bridge into dify_proxy.py                      |
| Epic     : E11 (Integration)                                          |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Modify the existing Dify proxy to use context engine for             |
|   assembling agent context before forwarding to Dify.                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] server/routes/dify_proxy.py imports context_bridge               |
|   [ ] Before forwarding to Dify:                                       |
|       1. Call assembleContextForAgent(agentId, request)                 |
|       2. Inject context package into Dify request payload              |
|       3. Log context trace ID for observability                        |
|   [ ] Feature flag: CONTEXT_ENGINE_ENABLED (default: false)            |
|       - When false: existing behavior unchanged                        |
|       - When true: context assembly runs                               |
|   [ ] No breaking changes — existing flow works with flag off          |
|                                                                        |
| Files Modified:                                                        |
|   server/routes/dify_proxy.py                                          |
|   server/config/ (add feature flag)                                    |
|                                                                        |
| Blocked By: S4-001                                                     |
| Blocks: S4-008                                                         |
+-----------------------------------------------------------------------+
```

### S4-008: Integration Test (Live Server)
```
+-----------------------------------------------------------------------+
| ID       : S4-008                                                      |
| Title    : Write integration test with live server                     |
| Epic     : E11 (Integration)                                          |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test that the full chain works: HTTP request -> Express ->           |
|   context bridge -> context engine -> Dify proxy -> response.          |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/integration/test_server_bridge.py exists                   |
|   [ ] Tests with CONTEXT_ENGINE_ENABLED=true:                          |
|       - Request includes context trace ID in response headers          |
|       - Context package assembled correctly for agent type             |
|       - Budget constraints respected                                   |
|       - Provenance tags present                                        |
|   [ ] Tests with CONTEXT_ENGINE_ENABLED=false:                         |
|       - Existing behavior unchanged                                    |
|       - No context assembly occurs                                     |
|   [ ] Tests for error scenarios:                                       |
|       - Context engine throws -> falls back to no-context              |
|       - Adapter fails -> circuit breaker activates                     |
|       - Budget overflow -> compression strategy applied                |
|   [ ] Minimum 8 integration tests                                      |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/integration/test_server_bridge.py      |
|                                                                        |
| Blocked By: S4-001, S4-002, S4-003 (Gemini), S4-005 (Codex),         |
|             S4-006 (Gemini), S4-007 (Codex)                            |
+-----------------------------------------------------------------------+
```

---

## SPRINT 5 — Admin Dashboard & RAG (Week 5)

### S5-001: Context Admin API Routes
```
+-----------------------------------------------------------------------+
| ID       : S5-001                                                      |
| Title    : Build context admin API routes                              |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Express routes exposing context engine health, traces, configs,      |
|   and quality metrics for the admin dashboard.                         |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] server/routes/context_admin.py exists with routes:               |
|       GET /api/context/health -> pipeline health stats                 |
|       GET /api/context/traces -> recent context traces                 |
|       GET /api/context/traces/:traceId -> single trace detail          |
|       GET /api/context/sources -> registered source registry           |
|       GET /api/context/quality -> grounding quality scores             |
|       GET /api/context/contracts -> loaded contract configs            |
|       GET /api/context/budget -> budget allocation stats               |
|   [ ] All routes require admin role (RBAC check)                       |
|   [ ] Routes mount in server/__init__.py                                  |
|                                                                        |
| Files Created:                                                         |
|   server/routes/context_admin.py                                       |
|                                                                        |
| Blocked By: S4-001                                                     |
| Blocks: S5-004..007 (dashboard tabs)                                   |
+-----------------------------------------------------------------------+
```

### S5-002: Grounding Scorer Module
```
+-----------------------------------------------------------------------+
| ID       : S5-002                                                      |
| Title    : Build grounding scorer module                               |
| Epic     : E14 (RAG)                                                   |
| Points   : 5                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that scores agent responses for grounding quality.            |
|   Checks: every critical claim has provenance, source exists,          |
|   source supports claim, source is current, authority sufficient.      |
|   Ref: Blueprint Section 11.2-11.3                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/context_engine/grounding.py exists with exports:    |
|       - scoreGrounding(response, contextPackage) -> {                  |
|           score: 0-1,                                                  |
|           claims_checked: number,                                      |
|           claims_grounded: number,                                     |
|           claims_ungrounded: string[],                                 |
|           verification_steps: step_results[]                           |
|         }                                                              |
|       - identifyClaims(responseText) -> claims[]                       |
|       - verifyClaim(claim, provenanceTags[]) -> verification result    |
|   [ ] 5 verification steps implemented:                                |
|       1. has_citation: claim references a source                       |
|       2. source_exists: source_id exists in provenance tags            |
|       3. source_supports: content is relevant to claim                 |
|       4. source_current: not expired per TTL                           |
|       5. authority_sufficient: meets min_authority_tier                 |
|   [ ] Uses grounding-requirements.json from config                     |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/grounding.py                             |
|                                                                        |
| Blocked By: S2-001 (provenance module)                                 |
| Blocks: S5-003 (Codex: tests), S5-007 (Codex: quality tab)            |
+-----------------------------------------------------------------------+
```

### S5-009: 2-Stage RAG Pipeline Design
```
+-----------------------------------------------------------------------+
| ID       : S5-009                                                      |
| Title    : Design 2-stage RAG retrieval pipeline                       |
| Epic     : E14 (RAG)                                                   |
| Points   : 5                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Design document + implementation for the enhanced RAG pipeline.      |
|   Stage 1: broad retrieval (BM25 + vector, top_k=40).                 |
|   Stage 2: reranking + contextual filtering (top_k=8).                 |
|   Must integrate with Dify Knowledge Bases.                            |
|   Ref: Blueprint Section 6                                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/context_engine/rag.py exists with:                  |
|       - createRAGPipeline(config) -> pipeline instance                 |
|       - retrieve(query, domain, options) -> chunks[]                   |
|       - rerank(query, chunks[], topK) -> reranked chunks[]             |
|   [ ] Design doc: docs/rag-pipeline-design.md                         |
|   [ ] Supports configurable chunking strategies per doc type           |
|   [ ] Integrates with source priority (T1 corpora ranked above T3)    |
|   [ ] Provenance tags on every chunk returned                          |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/rag.py                                   |
|   docs/rag-pipeline-design.md                                          |
|                                                                        |
| Blocked By: S3-006 (Codex: NPA domain config)                         |
| Blocks: S5-010                                                         |
+-----------------------------------------------------------------------+
```

### S5-010: Dify KB Restructuring Plan
```
+-----------------------------------------------------------------------+
| ID       : S5-010                                                      |
| Title    : Create Dify Knowledge Base restructuring plan               |
| Epic     : E14 (RAG)                                                   |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Plan for restructuring existing Dify KBs to align with the          |
|   corpora registry and domain-scoped retrieval.                        |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] docs/dify-kb-restructure-plan.md exists with:                    |
|       - Current KB inventory (what exists today)                       |
|       - Target KB structure (per corpora-registry.yaml)                |
|       - Migration steps (what to rename, split, merge)                 |
|       - Metadata requirements (doc_id, version, classification)        |
|       - Chunking configuration per KB                                  |
|       - Testing plan (verify retrieval quality post-migration)         |
|                                                                        |
| Files Created:                                                         |
|   docs/dify-kb-restructure-plan.md                                     |
|                                                                        |
| Blocked By: S5-009                                                     |
+-----------------------------------------------------------------------+
```

---

## SPRINT 6 — Multi-Domain & Polish (Week 6)

### S6-007: Full Regression Test Suite
```
+-----------------------------------------------------------------------+
| ID       : S6-007                                                      |
| Title    : Write full regression test suite                            |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Comprehensive regression tests covering the entire context engine.   |
|   Must test with NPA, Desk Support, and ORM domain configs.           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/regression/test_full_regression.py exists                  |
|   [ ] Tests cover:                                                     |
|       - NPA domain: full pipeline pass                                 |
|       - Desk Support domain: full pipeline pass                        |
|       - ORM domain: full pipeline pass                                 |
|       - Cross-domain delegation                                        |
|       - All 8 failure modes                                            |
|       - Budget overflow + compression                                  |
|       - Trust classification edge cases                                |
|       - Provenance validation                                          |
|       - Contract validation                                            |
|       - Memory + delegation context                                    |
|   [ ] Minimum 30 tests                                                 |
|   [ ] ALL pass with pytest                                           |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/regression/test_full_regression.py     |
|                                                                        |
| Blocked By: ALL previous sprints                                       |
| Blocks: S6-008, S6-009                                                 |
+-----------------------------------------------------------------------+
```

### S6-008: Performance Benchmarks
```
+-----------------------------------------------------------------------+
| ID       : S6-008                                                      |
| Title    : Create performance benchmarks                               |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 3                                                          |
| Priority : P2                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Benchmark the context assembly pipeline for latency and memory.      |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/bench/test_pipeline_bench.py exists                             |
|   [ ] Measures:                                                        |
|       - p50, p95, p99 assembly latency (with mock adapters)            |
|       - Memory usage per assembly call                                 |
|       - Token counting throughput (tokens/sec)                         |
|       - Budget allocation time                                         |
|   [ ] Baseline numbers documented                                      |
|   [ ] SLO targets: p95 < 200ms for assembly (excluding network)       |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/bench/test_pipeline_bench.py                |
|                                                                        |
| Blocked By: S6-007                                                     |
| Blocks: S6-009                                                         |
+-----------------------------------------------------------------------+
```

### S6-009: Merge PR Preparation
```
+-----------------------------------------------------------------------+
| ID       : S6-009                                                      |
| Title    : Prepare merge PR                                            |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Final cleanup, documentation, and PR creation for merging the        |
|   context engine into main.                                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] All tests pass (unit + integration + regression)                 |
|   [ ] Zero imports from server/, src/app/, shared/                     |
|   [ ] pyproject.toml version: 1.0.0                                      |
|   [ ] CHANGELOG.md created                                             |
|   [ ] PR description includes:                                         |
|       - Summary of all 15 epics                                        |
|       - Test coverage stats                                            |
|       - Performance benchmarks                                         |
|       - Breaking changes (none expected)                               |
|       - Integration guide for server team                              |
|   [ ] Branch rebased on latest main                                    |
|                                                                        |
| Files Created/Modified:                                                |
|   packages/context-engine/CHANGELOG.md                                 |
|   packages/context-engine/pyproject.toml (version bump)                  |
|                                                                        |
| Blocked By: S6-007, S6-008, ALL                                       |
+-----------------------------------------------------------------------+
```

---

*Total: 20 stories, 87 points across 6 sprints. I own all architecture, integration, and the critical assembler pipeline.*
