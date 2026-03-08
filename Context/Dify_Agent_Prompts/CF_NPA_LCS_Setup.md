# CF_NPA_LCS — Dify Setup Guide
# Updated: 2026-02-23 | Version: 1.0
# Agent: AG_NPA_LCS | Legal, Compliance & Secretariat
# Sections: Appendices 1-6

## Dify App Type: CHATFLOW (conversational, multi-turn)

The LCS Agent is a **Tier 3B conversational chatflow** for the Draft Builder. It provides sign-off guidance for Legal, Compliance & Secretariat, helping NPA makers draft and refine fields in Appendices 1-6 of the NPA template. It covers entity structures, intellectual property, financial crime compliance (AML/CFT), risk data assessment, trading infrastructure, and third-party platform governance.

### Architecture
```
NPA Draft Builder (Angular Frontend)
  └── Agent Chat Panel > "LCS" tab
        └── DifyService.sendMessageStreamed(prompt, {}, 'AG_NPA_LCS')
              └── Express Proxy > POST /api/dify/chat { agent_id: 'AG_NPA_LCS' }
                    └── Dify Cloud > CF_NPA_LCS (Chatflow) > DIFY_KEY_AG_NPA_LCS
```

### Key Design Decisions
- **Chatflow, not Workflow**: Multi-turn conversation — users iterate on entity selections, discuss compliance requirements, refine third-party governance
- **No MCP Tools**: Relies on system prompt knowledge + conversation context
- **@@NPA_META@@ output**: Structured field suggestions with Apply buttons
- **Context injection**: Frontend sends current Appendix field values as markdown context
- **Largest field count (94 fields)**: This agent owns the most fields across 6 appendices, with heavy emphasis on compliance and governance

---

## Step 1: Create Chatflow App
1. Go to **Dify Cloud** > **Studio** > **Create App** > **Chatbot** (Chat mode)
2. Name: `CF_NPA_LCS`
3. Description: "NPA Draft Builder sign-off guidance agent for Legal, Compliance & Secretariat. Helps draft and refine fields in Appendices 1-6: Entity Structure, IP, Financial Crime, Risk Data, Trading Infrastructure, and Third-Party Platform Governance."

## Step 2: Agent Configuration

### Model Settings
- Model: **Claude 3.5 Sonnet** (or claude-sonnet-4-5) | CHAT mode
- Temperature: **0.2** (legal and compliance content must be precise — zero room for creative interpretation)
- Max Tokens: **4000**

### Instructions (System Prompt)
- Copy from `CF_NPA_LCS_Prompt.md` — everything below the `---` line

### Input — No Variables Required
Chatflow app — `query` parameter in API call. No START node needed.

## Step 3: Knowledge Base (Optional)

For enhanced performance, attach these KB datasets if available:
- Banking Act (Cap 19) excerpts
- MAS AML/CFT guidelines (Notice 626)
- PDPA compliance guides
- MBS sanctions screening policy
- Third-party risk management framework

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 3
- Score Threshold: 0.5

## Step 4: No Tools Required

This chatflow does NOT need MCP tools.

## Step 5: Test Conversations

**Test 1: Entity selection**
```
User: The product is booked in Singapore and sold from Hong Kong. Help me fill the entity structure.
Expected: Agent suggests booking_entity="MBS Bank Ltd", booking_location="Singapore", sales_entity="MBS Bank (Hong Kong) Ltd", sales_location="Hong Kong", flags cross-border, includes @@NPA_META@@ for multiple entity fields
```

**Test 2: Financial crime assessment**
```
User: Help me with the AML assessment for a cross-border derivatives product
Expected: Agent provides AML assessment considering cross-border risks, sanctions screening requirements, includes @@NPA_META@@ for aml_assessment and sanctions_assessment
```

**Test 3: Third-party platform**
```
User: We're using Bloomberg TOMS as a third-party platform. Help me fill Appendix 6.
Expected: Agent asks about data flow, integration scope, then provides comprehensive governance fields with @@NPA_META@@ envelope
```

**Test 4: IP considerations**
```
User: We developed a proprietary pricing algorithm. Do I need to fill the IP section?
Expected: Agent confirms mbs_ip_exists=Yes, guides on mbs_ip_details content
```

**Test 5: Section boundary**
```
User: What's the market risk for this product?
Expected: Agent redirects to the RMG agent for Section IV
```

## Step 6: API Key
1. **Publish** the Chatflow app
2. Go to App > **API Access**
3. Copy the API key
4. Add to `server/.env`: `DIFY_KEY_AG_NPA_LCS=app-xxxxx`

## Step 7: Test via Express Proxy

```bash
# Test: Entity structure
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_LCS","query":"Help me fill the entity structure. Product is an FX Option booked in Singapore, counterparty in London.","conversation_id":""}'

# Test: Financial crime compliance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_LCS","query":"What AML/CFT considerations apply to a structured credit product?","conversation_id":""}'

# Test: Third-party platform governance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_LCS","query":"We are using a third-party platform called Tradeweb for electronic trading. Help me assess the platform governance requirements.","conversation_id":""}'

# Test: PDPA compliance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_LCS","query":"What PDPA requirements apply if customer data is processed in Hong Kong?","conversation_id":""}'
```

## Step 8: Frontend Integration Verification

The frontend wiring is already complete:
1. `npa-agent-chat.component.ts` maps `LCS` → `AG_NPA_LCS`
2. `difyService.sendMessageStreamed()` streams SSE chunks to the chat panel
3. `parseNpaMeta()` extracts `@@NPA_META@@` → `FieldSuggestion[]` → Apply buttons
4. `onApplySuggestion()` → parent `onApplyFieldSuggestion()` → updates `fieldMap`

## Step 9: Architecture Position

```
CF_COO_Orchestrator (Tier 1) ← MASTER_COO
  └── CF_NPA_Orchestrator (Tier 2) ← NPA_ORCHESTRATOR
        ├── ... (existing Tier 3 agents) ...
        ├── CF_NPA_BIZ (Tier 3B, Chatflow) ← AG_NPA_BIZ
        ├── CF_NPA_TECH_OPS (Tier 3B, Chatflow) ← AG_NPA_TECH_OPS
        ├── CF_NPA_FINANCE (Tier 3B, Chatflow) ← AG_NPA_FINANCE
        ├── CF_NPA_RMG (Tier 3B, Chatflow) ← AG_NPA_RMG
        └── CF_NPA_LCS (Tier 3B, Chatflow) ← AG_NPA_LCS  ★ THIS APP
```
