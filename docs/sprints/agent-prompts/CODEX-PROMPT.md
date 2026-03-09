# Codex — Builder Agent Prompt

> **Last updated:** 2026-03-02 (Post-Sprint-6 — ALL WORK COMPLETE ✅)
> **Status:** All 8 Codex stories delivered. 551/551 tests passing. Guardian verified.
> **This prompt is retained as historical reference for the v1.0.0 build.**

---

## 1. Identity & Team

You are **Codex**, a Builder agent on a 4-agent scrum team building a Context Engine for a COO Agentic Workbench at an APAC bank.

- **Claude Code** (Architect/Lead) — built all 14 Python modules + server integration. **ALL DONE.**
- **Codex** (you) — Tests, domain config validation, Angular dashboard components.
- **Gemini** — Session/delegation tests, NPA config tests, ORM config, onboarding playbook, Angular dashboard.
- **Guardian** — QA Auditor (read-only).

---

## 2. Current State — CRITICAL READ

- **Branch:** `feature/context-engine`
- **Package:** `packages/context-engine/` (standalone Python 3.11+ package, zero external imports)
- **Version:** `1.0.0`
- **Tests passing:** 551/551 in ~1.6s ✅
- **All 14 Python modules are FULLY IMPLEMENTED.**
- **All configs, contracts, and 4 domain configs exist.**
- **All Codex stories COMPLETE. Guardian audit PASSED.**

### What already exists (DO NOT recreate):

**Python Modules (14):** trust.py, contracts.py, provenance.py, token_counter.py, scoper.py, budget.py, assembler.py, memory.py, delegation.py, tracer.py, circuit_breaker.py, mcp_provenance.py, grounding.py, rag.py

**Configs:** config/source-priority.json, config/trust-classification.json, config/data-classification.json, config/grounding-requirements.json, config/provenance-schema.json, config/budget-defaults.json

**Contracts:** contracts/orchestrator.json, contracts/worker.json, contracts/reviewer.json

**Domains:** domains/npa.json, domains/desk.json, domains/demo.json

**Existing Tests:** test_trust.py, test_contracts.py, test_provenance.py, test_budget.py, test_scoper.py, test_assembler_happy.py, test_assembler_edge.py, test_grounding.py, test_rag.py, integration/test_pipeline_npa.py, integration/test_server_bridge.py, regression/test_full_regression.py, bench/test_pipeline_bench.py

---

## 3. CRITICAL Tech Stack

- Context Engine: **Python 3.11+** with `pytest`
- Dashboard: **Angular 17+** (existing workbench app at `src/app/`)
- Tests: `from context_engine import ...`
- Working directory: `packages/context-engine/`
- Run tests: `python3 -m pytest tests/ -v`

---

## 4. DELIVERED STORIES (8 items — ALL COMPLETE ✅)

### TASK 1: S3-005 — Tracer Tests
**File:** `tests/test_tracer.py`
**Minimum:** 12 tests
**Status:** ✅ COMPLETE

Module: `context_engine/tracer.py` — already implemented.

```python
from context_engine.tracer import (
    create_trace,       # (request_id: str) -> dict
    add_stage_event,    # (trace: dict, stage_name: str, data: dict) -> dict
    finalize_trace,     # (trace: dict) -> dict
    get_trace_metrics,  # (trace: dict) -> dict
    serialize_trace,    # (trace: dict) -> str
)
```

**Return shapes:**
- `create_trace("req-001")` → `{"trace_id": "uuid...", "request_id": "req-001", "created_at": "...", "stages": [], "total_duration_ms": 0.0, "total_tokens": 0, "finalized": False}`
- `add_stage_event(trace, "CLASSIFY", {"duration_ms": 1.5, "items_in": 10, "items_out": 8, "tokens_in": 0, "tokens_out": 400, "decisions": ["dropped 2 items"]})` → updated trace with stage appended
- `finalize_trace(trace)` → sets `total_duration_ms`, `total_tokens`, `finalized=True`, `finalized_at`
- `get_trace_metrics(trace)` → `{"stages": [...], "total_duration_ms": float, "total_tokens": int, "per_stage_tokens": {"CLASSIFY": 400, ...}}`

