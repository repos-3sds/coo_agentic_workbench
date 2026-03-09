# COO ORCHESTRATOR (MASTER_COO) — Dify Setup Guide
# Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 2.0 — Separate Dify app (no longer shared with NPA_ORCHESTRATOR)

## Dify App Type: CHATFLOW (Agent App — NOT Workflow)

The COO Orchestrator is a **Tier 1 conversational Agent App** — it receives all user messages first, classifies the COO domain, manages sessions, creates audit trails, handles context switching, and delegates to Domain Orchestrators. It maintains conversation state across turns.

**Architecture:** MASTER_COO is a **separate Dify Chatflow app** (`CF_COO_Orchestrator`) with its own API key. When it identifies an NPA-domain request, it delegates to the NPA Domain Orchestrator (`CF_NPA_Orchestrator`) — a completely separate Dify Chatflow app — exactly the same way the NPA Orchestrator delegates to Ideation, Classifier, Risk, etc.

```
CF_COO_Orchestrator (MASTER_COO — Tier 1, own API key)
    ↓ delegates via ROUTE_DOMAIN
CF_NPA_Orchestrator (NPA_ORCHESTRATOR — Tier 2, own API key)
    ↓ delegates via HTTP Request / switchAgent
CF_NPA_Ideation, WF_NPA_Classify_Predict, WF_NPA_Risk, etc. (Tier 3)
```

---

## Step 1: Create Agent App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Agent**
2. Name: `CF_COO_Orchestrator`
3. Description: "COO Multi-Agent Orchestrator — Tier 1 entry point for all user interactions. Classifies COO domains (NPA, KB, Risk, Desk, Ops), manages sessions, and delegates to domain-specific orchestrators."
4. Agent Mode: **Function Call** (recommended for structured tool use)

**IMPORTANT — Dify App types:**
- **Agent App (Chatflow)**: Multi-turn conversation + tool-calling loop. This is the correct type.
- **Workflow**: Stateless input-to-output. NOT suitable — Orchestrator requires conversation memory and iterative tool calls.

## Step 2: Agent Configuration

### System Instructions
Copy the full prompt from `CF_COO_Orchestrator_Prompt.md` into the Agent App's **Instructions** field.

This prompt provides the agent with:
- Domain classification (NPA, KB, Risk, Desk, Ops)
- Session management (session_create, session_log_message)
- Context switching (project changes, multi-NPA awareness)
- @@NPA_META@@ envelope contract
- Delegation rules (ROUTE_DOMAIN to NPA_ORCHESTRATOR)
- NPA exclusion awareness, prohibited product early warning, cross-border flagging

**NOTE:** Only the COO Orchestrator prompt goes into this app. The NPA Domain Orchestrator prompt goes into its own separate app (`CF_NPA_Orchestrator`).

### Model Selection
- **Model**: Claude 3.5 Sonnet (recommended) or GPT-4o
  - Needs strong intent classification + context management + structured JSON output
  - Must handle long conversation histories (15-30+ turns)
- **Temperature**: 0.2 (low — Orchestrator needs deterministic routing, not creativity)
- **Max Tokens**: 2000 (responses are routing confirmations + @@NPA_META@@ envelope, not lengthy content)
- **Context Window**: Ensure the model supports long context — conversations can span 30+ turns

### Conversation Settings
- **Opening Statement**: "Welcome to the COO Workbench. I'm your NPA Orchestrator. I can help you create new products, classify NPAs, run risk assessments, fill templates, manage sign-offs, or answer questions about NPA policies. What would you like to do?"
- **Follow-Up Questions**: Disabled (the agent manages its own routing logic)
- **Conversation Memory**: Enabled (critical — agent needs full history for context switching and stage tracking)

---

## Step 3: Configure MCP Tools

The COO Orchestrator requires 8 tools (read-only + session management). Configure in the Agent App:

### Option A: MCP Server (Recommended)
Connect to the MCP tools server:
- **MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
- **OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

Select only these 8 tools (least privilege — the Orchestrator MUST NOT have write tools):

### Option B: Custom API Tool Definitions

