# MBS Official Framework Alignment Report

**NPA Agentic Workbench vs Official MBS Agentic Architecture Framework (MBS Session)**
**Source:** AI Architecture Framework Session (MBS) — 9 slides, Feb 28 2026
**Version:** 1.0 | March 2026

---

## What MBS Has Officially Defined (9 Slides Decoded)

### Slide 1: Agenda

Three pillars: **Recap & Overview**, **Microsoft Architecture**, **Google Architecture**

### Slide 2: Agent Categorization & Controls

MBS defines **3 categories** under a **Unified Agent Control Plane**:

| | Personal Agents | Team Agents | Enterprise Agents |
|---|---|---|---|
| **Purpose** | Personal productivity | Shared for team | Complex agentic workflows |
| **Creation** | Self-created, out of the box | Additional evaluation required | Developed by 3-in-a-box (Business, Data Chapter, Tech) |
| **Tools** | NL Prompting, drag & drop | — | Full SDLC required |
| **SDLC** | No SDLC (MBS-GPT / MS-Copilot) | — | Deployment follows Software Dev Lifecycle |
| **Production Access** | No direct connection to production systems | — | Connections to operational production systems allowed |
| **Governance** | UDMA policy applies where criteria met | — | Full AI Governance applies (e.g. RDU) |

### Slide 3: Unified Agentic Framework (THE KEY SLIDE)

7 layers labelled A through G:

| Layer | Name | Components |
|---|---|---|
| **A** | UX & UI Layer | Productivity Tools (O365, Teams), M365 Copilot, MBS-GPT, Workflow Workbench, Digital Channels, Ecosystems |
| **B** | Application Integration Layer | AI Gateway (for Agents, Models, Tools & Data) |
| **C** | GenAI/Agentic Workflow Platform | Unified Agent Control Plane, Agent Identity & Access Control, Agent & Tool Inventory & Lifecycle Mgmt, Observability & Traceability, Runtime Evaluations & Risk Mgmt, Guardrails on inputs/outputs/tools, Agent Policies Management |
| **D** | Agent Runtime | Personal Productivity (Copilot Chat/M365 Copilot, Gemini Enterprise, MBS-GPT), Team Collaboration (M365 Copilot/Teams, Gemini Enterprise, MBS-GPT), Enterprise Managed (Azure AI Foundry, Google Agent Engine, On-Prem Dify Runtime in VPC/GCP) |
| **E** | Agent Build/Design | No-Code (Copilot Chat, M365 Copilot, Gemini Enterprise, Notebook LM, MBS-GPT), Low-Code (Copilot Studio, Dify Studio, MBS-GPT), Pro-Code/Full-Code (Azure AI Foundry + Microsoft Agent Framework, Google Vertex AI + Google ADK, Other Frameworks: LangChain/LangGraph, CrewAI, Claude SDK, etc.) |
| **F** | Data Access & Control Plane | Data Control & Governance (Federated Data Connectors, Data Access Control, Metadata Management, Data Lineage), Data Sources Internal (WorkIQ/Microsoft Graph, Product System APIs, MBS Data Platform, Knowledge Bases, Custom Connectors, JIRA/Confluence etc.), Data Sources External (Web search/Grounding, Other sources via MCP Tools) |
| **G** | Security | Controls (Data, Access, Secret) |
| — | Agent Capabilities | Workflow & Orchestration, Tools/MCPs, Context & Memory, Prompt Engineering, AI Models, Build Phase Evaluation |

### Slide 4: Agent365 End-to-End Architecture (Microsoft Path)

- **Build:** Microsoft Copilot (No-Code) -> Copilot Studio (Low-Code) -> AI Foundry/Microsoft MAF (Pro-Code) -> Agent 365 SDK (Pro-Code) -> Claude Code ADK, Dify, Other Framework
- **Runtime:** Azure, GCP, MBS On-Prem. Publish to Copilot/Teams via Message Endpoint
- **Agent Control Plane (M365 SaaS):** Agent 365 (Agent Registry/Inventory, Profiles, Permissions, Activities, Security & Compliance, Lifecycle Management, Dashboard)
- **Identity:** Entra (Agent Identity, Access Policy, Identity Blueprint incl. Owner, Audit Log, Sign Log, Linked Agents)
- **Data Governance:** Purview (Data security incl. AI interactions, sensitive data detection, Risky Prompts, Data Access control & Management)
- **Threat Protection:** Defender (MITRE ATT&CK patterns, Jailbreak Detection, Credential Theft)

