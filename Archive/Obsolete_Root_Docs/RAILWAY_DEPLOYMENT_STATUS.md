# Railway Deployment Status

> **Project:** COO Multi-Agent Workbench (`agent-command-hub-angular`)
> **Last Updated:** 2026-02-17
> **Railway Dashboard:** https://railway.com/project/f9a1e7d9-fb38-4b37-9d7f-64ec4c6177e2

---

## Deployed Services Overview

| # | Service | Stack | Port | Status |
|---|---------|-------|------|--------|
| 1 | COO Workbench UI + API | Angular 20 + Express 5 + Node 20 | 3000 | Deployed |
| 2 | MCP Tools Server | Python 3.12 + FastAPI | 3002 | Deployed |
| 3 | MySQL Database | Railway MySQL | 3306 (internal) / 19072 (public) | Active |

---

## Service 1: COO Workbench UI + Express API

### Deployment Configuration

| Property | Value |
|----------|-------|
| **Config File** | `railway.json` |
| **Builder** | Dockerfile (multi-stage) |
| **Dockerfile** | `Dockerfile` (project root) |
| **Start Command** | `node index.js` |
| **Health Check** | `/api/health` |
| **Health Check Timeout** | 120s |
| **Restart Policy** | ON_FAILURE (max 3 retries) |

### Build Process (Multi-Stage Docker)

- **Stage 1 (`angular-build`):** Node 20 Alpine — installs npm deps, runs `npx ng build --configuration production`
- **Stage 2 (`production`):** Node 20 Alpine — installs Express server deps (`--omit=dev`), copies server source + Angular dist output
- **Runtime:** `node server/index.js` on port 3000

### Frontend (Angular)

| Property | Value |
|----------|-------|
| **Framework** | Angular 20 |
| **Styling** | Tailwind CSS 3.4.19 + tailwindcss-animate |
| **Icons** | Lucide Angular 0.562.0 |
| **Markdown** | ngx-markdown 20.1.0 |
| **Components** | 30 components across 4 pages |
| **Test Framework** | Vitest 3.0 |

**Pages & Routes:**

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Command Center | Master COO global chat (LANDING + CHAT modes) |
| `/agents/npa` | NPA Agent | NPA workspace (DASHBOARD / IDEATION / WORK_ITEM) |
| `/agents/npa/readiness` | NPA Readiness | Readiness assessment view |
| `/agents/npa/classification` | NPA Classification | Classification scorecard |
| `/workspace/inbox` | Approval Dashboard | Inbox view |
| `/workspace/drafts` | Approval Dashboard | Drafts view |
| `/workspace/watchlist` | Approval Dashboard | Watchlist view |
| `/functions/npa` | COO NPA Dashboard | COO NPA Control Tower |

**Key Components (30 total):**
- 4 page components (Command Center, NPA Agent, Approval Dashboard, COO NPA Dashboard)
- 8 agent result components (Classification, Risk, ML Prediction, Autofill, Governance, Doc Completeness, Diligence, Monitoring)
- 7 dashboard components (NPA Dashboard, Pipeline Table, Process Tracker, Agent Health, Capability Card, Sub-Agent Card, Work Item List)
- 5 KPI/panel components (KPI Card, Audit Preview, Dependency Panel, Exceptions Panel, Live Agent Panel)
- 6 chat/utility components (Chat Interface, Orchestrator Chat, Document Matrix, Workflow Visualizer, Audit Log, Stage Progress)

### Backend (Express API)

| Property | Value |
|----------|-------|
| **Framework** | Express 5.2 |
| **Database Driver** | mysql2 3.16 |
| **HTTP Client** | Axios 1.7 |
| **Route Files** | 14 |

**API Routes:**

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Health check |
| `/api/npas` | NPA CRUD operations |
| `/api/governance` | Governance operations |
| `/api/approvals` | Approval workflows |
| `/api/dashboard` | Dashboard KPI data |
| `/api/audit` | Audit trail |
| `/api/classification` | Classification results |
| `/api/risk-checks` | Risk assessments |
| `/api/prerequisites` | Prerequisite validation |
| `/api/monitoring` | Post-launch monitoring |
| `/api/agents` | Agent management |
| `/api/users` | User management |
| `/api/dify` | Dify agent proxy (chat, workflow, conversations) |

