# Architecture Research V3: 7-Plane Mapping to NPA Agentic Workbench

**Mapping Document: Enterprise Agentic Architecture -> COO NPA Workbench**
**Constraints Applied: Dify | Python-Only Open Source | Angular Frontend**
**Version:** 1.0 | March 2026

---

## How to Read This Document

Every section of the Enterprise Agentic Architecture (`ENTERPRISE-AGENTIC-ARCHITECTURE-APAC-BANK.md`) is mapped to what **exists today** in the NPA Workbench, what is **partially implemented**, and what is **missing**. Each item gets a status:

- **IMPLEMENTED** --- Exists in codebase and is functional
- **PARTIAL** --- Some elements exist, gaps identified
- **MISSING** --- Not yet built, needs to be added
- **ADAPTED** --- Architecture recommendation modified for Dify/Python/Angular constraints
- **N/A** --- Not applicable to current scope (single jurisdiction Phase 0)

---

## Constraint Summary (Tech Stack Locks)

| Constraint | Architecture Recommendation | Our Decision | Impact |
|---|---|---|---|
| **Use Dify** | LangGraph for agent framework | Dify Chatflow + Workflow | Orchestration is visual/declarative, not programmatic |
| **Python-only OSS** | BullMQ, Pino, opossum (Node.js) | Celery, structlog, pybreaker (Python) | All backend logic moves to Python |
| **Angular Frontend** | No frontend specified | Angular 20 + Tailwind + Lucide | Presentation layer only, no context assembly |

---

## PLANE 1: INTELLIGENCE --- Model Access & Routing

### Architecture Says

Tri-tier model strategy (Sovereign / Frontier / Efficient) with a Model Router as single entry point. Multi-provider, multi-tier, jurisdiction-aware routing.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Tier S: Sovereign** | On-premise Llama/Qwen/Mistral via vLLM | **MISSING** | No self-hosted models. All LLM calls go through Dify Cloud. |
| **Tier 1: Frontier** | Claude Opus/Sonnet, GPT-4o, Gemini Ultra with ZDR | **PARTIAL** | Dify Cloud uses LLM providers configured per app. Model selection is inside Dify, not externally controlled. Currently using primarily one provider per agent. |
| **Tier 2: Efficient** | Claude Haiku, GPT-4o-mini, Gemini Flash | **PARTIAL** | Some Dify workflows use smaller models for classification/routing. But no explicit tier routing logic. |
| **Model Router** | Central gateway with 6-step routing (classification, jurisdiction, complexity, cost, rate limit, fallback) | **MISSING** | Dify handles model selection internally per app. No external Model Router exists. Express proxy (`server/index.js`) routes to Dify agents but does NOT select models. |
| **Provider Abstraction Interface** | Unified `IntelligenceRequest/Response` contract | **ADAPTED** | Dify abstracts provider differences. Our contract is the `@@NPA_META@@` envelope, not an `IntelligenceRequest`. The envelope serves as the output contract but has no input-side abstraction. |
| **Data Classification Check** | Route RESTRICTED data to Tier S only | **MISSING** | No data classification tagging on LLM requests. All data goes to Dify Cloud (Tier 1 equivalent). NRIC/PII masking before cloud calls is not implemented. |
| **Jurisdictional Routing** | Route by jurisdiction to local DC | **N/A (Phase 0)** | Single jurisdiction (Singapore) in Phase 0. No multi-DC routing needed yet. |
| **Cost Budget Check** | Per-user, per-department, per-session cost tracking | **MISSING** | No cost tracking at request level. Dify tracks token usage internally but not exposed per-department. |
| **Rate Limit Check** | Per-model, per-user rate limits | **PARTIAL** | Express has rate limiting (100 general, 30 agent, 10 auth per 15min) but this is API-level, not model-level. |
| **Fallback Chain** | Primary -> fallback (same tier, different provider) -> Tier S -> cached -> graceful error | **PARTIAL** | Express has retry logic for Dify MCP errors (WF_MAX_RETRIES=2). Dify chat has DIFY_CHAT_MAX_RETRIES. But no cross-provider fallback or Tier S fallback. |
| **Multi-provider strategy** | At least 2 providers per tier | **MISSING** | Single provider dependency per Dify app. No documented exit plan per MAS TRMG Section 5.4. |

### What Must Be Built

1. **PII Masking Pipeline** (Python/Presidio) --- Mask NRIC/FIN/HKID before any Dify call
2. **Cost Tracking Middleware** (Python) --- Log tokens consumed per request, per user, per department
3. **Provider Abstraction Layer** (Python/LiteLLM) --- For Phase 3 multi-provider support
4. **Data Classification Tagger** (Python) --- Tag each request as RESTRICTED/CONFIDENTIAL/INTERNAL/PUBLIC

### Dify Adaptation Note

Dify owns model selection. The architecture's Model Router is **embedded inside Dify** per app configuration. To achieve multi-provider fallback, we would need either:
- Option A: Configure Dify apps with fallback model settings (Dify supports this natively)
- Option B: Build a Python LiteLLM proxy that Dify calls instead of direct provider APIs

---

## PLANE 2: CONTEXT --- Information Assembly

### Architecture Says

Server-side context assembly with parallel fetch, data classification, jurisdictional filtering, token budget allocation, and relevance scoring. Two-stage RAG: coarse metadata scoping then fine-grained semantic retrieval with cross-encoder reranking.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Server-side assembly** | All context assembled server-side, client sends only identifiers | **IMPLEMENTED** | Angular sends `{ agent_id, query, project_id }`. Express proxies to Dify. Dify assembles context from KB + tools. Client never sees raw context. |
| **Parallel Fetch** | Entity data, transactions, regulatory KB, prior results, few-shot examples fetched in parallel | **PARTIAL** | Dify Workflow nodes fetch data via MCP tools. Some workflows execute tools sequentially (ReAct pattern), not parallel. Chatflows use agent reasoning to decide tool calls. |
| **Token Budget Management** | Explicit allocation: system prompt 3-5K, KB 10-20K, entity data 10-25K, etc. | **MISSING** | No explicit token budgeting. Dify manages context window internally. No overflow strategy documented. |
| **Context Budget Allocation** | Reserve 10-20K for response headroom, never allocate to context | **MISSING** | Managed by Dify internally. Not configurable per-request. |
| **Dynamic KB Scoping** | Two-stage: metadata filter (deterministic) then semantic retrieval with cross-encoder reranking | **PARTIAL** | Dify Knowledge Bases use vector search (embedding + retrieval). KB_NPA_CORE_CLOUD and KB_NPA_AGENT_KBS are attached per agent. But NO cross-encoder reranking. NO metadata-based pre-filtering (coarse scoping). |
| **KB Architecture** | Curated, tagged documents with jurisdiction + product category metadata | **PARTIAL** | `kb_documents` table exists with type tags (POLICY, REGULATION, GUIDELINE, TEMPLATE, FAQ). `search_kb_documents` tool supports keyword + type filtering. But NO jurisdiction tagging. NO product category tagging on KB docs. |
| **Context Failure: Poisoning** | Schema validation on agent outputs before they enter context | **PARTIAL** | `@@NPA_META@@` envelope provides structured output. Express parses and validates envelope presence. But no schema validation (Zod/Pydantic) on inter-agent data passed through Dify. |
| **Context Failure: Stale Context** | TTL-based cache invalidation, critical data always fetched fresh | **PARTIAL** | MCP tools fetch data from MySQL on every call (no caching). But Dify KB embeddings may be stale if documents are updated without re-indexing. |
| **Context Failure: Jurisdictional Leakage** | Assembly pipeline enforces jurisdiction filtering | **N/A (Phase 0)** | Single jurisdiction. But `npa_jurisdictions` table exists with 3 tools for multi-jurisdiction support. |
| **Context Failure: Over-Contextualization** | Relevance decay scoring on conversation history | **MISSING** | Dify manages conversation history sliding window. No explicit relevance decay. Risk of agent anchoring on prior incorrect assessments. |
| **Context Failure: Privilege Escalation** | Role-based context filtering in assembly | **PARTIAL** | `get_user_profile` tool returns user role. RBAC middleware checks roles on Express routes. But Dify context assembly does NOT filter data by user role. A MAKER sees the same KB context as a COO. |

