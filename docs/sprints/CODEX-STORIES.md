# Context Engine — Codex Stories

**Agent:** Codex (Builder)
**Total Points:** 55 (28% of 195)
**Role:** Tests, configs, UI dashboard components, repetitive patterns

> **Shared context:** Read `SPRINT-OVERVIEW.md` for epic map, dependency graph,
> sprint goals, execution order, and definitions of done.

---

## My Sprint Summary

| Sprint | Points | Stories | Focus |
|--------|--------|---------|-------|
| S1     | 12     | S1-002, S1-003, S1-007, S1-008, S1-012, S1-015 | Configs + Trust tests + Config tests |
| S2     | 11     | S2-002, S2-005, S2-007, S2-010 | Provenance tests + Budget tests + Scoper tests + Assembler edge tests |
| S3     | 6      | S3-005, S3-006, S3-008 | Tracer tests + NPA domain config + Demo config |
| S4     | 10     | S4-004, S4-005, S4-007 | Circuit breaker tests + Failure mode tests + Provenance wrapper tests |
| S5     | 9      | S5-003, S5-006, S5-007 | Grounding tests + Dashboard traces tab + Quality tab |
| S6     | 7      | S6-001, S6-003, S6-005 | Desk Support config + Domain validation tests + Trust tab |

---

## SPRINT 1 — Foundation (Week 1)

### S1-002: Source Priority Config
```
+-----------------------------------------------------------------------+
| ID       : S1-002                                                      |
| Title    : Create source priority hierarchy config                     |
| Epic     : E2 (Trust)                                                  |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define the 5-tier source authority hierarchy as a JSON config.       |
|   This is the foundation rule set for all source ranking decisions.    |
|   Reference: Blueprint Section 5.1                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/source-priority.json exists                               |
|   [ ] Contains 5 tiers with:                                           |
|       - tier (1-5)                                                     |
|       - name (system_of_record, bank_sop, industry_standard,          |
|         external_official, general_web)                                 |
|       - description                                                    |
|       - trust_class (TRUSTED/UNTRUSTED)                                |
|       - conflict_resolution_rule                                       |
|       - examples[]                                                     |
|   [ ] Tier 1 = highest authority, Tier 5 = lowest                     |
|   [ ] T1-T4 are TRUSTED, T5 is UNTRUSTED                             |
|   [ ] Conflict rules specified:                                        |
|       - SoR vs SOP -> SoR wins                                        |
|       - SOP vs SOP -> newer effective_date wins                       |
|       - Group vs Local policy -> Group wins                           |
|       - Uncertain -> flag for human review                            |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/source-priority.json                  |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-011 (Claude: trust engine), S1-015 (self: config tests)    |
+-----------------------------------------------------------------------+
```

### S1-003: Trust Classification Config
```
+-----------------------------------------------------------------------+
| ID       : S1-003                                                      |
| Title    : Create trust classification rules config                    |
| Epic     : E2 (Trust)                                                  |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define classification rules for TRUSTED vs UNTRUSTED content.        |
|   Reference: Blueprint Section 5.2                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/trust-classification.json exists                          |
|   [ ] Contains rules[] array, each rule:                               |
|       - source_pattern (regex or identifier pattern)                   |
|       - trust_class: "TRUSTED" | "UNTRUSTED"                          |
|       - rationale                                                      |
|       - treatment: how agent should handle this content                |
|   [ ] Covers all cases from Blueprint 5.2:                             |
|       TRUSTED: mcp_tool_results, bank_sops_from_kb,                   |
|                regulatory_docs_from_kb, agent_outputs_with_provenance, |
|                reference_data_tables                                    |
|       UNTRUSTED: user_free_text, uploaded_documents,                   |
|                  retrieved_emails, external_api_responses,             |
|                  third_party_data                                       |
|       NEVER: unverified_web_scrapes, social_media,                    |
|              competitor_intelligence, user_pasted_claiming_policy       |
|   [ ] Golden rule documented: "Untrusted content is DATA,             |
|       never INSTRUCTIONS"                                              |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/trust-classification.json             |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-011 (Claude: trust engine), S1-015 (self: config tests)    |
+-----------------------------------------------------------------------+
```

