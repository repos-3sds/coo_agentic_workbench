# NPA Multi-Agent Workbench: Strategic Analysis & Absorption Roadmap
**Date:** 2026-02-20
**Document Type:** Comprehensive Technical Strategy
**Author:** COO Agentic Workbench Team
**Classification:** Internal - Working Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Two Approaches to NPA Automation — Comparison](#2-two-approaches-to-npa-automation)
3. [Their POC: Department-Focused Expert Agents](#3-their-poc-department-focused-expert-agents)
4. [Our Workbench: Full Lifecycle Orchestration Platform](#4-our-workbench-full-lifecycle-orchestration-platform)
5. [Gap Analysis: What They Do That We Don't](#5-gap-analysis-what-they-do-that-we-dont)
6. [What We Do That They Don't](#6-what-we-do-that-they-dont)
7. [Absorption Strategy: Making It All One Platform](#7-absorption-strategy-making-it-all-one-platform)
8. [Detailed Implementation Plan — Per Capability](#8-detailed-implementation-plan)
9. [Architecture: How New Agents Plug In](#9-architecture-how-new-agents-plug-in)
10. [Database Schema Extensions Required](#10-database-schema-extensions)
11. [Risk Assessment of Absorption](#11-risk-assessment)
12. [Timeline & Resource Estimates](#12-timeline-and-resources)
13. [How Their Agents Work & What We Need To Build](#section-13)
    - 13.1 LCS Expert Agent (mechanical flow + Dify workflow + DB + API + UI)
    - 13.2 Credit Risk Expert Agent (product legs + SACCR/PCE)
    - 13.3 FO Expert Agent (structured intake)
    - 13.4 Finance Accounting Expert Agent (IFRS + journal entries)
    - 13.5 Reference NPA Lookup (cross-cutting)
    - 13.6 Summary: Complete Build Checklist
14. [Appendix A: Current Agent Inventory](#appendix-a)
15. [Appendix B: Current API Surface](#appendix-b)
16. [Appendix C: Current Database Tables](#appendix-c)

---

## 1. Executive Summary

Two teams independently attacked the NPA automation problem from **opposite directions**:

- **Their team** built department-specific "Expert Agents" — chatbots that help individual sign-off parties (Legal, Credit Risk, Finance, Front Office) draft their assessment memos by looking up reference NPAs via enterprise search (Glean). Their approach is **depth-focused**: deep domain expertise per department, but no cross-department orchestration.

- **Our team** built a full lifecycle orchestration platform — 13 agents coordinated in waves, managing the entire NPA journey from ideation through post-launch monitoring. Our approach is **breadth-focused**: complete lifecycle coverage with real-time dashboards, but shallower per-department assessment depth.

**The strategic opportunity:** These approaches are not competing — they are complementary. By absorbing their Expert Agent patterns into our orchestration platform, we create a system that is both **wide** (full lifecycle) and **deep** (specialist department assessments).

**Estimated absorption effort:** 8-12 weeks across 3 tiers of priority.

---

## 2. Two Approaches to NPA Automation

### 2.1 Philosophy Comparison

| Dimension | Their POC | Our Workbench |
|-----------|-----------|---------------|
| **Core question answered** | "How do I write my sign-off memo?" | "Where is this NPA in its lifecycle?" |
| **Primary user** | Individual sign-off party (L&C reviewer, Credit Risk analyst) | NPA Champion / Product Manager / COO Office |
| **Architecture** | Independent expert agents per department | Unified multi-agent orchestration (13 agents, 4 tiers) |
| **Knowledge source** | Glean (enterprise search over past NPAs & documents) | Dify Knowledge Base (curated policy documents) |
| **Output** | Department-specific memos and reports | Dashboard KPIs, pipeline tracking, risk scores, SLA monitoring |
| **UI paradigm** | Chat-only (conversational) | Full dashboard + chat + detail pages + pipeline |
| **Deployment status** | Slides / POC (not deployed) | Production (live at npa-workbench.onrender.com) |
| **Data persistence** | None visible (chat-only) | 25+ tables, full audit trail, DB-first architecture |
| **Agent count** | 4 expert flows | 13 agents across 11 Dify apps |
| **Lifecycle coverage** | Sign-off stage only | Ideation -> Classification -> Risk -> Governance -> Launch -> Monitoring |

### 2.2 The Complementarity

```
THEIR STRENGTH                    OUR STRENGTH
  (DEPTH)                           (BREADTH)
    |                                   |
    v                                   v
+------------------+     +---------------------------------+
| LCS Expert Agent |     | IDEATION -> CLASSIFIER -> RISK  |
| Credit Risk Agent|     | -> AUTOFILL -> GOVERNANCE       |
| Finance Agent    | --> | -> DOC_LIFECYCLE -> MONITORING   |
| FO Agent         |     | -> NOTIFICATION                 |
+------------------+     +---------------------------------+
                    \       /
                     \     /
                      v   v
              +-------------------+
              | UNIFIED PLATFORM  |
              | Wide + Deep       |
              +-------------------+
```

---

## 3. Their POC: Department-Focused Expert Agents

### 3.1 NPA Persona Experience Journey

Their presentation maps the NPA lifecycle across 5 personas:

| Persona | Role | Pain Points Identified |
|---------|------|----------------------|
| **Proposer & Group** | Sets product purpose, target customer, commercialization | Doesn't know what to fill, how to structure the case |
| **NPA Champion** | Facilitates end-to-end NPA journey across teams | Chasing multiple departments, no visibility into blockers |
| **Reviewer/Approver (L1)** | Reviews end-to-end mapping (L&C, Finance, MLR, Credit, Tech & Ops) | Massive document to review, needs to understand product context |
| **Reviewer/Approver (L2)** | Internal review before presenting to Final Approver | Re-reviews work done by L1, checks completeness |
| **Final Approver** | GFM Desk Head COO Office/regional | Re-affirms all checks. Provides final sign-off |

### 3.2 Expert Agent Flows (4 Agents)

#### Agent 1: LCS (Legal, Compliance & Secretariat) Expert

**Flow:**
```
User Asks -> Retrieve from Glean -> Draft NPA -> Extract Reference NPA Name
  -> Human Selects -> Reference NPA -> Get Attachment -> Reference NPA L&C Signoff Memo
     |
     +-> LCS Assessment Topics (Prompt Engineering):
     |     - LCS: MAS Engagement
     |     - LCS: Reg 40
     |     - LCS: Trade Reporting
     |
     +-> Product Info:
     |     - Product Variation
     |     - Target Customer
     |
     +-> Other LCS Consideration (from Reference NPA)
     |
     v
  Generate LCS Draft Memo
```

**Key design decisions:**
- Human-in-the-loop: User manually selects which reference NPA to use
- Topic-based prompt engineering: Each regulatory topic is a separate prompt
- Output is a structured LCS draft memo, not just a yes/no

**Their stated pain point:** "Heavy dependency on SME's capability on Prompt Engineering" and "Too many topics for prompt engineering"

#### Agent 2: Credit Risk Expert

**Flow:**
```
User Asks -> Retrieve from Glean -> Draft NPA
  -> Product Variation -> Identify Product Legs
     |
     For each Product Leg, assess:
     +-> Pre-Assessment
     +-> Settlement Risk
     +-> PCE (Potential Credit Exposure)
     +-> SACCR (Standardized Approach to Counterparty Credit Risk)
     +-> Crypto Product Specific
     |
     v
  Generate Credit Risk Report
```

**Key design decisions:**
- Product Leg Decomposition: breaks a composite product (e.g., ELN = option leg + note leg) into individual legs
- Per-leg credit risk assessment using 5 specialized sub-topics
- Includes SACCR calculation — the Basel III standardized approach for counterparty credit risk
- Crypto-specific assessment module (reflecting MBS crypto product initiatives)

#### Agent 3: FO (Front Office) Expert

**Flow:**
```
User enters product name -> Agent asks for details:
  1. Product Description
  2. Business Unit
  3. Target Customer
  4. Reference NPA (if any)
  5. Product/Process Variation (vs reference)
  6. Proposed Booking
  -> Ask if additional info -> User provides
     |
     v
  NPA Product Basic Information Report
```

**Key design decisions:**
- Conversational intake with structured questions
- Generates Part A (Basic Information) of the NPA document
- Simpler flow than other agents — focused on information gathering

#### Agent 4: Finance Accounting Expert

**Flow (two paths):**
```
Path 1: Create Accounting Paper
  Ask for product + accounting standard -> Reasoning Model -> Accounting Paper

Path 2: Extract Accounting Entries
  Upload accounting entries reference + Draft NPA name
    -> Retrieve from Glean -> Extract & apply to new product
       -> Accounting Entries for the product
```

**Key design decisions:**
- Reasoning model for IFRS/IRFIC/IAS standard application
- Can extract accounting entries from reference products and apply to new ones
- Dual-mode: generative (create paper) and extractive (derive entries from reference)

### 3.3 Their Future Plan & Pain Points

From their "Next Step" slide (annotated items):
1. Gather user feedback and improve functionality
2. Expand to other BUs beyond LCS and Credit Risk
3. **Pain:** Heavy dependency on SME's capability on Prompt Engineering
4. **Pain:** Too many topics for prompt engineering
5. **Question:** Is there a way to draft policy/methodology guide into prompts?
6. **Question:** Deep learning approach? (dependency on data availability)
7. **Question:** Build a data connector to read past NPA documents?
8. **Question:** Method to score generated sign-off memos for quality?

---

## 4. Our Workbench: Full Lifecycle Orchestration Platform

### 4.1 Agent Architecture (13 Agents, 4 Tiers)

```
TIER 1: Strategic Command
  MASTER_COO (CF_COO_Orchestrator) -- Chat -- Strategic command orchestration

TIER 2: Domain Orchestration
  NPA_ORCHESTRATOR (CF_NPA_Orchestrator) -- Chat -- Routes to specialists by NPA stage

TIER 3: Specialist Workers (8 agents)
  IDEATION (CF_NPA_Ideation) ............ Chat   -- Conversational NPA ideation
  CLASSIFIER (WF_NPA_Classify_Predict) .. Wkflow -- NPA type classification + track routing
  AUTOFILL (WF_NPA_Autofill) ............ Wkflow -- Template auto-population
  ML_PREDICT (WF_NPA_Classify_Predict) .. Wkflow -- Approval likelihood, timeline, bottleneck
  RISK (WF_NPA_Risk) .................... Wkflow -- 5-layer validation + 7-domain assessment
  GOVERNANCE (WF_NPA_Governance) ........ Wkflow -- Sign-off orchestration + SLA management
  DOC_LIFECYCLE (WF_NPA_Doc_Lifecycle) .. Wkflow -- Document completeness + expiry
  MONITORING (WF_NPA_Monitoring) ........ Wkflow -- Post-launch breach detection + PIR

TIER 4: Shared Utilities
  KB_SEARCH (CF_NPA_Query_Assistant) .... Chat   -- Knowledge base semantic search
  NOTIFICATION (WF_NPA_Notification) .... Wkflow -- Alert delivery + escalation chains
  DILIGENCE (CF_NPA_Query_Assistant) .... Chat   -- Conversational due diligence
```

### 4.2 Agent Execution Pattern (Decision-Tree Driven)

```
IDEATION ──> CLASSIFIER ──> RISK ──> AUTOFILL ──> GOVERNANCE ──> DOC_LIFECYCLE ──> MONITORING
                │               │                     │
                │               │                     └─── SLA breach? ──> NOTIFICATION
                │               │
                │               └─── Hard stop? ──> ESCALATION ──> NOTIFICATION
                │
                └─── NTG? ──> PAC gate (mandatory)
```

Each agent persists results via dedicated API endpoints:
- `POST /api/agents/npas/:id/persist/classifier` -> npa_classification_scorecards
- `POST /api/agents/npas/:id/persist/risk` -> npa_risk_checks + npa_intake_assessments
- `POST /api/agents/npas/:id/persist/autofill` -> npa_form_data
- `POST /api/agents/npas/:id/persist/ml-predict` -> npa_projects (prediction fields)
- `POST /api/agents/npas/:id/persist/governance` -> npa_signoffs
- `POST /api/agents/npas/:id/persist/doc-lifecycle` -> npa_documents
- `POST /api/agents/npas/:id/persist/monitoring` -> npa_monitoring_thresholds + npa_performance_metrics

### 4.3 Risk Assessment Depth (7 Domains)

Our RISK agent covers 7 domains with structured scoring:

| Domain | Sub-Assessment Areas | Scoring |
|--------|---------------------|---------|
| **CREDIT** | Primary obligor, counterparty quality, PCE treatment, SACCR, concentration, collateral | 0-100 + PASS/WARN/FAIL |
| **MARKET** | IR Delta/Vega, FX Delta/Vega, EQ Delta/Vega, CS01, VaR, stress testing, SIMM | 0-100 + PASS/WARN/FAIL |
| **OPERATIONAL** | Process risk, system risk (Murex capability), people/training, cross-border, BCP/DR | 0-100 + PASS/WARN/FAIL |
| **LIQUIDITY** | LCR/NSFR impact, HQLA eligibility, contractual cashflows, funding, market liquidity | 0-100 + PASS/WARN/FAIL |
| **LEGAL** | ISDA/GMRA/NAFMII documentation, enforceability, regulatory license, netting | 0-100 + PASS/WARN/FAIL |
| **REPUTATIONAL** | ESG, customer suitability, regulatory perception, media exposure, step-in risk | 0-100 + PASS/WARN/FAIL |
| **CYBER** | Data security, third-party connectivity, platform security, information security | 0-100 + PASS/WARN/FAIL |

### 4.4 Sign-Off Framework (10 Parties)

| # | Party | Department | Trigger |
|---|-------|-----------|---------|
| 1 | Credit (RMG-Credit) | Risk Management | All NPAs |
| 2 | Finance | Finance | All NPAs |
| 3 | Legal (GLC) | Legal, Compliance & Secretariat | All Full NPAs |
| 4 | MLR (Market & Liquidity Risk) | Risk Management | All NPAs with market risk |
| 5 | Operations | Technology & Operations | All NPAs |
| 6 | Technology | Technology & Operations | All NPAs with tech changes |
| 7 | Compliance | Legal, Compliance & Secretariat | All NPAs |
| 8 | PAC | Product Approval Committee | All NTG products (mandatory gate) |
| 9 | CEO | Executive | Notional > $100M or strategic |
| 10 | Bundling Arbitration | GFM COO Office | All bundled products |

### 4.5 Data Model (25+ Tables)

**Core:** npa_projects, npa_jurisdictions, npa_form_data
**Governance:** npa_signoffs, npa_approvals, npa_loop_backs, npa_post_launch_conditions
**Risk:** npa_risk_checks, npa_intake_assessments, npa_breach_alerts
**Documents:** npa_documents, ref_document_rules
**Classification:** npa_classification_scorecards
**Monitoring:** npa_monitoring_thresholds, npa_performance_metrics
**Workflow:** npa_workflow_states, npa_escalations
**Agent:** agent_sessions, agent_messages
**Reference:** ref_npa_templates, ref_npa_sections, ref_npa_fields, ref_field_options
**Audit:** npa_audit_log, npa_comments

### 4.6 Production Deployment

- **Live URL:** https://npa-workbench.onrender.com
- **8 Diverse Seed NPAs** covering all NPA types, product categories, risk levels, stages
- **13 Healthy Agents** (Dify Cloud) — all responding to health checks
- **Railway MySQL** production database with full schema
- **Angular 19 + Express** full-stack application

---

## 5. Gap Analysis: What They Do That We Don't

### Gap 1: Reference NPA Lookup & Similarity Matching

**Their approach:** Core to every agent flow — user provides a draft NPA name, system retrieves from Glean, extracts the reference NPA, fetches its attachments (including past sign-off memos), and uses these as templates.

**Our current state:** We have 8 seed NPAs in the database and API filters (`GET /api/npas?type=Variation&track=NPA_LITE`), but no semantic similarity matching and no mechanism to suggest "here are 3 similar past NPAs" during intake.

**Why this matters:** Reference NPAs are how the bank actually works. Every new NPA is compared against predecessors. The real NPA document (TSG2122) explicitly references TSG1917 in its title. This is foundational.

### Gap 2: Department-Specific Sign-Off Memo Generation

**Their approach:** Each expert agent generates a structured memo for that department (LCS Draft Memo, Credit Risk Report, Accounting Paper). These are the actual deliverables that sign-off parties produce.

**Our current state:** Our GOVERNANCE agent tracks sign-off STATUS (PENDING/APPROVED/REJECTED) and our sign-off table stores comments, but we don't generate the actual memo documents that reviewers need to write. We track the yes/no but not the reasoning.

**Why this matters:** The sign-off memo is the highest-friction artifact in the NPA process. Reviewers spend days researching and writing these memos. Auto-generating a first draft would save 60-80% of that time.

### Gap 3: Product Leg Decomposition

**Their approach:** Credit Risk agent decomposes a product into constituent legs (e.g., ELN = equity put option leg + structured note leg) and performs per-leg credit risk assessment.

**Our current state:** Our data model treats products atomically. One product = one risk assessment = one set of sign-offs. No concept of "legs" or "blocks" (bundling terminology from the real NPA template).

**Why this matters:** Complex products (structured notes, bundled products, multi-leg derivatives) have different risk profiles per leg. The real NPA template (Appendix 5) explicitly asks for per-product contract specifications with separate booking details per leg.

### Gap 4: SACCR / PCE Calculation

**Their approach:** Credit Risk agent includes dedicated SACCR and PCE assessment topics as first-class sub-agents.

**Our current state:** Our RISK agent mentions SACCR and PCE in the prompt (they're listed under the CREDIT domain), but treats them as narrative items, not calculated quantities. We don't compute actual PCE values or SACCR add-on amounts.

**Why this matters:** SACCR is a regulatory requirement under Basel III. Banks must calculate standardized counterparty credit risk charges. Having an agent that can estimate these values (even approximately) is immediately useful to Finance and Credit Risk sign-off parties.

### Gap 5: Finance & Accounting Agent

**Their approach:** Dedicated Finance Accounting Expert that can (a) create accounting papers based on IFRS/IRFIC/IAS standards, and (b) extract accounting entries from reference products and apply them to new ones.

**Our current state:** Zero coverage. We have a Finance domain in intake assessments and Finance as a sign-off party, but no agent logic for accounting treatment, IFRS classification, or journal entry generation.

**Why this matters:** Finance sign-off is mandatory for all NPAs. The real NPA template has extensive Finance/Tax sections (Section 1.1 — Finance and Tax) covering product treatment, balance sheet impact, GL entries, revenue recognition, capital calculation, and regulatory reporting.

### Gap 6: MAS Regulatory Engagement Assessment

**Their approach:** LCS agent has dedicated "MAS Engagement" and "Reg 40" prompt topics that assess specific Singapore regulatory requirements.

**Our current state:** Our RISK agent covers regulatory risk as one of 7 domains, but at a generic level. No agent specifically assesses MAS Notice 656, MAS Reg 40, MASNET trade reporting obligations, or tracks regulatory pre-approval timelines.

**Why this matters:** The real NPA template (Section IV.A — Regulatory Considerations) asks detailed questions about specific MAS requirements, including whether MAS engagement is needed and what regulatory reporting obligations apply.

### Gap 7: Enterprise Search / Glean Integration

**Their approach:** Every agent flow starts with "Retrieve from Glean" — searching across the enterprise document store for relevant past NPAs, policies, and precedents.

**Our current state:** We use Dify Knowledge Base (curated markdown documents) for agent context. No integration with any enterprise search system.

**Why this matters:** Glean or similar enterprise search provides access to the full corpus of past NPA documents, sign-off memos, risk assessments, and policy documents. This grounds agent outputs in real institutional knowledge rather than curated templates.

---

## 6. What We Do That They Don't

| Our Capability | Their Status | Why It Matters |
|---------------|-------------|----------------|
| **Deployed production system** | Slides only | We have working software; they have concepts |
| **13-agent orchestration** | 4 isolated agents | We coordinate across departments; they work in silos |
| **NPA Classification engine** | Not present | Auto-classifies NTG/Variation/Existing with scoring |
| **ML Prediction** | Not present | Predicts approval likelihood, timeline, bottleneck |
| **SLA monitoring & breach alerts** | Not present | Real-time tracking of sign-off deadlines |
| **Post-launch monitoring** | Not present | PIR scheduling, threshold monitoring, health status |
| **Pipeline dashboard** | Not present | Visual management of entire NPA portfolio |
| **Document lifecycle management** | Not present | Upload, validate, track expiry, check completeness |
| **State machine transitions** | Not present | Formal workflow (DRAFT -> SIGN_OFF -> LAUNCH -> MONITORING) |
| **Audit trail** | Not present | Complete audit log with agent actions |
| **DB-first persistence** | Not present | All data survives page refresh; instant load |
| **8 realistic seed NPAs** | Not present | Full test data covering all product types and NPA types |
| **Notification system** | Not present | Alert delivery, deduplication, escalation chains |
| **Loop-back management** | Not present | Track rework cycles with circuit breaker (3 loops max) |

---

## 7. Absorption Strategy: Making It All One Platform

### 7.1 Core Principle

**Don't rewrite what we have. Extend it.**

Our architecture is designed for agent addition:
- New Dify workflows slot into `server/config/dify-agents.js`
- New persistence endpoints follow the established `POST /api/agents/npas/:id/persist/{type}` pattern
- New database tables don't conflict with existing schema
- New UI components render in the existing NPA detail page tabs

### 7.2 Three-Tier Absorption Plan

```
TIER 1 (Weeks 1-3): QUICK WINS — Extend Existing Agents
  - Enhanced Conversational Intake (extend IDEATION)
  - Reference NPA Lookup (new workflow + API + UI)
  - MAS Regulatory Assessment (new workflow, orthogonal)

TIER 2 (Weeks 3-7): NEW AGENTS — Department-Specific Experts
  - Sign-Off Memo Generator (per-department templates + PDF export)
  - Product Leg Decomposition (new data model + agent)
  - Finance Accounting Agent (IFRS assessment + GL entries)

TIER 3 (Weeks 7-12): DEEP DOMAIN — Specialized Calculations
  - SACCR/PCE Credit Risk Calculator (quantitative sub-agents)
  - Glean Integration (enterprise search connector)
  - Quality Scoring for Generated Memos (self-evaluation)
```

### 7.3 What Changes vs What Stays

**STAYS UNCHANGED:**
- Master Orchestrator (MASTER_COO) — still routes everything
- NPA Orchestrator — still manages domain routing
- CLASSIFIER — still classifies NPA types
- ML_PREDICT — still predicts outcomes
- AUTOFILL — still fills templates
- DOC_LIFECYCLE — still tracks documents
- MONITORING — still monitors post-launch
- NOTIFICATION — still delivers alerts
- All existing API endpoints
- All existing database tables
- All existing UI components
- Wave orchestration pattern

**CHANGES/EXTENDS:**
- RISK agent gets deeper sub-agents (SACCR, PCE, Settlement Risk)
- GOVERNANCE agent gains memo generation capability
- IDEATION agent gets structured intake questionnaire
- New agents added: REFERENCE_LOOKUP, LCS_EXPERT, CREDIT_RISK_EXPERT, FINANCE_EXPERT
- New database tables for product legs, memos, accounting, regulatory
- New UI tabs/panels for memo display, leg visualization, regulatory status

---

## 8. Detailed Implementation Plan

### 8.1 TIER 1: Enhanced Conversational Intake

**Goal:** Transform IDEATION from open-ended chat to structured product intake with progress tracking.

**What their FO Agent does:** Asks 6 structured questions (Product Description, Business Unit, Target Customer, Reference NPA, Variation, Proposed Booking) and generates a "Product Basic Information Report."

**What we already have:**
- `CF_NPA_Ideation` chatflow in Dify
- Chat interface component (`chat-interface.component.ts`)
- Agent-First vs Draft-First mode selection
- AUTOFILL agent that populates templates after ideation

**What to build:**
1. Update IDEATION Dify prompt to include structured question sequence
2. Add intake state tracking: `npa_intake_progress` table (question_id, answered, value)
3. Create intake checklist sidebar in NPA detail UI
4. Add completeness gate in GOVERNANCE agent (block REVIEW if intake < 80% complete)
5. Generate "Product Basic Information Report" as first deliverable

**New Dify workflow:** Update existing `CF_NPA_Ideation` prompt (no new app needed)
**New API endpoints:** `GET /api/npas/:id/intake/progress`, `POST /api/npas/:id/intake/update`
**New DB table:** `npa_intake_progress` (project_id, question_key, status, answer, confidence)
**New UI:** Intake progress sidebar with checkmarks
**Effort:** 1-2 weeks

### 8.2 TIER 1: Reference NPA Lookup

**Goal:** When creating or reviewing an NPA, automatically suggest similar past NPAs as references.

**What their agents do:** Every flow starts with "Retrieve from Glean" to find the reference NPA, then extracts its name, fetches attachments, and uses the past sign-off memo as a template.

**What we already have:**
- `GET /api/npas` with filters (type, track, stage, status)
- 8 seed NPAs with rich descriptions and product attributes
- `npa_projects` table with product_category, npa_type, risk_level, jurisdictions

**What to build:**
1. New Dify workflow `WF_NPA_Reference_Lookup` — takes product description as input, returns top-3 similar past NPAs
2. Similarity scoring based on: product_category match, jurisdiction overlap, risk_level proximity, npa_type match, keyword overlap in description
3. API endpoint `GET /api/npas/:id/similar` — returns ranked list of similar NPAs
4. API endpoint `GET /api/npas/:id/reference` — get/set the chosen reference NPA
5. UI: "Similar NPAs" panel in detail page showing suggestions
6. Store reference NPA link: add `reference_npa_id` column to `npa_projects`

**New Dify workflow:** `WF_NPA_Reference_Lookup`
**New API endpoints:** `GET /api/npas/:id/similar`, `GET/PUT /api/npas/:id/reference`
**Schema change:** Add `reference_npa_id` to `npa_projects`
**New UI:** Similar NPAs suggestion panel
**Effort:** 2-3 weeks

### 8.3 TIER 1: MAS Regulatory Assessment

**Goal:** Dedicated regulatory assessment agent that evaluates MAS-specific requirements.

**What their LCS agent covers:**
- MAS Engagement requirement
- Reg 40 compliance
- Trade Reporting obligations

**What we already have:**
- RISK agent covers LEGAL domain (which includes some regulatory items)
- `npa_jurisdictions` table tracks which jurisdictions apply
- Knowledge base docs mention MAS but no dedicated regulatory assessment

**What to build:**
1. New Dify workflow `WF_NPA_Regulatory` — assesses jurisdiction-specific regulatory requirements
2. Assessment topics per jurisdiction:
   - **Singapore (MAS):** Notice 656, Reg 40, MASNET reporting, derivatives reporting
   - **Hong Kong (HKMA/SFC):** SFC licensing, OTC derivatives reporting, PI suitability
   - **China (PBOC/SAFE):** Cross-border rules, CIBM access, PIPL data compliance
3. Knowledge base document: `KB_NPA_Regulatory_Matrix.md`
4. API endpoint: `POST /api/agents/npas/:id/persist/regulatory`
5. DB table: `npa_regulatory_assessments` (project_id, jurisdiction, topic, status, findings, action_required)
6. UI: Regulatory Assessment tab in NPA detail

**New Dify workflow:** `WF_NPA_Regulatory`
**New KB doc:** `KB_NPA_Regulatory_Matrix.md`
**New API:** `POST /api/agents/npas/:id/persist/regulatory`
**New DB table:** `npa_regulatory_assessments`
**New UI:** Regulatory tab
**Effort:** 3-4 weeks

### 8.4 TIER 2: Sign-Off Memo Generator

**Goal:** Auto-generate department-specific sign-off memos that reviewers can use as first drafts.

**What their agents do:** LCS Expert generates "LCS Draft Memo", Credit Risk Expert generates "Credit Risk Report". These are the actual deliverables reviewers need.

**What we already have:**
- Sign-off tracking (npa_signoffs with status, comments, SLA)
- All agent results persisted in DB (risk findings, classification, governance status)
- Document tracking (npa_documents)

**What to build:**
1. New Dify workflow `WF_NPA_Memo_Generator` with department-specific templates:
   - **LCS Memo:** Regulatory assessment + compliance checks + legal documentation review + recommendations
   - **Credit Risk Memo:** Counterparty assessment + PCE/SACCR summary + concentration analysis + collateral review
   - **MLR Memo:** Market risk factors + VaR impact + hedging adequacy + stress test results
   - **Finance Memo:** ROAE analysis + capital impact + accounting treatment + GL entries
   - **Operations Memo:** Settlement workflow + booking validation + BCP considerations
   - **Technology Memo:** System capability + integration requirements + security assessment
   - **Compliance Memo:** AML/KYC checks + sanctions screening + conduct risk + suitability
2. Memo generation pulls from: persisted risk findings, form data, classification scorecard, document status
3. API: `POST /api/npas/:id/memos/generate/:department` — generates memo
4. API: `GET /api/npas/:id/memos` — list all generated memos
5. DB table: `npa_signoff_memos` (project_id, department, version, content_json, generated_at, status)
6. UI: "Memos" tab showing generated drafts, with "Regenerate" button
7. PDF export via server-side rendering

**New Dify workflow:** `WF_NPA_Memo_Generator` (1 workflow with department parameter)
**New API:** `POST /api/npas/:id/memos/generate/:dept`, `GET /api/npas/:id/memos`
**New DB table:** `npa_signoff_memos`
**New UI:** Memos tab with per-department sections
**Effort:** 3-4 weeks

### 8.5 TIER 2: Product Leg Decomposition

**Goal:** Break composite products into constituent legs for per-leg risk assessment and booking.

**What their Credit Risk agent does:** Identifies product legs (e.g., ELN = option leg + note leg) and runs credit risk assessment per leg.

**What we already have:**
- Product descriptions in npa_form_data contain leg information (e.g., "EQD|OPT|ELN and FI|NOTE|LNBR")
- Booking system field captures multi-leg typologies
- Real NPA template (Appendix 5) has per-product contract specifications

**What to build:**
1. New DB table: `npa_product_legs` (id, project_id, leg_number, leg_type, leg_name, murex_typology, notional, currency, booking_entity, risk_category)
2. New Dify workflow `WF_NPA_Product_Decomposer` — analyzes product description and booking info, outputs structured leg breakdown
3. Auto-decomposition from product description: "Equity-Linked Note" -> [Equity Put Option, Structured Note (LNBR)]
4. Per-leg fields in form data: extend `npa_form_data` with optional `leg_id` column
5. Modify RISK agent to accept leg context and produce per-leg risk scores
6. API: `POST /api/npas/:id/decompose`, `GET /api/npas/:id/legs`
7. UI: Leg breakdown visualization in product detail section

**New Dify workflow:** `WF_NPA_Product_Decomposer`
**New DB table:** `npa_product_legs`
**Schema change:** Add optional `leg_id` to `npa_form_data`
**New API:** `POST /api/npas/:id/decompose`, `GET /api/npas/:id/legs`
**New UI:** Product legs panel
**Effort:** 4-6 weeks (highest schema impact)

### 8.6 TIER 2: Finance & Accounting Agent

**Goal:** Automate accounting treatment assessment, IFRS classification, and journal entry generation.

**What their Finance Accounting agent does:** Two paths — (1) Create accounting paper from product + IFRS standard, (2) Extract accounting entries from reference product and apply to new one.

**What we already have:**
- Finance as a sign-off party (tracked in npa_signoffs)
- FINANCE domain in intake assessments
- Form fields: revenue_year1/2/3, target_roi, roae_analysis
- Real NPA template has extensive Finance/Tax sections

**What to build:**
1. New Dify workflow `WF_NPA_Finance_Accounting` with two modes:
   - **Mode A: Accounting Paper** — Given product type, generate IFRS 9 classification (Amortised Cost, FVPL, FVOCI, Hedge Accounting), balance sheet impact, P&L recognition
   - **Mode B: Accounting Entries** — Given reference NPA, extract GL journal entries and adapt for new product
2. Knowledge base: `KB_NPA_Finance_Accounting.md` with IFRS 9 decision tree, product-to-treatment mapping
3. DB table: `npa_accounting_treatment` (project_id, ifrs_classification, balance_sheet_treatment, pnl_recognition, gl_entries_json)
4. API: `POST /api/agents/npas/:id/persist/finance-accounting`
5. UI: Finance/Accounting tab in NPA detail

**New Dify workflow:** `WF_NPA_Finance_Accounting`
**New KB doc:** `KB_NPA_Finance_Accounting.md`
**New DB table:** `npa_accounting_treatment`
**New API:** `POST /api/agents/npas/:id/persist/finance-accounting`
**New UI:** Finance/Accounting tab
**Effort:** 5-8 weeks

### 8.7 TIER 3: SACCR/PCE Credit Risk Calculator

**Goal:** Specialized credit risk sub-agents that compute SACCR add-on amounts and PCE values.

**What their Credit Risk agent covers:** Per-leg assessment across Pre-Assessment, Settlement Risk, PCE, SACCR, Crypto-specific.

**What we already have:**
- RISK agent's CREDIT domain covers counterparty quality, concentration, collateral (narrative)
- Risk checks stored in npa_risk_checks table
- Seed data includes SACCR references (e.g., "SA-CCR with alpha=1.4 and credit derivative-specific add-on factors")

**What to build:**
1. Enhance RISK agent's CREDIT domain with quantitative sub-assessments:
   - **SACCR Calculator:** Replacement Cost (RC) + Potential Future Exposure (PFE) using asset class add-on factors
   - **PCE Estimator:** Notional * Risk Weight * Maturity Factor per asset class
   - **Settlement Risk:** Delivery vs. Payment analysis, T+N lag assessment
   - **Concentration Risk:** Counterparty exposure as % of total portfolio
   - **CVA Risk:** Basic CVA charge under BA-CVA approach
2. DB table: `npa_credit_risk_calculations` (project_id, leg_id, calc_type, rc_amount, pfe_amount, ead, risk_weight, capital_charge)
3. Knowledge base: `KB_NPA_SACCR_Rules.md` with add-on factors per asset class
4. API: `POST /api/agents/npas/:id/persist/credit-risk-calc`
5. UI: Credit Risk Calculation panel with per-leg breakdown

**New Dify workflow:** Enhance `WF_NPA_Risk` with credit risk sub-workflow
**New KB doc:** `KB_NPA_SACCR_Rules.md`
**New DB table:** `npa_credit_risk_calculations`
**New API:** `POST /api/agents/npas/:id/persist/credit-risk-calc`
**New UI:** Credit Risk panel
**Effort:** 5-7 weeks

### 8.8 TIER 3: Enterprise Search Integration

**Goal:** Connect to Glean (or similar) for retrieving past NPA documents and institutional knowledge.

**What their approach does:** Every agent flow starts with "Retrieve from Glean" — enterprise-wide search across Confluence, SharePoint, email, and document stores.

**What we already have:**
- Dify Knowledge Base with curated documents
- KB_SEARCH agent for semantic search over curated KB
- DILIGENCE agent for conversational Q&A

**What to build:**
1. Glean API connector: `server/integrations/glean.js`
2. Custom Dify tool that calls Glean API for document retrieval
3. Integrate into KB_SEARCH and DILIGENCE agents as an additional knowledge source
4. API proxy: `POST /api/search/enterprise` — searches Glean with NPA context
5. Citation tracking: store Glean document references with agent responses
6. Fallback: If Glean unavailable, fall back to Dify KB

**Dependency:** Requires access to a Glean instance with NPA-related documents indexed.

**New integration:** `server/integrations/glean.js`
**Modified agents:** KB_SEARCH, DILIGENCE (add Glean tool)
**New API:** `POST /api/search/enterprise`
**Effort:** 3-4 weeks (if Glean instance available)

---

## 9. Architecture: How New Agents Plug In

### 9.1 Agent Registration Pattern

Every new agent follows the same pattern:

```javascript
// 1. Register in server/config/dify-agents.js
{
  id: 'NEW_AGENT',
  difyApp: 'WF_NPA_New_Agent',
  name: 'New Agent Name',
  type: 'workflow',
  icon: 'icon-name',
  iconColor: 'color',
  tier: 3
}

// 2. Add persistence endpoint in server/routes/agents.js
router.post('/npas/:id/persist/new-agent', async (req, res) => {
  // Parse agent output
  // Upsert into new DB table
  // Create audit log entry
  // Return { status: 'PERSISTED' }
});

// 3. Add DB-first pre-population in npa-detail.component.ts
mapBackendDataToView(data) {
  // Read from new table and populate component state
}

// 4. Add UI component
// New tab or panel in npa-detail.component.html
```

### 9.2 Agent Wave Extension

Current waves can be extended to include new agents:

```
Wave 0: IDEATION (enhanced with structured intake)
Wave 1: CLASSIFIER + ML_PREDICT + REFERENCE_LOOKUP (new)
Wave 2: RISK + PRODUCT_DECOMPOSER (new) + REGULATORY (new)
Wave 3: AUTOFILL + GOVERNANCE + FINANCE_ACCOUNTING (new)
Wave 4: DOC_LIFECYCLE + MONITORING + MEMO_GENERATOR (new)
Wave 5: SACCR_CALCULATOR (new) — runs after RISK if credit domain flagged
```

### 9.3 DB Extension Pattern

New tables follow existing naming convention:

```sql
-- All new tables use npa_ prefix and project_id foreign key
CREATE TABLE npa_product_legs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  leg_number INT,
  leg_type VARCHAR(100),
  ...
  FOREIGN KEY (project_id) REFERENCES npa_projects(id)
);
```

---

## 10. Database Schema Extensions

### New Tables Required

| Table | Purpose | Columns | Tier |
|-------|---------|---------|------|
| `npa_intake_progress` | Intake questionnaire tracking | project_id, question_key, status, answer, confidence | 1 |
| `npa_regulatory_assessments` | Per-jurisdiction regulatory findings | project_id, jurisdiction, topic, status, findings_json, action_required | 1 |
| `npa_signoff_memos` | Generated department memos | project_id, department, version, content_json, generated_at, approved_by | 2 |
| `npa_product_legs` | Product leg decomposition | project_id, leg_number, leg_type, leg_name, murex_typology, notional, currency, booking_entity | 2 |
| `npa_accounting_treatment` | IFRS classification + GL entries | project_id, ifrs_classification, bs_treatment, pnl_recognition, gl_entries_json | 2 |
| `npa_credit_risk_calculations` | SACCR/PCE per-leg results | project_id, leg_id, calc_type, rc_amount, pfe_amount, ead, risk_weight, capital_charge | 3 |

### Schema Modifications

| Table | Change | Tier |
|-------|--------|------|
| `npa_projects` | Add `reference_npa_id` column | 1 |
| `npa_form_data` | Add optional `leg_id` column | 2 |

---

## 11. Risk Assessment of Absorption

### 11.1 Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Product leg decomposition breaks atomic model** | HIGH | Design as optional overlay — existing NPAs work without legs, complex products get legs |
| **Dify agent count grows to 18+** | MEDIUM | Agent fusion strategy — combine related agents (e.g., SACCR + PCE in one workflow) |
| **Memo generation quality varies** | MEDIUM | Human-in-the-loop review before sign-off; quality scoring agent |
| **Glean dependency (external system)** | MEDIUM | Fallback to Dify KB when Glean unavailable |
| **SACCR calculations need precision** | HIGH | Label as "indicative" not "regulatory grade"; disclaimer on outputs |
| **IFRS classification needs expert validation** | HIGH | Generate draft only; mandatory human review flag |

### 11.2 Organizational Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Other team views us as competition** | MEDIUM | Position as "platform that hosts their expert agents" — collaboration not replacement |
| **SME prompt engineering bottleneck** (their pain point) | HIGH | Our KB-driven approach reduces prompt complexity; knowledge documents > long prompts |
| **Regulatory scrutiny of AI-generated memos** | HIGH | Clear "AI-Generated Draft" watermarks; mandatory human approval step |

### 11.3 What We Should NOT Absorb

- **Their chat-only UI paradigm** — Our dashboard approach is superior for portfolio management
- **Their isolated agent architecture** — Our orchestration pattern ensures cross-department consistency
- **Their lack of persistence** — Our DB-first pattern is essential for production reliability
- **Their Glean-only knowledge strategy** — Our hybrid approach (curated KB + enterprise search) is more robust

---

## 12. Timeline & Resource Estimates

### Consolidated Timeline

```
WEEK 1-2:   Enhanced Intake + Reference NPA Lookup (started in parallel)
WEEK 2-4:   MAS Regulatory Agent + begin Sign-Off Memo Generator
WEEK 4-6:   Product Leg Decomposition + Finance Accounting Agent (started in parallel)
WEEK 6-8:   Complete Memo Generator + begin SACCR/PCE
WEEK 8-10:  SACCR/PCE Calculator + Glean Integration (if available)
WEEK 10-12: Integration testing, quality scoring, production hardening
```

### Effort Breakdown

| Capability | New Dify Workflows | New DB Tables | New API Endpoints | New UI Components | Weeks |
|-----------|-------------------|---------------|------------------|-------------------|-------|
| Enhanced Intake | 0 (update existing) | 1 | 2 | 1 | 1-2 |
| Reference NPA Lookup | 1 | 0 (column add) | 2 | 1 | 2-3 |
| MAS Regulatory | 1 | 1 | 1 | 1 | 3-4 |
| Sign-Off Memo Generator | 1 | 1 | 2 | 1 | 3-4 |
| Product Leg Decomposition | 1 | 1 | 2 | 1 | 4-6 |
| Finance Accounting | 1 | 1 | 1 | 1 | 5-8 |
| SACCR/PCE Calculator | 1 (extend RISK) | 1 | 1 | 1 | 5-7 |
| Glean Integration | 0 (Dify tool) | 0 | 1 | 0 | 3-4 |
| **TOTAL** | **6 new + 1 update** | **6 new + 1 modify** | **12** | **7** | **8-12** |

### Post-Absorption Agent Count

```
CURRENT: 13 agents (11 Dify apps)
AFTER:   17-19 agents (15-17 Dify apps)

New agents:
  + WF_NPA_Reference_Lookup      (Tier 3 worker)
  + WF_NPA_Regulatory             (Tier 3 worker)
  + WF_NPA_Memo_Generator         (Tier 3 worker)
  + WF_NPA_Product_Decomposer    (Tier 3 worker)
  + WF_NPA_Finance_Accounting    (Tier 3 worker)
  + WF_NPA_Credit_Risk_Calc      (sub-agent of RISK, may fuse)
```

---

## Appendix A: Current Agent Inventory {#appendix-a}

| # | Agent ID | Dify App | Type | Tier | Purpose |
|---|----------|----------|------|------|---------|
| 1 | MASTER_COO | CF_COO_Orchestrator | Chat | 1 | Strategic command |
| 2 | NPA_ORCHESTRATOR | CF_NPA_Orchestrator | Chat | 2 | Domain routing |
| 3 | IDEATION | CF_NPA_Ideation | Chat | 3 | Conversational intake |
| 4 | CLASSIFIER | WF_NPA_Classify_Predict | Workflow | 3 | NPA classification |
| 5 | ML_PREDICT | WF_NPA_Classify_Predict | Workflow | 3 | Prediction engine |
| 6 | AUTOFILL | WF_NPA_Autofill | Workflow | 3 | Template population |
| 7 | RISK | WF_NPA_Risk | Workflow | 3 | 5-layer + 7-domain risk |
| 8 | GOVERNANCE | WF_NPA_Governance | Workflow | 3 | Sign-off orchestration |
| 9 | DOC_LIFECYCLE | WF_NPA_Doc_Lifecycle | Workflow | 3 | Document management |
| 10 | MONITORING | WF_NPA_Monitoring | Workflow | 3 | Post-launch monitoring |
| 11 | DILIGENCE | CF_NPA_Query_Assistant | Chat | 3 | Due diligence Q&A |
| 12 | KB_SEARCH | CF_NPA_Query_Assistant | Chat | 4 | Knowledge search |
| 13 | NOTIFICATION | WF_NPA_Notification | Workflow | 4 | Alert delivery |

## Appendix B: Current API Surface {#appendix-b}

### NPA CRUD
- `GET /api/npas` — List NPAs (filterable)
- `GET /api/npas/:id` — Full NPA detail
- `GET /api/npas/:id/form-sections` — Form data by section
- `POST /api/npas` — Create NPA
- `POST /api/npas/seed-demo` — Seed 8 NPAs
- `DELETE /api/npas/seed-demo` — Clear all NPAs

### Agent Persistence (8 endpoints)
- `POST /api/agents/npas/:id/persist/classifier`
- `POST /api/agents/npas/:id/persist/risk`
- `POST /api/agents/npas/:id/persist/autofill`
- `POST /api/agents/npas/:id/persist/ml-predict`
- `POST /api/agents/npas/:id/persist/governance`
- `POST /api/agents/npas/:id/persist/doc-lifecycle`
- `POST /api/agents/npas/:id/persist/monitoring`

### Governance & Approvals
- `GET /api/approvals/npas/:id/signoffs`
- `POST /api/approvals/npas/:id/signoffs/:party/decide`
- `POST /api/approvals/npas/:id/signoffs/:party/approve-conditional`
- `GET /api/approvals/npas/:id/conditions`

### Workflow Transitions (10 endpoints)
- `POST /api/transitions/:id/submit`
- `POST /api/transitions/:id/checker-approve`
- `POST /api/transitions/:id/checker-return`
- `POST /api/transitions/:id/resubmit`
- `POST /api/transitions/:id/request-rework`
- `POST /api/transitions/:id/final-approve`
- `POST /api/transitions/:id/reject`
- `POST /api/transitions/:id/withdraw`
- `POST /api/transitions/:id/launch`
- `POST /api/transitions/:id/extend-validity`

### Dashboard
- `GET /api/dashboard/kpis`
- `GET /api/dashboard/pipeline`
- `GET /api/dashboard/classification-mix`
- `GET /api/dashboard/ageing`

### Risk & Monitoring
- `GET /api/risk-checks/npas/:id`
- `GET /api/risk-checks/npas/:id/hard-stops`
- `GET /api/agents/notifications`
- `GET /api/agents/npas/:id/monitoring-thresholds`

## Appendix C: Current Database Tables {#appendix-c}

### Core (3)
- `npa_projects` — Main NPA records (30+ columns)
- `npa_jurisdictions` — Jurisdiction codes per NPA
- `npa_form_data` — Field values per NPA (key-value with lineage)

### Reference (4)
- `ref_npa_templates` — Template definitions
- `ref_npa_sections` — Form section definitions
- `ref_npa_fields` — Field definitions (80+ fields)
- `ref_field_options` — Dropdown options

### Governance (4)
- `npa_signoffs` — Sign-off party status
- `npa_approvals` — Formal approval records
- `npa_loop_backs` — Rework cycle tracking
- `npa_post_launch_conditions` — Post-launch commitments

### Risk & Assessment (3)
- `npa_risk_checks` — 5-layer + 7-domain risk results
- `npa_intake_assessments` — Domain assessment scores
- `npa_classification_scorecards` — Classification scoring

### Documents (2)
- `npa_documents` — Uploaded documents
- `ref_document_rules` — Document requirement rules

### Monitoring (3)
- `npa_monitoring_thresholds` — Alert thresholds
- `npa_performance_metrics` — KPI snapshots
- `npa_breach_alerts` — SLA/threshold breaches

### Workflow (2)
- `npa_workflow_states` — Stage progression
- `npa_escalations` — Escalation records

### Agent (2)
- `agent_sessions` — Chat session tracking
- `agent_messages` — Message history

### Audit (2)
- `npa_audit_log` — Complete audit trail
- `npa_comments` — User/agent comments

---

## 13. How Their Agents Work (Mechanical Deep-Dive) & Exactly What We Need To Build Each One {#section-13}

This section breaks down exactly HOW each of their 4 expert agents works mechanically — the step-by-step flow, the technology stack decisions, the inputs/outputs — and then maps the precise implementation work required in our system: Dify workflow design, Dify prompt strategy, knowledge base documents, database tables, API endpoints, Angular UI components, environment variables, and integration points.

---

### 13.1 LCS (Legal, Compliance & Secretariat) Expert Agent

#### How Their Agent Works — Step by Step

```
STEP 1: USER INPUT
  User types: "Perform LCS assessment / Generate LCS sign-off memo
               for [[Draft NPA name]]"
  Example: "Perform LCS assessment for TSG2525 Crypto Spot ETF
            Accumulator Decumulator Option"

STEP 2: GLEAN DOCUMENT RETRIEVAL
  Agent calls Glean Search API with the draft NPA name
  → Glean returns the Draft NPA document (Confluence page)
  → Agent reads the full NPA content (Part A, B, C)

STEP 3: EXTRACT REFERENCE NPA NAME
  Agent parses the Draft NPA to find the "Reference NPA" field
  Example: TSG2525 references TSG1917 Exchange Listed IR Option
  → Outputs a candidate list of reference NPA names

STEP 4: HUMAN-IN-THE-LOOP SELECTION
  Agent presents the reference NPA name(s) to the user
  → User confirms or selects the correct reference NPA
  This is a CRITICAL design choice — human selects, not agent

STEP 5: RETRIEVE REFERENCE NPA + L&C SIGNOFF MEMO
  Agent calls Glean again with the confirmed Reference NPA name
  → Retrieves the full Reference NPA document
  → Specifically extracts the ATTACHMENT: the L&C sign-off memo
    that was written for the Reference NPA
  This past memo becomes the TEMPLATE for the new memo

STEP 6: EXTRACT PRODUCT CONTEXT
  From the Draft NPA, agent extracts two key inputs:
  → Product Variation: what changed vs the reference product
  → Target Customer: who is this product for

STEP 7: RUN LCS ASSESSMENT TOPICS (3 parallel prompt chains)
  Each topic is a SEPARATE prompt with its own context window:

  TOPIC A — MAS Engagement:
    Input: Draft NPA + Banking Act KSC references
    Prompt: "Given this product, does MBS need to engage MAS?
             Consider Section 19 Banking Act, MAS Notice 656..."
    Output: MAS engagement assessment (Yes/No + reasoning)

  TOPIC B — Reg 40:
    Input: Draft NPA + Reg 40 framework
    Prompt: "Assess if this product falls under MAS Regulation 40
             (Licensing and Conduct of Business)"
    Output: Reg 40 applicability assessment

  TOPIC C — Trade Reporting:
    Input: Draft NPA + MAS derivatives reporting rules
    Prompt: "Does this product trigger MAS trade reporting obligations?
             Consider MASNET, Subsix, OTC reporting..."
    Output: Trade reporting obligations

STEP 8: INCORPORATE REFERENCE NPA CONSIDERATIONS
  Agent reads the Reference NPA L&C memo and identifies:
  → What L&C topics were covered in the reference
  → What conditions or exceptions were applied
  → These become "Other LCS Consideration" items

STEP 9: GENERATE LCS DRAFT MEMO
  Agent combines all inputs:
  → Product context (variation + customer)
  → 3 topic assessments (MAS, Reg 40, Trade Reporting)
  → Reference NPA L&C patterns
  → Generates a structured LCS sign-off memo

  Output format: Formal memo with sections matching the real
  L&C sign-off memo structure used at the bank
```

#### Their Technology Stack for This Agent

| Component | Their Choice |
|-----------|-------------|
| LLM | Not specified (likely GPT-4 or internal LLM) |
| Knowledge retrieval | **Glean** (enterprise search — searches Confluence, SharePoint) |
| Prompt strategy | Topic-based: 1 master prompt + 3 topic-specific prompts |
| Human-in-the-loop | Yes — user must confirm reference NPA selection |
| Output | Structured LCS Draft Memo (text) |
| Persistence | None visible — chat output only |
| UI | Chatbot interface |

#### Their Stated Pain Points for This Agent
- "Heavy dependency on SME's capability on Prompt Engineering"
- "Too many topics for prompt engineering" (each regulatory topic = separate prompt)
- Implied: prompts need updating when regulations change

---

#### What We Need To Build This In Our System

##### A. Dify Workflow: `WF_NPA_LCS_Expert`

**Type:** Workflow (not Chatflow — deterministic steps, not conversation)

**Dify Workflow Nodes (7 nodes):**

```
Node 1: START
  Inputs:
    - project_id (string, required)
    - draft_npa_json (string — full NPA data from our DB)
    - reference_npa_json (string — reference NPA data, if selected)
    - reference_lcs_memo (string — past L&C memo content, if available)
    - jurisdiction_codes (string — "SG,HK,CN")

Node 2: LLM — EXTRACT PRODUCT CONTEXT
  Prompt: "From this NPA data, extract:
           1. Product variation vs reference
           2. Target customer segment
           3. Key regulatory triggers (new product, cross-border, new asset class)
           Output as JSON: {variation, target_customer, regulatory_triggers[]}"
  Input: draft_npa_json
  Output: product_context_json

Node 3: LLM — MAS ENGAGEMENT ASSESSMENT
  Prompt: [System] You are a MAS regulatory specialist...
          Given this product: {{product_context_json}}
          Jurisdiction: {{jurisdiction_codes}}
          Assess MAS engagement requirement per Banking Act S19, MAS Notice 656.
          {{#if reference_lcs_memo}}Reference NPA L&C memo: {{reference_lcs_memo}}{{/if}}
          Output JSON: {required: bool, reasoning: string, conditions: string[]}
  Knowledge: KB_NPA_Regulatory_Matrix.md (MAS section)

Node 4: LLM — REGULATORY COMPLIANCE ASSESSMENT (Reg 40 + Trade Reporting combined)
  Prompt: [System] You are a compliance specialist...
          Assess: (A) MAS Reg 40 applicability, (B) Trade reporting obligations
          (MASNET, Subsix, OTC derivatives reporting)
          {{#if reference_lcs_memo}}Consider precedent: {{reference_lcs_memo}}{{/if}}
          Output JSON: {reg40: {applicable, reasoning}, trade_reporting: {required, obligations[]}}
  Knowledge: KB_NPA_Regulatory_Matrix.md (Reg 40 + Trade Reporting sections)

Node 5: LLM — GENERATE LCS DRAFT MEMO
  Prompt: [System] You are an L&C sign-off memo author at MBS...
          Combine the following assessments into a formal LCS sign-off memo:
          Product context: {{product_context_json}}
          MAS engagement: {{mas_assessment}}
          Regulatory compliance: {{reg_compliance}}
          Reference NPA L&C precedent: {{reference_lcs_memo}}
          Use this memo structure:
          1. Executive Summary
          2. Product Description & Variation
          3. Regulatory Assessment
             3a. MAS Engagement
             3b. Reg 40 Applicability
             3c. Trade Reporting Obligations
          4. Legal Documentation Requirements
          5. Compliance Conditions & Recommendations
          6. Sign-Off Recommendation (APPROVE / APPROVE_CONDITIONAL / REJECT)
  Output: memo_content (structured text)

Node 6: CODE — ASSEMBLE OUTPUT
  Combines all outputs into final JSON envelope:
  {
    agent_action: "SHOW_LCS_MEMO",
    department: "LCS",
    memo: { content, sections[], recommendation, conditions[] },
    assessments: { mas_engagement, reg40, trade_reporting },
    reference_npa_used: reference_npa_id,
    confidence: 0-100
  }

Node 7: END
  Output: Final JSON
```

##### B. Knowledge Base Document: `KB_NPA_Regulatory_Matrix.md`

```
Content to create (~2000 lines):

Section 1: MAS Regulatory Framework
  - MAS Notice 656 (OTC derivatives reporting)
  - Banking Act Section 19 (permitted activities)
  - MAS Reg 40 (Licensing and Conduct of Business)
  - MAS Net / Subsix trade reporting

Section 2: HKMA / SFC Framework (for HK jurisdiction)
  - SFC Securities and Futures Ordinance
  - SFC Professional Investor classification
  - HKMA OTC derivatives reporting

Section 3: PBOC / SAFE Framework (for China jurisdiction)
  - Cross-border capital flow rules
  - CIBM access regulations
  - PIPL (data privacy)

Section 4: Product-Specific Regulatory Mapping
  Table: product_category × jurisdiction → regulatory requirements
  Example: "Credit Derivatives" + "SG" → MAS Notice 656 + ISDA + Trade Reporting

Section 5: Precedent Database
  For each NPA type, what regulatory assessments were historically required
```

##### C. Database Changes

```sql
-- New table: store generated memos
CREATE TABLE npa_signoff_memos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,     -- 'LCS', 'CREDIT_RISK', 'FINANCE', etc.
  version INT DEFAULT 1,
  memo_content LONGTEXT,                -- Full memo text (markdown/HTML)
  memo_sections JSON,                   -- Structured sections array
  recommendation ENUM('APPROVE','APPROVE_CONDITIONAL','REJECT','NEEDS_INFO'),
  conditions JSON,                      -- Array of conditions if conditional
  assessments JSON,                     -- Raw assessment outputs (MAS, Reg40, etc.)
  reference_npa_id VARCHAR(50),         -- Which reference NPA was used
  confidence_score DECIMAL(5,2),
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(100),             -- NULL until human reviews
  reviewed_at DATETIME,
  review_status ENUM('DRAFT','REVIEWED','APPROVED','REJECTED') DEFAULT 'DRAFT',
  FOREIGN KEY (project_id) REFERENCES npa_projects(id)
);
```

##### D. API Endpoints

```javascript
// 1. Generate LCS memo
// POST /api/agents/npas/:id/generate-memo/lcs
// Calls WF_NPA_LCS_Expert with NPA data from DB
// Saves result to npa_signoff_memos
// Returns generated memo

// 2. Get all memos for an NPA
// GET /api/npas/:id/memos
// Returns all department memos

// 3. Get specific department memo
// GET /api/npas/:id/memos/:department
// Returns latest memo for that department

// 4. Review/approve a memo
// PUT /api/npas/:id/memos/:memoId/review
// Body: { reviewed_by, review_status, comments }
```

##### E. Agent Registration

```javascript
// Add to server/config/dify-agents.js:
LCS_EXPERT: {
    key: process.env.DIFY_KEY_LCS_EXPERT || '',
    type: 'workflow',
    difyApp: 'WF_NPA_LCS_Expert',
    name: 'LCS Expert Agent',
    tier: 3,
    icon: 'scale',
    color: 'bg-rose-50 text-rose-600'
}
```

##### F. Environment Variable

```
# Add to server/.env:
DIFY_KEY_LCS_EXPERT=app-xxxxxxxxxxxxxxxx
```

##### G. Angular UI Component

```
Component: LcsMemoComponent
Location: src/app/components/npa/agent-results/lcs-memo.component.ts

Features:
  - Shows generated LCS memo content (formatted markdown)
  - "Generate Memo" button (calls POST /api/agents/npas/:id/generate-memo/lcs)
  - "Regenerate" button (creates new version)
  - Memo section navigator (jump to MAS, Reg 40, Trade Reporting)
  - Reference NPA selector (dropdown of similar NPAs)
  - Review status badge (DRAFT / REVIEWED / APPROVED)
  - Human review form (approve/reject with comments)
  - Version history (show all versions of the memo)
```

##### H. Integration with Existing Agents

```
GOVERNANCE agent → When LCS sign-off is PENDING, suggest "Generate LCS Memo"
RISK agent → Pass regulatory domain findings as input to LCS_EXPERT
REFERENCE_LOOKUP → Provide reference NPA selection to LCS_EXPERT
DOC_LIFECYCLE → Track the generated memo as a document artifact
```

---

### 13.2 Credit Risk Expert Agent

#### How Their Agent Works — Step by Step

```
STEP 1: USER INPUT
  User types: "Perform credit risk assessment for [[Draft NPA name]]"
  Example: "Perform credit risk assessment for TSG2418 Repo To Maturity"

STEP 2: GLEAN RETRIEVAL
  Agent retrieves Draft NPA from Glean (full document)

STEP 3: IDENTIFY PRODUCT VARIATION
  Agent extracts: what is this product, how does it differ from
  the reference/existing product?
  → Output: product_variation description

STEP 4: IDENTIFY PRODUCT LEGS  ← THIS IS THE KEY INNOVATION
  Agent decomposes the product into constituent legs/blocks:

  Example — Equity-Linked Note (ELN):
    Leg 1: Equity Put Option (EQD|OPT|ELN)
    Leg 2: Structured Note / LNBR (FI|NOTE|LNBR)

  Example — Repo To Maturity:
    Leg 1: Cash lending (deposit)
    Leg 2: Collateral (bond holding)

  Example — Accumulator:
    Leg 1: Forward contract (series of forwards)
    Leg 2: Knock-out barrier option

  → For EACH leg, the agent decides which credit risk topics apply

STEP 5: PER-LEG CREDIT RISK ASSESSMENT (5 topics, run per leg)

  TOPIC A — Pre-Assessment:
    "What is the initial credit quality of this leg?
     Counterparty rating, exposure type, industry sector"
    Output: pre_assessment per leg

  TOPIC B — Settlement Risk:
    "What is the settlement risk for this leg?
     Settlement method (DVP, FOP, cash), T+N lag, currency mismatch,
     time zone gap, fail risk"
    Output: settlement_risk per leg

  TOPIC C — PCE (Potential Credit Exposure):
    "Calculate the Potential Credit Exposure for this leg.
     Consider: current mark-to-market, add-on factor by asset class,
     maturity, netting benefit"
    Output: pce_estimate per leg

  TOPIC D — SACCR (Standardized Approach to CCR):
    "Calculate SACCR capital charge for this leg.
     RC (Replacement Cost) + PFE (Potential Future Exposure)
     using Basel III add-on factors:
       - Interest Rate: 0.50%
       - FX: 4.0%
       - Credit: 0.46% (IG) / 1.2% (SG)
       - Equity: 20% (single) / 10% (index)
       - Commodity: 18%
     Apply alpha = 1.4
     EAD = alpha * (RC + PFE)"
    Output: saccr_calculation per leg

  TOPIC E — Crypto Product Specific:
    "If product involves crypto/digital assets, assess:
     custody risk, smart contract risk, blockchain settlement risk,
     regulatory uncertainty, correlation to TradFi"
    Output: crypto_assessment (if applicable)

STEP 6: AGGREGATE ACROSS LEGS
  Agent combines per-leg assessments:
  → Total EAD = sum of per-leg EADs
  → Highest risk leg determines overall rating
  → Netting benefits applied across legs if under same ISDA

STEP 7: GENERATE CREDIT RISK REPORT
  Structured report with:
  - Product decomposition (legs table)
  - Per-leg risk assessment (5 topics per leg)
  - Aggregated exposure (total EAD, total capital charge)
  - Recommendations (mitigants, limits, collateral requirements)
  - Sign-off recommendation
```

#### What We Need To Build This In Our System

##### A. Dify Workflow: `WF_NPA_Credit_Risk_Expert`

**Workflow Nodes (8 nodes):**

```
Node 1: START
  Inputs: project_id, draft_npa_json, product_legs_json (if already decomposed)

Node 2: LLM — PRODUCT DECOMPOSITION (if legs not provided)
  Prompt: "Decompose this product into constituent legs/blocks.
           For each leg identify: leg_type, asset_class, murex_typology,
           notional_allocation, settlement_method"
  Output: product_legs[] array

Node 3: LOOP (for each product leg) — contains 3 LLM sub-nodes:

  Node 3a: LLM — PRE-ASSESSMENT + SETTLEMENT RISK
    Prompt: "For leg {{leg_number}} ({{leg_type}}):
             1. Pre-assessment: counterparty quality, exposure type
             2. Settlement risk: DVP/FOP, T+N, fail probability"
    Output: {pre_assessment, settlement_risk} for this leg

  Node 3b: LLM — PCE + SACCR CALCULATION
    Prompt: "For leg {{leg_number}} ({{leg_type}}):
             Calculate PCE and SACCR.
             Use Basel III SA-CCR methodology:
             Notional: {{leg.notional}}
             Asset class: {{leg.asset_class}}
             Maturity: {{leg.tenor}}
             Add-on factors: [from KB_NPA_SACCR_Rules.md]
             Compute: RC, PFE, EAD = 1.4 * (RC + PFE)"
    Knowledge: KB_NPA_SACCR_Rules.md
    Output: {pce, saccr: {rc, pfe, ead, add_on_factor}} for this leg

  Node 3c: LLM — CRYPTO ASSESSMENT (conditional — only if crypto leg)
    Condition: IF leg.asset_class == 'CRYPTO' OR leg.asset_class == 'DIGITAL_ASSET'
    Output: crypto_risks for this leg

Node 4: LLM — AGGREGATE + GENERATE REPORT
  Combines all per-leg outputs into Credit Risk Report
  Output: structured report with recommendations

Node 5: CODE — ASSEMBLE OUTPUT
  {
    agent_action: "SHOW_CREDIT_RISK_REPORT",
    department: "CREDIT_RISK",
    product_legs: [{leg_number, type, assessment, pce, saccr}],
    aggregate: {total_ead, total_capital, overall_rating},
    memo: {content, sections[], recommendation},
    confidence: 0-100
  }

Node 6: END
```

##### B. Knowledge Base: `KB_NPA_SACCR_Rules.md`

```
Content (~1500 lines):

Section 1: SA-CCR Methodology Overview
  - Replacement Cost (RC) calculation
  - Potential Future Exposure (PFE) calculation
  - EAD = alpha * (RC + PFE), alpha = 1.4
  - Aggregation formula for netting sets

Section 2: Add-On Factors by Asset Class
  Table:
  | Asset Class | Supervisory Factor | Correlation |
  | Interest Rate | 0.50% | N/A |
  | FX | 4.0% | N/A |
  | Credit (IG) | 0.46% | 50% |
  | Credit (SG) | 1.20% | 80% |
  | Equity (single) | 32% | 50% |
  | Equity (index) | 20% | 80% |
  | Commodity (energy) | 40% | 40% |
  | Commodity (metals) | 18% | 40% |

Section 3: Maturity Factor
  MF = sqrt(min(M, 1)) where M = maturity in years
  For M < 10 business days: MF = floor formula

Section 4: Netting Benefits
  When trades under same ISDA netting set:
  Net RC = max(CMV - NICA, 0)  (net of collateral)
  PFE multiplier based on net/gross ratio

Section 5: PCE Calculation Guide
  Current exposure + add-on by product type

Section 6: Product-Specific Examples
  - IRS: notional * SF_IR * MF * multiplier
  - FX Forward: notional * SF_FX * MF
  - CDS: notional * SF_CR * MF
  - Equity Option: notional * SF_EQ * MF * delta
```

##### C. Database Changes

```sql
-- Product legs table
CREATE TABLE npa_product_legs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  leg_number INT NOT NULL,
  leg_name VARCHAR(200),
  leg_type VARCHAR(100),       -- 'EQUITY_OPTION', 'STRUCTURED_NOTE', 'FX_FORWARD', etc.
  asset_class VARCHAR(50),     -- 'IR', 'FX', 'CREDIT', 'EQUITY', 'COMMODITY', 'CRYPTO'
  murex_typology VARCHAR(100), -- 'EQD|OPT|ELN', 'FI|NOTE|LNBR'
  notional DECIMAL(20,2),
  currency VARCHAR(10),
  tenor VARCHAR(50),
  booking_entity VARCHAR(50),
  settlement_method VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES npa_projects(id)
);

-- Credit risk calculations (per-leg)
CREATE TABLE npa_credit_risk_calculations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  leg_id INT,                           -- FK to npa_product_legs.id (NULL = aggregate)
  calc_type ENUM('PRE_ASSESSMENT','SETTLEMENT_RISK','PCE','SACCR','CRYPTO','AGGREGATE'),
  score DECIMAL(5,2),
  status ENUM('PASS','WARN','FAIL'),
  replacement_cost DECIMAL(20,2),       -- RC for SACCR
  potential_future_exposure DECIMAL(20,2), -- PFE for SACCR
  exposure_at_default DECIMAL(20,2),    -- EAD = alpha * (RC + PFE)
  add_on_factor DECIMAL(8,4),           -- Supervisory factor used
  risk_weight DECIMAL(8,4),
  capital_charge DECIMAL(20,2),
  findings JSON,                        -- Detailed narrative findings
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES npa_projects(id),
  FOREIGN KEY (leg_id) REFERENCES npa_product_legs(id)
);
```

##### D. API Endpoints

```javascript
// Product leg management
// POST /api/npas/:id/decompose — Auto-decompose product into legs
// GET  /api/npas/:id/legs — Get all legs for NPA
// PUT  /api/npas/:id/legs/:legId — Update a leg manually

// Credit risk calculation
// POST /api/agents/npas/:id/generate-memo/credit-risk — Run full credit risk assessment
// GET  /api/npas/:id/credit-risk — Get credit risk results (per-leg + aggregate)
// POST /api/agents/npas/:id/persist/credit-risk — Persist credit risk results
```

##### E. Agent Registration + Env Var

```javascript
// dify-agents.js:
CREDIT_RISK_EXPERT: {
    key: process.env.DIFY_KEY_CREDIT_RISK_EXPERT || '',
    type: 'workflow',
    difyApp: 'WF_NPA_Credit_Risk_Expert',
    name: 'Credit Risk Expert Agent',
    tier: 3,
    icon: 'landmark',
    color: 'bg-orange-50 text-orange-600'
}

// .env:
// DIFY_KEY_CREDIT_RISK_EXPERT=app-xxxxxxxxxxxxxxxx
```

##### F. Angular UI Component

```
Component: CreditRiskReportComponent
Location: src/app/components/npa/agent-results/credit-risk-report.component.ts

Features:
  - Product Legs visualization (table showing leg breakdown)
  - Per-leg assessment cards (Pre-Assessment, Settlement, PCE, SACCR)
  - SACCR calculation breakdown (RC + PFE = EAD, with add-on factors shown)
  - Aggregate exposure summary (total EAD, capital charge, risk weight)
  - "Run Credit Risk Assessment" button
  - "Decompose Product" button (if legs not yet identified)
  - Integration with existing Risk tab (appears as sub-section)
```

---

### 13.3 FO (Front Office) Expert Agent

#### How Their Agent Works — Step by Step

```
STEP 1: User enters new product name

STEP 2: Agent asks for product details (structured questionnaire):
  1. Product Description
  2. Business Unit
  3. Target Customer
  4. Reference NPA (if any)
  5. Product or process variation in contrast to the reference NPA
  6. Proposed booking

STEP 3: User provides the details of the product

STEP 4: Agent asks if additional information is needed
  (Agent determines if any fields are incomplete or ambiguous)

STEP 5: User provides additional info

STEP 6: Agent generates "NPA Product Basic Information Report"
  This is essentially Part A of the NPA document — the basic product
  information that the Proposer/Preparer fills out before review begins.
```

#### What We Need To Build This In Our System

**This maps directly to our existing IDEATION agent.** The change is enhancing it from open-ended chat to structured intake.

##### A. Dify Changes: Update `CF_NPA_Ideation` Prompt

```
Current IDEATION: Open-ended conversational discovery
Enhanced IDEATION: Structured 6-question intake + open discovery

Updated prompt strategy:
  Phase 1 (Structured): Walk through 6 mandatory questions sequentially
    Q1: "What is the product name and a brief description?"
    Q2: "Which Business Unit and desk will own this product?"
    Q3: "Who is the target customer segment?"
    Q4: "Is there a reference/predecessor NPA? If yes, which one?"
    Q5: "What is the variation from the reference product?"
    Q6: "What is the proposed Murex booking model?"

  Phase 2 (Discovery): Open-ended follow-up
    "Based on what you've shared, I have a few follow-up questions..."
    → Agent identifies gaps and asks clarifying questions

  Phase 3 (Report Generation):
    Generate structured "NPA Product Basic Information Report"
    → Maps answers to npa_form_data field keys
    → Calls AUTOFILL to populate remaining template fields
```

##### B. Database Changes

```sql
CREATE TABLE npa_intake_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  question_key VARCHAR(100) NOT NULL,    -- 'product_description', 'business_unit', etc.
  question_text VARCHAR(500),
  status ENUM('PENDING','ANSWERED','SKIPPED') DEFAULT 'PENDING',
  answer_value TEXT,
  confidence DECIMAL(5,2),
  answered_at DATETIME,
  UNIQUE KEY (project_id, question_key),
  FOREIGN KEY (project_id) REFERENCES npa_projects(id)
);
```

##### C. API Endpoints

```javascript
// GET  /api/npas/:id/intake/progress — Get intake checklist status
// POST /api/npas/:id/intake/answer   — Save answer to a question
// GET  /api/npas/:id/intake/report   — Generate Product Basic Info Report
```

##### D. Angular UI: Intake Progress Sidebar

```
Enhancement to existing NPA detail page:

Left sidebar showing:
  [x] Product Description ........... Answered
  [x] Business Unit ................. Answered
  [ ] Target Customer ............... Pending
  [ ] Reference NPA ................. Pending
  [ ] Product Variation ............. Pending
  [ ] Proposed Booking .............. Pending
  ────────────────────────────────
  Completeness: 33% (2/6)
  Status: INCOMPLETE — cannot proceed to REVIEW

"Generate Basic Info Report" button (enabled at 100%)
```

**No new Dify app needed — update existing CF_NPA_Ideation prompt.**
**No new env var needed.**

---

### 13.4 Finance Accounting Expert Agent

#### How Their Agent Works — Step by Step

```
PATH A: CREATE ACCOUNTING PAPER

  STEP 1: User selects "Create Accounting Paper"
  STEP 2: Agent asks for product details + accounting standard
    Example: "We plan to hold physical crypto currencies such as BTC,
             help to assess the accounting treatment based on applicable
             accounting standard such as IFRS, IRFIC and IAS"
  STEP 3: User provides product + standard info
  STEP 4: Reasoning Model processes the request
    → Applies IFRS 9 classification logic
    → Considers IAS 32 (financial instruments presentation)
    → Considers IFRIC interpretations
    → Determines: Amortised Cost / FVPL / FVOCI / Hedge Accounting
  STEP 5: Generates structured "Accounting Paper"
    → Classification rationale
    → Balance sheet treatment
    → P&L recognition pattern
    → Hedge accounting eligibility (if applicable)
    → Tax implications

PATH B: EXTRACT ACCOUNTING ENTRIES

  STEP 1: User selects "Extract Accounting Entries"
  STEP 2: Agent asks user to:
    a) Upload accounting entries reference (from existing product)
    b) Provide draft NPA name
  STEP 3: Agent retrieves Draft NPA from Glean
  STEP 4: Agent reads the uploaded accounting entries reference
  STEP 5: Agent extracts the GL journal entries from the reference
  STEP 6: Agent adapts entries for the new product
    → Changes account codes to match new booking entity
    → Adjusts for currency differences
    → Modifies for product-specific accounting treatment
  STEP 7: Generates "Accounting Entries for the Product"
    → Structured journal entry table
    → Debit/credit pairs
    → Account descriptions
    → Frequency (daily/monthly/maturity)
```

#### What We Need To Build This In Our System

##### A. Dify Workflow: `WF_NPA_Finance_Expert`

**Workflow Nodes (6 nodes):**

```
Node 1: START
  Inputs: project_id, draft_npa_json, mode ('accounting_paper' | 'journal_entries'),
          reference_accounting_entries (optional — from reference NPA)

Node 2: LLM — IFRS CLASSIFICATION
  Prompt: "Classify this financial product under IFRS 9:
           Product: {{draft_npa_json.product_category}}
           Description: {{draft_npa_json.description}}
           Determine:
           1. IFRS 9 classification: Amortised Cost / FVPL / FVOCI
           2. Business model test result
           3. SPPI (Solely Payments of Principal and Interest) test result
           4. Hedge accounting eligibility
           5. Day 1 P&L considerations
           Reference: KB_NPA_Finance_Accounting.md"
  Knowledge: KB_NPA_Finance_Accounting.md
  Output: ifrs_classification JSON

Node 3: LLM — BALANCE SHEET & P&L TREATMENT
  Prompt: "Given IFRS classification: {{ifrs_classification}}
           Determine:
           1. Balance sheet line item
           2. Fair value measurement hierarchy (Level 1/2/3)
           3. P&L recognition: when and how revenue recognized
           4. Impairment model: ECL (expected credit loss) staging
           5. OCI recycling rules (if FVOCI)
           6. Deferred income / prepaid treatment"
  Output: accounting_treatment JSON

Node 4: LLM — JOURNAL ENTRIES (conditional on mode)
  IF mode == 'journal_entries':
    Prompt: "Generate GL journal entries for this product lifecycle:
             a) Initial recognition (trade date)
             b) Subsequent measurement (mark-to-market / amortisation)
             c) Coupon/premium payment (periodic)
             d) Maturity / settlement
             e) Impairment (if applicable)
             For each entry: Dr/Cr, GL account, description, frequency
             {{#if reference_accounting_entries}}
             Adapt from reference: {{reference_accounting_entries}}
             {{/if}}"
    Output: journal_entries[] array
  ELSE:
    Skip — output null

Node 5: LLM — GENERATE ACCOUNTING PAPER / MEMO
  Prompt: "Generate a Finance sign-off accounting paper:
           1. Product Overview
           2. IFRS 9 Classification Analysis
           3. Balance Sheet Treatment
           4. P&L Impact Analysis
           5. Regulatory Capital Treatment (SA-CCR / Standardised)
           6. Tax Considerations
           7. Journal Entry Summary (if available)
           8. Finance Sign-Off Recommendation"
  Output: memo_content

Node 6: END
  Output: {
    agent_action: "SHOW_FINANCE_MEMO",
    department: "FINANCE",
    ifrs_classification, accounting_treatment, journal_entries,
    memo: {content, recommendation}, confidence
  }
```

##### B. Knowledge Base: `KB_NPA_Finance_Accounting.md`

```
Content (~2500 lines):

Section 1: IFRS 9 Classification Decision Tree
  Step 1: Business Model Test (Hold to Collect / Hold to Collect & Sell / Other)
  Step 2: SPPI Test (cashflows are solely P&I?)
  → Matrix: Business Model × SPPI → Classification

Section 2: Product-to-Classification Mapping
  | Product Type | Typical Classification | Rationale |
  | Vanilla IRS | FVPL (Trading) | Active market-making |
  | Vanilla Bond (HTM) | Amortised Cost | Hold-to-collect |
  | FX Forward | FVPL | Short-term trading |
  | CDS | FVPL | Credit derivative |
  | Structured Note (issued) | FVPL (FVO) | Fair Value Option |
  | ETF Subscription | FVOCI | Hold-to-collect-and-sell |
  | DCD | FVPL (embedded derivative) | Bifurcation or FVO |

Section 3: GL Account Structure (MBS-specific)
  Account code patterns for:
  - Trading assets (FVPL)
  - Investment securities (AC / FVOCI)
  - Derivative assets/liabilities
  - Margin accounts
  - Fee income / interest income

Section 4: Regulatory Capital Treatment
  - Trading Book vs Banking Book assignment
  - SA-CCR for derivatives (add-on factors)
  - CVA capital charge
  - Market risk (Standardised / IMA)

Section 5: Tax Treatment by Product
  - Withholding tax implications
  - Transfer pricing for cross-border
  - GST/VAT on fees
```

##### C. Database Table

```sql
CREATE TABLE npa_accounting_treatment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(50) NOT NULL,
  ifrs_classification VARCHAR(50),     -- 'FVPL', 'AMORTISED_COST', 'FVOCI', 'HEDGE'
  business_model_test VARCHAR(100),
  sppi_test_result ENUM('PASS','FAIL'),
  bs_line_item VARCHAR(200),           -- Balance sheet line
  fv_hierarchy ENUM('LEVEL_1','LEVEL_2','LEVEL_3'),
  pnl_recognition TEXT,
  impairment_model VARCHAR(100),       -- 'ECL_STAGE_1', 'ECL_STAGE_2', 'N/A'
  journal_entries JSON,                -- Array of {dr_cr, gl_account, description, amount, frequency}
  tax_treatment JSON,
  capital_treatment JSON,              -- {book: 'TRADING'|'BANKING', method: 'SA-CCR'|'SA', rwa: amount}
  memo_content LONGTEXT,
  recommendation ENUM('APPROVE','APPROVE_CONDITIONAL','REJECT','NEEDS_INFO'),
  confidence_score DECIMAL(5,2),
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  reviewed_by VARCHAR(100),
  review_status ENUM('DRAFT','REVIEWED','APPROVED') DEFAULT 'DRAFT',
  FOREIGN KEY (project_id) REFERENCES npa_projects(id)
);
```

##### D. Agent Registration + Env Var

```javascript
FINANCE_EXPERT: {
    key: process.env.DIFY_KEY_FINANCE_EXPERT || '',
    type: 'workflow',
    difyApp: 'WF_NPA_Finance_Expert',
    name: 'Finance Accounting Expert Agent',
    tier: 3,
    icon: 'calculator',
    color: 'bg-green-50 text-green-600'
}

// .env: DIFY_KEY_FINANCE_EXPERT=app-xxxxxxxxxxxxxxxx
```

---

### 13.5 Reference NPA Lookup (Cross-Cutting Capability)

This is not a standalone agent in their POC — it's a PATTERN used by every agent (the "Retrieve from Glean" step). We need to implement this as a shared capability.

#### How It Works In Their System

```
Every agent flow starts the same way:
  1. User provides Draft NPA name (e.g., "TSG2525 Crypto Spot ETF")
  2. Agent calls Glean Search API: query = Draft NPA name
  3. Glean returns the full NPA document from Confluence
  4. Agent parses the document to find "Reference NPA" field
  5. Agent calls Glean again: query = Reference NPA name
  6. Glean returns the Reference NPA document + all attachments
  7. Agent specifically extracts the sign-off memo attachment
     for the relevant department
```

#### What We Need To Build

Since we don't have Glean, our approach replaces enterprise search with **database-driven similarity matching** + optional Glean integration later:

##### A. Dify Workflow: `WF_NPA_Reference_Lookup`

```
Node 1: START
  Input: project_id, product_category, npa_type, risk_level, jurisdictions, description

Node 2: CODE — DATABASE SIMILARITY QUERY
  Query our npa_projects table:
  SELECT id, title, product_category, npa_type, risk_level,
         approval_track, description
  FROM npa_projects
  WHERE id != {{project_id}}
  ORDER BY
    (product_category = {{product_category}}) * 40 +  -- Same product category: 40 pts
    (npa_type = {{npa_type}}) * 20 +                  -- Same NPA type: 20 pts
    (risk_level = {{risk_level}}) * 10 +              -- Same risk level: 10 pts
    (approval_track = {{approval_track}}) * 15         -- Same track: 15 pts
  DESC
  LIMIT 5

Node 3: LLM — SEMANTIC SIMILARITY SCORING
  Prompt: "Given this NPA description: {{description}}
           Rank these 5 candidates by relevance:
           {{candidate_list}}
           Return top 3 with similarity scores 0-100"
  Output: ranked_references[3]

Node 4: END
  Output: {
    agent_action: "SHOW_REFERENCES",
    references: [{id, title, similarity_score, match_reasons[]}]
  }
```

##### B. API Endpoint

```javascript
// GET /api/npas/:id/similar?limit=5
// Returns similar NPAs based on product fingerprint matching

// PUT /api/npas/:id/reference
// Body: { reference_npa_id: 'TSG2026-102' }
// Sets the chosen reference NPA
```

##### C. Schema Change

```sql
ALTER TABLE npa_projects ADD COLUMN reference_npa_id VARCHAR(50) DEFAULT NULL;
```

##### D. UI Enhancement

```
In NPA detail page, add "Reference NPA" panel:
  - Auto-suggested similar NPAs (3 cards with similarity %)
  - "Select as Reference" button on each card
  - Selected reference shows as linked card
  - "View Reference NPA" link opens the reference in new tab
  - Reference NPA's sign-off memos available for each Expert Agent
```

---

### 13.6 Summary: Complete Build Checklist

#### New Dify Workflows to Create (4)

| # | Workflow Name | Type | Nodes | KB Required |
|---|-------------|------|-------|-------------|
| 1 | `WF_NPA_LCS_Expert` | Workflow | 7 | KB_NPA_Regulatory_Matrix.md |
| 2 | `WF_NPA_Credit_Risk_Expert` | Workflow | 8 | KB_NPA_SACCR_Rules.md |
| 3 | `WF_NPA_Finance_Expert` | Workflow | 6 | KB_NPA_Finance_Accounting.md |
| 4 | `WF_NPA_Reference_Lookup` | Workflow | 4 | None (DB query + LLM) |

#### Existing Dify App to Update (1)

| # | App | Change |
|---|-----|--------|
| 1 | `CF_NPA_Ideation` | Add structured 6-question intake sequence to prompt |

#### New Knowledge Base Documents to Write (3)

| # | Document | Estimated Size | Priority |
|---|----------|---------------|----------|
| 1 | `KB_NPA_Regulatory_Matrix.md` | ~2000 lines | Tier 1 |
| 2 | `KB_NPA_SACCR_Rules.md` | ~1500 lines | Tier 2 |
| 3 | `KB_NPA_Finance_Accounting.md` | ~2500 lines | Tier 2 |

#### New Database Tables (4)

| # | Table | Columns | FK |
|---|-------|---------|-----|
| 1 | `npa_signoff_memos` | 14 cols | project_id -> npa_projects |
| 2 | `npa_product_legs` | 13 cols | project_id -> npa_projects |
| 3 | `npa_credit_risk_calculations` | 15 cols | project_id, leg_id |
| 4 | `npa_accounting_treatment` | 16 cols | project_id -> npa_projects |
| 5 | `npa_intake_progress` | 8 cols | project_id -> npa_projects |

#### Schema Modifications (1)

| # | Table | Change |
|---|-------|--------|
| 1 | `npa_projects` | Add `reference_npa_id VARCHAR(50)` |

#### New Environment Variables (4)

```
DIFY_KEY_LCS_EXPERT=app-xxxxx
DIFY_KEY_CREDIT_RISK_EXPERT=app-xxxxx
DIFY_KEY_FINANCE_EXPERT=app-xxxxx
DIFY_KEY_REFERENCE_LOOKUP=app-xxxxx
```

#### New Agent Registrations in `dify-agents.js` (4)

```javascript
LCS_EXPERT:          { type: 'workflow', tier: 3, icon: 'scale' }
CREDIT_RISK_EXPERT:  { type: 'workflow', tier: 3, icon: 'landmark' }
FINANCE_EXPERT:      { type: 'workflow', tier: 3, icon: 'calculator' }
REFERENCE_LOOKUP:    { type: 'workflow', tier: 3, icon: 'link' }
```

#### New API Endpoints (11)

```
POST /api/agents/npas/:id/generate-memo/lcs
POST /api/agents/npas/:id/generate-memo/credit-risk
POST /api/agents/npas/:id/generate-memo/finance
GET  /api/npas/:id/memos
GET  /api/npas/:id/memos/:department
PUT  /api/npas/:id/memos/:memoId/review
GET  /api/npas/:id/similar
PUT  /api/npas/:id/reference
POST /api/npas/:id/decompose
GET  /api/npas/:id/legs
GET  /api/npas/:id/credit-risk
```

#### New Angular Components (4)

```
1. LcsMemoComponent — LCS memo display + generation
2. CreditRiskReportComponent — Per-leg credit risk + SACCR
3. FinanceAccountingComponent — IFRS classification + journal entries
4. IntakeProgressComponent — Structured intake sidebar
```

#### Modified Angular Components (2)

```
1. NpaDetailComponent — Add new tabs for LCS, Credit Risk, Finance memos
2. NpaAgentComponent — Enhanced ideation with structured intake
```

---

*End of Document*

*This document should be treated as a living strategy document. As capabilities are absorbed, each section should be updated with actual implementation details, lessons learned, and revised estimates.*
