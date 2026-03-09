# COO Agentic Workbench -- Multi-Domain Platform Blueprint

## Context

The NPA Agentic Workbench is currently a single-domain system (NPA only) that needs to become a **multi-domain COO Workbench** supporting 4 domains: NPA, ORM, DCE, and Desk Support. This blueprint:
- Maps to the **7-Plane Enterprise Agentic Architecture** (`ENTERPRISE-AGENTIC-ARCHITECTURE-APAC-BANK.md`)
- Adheres to the **MBS Unified Agentic Framework (Layers A-G)** from the official MBS session
- Incorporates the **Multi-Agent Prompt Design System** (`prompt_design_system_deep-research-report.md`)
- Adds **Context Engineering** and **Prompt Engineering Studio** as distinct first-class layers
- Refactors NPA as a template so other domains can be easily adapted
- Scope: **GFM COO Only** (not bank-wide)
- Dify: **Cloud now, self-hosted later**

### Current State Inventory
- **Frontend:** Angular 20, 112 TS files, 69+ NPA components, `AgentWorkspaceComponent` (configurable via `WorkspaceConfig`)
- **Backend:** Express.js (24 routes), Python MCP server (77 tools, 21 modules)
- **Agents:** 18 agents in `shared/agent-registry.json` (4 tiers), Dify Cloud (16 apps)
- **DB:** MariaDB, 42+ tables (mostly `npa_` prefixed)
- **Platform layer ~20%** is already domain-agnostic; **domain layer ~80%** is NPA-specific

---

## 1. Target Architecture (MBS Layers A-G + Context Engineering + Prompt Studio)

### 1.1 Full Architecture Diagram

```
+================================================================================+
|                   COO AGENTIC WORKBENCH -- MULTI-DOMAIN PLATFORM               |
|                   MBS Framework + Context Engineering + Prompt Studio           |
+================================================================================+
|                                                                                |
|  LAYER A: UX & UI (Angular 20)                                                |
|  +--------------------------------------------------------------------------+ |
|  |  [Platform Shell]                                                         | |
|  |   AppSidebar | TopBar | MainLayout | ChatHistory | AgentWorkspace        | |
|  |  [Domain Modules -- Lazy-Loaded]                                          | |
|  |   +----------+  +----------+  +----------+  +--------------+             | |
|  |   | NPA      |  | ORM      |  | DCE      |  | Desk Support |             | |
|  |   | 40+ comp |  | ~15 comp |  | ~15 comp |  | ~10 comp     |             | |
|  |   +----------+  +----------+  +----------+  +--------------+             | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER B: AI GATEWAY (Express now -> FastAPI Phase 4)                         |
|  +--------------------------------------------------------------------------+ |
|  |  Platform: /api/auth/* /api/agents/* /api/dify/* /api/platform/*          | |
|  |  Domain Routers: /api/npa/* /api/orm/* /api/dce/* /api/desk/*            | |
|  |  Middleware: Auth | Audit | RBAC | RateLimiter                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER C: CONTROL PLANE                                                        |
|  +--------------------------------------------------------------------------+ |
|  |  agent-registry.json | domain-registry.json | tool-registry.json          | |
|  |  @@COO_META@@ envelope | Lifecycle Manager | Policy Engine               | |
|  |  Guardrails Engine (PII masking, injection detection, output validation)  | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER CX: CONTEXT ENGINEERING (NEW -- Data/Context Assembly Pipeline)        |
|  +--------------------------------------------------------------------------+ |
|  |                                                                            | |
|  |  [Context Assembly Engine]                                                 | |
|  |   Trusted vs Untrusted Classification | Source Priority Resolver           | |
|  |   Domain Context Scoper (project_id, counterparty_id, incident_id)        | |
|  |   User Context Injector (role, desk, region, entitlements)                 | |
|  |                                                                            | |
|  |  [RAG Pipeline]                                                            | |
|  |   Corpora: bank_sops > system_of_record > templates > external_official   | |
|  |   Hybrid Search: BM25 + Vector + Contextual Embeddings + Reranker         | |
|  |   Chunking: 800 tokens default | legal: by clause | SOPs: by step         | |
|  |   top_k: 40 initial -> 8 reranked                                          | |
|  |                                                                            | |
|  |  [Memory & State]                                                          | |
|  |   Session Memory (ChatSessionService) | Conversation State Machine         | |
|  |   Cross-Turn Context Carry | Delegation Stack State                        | |
|  |                                                                            | |
|  |  [Context Contracts per Agent Type]                                        | |
|  |   Orchestrator: authz + intent + routing context + worker results          | |
|  |   Worker: assigned subtask + retrieved docs + tool results + domain data   | |
|  |   Reviewer: worker JSON + provenance + validator outputs                   | |
|  |                                                                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER PX: PROMPT ENGINEERING STUDIO (NEW -- Prompt Design Lifecycle)         |
|  +--------------------------------------------------------------------------+ |
|  |                                                                            | |
|  |  [Canonical Prompt Specs] (YAML/JSON per agent)                            | |
|  |   Metadata: prompt_id, version, owner, risk_class, linked_evals            | |
|  |   Sections: Role | Objective | Scope | Context Policy | Tool Policy        | |
|  |            Constraints | Decision Policy | Output Contract | Fallback      | |
|  |            Examples (golden + edge + disallowed)                            | |
|  |                                                                            | |
|  |  [Module Library] (reusable prompt components)                             | |
|  |   Core: Identity | Instruction Hierarchy | Trust Boundary | Tool Discipline| |
|  |          Provenance | Escalation | Redaction                                | |
|  |   Domain: NPA Module | ORM Module | DCE Module | Desk Module               | |
|  |                                                                            | |
|  |  [Assembly Rules]                                                          | |
|  |   Orchestrator = Identity + Hierarchy + Trust + Routing + Tools + Output   | |
|  |   Worker       = Identity + Domain Module + Trust + Tools + Provenance     | |
|  |   Reviewer     = Identity + Validation Rubric + Injection Checks + Audit   | |
|  |                                                                            | |
|  |  [Evaluation Engine]                                                       | |
|  |   Golden Datasets (per agent per domain) | Adversarial Sets               | |
|  |   Injection Test Suites | Weighted Scoring (grounding 30%, policy 25%,    | |
|  |   schema 15%, routing 15%, tool discipline 10%, cost 5%)                   | |
|  |                                                                            | |
|  |  [Versioning & Release]                                                    | |
|  |   Bundle = prompt + tools + RAG config + validators (semver)               | |
|  |   Release Gates: eval pass -> security review -> canary -> A/B -> promote  | |
|  |   Lifecycle: Draft -> Evaluate -> Validate -> Release -> Monitor -> Improve| |
|  |                                                                            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER D: AGENT RUNTIME (Dify Cloud -> Self-Hosted)                           |
|  +--------------------------------------------------------------------------+ |
|  |  TIER 1: MASTER_COO (cross-domain intent routing)                         | |
|  |  TIER 2: NPA_ORCH | ORM_ORCH | DCE_ORCH | DESK_ORCH                     | |
|  |  TIER 3: 13 NPA + 7 ORM + 5 DCE + 3 DESK specialists                   | |
|  |  TIER 4: KB_SEARCH | NOTIFICATION | DOC_PROCESSING | ANALYTICS           | |
|  |                                                                            | |
|  |  [Agent Archetypes] (from Prompt Design System)                            | |
|  |   Orchestrator: intent classify, risk route, entitlement enforce, compose  | |
|  |   Worker: bounded SOP execution, structured JSON output with provenance    | |
|  |   Reviewer: groundedness check, compliance check, injection detection      | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER E: BUILD/DESIGN                                                         |
|  +--------------------------------------------------------------------------+ |
|  |  Dify Studio (Low-Code) | Python MCP Tools (Pro-Code)                     | |
|  |  Tool Schemas (strict, additionalProperties: false)                        | |
|  |  KB Dataset Management                                                     | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER F: DATA ACCESS & CONTROL                                                |
|  +--------------------------------------------------------------------------+ |
|  |  [Platform DB] platform_* | [Domain DBs] npa_/orm_/dce_/desk_            | |
|  |  [MCP Tools] platform/ npa/ orm/ dce/ desk/                               | |
|  |  [Data Classification] public | internal | confidential | restricted       | |
|  |  [Source Priority] SoR > Bank SOPs > Templates > External > Web            | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
|  LAYER G: SECURITY                                                             |
|  +--------------------------------------------------------------------------+ |
|  |  JWT Auth (-> Entra ID) | RBAC (5 levels) | Audit Trail                   | |
|  |  PII Masking | Anti-Injection (architectural, not prompt-only)             | |
|  |  Red-Team Program (continuous) | Tool Allowlisting                         | |
|  |  Future: Purview, Defender, SPIFFE                                         | |
|  +--------------------------------------------------------------------------+ |
|                                                                                |
+================================================================================+
```