#### Tool 1: `session_create`
- **Purpose**: Create tracing session at conversation start
- **When Called**: FIRST turn of every new conversation
- **Parameters**:
  ```json
  {
    "agent_id": { "type": "string", "required": true, "description": "Always 'MASTER_COO'" },
    "project_id": { "type": "string", "description": "NPA project ID if known" },
    "user_id": { "type": "string", "default": "system" },
    "current_stage": { "type": "string", "description": "Current workflow stage" },
    "handoff_from": { "type": "string", "description": "Previous agent ID if handoff" }
  }
  ```
- **Returns**: `{ session_id, agent_id, project_id, started_at }`

#### Tool 2: `session_log_message`
- **Purpose**: Log agent reasoning for audit trail
- **When Called**: After every routing decision
- **Parameters**:
  ```json
  {
    "session_id": { "type": "string", "required": true },
    "role": { "type": "string", "required": true, "enum": ["user", "agent"] },
    "content": { "type": "string", "required": true },
    "agent_identity_id": { "type": "string", "description": "Which agent sent this" },
    "agent_confidence": { "type": "number", "description": "0-100 confidence" },
    "reasoning_chain": { "type": "string", "description": "Decision reasoning" }
  }
  ```
- **Returns**: `{ message_id, session_id, role, timestamp }`

#### Tool 3: `log_routing_decision`
- **Purpose**: Record specialist delegation for audit
- **When Called**: BEFORE every delegation to a specialist
- **Parameters**:
  ```json
  {
    "source_agent": { "type": "string", "required": true, "description": "Always 'MASTER_COO'" },
    "target_agent": { "type": "string", "required": true, "description": "e.g. NPA_ORCHESTRATOR, IDEATION" },
    "routing_reason": { "type": "string", "required": true },
    "session_id": { "type": "string" },
    "project_id": { "type": "string" },
    "confidence": { "type": "number", "description": "0-100" }
  }
  ```
- **Returns**: `{ id, source_agent, target_agent, routing_reason }`

#### Tool 4: `get_npa_by_id`
- **Purpose**: Load project context for routing decisions
- **When Called**: When user references a specific NPA ID
- **Parameters**: `project_id` (required, string)
- **Returns**: `{ project, current_workflow, signoff_summary }`

#### Tool 5: `list_npas`
- **Purpose**: Portfolio queries, resolve references
- **Parameters**: `status`, `current_stage`, `risk_level`, `submitted_by`, `limit`, `offset` (all optional)
- **Returns**: `{ npas[], pagination }`

#### Tool 6: `ideation_find_similar`
- **Purpose**: Resolve product names to project IDs
- **Parameters**: `search_term` (required), `npa_type`, `product_category`, `limit` (all optional)
- **Returns**: `{ matches[], count, search_term }`

#### Tool 7: `get_workflow_state`
- **Purpose**: Check current stage before routing
- **Parameters**: `project_id` (required)
- **Returns**: `{ project_id, project_stage, project_status, current_state, all_states, summary }`

#### Tool 8: `get_user_profile`
- **Purpose**: Load user role for permission-aware routing
- **Parameters**: At least one of: `user_id`, `email`, `employee_id`
- **Returns**: `{ user { id, email, full_name, department, role, location } }`

---

## Step 4: Upload KB Documents to Dify

### Dataset 1: "NPA Core Policies" (KB_NPA_CORE_CLOUD)
1. Go to Dify > Knowledge > Create Knowledge
2. Name: "NPA Core Policies"
3. Upload these files:
   - `KB_NPA_Policies.md` — Consolidated policies, all 44 rules
   - `KB_NPA_Templates.md` — 47-field template structure
   - `KB_Classification_Criteria.md` — Classification criteria
   - `KB_Product_Taxonomy.md` — Product categories
   - `KB_Prohibited_Items.md` — Prohibited products/jurisdictions
4. **Chunking settings**:
   - Chunk size: **1000 tokens**
   - Overlap: **100 tokens**
   - Separator: `---`
5. **Embedding model**: text-embedding-3-small (or equivalent)
6. **Retrieval mode**: Hybrid (keyword + semantic)

### Dataset 2: "COO Orchestrator KB"
1. Name: "COO Orchestrator KB"
2. Upload:
   - `KB_Master_COO_Orchestrator.md` — COO Orchestrator operating guide
