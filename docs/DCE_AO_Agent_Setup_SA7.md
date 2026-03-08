# DCE Account Opening — Agent Setup: SA-7 Notification Agent

| Field | Value |
|---|---|
| **Agent ID** | SA-7 |
| **DAG Node** | N-6 |
| **Agent Name** | Notification & Welcome Kit Agent |
| **Dify Type** | Workflow (WF) — Single-Phase (No HITL) |
| **LLM Primary** | Claude Sonnet 4.6 (welcome kit content generation) |
| **LLM Secondary** | None — notification dispatch is deterministic |
| **Total Skills** | 6 |
| **SLA Window** | 1 hour (immediate processing after TMO_VALIDATED) |
| **Max Retries** | 2 (notification delivery retries) |
| **HITL Required** | **NO** — Fully automated final node |
| **Trigger** | HTTP Request from DCE Orchestrator on `TMO_VALIDATED` event |
| **Upstream** | N-5 (SA-6 Static Configuration) |
| **Downstream** | None — **TERMINAL NODE** (pipeline status -> DONE) |
| **MCP Server Port** | 8005 |
| **Docker Container** | `dce_mcp_sa7` |

---

## 1. Agent Purpose

SA-7 is the **notification and completion engine** — the final node in the DCE Account Opening pipeline. Unlike all other nodes (N-0 through N-5), SA-7 has **no HITL pause**. It runs fully autonomously to completion.

**Core responsibilities:**

1. **Welcome Kit Generation:** Assembles a complete onboarding welcome kit for the new client, including platform credentials (CQG trading login, IDB portal access), RM contact information, client services contact, approved product list, credit limits, and any conditions from Credit Team approval.

2. **Multi-Channel Notification Dispatch:** Sends a coordinated batch of 5 notifications across multiple channels:
   - Customer: EMAIL (welcome kit with login credentials and RM contact)
   - RM: IN_APP_TOAST (real-time workbench notification) + EMAIL (welcome kit copy)
   - Operations: WORKBENCH_BADGE (account live tracking badge)
   - System: KAFKA_EVENT (dce.account.live for downstream integrations)

3. **Case Completion:** Writes the final N-6 COMPLETE checkpoint, updates case status to DONE, and fires the CASE_COMPLETED event — marking the end of the account opening pipeline.

---

## 2. Dify Workflow Canvas — Node Map

```
============== SINGLE PHASE -- FULLY AUTOMATED =================

[START: Trigger from DCE Orchestrator]
  |  Input: {case_id}
  |
  v
[CODE: Get Case Context]                                     <- Node 1
  |  MCP Tool: sa7_get_case_context(case_id)
  |  Validates: case exists, current_node=N-6, status=ACTIVE
  |  Reads: case_state, config_spec, credit_decision,
  |         rm_hierarchy, system_validation, classification
  |  Output: {context with all upstream data}
  |
  v
[CODE: Generate Welcome Kit]                                  <- Node 2
  |  MCP Tool: sa7_generate_welcome_kit
  |  Assembles:
  |    - Platform credentials (CQG login, IDB access)
  |    - RM contact info (name, email, phone)
  |    - Client services contact
  |    - Products enabled, credit limits, CAA approach
  |    - Conditions (if any from Credit Team)
  |    - Statement schedule
  |  DB Write: INSERT dce_ao_welcome_kit (status=GENERATED)
  |  Output: {kit_id, cqg_login, idb_access, contacts}
  |
  v
[CODE: Send Welcome Kit Batch]                                <- Node 3
  |  MCP Tool: sa7_send_welcome_kit_batch
  |  Atomic batch of 5 coordinated notifications:
  |    1. Customer EMAIL  (welcome kit with credentials)
  |    2. RM IN_APP_TOAST (account live notification)
  |    3. RM EMAIL        (welcome kit copy)
  |    4. Ops WORKBENCH_BADGE (tracking badge)
  |    5. System KAFKA_EVENT  (dce.account.live)
  |  DB Write: INSERT dce_ao_notification_log (5 rows)
  |  UPDATE dce_ao_welcome_kit (status=SENT, all notified flags)
  |  Output: {notification_ids[], batch_size: 5}
  |
  v
[CODE: Complete Case]                                         <- Node 4
  |  MCP Tool: sa7_complete_case
  |  REPLACE INTO dce_ao_node_checkpoint (N-6, COMPLETE)
  |  UPDATE dce_ao_case_state (status=DONE, N-6 in completed_nodes)
  |  INSERT dce_ao_event_log (NODE_COMPLETED + CASE_COMPLETED)
  |  Output: {case_status: DONE, completed_nodes: [N-0..N-6]}
  |
  v
[END: Return Final Output]                                    <- Node 5
  Return: {case_id, status: "DONE", kit_id, notifications_sent: 5}

====================================================================
  --  PIPELINE COMPLETE                                           --
  --  Case status: DONE                                           --
  --  All 7 nodes (N-0 through N-6) COMPLETE                     --
  --  Account is LIVE                                              --
====================================================================
```

