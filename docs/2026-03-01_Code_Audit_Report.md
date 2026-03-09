# 🔍 COO Workbench — Full Code Audit Report

## Monolith Analysis, Coupling Assessment & Refactoring Recommendations

**Date:** 2026-03-01
**Scope:** Full codebase — Angular 20 frontend + Express.js backend + Python MCP tools
**Type:** Read-only audit (no code changes)

---

## Executive Summary

| Category | Files Audited | Critical Monoliths (>1000 LOC) | High Monoliths (700-1000 LOC) | Total LOC in Monoliths |
|----------|:---:|:---:|:---:|:---:|
| **Angular Frontend** | 112 TS files | **6** | **2** | ~9,240 |
| **Backend (Express)** | 24 route files | **5** | 0 | ~5,574 |
| **Cross-Cutting** | Services + Templates | **3 DRY violations** | **2 coupling hotspots** | — |
| **TOTAL** | — | **11** | **2** | **~14,814** |

---

## PART 1: ANGULAR FRONTEND MONOLITHS

### Ranked by Severity

| # | File | Lines | Injected Services | Methods | Severity |
|---|------|------:|:---:|:---:|:---:|
| 1 | `npa-detail.component.ts` | **2,071** | 12 | 145+ | 🔴 CRITICAL |
| 2 | `npa-template-definition.ts` | **1,634** | — | — | 🔴 CRITICAL |
| 3 | `agent-workspace.component.ts` | **1,565** | 8 | 82 | 🔴 CRITICAL |
| 4 | `npa-draft-builder.component.ts` | **1,491** | 10 | 130+ | 🔴 CRITICAL |
| 5 | `coo-npa-dashboard.component.ts` | **1,304** | 7 | 60+ | 🔴 CRITICAL |
| 6 | `dify.service.ts` | **1,076** | 4 | 19 public | 🔴 CRITICAL |
| 7 | `ideation-chat.component.ts` | **919** | 6 | 40+ | 🟡 HIGH |
| 8 | `npa-template-editor.component.ts` | **790** | 5 | 35+ | 🟡 HIGH |

---

### 1. `npa-detail.component.ts` — 2,071 lines 🔴

**Path:** `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts`

**SRP Violations (7 distinct responsibilities):**
- Project lifecycle management (load, save, update status)
- Tab management (7 tabs: overview, risk, governance, documents, monitoring, classification, draft)
- Agent orchestration & delegation (chat triggers, agent switching)
- Document upload & management
- Approval/sign-off workflow (5-party matrix)
- Risk assessment coordination
- Chat session rehydration across tabs

**Extraction Plan:**

| Extract To | Responsibility | Estimated Lines |
|-----------|---------------|:---:|
| `NpaDetailViewModel` (service) | State management, data loading, computed properties | ~400 |
| `NpaApprovalService` | 5-party sign-off orchestration, approval matrix logic | ~300 |
| `NpaDocumentService` | Document upload, preview, download, categorization | ~200 |
| `NpaAgentDelegationService` | Agent switching, chat session handoff, delegation context | ~250 |
| `NpaTabManagerService` | Tab activation, lazy init, tab state persistence | ~150 |
| Tab-specific child components | 7 tab content areas → 7 components | ~500 |
| **Remaining in component** | Template binding, lifecycle hooks, navigation | **~270** |

---

### 2. `npa-template-definition.ts` — 1,634 lines 🔴

**Path:** `src/app/lib/npa-template-definition.ts`

**Anti-Pattern:** Data-as-code. This is a massive hardcoded JSON structure defining 100+ NPA form fields with their validations, groupings, field types, and mapping keys (`FIELD_REGISTRY_MAP`).

**Why It's a Problem:**
- Any field change requires a code deployment
- Cannot be domain-specific (ORM, DCE, Desk would need separate copies)
- Not queryable or configurable at runtime
- Bloats the bundle with static data

**Refactoring Recommendation:**

| Action | Details |
|--------|---------|
| Move to database | `platform_template_definitions` table with `domain`, `template_version`, `field_config` (JSON) |
| Create `TemplateDefinitionService` | Runtime loader with caching, replaces static import |
| Keep type interfaces | Extract `TemplateField`, `FieldGroup`, `FieldMapping` interfaces to `models/` |
| Migration script | Seed current JSON into DB rows |

---

### 3. `agent-workspace.component.ts` — 1,565 lines 🔴

**Path:** `src/app/components/shared/agent-workspace/agent-workspace.component.ts`

**SRP Violations (5 responsibilities):**
- Landing page / command center rendering
- Chat interface (message send/receive, streaming display)
- Session management (create, resume, list, delete)
- Agent card rendering (multiple card types: action, document, risk, etc.)
- Quick action and suggestion chip handling

