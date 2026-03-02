# Context Engine — Sprint Overview & Shared Context

**Product:** `coo-context-engine` (standalone Python package)
**Repo path:** `packages/context-engine/`
**Branch:** `feature/context-engine`
**Language:** Python 3.11+ (pytest, tiktoken)
**Sprint cadence:** 1-week sprints
**Team:** Claude Code (Architect/Lead), Codex (Builder), Gemini (Builder)

> **This file is the shared reference for ALL agents.**
> Each agent also has their own stories file — read ONLY your own:
> - `CLAUDE-CODE-STORIES.md` (87 pts across 6 sprints)
> - `CODEX-STORIES.md` (55 pts across 6 sprints)
> - `GEMINI-STORIES.md` (53 pts across 6 sprints)

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
|  If Story A creates context_engine/trust.py and Story B creates           |
|  context_engine/budget.py, they can run in parallel. If both touch        |
|  context_engine/__init__.py, they CANNOT.                                  |
|                                                                            |
|  The __init__.py (public API) is ALWAYS done by Claude Code LAST,         |
|  after all modules are built and tested.                                   |
+===========================================================================+
```

---

## Epic Map (Blueprint Section --> Epic)

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

## Sprint Goals & Execution Order

### SPRINT 1 — Foundation (Week 1) | 35 pts ✅ COMPLETE

**Goal:** Standalone Python package exists, installs, has all config schemas,
trust engine works, contracts load and validate. Zero external dependencies
beyond tiktoken.

**Status:** ALL 15/15 stories DONE. 160 tests passing. Guardian audit PASSED.

**Note:** Sprint 1 was rewritten from JS to Python 3.11+ by Claude Code.
All modules, configs, and tests are Python. Tech stack change is permanent.

```
COMPLETED:
  S1-001 ✅  Scaffold           (Claude)   pyproject.toml + package structure
  S1-002 ✅  source-priority    (Codex)    5-tier hierarchy config
  S1-003 ✅  trust-classif.     (Codex)    TRUSTED/UNTRUSTED rules
  S1-004 ✅  data-classif.      (Gemini)   4-level taxonomy
  S1-005 ✅  grounding-req.     (Gemini)   Citation requirements
  S1-006 ✅  provenance-schema  (Gemini)   Provenance tag schema
  S1-007 ✅  budget-defaults    (Codex)    Token budget config
  S1-008 ✅  orchestrator.json  (Codex)    Orchestrator contract
  S1-009 ✅  worker.json        (Gemini)   Worker contract
  S1-010 ✅  reviewer.json      (Gemini)   Reviewer contract
  S1-011 ✅  trust.py           (Claude)   263 lines, 8 public functions
  S1-012 ✅  test_trust.py      (Claude)   42 tests
  S1-013 ✅  contracts.py       (Claude)   242 lines, 8 public functions
  S1-014 ✅  test_contracts.py  (Claude)   52 tests
  S1-015 ✅  config validation  (Claude)   Covered in test_contracts.py

  Guardian audit: 5 findings fixed (C-001, H-001, H-002, H-003, M-004)
  Test suite: 160/160 passing in 0.13s
```

### SPRINT 2 — Core Pipeline (Week 2) | 40 pts ✅ COMPLETE

**Goal:** Provenance tagging works, token budgeting works, context
scoping works, core assembler pipeline processes a request end-to-end
using mock adapters.

**Status:** ALL 10/10 stories DONE. Guardian audit PASSED (39 findings raised, all fixed).

```
COMPLETED:
  S2-001 ✅  provenance.py       (Claude)   364 lines, 9 public functions
  S2-002 ✅  test_provenance.py  (Codex)    461 lines, 66 tests
  S2-003 ✅  token_counter.py    (Gemini)   180 lines, cl100k_base default
  S2-004 ✅  budget.py           (Claude)   343 lines, 3 budget profiles
  S2-005 ✅  test_budget.py      (Codex)    62 tests
  S2-006 ✅  scoper.py           (Gemini)   275 lines, 6-dimension filtering
  S2-007 ✅  test_scoper.py      (Codex)    206 lines, 41 tests
  S2-008 ✅  assembler.py        (Claude)   351 lines, 7-stage pipeline
  S2-009 ✅  test_asm_happy.py   (Gemini)   449 lines, 26 tests
  S2-010 ✅  test_asm_edge.py    (Codex)    411 lines, 23 tests

  Guardian audit: 39 findings across 2 rounds, all fixed
  Test suite: 505/505 passing
