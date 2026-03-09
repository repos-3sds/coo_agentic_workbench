# COO Multi-Agent Workbench

AI-powered **New Product Approval (NPA)** platform for banking operations. 18 AI agents orchestrate the end-to-end product approval lifecycle — from ideation through classification, risk assessment, governance sign-off, and post-launch monitoring.

> **New agent starting here?** → Read [`AGENT_ONBOARDING.md`](AGENT_ONBOARDING.md) first.

---

## Architecture

```
┌───────────────────────┐      ┌───────────────────────┐      ┌──────────────────┐
│   Angular Frontend     │      │  Express API           │      │  Dify Cloud       │
│   Angular 19 + TW      │─────▶│  Node.js (port 3000)   │─────▶│  (Agent Engine)   │
│                        │ /api │                        │ HTTPS│                   │
│  • Command Center (/)  │      │  • /api/dify/*         │      │  16 Dify Apps:    │
│  • NPA Agent Chat      │      │  • /api/agents/*       │      │  11 Chatflows +   │
│  • NPA Draft Builder   │      │  • /api/npas/*         │      │   5 Workflows     │
│  • Approval Dashboard  │      │  • 19 route modules    │      │  Claude 3.7 LLM   │
└───────────────────────┘      └───────────────────────┘      └──────────────────┘
                                         │
                                         │ MySQL (Railway)
                                         ▼
                                ┌──────────────────────┐
                                │  MariaDB / MySQL      │
                                │  Railway — Production │
                                │  ~42 tables           │
                                └──────────────────────┘
```

| Component | Tech | Hosting | Notes |
|-----------|------|---------|-------|
| **Frontend** | Angular 19, TailwindCSS | Render (static) | Served from `dist/` by Express |
| **Express API** | Node.js + Express 5 | Render (web service) | Dify proxy, NPA CRUD, sessions |
| **Database** | MariaDB / MySQL | Railway | Schema in `database/` |
| **Dify** | Dify Cloud | Cloud | 16 apps, Claude 3.7 Sonnet |

---

## Quick Start

### Prerequisites
- Node.js 18+, Angular CLI 19+
- Access to `server/.env` (Dify keys + DB credentials)

### 1. Express API
```bash
cd server
npm install
# obtain .env from team lead (Dify keys + Railway DB creds)
node index.js        # → http://localhost:3000
```

### 2. Angular Frontend
```bash
npm install
npx ng serve --port 4200   # proxies /api/* → localhost:3000 via proxy.conf.json
```

### 3. Verify
```bash
curl http://localhost:3000/api/dify/agents/health   # agent health check
curl http://localhost:3000/api/npas                 # NPA list from DB
```

---

## The 18 AI Agents

Defined in `server/config/dify-agents.js`. Config is the single source of truth.

| ID | Name | Dify App | Type | Tier |
|----|------|----------|------|------|
| `MASTER_COO` | Master COO Orchestrator | CF_COO_Orchestrator | chat | 1 |
| `NPA_ORCHESTRATOR` | NPA Domain Orchestrator | CF_NPA_Orchestrator | chat | 2 |
| `IDEATION` | Ideation Agent | CF_NPA_Ideation | chat | 3 |
| `CLASSIFIER` | Classification Agent | WF_NPA_Classify_Predict | workflow | 3 |
| `ML_PREDICT` | ML Prediction Agent | WF_NPA_Classify_Predict | workflow | 3 |
| `AUTOFILL` | Template AutoFill Agent | WF_NPA_Autofill | workflow | 3 |
| `RISK` | Risk Agent | WF_NPA_Risk | workflow | 3 |
| `GOVERNANCE` | Governance Agent | WF_NPA_Governance | workflow | 3 |
| `DILIGENCE` | Conversational Diligence | CF_NPA_Query_Assistant | chat | 3 |
| `DOC_LIFECYCLE` | Document Lifecycle Agent | WF_NPA_Doc_Lifecycle | workflow | 3 |
| `MONITORING` | Post-Launch Monitoring | WF_NPA_Monitoring | workflow | 3 |
| `KB_SEARCH` | KB Search Agent | CF_NPA_Query_Assistant | chat | 4 |
| `NOTIFICATION` | Notification Agent | WF_NPA_Notification | workflow | 4 |
| `AG_NPA_BIZ` | NPA Business Agent | CF_NPA_BIZ | chat | 3B |
| `AG_NPA_TECH_OPS` | NPA Tech & Ops Agent | CF_NPA_TECH_OPS | chat | 3B |
| `AG_NPA_FINANCE` | NPA Finance Agent | CF_NPA_FINANCE | chat | 3B |
| `AG_NPA_RMG` | NPA Risk Management Agent | CF_NPA_RMG | chat | 3B |
| `AG_NPA_LCS` | NPA Legal & Compliance Agent | CF_NPA_LCS | chat | 3B |