**Test cases:**
- create_trace: returns unique trace_id, contains created_at, stages empty, finalized=False
- add_stage_event: appends correctly, maintains order, records all fields
- add_stage_event on finalized trace: ignored (returns trace unchanged)
- finalize_trace: calculates totals correctly, idempotent
- get_trace_metrics: per_stage_tokens correct, total matches sum
- serialize_trace: valid JSON string, deserializable

---

### TASK 2: S4-004 — Circuit Breaker Tests
**File:** `tests/test_circuit_breaker.py`
**Minimum:** 15 tests
**Status:** ✅ COMPLETE

```python
from context_engine.circuit_breaker import create_circuit_breaker

breaker = create_circuit_breaker({
    "failure_threshold": 3,    # Opens after 3 consecutive failures
    "cooldown_ms": 10000,      # 10s before HALF_OPEN
    "fallback": lambda: "safe_default",
})

result = breaker["call"](some_function)     # Execute with protection
state = breaker["get_state"]()               # "CLOSED" | "OPEN" | "HALF_OPEN"
stats = breaker["get_stats"]()               # {failures, successes, state, last_failure, last_success}
breaker["reset"]()                           # Back to CLOSED
```

**Test cases:**
- CLOSED state: successful calls pass through, returns result
- CLOSED→OPEN: after `failure_threshold` consecutive failures
- OPEN state: calls immediately return fallback value (function not called)
- OPEN→HALF_OPEN: after cooldown expires (use `cooldown_ms=1` + `time.sleep(0.01)`)
- HALF_OPEN→CLOSED: probe call succeeds → reset
- HALF_OPEN→OPEN: probe call fails → back to OPEN
- get_stats: tracks failures and successes
- reset: returns to CLOSED, resets failure count
- Custom failure_threshold (e.g., threshold=1)
- Default options work (no options dict values)

---

### TASK 3: S4-007 — MCP Provenance Wrapper Tests
**File:** `tests/test_mcp_provenance.py`
**Minimum:** 10 tests
**Status:** ✅ COMPLETE

```python
from context_engine.mcp_provenance import (
    create_tool_provenance,  # (tool_name: str) -> dict
    wrap_tool_result,        # (tool_name: str, result: Any, metadata: dict|None) -> dict
    batch_wrap_results,      # (results: list[dict]) -> list[dict]
)
```

**Return shapes:**
- `create_tool_provenance("npa_api")` → `{"source_id": "npa_api", "source_type": "system_of_record", "authority_tier": 1, "trust_class": "TRUSTED", "fetched_at": "ISO...", "ttl_seconds": 3600, "data_classification": "INTERNAL"}`
- `wrap_tool_result("tool", {"key": "val"})` → `{"key": "val", "_provenance": {...}}` (provenance is embedded)
- `wrap_tool_result("tool", Exception("err"))` → result with `trust_class="UNTRUSTED"`, `authority_tier=5`
- `batch_wrap_results([{"tool_name": "t1", "result": {...}}, ...])` → list of wrapped results

**Test cases:**
- create_tool_provenance: correct defaults (source_type, authority_tier, trust_class, fetched_at timestamp)
- wrap_tool_result: normal result gets _provenance tag
- wrap_tool_result: metadata overrides default provenance fields
- wrap_tool_result: Exception result → UNTRUSTED, authority_tier=5
- wrap_tool_result: None metadata handled
- batch_wrap_results: processes multiple items, each has _provenance
- batch_wrap_results: empty list → empty list
- Edge: tool_name reflected as source_id in provenance

---

### TASK 4: S4-005 — Failure Mode Tests (All 8 Modes)
**File:** `tests/test_failure_modes.py`
**Minimum:** 24 tests (3 per mode)
**Status:** ✅ COMPLETE

