# Microsoft and Open-Source Agent Framework Architecture: Deep Technical Analysis

## PART 1: MICROSOFT ECOSYSTEM

---

### 1.1 AutoGen — Multi-Agent Conversation Framework

**Current State (2025-2026):** AutoGen underwent a ground-up redesign in v0.4 (January 2025), converging with Semantic Kernel into the unified **Microsoft Agent Framework** (GA: October 2, 2025). The legacy AutoGen 0.2 patterns still exist in documentation but are in maintenance mode.

#### Layered Architecture (AutoGen 0.4 / Agent Framework)

```
┌──────────────────────────────────────────────────────────┐
│   Layer 3: Extensions                                    │
│   (Third-party integrations, advanced agents/teams)      │
├──────────────────────────────────────────────────────────┤
│   Layer 2: AgentChat                                     │
│   (Simple API, RoundRobinGroupChat, SelectorGroupChat,   │
│    streaming, serialization, state management)           │
├──────────────────────────────────────────────────────────┤
│   Layer 1: AutoGen Core                                  │
│   (Actor model, async message passing,                   │
│    event-driven runtime, cross-language)                 │
└──────────────────────────────────────────────────────────┘
```

#### Actor Model (Core Layer)

- Each agent is an **actor**: an isolated computational unit that receives messages, maintains private state, and sends messages to other actors
- Built on **Microsoft Orleans** underpinnings for distributed concurrency
- Agents communicate exclusively through message passing — no shared mutable state
- Supports **embedded runtime** (single-process) and **experimental distributed runtime** (cross-machine)
- Cross-language: Python and .NET agents can participate in the same runtime via A2A protocol

#### ConversableAgent (Legacy 0.2) / ChatCompletionAgent (Current)

```python
# AutoGen 0.2 pattern (legacy, still documented)
ConversableAgent
  ├── AssistantAgent     (LLM-driven, no human proxy)
  └── UserProxyAgent     (human proxy + code executor)

# AutoGen 0.4 / AgentChat pattern (current)
ChatCompletionAgent
  ├── system_message (persona/role)
  ├── model_client   (LLM backend, model-agnostic)
  ├── tools          (function tools)
  └── handoffs       (for Swarm/Handoff patterns)
```

#### GroupChat Patterns

The original `GroupChat` (0.2) had a single shared thread where all agents see all messages. AutoGen 0.4 introduced structured team patterns:

- **RoundRobinGroupChat**: Fixed turn order, every agent speaks once per round
- **SelectorGroupChat**: An LLM-powered selector agent routes to the next appropriate agent based on conversation state
- **Swarm**: Agents can hand off control using `handoffs` declarations — the currently active agent decides who speaks next
- **MagenticOneGroupChat**: The Magentic-One orchestrator pattern (see below)

#### Magentic-One Architecture

Magentic-One is the flagship multi-agent system inside AutoGen:

```
Orchestrator Agent
  ├── Task Ledger    (facts, assumptions, plan)
  ├── Progress Ledger (self-reflection, completion check)
  └── Directs specialized sub-agents:
       ├── WebSurfer   (Chromium browser control — navigate, click, type, read)
       ├── FileSurfer  (local file reading, markdown preview)
       ├── Coder       (code writing)
       └── ComputerTerminal (code execution)
```

The Orchestrator maintains an **outer loop** (replanning when blocked) and an **inner loop** (step-by-step delegation). It can dynamically revise the plan if an agent reports failure. All agents default to GPT-4o but are model-agnostic.

---

### 1.2 Semantic Kernel — SDK Architecture

**Current State:** Semantic Kernel is the foundational SDK layer. The `AgentGroupChat` pattern was deprecated; production use points to the new **Agent Orchestration** patterns within Microsoft Agent Framework.

#### Core Kernel Object

```
Kernel
  ├── AI Service Registry    (ChatCompletion, TextGeneration, Embedding services)
  ├── Plugin Registry        (Functions exposed as tool-callable units)
  ├── Memory (ISemanticTextMemory)
  ├── Filter Pipeline        (pre/post function invocation hooks)
  └── Dependency Injection   (IServiceProvider-backed)
```

#### Plugins (the tool layer)

Three import paths for plugins:

1. **Native code**: C# or Python classes with `[KernelFunction]` attributed methods — leverages existing codebase dependencies
2. **OpenAPI specification**: Auto-imports REST endpoints as callable functions
3. **MCP Server**: Model Context Protocol servers become plugin sources — enables 1400+ connector ecosystem

#### Planners → Function Calling Evolution

