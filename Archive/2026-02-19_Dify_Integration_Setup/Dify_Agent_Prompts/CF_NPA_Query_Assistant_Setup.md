# QUERY ASSISTANT Chatflow — Dify Setup Guide
# Updated: 2026-02-20 | Version: 3.1 — Corrected tools alignment, 11 Dify app architecture
# Cross-verified against NPA_Business_Process_Deep_Knowledge.md

## Dify App Type: CHATFLOW (conversational, multi-turn)

The Query Assistant is a **Tier 3+4 conversational chatflow** — it receives natural language questions from users (routed via the NPA Orchestrator), calls 17 read-only MCP tools to fetch real NPA data, and returns citation-backed answers. It serves 2 logical agents: **DILIGENCE** and **KB_SEARCH**.

### Architecture
```
CF_COO_Orchestrator (Tier 1)
  └── CF_NPA_Orchestrator (Tier 2) → switchAgent('DILIGENCE') or switchAgent('KB_SEARCH')
        └── CF_NPA_Query_Assistant (Tier 3+4, DIFY_KEY_DILIGENCE)
              └── 17 MCP Tools (read-only: NPA data, governance, docs, monitoring, KB)
```

### Key Design Decisions
- **Chatflow, not Workflow**: This agent needs multi-turn conversation memory (follow-up questions, context retention, pronoun resolution)
- **Agent mode, not LLM-only**: Needs tool-calling to fetch real NPA data from the database
- **Strictly read-only**: ZERO write tools. Never creates, modifies, or deletes data
- **Dual-mode**: Single Dify app serves both DILIGENCE (deep regulatory Q&A) and KB_SEARCH (precedent retrieval) — differentiated by orchestrator routing

---

## Step 1: Create Chatflow App
1. Dify Cloud > Studio > Create App > **Agent** (Chat mode)
2. Name: `CF_NPA_Query_Assistant`
3. Description: "Read-only conversational Q&A for NPA processes, policies, regulatory requirements, and knowledge base search. Serves DILIGENCE + KB_SEARCH agents."

## Step 2: Agent Configuration

### Model Settings
- Model: Claude 3.5 Sonnet (or claude-sonnet-4-5) | CHAT mode
- Temperature: 0.2 (slightly higher than workflow agents — needs natural conversational tone, but still factual)
- Max Tokens: 4000 (answers can be detailed with tables, citations, precedent lists)

### Instructions (System Prompt)
- Copy from `CF_NPA_Query_Assistant_Prompt.md`

### Input — No Variables Required
Unlike Workflow apps (which have a START node with explicit input variables and a User Message Template), Chatflow apps receive user input directly via the API:
- `query` — The user's question (plain text, passed in the API call body)
- `conversation_id` — Dify manages multi-turn context automatically; pass empty string for new conversation, or the previous `conversation_id` for follow-ups

**No START node, no User Message Template needed.** The system prompt (Instructions) + KB retrieval + tools + the raw `query` are all the LLM receives.

### Knowledge Base
Attach these KB datasets:
- `KB_Conversational_Diligence` — Q&A patterns, interaction modes, answer synthesis rules
- `KB_Search_Agent` — RAG architecture, semantic search patterns, precedent enrichment
- `KB_NPA_Policies` — NPA policy manual content (classification, governance, risk)
- `KB_Prohibited_Items` — Prohibited products list, sanctions, regulatory restrictions

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 5
- Score Threshold: 0.5
- Chunk size: 1000 tokens

## Step 3: MCP Tools (17 read-only)

**Chatflow apps use MCP Tools** (via MCP SSE plugin). This is different from Workflow apps which use Custom Tools (OpenAPI import).

In the Agent settings, click **"Add Tool"** > select **MCP** as provider > add each tool from the MCP server.

| # | Tool | Category | Purpose |
|---|------|----------|---------|
| 1 | `get_npa_by_id` | NPA Data | Get project details, status, classification |
| 2 | `list_npas` | NPA Data | List NPA projects with filtering |
| 3 | `get_workflow_state` | NPA Data | Get current workflow stage and state |
| 4 | `classify_get_criteria` | Classification | Get 29 classification criteria with weights |
| 5 | `classify_get_assessment` | Classification | Read existing classification for a project |
| 6 | `governance_get_signoffs` | Governance | Get sign-off matrix for a project |
| 7 | `get_signoff_routing_rules` | Governance | Get routing rules by approval track |
| 8 | `check_sla_status` | Governance | Check SLA status for a project |
| 9 | `governance_check_loopbacks` | Governance | Check loop-back count and circuit breaker |
| 10 | `check_document_completeness` | Documents | Check doc completeness for a project |
| 11 | `get_document_requirements` | Documents | Get doc requirements by track |
| 12 | `check_breach_thresholds` | Monitoring | Check breach thresholds for monitored product |
| 13 | `get_post_launch_conditions` | Monitoring | Get post-launch conditions and status |
| 14 | `get_performance_metrics` | Monitoring | Get performance metrics for monitored product |
| 15 | `search_kb_documents` | Knowledge Base | Search KB docs by keyword or topic |
| 16 | `get_kb_document_by_id` | Knowledge Base | Retrieve specific KB document by ID |
| 17 | `get_pending_notifications` | Dashboard | Get pending notifications for a project |

**MCP Server URL**: `{MCP_SERVER_URL}/mcp/sse`
**OpenAPI Spec**: `{MCP_SERVER_URL}/openapi.json`

**CRITICAL: Read-only enforcement.** Only the 17 tools listed above should be attached. Do NOT attach any write tools (e.g., `governance_record_decision`, `governance_advance_stage`, `upload_document_metadata`, `send_notification`, `audit_log_action`, etc.). The Query Assistant must never modify data.

