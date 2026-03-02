# Domain Onboarding Playbook

> How to add a new business domain to the Context Engine.

---

## Overview

The Context Engine assembles LLM context through a 7-stage pipeline (Classify → Scope → Retrieve → Rank → Budget → Assemble → Tag). Each business domain is declared via a JSON config file in `domains/`. Adding a new domain requires **no code changes** — only a config file and optional adapter wiring.

**Existing domains:** NPA (New Product Approval), DESK (Desk Support), ORM (Operational Risk Management), DEMO (minimal smoke-test domain).

---

## Step 1 — Create the Domain Config File

Create `domains/<domain_id_lowercase>.json`. The file must conform to the schema below.

### Required Top-Level Fields

| Field | Type | Description |
|---|---|---|
| `domain_id` | `string` | Unique uppercase identifier (e.g. `"ORM"`, `"NPA"`) |
| `display_name` | `string` | Human-readable name |
| `primary_entity` | `string` | The entity key used to scope records (e.g. `"project_id"`, `"incident_id"`) |
| `context_sources` | `array` | Ordered list of data sources |
| `scoping_fields` | `array` | Fields used to narrow context |
| `untrusted_content` | `array` | Content types that must be sandboxed |
| `agents` | `array` | Agent definitions for this domain |

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `grounding_overrides` | `object` | Domain-specific grounding rules |
| `grounding_overrides.required_claim_types` | `array` | Claim types that must be cited |
| `grounding_overrides.min_authority_tier_overrides` | `object` | Per-claim minimum tiers |
| `grounding_overrides.citation_required_fields` | `array` | Fields required in citations |

### Minimal Example

```json
{
  "domain_id": "TRADE",
  "display_name": "Trade Processing",
  "primary_entity": "trade_id",
  "context_sources": [
    {
      "source_id": "trade_booking_api",
      "source_type": "system_of_record",
      "authority_tier": 1,
      "description": "Trade booking and lifecycle data."
    },
    {
      "source_id": "trade_policies",
      "source_type": "bank_sop",
      "authority_tier": 2,
      "description": "Trade processing policies and procedures."
    }
  ],
  "scoping_fields": ["trade_id", "desk", "product_type"],
  "untrusted_content": ["user_free_text"],
  "agents": [
    {
      "agent_id": "TRADE_ORCH",
      "archetype": "orchestrator",
      "responsibility": "Route trade processing requests."
    },
    {
      "agent_id": "TRADE_WORKER",
      "archetype": "worker",
      "responsibility": "Process trade queries."
    },
    {
      "agent_id": "TRADE_REVIEWER",
      "archetype": "reviewer",
      "responsibility": "Validate trade outputs."
    }
  ],
  "grounding_overrides": {
    "required_claim_types": ["risk_assessment", "governance_rule"],
    "citation_required_fields": ["source_id", "version", "section"]
  }
}
```

---

## Step 2 — Context Source Definitions

Each entry in `context_sources` describes a data source the pipeline may pull from during the Retrieve stage.

### Source Type Reference

| `source_type` | Typical `authority_tier` | Description |
|---|---|---|
| `system_of_record` | 1 | Primary authoritative data (APIs, databases) |
| `bank_sop` | 2 | Internal policies and procedures |
| `industry_standard` | 3 | External standards (ISO, Basel, etc.) |
| `regulatory` | 4 | Regulatory requirements |
| `user_input` | 5 | User-supplied content (lowest trust) |

### Authority Tier Rules

- Tiers range from **1** (highest authority) to **5** (lowest).
- When two sources conflict, the lower-numbered tier wins.
- Same-tier conflicts: `system_of_record` beats non-SoR; otherwise, flagged for human review.
- The `min_authority_tier_overrides` in grounding rules can require specific claim types to come from specific tiers.

---

## Step 3 — Agent Definitions

Each domain must declare at least one agent. Agent archetypes control what context they receive.

### Archetypes

| Archetype | Context Behaviour |
|---|---|
| `orchestrator` | Receives routing metadata, delegation plans; no raw entity data |
| `worker` | Receives scoped entity data, KB chunks, few-shot examples |
| `reviewer` | Receives worker output, provenance tags, grounding scores |

### Naming Convention

Use `<DOMAIN>_<ROLE>` (e.g. `ORM_INCIDENT`, `DESK_TRIAGE`, `NPA_RISK`).

### Required Agent Fields

| Field | Type | Description |
|---|---|---|
| `agent_id` | `string` | Unique identifier |
| `archetype` | `string` | One of `orchestrator`, `worker`, `reviewer` |
| `responsibility` | `string` | What this agent does (used for documentation) |

---

## Step 4 — Scoping & Untrusted Content

### Scoping Fields

List all fields that narrow the context window. The `primary_entity` field should always appear in `scoping_fields`. Additional fields refine the scope (e.g. `jurisdiction`, `product_type`, `business_line`).

The scoper uses these fields to:
1. Filter entity data to matching records
2. Filter KB chunks to relevant sections
3. Apply entitlement-based access control

### Untrusted Content

