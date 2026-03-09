# System Architecture Context (for Agents) — COO Command Center (POC)
**Agent:** CF_NPA_TECH_OPS  
**Suggested Dify dataset:** `COO Command Center — Tech/Ops`  
**Last updated:** 2026-02-23

## Purpose
Provide a stable narrative of system components so Tech/Ops agents:
- ask the right integration questions
- identify system-of-record responsibilities
- document operational readiness constraints

## Source context (internal)
- `Archive/2026-02-18_Architecture_Gap_Analysis/NPA_Business_Process_Deep_Knowledge.md`
- Repo components: Angular UI (`src/`), Node API (`server/`), DB schema (`database/`), MCP tools (`server/mcp-python/`)

---

## 1) High-level components
- **UI (Angular)**: COO Command Center front-end.
- **API (Node/Express)**: `/server` exposes `/api/*` for NPAs, approvals, agents, knowledge, evidence.
- **DB (MySQL/MariaDB)**: system-of-record for NPA lifecycle and agent persistence.
- **MCP tools (Python)**: tool server for agent operations (KB search, NPA CRUD, etc.).

---

## 2) System-of-record expectations
- NPA state: `npa_projects`, `npa_workflow_states`, `npa_signoffs`
- Form fields: `npa_form_data` (unique per project_id + field_key)
- Agent chat: `agent_sessions`, `agent_messages`
- KB registry: `kb_documents`
- Evidence: `evidence_library`

---

## 3) Integration questions checklist (for any new product)
- booking schema / downstream systems impacted
- required data feeds and reference data sources
- screening hooks (sanctions/AML) in workflow
- logging and audit trail requirements
- DR/RTO/RPO requirements and test evidence

