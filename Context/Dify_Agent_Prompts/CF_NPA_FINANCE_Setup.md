# CF_NPA_FINANCE — Dify Setup Guide
# Updated: 2026-02-23 | Version: 1.0
# Agent: AG_NPA_FINANCE | Group Finance / GPC
# Sections: PC.III (Pricing & Valuation), PC.V (Data Management)

## Dify App Type: CHATFLOW (conversational, multi-turn)

The FINANCE Agent is a **Tier 3B conversational chatflow** for the Draft Builder. It provides sign-off guidance for Group Finance / Group Product Control (GPC), helping NPA makers draft and refine fields in Section III (Pricing & Valuation) and Section V (Data Management & Reporting). It covers pricing methodology, ROAE analysis, XVA treatment, SIMM compliance, data governance, PURE assessment, and RDAR.

### Architecture
```
NPA Draft Builder (Angular Frontend)
  └── Agent Chat Panel > "Finance" tab
        └── DifyService.sendMessageStreamed(prompt, {}, 'AG_NPA_FINANCE')
              └── Express Proxy > POST /api/dify/chat { agent_id: 'AG_NPA_FINANCE' }
                    └── Dify Cloud > CF_NPA_FINANCE (Chatflow) > DIFY_KEY_AG_NPA_FINANCE
```

### Key Design Decisions
- **Chatflow, not Workflow**: Multi-turn conversation — users iterate on pricing assumptions, discuss SIMM treatment, refine PURE assessment
- **No MCP Tools**: Relies on system prompt knowledge + conversation context
- **@@NPA_META@@ output**: Structured field suggestions with Apply buttons
- **Context injection**: Frontend sends current Section III + V field values as markdown context

---

## Step 1: Create Chatflow App
1. Go to **Dify Cloud** > **Studio** > **Create App** > **Chatbot** (Chat mode)
2. Name: `CF_NPA_FINANCE`
3. Description: "NPA Draft Builder sign-off guidance agent for Group Finance / GPC. Helps draft and refine fields in Section III (Pricing & Valuation) and Section V (Data Management & Reporting)."

## Step 2: Agent Configuration

### Model Settings
- Model: **Claude 3.5 Sonnet** (or claude-sonnet-4-5) | CHAT mode
- Temperature: **0.2** (pricing and financial content needs high precision)
- Max Tokens: **4000**

### Instructions (System Prompt)
- Copy from `CF_NPA_FINANCE_Prompt.md` — everything below the `---` line

### Input — No Variables Required
Chatflow app — `query` parameter in API call. No START node needed.

## Step 3: Knowledge Base (Optional)

For enhanced performance, attach these KB datasets if available:
- Pricing model documentation
- SIMM guidelines
- BCBS 239 / RDAR requirements
- MBS PURE framework guidelines

**KB Settings:**
- Retrieval: Hybrid (keyword + semantic)
- Top K: 3
- Score Threshold: 0.5

## Step 4: No Tools Required

This chatflow does NOT need MCP tools.

## Step 5: Test Conversations

**Test 1: Pricing methodology**
```
User: What pricing methodology should I use for a vanilla FX Option?
Expected: Agent recommends Black-Scholes with vol surface, discusses FVA/XVA, includes @@NPA_META@@ for pricing_methodology
```

**Test 2: ROAE threshold**
```
User: The notional is $75M. Do I need ROAE analysis?
Expected: Agent confirms ROAE required (>$20M) and flags Finance VP review (>$50M), includes @@NPA_META@@ for roae_analysis
```

**Test 3: PURE assessment**
```
User: Help me with the PURE assessment for this retail structured note
Expected: Agent provides product-specific PURE responses for all 4 dimensions, includes @@NPA_META@@ for pure_purposeful/unsurprising/respectful/explainable
```

**Test 4: Section boundary**
```
User: What's the operating model for this product?
Expected: Agent redirects to the Tech & Ops agent for Section II
```

## Step 6: API Key
1. **Publish** the Chatflow app
2. Go to App > **API Access**
3. Copy the API key
4. Add to `server/.env`: `DIFY_KEY_AG_NPA_FINANCE=app-xxxxx`

## Step 7: Test via Express Proxy

```bash
# Test: Pricing guidance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_FINANCE","query":"Help me fill the pricing methodology for a 6-month FX Barrier Option on EUR/USD","conversation_id":""}'

# Test: SIMM treatment
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_FINANCE","query":"What SIMM sensitivities apply to an interest rate swaption?","conversation_id":""}'

# Test: Data governance
curl -X POST http://localhost:3000/api/dify/chat \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"AG_NPA_FINANCE","query":"Help me with the data governance framework section","conversation_id":""}'
```

## Step 8: Frontend Integration Verification

The frontend wiring is already complete:
1. `npa-agent-chat.component.ts` maps `FINANCE` → `AG_NPA_FINANCE`
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
        ├── CF_NPA_FINANCE (Tier 3B, Chatflow) ← AG_NPA_FINANCE  ★ THIS APP
        ├── CF_NPA_RMG (Tier 3B, Chatflow) ← AG_NPA_RMG
        └── CF_NPA_LCS (Tier 3B, Chatflow) ← AG_NPA_LCS
```
