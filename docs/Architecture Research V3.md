---
Show less
# Agent Architecture Research: Salesforce, Stripe, and Google
---
## SALESFORCE AGENTFORCE
### 1. Platform Overview and Structural Layers
Agentforce is organized under the "Agentforce 360" umbrella, which comprises four major layers: Agentforce 360 (the agentic AI platform), Data 360 (formerly Data Cloud, the data grounding layer), Customer 360 Apps (CRM applications), and Slack (the primary workspace integration surface). The platform is metadata-driven, meaning agents are contextually aware of business data, permissions, workflows, and user roles through the existing Salesforce schema.
---
### 2. Atlas Reasoning Engine
The Atlas Reasoning Engine is the core cognitive component, developed at Salesforce AI Research. Its architectural characteristics:
**Core Loop: ReAct (Reason-Act-Observe)**
Atlas operates on a Reason-Act-Observe loop where the engine thinks through a step, takes an action, checks the outcome, and iterates until goal completion. It can request clarification mid-task.
**Flywheel Process:**
1. Data retrieval from Salesforce Data Cloud
2. Evaluation — generates a plan, assesses likely outcomes
3. Refinement — loops back if confidence threshold is not met
4. Execution — commits to the selected action path
   **Technical Architecture:**
- Asynchronous, event-driven architecture using a publish-subscribe pattern
- Decoupled component nodes of strongly typed functions
- Enables concurrent task processing in parallel across nodes
- Declarative agent creation through YAML files (enabling fast deployment and scalability)
- Modular components: planners, action selectors, memory modules, reflection loops
  **Guided Determinism / Agent Graph (2025 addition):**
  Rather than pure LLM non-determinism, Salesforce introduced "guided determinism" via the Agent Graph. A business workflow is modeled as a graph of nodes (discrete tasks) and edges (transitions). The agent graph runtime explicitly manages persistent states, tracking primary goal, conversation history, and current graph position. This externalizes reasoning into design-time graphs so that compliance-critical paths (e.g., identity verification before account access) are structurally enforced, not just prompted.
  **Agent Script** (late 2025) pairs deterministic workflows with flexible LLM reasoning — a hybrid model giving enterprise teams precise control over sensitive steps while retaining LLM adaptability for conversational sub-tasks.
---
### 3. Topics, Actions, and Instructions Component Model
Agentforce agents are configured through three core building blocks:
**Topics**
- The "jobs-to-be-done" unit — a container that scopes what an agent is allowed to do
- Each topic has: a classification description, scope boundaries, and instructions
- Topics contain the actions available for that job and define when the agent activates for a given user intent
  **Actions**
- Predefined tasks the agent can execute within a topic
- Types include: invocations of Salesforce Flows, Apex code, external API calls, and Data Cloud queries
- Actions are the function-calling layer — they are the specific tool calls the agent can make
  **Instructions**
- The minimum ruleset defining when and how to use each action
- Can impose guardrails at the conversation level (e.g., required tone, restricted domains)
  **Agent Builder** is the low-code configuration surface where admins and developers define topics, instructions, actions, and guardrails using natural language and drag-and-drop tooling.
---
### 4. Einstein Trust Layer
The Trust Layer is the security and safety architecture that wraps every prompt-to-response journey.
**Data Masking:**
- Uses a Named Entity Detection tool with broad coverage: PII (names, emails, phone numbers), government IDs, PCI data (card numbers)
- PII elements are substituted with designated placeholders before the prompt leaves Salesforce to the LLM
- Masking is reversible on the response side (the Trust Layer re-substitutes real values back before delivery to the user)
  **Zero Data Retention:**
- Contractual agreements with LLM providers (including OpenAI) include zero data retention commitments
- Customer data is never stored on third-party LLM provider infrastructure
- OpenAI's enterprise API forgets both the prompt and the output the moment it is processed
  **Toxicity Detection:**
- Machine learning models score every prompt and response across five categories: violence, sexual, profanity, hate, and physical harm
- Configurable thresholds allow orgs to define acceptable score bands
  **Prompt Injection Defense:**
- Prompt defense heuristics including instruction defense and post-prompting instructions
- Designed to prevent adversarial manipulation of the LLM to expose unauthorized data or bypass guardrails
  **Audit Trail:**
