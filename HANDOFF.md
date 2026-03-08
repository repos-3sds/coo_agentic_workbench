# DCE Account Opening — Project Handoff Document

> **Living document** — Update this file at the end of every work session that produces material changes.
> Last updated: **2026-03-07** | Session contributor: Claude (SA-4 completion)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Local Environment](#3-local-environment)
4. [Component Status](#4-component-status)
5. [Completed Work Log](#5-completed-work-log)
6. [File Inventory](#6-file-inventory)
7. [Bug Fixes Applied](#7-bug-fixes-applied)
8. [Pending Tasks — Next Steps](#8-pending-tasks--next-steps)
9. [Critical Gotchas & Known Issues](#9-critical-gotchas--known-issues)
10. [Quick Command Reference](#10-quick-command-reference)
11. [Resuming a Session](#11-resuming-a-session)

---

## 1. Project Overview

**ABS Bank — DCE (Digital Client Experience) Account Opening**

A multi-agent AI system that automates corporate account opening workflows at ABS Bank. The system runs on Dify (workflow orchestration) + FastMCP (tool execution) + MariaDB (state persistence).

**Production Target:** OpenShift (OCP)
**Dev / Test Target:** Local Docker via Colima (macOS)
**Orchestration:** Dify (self-hosted, `localhost:80`)
**LLM:** Ollama + Qwen (local) — `qwen2.5:7b` configured as Dify model provider
**MCP Servers:** FastMCP (`mcp[cli]`) exposing tools to Dify workflow code nodes via HTTP

**Case flow (DAG):**
```
SA-1 (N-0)  →  SA-2 (N-1)  →  SA-3 (N-2)  →  SA-4 (N-3)  →  ...
Intake/Triage   Doc Collection   Sig Verify     KYC/CDD
```

---

## 2. Architecture

```
Mac (Colima / Docker)
│
├── DCE Stack  (docker-compose.yml at project root)
│   ├── dce_mariadb          port 3307   MariaDB 11.3, 17+ tables, auto-migrated
│   ├── dce_mcp_sa1_sa2      port 8000   SA-1 + SA-2 FastMCP tool server
│   ├── dce_mcp_sa3          port 8001   SA-3 FastMCP tool server
│   └── dce_mcp_sa4          port 8002   SA-4 FastMCP tool server
│
└── Dify Stack  (~/dify/docker/docker-compose.yml)
    ├── nginx                port 80     Dify UI + API gateway
    ├── api                  port 5001   Dify backend
    ├── worker / worker_beat           Celery async task workers
    ├── plugin_daemon        port 5003
    ├── redis                port 6379   (Dify internal)
    ├── db_postgres          port 5432   (Dify internal — NOT the DCE MariaDB)
    ├── web                  port 3000   (Dify frontend, behind nginx)
    ├── weaviate                         (Dify vector store for KBs)
    ├── sandbox                          (Dify code execution sandbox)
    └── ssrf_proxy           port 3128

Dify containers → MCP servers via:  http://host.docker.internal:8000  and :8001  and :8002
```

**Network isolation:** The DCE stack and Dify stack are on separate Docker networks. They communicate through the Mac host via `host.docker.internal`. This works on macOS with Colima. Do NOT use container names across stacks.

---

## 3. Local Environment

### Prerequisites
- macOS with Homebrew
- Colima (headless Docker): `brew services start colima` — set to auto-start
- Docker CLI: `~/.docker/bin/docker` (Colima installs this)
- Python 3.11 (pyenv recommended) — only needed to run tests, not for containers
- Ollama: installed locally, Qwen model pulled, registered as Dify model provider

### Environment Variables (`.env` at project root)
Key variables used by docker-compose:
```
DCE_DB_HOST=db
DCE_DB_PORT=3306
DCE_DB_NAME=dce_account_opening
DCE_DB_USER=dce_user
DCE_DB_PASSWORD=dce_password_local
```
Full `.env` already in repo. No edits needed for local dev.

### Dify `.env`
Located at `~/dify/docker/.env` (generated from `.env.example`).
Key: `SECRET_KEY` is set to a 64-char random hex string (generated during initial setup).

---

## 4. Component Status

### ✅ SA-1 — Intake & Triage (N-0)
| Item | Status |
|------|--------|
| MCP Server | `sa1_sa2_server.py` — shared with SA-2 on port 8000 |
| Dify Workflow YAML | `dify/SA1_Intake_Triage_Workflow.yml` — 18 nodes |
| DSL | `dify/SA1_Intake_Triage_Workflow.dsl` |
| Knowledge Bases | KB-1 (Document Taxonomy), KB-9 (SLA Policy) |
| Tests | `docs/SA1_Test_Cases.md` |
| **Dify import** | ⚠️ Must link KB-1 and KB-9 dataset IDs after import (see Section 8) |

### ✅ SA-2 — Document Collection (N-1)
| Item | Status |
|------|--------|
| MCP Server | `sa1_sa2_server.py` — shared with SA-1 on port 8000 |
| Dify Workflow YAML | `dify/SA2_Document_Collection_Workflow.yml` |
| DSL | `dify/SA2_Document_Collection_Workflow.dsl` |
| Knowledge Bases | KB-1, KB-2 (Checklist Rules), KB-3/KB-12 (GTA Reference), KB-10 (Exception Playbook) |
| **Dify import** | ⚠️ Must link KB dataset IDs after import |

### ✅ SA-3 — Signature Verification (N-2)
| Item | Status |
|------|--------|
| MCP Server | `src/mcp_servers/sa3_server.py` — port 8001 |
| Dify Workflow YAML | `dify/SA3_Signature_Verification_Workflow.yml` — 23 nodes (two-phase HITL) |
| Knowledge Base | `kb/SA3_KB5_Signature_Verification_Guidelines.md` |
| Tests | `tests/test_sa3_tools.py` — **31/31 passing** |
| Container | `dce_mcp_sa3` — healthy |
| **Dify import** | ⚠️ Must link KB-5 dataset ID after import (see Section 8) |

### ✅ SA-4 — KYC/CDD Preparation (N-3)
| Item | Status |
|------|--------|
| Spec | `docs/DCE_AO_Agent_Setup_SA4.md` |
| MCP Server | `src/mcp_servers/sa4_server.py` — port 8002, 9 tools |
| Dify Workflow YAML | `dify/SA4_KYC_CDD_Workflow.yml` — 27 nodes (two-phase HITL) |
| Knowledge Bases | KB-4 (Regulatory Requirements), KB-6 (DCE Product Reference); reuses KB-3 (GTA Reference) |
| DB Schema | `db/007_sa4_tables.sql` — 3 new tables; `db/008_sa4_seed.sql` — 2 test cases |
| DB Schema Doc | `docs/DCE_AO_Table_Schemas_SA4.md` |
| Tests | `tests/test_sa4_tools.py` — 11 test functions, ~35 assertions |
| Container | `dce_mcp_sa4` — port 8002 (build with `docker compose up -d --build mcp-sa4`) |
| **Dify import** | ⚠️ Must upload KB-4 + KB-6, import workflow, link 3 KB dataset IDs after import (see Section 8) |

---

## 5. Completed Work Log

### Session: Initial Setup (pre-summary)
- Created MariaDB schema (17 tables across SA-1, SA-2, SA-3)
- Created seed data SQL files (001–006)
- Wrote `sa1_sa2_server.py` with full SA-1 + SA-2 MCP tools
- Wrote SA-1 and SA-2 Dify workflow YAMLs + DSLs
- Created all SA-1 and SA-2 KBs

### Session: 2026-03-06 (this session)

#### Fix 1 — MariaDB container stayed `unhealthy`
- Root cause: `docker-compose.yml` healthcheck used CMD array format which does not expand shell env vars
- Fix: changed to `CMD-SHELL` with bundled `healthcheck.sh --connect --innodb_initialized`
- Also removed obsolete `version: "3.9"` attribute

#### Fix 2 — Dify installation
- Cloned `https://github.com/langgenius/dify.git` → `~/dify`
- Copied `.env.example` → `.env`, generated `SECRET_KEY`
- Started Dify: 11 containers at `http://localhost:80`
- User manually added Ollama + Qwen as model provider in Dify UI

#### Fix 3 — Workflow YAML endpoint updates
- `dify/SA1_Intake_Triage_Workflow.yml` — `MCP_ENDPOINT` updated from Railway URL to `http://host.docker.internal:8000`
- `dify/SA2_Document_Collection_Workflow.yml` — same endpoint update

#### SA-3 Deliverables (all new this session)
1. **`kb/SA3_KB5_Signature_Verification_Guidelines.md`** — 11-section KB covering confidence tiers, authority checks, jurisdiction ID docs, evidence packaging, Desk Support protocol, SLA, escalation triggers
2. **`dify/SA3_Signature_Verification_Workflow.yml`** — 23-node two-phase HITL Dify workflow
3. **`tests/test_sa3_tools.py`** — 10 test functions, 31 assertions, all passing
4. **Bug fixes in `src/mcp_servers/sa3_server.py`** (see Section 7)

### Session: 2026-03-07

#### SA-4 Deliverables (all new this session)
1. **`src/mcp_servers/config.py`** — Updated with SA-4 constants (`SA4_AGENT_MODEL`, `SA4_NODE_ID`, `SA4_NEXT_NODE`, `SA4_MAX_RETRIES`)
2. **`db/007_sa4_tables.sql`** — 3 new tables: `dce_ao_kyc_brief`, `dce_ao_screening_result`, `dce_ao_rm_kyc_decision`
3. **`db/008_sa4_seed.sql`** — 2 test cases at N-3: AO-2026-000201 (ABC Capital, SGP/CORP, CLEAR) and AO-2026-000202 (Dragon Phoenix, HKG/CORP, POTENTIAL_MATCH)
4. **`src/mcp_servers/sa4_server.py`** — 9 MCP tools; external API stubs for Refinitiv, Dow Jones Risk, Factiva, ACRA, HK Companies Registry; `_SANCTIONS_WATCHLIST` with "Liu Zhiwei" for edge-case testing; SA-3 bug fixes applied proactively (`REPLACE INTO`, `json.dumps([hitl_task_id])`)
5. **`kb/SA4_KB4_Regulatory_Requirements.md`** — 10-section KB: SGP/HKG regulatory framework, CDD by entity type, UBO thresholds, EDD triggers, sanctions resolution, KYC risk rating methodology
6. **`kb/SA4_KB6_DCE_Product_Reference.md`** — 6-section KB: product-level risk ratings (FUTURES/OPTIONS/OTC/COMMODITIES/MULTI), DCE credit limit framework, PCE/DCE ratio table, OSCA requirement matrix
7. **`Dockerfile.sa4`** — SA-4 MCP server image (port 8002)
8. **`docker-compose.yml`** — Updated: added `mcp-sa4` service on port 8002, updated comment block with 007/008 migration files
9. **`dify/SA4_KYC_CDD_Workflow.yml`** — 27-node two-phase HITL Dify Workflow (WF type); nodes 4000000001–4000000027; Phase 1 (entity extraction → screening → corporate registry → brief compilation → HITL park); Phase 2 (decision validation → KYC risk routing → RM decision capture → complete node); MCP endpoint `http://host.docker.internal:8002`; Qwen `qwen2.5:7b` LLM for brief compilation
10. **`tests/test_sa4_tools.py`** — 11 test functions, ~35 assertions; covers all 9 tools + sanctions escalation path + KYC declined path
11. **`docs/DCE_AO_Table_Schemas_SA4.md`** — Full DB schema reference doc: all 3 SA-4 tables, shared table usage, dependency map, special rules (sanctions hard stop, KYC_DECLINED path)

---

## 6. File Inventory

### Source Code
| File | Purpose |
|------|---------|
| `src/mcp_servers/sa1_sa2_server.py` | SA-1 + SA-2 FastMCP tool server (port 8000) |
| `src/mcp_servers/sa3_server.py` | SA-3 FastMCP tool server (port 8001). 5 tools: `sa3_get_case_context`, `sa3_run_signature_analysis_batch`, `sa3_park_for_hitl`, `sa3_store_approved_specimens`, `sa3_complete_node` |
| `src/mcp_servers/sa4_server.py` | SA-4 FastMCP tool server (port 8002). 9 tools: `sa4_get_case_context`, `sa4_extract_entity_structure`, `sa4_run_screening_batch`, `sa4_lookup_corporate_registry`, `sa4_escalate_sanctions_hit`, `sa4_compile_and_submit_kyc_brief`, `sa4_park_for_hitl`, `sa4_capture_rm_decisions`, `sa4_complete_node` |

### Dify Workflow YAMLs (import into Dify Studio)
| File | Nodes | Status |
|------|-------|--------|
| `dify/SA1_Intake_Triage_Workflow.yml` | 18 | ⚠️ KB dataset IDs need linking post-import |
| `dify/SA1_Intake_Triage_Workflow.dsl` | — | Older DSL format, may be outdated vs YML |
| `dify/SA2_Document_Collection_Workflow.yml` | — | ⚠️ KB dataset IDs need linking post-import |
| `dify/SA2_Document_Collection_Workflow.dsl` | — | Older DSL format |
| `dify/SA3_Signature_Verification_Workflow.yml` | 23 | ⚠️ KB-5 node `dataset_ids: []` — must link after import |
| `dify/SA4_KYC_CDD_Workflow.yml` | 27 | ⚠️ KB-4, KB-3, KB-6 nodes `dataset_ids: []` — must link after import |

### Knowledge Bases (upload to Dify → Knowledge)
| File | Agent | KB Name |
|------|-------|---------|
| `kb/SA1_KB1_Document_Taxonomy.md` | SA-1 | KB-1 Document Taxonomy |
| `kb/SA1_KB9_SLA_Policy.md` | SA-1 | KB-9 SLA Policy |
| `kb/SA2_KB1_Document_Taxonomy.md` | SA-2 | KB-1 Document Taxonomy |
| `kb/SA2_KB2_Checklist_Rules.md` | SA-2 | KB-2 Checklist Rules |
| `kb/SA2_KB3_KB12_GTA_Reference.md` | SA-2 | KB-3/KB-12 GTA Reference |
| `kb/SA2_KB10_Exception_Playbook.md` | SA-2 | KB-10 Exception Playbook |
| `kb/SA3_KB5_Signature_Verification_Guidelines.md` | SA-3 | KB-5 Signature Verification Guidelines |
| `kb/SA4_KB4_Regulatory_Requirements.md` | SA-4 | KB-4 Regulatory Requirements (SGP/HKG KYC/CDD/AML) |
| `kb/SA4_KB6_DCE_Product_Reference.md` | SA-4 | KB-6 DCE Product Reference (limits, OSCA, risk ratings) |

### DB Schema & Migrations (auto-run on `make up`)
| File | Content |
|------|---------|
| `db/001_create_tables.sql` | Core SA-1 tables |
| `db/002_seed_data.sql` | SA-1 seed data |
| `db/003_sa2_tables.sql` | SA-2 tables |
| `db/004_sa2_seed.sql` | SA-2 seed data |
| `db/005_sa3_tables.sql` | SA-3 tables (`dce_ao_signature_verification`, `dce_ao_signature_specimen`, `dce_ao_hitl_review_task`) |
| `db/006_sa3_seed.sql` | SA-3 seed data (test cases AO-2026-000101, AO-2026-000102) |
| `db/007_sa4_tables.sql` | SA-4 tables (`dce_ao_kyc_brief`, `dce_ao_screening_result`, `dce_ao_rm_kyc_decision`) |
| `db/008_sa4_seed.sql` | SA-4 seed data (test cases AO-2026-000201, AO-2026-000202 at N-3) |

### Tests
| File | Tools Tested | Assertions |
|------|-------------|------------|
| `tests/test_sa3_tools.py` | All 5 SA-3 tools | 31/31 passing |
| `tests/test_sa4_tools.py` | All 9 SA-4 tools | ~35 assertions (run after `docker compose up -d --build mcp-sa4`) |

### Docker
| File | Purpose |
|------|---------|
| `docker-compose.yml` | DCE stack (MariaDB + SA-1/SA-2 + SA-3 + SA-4 servers) |
| `Dockerfile` | SA-1/SA-2 MCP server image |
| `Dockerfile.sa3` | SA-3 MCP server image |
| `Dockerfile.sa4` | SA-4 MCP server image (port 8002) |
| `Makefile` | Dev commands (`make up`, `make health`, etc.) |

### Architecture Docs
| File | Content |
|------|---------|
| `docs/DCE_AO_Agentic_Architecture.md` | Full system architecture overview |
| `docs/DCE_AO_Agent_Setup_SA1.md` | SA-1 full spec |
| `docs/DCE_AO_Agent_Setup_SA2.md` | SA-2 full spec |
| `docs/DCE_AO_Agent_Setup_SA3.md` | SA-3 full spec (two-phase HITL, tool signatures, node map) |
| `docs/DCE_AO_Agent_Setup_SA4.md` | SA-4 full spec |
| `docs/DCE_AO_Table_Schemas_SA3.md` | SA-3 DB schema reference |
| `docs/DCE_AO_Table_Schemas_SA4.md` | SA-4 DB schema reference (3 tables, shared table usage, dependency map) |
| `LOCAL_SETUP.md` | Local environment setup guide (prerequisites, install steps, day-to-day commands) |

---

## 7. Bug Fixes Applied

### Bug 1 — `hitl_queue` JSON constraint violation
**File:** `src/mcp_servers/sa3_server.py` line 657
**Function:** `sa3_park_for_hitl`

The `dce_ao_case_state.hitl_queue` column has a `CHECK (json_valid(hitl_queue))` constraint. The original code wrote a raw string (`"HITL-000001"`), violating this constraint.

```python
# BEFORE — causes MariaDB error 4025 (constraint failed):
cursor.execute("UPDATE dce_ao_case_state SET hitl_queue = %s WHERE case_id = %s",
               (hitl_task_id, case_id))

# AFTER — valid JSON array:
cursor.execute("UPDATE dce_ao_case_state SET hitl_queue = %s WHERE case_id = %s",
               (json.dumps([hitl_task_id]), case_id))
```

### Bug 2 — Duplicate primary key on `sa3_complete_node`
**File:** `src/mcp_servers/sa3_server.py` lines 966, 1061, 1210
**Function:** `sa3_complete_node`

`sa3_park_for_hitl` writes a HITL_PENDING node checkpoint with PK `(case_id, node_id, attempt_number)`. When `sa3_complete_node` later ran, it tried to INSERT another checkpoint with the same PK → duplicate key error 1062.

```python
# BEFORE — fails with duplicate key:
cursor.execute("INSERT INTO dce_ao_node_checkpoint ...")

# AFTER — overwrites the HITL_PENDING checkpoint with the final outcome:
cursor.execute("REPLACE INTO dce_ao_node_checkpoint ...")
```
Applied at all three outcome paths: SIGNATURE_APPROVED (line 966), SIGNATURE_REJECTED (line 1061), ESCALATE_COMPLIANCE (line 1210).

> **Note:** `sa3_park_for_hitl` at line 620 still uses INSERT — correct, as it's the first write for that node.

### Bug 3 — MariaDB healthcheck CMD array format (docker-compose.yml)
`CMD` array format in Docker healthcheck does NOT expand shell environment variables like `${DCE_DB_USER:-dce_user}`. Changed to `CMD-SHELL` with the bundled `healthcheck.sh` script (no credentials required):

```yaml
# BEFORE:
test: ["CMD", "mysqladmin", "ping", "-u${DCE_DB_USER:-dce_user}", ...]

# AFTER:
test: ["CMD-SHELL", "healthcheck.sh --connect --innodb_initialized"]
```

---

## 8. Pending Tasks — Next Steps

### 🔴 Immediate — Manual Dify UI Steps (must be done before testing workflows)

These cannot be automated — Dify dataset UUIDs are only generated in the UI.

**Step 1 — Upload Knowledge Bases to Dify**
1. Go to `http://localhost:80` → **Knowledge** → **New Knowledge Base**
2. Upload each file in order:

| Create KB named | Upload this file |
|----------------|-----------------|
| `KB-1 Document Taxonomy (SA1)` | `kb/SA1_KB1_Document_Taxonomy.md` |
| `KB-9 SLA Policy` | `kb/SA1_KB9_SLA_Policy.md` |
| `KB-2 Checklist Rules` | `kb/SA2_KB2_Checklist_Rules.md` |
| `KB-3/KB-12 GTA Reference` | `kb/SA2_KB3_KB12_GTA_Reference.md` |
| `KB-10 Exception Playbook` | `kb/SA2_KB10_Exception_Playbook.md` |
| `KB-5 Signature Verification Guidelines` | `kb/SA3_KB5_Signature_Verification_Guidelines.md` |

**Step 2 — Import SA-3 Workflow**
1. Go to **Studio** → **Import from DSL File**
2. Import `dify/SA3_Signature_Verification_Workflow.yml`
3. Open the imported workflow → find the node named **"KB-5 Signature Verification"** (Knowledge Retrieval node)
4. Click it → Dataset selector → choose **KB-5 Signature Verification Guidelines**
5. Save

**Step 3 — Import/Update SA-1 Workflow**
1. Import `dify/SA1_Intake_Triage_Workflow.yml` (or update existing)
2. Open the two Knowledge Retrieval nodes:
   - **"KB-1 Account Types"** → link to `KB-1 Document Taxonomy (SA1)`
   - **"KB-9 SLA Policy"** → link to `KB-9 SLA Policy`
3. Save

**Step 4 — Import/Update SA-2 Workflow**
1. Import `dify/SA2_Document_Collection_Workflow.yml`
2. Link all SA-2 KB retrieval nodes to their respective KBs
3. Save

**Step 5 — Upload SA-4 Knowledge Bases**
1. Go to **Knowledge** → **New Knowledge Base**
2. Upload in order:

| Create KB named | Upload this file |
|----------------|-----------------|
| `KB-4 Regulatory Requirements` | `kb/SA4_KB4_Regulatory_Requirements.md` |
| `KB-6 DCE Product Reference` | `kb/SA4_KB6_DCE_Product_Reference.md` |

**Step 6 — Import SA-4 Workflow**
1. Import `dify/SA4_KYC_CDD_Workflow.yml` into Dify Studio
2. Open the workflow → find the 3 Knowledge Retrieval nodes:
   - **"KB-4 Regulatory Requirements"** (node 4000000004) → link to `KB-4 Regulatory Requirements`
   - **"KB-3 GTA Reference"** (node 4000000005) → link to existing `KB-3/KB-12 GTA Reference` (created for SA-2)
   - **"KB-6 DCE Product Reference"** (node 4000000006) → link to `KB-6 DCE Product Reference`
3. Save

**Step 7 — Build and Start SA-4 Container**
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
cd "/Users/rangabodavalla/Documents/GIT Repos/DCE_Account_opening"
docker compose up -d --build mcp-sa4
# Verify healthy:
docker ps --format "table {{.Names}}\t{{.Status}}"
curl http://localhost:8002/health
```

**Step 8 — Run SA-4 Tests**
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
docker cp tests/test_sa4_tools.py dce_mcp_sa4:/app/test_sa4_tools.py
docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \
  dce_mcp_sa4 python /app/test_sa4_tools.py
# Expected: all ~35 assertions pass
```

---

### 🟡 End-to-End Integration Test
After all Dify KBs are linked:
1. Trigger SA-1 from Dify with a test case ID
2. Verify case flows: SA-1 → ACTIVE → SA-2 → SA-3 → HITL_PENDING
3. Simulate HITL decision (APPROVE all) → verify: SA-3 RESUME → SIGNATURE_APPROVED → N-3
4. Check DB state after each step

### 🟢 Future (OpenShift Production)
- Update all Dockerfiles to use non-root user: `USER 1001` (OCP security context requirement)
- Review `railway.json` — Railway is no longer the production target
- Update `DEPLOY.md` with OCP deployment steps
- Replace `host.docker.internal` with proper OCP service mesh URLs

---

## 9. Critical Gotchas & Known Issues

### Docker PATH on macOS with Colima
System PATH may not include Colima's Docker binary. Always prefix or export:
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
```
The `Makefile` handles this internally for `make` commands. But standalone `docker` commands in terminal need the export.

### `host.docker.internal` is macOS-only
This hostname resolves to the Mac host from inside Docker containers. Works with both Docker Desktop and Colima on macOS.
On Linux (or OCP), use the actual service mesh address or host IP instead.

### SA-4 Workflow Type: WF not AG
The SA-4 spec mentions "Dify Agent (AG) type" but SA-4 is implemented as a **Workflow (WF) type** — same as SA-3. The WF type supports deterministic HITL parking (phase 1 ends at END node, phase 2 resumes via mode=RESUME input). The AG type does not provide this control. Do not change to AG type.

### SA-4 Dify Workflow — 3 KB Dataset IDs Must Be Linked Manually
After importing `dify/SA4_KYC_CDD_Workflow.yml`, three Knowledge Retrieval nodes have `dataset_ids: []` and must be linked manually: KB-4 (node 4000000004), KB-3 (node 4000000005, reuse existing SA-2 KB), KB-6 (node 4000000006).

### SA-4 POTENTIAL_MATCH vs HIT_CONFIRMED
- **POTENTIAL_MATCH** — does NOT trigger hard stop. Agent parks it in the brief, proceeds to compilation. RM adjudicates during HITL.
- **HIT_CONFIRMED** — triggers immediate `sa4_escalate_sanctions_hit`. Case goes ESCALATED. No brief compiled, no HITL task created.
In local dev, "Liu Zhiwei" (in `_SANCTIONS_WATCHLIST`) produces POTENTIAL_MATCH — used in test case AO-2026-000202.

### SA-3 Dify Workflow — KB-5 Dataset Must Be Linked Manually
The `dataset_ids: []` in `SA3_Signature_Verification_Workflow.yml` node `3000000004` is intentionally empty — Dify KB UUIDs are only known after creation in the UI. If KB-5 is not linked, the knowledge retrieval step silently returns nothing.

### SA-1 Dify Workflow — KB Placeholder IDs
The SA-1 YAML has literal placeholder strings `__REPLACE_WITH_KB1_DATASET_ID__` and `__REPLACE_WITH_KB9_DATASET_ID__`. These are in Knowledge Retrieval nodes. They MUST be replaced in the Dify UI after import. The placeholders cause silent failures, not explicit errors.

### SA-3 Two-Phase HITL — How It Works
SA-3 workflow takes a `mode` input parameter:
- **`TRIGGER`** — Phase 1: runs signature analysis, creates HITL task, parks the case. Workflow ends at `END: HITL_PENDING`.
- **`RESUME`** — Phase 2: called by Spring Boot resume endpoint with the COO Desk Support decisions. Stores approved specimens, writes final outcome, advances to N-3.

The Spring Boot resume endpoint must pass `mode=RESUME`, `hitl_task_id`, and the full `decisions` array.

### MariaDB DATETIME Format
MariaDB DATETIME columns do NOT accept ISO 8601 with timezone offset (e.g. `2026-03-07T10:00:00+08:00`).
Use space-separated format: `2026-03-07 10:00:00`

### Running SA-3 Tests
Tests run inside the `dce_mcp_sa3` Docker container (which has Python 3.11 and all dependencies). Do NOT run them with system Python.
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
docker cp tests/test_sa3_tools.py dce_mcp_sa3:/app/test_sa3_tools.py
docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \
  dce_mcp_sa3 python /app/test_sa3_tools.py
```

### `sa3_store_approved_specimens` Field Names
This tool expects each signatory dict to have:
- `source_doc_id` ← singular string (NOT `source_doc_ids` plural list)
- `mongodb_specimen_ref` ← GridFS reference string
- `approving_officer_id`

### Colima Auto-Start
Colima is set to auto-start: `brew services start colima`. After a Mac restart, Colima and both Docker Compose stacks should auto-restart.
If they don't:
```bash
colima start
cd ~/dify/docker && docker compose up -d
cd "/Users/rangabodavalla/Documents/GIT Repos/DCE_Account_opening" && docker compose up -d
```

### Dify Stack vs DCE Stack
These are two separate `docker compose` projects:
- **DCE stack:** `docker-compose.yml` at project root — containers: `dce_mariadb`, `dce_mcp_sa1_sa2`, `dce_mcp_sa3`
- **Dify stack:** `~/dify/docker/docker-compose.yml` — containers: `docker-nginx-1`, `docker-api-1`, etc.

`make` commands only manage the DCE stack. To manage Dify: `cd ~/dify/docker && docker compose ...`

---

## 10. Quick Command Reference

### DCE Stack
```bash
make up           # Start all DCE containers (builds if needed)
make down         # Stop all DCE containers
make restart      # Rebuild images + restart (preserves DB data)
make reset        # Wipe DB + rebuild + restart (fresh start)
make ps           # Show container status
make health       # Check MCP server health endpoints
make db-shell     # Open MariaDB shell
make db-status    # Show table row counts
make logs         # Tail all DCE logs
make logs-sa3     # Tail SA-3 MCP server logs
make inspect-sa3  # Open MCP Inspector at localhost:5173 for SA-3 tools
make logs-sa4     # Tail SA-4 MCP server logs (if added to Makefile)
```

### SA-3 Tests
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
docker cp tests/test_sa3_tools.py dce_mcp_sa3:/app/test_sa3_tools.py
docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \
  dce_mcp_sa3 python /app/test_sa3_tools.py
```

### SA-4 Tests
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
docker cp tests/test_sa4_tools.py dce_mcp_sa4:/app/test_sa4_tools.py
docker exec -e DCE_DB_HOST=db -e DCE_DB_PORT=3306 -e PYTHONPATH=/app/src/mcp_servers \
  dce_mcp_sa4 python /app/test_sa4_tools.py
```

### Dify Stack
```bash
cd ~/dify/docker
docker compose up -d      # Start Dify
docker compose down       # Stop Dify
docker compose ps         # Status
docker compose logs -f    # Tail logs
```

### Health Checks
```bash
curl http://localhost:8000/health   # SA-1/SA-2 MCP
curl http://localhost:8001/health   # SA-3 MCP
curl http://localhost:8002/health   # SA-4 MCP
# Dify: open http://localhost:80 in browser
```

### DB Quick Access
```bash
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
docker exec -it dce_mariadb mariadb -u dce_user -pdce_password_local dce_account_opening
```

---

## 11. Resuming a Session

When resuming development, read these files first to get full context:

1. **`HANDOFF.md`** (this file) — current status and pending tasks
2. **`docs/DCE_AO_Agent_Setup_SA3.md`** — SA-3 full spec (two-phase flow, tool signatures, node map)
3. **`src/mcp_servers/sa3_server.py`** — SA-3 MCP implementation (5 tools, bug fixes applied)
4. **`dify/SA3_Signature_Verification_Workflow.yml`** — SA-3 Dify workflow (23 nodes)
5. **`docker-compose.yml`** — DCE stack definition

For SA-5 development, additionally read:
- `docs/DCE_AO_Agent_Setup_SA4.md` — SA-4 pattern (two-phase HITL, WF type)
- `docs/DCE_AO_Table_Schemas_SA4.md` — SA-4 tables (especially `dce_ao_rm_kyc_decision` — SA-5 reads this)
- `src/mcp_servers/sa4_server.py` — SA-4 MCP server (follow same patterns for SA-5)

### Environment Quick-Start After Mac Restart
```bash
# 1. Start Colima (if not auto-started)
colima start

# 2. Start DCE stack
export PATH="$HOME/.docker/bin:$PATH:/usr/local/bin:/opt/homebrew/bin"
cd "/Users/rangabodavalla/Documents/GIT Repos/DCE_Account_opening"
docker compose up -d

# 3. Start Dify
cd ~/dify/docker && docker compose up -d

# 4. Verify all healthy
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected: `dce_mariadb`, `dce_mcp_sa1_sa2`, `dce_mcp_sa3`, `dce_mcp_sa4` all show `(healthy)`. Dify containers show `Up`.

---

*To update this document: edit `HANDOFF.md` at the project root after completing significant work. Include date, what was done, any new bugs fixed, and updated pending tasks.*