The original SK Planners (SequentialPlanner, StepwisePlanner, HandlebarsPlanner) are **deprecated**. The replacement is native **function calling** (OpenAI, Gemini, Claude, Mistral all support it natively):

- The Kernel presents registered plugins as the tool manifest to the LLM
- The LLM emits tool-call requests; the Kernel executes and feeds results back
- This is now called the **Auto Function Invocation Loop**

#### Memory Architecture

```
ChatHistory              → Short-term, per-session conversation buffer
ISemanticTextMemory      → Vector store abstraction (Azure AI Search, Qdrant, Chroma, etc.)
VectorStoreTextSearch    → Semantic retrieval plugin from vector stores
```

Memory is not automatic — developers compose it by injecting `ChatHistory` plus retrieval results into the prompt context manually or via the Kernel's built-in RAG helpers.

#### Agent Types (SK Agent Framework — GA Q1 2025)

- `ChatCompletionAgent`: An agent backed by any chat completion service, with plugins and instructions
- `OpenAIAssistantAgent`: Wraps the OpenAI Assistants API (code interpreter, file search, persistent threads)
- Agents maintain conversation state via a **thread abstraction** (in-memory or remote)

---

### 1.3 Microsoft Agent Framework — The Unified Layer (GA October 2025)

The Microsoft Agent Framework merges AutoGen's orchestration power with Semantic Kernel's enterprise SDK:

#### Six Orchestration Patterns

| Pattern | Mechanism | Best For |
|---|---|---|
| **Sequential** | Agents run in a fixed chain; each output feeds the next | ETL pipelines, report generation |
| **Concurrent** | Agents run in parallel; results merged | Research synthesis, parallel analysis |
| **Group Chat** | All agents share one thread; LLM selects next speaker | Brainstorming, consensus building |
| **Handoff** | Active agent decides who receives control next | Triage routing, dynamic delegation |
| **Magentic** | Manager builds a task ledger, iterates until done | Open-ended complex tasks, web research |
| **Direct (Single Agent)** | One agent with tools, function calling loop | Simple Q&A with tool access |

#### Agent-to-Agent Communication: A2A Protocol

Microsoft co-developed the open **Agent2Agent (A2A) Protocol** with Google (announced May 2025):

```
Agent Card (/.well-known/agent.json)
  ├── capabilities[]     (what the agent can do)
  ├── accepted formats   (input/output schemas)
  ├── auth requirements  (key, OAuth2, Entra Agent Identity)
  └── endpoint URL

Communication Flow:
  Client Agent → discovers AgentCard → sends Task message
  Remote Agent → processes → returns Task result (streaming or batch)

Complementary Protocols:
  MCP = Agent ↔ Tools layer
  A2A = Agent ↔ Agent layer
```

A .NET Agent Framework agent can hand off to a Python CrewAI crew and receive results back, as long as both implement A2A. Microsoft also supports **AG-UI** compatibility for frontend agent interaction UIs.

---

### 1.4 Azure AI Foundry Agent Service — Cloud Platform Layer

```
Azure AI Foundry Agent Service
  ├── Project Endpoint    (replaces connection string as of May 2025)
  ├── Agent Definition    (instructions, model, tools, temperature)
  ├── Thread              (stateful conversation container)
  ├── Run                 (single execution of an agent against a thread)
  │
  └── Built-in Tools:
       ├── Code Interpreter   (sandboxed Python, 1hr session, 30min idle timeout)
       ├── File Search        (vector store over uploaded files, max 512MB/5M tokens)
       ├── Grounding (Bing)   (real-time web search)
       ├── Azure AI Search    (enterprise vector search)
       ├── Azure Logic Apps   (workflow automation)
       ├── A2A Tool           (call any A2A protocol endpoint with auth)
       └── Connected Agents   (legacy; A2A Tool is the successor)
```

Tools can be scoped at **agent level**, **thread level**, or **run level** (narrower scope overrides broader).

---

### 1.5 Copilot Studio — Low-Code Agent Platform

```
Copilot Studio Architecture:
  ├── Topics                  (conversation fragments; intent-triggered dialog branches)
  ├── Generative Orchestration (AI decides which topic/plugin to invoke — replaces rigid topic routing)
  ├── Actions
  │    ├── Connector Actions   (1,400+ Power Platform connectors)
  │    ├── MCP Server Tools    (Model Context Protocol integrations)
  │    ├── Agent Flows         (automated workflows, schedule/event/agent-triggered)
  │    └── Generative Actions  (dynamically compose plugins at runtime via AI)
  └── Multi-Agent Orchestration
       ├── Maker Controls      (governance over which agents can call which)
       └── Agent-to-Agent      (preview; Copilot Studio agents calling other agents)
```

