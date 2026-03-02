# Context Engine — Sprint Plan & Project Board
## Multi-Agent Scrum Execution Plan

**Product:** `@coo/context-engine` (standalone package)
**Repo path:** `packages/context-engine/`
**Branch:** `feature/context-engine`
**Sprint cadence:** 1-week sprints
**Team:** Claude Code (Architect/Lead), Codex (Builder), Gemini (Builder)

---

## Agent Roles & Rules of Engagement

```
+===============+==================+============================================+
| Agent         | Role             | Strengths / Best Used For                  |
+===============+==================+============================================+
| Claude Code   | Architect + Lead | - Complex multi-file changes               |
|               |                  | - Architecture decisions                   |
|               |                  | - Integration work (wiring pieces together)|
|               |                  | - Code review of Codex/Gemini output       |
|               |                  | - Debugging cross-module issues            |
|               |                  | - Blueprint --> code translation           |
+---------------+------------------+--------------------------------------------+
| Codex         | Builder          | - Isolated file creation (given clear spec)|
|               |                  | - Test writing (given module + contract)   |
|               |                  | - Config file creation (given schema)      |
|               |                  | - Repetitive patterns across many files    |
|               |                  | - Documentation generation                 |
+---------------+------------------+--------------------------------------------+
| Gemini        | Builder          | - Isolated file creation (given clear spec)|
|               |                  | - Test writing (given module + contract)   |
|               |                  | - Config file creation (given schema)      |
|               |                  | - Research + validation                    |
|               |                  | - Schema design + JSON structure           |
+===============+==================+============================================+
```

### Critical Rule: No File Collisions

```
+===========================================================================+
|  RULE: Two agents NEVER work on the same file simultaneously.             |
|                                                                            |
|  Every user story produces files that are EXCLUSIVE to that story.         |
|  If Story A creates src/trust.js and Story B creates src/budget.js,       |
|  they can run in parallel. If both touch src/index.js, they CANNOT.       |
|                                                                            |
|  The index.js (public API) is ALWAYS done by Claude Code LAST,            |
|  after all modules are built and tested.                                   |
+===========================================================================+
```

---

## Product Backlog — Epic & Story Breakdown

### Epic Map (Blueprint Section --> Epic)

```
+======+=====================================+====================+=========+
| Epic | Name                                | Blueprint Section  | Sprint  |
+======+=====================================+====================+=========+
| E1   | Project Scaffold & Foundation       | Sec 16, 18         | S1      |
| E2   | Trust & Source Authority             | Sec 5              | S1      |
| E3   | Context Contracts                   | Sec 9              | S1      |
| E4   | Provenance Engine                   | Sec 11             | S1-S2   |
| E5   | Token Budget Manager                | Sec 7              | S2      |
| E6   | Context Scoping                     | Sec 10             | S2      |
| E7   | Core Assembly Pipeline              | Sec 4              | S2-S3   |
| E8   | Memory & Session State              | Sec 8              | S3      |
| E9   | Observability & Tracing             | Sec 13             | S3      |
| E10  | Domain Configs (NPA first)          | Sec 9.3            | S3      |
| E11  | Integration Bridge (server/)        | Sec 16.2           | S4      |
| E12  | Failure Modes & Circuit Breakers    | Sec 12             | S4      |
| E13  | Admin Dashboard UI                  | Sec 14             | S5      |
| E14  | RAG Pipeline Enhancement            | Sec 6              | S5-S6   |
| E15  | Multi-Domain Expansion              | Sec 9.3, 18.2      | S6      |
+======+=====================================+====================+=========+
```

---

## SPRINT 1 — Foundation (Week 1)

**Sprint Goal:** Standalone package exists, compiles, has all config schemas,
trust engine works, contracts load and validate. Zero external dependencies beyond
gpt-tokenizer.

