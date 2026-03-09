# DCE Account Opening — Agent Setup: SA-6 Static Configuration

| Field | Value |
|---|---|
| **Agent ID** | SA-6 |
| **DAG Node** | N-5 |
| **Agent Name** | Static Configuration Agent |
| **Dify Type** | Workflow (WF) — Two-Phase Execution with HITL Pause |
| **LLM Primary** | Claude Sonnet 4.6 (TMO instruction document generation) |
| **LLM Secondary** | None — configuration spec build and validation are deterministic |
| **Total Skills** | 6 |
| **SLA Window** | 2 hours (agent processing) + 1 business day TMO execution (URGENT) / 3 business days (STANDARD) |
| **Max Retries** | 1 (if TMO validation finds discrepancies — returned to TMO team with specific failures) |
| **HITL Required** | **YES** — TMO Static team must execute system configurations in UBIX/SIC/CV and confirm |
| **Trigger** | HTTP Request from DCE Orchestrator on `CREDIT_APPROVED` event |
| **Upstream** | N-4 (SA-5 Credit Preparation) |
| **Downstream** | N-6 (SA-7 Notification Agent) — triggered on `TMO_VALIDATED` |
| **HITL Actor** | TMO Static Team (Agentic Workbench — TMO View) |
| **MCP Server Port** | 8004 |
| **Docker Container** | `dce_mcp_sa6` |

---

## 1. Agent Purpose

SA-6 is the **system configuration preparation engine** that translates approved credit decisions into concrete system setup instructions for the three core trading platforms: UBIX (entity/product permissions), SIC (commissions/limits), and CV (margin/settlement). It operates in two phases separated by a mandatory human-in-the-loop pause.

**Phase 1 — Pre-HITL (Automated):** Retrieves credit decisions from SA-5 and case context. Builds a complete configuration specification covering all three systems (UBIX entity setup, SIC commission rates and credit limits, CV margin parameters and settlement types). Generates a structured TMO instruction document with step-by-step setup instructions per system. Posts instructions to the TMO Static team's workbench queue and parks for execution.

**Phase 2 — Post-HITL (Human-Resumed):** After TMO Static team executes the configurations in the live systems, the workflow resumes. SA-6 performs automated validation by reading back configured values from each system and comparing against the specification. All three systems must pass validation (UBIX, SIC, CV). Discrepancies trigger escalation back to TMO Static for correction.

---

## 2. Dify Workflow Canvas — Node Map

