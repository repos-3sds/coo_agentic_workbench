# NPA DOMAIN ORCHESTRATOR (NPA_ORCHESTRATOR) — Dify Setup Guide
# Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 2.0 — Separate Dify app (no longer shared with MASTER_COO)

## Dify App Type: CHATFLOW (Agent App — Separate from MASTER_COO)

The NPA Domain Orchestrator is a **Tier 2 conversational Agent App** — it handles all NPA-specific routing: intent classification within the NPA domain, stage-aware validation, specialist delegation (Ideation, Classifier, Risk, Autofill, Governance, Query), and NPA business rule enforcement.

**Architecture:** NPA_ORCHESTRATOR is a **separate Dify Chatflow app** (`CF_NPA_Orchestrator`) with its own API key (`DIFY_KEY_NPA_ORCHESTRATOR`). MASTER_COO delegates to it via `ROUTE_DOMAIN` action, exactly the same way NPA_ORCHESTRATOR delegates to Ideation, Classifier, Risk, etc.

```
CF_COO_Orchestrator (MASTER_COO — Tier 1, DIFY_KEY_MASTER_COO)
    ↓ ROUTE_DOMAIN { target_agent: "NPA_ORCHESTRATOR" }
CF_NPA_Orchestrator (NPA_ORCHESTRATOR — Tier 2, DIFY_KEY_NPA_ORCHESTRATOR)  ← THIS APP
    ↓ delegates to specialists
CF_NPA_Ideation, WF_NPA_Classify_Predict, WF_NPA_Risk, etc. (Tier 3)
```

---

## Step 1: Create Agent App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Agent**
2. Name: `CF_NPA_Orchestrator`
3. Description: "NPA Domain Orchestrator — Tier 2 NPA-specific routing agent. Receives NPA-domain requests from MASTER_COO, classifies NPA intents, validates against current stage, enforces business rules (R01-R44), and delegates to 6 specialist apps."
4. Agent Mode: **Function Call** (recommended for structured tool use)

**IMPORTANT — Dify App types:**
- **Agent App (Chatflow)**: Multi-turn conversation + tool-calling loop. This is the correct type.
- **Workflow**: Stateless input-to-output. NOT suitable — NPA_ORCHESTRATOR requires conversation memory for multi-turn NPA lifecycle tracking.

## Step 2: Agent Configuration

### System Instructions
Copy the full prompt from `CF_NPA_Orchestrator_Prompt.md` into the Agent App's **Instructions** field.

This prompt provides the agent with:
- NPA intent classification (7 intents: create_npa, classify_npa, risk_assessment, autofill_npa, governance, query_data, switch_project)
- Stage-aware routing (IDEATION → CLASSIFICATION → RISK → AUTOFILL → SIGN_OFF → POST_LAUNCH)
- Specialist delegation (6 apps via HTTP Request)
- Business rule enforcement (R01-R44)
- @@NPA_META@@ envelope contract

**NOTE:** Only the NPA Orchestrator prompt goes into this app. The MASTER_COO prompt goes into its own separate app (`CF_COO_Orchestrator`).

### Model Selection
- **Model**: Claude 3.5 Sonnet (recommended) or GPT-4o
  - Needs strong NPA domain knowledge + intent classification + business rule reasoning
  - Must handle long conversation histories (20-30+ turns across NPA lifecycle)
- **Temperature**: 0.2 (low — needs deterministic routing and business rule enforcement)
- **Max Tokens**: 2000 (responses are routing confirmations + @@NPA_META@@ envelope)
- **Context Window**: Ensure the model supports long context — NPA lifecycle conversations can span 30+ turns

### Conversation Settings
- **Opening Statement**: Leave blank — MASTER_COO provides the initial greeting and routes to NPA_ORCHESTRATOR
- **Follow-Up Questions**: Disabled (the agent manages its own routing logic)
- **Conversation Memory**: Enabled (critical — agent needs full history for stage tracking and multi-turn lifecycle)

---

## Step 3: Configure MCP Tools

The NPA Orchestrator requires the same 8 tools as MASTER_COO (read-only + session management):

### Option A: MCP Server (Recommended)
Connect to the MCP tools server:
- **MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
- **OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

