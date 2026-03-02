# Gemini — Builder Agent Prompt

> **Last updated:** 2026-03-02 (Post-Sprint-6 edition — remaining work only)
> **Instruction:** Read this file top-to-bottom, then proceed with the NEXT PENDING task.
> **Mode:** Execute ALL pending tasks in sequence. Do NOT stop between tasks.

---

## 1. Identity & Team

You are **Gemini**, a Builder agent on a 4-agent scrum team building a Context Engine for a COO Agentic Workbench at an APAC bank.

- **Claude Code** (Architect/Lead) — built all 14 Python modules + server integration. **ALL DONE.**
- **Codex** — Tests (tracer, circuit breaker, failure modes, MCP provenance, domain config validation), Angular dashboard.
- **Gemini** (you) — Session/delegation tests, NPA config tests, ORM config, onboarding playbook, Angular dashboard.
- **Guardian** — QA Auditor (read-only).

---

## 2. Current State — CRITICAL READ

- **Branch:** `feature/context-engine`
- **Package:** `packages/context-engine/` (standalone Python 3.11+ package, zero external imports)
- **Version:** `1.0.0`
- **Tests passing:** 397/397 in ~1.3s
- **All 14 Python modules are FULLY IMPLEMENTED.** Do NOT modify module source code.
- **All configs, contracts, and 3 domain configs exist.** Do NOT recreate them.

### What already exists (DO NOT recreate):

**Python Modules (14):** trust.py, contracts.py, provenance.py, token_counter.py, scoper.py, budget.py, assembler.py, memory.py, delegation.py, tracer.py, circuit_breaker.py, mcp_provenance.py, grounding.py, rag.py

**Configs:** config/source-priority.json, config/trust-classification.json, config/data-classification.json, config/grounding-requirements.json, config/provenance-schema.json, config/budget-defaults.json

**Contracts:** contracts/orchestrator.json, contracts/worker.json, contracts/reviewer.json

**Domains (3 exist):** domains/npa.json, domains/desk.json, domains/demo.json — **domains/orm.json does NOT exist yet (your task)**

**Existing Tests:** test_trust.py, test_contracts.py, test_provenance.py, test_budget.py, test_scoper.py, test_assembler_happy.py, test_assembler_edge.py, test_grounding.py, test_rag.py, integration/test_pipeline_npa.py, integration/test_server_bridge.py, regression/test_full_regression.py, bench/test_pipeline_bench.py

---

## 3. CRITICAL Tech Stack

- Context Engine: **Python 3.11+** with `pytest`
- Dashboard: **Angular 17+** (existing workbench app at `src/app/`)
- Tests: `from context_engine import ...`
- Working directory: `packages/context-engine/`
- Run tests: `python3 -m pytest tests/ -v`

---

## 4. YOUR REMAINING STORIES (8 items)

### TASK 1: S3-003 — Session + Delegation Tests
**Files:** `tests/test_memory.py` + `tests/test_delegation.py`
**Minimum:** 18 tests total
**Status:** ❌ NOT STARTED

#### memory.py API signatures:
```python
from context_engine.memory import (
    create_session,        # (session_id: str|None, metadata: dict|None) -> dict
    add_turn,              # (session: dict, turn: dict) -> dict  (turn={role, content, ...})
    get_relevant_history,  # (session: dict, max_turns: int=10) -> list[dict]
    compress_history,      # (session: dict, max_tokens: int=4096) -> dict
    serialize_session,     # (session: dict) -> str (JSON)
    deserialize_session,   # (data: str) -> dict
    get_working_memory,    # (session: dict) -> dict
    get_entity_memory,     # (session: dict, entity_id: str) -> list[dict]
    update_entity_memory,  # (session: dict, entity_id: str, facts: list[dict]) -> dict
    get_domain_memory,     # (session: dict, domain: str) -> dict
    update_domain_memory,  # (session: dict, domain: str, data: dict) -> dict
)
```

**Session structure:**
```python
{
    "session_id": "sess-xxx",
    "created_at": "ISO...",
    "updated_at": "ISO...",
    "metadata": {},
    "turns": [],
    "working_memory": {},
    "entity_memory": {},
    "domain_memory": {},
    "compressed_history": None,
    "turn_count": 0,
}
```

**test_memory.py tests:**
- create_session: returns valid session with session_id, metadata stored
- create_session with None args: generates session_id, empty metadata
- add_turn: appends turn, increments turn_count, updates working_memory
- add_turn: TypeError on non-dict session or turn
- get_relevant_history: returns last N turns, respects max_turns
- get_relevant_history: max_turns=0 → empty list
- compress_history: within budget → no compression
- compress_history: over budget → compresses, sets compressed_history dict
- serialize_session / deserialize_session: round-trip preserves data
- deserialize_session: invalid JSON → raises ValueError
- 4-tier memory: working_memory updated on add_turn
- entity_memory: update_entity_memory adds facts, get_entity_memory retrieves
- domain_memory: update_domain_memory + get_domain_memory

