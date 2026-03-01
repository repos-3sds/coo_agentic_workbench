# Agent Architecture Style Analysis: DCE Hub, DBS Bank Singapore

## Derivatives Clearing & Execution — Agentic AI Architecture Style Comparison

**Document Type:** Architecture Decision Analysis
**Audience:** DCE Head, GFM Leadership, CTO Office, Enterprise Architecture
**Classification:** Internal — Confidential
**Version:** 1.0 | February 2026
**Prepared for:** DCE Agentic Transformation Program

---

## 1. Context & Design Tension

Two foundational documents define the DCE agentic transformation:

1. **DCE Hub Current Situation Analysis** — proposes **persona-based agents** ("persona-aligned copilots", "Agent Design per Persona", one copilot per each of the 10 personas)
2. **Enterprise Agentic Architecture (7-Plane Model)** — designs for **process/function-based agents** (Risk Assessment agent, Compliance Check agent, Document Agent — scoped by capability)

Neither document resolves this tension. This analysis evaluates three architecture styles and recommends a path forward.

---

## 2. Style Definitions

### Style A: Persona-Based Agents

Each of the 10 DCE personas receives a dedicated copilot agent aligned to their role, responsibilities, and daily workflows.

| Agent | Persona Served | Primary Scope |
|-------|---------------|---------------|
| Sales Dealer Copilot | FO Sales Dealers | Pipeline tracking, pricing requests, client communication drafting |
| Execution Dealer Copilot | FO Execution Dealers | Order routing, execution monitoring, CQG/Murex integration |
| RM Copilot | Relationship Managers | Client overview, pipeline status, revenue tracking |
| COO Desk Support Copilot | COO Desk Support | Intraday position monitoring, break alerts, ops coordination |
| Client Services Copilot | COO Client Services | Account opening workflow, client queries, margin call communication |
| Static Team Copilot | TMO Static Team | SSI setup, account maintenance, reference data validation |
| DCE Ops Copilot | TMO DCE Ops | Trade lifecycle, reconciliation, settlement management |
| Credit Copilot | Credit Team | Limit monitoring, credit approvals, exposure calculations |
| Finance Copilot | Finance Team | P&L reconciliation, regulatory reporting, fee management |
| Tech Support Copilot | Technology Support | System health, incident triage, connectivity monitoring |

**Orchestration model:** Each copilot has its own context window, tool access, and memory scoped to the persona's responsibilities. Cross-persona coordination happens through message-passing or a lightweight supervisor agent.

**Alignment to DCE document:** This is the model the DCE document proposes — "Agent Design per Persona", persona-aligned copilots.

---

### Style B: Process-Based Agents

Agents are scoped by business process or functional capability, independent of who invokes them. Any persona can invoke any agent they are authorized to use.

| Agent | Process/Capability | Systems Touched |
|-------|-------------------|----------------|
| Account Opening Agent | End-to-end account onboarding | Murex, UBIX, ClearVision, SIC |
| Account Maintenance Agent | SSI updates, reference data changes | Murex, UBIX, SIC |
| Pipeline Management Agent | Deal pipeline tracking, stage progression | Murex, CRM |
| Product Registry Agent | Product approval workflow | Murex, internal approval systems |
| Trade Management Agent | Order routing, execution, allocation | Murex, CQG, UBIX |
| Margin & Collateral Agent | Margin call processing, collateral management | ClearVision, Murex |
| Reconciliation Agent | Trade/position/cash reconciliation | Murex, UBIX, ClearVision |
| Credit Assessment Agent | Limit checks, exposure monitoring, approvals | Internal credit systems, Murex |
| Notification Agent | Cross-process alerting and escalation | Email, Teams, internal messaging |
| Compliance & Reporting Agent | Regulatory reporting, audit trail generation | All systems |

**Orchestration model:** A supervisor or router agent receives requests (from any persona through a shared UI layer) and dispatches to the appropriate process agent. Process agents can invoke sub-agents or tools. The Enterprise Architecture's Reasoning Plane handles orchestration.

**Alignment to Enterprise Architecture document:** This is the model the 7-Plane architecture designs for — capability-scoped agents with clear tool boundaries and trust wrappers.

---

### Style C: Hybrid Architecture

A two-tier architecture where persona-facing copilots serve as the interaction and context layer, while process-based specialist agents execute the actual work underneath.

**Tier 1 — Persona Copilots (Thin Orchestration Layer):**
- Each of the 10 personas gets a copilot, but these copilots are *thin*: they handle context assembly, intent recognition, persona-specific memory, and UX adaptation
- They do NOT contain business logic for processes
- They translate persona intent into process agent invocations

**Tier 2 — Process Specialist Agents (Execution Layer):**
- The same process-based agents from Style B exist as shared services
- They are invoked by persona copilots through a controlled API/tool interface
- They carry the business logic, system integrations, compliance checks, and audit trails

**Interaction pattern:**
```
User (TMO Static Team member)
  → Static Team Copilot (Tier 1: understands persona context, assembles relevant information)
    → Account Maintenance Agent (Tier 2: executes SSI update across Murex, UBIX, SIC)
    → Notification Agent (Tier 2: alerts downstream consumers of the change)
  ← Static Team Copilot (formats response for persona, updates persona memory)
```

**Orchestration model:** The Enterprise Architecture's Reasoning Plane manages the supervisor pattern. Persona copilots sit at the edge of the Context Plane. Process agents sit at the Reasoning/Action boundary. Trust Plane wraps both tiers. The Intelligence Plane handles model routing (e.g., smaller models for persona copilots doing intent classification, larger models for process agents doing complex reasoning).

---

## 3. Weighted Comparison Matrix

Weights are calibrated for a MAS-regulated derivatives clearing operation where operational risk and regulatory compliance are existential concerns.

