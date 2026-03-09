# NPA Business Process — Deep Knowledge Report
## Comprehensive Business Analysis of the New Product Approval Process at MBS Bank / Global Financial Markets (GFM)

**Author:** Claude Code (Deep Research — Task No. 1)
**Date:** 2026-02-18
**Scope:** Pure business process understanding — no technology, no agents, no architecture
**Sources:** All files in `Context/KB/` — 10+ markdown documents, 8 images, 5 real NPA case studies (TSG1917, TSG2042, TSG2055, TSG2339, TSG2543)

---

## Table of Contents

1. [What Is NPA and Why Does It Exist?](#1-what-is-npa-and-why-does-it-exist)
2. [The Organizational Landscape](#2-the-organizational-landscape)
3. [Product Classification — The Foundation of Everything](#3-product-classification)
4. [Approval Tracks — Five Pathways Through the System](#4-approval-tracks)
5. [The Full NPA Lifecycle — Stage by Stage](#5-the-full-npa-lifecycle)
6. [Sign-Off Parties (SOPs) — Who Approves What](#6-sign-off-parties)
7. [Cross-Border Booking — The Mandatory Override](#7-cross-border-booking)
8. [Bundling — Combining Approved Building Blocks](#8-bundling)
9. [Evergreen Products — The Fast Pass](#9-evergreen-products)
10. [Validity, Extensions, and Expiration](#10-validity-extensions-and-expiration)
11. [Post-Implementation Review (PIR)](#11-post-implementation-review)
12. [Loop-Backs, Rework, and the Circuit Breaker](#12-loop-backs-rework-and-the-circuit-breaker)
13. [The NPA Document — What Gets Written](#13-the-npa-document)
14. [Real NPA Examples — Lessons from the Field](#14-real-npa-examples)
15. [The COO Ecosystem — Where NPA Fits in the Bigger Picture](#15-the-coo-ecosystem)
16. [Current Pain Points](#16-current-pain-points)
17. [Key Metrics — Baseline Performance](#17-key-metrics)
18. [Glossary of Terms](#18-glossary)

---

## 1. What Is NPA and Why Does It Exist?

### The Core Purpose

The **New Product Approval (NPA)** process is MBS Bank's gatekeeper function for Global Financial Markets (GFM). It is a mandatory, group-wide governance process that ensures every new financial product, service, or variation is properly assessed for risk before it reaches a client or a trading desk.

In simple terms: **before MBS can trade, sell, or offer any new financial product, it must go through NPA.**

### Why It Matters

Banks trade enormously complex financial instruments — interest rate swaps, FX options, credit default swaps, structured deposits, bond repos, and more. Each carries unique risks:

- **Market risk** — prices can move against the bank
- **Credit risk** — counterparties can default
- **Operational risk** — systems may not handle the product correctly
- **Legal/compliance risk** — regulations may prohibit or restrict the activity
- **Reputational risk** — the product may harm the bank's standing

NPA exists to prevent MBS from launching a product that could cause financial loss, regulatory penalty, or reputational damage. It is not optional — it is mandated by the bank's Risk Management Group and enforced by regulatory expectations (MAS, CFTC, FCA, HKMA, etc.).

### The Policy Framework

NPA is governed by:
- **New Product Approval Policy** — the overarching group policy
- **New Product Approval Standard** (MBS_10_S_0012_GR) — the detailed standard issued by RMG-OR (Risk Management Group — Operational Risk)
- **GFM NPA Standard Operating Procedures** — GFM-specific rules that are *stricter* than the group standard in several areas

**Critical rule:** Where the GFM SOP and the Group Standard differ, the stricter requirement prevails.

---

## 2. The Organizational Landscape

### Key Roles and Personas

The NPA process involves approximately **33+ personas** across **9 organizational tiers**. Here are the most critical:

| Role | Responsibility |
|------|----------------|
| **GFM COO** | Final approving authority. Chairs the Governance Forum. Determines classification when in doubt. Sets timelines. Resolves disputes. |
| **GFM COO Office / NPA Team** | Day-to-day NPA operations. Maintains Evergreen lists, bundling records, tracking sheets. The "engine room." |
| **PU NPA Champion** | Appointed by BU COO. Manages end-to-end NPA due diligence. Main liaison between product teams and sign-off parties. Quality gatekeeper for NPA documentation. |
| **Proposing Unit Lead (Maker)** | The person who writes the NPA. Usually a product specialist from the trading desk (e.g., FX desk, Rates desk, Credit desk). |
| **Checker** | Reviews and validates the NPA before it goes to sign-off parties. Catches errors, gaps, and inconsistencies. |
| **Sign-Off Parties (SOPs)** | Functional experts who assess risk in their domain — Credit, Finance, Legal, MLR, Ops, Tech, Compliance. |
| **Product Approval Committee (PAC)** | Group-level committee required for New-to-Group products. Must approve *before* NPA starts. |
| **NPA Governance Forum** | Escalation body chaired by GFM COO. Handles disputes, circuit breaker escalations, and policy questions. |
| **RMG-OR** | Owns the NPA Standard. Must be notified of deviations. Conducts audits. |

### The GFM COO Ecosystem

NPA is one of seven major functions under the GFM COO umbrella:

1. **Desk Support (ROBO)** — Day-to-day operational support for trading desks
2. **NPA (NPA HOUSE)** — The product approval function (this document)
3. **ORM (RICO)** — Operational Risk Management
4. **Biz Lead/Analysis** — Business analytics and reporting
5. **Strategic PM (BCP)** — Strategic Project Management and Business Continuity
6. **DCE (DEGA 2.0)** — Digital Client Experience
7. **Business Analysis (Decision Intelligence)** — Data-driven decision support

Each function has its own set of processes, champions, and reporting lines. The "Top Asks" from COO leadership show NPA as one of the most complex and high-priority functions, alongside KRI tracking, cross-border attention, and trading anomaly monitoring.

---

## 3. Product Classification — The Foundation of Everything

### The Two-Stage Model

Classification is the single most important decision in the NPA process. It happens in **two stages**, and getting it wrong means the entire downstream process is wrong.

**Stage 1: What IS this product?** (Ontology)
- New-to-Group (NTG)
- Variation
- Existing

**Stage 2: HOW should we approve it?** (Workflow)
- Full NPA (Track A)
- NPA Lite (Track B) — with 4 sub-types
- Bundling Approval (Track C)
- Evergreen (Track D)
- Hard Stop / Prohibited (Track E)

**You cannot do Stage 2 without completing Stage 1.** The approval track depends entirely on what the product is.

### 3.1 New-to-Group (NTG)

**Definition:** Products that have NEVER been approved anywhere in MBS Group, in any entity, in any form, in any location.

**Triggers — ANY of the following makes it NTG:**
- Brand new businesses, initiatives, products, or financial instruments
- New roles within a product group (e.g., going from distribution to principal trading — huge risk shift)
- New distribution channels (e.g., first time offering via mobile app to retail)
- New customer segments (e.g., institutional → retail)
- New exchange memberships (e.g., first time joining SGX for futures)
- New markets/geographies (e.g., first time offering product in Vietnam)

**Mandatory consequences of NTG classification:**
- PAC approval required BEFORE the NPA process even starts
- Must use Full NPA track (never NPA Lite, never Bundling)
- ALL sign-off parties engaged (Credit, Finance, Legal, MLR, Ops, Tech, Compliance)
- PIR mandatory within 6 months of launch
- 1-year validity from approval (extendable once for +6 months)
- For overseas locations: Head Office function sign-offs required

**Real example:** MBS has distributed FX Options to clients as a broker. Now the Hong Kong desk wants to trade FX Options as principal (taking market risk onto MBS's books). Even though FX Options exist in the bank, trading as *principal* is a completely new role → NTG.

### 3.2 Variation

**Definition:** Modification to an existing product that **alters the risk profile** for the customer and/or the bank.

**Triggers — ANY of the following makes it a Variation:**
- Bundling/combination of existing products (e.g., FX Option + Deposit = Dual Currency Deposit)
- Cross-book structures (banking book + trading book)
- Accounting treatment changes (e.g., accrual → mark-to-market)
- Significant offline/manual workarounds required
- Sustainability features or labels (e.g., "Green" bonds, "ESG" loans)
- Advanced/innovative technology solutions (e.g., fintech collaboration)
- New third-party communication channels (e.g., offering via WhatsApp for first time)

**Critical nuance — risk severity determines the track:**
- **High-risk variation** → Full NPA (e.g., accounting change, cross-book, fintech)
- **Medium-risk variation** → NPA Lite (e.g., minor bundling, adding settlement option)
- **Low-risk variation** → NPA Lite Addendum (e.g., typo correction, clarification)

**Consult Group Finance when in doubt about accounting treatment changes.**

### 3.3 Existing

**Definition:** Products already approved somewhere in MBS Group, being introduced to a new location, desk, or entity — or being reactivated after dormancy/expiry.

**Three sub-categories:**
1. **New to location/desk/entity** — FX Option approved in Singapore, now Hong Kong wants it
2. **Dormant** — No transactions booked in the last 12 months
3. **Expired** — Approved but not launched within the validity period

**Existing products have the most complex routing logic:**
- Active + on Evergreen list → Evergreen (trade same day)
- Active + NOT on Evergreen list → NPA Lite - Reference Existing
- Dormant < 3 years + meets fast-track criteria → Fast-Track Dormant Reactivation (48 hours)
- Dormant < 3 years + variations detected → NPA Lite
- Dormant ≥ 3 years → Escalate to GFM COO (may need Full NPA)
- Expired + no variations → NPA Lite - Reactivation
- Expired + variations detected → Full NPA (treated as effectively NTG)

### What Is Excluded from NPA

The following do NOT require NPA:
- Organizational structure changes (no product change)
- New system implementations with no product change
- Process re-engineering not triggered by new product
- New legal entities (covered by separate governance)

---

## 4. Approval Tracks — Five Pathways Through the System

### Track A: Full NPA — The Heavy Lifter

**When:** All NTG products. High-risk Variations. Expired products with variations. Significant regulatory implications.

**Process:** Discovery → Review (Maker/Checker) → Sign-Off (parallel, all SOPs) → Launch Prep (system config, UAT) → Launch → PIR/Monitoring

**All sign-off parties required:** Credit, Finance, Legal & Compliance, MLR, Operations, Technology, Operational Risk (consultative)

**Timeline:** Currently averages 12 days. Target with process improvement: 4 days.

### Track B: NPA Lite — The Agile Track (4 Sub-Types)

#### B1: Impending Deal (48-Hour Express Approval)
- Back-to-back deal with professional counterparty
- OR dormant/expired product with UAT completed
- OR Singapore-approved NPA applicable regionally on BTB basis
- 48-hour notice period to all SOPs
- If ANY SOP objects → Falls back to standard NPA Lite
- If no objections after 48 hours → Auto-approved

#### B2: NLNOC (NPA Lite No Objection Concurrence)
- Simple change to payoff of approved product
- Reactivation of dormant/expired NPA with no structural changes
- Decision by GFM COO + Head of RMG-MLR jointly
- SOPs provide "no-objection concurrence" (lighter than full sign-off)
- Timeline: Typically 5-10 days

#### B3: Fast-Track Dormant Reactivation
- Existing live trade in the past
- NOT on prohibited list
- PIR completed for original NPA
- No variation or changes in booking
- 48-hour no-objection notice → auto-approval

#### B4: Approved NPA Addendum
- Minor/incremental updates to **live** (not expired) NPA only
- Examples: adding cash settlement, bilateral → tripartite, typo fixes
- NOT eligible for new features or new payoffs
- Original NPA reference kept intact (same GFM ID)
- Validity period NOT extended (maintains original expiry)
- Target: < 5 days

### Track C: Bundling Approval — The LEGO Master

Combining 2+ already-approved "building blocks" into a new structure.

See [Section 8: Bundling](#8-bundling) for full details.

### Track D: Evergreen — The Fast Pass

Standard vanilla products "always on" for 3 years.

See [Section 9: Evergreen Products](#9-evergreen-products) for full details.

### Track E: Hard Stop — Prohibited

Products or jurisdictions explicitly banned by policy or regulation. Immediate workflow termination. No exceptions without Compliance/EVP review.

Three prohibition layers:
1. **Internal bank policy** — Products MBS has decided not to offer (risk appetite, reputational)
2. **Regulatory restrictions** — MAS, CFTC, FCA, local regulators
3. **Sanctions/embargoes** — OFAC, UN, EU (zero tolerance, criminal liability)

---

## 5. The Full NPA Lifecycle — Stage by Stage

### Stage 1: Product Development & Business Case

- Proposing unit holds discussions with relevant SOPs for mutual understanding
- Product ideation and early engagement
- Prepare business case (rationale, costs, benefits, key risks, mitigants)
- **If NTG:** Must submit to PAC for approval BEFORE NPA starts
- PAC is a Group requirement; locations can form local forums but Group PAC approval is mandatory for NTG

### Stage 2: The NPA Process Itself

**Initiation:**
- Classify the product (NTG / Variation / Existing)
- Engage Group BU/SU COO when in doubt
- Organize kick-off meeting with all relevant SOPs
- Agree on timeline for due diligence and sign-off
- If cross-border: Finance, Credit, MLR, Tech, Ops sign-offs are mandatory

**Review and Sign-Off:**
- Level of due diligence depends on product type and risk
- SOPs evaluate all potential risks including reputational
- SOPs can set:
  - **Permanent restrictions** (incorporated into product features)
  - **Product parameters** (scope of permissible activity, e.g., specific client segment only)
  - **Post-launch conditions** (short-term, measurable, to be addressed after launch)
- NTG from overseas locations: Head Office function sign-offs required
- Non-NTG in core markets: Group SU Heads appoint location sign-off party
- Non-NTG in international centres: Group SU Heads may appoint location or head office party

**Approval:**
- Group BU/SU COO (or delegated party) gives final approval to launch
- For overseas-initiated NPA/NPA Lite: local approval obtained first per local regulations, then Group COO approval

### Stage 3: Regulatory Clearance & UAT

- Separate from NPA process but can run in parallel
- Issues identified during regulatory clearance/UAT must be addressed before launch
- Re-approvals from relevant SOPs if needed based on findings

### Stage 4: Launch

- First marketed sale/offer OR first trade (not just indication of interest)
- Must occur within validity period

### Stage 5: Post-Implementation Review (PIR)

- Mandatory for ALL NTG products (even without conditions)
- Mandatory for ALL products with post-launch conditions
- GFM stricter rule: mandatory for ALL launched products regardless of type
- Must be initiated within 6 months of launch
- See [Section 11: PIR](#11-post-implementation-review) for full details

---

## 6. Sign-Off Parties (SOPs) — Who Approves What

### The Seven Core Sign-Off Parties

| SOP | What They Assess | Key Concerns |
|-----|-----------------|--------------|
| **RMG-Credit** | Credit risk, counterparty risk, country risk, concentration risk | Who is the counterparty? What's their rating? Is there collateral? Pre-settlement exposure? |
| **Finance (Group Product Control)** | Accounting treatment, P&L recognition, capital impact, ROAE | How do we book this? Trading book or banking book? What's the capital consumption? |
| **Legal & Compliance** | Regulatory compliance, legal documentation, sanctions, financial crime | Is this permitted? What license do we need? ISDA/GMRA in place? AML/CFT implications? |
| **RMG-MLR (Market & Liquidity Risk)** | Market risk factors, VaR, stress testing, liquidity risk, LCR/NSFR | IR Delta/Vega? FX exposure? Can we hedge it? What happens under stress? |
| **Operations (GFMO)** | Operating model, booking process, settlement, manual processes | Can our systems handle this? Is settlement straight-through? Any manual workarounds? |
| **Technology** | System configuration, UAT, booking systems (Murex/Mini/FA) | Does Murex support this? Do we need new system development? What's the UAT plan? |
| **RMG-OR (Operational Risk)** | Overall operational risk, process risk, conducts audit oversight | Consultative role. Owns the NPA Standard. Reviews for completeness. |

### Cross-Border Mandatory SOPs

When a product involves cross-border booking (e.g., Singapore desk trading with Hong Kong entity), the following 5 sign-offs become **mandatory and cannot be waived**, even for NPA Lite:
- Finance (Group Product Control)
- RMG-Credit
- RMG-MLR
- Technology
- Operations

### Sign-Off Authority Levels

- **NTG from overseas:** Head Office function sign-offs required
- **Non-NTG in core markets:** Location-level sign-off party (appointed by Group SU Head)
- **Non-NTG in international centres:** Location or Head Office (Group SU Head's discretion)

### The Maker-Checker Model

- **Maker** (Proposing Unit Lead): Writes the NPA document, fills in all sections, gathers supporting documentation
- **Checker** (PU NPA Champion or designated reviewer): Reviews for completeness, accuracy, consistency. Can approve, reject, or request changes
- If Checker rejects → Loop-back to Maker (adds 3-5 days per iteration)

---

## 7. Cross-Border Booking — The Mandatory Override

### What Constitutes Cross-Border

- Singapore desk trades with Hong Kong entity
- London desk books deal in Singapore books
- Any product where execution/booking/settlement spans multiple jurisdictions

### Why It's Treated Specially

Cross-border introduces:
- Multiple regulatory regimes (MAS + HKMA, or FCA + MAS, etc.)
- Transfer pricing and tax implications
- Dual booking requirements
- Different legal documentation standards
- Potential for regulatory arbitrage concerns

### The Override Rule (Section 2.3.2 of the Standard)

> "For NPA/NPA Lite which involves cross border booking, the relevant sign-off parties **must** include Finance, RMG-Credit, RMG-Market & Liquidity Risk (MLR), Technology and Operations."

This is NON-NEGOTIABLE. Even if the product qualifies for NPA Lite, these 5 sign-offs are mandatory.

---

## 8. Bundling — Combining Approved Building Blocks

### The Concept

A **bundle** is a combination of two or more individually approved products ("building blocks") packaged into a single structure for the client. The key distinction: the legal confirmation to the client is one document, but internally it may be booked as multiple separate deals.

**Example:** A Dual Currency Deposit = FX Option (Block 1) + Fixed Deposit (Block 2). The client sees one product. Internally, it's two bookings.

### The 8 Bundling Conditions (ALL Must Pass)

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

**If ALL pass** → Bundling Approval (via Arbitration Team)
**If ANY fail** → Must go through Full NPA or NPA Lite instead

### The Bundling Arbitration Team

- Head of GFM COO Office NPA Team
- RMG-MLR
- TCRM (Technology & Credit Risk Management)
- Finance-GPC (Group Product Control)
- GFMO (GFM Operations)
- GFM Legal & Compliance

### Evergreen Bundles (No Approval Needed)

Certain standard bundles are pre-approved and don't need Bundling Approval:
- Dual Currency Deposit/Notes (FX Option + LNBR/Deposit/Bond)
- Treasury Investment Asset Swap (Bond + IRS)
- Equity-Linked Note (Equity Option + LNBR)

### Approved FX Derivative Bundles

28+ pre-approved FX bundles exist, including:
- Best/Worst of Option
- KIKO (Knock-In Knock-Out) CLI
- Boosted KO Forward with Guarantee
- Multi-period EKI Strangle
- Pivot Forward, Trigger Forward
- Range Coupon CCY Linked SIP

Full list maintained in "List of approved FX Bundled products.xlsx" by GFM COO Office.

---

## 9. Evergreen Products — The Fast Pass

### What Evergreen Means

Evergreen products are standard, vanilla products that are "always on" for **3 years** (vs. the normal 1-year validity). They allow desks to trade immediately without waiting for a new NPA, within pre-set limits.

### Why Evergreen Exists

- Avoids constant NPA renewals for vanilla products that must be continuously offered
- Reduces NPA Working Group workload dramatically
- Enables competitive responsiveness (trade same day vs. wait weeks for approval)

### Eligibility Criteria (General Guidelines)

1. No significant changes since last approval
2. Back-to-Back (BTB) basis with professional counterparty
3. Vanilla/foundational product (building block for other variants)
4. Liquidity management product (including for MBS Group Holdings)
5. Exchange product used as hedge against customer trades
6. ABS origination to meet client demand

### What's NOT Eligible for Evergreen

- Products requiring deal-by-deal approval
- Products dormant/expired for > 3 years
- Joint-unit NPAs (Evergreen is GFM-only)

### Evergreen Limits (GFM-Wide)

| Limit Type | Amount |
|------------|--------|
| **Total Notional** (aggregated GFM-wide) | USD $500,000,000 |
| **Long Tenor (>10Y) Notional** (sub-limit) | USD $250,000,000 |
| **Non-Retail Deal Cap** (per NPA) | 10 deals |
| **Retail Deal Cap** (per NPA) | 20 deals |
| **Retail Transaction Size** (per trade) | USD $25,000,000 |
| **Retail Aggregate Notional** (sub-limit) | USD $100,000,000 |

**Special exemption:** Liquidity management products have notional and trade count caps **WAIVED** due to exigency.

**Counting rules:** Only the customer leg counts (BTB/hedge leg excluded). Bond issuance deal count = tranche count = client-facing deals.

### How Evergreen Trading Works in Practice

1. Sales/Trader executes the deal with the client
2. **IMMEDIATELY** (within 30 min) email GFM COD SG – COE NPA with deal details
3. SG NPA Team updates Evergreen limits worksheet (chalk usage)
4. Location COO Office confirms within 30 minutes (sanity check)
5. Initiate NPA Lite reactivation in parallel
6. When NPA Lite approved → Uplift (restore) Evergreen limits

### Evergreen Validity and Annual Review

- **3 years** from approval date (GFM deviation approved 21-Feb-2023)
- Annual review required by NPA Working Group
- Products dormant > 3 years at review time → removed from Evergreen list
- Products reactivated via NPA Lite maintain Evergreen status for:
  - NPA approval date + 3 years, OR
  - Last transaction date during NPA validity + 3 years

---

## 10. Validity, Extensions, and Expiration

### Standard Validity

- **Full NPA / NPA Lite:** 1 year from approval date
- **Evergreen:** 3 years from approval date

### Extension Rules (One-Time Only)

An approved NPA can be extended **once** for +6 months (total maximum: 18 months).

**Requirements for extension:**
- No variation to product features
- No alteration to risk profile
- No change to operating model
- **Unanimous consensus** from ALL original sign-off parties
- Approval from Group BU/SU COO

If any SOP disagrees → extension denied.

### What Happens When NPA Expires

If a product is not launched within the validity period:
- The NPA expires and the product CANNOT be traded
- To reactivate: Proposing unit must engage Group BU/SU COO on NPA requirements
- If no variations: NPA Lite - Reactivation track
- If variations exist: Full NPA (treated as new)

### Launch Definition

"Launch" means either:
- The date the product is first marketed and results in a sale/offer, OR
- The first trade of the product

An indication of interest to a customer does NOT count as launch.

---

## 11. Post-Implementation Review (PIR)

### When PIR Is Mandatory

1. **ALL New-to-Group products** (even without post-launch conditions)
2. **ALL products with post-launch conditions** imposed by SOPs
3. **GFM stricter rule:** ALL launched products (regardless of classification)
4. **Reactivated NTG products** (products that expired and were re-approved)

### Timeline

- Must be **initiated within 6 months** of product launch
- Reminders typically at Launch + 120 days, + 150 days, + 173 days (URGENT)

### Purpose of PIR

1. Confirm requirements documented in NPA are being adhered to in practice
2. Address issues not identified or anticipated before launch
3. Ensure all post-launch conditions imposed by SOPs have been satisfied
4. Assess actual performance vs. original projections
5. Capture lessons learned for future NPAs

### PIR Sign-Off Requirements

- All original SOPs who imposed post-launch conditions
- For NTG products: ALL original SOPs (even if they didn't impose conditions)
- Group Audit includes new products in audit risk assessment and may conduct its own PIR

### PIR Repeat Logic

If SOPs identify issues during PIR, or if variations were not fully tested:
- PIR must be repeated
- New PIR scheduled (typically 90 days after failed PIR)
- Process continues until SOPs are satisfied

---

## 12. Loop-Backs, Rework, and the Circuit Breaker

### The Four Types of Loop-Back

**Type 1: Checker Rejection (Major Loop-Back)**
- Maker submits → Checker reviews → REJECTS
- Loop-back to Maker (Draft stage)
- Maker fixes → re-submits → Checker reviews again
- Impact: +3-5 days per iteration
- Current average: 1.4 iterations per NPA

**Type 2: Approval Clarification (Smart Loop-Back)**
- Credit Approver reviews → needs clarification
- If clarification requires NPA document changes → loop-back to Maker
- If clarification answerable from existing docs → direct response (no loop-back)
- Time saved by smart routing: ~2-3 days per clarification

**Type 3: Launch Preparation Issues**
- During system config/UAT → issue discovered → needs SOP re-review
- Loop-back to Sign-Off Stage (specific SOP only, not all)
- Typical causes: system compatibility, regulatory requirement changes, risk threshold breaches

**Type 4: Post-Launch Corrective Action**
- After launch → PIR identifies issue → requires NPA amendment
- Loop-back to Review Stage (expedited re-approval)
- Causes: volume below projections, unexpected operational issues, customer feedback, regulatory findings

### The Circuit Breaker Rule

**Trigger:** After **3 loop-backs** on the same NPA

**Action:** Automatic escalation to:
- Group BU/SU COO
- NPA Governance Forum

**Rationale:** 3 loop-backs indicate a fundamental problem — unclear requirements, complex edge case, or process breakdown that needs senior intervention.

### Current Loop-Back Metrics

- Loop-backs per month: **8**
- Average rework iterations per NPA: **1.4**
- Escalations due to circuit breaker: ~1 per month

---

## 13. The NPA Document — What Gets Written

### Document Structure (47 Fields)

The NPA document follows a standardized template (RMG OR Version Jun 2025):

**Part A: Basic Product Information**
- Product/Service Name
- Business Units Covered
- Product Manager and Group Head details
- Business Case Approval Status
- NPA or NPA Lite classification
- Kick-off Meeting Date

**Part B: Sign-Off Parties**
- All required SOPs listed
- Each SOP's sign-off status tracked

**Part C: Detailed Product Information (7 Sections)**

**Section I — Product Specifications:**
- Description (purpose, rationale, value proposition)
- Scope and Parameters (role of proposing unit, features, lifecycle)
- Expected Volume and Revenue (market size, projections, revenue)
- Business Model (cost drivers, revenue drivers, typical expenses)
- Target Customer (segments, restrictions, geography, risk appetite)
- Commercialization Approach (channels, suitability, marketing, training)

**Section II — Operational & Technology Information:**
- Operating Model (end-to-end flow charts, party responsibilities)
- Booking Process (system handling, cross-border considerations)
- Operational Procedures (capability assessment for new products/currencies)
- Limit Structure (Group, Location, Operational levels)
- Manual Processes (any manual interventions documented)
- Business Continuity Management (BIA, BCP, RTO/RPO)

**Section III — Pricing Model Details:**
- Model validation requirements and dates
- SIMM treatment
- Model names and validation status

**Section IV — Risk Analysis:**
- A. Operational Risk: Legal/Compliance, Financial Crime, Finance/Tax
- B. Market & Liquidity Risk: IR/FX/EQ Delta/Vega, CS01, VaR, LCR/NSFR, HQLA
- C. Credit Risk: Counterparty, country, concentration, collateral, PCE, SACCR
- D. Reputational Risk: ESG assessment, step-in risk, regulatory exposure

**Section V — Data Management:**
- Design for Data (D4D) requirements
- PURE principles assessment
- Risk Data Aggregation and Reporting compliance

**Section VI — Other Risk Identification:**
- Any risks not covered in standard sections

**Section VII — Trading Products Specific Information:**
- Collateral and pledged assets
- Valuation models and funding
- Booking schemas and portfolio mappings

**Appendices:**
- Appendix I: Bundling Approval Form
- Appendix III: ROAE Sensitivity Analysis
- Appendix VII: Evergreen FAQ/Checklist

### Notional Thresholds and Escalation Levels

| Notional Value | Additional Requirement |
|---------------|----------------------|
| > $20M | ROAE sensitivity analysis required |
| > $50M | Finance VP review required |
| > $100M | CFO review required |

---

## 14. Real NPA Examples — Lessons from the Field

### TSG1917: Exchange-Listed IR Options (NPA Lite / No NPA Required)

- **Product:** US Exchange-listed Interest Rate Futures and Options
- **Classification:** Existing (grandfathered product with T&M HK precedent)
- **Track:** No NPA Required
- **Key Features:** Model validation already completed, Murex infrastructure in place
- **Lesson:** When a product has clear precedent and no variations, the system can route to the lightest possible track

### TSG2042: NAFMII Repo Agreement (Full NPA)

- **Product:** Pledged Bond Repo in China Interbank Bond Market (CIBM)
- **Classification:** New-to-Group (new legal framework, new market)
- **Track:** Full NPA
- **Complexity:**
  - New legal framework (NAFMII vs traditional GMRA)
  - Cross-border settlement via MBS China and ABOC
  - Restricted currency handling (CNY/CNH)
  - Chinese withholding tax and VAT implications
  - Daily trade volume: RMB 4 billion in a RMB 4 trillion market
- **Lesson:** Products involving new jurisdictions and legal frameworks always go Full NPA, regardless of how "vanilla" the underlying instrument might be

### TSG2055: ETF Subscription (Deal-Specific Approval)

- **Product:** Nikko AM-ICBC SG China Bond ETF subscription
- **Classification:** Deal-specific
- **Lesson:** Some products require individual deal approval rather than standing NPA

### TSG2339: Swap Connect (Full NPA)

- **Product:** Interest Rate Swaps via Swap Connect platform (cross-border Hong Kong ↔ China)
- **Booking:** IRD|IRS|Vanilla typology with CNH 7DREPO 3M SWAPCON generator
- **Portfolio:** MBSSG AMM BCB1 mapped for margin requirements
- **Legal:** ISDA with novation to HKEx OTC Clear
- **Lesson:** Infrastructure market access products (like Swap Connect) require Full NPA because they change the operational model fundamentally, even if IRS itself is an existing product

### TSG2543: Complex Structured Product

- **Product:** Complex structured product across multiple asset classes
- **Lesson:** Multi-asset products trigger multiple SOP reviews and tend to have the longest timelines

### Common Patterns Across Real NPAs

1. **Booking schema matters enormously** — Murex typology, portfolio mapping, and generator specifications are scrutinized in every NPA
2. **Legal documentation is a frequent bottleneck** — ISDA, GMRA, NAFMII agreements take time
3. **Cross-border products always add complexity** — at minimum +5 mandatory sign-offs
4. **Tax considerations are often underestimated** — withholding tax, VAT, transfer pricing
5. **PIR conditions are common** — most Full NPAs launch with at least 1-2 post-launch conditions

---

## 15. The COO Ecosystem — Where NPA Fits in the Bigger Picture

### The "Top Asks" from COO Leadership

Based on the visual task matrices, the most critical priorities across the GFM COO functions are:

**COE (Centre of Excellence):**
- Trader Profile (mandates, limits, portfolio access)
- **NPA Status Report** (tracking effectiveness, performance monitoring)
- Cross-border attention (Mandate oversight for follow-up and action)
- Transaction Anomalies (consolidating from Trade Analytics, Murex, GPC control)

**SG Op Risk:**
- KRI Tracking (annual & monthly KRIs, GRC trigger and collation)
- I&A tracking with reminders (track live usage)
- Timeliness of trade input monitoring

**SG BMO:**
- Sales documentation maintenance (Board resolution, mandate agreements)
- MYR reporting for BNM (weekly bank reporting)
- Detect Dormant DCE accounts (monthly, track 12 consecutive months)

**Regional COO:**
- G&E process automation and policy retrieval via ESB
- Process Governance heatmap & workflow across all regional control measures
- Regional Dashboard to track actionable items

**App/Vendor & Others:**
- Interco recon dashboard (track across all desks till breaks hit zero)
- External Platform Review
- Revenue Dashboard (cross-border / within region)
- MX Access Review

**Strategy & Planning:**
- Risk & Controls KPIs Data Collection (sort as part of Risk and Control KPI across all GFM OPs departments)
- Market Making Platform Review

### Governance Themes

The Legend tables reveal the breadth of COO governance across 5+ process themes:

1. **Onboarding/Offboarding** — Staff onboarding, regional dashboards, actionable items tracking
2. **Governance** — Singapore GFM working guide, trader mandates, block leave monitoring, Annual KRIs, desk location strategy, NPA/PIR tracking, algo annual review, capital (QCCP)
3. **Controls** — Trade input monitoring, transaction anomalies, DW1 nonsisance, portfolio ownership review, internal deals, market making platform reviews, FX Global Code, pre-trade checks, trade option deal checks
4. **MIS/Finance** — Global & Regional revenue dashboards, selldown process, IM-Clearing fees
5. **Gifts, Entertainment & Sponsorships** — Quarterly G&E review, cross-border travel monitoring

### Key Insight

NPA is not an isolated process. It sits at the intersection of:
- **Product governance** (what we're allowed to trade)
- **Risk management** (how we control exposure)
- **Regulatory compliance** (what regulators require)
- **Operational readiness** (whether systems can handle it)
- **Financial control** (how we account for and report it)

Every other COO function either feeds into NPA (trader profiles, mandates, compliance checks) or depends on NPA output (monitoring, KRI tracking, dormant account detection).

---

## 16. Current Pain Points

### Quantified Challenges

| Metric | Current State | Impact |
|--------|--------------|--------|
| Average NPA processing time | **12 days** | Delays product launch, competitive disadvantage |
| First-time approval rate | **52%** | Nearly half of all NPAs require rework |
| Average rework iterations | **1.4** | Extra 3-5 days per rework cycle |
| Loop-backs per month | **8** | Significant resource drain across SOPs |
| Straight-through processing | **0%** | Every NPA requires manual intervention |
| Manual form completion time | **60-90 minutes** | High burden on Makers |
| Manual classification time | **15-20 minutes** | Relies on NPA Champion expertise |

### Qualitative Pain Points

1. **Classification ambiguity** — Makers often don't know if their product is NTG, Variation, or Existing. They classify wrong → routed to wrong track → rework.

2. **Incomplete submissions** — 48% of NPAs are missing information on first submission, triggering Checker rejection loop-backs.

3. **SOP bottlenecks** — Some SOPs (particularly Finance and Legal) have long review queues. Parallel sign-off helps but doesn't eliminate wait times.

4. **Institutional knowledge dependency** — Experienced NPA Champions carry critical knowledge in their heads. When they're unavailable, classification quality drops.

5. **Historical NPA visibility** — Makers often don't know that a similar NPA was approved 6 months ago by another desk. They start from scratch instead of referencing existing work.

6. **Evergreen limit tracking** — Done manually in Excel worksheets. Risk of limit breaches when multiple desks trade simultaneously.

7. **PIR follow-up** — PIR deadlines are tracked manually. Easy to miss the 6-month window.

8. **Loop-back frustration** — Makers feel the process is adversarial. Each rejection adds days and requires re-engagement with SOPs who have other priorities.

---

## 17. Key Metrics — Baseline Performance

### Current State (Baseline)

| Metric | Value |
|--------|-------|
| NPAs processed (last 30 days) | 47 |
| Average processing time | 12 days |
| First-time approval rate | 52% |
| Average rework iterations | 1.4 |
| Loop-backs per month | 8 |
| Straight-through processing | 0% |
| Manual form time | 60-90 min |
| Manual classification time | 15-20 min |
| Circuit breaker escalations | ~1/month |

### Improvement Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Processing time | 12 days | 4 days | 67% reduction |
| First-time approval rate | 52% | 75% | +23 percentage points |
| Rework iterations | 1.4 | 1.2 | 14% reduction |
| Loop-backs/month | 8 | 5 | 38% reduction |
| Straight-through processing | 0% | 35% | For Evergreen products |
| Form completion time | 60-90 min | 15-20 min | 78% reduction |

### Timeline Breakdown (Full NPA)

| Stage | Current Average | Bottleneck |
|-------|----------------|------------|
| Review (Maker/Checker) | 2-3 days | Incomplete submissions |
| Sign-Off (parallel) | 6-8 days | Finance: 1.8d, Credit: 1.2d, Legal: 1.1d |
| Launch Prep | 2-3 days | System config, UAT |
| **Total** | **12 days** | — |

---

## 18. Glossary of Terms

| Term | Definition |
|------|-----------|
| **NPA** | New Product Approval — the governance process for approving new products |
| **NTG** | New-to-Group — product never approved anywhere in MBS Group |
| **GFM** | Global Financial Markets — the trading/markets division of MBS |
| **PAC** | Product Approval Committee — Group-level committee for NTG products |
| **PIR** | Post-Implementation Review — mandatory review after product launch |
| **SOP** | Sign-Off Party — functional expert who reviews NPA in their domain |
| **PU** | Proposing Unit — the business unit proposing the new product |
| **NPA Champion** | Appointed liaison managing end-to-end NPA due diligence |
| **Maker** | The person who writes/fills the NPA document |
| **Checker** | The person who reviews/validates the NPA before sign-off |
| **GFM COO** | Chief Operating Officer of Global Financial Markets — final approver |
| **RMG-OR** | Risk Management Group — Operational Risk (owns NPA Standard) |
| **RMG-MLR** | Risk Management Group — Market & Liquidity Risk |
| **RMG-Credit** | Risk Management Group — Credit Risk |
| **GPC** | Group Product Control (Finance function) |
| **GFMO** | GFM Operations |
| **LCS** | Legal, Compliance & Secretariat |
| **MAS** | Monetary Authority of Singapore |
| **OFAC** | Office of Foreign Assets Control (US Treasury) |
| **CFTC** | Commodity Futures Trading Commission (US derivatives regulator) |
| **FCA** | Financial Conduct Authority (UK regulator) |
| **HKMA** | Hong Kong Monetary Authority |
| **BTB** | Back-to-Back (hedging arrangement) |
| **Murex** | Primary trading/booking system used by GFM |
| **ISDA** | International Swaps and Derivatives Association (legal framework) |
| **GMRA** | Global Master Repurchase Agreement |
| **NAFMII** | National Association of Financial Market Institutional Investors (China) |
| **ROAE** | Return on Average Equity |
| **VaR** | Value at Risk |
| **LCR** | Liquidity Coverage Ratio |
| **NSFR** | Net Stable Funding Ratio |
| **HQLA** | High-Quality Liquid Assets |
| **PCE** | Pre-settlement Credit Exposure |
| **SACCR** | Standardized Approach Counterparty Credit Risk |
| **SIMM** | Standardized Initial Margin Model |
| **UAT** | User Acceptance Testing |
| **BIA** | Business Impact Analysis |
| **BCP** | Business Continuity Plan |
| **NLNOC** | NPA Lite No Objection Concurrence |
| **SDN** | Specially Designated Nationals (OFAC sanctions list) |
| **D4D** | Design for Data |
| **ESG** | Environmental, Social, and Governance |
| **SCF** | Structured Credit Financing |
| **DCD** | Dual Currency Deposit |
| **KIKO** | Knock-In Knock-Out (option type) |
| **IRS** | Interest Rate Swap |
| **CDS** | Credit Default Swap |
| **ETF** | Exchange-Traded Fund |
| **ABS** | Asset-Backed Securities |
| **LNBR** | Leveraged Note/Bond/Repo |
| **CN1** | Restricted onshore Chinese Yuan currency code |
| **CIBM** | China Interbank Bond Market |

---

## Summary: The 10 Things You Must Know About NPA

1. **Classification drives everything.** NTG → Full NPA (always). Variation → depends on risk severity. Existing → depends on status (active/dormant/expired) and Evergreen eligibility.

2. **The GFM COO is the ultimate authority.** They classify when in doubt, approve all NPAs, chair the Governance Forum, and resolve disputes.

3. **Cross-border is a hard override.** 5 mandatory sign-offs (Finance, Credit, MLR, Tech, Ops) cannot be waived regardless of approval track.

4. **Prohibited products are an immediate hard stop.** Three layers: internal policy, regulatory, and sanctions. Zero tolerance for sanctions violations.

5. **Bundling has 8 conditions.** All must pass. Failure on any one condition routes to Full NPA or NPA Lite instead.

6. **Evergreen is the competitive advantage.** 3-year validity, trade same day, $500M notional cap. But limit tracking is currently manual and error-prone.

7. **PIR is non-negotiable for NTG.** Within 6 months of launch, mandatory for all NTG products. GFM extends this to ALL launched products.

8. **The circuit breaker exists.** 3 loop-backs → auto-escalate to COO/Governance Forum. Indicates fundamental problem.

9. **52% first-time approval rate is the biggest pain point.** Nearly half of all NPAs need rework. This is where the most time and frustration is wasted.

10. **1,784+ historical NPAs exist.** Most new products are variations of something already done. The knowledge exists in the system — it's just not easily accessible to Makers.

---

*End of Report*