### What Must Be Built

1. **Cross-Encoder Reranking** (Python) --- Add reranker after Dify KB retrieval for precision
2. **KB Metadata Tagging** --- Tag all KB documents with jurisdiction + product category for coarse scoping
3. **Role-Based Context Filtering** --- Dify system prompts should include role-aware instructions
4. **Token Budget Monitoring** --- Log context window utilization per Dify call for optimization

---

## PLANE 3: REASONING --- Agent Runtime & Orchestration

### Architecture Says

Determinism-first (Level 4 default). Supervisor pattern for multi-agent orchestration. Typed inter-agent contracts. Execution controls: max iterations, token budget, timeout, confidence threshold.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Autonomy Level** | Level 4 (Hybrid): deterministic for critical paths, LLM for judgment | **IMPLEMENTED** | Dify Workflows = Level 5 deterministic DAGs. Dify Chatflows = Level 3-4 (instruction-guided with tool access). Classification, Risk, Autofill, Governance are all Workflows (Level 5). Ideation, Query Assistant are Chatflows (Level 3). |
| **Supervisor Pattern** | Central supervisor controls routing with decision log | **IMPLEMENTED** | `MASTER_COO` agent is the supervisor. Routes to specialists via `@@NPA_META@@` envelope with `agent_action: ROUTE_DOMAIN`. `log_routing_decision` tool records every routing choice. |
| **Agent Runtime: Workflow Mode** | Deterministic DAG: Step 1 -> Step 2 -> Decision Gate -> Output | **IMPLEMENTED** | Dify Workflows are exactly this. CLASSIFIER, RISK, AUTOFILL, GOVERNANCE are deterministic DAGs with LLM nodes for judgment. |
| **Agent Runtime: ReAct Mode** | Think -> Act -> Observe -> Think -> Answer | **IMPLEMENTED** | Dify Agent nodes within workflows use ReAct loop. Chatflows (IDEATION, DILIGENCE) use multi-turn ReAct with tool calls. |
| **Agent Runtime: Planning Mode** | Plan -> Execute -> Reflect -> Replan | **MISSING** | No Dify app uses explicit planning mode. For complex multi-step workflows (e.g., full NPA lifecycle), orchestration is manual (one agent per turn, human checkpoint between). |
| **Execution Controls: Max Iterations** | 10 default, configurable | **PARTIAL** | Dify has internal iteration limits per agent node. Not configurable from Express. Default varies by Dify app. |
| **Execution Controls: Token Budget** | 50K output tokens per session | **MISSING** | No per-session token budget enforcement. Dify manages internally. |
| **Execution Controls: Timeout** | 120s per agent, 600s per workflow | **IMPLEMENTED** | Express: 600s (10 min) timeout for Dify routes. MCP tools: individual timeouts. AbortController for stream cancellation. |
| **Execution Controls: Confidence Threshold** | Below 0.7 -> escalate to human | **PARTIAL** | Agent tools log `confidence_score` in audit trail. `session_log_message` stores confidence. But NO automated escalation when confidence < 0.7. Escalation is manual. |
| **Execution Controls: Tool Call Limit** | Max 20 tool calls per cycle | **MISSING** | Not enforced externally. Dify manages tool call counts internally per agent node. |
| **Multi-Agent Orchestration** | Supervisor pattern default | **IMPLEMENTED** | 4-tier hierarchy: MASTER_COO -> NPA_ORCHESTRATOR -> Specialists -> Utilities. Supervisor routes via metadata envelope. |
| **Sequential Pipeline** | Fixed-step: Ingest -> Classify -> Analyze -> Score -> Report | **IMPLEMENTED** | NPA lifecycle is a sequential pipeline: Ideation -> Classification -> Risk -> Autofill -> Governance -> Doc Lifecycle -> Monitoring. Each step is a separate Dify app called sequentially. |
| **Fan-Out/Fan-In** | Parallel independent analysis | **MISSING** | No parallel agent execution. All specialist agents are called sequentially (one-action-per-turn policy). Could be implemented in Phase 2 for Classification + Risk running in parallel. |
| **Handoff Pattern** | Agent-to-agent with logged reasoning, max 3 hops | **PARTIAL** | MASTER_COO delegates to specialists. AgentWorkspaceComponent tracks delegation stack. But no max-hop enforcement. No automatic supervisor intervention after N handoffs. |
| **Inter-Agent Contracts** | Typed contracts: `AgentResult { result, confidence, citations, flags, _internal }` | **ADAPTED** | `@@NPA_META@@` envelope is the typed contract. Contains `{ agent_action, agent_id, payload, trace }`. Payload schema varies per agent type. Not formally validated with Pydantic/Zod between agents. |
| **Output Schema Validation** | Zod/Pydantic schema validation on every output | **PARTIAL** | Express parses `@@NPA_META@@` envelope and extracts metadata. If parsing fails, returns `SHOW_RAW_RESPONSE`. But no strict schema validation (malformed payload content is passed through). |

### What Must Be Built

1. **Schema Validation on Agent Output** (Python/Pydantic) --- Define Pydantic models per agent_action type, validate payload before Angular receives it
2. **Confidence-Based Escalation** --- Automated HITL trigger when confidence < 0.7
3. **Parallel Agent Execution** --- Fan-out Classification + Risk in parallel for latency reduction
4. **Tool Call Budget Enforcement** --- Track and cap tool calls per agent session