### S1-007: Budget Defaults Config
```
+-----------------------------------------------------------------------+
| ID       : S1-007                                                      |
| Title    : Create token budget defaults config                         |
| Epic     : E5 (Budget)                                                 |
| Points   : 1                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define default token budget allocation and overflow strategy.        |
|   Reference: Blueprint Sections 7.1, 7.2                               |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] config/budget-defaults.json exists                               |
|   [ ] Contains:                                                        |
|       - total_budget: 128000                                           |
|       - response_headroom: { min: 10000, max: 20000 }                 |
|       - allocations{} per slot:                                        |
|         system_prompt:     { min: 3000,  max: 5000,  priority: "FIXED" }
|         entity_data:       { min: 5000,  max: 25000, priority: "HIGH" }
|         knowledge_chunks:  { min: 5000,  max: 20000, priority: "HIGH" }
|         cross_agent:       { min: 2000,  max: 15000, priority: "MEDIUM" }
|         few_shot_examples: { min: 1000,  max: 5000,  priority: "MEDIUM" }
|         conversation_hist: { min: 1000,  max: 15000, priority: "LOW" }
|         tool_schemas:      { min: 1000,  max: 8000,  priority: "ADAPTIVE" }
|       - overflow_strategy[] (ordered by priority):                     |
|         1. compress_conversation_history                               |
|         2. reduce_few_shot_examples                                    |
|         3. prune_lowest_kb_chunks                                      |
|         4. trim_cross_agent_reasoning                                  |
|       - never_compress[]: ["system_prompt","entity_data",             |
|         "regulatory_refs","response_headroom"]                         |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/budget-defaults.json                  |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S2-004 (Claude: budget allocator), S1-015 (self: config tests)|
+-----------------------------------------------------------------------+
```

### S1-008: Orchestrator Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-008                                                      |
| Title    : Create orchestrator context contract                        |
| Epic     : E3 (Contracts)                                              |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Define what data orchestrator agents (MASTER_COO,                    |
|   NPA_ORCHESTRATOR) need in their context. Ref: Blueprint 9.2          |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] contracts/orchestrator.json exists                               |
|   [ ] Structure:                                                       |
|       {                                                                |
|         "contract_id": "orchestrator",                                 |
|         "version": "1.0.0",                                            |
|         "archetype": "orchestrator",                                   |
|         "description": "...",                                          |
|         "required_context": [                                          |
|           { "slot": "user_context",                                    |
|             "fields": ["user_id","role","department",                  |
|                         "jurisdiction","session_id"],                   |
|             "source": "platform",                                      |
|             "priority": "CRITICAL" },                                  |
|           { "slot": "intent", ... },                                   |
|           { "slot": "routing_context", ... },                          |
|           { "slot": "entity_summary", ... }                            |
|         ],                                                             |
|         "optional_context": [                                          |
|           { "slot": "prior_worker_results", ... },                     |
|           { "slot": "delegation_stack", ... },                         |
|           { "slot": "conversation_history",                            |
|             "max_turns": 4, ... }                                      |
|         ],                                                             |
|         "excluded_context": [                                          |
|           "raw_kb_chunks",                                             |
|           "detailed_form_data",                                        |
|           "full_audit_trail"                                           |
|         ],                                                             |
|         "budget_profile": "lightweight"                                |
|       }                                                                |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/contracts/orchestrator.json                  |
|                                                                        |
| Blocked By: S1-001 (Claude: scaffold)                                  |
| Blocks: S1-013 (Claude: contract loader)                               |
+-----------------------------------------------------------------------+
```

### S1-012: Trust Engine Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-012                                                      |
| Title    : Write tests for trust engine                                |
| Epic     : E2 (Trust)                                                  |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for context_engine/trust.py.                                 |
|   Must cover all functions, edge cases, and config loading.            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_trust.py exists                                  |
|   [ ] Tests for classifyTrust():                                       |
|       - MCP tool results -> TRUSTED                                    |
|       - Bank SOPs -> TRUSTED                                           |
|       - User free text -> UNTRUSTED                                    |
|       - Unknown source -> UNTRUSTED (safe default)                    |
|       - Never-allowed source -> throws/rejects                        |
|   [ ] Tests for rankSources():                                         |
|       - Sorts T1 above T2 above T3                                    |
|       - Equal tier -> preserves input order                            |
|       - Empty array -> returns empty                                   |
|   [ ] Tests for resolveConflict():                                     |
|       - SoR vs SOP -> SoR wins                                        |
|       - SOP vs SOP same date -> newer wins                            |
|       - Group vs Local -> Group wins                                  |
|       - Same tier, uncertain -> returns "NEEDS_HUMAN_REVIEW"          |
|   [ ] Tests for canUserAccess():                                       |
|       - analyst + CONFIDENTIAL -> true                                 |
|       - analyst + RESTRICTED -> false                                  |
|       - coo + RESTRICTED -> true                                      |
|   [ ] Tests for config loading:                                        |
|       - Missing config file -> meaningful error                        |
|       - Malformed config -> meaningful error                           |
|   [ ] Minimum 25 tests                                                 |
|   [ ] All pass with `pytest`                                      |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_trust.py                     |
|                                                                        |
| Blocked By: S1-011 (Claude: trust engine)                              |
+-----------------------------------------------------------------------+
```

