# Dify Agent Specifications & API Contracts

## Overview
The "COO Multi-Agent Workbench" relies on **Dify** as the orchestration engine. The Angular frontend acts as the *interaction layer*, sending user inputs to Dify and rendering the structured JSON outputs.

## Agent 1: Product Ideation Agent (Phase 0)
**Role**: Intake, Classification, & Routing.
**Type**: Dify Chatflow (Stateful).

### Dify Implementation Logic
This agent implements the **NPA Decision Matrix** (from `npa_deep_dive_analysis.md`).

#### 1. Inputs (from Angular)
```json
{
  "query": "I want to trade a vanilla FX option for the SG desk booking in HK.",
  "user_context": {
    "role": "Trader",
    "location": "SG",
    "desk": "FX"
  }
}
```

#### 2. Dify Workflow Steps (Internal)
1.  **LLM Node (Discovery)**: Extraction of key entities (Product: 'FX Option', Booking: 'SG -> HK').
2.  **Code Node (Rules Engine)**:
    *   `is_cross_border`: True (SG != HK).
    *   `classification`: 'EXISTING' (Vanilla FX Option is standard).
    *   `track`: 'NPA_LITE' (Back-to-Back or Variation).
3.  **Knowledge Retrieval (RAG)**: Search for 'FX Option' in `NPA_Legacy_Docs`.
    *   *Result*: "Found matching NPA-2021-009".
4.  **LLM Node (Response Gen)**: Formats the friendly chat response.

#### 3. Outputs (to Angular)
The Dify agent returns a structured JSON block (hidden from user) + Chat Text.

```json
{
  "answer": "I've analyzed your request. This looks like a Cross-Border deal (SG/HK). I'm setting up an NPA Lite workflow.",
  "metadata": {
    "agent_action": "ROUTE_WORK_ITEM",
    "payload": {
       "classification": "EXISTING",
       "track": "NPA_LITE",
       "is_cross_border": true,
       "mandatory_sign_offs": ["FINANCE", "CREDIT", "MLR", "TECH", "OPS"],
       "suggested_template_id": "TPL-FX-OPT-LITE"
    }
  }
}
```

---

## Agent 2: Work Item Orchestrator (Phase 1)
**Role**: Managing the Lifecycle Stages.
**Type**: Dify Workflow (Stateless API).

### Dify Implementation Logic
Triggered when the user "Confirms" the Ideation.

#### 1. Inputs
```json
{
  "template_id": "TPL-FX-OPT-LITE",
  "ideation_data": { ... } // Payload from Agent 1
}
```

#### 2. Dify Workflow Steps
1.  **DB Create**: Insert Row into Supabase `work_items` table.
2.  **Assignment Logic**: 
    *   Map `mandatory_sign_offs` to specific User IDs (e.g., 'FINANCE' -> 'user_123').
3.  **State Init**: Set Status = 'DRAFT', Stage = 'DISCOVERY'.
4.  **PIR Scheduler**: Calculate `launch_date_est` + 6 months -> add to `scheduler_queue`.

#### 3. Outputs
```json
{
  "work_item_id": "NPA-2025-883",
  "redirect_url": "/agents/npa/NPA-2025-883"
}
```

---

## Agent 3: Evidence Logger (Utility)
**Role**: Immutable Audit Trail.
**Type**: Dify Tool / Function.

*   **Trigger**: Any State Change or Approval.
*   **Action**: Write to `audit_logs` table.
*   **Data**: `timestamp`, `actor`, `action`, `previous_state`, `new_state`, `dify_conversation_id`.

## Frontend Integration Strategy
1.  **IdeationChatComponent**: Connects to Dify Chat API (`POST /chat-messages`).
    *   It renders `answer` as text bubbles.
    *   It listens for `metadata.agent_action === 'ROUTE_WORK_ITEM'` to show the "Create Work Item" button.
2.  **NPAAgentComponent**: Connects to Your Backend (which proxies Dify Workflow API).
    *   Fetches Work Item state from DB (populated by Dify).