### Slide 5: AI Foundry Architecture (Azure)

- Secure Landing Zone with hub-and-spoke topology (Virtual WAN + Express Route)
- Operational Governance via Azure Monitor + Application Insights
- AI Foundry isolated in private network via Private Endpoints
- Managed Access through Application Gateway + APIM AI Gateway

### Slide 6: Google Agent Cloud Architecture

- Gemini Enterprise + Agent Development Kit at top
- **Agent Cloud** contains: Platform/Infra Orchestrator (Agent Dev, Agent & Tool Management with Model Registry/Agent Registry/MCP Tools Registry), Application Orchestrator (Agent Runtime/Engine, Agent Networking/Gateway, Agent Identity & Access Policy), Multi-agent Orchestrator (Agent types: Upwork, Identification, Risk, Security Controls)
- **Infrastructure:** Development & Rollout (App Dev Templates, Artifact Registry, EasySaaS), Resource Mgmt (App Mgmt/Flywheel, API Mgmt), Compute (Serverless/Cloud Run, Kubernetes/GKE), Networking (Gateway/API/Apigee, Mesh/Service Mesh/CSM), Observability (Cloud Logging, Cloud Metrics), Security & Governance (Identity, Risk Profiling, Compliance/Security Controls, Asset/Admission Controls)
- **Agent DIY:** CrewAI, LangChain mentioned separately

### Slide 7: Google End-to-End Architecture

- **Build:** Gemini Enterprise model builder (No-Code) -> VertexAI model builder (Low-Code) -> AI Foundry/Microsoft MAF (Pro-Code, optional) -> A2A Standard, Google ADK, Claude Code ADK, Dify, Other Frameworks
- **Runtime:** Gemini Enterprise -> Azure (optional), GCP, MBS On-Prem
- **Agent Control Plane:** Agent Cloud (Registry, Lifecycle, Dashboard), Agent Identity via SPIFFE, Model Armor for Data Governance, Agent Observability (Risk Monitoring, Full logging/tracing, Evals)

### Slide 8-9: Hybrid End-to-End Architecture (TARGET STATE)

This is the **official target** combining Microsoft + Google:

- **Build Tier:** Microsoft Copilot (No-Code) -> Copilot Studio (Low-Code) -> AI Foundry/Microsoft MAF (Pro-Code, optional) -> Google ADK, Claude Code ADK, Dify, Other Frameworks
- **Runtime:** Azure (optional), GCP, MBS On-Prem, Gemini Enterprise
- **Agent Control Plane — Three Layers:**
  - **Layer 1 (M365 SaaS):** Agent 365 for Personal & Team collaboration (Registry, Profiles, Permissions, Lifecycle Mgmt, Dashboard) + Entra + Purview + Defender
  - **Layer 2 (Unified Layer):** Integration with bank processes — Agent Registry, Agent Marketplace, Agent Policies, ALAN etc.
  - **Layer 3 (Agent Cloud — Enterprise Managed):** Agent Identity & Access Policies, Agent Asset Discovery etc. -> Agent Identity SPIFFE, Model Armor, Agent Observability
- **Identity:** MBS AD -> SPIFFE CA server

---

## NPA Workbench vs Official MBS Framework: Complete Alignment

---

### 1. AGENT CATEGORIZATION — Where Does Our Workbench Sit?

The NPA Workbench is **unambiguously an Enterprise Agent**:

| MBS Criteria for Enterprise Agents | NPA Workbench | Status |
|---|---|---|
| Supports complex agentic workflows | 18 agents, 4 tiers, 13-state workflow | YES |
| Developed by 3-in-a-box (Business, Data Chapter, Tech) | COO domain + Data (MCP tools) + Tech (Angular/Python/Dify) | YES |
| Full SDLC required | Jenkinsfile, Docker, OpenShift k8s, Railway deployment | YES |
| Connections to operational production systems allowed | MySQL DB with 42 tables, 77 MCP tools | YES |
| Full AI Governance applies (e.g. RDU) | Audit trail, RBAC, signoff matrix, escalation rules | YES |

**Verdict: Correctly positioned as Enterprise Agent. No categorization issue.**

---

### 2. UNIFIED AGENTIC FRAMEWORK (Layers A-G) — Component-by-Component

#### Layer A: UX & UI Layer

| MBS Specifies | NPA Workbench Has | Alignment |
|---|---|---|
| Productivity Tools (O365, Teams) | Not integrated | GAP |
| M365 Copilot | Not integrated | N/A for Enterprise agents |
| MBS-GPT | Not integrated | Separate system |
| **Workflow Workbench** | **Angular 20 Workbench** — 69 components, dashboard, approval flows, agent workspace | ALIGNED |
| Digital Channels | No customer-facing channel | Internal tool |
| Ecosystems | No external ecosystem connectors | Phase 3 |

**Score: 1/6 directly aligned, but "Workflow Workbench" is our primary category and it's strong.**

#### Layer B: Application Integration Layer

| MBS Specifies | NPA Workbench Has | Alignment |
|---|---|---|
| AI Gateway (for Agents, Models, Tools & Data) | Express proxy -> Dify -> MCP. Express acts as the AI Gateway routing to 16 Dify apps + 77 MCP tools | ALIGNED |

**Score: Aligned. Express/FastAPI proxy IS the AI Gateway.**

#### Layer C: GenAI/Agentic Workflow Platform (CRITICAL LAYER)

| MBS Specifies | NPA Workbench Has | Alignment |
|---|---|---|
| **Unified Agent Control Plane** | `agent-registry.json` + `dify-agents.js` — central registry of all 18 agents with tiers, types, API keys | ALIGNED |
| **Agent Identity & Access Control** | JWT auth, 5-level RBAC (ADMIN->MAKER), per-agent tool allowlisting | ALIGNED |
| **Agent & Tool Inventory & Lifecycle Mgmt** | Agent registry with 18 agents. Tool registry with 77 tools (`registry.py`). But NO lifecycle management (no versioning, canary, retirement) | PARTIAL |
| **Observability & Traceability** | conversation_id + message_id tracking. Audit trail. But NO Langfuse, NO OpenTelemetry, NO structured logging | GAP |
| **Runtime Evaluations & Risk Mgmt** | No golden datasets, no regression testing, no LLM-as-judge, no eval pipeline | GAP |
| **Guardrails on inputs, outputs and tools** | Topic boundaries via Dify system prompts. Tool allowlisting. But NO PII masking, NO injection detection, NO output scanning | CRITICAL GAP |
| **Agent Policies Management** | One-action-per-turn policy. Signoff matrix. Escalation rules. But no formal policy engine or policy-as-code | PARTIAL |

**Score: 2 aligned, 2 partial, 3 gaps. This layer has the most critical gaps.**

#### Layer D: Agent Runtime

| MBS Specifies | NPA Workbench Uses | Alignment |
|---|---|---|
| Personal Productivity (Copilot/MBS-GPT) | N/A — we are Enterprise | N/A |
| Team Collaboration (M365/Teams) | N/A — we are Enterprise | N/A |
| **Enterprise Managed** | | |
| — Azure AI Foundry | Not used | — |
| — Google Agent Engine | Not used | — |
| — **On-Prem Dify Runtime in VPC/GCP** | Using **Dify Cloud**, not on-prem Dify. MBS specifies on-prem Dify in VPC/GCP | PARTIAL — Must migrate to self-hosted Dify |

**MAJOR FINDING: MBS explicitly lists "On-Prem DIFY Runtime in VPC/GCP" for Enterprise agents. We are using Dify Cloud (SaaS). For production, we need self-hosted Dify.**