- Every step of the prompt-to-response journey is timestamped and logged
- Log includes: original prompt, data masking operations, toxicity scores, LLM output (pre-filter), final delivered response, and any user feedback
- Used for compliance, debugging, and model refinement
---
### 5. Data Grounding via Data 360 (formerly Data Cloud)
**Architecture:**
- Data 360 unifies structured CRM data, unstructured content, data lakes, and warehouses into a single semantic layer
- Real-time sync of Salesforce CRM objects (Contact, Account, Case, Opportunity) with minimal batch latency
- Agents retrieve context through RAG (Retrieval Augmented Generation) queries against the unified data model
  **Grounding Mechanism:**
- Atlas queries Data 360 at reasoning time to ground responses in actual customer history, case context, and business records
- This is the primary hallucination mitigation mechanism — agents cannot fabricate data that contradicts the live CRM record
- Intelligent Context (2026 addition) extends grounding to complex unstructured data
  **Customer 360 Integration:**
- Agents are natively integrated with all Customer 360 apps — Sales Cloud, Service Cloud, Marketing Cloud, Commerce Cloud
- Agents can both read context and take write actions (update records, create cases, log activities) within the flow of work
---
### 6. Multi-Agent Orchestration — MuleSoft Agent Fabric
MuleSoft Agent Fabric is Salesforce's enterprise-grade multi-agent orchestration layer:
**Four Pillars:**
1. **Agent Registry** — Central catalog where every AI agent or tool (including MCP servers and A2A endpoints) is registered and made discoverable by developers or other agents
2. **Agent Broker** — Intelligent routing service that organizes agents and tools into business-focused domains, routing complex multi-step processes across systems; the semantic layer that matches task intent to the right registered agent
3. **Agent Fabric Runtime** — Executes cross-agent workflows, supporting both internal Agentforce agents and third-party agents (ServiceNow, Workday, SAP, etc.)
4. **Agent Visualizer** — Dynamic map of the agent ecosystem showing connections, interaction patterns, and performance metrics; provides observability for IT governance
   **Protocol Support:** Native support for both MCP (Model Context Protocol) and A2A (Agent2Agent protocol), making registered agents accessible through either standard
---
### 7. Human Escalation Patterns
Salesforce defines several canonical escalation architectural patterns:
**Greeter Pattern:**
- Agent collects user intent through natural language
- Routes to the appropriate human agent with a warm handoff summary
- Simple, lowest-friction escalation path
  **Operator Pattern:**
- Builds on Greeter by adding routing to specialist agents or specialist humans
- Negotiates intent if initial routing fails
- Configurable escalation resources: humans OR other agents
  **Escalation Triggers (configurable):**
- Sentiment-based: negative sentiment detected above threshold
- Confidence-based: agent confidence in answer falls below threshold
- Categorical: legal, security, or sensitive topics trigger mandatory escalation
  **Handoff Architecture:**
- Integrates with Omni-Channel for skills-based routing (transferring to agents with relevant expertise, not just availability)
- Conversation context is injected into Service Cloud Live Agent queue
- Full conversation transcript, summary, detected intent, and actions already taken are passed in the handoff payload
- The "amnesia problem" (customer forced to repeat themselves) is explicitly called out as a failure mode Salesforce engineers against
---
### 8. Five Levels of Determinism
Salesforce formally defines five levels of control that enterprises can configure:
1. **Full LLM Autonomy** — minimal guardrails, maximum flexibility
2. **Topic-scoped LLM** — LLM operates only within defined topic boundaries
3. **Instruction-guided LLM** — explicit instructions constrain behavior within topics
4. **Hybrid Reasoning** — Agent Script / Agent Graph enforces deterministic paths for critical steps while allowing LLM handling for conversational tasks
5. **Fully Deterministic** — Flows and Apex execute fixed logic; LLM is used only for NLU (parsing intent), not for decision-making
---
## STRIPE
### 1. Architectural Philosophy: Payment Infrastructure for the Agent Economy
Stripe's agent architecture is not a single product but a layered stack of primitives, protocols, and SDKs designed to make Stripe APIs natively consumable by AI agents. Their stated design principle: "trust can't be inferred — it has to be explicitly granted, scoped, and enforced in code."
---
### 2. Stripe Agent Toolkit (SDK Layer)
**Language Support:** Python and TypeScript, built on top of the official Stripe SDKs
**Integration Targets:** OpenAI Agent SDK, LangChain, CrewAI — passed as a list of tools using the standard function-calling interface
**Scope-Limited by Design:**
The toolkit deliberately does not expose the full Stripe API surface. With a growing tool count, the probability of an LLM selecting the correct tool decreases; therefore the toolkit is scoped to the highest-utility agent operations to maintain accuracy.
**Key Operations Exposed:**
- `create_customer`, `list_customers`
- `create_payment_link`, `create_invoice`, `create_subscription`
- `list_refunds`, `create_refund`
- `get_stripe_account_info`
- Payment troubleshooting and dispute visibility tools
- Metered billing management
  **Development Guidance:** Because agent behavior is non-deterministic, Stripe explicitly recommends using the SDK in sandbox mode and running evaluations before production deployment.