```
============== PHASE 1 -- PRE-HITL (AUTOMATED) ================

[START: Trigger from DCE Orchestrator]
  |  Input: {case_id, mode: "TRIGGER"}
  |
  v
[CODE: Get Case Context (Phase 1)]                           <- Node 1
  |  MCP Tool: sa6_get_case_context(case_id, phase="PHASE1")
  |  Reads: case_state, credit_decisions, N-4 output,
  |         classification, extracted data, authorised traders
  |  Output: {context, credit_decisions, products, traders}
  |
  v
[CODE: Build Configuration Specification]                     <- Node 2
  |  MCP Tool: sa6_build_config_spec
  |  Generate three-system config spec:
  |    UBIX: entity_name, jurisdiction, LEI, product_permissions[]
  |    SIC:  account_mapping, commission_rates, credit_limits
  |    CV:   contract_mapping, margin_rates, settlement_types
  |  + Authorised trader list with trading permissions
  |  DB Write: INSERT dce_ao_config_spec (status=DRAFT)
  |  Output: {spec_id, ubix_config, sic_config, cv_config}
  |
  v
[LLM: Generate TMO Instruction Document]                     <- Node 3
  |  MCP Tool: sa6_generate_tmo_instruction
  |  Build step-by-step instruction document:
  |    Section 1: UBIX Instructions (entity setup, product enable)
  |    Section 2: SIC Instructions (account, commissions, limits)
  |    Section 3: CV Instructions (contract, margin, settlement)
  |    Section 4: Trader Setup (per-trader CQG access)
  |    Section 5: Validation Checklist (expected values per system)
  |  DB Write: INSERT dce_ao_tmo_instruction (status=GENERATED)
  |  UPDATE dce_ao_config_spec (status=INSTRUCTION_GENERATED)
  |  Output: {instruction_id, instruction_url}
  |
  v
[CODE: Park for TMO Execution]                               <- Node 4
  |  MCP Tool: sa6_park_for_tmo_execution
  |  INSERT dce_ao_hitl_review_task (TMO_STATIC_REVIEW, TMO_STATIC)
  |  INSERT dce_ao_node_checkpoint (HITL_PENDING)
  |  UPDATE dce_ao_case_state (status=HITL_PENDING)
  |  INSERT dce_ao_event_log (TMO_INSTRUCTION_SENT)
  |  UPDATE dce_ao_tmo_instruction (status=SENT_TO_TMO)
  |  Output: {hitl_task_id, instruction_url}
  |
  v
[END: HITL_PENDING]                                           <- Node 5
  Return: {status: "TMO_PENDING", hitl_task_id, instruction_url}

====================================================================
  --  EXECUTION PARKS HERE                                        --
  --  TMO Static team executes configurations in UBIX/SIC/CV     --
  --  TMO Static confirms completion in Workbench                --
====================================================================

============== PHASE 2 -- POST-HITL (RESUMED) ==================

[START: Resume — TMO Execution Complete]                      <- Node 6
  |  Input: {case_id, mode: "RESUME", hitl_task_id}
  |
  v
[CODE: Get Case Context (Phase 2)]                            <- Node 7
  |  MCP Tool: sa6_get_case_context(case_id, phase="PHASE2")
  |  Reads: config_spec, tmo_instruction + Phase 1 context
  |
  v
[CODE: Validate System Configuration]                         <- Node 8
  |  MCP Tool: sa6_validate_system_config
  |  Read-back validation per system:
  |    UBIX: entity_exists, products_enabled, permissions_correct
  |    SIC:  account_exists, commission_rates_match, limits_set
  |    CV:   contract_exists, margin_rates_match, settlement_correct
  |  DB Write: INSERT dce_ao_system_validation (1 row per system)
  |  UPDATE dce_ao_config_spec (status=TMO_VALIDATED/TMO_DISCREPANCY_FOUND)
  |  Output: {overall_status, per_system_results, discrepancies}
  |
  v
[IF/ELSE: All Systems Pass?]                                  <- Node 9
  |
  +-- TMO_DISCREPANCY_FOUND
  |     Flag specific systems + fields that failed
  |     Return to TMO workbench with discrepancy report
  |     [END: TMO_DISCREPANCY_FOUND]
  |
  +-- TMO_VALIDATED (all 3 systems PASS)
  |
  v
[CODE: Complete Node]                                         <- Node 10
  |  MCP Tool: sa6_complete_node(outcome=TMO_VALIDATED)
  |  REPLACE INTO dce_ao_node_checkpoint (N-5, COMPLETE)
  |  UPDATE dce_ao_case_state (current_node=N-6, status=ACTIVE)
  |  UPDATE dce_ao_tmo_instruction (status=TMO_COMPLETED)
  |  INSERT dce_ao_event_log (NODE_COMPLETED + TMO_CONFIG_COMPLETE)
  |  UPDATE dce_ao_hitl_review_task (status=DECIDED)
  |
  v
[END: Return N5Output JSON]                                   <- Node 11
```

---

## 3. MCP Tools

| # | Tool Name | DB Tables Written | Purpose |
|---|---|---|---|
| 1 | `sa6_get_case_context` | READ: `dce_ao_case_state`, `dce_ao_credit_decision`, `dce_ao_node_checkpoint`, `dce_ao_classification_result`, `dce_ao_document_ocr_result`, `dce_ao_rm_hierarchy`, `dce_ao_config_spec` (Phase 2), `dce_ao_tmo_instruction` (Phase 2) | Fetches complete case context including credit decisions, authorised traders, product info. Phase 2 adds config spec and TMO instruction data. |
| 2 | `sa6_build_config_spec` | INSERT: `dce_ao_config_spec` (status=DRAFT) | Builds three-system configuration specification: UBIX (entity/products), SIC (commissions/limits), CV (margin/settlement). Includes authorised trader list. |
| 3 | `sa6_generate_tmo_instruction` | INSERT: `dce_ao_tmo_instruction` (status=GENERATED); UPDATE: `dce_ao_config_spec` (status=INSTRUCTION_GENERATED) | Generates step-by-step TMO instruction document with per-system setup steps, trader setup, and validation checklist. |
| 4 | `sa6_park_for_tmo_execution` | INSERT: `dce_ao_hitl_review_task`, `dce_ao_node_checkpoint`, `dce_ao_event_log`; UPDATE: `dce_ao_case_state`, `dce_ao_tmo_instruction` | Atomic HITL parking: creates TMO_STATIC_REVIEW task, writes HITL_PENDING checkpoint, marks instruction as SENT_TO_TMO. |
| 5 | `sa6_validate_system_config` | INSERT: `dce_ao_system_validation` (1 row per system: UBIX, SIC, CV); UPDATE: `dce_ao_config_spec` | Automated read-back validation against config spec. Checks each system (fields_checked, fields_passed, fields_failed, discrepancies). Returns overall PASS/FAIL. |
| 6 | `sa6_complete_node` | REPLACE INTO: `dce_ao_node_checkpoint`; UPDATE: `dce_ao_case_state`, `dce_ao_tmo_instruction`; INSERT: `dce_ao_event_log`; UPDATE: `dce_ao_hitl_review_task` | Mandatory checkpoint writer. On TMO_VALIDATED: advances to N-6. On TMO_DISCREPANCY_FOUND: marks node FAILED. |