---

## 3. MCP Tools

| # | Tool Name | DB Tables Written | Purpose |
|---|---|---|---|
| 1 | `sa7_get_case_context` | READ: `dce_ao_case_state`, `dce_ao_config_spec`, `dce_ao_credit_decision`, `dce_ao_rm_hierarchy`, `dce_ao_system_validation`, `dce_ao_classification_result`, `dce_ao_node_checkpoint` | Fetches complete case context from all upstream nodes. Validates case is at N-6 with ACTIVE status. Returns config spec, credit limits, RM details, validation summary. |
| 2 | `sa7_generate_welcome_kit` | INSERT: `dce_ao_welcome_kit` (status=GENERATED) | Assembles complete onboarding welcome kit with platform credentials (simulated CQG/IDB), RM contact, client services info, approved products and limits. |
| 3 | `sa7_send_notification` | INSERT: `dce_ao_notification_log` (1 row) | Sends a single notification via specified channel (EMAIL, SMS, IN_APP_TOAST, WORKBENCH_BADGE, KAFKA_EVENT). Supports 11 notification types. |
| 4 | `sa7_send_welcome_kit_batch` | INSERT: `dce_ao_notification_log` (5 rows); UPDATE: `dce_ao_welcome_kit` (status=SENT) | Atomic batch dispatch of 5 coordinated notifications across multiple channels and recipients. Updates welcome kit with delivery confirmation flags. |
| 5 | `sa7_complete_case` | REPLACE INTO: `dce_ao_node_checkpoint` (N-6, COMPLETE); UPDATE: `dce_ao_case_state` (status=DONE); INSERT: `dce_ao_event_log` (2 rows: NODE_COMPLETED + CASE_COMPLETED) | **TERMINAL operation.** Marks N-6 COMPLETE, sets case to DONE, fires final CASE_COMPLETED event. This is the last write in the entire pipeline. |
| 6 | `sa7_get_notification_history` | READ: `dce_ao_notification_log` | Retrieves notification history for a case, optionally filtered by notification type. Used for audit and troubleshooting. |

---

## 4. Database Tables — Read/Write Map

### Tables SA-7 Writes (creates)

| Table | Operation | When |
|---|---|---|
| `dce_ao_welcome_kit` | INSERT (GENERATED) + UPDATE (SENT) | After kit generation + after batch send |
| `dce_ao_notification_log` | INSERT (5 rows typical) | After welcome kit batch send |
| `dce_ao_node_checkpoint` | REPLACE INTO (N-6, COMPLETE) | After case completion |
| `dce_ao_case_state` | UPDATE (status=DONE) | After case completion |
| `dce_ao_event_log` | INSERT (2 rows) | NODE_COMPLETED + CASE_COMPLETED |

### Tables SA-7 Reads

| Table | Operation | When |
|---|---|---|
| `dce_ao_case_state` | SELECT | Context fetch (validate N-6, ACTIVE) |
| `dce_ao_config_spec` | SELECT | Config spec (products, systems configured) |
| `dce_ao_credit_decision` | SELECT | Approved limits, CAA approach, conditions |
| `dce_ao_rm_hierarchy` | SELECT | RM name, email, phone for welcome kit |
| `dce_ao_system_validation` | SELECT | Validation summary (all systems PASS) |
| `dce_ao_classification_result` | SELECT | Entity type, jurisdiction, products |
| `dce_ao_node_checkpoint` | SELECT | N-5 output |

### New Tables SA-7 Creates