**Extraction Plan:**

| Extract To | Responsibility | Estimated Lines |
|-----------|---------------|:---:|
| `WorkspaceChatComponent` | Chat input, message list, streaming display | ~400 |
| `WorkspaceSessionService` | Session CRUD, session list, active session management | ~250 |
| `WorkspaceCardRendererComponent` | Card factory for different `cardType` values | ~300 |
| `WorkspaceLandingComponent` | Command center, quick actions, suggestions | ~200 |
| **Remaining in component** | Layout orchestration, config resolution | **~415** |

---

### 4. `npa-draft-builder.component.ts` — 1,491 lines 🔴

**Path:** `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts`

**SRP Violations (5 responsibilities):**
- Form editing (dynamic field rendering, value changes)
- Agent chat integration (inline chat for field assistance)
- Auto-save logic (debounced saves, dirty tracking)
- Comment/annotation system
- Form validation (field-level + cross-field)

**Extraction Plan:**

| Extract To | Responsibility | Estimated Lines |
|-----------|---------------|:---:|
| `DraftFormService` | Form state management, field updates, dirty tracking | ~350 |
| `DraftAutoSaveService` | Debounce logic, save queue, conflict detection | ~200 |
| `DraftValidationService` | Field validation rules, cross-field checks, error display | ~200 |
| `DraftCommentService` | Comment CRUD, annotation positioning | ~150 |
| `DraftChatPanelComponent` | Inline agent chat for field assistance | ~300 |
| **Remaining in component** | Layout, form rendering, lifecycle | **~291** |

---

### 5. `coo-npa-dashboard.component.ts` — 1,304 lines 🔴

**Path:** `src/app/pages/coo-npa/coo-npa-dashboard.component.ts`

**SRP Violations (4 responsibilities):**
- Dashboard data loading & aggregation
- Chart rendering logic (multiple chart types)
- Filter/sort state management
- Child component coordination (tiles, lists, alerts)

**Extraction Plan:**

| Extract To | Responsibility | Estimated Lines |
|-----------|---------------|:---:|
| `DashboardDataService` | API calls, data aggregation, caching | ~350 |
| `DashboardFilterService` | Filter state, sort state, query building | ~200 |
| `DashboardChartsComponent` | Chart config, rendering, interactions | ~300 |
| **Remaining in component** | Layout, child coordination | **~454** |

---

### 6. `dify.service.ts` — 1,076 lines 🔴

**Path:** `src/app/services/dify/dify.service.ts`

**SRP Violations (5 distinct responsibilities in 1 service):**
1. **Conversation management** — create, list, delete conversations
2. **Agent routing** — resolve agent from alias, get default orchestrator
3. **SSE streaming** — connect, parse, buffer SSE events
4. **Response parsing** — `@@NPA_META@@` envelope extraction, JSON parsing
5. **Mock/demo mode** — fake responses for development

**Extraction Plan:**

| Extract To | Responsibility | Estimated Lines |
|-----------|---------------|:---:|
| `DifyConversationManager` | Conversation CRUD operations | ~200 |
| `AgentRoutingService` | Agent alias resolution, default orchestrator, registry lookup | ~150 |
| `DifyStreamingHandler` | SSE connection, event parsing, buffer management | ~250 |
| `DifyResponseParser` | Envelope extraction, JSON parsing, card type resolution | ~200 |
| `MockDifyService` | Dev/demo mode responses | ~100 |
| **Remaining in `DifyService`** | Facade coordinating the above | **~176** |

---

### 7-8. Additional High-Severity Files

**`ideation-chat.component.ts` (919 lines):** Chat + form prefill + ideation flow in one component. Extract: `IdeationFlowService`, `IdeationFormPrefillService`.

**`npa-template-editor.component.ts` (790 lines):** Template editing + preview + validation combined. Extract: `TemplatePreviewComponent`, `TemplateValidationService`.

---

## PART 2: BACKEND MONOLITHS

### Ranked by Severity

| # | File | Lines | Endpoints | Severity |
|---|------|------:|:---:|:---:|
| 1 | `npas.js` | **1,478** | 13 | 🔴 CRITICAL |
| 2 | `dify-proxy.js` | **1,302** | 8 | 🔴 CRITICAL |
| 3 | `transitions.js` | **997** | 10 | 🔴 CRITICAL |
| 4 | `agents.js` | **956** | 12 | 🔴 CRITICAL |
| 5 | `seed-npas.js` | **841** | 2 | 🔴 CRITICAL |

---

### 1. `npas.js` — 1,478 lines 🔴

**Path:** `server/routes/npas.js`