---
### 3. MCP Server Architecture
**Remote Server:** Stripe hosts a production-grade remote MCP server at `https://mcp.stripe.com`
**Authentication:**
- OAuth Dynamic Client Registration (per MCP spec)
- Supports both OAuth flows and Restricted API Key authentication
- All requests require HTTPS with `Authorization: Bearer {token}`
- All webhook events include HMAC signatures as request headers
  **Permission Model:**
- The MCP server is permission-aware — it only exposes tools that match the permissions scoped on the connecting Restricted API Key
- Operators control exactly what the LLM can and cannot do at the key configuration level
  **Tool Count:** 23 tools organized into categories covering customer management, product/price management, subscriptions, invoices, payment history search, and Stripe documentation access
  **Architecture Pattern:** MCP follows a client-server model where MCP Hosts (Claude Desktop, Cursor, IDE integrations) connect to the Stripe MCP Server which proxies to Stripe's APIs. A gateway layer handles connector registration, virtual server creation, unified authentication, request routing, and audit logging.
---
### 4. Agentic Commerce Suite and Payment Primitives
Stripe launched the Agentic Commerce Suite in December 2025, comprising three major components:
**Shared Payment Tokens (SPTs):**
The primary new payment primitive for agent-initiated commerce.
- Issued by the AI platform when a user confirms intent to purchase
- Each token is cryptographically scoped to: a specific seller, a time window, a maximum amount, and a specific payment method
- The agent never receives or handles raw card credentials
- Tokens are revocable at any time by the issuing platform
- Observable throughout their lifecycle via webhook events
- Powered by Stripe Radar — tokens carry risk signals including: fraud probability, card testing likelihood, stolen card signals, and issuer decline indicators
  **Flow:**
1. User confirms intent to buy → AI platform calls Stripe to issue SPT
2. SPT specifies: recipient seller, transaction amount, payment method reference
3. Agent passes SPT to the merchant through a secure API the merchant exposes
4. Merchant processes the SPT through Stripe — card credentials are never exposed to the agent
5. Stripe Radar evaluates the SPT's embedded risk signals
6. Transaction completes with full audit trail and reconciliation metadata
   **Temporary Virtual Cards (Stripe Issuing):**
- For agent-initiated B2B or agent-to-agent purchases
- A temporary virtual card number is created scoped to the specific agent transaction
- Agent does not access real card details
- Payment goes through a Stripe-verified flow with fraud detection, receipts, and reconciliation-ready metadata
---
### 5. Protocol Stack for Agentic Payments
Stripe has positioned itself at the intersection of three emerging protocols:
**Agentic Commerce Protocol (ACP):**
- Co-developed with OpenAI (already in production in ChatGPT checkout)
- Open standard that defines how a merchant exposes checkout to AI agents
- RESTful HTTP interface with four defined endpoints
- Allows agents to discover products, initiate purchases, and confirm transactions using the merchant's existing commerce infrastructure
- Specification maintained at `github.com/agentic-commerce-protocol`
  **x402 (HTTP Payment Protocol):**
