# Dify Cloud Setup Guide — COO Multi-Agent Workbench
**Date:** 2026-02-19
**Version:** Sprint 5.2 — Post Cross-Verification Update (v2 — architecture validated)
**Prerequisite:** Updated KBs/Prompts from `Context/2026-02-19/` (31 corrections applied)

> **Architecture Update (2026-02-20):** Expanded to 11 Dify apps. The former WF_NPA_Governance_Ops super-app
> has been split into 4 dedicated workflow apps (Governance, Doc Lifecycle, Monitoring, Notification) and
> the Orchestrator has been split into Tier 1 (CF_COO_Orchestrator) and Tier 2 (CF_NPA_Orchestrator).
> See individual Setup Guides for each app's configuration.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Current State Audit](#2-current-state-audit)
3. [MCP Tools Server Setup](#3-mcp-tools-server-setup)
4. [Knowledge Base Setup](#4-knowledge-base-setup)
5. [App Configuration — Existing Apps (5)](#5-app-configuration--existing-apps)
6. [App Configuration — New Apps (2)](#6-app-configuration--new-apps)
7. [API Key Configuration](#7-api-key-configuration)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Architecture Overview

### 13 Logical Agents → 11 Dify Apps

| Dify App | Type | Logical Agents | Tier |
|----------|------|---------------|------|
| CF_COO_Orchestrator | Agent (Chat) | MASTER_COO | 1 |
| CF_NPA_Orchestrator | Agent (Chat) | NPA_ORCHESTRATOR | 2 |
| CF_NPA_Ideation | Agent (Chat) | IDEATION | 3 |
| CF_NPA_Query_Assistant | Agent (Chat) | DILIGENCE, KB_SEARCH | 3, 4 |
| WF_NPA_Classify_Predict | Workflow | CLASSIFIER, ML_PREDICT | 3 |
| WF_NPA_Risk | Workflow | RISK | 3 |
| WF_NPA_Autofill | Workflow | AUTOFILL | 3 |
| WF_NPA_Governance | Workflow | GOVERNANCE | 3 |
| WF_NPA_Doc_Lifecycle | Workflow | DOC_LIFECYCLE | 3 |
| WF_NPA_Monitoring | Workflow | MONITORING | 3 |
| WF_NPA_Notification | Workflow | NOTIFICATION | 4 |

### Data Flow
```
Angular UI → Express API (port 3000) → Dify Cloud API
                                      → MCP Python Server (port 3002)
                                          ├── REST /tools/{name} (OpenAPI)
                                          └── MCP SSE /mcp/sse
```

### Express Proxy Routing (server/routes/dify-proxy.js)
- Agent apps (type='chat'): `POST /v1/chat-messages` with `conversation_id`
- Workflow apps (type='workflow'): `POST /v1/workflows/run` with `inputs`

---

## 2. Current State Audit

### 2.1 Existing Apps (5 of 7)

| App | Type | Model | Instructions | KBs | Tools | Status |
|-----|------|-------|-------------|-----|-------|--------|
| CF_NPA_Orchestrator | Agent | claude-sonnet-4-5 | 6948 chars | 4 (KB_Master_COO_Orchestrator, KB_Domain_Orchestrator_NPA, KB_NPA_Policies, KB_NPA_Classification_Rules) | 8/8 enabled (⚠️) | Needs prompt update + tool refresh |
| CF_NPA_Ideation | Agent | claude-sonnet-4-5 | 6623 chars | 4 (KB_NPA_Policies, KB_NPA_Classification_Rules, KB_NPA_Templates, KB_Ideation_Agent) | 71/71 enabled (⚠️) | Needs prompt update + tool refresh |
| WF_NPA_Classifier | Workflow | claude-sonnet-4-5 | 9005 chars | 2 (KB_NPA_Classification_Rules, NPA_Classifier_KB) | None (Workflow) | Needs prompt update + KB refresh |
| WF_NPA_Risk | Workflow | claude-sonnet-4-5 | 7472 chars | 0 | None (Workflow) | Needs prompt update + add KBs |
| WF_NPA_Autofill | Workflow | claude-sonnet-4-5 | 7211 chars | 0 | None (Workflow) | Needs prompt update + add KBs |

### 2.2 Missing Apps (2)
- **CF_NPA_Query_Assistant** (Agent/Chatflow) — serves DILIGENCE + KB_SEARCH agents
- **WF_NPA_Governance_Ops** (Workflow) — serves GOVERNANCE + DOC_LIFECYCLE + MONITORING + NOTIFICATION agents

### 2.3 Knowledge Bases (7 existing)

| KB Name | Docs | Chunks | Used By |
|---------|------|--------|---------|
| NPA_Classifier_KB | 3 | 1 | WF_NPA_Classifier |
| KB_NPA_Templates | 1 | 1 | CF_NPA_Ideation |
| KB_Ideation_Agent | 1 | 1 | CF_NPA_Ideation |
| KB_NPA_Classification_Rules | 1 | 3 | CF_NPA_Orchestrator, CF_NPA_Ideation, WF_NPA_Classifier |
| KB_NPA_Policies | 1 | 2 | CF_NPA_Orchestrator, CF_NPA_Ideation |
| KB_Domain_Orchestrator_NPA | 1 | 1 | CF_NPA_Orchestrator |
| KB_Master_COO_Orchestrator | 1 | 1 | CF_NPA_Orchestrator |

### 2.4 Custom Tools

**NPA MCP Tools Server** — Custom Tool (OpenAPI import)
- Current: 71 actions
- Server URL: Set via PUBLIC_URL env var → `/openapi.json`
- **Missing 7 new tools** (bundling_assess, bundling_apply, evergreen_list, evergreen_record_usage, evergreen_annual_review, doc_lifecycle_validate, detect_approximate_booking)
- All tool icons show ⚠️ warning triangles → server endpoint unreachable from Dify Cloud

---

## 3. MCP Tools Server Setup

### 3.1 Deploy MCP Python Server

The MCP server must be publicly accessible for Dify Cloud to call it. Deploy to any host with a public HTTPS URL.

**Required Environment Variables:**
```env
DATABASE_URL=mysql://user:pass@host:3306/npa_workbench
PUBLIC_URL=https://your-mcp-server-url
PORT=10000
ENV=production
```

### 3.2 Verify Tool Count

After deployment, confirm all 78 tools are registered:
```bash
curl {MCP_SERVER_URL}/health
# Should return: "tools": 78
```

### 3.3 Regenerate OpenAPI Spec

The spec auto-generates at runtime. Fetch it:
```bash
curl {MCP_SERVER_URL}/openapi.json > dify-openapi-spec.json
```

### 3.4 Update Dify Custom Tool

1. Go to **Dify → Tools → Custom → NPA MCP Tools Server → Configure**
2. In the schema editor, replace the entire OpenAPI spec with the new one from `/openapi.json`
3. Update the **Server URL** field to your deployed MCP server URL
4. Save — verify the action count shows **78 ACTIONS INCLUDED**
5. All ⚠️ warning triangles should disappear once the server is reachable

### 3.5 Complete Tool Inventory (78 tools across 21 modules)

| Module | Tools | Count |
|--------|-------|-------|
| session | session_create, session_log_message | 2 |
| ideation | ideation_create_npa, ideation_find_similar, ideation_get_prohibited_list, ideation_save_concept, ideation_list_templates | 5 |
| classification | classify_assess_domains, classify_score_npa, classify_determine_track, classify_get_criteria, classify_get_assessment | 5 |
| autofill | autofill_get_template_fields, autofill_populate_field, autofill_populate_batch, autofill_get_form_data, autofill_get_field_options | 5 |
| risk | risk_run_assessment, risk_get_market_factors, risk_add_market_factor, risk_get_external_parties | 4 |
| governance | governance_get_signoffs, governance_create_signoff_matrix, governance_record_decision, governance_check_loopbacks, governance_advance_stage | 5 |
| governance_ext | get_signoff_routing_rules, check_sla_status, create_escalation, get_escalation_rules, save_approval_decision, add_comment | 6 |
| audit | audit_log_action, audit_get_trail, check_audit_completeness, generate_audit_report | 4 |
| npa_data | get_npa_by_id, list_npas, update_npa_project, update_npa_predictions | 4 |
| workflow | get_workflow_state, advance_workflow_state, get_session_history, log_routing_decision, get_user_profile | 5 |
| monitoring | get_performance_metrics, check_breach_thresholds, create_breach_alert, get_monitoring_thresholds, get_post_launch_conditions, update_condition_status, detect_approximate_booking | 7 |
| documents | upload_document_metadata, check_document_completeness, get_document_requirements, validate_document, doc_lifecycle_validate | 5 |
| notifications | get_pending_notifications, send_notification, mark_notification_read | 3 |
| kb_search | search_kb_documents, get_kb_document_by_id, list_kb_sources | 3 |
| prospects | get_prospects, convert_prospect_to_npa | 2 |
| dashboard | get_dashboard_kpis | 1 |
| risk_ext | get_prerequisite_categories, validate_prerequisites, save_risk_check_result, get_form_field_value | 4 |
| jurisdiction | get_npa_jurisdictions, get_jurisdiction_rules, adapt_classification_weights | 3 |
| **bundling** (NEW) | bundling_assess, bundling_apply | **2** |
| **evergreen** (NEW) | evergreen_list, evergreen_record_usage, evergreen_annual_review | **3** |
| **TOTAL** | | **78** |

---

## 4. Knowledge Base Setup

### 4.1 KB-to-App Mapping (Target State)

Each Dify app needs specific Knowledge Bases. Upload the updated files from `Context/2026-02-19/`.

| Dify App | Required KBs | Source Files |
|----------|-------------|-------------|
| **CF_NPA_Orchestrator** | KB_Master_COO_Orchestrator, KB_Domain_Orchestrator_NPA, KB_NPA_Policies | `Dify_Agent_KBs/KB_Master_COO_Orchestrator.md`, `Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md`, `Dify_KB_Docs/KB_Prohibited_Items.md` |
| **CF_NPA_Ideation** | KB_Ideation_Agent, KB_NPA_Policies, KB_NPA_Templates | `Dify_Agent_KBs/KB_Ideation_Agent.md`, `Dify_KB_Docs/KB_Prohibited_Items.md`, `Dify_Agent_KBs/KB_Template_Autofill_Agent.md` |
| **CF_NPA_Query_Assistant** (NEW) | KB_Conversational_Diligence, KB_Search_Agent, KB_NPA_Policies | `Dify_Agent_KBs/KB_Conversational_Diligence.md`, `Dify_Agent_KBs/KB_Search_Agent.md`, `Dify_KB_Docs/KB_Prohibited_Items.md` |
| **WF_NPA_Classify_Predict** | KB_Classification_Agent, KB_ML_Prediction, KB_Classification_Criteria, KB_Product_Taxonomy | `Dify_Agent_KBs/KB_Classification_Agent.md`, `Dify_Agent_KBs/KB_ML_Prediction.md`, `Dify_KB_Docs/KB_Classification_Criteria.md`, `Dify_KB_Docs/KB_Product_Taxonomy.md` |
| **WF_NPA_Risk** | KB_Risk_Agent, KB_NPA_Policies | `Dify_Agent_KBs/KB_Risk_Agent.md`, `Dify_KB_Docs/KB_Prohibited_Items.md` |
| **WF_NPA_Autofill** | KB_Template_Autofill_Agent, KB_NPA_Templates | `Dify_Agent_KBs/KB_Template_Autofill_Agent.md` |
| **WF_NPA_Governance_Ops** (NEW) | KB_Governance_Agent, KB_Doc_Lifecycle, KB_Monitoring_Agent, KB_Notification_Agent | `Dify_Agent_KBs/KB_Governance_Agent.md`, `Dify_Agent_KBs/KB_Doc_Lifecycle.md`, `Dify_Agent_KBs/KB_Monitoring_Agent.md`, `Dify_Agent_KBs/KB_Notification_Agent.md` |

### 4.2 Update Existing KBs

For each existing Knowledge Base in Dify:

1. Navigate to **Knowledge** tab
2. Click on the KB name
3. Delete the old document(s)
4. Click **Add File** → upload the corresponding updated `.md` file from `Context/2026-02-19/`
5. Settings:
   - **Indexing Mode:** High Quality (HQ-VECTOR)
   - **Chunk Strategy:** Automatic (let Dify handle)
   - Wait for indexing to complete (green checkmark)

### 4.3 Create New KBs

Create the following new Knowledge Bases (not yet in Dify):

| New KB Name | Source File | Used By |
|-------------|------------|---------|
| KB_Conversational_Diligence | `Dify_Agent_KBs/KB_Conversational_Diligence.md` | CF_NPA_Query_Assistant |
| KB_Search_Agent | `Dify_Agent_KBs/KB_Search_Agent.md` | CF_NPA_Query_Assistant |
| KB_Risk_Agent | `Dify_Agent_KBs/KB_Risk_Agent.md` | WF_NPA_Risk |
| KB_ML_Prediction | `Dify_Agent_KBs/KB_ML_Prediction.md` | WF_NPA_Classify_Predict |
| KB_Classification_Criteria | `Dify_KB_Docs/KB_Classification_Criteria.md` | WF_NPA_Classify_Predict |
| KB_Product_Taxonomy | `Dify_KB_Docs/KB_Product_Taxonomy.md` | WF_NPA_Classify_Predict |
| KB_Governance_Agent | `Dify_Agent_KBs/KB_Governance_Agent.md` | WF_NPA_Governance_Ops |
| KB_Doc_Lifecycle | `Dify_Agent_KBs/KB_Doc_Lifecycle.md` | WF_NPA_Governance_Ops |
| KB_Monitoring_Agent | `Dify_Agent_KBs/KB_Monitoring_Agent.md` | WF_NPA_Governance_Ops |
| KB_Notification_Agent | `Dify_Agent_KBs/KB_Notification_Agent.md` | WF_NPA_Governance_Ops |
| KB_Template_Autofill_Agent | `Dify_Agent_KBs/KB_Template_Autofill_Agent.md` | WF_NPA_Autofill |
| KB_Prohibited_Items | `Dify_KB_Docs/KB_Prohibited_Items.md` | Shared reference |

**Steps for each:**
1. **Knowledge → Create Knowledge**
2. Name: Use the exact names above (matches code references)
3. Upload the `.md` file
4. Embedding: **HQ-VECTOR** (High Quality)
5. Save and wait for indexing

---

## 5. App Configuration — Existing Apps

### 5.1 CF_NPA_Orchestrator (Agent)

**Current state:** 6948-char instructions, 4 KBs, 8 tools
**Action needed:** Update prompt + refresh tool count

1. **Update Instructions:**
   - Open `CF_NPA_Orchestrator` → Orchestrate tab
   - Copy the FULL content of `Context/2026-02-19/Dify_Agent_Prompts/CF_NPA_Ideation_Prompt.md`
     - Note: The Orchestrator prompt is embedded in the CF_NPA_Orchestrator app; there is no separate orchestrator prompt file — the current instructions cover both Master COO and NPA Orchestrator roles, which is correct for this fused deployment
   - Paste into the **Instructions** field (replace existing)

2. **Update Knowledge:**
   - Keep: KB_Master_COO_Orchestrator, KB_Domain_Orchestrator_NPA
   - Add: KB_Prohibited_Items (new — reference doc for prohibited product checks)
   - Remove: KB_NPA_Policies, KB_NPA_Classification_Rules (these are Classifier-specific; Orchestrator should route to specialists, not duplicate their knowledge)

3. **Update Tools:**
   - After refreshing the Custom Tool spec (Section 3.4), enable all tools
   - The Orchestrator needs a broad tool set since it routes to sub-agents:
     - session_create, session_log_message (session management)
     - get_npa_by_id, list_npas, log_routing_decision (routing)
     - ideation_find_similar, get_workflow_state, get_user_profile (context)
     - get_dashboard_kpis (executive overview)

4. **Settings:**
   - Model: claude-sonnet-4-5 (keep)
   - Vision: ON (keep)
   - Agent Settings → keep defaults

5. **Publish** the changes

### 5.2 CF_NPA_Ideation (Agent)

**Current state:** 6623-char instructions, 4 KBs, 71/71 tools
**Action needed:** Update prompt + selective tool enablement

1. **Update Instructions:**
   - Copy content of `Context/2026-02-19/Dify_Agent_Prompts/CF_NPA_Ideation_Prompt.md`
   - Paste into **Instructions** field (replace existing)

2. **Update Knowledge:**
   - Keep: KB_Ideation_Agent, KB_NPA_Templates
   - Update: KB_NPA_Policies → ensure it uses updated document
   - Add: KB_Prohibited_Items (for prohibited product early-warning)
   - Remove: KB_NPA_Classification_Rules (not needed for ideation)

3. **Update Tools:**
   - Enable **ideation-focused tools only** (not all 78):
     - session_create, session_log_message
     - ideation_create_npa, ideation_find_similar, ideation_get_prohibited_list, ideation_save_concept, ideation_list_templates
     - classify_assess_domains, classify_score_npa (for preliminary assessment)
     - get_npa_by_id, list_npas (data lookup)
     - get_prospects, convert_prospect_to_npa (prospect pipeline)
     - search_kb_documents (KB RAG)
   - Disable: All governance, audit, monitoring, bundling, evergreen tools (not relevant to ideation)

4. **Publish**

### 5.3 WF_NPA_Classifier (Workflow)

**Current state:** 9005-char prompt in LLM node, 2 KBs via Knowledge Retrieval, START→KNOWLEDGE_RETRIEVAL→LLM→OUTPUT
**Action needed:** Update LLM prompt + add KBs + update input variables

This app is the best-configured of all existing apps.

1. **Update LLM Node System Prompt:**
   - Click on the LLM node in the workflow canvas
   - Replace the system prompt with content from `Context/2026-02-19/Dify_Agent_Prompts/WF_NPA_Classifier_Prompt.md`
   - Reference `Context/2026-02-19/Dify_Agent_Prompts/WF_NPA_Classifier_Setup.md` for input/output variable configuration

2. **Update Knowledge Retrieval Node:**
   - Current KBs: KB_NPA_Classification_Rules, NPA_Classifier_KB
   - Add: KB_Classification_Criteria, KB_Product_Taxonomy, KB_ML_Prediction
   - These provide the scoring methodology, product taxonomy, and baseline metrics

3. **Verify Input Variables** (from WF_NPA_Classifier_Setup.md):
   - `product_name` (string, required)
   - `product_description` (string, required)
   - `asset_class` (string)
   - `region` (string)
   - `desk` (string)
   - `entity` (string)
   - `notional_usd` (number)
   - `client_type` (string)
   - `existing_product_id` (string — for dormancy/expiry checks)
   - `project_id` (number)
   - `submission_context` (string)

4. **Verify Output Variables:**
   - `classification` (NTG | Variation | Existing)
   - `approval_track` (FULL_NPA | NPA_LITE | NPA_LITE_B1 | NPA_LITE_B2 | NPA_LITE_B3 | NPA_LITE_B4 | BUNDLING | EVERGREEN | PROHIBITED)
   - `confidence_score` (0.0 - 1.0)
   - `reasoning` (string)
   - `ntg_score` (0-20)
   - `risk_flags` (string array)

5. **Publish**

### 5.4 WF_NPA_Risk (Workflow)

**Current state:** 7472-char prompt, 0 KBs, START→LLM→OUTPUT
**Action needed:** Update prompt + add Knowledge Retrieval node + add KBs

1. **Add Knowledge Retrieval Node:**
   - Insert a Knowledge Retrieval node between START and LLM
   - Connect: START → KNOWLEDGE_RETRIEVAL → LLM → OUTPUT
   - Add KBs: KB_Risk_Agent, KB_Prohibited_Items

2. **Update LLM Node System Prompt:**
   - Replace with content from `Context/2026-02-19/Dify_Agent_Prompts/WF_NPA_Risk_Prompt.md`
   - In the LLM context field, wire `{{#knowledge_retrieval.result#}}` so the KB content flows into the prompt

3. **Input Variables:**
   - `project_id` (number, required)
   - `product_name` (string, required)
   - `product_description` (string)
   - `asset_class` (string)
   - `region` (string)
   - `notional_usd` (number)
   - `classification` (string — from classifier output)
   - `approval_track` (string — from classifier output)

4. **Output Variables:**
   - `risk_assessment` (object — 5-layer cascade results)
   - `prohibited_check` (PASS | FAIL)
   - `overall_risk_level` (LOW | MEDIUM | HIGH | CRITICAL)
   - `risk_flags` (string array)
   - `prerequisite_status` (object)

5. **Publish**

### 5.5 WF_NPA_Autofill (Workflow)

**Current state:** 7211-char prompt, 0 KBs, START→LLM→OUTPUT
**Action needed:** Update prompt + add Knowledge Retrieval node + add KBs

1. **Add Knowledge Retrieval Node:**
   - Insert between START and LLM
   - Add KBs: KB_Template_Autofill_Agent

2. **Update LLM Node System Prompt:**
   - Replace with content from `Context/2026-02-19/Dify_Agent_Prompts/WF_NPA_Autofill_Prompt.md`
   - Wire `{{#knowledge_retrieval.result#}}` into LLM context

3. **Input Variables:**
   - `project_id` (number, required)
   - `template_id` (string — defaults to 'STD_NPA_V2')
   - `section` (string — optional, specific section to fill)
   - `context_data` (object — classifier + risk + ideation outputs)

4. **Output Variables:**
   - `filled_fields` (object array — field_name, value, confidence, source)
   - `completion_percentage` (number)
   - `missing_required` (string array)
   - `warnings` (string array)

5. **Publish**

---

## 6. App Configuration — New Apps

### 6.1 CF_NPA_Query_Assistant (Agent — NEW)

This app serves two logical agents: **Conversational Diligence** and **KB Search**.

1. **Create App:**
   - Studio → Create from Blank → **Agent**
   - Name: `CF_NPA_Query_Assistant`
   - Description: "Conversational Q&A assistant for NPA queries, diligence workflows, and knowledge base search"

2. **Configure:**
   - Model: **claude-sonnet-4-5** (CHAT mode)
   - Instructions: Copy from `Context/2026-02-19/Dify_Agent_Prompts/CF_NPA_Query_Assistant_Prompt.md`

3. **Knowledge:**
   - Add: KB_Conversational_Diligence, KB_Search_Agent, KB_NPA_Policies, KB_Prohibited_Items
   - Embedding: HQ-VECTOR

4. **Tools (17 read-only):**
   - Enable from NPA MCP Tools Server:
     - `get_npa_by_id`, `list_npas`, `get_workflow_state` (NPA data)
     - `classify_get_criteria`, `classify_get_assessment` (classification reference)
     - `governance_get_signoffs`, `get_signoff_routing_rules`, `check_sla_status`, `governance_check_loopbacks` (governance reference)
     - `check_document_completeness`, `get_document_requirements` (document reference)
     - `check_breach_thresholds`, `get_post_launch_conditions`, `get_performance_metrics` (monitoring reference)
     - `search_kb_documents`, `get_kb_document_by_id` (KB search)
     - `get_pending_notifications` (dashboard)
   - See `CF_NPA_Query_Assistant_Setup.md` for detailed tool descriptions

5. **Publish**

6. **Get API Key:**
   - Go to **API Access** tab
   - Copy the API key → set as `DIFY_KEY_DILIGENCE` in `.env`

### 6.2 WF_NPA_Governance (Workflow — Split App)

Dedicated governance workflow. See `WF_NPA_Governance_Setup.md` for full setup guide.
- **API Key**: `DIFY_KEY_GOVERNANCE`
- **Tools**: 13 MCP tools (governance + audit)

### 6.3 WF_NPA_Doc_Lifecycle (Workflow — Split App)

Dedicated document lifecycle workflow. See `WF_NPA_Doc_Lifecycle_Setup.md` for full setup guide.
- **API Key**: `DIFY_KEY_DOC_LIFECYCLE`
- **Tools**: 7 MCP tools (documents + audit)

### 6.4 WF_NPA_Monitoring (Workflow — Split App)

Dedicated monitoring workflow. See `WF_NPA_Monitoring_Setup.md` for full setup guide.
- **API Key**: `DIFY_KEY_MONITORING`
- **Tools**: 12 MCP tools (monitoring + evergreen + audit)

### 6.5 WF_NPA_Notification (Workflow — Split App)

Dedicated notification workflow. See `WF_NPA_Notification_Setup.md` for full setup guide.
- **API Key**: `DIFY_KEY_NOTIFICATION`
- **Tools**: 5 MCP tools (notifications + audit)

---

## 7. API Key Configuration

### 7.1 Express Server Environment Variables

After configuring all Dify apps, collect API keys and update `server/.env`:

```env
# ─── Dify Cloud ──────────────────────────────────────────
DIFY_BASE_URL=https://api.dify.ai/v1

# Tier 1: CF_COO_Orchestrator (MASTER_COO)
DIFY_KEY_MASTER_COO=app-xxxxxxxxxxxxxxxxxx

# Tier 2: CF_NPA_Orchestrator (NPA_ORCHESTRATOR)
DIFY_KEY_NPA_ORCHESTRATOR=app-xxxxxxxxxxxxxxxxxx

# Tier 3: CF_NPA_Ideation
DIFY_KEY_IDEATION=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Classify_Predict (serves CLASSIFIER + ML_PREDICT)
DIFY_KEY_CLASSIFIER=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Autofill
DIFY_KEY_AUTOFILL=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Risk
DIFY_KEY_RISK=app-xxxxxxxxxxxxxxxxxx

# Tier 3+4: CF_NPA_Query_Assistant (serves DILIGENCE + KB_SEARCH)
DIFY_KEY_DILIGENCE=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Governance (dedicated governance app)
DIFY_KEY_GOVERNANCE=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Doc_Lifecycle (dedicated doc lifecycle app)
DIFY_KEY_DOC_LIFECYCLE=app-xxxxxxxxxxxxxxxxxx

# Tier 3: WF_NPA_Monitoring (dedicated monitoring app)
DIFY_KEY_MONITORING=app-xxxxxxxxxxxxxxxxxx

# Tier 4: WF_NPA_Notification (dedicated notification app)
DIFY_KEY_NOTIFICATION=app-xxxxxxxxxxxxxxxxxx

# ─── MCP Python Server ──────────────────────────────────
MCP_SERVER_URL=https://your-mcp-server-url
```

### 7.2 Where to Find API Keys in Dify

For each app:
1. Open the app in Studio
2. Click **API Access** in the left sidebar
3. The API key is shown as `app-xxxx...`
4. Copy and paste into `server/.env`

### 7.3 Key-to-Agent Mapping Reference

| .env Variable | Dify App | API Type | Used By Agents |
|--------------|----------|----------|---------------|
| DIFY_KEY_MASTER_COO | CF_NPA_Orchestrator | chat | MASTER_COO, NPA_ORCHESTRATOR |
| DIFY_KEY_IDEATION | CF_NPA_Ideation | chat | IDEATION |
| DIFY_KEY_CLASSIFIER | WF_NPA_Classify_Predict | workflow | CLASSIFIER, ML_PREDICT |
| DIFY_KEY_AUTOFILL | WF_NPA_Autofill | workflow | AUTOFILL |
| DIFY_KEY_RISK | WF_NPA_Risk | workflow | RISK |
| DIFY_KEY_DILIGENCE | CF_NPA_Query_Assistant | chat | DILIGENCE, KB_SEARCH |
| DIFY_KEY_GOVERNANCE | WF_NPA_Governance | workflow | GOVERNANCE |
| DIFY_KEY_DOC_LIFECYCLE | WF_NPA_Doc_Lifecycle | workflow | DOC_LIFECYCLE |
| DIFY_KEY_MONITORING | WF_NPA_Monitoring | workflow | MONITORING |
| DIFY_KEY_NOTIFICATION | WF_NPA_Notification | workflow | NOTIFICATION |

---

## 8. Testing Checklist

### 8.1 Pre-Flight Checks

- [ ] MCP Python server deployed and healthy (`/health` returns 200 with `"tools": 78`)
- [ ] OpenAPI spec refreshed in Dify Custom Tool (78 actions, no ⚠️ warnings)
- [ ] All 11 Dify apps created and published
- [ ] All 11 API keys set in `server/.env`
- [ ] All KBs created with updated documents and indexing complete
- [ ] Express server restarted with new env vars

### 8.2 Agent Health Check

```bash
# From Express server
curl http://localhost:3000/api/dify/agents/health
# Should show: 13 agents, all "healthy" (has API key), 7 unique Dify apps
```

### 8.3 End-to-End Smoke Tests

Run the existing smoke test suite:
```bash
node --test server/tests/smoke-test.js
```

### 8.4 Individual Agent Tests via Angular UI

Test each agent through the front-end NPA detail page:

1. **Orchestrator Test:**
   - Navigate to any NPA → Agent Panel
   - Send: "What is the current status of this NPA?"
   - Expected: Orchestrator routes to appropriate specialist, returns status summary

2. **Ideation Test:**
   - Create new NPA → Ideation stage
   - Send: "I want to create a new FX barrier option for Singapore retail clients"
   - Expected: Product concept Q&A, prohibited check, draft NPA creation

3. **Classifier Test:**
   - Run classification on an NPA
   - Expected: NTG/Variation/Existing classification with confidence score and approval track

4. **Risk Test:**
   - Run risk assessment on a classified NPA
   - Expected: 5-layer risk cascade (Prohibited → Sanctions → Credit → Market → Operational)

5. **Autofill Test:**
   - Run template autofill on a risk-assessed NPA
   - Expected: Form fields populated with confidence scores and lineage

6. **Query Assistant Test:**
   - Ask: "What are the NPA Lite sub-types and their SOP routing rules?"
   - Expected: Detailed answer from KB_Conversational_Diligence content

7. **Governance Test:**
   - Submit an NPA for approval
   - Expected: Signoff matrix created with correct SOPs, SLA deadlines set

### 8.5 New Sprint 4-5 Feature Tests

- [ ] **Bundling:** Assess bundling eligibility for two related NPAs → 8-condition check
- [ ] **Evergreen:** List evergreen products → shows utilization and sub-limits
- [ ] **PIR:** Launch an NPA → verify PIR auto-scheduled within 180 days
- [ ] **NPA Lite B1-B4:** Classify as NPA Lite → verify correct sub-type routing
- [ ] **Dormancy Detection:** Check dormant product → fast-track or escalation based on years
- [ ] **Doc Lifecycle Validate:** Run batch document validation → expired docs block advancement

---

## Appendix A: File Reference

### Updated Prompts (Context/2026-02-19/Dify_Agent_Prompts/)

| File | Target App | Section to Paste |
|------|-----------|-----------------|
| CF_NPA_Ideation_Prompt.md | CF_NPA_Ideation | Instructions field |
| WF_NPA_Classifier_Prompt.md | WF_NPA_Classify_Predict | LLM node system prompt |
| WF_NPA_Classifier_Setup.md | WF_NPA_Classify_Predict | Input/Output variable reference |
| CF_NPA_Query_Assistant_Prompt.md | CF_NPA_Query_Assistant | Instructions field |
| WF_NPA_Governance_Ops_Prompt.md | WF_NPA_Governance_Ops | LLM node system prompt |
| WF_NPA_Risk_Prompt.md | WF_NPA_Risk | LLM node system prompt |
| WF_NPA_Autofill_Prompt.md | WF_NPA_Autofill | LLM node system prompt |

### Updated KBs (Context/2026-02-19/Dify_Agent_KBs/)

| File | Dify KB Name |
|------|-------------|
| KB_Master_COO_Orchestrator.md | KB_Master_COO_Orchestrator |
| KB_Domain_Orchestrator_NPA.md | KB_Domain_Orchestrator_NPA |
| KB_Ideation_Agent.md | KB_Ideation_Agent |
| KB_Classification_Agent.md | KB_Classification_Agent / NPA_Classifier_KB |
| KB_Risk_Agent.md | KB_Risk_Agent |
| KB_Template_Autofill_Agent.md | KB_Template_Autofill_Agent |
| KB_Governance_Agent.md | KB_Governance_Agent |
| KB_Doc_Lifecycle.md | KB_Doc_Lifecycle |
| KB_Monitoring_Agent.md | KB_Monitoring_Agent |
| KB_Notification_Agent.md | KB_Notification_Agent |
| KB_Conversational_Diligence.md | KB_Conversational_Diligence |
| KB_Search_Agent.md | KB_Search_Agent |
| KB_ML_Prediction.md | KB_ML_Prediction |

### Updated KB Reference Docs (Context/2026-02-19/Dify_KB_Docs/)

| File | Dify KB Name |
|------|-------------|
| KB_Classification_Criteria.md | KB_Classification_Criteria |
| KB_Product_Taxonomy.md | KB_Product_Taxonomy |
| KB_Prohibited_Items.md | KB_Prohibited_Items |

---

## Appendix B: Troubleshooting

### Tool Warning Triangles (⚠️)
**Cause:** Dify cannot reach the MCP Tools Server endpoint.
**Fix:** Ensure PUBLIC_URL is set correctly and the server is deployed. Test with `curl {PUBLIC_URL}/health`.

### "Agent not configured" in Health Check
**Cause:** Missing API key in `server/.env`.
**Fix:** Get the API key from Dify → App → API Access and add to `.env`.

### Workflow Returns Empty Output
**Cause:** Input variables not mapped correctly in the START node.
**Fix:** Verify all required input variables match the schema in the setup guide.

### Knowledge Retrieval Returns No Results
**Cause:** KB documents not indexed yet, or wrong embedding mode.
**Fix:** Check KB status in Knowledge tab — wait for green checkmark. Ensure HQ-VECTOR mode.

### Chat Agent Returns Generic Response (Ignores KB)
**Cause:** Knowledge not properly linked to the app.
**Fix:** In Orchestrate tab, verify KBs are listed under Knowledge section with HQ-VECTOR tags.