### S1-001: Project Scaffold
```
+-----------------------------------------------------------------------+
| ID       : S1-001                                                      |
| Title    : Create standalone package scaffold                          |
| Epic     : E1 (Scaffold)                                              |
| Agent    : Claude Code                                                 |
| Points   : 3                                                          |
| Priority : P0 — MUST be done first (all other stories depend on this) |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Create the packages/context-engine/ directory with package.json,     |
|   directory structure, and empty module stubs. This is the skeleton    |
|   that all other stories build into.                                   |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] packages/context-engine/package.json exists                      |
|       - name: "@coo/context-engine"                                    |
|       - version: "0.1.0"                                               |
|       - main: "src/index.js"                                           |
|       - scripts.test: "node --test tests/**/*.test.js"                 |
|       - dependencies: { gpt-tokenizer: "^2.8.0" }                     |
|       - NO other dependencies                                          |
|   [ ] Directory structure created (empty files OK):                    |
|       src/index.js                                                     |
|       src/assembler.js                                                 |
|       src/trust.js                                                     |
|       src/budget.js                                                    |
|       src/provenance.js                                                |
|       src/contracts.js                                                 |
|       src/scoper.js                                                    |
|       src/tracer.js                                                    |
|       config/                                                          |
|       contracts/                                                       |
|       domains/                                                         |
|       tests/unit/                                                      |
|   [ ] `npm install` succeeds in packages/context-engine/               |
|   [ ] `npm test` runs (even if 0 tests initially)                     |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/package.json                                 |
|   packages/context-engine/src/*.js  (stubs)                            |
|   packages/context-engine/tests/    (empty dir)                        |
|                                                                        |
| Blocked By: Nothing                                                    |
| Blocks: ALL other S1 stories                                           |
+-----------------------------------------------------------------------+
```

### S1-002: Source Priority Config
```
+-----------------------------------------------------------------------+
| ID       : S1-002                                                      |
| Title    : Create source priority hierarchy config                     |
| Epic     : E2 (Trust)                                                  |
| Agent    : Codex                                                       |
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
|       - SoR vs SOP → SoR wins                                         |
|       - SOP vs SOP → newer effective_date wins                        |
|       - Group vs Local policy → Group wins                            |
|       - Uncertain → flag for human review                             |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/config/source-priority.json                  |
|                                                                        |
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-003: Trust Classification Config
```
+-----------------------------------------------------------------------+
| ID       : S1-003                                                      |
| Title    : Create trust classification rules config                    |
| Epic     : E2 (Trust)                                                  |
| Agent    : Codex                                                       |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-004: Data Classification Config
```
+-----------------------------------------------------------------------+
| ID       : S1-004                                                      |
| Title    : Create data classification taxonomy config                  |
| Epic     : E2 (Trust)                                                  |
| Agent    : Gemini                                                      |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-005: Grounding Requirements Config
```
+-----------------------------------------------------------------------+
| ID       : S1-005                                                      |
| Title    : Create grounding requirements config                        |
| Epic     : E2 (Trust)                                                  |
| Agent    : Gemini                                                      |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-006: Provenance Schema
```
+-----------------------------------------------------------------------+
| ID       : S1-006                                                      |
| Title    : Create provenance tag JSON schema                           |
| Epic     : E4 (Provenance)                                            |
| Agent    : Gemini                                                      |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-007: Budget Defaults Config
```
+-----------------------------------------------------------------------+
| ID       : S1-007                                                      |
| Title    : Create token budget defaults config                         |
| Epic     : E5 (Budget)                                                 |
| Agent    : Codex                                                       |
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
|       - overflow_strategy[] (ordered by priority — compress lowest first):
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-008: Orchestrator Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-008                                                      |
| Title    : Create orchestrator context contract                        |
| Epic     : E3 (Contracts)                                              |
| Agent    : Codex                                                       |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-009: Worker Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-009                                                      |
| Title    : Create worker context contract                              |
| Epic     : E3 (Contracts)                                              |
| Agent    : Gemini                                                      |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-010: Reviewer Contract
```
+-----------------------------------------------------------------------+
| ID       : S1-010                                                      |
| Title    : Create reviewer context contract                            |
| Epic     : E3 (Contracts)                                              |
| Agent    : Gemini                                                      |
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
| Blocked By: S1-001                                                     |
+-----------------------------------------------------------------------+
```