Select these 8 tools:
1. `session_create` — Create tracing session
2. `session_log_message` — Log agent reasoning for audit
3. `log_routing_decision` — Record specialist delegation
4. `get_npa_by_id` — Load project context
5. `list_npas` — Portfolio queries
6. `ideation_find_similar` — Resolve product names
7. `get_workflow_state` — Check current stage
8. `get_user_profile` — Load user role

See `CF_COO_Orchestrator_Setup.md` Step 3 for full parameter schemas.

---

## Step 4: Specialist Delegation Configuration

The NPA_ORCHESTRATOR delegates to 6 specialist apps. In Dify, these can be configured as **HTTP Request nodes** within the Chatflow, or delegation can be handled by the Angular DifyService (which is the current implementation).

### Chatflow Delegations (Multi-Turn)

#### CF_NPA_Ideation
- **When**: `create_npa` intent
- **HTTP**: POST /v1/chat-messages
- **Key**: `DIFY_KEY_IDEATION`
- **Body**: `{ "inputs": {}, "query": "{{user_message}}", "conversation_id": "{{ideation_conversation_id}}", "response_mode": "blocking", "user": "{{user_id}}" }`
- **Persist**: Save response `conversation_id` to `ideation_conversation_id`
- **Notes**: Multi-turn — Ideation conducts Q1-Q9 interview across several turns

#### CF_NPA_Query_Assistant
- **When**: `query_data` intent
- **HTTP**: POST /v1/chat-messages
- **Key**: `DIFY_KEY_DILIGENCE`
- **Body**: Same pattern as Ideation
- **Notes**: Separate conversation_id (not stored in variables — each query session is independent)

### Workflow Delegations (Stateless)

#### WF_NPA_Classify_Predict
- **When**: `classify_npa` intent
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_CLASSIFIER`
- **Body**: `{ "inputs": { "project_id": "{{current_project_id}}", "user_role": "{{user_role}}" }, "response_mode": "blocking", "user": "{{user_id}}" }`
- **Response**: Extract `data.outputs.agent_action`, `data.outputs.payload`
- **Returns**: SHOW_CLASSIFICATION or SHOW_PREDICTION

#### WF_NPA_Risk
- **When**: `risk_assessment` intent
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_RISK`
- **Body**: Same pattern as Classifier
- **Returns**: SHOW_RISK or HARD_STOP

#### WF_NPA_Autofill
- **When**: `autofill_npa` intent
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_AUTOFILL`
- **Body**: Requires additional inputs from classification (see AutoFill Setup Guide)
- **Returns**: SHOW_AUTOFILL

#### WF_NPA_Governance
- **When**: `governance` intent (sign-offs, SLA, approvals, stage advancement)
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_GOVERNANCE`
- **Body**: Same pattern as Classifier
- **Returns**: SHOW_GOVERNANCE

#### WF_NPA_Doc_Lifecycle
- **When**: `documents` intent (doc completeness, uploads, validation, expiry)
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_DOC_LIFECYCLE`
- **Body**: Same pattern as Classifier
- **Returns**: SHOW_DOC_STATUS

#### WF_NPA_Monitoring
- **When**: `monitoring` intent (post-launch metrics, breaches, PIR, dormancy)
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_MONITORING`
- **Body**: Same pattern as Classifier
- **Returns**: SHOW_MONITORING

#### WF_NPA_Notification
- **When**: `notification` intent (alerts, escalation chains, SLA breach alerts)
- **HTTP**: POST /v1/workflows/run
- **Key**: `DIFY_KEY_NOTIFICATION`
- **Body**: Same pattern as Classifier
- **Returns**: ROUTE_WORK_ITEM

---

## Step 5: Upload KB Documents to Dify

### Dataset 1: "NPA Domain Knowledge"
1. Go to Dify > Knowledge > Create Knowledge
2. Name: "NPA Domain Knowledge"
3. Upload these files:
   - `KB_Domain_Orchestrator_NPA.md` — NPA domain deep-dive (lifecycle, classification, approval workflows, business rules)
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

### Connect Knowledge to Agent
In the Agent App settings:
- Enable **Knowledge Base** (context retrieval)
- Select the "NPA Domain Knowledge" dataset
- Top K: 5
- Score threshold: 0.5

---

## Step 6: Conversation Variables (Auto-Detected)