```

### SPRINT 3 — Memory, Observability & Domain Config (Week 3) | 30 pts ✅ COMPLETE

**Goal:** Session state management works, context traces are logged,
NPA domain config loads and validates, end-to-end pipeline test passes
with NPA mock data.

**Status:** ALL 10/10 stories DONE. Guardian audit PASSED (14 findings raised, all fixed).

```
COMPLETED:
  S3-001 ✅  memory.py          (Claude)   454 lines, session management
  S3-002 ✅  delegation.py      (Claude)   284 lines, agent-to-agent context
  S3-003 ✅  test_memory/deleg  (Gemini)   128+195 lines, 18 tests
  S3-004 ✅  tracer.py          (Gemini)   241 lines, request-level tracing
  S3-005 ✅  test_tracer.py     (Codex)    263 lines, 12+ tests
  S3-006 ✅  npa.json           (Codex)    NPA domain config
  S3-007 ✅  test_npa_config.py (Gemini)   84 lines, 10 tests
  S3-008 ✅  demo.json          (Codex)    Demo domain config
  S3-009 ✅  test_pipeline_npa  (Claude)   611 lines, e2e pipeline test
  S3-010 ✅  __init__.py        (Claude)   240 lines, public API

  Guardian audit: 14 findings, all fixed (tracer rewrite, demo.json schema)
  Test suite: 541/541 passing
```

### SPRINT 4 — Integration Bridge & Hardening (Week 4) | 31 pts ✅ COMPLETE

**Goal:** The context engine is wired into the Node.js server
via a thin bridge. Dify proxy calls go through the assembler. Circuit
breakers handle failures gracefully.

**Status:** ALL 8/8 stories DONE. Guardian audit PASSED (9 findings, all fixed).

```
COMPLETED:
  S4-001 ✅  context-bridge.js  (Claude)   216 lines, Node↔Python subprocess
  S4-002 ✅  dify-proxy wiring  (Claude)   Trace recording on assembly
  S4-003 ✅  circuit_breaker.py (Gemini)   131 lines, CLOSED→OPEN→HALF_OPEN
  S4-004 ✅  test_circuit_br.py (Codex)    225 lines, 15 tests
  S4-005 ✅  test_failure_modes (Codex)    330 lines, 24 tests (8 failure modes)
  S4-006 ✅  mcp_provenance.py  (Gemini)   75 lines, deny-by-default T5/UNTRUSTED
  S4-007 ✅  test_mcp_prov.py   (Codex)    94 lines, 10 tests
  S4-008 ✅  test_server_bridge (Claude)   386 lines, integration test

  Guardian audit: 9 findings, all fixed (deny-by-default, feature flag tests)
  Test suite: 551/551 passing
```

### SPRINT 5 — Admin Dashboard & RAG (Week 5) | 34 pts ✅ COMPLETE

**Goal:** Admin can see pipeline health, traces, and quality scores
via Angular UI. RAG pipeline uses 2-stage retrieval with Dify KBs.

**Status:** ALL 10/10 stories DONE. Guardian audit PASSED (7 findings, 6 fixed, 1 accepted).

```
COMPLETED:
  S5-001 ✅  context-admin.js   (Claude)   297 lines, 7 admin API routes
  S5-002 ✅  grounding.py       (Claude)   397 lines, 5-step verification
  S5-003 ✅  test_grounding.py  (Codex)    361 lines, grounding tests
  S5-004 ✅  health tab         (Gemini)   Angular context-health-tab
  S5-005 ✅  sources tab        (Gemini)   Angular context-sources-tab
  S5-006 ✅  traces tab         (Codex)    Angular context-traces-tab
  S5-007 ✅  quality tab        (Codex)    Angular context-quality-tab
  S5-008 ✅  citation panel     (Gemini)   Angular citation-panel (shared)
  S5-009 ✅  rag.py             (Claude)   361 lines, 2-stage RAG pipeline
  S5-010 ✅  KB restructure     (Claude)   Dify KB restructuring plan

  Guardian audit: 7 findings (6 fixed, 1 accepted — recordTrace wiring)
  Test suite: 551/551 passing