**Tier 3B agents** (AG_NPA_*) are standalone Chatflow apps wired to the **NPA Draft Builder** for section-level co-authoring. They use a special `universalDefaults` payload injection (see `server/routes/dify-proxy.js`).

---

## Project Structure

```
coo_agentic_workbench/
│
├── src/                          # Angular 19 frontend
│   └── app/
│       ├── pages/                # Route-level page components
│       │   ├── command-center/   # Landing + COO Agent chat (/)
│       │   ├── npa-agent/        # NPA agent hub (/agents/npa)
│       │   │   ├── npa-agent.component.ts        # Top-level NPA view switcher
│       │   │   ├── npa-draft-builder/            # 7-tab NPA form + agent chat
│       │   │   ├── npa-detail/                   # NPA lifecycle detail view
│       │   │   ├── npa-template-editor/          # Live NPA doc editor
│       │   │   └── classification-scorecard/     # Scorecard view
│       │   ├── approval-dashboard/       # Inbox / Drafts / Watchlist
│       │   ├── coo-npa/                  # COO NPA management view
│       │   ├── escalation-queue/         # Escalations page
│       │   ├── evergreen-dashboard/      # Product evergreen reviews
│       │   ├── pir-management/           # Post-Implementation Review
│       │   ├── bundling-assessment/      # Product bundling tool
│       │   └── document-manager/        # Document upload & status
│       │
│       ├── components/
│       │   ├── layout/           # MainLayout, sidebar, header
│       │   ├── shared/
│       │   │   └── agent-workspace/      # ⭐ Core chat component used by Command Center & NPA
│       │   ├── npa/              # NPA-specific components
│       │   │   ├── ideation-chat/        # Orchestrator chat (legacy, used in npa-detail)
│       │   │   ├── chat-interface/       # Wrapper for agent-workspace in NPA context
│       │   │   └── agent-results/        # Structured card renderers (classification, risk, etc.)
│       │   └── dashboard/        # Dashboard card components
│       │
│       ├── services/
│       │   ├── dify/dify.service.ts      # ⭐ Dify SSE client, agent switching, routing
│       │   ├── chat-session.service.ts   # Chat persistence (save/load sessions)
│       │   ├── npa.service.ts            # NPA CRUD HTTP calls
│       │   ├── approval.service.ts       # Approval workflow transitions
│       │   ├── user.service.ts           # Auth + user context (role-based)
│       │   └── layout.service.ts         # Sidebar/header state
│       │
│       └── lib/
│           ├── agent-interfaces.ts       # AGENT_REGISTRY, AgentAction types, 17 action enums
│           └── npa-template-definition.ts # 100+ NPA field definitions (sections I–VII)
│
├── server/                       # Express API (Node.js)
│   ├── index.js                  # ⭐ Server entry point — middleware, routes, error handling
│   ├── db.js                     # MySQL connection pool (Railway)
│   ├── config/
│   │   └── dify-agents.js        # ⭐ 18 agent registry with Dify API keys
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── routes/
│   │   ├── dify-proxy.js         # ⭐ Dify SSE collector, chat/workflow proxy, envelope parser
│   │   ├── agents.js             # Chat session CRUD (/api/agents/sessions)
│   │   ├── npas.js               # NPA CRUD + lifecycle API (62K LOC — most complex)
│   │   ├── transitions.js        # NPA stage machine + approval workflow (38K LOC)
│   │   ├── approvals.js          # Sign-off decisions, conditions, escalations
│   │   ├── governance.js         # Governance sign-off queries
│   │   ├── classification.js     # Classification data endpoints
│   │   ├── risk-checks.js        # Risk check results
│   │   ├── documents.js          # Document management
│   │   ├── monitoring.js         # Post-launch monitoring
│   │   ├── dashboard.js          # Dashboard stats aggregation
│   │   ├── escalations.js        # Escalation queue
│   │   ├── evergreen.js          # Evergreen review management
│   │   ├── pir.js                # PIR management
│   │   ├── bundling.js           # Bundling assessment
│   │   ├── audit.js              # Audit trail
│   │   ├── users.js              # User management
│   │   ├── prerequisites.js      # NPA prerequisites check
│   │   └── seed-npas.js          # DB seeding helper
│   └── jobs/
│       ├── sla-monitor.js        # Background: checks SLA breach every 15 min
│       └── agent-health.js       # Background: pings all 18 agents every 5 min
│
├── database/
│   ├── schema-only.sql           # 42 table DDL (no data)
│   ├── seed-data-only.sql        # Reference data + sample NPAs
│   └── npa_workbench_full_export.sql  # Full DB dump
│
├── Context/                      # AI agent prompts + knowledge (do NOT edit)
│   ├── Dify_Agent_Prompts/       # System prompts for each of the 18 agents
│   ├── Dify_Agent_KBs/           # Knowledge base content per agent
│   └── KB/                       # Regulatory docs, MAS notices, templates
│
├── docs/                         # Technical documentation
│   ├── PROGRESS.md               # Sprint progress tracker
│   ├── SHIPPING_CHECKLIST.md     # Delivery criteria
│   └── architecture/             # Architecture decision records
│
├── render.yaml                   # Render deployment (frontend + API as one service)
├── railway.json                  # Railway deployment config (DB)
├── Dockerfile                    # Docker build for Express + Angular dist
├── proxy.conf.json               # Angular dev proxy rules (/api → :3000)
└── AGENT_ONBOARDING.md           # ⭐ Start here for quick agent orientation
```