### S1-011: Trust Engine Module
```
+-----------------------------------------------------------------------+
| ID       : S1-011                                                      |
| Title    : Build trust classifier + source ranker module               |
| Epic     : E2 (Trust)                                                  |
| Agent    : Claude Code                                                 |
| Points   : 5                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Implement the trust classification engine and source priority        |
|   ranker. This module loads the configs (S1-002, S1-003, S1-004)      |
|   and provides programmatic APIs. Ref: Blueprint 5.1-5.3              |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] src/trust.js exists with exports:                                |
|       - classifyTrust(sourceType) → "TRUSTED" | "UNTRUSTED"           |
|       - classifyDataLevel(dataType) → "PUBLIC"|"INTERNAL"|etc         |
|       - rankSources(sources[]) → sorted by authority tier              |
|       - resolveConflict(sourceA, sourceB) → winner + reason            |
|       - canUserAccess(userRole, dataClassification) → boolean          |
|       - isNeverAllowed(sourceType) → boolean                           |
|   [ ] Loads configs from config/ directory (not hardcoded)             |
|   [ ] Pure functions — no side effects, no DB, no network              |
|   [ ] All functions work with provenance-tagged objects                |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/src/trust.js                                 |
|                                                                        |
| Blocked By: S1-001, S1-002, S1-003, S1-004                            |
+-----------------------------------------------------------------------+
```

### S1-012: Trust Engine Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-012                                                      |
| Title    : Write tests for trust engine                                |
| Epic     : E2 (Trust)                                                  |
| Agent    : Codex                                                       |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for src/trust.js.                                 |
|   Must cover all functions, edge cases, and config loading.            |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/unit/trust.test.js exists                                  |
|   [ ] Tests for classifyTrust():                                       |
|       - MCP tool results → TRUSTED                                     |
|       - Bank SOPs → TRUSTED                                            |
|       - User free text → UNTRUSTED                                     |
|       - Unknown source → UNTRUSTED (safe default)                     |
|       - Never-allowed source → throws/rejects                         |
|   [ ] Tests for rankSources():                                         |
|       - Sorts T1 above T2 above T3                                    |
|       - Equal tier → preserves input order                             |
|       - Empty array → returns empty                                    |
|   [ ] Tests for resolveConflict():                                     |
|       - SoR vs SOP → SoR wins                                         |
|       - SOP vs SOP same date → newer wins                             |
|       - Group vs Local → Group wins                                   |
|       - Same tier, uncertain → returns "NEEDS_HUMAN_REVIEW"           |
|   [ ] Tests for canUserAccess():                                       |
|       - analyst + CONFIDENTIAL → true                                  |
|       - analyst + RESTRICTED → false                                   |
|       - coo + RESTRICTED → true                                       |
|   [ ] Tests for config loading:                                        |
|       - Missing config file → meaningful error                         |
|       - Malformed config → meaningful error                            |
|   [ ] Minimum 25 tests                                                 |
|   [ ] All pass with `node --test`                                      |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/unit/trust.test.js                     |
|                                                                        |
| Blocked By: S1-011                                                     |
+-----------------------------------------------------------------------+
```

### S1-013: Contract Loader Module
```
+-----------------------------------------------------------------------+
| ID       : S1-013                                                      |
| Title    : Build contract loader + validator module                    |
| Epic     : E3 (Contracts)                                              |
| Agent    : Claude Code                                                 |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Module that loads contract JSON files and validates context          |
|   packages against them. Ref: Blueprint 9.1-9.2                       |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] src/contracts.js exists with exports:                            |
|       - loadContract(archetype) → parsed contract object               |
|       - validateContext(contextPackage, contract) → {                   |
|           valid: boolean,                                              |
|           missing_required: string[],                                  |
|           unexpected_included: string[],                               |
|           warnings: string[]                                           |
|         }                                                              |
|       - getRequiredSources(contract) → source specs[]                  |
|       - getBudgetProfile(contract) → budget profile name              |
|   [ ] Validates required_context slots are present                     |
|   [ ] Warns if excluded_context slots are present                      |
|   [ ] Pure functions — loads from contracts/ directory                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/src/contracts.js                             |
|                                                                        |
| Blocked By: S1-001, S1-008, S1-009, S1-010                            |
+-----------------------------------------------------------------------+
```

### S1-014: Contract Loader Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-014                                                      |
| Title    : Write tests for contract loader                             |
| Epic     : E3 (Contracts)                                              |
| Agent    : Gemini                                                      |
| Points   : 3                                                          |
| Priority : P0                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Full test coverage for src/contracts.js.                             |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/unit/contracts.test.js exists                              |
|   [ ] Tests for loadContract():                                        |
|       - "orchestrator" loads correctly                                  |
|       - "worker" loads correctly                                       |
|       - "reviewer" loads correctly                                     |
|       - unknown archetype → meaningful error                           |
|   [ ] Tests for validateContext():                                     |
|       - All required present → valid: true                             |
|       - Missing required → valid: false + missing_required[]           |
|       - Excluded content present → valid: true + warnings[]           |
|       - Empty context → valid: false                                   |
|   [ ] Minimum 15 tests                                                 |
|                                                                        |
| Files Created:                                                         |
|   packages/context-engine/tests/unit/contracts.test.js                 |
|                                                                        |
| Blocked By: S1-013                                                     |
+-----------------------------------------------------------------------+
```