```sql
-- Welcome kit (one per case — final onboarding package)
CREATE TABLE dce_ao_welcome_kit (
    kit_id                  VARCHAR(30) PRIMARY KEY,    -- WKIT-XXXXXX
    case_id                 VARCHAR(20) NOT NULL,
    entity_name             VARCHAR(200) NOT NULL,
    entity_type             VARCHAR(20),
    jurisdiction            VARCHAR(10),
    account_reference       VARCHAR(50),
    products_enabled        JSON,
    cqg_login_details       JSON,        -- {username, login_url, temp_password}
    idb_access_details      JSON,        -- {portal_url, access_level, modules_enabled}
    approved_dce_limit_sgd  DECIMAL(15,2),
    approved_dce_pce_limit_sgd DECIMAL(15,2),
    confirmed_caa_approach  ENUM('IRB','SA'),
    client_services_contact JSON,        -- {team, email, phone, hours}
    rm_contact              JSON,        -- {name, email, phone, extension}
    conditions              JSON,        -- From Credit Team (if any)
    statement_schedule      VARCHAR(100) DEFAULT 'Daily electronic + Monthly PDF',
    status                  ENUM('GENERATED','SENT','ACKNOWLEDGED') DEFAULT 'GENERATED',
    customer_notified       BOOLEAN DEFAULT FALSE,
    rm_notified             BOOLEAN DEFAULT FALSE,
    ops_notified            BOOLEAN DEFAULT FALSE,
    notification_ids        JSON,        -- IDs of all notifications sent
    generated_by_model      VARCHAR(50),
    generated_at            DATETIME DEFAULT NOW(),
    sent_at                 DATETIME,
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    UNIQUE KEY idx_case (case_id),
    INDEX idx_status (status)
);

-- Notification log (shared table — all notifications across all nodes)
-- Note: This table may already exist from SA-3 HITL notifications.
-- SA-7 writes the bulk of notifications (welcome kit batch).
CREATE TABLE IF NOT EXISTS dce_ao_notification_log (
    notification_id     VARCHAR(30) PRIMARY KEY,    -- NOTIF-XXXXXX
    case_id             VARCHAR(20) NOT NULL,
    notification_type   ENUM('TASK_ASSIGNMENT','SLA_WARNING','ESCALATION',
                             'WELCOME_KIT','ACCOUNT_LIVE_NOTICE',
                             'RM_NOTIFICATION','OPS_NOTIFICATION',
                             'CREDIT_ALERT','SYSTEM_EVENT',
                             'COMPLIANCE_ALERT','GENERAL') NOT NULL,
    channel             ENUM('EMAIL','SMS','IN_APP_TOAST',
                             'WORKBENCH_BADGE','KAFKA_EVENT') NOT NULL,
    recipient_id        VARCHAR(20),
    recipient_email     VARCHAR(200),
    recipient_role      VARCHAR(50),
    subject             VARCHAR(500),
    body_summary        TEXT,
    template_id         VARCHAR(50),
    delivery_status     ENUM('SENT','DELIVERED','FAILED','PENDING') DEFAULT 'SENT',
    sent_at             DATETIME DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES dce_ao_case_state(case_id),
    INDEX idx_case (case_id),
    INDEX idx_type (notification_type),
    INDEX idx_recipient (recipient_id)
);
```

---

## 5. Input Format

### Trigger: TMO_VALIDATED from DCE Orchestrator

```json
{
  "case_id": "AO-2026-000501",
  "mcp_endpoint": "http://host.docker.internal:8005"
}
```

Note: SA-7 has **no RESUME mode** — it runs to completion in a single phase.

---

## 6. Output Format — N6Output (Final)

```json
{
  "case_id": "AO-2026-000501",
  "case_status": "DONE",
  "kit_id": "WKIT-123456",
  "entity_name": "Horizon Capital Markets Pte Ltd",
  "products_enabled": ["FUTURES", "OPTIONS"],
  "approved_dce_limit_sgd": 5000000.00,
  "cqg_login": {
    "username": "CQG-AO20260501",
    "login_url": "https://cqg-sim.dce.internal/login",
    "temp_password": "Welcome2026!",
    "password_change_required": true
  },
  "idb_access": {
    "portal_url": "https://idb-portal.dce.internal",
    "access_level": "FULL_TRADING",
    "modules_enabled": ["TRADE_ENTRY", "POSITION_MGMT", "RISK_MONITOR", "REPORTS"]
  },
  "notifications_sent": 5,
  "notification_channels": ["EMAIL", "IN_APP_TOAST", "WORKBENCH_BADGE", "KAFKA_EVENT"],
  "completed_nodes": ["N-0", "N-1", "N-2", "N-3", "N-4", "N-5", "N-6"],
  "next_node": null,
  "notes": "Account opening complete. Welcome kit sent to customer, RM, and Operations."
}
```

---

## 7. Notification Types & Channels

### Supported Notification Types

