# Domain Onboarding Playbook (H-001 / S6)

How to add a new domain configuration to the Context Engine.

## 1. Overview

A **domain config** is a JSON file in `packages/context-engine/domains/` that tells the 7-stage pipeline how to handle context for a specific business domain. Each file declares the domain's data sources, trust tiers, agent topology, scoping fields, and grounding rules.

The 7-stage pipeline processes every request through these stages in order:

1. **Classify** -- load the archetype contract, classify trust on incoming sources
2. **Scope** -- filter data by domain, entity, jurisdiction, role, classification, temporal validity
3. **Retrieve** -- call adapters to fetch entity data and KB chunks
4. **Rank** -- sort all sources by `authority_tier` (tier 1 first)
5. **Budget** -- allocate tokens per archetype profile, trim on overflow
6. **Assemble** -- compose the final context package
7. **Tag** -- attach provenance tags to all assembled data

The domain config drives stages 1-4 (which sources are trusted, how data is scoped, which agents exist) and stage 7 (which claims require citations).

## 2. Domain Config Schema

Every domain config must be a single JSON file at `domains/{domain_id_lowercase}.json`.

### Required top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `domain_id` | string (UPPERCASE) | Unique identifier, e.g. `"NPA"`, `"ORM"`, `"DESK"` |
| `display_name` | string | Human-readable name, e.g. `"Operational Risk Management"` |
| `primary_entity` | string | Main entity type used for scoping, e.g. `"project_id"`, `"incident_id"` |
| `context_sources` | array | List of source config objects (see below) |
| `scoping_fields` | array of strings | Fields used for scoping; **must include** `primary_entity` value |
| `untrusted_content` | array of strings | Content types that should never be trusted |
| `agents` | array | List of agent config objects (see below) |
| `grounding_overrides` | object | Domain-specific grounding rules (see below) |

### `context_sources[]` -- each object

| Field | Type | Description |
|-------|------|-------------|
| `source_id` | string | Unique identifier for this source, e.g. `"npa_project_api"` |
| `source_type` | string | **Must** be one of the 5 canonical types (see Section 4) |
| `authority_tier` | integer 1-5 | Trust tier (1 = highest, 5 = lowest) |
| `description` | string | Human-readable description of what this source provides |

### `agents[]` -- each object

| Field | Type | Description |
|-------|------|-------------|
| `agent_id` | string | Unique agent identifier, e.g. `"ORM_INCIDENT"` |
| `archetype` | string | One of: `orchestrator`, `worker`, `reviewer` |
| `responsibility` | string | Short description of what this agent does |

### `grounding_overrides` -- object

| Field | Type | Description |
|-------|------|-------------|
| `required_claim_types` | array of strings | Claim types that must be grounded, e.g. `["risk_assessment", "governance_rule"]` |
| `citation_required_fields` | array of strings | Fields required in every citation, e.g. `["source_id", "version", "section"]` |
| `min_authority_tier_overrides` | object (optional) | Per-claim-type overrides for minimum tier, e.g. `{"regulatory_obligation": 4}` |

### Minimal example

```json
{
  "domain_id": "ACME",
  "display_name": "ACME Lending",
  "primary_entity": "loan_id",
  "context_sources": [
    { "source_id": "acme_loan_system", "source_type": "system_of_record",
      "authority_tier": 1, "description": "Loan origination and servicing records." },
    { "source_id": "acme_policies", "source_type": "bank_sop",
      "authority_tier": 2, "description": "Internal lending policies and procedures." }
  ],
  "scoping_fields": ["loan_id", "jurisdiction", "product_type"],
  "untrusted_content": ["user_free_text"],
  "agents": [
    { "agent_id": "ACME_ORCH", "archetype": "orchestrator",
      "responsibility": "Route lending requests to specialist workers." },
    { "agent_id": "ACME_UNDERWRITER", "archetype": "worker",
      "responsibility": "Assess loan applications against policy criteria." },
    { "agent_id": "ACME_REVIEWER", "archetype": "reviewer",
      "responsibility": "Validate worker outputs for groundedness." }
  ],
  "grounding_overrides": {
    "required_claim_types": ["risk_assessment", "governance_rule"],
    "min_authority_tier_overrides": {},
    "citation_required_fields": ["source_id", "version", "section"]
  }
}
```

## 3. Step-by-Step Guide

### Step 1: Create the domain file

Create `packages/context-engine/domains/{domain_id_lowercase}.json` (e.g. `acme.json`).

### Step 2: Define context sources

Add one or more entries to `context_sources[]`. Every `source_type` value **must** be one of the 5 canonical types listed in Section 4. Non-canonical values will silently default to `UNTRUSTED` at classify time.

### Step 3: Define agents

Add at least one agent. Use the correct `archetype` value -- this determines the budget profile used at pipeline stage 5 (see Section 5).

### Step 4: Set grounding overrides

Populate `grounding_overrides` with the claim types relevant to your domain. Always include `min_authority_tier_overrides` even if empty (`{}`).

### Step 5: Add domain config tests

