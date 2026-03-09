# Enterprise Dify Agent Architecture (Phase 0 Target)
## NPA Multi-Agent Workbench — Dify Cloud + Railway Tools + Angular Frontend

**Status:** Phase 0 target (validate before freeze)
**Last updated:** 2026-02-13
**Primary UI:** Angular (not Dify WebApp)
**Agent host/orchestrator:** Dify Cloud (`https://cloud.dify.ai`)
**Tools (data layer):** Railway MCP Tools Server (OpenAPI, 71 tools)

This document is the **single source of truth** for how we will build and wire Dify apps for the NPA workbench in an enterprise-grade manner. It intentionally prioritizes determinism, auditability, least privilege, and frontend contracts.

---

## 1) Non-Negotiable Principles

1. **Angular is the product UI.** Dify WebApp is not used by end users.
2. **Deterministic contracts.** Every Dify app returns a machine-readable output that Angular can render into cards/panels.
3. **Least privilege.** Orchestrator is a router + orchestrator; specialists do specialist work; tool access is minimized per app.
4. **Auditability by default.** All write actions log via `audit_log_action` and session/routing tools.
5. **Environment parity.** Cloud is the proving ground; self-hosted (OpenShift) must be a drop-in replacement with the same contracts.
6. **One major action per turn.** Create, classify, risk, autofill, governance are separate user-visible steps with a human checkpoint.
7. **Graceful degradation.** If any layer fails (LLM, tool, DB), the system must return a parseable error rather than crash.

---

## 2) System Context (Cloud)

```mermaid
flowchart LR
  UI["Angular UI (Port 4200)"] -->|HTTP| API["Express API (Port 3000)"]
  API -->|POST /v1/chat-messages| DIFY["Dify Cloud"]
  API -->|POST /v1/workflows/run| DIFY

  DIFY -->|Custom Tools (OpenAPI)| TOOLS["Railway Tools Server (HTTPS)"]
  TOOLS -->|SQL| DB["Railway MySQL (42 tables)"]
```

### Data flow per user message

```
1. Angular POST /api/dify/chat { agent_id, query, conversation_id }
2. Express resolves agent_id -> Dify API key from server config
3. Express POST https://api.dify.ai/v1/chat-messages (SSE stream or blocking)
4. Dify LLM reasons, calls Railway tools as needed
5. Railway tool executes SQL, returns JSON to Dify
6. Dify LLM composes answer with @@NPA_META@@ envelope
7. Express parses envelope -> structured metadata
8. Angular renders metadata into typed cards/panels
```

### Key URLs for Phase 0

| Resource | URL |
|----------|-----|
| Dify API base | `https://api.dify.ai/v1` |
| Tools OpenAPI spec | `https://mcp-tools-server-production.up.railway.app/openapi.json` |
| Tools list | `https://mcp-tools-server-production.up.railway.app/tools` (71 tools) |
| MCP SSE endpoint | `https://mcp-tools-server-production.up.railway.app/mcp/sse` |
| Tools health | `https://mcp-tools-server-production.up.railway.app/health` |
| Railway MySQL (public) | `mainline.proxy.rlwy.net:19072` |
| Railway Dashboard | `https://railway.com/project/f9a1e7d9-fb38-4b37-9d7f-64ec4c6177e2` |

Note: Phase 0 uses the **OpenAPI Custom Tool provider** in Dify for maximum compatibility. The MCP SSE endpoint is available as an alternative.

---

## 3) Logical Agents vs Dify Apps (Phase 0 Target Mapping)

We keep the **13 logical agent identities** stable for UI/analytics (see `src/app/lib/agent-interfaces.ts` and `server/config/dify-agents.js`), but we deploy a smaller set of **7 Dify apps** for Phase 0 execution.

### Logical agent IDs (frontend/back-end registry)

| ID | Tier | Name | Config Type |
|----|------|------|-------------|
| `MASTER_COO` | 1 | Master COO Orchestrator | chat |
| `NPA_ORCHESTRATOR` | 2 | NPA Domain Orchestrator | chat |
| `IDEATION` | 3 | Ideation Agent | workflow* |
| `CLASSIFIER` | 3 | Classification Agent | workflow |
| `AUTOFILL` | 3 | Template AutoFill Agent | workflow |
| `ML_PREDICT` | 3 | ML Prediction Agent | workflow |
| `RISK` | 3 | Risk Agent | workflow |
| `GOVERNANCE` | 3 | Governance Agent | workflow |
| `DILIGENCE` | 3 | Conversational Diligence Agent | workflow |
| `DOC_LIFECYCLE` | 3 | Document Lifecycle Agent | workflow |
| `MONITORING` | 3 | Post-Launch Monitoring Agent | workflow |
| `KB_SEARCH` | 4 | KB Search Agent | workflow |
| `NOTIFICATION` | 4 | Notification Agent | workflow |

*Note: `IDEATION` is registered as `workflow` in the backend config but will be built as a **Chatflow** in Dify (see rationale below). The Express proxy must handle both `chat` and `workflow` response shapes for this agent.