| Type | Used By | Purpose |
|---|---|---|
| `TASK_ASSIGNMENT` | SA-3, SA-4, SA-5, SA-6 | HITL task assignment to personas |
| `SLA_WARNING` | SA-3, SA-4, SA-5, SA-6 | SLA deadline approaching |
| `ESCALATION` | SA-3, SA-4 | SLA breach or compliance escalation |
| `WELCOME_KIT` | **SA-7** | Welcome kit delivery to customer |
| `ACCOUNT_LIVE_NOTICE` | **SA-7** | Account is live notification to RM |
| `RM_NOTIFICATION` | **SA-7** | General RM notifications |
| `OPS_NOTIFICATION` | **SA-7** | Operations tracking notifications |
| `CREDIT_ALERT` | SA-5 | Credit decision notifications |
| `SYSTEM_EVENT` | **SA-7** | Kafka events for downstream systems |
| `COMPLIANCE_ALERT` | SA-4 | Sanctions hit / compliance escalation |
| `GENERAL` | Any | General notifications |

### Supported Channels

| Channel | Delivery | Typical Recipient |
|---|---|---|
| `EMAIL` | SMTP gateway | Customer, RM, Operations |
| `SMS` | SMS gateway | Customer (urgent only) |
| `IN_APP_TOAST` | WebSocket push | RM, Desk Support (workbench) |
| `WORKBENCH_BADGE` | Badge counter update | Operations, TMO Static |
| `KAFKA_EVENT` | Kafka topic publish | Downstream systems |

### Welcome Kit Batch (5 notifications)

| # | Recipient | Channel | Type | Content |
|---|---|---|---|---|
| 1 | Customer | EMAIL | WELCOME_KIT | Full welcome kit with credentials |
| 2 | RM | IN_APP_TOAST | ACCOUNT_LIVE_NOTICE | Account live toast notification |
| 3 | RM | EMAIL | RM_NOTIFICATION | Welcome kit copy for records |
| 4 | Operations | WORKBENCH_BADGE | OPS_NOTIFICATION | Account live tracking badge |
| 5 | System | KAFKA_EVENT | SYSTEM_EVENT | dce.account.live event |

---

## 8. Error Handling & Escalation Matrix

| Failure Point | Error Type | Retry? | Max Retries | Fallback | Escalation Target |
|---|---|---|---|---|---|
| Case Context Fetch | Case not at N-6 / wrong status | No | — | Return error with expected state | Operations |
| Welcome Kit Generation | Missing upstream data | No | — | Generate partial kit; flag missing fields | Operations |
| Customer Email Delivery | SMTP failure | Yes | 2 | Queue for retry; alert Ops | Operations |
| RM Notification | Toast/Email failure | Yes | 2 | Log failed; continue (non-blocking) | Operations |
| Kafka Event Publish | Kafka broker down | Yes | 3 | Log event; retry async | Platform team |
| Case Completion | Checkpoint write failure | Yes | 3 | Alert Operations (hard block) | Operations |

---

## 9. Infrastructure & Deployment

### MCP Server

```bash
# Docker Compose (recommended)
docker compose up -d --build mcp-sa7

# Health check
curl http://localhost:8005/health
# -> {"status": "ok", "service": "dce-sa7-notification", "port": 8005}
```

### Docker Compose Service

```yaml
mcp-sa7:
  build:
    context: .
    dockerfile: Dockerfile.sa7
  container_name: dce_mcp_sa7
  restart: unless-stopped
  env_file: .env
  environment:
    DCE_DB_HOST: db
    DCE_DB_PORT: 3306
    PORT: 8005
    MCP_TRANSPORT: streamable-http
  ports:
    - "8005:8005"
  depends_on:
    db:
      condition: service_healthy
```

---

## 10. Agent Configuration Summary

| Parameter | Value |
|---|---|
| **Dify App Type** | Workflow (WF) — Single-Phase (No HITL) |
| **Dify App Name** | `DCE-AO-SA7-Notification` |
| **Primary Model** | claude-sonnet-4-6 |
| **Temperature** | 0.1 |
| **Max Tokens** | 2048 |
| **Knowledge Bases** | None |
| **MCP Tools** | sa7_get_case_context, sa7_generate_welcome_kit, sa7_send_notification, sa7_send_welcome_kit_batch, sa7_complete_case, sa7_get_notification_history |
| **Max Agent Iterations** | 5 (4 tool calls + 1 END) |
| **HITL Required** | NO — Fully automated |
| **Checkpoint** | Mandatory — COMPLETE only (no HITL_PENDING) |
| **Event Publishing** | Kafka topic: `dce.ao.events` |
| **Audit Events** | WELCOME_KIT_GENERATED, WELCOME_KIT_SENT, NODE_COMPLETED, CASE_COMPLETED |
| **Variable Prefix** | `sa7_` |
| **Output Schema** | N6Output (final case output) |
| **Downstream Triggered** | None — TERMINAL NODE |
| **Special Notes** | Only SA without HITL. Completes entire pipeline. Case status -> DONE. |
