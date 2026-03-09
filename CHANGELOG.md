# CHANGELOG — 2026-02-26

All files modified during the Feb 25–26 Claude Code sessions.
Use this to identify what needs to be merged into production.

---

## Commit: `48b6775` — Agent Persistence Fixes

> **fix: full agent persistence — save all structured JSON to DB, survive navigation**

| # | File | What Changed |
|---|------|-------------|
| 1 | `server/routes/agents.js` | Added 7 new persist endpoints (`/npas/:id/persist/classifier`, `risk`, `governance`, `doc-lifecycle`, `monitoring`, `ml-predict`, `autofill`). Each writes to specialized tables + unified `npa_agent_results`. Fixed `conditions` → `conditions_data` column name for monitoring. |
| 2 | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Added `persistAgentResult()` method with retry logic. Wired all 6 agent result handlers to persist structured JSON after mapping. Added `mapBackendDataToView()` to restore all agent results from DB on reload. Fixed dedup guard to not skip when component re-created (nav away + back). |
| 3 | `src/app/pages/npa-agent/npa-agent.component.ts` | Fixed projectId passing to child components. Ensured npaContext propagation on route changes. |
| 4 | `src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts` | Fixed raw JSON capture from Dify workflow responses. Added `rawJson` and `workflowRunId` to classification results. Fixed autofill persist endpoint integration. |
| 5 | `src/app/components/npa/approval-dashboard/approval-dashboard.component.ts` | Fixed signoff decision API call to pass correct payload shape. |
| 6 | `src/assets/sql/11_agent_persistence_migration.sql` | NEW FILE (v1.1). Creates 5 new tables: `npa_agent_results`, `npa_ml_predictions`, `npa_risk_assessment_summary`, `npa_doc_lifecycle_summary`, `npa_monitoring_results`. Adds columns to `npa_classification_scorecards`, `npa_risk_checks`, `npa_signoffs`, `agent_sessions`. MySQL 9 compatible with explicit `COLLATE utf8mb4_general_ci`. |

---

## Commit: `79fc82f` — Dify Agent Prompt Output Format Sync

> **fix: sync all 6 Dify agent prompt output formats with Angular mapping functions and DB schema**

| # | File | What Changed |
|---|------|-------------|
| 7 | `Context/Dify_Agent_Prompts/WF_NPA_Classifier_Prompt.md` | (+56 lines) Moved `ntg_triggers` to root-level object array. Added `analysis_summary`. ML section: `estimated_days` → `timeline_days`, added `bottleneck_dept`, `features`, `comparison_insights`. |
| 8 | `Context/Dify_Agent_Prompts/WF_NPA_Risk_Prompt.md` | (+61 lines) Added `rating` alongside `status` in domain_assessments. Added `hard_stop_reason`, `validity_risk`, `npa_lite_risk_profile`, `sop_bottleneck_risk`, `evergreen_limits`, `notional_flags`, `pir_requirements`. Changed `pending_items` to object array. |
| 9 | `Context/Dify_Agent_Prompts/WF_NPA_Governance_Prompt.md` | (+10 lines) Added root `signoffs` array with per-department objects. Added `escalation` object. Added `threshold` alias. |
| 10 | `Context/Dify_Agent_Prompts/WF_NPA_Doc_Lifecycle_Prompt.md` | (+20 lines) Moved `conditionalRules`, `expiringDocs`, `invalidDocs` inside `completeness`. Added camelCase aliases (`completenessPercent`, `totalRequired`, etc). |
| 11 | `Context/Dify_Agent_Prompts/WF_NPA_Monitoring_Prompt.md` | (+21 lines) `health_status` OK→HEALTHY. Added `metrics` array. Changed `conditions` to `{items: [...]}`. `pir_status` → string enum + `pir_due_date` + `pir_details`. |

---

## Commit: `04fa14b` — Duplicate File Cleanup

> **chore: remove macOS duplicate files (" 2" suffix)**

| # | File | What Changed |
|---|------|-------------|
| 12 | `Context/KB/assets/Legends 2.png` | DELETED — duplicate |
| 13 | `Context/KB/assets/NPA 2.png` | DELETED — duplicate |
| 14 | `src/app/components/npa/dashboard/kb-list-overlay.component 2.html` | DELETED — duplicate |
| 15 | `src/app/components/npa/dashboard/kb-list-overlay.component 2.ts` | DELETED — duplicate |

Additionally, **221 untracked duplicate files** were removed from disk across `Context/`, `Archive/`, and `src/` directories.

---

## Uncommitted (Current Session) — Agent Chat Session Rehydration

> **feat: agent session rehydration — scope sessions to project_id, restore Dify conversation state on navigation**

| # | File | What Changed |
|---|------|-------------|
| 16 | `server/routes/agents.js` | Added `project_id` to PUT `/sessions/:id` update endpoint (was missing — only POST had it). |
| 17 | `src/app/services/chat-session.service.ts` | Added `projectId` field to `ChatSession` interface. Added `projectId` to `saveSessionFor()` opts. Updated `createSessionInDB()` and `updateSessionInDB()` to pass `project_id` to server. Added 3 new methods: `getSessionsForProject()`, `getLatestSessionForProject()`, `loadSessionsForProject()`. Updated `mapRowToSession()` to include `projectId`. |
| 18 | `src/app/pages/npa-agent/npa-detail/npa-detail.component.ts` | Imported `ChatSessionService`. Added `projectSessionId` and `sessionRehydrated` tracking properties. Added `rehydrateAgentSession()` — loads most recent session for project from DB, restores Dify conversation state (per-agent conversation_ids + delegation stack). Added `saveAgentSession()` — persists conversation state after each agent wave. Wired into `loadProjectDetails()` and `runAgentAnalysis()` wave pipeline. Reset session state on project switch. |

---

## Database Migration Status

The migration `src/assets/sql/11_agent_persistence_migration.sql` (v1.1) has been **deployed to Railway MySQL** (interchange.proxy.rlwy.net:26425). All 5 new tables verified. Column additions to existing tables verified.

## Dify Prompt Status

All 5 updated prompt files need to be **copied into Dify Cloud** workflow app LLM node instructions. *(User confirmed this was done on 2026-02-26)*

---

## Files Modified Summary (for merge)

### Must-merge (code changes):
```
server/routes/agents.js
src/app/services/chat-session.service.ts
src/app/pages/npa-agent/npa-detail/npa-detail.component.ts
src/app/pages/npa-agent/npa-agent.component.ts
src/app/pages/npa-agent/npa-draft-builder/npa-draft-builder.component.ts
src/app/components/npa/approval-dashboard/approval-dashboard.component.ts
src/assets/sql/11_agent_persistence_migration.sql
```

### Must-merge (prompt specs):
```
Context/Dify_Agent_Prompts/WF_NPA_Classifier_Prompt.md
Context/Dify_Agent_Prompts/WF_NPA_Risk_Prompt.md
Context/Dify_Agent_Prompts/WF_NPA_Governance_Prompt.md
Context/Dify_Agent_Prompts/WF_NPA_Doc_Lifecycle_Prompt.md
Context/Dify_Agent_Prompts/WF_NPA_Monitoring_Prompt.md
```

### Cleanup (already done, just deletions):
```
Context/KB/assets/Legends 2.png (deleted)
Context/KB/assets/NPA 2.png (deleted)
src/app/components/npa/dashboard/kb-list-overlay.component 2.html (deleted)
src/app/components/npa/dashboard/kb-list-overlay.component 2.ts (deleted)
```