### Dify Apps to create (Phase 0) — 3 Chatflows + 4 Workflows

| Dify App | Type | Why this type | Logical agents mapped | Build order |
|----------|------|---------------|----------------------|-------------|
| `CF_NPA_Orchestrator` | Chatflow | Multi-turn routing needs conversation memory | `MASTER_COO`, `NPA_ORCHESTRATOR` | Step 1 |
| `CF_NPA_Ideation` | Chatflow | Ideation is conversational: user refines product concept via Q&A before NPA creation | `IDEATION` | Step 2 |
| `CF_NPA_Query_Assistant` | Chatflow | Read-only Q&A requires follow-up, disambiguation, cross-domain joins | `DILIGENCE`, `KB_SEARCH`, `NOTIFICATION` (read) | Step 3 |
| `WF_NPA_Classify_Predict` | Workflow | Deterministic: project_id in -> classification + prediction out | `CLASSIFIER`, `ML_PREDICT` | Step 4 |
| `WF_NPA_Risk` | Workflow | Deterministic: project_id in -> risk assessment out | `RISK` | Step 5 |
| `WF_NPA_Autofill` | Workflow | Deterministic: project_id in -> populated fields out | `AUTOFILL` | Step 5 |
| `WF_NPA_Governance_Ops` | Workflow | Deterministic: signoffs, docs, stage advance, notifications | `GOVERNANCE`, `DOC_LIFECYCLE`, `MONITORING`, `NOTIFICATION` (write) | Step 5 |

### Chatflow vs Workflow decision rule

- **Chatflow** if the agent must ask clarifying questions, maintain multi-turn memory, or handle ambiguous user intent.
- **Workflow** if the agent takes a structured input (`project_id` + parameters) and returns a structured output without conversation.

---

## 4) Tooling Layer — Per-App Tool Assignment (Least Privilege)

### Tool provider

Dify Custom Tools provider imported from:
`https://mcp-tools-server-production.up.railway.app/openapi.json`

The OpenAPI exposes **71 tools** as `POST /tools/<tool_name>`. All tools accept JSON body and return `{ success, data, error }`.

### Tool authentication (Phase 0)

Phase 0 deploys **without tool-level auth** (Railway endpoint is public). Before self-hosted production:
- Add API-key header auth to the Railway FastAPI server
- Configure the same key in Dify Custom Tool provider settings
- All Dify apps share one tool provider configuration

### Tool assignment per Dify App

#### `CF_NPA_Orchestrator` — 8 tools (read + route only)

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `session_create` | Create tracing session at conversation start | Write (session only) |
| `session_log_message` | Log agent reasoning for audit | Write (session only) |
| `log_routing_decision` | Record which specialist was called and why | Write (routing only) |
| `get_npa_by_id` | Load project context for routing decisions | Read |
| `list_npas` | Resolve project references during context switch | Read |
| `ideation_find_similar` | Resolve ambiguous product names | Read |
| `get_workflow_state` | Check current stage before routing | Read |
| `get_user_profile` | Load user role for permission-aware routing | Read |

**NOT allowed:** Any tool that creates, modifies, or deletes NPA data. The orchestrator routes; it does not act.

#### `CF_NPA_Ideation` — 7 tools

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `ideation_create_npa` | Create NPA project record after discovery Q&A | Write |
| `ideation_find_similar` | Show user similar historical NPAs | Read |
| `ideation_get_prohibited_list` | Pre-screen product against prohibited list | Read |
| `ideation_save_concept` | Save concept notes and rationale | Write |
| `ideation_list_templates` | Show available NPA templates | Read |
| `get_prospects` | Load prospect pipeline for conversion | Read |
| `convert_prospect_to_npa` | Convert an existing prospect to NPA | Write |
| `audit_log_action` | Log NPA creation for audit trail | Write |
| `session_log_message` | Log conversation for traceability | Write |

#### `CF_NPA_Query_Assistant` — 17 tools (read-only + notification read)

| Tool | Purpose |
|------|---------|
| `list_npas` | Portfolio-level queries |
| `get_npa_by_id` | Single project deep-dive |
| `get_workflow_state` | Stage and blocker status |
| `governance_get_signoffs` | Who signed off, who hasn't |
| `check_sla_status` | SLA breach detection |
| `governance_check_loopbacks` | Rework history |
| `audit_get_trail` | Full audit history |
| `check_audit_completeness` | Audit gap detection |
| `get_dashboard_kpis` | Portfolio-level metrics |
| `check_document_completeness` | Missing doc analysis |
| `get_document_requirements` | What docs are needed |
| `check_breach_thresholds` | Monitoring breaches |
| `get_post_launch_conditions` | Post-launch requirements |
| `get_performance_metrics` | Product performance data |
| `search_kb_documents` | Policy/regulatory search |
| `get_kb_document_by_id` | Retrieve specific KB doc |
| `get_pending_notifications` | User notification inbox |

**NOT allowed:** Any write tool. This agent is strictly read-only.