#### Layer E: Agent Build/Design

| MBS Category | NPA Workbench | Alignment |
|---|---|---|
| No-Code (Copilot Chat, Gemini, MBS-GPT) | N/A — we are pro-code | N/A |
| **Low-Code (Dify Studio)** | **Dify Studio** — 16 apps built in Dify with visual workflow builder | ALIGNED |
| **Pro-Code (Azure AI Foundry, Google Vertex AI, Other Frameworks)** | | |
| — LangChain/LangGraph, CrewAI, Claude SDK | Not using LangGraph/CrewAI. Using Dify only. | — |
| — Claude Code ADK | Not using Claude ADK | — |
| — **Dify** | Using Dify | ALIGNED |
| — Google ADK | Not using | — |
| — A2A Standard | Not implemented | Phase 3 |

**Score: Dify is explicitly approved by MBS in both Low-Code AND Pro-Code tiers. We are on the right track.**

#### Layer F: Data Access & Control Plane

| MBS Specifies | NPA Workbench Has | Alignment |
|---|---|---|
| **Data Control & Governance** | | |
| — Federated Data Connectors | MCP tools connect to MySQL (77 tools). But no federated connectors to other MBS systems. | PARTIAL |
| — Data Access Control | RBAC on API routes. Per-agent tool allowlisting. But no data-level access control (row/column level) | PARTIAL |
| — Metadata Management | `ref_*` tables for templates, criteria, rules, field options. But no formal metadata catalog | PARTIAL |
| — Data Lineage | Form field lineage tracking (AUTO/ADAPTED/MANUAL). `npa_audit_log` tracks data provenance. | ALIGNED |
| **Data Sources: Internal** | | |
| — WorkIQ (Microsoft Graph) | Not connected | GAP |
| — Product System APIs | MCP tools serve as product system API layer | ALIGNED |
| — MBS Data Platform | Not connected (using standalone MySQL) | GAP |
| — Knowledge Bases | Dify KBs + `kb_documents` table + 3 KB search tools | ALIGNED |
| — Custom Connectors (JIRA, Confluence) | Not connected | Phase 3 |
| **Data Sources: External** | | |
| — Web search / Grounding | No web search capability | — |
| — **Other sources via MCP Tools** | 77 MCP tools. MBS explicitly calls out MCP Tools as a data source pattern. | ALIGNED |
| **Security** | | |
| — Controls (Data, Access, Secret) | JWT auth, RBAC, Helmet CSP, rate limiting. But API keys in env vars (no vault), no secret rotation | PARTIAL |

**Score: 3 aligned, 5 partial, 2 gaps. MCP Tools explicitly blessed by MBS.**

#### Layer G: Security

| MBS Specifies | NPA Workbench Has | Alignment |
|---|---|---|
| Controls (Data, Access, Secret) | Auth (JWT), RBAC (5-level), Rate Limiting, Helmet CSP, Audit Trail | PARTIAL |
| Secret Management | Env vars only. No Vault/AWS Secrets Manager. Hardcoded JWT fallback | GAP |

---

### 3. AGENT365 / MICROSOFT PATH — Alignment

| Microsoft Component | NPA Workbench | Required? | Status |
|---|---|---|---|
| **Agent 365 Control Plane** | Not registered in Agent 365 | YES for production | MUST REGISTER |
| **Entra Identity** | No Entra integration. Custom JWT auth. | YES — Agent Identity Blueprint required | MUST INTEGRATE |
| **Purview Data Governance** | No Purview. No AI interaction monitoring, no sensitive data detection, no risky prompt detection | YES for Enterprise | MUST INTEGRATE |
| **Defender Threat Protection** | No Defender. No MITRE ATT&CK pattern detection, no jailbreak detection | YES for Enterprise | MUST INTEGRATE |
| **Identity Blueprint** | No agent identity blueprint (Owner, Audit Log, Sign Log, Linked Agents) | YES | MUST CREATE |

**This is the biggest gap. Enterprise agents MUST register with Agent 365, integrate with Entra, Purview, and Defender.**

