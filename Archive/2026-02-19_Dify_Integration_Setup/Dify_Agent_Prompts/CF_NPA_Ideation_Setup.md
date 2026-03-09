# IDEATION Agent — Dify Setup Guide
# Updated: 2026-02-20 | Cross-verified against NPA_Business_Process_Deep_Knowledge.md
# Version: 1.0

## Dify App Type: CHATFLOW (Agent App — NOT Workflow)

The Ideation Agent is a **Tier 3 conversational Agent App** — it conducts a multi-turn interview with the user, calls MCP tools for similarity search, prohibited list checks, and NPA creation, then hands off to the Orchestrator. It maintains conversation state across turns.

**Key difference from Classifier/Risk/AutoFill:** Those are stateless Workflows (WF_ prefix). Ideation is a stateful Chatflow (CF_ prefix) because it requires multi-turn conversation memory and tool-calling capability.

---

## Step 1: Create Agent App in Dify Cloud

1. Go to Dify Cloud > Studio > Create App > **Agent**
2. Name: `CF_NPA_Ideation`
3. Description: "Conversational NPA Product Ideation Agent — replaces 47-field manual form with intelligent interview. Guides users through discovery (Q1-Q9), runs pre-screen checks, searches for similar historical NPAs, detects classification signals, and creates draft NPA projects."
4. Agent Mode: **Function Call** (recommended for structured tool use)

**IMPORTANT — Dify App types:**
- **Agent App (Chatflow)**: Multi-turn conversation + tool-calling loop. This is the correct type for the Ideation Agent.
- **Workflow**: Stateless input→output. NOT suitable — Ideation requires conversation memory and iterative tool calls.

## Step 2: Agent Configuration

### System Instructions
Copy the full prompt from `CF_NPA_Ideation_Prompt.md` into the Agent App's **Instructions** field.

### Model Selection
- **Model**: Claude 3.5 Sonnet (recommended) or GPT-4o
  - Needs strong conversational ability + entity extraction + reasoning
  - Ideation is the most conversationally demanding agent in the system
- **Temperature**: 0.3 (slightly creative for natural conversation, but controlled enough for accurate extraction)
- **Max Tokens**: 4000 (responses include entity extraction + proactive warnings + tool calls)
- **Context Window**: Ensure the model supports long context — conversations can span 15-20 turns

### Conversation Settings
- **Opening Statement**: Leave blank — the Orchestrator (MASTER_COO) provides the initial greeting and routes to Ideation
- **Follow-Up Questions**: Disabled (the agent manages its own question flow via Q1-Q9)
- **Conversation Memory**: Enabled (critical — agent needs full conversation history for entity extraction and skip logic)

## Step 3: Configure MCP Tools

The Ideation Agent requires tool access. Configure these tools in the Agent App:

### Option A: MCP Server (Recommended)
Connect to the MCP tools server:
- **MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
- **OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

### Option B: Custom API Tool Definitions
If MCP SSE is not available, define each tool manually in Dify:

#### Tool 1: `ideation_create_npa`
- **Purpose**: Create a new NPA project record in the database
- **When Called**: After discovery phase completes and initial data is extracted
- **Parameters**:
  ```json
  {
    "title": { "type": "string", "required": true, "description": "Product/NPA title" },
    "description": { "type": "string", "description": "Product description" },
    "npa_type": { "type": "string", "enum": ["New-to-Group", "Variation", "Existing"], "required": true },
    "product_category": { "type": "string", "description": "e.g. Fixed Income, FX, Equity" },
    "risk_level": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH"], "required": true },
    "is_cross_border": { "type": "boolean", "default": false },
    "notional_amount": { "type": "number", "description": "Estimated notional in USD" },
    "currency": { "type": "string", "default": "USD" }
  }
  ```
- **Returns**: `{ npa_id, title, npa_type, risk_level, current_stage, message }`

#### Tool 2: `ideation_find_similar`
- **Purpose**: Search for similar historical NPAs by keyword matching
- **When Called**: As soon as product_type + underlying are known (Phase 2)
- **Parameters**:
  ```json
  {
    "search_term": { "type": "string", "required": true, "description": "Product name or description" },
    "npa_type": { "type": "string", "description": "Filter by NPA type" },
    "product_category": { "type": "string", "description": "Filter by product category" },
    "limit": { "type": "integer", "default": 10, "description": "Max results" }
  }
  ```
- **Returns**: `{ matches: [...], count, search_term }`
- **NOTE**: This tool performs SQL LIKE-based search, not semantic similarity. For best results, use specific product terms (e.g., "FX Option GBP/USD") rather than long descriptions.

#### Tool 3: `ideation_get_prohibited_list`
- **Purpose**: Retrieve prohibited products/activities list for pre-screen check
- **When Called**: During Phase 3 (Pre-Screen) or immediately after product keywords detected
- **Parameters**:
  ```json
  {
    "product_description": { "type": "string", "description": "Product to check" },
    "layer": { "type": "string", "description": "Filter: INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC" },
    "severity": { "type": "string", "description": "Filter by severity" }
  }
  ```