#### `WF_NPA_Classify_Predict` — 8 tools

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `classify_assess_domains` | Run 7-domain intake assessment | Write |
| `classify_score_npa` | Generate classification scorecard (0-20) | Write |
| `classify_determine_track` | Set approval track | Write |
| `classify_get_criteria` | Load classification criteria reference | Read |
| `classify_get_assessment` | Load existing assessment if re-running | Read |
| `update_npa_predictions` | Write ML prediction results back to project | Write |
| `get_npa_by_id` | Load project context for classification | Read |
| `audit_log_action` | Log classification decision | Write |

#### `WF_NPA_Risk` — 10 tools

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `risk_run_assessment` | Execute risk assessment across domains | Write |
| `risk_get_market_factors` | Load existing market risk factors | Read |
| `risk_add_market_factor` | Record new market factor | Write |
| `risk_get_external_parties` | Load counterparty data | Read |
| `get_prerequisite_categories` | Load prerequisite checklist | Read |
| `validate_prerequisites` | Run prerequisite validation | Read |
| `save_risk_check_result` | Save 4-layer risk check result | Write |
| `get_form_field_value` | Read specific form field for risk logic | Read |
| `get_npa_by_id` | Load project context | Read |
| `audit_log_action` | Log risk assessment | Write |

#### `WF_NPA_Autofill` — 7 tools

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `autofill_get_template_fields` | Load template field definitions | Read |
| `autofill_populate_field` | Fill single field with lineage | Write |
| `autofill_populate_batch` | Batch fill multiple fields | Write |
| `autofill_get_form_data` | Load current form state | Read |
| `autofill_get_field_options` | Load picklist options | Read |
| `get_npa_by_id` | Load project context for autofill logic | Read |
| `audit_log_action` | Log autofill action | Write |

#### `WF_NPA_Governance_Ops` — 18 tools

| Tool | Purpose | Read/Write |
|------|---------|------------|
| `governance_get_signoffs` | Load signoff matrix | Read |
| `governance_create_signoff_matrix` | Create signoff routing for project | Write |
| `governance_record_decision` | Record approve/reject/rework | Write |
| `governance_check_loopbacks` | Check rework iterations | Read |
| `governance_advance_stage` | Move project to next stage | Write |
| `get_signoff_routing_rules` | Load routing rules for track | Read |
| `check_sla_status` | Check SLA breaches | Read |
| `create_escalation` | Create escalation record | Write |
| `save_approval_decision` | Save final approval/rejection | Write |
| `add_comment` | Add approval comment | Write |
| `check_document_completeness` | Verify docs before stage gate | Read |
| `get_document_requirements` | Load doc requirements | Read |
| `upload_document_metadata` | Record document upload | Write |
| `validate_document` | Validate document status | Write |
| `get_monitoring_thresholds` | Load monitoring SLAs | Read |
| `create_breach_alert` | Create breach notification | Write |
| `send_notification` | Send notification to stakeholders | Write |
| `audit_log_action` | Log all governance actions | Write |

---

## 5) Knowledge Bases (Phase 0 Target Minimum)

### Datasets to create in Dify

#### 1. `KB_NPA_CORE_CLOUD`

Core NPA knowledge for routing, classification, and policy enforcement.

| Source file (repo) | Content |
|--------------------|---------|
| `docs/KB_NPA_Policies.md` | NPA policies, prohibited products, approval thresholds |
| `docs/KB_NPA_Approval_Matrix.md` | Sign-off routing rules by track (FULL/LITE/BUNDLING/EVERGREEN) |
| `docs/KB_NPA_Classification_Rules.md` | 28 classification criteria, scoring methodology, tier thresholds |
| `docs/KB_NPA_State_Machine.md` | Workflow stages, transitions, gate conditions |
| `docs/KB_NPA_Templates.md` | 47-field template structure, section definitions |

#### 2. `KB_NPA_AGENT_KBS_CLOUD`

Agent operating guides — system prompt context and domain expertise.

| Source file (repo) | Agent |
|--------------------|-------|
| `Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md` | Orchestrator routing logic |
| `Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md` | NPA domain orchestration |
| `Context/Dify_Agent_KBs/KB_Ideation_Agent.md` | Ideation discovery patterns |
| `Context/Dify_Agent_KBs/KB_Classification_Agent.md` | Classification criteria interpretation |
| `Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md` | Autofill lineage rules |
| `Context/Dify_Agent_KBs/KB_ML_Prediction.md` | Prediction feature engineering |
| `Context/Dify_Agent_KBs/KB_Risk_Agent.md` | 4-layer risk cascade logic |
| `Context/Dify_Agent_KBs/KB_Governance_Agent.md` | Sign-off routing decisions |
| `Context/Dify_Agent_KBs/KB_Conversational_Diligence.md` | Q&A with citations |
| `Context/Dify_Agent_KBs/KB_Doc_Lifecycle.md` | Document validation rules |
| `Context/Dify_Agent_KBs/KB_Monitoring_Agent.md` | Post-launch monitoring logic |
| `Context/Dify_Agent_KBs/KB_Search_Agent.md` | KB search strategies |
| `Context/Dify_Agent_KBs/KB_Notification_Agent.md` | Notification routing |