3. Same chunking settings as Dataset 1

### Connect Knowledge to Agent
In the Agent App settings:
- Enable **Knowledge Base** (context retrieval)
- Select both datasets
- Top K: 5
- Score threshold: 0.5

---

## Step 5: Conversation Variables (Auto-Detected)

The prompt declares conversation variables using `{{variable}}` syntax. Dify will **auto-detect** these when you paste the prompt into the Instructions field — no manual configuration needed.

**Variables auto-detected from prompt:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `session_id` | string | "" | From `session_create` on Turn 1 |
| `current_project_id` | string | "" | Active NPA project ID |
| `current_stage` | string | "" | Current workflow stage |
| `user_role` | string | "MAKER" | User role (MAKER/CHECKER/APPROVER/COO) |
| `last_action` | string | "" | Last AgentAction returned |

**Verification:** After pasting the prompt, check the Dify Chatflow's variable panel — all 5 variables should appear automatically. If any are missing, add them manually with the types/defaults shown above.

---

## Step 6: Get API Key

After publishing the Agent App:
1. Go to App > API Access
2. Copy the API key (starts with `app-`)
3. Add to Express `.env` file:
```
DIFY_KEY_MASTER_COO=app-xxxxxxxxxxxxxxxxxx
```
4. Verify in `server/config/dify-agents.js`:
```javascript
MASTER_COO: {
    key: process.env.DIFY_KEY_MASTER_COO,
    type: 'chat',              // 'chat' for Chatflow
    difyApp: 'CF_COO_Orchestrator',
    name: 'Master COO Orchestrator',
    tier: 1
}
```

**CRITICAL**: The type must be `'chat'` (not `'workflow'`). This tells the Express proxy to use the Dify Chat Message API (`/chat-messages`) with conversation_id persistence.

---

## Step 7: Test via Express Proxy

### Test 1: First turn — Session creation + domain classification
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MASTER_COO",
    "query": "I want to create a new FX Forward product",
    "conversation_id": ""
  }'
```

**Expected**: Agent creates session, classifies as NPA domain with `create_npa` intent, returns `@@NPA_META@@` envelope with `ROUTE_DOMAIN` action and `target_agent: "NPA_ORCHESTRATOR"`. The Angular DifyService will then call `switchAgent('NPA_ORCHESTRATOR')` to delegate.

### Test 2: Context switch — Project lookup
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MASTER_COO",
    "query": "What is the status of NPA-2026-003?",
    "conversation_id": "<conversation_id_from_test_1>"
  }'
```

**Expected**: Agent resolves NPA-2026-003 via `get_npa_by_id`, updates `current_project_id`, routes to NPA_ORCHESTRATOR via ROUTE_DOMAIN.

### Test 3: Query routing
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MASTER_COO",
    "query": "What is the PAC requirement for New-to-Group products?",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent classifies as `query_data`, routes to NPA_ORCHESTRATOR which will delegate to CF_NPA_Query_Assistant.

### Test 4: NPA exclusion awareness
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MASTER_COO",
    "query": "We are migrating our booking system to a new platform",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent recognizes this as a system migration (NPA exclusion) — not a product change. Informs user that NPA is NOT required for system changes that don't involve new products.

### Test 5: Prohibited product early warning
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "MASTER_COO",
    "query": "I want to create a cryptocurrency derivative product",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent warns about prohibited product detection at Tier 1, routes to NPA_ORCHESTRATOR with early warning context.

---

## Step 8: Integration with Angular Frontend

### How the Frontend Handles MASTER_COO → NPA_ORCHESTRATOR Delegation

```
1. User types message in AgentWorkspaceComponent
2. Angular DifyService.sendMessage('MASTER_COO', query, conversationId)
3. Express proxies to Dify Cloud: POST /chat-messages (DIFY_KEY_MASTER_COO)
4. MASTER_COO returns @@NPA_META@@ with ROUTE_DOMAIN { target_agent: "NPA_ORCHESTRATOR" }
5. Express parses envelope, returns metadata to Angular
6. Angular DifyService.processAgentRouting(metadata):
   - Calls switchAgent('NPA_ORCHESTRATOR') — pushes MASTER_COO to delegation stack
   - Returns { shouldSwitch: true, targetAgent: 'NPA_ORCHESTRATOR' }
7. Subsequent messages go to NPA_ORCHESTRATOR (separate Dify app, separate conversation_id)
8. NPA_ORCHESTRATOR delegates to specialists as needed
9. When NPA_ORCHESTRATOR completes, DifyService.returnToPreviousAgent() pops back to MASTER_COO
```

