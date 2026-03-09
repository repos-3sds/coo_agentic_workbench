# DCE Account Opening — Domain Orchestrator Setup Guide

| Field | Value |
|---|---|
| **Component** | Domain Orchestrator |
| **Role** | Stateless Pipeline Router — drives cases through N-0 -> N-6 -> DONE |
| **Dify Type** | Workflow (WF) — Operational (no LLM, no KB) |
| **LLM** | None — routing is purely deterministic |
| **Total MCP Tools** | 6 |
| **Pipeline Nodes** | 7 (N-0 through N-6, linear) |
| **HITL Nodes** | 4 (N-2, N-3, N-4, N-5) — auto-resolved in test mode |
| **MCP Server Port** | 8006 |
| **Docker Container** | `dce_mcp_orchestrator` |
| **Depends On** | All 7 sub-agent MCP servers + MariaDB |

---

## 1. Orchestrator Purpose

The Domain Orchestrator is the **master controller** of the DCE Account Opening pipeline. It is a stateless router that:

1. Reads case state from the database to determine the next node
2. Executes that node's complete tool chain by calling sub-agent MCP tools
3. Handles HITL gates (auto-resolves in test mode, parks in production)
4. Repeats until the pipeline reaches DONE, DEAD, or HITL_PENDING

The Orchestrator does NOT contain any LLM calls or knowledge base lookups. All intelligence resides in the sub-agents. The Orchestrator's job is purely operational: routing, sequencing, and state management.

---

## 2. Architecture

```
                        Domain Orchestrator (Port 8006)
                        ==============================
                              |
         Calls sub-agent MCP tools via HTTP JSON-RPC 2.0
                              |
    +----------+----------+----------+----------+----------+----------+
    |          |          |          |          |          |          |
  N-0        N-1        N-2        N-3        N-4        N-5        N-6
  SA-1       SA-2       SA-3       SA-4       SA-5       SA-6       SA-7
  :8000      :8000      :8001      :8002      :8003      :8004      :8005
  Intake     DocColl    Signature  KYC/CDD    Credit     Config     Notify
                        [HITL]     [HITL]     [HITL]     [HITL]     [DONE]
```

### Port Map

| Node | Sub-Agent | Port | Docker Container |
|------|-----------|------|------------------|
| N-0 | SA-1 (Case Intake) | 8000 | `dce_mcp_sa1_sa2` |
| N-1 | SA-2 (Document Collection) | 8000 | `dce_mcp_sa1_sa2` (shared) |
| N-2 | SA-3 (Signature Verification) | 8001 | `dce_mcp_sa3` |
| N-3 | SA-4 (KYC/CDD Preparation) | 8002 | `dce_mcp_sa4` |
| N-4 | SA-5 (Credit Preparation) | 8003 | `dce_mcp_sa5` |
| N-5 | SA-6 (Static Configuration) | 8004 | `dce_mcp_sa6` |
| N-6 | SA-7 (Notification Agent) | 8005 | `dce_mcp_sa7` |

### Host Resolution

| Mode | How | When |
|------|-----|------|
| **Docker** (`MCP_HOST_MODE=docker`) | Container names (e.g., `dce_mcp_sa1_sa2`) | Running inside Docker Compose |
| **Local** (default) | `127.0.0.1` with per-node port | Running directly on host |

---

## 3. MCP Tools (6 tools)

### Tool 1: `orch_get_pipeline_status`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string) |
| **Purpose** | Read case state, checkpoints, completion registry, determine next node |
| **DB Reads** | `dce_ao_case_state`, `dce_ao_node_checkpoint`, `dce_ao_event_log` |
| **Returns** | pipeline_status, current_node, completed_nodes, next_node, hitl_pending, checkpoint_count, event_count, completion_registry |

**Return Example:**
```json
{
  "status": "ok",
  "case_id": "AO-2026-000504",
  "pipeline_status": "ACTIVE",
  "current_node": "N-2",
  "completed_nodes": ["N-0", "N-1"],
  "next_node": "N-2",
  "hitl_pending": false,
  "completion_registry": "N-0 | COMPLETE\nN-1 | COMPLETE\nN-2 | PENDING\n...",
  "checkpoint_count": 2,
  "event_count": 8
}
```

**Pipeline Status Values:**
- `NEW_CASE` — No case_state row exists yet (fresh submission)
- `ACTIVE` — Case is being processed
- `HITL_PENDING` — Waiting for human decision
- `DONE` — Pipeline complete
- `DEAD` — Pipeline terminated (KYC declined, credit declined)
- `ESCALATED` — Sanctions hit or compliance escalation

