# KB_Domain_Orchestrator_NPA — NPA Domain Deep-Dive (Phase 0)

**Version**: 3.0 — Enterprise-Grade, Aligned to ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md
**Purpose**: Definitive NPA domain reference — lifecycle, classification logic, approval workflows, risk cascades, document rules, template structure, specialist coordination, edge cases, escalation procedures
**Attached To**: CF_NPA_Orchestrator (KB_NPA_AGENT_KBS_CLOUD), CF_NPA_Query_Assistant (KB_NPA_AGENT_KBS_CLOUD)
**Last Updated**: 2026-02-13

---

## 1. Document Role & Scope

This knowledge base is the **NPA domain brain**. It contains everything an agent needs to understand, reason about, and handle any NPA-related request — from a simple status query to a complex cross-border NTG classification edge case.

**Relationship to KB_Master_COO_Orchestrator.md**:
- Master COO KB = **HOW to route** (tools, envelope, intent, conversation variables, HTTP delegation)
- This document = **WHAT to route and WHY** (NPA business rules, classification logic, approval flows, risk cascades, document requirements, edge cases, escalation procedures)

**Who uses this KB**:
- `CF_NPA_Orchestrator`: Needs domain knowledge to make intelligent routing decisions, validate stage-appropriateness, and provide context-aware suggestions
- `CF_NPA_Query_Assistant`: Needs domain knowledge to answer complex NPA questions with accurate business logic, cite rules, and explain "why" behind processes

---

## 2. NPA Lifecycle — 6 Logical Orchestration Stages with Gate Conditions

> **Important**: These are **logical orchestration stages** used by the Dify agent routing layer. They describe the conceptual workflow the orchestrator follows when guiding an NPA through specialist agents. They are NOT the same as:
> - **`npa_projects.current_stage`** (DB column) — stores the project's current stage as free text, e.g. `"IDEATION"`, `"CLASSIFICATION"`
> - **`npa_workflow_states.stage_id`** (DB column) — tracks stage progression with timestamps
> - **Angular `NpaStage` type** — defines the maker/checker/signoff workflow states: `DRAFT → PENDING_CHECKER → RETURNED_TO_MAKER → PENDING_SIGN_OFFS → PENDING_FINAL_APPROVAL → APPROVED/REJECTED`
>
> The Angular stages model the internal governance workflow (maker submits, checker reviews, approvers sign off). The orchestration stages below model the agent-assisted lifecycle (ideation, classify, risk, autofill, governance, monitoring).

### 2.1 Stage Flow

```
IDEATION --> CLASSIFICATION --> RISK_ASSESSMENT --> AUTOFILL --> SIGN_OFF --> POST_LAUNCH
    |              |                  |                |            |
    v              v                  v                v            v
 Project       Type + Track       Risk Score       Template     Approved
 Created       Assigned           Evaluated        Filled       Product
```

Each transition has **entry gates** (what must be true to start), **exit gates** (what must be true to finish), and **blocking conditions** (what prevents advancement).

### 2.2 Stage Detail Matrix

| Stage | Dify App | Entry Gate | Exit Gate | Blocker | Human Checkpoint |
|-------|----------|-----------|-----------|---------|-----------------|
| **IDEATION** | CF_NPA_Ideation | User requests new product | project_id assigned, concept saved | None (always allowed) | User confirms product concept |
| **CLASSIFICATION** | WF_NPA_Classify_Predict | project_id exists | Classification score + track assigned, ML prediction saved | Missing project_id | User reviews classification + prediction |
| **RISK_ASSESSMENT** | WF_NPA_Risk | Classification complete | Risk assessment stored, prerequisites validated | Hard stop (prohibited match) | User reviews risk; if hard stop, NPA blocked |
| **AUTOFILL** | WF_NPA_Autofill | Risk assessment complete, no hard stop | Template fields populated with lineage | Risk hard stop not cleared | User reviews template, edits ADAPTED/MANUAL fields |
| **SIGN_OFF** | WF_NPA_Governance_Ops | Template substantially complete | All mandatory sign-offs obtained | Missing critical documents, circuit breaker (3 reworks) | Each sign-off party reviews independently |
| **POST_LAUNCH** | WF_NPA_Governance_Ops | NPA approved, product launched | PIR completed, monitoring established | Breach thresholds exceeded | Ongoing monitoring review |

### 2.3 Stage Transition Rules

- **Forward transitions** are the standard path (IDEATION -> CLASSIFICATION -> ...). The orchestrator suggests the next logical step after each action.
- **Backward transitions** (re-entry) are allowed: user can re-classify, re-run risk, update template at any time. The orchestrator calls the same workflow with the same project_id; the workflow handles overwrite/update logic.
- **Skip transitions** are discouraged but not hard-blocked. If a user insists on skipping (e.g., "run risk before classifying"), the orchestrator warns but proceeds. The specialist workflow will work with whatever data exists.
- **Parallel read access** is always available: `CF_NPA_Query_Assistant` can answer questions about any stage regardless of the project's current stage.

---

## 3. Classification Deep-Dive

Classification is the most complex business logic in the NPA lifecycle. The Classification Agent (`WF_NPA_Classify_Predict`) must correctly determine the NPA type and approval track, as this decision cascades through every subsequent stage.

### 3.1 Three-Tier Classification System

```
NEW-TO-GROUP (NTG)
├── Completely new products/services to DBS Group
├── Novel market approaches, new risk profiles, new technology
├── Requires PAC approval, PIR commitment
├── 12-16 week timeline
└── TRIGGERS: >= 50% of 20 NTG indicators met

VARIATION
├── Modifications to existing products/services
├── MATERIAL (3+ criteria affected) --> Full NPA, 8-12 weeks
├── MINOR (<3 criteria affected) --> NPA Lite, 4-6 weeks
└── Same underlying product framework

EXISTING
├── Previously approved product, minimal changes
├── Different market/customer/implementation
├── NPA Lite, Bundling, or Evergreen eligible
└── 1-6 weeks depending on sub-type
```

### 3.2 NTG Indicators (Full Scoring Reference)

> **Note on Indicator Count**: This section describes 20 conceptual NTG indicators grouped into 4 categories. The database table `ref_classification_criteria` contains **28 criteria rows** because some indicators have been decomposed into sub-criteria for granular scoring. The conceptual framework below remains valid — the database criteria map to these 20 indicators. Scoring: **0** (not applicable), **1** (partially applicable), **2** (fully applicable). Max total per the 20 indicators: 40.

Each indicator is scored: **0** (not applicable), **1** (partially applicable), **2** (fully applicable). Max total: 40.

**Category A — Product Innovation (5 indicators, max 10 points)**

| # | Indicator | Score 0 | Score 1 | Score 2 |
|---|-----------|---------|---------|---------|
| 1 | **Novel Product Structure** | Same as existing DBS product | Extends existing architecture significantly | Fundamentally new product architecture |
| 2 | **New Asset Class** | Asset class already traded by DBS | Derivative of existing asset class | Entirely new asset class for DBS |
| 3 | **Innovative Technology** | Uses existing DBS technology | Significant extension of existing tech | Requires new technology infrastructure |
| 4 | **New Revenue Model** | Same revenue streams as existing | Modified revenue approach | Entirely new revenue streams |
| 5 | **Unique Market Position** | DBS already plays this role | Enhanced version of existing role | Creates new market-making/intermediation role |

**Category B — Market & Customer (4 indicators, max 8 points)**

| # | Indicator | Score 0 | Score 1 | Score 2 |
|---|-----------|---------|---------|---------|
| 6 | **New Customer Segment** | Same customer base | Adjacent segment | Previously unserved customer category |
| 7 | **New Geographic Market** | Same jurisdictions | Adjacent jurisdiction (similar reg) | New jurisdiction (different reg framework) |
| 8 | **New Distribution Channel** | Same channels | Enhanced version of existing channel | Entirely new distribution mechanism |
| 9 | **New Partnership Model** | Same partnerships | Extended partnership scope | Requires new external partnership structures |

**Category C — Risk & Regulatory (6 indicators, max 12 points)**