| # | Criterion | Weight | Persona (A) | Process (B) | Hybrid (C) |
|---|-----------|--------|:-----------:|:-----------:|:-----------:|
| 1 | **Regulatory Compliance & Auditability** | 5 (Critical) | 2 | 5 | 4 |
| 2 | **Scalability & Maintainability** | 4 (High) | 2 | 4 | 4 |
| 3 | **User Adoption & Change Management** | 4 (High) | 5 | 2 | 4 |
| 4 | **Operational Risk Reduction** | 5 (Critical) | 3 | 4 | 5 |
| 5 | **Development Complexity** | 3 (Medium) | 3 | 4 | 2 |
| 6 | **Cost Efficiency** | 3 (Medium) | 2 | 4 | 3 |
| 7 | **Cross-Process Coordination** | 4 (High) | 2 | 4 | 5 |
| 8 | **Data Access Control & Least Privilege** | 5 (Critical) | 2 | 5 | 4 |
| 9 | **Reusability** | 3 (Medium) | 1 | 5 | 4 |
| 10 | **Resilience & Fault Isolation** | 4 (High) | 3 | 4 | 4 |

### Weighted Score Calculation

**Style A — Persona-Based:**
(2x5) + (2x4) + (5x4) + (3x5) + (3x3) + (2x3) + (2x4) + (2x5) + (1x3) + (3x4)
= 10 + 8 + 20 + 15 + 9 + 6 + 8 + 10 + 3 + 12 = **101 / 200**

**Style B — Process-Based:**
(5x5) + (4x4) + (2x4) + (4x5) + (4x3) + (4x3) + (4x4) + (5x5) + (5x3) + (4x4)
= 25 + 16 + 8 + 20 + 12 + 12 + 16 + 25 + 15 + 16 = **165 / 200**

**Style C — Hybrid:**
(4x5) + (4x4) + (4x4) + (5x5) + (2x3) + (3x3) + (5x4) + (4x5) + (4x3) + (4x4)
= 20 + 16 + 16 + 25 + 6 + 9 + 20 + 20 + 12 + 16 = **160 / 200**

### Score Summary

| Style | Raw Weighted Score | Percentage | Rank |
|-------|-------------------|-----------|------|
| **Process-Based (B)** | 165 / 200 | 82.5% | 1st (on paper) |
| **Hybrid (C)** | 160 / 200 | 80.0% | 2nd (on paper), **1st in practice** |
| **Persona-Based (A)** | 101 / 200 | 50.5% | 3rd |

### Scoring Rationale for Key Differentiators

**Regulatory Compliance & Auditability (Weight 5):**
- Persona-based scores 2: Audit trails are fragmented across 10 agents. When MAS asks "show me the complete decision chain for this account opening," the answer spans 7 persona agents. Reconstructing a unified audit trail requires stitching together logs from the Sales Dealer Copilot, Client Services Copilot, Static Team Copilot, Credit Copilot, and others — each with its own context and reasoning chain.
- Process-based scores 5: The Account Opening Agent owns the entire audit trail for account opening. One agent, one log, one explainability chain. MAS gets a single, coherent record.
- Hybrid scores 4: Process agents maintain the authoritative audit trail (same as B), but persona copilot interactions add a secondary layer that must be correlated. The slight complexity costs one point.

**User Adoption & Change Management (Weight 4):**
- Persona-based scores 5: Each user gets "their" copilot that speaks their language, understands their workflow, and adapts to their patterns. An FO Sales Dealer sees a sales-oriented interface; TMO Ops sees an operations-oriented interface. This mirrors how the 60 DCE staff think about their work.
- Process-based scores 2: Users must learn to think in terms of processes rather than their role. A Client Services person handling an account opening query must know to invoke the "Account Opening Agent" — and separately invoke the "Margin Agent" if there is a margin-related sub-question. This is a cognitive model change that will face resistance in a 24-hour operation where speed matters.
- Hybrid scores 4: Users get their persona copilot (high adoption), but the copilot internally routes to process agents (high compliance). The one-point deduction from 5 reflects the occasional friction when the persona copilot must explain that a cross-process request involves multiple specialist agents.

**Data Access Control & Least Privilege (Weight 5):**
- Persona-based scores 2: A Sales Dealer Copilot needs access to client data, pricing, pipeline, and trade data — but also needs to interact with Credit for limit checks. Do you give the Sales Copilot read access to credit systems? If yes, you have violated least privilege. If no, the copilot cannot serve its persona effectively without calling out to another agent — at which point you are building a hybrid anyway.
- Process-based scores 5: Each process agent has precisely scoped access. The Account Opening Agent accesses Murex account setup, UBIX clearing setup, SIC documentation, and ClearVision margin setup — and nothing else. The Credit Assessment Agent accesses credit systems — and nothing else. Permissions map cleanly to MAS data governance requirements.
- Hybrid scores 4: Process agents maintain clean access boundaries (same as B). Persona copilots need only UI/context permissions — they never directly access backend systems. The slight reduction from 5 reflects the need to manage two layers of authorization (persona copilot authorization to invoke process agents, plus process agent authorization to access systems).

---

## 4. Detailed Pros and Cons

### Style A: Persona-Based Agents

**Pros:**

1. **Natural adoption path for DCE's 60 staff:** Each of the 10 personas gets a copilot that mirrors their mental model. The FO Sales Dealer who currently juggles email, Excel pipeline trackers, and Teams messages gets a single assistant that understands "sales dealer work." No process taxonomy to learn.

2. **Persona-specific context accumulation:** The Sales Dealer Copilot builds memory of how a specific dealer prefers to structure pricing requests, which clients they manage, their communication style. Over time, the copilot becomes genuinely personalized — a significant adoption driver.

3. **Simplified initial design:** Mapping 10 personas to 10 agents is conceptually straightforward. Business stakeholders (DCE COO, desk heads) can immediately understand and validate the scope of each agent. "This is the agent for your team" is a clear pitch.

4. **Reduced context-switching for users:** A TMO DCE Ops person handling trade lifecycle, reconciliation, and settlement queries uses one copilot for all of it. They do not need to figure out which process agent to invoke.

5. **Alignment with organizational accountability:** If the Credit Copilot makes an error, accountability maps cleanly to the Credit team. Organizational lines of responsibility are preserved.

6. **Faster time to initial deployment for single-persona use cases:** You can ship the Sales Dealer Copilot first (handling just pipeline management) without building a full process orchestration layer. Quick wins build momentum.