### KB attachment policy per app

| Dify App | KB_NPA_CORE | KB_NPA_AGENT_KBS | Rationale |
|----------|-------------|-------------------|-----------|
| `CF_NPA_Orchestrator` | Yes | Yes (Orchestrator + Domain Orch only) | Needs policy context for routing decisions |
| `CF_NPA_Ideation` | Yes | Yes (Ideation only) | Needs prohibited list context, template awareness |
| `CF_NPA_Query_Assistant` | Yes | Yes (all agent KBs) | Must answer questions across all domains with citations |
| `WF_NPA_Classify_Predict` | No | No | Uses tools for structured criteria; no free-text KB needed |
| `WF_NPA_Risk` | No | No | Uses tools for risk checks; structured data only |
| `WF_NPA_Autofill` | No | No | Uses tools for field options and template structure |
| `WF_NPA_Governance_Ops` | No | No | Uses tools for routing rules and SLA checks |

**Rule:** Chatflows get KBs (they need context for reasoning). Workflows don't (they get structured inputs and use tools for data).

---

## 6) Enterprise Output Contracts (Angular-First)

### Why we need a contract

Angular renders results as typed cards/panels using the interfaces defined in `src/app/lib/agent-interfaces.ts`. Dify APIs do not guarantee propagation of arbitrary metadata across all configurations. Therefore we enforce an **answer-envelope pattern** that is robust across deployments.

### AgentAction type union (source of truth: `agent-interfaces.ts`)

```
ROUTE_DOMAIN | ASK_CLARIFICATION | SHOW_CLASSIFICATION | SHOW_RISK |
SHOW_PREDICTION | SHOW_AUTOFILL | SHOW_GOVERNANCE | SHOW_DOC_STATUS |
SHOW_MONITORING | SHOW_KB_RESULTS | HARD_STOP | STOP_PROCESS |
FINALIZE_DRAFT | ROUTE_WORK_ITEM | SHOW_RAW_RESPONSE | SHOW_ERROR
```

### Chatflow answer envelope (required)

Every chatflow response must include a final line:

```text
@@NPA_META@@{...valid json...}
```

Envelope schema:
```json
{
  "agent_action": "<AgentAction>",
  "agent_id": "MASTER_COO|IDEATION|DILIGENCE|...",
  "payload": {
    "projectId": "NPA-2026-XXX or empty",
    "intent": "create_npa|classify_npa|autofill_npa|risk_assessment|governance|query_data",
    "target_agent": "IDEATION|CLASSIFIER|AUTOFILL|RISK|GOVERNANCE|QUERY_ASSISTANT",
    "uiRoute": "/agents/npa",
    "data": {}
  },
  "trace": {
    "session_id": "uuid",
    "conversation_id": "dify-conversation-id",
    "message_id": "dify-message-id"
  }
}
```

### Payload shapes per `agent_action`

| agent_action | payload.data shape | Angular renders as |
|-------------|-------------------|-------------------|
| `ROUTE_DOMAIN` | `{ domain: "NPA\|RISK\|KB\|OPS\|DESK", domainAgent: "...", greeting: "..." }` | Domain routing card |
| `ASK_CLARIFICATION` | `{ question: "...", options?: string[], context?: "..." }` | Chat bubble with optional buttons |
| `SHOW_CLASSIFICATION` | `ClassificationResult` (type, track, scores, prohibitedMatch, mandatorySignOffs) | Classification result card |
| `SHOW_RISK` | `RiskAssessment` (layers[], overallScore, hardStop, prerequisites[]) | Risk assessment panel |
| `SHOW_PREDICTION` | `MLPrediction` (approvalLikelihood, timelineDays, bottleneckDept, features[]) | Prediction card |
| `SHOW_AUTOFILL` | `AutoFillSummary` (fieldsFilled, coveragePct, timeSavedMinutes, fields[]) | Autofill summary panel |
| `SHOW_GOVERNANCE` | `GovernanceState` (signoffs[], slaStatus, loopBackCount, escalation?) | Governance status panel |
| `SHOW_DOC_STATUS` | `DocCompletenessResult` (completenessPercent, missingDocs[], expiringDocs[], stageGateStatus) | Document completeness panel |
| `SHOW_MONITORING` | `MonitoringResult` (productHealth, metrics[], breaches[], conditions[]) | Monitoring alerts panel |
| `SHOW_KB_RESULTS` | `DiligenceResponse` (answer, citations[], relatedQuestions[]) | KB search results with citations |
| `HARD_STOP` | `{ reason: "...", prohibitedItem?: "...", layer?: "..." }` | Red hard-stop card |
| `FINALIZE_DRAFT` | `{ projectId: "...", summary: "...", nextSteps: string[] }` | Draft finalization card |
| `SHOW_RAW_RESPONSE` | `{ raw_answer: "..." }` | Plain text chat bubble (fallback) |
| `SHOW_ERROR` | `{ error_type: "...", message: "...", retry_allowed: boolean }` | Error card with optional retry |

### Fallback contract (Express-enforced)