| # | Indicator | Score 0 | Score 1 | Score 2 |
|---|-----------|---------|---------|---------|
| 10 | **New Risk Categories** | Same risk types | Enhanced risk management needed | Introduces risk types not previously managed |
| 11 | **New Regulatory Framework** | Same regulations | Extended regulatory scope | Subject to regulations DBS hasn't navigated |
| 12 | **New Capital Treatment** | Same capital methodology | Modified capital approach | Requires new capital allocation methodology |
| 13 | **New Compliance Monitoring** | Same compliance framework | Enhanced monitoring needed | Needs new compliance infrastructure |
| 14 | **New Legal Agreements** | Same legal docs | Modified agreements needed | Requires entirely new agreement types |
| 15 | **New Operational Processes** | Same operational workflows | Enhanced processes needed | Needs new operational infrastructure |

**Category D — Financial & Operational (5 indicators, max 10 points)**

| # | Indicator | Score 0 | Score 1 | Score 2 |
|---|-----------|---------|---------|---------|
| 16 | **New Settlement Mechanism** | Same settlement methods | Modified settlement approach | Uses settlement methods new to DBS |
| 17 | **New Currency Exposure** | Same currencies | Additional minor currency | Involves currencies not previously traded |
| 18 | **New Counterparty Types** | Same counterparty categories | Extended counterparty scope | Engages entirely new counterparty categories |
| 19 | **New Pricing Model** | Same pricing strategies | Modified pricing approach | Implements novel pricing strategies |
| 20 | **New Data Requirements** | Same data management | Enhanced data needs | Needs data approaches not previously deployed |

### 3.3 NTG Classification Decision Logic

```
Step 1: Score all 20 indicators (total 0-40)
Step 2: Check category minimums — EACH category must have total > 0
Step 3: Apply threshold:
  - Total >= 20 AND all categories > 0 --> NEW-TO-GROUP
  - Total >= 20 BUT one category = 0 --> BORDERLINE (manual review, likely Variation)
  - Total 10-19 --> VARIATION (check materiality below)
  - Total < 10 --> EXISTING or MINOR VARIATION

OVERRIDE RULE: A single indicator scored 2 with CRITICAL impact
(e.g., "product is on no existing DBS platform whatsoever") may
trigger NTG classification even if total < 20. This requires
Group Product Head or Group COO confirmation.
```

### 3.4 Material Variation Determination

When classification is VARIATION (total score 10-19), determine materiality:

**8 Material Variation Criteria:**
1. Risk Profile Change — introduces new risk factors or significantly alters existing ones
2. Regulatory Impact — changes regulatory treatment or compliance requirements
3. Capital Impact — materially affects capital allocation or treatment
4. Operational Change — requires significant new operational processes
5. Technology Enhancement — needs major system changes or new technology
6. Legal Documentation — requires new or modified legal agreements
7. Customer Impact — significantly changes customer experience or obligations
8. Revenue Impact — materially changes revenue model or pricing structure

**Decision Logic:**
```
>= 3 criteria met --> MATERIAL VARIATION --> Full NPA (8-12 weeks)
2 criteria met + high impact --> MATERIAL VARIATION --> Full NPA
2 criteria met, low impact --> MINOR VARIATION --> NPA Lite (4-6 weeks)
0-1 criteria met --> MINOR VARIATION --> NPA Lite
```

### 3.5 Existing Product Sub-Classification

When classified as EXISTING, determine the process type:

| Similarity Level | Modifications | Process | Timeline |
|------------------|---------------|---------|----------|
| Identical (100%) | None whatsoever | Evergreen | 1-2 weeks |
| High (90-99%) | Cosmetic only (naming, branding) | Evergreen | 2-3 weeks |
| Substantial (80-89%) | Minor operational adjustments | NPA Lite | 3-4 weeks |
| Moderate (70-79%) | Some functional changes | NPA Lite | 4-6 weeks |
| Low (<70%) | Material changes | Reclassify as Variation | 6+ weeks |

### 3.6 Special Classifications

#### Evergreen Products
Pre-approved standard products with NO deviations from standard parameters:
- Standard deposits (savings, current, term)
- Standard loans (personal, mortgage within criteria)
- Standard FX (spot and forward within standard parameters)
- Standard trade finance (LCs, guarantees within standard terms)
- Standard investment products (mutual funds, structured deposits within parameters)

**Override Trigger**: ANY of these forces exit from Evergreen:
- Parameter deviation from pre-approved range
- New risk factor introduction
- Regulatory treatment change
- System modification required
- New or modified legal agreements needed

#### Bundling Products
Combination of existing approved products as integrated solutions:
- ALL components must be individually approved products
- Combination must NOT introduce new risk interactions
- Revenue allocation methodology must be defined
- Customer experience must be mapped end-to-end

**Bundling Assessment**: Evaluate individual product risk + interaction risk + operational complexity + legal structure separately.

### 3.7 Cross-Border Classification Escalation

Multi-jurisdictional products require special classification treatment:

| Jurisdiction Similarity | Regulatory Alignment | Effect on Classification |
|------------------------|---------------------|-------------------------|
| High | High | Maintain base classification |
| High | Medium | Upgrade one level (e.g., Existing -> Variation) |
| Medium | High | Add cross-border flag, maintain base |
| Medium | Medium | Upgrade one level |
| Low | Any | Upgrade to NTG regardless of base score |

**Cross-border always adds**: Multi-Jurisdiction Compliance Matrix, Legal Entity Structure, Tax Planning Memorandum as required documents.

### 3.8 Classification Edge Cases

#### Edge Case 1: Technology Platform Migration
Existing product moved to a new technology platform:
- Same functionality -> Existing (NPA Lite)
- Enhanced functionality -> Variation (assess materiality)
- New functionality -> New-to-Group

#### Edge Case 2: Regulatory Environment Change
Existing product affected by new regulations:
- Compliance updates only -> Existing (NPA Lite)
- Operational changes required -> Variation (assess materiality)
- Fundamental product changes required -> New-to-Group

#### Edge Case 3: Customer Segment Migration
Existing product offered to a new customer segment:
- Similar risk profile -> Existing (NPA Lite)
- Different risk profile -> Variation (assess materiality)
- Entirely new segment with new risks -> New-to-Group

#### Edge Case 4: Geographic Expansion
Existing product launched in a new geography:
- Same regulatory framework -> Existing (NPA Lite)
- Similar regulatory framework -> Variation (NPA Lite)
- Different regulatory framework -> Variation (Full NPA)
- New market entry (DBS has no presence) -> New-to-Group

### 3.9 Classification Override and Appeals

**Override Triggers:**
- Risk Committee identifies material concerns missed by scoring
- Regulator recommends higher classification
- Senior management strategic decision
- External market events warrant additional scrutiny

**Override Process:**
1. Standard classification performed and documented
2. Override request prepared with justification
3. Review by Group Product Head
4. Final determination by Group COO or CEO
5. Modified review process implemented

**Appeals Process:**
1. Appeal submission with supporting evidence (new information, classification error, changed circumstances, precedent inconsistency)
2. Independent review by classification committee
3. Input from all relevant stakeholders
4. Final decision by Group COO
5. Framework update if precedent-setting

### 3.10 Classification Quality Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Accuracy Rate | > 95% | Classifications unchanged through approval |
| Consistency Rate | > 90% | Similar products classified consistently |
| Classification Time | < 5 business days | Average time to complete |
| Stakeholder Satisfaction | > 4.5/5.0 | Feedback on process quality |

---

## 4. Approval Workflows Deep-Dive

### 4.1 Approval Hierarchy (5 Levels)

