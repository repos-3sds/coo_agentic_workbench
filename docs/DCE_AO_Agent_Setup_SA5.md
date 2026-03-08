# DCE Account Opening — Agent Setup: SA-5 Credit Preparation

| Field | Value |
|---|---|
| **Agent ID** | SA-5 |
| **DAG Node** | N-4 |
| **Agent Name** | Credit Preparation Agent |
| **Dify Type** | Workflow (WF) — Two-Phase Execution with HITL Pause |
| **LLM Primary** | Claude Sonnet 4.6 (credit brief compilation) |
| **LLM Secondary** | None — financial extraction and validation are deterministic |
| **Total Skills** | 6 |
| **SLA Window** | 4 hours (agent processing) + 2 business days Credit Team review (URGENT) / 5 business days (STANDARD) |
| **Max Retries** | 1 (if Credit Team returns incomplete decisions — returned to workbench with missing fields) |
| **HITL Required** | **YES** — Credit Team must review brief and submit credit outcome + approved limits |
| **Trigger** | HTTP Request from DCE Orchestrator on `RM_DECISION_CAPTURED` event |
| **Upstream** | N-3 (SA-4 KYC/CDD Preparation) |
| **Downstream** | N-5 (SA-6 Static Configuration) — triggered on `CREDIT_APPROVED` |
| **HITL Actor** | Credit Team (Agentic Workbench — Credit Review View) |
| **MCP Server Port** | 8003 |
| **Docker Container** | `dce_mcp_sa5` |

---

## 1. Agent Purpose

SA-5 is the **credit assessment preparation engine** that compiles a complete credit brief for the Credit Team, including extracted financial data, RM KYC decisions, and product-specific risk analysis. It operates in two phases separated by a mandatory human-in-the-loop pause.

**Phase 1 — Pre-HITL (Automated):** Retrieves the RM's KYC decisions from SA-4 (risk rating, CDD clearance, CAA approach, recommended limits). Extracts financial data from submitted financial statements (revenue, equity, leverage, liquidity ratios). Compiles a structured credit brief with financial analysis, product risk profiles, comparable benchmarks, and open questions. Posts the brief to the Credit Team's workbench queue and parks for review.

**Phase 2 — Post-HITL (Human-Resumed):** Upon Credit Team submission of decisions (APPROVED / APPROVED_WITH_CONDITIONS / DECLINED), the workflow resumes. Approved decisions store the final credit limits and CAA approach. Declined decisions terminate the case (DEAD). Conditional approvals store the conditions for downstream SA-6/SA-7 tracking.

---

## 2. Dify Workflow Canvas — Node Map