### Dify Adaptation Note

Dify replaces LangGraph as the Reasoning Plane runtime. Key differences:
- LangGraph: Programmatic state graphs with code-level control
- Dify: Visual workflow builder with drag-and-drop nodes

**What Dify does well:** Deterministic workflows (Level 4-5), ReAct agent loops, conversation management, KB integration
**What Dify lacks:** Programmatic state checkpointing, saga patterns, custom supervisor logic, typed contract enforcement

The gap is filled by the **Python service layer** (FastAPI + FastMCP) which handles business logic, validation, and persistence that Dify cannot.

---

## PLANE 4: ACTION --- Tools, Memory & External Systems

### Architecture Says

All tools via MCP, grouped into domains (Data/Analytics/Write/External/Memory) with explicit allowlisting per agent. 4-tier memory (Context Window / Working Memory / Long-Term / Procedural KB). Tool governance matrix.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **MCP Tool Protocol** | All tools exposed via MCP | **IMPLEMENTED** | 77 MCP tools across 21 Python modules. FastMCP server on port 3001. All tools registered via `registry.py`. |
| **Tool Domain Grouping** | DATA (read) / ANALYTICS (compute) / WRITE / EXTERNAL / MEMORY | **IMPLEMENTED** | Tools organized by module: audit, autofill, bundling, classification, dashboard, documents, evergreen, governance, governance_ext, ideation, jurisdiction, kb_search, monitoring, notifications, npa_data, prospects, risk, risk_ext, session, workflow. Each tool is tagged R/W/C (Read/Write/Compute). |
| **Tool Governance: Per-Agent Allowlisting** | Every tool explicitly allowlisted per agent | **IMPLEMENTED** | Dify apps have tool access configured per workflow/chatflow. MASTER_COO: 8 tools (read + route). IDEATION: 7 tools. CLASSIFIER: 8 tools. RISK: 10 tools. GOVERNANCE: 18 tools. DILIGENCE: 17 read-only tools. Documented in AGENT_ARCHITECTURE.md. |
| **Tool Governance: Orchestrator has no direct tools** | Orchestrator delegates, never calls tools directly | **IMPLEMENTED** | MASTER_COO has only read + routing tools. Cannot write NPA data, run assessments, or modify governance state. All write operations delegated to specialists. |
| **Idempotent by Default** | Write tools check existing state before writing | **IMPLEMENTED** | `autofill_populate_field` uses UPSERT pattern. `governance_record_decision` checks current status. `bundling_apply` validates assessment before applying. |
| **Audit Trail Built-In** | Every tool call logs who, what, when, result | **IMPLEMENTED** | `audit_log_action` tool creates immutable audit entries in `npa_audit_log`. Express audit middleware auto-logs all POST/PUT/PATCH/DELETE. Tools log `agent_id`, `confidence`, `reasoning_chain`, `source_citations`. |
| **Scoped by Jurisdiction** | Data tools auto-filter by jurisdiction | **PARTIAL** | `jurisdiction.py` module with 3 tools: `get_npa_jurisdictions`, `get_jurisdiction_rules`, `adapt_classification_weights`. Jurisdiction data exists in `npa_jurisdictions` table. But tools do NOT auto-filter queries by requesting jurisdiction. A Singapore agent CAN query all data. |
| **Composite Tools** | Combined queries for constrained agents | **IMPLEMENTED** | `get_npa_by_id` returns project + workflow state + signoff summary in one call. `get_dashboard_kpis` aggregates pipeline, active NPAs, cycle times, approval rates. `get_pending_notifications` aggregates SLA breaches + breach alerts + pending approvals. |
| **Timeout and Fallback** | 10s default timeout per tool, structured error on failure | **PARTIAL** | Python async tools have implicit timeouts via database connection pool. But no explicit per-tool timeout configuration. Errors return structured `{ success: false, error: "..." }` format. |
| **Memory Tier 0: Context Window** | Current reasoning step, ephemeral | **IMPLEMENTED** | Dify manages context window per LLM call. System prompt + tool results + recent messages. Destroyed after response. |
| **Memory Tier 1: Working Memory** | Session-scoped, Redis | **PARTIAL** | `agent_sessions` + `agent_messages` tables in MySQL (not Redis). `session_create` and `session_log_message` tools persist conversation state. Angular `ChatSessionService` maintains in-memory session cache with signals. But MySQL is slower than Redis for session state. |
| **Memory Tier 2: Long-Term Memory** | Cross-session, vector DB (pgvector), jurisdiction-scoped | **MISSING** | No vector store for agent memories. No long-term memory across sessions. No entity-level fact storage. No memory decay or conflict resolution. |
| **Memory Tier 3: Procedural Knowledge** | Organization-wide RAG | **IMPLEMENTED** | Dify Knowledge Bases (KB_NPA_CORE_CLOUD + KB_NPA_AGENT_KBS). `kb_documents` table with search tools. Contains policies, regulations, guidelines, templates, FAQs. |
| **Memory: Right to Erasure** | Delete all memories for a customer/entity | **PARTIAL** | `DELETE /api/agents/sessions/:id` exists. But no bulk erasure for all data related to a specific entity across all tables. |
| **Memory: Provenance** | Every memory stores source (conversation, agent, timestamp) | **IMPLEMENTED** | `agent_messages` stores `role`, `agent_id`, `confidence`, `reasoning`, `citations`, `timestamp`. `npa_audit_log` stores full provenance per action. |
| **Memory Write-Through Pattern** | Extract facts -> Score importance -> Check conflicts -> Write with provenance | **MISSING** | No automated fact extraction from agent results. No importance scoring. No conflict detection. Persist routes save raw agent output, not extracted facts. |

### NPA Workbench Tool Inventory (77 Tools)

| Category | Module(s) | Tool Count | Read | Write | Compute |
|---|---|---|---|---|---|
| Audit | audit.py | 4 | 2 | 1 | 1 |
| Autofill | autofill.py | 5 | 3 | 2 | 0 |
| Bundling | bundling.py | 2 | 0 | 1 | 1 |
| Classification | classification.py | 5 | 2 | 3 | 0 |
| Dashboard | dashboard.py | 1 | 0 | 0 | 1 |
| Documents | documents.py | 5 | 2 | 2 | 1 |
| Evergreen | evergreen.py | 3 | 1 | 1 | 1 |
| Governance | governance.py, governance_ext.py | 11 | 4 | 5 | 2 |
| Ideation | ideation.py, prospects.py | 7 | 4 | 3 | 0 |
| Jurisdiction | jurisdiction.py | 3 | 1 | 0 | 2 |
| KB Search | kb_search.py | 3 | 3 | 0 | 0 |
| Monitoring | monitoring.py | 7 | 3 | 2 | 2 |
| Notifications | notifications.py | 3 | 1 | 2 | 0 |
| NPA Data | npa_data.py | 4 | 2 | 2 | 0 |
| Risk | risk.py, risk_ext.py | 8 | 4 | 2 | 2 |
| Session | session.py | 2 | 0 | 2 | 0 |
| Workflow | workflow.py | 5 | 3 | 2 | 0 |
| **TOTAL** | **21 modules** | **77** | **35** | **29** | **13** |