```
Level 1: BOARD
  ├── Board Risk Committee (ultimate oversight)
  ├── Board Audit Committee (control framework)
  └── Full Board (strategic decisions)

Level 2: EXECUTIVE
  ├── CEO (final executive authority)
  ├── Group COO (operational oversight — chairs PAC)
  ├── Group CRO (risk oversight)
  └── Group CCO (compliance oversight)

Level 3: COMMITTEE
  ├── PAC - Product Approval Committee (ALL NTG products, no exceptions)
  │   ├── Chaired by: Group COO
  │   ├── Members: Group CRO, Group CCO, Group CFO, relevant BU Head
  │   ├── Meeting: Monthly + special meetings for urgent NPAs
  │   └── Process: 30-45 min presentation → 15-30 min discussion → decision
  ├── Group Executive Committee (major strategic decisions)
  ├── Group Risk Committee (risk approval)
  └── Group Operational Risk Committee (operational approval)

Level 4: FUNCTIONAL
  ├── Group Product Head (product governance)
  ├── Business Unit Head (business approval)
  └── Department Heads (functional approval)

Level 5: SIGN-OFF PARTIES (Technical approval)
  ├── Risk Management Group (Market & Liquidity + Credit Risk)
  ├── Technology & Operations (systems + processes)
  ├── Legal, Compliance & Secretariat (regulatory + legal)
  └── Finance (accounting + tax + capital)
```

### 4.2 Approval Authority by NPA Type

| NPA Type | Primary Approver | Secondary | Final Authority | PAC | CEO | Board |
|----------|-----------------|-----------|----------------|-----|-----|-------|
| NTG (Standard) | PAC | Group COO | Group COO | Required | No | No |
| NTG (High Impact >$100M) | PAC + CEO | Group COO + CEO | CEO | Required | Required | Notification |
| NTG (Strategic >$500M) | Board | CEO | Board | Required | Required | Required |
| Variation (Material) | Group Product Head | Group COO | Group COO | No | No | No |
| Variation (Minor) | Business Head | Group Product Head | Group Product Head | No | No | No |
| Existing | Business Head | Group Product Head | Business Head | No | No | No |
| Bundling | Bundling Team | Group Product Head | Group Product Head | No | No | No |
| Evergreen | System/Business Head | N/A | Business Head | No | No | No |

### 4.3 Sign-Off Party Details

#### Risk Management Group
- **Market & Liquidity Risk Team**: Head + Senior Risk Managers
  - Reviews: Market risk exposure, pricing models, hedging, liquidity impact, VaR, stress testing
  - SLA: 5-7 business days
  - Required for: ALL trading products, market-sensitive products

- **Credit Risk Team**: Head + Portfolio Risk Managers
  - Reviews: Credit risk exposure, counterparty risk, portfolio impact, collateral framework
  - SLA: 5-7 business days
  - Required for: ALL products with credit exposure

#### Technology & Operations
- **Technology Architecture**: Head + Platform leads
  - Reviews: System impact, infrastructure, security assessment, architecture validation
  - SLA: 7-10 business days
  - Required for: ALL products requiring system changes

- **Operations**: Head + Process owners
  - Reviews: Operational feasibility, process impact, resource requirements
  - SLA: 5-7 business days
  - Required for: ALL products with operational impact

#### Legal, Compliance & Secretariat
- **Legal**: General Counsel + specialists
  - Reviews: Legal risk, documentation adequacy, enforceability, external counsel needs
  - SLA: 7-10 business days

- **Compliance**: CCO + specialists
  - Reviews: Regulatory compliance, AML/sanctions, licensing, reporting obligations
  - SLA: 7-10 business days

#### Finance
- **Financial Analysis**: Head of Finance + controllers
  - Reviews: Accounting treatment, tax implications, financial controls, capital impact
  - SLA: 5-7 business days

### 4.4 Detailed Approval Workflows by NPA Type

#### Full NPA (NTG) — 4-Stage Workflow (12-16 weeks)

```
STAGE 1: INITIAL VALIDATION (Weeks 1-2)
  Business Unit Head
    --> Group Product Head
    --> Group COO (approval to proceed)
  GATE: Business case approved, resources identified

STAGE 2: TECHNICAL ASSESSMENT (Weeks 3-6) — PARALLEL REVIEWS
  ┌── Risk Management Group (Market + Credit + Operational)
  ├── Technology & Operations (Systems + Processes)
  ├── Legal, Compliance & Secretariat (Regulatory + Legal)
  └── Finance (Accounting + Tax + Capital)
  GATE: All technical reviews completed, no showstoppers

STAGE 3: PAC APPROVAL (Weeks 7-8)
  PAC Presentation (30-45 min)
    --> Executive Discussion (15-30 min)
    --> Decision: APPROVED / APPROVED WITH CONDITIONS / REJECTED / DEFERRED
  Post-meeting documentation within 24 hours
  GATE: PAC approval obtained (with or without conditions)

STAGE 4: IMPLEMENTATION APPROVAL (Weeks 9-12)
  Implementation Plan finalized
    --> Resource allocation confirmed
    --> Go-live approval obtained
    --> Group COO final sign-off
  GATE: All conditions met, implementation ready
```

**NTG CEO Escalation Triggers:**
- Revenue potential > $100M annually
- Regulatory approval required
- New market entry for DBS
- Strategic partnerships involved

**NTG Board Escalation Triggers:**
- Risk exposure > $500M
- License/charter implications
- Material strategy change
- Regulatory mandate

#### Full NPA (Material Variation) — 3-Stage Workflow (8-12 weeks)

```
STAGE 1: CLASSIFICATION VALIDATION (Week 1)
  Product Manager assessment
    --> Business Head validation
    --> Group Product Head confirmation
  GATE: Material variation confirmed

STAGE 2: TECHNICAL REVIEW (Weeks 2-4) — FOCUSED ON CHANGES
  ┌── Risk Assessment (delta from existing product)
  ├── Operational Impact (change assessment)
  ├── Legal/Compliance (delta review)
  └── Finance (impact analysis)
  GATE: Change impacts assessed

STAGE 3: FINAL APPROVAL (Weeks 5-6)
  Business Head approval
    --> Group Product Head approval
    --> Group COO sign-off
  GATE: All approvals obtained
```

#### NPA Lite (Minor Variation / Existing) — 3-Stage Workflow (4-6 weeks)

```
STAGE 1: SIMPLIFIED ASSESSMENT (Week 1)
  Change impact analysis + Risk delta assessment
  GATE: Low-risk changes confirmed

STAGE 2: STREAMLINED REVIEW (Weeks 2-3)
  ┌── Risk Review (focused, abbreviated)
  ├── Compliance Check (regulatory impact)
  └── Operational Validation (process impact)
  GATE: Reviews completed

STAGE 3: APPROVAL (Week 4)
  Business Head approval
    --> Group Product Head sign-off
  GATE: Approved
```

#### Bundling — Combination-Specific Workflow (5-7 weeks)

```
WEEKS 1-2: Component validation
  Individual product status check + Combination risk assessment + Legal structure review

WEEKS 3-4: Integration review
  Operational integration + Technology integration + Customer experience + Revenue allocation

WEEK 5: Final approval
  Bundling Team approval --> Business Head --> Group Product Head
```

#### Evergreen — Automated Workflow (1-3 weeks)

```
WEEK 1: Parameter validation (AUTOMATED)
  Compliance check + Parameter range validation + Deviation detection

WEEK 2: Authorization
  IF no deviations --> Automated Business Approval + System authorization
  IF deviations detected --> Manual review --> Classification reassessment --> Appropriate NPA process
```

### 4.5 Approval Timeline Quick Reference

| Process Stage | NTG | Material Var | Minor Var | Existing | Bundling | Evergreen |
|---------------|-----|-------------|-----------|----------|----------|-----------|
| Initial Validation | 1-2 wks | 1 wk | 0.5 wk | 0.5 wk | 1 wk | Auto |
| Technical Review | 4-6 wks | 2-3 wks | 1-2 wks | 1 wk | 2-3 wks | Auto |
| Committee Approval | 2-3 wks | N/A | N/A | N/A | 1 wk | N/A |
| Implementation | 4-5 wks | 2-3 wks | 1-2 wks | 1 wk | 2-3 wks | 1 wk |
| **TOTAL** | **12-16 wks** | **6-8 wks** | **3-5 wks** | **3-4 wks** | **6-8 wks** | **1-2 wks** |

### 4.6 Fast-Track and Emergency Procedures

**Fast-Track Eligibility:** Business urgency, regulatory deadline, customer commitment, CEO/Board strategic priority.