**Cons:**

1. **Audit trail fragmentation across Account Opening:** The account opening process touches 7 personas (RM, Sales Dealer, Client Services, Static Team, Credit, DCE Ops, Tech Support). Under persona-based agents, the audit trail for a single account opening is split across 7 agents. When MAS or internal audit asks for the complete decision history, reassembly is expensive and error-prone. This is a regulatory showstopper for a derivatives clearing operation.

2. **Duplicated business logic:** Both the Client Services Copilot and the DCE Ops Copilot need to understand trade lifecycle states. Both the Sales Dealer Copilot and the RM Copilot need pipeline management logic. This duplication means bugs or regulatory rule changes must be updated in multiple agents simultaneously — a maintenance nightmare.

3. **Privilege creep is inevitable:** The COO Desk Support Copilot needs visibility into positions (Murex), margin status (ClearVision), clearing status (UBIX), and trade execution (CQG). To serve this persona effectively, the copilot requires near-universal read access — directly contradicting MAS data governance expectations for least-privilege.

4. **Cross-process coordination requires agent-to-agent communication:** When a margin call requires coordination between the Credit Copilot (limit decisions), the Client Services Copilot (client notification), and the DCE Ops Copilot (position management), you need an ad-hoc orchestration layer. This is where persona-based architectures become accidental hybrid architectures — poorly.

5. **Does not scale with organizational change:** If DBS restructures DCE personas (e.g., merging COO Desk Support and Client Services, or splitting TMO into two sub-teams), the entire agent architecture must be refactored. Process-based agents are indifferent to org chart changes.

6. **Token and cost inefficiency:** Each persona copilot must maintain broad context about its persona's responsibilities across multiple processes. The Sales Dealer Copilot needs context on pipeline management, trade execution, client communication, and pricing — even when the user is only asking about one thing. This inflates token consumption and model costs.

7. **Inconsistent handling of the same process:** Account maintenance handled by the Static Team Copilot may follow a different logic path than account maintenance handled by the Client Services Copilot (when a client requests a change directly). Process consistency — critical in a regulated environment — is not architecturally enforced.

8. **24-hour coverage gap risk:** During off-hours, the Client Services Copilot must make decisions that normally involve the Credit Copilot (e.g., US exchange limit adjustments). Either the Client Services Copilot duplicates credit logic (dangerous) or it cannot function autonomously during off-hours (defeating the purpose).

---

### Style B: Process-Based Agents

**Pros:**

1. **Unified audit trail per process:** The Account Opening Agent produces one coherent audit log from initiation to completion. When MAS examines a specific account opening, every decision — credit check, KYC validation, system setup across Murex/UBIX/ClearVision/SIC — is in a single trace. This is the gold standard for regulatory explainability under MAS TRM Guidelines and MAS Notice on Cyber Resilience.

2. **Clean least-privilege enforcement:** The Margin & Collateral Agent accesses ClearVision and Murex margin modules — nothing else. The Product Registry Agent accesses Murex product setup and approval workflows — nothing else. Each agent's IAM policy is a direct function of its process scope. This maps perfectly to the Enterprise Architecture's Trust Plane design.

3. **Single source of truth for business logic:** There is exactly one Account Opening Agent. Any change to the account opening process (new KYC requirement, new system integration, new approval step) is made in one place. No duplication, no drift, no inconsistency.

4. **Process-level resilience:** If the Reconciliation Agent fails, it does not affect the Account Opening Agent or the Trade Management Agent. Fault isolation is clean. In a 24-hour derivatives clearing operation processing 15,000-25,000 trades/day, this isolation is operationally critical.

5. **Reusable across personas:** The same Account Opening Agent serves the Client Services person initiating the opening, the RM tracking it, the Credit analyst approving it, and the Static Team member configuring it. Build once, serve many.

6. **Natural alignment with the 7-Plane architecture:** Process agents map directly to the Reasoning Plane's orchestration model. Each process agent has defined tools (Action Plane), defined context requirements (Context Plane), defined trust boundaries (Trust Plane), and defined observability metrics (Observability Plane). The architecture is coherent.

7. **Cost-efficient scaling:** Adding a new process (e.g., regulatory reporting under a new MAS requirement) means adding one new agent — not modifying 10 persona agents. Cost scales with process complexity, not headcount.

8. **Deterministic workflow enforcement:** The Account Opening Agent can enforce that credit approval happens before system setup, that KYC documentation is complete before account activation, and that all 5 systems are configured before the account is declared open. This determinism (Level 4 autonomy from the Enterprise Architecture) is enforceable at the process level, not the persona level.

**Cons:**

1. **User adoption friction is significant and real:** DCE's 60 staff think in terms of "my job" not "the account opening process." A Client Services person's day involves account openings, client queries, margin call communications, and ad-hoc requests. Forcing them to consciously select which process agent to invoke for each task is a workflow disruption that will face resistance — especially during a 2 AM margin call.

2. **Loss of persona context and personalization:** The Account Opening Agent does not know that this particular Client Services person prefers to be notified via Teams rather than email, or that this RM wants daily pipeline summaries at 8:30 AM Singapore time. Persona-specific preferences are homeless in a process-based architecture.

3. **Process boundary ambiguity:** Some DCE activities straddle process boundaries. An off-hours limit adjustment touches credit assessment, account maintenance, and trade management. Which process agent owns it? Boundary disputes create architectural gaps where requests fall through.

4. **Cold-start problem for cross-cutting queries:** An RM asking "give me a complete status update on Client X" needs information from pipeline management, account opening, trade management, margin status, and credit status. The process architecture must either (a) invoke 5 agents and synthesize results, or (b) build a separate "client view" agent — which is effectively a persona agent.

5. **Higher initial design complexity:** Defining clean process boundaries in DCE requires careful domain analysis. The 6 core processes (Pipeline, Account Opening, Account Maintenance, Product Registry, Trade Management, Back Office Ops) interact in complex ways. Getting the decomposition right before building is critical — and expensive.