### 1.2 Layer Visibility & Management Matrix

| Layer | Who Manages | Who Uses/Sees | Visibility in UI | Change Frequency |
|-------|-------------|---------------|-------------------|-----------------|
| **A: UX & UI** | Frontend Engineers | End Users (COO, Traders, RMs, Credit, Ops) | Full visibility -- this IS the UI | Per sprint |
| **B: AI Gateway** | Platform Engineers | Invisible to users; consumed by frontend | None (API layer) | Monthly |
| **C: Control Plane** | Platform Admins, AI Lead | Admin Dashboard: agent inventory, domain status, health | Admin-only dashboard | Per agent change |
| **CX: Context Engineering** | AI Engineers + Domain SMEs | Partially visible: users see "sources cited" in responses; admins see RAG config, context assembly metrics | Source citations in chat; RAG config in admin | Per domain; per KB update |
| **PX: Prompt Studio** | AI Engineers + Domain SMEs + Risk/Controls | Admins see prompt versions, eval results, A/B status; users see agent behavior improvements | Prompt version dashboard; eval scorecards in admin | Per prompt iteration |
| **D: Agent Runtime** | Dify Studio Admins | Users interact via chat; admins see Dify Studio flows, agent health | Agent activity stream in chat; Dify Studio for admins | Per agent deployment |
| **E: Build/Design** | AI Engineers, Developers | Dev-only: Dify Studio, code IDE, tool schemas | Dify Studio + IDE | Continuous |
| **F: Data Access** | DBAs, Data Engineers, MCP Devs | Invisible to users; tool results surface in chat via agents | None (data layer) | Per domain onboard |
| **G: Security** | Security Team, Compliance, Audit | Security dashboard (injection attempts, PII events, audit logs) | Security dashboard for compliance; audit trail for regulators | Regulatory-driven |

### 1.3 Layer Interaction Flow

```
User Request -> [A: UI] -> [B: Gateway] -> [G: Security Check]
                                              |
                                              v
                                         [C: Control Plane] -- selects agent, enforces policy
                                              |
                                              v
                                    [CX: Context Engineering] -- assembles context package
                                    (RAG retrieval, user context, session memory,
                                     domain scoping, source priority, data classification)
                                              |
                                              v
                                    [PX: Prompt Studio] -- resolves prompt spec
                                    (select prompt version, inject modules,
                                     apply assembly rules, attach eval hooks)
                                              |
                                              v
                                    [D: Agent Runtime] -- executes in Dify
                                    (Orchestrator -> Worker -> Reviewer flow)
                                              |
                                         [F: Data Access] -- MCP tools, DB queries
                                              |
                                              v
                                    [CX: Context] -- enriches response with provenance
                                              |
                                    [C: Control Plane] -- validates envelope, logs routing
                                              |
                                    [B: Gateway] -> [A: UI] -- renders to user
```

---

## 2. LAYER CX: Context Engineering (Deep Design)

**Source:** Informed by `prompt_design_system_deep-research-report.md` context_policy sections + 7-Plane Context Plane

### 2.1 What Context Engineering IS vs IS NOT