---

### 4. GOOGLE AGENT CLOUD — Alignment

| Google Component | NPA Workbench | Required? | Status |
|---|---|---|---|
| **Agent Cloud Registry** | `agent-registry.json` — local equivalent | Need to register in MBS Agent Cloud if deploying on GCP | PARTIAL |
| **Agent Identity: SPIFFE** | No SPIFFE identity. Custom JWT. | YES for enterprise agents on GCP | GAP |
| **Model Armor** | No Model Armor. No prompt safety, no data governance on AI interactions | YES | GAP |
| **Agent Observability** | No agent risk monitoring, no full logging/tracing, no evals | YES | GAP |
| **MCP Tools Registry** | `registry.py` with 77 tools — Google explicitly shows MCP Tools Registry | ALIGNED |
| **Agent Runtime/Engine** | Dify serves this role. Google shows Agent Engine. | ALIGNED via Dify |

---

### 5. HYBRID TARGET ARCHITECTURE — The Official MBS Target

The hybrid slide shows the **three-layer Agent Control Plane** that MBS is building:

| Layer | Purpose | NPA Workbench Status |
|---|---|---|
| **M365 SaaS** (Personal & Team) | Agent 365 for Copilot/Teams agents — registry, permissions, lifecycle | N/A for Enterprise agents (but registration may be required) |
| **Unified Layer** (Bank Integration) | Agent Registry, Agent Marketplace, Agent Policies, ALAN etc. | NOT CONNECTED — NPA Workbench operates standalone, not plugged into MBS Unified Layer |
| **Agent Cloud** (Enterprise Managed) | Agent Identity (SPIFFE), Model Armor, Agent Observability | NOT CONNECTED — No SPIFFE, no Model Armor, no centralized observability |

**The MBS target state requires all Enterprise agents to connect to the Unified Layer and Agent Cloud. We are entirely standalone today.**

---

## FINAL SCORECARD

### How Good Are We?

| MBS Framework Area | Score | Details |
|---|---|---|
| **Agent Categorization** | 100% | Correctly positioned as Enterprise Agent |
| **A: UX/UI (Workflow Workbench)** | 90% | Strong Angular workbench with 69 components |
| **B: AI Gateway** | 85% | Express proxy serves as AI Gateway |
| **C: Agentic Workflow Platform** | 45% | Registry + RBAC good. Guardrails, observability, eval MISSING |
| **D: Agent Runtime** | 70% | Dify is correct choice. But must move to self-hosted Dify in VPC |
| **E: Agent Build/Design** | 85% | Dify explicitly approved by MBS in both Low-Code and Pro-Code |
| **F: Data Access & Control** | 55% | MCP tools aligned. But no MBS Data Platform, no WorkIQ, no Purview |
| **G: Security** | 30% | Basic auth/RBAC only. No Entra, no Defender, no secret management |
| **Agent365 Control Plane** | 0% | Not registered. Must integrate with Agent 365, Entra, Purview, Defender |
| **Google Agent Cloud** | 10% | MCP tools aligned. But no SPIFFE, no Model Armor, no Agent Observability |
| **Hybrid Unified Layer** | 0% | Not connected to MBS Unified Layer, Agent Marketplace, or ALAN |

### Overall: ~50% Aligned

---

## The 7 Things That MUST Happen for MBS Compliance