If Express cannot parse `@@NPA_META@@{json}` from a Dify answer:

```json
{
  "agent_action": "SHOW_RAW_RESPONSE",
  "agent_id": "UNKNOWN",
  "payload": { "raw_answer": "<full answer text>" },
  "trace": { "error": "META_PARSE_FAILED" }
}
```

For tool/workflow failures:

```json
{
  "agent_action": "SHOW_ERROR",
  "agent_id": "<agent_id if known>",
  "payload": {
    "error_type": "TOOL_FAILURE|WORKFLOW_TIMEOUT|LLM_ERROR|DIFY_API_ERROR",
    "message": "<human-safe error description>",
    "retry_allowed": true,
    "failed_tool": "<tool_name if applicable>"
  },
  "trace": { "conversation_id": "...", "error_detail": "..." }
}
```

### Workflow outputs contract (required)

Every workflow must define these output variables in Dify:

| Output variable | Type | Required |
|-----------------|------|----------|
| `agent_action` | string | Yes |
| `agent_id` | string | Yes |
| `payload` | JSON object | Yes |
| `trace` | JSON object | Yes |

Example (Classification):
```json
{
  "agent_action": "SHOW_CLASSIFICATION",
  "agent_id": "CLASSIFIER",
  "payload": {
    "projectId": "NPA-2026-003",
    "data": {
      "type": "New-to-Group",
      "track": "FULL_NPA",
      "overallConfidence": 92,
      "scores": [
        { "criterion": "Entirely new product category", "score": 2, "maxScore": 2, "reasoning": "..." }
      ],
      "prohibitedMatch": { "matched": false },
      "mandatorySignOffs": ["Market & Liquidity Risk", "Credit Risk", "Legal", "Compliance", "Technology"]
    }
  },
  "trace": { "project_id": "NPA-2026-003", "workflow_run_id": "..." }
}
```

---

## 7) Orchestrator Behaviour (Phase 0 Target)

### Conversation variables (Dify Chatflow settings)

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `session_id` | string | "" | Agent session ID (set on first turn) |
| `current_project_id` | string | "" | Active NPA project |
| `current_stage` | string | "" | Current workflow stage of active project |
| `user_role` | string | "MAKER" | User's role (MAKER/CHECKER/APPROVER/COO) |
| `ideation_conversation_id` | string | "" | Persisted conversation ID for CF_NPA_Ideation |
| `last_action` | string | "" | Last agent_action returned (prevents duplicate steps) |

### Turn-by-turn orchestration pattern

```
Turn 1: User -> "I want to create a green bond product"
  Orchestrator:
    1. session_create(agent_id="MASTER_COO")  -> session_id
    2. Detect intent: create_npa
    3. log_routing_decision(source="MASTER_COO", target="IDEATION", reason="New product request")
    4. Forward to CF_NPA_Ideation via HTTP Request node
    5. Return ideation response + @@NPA_META@@{ agent_action: "ROUTE_DOMAIN", payload: { domain: "NPA", target_agent: "IDEATION" } }

Turn 2: User -> "It targets wealth management clients in Singapore"
  Orchestrator:
    1. Forward to CF_NPA_Ideation (same ideation_conversation_id)
    2. Ideation asks more questions or creates NPA
    3. If NPA created: set current_project_id, return project card
    4. Return @@NPA_META@@{ agent_action: "FINALIZE_DRAFT", payload: { projectId: "NPA-2026-013" } }
    5. Human-readable text: "Project created. Would you like me to classify it?"

Turn 3: User -> "Yes, classify it"
  Orchestrator:
    1. Detect intent: classify_npa
    2. log_routing_decision(source="MASTER_COO", target="CLASSIFIER")
    3. Call WF_NPA_Classify_Predict via HTTP Request node (input: current_project_id)
    4. Parse workflow outputs
    5. Return @@NPA_META@@{ agent_action: "SHOW_CLASSIFICATION", payload: { data: <ClassificationResult> } }

Turn 4: User -> "Now run risk assessment"
  Orchestrator:
    1. Detect intent: risk_assessment
    2. Call WF_NPA_Risk (input: current_project_id)
    3. Return @@NPA_META@@{ agent_action: "SHOW_RISK" }

Turn 5: User -> "What documents are missing?"
  Orchestrator:
    1. Detect intent: query_data
    2. Route to CF_NPA_Query_Assistant (or call check_document_completeness directly)
    3. Return @@NPA_META@@{ agent_action: "SHOW_DOC_STATUS" }
```

### Intent classification rules (deterministic)

The orchestrator must classify user intent into one of these categories. When ambiguous, ask one clarification question.

| Intent | Trigger keywords/patterns | Routes to |
|--------|---------------------------|-----------|
| `create_npa` | "create", "new product", "launch", "I want to build" | `CF_NPA_Ideation` |
| `classify_npa` | "classify", "what type", "assessment", "score" | `WF_NPA_Classify_Predict` |
| `risk_assessment` | "risk", "assessment", "prerequisites", "prohibited" | `WF_NPA_Risk` |
| `autofill_npa` | "autofill", "fill template", "populate", "form" | `WF_NPA_Autofill` |
| `governance` | "signoff", "approve", "governance", "advance stage", "documents" | `WF_NPA_Governance_Ops` |
| `query_data` | "status", "who", "what", "show me", "list", "which", any question | `CF_NPA_Query_Assistant` |
| `switch_project` | References different NPA ID or product name | Context switch (Section 8) |