- **Returns**: `{ prohibited_items: [...], by_layer: {...}, total_items, layers }`

#### Tool 4: `ideation_save_concept`
- **Purpose**: Save product concept notes and rationale as form data
- **When Called**: After NPA project is created, to persist extracted interview data
- **Parameters**:
  ```json
  {
    "project_id": { "type": "string", "required": true, "description": "NPA project ID from create step" },
    "concept_notes": { "type": "string", "required": true, "description": "Product concept notes" },
    "product_rationale": { "type": "string", "description": "Business rationale" },
    "target_market": { "type": "string", "description": "Target market" },
    "estimated_revenue": { "type": "number", "description": "Annual revenue estimate" }
  }
  ```
- **Returns**: `{ project_id, fields_saved, field_keys }`

#### Tool 5: `ideation_list_templates`
- **Purpose**: List available NPA templates with section/field counts
- **When Called**: During Phase 4 to select the correct template for the product
- **Parameters**:
  ```json
  {
    "active_only": { "type": "boolean", "default": true }
  }
  ```
- **Returns**: `{ templates: [...], count }`

### Additional Tools (if available on MCP server)
These tools are referenced in the prompt but are implemented outside the ideation.py module:
- `get_prospects` — List product opportunity pipeline items
- `convert_prospect_to_npa` — Convert a prospect into NPA draft
- `session_log_message` — Log conversation events to audit trail

If these tools are not available on your MCP server, the agent will function correctly without them — they are enhancement tools for pipeline management and audit logging.

## Step 4: Upload KB Documents to Dify

### Dataset: "NPA Ideation Knowledge"
1. Go to Dify > Knowledge > Create Knowledge
2. Name: "NPA Ideation Knowledge"
3. Upload these files:
   - `Context/2026-02-19/Dify_Agent_KBs/KB_Ideation_Agent.md` (primary — interview process, entity extraction, edge cases, decision tables)
   - `Context/2026-02-19/Dify_KB_Docs/KB_NPA_Policies.md` (supporting — policy rules, classification definitions)
   - `Context/2026-02-19/Dify_KB_Docs/KB_Prohibited_Items.md` (supporting — prohibited list reference)
4. **Chunking settings**:
   - Chunk size: **1000 tokens** (KB has detailed sections; moderate chunks balance context and precision)
   - Overlap: **100 tokens**
   - Separator: `---` (the KB uses `---` between major sections)
5. **Embedding model**: text-embedding-3-small (or equivalent)
6. **Retrieval mode**: Hybrid (keyword + semantic)

### Connect Knowledge to Agent
In the Agent App settings:
- Enable **Knowledge Base** (context retrieval)
- Select the "NPA Ideation Knowledge" dataset
- Query variable: The agent's conversation context will automatically query the KB
- Top K: 5
- Score threshold: 0.5

## Step 5: Get API Key

After publishing the Agent App:
1. Go to App > API Access
2. Copy the API key (starts with `app-`)
3. Add to Express `.env` file:
```
DIFY_KEY_IDEATION=app-xxxxxxxxxxxxxxxxxx
```
4. Verify in `server/config/dify-agents.js`:
```javascript
IDEATION: {
    name: 'Ideation Agent',
    type: 'chat',          // IMPORTANT: 'chat' not 'workflow'
    appId: process.env.DIFY_KEY_IDEATION,
    description: 'Product Ideation Interview Agent'
}
```

**CRITICAL**: The type must be `'chat'` (not `'workflow'`). This tells the Express proxy to use the Dify Chat Message API (`/chat-messages`) instead of the Workflow Run API (`/workflows/run`). Chat endpoints maintain `conversation_id` for multi-turn conversation state.

## Step 6: Test via Express Proxy

### Test 1: Start a new conversation
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "IDEATION",
    "query": "I want to create an NPA for a new FX Option product",
    "conversation_id": ""
  }'
```

Expected: Agent responds with Q1 or an initial greeting, returns a `conversation_id`.

### Test 2: Continue the conversation
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "IDEATION",
    "query": "It is an FX Option on GBP/USD, 6-month European expiry, for corporate hedging. Notional around $75M.",
    "conversation_id": "<conversation_id_from_test_1>"
  }'
```

Expected: Agent extracts product_type=FX Option, underlying=GBP/USD, tenor=6M, use_case=Hedging, notional=$75M. Proactively warns about Finance VP approval (>$50M) and ROAE analysis (>$20M). Asks next question (Q3 or Q6 depending on skip logic).

### Test 3: Tool call — Similarity Search
After sufficient discovery data, the agent should automatically call `ideation_find_similar` with search_term="FX Option GBP/USD". Verify the tool call appears in the Dify debug logs.

### Test 4: Cross-border detection
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "IDEATION",
    "query": "Booked in Singapore, counterparty is in London",
    "conversation_id": "<conversation_id>"
  }'
