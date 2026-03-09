# Shipping Checklist — What to Share With Whom

## For DevOps / Infra Team (OpenShift Deployment)

**Goal:** Deploy the MCP Tools Server to OpenShift and connect it to the external MariaDB.

### Share These Files:
```
server/mcp-python/
├── Dockerfile                          # Build the container image
├── Jenkinsfile                         # CI/CD pipeline configuration
├── requirements.txt                    # Python dependencies
├── .env.example                        # Environment variable reference
├── openshift/
│   ├── deployment.yaml                 # Pod spec (probes, resources)
│   ├── service.yaml                    # ClusterIP service
│   ├── route.yaml                      # TLS Route
│   ├── configmap.yaml                  # Non-sensitive config
│   └── secret.yaml                     # DB credentials (template)
└── All *.py files + tools/ directory   # Application code
```

### Share This Document:
- `docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md` — Sections: **Overview, Architecture, API Reference, Deployment**

### They Need to Provide/Configure:
| Item | What | Where to set |
|------|------|-------------|
| MariaDB VM hostname | External DB IP/hostname | `openshift/secret.yaml` → `DB_HOST` |
| MariaDB credentials | User + password | `openshift/secret.yaml` → `DB_USER`, `DB_PASSWORD` |
| Container registry | Where to push Docker images | `Jenkinsfile` → `REGISTRY` |
| OpenShift namespace | Target project/namespace | `Jenkinsfile` → `OC_PROJECT` |
| Route hostname | Public URL (auto or custom) | `openshift/configmap.yaml` → `PUBLIC_URL` |

### Verification:
```bash
# After deployment, verify:
curl https://<route-url>/health
# Expected: {"status":"ok","tools":71,"categories":[...]}
```

---

## For DBA / Database Team

**Goal:** Ensure the MariaDB on the external VM has the correct schema and seed data.

### Share These Files:
```
database/
├── npa_workbench_full_export.sql       # Complete DB (schema + seed data) — use this
├── schema-only.sql                     # Just the 42 table DDL (if DB already has data)
├── seed-data-only.sql                  # Just the reference + sample data
├── seed-npa-001-digital-asset-custody.sql  # (Optional) Demo draft seeds
├── seed-npa-002-fx-put-option.sql          # (Optional) Demo draft seeds
├── seed-npa-003-green-bond-etf.sql         # (Optional) Demo draft seeds
├── seed-npa-004-capital-protected-note.sql # (Optional) Demo draft seeds
├── seed-npa-005-supply-chain-finance.sql   # (Optional) Demo draft seeds
├── apply-demo-seeds.sh                 # (Optional) Applies the demo seeds
└── migrations/                         # Incremental migration scripts
```

### Share This Document:
- `docs/database/database_schema.md` — Full table reference

### They Need to:
1. Ensure database `npa_workbench` exists
2. Import `npa_workbench_full_export.sql` (or schema + seed separately)
3. Create a dedicated user (e.g., `npa_user`) with read/write access
4. Ensure the MCP server pod can reach the MariaDB VM (network/firewall)
5. (Optional) Apply demo NPA draft seeds: run `database/apply-demo-seeds.sh` after migrations

---

## For AI / Dify Team (Agent Configuration)

**Goal:** Configure the 13 AI agents in Dify and connect them to the MCP Tools Server.

### Share These Documents:
- `docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md` — Sections: **Agent-to-Tool Mapping** (which tools each agent uses)
- `docs/dify-agents/DIFY_AGENT_SETUP_GUIDE.md` — Full Dify setup with prompts and tool assignments
- `docs/dify-agents/DIFY_CHATFLOW_NODE_GUIDE.md` — Chatflow node-by-node configuration
- `docs/dify-agents/Dify_Agent_Creation_Guide.md` — Step-by-step agent creation

### They Need to:
1. Import the OpenAPI spec in Dify: `https://<route-url>/openapi.json`
2. Create 13 agents with the tool assignments from the documentation
3. Configure each agent's system prompt per the setup guide
4. Set up the KB sources per `docs/knowledge-base/` documents

---

## For Architects / Tech Leads (Understanding)

**Goal:** Understand the full system design and how agents interact with tools and data.

### Share These Documents:
- `docs/architecture/AGENT_ARCHITECTURE.md` — Complete 13-agent, 4-tier design (**THE master doc**)
- `docs/mcp-server/MCP_TOOLS_DOCUMENTATION.md` — 71 tools detailed reference
- `README.md` — Project overview

### Key Sections in Architecture Doc:
- System Overview (system context diagram)
- 4-Tier Agent Hierarchy (who does what)
- Each Agent's Purpose, Tools, DB Tables, UI Reflection
- Database Table → Agent Dependency Matrix
- Complete MCP Tool Inventory

---

## For Frontend Team

**Goal:** Understand which Angular components reflect agent activity.

### Share These Documents:
- `docs/architecture/UI_CHANGES_FOR_AGENT_INTEGRATION.md` — Component-level integration guide
- `docs/architecture/AGENT_ARCHITECTURE.md` — Sections: **UI Reflection** (per agent)

---

## For Knowledge Base / Domain Experts

**Goal:** Review and maintain the RAG knowledge base content.

### Share These Documents:
```
docs/knowledge-base/
├── Dify_KB_Architecture_Strategy.md    # Overall KB design
├── KB_NPA_Approval_Matrix.md           # Approval rules
├── KB_NPA_Classification_Rules.md      # Classification criteria
├── KB_NPA_Policies.md                  # NPA policies
├── KB_NPA_State_Machine.md             # Workflow states
└── KB_NPA_Templates.md                 # Template definitions
```

Also:
```
Context/Dify_Agent_KBs/                 # Per-agent KB content files
Context/NPA_Golden_Sources/             # Reference source documents
```

---

## Quick Reference — Document Map

```
README.md                                   ← Everyone (project overview)
│
├── docs/architecture/
│   ├── AGENT_ARCHITECTURE.md               ← Architects, Tech Leads, AI Team
│   └── UI_CHANGES_FOR_AGENT_INTEGRATION.md ← Frontend Team
│
├── docs/mcp-server/
│   └── MCP_TOOLS_DOCUMENTATION.md          ← DevOps, Backend, AI Team
│
├── docs/dify-agents/
│   ├── DIFY_AGENT_SETUP_GUIDE.md           ← AI / Dify Team
│   ├── DIFY_CHATFLOW_NODE_GUIDE.md         ← AI / Dify Team
│   └── Dify_Agent_Creation_Guide.md        ← AI / Dify Team
│
├── docs/knowledge-base/
│   └── (7 KB documents)                    ← Domain Experts, AI Team
│
├── docs/database/
│   └── database_schema.md                  ← DBA Team
│
└── server/mcp-python/
    ├── Dockerfile + Jenkinsfile            ← DevOps
    └── openshift/                          ← DevOps
```