Copilot Studio is the low-code surface over the same Foundry + Semantic Kernel runtime. Generative Orchestration mode means the LLM dynamically selects the right topic/plugin rather than following hardcoded conversation flows.

---

## PART 2: OPEN-SOURCE FRAMEWORKS

---

### 2.1 LangGraph — Graph-Based Agent Orchestration

**Current State:** LangGraph 1.0 released October 2025. Production users include Uber, LinkedIn, Klarna. OpenAI Swarm was deprecated in favor of LangGraph for multi-agent patterns.

#### Core Abstraction: State Graph

```
StateGraph
  ├── State Definition  (TypedDict | Pydantic | dataclass)
  │    ├── field: type              → overwrite semantics (last write wins)
  │    └── field: Annotated[list, add_messages]  → reducer semantics (accumulate)
  │
  ├── Nodes             (Python functions or Runnables; receive State, return partial State)
  ├── Edges
  │    ├── Fixed Edge       → always routes A → B
  │    └── Conditional Edge → function(State) → str (node name) with routing map
  │
  └── Entry/Exit Points
       ├── START → first node
       └── END   → terminal condition
```

#### State Flow Mechanics

```python
# State schema example
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # reducer: append-only
    next_action: str                                      # overwrite: last write
    tool_calls: list[ToolCall]                            # overwrite
    error_count: int                                      # overwrite

# Conditional routing example
def route_after_tool(state: AgentState) -> str:
    if state["error_count"] > 3:
        return "error_handler"
    if state["next_action"] == "DONE":
        return END
    return "agent"

graph.add_conditional_edges("tool_executor", route_after_tool, {
    "agent": "agent",
    "error_handler": "error_handler",
    END: END
})
```

Crucially, LangGraph **supports cycles** — nodes can route back to previous nodes, enabling true ReAct-style reasoning loops that DAG-only systems cannot express.

#### Checkpointing & Persistence (Short-Term Memory)

```
Checkpointer (per-thread state)
  ├── InMemorySaver       → dev/test only; lost on restart
  ├── AsyncPostgresSaver  → production; survives crashes
  └── AsyncSqliteSaver    → lightweight production option

Thread = thread_id → isolated state namespace
Checkpoint = StateSnapshot saved after every node execution

Time Travel:
  → replay from any prior checkpoint with modified inputs
  → fork executions at any node for debugging or A/B testing
```

Every node execution creates a checkpoint. If the process crashes, on restart LangGraph replays the event log to reconstruct state — identical concept to Temporal's event history, but at the graph layer.

#### Human-in-the-Loop: interrupt() Pattern

```python
# Inside a node — pause execution and surface to human
def approval_node(state):
    value = interrupt({
        "action": state["pending_action"],
        "reason": "Requires human approval"
    })
    # Execution pauses here; thread is serialized to checkpointer
    # When human responds (via Command), execution resumes
    return {"approved": value["approved"]}

# Resume from external system
graph.invoke(Command(resume={"approved": True}), config={"thread_id": "xyz"})
```

When `interrupt()` fires:

1. Execution halts at that node
2. State is persisted to the checkpointer (can be days/months later)
3. The `__interrupt__` field is surfaced in the invoke result
4. Human reviews and calls `Command(resume=...)` with their decision
5. Graph resumes from exactly that node — no recomputation of prior nodes

#### Memory Architecture

| Memory Type | Implementation | Scope | Purpose |
|---|---|---|---|
| Short-term (in-graph) | `messages` field in State with `add_messages` reducer | Single thread | Conversation history within a run |
| Short-term (durable) | Checkpointer (Postgres/SQLite) | Per `thread_id` | Survives restarts, enables HITL |
| Long-term | `Store` interface (InMemoryStore, PostgresStore) | Cross-thread / global | User preferences, learned facts, cross-session recall |

The `Store` is a key-value database completely **separate from graph execution state**. Agents can read/write to it during node execution to share knowledge across conversations.

#### Multi-Agent Patterns in LangGraph

**Supervisor Pattern:**

```
Supervisor Node (LLM)
  ├── Reads full State
  ├── Decides: which specialized agent to call next, or END
  └── Routes via conditional edge to:
       ├── ResearchAgent (subgraph)
       ├── WriterAgent   (subgraph)
       └── CoderAgent    (subgraph)
```

**Subgraph Architecture:**

