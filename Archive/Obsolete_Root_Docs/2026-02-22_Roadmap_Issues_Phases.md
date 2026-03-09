# COO Multi-Agent Workbench — Roadmap, Issues & Phase Plan
**Date**: 2026-02-22
**Status**: Brutally Honest Assessment + Phase-wise Execution Plan

---

## SECTION A: CURRENT STATE — GAP ANALYSIS

### A1. What Actually Works (Real)
| Component | Status | Notes |
|-----------|--------|-------|
| Chat tab (Orchestrator) | REAL | Live Dify chat with conversation persistence |
| Agent wave orchestration | REAL | RISK → CLASSIFIER+ML → AUTOFILL+GOVERNANCE → DOC+MONITORING |
| DB persistence layer | PARTIAL | Agent results persist but autofill field save is unreliable |
| Template Editor (Doc/Form views) | REAL | Save works, field editing works |
| AUTOFILL Live stream | PARTIAL | Streams 53 fields but only 8 map to template (key mismatch) |
| Dify proxy (server) | REAL | Chat + workflow endpoints with 502/503/504 retry logic |
| Backend API routes | REAL | 19 route files, ~60+ endpoints (npas, documents, approvals, etc.) |
| Document upload endpoint | EXISTS | `POST /documents/npas/:id/upload` with multer — exists but UI not wired |
| Approval endpoints | EXISTS | `server/routes/approvals.js` — exists but UI not wired |

### A2. What's Fake / Mock / Broken

#### CRITICAL — User-Facing Lies
| # | Problem | Severity | Tab |
|---|---------|----------|-----|
| P1 | Document Preview (left panel) is 100% mock — fake PDF skeleton, hardcoded filenames, no viewer | CRITICAL | All |
| P2 | Workflow tab is 100% hardcoded — fake stages, fake assignees ("Sarah Lim", "Jane Tan"), fake dates | CRITICAL | Workflow |
| P3 | Approve & Sign-Off, Reject, Save Draft buttons have NO click handlers — do nothing | CRITICAL | Header |
| P9 | Docs tab has no document uploader UI — shows fake completion status (complete/in-progress/risk) without user ever uploading anything | CRITICAL | Docs |
| P10 | Sign-Off tab — no assign, notify, or nudge actions — pure read-only showcase | CRITICAL | Sign-Off |

#### HIGH — Broken Agent Integration
| # | Problem | Severity | Tab |
|---|---------|----------|-----|
| P5 | Risk Analysis section never shows up — empty unless DB has pre-seeded data | HIGH | Analysis |
| P6 | Operational Readiness section always empty | HIGH | Analysis |
| P7 | ML Prediction Agent — unclear purpose, questionable display | HIGH | Analysis |
| P8 | Classification Agent — unreliable output, shows random/useless data | HIGH | Analysis |
| P11 | AUTOFILL Live stream not relatable to NPA Draft Template at all | HIGH | Proposal |
| P13 | DB save failure — autofill results not properly persisted across page reloads | HIGH | Proposal |

#### MEDIUM — UX / Performance
| # | Problem | Severity | Tab |
|---|---------|----------|-----|
| P4 | Help button does nothing | MEDIUM | Header |
| P12 | AUTOFILL stream latency ~8 min (3 parallel LLMs but no real speedup) | MEDIUM | Proposal |
| P14 | Cannot revisit stream once editor closed or switched away | MEDIUM | Proposal |
| P15 | Monitoring query input — send button does nothing | MEDIUM | Monitor |
| P17 | 53 fields stream but only 8 land in Doc/Form (field_key mismatch) | MEDIUM | Proposal |

#### LOW — Architecture / Tech Debt
| # | Problem | Severity | Impact |
|---|---------|----------|--------|
| P16 | God file — npa-detail.component.ts is 1997 lines with inline template, all 7 tabs, all agent logic | LOW | Maintainability |
| P18 | Parallel workflow takes same wall-clock time as sequential | LOW | Performance |

---

## SECTION B: PHASE-WISE VISION & GOALS

### Phase 1: "STOP LYING" — Remove Fakes, Wire Real Backend (1-2 weeks)
**Goal**: Every pixel on screen must reflect real data or be honestly empty. No more mock data pretending to be real.

#### 1.1 Document Preview Panel (P1)
- [ ] Replace fake PDF skeleton with real PDF viewer (ngx-extended-pdf-viewer or pdf.js)
- [ ] Wire to actual uploaded documents from `documents` DB table
- [ ] Show "No documents uploaded" state honestly when empty
- [ ] Wire the upload cloud icon to actual file upload (backend `POST /documents/npas/:id/upload` already exists)

#### 1.2 Header Buttons (P3, P4)
- [ ] **Save Draft** → call `PUT /api/npas/:id` with current form state
- [ ] **Approve & Sign-Off** → open approval modal, call `POST /api/approvals`
- [ ] **Reject** → open rejection modal with reason field, call backend
- [ ] **Help** → open contextual help panel or link to documentation