```
============== PHASE 1 -- PRE-HITL (AUTOMATED) ================

[START: Trigger from DCE Orchestrator]
  |  Input: {case_id, mode: "TRIGGER"}
  |
  v
[CODE: Get Case Context (Phase 1)]                           <- Node 1
  |  MCP Tool: sa5_get_case_context(case_id, phase="PHASE1")
  |  Reads: case_state, rm_decisions, classification, N-3 output,
  |         financial doc IDs, extracted data
  |  Output: {context, rm_decisions, financial_doc_ids}
  |
  v
[CODE: Extract Financial Data]                                <- Node 2
  |  MCP Tool: sa5_extract_financial_data
  |  Parse financial statements (simulated in dev)
  |  Calculate: leverage ratio, liquidity ratio, YoY trends
  |  DB Write: INSERT dce_ao_financial_extract (1 row per year/doc)
  |  Output: {financial_summary with multi-year analysis}
  |
  v
[LLM: Compile Credit Brief — Claude Sonnet 4.6]              <- Node 3
  |  MCP Tool: sa5_compile_credit_brief
  |  Assembles complete credit brief:
  |    Section 1: Entity & KYC Summary
  |    Section 2: Financial Analysis (multi-year trends)
  |    Section 3: Product Risk Profile (from KB-6)
  |    Section 4: RM Recommendations (limits, CAA)
  |    Section 5: Comparable Benchmarks
  |    Section 6: Open Questions for Credit Team
  |  DB Write: INSERT dce_ao_credit_brief
  |  Output: {credit_brief_id, brief_url}
  |
  v
[CODE: Park for Credit Review]                                <- Node 4
  |  MCP Tool: sa5_park_for_credit_review
  |  INSERT dce_ao_hitl_review_task (CREDIT_REVIEW, CREDIT_TEAM)
  |  INSERT dce_ao_node_checkpoint (HITL_PENDING)
  |  UPDATE dce_ao_case_state (status=HITL_PENDING)
  |  INSERT dce_ao_event_log (CREDIT_REVIEW_REQUESTED)
  |  Output: {hitl_task_id, case_status: CREDIT_PENDING}
  |
  v
[END: HITL_PENDING]                                           <- Node 5
  Return: {status: "CREDIT_PENDING", hitl_task_id, brief_url}

====================================================================
  --  EXECUTION PARKS HERE                                        --
  --  Credit Team reviews credit brief in Workbench               --
  --  Credit Team submits: APPROVED / DECLINED + limits + CAA     --
====================================================================

============== PHASE 2 -- POST-HITL (RESUMED) ==================

[START: Resume — Credit Decision Received]                    <- Node 6
  |  Input: {case_id, mode: "RESUME", hitl_task_id, credit_decisions{}}
  |
  v
[CODE: Get Case Context (Phase 2)]                            <- Node 7
  |  MCP Tool: sa5_get_case_context(case_id, phase="PHASE2")
  |  Reads: case_state + prior Phase 1 context
  |
  v
[CODE: Validate Credit Decisions]                             <- Node 8
  |  Validate mandatory fields:
  |    - credit_outcome (APPROVED/APPROVED_WITH_CONDITIONS/DECLINED)
  |    - approved_dce_limit_sgd (numeric, >= 0)
  |    - approved_dce_pce_limit_sgd (numeric, >= 0)
  |    - confirmed_caa_approach (IRB/SA)
  |    - conditions[] (array)
  |    - credit_team_id (non-empty)
  |    - credit_team_name (non-empty)
  |    - decided_at (ISO 8601)
  |
  v
[IF/ELSE: Credit Outcome?]                                    <- Node 9
  |
  +-- DECLINED
  |     UPDATE case_state (status=DEAD)
  |     Notify SA-7 (CREDIT_DECLINED)
  |     INSERT event_log (CREDIT_DECLINED)
  |     [END: DEAD]
  |
  +-- APPROVED / APPROVED_WITH_CONDITIONS
  |
  v
[CODE: Store Credit Decisions]                                <- Node 10
  |  MCP Tool: sa5_capture_credit_decisions
  |  INSERT dce_ao_credit_decision (UNIQUE on case_id)
  |  Output: {decision_id, credit_outcome}
  |
  v
[CODE: Complete Node]                                         <- Node 11
  |  MCP Tool: sa5_complete_node(outcome=CREDIT_APPROVED)
  |  REPLACE INTO dce_ao_node_checkpoint (N-4, COMPLETE)
  |  UPDATE dce_ao_case_state (current_node=N-5, status=ACTIVE)
  |  UPDATE dce_ao_credit_brief (credit_outcome_flag)
  |  INSERT dce_ao_event_log (NODE_COMPLETED + CREDIT_APPROVED)
  |  UPDATE dce_ao_hitl_review_task (status=DECIDED)
  |
  v
[END: Return N4Output JSON]                                   <- Node 12
```

---

## 3. MCP Tools