Each agent can be its own compiled `StateGraph`, called as a node in the parent graph. State mapping transformations handle schema mismatches between parent and subgraph state schemas. This enables:

- Reusable agent components
- Independent testing of subgraphs
- Mid-level supervisors (nested hierarchies)

**Handoff via Command:**

```python
# Agent explicitly hands off to another agent
return Command(
    goto="other_agent",           # target node/agent
    update={"context": result},   # state payload
    graph=Command.PARENT          # escalate to parent graph
)
```

#### LangGraph 1.0 Production Features (October 2025)

- **Node-level caching**: Cache node outputs by input hash; skip redundant LLM calls
- **Deferred nodes**: Node execution postponed until all upstream paths complete (map-reduce, consensus patterns)
- **Pre/post hooks**: Fine-grained execution control between node transitions
- **Streaming**: Token-level, tool-call-level, node-level, and state-update-level streaming
- **Functional API**: Write graphs as pure Python functions without explicit graph builders

---

### 2.2 CrewAI — Role-Based Multi-Agent Orchestration

#### Core Abstractions

```
Agent
  ├── role        (title/function: "Senior Research Analyst")
  ├── goal        (individual objective driving decisions)
  ├── backstory   (persona context enriching LLM behavior)
  ├── tools       (list of Tool objects; LangChain tools compatible)
  ├── llm         (LiteLLM-backed; default gpt-4o-mini)
  ├── function_calling_llm  (separate LLM for tool routing if needed)
  ├── max_iter    (max ReAct loop iterations before forced answer)
  ├── verbose     (logs thought process)
  └── step_callback (intermediate step hooks)

Task
  ├── description     (what to do)
  ├── expected_output (output format specification)
  ├── agent           (responsible agent; or auto-assigned in hierarchical)
  ├── context         (list of other Tasks whose output this depends on)
  ├── tools           (task-level tool override)
  ├── async_execution (run concurrently)
  └── output_pydantic (structured output schema)

Crew
  ├── agents[]
  ├── tasks[]
  ├── process         (Process.sequential | Process.hierarchical)
  ├── manager_llm     (required for hierarchical; LLM for auto-created manager)
  ├── memory          (bool — activates memory system)
  └── verbose

Process
  ├── Sequential   → tasks run in order; output[n] available as context to task[n+1]
  └── Hierarchical → CrewAI auto-generates a Manager agent that allocates tasks,
                     reviews outputs, and iterates until completion criteria met
```

#### Sequential vs Hierarchical Process

```
Sequential Process:
  Task1 → (output as context) → Task2 → (output as context) → Task3

Hierarchical Process:
  Manager Agent
    ├── Receives the goal
    ├── Allocates Task1 to Agent A based on role/capability
    ├── Reviews output; may reject and reassign
    ├── Allocates Task2 to Agent B
    └── Continues until all tasks meet completion criteria
```

In hierarchical mode, the Manager is **auto-created** — developers supply a `manager_llm` and CrewAI generates the manager agent with built-in delegation and review behaviors.

#### Context Sharing Between Agents

Context flows two ways:

1. **Explicit task context**: `task2 = Task(context=[task1])` — task1's output is injected into task2's prompt
2. **Memory system**: All agents in a crew share the same memory objects; any agent's observations are visible to others via retrieval

#### Memory Architecture (2025 Unified Memory System)

CrewAI replaced its four separate memory classes with a unified `Memory` API backed by an LLM-analyzed storage layer:

| Memory Type | Storage Backend | Scope | Description |
|---|---|---|---|
| Short-term | ChromaDB (vector RAG) | Current crew run | Session context, recent observations |
| Long-term | SQLite3 | Cross-run persistent | Task results, learnings across executions |
| Entity | RAG (vector) | Cross-run | Specific entities: people, places, concepts, organizations |
| Contextual | Composite (all above) | Runtime | Assembled context window from all memory types |
| External | Custom store | Developer-defined | User-supplied databases, knowledge bases |

The unified `Memory` class uses an LLM to **analyze content at save time** — inferring scope, categories, and importance scores. Recall uses composite scoring: `semantic_similarity × recency_weight × importance_score`. Natural namespace hierarchies (`/project/alpha`, `/agent/researcher`) enable scoped retrieval.

#### Flows (Event-Driven Pipeline Layer)

CrewAI Flows sits above Crew as a higher-level orchestration primitive:

```python
class ResearchFlow(Flow):
    initial_state = ResearchState  # Pydantic BaseModel for typed state

    @start()
    def gather_requirements(self):
        ...

    @listen(gather_requirements)
    def research_phase(self, result):
        return ResearchCrew().kickoff(inputs={"topic": result})

    @listen(research_phase)
    @router(condition=lambda r: "summary" in r)
    def route_output(self, result):
        return "write_report" if result.quality > 0.8 else "refine"
```

Flows support:

- `@start()` — entry point
- `@listen(step)` — triggers on step completion
- `@router()` — conditional branching
- `@and_(step1, step2)` — wait for multiple steps (AND join)
- `@or_(step1, step2)` — trigger on first completion (OR join)
- State typed via Pydantic `BaseModel` with validation
- `flow.kickoff(inputs={...})` — initiate with structured inputs

Flows enable **crews to be composed** into larger pipelines, where each crew handles a phase and the Flow manages sequencing, branching, and state passing between them.

---

### 2.3 DSPy — Programming (Not Prompting) Language Models

#### Paradigm Shift

Traditional prompt engineering: hand-craft strings → brittle, unscalable, non-transferable across models.

DSPy's approach: define **behavior specification** (what inputs → what outputs), then **compile** to optimal instructions + demonstrations using your actual data and metrics.

```
Prompt Engineering:  Developer → hand-craft prompt → LLM → output (hope it works)
DSPy:                Developer → Signature + Metric → Optimizer → compiled Program → LLM → output (measurably better)
```

#### Three Core Abstractions

**1. Signatures** — Declarative input/output contracts:

```python
# Short-form (string)
"question -> answer"
"context, question -> answer"

# Long-form (class) with field descriptions
class GenerateAnswer(dspy.Signature):
    """Answer questions with short factoid answers."""
    context: list[str] = dspy.InputField(desc="relevant context passages")
    question: str      = dspy.InputField()
    answer: str        = dspy.OutputField(desc="often between 1 and 5 words")
```

Signatures define semantic roles — the framework figures out the actual prompt format, few-shot demonstrations, and chain-of-thought instructions.

**2. Modules** — Parameterized strategy units:

```
dspy.Predict          → basic signature execution (no CoT)
dspy.ChainOfThought   → adds step-by-step reasoning field before output
dspy.ReAct            → tool-using agent loop (Reason + Act)
dspy.ProgramOfThought → generates and executes code for reasoning
dspy.MultiChainComparison → generates multiple chains, picks best

# Compose into programs:
class RAGPipeline(dspy.Module):
    def __init__(self):
        self.retrieve = dspy.Retrieve(k=3)
        self.generate = dspy.ChainOfThought("context, question -> answer")

    def forward(self, question):
        context = self.retrieve(question).passages
        return self.generate(context=context, question=question)
```

Each module has three internal parameter types: LM weights, instructions (prompt strings), and stored demonstrations (few-shot examples).

**3. Optimizers (Teleprompters)** — Algorithmic prompt/weight optimization:

| Optimizer | Optimizes | Algorithm |
|---|---|---|
| `BootstrapFewShot` | Examples only | Bootstraps demos from training set; filters by metric |
| `COPRO` | Instructions only | Proposes instruction variants, evaluates, selects |
| `MIPROv2` | Instructions + Examples | Bayesian Optimization over instruction × demo space |
| `BootstrapFineTune` | LM weights | Generates training data → fine-tunes smaller model |
| `GEPA` (2025) | Instructions | Genetic Algorithm + Pareto optimization; often beats human prompts |

#### Compilation Process

```
Developer provides:
  1. program = RAGPipeline()
  2. trainset = [dspy.Example(question=..., answer=...) for ...]
  3. metric = lambda example, pred, trace=None: example.answer == pred.answer

optimizer = dspy.MIPROv2(metric=metric, auto="medium")
compiled_program = optimizer.compile(program, trainset=trainset)
# compiled_program now has optimized instructions + demos baked in
```

The optimizer:

1. Bootstraps candidate few-shot demonstrations from the training set
2. Generates instruction variants for each module (data-aware, demo-aware)
3. Evaluates combinations on the metric
4. Uses Bayesian Optimization to navigate the search space efficiently
5. Returns a compiled program with optimal `instructions` + `demos` per module

#### Why It Differs Fundamentally

- When you switch LLMs (GPT-4 → Claude 3.5), you re-compile rather than re-engineer prompts
- Metrics replace intuition — optimization is measurable
- Programs are modular: optimize sub-components independently
- DSPy programs can be serialized, versioned, and loaded as configs

---

### 2.4 Temporal — Durable Execution for Long-Running Agent Workflows