#### 1.3 Document Upload (P9)
- [ ] Add drag-and-drop file upload component to Docs tab
- [ ] Wire to existing `POST /documents/npas/:id/upload` endpoint
- [ ] Show real upload status, file size, validation results
- [ ] Remove fake completion badges — only show status AFTER actual document analysis

#### 1.4 Workflow Tab (P2)
- [ ] Remove all hardcoded stage data
- [ ] Wire to real NPA stage from DB (`npas.stage` field)
- [ ] Show actual timestamps from `stage_transitions` table
- [ ] Show real assignees from `signoffs` table
- [ ] If no workflow data exists, show honest "Workflow not started" state

#### 1.5 Sign-Off Tab (P10)
- [ ] Wire "Assign" button to `POST /api/approvals` endpoint
- [ ] Add notification action (email/nudge) — backend `notifications` table exists
- [ ] Show real signoff status from `signoffs` DB table
- [ ] Add "Remind" / "Escalate" buttons with real backend calls

**Phase 1 Exit Criteria**: Zero hardcoded/mock data on any tab. Every component either shows real data or shows an honest empty state.

---

### Phase 2: "MAKE AGENTS USEFUL" — Fix Agent Output Quality (1-2 weeks)
**Goal**: Every agent must return data that is accurate, relevant, and directly usable.

#### 2.1 Fix Analysis Tab (P5, P6, P7, P8)
- [ ] **Risk Analysis**: Ensure RISK agent output maps correctly to risk domain grid; show real scores, not empty
- [ ] **Operational Readiness**: Map RISK agent's operational domains to this section (OPS, TECH, DATA)
- [ ] **ML Prediction**: Clarify what it predicts (approval likelihood? timeline?), show meaningful display
- [ ] **Classification Agent**: Validate output format; show product type, track, and classification with explanation
- [ ] Add loading skeletons that say "Agent analyzing..." instead of empty placeholder forever

#### 2.2 Fix AUTOFILL Field Key Mapping (P17, P11)
- [ ] Audit all 96 template field keys in `npa-template-definition.ts`
- [ ] Map Dify LLM prompt field_key names to match EXACTLY
- [ ] Target: 53 streamed fields → 50+ land in Doc/Form view (not 8)
- [ ] Make Live stream cards clickable → jump to that field in Doc view

#### 2.3 Fix DB Persistence (P13)
- [ ] Audit `persistAgentResult('autofill', ...)` call chain
- [ ] Verify server `POST /agents/npas/:id/persist/autofill` actually writes to DB
- [ ] Verify page reload restores ALL autofill fields (not just 1)
- [ ] Add persistence for all agent results (risk, classification, ml-predict, governance)

#### 2.4 Stream Replay (P14)
- [ ] Store last AUTOFILL stream result in sessionStorage/localStorage
- [ ] When user re-opens template editor, show last stream result instead of blank
- [ ] Add "Re-run Autofill" button in template editor header

**Phase 2 Exit Criteria**: All 7 agents return useful, accurate data. AUTOFILL fills 50+ fields. DB persistence works across reloads.

---

### Phase 3: "MAKE IT FAST" — Performance & UX Polish (1 week)
**Goal**: Reduce latency, improve responsiveness, clean up architecture.

#### 3.1 AUTOFILL Performance (P12, P18)
- [ ] Profile: Is bottleneck in Dify LLM inference or network/proxy?
- [ ] Reduce LLM prompt size (currently contradictory: "concise" + "comprehensive")
- [ ] Consider splitting into smaller, faster workflows (e.g., 6 branches of 8 fields each)
- [ ] Add progress percentage in Live view (X/96 fields populated)

#### 3.2 Refactor God File (P16)
- [ ] Extract each tab into its own component:
  - `npa-proposal-tab.component.ts`
  - `npa-docs-tab.component.ts`
  - `npa-analysis-tab.component.ts`
  - `npa-signoff-tab.component.ts`
  - `npa-workflow-tab.component.ts`
  - `npa-monitoring-tab.component.ts`
  - `npa-chat-tab.component.ts`
- [ ] Move agent orchestration to `AgentOrchestrationService`
- [ ] Move agent result mappers to `AgentResultMapperService`
- [ ] Target: npa-detail.component.ts < 300 lines

#### 3.3 Monitoring Query (P15)
- [ ] Wire send button to Dify MONITORING agent chat endpoint
- [ ] Show streaming response in chat-like UI
- [ ] Allow follow-up questions

**Phase 3 Exit Criteria**: AUTOFILL < 4 min. Component file < 300 lines. All interactive elements functional.

---

### Phase 4: "PRODUCTION READY" — End-to-End Workflows (2-3 weeks)
**Goal**: Complete NPA lifecycle from submission to approval, with real documents and real sign-offs.