### Express Routes
- Chat: `POST /api/dify/chat` (for MASTER_COO, NPA_ORCHESTRATOR, IDEATION, DILIGENCE)
- Workflow: `POST /api/dify/workflow` (for CLASSIFIER, RISK, AUTOFILL, GOVERNANCE)

---

## Step 9: Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| @@NPA_META@@ missing from response | Agent not following envelope contract | Reinforce Rule #4 in prompt: "EVERY response MUST end with @@NPA_META@@" |
| Agent calls write tools | Wrong tools connected | Ensure ONLY 8 read/session/routing tools are enabled |
| Agent loses context mid-conversation | conversation_id not passed | Ensure Express proxy passes conversation_id on each turn |
| Agent chains two actions | Temperature too high or prompt not strict | Reduce temperature to 0.1-0.2, reinforce Rule #1 "One action per turn" |
| Agent answers domain questions directly | Not routing to NPA_ORCHESTRATOR | Reinforce Rule #6 "NEVER answer domain-specific questions yourself" |
| Session not created on first turn | session_create not called | Check tool connection; agent must call session_create before anything else |
| Envelope JSON invalid | Multiline JSON or extra whitespace | Ensure prompt says "JSON must be on a single line after @@NPA_META@@" |
| NPA_ORCHESTRATOR conversation lost | conversation_id not tracked per agent | DifyService maintains separate conversationIds per agent_id |

### Debug Mode
In Dify Cloud, enable **Debug Mode** for the Agent App:
- Shows each tool call and its result
- Shows conversation memory state
- Shows knowledge retrieval results
- Useful for verifying routing decisions and envelope format

---

## Architecture Summary

```
Angular Frontend (AgentWorkspaceComponent)
    | POST /api/dify/chat (agent_id=MASTER_COO)
Express Proxy (server/routes/dify-proxy.js)
    | POST {DIFY_BASE_URL}/chat-messages (DIFY_KEY_MASTER_COO)
Dify Cloud Agent App: CF_COO_Orchestrator (MASTER_COO — Tier 1)
    | Domain classification, session creation, context switching
    | Tool calls -> MCP Server (session_create, get_npa_by_id, etc.)
    | Response with @@NPA_META@@ { ROUTE_DOMAIN, target_agent: "NPA_ORCHESTRATOR" }
Express Proxy
    | Returns response + metadata
Angular DifyService
    | switchAgent('NPA_ORCHESTRATOR') — real delegation
    |
    | POST /api/dify/chat (agent_id=NPA_ORCHESTRATOR)
Express Proxy
    | POST {DIFY_BASE_URL}/chat-messages (DIFY_KEY_NPA_ORCHESTRATOR)
Dify Cloud Agent App: CF_NPA_Orchestrator (NPA_ORCHESTRATOR — Tier 2)
    | NPA intent classification, stage-aware routing, business rules
    | Delegates to specialists:
    |   CF_NPA_Ideation (Chatflow) → /chat-messages
    |   WF_NPA_Classify_Predict (Workflow) → /workflows/run
    |   WF_NPA_Risk (Workflow) → /workflows/run
    |   WF_NPA_Autofill (Workflow) → /workflows/run
    |   WF_NPA_Governance (Workflow) → /workflows/run
    |   WF_NPA_Doc_Lifecycle (Workflow) → /workflows/run
    |   WF_NPA_Monitoring (Workflow) → /workflows/run
    |   WF_NPA_Notification (Workflow) → /workflows/run
    |   CF_NPA_Query_Assistant (Chatflow) → /chat-messages
    |
    | Response with @@NPA_META@@ envelope
Express Proxy → Angular Frontend → Renders typed UI cards
```