Add your domain filename to the discovery filter in `tests/test_domain_configs.py`. The test file auto-discovers JSON files via a hardcoded set:

```python
def _domain_files() -> list[Path]:
    files = sorted(DOMAINS_DIR.glob("*.json"))
    return [p for p in files if p.name in {"npa.json", "desk.json", "demo.json", "orm.json", "acme.json"}]
```

Add your filename to the set filter. The existing test classes (`TestRequiredFields`, `TestContextSources`, `TestScopingFields`, `TestAgents`, `TestCrossDomainConsistency`) will then validate your config automatically.

### Step 6: Add regression tests

Add a test class to `tests/regression/test_full_regression.py` following the existing pattern:

```python
class TestAcmeDomainRegression:
    def test_acme_worker_pipeline(self):
        result = assemble_context(
            request={
                "agent_id": "ACME_UNDERWRITER", "entity_ids": ["LOAN-001"],
                "query": "Assess loan application", "system_prompt": "",
                "conversation_history": [], "few_shot_examples": [],
                "tool_schemas": [], "sources": [],
            },
            archetype="worker", domain="ACME",
        )
        stages = [s["stage"] for s in result["_metadata"]["stages"]]
        assert stages == ["CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"]
```

### Step 7: Verify

Run the full test suite from the context-engine package root:

```bash
cd packages/context-engine
pytest tests/
```

All domain config tests, regression tests, and cross-domain consistency tests must pass.

## 4. Canonical Source Types

These are the only valid `source_type` values. Any other value will be classified as `UNTRUSTED` at runtime without warning.

| Tier | `source_type` | Trust Class | Description |
|------|---------------|-------------|-------------|
| 1 | `system_of_record` | TRUSTED | Database records via MCP tools; canonical bank data |
| 2 | `bank_sop` | TRUSTED | Bank-authored, versioned SOP and policy documents |
| 3 | `industry_standard` | TRUSTED | Standards from recognized bodies (ISDA, Basel, FATF) |
| 4 | `external_official` | TRUSTED | Regulator and government publications (MAS, HKMA, RBI) |
| 5 | `general_web` | UNTRUSTED | Public internet content; contextual use only |

## 5. Archetype Budget Profiles

The archetype determines which token budget profile is applied at pipeline stage 5.

| Archetype | Budget Profile | Max Tokens | Description |
|-----------|---------------|------------|-------------|
| `orchestrator` | `lightweight` | 51,200 | Minimal context: intent, routing, summaries only |
| `worker` | `standard` | 128,000 | Full context: domain data, KB, tools, examples |
| `reviewer` | `compact` | 64,000 | Focused context: worker output, provenance, rubric |

## 6. Existing Domain Examples

| Domain | File | `primary_entity` | Sources | Agents | Notes |
|--------|------|-------------------|---------|--------|-------|
| **NPA** | `npa.json` | `project_id` | 3 (SoR, SOP, industry) | 5 (orch, classifier, risk, governance, reviewer) | New Product Approval; the original domain |
| **ORM** | `orm.json` | `incident_id` | 5 (3x SoR, SOP, regulatory) | 9 (orch, 7 workers, reviewer) | Operational Risk Management; largest agent set |
| **DESK** | `desk.json` | `counterparty_id` | 3 (2x SoR, SOP) | 4 (orch, triage, resolver, escalation) | Desk Support; counterparty-centric scoping |
| **DEMO** | `demo.json` | `demo_id` | 1 (SoR) | 1 (orch only) | Minimal sandbox config for testing |

## 7. Common Pitfalls

1. **Non-canonical `source_type` values** -- If you use a value not in the 5 canonical types (e.g. `"internal_api"` instead of `"system_of_record"`), `classify_trust()` will silently return `UNTRUSTED`. There is no build-time validation for this.

2. **Missing `display_name` field** -- The test suite now enforces `display_name` presence across all domain configs (`test_all_domain_configs_have_display_name`). Always include a non-empty `display_name` string; downstream consumers rely on it.

3. **Empty `min_authority_tier_overrides`** -- Always include `grounding_overrides.min_authority_tier_overrides` even if empty (`{}`). Omitting the key entirely may cause grounding scorer lookups to fail with a `KeyError`.

4. **`primary_entity` must match scoping data** -- The `primary_entity` value (e.g. `"incident_id"`) must match the `entity_type` field used in actual scoped data records. The scoper uses `primary_entity` from the domain config as the default `entity_type` when filtering (see `scoper.get_scoping_rules()`).

5. **`scoping_fields` must include `primary_entity`** -- The first entry in `scoping_fields` should be the same as `primary_entity`. Omitting it means entity-level scoping will not match any records.

6. **Forgetting to update the test discovery filter** -- `test_domain_configs.py` uses a hardcoded set of filenames. If you do not add your new filename, the config will not be validated by CI.

7. **NEVER-allowed source types** -- The trust module has a hardcoded blocklist (`social_media`, `competitor_intelligence`, `unverified_web_scrapes`, `user_pasted_claiming_policy`). Using any of these as a `source_type` will raise a `ValueError` at runtime, not a silent fallback.
