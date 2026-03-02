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

### SPRINT 2 — Core Pipeline (Week 2) | 40 pts 🔄 IN PROGRESS

**Goal:** Provenance tagging works, token budgeting works, context
scoping works, core assembler pipeline processes a request end-to-end
using mock adapters.

**Agent prompts:** `docs/sprints/agent-prompts/` (one file per agent)

```
CURRENT STATUS:
  S2-001 ✅  provenance.py       (Claude)   347 lines, 9 public functions
  S2-002 ✅  test_provenance.py  (Claude)   461 lines, 66 tests passing
  S2-003 ⬜  token_counter.py    (Gemini)   STUB → pending Gemini build
  S2-004 ⬜  budget.py           (Claude)   STUB → blocked by S2-003
  S2-005 ⬜  test_budget.py      (Codex)    blocked by S2-004
  S2-006 ⬜  scoper.py           (Gemini)   STUB → pending Gemini build
  S2-007 ⬜  test_scoper.py      (Codex)    blocked by S2-006
  S2-008 ⬜  assembler.py        (Claude)   STUB → blocked by all above
  S2-009 ⬜  test_asm_happy.py   (Gemini)   blocked by S2-008
  S2-010 ⬜  test_asm_edge.py    (Codex)    blocked by S2-008

EXECUTION ORDER:

  Day 1-2 (parallel):
    Gemini:   S2-003 (token counter) + S2-006 (scoper) ← NEXT
    Codex:    (blocked — waiting on Gemini/Claude output)
    Claude:   S2-001 ✅ already done — review Gemini output
    Guardian: standby

  Day 2-3 (parallel):
    Claude:   S2-004 (budget allocator) — unblocked when S2-003 lands
    Codex:    S2-007 (scoper tests) — unblocked when S2-006 lands
    Guardian: Audit S2-003 + S2-006

  Day 3-4:
    Claude:   S2-008 (CORE ASSEMBLER — critical path)
    Codex:    S2-005 (budget tests)
    Guardian: Audit S2-004

  Day 5 (parallel):
    Gemini:   S2-009 (assembler happy-path tests)
    Codex:    S2-010 (assembler edge-case tests)
    Claude:   Integration + wire __init__.py + fix issues
    Guardian: Full Sprint 2 audit
```

### SPRINT 3 — Memory, Observability & Domain Config (Week 3) | 30 pts

**Goal:** Session state management works, context traces are logged,
NPA domain config loads and validates, end-to-end pipeline test passes
with NPA mock data.

```
EXECUTION ORDER:

  Day 1-2 (parallel):
    Claude: S3-001 (session state) then S3-002 (delegation context)
    Gemini: S3-004 (observability tracer)
    Codex:  S3-006 (NPA domain config) + S3-008 (demo config)

  Day 3-4 (parallel):
    Gemini: S3-003 (session + delegation tests) + S3-007 (NPA config tests)
    Codex:  S3-005 (tracer tests)
    Claude: S3-009 (end-to-end pipeline test with NPA mock)

  Day 5:
    Claude: S3-010 (public API __init__.py finalization) + full suite run
```

### SPRINT 4 — Integration Bridge & Hardening (Week 4) | 31 pts

**Goal:** The context engine is wired into the Python MCP server / FastAPI
via a thin bridge. Dify proxy calls go through the assembler. Circuit
breakers handle failures gracefully.

```
EXECUTION ORDER:

  Day 1-2 (parallel):
    Claude: S4-001 (context bridge) then S4-002 (wire into dify-proxy)
    Gemini: S4-003 (circuit breaker) + S4-006 (MCP provenance wrapper)

  Day 3-4 (parallel):
    Codex:  S4-004 (circuit breaker tests) + S4-007 (provenance wrapper tests)
    Codex:  S4-005 (failure mode tests — all 8 modes)

  Day 5:
    Claude: S4-008 (integration test with live server)
```

### SPRINT 5 — Admin Dashboard & RAG (Week 5) | 34 pts

**Goal:** Admin can see pipeline health, traces, and quality scores
via Angular UI. RAG pipeline uses 2-stage retrieval with Dify KBs.

```
EXECUTION ORDER:

  Day 1-2 (parallel):
    Claude: S5-001 (admin API routes) + S5-002 (grounding scorer)
    Gemini: S5-008 (chat citation panel)

  Day 3-4 (parallel):
    Codex:  S5-003 (grounding tests) + S5-006 (traces tab) + S5-007 (quality tab)
    Gemini: S5-004 (health tab) + S5-005 (source registry tab)

  Day 5:
    Claude: S5-009 (2-stage RAG design) + S5-010 (Dify KB restructuring plan)
```

### SPRINT 6 — Multi-Domain & Polish (Week 6) | 25 pts

**Goal:** At least one additional domain config (Desk Support or ORM)
proves the engine is truly domain-agnostic. Full regression passes.

```
EXECUTION ORDER:

  Day 1-2 (parallel):
    Codex:  S6-001 (Desk Support config) + S6-005 (trust & scoping tab)
    Gemini: S6-002 (ORM config) + S6-006 (contracts tab)

  Day 3-4 (parallel):
    Codex:  S6-003 (domain config validation tests)
    Gemini: S6-004 (domain onboarding playbook doc)
    Claude: S6-007 (full regression test suite)

  Day 5:
    Claude: S6-008 (performance benchmarks) + S6-009 (merge PR prep)
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

*This document is the shared sprint overview. Each agent reads their own stories file for detailed specs.*