### Dify Agent Integration

| Agent ID | Tier | Dify App | Type |
|----------|------|----------|------|
| `MASTER_COO` | T1 | CF_NPA_Orchestrator | Chatflow |
| `NPA_ORCHESTRATOR` | T2 | CF_NPA_Orchestrator | Chatflow |
| `IDEATION` | T3 | CF_NPA_Ideation | Chatflow |
| `CLASSIFIER` | T3 | WF_NPA_Classify_Predict | Workflow |
| `AUTOFILL` | T3 | WF_NPA_Autofill | Workflow |
| `ML_PREDICT` | T3 | WF_NPA_Classify_Predict | Workflow |
| `RISK` | T3 | WF_NPA_Risk | Workflow |
| `GOVERNANCE` | T3 | WF_NPA_Governance_Ops | Workflow |
| `DILIGENCE` | T3 | CF_NPA_Query_Assistant | Chatflow |
| `DOC_LIFECYCLE` | T3 | WF_NPA_Governance_Ops | Workflow |
| `MONITORING` | T3 | WF_NPA_Governance_Ops | Workflow |
| `KB_SEARCH` | T4 | CF_NPA_Query_Assistant | Chatflow |
| `NOTIFICATION` | T4 | WF_NPA_Governance_Ops | Workflow |

---

## Service 2: MCP Tools Server (Python)

### Deployment Configuration

| Property | Value |
|----------|-------|
| **Config File** | `server/mcp-python/railway.toml` |
| **Builder** | Dockerfile |
| **Dockerfile** | `server/mcp-python/Dockerfile` |
| **Start Command** | `python3 start.py` |
| **Health Check** | `/health` |
| **Health Check Timeout** | 60s |
| **Restart Policy** | ON_FAILURE (max 5 retries) |

### Live Endpoints

| Endpoint | URL |
|----------|-----|
| **Base URL** | `https://mcp-tools-server-production.up.railway.app` |
| **Health** | `https://mcp-tools-server-production.up.railway.app/health` |
| **OpenAPI Spec** | `https://mcp-tools-server-production.up.railway.app/openapi.json` |
| **Tools List** | `https://mcp-tools-server-production.up.railway.app/tools` |
| **MCP SSE** | `https://mcp-tools-server-production.up.railway.app/mcp/sse` |

### Docker Configuration

- **Base Image:** Python 3.12 Slim
- **Security:** Non-root user (`appuser`)
- **Health Check:** 30s interval, 5s timeout, 15s start period, 3 retries
- **Single port architecture:** REST API + MCP SSE both on port 3002

### Python Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.128.7 | REST API framework |
| uvicorn | 0.40.0 | ASGI server |
| mcp | 1.26.0 | MCP protocol (SSE transport) |
| aiomysql | 0.3.2 | Async MySQL driver |
| PyMySQL | 1.1.2 | MySQL driver |
| cryptography | 46.0.5 | SSL/TLS support |
| python-dotenv | 1.2.1 | Environment config |
| pydantic | 2.12.5 | Data validation |
| sse-starlette | 3.2.0 | SSE support |
| httpx-sse | 0.4.3 | SSE client |

### 71 MCP Tools (15 Categories)