- Built on the long-dormant HTTP 402 "Payment Required" status code
- Stripe's implementation uses USDC on Base blockchain (Coinbase's L2)
- Flow: Agent requests a paid resource → receives HTTP 402 with payment details → agent sends USDC on-chain → access is granted automatically
- Designed for machine-to-machine payments: API calls, compute time, data access, digital services
- No account creation required; payments are programmatic and instant
- Stripe partnered with Base (Coinbase) in February 2026 for the live launch
  **Protocol Layering:**
- ACP handles the checkout and merchant integration layer
- x402 handles the execution layer for instant programmatic payments
- SPTs bridge the two by providing the authorization token that both protocols can reference
---
### 6. Agent Safety in Financial Transactions
Stripe's safety architecture for agent-driven payments operates on multiple layers:
**Identity and Authorization:**
- Every agent transaction requires explicit user-granted authorization (the SPT is the evidence of this authorization)
- Business identity validation and buyer identity confirmation are separate, independent steps
- The authorization is scoped — an SPT for $50 at Merchant A cannot be used for $200 at Merchant B
  **Fraud Infrastructure:**
- Stripe Radar applies to all SPT-based transactions, with the SPT carrying additional signals about the agent's behavior patterns
- The system is designed to distinguish between high-intent agents (acting on confirmed user intent) and low-trust automated bots
- Risk signals include: transaction velocity, payment method age, device fingerprint of the originating session
  **Audit and Reconciliation:**
- Full audit trail from intent confirmation through transaction execution
- Reconciliation-ready metadata on every agent-initiated transaction
- Human review is built into the SPT flow — the system "loops a human back in for approval before purchasing"
---
### 7. Developer Experience Design Principles
- **Function Calling as the Integration Primitive:** All Stripe agent integrations use standard LLM function calling — no proprietary protocols required
- **Sandbox-First:** Agent toolkit is designed for sandbox evaluation before production
- **Scope Limiting:** Both the MCP server (via Restricted API Keys) and the Agent Toolkit (by API surface limitation) enforce minimal-permission-by-design
- **Framework Agnostic:** Works with OpenAI, LangChain, CrewAI, and any MCP-compatible client
- **github.com/stripe/ai:** Stripe's one-stop repository for all AI/agent integration resources
---
## GOOGLE
### 1. Vertex AI Agent Builder — Platform Architecture
Vertex AI Agent Builder is Google Cloud's suite for building, scaling, and governing agents in production. It is composed of three distinct layers:
**Agent Development Kit (ADK)** — the build layer  
**Agent Engine** — the deployment and runtime layer  
**Agent Garden** — the discovery and reuse layer (sample agents, pre-built tools)
---
### 2. Agent Development Kit (ADK)
**Language Support:** Python (GA), Java (GA), TypeScript (released 2025)  
**Model Support:** Optimized for Gemini but model-agnostic; compatible with Anthropic, Mistral, Llama, and others  
**Framework Support:** Compatible with LangChain, LlamaIndex, CrewAI  
**Tool Support:** Pre-built tools (Google Search, Code Execution), MCP tools, third-party library tools, other agents as tools
**Agent Type Taxonomy:**
| Type | Description | Use Case |
|---|---|---|
| LlmAgent (Agent) | Uses LLM as core engine; dynamic decision-making; natural language understanding | Conversational tasks, flexible reasoning |
| SequentialAgent | Executes sub-agents in strict predefined order; deterministic pipeline | Multi-step pipelines where order matters |
| ParallelAgent | Runs all sub-agents concurrently | Independent tasks, fan-out processing |
| LoopAgent | Repeatedly executes sub-agents until exit condition | Polling, retry logic, quality gate loops |
| Custom Agent (BaseAgent) | Fully programmable agent with arbitrary control flow | Complex workflows requiring custom logic |
**Multi-Agent Communication:**
- Agents are organized into a parent-child hierarchy (each agent has exactly one parent)
- Shared state via `context.state` — one agent writes a key-value pair, a subsequent agent reads it
- `output_key` property on LlmAgent automatically saves final response to a named state key
- Conversation history and relevant context automatically transfer when a parent delegates to a sub-agent
  **ADK Design Philosophy:** "Agent development should feel like software development" — the framework uses standard Python/Java/TypeScript patterns rather than proprietary abstractions