**Fast-Track Modifications:** All technical reviews run simultaneously, daily check-ins, executive escalation access, dedicated review resources.

| NPA Type | Standard | Fast-Track | Emergency |
|----------|----------|-----------|-----------|
| NTG | 12-16 wks | 8-10 wks | 4-6 wks |
| Material Var | 8-12 wks | 6-8 wks | 3-4 wks |
| NPA Lite | 4-6 wks | 3-4 wks | 1-2 wks |
| Bundling | 5-7 wks | 4-5 wks | 2-3 wks |
| Evergreen | 1-3 wks | 1-2 wks | 1 wk |

**Emergency Approval**: CEO/Group COO expedited decision. Full documentation completed post-launch. Enhanced monitoring during emergency implementation.

### 4.7 Conditional Approvals

Approvals may come with conditions:
- **Implementation Conditions**: Specific requirements before go-live (e.g., "complete penetration testing before launch")
- **Ongoing Conditions**: Requirements during operation (e.g., "quarterly risk reviews for first year")
- **Performance Conditions**: Achievement of specific metrics (e.g., "maintain loss rate below 0.5%")
- **Review Conditions**: Mandatory review points (e.g., "6-month PIR for NTG products")

Each condition has an **owner**, **monitoring frequency**, **reporting requirements**, and **escalation triggers** for violations.

### 4.8 Approval Revocation

**Triggers:** Material deviation from approved parameters, new regulatory requirements, unexpected risk events, performance failure.

**Process:** Trigger identification -> Assessment committee (original approvers) -> Revocation decision (Group COO/PAC) -> Wind-down plan -> Stakeholder notification.

---

## 5. Risk Assessment Deep-Dive

### 5.1 4-Layer Risk Cascade

The Risk Agent (`WF_NPA_Risk`) executes a sequential 4-layer cascade. Each layer evaluates independently. A FAIL at ANY layer can trigger a **hard stop**.

```
Layer 1: INTERNAL POLICY
  ├── DBS prohibited products list check
  ├── Internal policy violation screening
  ├── Product category restrictions
  └── HARD STOP if: Product on prohibited list

Layer 2: REGULATORY
  ├── Licensing requirements assessment
  ├── Jurisdictional compliance verification
  ├── Regulatory notification requirements
  └── HARD STOP if: Missing required license, regulatory prohibition

Layer 3: SANCTIONS
  ├── OFAC sanctions list screening
  ├── EU sanctions list screening
  ├── UN sanctions list screening
  ├── Sanctioned country check (DPRK, Iran, Russia, Syria, Cuba)
  └── HARD STOP if: Sanctioned entity/country match

Layer 4: DYNAMIC
  ├── Real-time market conditions assessment
  ├── Emerging risk identification
  ├── Dynamic policy change evaluation
  ├── Risk appetite alignment check
  └── HARD STOP if: Risk exceeds maximum appetite with no viable mitigation
```

**Each layer returns:** `PASS` | `FAIL` | `WARNING`
**Overall assessment:** Composite score (0-100), hardStop boolean, prerequisite validation results.

### 5.2 Prohibited Products (Known Hard Stop Categories)

These product types ALWAYS trigger mandatory risk assessment and may result in hard stop:
- **Cryptocurrency / digital asset / Bitcoin / Ethereum trading** — unless specifically approved by PAC
- **Products involving sanctioned jurisdictions** — DPRK, Iran, Russia, Syria, Cuba
- **Products involving sanctioned entities or persons** — OFAC, EU, UN lists
- **Products explicitly on the DBS internal prohibited list** — maintained in `ref_prohibited_items` table
- **Products requiring regulatory licenses DBS does not hold** — and cannot reasonably obtain
- **Products with uninsurable operational risks** — no viable risk mitigation
- **Products that could impact DBS banking license** — charter implications

**Detection Keywords for Orchestrator:** When user mentions any of the above in ideation or creation, the orchestrator should warn: "This product type may trigger a prohibited item check. Let me route this through risk assessment to verify."

### 5.3 Prerequisite Validation (9-Category Scorecard)

Before an NPA can proceed through the full lifecycle, readiness is assessed across 9 categories. This validation runs as part of the risk assessment.

| # | Category | Weight | Key Validation Checks |
|---|----------|--------|----------------------|
| 1 | **Strategic Alignment** | 15% | Business case approved by senior management? Financial projections validated by Finance? Market research complete? Strategic alignment confirmed by Group Product Head? Resource and budget allocation approved? |
| 2 | **Classification & Process** | 10% | All 20 NTG criteria assessed? Classification documented with rationale? Senior stakeholder agreement? Process type determined (Full/Lite/Bundling/Evergreen)? Expected timeline communicated? |
| 3 | **Stakeholder Readiness** | 20% | All core sign-off parties engaged and briefed? Resource availability confirmed across all teams? Parallel workstream coordination established? Escalation procedures defined? Review timeline agreed? Backup reviewers identified? |
| 4 | **Technical Infrastructure** | 15% | System requirements documented? Technical feasibility confirmed? Resource requirements estimated? Implementation timeline realistic? Security assessment initiated? Integration planning commenced? |
| 5 | **Regulatory & Compliance** | 15% | Regulatory mapping completed? All required licenses identified? Local compliance teams consulted? Regulatory timeline integrated with NPA schedule? Cross-border restrictions understood? |
| 6 | **Risk Management** | 10% | All risk categories assessed (Market, Credit, Operational, Liquidity)? Risk metrics and measurement methodology identified? Stress testing scenarios planned? Risk limit framework designed? Risk mitigation strategies identified? |
| 7 | **Data Management** | 5% | Data types and sources identified? Sensitivity classification completed? GDPR/Privacy compliance assessed? Cross-border data flow restrictions identified? Data quality requirements established? |
| 8 | **Financial Framework** | 5% | Accounting treatment determined? Capital requirements estimated? Tax implications assessed? Financial controls framework designed? Management reporting requirements defined? |
| 9 | **Project Management** | 5% | Project governance established? Team roles and responsibilities defined? Realistic timeline? Critical path analysis completed? Resource allocation confirmed? |

**Scoring Thresholds:**
- **>= 85: READY** (green) — All critical pre-requisites met. NPA can proceed.
- **70-84: CONDITIONAL** (yellow) — Minor gaps requiring resolution within defined timeline. NPA can proceed with remediation plan.
- **< 70: NOT READY** (red) — Significant gaps. NPA initiation suspended.

**Failure Protocol for Score < 70:**
1. Gap analysis with detailed assessment of shortfalls
2. Time-bound remediation plan
3. Stakeholder communication of delay
4. Group Product Head notification within 24 hours
5. Group COO briefing within 48 hours
6. Re-assessment after remediation

### 5.4 Hard Stop Response Protocol

When `WF_NPA_Risk` returns `hardStop: true`:
1. Orchestrator returns `HARD_STOP` agent_action with prohibition reason
2. Angular renders red hard-stop card showing: reason, prohibited item, which risk layer triggered it
3. NPA status updated to BLOCKED in database
4. Audit trail records the hard stop decision via `audit_log_action`
5. NPA cannot proceed to AUTOFILL or SIGN_OFF stages
6. Automatic escalation to Group COO triggered
7. User informed of appeal process: "This product has been blocked. The NPA team can appeal this decision through the Group COO. Contact the NPA Program Office."

---

## 6. Document Requirements Deep-Dive

### 6.1 Document Classification System

| Category | Icon | Rule |
|----------|------|------|
| **Core Documents** | Green | Required for ALL NPAs — no exceptions |
| **Conditional Documents** | Yellow | Required based on classification, product type, or jurisdictions |
| **Supplementary Documents** | Orange | Enhance submission quality but not blocking |
| **Critical Path Documents** | Red | Block approval if missing — hard dependency |

### 6.2 Core Documents (Required for ALL NPAs)