```

Expected: Agent detects cross-border, warns about 5 mandatory sign-offs, adds ~4-5 days to timeline estimate.

### Test 5: Prohibited product detection
```bash
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "IDEATION",
    "query": "It is a cryptocurrency derivative for retail clients",
    "conversation_id": "<conversation_id>"
  }'
```

Expected: Agent calls `ideation_get_prohibited_list`, detects match, responds with HARD_STOP marker and prohibit message.

## Step 7: Integration with Orchestrator

The Ideation Agent is called by the NPA Orchestrator (MASTER_COO):

### Conversation Flow
```
1. User opens NPA Workbench → OrchestratorChatComponent loads
2. Component sends empty message to MASTER_COO → gets greeting
3. User describes product intent → MASTER_COO routes to IDEATION
4. DifyService.setActiveAgent('IDEATION') — switches conversation target
5. User messages now go to IDEATION via /chat-messages (with conversation_id)
6. IDEATION conducts Q1-Q9 interview, calls tools as needed
7. IDEATION sends FINALIZE_DRAFT marker → UI triggers auto-classification
8. OrchestratorChatComponent calls DifyService.runWorkflow('CLASSIFIER', inputs)
9. Classification result displayed as CLASSIFICATION card
10. Orchestrator continues with RISK, AUTOFILL workflows as needed
```

### Agent Routing (NPA_ACTION Markers)
The Ideation Agent uses these markers to communicate with the Orchestrator:

| Marker | When Used | UI Effect |
|--------|-----------|-----------|
| `HARD_STOP` | Prohibited product detected | Red HARD_STOP card, blocks NPA creation |
| `SHOW_KB_RESULTS` | Similarity search complete | Shows matching NPAs (informational) |
| `FINALIZE_DRAFT` | NPA draft created | Triggers auto-classification workflow, shows "Draft Ready" banner |

### Angular Component: `OrchestratorChatComponent`
- Selector: `app-orchestrator-chat`
- File: `src/app/components/npa/ideation-chat/ideation-chat.component.ts`
- Handles multi-agent routing, card rendering, thinking indicator, agent activity strip
- `finishDraft()` method auto-triggers CLASSIFIER workflow after FINALIZE_DRAFT
- `parseClassifierResponse()` maps Dify workflow JSON → ClassificationResult interface

### Express Routes
- Chat: `POST /api/dify/chat` (with agent_id=IDEATION)
- Workflow: `POST /api/dify/workflow` (for CLASSIFIER/RISK/AUTOFILL triggered by Orchestrator)

## Step 8: Dify Debug Tips

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Agent doesn't call tools | Tools not connected to Agent App | Ensure MCP tools are added in Agent App > Tools section |
| Agent loses context mid-conversation | conversation_id not passed | Ensure Express proxy passes conversation_id on each turn |
| Markers appear in conversation text | Agent wrapping markers in code blocks | Prompt says "NEVER wrap in code blocks or backticks" — reinforce in system instructions |
| Agent skips questions too aggressively | Confidence threshold too low | KB specifies >90% for skip — agent may need tuning |
| Tool calls fail with timeout | MCP server unreachable | Check MCP server status at health endpoint |
| Agent generates lengthy responses | Temperature too high | Reduce to 0.2-0.3 for more focused responses |
| FINALIZE_DRAFT not triggering classification | Marker format incorrect | Check marker appears as plain text at end of response, not in code fence |

### Debug Mode
In Dify Cloud, enable **Debug Mode** for the Agent App:
- Shows each tool call and its result
- Shows conversation memory state
- Shows knowledge retrieval results
- Useful for verifying entity extraction accuracy

## Step 9: DB Tables Used by Ideation

| Table | Usage |
|-------|-------|
| `npa_projects` | Created by `ideation_create_npa` — stores NPA project record |
| `npa_form_data` | Written by `ideation_save_concept` — stores extracted concept data |
| `ref_prohibited_items` | Read by `ideation_get_prohibited_list` — prohibited products reference |
| `ref_npa_templates` | Read by `ideation_list_templates` — template definitions |
| `ref_npa_sections` | Joined by `ideation_list_templates` — template sections |
| `ref_npa_fields` | Joined by `ideation_list_templates` — template fields |

---

## Architecture Summary

```
Angular Frontend (OrchestratorChatComponent)
    ↓ POST /api/dify/chat (agent_id=IDEATION, query, conversation_id)
Express Proxy (server/routes/dify.js)
    ↓ POST {DIFY_BASE_URL}/chat-messages (API key from DIFY_KEY_IDEATION)
Dify Cloud Agent App (CF_NPA_Ideation)
    ↓ Conversation memory + Knowledge retrieval
    ↓ Tool calls → MCP Server (ideation_create_npa, ideation_find_similar, etc.)
    ↓ Response with NPA_ACTION markers
Express Proxy
    ↓ Returns response + metadata to Angular
Angular Frontend
    ↓ Parses NPA_ACTION markers
    ↓ FINALIZE_DRAFT → triggers CLASSIFIER workflow
    ↓ HARD_STOP → shows prohibited card
    ↓ Renders chat messages + rich cards
```