| Category | Count | Key Tools |
|----------|-------|-----------|
| **ideation** | 7 | `ideation_create_npa`, `ideation_find_similar`, `ideation_get_prohibited_list`, `get_prospects` |
| **classification** | 5 | `classify_assess_domains`, `classify_score_npa`, `classify_determine_track`, `classify_get_criteria` |
| **governance** | 11 | `governance_get_signoffs`, `governance_create_signoff_matrix`, `governance_advance_stage`, `check_sla_status` |
| **risk** | 8 | `risk_run_assessment`, `risk_get_market_factors`, `validate_prerequisites`, `save_risk_check_result` |
| **documents** | 4 | `check_document_completeness`, `get_document_requirements`, `validate_document` |
| **monitoring** | 6 | `check_breach_thresholds`, `create_breach_alert`, `get_post_launch_conditions` |
| **workflow** | 5 | `get_workflow_state`, `advance_workflow_state`, `log_routing_decision`, `get_user_profile` |
| **audit** | 4 | `audit_log_action`, `audit_get_trail`, `check_audit_completeness` |
| **autofill** | 5 | `autofill_get_template_fields`, `autofill_populate_batch`, `autofill_get_form_data` |
| **npa_data** | 4 | `get_npa_by_id`, `list_npas`, `update_npa_project` |
| **kb_search** | 3 | `search_kb_documents`, `list_kb_sources` |
| **session** | 2 | `session_create`, `session_log_message` |
| **jurisdiction** | 3 | `get_jurisdiction_rules`, `adapt_classification_weights` |
| **notifications** | 3 | `send_notification`, `get_pending_notifications` |
| **dashboard** | 1 | `get_dashboard_kpis` |

---

## Service 3: Railway MySQL Database

### Connection Details

| Property | Value |
|----------|-------|
| **Internal Host** | `mysql.railway.internal:3306` |
| **Public Proxy** | `mainline.proxy.rlwy.net:19072` |
| **Database Name** | `railway` |
| **Total Tables** | 42 |
| **SSL** | Enabled (production mode auto-detects) |

### Database Tables (42)

**Core Tables (24):**
`npa_projects`, `npa_form_data`, `npa_signoffs`, `npa_approvals`, `npa_workflow_states`, `npa_documents`, `npa_classification_assessments`, `npa_classification_scorecards`, `npa_risk_checks`, `npa_intake_assessments`, `npa_post_launch_conditions`, `npa_market_clusters`, `npa_monitoring_thresholds`, `npa_performance_metrics`, `npa_breach_alerts`, `npa_escalations`, `npa_loop_backs`, `npa_comments`, `npa_external_parties`, `npa_market_risk_factors`, `npa_prerequisite_results`, `npa_agent_routing_decisions`, `npa_kpi_snapshots`, `npa_prospects`

**Reference Tables (12):**
`ref_npa_templates`, `ref_npa_fields`, `ref_npa_sections`, `ref_document_requirements`, `ref_document_rules`, `ref_classification_criteria`, `ref_prerequisite_categories`, `ref_prerequisite_checks`, `ref_prohibited_items`, `ref_signoff_routing_rules`, `ref_escalation_rules`, `ref_field_options`

**Agent & System Tables (6):**
`agent_sessions`, `agent_messages`, `kb_documents`, `users`, `npa_audit_log`, `npa_notifications`

### Seed Data

| Table | Records | Description |
|-------|---------|-------------|
| `npa_projects` | 12 | Sample NPA projects |
| `kb_documents` | 20 | Knowledge base documents |
| `ref_prohibited_items` | 9 | Prohibited product items |
| `ref_classification_criteria` | 28 | Classification criteria |
| `users` | 5+ | Test users |

---

## Architecture Diagram

```
                          Railway Cloud
 ┌──────────────────────────────────────────────────────────┐
 │                                                          │
 │  ┌─────────────────────┐    ┌────────────────────────┐   │
 │  │  COO Workbench UI   │    │  MCP Tools Server      │   │
 │  │  (Angular + Express)│    │  (Python + FastAPI)     │   │
 │  │                     │    │                         │   │
 │  │  Port: 3000         │    │  Port: 3002             │   │
 │  │  - Angular SPA      │    │  - 71 REST tools        │   │
 │  │  - Express API      │    │  - MCP SSE transport    │   │
 │  │  - Dify proxy       │    │  - OpenAPI spec         │   │
 │  └────────┬────────────┘    └────────────┬───────────┘   │
 │           │                              │               │
 │           │         ┌────────────┐       │               │
 │           │         │  MySQL DB  │       │               │
 │           └────────►│  42 tables ├◄──────┘               │
 │                     │  Port 3306 │                       │
 │                     └────────────┘                       │
 │                                                          │
 └──────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌─────────────────┐    ┌──────────────────┐
     │  Dify Cloud      │    │  End Users        │
     │  (Agent host)    │    │  (Browser)        │
     │  api.dify.ai     │    │                   │
     └─────────────────┘    └──────────────────┘
```

