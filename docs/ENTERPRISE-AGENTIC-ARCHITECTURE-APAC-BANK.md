# Enterprise Agentic Architecture for a Multinational Asian Bank

**A Production-Grade, Opinionated Reference Architecture**

**Audience:** Enterprise Architects, CTO Office, Head of AI/ML, Technology Risk  
**Classification:** Internal — Restricted  
**Version:** 1.0 | February 2026  

---

## Executive Summary

This document defines a **7-plane agentic architecture** purpose-built for multinational Asian banks operating across jurisdictions like Singapore (MAS), Hong Kong (HKMA), Japan (FSA/BOJ), India (RBI), Thailand (BOT), Indonesia (OJK), and Malaysia (BNM).

It is not a synthesis of what others have built. It is an opinionated set of architectural decisions — with explicit trade-offs — designed around three non-negotiable constraints that define banking in Asia:

1. **Data sovereignty is law, not preference.** MAS Notice 655, HKMA's outsourcing module, India's DPDP Act 2023, and China's PIPL mandate that customer data stays within jurisdictional boundaries. The architecture must enforce this at the infrastructure level, not the application level.

2. **Regulatory trust is earned through explainability.** MAS FEAT principles, HKMA's AI guidance, and BOJ's fintech stance all require that AI decisions in banking are auditable, explainable, and reversible. "The model said so" is not an acceptable answer to a regulator.

3. **Multi-model optionality is a survival requirement.** No bank should have a single-vendor dependency on any LLM provider. Geopolitical risk, pricing changes, and capability shifts mean the architecture must allow model swaps without code changes — within hours, not months.

The architecture is organized into **7 planes** (not layers), because planes operate concurrently and intersect, whereas layers imply a strict bottom-up dependency. Each plane makes explicit trade-off decisions with clear reasoning.

---

## Table of Contents

