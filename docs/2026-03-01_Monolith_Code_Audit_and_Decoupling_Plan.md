# Monolith Code Audit & Decoupling Plan (Angular + Node)

Date: **2026-03-01**  
Repo: `/Users/vikramaditya/Documents/agent-command-hub-angular`

This audit focuses on:
- **Monolith files** (very large, multi-responsibility, high-coupling) that are **actually used at runtime**.
- Concrete recommendations to **loosely couple** and **lightweight** the app **without breaking functionality**, using incremental refactors and best practices.

---

## 1) Runtime “Critical Path” (what must load for the app to run)

### Frontend (Angular)

Bootstrap path:
- `src/main.ts` → bootstraps `src/app/app.ts` with `src/app/app.config.ts`
- `src/app/app.routes.ts` defines route tree
- Initial navigation (`path: ''`) loads:
  - `src/app/components/layout/main-layout/main-layout.ts` (layout shell)
  - Child route `path: ''` uses `src/app/pages/command-center/command-center.component.ts`
  - `CommandCenterComponent` eagerly imports **AgentWorkspace**:
    - `src/app/components/shared/agent-workspace/agent-workspace.component.ts`

Why this matters:
- Anything imported by `CommandCenterComponent` becomes part of the initial runtime slice of the app (and is the highest-value place to reduce coupling/weight).

### Backend (Node/Express)

Bootstrap path:
- `server/index.js` creates the Express app, mounts all API routes, serves the Angular dist in production, and runs startup migrations + background jobs.

All mounted route modules are runtime-critical because they are registered on server start:
- `server/routes/*.js` (mounted under `/api/*` in `server/index.js`)

---

## 2) Monolith Hotspots (actively used)

### Frontend hotspots (by size)

These are used through routes/components and therefore included in runtime chunks:

1) **Initial-load monolith**
- `src/app/components/shared/agent-workspace/agent-workspace.component.ts` (~1565 LOC)  
  Used by `src/app/pages/command-center/command-center.component.ts` on the default route.

2) **Large feature flows (lazy-loaded, but still monolithic within their feature chunk)**
- `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` (~2071 LOC)  
  Used by `src/app/pages/npa-agent/npa-agent.component.ts` (route: `/agents/npa`)
- `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts` (~1491 LOC) (feature chunk)
- `src/app/pages/coo-npa/coo-npa-dashboard.component.ts` (~1304 LOC) (route: `/functions/npa`)
- `src/app/services/dify/dify.service.ts` (~1076 LOC)  
  Used by `agent-workspace` + NPA pages
- `src/app/lib/npa-template-definition.ts` (~1634 LOC)  
  Used by draft/detail/template editor flows (e.g., `FIELD_REGISTRY_MAP`)

### Backend hotspots (by size)

These are mounted by `server/index.js` and therefore always active:
- `server/routes/npas.js` (~1478 LOC) — NPA listing, detail aggregation, persistence, workflow-related endpoints
- `server/routes/dify-proxy.js` (~1302 LOC) — Dify proxy, parsing/enveloping, SSE-ish concerns
- `server/routes/transitions.js` (~997 LOC)
- `server/routes/agents.js` (~956 LOC)
- `server/index.js` (~482 LOC) — also contains runtime migrations + job scheduling

---

## 3) Why these files behave “monolithic”

Common symptoms found in the hotspots:

### Frontend symptoms
- **Container + presentation + orchestration** in a single component:
  - HTTP calls, transformation, UI state, polling/timers, streaming handlers, and view rendering in one file.
- **Large, inlined templates** inside `.ts` files (notably `agent-workspace`) that make extraction harder and inflate review/maintenance cost.
- **Implicit global/shared state**:
  - e.g., static fields on a component (`NpaDetailComponent._activeAgentRunId` etc.) create coupling across instances and are hard to reason about.
- **Hardwired imports** of many “card” components/services in a single workspace component, making it the central choke point.

### Backend symptoms
- Route files act as:
  - router + controller + validation + service + repository (SQL) + mapping layer
- Large “aggregate read” endpoints (e.g., NPA detail fetching many tables) implemented inline in the router.
- Startup code (`server/index.js`) mixes:
  - middleware setup, route mounting, static serving, error handling, **migrations**, and **job scheduling**.

---

## 4) Decoupling Strategy (incremental, low-risk)

The safest way to “lightweight” without breaking functionality is:
- Create **clear boundaries** first (new files), then
- Move logic behind interfaces **without changing API contracts**, then
- Split UI into smaller components and lazy-load heavier parts.

### Phase A — Create boundaries (no behavior changes)

#### A1) Frontend: split “Workspace” into a shell + subcomponents
Target: `src/app/components/shared/agent-workspace/agent-workspace.component.ts`

