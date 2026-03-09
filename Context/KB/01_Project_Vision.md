# COO Multi-Agent Workbench: Project Vision & Knowledge Base

## 1. Executive Summary & Vision
**The "One Intelligent Workbench" for Global Financial Markets (GFM)**

The COO Multi-Agent Workbench is not just a dashboard; it is an **Agent-Centric Operating System** designed to orchestrate the complex operations of the COO's office.

### The Paradigm Shift
*   **From:** Siloed tools (NPA House, ROBO, RICO), manual emails, and disjointed spreadsheets.
*   **To:** A unified command center where **AI Agents** act as digital employees, handling specific functional tasks while humans retain decision-making authority.

### Core Philosophy
> "Agents assist, Humans decide, and everything is auditable."

---

## 2. Project Objectives

### Primary Goals
1.  **Orchestration, Not Just Chat**: Move beyond simple Q&A. Agents must *execute* workflows (ingest docs, validate rules, draft memos).
2.  **Radical Efficiency**: Reduce manual overhead by 60% (e.g., NPA processing from 12 days → 4 days).
3.  **Audit-First Design**: Every agent action, suggestion, and decision must be logged in an immutable evidence trail for regulators (MAS 656/643).
4.  **Scalability**: A single architecture that scales across all 7 COO functions (NPA, Desk Support, Risk, etc.).

### Success Metrics
*   **Processing Time**: 50% reduction in end-to-end turnaround.
*   **Compliance**: 100% automated coverage of mandatory regulatory checks.
*   **User Experience**: "Zero-Training" adoption via conversational onboarding.

---

## 3. The "Phase 0" Innovation: AI-Powered Ideation
*Derived from the "Product Ideation" brainstorm, this is the critical innovation layer that precedes traditional workflows.*

Before a formal process (like an NPA) begins, the Workbench engages the user in **Phase 0**.

### The Problem
Users often don't know *which* process to trigger or *how* to classify their request (e.g., "Is this a Full NPA or just a Variation?").

### The Solution: The "Ideation" Workflow
1.  **Conversational Intake**: The user chats with the **Product Ideation Agent**.
    *   *User*: "I want to trade a vanilla FX option."
    *   *Agent*: "Okay, what's the notional and currency pair?"
2.  **Intelligent Routing**: The **Classification Router Agent** analyzes the intent.
    *   *Decision*: "This counts as a 'Variation' of an existing product, not a Full NPA."
3.  **Hard-Stop Validation**: The **Prohibited List Checker** runs immediately.
    *   *Check*: "Crypto options are currently restricted. Please check Policy 123."
4.  **Auto-Generation**: If approved, the **Template Auto-Fill Engine** creates the formal "Work Item", pre-filling 78% of the data from the chat context.

---

## 4. System Architecture (The "Frozen" Model)

The Workbench follows a rigorous **4-Tier Hierarchical Agent Architecture**:

### Tier 1: Master Orchestrator ("The Brain")
*   Routes user intent to the correct functional domain.
*   Manages context switching (e.g., jumping from "Drafting NPA" to "Querying Desk Support").

### Tier 2: Domain Agents ("The Managers")
These agents own end-to-end responsibility for a specific Function.
1.  **NPA Agent**: Manages New Product Approval lifecycles.
2.  **Desk Support Agent**: Handles trader queries and operational issues.
3.  **DCE Agent**: Manages Digital Channel Exchange client services.
4.  **ORM Agent**: Operational Risk Management.
5.  **Strategic PM Agent**: Program management.
6.  **Biz Analysis Agent**: Business lead analysis.
7.  **Planning Agent**: Business analysis & planning.

### Tier 3: Task Agents ("The Specialists")
These are function-specific agents that perform concrete tasks within a stage.
*   *Examples (NPA)*: **Document Ingestion Agent**, **Completeness Checker**, **Risk Memo Generator**, **Legal Decision Support**.

### Tier 4: Utility Agents ("The Shared Services")
Common capabilities available to all agents.
*   **RAG / Knowledge Base**: Intelligent search across policies.
*   **Notification Utility**: Smart alerts (Slack/Email).
*   **Doc Processing**: OCR and data extraction.
*   **Audit Logger**: Immutable evidence recording.

---

## 5. The "Work Item" Concept
To unify the UI across diverse functions, everything is modeled as a **Work Item**.

*   **Universal Shell**: Every task (an NPA, a Risk Event, a Desk Query) is a "Work Item" with a standard layout.
    *   **Header**: ID, Status, Mode.
    *   **Left Rail**: Macro Lifecycle (Stages).
    *   **Center**: Human Forms & content.
    *   **Overlay**: Agent Task activity.
*   **Modes**:
    *   **Approval Mode** (e.g., NPA): Linear stages, sign-offs.
    *   **Monitoring Mode** (e.g., Risk): Continuous surveillance.
    *   **Exception Mode** (e.g., Desk Query): Ticket-based resolution.

---

## 6. Implementation Roadmap

### Phase 1: The NPA Pilot (Current Focus)
*   **Objective**: Prove the architecture with the most complex vertical.
*   **Scope**:
    *   **Phase 0 Ideation** (Conversational entry).
    *   **Work Item UI** (The standard shell).
    *   **Task Agents**: Show visible collaboration (Ingestion, Validation).

### Phase 2: Expansion
*   Add **Desk Support Agent** (integrating ROBO).
*   Add **DCE Agent** (integrating DEGA).

### Phase 3: The Full Ecosystem
*   Cross-functional orchestration (e.g., an NPA triggers a Risk Assessment in ORM).