---

### Tool 2: `orch_execute_node`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string), `node_id` (string: N-0 through N-6), `auto_hitl` (boolean, default: true) |
| **Purpose** | Execute a single node's complete tool chain by calling sub-agent MCP tools |
| **Returns** | node_id, outcome, next_node, tools_called[], duration_seconds, case_id |

**Node Recipes (7 recipes, one per node):**

| Node | Tools Called (in order) | HITL? |
|------|------------------------|-------|
| **N-0** | `sa1_create_case_full` -> `sa1_stage_documents_batch` -> `sa1_notify_stakeholders` -> `sa1_complete_node` | No |
| **N-1** | `sa2_get_document_checklist` -> `sa2_extract_document_metadata` -> `sa2_validate_document_expiry` -> `sa2_save_completeness_assessment` -> `sa2_complete_node` | No |
| **N-2** | **Phase 1:** `sa3_get_case_context` -> `sa3_run_signature_analysis_batch` -> `sa3_park_for_hitl` **Phase 2:** `sa3_get_case_context(PHASE2)` -> `sa3_store_approved_specimens` -> `sa3_complete_node` | **YES** |
| **N-3** | **Phase 1:** `sa4_get_case_context` -> `sa4_extract_entity_structure` -> `sa4_run_screening_batch` -> `sa4_compile_and_submit_kyc_brief` -> `sa4_park_for_hitl` **Phase 2:** `sa4_get_case_context(PHASE2)` -> `sa4_capture_rm_decisions` -> `sa4_complete_node` | **YES** |
| **N-4** | **Phase 1:** `sa5_get_case_context` -> `sa5_extract_financial_data` -> `sa5_compile_credit_brief` -> `sa5_park_for_credit_review` **Phase 2:** `sa5_get_case_context(PHASE2)` -> `sa5_capture_credit_decisions` -> `sa5_complete_node` | **YES** |
| **N-5** | **Phase 1:** `sa6_get_case_context` -> `sa6_build_config_spec` -> `sa6_generate_tmo_instruction` -> `sa6_park_for_tmo_execution` **Phase 2:** `sa6_get_case_context(PHASE2)` -> `sa6_validate_system_config` -> `sa6_complete_node` | **YES** |
| **N-6** | `sa7_get_case_context` -> `sa7_generate_welcome_kit` -> `sa7_send_welcome_kit_batch` -> `sa7_complete_case` | No |

---

### Tool 3: `orch_advance_pipeline`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string), `auto_hitl` (boolean, default: true) |
| **Purpose** | Auto-determine next node from pipeline status, then execute it |
| **Logic** | 1. Get pipeline status -> 2. Determine next_node -> 3. Execute node -> 4. Return result |
| **Returns** | Same as orch_execute_node + pipeline progress |

---

### Tool 4: `orch_run_full_pipeline`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string), `auto_hitl` (boolean, default: true) |
| **Purpose** | Run entire pipeline from current position to DONE (or HITL stop) |
| **Logic** | Loop calling orch_advance_pipeline until DONE, DEAD, or HITL_PENDING |
| **Returns** | final_status, nodes_executed[], total_duration_seconds, tools_called_total, hitl_auto_resolved |

**Return Example (E2E success):**
```json
{
  "status": "ok",
  "case_id": "AO-2026-000504",
  "final_status": "DONE",
  "nodes_executed": ["N-0", "N-1", "N-2", "N-3", "N-4", "N-5", "N-6"],
  "total_duration_seconds": 0.25,
  "tools_called_total": 43,
  "hitl_auto_resolved": 4
}
```

---

### Tool 5: `orch_get_completion_registry`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string) |
| **Purpose** | Build formatted completion registry text |
| **Returns** | Structured text showing COMPLETE / ACTIVE / PENDING for each node |

---

### Tool 6: `orch_reset_test_case`

| Field | Value |
|---|---|
| **Parameters** | `case_id` (string) |
| **Purpose** | Reset a test case to initial state for re-testing |
| **Guard** | Only works for case IDs matching test ranges (AO-2026-0005*, AO-2026-0006*, AO-2026-0007*) |
| **Deletes From** | case_state, node_checkpoint, event_log, classification_result, document_staged, document_ocr_result, signature_verification, signature_specimen, kyc_brief, screening_result, rm_kyc_decision, credit_brief, financial_extract, credit_decision, config_spec, tmo_instruction, system_validation, welcome_kit, notification_log, hitl_review_task |
| **Returns** | Tables cleaned count, total rows deleted |

