# Context Engine — Gemini Stories

**Agent:** Gemini (Builder)
**Total Points:** 53 (27% of 195)
**Role:** Configs, schema design, modules, UI dashboard components, research + validation

> **Shared context:** Read `SPRINT-OVERVIEW.md` for epic map, dependency graph,
> sprint goals, execution order, and definitions of done.

---

## My Sprint Summary

| Sprint | Points | Stories | Focus |
|--------|--------|---------|-------|
| S1     | 12     | S1-004, S1-005, S1-006, S1-009, S1-010, S1-014 | Data classification + Grounding + Provenance schema + Worker/Reviewer contracts + Contract tests |
| S2     | 11     | S2-003, S2-006, S2-009 | Token counter + Context scoper + Assembler happy-path tests |
| S3     | 8      | S3-003, S3-004, S3-007 | Session tests + Observability tracer + NPA config tests |
| S4     | 6      | S4-003, S4-006 | Circuit breaker module + MCP provenance wrapper |
| S5     | 9      | S5-004, S5-005, S5-008 | Dashboard health tab + Source registry tab + Chat citation panel |
| S6     | 7      | S6-002, S6-004, S6-006 | ORM domain config + Onboarding playbook + Contracts tab |

---

## SPRINT 1 — Foundation (Week 1)

### S1-004: Data Classification Config
```
+-----------------------------------------------------------------------+
| ID       : S1-004                                                      |
| Title    : Create data classification taxonomy config                  |
| Epic     : E2 (Trust)                                                  |
| Points   : 1                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED taxonomy.             |
|   Reference: Blueprint Section 5.3                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/data-classification.json exists                           |
|   [ ] Contains 4 levels, each with:                                    |
|       - level (PUBLIC/INTERNAL/CONFIDENTIAL/RESTRICTED)                |
|       - ordinal (0-3, higher = more restricted)                        |
|       - definition                                                     |
|       - examples[]                                                     |
|       - min_role_required (which user role can see this level)         |
|       - agent_visibility_rule                                          |
|   [ ] Ordering: PUBLIC < INTERNAL < CONFIDENTIAL < RESTRICTED          |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/data-classification.json              |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-011 (Claude: trust engine), S1-015 (Codex: config tests)   |
+-----------------------------------------------------------------------+
```

### S1-005: Grounding Requirements Config
```
+-----------------------------------------------------------------------+
| ID       : S1-005                                                      |
| Title    : Create grounding requirements config                        |
| Epic     : E2 (Trust)                                                  |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define which types of claims must have citations and what            |
|   citation format is required. Reference: Blueprint Sec 11.2           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/grounding-requirements.json exists                        |
|   [ ] Contains claim_types[] array, each with:                         |
|       - claim_type (e.g., "classification_decision",                   |
|         "risk_assessment", "governance_rule", "regulatory_obligation", |
|         "signoff_requirement", "financial_threshold",                  |
|         "prohibited_item", "sla_deadline")                             |
|       - requires_citation: true/false                                  |
|       - min_authority_tier: 1-5 (minimum source tier for citation)    |
|       - citation_format: { required_fields: [...] }                   |
|       - example_valid_citation                                         |
|       - example_invalid_citation                                       |
|   [ ] citation_format.required_fields includes:                        |
|       source_id, version, section (at minimum)                         |
|   [ ] Verification steps defined (from Blueprint 11.3):                |
|       has_citation, source_exists, source_supports_claim,             |
|       source_is_current, authority_sufficient                          |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/grounding-requirements.json           |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-015 (Codex: config tests)                                   |
+-----------------------------------------------------------------------+
```

### S1-006: Provenance Schema
```
+-----------------------------------------------------------------------+
| ID       : S1-006                                                      |
| Title    : Create provenance tag JSON schema                           |
| Epic     : E4 (Provenance)                                            |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define the standard provenance tag structure that every data         |
|   source must use. Reference: Blueprint Section 11.1                   |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/provenance-schema.json exists                             |
|   [ ] Schema fields (all from Blueprint 11.1):                         |
|       - source_id: string (required)                                   |
|       - source_type: enum [system_of_record, bank_sop,                |
|         industry_standard, external_official, general_web,             |
|         agent_output, user_input] (required)                           |
|       - authority_tier: integer 1-5 (required)                         |
|       - version: string (optional)                                     |
|       - effective_date: ISO 8601 date (optional)                      |
|       - expiry_date: ISO 8601 date (optional)                         |
|       - owner: string (optional)                                       |
|       - fetched_at: ISO 8601 datetime (required)                      |
|       - ttl_seconds: integer (required, default 3600)                 |
|       - trust_class: enum [TRUSTED, UNTRUSTED] (required)             |
|       - data_classification: enum [PUBLIC, INTERNAL,                   |
|         CONFIDENTIAL, RESTRICTED] (required)                           |
|       - jurisdiction: string (optional, e.g. "SG", "GLOBAL")         |
|       - doc_section: string (optional)                                 |
|       - chunk_hash: string (optional, sha256)                         |
|   [ ] Includes a validate() function spec or JSON Schema ($schema)    |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/provenance-schema.json                |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S2-001 (Claude: provenance tagger), S1-015 (Codex: tests)     |
+-----------------------------------------------------------------------+
```