| Document | Source | Auto-Fill % | Critical Path |
|----------|--------|-----------|--------------|
| NPA Submission Form (47-field template) | Business | 62% | Yes |
| Product Specification Document | Business | 35% | Yes |
| Business Case | Business | 20% | Yes |
| Risk Assessment Matrix | Business/Risk | 55% | Yes |
| Operating Model Diagram | Business/Ops | 40% | No |
| Regulatory Compliance Checklist | Compliance | 60% | Yes |
| Legal Documentation Summary | Legal | 45% | Yes |
| Data Privacy Assessment (DPIA) | Compliance | 50% | No |
| Financial Crime Risk Assessment | Compliance | 65% | No |
| System Impact Assessment | Technology | 70% | Yes |
| Information Security Assessment | Tech/Security | 55% | No |
| Business Continuity Plan | Operations | 80% | No |
| Operational Readiness Checklist | Operations | 75% | No |

### 6.3 Conditional Documents by Classification

#### NTG-Specific (in addition to Core):
| Document | Source | Critical Path | Auto-Fill |
|----------|--------|--------------|-----------|
| PAC Presentation Deck | Business | Yes — blocks PAC approval | 0% |
| Post-Implementation Review Plan | Business | Yes | 30% |
| Model Validation Report | Risk/Modeling | Yes — blocks risk approval | 0% |
| Stress Testing Scenarios | Risk | Yes | 0% |
| Capital Impact Assessment | Finance/Risk | Yes | 0% |
| External Legal Opinion | External Legal | Yes — blocks legal approval | 0% |
| Market Research Report | Business | No | 0% |
| Competitive Analysis | Business | No | 0% |

#### Variation-Specific:
| Document | When Required | Critical Path |
|----------|-------------|--------------|
| Change Impact Assessment | All variations | Yes |
| Original NPA Reference | All variations | Yes |
| Delta Analysis Report | Material changes only | Yes |
| Risk Delta Assessment | Risk profile changes | Yes |
| Updated Model Validation | Model parameter changes | Yes |
| Regulatory Notification | Regulatory impact | Yes |

#### Cross-Border Additional:
| Document | Auto-Fill | Critical Path |
|----------|-----------|--------------|
| Multi-Jurisdiction Compliance Matrix | 40% | Yes |
| Legal Entity Structure | 60% | Yes |
| Tax Planning Memorandum | 25% | Yes |
| Transfer Pricing Documentation | 30% | Yes |
| Local Regulatory Approvals (per jurisdiction) | 20% | Yes |

### 6.4 Product-Type-Specific Documents

#### Trading Products:
- Market Risk Model Validation (80% auto-fill, critical path)
- Trading Book Capital Assessment (75%, critical path)
- Liquidity Risk Analysis (70%)
- Counterparty Credit Framework (85%)
- Clearing and Settlement Plan (75%)
- Regulatory Reporting Matrix (80%)

#### Banking Products:
- Credit Risk Assessment (70%)
- IRRBB Analysis (75%)
- Provisioning Methodology (65%)
- Customer Suitability Framework (40%)

#### Investment Products:
- Product Risk Rating (50%, critical path)
- Investor Suitability Matrix (45%)
- Fee and Expense Disclosure (60%, critical path)
- Liquidity Terms Summary (55%)

#### Digital Products:
- Digital Architecture Design (45%)
- API Documentation (70%)
- Cybersecurity Assessment (75%, critical path)

### 6.5 Document Count Summary

| NPA Type | Core | Conditional | Total | Prep Time | Critical Path Docs |
|----------|------|-------------|-------|-----------|-------------------|
| Full NPA (NTG) | 25 | 15-20 | 40-45 | 8-12 weeks | 12-15 |
| Full NPA (Variation) | 22 | 10-15 | 32-37 | 6-8 weeks | 8-10 |
| NPA Lite | 18 | 5-10 | 23-28 | 4-6 weeks | 5-7 |
| Bundling | 20 | 8-12 | 28-32 | 5-7 weeks | 6-8 |
| Evergreen | 12 | 3-5 | 15-17 | 2-3 weeks | 3-4 |

### 6.6 Document Quality Gates

| Gate | Timing | What's Checked |
|------|--------|---------------|
| Initial Completeness | Week 2 | All templates populated, format correct |
| Content Validation | Week 4 | Business accuracy confirmed by BU |
| Risk Validation | Week 6 | Risk assessment adequate per CRO |
| Compliance Validation | Week 8 | Regulatory alignment per CCO |
| Final Validation | Week 10 | Senior management review, Group COO sign-off |

### 6.7 Document Dependency Chain

```
Business Case --> Risk Assessment --> Technical Specifications
Legal Documentation --> Compliance Assessment --> Regulatory Submissions
External Opinions --> Internal Risk Validation --> Final Approval
System Documentation --> Operational Procedures --> Implementation Planning
```

**Bottleneck Management:**
- External documents: Start procurement Week 1 (longest lead time)
- Regulatory approvals: Initiate pre-consultation early
- Legal opinions: Engage external counsel at project start
- Model validation: Begin parallel to NPA preparation

---

## 7. NPA Template Deep-Dive (47 Fields, 9 Parts)

### 7.1 Template Structure

| Part | Section | Field Count | Auto-Fill % | Key Fields |
|------|---------|------------|------------|-----------|
| **A** | Basic Product Information | 16 | 85% | Product name, NPA ID, category, proposing unit, locations, legal entities, process type, classification, go-live date, cross-border indicator |
| **B** | Sign-Off Parties Matrix | 5 | 95% | Core sign-off groups, special approvers (PAC, CEO), designation authority |
| **C** | Product Specifications | 8 | 35% | Purpose/rationale, scope/parameters, business model, target customers, distribution channels |
| **D** | Operational & Technology | 6 | 60% | Operating model, booking/settlement, system infrastructure, information security, business continuity |
| **E** | Risk Analysis | 5 | 55% | Operational risk, market & liquidity risk, credit risk, reputational risk, financial crime |
| **F** | Data Management | 4 | 40% | Design for Data (D4D), risk data aggregation, privacy compliance |
| **G** | Appendices | 4 | 75% | Entity/location matrix, financial crime detail, trading product specifics |
| **H** | Validation and Sign-Off | 2 | 95% | Completeness checklist, approval workflow routing |
| **I** | Template Usage Guidelines | 1 | N/A | Instructions (reference only) |
| | **TOTAL** | **47** | **62%** | |

### 7.2 Auto-Fill Lineage Types

| Lineage | Meaning | Source | Human Review | Confidence |
|---------|---------|--------|-------------|------------|
| **AUTO** | Value sourced directly from database, classification, or risk assessment | System data | Not required | High (90%+) |
| **ADAPTED** | AI-suggested value based on similar NPAs, KB content, or inference | ML/RAG | Required — human should confirm or edit | Medium (60-85%) |
| **MANUAL** | Cannot be auto-filled; requires human judgement or business-specific knowledge | Human input | Required — must be entered by user | N/A |

### 7.3 Auto-Fill Sources by Part

| Part | AUTO Sources | ADAPTED Sources | MANUAL Requirement |
|------|-------------|----------------|-------------------|
| A | User profile, org chart, AI classification, system-generated ID, calendar | Product category suggestion from similar NPAs | Strategic decisions (go-live date, business case approval) |
| B | Approval track rules, signoff routing rules database | N/A | N/A (fully deterministic) |
| C | N/A (highly business-specific) | Similar NPA descriptions, KB content for scope parameters | Purpose, rationale, business model, customer profile |
| D | System catalog (booking schema, settlement), Murex templates | Operating model from similar products | Process customization, integration specifics |
| E | Risk factor mappings, market risk model outputs, credit assessment tools | Risk mitigation strategies from similar NPAs | Risk judgement calls, stress scenarios |
| F | Data classification from existing products | Privacy requirements from similar products | Data governance decisions |
| G | Entity/location database, existing documentation references | N/A | Financial crime specifics, trading details |
| H | Automated workflow routing, completeness scoring | N/A | N/A (system-generated) |

---

## 8. Specialist Agent Details (Phase 0 — 7 Dify Apps)

### 8.1 Tool Assignment Summary (71 tools across 7 apps)