---
### 3. Agent Engine (Deployment and Runtime Layer)
Agent Engine is the managed production runtime. It provides:
**Sessions (GA):**
- Managed session service maintaining conversational context across turns
- Each session contains a chronological sequence of messages and actions (SessionEvents)
- Sessions are the source data for Memory Bank generation
  **Memory Bank (GA as of 2025):**
- Long-term memory service that transforms stateless interactions into stateful, contextual experiences
- Generates memories from completed sessions
- Memories are scoped to a specific user identity — an agent can remember preferences, history, and key details across multiple sessions
- Architecture: sessions feed memory generation pipelines → memories stored in indexed form → retrieved at session start to populate agent context
  **Evaluation Service:**
- Gen AI evaluation service using Vertex AI SDK's GenAI Client
- Example Store from Vertex AI for storing reference input-output pairs
- Tracing: visualization of exactly how agents process requests, make decisions, and interact with tools
- Performance bottleneck identification, reasoning error detection, unexpected behavior logging
  **Code Execution:**
- Sandboxed code execution environment for agents that need to run computational tasks
- Part of the managed Agent Engine runtime
  **Threat Detection (Preview):**
- Built-in service of Security Command Center
- Detects and investigates potential attacks on agents deployed to Agent Engine Runtime
- Designed to identify adversarial inputs, prompt injection attempts, and anomalous agent behavior
---
### 4. Agent Security Architecture
**Agent Identity:**
- Agents are given unique, native identities within Google Cloud as first-class IAM (Identity and Access Management) principals
- This enables true least-privilege access at the agent level — not just at the service account level
- Granular policies and resource boundaries can be applied per-agent for compliance
  **Context-Aware Access (CAA):**
- Agent identity credentials are secured by default through a Google-managed CAA policy
- CAA evaluates device, location, user identity, and request context before granting agent access to downstream resources
  **Tool Governance (via Cloud API Registry):**
- Cloud API Registry integration into Agent Builder provides a centralized catalog for all MCP servers and Google Cloud tools
- Administrators can view, govern, and manage the entire suite of tools available to their development teams
- Pre-built tools for Google services coexist with custom MCP servers in the same governed catalog
- Prevents developers from deploying ungoverned tools that bypass security policies
---
### 5. Grounding Architecture
Google provides three grounding mechanisms, each targeting a different data source type:
**Grounding with Google Search:**
- Real-time web grounding for current public information
- Generates citations with source URLs
- Appropriate for general-purpose agents needing up-to-date world knowledge
  **Grounding with Vertex AI Search (Enterprise Data):**
- Connects agents to organization's indexed internal documents
- Architecture: user prompt → LLM determines whether VertexAiSearchTool invocation is needed → Vertex AI Search retrieves and ranks relevant document chunks via semantic similarity and relevance scoring → retrieved chunks injected into LLM context → LLM generates grounded response
- Data stores support: website data, PDFs, documents, structured data
- Configured via a data store ID referenced in the agent's tool configuration
  **Grounding with Custom Search API:**
- For organizations with proprietary search infrastructure
- Allows plugging in any retrieval backend through a standardized interface
  **RAG Integration:**
- Vertex AI provides a managed RAG API layer that abstracts chunking, embedding, indexing, and retrieval
- Agents consume grounding results through a standardized tool interface regardless of the backing data source
---
### 6. A2A Protocol (Agent2Agent)
Google announced A2A in April 2025 with 50+ tech partners (Salesforce, Atlassian, PayPal, among others). Key architectural components:
**AgentCard:**
- JSON file published at `/.well-known/agent.json` on every A2A-compliant agent's endpoint
- Contents: agent name, description, service endpoint URLs, version, supported A2A features (streaming, push notifications), specific skills, default input/output modalities, authentication requirements
- Discovery mechanism: a client agent fetches the AgentCard to learn what the agent can do and how to connect
  **Task Lifecycle:**
- The Task is the fundamental unit of work, identified by a unique ID
- Defined state machine: `submitted → working → input-required → completed / failed / canceled / rejected`
- Both client and server use the state machine to stay synchronized on progress
- Tasks are designed to support both quick completions and long-running work (hours or days)
  **Communication Protocols:**