1. [Why 7 Planes, Not 12 Layers](#1-why-7-planes)
2. [Plane 1: Intelligence Plane — Model Access & Routing](#plane-1)
3. [Plane 2: Context Plane — Information Assembly](#plane-2)
4. [Plane 3: Reasoning Plane — Agent Runtime & Orchestration](#plane-3)
5. [Plane 4: Action Plane — Tools, Memory & External Systems](#plane-4)
6. [Plane 5: Trust Plane — Security, Governance & Human Oversight](#plane-5)
7. [Plane 6: Observability Plane — Visibility, Evaluation & Cost](#plane-6)
8. [Plane 7: Operations Plane — Resilience, Scheduling & Lifecycle](#plane-7)
9. [Cross-Cutting: Data Sovereignty Architecture](#cross-cutting-sovereignty)
10. [Cross-Cutting: Protocol Strategy](#cross-cutting-protocols)
11. [Maturity Model: Phased Implementation](#maturity-model)
12. [Decision Register: The Hard Trade-Offs](#decision-register)
13. [Anti-Pattern Catalogue](#anti-patterns)
14. [Future-Proofing: 2026–2030 Horizon](#future-proofing)

---

## 1. Why 7 Planes, Not 12 Layers {#1-why-7-planes}

The 12-layer model (Palantir-inspired) is useful as an educational taxonomy but has three problems in enterprise practice:

**Problem 1: Layers imply strict sequencing.** In reality, security (Layer 8 in the 12-model) doesn't sit "above" orchestration — it wraps every single plane. Observability doesn't sit above security — it monitors all planes concurrently. The layer metaphor breaks down when you try to implement it.

**Problem 2: Some "layers" are infrastructure, not architecture.** Circuit breakers, cron jobs, and dead letter queues are operational concerns that exist in any distributed system. Elevating them to agentic-specific architectural layers inflates the model without adding clarity.

**Problem 3: 12 is too many to hold in working memory.** When an architect or developer needs to reason about the system, 7±2 is the cognitive limit. Seven planes, each with clear boundaries and responsibilities, are easier to reason about, communicate, and audit.

### The 7-Plane Model

```
╔══════════════════════════════════════════════════════════════════════╗
║                    ENTERPRISE AGENTIC ARCHITECTURE                  ║
║                    Multinational Asian Bank                          ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │            PLANE 7: OPERATIONS                                │    ║
║  │  Resilience · Scheduling · Lifecycle · State Management       │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │            PLANE 6: OBSERVABILITY                             │    ║
║  │  Tracing · Evaluation · Cost Accounting · Alerting            │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  ╔══════════════════════════════════════════════════════════════╗    ║
║  ║            PLANE 5: TRUST (wraps all inner planes)           ║    ║
║  ║  Security · Governance · HITL · Audit · Data Classification  ║    ║
║  ║                                                               ║    ║
║  ║  ┌────────────────────────────────────────────────────────┐  ║    ║
║  ║  │        PLANE 4: ACTION                                  │  ║    ║
║  ║  │  Tools · Memory · External APIs · Database · Events     │  ║    ║
║  ║  └────────────────────────────────────────────────────────┘  ║    ║
║  ║                                                               ║    ║
║  ║  ┌────────────────────────────────────────────────────────┐  ║    ║
║  ║  │        PLANE 3: REASONING                               │  ║    ║
║  ║  │  Agent Runtime · Orchestration · Planning · Execution   │  ║    ║
║  ║  └────────────────────────────────────────────────────────┘  ║    ║
║  ║                                                               ║    ║
║  ║  ┌────────────────────────────────────────────────────────┐  ║    ║
║  ║  │        PLANE 2: CONTEXT                                 │  ║    ║
║  ║  │  Assembly · Retrieval · Scoping · Budget · Grounding    │  ║    ║
║  ║  └────────────────────────────────────────────────────────┘  ║    ║
║  ║                                                               ║    ║
║  ╚══════════════════════════════════════════════════════════════╝    ║
║                                                                      ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │            PLANE 1: INTELLIGENCE                              │    ║
║  │  Model Gateway · Routing · Abstraction · Sovereign Compute   │    ║
║  └──────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║  ═══════════════════════════════════════════════════════════════     ║
║  CROSS-CUTTING: Data Sovereignty Mesh · Protocol Bus (MCP/A2A)      ║
║  ═══════════════════════════════════════════════════════════════     ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Key structural decision: Trust as a wrapper, not a layer

The Trust Plane (Plane 5) **envelops** Planes 2, 3, and 4. Every context assembly, every reasoning step, every tool call passes through Trust controls. This is not optional gating — it is structural. In a regulated bank, you cannot have an agent that reasons outside the trust boundary.

---

## Plane 1: Intelligence Plane — Model Access & Routing {#plane-1}

### What it does

Controls all connections to LLM providers. Abstracts away provider differences. Enforces cost limits. Routes requests to the right model based on task complexity, data sensitivity, and jurisdictional constraints.

### Architectural Decision: Tri-Tier Model Strategy

**Decision:** Maintain three concurrent model tiers, with at least two providers per tier, and a sovereign/on-premise option for Tier S.

**Rationale:** A multinational Asian bank cannot be dependent on a single US-based AI provider. MAS Technology Risk Management Guidelines (Section 5.4) require that outsourced technology arrangements have credible exit plans. HKMA's OR-2 module requires concentration risk management for critical third-party dependencies.

```
TIER S: SOVEREIGN (On-Premise / Private Cloud)
  Purpose: Tasks involving restricted data that cannot leave bank infrastructure
  Models: Llama 3.3 70B, Qwen 2.5 72B, Mistral Large (self-hosted)
  Hosting: Bank's private cloud (Singapore DC, Hong Kong DC)
  Data: Full customer PII, trade data, regulatory submissions
  Latency: 200-500ms (acceptable for batch/async)
  Cost: Infrastructure cost only — no per-token charges
  When: Regulatory filings, customer-facing PII processing, 
        cross-border restricted data, audit-sensitive reasoning

TIER 1: FRONTIER (Cloud API — Zero Data Retention)
  Purpose: Complex reasoning, multi-step orchestration, edge cases
  Models: Claude Opus/Sonnet (Anthropic), GPT-4o/o3 (OpenAI), 
          Gemini Ultra (Google)
  Contract: Mandatory ZDR (Zero Data Retention) agreements
  Data: Anonymized/masked data only — never raw PII
  Latency: 1-5s
  Cost: $0.01-0.15/call
  When: Orchestrator reasoning, complex risk analysis, 
        multi-document synthesis, novel edge cases

TIER 2: EFFICIENT (Cloud API — Cost-Optimized)
  Purpose: Classification, routing, formatting, validation, 
           simple extraction
  Models: Claude Haiku (Anthropic), GPT-4o-mini (OpenAI), 
          Gemini Flash (Google)
  Contract: ZDR required
  Data: Non-sensitive or fully masked
  Latency: 100-500ms
  Cost: $0.0001-0.005/call
  When: Intent classification, format validation, 
        topic routing, data extraction from structured sources
```

### The Model Router

The Model Router is the single entry point for all LLM calls across the bank. No agent, service, or application calls an LLM provider directly.

```
INCOMING LLM REQUEST
  │
  ├─ [1] Data Classification Check
  │     What data sensitivity level is in this prompt?
  │     RESTRICTED → Route to Tier S (sovereign) only
  │     CONFIDENTIAL → Route to Tier S or Tier 1 (with masking)
  │     INTERNAL → Route to Tier 1 or Tier 2
  │     PUBLIC → Route to any tier (cost-optimize)
  │
  ├─ [2] Jurisdictional Check
  │     Which jurisdiction's data is involved?
  │     If data residency rules apply → Route to Tier S 
  │     in that jurisdiction's DC
  │
  ├─ [3] Complexity Assessment
  │     Simple classification/extraction → Tier 2
  │     Standard reasoning → Tier 1 (Sonnet/GPT-4o)
  │     Complex multi-step reasoning → Tier 1 (Opus/o3)
  │     Restricted data processing → Tier S
  │
  ├─ [4] Cost Budget Check
  │     Has this user/session/department exceeded budget? → Reject or downgrade tier
  │
  ├─ [5] Rate Limit Check
  │     Per-model, per-user, per-department rate limits
  │
  └─ [6] Execute with Fallback Chain
        Primary model → Fallback model (same tier, different provider) 
        → Tier S fallback → Cached response → Graceful error
```

### Trade-Off: Latency vs. Sovereignty

| Scenario | Decision | Sacrifice |
|----------|----------|-----------|
| Customer PII in prompt | Always Tier S | Higher latency (200-500ms vs 100ms), weaker model capability |
| Real-time chat with customer data | Tier S with optimized inference (vLLM/TGI) | Capex investment in GPU infrastructure |
| Batch risk assessment overnight | Tier S preferred, Tier 1 acceptable with masking | Masking adds complexity, potential information loss |
| Internal analytics, no PII | Tier 1 for quality, Tier 2 for cost | Cost vs quality trade-off — let the department decide within budget |

### Provider Abstraction Interface

Every model call goes through a unified interface. Implementation can be LiteLLM, a custom gateway, or a managed service — but the contract is fixed:

```
IntelligenceRequest {
  prompt: string
  model_preference: TierS | Tier1 | Tier2 | Auto
  data_classification: Restricted | Confidential | Internal | Public
  jurisdiction: SG | HK | IN | TH | ID | MY | JP | GLOBAL
  max_tokens: number
  temperature: number
  response_schema?: JSONSchema  // For structured output enforcement
  cost_budget_remaining: number
  correlation_id: string
  caller_agent_id: string
  caller_department: string
}

IntelligenceResponse {
  content: string | StructuredOutput
  model_used: string
  tier_used: TierS | Tier1 | Tier2
  tokens_consumed: { input: number, output: number }
  cost_usd: number
  latency_ms: number
  correlation_id: string
  data_residency_compliant: boolean
}
```

### Anti-Patterns Specific to Asian Banking

- **Sending raw NRIC/FIN numbers to cloud APIs.** Singapore's PDPA and MAS Notice 655 treat these as restricted identifiers. Mask before any cloud call.
- **Assuming US-based ZDR covers APAC.** Verify ZDR agreements cover the specific APAC region. Some providers' ZDR only applies to US/EU endpoints.
- **Single-provider dependency without exit plan.** MAS TRMG Section 5.4 requires documented exit strategies for critical technology dependencies. If Claude goes down, your bank stops — that's a regulatory finding.
- **No cost visibility at the department level.** When the CFO asks "how much are we spending on AI per business unit?", the answer must be available within minutes, not months.

---

## Plane 2: Context Plane — Information Assembly {#plane-2}

### What it does

Assembles, selects, scopes, and manages every piece of information that enters the LLM's context window. This is the highest-leverage plane — the quality of context determines output quality more than model selection.

### Architectural Decision: Server-Side Assembly, Always

**Decision:** All context assembly happens server-side. The frontend sends a task request with identifiers. The server fetches, filters, scopes, and assembles the full context before sending to the LLM.

**Rationale:** In a bank, context contains customer data, internal policies, risk scores, and regulatory references. If context assembly happens client-side (browser), that data transits unnecessarily. Server-side assembly also enables caching, auditing, and consistent application of data classification rules.

```
CLIENT REQUEST                     SERVER-SIDE CONTEXT ASSEMBLY
─────────────────                  ─────────────────────────────
{                                  
  task: "assess_risk",             ┌─ Parallel Fetch ──────────────┐
  entity_id: "NPA-2026-042",  →   │ [1] Entity data from DB       │
  user_role: "risk_analyst",       │ [2] Related transactions       │
  jurisdiction: "SG"               │ [3] Regulatory KB (scoped)     │
}                                  │ [4] Prior agent results        │
                                   │ [5] Few-shot examples (matched)│
                                   │ [6] User role permissions      │
                                   └────────────────────────────────┘
                                              │
                                   ┌─ Assembly Pipeline ────────────┐
                                   │ [A] Data classification scan   │
                                   │ [B] Jurisdictional filtering   │
                                   │ [C] Token budget allocation    │
                                   │ [D] Relevance scoring & prune  │
                                   │ [E] Conflict resolution        │
                                   │ [F] Context window packing     │
                                   └────────────────────────────────┘
                                              │
                                   ASSEMBLED CONTEXT → Intelligence Plane
```

### Context Budget Management

Treat the context window as a finite resource with explicit allocation:

```
CONTEXT BUDGET ALLOCATION (for a 128K token model)
═══════════════════════════════════════════════════

Category                    Budget      Priority    Notes
──────────────────────────  ──────      ────────    ─────
System Prompt               3-5K        FIXED       Role, rules, format, guardrails
Regulatory Knowledge Base   10-20K      HIGH        Scoped to jurisdiction + product
Entity Data (current task)  10-25K      HIGH        Pre-fetched, structured
Prior Agent Results         5-15K       MEDIUM      Compacted summaries, not raw
Few-Shot Examples           3-5K        MEDIUM      2-3 matched examples
Conversation History        5-15K       LOW         Sliding window + summarization
Tool Schemas                2-8K        ADAPTIVE    Only relevant tools per task
Response Headroom           10-20K      RESERVED    Never allocate — leave for output

OVERFLOW STRATEGY:
  If total > budget:
    1. Compress conversation history (summarize older turns)
    2. Reduce few-shot examples (keep best 1-2)
    3. Prune lowest-relevance KB chunks
    4. NEVER reduce: system prompt, entity data, regulatory KB
```

### Dynamic Knowledge Base Scoping

A multinational bank has thousands of policy documents across jurisdictions. Loading all of them into context is impossible and counterproductive.

**Decision:** Implement a two-stage retrieval pipeline — coarse scoping followed by fine-grained semantic retrieval.

```
STAGE 1: COARSE SCOPING (Deterministic — no LLM needed)
  Input:  task_type + jurisdiction + product_category + entity_type
  Output: Filtered KB subset (100-500 documents → 10-50 documents)
  Method: Metadata filtering on pre-tagged document attributes
  
  Example:
    task_type=risk_assessment, jurisdiction=SG, product=FX_derivatives
    → Scope to: MAS Notice 637, FX Global Code, Basel III docs,
      internal FX risk policy, product-specific SOPs

STAGE 2: FINE-GRAINED RETRIEVAL (Semantic — vector search + reranking)
  Input:  Scoped KB subset + specific query/task description
  Output: Top 5-10 most relevant chunks
  Method: Embedding search → BM25 hybrid → cross-encoder reranking
  
  Reranking is mandatory for banking:
    Pure vector search returns "approximately relevant" results.
    Cross-encoder reranking ensures the most precisely relevant 
    chunks are selected. In regulated domains, "approximately right" 
    is not acceptable.
```

### Context Failure Modes and Banking-Specific Mitigations

| Failure Mode | Banking Impact | Mitigation |
|---|---|---|
| **Context Poisoning** — hallucinated fact from one agent enters context of the next | A fabricated regulatory reference could lead to non-compliant decisions | Schema validation on all agent outputs before they enter any context. Citation verification for regulatory references. |
| **Stale Context** — cached data doesn't reflect recent updates | Risk assessment based on yesterday's exposure data misses today's breach | TTL-based cache invalidation. Critical data categories (exposure, limits, status) always fetched fresh. |
| **Jurisdictional Leakage** — SG customer data appears in HK agent's context | Violates data residency rules, potential regulatory action | Jurisdictional tagging on all data elements. Assembly pipeline enforces jurisdiction filtering before context packing. |
| **Over-Contextualization** — too much history causes the model to over-anchor on past decisions | Agent repeats a previous incorrect assessment because it's in the history | Relevance decay scoring. Older context gets progressively lower weight. Explicit instruction: "Assess independently; prior results are reference only." |
| **Privilege Escalation via Context** — a junior analyst's context includes senior-approver-only data | Unauthorized access to restricted information | Role-based context filtering. The assembly pipeline checks the requesting user's RBAC profile and excludes data above their clearance. |

---

## Plane 3: Reasoning Plane — Agent Runtime & Orchestration {#plane-3}

### What it does

This is the brain. It receives assembled context, reasons about the task, decides what actions to take, calls tools, observes results, and iterates until the task is complete. It also coordinates multiple agents working together.

### Architectural Decision: Determinism-First, Autonomy-Where-Earned

**Decision:** Default to deterministic workflows (Salesforce Level 4-5). Grant LLM autonomy only for specific, well-bounded tasks where the agent has been evaluated and proven reliable.

**Rationale:** In banking, predictability is a feature. A regulator asking "why did the system make this decision?" needs a traceable, repeatable answer. Full LLM autonomy (Level 1) is appropriate for creative tasks, not for regulatory assessments, trade processing, or customer-impacting decisions.

```
AUTONOMY SPECTRUM FOR BANKING
══════════════════════════════

Level 5: FULLY DETERMINISTIC (code executes logic, LLM parses input only)
  Use for: Transaction processing, limit checks, SLA calculations
  Banking examples: Trade matching, margin calls, regulatory reporting
  LLM role: Parse unstructured input into structured format — nothing more

Level 4: HYBRID (deterministic for critical paths, LLM for judgment calls)
  Use for: Risk assessment, NPA analysis, compliance review
  Banking examples: Credit risk scoring with qualitative overlay,
                    document completeness check with exception handling
  LLM role: Fill in qualitative assessments within a fixed framework
  THIS IS THE DEFAULT FOR MOST BANKING AGENTS

Level 3: INSTRUCTION-GUIDED (LLM operates within strict topic boundaries)
  Use for: Customer-facing chatbots, internal Q&A, report generation
  Banking examples: Product inquiry bot, policy Q&A, draft narratives
  LLM role: Converse freely but constrained to defined topics + tools

Level 2: TOPIC-SCOPED (LLM has broader latitude within a domain)
  Use for: Research, analysis, exploration
  Banking examples: Market research synthesis, competitor analysis
  LLM role: Explore broadly within domain boundaries

Level 1: FULL AUTONOMY (avoid in production banking)
  Use for: Internal experimentation only
  Banking examples: None in production
  LLM role: Unrestricted — prototype and research environments only
```

### Agent Runtime Architecture

```
AGENT RUNTIME (Per-Agent Instance)
│
├── Input Processing
│   ├── Request validation (schema check)
│   ├── Trust Plane: Input guardrails (injection scan, PII detection)
│   └── Context Plane: Assembled context injected
│
├── Reasoning Engine
│   ├── WORKFLOW MODE (Level 4-5): Deterministic DAG execution
│   │   Step 1 → Step 2 → Decision Gate → Step 3a or 3b → Output
│   │   Each step can be: LLM call, tool call, or pure code
│   │
│   ├── REACT MODE (Level 2-3): Iterative reasoning loop
│   │   Think → Act (tool call) → Observe → Think → ... → Answer
│   │   Subject to: iteration cap, token budget, timeout
│   │
│   └── PLANNING MODE (complex multi-step): Plan-Execute-Reflect
│       Decompose task → Plan steps → Execute each → Reflect on progress
│       → Replan if needed → Synthesize final output
│
├── Execution Controls (MANDATORY — non-negotiable)
│   ├── Max Iterations: 10 (default), configurable per agent type
│   ├── Max Token Budget: 50K output tokens per session
│   ├── Timeout: 120s per agent call, 600s per orchestrated workflow
│   ├── Confidence Threshold: Below 0.7 → escalate to human
│   └── Tool Call Limit: Max 20 tool calls per reasoning cycle
│
├── Output Processing
│   ├── Schema Validation (Zod/Pydantic — reject malformed output)
│   ├── Trust Plane: Output guardrails (PII leakage, toxicity, policy)
│   ├── Citation Extraction (for audit trail)
│   └── Confidence Scoring (self-assessed + calibrated)
│
└── State Emission
    ├── Emit structured result to caller/orchestrator
    ├── Emit trace data to Observability Plane
    └── Emit significant facts to Memory (Action Plane)
```

### Multi-Agent Orchestration

**Decision:** Use the **Supervisor pattern** as default for banking. The supervisor maintains full control, audit trail, and the ability to intervene.

**Rationale:** Handoff/Swarm patterns (where agents decide who goes next) are elegant but create audit challenges. When a regulator asks "who decided to route this to the credit agent instead of the compliance agent?", the answer should be "the supervisor, based on rule X" — not "the previous agent made an autonomous decision."

```
ORCHESTRATION PATTERNS (ordered by preference for banking)

1. SUPERVISOR (Default — Recommended)
   ┌──────────────┐
   │  SUPERVISOR   │ ← Central control, full audit trail
   │  (Orchestrator)│
   └──┬───┬───┬───┘
      │   │   │
   ┌──▼┐┌─▼─┐┌▼──┐
   │ A1 ││ A2 ││ A3 │ ← Specialized agents
   └────┘└────┘└────┘
   
   When: Regulated workflows, multi-domain analysis, 
         compliance-critical processes
   Strength: Full audit trail, explicit routing logic, 
             human-readable decision log
   Weakness: Supervisor is single point of failure 
             (mitigate: supervisor failover + state checkpoint)

2. SEQUENTIAL PIPELINE (For known, fixed-step processes)
   [Ingest] → [Classify] → [Analyze] → [Score] → [Report]
   
   When: ETL-like workflows, document processing pipelines,
         regulatory reporting chains
   Strength: Simple, predictable, easy to test and debug
   Weakness: No parallelism, early failure blocks everything

3. FAN-OUT/FAN-IN (For independent parallel analysis)
   ┌→ [Risk Agent]      ─┐
   │→ [Compliance Agent] ─├→ [Synthesizer]
   └→ [Market Agent]     ─┘
   
   When: Multi-domain assessment where domains are independent
   Strength: Latency reduction (parallel), natural decomposition
   Weakness: Conflict resolution needed when agents disagree

4. HANDOFF (Use with caution in banking)
   [Agent A] →? [Agent B] →? [Agent C]
   Dynamic routing decided by agents themselves
   
   When: Triage scenarios, customer service routing
   Constraint: Every handoff must be logged with reasoning.
               Max 3 handoffs before mandatory supervisor intervention.
   Weakness: Audit complexity, potential infinite loops
```

### Inter-Agent Communication Contract

**Decision:** Use typed contracts (not full pass-through) for inter-agent communication.

**Rationale:** Full context pass-through is token-expensive and creates data leakage risk (Agent B sees everything Agent A processed, including potentially irrelevant sensitive data). Typed contracts enforce minimal data sharing.

```
AgentResult {
  agent_id: string
  task_id: string
  correlation_id: string
  
  // Structured output — schema defined per agent type
  result: {
    assessment: string       // Primary output
    score?: number           // Quantitative score if applicable
    confidence: number       // 0.0-1.0
    citations: Citation[]    // Sources used
    flags: Flag[]            // Warnings, exceptions, escalations
    metadata: Record<string, any>  // Agent-specific structured data
  }
  
  // For the orchestrator — NOT passed to next agent
  _internal: {
    tokens_consumed: number
    model_used: string
    tool_calls: ToolCallLog[]
    reasoning_trace: string  // For audit, not for context
  }
}
```

---

## Plane 4: Action Plane — Tools, Memory & External Systems {#plane-4}

### What it does

This is where agents interact with the world — databases, APIs, file systems, external services, and memory stores. Without the Action Plane, agents can only produce text.

### Tool Architecture

**Decision:** All tools are exposed via MCP (Model Context Protocol). Tools are grouped into domains with independent permission scoping.

```
TOOL DOMAINS (Grouped by permission boundary)
│
├── DATA TOOLS (Read-Only)
│   ├── Entity Lookup (customer, account, NPA, trade)
│   ├── Transaction History (filtered by jurisdiction + time range)
│   ├── Document Retrieval (from DMS/SharePoint/content management)
│   ├── Market Data (rates, indices, benchmarks — real-time feed)
│   └── Regulatory Reference (KB search — jurisdiction-scoped)
│
├── ANALYTICS TOOLS (Read + Compute)
│   ├── Risk Scoring Engine (invoke existing risk models)
│   ├── Exposure Calculator (real-time position aggregation)
│   ├── SLA Calculator (deadline computation, breach detection)
│   ├── Statistical Analysis (trend, anomaly, threshold checks)
│   └── Report Generator (template-based structured report assembly)
│
├── WRITE TOOLS (Require Trust Plane approval for Critical/High risk)
│   ├── Status Update (entity state transitions — audited)
│   ├── Assessment Persistence (save agent results to DB)
│   ├── Document Creation (generate reports, memos, filings)
│   ├── Notification Dispatch (email, Slack, SMS — templated)
│   └── Workflow Trigger (initiate downstream processes)
│
├── EXTERNAL INTEGRATION TOOLS (Require explicit allowlisting)
│   ├── Regulatory Filing API (MAS, HKMA submission endpoints)
│   ├── SWIFT/Payment Network (read-only status checks)
│   ├── Credit Bureau Query (rate-limited, audited)
│   ├── Market Data Provider (Bloomberg, Reuters — licensed)
│   └── Sanctions/AML Screening (real-time, mandatory caching rules)
│
└── MEMORY TOOLS (Agent-accessible memory operations)
    ├── Recall Prior Context (semantic search over past interactions)
    ├── Store Significant Fact (write to long-term memory)
    ├── Retrieve Procedure (fetch relevant SOP/playbook)
    └── Session State (read/write working memory)
```

### Tool Governance Framework

**Decision:** Every tool must be explicitly allowlisted per agent. No agent has access to all tools by default.

```
TOOL GOVERNANCE MATRIX

Agent Type          Allowed Tool Domains         Denied
──────────────────  ─────────────────────────    ──────
Risk Assessment     DATA, ANALYTICS              WRITE (except assessment save), EXTERNAL
Compliance Check    DATA, ANALYTICS, REGULATORY  WRITE (except flag), EXTERNAL
Document Agent      DATA, WRITE (docs only)      ANALYTICS, EXTERNAL
Notification Agent  WRITE (notifications only)   DATA (beyond what's passed), EXTERNAL
Orchestrator        None directly — delegates     All direct tool access
Customer Chatbot    DATA (scoped to customer)    WRITE, ANALYTICS, EXTERNAL
```

### Tool Design Principles for Banking

| Principle | Implementation | Rationale |
|---|---|---|
| **Idempotent by default** | Every write tool checks for existing state before writing. Duplicate calls produce the same result. | Retries are inevitable in distributed systems. Non-idempotent tools cause data corruption. |
| **Audit trail built-in** | Every tool call logs: who (agent + user), what (tool + args), when (timestamp), result (success/failure + output hash) | Regulatory requirement. MAS TRMG and HKMA OR-2 require full audit trails for automated decisions. |
| **Scoped by jurisdiction** | Data tools automatically filter by the jurisdiction of the requesting context. A Singapore agent cannot query Hong Kong customer data unless explicitly authorized. | Data sovereignty. Cross-border data access requires explicit authorization workflows. |
| **Composite tools for constrained agents** | For agents with iteration limits, provide composite tools that combine related queries. Example: `get_full_entity_profile` instead of separate calls for entity + transactions + documents + risk scores. | Reduces tool call count, improves reasoning quality, reduces latency. |
| **Timeout and fallback on every tool** | Every tool has a timeout (default: 10s). On timeout, return a structured error, not an exception. Agent can reason about the failure. | Prevents indefinite blocking. Agent can proceed with partial data rather than hanging. |

### Memory Architecture

**Decision:** Four-tier memory with explicit separation of concerns. Long-term memory uses jurisdiction-scoped vector stores — never a single global store.

```
MEMORY ARCHITECTURE
│
├── TIER 0: CONTEXT WINDOW (Active workspace — ephemeral)
│   Capacity: 128K-200K tokens (model-dependent)
│   Scope: Current reasoning step
│   Contents: System prompt, tool results, recent messages
│   Persistence: None — destroyed after response
│
├── TIER 1: WORKING MEMORY (Session-scoped — Redis)
│   Capacity: Bounded sliding window (configurable per agent)
│   Scope: Single session/conversation
│   Contents: Full message history, intermediate results, 
│             orchestration state
│   Persistence: Session duration + 24h buffer
│   Implementation: Redis (same cluster as job queue)
│   Jurisdiction: Deployed per-region (SG Redis, HK Redis, etc.)
│
├── TIER 2: LONG-TERM MEMORY (Cross-session — Vector DB)
│   Capacity: Effectively unbounded
│   Scope: Per-user, per-entity, per-department
│   Contents: Interaction summaries, learned preferences, 
│             entity facts, decision history
│   Persistence: Indefinite (subject to retention policies)
│   Implementation: pgvector (co-located with primary DB)
│   Jurisdiction: STRICTLY per-jurisdiction deployment
│   
│   CRITICAL BANKING REQUIREMENTS:
│   ├── Right to Erasure: Must support deletion of all memories 
│   │   related to a specific customer/entity
│   ├── Memory Provenance: Every memory stores its source 
│   │   (which conversation, which agent, when)
│   ├── Memory Decay: Confidence score decreases over time 
│   │   unless reinforced by new interactions
│   ├── Conflict Resolution: When memories contradict, 
│   │   most recent + highest confidence wins, but conflict is logged
│   └── No Cross-Jurisdiction Memory Sharing: SG agent memories 
│       are not accessible to HK agents without explicit 
│       cross-border data transfer authorization
│
└── TIER 3: PROCEDURAL KNOWLEDGE (Organization-wide — RAG)
    Capacity: Unbounded
    Scope: Bank-wide, jurisdiction-scoped subsets
    Contents: SOPs, policies, regulatory guidelines, 
              workflow definitions, playbooks
    Persistence: Managed by document lifecycle process
    Implementation: RAG over curated document corpus
    Update: Triggered by policy change management process
```

### Memory Write-Through Pattern

```
Agent completes a task
  │
  ├─ [1] Extract significant facts from agent result
  │     Use: Structured extraction — not free-form LLM extraction
  │     What qualifies: Entity state changes, risk assessments, 
  │     decisions made, exceptions noted
  │
  ├─ [2] Score importance (0.0-1.0)
  │     Factors: Novelty (is this new info?), impact (does it affect 
  │     future decisions?), confidence (how reliable is this fact?)
  │
  ├─ [3] Check for conflicts with existing memories
  │     If conflict: Log conflict, update memory with newer fact 
  │     if confidence >= existing, keep both if close
  │
  ├─ [4] Write to Tier 2 with full provenance
  │     { fact, source_conversation_id, source_agent_id, 
  │       timestamp, confidence, jurisdiction, 
  │       data_classification, retention_expiry }
  │
  └─ [5] Jurisdiction check
        Is this fact about a SG entity? → Write to SG vector store only
        Cross-border entity? → Write to primary jurisdiction, 
        create reference pointer in secondary (not the data itself)
```

### The Hard Memory Trade-Off

**Problem:** Long-term memory improves agent quality over time. But in banking, remembering too much creates liability — stale risk assessments in memory could influence future decisions incorrectly. Data retention policies may require deletion. GDPR/PDPA right-to-erasure requests must be honored.

**Decision:** All memories have a mandatory `retention_expiry` field. Memories related to active entities are retained for the entity lifecycle + regulatory retention period. Memories related to closed entities follow the bank's data retention schedule. Periodic memory audit jobs verify compliance.

**What this sacrifices:** Some beneficial "learning over time" is lost. An agent that previously assessed Entity X may not remember the context if the memory has expired. This is acceptable — the trade-off favors regulatory compliance over marginal quality improvement.

---

## Plane 5: Trust Plane — Security, Governance & Human Oversight {#plane-5}

### What it does

This is the most critical plane for a bank. It wraps Planes 2, 3, and 4 — every context assembly, every reasoning step, every tool call, every output passes through Trust controls. It is not a checkpoint gate — it is a continuous security envelope.

### Why Trust is a Wrapper, Not a Layer

In most agentic architectures, security is a layer you pass through once (input guardrails → processing → output guardrails). In banking, this is insufficient because:

- An agent might receive clean input but generate a tool call that would access unauthorized data
- An agent might produce a safe intermediate result that, when combined with other context, reveals restricted information
- An agent's reasoning trace itself might contain PII that shouldn't be logged
- Cross-agent communication might leak information across jurisdictional boundaries

**Decision:** The Trust Plane operates as middleware on every operation within the inner planes, not just at entry and exit points.

### Trust Architecture

```
TRUST PLANE (Continuous Security Envelope)
│
├── INPUT TRUST
│   ├── Prompt Injection Detection
│   │   Method: Heuristic scanner + classifier (LlamaFirewall/NeMo)
│   │   Action: Block and log, never silently modify
│   │   Rate: Every inbound message, no exceptions
│   │
│   ├── PII Detection & Masking
│   │   Method: Microsoft Presidio + custom APAC identifiers
│   │   Custom: NRIC/FIN (SG), HKID (HK), Aadhaar (IN), 
│   │           MyKad (MY), Thai ID
│   │   Action: Mask before any cloud LLM call. 
│   │           Unmask only in Tier S processing or final display.
│   │   Pattern: Reversible masking (placeholder → original mapping 
│   │            stored in session, encrypted at rest)
│   │
│   ├── Topic Boundary Enforcement
│   │   Method: Classification model + allowlist per agent type
│   │   Action: If query is outside agent's topic scope → 
│   │           reject with helpful redirect, don't attempt to answer
│   │
│   └── Data Classification Tagging
│       Every data element entering the system gets tagged:
│       { classification: RESTRICTED|CONFIDENTIAL|INTERNAL|PUBLIC,
│         jurisdiction: SG|HK|IN|..., 
│         pii_types: [NRIC, NAME, ACCOUNT_NO, ...] }
│
├── PROCESSING TRUST
│   ├── Tool Call Authorization
│   │   Before every tool call: check agent's tool allowlist
│   │   Check: Does this agent have permission for this tool?
│   │   Check: Does this tool call's data scope match the 
│   │          agent's jurisdiction authorization?
│   │   Action: Block unauthorized tool calls, log attempt
│   │
│   ├── Cross-Agent Data Flow Control
│   │   When Agent A passes data to Agent B:
│   │   Check: Is Agent B authorized for this data classification?
│   │   Check: Is Agent B in the same jurisdiction scope?
│   │   Action: Strip unauthorized data fields before handoff
│   │
│   ├── Reasoning Trace Sanitization
│   │   Before logging reasoning traces:
│   │   Scan: Does the trace contain PII or restricted data?
│   │   Action: Redact from logs, retain in encrypted audit store only
│   │
│   └── Token Budget Enforcement
│       Per-request, per-session, per-department budgets
│       Hard kill switch: If budget exceeded → graceful termination
│
├── OUTPUT TRUST
│   ├── PII Leakage Detection
│   │   Scan every output for unmasked PII before delivery
│   │   Extra: Check for re-identification risk 
│   │          (combinations of quasi-identifiers)
│   │
│   ├── Toxicity & Policy Compliance
│   │   Scan: Violence, profanity, discriminatory language, 
│   │         financial advice disclaimers
│   │   Banking-specific: Check for unauthorized investment advice, 
│   │         unqualified regulatory guidance, misleading claims
│   │
│   ├── Schema Validation
│   │   Every structured output validated against expected schema
│   │   Reject malformed outputs — never persist invalid data
│   │
│   └── Confidence Gating
│       If agent confidence < threshold → flag for human review
│       If agent explicitly states uncertainty → mandatory HITL
│
├── HUMAN-IN-THE-LOOP (HITL)
│   ├── Risk-Based Gating (NOT blanket approval)
│   │
│   │   CRITICAL RISK (Synchronous approval required):
│   │     - Regulatory filing submissions
│   │     - Customer-facing communications with financial impact
│   │     - Bulk data operations (delete, update > 100 records)
│   │     - Cross-border data transfer authorizations
│   │     - Override of system-generated risk ratings
│   │
│   │   HIGH RISK (Async review queue, 4h SLA):
│   │     - External API calls with side effects
│   │     - Notifications to external parties
│   │     - Assessment results that trigger downstream workflows
│   │     - Any agent action the agent itself flagged as uncertain
│   │
│   │   MEDIUM RISK (Auto-approve with audit log):
│   │     - Configuration changes, report generation
│   │     - Internal notifications, status updates
│   │
│   │   LOW RISK (Fully autonomous):
│   │     - Read-only operations, internal analytics
│   │     - Draft generation (not final submission)
│   │
│   ├── Approval Workflow
│   │   Agent action classified as Critical/High
│   │     → State checkpointed (full context + partial results)
│   │     → Approval request created with:
│   │         - What action is requested
│   │         - Why the agent wants to take this action (reasoning)
│   │         - What data will be affected
│   │         - Risk classification and rationale
│   │         - Recommended approver (based on RBAC)
│   │     → Notification to approver (Slack/Email/Dashboard)
│   │     → Agent WAITS — does NOT proceed optimistically
│   │     → On approval: Resume from checkpoint
│   │     → On rejection: Log rejection reason, notify requester
│   │     → On timeout: Escalate to next-level approver
│   │
│   └── Escalation Patterns
│       Confidence < 0.5 → Mandatory human takeover
│       3 consecutive tool failures → Escalate to support
│       Conflicting agent results → Human arbitration
│       Customer sentiment negative → Human agent handoff
│
└── AUDIT & GOVERNANCE
    ├── Immutable Audit Trail
    │   Every action: { who, what, when, why, result, 
    │                   data_classification, jurisdiction }
    │   Storage: Append-only log (tamper-evident)
    │   Retention: 7 years minimum (MAS regulatory requirement)
    │   Access: Read-only for auditors, no delete capability
    │
    ├── Explainability Record
    │   For every agent decision that affects a customer or 
    │   regulatory outcome:
    │   Record: { decision, reasoning_summary, data_sources_used,
    │             model_used, confidence, alternative_considered,
    │             human_override_if_any }
    │   Purpose: MAS FEAT principle compliance — 
    │            decisions must be explainable to regulators
    │
    ├── RBAC (Role-Based Access Control)
    │   User roles → Agent access → Tool permissions → Data scope
    │   Principle: Least privilege at every level
    │   No shared service accounts across agents
    │   Agent-specific service identities with minimal permissions
    │
    └── Periodic Trust Reviews
        Monthly: Automated scan of all agent permissions 
                 vs actual usage — flag unused permissions for removal
        Quarterly: Human review of HITL override patterns — 
                   are humans rubber-stamping? 
                   Are agents escalating too much?
        Annually: Full trust architecture audit aligned with 
                  MAS TRMG / HKMA OR-2 assessment cycle
```

---

## Plane 6: Observability Plane — Visibility, Evaluation & Cost {#plane-6}

### What it does

Makes the entire system visible, debuggable, measurable, and accountable. Every request from user click to LLM token to tool call to database write is traced, evaluated, and costed.

### Trace Architecture

```
TRACE HIERARCHY
═══════════════

SESSION (multi-turn conversation or workflow lifecycle)
  │
  └─ TRACE (single end-to-end request → response)
       │
       ├─ SPAN: Trust.InputGuardrails
       │    Duration, pass/fail, any detections
       │
       ├─ SPAN: Context.Assembly
       │    KB docs retrieved, token budget used, scoping decisions
       │
       ├─ SPAN: Intelligence.LLMCall
       │    Model, tier, tokens in/out, cost, latency, 
       │    prompt hash (not prompt content — PII risk)
       │
       ├─ SPAN: Reasoning.AgentStep [1..N]
       │    │
       │    ├─ SPAN: Action.ToolCall
       │    │    Tool name, args (sanitized), response (sanitized), 
       │    │    latency, success/fail
       │    │
       │    └─ SPAN: Trust.ToolAuthorization
       │         Authorized/denied, rule applied
       │
       ├─ SPAN: Trust.OutputGuardrails
       │    Duration, pass/fail, any redactions
       │
       └─ SPAN: Memory.WriteThrough
            Facts extracted, importance scores, storage location
```

### Five Observability Pillars

| Pillar | What It Tracks | Banking Value | Tools |
|---|---|---|---|
| **Distributed Tracing** | Correlation IDs across all services and planes | End-to-end debugging; "show me everything that happened for this customer request" | OpenTelemetry + Langfuse |
| **Continuous Evaluation** | LLM-as-judge scoring on sampled production traces (async, non-blocking) | Quality monitoring; detect degradation before customers complain | DeepEval / custom eval pipeline |
| **Cost Accounting** | Tokens × model pricing → cost per trace/session/user/department/business unit | FinOps; "how much AI spend is attributable to the FX desk?" | Langfuse cost tracking + custom dashboard |
| **Regulatory Compliance Metrics** | HITL override rates, escalation patterns, decision explainability coverage | Demonstrate to MAS/HKMA that AI governance is operational | Custom metrics + periodic reporting |
| **Anomaly Detection** | Unusual patterns: spike in tool failures, sudden cost increase, confidence score distribution shift | Early warning for production incidents, potential security issues | Prometheus alerts + custom anomaly rules |

### Evaluation Pipeline

**Decision:** Three-layer evaluation with deterministic graders first, LLM-as-judge second, human review third. Never deploy a prompt change without regression testing.

```
EVALUATION ARCHITECTURE
│
├── PRE-DEPLOYMENT (Gate — blocks deployment on regression)
│   │
│   ├── Golden Dataset Tests
│   │   50-200 curated test cases per agent type
│   │   Sources: Real production cases (sanitized), 
│   │            known edge cases, past failures
│   │   Run on: Every prompt change, every model upgrade
│   │
│   ├── Regression Tests (promptfoo/custom)
│   │   Schema validation: Output matches expected structure
│   │   Deterministic checks: Required fields present, 
│   │                        scores within valid ranges
│   │   LLM-as-judge: Quality rubric scoring (calibrated against 
│   │                 human judgments)
│   │
│   └── Gate Criteria
│       Schema pass rate: 100% (hard gate — no exceptions)
│       Deterministic check pass rate: 95%+ (hard gate)
│       LLM-as-judge mean score: >= prior version (soft gate — 
│                                 human review if marginal decline)
│
├── POST-DEPLOYMENT (Continuous — non-blocking)
│   │
│   ├── Production Sampling
│   │   Sample 5-10% of production traces
│   │   Run async evaluation scoring
│   │   No latency impact on user-facing paths
│   │
│   ├── Quality Dashboard
│   │   Per-agent quality scores over time
│   │   Per-model quality comparison
│   │   Per-prompt-version A/B metrics
│   │
│   └── Alert Thresholds
│       Quality score drop > 10% from baseline → Engineering alert
│       Hallucination rate > 5% → Immediate investigation
│       Tool call failure rate > 3% → Operational alert
│       HITL escalation rate > 30% → Agent effectiveness review
│
└── HUMAN CALIBRATION (Periodic)
    │
    ├── Monthly: Review 50 randomly sampled traces
    │   Are LLM-as-judge scores aligned with human judgment?
    │   If drift detected: Recalibrate judge prompt
    │
    ├── Quarterly: Expand golden dataset
    │   Add interesting production cases (failures, edge cases, 
    │   near-misses) to golden dataset
    │
    └── Annually: Full evaluation framework review
        Are we measuring the right things?
        Have business requirements shifted?
        Are there new failure modes we're not catching?
```

---

## Plane 7: Operations Plane — Resilience, Scheduling & Lifecycle {#plane-7}

### What it does

Ensures the system survives failures, recovers gracefully, runs scheduled tasks, and manages agent lifecycle from deployment to retirement.

### Resilience Architecture

```
RESILIENCE PATTERNS
│
├── CIRCUIT BREAKER (Per external dependency)
│   States: CLOSED → OPEN → HALF_OPEN → CLOSED
│   Trigger: Error rate > 50% in 60s window
│   OPEN behavior: Return cached/fallback response immediately
│   HALF_OPEN: Allow 1 probe request every 30s
│   Recovery: 2 consecutive successes → CLOSED
│   
│   Applied to: LLM API calls, MCP tool calls, 
│               external API integrations, database connections
│
├── RETRY WITH BACKOFF
│   Strategy: Exponential backoff with jitter
│   Schedule: 250ms → 500ms → 1s → 2s (±random jitter)
│   Max retries: 3 (for LLM calls), 5 (for tool calls)
│   On exhaustion: Move to DLQ with full context
│   
│   Idempotency requirement: All retried operations 
│   MUST be idempotent (enforced at tool design level)
│
├── DEAD LETTER QUEUE (DLQ)
│   Failed jobs land here with:
│   { input, agent_id, error, timestamp, retry_count, 
│     correlation_id, context_snapshot }
│   Dashboard: DLQ depth as health indicator
│   Alert: DLQ depth > 10 → immediate page
│   Capability: Manual review + one-click replay
│
├── STATE CHECKPOINTING
│   Level 1 (Hot): Redis — every tool call result, 
│                  every agent step completion
│                  Survives: Process restart
│                  Latency: Sub-ms
│   
│   Level 2 (Durable): PostgreSQL — significant state transitions,
│                      HITL pause points, orchestration milestones
│                      Survives: Infrastructure failure
│                      Latency: 5-20ms
│   
│   Resume capability: On failure, load latest checkpoint 
│   and resume from that point. Do not re-execute completed steps.
│
├── SAGA PATTERN (Multi-system workflows)
│   When an agent workflow spans multiple systems:
│   Each step has a compensating action defined upfront
│   On failure at step N: Execute compensating actions 
│   for steps N-1, N-2, ..., 1 in reverse
│   System returns to consistent state
│   
│   Banking example:
│     Step 1: Create assessment record → Compensate: delete record
│     Step 2: Update entity status → Compensate: revert status
│     Step 3: Send notification → FAILED
│     → Revert status → Delete record → System consistent
│
└── GRACEFUL DEGRADATION
    When Tier 1 LLM is unavailable:
      → Fallback to alternative Tier 1 provider
      → If all Tier 1 down: Fallback to Tier S (sovereign)
      → If Tier S overloaded: Queue request, notify user of delay
      → NEVER silently fail. Always inform the user of degraded state.
    
    When a tool is unavailable:
      → Agent proceeds with available data
      → Explicitly notes in output: "X data source was unavailable"
      → Flags reduced confidence
```

### Scheduling & Automation

```
SCHEDULED AUTOMATION
│
├── Job Queue (BullMQ + Redis or equivalent)
│   Architecture:
│     Client → POST /api/agents/run → { jobId } (immediate)
│                                         ↓
│                               Job Queue (prioritized)
│                                         ↓
│                               Worker pool picks up job
│                                         ↓
│                               Execute agent workflow
│                                         ↓
│                               Persist result + notify
│   
│   Benefits: No HTTP timeout issues, automatic retries, 
│             DLQ, prioritization, concurrency control,
│             rate limiting per model/provider
│
├── Scheduled Jobs
│   Daily 02:00 UTC+8: Batch re-assessment of active entities
│   Weekly Monday: Compliance snapshot generation
│   Monthly 1st: Regulatory reporting data preparation
│   Every 15 min: SLA breach detection scan
│   Every 5 min: Agent health check (all deployed agents)
│
├── Event-Driven Triggers
│   Entity status change → Re-assess impacted workflows
│   Risk score threshold breach → Escalation notification
│   Document upload → Document lifecycle validation
│   HITL approval/rejection → Resume paused agent
│   Model provider status change → Activate fallback routing
│
└── Agent Lifecycle Management
    STAGES:
      Development → Testing → Staging → Canary → Production → 
      Monitoring → Optimization → Deprecation → Retirement
    
    Canary deployment: New agent version serves 5% of traffic
    Promotion criteria: Quality scores >= current production 
                        for 48 hours
    Rollback: Instant — switch routing back to previous version
    Retirement: 30-day deprecation notice, traffic redirected, 
                then removed from registry
```

---

## Cross-Cutting: Data Sovereignty Architecture {#cross-cutting-sovereignty}

### The Core Problem

A multinational Asian bank operates across jurisdictions with conflicting data localization requirements. Singapore's data can't go to India's servers. Hong Kong customer data processed in Singapore may violate HKMA's expectations. The AI architecture must enforce these boundaries at the infrastructure level.

### Decision: Jurisdiction-Scoped Deployment Topology

```
SOVEREIGNTY MESH ARCHITECTURE
═════════════════════════════

                ┌─────────────────────────────────┐
                │     GLOBAL CONTROL PLANE          │
                │  (Config, routing rules, agent     │
                │   registry, model catalog)          │
                │  Location: Singapore (primary)      │
                │  Contains: NO customer data         │
                └──────────┬──────────────────────────┘
                           │ Config sync only
          ┌────────────────┼────────────────────┐
          │                │                    │
    ┌─────▼──────┐   ┌────▼───────┐   ┌───────▼────────┐
    │ SG DATA     │   │ HK DATA    │   │ IN DATA         │
    │ PLANE       │   │ PLANE      │   │ PLANE           │
    │             │   │            │   │                  │
    │ ┌─────────┐ │   │ ┌────────┐ │   │ ┌──────────┐   │
    │ │ SG DB   │ │   │ │ HK DB  │ │   │ │ IN DB    │   │
    │ │ SG Redis│ │   │ │ HK Redis│ │   │ │ IN Redis │   │
    │ │ SG Vector│ │   │ │ HK Vec │ │   │ │ IN Vector│   │
    │ │ SG Tier S│ │   │ │ HK TierS│ │   │ │ IN Tier S│   │
    │ │ SG Agents│ │   │ │ HK Agts│ │   │ │ IN Agents│   │
    │ └─────────┘ │   │ └────────┘ │   │ └──────────┘   │
    └─────────────┘   └────────────┘   └────────────────┘
    
    DATA RULE: Customer data NEVER leaves its jurisdiction's 
               data plane. Period.
    
    COMPUTE RULE: Agent compute for jurisdiction X runs in 
                  jurisdiction X's data plane. Agents can call 
                  cloud LLMs (Tier 1/2) ONLY with masked data.
    
    CROSS-BORDER: When a cross-border analysis is required:
                  Each jurisdiction runs its portion locally.
                  Only AGGREGATED, ANONYMIZED results are 
                  shared with the requesting jurisdiction.
                  Explicit cross-border authorization required.
```

### Cross-Border Data Flow Protocol

```
CROSS-BORDER AGENT WORKFLOW (Example: Group-level risk report)

1. Global Orchestrator (in SG Control Plane) decomposes task:
   "Assess group-level FX exposure across SG, HK, IN"

2. Orchestrator sends TASK DEFINITION (no customer data) to each 
   jurisdiction's local orchestrator:
   { task: "calculate_fx_exposure_summary", 
     output_format: "aggregated_anonymous",
     deadline: "2026-02-28T18:00:00+08:00" }

3. Each local orchestrator runs local agents with local data:
   SG: Processes SG customer FX positions → produces aggregate summary
   HK: Processes HK customer FX positions → produces aggregate summary
   IN: Processes IN customer FX positions → produces aggregate summary

4. Aggregated summaries (NO customer identifiers) sent back to 
   Global Orchestrator

5. Global Orchestrator synthesizes group-level report from 
   jurisdiction summaries

WHAT CROSSES BORDERS: Aggregate numbers, summary statistics, 
                      risk ratings — never individual customer data
WHAT STAYS LOCAL: Customer names, account numbers, transaction details, 
                  PII of any kind
```

---

## Cross-Cutting: Protocol Strategy {#cross-cutting-protocols}

### Decision: MCP as primary, A2A for cross-boundary agent communication

```
PROTOCOL STACK
│
├── MCP (Model Context Protocol) — VERTICAL integration
│   Agent ↔ Tools, Data, APIs
│   Use: All tool calls, database access, external API integration
│   Scope: Within a single jurisdiction's data plane
│   Implementation: FastAPI MCP servers per tool domain
│   Version strategy: Pin MCP spec version per release cycle,
│                     upgrade quarterly
│
├── A2A (Agent-to-Agent) — HORIZONTAL integration
│   Agent ↔ Agent (especially cross-jurisdiction)
│   Use: Cross-jurisdiction orchestration, 
│         inter-department agent delegation
│   Scope: Cross-boundary communication
│   Implementation: gRPC-based with mTLS, 
│                   JSON-LD agent cards for capability discovery
│   Key design: Agent cards advertise capabilities, not data.
│               Requesting agent describes WHAT it needs done,
│               not HOW to do it.
│
├── OpenTelemetry — OBSERVABILITY
│   Distributed tracing across all planes and jurisdictions
│   Every span carries: correlation_id, jurisdiction, 
│                       agent_id, data_classification
│
└── FUTURE: x402 / ACP
    Machine-to-machine payments and agentic commerce
    Not needed today but architecture should not preclude
    Monitor: Stripe x402 and ACP evolution for 2027+ adoption
```

---

## Maturity Model: Phased Implementation {#maturity-model}

This is the section the generic 12-layer frameworks miss. Not every plane needs to be built at full fidelity from day one. Here is a realistic, phased implementation plan.

```
PHASE 1: FOUNDATION (Months 1-3)
═════════════════════════════════
Goal: Production-capable single-agent system with basic trust controls

Build:
  Plane 1: Model Router with Tier 1 + Tier 2 support
           Provider abstraction (LiteLLM or equivalent)
           Basic cost tracking (per-request logging)
  
  Plane 2: Server-side context assembly for primary use case
           Basic RAG pipeline (embed → retrieve → inject)
           Token budget tracking (monitoring, not enforcement)
  
  Plane 3: Single agent runtime (workflow mode, Level 4 determinism)
           No multi-agent orchestration yet
           Fixed iteration caps and timeouts
  
  Plane 4: Core MCP tools (10-20, covering primary use case)
           Working memory in Redis (session-scoped)
           No long-term memory yet
  
  Plane 5: Input/output guardrails (PII detection + basic injection scan)
           RBAC on API endpoints
           Basic audit logging (structured JSON)
           No HITL workflow yet (manual review outside system)
  
  Plane 6: Structured logging (Pino/equivalent)
           Correlation IDs on all requests
           Basic Langfuse integration for LLM tracing
           No automated evaluation yet
  
  Plane 7: Basic retry + timeout on LLM calls
           No circuit breaker, no DLQ, no scheduling yet

Outcome: One agent, one use case, production-safe, auditable

────────────────────────────────────────────────────────────

PHASE 2: ORCHESTRATION (Months 4-6)
════════════════════════════════════
Goal: Multi-agent orchestration with proper trust and observability

Build:
  Plane 1: Add Tier S (sovereign) for restricted data
           Fallback chains across providers
           Department-level cost budgets
  
  Plane 2: Dynamic KB scoping (metadata filtering + semantic retrieval)
           Token budget enforcement (hard limits)
           Context caching with TTL
  
  Plane 3: Supervisor-based multi-agent orchestration
           Typed inter-agent contracts
           Fan-out/fan-in for parallel analysis
  
  Plane 4: Expand to 40-60 MCP tools
           Tool governance (allowlisting per agent)
           Tier 2 long-term memory (pgvector, jurisdiction-scoped)
  
  Plane 5: HITL approval workflow (risk-based gating)
           PII masking pipeline (Presidio + APAC identifiers)
           Tool call authorization checks
           Explainability records for agent decisions
  
  Plane 6: Golden dataset creation (50+ test cases per agent)
           Regression testing in CI/CD (promptfoo)
           Production sampling + async evaluation
           Cost dashboard per department
  
  Plane 7: Circuit breakers on all external dependencies
           DLQ with replay capability
           BullMQ job queue for async agent runs
           Basic scheduled jobs (daily batch runs)

Outcome: Multi-agent system, production-hardened, 
         regulatory-presentable

────────────────────────────────────────────────────────────

PHASE 3: SCALE (Months 7-12)
═════════════════════════════
Goal: Multi-jurisdiction, multi-use-case, enterprise-grade

Build:
  Plane 1: Multi-jurisdiction model routing
           Automated model evaluation + selection
           FinOps optimization (automatic tier selection by cost)
  
  Plane 2: Cross-encoder reranking for KB retrieval
           DSPy-style compiled prompt optimization
           Context quality scoring feedback loop
  
  Plane 3: Agent registry (catalog of all agents, capabilities)
           Canary deployments for agent updates
           Planning mode for complex multi-step workflows
  
  Plane 4: Full tool governance framework
           Memory decay + conflict resolution
           Right-to-erasure compliance in vector stores
           Cross-jurisdiction aggregate data sharing protocol
  
  Plane 5: Full Trust Plane wrapper (continuous security envelope)
           Anomalous behavior detection
           Quarterly trust review automation
           Full MAS FEAT / HKMA compliance documentation
  
  Plane 6: LLM-as-judge calibration against human judgments
           A/B testing infrastructure for prompts and models
           Regulatory compliance reporting dashboard
           Anomaly detection on quality metrics
  
  Plane 7: Durable execution (Temporal or equivalent)
           Full saga pattern for multi-system workflows
           Event-driven automation (pub/sub)
           Agent lifecycle management (deploy → monitor → retire)
  
  Cross-Cutting: 
           Sovereignty mesh across 2-3 jurisdictions
           A2A protocol for cross-jurisdiction orchestration
           Full OpenTelemetry tracing across jurisdictions

Outcome: Enterprise-grade, multi-jurisdiction, 
         regulator-ready, future-proof
```

---

## Decision Register: The Hard Trade-Offs {#decision-register}

These are the decisions that define this architecture. Each one involves a real sacrifice.

| # | Decision | What We Chose | What We Sacrificed | Why |
|---|----------|---------------|--------------------|----|
| D1 | **Model routing by data classification** | Route restricted data to Tier S only, even if Tier 1 would produce better results | Quality on restricted-data tasks (sovereign models are less capable than frontier) | MAS Notice 655, PDPA, data residency law — non-negotiable |
| D2 | **Supervisor orchestration over Handoff/Swarm** | Central supervisor controls all routing with explicit decision log | Elegance, flexibility, and speed of dynamic agent-to-agent routing | Audit trail requirement — "who decided what" must always be answerable |
| D3 | **Typed contracts over full pass-through** | Agents exchange only declared output schemas | Maximum context availability (next agent doesn't see everything previous agent saw) | Token cost control + data minimization (least privilege for data exposure) |
| D4 | **Determinism-first (Level 4) over full autonomy** | Most agents follow fixed workflows with LLM filling in judgment gaps | Full flexibility for agents to decide their own execution paths | Regulatory explainability — "the system followed process X, with LLM judgment at step Y" |
| D5 | **Jurisdiction-scoped vector stores over global memory** | Each jurisdiction has its own memory store; no cross-jurisdiction memory sharing | Cross-jurisdiction learning (HK agent can't benefit from SG agent's experience on similar entities) | Data sovereignty compliance across APAC jurisdictions |
| D6 | **Memory expiry over indefinite retention** | All memories have mandatory retention_expiry aligned with data retention policy | Long-term agent learning and accumulation of institutional knowledge | PDPA/GDPR right-to-erasure compliance + liability reduction |
| D7 | **Server-side context assembly over client-side** | All context assembly happens on the server; client sends only identifiers | Frontend flexibility (client can't dynamically adjust context) | Security (context contains sensitive data, shouldn't transit through browser) |
| D8 | **Regression testing gates deployment** | No prompt/model change deployed without passing golden dataset tests | Speed of iteration (can't hot-fix a prompt without running tests) | Production stability — a bad prompt in banking can cause regulatory incidents |
| D9 | **PII masking before cloud calls over inline processing** | Customer identifiers replaced with reversible placeholders before any Tier 1/2 call | Some accuracy loss (model reasons about "[CUSTOMER_001]" instead of real context) | Zero risk of PII exposure to cloud providers |
| D10 | **Trust as wrapper over trust as layer** | Security controls operate on every operation within inner planes, not just entry/exit | Performance overhead (every tool call, every inter-agent message gets checked) | Banking requires continuous trust — a single unchecked operation is a vulnerability |

---

## Anti-Pattern Catalogue {#anti-patterns}

Mistakes that are especially dangerous in the context of a multinational Asian bank.

| Anti-Pattern | Description | Why It's Dangerous | Correct Pattern |
|---|---|---|---|
| **The Amnesia Handoff** | Agent escalates to human but doesn't pass conversation history, context, or actions already taken | Customer repeats themselves. Human wastes time re-diagnosing. Frustrated stakeholders. | Always pass: full conversation summary + actions taken + partial results + recommended next steps |
| **The Rubber Stamp** | Too many HITL approvals → humans approve without reading | Critical errors pass through "approved" gate. Regulatory exposure. | Risk-tier gating: only Critical/High actions need approval. Monitor approval latency — sub-10-second approvals are suspicious. |
| **The Global Brain** | Single global vector store for all jurisdictions' agent memories | Cross-border data leakage. Regulatory finding from MAS or HKMA. | Jurisdiction-scoped memory stores. Only aggregated, anonymized data crosses borders. |
| **The Chatty Orchestrator** | Orchestrator passes full context between agents, including all prior agent outputs | Token cost explosion. Data leakage between agent scopes. Context window pollution. | Typed contracts. Orchestrator extracts relevant fields and passes only what the next agent needs. |
| **The Confident Hallucinator** | Agent produces a confident, well-formatted answer that is factually wrong, with no citation or uncertainty signal | Wrong risk rating, wrong regulatory reference, wrong customer data — all presented with confidence | Mandatory citation extraction. Confidence scoring. Schema validation. "If unsure, say so" in system prompt. |
| **The Immortal Agent** | Agent deployed and never evaluated, updated, or retired | Prompt drift, model updates change behavior, regulatory requirements change, agent quality degrades silently | Agent lifecycle management. Mandatory quarterly evaluation. Canary deployment for updates. |
| **The Shadow API Key** | LLM API keys hardcoded in source code or environment variables without rotation | Key leaks → unauthorized access → cost explosion or data breach | Centralized secret management (Vault/AWS Secrets Manager). Automated rotation. Per-environment keys. |
| **The Optimistic Executor** | Agent takes action (writes to DB, sends notification) and then asks for approval | Irreversible damage done before human review. "Oops, we already sent that to the regulator." | Approval BEFORE execution. Always. No exceptions for any write operation classified as Critical or High. |
| **The Monolingual Assumption** | System only handles English, ignoring that APAC customers and documents use Chinese, Thai, Malay, Japanese, Hindi | Misinterpretation of documents, customer complaints, regulatory filings in local languages missed | Multi-language support in RAG (language-aware embeddings), PII detection for non-Latin scripts, tool outputs supporting local date/number formats |

---

## Future-Proofing: 2026–2030 Horizon {#future-proofing}

### What the architecture must be ready for

| Horizon | Trend | Architecture Impact | Readiness in This Design |
|---|---|---|---|
| **2026-2027** | **Multi-modal agents** — models that natively process documents, images, audio alongside text | Action Plane tools may receive/return images (trade confirmations, signed documents, ID verification). Context Plane must handle multi-modal context budgets. | Ready: Tool interface is type-agnostic. Context budget model can be extended to include image tokens. Intelligence Plane abstraction supports multi-modal models. |
| **2026-2027** | **MCP ecosystem explosion** — thousands of MCP servers available as plug-and-play tool providers | Tool governance becomes critical — agents must not auto-discover and use unvetted tools. | Ready: Tool governance framework with explicit allowlisting prevents uncontrolled tool adoption. |
| **2027-2028** | **Sovereign AI mandates** — APAC regulators may require AI models for banking to be hosted in-country | Tier S becomes not optional but mandatory for more use cases. Sovereign model quality must match frontier. | Ready: Tier S already in architecture. Investment path: fine-tune sovereign models on banking domain data. |
| **2027-2028** | **Agent-to-agent economies** — banks' agents negotiate with vendors' agents, regulators' agents, other banks' agents | A2A protocol becomes critical path. Agent identity, capability discovery, and trust negotiation become first-class concerns. | Partially ready: A2A protocol included but needs maturation. Agent cards and capability discovery need development. |
| **2028-2030** | **Continuous learning agents** — agents that improve from feedback without retraining the base model | Memory architecture needs to support learning safely. Risk of learning wrong things (reward hacking, bias amplification). | Partially ready: Memory architecture exists but learning feedback loops need guardrails to prevent bias amplification. |
| **2028-2030** | **Regulatory AI frameworks become law** — MAS, HKMA likely to formalize AI governance requirements | Full explainability, audit trail, and trust controls become legally mandated, not just best practice. | Ready: Trust Plane and Observability Plane designed for regulatory compliance from day one. |
| **2029-2030** | **AGI-adjacent capabilities** — models capable of sustained autonomous work over hours/days | Operations Plane must handle truly long-running agents. Resilience and checkpointing become critical. HITL patterns need to handle agents that work overnight. | Partially ready: Checkpoint + durable execution architecture supports this. HITL patterns need extension for asynchronous multi-day workflows. |

### Architecture Extensibility Principles

The architecture should evolve without requiring redesign. These principles ensure that:

1. **Plane interfaces are stable; implementations change.** The contract between Plane 1 (Intelligence) and Plane 3 (Reasoning) is the `IntelligenceRequest/Response` interface. Whether the underlying model is Claude, Gemini, Llama, or something that doesn't exist yet — the interface doesn't change.

2. **New tools are additive, not structural.** Adding a new MCP tool to the Action Plane requires: implementing the tool, adding it to the tool governance allowlist, deploying. No architectural change.

3. **New jurisdictions follow a deployment template.** Adding a new country (e.g., Philippines, Vietnam) means deploying a new jurisdiction data plane from the sovereignty mesh template. Agents, models, and tools are instantiated from the same codebase with jurisdiction-specific configuration.

4. **New agent types follow the runtime contract.** Creating a new agent (e.g., AML monitoring, credit scoring) means: defining its system prompt, tool allowlist, determinism level, HITL tier, and evaluation golden dataset. The runtime infrastructure is shared.

5. **Protocol upgrades are versioned and backward-compatible.** MCP and A2A versions are pinned per release cycle. New protocol versions are adopted on a quarterly upgrade schedule after testing, not ad-hoc.

---

## Appendix A: Technology Recommendations

These are starting points, not mandates. The architecture is tool-agnostic by design.

| Plane | Component | Recommended | Alternatives | Notes |
|---|---|---|---|---|
| **P1** | Provider Abstraction | LiteLLM | Custom gateway, Azure AI Gateway | 100+ provider support, cost tracking built-in |
| **P1** | Sovereign Inference | vLLM on NVIDIA GPUs | TGI (HuggingFace), Ollama (dev) | Production-grade, supports Llama/Qwen/Mistral |
| **P2** | Embedding | text-embedding-3-large (OpenAI) or multilingual-e5-large (self-hosted) | Cohere Embed, Voyage | Self-hosted for restricted data |
| **P2** | Vector Search | pgvector | Pinecone, Weaviate, Qdrant | Co-locate with primary Postgres, simplify ops |
| **P2** | Reranking | cross-encoder/ms-marco-MiniLM-L-12-v2 | Cohere Rerank | Self-hostable, critical for precision |
| **P3** | Agent Framework | LangGraph | Dify, CrewAI, AutoGen | Best support for typed state, checkpointing, HITL |
| **P4** | Tool Protocol | MCP (FastAPI) | OpenAPI | Industry standard, growing ecosystem |
| **P4** | Working Memory | Redis | Memcached | Shared with job queue, pub/sub capability |
| **P5** | PII Detection | Microsoft Presidio + custom APAC | spaCy NER, AWS Comprehend | Open-source, extensible for APAC identifiers |
| **P5** | Guardrails | LlamaFirewall (Meta) | NeMo Guardrails (NVIDIA) | Open-source, production-tested |
| **P6** | LLM Tracing | Langfuse | Arize Phoenix, LangSmith | Self-hostable, native integrations |
| **P6** | Logging | Pino (Node.js) / structlog (Python) | Winston, Python logging | Structured JSON, high performance |
| **P6** | Eval Framework | DeepEval + promptfoo | Ragas, custom | 50+ metrics, CI/CD integration |
| **P7** | Job Queue | BullMQ + Redis | RabbitMQ, Celery | Node.js native, shared Redis |
| **P7** | Circuit Breaker | opossum (Node.js) / pybreaker (Python) | Custom, resilience4j (JVM) | Lightweight, well-tested |
| **P7** | Durable Execution | Temporal (Phase 3) | Restate, LangGraph checkpointer | Gold standard for long-running workflows |

---

## Appendix B: Regulatory Alignment Matrix

| Regulatory Requirement | Source | Architecture Component |
|---|---|---|
| AI decisions must be explainable | MAS FEAT Principles (Fairness, Ethics, Accountability, Transparency) | Trust Plane → Explainability Records |
| Technology outsourcing requires exit plans | MAS TRMG Section 5.4 | Intelligence Plane → Multi-provider strategy with Tier S fallback |
| Customer data must be protected | MAS Notice 655, PDPA | Trust Plane → PII masking, Sovereignty Mesh → Jurisdiction-scoped data planes |
| Material outsourcing risk management | HKMA OR-2 | Intelligence Plane → Documented LLM provider risk assessment with exit strategy |
| AI model risk management | HKMA Circular on AI | Observability Plane → Evaluation pipeline, Trust Plane → HITL for critical decisions |
| Data localization | India DPDP Act 2023, China PIPL | Sovereignty Mesh → India/China data planes with no cross-border customer data flow |
| Audit trail retention | MAS MR/TRMG | Trust Plane → 7-year immutable audit trail |
| Concentration risk for third-party dependencies | MAS TRMG, HKMA OR-2 | Intelligence Plane → Minimum 2 providers per tier, Tier S as fallback |
| Model validation and testing | MAS Notice on Model Risk | Observability Plane → Golden datasets, regression testing, continuous evaluation |

---

*This architecture is a living document. It should be reviewed quarterly and updated as regulatory requirements, model capabilities, and business needs evolve.*
