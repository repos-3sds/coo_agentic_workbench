# Context Engineering Blueprint
## GFM COO Agentic Workbench -- Enterprise-Grade Context Pipeline

**Version:** 1.0.0
**Date:** March 2026
**Status:** Design Specification
**Owner:** AI Platform Engineering -- GFM COO
**Audience:** AI Engineers, Platform Engineers, Domain SMEs, Architecture Review Board

---

## Table of Contents

1. [What Is Context Engineering? (Plain English)](#1-what-is-context-engineering-plain-english)
2. [Why It Matters for Banking](#2-why-it-matters-for-banking)
3. [Architecture Overview](#3-architecture-overview)
4. [The Context Assembly Pipeline](#4-the-context-assembly-pipeline)
5. [Source Authority & Trust](#5-source-authority--trust)
6. [RAG Pipeline (Retrieval-Augmented Generation)](#6-rag-pipeline-retrieval-augmented-generation)
7. [Context Budget Management](#7-context-budget-management)
8. [Memory Architecture](#8-memory-architecture)
9. [Domain Context Contracts](#9-domain-context-contracts)
10. [Context Scoping & Filtering](#10-context-scoping--filtering)
11. [Provenance & Citations](#11-provenance--citations)
12. [Context Failure Modes & Mitigations](#12-context-failure-modes--mitigations)
13. [Observability & Metrics](#13-observability--metrics)
14. [UI Management Layer](#14-ui-management-layer)
15. [Lifecycle Management](#15-lifecycle-management)
16. [Implementation File Map](#16-implementation-file-map)
17. [Current State vs Target State](#17-current-state-vs-target-state)
18. [Tech Stack x Phase Mapping](#18-tech-stack-x-phase-mapping)

---

## 1. What Is Context Engineering? (Plain English)

### The Simplest Explanation

Think of an AI agent like a brilliant new employee who just joined the bank today. They're incredibly smart, but they know nothing about:
- Your specific NPA project
- Which policies apply to derivatives in Singapore vs Hong Kong
- What happened in the last conversation with the user
- Which team member already approved the risk assessment
- Whether the product has been flagged as prohibited

**Context Engineering is the discipline of giving that brilliant employee exactly the right information, from the right sources, at the right time, so they can do their job correctly.**

It's NOT about writing better instructions (that's Prompt Engineering). It's about assembling the right briefing package before the agent even starts thinking.

### A Banking Analogy

Imagine you're preparing a briefing folder for the COO before a product approval meeting:

| What You Include | Context Engineering Equivalent |
|---|---|
| The NPA project file | **Entity Data** -- fetched from database via MCP tools |
| Relevant policy documents | **RAG Retrieval** -- searched from knowledge base |
| Previous meeting notes | **Session Memory** -- conversation history |
| The analyst's risk assessment | **Cross-Agent Results** -- output from Risk agent |
| Regulatory circulars for Singapore | **Domain Scoping** -- jurisdiction-filtered content |
| "This comes from the official MAS website" | **Provenance** -- source attribution |
| "Don't include unverified rumours" | **Trust Classification** -- trusted vs untrusted |
| Only documents the COO is cleared to see | **Entitlement Filtering** -- role-based access |

**Context Engineering automates this entire briefing assembly process, consistently, at scale, for every single agent interaction.**

### What Context Engineering IS vs IS NOT

| Context Engineering IS | Context Engineering IS NOT |
|---|---|
| Deciding WHAT information enters the AI's context window | Deciding HOW to instruct the AI (that's Prompt Engineering) |
| Data assembly pipeline that feeds agents | Prompt writing or system prompt design |
| RAG retrieval, ranking, and chunking strategies | Agent orchestration logic (routing, delegation) |
| Trusted vs untrusted content classification | Prompt injection detection (that's Security/Trust) |
| Source priority resolution (which source wins conflicts) | Output schema design (that's the Output Contract) |
| Session memory management | Prompt versioning and A/B testing |
| Domain-specific data scoping and filtering | Tool schema design |
| User context injection (role, entitlements, region) | Agent routing decisions |

### The Core Insight

> **The quality of an AI agent's output is bounded by the quality of its input context.**
>
> You can have the best prompt in the world, but if the agent doesn't have the right data -- or worse, has wrong data -- the output will be wrong. Context Engineering is about ensuring the right data reaches the right agent at the right time, from authoritative sources, with clear provenance.

---

## 2. Why It Matters for Banking

### Regulatory Requirements

Banking AI systems operate under strict regulatory oversight. Context Engineering directly addresses:

| Regulatory Concern | How Context Engineering Helps |
|---|---|
| **Explainability** (MAS FEAT) | Every piece of context has provenance -- we can trace WHY the agent said something |
| **Data Sovereignty** (MAS 655, PIPL) | Context scoping prevents Singapore data from leaking to Hong Kong agent contexts |
| **Auditability** (SOX, Basel III) | Context assembly is logged -- auditors can see exactly what the agent "knew" |
| **Accuracy** (Fiduciary duty) | Source priority ensures agents use official records, not guesses |
| **Privacy** (PDPA, DPDP) | Trust classification prevents PII from entering contexts where it shouldn't be |

### The Cost of Getting Context Wrong

| Failure | Business Impact | Context Engineering Prevention |
|---|---|---|
| Agent uses stale credit limit | Wrong approval decision | TTL-based freshness; critical data always fetched live |
| Agent mixes up two NPA projects | Compliance violation | Entity scoping -- agent only sees data for its assigned project_id |
| Agent invents a policy requirement | Audit failure | Source priority -- must cite policy doc_id + version |
| Analyst sees COO-only data | Unauthorized disclosure | Entitlement-based context filtering |
| Agent references withdrawn regulation | Legal risk | KB corpus versioning -- expired docs tagged and excluded |

---

## 3. Architecture Overview

### Where Context Engineering Sits

```
                          USER REQUEST
                              |
                              v
                    +-------------------+
                    |   LAYER A: UI     |  Angular 20
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |   LAYER B: API    |  Express.js Gateway
                    +-------------------+
                              |
                              v
                    +-------------------+
                    |  LAYER G: TRUST   |  Auth, RBAC, PII Masking
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | LAYER C: CONTROL  |  Agent Registry, Policy Engine
                    +-------------------+
                              |
                              v
               +================================+
               |                                |
               |    LAYER CX: CONTEXT           |   <-- THIS DOCUMENT
               |    ENGINEERING                 |
               |                                |
               |  +---------------------------+ |
               |  | 1. CLASSIFY               | |  What sources? What's trusted?
               |  | 2. SCOPE                  | |  Filter by domain entity
               |  | 3. RETRIEVE               | |  RAG + MCP tools + DB
               |  | 4. RANK                   | |  Source priority resolution
               |  | 5. BUDGET                 | |  Fit within token limits
               |  | 6. ASSEMBLE              | |  Build the context package
               |  | 7. TAG                    | |  Add provenance metadata
               |  +---------------------------+ |
               |                                |
               +================================+
                              |
                              v
                    +-------------------+
                    | LAYER PX: PROMPT  |  System prompt + modules + examples
                    |    STUDIO         |  (uses context_policy from CX)
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | LAYER D: AGENT    |  Dify Runtime (LLM execution)
                    |   RUNTIME         |
                    +-------------------+
                              |
                         +----+----+
                         |         |
                         v         v
                    +---------+ +----------+
                    | LAYER E | | LAYER F  |  MCP Tools, DB, KBs
                    | BUILD   | | DATA     |
                    +---------+ +----------+
```

### The 7-Step Pipeline (Simplified)

Every time an agent is about to be called, the Context Engineering pipeline runs these 7 steps:

```
REQUEST IN
    |
    v
[1. CLASSIFY] --> What type of request? What data sensitivity?
    |                Classify: domain, entity type, risk level
    v
[2. SCOPE]    --> What data should this agent see?
    |                Filter by: project_id, jurisdiction, user role
    v
[3. RETRIEVE] --> Get the actual data
    |                From: DB (MCP tools), KB (RAG search), session memory
    v
[4. RANK]     --> Which sources take priority?
    |                Hierarchy: SoR > SOPs > Standards > External > Web
    v
[5. BUDGET]   --> Will it fit in the context window?
    |                Allocate tokens: system prompt, entity data, KB docs, history
    v
[6. ASSEMBLE] --> Build the final context package
    |                Combine: entity data + retrieved docs + user context + history
    v
[7. TAG]      --> Add provenance metadata to every piece
    |                Tag: source_id, version, timestamp, authority_level
    v
CONTEXT PACKAGE --> Sent to Prompt Studio for final prompt assembly
```

---

## 4. The Context Assembly Pipeline

### 4.1 Pipeline Architecture (Detailed)

```
+============================================================================+
|                      CONTEXT ASSEMBLY PIPELINE                              |
+============================================================================+
|                                                                             |
|  INPUT: { agent_id, domain, entity_id, user_id, query, session_id }       |
|                                                                             |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 1: REQUEST CLASSIFICATION                                   |    |
|  |                                                                     |    |
|  |  Input:  Raw request metadata                                      |    |
|  |  Output: { domain, entity_type, primary_entity_id,                 |    |
|  |            data_sensitivity, required_sources[] }                   |    |
|  |                                                                     |    |
|  |  Rules:                                                             |    |
|  |    - agent_id --> domain lookup (agent-registry.json)               |    |
|  |    - domain --> entity_type (NPA=project_id, ORM=incident_id, etc) |    |
|  |    - agent archetype --> context contract template                  |    |
|  |    - data sensitivity from domain-registry.json                     |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 2: CONTEXT SCOPING                                          |    |
|  |                                                                     |    |
|  |  Input:  Classification + user identity                             |    |
|  |  Output: Scope filters for all downstream retrievals                |    |
|  |                                                                     |    |
|  |  Scoping Dimensions:                                                |    |
|  |    - Entity Scope: project_id / incident_id / counterparty_id      |    |
|  |    - Jurisdiction Scope: SG / HK / IN / TW / ID / AU              |    |
|  |    - Role Scope: analyst / checker / approver / COO / admin        |    |
|  |    - Time Scope: current data vs historical (TTL-based)            |    |
|  |    - Classification Scope: public / internal / confidential         |    |
|  |                                                                     |    |
|  |  Entitlement Check:                                                 |    |
|  |    - user.role determines max data classification visible           |    |
|  |    - user.department determines domain access                       |    |
|  |    - user.jurisdiction determines regional data visibility          |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 3: PARALLEL RETRIEVAL                                       |    |
|  |                                                                     |    |
|  |  Three retrieval channels run in parallel:                          |    |
|  |                                                                     |    |
|  |  [3A: ENTITY DATA]         [3B: KNOWLEDGE]       [3C: MEMORY]     |    |
|  |  MCP tools query DB        RAG pipeline search    Session history   |    |
|  |  - get_npa_by_id()         - Hybrid search        - Last N turns   |    |
|  |  - get_signoffs()          - BM25 + Vector        - Delegation     |    |
|  |  - get_risk_checks()       - Rerank to top 8        stack state    |    |
|  |  - get_form_data()         - Chunk: 800 tokens    - Cross-agent    |    |
|  |  - get_workflow_state()    - Source: SOPs, regs,     results       |    |
|  |                               templates             (waveContext)  |    |
|  |                                                                     |    |
|  |  Each retrieval includes:                                           |    |
|  |  - Provenance: { source_id, version, timestamp, authority }        |    |
|  |  - Trust tag: TRUSTED | UNTRUSTED                                  |    |
|  |  - Freshness: { fetched_at, ttl_seconds, is_stale }               |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 4: SOURCE RANKING & CONFLICT RESOLUTION                     |    |
|  |                                                                     |    |
|  |  Source Priority (5 tiers):                                         |    |
|  |    T1: System of Record (MCP tool results from DB)   HIGHEST       |    |
|  |    T2: Bank SOPs & Policies (versioned, from KB)                   |    |
|  |    T3: Industry Standards (ISDA, Basel, FATF)                      |    |
|  |    T4: External Official (regulators, standards bodies)             |    |
|  |    T5: General Web (only if explicitly permitted)     LOWEST       |    |
|  |                                                                     |    |
|  |  Conflict Resolution Rules:                                         |    |
|  |    - If SoR and SOP disagree --> SoR wins (it's the truth)         |    |
|  |    - If two SOPs conflict --> newer effective_date wins             |    |
|  |    - If Group policy and local policy conflict --> Group wins       |    |
|  |    - If uncertain --> flag for human review, don't guess            |    |
|  |                                                                     |    |
|  |  Deduplication:                                                     |    |
|  |    - Same content from multiple sources --> keep highest authority  |    |
|  |    - Overlapping KB chunks --> merge with attribution               |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 5: TOKEN BUDGET ALLOCATION                                  |    |
|  |                                                                     |    |
|  |  Total Budget: 128K tokens (model dependent)                       |    |
|  |                                                                     |    |
|  |  Allocation Strategy:                                               |    |
|  |    System Prompt          :  3-5K    FIXED (never compressed)      |    |
|  |    Entity Data (current)  : 10-25K   HIGH PRIORITY                 |    |
|  |    Regulatory/Policy KB   : 10-20K   HIGH PRIORITY                 |    |
|  |    Prior Agent Results    :  5-15K   MEDIUM PRIORITY               |    |
|  |    Few-Shot Examples      :  3-5K    MEDIUM PRIORITY               |    |
|  |    Conversation History   :  5-15K   LOW PRIORITY                  |    |
|  |    Tool Schemas           :  2-8K    ADAPTIVE                      |    |
|  |    Response Headroom      : 10-20K   RESERVED (never allocate)     |    |
|  |                                                                     |    |
|  |  Overflow Strategy:                                                 |    |
|  |    1. Compress older conversation history (summarize)               |    |
|  |    2. Reduce few-shot examples (keep best 2)                       |    |
|  |    3. Prune lowest-ranked KB chunks                                 |    |
|  |    4. NEVER reduce: system prompt, entity data, regulatory refs    |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 6: CONTEXT PACKAGE ASSEMBLY                                 |    |
|  |                                                                     |    |
|  |  Output: ContextPackage {                                           |    |
|  |    entity_data: { ... },          // From Stage 3A                 |    |
|  |    knowledge_chunks: [ ... ],      // From Stage 3B (ranked)       |    |
|  |    conversation_history: [ ... ],  // From Stage 3C (trimmed)      |    |
|  |    user_context: {                 // From Stage 2                  |    |
|  |      user_id, role, department, jurisdiction,                       |    |
|  |      entitlements, active_session_id                                |    |
|  |    },                                                               |    |
|  |    cross_agent_results: { ... },   // Prior agent outputs          |    |
|  |    scope_metadata: {               // From Stage 2                  |    |
|  |      domain, primary_entity_id, jurisdiction,                       |    |
|  |      data_sensitivity, filters_applied                              |    |
|  |    },                                                               |    |
|  |    budget_report: {                // From Stage 5                  |    |
|  |      total_tokens, allocated, remaining,                            |    |
|  |      overflow_actions_taken                                         |    |
|  |    }                                                                |    |
|  |  }                                                                  |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|                              v                                              |
|  +-------------------------------------------------------------------+    |
|  |  STAGE 7: PROVENANCE TAGGING                                       |    |
|  |                                                                     |    |
|  |  Every piece of context gets a provenance tag:                      |    |
|  |                                                                     |    |
|  |  {                                                                  |    |
|  |    source_id: "SOPv3.2_NPA_Classification",                        |    |
|  |    source_type: "bank_sop",         // SoR | bank_sop | standard  |    |
|  |    authority_tier: 2,                // 1 (highest) to 5 (lowest)  |    |
|  |    version: "3.2",                                                  |    |
|  |    effective_date: "2025-11-01",                                    |    |
|  |    fetched_at: "2026-03-01T09:15:00Z",                             |    |
|  |    ttl_seconds: 3600,               // How long before re-fetch   |    |
|  |    trust_class: "TRUSTED",           // TRUSTED | UNTRUSTED        |    |
|  |    data_classification: "INTERNAL",  // PUBLIC|INTERNAL|CONFID|REST|    |
|  |    jurisdiction: "SG"                                               |    |
|  |  }                                                                  |    |
|  +-------------------------------------------------------------------+    |
|                              |                                              |
|  OUTPUT: Tagged ContextPackage --> Prompt Studio (Layer PX)                 |
|                                                                             |
+============================================================================+
```

### 4.2 How Context Flows Through the System (End-to-End)

Here is a concrete example -- a user asks the RISK agent to assess an NPA project:

```
USER: "Run a risk assessment for NPA-2026-00142"

STEP 1 - REQUEST CLASSIFICATION:
  domain       = "NPA"
  entity_type  = "project"
  entity_id    = "NPA-2026-00142" (resolved to DB id: 142)
  agent_id     = "RISK"
  archetype    = "worker"
  sensitivity  = "CONFIDENTIAL"

STEP 2 - CONTEXT SCOPING:
  entity_scope      = project_id = 142
  jurisdiction      = "SG" (from npa_jurisdictions WHERE project_id = 142)
  user_role         = "analyst" (from JWT)
  data_class_max    = "CONFIDENTIAL" (analyst can see up to CONFIDENTIAL)
  time_scope        = "current" (live data, not historical)

STEP 3 - PARALLEL RETRIEVAL:
  [3A - Entity Data via MCP Tools]:
    get_npa_by_id(142)           --> project record, workflow state, signoff summary
    get_risk_checks(142)         --> existing risk check results (if any)
    get_form_data(142)           --> 339 form field values
    get_external_parties(142)    --> counterparties, custodians involved
    get_market_risk_factors(142) --> VaR, stress test capture flags

  [3B - Knowledge via RAG]:
    Query: "risk assessment framework NPA derivatives Singapore"
    Scoped to corpora: bank_sops, npa_regulatory_refs
    Results (after reranking):
      1. GFM_SOP_Summary.md section 4.2 "Risk Assessment Framework" [authority: T2]
      2. MAS_Notice_637_Derivatives.pdf clause 12.3 [authority: T3]
      3. KB_Risk_Agent.md "5-Layer Risk Cascade" [authority: T2]
      4. NPA_Prohibited_Items.md [authority: T2]

  [3C - Memory]:
    Session history: last 8 turns (user + agent messages)
    Cross-agent results: Classifier output { classification: "Variation", confidence: 0.92 }
    Delegation context: Orchestrator assigned task "full risk assessment, 7 domains"

STEP 4 - SOURCE RANKING:
    SoR data (project record, form data)     --> TIER 1, highest priority
    GFM SOP Summary                          --> TIER 2
    Risk Agent KB                            --> TIER 2
    MAS Notice 637                           --> TIER 3
    Classifier output                        --> TIER 1 (agent result from SoR data)

    No conflicts detected.

STEP 5 - TOKEN BUDGET:
    System prompt (Risk agent):    4,200 tokens  (FIXED)
    Entity data (project + forms): 8,500 tokens  (HIGH)
    KB documents (4 chunks):       6,200 tokens  (HIGH)
    Classifier results:            1,100 tokens  (MEDIUM)
    Conversation history:          2,400 tokens  (LOW)
    Tool schemas (7 tools):        3,100 tokens  (ADAPTIVE)
    Response headroom:            15,000 tokens  (RESERVED)
    ------------------------------------------------
    Total allocated:              40,500 tokens  (of 128K -- well within budget)

STEP 6 - ASSEMBLY:
    ContextPackage = {
      entity_data: { project: {...}, risk_checks: [...], form_data: {...}, ... },
      knowledge_chunks: [ sopSection, masNotice, riskKB, prohibitedItems ],
      conversation_history: [ ...last8Messages ],
      user_context: { role: "analyst", jurisdiction: "SG", ... },
      cross_agent_results: { classifier: { classification: "Variation", ... } },
      scope_metadata: { domain: "NPA", entity_id: 142, jurisdiction: "SG", ... },
      budget_report: { total: 128000, allocated: 40500, remaining: 87500 }
    }

STEP 7 - PROVENANCE:
    Each data piece gets tagged:
    - project record: { source: "SoR:npa_projects", tier: 1, fetched: "2026-03-01T09:15:00Z" }
    - GFM SOP: { source: "KB:GFM_SOP_v3.2", tier: 2, version: "3.2", effective: "2025-11-01" }
    - MAS Notice: { source: "KB:MAS_637_2024", tier: 3, version: "2024-rev", jurisdiction: "SG" }

RESULT: Tagged ContextPackage sent to Prompt Studio for Risk agent execution
```

---

## 5. Source Authority & Trust

### 5.1 Source Priority Hierarchy (5 Tiers)

This hierarchy determines which source wins when information conflicts. It is a fundamental design decision that ensures regulatory compliance and auditability.

```
TIER 1: SYSTEM OF RECORD (Highest Authority)
+-----------------------------------------------------------------------+
| Source: Database via MCP tools                                         |
| Examples: npa_projects record, signoff matrix, risk checks, form data  |
| Rule: NEVER guess SoR values. ALWAYS fetch live via tools.            |
| Freshness: Real-time (every request)                                   |
| Trust: TRUSTED (bank owns the data)                                   |
+-----------------------------------------------------------------------+
        |
        v
TIER 2: BANK-APPROVED SOPs & POLICIES
+-----------------------------------------------------------------------+
| Source: Dify Knowledge Base (RAG retrieval, versioned)                  |
| Examples: GFM SOP Summary, Classification Criteria, PIR Playbook,     |
|           SLA Matrix, Product Taxonomy, Prohibited Items List          |
| Rule: Must cite doc_id + version. Newer effective_date wins conflicts.|
| Freshness: Updated per policy release cycle (quarterly/annually)       |
| Trust: TRUSTED (bank-authored, reviewed, version-controlled)          |
+-----------------------------------------------------------------------+
        |
        v
TIER 3: INDUSTRY STANDARDS & TEMPLATES
+-----------------------------------------------------------------------+
| Source: Dify Knowledge Base (RAG retrieval)                             |
| Examples: ISDA Master Agreement templates, Basel III/BCBS guidelines,  |
|           FATF AML/KYC standards, FX Global Code                       |
| Rule: Parameterize by jurisdiction. Cite standard + section.          |
| Freshness: Updated per standards body release cycle                    |
| Trust: TRUSTED (authoritative external body)                          |
+-----------------------------------------------------------------------+
        |
        v
TIER 4: EXTERNAL OFFICIAL SOURCES
+-----------------------------------------------------------------------+
| Source: Regulatory body publications (via curated KB or API)           |
| Examples: MAS Notices, HKMA Circulars, SEBI Guidelines,               |
|           ASX Operating Rules, RBI Master Directions                   |
| Rule: Must verify currency. Parameterize by jurisdiction.             |
| Freshness: Varies; must check effective_date                           |
| Trust: TRUSTED (government/regulator published)                       |
+-----------------------------------------------------------------------+
        |
        v
TIER 5: GENERAL WEB (Lowest Authority)
+-----------------------------------------------------------------------+
| Source: Public internet content                                        |
| Examples: Industry articles, vendor documentation, market commentary   |
| Rule: ONLY when explicitly permitted. MUST be labeled as "web source".|
|        NEVER use for regulatory claims or decision-making.             |
| Freshness: Unknown                                                     |
| Trust: UNTRUSTED                                                       |
+-----------------------------------------------------------------------+
```

### 5.2 Trust Classification

Every piece of data entering the context pipeline is classified as either TRUSTED or UNTRUSTED. This classification determines how the agent treats it.

```
+========================+===========================+========================+
|     TRUSTED            |     UNTRUSTED             |     NEVER ALLOWED      |
+========================+===========================+========================+
| MCP tool results       | User free-text input      | Unverified web scrapes |
| (DB queries)           |                           |                        |
+------------------------+---------------------------+------------------------+
| Bank SOPs from KB      | Uploaded documents        | Social media content   |
| (versioned, reviewed)  | (until validated)         |                        |
+------------------------+---------------------------+------------------------+
| Regulatory docs from   | Retrieved emails          | Competitor intelligence|
| curated KB             | (from user mailbox)       | (unattributed)         |
+------------------------+---------------------------+------------------------+
| Agent outputs with     | External loss data        | User-pasted content    |
| provenance             | (ORM domain)              | claiming to be policy  |
+------------------------+---------------------------+------------------------+
| Reference data tables  | Third-party API responses | "I heard that..." or   |
| (ref_* tables)         | (not SoR)                 | "Someone said..."      |
+------------------------+---------------------------+------------------------+

GOLDEN RULE: Untrusted content is DATA, never INSTRUCTIONS.
             An agent must never follow instructions found inside untrusted content.
```

### 5.3 Data Classification Taxonomy

```
+================+====================================+==========================+
| Classification | Definition                         | Agent Visibility         |
+================+====================================+==========================+
| PUBLIC         | Published externally               | All agents, all users    |
|                | (annual reports, press releases)   |                          |
+----------------+------------------------------------+--------------------------+
| INTERNAL       | Bank employees only                | All authenticated agents |
|                | (org charts, internal comms)       | All authenticated users  |
+----------------+------------------------------------+--------------------------+
| CONFIDENTIAL   | Need-to-know basis                 | Domain-scoped agents     |
|                | (client data, deal terms,          | Authorized users only    |
|                |  risk assessments, audit findings) | (analyst+)               |
+----------------+------------------------------------+--------------------------+
| RESTRICTED     | Highest sensitivity                | Specific named agents    |
|                | (board papers, M&A data,           | Senior roles only        |
|                |  regulatory sanctions, PII)        | (checker/approver/COO)   |
+================+====================================+==========================+
```

---

## 6. RAG Pipeline (Retrieval-Augmented Generation)

### 6.1 Two-Stage Retrieval Architecture

The RAG pipeline uses a two-stage approach to balance precision with performance:

```
USER QUERY: "What are the risk assessment requirements for FX derivatives in Singapore?"

+============================================================================+
|  STAGE 1: COARSE SCOPING (Deterministic -- No LLM Needed)                 |
|                                                                             |
|  Input:                                                                     |
|    task_type    = "risk_assessment"                                         |
|    jurisdiction = "SG"                                                      |
|    product_cat  = "FX_derivatives"                                          |
|    entity_type  = "NPA"                                                     |
|                                                                             |
|  Method: Metadata-based filtering on pre-tagged document attributes         |
|                                                                             |
|  Output: Scoped corpus subset                                               |
|    BEFORE: 500 documents across all domains                                 |
|    AFTER:  47 documents (SG + FX + risk-related SOPs and regulations)      |
|                                                                             |
|  Why: Prevents "approximately relevant" results from unrelated domains.     |
|       A Basel III document about credit risk in bonds should NOT appear     |
|       in FX derivatives risk assessment context.                            |
+============================================================================+
                              |
                              v
+============================================================================+
|  STAGE 2: FINE-GRAINED RETRIEVAL (Semantic -- LLM-Powered)                |
|                                                                             |
|  Input: Scoped 47 documents + specific query                               |
|                                                                             |
|  Search Methods (Hybrid -- all run in parallel):                            |
|    [BM25]        Lexical match -- catches exact regulatory reference codes |
|    [Vector]      Semantic similarity -- catches conceptual matches          |
|    [Contextual]  Embedding with document context -- reduces ambiguity       |
|                                                                             |
|  Fusion: Reciprocal Rank Fusion (RRF) to merge results                     |
|                                                                             |
|  Reranking: Cross-encoder reranker scores top 40 --> keeps top 8           |
|                                                                             |
|  Why Reranking is Mandatory:                                                |
|    Pure vector search returns "approximately relevant" results.             |
|    In banking, "approximately" is not acceptable. The cross-encoder         |
|    ensures precise relevance by comparing query-document pairs directly.   |
|                                                                             |
|  Output: Top 8 ranked chunks with provenance metadata                      |
+============================================================================+
```

### 6.2 Chunking Strategies

Different document types require different chunking approaches:

```
+=====================+====================+===============+==================+
| Document Type       | Chunking Method    | Chunk Size    | Overlap          |
+=====================+====================+===============+==================+
| Default (general)   | Sliding window     | 800 tokens    | 120 tokens       |
+---------------------+--------------------+---------------+------------------+
| Legal contracts     | By clause/section  | Variable      | Full clause      |
|                     |                    | (up to 1500)  | cross-reference  |
+---------------------+--------------------+---------------+------------------+
| SOPs & Procedures   | By procedure step  | Variable      | Step header      |
|                     | + exception blocks | (up to 1200)  | overlap          |
+---------------------+--------------------+---------------+------------------+
| Regulatory docs     | By article/        | Variable      | Article header   |
|                     | paragraph          | (up to 1000)  | overlap          |
+---------------------+--------------------+---------------+------------------+
| Product taxonomies  | By category/       | Variable      | Category context |
|                     | product family     | (up to 600)   |                  |
+---------------------+--------------------+---------------+------------------+
| Templates           | By section/field   | Variable      | Section header   |
|                     | group              | (up to 500)   | overlap          |
+=====================+====================+===============+==================+
```

### 6.3 Knowledge Corpora Registry

```
+================================+===========+===========+=====================+
| Corpus Name                    | Authority | Domains   | Mandatory Metadata   |
+================================+===========+===========+=====================+
| bank_sops_and_policies         | HIGHEST   | ALL       | doc_id, version,     |
|                                |           |           | effective_date,      |
|                                |           |           | owner, classification|
+--------------------------------+-----------+-----------+---------------------+
| npa_classification_criteria    | HIGH      | NPA       | criteria_id, version,|
|                                |           |           | scoring_weights      |
+--------------------------------+-----------+-----------+---------------------+
| npa_regulatory_refs            | HIGH      | NPA       | regulator, notice_no,|
|                                |           |           | jurisdiction, status |
+--------------------------------+-----------+-----------+---------------------+
| isda_templates_and_standards   | HIGH      | DESK, DCE | template_version,    |
|                                |           |           | standard_body        |
+--------------------------------+-----------+-----------+---------------------+
| basel_iii_or_guidelines        | HIGH      | ORM       | bcbs_ref, version,   |
|                                |           |           | effective_date       |
+--------------------------------+-----------+-----------+---------------------+
| fatf_aml_kyc_refs              | HIGH      | DESK      | fatf_ref, version,   |
|                                |           |           | jurisdiction         |
+--------------------------------+-----------+-----------+---------------------+
| product_taxonomy               | MEDIUM    | ALL       | taxonomy_version,    |
|                                |           |           | last_updated         |
+--------------------------------+-----------+-----------+---------------------+
| npa_golden_templates           | MEDIUM    | NPA       | template_version,    |
|                                |           |           | product_type         |
+================================+===========+===========+=====================+
```

---

## 7. Context Budget Management

### 7.1 Token Allocation Strategy

```
+===========================================================================+
|                     128K TOKEN BUDGET ALLOCATION                           |
+===========================================================================+
|                                                                            |
|  [===== System Prompt =====]  3-5K     FIXED -- never compressed          |
|  [======================== Entity Data ========================] 10-25K   |
|  [===================== Regulatory KB =====================]     10-20K   |
|  [============== Cross-Agent Results ==============]              5-15K   |
|  [========= Few-Shot Examples =========]                          3-5K    |
|  [====== Conversation History ======]                             5-15K   |
|  [==== Tool Schemas ====]                                         2-8K    |
|                                                                            |
|  [RESERVED: Response Headroom -- NEVER allocate]                 10-20K   |
|                                                                            |
|  Total Available: ~108K (128K minus response headroom)                    |
+===========================================================================+
```

### 7.2 Overflow Strategy (When Context Exceeds Budget)

```
PRIORITY OF COMPRESSION (compress lowest priority first):

  1. COMPRESS conversation history
     - Summarize turns older than 4 messages
     - Keep: latest 4 turns verbatim + summary of earlier context
     - Savings: typically 3-8K tokens

  2. REDUCE few-shot examples
     - Drop from 4 examples to 2 (keep the golden + edge case)
     - Savings: 1-3K tokens

  3. PRUNE lowest-ranked KB chunks
     - Drop chunks ranked #7 and #8 (keep top 6)
     - Savings: 1-3K tokens

  4. TRIM cross-agent results
     - Keep only final output (drop intermediate reasoning_chain)
     - Savings: 2-5K tokens

  NEVER COMPRESS:
  x  System prompt (agent identity, constraints, output contract)
  x  Entity data from SoR (project record, risk checks, form values)
  x  Regulatory references that support critical decisions
  x  Response headroom
```

---

## 8. Memory Architecture

### 8.1 Four Memory Tiers

```
+===========================================================================+
|  TIER 1: CONTEXT WINDOW (In-Flight Memory)                                |
|                                                                            |
|  What: The 128K token context window for the current LLM call             |
|  Lifetime: Single agent invocation                                         |
|  Contents: System prompt + entity data + KB + history + tools             |
|  Managed by: Context Assembly Pipeline (this document)                     |
|  Stored in: LLM API call payload                                          |
+---------------------------------------------------------------------------+

+---------------------------------------------------------------------------+
|  TIER 2: WORKING MEMORY (Session Memory)                                  |
|                                                                            |
|  What: Conversation state that persists across turns within a session     |
|  Lifetime: One user session (may span hours/days)                          |
|  Contents:                                                                 |
|    - Message history (role, content, timestamp, agent_identity)            |
|    - Conversation IDs per agent (Dify state)                               |
|    - Delegation stack (which agent called which)                           |
|    - Wave context (cross-agent results within a workflow)                  |
|    - Active project_id binding                                             |
|  Managed by: ChatSessionService (Angular) + agent_sessions table (DB)     |
|  Stored in:                                                                |
|    - Angular: signals (_sessions, _activeSessionId)                        |
|    - DB: agent_sessions.conversation_state_json                            |
|    - DB: agent_messages (full message log)                                 |
+---------------------------------------------------------------------------+

+---------------------------------------------------------------------------+
|  TIER 3: LONG-TERM MEMORY (Entity Memory)                                 |
|                                                                            |
|  What: Accumulated knowledge about a specific entity (project, incident)  |
|  Lifetime: Lifetime of the entity (months to years)                        |
|  Contents:                                                                 |
|    - Classification results for NPA-2026-00142                             |
|    - Risk assessment history                                               |
|    - Sign-off decisions and loop-backs                                     |
|    - Document validation results                                           |
|    - Audit trail                                                           |
|  Managed by: MCP Tools + Database tables                                   |
|  Stored in: npa_projects, npa_risk_checks, npa_signoffs, etc.             |
|  NOTE: This is NOT LLM memory -- it's structured data retrieved on demand |
+---------------------------------------------------------------------------+

+---------------------------------------------------------------------------+
|  TIER 4: PROCEDURAL MEMORY (Knowledge Base)                               |
|                                                                            |
|  What: How-to knowledge the agent needs to do its job                      |
|  Lifetime: Permanent (updated with policy changes)                         |
|  Contents:                                                                 |
|    - SOPs and policies (GFM_SOP_Summary, PIR_Playbook, etc.)              |
|    - Regulatory frameworks (MAS Notices, Basel III, FATF)                  |
|    - Classification criteria and scoring weights                           |
|    - Product taxonomies and prohibited items                               |
|    - Templates (NPA golden template, filled examples)                      |
|  Managed by: KB Corpora Registry + Dify Knowledge Base                     |
|  Stored in: Dify KB (vector + full-text index) + kb_documents table       |
+---------------------------------------------------------------------------+
```

### 8.2 Memory Flow Between Agent Delegations

```
MASTER_COO receives: "Assess risk for NPA-2026-00142"
    |
    | DELEGATION: Sends to NPA_ORCHESTRATOR with context:
    |   { query, project_id: 142, session_id, intent: "risk_assessment" }
    |
    v
NPA_ORCHESTRATOR receives delegation context
    |
    | DELEGATION: Sends to RISK agent with context:
    |   { query, project_id: 142, session_id,
    |     orchestrator_message: "Run full 7-domain risk assessment",
    |     prior_results: { classifier: { classification: "Variation", confidence: 0.92 } } }
    |
    v
RISK agent receives full context package
    |
    | RETURNS: Structured risk assessment result
    |   { overall_score: 6.2, overall_rating: "MEDIUM", hard_stop: false,
    |     domain_assessments: [...], provenance: { sources: [...], citations: [...] } }
    |
    v
NPA_ORCHESTRATOR receives result, stores in waveContext
    |
    | DELEGATION: Sends to GOVERNANCE agent with context:
    |   { query, project_id: 142, session_id,
    |     prior_results: {
    |       classifier: { classification: "Variation", ... },
    |       risk: { overall_rating: "MEDIUM", hard_stop: false, ... }
    |     }
    |   }
    |
    v
GOVERNANCE agent receives full accumulated context

KEY RULE: Each delegation carries ONLY the structured outputs of prior agents,
          NOT the raw conversation history of those agents. This prevents
          context pollution and keeps token usage bounded.
```

---

## 9. Domain Context Contracts

### 9.1 What Is a Context Contract?

A Context Contract defines exactly what data each agent archetype needs. Think of it as a specification sheet: "For the Risk agent to do its job, it needs these 7 specific data items from these specific sources."

### 9.2 Contracts by Agent Archetype

```
+===========================================================================+
|  ORCHESTRATOR CONTEXT CONTRACT                                             |
|  (MASTER_COO, NPA_ORCHESTRATOR, ORM_ORCHESTRATOR, etc.)                   |
+---------------------------------------------------------------------------+
|                                                                            |
|  REQUIRED:                                                                 |
|    - user_context: { user_id, role, department, jurisdiction, session_id } |
|    - intent: classified intent from user query                             |
|    - routing_context: { available_agents[], domain, risk_level }          |
|    - entity_summary: { entity_id, current_stage, status } (if exists)     |
|                                                                            |
|  OPTIONAL:                                                                 |
|    - prior_worker_results: { agent_id: structured_output }                |
|    - delegation_stack: [ ...previous agents in chain ]                    |
|    - conversation_history: last 4 turns                                    |
|                                                                            |
|  NOT NEEDED (and must NOT include):                                        |
|    x  Raw KB chunks (orchestrators don't read policies)                   |
|    x  Detailed form data (too granular for routing decisions)              |
|    x  Full audit trail                                                     |
+===========================================================================+

+===========================================================================+
|  WORKER CONTEXT CONTRACT                                                   |
|  (RISK, CLASSIFIER, AUTOFILL, GOVERNANCE, DOC_LIFECYCLE, etc.)            |
+---------------------------------------------------------------------------+
|                                                                            |
|  REQUIRED:                                                                 |
|    - assigned_task: what the orchestrator asked this worker to do           |
|    - entity_data: full project/incident record from SoR (via MCP tools)   |
|    - domain_knowledge: relevant KB chunks (ranked, with provenance)        |
|    - tool_results: data fetched by tools (risk checks, form data, etc.)   |
|    - user_context: { role, jurisdiction } (for scoping decisions)          |
|                                                                            |
|  OPTIONAL:                                                                 |
|    - prior_worker_results: outputs from agents that ran before this one    |
|    - conversation_history: last 2-4 turns (only if conversational agent)  |
|    - few_shot_examples: 2-4 golden examples for output format             |
|                                                                            |
|  NOT NEEDED (and must NOT include):                                        |
|    x  Other domain's data (ORM data in NPA worker context)                |
|    x  Full conversation history (workers are task-focused, not chatty)    |
|    x  Routing metadata (workers don't make routing decisions)              |
+===========================================================================+

+===========================================================================+
|  REVIEWER CONTEXT CONTRACT                                                 |
|  (NPA_REVIEWER, ORM_REVIEWER, etc.)                                       |
+---------------------------------------------------------------------------+
|                                                                            |
|  REQUIRED:                                                                 |
|    - worker_output: the structured JSON the worker produced                |
|    - worker_provenance: sources and citations the worker claimed           |
|    - validation_rubric: what to check (groundedness, compliance, schema)  |
|    - policy_references: relevant SOPs for compliance checking              |
|                                                                            |
|  OPTIONAL:                                                                 |
|    - entity_data: original project data (for cross-checking worker claims)|
|    - injection_patterns: known prompt injection patterns to scan for       |
|                                                                            |
|  NOT NEEDED:                                                               |
|    x  Conversation history (reviewers validate outputs, not conversations)|
|    x  Few-shot examples (reviewers use rubrics, not examples)             |
|    x  Other worker outputs (each review is independent)                   |
+===========================================================================+
```

### 9.3 Domain-Specific Context Configurations

```yaml
# NPA Domain Context Config
NPA:
  primary_entity: "project_id"
  entity_table: "npa_projects"
  context_sources:
    - type: system_of_record
      tools: [get_npa_by_id, get_risk_checks, get_form_data, get_signoffs,
              get_workflow_state, get_external_parties, get_market_risk_factors]
      priority: 1
      freshness: real_time

    - type: bank_sops
      corpora: [bank_sops_and_policies, npa_classification_criteria]
      priority: 2
      freshness: quarterly

    - type: regulatory
      corpora: [npa_regulatory_refs]
      priority: 3
      freshness: on_publication

  scoping_fields: [project_id, jurisdiction, product_type, approval_track]
  untrusted_content: [user_free_text, uploaded_documents]

  grounding_requirements:
    must_cite:
      - classification_criteria
      - risk_thresholds
      - governance_rules
      - regulatory_obligations
      - sign_off_requirements
    citation_format: "{ doc_id, version, section }"


# ORM Domain Context Config (Phase 2)
ORM:
  primary_entity: "incident_id"
  entity_table: "orm_incidents"
  context_sources:
    - type: system_of_record
      tools: [get_incident, get_rcsa, get_kri_data, get_loss_events, get_controls]
      priority: 1
    - type: bank_sops
      corpora: [orm_policies_and_rcsa_templates]
      priority: 2
    - type: regulatory
      corpora: [basel_iii_or_guidelines]
      priority: 3
  scoping_fields: [incident_id, risk_category, control_id, business_line]
  untrusted_content: [user_free_text, external_loss_data]


# Desk Support Domain Context Config (Phase 1)
DESK:
  primary_entity: "counterparty_id"
  entity_table: "desk_counterparties"
  context_sources:
    - type: system_of_record
      tools: [get_counterparty, get_credit_limits, get_agreements, get_docs]
      priority: 1
    - type: bank_sops
      corpora: [desk_sops_and_playbooks]
      priority: 2
    - type: industry_standards
      corpora: [isda_templates_and_standards]
      priority: 3
    - type: regulatory
      corpora: [fatf_aml_kyc_refs]
      priority: 4
  scoping_fields: [counterparty_id, business_unit, product_family]
  untrusted_content: [user_free_text, retrieved_emails, attachments]
```

---

## 10. Context Scoping & Filtering

### 10.1 Scoping Dimensions

```
+=====================+=============================+===========================+
| Dimension           | How It Filters              | Enforcement Point         |
+=====================+=============================+===========================+
| Entity Scope        | Only data for project_id    | MCP tool WHERE clauses    |
|                     | 142 is retrieved            | (already implemented)     |
+---------------------+-----------------------------+---------------------------+
| Jurisdiction Scope  | Only SG regulations for     | RAG Stage 1 scoping       |
|                     | SG-based projects           | (metadata filter)         |
+---------------------+-----------------------------+---------------------------+
| Role Scope          | Analyst can't see COO-only  | Entitlement check in      |
|                     | board papers                | context assembly          |
+---------------------+-----------------------------+---------------------------+
| Time Scope          | Current data vs historical  | TTL on cached data;       |
|                     | (stale data flagged)        | freshness tags            |
+---------------------+-----------------------------+---------------------------+
| Domain Scope        | NPA agent can't access      | Tool registry access      |
|                     | ORM incident data           | control (tool-registry)   |
+---------------------+-----------------------------+---------------------------+
| Classification      | RESTRICTED data not shown   | data_classification tag   |
| Scope               | to INTERNAL-cleared agents  | vs user max clearance     |
+=====================+=============================+===========================+
```

### 10.2 Jurisdiction Scoping Rules

```
+================+================================+============================+
| Jurisdiction   | Regulatory Framework           | KB Corpora Active          |
+================+================================+============================+
| Singapore (SG) | MAS Act, MAS Notices,          | mas_notices, sfas,         |
|                | SFA, FAA, CDSA                 | sg_banking_regs            |
+----------------+--------------------------------+----------------------------+
| Hong Kong (HK) | HKMA Guidelines, SFO,          | hkma_guidelines, sfo,      |
|                | AML/CTF Ordinance              | hk_banking_regs            |
+----------------+--------------------------------+----------------------------+
| India (IN)     | RBI Master Directions,          | rbi_directions, sebi,      |
|                | SEBI Circulars, PMLA           | pmla_guidelines            |
+----------------+--------------------------------+----------------------------+
| Taiwan (TW)    | FSC Regulations,                | fsc_regulations,           |
|                | Banking Act of Taiwan          | tw_banking_act             |
+----------------+--------------------------------+----------------------------+
| Indonesia (ID) | OJK Regulations, BI            | ojk_regulations,           |
|                | Circulars                      | bi_circulars               |
+----------------+--------------------------------+----------------------------+
| Australia (AU) | APRA Prudential Standards,      | apra_standards,            |
|                | ASIC Regulatory Guides         | asic_guides                |
+================+================================+============================+

CROSS-BORDER RULE: When an NPA involves multiple jurisdictions,
ALL applicable jurisdiction corpora are included in context.
The highest-standard requirement across jurisdictions applies.
```

---

## 11. Provenance & Citations

### 11.1 Provenance Schema

Every piece of data in the context package carries a provenance tag:

```json
{
  "source_id": "SOPv3.2_NPA_Classification_Criteria",
  "source_type": "bank_sop",
  "authority_tier": 2,
  "version": "3.2",
  "effective_date": "2025-11-01",
  "expiry_date": null,
  "owner": "GFM Product Control",
  "fetched_at": "2026-03-01T09:15:00Z",
  "ttl_seconds": 86400,
  "trust_class": "TRUSTED",
  "data_classification": "INTERNAL",
  "jurisdiction": "GLOBAL",
  "doc_section": "4.2.1",
  "chunk_hash": "sha256:a1b2c3..."
}
```

### 11.2 Grounding Requirements

Certain claims MUST have citations. The agent cannot make these assertions without provenance:

```
+==========================================+===========================+
| Claim Type                               | Required Citation          |
+==========================================+===========================+
| "This NPA is classified as Variation"    | Classification criteria    |
|                                          | doc_id + scoring breakdown |
+------------------------------------------+---------------------------+
| "Risk level is HIGH"                     | Risk assessment framework  |
|                                          | + specific domain scores   |
+------------------------------------------+---------------------------+
| "Finance sign-off required within 72h"   | SLA Matrix doc_id          |
|                                          | + signoff routing rules    |
+------------------------------------------+---------------------------+
| "MAS requires stress testing for this    | MAS Notice number          |
|  product type"                           | + specific clause          |
+------------------------------------------+---------------------------+
| "This product is prohibited"             | Prohibited Items List      |
|                                          | doc_id + item reference    |
+------------------------------------------+---------------------------+
| "Credit limit is $50M"                   | SoR: npa_projects record   |
|                                          | (fetched_at timestamp)     |
+------------------------------------------+---------------------------+
| "The NPA was approved conditionally      | SoR: npa_approvals record  |
|  on 2026-02-15"                          | + conditions_imposed       |
+==========================================+===========================+
```

### 11.3 Citation Verification

The Reviewer agent checks citations against sources:

```
REVIEWER CITATION CHECK:
  1. Does the claim have a citation?       --> If NO: flag "UNGROUNDED"
  2. Does the cited source exist in KB?     --> If NO: flag "PHANTOM_CITATION"
  3. Does the source actually say this?     --> If NO: flag "MISATTRIBUTION"
  4. Is the source still current?           --> If NO: flag "STALE_SOURCE"
  5. Is the source authority sufficient?    --> If T5 used for T1 claim: flag "AUTHORITY_MISMATCH"
```

---

## 12. Context Failure Modes & Mitigations

### 12.1 Failure Mode Catalog

```
+===========================+===========================+======================+
| Failure Mode              | Banking Impact             | Mitigation           |
+===========================+===========================+======================+
| CONTEXT POISONING         | Hallucinated fact from     | Schema validation on |
|                           | Agent A enters Agent B's   | all agent outputs;   |
| A wrong fact cascades     | context, causing wrong     | citation verification|
| through agent chain       | downstream decisions       | in Reviewer agent    |
+---------------------------+---------------------------+----------------------+
| STALE CONTEXT             | Yesterday's credit limit   | TTL-based freshness  |
|                           | used for today's decision  | tags; critical data   |
| Cached data is outdated   | (limit was reduced)        | always fetched live   |
+---------------------------+---------------------------+----------------------+
| JURISDICTIONAL LEAKAGE    | Singapore customer PII     | Jurisdiction tagging |
|                           | appears in HK agent        | on all data elements;|
| Data from wrong region    | context (PDPA violation)   | scoping enforcement  |
| enters agent context      |                           | in assembly pipeline |
+---------------------------+---------------------------+----------------------+
| OVER-CONTEXTUALIZATION    | Agent over-anchors on old  | Relevance decay      |
|                           | classification decision,   | scoring; older turns |
| Too much history causes   | ignoring new evidence      | get lower weight;    |
| anchoring bias            |                           | summary compression  |
+---------------------------+---------------------------+----------------------+
| CONTEXT STARVATION        | Agent makes decision       | Required-fields      |
|                           | without critical policy    | check in contract;   |
| Missing data not detected | reference (compliance gap) | fail-fast if missing |
+---------------------------+---------------------------+----------------------+
| PRIVILEGE ESCALATION      | Junior analyst's agent     | Role-based context   |
|                           | sees senior-only board     | filtering; RBAC in   |
| User sees data above      | papers via agent context   | assembly pipeline    |
| their clearance           |                           |                      |
+---------------------------+---------------------------+----------------------+
| CONTEXT WINDOW OVERFLOW   | Critical regulatory ref    | Priority-based       |
|                           | gets truncated because     | budget allocation;   |
| Important data pushed out | conversation history was   | overflow strategy    |
| by lower-priority content | too long                   | compresses low-prio  |
+---------------------------+---------------------------+----------------------+
| SOURCE CONFLICT           | Two SOPs give different    | Source ranking;       |
|                           | answers about the same     | conflict resolution  |
| Two authoritative sources | requirement                | rules; newer wins;   |
| disagree                  |                           | flag for human       |
+===========================+===========================+======================+
```

### 12.2 Circuit Breakers

```
CONTEXT PIPELINE CIRCUIT BREAKERS:

1. EMPTY ENTITY DATA:
   If MCP tool returns no data for entity_id --> FAIL FAST
   Response: "I cannot find project NPA-2026-00142. Please verify the ID."
   DO NOT: Proceed with empty context and guess.

2. ALL KB RETRIEVAL FAILS:
   If RAG pipeline returns 0 results --> WARN + PROCEED WITH CAUTION
   Response: Include warning in context: "No relevant KB documents found.
   Agent should explicitly state when making claims without documentary support."

3. STALE CRITICAL DATA:
   If entity data older than TTL --> RE-FETCH
   If re-fetch also fails --> FAIL WITH EXPLANATION
   Response: "Unable to retrieve current data for this project. Please try again."

4. BUDGET OVERFLOW (even after compression):
   If context still exceeds budget after all overflow steps --> TRUNCATE + WARN
   Response: Include warning: "Context was truncated due to size.
   Some historical information may be missing."

5. TRUST VIOLATION:
   If untrusted content contains instruction-like patterns --> QUARANTINE
   Response: Flag content as quarantined, present to agent as data only,
   add explicit trust boundary marker in context.
```

---

## 13. Observability & Metrics

### 13.1 Context Pipeline Metrics

```
+================================+================+==========================+
| Metric                         | Target         | Alert Threshold          |
+================================+================+==========================+
| context_assembly_latency_p95   | < 500ms        | > 1000ms                 |
| context_assembly_latency_p99   | < 1000ms       | > 2000ms                 |
+--------------------------------+----------------+--------------------------+
| rag_retrieval_latency_p95      | < 300ms        | > 600ms                  |
| rag_retrieval_hit_rate         | > 85%          | < 70%                    |
| rag_reranker_improvement       | > 20%          | < 10% (reranker failing) |
+--------------------------------+----------------+--------------------------+
| mcp_tool_latency_p95           | < 200ms        | > 500ms                  |
| mcp_tool_error_rate            | < 1%           | > 5%                     |
+--------------------------------+----------------+--------------------------+
| context_budget_utilization     | 40-80%         | > 90% (overflow risk)    |
| overflow_events_per_hour       | < 5            | > 20                     |
+--------------------------------+----------------+--------------------------+
| stale_data_incidents           | 0              | > 0                      |
| trust_violations_per_hour      | 0              | > 0 (investigate)        |
| jurisdiction_leakage_events    | 0              | > 0 (critical alert)     |
+--------------------------------+----------------+--------------------------+
| source_conflict_rate           | < 2%           | > 5%                     |
| ungrounded_claim_rate          | < 5%           | > 10%                    |
| citation_verification_pass     | > 95%          | < 90%                    |
+================================+================+==========================+
```

### 13.2 Context Trace Format

Every context assembly is logged as a trace:

```json
{
  "trace_id": "ctx-2026-03-01-09-15-00-142",
  "timestamp": "2026-03-01T09:15:00.234Z",
  "agent_id": "RISK",
  "domain": "NPA",
  "entity_id": 142,
  "user_id": "sarah.lim",
  "pipeline_stages": {
    "classify": { "duration_ms": 12, "result": { "domain": "NPA", "sensitivity": "CONFIDENTIAL" } },
    "scope": { "duration_ms": 8, "filters": { "project_id": 142, "jurisdiction": "SG" } },
    "retrieve": {
      "entity_data": { "duration_ms": 145, "tools_called": 5, "records_fetched": 23 },
      "knowledge": { "duration_ms": 234, "query": "...", "initial_results": 40, "reranked_results": 8 },
      "memory": { "duration_ms": 18, "turns_loaded": 8, "cross_agent_results": 1 }
    },
    "rank": { "duration_ms": 5, "conflicts_detected": 0 },
    "budget": { "duration_ms": 3, "total_tokens": 40500, "overflow": false },
    "assemble": { "duration_ms": 15 },
    "tag": { "duration_ms": 8, "sources_tagged": 14 }
  },
  "total_duration_ms": 448,
  "context_package_size_tokens": 40500,
  "sources_used": [
    { "id": "SoR:npa_projects:142", "tier": 1, "tokens": 1200 },
    { "id": "KB:GFM_SOP_v3.2:4.2.1", "tier": 2, "tokens": 1800 },
    { "id": "KB:MAS_637_2024:12.3", "tier": 3, "tokens": 1500 }
  ]
}
```

---

## 14. UI Management Layer

### 14.1 Context Engineering Admin Dashboard

The UI provides visibility and management for the context engineering pipeline:

```
+============================================================================+
|                  CONTEXT ENGINEERING ADMIN DASHBOARD                         |
+============================================================================+
|                                                                              |
|  [TAB 1: PIPELINE HEALTH]                                                   |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Assembly Latency (p95)    RAG Hit Rate       MCP Tool Health           | |
|  |  +-----------+             +-----------+      +-----------+             | |
|  |  |   312ms   |  OK         |   91.2%   | OK   |  77/78 OK |  1 WARN    | |
|  |  +-----------+             +-----------+      +-----------+             | |
|  |                                                                          | |
|  |  Context Budget Usage      Overflow Events    Trust Violations          | |
|  |  +-----------+             +-----------+      +-----------+             | |
|  |  | avg: 52%  |  OK         |    2/hr   | OK   |     0     |  OK        | |
|  |  +-----------+             +-----------+      +-----------+             | |
|  |                                                                          | |
|  |  [CHART: Assembly latency over last 24h -- line chart]                  | |
|  |  [CHART: Token budget utilization by agent -- bar chart]                | |
|  |  [CHART: RAG retrieval quality scores -- scatter plot]                  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [TAB 2: SOURCE REGISTRY]                                                   |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Corpus Name               | Authority | Status  | Last Sync | Domains  | |
|  |  --------------------------+-----------+---------+-----------+--------  | |
|  |  bank_sops_and_policies    | HIGHEST   | ACTIVE  | 2h ago    | ALL      | |
|  |  npa_classification_crit   | HIGH      | ACTIVE  | 2h ago    | NPA      | |
|  |  npa_regulatory_refs       | HIGH      | ACTIVE  | 1d ago    | NPA      | |
|  |  isda_templates            | HIGH      | ACTIVE  | 7d ago    | DESK,DCE | |
|  |  basel_iii_guidelines      | HIGH      | STAGED  | 14d ago   | ORM      | |
|  |                                                                          | |
|  |  [+ Add Corpus] [Sync All] [View Sync History]                          | |
|  |                                                                          | |
|  |  Selected Corpus Details:                                                | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Name: bank_sops_and_policies                                      |  | |
|  |  | Documents: 42 | Chunks: 1,847 | Avg chunk: 780 tokens            |  | |
|  |  | Authority: HIGHEST | Domains: ALL                                |  | |
|  |  | Chunking: by_procedure_step (SOPs) / by_clause (legal)           |  | |
|  |  | Metadata: doc_id, version, effective_date, owner, classification |  | |
|  |  | Last full sync: 2026-02-28 03:00 UTC                             |  | |
|  |  | [Re-sync] [Edit Metadata] [View Documents] [Audit Log]           |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [TAB 3: CONTEXT CONTRACTS]                                                 |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Agent              | Archetype     | Contract    | Status  | Coverage  | |
|  |  --------------------+---------------+-------------+---------+---------  | |
|  |  MASTER_COO          | Orchestrator  | v1.0.0      | ACTIVE  | 100%     | |
|  |  NPA_ORCHESTRATOR    | Orchestrator  | v1.0.0      | ACTIVE  | 100%     | |
|  |  RISK                | Worker        | v1.1.0      | ACTIVE  | 95%      | |
|  |  CLASSIFIER          | Worker        | v1.0.0      | ACTIVE  | 100%     | |
|  |  GOVERNANCE          | Worker        | v1.0.0      | ACTIVE  | 88%      | |
|  |  NPA_REVIEWER        | Reviewer      | v0.9.0      | DRAFT   | --       | |
|  |                                                                          | |
|  |  Selected Contract: RISK v1.1.0                                          | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Required Sources:                                                  |  | |
|  |  |   [x] get_npa_by_id        (SoR, T1)  avg: 45ms                  |  | |
|  |  |   [x] get_risk_checks      (SoR, T1)  avg: 32ms                  |  | |
|  |  |   [x] get_form_data        (SoR, T1)  avg: 67ms                  |  | |
|  |  |   [x] get_external_parties (SoR, T1)  avg: 28ms                  |  | |
|  |  |   [x] GFM_SOP_Summary      (SOP, T2)  hit rate: 94%              |  | |
|  |  |   [x] MAS_Notices          (Reg, T3)  hit rate: 87%              |  | |
|  |  |   [ ] Risk_Agent_KB        (SOP, T2)  hit rate: 78% [WARN]       |  | |
|  |  |                                                                    |  | |
|  |  | Grounding Requirements: 5 claim types must be cited                |  | |
|  |  | Budget: avg 40.5K tokens (32% of 128K)                            |  | |
|  |  | [Edit Contract] [View History] [Run Validation]                    |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [TAB 4: TRUST & SCOPING]                                                   |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Trust Classification Rules:                                             | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Source Type          | Trust Class | Rule                          |  | |
|  |  | --------------------+-------------+-------------------------------  |  | |
|  |  | MCP tool results    | TRUSTED     | Always (bank-owned data)      |  | |
|  |  | Bank SOPs from KB   | TRUSTED     | If version-controlled         |  | |
|  |  | User free text      | UNTRUSTED   | Treat as data, not instr.     |  | |
|  |  | Uploaded documents  | UNTRUSTED   | Until validated by agent      |  | |
|  |  | External APIs       | UNTRUSTED   | Unless in trusted API list    |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  |  Jurisdiction Scoping:                                                   | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Jurisdiction | Active Corpora | Active Projects | Data Isolation  |  | |
|  |  | SG           | 4 corpora      | 23 projects     | ENFORCED        |  | |
|  |  | HK           | 3 corpora      | 12 projects     | ENFORCED        |  | |
|  |  | IN           | 3 corpora      | 8 projects      | ENFORCED        |  | |
|  |  | TW           | 2 corpora      | 5 projects      | ENFORCED        |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [TAB 5: CONTEXT TRACES]                                                    |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Search: [agent:RISK project:142 _______________] [Last 24h v] [Search] | |
|  |                                                                          | |
|  |  Time       | Agent  | Entity | Tokens | Latency | Sources | Status     | |
|  |  -----------+--------+--------+--------+---------+---------+----------  | |
|  |  09:15:00   | RISK   | 142    | 40.5K  | 448ms   | 14      | OK         | |
|  |  09:14:55   | NPA_OR | 142    | 22.1K  | 312ms   | 8       | OK         | |
|  |  09:14:50   | MASTER | 142    | 15.3K  | 201ms   | 5       | OK         | |
|  |  09:12:30   | CLASS  | 137    | 35.2K  | 523ms   | 11      | OVERFLOW   | |
|  |  09:10:15   | IDEAT  | --     | 8.7K   | 167ms   | 3       | OK         | |
|  |                                                                          | |
|  |  Selected Trace: ctx-2026-03-01-09-15-00-142                             | |
|  |  [Full pipeline breakdown, source list, budget report, provenance tags]  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
|  [TAB 6: CONTEXT QUALITY]                                                   |
|  +------------------------------------------------------------------------+ |
|  |                                                                          | |
|  |  Grounding Score (last 7 days):                                          | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Agent     | Claims | Grounded | Ungrounded | Phantom | Score      |  | |
|  |  | ----------+--------+----------+------------+---------+----------  |  | |
|  |  | RISK      | 342    | 328      | 12         | 2       | 95.9%      |  | |
|  |  | CLASSIF   | 218    | 211      | 7          | 0       | 96.8%      |  | |
|  |  | GOVERN    | 156    | 144      | 10         | 2       | 92.3%      |  | |
|  |  | AUTOFILL  | 890    | 872      | 18         | 0       | 98.0%      |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  |  Source Authority Compliance:                                            | |
|  |  +-------------------------------------------------------------------+  | |
|  |  | Check                        | Pass Rate | Target | Status        |  | |
|  |  | SoR data fetched (not guess) | 99.2%     | 100%   | WARN          |  | |
|  |  | SOP citations valid          | 97.1%     | 95%    | OK            |  | |
|  |  | Regulatory refs current      | 94.8%     | 95%    | WARN          |  | |
|  |  | No T5 sources for decisions  | 100%      | 100%   | OK            |  | |
|  |  +-------------------------------------------------------------------+  | |
|  |                                                                          | |
|  +------------------------------------------------------------------------+ |
|                                                                              |
+============================================================================+
```

### 14.2 User-Facing Context Visibility

End users see a simplified view of context provenance in the chat interface:

```
+============================================================================+
|  CHAT INTERFACE -- Source Citations (User View)                              |
+============================================================================+
|                                                                              |
|  Agent: Based on my assessment, this NPA is classified as "Variation"       |
|  with a complexity score of 12/20.                                          |
|                                                                              |
|  The classification is based on:                                             |
|  - Product type: FX Options (existing asset class)                          |
|  - Payout: Standard European vanilla (no exotic features)                   |
|  - Distribution: Institutional only                                          |
|                                                                              |
|  +--------------------------------------------------------------+          |
|  | Sources Cited                                         [v]     |          |
|  |--------------------------------------------------------------|          |
|  | [T1] NPA Project Record (NPA-2026-00142)                      |          |
|  |      Fetched: 2026-03-01 09:15 SGT | System of Record        |          |
|  |                                                               |          |
|  | [T2] GFM SOP Classification Criteria v3.2                     |          |
|  |      Section 4.2.1 "Variation Classification"                 |          |
|  |      Effective: 2025-11-01 | Bank Policy                      |          |
|  |                                                               |          |
|  | [T2] Product Taxonomy v2.1                                    |          |
|  |      Section: FX Derivatives > Options > Vanilla              |          |
|  |      Last Updated: 2025-09-15 | Bank Reference                |          |
|  +--------------------------------------------------------------+          |
|                                                                              |
+============================================================================+
```

---

## 15. Lifecycle Management

### 15.1 Context Engineering Lifecycle

```
+==========================================================================+
|                    CONTEXT ENGINEERING LIFECYCLE                           |
+==========================================================================+
|                                                                           |
|  PHASE 1: DESIGN                                                         |
|  +---------------------------------------------------------------------+ |
|  |  - Define domain context config (primary entity, sources, scoping)   | |
|  |  - Define context contracts per agent archetype                      | |
|  |  - Define trust classification rules                                  | |
|  |  - Define source priority hierarchy                                   | |
|  |  - Define grounding requirements                                      | |
|  |  - Design RAG pipeline (corpora, chunking, retrieval strategy)       | |
|  |  - Design provenance schema                                          | |
|  |                                                                       | |
|  |  Output: Context config YAML files + contract definitions            | |
|  |  Owner: AI Engineer + Domain SME                                      | |
|  |  Review: Architecture Review Board                                    | |
|  +---------------------------------------------------------------------+ |
|                              |                                            |
|                              v                                            |
|  PHASE 2: IMPLEMENT                                                       |
|  +---------------------------------------------------------------------+ |
|  |  - Build/configure MCP tools for entity data retrieval               | |
|  |  - Ingest and index KB corpora (chunking, embedding, metadata)      | |
|  |  - Implement context assembly pipeline stages                         | |
|  |  - Implement scoping filters                                          | |
|  |  - Add provenance tags to all MCP tool outputs                       | |
|  |  - Configure token budget allocation                                  | |
|  |                                                                       | |
|  |  Output: Working pipeline + tagged data sources                      | |
|  |  Owner: AI Engineer + Platform Engineer                               | |
|  |  Review: Code review + integration test                               | |
|  +---------------------------------------------------------------------+ |
|                              |                                            |
|                              v                                            |
|  PHASE 3: VALIDATE                                                        |
|  +---------------------------------------------------------------------+ |
|  |  - Run context contract validation tests                              | |
|  |    (every required source resolves correctly)                         | |
|  |  - Run grounding tests (citations verify against sources)            | |
|  |  - Run trust boundary tests (untrusted content quarantined)          | |
|  |  - Run jurisdiction scoping tests (no cross-region leakage)          | |
|  |  - Run budget overflow tests (graceful degradation)                  | |
|  |  - Run freshness tests (stale data detected and handled)             | |
|  |                                                                       | |
|  |  Output: Test results + baseline metrics                             | |
|  |  Owner: AI Engineer + QA                                              | |
|  |  Gate: All critical tests pass before promotion                       | |
|  +---------------------------------------------------------------------+ |
|                              |                                            |
|                              v                                            |
|  PHASE 4: DEPLOY                                                          |
|  +---------------------------------------------------------------------+ |
|  |  - Deploy context config to staging                                   | |
|  |  - Run canary (5% traffic for 48h)                                   | |
|  |  - Monitor pipeline health metrics                                    | |
|  |  - Monitor grounding quality scores                                   | |
|  |  - Promote to production if no regressions                           | |
|  |                                                                       | |
|  |  Output: Production deployment + monitoring baseline                 | |
|  |  Owner: Platform Engineer + SRE                                       | |
|  |  Gate: No metric regressions during canary                            | |
|  +---------------------------------------------------------------------+ |
|                              |                                            |
|                              v                                            |
|  PHASE 5: MONITOR                                                         |
|  +---------------------------------------------------------------------+ |
|  |  Continuous monitoring:                                               | |
|  |  - Pipeline health (latency, error rates, hit rates)                 | |
|  |  - Context quality (grounding scores, citation validity)             | |
|  |  - Trust violations (untrusted content misclassified)                | |
|  |  - Budget utilization (overflow frequency)                            | |
|  |  - Source freshness (stale data detection)                            | |
|  |  - Jurisdiction compliance (no cross-region leakage)                 | |
|  |                                                                       | |
|  |  Alerting: PagerDuty for critical (trust violations, jurisdiction    | |
|  |            leakage); Slack for warnings (stale data, budget overflow) | |
|  |                                                                       | |
|  |  Owner: SRE + AI Engineer (on-call rotation)                         | |
|  +---------------------------------------------------------------------+ |
|                              |                                            |
|                              v                                            |
|  PHASE 6: IMPROVE                                                         |
|  +---------------------------------------------------------------------+ |
|  |  Triggered by:                                                        | |
|  |  - New policy/SOP release --> update KB corpus, re-index             | |
|  |  - Grounding score drops below threshold --> investigate, fix         | |
|  |  - New agent added --> create context contract, wire pipeline         | |
|  |  - New domain onboarded --> full Phase 1-5 cycle                     | |
|  |  - Regulatory change --> update jurisdiction scoping rules           | |
|  |  - Budget overflow too frequent --> optimize chunking/retrieval      | |
|  |                                                                       | |
|  |  Owner: AI Engineer + Domain SME                                      | |
|  |  Cadence: Continuous (event-driven) + quarterly review               | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
+==========================================================================+
```

### 15.2 Change Management

```
+==========================================================================+
| CHANGE TYPE                | IMPACT     | PROCESS                        |
+==========================================================================+
| New KB document added      | LOW        | Ingest, index, tag metadata,   |
| to existing corpus         |            | verify in RAG results          |
+----------------------------+------------+--------------------------------+
| New KB corpus created      | MEDIUM     | Define authority, chunking,    |
|                            |            | metadata requirements; update  |
|                            |            | corpora registry; validate     |
+----------------------------+------------+--------------------------------+
| Source priority changed    | HIGH       | Architecture review required;  |
|                            |            | update source-priority.yaml;   |
|                            |            | re-run all grounding tests     |
+----------------------------+------------+--------------------------------+
| New agent context contract | MEDIUM     | Define contract; implement     |
| created                    |            | pipeline stage; validate       |
+----------------------------+------------+--------------------------------+
| Trust classification rule  | HIGH       | Security review required;      |
| changed                    |            | update trust-classification;   |
|                            |            | audit all active contexts      |
+----------------------------+------------+--------------------------------+
| Jurisdiction added         | HIGH       | Identify regulatory corpora;   |
|                            |            | update scoping rules; legal    |
|                            |            | review; validate isolation     |
+----------------------------+------------+--------------------------------+
| Token budget reallocation  | MEDIUM     | Update budget config;          |
|                            |            | test overflow scenarios;       |
|                            |            | monitor utilization 48h        |
+----------------------------+------------+--------------------------------+
| New domain onboarded       | CRITICAL   | Full lifecycle (Phase 1-5);    |
| (e.g., ORM, DESK)         |            | domain SME engagement;         |
|                            |            | architecture review            |
+==========================================================================+
```

---

## 16. Implementation File Map

### 16.1 Directory Structure

```
shared/context-engineering/
|
+-- context-config.yaml                    # Master: domain configs, entity types
+-- source-priority.yaml                   # 5-tier source authority hierarchy
+-- trust-classification.yaml              # Trusted vs untrusted classification rules
+-- data-classification.yaml               # PUBLIC / INTERNAL / CONFIDENTIAL / RESTRICTED
+-- grounding-requirements.yaml            # Which claims must have citations
+-- provenance-schema.json                 # Standard provenance tag structure
|
+-- domains/
|   +-- npa-context.yaml                   # NPA: primary entity, sources, scoping, trust
|   +-- orm-context.yaml                   # ORM: (Phase 2)
|   +-- dce-context.yaml                   # DCE: (Phase 3)
|   +-- desk-context.yaml                  # Desk: (Phase 1 -- simplest)
|   +-- platform-context.yaml              # Cross-domain: user identity, session rules
|
+-- contracts/
|   +-- orchestrator-contract.yaml         # What orchestrators need in context
|   +-- worker-contract.yaml               # What workers need in context
|   +-- reviewer-contract.yaml             # What reviewers need in context
|   +-- npa-risk-contract.yaml             # NPA RISK agent specific contract
|   +-- npa-classifier-contract.yaml       # NPA CLASSIFIER agent specific contract
|   +-- (... one per agent with custom needs)
|
+-- rag/
|   +-- rag-config.yaml                    # Retrieval pipeline configuration
|   +-- chunking-strategies.yaml           # Per-document-type chunking rules
|   +-- corpora-registry.yaml              # All registered knowledge corpora
|   +-- reranker-config.yaml               # Cross-encoder reranker settings
|
+-- scoping/
|   +-- domain-scoping-rules.yaml          # How entity IDs filter data per domain
|   +-- jurisdiction-scoping.yaml          # Jurisdiction-to-corpora mapping
|   +-- entitlement-context.yaml           # Role-based data classification access
|
+-- memory/
|   +-- session-state-schema.json          # Conversation state machine definition
|   +-- delegation-context.json            # What context passes during agent delegation
|   +-- budget-allocation.yaml             # Token budget allocation per agent archetype
|   +-- overflow-strategy.yaml             # What to compress when budget exceeded
|
+-- observability/
|   +-- metrics-config.yaml                # Metric definitions, targets, alert thresholds
|   +-- trace-schema.json                  # Context trace format (for logging)
|   +-- dashboard-config.yaml              # Admin dashboard widget configuration
|
+-- tests/
    +-- contract-validation/               # Tests: do all required sources resolve?
    +-- grounding-tests/                   # Tests: do citations verify?
    +-- trust-boundary-tests/              # Tests: is untrusted content quarantined?
    +-- jurisdiction-tests/                # Tests: no cross-region leakage?
    +-- budget-overflow-tests/             # Tests: graceful degradation?
    +-- freshness-tests/                   # Tests: stale data detected?
```

### 16.2 Mapping to Existing Codebase

```
+=================================+==================================+============+
| Component                       | Current Location                 | Status     |
+=================================+==================================+============+
| Entity data retrieval           | server/mcp-python/tools/*.py     | IMPLEMENTED|
|                                 | (78 tools, 21 modules)           | (NPA only) |
+---------------------------------+----------------------------------+------------+
| RAG / KB search                 | server/mcp-python/tools/         | PARTIAL    |
|                                 |   kb_search.py (3 tools)         | (no rerank)|
+---------------------------------+----------------------------------+------------+
| Session memory                  | src/app/services/                | IMPLEMENTED|
|                                 |   chat-session.service.ts        | (signals)  |
+---------------------------------+----------------------------------+------------+
| Multi-agent conversation state  | src/app/services/dify/           | IMPLEMENTED|
|                                 |   dify.service.ts                | (per-agent)|
+---------------------------------+----------------------------------+------------+
| Agent registry                  | shared/agent-registry.json       | PARTIAL    |
|                                 |                                  | (no domain)|
+---------------------------------+----------------------------------+------------+
| Trust classification            | (inline in Dify prompts)         | SCATTERED  |
+---------------------------------+----------------------------------+------------+
| Source priority                  | (implicit in prompts)            | MISSING    |
+---------------------------------+----------------------------------+------------+
| Provenance tags on MCP tools    | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Context assembly engine         | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Token budget management         | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Context contracts               | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Context tracing/observability   | npa_audit_log (partial)          | PARTIAL    |
+---------------------------------+----------------------------------+------------+
| Grounding verification          | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Jurisdiction scoping            | (ad-hoc in tools)                | PARTIAL    |
+---------------------------------+----------------------------------+------------+
| KB corpora registry             | Context/Dify_KB_Docs/ (files)    | PARTIAL    |
|                                 | Context/Dify_Agent_KBs/ (files)  | (no reg.)  |
+---------------------------------+----------------------------------+------------+
| Entitlement-based filtering     | server/middleware/auth.js (JWT)   | PARTIAL    |
|                                 |                                  | (no inject)|
+---------------------------------+----------------------------------+------------+
| Admin Dashboard UI              | (not implemented)                | MISSING    |
+---------------------------------+----------------------------------+------------+
| Context quality metrics         | (not implemented)                | MISSING    |
+=================================+==================================+============+
```

---

## 17. Current State vs Target State

### 17.1 Maturity Assessment

```
+=================================+===========+===========+===================+
| Capability                      | Current   | Target    | Gap               |
+=================================+===========+===========+===================+
| Entity data retrieval           | 80%       | 95%       | Add provenance    |
|                                 |           |           | tags to all tools |
+---------------------------------+-----------+-----------+-------------------+
| RAG pipeline                    | 30%       | 90%       | 2-stage retrieval,|
|                                 |           |           | reranking, scope  |
+---------------------------------+-----------+-----------+-------------------+
| Session memory                  | 85%       | 95%       | Formalize state   |
|                                 |           |           | machine schema    |
+---------------------------------+-----------+-----------+-------------------+
| Trust classification            | 10%       | 90%       | Extract from      |
|                                 |           |           | prompts to config |
+---------------------------------+-----------+-----------+-------------------+
| Source priority                  | 5%        | 90%       | Define + enforce  |
|                                 |           |           | 5-tier hierarchy  |
+---------------------------------+-----------+-----------+-------------------+
| Context contracts               | 0%        | 90%       | Build from scratch|
+---------------------------------+-----------+-----------+-------------------+
| Token budget management         | 0%        | 85%       | Build from scratch|
+---------------------------------+-----------+-----------+-------------------+
| Provenance / citations          | 15%       | 90%       | Add to all tools, |
|                                 |           |           | verify in Reviewer|
+---------------------------------+-----------+-----------+-------------------+
| Jurisdiction scoping            | 20%       | 90%       | Formalize rules,  |
|                                 |           |           | enforce isolation  |
+---------------------------------+-----------+-----------+-------------------+
| Context observability           | 10%       | 80%       | Tracing, metrics, |
|                                 |           |           | admin dashboard    |
+---------------------------------+-----------+-----------+-------------------+
| Multi-domain support            | 0%        | 70%       | NPA template then |
|                                 |           |           | ORM, DCE, Desk    |
+---------------------------------+-----------+-----------+-------------------+
| OVERALL MATURITY                | ~25%      | ~88%      |                   |
+=================================+===========+===========+===================+
```

### 17.2 Implementation Priority

```
PRIORITY 1 (Weeks 1-2): Foundation
  [ ] Source priority hierarchy (source-priority.yaml)
  [ ] Trust classification rules (trust-classification.yaml)
  [ ] NPA domain context config (domains/npa-context.yaml)
  [ ] Context contracts for orchestrator/worker/reviewer
  [ ] Provenance schema definition

PRIORITY 2 (Weeks 2-3): Data Layer
  [ ] Add provenance tags to all 78 MCP tool outputs
  [ ] Implement context scoping in all NPA tools
  [ ] Create user_context.py platform tool
  [ ] Formalize session state machine schema
  [ ] Formalize delegation context schema

PRIORITY 3 (Weeks 3-4): RAG Enhancement
  [ ] Design 2-stage retrieval pipeline
  [ ] Create corpora registry (corpora-registry.yaml)
  [ ] Define chunking strategies per document type
  [ ] Configure reranking pipeline
  [ ] Map existing KB assets to corpora

PRIORITY 4 (Weeks 4-5): Assembly & Budget
  [ ] Implement context assembly pipeline (7 stages)
  [ ] Implement token budget allocation
  [ ] Implement overflow strategy
  [ ] Build context tracing (log every assembly)

PRIORITY 5 (Weeks 5-6): Observability & Quality
  [ ] Define and instrument pipeline metrics
  [ ] Build context quality scoring (grounding, citation validity)
  [ ] Build admin dashboard (Tab 1-6)
  [ ] Set up alerting (trust violations, jurisdiction leakage)

PRIORITY 6 (Week 6+): Validation & Multi-Domain
  [ ] Run full validation test suite
  [ ] Create domain onboarding playbook
  [ ] Scaffold Desk Support context config (simplest domain)
  [ ] Scaffold ORM context config
```

---

## 18. Tech Stack x Phase Mapping

### 18.1 Current Tech Stack (Pinned Versions)

```
+=========================================================================================+
|                           CURRENT PRODUCTION STACK                                       |
+=========================================================================================+
|                                                                                          |
|  RUNTIME                                                                                 |
|  +-------------------------------------------------------------------------------------+ |
|  | Node.js          : v25.2.1        (server runtime)                                  | |
|  | Python           : 3.9.6          (MCP tools runtime)                               | |
|  | Angular CLI      : ^20.0.0        (frontend framework)                              | |
|  | TypeScript       : ~5.9.2         (language)                                        | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
|  BACKEND (Express.js API Gateway -- server/)                                             |
|  +-------------------------------------------------------------------------------------+ |
|  | express           : ^5.2.1        (HTTP framework -- v5 with async router)          | |
|  | mysql2            : ^3.16.3       (MariaDB driver -- connection pooling)            | |
|  | jsonwebtoken      : ^9.0.3        (JWT auth)                                       | |
|  | helmet            : ^8.0.0        (HTTP security headers)                           | |
|  | cors              : ^2.8.6        (CORS middleware)                                 | |
|  | express-rate-limit: ^7.5.0        (API rate limiting)                               | |
|  | axios             : ^1.7.9        (HTTP client -- Dify API calls)                   | |
|  | zod               : ^4.3.6        (schema validation)                               | |
|  | multer            : ^2.0.2        (file upload handling)                            | |
|  | pdf-parse         : ^1.1.1        (PDF text extraction)                             | |
|  | form-data         : ^4.0.1        (multipart form builder)                          | |
|  | dotenv            : ^17.2.4       (environment config)                              | |
|  | nodemon           : ^3.1.9        (dev server -- devDependency)                     | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
|  MCP TOOLS (Python -- server/mcp-python/)                                                |
|  +-------------------------------------------------------------------------------------+ |
|  | mcp               : 1.26.0        (Model Context Protocol SDK)                      | |
|  | fastapi           : 0.128.7       (REST API for tool registration)                  | |
|  | uvicorn           : 0.40.0        (ASGI server)                                     | |
|  | pydantic          : 2.12.5        (schema validation)                               | |
|  | aiomysql          : 0.3.2         (async MySQL/MariaDB driver)                      | |
|  | PyMySQL           : 1.1.2         (sync MySQL driver -- fallback)                   | |
|  | cryptography      : 46.0.5        (SSL/TLS for DB connections)                      | |
|  | httpx-sse         : 0.4.3         (SSE client for Dify streaming)                   | |
|  | sse-starlette     : 3.2.0         (SSE server for tool streaming)                   | |
|  | python-dotenv     : 1.2.1         (environment config)                              | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
|  FRONTEND (Angular -- src/)                                                              |
|  +-------------------------------------------------------------------------------------+ |
|  | @angular/core     : ^20.0.0       (framework)                                       | |
|  | tailwindcss       : ^3.4.19       (utility-first CSS)                               | |
|  | rxjs              : ~7.8.0        (reactive streams)                                | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
|  DATA                                                                                    |
|  +-------------------------------------------------------------------------------------+ |
|  | MariaDB           : 10.6.x        (primary database -- 43 tables)                   | |
|  | Dify Cloud        : Latest         (agent runtime + KB vector store)                 | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
|  AI / LLM                                                                                |
|  +-------------------------------------------------------------------------------------+ |
|  | Dify Workflows    : Cloud-hosted   (workflow execution)                              | |
|  | Dify Chat Apps    : Cloud-hosted   (conversational agents)                           | |
|  | Dify Knowledge    : Cloud-hosted   (vector embeddings + full-text index)             | |
|  | LLM Backend       : via Dify       (GPT-4o / Claude 3.5 -- Dify-managed)            | |
|  +-------------------------------------------------------------------------------------+ |
|                                                                                          |
+=========================================================================================+
```

### 18.2 Tech Stack Evolution by Phase

Each implementation phase introduces new components or upgrades existing ones. This matrix shows exactly WHAT is added WHEN.

```
+=========================================================================================+
|                                                                                          |
|  PHASE 0 (COMPLETED): P0 Code Audit Fixes                                               |
|  Duration: 1 week | Status: DONE                                                        |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version | What Changed                         | |
|  | --------- | ---------------------- | ------- | ------------------------------------ | |
|  | Server    | envelope-parser.js     | NEW     | Canonical parser (was inline x3)     | |
|  | Server    | sse-collector.js       | NEW     | SSE stream collector (was inline)    | |
|  | Server    | transaction-wrapper.js | NEW     | withTransaction/withLockedRow        | |
|  | Server    | async-handler.js       | NEW     | asyncHandler middleware              | |
|  | Server    | error-handler.js       | NEW     | AppError + centralized error MW      | |
|  | Server    | 5 config JSON files    | NEW     | Externalized business rules          | |
|  | Server    | db/migrations.js       | NEW     | Extracted from index.js              | |
|  | Test      | node:test (built-in)   | v25.2.1 | 98 unit tests, 0 new dependencies   | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: 574 lines removed from monoliths, 4 new services, 98 tests                      |
|  | Stack impact: ZERO new dependencies. All Node.js built-in.                            |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 1 (Weeks 1-2): Context Foundation                                                |
|  "Define the rules before writing the code"                                              |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Config    | YAML config files      | --          | 6 YAML files defining:           | |
|  |           |   source-priority      |             |   source authority hierarchy      | |
|  |           |   trust-classification |             |   trusted vs untrusted rules     | |
|  |           |   data-classification  |             |   PUBLIC/INTERNAL/CONFID/REST    | |
|  |           |   grounding-reqs       |             |   which claims need citations    | |
|  |           |   context-config       |             |   master domain registry         | |
|  |           |   provenance-schema    |             |   provenance tag JSON schema     | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Config    | domains/npa-context    | YAML        | NPA domain: entity, sources,     | |
|  |           |                        |             |   scoping, grounding rules       | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Config    | contracts/             | YAML        | 3 archetype contracts:           | |
|  |           |   orchestrator         |             |   what orchestrators need        | |
|  |           |   worker               |             |   what workers need              | |
|  |           |   reviewer             |             |   what reviewers need            | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Shared    | agent-registry.json    | UPDATE      | Add: domain, archetype,          | |
|  |           |                        |             |   context_contract_ref per agent | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | js-yaml                | ^4.1.0      | NEW DEP: parse YAML configs      | |
|  |           |                        |             | (or use JSON -- 0 deps)          | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: ~12 config files, 1 optional new dependency                                      |
|  | Stack impact: MINIMAL. Config-only. No runtime changes.                               |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 2 (Weeks 2-3): Data Layer Provenance                                             |
|  "Tag every piece of data with where it came from"                                       |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | MCP-Py    | All 21 tool modules    | UPDATE      | Add provenance wrapper:          | |
|  |           | (78 tools)             |             |   source_id, authority_tier,     | |
|  |           |                        |             |   fetched_at, trust_class,       | |
|  |           |                        |             |   data_classification to every   | |
|  |           |                        |             |   tool response                  | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | MCP-Py    | tools/_provenance.py   | NEW         | Shared provenance decorator:     | |
|  |           |                        |             |   @with_provenance(tier=1,       | |
|  |           |                        |             |     source="SoR:npa_projects")   | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | MCP-Py    | tools/_scoping.py      | NEW         | Shared scoping middleware:       | |
|  |           |                        |             |   enforce entity_id, jurisdiction | |
|  |           |                        |             |   filtering on all queries       | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | MCP-Py    | tools/user_context.py  | NEW         | Platform tool: returns user      | |
|  |           |                        |             |   identity, role, jurisdiction,  | |
|  |           |                        |             |   entitlements, department       | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Session state machine schema     | |
|  |           |   session-state.js     |             |   (formalize delegation context) | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | DB        | Migration 018          | NEW         | Add provenance columns to        | |
|  |           |                        |             |   agent_messages: source_tier,   | |
|  |           |                        |             |   sources_cited JSON             | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: 3 new Python modules, 1 migration, updates to 21 existing modules                |
|  | Stack impact: MODERATE. No new deps. Python decorator pattern.                        |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 3 (Weeks 3-4): RAG Pipeline Enhancement                                          |
|  "Make retrieval precise, not approximately relevant"                                    |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  |           |                        |             |                                  | |
|  | OPTION A: Dify-Native RAG (RECOMMENDED for Phase 3)                                 | |
|  |                                                                                      | |
|  | Dify      | Knowledge Bases        | Cloud       | Create separate KBs per corpus:  | |
|  |           |                        |             |   bank_sops, npa_regulatory,     | |
|  |           |                        |             |   npa_classification, isda, etc  | |
|  | Dify      | Retrieval Config       | Cloud       | Per-KB settings:                 | |
|  |           |                        |             |   chunk_size, overlap, model,    | |
|  |           |                        |             |   retrieval_mode (hybrid)        | |
|  | Config    | corpora-registry.yaml  | NEW         | Maps corpus name --> Dify KB ID, | |
|  |           |                        |             |   authority, domains, metadata   | |
|  | Config    | chunking-strategies    | NEW         | Per-doc-type chunking rules      | |
|  |           |                        |             |   (applied during Dify ingest)   | |
|  | MCP-Py    | tools/kb_search.py     | UPDATE      | Add 2-stage retrieval:           | |
|  |           |                        |             |   Stage 1: metadata scope filter | |
|  |           |                        |             |   Stage 2: Dify KB query         | |
|  |           |                        |             |   + provenance tags on results   | |
|  |                                                                                      | |
|  | OPTION B: Self-Hosted RAG (Phase 3b -- if Dify limits hit)                           | |
|  |                                                                                      | |
|  | MCP-Py    | sentence-transformers  | ^3.4.0      | Embedding model (local)          | |
|  | MCP-Py    | rank-bm25              | ^0.2.2      | BM25 lexical search              | |
|  | MCP-Py    | cross-encoder          | (via s-t)   | Reranking model                  | |
|  | DB        | MariaDB full-text      | 10.6.x      | BM25 via MATCH AGAINST           | |
|  | DB        | Migration 019          | NEW         | Add embedding vectors table      | |
|  |           |                        |             |   (or use pgvector via pg_ext)   | |
|  |                                                                                      | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net (Option A): 2 config files, 1 tool update, Dify KB restructuring                  |
|  | Net (Option B): 2-3 new Python deps, 1 migration, custom pipeline                     |
|  | Stack impact: LOW (A) or MODERATE (B). Recommend A first, B if needed.                |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 4 (Weeks 4-5): Context Assembly Engine                                           |
|  "The brain that puts it all together"                                                   |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Core 7-stage pipeline engine:    | |
|  |           |   context-assembler.js |             |   classify, scope, retrieve,     | |
|  |           |                        |             |   rank, budget, assemble, tag    | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Token counting + allocation:     | |
|  |           |   token-budget.js      |             |   estimate tokens per section,   | |
|  |           |                        |             |   overflow compression, reserve  | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | gpt-tokenizer          | ^2.8.0      | NEW DEP: GPT tokenizer (tiktoken | |
|  |           | (or tiktoken)          |             |   JS port) for accurate counting | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Log every context assembly:      | |
|  |           |   context-tracer.js    |             |   stages, durations, sources,    | |
|  |           |                        |             |   budget utilization             | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Source conflict detection +      | |
|  |           |   source-ranker.js     |             |   resolution per 5-tier rules    | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | routes/dify-proxy.js   | UPDATE      | Wire context assembler before    | |
|  |           |                        |             |   every Dify API call            | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | DB        | Migration 020          | NEW         | context_traces table:            | |
|  |           |                        |             |   trace_id, agent_id, entity_id, | |
|  |           |                        |             |   tokens_used, sources JSON,     | |
|  |           |                        |             |   duration_ms, overflow_actions  | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: 4 new services, 1 new dependency, 1 migration, 1 route update                    |
|  | Stack impact: MODERATE. This is the core engine -- most new code.                     |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 5 (Weeks 5-6): Observability, Quality & Admin UI                                 |
|  "You can't improve what you can't measure"                                              |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | routes/                | NEW         | API endpoints for admin UI:      | |
|  |           |   context-admin.js     |             |   GET /context/health             | |
|  |           |                        |             |   GET /context/traces             | |
|  |           |                        |             |   GET /context/quality            | |
|  |           |                        |             |   GET /context/corpora            | |
|  |           |                        |             |   GET /context/contracts          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Server    | services/              | NEW         | Grounding quality scorer:        | |
|  |           |   grounding-scorer.js  |             |   check citations vs sources,    | |
|  |           |                        |             |   detect phantom/stale citations | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Frontend  | Angular components:    |             |                                  | |
|  |           | context-dashboard/     | NEW         | Admin dashboard (6 tabs):        | |
|  |           |   pipeline-health      |             |   health, sources, contracts,    | |
|  |           |   source-registry      |             |   trust, traces, quality         | |
|  |           |   context-contracts    |             |                                  | |
|  |           |   trust-scoping        |             |                                  | |
|  |           |   context-traces       |             |                                  | |
|  |           |   context-quality      |             |                                  | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Frontend  | @angular/cdk           | ^20.0.0     | CDK data tables for trace viewer | |
|  |           | (if not already)       |             | (may already be installed)       | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Frontend  | Chat citation panel    | UPDATE      | Add source citation collapsible  | |
|  |           | (agent-chat component) |             | in agent response bubbles        | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: 1 route file, 1 service, 6+ Angular components, 1 possible frontend dep          |
|  | Stack impact: MODERATE. Mostly UI work. Backend is read-only endpoints.               |
|                                                                                          |
+=========================================================================================+

+=========================================================================================+
|                                                                                          |
|  PHASE 6 (Week 6+): Multi-Domain Expansion                                              |
|  "NPA was the template -- now replicate for ORM, DCE, Desk"                              |
|                                                                                          |
|  CHANGES TO STACK:                                                                       |
|  +-------------------------------------------------------------------------------------+ |
|  | Layer     | Component              | Version     | Purpose                          | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Config    | domains/desk-context   | NEW (YAML)  | Desk Support domain config       | |
|  | Config    | domains/orm-context    | NEW (YAML)  | ORM domain config                | |
|  | Config    | domains/dce-context    | NEW (YAML)  | DCE domain config                | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | MCP-Py    | tools/desk_*.py        | NEW         | Desk Support entity tools        | |
|  | MCP-Py    | tools/orm_*.py         | NEW         | ORM entity tools                 | |
|  | MCP-Py    | tools/dce_*.py         | NEW         | DCE entity tools                 | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | DB        | Migrations 021-023     | NEW         | Desk, ORM, DCE table schemas     | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Dify      | New Knowledge Bases    | Cloud       | Domain-specific KB corpora       | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Dify      | New agents             | Cloud       | Domain orchestrators + workers   | |
|  | --------- | ---------------------- | ----------- | -------------------------------- | |
|  | Shared    | agent-registry.json    | UPDATE      | Register new domain agents       | |
|  +-------------------------------------------------------------------------------------+ |
|  | Net: 3 domain configs, N new tool modules, N migrations, N Dify apps                   |
|  | Stack impact: HIGH (breadth, not depth). Same patterns, new domains.                  |
|                                                                                          |
+=========================================================================================+
```

### 18.3 Dependency Summary by Phase

```
+=======================+==========+============+==========+==========+==========+==========+
|                       | Phase 0  | Phase 1    | Phase 2  | Phase 3  | Phase 4  | Phase 5  |
|                       | P0 Audit | Foundation | Data     | RAG      | Assembly | Observe  |
|=======================+==========+============+==========+==========+==========+==========+
| NEW Node.js deps      | 0        | 0 (or 1*)  | 0        | 0        | 1        | 0-1      |
| NEW Python deps       | 0        | 0          | 0        | 0-3 **   | 0        | 0        |
| NEW DB migrations     | 0        | 0          | 1        | 0-1      | 1        | 0        |
| NEW config files      | 5 JSON   | ~12 YAML   | 0        | 2 YAML   | 0        | 0        |
| NEW server services   | 4        | 0          | 1        | 0        | 4        | 2        |
| NEW Python modules    | 0        | 0          | 3        | 0-1      | 0        | 0        |
| NEW Angular components| 0        | 0          | 0        | 0        | 0        | 6+       |
| UPDATED files         | 5        | 1          | ~24      | 1-3      | 1        | 2        |
| Dify KB changes       | 0        | 0          | 0        | restructure | 0     | 0        |
| Risk level            | LOW      | ZERO       | LOW      | MEDIUM   | MEDIUM   | LOW      |
+=======================+==========+============+==========+==========+==========+==========+

* Phase 1: js-yaml is optional; can use JSON format instead (0 deps)
** Phase 3 Option B only: sentence-transformers, rank-bm25 (if self-hosting RAG)
```

### 18.4 Tech Stack Decisions Not Yet Made

These are decisions to be made during implementation:

```
+==========+================================+============================+================+
| Phase    | Decision                       | Options                    | Recommendation |
+==========+================================+============================+================+
| Phase 1  | Config format: YAML or JSON?   | A) YAML (more readable)    | JSON           |
|          |                                | B) JSON (zero deps)        | (zero deps,    |
|          |                                |                            |  already used)  |
+----------+--------------------------------+----------------------------+----------------+
| Phase 3  | RAG hosting: Dify or self?     | A) Dify-native KB          | A) Dify-native |
|          |                                | B) Self-hosted pipeline    | (start here,   |
|          |                                |                            |  migrate later  |
|          |                                |                            |  if limits hit) |
+----------+--------------------------------+----------------------------+----------------+
| Phase 3  | Reranker: Dify or custom?      | A) Dify built-in rerank    | A) Dify first  |
|          |                                | B) cross-encoder local     | (test quality,  |
|          |                                | C) Cohere Rerank API       |  upgrade if     |
|          |                                |                            |  needed)        |
+----------+--------------------------------+----------------------------+----------------+
| Phase 4  | Token counter: which lib?      | A) gpt-tokenizer (JS)     | A) gpt-        |
|          |                                | B) tiktoken (WASM)        | tokenizer      |
|          |                                | C) Estimate (chars/4)     | (accurate, pure |
|          |                                |                            |  JS, no WASM)  |
+----------+--------------------------------+----------------------------+----------------+
| Phase 4  | Context engine: where runs?    | A) Express middleware      | A) Express MW  |
|          |                                |    (before Dify proxy)     | (simplest,     |
|          |                                | B) Separate Node service   |  single deploy, |
|          |                                | C) Python sidecar          |  co-located)   |
+----------+--------------------------------+----------------------------+----------------+
| Phase 5  | Dashboard charting lib?        | A) Chart.js (lightweight)  | A) Chart.js    |
|          |                                | B) D3.js (powerful)        | (sufficient for |
|          |                                | C) ECharts                 |  admin metrics) |
+----------+--------------------------------+----------------------------+----------------+
| Phase 6  | FastAPI migration timing?      | A) After multi-domain      | A) After all   |
|          | (Express --> FastAPI)           | B) During multi-domain     |  domains stable |
|          |                                | C) Never (keep Express)    |  (less risk)   |
+==========+================================+============================+================+
```

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Context Window** | The maximum number of tokens an LLM can process in a single call (e.g., 128K for GPT-4o) |
| **Context Package** | The assembled set of data (entity, KB, memory, user context) sent to an agent |
| **Context Contract** | A specification of exactly what data an agent needs to do its job |
| **Provenance** | Metadata about where a piece of data came from (source, version, timestamp) |
| **Grounding** | Ensuring an AI claim is supported by verifiable evidence from authoritative sources |
| **SoR (System of Record)** | The authoritative database for a given data element |
| **RAG** | Retrieval-Augmented Generation -- enhancing LLM responses with retrieved documents |
| **Reranking** | A second-stage scoring pass that improves retrieval precision using a cross-encoder model |
| **Trust Classification** | Categorizing data as TRUSTED (use directly) or UNTRUSTED (treat as data only) |
| **Token Budget** | The allocation of the context window to different types of content |
| **Chunking** | Breaking large documents into smaller pieces for indexing and retrieval |
| **Corpora** | Collections of related documents indexed for retrieval (plural of corpus) |
| **Entitlement** | A user's authorization level determining what data they can access |
| **TTL (Time-To-Live)** | How long cached data remains valid before requiring re-fetch |
| **MCP (Model Context Protocol)** | The protocol used by our Python tools to provide data to AI agents |

## Appendix B: Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| Enterprise Agentic Architecture (7 Planes) | `docs/ENTERPRISE-AGENTIC-ARCHITECTURE-APAC-BANK.md` | Parent architecture; CX = Plane 2 |
| Multi-Agent Prompt Design System | `docs/prompt_design_system_deep-research-report.md` | Prompt Studio builds ON TOP of Context Engineering |
| COO Workbench Blueprint | `.claude/plans/tender-imagining-bumblebee.md` | Implementation plan; CX = Phase 1 |
| Agent Registry | `shared/agent-registry.json` | Lists all agents that consume context |
| Existing KB Documents | `Context/Dify_KB_Docs/`, `Context/Dify_Agent_KBs/` | Current knowledge corpora |
| Agent System Prompts | `Context/Dify_Agent_Prompts_v2/` | Current prompts (CO-STAR framework) |

---

*This document is the single source of truth for the Context Engineering layer of the COO Agentic Workbench. All context pipeline design decisions, configurations, and implementation guidelines should reference this document.*