**NOTE on MCP Tool Coverage**: The full COO Agentic Workbench MCP server exposes 71+ total tools across 17 categories. This Query Assistant uses only 17 read-only tools. Only attach the 17 tools listed above — loading all 71+ tools overwhelms the LLM context window and causes timeouts.

## Step 4: Cross-Domain Query Examples

The Query Assistant can chain multiple tool calls for comprehensive answers:

| User Question | Tools Chained | Response Type |
|---------------|-------------|---------------|
| "Status of NPA-2026-003?" | `get_npa_by_id` + `get_workflow_state` | Project overview card |
| "Who hasn't signed off on NPA-2026-001?" | `governance_get_signoffs` + `check_sla_status` | Sign-off matrix with SLA |
| "Missing documents for NPA-2026-003?" | `check_document_completeness` + `get_document_requirements` | Gap analysis |
| "Show audit trail for NPA-2026-001" | `get_npa_by_id` (status context) | Audit log |
| "Any SLA breaches across portfolio?" | `list_npas` + `check_sla_status` (per project) | Portfolio SLA dashboard |
| "Post-launch issues for NPA-2026-002?" | `check_breach_thresholds` + `get_post_launch_conditions` + `get_performance_metrics` | Monitoring summary |
| "Policy on crypto-linked products?" | `search_kb_documents` | KB search results |
| "Compare NPA-2026-001 and NPA-2026-003" | Two `get_npa_by_id` calls + synthesis | Side-by-side comparison |
| "What documents needed for NTG?" | `get_document_requirements` + `search_kb_documents` | Requirements + policy context |
| "Classification criteria for this product" | `classify_get_criteria` + `search_kb_documents` | Scoring guide |

## Step 5: KB Upload

Upload these files to Dify Knowledge datasets:

| Dataset Name | Source File | Purpose |
|-------------|------------|---------|
| KB_Conversational_Diligence | `Dify_Agent_KBs/KB_Conversational_Diligence.md` | Q&A patterns, interaction modes |
| KB_Search_Agent | `Dify_Agent_KBs/KB_Search_Agent.md` | RAG search, precedent enrichment |
| KB_NPA_Policies | `Dify_KB_Docs/KB_NPA_Policies.md` | Policy manual, classification rules |
| KB_Prohibited_Items | `Dify_KB_Docs/KB_Prohibited_Items.md` | Prohibited products, sanctions |

**Dataset Settings:**
- Indexing mode: High Quality
- Chunk size: 1000 tokens
- Chunk overlap: 100 tokens
- Retrieval: Hybrid (keyword + semantic)

## Step 6: API Key
1. Publish the Chatflow app
2. Go to App > API Access
3. Copy the API key
4. Add to `.env`: `DIFY_KEY_DILIGENCE=app-xxxxx`

**Note**: Both DILIGENCE and KB_SEARCH logical agents share this same API key. The `dify-agents.js` registry maps both to the same Dify app with `type: 'chat'`.

## Step 7: Test via Express Proxy

```bash
# Test: Regulatory Q&A (Diligence mode)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"DILIGENCE","query":"What are the classification criteria for NTG products?","conversation_id":""}'

# Test: KB Search (KB Search mode)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"KB_SEARCH","query":"Search for similar NPAs to an FX Option on GBP/USD with BBB+ counterparty","conversation_id":""}'

# Test: Live data lookup (project-specific)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"DILIGENCE","query":"Show me the sign-off status for NPA-2026-001","conversation_id":""}'

# Test: Cross-domain query (chained tools)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"DILIGENCE","query":"What is the full status of NPA-2026-003 including documents and governance?","conversation_id":""}'

# Test: Multi-turn conversation (use conversation_id from first response)
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"DILIGENCE","query":"What about the risk assessment?","conversation_id":"<conversation_id_from_previous>"}'
```

## Step 8: Integration with Orchestrator

The NPA Orchestrator routes queries to this agent when:
1. Intent is classified as `query_data` — questions about NPA status, data, policies
2. User asks "what is", "explain", "show me", "status", "list", "who", "how does"
3. Pure questions (no action verbs like "create", "approve", "classify")

**Routing in CF_NPA_Orchestrator:**
```
Intent: query_data → CF_NPA_Query_Assistant (POST /v1/chat-messages)
```

The Orchestrator passes the user's question directly as the `query` parameter. The Query Assistant maintains its own conversation context via `conversation_id` for multi-turn Q&A.

## Step 9: Architecture Position (11 Dify Apps)

```
CF_COO_Orchestrator (Tier 1) ← MASTER_COO
  └── CF_NPA_Orchestrator (Tier 2) ← NPA_ORCHESTRATOR
        ├── CF_NPA_Ideation (Tier 3, Chatflow) ← IDEATION
        ├── WF_NPA_Classify_Predict (Tier 3, Workflow) ← CLASSIFIER + ML_PREDICT
        ├── WF_NPA_Risk (Tier 3, Workflow) ← RISK
        ├── WF_NPA_Autofill (Tier 3, Workflow) ← AUTOFILL
        ├── WF_NPA_Governance (Tier 3, Workflow) ← GOVERNANCE
        ├── WF_NPA_Doc_Lifecycle (Tier 3, Workflow) ← DOC_LIFECYCLE
        ├── WF_NPA_Monitoring (Tier 3, Workflow) ← MONITORING
        ├── CF_NPA_Query_Assistant (Tier 3+4, Chatflow) ← DILIGENCE + KB_SEARCH  ★ THIS APP
        └── WF_NPA_Notification (Tier 4, Workflow) ← NOTIFICATION
```