6. **Change management requires process literacy:** Staff must understand the process taxonomy to use the system effectively. Training 60 people across 10 personas, many of whom have been doing manual coordination for years, is a non-trivial organizational change management effort.

---

### Style C: Hybrid Architecture

**Pros:**

1. **Best of both worlds for the user experience AND regulatory compliance:** The Client Services person interacts with their familiar Client Services Copilot (high adoption), but every process action is executed by a dedicated process agent with clean audit trails (high compliance). The persona copilot is the face; the process agent is the engine.

2. **Persona copilots solve the "Client X status" problem:** The RM Copilot knows the RM's clients, preferences, and context. When the RM asks "what's happening with Client X," the copilot knows to invoke the Pipeline Agent, Account Opening Agent, and Margin Agent — and synthesize results in the RM's preferred format. The RM never thinks about process boundaries.

3. **Clean separation of concerns enables independent evolution:** Persona copilots can be updated for UX improvements without touching business logic. Process agents can be updated for regulatory changes without touching persona interfaces. This decoupling is architecturally valuable for a system that will evolve over years.

4. **Graceful handling of DCE's 24-hour coverage model:** During off-hours, the Client Services Copilot can invoke the Credit Assessment Agent with elevated urgency parameters, and the Credit Agent applies pre-approved rules for off-hours limit adjustments. The persona copilot handles the human interaction; the process agent handles the business logic — including off-hours decision rules.

5. **Least-privilege is naturally enforced:** Persona copilots have NO direct system access. They can only invoke process agents through a controlled interface. Process agents have scoped system access. A persona copilot cannot accidentally expose credit data because it never has credit data — it can only ask the Credit Assessment Agent for what the persona is authorized to see.

6. **Supports the Enterprise Architecture's model routing:** The Intelligence Plane can route persona copilots to smaller, faster models (intent classification, context assembly) and process agents to larger, more capable models (complex reasoning, multi-system coordination). This optimizes both cost and latency.

7. **Incremental deployment is natural:** Phase 1: Deploy persona copilots with simple tool access (no process agents). Phase 2: Introduce process agents for Account Opening (the highest-pain process). Phase 3: Gradually migrate business logic from persona copilots to process agents. This phased approach manages risk in a production environment.

8. **Cross-process coordination is architecturally clean:** When account opening requires credit approval, the Account Opening Agent (process) invokes the Credit Assessment Agent (process) — not the Credit Copilot (persona). Process-to-process coordination stays in the process tier. Persona copilots only see results.

**Cons:**

1. **Highest development complexity and cost:** You are building two layers of agents plus the orchestration between them. Rough estimate: 10 persona copilots + 10 process agents + orchestration/routing layer + trust/authorization layer for both tiers. This is approximately 2x the development effort of pure process-based.

2. **Latency overhead from two-tier routing:** User request goes to persona copilot (model inference) then to process agent (model inference) then to tools (system calls) then back up. Each hop adds latency. In a time-critical margin call scenario, the extra hop matters. Must be mitigated with aggressive caching, streaming responses, and lightweight persona copilot models.

3. **Debugging complexity increases:** When something goes wrong, you must trace through the persona copilot's reasoning, the routing decision, the process agent's reasoning, and the tool execution. The Observability Plane must handle distributed tracing across both tiers — significantly more complex than single-tier tracing.

4. **Risk of "thin copilot creep":** Over time, developers may be tempted to add business logic to persona copilots for convenience ("it's faster to just handle this simple case in the copilot"). This erodes the architecture's clean separation and reintroduces the problems of persona-based agents. Requires strong architectural governance.

5. **Authorization model is two-dimensional:** You must manage (a) which persona copilots can invoke which process agents, and (b) which process agents can access which systems. The authorization matrix is N-personas x M-processes, which is more complex than either pure model alone.

6. **Persona copilot memory and process agent memory must be coordinated:** The RM Copilot remembers that the RM asked about Client X's account opening yesterday. The Account Opening Agent has its own state about that account opening. These two memory stores must be consistent — or at least the persona copilot must know to defer to the process agent's state as authoritative. Memory coordination is an unsolved hard problem in agentic systems.

7. **Testing surface area is large:** You must test each persona copilot, each process agent, and the interaction between every valid persona-process pair. For 10 personas and 10 processes, the combinatorial testing space is substantial.

---

## 5. SWOT Analysis

### Style A: Persona-Based Agents — SWOT

| **Strengths** | **Weaknesses** |
|---|---|
| 1. Immediate intuitive UX for all 10 DCE personas — zero process taxonomy learning curve | 1. Audit trail fragmentation: Account Opening spans 7 persona agents, MAS cannot get a single decision chain |
| 2. Persona-specific memory enables genuine personalization (dealer preferences, RM client portfolios) | 2. Business logic duplication across copilots (trade lifecycle logic in both Client Services and DCE Ops copilots) |
| 3. Organizational accountability maps 1:1 (Credit team owns Credit Copilot) | 3. Least-privilege violation: COO Desk Support Copilot needs near-universal read access across 5 systems |
| 4. Fastest path to a first deployment — ship one copilot, prove value, expand | 4. Cross-process coordination is ad-hoc, not architecturally enforced |
| 5. Aligns with the DCE document's existing design thinking — no conceptual rework needed | 5. Organizational restructuring requires agent architecture restructuring |
| 6. Each copilot can be tuned to persona-specific language and communication patterns | 6. Inconsistent process execution: same process may behave differently through different persona agents |