Recommended extraction boundaries:
- `AgentWorkspaceShellComponent` (layout + route/context wiring only)
- `WorkspaceLandingComponent` (landing cards)
- `WorkspaceChatComponent` (message list + composer)
- `WorkspaceSidebarComponent` (templates/session list/filter)
- `WorkspaceMessageRendererComponent` (renders agent cards and markdown safely)

Important: keep the same public inputs/outputs (`[config]`, any existing events) so routes don’t change.

#### A2) Frontend: introduce a “store/facade” service per major screen
Examples:
- `AgentWorkspaceStore` (signals or RxJS state)
- `NpaDetailStore`
- `NpaDraftBuilderStore`

Goal:
- Components become “dumb”: view bindings + event forwarding.
- Store owns: HTTP calls, streaming state, timers, derived/computed values.

Why it’s low-risk:
- UI keeps rendering the same fields; logic is just moved behind an API.

#### A3) Frontend: isolate Dify concerns behind a thin client interface
Target: `src/app/services/dify/dify.service.ts`

Split into:
- `DifyHttpClient` (HTTP calls + auth header + retries)
- `DifyConversationState` (per-agent conversation_id, delegation stack)
- `DifyStreamParser` (SSE chunk parsing → UI events)

Then `DifyService` becomes a small facade that the UI depends on.

#### A4) Backend: split routes into router/controller/service/repo
Example for NPA:
- `server/routes/npas/index.js` (router wiring)
- `server/controllers/npas.controller.js` (req/res mapping, status codes)
- `server/services/npas.service.js` (business logic / orchestration)
- `server/repositories/npas.repo.js` (SQL only)

This is the biggest maintainability win and reduces coupling immediately.

#### A5) Backend: thin `server/index.js`
Extract:
- `createApp()` in `server/app.js` (middleware + route mounting)
- `startServer()` in `server/index.js` (listen only)
- Migrations into `server/db/migrate.js`
- Jobs into `server/jobs/index.js`

Keep behavior identical by calling the same functions on startup.

---

## 5) Lightweighting (performance/bundle size) without breaking features

### Frontend lightweighting

1) **Keep feature lazy-loading, and improve the initial route**
- Today, root route renders `CommandCenterComponent` which eagerly imports `AgentWorkspaceComponent`.
- Consider routing `path: ''` with `loadComponent: () => import(...)` for the command center (and optionally a lightweight landing skeleton).
  - Even if it still loads immediately, it enables better chunk separation and future preloading strategies.

2) **Defer heavy renderers**
- Markdown rendering (`ngx-markdown`) and any “card” components can be introduced via `@defer` (Angular deferrable views) so they only load when needed (e.g., when a message containing markdown/cards appears).

3) **Split static mega-constants**
- `src/app/lib/npa-template-definition.ts` is a large constant tree + registry + helpers.
  - Move the large template tree and registry data into JSON under `src/assets/…` (or dynamic `import()` into a separate chunk).
  - Keep TypeScript types + small helper functions in a small `.ts`.
  - This reduces the size of the feature chunks that import the template/registry.

4) **Avoid static “globals” in components**
- Replace static component fields (global state) with an injected singleton store/service so state is explicit and testable.

### Backend lightweighting

1) **Move parsing/contract enforcement out of routers**
- In `server/routes/dify-proxy.js`, extract the envelope parsing + action validation into `server/services/dify/…`.
  - Routes become thin and consistent.

2) **Centralize error handling & async wrappers**
- Use a shared `asyncHandler(fn)` helper so route files don’t repeat try/catch everywhere (keep error responses consistent).

3) **Normalize DB access patterns**
- Repositories return plain JS objects; services assemble response DTOs.
- Makes it easier to add caching or optimize queries later without touching controllers.

---

## 6) Recommended refactor order (safe + testable)

1) **Frontend**: `AgentWorkspaceComponent` → extract subcomponents + store (no API changes)
2) **Frontend**: `DifyService` → split into client/state/parser modules, keep the public methods stable
3) **Backend**: `server/index.js` → extract `createApp()`, migrations, jobs
4) **Backend**: `server/routes/npas.js` → split into controller/service/repo (keep endpoints unchanged)
5) **Frontend**: `NpaDetailComponent` & `NpaDraftBuilderComponent` → stores + subcomponents
6) **Lightweighting**: move `npa-template-definition` data to lazy-loaded JSON/import chunks

At each step:
- Keep endpoints and UI behavior stable.
- Add/expand smoke tests (`server/tests/smoke-test.js`) and a small Angular unit test for extracted stores where practical.

---

## 7) “Monolith file” checklist (what to aim for)

A refactor is “done” when:
- Component files are typically **< 300–400 LOC** and mostly view code.
- Business logic lives in **services/stores**.
- Data access lives in **repositories** (backend) and is the only layer that knows SQL.
- Shared constants are **data files** or **lazy imports**, not compiled into every chunk that touches them.
- No static “global state” on components; state is owned by explicit singletons.