---

## 4. Database Tables — Read/Write Map

### Tables SA-6 Writes (creates)

| Table | Operation | When |
|---|---|---|
| `dce_ao_config_spec` | INSERT (DRAFT) + UPDATE (status changes) | After spec build (Phase 1) + after validation (Phase 2) |
| `dce_ao_tmo_instruction` | INSERT (GENERATED) + UPDATE (status) | After instruction generation (Phase 1) + on completion (Phase 2) |
| `dce_ao_system_validation` | INSERT (1 row per system) | After TMO execution validation (Phase 2) |
| `dce_ao_hitl_review_task` | INSERT + UPDATE | When parking for HITL (Phase 1) + on completion (Phase 2) |
| `dce_ao_node_checkpoint` | INSERT / REPLACE | HITL_PENDING (Phase 1) + COMPLETE or FAILED (Phase 2) |
| `dce_ao_event_log` | INSERT (3-4 rows) | TMO_INSTRUCTION_SENT, NODE_COMPLETED, TMO_CONFIG_COMPLETE |

### Tables SA-6 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context fetch |
| `dce_ao_credit_decision` | SELECT | Credit outcome, approved limits, CAA approach |
| `dce_ao_node_checkpoint` | SELECT | N-4 output |
| `dce_ao_classification_result` | SELECT | Entity type, products, jurisdiction |
| `dce_ao_document_ocr_result` | SELECT | Authorised traders, entity details |
| `dce_ao_rm_hierarchy` | SELECT | RM details |

### New Tables SA-6 Creates

```sql
-- Three-system configuration specification
CREATE TABLE dce_ao_config_spec (
    spec_id                     VARCHAR(30) PRIMARY KEY,
    case_id                     VARCHAR(20) NOT NULL,
    attempt_number              INT DEFAULT 1,
    ubix_config                 JSON,       -- Entity setup, product permissions
    sic_config                  JSON,       -- Commission rates, credit limits
    cv_config                   JSON,       -- Margin parameters, settlement types
    authorised_traders          JSON,       -- Trader list with permissions
    status                      ENUM('DRAFT','INSTRUCTION_GENERATED','TMO_EXECUTED',
                                     'TMO_VALIDATED','TMO_DISCREPANCY_FOUND') DEFAULT 'DRAFT',
    credit_outcome              ENUM('APPROVED','APPROVED_WITH_CONDITIONS') NOT NULL,
    approved_dce_limit_sgd      DECIMAL(15,2) NOT NULL,
    approved_dce_pce_limit_sgd  DECIMAL(15,2) NOT NULL,
    confirmed_caa_approach      ENUM('IRB','SA') NOT NULL,
    products_requested          JSON,
    compiled_by_model           VARCHAR(50),
    kb_chunks_used              JSON,
    compiled_at                 DATETIME DEFAULT NOW(),
    updated_at                  DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_status (status)
);

-- TMO instruction document
CREATE TABLE dce_ao_tmo_instruction (
    instruction_id      VARCHAR(30) PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    spec_id             VARCHAR(30) NOT NULL,
    instruction_document JSON,       -- Step-by-step instructions per system
    instruction_url     VARCHAR(500),
    status              ENUM('GENERATED','SENT_TO_TMO','TMO_EXECUTING',
                             'TMO_COMPLETED','TMO_FAILED') DEFAULT 'GENERATED',
    generated_by_model  VARCHAR(50),
    generated_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (spec_id) REFERENCES dce_ao_config_spec(spec_id),
    UNIQUE KEY idx_spec (spec_id),
    INDEX idx_case (case_id),
    INDEX idx_status (status)
);

-- Per-system validation results (post-TMO execution read-back)
CREATE TABLE dce_ao_system_validation (
    validation_id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id             VARCHAR(20) NOT NULL,
    spec_id             VARCHAR(30) NOT NULL,
    system_name         ENUM('UBIX','SIC','CV') NOT NULL,
    validation_status   ENUM('PASS','FAIL','PARTIAL') NOT NULL,
    fields_checked      INT DEFAULT 0,
    fields_passed       INT DEFAULT 0,
    fields_failed       INT DEFAULT 0,
    discrepancies       JSON,        -- Specific field mismatches
    configured_values   JSON,        -- Read-back values from live system
    validated_at        DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (spec_id) REFERENCES dce_ao_config_spec(spec_id),
    UNIQUE KEY idx_case_system (case_id, spec_id, system_name),
    INDEX idx_case (case_id),
    INDEX idx_status (validation_status)
);
```