Declare content types that the pipeline should sandbox. These are never treated as authoritative sources and are isolated from trusted data in the assembled context. Common values:
- `user_free_text` — any free-form user input
- `uploaded_documents` — user-uploaded files
- `retrieved_emails` — email content from external systems
- `external_loss_data` — third-party loss event data

---

## Step 5 — Grounding Overrides

Grounding overrides enforce domain-specific citation and verification rules.

### `required_claim_types`

LLM outputs containing these claim types must include grounded citations:
- `classification_decision` — any categorisation or triage decision
- `risk_assessment` — risk level or risk factor claims
- `governance_rule` — references to internal policies
- `regulatory_obligation` — regulatory compliance claims
- `signoff_requirement` — approval or sign-off requirements
- `sla_deadline` — service level deadlines
- `financial_threshold` — monetary limit claims

### `min_authority_tier_overrides`

Force specific claim types to require sources from a minimum authority tier:

```json
"min_authority_tier_overrides": {
  "regulatory_obligation": 4,
  "financial_threshold": 1
}
```

This means regulatory claims must cite a tier-4 (regulatory) source, and financial threshold claims must cite a tier-1 (system of record) source.

### `citation_required_fields`

Standard citation metadata required for each grounded claim:

```json
"citation_required_fields": ["source_id", "version", "section"]
```

---

## Step 6 — Wire Adapters (Optional)

The assembler pipeline accepts optional adapters to connect domain-specific data sources:

```python
adapters = {
    "get_entity_data": lambda ids, domain: my_api.fetch(ids),
    "get_kb_chunks": lambda domain, query: my_kb.search(query),
    "retrieve": lambda payload: my_retriever.get(payload),
}

result = assemble_context(request, archetype, domain, user_context, adapters)
```

Without adapters, the pipeline runs with empty data (useful for testing or when data comes through the request itself).

---

## Step 7 — Validate

### Automated Validation

The `test_domain_configs.py` test suite automatically validates all domain configs in `domains/`:

```bash
python3 -m pytest tests/test_domain_configs.py -v
```

It checks:
- All required top-level fields present
- `domain_id` is non-empty string
- `context_sources` entries have `source_id`, `source_type`, `authority_tier` (1–5)
- `scoping_fields` are non-empty strings
- `agents` have `agent_id` and `archetype`
- No duplicate `domain_id` values across configs

### Manual Checklist

- [ ] Config file placed in `domains/<domain_id_lowercase>.json`
- [ ] `domain_id` is unique across all config files
- [ ] At least one `system_of_record` source with `authority_tier: 1`
- [ ] At least one agent with `archetype: "orchestrator"`
- [ ] At least one agent with `archetype: "worker"`
- [ ] `primary_entity` appears in `scoping_fields`
- [ ] `untrusted_content` lists all user-facing input channels
- [ ] `grounding_overrides` cover all auditable claim types
- [ ] Domain-specific NPA config test added if needed (`test_<domain>_config.py`)

### Smoke Test

Run the full assembler with the new domain:

```python
from context_engine import assemble_context

result = assemble_context(
    request={
        "agent_id": "MY_WORKER",
        "entity_ids": ["ENT-1"],
        "entity_type": "my_entity",
        "query": "Test query",
        "system_prompt": "You are a test worker.",
        "conversation_history": [],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [{"data": "test", "source_type": "user_input"}],
    },
    archetype="worker",
    domain="MY_DOMAIN",
    user_context={
        "user_id": "u-1",
        "role": "analyst",
        "department": "COO",
        "jurisdiction": "SG",
        "session_id": "sess-test",
    },
    adapters={},
)

assert "context" in result
assert "_metadata" in result
print(f"Stages: {[s['stage'] for s in result['_metadata']['stages']]}")
```

---

## Reference: Existing Domain Configs

| Domain | File | Primary Entity | Sources | Agents |
|---|---|---|---|---|
| NPA | `domains/npa.json` | `project_id` | 3 (SoR, SOP, Industry) | 5 (orch, 3 workers, reviewer) |
| DESK | `domains/desk.json` | `counterparty_id` | 3 (SoR×2, SOP) | 4 (orch, 2 workers, reviewer) |
| ORM | `domains/orm.json` | `incident_id` | 5 (SoR×3, SOP, Regulatory) | 9 (orch, 7 workers, reviewer) |
| DEMO | `domains/demo.json` | `demo_id` | 1 (SoR) | 1 (orch) |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `assemble_context` returns empty `entity_data` | Adapter not wired or `domain` string doesn't match config `domain_id` | Verify adapter returns data; ensure domain string is uppercase |
| Grounding score is 0 | No `grounding_overrides` or claims don't match `required_claim_types` | Add appropriate claim types to config |
| Scoper filters out all data | `scoping_fields` doesn't include `primary_entity` or data lacks matching fields | Ensure `primary_entity` is in `scoping_fields` |
| `authority_tier` out of range error | Tier value outside 1–5 | Set tier between 1 and 5 inclusive |
| Test `test_domain_configs.py` fails | Missing required field or invalid type | Check against schema in Step 1 |