### What Must Be Built

1. **Long-Term Memory Store** (pgvector) --- Entity-level facts, cross-session learning, jurisdiction-scoped
2. **Memory Write-Through Pipeline** (Python) --- Extract significant facts from agent results, score importance, persist with provenance
3. **Per-Tool Timeout Configuration** (Python) --- Explicit timeout per tool category (read: 5s, write: 10s, compute: 30s)
4. **Jurisdiction Auto-Filtering** --- MCP tools should auto-scope data queries by requesting jurisdiction

---

## PLANE 5: TRUST --- Security, Governance & Human Oversight

### Architecture Says

Trust as a continuous security envelope wrapping Planes 2, 3, 4. Input trust (injection detection, PII masking, topic boundaries). Processing trust (tool authorization, cross-agent data flow control). Output trust (PII leakage, toxicity, schema validation). HITL with risk-based gating. Immutable audit trail. RBAC. Explainability records.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Trust as Wrapper** | Every operation passes through trust controls | **PARTIAL** | Trust controls exist but are NOT continuous. Auth middleware is global. Audit middleware auto-logs mutations. But NO trust checks on individual tool calls within Dify. No trust checks on inter-agent data flow. |
| **INPUT: Prompt Injection Detection** | Heuristic scanner + classifier (LlamaFirewall/NeMo) | **MISSING** | No prompt injection scanning. User queries go directly to Dify without input sanitization. |
| **INPUT: PII Detection & Masking** | Presidio + custom APAC identifiers (NRIC, HKID, Aadhaar) | **MISSING** | No PII detection or masking before Dify calls. Raw user input may contain NRICs, account numbers, names that reach Dify Cloud LLMs. |
| **INPUT: Topic Boundary Enforcement** | Classification model + allowlist per agent | **IMPLEMENTED** | Dify system prompts define topic scope per agent. MASTER_COO only routes NPA-related queries. Specialists reject off-topic queries. But enforcement is prompt-based, not model-based classification. |
| **INPUT: Data Classification Tagging** | RESTRICTED/CONFIDENTIAL/INTERNAL/PUBLIC per data element | **MISSING** | No data classification tagging. All data treated uniformly. |
| **PROCESSING: Tool Call Authorization** | Before every tool call, check agent's tool allowlist | **IMPLEMENTED** | Dify apps have tool access configured per agent. Each agent only sees its allowlisted tools. Enforced by Dify platform. |
| **PROCESSING: Cross-Agent Data Flow Control** | Check Agent B is authorized for data from Agent A | **MISSING** | When MASTER_COO routes to CLASSIFIER, the full user query is passed. No data stripping based on target agent's authorization scope. |
| **PROCESSING: Reasoning Trace Sanitization** | Scan traces for PII before logging | **MISSING** | Express logs reasoning traces to console and DB without PII scanning. Dify internal traces may contain customer data. |
| **PROCESSING: Token Budget Enforcement** | Hard kill switch when budget exceeded | **MISSING** | No token budget enforcement. |
| **OUTPUT: PII Leakage Detection** | Scan every output for unmasked PII | **MISSING** | Agent responses return directly to Angular without PII scanning. |
| **OUTPUT: Toxicity & Policy Compliance** | Scan for violence, discriminatory language, unauthorized financial advice | **PARTIAL** | Dify has basic content moderation. Agent system prompts include disclaimers. But no dedicated toxicity scanning on output. |
| **OUTPUT: Schema Validation** | Every structured output validated against schema | **PARTIAL** | `@@NPA_META@@` envelope parsed by Express. Basic structure validation (agent_action, payload present). But payload content NOT validated against per-agent schema. |
| **OUTPUT: Confidence Gating** | Below threshold -> flag for human review | **PARTIAL** | Agents log confidence scores. But no automated gating that blocks low-confidence outputs from reaching the user. |
| **HITL: Risk-Based Gating** | Critical (sync approval), High (async 4h), Medium (auto-approve), Low (autonomous) | **IMPLEMENTED** | NPA workflow enforces human checkpoints: one-action-per-turn policy means every agent action requires human trigger. Signoff matrix creates explicit approval gates per department. Escalation rules exist (3 loop-backs -> COO). SLA monitoring with automated escalation at 75%/100%/150%. |
| **HITL: Approval Workflow** | State checkpoint -> approval request -> agent WAITS -> resume/reject | **IMPLEMENTED** | Governance agent creates signoff matrix. Approvers review in parallel. `governance_record_decision` records approve/reject/rework. Workflow advances only after all required approvals. Agent does NOT proceed optimistically. |
| **HITL: Escalation** | Confidence < 0.5 -> human takeover, 3 tool failures -> support, conflicting results -> arbitration | **PARTIAL** | Loop-back circuit breaker at 3 rejections -> auto-escalate to COO. SLA breach escalation (5 levels defined in `ref_escalation_rules`). But no confidence-based auto-escalation. No tool-failure escalation. |
| **AUDIT: Immutable Trail** | Append-only, tamper-evident, 7-year retention | **IMPLEMENTED** | `npa_audit_log` table with structured entries. `audit_log_action` tool logs: who, what, when, result, confidence, reasoning, citations. Express audit middleware auto-logs all mutations. But table is not append-only at DB level (no write-once constraint). Retention policy not enforced. |
| **AUDIT: Explainability Record** | Decision, reasoning, data sources, model, confidence, alternatives considered | **PARTIAL** | Audit entries include `reasoning_chain` and `source_citations`. But no `alternatives_considered` field. No `model_used` field (Dify abstracts this). No formal explainability record format aligned with MAS FEAT. |
| **RBAC** | User roles -> Agent access -> Tool permissions -> Data scope | **IMPLEMENTED** | 5-level role hierarchy: ADMIN > COO > APPROVER > CHECKER > MAKER. Express `rbac()` middleware enforces role checks. `get_user_profile` tool exposes role to agents. `requireAuth()` blocks unauthenticated access. |
| **Periodic Trust Reviews** | Monthly automated scan, quarterly human review, annual audit | **MISSING** | No automated permission scanning. No quarterly review process. No annual trust audit. |

### What Must Be Built (Priority Ordered)