| # | Tool Name | DB Tables Written | Purpose |
|---|---|---|---|
| 1 | `sa5_get_case_context` | READ: `dce_ao_case_state`, `dce_ao_rm_hierarchy`, `dce_ao_classification_result`, `dce_ao_rm_kyc_decision`, `dce_ao_node_checkpoint`, `dce_ao_document_staged`, `dce_ao_document_ocr_result` | Fetches complete case context: case state, RM KYC decisions, classification, N-3 output, financial document IDs. Phase 2 includes prior Phase 1 context. |
| 2 | `sa5_extract_financial_data` | INSERT: `dce_ao_financial_extract` (1 row per doc/fiscal year) | Parses financial statements to extract multi-year financial data. Calculates leverage ratio, liquidity ratio, YoY revenue/profitability trends. Returns aggregated financial summary with estimated initial limit. |
| 3 | `sa5_compile_credit_brief` | INSERT: `dce_ao_credit_brief` (1 row) | Assembles complete credit brief with entity summary, financial analysis, product risk profiles, RM recommendations, comparable benchmarks, and open questions. Posts to Credit Team workbench. |
| 4 | `sa5_park_for_credit_review` | INSERT: `dce_ao_hitl_review_task`, `dce_ao_node_checkpoint`, `dce_ao_event_log`; UPDATE: `dce_ao_case_state` | Atomic HITL parking: creates CREDIT_REVIEW task for CREDIT_TEAM persona, writes HITL_PENDING checkpoint, sends notification. |
| 5 | `sa5_capture_credit_decisions` | INSERT: `dce_ao_credit_decision` (UNIQUE on case_id) | Validates and stores Credit Team decisions: credit outcome, approved limits, CAA approach, conditions. |
| 6 | `sa5_complete_node` | REPLACE INTO: `dce_ao_node_checkpoint`; UPDATE: `dce_ao_case_state`, `dce_ao_credit_brief`; INSERT: `dce_ao_event_log`; UPDATE: `dce_ao_hitl_review_task` | Mandatory checkpoint writer. On CREDIT_APPROVED: advances to N-5, fires Kafka event. On CREDIT_DECLINED: marks case DEAD. |

---

## 4. Database Tables — Read/Write Map

### Tables SA-5 Writes (creates)

| Table | Operation | When |
|---|---|---|
| `dce_ao_financial_extract` | INSERT (1 row per doc/fiscal year) | After financial data extraction (Phase 1) |
| `dce_ao_credit_brief` | INSERT (1 row) + UPDATE (outcome flag) | After brief compilation (Phase 1) + after Credit decision (Phase 2) |
| `dce_ao_credit_decision` | INSERT (1 row, UNIQUE on case_id) | After Credit Team submits decisions (Phase 2) |
| `dce_ao_hitl_review_task` | INSERT + UPDATE | When parking for HITL (Phase 1) + on completion (Phase 2) |
| `dce_ao_node_checkpoint` | INSERT / REPLACE | HITL_PENDING (Phase 1) + COMPLETE or FAILED (Phase 2) |
| `dce_ao_event_log` | INSERT (3-4 rows) | CREDIT_REVIEW_REQUESTED, NODE_COMPLETED, CREDIT_APPROVED/DECLINED |

### Tables SA-5 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context fetch (case type, jurisdiction, priority) |
| `dce_ao_rm_kyc_decision` | SELECT | RM decisions (risk rating, limits, CAA approach) — READ ONLY, written by SA-4 |
| `dce_ao_node_checkpoint` | SELECT | N-3 output (KYC brief data) |
| `dce_ao_classification_result` | SELECT | Account type, entity type, products |
| `dce_ao_document_staged` | SELECT | Financial document IDs |
| `dce_ao_document_ocr_result` | SELECT | Extracted financial statement data |
| `dce_ao_rm_hierarchy` | SELECT | RM details for brief header |

### New Tables SA-5 Creates