### S1-015: Config Validation Tests
```
+-----------------------------------------------------------------------+
| ID       : S1-015                                                      |
| Title    : Write schema validation tests for all config files          |
| Epic     : E1 (Scaffold)                                              |
| Agent    : Codex                                                       |
| Points   : 2                                                          |
| Priority : P1                                                          |
+-----------------------------------------------------------------------+
| Description:                                                           |
|   Validate all config JSON files load correctly and have               |
|   expected structure. Like server/tests/unit/config-files.test.js      |
|   but for the context-engine package.                                  |
|                                                                        |
| Acceptance Criteria:                                                   |
|   [ ] tests/unit/config-schemas.test.js exists                         |
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
|   packages/context-engine/tests/unit/config-schemas.test.js            |
|                                                                        |
| Blocked By: S1-002 through S1-007                                      |
+-----------------------------------------------------------------------+
```

### Sprint 1 Summary

```
+========+============================+==========+========+===============+
| ID     | Title                      | Agent    | Points | Depends On    |
+========+============================+==========+========+===============+
| S1-001 | Package scaffold           | Claude   | 3      | —             |
| S1-002 | Source priority config      | Codex    | 2      | S1-001        |
| S1-003 | Trust classification cfg   | Codex    | 2      | S1-001        |
| S1-004 | Data classification cfg    | Gemini   | 1      | S1-001        |
| S1-005 | Grounding requirements cfg | Gemini   | 2      | S1-001        |
| S1-006 | Provenance schema          | Gemini   | 2      | S1-001        |
| S1-007 | Budget defaults config     | Codex    | 1      | S1-001        |
| S1-008 | Orchestrator contract      | Codex    | 2      | S1-001        |
| S1-009 | Worker contract            | Gemini   | 2      | S1-001        |
| S1-010 | Reviewer contract          | Gemini   | 2      | S1-001        |
| S1-011 | Trust engine module        | Claude   | 5      | S1-002..004   |
| S1-012 | Trust engine tests         | Codex    | 3      | S1-011        |
| S1-013 | Contract loader module     | Claude   | 3      | S1-008..010   |
| S1-014 | Contract loader tests      | Gemini   | 3      | S1-013        |
| S1-015 | Config validation tests    | Codex    | 2      | S1-002..007   |
+========+============================+==========+========+===============+
  TOTAL POINTS: 35        Claude: 11  |  Codex: 12  |  Gemini: 12
```