```

### SPRINT 6 — Multi-Domain & Polish (Week 6) | 25 pts ✅ COMPLETE

**Goal:** At least one additional domain config (Desk Support or ORM)
proves the engine is truly domain-agnostic. Full regression passes.

**Status:** ALL 9/9 stories DONE. Guardian audit PASSED (14 findings, all fixed + re-audit verified).

```
COMPLETED:
  S6-001 ✅  desk.json          (Codex)    69 lines, counterparty domain
  S6-002 ✅  orm.json           (Gemini)   107 lines, operational risk (9 agents)
  S6-003 ✅  test_domain_cfgs   (Codex)    163 lines, canonical validation
  S6-004 ✅  PLAYBOOK           (Gemini)   201 lines, domain onboarding guide
  S6-005 ✅  trust tab          (Codex)    Angular context-trust-tab
  S6-006 ✅  contracts tab      (Gemini)   Angular context-contracts-tab
  S6-007 ✅  regression tests   (Claude)   621 lines, 33 tests across 11 categories
  S6-008 ✅  benchmarks         (Claude)   496 lines, 15 perf benchmarks
  S6-009 ✅  merge PR prep      (Claude)   CHANGELOG, pyproject.toml, merge

  Guardian audit: 14 findings + 5 RA-series in re-audit = all resolved
  Test suite: 551/551 passing
  Re-audit: PASS ✅ — all 90 findings verified
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

## Dependency Graph (Cross-Agent)

```
S1-001 (Claude: scaffold)
  |
  +-------> S1-002 (Codex)  ---+
  +-------> S1-003 (Codex)  ---+---> S1-011 (Claude: trust engine) --> S1-012 (Codex: tests)
  +-------> S1-004 (Gemini) ---+
  +-------> S1-007 (Codex)
  +-------> S1-005 (Gemini)
  +-------> S1-006 (Gemini) ----> S2-001 (Claude: provenance)
  +-------> S1-008 (Codex)  ---+
  +-------> S1-009 (Gemini) ---+---> S1-013 (Claude: contracts) --> S1-014 (Gemini: tests)
  +-------> S1-010 (Gemini) ---+

S2-001 (Claude: provenance) --> S2-002 (Codex: tests)
S2-003 (Gemini: token counter) --> S2-004 (Claude: budget) --> S2-005 (Codex: tests)
S2-006 (Gemini: scoper) --> S2-007 (Codex: tests)
S2-001..007 --> S2-008 (Claude: CORE ASSEMBLER) --> S2-009 (Gemini: tests) + S2-010 (Codex: tests)

S2-008 --> S3-001 (Claude: session) --> S3-002 (Claude: delegation) --> S3-003 (Gemini: tests)
S2-008 --> S3-004 (Gemini: tracer) --> S3-005 (Codex: tests)
S2-008 --> S3-006 (Codex: NPA config) --> S3-007 (Gemini: tests)
ALL S3 --> S3-009 (Claude: e2e test) --> S3-010 (Claude: __init__.py)

S3-010 --> S4-001 (Claude: bridge) --> S4-002 (Claude: wire dify-proxy)
S2-008 --> S4-003 (Gemini: circuit breaker) --> S4-004 (Codex: tests)
S4-001..003 --> S4-005 (Codex: failure mode tests)
S2-001 --> S4-006 (Gemini: MCP provenance) --> S4-007 (Codex: tests)
S4-ALL --> S4-008 (Claude: integration test)

S4-001 --> S5-001 (Claude: admin API)
S2-001 --> S5-002 (Claude: grounding scorer) --> S5-003 (Codex: tests)
S5-001 --> S5-004 (Gemini: health tab) + S5-005 (Gemini: source tab)
         + S5-006 (Codex: traces tab) + S5-007 (Codex: quality tab)
S2-001 --> S5-008 (Gemini: citation panel)
S3-006 --> S5-009 (Claude: RAG design) --> S5-010 (Claude: KB restructure)

S3-006 --> S6-001 (Codex: Desk config) + S6-002 (Gemini: ORM config)
S6-001,002 --> S6-003 (Codex: tests) + S6-004 (Gemini: playbook)
S5-001 --> S6-005 (Codex: trust tab) + S6-006 (Gemini: contracts tab)
ALL --> S6-007 (Claude: regression) --> S6-008 (Claude: benchmarks) --> S6-009 (Claude: merge)
```

---

## Definition of Done (Per Story)

```
[ ] Code written and saved to correct file path
[ ] No imports from server/, src/app/, or shared/ (isolation check)
[ ] All functions exported from module (listed in __all__ or __init__.py)
[ ] Unit tests written (by separate agent)
[ ] All tests pass: pytest (in packages/context-engine/)
[ ] No new dependencies added (unless explicitly approved in story)
[ ] Config files are valid JSON (parseable)
[ ] Code has docstrings on all public functions (Google style)
```

## Definition of Done (Per Sprint)

```
[ ] All stories in sprint are DONE
[ ] Full test suite passes: cd packages/context-engine && python -m pytest tests/ -v
[ ] Zero imports from outside packages/context-engine/
[ ] Sprint demo: show one end-to-end flow working
[ ] Sprint retro: what worked, what didn't, adjust next sprint
```