**Context:** Temporal is not an agent framework — it is a **durable execution engine** that provides the infrastructure guarantees (persistence, retry, recovery, observability) that production AI agents need. OpenAI uses it for Codex (handling millions of requests). Temporal raised $300M Series D at $5B valuation in 2025 on the strength of AI agent demand.

#### Core Execution Model

```
Temporal Cluster (Server)
  ├── Event History Log    → append-only record of every execution event
  ├── Task Queues         → distribute work to Workers
  └── Persistence Backend → Cassandra, MySQL, or PostgreSQL

Worker Process
  ├── Workflow Workers     → host deterministic Workflow code
  └── Activity Workers     → host non-deterministic Activity code (LLM calls, APIs)
```

#### The Fundamental Guarantee: Durable Execution

Temporal records **every event** in its history log:

- Workflow started
- Activity scheduled → Activity started → Activity completed (with result)
- Timer fired
- Signal received
- Local variable assignments (via side effects)

If the Worker process crashes:

1. Temporal detects the Worker is gone
2. A new Worker picks up the task
3. The new Worker **replays the event history** deterministically
4. All `await activity(...)` calls return their previously recorded results without re-executing
5. Execution resumes from exactly where it crashed

This means developers never write checkpoint/restore logic — it is automatic and transparent.

#### Workflows vs Activities

```python
# Workflow: deterministic; no I/O; all non-determinism happens in Activities
@workflow.defn
class ResearchAgentWorkflow:
    @workflow.run
    async def run(self, query: str) -> str:
        # Each activity call is recorded in event history
        search_results = await workflow.execute_activity(
            web_search, query, schedule_to_close_timeout=timedelta(minutes=5)
        )
        # LLM call is an Activity — non-deterministic; result recorded
        analysis = await workflow.execute_activity(
            call_llm, {"context": search_results, "query": query},
            schedule_to_close_timeout=timedelta(minutes=2),
            retry_policy=RetryPolicy(maximum_attempts=3)
        )
        return analysis

# Activity: I/O-heavy, can be non-deterministic; retried automatically
@activity.defn
async def call_llm(params: dict) -> str:
    response = await openai_client.chat.completions.create(...)
    return response.choices[0].message.content
```

#### Long-Running Agent Architecture

```
Workflow (can run days/weeks/months):
  ├── Maintains state as local variables (durably preserved via replay)
  ├── Calls Activities for all external I/O
  ├── Awaits Signals from humans or other systems
  └── Responds to Queries without interrupting execution

Worker resource management:
  ├── Active Workflows     → held in memory
  ├── Cached Workflows     → evicted from memory, but history preserved
  └── Evicted Workflows    → fully removed from memory; replayed on next access
  (Workers handle hundreds/thousands of concurrent Workflows efficiently)
```

#### Signal and Query Patterns (Human-in-the-Loop)

```python
@workflow.defn
class ApprovalWorkflow:
    def __init__(self):
        self._approved: Optional[bool] = None

    @workflow.signal           # ← inject data INTO running workflow
    async def approve(self, decision: bool):
        self._approved = decision

    @workflow.query            # ← read data OUT without interrupting execution
    def get_status(self) -> str:
        if self._approved is None:
            return "pending"
        return "approved" if self._approved else "rejected"

    @workflow.run
    async def run(self, action: dict) -> str:
        # Block until signal received (can wait days, uses no active threads)
        await workflow.wait_condition(lambda: self._approved is not None)
        if self._approved:
            return await workflow.execute_activity(execute_action, action)
        return "rejected"
```

**Signal**: Push data into a running Workflow from outside (human decision, external event, another agent)

**Query**: Pull current state from a running Workflow synchronously (for status UIs, monitoring)

**Update** (newer primitive): Push data AND get a response back (combines signal + query with strong consistency)

#### Multi-Agent Architecture with Temporal

Each AI agent is its own long-running Workflow. Signals/queries form the communication backbone:

```
OrchestratorWorkflow
  ├── Starts ChildWorkflow("research_agent", topic)   → returns workflow handle
  ├── Sends signal: research_handle.signal("refine", new_criteria)
  ├── Queries status: research_handle.query("get_progress")
  └── Awaits result: research_handle.result()

This is actor-model durability:
  - Each agent is always "alive" (durably, even through crashes)
  - Communication is via signals (fire-and-forget) or updates (request-response)
  - Every interaction is recorded in event history for full auditability
```

#### OpenAI Agents SDK Integration (September 2025, Public Preview)