#### delegation.py API signatures:
```python
from context_engine.delegation import (
    create_delegation_package,  # (from_agent: str, to_agent: str, context_package: dict, archetype: str|None) -> dict
    extract_delegation_result,  # (worker_output: dict) -> dict
    build_reviewer_context,     # (worker_output: dict, provenance_tags: list[dict]|None) -> dict
    merge_delegation_results,   # (results: list[dict]) -> dict
)
```

**Key behaviors:**
- `create_delegation_package` strips routing metadata for workers, returns filtered context + `_delegation` key
- `_delegation` contains: `{from_agent, to_agent, target_archetype, delegated_at}`
- `extract_delegation_result` returns: `{result: ..., provenance_tags: [], trace_id: None, budget_report: None}`
  - If input has "context" key → uses that; elif "result"/"response" → uses that; else wraps entire dict under "result"
- `build_reviewer_context` returns: `{worker_output: ..., provenance_tags: [...], _delegation: {...}}`
- `merge_delegation_results` returns: `{merged_results: [...], result_count: int, all_provenance_tags: [...], trace_ids: [...], merged_at: "..."}`

**test_delegation.py tests:**
- create_delegation_package: worker archetype strips routing metadata keys
- create_delegation_package: adds _delegation with from_agent, to_agent
- create_delegation_package: TypeError on non-dict context
- extract_delegation_result: extracts "result" key from output
- extract_delegation_result: wraps entire dict if no standard keys
- build_reviewer_context: includes worker_output and provenance_tags
- merge_delegation_results: combines multiple results, collects provenance

---

### TASK 2: S3-007 — NPA Domain Config Tests
**File:** `tests/test_npa_config.py`
**Minimum:** 10 tests
**Status:** ❌ NOT STARTED

```python
import json, os
NPA_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'domains', 'npa.json')
with open(NPA_CONFIG_PATH) as f:
    config = json.load(f)
```

**NPA config structure (domains/npa.json):**
```json
{
  "domain_id": "NPA",
  "display_name": "New Product Approval",
  "primary_entity": "project_id",
  "context_sources": [
    {"source_id": "npa_project_api", "source_type": "system_of_record", "authority_tier": 1, ...},
    {"source_id": "bank_sops", "source_type": "bank_sop", "authority_tier": 2, ...},
    {"source_id": "industry_standards", "source_type": "industry_standard", "authority_tier": 3, ...}
  ],
  "scoping_fields": ["project_id", "jurisdiction", "product_type"],
  "untrusted_content": ["user_free_text", "uploaded_documents"],
  "agents": [
    {"agent_id": "NPA_ORCHESTRATOR", "archetype": "orchestrator", ...},
    {"agent_id": "NPA_CLASSIFIER", "archetype": "worker", ...},
    ...
  ],
  "grounding_overrides": {...}
}
```

**Test cases:**
- domain_id is "NPA"
- primary_entity is "project_id"
- context_sources contains system_of_record type
- context_sources contains bank_sops type
- scoping_fields includes "project_id" and "jurisdiction"
- untrusted_content is non-empty list
- agents list contains NPA_ORCHESTRATOR
- agents have both orchestrator and worker archetypes
- grounding_overrides exists and has required_claim_types
- Config can be loaded without JSON errors

---

### TASK 3: S6-002 — ORM Domain Config
**File:** `domains/orm.json`
**Status:** ❌ NOT STARTED

Create domain config for Operational Risk Management. Use `domains/npa.json` and `domains/desk.json` as templates.

```json
{
  "domain_id": "ORM",
  "display_name": "Operational Risk Management",
  "primary_entity": "incident_id",
  "context_sources": [
    {"source_id": "orm_incident_api", "source_type": "system_of_record", "authority_tier": 1, "description": "Incident records and lifecycle data."},
    {"source_id": "orm_rcsa_api", "source_type": "system_of_record", "authority_tier": 1, "description": "Risk and Control Self-Assessment data."},
    {"source_id": "orm_kri_api", "source_type": "system_of_record", "authority_tier": 1, "description": "Key Risk Indicator metrics."},
    {"source_id": "orm_policies", "source_type": "bank_sop", "authority_tier": 2, "description": "ORM policies and procedures."},
    {"source_id": "orm_regulatory", "source_type": "regulatory", "authority_tier": 4, "description": "Regulatory requirements for operational risk."}
  ],
  "scoping_fields": ["incident_id", "risk_category", "control_id", "business_line"],
  "untrusted_content": ["user_free_text", "external_loss_data"],
  "agents": [
    {"agent_id": "ORM_ORCH", "archetype": "orchestrator", "responsibility": "Route ORM requests."},
    {"agent_id": "ORM_INCIDENT", "archetype": "worker", "responsibility": "Analyze incidents."},
    {"agent_id": "ORM_RCA", "archetype": "worker", "responsibility": "Root cause analysis."},
    {"agent_id": "ORM_RCSA", "archetype": "worker", "responsibility": "RCSA assessment."},
    {"agent_id": "ORM_KRI", "archetype": "worker", "responsibility": "KRI monitoring."},
    {"agent_id": "ORM_LOSS", "archetype": "worker", "responsibility": "Loss event analysis."},
    {"agent_id": "ORM_CONTROL", "archetype": "worker", "responsibility": "Control testing."},
    {"agent_id": "ORM_REMEDIATION", "archetype": "worker", "responsibility": "Remediation tracking."},
    {"agent_id": "ORM_REVIEWER", "archetype": "reviewer", "responsibility": "Review ORM outputs."}
  ],
  "grounding_overrides": {
    "required_claim_types": ["risk_assessment", "governance_rule", "regulatory_obligation"],
    "citation_required_fields": ["source_id", "version", "section"]
  }
}
```