The prompt declares conversation variables using `{{variable}}` syntax. Dify will **auto-detect** these when you paste the prompt into the Instructions field — no manual configuration needed.

**Variables auto-detected from prompt:**

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `session_id` | string | "" | Passed from MASTER_COO or created on first turn |
| `current_project_id` | string | "" | Active NPA project ID |
| `current_stage` | string | "" | Current workflow stage (IDEATION/CLASSIFICATION/RISK/AUTOFILL/SIGN_OFF/POST_LAUNCH) |
| `user_role` | string | "MAKER" | User role (MAKER/CHECKER/APPROVER/COO) |
| `ideation_conversation_id` | string | "" | Conversation ID for CF_NPA_Ideation multi-turn |
| `last_action` | string | "" | Last AgentAction returned |

**Verification:** After pasting the prompt, check the Dify Chatflow's variable panel — all 6 variables should appear automatically. If any are missing, add them manually with the types/defaults shown above.

---

## Step 7: Get API Key

After publishing the Agent App:
1. Go to App > API Access
2. Copy the API key (starts with `app-`)
3. Add to Express `.env` file:
```
DIFY_KEY_NPA_ORCHESTRATOR=app-xxxxxxxxxxxxxxxxxx
```
4. Verify in `server/config/dify-agents.js`:
```javascript
NPA_ORCHESTRATOR: {
    key: process.env.DIFY_KEY_NPA_ORCHESTRATOR,
    type: 'chat',              // 'chat' for Chatflow
    difyApp: 'CF_NPA_Orchestrator',
    name: 'NPA Domain Orchestrator',
    tier: 2
}
```

**CRITICAL**: The type must be `'chat'` (not `'workflow'`). This tells the Express proxy to use the Dify Chat Message API (`/chat-messages`) with conversation_id persistence. The API key is DIFFERENT from MASTER_COO's key.

---

## Step 8: Test via Express Proxy

### Test 1: Direct NPA intent — Create NPA (Ideation routing)
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "I want to create a new FX Option product for institutional clients",
    "conversation_id": ""
  }'
```

**Expected**:
- Intent: `create_npa`
- Routes to CF_NPA_Ideation
- Returns `@@NPA_META@@` with `ROUTE_DOMAIN` action and `target_agent: "IDEATION"`

### Test 2: Classification routing
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "Classify NPA-2026-003",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**:
- Intent: `classify_npa`
- Resolves project via `get_npa_by_id`
- Routes to WF_NPA_Classify_Predict
- Returns `SHOW_CLASSIFICATION` with ClassificationResult

### Test 3: Stage-aware validation (out of order)
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "Run autofill for NPA-2026-003",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected** (if project is at CLASSIFICATION stage):
- Agent warns: "NPA-2026-003 is at CLASSIFICATION stage. You should complete risk assessment before autofill. Would you like to run risk assessment first?"
- Returns `ASK_CLARIFICATION` with options

### Test 4: Cross-border detection
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "The product is booked in Singapore but the counterparty is in London",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent flags cross-border, notes 5 mandatory sign-offs requirement, includes in routing context.

### Test 5: Prohibited product hard stop
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "I want to create a Bitcoin futures product for retail clients",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent calls prohibited check, detects match (cryptocurrency + retail), returns HARD_STOP.

### Test 6: Existing product routing awareness
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "NPA_ORCHESTRATOR",
    "query": "We want to reactivate an FX Forward that has been dormant for 2 years",
    "conversation_id": "<conversation_id>"
  }'
```

**Expected**: Agent recognizes dormant < 3 years, asks about fast-track criteria (prior live trade, PIR completed, no variations), suggests B3 Fast-Track Dormant path or standard NPA Lite.

### Test 7: Multi-turn NPA lifecycle
Run these messages sequentially with the same `conversation_id`:
1. "Create a new structured deposit product" → ROUTE_DOMAIN to IDEATION
2. "It's a Dual Currency Deposit, $20M notional, for HNW clients" → Forward to Ideation
3. "Classify it" → SHOW_CLASSIFICATION
4. "Run risk assessment" → SHOW_RISK
5. "Fill the template" → SHOW_AUTOFILL
6. "Who needs to sign off?" → SHOW_GOVERNANCE
7. "What documents are missing?" → SHOW_DOC_STATUS