```python
# Wrap OpenAI agent inside Temporal for durability
from temporalio import workflow, activity
from openai.agents import Agent, Runner

@activity.defn
async def run_agent_turn(thread_id: str, user_message: str) -> str:
    # Each turn is an Activity — result persisted, retried on failure
    result = await Runner.run(agent, user_message, thread_id=thread_id)
    return result.final_output

@workflow.defn
class DurableOpenAIAgentWorkflow:
    @workflow.run
    async def run(self, session_id: str):
        while True:
            # Wait for user signal
            await workflow.wait_condition(lambda: self._next_message is not None)
            response = await workflow.execute_activity(
                run_agent_turn, session_id, self._next_message
            )
            self._last_response = response
            self._next_message = None
```

---

## PART 3: COMPARATIVE ARCHITECTURAL SUMMARY

| Dimension | Microsoft Agent Framework | LangGraph | CrewAI | DSPy | Temporal |
|---|---|---|---|---|---|
| **Mental model** | Actor-model runtime + orchestration patterns | State machine graph with reducers | Role-playing crew organization | Compiled LM programs | Durable execution engine |
| **State management** | Per-agent private state + message passing | Typed State dict flowing through nodes | Crew-level shared memory + task context | Module parameters (instructions, demos) | Event history log (automatic replay) |
| **Persistence** | Azure Cosmos DB / Foundry | Checkpointer (Postgres/SQLite) | SQLite (long-term), ChromaDB (short-term) | Serialized compiled programs | Cassandra/MySQL/PostgreSQL event log |
| **HITL pattern** | Signal/interrupt in orchestrations | `interrupt()` + `Command(resume=...)` | Manual step callbacks | Not native (build atop) | Signals + `wait_condition` |
| **Failure recovery** | Orchestration retry policies | Checkpoint replay | None native (external) | None native | Automatic event history replay |
| **Agent communication** | A2A protocol (HTTP, JSON, AgentCards) | Command objects + shared State | Task context injection + memory | Not applicable | Signals, Updates, Queries |
| **Tool integration** | MCP + OpenAPI + native SK plugins | LangChain tools + custom | LangChain tools + custom | External tool Activities | Activities (any code) |
| **Optimization** | Model-agnostic | Model-agnostic | LiteLLM (any model) | Metric-driven compilation | Infrastructure layer only |
| **Production maturity** | GA October 2025 | GA (1.0) October 2025 | Stable, widely deployed | Research + production adoption | Highly production-proven |

---

## Key Architectural Insights

**On state:** LangGraph is the most rigorous — state schema is explicit TypedDict/Pydantic, reducers control merge semantics, and every state transition is checkpointed. CrewAI state is looser — shared via memory retrieval and task context strings. Microsoft Agent Framework state is actor-private (no shared mutable state), communicated via typed messages.

**On durability:** Only Temporal provides infrastructure-level durable execution with automatic replay. LangGraph's checkpointer provides graph-level durability. CrewAI and DSPy have no native durability — they rely on external infrastructure.

**On optimization:** DSPy is uniquely differentiated — it treats prompts as learnable parameters, not strings to hand-craft. No other framework in this list has an equivalent compilation step.

**On interoperability:** Microsoft's A2A protocol is the most ambitious — it enables cross-framework agent communication at the HTTP level, so a LangGraph agent and an Agent Framework agent can collaborate without sharing a codebase.

**On HITL:** LangGraph's `interrupt()` and Temporal's `Signal`/`wait_condition` are the most production-grade implementations. Both persist state durably across interruptions that could last days. CrewAI's step callbacks are event hooks, not true suspension-and-resume.

---

## Sources