1. **PII Masking Pipeline** (Python/Presidio) --- Highest priority. Mask NRIC/FIN/names/account numbers before any Dify Cloud call. Unmask only in final display.
2. **Prompt Injection Scanner** (Python/LlamaFirewall) --- Scan all user inputs before forwarding to Dify.
3. **Output PII Scanner** (Python) --- Scan all agent responses before returning to Angular.
4. **Per-Agent Output Schema Validation** (Python/Pydantic) --- Define and enforce payload schemas per `agent_action` type.
5. **Confidence-Based HITL Gating** (Python) --- Block responses with confidence < 0.5, flag for human review.
6. **Append-Only Audit Table** --- Database-level write-once constraint on `npa_audit_log`.
7. **MAS FEAT Explainability Records** --- Formal explainability format with all required fields.
8. **Reasoning Trace Sanitization** --- PII scan on all logged traces.

---

## PLANE 6: OBSERVABILITY --- Visibility, Evaluation & Cost

### Architecture Says

Five pillars: distributed tracing (OpenTelemetry + Langfuse), continuous evaluation (LLM-as-judge), cost accounting (per-trace/session/department), regulatory compliance metrics, anomaly detection. Three-layer evaluation: deterministic graders, LLM-as-judge, human review. Regression testing gates deployment.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Distributed Tracing** | Correlation IDs across all services and planes | **PARTIAL** | `conversation_id` and `message_id` from Dify. `correlation_id` not explicitly propagated across Express -> Dify -> MCP -> MySQL. Basic `console.log` tracing in Express with `[EXPRESS ERROR]`, `[DIFY]` prefixes. |
| **OpenTelemetry** | Standard tracing across all services | **MISSING** | No OpenTelemetry instrumentation. No span hierarchy (Session -> Trace -> Span). |
| **Langfuse Integration** | LLM call tracing, cost tracking, prompt versioning | **MISSING** | No Langfuse. No LLM-specific tracing beyond Dify's internal analytics. |
| **Continuous Evaluation** | LLM-as-judge on 5-10% production samples | **MISSING** | No production evaluation pipeline. No sampling of production traces. |
| **Golden Dataset Tests** | 50-200 curated test cases per agent | **MISSING** | No golden datasets. No regression tests for prompts/agents. |
| **Pre-Deployment Regression** | Schema pass 100%, deterministic 95%, LLM-judge >= prior | **MISSING** | No automated evaluation gates on agent changes. Prompt changes deployed without regression testing. |
| **Cost Accounting** | Tokens x pricing -> cost per trace/session/department | **MISSING** | No cost tracking. Cannot answer "How much AI spend per business unit?" |
| **Regulatory Compliance Metrics** | HITL override rates, escalation patterns, explainability coverage | **PARTIAL** | Escalation data in `npa_escalations` table. Signoff data in `npa_signoffs`. Loop-back tracking in `npa_loop_backs`. But no dashboard aggregating compliance metrics. No override rate calculation. |
| **Anomaly Detection** | Spike in failures, cost increase, confidence distribution shift | **MISSING** | No anomaly detection. Express has basic error logging but no pattern analysis. |
| **Quality Dashboard** | Per-agent quality scores over time | **MISSING** | Agent health endpoint (`/api/dify/agents/health`) shows availability + total decisions. But no quality scoring over time. |
| **A/B Testing** | Prompt/model version comparison | **MISSING** | No A/B testing infrastructure. |
| **Structured Logging** | JSON structured logs with correlation IDs | **PARTIAL** | Express uses `console.log` with structured prefixes. MCP Python uses `print` statements. Not structured JSON (Pino/structlog). |

### What Must Be Built (Priority Ordered)

1. **Structured Logging** (Python/structlog) --- Replace print statements with structured JSON logs
2. **Correlation ID Propagation** --- Generate at Express, pass through Dify inputs, include in MCP tool calls
3. **Langfuse Integration** (Python) --- Trace all LLM calls with token counts, latency, cost
4. **Golden Dataset Creation** --- 50 test cases per agent (classifier, risk, autofill, governance)
5. **Regression Testing Pipeline** (Python/DeepEval) --- Gate agent prompt changes on golden dataset
6. **Cost Dashboard** (Angular) --- Department-level AI spend tracking
7. **Compliance Metrics Dashboard** (Angular) --- HITL rates, escalation patterns, SLA compliance

---

## PLANE 7: OPERATIONS --- Resilience, Scheduling & Lifecycle

### Architecture Says

Circuit breakers, retry with backoff, DLQ, state checkpointing, saga pattern, graceful degradation. Scheduled jobs. Event-driven triggers. Agent lifecycle: development -> testing -> staging -> canary -> production -> monitoring -> retirement.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Circuit Breaker** | Per external dependency, CLOSED->OPEN->HALF_OPEN | **MISSING** | No circuit breaker on Dify API calls, MCP tool calls, or database connections. If Dify is down, every request fails. |
| **Retry with Backoff** | Exponential + jitter, 3 retries (LLM), 5 (tools) | **PARTIAL** | Express Dify proxy: `WF_MAX_RETRIES=2` for MCP parse errors with 2s backoff. `DIFY_CHAT_MAX_RETRIES` for chat. Odd retries drop conversation_id (fresh state). But no exponential backoff. No jitter. MCP tools have no retry logic. |
| **Dead Letter Queue** | Failed jobs with full context, dashboard, manual replay | **MISSING** | No DLQ. Failed Dify calls return error to user. No queue for retry. No replay capability. |
| **State Checkpointing** | Hot (Redis) + Durable (PostgreSQL) | **PARTIAL** | `npa_workflow_states` table tracks stage transitions (durable). `agent_sessions` persist conversation state. But no hot checkpointing (Redis). If Dify workflow fails mid-execution, no resume from checkpoint. |
| **Saga Pattern** | Compensating actions for multi-system workflows | **MISSING** | No saga pattern. If a governance action succeeds but notification fails, no automatic rollback. |
| **Graceful Degradation** | Fallback providers, queue requests, inform user of degraded state | **PARTIAL** | Express returns structured `SHOW_ERROR` envelope on Dify failure. But no fallback provider. No request queuing. User sees error immediately. |
| **Job Queue** | BullMQ + Redis for async agent runs | **MISSING** | All agent calls are synchronous (request -> wait -> response). No background job processing. Autofill takes ~8 minutes and blocks the HTTP connection (10-min timeout). |
| **Scheduled Jobs** | Daily batch, weekly snapshots, 15-min SLA checks, 5-min health checks | **PARTIAL** | SLA monitor runs every 15 minutes (`startSlaMonitor()`). Agent health monitor runs every 5 minutes (`startHealthMonitor()`). DB keepalive every 60s. But no daily batch processing. No weekly compliance snapshots. No monthly regulatory reporting. |
| **Event-Driven Triggers** | Entity status change -> re-assess, risk breach -> escalate | **PARTIAL** | Governance tools create escalations on loop-back threshold. Monitoring tools create breach alerts on threshold violations. But these are tool-initiated, not event-driven (pub/sub). |
| **Agent Lifecycle: Canary** | New version serves 5% traffic, promote after 48h | **MISSING** | No canary deployment. All agent changes go to 100% traffic immediately. |
| **Agent Lifecycle: Versioning** | Version tracking per agent | **PARTIAL** | Dify has app versioning. But no external version registry or rollback mechanism in Express/Python. |
| **Agent Lifecycle: Retirement** | 30-day deprecation, traffic redirect, removal | **MISSING** | No deprecation process. No traffic redirect. No retirement workflow. |