```sql
-- Credit brief (one per case — compiled by SA-5)
CREATE TABLE dce_ao_credit_brief (
    credit_brief_id             VARCHAR(30) PRIMARY KEY,
    case_id                     VARCHAR(20) NOT NULL,
    attempt_number              INT DEFAULT 1,
    entity_legal_name           VARCHAR(200) NOT NULL,
    entity_type                 ENUM('CORP','FUND','FI','SPV','INDIVIDUAL') NOT NULL,
    jurisdiction                VARCHAR(10),
    products_requested          JSON,
    caa_approach                ENUM('IRB','SA') NOT NULL,
    recommended_dce_limit_sgd   DECIMAL(15,2) NOT NULL,
    recommended_dce_pce_limit_sgd DECIMAL(15,2) NOT NULL,
    osca_case_number            VARCHAR(50) NOT NULL,
    kyc_risk_rating             ENUM('LOW','MEDIUM','HIGH') NOT NULL,
    financial_years_analysed    INT DEFAULT 0,
    total_equity_sgd            DECIMAL(20,2),
    net_asset_value_sgd         DECIMAL(20,2),
    leverage_ratio              DECIMAL(10,4),
    liquidity_ratio             DECIMAL(10,4),
    revenue_sgd                 DECIMAL(20,2),
    net_profit_sgd              DECIMAL(20,2),
    revenue_trend_pct           DECIMAL(8,4),
    profitability_trend_pct     DECIMAL(8,4),
    estimated_initial_limit_sgd DECIMAL(15,2),
    brief_url                   VARCHAR(500),
    open_questions              JSON,
    comparable_benchmarks       JSON,
    credit_outcome_flag         ENUM('PENDING','APPROVED','APPROVED_WITH_CONDITIONS','DECLINED')
                                DEFAULT 'PENDING',
    compiled_by_model           VARCHAR(50),
    kb_chunks_used              JSON,
    compiled_at                 DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case_attempt (case_id, attempt_number),
    INDEX idx_case (case_id),
    INDEX idx_outcome (credit_outcome_flag)
);

-- Per-document/year financial extract
CREATE TABLE dce_ao_financial_extract (
    extract_id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                 VARCHAR(20) NOT NULL,
    credit_brief_id         VARCHAR(30) NOT NULL,
    doc_id                  VARCHAR(30) NOT NULL,
    fiscal_year             INT NOT NULL,
    fiscal_year_end_date    DATE,
    reporting_currency      CHAR(3) DEFAULT 'SGD',
    total_equity            DECIMAL(20,2),
    net_asset_value         DECIMAL(20,2),
    total_debt              DECIMAL(20,2),
    current_assets          DECIMAL(20,2),
    current_liabilities     DECIMAL(20,2),
    revenue                 DECIMAL(20,2),
    net_profit              DECIMAL(20,2),
    existing_debt_obligations DECIMAL(20,2),
    fx_rate_to_sgd          DECIMAL(15,6) DEFAULT 1.0,
    total_equity_sgd        DECIMAL(20,2),
    revenue_sgd             DECIMAL(20,2),
    net_profit_sgd          DECIMAL(20,2),
    leverage_ratio          DECIMAL(10,4),
    liquidity_ratio         DECIMAL(10,4),
    extraction_confidence   DECIMAL(5,4),
    extraction_notes        TEXT,
    extracted_by_model      VARCHAR(50),
    extracted_at            DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (credit_brief_id) REFERENCES dce_ao_credit_brief(credit_brief_id),
    UNIQUE KEY idx_case_doc_year (case_id, doc_id, fiscal_year),
    INDEX idx_case (case_id),
    INDEX idx_brief (credit_brief_id)
);

-- Credit Team decision (one per case — post-HITL)
CREATE TABLE dce_ao_credit_decision (
    decision_id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id                     VARCHAR(20) NOT NULL,
    credit_brief_id             VARCHAR(30) NOT NULL,
    credit_outcome              ENUM('APPROVED','APPROVED_WITH_CONDITIONS','DECLINED') NOT NULL,
    approved_dce_limit_sgd      DECIMAL(15,2),
    approved_dce_pce_limit_sgd  DECIMAL(15,2),
    confirmed_caa_approach      ENUM('IRB','SA') NOT NULL,
    conditions                  JSON,
    decline_reason              TEXT,
    credit_team_id              VARCHAR(20) NOT NULL,
    credit_team_name            VARCHAR(200),
    credit_team_email           VARCHAR(200),
    decided_at                  DATETIME NOT NULL,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    FOREIGN KEY (credit_brief_id) REFERENCES dce_ao_credit_brief(credit_brief_id),
    UNIQUE KEY idx_case (case_id),
    INDEX idx_credit_team (credit_team_id),
    INDEX idx_outcome (credit_outcome)
);
```

---

## 5. Input Format

### Trigger: RM_DECISION_CAPTURED from DCE Orchestrator

```json
{
  "case_id": "AO-2026-000301",
  "mode": "TRIGGER",
  "mcp_endpoint": "http://host.docker.internal:8003"
}
```

### Resume Trigger: Credit Decision from Credit Team

```json
{
  "case_id": "AO-2026-000301",
  "mode": "RESUME",
  "hitl_task_id": "HITL-XXXXXX",
  "credit_decisions": {
    "credit_outcome": "APPROVED",
    "approved_dce_limit_sgd": 5000000.00,
    "approved_dce_pce_limit_sgd": 2000000.00,
    "confirmed_caa_approach": "IRB",
    "conditions": [],
    "credit_team_id": "CT-001",
    "credit_team_name": "Sarah Tan",
    "decided_at": "2026-03-10T10:00:00Z"
  }
}
```