### Anti-patterns the orchestrator must avoid

1. **Never chain two workflows in one turn.** One action, one result, one human checkpoint.
2. **Never call write tools directly.** Route to the appropriate specialist.
3. **Never hallucinate a project_id.** Always resolve via `get_npa_by_id` or `ideation_find_similar`.
4. **Never skip the envelope.** Every response must end with `@@NPA_META@@`.
5. **Never assume context from a previous session.** If `current_project_id` is empty, ask the user.

### Calling workflows from Orchestrator (inside Dify)

HTTP Request node:
- **URL:** `POST https://api.dify.ai/v1/workflows/run`
- **Authorization:** `Bearer <WORKFLOW_APP_KEY>`
- **Body:**
```json
{
  "inputs": {
    "project_id": "{{current_project_id}}",
    "user_role": "{{user_role}}"
  },
  "response_mode": "blocking",
  "user": "{{user_id}}"
}
```
- **Parse response:** Extract `data.outputs.agent_action`, `data.outputs.payload`, `data.outputs.trace`

### Calling chatflows from Orchestrator (inside Dify)

HTTP Request node:
- **URL:** `POST https://api.dify.ai/v1/chat-messages`
- **Authorization:** `Bearer <CHATFLOW_APP_KEY>`
- **Body:**
```json
{
  "inputs": {},
  "query": "{{user_message}}",
  "conversation_id": "{{ideation_conversation_id}}",
  "response_mode": "blocking",
  "user": "{{user_id}}"
}
```
- **Persist:** Save response `conversation_id` back to `ideation_conversation_id` for next turn.

---

## 8) Context Switching (Enterprise Requirement)

Users will switch projects mid-conversation. The Orchestrator must handle this gracefully.

### Detection rules

| Signal | Example | Resolution |
|--------|---------|------------|
| Explicit NPA ID | "What about NPA-2026-003?" | `get_npa_by_id("NPA-2026-003")` |
| Product name reference | "Switch to the green bond project" | `ideation_find_similar("green bond")` |
| Ambiguous reference | "The other one" | Ask: "Which project? I was working on [current]. Did you mean [X] or [Y]?" |
| No project yet | "Run classification" (but no project_id) | Ask: "Which project should I classify? You can give me an NPA ID or product name." |

### Context switch procedure

1. Detect project reference differs from `current_project_id`
2. Resolve via tool call (`get_npa_by_id` or `ideation_find_similar`)
3. If single match: update `current_project_id`, `current_stage`, reset `ideation_conversation_id`
4. If multiple matches: present options, ask user to confirm
5. Acknowledge: "Switched to NPA-2026-003 (Global Green Bond ETF). Current stage: RISK_ASSESSMENT."

### State reset on switch

When switching projects, clear these conversation variables:
- `ideation_conversation_id` -> ""
- `last_action` -> ""
- Update `current_project_id` and `current_stage` from the tool response

---

## 9) Query Assistant (First-Class Read Path)

`CF_NPA_Query_Assistant` is expected to handle **70-80% of daily usage**. Most enterprise interactions are reads, not writes.

### System prompt guidance

The Query Assistant must:
- Answer questions about NPA status, signoffs, documents, risks, and policies
- Cite sources when referencing KB documents
- Call multiple tools in sequence for cross-domain queries
- Return structured envelopes matching the appropriate `agent_action`
- Never modify data (no write tools)

### Minimum tool allowlist (17 tools)

See Section 4 for full list. Key capability mapping:

| User question type | Tools used |
|-------------------|------------|
| "What's the status of NPA X?" | `get_npa_by_id` + `get_workflow_state` |
| "Who hasn't signed off?" | `governance_get_signoffs` |
| "Are any SLAs breached?" | `check_sla_status` |
| "What documents are missing?" | `check_document_completeness` |
| "Show me the audit trail" | `audit_get_trail` |
| "Which NPAs are at risk?" | `list_npas` (filter by status) |
| "What's the portfolio overview?" | `get_dashboard_kpis` |
| "What's the policy on crypto?" | `search_kb_documents` + `ideation_get_prohibited_list` |
| "Any post-launch issues?" | `check_breach_thresholds` + `get_post_launch_conditions` |

### Cross-domain query examples (must support)

- "Which NPAs are blocked or at risk?" -> `list_npas` filtered
- "Who has not signed off on NPA-2026-001?" -> `governance_get_signoffs`
- "Which documents are missing for NPA-2026-003?" -> `check_document_completeness`
- "What is the policy position on crypto-linked products?" -> `search_kb_documents` + `ideation_get_prohibited_list`
- "Compare NPA-2026-001 and NPA-2026-003" -> two `get_npa_by_id` calls + synthesis
- "Show me all critical breaches across the portfolio" -> `list_npas` + `check_breach_thresholds` per project