#### 4.1 Complete NPA Lifecycle
- [ ] Submission → Classification → Ideation → Template Fill → Review → Sign-Off → Approval
- [ ] Each stage transition recorded in `stage_transitions` table
- [ ] Notifications sent at each stage (email/in-app)
- [ ] Audit trail for every agent action and human decision

#### 4.2 Document Lifecycle
- [ ] Upload → Validate → Agent Analysis → Status Update
- [ ] Real document preview with annotation support
- [ ] Version history for documents
- [ ] Completeness check tied to classification (what documents are REQUIRED)

#### 4.3 Approval Workflow
- [ ] Multi-level sign-off routing (Legal → Risk → Compliance → COO)
- [ ] Conditional approvals with conditions tracking
- [ ] Loop-back workflow (rejection → revision → resubmission)
- [ ] SLA tracking with breach alerts

#### 4.4 Dashboard KPIs
- [ ] Real metrics from actual NPA data (not hardcoded)
- [ ] Pipeline view with real stage distribution
- [ ] Agent performance metrics (accuracy, speed, coverage)

**Phase 4 Exit Criteria**: Demo-able end-to-end NPA workflow from new submission to final approval.

---

## SECTION C: BACKEND CAPABILITIES (Already Built, Not Wired to UI)

These server routes EXIST but have NO UI wired to them:

| Route File | Endpoints | Status |
|------------|-----------|--------|
| `documents.js` | Upload, validate, delete, get requirements | Backend DONE, UI NOT wired |
| `approvals.js` | Create, update, list approvals | Backend DONE, UI NOT wired |
| `transitions.js` | Stage transitions, history | Backend DONE, UI NOT wired |
| `escalations.js` | Create, resolve escalations | Backend DONE, UI NOT wired |
| `governance.js` | Readiness check, classification, projects | Backend DONE, partially wired |
| `risk-checks.js` | Risk check CRUD | Backend DONE, partially wired |
| `monitoring.js` | Monitoring data, breaches | Backend DONE, partially wired |
| `bundling.js` | Product bundling assessment | Backend DONE, UI NOT wired |
| `evergreen.js` | Evergreen clause checks | Backend DONE, UI NOT wired |
| `pir.js` | Post-implementation review | Backend DONE, UI NOT wired |

**Key Insight**: ~60% of the backend is already built but the frontend never connects to it. Phase 1 is mostly about WIRING, not building from scratch.

---

## SECTION D: DIFY AGENT INVENTORY

| Agent ID | Dify App Name | Type | Status |
|----------|---------------|------|--------|
| RISK | WF_NPA_Risk | Workflow | Working — returns score, rating, 7 domains |
| CLASSIFIER | WF_NPA_Classify_Predict | Workflow | Working — returns type, track, scores |
| ML_PREDICT | WF_NPA_Classify_Predict | Workflow | Working — returns approval likelihood |
| AUTOFILL | WF_NPA_Autofill_Parallel | Workflow (streamed) | Working — 53 fields, 8 min, merge code fixed |
| GOVERNANCE | WF_NPA_Governance | Workflow | Working — returns signoff requirements |
| DOC_LIFECYCLE | WF_NPA_Doc_Lifecycle | Workflow | Working — returns doc completeness |
| MONITORING | WF_NPA_Monitoring | Workflow | Working — returns health metrics |
| IDEATION | CF_NPA_Ideation | Chatflow | Working — 10-question guided interview |
| ORCHESTRATOR | CF_NPA_Orchestrator | Chatflow | Working — routes to sub-agents |

**All 9 agents are functional in Dify.** The problem is the UI layer, not the AI layer.

---

## SECTION E: PRIORITY MATRIX

```
                    HIGH IMPACT
                        |
     Phase 1            |           Phase 2
     (Remove Fakes)     |           (Fix Agents)
     P1,P2,P3,P9,P10   |           P5-P8,P11,P13,P17
                        |
  LOW EFFORT -----------+----------- HIGH EFFORT
                        |
     Phase 3            |           Phase 4
     (Polish)           |           (Production)
     P4,P12,P15,P16    |           Full Lifecycle
                        |
                    LOW IMPACT
```

---

## SECTION F: IMMEDIATE NEXT ACTIONS (Top 5)

1. **Wire document upload UI** to existing `POST /documents/npas/:id/upload` — backend exists, just needs UI
2. **Wire Save Draft button** to `PUT /api/npas/:id` — one click handler
3. **Fix AUTOFILL field key mapping** — audit 96 keys, align Dify prompts → 50+ fields populate
4. **Remove Workflow tab hardcoded data** — wire to real `stage_transitions` table
5. **Fix Analysis tab empty states** — show agent loading states, wire risk/operational grids to agent output

---

*This document is the single source of truth for project status as of 2026-02-22. Update after each phase completion.*