| Dify App | Type | Logical Agents | Tools | Build Step |
|----------|------|---------------|-------|-----------|
| CF_NPA_Orchestrator | Chatflow | MASTER_COO + NPA_ORCHESTRATOR | 8 (read + route) | Step 1 |
| CF_NPA_Ideation | Chatflow | IDEATION | 9 (read + write) | Step 2 |
| CF_NPA_Query_Assistant | Chatflow | DILIGENCE + KB_SEARCH + NOTIFICATION(read) | 17 (read only) | Step 3 |
| WF_NPA_Classify_Predict | Workflow | CLASSIFIER + ML_PREDICT | 8 | Step 4 |
| WF_NPA_Risk | Workflow | RISK | 10 | Step 5 |
| WF_NPA_Autofill | Workflow | AUTOFILL | 7 | Step 5 |
| WF_NPA_Governance_Ops | Workflow | GOVERNANCE + DOC_LIFECYCLE + MONITORING + NOTIFICATION(write) | 18 | Step 5 |

### 8.2 CF_NPA_Ideation (Chatflow — Step 2)

**Role**: Conversational product concept development. The user refines their product idea through Q&A before the NPA project record is created.

**Critical Behaviour Rules:**
- MUST ask at least ONE clarifying question before creating NPA (Gate 2 requirement)
- MUST check prohibited list BEFORE creating NPA
- If prohibited match found: warn user, log the match, but do NOT block creation (full risk assessment happens later at RISK_ASSESSMENT stage)
- Returns project_id to orchestrator upon NPA creation
- Orchestrator persists `ideation_conversation_id` so follow-up messages continue same Dify conversation

**Tools (9):** `ideation_create_npa`, `ideation_find_similar`, `ideation_get_prohibited_list`, `ideation_save_concept`, `ideation_list_templates`, `get_prospects`, `convert_prospect_to_npa`, `audit_log_action`, `session_log_message`

**KB Attached:** KB_NPA_CORE_CLOUD, KB_NPA_AGENT_KBS_CLOUD (Ideation only)

**Delegation from Orchestrator:**
```
POST https://api.dify.ai/v1/chat-messages
Authorization: Bearer <CF_NPA_Ideation API key>
Body: { "inputs": {}, "query": "<user_message>", "conversation_id": "<ideation_conversation_id>", "response_mode": "blocking", "user": "<user_id>" }
```

### 8.3 CF_NPA_Query_Assistant (Chatflow — Step 3)

**Role**: Read-only Q&A across all NPA data and KB. Expected to handle 70-80% of daily usage.

**Critical Behaviour Rules:**
- ZERO write tools. Strictly read-only.
- Must cite sources when referencing KB documents
- Can chain multiple tool calls for cross-domain queries
- Must handle "I don't know" gracefully when data is missing

**Tools (17 read-only):** `list_npas`, `get_npa_by_id`, `get_workflow_state`, `governance_get_signoffs`, `check_sla_status`, `governance_check_loopbacks`, `audit_get_trail`, `check_audit_completeness`, `get_dashboard_kpis`, `check_document_completeness`, `get_document_requirements`, `check_breach_thresholds`, `get_post_launch_conditions`, `get_performance_metrics`, `search_kb_documents`, `get_kb_document_by_id`, `get_pending_notifications`

**KB Attached:** KB_NPA_CORE_CLOUD + KB_NPA_AGENT_KBS_CLOUD (ALL agent KBs — needs full context to answer any question)

**Cross-Domain Query Capability:**

| User Question | Tools Used | agent_action |
|---------------|-----------|-------------|
| "Status of NPA-2026-003?" | `get_npa_by_id` + `get_workflow_state` | SHOW_KB_RESULTS |
| "Who hasn't signed off on NPA-2026-001?" | `governance_get_signoffs` | SHOW_GOVERNANCE |
| "Any SLA breaches across portfolio?" | `list_npas` + `check_sla_status` (per project) | SHOW_GOVERNANCE |
| "Missing documents for NPA-2026-003?" | `check_document_completeness` | SHOW_DOC_STATUS |
| "Show audit trail for NPA-2026-001" | `audit_get_trail` | SHOW_KB_RESULTS |
| "Portfolio overview" | `get_dashboard_kpis` | SHOW_KB_RESULTS |
| "Policy on crypto-linked products?" | `search_kb_documents` | SHOW_KB_RESULTS |
| "Post-launch issues for NPA-2026-002?" | `check_breach_thresholds` + `get_post_launch_conditions` | SHOW_MONITORING |
| "Compare NPA-2026-001 and NPA-2026-003" | Two `get_npa_by_id` calls + synthesis | SHOW_KB_RESULTS |
| "Which NPAs are blocked?" | `list_npas` (filter: status=BLOCKED) | SHOW_KB_RESULTS |
| "What documents needed for NTG?" | `get_document_requirements` + KB search | SHOW_KB_RESULTS |

### 8.4 WF_NPA_Classify_Predict (Workflow — Step 4)

**Role**: Deterministic classification + ML prediction. project_id in -> ClassificationResult + MLPrediction out.

**Tools (8):** `classify_assess_domains`, `classify_score_npa`, `classify_determine_track`, `classify_get_criteria`, `classify_get_assessment`, `update_npa_predictions`, `get_npa_by_id`, `audit_log_action`

**KB Attached:** None (uses tools for structured criteria; no free-text KB needed)

**Workflow Input:** `{ "inputs": { "project_id": "NPA-2026-003", "user_role": "MAKER" }, "response_mode": "blocking", "user": "<user_id>" }`

**Workflow Outputs:** `agent_action` = "SHOW_CLASSIFICATION", `agent_id` = "CLASSIFIER", `payload` = { projectId, data: ClassificationResult }, `trace` = { project_id, workflow_run_id }

### 8.5 WF_NPA_Risk (Workflow — Step 5)

**Role**: 4-layer risk cascade + prerequisite validation. Can trigger hard stops.

**Tools (10):** `risk_run_assessment`, `risk_get_market_factors`, `risk_add_market_factor`, `risk_get_external_parties`, `get_prerequisite_categories`, `validate_prerequisites`, `save_risk_check_result`, `get_form_field_value`, `get_npa_by_id`, `audit_log_action`

**KB Attached:** None

### 8.6 WF_NPA_Autofill (Workflow — Step 5)

**Role**: Auto-populate 47-field template with lineage tracking.

**Tools (7):** `autofill_get_template_fields`, `autofill_populate_field`, `autofill_populate_batch`, `autofill_get_form_data`, `autofill_get_field_options`, `get_npa_by_id`, `audit_log_action`

**KB Attached:** None

### 8.7 WF_NPA_Governance_Ops (Workflow — Step 5)

**Role**: Sign-offs, documents, stage advance, notifications, post-launch monitoring. Largest tool set (18 tools).

**Tools (18):** `governance_get_signoffs`, `governance_create_signoff_matrix`, `governance_record_decision`, `governance_check_loopbacks`, `governance_advance_stage`, `get_signoff_routing_rules`, `check_sla_status`, `create_escalation`, `save_approval_decision`, `add_comment`, `check_document_completeness`, `get_document_requirements`, `upload_document_metadata`, `validate_document`, `get_monitoring_thresholds`, `create_breach_alert`, `send_notification`, `audit_log_action`

**KB Attached:** None

**Circuit Breaker:** Loop-back count >= 3 triggers automatic escalation to Group COO.

**SLA Monitoring States:**
- `on_track`: All sign-offs within SLA
- `at_risk`: At least one approaching deadline (within 2 business days)
- `breached`: At least one past SLA deadline

---

## 9. Escalation Framework

### 9.1 5-Level Escalation Ladder

```
Level 1: Department Head Resolution (2 business days)
  ├── Issue identification and initial resolution attempt
  └── Stakeholder notification

Level 2: Business Unit Head Escalation (3 business days)
  ├── Cross-functional issue resolution
  └── Resource reallocation if needed

Level 3: Group Product Head Intervention (2 business days)
  ├── Strategic decision and direction
  └── Executive stakeholder engagement

Level 4: Group COO Decision (1 business day)
  ├── Final operational decision
  └── CEO notification if needed

Level 5: CEO Resolution (Same day)
  ├── Executive decision
  └── Board notification if material
```

