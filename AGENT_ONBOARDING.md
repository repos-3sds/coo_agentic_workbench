# Agent Onboarding Guide — COO Multi-Agent Workbench

> **Read this first if you're a new AI agent (or developer) starting work on this project.**
> **Last updated:** 9 Mar 2026 · **Branch:** `feature/gfm-dce-mcp-orchestrator`

This document tells you everything you need to know to navigate the codebase quickly and correctly. No guessing required.

---

## What This Project Does

This is the **COO Multi-Agent Workbench** — a banking operations platform that automates two core processes using AI agents:

1. **NPA (New Product Approval)** — formal approval lifecycle for launching new financial products (18 agents)
2. **DCE (Digital Client Engagement)** — corporate account opening workflow with 7 sub-agents + orchestrator

The COO Command Center at `/` is the unified hub where operators can switch between NPA and DCE domain agents, browse templates, and chat.

---

## Core Technology

| Layer | Tech | Where |
|-------|------|--------|
| Frontend | Angular 19, TailwindCSS 3, Lucide Icons | `src/` |
| Backend API | Node.js + Express 4 | `server/` |
| AI Engine | Dify Cloud (Claude 3.7 Sonnet) | External |
| MCP Server | DCE MCP on Railway (JSON-RPC 2.0) | External |
| Database | MySQL/MariaDB | Railway (production) |
| Deployment | Render (API + frontend) | `render.yaml` |

---

## Quick Start

```bash
git clone https://github.com/repos-3sds/coo_agentic_workbench.git
cd coo_agentic_workbench
git checkout feature/gfm-dce-mcp-orchestrator
npm install

# Angular dev server (port 4200)
ng serve

# Express backend (port 3000) — optional, mock fallbacks work without it
cd server && node index.js
```

> **No backend needed for demo.** Every DCE API call has `catchError(() => of(mockData))` fallback. The UI renders fully with mock data.

---

## The 5 Files You Must Read

1. **`server/config/dify-agents.js`** — All 18 NPA agents, Dify API keys, app mapping
2. **`server/routes/dify-proxy.js`** — NPA chat/workflow proxy, SSE streaming, retry logic
3. **`server/routes/dce.js`** — DCE MCP proxy routes (JSON-RPC 2.0 → Railway)
4. **`src/app/services/dce.service.ts`** — DCE Angular service: 25+ interfaces, 15 API methods, mock fallbacks
5. **`src/app/services/dify/dify.service.ts`** — NPA agent conversation state, streaming pipeline

---

## Route Map

### NPA Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | AgentWorkspaceComponent | COO Command Center (overview + templates + chat) |
| `/agents/npa` | NpaAgentComponent | NPA hub: Dashboard / Ideation / Draft Builder |
| `/workspace/inbox` | InboxComponent | Action items & approvals |

### DCE Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/agents/dce` | DceAgentComponent | DCE hub: Dashboard / Intake / Work Item |
| `/agents/dce?mode=create` | → INTAKE view | Multi-channel case creation |
| `/agents/dce?mode=detail&caseId=X` | → WORK_ITEM view | 9-tab case detail |
| `/functions/dce` | DceDashboardComponent | Operations Control Tower |
| `/functions/dce/cases` | DceCaseListComponent | Paginated case browser |