---

## 4. Happy-Path Auto-HITL Decisions

When `auto_hitl=True`, the orchestrator automatically resolves HITL gates with pre-configured happy-path decisions:

| Node | HITL Gate | Auto-Decision |
|------|-----------|---------------|
| **N-2** (SA-3) | Signature Review | SIGNATURE_APPROVED — all signatories verified, specimens stored |
| **N-3** (SA-4) | RM KYC Review | RM_DECISION_CAPTURED — risk_rating=MEDIUM, cdd_level=STANDARD, caa=IRB, limit=5M SGD |
| **N-4** (SA-5) | Credit Review | CREDIT_APPROVED — grade=B, limit=5M SGD, IRB approach, standard conditions |
| **N-5** (SA-6) | TMO Execution | TMO_VALIDATED — all 3 systems PASS (UBIX/SIC/CV) |

These decisions are hardcoded as `HAPPY_PATH_DECISIONS` in orchestrator_server.py and are used exclusively for E2E testing.

---

## 5. Database Tables

### Tables Orchestrator Reads

| Table | Purpose |
|---|---|
| `dce_ao_case_state` | Current pipeline status, current_node, completed_nodes |
| `dce_ao_node_checkpoint` | Per-node completion status (derives completed_nodes) |
| `dce_ao_event_log` | Event count for status reporting |
| `dce_ao_submission_raw` | Raw submission data for N-0 case creation |

### Tables Orchestrator Writes

The orchestrator itself does NOT write to any tables. All writes are performed by the sub-agent MCP tools it calls. The orchestrator is a pure router.

---

## 6. Seed Data

### Test Case: AO-2026-000601

```sql
-- db/015_orchestrator_seed.sql
-- Fresh submission for E2E pipeline test
INSERT INTO dce_ao_submission_raw (
    submission_id, case_id, submission_source, email_message_id,
    sender_email, email_subject, email_body_text,
    rm_employee_id, received_at, processing_status,
    attachments_count, raw_payload_hash
) VALUES (
    601,
    NULL,  -- case_id is NULL until SA-1 creates the case
    'EMAIL',
    'MSG-ORCH-E2E-001@absbank.com',
    'ranga.bodavalla@absbank.com',
    'New Account Opening Request - Horizon Capital Markets Pte Ltd',
    '...',
    'RM-001',
    '2026-03-09 09:00:00',
    'RECEIVED',
    5,
    SHA2('orch-e2e-test-case-601-horizon-capital', 256)
);
```

---

## 7. Infrastructure & Deployment

### Docker Compose Service

```yaml
mcp-orchestrator:
  build:
    context: .
    dockerfile: Dockerfile.orchestrator
  container_name: dce_mcp_orchestrator
  restart: unless-stopped
  env_file: .env
  environment:
    DCE_DB_HOST: db
    DCE_DB_PORT: 3306
    PORT: 8006
    MCP_TRANSPORT: streamable-http
    MCP_HOST_MODE: docker    # Use container names for MCP calls
  ports:
    - "8006:8006"
  depends_on:
    db:
      condition: service_healthy
    mcp-sa1-sa2:
      condition: service_healthy
    mcp-sa3:
      condition: service_healthy
    mcp-sa4:
      condition: service_healthy
    mcp-sa5:
      condition: service_healthy
    mcp-sa6:
      condition: service_healthy
    mcp-sa7:
      condition: service_healthy
```

### Startup & Verification

```bash
# Build and start all services (orchestrator starts last due to dependencies)
docker compose up -d --build

# Health check
curl http://localhost:8006/health
# -> {"status": "ok", "service": "dce-orchestrator", "port": 8006}

# Verify all sub-agents are healthy
for port in 8000 8001 8002 8003 8004 8005 8006; do
  echo "Port $port: $(curl -s http://localhost:$port/health | python3 -c 'import sys,json; print(json.load(sys.stdin)["status"])')"
done
# All should return "ok"
```

### Run E2E Tests

```bash
# From host
python tests/test_orchestrator.py

# From container
docker exec dce_mcp_orchestrator python /app/tests/test_orchestrator.py

# Expected: 30/30 tests passed
# E2E pipeline: 43 tools called, 4 HITL auto-resolved, ~0.25s
```

---

## 8. Dify Workflow

### Workflow YAML

File: `dify/Orchestrator_Workflow.yml`

### Workflow Nodes (7)