### 9.2 Escalation Triggers

| Trigger | Level | Timeline |
|---------|-------|----------|
| Approval delay (behind schedule) | Level 1 → Level 2 | Auto after 2 days past SLA |
| Disagreement between sign-off parties | Level 2 → Level 3 | Manual escalation |
| Resource constraints blocking review | Level 2 | Manual escalation |
| Regulatory concern raised | Level 3 → Level 4 | Immediate |
| Hard stop appeal | Level 4 | Immediate |
| Circuit breaker triggered (3 reworks) | Level 4 | Automatic |
| Material risk exposure (>$500M) | Level 5 | Immediate |

### 9.3 Exception Management

| Exception Type | Approval Required |
|---------------|------------------|
| Process exception (deviation from standard) | Business Head |
| Timeline exception (modified approval timeline) | Group Product Head |
| Authority exception (alternative approver) | Group COO |
| Documentation exception (alternative docs) | Group COO |
| Strategic exception (policy override) | CEO |

---

## 10. Coordination Patterns Between Specialists

### 10.1 Standard Sequential Flow

```
Orchestrator -> CF_NPA_Ideation (multi-turn Q&A -> project created)
  [Human confirms]
Orchestrator -> WF_NPA_Classify_Predict (project_id -> classification + prediction)
  [Human reviews]
Orchestrator -> WF_NPA_Risk (project_id -> 4-layer risk assessment)
  [Human reviews; hard stop check]
Orchestrator -> WF_NPA_Autofill (project_id -> template populated)
  [Human reviews and edits]
Orchestrator -> WF_NPA_Governance_Ops (project_id -> sign-off routing)
  [Sign-off parties review independently]
Orchestrator -> WF_NPA_Governance_Ops (project_id -> post-launch monitoring)
  [Ongoing]
```

**Key Rule:** ONE action per turn, ONE human checkpoint between actions.

### 10.2 Re-Entry Patterns

| Scenario | Action |
|----------|--------|
| Re-classify after new information | Call WF_NPA_Classify_Predict again (overwrites previous) |
| Re-run risk after classification change | Call WF_NPA_Risk again |
| Sign-off party requests rework (loop-back) | Route back to appropriate stage |
| Update template after feedback | Call WF_NPA_Autofill with partial update |
| Re-check documents after upload | Call WF_NPA_Governance_Ops |

### 10.3 Error Recovery

1. Workflow HTTP error -> Orchestrator returns SHOW_ERROR with `retry_allowed: true`
2. User decides to retry -> Orchestrator calls same workflow with same inputs
3. After 2 failed retries -> Orchestrator suggests escalation or alternative approach
4. Tool-level failure -> Orchestrator logs via `session_log_message`, returns SHOW_ERROR

### 10.4 Context Switching During Workflow

- Current workflow state is persisted in database (not lost on switch)
- Orchestrator updates conversation variables to new project
- User can return to previous project at any time
- Each project maintains independent state across all stages

---

## 11. Post-Launch Monitoring

### 11.1 PIR (Post-Implementation Review)

**Required for:** ALL NTG products (mandatory)
**Timeline:** Within 6-12 months of product launch
**Scope:** Assess whether the product meets its approved objectives, risk profile, and operational targets

### 11.2 Monitoring Thresholds

| Metric | Description | Alert Level |
|--------|-------------|-------------|
| Transaction Volume | Daily/monthly volume vs. projected | WARNING at 80% deviation |
| Revenue Performance | Actual vs. projected revenue | WARNING at 70% of target |
| Loss Rate | Actual losses vs. risk appetite | CRITICAL at 150% of limit |
| Counterparty Concentration | Single counterparty % of total | WARNING at 25%, CRITICAL at 35% |
| SLA Compliance | Post-launch service levels | WARNING at 90%, CRITICAL at 80% |
| Customer Complaints | Volume and severity | WARNING at 2x baseline |
| Regulatory Issues | Regulatory findings or queries | CRITICAL (any finding) |

### 11.3 Breach Response

When monitoring detects a threshold breach:
1. `create_breach_alert` generates alert record
2. `send_notification` dispatches to relevant stakeholders
3. Severity determines escalation: WARNING -> Department Head, CRITICAL -> Group COO
4. Breach trend tracked: worsening / stable / improving
5. If CRITICAL and worsening -> automatic escalation to CEO consideration

### 11.4 Post-Launch Conditions

Some NPAs are approved with post-launch conditions (see Section 4.7). These are tracked via `get_post_launch_conditions` and include:
- Deadlines for condition completion
- Days remaining calculations
- Status tracking (met / in progress / overdue)
- Escalation on overdue conditions

---

## 12. Database Schema — Key Tables

42 Railway MySQL tables support the NPA lifecycle. Grouped by domain.