### KB attachment

Both `KB_NPA_CORE_CLOUD` and `KB_NPA_AGENT_KBS_CLOUD` must be attached to this app. This gives the LLM policy context for answering "why" questions and citing regulatory sources.

---

## 10) Express + Angular Wiring (Phase 0 Target)

### Express proxy endpoints

**Source file:** `server/routes/dify-proxy.js`

#### `POST /api/dify/chat`

```
Request:
  { agent_id, query, inputs?, conversation_id?, user?, response_mode? }

Express logic:
  1. Resolve agent_id -> Dify API key from server/config/dify-agents.js
  2. POST to Dify /v1/chat-messages with key
  3. If streaming: pipe SSE chunks, parse @@NPA_META@@ from final chunk
  4. If blocking: parse answer, extract @@NPA_META@@
  5. If parse fails: return SHOW_RAW_RESPONSE fallback
  6. If Dify returns error: return SHOW_ERROR envelope

Response (to Angular):
  { answer, conversation_id, message_id, metadata: { agent_action, payload, trace } }
```

#### `POST /api/dify/workflow`

```
Request:
  { agent_id, inputs, user?, response_mode? }

Express logic:
  1. Resolve agent_id -> Dify API key
  2. POST to Dify /v1/workflows/run
  3. Extract outputs.agent_action, outputs.payload, outputs.trace
  4. If workflow failed: return SHOW_ERROR envelope

Response (to Angular):
  { workflow_run_id, task_id, data: { outputs, status }, metadata: { agent_action, payload, trace } }
```

#### `GET /api/dify/agents/status`

Returns health of all 13 agents (configured/unconfigured based on API key presence).

### Angular integration patterns

**Pattern A: Conversational orchestration (Command Center + NPA Agent chat)**
```typescript
// User sends message through chat UI
difyService.sendChat('MASTER_COO', query, conversationId)
  .subscribe(response => {
    // response.metadata.agent_action determines which card to render
    switch (response.metadata.agent_action) {
      case 'SHOW_CLASSIFICATION': renderClassificationCard(response.metadata.payload.data);
      case 'SHOW_RISK': renderRiskPanel(response.metadata.payload.data);
      case 'SHOW_RAW_RESPONSE': renderPlainText(response.metadata.payload.raw_answer);
      case 'SHOW_ERROR': renderErrorCard(response.metadata.payload);
    }
  });
```

**Pattern B: Direct workflow trigger (panel-initiated)**
```typescript
// User clicks "Run Classification" button on NPA detail page
difyService.runWorkflow('CLASSIFIER', { project_id: npaId })
  .subscribe(response => {
    renderClassificationCard(response.metadata.payload.data);
  });
```

### Contract enforcement in Express (required)

Express must:
1. Parse `@@NPA_META@@{json}` from the `answer` field using regex: `/@@NPA_META@@(\{[\s\S]*\})$/`
2. Strip the `@@NPA_META@@` line from the human-readable answer text
3. Validate that `agent_action` is a known value from the AgentAction union
4. Attach parsed metadata to the response as `metadata` field
5. If parse fails -> fallback to `SHOW_RAW_RESPONSE`
6. If Dify HTTP error -> `SHOW_ERROR` with error details

---

## 11) Environment Configuration (Cloud)

### Express backend (`server/.env`)

```env
# Dify Cloud
DIFY_BASE_URL=https://api.dify.ai/v1

# Chatflow keys
DIFY_KEY_MASTER_COO=<CF_NPA_Orchestrator API key>
DIFY_KEY_NPA_ORCH=<same as MASTER_COO — merged into one app>
DIFY_KEY_IDEATION=<CF_NPA_Ideation API key>
DIFY_KEY_DILIGENCE=<CF_NPA_Query_Assistant API key>
DIFY_KEY_KB_SEARCH=<CF_NPA_Query_Assistant API key>

# Workflow keys
DIFY_KEY_CLASSIFIER=<WF_NPA_Classify_Predict API key>
DIFY_KEY_ML_PREDICT=<same as CLASSIFIER — merged into one app>
DIFY_KEY_AUTOFILL=<WF_NPA_Autofill API key>
DIFY_KEY_RISK=<WF_NPA_Risk API key>
DIFY_KEY_GOVERNANCE=<WF_NPA_Governance_Ops API key>
DIFY_KEY_DOC_LIFECYCLE=<same as GOVERNANCE — merged into one app>
DIFY_KEY_MONITORING=<same as GOVERNANCE — merged into one app>
DIFY_KEY_NOTIFICATION=<same as GOVERNANCE — merged into one app>

# Database (local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=npa_user
DB_PASSWORD=npa_password
DB_NAME=npa_workbench
```

### Dify Custom Tool provider

Import URL: `https://mcp-tools-server-production.up.railway.app/openapi.json`
Auth: None (Phase 0) / API-key header (production)

### Key mapping: Logical agent -> Dify app key