---

## Environment Variables

### MCP Tools Server (`server/mcp-python/.env`)

| Variable | Description | Railway Source |
|----------|-------------|---------------|
| `DB_HOST` | Database host | `${{MySQL.MYSQLHOST}}` |
| `DB_PORT` | Database port | `${{MySQL.MYSQLPORT}}` |
| `DB_USER` | Database user | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | Database password | `${{MySQL.MYSQLPASSWORD}}` |
| `DB_NAME` | Database name | `${{MySQL.MYSQLDATABASE}}` |
| `MCP_PORT` | MCP SSE port | 3001 |
| `REST_PORT` | REST API port | 3002 |
| `PUBLIC_URL` | Public-facing URL | Railway domain |
| `ENV` | Environment flag | `production` |

### Express Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `DIFY_BASE_URL` | Dify API base URL |
| `DIFY_KEY_*` | 13 Dify agent API keys |

---

## Security Notes

| Item | Current State | Target |
|------|---------------|--------|
| MCP Tools Server auth | Public (no auth) | API-key header auth |
| Database access | Railway internal + public proxy | Internal only (production) |
| SSL/TLS | Auto-enabled in production | Strict cert validation |
| Non-root container | Yes (MCP server) | Both services |
| CORS | Open (development) | Restrict to known origins |

---

## Alternative Deployment: OpenShift/Kubernetes

An OpenShift deployment configuration exists as a drop-in replacement at `server/mcp-python/openshift/`:

| File | Purpose |
|------|---------|
| `deployment.yaml` | Pod spec + replicas |
| `service.yaml` | ClusterIP service |
| `route.yaml` | External route (HTTPS) |
| `configmap.yaml` | Environment config |
| `secret.yaml` | Credentials |
| `Jenkinsfile` | CI/CD pipeline |

---

## Build Exclusions (`.railwayignore`)

The following are excluded from Railway builds:
`node_modules`, `dist`, `.angular`, `.git`, `.github`, `.claude`, `docs`, `Context`, `*.md`, `.vscode`, `__pycache__`, `.env`, `.env.*`, `docker`, `.sass-cache`, `coverage`

---

## Current Status & Pending Work

### Completed

- [x] Angular 20 frontend with 30 components, 4 pages, full routing
- [x] Express.js backend with 14 API route files
- [x] Python MCP Tools Server with 71 tools across 15 categories
- [x] Railway deployment for MCP Tools Server + MySQL (42 tables with seed data)
- [x] Railway deployment for Angular UI + Express API
- [x] Dify connected to MCP tools via OpenAPI/SSE
- [x] Multi-stage Docker builds for both services
- [x] Health check endpoints configured
- [x] OpenShift/Kubernetes alternative deployment ready

### Recently Completed (2026-02-17)

- [x] Dify agents created and wired: MASTER_COO, IDEATION, CLASSIFIER
- [x] Real agent routing working end-to-end (no more mock data)
- [x] CLASSIFIER auto-triggers after FINALIZE_DRAFT
- [x] Express crash protection (uncaughtException + unhandledRejection handlers)
- [x] Fallback users when MySQL unavailable
- [x] Fast-fail DB timeout (3s instead of 30s)
- [x] Stop button + Enter/Shift+Enter chat UX
- [x] ASGI Path Router preserved (prevents MCP CORS interference)
- [x] Comprehensive PROGRESS.md documentation

### Pending

- [ ] Create remaining Dify apps (AUTOFILL, RISK, GOVERNANCE, DILIGENCE, DOC_LIFECYCLE, MONITORING)
- [ ] Populate remaining `DIFY_KEY_*` environment variables
- [ ] Add API-key auth to MCP Tools Server
- [ ] Wire frontend result cards for remaining agents
- [ ] Implement SSE streaming for real-time token display
- [ ] Restrict CORS to known origins for production
- [ ] Strict SSL certificate validation