### What Must Be Built (Priority Ordered)

1. **Circuit Breaker** (Python/pybreaker) --- On Dify API, MCP tools, database connections
2. **Background Job Queue** (Python/Celery + Redis) --- Move long-running agents (Autofill ~8min) to background processing
3. **DLQ with Replay** (Python/Celery) --- Failed agent jobs land in DLQ with full context, one-click replay
4. **Exponential Backoff with Jitter** (Python) --- Replace fixed 2s retry with proper backoff
5. **State Checkpointing in Redis** (Python) --- Hot state for agent workflow progress, resume on failure
6. **Daily Batch Jobs** (Python/Celery Beat) --- Scheduled re-assessment, SLA snapshots, compliance reports

---

## CROSS-CUTTING: DATA SOVEREIGNTY

### Architecture Says

Jurisdiction-scoped deployment topology. Global control plane (config only, no customer data). Per-jurisdiction data planes (DB, Redis, Vector, Tier S, Agents). Customer data NEVER leaves jurisdiction. Cross-border: only aggregated anonymized results.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **Sovereignty Mesh** | Per-jurisdiction data planes | **N/A (Phase 0)** | Single jurisdiction (Singapore). Single database. All data in one MySQL instance. |
| **Global Control Plane** | Config, routing rules, agent registry (NO customer data) | **PARTIAL** | `shared/agent-registry.json` is a global registry. `server/config/dify-agents.js` is global config. These contain no customer data. |
| **Cross-Border Protocol** | Task definition sent to local orchestrators, aggregated results returned | **N/A (Phase 0)** | Not needed yet. But `npa_jurisdictions` table and jurisdiction tools exist as foundation. |
| **Data Residency Compliance** | Customer data NEVER leaves jurisdiction's data plane | **RISK** | All data goes to Dify Cloud (US/global infrastructure). No data residency enforcement. Customer data (NPA details, risk assessments) leaves Singapore DC when sent to Dify Cloud LLMs. This is a compliance risk if strict data residency is required. |

### Phase 2-3 Requirement

When multi-jurisdiction deployment is needed:
1. Deploy per-jurisdiction MySQL + Redis + MCP tools
2. Configure Dify apps per jurisdiction (or deploy self-hosted Dify per region)
3. Implement cross-border aggregation protocol in Python
4. Add jurisdiction tagging to all data tables

---

## CROSS-CUTTING: PROTOCOL STRATEGY

### Architecture Says

MCP for vertical (agent <-> tools). A2A for horizontal (agent <-> agent, especially cross-jurisdiction). OpenTelemetry for observability.

### NPA Workbench Reality

| Component | Architecture | NPA Workbench Status | Details |
|---|---|---|---|
| **MCP (Vertical)** | Agent <-> Tools via FastAPI MCP servers | **IMPLEMENTED** | FastMCP server with 77 tools. SSE transport. Dify calls MCP tools via OpenAPI custom tool provider on Railway. |
| **A2A (Horizontal)** | Agent <-> Agent, gRPC with mTLS | **N/A (Phase 0)** | No agent-to-agent protocol. Inter-agent communication goes through Dify's internal routing. For Phase 3 cross-jurisdiction agents, A2A would be needed. |
| **OpenTelemetry** | Distributed tracing across planes | **MISSING** | No OpenTelemetry instrumentation. |

---

## MATURITY MODEL: Where We Are

### Architecture's 3-Phase Model vs NPA Workbench

| Phase | Architecture Target | NPA Workbench Status | Completion |
|---|---|---|---|
| **Phase 1: Foundation (M1-3)** | Single-agent, one use case, production-safe | **EXCEEDED** | ~85% |
| | Model Router with Tier 1+2 | PARTIAL (Dify manages internally) | 50% |
| | Server-side context assembly | IMPLEMENTED | 100% |
| | Single agent runtime (workflow, Level 4) | EXCEEDED (18 agents, 4 tiers) | 100% |
| | 10-20 MCP tools | EXCEEDED (77 tools) | 100% |
| | Input/output guardrails | PARTIAL (topic boundaries, no PII scan) | 30% |
| | RBAC on API endpoints | IMPLEMENTED | 100% |
| | Basic audit logging | IMPLEMENTED | 100% |
| | Structured logging | PARTIAL (console.log, not JSON) | 40% |
| | Correlation IDs | PARTIAL (conversation_id only) | 40% |
| | Basic retry + timeout | IMPLEMENTED | 80% |
| **Phase 2: Orchestration (M4-6)** | Multi-agent, production-hardened | **IN PROGRESS** | ~40% |
| | Tier S (sovereign) | MISSING | 0% |
| | Fallback chains across providers | MISSING | 0% |
| | Department-level cost budgets | MISSING | 0% |
| | Dynamic KB scoping | PARTIAL (Dify KB attached per agent) | 40% |
| | Token budget enforcement | MISSING | 0% |
| | Supervisor-based multi-agent orchestration | IMPLEMENTED (MASTER_COO) | 90% |
| | Typed inter-agent contracts | ADAPTED (@@NPA_META@@ envelope) | 70% |
| | Fan-out/fan-in parallel analysis | MISSING | 0% |
| | 40-60 MCP tools | EXCEEDED (77 tools) | 100% |
| | Tool governance (allowlisting) | IMPLEMENTED | 90% |
| | Long-term memory (pgvector) | MISSING | 0% |
| | HITL approval workflow | IMPLEMENTED (signoff matrix) | 90% |
| | PII masking pipeline | MISSING | 0% |
| | Tool call authorization checks | IMPLEMENTED (Dify-level) | 80% |
| | Explainability records | PARTIAL | 40% |
| | Golden dataset (50+ per agent) | MISSING | 0% |
| | Regression testing in CI/CD | MISSING | 0% |
| | Production sampling + eval | MISSING | 0% |
| | Cost dashboard | MISSING | 0% |
| | Circuit breakers | MISSING | 0% |
| | DLQ with replay | MISSING | 0% |
| | Job queue (async agents) | MISSING | 0% |
| | Scheduled batch jobs | PARTIAL (SLA + health monitors) | 30% |
| **Phase 3: Scale (M7-12)** | Multi-jurisdiction, enterprise-grade | **NOT STARTED** | ~5% |
| | Multi-jurisdiction model routing | N/A (Phase 0) | 0% |
| | Cross-encoder reranking | MISSING | 0% |
| | Agent registry (catalog) | IMPLEMENTED (agent-registry.json) | 60% |
| | Canary deployments | MISSING | 0% |
| | Full tool governance framework | PARTIAL | 60% |
| | Memory decay + conflict resolution | MISSING | 0% |
| | Right-to-erasure in vector stores | MISSING | 0% |
| | Full Trust Plane wrapper | MISSING | 10% |
| | Anomaly detection | MISSING | 0% |
| | LLM-as-judge calibration | MISSING | 0% |
| | A/B testing | MISSING | 0% |
| | Regulatory compliance dashboard | MISSING | 0% |
| | Durable execution (Temporal) | MISSING | 0% |
| | Saga pattern | MISSING | 0% |
| | Event-driven automation | PARTIAL | 20% |
| | Agent lifecycle management | MISSING | 0% |
| | Sovereignty mesh | N/A (Phase 0) | 0% |
| | A2A protocol | N/A | 0% |