```
SPRINT 1 EXECUTION ORDER:

  Day 1 (sequential):
    Claude: S1-001 (scaffold) — MUST be first

  Day 1-2 (parallel — all agents work simultaneously):
    Codex:  S1-002 + S1-003 + S1-007 + S1-008  (configs)
    Gemini: S1-004 + S1-005 + S1-006 + S1-009 + S1-010  (configs + contracts)

  Day 3-4 (parallel):
    Claude: S1-011 (trust engine)   then   S1-013 (contract loader)
    Codex:  S1-015 (config tests)   then   S1-012 (trust tests)
    Gemini: S1-014 (contract tests)

  Day 5:
    Claude: Integration — wire index.js, run full test suite, fix issues
```

---

## SPRINT 2 — Core Pipeline (Week 2)

**Sprint Goal:** Provenance tagging works, token budgeting works, context
scoping works, core assembler pipeline processes a request end-to-end
using mock adapters.

```
+========+============================+==========+========+===============+
| ID     | Title                      | Agent    | Points | Depends On    |
+========+============================+==========+========+===============+
| S2-001 | Provenance tagger module   | Claude   | 5      | S1-006        |
| S2-002 | Provenance tagger tests    | Codex    | 3      | S2-001        |
| S2-003 | Token counter module       | Gemini   | 3      | S1-007        |
| S2-004 | Budget allocator module    | Claude   | 5      | S2-003        |
| S2-005 | Budget allocator tests     | Codex    | 3      | S2-004        |
| S2-006 | Context scoper module      | Gemini   | 3      | S1-004        |
| S2-007 | Context scoper tests       | Codex    | 2      | S2-006        |
| S2-008 | Core assembler (7 stages)  | Claude   | 8      | S2-001..007   |
| S2-009 | Assembler tests (mocks)    | Gemini   | 5      | S2-008        |
| S2-010 | Assembler tests (edge)     | Codex    | 3      | S2-008        |
+========+============================+==========+========+===============+
  TOTAL POINTS: 40        Claude: 18  |  Codex: 11  |  Gemini: 11

  S2-008 is the CRITICAL PATH — the 7-stage assembler with adapter interface.
  This is the heart of the engine.
```

```
SPRINT 2 EXECUTION ORDER:

  Day 1-2 (parallel):
    Claude: S2-001 (provenance)
    Gemini: S2-003 (token counter) + S2-006 (scoper)
    Codex:  (available for any carryover from S1)

  Day 2-3 (parallel):
    Claude: S2-004 (budget allocator)
    Codex:  S2-002 (provenance tests) + S2-007 (scoper tests)
    Gemini: (available — can start S2-009 mock data prep)

  Day 3-4:
    Claude: S2-008 (CORE ASSEMBLER — this is the big one)
    Codex:  S2-005 (budget tests)

  Day 5 (parallel):
    Gemini: S2-009 (assembler tests — happy path with mocks)
    Codex:  S2-010 (assembler tests — edge cases, failures)
    Claude: Integration + fix issues
```

---

## SPRINT 3 — Memory, Observability & Domain Config (Week 3)

**Sprint Goal:** Session state management works, context traces are logged,
NPA domain config loads and validates, end-to-end pipeline test passes
with NPA mock data.

