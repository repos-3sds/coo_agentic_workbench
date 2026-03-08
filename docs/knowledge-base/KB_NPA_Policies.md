# KB_NPA_Policies.md
## Complete NPA Policies & Procedures (Consolidated from 6 Policy Documents)

**Document Version:** 2.0
**Last Updated:** February 19, 2026
**Purpose:** Consolidated policy reference for LLM agents covering ALL NPA policies, procedures, and governance
**Source of Truth:** NPA Business Process Deep Knowledge Report (2026-02-18), Architecture Gap Register (44 rules R01-R44)
**Policy Hierarchy:** NPA Policy > NPA Standard (MBS_10_S_0012_GR) > GFM NPA SOP -- Where they differ, the STRICTER requirement prevails

---

## Table of Contents

1. [Policy Overview & Scope](#1-policy-overview--scope)
2. [Product Definitions & Classifications](#2-product-definitions--classifications)
3. [Two-Stage Classification Model](#3-two-stage-classification-model)
4. [Approval Tracks -- Five Pathways](#4-approval-tracks--five-pathways)
5. [NPA Lifecycle (5 Stages)](#5-npa-lifecycle-5-stages)
6. [Initiation & Kick-Off Requirements](#6-initiation--kick-off-requirements)
7. [Maker-Checker Model & Review Process](#7-maker-checker-model--review-process)
8. [Sign-Off Parties (SOPs) -- The Seven Assessors](#8-sign-off-parties-sops--the-seven-assessors)
9. [Approval Authority](#9-approval-authority)
10. [Cross-Border Booking -- The Mandatory Override](#10-cross-border-booking--the-mandatory-override)
11. [Bundling -- 8-Condition Gate](#11-bundling--8-condition-gate)
12. [Regulatory Clearance & UAT](#12-regulatory-clearance--uat)
13. [Launch & Validity Period](#13-launch--validity-period)
14. [Post-Implementation Review (PIR)](#14-post-implementation-review-pir)
15. [Loop-Backs, Rework & Circuit Breaker](#15-loop-backs-rework--circuit-breaker)
16. [Notional Threshold Escalation](#16-notional-threshold-escalation)
17. [NPA Document Structure (47 Fields)](#17-npa-document-structure-47-fields)
18. [Escalation Procedures](#18-escalation-procedures)
19. [Record Maintenance](#19-record-maintenance)
20. [GFM-Specific Procedures](#20-gfm-specific-procedures)
21. [Evergreen Product Framework](#21-evergreen-product-framework)
22. [Governance Forums](#22-governance-forums)
23. [Policy Deviations](#23-policy-deviations)
24. [Baseline Metrics & Pain Points](#24-baseline-metrics--pain-points)

---

## 1. Policy Overview & Scope

### 1.1 Purpose

**New Product Approval (NPA) Policy establishes:**
- Controls and governance for introducing new products/services across MBS Group
- Standards for changes to existing products/services
- Risk assessment and sign-off requirements

**Scope:**
- **Applicable to:** ALL Business Units (BUs), Support Units (SUs), branches, subsidiaries in ALL locations
- **Geographic:** Singapore, Hong Kong, London, India, and all other MBS locations
- **Product Types:** Financial products, services, initiatives (principal, agent, intermediary, advisor roles)

---

### 1.2 Policy Framework Hierarchy

NPA is governed by three layers. Where they conflict, the **stricter** requirement ALWAYS prevails:

| Priority | Document | Owner | Scope |
|----------|----------|-------|-------|
| 1 (Highest) | **New Product Approval Policy** | Group | Overarching group policy |
| 2 | **NPA Standard** (MBS_10_S_0012_GR) | RMG-OR | Detailed standard issued by Risk Management Group |
| 3 | **GFM NPA Standard Operating Procedures** | GFM COO | GFM-specific rules -- STRICTER than group standard in several areas |

**Critical rule:** Where the GFM SOP and the Group Standard differ, the stricter requirement prevails.

---

### 1.3 Regulatory Primacy Rule

**If MBS policy differs from regulatory requirements:**
- **The STRICTER requirement prevails** (always more conservative)
- RMG-OR (Risk Management Group - Operational Risk) must be notified

**Examples:**
- MAS requires 30-day approval timeline, MBS policy requires 20 days -> Use 20 days
- Local regulation allows 2-year validity, MBS allows 1 year -> Use 1 year

---

## 2. Product Definitions & Classifications

### 2.1 What is a "New Product/Service"?

**Definition:**
Any product or service MBS Group intends to offer as principal, agent, intermediary, or advisor.

**Three Main Categories:**

---

### 2.1.1 New-to-Group (NTG) [R03, R11, R16]

**Definition:**
Product/service MBS Group has NEVER done before -- in any entity, in any form, in any location.

**Criteria (ANY triggers NTG classification):**

**Category A: New Businesses/Products**
- New businesses, initiatives, products, financial instruments, services
- **Example:** Credit Default Swaps (CDS) - MBS has never traded CDS -> NTG
- **Example:** Cryptocurrency derivatives - MBS has never offered crypto products -> NTG

**Category B: New Roles**
- New roles within business/product group
- **Roles:** Origination, trading as principal, distribution, agency, custodian, operating an exchange, providing operations support
- **Example:** MBS distributes FX Options, but never traded as principal -> NTG (huge risk shift)
- **Example:** First time acting as custodian for mutual funds -> NTG

**Category C: New Channels/Segments/Markets**
- New distribution channels
- New customer segments
- New exchange memberships
- New markets/geographies
- **Example:** First mobile app distribution (previously only branch) -> NTG
- **Example:** First retail offering (previously only institutional) -> NTG
- **Example:** First Singapore Exchange (SGX) membership for futures -> NTG
- **Example:** First product in Vietnam market -> NTG

**NTG Mandatory Requirements:**
1. **PAC Approval REQUIRED** (Product Approval Committee) -- BEFORE NPA submission [R16]
2. **Full NPA Process** (NEVER NPA Lite, NEVER Bundling) [R11]
3. **All 7 Sign-Off Parties** (Credit, Finance, Legal, MLR, Operations, Technology, RMG-OR) [R20]
4. **NTG from overseas:** Head Office function sign-offs required [R22]
5. **PIR Mandatory** (within 6 months of launch, even without conditions) [R30]
6. **Validity:** 1 year (extendable ONCE for +6 months with unanimous SOP consent + COO approval) [R27, R28]

---

### 2.1.2 Variation [R04]

**Definition:**
Modification to existing product/service that **alters risk profile** for customer and/or bank.

**Criteria (ANY triggers Variation classification):**

**Variation Type 1: Bundling/Combination**
- Bundling or combination of existing products
- Can be by one unit OR jointly with another unit
- **Example:** FX Option + Deposit -> Dual Currency Deposit (DCD)

**Variation Type 2: Cross-Book Structures**
- Product structures crossing banking vs trading books
- **Example:** Banking book loan combined with trading book derivative

**Variation Type 3: Accounting Treatment Change**
- Features/structures potentially changing accounting treatment
- **Example:** Accrual accounting -> Mark-to-market accounting
- **Action Required:** **Consult Group Finance when in doubt**

**Variation Type 4: Manual Workarounds**
- Products requiring significant offline/manual adjustments
- **Example:** System can't calculate, requires manual Excel calculations

**Variation Type 5: Sustainability Features**
- Products with sustainability focus, features, labels
- **Example:** "Green" deposits, "Green" bonds, "ESG" loans

**Variation Type 6: Advanced/Innovative Technology**
- Use of advanced/innovative technology for existing products
- New or significant changes to business operating model
- **Example:** Collaboration with fintech companies, blockchain-based settlement, AI/ML pricing

**Variation Type 7: New Communication Channels**
- New third-party hosted communication/media channels/platforms
- Channels not previously risk-assessed
- **Example:** Social media platforms (WeChat, WhatsApp) for marketing

**Variation Approval Track -- Risk Severity Determines Track:**
- **High Risk** (accounting change, cross-book, fintech, manual workarounds) -> **Full NPA**
- **Medium Risk** (minor bundling, adding settlement option) -> **NPA Lite**
- **Low Risk** (typo correction, clarification) -> **NPA Lite Addendum (B4)**

---

### 2.1.3 Existing [R05]

**Definition:**
Products/services already approved elsewhere in MBS, but new to specific context.

**Three Sub-Types:**

**Existing Type A: New to Location/Entity/Branch/Unit**
- Product approved and launched by another BU/SU/location/entity
- Same product, different location/entity
- **Example:** FX Forward approved in Singapore, now launching in Hong Kong

**Existing Type B: Dormant Products**
- Product previously approved but **no transactions in last 12 months** [R34]
- Considered dormant, requires reactivation
- **Dormancy tiers matter:**
  - Dormant <1 year -> NPA Lite (simple reactivation)
  - Dormant 1-3 years -> NPA Lite (standard reactivation) or Fast-Track B3
  - **Dormant >=3 years -> Escalate to GFM COO** (may need Full NPA)

**Existing Type C: Expired Products**
- Approved products not launched within validity period
- Validity expired, requires reactivation
- **If no variations** -> NPA Lite - Reactivation
- **If variations exist** -> Full NPA (treated as effectively NTG)

**Existing Product Routing Logic (Complete):**

| Existing Status | Condition | Route |
|----------------|-----------|-------|
| Active + Evergreen list | Within limits | Evergreen (trade same day) |
| Active + NOT Evergreen | -- | NPA Lite - Reference Existing |
| Dormant <3yr | Meets fast-track criteria (5 checks) | B3 Fast-Track (48 hours) |
| Dormant <3yr | Variations detected | Standard NPA Lite |
| **Dormant >=3yr** | -- | **ESCALATE to GFM COO** (may need Full NPA) |
| Expired | No variations | NPA Lite - Reactivation |
| Expired | Variations detected | Full NPA (treated as NTG) |

---

### 2.1.4 Exclusions (NOT Considered New Products)

**The following are EXCLUDED from NPA definition:**

1. **Organizational Changes** -- Change management initiatives (org structure, transfer of responsibilities), NO change to product
2. **System Changes** -- New system implementations OR enhancements with NO change to product supported
3. **Process Re-Engineering** -- Process changes NOT triggered by new product/variation
4. **New Legal Entities** -- New operating/legal entities via incorporation or acquisition (separate governance)

---

## 3. Two-Stage Classification Model [R02]

**Classification is the single most important decision in the NPA process. It happens in TWO stages, and getting it wrong means the entire downstream process is wrong.**

---

### Stage 1: What IS This Product? (Ontology)

Determine the fundamental nature of the product:
- **New-to-Group (NTG)** -- Never done before anywhere in MBS Group
- **Variation** -- Modification that alters risk profile
- **Existing** -- Already approved elsewhere, new context

**You CANNOT proceed to Stage 2 without completing Stage 1.**

---

### Stage 2: HOW Should We Approve It? (Workflow)

Based on Stage 1 classification + risk factors, determine the approval track:
- **Track A:** Full NPA (all NTG, high-risk variations, expired with variations)
- **Track B:** NPA Lite -- with 4 sub-types (B1/B2/B3/B4)
- **Track C:** Bundling Approval (8-condition gate)
- **Track D:** Evergreen (auto-approved if within limits)
- **Track E:** Hard Stop / Prohibited (immediate termination)

**The approval track depends entirely on what the product is.**

---

## 4. Approval Tracks -- Five Pathways [R11-R19]

### Track A: Full NPA -- The Heavy Lifter

**When:** All NTG products [R11]. High-risk Variations. Expired products with variations. Significant regulatory implications.

**Process:** Discovery -> Review (Maker/Checker) -> Sign-Off (parallel, all SOPs) -> Launch Prep (system config, UAT) -> Launch -> PIR/Monitoring

**All 7 sign-off parties required:** Credit, Finance, Legal & Compliance, MLR, Operations, Technology, RMG-OR (consultative)

**Timeline:** Currently averages 12 days. Target: 4 days.

**ENFORCEMENT [R11]:** NTG -> ALWAYS Full NPA. No exceptions. DB constraint.

---

### Track B: NPA Lite -- The Agile Track (4 Sub-Types) [R12-R15]

#### B1: Impending Deal (48-Hour Express) [R12]
- **Eligibility:**
  - Back-to-back deal with professional counterparty, OR
  - Dormant/expired product with UAT completed, OR
  - Singapore-approved NPA applicable regionally on BTB basis
- **Process:**
  - 48-hour notice period to ALL relevant SOPs
  - If **ANY** SOP objects -> Falls back to standard NPA Lite
  - If no objections after 48 hours -> **Auto-approved**
- **Timeline:** 48 hours

---

#### B2: NLNOC (NPA Lite No Objection Concurrence) [R13]
- **Eligibility:**
  - Simple change to payoff of approved product
  - Reactivation of dormant/expired NPA with no structural changes
- **Process:**
  - Decision by **GFM COO + Head of RMG-MLR jointly**
  - SOPs provide "no-objection concurrence" (lighter than full sign-off)
- **Timeline:** 5-10 business days

---

#### B3: Fast-Track Dormant Reactivation (48-Hour) [R14]
- **Eligibility -- ALL 5 criteria must pass:**
  1. Existing live trade in the past (trade history confirmed)
  2. NOT on prohibited list (sanctions/regulatory clear)
  3. PIR completed for original NPA
  4. No variation or changes to product features
  5. No change to booking model/system
- **Process:**
  - 48-hour no-objection notice to original approvers
  - If no objections -> Auto-approved
  - If ANY criterion fails -> Route to standard NPA Lite
- **Timeline:** 48 hours

---

#### B4: Approved NPA Addendum (Minor Changes) [R15]
- **Eligibility:**
  - Applies to **LIVE** (not expired) NPAs only
  - Minor/incremental updates (adding cash settlement, bilateral -> tripartite, typo fixes)
  - **NOT eligible** for new features, new payoffs, new risk profiles
- **Process:**
  - Original NPA reference kept intact (same GFM ID)
  - Reduced sign-off (typically 1-2 SOPs affected)
- **CRITICAL:** Validity period NOT extended (maintains original expiry)
- **Timeline:** <5 business days

---

### Track C: Bundling Approval -- The LEGO Master [R08, R17]

Combining 2+ already-approved "building blocks" into a new structure. Requires 8-condition gate to pass (see Section 11).

---

### Track D: Evergreen -- The Fast Pass [R09, R18, R43, R44]

Standard vanilla products "always on" for 3 years (see Section 21).

---

### Track E: Hard Stop -- Prohibited [R01, R10]

**Products or jurisdictions explicitly banned by policy or regulation. IMMEDIATE workflow termination.**

**No exceptions without Compliance/EVP review.**

**Three Prohibition Layers:**
1. **Internal bank policy** -- Products MBS has decided not to offer (risk appetite, reputational)
2. **Regulatory restrictions** -- MAS, CFTC, FCA, local regulators
3. **Sanctions/embargoes** -- OFAC SDN, UN Security Council, EU, MAS (zero tolerance, criminal liability)

**ENFORCEMENT [R01]:** Prohibited check runs BEFORE classification (Step 0). Hard stop = workflow termination.

**ENFORCEMENT [R10]:** If prohibited -> NPA CANNOT be created. System must BLOCK all stage transitions. No workarounds.

---

## 5. NPA Lifecycle (5 Stages)

### Stage 1: Product Development & Business Case

**Activities:**

**Product Ideation:**
- Initial product concept development
- Identify market opportunity, customer need

**Early Engagement:**
- **CRITICAL:** Hold discussions with sign-off parties EARLY (before formal NPA)
- Purpose: Mutual understanding of product and key risks
- Incorporate sign-off party inputs BEFORE first draft
- **Benefit:** Reduces loop-backs, saves 3-5 days later

**Business Case Preparation:**
- Proposing unit prepares business case detailing:
  - Rationale (why this product?)
  - Costs (development, operations, technology)
  - Benefits (revenue, strategic positioning)
  - Key risks (credit, market, operational, reputational)
  - Mitigants (how risks will be managed)

**PAC Approval (NTG Products ONLY) [R16]:**
- **If NTG:** Proposing unit MUST submit to Product Approval Committee (PAC)
- **PAC Composition:** GFM COO, Group Risk Head, CFO, CRO
- **ONLY AFTER PAC approval** can NPA process begin
- **HARD GATE:** NPA submission BLOCKED if NTG and PAC != Approved

---

### Stage 2: NPA Process (Due Diligence, Review, Sign-Off, Approval)

**Initiation:**
- Proposing unit assesses product classification (NTG/Variation/Existing)
- If in doubt -> Engage Group BU/SU COO for classification decision
- Organize NPA kick-off meeting with sign-off parties
- If cross-border: Finance, Credit, MLR, Tech, Ops sign-offs MANDATORY [R07]

**Due Diligence:**
- Product specifications, risk assessment, operational requirements
- Technology requirements, data management, legal documentation

**Review & Sign-Off [R25-R26]:**
- Maker -> Checker -> SOPs -> COO (sequential gates)
- Parallel SOP review (all sign-off parties review simultaneously)
- SOPs can set: permanent restrictions, product parameters, post-launch conditions [R23, R24]
- NTG from overseas: Head Office function sign-offs required [R22]
- Non-NTG core markets: Group SU Heads appoint location sign-off party
- Non-NTG international centres: Location or Head Office (Group SU Head's discretion)

**Approval:**
- Group BU/SU COO (or delegate) gives final approval
- For overseas-initiated: local approval FIRST, then Group COO approval

---

### Stage 3: Regulatory Clearance & UAT

- Separate from NPA process but can run **in parallel**
- Issues identified must be addressed BEFORE launch
- Re-approvals from relevant SOPs if needed
- Launch CANNOT occur until: ALL sign-offs + ALL regulatory clearances + ALL UAT issues resolved

---

### Stage 4: Launch

- **Launch = first marketed sale/offer OR first trade** (not just indication of interest)
- Must occur within validity period
- If not launched within validity -> NPA expires [R27]

---

### Stage 5: Post-Implementation Review (PIR) [R30-R32]

- Mandatory for ALL NTG products (even without conditions)
- Mandatory for ALL products with post-launch conditions
- **GFM stricter rule:** Mandatory for ALL launched products regardless of type [R32]
- Must be initiated within 6 months of launch

---

## 6. Initiation & Kick-Off Requirements

### 6.1 Classification Assessment

**Before initiating NPA:**
- Proposing unit assesses product classification (NTG/Variation/Existing)
- **If uncertain:** Engage Group BU/SU COO for decision
- **GFM-Specific:** GFM COO consults GFM NPA Governance Forum

---

### 6.2 Cross-Border Mandatory Sign-Offs [R07]

**If NPA involves cross-border booking -- NON-NEGOTIABLE:**
1. Finance (Group Product Control)
2. RMG-Credit
3. RMG-Market & Liquidity Risk (MLR)
4. Technology
5. Operations

**These 5 SOPs CANNOT be waived even for NPA Lite.**

**Cross-Border Definition:**
- Different booking locations/entities
- Execution/booking/settlement spanning multiple jurisdictions

**Why Cross-Border is Special:**
- Multiple regulatory regimes (MAS + HKMA, or FCA + MAS, etc.)
- Transfer pricing and tax implications
- Dual booking requirements
- Different legal documentation standards
- Regulatory arbitrage concerns

---

### 6.3 NPA Kick-Off Meeting

**Proposing unit organizes kick-off meeting with sign-off parties:**
- Present product overview (features, structure, target customers)
- Discuss risks and issues
- Agree on timeline for due diligence and sign-off
- Clarify sign-off party requirements

---

## 7. Maker-Checker Model & Review Process [R25, R26]

### 7.1 The Sequential Approval Chain

**NPA approval follows a strict sequential model:**

```
MAKER (Proposing Unit Lead)
  -> Writes NPA, fills all sections, gathers documentation
  |
CHECKER (PU NPA Champion or designated reviewer)
  -> Reviews for completeness, accuracy, consistency
  -> Can: APPROVE, REJECT, or REQUEST CHANGES
  -> If REJECT -> Loop-back to Maker (+3-5 days per iteration)
  |
SIGN-OFF PARTIES (SOPs) -- in PARALLEL
  -> Each SOP assesses risk in their domain
  -> Can: APPROVE, APPROVE WITH CONDITIONS, REJECT
  |
COO FINAL APPROVAL
  -> Group BU/SU COO gives final approval to launch
```

**State Machine [R25-R26]:**
DRAFT -> PENDING_CHECKER -> PENDING_SIGN_OFFS -> PENDING_FINAL_APPROVAL -> APPROVED

---

### 7.2 Sign-Off Party Responsibilities

**Sign-off parties must:**
1. Review NPA comprehensively (product, risks, mitigants)
2. Assess if product aligns with risk appetite
3. Identify conditions (if any) to impose [R23, R24]
4. Provide timely sign-off (within SLA, default 48 hours) [R37]
5. Engage in loop-back discussions if clarifications needed

**SOPs can set three types of conditions [R23]:**
- **Permanent restrictions** -- incorporated into product features
- **Product parameters** -- scope of permissible activity (e.g., specific client segment only)
- **Post-launch conditions** -- short-term, measurable, to be addressed after launch

---

### 7.3 NPA Champion Roles

**Proposing Unit NPA Champion:**
- Appointed by proposing unit (or GFM COO for GFM products)
- Manage end-to-end risk due diligence
- Ensure alignment with NPA requirements

**Sign-Off Party NPA Champion:**
- Appointed by sign-off party
- Facilitate timely review and sign-off within their unit

---

## 8. Sign-Off Parties (SOPs) -- The Seven Assessors [R19-R24]

### 8.1 The Seven Core Sign-Off Parties

| SOP | What They Assess | Key Concerns |
|-----|-----------------|--------------|
| **RMG-Credit** | Credit risk, counterparty risk, country risk, concentration risk | Counterparty rating? Collateral? Pre-settlement exposure (PCE)? SACCR? |
| **Finance (GPC)** | Accounting treatment, P&L recognition, capital impact, ROAE | Trading or banking book? Capital consumption? Tax implications? |
| **Legal & Compliance** | Regulatory compliance, legal documentation, sanctions, financial crime | Permitted? License needed? ISDA/GMRA in place? AML/CFT? |
| **RMG-MLR** | Market risk, VaR, stress testing, liquidity risk, LCR/NSFR | IR/FX/EQ Delta/Vega? CS01? Can we hedge? Stress scenarios? HQLA? |
| **Operations (GFMO)** | Operating model, booking process, settlement, manual processes | Systems handle it? STP or manual? Settlement straight-through? |
| **Technology** | System configuration, UAT, booking systems (Murex/Mini/FA) | Murex support? New build needed? UAT plan and timeline? |
| **RMG-OR** | Overall operational risk, process risk, audit oversight | **Consultative role.** Owns NPA Standard. Reviews for completeness. |

---

### 8.2 Dynamic SOP Assignment by Track [R19]

| Track | Required SOPs |
|-------|---------------|
| Full NPA (NTG) | ALL 7 SOPs [R20] |
| Full NPA (Non-NTG) | ALL 7 SOPs [R20] |
| NPA Lite | Reduced set (typically 2-3 based on risk areas) |
| Bundling | Bundling Arbitration Team (6 members) |
| Evergreen | None (auto-approved, log-only) |
| **Cross-Border Override [R07]** | **+5 mandatory: Finance, Credit, MLR, Tech, Ops -- CANNOT be waived** |

---

### 8.3 Sign-Off Authority Levels [R22]

| Scenario | Sign-Off Level |
|----------|---------------|
| NTG from overseas | **Head Office** function sign-offs required |
| Non-NTG in core markets | Location-level sign-off party (appointed by Group SU Head) |
| Non-NTG in international centres | Location or Head Office (Group SU Head's discretion) |

---

## 9. Approval Authority

### 9.1 Final Approval

**Final Approval:**
- **Group BU/SU Chief Operating Officer (COO)**
- **OR** COO's delegate (must be at least VP level)
- **OR** Party appointed by Group Head of proposing unit

**Overseas Locations:**
- Local approval MUST be obtained per local regulations
- THEN obtain Group BU/SU COO approval
- **Local approval FIRST, Group approval SECOND**

---

### 9.2 GFM-Specific Approval

**For GFM products:**
- **GFM COO** is approving authority
- GFM COO consults **GFM NPA Governance Forum** for:
  - Product classification decision
  - Appropriate NPA type (Full NPA vs NPA Lite)
  - Relevant sign-off parties selection
  - Final approval for new product

---

## 10. Cross-Border Booking -- The Mandatory Override [R07]

### 10.1 What Constitutes Cross-Border

- Singapore desk trades with Hong Kong entity
- London desk books deal in Singapore books
- Any product where execution/booking/settlement spans multiple jurisdictions

---

### 10.2 Why It's Treated Specially

Cross-border introduces:
- Multiple regulatory regimes (MAS + HKMA, or FCA + MAS, etc.)
- Transfer pricing and tax implications
- Dual booking requirements
- Different legal documentation standards
- Potential for regulatory arbitrage concerns

---

### 10.3 The Override Rule (Standard Section 2.3.2) [R07]

**"For NPA/NPA Lite which involves cross border booking, the relevant sign-off parties MUST include Finance, RMG-Credit, RMG-Market & Liquidity Risk (MLR), Technology and Operations."**

**This is NON-NEGOTIABLE.** Even if the product qualifies for NPA Lite, these 5 sign-offs are mandatory and CANNOT be waived.

---

## 11. Bundling -- 8-Condition Gate [R08, R17]

### 11.1 The Concept

A **bundle** is a combination of two or more individually approved products ("building blocks") packaged into a single structure for the client. The legal confirmation to the client is one document, but internally it may be booked as multiple separate deals.

**Example:** Dual Currency Deposit = FX Option (Block 1) + Fixed Deposit (Block 2)

---

### 11.2 The 8 Bundling Conditions (ALL Must Pass) [R08]

| # | Condition |
|---|-----------|
| 1 | Building blocks can be booked in Murex/Mini/FA with no new model required |
| 2 | No proxy booking in the transaction |
| 3 | No leverage in the transaction |
| 4 | No collaterals involved (or can be reviewed but not auto-rejection) |
| 5 | No third parties involved |
| 6 | Compliance considerations in each block complied with (PDD form submitted) |
| 7 | No SCF (Structured Credit Financing) except structured warrant bundle |
| 8 | Bundle facilitates correct cashflow settlement |

**If ALL 8 pass** -> Bundling Approval (via Arbitration Team)
**If ANY fail** -> Must go through Full NPA or NPA Lite instead [R17]

---

### 11.3 The Bundling Arbitration Team

| Member | Role |
|--------|------|
| Head of GFM COO Office NPA Team | Chair |
| RMG-MLR | Market & Liquidity Risk assessment |
| TCRM | Technology & Credit Risk Management |
| Finance-GPC | Group Product Control |
| GFMO | GFM Operations |
| GFM Legal & Compliance | Legal/regulatory assessment |

---

### 11.4 Pre-Approved (Evergreen) Bundles -- No Approval Needed

Certain standard bundles are pre-approved:
- **Dual Currency Deposit/Notes** (FX Option + LNBR/Deposit/Bond)
- **Treasury Investment Asset Swap** (Bond + IRS)
- **Equity-Linked Note** (Equity Option + LNBR)

---

### 11.5 Approved FX Derivative Bundles

28+ pre-approved FX bundles exist, including:
- Best/Worst of Option, KIKO (Knock-In Knock-Out) CLI
- Boosted KO Forward with Guarantee, Multi-period EKI Strangle
- Pivot Forward, Trigger Forward, Range Coupon CCY Linked SIP

Full list maintained in "List of approved FX Bundled products.xlsx" by GFM COO Office.

---

## 12. Regulatory Clearance & UAT

### 12.1 Separate Processes

**NPA process is SEPARATE from regulatory clearance and UAT:**
- Can proceed **in parallel** (simultaneously)
- NPA sign-offs NOT conditional on regulatory clearance/UAT
- BUT: Launch CANNOT occur until BOTH complete

---

### 12.2 Issue Resolution

**Proposing unit MUST ensure:**
- All issues/conditions from regulatory clearance addressed BEFORE launch
- All issues/conditions from UAT addressed BEFORE launch
- Re-approvals obtained if material changes required based on regulatory/UAT feedback

---

## 13. Launch & Validity Period [R27, R28, R29]

### 13.1 Validity Period [R27]

| Product Type | Validity |
|-------------|----------|
| Full NPA / NPA Lite | **1 year** from approval date |
| Evergreen | **3 years** from approval date (GFM deviation) |

**If not launched within validity period:**
- NPA expires, product CANNOT be traded
- To reactivate -> Engage Group BU/SU COO [R29]
- No variations -> NPA Lite - Reactivation track
- Variations -> Full NPA (treated as new)

---

### 13.2 Extension Rules (One-Time Only) [R28]

**ONE extension allowed:** +6 months (total maximum: 18 months)

**Extension Conditions (ALL must be met):**
1. No variation to product features
2. No alteration to risk profile (customer or bank)
3. No change to operating model or basis of sign-off
4. **Unanimous consensus** from ALL original sign-off parties
5. **Group BU/SU COO approval**

**If ANY SOP disagrees -> extension denied.**

**Extension Process:**
```
Step 1: Proposing unit requests extension (BEFORE validity expires)
Step 2: Request sent to ALL original sign-off parties
Step 3: ALL must consent (unanimous)
Step 4: Group BU/SU COO reviews and approves
Step 5: Validity extended by +6 months
```

---

### 13.3 Launch Definition

**"Launch" means either:**
- The date the product is first marketed AND resulted in a sale/offer, OR
- The first trade date

**NOT Launch:** Merely indicating MBS interest to customer (not yet launched)

---

### 13.4 GFM Deviation -- Treasury & Markets

**Deviation Holder:** Treasury & Markets, Singapore and locations
**Section:** 2.7 Launch and Validity of Approval
**Effective Date:** 21 Feb 2023
**Deviation:** Evergreen products: 3-year validity (vs standard 1-year)

---

## 14. Post-Implementation Review (PIR) [R30, R31, R32]

### 14.1 PIR Mandatory Triggers

**PIR is MANDATORY for:**

| Trigger | Description | Sign-Off By |
|---------|-------------|-------------|
| **Trigger 1** [R30] | ALL New-to-Group (NTG) products -- even without conditions | ALL original SOPs |
| **Trigger 2** [R31] | ALL products with post-launch conditions imposed by SOPs | SOPs who imposed conditions |
| **Trigger 3** [R32] | **GFM STRICTER RULE: ALL launched products** regardless of classification | Relevant SOPs |
| **Trigger 4** | Reactivated expired NTG (no changes) -- treated as extension of original | Original NPA SOPs |
| **Trigger 5** | New to location/entity referencing NTG where PIR not yet completed | As per original NTG |

**Timeline:** Must be **initiated within 6 months** of product launch

---

### 14.2 PIR Reminder Schedule

| Timing | Reminder |
|--------|---------|
| Launch + 120 days | "PIR due in 60 days, begin preparation" |
| Launch + 150 days | "PIR due in 30 days, submit draft" |
| Launch + 173 days | **"PIR OVERDUE, submit immediately"** |

---

### 14.3 PIR Exemptions

**PIR NOT required for:**
1. Non-NTG Full NPA with NO conditions imposed
2. NPA Lite with NO conditions imposed (exception: if original product was NTG -> PIR still required)

---

### 14.4 PIR Content Requirements

**PIR report must include:**

**Section 1: Actual vs Projected Performance**
- Trading volume, revenue, customer uptake (projected vs actual)

**Section 2: Post-Launch Issues**
- Operational issues, system issues, customer complaints, regulatory findings
- How resolved: Actions taken

**Section 3: Conditions Compliance**
- List ALL conditions, status of each (satisfied/not), evidence

**Section 4: Lessons Learned**
- What went well, what to change, recommendations

**Section 5: Risk Assessment Update**
- New risks identified post-launch, mitigants that didn't work, updated risk profile

---

### 14.5 PIR Repeat Logic

**If SOPs identify issues during PIR:**
- PIR must be **repeated**
- New PIR scheduled: **90 days after failed PIR**
- Process continues until SOPs are satisfied

---

### 14.6 Group Audit Review

**Group Audit will:**
- Include new products in audit risk assessment
- Conduct PIR(s) where necessary (independent audit)
- Validate proposing unit's PIR findings

---

## 15. Loop-Backs, Rework & Circuit Breaker [R35, R36]

### 15.1 The Four Types of Loop-Back [R36]

**Type 1: Checker Rejection (Major Loop-Back)**
- Maker submits -> Checker reviews -> REJECTS
- Loop-back to Maker (Draft stage)
- **Impact:** +3-5 days per iteration
- **Current average:** 1.4 iterations per NPA

**Type 2: Approval Clarification (Smart Loop-Back)**
- SOP reviews -> needs clarification
- If clarification requires NPA document changes -> loop-back to Maker
- If clarification answerable from existing docs -> direct response (no loop-back)
- **Time saved by smart routing:** ~2-3 days per clarification

**Type 3: Launch Preparation Issues**
- During system config/UAT -> issue discovered -> needs SOP re-review
- Loop-back to specific SOP only (not all)
- Typical causes: system compatibility, regulatory changes, risk threshold breaches

**Type 4: Post-Launch Corrective Action**
- After launch -> PIR identifies issue -> requires NPA amendment
- Loop-back to Review Stage (expedited re-approval)
- Causes: volume below projections, unexpected issues, customer feedback, regulatory findings

---

### 15.2 The Circuit Breaker Rule [R35]

**Trigger:** After **3 loop-backs** on the same NPA

**Action:** AUTOMATIC escalation to:
- Group BU/SU COO
- NPA Governance Forum

**Rationale:** 3 loop-backs indicate a fundamental problem -- unclear requirements, complex edge case, or process breakdown that needs senior intervention.

**Current Metrics:**
- Loop-backs per month: **8**
- Average rework iterations: **1.4**
- Circuit breaker escalations: **~1 per month**

---

## 16. Notional Threshold Escalation [R40, R41, R42]

**Notional value of the product triggers additional requirements:**

| Notional Value | Additional Requirement | Sign-Off Impact |
|---------------|----------------------|-----------------|
| > $20M [R40] | ROAE sensitivity analysis **REQUIRED** | Upload to ROAE Appendix |
| > $50M [R41] | Finance VP review **REQUIRED** | Auto-add Finance VP to sign-off matrix |
| > $100M [R42] | CFO review **REQUIRED** | Auto-add CFO to sign-off matrix |

**These thresholds apply to ALL tracks** including Bundling (aggregate notional) and Evergreen.

**ENFORCEMENT:** System automatically adds escalation approvers when notional exceeds threshold. Cannot bypass.

---

## 17. NPA Document Structure (47 Fields)

### 17.1 Official Template Structure

The NPA document follows a standardized template (**RMG OR Version Jun 2025 -- 47 base fields**):

**Part A: Basic Product Information (6 fields)**
- Product/Service Name
- Business Units Covered
- Product Manager and Group Head details
- Business Case Approval Status
- NPA or NPA Lite classification
- Kick-off Meeting Date

**Part B: Sign-Off Parties (dynamic)**
- All required SOPs listed
- Each SOP's sign-off status tracked

**Part C: Detailed Product Information (7 Sections + 7 Appendices)**

| Section | Content |
|---------|---------|
| **Section I** | Product Specifications (description, scope, volume, revenue, customers, commercialization) |
| **Section II** | Operational & Technology (operating model, booking, procedures, limits, manual processes, BCM) |
| **Section III** | Pricing Model Details (model validation, SIMM treatment, model names) |
| **Section IV** | Risk Analysis: A. Operational Risk, B. Market & Liquidity Risk, C. Credit Risk, D. Reputational Risk |
| **Section V** | Data Management (D4D, PURE principles, Risk Data Aggregation) |
| **Section VI** | Other Risk Identification (conduct risk, model risk, concentration, emerging risks) |
| **Section VII** | Trading Products Specific (collateral/pledged assets, valuation/funding, booking schemas) |

| Appendix | Content |
|----------|---------|
| **Appendix I** | Bundling Approval Form (8-condition checklist) |
| **Appendix II** | Entity/Location Information |
| **Appendix III** | ROAE Sensitivity Analysis (mandatory if >$20M) |
| **Appendix IV** | Intellectual Property |
| **Appendix V** | Financial Crime Risk Areas |
| **Appendix VI** | Risk Data Aggregation and Reporting |
| **Appendix VII** | Evergreen FAQ/Checklist |

**Note:** The 47 base fields are expanded to 65+ granular fields for LLM auto-fill in KB_NPA_Templates.md.

---

## 18. Escalation Procedures

### 18.1 Escalation Trigger 1: Unauthorized Product Launch

**Scenario:** Product launched WITHOUT NPA process

**Action:**
1. Initiating unit: Start NPA process **without delay**
2. Escalate to: Group BU/SU COO + RMG-OR
3. Document incident (when launched, why NPA skipped, impact)
4. Complete NPA retroactively
5. Implement controls to prevent recurrence

---

### 18.2 Escalation Trigger 2: Unresolved/Contentious Issues

**Escalation Path:**
```
Level 1: Unit NPA Champion (attempt to resolve)
  | (if unresolved)
Level 2: Group BU/SU COO
  | (if unresolved)
Level 3: Location Head (if location-specific)
  | (if unresolved)
Level 4: Relevant committees (GFM NPA Governance Forum)
```

---

### 18.3 Escalation Trigger 3: Non-Compliance with Conditions

**Scenario:** Non-fulfillment, non-compliance, or delays in condition satisfaction/PIR

**Escalation to:** Group BU/SU COO -> Location Head -> Risk/control committees

---

### 18.4 Escalation Trigger 4: Reputational Risk

**Scenario:** Issue exposes Group to higher reputational risk

**Escalation:** Group BU/SU COO + Group Compliance + RMG-OR -> Product Approval Committee (PAC)

---

### 18.5 Escalation Trigger 5: Circuit Breaker [R35]

**Scenario:** 3 loop-backs on same NPA

**Escalation:** Automatic to Group BU/SU COO + NPA Governance Forum (see Section 15.2)

---

## 19. Record Maintenance

### 19.1 Documentation Requirements

**Proposing unit MUST keep ALL relevant documents:**
- NPA submission (all versions, including drafts)
- Business case
- Sign-off party reviews and approvals
- Conditions imposed
- PIR report (if applicable)
- Ongoing review records

**Storage:** Bank's operational risk management system (centralized)
**Retention:** Per MBS record retention policy

---

### 19.2 "No NPA Required" Assessments

- If unit assesses product does NOT require NPA (excluded per Section 2.1.4)
- **Document assessment and rationale**
- Store in operational risk management system
- **Purpose:** Audit trail, regulatory demonstration

---

## 20. GFM-Specific Procedures

### 20.1 GFM NPA Classifications

**GFM uses 4 classification types:**

| Type | Description | PAC Required | SOPs |
|------|-------------|-------------|------|
| **Full NPA (NTG)** | Product MBS has never done before | YES | All 7 |
| **Full NPA (Non-NTG)** | Significant variation, high risk/complexity | NO | All 7 |
| **NPA Lite** | Low/medium risk variation, existing product, dormant <3yr | NO | Reduced (2-3) |
| **Evergreen** | Pre-approved standard products, auto-approved if within limits | NO | None (log-only) |

---

### 20.2 GFM Clearance Types

| Type | When | Characteristics |
|------|------|----------------|
| **Full Review** | Complex, cross-border, high notional (>$50M), NTG | Comprehensive due diligence |
| **Standard Review** | Moderate complexity, variations | Standard sign-off parties |
| **Fast-Track (NPA Lite)** | Low risk, existing (new location), dormant <3yr | 48-hour no-objection notice |
| **Evergreen (Auto)** | Pre-approved standard, within limits | Same-day approval (log-only) |

---

### 20.3 GFM Stricter Rules (vs Group Standard)

| Area | Group Standard | GFM SOP (Stricter) |
|------|---------------|-------------------|
| **PIR scope** | NTG + products with conditions | **ALL launched products** regardless of type [R32] |
| **Evergreen validity** | 1 year | **3 years** (approved deviation) |
| **Circuit breaker** | Not defined at Group level | **3 loop-backs -> auto-escalate** [R35] |
| **Bundling gate** | General assessment | **8-condition checklist** [R08] |
| **NPA Lite sub-types** | Basic Lite track | **4 sub-types: B1/B2/B3/B4** [R12-R15] |

---

## 21. Evergreen Product Framework [R09, R18, R43, R44]

### 21.1 Evergreen Definition

**Evergreen products are:**
- Pre-approved standard/vanilla products
- Approved for **3 years** (vs standard 1 year)
- Auto-approved when within limits
- **No sign-off parties required** (log-only process)

---

### 21.2 Evergreen Eligibility Criteria (ALL Must Be Met)

1. **Product on Approved Evergreen List** (maintained by COO Office)
2. **No significant changes** since last approval/trade
3. **Back-to-back basis** (hedged trades) with professional counterparty
4. **Vanilla in nature** (foundation product, all variants built upon it)
5. **Liquidity management** products (including MBS Group Holdings)
6. **Exchange products** hedging customer trades
7. **ABS deals** (origination to meet client demand)
8. **Validity active** (within 3-year period)
9. **Live transactions** in system, OR validity not expired
10. **PIR completed** (if original product was NTG)
11. **Within ALL limits** (see Section 21.3)

---

### 21.3 Evergreen Limits (GFM-Wide) [R43]

| Limit Type | Scope | Cap |
|------------|-------|-----|
| **Total Notional** | Aggregated GFM-wide | USD $500,000,000 |
| **Long Tenor >10Y** (sub-limit) | Aggregated GFM-wide | USD $250,000,000 |
| **Non-Retail Deal Cap** | Per NPA | 10 deals |
| **Retail Deal Cap** | Per NPA | 20 deals |
| **Retail Transaction Size** | Per trade | USD $25,000,000 |
| **Retail Aggregate Notional** (sub-limit) | All retail products | USD $100,000,000 |

**Limit Enforcement:**
- ALL limits checked BEFORE trade execution
- If ALL pass -> Execute trade (Evergreen auto-approved)
- If ANY fail -> Downgrade to NPA Lite (not Evergreen)

**Limit Waivers [R44]:**
- **Liquidity management products:** Notional cap and deal count cap WAIVED (exigency)

**Counting Rules:**
- **Customer leg only** (exclude BTB/hedge leg)
- **Bond issuance:** Deal count = tranche number (client-facing deals)

---

### 21.4 Evergreen Exclusions (NOT Eligible)

1. Products requiring deal-by-deal approval
2. Products dormant/expired for >3 years
3. Joint-unit NPAs (Evergreen is GFM-only)

---

### 21.5 Evergreen Trading Workflow [R18]

**Real-time process:**
1. Sales/Trader executes deal with client
2. **IMMEDIATELY** (within 30 min) email GFM COD SG - COE NPA with deal details
3. SG NPA Team updates Evergreen limits worksheet (chalk usage)
4. Location COO Office confirms within 30 minutes (sanity check)
5. Initiate NPA Lite reactivation in parallel
6. When NPA Lite approved -> Uplift (restore) Evergreen limits

---

### 21.6 Evergreen Approval Process

**Step 1: Working Group Assessment** -- Proposing unit requests eligibility, NPA Working Group reviews
**Step 2: Forum Approval** -- GFM NPA Governance Forum formally approves, product added to Evergreen list
**Step 3: Location Requirements** -- Locations clear local support units, GFM Head + Country Head
**Step 4: Disagreement Resolution** -- GFM COO decides; escalate to Governance Forum if needed

---

### 21.7 Evergreen Annual Review

**Frequency:** Annual

**Purpose:**
1. Remove expired Evergreen products from approved list
2. Validate NPAs remain eligible
3. Early termination if event necessitates removal

**Dormancy Rule:** Products dormant >3 years at review time -> REMOVED from list

**Reactivated Products:** Maintain Evergreen status for NPA approval date + 3 years OR last transaction date during validity + 3 years

---

## 22. Governance Forums

### 22.1 Product Approval Committee (PAC) [R16]

**Composition:** GFM COO, Group Risk Head, CFO, CRO, Senior management

**Purpose:** Strategic approval for **NTG products ONLY** -- go/no-go decision

**When Required:** ALL New-to-Group products (before NPA submission)

**Decision:** PAC approves -> NPA can start. PAC rejects -> Product cannot proceed.

---

### 22.2 GFM NPA Governance Forum

**Chairman:** GFM COO

**Members:**
- Regional Head of GFM-COO OFFICE
- Head of GFM-BMS, Greater China
- Head of RMG-MLR
- Head of RMG-Credit-FIRM
- Head of RMG-GFM-Credit
- Head of GFM Operations
- Head of Group Technology
- Head of Group Operations
- Head of Finance - Group Product Control
- Head of GFM Legal and Compliance

**Observers:** RMG-OR (consultative, no vote), RMG-TR (consultative, no vote)

**Purpose:**
1. Facilitate NPA process and procedural decisions
2. Review urgent approval requests
3. Resolve escalated issues and circuit breaker escalations
4. Review NPA sign-off status
5. Decide product classification and NPA type
6. Decide sign-off parties
7. Final approval for new products

**Meeting:** Monthly (cancelled if no NPAs to review). Ad-hoc as needed.
**Quorum:** Chairperson + 50% of members
**Decision:** Majority vote. Chairperson has casting vote.
**Email Approval:** Valid if majority (including Chairperson) approves via email.
**Escalation:** Unresolved -> GFM Business Control Committee (GFM BCC)

---

### 22.3 GFM NPA Working Group

**Composition:**
- PU NPA Champion (appointed by GFM COO)
- Sign-off party NPA Champions
- GFM Data Steward (centralized)

**GFM Data Steward Responsibilities:**
- Assess product adherence to Risk Data Aggregation and Reporting Policy
- Assess PURE principles (Purposeful, Unsurprising, Respectful, Explainable)
- Assess Data Management Policy compliance
- Provide sign-off for data management section in NPA template

---

## 23. Policy Deviations

### 23.1 Current Approved Deviations

| Deviation | Section | Effective Date | Description |
|-----------|---------|---------------|-------------|
| Priority Sector Lending (PSL), India | 2.5 Approval | 29 Jul 2020 | Specific approval authority for PSL products |
| Treasury & Markets, SG and locations | 2.7 Validity | 21 Feb 2023 | Evergreen: 3-year validity, limits, auto-approval |

---

### 23.2 Deviation Request Process

**Step 1: Justification** -- Document rationale, demonstrate why standard policy insufficient, assess risks
**Step 2: Approval** -- Submit to RMG-OR (Head of RMG-OR approves deviations)
**Step 3: Documentation** -- Documented in Appendix 4 of NPA Standard, communicated to stakeholders

---

## 24. Baseline Metrics & Pain Points

### 24.1 Current Performance Metrics

| Metric | Value |
|--------|-------|
| NPAs processed (last 30 days) | 47 |
| Average processing time | **12 days** |
| First-time approval rate | **52%** |
| Average rework iterations | 1.4 |
| Loop-backs per month | 8 |
| Straight-through processing | 0% |
| Manual form completion time | 60-90 minutes |
| Manual classification time | 15-20 minutes |
| Circuit breaker escalations | ~1/month |

---

### 24.2 Improvement Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Processing time | 12 days | 4 days | 67% reduction |
| First-time approval rate | 52% | 75% | +23 pp |
| Rework iterations | 1.4 | 1.2 | 14% reduction |
| Loop-backs/month | 8 | 5 | 38% reduction |
| Straight-through processing | 0% | 35% | For Evergreen |
| Form completion time | 60-90 min | 15-20 min | 78% reduction |

---

### 24.3 Timeline Breakdown (Full NPA)

| Stage | Current Average | Bottleneck |
|-------|----------------|------------|
| Review (Maker/Checker) | 2-3 days | Incomplete submissions (48% missing info) |
| Sign-Off (parallel) | 6-8 days | Finance: 1.8d, Credit: 1.2d, Legal: 1.1d |
| Launch Prep | 2-3 days | System config, UAT |
| **Total** | **12 days** | -- |

---

### 24.4 Key Pain Points

1. **Classification ambiguity** -- Makers classify wrong -> wrong track -> rework
2. **Incomplete submissions** -- 48% missing information on first submission
3. **SOP bottlenecks** -- Finance and Legal have long review queues
4. **Institutional knowledge dependency** -- experienced Champions carry knowledge in their heads
5. **Historical NPA visibility** -- Makers don't know similar NPA was approved 6 months ago
6. **Evergreen limit tracking** -- done manually in Excel, risk of limit breaches
7. **PIR follow-up** -- tracked manually, easy to miss 6-month window
8. **Loop-back frustration** -- process feels adversarial, each rejection adds days

---

## 25. Cross-Cutting Business Rule Reference

**All 44 business rules from the Architecture Gap Register (R01-R44) are encoded in this policy document:**

| Rule | Section | Policy Content |
|------|---------|---------------|
| R01 | Sec.4 Track E | Prohibited check BEFORE classification (Step 0) |
| R02 | Sec.3 | Two-stage classification model |
| R03 | Sec.2.1.1 | NTG 6 triggers (new product/role/channel/segment/exchange/geography) |
| R04 | Sec.2.1.2 | Variation 7 triggers |
| R05 | Sec.2.1.3 | Existing sub-categories with dormancy tiers |
| R06 | -- | Classification confidence >=75% (in Classification Agent KB) |
| R07 | Sec.10 | Cross-border -> 5 mandatory SOPs, non-negotiable |
| R08 | Sec.11 | Bundling 8-condition checklist |
| R09 | Sec.21 | Evergreen eligibility and routing |
| R10 | Sec.4 Track E | Prohibited = HARD STOP, workflow termination |
| R11 | Sec.4 Track A | NTG -> ALWAYS Full NPA, no exceptions |
| R12 | Sec.4 Track B1 | NPA Lite Impending Deal (48-hour express) |
| R13 | Sec.4 Track B2 | NPA Lite NLNOC (joint COO+MLR decision) |
| R14 | Sec.4 Track B3 | Fast-Track Dormant (5 criteria, 48-hour) |
| R15 | Sec.4 Track B4 | NPA Addendum (live NPA only, no validity extension) |
| R16 | Sec.5 Stage 1 | PAC approval BEFORE NPA starts for NTG |
| R17 | Sec.11 | Bundling: all 8 pass -> Arbitration; any fail -> Full NPA/Lite |
| R18 | Sec.21.5 | Evergreen trading workflow (30-min notification) |
| R19 | Sec.8.2 | Track determines SOP set (dynamic assignment) |
| R20 | Sec.8.2 | Full NPA -> ALL 7 SOPs |
| R21 | Sec.10.3 | Cross-border override -> 5 mandatory SOPs |
| R22 | Sec.8.3 | NTG overseas -> Head Office sign-offs |
| R23 | Sec.7.2 | SOPs can set 3 types of conditions |
| R24 | Sec.7.2 | Approved with conditions (APPROVED_CONDITIONAL) |
| R25 | Sec.7.1 | Maker -> Checker sequential gate |
| R26 | Sec.7.1 | COO final approval after all SOPs sign off |
| R27 | Sec.13.1 | 1-year validity (Evergreen: 3 years) |
| R28 | Sec.13.2 | One-time +6mo extension, unanimous SOP consent |
| R29 | Sec.13.1 | Expired -> engage COO for reactivation |
| R30 | Sec.14.1 | PIR mandatory for ALL NTG (6 months) |
| R31 | Sec.14.1 | PIR mandatory for products with conditions |
| R32 | Sec.14.1 | GFM stricter: PIR mandatory for ALL launched products |
| R33 | Sec.13.3 | Launch = first sale/offer or first trade |
| R34 | Sec.2.1.3 | Dormant = no transactions in 12 months |
| R35 | Sec.15.2 | Circuit breaker: 3 loop-backs -> auto-escalate |
| R36 | Sec.15.1 | 4 loop-back types tracked |
| R37 | Sec.7.2 | SLA: 48 hours per approver |
| R38 | Sec.18.2 | Escalation levels: Champion -> COO -> Location Head -> Forum |
| R39 | Sec.18.2 | Unresolved -> escalate to COO/Location Head/RMG-OR |
| R40 | Sec.16 | Notional >$20M -> ROAE sensitivity required |
| R41 | Sec.16 | Notional >$50M -> Finance VP review |
| R42 | Sec.16 | Notional >$100M -> CFO review |
| R43 | Sec.21.3 | Evergreen limits: $500M, $250M, 10/20 deal caps |
| R44 | Sec.21.3 | Liquidity management: Evergreen caps waived |

---

## END OF KB_NPA_Policies.md

**This document consolidates 6 policy PDFs into one LLM-interpretable knowledge base.**

**Version 2.0 Enhancements (20 gaps closed):**
- Two-stage classification model (Stage 1: ontology, Stage 2: workflow)
- Track E: Prohibited / Hard Stop with enforcement rules
- NPA Lite B1-B4 sub-types fully defined
- Bundling 8-condition gate with Arbitration Team composition
- Pre-approved Evergreen bundles and 28+ FX bundles
- Maker-Checker sequential approval model
- 7 Core SOPs table with assessment domains
- Circuit breaker rule (3 loop-backs -> auto-escalate)
- 4 loop-back types with definitions and metrics
- Notional threshold escalation ($20M/$50M/$100M)
- 47-field NPA Document Structure (Part A/B/C)
- GFM stricter PIR rule (ALL launched products)
- PIR reminder schedule (120d, 150d, 173d)
- PIR repeat logic (90-day reschedule)
- Complete existing product routing logic table
- Baseline metrics and pain points
- GFM stricter rules comparison table
- All 44 business rules (R01-R44) cross-referenced
- Policy framework hierarchy (Policy > Standard > GFM SOP)
- Cross-cutting business rule reference table

**Total Length:** ~25,000 words | ~45 KB
**Usage:** Upload to Dify KB, link to ALL agents (especially Classification Router, Governance Agent, Product Ideation Agent, Template Auto-Fill Agent)
