# SA-5 Credit Preparation Workflow — On-Premises / Production Deployment Guide

> **Auto-maintained**: This document is updated automatically after every major workflow change or fix.
> **Last updated**: 2026-03-08
> **Node**: N-4 | **Triggered by**: `RM_DECISION_CAPTURED` event from SA-4
> **Dify App ID** *(dev/staging)*: TBD after import

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [Ollama — LLM Model Setup](#3-ollama--llm-model-setup)
4. [MCP Server Setup (SA-5 FastMCP)](#4-mcp-server-setup-sa-5-fastmcp)
5. [Dify Platform Setup](#5-dify-platform-setup)
6. [Workflow Import & Configuration](#6-workflow-import--configuration)
7. [Knowledge Base Setup](#7-knowledge-base-setup)
8. [Workflow Node Configuration Checklist](#8-workflow-node-configuration-checklist)
9. [End-to-End Testing](#9-end-to-end-testing)
10. [Known Gotchas & Dify Constraints](#10-known-gotchas--dify-constraints)
11. [Troubleshooting Reference](#11-troubleshooting-reference)
12. [Change Log](#12-change-log)

---

## 1. Architecture Overview

```
SA-4 (N-3)                    SA-5 (N-4)                    SA-8 (N-5)
KYC/CDD Prep  ──RM_DECISION──▶ Credit Prep  ──CREDIT_APPROVED──▶ Static Config
              CAPTURED event   (Phase 1: Brief Compile)          (CLS/CQG/IDB)
                               (Phase 2: Decision Capture)
                                      │
                                      ▼ (parallel)
                               SA-6 (N-4b) TMO Static
```

### SA-5 Workflow Phases

| Phase | Trigger | Mode | Parks At | Output |
|-------|---------|------|----------|--------|
| **Phase 1** | `RM_DECISION_CAPTURED` from SA-4 | `TRIGGER` | Credit Team Workbench | `CREDIT_PENDING` status, HITL task |
| **Phase 2** | Credit Team submits decision | `RESUME` | — | `CREDIT_APPROVED` or `CREDIT_DECLINED` |

### Two-Phase Execution Flow

```
Phase 1 (TRIGGER):
  START → Get Case Context → Extract Financial Data → Compile Credit Brief
       → Post to Workbench → Park for Credit Review → END: CREDIT_PENDING

Phase 2 (RESUME):
  START → Get Case Context → Validate Credit Decisions → Route: APPROVED/DECLINED
       → [DECLINED] → Update Case → Notify SA-7 → END: CREDIT_DECLINED
       → [APPROVED] → Store Decisions → Complete Node → END: CREDIT_APPROVED
```

### Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                          Dify Platform                          │
│                                                                 │
│  ┌────────────────┐   ┌─────────────────┐   ┌───────────────┐  │
│  │  SA-5 Credit   │   │  Knowledge Base │   │ LLM Provider  │  │
│  │  Workflow      │──▶│  KB-6 (Product  │──▶│ qwen2.5:32b   │  │
│  │  (Dify WF)     │   │  Reference)     │   │ (via Ollama)  │  │
│  └────────┬───────┘   └─────────────────┘   └───────────────┘  │
│           │ Code Node (urllib)                                  │
│           ▼                                                     │
│  ┌─────────────────────────┐                                   │
│  │  host.docker.internal   │                                   │
│  │  :8003 (SA-5 MCP)       │                                   │
│  └─────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────────────┐
  │  SA-5 FastMCP Server    │
  │  Port: 8003             │
  │  Tools:                 │
  │  - sa5_get_case_context │
  │  - sa5_extract_financial│
  │  - sa5_compile_brief    │
  │  - sa5_park_for_review  │
  │  - sa5_capture_decisions│
  │  - sa5_complete_node    │
  └─────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────────────┐
  │  MariaDB (dce_agent)                        │
  │  Reads:  dce_ao_rm_kyc_decision (SA-4)     │
  │          dce_ao_classification_result (SA-2)│
  │          dce_ao_node_checkpoint (N-3 output)│
  │  Writes: dce_ao_credit_brief (new)          │
  │          dce_ao_financial_extract (new)      │
  │          dce_ao_credit_decision (new)        │
  │          dce_ao_hitl_review_task (shared)    │
  │          dce_ao_node_checkpoint (N-4)        │
  │          dce_ao_event_log (N-4 events)       │
  │          dce_ao_case_state (status updates)  │
  └─────────────────────────────────────────────┘
```

---

## 2. Infrastructure Requirements

### Minimum Hardware (On-Prem)

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Dify Host | 8 CPU, 16 GB RAM | Shared with other SA Dify instances |
| Ollama Host | 32 GB+ VRAM (GPU) | Required for `qwen2.5:32b` (same as SA-4) |
| SA-5 MCP Host | 2 CPU, 4 GB RAM | Can co-locate with other MCP servers |
| Storage | 20 GB additional | Financial document processing cache |

### Network Requirements

| From | To | Port | Protocol |
|------|----|------|----------|
| Dify containers | Ollama host | 11434 | HTTP |
| Dify containers | SA-5 MCP server | 8003 | HTTP (StreamableHTTP/MCP) |
| SA-5 MCP server | MariaDB | 3306 | TCP |
| Browser clients | Dify | 80 / 443 | HTTPS |

> **Docker Networking**: Use `host.docker.internal:8003` from Dify containers to reach the SA-5 MCP server. On Linux, add `--add-host=host.docker.internal:host-gateway` to the Docker run command.

---

## 3. Ollama — LLM Model Setup

SA-5 uses the **same Ollama setup as SA-4** — no additional models required.

### Required Models

| Model | Used By | Size (approx) |
|-------|---------|---------------|
| `qwen2.5:32b` | KB-6 retrieval node, Credit Brief LLM node | ~20 GB (shared with SA-4) |

### Verify

```bash
ollama list
# Must show: qwen2.5:32b
```

### ⚠️ Models NOT Required

- `qwen2.5:7b` — NOT pulled, will cause "credentials not initialized". Never configure any node with this.

---

## 4. MCP Server Setup (SA-5 FastMCP)

### Tools Provided

| Tool | Purpose | DB Write |
|------|---------|----------|
| `sa5_get_case_context` | Fetch case state, N-3 output, RM KYC decisions, classification, financial doc IDs | None (read-only) |
| `sa5_extract_financial_data` | Parse financial statements (simulated), calculate credit metrics | INSERT `dce_ao_financial_extract` (1 row/year/doc) |
| `sa5_compile_credit_brief` | Build credit brief, post to Credit Team workbench queue | INSERT `dce_ao_credit_brief` |
| `sa5_park_for_credit_review` | Create HITL task + CREDIT_PENDING checkpoint + event log | INSERT `dce_ao_hitl_review_task`, `dce_ao_node_checkpoint`, `dce_ao_event_log`; UPDATE `dce_ao_case_state` |
| `sa5_capture_credit_decisions` | Validate + persist Credit Team decisions | INSERT `dce_ao_credit_decision` |
| `sa5_complete_node` | Final checkpoint + case state advance to N-5 + Kafka event | REPLACE INTO `dce_ao_node_checkpoint`; UPDATE `dce_ao_case_state`, `dce_ao_credit_brief`; INSERT `dce_ao_event_log` |

### MCP Session Pattern

Each Dify code node that calls the MCP server must follow the two-step StreamableHTTP protocol:

```python
# Step 1: Initialize session
init_resp = urllib.request.urlopen(
    urllib.request.Request(
        f"{mcp_endpoint}/mcp",
        data=json.dumps({"jsonrpc":"2.0","id":1,"method":"initialize",
                         "params":{"protocolVersion":"2024-11-05","capabilities":{},
                                   "clientInfo":{"name":"dify","version":"1.0"}}}).encode(),
        headers={"Content-Type":"application/json","Accept":"application/json, text/event-stream"},
        method="POST"
    ), timeout=60)
session_id = init_resp.headers.get("mcp-session-id", "")

# Step 2: Call tool with session ID
headers = {"Content-Type":"application/json","Accept":"application/json, text/event-stream",
           "Mcp-Session-Id": session_id}
```

### Deployment

```bash
# Start SA-5 MCP server directly
cd /path/to/dce_account_opening
PYTHONPATH=src/mcp_servers python src/mcp_servers/sa5_server.py

# Or via Docker Compose (recommended)
docker compose up -d --build mcp-sa5

# Health check
curl http://localhost:8003/health
# → {"status": "ok"}
```

### Verify MCP Server Tools

```bash
# Initialize and list tools
curl -X POST http://localhost:8003/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
# Copy mcp-session-id from response header, then:

curl -X POST http://localhost:8003/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <session-id>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
# → Should list all 6 SA-5 tools
```

---

## 5. Dify Platform Setup

SA-5 uses the **same Dify instance** as SA-1 through SA-4. No new Dify installation required.

### Pre-requisites

- [ ] Dify running and accessible
- [ ] Ollama provider configured (`qwen2.5:32b`)
- [ ] SA-4 workflow already imported and working (SA-5 depends on SA-4's DB output)

---

## 6. Workflow Import & Configuration

### Import the Workflow

1. In Dify: **Studio → Create App → Import DSL File**
2. Select `SA5_Credit_Preparation_Workflow.yml`
3. Record the new **App ID** (update this guide's header)

### ⚠️ Post-Import Manual Steps

The YAML cannot carry dataset IDs, model bindings, or MCP endpoint defaults. After import:

#### 6.1 — Verify LLM Models

| Node | Required Model |
|------|----------------|
| KB-6 Knowledge Retrieval | `qwen2.5:32b` via Ollama |
| Compile Credit Brief (LLM) | `qwen2.5:32b` via Ollama |

#### 6.2 — Set MCP Endpoint

START node variable `mcp_endpoint`:
- Docker: `http://host.docker.internal:8003`
- Multi-host: `http://<mcp-host-ip>:8003`

#### 6.3 — Connect Knowledge Base Datasets

KB-6 (DCE Product Reference) must be linked to the Knowledge Retrieval node:
- `dataset_ids: []` in YAML → must be filled with actual Dify dataset UUID
- Same KB-6 dataset used by SA-4 can be reused — no need to re-upload

---

## 7. Knowledge Base Setup

### SA-5 Knowledge Bases

| Dataset | Node | Content | Source File |
|---------|------|---------|-------------|
| KB-6 (DCE Product Reference) | KB-6 Retrieval node | Product margin profiles, typical limit ranges, exchange codes, settlement types | `kb/SA4_KB6_DCE_Product_Reference.md` |

> **Note**: KB-6 is shared between SA-4 and SA-5. If already uploaded for SA-4, reuse the same dataset UUID — no re-upload needed.

### KB-6 Usage in SA-5

The Credit Brief LLM node uses KB-6 to:
1. Look up **typical margin profiles** per product (`products_requested[]`)
2. Find **comparable client limit ranges** (benchmarking data)
3. Retrieve **regulatory classifications** per product for CAA approach guidance
4. Extract **OSCA requirement matrix** for OTC derivatives

### KB Node Configuration

```yaml
retrieval_mode: single
single_retrieval_config:
  model:
    name: qwen2.5:32b
    provider: langgenius/ollama/ollama
    mode: chat
    completion_params:
      temperature: 0.2
```

---

## 8. Workflow Node Configuration Checklist

Use after every import or environment refresh:

### START Node
- [ ] `mode` variable: `max_length: 20` (minimum — "HITL_REVIEW" = 11 chars, use same for "TRIGGER"/"RESUME")
- [ ] `case_id` variable configured
- [ ] `hitl_task_id` variable configured (used in Phase 2)
- [ ] `credit_decisions` variable configured (paragraph type, for JSON input in Phase 2)
- [ ] `mcp_endpoint` variable: default = `http://host.docker.internal:8003`

### Phase Router Node
- [ ] `TRIGGER` → Phase 1 execution path
- [ ] `RESUME` → Phase 2 execution path
- [ ] `variable_selector: ["<start_node_id>", "mode"]`

### KB-6 Knowledge Retrieval Node
- [ ] `dataset_ids` contains real KB-6 dataset UUID (not empty)
- [ ] Model: `qwen2.5:32b` via Ollama

### Compile Credit Brief (LLM Node)
- [ ] Model: `qwen2.5:32b` via Ollama
- [ ] `variables` array bound to all upstream node outputs
- [ ] Prompt uses `{{varName}}` syntax (NOT `{{#nodeId.var#}}` syntax)

### All Credit Decision Router Nodes (if-else)
- [ ] All conditions reference `string`-typed outputs (NOT `object` types)
- [ ] `comparison_operator: is` (NOT `contains` for exact match)
- [ ] String flag outputs declared in upstream code node `outputs` schema

### Credit Outcome Router (APPROVED/DECLINED)
- [ ] `variable_selector` → string field from Credit Decision Validator code node
- [ ] `value: "APPROVED"` / `value: "DECLINED"` (exact strings)

### SA-5 MCP Code Nodes (all)
- [ ] Output schema declares ALL keys the code returns
- [ ] MCP session init (`initialize` → get `mcp-session-id`) before every `tools/call`
- [ ] `mcp_endpoint` passed from START node variable

---

## 9. End-to-End Testing

### Phase 1 — TRIGGER Mode (Credit Brief Compilation)

**Input:**
```json
{
  "case_id": "AO-2026-000301",
  "mode": "TRIGGER",
  "hitl_task_id": "",
  "credit_decisions": "",
  "mcp_endpoint": "http://host.docker.internal:8003"
}
```

**Expected Execution Path:**
```
START → PHASE ROUTER → GET CASE CONTEXT (PHASE 1) → EXTRACT FINANCIAL DATA →
COMPILE CREDIT BRIEF → POST TO WORKBENCH → PARK FOR CREDIT REVIEW →
END: CREDIT_PENDING
```

**Expected Output:**
```json
{
  "case_status": "CREDIT_PENDING",
  "next_action": "CREDIT_TEAM_REVIEW",
  "credit_brief_id": "CBRIEF-XXXXXX",
  "hitl_task_id": "HITL-XXXXXX"
}
```

---

### Phase 2 — RESUME Mode: APPROVED Path

**Input:**
```json
{
  "case_id": "AO-2026-000301",
  "mode": "RESUME",
  "hitl_task_id": "HITL-XXXXXX",
  "mcp_endpoint": "http://host.docker.internal:8003",
  "credit_decisions": "{\"credit_outcome\": \"APPROVED\", \"approved_dce_limit_sgd\": 5000000, \"approved_dce_pce_limit_sgd\": 2000000, \"confirmed_caa_approach\": \"IRB\", \"conditions\": [], \"credit_team_id\": \"CT-001\", \"credit_team_name\": \"Sarah Tan\", \"decided_at\": \"2026-03-10T10:00:00Z\"}"
}
```

**Expected Execution Path:**
```
START → PHASE ROUTER → GET CASE CONTEXT (PHASE 2) → VALIDATE CREDIT DECISIONS →
CREDIT OUTCOME ROUTER → [APPROVED] → STORE CREDIT DECISIONS →
COMPLETE NODE → END: CREDIT_APPROVED
```

**Expected Output:**
```json
{
  "next_node": "N-5",
  "credit_outcome": "APPROVED",
  "approved_dce_limit_sgd": 5000000
}
```

---

### Phase 2 — RESUME Mode: DECLINED Path

**Input:**
```json
{
  "case_id": "AO-2026-000302",
  "mode": "RESUME",
  "hitl_task_id": "HITL-XXXXXX",
  "mcp_endpoint": "http://host.docker.internal:8003",
  "credit_decisions": "{\"credit_outcome\": \"DECLINED\", \"approved_dce_limit_sgd\": 0, \"approved_dce_pce_limit_sgd\": 0, \"confirmed_caa_approach\": \"SA\", \"conditions\": [], \"decline_reason\": \"Insufficient equity base for requested limit size\", \"credit_team_id\": \"CT-001\", \"credit_team_name\": \"Sarah Tan\", \"decided_at\": \"2026-03-10T11:00:00Z\"}"
}
```

**Expected Output:**
```json
{
  "credit_outcome": "DECLINED",
  "next_node": "DEAD",
  "case_status": "CREDIT_DECLINED"
}
```

### Phase 2 Mandatory Fields

All fields must be present in `credit_decisions` JSON:

| Field | Type | Valid Values |
|-------|------|-------------|
| `credit_outcome` | string | `"APPROVED"`, `"APPROVED_WITH_CONDITIONS"`, `"DECLINED"` |
| `approved_dce_limit_sgd` | number | ≥ 0 (0 if declined) |
| `approved_dce_pce_limit_sgd` | number | ≥ 0 (0 if declined) |
| `confirmed_caa_approach` | string | `"IRB"`, `"SA"` |
| `conditions` | array | `[]` or list of condition objects |
| `credit_team_id` | string | Non-empty |
| `credit_team_name` | string | Non-empty |
| `decided_at` | string (ISO8601) | e.g. `"2026-03-10T10:00:00Z"` |

---

## 10. Known Gotchas & Dify Constraints

### 🔴 Critical — Must Follow

| Issue | Rule | Fix |
|-------|------|-----|
| **Object outputs in if-else** | Dify if-else nodes cannot compare `object`-typed variables with string operators | Add explicit `string`-typed outputs (e.g., `credit_outcome_str`) to code nodes; never route on `result` (object) |
| **Output schema completeness** | ALL keys returned by code must be declared in `outputs` schema | Undeclared keys → output = `{}` silently |
| **MCP session init** | Each code node must do `initialize` → read `mcp-session-id` → `tools/call` | Never skip or hardcode session ID |
| **RM decisions read-only** | `dce_ao_rm_kyc_decision` is written by SA-4 only | SA-5 reads this table but NEVER writes to it (regulatory requirement) |
| **Credit brief immutability** | Once `brief_url` is set, the credit brief record is immutable | Never UPDATE a compiled credit brief. Escalation required if Credit Team requests changes. |
| **START node max_length** | Set ≥ 20 on `mode` variable | "TRIGGER" / "RESUME" both ≤ 6 chars, but keep consistent with SA-4 pattern |

### 🟡 Important — Be Aware

| Issue | Notes |
|-------|-------|
| **EDD Handling** | If `rm_decisions.cdd_clearance == 'ENHANCED_DUE_DILIGENCE'`, SA-5 still compiles the brief, but Credit Team review is blocked until additional EDD docs are received. Track in `conditions_tracker`. |
| **KYC Declined cases never reach SA-5** | If SA-4 set `kyc_risk_rating = UNACCEPTABLE`, case goes to DEAD. SA-5 is never triggered. |
| **Welcome Kit blocking** | Any `conditions[]` set by Credit Team block Welcome Kit dispatch until resolved. |
| **Parallel stream SA-6** | SA-6 (TMO Static) runs in parallel with SA-5. SA-6 holds a PLACEHOLDER for credit limits until SA-5 fires `CREDIT_APPROVED`. On this event, orchestrator updates SA-6 with approved limits. |
| **Financial data source** | In production, financial statements come from MongoDB via Document API. In local dev, financial data is simulated in the MCP server. |
| **LLM node `variables` array** | Use `{variable: "name", value_selector: ["nodeId", "key"]}` binding and reference as `{{name}}` in prompts. |

---

## 11. Troubleshooting Reference

### Error: Credit decisions validation fails
- **Cause**: `credit_decisions` JSON uses wrong field names
- **Fix**: Ensure all mandatory fields present (see Section 9 table)

### Error: `Invalid actual value type: string or array` at Credit Outcome Router
- **Cause**: If-else node condition referencing `object`-typed output from Credit Decision Validator
- **Fix**: Add `credit_outcome_str` (string type) to the validator code node outputs; update router condition to reference that field

### Error: `Not all output parameters are validated` / output is `{}`
- **Cause**: Code node returns key not declared in `outputs` schema
- **Fix**: Add missing key to `outputs` schema

### Error: SA-5 MCP cannot reach MariaDB
- **Cause**: DB host/port misconfiguration in container
- **Fix**: Verify `DCE_DB_HOST=db`, `DCE_DB_PORT=3306` in container env; `127.0.0.1:3307` for local direct access

### Error: `dce_ao_rm_kyc_decision` record not found for case
- **Cause**: SA-4 not yet completed for that case, or case went KYC_DECLINED
- **Fix**: Verify SA-4 Phase 2 completed successfully; check `dce_ao_case_state.status = 'ACTIVE'` and `current_node = 'N-4'`

### Error: Financial data extraction returns empty
- **Cause**: In production, Document API not returning financial statements; in dev, doc type mismatch
- **Fix**: Check `dce_ao_document_staged` for docs with type `FINANCIAL_STATEMENTS`; verify SA-2 seeded the financial docs for the case

---

## 12. Change Log

| Date | Version | Change | Fixed By |
|------|---------|--------|----------|
| 2026-03-08 | 1.0.0 | Initial SA-5 deployment guide created | Session |
| 2026-03-08 | 1.0.0 | DB schema: `dce_ao_credit_brief`, `dce_ao_financial_extract`, `dce_ao_credit_decision` | Session |
| 2026-03-08 | 1.0.0 | MCP server: 6 tools (`sa5_get_case_context` through `sa5_complete_node`) | Session |
| 2026-03-08 | 1.0.0 | SA-5 MCP server on port 8003 | Session |
| 2026-03-08 | 1.0.0 | SA-5 seed data: test cases AO-2026-000301 (APPROVED path), AO-2026-000302 (APPROVED_WITH_CONDITIONS) | Session |
| 2026-03-08 | 1.0.1 | **`sa5_park_for_credit_review` schema fix**: `sla_deadline` → `deadline`; `OPEN` → `PENDING`; `CREDIT` → `CREDIT_TEAM` (to match actual `dce_ao_hitl_review_task` enum) | Session |
| 2026-03-08 | 1.0.1 | **`sa5_park_for_credit_review` state fix**: `CREDIT_PENDING` → `HITL_PENDING` (not in `dce_ao_case_state.status` enum: `ACTIVE\|HITL_PENDING\|ESCALATED\|DONE\|DEAD`) | Session |
| 2026-03-08 | 1.0.1 | **`sa5_complete_node` HITL close fix**: `status='CLOSED'` → `'DECIDED'`; `resolved_at` → `decided_at` (actual column names in `dce_ao_hitl_review_task`) | Session |
| 2026-03-08 | 1.0.1 | **Test suite fix**: temp briefs in T3/T4 use `attempt_number=99` to avoid unique-key collision with T5/T10's `attempt_number=1` | Session |
| 2026-03-08 | 1.0.1 | **Test suite fix**: T11 deletes prior T8 decision before inserting DECLINED (UNIQUE KEY on `case_id` in `dce_ao_credit_decision`) | Session |
| 2026-03-08 | 1.0.1 | All 106/106 test assertions passing after schema corrections | Session |

---

*This document is auto-maintained. Do not edit the Change Log manually.*