### S1-009: Worker Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-009                                                      |
| Title    : Create worker context contract                              |
| Epic     : E3 (Contracts)                                              |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define what data worker agents (RISK, CLASSIFIER, AUTOFILL,         |
|   GOVERNANCE, etc.) need. Ref: Blueprint 9.2                           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] contracts/worker.json exists                                     |
|   [ ] Same structure as orchestrator.json but with:                    |
|       required: assigned_task, entity_data, domain_knowledge,          |
|                 tool_results, user_context (role+jurisdiction)          |
|       optional: prior_worker_results, conversation_history (2-4),     |
|                 few_shot_examples (2-4)                                 |
|       excluded: other_domain_data, full_conversation_history,          |
|                 routing_metadata                                        |
|       budget_profile: "standard"                                       |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/contracts/worker.json                        |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-013 (Claude: contract loader)                               |
+-----------------------------------------------------------------------+
```

### S1-010: Reviewer Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-010                                                      |
| Title    : Create reviewer context contract                            |
| Epic     : E3 (Contracts)                                              |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define what data reviewer agents need. Ref: Blueprint 9.2            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] contracts/reviewer.json exists                                   |
|   [ ] Same structure but with:                                         |
|       required: worker_output, worker_provenance,                      |
|                 validation_rubric, policy_references                    |
|       optional: entity_data (cross-check), injection_patterns          |
|       excluded: conversation_history, few_shot_examples,               |
|                 other_worker_outputs                                    |
|       budget_profile: "compact"                                        |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/contracts/reviewer.json                      |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-013 (Claude: contract loader)                               |
+-----------------------------------------------------------------------+
```