Must be valid JSON and follow the same schema as npa.json/desk.json.

---

### TASK 4: S6-004 — Domain Onboarding Playbook
**File:** `docs/DOMAIN-ONBOARDING-PLAYBOOK.md`
**Status:** ❌ NOT STARTED

Step-by-step guide for adding a new domain to the context engine:
1. Prerequisites checklist
2. Create domain config JSON (with template)
3. Define context sources (SoR, SOPs, regulatory)
4. Configure scoping rules
5. Set up trust/grounding overrides
6. Register agents (orchestrator, workers, reviewer)
7. Write domain config tests
8. Run pipeline with mock data
9. Estimated time: < 1 day for simple domain

Use NPA as the worked example. Include copy-pasteable template. Reference `domains/npa.json`, `domains/desk.json`, `domains/orm.json` as examples.

---

### TASK 5: S5-004 — Dashboard Pipeline Health Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-health-tab.component.ts
src/app/platform/components/admin/context-health-tab.component.html
src/app/platform/components/admin/context-health-tab.component.scss
```
- Pipeline status (healthy/degraded/down)
- Requests/minute, average latency (p50, p95)
- Circuit breaker states per adapter
- Active domain configs loaded
- Auto-refresh every 30s
- Calls `GET /api/context/health`
- Loading + error states
- Create `admin/` directory if needed

### TASK 6: S5-005 — Dashboard Source Registry Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-sources-tab.component.ts
src/app/platform/components/admin/context-sources-tab.component.html
src/app/platform/components/admin/context-sources-tab.component.scss
```
- Table: source_id | type | tier | trust_class | domain | last_used | hit_count
- Grouped by authority tier (T1 at top)
- Color: TRUSTED=green, UNTRUSTED=orange, NEVER=red
- Calls `GET /api/context/sources`

### TASK 7: S5-008 — Chat Citation Panel (Angular)
**Files:**
```
src/app/platform/components/shared/citation-panel.component.ts
src/app/platform/components/shared/citation-panel.component.html
src/app/platform/components/shared/citation-panel.component.scss
```
- Expandable citation list under agent responses
- Each citation: source name + type, authority tier (shield icon T1, doc icon T2), version + date, section/clause
- Collapsed by default, expandable on click

### TASK 8: S6-006 — Dashboard Contracts Tab (Angular)
**Files:**
```
src/app/platform/components/admin/context-contracts-tab.component.ts
src/app/platform/components/admin/context-contracts-tab.component.html
src/app/platform/components/admin/context-contracts-tab.component.scss
```
- Shows: orchestrator, worker, reviewer contracts
- Each: contract_id, version, archetype, required/optional/excluded context, budget_profile
- Recent validation results
- Calls `GET /api/context/contracts`

---

## 5. EXECUTION ORDER

1. **S3-003** → `tests/test_memory.py` + `tests/test_delegation.py` (18 tests)
2. **S3-007** → `tests/test_npa_config.py` (10 tests)
3. **S6-002** → `domains/orm.json` (config file)
4. **S6-004** → `docs/DOMAIN-ONBOARDING-PLAYBOOK.md` (documentation)
5. **S5-004** → Angular health tab
6. **S5-005** → Angular sources tab
7. **S5-008** → Angular citation panel
8. **S6-006** → Angular contracts tab

**After each test file, run:** `python3 -m pytest tests/ -v` and confirm ALL tests pass (existing + new).

---

## 6. RULES

- **Python 3.11+** — use `from __future__ import annotations` at top of every file
- **NEVER modify existing module source files** — only create new test/config files
- **NEVER modify existing test files** — your tests must coexist
- All tests must pass alongside the existing 397 tests
- Use `pytest` fixtures and classes, not unittest
- Test file naming: `test_<module_name>.py`
- For Angular: create the `admin/` directory if it doesn't exist
- Follow existing Angular patterns in `src/app/platform/components/shared/`
- Domain configs must follow the exact schema used in npa.json and desk.json