| Context Engineering IS | Context Engineering IS NOT |
|------------------------|---------------------------|
| Data assembly pipeline that feeds agents | Prompt writing or wording |
| Deciding WHAT information enters the LLM context window | Deciding HOW to instruct the LLM |
| RAG retrieval, ranking, chunking strategies | System prompt design |
| Trusted vs untrusted content classification | Prompt injection detection (that's Security) |
| Source priority resolution | Output schema design (that's Prompt Studio) |
| Session memory management | Agent orchestration logic |
| Domain-specific data scoping | Agent routing decisions |
| User context injection (role, entitlements) | Prompt versioning and A/B testing |

### 2.2 Context Assembly Engine Components

```
shared/context-engineering/
  context-config.yaml              # Master context configuration per domain
  source-priority.yaml             # Source authority hierarchy
  trust-classification.yaml        # Trusted vs untrusted content rules

  assemblers/
    orchestrator-context.py        # Assembles context for orchestrator agents
    worker-context.py              # Assembles context for worker agents
    reviewer-context.py            # Assembles context for reviewer agents
    cross-domain-context.py        # Handles cross-domain context requests

  rag/
    rag-config.yaml                # RAG pipeline configuration
    chunking-strategies.yaml       # Per-document-type chunking rules
    corpora-registry.yaml          # Registered knowledge corpora per domain

  memory/
    session-state-schema.json      # Conversation state machine definition
    delegation-context.json        # What context carries across agent delegation

  scoping/
    domain-scoping-rules.yaml      # How to filter data by domain context
    entitlement-context.yaml       # What user context fields are injected
```

### 2.3 Context Config per Domain (Example)

```yaml
# shared/context-engineering/context-config.yaml
domains:
  NPA:
    primary_entity: "project_id"
    context_sources:
      - type: system_of_record
        tool: npa_data.get_project_details
        priority: 1
      - type: bank_sops
        corpus: npa_policies_and_sops
        priority: 2
      - type: regulatory
        corpus: npa_regulatory_refs
        priority: 3
    scoping_fields: [project_id, jurisdiction, product_type]
    untrusted_content: [user_free_text, uploaded_documents]

  DESK:
    primary_entity: "counterparty_id"
    context_sources:
      - type: system_of_record
        tools: [onboarding_system_api, credit_system_api, documentation_system_api]
        priority: 1
      - type: bank_sops
        corpus: desk_sops_and_playbooks
        priority: 2
      - type: industry_standards
        corpus: isda_templates_and_standards
        priority: 3
      - type: regulatory
        corpus: fatf_aml_kyc_refs
        priority: 4
    scoping_fields: [counterparty_id, business_unit, product_family]
    untrusted_content: [user_free_text, retrieved_emails, attachments]

  ORM:
    primary_entity: "incident_id"
    context_sources:
      - type: system_of_record
        tools: [orm_incident_api, orm_rcsa_api, orm_kri_api]
        priority: 1
      - type: bank_sops
        corpus: orm_policies_and_rcsa_templates
        priority: 2
      - type: regulatory
        corpus: basel_iii_or_guidelines
        priority: 3
    scoping_fields: [incident_id, risk_category, control_id, business_line]
    untrusted_content: [user_free_text, external_loss_data]
```

### 2.4 RAG Pipeline Configuration

```yaml
# shared/context-engineering/rag/rag-config.yaml
retrieval:
  hybrid_search:
    bm25: enabled
    vector: enabled
    contextual_embeddings: enabled
    reranker: enabled
  top_k:
    initial: 40
    reranked: 8

chunking:
  default_chunk_tokens: 800
  overlap_tokens: 120
  special_cases:
    legal_docs:
      chunk_by: [section, clause]
    sops:
      chunk_by: [procedure_step, exception]
    regulatory:
      chunk_by: [article, paragraph]

corpora:
  - name: bank_sops_and_policies
    authority: highest
    required_metadata: [doc_id, version, effective_date, owner, classification]
    domains: [ALL]
  - name: npa_regulatory_refs
    authority: high
    domains: [NPA]
  - name: isda_templates_and_standards
    authority: high
    domains: [DESK, DCE]
  - name: basel_iii_or_guidelines
    authority: high
    domains: [ORM]

grounding:
  require_citations_for:
    - onboarding_requirements
    - credit_limit_values
    - agreement_status
    - regulatory_obligations
    - risk_assessment_criteria
    - governance_requirements
```

### 2.5 Source Priority Hierarchy (5 Tiers)

```
TIER 1 (Highest): System of Record data (via MCP tools) -- NEVER guess these
TIER 2: Bank-approved SOPs, policies, playbooks (via RAG, versioned)
TIER 3: Industry standards & templates (ISDA, Basel, FATF -- via RAG)
TIER 4: External official sources (regulators, standards bodies -- parameterized by jurisdiction)
TIER 5 (Lowest): General web -- only when explicitly permitted; must be labeled
```

### 2.6 Existing Files That Implement Context Engineering Today

| Component | Current File | Status |
|-----------|-------------|--------|
| RAG retrieval | `server/mcp-python/tools/kb_search.py` | PARTIAL -- no source priority |
| Session memory | `src/app/services/chat-session.service.ts` | IMPLEMENTED -- signals-based |
| Domain scoping | MCP tools filter by `project_id` | PARTIAL -- NPA only |
| User context | `server/middleware/auth.js` (JWT claims) | PARTIAL -- no entitlement injection |
| Trust classification | None | MISSING |
| Context assembly | Dify system prompts (inline) | SCATTERED -- needs extraction |
| Few-shot examples | `Context/Dify_Agent_Prompts_v2/` | PARTIAL -- not versioned |
| KB corpora | `Context/Dify_KB_Docs/`, `Context/KB/` | PARTIAL -- no registry |

---

## 3. LAYER PX: Prompt Engineering Studio (Deep Design)

**Source:** Directly from `prompt_design_system_deep-research-report.md`

### 3.1 What Prompt Studio IS vs IS NOT

| Prompt Studio IS | Prompt Studio IS NOT |
|------------------|----------------------|
| Prompt spec design and authoring | RAG retrieval configuration |
| Module library management | Data assembly or enrichment |
| Assembly rules (how modules compose) | Session memory management |
| Evaluation datasets and rubrics | Source priority decisions |
| A/B testing and canary rollout | User context resolution |
| Prompt versioning (semver bundles) | Tool schema design (that's Build/Design) |
| Release gates and governance | Agent orchestration logic |
| Weighted scoring criteria | Data classification |

### 3.2 Prompt Spec Structure (Canonical, per Agent)

Every agent gets a YAML/JSON prompt spec with these sections:
```yaml
prompt_id: gfm-coo-{domain}-{agent_type}-{function}
version: semver (e.g. 0.9.0)
status: draft | staging | canary | production | deprecated
owner: team (e.g. ai-platform-gfm)
risk_class: low | medium | high
framework_profile: orchestrator | worker | reviewer

linked_evals:
  golden_suite: {suite_id}
  injection_suite: {suite_id}
  adversarial_suite: {suite_id}

role:           # Identity + audience + communication style
objective:      # Primary goal + success criteria
scope:          # In-scope + out-of-scope + prohibitions
context_policy: # Trusted sources priority + untrusted content rules + conflict handling
tool_policy:    # Strict schema + must-use-tools-for + allowlisted tools
constraints:    # Privacy + security + anti-injection rules
decision_policy: # Risk routing + confidence thresholds + escalation triggers
output_contract: # JSON schema name + required fields
fallback:       # Tool failure behavior + insufficient evidence behavior
examples:       # Golden + edge + disallowed scenarios
```

### 3.3 Module Library (Reusable Prompt Components)

```
shared/prompt-studio/
  modules/
    core/                                # Shared across all agents
      identity-audience.yaml             # Internal-only; role-specific language
      instruction-hierarchy.yaml         # system > risk/safety > policy > user
      trust-boundary.yaml                # Untrusted = data, never instructions
      tool-discipline.yaml               # Schema-first; must-use for SoR fields
      provenance.yaml                    # doc_id, version, timestamps required
      escalation.yaml                    # Confidence thresholds; legal/credit/compliance gates
      redaction.yaml                     # PII minimization; PDPA compliance

    domain/                              # One module per domain
      npa-module.yaml                    # NPA SOPs, classification criteria, sign-off matrix
      orm-module.yaml                    # Basel III, RCSA, KRI, loss event procedures
      dce-module.yaml                    # Onboarding, KYC, ISDA/CSA, complaint SOP
      desk-module.yaml                   # FATF AML/KYC, credit governance, limits SOP

  specs/                                 # Assembled prompt specs per agent
    platform/
      master-coo-orchestrator.yaml
    npa/
      npa-orchestrator.yaml
      npa-ideation-worker.yaml
      npa-classifier-worker.yaml
      npa-risk-worker.yaml
      npa-governance-worker.yaml
      npa-reviewer.yaml                  # NEW: Reviewer agent per Prompt Design System
    orm/
      orm-orchestrator.yaml
      orm-incident-worker.yaml
      orm-rcsa-worker.yaml
      orm-reviewer.yaml
    dce/
      dce-orchestrator.yaml
      dce-onboarding-worker.yaml
      dce-reviewer.yaml
    desk/
      desk-orchestrator.yaml
      desk-triage-worker.yaml
      desk-resolver-worker.yaml
      desk-reviewer.yaml

  assembly-rules.yaml                    # How modules compose into specs
  versioning.yaml                        # Semver bundle definition
```

### 3.4 Assembly Rules

```yaml
# shared/prompt-studio/assembly-rules.yaml
orchestrator:
  modules:
    - core/identity-audience
    - core/instruction-hierarchy
    - core/trust-boundary
    - routing-policy (domain-specific)
    - core/tool-discipline
    - output-contract (DeskSupportResponseV1 / NPAResponseV1 / etc.)
    - core/escalation
    - examples (golden + edge)

worker:
  modules:
    - core/identity-audience
    - domain/{domain}-module
    - core/trust-boundary
    - core/tool-discipline
    - core/provenance
    - output-contract (WorkerResultV1)
    - examples (domain-specific)

reviewer:
  modules:
    - core/identity-audience
    - validation-rubric (groundedness + compliance + schema + injection)
    - core/trust-boundary
    - decision-policy (approve/rework/escalate thresholds)
    - audit-tags
```

### 3.5 Evaluation Engine

```yaml
# Weighted scoring (from Prompt Design System)
scoring:
  groundedness_provenance: 30%     # Every critical claim has tool/doc_id evidence
  policy_compliance: 25%           # Aligns with bank SOPs
  schema_validity: 15%             # No missing required fields in output
  routing_escalation: 15%          # Correct intent routing; correct escalation
  tool_discipline: 10%             # No guessing; correct tool selection
  cost_latency: 5%                 # Within SLO budget

# Eval datasets per agent per domain
datasets:
  golden:   # Correct behavior examples (JSONL)
    - "{domain}_golden_v{N}.jsonl"
  adversarial:  # Edge cases, ambiguity, conflicting sources
    - "{domain}_adversarial_v{N}.jsonl"
  injection:  # Prompt injection attempts
    - "{domain}_injection_v{N}.jsonl"

# Release gates
gates:
  1: "Offline golden + adversarial + injection suites pass at thresholds"
  2: "Security review of tool allowlists and data classifications"
  3: "Monitoring instrumented end-to-end (traces + metrics)"
  4: "Canary rollout (5% traffic) for 48h with no regressions"
  5: "A/B test with pairwise reviewer scoring"
```

### 3.6 Versioning Bundle Definition

```yaml
# A "prompt bundle" = prompt + tools + RAG + validators (atomic unit)
bundle:
  prompt_version: "1.2.0"        # Prompt spec changes
  tool_schema_version: "1.0.0"   # Tool parameter/allowlist changes
  rag_config_version: "1.1.0"    # Corpora/chunking/reranker changes
  validator_version: "1.0.0"     # Guardrail/validation changes

# Breaking changes = MAJOR version bump
breaking_changes:
  - output schema required fields changed
  - tool parameter changes (non-backward-compat)
  - corpora authority order changed

# Non-breaking changes = MINOR/PATCH
non_breaking:
  - prompt wording refined (always re-eval)
  - top_k adjusted
  - new examples added
```

### 3.7 Existing Files That Map to Prompt Studio Today

| Component | Current Location | Status |
|-----------|-----------------|--------|
| Prompt templates | `Context/Dify_Agent_Prompts_v2/*.md` | PARTIAL -- plain text, no spec structure |
| Agent prompts | Inline in Dify Studio chatflows | SCATTERED -- not version-controlled |
| Eval datasets | None | MISSING |
| Module library | None | MISSING |
| Assembly rules | None (manual copy-paste) | MISSING |
| Versioning | None | MISSING |
| A/B testing | None | MISSING |

---

## 4. Agent Hierarchy (4 Tiers + Reviewer Archetype)

```
TIER 1: MASTER_COO (1 agent -- cross-domain routing)
         |           |            |           |
TIER 2: NPA_ORCH   ORM_ORCH    DCE_ORCH    DESK_ORCH
         |           |            |           |
TIER 3: NPA(13)    ORM(7)      DCE(5)      DESK(3)
        Ideation    Incident     Onboard     Triage
        Classifier  RCA          KYC         Resolver
        Risk        RCSA         Complaint   Escalation
        Governance  KRI          SLA
        DocLife     LossEvent    Handoff
        Monitoring  ControlTest
        Autofill    Remediation
        5x Signoff

TIER 3R: REVIEWERS (1 per domain -- from Prompt Design System)
        NPA_REVIEWER | ORM_REVIEWER | DCE_REVIEWER | DESK_REVIEWER
        (groundedness check, compliance check, injection detection,
         approve/rework/escalate decisions)

TIER 4: KB_SEARCH | NOTIFICATION | DOC_PROCESSING | ANALYTICS (shared)
```

**Agent Archetype Pattern (from Prompt Design System):**
```
User -> Orchestrator (classify, route, entitle)
           -> Worker (execute bounded SOP, return structured JSON + provenance)
              -> Reviewer (validate grounding, compliance, schema, injection)
                 -> Orchestrator (compose desk-ready response)
                    -> User
```

---

## 5. Key Refactoring Changes

### 5.1 Agent Registry Extension
- **File:** `shared/agent-registry.json`
- Add `"domain"` field to every agent entry
- Add `"archetype"` field: `"orchestrator" | "worker" | "reviewer" | "utility"`

### 5.2 New Registry Files
- `shared/domain-registry.json` -- domain definitions
- `shared/tool-registry.json` -- tool-to-domain access mapping
- `shared/context-engineering/context-config.yaml` -- context assembly config
- `shared/prompt-studio/assembly-rules.yaml` -- prompt composition rules

### 5.3 DifyService Refactoring
- **File:** `src/app/services/dify/dify.service.ts`
- Replace 3 hardcoded `'MASTER_COO'` references with configurable `getDefaultOrchestrator()`
- Make `@@NPA_META@@` regex backward-compatible: `/@@(?:COO|NPA)_META@@/`

### 5.4 WorkspaceConfig Extension
- **File:** `src/app/components/shared/agent-workspace/agent-workspace.interfaces.ts`
- Extend `context` type: `'COMMAND_CENTER' | 'NPA_AGENT' | 'ORM_AGENT' | 'DCE_AGENT' | 'DESK_AGENT'`
- Add: `domain?: string`, `defaultOrchestrator?: string`

### 5.5 MCP Tools Reorganization
- Move 77 tools from flat `tools/` into `tools/platform/` and `tools/npa/`
- New namespaces: `tools/orm/`, `tools/dce/`, `tools/desk/`
- **New file:** `shared/tool-registry.json`

### 5.6 Database Strategy
- Rename platform tables via VIEW aliases (non-breaking)
- Keep all NPA tables as-is with `npa_` prefix
- New domain tables: `orm_*` (7), `dce_*` (6), `desk_*` (4)

---

## 6. Frontend Folder Restructure

```
src/app/
  core/                          # Platform core (auth, guards, models)
    services/ | interceptors/ | guards/ | models/

  platform/                      # Platform shared components
    services/
      dify/ (dify.service.ts, dify-agent.service.ts)
      chat-session.service.ts
      domain-registry.service.ts  # NEW
      context-assembly.service.ts # NEW -- frontend context helpers
    components/
      layout/ (sidebar, topbar, main-layout, chat-history)
      shared/ (agent-workspace, stage-progress, toast, audit-log)

  domains/                       # Domain feature modules (lazy-loaded)
    npa/  (services/ pages/ components/ models/)  -- EXISTING, reorganized
    orm/  (services/ pages/ components/ models/)  -- Phase 2
    dce/  (services/ pages/ components/ models/)  -- Phase 3
    desk/ (services/ pages/ components/ models/)  -- Phase 1 (simplest first)

  knowledge/                     # Cross-domain knowledge layer
    pages/ (knowledge-base, knowledge-studio, evidence-library)
```

---

## 7. Backend Structure

```
server/
  # Express (stays through Phase 3)
  index.js | routes/ | middleware/ | config/dify-agents.js

  # MCP Tools (reorganized immediately)
  mcp-python/tools/
    platform/ (session, audit, kb_search, notifications, jurisdiction)
    npa/      (ideation, classification, autofill, risk, governance, etc.)
    orm/      (incident_mgmt, rcsa, kri_monitor, etc.)  -- Phase 2
    dce/      (client_onboarding, kyc_refresh, etc.)     -- Phase 3
    desk/     (ticket_mgmt, kb_lookup, escalation)       -- Phase 1

  # Context Engineering configs
  shared/context-engineering/     # Context assembly configuration
  shared/prompt-studio/           # Prompt specs, modules, eval datasets

  # FastAPI (Phase 4)
  api/
    main.py | core/ | platform/ | domains/ | knowledge/
```

---

## 8. Phased Implementation Plan

**Strategy: FOUNDATION FIRST.** Build Context Engineering and Data layers as the bedrock, then Prompt Studio on top, then wire the architecture together. NPA is fully refactored as the gold-standard template before any new domain is touched.

**Why this order:**
- Context Engineering answers "WHAT data goes WHERE" — everything else depends on this
- Data Layer (MCP tools, DB) implements what Context Engineering defined
- Prompt Studio builds ON TOP of Context Engineering (every prompt spec has a `context_policy`)
- Architecture Refactor just WIRES together what CX + PX + Data already defined
- You can't restructure code until you know where things belong

```
EXECUTION ORDER:
  [1] Context Engineering  -->  defines the data/context contracts
  [2] Data Layer           -->  implements data access per CX contracts
  [3] Prompt Studio        -->  designs agent behavior using CX + Data
  [4] Architecture Refactor -->  wires CX + PX + Data into layers
  [5] Reviewer + E2E       -->  validates the complete system
  [6] Template + Playbook  -->  documents for future domains
```

---

### Phase 1: Context Engineering -- Full Implementation (Weeks 1-3)

**Goal:** Define and implement the complete data/context foundation. After this phase, we know exactly what data each agent needs, from where, in what priority, what's trusted, what's untrusted, and how context is assembled.

#### Week 1: Context Architecture Design

| Task | Deliverable |
|------|-------------|
| Define NPA Context Map | Document every data touchpoint: what data each of the 14 NPA agents consumes, from which source, and in what format |
| Define Source Priority Hierarchy for NPA | `shared/context-engineering/source-priority.yaml` -- 5-tier: SoR tools > bank SOPs > regulatory KB > external official > web |
| Define Trust Classification Rules | `shared/context-engineering/trust-classification.yaml` -- classify every input: trusted (MCP tool results, bank policies, DB records) vs untrusted (user free text, uploaded docs, retrieved emails) |
| Define Context Contracts per Agent Archetype | `shared/context-engineering/context-contracts.yaml` -- Orchestrator context (authz + intent + routing), Worker context (subtask + docs + tools + domain data), Reviewer context (worker JSON + provenance + validators) |
| Define Data Classification Taxonomy | `shared/context-engineering/data-classification.yaml` -- public / internal / confidential / restricted per data type |
| Define Domain Context Scoping Rules | `shared/context-engineering/scoping/npa-scoping.yaml` -- how `project_id`, `jurisdiction`, `product_type` filter data across all NPA tools |

#### Week 2: RAG Pipeline & Knowledge Architecture

| Task | Deliverable |
|------|-------------|
| Design RAG Pipeline Configuration | `shared/context-engineering/rag/rag-config.yaml` -- hybrid search (BM25 + vector + contextual embeddings + reranker), top_k: 40 initial -> 8 reranked |
| Define Chunking Strategies per Document Type | `shared/context-engineering/rag/chunking-strategies.yaml` -- default 800 tokens; legal docs by clause; SOPs by procedure step; regulatory by article |
| Create Corpora Registry | `shared/context-engineering/rag/corpora-registry.yaml` -- register all knowledge corpora with authority level, required metadata (doc_id, version, effective_date, owner, classification), and domain access |
| Map Existing KB Assets to Corpora | Audit `Context/Dify_KB_Docs/` and `Context/KB/` -- classify each into corpora, tag metadata |
| Define Answer Grounding Requirements | `shared/context-engineering/grounding-requirements.yaml` -- which claims MUST have citations (classification criteria, risk thresholds, governance rules, regulatory obligations) |
| Design Provenance Schema | `shared/context-engineering/provenance-schema.json` -- standard provenance fields every tool/agent must return: `doc_id`, `version`, `timestamp`, `source_type`, `authority_level` |

#### Week 3: Context Assembly Engine Implementation

| Task | Deliverable |
|------|-------------|
| Create NPA Context Config | `shared/context-engineering/domains/npa-context.yaml` -- primary_entity: project_id, context sources (SoR, SOPs, regulatory), scoping fields, untrusted content list |
| Create Platform Context Config | `shared/context-engineering/domains/platform-context.yaml` -- cross-domain context rules, user identity context, session memory rules |
| Implement Provenance in NPA MCP Tools | Refactor all 16 NPA tool modules to include provenance fields in return values (doc_id, version, timestamp, source_type) |
| Implement Context Scoping in MCP Tools | Verify `project_id` filtering works across all NPA tools; add scoping to tools that lack it |
| Create `user_context.py` platform tool | New MCP tool: resolves user role, department, entitlements, allowed domains |
| Implement Session Memory Schema | `shared/context-engineering/memory/session-state-schema.json` -- formalize what conversation state carries across turns |
| Implement Delegation Context Schema | `shared/context-engineering/memory/delegation-context.json` -- what context passes when agents delegate to each other |
| Create Context Engineering Validation Tests | Test: source priority resolves correctly, trust classification works, scoping filters data, provenance fields present |

---

### Phase 2: Data Layer Foundation (Weeks 4-5)

**Goal:** Implement the data access layer that Context Engineering defined. MCP tools reorganized, DB restructured, registries created.

#### Week 4: MCP Tools Reorganization + DB

| Task | Details |
|------|---------|
| Create `tools/platform/` directory | Move: `session.py`, `audit.py`, `kb_search.py`, `notifications.py`, `jurisdiction.py` + new `user_context.py` (6 modules) |
| Create `tools/npa/` directory | Move: all 16 NPA tool modules (ideation, classification, autofill, risk, risk_ext, governance, governance_ext, npa_data, workflow, monitoring, documents, prospects, dashboard, bundling, evergreen + jurisdiction moved to platform) |
| Create `tools/platform/domain_router.py` | New MCP tool: domain detection for MASTER_COO routing |
| Update `__init__.py` imports | Point to new `platform/` and `npa/` paths |
| Create `shared/tool-registry.json` | Map tool prefixes to domain access rules |
| Create DB migration `018_platform_table_renames.sql` | VIEW aliases: `npa_audit_log` -> `platform_audit_log`, `npa_agent_routing_decisions` -> `platform_routing_decisions` |
| Run migration | Apply views, verify NPA still works with old table names |

#### Week 5: Registries + Tool Validation

| Task | Details |
|------|---------|
| Create `shared/domain-registry.json` | NPA (active), ORM (planned), DCE (planned), DESK (planned) with icons, colors, prefixes, routes |
| Create `shared/agent-registry.json` extensions | Add `domain`, `archetype`, `prompt_spec`, `context_config` fields to all 18 agents |
| Reconnect Dify agent tool connections | Update all Dify Studio chatflows/workflows to use reorganized MCP tool paths |
| Test all 77 MCP tools from new paths | Verify every tool function works correctly |
| Validate tool-registry access rules | Verify NPA tools only accessible by NPA agents, platform tools by all |
| End-to-end NPA regression test | Full NPA workflow must work identically |

---

### Phase 3: Prompt Engineering Studio -- Full Implementation (Weeks 6-8)

**Goal:** Build the complete prompt design, versioning, and evaluation system for NPA. This builds on Context Engineering (every spec references context_policy) and Data (every spec references tool_policy).

#### Week 6: Core Module Library + Assembly Rules

| Task | Details |
|------|---------|
| Write 7 core prompt modules | `modules/core/identity-audience.yaml`, `instruction-hierarchy.yaml`, `trust-boundary.yaml`, `tool-discipline.yaml`, `provenance.yaml`, `escalation.yaml`, `redaction.yaml` |
| Write NPA domain module | `modules/domain/npa-module.yaml` -- NPA SOPs, classification criteria, 5-party sign-off matrix, governance rules |
| Define Assembly Rules | `shared/prompt-studio/assembly-rules.yaml` -- how modules compose for Orchestrator / Worker / Reviewer archetypes |
| Define Versioning Bundle Schema | `shared/prompt-studio/versioning.yaml` -- bundle = prompt + tools + RAG + validators; semver; breaking vs non-breaking |
| Define Weighted Scoring Criteria | `shared/prompt-studio/scoring.yaml` -- grounding 30%, policy 25%, schema 15%, routing 15%, tool discipline 10%, cost 5% |
| Define Release Gate Requirements | `shared/prompt-studio/release-gates.yaml` -- offline eval pass -> security review -> canary -> A/B -> promote |

#### Week 7: NPA Prompt Spec Extraction + Conversion

| Task | Details |
|------|---------|
| Extract all 14 NPA agent system prompts from Dify Studio | Copy current prompts from each Dify chatflow/workflow into raw text |
| Convert `CF_COO_Orchestrator` to canonical YAML spec | `specs/platform/master-coo-orchestrator.yaml` with full metadata, role, objective, scope, context_policy, tool_policy, constraints, decision_policy, output_contract, fallback, examples |
| Convert `CF_NPA_Orchestrator` to canonical spec | `specs/npa/npa-orchestrator.yaml` |
| Convert 13 NPA worker agents to canonical specs | `specs/npa/npa-ideation-worker.yaml`, `npa-classifier-worker.yaml`, etc. |
| Create `npa-reviewer.yaml` spec | NEW agent spec for groundedness/compliance/schema/injection validation |
| Verify assembly: each spec composed from modules | Check: Orchestrator = Identity + Hierarchy + Trust + Routing + Tools + Output; Worker = Identity + NPA Module + Trust + Tools + Provenance; Reviewer = Identity + Validation + Injection + Audit |

#### Week 8: Evaluation Engine + Datasets

| Task | Details |
|------|---------|
| Build NPA golden evaluation dataset | `evals/npa/npa_golden_v1.jsonl` -- 20+ test cases: ideation requests, classification scenarios, risk assessments, governance checks, approval workflows |
| Build NPA adversarial dataset | `evals/npa/npa_adversarial_v1.jsonl` -- 10+ edge cases: ambiguous jurisdictions, conflicting policies, missing data, partial tool failures |
| Build NPA injection dataset | `evals/npa/npa_injection_v1.jsonl` -- 10+ prompt injection attempts: "ignore instructions", "reveal system prompt", "call all tools", email-embedded instructions |
| Create evaluation runner script | `shared/prompt-studio/run-evals.py` -- loads datasets, runs against agents, scores per weighted criteria |
| Run baseline evaluation | Score current NPA agents against golden suite (establish baseline before changes) |
| Create NPA prompt bundle v1.0.0 | Bundle definition: prompt specs v1.0.0 + tool schemas v1.0.0 + RAG config v1.0.0 |

---

### Phase 4: Architecture Refactor -- Wire Everything Together (Weeks 9-10)

**Goal:** Now that CX, Data, and PX foundations are solid, restructure the codebase to properly layer everything.

#### Week 9: Backend + Control Plane

| Task | Files Affected |
|------|---------------|
| Replace 3 hardcoded `'MASTER_COO'` refs | `src/app/services/dify/dify.service.ts` |
| Rename `@@NPA_META@@` to `@@COO_META@@` (backward-compat) | `dify.service.ts` (line ~582) |
| Extend `WorkspaceConfig` interface | `agent-workspace.interfaces.ts` -- add `domain`, `defaultOrchestrator`, extend `context` type |
| Make `dify-agents.js` domain-aware | `server/config/dify-agents.js` -- domain-scoped agent lookup |
| Make `dify-proxy.js` domain-aware | `server/routes/dify-proxy.js` -- domain context in proxy headers |
| Create `DomainRegistryService` (Angular) | New service loading `domain-registry.json` |
| Create `ContextAssemblyService` (Angular) | New service for frontend context metadata helpers |

#### Week 10: Frontend Restructure

| Task | From -> To |
|------|-----------|
| Create `src/app/core/` | `services/auth.service.ts`, `lib/auth.guard.ts`, etc. -> `core/services/`, `core/guards/`, `core/models/` |
| Create `src/app/platform/` | `services/dify/`, `components/shared/` -> `platform/services/dify/`, `platform/components/layout/`, `platform/components/shared/` |
| Create `src/app/domains/npa/` | `pages/npa-agent/`, `pages/coo-npa/`, `components/npa/`, `components/dashboard/`, `components/draft-builder/` -> `domains/npa/pages/`, `domains/npa/components/`, `domains/npa/services/`, `domains/npa/models/` |
| Create `src/app/knowledge/` | `pages/knowledge-*`, `pages/evidence-*` -> `knowledge/pages/` |
| Create `domains/npa/npa.routes.ts` | Extract NPA routes from `app.routes.ts` into lazy-loaded module |
| Refactor `app.routes.ts` | Platform routes + lazy domain imports |
| Refactor `AppSidebarComponent` | Static -> dynamic nav from `DomainRegistryService` |
| Full NPA regression test | Every page, every workflow, every agent -- works identically |

---

### Phase 5: Reviewer Agent + End-to-End Validation (Week 11)

| Task | Details |
|------|---------|
| Create NPA_REVIEWER Dify chatflow | Validates: groundedness, policy compliance, schema, injection resistance |
| Add NPA_REVIEWER to agent-registry.json | Tier 3R, archetype: reviewer, domain: NPA |
| Wire reviewer into NPA delegation flow | Worker -> Reviewer -> Orchestrator (approve/rework/escalate) |
| Create reviewer tool schemas | `schema_validator`, `pii_redaction_scanner` |
| End-to-end test: full NPA workflow | Ideation -> Classification -> Risk -> Governance -> Sign-off -> Reviewer -> Response |
| Run NPA golden eval suite | All 20+ cases pass weighted score > 0.80 |
| Run NPA injection eval suite | All injection attempts detected/blocked |
| Run NPA adversarial eval suite | Edge cases handled with correct escalation |
| Performance baseline | Measure p50/p95 latency for each NPA agent |

---

### Phase 6: Template Documentation + Domain Onboarding Playbook (Week 12)

| Task | Details |
|------|---------|
| Create "Domain Onboarding Playbook" | Step-by-step: how to add a new domain using NPA as template |
| Context Engineering checklist per domain | What context configs, RAG corpora, trust rules, scoping to create |
| Prompt Studio checklist per domain | What specs, modules, eval datasets to create |
| Data Layer checklist per domain | MCP tool namespace, DB tables, tool-registry entries |
| Frontend checklist per domain | Angular module structure, lazy routes, domain components |
| Dify checklist per domain | Agent naming, chatflow structure, tool connections |

---

### Phase 7+: Future Domains (Post NPA Refactor)

With NPA fully refactored, each new domain follows the playbook:

| Domain | Estimated Effort | Key Assets |
|--------|-----------------|------------|
| **Desk Support** (simplest, 3 agents) | 3 weeks | Context config + prompt specs + 4 tables + 3 MCP tools + 3+1 Dify agents + Angular module |
| **ORM** (medium, 7 agents) | 4 weeks | Context config + prompt specs + 7 tables + 7 MCP tools + 8+1 Dify agents + Angular module |
| **DCE** (medium, 5 agents) | 3 weeks | Context config + prompt specs + 6 tables + 5 MCP tools + 6+1 Dify agents + Angular module |
| **Platform Hardening** | 4 weeks | Langfuse, guardrails engine, FastAPI migration, admin UIs for CX + PX |
| **MBS Integration** | 4 weeks | Entra ID, SPIFFE, Purview, Defender, self-hosted Dify, Agent 365 |

---

## 9. Critical Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Single DB with domain-prefixed tables** | Cross-domain queries needed; Dify connects to 1 endpoint |
| 2 | **Single Dify workspace** with naming `{prefix}_{domain}_{function}` | Shared KB datasets; single API key |
| 3 | **Express stays through Phase 3**, FastAPI in Phase 4 | Don't port 24 routes while building 3 new domains |
| 4 | **Domain-specific result renderers** | NPA risk view != ORM RCSA view; `cardType` extensible |
| 5 | **`@@COO_META@@` with backward compat** | Regex accepts both COO and NPA |
| 6 | **Context Engineering as separate layer from Prompt Studio** | Context = WHAT data enters LLM; Prompts = HOW to instruct LLM |
| 7 | **Reviewer agent archetype per domain** | From Prompt Design System -- validates grounding, compliance, injection before response reaches user |
| 8 | **Prompt specs as YAML/JSON bundles (not inline Dify text)** | Version-controlled, composable, testable, auditable |

---

## 10. Critical Files to Modify/Create

| File | Change |
|------|--------|
| `shared/agent-registry.json` | Add `domain` + `archetype` fields |
| `src/app/services/dify/dify.service.ts` | 3x MASTER_COO -> configurable; envelope regex |
| `src/app/components/shared/agent-workspace/agent-workspace.interfaces.ts` | Extend WorkspaceConfig |
| `server/routes/dify-proxy.js` | Make domain-aware |
| `server/config/dify-agents.js` | Domain-scoped agent lookup |
| `server/mcp-python/tools/` | Reorganize into platform/ and npa/ |
| `shared/context-engineering/` (NEW) | Context config, RAG config, source priority, trust classification |
| `shared/prompt-studio/` (NEW) | Prompt specs, module library, assembly rules, eval datasets |
| `shared/domain-registry.json` (NEW) | Domain definitions |
| `shared/tool-registry.json` (NEW) | Tool-to-domain access |

---

## 11. Verification Plan

**After each phase, verify before proceeding:**

| Phase | Verification |
|-------|-------------|
| Phase 1 (Context Eng) | All context configs parse; source priority resolves correctly; trust classification works; provenance fields in all NPA MCP tool outputs; RAG pipeline config valid; context scoping filters data correctly |
| Phase 2 (Data Layer) | All 77 MCP tools work from new `platform/` + `npa/` paths; Dify agents reconnected; DB views created and NPA works with old table names; tool-registry access rules enforced |
| Phase 3 (Prompt Studio) | All 15 NPA specs parse valid YAML; modules compose per assembly rules; eval datasets load; golden suite runs against current agents (baseline score established); prompt bundle v1.0.0 defined |
| Phase 4 (Architecture) | DifyService resolves agents via configurable method; `@@COO_META@@` works; frontend restructured into `core/` + `platform/` + `domains/npa/` + `knowledge/`; all routes work; sidebar dynamic |
| Phase 5 (Reviewer + E2E) | Full flow: User -> MASTER_COO -> NPA_ORCH -> Worker -> NPA_REVIEWER -> Response; golden score > 0.80; injection suite blocked; p95 latency measured |
| Phase 6 (Template) | Domain Onboarding Playbook complete; team can follow it to scaffold Desk Support in < 1 day |

**Critical regression gate:** After EVERY phase, run full NPA workflow end-to-end. Nothing should break. The user experience must remain identical until the Reviewer agent adds its validation layer.