**Anti-Pattern: No Service Layer.** All business logic lives directly in Express route handlers. Every endpoint has:
- Raw SQL queries inline
- Business validation logic
- Error handling (17+ duplicate try/catch patterns)
- Response formatting

**Extraction Plan:**

| Extract To | Responsibility |
|-----------|---------------|
| `services/npa.service.js` | Business logic: project CRUD, field updates, status management |
| `services/npa-query.service.js` | SQL query builders, parameterized queries |
| `middleware/error-handler.js` | Centralized error handling (replaces 17 duplicate patterns) |
| `validators/npa.validator.js` | Input validation rules (currently inline in routes) |
| **`routes/npas.js`** (remaining) | Thin route definitions: parse request → call service → send response |

---

### 2. `dify-proxy.js` — 1,302 lines 🔴

**Path:** `server/routes/dify-proxy.js`

**Anti-Patterns:**
- Envelope parsing logic DUPLICATED with client-side `dify.service.ts`
- SSE stream handling mixed with route definitions
- Agent configuration resolution mixed with HTTP routing

**Extraction Plan:**

| Extract To | Responsibility |
|-----------|---------------|
| `services/dify-proxy.service.js` | Dify API forwarding, API key management |
| `services/envelope-parser.js` | `@@COO_META@@` parsing — **SINGLE SOURCE OF TRUTH** (replaces both client & server copies) |
| `services/sse-handler.js` | SSE stream management, chunked transfer |
| **`routes/dify-proxy.js`** (remaining) | Thin routes only |

---

### 3. `transitions.js` — 997 lines 🔴

**Path:** `server/routes/transitions.js`

**Anti-Patterns:**
- ~200 lines of duplicated transaction boilerplate (`BEGIN → queries → COMMIT → ROLLBACK`)
- Hardcoded NPA Lite subtypes and cross-border party mappings
- State machine transitions embedded in route handlers

**Extraction Plan:**

| Extract To | Responsibility |
|-----------|---------------|
| `services/transition.service.js` | State machine logic, transition validation |
| `services/transaction-wrapper.js` | Reusable transaction helper (eliminates ~200 lines of duplication) |
| `config/npa-subtypes.json` | Hardcoded subtypes → config file |
| `config/cross-border-mappings.json` | Hardcoded mappings → config file |

---

### 4. `agents.js` — 956 lines 🔴

**Path:** `server/routes/agents.js`

**Anti-Pattern: 3 Unrelated Domains in 1 File.**
1. Agent session management (~300 lines)
2. NPA-specific query endpoints (~250 lines)
3. 8 persist handlers with ~60-70 line duplicate pattern each (~400 lines)

**Extraction Plan:**

| Extract To | Responsibility |
|-----------|---------------|
| `routes/agent-sessions.js` | Session CRUD endpoints |
| `routes/agent-queries.js` | NPA query endpoints (move to `npa/` domain later) |
| `services/agent-persist.service.js` | Generic persist handler factory (replaces 8 duplicate handlers) |

---

### 5. `seed-npas.js` — 841 lines 🔴

**Path:** `server/routes/seed-npas.js`

**Anti-Pattern: Data-as-code.** 70+ hardcoded field definitions, 409 lines of demo seed data embedded in a route file.

**Refactoring:**

| Extract To | Responsibility |
|-----------|---------------|
| `seeds/npa-seed-data.json` | Seed data → JSON files |
| `services/seed.service.js` | Seed logic (idempotent, environment-aware) |
| Delete from routes | Seeding should never be an API endpoint in production |

---

## PART 3: CROSS-CUTTING ISSUES

### Issue 1: 🔴 CRITICAL DRY Violation — Envelope Parsing Duplicated

| Location | Lines | What It Does |
|----------|------:|-------------|
| `dify.service.ts` (client) | ~95 lines | Parses `@@NPA_META@@` envelope from streamed response |
| `dify-proxy.js` (server) | ~56 lines | Parses same envelope server-side |

**Two independent implementations** of the same parsing logic. If the envelope format changes, both must be updated — guaranteed divergence.

**Fix:** Create a **single canonical parser** in a shared location:
- **Option A (recommended):** Server-side only — `services/envelope-parser.js`. Server parses, sends structured JSON to client.
- **Option B:** Shared npm package (overkill for now).

---

### Issue 2: 🔴 Agent Alias Hardcoding in 2 Places

| Location | Hardcoded Value |
|----------|----------------|
| `dify.service.ts` line ~280 | `'MASTER_COO'` (3 occurrences) |
| `server/config/dify-agents.js` | Agent name → Dify app ID mapping |

**Fix:** Both should resolve from `shared/agent-registry.json` via `AgentRoutingService`.

---

### Issue 3: 🟡 Tight Coupling — 8 Components Depend on DifyService

These components directly inject and call `DifyService`:

1. `agent-workspace.component.ts`
2. `npa-detail.component.ts`
3. `npa-draft-builder.component.ts`
4. `ideation-chat.component.ts`
5. `npa-template-editor.component.ts`
6. `coo-npa-dashboard.component.ts`
7. `knowledge-base.component.ts`
8. `evidence-library.component.ts`

**Fix:** After splitting DifyService into 5 focused services, each component should inject only what it actually uses.

---

### Issue 4: 🟡 Template Bloat

| Template File | Lines | Issue |
|--------------|------:|-------|
| `npa-template-editor.component.html` | **748** | Massive inline template |
| `npa-detail.component.html` | **653** | 7 tab sections in one template |

**Fix:** Extract tab sections into child components. Each tab becomes its own component with its own template.

---

### Issue 5: 🟡 No Centralized Error Handling (Backend)

The backend has **17+ duplicate try/catch blocks** with near-identical patterns:

```
try { ... } catch (error) { console.error('...', error); res.status(500).json({ error: '...' }); }
```

**Fix:** Express error-handling middleware + `asyncHandler` wrapper:

```js
// middleware/async-handler.js
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// middleware/error-handler.js
const errorHandler = (err, req, res, next) => { /* centralized */ };
```

---

## PART 4: ARCHITECTURAL ANTI-PATTERNS SUMMARY

| # | Anti-Pattern | Where | Impact | Fix Priority |
|---|-------------|-------|--------|:---:|
| 1 | **No backend service layer** | All 5 route files | Business logic untestable, undelegatable | 🔴 P0 |
| 2 | **Data-as-code** | `npa-template-definition.ts`, `seed-npas.js` | Change = deploy; not domain-extensible | 🔴 P0 |
| 3 | **DRY violation (envelope)** | Client DifyService + Server dify-proxy | Format change = guaranteed bug | 🔴 P0 |
| 4 | **God components** | 6 Angular files > 1,000 LOC | Untestable, unmaintainable, not decomposable for multi-domain | 🔴 P1 |
| 5 | **Hardcoded config** | Agent aliases, subtypes, mappings | Not extensible to new domains | 🟡 P1 |
| 6 | **Duplicate error handling** | 17+ patterns in routes | Inconsistent error responses | 🟡 P2 |
| 7 | **Tight DifyService coupling** | 8 components | Can't swap/mock/extend agent interface | 🟡 P2 |
| 8 | **No shared interfaces** | Client-server boundary | No type safety on API contracts | 🟡 P3 |

---

## PART 5: RECOMMENDED REFACTORING ROADMAP

This roadmap aligns with the approved **Foundation-First Blueprint** (Phases 1-6). The monolith decomposition should happen during **Phase 4: Architecture Refactor** (Weeks 9-10), but some items are prerequisites for earlier phases.

| Priority | Action | Aligns With Phase | Estimated Effort |
|:---:|--------|:---:|:---:|
| **P0** | Extract backend service layer (`services/*.js`) | Phase 2 (Data Layer) | 3 days |
| **P0** | Create canonical envelope parser (single source) | Phase 2 (Data Layer) | 1 day |
| **P0** | Move `npa-template-definition.ts` to DB | Phase 2 (Data Layer) | 2 days |
| **P0** | Split `DifyService` → 5 focused services | Phase 4 (Architecture) | 2 days |
| **P1** | Decompose `npa-detail.component.ts` → 5 services + 7 child components | Phase 4 (Architecture) | 3 days |
| **P1** | Decompose `agent-workspace.component.ts` → 4 components | Phase 4 (Architecture) | 2 days |
| **P1** | Decompose `npa-draft-builder.component.ts` → 5 services + 1 child | Phase 4 (Architecture) | 2 days |
| **P1** | Externalize hardcoded configs to JSON/DB | Phase 2 (Data Layer) | 1 day |
| **P2** | Add `asyncHandler` + centralized error middleware | Phase 2 (Data Layer) | 0.5 day |
| **P2** | Decompose backend route files | Phase 2 (Data Layer) | 2 days |
| **P2** | Reduce DifyService coupling (8 components) | Phase 4 (Architecture) | 1 day |
| **P3** | Shared API interfaces (TypeScript) | Phase 4 (Architecture) | 1 day |
| **P3** | Split large templates into child components | Phase 4 (Architecture) | 2 days |

**Total estimated refactoring effort: ~22.5 days** (folded into the existing 12-week blueprint timeline)

---

## Key Principle

> **Every extraction must be non-breaking.** Use the **Strangler Fig Pattern**: create the new service/component alongside the old code, migrate callers one-by-one, then delete the old code. At no point should any user-facing workflow break.

---

*This report is read-only. No code was changed.*
*Generated: 2026-03-01*
