# SA-4 KYC/CDD Workflow — On-Premises / Production Deployment Guide

> **Auto-maintained**: This document is updated automatically after every major workflow change or fix.
> **Last updated**: 2026-03-08
> **Workflow file**: `SA4_KYC_CDD_Workflow.yml`
> **Dify App ID** *(dev/staging)*: `bdedf940-5cf4-4b17-be31-dbb44cd6f842`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Infrastructure Requirements](#2-infrastructure-requirements)
3. [Ollama — LLM Model Setup](#3-ollama--llm-model-setup)
4. [MCP Server Setup (SA-4 FastMCP)](#4-mcp-server-setup-sa-4-fastmcp)
5. [Dify Platform Setup](#5-dify-platform-setup)
6. [Workflow Import & Configuration](#6-workflow-import--configuration)
7. [Knowledge Base (KB) Dataset Setup](#7-knowledge-base-kb-dataset-setup)
8. [Workflow Node Configuration Checklist](#8-workflow-node-configuration-checklist)
9. [End-to-End Testing](#9-end-to-end-testing)
10. [Known Gotchas & Dify Constraints](#10-known-gotchas--dify-constraints)
11. [Troubleshooting Reference](#11-troubleshooting-reference)
12. [Change Log](#12-change-log)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Dify Platform                          │
│                                                                 │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────────────┐ │
│  │  SA-4 KYC  │   │  Knowledge   │   │  LLM Provider         │ │
│  │  Workflow  │──▶│  Base Nodes  │──▶│  (Ollama via plugin)  │ │
│  │  (YAML)    │   │  KB-4/KB-3/  │   │  qwen2.5:32b          │ │
│  └─────┬──────┘   │  KB-6        │   └───────────┬───────────┘ │
│        │          └──────────────┘               │             │
│        │ Code Node                               │             │
│        ▼ (urllib)                                ▼             │
│  ┌──────────────────────────────┐   ┌────────────────────────┐ │
│  │  host.docker.internal:8002   │   │  Ollama Service        │ │
│  │  (SA-4 MCP Server)           │   │  host.docker.internal  │ │
│  └──────────────────────────────┘   │  :11434                │ │
└─────────────────────────────────────└────────────────────────┘─┘
           │                                    │
           ▼                                    ▼
  ┌─────────────────┐                 ┌──────────────────────┐
  │  SA-4 FastMCP   │                 │  Ollama Host Machine  │
  │  Python Server  │                 │  (GPU recommended)    │
  │  Port: 8002     │                 │  Models: qwen2.5:32b  │
  │  Tools:         │                 └──────────────────────┘
  │  - run_screening│
  │  - entity_check │
  │  - registry_lkp │
  └─────────────────┘
```

**Workflow Phases:**
- **Phase 1 (`mode=TRIGGER`)**: Full KYC processing — entity check, sanctions screening, registry lookup, KB retrieval, KYC brief compilation → `END: HITL_PENDING`
- **Phase 2 (`mode=HITL_REVIEW`)**: RM decision capture and validation → `END: RM_DECISION_CAPTURED`

---

## 2. Infrastructure Requirements

### Minimum Hardware (On-Prem)

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Dify Host | 8 CPU, 16 GB RAM | Docker Compose deployment |
| Ollama Host | 32 GB+ VRAM (GPU) | Required for `qwen2.5:32b` |
| SA-4 MCP Host | 2 CPU, 4 GB RAM | Can co-locate with Dify host |
| Storage | 100 GB+ | Models ~20 GB, Dify data, KB docs |

### Network Requirements

| From | To | Port | Protocol |
|------|----|------|----------|
| Dify containers | Ollama host | 11434 | HTTP |
| Dify containers | SA-4 MCP server | 8002 | HTTP (StreamableHTTP/MCP) |
| Browser clients | Dify | 80 / 443 | HTTPS |
| SA-4 MCP server | External screening APIs | 443 | HTTPS |

> **Docker Networking Note**: Within Dify Docker containers, use `host.docker.internal` to reach services on the host machine. In a multi-host setup, replace with the actual hostname/IP.

---

## 3. Ollama — LLM Model Setup

### Required Models

| Model | Used By | Size (approx) |
|-------|---------|---------------|
| `qwen2.5:32b` | KB-4, KB-3, KB-6 (retrieval), Compile KYC Brief LLM (node 4000000015) | ~20 GB |

### Pull Required Models

```bash
# On the Ollama host machine
ollama pull qwen2.5:32b

# Verify
ollama list
```

### ⚠️ Models NOT Required / Avoid

- `qwen2.5:7b` — **NOT pulled**, caused "credentials not initialized" errors. Do NOT set this in any node.

### Dify → Ollama Provider Configuration

1. In Dify: **Settings → Model Providers → Ollama**
2. Install the Ollama plugin (`langgenius/ollama/ollama`)
3. Set base URL: `http://host.docker.internal:11434` *(or actual Ollama host IP)*
4. Test connection with `qwen2.5:32b`

---

## 4. MCP Server Setup (SA-4 FastMCP)

### What It Does

The SA-4 MCP server exposes tools called by Dify code nodes:
- **`run_screening_batch`**: Sanctions/AML screening via external API
- **`entity_check`** *(or equivalent)*: ACRA/entity registry lookup
- **`registry_lookup`** *(or equivalent)*: Additional registry tools

### MCP Protocol: StreamableHTTP

Dify code nodes use raw `urllib` HTTP calls (not the MCP SDK). The pattern is:

```python
# Step 1: Initialize MCP session
init_payload = json.dumps({
    "jsonrpc": "2.0", "id": 1, "method": "initialize",
    "params": {"protocolVersion": "2024-11-05",
                "capabilities": {}, "clientInfo": {"name": "dify", "version": "1.0"}}
}).encode()

init_resp = urllib.request.urlopen(
    urllib.request.Request(
        f"{mcp_endpoint}/mcp",
        data=init_payload,
        headers={"Content-Type": "application/json",
                 "Accept": "application/json, text/event-stream"},
        method="POST"
    ), timeout=60)

session_id = init_resp.headers.get("mcp-session-id", "")

# Step 2: Call a tool using the session ID
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    "Mcp-Session-Id": session_id,
}
tool_payload = json.dumps({
    "jsonrpc": "2.0", "id": 2, "method": "tools/call",
    "params": {"name": "run_screening_batch",
               "arguments": {"entities": entity_list}}
}).encode()
```

### Deployment

```bash
# Start MCP server (adjust path to your FastMCP server script)
cd /path/to/sa4-mcp-server
python server.py --port 8002

# Or via Docker
docker run -d --name sa4-mcp \
  -p 8002:8002 \
  -e SCREENING_API_KEY=<your-key> \
  sa4-mcp-server:latest
```

### Verify MCP Server

```bash
# Health check
curl http://localhost:8002/health

# Test MCP initialize
curl -X POST http://localhost:8002/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
# → Should return a response with header: mcp-session-id: <session-id>
```

### MCP Endpoint in Workflow

The MCP server URL is passed as a START node variable and referenced in code nodes. Ensure:
- **Dev/Docker**: `http://host.docker.internal:8002`
- **Prod (multi-host)**: `http://<mcp-host-ip>:8002` or via internal DNS

---

## 5. Dify Platform Setup

### Recommended: Docker Compose

```bash
git clone https://github.com/langgenius/dify.git
cd dify/docker
cp .env.example .env
# Edit .env: set SECRET_KEY, database credentials, etc.
docker-compose up -d
```

### Post-Install Checklist

- [ ] Admin account created
- [ ] Ollama model provider configured (`qwen2.5:32b` accessible)
- [ ] Dify accessible on intended hostname/IP
- [ ] HTTPS configured (reverse proxy: Nginx/Traefik recommended for prod)
- [ ] Persistent volumes configured for PostgreSQL, MinIO (file storage)

---

## 6. Workflow Import & Configuration

### Import the Workflow YAML

1. In Dify, go to **Studio → Create App → Import DSL File**
2. Select `SA4_KYC_CDD_Workflow.yml`
3. Note the new **App ID** assigned (update this guide's header)

> Alternatively via API:
> ```bash
> curl -X POST "http://<dify-host>/console/api/apps/imports" \
>   -H "Authorization: Bearer <admin-token>" \
>   -F "data=@SA4_KYC_CDD_Workflow.yml" \
>   -F "mode=yaml-content"
> ```

### Post-Import: Required Manual Steps

After import, you **must** manually configure items the YAML cannot carry:

#### 6.1 — Reassign LLM Models

The YAML imports with the model names but Dify may reset them if the provider isn't recognized. Verify each LLM node:

| Node | Node ID | Required Model |
|------|---------|----------------|
| KB-4 (KYC Policy Retrieval) | 4000000004 | `qwen2.5:32b` via Ollama |
| KB-3 (CDD Retrieval) | 4000000005 | `qwen2.5:32b` via Ollama |
| KB-6 (Regulatory Retrieval) | 4000000006 | `qwen2.5:32b` via Ollama |
| Compile KYC Brief | 4000000015 | `qwen2.5:32b` via Ollama |

#### 6.2 — Set MCP Server URL

The START node variable `mcp_endpoint` must be pre-filled or confirmed at runtime. Default value should be set to:
- `http://host.docker.internal:8002` (Docker deployment)
- `http://<mcp-host>:8002` (multi-host deployment)

#### 6.3 — Connect Knowledge Base Datasets (see Section 7)

KB nodes 4000000004, 4000000005, 4000000006 are imported with **empty `dataset_ids: []`**. You must attach real datasets.

---

## 7. Knowledge Base (KB) Dataset Setup

This is the **most critical production step** — without datasets, KB nodes return no context, causing weak KYC briefs.

### Required Datasets

| Dataset | Dify Node | Node ID | Content |
|---------|-----------|---------|---------|
| KYC Policy KB | KB-4 | 4000000004 | KYC policy documents, risk rating guidelines |
| CDD Requirements KB | KB-3 | 4000000005 | CDD procedure documents, customer due diligence requirements |
| Regulatory KB | KB-6 | 4000000006 | MAS regulations, AML/CFT guidelines, FATF recommendations |

### Steps to Create and Connect Datasets

```
1. Dify → Knowledge → Create Knowledge
2. Upload relevant documents (PDF, DOCX, MD supported)
3. Choose embedding model (recommend: same Ollama provider, or OpenAI text-embedding-3-small)
4. Process and index the dataset
5. Copy the Dataset UUID from the URL or API
```

### Attach Dataset to KB Nodes

**Via Dify UI:**
1. Open SA-4 workflow → Click the KB node (e.g., KB-4)
2. In the right panel, under "Knowledge Retrieval" → click "+ Add"
3. Select the relevant dataset
4. Save and publish

**Via API (for automation):**
```bash
# Get current draft
GET /console/api/apps/{app_id}/workflows/draft

# Patch KB node with dataset IDs
# In the node's `dataset_ids` array, add the dataset UUID
```

### KB Node Configuration (per node)

```yaml
retrieval_mode: single          # single or multiple
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

Use this checklist after every import or environment refresh:

### START Node (4000000001)
- [ ] `mode` variable: `max_length: 20` *(minimum — "HITL_REVIEW" = 11 chars)*
- [ ] `case_id` variable configured
- [ ] `hitl_task_id` variable configured
- [ ] `rm_decisions` variable configured (paragraph type, for JSON input)
- [ ] `mcp_endpoint` variable configured with correct default URL

### Phase Router (4000000002)
- [ ] Branches: `TRIGGER` → Phase 1 path, `HITL_REVIEW` → Phase 2 path
- [ ] `variable_selector: ["4000000001", "mode"]`

### KB Nodes (4000000004, 4000000005, 4000000006)
- [ ] `dataset_ids` contains real dataset UUIDs (not empty)
- [ ] Model: `qwen2.5:32b`

### Run Screening Batch (4000000009)
- [ ] Output schema declares BOTH: `result` (object) AND `sanctions_hit` (string)
- [ ] Code reads `mcp-session-id` header from init response
- [ ] Returns `sanctions_hit: "true"` or `"false"` (string, not boolean)

### Sanctions Hit Router (4000000010)
- [ ] `variable_selector: ["4000000009", "sanctions_hit"]` *(not `result`)*
- [ ] `comparison_operator: is`
- [ ] `value: "true"` (string)

### Compile KYC Brief LLM (4000000015)
- [ ] Model: `qwen2.5:32b`
- [ ] `variables` array has all 7 entries bound to correct node outputs
- [ ] Prompt uses `{{varName}}` syntax (not `{{#nodeId.var#}}` syntax)

### RM Decision Validator (4000000019)
- [ ] Output schema declares: `result` (object), `fields_complete` (string), `kyc_risk_rating_str` (string)
- [ ] Returns string `"true"`/`"false"` for `fields_complete` *(not boolean)*

### All Fields Present? (4000000020)
- [ ] `variable_selector: ["4000000019", "fields_complete"]` *(not `result`)*
- [ ] `comparison_operator: is`, `value: "true"` (string)

### KYC Rating UNACCEPTABLE? (4000000022)
- [ ] `variable_selector: ["4000000019", "kyc_risk_rating_str"]` *(not `result`)*
- [ ] `comparison_operator: is`, `value: "UNACCEPTABLE"`

---

## 9. End-to-End Testing

### Phase 1 — TRIGGER Mode

**Input:**
```json
{
  "case_id": "AO-2026-000201",
  "mode": "TRIGGER",
  "hitl_task_id": "",
  "rm_decisions": "",
  "mcp_endpoint": "http://host.docker.internal:8002"
}
```

**Expected Execution Path (14 nodes):**
```
START → PHASE ROUTER → GET CASE CONTEXT (PHASE 1) → ENTITY CHECK (ACRA) →
RUN SCREENING BATCH → SANCTIONS HIT ROUTER → [No Hit branch] →
KB-4 / KB-3 / KB-6 (parallel) → REGISTRY LOOKUP →
COMPILE KYC BRIEF (LLM) → SAVE HITL TASK → COMPLETE NODE → END: HITL_PENDING
```

**Expected Output:**
```json
{
  "case_status": "HITL_PENDING",
  "next_action": "RM_REVIEW",
  "hitl_task_id": "HITL-XXXXXX"
}
```

---

### Phase 2 — HITL_REVIEW Mode

**Input:**
```json
{
  "case_id": "AO-2026-000201",
  "mode": "HITL_REVIEW",
  "hitl_task_id": "HITL-XXXXXX",
  "mcp_endpoint": "http://host.docker.internal:8002",
  "rm_decisions": "{\"kyc_risk_rating\": \"MEDIUM\", \"cdd_clearance\": \"APPROVED\", \"bcap_clearance\": \"APPROVED\", \"caa_approach\": \"STANDARD\", \"recommended_dce_limit_sgd\": 500000, \"recommended_dce_pce_limit_sgd\": 100000, \"osca_case_number\": \"OSCA-2026-001\", \"limit_exposure_indication\": \"LOW\", \"rm_id\": \"RM001\", \"decided_at\": \"2026-03-08T14:43:00Z\"}"
}
```

**Phase 2 Mandatory Fields** *(all must be present in `rm_decisions` JSON)*:

| Field | Type | Example |
|-------|------|---------|
| `kyc_risk_rating` | string | `"MEDIUM"`, `"HIGH"`, `"UNACCEPTABLE"` |
| `cdd_clearance` | string | `"APPROVED"`, `"REJECTED"` |
| `bcap_clearance` | string | `"APPROVED"`, `"REJECTED"` |
| `caa_approach` | string | `"STANDARD"`, `"ENHANCED"` |
| `recommended_dce_limit_sgd` | number | `500000` |
| `recommended_dce_pce_limit_sgd` | number | `100000` |
| `osca_case_number` | string | `"OSCA-2026-001"` |
| `limit_exposure_indication` | string | `"LOW"`, `"MEDIUM"`, `"HIGH"` |
| `rm_id` | string | `"RM001"` |
| `decided_at` | string (ISO8601) | `"2026-03-08T14:43:00Z"` |

**Expected Execution Path (9 nodes):**
```
START → PHASE ROUTER → GET CASE CONTEXT (PHASE 2) → RM DECISION VALIDATOR →
ALL FIELDS PRESENT? → KYC RATING UNACCEPTABLE? → CAPTURE RM DECISIONS →
COMPLETE NODE → END: RM_DECISION_CAPTURED
```

**Expected Output:**
```json
{
  "next_node": "N-4",
  "decision_id": "DEC-XXXXXX"
}
```

> **UNACCEPTABLE path**: If `kyc_risk_rating = "UNACCEPTABLE"`, the routing after `KYC RATING UNACCEPTABLE?` leads to `END: KYC_REJECTED` instead.

---

## 10. Known Gotchas & Dify Constraints

### 🔴 Critical — Must Follow

| Issue | Rule | Fix |
|-------|------|-----|
| **Object outputs in if-else** | Dify if-else nodes cannot compare `object`-typed variables with string operators (`is`, `contains`) | Always add explicit `string`-typed outputs for routing signals. Never route on `result` (object type) directly. |
| **Output schema completeness** | ALL keys returned by a code node must be declared in the `outputs` schema | Undeclared keys silently fail — the code runs but output = `{}` |
| **MCP session initialization** | Each MCP tool call requires a fresh `initialize` → get `mcp-session-id` → then `tools/call` | Do NOT skip the init step or hardcode a session ID |
| **Model availability** | Only use models that are actually pulled in Ollama | Check with `ollama list` before configuring nodes. `qwen2.5:7b` is NOT pulled. |
| **START node max_length** | Text input variables have a character limit enforced before workflow runs | Set `max_length` to accommodate longest possible value. `HITL_REVIEW` = 11 chars, so `max_length ≥ 20`. |

### 🟡 Important — Be Aware

| Issue | Notes |
|-------|-------|
| **LLM node `variables` array** | Use `variables: [{variable: "name", value_selector: ["nodeId", "key"]}]` and reference as `{{name}}` in prompts. The `{{#nodeId.var#}}` syntax only works for nodes declared in `context.variable_selector`. |
| **Dify CSRF token expiry** | Long interactive sessions expire the auth token. If JS API calls return 401, refresh the workflow page in the browser to restore the session. |
| **Knowledge Base empty on import** | The YAML imports with `dataset_ids: []`. Datasets must be manually attached post-import — they are not portable via YAML. |
| **Docker networking** | `host.docker.internal` resolves to the host machine from within Docker containers (works on Docker Desktop and Docker with `--add-host`). On Linux Docker, may need explicit `--add-host=host.docker.internal:host-gateway`. |
| **YAML ↔ Live drift** | After any live edits in the Dify UI, re-export the workflow DSL and update the YAML file to keep them in sync. |

---

## 11. Troubleshooting Reference

### Error: `ValueError: mode in input form must be less than X characters`
- **Cause**: START node `max_length` too small for the input value
- **Fix**: Increase `max_length` for the `mode` variable to ≥ 20

### Error: `Invalid actual value type: string or array`
- **Cause**: An if-else node condition is trying to compare an `object`-typed variable
- **Fix**: Add a `string`-typed output to the upstream code node (e.g., `"true"`/`"false"`) and update the condition to reference that field

### Error: `Not all output parameters are validated` / output is `{}`
- **Cause**: Code node returns a key that is not declared in the `outputs` schema
- **Fix**: Add the missing key to the node's `outputs` schema with the correct type

### Error: `credentials not initialized` for LLM node
- **Cause**: The configured model is not available in Ollama (not pulled)
- **Fix**: Run `ollama pull <model-name>` on the Ollama host, or switch to an available model

### Error: MCP tool call returns empty or timeout
- **Cause**: MCP server unreachable, or session ID not being sent correctly
- **Fix**:
  1. Verify MCP server is running: `curl http://host.docker.internal:8002/health`
  2. Verify the `initialize` step is returning a `mcp-session-id` header
  3. Ensure the `Mcp-Session-Id` header is included in the `tools/call` request

### Phase 2 validation fails with missing fields
- **Cause**: `rm_decisions` JSON uses incorrect field names
- **Fix**: Ensure all 10 mandatory fields are present with exact names (see Section 9 table)

---

## 12. Change Log

| Date | Version | Change | Fixed By |
|------|---------|--------|----------|
| 2026-03-08 | 1.0.0 | Initial guide created | Session |
| 2026-03-08 | 1.0.0 | **KB nodes**: Changed model `qwen2.5:7b` → `qwen2.5:32b` (nodes 4000000004/5/6) | Session |
| 2026-03-08 | 1.0.0 | **Run Screening Batch (4000000009)**: Fixed MCP session init (`init_resp` + `mcp-session-id` header); added `sanctions_hit` string output | Session |
| 2026-03-08 | 1.0.0 | **Sanctions Hit Router (4000000010)**: Changed condition from `result` (object) to `sanctions_hit` (string); `contains` → `is` | Session |
| 2026-03-08 | 1.0.0 | **Compile KYC Brief (4000000015)**: Changed model to `qwen2.5:32b`; added `variables` array; updated prompt refs to `{{varName}}` | Session |
| 2026-03-08 | 1.0.0 | **START node (4000000001)**: `mode` max_length `10` → `20` (HITL_REVIEW = 11 chars) | Session |
| 2026-03-08 | 1.0.0 | **RM Decision Validator (4000000019)**: Added `fields_complete` and `kyc_risk_rating_str` string outputs | Session |
| 2026-03-08 | 1.0.0 | **All Fields Present? (4000000020)**: Condition changed from `result` (object) to `fields_complete` (string); `contains` → `is` | Session |
| 2026-03-08 | 1.0.0 | **KYC Rating UNACCEPTABLE? (4000000022)**: Condition changed from `result` (object) to `kyc_risk_rating_str` (string) | Session |
| 2026-03-08 | 1.0.1 | **SA-5 added**: `mcp-sa5` service deployed on port 8003; `dce_ao_credit_brief`, `dce_ao_financial_extract`, `dce_ao_credit_decision` tables added; SA-4 feeds SA-5 via `RM_DECISION_CAPTURED` Kafka event | Session |

---

*This document is auto-maintained. Do not edit the Change Log manually — it is appended programmatically after each session with major changes.*