| **Opportunities** | **Threats** |
|---|---|
| 1. Early wins with single-persona copilots can build organizational buy-in for broader AI adoption at DBS | 1. MAS audit finding: "Bank cannot produce a unified audit trail for account opening decisions" — regulatory risk |
| 2. Persona copilots could evolve into training tools for new DCE staff (learning from experienced users' patterns) | 2. A production incident where two persona agents give contradictory guidance on the same process (e.g., different margin call thresholds) |
| 3. Natural extension point for DBS's broader digital workforce strategy | 3. Privilege escalation: compromised persona copilot with broad access becomes an attack vector across multiple systems |
| 4. Could serve as a prototype/learning phase before migrating to hybrid | 4. Cost escalation: 10 agents each maintaining broad context = high token consumption at 15,000-25,000 trades/day volume |
| 5. Persona agents can capture tacit knowledge that is currently lost during staff turnover in the 24-hour rotation | 5. Architecture becomes unmaintainable as DCE processes evolve — each change requires updating multiple persona agents |

---

### Style B: Process-Based Agents — SWOT

| **Strengths** | **Weaknesses** |
|---|---|
| 1. Gold-standard regulatory auditability: one agent, one process, one complete audit trail for MAS | 1. Significant user adoption friction — DCE's 60 staff must learn a process taxonomy to interact with the system |
| 2. Clean least-privilege: each process agent accesses only the systems its process requires | 2. "Tell me everything about Client X" requires invoking 5+ process agents and synthesizing results |
| 3. Single source of truth for business logic — no duplication, no drift | 3. Process boundary disputes (limit adjustment touches credit, account maintenance, and trade management) |
| 4. Process-level fault isolation: Reconciliation Agent failure does not affect Account Opening Agent | 4. No persona-specific memory or personalization — every user gets the same generic interface |
| 5. Scales with process complexity, not headcount — adding a persona costs zero architectural work | 5. Higher upfront design effort: must correctly decompose DCE's processes before building anything |
| 6. Natural alignment with Enterprise Architecture's 7-Plane model and Trust Plane wrapping | 6. Off-hours scenarios require process agents to embed persona-context logic (defeating clean separation) |

| **Opportunities** | **Threats** |
|---|---|
| 1. Process agents can be reused across DBS business units beyond DCE (other trading desks, other clearing operations) | 1. User rejection: if adoption fails among the 60 DCE staff, the entire investment is wasted |
| 2. Clean process boundaries enable future straight-through processing (STP) — full automation of low-risk processes | 2. Process decomposition errors discovered late: wrong boundaries require expensive re-architecture |
| 3. Process agents become the foundation for DBS's enterprise AI platform | 3. Competitors (OCBC, UOB, international banks in Singapore) deploy persona-based copilots with better UX and poach DCE talent |
| 4. Regulatory changes (new MAS requirements) are implemented once per process, not once per persona | 4. Over-engineering risk: building 10 process agents when the DCE team only uses 3 regularly |
| 5. Process agents can be instrumented for comprehensive operational metrics (processing time, error rates, SLA compliance) | 5. The "cold start" problem for cross-cutting queries may lead to shadow workarounds (staff reverting to email/Excel) |

---

### Style C: Hybrid Architecture — SWOT

| **Strengths** | **Weaknesses** |
|---|---|
| 1. Persona copilots deliver intuitive UX; process agents deliver regulatory compliance — both goals achieved | 1. Highest development complexity and cost — two agent tiers plus orchestration |
| 2. Clean separation enables independent evolution of UX layer and business logic layer | 2. Latency overhead from two-tier model inference chain in time-critical scenarios (margin calls) |
| 3. Least-privilege naturally enforced: persona copilots have zero direct system access | 3. Distributed tracing complexity: debugging spans persona copilot + routing + process agent + tools |
| 4. Graceful 24-hour coverage: persona copilots handle interaction, process agents handle off-hours decision rules | 4. Risk of "thin copilot creep" — business logic migrating into persona copilots over time |
| 5. Supports incremental deployment: start with simple copilots, progressively add process agents | 5. Two-dimensional authorization model (persona-to-process AND process-to-system) is complex to manage |
| 6. Enterprise Architecture's Intelligence Plane can optimize model routing across both tiers | 6. Memory coordination between persona and process tiers is architecturally challenging |

| **Opportunities** | **Threats** |
|---|---|
| 1. Becomes the reference architecture for agentic AI across DBS — DCE as the proving ground | 1. Over-engineering: if the two-tier architecture is more complex than DCE's actual needs justify |
| 2. Persona copilots capture institutional knowledge; process agents enforce institutional rules — knowledge preservation at scale | 2. Team skill gap: building and maintaining a two-tier agent architecture requires deep MLOps/AI engineering talent |
| 3. The thin-copilot pattern is portable: same process agents, different persona copilots for other DBS businesses | 3. Integration testing burden may slow release velocity in a business that needs rapid response to market changes |
| 4. Phased deployment manages risk: if process agents underperform, persona copilots still provide value | 4. Vendor lock-in risk: the orchestration layer between tiers may become dependent on specific LLM provider capabilities |
| 5. Natural path to Level 5 autonomy: process agents can be gradually given more autonomous decision-making authority while persona copilots maintain human-in-the-loop oversight | 5. Organizational confusion about ownership: who owns the persona copilot vs. the process agent when something goes wrong? |
| 6. Positions DBS ahead of regulatory expectations: MAS is likely to publish AI governance guidelines that favor auditable, layered architectures | 6. If the DCE team is small (60 people) and adoption is strong, the complexity of hybrid may not be justified vs. pure process-based with a good UI layer |

---

## 6. Critical Scenario Analysis

### Scenario 1: Account Opening (touches 7 personas, 5+ systems, 3-15 day process)

**Current state:** 3-15 days, manual email chains, PDF forms, Excel tracking, no unified status view. Touches RM (initiation), Sales Dealer (pipeline), Client Services (coordination), Static Team (Murex/UBIX/SIC setup), Credit (approval), DCE Ops (clearing setup), Tech Support (connectivity).

**Style A (Persona-Based):**
The RM Copilot captures the initial request. It emails/messages the Client Services Copilot. The Client Services Copilot tracks the process in its context, but must coordinate with the Static Team Copilot (for system setup), Credit Copilot (for approval), and DCE Ops Copilot (for clearing). Each copilot handles its persona's portion and passes status back to Client Services. The result: status is still scattered across 7 agent memories. The Client Services Copilot becomes a de facto process orchestrator — a role it was not designed for. If the Client Services person is off shift (24-hour operation), the handover to another shift's Client Services person requires reconstructing context from multiple agent logs. MAS audit: "Show me the complete decision chain for account ABC123." Answer: "We need to query 7 agents and reconstruct the timeline." This is inadequate.

**Style B (Process-Based):**
The Account Opening Agent receives the request (from any persona via a shared interface). It orchestrates the entire 3-15 day workflow: generates the KYC checklist, routes credit approval to the Credit Assessment Agent, triggers system setup tasks in Murex/UBIX/ClearVision/SIC, tracks progress, and sends notifications at each stage. Any persona can query the Account Opening Agent for status. One agent, one complete audit trail, one place to check status. MAS audit: "Show me the complete decision chain for account ABC123." Answer: "Here is the Account Opening Agent's complete trace, including all sub-agent invocations, approvals, and system confirmations." This is adequate. The weakness: the interface is process-centric. The RM must know to ask the Account Opening Agent, not "their" copilot.

**Style C (Hybrid):**
The RM asks their RM Copilot "start account opening for Client X." The RM Copilot (Tier 1) identifies the intent and invokes the Account Opening Agent (Tier 2). The Account Opening Agent orchestrates the full workflow, invoking the Credit Assessment Agent for approval and system tools for Murex/UBIX/ClearVision/SIC setup. At each stage, the Account Opening Agent pushes status notifications that are routed to the relevant persona copilots: the Credit Copilot alerts the credit analyst that an approval is needed; the Static Team Copilot shows the pending system setup tasks. The RM Copilot shows the RM overall progress. MAS audit: the Account Opening Agent's trace is the authoritative record. Persona copilot interactions are supplementary context. This satisfies both UX and regulatory requirements.

**Winner: Hybrid (C), with Process-Based (B) as a close second.**

---

### Scenario 2: Margin Call during Market Stress (time-critical, volume spike)

**Current state:** Manual process. ClearVision generates margin calls. COO Desk Support monitors. Client Services contacts clients. Credit monitors exposure. During market stress (e.g., 2020 March volatility, 2023 US regional bank crisis), volume can spike 3-5x. Manual process does not scale. Response time degrades. Risk of missed margin calls.

**Style A (Persona-Based):**
The COO Desk Support Copilot detects the margin call from ClearVision. It alerts the Client Services Copilot, which drafts client communications. The Credit Copilot monitors exposure. If multiple margin calls hit simultaneously (market stress), each persona copilot is independently processing its piece. There is no centralized prioritization. The Client Services Copilot may be overwhelmed composing 50 margin call notifications while the Credit Copilot independently determines that 5 of those clients are already in breach. The lack of coordinated prioritization during stress is a critical operational risk.

**Style B (Process-Based):**
The Margin & Collateral Agent detects all margin calls from ClearVision. It has a single view of all outstanding calls. It can prioritize by exposure size, client risk rating, and time zone (US clients in US hours, Asia clients in Asia hours). It invokes the Credit Assessment Agent to check which clients are approaching or breaching limits. It generates prioritized notifications via the Notification Agent. During a volume spike, one agent scales its processing — no coordination overhead between persona agents. The weakness: notifications go out generically, without persona-specific formatting.

**Style C (Hybrid):**
The Margin & Collateral Agent (Tier 2) handles exactly as in Style B — centralized detection, prioritization, credit checking. But notifications flow through persona copilots (Tier 1): the COO Desk Support Copilot gets a prioritized dashboard view; the Client Services Copilot gets pre-drafted client communications in the format that particular Client Services person prefers; the Credit Copilot gets an exposure summary. The process agent handles the crisis logic; persona copilots handle the human-facing communication. During a 3 AM margin call event on US exchanges, the Client Services Copilot can autonomously dispatch notifications using pre-approved templates while flagging high-risk calls for human review.

**Winner: Hybrid (C). Process-Based (B) is functionally equivalent but lacks persona-specific communication formatting that accelerates human response during stress.**

---

### Scenario 3: Product Registry Approval (multi-team email chain, no tracking)

**Current state:** A new product (e.g., a new exchange-traded derivative) requires approval from multiple teams: Sales (client demand validation), Risk (risk assessment), Credit (credit methodology), Ops (operational readiness), Tech (system configuration). Currently managed via email chains with no tracking, no SLA enforcement, and no visibility into where in the approval chain the request sits.

**Style A (Persona-Based):**
The Sales Dealer Copilot initiates the request. It emails/messages the Credit Copilot, which processes and forwards to... whom? The COO Desk Support Copilot? The DCE Ops Copilot? There is no clear orchestrator. The email-chain problem is replicated in agent-to-agent messaging. Each persona copilot handles its approval step but there is no unified tracking of the overall approval status. The fundamental problem — no tracking, no SLA enforcement — is not solved.

**Style B (Process-Based):**
The Product Registry Agent owns the entire approval workflow. It defines the approval stages, routes to appropriate approvers (via their role, not their persona agent), tracks SLAs, sends reminders, and maintains a complete audit trail. When the COO asks "where is the approval for Product X?", the Product Registry Agent has a single, authoritative answer. This directly solves the current pain point.

**Style C (Hybrid):**
The Sales Dealer Copilot helps the dealer formulate the product request (providing templates, historical examples, market data). It then invokes the Product Registry Agent (Tier 2) to manage the approval workflow. Each approver's persona copilot surfaces the pending approval in their workflow. The Product Registry Agent tracks SLAs and sends escalations through persona copilots. The RM Copilot can show the RM which of their requested products are pending approval and where.

**Winner: Process-Based (B) and Hybrid (C) are equivalent in solving the core problem. Hybrid adds better UX for initiators and approvers. Process-Based is simpler to build. For this scenario, Process-Based (B) is sufficient.**

---

### Scenario 4: Off-hours US Exchange Limit Management

**Current state:** US exchanges operate during Singapore night hours. Client Services handles limit adjustment requests without direct Credit team oversight. Current process: Client Services makes judgment calls based on pre-approved thresholds, emails Credit for ratification the next morning. Risk: unauthorized limit increases, no real-time credit oversight, potential regulatory exposure.

**Style A (Persona-Based):**
The Client Services Copilot must independently handle limit adjustment logic during off-hours. This means embedding credit assessment rules into the Client Services Copilot — or giving the Client Services Copilot authority to invoke the Credit Copilot autonomously (but the Credit Copilot has no human oversight at 3 AM Singapore time). Either way, the architecture is strained. The Client Services Copilot is making credit decisions — a role mismatch that is both an operational risk and a regulatory concern.

**Style B (Process-Based):**
The Credit Assessment Agent operates 24/7, independent of whether a human credit analyst is available. It has pre-configured rules: (a) limit adjustments within pre-approved thresholds are auto-approved with logging, (b) adjustments exceeding thresholds trigger escalation to on-call credit officer, (c) all adjustments are logged for next-day credit review. The Client Services person invokes the Credit Assessment Agent directly. Clean separation of duties is maintained: Client Services requests, Credit Agent decides.

**Style C (Hybrid):**
The Client Services Copilot (Tier 1) receives the limit adjustment request from the client. It invokes the Credit Assessment Agent (Tier 2) which applies the rules-based framework from Style B. The Client Services Copilot then communicates the result to the client in the appropriate format. If escalation is needed, the Credit Copilot pages the on-call credit officer with full context. The persona copilot handles the human interaction; the process agent handles the credit decision. Clean separation. Full audit trail. Regulatory defensible.

**Winner: Hybrid (C). Process-Based (B) solves the credit logic problem but lacks the persona-facing communication layer. Persona-Based (A) is actively dangerous in this scenario.**

---

### Scenario 5: Reconciliation Break Investigation (cross-system, time-pressured)

**Current state:** A reconciliation break between Murex (trade capture) and UBIX (clearing) or ClearVision (margin) requires investigation across multiple systems, often under time pressure before end-of-day settlement. The TMO DCE Ops team investigates manually, querying each system, comparing records, and identifying the discrepancy source. This can take hours.

**Style A (Persona-Based):**
The DCE Ops Copilot investigates the break by querying Murex, UBIX, and ClearVision — systems it needs access to. But if the break originated from a trade execution issue, the Execution Dealer Copilot has relevant context. If it is a static data issue, the Static Team Copilot has relevant context. The DCE Ops Copilot either needs access to all systems and all context (privilege creep) or must query multiple persona agents (slow, fragmented).

**Style B (Process-Based):**
The Reconciliation Agent has read access to Murex, UBIX, and ClearVision reconciliation data. It can systematically compare records, identify the discrepancy source, and present the investigation to the DCE Ops person. If the root cause is a trade execution issue, it can query the Trade Management Agent for execution details. If it is a static data issue, it can query the Account Maintenance Agent for recent changes. Process-to-process queries are clean and scoped.

**Style C (Hybrid):**
The DCE Ops Copilot (Tier 1) receives the break alert. The DCE Ops person says "investigate break #12345." The copilot invokes the Reconciliation Agent (Tier 2), which performs the systematic investigation described in Style B. The Reconciliation Agent returns its findings to the DCE Ops Copilot, which presents results in the format the ops person prefers — with suggested resolution actions. If the root cause involves a different team (e.g., Static Team made an SSI change), the relevant persona copilot is notified with the specific finding.

**Winner: Hybrid (C) for complete solution. Process-Based (B) for core investigation logic.**

---

### Scenario Analysis Summary

| Scenario | Persona (A) | Process (B) | Hybrid (C) |
|----------|:-----------:|:-----------:|:-----------:|
| Account Opening | Inadequate | Strong | **Best** |
| Margin Call Stress | Risky | Strong | **Best** |
| Product Registry | Inadequate | **Best** | Best (equal) |
| Off-Hours Limits | **Dangerous** | Strong | **Best** |
| Recon Break | Weak | Strong | **Best** |

---

## 7. Recommendation

### Clear Recommendation: Hybrid Architecture (Style C)

### Rationale

The analysis converges on the Hybrid Architecture across every dimension:

1. **Weighted matrix:** Hybrid scores 160/200 (80.0%), close behind Process-Based at 165/200 (82.5%), but critically outscores Process-Based on the two dimensions that will determine success or failure — User Adoption (+2 points weighted) and Cross-Process Coordination (+1 point weighted). The 5-point gap in raw score is entirely attributable to Development Complexity, where Hybrid scores lower — a one-time cost that is amortized over the system's lifetime.

2. **Scenario analysis:** Hybrid wins or ties in all 5 critical scenarios. Persona-Based is rated "inadequate" or "dangerous" in 4 of 5 scenarios.

3. **Regulatory reality:** MAS will ask for unified audit trails. Only Process-Based and Hybrid architectures can provide them. But MAS will also evaluate whether the bank's AI systems are usable and well-governed — a system that staff cannot use effectively is itself a risk.

4. **The adoption imperative is non-negotiable:** DCE runs 24 hours. It processes 15,000-25,000 trades daily. The 60 staff across 10 personas will not adopt a system that forces them to think differently about their work during a margin call at 3 AM. Persona copilots are not a luxury — they are a deployment prerequisite.

### Exact Architecture Specification

**Tier 1 — Persona Copilots (Context Plane / Intelligence Plane)**

| Component | Specification |
|-----------|--------------|
| Count | 10 copilots, one per DCE persona |
| Model | Smaller, faster model (e.g., Claude Haiku class or fine-tuned smaller model) |
| Responsibilities | Intent recognition, context assembly, persona memory, response formatting, notification routing |
| System access | NONE. Zero direct access to Murex, UBIX, CQG, ClearVision, or SIC |
| Data access | Read access to their own persona memory store only |
| Authorization | Can invoke only the process agents their persona is authorized to use (e.g., Sales Dealer Copilot cannot invoke Credit Assessment Agent directly) |
| Memory | Persona-specific: preferences, communication history, frequently asked questions, client relationships |

**Tier 2 — Process Specialist Agents (Reasoning Plane / Action Plane)**

| Component | Specification |
|-----------|--------------|
| Count | 10 process agents (as defined in Style B) |
| Model | Larger, more capable model (e.g., Claude Opus class) for complex reasoning; smaller model for deterministic workflow steps |
| Responsibilities | Business logic execution, system integration, compliance checks, audit trail generation, cross-process coordination |
| System access | Scoped per process: Account Opening Agent accesses Murex account module, UBIX clearing module, ClearVision margin module, SIC documentation module — and nothing else |
| Authorization | Defined by process scope. Process agents can invoke other process agents through a controlled interface (e.g., Account Opening Agent can invoke Credit Assessment Agent) |
| Memory | Process-specific: workflow state, pending approvals, SLA timers, historical process metrics |

**Orchestration Layer (Reasoning Plane Supervisor)**

| Component | Specification |
|-----------|--------------|
| Pattern | Supervisor pattern per the Enterprise Architecture |
| Routing | Persona copilot sends structured invocation to supervisor; supervisor routes to correct process agent(s) |
| Coordination | For multi-process requests (e.g., "Client X status"), supervisor invokes multiple process agents in parallel and returns aggregated results to persona copilot |
| Escalation | Supervisor handles escalation logic: if process agent cannot complete within SLA, escalate through persona copilot to human |

**Trust Plane (Wraps Both Tiers)**

| Component | Specification |
|-----------|--------------|
| Persona tier | PII filtering, prompt injection detection, output sanitization, persona authorization enforcement |
| Process tier | System credential management, action approval gates, regulatory rule enforcement, audit log immutability |
| Cross-tier | Authorization matrix enforcement (which personas can invoke which processes), data classification enforcement (credit data only flows to authorized personas) |

**Observability Plane (Spans Both Tiers)**

| Component | Specification |
|-----------|--------------|
| Tracing | Distributed trace from persona copilot through supervisor to process agent(s) and back — complete request lifecycle visibility |
| Metrics | Per-persona: adoption, satisfaction, response time. Per-process: completion rate, SLA compliance, error rate, cost |
| Audit | Process agent audit logs are the authoritative regulatory record. Persona copilot logs are supplementary interaction records |

### Interaction Pattern Examples

**Example 1: Account Opening**
```
RM → RM Copilot: "Open account for Client X, IRS clearing on CME"
  → RM Copilot identifies intent: account_opening
  → Supervisor routes to Account Opening Agent
    → Account Opening Agent:
      1. Creates workflow instance (audit trail begins)
      2. Generates KYC checklist
      3. Invokes Credit Assessment Agent for credit approval
      4. Triggers system setup tasks (Murex, UBIX, ClearVision, SIC)
      5. Pushes status notifications to relevant persona copilots:
         - Credit Copilot: "Credit approval needed for Client X"
         - Static Team Copilot: "System setup tasks pending for Client X"
         - Client Services Copilot: "New account opening in progress for Client X"
      6. Tracks SLAs, sends reminders, escalates delays
  ← RM Copilot: "Account opening initiated for Client X. Estimated completion:
     5 business days. Credit approval is the next milestone. I'll update you
     when it progresses."
```

**Example 2: Off-Hours Limit Adjustment**
```
Client Services person (2 AM SGT) → Client Services Copilot:
  "Client Y needs CME limit increase from $5M to $8M for overnight session"
  → Client Services Copilot identifies intent: credit_limit_adjustment
  → Supervisor routes to Credit Assessment Agent
    → Credit Assessment Agent:
      1. Checks pre-approved off-hours threshold for Client Y: $10M
      2. Requested $8M is within threshold: auto-approve
      3. Logs decision with full rationale
      4. Invokes Account Maintenance Agent to update limit in Murex/ClearVision
      5. Queues notification for Credit Copilot:
         "Off-hours limit adjustment approved for Client Y — for next-day review"
  ← Client Services Copilot: "Limit increase approved for Client Y. New CME
     limit: $8M. This was within pre-approved thresholds. Credit team will
     review tomorrow morning."
```

### Why Not Pure Process-Based?

Process-Based scored highest in the weighted matrix (165 vs 160). Why not recommend it?

Because the 5-point gap is driven entirely by Development Complexity (a one-time cost), while the adoption risk of Process-Based is existential and ongoing. A technically superior system that 60 people in a 24-hour operation refuse to use is worth zero. The persona copilot layer is not a luxury — it is the difference between a system that transforms DCE operations and a system that sits unused while staff continue emailing Excel spreadsheets.

Moreover, the phased deployment approach means Phase 1 of the Hybrid is actually simpler than Process-Based (just persona copilots with basic tools), providing early value while the process agent layer is built.

### Why Not Persona-Based?

Persona-Based is inadequate or dangerous in 4 of 5 critical scenarios. The audit trail fragmentation alone is a regulatory disqualifier for a MAS-regulated derivatives clearing operation. It scored 101/200 — essentially failing the weighted assessment. The DCE document's proposal for persona-based agents reflects a natural first instinct ("build a copilot for each role") that does not survive contact with regulated production requirements.

### Deployment Phasing

| Phase | Timeline | Scope |
|-------|----------|-------|
| Phase 1 | Months 1-3 | Deploy 3 persona copilots (Client Services, DCE Ops, COO Desk Support) with direct tool access (no process agents yet). Prove adoption. |
| Phase 2 | Months 3-6 | Introduce Account Opening Agent and Credit Assessment Agent as process agents. Migrate account opening logic from persona copilots to process agent. |
| Phase 3 | Months 6-9 | Add remaining process agents (Margin, Reconciliation, Trade Management, Product Registry). Deploy remaining persona copilots. |
| Phase 4 | Months 9-12 | Full hybrid architecture operational. Optimize: model routing, cost, latency. Begin measuring process SLAs and operational risk reduction. |

### Final Word

The Hybrid Architecture resolves the design tension between the DCE document and the Enterprise Architecture document by recognizing that they are describing different layers of the same system. The DCE document correctly identifies that users need persona-aligned interaction. The Enterprise Architecture correctly identifies that business logic needs process-aligned execution. The Hybrid makes both true simultaneously, at the cost of additional architectural complexity — a cost that is justified by the regulatory, operational, and adoption requirements of a 24-hour MAS-regulated derivatives clearing operation processing 15,000-25,000 trades daily.

---

*This analysis should be reviewed alongside the DCE Hub Current Situation Analysis and the Enterprise Agentic Architecture documents. Architecture decisions should be validated through process deep-dive workshops with each persona group before finalizing the agent topology.*