---

## Prompt Template for Codex/Gemini

When assigning a story, give this context:

```
PROJECT: coo-context-engine (standalone Python context engineering package)
LOCATION: packages/context-engine/ (within the agent-command-hub-angular repo)
BRANCH: feature/context-engine
LANGUAGE: Python 3.11+

STORY: [story ID and title]

RULES:
1. All files go under packages/context-engine/
2. NEVER import from server/, src/app/, or shared/
3. Use pytest for testing (tests/ directory, test_*.py naming)
4. Zero external dependencies (unless story explicitly says otherwise)
5. All public functions need docstrings (Google style)
6. Config files must be valid JSON
7. Use snake_case for function/variable names (PEP 8)
8. Use type hints on all public function signatures

PACKAGE STRUCTURE:
  packages/context-engine/
    pyproject.toml              # Package config (replaces package.json)
    context_engine/             # Python source package
      __init__.py               # Public API exports
      trust.py, contracts.py, provenance.py, ...
    tests/
      conftest.py               # Shared fixtures
      test_trust.py, test_contracts.py, ...
    config/                     # Language-agnostic JSON configs
    contracts/                  # Per-archetype context contracts

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

---

## v1.0.0 Delivery Summary

```
+===========================================================================+
|  CONTEXT ENGINE v1.0.0 — SHIPPED 2026-03-02                               |
+===========================================================================+
|  Sprints delivered:  6/6 (195 story points)                               |
|  Python modules:     15 (4,057 LOC)                                       |
|  Test suite:         551 tests passing in ~1.6s                           |
|  Domain configs:     4 (NPA, ORM, DESK, DEMO)                            |
|  Angular components: 7 admin tabs + 1 citation panel                      |
|  Server integration: context-bridge.js + context-admin.js                 |
|  Guardian findings:  90 total → 80 fixed, 9 accepted, 1 disputed, 0 open |
|  Branch:             feature/context-engine → merged to main              |
+===========================================================================+
```

---

## Post-v1.0.0 Roadmap — Recommended Next Steps

### Phase 1: Production Hardening (Sprint 7)

| Priority | Task | Agent | Estimate |
|----------|------|-------|----------|
| **P0** | E2E integration tests (Node.js bridge ↔ Python engine live) | Claude | 5 pts |
| **P0** | CI/CD pipeline (pytest + Angular lint on PR) | Claude | 3 pts |
| **P1** | Docker packaging (`Dockerfile` for context-engine subprocess) | Claude | 3 pts |
| **P1** | Environment config (dev/staging/prod profiles) | Codex | 2 pts |
| **P1** | Health check endpoint hardening (readiness + liveness) | Codex | 2 pts |
| **P2** | Structured logging (JSON format, correlation IDs) | Gemini | 3 pts |
| **P2** | Trust-tab recent decisions endpoint (`/api/context/trust-decisions`) | Gemini | 2 pts |
| **P2** | Node.js test harness for feature flag tests | Codex | 3 pts |

### Phase 2: Multi-Domain Expansion

| Task | Description |
|------|-------------|
| DCE domain config | Digital Channel Engagement — new domain onboarding |
| Cross-domain context sharing | Allow agents to reference data from other domains |
| Domain-specific grounding rules | Per-domain citation requirements and authority overrides |
| Admin dashboard: domain switcher | UI to switch between domain views in admin tabs |

### Phase 3: Advanced Features

| Task | Description |
|------|-------------|
| Real MCP tool integration | Replace mock adapters with live MCP tool calls |
| Streaming assembly | Yield partial context as stages complete |
| Context caching | Cache assembled contexts by request fingerprint |
| Prompt versioning | Track and version system prompts per domain/agent |
| Observability dashboard | Grafana/Prometheus metrics from tracer data |

### Accepted Findings to Address (9 items)

These were accepted during v1.0.0 for valid reasons but could be improved:

1. **M-004 (S5):** `recordTrace` wiring between dify-proxy.js and context-admin.js
2. **N-002 (RA):** Feature flag tests are structural only (Python can't test Node.js paths)
3. **RA-L-003:** Trust-tab recent decisions always empty (needs dedicated endpoint)
4. **M-001–M-005 (S2-FIN):** test_assembler_happy.py coverage accepted as comprehensive
5. **M-004 (S2-P0):** validate_provenance() error message wording
6. **M-010 (S2-P1):** Scoper ordinal defaults (documented, tested)

---

*This document is the shared sprint overview. Each agent reads their own stories file for detailed specs.*