---

## API Routes

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/dify/chat` | `dify-proxy.js` | Stream chat to any of the 18 agents |
| `POST /api/dify/workflow` | `dify-proxy.js` | Run a workflow agent (CLASSIFIER, RISK etc.) |
| `GET /api/dify/agents/health` | `dify-proxy.js` | Health status of all 18 agents |
| `GET/POST /api/npas` | `npas.js` | NPA CRUD |
| `POST /api/npas/:id/transitions/*` | `transitions.js` | Stage machine transitions |
| `GET/POST /api/agents/sessions` | `agents.js` | Chat session persistence |
| `GET /api/dashboard/stats` | `dashboard.js` | COO dashboard KPIs |
| `GET /api/governance/*` | `governance.js` | Sign-off status queries |

---

## Key Environment Variables (`server/.env`)

```env
# Dify
DIFY_BASE_URL=https://api.dify.ai/v1

# Core agents (required for chat to work)
DIFY_KEY_MASTER_COO=app-...
DIFY_KEY_NPA_ORCHESTRATOR=app-...
DIFY_KEY_IDEATION=app-...
DIFY_KEY_CLASSIFIER=app-...

# Draft builder agents (Tier 3B)
DIFY_KEY_AG_NPA_BIZ=app-...
DIFY_KEY_AG_NPA_TECH_OPS=app-...
DIFY_KEY_AG_NPA_FINANCE=app-...
DIFY_KEY_AG_NPA_RMG=app-...
DIFY_KEY_AG_NPA_LCS=app-...

# Database (Railway)
DB_HOST=...
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=railway

JWT_SECRET=...
```

---

## Deployment

**Production:** Render (Express + Angular dist served together)
- Config: `render.yaml`
- Database: Railway MySQL (connection via env vars)
- Dify: Dify Cloud (api.dify.ai)

**Docker (local):**
```bash
docker compose up -d   # uses docker-compose.yml
```

---

## License

Proprietary — Internal use only.