```
+========+=================================+==========+========+=============+
| ID     | Title                           | Agent    | Points | Depends On  |
+========+=================================+==========+========+=============+
| S3-001 | Session state machine module     | Claude   | 5      | S2-008      |
| S3-002 | Delegation context module        | Claude   | 3      | S3-001      |
| S3-003 | Session + delegation tests       | Gemini   | 3      | S3-001,002  |
| S3-004 | Observability tracer module      | Gemini   | 3      | S2-008      |
| S3-005 | Tracer tests                     | Codex    | 2      | S3-004      |
| S3-006 | NPA domain config                | Codex    | 3      | S2-008      |
| S3-007 | NPA domain config tests          | Gemini   | 2      | S3-006      |
| S3-008 | Example domain: "demo" config    | Codex    | 1      | S2-008      |
| S3-009 | End-to-end pipeline test (NPA)   | Claude   | 5      | S3-001..007 |
| S3-010 | Public API index.js finalization | Claude   | 3      | ALL above   |
+========+=================================+==========+========+=============+
  TOTAL POINTS: 30        Claude: 16  |  Codex: 6   |  Gemini: 8
```

---

## SPRINT 4 — Integration Bridge & Hardening (Week 4)

**Sprint Goal:** The context engine is wired into the actual Express server
via a thin bridge. Dify proxy calls go through the assembler. Circuit
breakers handle failures gracefully.

```
+========+=================================+==========+========+=============+
| ID     | Title                           | Agent    | Points | Depends On  |
+========+=================================+==========+========+=============+
| S4-001 | Context bridge (server adapter)  | Claude   | 5      | S3-010      |
| S4-002 | Wire bridge into dify-proxy.js   | Claude   | 5      | S4-001      |
| S4-003 | Circuit breaker module           | Gemini   | 3      | S2-008      |
| S4-004 | Circuit breaker tests            | Codex    | 3      | S4-003      |
| S4-005 | Failure mode tests (all 8 modes) | Codex    | 5      | S4-001..003 |
| S4-006 | MCP tool provenance wrapper      | Gemini   | 3      | S2-001      |
| S4-007 | Provenance wrapper tests         | Codex    | 2      | S4-006      |
| S4-008 | Integration test (live server)   | Claude   | 5      | S4-001..007 |
+========+=================================+==========+========+=============+
  TOTAL POINTS: 31        Claude: 15  |  Codex: 10  |  Gemini: 6
```

---

## SPRINT 5 — Admin Dashboard & RAG (Week 5)

**Sprint Goal:** Admin can see pipeline health, traces, and quality scores
via Angular UI. RAG pipeline uses 2-stage retrieval with Dify KBs.

```
+========+=================================+==========+========+=============+
| ID     | Title                           | Agent    | Points | Depends On  |
+========+=================================+==========+========+=============+
| S5-001 | Context admin API routes         | Claude   | 3      | S4-001      |
| S5-002 | Grounding scorer module          | Claude   | 5      | S2-001      |
| S5-003 | Grounding scorer tests           | Codex    | 3      | S5-002      |
| S5-004 | Dashboard: pipeline health tab   | Gemini   | 3      | S5-001      |
| S5-005 | Dashboard: source registry tab   | Gemini   | 3      | S5-001      |
| S5-006 | Dashboard: context traces tab    | Codex    | 3      | S5-001      |
| S5-007 | Dashboard: context quality tab   | Codex    | 3      | S5-002      |
| S5-008 | Chat citation panel component    | Gemini   | 3      | S2-001      |
| S5-009 | 2-stage RAG pipeline design      | Claude   | 5      | S3-006      |
| S5-010 | RAG: Dify KB restructuring plan  | Claude   | 3      | S5-009      |
+========+=================================+==========+========+=============+
  TOTAL POINTS: 34        Claude: 16  |  Codex: 9   |  Gemini: 9
```

---

## SPRINT 6 — Multi-Domain & Polish (Week 6)

**Sprint Goal:** At least one additional domain config (Desk Support or ORM)
proves the engine is truly domain-agnostic. Full regression passes.