> **Routing rule:** All case-click navigation routes to `/agents/dce?mode=detail&caseId=X` (full work item), **not** to `/functions/dce/cases/:id` (legacy basic detail).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Angular 19 Frontend                          │
│                                                                     │
│  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐│
│  │ Command Center│  │  NPA Agent  │  │  DCE Agent  │  │ Control   ││
│  │ (Overview +   │  │  Dashboard  │  │  Dashboard  │  │ Tower     ││
│  │  Templates +  │  │  Ideation   │  │  Intake     │  │           ││
│  │  Chat)        │  │  Draft Bldr │  │  Work Item  │  │           ││
│  └──────────────┘  └─────────────┘  └─────────────┘  └───────────┘│
│         │                  │                │                       │
│   DifyService        DifyService       DceService                  │
│         │                  │                │                       │
└─────────┼──────────────────┼────────────────┼──────────────────────┘
          │                  │                │
          ▼                  ▼                ▼
   ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐
   │ Dify Cloud  │  │ Express      │  │ Express Proxy    │
   │ (NPA agents)│  │ /api/dify/*  │  │ /api/dce/*       │
   └─────────────┘  └──────────────┘  │       │          │
                                      │  MCP JSON-RPC    │
                                      └───────┼──────────┘
                                              ▼
                                      ┌──────────────────┐
                                      │ Railway DCE MCP  │
                                      │ SA-1→SA-7 tools  │
                                      └──────────────────┘
```

---

## Understanding the NPA Agents (18 total)

```
Tier 1 (Strategic)
  MASTER_COO          → CF_COO_Orchestrator      [chat] — entry point

Tier 2 (Domain)
  NPA_ORCHESTRATOR    → CF_NPA_Orchestrator       [chat] — routes within NPA

Tier 3 (Specialist)
  IDEATION            → CF_NPA_Ideation           [chat]
  CLASSIFIER          → WF_NPA_Classify_Predict   [workflow]
  AUTOFILL            → WF_NPA_Autofill           [workflow]
  RISK                → WF_NPA_Risk               [workflow]
  GOVERNANCE          → WF_NPA_Governance         [workflow]
  DILIGENCE           → CF_NPA_Query_Assistant    [chat]
  DOC_LIFECYCLE       → WF_NPA_Doc_Lifecycle      [workflow]
  MONITORING          → WF_NPA_Monitoring         [workflow]

Tier 3B (Draft Builder Sign-Off Agents)
  AG_NPA_BIZ          → CF_NPA_BIZ               [chat]
  AG_NPA_TECH_OPS     → CF_NPA_TECH_OPS          [chat]
  AG_NPA_FINANCE      → CF_NPA_FINANCE           [chat]
  AG_NPA_RMG          → CF_NPA_RMG               [chat]
  AG_NPA_LCS          → CF_NPA_LCS               [chat]

Tier 4 (Utilities)
  KB_SEARCH           → CF_NPA_Query_Assistant   [chat]
  NOTIFICATION        → WF_NPA_Notification      [workflow]
```

---

## Understanding the DCE Agents (8 total)

### Agent Registry

**File:** `shared/agent-registry.json`

| ID | Name | Role | Node | Dify App | Type |
|----|------|------|------|----------|------|
| `DCE_ORCHESTRATOR` | DCE Orchestrator | Routes N-0 → N-6 | All | `WF_DCE_Orchestrator` | workflow |
| `DCE_SA1` | Intake & Triage | Classification, SLA | N-0 | `WF_DCE_SA1_Intake_Triage` | workflow |
| `DCE_SA2` | Document Collection | Checklist, OCR | N-1 | `WF_DCE_SA2_Document_Collection` | workflow |
| `DCE_SA3` | Signature Verification | AI compare, HITL | N-2 | `WF_DCE_SA3_Signature` | workflow |
| `DCE_SA4` | KYC/CDD Prep | Screening, brief | N-3 | `AG_DCE_SA4_KYC` | agent |
| `DCE_SA5` | Credit Prep | Financials, ratios | N-4 | `WF_DCE_SA5_Credit` | workflow |
| `DCE_SA6` | Static Config | UBIX/SIC/CreditView | N-5 | `WF_DCE_SA6_Config` | workflow |
| `DCE_SA7` | Notification | Welcome kit, creds | N-6 | `WF_DCE_SA7_Notify` | workflow |

### Pipeline Flow

```
N-0 (SA-1 Intake) → N-1 (SA-2 Docs) → [HITL] → N-2 (SA-3 Signatures)
  → [HITL] → N-3 (SA-4 KYC) → [HITL] → N-4 (SA-5 Credit)
  → [HITL] → N-5 (SA-6 Config) → N-6 (SA-7 Notify) → DONE
```

Each HITL gate blocks pipeline until a human reviewer approves/rejects.

---

## DCE Service — API Contracts

**File:** `src/app/services/dce.service.ts` (751 lines)

### Core Interfaces

```typescript
interface DceCaseState {
    case_id: string;
    client_name: string;
    case_type: string;        // 'Corporate' | 'Individual' | 'Joint'
    status: string;           // 'ACTIVE' | 'HITL_PENDING' | 'ESCALATED' | 'DONE' | 'DEAD'
    priority: string;         // 'URGENT' | 'STANDARD' | 'DEFERRED'
    jurisdiction: string;     // 'SGP' | 'HKG' | 'CHN'
    current_node: string;     // 'N-0' through 'N-6', or 'HITL_RM'
    completed_nodes: string[];
    failed_nodes: string[];
    sla_deadline: string;
    created_at: string;
    updated_at: string;
}

interface DceCaseDetailResponse {
    case_state: DceCaseState;
    classification: DceClassification;
    checkpoints: DceCheckpoint[];
    rm_hierarchy: DceRmHierarchy;
    completeness_assessment: DceCompletenessAssessment;
}
```

### API Methods → Express → MCP Tool Mapping

| DceService Method | HTTP | Express Endpoint | MCP Tool | Returns |
|-------------------|------|------------------|----------|---------|
| `listCases(filters)` | GET | `/api/dce/cases` | `dce_list_cases` | `{ cases, total }` |
| `getCaseDetail(id)` | GET | `/api/dce/cases/:id` | `dce_get_case` | `DceCaseDetailResponse` |
| `getCaseDocuments(id)` | GET | `/api/dce/cases/:id/documents` | `sa2_get_documents` | `{ documents, checklist }` |
| `getCaseEvents(id)` | GET | `/api/dce/cases/:id/events` | `dce_get_events` | `{ events, notifications }` |
| `getSignatureVerification(id)` | GET | `/api/dce/cases/:id/signatures` | `sa3_get_verification_status` | `DceSignatureVerification` |
| `getKycBrief(id)` | GET | `/api/dce/cases/:id/kyc` | `sa4_get_kyc_brief` | `DceKycBrief` |
| `getCreditBrief(id)` | GET | `/api/dce/cases/:id/credit` | `sa5_get_credit_brief` | `DceCreditResponse` |
| `getConfigSpec(id)` | GET | `/api/dce/cases/:id/config` | `sa6_get_config_spec` | `DceConfigResponse` |
| `getDashboardKpis()` | GET | `/api/dce/dashboard/kpis` | `dce_dashboard_kpis` | KPI metrics |
| `createCase(data)` | POST | `/api/dce/cases` | `dce_create_case` | `{ case_id }` |
| `submitSignatureDecision(id, d)` | POST | `/api/dce/cases/:id/hitl/N-2/decide` | `sa3_submit_decision` | status |
| `submitKycDecision(id, d)` | POST | `/api/dce/cases/:id/hitl/N-3/decide` | `sa4_submit_decision` | status |
| `submitCreditDecision(id, d)` | POST | `/api/dce/cases/:id/hitl/N-4/decide` | `sa5_submit_decision` | status |
| `submitConfigDecision(id, d)` | POST | `/api/dce/cases/:id/hitl/N-5/decide` | `sa6_submit_decision` | status |

### Mock Fallback Pattern

Every GET endpoint has `catchError` fallback:

```typescript
getCaseDetail(caseId: string): Observable<DceCaseDetailResponse> {
    return this.http.get<DceCaseDetailResponse>(`${this.baseUrl}/cases/${caseId}`).pipe(
        catchError(() => of(this._mockCaseDetail(caseId)))
    );
}
```

---

## DCE Component Hierarchy

```
DceAgentComponent                              # src/app/pages/dce-agent/
├── DceAgentDashboardComponent                 # dce-agent-dashboard/
│   └── DcePipelineTableComponent              # dce-pipeline-table.component.ts
├── DceIntakeFormComponent                     # dce-intake-form/ (Portal/Email/API)
└── DceWorkItemComponent                       # dce-work-item/ (9 tabs)
    ├── DceDagVisualizerComponent              # components/dce/dce-dag-visualizer
    ├── DceHitlReviewPanelComponent            # components/dce/dce-hitl-review-panel
    ├── DceAoFormComponent (overlay)           # components/dce/dce-ao-form/
    │   └── AoFormProgressComponent
    └── OrchestratorChatComponent
```

---

## DCE Work Item — 9-Tab Detail View

**Files:** `dce-work-item.component.ts` (639 lines) + `dce-work-item.component.html` (1267 lines)

| Tab | ID | Data Source | Badge |
|-----|----|-------------|-------|
| Overview | `OVERVIEW` | caseData, classification, RM, completeness | — |
| Docs | `DOCUMENTS` | stagedDocuments, checklistItems | `n/m` |
| Signatures | `SIGNATURES` | signatureData (SA-3) | pending count |
| KYC | `KYC` | kycBrief (SA-4) | `HITL` if N-3 |
| Credit | `CREDIT` | creditResponse (SA-5) | `HITL` if N-4 |
| Config | `CONFIG` | configResponse (SA-6) | `HITL` if N-5 |
| Pipeline | `PIPELINE` | dagNodes[] | — |
| Events | `EVENTS` | events[], notifications[] | count |
| Chat | `CHAT` | OrchestratorChatComponent | — |

### Data Loading

All loads happen in parallel on init. Each uses `catchError → mock fallback` from `dce-mock-data.ts`.

### AO Form Overlay

Opens from Overview tab as fullscreen overlay (z-200). 3-panel layout:
- Left: section navigation (w-72)
- Center: scrollable form (flex-1)
- Right: assistant panel (w-96, collapsible to w-12) with Chat/Sources/Issues tabs

---

## DCE AO Form — 16 Sections

**Config:** `src/app/components/dce/dce-ao-form/dce-ao-form.config.ts`

| # | Section | Source Agents | Conditional? |
|---|---------|---------------|-------------|
| 1 | Corporate Information | SA-1, SA-4 | Always |
| 2 | Account Relationships | SA-1, SA-4 | Always |
| 3 | Products & Services | SA-1, SA-5, SA-6 | Always |
| 4 | Customer Declaration | SA-3 | Always |
| 5 | Authorized Persons | SA-3, SA-6 | Always |
| S1 | Risk Disclosure – SFA | SA-3 | Always |
| S2 | Risk Disclosure – CTA | SA-3 | Always |
| S3 | Execution-Only | SA-3 | Always |
| S4 | Consent to Act | SA-3, SA-6 | Always |
| S5 | Auto Currency Conversion | SA-6 | Always |
| S7A | Registration & Clearing | SA-6 | FUTURES/OPTIONS |
| S8A | LME Metals | SA-6 | COMMODITIES |
| S9 | Deliverable Commodities | SA-6 | COMMODITIES |
| S10 | Electronic Statements | SA-6 | Always |
| S11A | Electronic Instructions | SA-6, SA-3 | Always |
| S12 | Bank Account Details | SA-6 | Always |

### Form Field Value Shape

```typescript
interface AoFormFieldValue {
    value: any;
    fillStatus: 'FILLED' | 'PENDING' | 'REQUIRES_ACTION' | 'NOT_APPLICABLE';
    confidence: number | null;   // 0-100
    filledBy: 'SA-1' | 'SA-2' | ... | 'SA-7' | 'MANUAL' | null;
    filledAt: string | null;
    notes: string | null;
}
```

---

## HITL Decision Gates

**File:** `src/app/components/dce/dce-hitl-review-panel.component.ts`

| Gate | Node | Task Type | Reviewer | Key Decision Fields |
|------|------|-----------|----------|---------------------|
| 1 | N-2 | `SIGNATURE_REVIEW` | OPS_CHECKER | specimen match, authority confirmed |
| 2 | N-3 | `KYC_CDD_REVIEW` | RM | risk rating, CDD clearance, BCAP, CAA |
| 3 | N-4 | `CREDIT_REVIEW` | CREDIT_TEAM | limit, credit class, margin %, collateral |
| 4 | N-5 | `TMO_STATIC_REVIEW` | TMO | config verified, SIC code, CreditView ID |

Actions: Approve, Reject, Clarify, Escalate, Nudge. Each includes SLA tracking with progress bar.

---

## MCP Wiring Checklist (for the agent with MCP/DB access)

### Step 1: Environment

```env
# server/.env
DCE_MCP_SERVER_URL=https://<railway-url>/mcp
DCE_MCP_AUTH_TOKEN=<token>
```

### Step 2: Verify MCP Tools

```bash
# Test list cases
curl -X POST $DCE_MCP_SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"dce_list_cases","arguments":{"limit":5}}}'

# Test get case
curl -X POST $DCE_MCP_SERVER_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"dce_get_case","arguments":{"case_id":"DCE-2026-0042-SGP-001"}}}'
```

### Step 3: Wire Express Routes (Priority Order)

**Phase 1 — Core (gets demo working):**
1. `GET /api/dce/cases` → `dce_list_cases`
2. `GET /api/dce/cases/:id` → `dce_get_case`
3. `GET /api/dce/cases/:id/documents` → `sa2_get_documents`
4. `GET /api/dce/cases/:id/events` → `dce_get_events`

**Phase 2 — SA Tabs:**
5. `GET /api/dce/cases/:id/signatures` → `sa3_get_verification_status`
6. `GET /api/dce/cases/:id/kyc` → `sa4_get_kyc_brief`
7. `GET /api/dce/cases/:id/credit` → `sa5_get_credit_brief`
8. `GET /api/dce/cases/:id/config` → `sa6_get_config_spec`

**Phase 3 — HITL Decisions:**
9. `POST /hitl/N-2/decide` → `sa3_submit_decision`
10. `POST /hitl/N-3/decide` → `sa4_submit_decision`
11. `POST /hitl/N-4/decide` → `sa5_submit_decision`
12. `POST /hitl/N-5/decide` → `sa6_submit_decision`

### Step 4: Validate Response Shapes

Compare your MCP output with mock data in `src/app/pages/dce-agent/dce-work-item/dce-mock-data.ts`.

**`dce_get_case` must return:**
```json
{
    "case_state": { "case_id": "...", "client_name": "...", "status": "ACTIVE", "current_node": "N-2", ... },
    "classification": { "account_type": "Corporate – Multi-Currency", "confidence": 0.94, ... },
    "checkpoints": [...],
    "rm_hierarchy": { "rm_name": "Sarah Chen", "rm_email": "...", ... },
    "completeness_assessment": { "overall_percent": 87.5, ... }
}
```

**`sa4_get_kyc_brief` must return:**
```json
{
    "entity_summary": { "registered_name": "...", "entity_type": "Corporate", ... },
    "ownership_chain": { "ubo_names": [...], ... },
    "screening_results": { "sanctions_clear": true, "pep_matches": [...], ... },
    "risk_indicators": { "overall_risk": "MEDIUM", ... },
    "rm_decisions": { "kyc_risk_rating": null, "cdd_clearance": null, ... }
}
```

### Step 5: Database Schema

The frontend expects these fields:

**Cases:** `case_id, client_name, case_type, status, priority, jurisdiction, current_node, completed_nodes (JSON), failed_nodes (JSON), sla_deadline, created_at, updated_at`

**Documents:** `doc_id, case_id, filename, source, upload_status, file_size_bytes, matched_checklist_item, confidence, uploaded_at`

**Events:** `event_id, case_id, event_type, node_id, agent_id, summary, details (JSON), timestamp`

**HITL Tasks:** `task_id, case_id, node_id, task_type, status, assigned_persona, assigned_name, sla_deadline, decision (JSON), created_at, updated_at`

### Step 6: Remove Mocks When Ready

Remove `catchError` fallbacks in `dce.service.ts` once MCP is stable.

### Step 7: Wire AO Form Chat

The right panel Chat tab uses simulated responses. Wire to DifyService:

```typescript
// In dce-ao-form.component.ts → sendChatMessage():
this.difyService.sendMessage(this.selectedChatAgent, msg, this.caseId)
    .subscribe(response => {
        this.agentChatMessages.push({ role: 'agent', content: response.answer });
    });
```

---

## NPA-Specific Files

| File | Purpose |
|------|---------|
| `src/app/pages/npa-agent/npa-agent.component.ts` | NPA hub: DASHBOARD / IDEATION / WORK_ITEM |
| `src/app/pages/npa-agent/npa-draft-builder/` | 7-tab form with per-section Dify agents |
| `src/app/lib/agent-interfaces.ts` | AGENT_REGISTRY, AgentAction enum (17 types) |
| `src/app/lib/npa-template-definition.ts` | 100+ NPA form field definitions |
| `server/config/dify-agents.js` | 18 agent Dify API key mapping |
| `server/routes/dify-proxy.js` | Dify SSE proxy, streaming, retry |
| `server/routes/npas.js` | NPA CRUD (62K file) |
| `server/routes/transitions.js` | NPA stage machine |

---

## DCE-Specific Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/services/dce.service.ts` | 751 | Central service: interfaces, API, mocks, helpers |
| `src/app/pages/dce-agent/dce-agent.component.ts` | 138 | Container: Dashboard / Intake / WorkItem |
| `src/app/pages/dce-agent/dce-work-item/dce-work-item.component.ts` | 639 | 9-tab detail view with HITL |
| `src/app/pages/dce-agent/dce-work-item/dce-work-item.component.html` | 1267 | Full template for all tabs |
| `src/app/pages/dce-agent/dce-work-item/dce-mock-data.ts` | ~500 | Mock data for all tabs |
| `src/app/pages/dce-agent/dce-intake-form/dce-intake-form.component.ts` | ~400 | Multi-channel intake |
| `src/app/pages/dce-agent/dce-agent-dashboard/dce-agent-dashboard.component.ts` | ~500 | Agent landing page |
| `src/app/components/dce/dce-ao-form/dce-ao-form.component.ts` | 642 | 3-panel AO form + right sidebar |
| `src/app/components/dce/dce-ao-form/dce-ao-form.config.ts` | 347 | 16 section definitions |
| `src/app/components/dce/dce-ao-form/dce-ao-form.interfaces.ts` | 63 | Form TypeScript types |
| `src/app/components/dce/dce-ao-form/dce-ao-form-mock.ts` | 186 | Mock data builder |
| `src/app/components/dce/dce-dag-visualizer.component.ts` | ~250 | Pipeline DAG visual |
| `src/app/components/dce/dce-hitl-review-panel.component.ts` | ~350 | HITL decision panel |
| `server/routes/dce.js` | ~200 | Express MCP proxy |
| `shared/agent-registry.json` | ~120 | DCE agent metadata |

---

## Command Center Integration

**File:** `src/app/components/shared/agent-workspace/agent-workspace.component.ts`

The Command Center at `/` includes:
- **Domain Agent pills:** NPA Agent + DCE Agent (top-level filter for template view)
- **Vertical sub-category sidebar** when in Template mode
- **Quick hint chips** (2 per domain): "Create an NPA", "Risk check", "Open DCE Account", "KYC screening"
- **Suggestion chips** in chat empty state: 4 NPA + 4 DCE with domain badges
- **Landing page cards**: Functional Agents card links to `/agents/dce`, DCE Cases links to `/functions/dce`
- **DCE Templates**: 8 categories with 30+ prompt templates in `agent-workspace-templates.ts`

---

## Testing Playbook

### Demo Walkthrough (No Backend)

1. `http://localhost:4200/` → Command Center
2. Click **"DCE Account Opening"** card → `/agents/dce`
3. Click case in pipeline or **"Chat with Agent"** → work item
4. Walk tabs: Overview → Docs → Signatures → KYC → Credit → Config → Pipeline → Events
5. Overview tab → **"Open AO Form"** → 3-panel form
6. Right panel: Chat (select agents), Sources (field mapping), Issues (pending fields)
7. Toggle collapse/expand on right panel
8. HITL banner on Overview → "View" → relevant tab with decision panel

### Build Verification

```bash
ng build    # must produce 0 errors
```

---

## What NOT to Edit

| Path | Reason |
|------|--------|
| `Context/Dify_Agent_Prompts/` | Dify-deployed prompts — update in Dify too |
| `Context/Dify_Agent_KBs/` | Knowledge base source docs |
| `DCE Agents Arc/` | Reference architecture docs for DCE agent setup |
| `dist/` | Auto-generated build artifact |

---

## Common Tasks

### "I need to add a new DCE sub-agent"
1. Add entry to `shared/agent-registry.json`
2. Add MCP tool routes in `server/routes/dce.js`
3. Add service methods + interfaces in `src/app/services/dce.service.ts`
4. Add tab or section in work item component
5. Add form sections in `dce-ao-form.config.ts` if it populates AO form fields

### "The case detail shows mock data instead of live data"
- Check Express server is running (`cd server && node index.js`)
- Check `DCE_MCP_SERVER_URL` env var is set
- Test MCP tool directly with curl (see wiring checklist above)
- The `catchError` in `dce.service.ts` silently falls back to mocks

### "I need to add fields to the AO Form"
1. Add field definitions in `dce-ao-form.config.ts` under the relevant section
2. Add mock values in `dce-ao-form-mock.ts` → `buildAoFormData()`
3. The form renders fields dynamically from config — no template changes needed

### "I need to add a new HITL gate"
1. Add `DceDecisionField[]` array for the new gate's form fields
2. Add submit method in `dce.service.ts`
3. Add Express route + MCP tool mapping in `server/routes/dce.js`
4. Add handler in `dce-work-item.component.ts` → `handleHitlApprove()`