### Overall Maturity: Phase 1 Complete, Phase 2 at ~40%

---

## DECISION REGISTER: Mapping the 10 Hard Trade-Offs

| # | Architecture Decision | NPA Workbench Position | Gap |
|---|---|---|---|
| D1 | Route restricted data to Tier S only | **NOT FOLLOWED** --- All data goes to Dify Cloud (Tier 1 equivalent). No Tier S exists. | HIGH --- PII data reaches cloud LLMs without masking. |
| D2 | Supervisor orchestration over Handoff/Swarm | **FOLLOWED** --- MASTER_COO is the supervisor. All routing logged via `log_routing_decision`. | NONE |
| D3 | Typed contracts over full pass-through | **FOLLOWED** --- `@@NPA_META@@` envelope is the typed contract. Agents exchange structured payloads, not full context. | LOW --- Envelope content not schema-validated. |
| D4 | Determinism-first (Level 4) over full autonomy | **FOLLOWED** --- Workflows are Level 5 deterministic. Chatflows are Level 3-4. One-action-per-turn enforces human checkpoint. | NONE |
| D5 | Jurisdiction-scoped vector stores | **NOT APPLICABLE** --- No vector stores exist yet. When built, must be jurisdiction-scoped from day one. | MEDIUM --- Must implement correctly when adding pgvector. |
| D6 | Memory expiry over indefinite retention | **NOT APPLICABLE** --- No long-term memory exists. When built, must include `retention_expiry` field. | MEDIUM --- Must implement correctly when adding memory. |
| D7 | Server-side context assembly | **FOLLOWED** --- Angular sends identifiers. Server assembles context. Client never sees raw context. | NONE |
| D8 | Regression testing gates deployment | **NOT FOLLOWED** --- No golden datasets. No regression tests. Prompt changes deployed without testing. | HIGH --- Production quality not validated on changes. |
| D9 | PII masking before cloud calls | **NOT FOLLOWED** --- No PII masking. Raw data sent to Dify Cloud. | CRITICAL --- Compliance risk. Must be addressed immediately. |
| D10 | Trust as wrapper over trust as layer | **NOT FOLLOWED** --- Trust controls exist at entry (auth) and exit (RBAC) but NOT on every internal operation. Tool calls within Dify are not individually trust-checked. | HIGH --- Trust is a gateway, not an envelope. |

---

## ANTI-PATTERN CATALOGUE: Current Risk Assessment

| Anti-Pattern | Architecture Risk | NPA Workbench Exposure | Severity |
|---|---|---|---|
| **The Amnesia Handoff** | Human gets no context | **LOW RISK** --- `ChatSessionService` persists full conversation. Signoff matrix carries context. But if user switches browser/device, session may not transfer. | LOW |
| **The Rubber Stamp** | Humans approve without reading | **MEDIUM RISK** --- Signoff matrix creates many approval gates. SLA pressure may cause rubber-stamping. No approval latency monitoring (sub-10s approvals not flagged). | MEDIUM |
| **The Global Brain** | Single global vector store | **LOW RISK (today)** --- No vector store exists. When pgvector is added, must be jurisdiction-scoped. | LOW (future HIGH) |
| **The Chatty Orchestrator** | Full context passed between agents | **LOW RISK** --- One-action-per-turn means agents don't chain. MASTER_COO passes minimal routing info. But Dify internally may pass more context than needed between nodes. | LOW |
| **The Confident Hallucinator** | Confident wrong answer | **MEDIUM RISK** --- Agents log confidence scores and citations. But no automated check for hallucinated regulatory references. No citation verification against KB. | MEDIUM |
| **The Immortal Agent** | Agent never evaluated or retired | **HIGH RISK** --- 18 agents deployed. No evaluation pipeline. No quality scoring. No retirement process. Agents could degrade silently as LLM providers update models. | HIGH |
| **The Shadow API Key** | Hardcoded API keys | **MEDIUM RISK** --- API keys stored in environment variables (`.env`). Not in source code. But no automated rotation. Keys in Railway environment. JWT secret is hardcoded fallback (`coo-workbench-dev-secret-2026`). | MEDIUM |
| **The Optimistic Executor** | Act then ask for approval | **LOW RISK** --- One-action-per-turn policy prevents this. Governance agent WAITS for approval before advancing. Agent does not proceed optimistically. | LOW |
| **The Monolingual Assumption** | English only | **MEDIUM RISK** --- All system prompts, KB documents, and UI are English-only. APAC customers and regulatory documents in Chinese, Thai, Malay not supported. No language-aware embeddings. | MEDIUM |

---

## TECHNOLOGY STACK MAPPING (Constrained)

### Architecture Recommendation -> NPA Workbench (Dify + Python + Angular)