- Transport: JSON-RPC 2.0 over HTTP(S)
- Synchronous: standard request-response
- Streaming: Server-Sent Events (SSE) for real-time progress
- Asynchronous: push notifications for long-running tasks
- Streaming format: stream begins with Task object → followed by zero or more TaskStatusUpdateEvent or TaskArtifactUpdateEvent objects → closes when task reaches terminal state
  **A2A vs. MCP (Important Distinction):**
- MCP = agent-to-tool communication (one agent accessing external tools, APIs, data sources)
- A2A = agent-to-agent communication (one agent delegating tasks to another agent)
- They are complementary layers: an A2A client can delegate to an A2A server, which uses MCP internally to access tools
- As of September 2025, A2A adoption slowed significantly while MCP became the de facto standard; most of the ecosystem consolidated around MCP, with A2A largely absorbed into MCP's expanding scope
---
### 7. Multi-Agent Orchestration Patterns in ADK
Google's ADK documentation defines the following canonical multi-agent patterns:
**Pipeline Pattern (SequentialAgent):**
- Assembly-line execution where each sub-agent's output becomes the next agent's input via shared `context.state`
- Used for document processing, multi-stage analysis, report generation
  **Fan-Out / Fan-In (ParallelAgent):**
- Root agent fans out to multiple specialized agents simultaneously
- Results collected and synthesized by a downstream aggregator agent
  **Draft-and-Review Loop (LoopAgent + SequentialAgent):**
- LoopAgent wraps a SequentialAgent containing a drafter and a reviewer
- LoopAgent enforces the quality gate and exit condition (e.g., reviewer approves or max iterations reached)
- Used for content generation, code review, data validation workflows
  **Dynamic Routing (LlmAgent transfer):**
- LLM-driven agent selection rather than predetermined routing
- Root LlmAgent determines which sub-agent to delegate to based on the content of the user's request
- Adaptive behavior for open-ended task routing
  **Coordinator-Specialist Pattern:**
