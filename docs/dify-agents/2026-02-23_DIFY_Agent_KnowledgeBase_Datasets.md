# Dify Agents → Knowledge Base Datasets (as configured in this repo)
**Date:** 2026-02-23  
**Source of truth:** `Context/Dify_Agent_Prompts/*_Setup.md` and `Context/Dify_Agent_Prompts/*_Prompt.md`

| Agent (agent_id) | Knowledge Base Datasets to attach in Dify |
|---|---|
| `MASTER_COO` | **"NPA Core Policies"** *(KB_NPA_CORE_CLOUD)*; **"COO Orchestrator KB"** |
| `NPA_ORCHESTRATOR` | **"NPA Domain Knowledge"** |
| `IDEATION` | **"NPA Ideation Knowledge"** |
| `CLASSIFIER` | **"NPA Classification"** |
| `ML_PREDICT` | **"NPA Classification"** *(shared WF app with `CLASSIFIER`)* |
| `AUTOFILL` | **"NPA AutoFill Templates"**; **"NPA Policies"** *(shared)* |
| `RISK` | **"NPA Risk Assessment"** |
| `GOVERNANCE` | **`KB_Governance_Agent.md`** |
| `DOC_LIFECYCLE` | **`KB_Doc_Lifecycle.md`** |
| `MONITORING` | **`KB_Monitoring_Agent.md`** |
| `NOTIFICATION` | **`KB_Notification_Agent.md`** |
| `DILIGENCE` | **`KB_Conversational_Diligence`**; **`KB_Search_Agent`**; **`KB_NPA_Policies`**; **`KB_Prohibited_Items`** *(shared Chatflow app with `KB_SEARCH`)* |
| `KB_SEARCH` | **`KB_Conversational_Diligence`**; **`KB_Search_Agent`**; **`KB_NPA_Policies`**; **`KB_Prohibited_Items`** *(shared Chatflow app with `DILIGENCE`)* |
| `AG_NPA_BIZ` | *(Optional)* `KB_NPA_Policies` + product catalog / precedent summaries |
| `AG_NPA_TECH_OPS` | *(Optional)* architecture docs + BCP/DR templates + operating model guides |
| `AG_NPA_FINANCE` | *(Optional)* pricing model docs + SIMM + BCBS 239 / RDAR + PURE framework |
| `AG_NPA_RMG` | *(Optional)* MAS 637/639/643 refs + stress testing + capital methods |
| `AG_NPA_LCS` | *(Optional)* Banking Act excerpts + MAS 626 + PDPA + sanctions screening + TPRM framework |

## Dataset → repo file mapping (what to upload)
This section is to help you locate the files referenced by the setup guides.

- **"NPA Core Policies"** *(KB_NPA_CORE_CLOUD)*:
  - `docs/knowledge-base/KB_NPA_Policies.md`
  - `docs/knowledge-base/KB_NPA_Templates.md`
  - `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
  - `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
- **"COO Orchestrator KB"**:
  - `Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md`
- **"NPA Domain Knowledge"**:
  - `Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md`
  - `docs/knowledge-base/KB_NPA_Policies.md`
  - `docs/knowledge-base/KB_NPA_Templates.md`
  - `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
  - `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
- **"NPA Ideation Knowledge"**:
  - `Context/Dify_Agent_KBs/KB_Ideation_Agent.md`
  - `docs/knowledge-base/KB_NPA_Policies.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
- **"NPA Classification"**:
  - `Context/Dify_KB_Docs/KB_Classification_Criteria.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
  - `Context/Dify_KB_Docs/KB_Product_Taxonomy.md`
- **"NPA AutoFill Templates"**:
  - `Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md`
  - `docs/knowledge-base/KB_NPA_Templates.md`
- **"NPA Policies"** *(shared)*:
  - `docs/knowledge-base/KB_NPA_Policies.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
- **"NPA Risk Assessment"**:
  - `Context/Dify_Agent_KBs/KB_Risk_Agent.md`
  - `docs/knowledge-base/KB_NPA_Policies.md`
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`
- **`KB_Governance_Agent.md`**:
  - `Context/Dify_Agent_KBs/KB_Governance_Agent.md`
- **`KB_Doc_Lifecycle.md`**:
  - `Context/Dify_Agent_KBs/KB_Doc_Lifecycle.md`
- **`KB_Monitoring_Agent.md`**:
  - `Context/Dify_Agent_KBs/KB_Monitoring_Agent.md`
- **`KB_Notification_Agent.md`**:
  - `Context/Dify_Agent_KBs/KB_Notification_Agent.md`
- **`KB_Conversational_Diligence`**:
  - `Context/Dify_Agent_KBs/KB_Conversational_Diligence.md`
- **`KB_Search_Agent`**:
  - `Context/Dify_Agent_KBs/KB_Search_Agent.md`
- **`KB_NPA_Policies`**:
  - `docs/knowledge-base/KB_NPA_Policies.md`
- **`KB_Prohibited_Items`**:
  - `Context/Dify_KB_Docs/KB_Prohibited_Items.md`