| Logical agent ID | Dify app | ENV variable |
|-----------------|----------|-------------|
| MASTER_COO | CF_NPA_Orchestrator | DIFY_KEY_MASTER_COO |
| NPA_ORCHESTRATOR | CF_NPA_Orchestrator | DIFY_KEY_MASTER_COO |
| IDEATION | CF_NPA_Ideation | DIFY_KEY_IDEATION |
| CLASSIFIER | WF_NPA_Classify_Predict | DIFY_KEY_CLASSIFIER |
| ML_PREDICT | WF_NPA_Classify_Predict | DIFY_KEY_CLASSIFIER |
| AUTOFILL | WF_NPA_Autofill | DIFY_KEY_AUTOFILL |
| RISK | WF_NPA_Risk | DIFY_KEY_RISK |
| GOVERNANCE | WF_NPA_Governance_Ops | DIFY_KEY_GOVERNANCE |
| DOC_LIFECYCLE | WF_NPA_Governance_Ops | DIFY_KEY_GOVERNANCE |
| MONITORING | WF_NPA_Governance_Ops | DIFY_KEY_GOVERNANCE |
| DILIGENCE | CF_NPA_Query_Assistant | DIFY_KEY_DILIGENCE |
| KB_SEARCH | CF_NPA_Query_Assistant | DIFY_KEY_DILIGENCE |
| NOTIFICATION | WF_NPA_Governance_Ops | DIFY_KEY_GOVERNANCE |

---

## 12) What Changes for Self-Hosted Later (Not Phase 0)

Self-hosted Dify (OpenShift) swaps:

| Setting | Cloud (Phase 0) | Self-hosted (Phase 1+) |
|---------|-----------------|----------------------|
| Dify base URL | `https://api.dify.ai/v1` | `https://<company-dify>/v1` |
| Tools base URL | `https://mcp-tools-server-production.up.railway.app` | `https://<openshift-route>` |
| DB host | `railway.internal:3306` | `<company-db>:3306` |
| Tool auth | None | API-key header |

**No changes to:**
- Logical agent IDs
- Output contracts / envelope schema
- Angular integration patterns
- Express proxy logic
- Tool parameter schemas

---

## 13) Validation Gates and Freeze Criteria

We only declare this architecture **frozen** after these pass end-to-end (Angular -> Express -> Dify -> Tools -> DB -> back):

### Gate 1: Envelope contract (Step 1)
- [ ] Orchestrator returns valid `@@NPA_META@@` in every response
- [ ] Express parses it and returns structured `metadata` to Angular
- [ ] Express fallback produces `SHOW_RAW_RESPONSE` when LLM omits envelope
- [ ] Express produces `SHOW_ERROR` when Dify API returns HTTP error

### Gate 2: Ideation delegation (Step 2)
- [ ] Orchestrator forwards user messages to `CF_NPA_Ideation`
- [ ] Ideation asks at least one clarifying question before creating NPA
- [ ] Ideation creates NPA via `ideation_create_npa` and returns `projectId`
- [ ] Orchestrator persists `ideation_conversation_id` across turns
- [ ] Orchestrator sets `current_project_id` from ideation result

### Gate 3: Query Assistant (Step 3)
- [ ] Answers at least 5 cross-domain read queries using tools
- [ ] Returns stable envelopes with correct `agent_action` per query type
- [ ] Provides citations when answering policy questions from KB
- [ ] Handles "I don't know" gracefully when data is missing

### Gate 4: Workflow integration (Step 4)
- [ ] Orchestrator calls `WF_NPA_Classify_Predict` via HTTP Request node
- [ ] Workflow returns structured outputs matching contract
- [ ] Angular renders `ClassificationResult` card from workflow output
- [ ] Audit trail shows classification decision logged

### Post-validation

Once all 4 gates pass:
1. Change document status from "Phase 0 Target" to "Frozen"
2. Lock tool assignments (no adding tools to apps without architecture review)
3. Lock envelope schema (no new `agent_action` values without frontend PR)
4. Begin Phase 1: remaining workflows + self-hosted migration

---

## 14) Build Order (Implementation Sequence)

| Step | What to build | What it validates | Estimated effort |
|------|---------------|-------------------|-----------------|
| **Step 1** | `CF_NPA_Orchestrator` with routing logic, session tools, envelope contract | Gate 1: Does the entire pipeline work? | 1 day |
| **Step 2** | `CF_NPA_Ideation` with conversational discovery + NPA creation | Gate 2: Can orchestrator delegate to a chatflow specialist? | 1 day |
| **Step 3** | `CF_NPA_Query_Assistant` with 17 read tools + both KBs | Gate 3: Does the read path work across domains? | 1 day |
| **Step 4** | `WF_NPA_Classify_Predict` with classification + prediction tools | Gate 4: Does orchestrator -> workflow pipeline work? | 0.5 day |
| **Step 5** | `WF_NPA_Risk`, `WF_NPA_Autofill`, `WF_NPA_Governance_Ops` | Scale the pattern to remaining workflows | 1.5 days |
| **Step 6** | Freeze architecture, begin Phase 1 | All gates passed | - |