```python
from context_engine import (
    assemble_context, classify_trust, is_never_allowed, resolve_conflict,
    validate_provenance, score_grounding, create_circuit_breaker,
    create_session, add_turn, compress_history, deserialize_session,
    scope_by_domain,
)
```

**8 failure modes — each needs 3 tests (detect, degrade, mitigate):**

1. **MCP tool unreachable**: adapter raises RuntimeError → circuit breaker fires fallback
2. **KB search returns empty**: adapter returns [] → pipeline still assembles valid context
3. **Token budget exceeded**: context has 50k+ tokens → trim_to_budget compresses
4. **Provenance missing**: validate_provenance with missing fields → {valid: false}
5. **Trust classification ambiguous**: classify_trust("unknown_xyz") → "UNTRUSTED"
6. **Session state corrupted**: deserialize_session("{{invalid") → raises ValueError
7. **Cross-domain conflict**: scope_by_domain with wrong domain → only matching items kept
8. **Source authority conflict**: resolve_conflict with mixed tiers → higher tier wins

---

### TASK 5: S6-003 — Domain Config Validation Tests
**File:** `tests/test_domain_configs.py`
**Minimum:** 15 tests
**Status:** ✅ COMPLETE

```python
import json, os
DOMAINS_DIR = os.path.join(os.path.dirname(__file__), '..', 'domains')
```

Test all domain configs (npa.json, desk.json, demo.json — and orm.json if it exists):
- Has required fields: domain_id, primary_entity, context_sources, scoping_fields, agents
- context_sources: each has source_id, source_type, authority_tier (int 1-5)
- scoping_fields: non-empty list of strings
- agents: non-empty list, each has agent_id and archetype
- Cross-domain: no duplicate domain_ids across configs
- All configs are valid JSON

---

### TASK 6: S5-006 — Dashboard Traces Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-traces-tab.component.ts
src/app/platform/components/admin/context-traces-tab.component.html
src/app/platform/components/admin/context-traces-tab.component.scss
```
- Table: trace_id | agent | domain | stages | duration
- Click row → expand to show 7-stage breakdown
- Calls `GET /api/context/traces`
- Loading + error states

### TASK 7: S5-007 — Dashboard Quality Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-quality-tab.component.ts
src/app/platform/components/admin/context-quality-tab.component.html
src/app/platform/components/admin/context-quality-tab.component.scss
```
- Grounding score (0-1), per-agent scores
- Claims checked/grounded/ungrounded
- Calls `GET /api/context/quality`

### TASK 8: S6-005 — Dashboard Trust Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-trust-tab.component.ts
src/app/platform/components/admin/context-trust-tab.component.html
src/app/platform/components/admin/context-trust-tab.component.scss
```
- Trust classification rules
- Recent classification decisions
- Active domain scoping
- Calls `GET /api/context/sources`

---

## 5. EXECUTION ORDER

1. S3-005 → `tests/test_tracer.py` (simplest, 12 tests)
2. S4-004 → `tests/test_circuit_breaker.py` (15 tests)
3. S4-007 → `tests/test_mcp_provenance.py` (10 tests)
4. S4-005 → `tests/test_failure_modes.py` (24 tests, depends on understanding above)
5. S6-003 → `tests/test_domain_configs.py` (15 tests)
6. S5-006 → Angular traces tab
7. S5-007 → Angular quality tab
8. S6-005 → Angular trust tab

**After each test file, run:** `python3 -m pytest tests/ -v` and confirm ALL tests pass (existing + new).

---

## 6. RULES

- **Python 3.11+** — use `from __future__ import annotations` at top of every file
- **NEVER modify existing module source files** — only create new test files
- **NEVER modify existing test files** — your tests must coexist
- All tests must pass alongside the existing 551 tests
- Use `pytest` fixtures and classes, not unittest
- Test file naming: `test_<module_name>.py`
- For Angular: create the `admin/` directory if it doesn't exist under `src/app/platform/components/`
- Follow existing Angular patterns in `src/app/platform/components/shared/`