- [Microsoft AutoGen v0.4 Reimagined — Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)
- [Introducing Microsoft Agent Framework — Microsoft Foundry Blog](https://devblogs.microsoft.com/foundry/introducing-microsoft-agent-framework-the-open-source-engine-for-agentic-ai-apps/)
- [Microsoft Agent Framework RC — Microsoft Foundry Blog](https://devblogs.microsoft.com/foundry/microsoft-agent-framework-reaches-release-candidate/)
- [AutoGen to Microsoft Agent Framework Migration Guide](https://learn.microsoft.com/en-us/agent-framework/migration-guide/from-autogen/)
- [AI Agent Orchestration Patterns — Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Multi-Agent Orchestration Patterns in Microsoft Agent Framework — Part 7](https://www.dataa.dev/2025/11/12/multi-agent-orchestration-patterns-in-microsoft-agent-framework-part-7/)
- [Agent2Agent (A2A) Protocol — Microsoft Cloud Blog](https://www.microsoft.com/en-us/microsoft-cloud/blog/2025/05/07/empowering-multi-agent-apps-with-the-open-agent2agent-a2a-protocol/)
- [A2A Integration — Microsoft Learn](https://learn.microsoft.com/en-us/agent-framework/integrations/a2a)
- [Semantic Kernel Agent Architecture — Microsoft Learn](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/agent-architecture)
- [Semantic Kernel Agent Framework — Microsoft Learn](https://learn.microsoft.com/en-us/semantic-kernel/frameworks/agent/)
- [Semantic Kernel Roadmap H1 2025](https://devblogs.microsoft.com/semantic-kernel/semantic-kernel-roadmap-h1-2025-accelerating-agents-processes-and-integration/)
- [Magentic-One: A Generalist Multi-Agent System — Microsoft Research](https://www.microsoft.com/en-us/research/articles/magentic-one-a-generalist-multi-agent-system-for-solving-complex-tasks/)
- [Multi-Agent Orchestration and Copilot Studio — Build 2025](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/multi-agent-orchestration-maker-controls-and-more-microsoft-copilot-studio-announcements-at-microsoft-build-2025/)
- [Foundry Agent Service Tools Overview — Microsoft Learn](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/how-to/tools-classic/overview?view=foundry-classic)
- [LangGraph 1.0 Released — Medium](https://medium.com/@romerorico.hugo/langgraph-1-0-released-no-breaking-changes-all-the-hard-won-lessons-8939d500ca7c)
- [Making it easier to build HITL agents with interrupt — LangChain Blog](https://blog.langchain.com/making-it-easier-to-build-human-in-the-loop-agents-with-interrupt/)
- [Architecting HITL Agents in LangGraph — Medium](https://medium.com/data-science-collective/architecting-human-in-the-loop-agents-interrupts-persistence-and-state-management-in-langgraph-fa36c9663d6f)
- [LangGraph Multi-Agent Orchestration — Latenode Blog](https://latenode.com/blog/ai-frameworks-technical-infrastructure/langgraph-multi-agent-orchestration/langgraph-multi-agent-orchestration-complete-framework-guide-architecture-analysis-2025)
- [Node-level Caching in LangGraph — LangChain Changelog](https://changelog.langchain.com/announcements/node-level-caching-in-langgraph)
- [LangGraph Multi-Agent Workflows — LangChain Blog](https://blog.langchain.com/langgraph-multi-agent-workflows/)
- [LangGraph Supervisor Python — GitHub](https://github.com/langchain-ai/langgraph-supervisor-py)
- [CrewAI Memory — Official Docs](https://docs.crewai.com/en/concepts/memory)
- [CrewAI Agents — Official Docs](https://docs.crewai.com/en/concepts/agents)
- [CrewAI Flows — Official Docs](https://docs.crewai.com/en/concepts/flows)
- [CrewAI Tasks — Official Docs](https://docs.crewai.com/en/concepts/tasks)
- [Sequential vs Hierarchical in CrewAI — CrewAI Help](https://help.crewai.com/ware-are-the-key-differences-between-hierarchical-and-sequential-processes-in-crewai)
- [DSPy — Official Site](https://dspy.ai/)
- [DSPy Signatures — Official Docs](https://dspy.ai/learn/programming/signatures/)
- [DSPy Optimizers — Official Docs](https://dspy.ai/learn/optimization/optimizers/)
- [MIPROv2 — DSPy Docs](https://dspy.ai/api/optimizers/MIPROv2/)
- [DSPy GitHub — Stanford NLP](https://github.com/stanfordnlp/dspy)
- [Durable Execution meets AI — Temporal Blog](https://temporal.io/blog/durable-execution-meets-ai-why-temporal-is-the-perfect-foundation-for-ai)
- [Human-in-the-Loop AI Agent — Temporal Docs](https://docs.temporal.io/ai-cookbook/human-in-the-loop-python)
- [Durable Multi-Agentic AI Architecture — Temporal Blog](https://temporal.io/blog/using-multi-agent-architectures-with-temporal)
- [Production-Ready Agents with OpenAI Agents SDK + Temporal](https://temporal.io/blog/announcing-openai-agents-sdk-integration)
- [Temporal and OpenAI AI Agent Durability — InfoQ](https://www.infoq.com/news/2025/09/temporal-aiagent/)
- [How to Build a Durable AI Agent with Temporal and Python — Learn Temporal](https://learn.temporal.io/tutorials/ai/durable-ai-agent/)
