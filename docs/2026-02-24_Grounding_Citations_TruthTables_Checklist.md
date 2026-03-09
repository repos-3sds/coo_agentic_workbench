## Grounding + Citations Upgrade Checklist (PDF/KB-only)

> **Date:** 2026-02-24  
> **Scope:** All chat agents (COO Orchestrator, NPA Orchestrator, Ideation, Query Assistant, 5 Sign-off agents)  
> **Non-goals:** Do not change agent handover logic; do not allow web sources in production.

---

### 0) Target Behavior (Definition of Done)

- All agent responses that contain policy/compliance/risk/process requirements include inline citations like `[1] [2]`.
- Each cited response includes a **Sources** panel with:
  - `Title`, `Dataset`, `Doc ID` (or stable key), `Page`, `Section/Heading`, `Excerpt (quote)`, and `Confidence`.
- Agents use **only**:
  - Uploaded PDFs
  - Knowledge Base datasets (internal curated docs)
- If no relevant source is retrieved, agent must respond with:
  - “Not found in current KB/PDFs” + a precise request (which document to upload / which dataset is missing).
- Citations are persisted to DB and restored correctly from chat history.

---

### 1) Grounding Techniques to Implement

#### 1.1 Retrieval-First Answering (RAG-only)

- Enforce “retrieve → answer” pattern (no background knowledge fill).
- For each _non-trivial claim_, attach at least one citation to a retrieved chunk.

#### 1.2 Claim Typing + Citation Rules

- Define claim types and enforce minimum citations:
  - **Hard requirements** (must cite): policy/regulatory controls, prohibited/restricted criteria, sign-off obligations, thresholds/limits, workflow gates.
  - **Soft content** (citation optional): clarifying questions, next steps, drafts/wordsmithing (but must not masquerade as policy).
- When citing numeric thresholds/definitions, include a quote snippet + exact location.

#### 1.3 Truth Table (Deterministic Gates)

- Implement deterministic checks with evidence:
  - Eligible client segment? (AI/Institutional vs Retail)
  - Cross-border? (Y/N + conditions)
  - Prohibited list hit? (Y/N)
  - Mandatory sign-offs triggered? (Y/N list)
  - Mandatory prerequisite docs present? (Y/N list)
- Output the truth-table result as a structured block (and cite the governing clauses).

#### 1.4 Automated Reasoning (Rule-based Orchestration)

- Add explicit rules to derive next steps:
  - Missing prerequisites → ask targeted questions / request uploads
  - Gating fails → hard stop with cited rationale
  - Gating passes → proceed to the next workflow stage / agent
- Store the reasoning outputs (as structured metadata) so UI can show “Why we asked this”.

#### 1.5 Weights Method (Ranking Only)

- Use weights only for:
  - Ranking which sources are most relevant
  - Confidence scoring per claim / per source
  - Prioritizing which missing items matter most
- Do **not** use weighted scores for pass/fail compliance gating.

---

### 2) Standard Citation Contract (Single Source of Truth)

Define a uniform JSON structure for citations returned by the backend and persisted in DB:

- `answer_markdown`: string (includes inline citations `[1] [2]`)
- `citations`: array of:
  - `id`: `"1"` (maps to `[1]`)
  - `title`: string
  - `dataset`: string
  - `doc_id`: string
  - `page`: number | null
  - `section`: string | null
  - `excerpt`: string (short quote/snippet)
  - `chunk_id`: string | null
  - `confidence`: number (0–1)

Notes:

- Inline citations must reference `citations[].id`.
- If the agent cannot cite, it must explicitly say “No source found in KB”.

---

### 3) Dify Agent Updates (Prompts / Workflows)

#### 3.1 Global Constraints (apply to all)

- Disallow web sources explicitly.
- Require citations for hard-claims.
- Require “insufficiency behavior” when retrieval fails.
- Output must include the citation contract (or a parseable equivalent that the proxy converts).

#### 3.2 Agent-Specific Enforcement Matrix

- **Query Assistant (strictest):**
  - Answer only from sources; otherwise ask for upload.
  - Always cite for factual claims.

- **Sign-off agents (strict):**
  - For any approval justification, must cite.
  - For “recommended wording”, cite if derived from policy; otherwise label as drafting suggestion.

- **Ideation (mixed):**
  - Product framing can be uncited.
  - Prohibited/restricted/readiness gates must cite.

- **NPA/COO Orchestrators (mixed → strict on gates):**
  - Routing can be uncited.
  - Any governance decision or gate must cite.

---

### 4) Server Changes (Dify Proxy → Normalization)

- Extract citations from Dify response (structured JSON preferred).
- Normalize into the standard citation contract.
- Return `{ answer, metadata, citations }` to Angular.
- Persist citations into `agent_messages.citations` (JSON) on save.
- Add debug logging behind an env flag:
  - `GROUNDING_DEBUG=1` to log retrieval hits and citation mapping.

---

### 5) Database Changes (Persistence + Audit)

- Ensure `agent_messages` supports:
  - `metadata` JSON (already)
  - `citations` JSON (new/verify)
- Ensure batch save endpoints (`/api/agents/sessions/:id/messages/batch`) persist citations.
- Add lightweight indices if needed (optional):
  - `(session_id, timestamp)`

---

### 6) UI Changes (Inline + Sources Panel)

Apply consistently across:

- Agent Workspace chat
- Ideation/NPA lifecycle chat tab
- Draft Builder sign-off agent chat
- Chat history reload views

UI requirements:

- Render inline citations `[1]` as clickable anchors.
- Add a “Sources (n)” toggle per message.
- In Sources panel, show:
  - doc title, dataset, page/section, excerpt, confidence
  - “Open document” action (routes to KB doc viewer / PDF viewer if available)

---

### 7) QA / Acceptance Tests (Manual)

#### 7.1 Happy Path

- Ask a policy question with known KB coverage → response contains `[1]` + sources panel.
- Switch agents mid-chat → citations continue to appear.
- Reload browser → chat history shows the same citations.

#### 7.2 Failure / Insufficiency

- Ask a question without sources in KB → agent responds “Not found” and requests specific upload.

#### 7.3 Consistency / Safety

- Ensure no raw external URLs are introduced in answers.
- Ensure claims that look like policy have citations (strict agents).

---

### 8) Rollout Strategy (Low Risk)

- Phase A: Add citation plumbing + UI rendering (no prompt changes yet; tolerate empty citations).
- Phase B: Update Query Assistant + one sign-off agent to strict grounding; validate.
- Phase C: Roll out to all agents; enable strict mode gating per agent.
