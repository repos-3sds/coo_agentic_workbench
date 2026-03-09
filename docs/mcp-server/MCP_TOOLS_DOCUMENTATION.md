# NPA MCP Tools Server — Complete Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Why MCP Tools?](#why-mcp-tools)
4. [Agent-to-Tool Mapping](#agent-to-tool-mapping)
5. [All 71 Tools — Detailed Reference](#all-71-tools--detailed-reference)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Deployment](#deployment)

---

## Overview

The NPA MCP Tools Server is a **Python FastAPI application** that exposes **71 database tools** as REST endpoints for the NPA (New Product Approval) Multi-Agent Workbench. These tools are the data layer for **13 AI agents** orchestrated by Dify, enabling a fully AI-powered product approval workflow for banking operations.

| Attribute | Value |
|-----------|-------|
| **Language** | Python 3.12 |
| **Framework** | FastAPI + aiomysql |
| **Protocol** | REST (port 3002) + MCP SSE (port 3001) |
| **Database** | MariaDB (external VM) |
| **Tools** | 71 across 15 categories |
| **Agents Served** | 13 agents across 4 tiers |
| **DB Tables** | 42 tables (22 transactional + 12 reference + 8 infrastructure) |
| **Image Size** | ~271 MB (Python 3.12-slim) |
| **Container Port** | 3002 |

---

## Architecture

### System Context

```
                   ┌─────────────────────────────────────────────────┐
                   │              Angular Frontend                    │
                   │         (User Interface — Port 80)               │
                   └────────────────────┬────────────────────────────┘
                                        │ REST + WebSocket
                                        ▼
                   ┌─────────────────────────────────────────────────┐
                   │           Express Orchestrator                   │
                   │          (REST API — Port 3000)                  │
                   └─────────┬───────────────────────┬───────────────┘
                             │                       │
                             ▼                       ▼
                   ┌──────────────────┐    ┌──────────────────┐
                   │   Dify Platform   │    │   Claude API      │
                   │  (Agent Engine)   │    │   (Anthropic LLM) │
                   └────────┬─────────┘    └──────────────────┘
                            │
                            │ HTTP POST /tools/{name}
                            ▼
              ┌──────────────────────────────────┐
              │   NPA MCP Tools Server (Python)   │
              │        FastAPI — Port 3002        │
              │         71 Tools / 15 Categories  │
              └────────────────┬─────────────────┘
                               │ aiomysql
                               ▼
              ┌──────────────────────────────────┐
              │       MariaDB (External VM)       │
              │     42 tables — npa_workbench     │
              └──────────────────────────────────┘
```

### How It Works

1. **Dify** imports the server's `/openapi.json` as a Custom Tool provider
2. When an AI agent needs data, Dify calls `POST /tools/{tool_name}` with JSON body
3. The MCP server executes the corresponding SQL against MariaDB
4. Results are returned as JSON with `{success, data, error}`
5. The agent uses the data to reason, then calls more tools or responds to the user

### Server Components

```
server/mcp-python/
├── rest_server.py          # FastAPI app — routes, OpenAPI generation, health check
├── db.py                   # aiomysql connection pool, query/execute helpers, serialization
├── registry.py             # ToolRegistry — central tool registration + lookup
├── tools/                  # 18 tool modules — self-register on import
│   ├── __init__.py         # Auto-imports all modules
│   ├── session.py          # Session management (2 tools)
│   ├── ideation.py         # Product ideation (5 tools)
│   ├── classification.py   # NPA classification (5 tools)
│   ├── autofill.py         # Template auto-fill (5 tools)
│   ├── risk.py             # Risk assessment (4 tools)
│   ├── governance.py       # Governance & signoffs (5 tools)
│   ├── audit.py            # Audit trail (4 tools)
│   ├── npa_data.py         # NPA CRUD (4 tools)
│   ├── workflow.py         # Workflow engine (5 tools)
│   ├── monitoring.py       # Post-launch monitoring (6 tools)
│   ├── documents.py        # Document lifecycle (4 tools)
│   ├── governance_ext.py   # Governance extensions (6 tools)
│   ├── risk_ext.py         # Risk extensions (4 tools)
│   ├── kb_search.py        # Knowledge base (3 tools)
│   ├── prospects.py        # Prospect pipeline (2 tools)
│   ├── dashboard.py        # Executive dashboard (1 tool)
│   ├── notifications.py    # Notifications (3 tools)
│   └── jurisdiction.py     # Jurisdiction adapter (3 tools)
├── Dockerfile              # Production container image
├── Jenkinsfile             # CI/CD pipeline for OpenShift
├── requirements.txt        # Python dependencies
├── openshift/              # Kubernetes/OpenShift manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── route.yaml
│   ├── configmap.yaml
│   └── secret.yaml
└── test_all_tools.sh       # Full test suite (71 tools)
```

---

## Why MCP Tools?

### The Problem
The 13 AI agents need to read and write to the MariaDB database, but LLMs cannot directly execute SQL. They need a structured, validated interface to interact with data.

### The Solution: MCP (Model Context Protocol)
MCP is a standard protocol for giving AI agents access to external tools. Each tool has:
- A **name** (e.g., `risk_run_assessment`)
- A **JSON schema** defining valid inputs
- A **handler** that executes the actual database query
- A **result** with structured data the agent can reason about

### Why 71 Tools Instead of Raw SQL?
| Concern | Raw SQL | MCP Tools |
|---------|---------|-----------|
| **Security** | SQL injection risk | Parameterized queries only |
| **Validation** | None | JSON schema enforced |
| **Audit** | Manual | Every tool call is traceable |
| **Granularity** | Unlimited access | Each tool has specific, bounded permissions |
| **Business Logic** | In the LLM prompt | Encoded in Python handlers |
| **Testing** | Untestable | Each tool individually testable |

---

## Agent-to-Tool Mapping

### The 4-Tier Agent Hierarchy

```
TIER 1 ─ Strategic     │  Master COO Orchestrator
                        │      (routes all user messages)
                        │
TIER 2 ─ Domain         │  NPA Domain Orchestrator
                        │      (NPA lifecycle management)
                        │
TIER 3 ─ Specialist     │  Ideation │ Classification │ AutoFill │ ML Predict │
                        │  Risk │ Governance │ Diligence │ Doc Lifecycle │ Monitoring
                        │
TIER 4 ─ Utility        │  KB Search │ Notification │ Audit Trail │ Jurisdiction
```

### Which Agent Uses Which Tools

#### TIER 1: Master COO Orchestrator
Routes every user message. Handles meta-queries directly.

| Tool | What it does for this agent |
|------|-----------------------------|
| `session_create` | Start a new conversation session |
| `session_log_message` | Persist every user-agent exchange |
| `get_session_history` | Resume previous conversation |
| `log_routing_decision` | Record which sub-agent was chosen and why |
| `get_user_profile` | Load user's role, department, permissions |
| `list_npas` | Quick pipeline overview for general queries |
| `get_dashboard_kpis` | Executive KPI summary for COO questions |

#### TIER 2: NPA Domain Orchestrator
Decomposes NPA tasks into specialist agent calls. Manages lifecycle stages.

| Tool | What it does for this agent |
|------|-----------------------------|
| `get_npa_by_id` | Load full NPA context for routing decisions |
| `list_npas` | Pipeline context for multi-NPA operations |
| `get_workflow_state` | Check current stage to determine valid next agents |
| `advance_workflow_state` | Progress NPA through pipeline gates |
| `session_log_message` | Persist NPA-specific conversation turns |
| `log_routing_decision` | Record sub-agent selection reasoning |

**Routing Matrix (Stage to Agent):**
| NPA Stage | Primary Agent(s) | Secondary |
|-----------|-----------------|-----------|
| **Initiation** | Ideation, Classification | KB Search |
| **Review** | AutoFill, Risk, Doc Lifecycle | ML Predict |
| **Sign-Off** | Governance, Diligence | Notification |
| **Launch** | Governance, Monitoring | Notification |
| **Monitoring** | Monitoring | Audit Trail |

#### TIER 3: Ideation Agent
Helps conceptualize new products, find similar past NPAs, check prohibited list.

| Tool | What it does for this agent |
|------|-----------------------------|
| `ideation_create_npa` | Create a new NPA project record |
| `ideation_find_similar` | Search historical NPAs by name/description |
| `ideation_get_prohibited_list` | Screen against 4-layer prohibited items (INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC) |
| `ideation_save_concept` | Save concept notes, rationale, target market |
| `ideation_list_templates` | List available NPA form templates |
| `get_prospects` | Load product opportunity pipeline |
| `convert_prospect_to_npa` | Promote a prospect to formal NPA |
| `search_kb_documents` | Find similar historical products in KB |

#### TIER 3: Classification Agent
Determines product classification (NTG/Variation/Existing) and approval track.

| Tool | What it does for this agent |
|------|-----------------------------|
| `classify_assess_domains` | Run 7-domain intake assessment (Strategic, Risk, Legal, Ops, Tech, Data, Client) |
| `classify_score_npa` | Generate scorecard (0-20 scale) determining tier |
| `classify_determine_track` | Set approval track (Full NPA / NPA Lite / Bundling / Evergreen / Prohibited) |
| `classify_get_criteria` | Fetch scoring rubric from reference data |
| `classify_get_assessment` | Retrieve existing assessments for review |
| `adapt_classification_weights` | Adjust scoring weights for jurisdiction context |

**Classification writes to:**
- `npa_intake_assessments` — domain-level intake scores
- `npa_classification_assessments` — per-criteria scores (FK to `ref_classification_criteria`)
- `npa_classification_scorecards` — final tier + track determination
- `npa_projects` — updates `classification_confidence`, `classification_method`, `approval_track`

#### TIER 3: Template AutoFill Agent
Auto-fills the 47-field NPA template using RAG over historical NPAs.

| Tool | What it does for this agent |
|------|-----------------------------|
| `autofill_get_template_fields` | Load full template structure (sections + fields) |
| `autofill_populate_field` | Write a single field value with lineage (AUTO/ADAPTED/MANUAL) |
| `autofill_populate_batch` | Bulk-fill multiple fields at once |
| `autofill_get_form_data` | Read current form state for an NPA |
| `autofill_get_field_options` | Get valid dropdown options for select fields |

**Lineage tracking:** Every auto-filled value is tagged:
- `AUTO` — AI-generated, untouched
- `ADAPTED` — AI-generated, then human-edited
- `MANUAL` — Human-entered from scratch

#### TIER 3: ML Prediction Agent
Predicts approval likelihood, timeline, and bottlenecks from historical data.

| Tool | What it does for this agent |
|------|-----------------------------|
| `list_npas` | Fetch historical NPAs for comparison |
| `get_npa_by_id` | Load current NPA features |
| `update_npa_predictions` | Save predicted values (confidence, timeline, risk) to `npa_projects` |
| `get_performance_metrics` | Historical product performance for revenue prediction |
| `search_kb_documents` | Historical context for prediction explanations |

**Writes to `npa_projects`:** `classification_confidence`, `predicted_timeline_days`, `predicted_bottleneck`, `predicted_approval_likelihood`

#### TIER 3: Risk Agent
Performs 4-layer risk validation. No NPA proceeds to sign-off without this agent's clearance.

| Tool | What it does for this agent |
|------|-----------------------------|
| `risk_run_assessment` | Execute risk checks across all domains (Credit, Market, Operational, Liquidity, Legal, Reputational, Cyber) |
| `risk_get_market_factors` | Load market risk exposures (IR Delta, FX Vega, Crypto Delta) |
| `risk_add_market_factor` | Add/update a market risk factor with VaR/stress capture status |
| `risk_get_external_parties` | Get counterparty/vendor risk profiles |
| `save_risk_check_result` | Persist 4-layer risk check results to `npa_risk_checks` |
| `validate_prerequisites` | Verify operational readiness checklist |
| `get_prerequisite_categories` | Load prerequisite categories and checks |
| `get_form_field_value` | Read specific form field values for risk evaluation |
| `ideation_get_prohibited_list` | Deep sanctions and prohibited screening |
| `validate_document` | Verify required document validity |

**4-Layer Risk Check Cascade:**
1. **INTERNAL_POLICY** — Company risk framework alignment
2. **REGULATORY** — MAS 656 / HKMA / FCA compliance
3. **SANCTIONS** — OFAC / UN / EU sanctions screening
4. **DYNAMIC** — ML-based anomaly detection

#### TIER 3: Governance Agent
Manages the sign-off lifecycle: routing, SLA, loop-backs, escalations, circuit breaker.

| Tool | What it does for this agent |
|------|-----------------------------|
| `governance_create_signoff_matrix` | Generate sign-off requests for 6-8 departments |
| `governance_get_signoffs` | Read current sign-off status per department |
| `governance_record_decision` | Record approve/reject/loop-back decision |
| `governance_check_loopbacks` | Check loop-back count + circuit breaker (auto-escalate at 3) |
| `governance_advance_stage` | Progress NPA through pipeline gates |
| `get_signoff_routing_rules` | Determine which departments sign off |
| `check_sla_status` | Monitor deadline compliance per sign-off |
| `create_escalation` | Trigger escalation to next authority level (writes to `npa_escalations`) |
| `get_escalation_rules` | Load escalation authority matrix |
| `save_approval_decision` | Record Checker/GFM COO/PAC final decisions |
| `add_comment` | Post clarification Q&A between approver and maker |

**Circuit Breaker Pattern:** If an NPA gets loop-backed 3+ times, the system auto-escalates to the next authority level to prevent infinite rework cycles.

#### TIER 3: Conversational Diligence Agent
Deep-dive Q&A for approvers reviewing NPAs. Does NOT fill forms.

| Tool | What it does for this agent |
|------|-----------------------------|
| `search_kb_documents` | Semantic search over knowledge base for regulatory context |
| `get_npa_by_id` | Load full NPA context for answers |
| `get_form_field_value` | Read field values for contextual explanations |
| `add_comment` | Post AI-generated clarification responses |
| `list_npas` | Find similar NPAs for comparison |

#### TIER 3: Document Lifecycle Agent
End-to-end document management: upload, validation, completeness, expiry.

| Tool | What it does for this agent |
|------|-----------------------------|
| `upload_document_metadata` | Record new document upload |
| `check_document_completeness` | Stage gate: are all required docs present? |
| `get_document_requirements` | Load stage-specific document rules |
| `validate_document` | Check document validity, update validation status |

#### TIER 3: Post-Launch Monitoring Agent
Watchdog for launched products. Detects breaches, triggers alerts.

| Tool | What it does for this agent |
|------|-----------------------------|
| `get_performance_metrics` | Fetch volume, P&L, VaR, collateral data |
| `check_breach_thresholds` | Compare metrics against thresholds |
| `create_breach_alert` | Generate alert when threshold exceeded |
| `get_monitoring_thresholds` | Load threshold definitions per product |
| `get_post_launch_conditions` | Track post-launch condition completion |
| `update_condition_status` | Mark conditions as met/overdue |

#### TIER 4: KB Search Agent
Shared knowledge base retrieval. Called by Ideation, AutoFill, Diligence, Risk.

| Tool | What it does for this agent |
|------|-----------------------------|
| `search_kb_documents` | Semantic search over historical NPAs, policies, regulations |
| `get_kb_document_by_id` | Full document retrieval by ID |
| `list_kb_sources` | Available knowledge base inventory |

#### TIER 4: Notification Agent
Cross-domain notification delivery. Aggregates alerts from all agents.

| Tool | What it does for this agent |
|------|-----------------------------|
| `get_pending_notifications` | Aggregate unread alerts for a project |
| `send_notification` | Create and deliver notification (SYSTEM_ALERT, SLA_BREACH, etc.) |
| `mark_notification_read` | Track acknowledgment |

#### TIER 4: Audit Trail Agent
Immutable audit logging. Called by ALL agents for compliance.

| Tool | What it does for this agent |
|------|-----------------------------|
| `audit_log_action` | Write immutable audit entry with actor, reasoning, confidence |
| `audit_get_trail` | Read chronological audit history per NPA |
| `check_audit_completeness` | Verify all required audit actions exist for NPA lifecycle |
| `generate_audit_report` | Create compliance report with timeline and agent reasoning chains |

#### TIER 4: Jurisdiction Adapter
Multi-jurisdiction compliance. Adapts rules for SG, HK, LN, CN, IN, AU, VN, ID.

| Tool | What it does for this agent |
|------|-----------------------------|
| `get_npa_jurisdictions` | Get all jurisdictions linked to an NPA with regulatory details |
| `get_jurisdiction_rules` | Fetch rules, restrictions, prohibited items per jurisdiction |
| `adapt_classification_weights` | Apply risk weight modifiers and restriction escalations |

**Jurisdiction Risk Modifiers:**
| Jurisdiction | Region | Regulatory Body | Risk Weight | Restricted |
|-------------|--------|-----------------|-------------|------------|
| SG | APAC | MAS | 1.0x | No |
| HK | APAC | HKMA/SFC | 1.0x | No |
| CN | APAC | PBOC/CSRC | 1.3x | Yes |
| IN | APAC | RBI/SEBI | 1.2x | No |
| LN | EMEA | FCA/PRA | 1.0x | No |
| AU | APAC | APRA/ASIC | 1.0x | No |
| VN | APAC | SBV | 1.4x | Yes |
| ID | APAC | OJK/BI | 1.2x | No |

---

## All 71 Tools — Detailed Reference

### Session Tools (2)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 1 | `session_create` | POST | Create a new agent conversation session. Returns session ID. |
| 2 | `session_log_message` | POST | Log a message in an existing session. Tracks role (user/assistant/system). |

**Tables:** `agent_sessions` (R/W), `agent_messages` (R/W)

---

### Ideation Tools (5)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 3 | `ideation_create_npa` | POST | Create a new NPA project. Generates ID format `NPA-{year}-{random}`. |
| 4 | `ideation_find_similar` | POST | Search historical NPAs by title/description with type and category filters. |
| 5 | `ideation_get_prohibited_list` | POST | Get 4-layer prohibited items from `ref_prohibited_items`. Filter by layer/severity. |
| 6 | `ideation_save_concept` | POST | Save concept notes, rationale, target market as form data with UPSERT. |
| 7 | `ideation_list_templates` | POST | List all NPA templates with section/field counts. |

**Tables:** `npa_projects` (R/W), `ref_prohibited_items` (R), `npa_form_data` (W), `ref_npa_templates` (R)

---

### Classification Tools (5)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 8 | `classify_assess_domains` | POST | Run 7-domain intake assessment (Strategic, Risk, Legal, Ops, Tech, Data, Client). Writes to both `npa_intake_assessments` and `npa_classification_assessments`. |
| 9 | `classify_score_npa` | POST | Generate classification scorecard (0-20). Determines tier: NPA_LITE / VARIATION / FULL. |
| 10 | `classify_determine_track` | POST | Set approval track. If PROHIBITED, sets status=STOPPED. |
| 11 | `classify_get_criteria` | POST | Get classification criteria reference data with category/type filters. |
| 12 | `classify_get_assessment` | POST | Retrieve all assessments, scorecards, and detailed criteria scores for an NPA. |

**Tables:** `npa_intake_assessments` (W), `npa_classification_assessments` (W), `npa_classification_scorecards` (W), `ref_classification_criteria` (R), `npa_projects` (R/W)

---

### AutoFill Tools (5)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 13 | `autofill_get_template_fields` | POST | Load full template structure: template → sections → fields with validation rules. |
| 14 | `autofill_populate_field` | POST | Write a single field value with lineage (AUTO/ADAPTED/MANUAL) and confidence score. |
| 15 | `autofill_populate_batch` | POST | Bulk-fill multiple fields in one call. |
| 16 | `autofill_get_form_data` | POST | Read all current form field values for an NPA. |
| 17 | `autofill_get_field_options` | POST | Get valid dropdown options for select-type fields. |

**Tables:** `npa_form_data` (R/W), `ref_npa_templates` (R), `ref_npa_sections` (R), `ref_npa_fields` (R), `ref_field_options` (R)

---

### Risk Tools (4)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 18 | `risk_run_assessment` | POST | Execute risk assessment across multiple domains. Writes to `npa_risk_checks`. Updates `npa_projects.risk_level`. |
| 19 | `risk_get_market_factors` | POST | Get all market risk factors with VaR/stress capture status. |
| 20 | `risk_add_market_factor` | POST | Add or update a market risk factor (IR_DELTA, FX_VEGA, CRYPTO_DELTA, etc.). |
| 21 | `risk_get_external_parties` | POST | Get external parties (vendors, counterparties) with tier breakdown. |

**Tables:** `npa_risk_checks` (W), `npa_market_risk_factors` (R/W), `npa_external_parties` (R), `npa_projects` (W)

---

### Governance Tools (5)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 22 | `governance_create_signoff_matrix` | POST | Generate sign-off requests per department based on routing rules. |
| 23 | `governance_get_signoffs` | POST | Get current sign-off status per department for an NPA. |
| 24 | `governance_record_decision` | POST | Record approve/reject/loop-back/abstain decision on a sign-off. |
| 25 | `governance_check_loopbacks` | POST | Check loop-back count. Triggers circuit breaker at 3+. |
| 26 | `governance_advance_stage` | POST | Advance NPA to next workflow stage with validation. |

**Tables:** `npa_signoffs` (R/W), `npa_loop_backs` (R/W), `npa_workflow_states` (R/W), `npa_projects` (R/W), `ref_signoff_routing_rules` (R)

---

### Audit Tools (4)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 27 | `audit_log_action` | POST | Write immutable audit entry with actor, reasoning, confidence, model version. |
| 28 | `audit_get_trail` | POST | Get chronological audit history with filters (action type, agent-only). |
| 29 | `check_audit_completeness` | POST | Verify all required lifecycle audit actions exist (NPA_CREATED, CLASSIFIED, etc.). |
| 30 | `generate_audit_report` | POST | Generate compliance report with timeline, actor summary, reasoning chains. |

**Tables:** `npa_audit_log` (R/W), `npa_projects` (R)

---

### NPA Data Tools (4)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 31 | `get_npa_by_id` | POST | Get full NPA with current workflow state and signoff summary. |
| 32 | `list_npas` | POST | List NPAs with filters (status, stage, risk, submitter) and pagination. |
| 33 | `update_npa_project` | POST | Update NPA fields (title, description, risk level, status, etc.). |
| 34 | `update_npa_predictions` | POST | Save ML predictions (confidence, timeline, risk) to NPA record. |

**Tables:** `npa_projects` (R/W), `npa_workflow_states` (R), `npa_signoffs` (R)

---

### Workflow Tools (5)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 35 | `get_workflow_state` | POST | Get current workflow state with stage history. |
| 36 | `advance_workflow_state` | POST | Progress to next stage with actor attribution. |
| 37 | `get_session_history` | POST | Get agent conversation history for a session. |
| 38 | `log_routing_decision` | POST | Record which agent was chosen and why. |
| 39 | `get_user_profile` | POST | Load user role, department, permissions by email. |

**Tables:** `npa_workflow_states` (R/W), `agent_sessions` (R), `agent_messages` (R), `npa_agent_routing_decisions` (W), `users` (R)

---

### Monitoring Tools (6)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 40 | `get_performance_metrics` | POST | Fetch volume, P&L, VaR, collateral metrics for an NPA. |
| 41 | `check_breach_thresholds` | POST | Compare latest metrics against thresholds. Returns breaches. |
| 42 | `create_breach_alert` | POST | Generate breach alert with severity (CRITICAL/WARNING). |
| 43 | `get_monitoring_thresholds` | POST | Load threshold definitions per project. |
| 44 | `get_post_launch_conditions` | POST | Get post-launch conditions with completion tracking. |
| 45 | `update_condition_status` | POST | Mark a condition as MET or OVERDUE. |

**Tables:** `npa_performance_metrics` (R), `npa_monitoring_thresholds` (R), `npa_breach_alerts` (R/W), `npa_post_launch_conditions` (R/W)

---

### Document Tools (4)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 46 | `upload_document_metadata` | POST | Record document upload metadata (name, type, size, status). |
| 47 | `check_document_completeness` | POST | Check if all required documents are uploaded for an NPA/stage. |
| 48 | `get_document_requirements` | POST | Get master list of document requirements by track/category. |
| 49 | `validate_document` | POST | Update document validation status (VALID/INVALID/WARNING) and stage. |

**Tables:** `npa_documents` (R/W), `ref_document_requirements` (R)

---

### Governance Extension Tools (6)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 50 | `get_signoff_routing_rules` | POST | Get routing rules: which departments sign off for which approval tracks. |
| 51 | `check_sla_status` | POST | Check SLA compliance for pending sign-offs. Identifies overdue. |
| 52 | `create_escalation` | POST | Trigger escalation to next authority. Writes to `npa_escalations` + audit log. |
| 53 | `get_escalation_rules` | POST | Get escalation authority matrix by level and trigger type. |
| 54 | `save_approval_decision` | POST | Record Checker/GFM COO/PAC approval decisions. |
| 55 | `add_comment` | POST | Post a comment (Q&A, clarification, system alert) on an NPA. |

**Tables:** `ref_signoff_routing_rules` (R), `npa_signoffs` (R), `npa_escalations` (W), `ref_escalation_rules` (R), `npa_approvals` (W), `npa_comments` (W), `npa_audit_log` (W)

---

### Risk Extension Tools (4)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 56 | `get_prerequisite_categories` | POST | Get prerequisite categories with individual check items. |
| 57 | `validate_prerequisites` | POST | Validate all prerequisites for an NPA against existing results. |
| 58 | `save_risk_check_result` | POST | Persist a single risk check layer result to `npa_risk_checks`. |
| 59 | `get_form_field_value` | POST | Read a specific form field value with its reference field definition. |

**Tables:** `ref_prerequisite_categories` (R), `ref_prerequisite_checks` (R), `npa_prerequisite_results` (R), `npa_risk_checks` (W), `npa_form_data` (R), `ref_npa_fields` (R)

---

### KB Search Tools (3)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 60 | `search_kb_documents` | POST | Keyword search over knowledge base documents. Returns title, content, source, relevance. |
| 61 | `get_kb_document_by_id` | POST | Retrieve a single KB document by ID. |
| 62 | `list_kb_sources` | POST | List all unique KB sources with document counts. |

**Tables:** `kb_documents` (R)

---

### Prospect Tools (2)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 63 | `get_prospects` | POST | List product opportunity pipeline with filters (status, priority). |
| 64 | `convert_prospect_to_npa` | POST | Promote a prospect to a formal NPA project record. |

**Tables:** `npa_prospects` (R/W), `npa_projects` (W)

---

### Dashboard Tools (1)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 65 | `get_dashboard_kpis` | POST | Executive KPI summary: total NPAs, active, pipeline value, risk distribution, SLA metrics. Optionally includes live computed stats. |

**Tables:** `npa_kpi_snapshots` (R), `npa_projects` (R), `npa_signoffs` (R)

---

### Notification Tools (3)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 66 | `get_pending_notifications` | POST | Aggregate unread notifications for a project (breach alerts, SLA, escalations). |
| 67 | `send_notification` | POST | Create a notification with type, severity, and message. Logged to audit trail. |
| 68 | `mark_notification_read` | POST | Mark notifications as acknowledged for a project+type. |

**Tables:** `npa_audit_log` (R/W), `npa_breach_alerts` (R), `npa_signoffs` (R), `npa_escalations` (R)

---

### Jurisdiction Tools (3)

| # | Tool | Method | Description |
|---|------|--------|-------------|
| 69 | `get_npa_jurisdictions` | POST | Get all jurisdictions linked to an NPA with regulatory body, region, risk modifier. |
| 70 | `get_jurisdiction_rules` | POST | Get rules, restrictions, and prohibited items for a specific jurisdiction code. |
| 71 | `adapt_classification_weights` | POST | Apply jurisdiction-based risk weight modifiers to classification scores. Auto-escalates restricted jurisdictions. |

**Tables:** `npa_jurisdictions` (R), `ref_prohibited_items` (R)

---

## Database Schema

### Table Categories

| Category | Count | Purpose |
|----------|-------|---------|
| **Core NPA** | 6 | Projects, forms, workflows, documents, comments, jurisdictions |
| **Classification & Risk** | 6 | Assessments, scorecards, risk checks, prerequisites, external parties, market risk |
| **Approval** | 4 | Sign-offs, loop-backs, approvals, escalations |
| **Monitoring** | 5 | Performance metrics, breach alerts, thresholds, conditions, KPIs |
| **Reference (Read-Only)** | 12 | Templates, fields, criteria, rules, prohibited items |
| **Agent Infrastructure** | 4 | Sessions, messages, routing decisions, KB documents |
| **Shared** | 3 | Users, audit log, prospects |
| **Other** | 2 | Market clusters, feature toggles |

### Key Tables and Their Agent Consumers

| Table | Reads | Writes | Description |
|-------|-------|--------|-------------|
| `npa_projects` | 10 agents | 5 agents | Central NPA record — the core entity |
| `npa_audit_log` | Audit Trail | ALL agents | Immutable compliance trail |
| `npa_form_data` | AutoFill, Risk, Diligence | AutoFill | 47-field NPA template data with lineage |
| `npa_signoffs` | Governance, Notification | Governance | Department-level sign-off tracking |
| `npa_risk_checks` | Risk | Risk | 4-layer risk validation results |
| `npa_escalations` | Notification, Audit | Governance, Monitoring | Escalation events with resolution |
| `npa_documents` | Risk, Doc Lifecycle | Doc Lifecycle | Document metadata with validation |
| `ref_prohibited_items` | Classification, Risk, Jurisdiction | — | 4-layer prohibited items (never written by agents) |
| `ref_classification_criteria` | Classification, Ideation | — | Scoring rubric with weights |
| `kb_documents` | KB Search (5+ consumers) | — | Knowledge base for RAG |

---

## API Reference

### Base URL
```
http://<host>:3002
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check with tool count |
| GET | `/tools` | List all tools with name, description, category |
| GET | `/openapi.json` | Full OpenAPI 3.0.3 specification (import into Dify) |
| POST | `/tools/{tool_name}` | Execute any tool by name |

### Request Format
```json
POST /tools/risk_run_assessment
Content-Type: application/json

{
  "project_id": "NPA-2026-1234",
  "risk_domains": [
    {"domain": "CREDIT", "status": "PASS", "score": 85, "findings": ["Low exposure"]},
    {"domain": "MARKET", "status": "WARN", "score": 60, "findings": ["FX vega uncaptured"]}
  ],
  "overall_risk_rating": "MEDIUM"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "project_id": "NPA-2026-1234",
    "assessments": [...],
    "overall_risk_rating": "MEDIUM",
    "domains_assessed": 2,
    "critical_domains": []
  },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": "NPA 'NPA-2026-9999' not found"
}
```

---

## Deployment

### OpenShift Deployment (Production)

**Prerequisites:**
- OpenShift cluster with Jenkins CI/CD
- External MariaDB VM with `npa_workbench` database
- Image registry (OpenShift internal or external)

**Files:**
```
server/mcp-python/
├── Dockerfile          # Python 3.12-slim, non-root, health check
├── Jenkinsfile         # Build → Push → Deploy → Verify
├── requirements.txt    # Pinned dependencies
└── openshift/
    ├── configmap.yaml  # REST_PORT, ENV, PUBLIC_URL
    ├── secret.yaml     # DB_HOST, DB_USER, DB_PASSWORD
    ├── deployment.yaml # Pod spec (liveness + readiness probes)
    ├── service.yaml    # ClusterIP on port 3002
    └── route.yaml      # TLS edge-terminated Route
```

**Configuration Required:**

| File | Field | What to set |
|------|-------|-------------|
| `openshift/secret.yaml` | `DB_HOST` | External MariaDB VM IP/hostname |
| `openshift/secret.yaml` | `DB_PASSWORD` | MariaDB password |
| `openshift/configmap.yaml` | `PUBLIC_URL` | OpenShift Route URL |
| `Jenkinsfile` | `REGISTRY` | Your container image registry |
| `Jenkinsfile` | `OC_PROJECT` | OpenShift project/namespace |

**Deploy via Jenkins:**
1. Push code to Git
2. Jenkins runs: Build Image → Push → Apply manifests → Verify rollout → Health check
3. Route URL is printed in Jenkins output

**Connect Dify:**
```
https://npa-mcp-server.apps.your-cluster.com/openapi.json
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | MariaDB hostname |
| `DB_PORT` | `3306` | MariaDB port |
| `DB_USER` | `npa_user` | Database user |
| `DB_PASSWORD` | `npa_password` | Database password |
| `DB_NAME` | `npa_workbench` | Database name |
| `REST_PORT` | `3002` | REST API listen port |
| `ENV` | `production` | Environment label |
| `PUBLIC_URL` | `http://localhost:3002` | Public-facing URL for OpenAPI spec |

### Health Check

```bash
curl https://your-route/health
```

```json
{
  "status": "ok",
  "server": "REST API for Dify",
  "tools": 71,
  "categories": ["ideation", "audit", "kb_search", "session", "workflow", ...],
  "openApiSpec": "https://your-route/openapi.json"
}
```

### Container Specs

| Attribute | Value |
|-----------|-------|
| **Base Image** | `python:3.12-slim` |
| **Image Size** | ~271 MB |
| **User** | Non-root (`appuser`) |
| **Port** | 3002 |
| **Health Check** | `GET /health` every 30s |
| **Liveness Probe** | `GET /health` (initial: 10s, period: 30s) |
| **Readiness Probe** | `GET /health` (initial: 5s, period: 10s) |
| **Resources** | Request: 100m CPU, 256Mi RAM / Limit: 500m CPU, 512Mi RAM |