---

## 5. Input Format

### Trigger: CREDIT_APPROVED from DCE Orchestrator

```json
{
  "case_id": "AO-2026-000401",
  "mode": "TRIGGER",
  "mcp_endpoint": "http://host.docker.internal:8004"
}
```

### Resume Trigger: TMO Execution Complete

```json
{
  "case_id": "AO-2026-000401",
  "mode": "RESUME",
  "hitl_task_id": "HITL-XXXXXX",
  "mcp_endpoint": "http://host.docker.internal:8004"
}
```

---

## 6. Output Format — N5Output

```json
{
  "case_id": "AO-2026-000401",
  "spec_id": "SPEC-XXXXXX",
  "instruction_id": "TMOI-XXXXXX",
  "validation_status": "TMO_VALIDATED",
  "systems_validated": 3,
  "all_systems_pass": true,
  "per_system_results": {
    "UBIX": {"status": "PASS", "fields_checked": 5, "fields_passed": 5},
    "SIC": {"status": "PASS", "fields_checked": 6, "fields_passed": 6},
    "CV": {"status": "PASS", "fields_checked": 5, "fields_passed": 5}
  },
  "next_node": "N-6",
  "notes": "All 3 systems validated. 16 fields checked, 16 passed."
}
```

---

## 7. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| Case Context Fetch | DB connection / N-4 output missing | Yes | 2 | Alert Operations | Operations (hard block) |
| Config Spec Build | Product mapping error / unknown product | No | — | Flag for manual spec by TMO | TMO Static Manager |
| TMO Instruction Generation | LLM timeout | Yes | 2 | Use structured template with raw spec | TMO Static team |
| TMO Instruction Post | Workbench API failure | Yes | 3 | Email TMO Static manager directly | TMO Static Manager |
| HITL Deadline Breach | TMO no-action > SLA | Yes (reminders) | 3 | SA-7 escalation chain | TMO Static -> TMO Manager -> DCE COO |
| System Validation | Read-back API failure / system down | Yes | 2 | Mark as PARTIAL; flag for manual check | TMO Static + Operations |
| Discrepancy Found | Config mismatch (fields_failed > 0) | No | — | Return to TMO with specific discrepancies | TMO Static team (correction required) |
| Checkpoint Write | MariaDB failure | Yes | 3 | Alert Operations | Operations (hard block) |

---

## 8. Infrastructure & Deployment

### MCP Server

```bash
# Docker Compose (recommended)
docker compose up -d --build mcp-sa6

# Health check
curl http://localhost:8004/health
# -> {"status": "ok", "service": "dce-sa6-static-configuration", "port": 8004}
```

### Docker Compose Service

```yaml
mcp-sa6:
  build:
    context: .
    dockerfile: Dockerfile.sa6
  container_name: dce_mcp_sa6
  restart: unless-stopped
  env_file: .env
  environment:
    DCE_DB_HOST: db
    DCE_DB_PORT: 3306
    PORT: 8004
    MCP_TRANSPORT: streamable-http
  ports:
    - "8004:8004"
  depends_on:
    db:
      condition: service_healthy
```

### Three Target Systems

| System | Full Name | Configuration Scope |
|---|---|---|
| **UBIX** | Universal Banking Integration eXchange | Entity setup, product permissions, jurisdiction registration |
| **SIC** | Securities & Investment Clearing | Commission rates, credit limits, account mapping |
| **CV** | Clearing & Valuation | Margin parameters, settlement types, contract mapping |

---

## 9. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow (WF) — Two-Phase (Pre-HITL + Post-HITL) |
| **Dify App Name** | `DCE-AO-SA6-Static-Configuration` |
| **Primary Model** | claude-sonnet-4-6 |
| **Temperature** | 0.1 |
| **Max Tokens** | 3072 |
| **Knowledge Bases** | None — configuration is derived from credit decisions + product reference |
| **MCP Tools** | sa6_get_case_context, sa6_build_config_spec, sa6_generate_tmo_instruction, sa6_park_for_tmo_execution, sa6_validate_system_config, sa6_complete_node |
| **Max Agent Iterations** | 8 (4 pre-HITL + 4 post-HITL) |
| **HITL Required** | YES — TMO Static Team |
| **Checkpoint** | Mandatory — HITL_PENDING (Phase 1) + COMPLETE / FAILED (Phase 2) |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | TMO_INSTRUCTION_SENT, TMO_CONFIG_COMPLETE, TMO_DISCREPANCY_ESCALATED, NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa6_` |
| **Output Schema** | N5Output |
| **Downstream Triggered** | SA-7 Notification Agent (N-6) on `TMO_VALIDATED` |