```
+========+=================================+==========+========+=============+
| ID     | Title                           | Agent    | Points | Depends On  |
+========+=================================+==========+========+=============+
| S6-001 | Desk Support domain config       | Codex    | 2      | S3-006      |
| S6-002 | ORM domain config                | Gemini   | 2      | S3-006      |
| S6-003 | Domain config validation tests   | Codex    | 2      | S6-001,002  |
| S6-004 | Domain onboarding playbook doc   | Gemini   | 2      | S6-001,002  |
| S6-005 | Dashboard: trust & scoping tab   | Codex    | 3      | S5-001      |
| S6-006 | Dashboard: contracts tab         | Gemini   | 3      | S5-001      |
| S6-007 | Full regression test suite       | Claude   | 5      | ALL         |
| S6-008 | Performance benchmarks           | Claude   | 3      | S4-008      |
| S6-009 | Merge PR preparation             | Claude   | 3      | ALL         |
+========+=================================+==========+========+=============+
  TOTAL POINTS: 25        Claude: 11  |  Codex: 7   |  Gemini: 7
```

---

## Velocity & Tracking

```
+==========+=================+================+=================================+
| Sprint   | Total Points    | Agent Split    | Sprint Goal                      |
+==========+=================+================+=================================+
| S1       | 35 pts          | C:11 X:12 G:12| Configs + Trust + Contracts      |
| S2       | 40 pts          | C:18 X:11 G:11| Core pipeline end-to-end         |
| S3       | 30 pts          | C:16 X:6  G:8 | Memory + NPA domain + e2e test   |
| S4       | 31 pts          | C:15 X:10 G:6 | Integration bridge + hardening   |
| S5       | 34 pts          | C:16 X:9  G:9 | Admin dashboard + RAG            |
| S6       | 25 pts          | C:11 X:7  G:7 | Multi-domain + merge             |
+==========+=================+================+=================================+
| TOTAL    | 195 pts         | C:87 X:55 G:53| Full context engine shipped      |
+==========+=================+================+=================================+

Claude Code : 87 pts (45%) — Architect role: complex modules + integration
Codex       : 55 pts (28%) — Builder role: tests + configs + UI components
Gemini      : 53 pts (27%) — Builder role: configs + modules + UI components
```

---

## Definition of Done (Per Story)

```
[ ] Code written and saved to correct file path
[ ] No imports from server/, src/app/, or shared/ (isolation check)
[ ] All functions exported from module
[ ] Unit tests written (by separate agent)
[ ] All tests pass: node --test (in packages/context-engine/)
[ ] No new dependencies added (unless explicitly approved in story)
[ ] Config files are valid JSON (parseable)
[ ] Code has JSDoc comments on all public functions
```

## Definition of Done (Per Sprint)

```
[ ] All stories in sprint are DONE
[ ] Full test suite passes: cd packages/context-engine && npm test
[ ] Zero imports from outside packages/context-engine/
[ ] Sprint demo: show one end-to-end flow working
[ ] Sprint retro: what worked, what didn't, adjust next sprint
```

---

## How to Give Work to Each Agent

### Prompt Template for Codex/Gemini

When assigning a story, give this context:

```
PROJECT: @coo/context-engine (standalone context engineering package)
LOCATION: packages/context-engine/ (within the agent-command-hub-angular repo)
BRANCH: feature/context-engine

STORY: [story ID and title]

RULES:
1. All files go under packages/context-engine/
2. NEVER import from server/, src/app/, or shared/
3. Use Node.js built-in test runner (node:test + node:assert/strict)
4. Zero external dependencies (unless story explicitly says otherwise)
5. All public functions need JSDoc comments
6. Config files must be valid JSON

SPEC: [paste the acceptance criteria from the story]

FILES TO CREATE: [list from story]
FILES YOU MAY READ (for reference only): [list any existing files]
```

### Handoff Pattern

```
  Claude creates scaffold (S1-001)
       |
       +---> Codex gets: "Create these config files, here's the spec"
       +---> Gemini gets: "Create these config files, here's the spec"
       |
  Claude builds module using those configs
       |
       +---> Codex gets: "Write tests for this module, here's the API"
       +---> Gemini gets: "Write tests for this module, here's the API"
       |
  Claude integrates and runs full suite
```

---

*This document is the project execution plan. Update story statuses as work progresses. Review and adjust velocity after Sprint 1.*