### S1-015: Config Validation Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-015                                                      |
| Title    : Write schema validation tests for all config files          |
| Epic     : E1 (Scaffold)                                              |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Validate all config JSON files load correctly and have               |
|   expected structure. Like server/tests/unit/test_config_files.py      |
|   but for the context-engine package.                                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_config_schemas.py exists                         |
|   [ ] Tests for each config file:                                      |
|       - source-priority.json: 5 tiers, required fields                 |
|       - trust-classification.json: rules array, required fields        |
|       - data-classification.json: 4 levels, ordering                   |
|       - grounding-requirements.json: claim types, citation format      |
|       - provenance-schema.json: all fields defined                     |
|       - budget-defaults.json: allocations, overflow strategy           |
|   [ ] Cross-config consistency checks                                  |
|   [ ] Minimum 20 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_config_schemas.py            |
|                                                                        |
| Blocked By: S1-002, S1-003, S1-004 (Gemini), S1-005 (Gemini),        |
|             S1-006 (Gemini), S1-007                                    |
+-----------------------------------------------------------------------+
```

---

## SPRINT 2 — Core Pipeline (Week 2)

### S2-002: Provenance Tagger Tests
```
+-----------------------------------------------------------------------+
| ID       : S2-002                                                      |
| Title    : Write tests for provenance tagger                           |
| Epic     : E4 (Provenance)                                            |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for context_engine/provenance.py.                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_provenance.py exists                             |
|   [ ] Tests for tagProvenance():                                       |
|       - Tags data correctly with all metadata fields                   |
|       - Required fields missing -> error                               |
|   [ ] Tests for validateProvenance():                                  |
|       - Valid tag -> { valid: true }                                   |
|       - Missing required field -> { valid: false, errors }             |
|       - Invalid authority_tier -> error                                 |
|   [ ] Tests for isExpired():                                           |
|       - Fresh tag -> false                                             |
|       - Expired tag -> true                                            |
|       - No TTL -> never expires                                        |
|   [ ] Tests for createProvenanceTag():                                 |
|       - Creates valid tag from fields                                  |
|       - Auto-fills fetched_at with current time                        |
|   [ ] Tests for stripProvenance():                                     |
|       - Removes provenance metadata, returns raw data                  |
|   [ ] Minimum 20 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_provenance.py                |
|                                                                        |
| Blocked By: S2-001 (Claude: provenance tagger)                         |
+-----------------------------------------------------------------------+
```

### S2-005: Budget Allocator Tests
```
+-----------------------------------------------------------------------+
| ID       : S2-005                                                      |
| Title    : Write tests for budget allocator                            |
| Epic     : E5 (Budget)                                                 |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for context_engine/budget.py.                                |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_budget.py exists                                 |
|   [ ] Tests for allocateBudget():                                      |
|       - Normal allocation within limits                                |
|       - Overflow triggers compression                                   |
|       - Never-compress items preserved during overflow                  |
|   [ ] Tests for countTokens():                                         |
|       - Empty string -> 0                                              |
|       - Known text -> expected count                                   |
|       - Unicode text handled                                           |
|   [ ] Tests for handleOverflow():                                      |
|       - Compresses in priority order (lowest first)                    |
|       - Stops when within budget                                       |
|       - Reports strategy used                                          |
|   [ ] Tests for getBudgetForProfile():                                 |
|       - "lightweight" profile -> reduced allocations                   |
|       - "standard" profile -> default allocations                      |
|       - "compact" profile -> minimal allocations                       |
|       - Unknown profile -> error                                       |
|   [ ] Minimum 20 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_budget.py                    |
|                                                                        |
| Blocked By: S2-004 (Claude: budget allocator)                          |
+-----------------------------------------------------------------------+
```

### S2-007: Context Scoper Tests
```
+-----------------------------------------------------------------------+
| ID       : S2-007                                                      |
| Title    : Write tests for context scoper                              |
| Epic     : E6 (Scoping)                                                |
| Points   : 2                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for context_engine/scoper.py.                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_scoper.py exists                                 |
|   [ ] Tests for scopeByDomain():                                       |
|       - NPA domain -> filters to NPA + platform data                   |
|       - ORM domain -> filters to ORM + platform data                   |
|       - Unknown domain -> error                                        |
|   [ ] Tests for scopeByEntity():                                       |
|       - Scopes by project_id for NPA                                   |
|       - Scopes by incident_id for ORM                                  |
|       - Multiple entity IDs handled                                    |
|   [ ] Tests for scopeByJurisdiction():                                 |
|       - SG jurisdiction -> SG + GLOBAL data                            |
|       - Unknown jurisdiction -> GLOBAL only                            |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_scoper.py                    |
|                                                                        |
| Blocked By: S2-006 (Gemini: context scoper)                            |
+-----------------------------------------------------------------------+
```

### S2-010: Assembler Tests (Edge Cases)
```
+-----------------------------------------------------------------------+
| ID       : S2-010                                                      |
| Title    : Write assembler tests (edge cases + failures)               |
| Epic     : E7 (Assembly)                                               |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Edge case and failure mode tests for context_engine/assembler.py.               |
|   Complement to S2-009 (Gemini: happy path tests).                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_assembler_edge.py exists                         |
|   [ ] Tests for failure scenarios:                                     |
|       - Adapter throws -> graceful degradation                         |
|       - Adapter returns empty -> handle missing data                   |
|       - Adapter times out -> timeout handling                          |
|   [ ] Tests for edge cases:                                            |
|       - Zero entity data -> still assembles                            |
|       - Massive data -> budget overflow handled                        |
|       - No KB chunks -> still valid                                    |
|       - Unknown archetype -> error                                     |
|       - Missing required context -> validation fails                   |
|   [ ] Tests for adapter interface:                                     |
|       - Mock adapter called with correct params                        |
|       - Adapter results tagged with provenance                         |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_assembler_edge.py            |
|                                                                        |
| Blocked By: S2-008 (Claude: core assembler)                            |
+-----------------------------------------------------------------------+
```

---

## SPRINT 3 — Memory, Observability & Domain Config (Week 3)

### S3-005: Tracer Tests
```
+-----------------------------------------------------------------------+
| ID       : S3-005                                                      |
| Title    : Write tests for observability tracer                        |
| Epic     : E9 (Observability)                                          |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for context_engine/tracer.py.                                     |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_tracer.py exists                                 |
|   [ ] Tests for createTrace():                                         |
|       - Returns trace with unique ID                                   |
|       - Contains start_time                                            |
|   [ ] Tests for addStageEvent():                                       |
|       - Appends stage with name + duration                             |
|       - Maintains stage order                                          |
|   [ ] Tests for finalizeTrace():                                       |
|       - Calculates total duration                                      |
|       - Contains all stage events                                      |
|   [ ] Tests for getTraceMetrics():                                     |
|       - Returns per-stage timing                                       |
|       - Returns total token count                                      |
|   [ ] Minimum 12 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_tracer.py                    |
|                                                                        |
| Blocked By: S3-004 (Gemini: observability tracer)                      |
+-----------------------------------------------------------------------+
```

### S3-006: NPA Domain Config
```
+-----------------------------------------------------------------------+
| ID       : S3-006                                                      |
| Title    : Create NPA domain context configuration                     |
| Epic     : E10 (Domain Configs)                                        |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full NPA domain config — what context sources, scoping rules,        |
|   and untrusted content rules apply to NPA agents.                     |
|   Reference: Blueprint Section 2.3 (NPA domain) + Context Config      |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] domains/npa.json exists with:                                    |
|       - domain_id: "NPA"                                               |
|       - display_name: "New Product Approval"                           |
|       - primary_entity: "project_id"                                   |
|       - context_sources[]:                                             |
|           type: system_of_record, tool: npa_data.get_project_details   |
|           type: bank_sops, corpus: npa_policies_and_sops               |
|           type: regulatory, corpus: npa_regulatory_refs                |
|       - scoping_fields: [project_id, jurisdiction, product_type]       |
|       - untrusted_content: [user_free_text, uploaded_documents]        |
|       - agents[]: list of NPA agents with their archetypes             |
|       - grounding_overrides: NPA-specific citation requirements        |
|   [ ] Valid JSON, parseable                                            |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/domains/npa.json                             |
|                                                                        |
| Blocked By: S2-008 (Claude: assembler — to understand domain format)   |
| Blocks: S3-007 (Gemini: NPA config tests), S3-009 (Claude: e2e test)  |
+-----------------------------------------------------------------------+
```

### S3-008: Example "Demo" Domain Config
```
+-----------------------------------------------------------------------+
| ID       : S3-008                                                      |
| Title    : Create example "demo" domain config                         |
| Epic     : E10 (Domain Configs)                                        |
| Points   : 1                                                          |
| Priority : P2                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Minimal domain config for testing and documentation purposes.        |
|   Shows the minimum viable domain config structure.                    |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] domains/demo.json exists with:                                   |
|       - domain_id: "DEMO"                                              |
|       - primary_entity: "demo_id"                                      |
|       - Minimal context_sources (1 source)                             |
|       - Simple scoping (1 field)                                       |
|       - Comments explaining each field                                 |
|   [ ] Can be loaded by assembler for testing                           |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/domains/demo.json                            |
|                                                                        |
| Blocked By: S2-008 (Claude: assembler)                                 |
+-----------------------------------------------------------------------+
```

---

## SPRINT 4 — Integration Bridge & Hardening (Week 4)

### S4-004: Circuit Breaker Tests
```
+-----------------------------------------------------------------------+
| ID       : S4-004                                                      |
| Title    : Write tests for circuit breaker                             |
| Epic     : E12 (Failure Modes)                                        |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for circuit breaker module.                            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_circuit_breaker.py exists                        |
|   [ ] Tests for state transitions:                                     |
|       - CLOSED -> OPEN (after N failures)                              |
|       - OPEN -> HALF-OPEN (after cooldown)                             |
|       - HALF-OPEN -> CLOSED (on success)                               |
|       - HALF-OPEN -> OPEN (on failure)                                 |
|   [ ] Tests for behavior:                                              |
|       - Calls pass through in CLOSED state                             |
|       - Calls short-circuit in OPEN state                              |
|       - Single probe call in HALF-OPEN state                           |
|       - Fallback invoked on open circuit                               |
|   [ ] Tests for configuration:                                         |
|       - Custom failure threshold                                       |
|       - Custom cooldown period                                         |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_circuit_breaker.py           |
|                                                                        |
| Blocked By: S4-003 (Gemini: circuit breaker module)                    |
+-----------------------------------------------------------------------+
```

### S4-005: Failure Mode Tests (All 8 Modes)
```
+-----------------------------------------------------------------------+
| ID       : S4-005                                                      |
| Title    : Write failure mode tests for all 8 failure modes            |
| Epic     : E12 (Failure Modes)                                        |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test all 8 failure modes from Blueprint Section 12.                  |
|   Each mode must have degradation + mitigation tests.                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_failure_modes.py exists                          |
|   [ ] Tests for each failure mode:                                     |
|       1. MCP tool unreachable -> stale cache / fallback                |
|       2. KB search returns empty -> proceed without KB                 |
|       3. Token budget exceeded -> overflow compression                  |
|       4. Provenance missing -> flag as ungrounded                      |
|       5. Trust classification ambiguous -> default UNTRUSTED           |
|       6. Session state corrupted -> start fresh session                |
|       7. Cross-domain conflict -> domain boundary enforcement          |
|       8. Source authority conflict -> higher tier wins                  |
|   [ ] Each mode tests:                                                 |
|       - Detection (mode is correctly identified)                       |
|       - Degradation (system continues with reduced quality)            |
|       - Mitigation (correct fallback applied)                          |
|       - Logging (failure is traced)                                    |
|   [ ] Minimum 24 tests (3 per mode)                                    |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_failure_modes.py             |
|                                                                        |
| Blocked By: S4-001 (Claude: bridge), S4-003 (Gemini: circuit breaker) |
+-----------------------------------------------------------------------+
```

### S4-007: MCP Provenance Wrapper Tests
```
+-----------------------------------------------------------------------+
| ID       : S4-007                                                      |
| Title    : Write tests for MCP provenance wrapper                      |
| Epic     : E4 (Provenance)                                            |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for the MCP tool provenance wrapper.                   |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_mcp_provenance.py exists                         |
|   [ ] Tests:                                                           |
|       - Wrapper adds provenance tags to tool results                   |
|       - source_type set to "system_of_record"                          |
|       - authority_tier set to 1                                         |
|       - trust_class set to "TRUSTED"                                   |
|       - fetched_at is current timestamp                                |
|       - Tool errors propagated correctly                               |
|       - Empty tool results handled                                     |
|   [ ] Minimum 10 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_mcp_provenance.py            |
|                                                                        |
| Blocked By: S4-006 (Gemini: MCP provenance wrapper)                    |
+-----------------------------------------------------------------------+
```

---

## SPRINT 5 — Admin Dashboard & RAG (Week 5)

### S5-003: Grounding Scorer Tests
```
+-----------------------------------------------------------------------+
| ID       : S5-003                                                      |
| Title    : Write tests for grounding scorer                            |
| Epic     : E14 (RAG)                                                   |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Test coverage for context_engine/grounding.py.                                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_grounding.py exists                              |
|   [ ] Tests for scoreGrounding():                                      |
|       - Fully grounded response -> score 1.0                           |
|       - Partially grounded -> score 0.5-0.9                            |
|       - No citations -> score 0.0                                      |
|       - Mixed grounded/ungrounded claims                               |
|   [ ] Tests for identifyClaims():                                      |
|       - Extracts claims from response text                             |
|       - Handles no claims (general text)                               |
|   [ ] Tests for verifyClaim():                                         |
|       - 5 verification steps each tested                               |
|       - Expired source -> step 4 fails                                 |
|       - Insufficient authority -> step 5 fails                         |
|   [ ] Minimum 18 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_grounding.py                 |
|                                                                        |
| Blocked By: S5-002 (Claude: grounding scorer)                          |
+-----------------------------------------------------------------------+
```

### S5-006: Dashboard — Context Traces Tab
```
+-----------------------------------------------------------------------+
| ID       : S5-006                                                      |
| Title    : Build dashboard context traces tab (Angular)                |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing recent context assembly traces.            |
|   Table with drill-down into individual trace details.                 |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-traces-tab.component.ts exists                |
|   [ ] Shows table: trace_id | agent | domain | stages | duration      |
|   [ ] Click trace -> expands to show 7-stage breakdown                 |
|   [ ] Each stage shows: name, duration_ms, items_processed,           |
|       items_kept, tokens_used                                          |
|   [ ] Calls GET /api/context/traces                                    |
|   [ ] Loading + error states handled                                   |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-traces-tab.component.ts    |
|   src/app/platform/components/admin/context-traces-tab.component.html  |
|   src/app/platform/components/admin/context-traces-tab.component.scss  |
|                                                                        |
| Blocked By: S5-001 (Claude: admin API routes)                          |
+-----------------------------------------------------------------------+
```

### S5-007: Dashboard — Context Quality Tab
```
+-----------------------------------------------------------------------+
| ID       : S5-007                                                      |
| Title    : Build dashboard context quality tab (Angular)               |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing grounding quality scores over time.        |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-quality-tab.component.ts exists               |
|   [ ] Shows: overall grounding score (0-1), per-agent scores          |
|   [ ] Shows: claims checked, claims grounded, ungrounded claims list  |
|   [ ] Calls GET /api/context/quality                                   |
|   [ ] Loading + error states handled                                   |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-quality-tab.component.ts   |
|   src/app/platform/components/admin/context-quality-tab.component.html |
|   src/app/platform/components/admin/context-quality-tab.component.scss |
|                                                                        |
| Blocked By: S5-001 (Claude: admin API), S5-002 (Claude: grounding)     |
+-----------------------------------------------------------------------+
```

---

## SPRINT 6 — Multi-Domain & Polish (Week 6)

### S6-001: Desk Support Domain Config
```
+-----------------------------------------------------------------------+
| ID       : S6-001                                                      |
| Title    : Create Desk Support domain config                           |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Domain config for Desk Support — proves engine is domain-agnostic.   |
|   Reference: Blueprint Section 2.3 (DESK domain)                      |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] domains/desk.json exists with:                                   |
|       - domain_id: "DESK"                                              |
|       - primary_entity: "counterparty_id"                              |
|       - context_sources: onboarding, credit, documentation systems     |
|       - scoping_fields: [counterparty_id, business_unit, product]      |
|       - untrusted_content: [user_free_text, retrieved_emails]          |
|       - agents[]: DESK_ORCH, triage, resolver, escalation              |
|   [ ] Valid JSON, parseable                                            |
|   [ ] Can be loaded by assembler                                       |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/domains/desk.json                            |
|                                                                        |
| Blocked By: S3-006 (self: NPA domain config — use as template)         |
| Blocks: S6-003 (self: validation tests)                                |
+-----------------------------------------------------------------------+
```

### S6-003: Domain Config Validation Tests
```
+-----------------------------------------------------------------------+
| ID       : S6-003                                                      |
| Title    : Write domain config validation tests                        |
| Epic     : E15 (Multi-Domain)                                         |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Tests validating all domain configs (NPA, Desk, ORM) have           |
|   consistent structure and can be loaded by the assembler.             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/test_domain_configs.py exists                         |
|   [ ] Tests for each domain config:                                    |
|       - Has required fields (domain_id, primary_entity, etc.)          |
|       - context_sources are valid source types                         |
|       - scoping_fields are non-empty strings                           |
|       - agents list is non-empty                                       |
|   [ ] Cross-domain consistency:                                        |
|       - No duplicate domain_ids                                        |
|       - All use same schema structure                                  |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/test_domain_configs.py            |
|                                                                        |
| Blocked By: S6-001 (self: Desk config), S6-002 (Gemini: ORM config)   |
+-----------------------------------------------------------------------+
```

### S6-005: Dashboard — Trust & Scoping Tab
```
+-----------------------------------------------------------------------+
| ID       : S6-005                                                      |
| Title    : Build dashboard trust & scoping tab (Angular)               |
| Epic     : E13 (Dashboard)                                            |
| Points   : 3                                                          |
| Priority : P2                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Angular component showing trust classification and scoping stats.    |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] Component: context-trust-tab.component.ts exists                 |
|   [ ] Shows: trust classification rules (loaded from config)           |
|   [ ] Shows: recent classification decisions with input/output         |
|   [ ] Shows: active domain scoping (which domains are loaded)          |
|   [ ] Calls GET /api/context/sources                                   |
|   [ ] Loading + error states handled                                   |
|                                                                        |
| Files Created:                                                         |
|   src/app/platform/components/admin/context-trust-tab.component.ts     |
|   src/app/platform/components/admin/context-trust-tab.component.html   |
|   src/app/platform/components/admin/context-trust-tab.component.scss   |
|                                                                        |
| Blocked By: S5-001 (Claude: admin API routes)                          |
+-----------------------------------------------------------------------+
```

---

*Total: 19 stories, 55 points across 6 sprints. I own all tests, config files, and dashboard UI components.*