| # | Action | Why | Effort |
|---|---|---|---|
| **1** | **Migrate to self-hosted Dify in VPC/GCP** | MBS explicitly specifies "On-Prem Dify Runtime in VPC/GCP" for Enterprise agents. Dify Cloud is NOT compliant. | 2-3 weeks |
| **2** | **Register in Agent 365 Control Plane** | All Enterprise agents must have Identity Blueprint (Owner, Audit Log, Sign Log, Linked Agents). Must register agent inventory. | 1-2 weeks |
| **3** | **Integrate Entra for Agent Identity** | Replace custom JWT with MBS Entra identity. Agent identity, access policy, identity blueprint required. | 2 weeks |
| **4** | **Integrate Purview for Data Governance** | AI interaction monitoring, sensitive data detection, risky prompt detection, data access control. Replaces our missing PII scanning. | 2-3 weeks |
| **5** | **Integrate Defender for Threat Protection** | MITRE ATT&CK pattern detection, jailbreak detection, credential theft prevention. Covers our missing prompt injection defense. | 1-2 weeks |
| **6** | **Implement SPIFFE Agent Identity** | Required for Google Agent Cloud path. SPIFFE CA server for cryptographic agent identity. | 2 weeks |
| **7** | **Connect to MBS Unified Layer** | Agent Registry, Agent Marketplace, Agent Policies, ALAN integration. Without this, we are an island. | 3-4 weeks |

---

## What We Got RIGHT (Celebrate These)

| What | Why It Matters |
|---|---|
| **Dify** | MBS explicitly approves Dify in BOTH Low-Code and Pro-Code tiers. Listed in every architecture slide. |
| **MCP Tools** | MBS explicitly shows "MCP Tools Registry" in Google Agent Cloud AND "Other sources via MCP Tools" in Data Sources. Our 77 MCP tools are architecturally aligned. |
| **Claude Code ADK** | Listed in every Build tier alongside Dify. Future migration path validated. |
| **A2A Standard** | Listed in Google path. Our architecture doc plans for this in Phase 3. |
| **Workflow Workbench** | Exactly the UX pattern MBS specifies in Layer A. |
| **Full SDLC** | Jenkins, Docker, OpenShift, Railway — meets Enterprise agent requirements. |
| **3-in-a-box development** | COO domain (Business) + MCP tools (Data Chapter) + Angular/Python (Tech). |

---

## What We Got WRONG (Fix These)

| What | Impact |
|---|---|
| **Dify Cloud instead of self-hosted Dify** | Data leaves MBS network. Non-compliant for Enterprise tier. |
| **Custom JWT instead of Entra** | Not integrated with MBS identity management. Agent identity not discoverable. |
| **No Purview/Model Armor** | No AI interaction monitoring, no sensitive data detection. MBS mandates this. |
| **No Defender** | No threat protection (jailbreak, prompt injection, credential theft). |
| **No SPIFFE** | No cryptographic agent identity for Google path. |
| **Standalone — not connected to MBS Unified Layer** | Invisible to Agent Marketplace, Agent Policies, ALAN. |
| **No observability** | MBS requires Agent Observability in both Microsoft and Google paths. |

---

## Cross-Reference: MBS Framework vs Our Architecture Documents

| Document | Purpose | Alignment |
|---|---|---|
| `ENTERPRISE-AGENTIC-ARCHITECTURE-APAC-BANK.md` | 7-plane architecture for APAC banks | Strong theoretical alignment. Covers Trust, Observability, Operations planes that MBS mandates. |
| `docs/Architecture Research V3.md` | Maps 7-plane architecture to NPA Workbench with Dify/Python/Angular constraints | Identifies same gaps as this report. Priority matrix aligns. |
| `docs/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md` | Phase 0 Dify agent design | Well-designed agent hierarchy. Needs MBS control plane integration. |
| `docs/AGENT_ARCHITECTURE.md` | Detailed agent responsibilities and tool access | Tool governance is strong. Matches MBS Layer C requirements for tool inventory. |
| This report | Maps against official MBS framework slides | Identifies MBS-specific requirements (Entra, Purview, Defender, SPIFFE, Agent 365) not covered in other docs. |

---

## Recommended Reading Order for New Team Members

1. This report (MBS alignment — where we stand)
2. `docs/Architecture Research V3.md` (7-plane mapping — what to build)
3. `ENTERPRISE-AGENTIC-ARCHITECTURE-APAC-BANK.md` (theoretical foundation)
4. `docs/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md` (current agent design)
5. `docs/AGENT_ARCHITECTURE.md` (detailed agent specs)

---

*This report should be reviewed with MBS Enterprise Architecture team to confirm Agent 365 registration requirements and Unified Layer integration timeline.*