### S1-014: Contract Loader Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-014                                                      |
| Title    : Write tests for contract loader                             |
| Epic     : E3 (Contracts)                                              |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for context_engine/contracts.py.                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_contracts.py exists                              |
|   [ ] Tests for loadContract():                                        |
|       - "orchestrator" loads correctly                                  |
|       - "worker" loads correctly                                       |
|       - "reviewer" loads correctly                                     |
|       - unknown archetype -> meaningful error                          |
|   [ ] Tests for validateContext():                                     |
|       - All required present -> valid: true                            |
|       - Missing required -> valid: false + missing_required[]          |
|       - Excluded content present -> valid: true + warnings[]          |
|       - Empty context -> valid: false                                  |
|   [ ] Tests for getRequiredSources():                                  |
|       - Returns correct source specs for each archetype                |
|   [ ] Tests for getBudgetProfile():                                    |
|       - "orchestrator" -> "lightweight"                                |
|       - "worker" -> "standard"                                         |
|       - "reviewer" -> "compact"                                        |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_contracts.py                 |
|                                                                        |
| Blocked By: S1-013 (Claude: contract loader module)                    |
+-----------------------------------------------------------------------+
```

---

## SPRINT 2 — Core Pipeline (Week 2)

### S2-003: Token Counter Module
```
+-----------------------------------------------------------------------+
| ID       : S2-003                                                      |
| Title    : Build token counter module                                  |
| Epic     : E5 (Budget)                                                 |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Lightweight module wrapping tiktoken for consistent             |
|   token counting across the engine.                                    |
|   This is a prerequisite for the budget allocator.                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/token_counter.py exists with exports:                        |
|       - countTokens(text) -> integer                                   |
|       - countTokensForObject(obj) -> integer (json.dumps + count)  |
|       - estimateTokens(charCount) -> integer (fast estimate: /4)       |
|       - truncateToTokens(text, maxTokens) -> truncated text            |
|   [ ] Uses tiktoken (already in pyproject.toml)                     |
|   [ ] Handles edge cases: null, undefined, empty string, numbers       |
|   [ ] Fast path for estimation when accuracy not critical              |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/token_counter.py                         |
|                                                                        |
| Blocked By: S1-007 (Codex: budget config — for understanding context)  |
| Blocks: S2-004 (Claude: budget allocator)                              |
+-----------------------------------------------------------------------+
```

### S2-006: Context Scoper Module
```
+-----------------------------------------------------------------------+
| ID       : S2-006                                                      |
| Title    : Build context scoper module                                 |
| Epic     : E6 (Scoping)                                                |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that filters context data by domain, entity, and             |
|   jurisdiction. Implements the 6 scoping dimensions.                   |
|   Ref: Blueprint Section 10                                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/scoper.py exists with exports:                               |
|       - scopeByDomain(data[], domainId) -> filtered data[]             |
|       - scopeByEntity(data[], entityId, entityType) -> filtered[]      |
|       - scopeByJurisdiction(data[], jurisdiction) -> filtered[]        |
|       - scopeByClassification(data[], maxLevel) -> filtered[]          |
|       - scopeByRole(data[], userRole) -> filtered[]                    |
|       - applyAllScopes(data[], scopingConfig) -> filtered[]            |
|   [ ] 6 scoping dimensions implemented:                                |
|       1. Domain: NPA data only visible to NPA agents                   |
|       2. Entity: project_id / incident_id / counterparty_id            |
|       3. Jurisdiction: SG, HK, IN -> local + GLOBAL                    |
|       4. Classification: filter by data sensitivity level              |
|       5. Role: filter by user's access level                           |
|       6. Temporal: filter by effective_date / expiry_date              |
|   [ ] Loads domain configs for domain-specific rules                   |
|   [ ] Pure functions — no side effects                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/scoper.py                                |
|                                                                        |
| Blocked By: S1-004 (self: data classification config)                  |
| Blocks: S2-007 (Codex: scoper tests), S2-008 (Claude: assembler)      |
+-----------------------------------------------------------------------+
```

### S2-009: Assembler Tests (Happy Path)
```
+-----------------------------------------------------------------------+
| ID       : S2-009                                                      |
| Title    : Write assembler tests (happy path with mocks)               |
| Epic     : E7 (Assembly)                                               |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Happy-path tests for context_engine/assembler.py using mock adapters.           |
|   Complement to S2-010 (Codex: edge case tests).                      |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_assembler_happy.py exists                        |
|   [ ] Mock adapters that return realistic data:                        |
|       - retrieve: returns mock KB chunks with provenance               |
|       - getEntityData: returns mock project/incident data              |
|       - getKBChunks: returns mock knowledge base results               |
|   [ ] Tests for each pipeline stage:                                   |
|       - Stage 1 (CLASSIFY): contract loaded, trust classified          |
|       - Stage 2 (SCOPE): data filtered by domain + entity             |
|       - Stage 3 (RETRIEVE): adapters called with correct params       |
|       - Stage 4 (RANK): results sorted by authority tier              |
|       - Stage 5 (BUDGET): tokens allocated within limits              |
|       - Stage 6 (ASSEMBLE): context package has all expected slots    |
|       - Stage 7 (TAG): all data has provenance tags                   |
|   [ ] Tests for different archetypes:                                  |
|       - Orchestrator request -> lightweight budget                     |
|       - Worker request -> standard budget, has entity_data             |
|       - Reviewer request -> compact budget, has worker_output          |
|   [ ] Tests for context package structure:                             |
|       - All expected top-level keys present                            |
|       - _metadata contains trace_id and stages                        |
|       - Budget report included                                         |
|   [ ] Minimum 20 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_assembler_happy.py           |
|                                                                        |
| Blocked By: S2-008 (Claude: core assembler)                            |
+-----------------------------------------------------------------------+
```

---

## SPRINT 3 — Memory, Observability & Domain Config (Week 3)

### S3-003: Session + Delegation Tests
```
+-----------------------------------------------------------------------+
| ID       : S3-003                                                      |
| Title    : Write tests for session state + delegation                  |
| Epic     : E8 (Memory)                                                 |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for context_engine/memory.py and context_engine/delegation.py.               |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_memory.py exists                                 |
|   [ ] Tests for session management:                                    |
|       - createSession -> valid session object                          |
|       - addTurn -> turn appended                                       |
|       - getRelevantHistory -> respects maxTurns                        |
|       - compressHistory -> within maxTokens                            |
|       - serializeSession / deserializeSession round-trip               |
|   [ ] Tests for 4-tier memory:                                         |
|       - Working memory: current turn context                           |
|       - Session memory: compressed history                             |
|       - Entity memory: facts accumulated per entity                    |
|       - Domain memory: cross-session cache                             |
|   [ ] tests/test_delegation.py exists                             |
|   [ ] Tests for delegation:                                            |
|       - createDelegationPackage: correct context passed                |
|       - Worker delegation strips routing metadata                      |
|       - Reviewer delegation includes provenance                        |
|       - mergeDelegationResults: composes correctly                     |
|   [ ] Minimum 18 tests total                                           |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_memory.py                    |
|   packages/context-engine/tests/test_delegation.py                |
|                                                                        |
| Blocked By: S3-001 (Claude: session state), S3-002 (Claude: deleg.)   |
+-----------------------------------------------------------------------+
```

### S3-004: Observability Tracer Module
```
+-----------------------------------------------------------------------+
| ID       : S3-004                                                      |
| Title    : Build observability tracer module                           |
| Epic     : E9 (Observability)                                          |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that traces context assembly pipeline execution.              |
|   Records per-stage timing, token counts, and decisions.               |
|   Ref: Blueprint Section 13                                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] context_engine/tracer.py exists with exports:                               |
|       - createTrace(requestId) -> trace object                         |
|       - addStageEvent(trace, stageName, data) -> updated trace         |
|       - finalizeTrace(trace) -> finalized trace with totals            |
|       - getTraceMetrics(trace) -> { stages[], total_duration_ms,      |
|           total_tokens, per_stage_tokens{} }                           |
|       - serializeTrace(trace) -> JSON string (for logging)             |
|   [ ] Each stage event records:                                        |
|       - stage_name, started_at, duration_ms                            |
|       - items_in, items_out (how many data items entered/exited)       |
|       - tokens_in, tokens_out                                          |
|       - decisions[] (e.g., "dropped 3 low-authority chunks")           |
|   [ ] Trace has unique trace_id (UUID)                                 |
|   [ ] No external dependencies (uses uuid.uuid4())                |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/tracer.py                                |
|                                                                        |
| Blocked By: S2-008 (Claude: assembler — to understand stage events)    |
| Blocks: S3-005 (Codex: tracer tests)                                   |
+-----------------------------------------------------------------------+
```

### S3-007: NPA Domain Config Tests
```
+-----------------------------------------------------------------------+
| ID       : S3-007                                                      |
| Title    : Write tests for NPA domain config                           |
| Epic     : E10 (Domain Configs)                                        |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Tests validating the NPA domain config structure and content.        |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_npa_config.py exists                             |
|   [ ] Tests:                                                           |
|       - domain_id is "NPA"                                             |
|       - primary_entity is "project_id"                                 |
|       - context_sources contains system_of_record type                 |
|       - context_sources contains bank_sops type                        |
|       - scoping_fields includes project_id and jurisdiction            |
|       - untrusted_content is non-empty array                           |
|       - agents list contains NPA agent names                           |
|       - Config can be loaded by assembler                              |
|   [ ] Minimum 10 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_npa_config.py                |
|                                                                        |
| Blocked By: S3-006 (Codex: NPA domain config)                          |
+-----------------------------------------------------------------------+
```

---

## SPRINT 4 — Integration Bridge & Hardening (Week 4)

### S4-003: Circuit Breaker Module
```
+-----------------------------------------------------------------------+
| ID       : S4-003                                                      |
| Title    : Build circuit breaker module                                |
| Epic     : E12 (Failure Modes)                                        |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Generic circuit breaker pattern implementation for protecting        |
|   adapter calls. States: CLOSED -> OPEN -> HALF-OPEN.                 |
|   Ref: Blueprint Section 12                                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/context_engine/circuit_breaker.py with exports:     |
|       - createCircuitBreaker(options) -> breaker instance              |
|         Options: { failureThreshold, cooldownMs, fallback }            |
|       - breaker.call(fn) -> result or fallback                         |
|       - breaker.getState() -> "CLOSED" | "OPEN" | "HALF_OPEN"        |
|       - breaker.getStats() -> { failures, successes, state,           |
|           lastFailure, lastSuccess }                                    |
|       - breaker.reset() -> resets to CLOSED                            |
|   [ ] State transitions:                                               |
|       CLOSED: calls pass through; count failures                       |
|       -> OPEN: after failureThreshold consecutive failures             |
|       OPEN: calls short-circuit to fallback                            |
|       -> HALF_OPEN: after cooldownMs elapsed                           |
|       HALF_OPEN: single probe call allowed                             |
|       -> CLOSED: if probe succeeds                                     |
|       -> OPEN: if probe fails                                          |
|   [ ] Zero external dependencies                                      |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/circuit_breaker.py                       |
|                                                                        |
| Blocked By: S2-008 (Claude: assembler — for integration context)       |
| Blocks: S4-004 (Codex: tests), S4-005 (Codex: failure mode tests)     |
+-----------------------------------------------------------------------+
```

### S4-006: MCP Tool Provenance Wrapper
```
+-----------------------------------------------------------------------+
| ID       : S4-006                                                      |
| Title    : Build MCP tool provenance wrapper                           |
| Epic     : E4 (Provenance)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Wrapper that automatically adds provenance tags to MCP tool          |
|   results. This is the bridge between raw tool output and the          |
|   context engine's provenance-aware pipeline.                          |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/context_engine/mcp_provenance.py with exports:      |
|       - wrapToolResult(toolName, result, metadata) -> taggedResult     |
|       - createToolProvenance(toolName) -> base provenance tag          |
|       - batchWrapResults(results[]) -> taggedResults[]                 |
|   [ ] Auto-sets:                                                       |
|       - source_type: "system_of_record"                                |
|       - authority_tier: 1                                              |
|       - trust_class: "TRUSTED"                                         |
|       - fetched_at: current ISO timestamp                              |
|       - source_id: tool name                                           |
|   [ ] Handles tool errors gracefully (returns error provenance tag)    |
|   [ ] Works with any MCP tool result shape                             |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/context_engine/mcp_provenance.py                        |
|                                                                        |
| Blocked By: S2-001 (Claude: provenance tagger)                         |
| Blocks: S4-007 (Codex: tests)                                          |
+-----------------------------------------------------------------------+
```

---

## SPRINT 5 — Admin Dashboard & RAG (Week 5)

### S5-004: Dashboard — Pipeline Health Tab
```
+-----------------------------------------------------------------------+
| ID       : S5-004                                                      |
| Title    : Build dashboard pipeline health tab (Angular)               |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing context pipeline health metrics.           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-health-tab.component.ts exists                |
|   [ ] Shows:                                                           |
|       - Pipeline status (healthy/degraded/down)                        |
|       - Requests/minute throughput                                     |
|       - Average assembly latency (p50, p95)                            |
|       - Circuit breaker states per adapter                             |
|       - Active domain configs loaded                                   |
|   [ ] Auto-refreshes every 30 seconds                                  |
|   [ ] Calls GET /api/context/health                                    |
|   [ ] Loading + error states handled                                   |
|   [ ] Uses existing Angular styling patterns from the workbench       |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-health-tab.component.ts    |
|   src/app/platform/components/admin/context-health-tab.component.html  |
|   src/app/platform/components/admin/context-health-tab.component.scss  |
|                                                                        |
| Blocked By: S5-001 (Claude: admin API routes)                          |
+-----------------------------------------------------------------------+
```

### S5-005: Dashboard — Source Registry Tab
```
+-----------------------------------------------------------------------+
| ID       : S5-005                                                      |
| Title    : Build dashboard source registry tab (Angular)               |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing registered context sources with their      |
|   authority tiers, trust classes, and usage stats.                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-sources-tab.component.ts exists               |
|   [ ] Shows table: source_id | type | tier | trust_class | domain    |
|       | last_used | hit_count                                          |
|   [ ] Grouped by authority tier (T1 at top)                            |
|   [ ] Color coding: TRUSTED=green, UNTRUSTED=orange, NEVER=red        |
|   [ ] Calls GET /api/context/sources                                   |
|   [ ] Loading + error states handled                                   |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-sources-tab.component.ts   |
|   src/app/platform/components/admin/context-sources-tab.component.html |
|   src/app/platform/components/admin/context-sources-tab.component.scss |
|                                                                        |
| Blocked By: S5-001 (Claude: admin API routes)                          |
+-----------------------------------------------------------------------+
```

### S5-008: Chat Citation Panel Component
```
+-----------------------------------------------------------------------+
| ID       : S5-008                                                      |
| Title    : Build chat citation panel component (Angular)               |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Component that shows provenance citations in the chat interface.     |
|   When an agent response includes grounded claims, users can see       |
|   the source references and authority level.                           |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: citation-panel.component.ts exists                    |
|   [ ] Shows: expandable citation list under agent responses            |
|   [ ] Each citation shows:                                             |
|       - Source name + type                                             |
|       - Authority tier (with icon: shield for T1, doc for T2, etc.)   |
|       - Version + effective date                                       |
|       - Relevant section/clause                                        |
|   [ ] Collapsed by default, expandable on click                        |
|   [ ] Integrates with existing chat message rendering                  |
|   [ ] Uses existing Angular styling patterns                           |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/shared/citation-panel.component.ts       |
|   src/app/platform/components/shared/citation-panel.component.html     |
|   src/app/platform/components/shared/citation-panel.component.scss     |
|                                                                        |
| Blocked By: S2-001 (Claude: provenance — for data format)              |
+-----------------------------------------------------------------------+
```

---

## SPRINT 6 — Multi-Domain & Polish (Week 6)

### S6-002: ORM Domain Config
```
+-----------------------------------------------------------------------+
| ID       : S6-002                                                      |
| Title    : Create ORM domain config                                    |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Domain config for Operational Risk Management.                       |
|   Reference: Blueprint Section 2.3 (ORM domain)                       |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] domains/orm.json exists with:                                    |
|       - domain_id: "ORM"                                               |
|       - primary_entity: "incident_id"                                  |
|       - context_sources: incident API, RCSA API, KRI API               |
|       - scoping_fields: [incident_id, risk_category, control_id,       |
|           business_line]                                                |
|       - untrusted_content: [user_free_text, external_loss_data]        |
|       - agents[]: ORM_ORCH, incident, rca, rcsa, kri, loss_event,     |
|           control_test, remediation                                     |
|   [ ] Valid JSON, parseable                                            |
|   [ ] Can be loaded by assembler                                       |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/domains/orm.json                             |
|                                                                        |
| Blocked By: S3-006 (Codex: NPA config — use as template)               |
| Blocks: S6-003 (Codex: validation tests), S6-004 (self: playbook)     |
+-----------------------------------------------------------------------+
```

### S6-004: Domain Onboarding Playbook
```
+-----------------------------------------------------------------------+
| ID       : S6-004                                                      |
| Title    : Write domain onboarding playbook document                   |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 2                                                          |
| Priority : P2                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Step-by-step guide for adding a new domain to the context engine.    |
|   Uses NPA as the reference template.                                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] docs/DOMAIN-ONBOARDING-PLAYBOOK.md exists with:                  |
|       - Prerequisites checklist                                        |
|       - Step 1: Create domain config JSON (with template)              |
|       - Step 2: Define context sources                                 |
|       - Step 3: Configure scoping rules                                |
|       - Step 4: Set up trust/grounding overrides                       |
|       - Step 5: Register agents                                        |
|       - Step 6: Write domain config tests                              |
|       - Step 7: Run pipeline with mock data                            |
|       - Estimated time: < 1 day for simple domain                      |
|   [ ] Includes NPA as worked example                                   |
|   [ ] Includes checklist format (copy-pasteable)                       |
|                                                                        |
| Files Created:                                                         |
|   docs/DOMAIN-ONBOARDING-PLAYBOOK.md                                   |
|                                                                        |
| Blocked By: S6-001 (Codex: Desk config), S6-002 (self: ORM config)    |
+-----------------------------------------------------------------------+
```

### S6-006: Dashboard — Contracts Tab
```
+-----------------------------------------------------------------------+
| ID       : S6-006                                                      |
| Title    : Build dashboard contracts tab (Angular)                     |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P2                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing loaded context contracts and their         |
|   validation status.                                                   |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-contracts-tab.component.ts exists             |
|   [ ] Shows: loaded contracts (orchestrator, worker, reviewer)         |
|   [ ] For each contract shows:                                         |
|       - contract_id, version, archetype                                |
|       - required_context slots                                         |
|       - optional_context slots                                         |
|       - excluded_context items                                         |
|       - budget_profile                                                 |
|   [ ] Shows recent validation results (pass/fail per request)          |
|   [ ] Calls GET /api/context/contracts                                 |
|   [ ] Loading + error states handled                                   |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-contracts-tab.component.ts |
|   src/app/platform/components/admin/context-contracts-tab.component.html|
|   src/app/platform/components/admin/context-contracts-tab.component.scss|
|                                                                        |
| Blocked By: S5-001 (Claude: admin API routes)                          |
+-----------------------------------------------------------------------+
```

---

*Total: 18 stories, 53 points across 6 sprints. I own configs, schema designs, modules (scoper, tracer, circuit breaker, provenance wrapper), tests, and dashboard UI components.*