```
START (case_id)
  -> Reset Test Case (orch_reset_test_case)
  -> Run Full Pipeline (orch_run_full_pipeline, auto_hitl=True)
  -> Pipeline DONE? (if/else on final_status)
  -> Get Completion Registry (orch_get_completion_registry)
  -> END_SUCCESS / END_INCOMPLETE
```

### Dify Configuration

| Setting | Value |
|---|---|
| **MCP Endpoint** | `http://host.docker.internal:8006` (from Dify containers) |
| **Input Variables** | `case_id` (string) |
| **No LLM Nodes** | Orchestrator is purely operational |
| **No KB Nodes** | No knowledge base lookups |

### Import & Test in Dify

```bash
# 1. Start CORS server for import
python3 -c "
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
os.chdir('dify')
class CORS(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()
HTTPServer(('', 9877), CORS).serve_forever()
" &

# 2. Import via browser console (at http://localhost/apps):
# fetch('http://localhost:9877/Orchestrator_Workflow.yml')
#   .then(r => r.text())
#   .then(yml => fetch('/console/api/apps/imports', {
#     method: 'POST', headers: {'Content-Type':'application/json'},
#     body: JSON.stringify({data: yml, mode: 'yaml-workflow'})
#   })).then(r => r.json()).then(console.log)

# 3. Test: case_id = "AO-2026-000601"
# Expected: DONE, all 7 nodes COMPLETE
```

---

## 9. E2E Verification Checklist

After a successful full pipeline run, verify in the database:

```sql
-- 1. Case status = DONE
SELECT case_id, status, current_node FROM dce_ao_case_state
WHERE case_id LIKE 'AO-2026-0005%';

-- 2. All 7 checkpoints COMPLETE
SELECT node_id, status, next_node FROM dce_ao_node_checkpoint
WHERE case_id = '<case_id>' ORDER BY node_id;

-- 3. Welcome kit generated
SELECT kit_id, entity_name, status FROM dce_ao_welcome_kit
WHERE case_id = '<case_id>';

-- 4. All 4 HITL tasks DECIDED
SELECT task_id, node_id, task_type, status FROM dce_ao_hitl_review_task
WHERE case_id = '<case_id>';

-- 5. Event log includes CASE_COMPLETED
SELECT event_type, node_id FROM dce_ao_event_log
WHERE case_id = '<case_id>' ORDER BY created_at;

-- 6. Notification log
SELECT notification_type, channel, recipient_role FROM dce_ao_notification_log
WHERE case_id = '<case_id>';
```

### Expected Results

| Check | Expected |
|-------|----------|
| Case status | DONE |
| Checkpoints | 7 rows, all COMPLETE (N-0 through N-6) |
| Welcome kit | 1 row, status GENERATED or SENT |
| HITL tasks | 4 rows (SIGNATURE_REVIEW, KYC_CDD_REVIEW, CREDIT_REVIEW, TMO_STATIC_REVIEW), all DECIDED |
| Events | 20+ rows including 7 NODE_COMPLETED + 1 CASE_COMPLETED |
| Notifications | 1+ rows (welcome kit batch) |

---

## 10. Error Handling

| Failure Point | Handling |
|---|---|
| Sub-agent MCP server unreachable | HTTP timeout after 300s; error returned with node_id and server details |
| Sub-agent tool returns error | Error propagated up; pipeline stops at failed node |
| Invalid case_id | Error returned: "Case not found" |
| Unknown node_id | Error returned: "Unknown node" |
| Pipeline already DONE | Returns: "Pipeline already complete" |
| Pipeline DEAD | Returns: "Pipeline terminated" |
| Reset guard violation | Error: "Reset only allowed for test case ranges" |

---

## 11. Configuration Summary

| Parameter | Value |
|---|---|
| **Server Type** | FastMCP (Streamable HTTP) |
| **Port** | 8006 |
| **Health Endpoint** | GET /health |
| **MCP Endpoint** | POST /mcp |
| **Transport** | StreamableHTTP (JSON-RPC 2.0 with SSE responses) |
| **LLM** | None |
| **Knowledge Bases** | None |
| **Pipeline** | Linear: N-0 -> N-1 -> N-2 -> N-3 -> N-4 -> N-5 -> N-6 -> DONE |
| **HITL Nodes** | N-2, N-3, N-4, N-5 (auto_hitl for testing) |
| **Sub-agent Calls** | 43 MCP tool calls for full E2E pipeline |
| **E2E Duration** | ~0.25 seconds (all sub-agents healthy) |
| **Test Suite** | tests/test_orchestrator.py (30/30 assertions) |
| **Dify Workflow** | dify/Orchestrator_Workflow.yml |