| Plane | Component | Architecture Recommends | NPA Workbench Uses | Gap |
|---|---|---|---|---|
| P1 | Provider Abstraction | LiteLLM | Dify (internal) | Dify manages. Add LiteLLM for Tier S in Phase 2. |
| P1 | Sovereign Inference | vLLM on NVIDIA GPUs | None | MISSING. Add when Tier S needed. |
| P2 | Embedding | text-embedding-3-large / multilingual-e5 | Dify KB (internal embedding) | Dify manages. Add self-hosted for Tier S data. |
| P2 | Vector Search | pgvector | None | MISSING. Add for long-term memory. |
| P2 | Reranking | cross-encoder/ms-marco-MiniLM | None | MISSING. Add for KB retrieval precision. |
| P3 | Agent Framework | LangGraph | **Dify** (constraint) | ADAPTED. Dify replaces LangGraph. |
| P4 | Tool Protocol | MCP (FastAPI) | **FastMCP** (Python) | IMPLEMENTED |
| P4 | Working Memory | Redis | MySQL (agent_sessions) | PARTIAL. Add Redis for hot state. |
| P5 | PII Detection | Presidio + custom APAC | None | MISSING. Priority 1 build. |
| P5 | Guardrails | LlamaFirewall | None | MISSING. Priority 2 build. |
| P6 | LLM Tracing | Langfuse | None | MISSING. Priority 3 build. |
| P6 | Logging | structlog (Python) | console.log / print | MISSING. Replace with structlog. |
| P6 | Eval Framework | DeepEval | None | MISSING. Add for golden dataset testing. |
| P7 | Job Queue | Celery + Redis (constraint) | None (sync only) | MISSING. Priority 1 for async agents. |
| P7 | Circuit Breaker | pybreaker (constraint) | None | MISSING. Add on all external calls. |
| P7 | Durable Execution | Temporal (Phase 3) | None | MISSING. Phase 3 target. |

---

## IMPLEMENTATION PRIORITY MATRIX

### Ranked by: Regulatory Risk x Implementation Effort x Business Impact

| Priority | Item | Plane | Effort | Risk if Missing |
|---|---|---|---|---|
| **P0** | PII Masking (Presidio + APAC) | Trust | 2 weeks | CRITICAL --- compliance violation |
| **P1** | Prompt Injection Scanner (LlamaFirewall) | Trust | 1 week | HIGH --- security vulnerability |
| **P1** | Structured Logging (structlog) | Observability | 3 days | HIGH --- debugging blind spot |
| **P1** | Circuit Breaker (pybreaker) | Operations | 3 days | HIGH --- cascading failures |
| **P2** | Background Job Queue (Celery + Redis) | Operations | 1 week | HIGH --- 8-min Autofill blocks HTTP |
| **P2** | Correlation ID Propagation | Observability | 3 days | MEDIUM --- tracing gaps |
| **P2** | Output PII Scanner | Trust | 1 week | HIGH --- data leakage |
| **P2** | Schema Validation (Pydantic per agent) | Reasoning | 1 week | MEDIUM --- malformed data reaches UI |
| **P3** | Langfuse Integration | Observability | 1 week | MEDIUM --- no LLM visibility |
| **P3** | Golden Datasets (50 per agent) | Observability | 2 weeks | HIGH --- no quality assurance |
| **P3** | Cost Tracking Middleware | Intelligence | 3 days | MEDIUM --- no FinOps visibility |
| **P3** | DLQ with Replay | Operations | 1 week | MEDIUM --- failed jobs lost |
| **P4** | Long-Term Memory (pgvector) | Action | 2 weeks | LOW --- no cross-session learning |
| **P4** | Cross-Encoder Reranking | Context | 1 week | MEDIUM --- KB retrieval imprecise |
| **P4** | Regression Testing Pipeline (DeepEval) | Observability | 2 weeks | HIGH --- unvalidated changes |
| **P5** | Confidence-Based HITL Gating | Trust | 3 days | MEDIUM --- low-confidence responses reach users |
| **P5** | Compliance Metrics Dashboard | Observability | 1 week | MEDIUM --- no regulatory reporting |
| **P5** | Rubber-Stamp Detection | Trust | 3 days | MEDIUM --- approval quality risk |
| **P6** | Event-Driven Triggers (pub/sub) | Operations | 2 weeks | LOW --- manual triggers work |
| **P6** | A/B Testing Infrastructure | Observability | 2 weeks | LOW --- optimization, not critical |
| **P7** | Sovereignty Mesh (Phase 3) | Cross-Cutting | 4+ weeks | N/A for Phase 0 |
| **P7** | Durable Execution (Temporal) | Operations | 4+ weeks | LOW --- Phase 3 target |

---

## FINAL ARCHITECTURE: NPA Workbench Target State

```
CONSTRAINED STACK: Dify + Python + Angular
=============================================

  Angular 20 (Frontend --- Presentation Only)
  ├── 69 standalone components
  ├── Agent Workspace (SSE streaming)
  ├── Dashboard, Detail, Approval, Monitoring views
  ├── ChatSessionService (signals-based state)
  └── Auth Guard + Interceptor

       │ REST/SSE
       ▼

  FastAPI (Python Backend --- Replaces Express)          ← NEW
  ├── Dify Proxy (forward to Dify Cloud)
  ├── Auth (JWT via python-jose)
  ├── RBAC Middleware
  ├── Rate Limiting (slowapi)
  ├── Audit Middleware (auto-log mutations)
  ├── PII Masking Pipeline (Presidio)                   ← P0 BUILD
  ├── Prompt Injection Scanner (LlamaFirewall)           ← P1 BUILD
  ├── Output PII Scanner                                 ← P2 BUILD
  ├── Schema Validation (Pydantic per agent_action)      ← P2 BUILD
  ├── Correlation ID Propagation                         ← P2 BUILD
  ├── Cost Tracking Middleware                           ← P3 BUILD
  └── Langfuse Integration                              ← P3 BUILD

       │ REST/SSE
       ▼

  Dify Cloud (Reasoning Plane)
  ├── 16 Dify Apps (8 chatflow + 8 workflow)
  ├── 18 logical agents across 4 tiers
  ├── KB_NPA_CORE_CLOUD + KB_NPA_AGENT_KBS
  ├── Per-agent tool allowlisting
  └── @@NPA_META@@ output contract

       │ OpenAPI / MCP
       ▼

  FastMCP (Python MCP Tools Server)
  ├── 77 tools across 21 modules
  ├── Registry-based self-registration
  ├── MySQL async queries (aiomysql)
  └── SSE transport on port 3001

       │ SQL
       ▼

  MySQL 8.0 / MariaDB 10.6
  ├── 42 tables (npa_projects, signoffs, audit, etc.)
  ├── Migrations (6 applied)
  └── Per-jurisdiction deployment ready

  INFRASTRUCTURE (New Additions)
  ├── Redis ← Working memory + job queue + circuit breaker state
  ├── Celery ← Background job processing (async agents)         ← P2 BUILD
  ├── pybreaker ← Circuit breakers on Dify/MCP/DB               ← P1 BUILD
  ├── structlog ← Structured JSON logging                        ← P1 BUILD
  ├── Langfuse ← LLM tracing + cost tracking                    ← P3 BUILD
  ├── DeepEval ← Golden dataset testing + regression             ← P3 BUILD
  └── pgvector ← Long-term memory (Phase 2)                     ← P4 BUILD
```

---

*This mapping is a living document. Update as implementation progresses.*