---

## 6. Output Format — N4Output

```json
{
  "case_id": "AO-2026-000301",
  "credit_brief_id": "CBRIEF-XXXXXX",
  "credit_outcome": "APPROVED",
  "approved_dce_limit_sgd": 5000000.00,
  "approved_dce_pce_limit_sgd": 2000000.00,
  "confirmed_caa_approach": "IRB",
  "conditions": [],
  "financial_years_analysed": 3,
  "leverage_ratio": 0.1127,
  "liquidity_ratio": 4.3846,
  "revenue_trend_pct": 13.64,
  "estimated_initial_limit_sgd": 4500000.00,
  "next_node": "N-5",
  "notes": "Credit approved by CT-001. No conditions. IRB approach confirmed."
}
```

---

## 7. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| Case Context Fetch | DB connection / checkpoint not found | Yes | 2 | Alert Operations | Operations (hard block) |
| Financial Data Extraction | Malformed docs / parsing error | No | — | Use placeholder data; flag for manual review | Credit Team (noted in brief) |
| Credit Brief Compilation | LLM timeout / malformed output | Yes | 2 | Use structured template with raw data | Email Credit Team manager |
| Workbench Post | Spring Boot API failure | Yes | 3 | Email Credit Team directly | Credit Team Manager |
| HITL Deadline Breach | Credit Team no-action > SLA | Yes (reminders) | 3 (SLA warnings) | SA-7 escalation chain | Credit Team -> Credit Head -> DCE COO |
| Credit Decision Validation | Missing mandatory fields | No | — | Return to workbench with highlighted gaps | Credit Team (in workbench) |
| Checkpoint Write | MariaDB failure | Yes | 3 | Alert Operations | Operations (hard block) |

---

## 8. Infrastructure & Deployment

### MCP Server

```bash
# Docker Compose (recommended)
docker compose up -d --build mcp-sa5

# Health check
curl http://localhost:8003/health
# -> {"status": "ok", "service": "dce-sa5-credit-preparation", "port": 8003}

# Verify tools
# 1. Initialize MCP session
curl -X POST http://localhost:8003/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# 2. List tools (use session ID from step 1)
curl -X POST http://localhost:8003/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "Mcp-Session-Id: <session-id>" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

### Docker Compose Service

```yaml
mcp-sa5:
  build:
    context: .
    dockerfile: Dockerfile.sa5
  container_name: dce_mcp_sa5
  restart: unless-stopped
  env_file: .env
  environment:
    DCE_DB_HOST: db
    DCE_DB_PORT: 3306
    PORT: 8003
    MCP_TRANSPORT: streamable-http
  ports:
    - "8003:8003"
  depends_on:
    db:
      condition: service_healthy
```

### Knowledge Base

| KB ID | KB Name | Purpose |
|---|---|---|
| **KB-6** | DCE Product Reference | Product margin profiles, typical limit ranges, exchange codes. Shared with SA-4. |

---

## 9. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow (WF) — Two-Phase (Pre-HITL + Post-HITL) |
| **Dify App Name** | `DCE-AO-SA5-Credit-Preparation` |
| **Primary Model** | claude-sonnet-4-6 |
| **Temperature** | 0.1 |
| **Max Tokens** | 3072 |
| **Knowledge Bases** | KB-6 (DCE Product Reference) — shared with SA-4 |
| **MCP Tools** | sa5_get_case_context, sa5_extract_financial_data, sa5_compile_credit_brief, sa5_park_for_credit_review, sa5_capture_credit_decisions, sa5_complete_node |
| **Max Agent Iterations** | 8 (4 pre-HITL + 4 post-HITL) |
| **HITL Required** | YES — Credit Team |
| **Checkpoint** | Mandatory — HITL_PENDING (Phase 1) + COMPLETE / FAILED (Phase 2) |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | CREDIT_REVIEW_REQUESTED, CREDIT_APPROVED, CREDIT_DECLINED, NODE_COMPLETED, NODE_FAILED |
| **Variable Prefix** | `sa5_` |
| **Output Schema** | N4Output |
| **Downstream Triggered** | SA-6 Static Configuration (N-5) on `CREDIT_APPROVED` |