> **Canonical Status Values** (use these exact values in all tool outputs and agent responses):
> - **`npa_projects.status`**: `ACTIVE` (default), `On Track`, `At Risk`, `Delayed`, `Blocked`, `Completed`
> - **`npa_projects.risk_level`**: `LOW`, `MEDIUM`, `HIGH`
> - **`npa_projects.approval_track`**: `FULL_NPA`, `NPA_LITE`, `BUNDLING`, `EVERGREEN`, `PROHIBITED`
> - **`npa_signoffs.status`**: `PENDING`, `APPROVED`, `REJECTED`, `REWORK`
> - **`npa_form_data.lineage`**: `AUTO`, `ADAPTED`, `MANUAL`
> - **`npa_prerequisite_results.status`**: `PENDING`, `PASS`, `FAIL`, `WAIVED`, `N/A`
> - **`npa_breach_alerts.severity`**: `CRITICAL`, `WARNING`, `INFO`
> - **`npa_breach_alerts.status`**: `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `ESCALATED`

### 12.1 Core NPA Tables
| Table | Used By | Purpose |
|-------|---------|---------|
| `npa_projects` | All agents | Master project record (id, title, npa_type, risk_level, current_stage, status, approval_track) |
| `npa_workflow_states` | Governance, orchestrator | Stage progression tracking (stage_id, status, started_at, completed_at) |
| `npa_form_data` | Autofill | Template field values with lineage (`field_key`, `field_value`, `lineage`, `confidence_score`, `metadata`) |
| `npa_classification_assessments` | Classification | Per-criteria scores with evidence (project_id, criteria_id, score 0/1/2, evidence, confidence) |
| `npa_classification_scorecards` | Classification | Aggregate scores and tier determination (total_score, calculated_tier, breakdown JSON) |
| `npa_risk_checks` | Risk | 4-layer results per check_layer (result: PASS/FAIL/WARNING, matched_items JSON) |
| `npa_intake_assessments` | Risk | Domain-level readiness (domain, status: PASS/FAIL/WARN, score, findings JSON) |
| `npa_signoffs` | Governance | Sign-off decisions per party (`party`, `department`, `status`, `approver_user_id`, `sla_deadline`, `decision_date`) |

### 12.2 Reference Tables
| Table | Used By | Purpose |
|-------|---------|---------|
| `ref_npa_templates` | Ideation, Autofill | Template definitions (id, name, version, is_active) |
| `ref_npa_sections` | Autofill | Template sections (template_id, title, description, order_index) |
| `ref_npa_fields` | Autofill | 47 field definitions (section_id, field_key, label, field_type, is_required) |
| `ref_field_options` | Autofill | Dropdown options for select fields (field_id, value, label) |
| `ref_classification_criteria` | Classification | 28 classification criteria with scoring rubrics (category, criterion_code, indicator_type, weight) |
| `ref_signoff_routing_rules` | Governance | Sign-off party routing by approval_track (party_group, sla_hours, can_parallel) |
| `ref_prohibited_items` | Risk, Ideation | Prohibited product list (layer, severity, jurisdictions, effective dates) |
| `ref_prerequisite_categories` | Risk | 9-category readiness framework with weights |
| `ref_prerequisite_checks` | Risk | Individual prerequisite checks per category (mandatory_for, is_critical) |
| `ref_document_requirements` | Document lifecycle | Document requirement definitions (doc_code, criticality, required_for, required_by_stage) |
| `ref_document_rules` | Document lifecycle | Conditional document rules (condition_logic, criticality) |
| `ref_escalation_rules` | Governance | Escalation ladder (escalation_level, trigger_type, trigger_threshold, auto_escalate) |

### 12.3 Audit & Session Tables
| Table | Used By | Purpose |
|-------|---------|---------|
| `agent_sessions` | Orchestrator `session_create` | Tracing sessions (agent_identity, current_stage, handoff_from) |
| `agent_messages` | Orchestrator `session_log_message` | Agent reasoning logs (role, content, agent_confidence, reasoning_chain) |
| `npa_agent_routing_decisions` | Orchestrator `log_routing_decision` | Routing audit trail (source_agent, target_agent, routing_reason, confidence) |
| `npa_audit_log` | All `audit_log_action` | All write actions (action_type, actor_name, is_agent_action, agent_name, reasoning, source_citations) |

### 12.4 Supporting Tables
| Table | Used By | Purpose |
|-------|---------|---------|
| `users` | `get_user_profile` | User identity, role (MAKER/CHECKER/APPROVER/COO/ADMIN), department, location |
| `npa_documents` | Document lifecycle tools | Document metadata, validation_status, version, criticality, required_by_stage |
| `npa_comments` | Governance `add_comment` | Approval comments per sign-off (comment_type, generated_by_ai, ai_confidence) |
| `npa_escalations` | Governance `create_escalation` | Escalation records (escalation_level, trigger_type, status: ACTIVE/RESOLVED/OVERRIDDEN) |
| `npa_approvals` | Governance | Higher-level approvals: CHECKER, GFM_COO, PAC (decision: APPROVE/REJECT/CONDITIONAL_APPROVE) |
| `npa_breach_alerts` | Monitoring | Breach alert records (title, severity, threshold_value, actual_value, sla_hours, status) |
| `npa_prospects` | Ideation `get_prospects` | Prospect pipeline for conversion to NPA (name, theme, probability, estimated_value) |
| `npa_loop_backs` | Governance | Rework tracking (loop_back_type, initiated_by_party, routed_to, resolution_type) |
| `npa_post_launch_conditions` | Monitoring | Post-approval conditions (condition_text, owner_party, due_date, status) |
| `npa_prerequisite_results` | Risk | Per-check results (check_id, status: PENDING/PASS/FAIL/WAIVED/N/A, evidence) |

### 12.5 Monitoring & Analytics Tables
| Table | Used By | Purpose |
|-------|---------|---------|
| `npa_monitoring_thresholds` | Monitoring | Per-project metric thresholds (metric_name, warning_value, critical_value) |
| `npa_performance_metrics` | Monitoring | Performance snapshots (total_volume, realized_pnl, var_utilization, health_status) |
| `npa_kpi_snapshots` | Dashboard | Portfolio KPI snapshots (pipeline_value, active_npas, avg_cycle_days, approval_rate) |
| `npa_market_clusters` | Dashboard | Market cluster analytics (cluster_name, npa_count, growth_percent) |
| `npa_market_risk_factors` | Risk | Market risk factor tracking (risk_factor, is_applicable, sensitivity_report, var_capture) |
| `npa_external_parties` | Risk | External party tracking (party_name, vendor_tier, grc_id) |
| `npa_jurisdictions` | All agents | Multi-jurisdiction tracking (project_id, jurisdiction_code) |
| `kb_documents` | KB Search | KB document registry (doc_id, filename, doc_type, embedding_id, last_synced) |

---

## 13. Angular Frontend — Card Rendering Reference

> **Implementation Status**: Actions marked with checkmark are wired in the Command Center (`command-center.component.ts`). Actions marked with a dash have Angular components built but are only rendered in the NPA Workspace page — they are NOT yet handled in the Command Center's action switch/case.

| agent_action | Card Type | Visual Style | Key Data Points | Command Center |
|-------------|-----------|-------------|-----------------|:-:|
| `ROUTE_DOMAIN` | Domain routing | Violet border, agent icon | domainId, name, icon, color, greeting | Wired |
| `ASK_CLARIFICATION` | Chat + buttons | Standard chat, clickable options | Question, 2-4 options, context | — |
| `SHOW_CLASSIFICATION` | Classification scorecard | Purple, expandable criteria | Type, track, scores, confidence %, sign-offs | Wired |
| `SHOW_RISK` | Risk assessment panel | Red/amber/green by layer | 4 layers PASS/FAIL/WARNING, prerequisites, hard stop | — |
| `SHOW_PREDICTION` | Prediction metrics | Amber, 3-column | Approval %, timeline days, bottleneck dept, features | Wired |
| `SHOW_AUTOFILL` | Autofill summary | Blue, field counts | Coverage %, fields by lineage, time saved | — |
| `SHOW_GOVERNANCE` | Governance status | Slate, signoff matrix | Party status (PENDING/APPROVED/REJECTED/REWORK), SLA, loop-back count | — |
| `SHOW_DOC_STATUS` | Doc completeness | Teal, missing/expiring lists | Completeness %, blocking docs, stage gate | — |
| `SHOW_MONITORING` | Monitoring alerts | Emerald/red by severity | Health, breaches, trends, PIR status | — |
| `SHOW_KB_RESULTS` | KB results + citations | Cyan, expandable sources | Answer, source snippets, related questions | — |
| `HARD_STOP` / `STOP_PROCESS` | Hard-stop card | Red border, warning icon | Prohibition reason, blocked item, risk layer | Wired |
| `FINALIZE_DRAFT` | Draft finalization | Green, action buttons | Project ID, summary, next steps, "Review" button | Wired |
| `SHOW_RAW_RESPONSE` | Plain text bubble | Standard chat | Raw answer text | Fallback |
| `SHOW_ERROR` | Error card | Red, retry button | Error type, message, retry option | — |
| `ROUTE_WORK_ITEM` | Work item routing | — | Work item type, ID, target agent | — |

---

## 14. NPA Metrics & KPIs

### 14.1 Portfolio KPIs

| KPI | Target | Tool |
|-----|--------|------|
| Total Active NPAs | — | `get_dashboard_kpis` |
| Average Cycle Time | < 45 days | `get_dashboard_kpis` |
| Approval Rate (first submission) | > 80% | `get_dashboard_kpis` |
| SLA Compliance | > 95% | `check_sla_status` |
| Auto-Fill Coverage | > 60% | Autofill summary |
| Hard Stop Rate | < 10% | Risk results |
| Loop-Back Rate | < 20% | `governance_check_loopbacks` |
| PIR Completion Rate (NTG) | > 90% | `get_post_launch_conditions` |

### 14.2 Stage Distribution

| Stage | Healthy % | Alert If > |
|-------|----------|-----------|
| IDEATION | 15-20% | 30% (bottleneck) |
| CLASSIFICATION | 10-15% | 25% |
| RISK_ASSESSMENT | 10-15% | 25% |
| AUTOFILL | 10-15% | 20% |
| SIGN_OFF | 20-30% | 40% |
| POST_LAUNCH | 15-25% | — |

---

## 15. Phase 0 Build Order & Validation Gates

| Step | Dify App | Validates | Effort |
|------|----------|----------|--------|
| 1 | CF_NPA_Orchestrator | Gate 1: Envelope, routing, session tools | 1 day |
| 2 | CF_NPA_Ideation | Gate 2: Chatflow delegation, NPA creation, conversation persistence | 1 day |
| 3 | CF_NPA_Query_Assistant | Gate 3: Read path, cross-domain queries, KB citations | 1 day |
| 4 | WF_NPA_Classify_Predict | Gate 4: Workflow integration, structured outputs | 0.5 day |
| 5 | WF_NPA_Risk + WF_NPA_Autofill + WF_NPA_Governance_Ops | Scale pattern | 1.5 days |
| 6 | Freeze architecture | All gates passed end-to-end | — |

---

**End of Knowledge Base — NPA Domain Deep-Dive Phase 0 v3.0**