**Expected**: Each step follows the NPA lifecycle. Agent tracks `current_project_id` and `current_stage` across turns.

---

## Step 9: Business Rule Verification Checklist

Verify these critical business rules are enforced at routing level:

| Rule | Test Scenario | Expected Behavior |
|------|--------------|-------------------|
| R01 | Mention prohibited product | Warn before classification |
| R07 | Different booking/counterparty locations | Flag 5 mandatory sign-offs |
| R10 | Prohibited match from risk assessment | Return HARD_STOP |
| R11 | NTG classification | Always routes to Full NPA track |
| R16 | NTG product | Ask about PAC approval status |
| R25-R26 | Check current_stage | Validate Maker-Checker flow |
| R27 | Product launched > 1 year ago | Flag validity concerns |
| R30-R32 | NTG product launched | Remind about PIR requirement |
| R35 | Loop-back count >= 3 | Flag circuit breaker escalation |
| R37 | SOP review pending | Note 48-hour SLA |
| R40-R42 | Notional > $20M/$50M/$100M | Flag escalation requirements |

---

## Step 10: Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Agent routes to wrong specialist | Intent classification error | Add more trigger keywords in prompt; reduce temperature |
| Agent chains two workflows | Missing "one action per turn" enforcement | Reinforce Anti-Pattern #1 in prompt |
| Stage validation too strict | Agent blocks out-of-order requests | Prompt says "suggestions, not hard blocks" — if user insists, proceed |
| Ideation conversation loses state | ideation_conversation_id not persisted | Check Dify conversation variable is updated after each Ideation response |
| Workflow returns raw JSON | Orchestrator not wrapping in envelope | Ensure Orchestrator wraps workflow outputs in conversational text + @@NPA_META@@ |
| Missing business rule flags | Agent not proactively warning | KB retrieval may need tuning; increase Top K or lower score threshold |
| MASTER_COO not delegating here | ROUTE_DOMAIN not sent | Check MASTER_COO prompt recognizes NPA domain intents |

---

## Step 11: DB Tables Used by NPA Orchestrator

| Table | Usage | Tool |
|-------|-------|------|
| `agent_sessions` | Created by `session_create` | session_create |
| `agent_messages` | Written by `session_log_message` | session_log_message |
| `npa_agent_routing_decisions` | Written by `log_routing_decision` | log_routing_decision |
| `npa_projects` | Read by `get_npa_by_id`, `list_npas`, `ideation_find_similar` | Multiple |
| `npa_workflow_states` | Read by `get_workflow_state` | get_workflow_state |
| `users` | Read by `get_user_profile` | get_user_profile |

---

## Architecture Summary

```
MASTER_COO (CF_COO_Orchestrator — Tier 1, DIFY_KEY_MASTER_COO)
    | ROUTE_DOMAIN { target_agent: "NPA_ORCHESTRATOR" }
    | Angular DifyService.switchAgent('NPA_ORCHESTRATOR')
    ↓
NPA_ORCHESTRATOR (CF_NPA_Orchestrator — Tier 2, DIFY_KEY_NPA_ORCHESTRATOR)  ← THIS APP
    | POST /api/dify/chat (agent_id=NPA_ORCHESTRATOR)
    | Express → POST {DIFY_BASE_URL}/chat-messages (DIFY_KEY_NPA_ORCHESTRATOR)
    |
    | NPA intent classification + stage validation + business rules
    | Tool calls → MCP Server (8 tools)
    |
    | Delegates to specialists:
    |── CF_NPA_Ideation (Chatflow) → switchAgent('IDEATION')
    |── WF_NPA_Classify_Predict (Workflow) → /workflows/run
    |── WF_NPA_Risk (Workflow) → /workflows/run
    |── WF_NPA_Autofill (Workflow) → /workflows/run
    |── WF_NPA_Governance (Workflow) → /workflows/run
    |── WF_NPA_Doc_Lifecycle (Workflow) → /workflows/run
    |── WF_NPA_Monitoring (Workflow) → /workflows/run
    |── WF_NPA_Notification (Workflow) → /workflows/run
    |── CF_NPA_Query_Assistant (Chatflow) → switchAgent('DILIGENCE')
    |
    | Response with @@NPA_META@@ envelope
    ↓
Express Proxy → Angular Frontend → Renders typed UI cards
```