- Coordinator agent receives user request and maintains goal tracking
- Delegates to specialist sub-agents (each with narrow expertise and appropriate tool access)
- Coordinator synthesizes specialist outputs into the final response
- Conversation history transfers automatically to specialist so context is never lost
---
## CROSS-PLATFORM COMPARISON: KEY ARCHITECTURAL DIFFERENTIATORS
| Dimension | Salesforce Agentforce | Stripe | Google ADK/Vertex |
|---|---|---|---|
| Primary Domain | Enterprise CRM automation | Payment infrastructure | General-purpose cloud agents |
| Reasoning Engine | Atlas (ReAct + Agent Graph hybrid) | LLM function calling (model-agnostic) | LlmAgent (Gemini-optimized, model-agnostic) |
| Determinism Control | Five levels, guided determinism via Agent Graph, Agent Script | Scope-limited toolkits, SPT authorization scoping | Workflow agents (Sequential/Parallel/Loop) + LLM routing |
| Trust/Safety Architecture | Einstein Trust Layer (masking, toxicity, ZDR, audit) | SPT scoping, Radar risk signals, OAuth-scoped MCP keys | IAM-first agent identities, CAA policies, Threat Detection |
| Data Grounding | Data 360 RAG (CRM-native) | Not a primary concern (payments domain) | Vertex AI Search, Google Search, custom search API |
| Multi-Agent Coordination | MuleSoft Agent Fabric (Registry, Broker, Visualizer) | Not architecturally defined | ADK agent hierarchies, A2A protocol, SequentialAgent |
| Inter-agent Protocol | A2A + MCP support via Agent Fabric | MCP (primary), ACP (payments-specific), x402 | A2A (originated), MCP (adopted), ADK state sharing |
| Human Escalation | Greeter/Operator patterns, Omni-Channel integration | Human-in-loop approval before SPT issuance | Not a platform-level pattern (left to implementation) |
| Memory | Agent context + Data 360 session history | Not a platform concern | Sessions (short-term) + Memory Bank (long-term, GA) |
| Developer Surface | Agent Builder (low-code), YAML, Apex, Flow | Agent Toolkit SDK, MCP server, ACP API spec | ADK (code-first Python/Java/TS), Agent Designer (low-code) |
---
Sources:
- [Salesforce Agentforce 2026 Updates](https://salesforcemonday.com/2026/01/29/agentforce-january-2026-updates-features/)
- [Inside the Atlas Reasoning Engine - Salesforce Engineering](https://engineering.salesforce.com/inside-the-brain-of-agentforce-revealing-the-atlas-reasoning-engine/)
- [Atlas Reasoning Engine - Salesforce](https://www.salesforce.com/agentforce/what-is-a-reasoning-engine/atlas/)
- [Agentforce's Agent Graph: Toward Guided Determinism](https://engineering.salesforce.com/agentforces-agent-graph-toward-guided-determinism-with-hybrid-reasoning/)
- [Achieving Reliable Agent Behavior - Five Levels of Determinism](https://www.salesforce.com/agentforce/five-levels-of-determinism/)
- [Einstein Trust Layer](https://www.salesforce.com/products/secure-ai/)
- [Inside the Einstein Trust Layer](https://developer.salesforce.com/blogs/2023/10/inside-the-einstein-trust-layer)
- [Trust Layer Developer Guide](https://developer.salesforce.com/docs/einstein/genai/guide/trust.html)
- [Agentic Patterns and Implementation](https://architect.salesforce.com/fundamentals/agentic-patterns)
- [Enterprise Agentic Architecture and Design Patterns](https://architect.salesforce.com/docs/architect/fundamentals/guide/enterprise-agentic-architecture)
- [MuleSoft Agent Fabric](https://www.mulesoft.com/ai/agent-fabric)
- [Salesforce Launches MuleSoft Agent Fabric](https://www.salesforce.com/news/stories/mulesoft-agent-fabric-announcement/)
- [How Data Cloud Powers Agentforce](https://www.salesforce.com/news/stories/how-data-cloud-powers-agentforce/)
- [Introducing Hybrid Reasoning with Agent Script](https://developer.salesforce.com/blogs/2025/10/introducing-hybrid-reasoning-with-agent-script)
- [Stripe Agentic Commerce Suite Blog](https://stripe.com/blog/agentic-commerce-suite)
- [Stripe Introduces Agentic Commerce Solutions](https://stripe.com/blog/introducing-our-agentic-commerce-solutions)
- [Stripe Shared Payment Tokens Documentation](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens)
- [Stripe Agentic Commerce Protocol Documentation](https://docs.stripe.com/agentic-commerce/protocol)
- [Stripe MCP Documentation](https://docs.stripe.com/mcp)
- [Stripe Build on LLMs](https://docs.stripe.com/building-with-llms)
- [Adding Payments to Agentic Workflows - Stripe Dev Blog](https://stripe.dev/blog/adding-payments-to-your-agentic-workflows)
- [x402 Documentation](https://docs.stripe.com/payments/machine/x402)
- [Stripe AI GitHub Repository](https://github.com/stripe/ai)
- [Agentic Commerce Protocol GitHub](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [Google Agent Development Kit Docs](https://google.github.io/adk-docs/)
- [ADK Multi-Agent Systems](https://google.github.io/adk-docs/agents/multi-agents/)
- [Vertex AI Agent Builder Overview](https://docs.cloud.google.com/agent-builder/overview)
- [Vertex AI Agent Engine Overview](https://docs.cloud.google.com/agent-builder/agent-engine/overview)
- [Vertex AI Memory Bank Overview](https://docs.cloud.google.com/agent-builder/agent-engine/memory-bank/overview)
- [Google ADK Developer Blog](https://developers.googleblog.com/en/agent-development-kit-easy-to-build-multi-agent-applications/)
- [Developer's Guide to Multi-Agent Patterns in ADK](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/)
- [Announcing the A2A Protocol](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A Protocol Specification](https://a2a-protocol.org/latest/specification/)
- [Grounding with Vertex AI Search](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-vertex-ai-search)
- [New Enhanced Tool Governance in Vertex AI Agent Builder](https://cloud.google.com/blog/products/ai-machine-learning/new-enhanced-tool-governance-in-vertex-ai-agent-builder)
- [MCP vs A2A Comparison](https://www.descope.com/blog/post/mcp-vs-a2a)
  agentId: aae56c118adda597b (for resuming to continue this agent's work if needed)
  <usage>total_tokens: 64103
